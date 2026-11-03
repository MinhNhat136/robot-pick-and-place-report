/* SVG building helpers shared by the chart renderers. */
(function () {
  "use strict";
  const R = window.Report;
  const NS = "http://www.w3.org/2000/svg";

  R.svg = {
    /** Create an SVG element with attributes, optionally appending it to parent. */
    el(name, attrs = {}, parent) {
      const node = document.createElementNS(NS, name);
      for (const k in attrs) node.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(node);
      return node;
    },
    /** Root <svg> sized by viewBox so it scales with its container. */
    root(width, height, label) {
      return R.svg.el("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label || "chart" });
    },
    /** The section accent color (marks take the section hue; text never does). */
    accent(node) {
      return getComputedStyle(node).getPropertyValue("--accent").trim() || "#3b6fb6";
    },
  };
})();
