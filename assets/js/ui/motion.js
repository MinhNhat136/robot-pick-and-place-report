/* Interactive explainers for section II.03 (motion research), drawn in fixed-viewBox SVG:
   [data-mo="body"] joint map of G1 by controller group     [data-mo="fk"]  3-joint arm, forward kinematics
   [data-mo="ik"]   2-joint arm, analytic IK, click to aim   [data-mo="pd"]  PD step response (ωn, ζ)
   [data-mo="bal"]  centre of mass vs support, gravity in the body frame
   [data-mo="rate"] joint-rate limiter on a step command (0,2 rad per 20 ms tick)
   All schematic; numbers shown come from the report text (ωn = 10·2π, ζ = 2, 0,2 rad/tick, 1,05 rad). */
(function () {
  "use strict";
  const R = window.Report;
  const A = "oklch(0.52 0.13 255)", INK = "#1f2a3a", MUTE = "#aeb5bf";
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const rd = (d, L = "vi") => fmt(rad(d), 2, L) + " rad";   // sliders work in degrees, the report shows radians
  const fmt = (x, d = 1, L = "vi") => { const s = x.toFixed(d); return (L === "vi" ? s.replace(".", ",") : s).replace("-", "−"); };
  const lbl = (x, y, t, extra = "") => `<text x="${x}" y="${y}" class="r2s-lbl" ${extra}>${t}</text>`;
  const langOf = box => (box.closest("[data-i18n]")?.dataset.i18n) || "vi";

  /* strings written by the widgets, per language copy of the section */
  const TX = {
    vi: {
      bodySel: n => `${n} khớp được chọn`, bodyLeg1: "xanh: GR00T · xám đậm: AGILE", bodyLeg2: "vòng tròn: gốc (xương chậu)",
      torso: "thân", table: "mặt bàn", hand: "bàn tay",
      fkK: "KẾT QUẢ FK", fkT: ["tay", "vai", "khuỷu", "cổ tay"],
      fkX: x => `Bàn tay ${x >= 0 ? "phía trước" : "phía sau"} vai`, fkZ: z => `Bàn tay ${z >= 0 ? "cao hơn" : "thấp hơn"} vai`,
      fkNote: "Mỗi khớp thêm một phép quay và một đoạn dịch; nhân lần lượt từ vai ra ngoài là ra vị trí bàn tay. Robot thật làm vậy trong 3D, cho mọi khâu.",
      reach: "giới hạn tầm với", target: "đích", ikK: "LỜI GIẢI IK", ikQ1: "Góc vai", ikQ2: "Góc khuỷu", ikD: "Khoảng cách tới đích",
      ikOk: "✓ Đạt đích: cổ tay trùng điểm đích", ikBad: "✗ Ngoài tầm với: tay duỗi hết cỡ và đứng im, không báo lỗi",
      pdTgt: "góc mục tiêu", pdY: "GÓC KHỚP (tỉ lệ so với bước nhảy)", pdRef: "nét chấm xám: cấu hình của dự án",
      pdUnder: "giảm xóc yếu: khớp vọt quá đích rồi rung qua lại", pdCrit: "vừa đủ giảm xóc: tới đích nhanh nhất mà không vọt lố", pdOver: "giảm xóc mạnh: tới đích êm, không vọt lố",
      pdK: "ĐÁP ỨNG", pd90: "Tới 90 % đích", pdOs: "Vọt lố", pdSet: "Ổn định trong ±2 %",
      pdNote: "Tần số riêng cao thì bám nhanh hơn nhưng motor phải tạo mô-men lớn hơn; dự án chọn ζ = 2 để tay không rung.",
      rtX: "tick (mỗi tick 20 ms)", rtY: "GÓC KHỚP (rad)", rtCmd: "lệnh từ model (nét đứt)", rtK: "KẾT QUẢ",
      rtJump: "Bước nhảy của lệnh", rtMax: "Tối đa mỗi tick", rtN: "Số tick bị làm chậm",
      rtBad: (n, ms) => `Lệnh bị chia thành ${n} bước nhỏ, mất ${ms} ms thay vì 20 ms`, rtOk: "✓ Bước nhảy nhỏ: đi qua nguyên vẹn",
    },
    en: {
      bodySel: n => `${n} joints selected`, bodyLeg1: "blue: GR00T · dark grey: AGILE", bodyLeg2: "circle: root (pelvis)",
      torso: "torso", table: "table", hand: "hand",
      fkK: "FK RESULT", fkT: ["hand", "shoulder", "elbow", "wrist"],
      fkX: x => `Hand ${x >= 0 ? "in front of" : "behind"} shoulder`, fkZ: z => `Hand ${z >= 0 ? "above" : "below"} shoulder`,
      fkNote: "Each joint adds one rotation and one translation; multiplying them in turn from the shoulder outward gives the hand position. The real robot does this in 3D, for every link.",
      reach: "reach limit", target: "target", ikK: "IK SOLUTION", ikQ1: "Shoulder angle", ikQ2: "Elbow angle", ikD: "Distance to target",
      ikOk: "✓ Target reached: wrist coincides with the target", ikBad: "✗ Out of reach: the arm stretches fully and stays still, no error reported",
      pdTgt: "target angle", pdY: "JOINT ANGLE (fraction of the step)", pdRef: "grey dotted line: project setting",
      pdUnder: "underdamped: the joint overshoots the target and oscillates", pdCrit: "critically damped: fastest to the target without overshoot", pdOver: "overdamped: reaches the target smoothly, no overshoot",
      pdK: "RESPONSE", pd90: "Reach 90 % of target", pdOs: "Overshoot", pdSet: "Settle within ±2 %",
      pdNote: "A higher natural frequency tracks faster but requires more motor torque; the project chooses ζ = 2 so the arm does not oscillate.",
      rtX: "tick (20 ms per tick)", rtY: "JOINT ANGLE (rad)", rtCmd: "command from the model (dashed)", rtK: "RESULT",
      rtJump: "Command step size", rtMax: "Maximum per tick", rtN: "Ticks slowed down",
      rtBad: (n, ms) => `Command split into ${n} small steps, taking ${ms} ms instead of 20 ms`, rtOk: "✓ Small step: passes through unchanged",
    },
    ja: {
      bodySel: n => `${n} 関節を選択中`, bodyLeg1: "青：GR00T · 濃い灰色：AGILE", bodyLeg2: "円：根元（骨盤）",
      torso: "胴体", table: "テーブル面", hand: "手",
      fkK: "FK の結果", fkT: ["手", "肩", "肘", "手首"],
      fkX: x => `手は肩より${x >= 0 ? "前方" : "後方"}`, fkZ: z => `手は肩より${z >= 0 ? "上" : "下"}`,
      fkNote: "各関節が回転 1 つと並進 1 つを加え、肩から外側へ順に掛け合わせると手の位置が得られます。実機ロボットはこれを 3D で、すべてのリンクについて行います。",
      reach: "到達範囲の限界", target: "目標", ikK: "IK の解", ikQ1: "肩の角度", ikQ2: "肘の角度", ikD: "目標までの距離",
      ikOk: "✓ 到達：手首が目標点と一致", ikBad: "✗ 到達範囲外：腕は伸びきって静止し、エラーは出ません",
      pdTgt: "目標角度", pdY: "関節角度（ステップ量に対する比）", pdRef: "灰色の点線：プロジェクトの設定",
      pdUnder: "減衰不足：関節が目標を行き過ぎて振動", pdCrit: "臨界減衰：オーバーシュートなしで最速に目標へ到達", pdOver: "過減衰：滑らかに目標へ到達、オーバーシュートなし",
      pdK: "応答", pd90: "目標の 90 % に到達", pdOs: "オーバーシュート", pdSet: "±2 % 以内に整定",
      pdNote: "固有振動数が高いほど追従は速くなりますが、モーターはより大きなトルクを出す必要があります。プロジェクトでは腕が振動しないよう ζ = 2 を選択しています。",
      rtX: "tick（1 tick = 20 ms）", rtY: "関節角度 (rad)", rtCmd: "モデルからの指令（破線）", rtK: "結果",
      rtJump: "指令のステップ量", rtMax: "1 tick あたりの最大値", rtN: "減速された tick 数",
      rtBad: (n, ms) => `指令は ${n} 個の小ステップに分割され、20 ms ではなく ${ms} ms かかります`, rtOk: "✓ 小さなステップ：そのまま通過",
    },
  };

  /* ---------------- joint map */
  function setupBody(box) {
    const svg = R.$("[data-body-svg]", box), btns = R.$$("[data-g]", box), t = TX[langOf(box)] || TX.vi;
    const P = { head: [130, 28], neck: [130, 50], sL: [94, 66], sR: [166, 66], eL: [80, 118], eR: [180, 118], wL: [74, 166], wR: [186, 166],
      waist: [130, 140], hL: [114, 160], hR: [146, 160], kL: [112, 228], kR: [148, 228], aL: [110, 292], aR: [150, 292] };
    const J = [];
    const cluster = (g, c, n, dx = 7) => { for (let i = 0; i < n; i++) J.push([g, c[0] + (i - (n - 1) / 2) * dx, c[1]]); };
    ["L", "R"].forEach(s => {
      cluster("leg", P["h" + s], 3); cluster("leg", P["k" + s], 1); cluster("leg", P["a" + s], 2);
      cluster("arm", P["s" + s], 3, 6); cluster("arm", P["e" + s], 1); cluster("arm", P["w" + s], 3, 6);
      const w = P["w" + s], d = s === "L" ? -1 : 1;
      [[-6, 2], [0, 2], [6 * d, 3]].forEach(([ox, n], f) => { for (let i = 0; i < n; i++) J.push(["hand", w[0] + (f === 2 ? ox : ox * d) + d * 2, w[1] + 18 + i * 8 + (f === 2 ? -6 : 0)]); });
    });
    cluster("waist", P.waist, 3);
    let sel = null;
    const seg = (a, b) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`;
    function render() {
      const on = g => !sel || sel === g;
      svg.innerHTML = `
        <g stroke="#c9ced6" stroke-width="9" stroke-linecap="round">${seg("neck", "waist")}${seg("sL", "sR")}${seg("sL", "eL")}${seg("eL", "wL")}${seg("sR", "eR")}${seg("eR", "wR")}${seg("hL", "hR")}${seg("hL", "kL")}${seg("kL", "aL")}${seg("hR", "kR")}${seg("kR", "aR")}</g>
        <circle cx="${P.head[0]}" cy="${P.head[1]}" r="17" fill="#c9ced6"/>
        <rect x="96" y="296" width="26" height="9" rx="4" fill="#c9ced6"/><rect x="138" y="296" width="26" height="9" rx="4" fill="#c9ced6"/>
        <circle cx="130" cy="156" r="5" fill="none" stroke="${INK}" stroke-width="1.5"/>
        ${J.map(([g, x, y]) => `<circle cx="${x}" cy="${y}" r="${g === "hand" ? 2.8 : 3.6}" fill="${on(g) ? (g === "leg" ? "#5d6670" : A) : "#e2e5ea"}" stroke="#fff" stroke-width="1"/>`).join("")}
        ${sel ? lbl(8, 322, t.bodySel(J.filter(j => j[0] === sel).length)) : lbl(8, 312, t.bodyLeg1) + lbl(8, 325, t.bodyLeg2)}`;
      btns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.g === sel)));
    }
    btns.forEach(b => b.addEventListener("click", () => { sel = sel === b.dataset.g ? null : b.dataset.g; render(); }));
    render();
  }

  /* ---------------- arm drawing shared by FK and IK */
  const BASE = [120, 70], L = [96, 84, 30]; // px; 1 px ≈ 0,3 cm (illustrative)
  const CM = 0.3;
  function chain(qs) { // angles relative, 0 = pointing straight down, positive = forward (to the right)
    let a = 0, p = BASE.slice(); const pts = [p.slice()];
    qs.forEach((q, i) => { a += q; p = [p[0] + L[i] * Math.sin(a), p[1] + L[i] * Math.cos(a)]; pts.push(p.slice()); });
    return pts;
  }
  function armSVG(pts, opt = {}) {
    const body = `<rect x="${BASE[0] - 48}" y="20" width="44" height="120" rx="14" fill="#e3e6eb"/><circle cx="${BASE[0] - 26}" cy="8" r="0" />${lbl(BASE[0] - 46, 156, (opt.t || TX.vi).torso)}`;
    const links = pts.slice(1).map((p, i) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="${i === 2 ? "#5d6670" : INK}" stroke-width="${i === 2 ? 8 : 11}" stroke-linecap="round"/>`).join("");
    const joints = pts.slice(0, -1).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#fff" stroke="${A}" stroke-width="3"/>`).join("");
    const tip = pts[pts.length - 1];
    return `<line x1="20" y1="236" x2="370" y2="236" stroke="#d5d9df" stroke-width="2"/>${lbl(24, 252, (opt.t || TX.vi).table)}
      ${body}${opt.extra || ""}${links}${joints}
      <circle cx="${tip[0]}" cy="${tip[1]}" r="6" fill="${A}"/>`;
  }

  function setupFK(box) {
    const svg = R.$("[data-fk-svg]", box), out = R.$("[data-fk-out]", box), qs = R.$$("[data-fk-q]", box);
    const lg = langOf(box), t = TX[lg] || TX.vi;
    function render() {
      const q = qs.map(s => rad(+s.value));
      qs.forEach((s, i) => { R.$(`[data-fk-v="${i}"]`, box).textContent = rd(+s.value, lg); });
      const pts = chain(q), tip = pts[3];
      const trail = pts.map((p, i) => i ? `<line x1="${BASE[0]}" y1="${BASE[1]}" x2="${p[0]}" y2="${p[1]}" stroke="${A}" stroke-opacity=".18" stroke-dasharray="3 3"/>` : "").join("");
      svg.innerHTML = armSVG(pts, { extra: trail, t }) + lbl(tip[0] + 10, tip[1] + 4, t.hand, 'style="fill:oklch(0.4 0.12 255)"');
      const x = (tip[0] - BASE[0]) * CM, z = (BASE[1] - tip[1]) * CM;
      const n = t.fkT;
      out.innerHTML = `<span class="ds-k">${t.fkK}</span>
        <div class="mo-eq">T<sub>${n[0]}</sub> = T<sub>${n[1]}</sub>(${rd(+qs[0].value, lg)}) · T<sub>${n[2]}</sub>(${rd(+qs[1].value, lg)}) · T<sub>${n[3]}</sub>(${rd(+qs[2].value, lg)})</div>
        <ul><li><span>${t.fkX(x)}</span><b>${fmt(Math.abs(x), 1, lg)} cm</b></li><li><span>${t.fkZ(z)}</span><b>${fmt(Math.abs(z), 1, lg)} cm</b></li></ul>
        <p class="ds-note">${t.fkNote}</p>`;
    }
    qs.forEach(s => s.addEventListener("input", render));
    render();
  }

  function setupIK(box) {
    const svg = R.$("[data-ik-svg]", box), out = R.$("[data-ik-out]", box);
    const lg = langOf(box), t = TX[lg] || TX.vi;
    let target = [230, 190], drag = false;
    const reach = L[0] + L[1];
    function solve(t) {
      const dx = t[0] - BASE[0], dy = t[1] - BASE[1];
      let d = Math.hypot(dx, dy), ok = true;
      if (d > reach - 0.5) { d = reach - 0.5; ok = false; }
      const minD = Math.abs(L[0] - L[1]) + 1; if (d < minD) { d = minD; ok = false; }
      const c2 = (d * d - L[0] * L[0] - L[1] * L[1]) / (2 * L[0] * L[1]);
      const q2 = Math.acos(Math.max(-1, Math.min(1, c2))); // elbow bends forward
      const ang = Math.atan2(dx, dy); // 0 = down
      const q1 = ang - Math.atan2(L[1] * Math.sin(q2), L[0] + L[1] * Math.cos(q2));
      return { q: [q1, q2], ok };
    }
    function render() {
      const { q, ok } = solve(target);
      const pts = chain([q[0], q[1], 0]).slice(0, 3);
      const wrist = pts[2];
      const ring = `<circle cx="${BASE[0]}" cy="${BASE[1]}" r="${reach}" fill="none" stroke="${A}" stroke-opacity=".25" stroke-dasharray="4 4"/>${lbl(BASE[0] + reach * 0.62, BASE[1] - reach * 0.62 - 6, t.reach)}`;
      const tgt = `<g stroke="${ok ? A : "#7c848e"}" stroke-width="2"><circle cx="${target[0]}" cy="${target[1]}" r="9" fill="none"/><line x1="${target[0] - 14}" y1="${target[1]}" x2="${target[0] + 14}" y2="${target[1]}"/><line x1="${target[0]}" y1="${target[1] - 14}" x2="${target[0]}" y2="${target[1] + 14}"/></g>`;
      const gap = ok ? "" : `<line x1="${wrist[0]}" y1="${wrist[1]}" x2="${target[0]}" y2="${target[1]}" stroke="#7c848e" stroke-dasharray="3 3"/>`;
      svg.innerHTML = armSVG(pts, { extra: ring + gap, t }) + tgt + lbl(target[0] + 14, target[1] - 12, t.target, 'style="fill:oklch(0.4 0.12 255)"');
      out.innerHTML = `<span class="ds-k">${t.ikK}</span>
        <ul><li><span>${t.ikQ1}</span><b>${fmt(q[0], 2, lg)} rad</b></li><li><span>${t.ikQ2}</span><b>${fmt(q[1], 2, lg)} rad</b></li><li><span>${t.ikD}</span><b>${fmt(Math.hypot(target[0] - BASE[0], target[1] - BASE[1]) * CM, 1, lg)} cm</b></li></ul>
        <div class="gen-verdict ${ok ? "ok" : "bad"}">${ok ? t.ikOk : t.ikBad}</div>`;
    }
    function aim(e) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const m = svg.getScreenCTM(); if (!m) return;
      const p = pt.matrixTransform(m.inverse()); target = [Math.max(10, Math.min(370, p.x)), Math.max(10, Math.min(260, p.y))]; render();
    }
    svg.addEventListener("pointerdown", e => { drag = true; aim(e); try { svg.setPointerCapture(e.pointerId); } catch (_) { /* synthetic events */ } });
    svg.addEventListener("pointermove", e => { if (drag) aim(e); });
    svg.addEventListener("pointerup", () => { drag = false; });
    render();
  }

  /* ---------------- PD step response */
  function setupPD(box) {
    const svg = R.$("[data-pd-svg]", box), out = R.$("[data-pd-out]", box);
    const w = R.$('[data-pd="w"]', box), z = R.$('[data-pd="z"]', box);
    const L = langOf(box), tx = TX[L] || TX.vi;
    const T = 0.4, X0 = 46, X1 = 506, Y0 = 190, Y1 = 30;
    const sx = t => X0 + t / T * (X1 - X0), sy = v => Y0 - v / 1.6 * (Y0 - Y1);
    function sim(fHz, zeta) {
      const wn = 2 * Math.PI * fHz, dt = 0.0002, pts = []; let x = 0, v = 0, peak = 0, t90 = null, settle = 0;
      for (let t = 0; t <= T + 1e-9; t += dt) {
        const a = wn * wn * (1 - x) - 2 * zeta * wn * v; v += a * dt; x += v * dt;
        if (x > peak) peak = x; if (t90 === null && x >= 0.9) t90 = t; if (Math.abs(x - 1) > 0.02) settle = t;
        if (Math.round(t / dt) % 10 === 0) pts.push([t, x]);
      }
      return { pts, over: Math.max(0, peak - 1) * 100, t90, settle };
    }
    function render() {
      const f = +w.value, zeta = +z.value;
      R.$('[data-pd-v="w"]', box).textContent = fmt(f, 1, L) + " Hz"; R.$('[data-pd-v="z"]', box).textContent = fmt(zeta, 2, L);
      const s = sim(f, zeta), ref = sim(10, 2);
      const path = p => p.map(([t, x], i) => `${i ? "L" : "M"}${sx(t).toFixed(1)},${sy(Math.min(1.6, Math.max(-0.1, x))).toFixed(1)}`).join("");
      const ticks = [0, 0.1, 0.2, 0.3, 0.4].map(t => `<line x1="${sx(t)}" y1="${Y0}" x2="${sx(t)}" y2="${Y0 + 4}" stroke="#aeb5bf"/>${lbl(sx(t) - 8, Y0 + 16, fmt(t * 1000, 0, L) + " ms")}`).join("");
      svg.innerHTML = `
        <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#c5ccd6"/>${ticks}
        <line x1="${X0}" y1="${sy(1)}" x2="${X1}" y2="${sy(1)}" stroke="${INK}" stroke-dasharray="6 4" stroke-opacity=".6"/>${lbl(X1 - 92, sy(1) - 6, tx.pdTgt)}
        <rect x="${X0}" y="${sy(1.02)}" width="${X1 - X0}" height="${sy(0.98) - sy(1.02)}" fill="${A}" opacity=".08"/>
        <path d="${path(ref.pts)}" fill="none" stroke="${MUTE}" stroke-width="2" stroke-dasharray="2 3"/>
        <path d="${path(s.pts)}" fill="none" stroke="${A}" stroke-width="2.6"/>
        ${lbl(6, 16, tx.pdY)}${lbl(X1 - 200, Y1 + 14, tx.pdRef)}`;
      const kind = zeta < 1 ? tx.pdUnder : zeta === 1 ? tx.pdCrit : tx.pdOver;
      out.innerHTML = `<span class="ds-k">${tx.pdK}</span>
        <ul><li><span>${tx.pd90}</span><b>${s.t90 === null ? "> 400" : fmt(s.t90 * 1000, 0, L)} ms</b></li><li><span>${tx.pdOs}</span><b>${fmt(s.over, 0, L)} %</b></li><li><span>${tx.pdSet}</span><b>${s.settle >= T - 0.001 ? "> 400" : fmt(s.settle * 1000, 0, L)} ms</b></li></ul>
        <p class="ds-note">ζ ${zeta < 1 ? "<" : "≥"} 1 · ${kind}${L === "ja" ? "。" : "."} ${tx.pdNote}</p>`;
    }
    [w, z].forEach(s => s.addEventListener("input", render));
    R.$$("[data-pd-preset]", box).forEach(b => b.addEventListener("click", () => { const [a, c] = b.dataset.pdPreset.split(","); w.value = a; z.value = c; render(); }));
    render();
  }

  /* ---------------- balance */
  function setupBal(box) {
    const svg = R.$("[data-bal-svg]", box), out = R.$("[data-bal-out]", box), q = R.$("[data-bal-q]", box);
    const FOOT = [150, 230], HALF = 34, H = 130; // support from 116 to 184 px, CoM 130 px above ankles
    function render() {
      const th = +q.value, t = rad(th);
      R.$("[data-bal-v]", box).textContent = rd(th);
      const top = [FOOT[0] + 190 * Math.sin(t), FOOT[1] - 190 * Math.cos(t)];
      const com = [FOOT[0] + H * Math.sin(t), FOOT[1] - H * Math.cos(t)];
      const inside = Math.abs(com[0] - FOOT[0]) <= HALF, fall = Math.abs(th) > 60;
      const state = fall ? "fall" : inside ? "ok" : "warn";
      const gx = th > 0 ? 70 : 310, gy = 70, gl = 34; // gravity seen from the body frame rotates the other way
      svg.innerHTML = `
        <line x1="20" y1="${FOOT[1] + 8}" x2="290" y2="${FOOT[1] + 8}" stroke="#d5d9df" stroke-width="2"/>
        <rect x="${FOOT[0] - HALF}" y="${FOOT[1] + 2}" width="${HALF * 2}" height="10" rx="3" fill="${A}" opacity=".25"/>${lbl(FOOT[0] - HALF, FOOT[1] + 28, "chân đế (giữa hai bàn chân)")}
        <g transform="rotate(${th} ${FOOT[0]} ${FOOT[1]})">
          <rect x="${FOOT[0] - 22}" y="${FOOT[1] - 100}" width="44" height="100" rx="12" fill="#c9ced6"/>
          <rect x="${FOOT[0] - 30}" y="${FOOT[1] - 172}" width="60" height="78" rx="14" fill="#b7bec8"/>
          <circle cx="${FOOT[0]}" cy="${FOOT[1] - 192}" r="16" fill="#b7bec8"/>
        </g>
        <line x1="${com[0]}" y1="${com[1]}" x2="${com[0]}" y2="${FOOT[1] + 6}" stroke="${state === "ok" ? A : "#7c848e"}" stroke-width="2" stroke-dasharray="4 3"/>
        <circle cx="${com[0]}" cy="${com[1]}" r="8" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M${com[0] - 8},${com[1]} A8,8 0 0 1 ${com[0]},${com[1] - 8} L${com[0]},${com[1]}Z M${com[0] + 8},${com[1]} A8,8 0 0 1 ${com[0]},${com[1] + 8} L${com[0]},${com[1]}Z" fill="${INK}"/>
        ${lbl(com[0] + 12, com[1] - 8, "trọng tâm")}
        <rect x="${gx - 50}" y="${gy - 54}" width="100" height="120" rx="10" fill="#fff" stroke="oklch(0.86 0.04 255)"/>
        ${lbl(gx - 44, gy - 40, "KHUNG THÂN")}
        <g transform="rotate(${-th} ${gx} ${gy})"><line x1="${gx}" y1="${gy - gl / 2}" x2="${gx}" y2="${gy + gl / 2}" stroke="${A}" stroke-width="3"/><path d="M${gx - 6},${gy + gl / 2 - 6} L${gx},${gy + gl / 2 + 4} L${gx + 6},${gy + gl / 2 - 6}Z" fill="${A}"/></g>
        ${lbl(gx - 44, gy + 58, "hướng trọng lực")}`;
      const msg = { ok: "✓ Trọng tâm nằm trên chân đế: đứng vững", warn: "! Trọng tâm ra ngoài chân đế: AGILE phải chỉnh chân, nếu không sẽ ngã", fall: "✗ Nghiêng quá 1,05 rad: hệ thống coi là ngã, kết thúc episode" }[state];
      out.innerHTML = `<span class="ds-k">AGILE CẢM NHẬN</span>
        <ul><li><span>Độ nghiêng</span><b>${rd(th)}</b></li><li><span>Trọng tâm lệch khỏi giữa chân đế</span><b>${fmt((com[0] - FOOT[0]) * 0.3, 0)} cm</b></li></ul>
        <div class="gen-verdict ${state === "ok" ? "ok" : "bad"}">${msg}</div>
        <p class="ds-note">AGILE không "nhìn" thấy mình nghiêng; nó suy ra từ <b>hướng trọng lực trong khung thân</b> (mũi tên): thân nghiêng bao nhiêu, mũi tên lệch bấy nhiêu.</p>`;
    }
    q.addEventListener("input", render);
    render();
  }

  /* ---------------- rate limiter */
  function setupRate(box) {
    const svg = R.$("[data-rate-svg]", box), out = R.$("[data-rate-out]", box), q = R.$("[data-rate-q]", box);
    const Lg = langOf(box), t = TX[Lg] || TX.vi;
    const N = 14, STEP = 3, LIM = 0.2, X0 = 46, X1 = 506, Y0 = 176, Y1 = 26, MAXV = 1.25;
    const sx = i => X0 + i / (N - 1) * (X1 - X0), sy = v => Y0 - v / MAXV * (Y0 - Y1);
    function render() {
      const jump = +q.value;
      R.$("[data-rate-v]", box).textContent = fmt(jump, 2, Lg) + " rad";
      const cmd = Array.from({ length: N }, (_, i) => (i >= STEP ? jump : 0));
      const lim = []; cmd.forEach((c, i) => { const p = i ? lim[i - 1] : 0; lim.push(p + Math.max(-LIM, Math.min(LIM, c - p))); });
      const ticks = Math.max(0, Math.ceil(jump / LIM) - 1);
      const stepPath = a => a.map((v, i) => `${i ? `L${sx(i).toFixed(1)},${sy(a[i - 1]).toFixed(1)} ` : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
      svg.innerHTML = `
        <line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#c5ccd6"/>
        ${cmd.map((_, i) => `<line x1="${sx(i)}" y1="${Y0}" x2="${sx(i)}" y2="${Y0 + 4}" stroke="#aeb5bf"/>`).join("")}${lbl(X0, Y0 + 18, t.rtX)}
        <path d="${stepPath(cmd)}" fill="none" stroke="${MUTE}" stroke-width="2.4" stroke-dasharray="5 4"/>
        <path d="${stepPath(lim)}" fill="none" stroke="${A}" stroke-width="2.8"/>
        ${lim.map((v, i) => `<circle cx="${sx(i)}" cy="${sy(v)}" r="3.5" fill="${A}"/>`).join("")}
        ${lbl(6, 14, t.rtY)}${lbl(X1 - 150, sy(jump) - 8, t.rtCmd)}`;
      out.innerHTML = `<span class="ds-k">${t.rtK}</span>
        <ul><li><span>${t.rtJump}</span><b>${fmt(jump, 2, Lg)} rad</b></li><li><span>${t.rtMax}</span><b>${fmt(LIM, 1, Lg)} rad</b></li><li><span>${t.rtN}</span><b>${ticks}</b></li></ul>
        <div class="gen-verdict ${ticks ? "bad" : "ok"}">${ticks ? t.rtBad(ticks + 1, (ticks + 1) * 20) : t.rtOk}</div>`;
    }
    q.addEventListener("input", render);
    render();
  }

  R.motion = {
    init() {
      if (!R.$("#dong-hoc")) return;
      const map = { body: setupBody, fk: setupFK, ik: setupIK, pd: setupPD, bal: setupBal, rate: setupRate };
      R.$$("[data-mo]").forEach(box => { try { map[box.dataset.mo] && map[box.dataset.mo](box); } catch (e) { console.error("motion", box.dataset.mo, e); } });
    },
  };
})();
