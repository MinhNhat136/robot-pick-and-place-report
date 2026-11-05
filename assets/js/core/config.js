/* Fills every [data-cfg="key"] element from window.REPORT_CONFIG (config/report.config.js).
   A key may have key_en / key_ja variants: an element inside a translated block (data-i18n="en")
   uses that language, other elements use the language chosen in the switcher. */
(function () {
  "use strict";
  const R = window.Report;
  const cfg = () => window.REPORT_CONFIG || {};
  const pick = (key, lang) => {
    const c = cfg();
    return (lang && lang !== "vi" && c[key + "_" + lang]) || c[key];
  };

  function fill() {
    const cur = R.lang ? R.lang.current : "vi";
    R.$$("[data-cfg]").forEach(el => {
      const block = el.closest("[data-i18n]");
      const v = pick(el.dataset.cfg, block ? block.dataset.i18n : cur);
      if (v !== undefined && v !== null && v !== "") el.textContent = v;
    });
  }

  R.config = {
    init() {
      fill();
      if (R.on) R.on("lang:changed", fill);
    },
    /** Value of a key in the given language (default: the language chosen in the switcher). */
    get(key, lang) { return pick(key, lang || (R.lang ? R.lang.current : "vi")); },
  };
})();
