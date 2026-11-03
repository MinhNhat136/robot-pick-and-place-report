/* Right rail "Trong mục này".
   - Lists the hero + every .card of the open section (only the shown language's, see ui/lang.js).
   - Click a card → smooth scroll to it. Cards only: their <h4> sub-headings are not listed.
   - The head shows a progress ring (% of the section read).
   - Rebuilt on every "section:shown". Buttons (not #links) keep the router's hash = section id. */
(function () {
  "use strict";
  const R = window.Report;
  const RING = 2 * Math.PI * 21; // circumference of the progress ring (r = 21)

  let rail, main, items = [], ticking = false;
  let ui = {};

  const scroller = () => (getComputedStyle(main).overflowY === "auto" ? main : document.scrollingElement);
  // topbar now sits outside the scrolling area; only count it if it overlaps the scroller (phones)
  const threshold = () => { const t = R.$(".topbar"); return (t && getComputedStyle(t).position === "sticky" ? t.offsetHeight : 0) + 64; };
  // rail chrome for sections shown in another language (ui/lang.js)
  const UI = {
    vi: { head: "TRONG MỤC NÀY", intro: "Mở đầu", introTag: "GIỚI THIỆU", card: "CARD" },
    en: { head: "IN THIS SECTION", intro: "Introduction", introTag: "OVERVIEW", card: "CARD" },
    ja: { head: "このセクション", intro: "はじめに", introTag: "概要", card: "CARD" },
  };
  const ui_ = sec => UI[R.lang ? R.lang.of(sec) : "vi"] || UI.vi;
  // translated sections hold every language's cards; only the shown ones are listed
  const shown = el => getComputedStyle(el).display !== "none";
  let currentSec = null;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function collect(section) {
    const list = [], t = ui_(section);
    const hero = R.$$(":scope > .hero", section).find(shown);
    if (hero) list.push({ el: hero, label: t.intro, tag: t.introTag, subs: [] });
    R.$$(":scope > .card", section).filter(shown).forEach((card, i) => {
      const h = R.$(".card-head h3", card);
      const num = R.$(".card-head .num", card);
      const n = (num ? num.textContent.trim() : String(i + 1)).padStart(2, "0");
      list.push({ el: card, label: h ? h.textContent.trim() : `Card ${n}`, tag: `${t.card} ${n}`, subs: [] });
    });
    return list;
  }

  function render(section) {
    currentSec = section;
    items = collect(section);

    rail.dataset.hue = section.dataset.hue || "blue";
    rail.innerHTML = `
      <div class="toc-head">
        <div class="toc-ring" aria-hidden="true"><svg viewBox="0 0 52 52"><circle class="bg" cx="26" cy="26" r="21"/>
          <circle class="fg" cx="26" cy="26" r="21" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/></svg><b>0%</b></div>
        <div><div class="toc-k">${ui_(section).head}</div><div class="toc-t">${esc(R.lang ? R.lang.attr(section, "title") : section.dataset.title || "")}</div></div>
      </div>
      <ol class="toc-list">
        <span class="toc-track" aria-hidden="true"></span><span class="toc-fill" aria-hidden="true"></span>
        ${items.map((it, i) => `
        <li data-i="${i}">
          <button type="button" class="toc-item" data-i="${i}"><span class="toc-dot"></span>
            <span class="toc-txt"><span class="toc-l">${esc(it.label)}</span>
            <span class="toc-sub">${it.tag}${it.subs.length ? `<i></i>${it.subs.length} ý` : ""}</span></span>
          </button>
          ${it.subs.length ? `<ol class="toc-subs">${it.subs.map((s, j) =>
            `<li><button type="button" data-i="${i}" data-j="${j}">${esc(s.label)}</button></li>`).join("")}</ol>` : ""}
        </li>`).join("")}
      </ol>`;

    ui = {
      li: R.$$(".toc-list > li", rail),
      btn: R.$$(".toc-item", rail),
      sub: R.$$(".toc-subs button", rail),
      fill: R.$(".toc-fill", rail),
      ring: R.$(".toc-ring .fg", rail),
      pct: R.$(".toc-ring b", rail),
      list: R.$(".toc-list", rail),
    };
    ui.btn.forEach(b => b.addEventListener("click", () => items[+b.dataset.i].el.scrollIntoView({ behavior: "smooth", block: "start" })));
    ui.sub.forEach(b => b.addEventListener("click", () => items[+b.dataset.i].subs[+b.dataset.j].el.scrollIntoView({ behavior: "smooth", block: "start" })));
    rail.hidden = items.length < 2;
    spy();
  }

  function spy() {
    ticking = false;
    if (!items.length || rail.hidden) return;
    const sc = scroller();
    const base = sc === main ? main.getBoundingClientRect().top : 0;
    const line = threshold();
    const max = sc.scrollHeight - sc.clientHeight;

    let active = 0;
    items.forEach((it, i) => { if (it.el.getBoundingClientRect().top - base <= line) active = i; });
    if (max > 0 && sc.scrollTop >= max - 4) active = items.length - 1;

    ui.btn.forEach((b, i) => {
      b.classList.toggle("active", i === active);
      b.classList.toggle("passed", i < active);
      if (i === active) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
    ui.li.forEach((li, i) => li.classList.toggle("open", i === active));

    // sub-heading inside the active card
    const subs = items[active].subs;
    let subActive = -1;
    subs.forEach((s, j) => { if (s.el.getBoundingClientRect().top - base <= line + 40) subActive = j; });
    ui.sub.forEach(b => b.classList.toggle("active", +b.dataset.i === active && +b.dataset.j === subActive));

    // track fill up to the active dot
    const dot = R.$(".toc-dot", ui.btn[active]);
    if (dot && ui.fill) {
      const y = dot.getBoundingClientRect().top + dot.offsetHeight / 2 - ui.list.getBoundingClientRect().top + ui.list.scrollTop;
      ui.fill.style.height = Math.max(0, y - ui.fill.offsetTop) + "px";
    }

    // progress ring
    const p = max > 0 ? Math.min(1, sc.scrollTop / max) : 1;
    if (ui.ring) ui.ring.style.strokeDashoffset = RING * (1 - p);
    if (ui.pct) ui.pct.textContent = Math.round(p * 100) + "%";

    // keep the active entry visible inside the rail
    const a = ui.btn[active];
    if (a && ui.list.scrollHeight > ui.list.clientHeight) {
      const r = a.getBoundingClientRect(), lr = ui.list.getBoundingClientRect();
      if (r.top < lr.top + 10 || r.bottom > lr.bottom - 10) a.scrollIntoView({ block: "nearest" });
    }
  }

  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(spy); }
    if (pending) { clearTimeout(idle); idle = setTimeout(alignEnd, 160); }
  };

  // Scroll end: the page can only scroll until the bottom of the section's last card lines up with
  // the bottom of this rail. The space under the content is sized to exactly that.
  // Height the rail will have once the section's last card is the active one (that card's
  // sub-headings open, all others closed), so the scroll end does not move while the rail animates.
  function railEndHeight() {
    let h = rail.offsetHeight;
    R.$$(".toc-list > li.open > .toc-subs", rail).forEach(ul => {
      const cs = getComputedStyle(ul);
      h -= ul.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    });
    const items = R.$$(".toc-list > li", rail);
    const lastSubs = items.length && R.$(".toc-subs", items[items.length - 1]);
    if (lastSubs) h += lastSubs.scrollHeight + 8;   // 8 = margins of an open list (2 + 6)
    // a long list is capped by the rail's max-height (it then scrolls inside instead of growing)
    const max = parseFloat(getComputedStyle(rail).maxHeight);
    return isFinite(max) ? Math.min(h, max) : h;
  }

  // Scroll end: the page can only scroll until the bottom of the section's last card lines up with
  // the bottom of this rail. The space under the content is sized to exactly that.
  let lastPad = -1, pending = false, idle;
  function alignEnd() {
    // never resize the page while it is scrolling (a smooth scroll to a card would jump): wait for idle
    if (main.classList.contains("is-scrolling")) {
      pending = true; clearTimeout(idle); idle = setTimeout(alignEnd, 160); return;
    }
    pending = false;
    const wrap = R.$(".page > .wrap");
    const sec = R.$("section.section:not([hidden])");
    if (!wrap || !sec) return;
    // last card actually shown (internal cards are hidden in customer mode)
    const cards = R.$$(":scope > .card", sec).filter(c => c.offsetParent !== null);
    const last = cards[cards.length - 1] || sec;
    // the section footer (project · version · date) lives inside that card
    const foot = R.$(".footer", sec);
    if (foot && last !== sec && foot.parentElement !== last) last.appendChild(foot);
    const sc = scroller();
    const viewH = sc === main ? main.clientHeight : innerHeight;
    // rail hidden (narrow screens): keep a small bottom margin
    const railBottom = rail && !rail.hidden && rail.offsetParent
      ? (parseFloat(getComputedStyle(rail).top) || 0) + railEndHeight()
      : viewH - 24;
    // measured without touching the current padding (zeroing it would clamp the scroll position)
    const pad = parseFloat(wrap.style.paddingBottom) || 0;
    const tail = wrap.getBoundingClientRect().bottom - pad - last.getBoundingClientRect().bottom;
    const next = Math.round(Math.max(0, viewH - railBottom - tail));
    if (next !== lastPad) { wrap.style.paddingBottom = next + "px"; lastPad = next; }
  }

  R.toc = {
    init() {
      rail = R.$(".toc");
      main = R.$(".main");
      if (!rail) return;
      R.on("section:shown", sec => { render(sec); requestAnimationFrame(alignEnd); });
      R.on("lang:changed", () => { if (currentSec) { render(currentSec); requestAnimationFrame(alignEnd); } });
      main.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", () => { onScroll(); alignEnd(); });
      R.on("layout:changed", () => { onScroll(); requestAnimationFrame(alignEnd); });
      // cards change height when tabs / accordions / videos load,
      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(() => requestAnimationFrame(alignEnd));
        R.$$("section.section").forEach(sec => ro.observe(sec));
      }
      document.addEventListener("toggle", () => requestAnimationFrame(alignEnd), true);
    },
  };
})();
