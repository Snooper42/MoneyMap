# MoneyMap v0.9 patch notes

## Focus of this pass
- Bring the **manual Accounts experience** closer to the clean, low-friction reference direction
- Make manual account creation feel faster and more mobile-friendly
- Improve usability without changing the local-first storage model

## What changed

### 1. New Accounts page
- Added a cleaner dedicated **Accounts** page to the main navigation
- Added a simplified top toolbar with:
  - Filters
  - Refresh all
  - Add account
- Added a cleaner **net worth performance** hero card with period selector
- Added a more readable grouped account list
- Added a cleaner **Summary** side card with totals and percent views
- Added CSV export from the Summary card

### 2. Manual account creation refresh
- Reworked the **Add / Edit account** drawer into a cleaner modal workflow
- Simplified the primary form to the minimum required fields first:
  - Name
  - Group
  - Type
  - Balance
- Moved lower-priority fields into **Optional details**:
  - Institution
  - Updated date
  - Net worth include toggle
  - Notes
- Improved the modal header and action layout for desktop and mobile

### 3. Mobile usability improvements
- Accounts layout stacks cleanly on smaller screens
- Add-account flow is full-screen and easier to use on mobile
- Action buttons collapse to single-column layouts on narrow widths
- Group rows and summary cards are easier to scan without horizontal scrolling

## Safety notes
- No backend was added
- Existing localStorage schema remains unchanged
- Existing account, net worth, and other data should remain compatible
- No browser-native alert/confirm popups were added in this pass

## Changed files
- `index.html`
- `src/js/core/app-config.js`
- `src/js/state.js`
- `src/js/settings.js`
- `src/css/ux-v0.9.css`
- `src/js/ux-v0.9.js`
- `docs/PATCH_NOTES_v0.9.md`
- `txt/v0.9_install.txt`
