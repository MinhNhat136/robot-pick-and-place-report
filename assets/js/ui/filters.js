/* Chip filters for tables:
   <div class="chips" data-filter="#tableId" data-key="task"><button class="chip" data-value="all|…"></div>
   Rows are matched on their data-<key> attribute. */
(function () {
  "use strict";
  const R = window.Report;

  R.filters = {
    init() {
      R.$$(".chips[data-filter]").forEach(group => {
        const table = R.$(group.dataset.filter);
        const chips = R.$$(".chip", group);
        chips.forEach(chip => chip.addEventListener("click", () => {
          chips.forEach(c => c.setAttribute("aria-pressed", c === chip));
          const v = chip.dataset.value;
          R.$$("tbody tr", table).forEach(tr => { tr.hidden = v !== "all" && tr.dataset[group.dataset.key] !== v; });
        }));
      });
    },
  };
})();
