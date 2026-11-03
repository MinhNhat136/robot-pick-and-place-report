/* Report namespace, DOM helpers, safe storage and a tiny event bus.
   Every other script attaches itself to window.Report; load this one first. */
(function () {
  "use strict";
  const R = (window.Report = window.Report || {});

  R.$ = (sel, root = document) => root.querySelector(sel);
  R.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // localStorage can throw (private mode, blocked site data) — never let it break the page.
  R.store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } },
  };

  // Event bus used between modules:
  //   "section:shown" (section)  — router opened a section
  //   "layout:changed"           — visibility changed (tab switched, print expands all sections)
  //   "print:before" / "print:after"
  const listeners = {};
  R.on = (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); };
  R.emit = (name, payload) => { (listeners[name] || []).forEach(fn => fn(payload)); };
})();
