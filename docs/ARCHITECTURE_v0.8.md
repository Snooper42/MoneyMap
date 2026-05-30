# MoneyMap v0.8 architecture notes

## Purpose

MoneyMap has grown through fast patch layers. v0.8 starts separating those layers so future work is easier to audit, test, and deploy safely.

## Current load order

1. `src/js/core/app-config.js`
2. `src/js/utils.js`
3. `src/js/core/security.js`
4. `src/js/state.js`
5. `src/js/storage.js`
6. `src/js/navigation.js`
7. `src/js/accounts.js`
8. `src/js/transactions.js`
9. `src/js/import/parsers.js`
10. `src/js/import/workflow.js`
11. Feature modules
12. `src/js/app.js`
13. `src/js/core/cache-guard.js`
14. UX patch layers

## New module boundaries

### `src/js/core/app-config.js`
Owns release/build metadata. Future build IDs should be changed here first.

### `src/js/core/security.js`
Owns shared safe rendering helpers. Future rendering refactors should use these instead of local ad-hoc escaping helpers.

### `src/js/core/cache-guard.js`
Owns stale asset checks, service worker/cache cleanup, reload notice display, and build marking.

### `src/js/import/parsers.js`
Owns text parsing for delimited transaction files and column mapping guesses.

### `src/js/import/workflow.js`
Owns file filtering, pending import creation, fallback account naming, and post-import sorting.

## Data model rule

Do not change `STORAGE_KEY` unless a migration is intentionally designed and tested. Current key remains:

```text
moneymap_v1
```

## Future recommended splits

1. Move all transaction rendering into `src/js/ui/transactions-view.js`
2. Move Home dashboard rendering into `src/js/ui/home-view.js`
3. Move account card rendering into `src/js/ui/accounts-view.js`
4. Move report/export helpers into `src/js/export/*`
5. Add a small migration registry for future schema changes
6. Reduce global functions by creating a single `window.MoneyMap` namespace facade
