/* Round "Lưu PDF" button at the bottom-right (left of the language button). Before printing, accordions are opened and the
   print:before event lets the router and charts expand the whole report. */
(function () {
  "use strict";
  const R = window.Report;


  const TOC_HEAD = { vi: "MỤC LỤC", en: "CONTENTS", ja: "目次" };
  const hidden = el => { const top = el.closest("[data-i18n]"); return top && getComputedStyle(top).display === "none"; };
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* Just before printing: a table of contents (part / section / card) with page numbers, a part title
     and a numbered heading (I.02 …) at the top of each section, and numbers on card titles (I.02.1 …).
     Everything is removed again after printing. Text comes from the sidebar, so it follows the language.
     Page numbers come from window.ReportPrintPages, measured by build.py in headless Chrome for each
     language; they are left out when the report has changed since (hash mismatch). With
     ?paginate=1 (used by build.py) every heading gets an invisible @@key@@ marker to find its page. */
  const PAGINATE = new URLSearchParams(location.search).has("paginate");
  const NO_MARGIN_BOXES = window.CSS && CSS.supports("-moz-appearance", "none");
  function pageSet(lang) {
    const P = window.ReportPrintPages;
    return P && P.hash === window.ReportBuildHash && P.sets ? P.sets[lang] || null : null;
  }
  /* Cover page: title from the I.01 hero (shown language), the three scenario photos with their sidebar
     names, and the report metadata from config/report.config.js. */
  const COVER = {
    vi: { a: "BÁO CÁO", b: "DỰ ÁN", client: "Khách hàng", author: "Thực hiện", period: "Thời gian", version: "Phiên bản", date: "Phát hành" },
    en: { a: "PROJECT", b: "REPORT", client: "Client", author: "Prepared by", period: "Period", version: "Version", date: "Issued" },
    ja: { a: "プロジェクト", b: "報告書", client: "お客様", author: "作成", period: "期間", version: "バージョン", date: "発行日" },
  };
  const HERO = "images/cover-g1.jpg";
  const BLUE = "M111.6 61L215 61L215 78L150.4 78A84 84 0 0 1 106.8 232L131.3 205.9A64 64 0 0 0 90.4 85.5Z";
  const TEAL = "M102.3 64A84 84 0 0 0 77.8 227.8L10 300L37.4 300L122.7 209.2A64 64 0 0 1 81.5 88.1Z";
  const ICONS = {   // white glyphs on the round badges, 24 x 24 box
    client: `<circle cx="12" cy="8.5" r="3.6"/><path d="M5 19.5c.8-3.9 3.6-5.8 7-5.8s6.2 1.9 7 5.8z"/>`,
    period: `<rect x="4.5" y="6" width="15" height="13" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="M4.5 10h15M8.5 4v4M15.5 4v4" stroke="#fff" stroke-width="2"/>`,
    date: `<path d="M7 4h7l4 4v12H7z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M10 12h5M10 15.5h5" stroke="#fff" stroke-width="2"/>`,
  };
  /* The cover element (with its photo) is created once at start-up and stays hidden on screen:
     images inserted at print time are not loaded in time (headless Chrome even waits forever). */
  let cover = null;
  function makeCover() {
    cover = document.createElement("div");
    cover.className = "print-cover"; cover.dataset.hue = "blue";
    cover.innerHTML =
      `<img class="pc-preload" src="${HERO}" alt="" loading="eager" decoding="sync">` +
      `<svg class="pc-art" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">` +
      `<defs><clipPath id="pc-clip"><circle cx="104" cy="148" r="56"/></clipPath></defs>` +
      `<path d="${TEAL}" fill="#2aa7ba"/><path d="${BLUE}" fill="#2f6f9c"/>` +
      `<image href="${HERO}" x="48" y="92" width="112" height="112" clip-path="url(#pc-clip)" preserveAspectRatio="xMidYMid slice"/></svg>` +
      `<svg class="pc-logo" viewBox="0 0 24 28" aria-hidden="true"><path d="M0 0L24 14L0 14z" fill="#2f6f9c"/><path d="M0 14L24 14L0 28z" fill="#2aa7ba"/></svg>` +
      `<div class="pc-org"></div><div class="pc-tag"></div>` +
      `<div class="pc-titles"><div class="pc-title"></div><div class="pc-sub"></div></div>` +
      `<div class="pc-icons">${["client", "period", "date"].map((k, i) =>
        `<div data-k="${k}"><svg viewBox="0 0 24 24" style="background:${i < 2 ? "#2aa7ba" : "#2f6f9c"}" fill="#fff">${ICONS[k]}</svg><span class="pc-k"></span><span class="pc-v"></span></div>`).join("")}</div>`;
    document.body.prepend(cover);
  }
  function fillCover(lang) {
    if (!cover) return;
    const L = COVER[lang] || COVER.vi, cfg = k => String(R.config ? R.config.get(k, lang) || "" : "");
    const hero = R.$$("#tong-quan > .hero").find(h => !hidden(h)) || R.$("#tong-quan > .hero");
    const h1 = hero ? R.$("h1, h2", hero) : null;
    R.$(".pc-org", cover).textContent = cfg("author");
    R.$(".pc-tag", cover).textContent = h1 ? h1.textContent.replace(/[.。]\s*$/, "").trim() : cfg("project");
    // big title = report title from the config, "NVIDIA GR00T" in the accent colour; report kind below it
    const title = cfg("title"), hi = "NVIDIA GR00T", at = title.indexOf(hi);
    const ttl = R.$(".pc-title", cover); ttl.textContent = "";
    if (at < 0) ttl.textContent = title;
    else {
      const b = document.createElement("span"); b.className = "pc-b"; b.textContent = hi;
      ttl.append(title.slice(0, at), b, title.slice(at + hi.length));
    }
    R.$(".pc-sub", cover).textContent = `${L.a}${lang === "ja" ? "" : " "}${L.b} · UNITREE G1`;
    const val = { client: cfg("client"), period: cfg("period"), date: `${cfg("version")} · ${cfg("date")}` };
    const key = { client: L.client, period: L.period, date: `${L.version} · ${L.date}` };
    R.$$(".pc-icons > div", cover).forEach(d => {
      R.$(".pc-k", d).textContent = key[d.dataset.k]; R.$(".pc-v", d).textContent = val[d.dataset.k];
    });
  }

  function buildPrint() {
    cleanup();
    const wrap = R.$(".wrap"); if (!wrap) return;
    const lang = document.documentElement.lang || "vi";
    fillCover(lang);
    if (R.config) document.title = R.config.get("title", lang) || document.title;   // PDF document title
    const pages = pageSet(lang) || {};
    const pg = k => pages[k] || "";
    const mark = (el, k) => { if (PAGINATE) el.insertAdjacentHTML("beforeend", `<span class="pg-mark">@@${k}@@</span>`); };
    const row = (cls, num, text, key, href) =>
      `<${href ? `a href="#${href}"` : "div"} class="toc-row ${cls}"><span class="toc-tn">${esc(num)}</span>` +
      `<span class="toc-tt">${esc(text)}</span><span class="toc-tl"></span><span class="toc-tp">${pg(key)}</span></${href ? "a" : "div"}>`;
    let toc = "";
    R.$$(".nav .nav-group").forEach(g => {
      const kicker = R.$(".nav-group-head .k", g)?.textContent.trim() || "";
      const title = R.$(".nav-group-head .t", g)?.textContent.trim() || "";
      const roman = (kicker.match(/\b[IVX]+\b/g) || [""]).pop();   // "PHẦN IV", "PART IV", "第 IV 部"
      const items = R.$$(".nav-items a", g);
      const firstId = items[0] ? items[0].getAttribute("href").slice(1) : "";
      toc += row("t1", kicker, title, `s-${firstId}`);
      items.forEach((a, k) => {
        const id = a.getAttribute("href").slice(1), sec = document.getElementById(id);
        const code = `${roman}.${R.$(".n", a)?.textContent.trim() || ""}`;
        const label = R.$("span:last-child", a).textContent.trim();
        toc += row("t2", code, label, `s-${id}`, id);
        if (!sec) return;
        const h = document.createElement("div");
        h.className = "print-h"; h.textContent = `${code}  ${label}`;
        mark(h, `s-${id}`);
        sec.prepend(h);
        if (k === 0) {
          const p = document.createElement("div");
          p.className = "print-part"; p.textContent = `${kicker}${/[IVX]$/.test(kicker) ? "." : ""} ${title}`;   // no dot after "第 IV 部"
          sec.prepend(p);
        }
        R.$$(".card-head h3", sec).filter(x => !hidden(x)).forEach((x, i) => {
          x.dataset.pn = `${code}.${i + 1}`;
          toc += row("t3", `${code}.${i + 1}`, x.textContent.trim(), `c-${id}-${i + 1}`);
          mark(x, `c-${id}-${i + 1}`);
        });
      });
    });
    const box = document.createElement("div");
    box.className = "print-toc";
    box.innerHTML = `<h1>${TOC_HEAD[lang] || TOC_HEAD.vi}</h1><div class="toc-sub">${esc(R.config ? R.config.get("title", lang) || "" : "")}</div>${toc}`;
    wrap.prepend(box);
  }
  function cleanup() {
    R.$$(".print-toc, .print-h, .print-part, .pg-mark").forEach(e => e.remove());
    R.$$("h3[data-pn]").forEach(h => delete h.dataset.pn);
  }

  R.print = {
    init() {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "pdf-btn no-print";
      btn.title = "Lưu thành PDF";
      btn.setAttribute("aria-label", "Lưu thành PDF");
      btn.dataset.trAttr = "title"; btn.dataset.trEn = "Save as PDF"; btn.dataset.trJa = "PDF として保存";
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/></svg>';
      document.body.appendChild(btn);
      makeCover();
      btn.addEventListener("click", () => {
        // Firefox has no @page margin boxes, so its own print cannot put page numbers in the corner:
        // open the PDF that build.py printed in Chrome for the chosen language instead.
        if (NO_MARGIN_BOXES) {
          const lang = document.documentElement.lang || "vi";
          window.open(`pdf/report-${lang}.pdf`, "_blank");
          return;
        }
        window.print();
      });
      window.addEventListener("beforeprint", () => {
        // Before any hidden section is shown: otherwise its fadeUp animation restarts at opacity 0 and
        // Firefox (which snapshots the page at this moment) prints those sections as blank pages.
        document.documentElement.classList.add("is-printing");
        R.$$("details.acc").forEach(d => (d.open = true));
        buildPrint();
        R.emit("print:before");
      });
      window.addEventListener("afterprint", () => { cleanup(); R.emit("print:after"); document.documentElement.classList.remove("is-printing"); });
    },
  };
})();
