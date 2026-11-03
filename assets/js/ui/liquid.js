/* Liquid motion while scrolling: content cards stretch a little along the scroll direction and
   trail slightly behind, then spring back (with a small overshoot) when scrolling stops.
   Only two CSS variables on .main change per frame (--lv: signed velocity, --la: its magnitude,
   both in -1..1); the cards read them in their transform, so the work is GPU compositing only. */
(function () {
  "use strict";
  const R = window.Report;
  const STOP_MS = 90;       // no scroll event for this long = stopped

  R.liquid = {
    max: 2.2,            // px per ms that counts as "full speed" (tuner: sensitivity)
    init() {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const main = R.$(".main");
      const scroller = () => (getComputedStyle(main).overflowY === "auto" ? main : document.scrollingElement);
      let lastY = scroller().scrollTop, lastT = performance.now(), v = 0, timer, raf = 0;

      const write = () => {
        raf = 0;
        main.style.setProperty("--lv", v.toFixed(3));
        main.style.setProperty("--la", Math.abs(v).toFixed(3));
      };
      const onScroll = () => {
        const now = performance.now(), y = scroller().scrollTop;
        const dt = Math.max(now - lastT, 8);
        const target = Math.max(-1, Math.min(1, (y - lastY) / dt / R.liquid.max));
        v += (target - v) * 0.35;            // smooth the raw velocity
        lastY = y; lastT = now;
        main.classList.add("is-scrolling");
        if (!raf) raf = requestAnimationFrame(write);
        clearTimeout(timer);
        timer = setTimeout(() => {          // stopped: release, the CSS spring brings cards back
          v = 0; write();
          main.classList.remove("is-scrolling");
        }, STOP_MS);
      };
      main.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
    },
  };
})();
