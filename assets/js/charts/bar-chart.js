/* Horizontal bars, 0–100 %.
   data: {title, rows:[{label, k, n, note} | {label, value, text}]} */
(function () {
  "use strict";
  const R = window.Report;
  const { el } = R.svg;

  function render(host, data) {
    const rows = data.rows;
    const W = Math.max(host.clientWidth, 300);
    const labelW = Math.min(170, W * 0.32), right = 70, rowH = 34, top = 6, bottom = 26, barH = 16;
    const H = top + rows.length * rowH + bottom;
    const svg = R.svg.root(W, H, data.title);
    const x0 = labelW, x1 = W - right, X = v => x0 + v * (x1 - x0);
    const color = R.svg.accent(host);

    [0, 0.5, 1].forEach(t => {
      el("line", { x1: X(t), x2: X(t), y1: top, y2: H - bottom, class: t === 0 ? "axis" : "grid" }, svg);
      el("text", { x: X(t), y: H - 8, "text-anchor": "middle" }, svg).textContent = Math.round(t * 100) + "%";
    });

    rows.forEach((r, i) => {
      const v = r.value !== undefined ? r.value : r.k / r.n, y = top + i * rowH + rowH / 2;
      const g = el("g", { tabindex: 0 }, svg);
      el("rect", { x: 0, y: y - rowH / 2, width: W, height: rowH, fill: "transparent" }, g);
      el("text", { x: x0 - 10, y: y + 4, "text-anchor": "end", class: "lbl" }, g).textContent = r.label;
      // square at the baseline, 4px rounded data-end
      const w = Math.max(X(v) - x0, 0), rr = Math.min(4, w);
      el("path", { d: `M${x0},${y - barH / 2} h${w - rr} q${rr},0 ${rr},${rr} v${barH - 2 * rr} q0,${rr} ${-rr},${rr} h${-(w - rr)} z`, fill: color }, g);
      el("text", { x: X(v) + 8, y: y + 4, class: "lbl" }, g).textContent = r.text || R.pct(v);
      R.tooltip.bind(g, `<span class="tk">${r.label}</span><b>${r.n ? r.k + "/" + r.n + " = " : ""}${R.pct(v)}</b>${r.note ? "<br>" + r.note : ""}`, X(v));
    });
    return svg;
  }

  R.charts = R.charts || {};
  R.charts.types = R.charts.types || {};
  R.charts.types.bars = { render };
})();
