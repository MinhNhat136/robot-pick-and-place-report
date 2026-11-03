/* Number helpers shared by charts and tables. */
(function () {
  "use strict";
  const R = window.Report;

  /** Wilson score interval for k successes out of n trials (95 % by default). */
  R.wilson = function (k, n, z = 1.96) {
    if (!n) return [0, 0];
    const p = k / n, d = 1 + (z * z) / n;
    const center = (p + (z * z) / (2 * n)) / d;
    const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
    return [Math.max(0, center - margin), Math.min(1, center + margin)];
  };

  /** 0.56 → "56 %" */
  R.pct = v => Math.round(v * 100) + " %";
})();
