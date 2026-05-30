# MoneyMap Refactor 2 install notes

Build: `r2-action-system-20260530`

Replace these files in your GitHub Pages repo:

```text
index.html
src/css/components.css
src/js/app.js
src/js/state.js
src/js/utils.js
README_R2_INSTALL.txt
```

What changed:

- Added a reusable app-native safe action dialog system.
- Replaced destructive browser-style confirmations with item-specific MoneyMap confirmations.
- Added clearer delete copy for accounts, debts, holdings, net worth snapshots, goals, transactions, credit logs, saved CSV mappings, and automation rules.
- Added safer workspace confirmations for demo mode, start fresh, backup import, and reset.
- Reset now requires typing `DELETE` before the destructive button activates.
- Destructive modals now show affected records, consequences, safe focus behavior, and mobile bottom-sheet styling.
- Updated cache-busting to `r2-action-system-20260530`.

Recommended test sequence:

1. Deploy or open locally.
2. On iPhone, delete a transaction and confirm the custom bottom-sheet modal appears.
3. Delete an account and confirm the modal names the account and shows balance/type details.
4. Try Settings → Backup → Reset everything and confirm the Delete button stays disabled until `DELETE` is typed.
5. Tap Demo with existing data and confirm it warns before replacing the workspace.
