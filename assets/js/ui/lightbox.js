/* Click any figure.fig or .task image to view it full screen with its caption. Esc or click closes. */
(function () {
  "use strict";
  const R = window.Report;
  let box;

  const close = () => box && box.classList.remove("open");

  function open(img) {
    R.$("img", box).src = img.src;
    const fig = img.closest("figure");
    const cap = fig && fig.querySelector("figcaption");
    R.$(".cap", box).innerHTML = cap ? cap.innerHTML : (img.alt || "");
    box.classList.add("open");
  }

  R.lightbox = {
    init() {
      box = document.createElement("div");
      box.className = "lightbox";
      box.innerHTML = '<img alt=""><div class="cap"></div>';
      document.body.appendChild(box);
      box.addEventListener("click", close);
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
      R.$$("figure.fig img, .task img").forEach(img => img.addEventListener("click", () => open(img)));
    },
    close,
  };
})();
