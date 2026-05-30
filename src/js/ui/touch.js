/* MoneyMap touch engine — v0.9.8
   ─────────────────────────────────────────────────────────────────
   Provides two systems:

   1. MoneyMapTouch.swipe(el, opts) — horizontal swipe gestures
      on any element. Used by transaction cards (approve/edit) and
      the review card (approve/skip). Returns a cleanup function.

   2. MoneyMapTouch.initKeyboardAware() — tracks iOS/Android virtual
      keyboard height via visualViewport and writes --keyboard-h to
      :root. CSS uses this to keep sticky form footers visible.

   3. MoneyMapTouch.initDrawerSwipe() — swipe-down to close the
      drawer on mobile.

   API
   ───
   MoneyMapTouch.swipe(element, {
     onRight(el):  called when user swipes right past threshold
     onLeft(el):   called when user swipes left past threshold
     threshold:    px required to trigger (default 72)
     resistance:   how much the card fights back 0–1 (default 0.42)
     onProgress(ratio, direction): called during drag (optional)
   })
   → returns cleanup() fn

   MoneyMapTouch.initKeyboardAware()
   → no return; idempotent

   MoneyMapTouch.initDrawerSwipe()
   → no return; idempotent
   ─────────────────────────────────────────────────────────────────
   Load order: after shared-helpers.js, before ux patch layers.
   ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.MoneyMapTouch) return;

  /* ── Constants ─────────────────────────────────────────────── */
  var SWIPE_THRESHOLD   = 72;   /* px to trigger action          */
  var RESISTANCE        = 0.42; /* card drag damping             */
  var SNAP_DURATION_MS  = 180;  /* return-to-origin animation    */
  var FLY_DURATION_MS   = 220;  /* fly-off animation             */

  /* ── Swipe gesture ─────────────────────────────────────────── */

  function swipe(el, opts) {
    opts = opts || {};
    var threshold  = opts.threshold  || SWIPE_THRESHOLD;
    var resistance = opts.resistance || RESISTANCE;
    var onRight    = opts.onRight    || null;
    var onLeft     = opts.onLeft     || null;
    var onProgress = opts.onProgress || null;

    var startX = 0, startY = 0, curX = 0;
    var tracking = false, locked = false, direction = null;

    function getTouch(e) { return e.changedTouches ? e.changedTouches[0] : e; }

    function onTouchStart(e) {
      var t = getTouch(e);
      startX = t.clientX;
      startY = t.clientY;
      curX   = 0;
      tracking = true;
      locked   = false;
      direction = null;
      el.style.transition = 'none';
    }

    function onTouchMove(e) {
      if (!tracking) return;
      var t  = getTouch(e);
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;

      /* First significant movement: decide axis */
      if (!locked && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        if (Math.abs(dx) > Math.abs(dy)) {
          locked    = true;
          direction = dx > 0 ? 'right' : 'left';
        } else {
          /* Vertical scroll wins — bail out */
          tracking = false;
          return;
        }
      }

      if (!locked) return;

      /* Block scroll only if we own the gesture */
      e.preventDefault();

      curX = dx * resistance;

      /* Clamp: only allow swipe in the direction that has a handler */
      if (curX > 0 && !onRight) curX = curX * 0.15;
      if (curX < 0 && !onLeft)  curX = curX * 0.15;

      el.style.transform = 'translateX(' + curX + 'px)';

      var ratio = Math.min(1, Math.abs(curX) / threshold);
      if (onProgress) onProgress(ratio, direction);
    }

    function onTouchEnd() {
      if (!tracking || !locked) { tracking = false; return; }
      tracking = false;
      var dist = Math.abs(curX);

      if (dist >= threshold) {
        /* Fly off */
        el.style.transition = 'transform ' + FLY_DURATION_MS + 'ms cubic-bezier(.25,.46,.45,.94), opacity ' + FLY_DURATION_MS + 'ms';
        el.style.transform  = 'translateX(' + (curX > 0 ? '120%' : '-120%') + ')';
        el.style.opacity    = '0';
        var dir = curX > 0 ? 'right' : 'left';
        setTimeout(function () {
          el.style.transition = '';
          el.style.transform  = '';
          el.style.opacity    = '';
          if (onProgress) onProgress(0, null);
          if (dir === 'right' && onRight) onRight(el);
          if (dir === 'left'  && onLeft)  onLeft(el);
        }, FLY_DURATION_MS + 10);
      } else {
        /* Snap back */
        el.style.transition = 'transform ' + SNAP_DURATION_MS + 'ms cubic-bezier(.34,1.36,.64,1)';
        el.style.transform  = 'translateX(0)';
        if (onProgress) onProgress(0, null);
        setTimeout(function () { el.style.transition = ''; }, SNAP_DURATION_MS);
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    el.addEventListener('touchcancel',onTouchEnd,   { passive: true });

    return function cleanup() {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
      el.removeEventListener('touchcancel',onTouchEnd);
    };
  }

  /* ── Keyboard-aware forms ──────────────────────────────────── */
  /* Uses visualViewport to detect the virtual keyboard and write
     a --keyboard-h CSS custom property that sticky drawer footers
     and form actions use to stay visible.                         */

  var _keyboardAwareInited = false;

  function initKeyboardAware() {
    if (_keyboardAwareInited) return;
    _keyboardAwareInited = true;

    if (!window.visualViewport) {
      /* Older browsers: set to 0 and give up gracefully */
      document.documentElement.style.setProperty('--keyboard-h', '0px');
      return;
    }

    function update() {
      var kbH = Math.max(0, window.innerHeight - window.visualViewport.height);
      /* On iOS, there's also an offset from the page scroll position */
      document.documentElement.style.setProperty('--keyboard-h', kbH + 'px');
      /* Let other code know */
      document.body.classList.toggle('mm-keyboard-open', kbH > 80);
    }

    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    update();
  }

  /* ── Drawer swipe-down to close ────────────────────────────── */
  var _drawerSwipeInited = false;

  function initDrawerSwipe() {
    if (_drawerSwipeInited) return;
    _drawerSwipeInited = true;

    document.addEventListener('DOMContentLoaded', function () {
      var panel = document.querySelector('.drawer-panel');
      if (!panel) return;

      var startY = 0, startScrollTop = 0, tracking = false, dy = 0;

      panel.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        startY         = t.clientY;
        startScrollTop = panel.scrollTop;
        tracking       = true;
        dy             = 0;
      }, { passive: true });

      panel.addEventListener('touchmove', function (e) {
        if (!tracking) return;
        var t = e.touches[0];
        dy = t.clientY - startY;
        /* Only intercept downward drag when already at scroll top */
        if (dy > 0 && panel.scrollTop <= 0) {
          e.preventDefault();
          var resist = dy * 0.35;
          panel.style.transform = 'translateY(' + resist + 'px)';
          panel.style.opacity   = String(Math.max(0.6, 1 - resist / 400));
        }
      }, { passive: false });

      panel.addEventListener('touchend', function () {
        if (!tracking) return;
        tracking = false;
        if (dy > 120 && panel.scrollTop <= 0) {
          /* Close drawer */
          if (typeof closeDrawer === 'function') closeDrawer();
        }
        panel.style.transition = 'transform 200ms cubic-bezier(.34,1.2,.64,1), opacity 200ms';
        panel.style.transform  = '';
        panel.style.opacity    = '';
        setTimeout(function () { panel.style.transition = ''; }, 200);
        dy = 0;
      }, { passive: true });
    });
  }

  /* ── Expose API ────────────────────────────────────────────── */
  window.MoneyMapTouch = {
    swipe:             swipe,
    initKeyboardAware: initKeyboardAware,
    initDrawerSwipe:   initDrawerSwipe,
    _version:          'v0.9.8'
  };

  /* Auto-init on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initKeyboardAware();
      initDrawerSwipe();
    });
  } else {
    initKeyboardAware();
    initDrawerSwipe();
  }

})();
