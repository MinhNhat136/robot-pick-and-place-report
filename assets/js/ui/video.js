/* Chapter list for a video, and speed buttons for the scenario success clips.
   Chapter list: buttons with data-seek="<seconds>" inside .vchap jump the
   video to that time and play it; the chapter being played is highlighted. */
(function () {
  "use strict";
  const R = window.Report;

  // Speed buttons for short success clips: <button data-rate="0.5"> inside .case-video
  function setupRates() {
    R.$$(".case-video").forEach(box => {
      const video = R.$("video", box);
      const btns = R.$$("[data-rate]", box);
      btns.forEach(b => b.addEventListener("click", () => {
        video.playbackRate = parseFloat(b.dataset.rate);
        btns.forEach(x => x.setAttribute("aria-pressed", x === b));
        const p = video.play(); if (p && p.catch) p.catch(() => {});
      }));
      R.on("section:shown", sec => {
        if (sec.contains(video)) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
        else video.pause();
      });
    });
  }

  R.video = {
    init() {
      setupRates();
      R.$$(".vchap").forEach(box => {
        const video = R.$("video", box);
        const buttons = R.$$("[data-seek]", box);
        const bar = R.$(".vchap-progress span", box);
        if (!video) return;
        const starts = buttons.map(b => parseFloat(b.dataset.seek));

        buttons.forEach(b => b.addEventListener("click", () => {
          buttons.forEach(x => x.classList.toggle("active", x === b)); // immediate feedback, before the seek completes
          video.currentTime = parseFloat(b.dataset.seek);
          const p = video.play();
          if (p && p.catch) p.catch(() => { /* autoplay blocked: user can press play */ });
        }));

        const sync = () => {
          const t = video.currentTime;
          let i = -1;
          starts.forEach((s, j) => { if (t >= s) i = j; });
          buttons.forEach((b, j) => b.classList.toggle("active", j === i));
          if (bar && video.duration) bar.style.width = (t / video.duration) * 100 + "%";
        };
        ["timeupdate", "seeked", "loadedmetadata"].forEach(ev => video.addEventListener(ev, sync));

        // stop playback when the reader leaves the section
        R.on("section:shown", () => video.pause());
      });
      // "Trong video" chips on later cards: <button data-vseek="12"> plays the chapter that starts
      // at 12 s in the chapter video of the same section, then scrolls back up to it
      R.$$("[data-vseek]").forEach(b => b.addEventListener("click", () => {
        // translated sections hold one copy per language (data-i18n): use the video of the same language
        const sec = b.closest("section"), lang = b.closest("[data-i18n]")?.dataset.i18n;
        const box = sec && (lang ? R.$(`[data-i18n="${lang}"] .vchap, .vchap[data-i18n="${lang}"]`, sec) : R.$(".vchap", sec));
        if (!box) return;
        const chap = R.$(`[data-seek="${b.dataset.vseek}"]`, box);
        if (chap) chap.click();
        box.scrollIntoView({ behavior: "smooth", block: "center" });
      }));
    },
  };
})();
