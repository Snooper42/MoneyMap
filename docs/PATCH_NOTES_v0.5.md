# MoneyMap v0.5 patch notes

## Release focus
v0.5 is a top-down mobile UX refresh. It does not add finance features. It makes the existing local-first workflow clearer, more guided, and easier to use on iPhone-sized screens.

## UX changes
- Added a new Home guide at the top of the dashboard that answers three questions immediately: where am I, how am I doing, and what should I do next.
- Added clearer next-step actions for first-run setup, transaction review, budgeting, account balances, snapshots, and backups.
- Reworked mobile bottom navigation around primary destinations: Home, Transactions, Review, Accounts, and More.
- Moved secondary destinations into a clearer More sheet with quick actions for Import CSV and Quick add.
- Added a dedicated Accounts page with scan-friendly groups: Cash, Investments, Property, Valuables, Debt, and Other.
- Improved investment page hierarchy with a portfolio guide and card-first holdings layout.
- Reduced reliance on dense tables for Accounts and Investments, especially on mobile.
- Added a visible v0.5 release card in Settings and ensured build labels resolve to v0.5.

## Stability and safety
- Preserved the existing localStorage key and data shape.
- Kept custom MoneyMap modal confirmations. No browser-native `confirm()` or `alert()` prompts were introduced.
- Left global search and spending map rendering paths unchanged.
- Added final CSS guardrails to prevent horizontal page overflow and reduce mobile scroll issues.
- Added v0.5 cache busting to CSS and JS asset URLs.

## Files changed
- `index.html`
- `README.md`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/app.js`
- `src/js/investments.js`
- `src/js/ux-v0.5.js`
- `src/css/ux-v0.5.css`
- `docs/PATCH_NOTES_v0.5.md`
- `txt/v0.5_install.txt`

## Notes
This patch is intentionally an override layer loaded after the existing app code. That keeps the risk low for v0.5 and avoids changing the stored finance data model before the next feature release.
