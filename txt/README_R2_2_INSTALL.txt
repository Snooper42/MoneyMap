MoneyMap R2.2 Firefox scroll guard

Replace these files from the changed-files zip:

- index.html
- src/css/components.css
- src/js/app.js
- README_R2_2_INSTALL.txt

What changed:

- Replaced the late mobile-shell overflow-x:hidden override with overflow-x:clip.
- Added a Firefox-specific style fallback that disables heavy backdrop blur on sticky/fixed shell elements.
- Added a stuck-overlay guard so a stale More/search state cannot leave the page scroll-locked.
- Search results now close when the user scrolls outside the result panel.
- Updated cache-busting to r2-2-firefox-scroll-20260530.

After copying files, hard-refresh Firefox with Ctrl+F5.
