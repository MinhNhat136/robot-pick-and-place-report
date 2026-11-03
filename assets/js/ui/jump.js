/* Buttons that jump to a card and open one of its tabs:
   <button data-jump="cardId" data-tab="1">  → scrolls to #cardId and selects its 2nd tab.
   If the target is a <details>, it is opened. */
(function () {
  "use strict";
  const R = window.Report;

  R.jump = {
    init() {
      R.$$("[data-jump]").forEach(b => b.addEventListener("click", () => {
        const target = document.getElementById(b.dataset.jump);
        if (!target) return;
        if (target.tagName === "DETAILS") target.open = true; // e.g. a folder in the deliverables list
        if (b.dataset.tab !== undefined) {
          const tab = R.$$(".tab-list button", target)[+b.dataset.tab];
          if (tab) tab.click();
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    },
  };
})();
