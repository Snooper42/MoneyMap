MoneyMap QA6 changed-files install

1. Extract this ZIP somewhere outside your repo.
2. Copy the included files into your MoneyMap repo, preserving folders.
3. Do not copy any .git folder from a ZIP into your repo.
4. Run:
   git status
   git add index.html README.md src/css/components.css src/css/mobile.css src/js/utils.js src/js/state.js src/js/storage.js src/js/navigation.js src/js/accounts.js src/js/transactions.js src/js/settings.js src/js/app.js
   git commit -m "Apply MoneyMap QA6 navigation and dialog fixes"
   git push
5. After GitHub Pages deploys, hard refresh and verify the page source uses ?v=qa6-20260530.

Main fixes:
- MoneyMap custom confirmation/input modal instead of the native browser pop-up.
- Safer delete confirmations.
- More reliable desktop, tablet, and mobile navigation rebuilds.
- Cache-busting asset version updated to qa6-20260530.
