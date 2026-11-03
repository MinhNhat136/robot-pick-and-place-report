/* Dot + Wilson 95 % interval per row.
   data: {title, rows:[{label, sub, k, n, highlight, note}], head?:[evalHeader, successHeader]} */
(function () {
  "use strict";
  const R = window.Report;
  const { el } = R.svg;

  function render(host, data) {
    const rows = data.rows;
    const W = Math.max(host.clientWidth, 320);
    const labelW = Math.min(300, W * 0.42), right = 64, rowH = 46, top = 8, bottom = 30;
    const H = top + rows.length * rowH + bottom;
    const svg = R.svg.root(W, H, data.title);
    const x0 = labelW, x1 = W - right, X = v => x0 + v * (x1 - x0);
    const color = R.svg.accent(host);

    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      el("line", { x1: X(t), x2: X(t), y1: top, y2: H - bottom, class: t === 0 ? "axis" : "grid" }, svg);
      el("text", { x: X(t), y: H - 10, "text-anchor": "middle" }, svg).textContent = Math.round(t * 100) + "%";
    });

    rows.forEach((r, i) => {
      const [lo, hi] = R.wilson(r.k, r.n), p = r.k / r.n, y = top + i * rowH + rowH / 2;
      const g = el("g", { tabindex: 0 }, svg);
      el("rect", { x: 0, y: y - rowH / 2, width: W, height: rowH, fill: "transparent" }, g);
      el("text", { x: 0, y: y - 3, class: "lbl" }, g).textContent = r.label;
      if (r.sub) el("text", { x: 0, y: y + 13, "font-size": 11 }, g).textContent = r.sub;
      const ci = { stroke: color, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.55 };
      el("line", { x1: X(lo), x2: X(hi), y1: y, y2: y, ...ci }, g);
      el("line", { x1: X(lo), x2: X(lo), y1: y - 5, y2: y + 5, ...ci }, g);
      el("line", { x1: X(hi), x2: X(hi), y1: y - 5, y2: y + 5, ...ci }, g);
      el("circle", { cx: X(p), cy: y, r: r.highlight ? 7 : 5.5, fill: color, stroke: "#fff", "stroke-width": 2 }, g);
      el("text", { x: x1 + 10, y: y + 4, class: "lbl" }, g).textContent = R.pct(p);
      R.tooltip.bind(g,
        `<span class="tk">${r.label}</span><b>${r.k}/${r.n} = ${R.pct(p)}</b><br>Wilson 95 %: ${R.pct(lo)} – ${R.pct(hi)}${r.note ? "<br>" + r.note : ""}`,
        X(p));
    });
    return svg;
  }

  /** Table equivalent, used when the author leaves .table-view empty. */
  function table(data) {
    const rows = data.rows.map(r => {
      const [lo, hi] = R.wilson(r.k, r.n);
      return `<tr><td>${r.label}<br><span style="color:var(--muted);font-size:12px">${r.sub || ""}</span></td>` +
        `<td class="num">${r.n}</td><td class="num">${r.k} (${R.pct(r.k / r.n)})</td><td>${R.pct(lo)} – ${R.pct(hi)}</td></tr>`;
    }).join("");
    const [hEval, hOk] = data.head || ["Đánh giá", "Thành công"];   // optional translated headers
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${hEval}</th><th class="num">n</th>` +
      `<th class="num">${hOk}</th><th>Wilson 95 %</th></tr></thead><tbody>` + rows + "</tbody></table></div>";
  }

  R.charts = R.charts || {};
  R.charts.types = R.charts.types || {};
  R.charts.types.ci = { render, table };
})();
