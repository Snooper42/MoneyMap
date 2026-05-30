/* MoneyMap nav — v0.1.3
   ─────────────────────────────────────────────────────────────────
   Replaces emoji/text icons with a clean SVG set.
   Adds user-editable bottom bar (up to 4 slots).
   Provides a redesigned More sheet.

   Overrides window.buildMobileNav and window.ux62RenderMobileMoreGrid
   (both defined in app.js / ux62 IIFE). Runs after those definitions,
   so this version wins.

   API
   ───
   MM_NAV.icon(id)          → SVG string for a nav section
   MM_NAV.getUserItems()    → array of ≤4 section ids from state
   MM_NAV.setUserItems([…]) → save + rebuild nav
   MM_NAV.openCustomizer()  → show the "Customize bar" panel
   ─────────────────────────────────────────────────────────────────
   Load order: after touch.js, before ux patch layers.
   ───────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  if (window.MM_NAV) return;

  /* ── SVG icon registry ─────────────────────────────────────── */
  /* 24×24 viewBox, 1.75 stroke, round caps/joins, no fill
     except where noted. Designed to be readable at 20×20.        */

  var SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  var SVG_CLOSE = '</svg>';

  function svg(body) { return SVG_OPEN + body + SVG_CLOSE; }

  var ICONS = {

    overview: svg(
      '<path d="M3 12L12 3l9 9"/>' +
      '<path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>'
    ),

    import: svg(
      '<path d="M12 14V3m0 0L8 7m4-4l4 4"/>' +
      '<path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>'
    ),

    review: svg(
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M8.5 12.5l2.5 2.5 4.5-5"/>'
    ),

    transactions: svg(
      '<line x1="8" y1="6" x2="21" y2="6"/>' +
      '<line x1="8" y1="12" x2="21" y2="12"/>' +
      '<line x1="8" y1="18" x2="21" y2="18"/>' +
      '<line x1="3" y1="6" x2="3.01" y2="6"/>' +
      '<line x1="3" y1="12" x2="3.01" y2="12"/>' +
      '<line x1="3" y1="18" x2="3.01" y2="18"/>'
    ),

    budgets: svg(
      '<path d="M12 3a9 9 0 100 18A9 9 0 0012 3z"/>' +
      '<path d="M12 3v9h9"/>'
    ),

    recurring: svg(
      '<path d="M17 1l4 4-4 4"/>' +
      '<path d="M3 11V9a4 4 0 014-4h14"/>' +
      '<path d="M7 23l-4-4 4-4"/>' +
      '<path d="M21 13v2a4 4 0 01-4 4H3"/>'
    ),

    networth: svg(
      '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>' +
      '<polyline points="17 6 23 6 23 12"/>'
    ),

    accounts: svg(
      '<rect x="3" y="5" width="18" height="14" rx="2.5"/>' +
      '<path d="M3 10h18"/>' +
      '<path d="M7 15h4"/>' +
      '<path d="M15 15h2"/>'
    ),

    debt: svg(
      '<rect x="2" y="5" width="20" height="14" rx="2"/>' +
      '<line x1="2" y1="10" x2="22" y2="10"/>' +
      '<line x1="6" y1="15" x2="9" y2="15"/>'
    ),

    investments: svg(
      '<line x1="18" y1="20" x2="18" y2="9"/>' +
      '<line x1="12" y1="20" x2="12" y2="4"/>' +
      '<line x1="6" y1="20" x2="6" y2="13"/>' +
      '<line x1="2" y1="20" x2="22" y2="20"/>'
    ),

    credit: svg(
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
    ),

    goals: svg(
      '<circle cx="12" cy="12" r="10"/>' +
      '<circle cx="12" cy="12" r="5.5"/>' +
      '<circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>'
    ),

    rules: svg(
      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
    ),

    settings: svg(
      '<line x1="4" y1="21" x2="4" y2="14"/>' +
      '<line x1="4" y1="10" x2="4" y2="3"/>' +
      '<line x1="12" y1="21" x2="12" y2="12"/>' +
      '<line x1="12" y1="8" x2="12" y2="3"/>' +
      '<line x1="20" y1="21" x2="20" y2="16"/>' +
      '<line x1="20" y1="12" x2="20" y2="3"/>' +
      '<line x1="1" y1="14" x2="7" y2="14"/>' +
      '<line x1="9" y1="8" x2="15" y2="8"/>' +
      '<line x1="17" y1="16" x2="23" y2="16"/>'
    ),

    /* Special: More grid */
    more: svg(
      '<circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none"/>' +
      '<circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none"/>' +
      '<circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none"/>' +
      '<circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none"/>'
    ),

    /* Special: Quick add */
    add: svg(
      '<circle cx="12" cy="12" r="9"/>' +
      '<line x1="12" y1="8" x2="12" y2="16"/>' +
      '<line x1="8" y1="12" x2="16" y2="12"/>'
    ),

    /* Customizer: checkmark */
    check: svg('<polyline points="20 6 9 17 4 12"/>'),

    /* Customizer: drag handle */
    grip: svg(
      '<circle cx="9" cy="8" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="15" cy="8" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>' +
      '<circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>'
    ),

    /* Edit pencil */
    edit: svg(
      '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>' +
      '<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>'
    ),

    /* Close X */
    close: svg(
      '<line x1="18" y1="6" x2="6" y2="18"/>' +
      '<line x1="6" y1="6" x2="18" y2="18"/>'
    )
  };

  /* ── Section metadata ──────────────────────────────────────── */

  function sections() {
    var raw = [];
    try { raw = (typeof NAV !== 'undefined' && Array.isArray(NAV)) ? NAV : []; } catch (e) { raw = []; }
    var out = raw.map(function (n) { return { id: n[0], title: n[1], sub: n[2] }; });

    /* Accounts is mounted by later legacy layers on some builds. Keep it available
       even when those layers update NAV after this file has loaded. */
    if (!out.some(function (s) { return s.id === 'accounts'; })) {
      var insertAt = out.findIndex(function (s) { return s.id === 'networth'; });
      out.splice(insertAt >= 0 ? insertAt + 1 : out.length, 0, { id: 'accounts', title: 'Accounts', sub: 'Manual balances' });
    }

    return out;
  }

  function sectionMeta(id) {
    return sections().find(function (s) { return s.id === id; }) || { id: id, title: id, sub: '' };
  }

  function sectionExists(id) {
    return sections().some(function (s) { return s.id === id; });
  }

  function text(v) {
    try { return typeof escapeHtml === 'function' ? escapeHtml(String(v == null ? '' : v)) : String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); } catch (e) { return ''; }
  }
  function js(v) {
    try {
      if (typeof escapeJs === 'function') return escapeJs(String(v == null ? '' : v));
      return String(v == null ? '' : v)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    } catch (e) { return ''; }
  }

  /* ── User preferences ──────────────────────────────────────── */

  var DEFAULT_ITEMS = ['overview', 'review', 'transactions', 'budgets'];
  var MAX_ITEMS = 4;

  function getUserItems() {
    try {
      var saved = state && state.settings && state.settings.mobileNavItems;
      if (Array.isArray(saved) && saved.length >= 2 && saved.length <= MAX_ITEMS) {
        var valid = saved.filter(function (id) { return sectionExists(id); });
        var unique = valid.filter(function (id, idx) { return valid.indexOf(id) === idx; });
        if (unique.length >= 2 && unique.includes('overview') && unique.includes('review')) return unique;
      }
    } catch (e) {}
    return DEFAULT_ITEMS.slice();
  }

  function normalizeUserItems(items) {
    var valid = (Array.isArray(items) ? items : []).filter(function (id) { return sectionExists(id); });
    var unique = [];
    valid.forEach(function (id) { if (!unique.includes(id)) unique.push(id); });
    if (!unique.includes('overview')) unique.unshift('overview');
    if (!unique.includes('review')) unique.splice(Math.min(1, unique.length), 0, 'review');
    return unique.slice(0, MAX_ITEMS);
  }

  function setUserItems(items) {
    var next = normalizeUserItems(items);
    try {
      if (state && state.settings) {
        state.settings.mobileNavItems = next;
        if (typeof saveState === 'function') saveState();
      }
    } catch (e) {}
    buildMobileNav();
  }

  /* ── Build bottom nav bar ─────────────────────────────────── */

  function buildNav() {
    var el = document.getElementById('mobileNav');
    if (!el) return;

    var items = getUserItems();
    var isMoreActive = !items.includes(typeof activeView !== 'undefined' ? activeView : '');

    var buttons = items.map(function (id) {
      var meta = sectionMeta(id);
      var isActive = (typeof activeView !== 'undefined') && activeView === id;
      return '<button type="button" class="mm-nav-btn' + (isActive ? ' active' : '') + '" ' +
        'onclick="showView(\'' + js(id) + '\')" ' +
        'aria-label="' + text(meta.title) + '">' +
        '<span class="mm-nav-icon">' + (ICONS[id] || ICONS.overview) + '</span>' +
        '<span class="mm-nav-label">' + text(meta.title) + '</span>' +
        '</button>';
    });

    /* More button */
    buttons.push(
      '<button type="button" class="mm-nav-btn' + (isMoreActive ? ' active' : '') + '" ' +
      'onclick="toggleMobileMore(true)" aria-label="More sections">' +
      '<span class="mm-nav-icon">' + ICONS.more + '</span>' +
      '<span class="mm-nav-label">More</span>' +
      '</button>'
    );

    el.innerHTML = buttons.join('');
  }

  /* ── Build More sheet ────────────────────────────────────────  */

  function buildMoreSheet() {
    var userItems = getUserItems();
    var current = (typeof activeView !== 'undefined') ? activeView : '';

    /* All sections not in the bottom bar */
    var moreItems = sections().filter(function (s) {
      return !userItems.includes(s.id);
    });

    var grid = moreItems.map(function (s) {
      var isActive = current === s.id;
      return '<button type="button" class="mm-more-item' + (isActive ? ' active' : '') + '" ' +
        'onclick="showView(\'' + js(s.id) + '\');toggleMobileMore(false)" aria-label="Open ' + text(s.title) + '">' +
        '<span class="mm-more-icon">' + (ICONS[s.id] || ICONS.overview) + '</span>' +
        '<span class="mm-more-copy">' +
          '<strong>' + text(s.title) + '</strong>' +
          '<span>' + text(s.sub) + '</span>' +
        '</span>' +
        '</button>';
    }).join('');

    return '<div class="mm-more-inner" role="dialog" aria-modal="true" aria-label="More sections">' +
      '<div class="mm-more-head">' +
        '<div class="mm-more-title"><b>Sections</b></div>' +
        '<div class="mm-more-actions">' +
          '<button type="button" class="mm-more-customize-btn" onclick="MM_NAV.openCustomizer()" aria-label="Customize bottom bar">' +
            ICONS.edit +
            '<span>Edit bar</span>' +
          '</button>' +
          '<button type="button" class="mm-more-close-btn" onclick="toggleMobileMore(false)" aria-label="Close">' +
            ICONS.close +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="mm-more-grid">' + grid + '</div>' +
      '</div>';
  }

  function ensureMoreSheet() {
    var sheet = document.getElementById('mobileMoreSheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'mobileMoreSheet';
      sheet.className = 'mobile-more-sheet mm-more-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) toggleMobileMore(false);
      });
      document.body.appendChild(sheet);
    }
    return sheet;
  }

  function renderMoreSheet() {
    var sheet = ensureMoreSheet();
    sheet.innerHTML = buildMoreSheet();
  }

  /* ── Nav customizer ─────────────────────────────────────────── */
  /* Replaces the More sheet interior with a tap-to-select editor  */

  var _customizerOpen = false;

  function openCustomizer() {
    _customizerOpen = true;
    var sheet = ensureMoreSheet();

    var userItems = getUserItems().slice(); /* working copy */

    function render() {
      var allSections = sections();

      var selectedHtml = userItems.map(function (id, idx) {
        var s = sectionMeta(id);
        return '<div class="mm-cust-slot" data-id="' + text(id) + '">' +
          '<span class="mm-cust-slot-icon">' + (ICONS[id] || ICONS.overview) + '</span>' +
          '<span class="mm-cust-slot-name">' + text(s.title) + '</span>' +
          '<button type="button" class="mm-cust-remove" onclick="MM_NAV._custRemove(\'' + js(id) + '\')" aria-label="Remove ' + text(s.title) + '">' +
            ICONS.close +
          '</button>' +
          '</div>';
      }).join('');

      /* Fill empty slots */
      for (var i = userItems.length; i < MAX_ITEMS; i++) {
        selectedHtml += '<div class="mm-cust-slot mm-cust-slot-empty"><span>Empty slot</span></div>';
      }

      var availableHtml = allSections
        .filter(function (s) { return !userItems.includes(s.id); })
        .map(function (s) {
          var canAdd = userItems.length < MAX_ITEMS;
          return '<button type="button" class="mm-cust-chip' + (canAdd ? '' : ' mm-cust-chip-disabled') + '" ' +
            (canAdd ? 'onclick="MM_NAV._custAdd(\'' + js(s.id) + '\')"' : 'disabled aria-disabled="true"') +
            ' aria-label="Add ' + text(s.title) + ' to bar">' +
            '<span class="mm-cust-chip-icon">' + (ICONS[s.id] || ICONS.overview) + '</span>' +
            '<span>' + text(s.title) + '</span>' +
            '</button>';
        }).join('');

      sheet.innerHTML =
        '<div class="mm-more-inner mm-cust-panel" role="dialog" aria-modal="true" aria-label="Customize bottom bar">' +
          '<div class="mm-more-head">' +
            '<div class="mm-more-title"><b>Customize bar</b><span>' + userItems.length + ' of ' + MAX_ITEMS + ' slots used</span></div>' +
            '<button type="button" class="mm-more-close-btn" onclick="MM_NAV.closeCustomizer()" aria-label="Done">' +
              ICONS.close +
            '</button>' +
          '</div>' +

          '<div class="mm-cust-slots-label">Your bottom bar (tap − to remove)</div>' +
          '<div class="mm-cust-slots">' + selectedHtml + '</div>' +

          '<div class="mm-cust-avail-label">Available sections (tap to add)</div>' +
          '<div class="mm-cust-chips">' + availableHtml + '</div>' +

          '<div class="mm-cust-footer">' +
            '<button type="button" class="btn btn-small" onclick="MM_NAV._custReset()">Reset to default</button>' +
            '<button type="button" class="btn btn-primary" onclick="MM_NAV.closeCustomizer()">Done</button>' +
          '</div>' +
        '</div>';
    }

    /* Expose mutation functions for inline onclick handlers */
    MM_NAV._custAdd = function (id) {
      if (userItems.length >= MAX_ITEMS) return;
      if (!userItems.includes(id)) userItems.push(id);
      userItems = normalizeUserItems(userItems);
      setUserItems(userItems);
      render();
    };

    MM_NAV._custRemove = function (id) {
      userItems = normalizeUserItems(userItems.filter(function (x) { return x !== id; }));
      setUserItems(userItems);
      render();
    };

    MM_NAV._custReset = function () {
      userItems = DEFAULT_ITEMS.slice();
      setUserItems(userItems);
      render();
    };

    render();
  }

  function closeCustomizer() {
    _customizerOpen = false;
    /* Save is already applied on every mutation via setUserItems */
    toggleMobileMore(false);
  }

  /* ── Override globals ────────────────────────────────────────── */

  /* Replace buildMobileNav with our SVG version */
  window.buildMobileNav = buildNav;

  /* Replace ux62RenderMobileMoreGrid with our version.
     Also hook into toggleMobileMore to render our sheet. */
  var _priorToggleMore = window.toggleMobileMore;
  window.toggleMobileMore = function (open) {
    var sheet = ensureMoreSheet();
    var shouldOpen = typeof open === 'boolean' ? open : !sheet.classList.contains('active');
    if (shouldOpen) {
      if (!_customizerOpen) renderMoreSheet();
    } else {
      _customizerOpen = false;
    }
    sheet.classList.toggle('active', shouldOpen);
    sheet.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    document.body.classList.toggle('uxv62-more-open', shouldOpen);
  };

  /* ── Public API ────────────────────────────────────────────── */

  window.MM_NAV = {
    icon:            function (id) { return ICONS[id] || ICONS.overview; },
    getUserItems:    getUserItems,
    setUserItems:    setUserItems,
    openCustomizer:  openCustomizer,
    closeCustomizer: closeCustomizer,
    _custAdd:        null, /* set during customizer render */
    _custRemove:     null,
    _custReset:      null,
    _version:        'v0.1.3'
  };

  /* Also expose on MoneyMap namespace */
  if (window.MoneyMap) window.MoneyMap.nav = window.MM_NAV;

  /* ── Boot ───────────────────────────────────────────────────── */

  function init() {
    buildNav();
    /* Sync mobileNavItems default into state if missing */
    try {
      if (state && state.settings) {
        var current = state.settings.mobileNavItems;
        if (!Array.isArray(current) || current.length < 2 || !current.includes('overview') || !current.includes('review')) {
          state.settings.mobileNavItems = DEFAULT_ITEMS.slice();
          if (typeof saveState === 'function') saveState();
        }
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-build after every renderAll via render bus */
  if (typeof MoneyMapRenderBus !== 'undefined') {
    MoneyMapRenderBus.register('nav-svg-v099', function () {
      buildNav();
      /* Sync active state in More grid if open */
      if (document.getElementById('mobileMoreSheet')?.classList.contains('active') && !_customizerOpen) {
        renderMoreSheet();
      }
    }, 15);
  }

})();
