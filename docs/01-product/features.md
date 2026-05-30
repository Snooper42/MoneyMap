# Feature Inventory

This document describes what the audited `v0.1.12` app currently presents to users.

---

## Product model

MoneyMap is a local-first personal finance dashboard. It works from manual data entry, demo data, and CSV imports. The app avoids bank login, backend storage, cloud sync, telemetry, analytics, and ads.

---

## Dashboard

The Dashboard is the main command center. It surfaces net worth, cash flow, spending, budget pressure, review status, accounts, goals, debt, recurring charges, and recent activity.

Current strengths:

- Strong executive-summary layout.
- Clear local-first positioning.
- Useful quick actions.
- Connects users to Review, Import, Accounts, Snapshot, Backup, and Add flows.

Current critique:

- Desktop is feature-rich but dense.
- Mobile has too much above the fold.
- The app should prioritize one primary action and a smaller summary set on small screens.

---

## Accounts

Accounts is the main balance and net-worth workspace.

Current capabilities:

- Manual account balances.
- Asset and liability grouping.
- Expanded account taxonomy.
- Category filters.
- Net-worth summary.
- Snapshot-oriented account history.

Current taxonomy direction:

- Cash
- Checking
- Savings
- Money market
- CDs
- Investments
- Retirement
- Property
- Vehicles
- Collectibles
- Jewelry
- Credit cards
- Mortgage
- Auto loans
- Student loans
- Personal loans
- Other assets
- Other debt

Current critique:

- The visual direction is strong.
- The route/view behavior needs stabilization because Accounts can remain visible after leaving the route.

---

## Transactions

Transactions is the main ledger surface.

Current capabilities:

- Manual transaction tracking.
- Filtering and search.
- Category selection.
- Review status.
- Transfer visibility behavior.
- Transaction editing.

Current critique:

- Desktop table density is acceptable.
- Mobile needs a more card-oriented edit and review experience.

---

## Weekly Review

Weekly Review is one of MoneyMap’s strongest product workflows.

Current capabilities:

- Queue-based review.
- Merchant cleanup.
- Category approval.
- Rule improvement entry point.
- Approve current week and approve visible actions.

Current critique:

- Review should be central in public positioning because it makes the app more useful than a static ledger.
- The app should eventually add a completion summary and faster keyboard workflow.

---

## Import

Import supports a local CSV workflow.

Current capabilities:

- Select CSV files locally.
- Map columns.
- Review import results.
- Move imported transactions into the review workflow.

Current critique:

- Documentation should describe this as CSV import with mapping and review, not universal bank compatibility.
- Future work should add saved import profiles, better duplicate detection, import history, and clearer skipped-row summaries.

---

## Budgets

Budgets supports category limits and progress visibility.

Current capabilities:

- Monthly category budget tracking.
- Progress and pressure context.
- Dashboard budget summaries.

Current critique:

- Budget health scoring would make the surface more actionable.

---

## Subscriptions

Subscriptions tracks recurring charges and upcoming recurring spend context.

Current critique:

- Useful as a dashboard card and standalone section.
- Future work should improve detection confidence and upcoming-charge review.

---

## Debt

Debt tracks manual payoff-oriented debt data.

Current capabilities:

- Debt balances.
- Payoff-oriented views.
- Dashboard debt snapshot.

Future opportunity:

- Better snowball vs avalanche comparison.
- Payoff dates and milestone moments.

---

## Investments

Investments is a manual holdings and allocation tracker.

Current limitation:

- No live quotes or brokerage sync.

Future opportunity:

- Manual allocation targets.
- Drift indicators.
- Optional local CSV import for holdings.

---

## Credit

Credit supports manual credit score history.

Current capabilities:

- Manual score entry.
- Multi-source or bureau-style tracking.
- Trend context.

---

## Goals

Goals tracks savings and payoff targets.

Future opportunity:

- Monthly contribution calculator.
- Sinking fund account linkage.
- Goal progress history.

---

## Rules

Rules support merchant/category cleanup and transaction handling behavior.

Current opportunity:

- Rules should become more recommendation-driven after repeated manual category choices.

---

## Settings and backups

Settings supports local data management, backup/export, restore, and preferences.

Current critique:

- Backup/export needs strong documentation because the app is local-first.
- Users must understand that clearing browser storage can delete the workspace.
