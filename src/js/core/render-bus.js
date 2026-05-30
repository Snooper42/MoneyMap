/* MoneyMap render bus — introduced v0.9.5
   ─────────────────────────────────────────────────────────────────────
   Problem this solves
   ───────────────────
   Every UX patch layer from v0.7 onward monkey-patches window.renderAll:

     const old = window.renderAll;
     window.renderAll = function() { old(...); myRender(); };

   This creates a deeply nested call stack (~20+ levels by v0.9.4) that is:
     • Hard to audit – no registry of what runs or in what order
     • Fragile – a bad wrap can silence every downstream render
     • Non-inspectable – no way to list active render hooks at runtime

   The render bus is a drop-in replacement for that pattern.
   New modules register a named hook; the bus fires them in priority order
   after the existing render chain completes.

   ─────────────────────────────────────────────────────────────────────
   API
   ───
   MoneyMapRenderBus.register(name, fn, priority?)
     Register a render hook. Lower priority numbers run first (default 50).
     Duplicate names are ignored (with a console warning).

   MoneyMapRenderBus.run(context?)
     Fire all registered hooks. Called automatically after window.renderAll.
     Errors inside hooks are caught and logged — they do not break other hooks.

   MoneyMapRenderBus.list()
     Return a copy of all registered { name, priority } entries. Useful for
     debugging in devtools: MoneyMapRenderBus.list()

   MoneyMapRenderBus.unregister(name)
     Remove a hook by name (for teardown or hot-reload).

   ─────────────────────────────────────────────────────────────────────
   Priority guide (use these bands for new registrations)
   ──────────────────────────────────────────────────────
     10–19  Core renders (state-dependent UI that must run first)
     20–39  Navigation, layout helpers
     40–59  Feature module panels (default: 50)
     60–79  UX polish and enhancement passes
     80–99  Post-render cleanup (build labels, table markup, etc.)

   ─────────────────────────────────────────────────────────────────────
   Usage in new patch layers
   ─────────────────────────
   Instead of:

     const old = window.renderAll;
     if (typeof old === 'function' && !old.__myPatchWrapped) {
       window.renderAll = function() { old.apply(this, arguments); myRender(); };
       window.renderAll.__myPatchWrapped = true;
     }

   Write:

     MoneyMapRenderBus.register('myPatch', myRender, 70);

   ─────────────────────────────────────────────────────────────────────
   Backward compatibility
   ──────────────────────
   This file wraps window.renderAll ONCE (guarded by __renderBusHooked) so
   registered bus handlers fire after the existing chain. Existing patch
   layers that still monkey-patch renderAll continue to work unchanged.
   ───────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* Idempotent – loading this file a second time is a no-op. */
  if (window.MoneyMapRenderBus) return;

  var _handlers = [];

  /* ── Core registry ─────────────────────────────────────── */

  function register(name, fn, priority) {
    if (typeof fn !== 'function') {
      console.warn('MoneyMapRenderBus.register: fn must be a function (got "' + name + '")');
      return;
    }
    if (typeof name !== 'string' || !name) {
      console.warn('MoneyMapRenderBus.register: name must be a non-empty string');
      return;
    }
    priority = Number.isFinite(Number(priority)) ? Number(priority) : 50;

    /* Prevent double-registration */
    if (_handlers.some(function (h) { return h.name === name; })) {
      console.warn('MoneyMapRenderBus: "' + name + '" is already registered — ignoring duplicate.');
      return;
    }

    _handlers.push({ name: name, fn: fn, priority: priority });
    /* Keep handlers sorted by priority (stable sort via index tiebreak) */
    _handlers.sort(function (a, b) {
      return a.priority !== b.priority
        ? a.priority - b.priority
        : _handlers.indexOf(a) - _handlers.indexOf(b);
    });
  }

  function run(context) {
    for (var i = 0; i < _handlers.length; i++) {
      try {
        _handlers[i].fn(context);
      } catch (err) {
        console.warn('MoneyMapRenderBus: handler "' + _handlers[i].name + '" threw an error:', err);
      }
    }
  }

  function list() {
    return _handlers.map(function (h) {
      return { name: h.name, priority: h.priority };
    });
  }

  function unregister(name) {
    var idx = -1;
    for (var i = 0; i < _handlers.length; i++) {
      if (_handlers[i].name === name) { idx = i; break; }
    }
    if (idx >= 0) _handlers.splice(idx, 1);
  }

  /* ── Public API ────────────────────────────────────────── */

  var Bus = {
    register:   register,
    run:        run,
    list:       list,
    unregister: unregister,
    /** @internal — used by devtools & diagnostics only */
    _version:   'v0.9.5'
  };

  window.MoneyMapRenderBus = Bus;

  /* ── Hook into window.renderAll ───────────────────────── */
  /* Wrap the existing renderAll chain exactly once so the bus fires after
     every render. The rAF call lets any rAF-based renders inside the existing
     chain complete before bus handlers run. */
  (function hookRenderAll() {
    if (typeof window.renderAll !== 'function') return;
    if (window.renderAll.__renderBusHooked) return;

    var _original = window.renderAll;
    window.renderAll = function renderAllWithBus() {
      var result = _original.apply(this, arguments);
      /* Fire bus handlers in the next animation frame so they run after
         any rAF-queued work from the existing chain. */
      requestAnimationFrame(function () { Bus.run(); });
      return result;
    };
    window.renderAll.__renderBusHooked = true;
    /* Propagate existing flags so downstream patch guards still work */
    Object.keys(_original).forEach(function (key) {
      if (!(key in window.renderAll)) window.renderAll[key] = _original[key];
    });
  })();

  /* ── Extend MoneyMap namespace ────────────────────────── */
  if (window.MoneyMap && typeof window.MoneyMap === 'object') {
    try { window.MoneyMap.renderBus = Bus; } catch (e) { /* frozen object — skip */ }
  }

  if (window.MoneyMapConfig && window.MoneyMapConfig.localOnly) {
    /* Development hint — visible in DevTools console */
    console.debug('%c[MoneyMap] Render bus active. MoneyMapRenderBus.list() to inspect hooks.', 'color:#54C7EC');
  }

})();
