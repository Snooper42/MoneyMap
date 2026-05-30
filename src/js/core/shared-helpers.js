/* MoneyMap shared helpers — introduced v0.9.5
   ─────────────────────────────────────────────────────────────────────
   Problem this solves
   ───────────────────
   Every UX patch layer (ux-v0.7 through ux-v0.9.4) opens with the same
   block of local helper constants:

     const esc   = value => typeof escapeHtml === 'function' ? ... : ...
     const js    = value => typeof escapeJs === 'function'   ? ... : ...
     const money0 = value => new Intl.NumberFormat(...).format(...)
     const money2 = value => new Intl.NumberFormat(...).format(...)
     const pct   = value => `${Math.round(...)}%`
     const nval  = value => ...

   These helpers are defined ~8 times in the codebase. Each copy:
     • Diverges silently when one is updated and others aren't
     • Adds cognitive load when reading patch layers
     • Makes formatting bugs hard to track down

   This module provides ONE authoritative copy of each helper on the
   window.MM shorthand (and window.MoneyMap.helpers for the full namespace).

   ─────────────────────────────────────────────────────────────────────
   API
   ───
   MM.esc(value)
     Safe HTML escape. Delegates to escapeHtml() (utils.js).

   MM.js(value)
     Safe JavaScript string escape. Delegates to escapeJs() (transactions.js).

   MM.money0(value)
     Currency string with zero decimal places. Reads state.settings.currency.

   MM.money2(value)
     Currency string with exactly two decimal places.

   MM.pct(value)
     Percentage string, rounded to nearest integer. e.g. pct(33.7) → "34%"

   MM.nval(value)
     Safe Number conversion — returns 0 for NaN/null/undefined/Infinity.
     Delegates to nval() (utils.js).

   ─────────────────────────────────────────────────────────────────────
   Usage in new patch layers
   ─────────────────────────
   Instead of:

     const esc   = value => typeof escapeHtml === 'function' ? escapeHtml(...) : ...
     const money0 = value => new Intl.NumberFormat('en-US',{...}).format(...)

   Write:

     // MM is available globally — no import needed
     MM.esc(value)
     MM.money0(value)

   ─────────────────────────────────────────────────────────────────────
   Load order requirement
   ──────────────────────
   This file must load AFTER:
     - utils.js      (escapeHtml, nval)
     - transactions.js (escapeJs)
     - storage.js    (state is populated)
   It currently loads after core/render-bus.js and before the UX patch
   layers — see index.html load order.
   ───────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* Idempotent — loading this file a second time is a no-op. */
  if (window.MM) return;

  /* ── HTML / JS escaping ─────────────────────────────────── */

  function esc(value) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    /* Inline fallback (should not be needed — utils.js loads before this file) */
    return String(value ?? '').replace(/[&<>'"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', "'": '&#39;', '"':'&quot;' }[c];
    });
  }

  function js(value) {
    if (typeof escapeJs === 'function') return escapeJs(String(value ?? ''));
    /* Inline fallback */
    return String(value ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── Number helpers ─────────────────────────────────────── */

  function nval(value) {
    if (typeof window.nval === 'function') return window.nval(value);
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  /* ── Currency formatters ─────────────────────────────────── */

  function getCurrency() {
    try { return ((typeof state !== 'undefined' && state && state.settings && state.settings.currency) || 'USD'); }
    catch (e) { return 'USD'; }
  }

  function money0(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: getCurrency(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function money2(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: getCurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  /* ── Percentage formatter ───────────────────────────────── */

  function pct(value) {
    return Math.round(Number(value) || 0) + '%';
  }

  /* ── Public namespace ────────────────────────────────────── */

  var helpers = {
    esc:    esc,
    js:     js,
    nval:   nval,
    money0: money0,
    money2: money2,
    pct:    pct,
    /** @internal */
    _version: 'v0.9.5'
  };

  /* window.MM — short alias for use inside patch layers */
  window.MM = helpers;

  /* window.MoneyMap.helpers — canonical namespace path */
  if (window.MoneyMap && typeof window.MoneyMap === 'object') {
    try { window.MoneyMap.helpers = helpers; } catch (e) { /* frozen object — skip */ }
  }

})();
