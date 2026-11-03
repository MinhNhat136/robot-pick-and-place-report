"""Extract what GR00T's "understanding" part (the VLM backbone) produces, for the II.01 feature map.

Run ON THE GPU SERVER, inside the Isaac-GR00T checkout (it needs torch, the gr00t package and the
fine-tuned checkpoint). Nothing is trained or changed; the model only runs forward passes.

For a few episodes of each fruit in the 4-fruit LeRobot dataset it takes the first frame and feeds
the model that image with
  * the episode's own instruction            (kind = "own")
  * the instructions of the 3 other fruits   (kind = "swap": same picture, different command)
and records the backbone output (mean over image tokens, over text tokens, and over all tokens).
The vectors are reduced to 3 dimensions with PCA here, so the output file stays a few KB.

Example (on pet-poc-gpu-vm):
    cd /root/shimizu/Isaac-GR00T
    uv run python /path/to/extract_vlm_features.py \
        --model-path <g1_fruits_n17/checkpoint-20000> \
        --dataset-path <LeRobot dataset of the 4 fruits used for fine-tuning> \
        --modality-config-path <g1_dex3_joint_sim_config.py> \
        --episodes-per-fruit 8 --out vlm_features.json

Then copy vlm_features.json back to report/data/ (tools/make_vlm_map.py turns it into data/vlm_map.js).
"""

from __future__ import annotations

import argparse
from copy import deepcopy
import importlib
import json
from pathlib import Path
import sys

import numpy as np
import torch

from gr00t.data.dataset.lerobot_episode_loader import LeRobotEpisodeLoader
from gr00t.data.dataset.sharded_single_step_dataset import extract_step_data
from gr00t.data.embodiment_tags import EmbodimentTag
from gr00t.policy.gr00t_policy import Gr00tPolicy

FRUITS = {  # word in the instruction -> key used by the report
    "apple": "apple",
    "pear": "pear",
    "grapes": "grapes",
    "starfruit": "starfruit",
}


def fruit_of(text: str) -> str | None:
    t = text.lower()
    return next((k for w, k in FRUITS.items() if w in t), None)


def parse_observation(obs: dict, modality_configs: dict) -> dict:
    """Same batching as gr00t/eval/open_loop_eval.py::parse_observation_gr00t."""
    new_obs = {}
    for modality in ["video", "state", "language"]:
        new_obs[modality] = {}
        for key in modality_configs[modality].modality_keys:
            arr = obs[key if modality == "language" else f"{modality}.{key}"]
            new_obs[modality][key] = [[arr]] if isinstance(arr, str) else arr[None, :]
    return new_obs


def pca(X: np.ndarray, k: int = 3) -> tuple[np.ndarray, list[float]]:
    Xc = X - X.mean(0, keepdims=True)
    U, S, _ = np.linalg.svd(Xc, full_matrices=False)
    var = (S**2) / (S**2).sum()
    return U[:, :k] * S[:k], [float(v) for v in var[:k]]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model-path", required=True)
    ap.add_argument("--dataset-path", required=True)
    ap.add_argument("--modality-config-path", required=True, help=".py file that registers the NEW_EMBODIMENT config")
    ap.add_argument("--embodiment-tag", default="NEW_EMBODIMENT")
    ap.add_argument("--episodes-per-fruit", type=int, default=8)
    ap.add_argument("--frame", type=int, default=0, help="frame index used in each episode")
    ap.add_argument("--out", default="vlm_features.json")
    args = ap.parse_args()

    cfg = Path(args.modality_config_path)
    sys.path.append(str(cfg.parent))
    importlib.import_module(cfg.stem)  # registers the modality config as a side effect

    tag = EmbodimentTag.resolve(args.embodiment_tag)
    policy = Gr00tPolicy(embodiment_tag=tag, model_path=args.model_path,
                         device="cuda" if torch.cuda.is_available() else "cpu")
    modality = policy.get_modality_config()
    loader = LeRobotEpisodeLoader(dataset_path=args.dataset_path, modality_configs=modality,
                                  video_backend="torchcodec", video_backend_kwargs=None)
    lang_key = modality["language"].modality_keys[0]
    step_cfg = deepcopy(modality)
    step_cfg.pop("action")

    captured: dict = {}

    def hook(_module, _inp, out):  # backbone returns BatchFeature(backbone_features, masks)
        f = out["backbone_features"].float()[0]
        att = out["backbone_attention_mask"][0].bool()
        img = out["image_mask"][0].bool() & att
        txt = (~out["image_mask"][0].bool()) & att
        captured["all"] = f[att].mean(0).cpu().numpy()
        captured["image"] = f[img].mean(0).cpu().numpy()
        captured["text"] = f[txt].mean(0).cpu().numpy()

    handle = policy.model.backbone.register_forward_hook(hook)

    # pick episodes per fruit (first N of each instruction found in the dataset)
    picked: dict[str, list[tuple[int, str]]] = {k: [] for k in FRUITS.values()}
    commands: dict[str, str] = {}
    for ep in range(len(loader)):
        traj = loader[ep]
        dp = extract_step_data(traj, args.frame, step_cfg, tag)
        f = fruit_of(dp.text)
        if f is None or len(picked[f]) >= args.episodes_per_fruit:
            continue
        picked[f].append((ep, dp.text))
        commands.setdefault(f, dp.text)
        if all(len(v) >= args.episodes_per_fruit for v in picked.values()):
            break
    print("episodes:", {k: [e for e, _ in v] for k, v in picked.items()})
    print("commands:", commands)

    rows, vecs = [], {"all": [], "image": [], "text": []}
    for fruit, eps in picked.items():
        for ep, own_text in eps:
            dp = extract_step_data(loader[ep], args.frame, step_cfg, tag)
            base = {f"state.{k}": v for k, v in dp.states.items()}
            base.update({f"video.{k}": np.array(v) for k, v in dp.images.items()})
            for cmd_fruit, cmd in commands.items():
                obs = dict(base)
                obs[lang_key] = cmd
                policy.get_action(parse_observation(obs, modality))
                for k in vecs:
                    vecs[k].append(captured[k])
                rows.append({"episode": ep, "scene_fruit": fruit, "command_fruit": cmd_fruit,
                             "kind": "own" if cmd_fruit == fruit else "swap", "command": cmd})
    handle.remove()

    out = {"model_path": args.model_path, "dataset_path": args.dataset_path, "frame": args.frame,
           "dim": int(len(vecs["all"][0])), "rows": rows, "pca": {}}
    for k, v in vecs.items():
        P, var = pca(np.stack(v))
        out["pca"][k] = {"explained": var, "points": [[round(float(x), 4) for x in p] for p in P]}
    Path(args.out).write_text(json.dumps(out, ensure_ascii=False))
    print(f"wrote {args.out}: {len(rows)} forward passes, feature dim {out['dim']}")


if __name__ == "__main__":
    main()
