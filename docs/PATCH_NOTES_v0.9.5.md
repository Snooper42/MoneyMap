# MoneyMap v0.9.5 patch notes

## Focus of this pass

Architecture: render bus + shared helpers.

This is a conservative, additive architecture step. No existing behaviour
changes. All features work identically. localStorage key and schema are
unchanged.

---

## What changed

### New: `src/js/core/render-bus.js` — `MoneyMapRenderBus`

**Problem solved**

By v0.9.4, `window.renderAll` had been monkey-patched ~21 times across
`app.js` and every UX patch layer. Each patch layer wrapped the previous
wrapper, creating a deeply nested, opaque call chain with no registry of
what runs or in what order.

**What was added**

A lightweight render event bus. New modules register a named hook instead
of wrapping `window.renderAll`:

```js
// New pattern (v0.9.5 onward)
MoneyMapRenderBus.register('myModule', myRenderFn, 70);

// Old pattern (still works — existing layers unchanged)
const old = window.renderAll;
window.renderAll = function() { old.apply(this, arguments); myRender(); };
```

The bus wraps `renderAll` **once** (guarded by `__renderBusHooked`) and
fires registered hooks after the existing chain completes, in priority order.

**Priority bands**

| Range | Use |
|-------|-----|
| 10–19 | Core data-dependent renders |
| 20–39 | Navigation, layout |
| 40–59 | Feature module panels (default: 50) |
| 60–79 | UX polish / enhancement |
| 80–99 | Post-render cleanup (labels, table markup) |

**DevTools inspection**

```js
MoneyMapRenderBus.list()   // → [{ name, priority }, ...]
MoneyMapRenderBus.run()    // manually fire all registered hooks
```

---

### New: `src/js/core/shared-helpers.js` — `window.MM`

**Problem solved**

Every UX patch layer (ux-v0.7 through ux-v0.9.4) opened with the same
six local constant definitions — `esc`, `js`, `money0`, `money2`, `pct`,
`nval` — copied with minor variations and diverging silently. This added
up to ~48 function definitions that all did the same thing.

**What was added**

A single authoritative set of format helpers on `window.MM`:

```js
MM.esc(value)    // safe HTML escape (delegates to escapeHtml)
MM.js(value)     // safe JS string escape (delegates to escapeJs)
MM.money0(value) // currency, no cents
MM.money2(value) // currency, two decimal places
MM.pct(value)    // percentage string, rounded integer
MM.nval(value)   // safe Number (0 for NaN/null/undefined)
```

Future patch layers use `MM.esc(v)` instead of declaring a local `esc`
constant. Existing layers are unchanged.

`window.MoneyMap.helpers` is also set as the canonical namespace path.

---

### Updated: `src/js/core/app-config.js` — `window.MoneyMap` namespace

**What changed**

- `BUILD_ID` updated to `v0.9.5`
- `window.MoneyMap` extensible object created (not frozen — modules
  extend it at load time)
- `window.MoneyMapConfig` (frozen legacy object) preserved unchanged

`window.MoneyMap` is the clean API surface future modules will extend:

```js
window.MoneyMap.version     // 'v0.9.5'
window.MoneyMap.storageKey  // 'moneymap_v1'
window.MoneyMap.renderBus   // set by render-bus.js
window.MoneyMap.helpers     // set by shared-helpers.js
```

---

### Updated: `index.html`

- All `?v=v0.9.4` cache bust strings updated to `?v=v0.9.5`
- Two new script tags added between `cache-guard.js` and the first UX
  patch layer:
  - `src/js/core/render-bus.js`
  - `src/js/core/shared-helpers.js`

---

### Updated: `src/js/state.js`

- `APP_BUILD_ID` fallback updated to `v0.9.5`

---

## Safety checklist

- localStorage key unchanged: `moneymap_v1`
- No state schema changes
- All existing monkey-patch chains continue to work
- render-bus.js and shared-helpers.js are both idempotent (safe if loaded twice)
- No new globals beyond `window.MoneyMapRenderBus`, `window.MM`, and
  the extension of the existing `window.MoneyMap` object

---

## Changed files

- `index.html`
- `src/js/core/app-config.js`
- `src/js/core/render-bus.js` ← NEW
- `src/js/core/shared-helpers.js` ← NEW
- `src/js/state.js`
- `docs/ARCHITECTURE_v0.9.5.md` ← NEW
- `docs/PATCH_NOTES_v0.9.5.md` ← NEW
- `txt/v0.9.5_install.txt` ← NEW
- `README.md`
