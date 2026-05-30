/* MoneyMap v0.7 import, home, and net-worth usability refresh.
   Final-loaded patch layer on top of the existing v0.5 bundle. */
(function(){
  'use strict';

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.4';
  let booted = false;

  const moneyText = (value, opts) => {
    try { return money(value, opts); }
    catch(e){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value||0)); }
  };
  const html = value => (typeof escapeHtml === 'function')
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const js = value => (typeof escapeJs === 'function')
    ? escapeJs(String(value ?? ''))
    : String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function allTx(){ return Array.isArray(state?.transactions) ? state.transactions : []; }
  function visibleTx(){ return allTx().filter(t => !t.hidden); }
  function monthOf(value){ try { return monthKey(value); } catch(e){ return String(value || '').slice(0,7); } }
  function dateText(value){ try { return dateFmt(value); } catch(e){ return String(value || ''); } }
  function monthText(value){ try { return monthLabel(value); } catch(e){ return String(value || ''); } }
  function currentMonthKey(){ return (typeof currentMonth === 'function') ? currentMonth() : new Date().toISOString().slice(0,7); }
  function txForMonth(key){ return visibleTx().filter(t => monthOf(t.date) === key); }
  function spendOf(rows){ return (typeof spendingFor === 'function') ? spendingFor(rows) : rows.filter(t=>Number(t.amount)<0 && !t.hidden && !['Transfers','Income'].includes(t.category)).reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0); }
  function incomeOf(rows){ return (typeof incomeFor === 'function') ? incomeFor(rows) : rows.filter(t=>Number(t.amount)>0 && !t.hidden).reduce((a,t)=>a+Number(t.amount||0),0); }
  function categorySpend(rows){ return (typeof byCategory === 'function') ? byCategory(rows) : []; }
  function latestImport(){ return (state?.imports || []).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0] || null; }
  function snapshotRows(){ return (state?.netWorthHistory || []).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))); }
  function todayIso(){ return new Date().toISOString().slice(0,10); }
  function worthNow(){ try { return netWorthBreakdown(); } catch(e){ return {assets:0, liabilities:0, netWorth:0}; } }
  function sortTxDescending(){ state.transactions = allTx().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))); }

  function lastMonths(n=6){
    const base = new Date(currentMonthKey() + '-01T00:00:00');
    return Array.from({length:n}, (_, idx) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (n - 1 - idx), 1);
      return d.toISOString().slice(0,7);
    });
  }

  function spendSeries(n=6){
    return lastMonths(n).map(key => {
      const rows = txForMonth(key);
      return { key, spend: spendOf(rows), income: incomeOf(rows), count: rows.length };
    });
  }

  function nextActionSummary(){
    const txns = allTx();
    const unreviewed = txns.filter(t => !t.reviewed).length;
    const imports = state?.imports || [];
    if(!txns.length) return {
      headline:'Get to your money faster.',
      sub:'Upload a bank export once. MoneyMap maps columns, cleans merchant names, skips duplicates, hides transfers, and keeps a running history automatically.',
      primary:{label:'Upload transactions', action:"showView('import')"},
      secondary:{label:'Try demo data', action:'loadDemoData()'}
    };
    if(unreviewed) return {
      headline:'Review is next.',
      sub:`${unreviewed} transaction${unreviewed===1?'':'s'} still need approval or cleanup before reports are fully trustworthy.`,
      primary:{label:`Review ${unreviewed}`, action:'startWeeklyReview()'},
      secondary:{label:'Import more', action:"showView('import')"}
    };
    if(imports.length) return {
      headline:'Your money is organized.',
      sub:`${monthText(currentMonthKey())} is ready. Add more transactions, save a net-worth snapshot, or keep building history.`,
      primary:{label:'Upload more', action:"showView('import')"},
      secondary:{label:'View transactions', action:"showView('transactions')"}
    };
    return {
      headline:'Keep building history.',
      sub:'Save net-worth snapshots over time and MoneyMap will chart them automatically.',
      primary:{label:'Save net worth', action:'v07SaveSnapshotToday()'},
      secondary:{label:'Open accounts', action:"showView('networth')"}
    };
  }

  function spendBarsHtml(series){
    const max = Math.max(1, ...series.map(m => Number(m.spend || 0)));
    return `<div class="v07-bars">${series.map(m => {
      const spend = Number(m.spend || 0);
      const height = spend <= 0 ? 4 : Math.max(12, Math.round((spend / max) * 100));
      return `<button type="button" class="v07-bar" onclick="v07OpenMonth('${html(m.key)}')" aria-label="Open ${html(monthText(m.key))}"><span class="v07-bar-amt">${spend ? html(moneyText(spend)) : '—'}</span><span class="v07-bar-rail"><span class="v07-bar-fill" style="height:${height}%"></span></span><span class="v07-bar-label"><b>${html(monthText(m.key).split(' ')[0])}</b><br><small>${m.count || 0} tx</small></span></button>`;
    }).join('')}</div>`;
  }

  function categoryRowsHtml(rows, total){
    if(!rows.length) return `<div class="v07-empty"><b>No spending yet</b><span>Import a transaction file and MoneyMap will start charting category spend immediately.</span><button type="button" class="btn btn-primary btn-small" onclick="showView('import')">Upload files</button></div>`;
    return `<div class="v07-category-list">${rows.slice(0,5).map(([name,value], idx) => {
      const pct = total ? Math.max(4, Math.round((value / total) * 100)) : 0;
      return `<button type="button" class="v07-category-row" onclick="showCategoryTransactions('${js(name)}')"><span class="v07-dot" style="background:${idx%2 ? 'var(--accent2)' : 'var(--accent)'}"></span><span class="v07-category-main"><b>${html(name)}</b><span>${pct}% of this month's spend</span><span class="v07-category-meter"><i style="width:${pct}%"></i></span></span><strong>${html(moneyText(value))}</strong></button>`;
    }).join('')}</div>`;
  }

  function importsHtml(){
    const rows = (state?.imports || []).slice(0,5);
    if(!rows.length) return `<div class="v07-empty"><b>No uploads yet</b><span>Your upload history stays local. Each batch records new rows, duplicates skipped, and undo for the latest import.</span></div>`;
    return `<div class="v07-upload-list">${rows.map((row, idx) => {
      const canUndo = idx === 0 && Array.isArray(row.transactionIds) && row.transactionIds.length;
      const label = row.files?.length ? `${row.files.length} file${row.files.length===1?'':'s'}` : (row.file || 'Upload');
      return `<div class="v07-upload-row"><span class="v07-dot"></span><span class="v07-upload-main"><b>${html(label)}</b><span>${html(new Date(row.date).toLocaleDateString())} · ${Number(row.added||0)} added · ${Number(row.dupes||0)} skipped</span></span>${canUndo ? `<button type="button" class="btn btn-small" onclick="undoImport('${html(row.id)}')">Undo</button>` : `<strong>${Number(row.rows||0)} rows</strong>`}</div>`;
    }).join('')}</div>`;
  }

  function renderHomeDashboard(){
    const view = document.getElementById('view-overview');
    if(!view) return;
    view.classList.add('v07-active');
    let shell = document.getElementById('v07HomeDashboard');
    if(!shell){
      shell = document.createElement('section');
      shell.id = 'v07HomeDashboard';
      view.prepend(shell);
    }

    const action = nextActionSummary();
    const currentKey = currentMonthKey();
    const currentRows = txForMonth(currentKey);
    const spend = spendOf(currentRows);
    const income = incomeOf(currentRows);
    const net = income - spend;
    const series = spendSeries(6);
    const snapshotList = snapshotRows();
    const worth = worthNow();
    const latestSnap = snapshotList[snapshotList.length - 1] || null;
    const prevSnap = snapshotList.length > 1 ? snapshotList[snapshotList.length - 2] : null;
    const liveDelta = latestSnap ? Number(worth.netWorth || 0) - Number(latestSnap.netWorth || 0) : 0;
    const snapDelta = latestSnap && prevSnap ? Number(latestSnap.netWorth || 0) - Number(prevSnap.netWorth || 0) : 0;
    const topCats = categorySpend(currentRows);
    const unreviewed = allTx().filter(t => !t.reviewed).length;
    const hidden = allTx().filter(t => t.hidden).length;

    shell.innerHTML = `
      <section class="v07-hero">
        <div class="v07-hero-copy">
          <span class="v07-eyebrow">Home</span>
          <h2>${html(action.headline)}</h2>
          <p>${html(action.sub)}</p>
          <div class="v07-hero-actions">
            <button type="button" class="btn btn-primary" onclick="${action.primary.action}">${html(action.primary.label)}</button>
            <button type="button" class="btn" onclick="${action.secondary.action}">${html(action.secondary.label)}</button>
            <button type="button" class="btn" onclick="v07SaveSnapshotToday()">Save net-worth snapshot</button>
          </div>
          <div class="v07-chip-row">
            <span class="v07-chip">Automatic duplicate guard</span>
            <span class="v07-chip">Merchant name cleanup</span>
            <span class="v07-chip">Transfer hiding</span>
            <span class="v07-chip">Saved import mappings</span>
          </div>
        </div>
        <aside class="v07-hero-side">
          <div class="v07-now-card">
            <div class="v07-now-card-head"><div><span class="v07-muted">Net worth right now</span></div><span class="pill">${snapshotList.length} snapshot${snapshotList.length===1?'':'s'}</span></div>
            <div class="v07-value ${Number(worth.netWorth||0)>=0?'good':'bad'}">${html(moneyText(worth.netWorth))}</div>
            <div class="v07-sub">${latestSnap ? `Last saved ${html(dateText(latestSnap.date))} at ${html(moneyText(latestSnap.netWorth))}` : 'No snapshots saved yet. Save today to start a locked history.'}</div>
            <div class="v07-mini-stats">
              <div class="v07-mini-stat"><span>Assets</span><b class="good">${html(moneyText(worth.assets))}</b></div>
              <div class="v07-mini-stat"><span>Liabilities</span><b class="bad">${html(moneyText(worth.liabilities))}</b></div>
              <div class="v07-mini-stat"><span>Live vs last save</span><b class="${liveDelta>=0?'good':'bad'}">${latestSnap ? `${liveDelta>=0?'+':''}${html(moneyText(liveDelta))}` : '—'}</b></div>
              <div class="v07-mini-stat"><span>Last saved change</span><b class="${snapDelta>=0?'good':'bad'}">${latestSnap && prevSnap ? `${snapDelta>=0?'+':''}${html(moneyText(snapDelta))}` : '—'}</b></div>
            </div>
            <div class="v07-inline-actions"><button type="button" class="btn btn-primary btn-small" onclick="v07SaveSnapshotToday()">Save today's snapshot</button><button type="button" class="btn btn-small" onclick="showView('networth')">Open net worth</button></div>
          </div>
        </aside>
      </section>
      <section class="v07-grid">
        <div class="v07-stack">
          <section class="v07-panel">
            <div class="v07-panel-head"><div><h3>Spending history</h3><p>Actual monthly spend from imported visible transactions.</p></div><span class="pill">6 months</span></div>
            ${spendBarsHtml(series)}
          </section>
          <section class="v07-panel">
            <div class="v07-panel-head"><div><h3>What needs attention</h3><p>One clear path through the app.</p></div></div>
            <div class="v07-action-list">
              <button type="button" class="v07-action-row" onclick="${allTx().length ? (unreviewed ? 'startWeeklyReview()' : "showView('transactions')") : "showView('import')"}"><span class="v07-dot"></span><span class="v07-category-main"><b>${allTx().length ? (unreviewed ? 'Clear the review queue' : 'Browse transactions') : 'Upload transaction files'}</b><span>${allTx().length ? (unreviewed ? `Approve or categorize ${unreviewed} item${unreviewed===1?'':'s'}.` : 'Everything waiting is reviewed. You can inspect, search, or import more.') : 'CSV, TSV, TXT, and other delimited exports are supported.'}</span></span><strong>${allTx().length ? (unreviewed ? 'Review' : 'Open') : 'Upload'}</strong></button>
              <button type="button" class="v07-action-row" onclick="showView('networth')"><span class="v07-dot" style="background:var(--accent2)"></span><span class="v07-category-main"><b>Keep net-worth history running</b><span>${snapshotList.length ? `${snapshotList.length} saved point${snapshotList.length===1?'':'s'} already tracked.` : 'Save your first snapshot so today becomes the baseline.'}</span></span><strong>Track</strong></button>
              <button type="button" class="v07-action-row" onclick="showView('import')"><span class="v07-dot"></span><span class="v07-category-main"><b>Make uploads feel automatic</b><span>MoneyMap remembers mapping profiles, cleans merchants, applies rules, and skips duplicates.</span></span><strong>Import</strong></button>
            </div>
          </section>
        </div>
        <div class="v07-stack">
          <section class="v07-panel">
            <div class="v07-panel-head"><div><h3>${html(monthText(currentKey))}</h3><p>Live month summary from visible transactions.</p></div></div>
            <div class="v07-kpi-grid">
              <div class="v07-kpi"><span>Spent</span><b class="bad">${html(moneyText(spend))}</b><em>${currentRows.length} tracked items</em></div>
              <div class="v07-kpi"><span>Income</span><b class="good">${html(moneyText(income))}</b><em>${hidden} hidden or transfer rows excluded</em></div>
              <div class="v07-kpi"><span>Net cash flow</span><b class="${net>=0?'good':'bad'}">${html(moneyText(net))}</b><em>${unreviewed} unreviewed transaction${unreviewed===1?'':'s'}</em></div>
            </div>
            ${categoryRowsHtml(topCats, spend)}
          </section>
          <section class="v07-panel">
            <div class="v07-panel-head"><div><h3>Recent uploads</h3><p>Running local history so imports stay understandable.</p></div></div>
            ${importsHtml()}
          </section>
        </div>
      </section>`;
  }

  function pendingImportTotals(){
    if(!pendingImport) return null;
    const rows = pendingImport.files?.reduce((sum, file) => sum + Number(file.rows?.length || 0), 0) || 0;
    const files = pendingImport.files?.length || 0;
    const summary = pendingImport.summary || null;
    return { rows, files, summary };
  }

  function renderImportShell(){
    const view = document.getElementById('view-import');
    if(!view) return;
    view.classList.add('v07-active');
    let shell = document.getElementById('v07ImportShell');
    if(!shell){
      shell = document.createElement('section');
      shell.id = 'v07ImportShell';
      view.prepend(shell);
    }

    const totals = pendingImportTotals();
    const last = latestImport();
    const summary = totals?.summary || null;
    const ready = !!summary;
    const files = totals?.files || 0;
    const rows = totals?.rows || 0;
    const statusText = !pendingImport
      ? 'No files loaded yet.'
      : ready
        ? `Ready to import ${summary.totals.added} new transaction${summary.totals.added===1?'':'s'}.`
        : 'Files loaded. Review the mapping and preview below.';

    shell.innerHTML = `
      <section class="v07-import-hero">
        <div class="v07-import-copy">
          <span class="v07-eyebrow">Import</span>
          <h2>Drop files and keep moving.</h2>
          <p>MoneyMap now accepts more delimited exports, remembers mapping profiles, cleans merchant names, auto-sorts transactions by date, skips duplicates, and hides transfer noise before your charts update.</p>
          <div class="v07-import-shell-actions">
            <button type="button" class="btn btn-primary" onclick="document.getElementById('csvInput')?.click()">Choose files</button>
            <button type="button" class="btn" onclick="${pendingImport ? (ready ? 'commitImport()' : 'prepareImportSummary()') : 'downloadSampleCsv()'}">${pendingImport ? (ready ? 'Import now' : 'Review loaded files') : 'Download sample'}</button>
            <button type="button" class="btn" onclick="showView('rules')">Review rules</button>
          </div>
          <div class="v07-chip-row">
            <span class="v07-file-pill">CSV</span>
            <span class="v07-file-pill">TSV</span>
            <span class="v07-file-pill">TXT exports</span>
            <span class="v07-file-pill">Semicolon-delimited</span>
            <span class="v07-file-pill">Pipe-delimited</span>
          </div>
        </div>
        <aside class="v07-import-banner">
          <div class="v07-import-head"><div><h3>Import status</h3><p>${html(statusText)}</p></div><span class="pill">${last ? `Last ${html(new Date(last.date).toLocaleDateString())}` : 'First import'}</span></div>
          <div class="v07-import-stats">
            <div class="v07-import-stat"><span>Files loaded</span><b>${files}</b></div>
            <div class="v07-import-stat"><span>Rows found</span><b>${rows}</b></div>
            <div class="v07-import-stat"><span>New rows</span><b class="good">${ready ? summary.totals.added : '—'}</b></div>
            <div class="v07-import-stat"><span>Duplicates skipped</span><b class="warn">${ready ? summary.totals.dupes : '—'}</b></div>
          </div>
          <div class="v07-import-note">MoneyMap keeps a local import log, stores the latest mappings, and lets you undo the newest import batch.</div>
        </aside>
      </section>
      <section class="v07-panel">
        <div class="v07-upload-head"><div><h3>What happens automatically</h3><p>Less cleanup work after every upload.</p></div><span class="pill">Autopilot</span></div>
        <div class="v07-helper">
          <div class="v07-helper-card"><b>Smarter file support</b><span>Delimiter detection handles comma, tab, semicolon, and pipe-separated exports instead of only basic CSV files.</span></div>
          <div class="v07-helper-card"><b>Cleaner transactions</b><span>Merchant names are normalized on import, known mappings are reused, and repeated banks keep their saved column profile.</span></div>
          <div class="v07-helper-card"><b>Lower-friction review</b><span>Duplicate rows are skipped, transfers are hidden, rules are applied, and imported transactions are immediately sorted into your live history.</span></div>
        </div>
      </section>`;
  }

  // Import parsing and import workflow moved to src/js/import/*.js.

  window.v07OpenMonth = function(key){
    try { showView('transactions'); } catch(e) {}
    requestAnimationFrame(() => {
      const sel = document.getElementById('filterMonth');
      if(sel) sel.value = key;
      if(typeof renderAll === 'function') renderAll();
    });
  };

  window.v07SaveSnapshotToday = function(){
    const dateInput = document.getElementById('netWorthSnapshotDate');
    const noteInput = document.getElementById('netWorthSnapshotNote');
    if(dateInput) dateInput.value = todayIso();
    if(noteInput && !noteInput.value) noteInput.value = 'Saved from Home';
    try { showView('networth'); } catch(e) {}
    requestAnimationFrame(() => {
      if(dateInput) dateInput.value = todayIso();
      try { saveNetWorthSnapshot(); } catch(e) {}
      renderV07();
    });
  };

  window.renderNetWorthChart = function(){
    const canvas = document.getElementById('netWorthCanvas');
    if(!canvas || !canvas.closest('.view.active')) return;
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(640, rect.width * dpr);
    canvas.height = Math.max(280, rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const history = snapshotRows().map(row => ({...row, live:false}));
    const live = worthNow();
    const liveRow = {date: todayIso(), netWorth: live.netWorth, assets: live.assets, liabilities: live.liabilities, note:'Live balance', live:true};
    const lastSaved = history[history.length - 1];
    if(!lastSaved || String(lastSaved.date) !== String(liveRow.date) || Math.abs(Number(lastSaved.netWorth || 0) - Number(liveRow.netWorth || 0)) > 0.01) history.push(liveRow);
    const rows = history.slice(-36);
    const legend = document.getElementById('netWorthLegend');
    const note = document.querySelector('#view-networth .chart-hover-note');
    const tip = document.getElementById('netWorthChartTip');
    if(tip){ tip.classList.remove('visible'); tip.setAttribute('aria-hidden', 'true'); }

    if(!rows.length){
      if(legend) legend.innerHTML = '<span class="chart-legend-title">No snapshot data</span>';
      if(note) note.textContent = 'Save a snapshot to lock today into your history.';
      ctx.fillStyle = getCss('--muted');
      ctx.font = '14px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText('Save a net-worth snapshot to start the trend.', 20, 40);
      return;
    }

    const vals = rows.map(r => Number(r.netWorth || 0));
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if(min === max){ min -= Math.max(100, Math.abs(min) * 0.08 || 100); max += Math.max(100, Math.abs(max) * 0.08 || 100); }
    const padValue = Math.max(100, (max - min) * 0.15);
    min -= padValue;
    max += padValue;
    const pad = {l: 56, r: 18, t: 18, b: 42};
    const xFor = i => pad.l + (w - pad.l - pad.r) * (rows.length === 1 ? 0.5 : i / (rows.length - 1));
    const yFor = v => pad.t + (h - pad.t - pad.b) * (1 - ((v - min) / (max - min || 1)));

    [0,0.5,1].forEach(step => {
      const v = min + (max - min) * step;
      const y = yFor(v);
      ctx.strokeStyle = 'rgba(148,163,184,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(w - pad.r, y);
      ctx.stroke();
      ctx.fillStyle = getCss('--muted');
      ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      ctx.fillText(moneyText(v), 8, y + 4);
    });

    const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    grad.addColorStop(0, 'rgba(255,159,110,.24)');
    grad.addColorStop(1, 'rgba(255,159,110,0)');
    ctx.beginPath();
    rows.forEach((row, idx) => {
      const x = xFor(idx), y = yFor(Number(row.netWorth || 0));
      idx ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.lineTo(xFor(rows.length - 1), h - pad.b);
    ctx.lineTo(xFor(0), h - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = getCss('--accent');
    ctx.lineWidth = 3;
    ctx.beginPath();
    rows.forEach((row, idx) => {
      const x = xFor(idx), y = yFor(Number(row.netWorth || 0));
      idx ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();

    rows.forEach((row, idx) => {
      const x = xFor(idx), y = yFor(Number(row.netWorth || 0));
      ctx.fillStyle = row.live ? getCss('--blue') || '#68b8ff' : getCss('--accent');
      ctx.beginPath();
      ctx.arc(x, y, row.live ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if(row.live){
        ctx.strokeStyle = 'rgba(255,255,255,.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.fillStyle = getCss('--muted');
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    const totalDays = (new Date(rows[rows.length - 1].date) - new Date(rows[0].date)) / (1000 * 60 * 60 * 24 || 1);
    const labelEvery = rows.length > 14 ? Math.ceil(rows.length / 7) : 1;
    rows.forEach((row, idx) => {
      if(idx % labelEvery !== 0 && idx !== rows.length - 1) return;
      const d = new Date(String(row.date) + 'T00:00:00');
      const label = totalDays <= 120
        ? d.toLocaleDateString(undefined, {month:'short', day:'numeric'})
        : d.toLocaleDateString(undefined, {month:'short', year:'2-digit'});
      ctx.fillText(label, Math.max(0, Math.min(w - 48, xFor(idx) - 22)), h - 12);
    });

    if(legend){
      const last = rows[rows.length - 1];
      const previous = rows.length > 1 ? rows[rows.length - 2] : null;
      const delta = previous ? Number(last.netWorth || 0) - Number(previous.netWorth || 0) : 0;
      legend.innerHTML = `<span class="chart-legend-title">${html(last.live ? 'Live net worth' : 'Latest snapshot')}</span><span class="legend-chip"><span class="chart-swatch" style="background:${getCss('--accent')};color:${getCss('--accent')}"></span>${html(moneyText(last.netWorth))}</span>${previous ? `<span class="legend-chip">${delta>=0?'+':''}${html(moneyText(delta))} since previous</span>` : ''}`;
    }
    if(note) note.textContent = rows.some(r => r.live) ? 'The blue point is your live balance today. Saved snapshots remain fixed in history.' : 'Each saved snapshot stays fixed even when current balances change later.';
  };

  function enhanceImportUi(){
    const input = document.getElementById('csvInput');
    if(input) input.setAttribute('accept', '.csv,.txt,.tsv,.tab,.psv,text/csv,text/plain');
    const dz = document.getElementById('dropzone');
    if(dz && !dz.dataset.v07ClickBound){
      dz.dataset.v07ClickBound = '1';
      dz.addEventListener('click', evt => {
        if(evt.target && evt.target.id === 'csvInput') return;
        document.getElementById('csvInput')?.click();
      });
    }
  }

  function markBuild(){
    window.MONEYMAP_EXPECTED_BUILD = BUILD;
    document.documentElement.setAttribute('data-moneymap-build', BUILD);
    const meta = document.querySelector('meta[name="moneymap-build"]');
    if(meta) meta.setAttribute('content', BUILD);
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
  }

  function renderV07(){
    markBuild();
    enhanceImportUi();
    renderHomeDashboard();
    renderImportShell();
  }

  function wrapRender(){
    const oldRenderAll = window.renderAll;
    if(typeof oldRenderAll === 'function' && !oldRenderAll.__v07Wrapped){
      window.renderAll = function(){
        const result = oldRenderAll.apply(this, arguments);
        requestAnimationFrame(renderV07);
        return result;
      };
      window.renderAll.__v07Wrapped = true;
    }
    const oldShowView = window.showView;
    if(typeof oldShowView === 'function' && !oldShowView.__v07Wrapped){
      window.showView = function(){
        const result = oldShowView.apply(this, arguments);
        requestAnimationFrame(renderV07);
        return result;
      };
      window.showView.__v07Wrapped = true;
    }
  }

  function init(){
    if(booted) return;
    booted = true;
    wrapRender();
    renderV07();
    window.addEventListener('resize', () => requestAnimationFrame(renderV07), {passive:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 250);
})();
