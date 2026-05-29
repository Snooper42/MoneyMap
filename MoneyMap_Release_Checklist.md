# MoneyMap Phase 0 Release Checklist

Use this before pushing the Phase 0 build to GitHub Pages.

## Smoke test

- [X] Open the app in a clean browser profile with no existing MoneyMap data.
- [ ] Confirm first-run screen appears.
- [ ] Choose Demo mode and confirm dashboard renders.
- [ ] Export a backup JSON from Settings.
- [ ] Export a monthly report from dashboard or command palette.
- [ ] Export a weekly report from Settings.
- [ ] Reset all local data, then confirm first-run appears again.
- [ ] Import the sample CSV and confirm transaction rows appear.
- [ ] Edit one transaction and confirm the change survives page refresh.
- [ ] Add one budget and confirm the dashboard updates.
- [ ] Switch light/dark theme and confirm preference persists.
- [ ] Test at mobile width below 760px.

## Migration test

- [ ] In DevTools, create a legacy `localStorage` item named `moneymap_sick_v1` with a valid backup state.
- [ ] Reload the app.
- [ ] Confirm the app migrates data to `moneymap_v1`.
- [ ] Confirm `moneymap_sick_v1` is removed after successful migration.
- [ ] Confirm the backup payload reports `storageKey: "moneymap_v1"`.

## Storage safety test

- [ ] Simulate localStorage quota failure if possible.
- [ ] Confirm the app shows a storage warning instead of silently failing.
- [ ] Confirm Settings shows `Save failed` when persistence fails.
- [ ] Export backup immediately after the warning.

## Build notes

- Build ID: `v6.0-phase0-stabilization`
- Current storage key: `moneymap_v1`
- Legacy storage key migrated: `moneymap_sick_v1`
