# MoneyMap

MoneyMap is a private, local-first personal finance planner.

## QA6 deploy notes

This build is `qa6-20260530` / `v0.10.1-qa6`.

What changed:

- Replaced native browser `confirm()` and `prompt()` dialogs with MoneyMap-styled modals.
- Added safer delete confirmations for accounts, debts, holdings, goals, transactions, rules, saved mappings, backups, and resets.
- Hardened sidebar and mobile navigation so pinned tabs and the More sheet rebuild consistently after every render.
- Added an Accounts route to the stable navigation set.
- Updated cache-busting query strings on all CSS and JavaScript assets so GitHub Pages serves the new files instead of stale browser-cached files.

## File layout

```text 
index.html
README.md
docs/
src/
  css/
    base.css
    layout.css
    components.css
    mobile.css
  js/
    utils.js
    state.js
    storage.js
    navigation.js
    accounts.js
    transactions.js
    budgets.js
    investments.js
    charts.js
    settings.js
    app.js
```

No backend dependency was added. Data remains local-first in browser storage.

## Run locally

Open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages deployment

Upload the folder contents to the repo root. Do not upload or replace the `.git` folder from any ZIP.

After replacing files, commit and push:

```bash
git status
git add index.html README.md src/css/components.css src/css/mobile.css src/js/utils.js src/js/state.js src/js/storage.js src/js/navigation.js src/js/accounts.js src/js/transactions.js src/js/settings.js src/js/app.js
git commit -m "Apply MoneyMap QA6 navigation and dialog fixes"
git push
```

If GitHub Pages still shows the old UI, hard refresh the browser and confirm the page source references `?v=qa6-20260530`.
