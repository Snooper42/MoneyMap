# MoneyMap v0.9.1 patch notes

## Focus of this pass
- Improve the Home dashboard presentation after the v0.9 Accounts work
- Make the **Spending history** card feel more useful and less visually empty
- Replace the bulky monthly category cards with a cleaner spending breakdown

## What changed

### 1. Spending history upgrade
- Added more useful context above the bars:
  - This month
  - Average spend
  - 3 month average
  - Highest month
- Kept the 6 month bar view, but made it more informative
- Added transaction count and income context under each month
- Kept empty months visible so the timeline remains stable as data grows

### 2. Monthly summary cleanup
- Reworked the current-month panel into a cleaner layout
- Preserved the top-level numbers:
  - Spent
  - Income
  - Net cash flow
- Replaced large category cards with tighter spending rows
- Added budget context when a category has a monthly budget limit
- Added over/left status text when a budget exists

### 3. Visual polish
- Reduced the empty dark space in the spending history section
- Improved card density and hierarchy in dark and light modes
- Kept the overall dark MoneyMap identity intact

## Safety notes
- No localStorage schema changes
- No backend added
- No native alert or confirm popups added
- Existing transaction, budget, account, and snapshot data should remain compatible

## Changed files
- `index.html`
- `src/js/core/app-config.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/ux-v0.9.1.js`
- `src/css/ux-v0.9.1.css`
- `docs/PATCH_NOTES_v0.9.1.md`
- `txt/v0.9.1_install.txt`
