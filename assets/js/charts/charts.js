/* Mounts every <div class="chart" data-chart="ci|bars|line" data-source="key">.
   Data comes from window.Report.chartData[key] (data/charts.js).
   Hidden charts are skipped and drawn when their section opens. */
(function () {
  "use strict";
  const R = window.Report;
  R.charts = R.charts || {};
  R.charts.types = R.charts.types || {};

  function draw(host) {
    if (!host.offsetParent) return; // not visible yet
    const type = R.charts.types[host.dataset.chart];
    const data = (R.chartData || {})[host.dataset.source];
    if (!type || !data) {
      console.warn("chart skipped:", host.dataset.chart, host.dataset.source);
      return;
    }
    const plot = R.$(".plot", host) || host;
    plot.innerHTML = "";
    plot.appendChild(type.render(plot, data));
    const tv = R.$(".table-view", host);
    if (tv && !tv.children.length && type.table) tv.innerHTML = type.table(data);
  }

  R.charts.redraw = () => R.$$(".chart[data-chart]").forEach(draw);

  R.charts.init = function () {
    R.$$("[data-table-toggle]").forEach(b => b.addEventListener("click", () => {
      const chart = b.closest(".chart");
      chart.classList.toggle("show-table");
      const table = chart.classList.contains("show-table");
      b.textContent = table ? b.dataset.lChart || "Xem biểu đồ" : b.dataset.lTable || "Xem dạng bảng";
    }));
    R.on("section:shown", R.charts.redraw);
    R.on("layout:changed", R.charts.redraw);
    let timer;
    window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(R.charts.redraw, 150); });
  };
})();
