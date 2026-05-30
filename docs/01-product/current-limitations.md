# Current Limitations

This document keeps the public product promise grounded in what the audited `v0.1.12` app currently does.

---

## Release-blocking issue

The Accounts view has a route/view visibility bug. After visiting Accounts, the Accounts page can remain visible when another route is selected. The active navigation item may change, but the main visible content can remain Accounts.

This should be fixed before the app is positioned as stable.

Expected behavior:

- Only one view should be visible at a time.
- The visible view should match the active navigation state.
- The visible view should match the current URL hash.

---

## Product limitations

MoneyMap currently does **not** provide:

- Bank login
- Plaid-style account sync
- Cloud sync
- Backend storage
- Multi-device user accounts
- Real-time investment quotes
- Financial advice
- Telemetry
- Analytics
- Ads

---

## Data limitations

MoneyMap stores data in browser `localStorage` under the key `moneymap_v1`.

Important consequences:

- Clearing browser site data can erase the workspace.
- Changing browsers or computers will not move data automatically.
- Running the app from a different local origin or port may create a separate browser storage location.
- Backups are user-managed.

---

## Documentation limitations

The original uploaded package contained documentation drift:

- The app identified as `v0.1.12`, while the previous README still referenced `v0.1.9`.
- Some legacy release note files had mismatched names and contents.
- Several older patch-layer files remained in the package even when newer canonical UI files existed.

The organized documentation in this package corrects the public-facing docs, but it does not change application behavior.
