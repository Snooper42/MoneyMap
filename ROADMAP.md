# MoneyMap Roadmap

Local-first, privacy-first personal finance. No bank login, no sync, no backend.

---

## v0.1.x — Stability + polish (current)

Patch releases. No breaking changes.

- [x] v0.1.2 — Mobile dashboard, More sheet, cache-busting, and transaction editor polish
- [x] v0.1.3 — Desktop Accounts polish, clickable net-worth dots, and custom account icons
- [ ] v0.1.4 — CSS consolidation: merge patch CSS files into canonical layers
- [ ] v0.1.5 — Review mode swipe gesture improvements + category quick-pick grid
- [ ] v0.1.6 — Net worth chart: mobile touch pan / pinch-to-zoom on multi-year history
- [ ] v0.1.7 — Transaction card: long-press context menu (edit, delete, categorize, split)

---

## v0.2.0 — Charts overhaul

Replace canvas charts with an SVG/DOM layer for better mobile interaction and accessibility.

- [ ] Net worth chart in SVG with animated line drawing on first load
- [ ] Spending history bar chart in SVG (replaces canvas spend chart)
- [ ] Budget arc charts replacing the flat progress bars
- [ ] Chart theme tokens (light/dark chart surfaces)
- [ ] Accessible keyboard navigation on all chart data points

---

## v0.3.0 — Dashboard v2

Deeper dashboard with actionable intelligence.

- [ ] Projected end-of-month cash flow based on recurring charges
- [ ] "Unusual spending" flag — categories >20% above 3-month average
- [ ] Budget health score (0–100) replacing the benchmark system
- [ ] Weekly spending sparklines in the category breakdown
- [ ] Pinnable tiles — user controls which cards appear on the dashboard

---

## v0.4.0 — Import improvements

- [ ] Drag-and-drop multi-file import (process multiple CSVs at once)
- [ ] Saved import profiles per bank (Chase, Amex, Marcus, etc.)
- [ ] Auto-mapping suggestions based on column names
- [ ] Duplicate detection improvement: fuzzy merchant name matching
- [ ] Import history: see all prior imports and re-process if needed

---

## v0.5.0 — Goals + planning

- [ ] Goal contribution calculator — "to hit this goal, set aside $X/month"
- [ ] Goal progress history chart
- [ ] Sinking fund tracker — tag accounts to specific goals
- [ ] Debt payoff celebration (confetti + payoff date estimate display)
- [ ] Annual net worth projection based on current trajectory

---

## v1.0.0 — API surface + extensibility

- [ ] Stable `window.MoneyMap` API (no breaking changes after this)
- [ ] TypeScript type definitions (`.d.ts`) for all core modules
- [ ] Plugin hook system via `MoneyMapRenderBus`
- [ ] Export API — programmatic access to all data exports
- [ ] Service Worker for offline-first PWA behavior
- [ ] Full PWA manifest + install prompt

---

## Considered but not planned

These have been discussed but are not on the roadmap:

- **Bank sync / Plaid integration** — contradicts the privacy-first principle
- **Backend / cloud sync** — contradicts the local-first principle
- **React rewrite** — not until API surface is stable (post v1.0)
- **Native app** — possible via Tauri/Capacitor wrapper post v1.0

---

## Suggesting features

Open an issue with the label `roadmap` and describe the use case, not just the feature.
