# MoneyMap v0.9.6 patch notes

## Focus: mobile-first UX pass + spend-map extraction

---

## What changed

### Transaction form — Spend / Income toggle

**Before:** Users had to type negative amounts for expenses (`-47.50`). No label, no feedback. Confusing for anyone who hasn't used the app before. Terrible on mobile.

**After:** A segmented Spend / Income toggle at the top of the form. Users type a positive amount and pick the type. The sign is applied on save.

- Spend → stored as negative (existing behaviour preserved)
- Income → stored as positive (existing behaviour preserved)
- Editing a transaction: toggle pre-selects based on the stored sign
- `inputmode="decimal"` on the amount field triggers the numeric keypad with a decimal point on iOS and Android
- Description field gets `autocapitalize="words"` and `autocorrect="off"` — merchant names capitalize correctly without autocorrect mangling them

### iOS input zoom fix

Safari (iOS) zooms the page when focusing any input with `font-size < 16px`. This was happening on every drawer form.

Fix: all inputs, selects, and textareas get `font-size: 16px !important` on viewports ≤ 1180px. Labels and helper text are unaffected.

### Mobile nav — "Add" replaces "Import"

The bottom navigation previously showed: Overview · Import · Review · Net worth · Settings.

For a first-time mobile user, "Import" and "Review" are empty-state dead ends. "Import" in particular implies a CSV workflow that most people won't start with on a phone.

New nav: Overview · **Add** · Review · Net worth · Settings.

- **Add** opens the quick-add menu (transaction, account, budget, goal, debt, holding)
- Import is still in the topbar, command palette (⌘K), and sidebar
- The Add button has a distinct accent-color tint to make it the obvious first tap

### Budget and goal form polish

- Budget "Monthly limit" field: `inputmode="decimal"` and money-input layout with `$` prefix
- Budget: Delete button added to edit flow
- Goal "Target" and "Current" fields: `inputmode="decimal"` and money-input layout
- Goal name / type: `autocapitalize="words"`
- Both forms get consistent `drawer-actions` layout with 46px-minimum-height buttons

### Drawer action layout

All drawer forms now use a consistent `drawer-actions` footer:
- Primary action button takes full width (order: first)
- Cancel and Delete share the remaining space
- On narrow screens (< 480px), all buttons stack vertically

### Spend-map extraction

The R2.5 IIFE (Overview spending category list renderer, ~155 lines) has been moved from `src/js/app.js` to `src/js/ui/spend-map.js`.

- `app.js` drops from 3,905 lines to ~3,752 lines
- The code is identical — this is a pure file-location move
- Load position: after `shared-helpers.js`, before UX patch layers
- A stub comment replaces the extracted block in app.js

### Build label bug fix

`renderSettings()` in `settings.js` had the build label hardcoded to `'v0.9.4'` instead of reading from `APP_BUILD_ID`. Fixed.

---

## Safety checklist

- `localStorage` key unchanged: `moneymap_v1`
- No state schema changes
- Amount sign convention unchanged: negative = expense, positive = income
- spend-map.js is behaviour-identical to the extracted IIFE
- All existing transactions display correctly (amount sign unchanged)
- Import CSV still accessible via topbar button and ⌘K

---

## Changed files

```
index.html
README.md
src/js/core/app-config.js
src/js/state.js
src/js/settings.js       — transaction / budget / goal forms, build label fix
src/js/transactions.js   — saveQuickTransaction, setTxType, getSelectedTxType
src/js/navigation.js     — buildMobileNav (Add replaces Import)
src/js/app.js            — R2.5 IIFE replaced with stub comment
src/js/ui/spend-map.js   ← NEW (extracted from app.js)
src/css/ux-v0.9.6.css    ← NEW (iOS fix, toggle styles, form polish)
docs/PATCH_NOTES_v0.9.6.md ← NEW
txt/v0.9.6_install.txt   ← NEW
```
