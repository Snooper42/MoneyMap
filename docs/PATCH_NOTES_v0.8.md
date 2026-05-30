# MoneyMap v0.8 patch notes

## Focus

This release starts the architecture split that will make future MoneyMap work safer. The goal was not a visual redesign. It was to move risk-prone responsibilities out of the large accumulated app/UX patch stack and into smaller, purpose-specific files.

## What changed

### 1. Core configuration split

Added:

- `src/js/core/app-config.js`

This now owns:

- current build ID
- expected build ID
- cache-bust label
- localStorage key reference
- document build marking

`state.js` now reads the storage key and build ID from this config layer while preserving the existing `moneymap_v1` localStorage key.

### 2. Cache guard split

Added:

- `src/js/core/cache-guard.js`

The stale asset / reload banner logic was moved out of `app.js`. This makes the build/cache check easier to audit and prevents future UI patches from fighting stale build constants.

The cache guard now removes the notice when the loaded app build is current.

### 3. Security helper split

Added:

- `src/js/core/security.js`

This adds shared helpers for:

- escaping HTML
- escaping attributes
- normalizing IDs
- safe URL handling
- safe text insertion

This does not rewrite every renderer yet. It establishes the secure shared layer for the next refactor passes.

### 4. Import parser split

Added:

- `src/js/import/parsers.js`

Delimited transaction parsing is now separate from the Home UX layer. It owns:

- delimiter detection
- quoted field handling
- header-row detection
- parsed row generation
- import mapping guesses

Supported delimited exports remain:

- CSV
- TSV
- TXT
- semicolon-delimited exports
- pipe-delimited exports

### 5. Import workflow split

Added:

- `src/js/import/workflow.js`

File filtering, upload handling, fallback account naming, and post-import sorting now live outside the visual UX patch layer.

### 6. App file cleanup

Changed:

- `src/js/app.js`

The old cache guard block was removed from the large app file and replaced by the new core cache guard module.

Changed:

- `src/js/ux-v0.7.js`

The import parsing and upload workflow overrides were removed from the visual UX layer. That file now focuses on Home/import UI presentation instead of low-level parsing.

## Compatibility

- localStorage key remains `moneymap_v1`
- existing backups should remain compatible
- no backend added
- no bank sync added
- no browser-native alert or confirm prompts added

## Changed files

- `README.md`
- `index.html`
- `src/js/state.js`
- `src/js/settings.js`
- `src/js/app.js`
- `src/js/ux-v0.7.js`
- `src/js/ux-v0.7.1.js`
- `src/js/core/app-config.js`
- `src/js/core/security.js`
- `src/js/core/cache-guard.js`
- `src/js/import/parsers.js`
- `src/js/import/workflow.js`
- `src/css/ux-v0.8.css`
- `docs/PATCH_NOTES_v0.8.md`
- `docs/ARCHITECTURE_v0.8.md`
- `txt/v0.8_install.txt`
