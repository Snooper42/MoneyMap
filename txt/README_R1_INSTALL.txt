MoneyMap Refactor 1 install notes

Replace these files in your repo with the versions from this zip:

- index.html
- src/js/state.js
- src/js/app.js

Then commit with:

  git add index.html src/js/state.js src/js/app.js README_R1_INSTALL.txt
  git commit -m "refactor: rebuild mobile app shell navigation"
  git push

What changed:

- iPhone bottom navigation is fixed to Dashboard, Accounts, Transactions, Budgets, More.
- More opens secondary pages and tools.
- The active page is highlighted in the bottom nav and More sheet.
- Mobile uses a sticky page header with the current page title and one primary action.
- Desktop sidebar remains visible on large screens.
- Horizontal scrolling is locked down on mobile.

Suggested test on iPhone:

1. Open Dashboard, Accounts, Transactions, and Budgets from the bottom nav.
2. Tap More and open Review, Import CSV, Net worth, Goals, and Settings.
3. Confirm there is no sideways scrolling.
4. Confirm the active page is obvious.
5. Confirm the top mobile header always shows where you are.
