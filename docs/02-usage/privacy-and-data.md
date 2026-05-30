# Privacy and Data Safety

MoneyMap is local-first. The app runs from static files and stores user data in the browser.

---

## Storage model

Current storage key:

```text
moneymap_v1
```

The app stores data in browser `localStorage` for the current origin.

---

## What stays local

The app is designed around local data:

- Transactions
- Accounts
- Budgets
- Goals
- Debts
- Investment holdings
- Credit score entries
- Rules
- Preferences
- Backup/restore data

---

## What is not included

MoneyMap does not include:

- Bank login
- Plaid or similar bank-sync integration
- Cloud sync
- Backend account storage
- Server-side backup
- Telemetry
- Analytics
- Ads

---

## Backup responsibility

Because the app is local-first, backups matter.

Users should export a backup before:

- Clearing browser data
- Resetting the browser
- Changing computers
- Moving to a different browser
- Testing on a different local URL or port
- Using a different GitHub Pages deployment URL

---

## Data loss risks

Data can be lost if:

- Browser site data is cleared.
- The browser profile is deleted.
- The user switches browsers without exporting/importing backup data.
- The app is opened from a different origin and the user assumes the same data will appear.

---

## Recommended documentation language

Use this wording in public-facing docs:

> MoneyMap stores your data locally in your browser. There is no backend account, cloud sync, or server-side backup. Export a backup before clearing browser data, changing browsers, or moving devices.
