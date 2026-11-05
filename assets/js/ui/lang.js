/* Language switch: a pill button at the bottom-right (left of the effects button) with a menu
   Tiếng Việt / 日本語 / English. The choice is remembered in this browser, set on <html lang> / data-lang
   and announced as "lang:changed". Sections with a translation (data-i18n-langs, built from
   src/sections/i18n/) switch through lang.css; the others stay in Vietnamese. The sidebar is
   always translated (data-tr-*, from src/nav.json and layout.html). */
(function () {
  "use strict";
  const R = window.Report;
  const KEY = "report-lang";
  const LANGS = [
    { code: "vi", short: "VI", name: "Tiếng Việt", ready: true },
    { code: "ja", short: "JA", name: "日本語", ready: true },    // ready: every section translated
    { code: "en", short: "EN", name: "English", ready: true },
  ];

  let btn, menu, current = "vi";

  /* Fixed UI text (sidebar): elements with data-tr-ja / data-tr-en get that text, or the attribute named
     by data-tr-attr. The Vietnamese original is kept in data-tr-vi the first time. */
  function translateUi(code) {
    R.$$("[data-tr-en], [data-tr-ja]").forEach(el => {
      const attr = el.dataset.trAttr;
      if (el.dataset.trVi === undefined) el.dataset.trVi = attr ? el.getAttribute(attr) || "" : el.textContent;
      const text = el.dataset["tr" + code[0].toUpperCase() + code.slice(1)] || el.dataset.trVi;
      if (attr) el.setAttribute(attr, text); else el.textContent = text;
    });
  }

  function apply(code, write = true) {
    const lang = LANGS.find(l => l.code === code) || LANGS[0];
    current = lang.code;
    document.documentElement.lang = lang.code;
    document.documentElement.dataset.lang = lang.code;
    translateUi(lang.code);
    R.$(".lang-code", btn).textContent = lang.short;
    R.$$("[data-lang]", menu).forEach(b => b.setAttribute("aria-checked", String(b.dataset.lang === lang.code)));
    if (write) R.store.set(KEY, lang.code);
    R.emit("lang:changed", lang.code);
    R.emit("layout:changed");   // other cards are shown: charts redraw, scroll end is recomputed
  }

  function toggle(open) {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  }

  R.lang = {
    init() {
      btn = document.createElement("button");
      btn.type = "button"; btn.className = "lang-btn no-print";
      btn.setAttribute("aria-label", "Chọn ngôn ngữ"); btn.dataset.trAttr = "aria-label"; btn.dataset.trEn = "Choose language"; btn.dataset.trJa = "言語を選択"; btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
      btn.innerHTML = `<span class="lang-code">VI</span>`;

      menu = document.createElement("div");
      menu.className = "lang-menu no-print"; menu.hidden = true; menu.setAttribute("role", "menu");
      menu.innerHTML = `<div class="lang-h" data-tr-en="LANGUAGE" data-tr-ja="言語">NGÔN NGỮ</div>` + LANGS.map(l =>
        `<button type="button" role="menuitemradio" data-lang="${l.code}"><span class="lang-s">${l.short}</span>` +
        `<span class="lang-n">${l.name}</span>${l.ready ? "" : '<span class="lang-tag">Phần I–III</span>'}</button>`).join("");
      document.body.append(menu, btn);

      btn.addEventListener("click", e => { e.stopPropagation(); toggle(menu.hidden); });
      R.$$("[data-lang]", menu).forEach(b => b.addEventListener("click", () => { apply(b.dataset.lang); toggle(false); }));
      document.addEventListener("click", e => { if (!menu.hidden && !menu.contains(e.target)) toggle(false); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && !menu.hidden) { toggle(false); btn.focus(); } });

      const fromUrl = new URLSearchParams(location.search).get("lang");
      apply(fromUrl || R.store.get(KEY) || "vi", !fromUrl);
    },
    get current() { return current; },
    /** Language a section is shown in: the chosen one if the section has it, else Vietnamese. */
    of(sec) { return sec && (sec.dataset.i18nLangs || "").split(" ").includes(current) ? current : "vi"; },
    /** A section data attribute (title, kicker) in the language the section is shown in. */
    attr(sec, key) {
      const l = R.lang.of(sec);
      return (l !== "vi" && sec.dataset[key + l[0].toUpperCase() + l.slice(1)]) || sec.dataset[key] || "";
    },
  };
})();
