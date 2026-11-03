/* Fills every [data-cfg="key"] element from window.REPORT_CONFIG (config/report.config.js). */
(function () {
  "use strict";
  const R = window.Report;

  R.config = {
    init() {
      const cfg = window.REPORT_CONFIG || {};
      R.$$("[data-cfg]").forEach(el => {
        const v = cfg[el.dataset.cfg];
        if (v !== undefined && v !== null && v !== "") el.textContent = v;
      });
    },
    get(key) { return (window.REPORT_CONFIG || {})[key]; },
  };
})();
