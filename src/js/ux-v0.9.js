/* MoneyMap v0.9 accounts and manual account creation refresh.
   Focus: cleaner Accounts page, frictionless manual account flow, and mobile-friendly navigation. */
(function(){
  'use strict';

  if (window.__MoneyMapV09Loaded) return;
  window.__MoneyMapV09Loaded = true;

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.1';
  const GROUPS = [
    {id:'all', label:'All', icon:'◌', types:[]},
    {id:'cash', label:'Cash', icon:'$', types:['Checking','Savings','Cash','Money Market']},
    {id:'investments', label:'Investments', icon:'△', types:['Brokerage','Retirement','HSA','Crypto Wallet']},
    {id:'property', label:'Property', icon:'⌂', types:['Property','Vehicle']},
    {id:'valuables', label:'Valuables', icon:'◆', types:['Collectibles','Jewelry','Precious Metals','Art']},
    {id:'debt', label:'Debt', icon:'−', types:['Credit Card','Loan','Student Loan','Mortgage','Auto Loan','Other Liability']},
    {id:'other', label:'Other', icon:'•', types:['Other Asset','Other Liability']}
  ];
  const RANGE_LABELS = { '1m':'1 month', '3m':'3 months', '6m':'6 months', '1y':'1 year', 'all':'All time' };

  const esc = value => (typeof escapeHtml === 'function') ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const moneyClean = value => {
    try { return money(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 }); }
    catch (e) { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0)); }
  };
  const moneyExact = value => {
    try { return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0)); }
    catch (e) { return '$0.00'; }
  };
  const n = value => typeof nval === 'function' ? nval(value) : Number(value || 0);
  const signed = a => typeof accountSignedValue === 'function' ? accountSignedValue(a) : n(a.balance);
  const byId = id => document.getElementById(id);

  function ensureBuildLabel(){
    window.MONEYMAP_EXPECTED_BUILD = BUILD;
    document.documentElement.setAttribute('data-moneymap-build', BUILD);
    const meta = document.querySelector('meta[name="moneymap-build"]');
    if (meta) meta.setAttribute('content', BUILD);
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
  }

  function ensureAccountsNav(){
    if (typeof NAV === 'undefined' || !Array.isArray(NAV)) return;
    if (NAV.some(item => item[0] === 'accounts')) return;
    const networthIndex = NAV.findIndex(item => item[0] === 'networth');
    const insertAt = networthIndex >= 0 ? networthIndex : 6;
    NAV.splice(insertAt, 0, ['accounts','Accounts','Manual balances','▥']);
  }

  function groupForType(type){
    const text = String(type || '').toLowerCase();
    if (/check|sav|cash|money market/.test(text)) return 'cash';
    if (/broker|retire|401|ira|hsa|invest|crypto/.test(text)) return 'investments';
    if (/property|vehicle|home|house|real estate/.test(text)) return 'property';
    if (/collect|jewel|metal|art/.test(text)) return 'valuables';
    if (/credit|loan|debt|mortgage|liabil/.test(text)) return 'debt';
    return 'other';
  }

  function groupMeta(id){ return GROUPS.find(g => g.id === id) || GROUPS[GROUPS.length - 1]; }
  function accounts(){ return Array.isArray(state?.accounts) ? state.accounts.slice() : []; }
  function includedAccountsList(){ return accounts().filter(a => a.includeNetWorth !== false); }
  function latestHistory(){ return Array.isArray(state?.netWorthHistory) ? state.netWorthHistory.slice().sort((a,b) => String(a.date||'').localeCompare(String(b.date||''))) : []; }
  function currentBreakdown(){ return typeof netWorthBreakdown === 'function' ? netWorthBreakdown() : {assets:0, liabilities:0, netWorth:0}; }

  function relativeDateText(value){
    if (!value) return 'Just now';
    const stamp = new Date(value);
    if (Number.isNaN(stamp.getTime())) return 'Just now';
    const diff = Math.round((Date.now() - stamp.getTime()) / 60000);
    if (diff <= 1) return 'Just now';
    if (diff < 60) return `${diff} minutes ago`;
    const hours = Math.round(diff / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.round(hours / 24);
    if (days < 8) return `${days} days ago`;
    return typeof dateFmt === 'function' ? dateFmt(String(value).slice(0,10)) : String(value).slice(0,10);
  }

  function setAccountsFilter(filter){
    state.settings = state.settings || {};
    state.settings.accountsPageFilter = filter;
    saveState?.();
    renderV09();
  }
  window.setAccountsFilter = setAccountsFilter;

  function setAccountsRange(range){
    state.settings = state.settings || {};
    state.settings.accountsChartRange = range;
    saveState?.();
    renderV09();
  }
  window.setAccountsRange = setAccountsRange;

  function setAccountsSummaryMode(mode){
    state.settings = state.settings || {};
    state.settings.accountsSummaryMode = mode;
    saveState?.();
    renderV09();
  }
  window.setAccountsSummaryMode = setAccountsSummaryMode;

  function toggleAccountsFilters(){
    const el = byId('v09AccountsFilterRow');
    if (!el) return;
    el.classList.toggle('open');
  }
  window.toggleAccountsFilters = toggleAccountsFilters;

  function refreshAccountsPage(){
    renderAll?.();
    toast?.('Accounts refreshed.');
  }
  window.refreshAccountsPage = refreshAccountsPage;

  function chartPoints(range){
    const rows = latestHistory().map(row => ({
      date: row.date,
      netWorth: n(row.netWorth),
      label: row.note || 'Snapshot',
      live: false
    }));
    const live = currentBreakdown();
    const liveDate = new Date().toISOString().slice(0,10);
    if (!rows.length || rows[rows.length - 1].date !== liveDate || Math.abs(n(rows[rows.length - 1].netWorth) - n(live.netWorth)) > 0.01) {
      rows.push({ date: liveDate, netWorth: n(live.netWorth), label: 'Current balance', live: true });
    }
    if (range === 'all') return rows;
    const now = new Date();
    const months = range === '1m' ? 1 : range === '3m' ? 3 : range === '6m' ? 6 : 12;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
    const filtered = rows.filter(row => new Date(`${row.date}T00:00:00`) >= cutoff);
    return filtered.length ? filtered : rows.slice(-Math.min(rows.length, 2));
  }

  function changeLabel(points){
    if (!points.length) return 'No saved history yet';
    if (points.length === 1) return 'Add more snapshots to see change';
    const delta = n(points[points.length - 1].netWorth) - n(points[0].netWorth);
    const label = RANGE_LABELS[state.settings?.accountsChartRange || '1m'] || 'period';
    return `${delta >= 0 ? '+' : '−'}${moneyClean(Math.abs(delta))} ${label} change`;
  }

  function ensureAccountsView(){
    let view = byId('view-accounts');
    if (!view) {
      view = document.createElement('section');
      view.className = 'view';
      view.id = 'view-accounts';
      const networthView = byId('view-networth');
      if (networthView?.parentNode) networthView.parentNode.insertBefore(view, networthView);
      else document.querySelector('.main')?.appendChild(view);
    }
    return view;
  }

  function exportAccountsCsv(){
    const rows = [['name','institution','type','balance','includeNetWorth','updatedAt','notes']]
      .concat(accounts().map(a => [a.name||'', a.institution||'', a.type||'', n(a.balance), a.includeNetWorth!==false, a.updatedAt||'', a.notes||'']));
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadBlob?.(new Blob([csv], {type:'text/csv'}), `moneymap-accounts-${new Date().toISOString().slice(0,10)}.csv`);
  }
  window.exportAccountsCsv = exportAccountsCsv;

  function renderSummaryCard(){
    const mode = state.settings?.accountsSummaryMode || 'totals';
    const breakdown = currentBreakdown();
    const totals = GROUPS.filter(g => g.id !== 'all').map(g => {
      const items = includedAccountsList().filter(a => groupForType(a.type) === g.id);
      const value = items.reduce((sum, item) => sum + Math.abs(signed(item)), 0);
      return {...g, value, items};
    }).filter(row => row.value > 0);
    const assetRows = totals.filter(row => row.id !== 'debt');
    const liabilityRows = totals.filter(row => row.id === 'debt');
    const assetBase = Math.max(1, assetRows.reduce((sum,row) => sum + row.value, 0));
    const liabilityBase = Math.max(1, liabilityRows.reduce((sum,row) => sum + row.value, 0));
    const renderRows = (rows, base, isPercent) => rows.length ? rows.map(row => {
      const percent = Math.round((row.value / base) * 100);
      return `<div class="v09-summary-row"><span class="v09-summary-dot"></span><span>${esc(row.label)}</span><strong>${isPercent ? `${percent}%` : moneyExact(row.value)}</strong></div>`;
    }).join('') : `<div class="v09-summary-empty">Nothing yet</div>`;
    return `
      <div class="v09-summary-head">
        <h3>Summary</h3>
        <div class="v09-toggle">
          <button type="button" class="${mode==='totals'?'active':''}" onclick="setAccountsSummaryMode('totals')">Totals</button>
          <button type="button" class="${mode==='percent'?'active':''}" onclick="setAccountsSummaryMode('percent')">Percent</button>
        </div>
      </div>
      <div class="v09-summary-section">
        <div class="v09-summary-line"><b>Assets</b><strong>${mode==='percent' ? '100%' : moneyExact(breakdown.assets)}</strong></div>
        <div class="v09-summary-bar"><span style="width:100%"></span></div>
        ${renderRows(assetRows, assetBase, mode==='percent')}
      </div>
      <div class="v09-summary-section">
        <div class="v09-summary-line"><b>Liabilities</b><strong>${mode==='percent' ? (breakdown.liabilities ? '100%' : '0%') : moneyExact(breakdown.liabilities)}</strong></div>
        <div class="v09-summary-bar debt"><span style="width:${breakdown.liabilities ? '100%' : '0%'}"></span></div>
        ${renderRows(liabilityRows, liabilityBase, mode==='percent')}
      </div>
      <button type="button" class="v09-export-link" onclick="exportAccountsCsv()">Download CSV</button>`;
  }

  function renderAccountsList(filter){
    const rows = accounts().sort((a,b) => Math.abs(signed(b)) - Math.abs(signed(a)));
    const targetGroups = GROUPS.filter(g => g.id !== 'all').filter(g => filter === 'all' ? true : g.id === filter);
    if (!rows.length) {
      return `<div class="v09-empty-state"><b>No manual accounts yet</b><span>Add a checking account, brokerage balance, property, or debt to start building net worth.</span><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div>`;
    }
    return targetGroups.map(group => {
      const items = rows.filter(a => groupForType(a.type) === group.id);
      if (!items.length) return '';
      const total = items.reduce((sum, item) => sum + Math.abs(signed(item)), 0);
      return `<section class="v09-account-group">
        <div class="v09-group-head">
          <div class="v09-group-head-left"><span class="v09-group-caret">⌄</span><b>${esc(group.label)}</b><span>${items.length} account${items.length===1?'':'s'}</span></div>
          <strong>${moneyExact(total)}</strong>
        </div>
        <div class="v09-group-body">
          ${items.map(item => {
            const value = signed(item);
            const updated = item.updatedAt || item.createdAt || '';
            return `<button type="button" class="v09-account-row" onclick="openDrawer('account', findById('accounts','${esc(item.id)}'))">
              <span class="v09-account-avatar">${esc(group.icon)}</span>
              <span class="v09-account-copy">
                <b>${esc(item.name || 'Account')}</b>
                <span>${esc(item.type || group.label)}${item.institution ? ` · ${esc(item.institution)}` : ''}</span>
              </span>
              <span class="v09-account-side">
                <strong class="${value < 0 ? 'bad' : ''}">${moneyExact(Math.abs(value))}</strong>
                <span>${esc(relativeDateText(updated))}</span>
              </span>
            </button>`;
          }).join('')}
        </div>
      </section>`;
    }).join('') || `<div class="v09-empty-state"><b>No accounts in this view</b><span>Switch filters or add a new account.</span><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div>`;
  }

  function renderAccountsPage(){
    const view = ensureAccountsView();
    if (!view) return;
    const filter = state.settings?.accountsPageFilter || 'all';
    const range = state.settings?.accountsChartRange || '1m';
    const points = chartPoints(range);
    const breakdown = currentBreakdown();
    const liveNet = breakdown.netWorth;
    const change = changeLabel(points);
    const latestSaved = latestHistory().slice(-1)[0];

    view.innerHTML = `
      <div class="v09-accounts-page">
        <div class="page-head v09-head">
          <div><h2 class="section-title">Accounts</h2><p class="section-sub">Manual balances in a cleaner, easier-to-scan layout with faster account entry.</p></div>
          <div class="actions v09-head-actions">
            <button type="button" class="btn" onclick="toggleAccountsFilters()">Filters</button>
            <button type="button" class="btn" onclick="refreshAccountsPage()">Refresh all</button>
            <button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button>
          </div>
        </div>
        <div class="v09-filter-row ${filter!=='all' ? 'open' : ''}" id="v09AccountsFilterRow">
          ${GROUPS.map(group => `<button type="button" class="${filter===group.id?'active':''}" onclick="setAccountsFilter('${group.id}')">${esc(group.label)}</button>`).join('')}
        </div>
        <section class="card v09-hero-card">
          <div class="v09-hero-toolbar">
            <div>
              <div class="v09-kicker">Net worth</div>
              <div class="v09-hero-value">${moneyExact(liveNet)}</div>
              <div class="v09-hero-sub">${esc(change)}${latestSaved ? ` · last snapshot ${esc(typeof dateFmt==='function' ? dateFmt(latestSaved.date) : latestSaved.date)}` : ''}</div>
            </div>
            <div class="v09-hero-controls">
              <select id="v09ChartType"><option>Net worth performance</option></select>
              <select id="v09ChartRange" onchange="setAccountsRange(this.value)">${Object.entries(RANGE_LABELS).map(([value,label]) => `<option value="${value}" ${range===value?'selected':''}>${label}</option>`).join('')}</select>
            </div>
          </div>
          <div class="v09-chart-wrap"><canvas id="v09AccountsChart"></canvas></div>
        </section>
        <div class="v09-main-grid">
          <section class="card v09-list-card">${renderAccountsList(filter)}</section>
          <aside class="card v09-summary-card">${renderSummaryCard()}</aside>
        </div>
      </div>`;
  }

  function getCss(name, fallback=''){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function renderAccountsChart(){
    const canvas = byId('v09AccountsChart');
    if (!canvas || !canvas.offsetParent) return;
    const range = state.settings?.accountsChartRange || '1m';
    const points = chartPoints(range);
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(240, Math.round(rect.height || 260));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);

    const pad = { left: 54, right: 18, top: 18, bottom: 36 };
    const values = points.map(point => n(point.netWorth));
    let min = values.length ? Math.min(...values) : 0;
    let max = values.length ? Math.max(...values) : 0;
    if (min === max) {
      min -= Math.max(50, Math.abs(min) * 0.1 || 50);
      max += Math.max(50, Math.abs(max) * 0.1 || 50);
    }
    const valuePad = Math.max(100, (max - min) * 0.18);
    min -= valuePad;
    max += valuePad;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const x = i => pad.left + (plotW * (points.length === 1 ? 0.5 : i / (points.length - 1)));
    const y = v => pad.top + plotH * (1 - ((v - min) / (max - min || 1)));

    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 1;
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = min + ((max - min) * (i / ticks));
      const yy = y(val);
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(width - pad.right, yy);
      ctx.stroke();
      ctx.fillStyle = getCss('--muted', '#6b7280');
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText(moneyClean(val), 8, yy + 4);
    }

    if (!points.length) return;
    const area = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    area.addColorStop(0, 'rgba(84, 199, 236, 0.24)');
    area.addColorStop(1, 'rgba(84, 199, 236, 0.03)');
    ctx.beginPath();
    points.forEach((point, idx) => {
      const xx = x(idx);
      const yy = y(n(point.netWorth));
      idx ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    });
    ctx.lineTo(x(points.length - 1), height - pad.bottom);
    ctx.lineTo(x(0), height - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = area;
    ctx.fill();

    ctx.beginPath();
    points.forEach((point, idx) => {
      const xx = x(idx);
      const yy = y(n(point.netWorth));
      idx ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
    });
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#54C7EC';
    ctx.stroke();

    points.forEach((point, idx) => {
      const xx = x(idx);
      const yy = y(n(point.netWorth));
      ctx.fillStyle = point.live ? '#1D9BF0' : '#54C7EC';
      ctx.beginPath();
      ctx.arc(xx, yy, point.live ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    });

    const dayRange = points.length > 1 ? (new Date(points[points.length - 1].date) - new Date(points[0].date)) / 86400000 : 0;
    const every = points.length > 8 ? Math.ceil(points.length / 6) : 1;
    ctx.fillStyle = getCss('--muted', '#6b7280');
    ctx.font = '12px Inter, system-ui, sans-serif';
    points.forEach((point, idx) => {
      if (idx % every !== 0 && idx !== points.length - 1) return;
      const stamp = new Date(`${point.date}T00:00:00`);
      const label = dayRange <= 90 ? stamp.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : stamp.toLocaleDateString(undefined, {month:'short', year:'2-digit'});
      ctx.fillText(label, Math.max(0, Math.min(width - 50, x(idx) - 18)), height - 10);
    });
  }

  function accountTitleFromType(type){
    const group = groupMeta(groupForType(type));
    return `${group.label} Account`;
  }

  function openAccountDrawer(data){
    const drawer = byId('drawer');
    const title = byId('drawerTitle');
    const sub = byId('drawerSub');
    const head = drawer?.querySelector('.drawer-head');
    const body = byId('drawerBody');
    if (!drawer || !body || !head || !title || !sub) return;

    const initialGroup = groupForType(data?.type || 'Checking');
    const defaultTypes = groupMeta(initialGroup).types;
    const currentType = data?.type || defaultTypes[0] || 'Checking';
    drawer.classList.add('active', 'v09-account-drawer');
    drawer.setAttribute('aria-hidden', 'false');
    title.textContent = data ? `Edit ${accountTitleFromType(currentType)}` : `Add ${accountTitleFromType(currentType)}`;
    sub.textContent = 'Clean, quick manual entry designed to feel simple on mobile.';
    head.innerHTML = `<button type="button" class="btn btn-square v09-drawer-back" onclick="closeDrawer()" aria-label="Back">←</button><div class="v09-drawer-head-copy"><h3 class="section-title" id="drawerTitle">${esc(title.textContent)}</h3><p class="section-sub" id="drawerSub">${esc(sub.textContent)}</p></div><button type="button" class="btn btn-square drawer-close" onclick="closeDrawer()" aria-label="Close drawer">×</button>`;

    body.innerHTML = `
      <div class="v09-account-form">
        <div class="v09-sheet-card">
          <div class="v09-field">
            <label>Name</label>
            <input class="input" id="acctName" data-autofocus value="${esc(data?.name || '')}" placeholder="Checking">
          </div>
          <div class="v09-field">
            <label>Group</label>
            <div class="v09-chip-grid" id="v09AcctGroupChips">${GROUPS.filter(g => g.id !== 'all').map(group => `<button type="button" class="${group.id===initialGroup?'active':''}" onclick="v09SetAccountGroup('${group.id}')">${esc(group.label)}</button>`).join('')}</div>
            <input type="hidden" id="acctGroup" value="${esc(initialGroup)}">
          </div>
          <div class="v09-field">
            <label>Type</label>
            <select id="acctType" onchange="v09SyncAccountDrawerHead()">${defaultTypes.map(type => `<option ${type===currentType?'selected':''}>${esc(type)}</option>`).join('')}</select>
          </div>
          <div class="v09-field">
            <label>Balance</label>
            <div class="v09-balance-input"><span>$</span><input class="input" id="acctBalance" type="number" inputmode="decimal" step="0.01" value="${data?.balance ?? ''}" placeholder="0.00"></div>
          </div>
        </div>
        <details class="v09-sheet-card v09-optional-details" ${data?.institution || data?.notes ? 'open' : ''}>
          <summary>Optional details</summary>
          <div class="v09-field">
            <label>Institution</label>
            <input class="input" id="acctInstitution" value="${esc(data?.institution || '')}" placeholder="Optional">
          </div>
          <div class="v09-two-up">
            <div class="v09-field">
              <label>Updated</label>
              <input class="input" id="acctUpdated" type="date" value="${esc(String(data?.updatedAt || new Date().toISOString().slice(0,10)).slice(0,10))}">
            </div>
            <div class="v09-field v09-toggle-field">
              <label>Net worth</label>
              <button type="button" class="switch ${data?.includeNetWorth===false ? '' : 'on'}" id="acctInclude" onclick="this.classList.toggle('on')" aria-label="Toggle net worth inclusion"></button>
              <span class="v09-toggle-copy">Include this balance in net worth</span>
            </div>
          </div>
          <div class="v09-field">
            <label>Notes</label>
            <textarea class="input" id="acctNotes" placeholder="Optional">${esc(data?.notes || '')}</textarea>
          </div>
        </details>
        <div class="drawer-actions">
          <button class="btn" onclick="closeDrawer()">Cancel</button>
          <button class="btn btn-primary" onclick="saveAccount('${esc(data?.id || '')}')">Save</button>
          ${data?.id ? `<button class="btn btn-danger" onclick="deleteTrackerItem('accounts','${esc(data.id)}', {closeDrawer:true})">Delete</button>` : ''}
        </div>
      </div>`;

    requestAnimationFrame(() => {
      enhanceDrawerOpen?.('account');
      window.v09SetAccountGroup(initialGroup, currentType, true);
    });
  }

  window.v09SetAccountGroup = function(groupId, desiredType = '', skipRender = false){
    const group = groupMeta(groupId);
    const hidden = byId('acctGroup');
    const select = byId('acctType');
    const chips = byId('v09AcctGroupChips');
    if (hidden) hidden.value = group.id;
    if (chips) [...chips.querySelectorAll('button')].forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === group.label.toLowerCase()));
    if (select) {
      const options = group.types.length ? group.types : ['Other Asset'];
      const current = desiredType || select.value;
      select.innerHTML = options.map(type => `<option ${type===current?'selected':''}>${esc(type)}</option>`).join('');
      if (![...select.options].some(opt => opt.value === current)) select.value = options[0];
    }
    if (!skipRender) window.v09SyncAccountDrawerHead();
  };

  window.v09SyncAccountDrawerHead = function(){
    const type = byId('acctType')?.value || 'Checking';
    const heading = byId('drawerTitle');
    if (heading) heading.textContent = `${byId('acctName')?.value ? 'Edit' : 'Add'} ${accountTitleFromType(type)}`;
  };

  function wrapOpenCloseDrawer(){
    const originalOpenDrawer = window.openDrawer;
    if (typeof originalOpenDrawer === 'function' && !originalOpenDrawer.__v09Wrapped) {
      window.openDrawer = function(type, data){
        if (type === 'account') return openAccountDrawer(data || null);
        return originalOpenDrawer.apply(this, arguments);
      };
      window.openDrawer.__v09Wrapped = true;
    }
    const originalCloseDrawer = window.closeDrawer;
    if (typeof originalCloseDrawer === 'function' && !originalCloseDrawer.__v09Wrapped) {
      window.closeDrawer = function(){
        const drawer = byId('drawer');
        drawer?.classList.remove('v09-account-drawer');
        const result = originalCloseDrawer.apply(this, arguments);
        return result;
      };
      window.closeDrawer.__v09Wrapped = true;
    }
  }

  function renderV09(){
    ensureBuildLabel();
    ensureAccountsNav();
    try { buildNav?.(); buildMobileNav?.(); } catch (e) {}
    renderAccountsPage();
    requestAnimationFrame(renderAccountsChart);
  }

  function wrapRenderFunctions(){
    const originalRenderAll = window.renderAll;
    if (typeof originalRenderAll === 'function' && !originalRenderAll.__v09Wrapped) {
      window.renderAll = function(){
        const result = originalRenderAll.apply(this, arguments);
        requestAnimationFrame(renderV09);
        return result;
      };
      window.renderAll.__v09Wrapped = true;
    }
    const originalShowView = window.showView;
    if (typeof originalShowView === 'function' && !originalShowView.__v09Wrapped) {
      window.showView = function(){
        const result = originalShowView.apply(this, arguments);
        requestAnimationFrame(renderV09);
        return result;
      };
      window.showView.__v09Wrapped = true;
    }
  }

  function init(){
    wrapOpenCloseDrawer();
    wrapRenderFunctions();
    ensureAccountsNav();
    renderV09();
    window.addEventListener('resize', () => requestAnimationFrame(renderAccountsChart), {passive:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 200);
})();
