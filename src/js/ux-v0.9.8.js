/* MoneyMap v0.9.8 — touch behavior patch
   ─────────────────────────────────────────────────────────────────
   Wires MoneyMapTouch.swipe() onto:
   1. Transaction cards — swipe right = mark reviewed, left = edit
   2. Review card       — swipe right = approve, left = skip

   Also injects the swipe hint strip above the review card and
   adds swipe overlay elements to each card on render.

   Registered on MoneyMapRenderBus at priority 65 so it runs after
   all data renders but before post-render cleanup passes.
   ─────────────────────────────────────────────────────────────────
   Dependencies: MoneyMapTouch (touch.js), approveTx, skipReview,
   editTransaction, renderAll, state, escapeHtml (all global).
   ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* Idempotent */
  if (window.__mmv98TouchPatch) return;
  window.__mmv98TouchPatch = true;

  /* ── Only active on touch devices ──────────────────────────── */
  var isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  /* ── Cleanup registry: store cleanup fns per element id ─────── */
  var _cleanups = {};

  function cleanupEl(id) {
    if (_cleanups[id]) { try { _cleanups[id](); } catch(e){} delete _cleanups[id]; }
  }

  function safeEsc(v) {
    return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? '');
  }

  /* ── 1. Transaction card swipe ──────────────────────────────── */

  function initTxCardSwipe(card) {
    var id = card.dataset.txId || card.getAttribute('data-tx-id');
    if (!id) return;
    /* Remove prior listeners on this element */
    cleanupEl('tx-' + id);

    /* Inject overlay elements if not present */
    if (!card.querySelector('.tx-swipe-overlay')) {
      var rightEl = document.createElement('div');
      rightEl.className = 'tx-swipe-overlay tx-swipe-right-overlay';
      rightEl.innerHTML = '<span>✓</span> Reviewed';
      rightEl.setAttribute('aria-hidden', 'true');

      var leftEl = document.createElement('div');
      leftEl.className = 'tx-swipe-overlay tx-swipe-left-overlay';
      leftEl.innerHTML = 'Edit ›';
      leftEl.setAttribute('aria-hidden', 'true');

      card.appendChild(rightEl);
      card.appendChild(leftEl);
    }

    var cleanup = MoneyMapTouch.swipe(card, {
      threshold:  72,
      resistance: 0.45,

      onProgress: function (ratio, dir) {
        card.classList.toggle('tx-card-swiping-right', dir === 'right' && ratio > 0.1);
        card.classList.toggle('tx-card-swiping-left',  dir === 'left'  && ratio > 0.1);
      },

      onRight: function () {
        /* Mark as reviewed */
        card.classList.remove('tx-card-swiping-right', 'tx-card-swiping-left');
        try {
          var tx = (state.transactions || []).find(function(t){ return t.id === id; });
          if (tx && !tx.reviewed) {
            tx.reviewed = true;
            if (typeof saveState === 'function') saveState();
            if (typeof toast === 'function') toast('Marked as reviewed.');
            if (typeof renderAll === 'function') renderAll();
          }
        } catch(e) {}
      },

      onLeft: function () {
        /* Open edit drawer */
        card.classList.remove('tx-card-swiping-right', 'tx-card-swiping-left');
        try {
          if (typeof editTransaction === 'function') editTransaction(id);
        } catch(e) {}
      }
    });

    _cleanups['tx-' + id] = cleanup;
  }

  /* ── 2. Review card swipe ───────────────────────────────────── */

  var _reviewSwipeCleanup = null;

  function injectReviewSwipeHint() {
    var view = document.getElementById('view-review');
    if (!view || !view.classList.contains('active')) return;
    if (view.querySelector('.review-swipe-hint')) return;

    var hint = document.createElement('div');
    hint.className = 'review-swipe-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML =
      '<span>← Skip</span>' +
      '<span style="color:var(--line2);font-size:16px">|</span>' +
      '<span>Approve →</span>';

    var card = view.querySelector('.review-transaction');
    if (card && card.parentNode) {
      card.parentNode.insertBefore(hint, card);
    }
  }

  function initReviewCardSwipe() {
    var card = document.querySelector('#view-review .review-transaction');
    if (!card) return;
    if (_reviewSwipeCleanup) { try { _reviewSwipeCleanup(); } catch(e){} _reviewSwipeCleanup = null; }

    /* Inject overlays */
    if (!card.querySelector('.review-swipe-right')) {
      var rEl = document.createElement('div');
      rEl.className = 'tx-swipe-overlay review-swipe-right';
      rEl.innerHTML = '✓ Approve';
      rEl.setAttribute('aria-hidden', 'true');

      var lEl = document.createElement('div');
      lEl.className = 'tx-swipe-overlay review-swipe-left';
      lEl.innerHTML = 'Skip →';
      lEl.setAttribute('aria-hidden', 'true');

      card.appendChild(rEl);
      card.appendChild(lEl);
    }

    _reviewSwipeCleanup = MoneyMapTouch.swipe(card, {
      threshold:  80,
      resistance: 0.38,

      onProgress: function (ratio, dir) {
        card.classList.toggle('tx-card-swiping-right', dir === 'right' && ratio > 0.08);
        card.classList.toggle('tx-card-swiping-left',  dir === 'left'  && ratio > 0.08);
      },

      onRight: function () {
        card.classList.remove('tx-card-swiping-right', 'tx-card-swiping-left');
        try {
          /* Find the review tx id — look for the approve button */
          var approveBtn = document.querySelector('#view-review [onclick*="approveTx"]');
          if (approveBtn) {
            approveBtn.click();
          } else if (typeof approveTx === 'function' && typeof currentReviewTx === 'function') {
            var tx = currentReviewTx();
            if (tx) approveTx(tx.id);
          }
        } catch(e) {}
      },

      onLeft: function () {
        card.classList.remove('tx-card-swiping-right', 'tx-card-swiping-left');
        try {
          if (typeof skipReview === 'function') skipReview();
        } catch(e) {}
      }
    });
  }

  /* ── Render bus hook ────────────────────────────────────────── */

  function applyTouchPatches() {
    if (!isTouchDevice) return;
    if (typeof MoneyMapTouch === 'undefined') return;

    /* Init tx card swipe on every visible card */
    document.querySelectorAll('.v60-tx-card[data-tx-id], .tx-card[data-tx-id]').forEach(initTxCardSwipe);

    /* Review mode */
    injectReviewSwipeHint();
    initReviewCardSwipe();
  }

  /* ── Hook renderTxCardsV60 to inject data-tx-id attributes ─── */
  /* The swipe handler needs each card to carry its transaction id  */
  (function patchTxCardRenderer() {
    function tryPatch() {
      if (typeof window.renderTxCardsV60 !== 'function') return;
      if (window.renderTxCardsV60.__v98SwipePatched) return;

      var _prior = window.renderTxCardsV60;
      window.renderTxCardsV60 = function (txns) {
        _prior.apply(this, arguments);
        /* After render, add data-tx-id to each card via the onclick attr */
        var list = document.getElementById('txCardListV60');
        if (!list) return;
        list.querySelectorAll('.v60-tx-card').forEach(function (card) {
          var onclick = card.getAttribute('onclick') || '';
          var match = onclick.match(/editTransaction\(['"]([^'"]+)['"]\)/);
          if (match) card.dataset.txId = match[1];
        });
      };
      window.renderTxCardsV60.__v98SwipePatched = true;
    }

    /* Try now and after DOM is ready */
    tryPatch();
    document.addEventListener('DOMContentLoaded', tryPatch);
    setTimeout(tryPatch, 500);
  })();

  /* ── Register on render bus ────────────────────────────────── */
  if (typeof MoneyMapRenderBus !== 'undefined') {
    MoneyMapRenderBus.register('touch-v098', applyTouchPatches, 65);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof MoneyMapRenderBus !== 'undefined') {
        MoneyMapRenderBus.register('touch-v098', applyTouchPatches, 65);
      } else if (typeof window.renderAll === 'function' && !window.renderAll.__v98TouchHooked) {
        var _p = window.renderAll;
        window.renderAll = function () {
          var r = _p.apply(this, arguments);
          requestAnimationFrame(applyTouchPatches);
          return r;
        };
        window.renderAll.__v98TouchHooked = true;
      }
    });
  }

  /* Run once on init */
  if (document.readyState !== 'loading') {
    requestAnimationFrame(applyTouchPatches);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(applyTouchPatches);
    });
  }

})();
