/* Effects panel: live sliders/toggles for the backdrop gradient, the glass and the scroll motion.
   Values are CSS variables on <html> (see the "Tunable values" block in glass.css) or properties
   of other modules (R.liquid.max, R.refract.scale/on). Settings are remembered in this browser;
   "Sao chép CSS" copies a :root{…} block to paste into glass.css to make them the default. */
(function () {
  "use strict";
  const R = window.Report;
  const KEY = "report-tuner";
  const root = document.documentElement;

  // [id, label, min, max, step, default, unit, apply(v)]
  const css = (name, unit = "") => v => root.style.setProperty(name, v + unit);
  const GROUPS = [
    ["NỀN GRADIENT", [
      ["bg-a1", "Vùng màu góc trên trái", 0, 1, .01, .6, "", css("--bg-a1")],
      ["bg-a2", "Vùng màu góc dưới phải", 0, 1, .01, .55, "", css("--bg-a2")],
      ["bg-c", "Độ tươi màu", 0, .2, .005, .08, "", css("--bg-c")],
      ["bg-grid", "Độ đậm lưới", 0, .2, .005, .05, "", css("--bg-grid")],
    ]],
    ["KÍNH", [
      ["glass-fill", "Độ trắng của card", 0, .8, .01, .18, "", css("--glass-fill")],
      ["glass-blur", "Độ mờ phía sau", 0, 40, 1, 14, "px", css("--glass-blur-px")],
      ["glass-sat", "Độ bão hoà màu", 100, 250, 5, 165, "%", css("--glass-sat")],
      ["side-fill", "Độ trắng 2 cột bên", 0, .8, .01, .3, "", css("--side-fill")],
      ["refract-scale", "Khúc xạ mép (2 cột bên)", 0, 100, 2, 40, "px", v => { if (R.refract) { R.refract.scale = v; R.refract.refresh(); } }],
    ], [
      ["refract-on", "Bật khúc xạ", true, v => { if (R.refract) { R.refract.on = v; R.refract.refresh(); } }],
    ]],
    ["CHUYỂN ĐỘNG KHI CUỘN", [
      ["liq-stretch", "Độ dãn dọc", 0, .08, .001, .022, "", css("--liq-stretch")],
      ["liq-squeeze", "Độ co ngang", 0, .05, .001, .012, "", css("--liq-squeeze")],
      ["liq-lag", "Độ trễ (trôi theo)", 0, 30, 1, 7, "px", css("--liq-lag", "px")],
      ["liq-dur", "Thời gian bật lại", .1, 2, .05, .65, "s", css("--liq-dur", "s")],
      ["liq-bounce", "Độ nảy khi dừng", 1, 2.6, .05, 1.6, "", css("--liq-bounce")],
      ["liq-sens", "Độ nhạy theo tốc độ cuộn", .5, 6, .1, 2.2, "", v => { if (R.liquid) R.liquid.max = 8.2 - v; }],
    ], [
      ["liq-on", "Bật chuyển động", false, v => root.classList.toggle("no-liquid", !v)],
    ]],
  ];
  const PRESETS = {
    "Mặc định": {},
    "Nhẹ nhàng": { "bg-a1": .4, "bg-a2": .35, "glass-fill": .3, "liq-stretch": .01, "liq-squeeze": .005, "liq-lag": 3, "liq-bounce": 1.3, "liq-on": true },
    "Nổi bật": { "bg-a1": .85, "bg-a2": .8, "bg-c": .12, "glass-fill": .12, "glass-sat": 200, "liq-stretch": .04, "liq-lag": 14, "liq-bounce": 2, "liq-on": true },
    "Tĩnh": { "liq-on": false, "refract-on": false },
  };

  const all = () => GROUPS.flatMap(g => [...g[1], ...(g[2] || [])]);
  const defaults = () => Object.fromEntries(all().map(c => [c[0], c.length === 4 ? c[2] : c[5]]));
  let state = {};

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  const fmt = (v, unit, step) => (step < 1 ? v.toFixed(String(step).split(".")[1].length) : String(v)) + (unit || "");

  function setValue(id, v, write = true) {
    const c = all().find(x => x[0] === id); if (!c) return;
    state[id] = v;
    (c.length === 4 ? c[3] : c[7])(v);
    const input = document.getElementById("tn-" + id);
    if (input) {
      if (input.type === "checkbox") input.checked = v; else input.value = v;
      const out = document.getElementById("tno-" + id);
      if (out) out.textContent = fmt(v, c[6], c[4]);
    }
    if (write) save();
  }

  function build() {
    const btn = document.createElement("button");
    btn.className = "tuner-btn no-print"; btn.type = "button";
    btn.setAttribute("aria-label", "Điều chỉnh hiệu ứng"); btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';

    const panel = document.createElement("div");
    panel.className = "tuner no-print"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Điều chỉnh hiệu ứng");
    let body = `<div class="tuner-h"><b>Điều chỉnh hiệu ứng</b><small>CÔNG CỤ BIÊN TẬP</small></div><div class="tuner-body">` +
      `<fieldset><legend>MẪU NHANH</legend><div class="tn-presets">${Object.keys(PRESETS).map(p => `<button type="button" data-preset="${p}">${p}</button>`).join("")}</div></fieldset>`;
    for (const [title, sliders, toggles] of GROUPS) {
      body += `<fieldset><legend>${title}</legend>`;
      (toggles || []).forEach(([id, label]) => {
        body += `<label class="tn-toggle">${label}<input type="checkbox" id="tn-${id}"></label>`;
      });
      sliders.forEach(([id, label, min, max, step]) => {
        body += `<div class="tn-row"><label for="tn-${id}">${label}</label><output id="tno-${id}"></output>` +
          `<input type="range" id="tn-${id}" min="${min}" max="${max}" step="${step}"></div>`;
      });
      body += `</fieldset>`;
    }
    body += `<p class="tuner-note">Thay đổi chỉ lưu trong trình duyệt này. Bấm "Sao chép CSS" để lấy giá trị làm mặc định cho báo cáo.</p></div>` +
      `<div class="tuner-f"><button type="button" data-reset>Đặt lại</button><button type="button" class="solid" data-copy>Sao chép CSS</button></div>`;
    panel.innerHTML = body;
    document.body.append(panel, btn);

    btn.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) btn.click(); });

    all().forEach(c => {
      const id = c[0], input = document.getElementById("tn-" + id);
      const isToggle = c.length === 4;
      input.addEventListener("input", () => setValue(id, isToggle ? input.checked : parseFloat(input.value)));
    });
    R.$$("[data-preset]", panel).forEach(b => b.addEventListener("click", () => {
      const p = { ...defaults(), ...PRESETS[b.dataset.preset] };
      Object.entries(p).forEach(([k, v]) => setValue(k, v, false)); save();
    }));
    R.$("[data-reset]", panel).addEventListener("click", () => {
      Object.entries(defaults()).forEach(([k, v]) => setValue(k, v, false));
      state = {}; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    });
    R.$("[data-copy]", panel).addEventListener("click", e => {
      const v = { ...defaults(), ...state };
      const line = (n, val) => `  ${n}:${val};`;
      const text = ":root{\n" + [
        line("--bg-a1", v["bg-a1"]), line("--bg-a2", v["bg-a2"]), line("--bg-c", v["bg-c"]), line("--bg-grid", v["bg-grid"]),
        line("--glass-fill", v["glass-fill"]), line("--glass-blur-px", v["glass-blur"]), line("--glass-sat", v["glass-sat"]), line("--side-fill", v["side-fill"]),
        line("--liq-stretch", v["liq-stretch"]), line("--liq-squeeze", v["liq-squeeze"]), line("--liq-lag", v["liq-lag"] + "px"),
        line("--liq-dur", v["liq-dur"] + "s"), line("--liq-bounce", v["liq-bounce"]),
      ].join("\n") + `\n}\n/* refract.scale = ${v["refract-scale"]}, refract on = ${v["refract-on"]}, liquid sensitivity = ${v["liq-sens"]}, liquid on = ${v["liq-on"]} */`;
      const b = e.currentTarget;
      const done = ok => { b.textContent = ok ? "Đã sao chép ✓" : "Không sao chép được"; setTimeout(() => (b.textContent = "Sao chép CSS"), 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); else done(false);
    });
  }

  R.tuner = {
    init() {
      build();
      const saved = load();
      Object.entries({ ...defaults(), ...saved }).forEach(([k, v]) => setValue(k, v, false));
      state = saved;
    },
  };
})();
