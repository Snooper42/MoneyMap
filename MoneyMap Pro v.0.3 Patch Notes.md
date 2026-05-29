# MoneyMap Pre-v1 Alpha UX/Mobile Polish

Build label: `v0.9.0-alpha`

## Version cleanup

- Replaced the user-facing Phase 0 / v6.2 build label with `v0.9.0-alpha`.
- Backup metadata continues to use `APP_BUILD_ID`, now set to `v0.9.0-alpha`.
- Settings display shows the app as a pre-v1 alpha build.

## Deeper UI and UX polish

- Tightened cards, headers, buttons, pills, inputs, and dashboard spacing.
- Reduced mobile vertical padding and header height.
- Made the bottom nav more compact with shorter labels.
- Improved the More menu layout on mobile.
- Added stronger mobile spacing rules for review, charts, cards, forms, and drawers.
- Preserved the existing 5-item mobile nav pattern: Home, Review, Txns, Budget, More.

## Chart polish

Applied the credit tracker chart treatment to the other chart areas:

- Monthly spending chart
- Net worth trend chart
- Investment allocation chart

New chart behavior:

- Interactive canvas focus states.
- Legend chips below charts.
- Hover/tap detail tooltips where supported.
- Cleaner rounded chart cards.
- Better mobile chart layout.

## Validation

Syntax validation performed with Node after extracting the inline script.

Recommended browser QA before publishing:

- Fresh load with no local data.
- Load demo workspace.
- Test Home, Review, Transactions, Budgets, and More on mobile width.
- Open spending, net worth, investment, and credit charts.
- Export backup and restore backup.
- Confirm Settings shows `Pre-v1 alpha · v0.9.0-alpha`.
