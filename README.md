# MoneyMap

MoneyMap is a private, local-first personal finance planner.

## v0.10.0-alpha structural split

This milestone continues the migration from a single-file app into a GitHub Pages-compatible static project.

```text
index.html
README.md
docs/
  v0.10.0-alpha-notes.md
  v0.10.0-alpha-split-migration.md
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

## GitHub Pages

Upload the whole folder contents to the repo root. GitHub Pages should still serve `index.html`.
