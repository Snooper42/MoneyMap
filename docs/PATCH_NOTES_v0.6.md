# MoneyMap v0.6 Patch Notes

## UX focus

v0.6 is a mobile-first onboarding and transaction experience refresh. The goal is to make a first upload feel automatic, immediate, and visually useful without changing the local-first storage model.

## Changed

- Added a new Home landing layer that leads with what to do next, monthly cash flow, spend history, category spend, import history, and largest merchants.
- Added a CSV import coach that explains the automatic flow: upload, auto-map, preview, save, then chart on Home.
- Auto-prepares the import review when required columns are confidently detected.
- After import, returns the user to Home so charts and history appear immediately.
- Added mobile transaction summary chips for needs review, spending, income, and month context.
- Reworked mobile transaction cards into day groups for faster scanning.
- Replaced the Accounts presentation with larger grouped account cards and clearer group filters.
- Updated build metadata, Settings version label, and cache busting to v0.6.

## Preserved

- Existing localStorage key remains `moneymap_v1`.
- No backend or bank-sync dependency was added.
- Browser-native `alert()` and `confirm()` were not introduced.
- Existing global search, spending map, review flow, and backup data shape remain intact.
