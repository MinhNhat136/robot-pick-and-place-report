"""Draw images/hammer_place_positions[.<lang>].png: final hammer centre per episode, top-down,
for the three local nb12 runs (mix200 / mix400 thr 0.01 / mix400 thr 0.02).

    python3 tools/plot_hammer_positions.py [vi|en|ja ...]     (default: all three)

Reads codes/standalone_g1_gr00t/data/nb12_eval/<run>/{summary.json,episodes.jsonl}.
"""
import collections, json, sys
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

ROOT = Path(__file__).resolve().parents[1]
D = ROOT.parent / "codes/standalone_g1_gr00t/data/nb12_eval"
RUNS = ["checkpoint-10000_gr00t_inside_200ep", "checkpoint-10000_gr00t_inside_at_rest", "checkpoint-10000_gr00t_inside"]
COL = {"success": "#1a9e60", "fallen": "#7a4fbf", "no_lift": "#d6453d", "not_released": "#2a78d6",
       "outside": "#8a8f98", "above_rim": "#c8a21c", "moving": "#46b3c4"}
ORDER = ["success", "outside", "moving", "above_rim", "no_lift", "fallen", "not_released"]
T = {
    "vi": dict(font="DejaVu Sans", runs=["mix200 · ngưỡng 0,01 m/s", "mix400 · ngưỡng 0,01 m/s", "mix400 · ngưỡng 0,02 m/s"],
               ok="{k}/100 thành công", x="ngang [cm]  (← bên trái robot)", y="dọc [cm]  (xa robot ↑)",
               foot="Nhìn từ trên xuống, gốc = tâm thùng. Khung xám: thùng; nét đứt đỏ: lòng thùng.",
               o={"success": "thành công", "outside": "tâm búa ngoài lòng thùng", "moving": "búa chưa đứng yên",
                  "above_rim": "gác trên miệng thùng", "no_lift": "không nhấc", "fallen": "robot ngã", "not_released": "chưa buông tay"}),
    "en": dict(font="DejaVu Sans", runs=["mix200 · threshold 0.01 m/s", "mix400 · threshold 0.01 m/s", "mix400 · threshold 0.02 m/s"],
               ok="{k}/100 successful", x="lateral [cm]  (← robot's left)", y="depth [cm]  (away from robot ↑)",
               foot="Top-down view, origin = bin centre. Grey frame: bin; red dashed line: bin interior.",
               o={"success": "success", "outside": "hammer centre outside bin", "moving": "hammer not at rest",
                  "above_rim": "resting on bin rim", "no_lift": "not lifted", "fallen": "robot fell", "not_released": "hand not released"}),
    "ja": dict(font="Noto Sans CJK JP", runs=["mix200 · しきい値 0.01 m/s", "mix400 · しきい値 0.01 m/s", "mix400 · しきい値 0.02 m/s"],
               ok="成功 {k}/100", x="左右 [cm]  （← ロボットの左）", y="前後 [cm]  （ロボットから遠い ↑）",
               foot="上から見た図、原点 = 箱の中心。灰色の枠：箱、赤い破線：箱の内側。",
               o={"success": "成功", "outside": "ハンマー中心が箱の外", "moving": "ハンマーが静止していない",
                  "above_rim": "箱の縁に引っかかる", "no_lift": "持ち上げられない", "fallen": "ロボット転倒", "not_released": "手を離していない"}),
}


def load(run):
    P = json.load(open(D / run / "summary.json"))["inside_params"]
    E = {}
    for line in open(D / run / "episodes.jsonl"):
        e = json.loads(line)
        if e["status"] == "ok":
            E[e["episode"]] = e          # a re-run after an error replaces the error row
    return P, list(E.values())


def draw(lang):
    t = T[lang]
    plt.rcParams.update({"font.family": t["font"], "font.size": 11})
    fig, axs = plt.subplots(1, 3, figsize=(18, 6.6), sharey=True)
    for a, run, title in zip(axs, RUNS, t["runs"]):
        P, E = load(run)
        hx, hy = [v * 100 for v in P["bin_inner_half_xy"]]; w = P["wall_inset"] * 100
        a.add_patch(Rectangle((-hy - w, -hx - w), 2 * (hy + w), 2 * (hx + w), fc="#f3f1ec", ec="#b0aa9c", lw=1.5, zorder=0))
        a.add_patch(Rectangle((-hy, -hx), 2 * hy, 2 * hx, fill=False, ec="#d6453d", ls="--", lw=1.2, zorder=1))
        a.plot(0, 0, "+", color="#555", ms=10, zorder=1)
        cnt = collections.Counter(e["outcome"] for e in E)
        for i, o in enumerate(ORDER):
            rs = [e for e in E if e["outcome"] == o]
            if not rs:
                continue
            a.scatter([e["final_off_y_m"] * 100 for e in rs], [e["final_off_x_m"] * 100 for e in rs], s=46, color=COL[o],
                      edgecolors="white", linewidths=.7, zorder=3 if o == "success" else 4)
            a.text(31, -9 - 2.1 * i, f"{t['o'][o]}: {len(rs)}", color=COL[o], fontsize=9, va="top", fontweight="bold")
        a.set_title(f"{title}\n{t['ok'].format(k=cnt['success'])}", fontsize=12.5)
        a.set_aspect("equal"); a.set_xlim(32, -16); a.set_ylim(-24, 22)
        a.set_xlabel(t["x"]); a.grid(alpha=.25)
    axs[0].set_ylabel(t["y"])
    fig.text(.5, .005, t["foot"], ha="center", fontsize=9.5, color="#555")
    fig.tight_layout(rect=(0, .045, 1, 1))
    out = ROOT / "images" / ("hammer_place_positions.png" if lang == "vi" else f"hammer_place_positions.{lang}.png")
    fig.savefig(out, dpi=130, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(out.relative_to(ROOT))


if __name__ == "__main__":
    for lang in sys.argv[1:] or list(T):
        draw(lang)
