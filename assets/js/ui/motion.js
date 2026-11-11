/* Interactive explainers for section II.03 (motion research), drawn in fixed-viewBox SVG:
   [data-mo="body"] joint map of G1 by controller group     [data-mo="fk"]  3-joint arm, forward kinematics
   [data-mo="ik"]   2-joint arm, analytic IK, click to aim   [data-mo="pd"]  PD step response (ωn, ζ)
   [data-mo="bal"]  centre of mass vs support, gravity in the body frame
   [data-mo="rate"] joint-rate limiter on a step command (0,2 rad per 20 ms tick)
   [data-mo="car"]  a car with constant acceleration, position after every physics step
   [data-mo="apple"] a falling apple, height after every 5 ms physics-engine tick (200 Hz), time bar to scrub
   [data-mo="ctl"]  motion tick: 40 joint commands at 50 Hz, each held over 4 physics ticks of PD
   [data-mo="rel"]  how the two ticks nest: GR00T chunk → 40 motion ticks → decimation physics ticks, decimation slider
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

  /* ---------------- car on a road: position after every physics step (semi-implicit Euler) */
  function setupCar(box) {
    const svg = R.$("[data-car-svg]", box), out = R.$("[data-car-out]", box);
    const inp = k => R.$(`[data-car="${k}"]`, box);
    const Lg = langOf(box);
    const CT = {
      vi: { road: "mặt đường", start: "xuất phát", x: "vị trí x (m)", t: "thời gian t (s)", exact: "công thức chính xác (liên tục)", dots: "vị trí tính được sau mỗi bước",
            k: "BƯỚC HIỆN TẠI", step: "Bước", time: "Thời điểm t", vel: "Vận tốc v", pos: "Vị trí x", m: "m", ms: "ms", s: "s", mps: "m/s", mps2: "m/s²",
            idle: "Bấm ▶ Chạy để xem xe đi qua từng bước vật lý.", run: "Đang chạy · chậm 2× · xe chỉ nhảy tới vị trí mới khi một bước vật lý kết thúc",
            done: (n, xc, xe, d, p) => `Sau 2 s (${n} bước): tính được <b>${xc} m</b>, đúng là <b>${xe} m</b>, sai <b>${d} m</b> (${p} %)`,
            play: "▶ Chạy", pause: "❚❚ Dừng" },
      en: { road: "road", start: "start", x: "position x (m)", t: "time t (s)", exact: "exact formula (continuous)", dots: "position computed after each step",
            k: "CURRENT STEP", step: "Step", time: "Time t", vel: "Velocity v", pos: "Position x", m: "m", ms: "ms", s: "s", mps: "m/s", mps2: "m/s²",
            idle: "Press ▶ Run to watch the car move through each physics step.", run: "Running · 2× slower · the car only jumps to its new position when a physics step ends",
            done: (n, xc, xe, d, p) => `After 2 s (${n} steps): computed <b>${xc} m</b>, exact <b>${xe} m</b>, error <b>${d} m</b> (${p} %)`,
            play: "▶ Run", pause: "❚❚ Pause" },
      ja: { road: "道路", start: "スタート", x: "位置 x (m)", t: "時間 t (秒)", exact: "厳密な式（連続）", dots: "各ステップ後に計算された位置",
            k: "現在のステップ", step: "ステップ", time: "時刻 t", vel: "速度 v", pos: "位置 x", m: "m", ms: "ms", s: "秒", mps: "m/s", mps2: "m/s²",
            idle: "▶ 実行 を押すと、車が物理ステップごとに進む様子を見られます。", run: "実行中 · 2 倍スロー · 車は物理ステップが終わったときだけ新しい位置へ跳ぶ",
            done: (n, xc, xe, d, p) => `2 秒後（${n} ステップ）：計算値 <b>${xc} m</b>、厳密値 <b>${xe} m</b>、誤差 <b>${d} m</b>（${p} %）`,
            play: "▶ 実行", pause: "❚❚ 一時停止" },
    }[Lg] || null;
    const t = CT || {};
    const DTS = [0.005, 0.02, 0.05, 0.1, 0.2], T = 2, SLOW = 2;
    const X0 = 46, X1 = 506, RY = 34, RH = 40, PY0 = 214, PY1 = 112;
    const playBtn = R.$("[data-car-play]", box), resetBtn = R.$("[data-car-reset]", box);
    let steps = [], xmax = 1, shown = 0, raf = 0, t0 = 0;

    function compute() {
      const dt = DTS[+inp("dt").value], v0 = +inp("v0").value, a = +inp("a").value;
      R.$('[data-car-v="dt"]', box).textContent = `${fmt(dt * 1000, 0, Lg)} ${t.ms}`;
      R.$('[data-car-v="v0"]', box).textContent = `${fmt(v0, 1, Lg)} ${t.mps}`;
      R.$('[data-car-v="a"]', box).textContent = `${fmt(a, 1, Lg)} ${t.mps2}`;
      const n = Math.round(T / dt);
      steps = [{ n: 0, t: 0, v: v0, x: 0 }];
      let v = v0, x = 0;
      for (let i = 1; i <= n; i++) { v += a * dt; x += v * dt; steps.push({ n: i, t: i * dt, v, x }); }
      const exact = tt => v0 * tt + 0.5 * a * tt * tt;
      const top = Math.max(exact(T), x, 1);
      xmax = Math.ceil(top / 5) * 5 + (top % 5 > 4 ? 5 : 0);
      return { dt, v0, a, exact };
    }
    let P = compute();

    function car(px) {
      return `<g transform="translate(${(px - 34).toFixed(1)},${RY + 6})">
        <path d="M2 18 L6 9 Q8 5 13 5 L24 5 Q28 5 31 9 L36 15 L36 22 L2 22 Z" fill="${A}"/>
        <path d="M10 10 L13 7 L19 7 L19 12 L10 12 Z M21 7 L25 7 L29 12 L21 12 Z" fill="#dfe9f7"/>
        <circle cx="10" cy="23" r="4" fill="${INK}"/><circle cx="28" cy="23" r="4" fill="${INK}"/></g>`;
    }

    function render(k) {
      shown = k;
      const s = steps[k], last = steps.length - 1;
      const sx = x => X0 + (X1 - X0) * x / xmax, st = tt => X0 + (X1 - X0) * tt / T, sy = x => PY0 - (PY0 - PY1) * x / xmax;
      const every = Math.max(1, Math.ceil(last / 10));
      let g = `<rect x="${X0 - 10}" y="${RY}" width="${X1 - X0 + 20}" height="${RH}" rx="6" fill="#e9ecef"/>
        <line x1="${X0 - 10}" y1="${RY + RH - 6}" x2="${X1 + 10}" y2="${RY + RH - 6}" stroke="#fff" stroke-width="2" stroke-dasharray="10 8"/>`;
      for (let m = 0; m <= xmax; m += 5) g += `<line x1="${sx(m)}" y1="${RY + RH}" x2="${sx(m)}" y2="${RY + RH + 5}" stroke="${MUTE}"/>${lbl(sx(m), RY + RH + 16, `${m}`, 'text-anchor="middle"')}`;
      g += lbl(X0 - 10, RY - 6, `${t.road} · ${t.x}`);
      for (let i = 0; i <= k; i++) {
        const big = i === k;
        g += `<circle cx="${sx(steps[i].x).toFixed(1)}" cy="${RY + RH - 6}" r="${big ? 4.2 : last > 100 ? 1.6 : 2.8}" fill="${big ? "#d08a2e" : A}" opacity="${big ? 1 : .8}"/>`;
        if (last <= 60 && i % every === 0 && i > 0) g += `<text x="${sx(steps[i].x).toFixed(1)}" y="${RY + 13}" class="r2s-lbl" text-anchor="middle" style="font-size:8.5px;fill:#8a929e">${i}</text>`;
      }
      g += car(sx(s.x));
      // x - t plot
      g += `<line x1="${X0}" y1="${PY0}" x2="${X1}" y2="${PY0}" stroke="#c5ccd6"/><line x1="${X0}" y1="${PY0}" x2="${X0}" y2="${PY1 - 6}" stroke="#c5ccd6"/>`;
      for (let q = 0; q <= T; q += 0.5) g += `<line x1="${st(q)}" y1="${PY0}" x2="${st(q)}" y2="${PY0 + 4}" stroke="${MUTE}"/>${lbl(st(q), PY0 + 15, fmt(q, 1, Lg), 'text-anchor="middle"')}`;
      g += lbl(X1, PY0 + 29, t.t, 'text-anchor="end"') + lbl(X0 + 4, PY1 - 10, t.x);
      let path = "";
      for (let i = 0; i <= 80; i++) { const tt = T * i / 80; path += `${i ? "L" : "M"}${st(tt).toFixed(1)},${sy(P.exact(tt)).toFixed(1)}`; }
      g += `<path d="${path}" fill="none" stroke="${MUTE}" stroke-width="2" stroke-dasharray="5 4"/>`;
      for (let i = 0; i <= k; i++) g += `<circle cx="${st(steps[i].t).toFixed(1)}" cy="${sy(steps[i].x).toFixed(1)}" r="${last > 100 ? 1.5 : 2.6}" fill="${i === k ? "#d08a2e" : A}"/>`;
      g += `<line x1="${st(s.t)}" y1="${PY1 - 6}" x2="${st(s.t)}" y2="${PY0}" stroke="#d08a2e" stroke-width="1" stroke-dasharray="2 3"/>`;
      g += `<path d="M${X1 - 236} ${PY1 - 2}h16" stroke="${MUTE}" stroke-width="2" stroke-dasharray="5 4"/>${lbl(X1 - 214, PY1 + 2, t.exact)}`;
      g += `<circle cx="${X1 - 228}" cy="${PY1 + 12}" r="2.8" fill="${A}"/>${lbl(X1 - 214, PY1 + 16, t.dots)}`;
      svg.innerHTML = g;
      const xe = P.exact(s.t), err = Math.abs(steps[last].x - P.exact(T));
      const verdict = k === last && k > 0
        ? `<div class="gen-verdict ${err / Math.max(P.exact(T), 1e-9) < 0.01 ? "ok" : "bad"}">${t.done(last, fmt(steps[last].x, 2, Lg), fmt(P.exact(T), 2, Lg), fmt(err, 3, Lg), fmt(100 * err / Math.max(P.exact(T), 1e-9), 1, Lg))}</div>`
        : `<div class="gen-verdict">${raf ? t.run : t.idle}</div>`;
      out.innerHTML = `<span class="ds-k">${t.k}</span>
        <ul><li><span>${t.step}</span><b>${s.n} / ${last}</b></li><li><span>${t.time}</span><b>${fmt(s.t * 1000, 0, Lg)} ${t.ms}</b></li>
        <li><span>${t.vel}</span><b>${fmt(s.v, 2, Lg)} ${t.mps}</b></li><li><span>${t.pos}</span><b>${fmt(s.x, 3, Lg)} ${t.m}</b></li></ul>${verdict}`;
      void xe;
    }

    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; playBtn.textContent = t.play; }
    function frame(now) {
      // the first rAF timestamp can be slightly earlier than performance.now() at the click: clamp at 0
      const simT = Math.max(0, (now - t0) / 1000 / SLOW);
      const k = Math.max(0, Math.min(steps.length - 1, Math.floor(simT / P.dt + 1e-9)));
      if (k !== shown) render(k);
      if (k >= steps.length - 1) { stop(); render(k); return; }
      raf = requestAnimationFrame(frame);
    }
    playBtn.addEventListener("click", () => {
      if (raf) { stop(); render(shown); return; }
      if (shown >= steps.length - 1) shown = 0;
      t0 = performance.now() - shown * P.dt * SLOW * 1000;
      playBtn.textContent = t.pause;
      raf = requestAnimationFrame(frame);
      render(shown);
    });
    resetBtn.addEventListener("click", () => { stop(); render(0); });
    ["dt", "v0", "a"].forEach(k => inp(k).addEventListener("input", () => { stop(); P = compute(); render(steps.length - 1); }));
    playBtn.textContent = t.play;
    render(steps.length - 1);   // full path by default (also what the PDF shows)
  }

  /* ---------------- falling apple: one physics-engine tick = 5 ms (200 Hz), gravity only, semi-implicit Euler */
  function setupApple(box) {
    const svg = R.$("[data-apple-svg]", box), out = R.$("[data-apple-out]", box), slider = R.$("[data-apple-k]", box);
    const playBtn = R.$("[data-apple-play]", box), speedBtn = R.$("[data-apple-speed]", box);
    const Lg = langOf(box);
    const t = {
      vi: { h: "độ cao h (m)", tm: "thời gian t (s)", ground: "mặt đất", exact: "rơi tự do lý tưởng (liên tục)", dots: "vị trí tại mỗi tick",
            k: "TICK HIỆN TẠI", tick: "Tick", time: "Thời điểm t", vel: "Vận tốc v", hh: "Độ cao h", dh: "Quãng rơi trong tick này",
            start: "Tick 0: vừa thả táo, h = 2 m, v = 0. Kéo thanh thời gian hoặc bấm + 1 tick.",
            land: (k, ms, ex) => `Chạm đất ở tick ${k} (t = ${ms} ms). Rơi tự do lý tưởng: ${ex} ms. Sai khác nhỏ hơn 1 tick.`,
            mid: "Giữa hai tick, engine không tính gì: táo nhảy thẳng từ vị trí cũ sang vị trí mới.",
            play: "▶ Chạy", pause: "❚❚ Dừng", slow: "Chậm 10×", real: "Tốc độ thật" },
      en: { h: "height h (m)", tm: "time t (s)", ground: "ground", exact: "ideal free fall (continuous)", dots: "position at each tick",
            k: "CURRENT TICK", tick: "Tick", time: "Time t", vel: "Velocity v", hh: "Height h", dh: "Fall during this tick",
            start: "Tick 0: the apple is released, h = 2 m, v = 0. Drag the time bar or press + 1 tick.",
            land: (k, ms, ex) => `Hits the ground at tick ${k} (t = ${ms} ms). Ideal free fall: ${ex} ms. The difference is less than one tick.`,
            mid: "Between two ticks the engine computes nothing: the apple jumps straight from its old position to the new one.",
            play: "▶ Run", pause: "❚❚ Pause", slow: "10× slower", real: "Real speed" },
      ja: { h: "高さ h (m)", tm: "時間 t (秒)", ground: "地面", exact: "理想的な自由落下（連続）", dots: "各 tick での位置",
            k: "現在の TICK", tick: "Tick", time: "時刻 t", vel: "速度 v", hh: "高さ h", dh: "この tick での落下量",
            start: "Tick 0：リンゴを放した瞬間、h = 2 m、v = 0。タイムバーをドラッグするか + 1 tick を押してください。",
            land: (k, ms, ex) => `tick ${k}（t = ${ms} ms）で地面に到達。理想的な自由落下では ${ex} ms。差は 1 tick 未満です。`,
            mid: "tick と tick の間、エンジンは何も計算しません。リンゴは前の位置から新しい位置へ一気に移ります。",
            play: "▶ 実行", pause: "❚❚ 一時停止", slow: "10 倍スロー", real: "実時間" },
    }[Lg] || {};
    const G = 9.81, DT = 0.005, H0 = 2;
    // ticks until the apple reaches the ground (the last one is clamped to h = 0)
    const S = [{ t: 0, v: 0, h: H0 }];
    for (let v = 0, h = H0, i = 1; h > 0; i++) { v -= G * DT; h += v * DT; if (h <= 0) h = 0; S.push({ t: i * DT, v, h }); }
    const N = S.length - 1, TF = Math.sqrt(2 * H0 / G), TMAX = 0.7;
    slider.max = N;
    // shared height axis for the ruler (left) and the h–t plot (right)
    const GY = 262, TY = 34, sy = h => GY - (GY - TY) * h / H0;
    const AX = 98, PX0 = 214, PX1 = 506, st = tt => PX0 + (PX1 - PX0) * tt / TMAX;
    let k = Math.min(N, +slider.value), raf = 0, slow = true, t0 = 0, k0 = 0;

    const apple = (x, y) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <path d="M0 -9 C6 -14 13 -9 12 -1 C11 8 5 12 0 10 C-5 12 -11 8 -12 -1 C-13 -9 -6 -14 0 -9Z" fill="#d1453b"/>
      <path d="M0 -9 C0 -13 1 -16 3 -18" stroke="#6b4a2b" stroke-width="1.6" fill="none"/>
      <path d="M2 -14 C6 -18 10 -17 11 -15 C8 -13 5 -13 2 -14Z" fill="#5a9b48"/>
      <ellipse cx="-5" cy="-4" rx="2.4" ry="3.6" fill="#fff" opacity=".35"/></g>`;

    function render() {
      const s = S[k];
      R.$("[data-apple-v]", box).textContent = `${t.tick} ${k} / ${N} · ${fmt(s.t * 1000, 0, Lg)} ms`;
      if (+slider.value !== k) slider.value = k;
      let g = "";
      // ruler
      g += `<line x1="${AX - 52}" y1="${TY}" x2="${AX - 52}" y2="${GY}" stroke="#c5ccd6"/>`;
      for (let m = 0; m <= H0 + 1e-9; m += 0.25) {
        const major = Math.abs(m * 2 - Math.round(m * 2)) < 1e-9;
        g += `<line x1="${AX - 52}" y1="${sy(m)}" x2="${AX - (major ? 44 : 48)}" y2="${sy(m)}" stroke="${MUTE}"/>`;
        if (major) g += lbl(AX - 58, sy(m) + 3.5, fmt(m, 1, Lg), 'text-anchor="end"');
        g += `<line x1="${PX0}" y1="${sy(m)}" x2="${PX1}" y2="${sy(m)}" stroke="#eef0f3"/>`;
      }
      g += lbl(6, 16, t.h);
      g += `<rect x="${AX - 52}" y="${GY}" width="${PX1 - AX + 52}" height="6" fill="#d9cbb3"/>${lbl(AX - 46, GY + 20, t.ground)}`;
      // past positions (stroboscope column) and the apple
      for (let i = 0; i < k; i++) g += `<circle cx="${AX - 26}" cy="${sy(S[i].h).toFixed(1)}" r="1.8" fill="${A}" opacity=".45"/>`;
      g += `<circle cx="${AX - 26}" cy="${sy(s.h).toFixed(1)}" r="3.2" fill="#d08a2e"/>`;
      g += apple(AX + 6, sy(s.h) - 10);
      g += `<line x1="${AX + 20}" y1="${sy(s.h).toFixed(1)}" x2="${st(s.t).toFixed(1)}" y2="${sy(s.h).toFixed(1)}" stroke="#d08a2e" stroke-width="1" stroke-dasharray="2 3"/>`;
      // h–t plot: time axis with one mark per tick
      g += `<line x1="${PX0}" y1="${TY - 6}" x2="${PX0}" y2="${GY}" stroke="#c5ccd6"/>`;
      for (let i = 0; i <= N; i++) g += `<line x1="${st(i * DT).toFixed(1)}" y1="${GY + 6}" x2="${st(i * DT).toFixed(1)}" y2="${GY + (i % 20 ? 9 : 12)}" stroke="${i % 20 ? "#cfd4db" : "#8a929e"}"/>`;
      for (let q = 0; q <= 0.6 + 1e-9; q += 0.1) g += lbl(st(q), GY + 24, fmt(q, 1, Lg), 'text-anchor="middle"');
      g += lbl(PX1, GY + 37, t.tm, 'text-anchor="end"');
      let path = "";
      for (let i = 0; i <= 60; i++) { const tt = TF * i / 60; path += `${i ? "L" : "M"}${st(tt).toFixed(1)},${sy(H0 - 0.5 * G * tt * tt).toFixed(1)}`; }
      g += `<path d="${path}" fill="none" stroke="${MUTE}" stroke-width="2" stroke-dasharray="5 4"/>`;
      for (let i = 0; i <= k; i++) g += `<circle cx="${st(S[i].t).toFixed(1)}" cy="${sy(S[i].h).toFixed(1)}" r="${i === k ? 4 : 1.7}" fill="${i === k ? "#d08a2e" : A}"/>`;
      g += `<line x1="${st(s.t).toFixed(1)}" y1="${TY - 6}" x2="${st(s.t).toFixed(1)}" y2="${GY + 6}" stroke="#d08a2e" stroke-width="1" stroke-dasharray="2 3"/>`;
      // legend
      // legend: upper right, above the curve
      g += `<path d="M334 40h16" stroke="${MUTE}" stroke-width="2" stroke-dasharray="5 4"/>${lbl(356, 44, t.exact)}`;
      g += `<circle cx="342" cy="56" r="2.6" fill="${A}"/>${lbl(356, 60, t.dots)}`;
      svg.innerHTML = g;

      const dh = k ? S[k - 1].h - s.h : 0;
      const f = (x, d) => fmt(x, d, Lg);
      const g9 = f(G, 2), dt = f(DT, 3);
      const eq = k ? `<div class="mo-eq">v<sub>${k}</sub> = ${f(S[k - 1].v, 3)} − ${g9} × ${dt}<br>&emsp;= ${f(s.v, 3)} m/s<br>h<sub>${k}</sub> = ${f(S[k - 1].h, 4)} + (${f(s.v, 3)}) × ${dt}<br>&emsp;= ${k === N ? `${f(S[k - 1].h + s.v * DT, 4)} → 0 (${t.ground})` : `${f(s.h, 4)} m`}</div>` : "";
      const verdict = k === 0 ? `<div class="gen-verdict">${t.start}</div>`
        : k === N ? `<div class="gen-verdict ok">${t.land(N, f(N * DT * 1000, 0), f(TF * 1000, 1))}</div>`
        : `<div class="gen-verdict">${t.mid}</div>`;
      out.innerHTML = `<span class="ds-k">${t.k}</span>
        <ul><li><span>${t.tick}</span><b>${k} / ${N}</b></li><li><span>${t.time}</span><b>${f(s.t * 1000, 0)} ms</b></li>
        <li><span>${t.vel}</span><b>${f(s.v, 3)} m/s</b></li><li><span>${t.hh}</span><b>${f(s.h, 4)} m</b></li>
        <li><span>${t.dh}</span><b>${f(dh * 1000, 1)} mm</b></li></ul>${eq}${verdict}`;
    }

    const go = n => { k = Math.max(0, Math.min(N, n)); render(); };
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; playBtn.textContent = t.play; }
    function frame(now) {
      const simT = Math.max(0, (now - t0) / 1000) / (slow ? 10 : 1);
      const n = Math.min(N, k0 + Math.floor(simT / DT + 1e-9));
      if (n !== k) go(n);
      if (n >= N) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (k >= N) go(0);
      k0 = k; t0 = performance.now();
      playBtn.textContent = t.pause;
      raf = requestAnimationFrame(frame);
    }
    playBtn.addEventListener("click", () => (raf ? stop() : start()));
    R.$("[data-apple-prev]", box).addEventListener("click", () => { stop(); go(k - 1); });
    R.$("[data-apple-next]", box).addEventListener("click", () => { stop(); go(k + 1); });
    speedBtn.addEventListener("click", () => {
      slow = !slow; speedBtn.textContent = slow ? t.slow : t.real;
      if (raf) { stop(); start(); }
    });
    slider.addEventListener("input", () => { stop(); go(+slider.value); });
    // drag on the h–t plot moves the time cursor too
    const toTick = e => {
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 520;
      return Math.round((x - PX0) / (PX1 - PX0) * TMAX / DT);
    };
    let drag = false;
    svg.addEventListener("pointerdown", e => { const r = svg.getBoundingClientRect(); if ((e.clientX - r.left) / r.width * 520 < PX0 - 6) return; drag = true; svg.setPointerCapture(e.pointerId); stop(); go(toTick(e)); });
    svg.addEventListener("pointermove", e => { if (drag) go(toTick(e)); });
    svg.addEventListener("pointerup", () => { drag = false; });
    svg.addEventListener("pointercancel", () => { drag = false; });
    playBtn.textContent = t.play; speedBtn.textContent = t.slow;
    render();
  }

  /* ---------------- motion (control) tick: one shoulder joint, 40 commands at 50 Hz, PD over 4 physics ticks each */
  function setupCtl(box) {
    const svg = R.$("[data-ctl-svg]", box), out = R.$("[data-ctl-out]", box), slider = R.$("[data-ctl-n]", box);
    const playBtn = R.$("[data-ctl-play]", box), speedBtn = R.$("[data-ctl-speed]", box);
    const Lg = langOf(box);
    const t = {
      vi: { ang: "góc khớp (rad)", tm: "thời gian t (s)", chunk: "CHUỖI 40 LỆNH TỪ GR00T", used: "đã dùng", cur: "đang giữ",
            cmd: "lệnh (đổi mỗi 20 ms)", act: "góc thực (mỗi 5 ms)", torso: "thân", tgt: "lệnh", real: "thực",
            zoom: "20 MS = 4 TICK VẬT LÝ", k: "TICK HIỆN TẠI", ctl: "Tick chuyển động", phy: "Tick vật lý trong tick này", tot: "Tổng tick vật lý",
            time: "Thời điểm t", cmdv: "Lệnh đang giữ", actv: "Góc thực", err: "Sai lệch",
            v0: "Chưa bắt đầu: tay đứng yên ở 0 rad. Bấm + 1 tick vật lý hoặc kéo thanh thời gian.",
            vNew: j => `Tick chuyển động mới: lấy lệnh số ${j} trong chuỗi và giữ nguyên 20 ms.`,
            vHold: m => `Lệnh không đổi. Engine chạy tick vật lý ${m}/4, bộ PD kéo khớp về phía lệnh.`,
            vEnd: "Đã dùng hết 40 lệnh sau 0,8 s: tick chuyển động tiếp theo lấy lệnh đầu của chuỗi mới.",
            play: "▶ Chạy", pause: "❚❚ Dừng", slow: "Chậm 10×", realSp: "Tốc độ thật" },
      en: { ang: "joint angle (rad)", tm: "time t (s)", chunk: "CHUNK OF 40 COMMANDS FROM GR00T", used: "used", cur: "held now",
            cmd: "command (changes every 20 ms)", act: "actual angle (every 5 ms)", torso: "torso", tgt: "command", real: "actual",
            zoom: "1 MOTION TICK (20 MS) = 4 TICKS", k: "CURRENT TICK", ctl: "Motion tick", phy: "Physics tick in this tick", tot: "Total physics ticks",
            time: "Time t", cmdv: "Command held", actv: "Actual angle", err: "Error",
            v0: "Not started: the arm rests at 0 rad. Press + 1 physics tick or drag the time bar.",
            vNew: j => `New motion tick: take command ${j} from the chunk and hold it for 20 ms.`,
            vHold: m => `The command does not change. The engine runs physics tick ${m}/4 and PD pulls the joint toward the command.`,
            vEnd: "All 40 commands used after 0.8 s: the next motion tick takes the first command of the new chunk.",
            play: "▶ Run", pause: "❚❚ Pause", slow: "10× slower", realSp: "Real speed" },
      ja: { ang: "関節角度 (rad)", tm: "時間 t (秒)", chunk: "GR00T からの 40 個の指令", used: "使用済み", cur: "保持中",
            cmd: "指令（20 ms ごとに変化）", act: "実際の角度（5 ms ごと）", torso: "胴体", tgt: "指令", real: "実際",
            zoom: "動作 1 TICK = 物理 4 TICK", k: "現在の TICK", ctl: "動作 tick", phy: "この中の物理 tick", tot: "物理 tick の合計",
            time: "時刻 t", cmdv: "保持中の指令", actv: "実際の角度", err: "誤差",
            v0: "開始前：腕は 0 rad で静止。+ 物理 1 tick を押すか、タイムバーをドラッグしてください。",
            vNew: j => `新しい動作 tick：チャンクの ${j} 番目の指令を取り出し、20 ms 保持します。`,
            vHold: m => `指令は変わりません。エンジンが物理 tick ${m}/4 を実行し、PD が関節を指令の方へ引きます。`,
            vEnd: "0.8 秒で 40 個の指令を使い切りました。次の動作 tick は新しいチャンクの最初の指令を使います。",
            play: "▶ 実行", pause: "❚❚ 一時停止", slow: "10 倍スロー", realSp: "実時間" },
    }[Lg] || {};
    const DT = 0.005, DEC = 4, NC = 40, N = NC * DEC, WN = 10 * 2 * Math.PI, Z = 2, TOP = 0.8;
    // the 40 commands of one chunk: a smooth raise from 0 to 0.8 rad between command 5 and 25, then hold
    const ss = x => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
    const CMD = Array.from({ length: NC }, (_, j) => TOP * ss((j - 4) / 20));
    // physics: semi-implicit Euler, PD on the held command (per unit inertia)
    const S = [{ th: 0, w: 0, a: 0, c: 0 }];
    for (let n = 1, th = 0, w = 0; n <= N; n++) {
      const c = CMD[Math.floor((n - 1) / DEC)], a = WN * WN * (c - th) - 2 * Z * WN * w;
      w += a * DT; th += w * DT; S.push({ th, w, a, c });
    }
    slider.max = N;
    const GY = 250, TY = 66, AMAX = 1, sy = v => GY - (GY - TY) * v / AMAX;
    const PX0 = 214, PX1 = 506, TMAX = N * DT, st = tt => PX0 + (PX1 - PX0) * tt / TMAX;
    const CY = 30, CH = 12;                            // chunk strip
    const ZX0 = 362, ZX1 = 506, ZY0 = 156, ZY1 = 238;  // zoom inset
    const PV = [96, 92], L = 104;                       // arm pivot, link length
    let n = Math.min(N, +slider.value), raf = 0, slow = true, t0 = 0, n0 = 0;
    const f = (x, d) => fmt(x, d, Lg);
    const ctlOf = k => (k ? Math.floor((k - 1) / DEC) : -1), subOf = k => (k ? (k - 1) % DEC + 1 : 0);

    function render() {
      const s = S[n], j = ctlOf(n), m = subOf(n), cHeld = j < 0 ? 0 : CMD[j];
      R.$("[data-ctl-v]", box).textContent = `${n} / ${N} · ${f(n * DT * 1000, 0)} ms`;
      if (+slider.value !== n) slider.value = n;
      let g = "";
      // arm: torso, target link (dashed orange), actual link (blue)
      const end = th => [PV[0] + L * Math.sin(th), PV[1] + L * Math.cos(th)];
      g += `<rect x="${PV[0] - 40}" y="${PV[1] - 30}" width="34" height="150" rx="12" fill="#e3e7ec"/>${lbl(PV[0] - 40, PV[1] - 38, t.torso)}`;
      const [tx, ty] = end(cHeld), [ax, ay] = end(s.th);
      g += `<line x1="${PV[0]}" y1="${PV[1]}" x2="${PV[0]}" y2="${PV[1] + L + 14}" stroke="#d5d9df" stroke-dasharray="3 3"/>`;
      g += `<line x1="${PV[0]}" y1="${PV[1]}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#d08a2e" stroke-width="3" stroke-dasharray="6 4"/>`;
      g += `<line x1="${PV[0]}" y1="${PV[1]}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${A}" stroke-width="12" stroke-linecap="round"/>`;
      g += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="9" fill="${INK}"/><circle cx="${PV[0]}" cy="${PV[1]}" r="8" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
      g += `<circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="5" fill="#fff" stroke="#d08a2e" stroke-width="2"/>`;
      g += lbl(tx + 10, ty - 6, `${t.tgt} ${f(cHeld, 2)}`, 'style="fill:#b06f1c"') + lbl(ax + 12, ay + 20, `${t.real} ${f(s.th, 2)}`, 'style="fill:oklch(0.45 0.12 255)"');
      // chunk strip: 40 cells, used / held / waiting
      const cw = (PX1 - PX0) / NC;
      g += `<text x="${PX0}" y="${CY - 6}" class="r2s-lbl" style="font-size:8.5px;letter-spacing:.06em">${t.chunk}</text>`;
      for (let i = 0; i < NC; i++) {
        const fill = i < j ? "oklch(0.8 0.06 255)" : i === j ? "#d08a2e" : "#eef0f3";
        g += `<rect x="${(PX0 + i * cw + 0.6).toFixed(1)}" y="${CY}" width="${(cw - 1.2).toFixed(1)}" height="${CH}" rx="1.5" fill="${fill}"/>`;
      }
      if (j >= 0) g += `<text x="${(PX0 + (j + 0.5) * cw).toFixed(1)}" y="${CY + CH + 10}" class="r2s-lbl" text-anchor="middle" style="font-size:8.5px;fill:#b06f1c">${j + 1}</text>`;
      // plot: bands per motion tick, axes
      for (let i = 0; i < NC; i += 2) g += `<rect x="${st(i * DEC * DT).toFixed(1)}" y="${TY - 4}" width="${cw.toFixed(1)}" height="${GY - TY + 4}" fill="oklch(0.52 0.13 255 / .045)"/>`;
      if (j >= 0) g += `<rect x="${st(j * DEC * DT).toFixed(1)}" y="${TY - 4}" width="${cw.toFixed(1)}" height="${GY - TY + 4}" fill="#d08a2e" opacity=".14"/>`;
      g += `<line x1="${PX0}" y1="${GY}" x2="${PX1}" y2="${GY}" stroke="#c5ccd6"/><line x1="${PX0}" y1="${GY}" x2="${PX0}" y2="${TY - 6}" stroke="#c5ccd6"/>`;
      for (let v = 0; v <= AMAX + 1e-9; v += 0.25) g += `<line x1="${PX0 - 4}" y1="${sy(v)}" x2="${PX0}" y2="${sy(v)}" stroke="${MUTE}"/>${lbl(PX0 - 7, sy(v) + 3.5, f(v, 2), 'text-anchor="end"')}`;
      for (let k = 0; k <= N; k++) g += `<line x1="${st(k * DT).toFixed(1)}" y1="${GY}" x2="${st(k * DT).toFixed(1)}" y2="${GY + (k % DEC ? 3 : 7)}" stroke="${k % DEC ? "#d5d9df" : "#8a929e"}"/>`;
      for (let q = 0; q <= TMAX + 1e-9; q += 0.2) g += lbl(st(q), GY + 19, f(q, 1), 'text-anchor="middle"');
      g += lbl(PX1, GY + 32, t.tm, 'text-anchor="end"') + lbl(PX0 - 36, TY - 12, t.ang);
      // full command staircase (faint), used part bold
      const stair = upto => { let d = `M${st(0)},${sy(0)}`; for (let i = 0; i <= upto; i++) d += `L${st(i * DEC * DT).toFixed(1)},${sy(CMD[i]).toFixed(1)}L${st((i + 1) * DEC * DT).toFixed(1)},${sy(CMD[i]).toFixed(1)}`; return d; };
      g += `<path d="${stair(NC - 1)}" fill="none" stroke="#d08a2e" stroke-width="1.4" opacity=".3"/>`;
      if (j >= 0) g += `<path d="${stair(j)}" fill="none" stroke="#d08a2e" stroke-width="2.2"/>`;
      for (let k = 0; k <= n; k++) g += `<circle cx="${st(k * DT).toFixed(1)}" cy="${sy(S[k].th).toFixed(1)}" r="${k === n ? 3.8 : 1.5}" fill="${k === n ? INK : A}"/>`;
      g += `<line x1="${st(n * DT).toFixed(1)}" y1="${TY - 6}" x2="${st(n * DT).toFixed(1)}" y2="${GY}" stroke="${INK}" stroke-width="1" stroke-dasharray="2 3"/>`;
      // legend
      g += `<path d="M${PX0 + 10} ${TY + 4}h16" stroke="#d08a2e" stroke-width="2.2"/>${lbl(PX0 + 32, TY + 8, t.cmd)}`;
      g += `<circle cx="${PX0 + 18}" cy="${TY + 18}" r="2.6" fill="${A}"/>${lbl(PX0 + 32, TY + 22, t.act)}`;
      // zoom inset: the current motion tick and its 4 physics ticks
      const jj = Math.max(0, j), k0 = jj * DEC, pts = S.slice(k0, Math.min(n, k0 + DEC) + 1);
      const lo = Math.min(CMD[jj], ...S.slice(k0, k0 + DEC + 1).map(p => p.th)), hi = Math.max(CMD[jj], ...S.slice(k0, k0 + DEC + 1).map(p => p.th));
      const pad = Math.max((hi - lo) * 0.18, 0.01);
      const zx = i => ZX0 + 16 + (ZX1 - ZX0 - 32) * i / DEC, zy = v => ZY1 - 12 - (ZY1 - ZY0 - 30) * (v - lo + pad) / (hi - lo + 2 * pad);
      g += `<rect x="${ZX0}" y="${ZY0 - 14}" width="${ZX1 - ZX0}" height="${ZY1 - ZY0 + 14}" rx="8" fill="#fff" stroke="oklch(0.86 0.04 255)"/>`;
      g += `<text x="${ZX0 + 8}" y="${ZY0}" class="r2s-lbl" style="font-size:7.5px;letter-spacing:.03em">${t.zoom}</text>`;
      if (j >= 0) {
        g += `<line x1="${zx(0)}" y1="${zy(CMD[jj]).toFixed(1)}" x2="${zx(DEC)}" y2="${zy(CMD[jj]).toFixed(1)}" stroke="#d08a2e" stroke-width="2"/>`;
        g += lbl(zx(DEC), zy(CMD[jj]) - 4, `${t.tgt} ${jj + 1}`, 'text-anchor="end" style="font-size:8.5px;fill:#b06f1c"');
        pts.forEach((p, i) => {
          const x = zx(i), y = zy(p.th);
          if (i) g += `<line x1="${zx(i - 1)}" y1="${zy(pts[i - 1].th).toFixed(1)}" x2="${x}" y2="${y.toFixed(1)}" stroke="${A}" stroke-width="1" opacity=".5"/>`;
          g += `<circle cx="${x}" cy="${y.toFixed(1)}" r="${i === pts.length - 1 ? 4 : 3}" fill="${i === pts.length - 1 ? INK : A}"/>`;
        });
        for (let i = 1; i <= DEC; i++) g += `<text x="${zx(i)}" y="${ZY1 + 0}" class="r2s-lbl" text-anchor="middle" style="font-size:8px;fill:${i === m ? INK : "#8a929e"}">${i}</text>`;
      }
      svg.innerHTML = g;

      const verdict = n === 0 ? `<div class="gen-verdict">${t.v0}</div>`
        : n === N ? `<div class="gen-verdict ok">${t.vEnd}</div>`
        : m === 1 ? `<div class="gen-verdict ok">${t.vNew(j + 1)}</div>`
        : `<div class="gen-verdict">${t.vHold(m)}</div>`;
      const eq = n ? `<div class="mo-eq">α = ωn²·(${f(s.c, 3)} − ${f(S[n - 1].th, 3)}) − 2ζωn·${f(S[n - 1].w, 2)}<br>&emsp;= ${f(s.a, 0)} rad/s²<br>ω = ${f(S[n - 1].w, 2)} + α·0${Lg === "vi" ? "," : "."}005 = ${f(s.w, 2)} rad/s<br>θ = ${f(S[n - 1].th, 3)} + ω·0${Lg === "vi" ? "," : "."}005 = ${f(s.th, 3)} rad</div>` : "";
      out.innerHTML = `<span class="ds-k">${t.k}</span>
        <ul><li><span>${t.ctl}</span><b>${j < 0 ? "–" : j + 1} / ${NC}</b></li><li><span>${t.phy}</span><b>${m || "–"} / ${DEC}</b></li>
        <li><span>${t.tot}</span><b>${n} / ${N}</b></li><li><span>${t.time}</span><b>${f(n * DT * 1000, 0)} ms</b></li>
        <li><span>${t.cmdv}</span><b>${f(cHeld, 3)} rad</b></li><li><span>${t.actv}</span><b>${f(s.th, 3)} rad</b></li>
        <li><span>${t.err}</span><b>${f(cHeld - s.th, 3)} rad</b></li></ul>${eq}${verdict}`;
    }

    const go = k => { n = Math.max(0, Math.min(N, k)); render(); };
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; playBtn.textContent = t.play; }
    function frame(now) {
      const simT = Math.max(0, (now - t0) / 1000) / (slow ? 10 : 1);
      const k = Math.min(N, n0 + Math.floor(simT / DT + 1e-9));
      if (k !== n) go(k);
      if (k >= N) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (n >= N) go(0); n0 = n; t0 = performance.now(); playBtn.textContent = t.pause; raf = requestAnimationFrame(frame); }
    playBtn.addEventListener("click", () => (raf ? stop() : start()));
    R.$("[data-ctl-prev]", box).addEventListener("click", () => { stop(); go(n - 1); });
    R.$("[data-ctl-next]", box).addEventListener("click", () => { stop(); go(n + 1); });
    // jump to the first physics tick of the next motion tick
    R.$("[data-ctl-next4]", box).addEventListener("click", () => { stop(); go(n === 0 ? 1 : (ctlOf(n) + 1) * DEC + 1); });
    speedBtn.addEventListener("click", () => { slow = !slow; speedBtn.textContent = slow ? t.slow : t.realSp; if (raf) { stop(); start(); } });
    slider.addEventListener("input", () => { stop(); go(+slider.value); });
    const toTick = e => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 520; return Math.round((x - PX0) / (PX1 - PX0) * N); };
    let drag = false;
    svg.addEventListener("pointerdown", e => {
      const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 520, y = (e.clientY - r.top) / r.height * 300;
      if (x < PX0 - 6 || (x > ZX0 && y > ZY0 - 14)) return;
      drag = true; svg.setPointerCapture(e.pointerId); stop(); go(toTick(e));
    });
    svg.addEventListener("pointermove", e => { if (drag) go(toTick(e)); });
    svg.addEventListener("pointerup", () => { drag = false; });
    svg.addEventListener("pointercancel", () => { drag = false; });
    playBtn.textContent = t.play; speedBtn.textContent = t.slow;
    render();
  }

  /* ---------------- relation of the two ticks: GR00T chunk → 40 motion ticks → decimation physics ticks each */
  function setupRel(box) {
    const svg = R.$("[data-rel-svg]", box), out = R.$("[data-rel-out]", box), slider = R.$("[data-rel-p]", box), decIn = R.$("[data-rel-d]", box);
    const playBtn = R.$("[data-rel-play]", box), speedBtn = R.$("[data-rel-speed]", box);
    const Lg = langOf(box);
    const t = {
      vi: { l1: d => `TẦNG 1 · 1 LẦN GỌI GR00T = 40 TICK CHUYỂN ĐỘNG · ${d}`, l2: (n, d) => `TẦNG 2 · 1 TICK CHUYỂN ĐỘNG = ${n} TICK VẬT LÝ · ${d}`,
            l3: "TẦNG 3 · BÊN TRONG 1 TICK VẬT LÝ · 5 MS", phy: "vật lý", steps: ["PD tính mô-men", "PhysX: vận tốc mới", "PhysX: vị trí mới"],
            code: "VÒNG LẶP TRONG CODE", c1: d => `mỗi tick chuyển động (${d}):`, c2: "  lệnh = chuỗi[k]", c3: "  hết chuỗi? → gọi GR00T lấy 40 lệnh mới",
            c4: n => `  lặp ${n} lần (decimation):`, c5: "    sim.step()  · 5 ms · PD → PhysX", ck: (k) => `k = ${k} / 40`, cj: (j, n) => `lần ${j} / ${n}`,
            k: "ĐANG Ở ĐÂU", call: "Lần gọi GR00T", ctl: "Tick chuyển động", inT: "Tick vật lý trong tick này", tot: "Tổng tick vật lý", time: "Thời gian mô phỏng",
            hz: "Tần số chuyển động", dur: "Một chuỗi 40 lệnh kéo dài", s: "s",
            ok: "Cấu hình dự án: mỗi lệnh giữ đúng 20 ms, khớp nhịp 50 Hz của dữ liệu demo.",
            slow: (ms, d, r) => `Mỗi lệnh bị giữ ${ms} ms thay vì 20 ms: chuỗi 0,8 s bị kéo thành ${d} s, robot làm chậm hơn ${r} lần so với lúc học.`,
            fast: (ms, d, r) => `Mỗi lệnh chỉ được giữ ${ms} ms: chuỗi chạy hết trong ${d} s, nhanh gấp ${r} lần lúc học. Khớp khó theo kịp, model phải được gọi thường hơn.`,
            play: "▶ Chạy", pause: "❚❚ Dừng", slowB: "Chậm 10×", real: "Tốc độ thật" },
      en: { l1: d => `LEVEL 1 · 1 GR00T CALL = 40 MOTION TICKS · ${d}`, l2: (n, d) => `LEVEL 2 · 1 MOTION TICK = ${n} PHYSICS TICK${n > 1 ? "S" : ""} · ${d}`,
            l3: "LEVEL 3 · INSIDE 1 PHYSICS TICK · 5 MS", phy: "physics", steps: ["PD computes torque", "PhysX: new velocity", "PhysX: new position"],
            code: "THE LOOP IN THE CODE", c1: d => `every motion tick (${d}):`, c2: "  command = chunk[k]", c3: "  chunk used up? → call GR00T for 40 new commands",
            c4: n => `  repeat ${n} time${n > 1 ? "s" : ""} (decimation):`, c5: "    sim.step()  · 5 ms · PD → PhysX", ck: (k) => `k = ${k} / 40`, cj: (j, n) => `pass ${j} / ${n}`,
            k: "WHERE WE ARE", call: "GR00T call", ctl: "Motion tick", inT: "Physics tick in this tick", tot: "Total physics ticks", time: "Simulation time",
            hz: "Motion rate", dur: "One chunk of 40 commands lasts", s: "s",
            ok: "Project setting: each command is held for exactly 20 ms, matching the 50 Hz rhythm of the demo data.",
            slow: (ms, d, r) => `Each command is held ${ms} ms instead of 20 ms: the 0.8 s chunk stretches to ${d} s and the robot moves ${r}× slower than during training.`,
            fast: (ms, d, r) => `Each command is held only ${ms} ms: the chunk is used up in ${d} s, ${r}× faster than during training. The joints struggle to follow and the model must be called more often.`,
            play: "▶ Run", pause: "❚❚ Pause", slowB: "10× slower", real: "Real speed" },
      ja: { l1: d => `第 1 層 · GR00T 呼び出し 1 回 = 動作 TICK 40 回 · ${d}`, l2: (n, d) => `第 2 層 · 動作 TICK 1 回 = 物理 TICK ${n} 回 · ${d}`,
            l3: "第 3 層 · 物理 TICK 1 回の中身 · 5 MS", phy: "物理", steps: ["PD がトルク計算", "PhysX：新しい速度", "PhysX：新しい位置"],
            code: "コード内のループ", c1: d => `動作 tick ごと（${d}）：`, c2: "  指令 = チャンク[k]", c3: "  使い切った？ → GR00T を呼び 40 個の新しい指令",
            c4: n => `  ${n} 回繰り返す（decimation）：`, c5: "    sim.step()  · 5 ms · PD → PhysX", ck: (k) => `k = ${k} / 40`, cj: (j, n) => `${j} / ${n} 回目`,
            k: "現在位置", call: "GR00T 呼び出し", ctl: "動作 tick", inT: "この中の物理 tick", tot: "物理 tick の合計", time: "シミュレーション時間",
            hz: "動作の周波数", dur: "40 個の指令の長さ", s: "秒",
            ok: "本プロジェクトの設定：各指令はちょうど 20 ms 保持され、デモデータの 50 Hz と一致します。",
            slow: (ms, d, r) => `各指令が 20 ms ではなく ${ms} ms 保持されます。0.8 秒のチャンクが ${d} 秒に伸び、ロボットは学習時より ${r} 倍遅く動きます。`,
            fast: (ms, d, r) => `各指令は ${ms} ms しか保持されません。チャンクは ${d} 秒で使い切られ、学習時の ${r} 倍速になります。関節が追いつきにくく、モデルもより頻繁に呼ぶ必要があります。`,
            play: "▶ 実行", pause: "❚❚ 一時停止", slowB: "10 倍スロー", real: "実時間" },
    }[Lg] || {};
    const DECS = [1, 2, 4, 5, 8, 10], DT = 0.005, NC = 40, X0 = 20, X1 = 500;
    const f = (x, d) => fmt(x, d, Lg);
    const ms = x => `${f(x, 0)} ms`;
    let dec = DECS[+decIn.value], NP = NC * dec, p = Math.min(+slider.value, NP - 1), raf = 0, slow = true, t0 = 0, p0 = 0;
    const ORG = "#d08a2e", PAST = "oklch(0.86 0.05 255)", WAIT = "#eef0f3";
    const head = (x, y, s) => `<text x="${x}" y="${y}" class="r2s-lbl" style="font-size:8.5px;letter-spacing:.05em;font-weight:700">${s}</text>`;

    function render() {
      const k = Math.floor(p / dec), j = p % dec, ctlMs = dec * DT * 1000;
      R.$("[data-rel-dv]", box).textContent = `${dec} → ${f(200 / dec, 0)} Hz`;
      R.$("[data-rel-v]", box).textContent = `${p + 1} / ${NP} · ${ms((p + 1) * DT * 1000)}`;
      slider.max = NP - 1; if (+slider.value !== p) slider.value = p;
      let g = "";
      // level 1: the chunk, 40 motion-tick cells
      const cw = (X1 - X0) / NC, c1y = 20, c1h = 18;
      g += head(X0, 12, t.l1(`${f(NC * ctlMs / 1000, 1)} ${t.s}`));
      for (let i = 0; i < NC; i++) g += `<rect x="${(X0 + i * cw + 0.6).toFixed(1)}" y="${c1y}" width="${(cw - 1.2).toFixed(1)}" height="${c1h}" rx="2" fill="${i < k ? PAST : i === k ? ORG : WAIT}"/>`;
      g += `<text x="${(X0 + (k + 0.5) * cw).toFixed(1)}" y="${c1y + 12.5}" text-anchor="middle" style="font:700 8px var(--mono);fill:#fff">${k + 1}</text>`;
      // zoom 1 → 2
      const c2y = 72, c2h = 40, bw = (X1 - X0) / dec;
      g += `<path d="M${(X0 + k * cw).toFixed(1)} ${c1y + c1h} L${X0} ${c2y} L${X1} ${c2y} L${(X0 + (k + 1) * cw).toFixed(1)} ${c1y + c1h}Z" fill="${ORG}" opacity=".08" stroke="${ORG}" stroke-opacity=".35" stroke-dasharray="3 3"/>`;
      g += head(X0, c2y - 8, t.l2(dec, ms(ctlMs)));
      for (let i = 0; i < dec; i++) {
        const x = X0 + i * bw;
        g += `<rect x="${(x + 1).toFixed(1)}" y="${c2y}" width="${(bw - 2).toFixed(1)}" height="${c2h}" rx="5" fill="${i < j ? PAST : i === j ? A : WAIT}"/>`;
        if (bw >= 40) g += `<text x="${(x + bw / 2).toFixed(1)}" y="${c2y + 17}" text-anchor="middle" style="font:700 9.5px var(--mono);fill:${i === j ? "#fff" : INK}">${t.phy} ${i + 1}</text><text x="${(x + bw / 2).toFixed(1)}" y="${c2y + 30}" text-anchor="middle" style="font:500 8.5px var(--mono);fill:${i === j ? "#e5edf9" : "#7a828e"}">5 ms</text>`;
        else g += `<text x="${(x + bw / 2).toFixed(1)}" y="${c2y + 24}" text-anchor="middle" style="font:700 9px var(--mono);fill:${i === j ? "#fff" : INK}">${i + 1}</text>`;
      }
      // zoom 2 → 3
      const c3y = 140, c3h = 26, sw = (X1 - X0) / 3;
      g += `<path d="M${(X0 + j * bw + 1).toFixed(1)} ${c2y + c2h} L${X0} ${c3y} L${X1} ${c3y} L${(X0 + (j + 1) * bw - 1).toFixed(1)} ${c2y + c2h}Z" fill="${A}" opacity=".07" stroke="${A}" stroke-opacity=".35" stroke-dasharray="3 3"/>`;
      g += head(X0, c3y - 8, t.l3);
      t.steps.forEach((s, i) => {
        const x = X0 + i * sw;
        g += `<rect x="${(x + 1).toFixed(1)}" y="${c3y}" width="${(sw - 12).toFixed(1)}" height="${c3h}" rx="5" fill="#fff" stroke="oklch(0.8 0.06 255)"/>`;
        g += `<text x="${(x + (sw - 10) / 2).toFixed(1)}" y="${c3y + 17}" text-anchor="middle" style="font:600 9.5px var(--sans);fill:${INK}">${s}</text>`;
        if (i < 2) g += `<path d="M${(x + sw - 9).toFixed(1)} ${c3y + 13}l6 0 m-3 -3 l3 3 -3 3" stroke="${A}" fill="none" stroke-width="1.4"/>`;
      });
      // the loop in the code, lines lit by the current state
      const ly = 196, lh = 17;
      g += `<rect x="${X0 - 6}" y="${ly - 14}" width="${X1 - X0 + 12}" height="${lh * 5 + 26}" rx="8" fill="#1f2a3a"/>`;
      g += `<text x="${X0 + 2}" y="${ly - 2}" style="font:700 8px var(--mono);letter-spacing:.08em;fill:#8fa3bd">${t.code}</text>`;
      const lines = [
        [t.c1(ms(ctlMs)), j === 0, ""],
        [t.c2, j === 0, t.ck(k + 1)],
        [t.c3, j === 0 && k === 0, ""],
        [t.c4(dec), true, ""],
        [t.c5, true, t.cj(j + 1, dec)],
      ];
      lines.forEach(([s, on, tag], i) => {
        const y = ly + 12 + i * lh;
        if (on && i !== 3) g += `<rect x="${X0 - 2}" y="${y - 12}" width="${X1 - X0 + 4}" height="${lh - 2}" rx="3" fill="${i === 4 ? A : ORG}" opacity="${i === 4 ? .6 : .5}"/>`;
        g += `<text x="${X0 + 4}" y="${y}" style="font:600 9.5px var(--mono);fill:${on ? "#fff" : "#7d8ba0"};white-space:pre" xml:space="preserve">${s}</text>`;
        if (tag) g += `<text x="${X1 - 4}" y="${y}" text-anchor="end" style="font:700 9.5px var(--mono);fill:${on ? "#fff" : "#7d8ba0"}">${tag}</text>`;
      });
      svg.innerHTML = g;

      const r = dec / 4, hold = ctlMs, chunkS = NC * ctlMs / 1000;
      const verdict = dec === 4 ? `<div class="gen-verdict ok">${t.ok}</div>`
        : dec > 4 ? `<div class="gen-verdict bad">${t.slow(f(hold, 0), f(chunkS, 1), f(r, r % 1 ? 2 : 0))}</div>`
        : `<div class="gen-verdict bad">${t.fast(f(hold, 0), f(chunkS, 1), f(1 / r, 0))}</div>`;
      out.innerHTML = `<span class="ds-k">${t.k}</span>
        <ul><li><span>${t.call}</span><b>1</b></li><li><span>${t.ctl}</span><b>${k + 1} / ${NC}</b></li>
        <li><span>${t.inT}</span><b>${j + 1} / ${dec}</b></li><li><span>${t.tot}</span><b>${p + 1} / ${NP}</b></li>
        <li><span>${t.time}</span><b>${ms((p + 1) * DT * 1000)}</b></li><li><span>${t.hz}</span><b>${f(200 / dec, 0)} Hz</b></li>
        <li><span>${t.dur}</span><b>${f(chunkS, 1)} ${t.s}</b></li></ul>${verdict}`;
    }

    const go = q => { p = Math.max(0, Math.min(NP - 1, q)); render(); };
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; playBtn.textContent = t.play; }
    function frame(now) {
      const simT = Math.max(0, (now - t0) / 1000) / (slow ? 10 : 1);
      const q = Math.min(NP - 1, p0 + Math.floor(simT / DT + 1e-9));
      if (q !== p) go(q);
      if (q >= NP - 1) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (p >= NP - 1) go(0); p0 = p; t0 = performance.now(); playBtn.textContent = t.pause; raf = requestAnimationFrame(frame); }
    playBtn.addEventListener("click", () => (raf ? stop() : start()));
    R.$("[data-rel-next]", box).addEventListener("click", () => { stop(); go(p + 1); });
    R.$("[data-rel-next4]", box).addEventListener("click", () => { stop(); go((Math.floor(p / dec) + 1) * dec); });
    speedBtn.addEventListener("click", () => { slow = !slow; speedBtn.textContent = slow ? t.slowB : t.real; if (raf) { stop(); start(); } });
    slider.addEventListener("input", () => { stop(); go(+slider.value); });
    decIn.addEventListener("input", () => {
      stop();
      const k = Math.floor(p / dec);                       // stay on the same motion tick
      dec = DECS[+decIn.value]; NP = NC * dec; go(k * dec);
    });
    playBtn.textContent = t.play; speedBtn.textContent = t.slowB;
    render();
  }

  R.motion = {
    init() {
      if (!R.$("#dong-hoc")) return;
      const map = { body: setupBody, fk: setupFK, ik: setupIK, pd: setupPD, bal: setupBal, rate: setupRate, car: setupCar, apple: setupApple, ctl: setupCtl, rel: setupRel };
      R.$$("[data-mo]").forEach(box => { try { map[box.dataset.mo] && map[box.dataset.mo](box); } catch (e) { console.error("motion", box.dataset.mo, e); } });
    },
  };
})();
