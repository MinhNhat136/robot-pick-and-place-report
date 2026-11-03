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
  function pageSet(lang) {
    const P = window.ReportPrintPages;
    return P && P.hash === window.ReportBuildHash && P.sets ? P.sets[lang] || null : null;
  }
  /* Cover page: title from the I.01 hero (shown language), the three scenario photos with their sidebar
     names, and the report metadata from config/report.config.js. */
  const COVER = {
    vi: { kind: "BÁO CÁO DỰ ÁN", client: "KHÁCH HÀNG", author: "THỰC HIỆN", period: "THỜI GIAN", version: "PHIÊN BẢN", date: "NGÀY PHÁT HÀNH" },
    en: { kind: "PROJECT REPORT", client: "CLIENT", author: "PREPARED BY", period: "PERIOD", version: "VERSION", date: "ISSUED" },
    ja: { kind: "プロジェクト報告書", client: "お客様", author: "作成", period: "期間", version: "バージョン", date: "発行日" },
  };
  const PHOTOS = ["images/task_apple.jpg", "images/task_fruits.jpg", "images/task_hammer.jpg"];
  /* The cover element (with its photos) is created once at start-up and stays hidden on screen:
     images inserted at print time are not loaded in time (headless Chrome even waits forever). */
  let cover = null;
  function makeCover() {
    cover = document.createElement("div");
    cover.className = "print-cover"; cover.dataset.hue = "blue";
    cover.innerHTML =
      `<div class="pc-band"><div class="pc-kind"></div><div class="pc-title"></div>` +
      `<div class="pc-sub">Unitree G1 × NVIDIA Isaac GR00T N1.7</div></div>` +
      `<div class="pc-photos">${PHOTOS.map(src => `<figure><img src="${src}" alt="" loading="eager" decoding="sync"><figcaption></figcaption></figure>`).join("")}</div>` +
      `<div class="pc-meta">${["client", "author", "period", "version", "date"].map(k => `<div data-k="${k}"><span class="pc-k"></span><span class="pc-v"></span></div>`).join("")}</div>`;
    document.body.prepend(cover);
  }
  function fillCover(lang) {
    if (!cover) return;
    const L = COVER[lang] || COVER.vi, cfg = k => String(R.config ? R.config.get(k) || "" : "");
    const hero = R.$$("#tong-quan > .hero").find(h => !hidden(h)) || R.$("#tong-quan > .hero");
    const h1 = hero ? R.$("h1, h2", hero) : null;
    R.$(".pc-kind", cover).textContent = L.kind;
    R.$(".pc-title", cover).textContent = h1 ? h1.textContent.replace(/[.。]\s*$/, "").trim() : cfg("project");
    const groups = R.$$(".nav .nav-group");
    const scen = groups[2] ? R.$$(".nav-items a span:last-child", groups[2]).map(x => x.textContent.trim()) : [];
    R.$$("figcaption", cover).forEach((c, i) => (c.textContent = scen[i] || ""));
    R.$$(".pc-meta > div", cover).forEach(d => {
      R.$(".pc-k", d).textContent = L[d.dataset.k]; R.$(".pc-v", d).textContent = cfg(d.dataset.k);
    });
  }

  function buildPrint() {
    cleanup();
    const wrap = R.$(".wrap"); if (!wrap) return;
    const lang = document.documentElement.lang || "vi";
    fillCover(lang);
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
      const roman = (kicker.match(/[IVX]+\s*$/) || [""])[0].trim();
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
          p.className = "print-part"; p.textContent = `${kicker}. ${title}`;
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
    box.innerHTML = `<h1>${TOC_HEAD[lang] || TOC_HEAD.vi}</h1><div class="toc-sub">${esc(R.config ? R.config.get("title") || "" : "")}</div>${toc}`;
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
      btn.addEventListener("click", () => window.print());
      window.addEventListener("beforeprint", () => {
        R.$$("details.acc").forEach(d => (d.open = true));
        buildPrint();
        R.emit("print:before");
      });
      window.addEventListener("afterprint", () => { cleanup(); R.emit("print:after"); });
    },
  };
})();
