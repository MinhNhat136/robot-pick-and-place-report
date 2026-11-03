/* Interactive explainers for section II.01 (model research), fixed-viewBox SVG:
   [data-md="arch"] dual-system block diagram in two lanes (System 2 / System 1), click a block for details
   [data-md="flow"] flow matching: a 16-step action chunk goes from noise to motion in 4 steps
   [data-md="pyr"]  data pyramid, click a layer for scale and what the project used
   Figures shown come from the paper summary already in the report (10 Hz, 16 actions, 4 steps,
   ~64 ms, ~120 Hz, 88 → 827 h, 780.000 trajectories) and from the project sections. */
(function () {
  "use strict";
  const R = window.Report;
  const A = "oklch(0.52 0.13 255)", INK = "#1f2a3a", SOFT = "oklch(0.97 0.02 255)", LINE = "oklch(0.82 0.06 255)";
  const lbl = (x, y, t, extra = "") => `<text x="${x}" y="${y}" class="r2s-lbl" ${extra}>${t}</text>`;
  const fmt = (x, d = 1, L = "vi") => L === "vi" ? x.toFixed(d).replace(".", ",") : x.toFixed(d);
  // language of the copy a widget box sits in (build.py tags vi / en / ja copies with data-i18n)
  const langOf = box => (box.closest("[data-i18n]")?.dataset.i18n) || "vi";
  // label width in "Latin character" units: full-width CJK characters count ~1.8 (no effect on vi / en)
  const tlen = s => s.length + (s.match(/[⺀-￯]/g) || []).length * 0.8;


  /* ---------------- robot body: the 31 upper-body joints GR00T reads (front view, robot's left on the right) */
  const BODY_GROUPS = {
    la: { n: "Tay trái", key: "left_arm", lo: 1, c: "oklch(0.52 0.14 258)", j: ["Vai pitch", "Vai roll", "Vai yaw", "Khuỷu", "Cổ tay roll", "Cổ tay pitch", "Cổ tay yaw"] },
    ra: { n: "Tay phải", key: "right_arm", lo: 8, c: "oklch(0.52 0.14 258)", j: ["Vai pitch", "Vai roll", "Vai yaw", "Khuỷu", "Cổ tay roll", "Cổ tay pitch", "Cổ tay yaw"] },
    lh: { n: "Bàn tay trái", key: "left_hand", lo: 15, c: "oklch(0.68 0.12 225)", j: ["Ngón trỏ 1", "Ngón trỏ 2", "Ngón giữa 1", "Ngón giữa 2", "Ngón cái 1", "Ngón cái 2", "Ngón cái 3"] },
    rh: { n: "Bàn tay phải", key: "right_hand", lo: 22, c: "oklch(0.68 0.12 225)", j: ["Ngón trỏ 1", "Ngón trỏ 2", "Ngón giữa 1", "Ngón giữa 2", "Ngón cái 1", "Ngón cái 2", "Ngón cái 3"] },
    w: { n: "Eo", key: "waist", lo: 29, c: "oklch(0.6 0.11 195)", j: ["Eo yaw", "Eo roll", "Eo pitch"] },
  };
  // joint positions for the robot's LEFT side (drawn on the right); the right side is mirrored at x = 520 - x
  const ARM_L = [[322, 96], [339, 104], [353, 117], [380, 168], [397, 212], [406, 228], [415, 244]];
  const HAND_L = [[426, 296], [426, 314], [446, 292], [450, 310], [408, 286], [398, 301], [391, 317]];
  const PALM_L = [430, 270];
  const WAIST = [[242, 210], [260, 210], [278, 210]];
  const LEG_L = [[278, 266], [292, 274], [286, 290], [292, 336], [294, 398], [294, 414]];
  const mir = ([x, y]) => [520 - x, y];
  // en / ja group names and joint names (vi stays in BODY_GROUPS)
  const BODY_J = {
    en: { arm: ["Shoulder pitch", "Shoulder roll", "Shoulder yaw", "Elbow", "Wrist roll", "Wrist pitch", "Wrist yaw"], hand: ["Index 1", "Index 2", "Middle 1", "Middle 2", "Thumb 1", "Thumb 2", "Thumb 3"], w: ["Waist yaw", "Waist roll", "Waist pitch"],
      n: { la: "Left arm", ra: "Right arm", lh: "Left hand", rh: "Right hand", w: "Waist" } },
    ja: { arm: ["肩 pitch", "肩 roll", "肩 yaw", "肘", "手首 roll", "手首 pitch", "手首 yaw"], hand: ["人差し指 1", "人差し指 2", "中指 1", "中指 2", "親指 1", "親指 2", "親指 3"], w: ["腰 yaw", "腰 roll", "腰 pitch"],
      n: { la: "左腕", ra: "右腕", lh: "左手", rh: "右手", w: "腰" } },
  };
  const bodyGroups = L => {
    const T = BODY_J[L];
    if (!T) return BODY_GROUPS;
    const g = {};
    for (const [id, b] of Object.entries(BODY_GROUPS)) g[id] = Object.assign({}, b, { n: T.n[id], j: id === "w" ? T.w : id === "la" || id === "ra" ? T.arm : T.hand });
    return g;
  };
  const BODY_T = {
    vi: { cam: "CAMERA ĐẦU", rarm: "TAY PHẢI", larm: "TAY TRÁI", legs1: "12 KHỚP CHÂN", legs2: "DO AGILE LO", front: "NHÌN TỪ PHÍA TRƯỚC ROBOT", frontClick: "NHÌN TỪ PHÍA TRƯỚC · BẤM KHỚP ĐỂ XEM NHÓM",
      sent: "TRẠNG THÁI GỬI LÊN MODEL", h31: "31 góc khớp thân trên", leg: "12 khớp chân", notSent: "không gửi", note: "Số trên mỗi khớp là vị trí của nó trong vector 31 giá trị gửi lên server. Bấm một khớp để xem cả nhóm.",
      grp: "NHÓM", joints: "KHỚP", pyr: "Pitch: gập lên xuống · roll: nghiêng sang bên · yaw: xoay quanh trục dọc. Bấm lại để bỏ chọn." },
    en: { cam: "HEAD CAMERA", rarm: "RIGHT ARM", larm: "LEFT ARM", legs1: "12 LEG JOINTS", legs2: "HANDLED BY AGILE", front: "FRONT VIEW OF THE ROBOT", frontClick: "FRONT VIEW · CLICK A JOINT TO SEE ITS GROUP",
      sent: "STATE SENT TO THE MODEL", h31: "31 upper-body joint angles", leg: "12 leg joints", notSent: "not sent", note: "The number on each joint is its position in the 31-value vector sent to the server. Click a joint to see its whole group.",
      grp: "GROUP", joints: "JOINTS", pyr: "Pitch: bend up and down · roll: tilt sideways · yaw: rotate about the vertical axis. Click again to deselect." },
    ja: { cam: "頭部カメラ", rarm: "右腕", larm: "左腕", legs1: "脚関節 12", legs2: "AGILE が担当", front: "ロボット正面から見た図", frontClick: "正面図 · 関節をクリックでグループを表示",
      sent: "モデルに送る状態", h31: "上半身の関節角 31", leg: "脚関節 12", notSent: "送信しない", note: "各関節の番号は、サーバーに送る 31 値ベクトル内の位置です。関節をクリックするとグループ全体を表示します。",
      grp: "グループ", joints: "関節", pyr: "Pitch：上下に曲げる · roll：横に傾ける · yaw：縦軸まわりに回す。もう一度クリックすると選択を解除します。" },
  };
  function setupBody(box) {
    const L = langOf(box), t = BODY_T[L] || BODY_T.vi, BODY_GROUPS = bodyGroups(L);
    const svg = R.$("[data-body-svg]", box), out = R.$("[data-body-out]", box), simple = !out;
    let sel = null;
    const pos = { la: ARM_L, ra: ARM_L.map(mir), lh: HAND_L, rh: HAND_L.map(mir), w: WAIST };
    function render() {
      const fade = g => sel && sel !== g ? ' opacity=".22"' : "";
      const limb = (pts, w, col, op = 1) => `<path d="M${pts.map(p => p.join(",")).join(" L")}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${op}"/>`;
      const side = m => {
        const f = m ? mir : (p => p), A = ARM_L.map(f), H = HAND_L.map(f), P = f(PALM_L), L = LEG_L.map(f);
        return limb([f([298, 96]), A[0], A[3], A[5], P], 17, "#e3e8ef") +
          H.filter((_, i) => i % 2 === 1 || i === 6).map((tip, i) => limb([P, tip], 7, "#e3e8ef")).join("") +
          limb([f([272, 250]), L[3], L[5]], 19, "#eef0f3") + limb([L[5], f([306, 424])], 10, "#eef0f3");
      };
      const dots = Object.entries(pos).map(([g, pts]) => pts.map((p, i) =>
        (simple ? `<circle cx="${p[0]}" cy="${p[1]}" r="6.5" fill="${BODY_GROUPS[g].c}" stroke="#fff" stroke-width="1.5"/>` : `<g class="bd-j" data-g="${g}"${fade(g)}><circle cx="${p[0]}" cy="${p[1]}" r="8.5" fill="${BODY_GROUPS[g].c}" stroke="#fff" stroke-width="1.5"/><text x="${p[0]}" y="${p[1] + 3}" text-anchor="middle" style="font:700 8px 'IBM Plex Mono',monospace;fill:#fff">${BODY_GROUPS[g].lo + i}</text></g>`)).join("")).join("");
      const legs = [...LEG_L, ...LEG_L.map(mir)].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="#a3abb6" stroke-width="1.4" stroke-dasharray="2 2"${sel ? ' opacity=".4"' : ""}/>`).join("");
      svg.innerHTML = `
        ${side(false)}${side(true)}
        <rect x="222" y="80" width="76" height="118" rx="18" fill="#e9eef5" stroke="#cfd7e2"/>
        <rect x="226" y="222" width="68" height="32" rx="12" fill="#eef0f3" stroke="#d5dbe3"/>
        <rect x="250" y="196" width="20" height="28" rx="6" fill="#e9eef5"/>
        <rect x="236" y="18" width="48" height="54" rx="16" fill="#e9eef5" stroke="#cfd7e2"/>
        <rect x="252" y="70" width="16" height="12" fill="#e3e8ef"/>
        <circle cx="260" cy="44" r="8" fill="#1f2a3a"/><circle cx="260" cy="44" r="3" fill="#6f8fbf"/>
        <path d="M268,44 H330" stroke="#9aa6b6" stroke-width="1"/><text x="334" y="47" class="r2s-lbl" style="font-size:8.5px">${t.cam}</text>
        ${legs}${dots}
        <text x="96" y="30" class="r2s-lbl" style="font-size:8.5px">${t.rarm}</text><text x="424" y="30" text-anchor="end" class="r2s-lbl" style="font-size:8.5px">${t.larm}</text>
        <path d="M318,350 H370" stroke="#9aa6b6" stroke-width="1"/><text x="374" y="347" class="r2s-lbl" style="font-size:8.5px;fill:#7d8794">${t.legs1}</text><text x="374" y="359" class="r2s-lbl" style="font-size:8.5px;fill:#7d8794">${t.legs2}</text>
        <text x="260" y="438" text-anchor="middle" class="r2s-lbl" style="font-size:8px;fill:#8a93a0">${simple ? t.front : t.frontClick}</text>`;
      if (simple) return;
      R.$$(".bd-j", svg).forEach(g => g.addEventListener("click", () => { sel = sel === g.dataset.g ? null : g.dataset.g; render(); }));
      if (!sel) {
        out.innerHTML = `<span class="ds-k">${t.sent}</span><b class="mo-h">${t.h31}</b>
          <ul>${Object.values(BODY_GROUPS).map(b => `<li><span><i class="bd-sw" style="background:${b.c}"></i>${b.n}</span><b>${b.lo}–${b.lo + b.j.length - 1}</b></li>`).join("")}<li><span><i class="bd-sw leg"></i>${t.leg}</span><b>${t.notSent}</b></li></ul>
          <p class="ds-note">${t.note}</p>`;
      } else {
        const b = BODY_GROUPS[sel];
        out.innerHTML = `<span class="ds-k">${t.grp} <code>${b.key}</code> · ${b.j.length} ${t.joints}</span><b class="mo-h">${b.n}</b>
          <ul>${b.j.map((n, i) => `<li><span>${n}</span><b>#${b.lo + i}</b></li>`).join("")}</ul>
          <p class="ds-note">${t.pyr}</p>`;
      }
    }
    render();
  }


  /* ---------------- output chunk: one real 40-step chunk from the apple demo (episode 0, frames 20–59),
     left arm targets (rad) + how closed the left hand is; same shape as what the model returns */
  const CHUNK_ARM = [[-0.429, -0.416, -0.386, -0.353, -0.327, -0.307, -0.289, -0.277, -0.257, -0.235, -0.223, -0.211, -0.2, -0.191, -0.193, -0.197, -0.204, -0.209, -0.215, -0.228, -0.241, -0.251, -0.253, -0.254, -0.251, -0.249, -0.249, -0.249, -0.249, -0.247, -0.247, -0.248, -0.251, -0.252, -0.254, -0.255, -0.257, -0.257, -0.257, -0.257], [0.542, 0.541, 0.547, 0.557, 0.559, 0.555, 0.548, 0.543, 0.54, 0.537, 0.528, 0.519, 0.513, 0.503, 0.492, 0.479, 0.468, 0.46, 0.448, 0.438, 0.446, 0.44, 0.441, 0.44, 0.441, 0.44, 0.439, 0.437, 0.436, 0.432, 0.43, 0.429, 0.429, 0.428, 0.43, 0.43, 0.43, 0.43, 0.428, 0.428], [0.362, 0.355, 0.331, 0.308, 0.297, 0.287, 0.277, 0.278, 0.276, 0.272, 0.278, 0.282, 0.285, 0.289, 0.292, 0.288, 0.29, 0.293, 0.293, 0.292, 0.273, 0.284, 0.286, 0.289, 0.288, 0.289, 0.29, 0.291, 0.29, 0.292, 0.294, 0.295, 0.295, 0.295, 0.295, 0.295, 0.295, 0.295, 0.295, 0.295], [0.526, 0.502, 0.462, 0.433, 0.4, 0.381, 0.344, 0.328, 0.297, 0.279, 0.266, 0.251, 0.223, 0.198, 0.202, 0.217, 0.236, 0.247, 0.262, 0.295, 0.352, 0.375, 0.378, 0.381, 0.377, 0.378, 0.378, 0.377, 0.376, 0.368, 0.366, 0.367, 0.37, 0.372, 0.377, 0.382, 0.387, 0.388, 0.384, 0.386], [-0.286, -0.281, -0.259, -0.237, -0.215, -0.177, -0.146, -0.126, -0.117, -0.098, -0.095, -0.1, -0.099, -0.093, -0.058, -0.021, 0.02, 0.047, 0.088, 0.137, 0.286, 0.271, 0.271, 0.256, 0.261, 0.266, 0.264, 0.263, 0.264, 0.259, 0.257, 0.256, 0.255, 0.254, 0.251, 0.249, 0.247, 0.244, 0.24, 0.24], [-0.028, -0.036, -0.053, -0.081, -0.093, -0.124, -0.142, -0.15, -0.15, -0.163, -0.175, -0.178, -0.165, -0.16, -0.175, -0.194, -0.221, -0.24, -0.271, -0.314, -0.391, -0.396, -0.399, -0.403, -0.399, -0.401, -0.399, -0.399, -0.398, -0.384, -0.378, -0.378, -0.378, -0.379, -0.383, -0.384, -0.386, -0.386, -0.381, -0.381], [-0.005, -0.036, -0.092, -0.183, -0.235, -0.272, -0.307, -0.343, -0.401, -0.458, -0.505, -0.562, -0.606, -0.64, -0.642, -0.642, -0.628, -0.621, -0.593, -0.551, -0.444, -0.446, -0.454, -0.472, -0.478, -0.48, -0.487, -0.492, -0.498, -0.506, -0.509, -0.512, -0.514, -0.517, -0.525, -0.528, -0.532, -0.536, -0.541, -0.543]];
  const CHUNK_GRIP = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
  const ARM_NAMES = ["Vai pitch", "Vai roll", "Vai yaw", "Khuỷu", "Cổ tay roll", "Cổ tay pitch", "Cổ tay yaw"];
  const ARM_COL = ["oklch(0.45 0.14 262)", "oklch(0.55 0.15 250)", "oklch(0.65 0.12 238)", "oklch(0.5 0.16 285)", "oklch(0.62 0.11 205)", "oklch(0.72 0.1 228)", "oklch(0.4 0.08 240)"];
  const CHUNK_T = {
    vi: { arm: ARM_NAMES, step: "bước", armLbl: "TAY TRÁI · 7 GÓC KHỚP MỤC TIÊU (RAD)", hand: "BÀN TAY TRÁI · MỞ → NẮM", grasp: "nắm táo · bước", grip: "Độ nắm bàn tay trái" },
    en: { arm: ["Shoulder pitch", "Shoulder roll", "Shoulder yaw", "Elbow", "Wrist roll", "Wrist pitch", "Wrist yaw"], step: "step", armLbl: "LEFT ARM · 7 TARGET JOINT ANGLES (RAD)", hand: "LEFT HAND · OPEN → CLOSED", grasp: "grasp · step", grip: "Left-hand grip" },
    ja: { arm: ["肩 pitch", "肩 roll", "肩 yaw", "肘", "手首 roll", "手首 pitch", "手首 yaw"], step: "ステップ", armLbl: "左腕 · 目標関節角 7 つ (RAD)", hand: "左手 · 開 → 握", grasp: "把持 · ステップ", grip: "左手の握り" },
  };
  function setupChunk(box) {
    const L = langOf(box), t = CHUNK_T[L] || CHUNK_T.vi;
    const svg = R.$("[data-chunk-svg]", box), leg = R.$("[data-chunk-leg]", box);
    const X0 = 46, X1 = 626, sx = i => X0 + i / 39 * (X1 - X0);
    const all = CHUNK_ARM.flat(), lo = Math.min(...all) - 0.05, hi = Math.max(...all) + 0.05;
    const A0 = 22, A1 = 158, sy = v => A1 - (v - lo) / (hi - lo) * (A1 - A0);
    const H0 = 186, H1 = 226, gy = v => H1 - v * (H1 - H0);
    const grasp = CHUNK_GRIP.findIndex(v => v > 0.5);
    const bw = L === "vi" ? 78 : Math.max(78, Math.round(tlen(`${t.grasp} ${grasp + 1}`) * 5.2 + 14)); // grasp badge width
    const line = (pts, col, w) => `<path d="M${pts.map((v, i) => `${sx(i).toFixed(1)},${v.toFixed(1)}`).join(" L")}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    let grid = "";
    for (let v = Math.ceil(lo * 4) / 4; v <= hi; v += 0.25) grid += `<line x1="${X0}" y1="${sy(v)}" x2="${X1}" y2="${sy(v)}" stroke="#e6eaf0"/><text x="${X0 - 6}" y="${sy(v) + 3}" text-anchor="end" class="r2s-lbl" style="font-size:8px;fill:#8a93a0">${fmt(v, 2, L)}</text>`;
    const ticks = [0, 9, 19, 29, 39].map(i => `<line x1="${sx(i)}" y1="${H1 + 4}" x2="${sx(i)}" y2="${H1 + 8}" stroke="#aeb5bf"/><text x="${sx(i)}" y="${H1 + 19}" text-anchor="${i === 0 ? "start" : i === 39 ? "end" : "middle"}" class="r2s-lbl" style="font-size:8px">${t.step} ${i + 1} · ${fmt((i + 1) * 0.02, 2, L)} s</text>`).join("");
    const steps = Array.from({ length: 40 }, (_, i) => `<rect x="${sx(i) - 5.5}" y="${A0 - 12}" width="11" height="6" rx="1.5" fill="${i === 0 ? A : "oklch(0.86 0.06 250)"}"/>`).join("");
    svg.innerHTML = `
      ${steps}
      ${grid}<text x="${X0}" y="${A1 + 13}" class="r2s-lbl" style="font-size:8px;fill:#5a6170">${t.armLbl}</text>
      ${CHUNK_ARM.map((r, j) => line(r.map(sy), ARM_COL[j], j === 3 ? 2.4 : 1.7)).join("")}
      <rect x="${X0}" y="${H0}" width="${X1 - X0}" height="${H1 - H0}" rx="6" fill="oklch(0.975 0.014 255)"/>
      <path d="M${CHUNK_GRIP.map((v, i) => `${sx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(" L")} L${X1},${H1} L${X0},${H1}Z" fill="oklch(0.86 0.07 225 / .6)"/>
      ${line(CHUNK_GRIP.map(gy), "oklch(0.6 0.12 225)", 2)}
      <text x="${X0 + 6}" y="${H0 + 11}" class="r2s-lbl" style="font-size:8px;fill:#5a6170">${t.hand}</text>
      ${grasp > 0 ? `<line x1="${sx(grasp)}" y1="${A0 - 4}" x2="${sx(grasp)}" y2="${H1}" stroke="${A}" stroke-dasharray="3 3"/><rect x="${sx(grasp) + 4}" y="${H0 - 16}" width="${bw}" height="14" rx="7" fill="#fff" stroke="${LINE}"/><text x="${sx(grasp) + 4 + bw / 2}" y="${H0 - 6}" text-anchor="middle" class="r2s-lbl" style="font-size:8px;fill:oklch(0.42 0.12 255)">${t.grasp} ${grasp + 1}</text>` : ""}
      <line x1="${X0}" y1="${H1 + 4}" x2="${X1}" y2="${H1 + 4}" stroke="#c5ccd6"/>${ticks}`;
    if (leg) leg.innerHTML = t.arm.map((n, j) => `<span><i style="background:${ARM_COL[j]}"></i>${n}</span>`).join("") + `<span><i style="background:oklch(0.86 0.07 225)"></i>${t.grip}</span>`;
  }

  /* ---------------- dual-system architecture */
  // Two lanes: System 2 (top, ~10 Hz) understands, System 1 (bottom, ~120 Hz) acts; the output
  // column on the right spans both lanes and shows the 16-step chunk as bars.
  const MLP = "MLP · RIÊNG TỪNG ROBOT";
  const BLOCKS_BASE = {
    img: { x: 16, y: 40, w: 104, h: 32, k: "ĐẦU VÀO", t: "Ảnh camera", d: "Ảnh từ camera của robot ở thời điểm hiện tại.", p: "Camera đầu G1, 640×480." },
    txt: { x: 16, y: 82, w: 104, h: 32, k: "ĐẦU VÀO", t: "Câu lệnh", d: "Câu lệnh được tách thành token văn bản và được đọc cùng token ảnh.", p: "Vd. \"put the hammer in the bin\"; phải trùng nguyên văn lúc ghi dữ liệu." },
    vis: { x: 148, y: 40, w: 122, h: 32, k: "THỊ GIÁC", t: "Bộ mã hoá ảnh", d: "Chia ảnh thành các ô nhỏ rồi mã hoá thành token hình ảnh. Trong bài báo: SigLIP-2, ảnh 224×224 nén còn 64 token.", p: "N1.7 dùng bộ mã hoá ảnh của Cosmos-Reason2-2B; phần này được tune khi fine-tune." },
    s2: { x: 298, y: 40, w: 190, h: 74, k: "SYSTEM 2 · PHẦN HIỂU", t: "Mô hình ngôn ngữ", sub: "Đọc token ảnh cùng câu lệnh", d: "Đọc cùng lúc token ảnh và câu lệnh để hiểu khung cảnh và yêu cầu. Đặc trưng ở lớp 12 được gửi sang phần hành động. Chạy khoảng 10 lần mỗi giây.", p: "N1.7 dùng Cosmos-Reason2-2B; phần này được đóng băng khi fine-tune." },
    st: { x: 16, y: 178, w: 104, h: 32, k: "ĐẦU VÀO", t: "Trạng thái khớp", d: "Góc các khớp hiện tại của robot.", p: "31 giá trị: tay, bàn tay, eo của G1." },
    senc: { x: 148, y: 178, w: 122, h: 32, k: MLP, t: "State encoder", d: "Mạng MLP nhỏ đổi góc khớp thành token cho DiT. Mỗi loại robot có một bộ riêng, vì số khớp và ý nghĩa từng khớp khác nhau.", p: "G1 được khai báo là robot mới (NEW_EMBODIMENT), nên bộ này phải được học khi fine-tune." },
    noise: { x: 16, y: 232, w: 104, h: 32, k: "FLOW MATCHING", t: "Nhiễu ngẫu nhiên", d: "Phần hành động bắt đầu từ một chuỗi chuyển động nhiễu ngẫu nhiên, rồi khử nhiễu dần qua 4 bước.", p: "Không cần dữ liệu; chỉ là điểm xuất phát của mỗi lần gọi model." },
    aenc: { x: 148, y: 232, w: 122, h: 32, k: MLP, t: "Action encoder", d: "Mã hoá chuỗi chuyển động đang khử nhiễu, cùng với bước khử nhiễu hiện tại, thành token cho DiT.", p: "Riêng cho G1, được học khi fine-tune." },
    s1: { x: 298, y: 178, w: 190, h: 86, k: "SYSTEM 1 · PHẦN HÀNH ĐỘNG", t: "Diffusion Transformer", sub: "Cross-attention tới phần hiểu", d: "Xử lý token trạng thái và token chuyển động bằng self-attention, đồng thời nhìn sang đặc trưng của phần hiểu bằng cross-attention. Phần này dùng chung cho mọi robot.", p: "N1.7 giữ nguyên kiến trúc; được tune khi fine-tune." },
    adec: { x: 516, y: 205, w: 104, h: 32, k: "MLP · RIÊNG", t: "Action decoder", d: "Đổi token đầu ra của DiT thành hướng khử nhiễu cho chuỗi chuyển động. Sau 4 vòng, chuỗi nhiễu trở thành chuyển động hoàn chỉnh.", p: "Đầu ra có kích thước cố định (132 chiều); với G1 chỉ 31 chiều đầu được dùng, phần còn lại là đệm. Bộ trọng số của G1 được học khi fine-tune." },
    out: { x: 642, y: 40, w: 110, h: 260, k: "ĐẦU RA", t: "16 action", sub: "Góc khớp mục tiêu", d: "Chuỗi góc khớp mục tiêu cho các bước tiếp theo; robot làm một đoạn rồi hỏi lại model.", p: "Dự án: 40 bước (táo, búa) hoặc 16 bước (real2sim), 0,8 s chuyển động." },
  };
  // en / ja text for the blocks (positions stay in BLOCKS)
  const BLOCKS_T = {
    en: {
      img: { k: "INPUT", t: "Camera image", d: "Image from the robot's camera at the current moment.", p: "G1 head camera, 640×480." },
      txt: { k: "INPUT", t: "Instruction", d: "The instruction is split into text tokens and read together with the image tokens.", p: "E.g. \"put the hammer in the bin\"; must match the wording used when the data was recorded exactly." },
      vis: { k: "VISION", t: "Image encoder", d: "Splits the image into small patches and encodes them into image tokens. In the paper: SigLIP-2, a 224×224 image compressed to 64 tokens.", p: "N1.7 uses the image encoder of Cosmos-Reason2-2B; this part is tuned during fine-tuning." },
      s2: { k: "SYSTEM 2 · UNDERSTANDING", t: "Language model", sub: "Reads image + text tokens", d: "Reads the image tokens and the instruction together to understand the scene and the request. Features from layer 12 are sent to the acting part. Runs about 10 times per second.", p: "N1.7 uses Cosmos-Reason2-2B; this part is frozen during fine-tuning." },
      st: { k: "INPUT", t: "Joint state", d: "The robot's current joint angles.", p: "31 values: arms, hands, waist of G1." },
      senc: { k: "MLP · PER ROBOT", t: "State encoder", d: "A small MLP that turns joint angles into tokens for the DiT. Each robot type has its own, because the number and meaning of the joints differ.", p: "G1 is declared as a new robot (NEW_EMBODIMENT), so this encoder has to be learned during fine-tuning." },
      noise: { k: "FLOW MATCHING", t: "Random noise", d: "The acting part starts from a chunk of random-noise motion, then denoises it step by step over 4 steps.", p: "Needs no data; it is only the starting point of each model call." },
      aenc: { k: "MLP · PER ROBOT", t: "Action encoder", d: "Encodes the motion chunk being denoised, together with the current denoising step, into tokens for the DiT.", p: "Specific to G1, learned during fine-tuning." },
      s1: { k: "SYSTEM 1 · ACTING", t: "Diffusion Transformer", sub: "Cross-attends to System 2", d: "Processes state tokens and motion tokens with self-attention, while attending to the understanding part's features with cross-attention. This part is shared by all robots.", p: "N1.7 keeps the architecture; tuned during fine-tuning." },
      adec: { k: "MLP · PER ROBOT", t: "Action decoder", d: "Turns the DiT output tokens into the denoising direction for the motion chunk. After 4 rounds, the noisy chunk becomes a complete motion.", p: "The output has a fixed size (132 dimensions); for G1 only the first 31 are used, the rest is padding. The G1 weights are learned during fine-tuning." },
      out: { k: "OUTPUT", t: "16 actions", sub: "Joint targets", d: "A chunk of target joint angles for the next steps; the robot executes part of it, then queries the model again.", p: "Project: 40 steps (apple, hammer) or 16 steps (real2sim), 0.8 s of motion." },
    },
    ja: {
      img: { k: "入力", t: "カメラ画像", d: "現在の時点におけるロボットのカメラ画像です。", p: "G1 頭部カメラ、640×480。" },
      txt: { k: "入力", t: "指示文", d: "指示文はテキストトークンに分割され、画像トークンと一緒に読み込まれます。", p: "例：\"put the hammer in the bin\"。データ記録時と一字一句同じである必要があります。" },
      vis: { k: "視覚", t: "画像エンコーダ", d: "画像を小さなパッチに分割し、画像トークンに符号化します。論文では SigLIP-2 で、224×224 の画像を 64 トークンに圧縮します。", p: "N1.7 は Cosmos-Reason2-2B の画像エンコーダを使用します。この部分はファインチューニング時に調整されます。" },
      s2: { k: "SYSTEM 2 · 理解部", t: "言語モデル", sub: "画像トークンと指示文を読む", d: "画像トークンと指示文を同時に読み込み、シーンと要求を理解します。第 12 層の特徴量を行動部に送ります。毎秒約 10 回動作します。", p: "N1.7 は Cosmos-Reason2-2B を使用します。この部分はファインチューニング時に凍結されます。" },
      st: { k: "入力", t: "関節状態", d: "ロボットの現在の関節角です。", p: "31 個の値：G1 の腕、手、腰。" },
      senc: { k: "MLP · ロボット別", t: "State encoder", d: "関節角を DiT 用のトークンに変換する小さな MLP です。関節の数と意味が異なるため、ロボットの種類ごとに専用のものを持ちます。", p: "G1 は新しいロボット（NEW_EMBODIMENT）として宣言されるため、ファインチューニング時にこの部分を学習する必要があります。" },
      noise: { k: "FLOW MATCHING", t: "ランダムノイズ", d: "行動部はランダムノイズの動作列から始め、4 ステップでノイズを少しずつ除去します。", p: "データは不要で、各モデル呼び出しの出発点にすぎません。" },
      aenc: { k: "MLP · ロボット別", t: "Action encoder", d: "ノイズ除去中の動作列を、現在のノイズ除去ステップとともに DiT 用のトークンに符号化します。", p: "G1 専用で、ファインチューニング時に学習されます。" },
      s1: { k: "SYSTEM 1 · 行動部", t: "Diffusion Transformer", sub: "理解部への cross-attention", d: "状態トークンと動作トークンを self-attention で処理し、同時に cross-attention で理解部の特徴量を参照します。この部分はすべてのロボットで共通です。", p: "N1.7 はアーキテクチャを維持し、ファインチューニング時に調整されます。" },
      adec: { k: "MLP · 専用", t: "Action decoder", d: "DiT の出力トークンを、動作列のノイズ除去方向に変換します。4 回繰り返すと、ノイズの列が完全な動作になります。", p: "出力は固定サイズ（132 次元）で、G1 では先頭の 31 次元のみを使用し、残りはパディングです。G1 用の重みはファインチューニング時に学習されます。" },
      out: { k: "出力", t: "16 アクション", sub: "目標関節角", d: "次のステップ群に対する目標関節角の列です。ロボットは一部を実行してから、再びモデルに問い合わせます。", p: "プロジェクト：40 ステップ（リンゴ、ハンマー）または 16 ステップ（real2sim）、0.8 s の動作。" },
    },
  };
  const ARCH_T = {
    vi: { s2: "SYSTEM 2 · HIỂU · ~10 Hz", s1: "SYSTEM 1 · HÀNH ĐỘNG · ~120 Hz", feat: "đặc trưng lớp 12", loop: "lặp 4 bước khử nhiễu", proj: "Trong dự án:", sp: " " },
    en: { s2: "SYSTEM 2 · UNDERSTANDING · ~10 Hz", s1: "SYSTEM 1 · ACTING · ~120 Hz", feat: "layer-12 features", loop: "4 denoising steps, repeated", proj: "In the project:", sp: " " },
    ja: { s2: "SYSTEM 2 · 理解 · ~10 Hz", s1: "SYSTEM 1 · 行動 · ~120 Hz", feat: "第 12 層の特徴量", loop: "ノイズ除去を 4 回反復", proj: "本プロジェクトでは：", sp: "" },
  };
  function setupArch(box) {
    const L = langOf(box), T = ARCH_T[L] || ARCH_T.vi, S = L === "vi" ? "" : "-" + L; // S: suffix for SVG ids, unique per copy
    const BLOCKS = BLOCKS_T[L] ? Object.fromEntries(Object.entries(BLOCKS_BASE).map(([id, b]) => [id, Object.assign({}, b, BLOCKS_T[L][id])])) : BLOCKS_BASE;
    const svg = R.$("[data-arch-svg]", box), out = R.$("[data-arch-out]", box);
    let sel = "s2";
    // straight, axis-aligned connector: a small port dot at the start, slim arrowhead at the end
    const arrow = (x1, y1, x2, y2) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${A}" stroke-width="1.6" stroke-linecap="round" fill="none" marker-end="url(#mdArr${S})" class="md-flow"/><circle cx="${x1}" cy="${y1}" r="2.6" fill="#fff" stroke="${A}" stroke-width="1.4"/>`;
    const pill = (x, y, t) => { const w = tlen(t) * 5.6 + 14; return `<rect x="${x - w / 2}" y="${y - 8}" width="${w}" height="16" rx="8" fill="#fff" stroke="${LINE}"/><text x="${x}" y="${y + 3}" text-anchor="middle" class="r2s-lbl" style="font-size:8.5px;fill:oklch(0.42 0.12 255)">${t}</text>`; };
    function render() {
      const B = BLOCKS;
      const blocks = Object.entries(B).map(([id, b]) => {
        const on = id === sel, big = !!b.sub;
        const k = on ? "rgba(255,255,255,.75)" : A, t = on ? "#fff" : INK, sub = on ? "rgba(255,255,255,.82)" : "#5a6170";
        const fill = on ? `url(#mdSel${S})` : big ? `url(#mdBig${S})` : "#fff";
        let extra = "";
        if (!big && !on) extra += `<rect x="${b.x + 1}" y="${b.y + 9}" width="3" height="${b.h - 18}" rx="1.5" fill="${A}" opacity=".55"/>`;
        if (b.sub) extra += `<text x="${b.x + 14}" y="${b.y + 57}" style="font:500 10px 'Be Vietnam Pro',sans-serif;fill:${sub}">${b.sub}</text>`;
        if (id === "out") // the chunk itself: 16 bars, one per future step
          extra += Array.from({ length: 16 }, (_, i) => {
            const w = (b.w - 28) * (0.38 + 0.62 * (0.5 + 0.5 * Math.sin(i / 2.6 + 0.6)));
            return `<rect x="${b.x + 14}" y="${b.y + 74 + i * 7}" width="${w.toFixed(1)}" height="4" rx="2" fill="${on ? "rgba(255,255,255,.85)" : `url(#mdBar${S})`}"/>`;
          }).join("") + `<text x="${b.x + 14}" y="${b.y + b.h - 8}" class="r2s-lbl" style="font-size:7.5px;fill:${on ? "rgba(255,255,255,.7)" : "#8a93a0"}">t+1 … t+16</text>`;
        return `<g class="md-block" data-b="${id}" tabindex="0" role="button" aria-label="${b.t}" filter="url(#mdSh${S})">
          <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${fill}" stroke="${on ? "none" : LINE}" stroke-width="1"/>
          <text x="${b.x + 14}" y="${b.y + (big ? 19 : 14)}" class="r2s-lbl" style="fill:${k};font-size:${big ? 8 : 7}px;letter-spacing:.08em">${b.k}</text>
          <text x="${b.x + 14}" y="${b.y + (big ? 39 : 27)}" style="font:700 ${big ? 13.5 : 10.5}px 'Be Vietnam Pro',sans-serif;fill:${t}">${b.t}</text>
          ${extra}
        </g>`;
      }).join("");
      const lane = (y, h, label) => { const w = tlen(label) * 5.4 + 16;
        return `<rect x="8" y="${y}" width="624" height="${h}" rx="14" fill="oklch(0.975 0.014 255)" stroke="oklch(0.92 0.025 255)"/>
          <rect x="20" y="${y + 9}" width="${w}" height="15" rx="7.5" fill="oklch(0.93 0.04 255)"/><text x="${20 + w / 2}" y="${y + 19.5}" text-anchor="middle" class="r2s-lbl" style="font-size:8px;letter-spacing:.06em;fill:oklch(0.42 0.12 255)">${label}</text>`; };
      svg.innerHTML = `
        <defs>
          <marker id="mdArr${S}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,1 L9,5 L0,9 L2.5,5Z" fill="${A}"/></marker>
          <filter id="mdSh${S}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="2.6" flood-color="#1e3a6e" flood-opacity=".12"/></filter>
          <linearGradient id="mdSel${S}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="oklch(0.6 0.14 255)"/><stop offset="1" stop-color="oklch(0.45 0.13 262)"/></linearGradient>
          <linearGradient id="mdBig${S}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="oklch(0.965 0.022 255)"/></linearGradient>
          <linearGradient id="mdBar${S}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="oklch(0.55 0.13 255)"/><stop offset="1" stop-color="oklch(0.78 0.08 240)"/></linearGradient>
        </defs>
        ${lane(12, 112, T.s2)}${lane(134, 186, T.s1)}
        ${arrow(120, 56, 148, 56)}${arrow(270, 56, 298, 56)}${arrow(120, 98, 298, 98)}
        ${arrow(393, 114, 393, 178)}
        ${arrow(120, 194, 148, 194)}${arrow(270, 194, 298, 194)}
        ${arrow(120, 248, 148, 248)}${arrow(270, 248, 298, 248)}
        ${arrow(488, 221, 516, 221)}${arrow(620, 221, 642, 221)}
        <path d="M568,237 V292 H209 V268" stroke="${A}" stroke-width="1.6" stroke-dasharray="4 3" fill="none" marker-end="url(#mdArr${S})"/>
        ${blocks}
        ${pill(393, 146, T.feat)}${pill(388, 292, T.loop)}`;
      R.$$(".md-block", svg).forEach(g => {
        const go = () => { sel = g.dataset.b; render(); };
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      const b = BLOCKS[sel];
      out.innerHTML = `<span class="ds-k">${b.k}</span><b class="mo-h">${b.t}</b><p class="ds-note">${b.d}</p><p class="ds-note"><b>${T.proj}</b>${T.sp}${b.p}</p>`;
    }
    render();
  }

  /* ---------------- flow matching */
  function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  const FLOW_TEXT = [
    ["Bắt đầu từ nhiễu", "Chuỗi 16 action được khởi tạo ngẫu nhiên: chưa có ý nghĩa gì."],
    ["Bước 1", "Model nhìn đặc trưng ảnh + câu lệnh và trạng thái khớp, ước lượng hướng cần đẩy chuỗi về phía chuyển động thật, rồi đi một bước theo hướng đó."],
    ["Bước 2", "Lặp lại: hình dạng tổng thể của chuyển động đã hiện ra, nhiễu giảm còn một nửa."],
    ["Bước 3", "Các chi tiết nhỏ được chỉnh dần; chuỗi gần như mượt."],
    ["Kết quả", "Sau 4 bước, chuỗi là một chuyển động liền mạch, sẵn sàng gửi xuống robot. Toàn bộ mất 63,9 ms trên GPU L40 (bài báo)."],
  ];
  function setupFlow(box) {
    const svg = R.$("[data-flow-svg]", box), out = R.$("[data-flow-out]", box), btns = R.$$("[data-flow-k]", box);
    const N = 16, X0 = 46, X1 = 506, Y0 = 196, Y1 = 26;
    const sx = i => X0 + i / (N - 1) * (X1 - X0), sy = v => (Y0 + Y1) / 2 - v * (Y0 - Y1) / 2.6;
    const target = Array.from({ length: N }, (_, i) => { const u = i / (N - 1); return -0.8 + 1.6 * (u * u * (3 - 2 * u)) - 0.25 * Math.sin(u * Math.PI); });
    let seed = 3, noise = [], k = 0, timer = null;
    const newNoise = () => { const r = rng(seed++ * 7919); noise = target.map(() => (r() * 2 - 1) * 1.15); };
    const at = kk => target.map((t, i) => (1 - kk / 4) * noise[i] + (kk / 4) * t); // straight path noise → data
    function render() {
      btns.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.flowK === k)));
      const line = a => a.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join("");
      const ghosts = Array.from({ length: k }, (_, j) => `<path d="${line(at(j))}" fill="none" stroke="${A}" stroke-opacity="${0.1 + j * 0.06}" stroke-width="1.4"/>`).join("");
      const cur = at(k);
      const arrows = k < 4 ? cur.map((v, i) => { const nx = at(k + 1)[i]; return Math.abs(nx - v) > 0.04 ? `<line x1="${sx(i)}" y1="${sy(v)}" x2="${sx(i)}" y2="${sy(nx) + (nx > v ? 5 : -5)}" stroke="#8a93a0" stroke-width="1.2" marker-end="url(#flArr)"/>` : ""; }).join("") : "";
      svg.innerHTML = `
        <defs><marker id="flArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10Z" fill="#8a93a0"/></marker></defs>
        <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#c5ccd6"/>
        ${Array.from({ length: N }, (_, i) => `<line x1="${sx(i)}" y1="${Y0}" x2="${sx(i)}" y2="${Y0 + 4}" stroke="#aeb5bf"/>`).join("")}
        ${lbl(X0, Y0 + 18, "action 1")}${lbl(X1 - 50, Y0 + 18, "action 16")}${lbl(6, 14, "GÓC KHỚP")}
        ${ghosts}${arrows}
        <path d="${line(cur)}" fill="none" stroke="${A}" stroke-width="2.6"/>
        ${cur.map((v, i) => `<circle cx="${sx(i)}" cy="${sy(v)}" r="4" fill="${A}"/>`).join("")}
        ${lbl(X1 - 170, 18, k < 4 ? "mũi tên: hướng model đẩy chuỗi" : "chuỗi cuối cùng gửi xuống robot")}`;
      const [h, d] = FLOW_TEXT[k];
      out.innerHTML = `<span class="ds-k">BƯỚC ${k} / 4 · CÒN ${100 - k * 25} % NHIỄU</span><b class="mo-h">${h}</b><p class="ds-note">${d}</p>`;
    }
    const stop = () => { clearInterval(timer); timer = null; };
    btns.forEach(b => b.addEventListener("click", () => { stop(); k = +b.dataset.flowK; render(); }));
    R.$("[data-flow-play]", box).addEventListener("click", () => { stop(); k = 0; render(); timer = setInterval(() => { k++; render(); if (k >= 4) stop(); }, 900); });
    R.$("[data-flow-new]", box).addEventListener("click", () => { stop(); newNoise(); k = 0; render(); });
    R.on("section:shown", sec => { if (!sec.contains(box)) stop(); });
    newNoise(); k = 2; render(); // first picture: halfway, so the idea reads without clicking
  }

  /* ---------------- data pyramid */
  const LAYERS = [
    { id: "top", k: "ĐỈNH · ÍT NHẤT", t: "Teleop robot thật", d: "Người điều khiển robot thật để ghi demo: chất lượng cao nhất nhưng đắt và chậm.", s: "Đắt nhất, ít nhất", p: ["Dataset G1 thật của NVIDIA: 1.095 quỹ đạo (kịch bản 2)", "Teleop trong mô phỏng: 208 demo táo (NVIDIA), 300 demo búa (dự án)"] },
    { id: "mid", k: "GIỮA", t: "Dữ liệu tổng hợp", d: "Sinh từ mô phỏng hoặc từ model sinh video: nhân dữ liệu lên khoảng 10 lần với chi phí thấp.", s: "Nhân dữ liệu ~10×", p: ["Real2sim: 790 + 89 episode mô phỏng (kịch bản 2)", "Sinh thêm demo: 100 demo búa trong ~17 phút (kịch bản 3)", "Chi tiết ở mục II.04"] },
    { id: "bot", k: "ĐÁY · NHIỀU NHẤT", t: "Video người", d: "Video người làm việc: rất nhiều nhưng không có nhãn hành động; GR00T tự học \"mã hành động\" từ cặp khung hình liên tiếp.", s: "Rẻ nhất, nhiều nhất", p: ["Không dùng trực tiếp", "Đã nằm sẵn trong checkpoint pre-train của NVIDIA"] },
  ];
  function setupPyr(box) {
    const svg = R.$("[data-pyr-svg]", box), out = R.$("[data-pyr-out]", box);
    let sel = "mid";
    const geo = { top: [[260, 20], [208, 92], [312, 92]], mid: [[204, 98], [316, 98], [380, 178], [140, 178]], bot: [[136, 184], [384, 184], [450, 260], [70, 260]] };
    function render() {
      const shapes = LAYERS.map((L, i) => {
        const pts = geo[L.id].map(p => p.join(",")).join(" "), on = L.id === sel;
        const cy = [70, 146, 230][i];
        const used = L.id !== "bot";
        return `<g class="md-block" data-l="${L.id}" tabindex="0" role="button" aria-label="${L.t}">
          <polygon points="${pts}" fill="${on ? A : used ? "oklch(0.9 0.05 255)" : "#eef0f3"}" stroke="#fff" stroke-width="3"/>
          <text x="260" y="${cy - 4}" text-anchor="middle" style="font:700 ${i ? 15 : 12.5}px 'Be Vietnam Pro',sans-serif;fill:${on ? "#fff" : INK}">${L.t}</text>
          <text x="260" y="${cy + 12}" text-anchor="middle" class="r2s-lbl" style="fill:${on ? "#dfe8ff" : "#5a6170"}">${L.s}</text></g>`;
      }).join("");
      svg.innerHTML = `${shapes}
        <defs><marker id="pyArr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 L2.5,5Z" fill="#9aa3ad"/></marker></defs>
        <line x1="478" y1="34" x2="478" y2="244" stroke="#b5bcc6" stroke-width="1.4" marker-start="url(#pyArr)" marker-end="url(#pyArr)"/>
        <text x="478" y="22" text-anchor="middle" class="r2s-lbl" style="font-size:11px">đắt</text>
        <text x="478" y="262" text-anchor="middle" class="r2s-lbl" style="font-size:11px">rẻ</text>`;
      R.$$(".md-block", svg).forEach(g => {
        const go = () => { sel = g.dataset.l; render(); };
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      const L = LAYERS.find(x => x.id === sel);
      out.innerHTML = `<span class="ds-k">${L.k}</span><b class="mo-h">${L.t}</b><p class="ds-note">${L.d}</p>
        <span class="ds-k">DỰ ÁN DÙNG</span><ul>${L.p.map(x => `<li><span>${x}</span></li>`).join("")}</ul>`;
    }
    render();
  }

  R.model = {
    init() {
      if (!R.$("#nghien-cuu")) return;
      const map = { arch: setupArch, flow: setupFlow, pyr: setupPyr, body: setupBody, chunk: setupChunk };
      R.$$("[data-md]").forEach(box => { try { map[box.dataset.md] && map[box.dataset.md](box); } catch (e) { console.error("model", box.dataset.md, e); } });
    },
  };
})();
