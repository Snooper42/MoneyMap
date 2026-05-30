MoneyMap R2.3 hard scroll unlock

Replace these files in your deployed project:

- index.html
- src/css/components.css
- src/css/mobile.css
- src/js/app.js

Then hard refresh Firefox with Ctrl+F5.

What changed:

- Removed the remaining mobile/body scroll lock that could persist after overlays.
- Added stale dialog and More-sheet class recovery.
- Forced html/body back to normal document scrolling in Firefox.
- Disabled remaining Firefox backdrop blur on overlays that could cause scroll jank.
- Updated cache-busting to r2-3-hard-scroll-unlock-20260530.
