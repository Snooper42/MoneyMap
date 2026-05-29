# MoneyMap Phase 0 Release Checklist

Use this before pushing the Phase 0 build to GitHub Pages.

## Smoke test

- [X] Open the app in a clean browser profile with no existing MoneyMap data.
- [X] Confirm first-run screen appears.
- [X] Choose Demo mode and confirm dashboard renders.
- [X] Export a backup JSON from Settings.
- [X] Export a monthly report from dashboard or command palette.
- [X] Export a weekly report from Settings.
- [X] Reset all local data, then confirm first-run appears again.
- [X] Import the sample CSV and confirm transaction rows appear.
- [X] Edit one transaction and confirm the change survives page refresh.
- [X] Add one budget and confirm the dashboard updates.
- [X] Switch light/dark theme and confirm preference persists.
- [X] Test at mobile width below 760px.

## Migration test

- [X] In DevTools, create a legacy `localStorage` item named `moneymap_sick_v1` with a valid backup state.
- [X] Reload the app.
- [X] Confirm the app migrates data to `moneymap_v1`.
- [X] Confirm `moneymap_sick_v1` is removed after successful migration.
- [X] Confirm the backup payload reports `storageKey: "moneymap_v1"`.

## Storage safety test

- [X] Simulate localStorage quota failure if possible.
- [X] Confirm the app shows a storage warning instead of silently failing.
- [X] Confirm Settings shows `Save failed` when persistence fails.
- [X] Export backup immediately after the warning.

## Build notes

- Build ID: `v6.0-phase0-stabilization`
- Current storage key: `moneymap_v1`
- Legacy storage key migrated: `moneymap_sick_v1`
