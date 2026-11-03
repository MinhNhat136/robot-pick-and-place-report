/* Interactive explainers for section II.04 (data research). All three are schematic
   illustrations drawn in fixed-viewBox SVG (sections are hidden at load, so nothing is measured):
   [data-ds="dr"]   domain randomization: CSS colour jitter on a real frame vs re-rendered random scenes
   [data-ds="r2s"]  real2sim: hand path (FK) → grasp/release from finger closure → objects, distractors, replay
   [data-ds="gen"]  demo generation: jitter a template demo, keep the variants that still succeed
   Random numbers come from a seeded generator so the first picture is the same on every load. */
(function () {
  "use strict";
  const R = window.Report;
  const NS = "http://www.w3.org/2000/svg";

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const fmt = (x, d = 1, L = "vi") => L === "vi" ? x.toFixed(d).replace(".", ",") : x.toFixed(d);
  const langOf = box => (box.closest("[data-i18n]")?.dataset.i18n) || "vi";
  const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const accent = "oklch(0.52 0.13 255)";

  // Catmull-Rom through points → SVG path "d"
  function spline(pts) {
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  function crPoint(p0, p1, p2, p3, u) {
    const u2 = u * u, u3 = u2 * u;
    return [0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3));
  }

  /* ------------------------------------------------------------------ domain randomization */
  const WALLS = ["#e6e8ea", "#cfd5da", "#ddd6cb", "#c3cac4", "#efebe3", "#b4bcc4", "#d7dce4"];
  const TABLES = ["#cdbb9f", "#9ea6aa", "#dcd6c8", "#86928a", "#bcae9e", "#e4e2dc", "#a9a39a"];
  const PLATES = ["#ece8e0", "#d9dfe4", "#e6dccd", "#cfd8d2"];
  const BASE = { wall: WALLS[0], table: TABLES[0], plate: PLATES[0], light: 1, lightX: 160, warm: 0, cam: [0, 0, 0, 1], apple: [118, 168], plateAt: [205, 160], boxes: [] };

  function drParams(r, opt) {
    const p = JSON.parse(JSON.stringify(BASE));
    const pick = a => a[Math.floor(r() * a.length)];
    if (opt.light) { p.light = lerp(0.55, 1.15, r()); p.lightX = lerp(30, 290, r()); p.warm = lerp(-1, 1, r()); }
    if (opt.material) { p.table = pick(TABLES); p.plate = pick(PLATES); }
    if (opt.bg) { p.wall = pick(WALLS); const n = Math.floor(r() * 4); for (let i = 0; i < n; i++) p.boxes.push([lerp(10, 270, r()), lerp(40, 70, r()), lerp(24, 54, r()), lerp(20, 40, r()), pick(["#a7aeb3", "#c4b8a6", "#8e9a93", "#b9bec7"])]); }
    if (opt.camera) p.cam = [lerp(-14, 14, r()), lerp(-8, 8, r()), lerp(-4, 4, r()), lerp(0.94, 1.08, r())];
    if (opt.pose) { p.apple = [lerp(80, 150, r()), lerp(150, 190, r())]; p.plateAt = [lerp(185, 240, r()), lerp(140, 175, r())]; }
    return p;
  }

  const DR_T = {
    vi: { keep: "GIỮ NGUYÊN: TÁO + TAY", variant: i => `Biến thể ${i}`, orig: "Khung cảnh gốc", origTag: "GỐC" },
    en: { keep: "FIXED: APPLE + HAND", variant: i => `Variant ${i}`, orig: "Original scene", origTag: "ORIGINAL" },
    ja: { keep: "固定：リンゴ + 手", variant: i => `バリエーション ${i}`, orig: "元のシーン", origTag: "元" },
  };

  let gid = 0;
  function drDraw(svg, p, big, keep = DR_T.vi.keep) {
    const id = "drg" + (gid++);
    const [dx, dy, rot, sc] = p.cam;
    const shX = (p.lightX - 160) / -12; // shadows fall away from the light
    const boxes = p.boxes.map(b => `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="2" fill="${b[4]}" />`).join("");
    const lightOverlay = p.light < 1
      ? `<rect width="320" height="240" fill="#0b1020" opacity="${((1 - p.light) * 0.75).toFixed(2)}"/>`
      : `<rect width="320" height="240" fill="#ffffff" opacity="${((p.light - 1) * 1.2).toFixed(2)}"/>`;
    const tint = p.warm ? `<rect width="320" height="240" fill="${p.warm > 0 ? "#ffcf8a" : "#9fc0ff"}" opacity="${(Math.abs(p.warm) * 0.13).toFixed(2)}"/>` : "";
    svg.innerHTML = `
      <defs><radialGradient id="${id}" cx="${(p.lightX / 320).toFixed(2)}" cy="0.1" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <g transform="translate(${160 + dx},${120 + dy}) rotate(${rot}) scale(${sc}) translate(-160,-120)">
        <rect x="-40" y="-40" width="400" height="140" fill="${p.wall}"/>
        ${boxes}
        <rect x="-40" y="96" width="400" height="190" fill="${p.table}"/>
        <line x1="-40" y1="96" x2="360" y2="96" stroke="#000" stroke-opacity=".12"/>
        <ellipse cx="${p.plateAt[0] + shX}" cy="${p.plateAt[1] + 6}" rx="48" ry="17" fill="#000" opacity=".12"/>
        <ellipse cx="${p.plateAt[0]}" cy="${p.plateAt[1]}" rx="46" ry="16" fill="${p.plate}" stroke="#000" stroke-opacity=".15"/>
        <ellipse cx="${p.plateAt[0]}" cy="${p.plateAt[1]}" rx="30" ry="9" fill="none" stroke="#000" stroke-opacity=".08"/>
        <ellipse cx="${p.apple[0] + shX * 0.6}" cy="${p.apple[1] + 10}" rx="13" ry="5" fill="#000" opacity=".16"/>
        <circle cx="${p.apple[0]}" cy="${p.apple[1]}" r="12" fill="#b8423a"/>
        <circle cx="${p.apple[0] - 4}" cy="${p.apple[1] - 4}" r="3.5" fill="#fff" opacity=".35"/>
        <path d="M${p.apple[0]},${p.apple[1] - 12} q2,-6 6,-7" stroke="#5b4a2e" stroke-width="2" fill="none"/>
        <g fill="#3a3f45"><path d="M262,240 L248,196 Q246,186 256,184 L276,182 Q286,182 288,192 L300,240Z"/><rect x="238" y="166" width="10" height="26" rx="5" transform="rotate(-18 243 179)"/><rect x="252" y="160" width="10" height="28" rx="5" transform="rotate(-6 257 174)"/><rect x="268" y="162" width="10" height="26" rx="5" transform="rotate(8 273 175)"/></g>
      </g>
      ${lightOverlay}${tint}
      <rect width="320" height="240" fill="url(#${id})"/>
      ${big ? `<g transform="translate(${160 + dx},${120 + dy}) rotate(${rot}) scale(${sc}) translate(-160,-120)" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="4 3"><circle cx="${p.apple[0]}" cy="${p.apple[1]}" r="19"/><rect x="228" y="150" width="80" height="94" rx="8"/></g>
      <g font-family="IBM Plex Mono,monospace" font-size="9" font-weight="600" fill="#fff"><rect x="8" y="8" width="118" height="17" rx="4" fill="#0b1020" opacity=".55"/><text x="14" y="20">${keep}</text></g>` : ""}`;
  }

  function setupDR(box) {
    const L = langOf(box), tr = DR_T[L] || DR_T.vi;
    const photo = R.$("[data-dr-photo]", box);
    const sliders = R.$$("[data-dr-f]", box);
    const applyFilter = () => {
      photo.style.filter = sliders.map(s => s.dataset.drF === "hue-rotate" ? `hue-rotate(${s.value}deg)` : `${s.dataset.drF}(${s.value}%)`).join(" ");
    };
    sliders.forEach(s => s.addEventListener("input", applyFilter));

    const main = R.$("[data-dr-main]", box), thumbs = R.$("[data-dr-thumbs]", box);
    const opts = R.$$("[data-dr-opt]", box);
    let seed = 7, current = 0, variants = [];
    const opt = () => Object.fromEntries(opts.map(b => [b.dataset.drOpt, b.getAttribute("aria-pressed") === "true"]));
    function roll() {
      const r = rng(seed++), o = opt();
      variants = [BASE].concat(Array.from({ length: 5 }, () => drParams(r, o)));
      thumbs.innerHTML = "";
      variants.forEach((p, i) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "ds-thumb"; b.setAttribute("aria-label", i ? tr.variant(i) : tr.orig);
        const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 320 240");
        drDraw(s, p, false); b.appendChild(s);
        const tag = document.createElement("span"); tag.textContent = i ? `#${i}` : tr.origTag; b.appendChild(tag);
        b.addEventListener("click", () => show(i));
        thumbs.appendChild(b);
      });
      show(variants.length > 1 ? 1 : 0);
    }
    function show(i) {
      current = i; drDraw(main, variants[i], true, tr.keep);
      R.$$(".ds-thumb", thumbs).forEach((b, k) => b.classList.toggle("on", k === i));
    }
    opts.forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); roll(); }));
    R.$("[data-dr-roll]", box).addEventListener("click", roll);
    roll();
  }

  /* ------------------------------------------------------------------ real2sim */
  const KP = [[260, 222], [222, 178], [168, 104], [196, 70], [300, 60], [368, 92], [336, 160], [292, 214]];
  const KT = [0, 0.15, 0.35, 0.45, 0.58, 0.7, 0.85, 1];
  function handAt(t) {
    t = clamp(t, 0, 1);
    let i = 0; while (i < KT.length - 2 && t > KT[i + 1]) i++;
    const u = (t - KT[i]) / (KT[i + 1] - KT[i]);
    return crPoint(KP[i - 1] || KP[i], KP[i], KP[i + 1], KP[i + 2] || KP[i + 1], u);
  }
  const gripAt = t => 0.05 + 0.57 * (smooth((t - 0.27) / 0.11) - smooth((t - 0.66) / 0.1));
  const TH = 0.25;
  const crossing = (a, b, up) => { for (let t = a; t <= b; t += 0.001) if (up ? gripAt(t) >= TH : gripAt(t) <= TH) return t; return b; };
  const TG = crossing(0.2, 0.5, true), TR = crossing(0.6, 0.9, false);
  const DISTRACT = [[438, 196], [92, 196]];
  const REJECT = [246, 64];

  const R2S_TEXT = { vi: {
    1: ["Động học thuận (FK)", "Từ góc khớp ở mỗi khung hình, nhân lần lượt các phép biến đổi dọc cánh tay (file URDF) để ra vị trí lòng bàn tay. Ghép lại thành quỹ đạo bàn tay trên mặt bàn.", "Bộ FK tự viết chỉ dùng numpy; tư thế thân suy ra từ giả định hai bàn chân đặt phẳng trên sàn (mục II.03)."],
    2: ["Tìm lúc nắm và lúc thả", "Độ khép ngón tay vượt ngưỡng là lúc nắm; tụt dưới ngưỡng là lúc thả. Quả nằm ở vị trí tay lúc nắm, đĩa nằm ở vị trí tay lúc thả.", "Biên độ khép ≥ 0,25 rad được coi là một lần nắm."],
    3: ["Đặt vật nhiễu an toàn", "Vùng tay quét qua (dải mờ) phải để trống. Vật nhiễu chỉ được đặt ngoài vùng này, nếu không tay robot sẽ va vào khi phát lại.", "Ứng viên rơi vào vùng quét (dấu ×) bị loại; mỗi episode có 2 quả gây nhiễu."],
    4: ["Phát lại và lọc", "Phát lại đúng chuỗi góc khớp trong Isaac Lab. Quả đi theo tay nếu nắm được; chỉ giữ episode mà quả nằm trên đĩa và vật nhiễu không bị chạm.", "Từ 1.095 quỹ đạo thật giữ được 790 episode train và 89 test."],
    5: ["Ghi thành dataset", "Mỗi bước ghi ảnh camera đầu được render, trạng thái khớp và action trong mô phỏng, theo định dạng LeRobot để fine-tune GR00T.", "Dataset đa nhiệm 4 loại quả, chia train/test theo episode gốc."],
  }, en: {
    1: ["Forward kinematics (FK)", "From the joint angles in each frame, multiply the transforms along the arm (URDF file) in sequence to get the palm position. Joined together, these form the hand trajectory over the table.", "Custom FK written with numpy only; the torso pose is inferred from the assumption that both feet stand flat on the floor (section II.03)."],
    2: ["Find the grasp and release moments", "Finger closure rising above the threshold marks the grasp; falling below it marks the release. The fruit is at the hand position at grasp, the plate at the hand position at release.", "A closure amplitude ≥ 0.25 rad counts as one grasp."],
    3: ["Place distractors safely", "The area swept by the hand (shaded band) must stay clear. Distractors may only be placed outside this area, otherwise the robot hand would hit them during replay.", "Candidates falling inside the swept area (× mark) are rejected; each episode has 2 distractor fruits."],
    4: ["Replay and filter", "Replay the exact joint-angle sequence in Isaac Lab. The fruit follows the hand if grasped; only episodes where the fruit ends on the plate and no distractor is touched are kept.", "From 1,095 real trajectories, 790 train and 89 test episodes were kept."],
    5: ["Record as a dataset", "Each step records the rendered head-camera image, the joint state and the action in simulation, in LeRobot format for fine-tuning GR00T.", "Multi-task dataset with 4 fruit types, split train/test by source episode."],
  }, ja: {
    1: ["順運動学（FK）", "各フレームの関節角度から、腕に沿った変換（URDF ファイル）を順に掛け合わせて手のひらの位置を求めます。これをつなげるとテーブル上の手の軌道になります。", "numpy のみで独自実装した FK。胴体の姿勢は両足が床に平らに接しているという仮定から推定（II.03 節）。"],
    2: ["把持と解放のタイミング検出", "指の閉じ具合がしきい値を超えた時点が把持、しきい値を下回った時点が解放です。果物は把持時の手の位置に、皿は解放時の手の位置にあります。", "閉じ幅 ≥ 0.25 rad を 1 回の把持とみなす。"],
    3: ["妨害物を安全に配置", "手が通過する領域（薄い帯）は空けておく必要があります。妨害物はこの領域の外にのみ配置し、そうしないと再生時にロボットの手が衝突します。", "通過領域内に入る候補（× 印）は除外。各エピソードに妨害用の果物 2 個。"],
    4: ["再生とフィルタ", "Isaac Lab で関節角度の系列をそのまま再生します。把持できれば果物は手に追従します。果物が皿の上にあり、妨害物に触れていないエピソードのみを残します。", "実軌道 1,095 件から train 790 件、test 89 件のエピソードを確保。"],
    5: ["データセットとして記録", "各ステップで、レンダリングされた頭部カメラ画像、関節状態、シミュレーション内の action を LeRobot 形式で記録し、GR00T のファインチューニングに使います。", "果物 4 種のマルチタスクデータセット。元エピソード単位で train/test に分割。"],
  } };
  const R2S_L = {
    vi: { distract: "vật nhiễu", reject: "× loại: nằm trong vùng quét", plate: "đĩa = chỗ thả", fruit: "quả = chỗ nắm", ok: "✓ ĐẠT · GIỮ EPISODE", rec: "GHI ẢNH + STATE + ACTION", grip: "ĐỘ KHÉP NGÓN TAY (rad)", th: "ngưỡng", grasp: "NẮM", release: "THẢ", start: "bắt đầu", end: "kết thúc episode", step: "BƯỚC", inProj: "Trong dự án:", play: "▶ Chạy", stop: "■ Dừng" },
    en: { distract: "distractor", reject: "× rejected: inside swept area", plate: "plate = release point", fruit: "fruit = grasp point", ok: "✓ PASS · EPISODE KEPT", rec: "RECORD IMAGE + STATE + ACTION", grip: "FINGER CLOSURE (rad)", th: "threshold", grasp: "GRASP", release: "RELEASE", start: "start", end: "end of episode", step: "STEP", inProj: "In the project:", play: "▶ Play", stop: "■ Stop" },
    ja: { distract: "妨害物", reject: "× 除外：通過領域内", plate: "皿 = 解放位置", fruit: "果物 = 把持位置", ok: "✓ 合格 · エピソード採用", rec: "画像 + STATE + ACTION を記録", grip: "指の閉じ具合 (rad)", th: "しきい値", grasp: "把持", release: "解放", start: "開始", end: "エピソード終了", step: "ステップ", inProj: "本プロジェクトでは：", play: "▶ 再生", stop: "■ 停止" },
  };

  function setupR2S(box) {
    const L = langOf(box), tl = R2S_L[L] || R2S_L.vi, tx = R2S_TEXT[L] || R2S_TEXT.vi;
    const top = R.$("[data-r2s-top]", box), grip = R.$("[data-r2s-grip]", box);
    const slider = R.$("[data-r2s-t]", box), clock = R.$("[data-r2s-clock]", box), play = R.$("[data-r2s-play]", box);
    const explain = R.$("[data-r2s-explain]", box), stepBtns = R.$$("[data-r2s-step]", box);
    const path = Array.from({ length: 201 }, (_, i) => handAt(i / 200));
    const gpt = path.length - 1;
    const gx = t => 40 + t * 460, gy = v => 92 - v / 0.7 * 76;
    let step = 1, t = 1, raf = null;

    function render() {
      const n = Math.round(t * gpt);
      const h = handAt(t), pg = handAt(TG), pr = handAt(TR);
      let fruit = null;
      if (step >= 2 && t >= TG) fruit = step >= 4 ? (t < TR ? h : pr) : pg;
      const corridor = step >= 3 ? `<path d="${spline(KP)}" fill="none" stroke="${accent}" stroke-opacity=".12" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"/>` : "";
      const distract = step >= 3 ? DISTRACT.map(d => `<circle cx="${d[0]}" cy="${d[1]}" r="11" fill="#aeb5bc"/><text x="${d[0]}" y="${d[1] + 24}" text-anchor="middle" class="r2s-lbl">${tl.distract}</text>`).join("")
        + `<g stroke="#8a93a0" stroke-width="2.4"><line x1="${REJECT[0] - 7}" y1="${REJECT[1] - 7}" x2="${REJECT[0] + 7}" y2="${REJECT[1] + 7}"/><line x1="${REJECT[0] + 7}" y1="${REJECT[1] - 7}" x2="${REJECT[0] - 7}" y2="${REJECT[1] + 7}"/></g><text x="${REJECT[0]}" y="${REJECT[1] + 52}" text-anchor="middle" class="r2s-lbl">${tl.reject}</text>` : "";
      const plate = step >= 2 && t >= TR ? `<ellipse cx="${pr[0]}" cy="${pr[1]}" rx="30" ry="22" fill="#fff" stroke="${accent}" stroke-width="1.5"/><text x="${pr[0]}" y="${pr[1] + 36}" text-anchor="middle" class="r2s-lbl b">${tl.plate}</text>` : "";
      const fruitSvg = fruit ? `<circle cx="${fruit[0]}" cy="${fruit[1]}" r="10" fill="#e3b341" stroke="#9a7a22"/>${step < 4 || t < TG + 0.02 ? `<text x="${pg[0] - 16}" y="${pg[1] + 4}" text-anchor="end" class="r2s-lbl b">${tl.fruit}</text>` : ""}` : "";
      const ok = step >= 4 && t >= 0.999 ? `<g><rect x="330" y="14" width="176" height="24" rx="6" fill="${accent}"/><text x="418" y="30" text-anchor="middle" class="r2s-lbl" style="fill:#fff;font-weight:700">${tl.ok}</text></g>` : "";
      const rec = step >= 5 ? `<g transform="translate(18,14)"><rect width="150" height="24" rx="6" fill="#fff" stroke="${accent}"/><circle cx="14" cy="12" r="5" fill="${accent}"/><text x="26" y="16" class="r2s-lbl b">${tl.rec}</text></g>` : "";
      top.innerHTML = `
        <rect x="14" y="10" width="492" height="222" rx="10" fill="oklch(0.97 0.012 255)" stroke="oklch(0.86 0.04 255)"/>
        <path d="M222,250 A38,38 0 0 1 298,250Z" fill="#3a3f45"/><text x="260" y="246" text-anchor="middle" class="r2s-lbl" style="fill:#fff">ROBOT</text>
        ${corridor}${distract}${plate}
        <path d="${spline(path.slice(0, n + 1))}" fill="none" stroke="${accent}" stroke-width="2.6" stroke-linecap="round"/>
        ${fruitSvg}
        <circle cx="${h[0]}" cy="${h[1]}" r="8" fill="none" stroke="#1f2a3a" stroke-width="2.2"/><circle cx="${h[0]}" cy="${h[1]}" r="2.5" fill="#1f2a3a"/>
        ${ok}${rec}`;
      const curve = Array.from({ length: n + 1 }, (_, i) => `${gx(i / gpt).toFixed(1)},${gy(gripAt(i / gpt)).toFixed(1)}`).join(" ");
      const mk = (tt, label) => `<line x1="${gx(tt)}" y1="14" x2="${gx(tt)}" y2="92" stroke="${accent}" stroke-dasharray="3 3"/><text x="${gx(tt) + 4}" y="22" class="r2s-lbl b">${label}</text>`;
      grip.innerHTML = `
        <text x="6" y="12" class="r2s-lbl">${tl.grip}</text>
        <line x1="40" y1="92" x2="500" y2="92" stroke="#c5ccd6"/>
        <line x1="40" y1="${gy(TH)}" x2="500" y2="${gy(TH)}" stroke="#8a93a0" stroke-dasharray="5 4"/><text x="500" y="${gy(TH) - 4}" text-anchor="end" class="r2s-lbl">${tl.th} ${fmt(TH, 2, L)}</text>
        ${step >= 2 && t >= TG ? mk(TG, tl.grasp) : ""}${step >= 2 && t >= TR ? mk(TR, tl.release) : ""}
        <polyline points="${curve}" fill="none" stroke="${accent}" stroke-width="2.2"/>
        <line x1="${gx(t)}" y1="10" x2="${gx(t)}" y2="96" stroke="#1f2a3a" stroke-opacity=".35"/>
        <text x="40" y="106" class="r2s-lbl">${tl.start}</text><text x="500" y="106" text-anchor="end" class="r2s-lbl">${tl.end}</text>`;
      slider.value = Math.round(t * 1000); clock.textContent = Math.round(t * 100) + " %";
    }
    function setStep(s) {
      step = s;
      stepBtns.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.r2sStep === s)));
      const [h, d, p] = tx[s];
      explain.innerHTML = `<span class="ds-k">${tl.step} ${s} / 5</span><b>${h}</b><p>${d}</p><p class="pj"><b>${tl.inProj}</b> ${p}</p>`;
      render();
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; play.textContent = tl.play; }
    function start() {
      if (raf) return stop();
      if (t >= 0.999) t = 0;
      play.textContent = tl.stop;
      let last = performance.now();
      const tick = now => { t = Math.min(1, t + (now - last) / 5000); last = now; render(); if (t < 1) raf = requestAnimationFrame(tick); else stop(); };
      raf = requestAnimationFrame(tick);
    }
    stepBtns.forEach(b => b.addEventListener("click", () => { stop(); setStep(+b.dataset.r2sStep); if (+b.dataset.r2sStep >= 2) { t = 0; start(); } }));
    slider.addEventListener("input", () => { stop(); t = slider.value / 1000; render(); });
    play.addEventListener("click", start);
    R.on("section:shown", sec => { if (!sec.contains(box)) stop(); });
    setStep(1);
  }

  /* ------------------------------------------------------------------ demo generation */
  const K = 14; // px per cm, exaggerated so cm-level offsets are visible
  const TPL = { S: [62, 118], G: [112, 168], L: [158, 78], O: [400, 66], Rl: [400, 150], E: [330, 104] };
  const BIN = { l: 330, r: 470, top: 150, bot: 232, cx: 400 };
  const PASS = 20; // px: release must land within ±20 px of the bin centre (illustration)

  const GEN_T = {
    vi: { start: "xuất phát", grasp: "gắp", lift: "nhấc", release: "thả", shelf: "KỆ", bin: "THÙNG · vùng thả đạt", last: "DEMO VỪA SINH", time: "Thời gian", dS: "Xuất phát lệch", dG: "Điểm gắp lệch", dR: "Điểm thả lệch",
      ok: "✓ Chạy lại trong mô phỏng: búa vào giữa thùng → GIỮ", bad: "✗ Chạy lại trong mô phỏng: búa không vào giữa thùng → LOẠI", hint: 'Bấm "Sinh 1 demo" để xem từng phép biến đổi.' },
    en: { start: "start", grasp: "grasp", lift: "lift", release: "release", shelf: "SHELF", bin: "BIN · pass zone", last: "LATEST GENERATED DEMO", time: "Time", dS: "Start offset", dG: "Grasp offset", dR: "Release offset",
      ok: "✓ Re-run in simulation: hammer in the middle of the bin → KEEP", bad: "✗ Re-run in simulation: hammer not in the middle of the bin → REJECT", hint: 'Click "Generate 1 demo" to see each transformation.' },
    ja: { start: "開始", grasp: "把持", lift: "持ち上げ", release: "解放", shelf: "棚", bin: "箱 · 合格ゾーン", last: "直近の生成デモ", time: "時間", dS: "開始点のずれ", dG: "把持点のずれ", dR: "解放点のずれ",
      ok: "✓ シミュレーションで再実行：ハンマーが箱の中央に入る → 採用", bad: "✗ シミュレーションで再実行：ハンマーが箱の中央に入らない → 除外", hint: "「デモを 1 件生成」を押すと各変換を確認できます。" },
  };

  function setupGen(box) {
    const L = langOf(box), tg = GEN_T[L] || GEN_T.vi;
    const svg = R.$("[data-gen-svg]", box);
    const kept = R.$("[data-gen-kept]", box), drop = R.$("[data-gen-drop]", box), last = R.$("[data-gen-last]", box);
    let r = rng(11), demos = [];
    const pts = d => [d.S, d.G, d.L, d.O, d.Rl, d.E];

    function make() {
      const ts = lerp(0.85, 1.2, r());
      const s = [gauss(r) * 1.0, gauss(r) * 1.0], g = [gauss(r) * 0.4, gauss(r) * 0.2];
      const rel = (r() * 2.4 - 1.2) + gauss(r) * 1.0; // cm: ±1–1,2 cm offset + spread of the release
      const lift = (ts - 1) * -14; // faster demos lift a little lower (illustrative)
      const d = {
        ts, s, g, rel,
        S: [TPL.S[0] + s[0] * K, TPL.S[1] + s[1] * K], G: [TPL.G[0] + g[0] * K, TPL.G[1] + g[1] * K],
        L: [TPL.L[0] + g[0] * K, TPL.L[1] + lift], O: [TPL.O[0] + rel * K * 0.6, TPL.O[1] + lift],
        Rl: [TPL.Rl[0] + rel * K, TPL.Rl[1]], E: [TPL.E[0] + rel * K * 0.5, TPL.E[1]],
      };
      d.ok = Math.abs(d.Rl[0] - BIN.cx) <= PASS;
      return d;
    }
    function render() {
      const lastD = demos[demos.length - 1];
      const variants = demos.map(d => `<path d="${spline(pts(d))}" fill="none" stroke="${d.ok ? accent : "#9aa1aa"}" stroke-opacity="${d === lastD ? 1 : d.ok ? 0.35 : 0.5}" stroke-width="${d === lastD ? 2.4 : 1.3}" ${d.ok ? "" : 'stroke-dasharray="4 3"'}/>`).join("");
      const hammerAt = (x, y, ok) => `<g transform="translate(${x},${y}) rotate(${ok ? 0 : 0})"><rect x="-26" y="-3" width="40" height="6" rx="3" fill="#8b6b45"/><rect x="12" y="-8" width="12" height="16" rx="2" fill="#5d6670"/></g>`;
      const endHammer = lastD ? hammerAt(lastD.Rl[0], lastD.ok ? 224 : 146, lastD.ok) : "";
      const key = lastD ? [["S", "xuất phát"], ["G", "gắp"], ["Rl", "thả"]].map(([k, l]) => `<circle cx="${lastD[k][0]}" cy="${lastD[k][1]}" r="4.5" fill="#fff" stroke="${lastD.ok ? accent : "#7c848e"}" stroke-width="2"/>`).join("") : "";
      svg.innerHTML = `
        <rect x="10" y="176" width="170" height="64" rx="4" fill="#d9d4ca"/><text x="95" y="214" text-anchor="middle" class="r2s-lbl">${tg.shelf}</text>
        <rect x="88" y="168" width="22" height="8" fill="#b9b2a5"/>
        ${hammerAt(112, 165, true)}
        <path d="M${BIN.l},${BIN.top} L${BIN.l},${BIN.bot} L${BIN.r},${BIN.bot} L${BIN.r},${BIN.top}" fill="oklch(0.95 0.02 255)" stroke="#5d6670" stroke-width="3"/>
        <rect x="${BIN.cx - PASS}" y="${BIN.bot - 10}" width="${PASS * 2}" height="8" rx="2" fill="${accent}" opacity=".25"/>
        <text x="${BIN.cx}" y="${BIN.bot + 14}" text-anchor="middle" class="r2s-lbl">${tg.bin}</text>
        ${variants}
        <path d="${spline(pts(TPL))}" fill="none" stroke="#1f2a3a" stroke-width="3" stroke-linecap="round"/>
        ${[["S", tg.start, -8, -8, "end"], ["G", tg.grasp, -16, -12, "end"], ["L", tg.lift, 8, -8, "start"], ["Rl", tg.release, 12, 14, "start"]].map(([k, l, ox, oy, a]) => `<circle cx="${TPL[k][0]}" cy="${TPL[k][1]}" r="4" fill="#1f2a3a"/><text x="${TPL[k][0] + ox}" y="${TPL[k][1] + oy}" text-anchor="${a}" class="r2s-lbl b">${l}</text>`).join("")}
        ${key}${endHammer}`;
      const nk = demos.filter(d => d.ok).length;
      kept.textContent = nk; drop.textContent = demos.length - nk;
      if (lastD) {
        const cm = v => (v >= 0 ? "+" : "−") + fmt(Math.abs(v), 1, L) + " cm";
        const mm = v => fmt(Math.abs(v) * 10, 0, L) + " mm";
        last.innerHTML = `<span class="ds-k">${tg.last} · #${demos.length}</span>
          <ul><li><span>${tg.time}</span><b>×${fmt(lastD.ts, 2, L)}</b></li>
          <li><span>${tg.dS}</span><b>${fmt(Math.hypot(...lastD.s), 1, L)} cm</b></li>
          <li><span>${tg.dG}</span><b>${mm(Math.hypot(...lastD.g))}</b></li>
          <li><span>${tg.dR}</span><b>${cm(lastD.rel)}</b></li></ul>
          <div class="gen-verdict ${lastD.ok ? "ok" : "bad"}">${lastD.ok ? tg.ok : tg.bad}</div>`;
      }
    }
    const add = n => { for (let i = 0; i < n; i++) demos.push(make()); if (demos.length > 80) demos = demos.slice(-80); render(); };
    R.$("[data-gen-one]", box).addEventListener("click", () => add(1));
    R.$("[data-gen-many]", box).addEventListener("click", () => add(20));
    R.$("[data-gen-clear]", box).addEventListener("click", () => { demos = []; r = rng(11); render(); last.innerHTML = `<span class="ds-k">${tg.last}</span><p>${tg.hint}</p>`; });
    add(8); // a meaningful first picture (also for print)
  }

  R.datasim = {
    init() {
      if (!R.$("#du-lieu")) return;
      const run = (sel, fn) => R.$$(sel).forEach(box => { try { fn(box); } catch (e) { console.error("datasim", sel, e); } });
      run('[data-ds="dr"]', setupDR);
      run('[data-ds="r2s"]', setupR2S);
      run('[data-ds="gen"]', setupGen);
    },
  };
})();
