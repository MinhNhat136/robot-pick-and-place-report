/* <div class="tabs"><div class="tab-list"><button>…</button>…</div><div class="tab-panel">…</div>…</div> */
(function () {
  "use strict";
  const R = window.Report;

  R.tabs = {
    init() {
      R.$$(".tabs").forEach(tabs => {
        const buttons = R.$$(".tab-list button", tabs);
        const panels = R.$$(".tab-panel", tabs);
        let current = 0;

        const select = i => {
          current = i;
          buttons.forEach((b, j) => b.setAttribute("aria-selected", i === j));
          panels.forEach((p, j) => (p.hidden = i !== j));
        };
        buttons.forEach((b, i) => b.addEventListener("click", () => {
          select(i);
          R.emit("layout:changed"); // charts inside a newly shown panel can now be drawn
        }));

        // Printing shows every panel so the charts inside them get drawn; restore afterwards.
        R.on("print:before", () => panels.forEach(p => (p.hidden = false)));
        R.on("print:after", () => select(current));

        select(0);
      });
    },
  };
})();
