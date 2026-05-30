# MoneyMap v0.7 patch notes

## Focus of this pass
- Make the home experience clearer and more actionable on mobile and desktop
- Add a stronger live net-worth snapshot workflow
- Improve net-worth history charting so saved snapshots read better over time
- Reduce transaction import friction and expand compatibility for common delimited exports

## What changed

### 1. New Home dashboard
- Replaced the cluttered overview feel with a simpler Home dashboard layer
- Added a clearer hero state with one primary next action
- Added a prominent **Net worth right now** card
- Added a cleaner **6 month spending history** chart
- Added a focused **What needs attention** section
- Added a cleaner **Recent uploads** history panel

### 2. Net worth snapshot workflow
- Added a direct **Save today's snapshot** action from Home
- Improved the net-worth chart behavior
- Chart now shows saved history and a live point for today when current balances differ
- Labeling adapts better across shorter and longer time ranges
- Snapshot history stays locked while live balances can continue changing

### 3. Import flow simplification
- Added a simpler import hero and status panel
- Expanded supported file types to common delimited exports:
  - CSV
  - TSV
  - TXT exports
  - semicolon-delimited exports
  - pipe-delimited exports
- Added smarter delimiter detection instead of only plain comma CSV
- Added smarter header-row detection for messy exports
- Auto-infers an account label from the filename when account columns are missing
- Keeps the automatic mapping/review flow and pushes the user forward faster

### 4. Lower-friction cleanup
- Imported transactions are re-sorted by date after commit
- Merchant cleanup and saved mappings are surfaced more clearly in the UI
- Import status better highlights new rows and duplicates skipped

## Changed files
- `index.html`
- `src/js/state.js`
- `src/js/settings.js`
- `src/css/ux-v0.7.css`
- `src/js/ux-v0.7.js`

## Notes
- This patch is layered on top of the current local-first architecture
- Data shape remains compatible with the existing localStorage workspace
- No backend was added
