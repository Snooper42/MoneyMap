# MoneyMap v0.9.2 patch notes

## Focus of this pass
- Treat the app as still pre-1.0 and keep iterating conservatively
- Compact the Add/Edit Account experience without removing utility
- Reduce wasted space in the account editor on desktop and mobile

## What changed

### Compact account editor
- Added a final-loaded v0.9.2 account drawer layer
- Reduced the account drawer width and overall height on desktop
- Reduced header size, title scale, and header padding
- Made the primary account fields much denser
- Kept the useful account group selector but made it smaller
- Combined Type, Balance, and Net worth inclusion into a compact row
- Kept Optional details, but made the section tighter
- Shortened the sticky footer action bar

### Safety
- No localStorage schema changes
- The same account save fields are still used:
  - `acctName`
  - `acctInstitution`
  - `acctType`
  - `acctBalance`
  - `acctUpdated`
  - `acctInclude`
  - `acctNotes`
- Existing accounts remain compatible
- No browser-native alert or confirm calls were added

## Changed files
- `index.html`
- `src/js/core/app-config.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/ux-v0.9.2.js`
- `src/css/ux-v0.9.2.css`
- `docs/PATCH_NOTES_v0.9.2.md`
- `txt/v0.9.2_install.txt`
