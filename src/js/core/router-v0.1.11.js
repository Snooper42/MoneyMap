/* MoneyMap v0.1.11 — hash-based router.
   Wraps showView() so every navigation pushes a history entry.
   Browser back/forward and deep-links (e.g. #accounts) all work. */
(function () {
  'use strict';

  var VALID = [
    'overview','import','review','transactions','budgets','recurring',
    'networth','debt','investments','credit','goals','rules','settings','accounts'
  ];

  function parseHash() {
    var h = window.location.hash.replace(/^#\/?/, '').split(/[?#]/)[0].trim();
    return VALID.indexOf(h) !== -1 ? h : null;
  }

  function install() {
    /* Idempotent — only wrap once. */
    if (window.showView && window.showView.__mmRouter) return;

    var base = window.showView;
    if (typeof base !== 'function') {
      /* showView not yet defined — retry after next tick. */
      setTimeout(install, 80);
      return;
    }

    /* ── wrap showView ──────────────────────────────────────────────────── */
    window.showView = function (id) {
      var out = base.apply(this, arguments);
      if (id && VALID.indexOf(id) !== -1) {
        var target = '#' + id;
        if (window.location.hash !== target) {
          /* pushState updates the URL without firing hashchange or popstate. */
          history.pushState({ mmView: id }, '', target);
        }
      }
      return out;
    };
    window.showView.__mmRouter = true;

    /* ── seed initial history entry ─────────────────────────────────────── */
    /* replaceState so the very first back-click lands on the right view. */
    var seedView = parseHash() || 'overview';
    history.replaceState({ mmView: seedView }, '', '#' + seedView);

    /* ── back / forward ─────────────────────────────────────────────────── */
    window.addEventListener('popstate', function (e) {
      var id = (e.state && VALID.indexOf(e.state.mmView) !== -1)
        ? e.state.mmView
        : (parseHash() || 'overview');
      base(id);
    });

    /* ── deep-link: page loaded with a hash ─────────────────────────────── */
    var deep = parseHash();
    if (deep && deep !== 'overview') {
      /* Small delay so the app finishes its own initialisation first. */
      setTimeout(function () { base(deep); }, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); });
  } else {
    setTimeout(install, 0);
  }
  /* Safety retry after heavier scripts have had time to settle. */
  setTimeout(install, 600);
})();
