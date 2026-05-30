# MoneyMap

MoneyMap is a private, local-first personal finance planner for manual budgets, transactions, accounts, holdings, goals, and net worth snapshots.

## Version

Current build: `v0.5`

## What changed in v0.5

- Added a clearer mobile-first Home experience that explains the current state and the next best action.
- Reworked mobile bottom navigation around Home, Transactions, Review, Accounts, and More.
- Moved secondary pages into a clearer More sheet with quick actions for Import CSV and Quick add.
- Added a card-first Accounts page grouped by Cash, Investments, Property, Valuables, Debt, and Other.
- Improved Investments with a portfolio guide and card-first holdings layout.
- Reduced dense table reliance on mobile.
- Settings displays the active version as `v0.5`.
- Install notes live in `txt/`.
- Patch notes live in `docs/PATCH_NOTES_v0.5.md`.

## File layout

```text
index.html
README.md
docs/
  PATCH_NOTES_v0.4.md
  PATCH_NOTES_v0.5.md
txt/
  v0.4_install.txt
  v0.5_install.txt
src/
  css/
    base.css
    layout.css
    components.css
    mobile.css
    ux-v0.5.css
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
    ux-v0.5.js
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
git add index.html README.md docs/PATCH_NOTES_v0.5.md txt/v0.5_install.txt src/css/ux-v0.5.css src/js/ux-v0.5.js src/js/state.js src/js/settings.js src/js/investments.js src/js/app.js
git commit -m "Release MoneyMap v0.5 mobile UX refresh"
git push
```

After deployment, open once with:

```text
?mmcache=v0.5
```

Then hard refresh the browser.
