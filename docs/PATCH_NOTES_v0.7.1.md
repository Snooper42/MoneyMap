# MoneyMap v0.7.1 patch notes

## Focus of this patch
Small corrective pass on top of v0.7.

## Fixes

### 1. Persistent reload banner
- Fixed the old cache guard that still expected `v0.5` assets.
- Updated internal patch build constants to `v0.7.1` so the stale asset banner does not appear when the app is actually current.
- Added a final cleanup layer that removes false cache notices.

### 2. Dark mode net-worth card
- Updated the Home net-worth card styling so it uses theme-aware surfaces instead of a fixed dark card.
- Improved label, border, mini-stat, and pill contrast in dark and light modes.

### 3. Transaction cents
- Transaction table amounts now always show cents.
- Mobile transaction cards now always show cents.
- Transaction mini rows now always show cents.
- Dashboard totals, net worth totals, spending history totals, and account totals remain clean without cents unless the global setting is enabled.

## Changed files
- `index.html`
- `src/js/app.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/ux-v0.7.js`
- `src/js/ux-v0.7.1.js`
- `src/css/ux-v0.7.1.css`
- `docs/PATCH_NOTES_v0.7.1.md`
- `txt/v0.7.1_install.txt`
