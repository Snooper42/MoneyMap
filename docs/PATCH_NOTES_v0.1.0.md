# MoneyMap v0.1.0 patch notes

**Public launch.** This release consolidates all pre-release development and establishes the baseline for the v0.1.x stability track.

---

## Highlights

### Interactive net worth chart

Click or tap any dot on the net worth trend chart to see a full account breakdown for that snapshot.

- Shows every account that was included at the time of the snapshot: name, institution, and balance
- Assets listed first, then liabilities with red values
- A totals row shows Assets and Liabilities separately
- On mobile, the popup appears as a bottom sheet above the nav bar
- New snapshots automatically capture the current account list

**To see it:** Load demo data → open Net worth → tap any dot on the trend chart.

### Dashboard redesign

The overview now opens with a focused 4-section layout:

1. **Net worth hero** — large net worth number, delta vs last snapshot, assets/liabilities/account count tiles, "Save snapshot" button that turns primary when the number has changed
2. **Cash flow strip** — Spent / Income / Net flow for the current month, each tile taps through to Transactions
3. **Review banner** — appears only when transactions need review; shows the count and a direct "Review N" button
4. **Spending breakdown** — top categories with colored dots, bar progress against budget limits (red/orange when over), amount on the right

### Clean version system

MoneyMap is now on semver. Going forward:
- Patch releases: bug fixes, small improvements → v0.1.1, v0.1.2
- Minor releases: new features → v0.2.0, v0.3.0
- CHANGELOG.md is the authoritative record of every change
- ROADMAP.md outlines what's planned next

---

## All changes

**`src/js/charts.js`**
- `renderNetWorthChart()` completely rewritten: adds area fill under line, larger/glowing active dot, `netWorthChartModel` global for interactive overlay
- `bindNetWorthChartEvents()` — click and touchend handlers for dot hit-testing, nearest-neighbor approach matching the credit chart pattern
- `showNetWorthDotPopup()` / `hideNetWorthDotPopup()` — DOM-based popup with account breakdown, positioned relative to the dot (desktop) or fixed at bottom (mobile)

**`src/js/accounts.js`**
- `saveNetWorthSnapshot()` — now captures `accountSnapshot: [{name, type, institution, balance}]` alongside the existing aggregate data

**`src/js/app.js`**
- `demoNetWorthHistory()` — now generates realistic per-month account snapshots with balance variation; each history entry has `accountSnapshot` so demo dots always show full breakdowns

**`src/js/ui/dashboard.js`** ← NEW
- New overview dashboard rendered into `#mm-dash-v010-host` at priority 20 on the render bus
- Sections: net worth hero, cash flow strip, review banner, spending breakdown, quick actions

**`src/css/ux-v0.1.0.css`** ← NEW
- All styles for the dot popup, dashboard layout, and mobile responsive behavior

**`src/js/core/app-config.js`** → v0.1.0

**`CHANGELOG.md`** ← NEW

**`ROADMAP.md`** ← NEW

**`README.md`** — rewritten for v0.1.0

---

## Changed files

```
src/js/charts.js                (updated — net worth chart interaction)
src/js/accounts.js              (updated — saveNetWorthSnapshot with accountSnapshot)
src/js/app.js                   (updated — demoNetWorthHistory with per-account data)
src/js/core/app-config.js       (updated — v0.1.0)
src/js/state.js                 (updated — v0.1.0 fallback)
src/js/ui/dashboard.js          (NEW)
src/css/ux-v0.1.0.css          (NEW)
CHANGELOG.md                    (NEW)
ROADMAP.md                      (NEW)
README.md                       (updated)
index.html                      (updated — new files, v0.1.0 cache busts)
```

---

## Testing

```powershell
cd "$env:USERPROFILE\Downloads"
Remove-Item -Recurse -Force .\MoneyMap_v0.1.0_full_no_git -ErrorAction SilentlyContinue
Expand-Archive .\MoneyMap_v0.1.0_full_no_git.zip -DestinationPath .\MoneyMap_v0.1.0_full_no_git
cd .\MoneyMap_v0.1.0_full_no_git\MoneyMap_v0.1.0
python -m http.server 8080
```

**Checklist:**
- Load demo data → Overview shows the new dashboard sections
- Tap "Net worth" in nav → tap any dot → popup shows per-account breakdown
- Tap a dot on mobile → popup slides up from bottom
- `window.MoneyMap.version` → `"v0.1.0"` in DevTools
- Settings → Privacy → Build shows `v0.1.0`
