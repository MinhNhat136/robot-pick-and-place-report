/* Round "Lưu PDF" button at the bottom-right (left of the language button). Before printing, accordions are opened and the
   print:before event lets the router and charts expand the whole report. */
(function () {
  "use strict";
  const R = window.Report;


  const TOC_HEAD = { vi: "MỤC LỤC", en: "CONTENTS", ja: "目次" };
  const hidden = el => { const top = el.closest("[data-i18n]"); return top && getComputedStyle(top).display === "none"; };
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* Just before printing: a Word-style table of contents (part / section / card), a part title and a
     numbered heading (I.02 …) at the top of each section, and numbers on card titles (I.02.1 …).
     Everything is removed again after printing. Text comes from the sidebar, so it follows the language. */
  function buildPrint() {
    cleanup();
    const wrap = R.$(".wrap"); if (!wrap) return;
    const lang = document.documentElement.lang || "vi";
    let toc = "";
    R.$$(".nav .nav-group").forEach(g => {
      const kicker = R.$(".nav-group-head .k", g)?.textContent.trim() || "";
      const title = R.$(".nav-group-head .t", g)?.textContent.trim() || "";
      const roman = (kicker.match(/[IVX]+\s*$/) || [""])[0].trim();
      toc += `<div class="t1">${esc(kicker)}. ${esc(title)}</div>`;
      R.$$(".nav-items a", g).forEach((a, k) => {
        const id = a.getAttribute("href").slice(1), sec = document.getElementById(id);
        const code = `${roman}.${R.$(".n", a)?.textContent.trim() || ""}`;
        const label = R.$("span:last-child", a).textContent.trim();
        toc += `<a class="t2" href="#${id}">${code}  ${esc(label)}</a>`;
        if (!sec) return;
        const h = document.createElement("div");
        h.className = "print-h"; h.textContent = `${code}  ${label}`;
        sec.prepend(h);
        if (k === 0) {
          const p = document.createElement("div");
          p.className = "print-part"; p.textContent = `${kicker}. ${title}`;
          sec.prepend(p);
        }
        R.$$(".card-head h3", sec).filter(x => !hidden(x)).forEach((x, i) => {
          x.dataset.pn = `${code}.${i + 1}`;
          toc += `<div class="t3">${code}.${i + 1}  ${esc(x.textContent.trim())}</div>`;
        });
      });
    });
    const box = document.createElement("div");
    box.className = "print-toc";
    box.innerHTML = `<h1>${TOC_HEAD[lang] || TOC_HEAD.vi}</h1>${toc}`;
    wrap.prepend(box);
  }
  function cleanup() {
    R.$$(".print-toc, .print-h, .print-part").forEach(e => e.remove());
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
