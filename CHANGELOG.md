## v0.1.10 — 2026-05-30 — Dashboard command center redesign + Accounts premium UI

### Dashboard
- Replaced two-column hero panel with full-width command band (accent gradient)
- Command band: next-action headline, 4 answer buttons, KPI strip on right side
- Quick actions row: 6 compact buttons (Import, Add, Review, Accounts, Snapshot, Backup)
- Main grid: 2 columns — (Cash flow chart + Spending) | (Budgets + Review + Accounts)
- Bottom row: 4 cards — Recent activity, Upcoming recurring, Goals, Debt
- New canonical renderer: `src/js/ui/dashboard-v0.1.10.js`
- New canonical CSS: `src/css/dashboard-v0.1.10.css`

### Accounts
- Premium page header with gradient, large net worth display, delta vs prior snapshot
- Category filter pill bar with icons, totals, and debt grouping
- Clear Assets / Liabilities side headers with section totals
- Account groups rendered as card sections with icon and metadata header
- More compact account rows with colored category type badges
- Right-side summary: allocation bar, per-category list, action buttons
- New canonical renderer: `src/js/ui/accounts-v0.1.10.js`
- New canonical CSS: `src/css/accounts-v0.1.10.css`

### Stale renderer cleanup
- Removed from index.html: `ux-v0.7.js`, `ux-v0.7.1.js`, `ux-v0.9.1.js`, `ux-v0.9.4.js`
- Removed CSS layers: 11 old ux-v0.* css files, old desktop and accounts css
- Kept: `ux-v0.9.js` (accounts nav), `ux-v0.9.2.js` (editor), `ux-v0.9.8.js` (touch)

### Favicons
- New clean orange "M" on rounded rectangle for light and dark modes

### Build
- Version: v0.1.10, token: v0.1.10-20260530-1
- Updated `final-build-guard-v0.1.10.js` (removed setInterval polling)
- All localStorage data preserved, no schema changes

## v0.1.9
- Refined the desktop Dashboard into a clearer decision board with “What changed?”, “Where is money going?”, “Am I on track?”, and “Upcoming charges” cards.
- Tightened Dashboard spacing, card hierarchy, quick actions, and command-center behavior while continuing to use only real local app state.
- Tightened Accounts with a labeled filter panel, reset control, clearer summary metadata, renamed Snapshots actions, and more compact premium account rows.
- Refined the account summary/sidebar so active groups, included accounts, and asset/debt totals read more clearly on desktop.
- Replaced the favicon artwork with a simpler transparent orange `M` for both light and dark mode.
- Hardened local preview launchers with `index.html` checks, Python command detection, and automatic fallback from port 8080 to 8081.
- Bumped the canonical build/cache token to `v0.1.9` while preserving the existing `localStorage` data shape.

## v0.1.8
- Tightened the desktop Dashboard money brief with clearer next action, cash flow, review queue, top spending category, budget status, and net worth context.
- Added Dashboard account category shortcuts that open the Accounts page with the matching filter active.
- Added Accounts filters for all groups, assets, debt, and individual categories such as cash, checking, savings, property, vehicles, collectibles, jewelry, credit cards, mortgage, auto loans, student loans, and other debt.
- Improved Accounts desktop density, active filter styling, summary category rows, row spacing, inclusion visibility, and category bars.
- Replaced the favicon set with cleaner orange-M SVG icons for light and dark mode.
- Added flat-preview launchers: `START_WINDOWS_PREVIEW.bat` and `START_MAC_PREVIEW.command`.
- Bumped the canonical build/cache token to `v0.1.8` while preserving the existing `localStorage` data shape.

## v0.1.6
- Rebuilt Overview as a desktop command center with real local state for net worth, cash flow, review queue, budgets, categories, accounts, goals, debt, recurring charges, and recent activity.
- Removed the two duplicate dashboard renderers from `index.html` and added a single final desktop dashboard renderer.
- Fixed the duplicate final build guard reference and bumped the canonical build/cache token to `v0.1.6`.
- Hardened net-worth canvas sizing so hover, click, and scroll cannot stretch chart containers.
- Refined navigation labels so Accounts owns balances and History owns snapshots.
- Updated the favicon with light and dark sideways-M dollar-mark SVG variants.

## v0.1.5
- Fixed the desktop Accounts net-worth chart stretch bug caused by hover popovers changing canvas measurements during redraw.
- Reduced chart redraw churn so hover inspection feels lighter and more stable.
- Replaced the tab icon with a cleaner MoneyMap favicon, with light and dark SVG variants.
- Started a leaner IA pass by relabeling the separate Net worth destination as History while keeping Accounts as the main balance workspace.

# Changelog

## v0.1.4
- Removed the “Explain this change” action to keep chart details explicitly local and private.
- Hardened the desktop Accounts page so older account renderers do not overwrite the new chart and icon layout.
- Added clickable net-worth point popovers to the fallback Accounts chart path.
- Bumped the canonical build and cache token to v0.1.4.

# MoneyMap changelog

## v0.1.4
- Added clickable, Monarch-style net-worth chart dots with persistent popovers and an Explain this change action.
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
