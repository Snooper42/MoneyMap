# MoneyMap v0.4 Patch Notes

## Focus

v0.4 improves the manual balance experience and cleans up portfolio tracking. The goal is to make Accounts and Investments feel more like a polished finance app while keeping the app local-first and manual.

## Accounts

- Rebuilt the Accounts page around account groups.
- Added groups for Cash, Investments, Property, Valuables, Debt, and Other.
- Added support for account types such as Collectibles, Jewelry, Precious Metals, Art, Crypto Wallet, and other assets.
- Added grouped account tabs and category summary chips.
- Simplified account cards with clearer balance, type, group, inclusion state, and actions.
- Updated the Overview account panel to show grouped balances instead of only a flat account list.

## Investments

- Rebuilt the holdings display as cleaner portfolio cards.
- Grouped holdings by normalized asset class.
- Added per-holding value, gain/loss, weight, quantity, price, and inclusion status.
- Hid the dense holdings table on mobile and desktop when the cleaner card view is available.
- Kept the legacy table data populated for export and fallback behavior.
- Improved portfolio notes around double-counting and manual pricing.

## Versioning and files

- Updated the app build/version label to v0.4.
- Settings now displays v0.4 in the Build row.
- Updated cache-busting references to v0.4.
- New install notes are stored in the txt folder.
- Patch notes are stored in docs/PATCH_NOTES_v0.4.md.

## Data compatibility

- No localStorage reset is required.
- Existing account data remains compatible.
- Account groups are derived from existing Type and Name values.
- Existing holdings remain compatible.
