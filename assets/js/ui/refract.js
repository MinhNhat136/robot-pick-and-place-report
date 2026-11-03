/* Edge refraction for the glass surfaces (Chromium only).
   Apple's liquid glass bends the background near a panel's rim. We approximate it with an SVG
   filter used as a backdrop-filter: a per-element displacement map that is neutral (128,128) in the
   middle and pushes pixels along the rounded-rect normal inside a thin band at the edge, so the
   content behind looks magnified and curved only at the border.
   Browsers that cannot run url() backdrop filters keep the plain CSS glass from glass.css. */
(function () {
  "use strict";
  const R = window.Report;
  // only the two fixed side panels: card refraction re-rendered on every scroll frame and made scrolling stutter
  const SEL = ".toc, .sidebar";
  const BAND = 22;      // px of rim that refracts
  const NS = "http://www.w3.org/2000/svg";

  let defs, cache = new Map(), seq = 0;

  // url() inside backdrop-filter renders in Chromium (Chrome, Edge) only
  const supported = () => /Chrome\//.test(navigator.userAgent) && CSS.supports("backdrop-filter", "url(#x)");

  // signed distance to a rounded rectangle (centred at origin, half-size hw,hh, radius r)
  function sdf(px, py, hw, hh, r) {
    const qx = Math.abs(px) - (hw - r), qy = Math.abs(py) - (hh - r);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
  }

  function mapURL(w, h, r) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(w, h), d = img.data;
    const hw = w / 2, hh = h / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - hw, py = y + 0.5 - hh;
        const dist = -sdf(px, py, hw, hh, r);          // distance inside the edge
        let vx = 0, vy = 0;
        if (dist >= 0 && dist < BAND) {
          // outward normal from the SDF gradient
          const e = 0.75;
          const gx = sdf(px + e, py, hw, hh, r) - sdf(px - e, py, hw, hh, r);
          const gy = sdf(px, py + e, hw, hh, r) - sdf(px, py - e, hw, hh, r);
          const len = Math.hypot(gx, gy) || 1;
          // strongest right at the rim, eased to zero at the inner side of the band (lens profile)
          const t = 1 - dist / BAND;
          const k = t * t * (3 - 2 * t);
          vx = (gx / len) * k; vy = (gy / len) * k;
        }
        const i = (y * w + x) * 4;
        d[i] = 128 + vx * 127;      // R → x displacement
        d[i + 1] = 128 + vy * 127;  // G → y displacement
        d[i + 2] = 128; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }

  function filterFor(w, h, r) {
    const key = `${w}x${h}r${r}`;
    if (cache.has(key)) return cache.get(key);
    const id = "lg-" + (++seq);
    const f = document.createElementNS(NS, "filter");
    f.setAttribute("id", id);
    f.setAttribute("x", "0"); f.setAttribute("y", "0");
    f.setAttribute("width", w); f.setAttribute("height", h);
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("color-interpolation-filters", "sRGB");
    // a single displacement (no per-channel split) keeps the cost to one pass per frame
    f.innerHTML =
      `<feImage href="${mapURL(w, h, r)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="map" scale="${R.refract.scale}" xChannelSelector="R" yChannelSelector="G"/>`;
    defs.appendChild(f);
    cache.set(key, id);
    return id;
  }

  function apply(el) {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    // the map costs w*h work; skip panels too large to be worth it (they keep the CSS glass)
    if (w * h > 1600 * 1400) return;
    const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 18, w / 2, h / 2);
    const id = filterFor(w, h, Math.round(r));
    // lighter blur than the CSS fallback, otherwise the bent background is blurred away
    const blur = getComputedStyle(document.documentElement).getPropertyValue("--glass-blur-refract").trim() || "blur(4px)";
    el.style.backdropFilter = el.style.webkitBackdropFilter = `url(#${id}) ${blur}`;
  }

  function run() { R.$$(SEL).forEach(el => { if (el.offsetParent || el.classList.contains("sidebar")) apply(el); }); }

  R.refract = {
    scale: 40,   // displacement strength in px (tuner)
    on: true,
    /** Rebuild every filter (after the strength changes) or remove them (off). */
    refresh() {
      if (!defs) return;
      defs.innerHTML = ""; cache.clear();
      R.$$(SEL).forEach(el => { el.style.backdropFilter = el.style.webkitBackdropFilter = ""; });
      document.documentElement.classList.toggle("refract", R.refract.on);
      if (R.refract.on) run();
    },
    init() {
      if (!supported()) return;
      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
      defs = document.createElementNS(NS, "defs");
      svg.appendChild(defs);
      document.body.appendChild(svg);
      document.documentElement.classList.add("refract");
      R.on("section:shown", () => requestAnimationFrame(run));
      R.on("layout:changed", () => requestAnimationFrame(run));
      let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(run, 200); });
      // panels whose height changes (accordions, tabs, video metadata) get a fresh map
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(entries => entries.forEach(e => apply(e.target)));
        R.$$(SEL).forEach(el => ro.observe(el));
      }
    },
  };
})();
