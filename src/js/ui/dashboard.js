/* MoneyMap dashboard — v0.1.0
   ─────────────────────────────────────────────────────────────────
   Renders a clean, focused overview replacing the v5/v59/v60 stack.
   Injected into #view-overview, registered on MoneyMapRenderBus.

   Layout (mobile-first):
     1. Net worth hero — number, trend delta, assets/liabilities
     2. Cash flow strip — Spent / Income / Net this month
     3. Review banner — shown only when unreviewed transactions exist
     4. Spending breakdown — top categories with budget bars
     5. Quick actions — snapshot, import, settings

   Dependencies: state, netWorthBreakdown, spendingPace, budgetStats,
   byCategory, monthTransactions, currentMonth, money / v54FriendlyMoney,
   dateFmt, escapeHtml, showView, openDrawer, saveNetWorthSnapshot,
   startWeeklyReview (all global by load time).
   ─────────────────────────────────────────────────────────────────
   Load order: after nav.js, before ux patch layers.
   ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.__mmDashboardV010) return;
  window.__mmDashboardV010 = true;

  /* ── Helpers ─────────────────────────────────────────────── */

  function esc(v) { return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? ''); }

  function fmt(n) {
    if (typeof v54FriendlyMoney === 'function') return v54FriendlyMoney(n);
    if (typeof money === 'function') return money(n);
    return (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function pct(n) { return Math.round(Number(n) || 0) + '%'; }

  function safeCall(fn, fallback) {
    try { return fn(); } catch (e) { return fallback; }
  }

  /* ── Section 1: Net worth hero ────────────────────────────── */

  function buildNetWorthHero() {
    var nw = safeCall(() => netWorthBreakdown(), { netWorth: 0, assets: 0, liabilities: 0 });
    var snapshots = (state.netWorthHistory || []).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var latest = snapshots[0] || null;
    var prev   = snapshots[1] || null;

    var delta = (latest && prev) ? Number(latest.netWorth || 0) - Number(prev.netWorth || 0) : null;
    var deltaHtml = '';
    if (delta !== null) {
      var cls = delta >= 0 ? 'good' : 'bad';
      var sign = delta >= 0 ? '+' : '';
      deltaHtml = '<span class="mm-dash-delta ' + cls + '">' + sign + esc(fmt(delta)) + ' vs last</span>';
    }

    var lastSavedHtml = latest
      ? '<span class="mm-dash-saved">Last saved ' + esc(dateFmt(latest.date)) + '</span>'
      : '<span class="mm-dash-saved">Save a snapshot to start tracking</span>';

    var needsSnapshot = latest && Math.abs(nw.netWorth - Number(latest.netWorth || 0)) > 50;
    var snapshotCta = needsSnapshot
      ? '<button type="button" class="btn btn-small btn-primary mm-dash-snapshot-btn" onclick="saveNetWorthSnapshot()" title="Net worth has changed since last snapshot">Save snapshot</button>'
      : '<button type="button" class="btn btn-small mm-dash-snapshot-btn" onclick="saveNetWorthSnapshot()">Save snapshot</button>';

    return '<div class="mm-dash-nw-card">' +
      '<div class="mm-dash-nw-head">' +
        '<div>' +
          '<div class="mm-dash-nw-label">Net worth</div>' +
          '<div class="mm-dash-nw-value ' + (nw.netWorth >= 0 ? 'good' : 'bad') + '">' + esc(fmt(nw.netWorth)) + '</div>' +
          '<div class="mm-dash-nw-meta">' + deltaHtml + lastSavedHtml + '</div>' +
        '</div>' +
        snapshotCta +
      '</div>' +
      '<div class="mm-dash-nw-sub">' +
        '<div class="mm-dash-nw-stat"><span>Assets</span><b class="good">' + esc(fmt(nw.assets)) + '</b></div>' +
        '<div class="mm-dash-nw-stat"><span>Liabilities</span><b class="bad">' + esc(fmt(nw.liabilities)) + '</b></div>' +
        '<div class="mm-dash-nw-stat"><span>Accounts</span><b>' + esc(String((state.accounts || []).length)) + '</b></div>' +
      '</div>' +
      '</div>';
  }

  /* ── Section 2: Cash flow strip ──────────────────────────── */

  function buildCashFlowStrip() {
    var p = safeCall(() => spendingPace(), { spend: 0, income: 0, net: 0, month: '' });
    var unreviewed = (state.transactions || []).filter(function (t) { return !t.reviewed && !t.hidden; }).length;
    var netCls = p.net >= 0 ? 'good' : 'bad';

    return '<div class="mm-dash-cf-strip">' +
      '<button type="button" class="mm-dash-cf-tile" onclick="showView(\'transactions\')">' +
        '<span class="mm-dash-cf-label">Spent</span>' +
        '<span class="mm-dash-cf-value bad">' + esc(fmt(p.spend)) + '</span>' +
        '<span class="mm-dash-cf-sub">' + esc(String((state.transactions || []).filter(function (t) { return !t.hidden && Number(t.amount) < 0; }).length)) + ' transactions</span>' +
      '</button>' +
      '<button type="button" class="mm-dash-cf-tile" onclick="showView(\'transactions\')">' +
        '<span class="mm-dash-cf-label">Income</span>' +
        '<span class="mm-dash-cf-value good">' + esc(fmt(p.income)) + '</span>' +
        '<span class="mm-dash-cf-sub">This month</span>' +
      '</button>' +
      '<button type="button" class="mm-dash-cf-tile mm-dash-cf-tile-net" onclick="showView(\'transactions\')">' +
        '<span class="mm-dash-cf-label">Net flow</span>' +
        '<span class="mm-dash-cf-value ' + netCls + '">' + esc(fmt(p.net)) + '</span>' +
        '<span class="mm-dash-cf-sub">' + (unreviewed > 0 ? esc(String(unreviewed)) + ' unreviewed' : 'Up to date') + '</span>' +
      '</button>' +
      '</div>';
  }

  /* ── Section 3: Review banner ─────────────────────────────── */

  function buildReviewBanner() {
    var unreviewed = (state.transactions || []).filter(function (t) { return !t.reviewed && !t.hidden; }).length;
    if (!unreviewed) return '';

    return '<div class="mm-dash-review-banner">' +
      '<div class="mm-dash-review-copy">' +
        '<b>' + esc(String(unreviewed)) + ' transaction' + (unreviewed === 1 ? '' : 's') + ' need review</b>' +
        '<span>Approve or fix categories before reports are fully accurate.</span>' +
      '</div>' +
      '<button type="button" class="btn btn-primary mm-dash-review-btn" onclick="startWeeklyReview()">' +
        'Review ' + esc(String(unreviewed)) +
      '</button>' +
      '</div>';
  }

  /* ── Section 4: Spending breakdown ──────────────────────────── */

  function buildSpendingBreakdown() {
    var stats = safeCall(() => budgetStats(), []).sort(function (a, b) { return b.spent - a.spent; });
    var cats  = safeCall(() => byCategory(monthTransactions(currentMonth())), []);
    var totalSpend = cats.reduce(function (s, c) { return s + Number(c[1] || 0); }, 0);

    /* Merge cats with budget stats */
    var rows = cats.slice(0, 7).map(function (cat) {
      var name = cat[0];
      var spent = Number(cat[1] || 0);
      var budget = stats.find(function (b) { return b.category === name; });
      var pctOfSpend = totalSpend ? Math.round(spent / totalSpend * 100) : 0;

      var barPct, barCls, limitText;
      if (budget && budget.limit > 0) {
        barPct = Math.min(100, Math.round(spent / budget.limit * 100));
        barCls = barPct >= 100 ? 'bad' : barPct >= 80 ? 'warn' : 'good';
        limitText = barPct + '% of ' + fmt(budget.limit) + ' limit';
      } else {
        barPct = Math.min(100, pctOfSpend * 2);
        barCls = '';
        limitText = pctOfSpend + '% of spending';
      }

      /* Dot color cycles */
      var colors = ['var(--accent)', 'var(--blue)', 'var(--purple)', 'var(--gold)', 'var(--orange)', 'var(--red)', 'var(--pink)'];
      var dotColor = colors[cats.indexOf(cat) % colors.length];

      return '<button type="button" class="mm-dash-cat-row" onclick="showCategoryTransactions(\'' + esc(name) + '\')">' +
        '<span class="mm-dash-cat-dot" style="background:' + dotColor + '"></span>' +
        '<span class="mm-dash-cat-name">' + esc(name) + '</span>' +
        '<span class="mm-dash-cat-bar-wrap">' +
          '<span class="mm-dash-cat-bar ' + barCls + '" style="width:' + barPct + '%"></span>' +
        '</span>' +
        '<span class="mm-dash-cat-meta">' + esc(limitText) + '</span>' +
        '<span class="mm-dash-cat-val">' + esc(fmt(spent)) + '</span>' +
        '</button>';
    });

    var header = '<div class="mm-dash-section-head">' +
      '<b>Spending breakdown</b>' +
      '<button type="button" class="btn btn-small" onclick="showView(\'budgets\')">Budgets</button>' +
      '</div>' +
      '<p class="mm-dash-section-sub">' + safeCall(() => monthLabel(currentMonth()), 'This month') + ' · Top categories with budget context</p>';

    var content = rows.length
      ? '<div class="mm-dash-cat-list">' + rows.join('') + '</div>'
      : '<div class="mm-dash-empty">Import transactions to see spending breakdown.</div>';

    return '<div class="mm-dash-spending">' + header + content + '</div>';
  }

  /* ── Section 5: Quick actions row ────────────────────────── */

  function buildQuickActions() {
    var hasData = (state.transactions || []).length > 0;
    if (!hasData) return ''; /* welcome card handles this case */

    return '<div class="mm-dash-actions">' +
      '<button type="button" class="btn btn-small" onclick="showView(\'import\')">＋ Import CSV</button>' +
      '<button type="button" class="btn btn-small" onclick="openDrawer(\'transaction\')">＋ Add transaction</button>' +
      '<button type="button" class="btn btn-small" onclick="showView(\'networth\')">↗ Net worth</button>' +
      '</div>';
  }

  /* ── Main render ─────────────────────────────────────────── */

  function renderDashboard() {
    var view = document.getElementById('view-overview');
    if (!view || !view.classList.contains('active')) return;

    /* Get or create our host container */
    var host = document.getElementById('mm-dash-v010-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mm-dash-v010-host';
      host.className = 'mm-dash-v010';
      /* Insert at the very top of the overview view */
      view.insertBefore(host, view.firstChild);
    }

    host.innerHTML =
      buildNetWorthHero() +
      buildCashFlowStrip() +
      buildReviewBanner() +
      buildSpendingBreakdown() +
      buildQuickActions();
  }

  /* ── Register on render bus ──────────────────────────────── */

  if (typeof MoneyMapRenderBus !== 'undefined') {
    MoneyMapRenderBus.register('dashboard-v010', renderDashboard, 20);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof MoneyMapRenderBus !== 'undefined') {
        MoneyMapRenderBus.register('dashboard-v010', renderDashboard, 20);
      } else if (typeof window.renderAll === 'function' && !window.renderAll.__dashV010Hooked) {
        var _p = window.renderAll;
        window.renderAll = function () { var r = _p.apply(this, arguments); requestAnimationFrame(renderDashboard); return r; };
        window.renderAll.__dashV010Hooked = true;
      }
    });
  }

  if (document.readyState !== 'loading') {
    requestAnimationFrame(renderDashboard);
  } else {
    document.addEventListener('DOMContentLoaded', function () { requestAnimationFrame(renderDashboard); });
  }

})();
