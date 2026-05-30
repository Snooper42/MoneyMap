# MoneyMap v0.9.5 architecture

## Current state

MoneyMap is a local-first, single-page vanilla JS application. It has no build
step, no bundler, no backend, and no npm dependencies. Files load directly in the
browser via `<script>` and `<link>` tags.

---

## Module load order

```
src/js/core/app-config.js       ← Release metadata, window.MoneyMap namespace
src/js/utils.js                 ← Pure helpers: clone, money, date formatters, escapeHtml
src/js/core/security.js         ← Safe rendering: escape, safeUrl, setTrustedHtml
src/js/state.js                 ← Constants (STORAGE_KEY, CATEGORIES, NAV), mutable state
src/js/storage.js               ← localStorage load/save, backup, export — state = loadState() at end
src/js/navigation.js            ← buildNav, showView, command palette, keyboard shortcuts
src/js/accounts.js              ← Account CRUD, net worth helpers
src/js/transactions.js          ← Transaction CRUD, category helpers, escapeJs
src/js/import/parsers.js        ← CSV/text parsing, column mapping guesses
src/js/import/workflow.js       ← File filtering, pending import, post-import sorting
src/js/budgets.js               ← Budget CRUD, budgetStats
src/js/investments.js           ← Holdings CRUD, holdingValue
src/js/charts.js                ← Canvas chart helpers
src/js/settings.js              ← Settings panel renders, appearance, demo data
src/js/app.js                   ← Bootstrap (init), renderAll, all render functions,
                                   patch-layer IIFEs (r25SpendMap, v0.5 account groups)
src/js/core/cache-guard.js      ← Stale asset check, reload notice, build marking
src/js/core/render-bus.js       ← v0.9.5: Render event registry (NEW)
src/js/core/shared-helpers.js   ← v0.9.5: Canonical format helpers — window.MM (NEW)

 ── UX patch layers (load last, outermost wrappers) ──────────────────────
src/js/ux-v0.7.js               ← Drawer system, goal/debt/credit drawers, rule builder
src/js/ux-v0.7.1.js             ← Debt payoff timeline, goal progress, recurring detection
src/js/ux-v0.9.js               ← Today panel, v5 command board, recurring UI
src/js/ux-v0.9.1.js             ← Weekly review mode, transaction quick-edit drawer
src/js/ux-v0.9.2.js             ← Account grouped view (v092), v52 parity panel
src/js/ux-v0.9.4.js             ← Low-key dashboard, account-category trends, investments card
```

---

## Key module responsibilities

### `src/js/core/app-config.js`
- Single source of truth for `BUILD_ID` and `STORAGE_KEY`
- Exports `window.MoneyMapConfig` (frozen) for legacy modules
- Bootstraps `window.MoneyMap` extensible namespace

### `src/js/core/render-bus.js` ← v0.9.5
- Priority-ordered render hook registry
- Wraps `window.renderAll` once (guarded by `__renderBusHooked`) so hooks
  fire after every render without adding another monkey-patch layer
- API: `register(name, fn, priority)`, `run()`, `list()`, `unregister(name)`

### `src/js/core/shared-helpers.js` ← v0.9.5
- Canonical format helpers: `MM.esc`, `MM.js`, `MM.money0`, `MM.money2`,
  `MM.pct`, `MM.nval`
- New patch layers must use these instead of declaring local copies

### `src/js/core/security.js`
- Safe rendering: `escape`, `escapeAttr`, `safeText`, `safeUrl`, `setTrustedHtml`
- Exported as `window.MoneyMapSecurity`

### `src/js/core/cache-guard.js`
- Checks for stale cached assets on load
- Shows a reload prompt if the page version mismatches the expected build
- Wraps `window.renderAll` to verify asset freshness after renders

### `src/js/state.js`
- `STORAGE_KEY`, `OLD_STORAGE_KEYS`, `APP_BUILD_ID`
- `CATEGORIES`, `NAV`, `COLORS` (shared constants)
- `defaultState`, `state` (mutable singleton), `activeView`, `reviewIndex`

### `src/js/storage.js`
- `loadState()`, `saveState()`, `mergeState()`
- `exportBackup()`, `importBackupFile()`, `resetAllData()`
- Storage health monitoring and warning banner
- Ends with `state = loadState()` — populates the singleton

### `src/js/app.js`
- `init()` — bootstrap called on DOMContentLoaded
- `renderAll()` — core render dispatcher (calls every feature renderer)
- All view render functions (renderOverview, renderTransactions, etc.)
- Patch-layer IIFEs at the bottom:
  - **r25SpendMap** — canvas-based spend heatmap
  - **v0.5 account groups** — account dashboard, group tabs, net-worth landing card

---

## Data model

The app stores one JSON blob in `localStorage` under the key `moneymap_v1`.

Structure:
```js
{
  version: 13,
  appearance: { theme, accent, density, vibe },
  settings: { currency, showCents, incomeTarget, ... },
  automation: { transferDetection, subscriptionDetection, merchantCleanup, ... },
  trackerSettings: { debtStrategy, creditTarget, creditCadence },
  transactions: [...],
  rules: [...],
  merchantRules: [...],
  budgets: [...],
  goals: [...],
  accounts: [...],
  netWorthHistory: [...],
  debts: [...],
  holdings: [...],
  creditHistory: [...],
  imports: [...],
  importMappings: [...],
  recurring: [...]
}
```

**Critical constraint:** Do not change `STORAGE_KEY` without a deliberate,
tested migration. The key `moneymap_v1` must survive across all patch layers.

---

## The renderAll wrapping problem

### Background

`app.js` defines `renderAll()` at line 225. By v0.9.4, this function had been
monkey-patched approximately 21 times:
- 16 wraps inside `app.js` itself (patch-layer IIFEs)
- 1 wrap in each of: `cache-guard.js`, `ux-v0.9.js`, `ux-v0.9.1.js`,
  `ux-v0.9.2.js`, `ux-v0.9.3.js` (via ux-v0.9.4), `ux-v0.9.4.js`

Each wrap adds a layer of closure indirection and a boolean flag
(`__v094Wrapped`, `__qa6Wrapped`, etc.) to prevent double-wrapping.
The chain is difficult to audit and fragile.

### v0.9.5 solution: render bus (additive)

`render-bus.js` wraps `renderAll` one more time (guarded by
`__renderBusHooked`) and fires registered hooks via `requestAnimationFrame`
after the existing chain completes. This is purely additive:

```
renderAll()          ← ux-v0.9.4 wrapper (outermost)
  renderAll()        ← ux-v0.9.3 wrapper
    ...
    renderAll()      ← render-bus wrapper (fires bus after chain)
      renderAll()    ← original app.js function
```

New patch layers from v0.9.5 onward register hooks:

```js
MoneyMapRenderBus.register('v096Dashboard', renderMyPanel, 60);
```

### Future: render bus migration path

Future patches should:
1. Register via bus instead of monkey-patching `window.renderAll`
2. Remove their manual `renderAll` wrap if refactoring an existing layer

Long-term (v1.x), the bus should be the only mechanism, and the old wrapping
chain can be consolidated.

---

## CSS architecture

Ten CSS files load in order. Later files override earlier ones.

```
src/css/base.css          ← Design tokens (:root CSS variables), reset, dark defaults
src/css/layout.css        ← App shell, sidebar, main, topbar grid
src/css/components.css    ← Reusable UI: cards, buttons, inputs, tables, drawer
src/css/mobile.css        ← Mobile-first overrides, mobile nav bar
src/css/ux-v0.7.css       ← Drawer styling, goal/debt/credit UX
src/css/ux-v0.8.css       ← Storage banner, backup drawer, settings improvements
src/css/ux-v0.9.css       ← Today/command panel, recurring timeline
src/css/ux-v0.9.1.css     ← Review mode, quick-edit drawer
src/css/ux-v0.9.2.css     ← Account grouped view, v52 parity panel
src/css/ux-v0.9.4.css     ← Low-key dashboard, account trends, investments card
```

CSS has the same patch-layer accumulation problem as JS. A future cleanup
pass should consolidate into 3–4 files: tokens, layout, components, and a
single UX file.

---

## React / TypeScript migration assessment

### Current verdict: not yet — safe foundation first

The codebase is not ready for React conversion. Reasons:
- Every render function returns or writes large `innerHTML` strings
- Global function calls (`onclick="functionName()"`) are wired into HTML templates
- No component boundaries exist
- The monkey-patch render chain would conflict with React's reconciliation

### Recommended migration path

| Phase | Version | Target |
|-------|---------|--------|
| Foundation | v0.9.5 | Render bus, shared helpers, MoneyMap namespace (this patch) |
| UI extraction | v0.9.6 | Extract view renders into `src/js/ui/` modules |
| Type safety | v0.9.7 | Add JSDoc types to core modules; experiment with TypeScript for new files only |
| API surface | v1.0 | Stabilize `window.MoneyMap` as the only entry point; deprecate raw globals |
| React islands | v1.1+ | Convert one isolated view (e.g. Goals) to a React component; keep rest vanilla |
| Full React | v2.x | If React islands prove stable, convert remaining views one at a time |

### Rules for incremental conversion

- Never convert a view that is still being actively patched at the JS level
- Each React component must be a pure island with no shared DOM state
- Keep the existing vanilla-JS version working until the React version is validated
- TypeScript strictly optional — JSDoc types on stable modules is acceptable
- Never add a bundler until at least 3 React views are stable

---

## Known technical debt

| File | Issue | Suggested next step |
|------|-------|---------------------|
| `app.js` | 3,905 lines; two large IIFEs at bottom (r25SpendMap, v0.5 account groups) | Extract IIFEs to `src/js/ui/spend-map.js` and fold into accounts.js |
| `app.js` | 21 `renderAll` rewraps | Migrate new patch layers to render bus; consolidate old wrappers gradually |
| All UX patch layers | Each redefines `esc`, `money0`, `money2`, `pct` locally | Use `MM.*` helpers from `shared-helpers.js` |
| CSS | 10 separate CSS files with overlapping selectors | Consolidate into 4 files in a future CSS cleanup pass |
| Build metadata | `markBuild()` defined in 3+ places (app-config, ux-v0.9.4, app.js bottom IIFE) | Canonicalize to app-config only |
| `src/js/ux-v0.9.3.js` | Present in `src/js/` but not loaded in `index.html` | Confirm intentional; either load it or remove the file |

---

## File creation rules (for contributors)

- **New UX feature**: add a `src/js/ux-vX.Y.js` file + `src/css/ux-vX.Y.css`
- **New core module**: add to `src/js/core/`
- **New render hook**: use `MoneyMapRenderBus.register(name, fn, priority)` — do not
  wrap `window.renderAll` manually
- **Format helpers**: use `MM.esc`, `MM.money0`, etc. — do not declare local copies
- **No bundler**: all files are plain browser JS; no `import`/`export`
- **No backend**: all data stays in `localStorage`; key must stay `moneymap_v1`
- **No alert/confirm**: use `mmConfirm`, `mmPrompt`, or `mmDialog` from `utils.js`

---

## Previous architecture notes

See `docs/ARCHITECTURE_v0.8.md` for the v0.8 split that established the
current module boundary structure.
