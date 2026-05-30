MoneyMap R2.4 Cache Reset Install

Purpose:
- Fix stale Firefox/GitHub Pages cache behavior that can mix old CSS/JS with the current shell.
- Align index.html, state.js, and app.js on the same build id.
- Add a runtime stale-asset guard that reloads once with a cache-busting URL if mixed files are detected.
- Unregister MoneyMap/workbox-style service worker caches if any old PWA cache exists.
- This does not delete MoneyMap localStorage/user finance data.

Build id:
r2-4-cache-reset-20260530

Changed files to replace:
- index.html
- src/js/state.js
- src/js/app.js
- README_R2_4_INSTALL.txt

Install steps:
1. Replace the changed files in your repo.
2. Commit and push.
3. Open the deployed app with this once: ?mmcache=r2-4-cache-reset-20260530
   Example: https://YOUR_SITE_URL/?mmcache=r2-4-cache-reset-20260530
4. In Firefox, press Ctrl+F5 after the page opens.
5. Confirm Settings > Privacy and portability > Build shows:
   Pre-v1 alpha · r2-4-cache-reset-20260530

If the app still appears stuck:
- Open the deployed URL with ?mmcache=r2-4-cache-reset-20260530-TIMESTAMP
- Firefox: Settings > Privacy & Security > Cookies and Site Data > Manage Data, remove the deployed site's cached data only.
- iPhone Safari: Settings > Safari > Advanced > Website Data, remove the deployed site's data only.

Note:
This cache reset is separate from Reset inside MoneyMap. Do not use MoneyMap Reset unless you intend to delete local app data.
