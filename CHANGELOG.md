# Changelog

## v0.1.4
- Removed the external-style action to keep chart details explicitly local and private.
- Hardened the desktop Accounts page so older account renderers do not overwrite the new chart and icon layout.
- Added clickable net-worth point popovers to the fallback Accounts chart path.
- Bumped the canonical build and cache token to v0.1.4.

# MoneyMap changelog

## v0.1.4
- Added clickable, Monarch-style net-worth chart dots with persistent popovers and an external-style action.
- Rebuilt the desktop Accounts page around a chart-first performance card, grouped account list, and summary panel.
- Added custom selectable account icons and saved the selected icon with each account.
- Updated the canonical build label and cache token to v0.1.4.

## v0.1.2
- Bumped the canonical build label to v0.1.2 and added a unique asset cache token.
- Reworked the mobile dashboard into a chart-first overview with Review, net worth trend, cash flow, category spend, budget pressure, recurring charges, and activity cards.
- Rebuilt mobile More/customize behavior so Accounts and Review remain available and stale one-item bottom bars are corrected.
- Polished the transaction editor and rounded saved/displayed amounts to cents.
- Removed old package-only install notes from the release zip to prevent stale build instructions.

## v0.1.1
- New chart-first dashboard for mobile and desktop.
- Review shortcut is pinned at the top of the Overview dashboard and mobile nav is nudged back to Review.
- Transaction editor redesigned with live preview, quick categories, transfer hiding, sticky actions, and cents rounding.
- Fixed stale build labeling where legacy scripts could make GitHub Pages appear to be on v0.8.

# Changelog

All notable changes to MoneyMap are documented here.

Format: [version] — date — summary  
Types: **Added** · **Changed** · **Fixed** · **Removed**

---

## [v0.1.0] — 2026 · Public launch

First public release. Consolidates all development work into a clean starting point.

### Added
- **Interactive net worth chart** — click or tap any dot to see a full account breakdown (name, institution, balance) for that snapshot
- **Account snapshots on save** — when saving a net worth snapshot, the current account list is captured and stored so dot popups always have accurate data
- **Dashboard redesign** — new `mm-dash-v010` layout with net worth hero, 3-column cash flow strip, conditional review banner, and spending breakdown with budget bars
- **SVG icon system** — all navigation icons replaced with clean inline SVG (`src/js/ui/nav.js`). Consistent 24×24 viewBox, 1.75 stroke. No more emoji.
- **Editable bottom nav bar** — tap "Edit bar" in the More sheet to choose which 4 sections appear in the bottom tab bar. Preference saved to localStorage.
- **Touch gesture engine** (`src/js/ui/touch.js`) — swipe right to mark transactions reviewed, swipe left to edit. Swipe right on review card to approve, left to skip. Swipe down on drawer to close.
- **Keyboard-aware drawer forms** — sticky footer with `--keyboard-h` CSS variable keeps the Save button above the iOS virtual keyboard.
- **Compact bottom nav** — bar height reduced from 56px → 50px + safe area. Bottom sheet drawer style (rounded top corners, drag handle).
- **First-run screen redesign** — full-screen lock (no scroll bleed), preview card showing a real account snapshot, two clear CTAs (demo vs start fresh). iOS scroll lock fixed.
- **Accounts snapshot card** on Overview — Monarch-style account list showing all balances at a glance when accounts are set up.
- **Welcome / empty state** — three-step checklist (add accounts → add transactions → set a budget) for fresh workspaces.
- **Transaction form redesign** — Spend/Income toggle (no more "type negative for expenses"). `inputmode="decimal"` keyboard on mobile.
- **iOS input zoom fix** — all inputs ≥16px font-size on mobile; Safari no longer zooms on focus.
- **"Add" bottom nav button** — replaces Import as the second tab; opens quick-add menu for transaction, account, budget, etc.
- **Render bus** (`src/js/core/render-bus.js`) — priority-ordered render event registry replacing the 21-layer `window.renderAll` monkey-patch chain.
- **Shared helpers** (`src/js/core/shared-helpers.js`) — canonical `MM.esc`, `MM.money0`, `MM.money2`, `MM.pct`, `MM.nval` replacing ~8× duplicated local constants.
- **`window.MoneyMap` namespace** — extensible API surface for all modules.
- **Spend map extraction** — Overview spending category list moved from `app.js` to `src/js/ui/spend-map.js`.

### Changed
- Version scheme moved to semver (v0.1.0 → v0.1.1 → v0.2.0)
- `shouldShowFirstRun` — now shows only for new users, not on every build change
- `demoNetWorthHistory` — now includes realistic `accountSnapshot` data with per-account balances
- `demoAccounts` — now uses realistic institution names (Chase, Marcus, Fidelity, Amex)
- `saveNetWorthSnapshot` — now saves `accountSnapshot` array with every entry
- `buildMobileNav` — final override in `nav.js`; uses SVG icons from `MM_NAV.icon()`
- `buildNav` (sidebar) — uses `MM_NAV.icon()` when available, falls back to emoji
- `saveQuickTransaction` — handles Spend/Income toggle, always applies correct sign
- `renderSettings` build label — reads `APP_BUILD_ID` instead of hardcoded string
- Bottom bar height — 50px content height (was 56-60px across competing patch layers)
- Net worth chart — area fill under line added; active dot gets glow ring; `cursor: pointer`

### Fixed
- First-run screen mobile scroll bleed — `.first-run { overflow: hidden }` + `overscroll-behavior: contain` on inner panel
- `shouldShowFirstRun` — was tied to `BUILD_ID` change, so existing users saw it on every release
- `saveQuickTransaction` — was storing raw input value as amount, ignoring sign convention
- Settings build label hardcoded to `v0.9.4` — now reads from `APP_BUILD_ID`
- `app.js` renderAll wrapped 21+ times — render bus is the canonical hook going forward

---

## Pre-release development (v0.9.x)

All development leading to v0.1.0 was done under internal patch versioning (v0.9.4 through v0.9.9). The versions above consolidate that work.
