/* Closed-loop explorer: every [data-step] button inside .cl selects the matching
   .cl-detail[data-for]; "Chạy thử" walks the per-tick ring step by step, showing that
   model steps (.model) are skipped while the current 40-step chunk still has actions. */
(function () {
  "use strict";
  const R = window.Report;

  function setup(box) {
    const buttons = R.$$("[data-step]", box);
    const details = R.$$(".cl-detail", box);
    const ring = R.$$(".cl-node", box);
    const order = buttons.map(b => b.dataset.step);
    const play = R.$(".cl-play", box);
    let timer = null;

    const select = id => {
      buttons.forEach(b => b.classList.toggle("on", b.dataset.step === id));
      details.forEach(d => (d.hidden = d.dataset.for !== id));
    };
    const stop = () => { clearInterval(timer); timer = null; if (play) play.textContent = "▶ Chạy thử một vòng"; };

    buttons.forEach(b => b.addEventListener("click", () => { stop(); select(b.dataset.step); }));
    R.$$("[data-move]", box).forEach(b => b.addEventListener("click", () => {
      stop();
      const cur = order.indexOf((buttons.find(x => x.classList.contains("on")) || buttons[0]).dataset.step);
      const next = (cur + (b.dataset.move === "next" ? 1 : -1) + order.length) % order.length;
      select(order[next]);
    }));

    if (play) play.addEventListener("click", () => {
      if (timer) return stop();
      play.textContent = "■ Dừng";
      let i = 0;
      // first pass: tick 0 needs a new chunk, so every ring step runs;
      // second pass: tick 1 still has actions left, so model steps are skipped.
      const seq = [...ring.map(n => n.dataset.step), ...ring.filter(n => !n.classList.contains("model")).map(n => n.dataset.step)];
      select(seq[0]);
      timer = setInterval(() => {
        i += 1;
        if (i >= seq.length) return stop();
        select(seq[i]);
      }, 1100);
    });

    R.on("section:shown", stop);
    select(order[0]);
  }

  R.loop = { init() { R.$$(".cl").forEach(setup); } };
})();
