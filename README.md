# MoneyMap

MoneyMap is a private, local-first personal finance planner.

## v0.10.0-alpha structural split

This milestone separates the original single-file app into a small project structure:

```text
index.html
src/css/styles.css
src/js/app.js
```

No product redesign was intended in this step. The goal is to make future UI, mobile, accounts, charts, storage, and navigation work safer.

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
