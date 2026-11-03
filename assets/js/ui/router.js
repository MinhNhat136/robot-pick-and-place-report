/* One section at a time.
   The sidebar links are plain #hash links; the router shows only the matching
   <section class="section">, updates the topbar, the active link
   and the reading-progress bar. Prev/Next buttons and ←/→ keys move between sections. */
(function () {
  "use strict";
  const R = window.Report;

  let sections = [], links = [], current = null, main, bar;

  const scroller = () => (getComputedStyle(main).overflowY === "auto" ? main : document.scrollingElement);

  function updateTopbar(sec) {
    const k = R.$("#top-k"), t = R.$("#top-t");
    const attr = key => (R.lang ? R.lang.attr(sec, key) : sec.dataset[key] || "");
    if (k) k.textContent = attr("kicker");
    if (t) t.textContent = attr("title");
    document.title = `${attr("title")} · ${R.config.get("title") || ""}`;
    R.$(".topbar").dataset.hue = sec.dataset.hue || "blue";
    const i = sections.indexOf(sec);
    R.$$("[data-goto]").forEach(b => {
      const edge = b.dataset.goto === "prev" ? i === 0 : i === sections.length - 1;
      b.disabled = edge;
      b.style.opacity = edge ? 0.45 : 1;
    });
  }

  function updateSidebar(sec) {
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + sec.id));
    document.body.classList.remove("nav-open");
  }

  function show(id) {
    const sec = sections.find(s => s.id === id) || sections[0];
    sections.forEach(s => { s.hidden = s !== sec; });
    sec.style.animation = "none"; void sec.offsetWidth; sec.style.animation = ""; // replay fade-in
    current = sec;
    updateTopbar(sec);
    updateSidebar(sec);
    scroller().scrollTop = 0;
    if (bar) bar.style.width = "0%";
    R.emit("section:shown", sec);
  }

  function go(step) {
    const target = sections[sections.indexOf(current) + step];
    if (target) location.hash = target.id;
  }

  function onScroll() {
    const sc = scroller(), max = sc.scrollHeight - sc.clientHeight;
    if (bar) bar.style.width = (max > 0 ? (sc.scrollTop / max) * 100 : 0) + "%";
  }

  R.router = {
    init() {
      main = R.$(".main");
      bar = R.$(".progress");
      sections = R.$$("section.section");
      links = R.$$(".nav-items a");

      const menu = R.$(".menu-btn");
      if (menu) menu.addEventListener("click", () => document.body.classList.toggle("nav-open"));
      R.$$("[data-goto]").forEach(b => b.addEventListener("click", () => go(b.dataset.goto === "next" ? 1 : -1)));

      document.addEventListener("keydown", e => {
        if (e.target.closest("input,textarea,select") || R.$(".lightbox.open")) return;
        if (e.key === "Escape") document.body.classList.remove("nav-open");
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      });
      main.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("hashchange", () => show(decodeURIComponent(location.hash.slice(1))));

      // Printing exports the whole report, then returns to the open section.
      R.on("print:before", () => {
        sections.forEach(s => (s.hidden = false));
        R.$$(".pager").forEach(p => (p.hidden = true));
        R.emit("layout:changed");
      });
      R.on("print:after", () => current && show(current.id));
      R.on("lang:changed", () => current && updateTopbar(current));

      show(decodeURIComponent(location.hash.slice(1)));
    },
    show,
    go,
  };
})();
