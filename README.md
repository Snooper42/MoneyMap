# MoneyMap

MoneyMap is a private, local-first personal finance planner for manual budgets, transactions, accounts, holdings, goals, and net worth snapshots.

## Version

Current build: `v0.6`

## What changed in v0.6

- Added a clearer mobile-first Home experience that explains the current state and the next best action.
- Reworked mobile bottom navigation around Home, Transactions, Review, Accounts, and More.
- Moved secondary pages into a clearer More sheet with quick actions for Import CSV and Quick add.
- Added a card-first Accounts page grouped by Cash, Investments, Property, Valuables, Debt, and Other.
- Improved Investments with a portfolio guide and card-first holdings layout.
- Reduced dense table reliance on mobile.
- Settings displays the active version as `v0.6`.
- Install notes live in `txt/`.
- Patch notes live in `docs/PATCH_NOTES_v0.6.md`.

## File layout

```text
index.html
README.md
docs/
  PATCH_NOTES_v0.4.md
  PATCH_NOTES_v0.6.md
txt/
  v0.4_install.txt
  v0.6_install.txt
src/
  css/
    base.css
    layout.css
    components.css
    mobile.css
    ux-v0.6.css
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
    ux-v0.6.js
```

No backend dependency was added. Data remains local-first in browser storage.

## Run locally

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages deployment

Upload the folder contents to the repo root. Do not upload or replace a `.git` folder from any ZIP.

After replacing files, commit and push:

```bash
git status
git add index.html README.md docs/PATCH_NOTES_v0.6.md txt/v0.6_install.txt src/css/ux-v0.6.css src/js/ux-v0.6.js src/js/state.js src/js/settings.js src/js/investments.js src/js/app.js
git commit -m "Release MoneyMap v0.6 mobile UX refresh"
git push
```

After deployment, open once with:

```text
?mmcache=v0.6
```

Then hard refresh the browser.


## v0.6 mobile-first import refresh

- Adds a Monarch-inspired Home lead card with clear next steps, monthly spend history, category bars, and import history.
- Makes CSV upload feel more automatic with auto-mapping, auto-preview, duplicate detection, transfer hiding, and a one-tap import path.
- Reworks mobile transactions into grouped, combed day cards with quick cleanup filters.
- Refreshes Accounts into larger grouped cards for cash, investments, property, valuables, debt, and other balances.
- Keeps data local in the existing `moneymap_v1` localStorage key.
