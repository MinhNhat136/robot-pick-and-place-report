/* Boot order. Charts subscribe before the router opens the first section. */
(function () {
  "use strict";
  const R = window.Report;
  document.addEventListener("DOMContentLoaded", () => {
    R.config.init();
    R.tabs.init();
    R.lightbox.init();
    R.filters.init();
    R.video.init();
    R.print.init();
    R.charts.init();
    R.toc.init();
    R.refract.init();
    R.liquid.init();
    R.jump.init();
    R.loop.init();
    R.tuner.init();  // after refract/liquid so it can drive them
    R.lang.init();
    R.router.init(); // opens the section from the URL hash (or the first one)
    try { R.datasim.init(); } catch (e) { console.error(e); } // II.04 explainers; must never block routing
    try { R.motion.init(); } catch (e) { console.error(e); }  // II.03 explainers
    try { R.model.init(); } catch (e) { console.error(e); }   // II.01 explainers
    try { R.pipeline.init(); } catch (e) { console.error(e); } // II.02 explainers
  });
})();
