MoneyMap
========

MoneyMap is a private, local-first personal finance budget planner web app. It is designed to help track transactions, budgets, recurring charges, goals, debts, net worth, credit history, and financial reviews without requiring a backend server.

Current Release
---------------

Build: v6.1-phase0-complete

Phase 0 focused on stabilization, storage safety, backup reliability, and release readiness.

Project Status
--------------

MoneyMap is currently a static web app hosted through GitHub Pages. The app runs in the browser and stores user data locally on the device.

Core Features
-------------

- Personal finance dashboard
- CSV transaction import
- Transaction review workflow
- Merchant cleanup automation
- Budget tracking
- Recurring charge detection
- Rule-based transaction cleanup
- Goals tracking
- Debt tracking
- Net worth tracking
- Credit score history
- Backup and restore tools
- Light and dark themes
- Mobile-friendly layout

Privacy Model
-------------

MoneyMap is local-first.

- No backend server is required
- No bank login is required
- No account registration is required
- Data is stored in the browser
- Backups can be exported manually by the user

Important: because data is stored in the browser, users should export backups regularly. Clearing browser data, changing browsers, or using a different device may remove local MoneyMap data unless a backup has been saved.

Repository Structure
--------------------

Recommended structure:

index.html
README.txt
docs/
  phase-0-release-checklist.md
  phase-0-patch-notes.md

The live GitHub Pages app uses the root index.html file.

Phase 0 Changes
---------------

Phase 0 completed the following stabilization work:

- Fixed missing export helper references
- Renamed the storage key from moneymap_sick_v1 to moneymap_v1
- Added legacy storage migration
- Added stronger localStorage failure handling
- Added persistent storage warning thresholds
- Added backup-center fallback behavior when saving fails
- Standardized app build identity
- Added final release checklist
- Added merchant cleanup automation improvements

Storage Safety
--------------

MoneyMap now warns users when local browser storage grows too large.

Storage thresholds:

- 2 MB: backup recommended
- 4 MB: near browser limit
- 5 MB: danger threshold
- Save failure: export backup immediately

If saving fails, MoneyMap opens the backup center and warns the user to export a backup.

Release Checklist
-----------------

Before pushing a new release to GitHub Pages:

[ ] Open app fresh with no local data
[ ] Load demo data
[ ] Import sample CSV
[ ] Save budget
[ ] Edit transaction
[ ] Export backup
[ ] Restore backup
[ ] Export monthly report
[ ] Test mobile width
[ ] Test light/dark mode

Deployment
----------

To deploy:

1. Rename the latest patched HTML file to index.html.
2. Upload it to the root of the GitHub repository.
3. Commit the change.
4. Confirm GitHub Pages updates successfully.
5. Run the release checklist against the live site.

Suggested commit message:

Complete Phase 0 stabilization

Development Roadmap
-------------------

Recommended next phases:

Phase 1: Split the single HTML file into a maintainable project structure.
Phase 2: Move larger data storage from localStorage to IndexedDB.
Phase 3: Improve CSV import profiles and duplicate handling.
Phase 4: Add deeper Monarch-style budgeting and review workflows.
Phase 5: Add optional encryption, app lock, and stronger privacy controls.
Phase 6: Add PWA support and deployment automation.

Known Limitations
-----------------

- The app is currently a single-file static app.
- Data is browser-local, so backups are critical.
- There is no multi-device sync.
- There is no direct bank connection.
- Merchant cleanup is automated but not perfect for every transaction format.

License
-------

Add your preferred license here, such as MIT, private use only, or all rights reserved.
