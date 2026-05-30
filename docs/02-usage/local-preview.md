# Local Preview

MoneyMap is a static app. It should be previewed from a local web server rather than by double-clicking `index.html`.

---

## Recommended Windows flow

From the extracted repo folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

Keep the terminal open while testing.

---

## Recommended Mac flow

From the extracted repo folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

Keep the terminal open while testing.

---

## Included launchers

The package includes:

- `tools/local-preview/start_windows_preview.bat`
- `tools/local-preview/start_mac_preview.command`

These are convenience launchers for local preview.

---

## Why the port matters

MoneyMap stores data in browser `localStorage`, which is origin-scoped. These are different storage locations:

- `http://127.0.0.1:8080`
- `http://localhost:8080`
- `http://127.0.0.1:8081`
- A GitHub Pages URL

Use the same URL and port consistently during testing.

---

## Suggested smoke test

1. Open the app at `http://127.0.0.1:8080`.
2. Load demo data or start fresh.
3. Visit Dashboard.
4. Visit Accounts.
5. Visit Settings.
6. Visit History.
7. Visit Review.
8. Confirm the visible page matches the active navigation item and URL hash.
9. Export a backup from Settings.
10. Reload the browser and confirm data persists.

Known issue in the audited build: Accounts can remain visible after navigating away. Treat this as a P0 fix target.
