/* One shared tooltip for every chart. */
(function () {
  "use strict";
  const R = window.Report;
  let tip;

  function ensure() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "tip";
    document.body.appendChild(tip);
    return tip;
  }

  R.tooltip = {
    show(html, ev) {
      const t = ensure();
      t.innerHTML = html;
      t.classList.add("show");
      const pad = 14, w = t.offsetWidth, h = t.offsetHeight;
      let x = ev.clientX + pad, y = ev.clientY + pad;
      if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
      if (y + h > innerHeight - 8) y = ev.clientY - h - pad;
      t.style.left = x + "px";
      t.style.top = y + "px";
    },
    hide() { if (tip) tip.classList.remove("show"); },
    /** Wire hover + keyboard focus on an SVG group. */
    bind(group, html, anchor) {
      group.addEventListener("mousemove", e => R.tooltip.show(html, e));
      group.addEventListener("mouseleave", R.tooltip.hide);
      group.addEventListener("focus", () => {
        const b = group.getBoundingClientRect();
        R.tooltip.show(html, { clientX: b.left + (anchor || 0), clientY: b.top });
      });
      group.addEventListener("blur", R.tooltip.hide);
    },
  };
})();
