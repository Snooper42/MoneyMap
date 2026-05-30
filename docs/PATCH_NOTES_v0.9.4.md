# MoneyMap v0.9.4 patch notes

## Focus of this pass
- Fix account category trends so Investments and other groups use the right data source.
- Make saved snapshot dots on the Accounts trend chart hoverable/tappable.
- Preserve the v0.9.3 account category controls and local-first data model.

## What changed

### Account category trend data
- Investments now include included manual holdings in addition to investment account balances.
- Debt categories can include manual debt tracker balances when included in net worth.
- Saved snapshots now store an account group composition payload for future trend accuracy.
- Older snapshots remain backward compatible. When older snapshots do not include group composition, MoneyMap estimates group history from legacy snapshot totals and current group mix instead of showing a misleading flat zero line.

### Hover and tap chart detail
- Saved snapshot dots on the Accounts trend chart are now interactive.
- Hovering or tapping a dot shows:
  - snapshot date
  - saved or live status
  - category value
  - assets
  - liabilities
- The live point remains orange while saved snapshot dots are blue.

### Safety
- localStorage key remains `moneymap_v1`.
- Existing accounts, holdings, debts, and net-worth snapshots remain compatible.
- New snapshot group metadata is additive and does not break older data.

## Changed files
- `README.md`
- `index.html`
- `src/js/core/app-config.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/ux-v0.9.4.js`
- `src/css/ux-v0.9.4.css`
- `docs/PATCH_NOTES_v0.9.4.md`
- `txt/v0.9.4_install.txt`
