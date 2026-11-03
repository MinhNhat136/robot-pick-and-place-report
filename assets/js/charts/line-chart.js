/* Single-series line with area wash and a crosshair tooltip. Linear or log y.
   data: {title, points:[[x,y]], log, xLabel, yLabel, xTicks, yTicks, locale?} */
(function () {
  "use strict";
  const R = window.Report;
  const { el } = R.svg;

  function render(host, data) {
    const pts = data.points;
    const W = Math.max(host.clientWidth, 320), H = Math.round(Math.min(320, Math.max(220, W * 0.36)));
    const L = 52, Rt = 18, T = 12, B = 34;
    const svg = R.svg.root(W, H, data.title);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    const f = data.log ? Math.log10 : v => v;
    const ymin = data.log ? Math.min(...ys) * 0.85 : 0, ymax = Math.max(...ys) * 1.08;
    const X = v => L + ((v - xmin) / (xmax - xmin)) * (W - L - Rt);
    const Y = v => T + ((f(ymax) - f(v)) / (f(ymax) - f(ymin))) * (H - T - B);
    const color = R.svg.accent(host);

    (data.yTicks || [0.02, 0.05, 0.1, 0.2, 0.5, 1]).forEach(t => {
      if (t < ymin || t > ymax) return;
      el("line", { x1: L, x2: W - Rt, y1: Y(t), y2: Y(t), class: "grid" }, svg);
      el("text", { x: L - 8, y: Y(t) + 4, "text-anchor": "end" }, svg).textContent = t;
    });
    (data.xTicks || [0, 2000, 4000, 6000, 8000, 10000]).forEach(t => {
      el("text", { x: X(Math.max(t, xmin)), y: H - 10, "text-anchor": "middle" }, svg).textContent = t.toLocaleString(data.locale || "vi-VN");
    });
    el("line", { x1: L, x2: W - Rt, y1: H - B, y2: H - B, class: "axis" }, svg);

    const d = pts.map((p, i) => (i ? "L" : "M") + X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join("");
    el("path", { d: d + `L${X(xmax)},${H - B}L${X(xmin)},${H - B}Z`, fill: color, opacity: 0.1 }, svg);
    el("path", { d, fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);

    // label the end point only
    const last = pts[pts.length - 1];
    el("circle", { cx: X(last[0]), cy: Y(last[1]), r: 4.5, fill: color, stroke: "#fff", "stroke-width": 2 }, svg);
    el("text", { x: X(last[0]) - 6, y: Y(last[1]) - 10, "text-anchor": "end", class: "lbl" }, svg).textContent = last[1].toFixed(3);

    // crosshair + nearest-point tooltip
    const cross = el("line", { y1: T, y2: H - B, stroke: "rgba(34,38,30,.35)", "stroke-width": 1, opacity: 0 }, svg);
    const dot = el("circle", { r: 5, fill: color, stroke: "#fff", "stroke-width": 2, opacity: 0 }, svg);
    const hit = el("rect", { x: L, y: T, width: W - L - Rt, height: H - T - B, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", e => {
      const b = svg.getBoundingClientRect();
      const xv = xmin + (((e.clientX - b.left) * (W / b.width) - L) / (W - L - Rt)) * (xmax - xmin);
      let best = pts[0];
      for (const p of pts) if (Math.abs(p[0] - xv) < Math.abs(best[0] - xv)) best = p;
      cross.setAttribute("x1", X(best[0])); cross.setAttribute("x2", X(best[0])); cross.setAttribute("opacity", 1);
      dot.setAttribute("cx", X(best[0])); dot.setAttribute("cy", Y(best[1])); dot.setAttribute("opacity", 1);
      R.tooltip.show(`<span class="tk">${data.xLabel || "x"} ${best[0].toLocaleString(data.locale || "vi-VN")}</span><b>${data.yLabel || "y"}: ${best[1]}</b>`, e);
    });
    hit.addEventListener("mouseleave", () => { cross.setAttribute("opacity", 0); dot.setAttribute("opacity", 0); R.tooltip.hide(); });
    return svg;
  }

  R.charts = R.charts || {};
  R.charts.types = R.charts.types || {};
  R.charts.types.line = { render };
})();
