/* Editor / customer view.
   Customer view hides every .todo and .internal element.
   Turned on by the switch in the effects panel (#mode-toggle) or by ?mode=customer in the URL. */
(function () {
  "use strict";
  const R = window.Report;
  const KEY = "report-mode";

  R.mode = {
    init() {
      const box = R.$("#mode-toggle");
      const fromUrl = new URLSearchParams(location.search).get("mode");
      let customer = fromUrl ? fromUrl === "customer" : R.store.get(KEY) === "customer";

      const apply = () => {
        document.body.classList.toggle("customer", customer);
        if (box) box.checked = customer;
        const count = R.$("#todo-count");
        if (count) count.textContent = R.$$(".todo").length;
        R.emit("layout:changed");   // internal cards appear/disappear: footer and scroll end are recomputed
      };
      if (box) box.addEventListener("change", () => {
        customer = box.checked;
        R.store.set(KEY, customer ? "customer" : "editor");
        apply();
      });
      apply();
    },
  };
})();
