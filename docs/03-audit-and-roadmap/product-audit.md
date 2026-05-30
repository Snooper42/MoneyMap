# Product Audit: MoneyMap v0.1.12

Audit date: 2026-05-30  
Source package: `MoneyMap_v0.1.12_full_no_git.zip`  
Scope: UX, product structure, current features, documentation, and roadmap readiness  
Constraint: no application code changes made during this audit

---

## Executive assessment

MoneyMap is already a substantial local-first personal finance app. The product direction is clear: private, browser-only money tracking for users who want CSV/manual control instead of bank sync.

The strongest areas are:

- Dashboard command-center concept
- Accounts taxonomy and balance workspace
- Weekly Review workflow
- CSV import flow
- Backup/export posture
- Breadth of trackers across budgets, goals, debt, investments, credit, and subscriptions

The main issue is not feature volume. The main issue is stabilization. The app has a strong UX foundation, but it is currently held back by route/view fragility, legacy patch layering, and documentation drift.

---

## Summary rating

| Area | Assessment |
|---|---|
| Product concept | Strong |
| Feature coverage | Strong for v0.1.x |
| Desktop UX | Good, but dense |
| Mobile UX | Promising, but too heavy above the fold |
| Technical structure | Functional but fragile |
| Documentation accuracy before this update | Needed cleanup |
| GitHub Pages readiness | Close, but blocked by stabilization issue |

---

## Critical finding 1: Accounts route visibility bug

After visiting Accounts, the Accounts page can remain visible even when another route is active. This was observed on desktop and mobile. For example, selecting Settings can mark Settings as active in navigation while the main content still shows Accounts.

Likely product-structure cause:

- Accounts appears to be dynamically mounted and styled separately from the normal `.view.active` display contract.
- Accounts shell styling can override the hidden state, so it can remain visible outside its active route.

Impact:

- Settings, History, Rules, and other pages can be visually blocked.
- Mobile navigation becomes misleading.
- Hash routing and active navigation state become unreliable.
- This should be treated as a P0 blocker before public positioning.

Acceptance criterion:

- Only one view is visible at a time.
- The active navigation item, URL hash, and visible page always match.

---

## Critical finding 2: Documentation drift

Before this documentation overhaul, the app reported `v0.1.12`, but README still claimed `v0.1.9`.

Observed documentation issues:

- No clear `v0.1.12` patch note existed.
- `RELEASE_NOTES_v0.1.7.txt` described `v0.1.8`.
- `CHANGELOG.md` had repeated changelog headers and overlapping `v0.1.4` entries.
- `docs/03-audit-and-roadmap/roadmap.md` listed some older `v0.1.x` work as current or incomplete despite the package being `v0.1.12`.
- Release notes described stale CSS/JS cleanup, but the package still contains many old `ux-v*` and desktop/account files even if not loaded.

Impact:

- A GitHub landing page would misrepresent the app if not corrected.
- Public readers would not know what is current, legacy, planned, or incomplete.

---

## Critical finding 3: Patch-layer architecture risk

The app works, but the package still carries many legacy patch files and wrapper layers.

Observed structure:

- Large central `app.js`.
- Multiple `ux-v*` layers still present in the package.
- New canonical Dashboard and Accounts renderers.
- Render bus and router exist, but several behaviors still depend on load order and wrappers.
- Accounts is dynamically injected rather than defined consistently with other route views.

Impact:

- Small visual changes can break routing or view display.
- CSS load order matters too much.
- It is hard to document architecture confidently.
- Public users may hit edge cases that are difficult to trace.

Recommendation:

- Do not rewrite the app yet.
- First consolidate view contracts, active route behavior, and loaded vs legacy file ownership.

---

## UX critique

### Dashboard

The Dashboard is the strongest product surface. It answers:

- What changed?
- Where is money going?
- Am I on track?
- What needs review?
- What recurring charges are coming?

The command-center concept is good. The issue is density. Desktop feels powerful, while mobile becomes heavy and scroll-intensive.

Recommendation:

- Keep the command-center model.
- Reduce the mobile above-the-fold experience to one primary action, two or three summary metrics, and a collapsed secondary action row.

### Accounts

Accounts is visually premium and directionally correct. The expanded categories are a strong differentiator.

The issue is structural, not conceptual.

Recommendation:

- Fix the route/view bug first.
- Keep Accounts as the main balance workspace.
- Keep History focused on snapshots only.

### Transactions

Transactions is functional and information-rich. Search, filters, categories, status, visibility, and row actions are all useful.

Recommendation:

- Keep the dense table for desktop.
- Use card-style edit/review flows on mobile.

### Review

Review is one of the strongest workflows. It gives the app a reason to exist beyond being a static ledger.

Recommendation:

- Put Review near the center of the product story.
- Add faster keyboard and completion-summary workflows later.

### Import

The Import page has the right mental model: choose files, map columns, review import, and then review the week.

Recommendation:

- Describe it conservatively as CSV import with mapping, dedupe-aware behavior, and review.
- Avoid implying perfect compatibility with every bank export.

### Settings and backup

The local-first privacy model is strong, but it increases the importance of backup education.

Recommendation:

- Make backup/export responsibility clear in the README and privacy docs.

---

## Product positioning

Recommended positioning:

> MoneyMap is a private, local-first personal finance dashboard for people who want to track spending, accounts, budgets, goals, debt, investments, and credit manually or by CSV import without bank login, sync, telemetry, or a backend.

Avoid overstating:

- Automatic bank sync
- Cloud account support
- Real-time investment prices
- Backend backup
- Multi-device sync
- Financial advice

---

## Recommended next step

Complete P0 stabilization before adding new features or polishing public screenshots.

The top action is fixing the Accounts route/view visibility bug and then smoke testing every route after visiting Accounts.
