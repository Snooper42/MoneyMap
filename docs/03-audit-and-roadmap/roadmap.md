# MoneyMap Roadmap

MoneyMap is a local-first, privacy-first personal finance app. The roadmap below is based on the v0.1.12 product audit and is organized by priority, not by ambition.

---

## P0 — Stabilize the current release

These items should be completed before presenting the app as stable.

- [ ] Fix the Accounts view visibility and routing issue.
- [ ] Confirm that only one route view is visible at a time.
- [ ] Smoke test all routes after visiting Accounts: Dashboard, Accounts, Transactions, Budgets, Review, Import, History, Subscriptions, Debt, Investments, Credit, Goals, Rules, and Settings.
- [ ] Confirm browser back/forward behavior across all major views.
- [ ] Confirm that Settings, History, Rules, and Review are not visually blocked by dynamically mounted Accounts content.
- [ ] Align all version labels with `v0.1.12`.
- [ ] Keep app metadata, README, changelog, roadmap, and patch notes in sync.
- [ ] Decide whether old patch-layer source files are active, legacy, or removable.
- [ ] Add a release checklist for every future package.

Acceptance standard: the active navigation item, URL hash, and visible page must always agree.

---

## P1 — UX polish

- [ ] Reduce mobile Dashboard density above the fold.
- [ ] Keep one primary mobile action visible and move secondary actions into a compact row or sheet.
- [ ] Clarify Accounts vs History in copy and navigation.
- [ ] Tighten Transactions on mobile with card-style review/edit behavior instead of table-like density.
- [ ] Improve empty states for first account setup, first CSV import, first backup, and first review queue.
- [ ] Standardize icon usage across sidebar, quick actions, mobile nav, and account taxonomy.
- [ ] Rework post-onboarding topbar actions so Start and Demo do not feel like permanent primary actions.

---

## P2 — Documentation and public trust

- [x] Convert legacy `.txt` patch notes into Markdown.
- [x] Move patch notes into a dedicated `Patch Notes` folder.
- [x] Replace the stale README with an accurate current-state landing page.
- [x] Add an audit document that candidly explains product status and risks.
- [x] Add feature, local preview, privacy, and CSV import documentation.
- [ ] Add screenshots or GIFs for the Dashboard, Review, Import, and Accounts workflows.
- [ ] Add a release validation checklist.
- [ ] Add a known limitations section to every public release note.
- [ ] Keep GitHub Pages copy limited to features that exist in the current app.

---

## P3 — Architecture consolidation

- [ ] Consolidate patch-layer CSS into canonical layers.
- [ ] Consolidate patch-layer JavaScript wrappers into explicit modules.
- [ ] Document the route/view contract and enforce it consistently.
- [ ] Ensure dynamically mounted views follow the same `.view.active` visibility contract as static views.
- [ ] Reduce reliance on wrapper load order.
- [ ] Keep `window.MoneyMap` as a public namespace only for stable, documented APIs.
- [ ] Add a simple architecture map after consolidation is complete.

---

## P4 — Feature improvements

### Import

- [ ] Saved import profiles by bank or export format.
- [ ] Better duplicate detection with fuzzy merchant matching.
- [ ] Import history with reprocess/revert options.
- [ ] Multi-file import review.
- [ ] Clearer import error states and skipped-row summaries.

### Review

- [ ] Faster keyboard workflow for approving, skipping, and editing transactions.
- [ ] Better rule recommendations from repeated manual category choices.
- [ ] Review completion summary with changes made and remaining queue.

### Budgets and spending

- [ ] Budget health score.
- [ ] Unusual spending flags based on rolling category averages.
- [ ] Weekly spending sparklines.
- [ ] Better budget pressure sorting and prioritization.

### Accounts and net worth

- [ ] More explicit account inclusion/exclusion controls.
- [ ] Snapshot comparison summaries.
- [ ] Better account-category onboarding.
- [ ] Exportable net-worth history.

### Goals and planning

- [ ] Goal contribution calculator.
- [ ] Sinking fund association between accounts and goals.
- [ ] Goal progress history.
- [ ] Annual net-worth projection.

### Debt

- [ ] Clearer snowball and avalanche scenario comparison.
- [ ] Payoff celebration and payoff-date milestones.
- [ ] Debt-to-income and minimum-payment context.

### Investments

- [ ] Manual allocation targets.
- [ ] Drift indicators.
- [ ] CSV import for holdings, if the local-first model remains intact.

---

## P5 — Future platform work

- [ ] SVG/DOM chart overhaul for better accessibility and mobile interaction.
- [ ] Offline-first PWA support.
- [ ] Install prompt and app manifest.
- [ ] Backup reminder system.
- [ ] Restore validation and backup metadata preview.
- [ ] Stable public API after the architecture is consolidated.

---

## Not currently planned

These are intentionally outside the current product direction:

- Bank sync
- Backend account system
- Cloud sync
- Plaid integration
- Ads or analytics
- Real-time brokerage quotes
- Native app before the web app stabilizes
- Framework rewrite before core architecture consolidation
