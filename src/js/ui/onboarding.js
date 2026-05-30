/* MoneyMap onboarding — v0.9.7
   ─────────────────────────────────────────────────────────────────
   Responsibilities
   ────────────────
   1. Show/hide the "Continue existing workspace" link based on
      whether the user has prior data (navigation.js can't access
      the DOM yet when it runs openFirstRun).

   2. Render an accounts snapshot card on the Overview dashboard
      so users see their account balances at a glance (Monarch-style).

   3. Render a welcome/empty-state card when accounts are empty,
      guiding fresh users to their first meaningful action.

   4. Register both renders on MoneyMapRenderBus so they fire after
      every renderAll — no manual monkey-patching.

   Dependencies: state, money/v54FriendlyMoney (app.js), escapeHtml,
   openDrawer, showView, MoneyMapRenderBus (all global by load time).
   ─────────────────────────────────────────────────────────────────
   Load order: after shared-helpers.js, spend-map.js, before ux layers.
   ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── Utilities ────────────────────────────────────────────────── */

  function esc(v) {
    return typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? '');
  }

  function fmt(n) {
    if (typeof v54FriendlyMoney === 'function') return v54FriendlyMoney(n);
    if (typeof money === 'function') return money(n);
    return '$' + (Number(n) || 0).toFixed(0);
  }

  function safeState() {
    return (typeof state !== 'undefined' && state) ? state : null;
  }

  /* ── 1. First-run "continue" link visibility ──────────────────── */

  function updateFirstRunContinueBtn() {
    const btn = document.getElementById('frContinueBtn');
    if (!btn) return;
    const s = safeState();
    const hasData = s && (
      (s.transactions || []).length ||
      (s.accounts || []).length ||
      (s.goals || []).length ||
      (s.netWorthHistory || []).length
    );
    btn.classList.toggle('visible', !!hasData);
  }

  /* ── 2. Accounts snapshot card ───────────────────────────────── */

  /* Asset-type accounts: positive net worth contribution */
  var ASSET_TYPES = new Set([
    'Checking', 'Savings', 'Cash', 'Brokerage', 'Retirement', 'HSA',
    'Crypto Wallet', 'Property', 'Vehicle', 'Collectibles', 'Jewelry',
    'Precious Metals', 'Art', 'Other Asset'
  ]);

  /* Dot color per account type */
  var TYPE_COLORS = {
    'Checking':       'var(--accent)',
    'Savings':        'var(--green2)',
    'Brokerage':      'var(--blue)',
    'Retirement':     'var(--purple)',
    'HSA':            'var(--gold)',
    'Credit Card':    'var(--red)',
    'Loan':           'var(--red)',
    'Mortgage':       'var(--orange)',
    'Auto Loan':      'var(--orange)',
    'Student Loan':   'var(--orange)',
    'Other Liability':'var(--red)',
  };

  function dotColor(type) {
    return TYPE_COLORS[type] || 'var(--muted)';
  }

  function isLiabilityType(type) {
    return !ASSET_TYPES.has(type);
  }

  function buildAccountsSnapshot() {
    var s = safeState();
    if (!s) return null;
    var accounts = (s.accounts || []).filter(function (a) {
      return a.includeNetWorth !== false;
    });
    if (!accounts.length) return null;

    /* Net worth from accounts only (fast approximation for the card) */
    var net = accounts.reduce(function (sum, a) {
      var bal = Number(a.balance || 0);
      return sum + (isLiabilityType(a.type) ? -bal : bal);
    }, 0);

    /* Sort: assets descending, liabilities at bottom */
    var assets = accounts
      .filter(function (a) { return !isLiabilityType(a.type); })
      .sort(function (a, b) { return Number(b.balance || 0) - Number(a.balance || 0); });
    var liabilities = accounts
      .filter(function (a) { return isLiabilityType(a.type); })
      .sort(function (a, b) { return Number(b.balance || 0) - Number(a.balance || 0); });

    var rows = assets.concat(liabilities);

    /* Net worth composition bar segments */
    var totalAssets = assets.reduce(function (s, a) { return s + Number(a.balance || 0); }, 0) || 1;
    var barSegs = assets.slice(0, 5).map(function (a, i) {
      var colors = ['var(--accent)', 'var(--blue)', 'var(--purple)', 'var(--gold)', 'var(--green2)'];
      var w = Math.max(3, Math.round(Number(a.balance || 0) / totalAssets * 100));
      return '<div class="fr-bar-fill" style="width:' + w + '%;background:' + colors[i % colors.length] + '"></div>';
    }).join('');

    var rowsHtml = rows.map(function (a) {
      var bal = Number(a.balance || 0);
      var isLiab = isLiabilityType(a.type);
      var balClass = isLiab ? 'acct-snapshot-bal liability' : 'acct-snapshot-bal';
      var displayed = isLiab ? fmt(-bal) : fmt(bal);
      return '<button type="button" class="acct-snapshot-row" onclick="showView(\'networth\')" aria-label="Open net worth for ' + esc(a.name) + '">' +
        '<span class="acct-snapshot-dot" style="background:' + dotColor(a.type) + '"></span>' +
        '<span><div class="acct-snapshot-name">' + esc(a.name) + '</div><div class="acct-snapshot-type">' + esc(a.institution || a.type) + '</div></span>' +
        '<span class="' + balClass + '">' + esc(displayed) + '</span>' +
        '</button>';
    }).join('');

    return '<div class="acct-snapshot-card">' +
      '<div class="acct-snapshot-head">' +
        '<div><div class="acct-snapshot-label" style="font-size:11px;font-weight:850;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:3px">Net worth</div>' +
        '<div class="acct-snapshot-net">' + esc(fmt(net)) + '</div></div>' +
        '<button type="button" class="btn btn-small" onclick="showView(\'networth\')">Update</button>' +
      '</div>' +
      '<div class="fr-preview-bar" style="margin:0;border-radius:0;height:4px;gap:1px;">' + barSegs + '</div>' +
      '<div class="acct-snapshot-list">' + rowsHtml + '</div>' +
      '<div class="acct-snapshot-footer">' +
        '<span style="font-size:12px;color:var(--muted)">' + accounts.length + ' account' + (accounts.length === 1 ? '' : 's') + '</span>' +
        '<button type="button" class="btn btn-small" onclick="openDrawer(\'account\')">＋ Add account</button>' +
      '</div>' +
      '</div>';
  }

  /* ── 3. Welcome card (empty state) ────────────────────────────── */

  function buildWelcomeCard() {
    var s = safeState();
    if (!s) return null;

    var hasAccounts = (s.accounts || []).length > 0;
    var hasTx = (s.transactions || []).filter(function (t) { return !t.hidden; }).length > 0;
    var hasNetWorth = (s.netWorthHistory || []).length > 0;

    /* Don't show if the user is reasonably set up */
    if (hasAccounts && hasTx) return null;

    /* Don't show for demo workspace */
    var isDemoLoaded = (s.transactions || []).length > 20 && hasAccounts;
    if (isDemoLoaded) return null;

    function step(num, label, sub, done, fn) {
      var doneClass = done ? ' welcome-step-done' : '';
      var numContent = done ? '✓' : String(num);
      return '<button type="button" class="welcome-step' + doneClass + '" onclick="' + fn + '">' +
        '<span class="welcome-step-num">' + numContent + '</span>' +
        '<span class="welcome-step-copy"><b>' + esc(label) + '</b><span>' + esc(sub) + '</span></span>' +
        '<span class="welcome-step-caret">›</span>' +
        '</button>';
    }

    var stepsHtml = [
      step(1, 'Add your accounts', 'Checking, savings, investment accounts — takes 2 min', hasAccounts, "openDrawer('account')"),
      step(2, 'Record a few transactions', 'Or import a CSV from your bank', hasTx, "openDrawer('transaction')"),
      step(3, 'Set a budget for one category', 'Start with Groceries or Dining', false, "openDrawer('budget')")
    ].join('');

    return '<div class="welcome-card">' +
      '<div class="welcome-card-head">' +
        '<b>Set up your financial picture</b>' +
        '<p>MoneyMap works best once you\'ve added your accounts and a few transactions. It only takes a couple of minutes.</p>' +
      '</div>' +
      '<div class="welcome-steps">' + stepsHtml + '</div>' +
      '<div class="welcome-card-actions">' +
        '<button type="button" class="btn btn-primary" onclick="openDrawer(\'account\')">＋ Add first account</button>' +
        '<button type="button" class="btn" onclick="chooseFirstRun(\'demo\')">Explore demo</button>' +
      '</div>' +
      '</div>';
  }

  /* ── Render function — injects both cards into the overview ─────── */

  function renderOnboardingCards() {
    updateFirstRunContinueBtn();

    var overview = document.getElementById('view-overview');
    if (!overview || !overview.classList.contains('active')) return;

    /* Target injection point: the first card in the overview */
    var target = overview.querySelector('.v60-dashboard, .v59-command, .v5-command-board, .card');
    if (!target) return;

    /* Accounts snapshot */
    var snapHost = document.getElementById('mm-acct-snapshot-host');
    if (!snapHost) {
      snapHost = document.createElement('div');
      snapHost.id = 'mm-acct-snapshot-host';
      /* Insert before the main dashboard content */
      target.parentNode.insertBefore(snapHost, target);
    }
    var snapHtml = buildAccountsSnapshot();
    snapHost.innerHTML = snapHtml || '';
    snapHost.style.display = snapHtml ? 'block' : 'none';

    /* Welcome card — only shown when accounts are empty */
    var welcomeHost = document.getElementById('mm-welcome-host');
    if (!welcomeHost) {
      welcomeHost = document.createElement('div');
      welcomeHost.id = 'mm-welcome-host';
      target.parentNode.insertBefore(welcomeHost, snapHost.nextSibling);
    }
    var welcomeHtml = buildWelcomeCard();
    welcomeHost.innerHTML = welcomeHtml || '';
    welcomeHost.style.display = welcomeHtml ? 'block' : 'none';
  }

  /* ── chooseFirstRun hook — open account drawer after 'fresh' ───── */
  /* After a user picks "Add my accounts", open the account drawer    */
  /* immediately so there's no blank-screen moment.                   */
  (function hookChooseFirstRun() {
    if (typeof window.chooseFirstRun !== 'function') {
      /* navigation.js may not be ready yet — retry once DOM is ready */
      document.addEventListener('DOMContentLoaded', hookChooseFirstRun);
      return;
    }
    var _prior = window.chooseFirstRun;
    window.chooseFirstRun = async function (mode) {
      var result = await _prior.apply(this, arguments);
      if (mode === 'fresh') {
        /* Give renderAll a frame to complete then open account drawer */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (typeof openDrawer === 'function') openDrawer('account');
          });
        });
      }
      return result;
    };
  })();

  /* ── Register on render bus ────────────────────────────────────── */

  if (typeof MoneyMapRenderBus !== 'undefined') {
    MoneyMapRenderBus.register('onboarding-cards', renderOnboardingCards, 25);
  } else {
    /* Fallback: wrap renderAll directly if bus isn't loaded */
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof MoneyMapRenderBus !== 'undefined') {
        MoneyMapRenderBus.register('onboarding-cards', renderOnboardingCards, 25);
      } else if (typeof window.renderAll === 'function' && !window.renderAll.__onboardingHooked) {
        var _prior = window.renderAll;
        window.renderAll = function () {
          var r = _prior.apply(this, arguments);
          requestAnimationFrame(renderOnboardingCards);
          return r;
        };
        window.renderAll.__onboardingHooked = true;
      }
    });
  }

  /* Run once immediately in case the DOM is already populated */
  if (document.readyState !== 'loading') {
    requestAnimationFrame(renderOnboardingCards);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(renderOnboardingCards);
    });
  }

})();
