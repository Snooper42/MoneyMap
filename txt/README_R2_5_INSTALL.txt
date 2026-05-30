MoneyMap R2.5 Spending Map Precision
Build: r2-5-spend-map-precision-20260530

Purpose
- Fixes the dashboard Spending map feeling imprecise or showing the wrong category.
- Replaces fragile canvas hover/tap hit-testing with exact clickable DOM rows.
- Keeps category totals aligned with the transaction filter opened from the dashboard.

Replace these files if using the changed-files ZIP:
- index.html
- src/css/components.css
- src/js/app.js
- src/js/state.js

What changed
- Spending map is now a real list of category rows instead of a canvas chart.
- Each row is a precise tap target with category, transaction count, share, and amount.
- Tapping a row opens Transactions filtered to:
  - current month
  - selected category
  - visible transactions only
  - spending only
- Category names are normalized for whitespace/case and Income/Transfers aliases are excluded from spending.
- Dashboard top categories and spending totals now use the same normalized category logic.
- Build/cache version updated to r2-5-spend-map-precision-20260530.

After copying
1. Deploy the changed files.
2. Open the app once with:
   ?mmcache=r2-5-spend-map-precision-20260530
3. Hard refresh:
   Windows/Linux: Ctrl+F5
   Mac: Cmd+Shift+R

Validation checklist
- Dashboard Spending map shows rows, not canvas hover behavior.
- Tapping Groceries opens Transactions with category Groceries.
- The transaction filter month stays on the current month.
- The amount in the Spending map matches the filtered transaction set.
- Income and Transfers do not appear in Spending map.
