# MoneyMap v0.9.3 patch notes

## Focus of this pass
- Fix the desktop sidebar / main-content layout break seen during local testing
- Make the Home dashboard lower-key and less oversized
- Keep the useful spending-history information while reducing empty visual space
- Add account-category trend charting based on the net-worth chart pattern
- Add explicit asset/liability direction control to manual accounts
- Clean up Investments so it is less table-heavy and more consistent with Accounts

## What changed

### Home dashboard
- Replaced the oversized Home composition with a lower-key final-loaded dashboard layer
- Reduced large tile spacing and card height
- Kept useful spending history stats:
  - this month
  - average
  - comparison versus last month
  - highest month
  - transaction counts
  - income context
- Reworked the current-month category panel into tighter spending rows
- Budget context still appears where a matching budget exists

### Accounts
- Added account-category trend chart controls:
  - All accounts
  - Cash
  - Investments
  - Credit cards
  - Loans and debt
  - Property
  - Valuables
  - Other
- Added explicit account direction control:
  - Asset
  - Liability
- Existing accounts remain compatible. If an account has no explicit direction, MoneyMap still infers asset/liability from the account type.
- Account totals now respect the explicit direction when present.

### Investments
- Replaced the dense table-first feel with a card-first holdings view
- Added cleaner metric cards
- Added a simpler allocation panel
- Kept manual holdings, cost basis, gain/loss, and net-worth inclusion behavior

### Layout stability
- Added guardrails to prevent desktop sidebar/content overlap and horizontal overflow
- Mobile still hides the sidebar and uses the bottom navigation shell

## Safety notes
- No backend was added
- localStorage key remains `moneymap_v1`
- Existing data remains compatible
- This patch adds optional account `direction` metadata only when the user chooses asset/liability
- No browser-native `alert()` or `window.confirm()` usage was added

## Changed files
- `README.md`
- `index.html`
- `src/js/core/app-config.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/ux-v0.9.3.js`
- `src/css/ux-v0.9.3.css`
- `docs/PATCH_NOTES_v0.9.3.md`
- `txt/v0.9.3_install.txt`
