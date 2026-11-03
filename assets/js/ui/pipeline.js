/* Interactive explainers for section II.02 (pipeline research), fixed-viewBox SVG:
   [data-pp="loop"] control-loop timeline: 0,8 s chunk vs ~1,3 s model latency (from I.02), in
                    simulation (pauses), on a real robot without prefetch, and with prefetch
   [data-pp="road"] the 12 research notebooks on one track, grouped A–D, success-rate line above */
(function () {
  "use strict";
  const R = window.Report;
  const A = "oklch(0.52 0.13 255)", INK = "#1f2a3a", GREY = "#c5ccd6";
  const lbl = (x, y, t, extra = "") => `<text x="${x}" y="${y}" class="r2s-lbl" ${extra}>${t}</text>`;
  const fmt = (x, d = 1, L = "vi") => L === "vi" ? x.toFixed(d).replace(".", ",") : x.toFixed(d);
  const langOf = box => (box.closest("[data-i18n]")?.dataset.i18n) || "vi";

  /* ---------------- control loop timeline */
  const CHUNK = 0.8, LAT = 1.3;
  const MODES_VI = {
    sim: { t: "Mô phỏng dừng chờ model", d: "Trong lúc chờ server, mô phỏng đứng yên: với robot ảo, thời gian không trôi. Kết quả không bị ảnh hưởng bởi độ trễ, chỉ chạy chậm hơn thời gian thực.", wait: LAT, label: "mô phỏng đứng yên" },
    real: { t: "Robot thật, gọi khi hết chuỗi", d: "Thời gian thật không dừng. Robot làm xong 0,8 s chuyển động rồi mới gửi quan sát, phải đứng chờ trọn 1,3 s: chuyển động bị khựng.", wait: LAT, label: "robot khựng" },
    pre: { t: "Robot thật, gọi trước", d: "Gửi quan sát ngay khi bắt đầu chuỗi. Server trả lời sau 1,3 s, robot đã làm xong 0,8 s nên chỉ còn chờ 0,5 s. Muốn hết khựng cần thêm server gần robot (độ trễ < 0,8 s).", wait: LAT - CHUNK, label: "robot chờ" },
  };
  const MODES_L = {
    en: {
      sim: { t: "Simulation pauses to wait for the model", d: "While waiting for the server, the simulation stands still: for a virtual robot, time does not pass. Results are unaffected by latency; it just runs slower than real time.", wait: LAT, label: "simulation paused" },
      real: { t: "Real robot, call when the chunk runs out", d: "Real time does not stop. The robot finishes 0.8 s of motion before sending the observation, then has to wait the full 1.3 s: motion stalls.", wait: LAT, label: "robot stalls" },
      pre: { t: "Real robot, call ahead", d: "Send the observation as soon as the chunk starts. The server replies after 1.3 s; the robot has already done 0.8 s, so it only waits 0.5 s. Removing the stall entirely needs a server closer to the robot (latency < 0.8 s).", wait: LAT - CHUNK, label: "robot waits" },
    },
    ja: {
      sim: { t: "シミュレーションはモデルを待って停止", d: "サーバーを待つ間、シミュレーションは静止します。仮想ロボットにとって時間は進みません。結果は遅延の影響を受けず、実時間より遅く動くだけです。", wait: LAT, label: "シミュレーション静止" },
      real: { t: "実機、チャンク終了時に呼び出し", d: "実時間は止まりません。ロボットは 0.8 s の動作を終えてから観測を送信し、1.3 s まるごと待つ必要があります。動作が停滞します。", wait: LAT, label: "ロボット停滞" },
      pre: { t: "実機、事前呼び出し", d: "チャンク開始と同時に観測を送信します。サーバーは 1.3 s 後に応答し、ロボットはすでに 0.8 s 分を終えているため、待ち時間は 0.5 s のみです。停滞を完全になくすには、ロボットの近くにサーバーを置く必要があります（遅延 < 0.8 s）。", wait: LAT - CHUNK, label: "ロボット待機" },
    },
  };
  const LOOP_T = {
    vi: { chunk: "chuỗi", model: "model ~1,3 s", axis: "thời gian thật (đồng hồ treo tường)", feel: "Robot ảo cảm nhận", seamless: "liền mạch", sim: "MÔ PHỎNG", real: "ROBOT THẬT", moving: "Robot chuyển động", ratio: "Tỉ lệ thời gian chuyển động" },
    en: { chunk: "chunk", model: "model ~1.3 s", axis: "real time (wall clock)", feel: "Virtual robot perceives", seamless: "seamless", sim: "SIMULATION", real: "REAL ROBOT", moving: "Robot moving", ratio: "Share of time in motion" },
    ja: { chunk: "チャンク", model: "モデル 約 1.3 s", axis: "実時間（壁時計）", feel: "仮想ロボットの体感", seamless: "途切れなし", sim: "シミュレーション", real: "実機", moving: "ロボットの動作", ratio: "動作時間の割合" },
  };
  function setupLoop(box) {
    const L = langOf(box), tt = LOOP_T[L] || LOOP_T.vi, MODES = MODES_L[L] || MODES_VI;
    const svg = R.$("[data-loop-svg]", box), out = R.$("[data-loop-out]", box), btns = R.$$("[data-loop-mode]", box);
    let mode = "sim";
    function render() {
      btns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.loopMode === mode)));
      const M = MODES[mode], X0 = 70, X1 = 548, T = 3 * CHUNK + 2 * LAT + 0.1, sx = t => X0 + t / T * (X1 - X0);
      let t = 0, robot = "", server = "", calls = "";
      for (let i = 0; i < 3; i++) {
        robot += `<rect x="${sx(t)}" y="40" width="${sx(t + CHUNK) - sx(t)}" height="26" rx="4" fill="${A}"/><text x="${(sx(t) + sx(t + CHUNK)) / 2}" y="57" text-anchor="middle" class="r2s-lbl" style="fill:#fff">${tt.chunk} ${i + 1}</text>`;
        const callAt = mode === "pre" ? t : t + CHUNK;
        if (i < 2) {
          server += `<rect x="${sx(callAt)}" y="96" width="${sx(callAt + LAT) - sx(callAt)}" height="20" rx="4" fill="oklch(0.9 0.05 255)" stroke="${A}" stroke-opacity=".5"/><text x="${(sx(callAt) + sx(callAt + LAT)) / 2}" y="110" text-anchor="middle" class="r2s-lbl b">${tt.model}</text>`;
          calls += `<line x1="${sx(callAt)}" y1="66" x2="${sx(callAt)}" y2="96" stroke="${A}" stroke-dasharray="3 3"/><line x1="${sx(callAt + LAT)}" y1="96" x2="${sx(callAt + LAT)}" y2="66" stroke="${A}" stroke-dasharray="3 3"/>`;
          const gapStart = t + CHUNK, gapEnd = Math.max(gapStart, callAt + LAT);
          if (gapEnd > gapStart + 1e-6) robot += `<rect x="${sx(gapStart)}" y="40" width="${sx(gapEnd) - sx(gapStart)}" height="26" rx="4" fill="${mode === "sim" ? "#eef0f3" : "#e3e6ea"}" stroke="#9aa1aa" stroke-dasharray="3 3"/><text x="${(sx(gapStart) + sx(gapEnd)) / 2}" y="${sx(gapEnd) - sx(gapStart) > 80 ? 57 : 32}" text-anchor="middle" class="r2s-lbl">${M.label}</text>`;
          t = gapEnd;
        } else t += CHUNK;
      }
      const total = t, moving = 3 * CHUNK;
      const axis = [0, 1, 2, 3, 4].filter(v => v <= T).map(v => `<line x1="${sx(v)}" y1="134" x2="${sx(v)}" y2="138" stroke="#aeb5bf"/>${lbl(sx(v) - 6, 152, v + " s")}`).join("");
      svg.innerHTML = `${lbl(6, 57, "ROBOT")}${lbl(6, 110, "SERVER")}
        <line x1="${X0}" y1="134" x2="${X1}" y2="134" stroke="${GREY}"/>${axis}${lbl(X0, 176, tt.axis)}
        ${calls}${robot}${server}`;
      const simNote = mode === "sim" ? `<li><span>${tt.feel}</span><b>${tt.seamless}</b></li>` : "";
      out.innerHTML = `<span class="ds-k">${mode === "sim" ? tt.sim : tt.real}</span><b class="mo-h">${M.t}</b>
        <ul><li><span>${tt.moving}</span><b>${fmt(moving, 1, L)} / ${fmt(total, 1, L)} s</b></li><li><span>${tt.ratio}</span><b>${Math.round(moving / total * 100)} %</b></li>${simNote}</ul>
        <p class="ds-note">${M.d}</p>`;
    }
    btns.forEach(b => b.addEventListener("click", () => { mode = b.dataset.loopMode; render(); }));
    render();
  }

  /* ---------------- notebook roadmap */
  const NB = [
    ["A", "nb01", "Đường truyền tới server", "ZeroMQ, msgpack, hợp đồng dữ liệu, độ trễ, chế độ kiểm tra chặt, kết nối lại.", "client"],
    ["A", "nb02", "Khớp, quan sát, action", "Bốn thứ tự khớp, đóng gói quan sát, giải mã action, lập lịch chuỗi 40 bước + gọi trước.", "obs · actions"],
    ["A", "nb03", "Kiểm chứng với dataset (open-loop)", "Sai số nhỏ hơn biên độ chuyển động 10–70 lần; câu lệnh của dataset cho kết quả tốt nhất.", "đạt"],
    ["B", "nb04", "Bộ giữ thăng bằng AGILE", "Vector đầu vào 80 số, hậu xử lý, chạy nhiều robot cùng lúc; trùng từng bit với bản tham chiếu.", "wbc/agile"],
    ["B", "nb05", "Giải phẫu backend mô phỏng", "Dựng tay từng bước: mô phỏng → robot → camera → vật thể → ma sát → đọc/ghi trạng thái.", "backend"],
    ["B", "nb06", "Ghép luồng đầy đủ lần đầu", "Robot đứng vững 10 s; vòng kín 300 tick chạy trọn nhưng chưa nhấc được táo.", "0 %"],
    ["C", "nb07", "Vòng lặp đầy đủ trên khung cảnh Galileo", "Dựng lại đúng khung cảnh lúc ghi dữ liệu, chạy 50 episode.", "56 %"],
    ["C", "nb08", "Runner, nguồn action, lớp an toàn", "Giữ tư thế / phát lại demo / GR00T; kiểm tra chuỗi, giới hạn tốc độ, vòng lặp episode, log.", "runner · policy"],
    ["D", "nb09", "Khung cảnh nhiều vật (real2sim)", "Bàn, đĩa, 4 loại quả và vật nhiễu; notebook tự chứa, chạy một episode.", "khung cảnh"],
    ["D", "nb10", "Đánh giá nhiều episode, nhiều vật", "Ngẫu nhiên hoá mỗi episode, khoảng tin cậy, phân tích theo quả và phía.", "66 %"],
    ["D", "nb11", "Búa → thùng ngoài Arena", "Dựng lại khung cảnh Arena, điều kiện thành công chặt, cảm biến tay–búa.", "khung cảnh"],
    ["D", "nb12", "Đánh giá nhiều episode, búa → thùng", "Hai điều kiện thành công, phân loại thất bại, chạy tiếp được khi bị dừng giữa chừng.", "73 %"],
  ];
  const PHASE = { A: "Giao tiếp với model", B: "Robot & mô phỏng", C: "Vòng kín & an toàn", D: "Áp dụng cho tác vụ mới" };
  const SHORT = { A: "Giao tiếp", B: "Robot & mô phỏng", C: "Vòng kín", D: "Tác vụ mới" };
  /* [title, description, output] per notebook, same order as NB */
  const NB_L = {
    en: [
      ["Transport to the server", "ZeroMQ, msgpack, data contract, latency, strict check mode, reconnection.", "client"],
      ["Joints, observations, actions", "Four joint orders, observation packaging, action decoding, 40-step chunk scheduling + prefetch.", "obs · actions"],
      ["Verification against the dataset (open-loop)", "Error 10–70 times smaller than the motion amplitude; the dataset instruction gives the best result.", "passed"],
      ["AGILE balance controller", "80-value input vector, post-processing, many robots at once; bit-identical to the reference.", "wbc/agile"],
      ["Anatomy of the simulation backend", "Built by hand step by step: simulation → robot → camera → objects → friction → state read/write.", "backend"],
      ["First full pipeline assembly", "Robot stands stably for 10 s; a 300-tick closed loop runs to completion but does not yet lift the apple.", "0 %"],
      ["Full loop on the Galileo scene", "Rebuilt the exact scene used during data recording, ran 50 episodes.", "56 %"],
      ["Runner, action sources, safety layer", "Hold pose / demo replay / GR00T; chunk checks, rate limiting, episode loop, logging.", "runner · policy"],
      ["Multi-object scene (real2sim)", "Table, plate, 4 kinds of fruit and distractors; self-contained notebook, runs one episode.", "scene"],
      ["Multi-episode, multi-object evaluation", "Per-episode randomisation, confidence intervals, analysis by fruit and side.", "66 %"],
      ["Hammer → bin outside Arena", "Rebuilt the Arena scene, strict success condition, hand–hammer sensors.", "scene"],
      ["Multi-episode evaluation, hammer → bin", "Two success conditions, failure classification, resumable after interruption.", "73 %"],
    ],
    ja: [
      ["サーバーへの通信経路", "ZeroMQ、msgpack、データ契約、遅延、厳格チェックモード、再接続。", "client"],
      ["関節、観測、action", "4 つの関節順序、観測のパッケージ化、action のデコード、40 ステップのチャンクのスケジューリング + 事前呼び出し。", "obs · actions"],
      ["dataset との照合検証（open-loop）", "誤差は動作振幅の 1/10–1/70。dataset の指示文で最良の結果。", "合格"],
      ["バランス制御器 AGILE", "80 値の入力ベクトル、後処理、複数ロボットの同時実行。リファレンスとビット単位で一致。", "wbc/agile"],
      ["シミュレーション backend の解剖", "手作業で段階的に構築：シミュレーション → ロボット → カメラ → 物体 → 摩擦 → 状態の読み書き。", "backend"],
      ["初めてのフルパイプライン結合", "ロボットは 10 s 安定して直立。300 tick の閉ループは最後まで動くが、リンゴはまだ持ち上げられない。", "0 %"],
      ["Galileo シーンでのフルループ", "データ収録時と同じシーンを再構築し、50 エピソードを実行。", "56 %"],
      ["Runner、action ソース、安全レイヤー", "姿勢保持 / デモ再生 / GR00T。チャンクのチェック、速度制限、エピソードループ、ログ。", "runner · policy"],
      ["複数物体のシーン（real2sim）", "テーブル、皿、4 種類の果物と妨害物。自己完結型ノートブックで 1 エピソードを実行。", "シーン"],
      ["複数エピソード・複数物体の評価", "エピソードごとのランダム化、信頼区間、果物別・左右別の分析。", "66 %"],
      ["Arena 外でのハンマー → 箱", "Arena のシーンを再構築、厳格な成功条件、手–ハンマー間センサー。", "シーン"],
      ["複数エピソードの評価、ハンマー → 箱", "2 つの成功条件、失敗の分類、途中停止後の再開に対応。", "73 %"],
    ],
  };
  const PHASE_L = { en: { A: "Model communication", B: "Robot & simulation", C: "Closed loop & safety", D: "Applying to new tasks" }, ja: { A: "モデルとの通信", B: "ロボットとシミュレーション", C: "閉ループと安全", D: "新タスクへの適用" } };
  const SHORT_L = { en: { A: "Communication", B: "Robot & simulation", C: "Closed loop", D: "New tasks" }, ja: { A: "通信", B: "ロボットとシミュレーション", C: "閉ループ", D: "新タスク" } };
  const ROAD_T = {
    vi: { rate: "TỈ LỆ THÀNH CÔNG VÒNG KÍN", phase: "GIAI ĐOẠN", out: "Đầu ra", result: "Kết quả: " },
    en: { rate: "CLOSED-LOOP SUCCESS RATE", phase: "PHASE", out: "Output", result: "Result: " },
    ja: { rate: "閉ループの成功率", phase: "フェーズ", out: "出力", result: "結果：" },
  };
  const RATE = { nb06: 0, nb07: 56, nb10: 66, nb12: 73 };
  function setupRoad(box) {
    const svg = R.$("[data-road-svg]", box), out = R.$("[data-road-out]", box);
    const L = langOf(box), tt = ROAD_T[L] || ROAD_T.vi, ph = PHASE_L[L] || PHASE, sh = SHORT_L[L] || SHORT, loc = NB_L[L];
    const txt = i => loc ? [NB[i][0], NB[i][1], ...loc[i]] : NB[i];
    let sel = 6;
    const X0 = 40, X1 = 600, sx = i => X0 + i / 11 * (X1 - X0), TRACK = 120, sy = v => 100 - v / 80 * 70;
    function render() {
      const bands = ["A", "B", "C", "D"].map(p => {
        const idx = NB.map((n, i) => n[0] === p ? i : -1).filter(i => i >= 0);
        const a = sx(idx[0]) - 20, b = sx(idx[idx.length - 1]) + 20;
        return `<rect x="${a}" y="${TRACK - 16}" width="${b - a}" height="32" rx="16" fill="oklch(0.95 0.025 255)"/>${lbl(a + 4, TRACK + 34, p + " · " + sh[p])}`;
      }).join("");
      const rp = Object.entries(RATE).map(([k, v]) => [NB.findIndex(n => n[1] === k), v]);
      const rateLine = `<path d="${rp.map(([i, v], j) => `${j ? "L" : "M"}${sx(i)},${sy(v)}`).join("")}" fill="none" stroke="${A}" stroke-width="2"/>`
        + rp.map(([i, v]) => `<circle cx="${sx(i)}" cy="${sy(v)}" r="4" fill="${A}"/><text x="${v ? sx(i) : sx(i) - 10}" y="${v ? sy(v) - 8 : sy(v) + 4}" text-anchor="${v ? "middle" : "end"}" class="r2s-lbl b" style="font-weight:700">${v} %</text>`).join("");
      const nodes = NB.map((_, i) => {
        const n = txt(i), on = i === sel;
        return `<g class="md-block" data-nb="${i}" tabindex="0" role="button" aria-label="${n[1]}: ${n[2]}">
          <circle cx="${sx(i)}" cy="${TRACK}" r="${on ? 15 : 12}" fill="${on ? A : "#fff"}" stroke="${A}" stroke-width="2"/>
          <text x="${sx(i)}" y="${TRACK + 4}" text-anchor="middle" style="font:700 ${on ? 9.5 : 8.5}px 'IBM Plex Mono',monospace;fill:${on ? "#fff" : INK}">${n[1].slice(2)}</text></g>`;
      }).join("");
      svg.innerHTML = `${lbl(6, 14, tt.rate)}${bands}${rateLine}
        <line x1="${X0}" y1="${TRACK}" x2="${X1}" y2="${TRACK}" stroke="${A}" stroke-opacity=".35" stroke-width="2"/>${nodes}`;
      R.$$(".md-block", svg).forEach(g => {
        const go = () => { sel = +g.dataset.nb; render(); };
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      const n = txt(sel);
      out.innerHTML = `<span class="ds-k">${tt.phase} ${n[0]} · ${ph[n[0]].toUpperCase()} · ${n[1].toUpperCase()}</span><b class="mo-h">${n[2]}</b><p class="ds-note">${n[3]}</p>
        <ul><li><span>${tt.out}</span><b>${/%|đạt/.test(NB[sel][4]) ? tt.result : "Module: "}${n[4]}</b></li></ul>`;
    }
    render();
  }

  R.pipeline = {
    init() {
      if (!R.$("#nghien-cuu-pipeline")) return;
      const map = { loop: setupLoop, road: setupRoad };
      R.$$("[data-pp]").forEach(box => { try { map[box.dataset.pp] && map[box.dataset.pp](box); } catch (e) { console.error("pipeline", box.dataset.pp, e); } });
    },
  };
})();
