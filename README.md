# MoneyMap

**Private, local-first personal finance tracking. No bank login, no sync, no backend.**

MoneyMap is a static browser app for tracking spending, accounts, budgets, goals, debt, investments, credit scores, subscriptions, rules, and review workflows from local data. It is designed for people who prefer manual control or CSV import over bank-connected finance apps.

Current audited build: `v0.1.12`  
Storage key: `moneymap_v1`  
Runtime model: static files + browser `localStorage`

---

## Current status

MoneyMap is a feature-rich pre-1.0 app. The core product direction is strong, but the current build should be treated as an active development release rather than a production-stable public finance tool.

The most important audit finding is a route/view visibility issue involving the Accounts page. After visiting Accounts, the Accounts view can remain visible when another route is selected. This should be fixed before the app is positioned as stable.

See the full audit in [`docs/03-audit-and-roadmap/product-audit.md`](docs/03-audit-and-roadmap/product-audit.md).

---

## What MoneyMap does today

| Area | Current capability |
|---|---|
| Dashboard | Command-center overview for net worth, cash flow, review status, budgets, spending, accounts, goals, debt, recurring charges, and recent activity |
| Transactions | Manual transaction tracking, filtering, categorization, visibility controls, and transaction editing |
| CSV import | Local CSV workflow with file selection, column mapping, review, and duplicate-aware import behavior |
| Weekly Review | Queue-based review workflow for merchant cleanup, category approval, rules, and week closure |
| Accounts | Manual balances, expanded real-world account taxonomy, assets vs liabilities, category filters, and net-worth snapshots |
| Budgets | Monthly category limits with progress and pressure indicators |
| Subscriptions | Recurring charge tracking and upcoming recurring spend context |
| Debt | Manual debt tracking with payoff-oriented views |
| Investments | Manual holdings and allocation tracking |
| Credit | Manual score history with bureau/source tracking |
| Goals | Savings and payoff targets with progress tracking |
| Rules | Merchant/category cleanup rules and transfer visibility behavior |
| Settings | Local backup/export, restore, preferences, and data management |

---

## What MoneyMap does not do

MoneyMap currently does **not** provide bank login, cloud sync, backend storage, multi-device account login, real-time investment quotes, financial advice, telemetry, analytics, or ads.

This is intentional. The app is built around local-first control and user-owned exports.

---

## Data and privacy model

MoneyMap stores app data in the browser under the `localStorage` key `moneymap_v1`.

Important implications:

- Data stays on the device where the app is used.
- Clearing browser site data can erase the workspace.
- Switching browsers or computers will not carry data over automatically.
- Exporting backups is the user’s responsibility.
- The app should be previewed on a consistent local origin and port to avoid creating separate browser storage locations.

See [`docs/02-usage/privacy-and-data.md`](docs/02-usage/privacy-and-data.md).

---

## Local preview

From the repo root, run:

```bash
python -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

Keep the terminal open while previewing. See [`docs/02-usage/local-preview.md`](docs/02-usage/local-preview.md) for the full preview notes.

---

## Documentation map

| Section | Location |
|---|---|
| Documentation index | [`docs/README.md`](docs/README.md) |
| Product overview | [`docs/01-product/overview.md`](docs/01-product/overview.md) |
| Feature inventory | [`docs/01-product/features.md`](docs/01-product/features.md) |
| Current limitations | [`docs/01-product/current-limitations.md`](docs/01-product/current-limitations.md) |
| Local preview | [`docs/02-usage/local-preview.md`](docs/02-usage/local-preview.md) |
| Privacy and data safety | [`docs/02-usage/privacy-and-data.md`](docs/02-usage/privacy-and-data.md) |
| CSV import | [`docs/02-usage/csv-import.md`](docs/02-usage/csv-import.md) |
| Product audit | [`docs/03-audit-and-roadmap/product-audit.md`](docs/03-audit-and-roadmap/product-audit.md) |
| Roadmap | [`docs/03-audit-and-roadmap/roadmap.md`](docs/03-audit-and-roadmap/roadmap.md) |
| Changelog | [`docs/04-release-history/changelog.md`](docs/04-release-history/changelog.md) |
| Patch notes | [`patch-notes/README.md`](patch-notes/README.md) |
| Repo organization | [`docs/05-repo/organization.md`](docs/05-repo/organization.md) |

---

## Repository layout

```text
MoneyMap/
  README.md
  index.html
  src/
  docs/
    01-product/
    02-usage/
    03-audit-and-roadmap/
    04-release-history/
    05-repo/
  patch-notes/
    releases/
  tools/
    local-preview/
```
