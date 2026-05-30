# MoneyMap

MoneyMap is a private, local-first personal finance planner for manual budgets, transactions, accounts, holdings, goals, and net worth snapshots.

## Version

Current build: `v0.4`

## What changed in v0.4

- Accounts are now grouped into Cash, Investments, Property, Valuables, Debt, and Other.
- Account types now include collectibles, jewelry, precious metals, art, and crypto wallet options.
- The Accounts page has a cleaner category-first layout inspired by modern finance dashboards.
- Investment holdings now render as portfolio cards grouped by asset class.
- Settings displays the active version as `v0.4`.
- Install notes live in `txt/`.
- Patch notes live in `docs/PATCH_NOTES_v0.4.md`.

## File layout

```text
index.html
README.md
docs/
  PATCH_NOTES_v0.4.md
txt/
  v0.4_install.txt
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
git add index.html README.md docs/PATCH_NOTES_v0.4.md txt/v0.4_install.txt src/css/components.css src/js/state.js src/js/settings.js src/js/investments.js src/js/app.js
git commit -m "Release MoneyMap v0.4 account and portfolio cleanup"
git push
```

After deployment, open once with:

```text
?mmcache=v0.4
```

Then hard refresh the browser.
