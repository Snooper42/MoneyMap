MoneyMap R2.1 Global Search Fix
================================

Install method
--------------
Use MoneyMap_R2_1_global_search_changed_files.zip if you are replacing only changed files.
Extract the zip and copy the files over the matching paths in your existing MoneyMap project.

Changed files
-------------
index.html
src/css/components.css
src/js/app.js
src/js/state.js
README_R2_1_INSTALL.txt

What changed
------------
- Fixed the top search box so it now shows visible results instead of silently filtering hidden transaction state.
- Added a global search panel for transactions, categories, accounts, budgets, debts, holdings, goals, recurring items, rules, pages, and commands.
- Added keyboard behavior. Arrow keys move through results, Enter opens the highlighted result, Escape closes the panel.
- Added a "View matching transactions" result that opens the Transactions page with the search applied.
- Improved mobile behavior so search results appear as a tappable panel under the sticky mobile header.
- Updated cache-busting/build version to r2-1-global-search-20260530.

Quick smoke test
----------------
1. Open MoneyMap.
2. Load demo data if needed.
3. Search "groceries" from the top search bar.
4. Confirm that transaction/category/budget results appear.
5. Tap "View matching transactions" and confirm the Transactions page opens filtered to the search.
6. Search "checking" and confirm the account appears.
7. On iPhone, confirm the search panel is readable and closes with Escape, outside tap, or result selection.
