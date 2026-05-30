# MoneyMap

Local-first, privacy-first manual finance app.

Current build: `v0.9.6`

## Local testing

```bash
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## v0.9.6 focus — Mobile-first UX pass

- **Transaction form redesign** — Spend/Income toggle replaces "negative for spending". Type a positive number, pick the type. Correct on mobile.
- **iOS input zoom fix** — All inputs are font-size 16px on mobile, preventing the Safari zoom-on-focus bug.
- **Mobile nav** — Bottom nav now has an "Add" button instead of "Import". Import is still accessible via the topbar and command palette (⌘K).
- **Form polish** — `inputmode="decimal"` on all money fields, `autocapitalize="words"` on description/name fields, consistent drawer action layout.
- **Spend-map extraction** — The Overview spend category list IIFE (~155 lines) extracted from `app.js` to `src/js/ui/spend-map.js`. app.js drops from 3,905 to ~3,752 lines.
- **Build label bug fix** — Settings page build label was hardcoded to `v0.9.4`. Now reads from `APP_BUILD_ID`.
- Storage key unchanged: `moneymap_v1`

## Release files

- Full clean zip: `MoneyMap_v0.9.6_full_no_git.zip`
- Changed files zip: `MoneyMap_v0.9.6_changed_files.zip`
- Patch notes: `docs/PATCH_NOTES_v0.9.6.md`
- Install notes: `txt/v0.9.6_install.txt`

## Privacy model

MoneyMap has no backend. Data lives in browser localStorage. Export a backup before switching browsers or clearing site data.
