# Changelog

All notable MoneyMap changes are documented here. This file is consolidated from the legacy changelog and converted patch notes.

---

## v0.1.12 — 2026-05-30

### Current source metadata

- Build ID: `v0.1.12`
- Asset token: `v0.1.12-20260530-1`
- Storage key: `moneymap_v1`
- Release name in source metadata: Dashboard command center redesign, Accounts premium UI, taxonomy filters, stale renderer cleanup, and cache-safe static release

### Documentation status

- The repository documentation has been realigned to the audited `v0.1.12` package.
- Legacy `.txt` release notes have been converted to Markdown and moved into `../../patch-notes/releases/`.
- The README now describes the current app without overstating unsupported features.
- The roadmap now starts with audit-driven stabilization work.

### Known audit issue

- The Accounts view can remain visible after navigating to another route. This should be treated as a P0 stabilization item.

---

## v0.1.11 — 2026-05-30

### Added

- Hash-based routing through `src/js/core/router-v0.1.11.js`.
- Browser back/forward navigation between major views.
- Direct hash links such as `index.html#accounts`.

### Fixed

- Accounts net-worth dot popover CSS restored after prior load-order cleanup.
- Checking, savings, money market, and CDs consolidate into a single Cash group.

---

## v0.1.10 — 2026-05-30

### Dashboard

- Replaced the two-column hero panel with a full-width command band.
- Added next-action headline, answer buttons, KPI strip, and compact quick actions.
- Reworked the main grid around cash flow, spending, budgets, review, accounts, recent activity, recurring charges, goals, and debt.
- Added canonical Dashboard renderer and CSS for the redesign.

### Accounts

- Added premium Accounts page header with gradient treatment, large net-worth display, and prior-snapshot delta.
- Added category filter pills with icons, totals, and debt grouping.
- Grouped rows by category sections and split assets vs liabilities more clearly.
- Added right-side allocation and account summary surfaces.
- Added canonical Accounts renderer and CSS for the redesign.

### Build

- Updated build/cache token for the static release.
- Preserved existing localStorage data shape.

---

## v0.1.9

- Refined the desktop Dashboard into a clearer decision board.
- Tightened Dashboard spacing, card hierarchy, quick actions, and command-center behavior.
- Tightened Accounts with a labeled filter panel, reset control, clearer summary metadata, renamed Snapshot actions, and more compact premium account rows.
- Refined the account summary/sidebar so active groups, included accounts, and asset/debt totals read more clearly on desktop.
- Replaced favicon artwork with a simpler transparent orange `M`.
- Hardened local preview launchers with `index.html` checks, Python command detection, and automatic fallback from port 8080 to 8081.
- Bumped the canonical build/cache token to `v0.1.9` while preserving the existing `localStorage` data shape.

---

## v0.1.8

- Tightened the desktop Dashboard money brief with clearer next action, cash flow, review queue, top spending category, budget status, and net worth context.
- Added Dashboard account category shortcuts that open the Accounts page with the matching filter active.
- Added Accounts filters for assets, debt, and specific real-world categories.
- Improved Accounts desktop density, active filter styling, summary category rows, row spacing, inclusion visibility, and category bars.
- Replaced the favicon set with cleaner orange-M SVG icons.
- Added flat-preview launchers for Windows and Mac.
- Bumped the canonical build/cache token to `v0.1.8` while preserving the existing `localStorage` data shape.

---

## v0.1.6

- Rebuilt Overview as a desktop command center with real local state for net worth, cash flow, review queue, budgets, categories, accounts, goals, debt, recurring charges, and recent activity.
- Removed duplicate dashboard renderer references from `index.html`.
- Fixed duplicate final build guard reference.
- Hardened net-worth canvas sizing so hover, click, and scroll cannot stretch chart containers.
- Refined navigation labels so Accounts owns balances and History owns snapshots.
- Updated the favicon with light and dark variants.

---

## v0.1.5

- Fixed the desktop Accounts net-worth chart stretch bug caused by hover popovers changing canvas measurements during redraw.
- Reduced chart redraw churn so hover inspection feels lighter and more stable.
- Replaced the tab icon with a cleaner MoneyMap favicon.
- Relabeled the separate Net Worth destination as History while keeping Accounts as the main balance workspace.

---

## v0.1.4

- Removed the external-style explanation action from net-worth dot popovers.
- Hardened the desktop Accounts page so older account renderers do not overwrite the newer chart and icon layout.
- Added clickable net-worth point popovers to the fallback Accounts chart path.
- Added custom selectable account icons and saved selected icons with accounts.
- Bumped the canonical build and cache token to `v0.1.4`.

---

## v0.1.2

- Bumped the canonical build label to `v0.1.2` and added a unique asset cache token.
- Reworked the mobile dashboard into a chart-first overview.
- Rebuilt mobile More/customize behavior so Accounts and Review remain available.
- Polished the transaction editor and rounded saved/displayed amounts to cents.
- Removed old package-only install notes from the release zip to prevent stale build instructions.

---

## v0.1.1

- Added chart-first dashboard for mobile and desktop.
- Pinned Review shortcut at the top of the Overview dashboard.
- Redesigned the transaction editor with live preview, quick categories, transfer hiding, sticky actions, and cents rounding.
- Fixed stale build labeling where legacy scripts could make GitHub Pages appear to be on v0.8.

---

## v0.1.0 — Public launch

### Added

- Interactive net worth chart with snapshot detail popups.
- Account snapshots on save.
- Dashboard redesign with net worth hero, cash flow strip, review banner, and spending breakdown.
- SVG icon system.
- Editable bottom nav bar.
- Touch gesture engine.
- Keyboard-aware drawer forms.
- Compact bottom nav.
- First-run screen redesign.
- Accounts snapshot card on Overview.
- Welcome and empty states.
- Transaction form redesign with Spend/Income toggle.
- iOS input zoom fix.
- Add bottom nav button.
- Render bus.
- Shared helpers.
- `window.MoneyMap` namespace.
- Spend map extraction.

### Changed

- Moved version scheme to semver.
- Improved first-run handling.
- Added realistic demo data.
- Updated account and transaction save behavior.
- Standardized app build labels.
- Improved bottom nav and chart behavior.

### Fixed

- First-run mobile scroll bleed.
- Repeated first-run screen on every build change.
- Incorrect quick transaction sign handling.
- Hardcoded Settings build label.
- Excessive `renderAll` wrapper layering.

---

## Pre-release development

Development before `v0.1.0` used internal `v0.9.x` patch numbering. Those changes were consolidated into the public launch baseline.
