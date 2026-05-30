/* MoneyMap v0.6 mobile import, dashboard, transactions, and accounts refresh.
   Final-loaded patch layer. Keeps localStorage shape unchanged. */
(function(){
  'use strict';

  const BUILD = 'v0.6';
  const MONTH_COUNT = 6;
  let accountFilter = 'all';
  let initialized = false;

  const moneyText = (value, opts) => {
    try { return money(value, opts); }
    catch (e) { return new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(Number(value || 0)); }
  };
  const html = value => (typeof escapeHtml === 'function')
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const js = value => (typeof escapeJs === 'function')
    ? escapeJs(String(value ?? ''))
    : String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const dateLabel = value => { try { return dateFmt(value); } catch(e) { return String(value || ''); } };
  const monthOf = value => { try { return monthKey(value); } catch(e) { return String(value || '').slice(0,7); } };
  const labelMonth = value => { try { return monthLabel(value); } catch(e) { return String(value || ''); } };
  const signedAccountValue = a => { try { return accountSignedValue(a); } catch(e) { return Number(a?.balance || 0); } };

  function markBuild(){
    try {
      window.MONEYMAP_EXPECTED_BUILD = BUILD;
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      const meta = document.querySelector('meta[name="moneymap-build"]');
      if(meta) meta.setAttribute('content', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
    } catch(e) {}
  }

  function setBackupBuild(){
    const old = window.backupPayload;
    if(typeof old === 'function' && !old.__v06BuildWrapped){
      window.backupPayload = function(){
        const payload = old.apply(this, arguments);
        if(payload){ payload.build = BUILD; payload.releaseStage = BUILD; }
        return payload;
      };
      window.backupPayload.__v06BuildWrapped = true;
    }
  }

  function allTx(){ return Array.isArray(state?.transactions) ? state.transactions : []; }
  function visibleTx(){ return allTx().filter(t => !t.hidden); }
  function spending(txns){
    if(typeof spendingFor === 'function') return spendingFor(txns);
    return txns.filter(t => Number(t.amount) < 0 && !t.hidden && !['Transfers','Income'].includes(t.category)).reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0);
  }
  function income(txns){
    if(typeof incomeFor === 'function') return incomeFor(txns);
    return txns.filter(t => Number(t.amount) > 0 && !t.hidden).reduce((a,t)=>a+Number(t.amount||0),0);
  }
  function cats(txns){
    if(typeof byCategory === 'function') return byCategory(txns);
    const map = {};
    txns.filter(t=>Number(t.amount)<0 && !t.hidden && !['Transfers','Income'].includes(t.category)).forEach(t=>{ map[t.category||'Other']=(map[t.category||'Other']||0)+Math.abs(Number(t.amount||0)); });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function txForMonth(key){
    if(typeof monthTransactions === 'function') return monthTransactions(key);
    return visibleTx().filter(t => monthOf(t.date) === key);
  }
  function currentMonthKey(){ return (typeof currentMonth === 'function') ? currentMonth() : new Date().toISOString().slice(0,7); }

  function lastMonths(n = MONTH_COUNT){
    const now = new Date(currentMonthKey() + '-01T00:00:00');
    return Array.from({length:n}, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - idx), 1);
      return d.toISOString().slice(0,7);
    });
  }
  function spendSeries(){
    const keys = new Set(allTx().map(t => monthOf(t.date)).filter(Boolean));
    lastMonths(MONTH_COUNT).forEach(k => keys.add(k));
    return Array.from(keys).sort().slice(-MONTH_COUNT).map(key => {
      const rows = txForMonth(key);
      return {key, spend: spending(rows), income: income(rows), txns: rows.length};
    });
  }
  function spendAverage(series){
    const nonzero = series.filter(m => m.spend > 0);
    return nonzero.length ? nonzero.reduce((a,m)=>a+m.spend,0) / nonzero.length : 0;
  }
  function lastImport(){ return (state?.imports || []).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0] || null; }
  function topMerchantRows(limit = 4){
    const map = {};
    txForMonth(currentMonthKey()).filter(t => Number(t.amount) < 0 && !t.hidden && !['Transfers','Income'].includes(t.category)).forEach(t => {
      const name = t.description || 'Merchant';
      if(!map[name]) map[name] = {name, amount:0, count:0, category:t.category || 'Other'};
      map[name].amount += Math.abs(Number(t.amount || 0));
      map[name].count += 1;
    });
    return Object.values(map).sort((a,b)=>b.amount-a.amount).slice(0, limit);
  }

  function renderTrendBars(series){
    const max = Math.max(1, ...series.map(m => m.spend));
    return `<div class="v06-trend-bars">${series.map(m => `<button type="button" class="v06-trend-bar" onclick="v06SetTransactionsMonth('${html(m.key)}')" aria-label="Open ${html(labelMonth(m.key))} spending"><span class="v06-trend-fill" style="height:${Math.max(8, Math.round((m.spend / max) * 100))}%"></span><b>${html(labelMonth(m.key).split(' ')[0])}</b><em>${moneyText(m.spend)}</em></button>`).join('')}</div>`;
  }
  function renderCategoryBars(rows, total){
    if(!rows.length) return `<div class="v06-empty"><b>No spending yet</b><span>Import a CSV and this turns into your monthly spend map.</span><button type="button" class="btn btn-small btn-primary" onclick="showView('import')">Import CSV</button></div>`;
    return `<div class="v06-category-list">${rows.slice(0,5).map(([name,value], idx) => `<button type="button" class="v06-category-row" onclick="showCategoryTransactions('${js(name)}')"><span class="v06-cat-dot c${idx%6}"></span><span class="v06-cat-copy"><b>${html(name)}</b><em>${Math.round((value/(total||1))*100)}% of spending</em><i><span style="width:${Math.max(4, Math.round((value/(total||1))*100))}%"></span></i></span><strong>${moneyText(value)}</strong></button>`).join('')}</div>`;
  }

  function renderHomeLanding(){
    const view = document.getElementById('view-overview');
    if(!view) return;
    view.classList.add('v06-home-active');
    let el = document.getElementById('v06HomeLanding');
    if(!el){
      el = document.createElement('section');
      el.id = 'v06HomeLanding';
      view.insertBefore(el, view.firstElementChild || null);
    }
    const key = currentMonthKey();
    const monthRows = txForMonth(key);
    const monthSpend = spending(monthRows);
    const monthIncome = income(monthRows);
    const net = monthIncome - monthSpend;
    const unreviewed = allTx().filter(t => !t.reviewed).length;
    const hidden = allTx().filter(t => t.hidden).length;
    const series = spendSeries();
    const avg = spendAverage(series);
    const trend = series.length > 1 ? monthSpend - (series[series.length - 2]?.spend || 0) : 0;
    const importRec = lastImport();
    const categoryRows = cats(monthRows);
    const totalAccounts = (state?.accounts || []).length;
    let worth = {netWorth:0, assets:0, liabilities:0};
    try { worth = netWorthBreakdown(); } catch(e) {}
    const firstTime = !allTx().length;
    const headline = firstTime ? 'Start with one upload.' : (unreviewed ? 'You have transactions to review.' : 'Your month is organized.');
    const subline = firstTime
      ? 'Upload a CSV and MoneyMap cleans names, skips duplicates, hides transfers, builds spending charts, and keeps an import history.'
      : `${html(labelMonth(key))} is live. ${monthRows.length} transactions are tracked, ${hidden} transfers or hidden items are out of the charts.`;
    const primary = firstTime
      ? `<button type="button" class="btn btn-primary" onclick="showView('import')">Upload transactions</button>`
      : (unreviewed ? `<button type="button" class="btn btn-primary" onclick="startWeeklyReview()">Review ${unreviewed}</button>` : `<button type="button" class="btn btn-primary" onclick="showView('transactions')">View transactions</button>`);
    const secondary = firstTime
      ? `<button type="button" class="btn" onclick="loadDemoData()">Try demo</button>`
      : `<button type="button" class="btn" onclick="showView('import')">Import more</button>`;
    const merchantRows = topMerchantRows(4);

    el.innerHTML = `<div class="v06-hero-card">
      <div class="v06-hero-copy">
        <span class="v06-eyebrow">MoneyMap home</span>
        <h2>${html(headline)}</h2>
        <p>${subline}</p>
        <div class="v06-hero-actions">${primary}${secondary}<button type="button" class="btn" onclick="openDrawer('quickAdd')">Add manually</button></div>
        <div class="v06-flow-strip" aria-label="Import flow"><span>Upload</span><i></i><span>Clean</span><i></i><span>Chart</span><i></i><span>Review</span></div>
      </div>
      <div class="v06-phone-card" aria-label="Current money summary">
        <div class="v06-phone-top"><span>This month</span><b>${html(labelMonth(key))}</b></div>
        <div class="v06-phone-amount ${net>=0?'good':'bad'}">${moneyText(net)}</div>
        <div class="v06-phone-sub">${moneyText(monthIncome)} in · ${moneyText(monthSpend)} out</div>
        ${renderTrendBars(series)}
      </div>
    </div>
    <div class="v06-kpi-grid">
      <button type="button" class="v06-kpi" onclick="showView('transactions')"><span>Monthly spend</span><b class="bad">${moneyText(monthSpend)}</b><em>${trend === 0 ? 'Current month' : `${trend > 0 ? '+' : ''}${moneyText(trend)} vs last month`}</em></button>
      <button type="button" class="v06-kpi" onclick="showView('transactions')"><span>Income tracked</span><b class="good">${moneyText(monthIncome)}</b><em>${moneyText(avg)} average spend history</em></button>
      <button type="button" class="v06-kpi" onclick="startWeeklyReview()"><span>Review queue</span><b class="${unreviewed?'warn':'good'}">${unreviewed}</b><em>${unreviewed ? 'Clean, categorize, approve' : 'Nothing waiting'}</em></button>
      <button type="button" class="v06-kpi" onclick="showView('accounts')"><span>Net worth</span><b class="${worth.netWorth>=0?'good':'bad'}">${moneyText(worth.netWorth)}</b><em>${totalAccounts ? `${totalAccounts} manual account${totalAccounts===1?'':'s'}` : 'Add balances when ready'}</em></button>
    </div>
    <div class="v06-home-grid">
      <section class="v06-panel wide"><div class="v06-panel-head"><div><b>Spending by category</b><span>Automatic chart from imported transactions</span></div><button type="button" class="btn btn-small" onclick="showView('transactions')">Open</button></div>${renderCategoryBars(categoryRows, monthSpend)}</section>
      <section class="v06-panel"><div class="v06-panel-head"><div><b>Import history</b><span>Every upload stays undoable when possible</span></div><button type="button" class="btn btn-small" onclick="showView('import')">Upload</button></div>${renderImportHistoryMini(importRec)}</section>
      <section class="v06-panel"><div class="v06-panel-head"><div><b>Largest merchants</b><span>Quick scan of the month</span></div><button type="button" class="btn btn-small" onclick="v06SetTransactionsMonth('${html(key)}')">Filter</button></div>${merchantRows.length ? merchantRows.map(m => `<button type="button" class="v06-mini-row" onclick="v06SearchTransactions('${js(m.name)}')"><span><b>${html(m.name)}</b><em>${m.count} charge${m.count===1?'':'s'} · ${html(m.category)}</em></span><strong>${moneyText(m.amount)}</strong></button>`).join('') : `<div class="v06-empty small"><b>No merchants yet</b><span>Upload transactions to see spending patterns.</span></div>`}</section>
    </div>`;
  }

  function renderImportHistoryMini(importRec){
    if(!importRec) return `<div class="v06-empty small"><b>No uploads yet</b><span>Your CSV history, duplicate counts, and undo option will appear here.</span><button type="button" class="btn btn-small btn-primary" onclick="showView('import')">Upload CSV</button></div>`;
    const rows = (state.imports || []).slice(0,4);
    return `<div class="v06-import-mini-list">${rows.map((r, idx) => `<div class="v06-import-mini"><span><b>${html((r.files?.length ? `${r.files.length} file${r.files.length>1?'s':''}` : r.file || 'CSV import'))}</b><em>${html(new Date(r.date).toLocaleDateString())} · ${Number(r.added||0)} added · ${Number(r.dupes||0)} skipped</em></span>${idx===0 && Array.isArray(r.transactionIds) && r.transactionIds.length ? `<button type="button" class="btn btn-small" onclick="undoImport('${html(r.id)}')">Undo</button>` : `<i>Saved</i>`}</div>`).join('')}</div>`;
  }

  function requiredMappingsReady(){
    try { return !!(pendingImport && !validateImportMappings().length); }
    catch(e){ return false; }
  }
  function pendingTotals(){
    if(!pendingImport) return null;
    const summary = pendingImport.summary;
    if(summary) return summary.totals;
    const files = pendingImport.files || [];
    const rows = files.reduce((a,f)=>a+(f.rows?.length || 0),0);
    return {rows, added:0, dupes:0, autoHidden:0, ruleApplied:0, transfers:0};
  }

  function renderImportCoach(){
    const view = document.getElementById('view-import');
    if(!view) return;
    view.classList.add('v06-import-active');
    let el = document.getElementById('v06ImportCoach');
    if(!el){
      el = document.createElement('section');
      el.id = 'v06ImportCoach';
      const head = view.querySelector('.page-head');
      (head || view.firstElementChild)?.after(el);
    }
    const files = pendingImport?.files || [];
    const totals = pendingTotals();
    const ready = requiredMappingsReady();
    const summary = pendingImport?.summary;
    const last = lastImport();
    const statusTitle = !files.length ? 'Upload and MoneyMap does the cleanup.' : (summary ? 'Ready to save this import.' : ready ? 'Columns detected. Review is ready.' : 'A column needs your attention.');
    const statusText = !files.length
      ? 'Choose one or more CSVs. Saved mappings, duplicate detection, transfer hiding, merchant cleanup, and spending charts run locally.'
      : (summary ? `${summary.totals.added} new transactions, ${summary.totals.dupes} duplicates skipped, ${summary.totals.transfers || 0} transfers detected.` : ready ? `${files.length} file${files.length===1?'':'s'} loaded. Tap Review and import to save immediately.` : 'Check date, merchant, and amount mapping. After the required fields match, the batch can be imported in one tap.');
    const action = !files.length
      ? `<button type="button" class="btn btn-primary" onclick="document.getElementById('csvInput')?.click()">Choose CSV</button>`
      : (summary ? `<button type="button" class="btn btn-primary" onclick="commitImport()">Import now</button>` : `<button type="button" class="btn btn-primary" onclick="v06ReviewAndImport()">Review and import</button>`);
    el.innerHTML = `<div class="v06-import-card">
      <div class="v06-import-copy"><span class="v06-eyebrow">Automatic import</span><h3>${html(statusTitle)}</h3><p>${html(statusText)}</p><div class="v06-import-actions">${action}<button type="button" class="btn" onclick="downloadSampleCsv()">Sample CSV</button></div></div>
      <div class="v06-import-stats"><div><span>Rows found</span><b>${totals ? totals.rows : 0}</b></div><div><span>New</span><b class="good">${summary ? summary.totals.added : '—'}</b></div><div><span>Skipped</span><b class="warn">${summary ? summary.totals.dupes : '—'}</b></div><div><span>Rules</span><b>${summary ? summary.totals.ruleApplied : (state?.rules || []).length}</b></div></div>
    </div>
    <div class="v06-import-timeline"><span class="${files.length?'done':''}">1 Upload</span><i></i><span class="${ready?'done':''}">2 Auto-map</span><i></i><span class="${summary?'done':''}">3 Preview</span><i></i><span>4 Dashboard</span></div>
    <div class="v06-import-history-inline">${last ? `<span>Last upload</span><b>${html(new Date(last.date).toLocaleDateString())}</b><em>${Number(last.added||0)} added · ${Number(last.dupes||0)} skipped</em>` : `<span>History</span><b>No uploads yet</b><em>MoneyMap keeps a local running import log.</em>`}</div>`;
  }

  window.v06ReviewAndImport = function(){
    if(!pendingImport){ document.getElementById('csvInput')?.click(); return; }
    if(!pendingImport.summary){
      if(typeof prepareImportSummary === 'function') prepareImportSummary();
      renderImportCoach();
      return;
    }
    if(typeof commitImport === 'function') commitImport();
  };

  function autoPrepareImport(){
    if(!pendingImport || pendingImport.summary || !requiredMappingsReady()) return;
    try {
      if(typeof prepareImportSummary === 'function') prepareImportSummary();
    } catch(e) {}
    renderImportCoach();
  }

  function renderTransactionsPolish(){
    const view = document.getElementById('view-transactions');
    if(!view) return;
    view.classList.add('v06-transactions-active');
    let el = document.getElementById('v06TxSummary');
    if(!el){
      el = document.createElement('section');
      el.id = 'v06TxSummary';
      const card = view.querySelector('.card');
      view.insertBefore(el, card || view.firstElementChild?.nextSibling || null);
    }
    const rows = (typeof visibleTransactions === 'function') ? visibleTransactions() : visibleTx();
    const spendRows = rows.filter(t => Number(t.amount) < 0 && !t.hidden && !['Transfers','Income'].includes(t.category));
    const incomeRows = rows.filter(t => Number(t.amount) > 0 && !t.hidden);
    const needsReview = allTx().filter(t => !t.reviewed).length;
    const month = document.getElementById('filterMonth')?.value || currentMonthKey();
    el.innerHTML = `<div class="v06-tx-toolbar"><div><span class="v06-eyebrow">Clean transaction list</span><h3>${rows.length} transaction${rows.length===1?'':'s'}</h3><p>Grouped on mobile, searchable by merchant, category, account, amount, and notes.</p></div><div class="v06-tx-actions"><button type="button" class="btn btn-primary" onclick="showView('import')">Import CSV</button><button type="button" class="btn" onclick="cleanVisibleMerchants()">Clean visible</button></div></div><div class="v06-tx-chips"><button type="button" onclick="v06SetTxFilter('visibility','unreviewed')"><b>${needsReview}</b><span>Needs review</span></button><button type="button" onclick="v06SetTxFilter('amountType','spend')"><b>${moneyText(spendRows.reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0))}</b><span>Spending</span></button><button type="button" onclick="v06SetTxFilter('amountType','income')"><b>${moneyText(incomeRows.reduce((a,t)=>a+Number(t.amount||0),0))}</b><span>Income</span></button><button type="button" onclick="v06SetTransactionsMonth('${html(month === 'all' ? currentMonthKey() : month)}')"><b>${html(month === 'all' ? 'All' : labelMonth(month).split(' ')[0])}</b><span>Month</span></button></div>`;
    renderGroupedTransactionCards(rows);
  }

  function renderGroupedTransactionCards(rows){
    const el = document.getElementById('transactionCards');
    if(!el) return;
    if(!rows.length){
      el.innerHTML = `<div class="v06-empty"><b>No matching transactions</b><span>Try changing filters, importing a CSV, or adding one manually.</span><div><button type="button" class="btn btn-primary" onclick="showView('import')">Import CSV</button><button type="button" class="btn" onclick="openDrawer('quickAdd')">Add manually</button></div></div>`;
      return;
    }
    const groups = {};
    rows.forEach(t => { const key = String(t.date || '').slice(0,10) || 'Undated'; (groups[key] ||= []).push(t); });
    el.innerHTML = Object.entries(groups).slice(0,28).map(([date, items]) => {
      const total = items.reduce((a,t)=>a+Number(t.amount||0),0);
      return `<section class="v06-tx-day"><div class="v06-tx-day-head"><span>${html(date === 'Undated' ? date : dateLabel(date))}</span><b class="${total<0?'bad':'good'}">${moneyText(total)}</b></div>${items.map(txCard).join('')}</section>`;
    }).join('');
  }

  function txCard(t){
    const amt = Number(t.amount || 0);
    const initial = String(t.description || '?').trim().slice(0,1).toUpperCase() || '?';
    const messy = typeof merchantLooksMessy === 'function' ? merchantLooksMessy(t.rawDescription || t.description) : false;
    const status = t.hidden ? 'Hidden' : (t.reviewed ? 'Clean' : 'Review');
    return `<button type="button" class="v06-tx-card ${t.reviewed?'reviewed':'needs-review'}" onclick="editTransaction('${html(t.id)}')"><span class="v06-tx-avatar">${html(initial)}</span><span class="v06-tx-main"><b>${html(t.description || 'Transaction')}</b><em>${html(t.category || 'Other')} · ${html(t.account || 'General')}${messy ? ' · can clean' : ''}</em></span><span class="v06-tx-side"><strong class="${amt<0?'bad':'good'}">${moneyText(amt)}</strong><i class="${t.reviewed?'good':t.hidden?'':'warn'}">${html(status)}</i></span></button>`;
  }

  window.v06SetTxFilter = function(kind, value){
    const ids = {visibility:'filterVisibility', amountType:'filterAmountType', category:'filterCategory', account:'filterAccount'};
    const el = document.getElementById(ids[kind]);
    if(el){ el.value = value; if(typeof renderAll === 'function') renderAll(); }
  };
  window.v06SetTransactionsMonth = function(key){
    if(typeof showView === 'function') showView('transactions');
    requestAnimationFrame(() => {
      const m = document.getElementById('filterMonth');
      if(m){ m.value = key; }
      const v = document.getElementById('filterVisibility');
      if(v && v.value === 'hidden') v.value = 'visible';
      if(typeof renderAll === 'function') renderAll();
    });
  };
  window.v06SearchTransactions = function(query){
    if(typeof showView === 'function') showView('transactions');
    requestAnimationFrame(() => {
      const input = document.getElementById('transactionSearch');
      const month = document.getElementById('filterMonth');
      if(month) month.value = 'all';
      if(input) input.value = query;
      if(typeof renderAll === 'function') renderAll();
    });
  };

  const GROUPS = [
    ['all','All','Everything together','●'],
    ['cash','Cash','Checking, savings, money market','＄'],
    ['investments','Investments','Brokerage, retirement, HSA','△'],
    ['property','Property','Home, vehicle, real assets','⌂'],
    ['valuables','Valuables','Jewelry, metals, collectibles','◆'],
    ['debt','Debt','Cards, loans, mortgages','−'],
    ['other','Other','Everything else','•']
  ];
  function accountGroup(a){
    const text = `${a?.type || ''} ${a?.name || ''} ${a?.institution || ''}`.toLowerCase();
    const val = signedAccountValue(a);
    if(val < 0 || /credit|card|loan|debt|mortgage|liability/.test(text)) return 'debt';
    if(/checking|savings|cash|money market|bank/.test(text)) return 'cash';
    if(/brokerage|investment|retirement|401|ira|roth|hsa|crypto|stock|bond|fund/.test(text)) return 'investments';
    if(/home|house|property|real estate|vehicle|car|auto|boat/.test(text)) return 'property';
    if(/valuable|jewelry|collectible|gold|silver|metal|art|watch/.test(text)) return 'valuables';
    return 'other';
  }
  function groupMeta(id){ return GROUPS.find(g => g[0] === id) || GROUPS[GROUPS.length - 1]; }
  function groupAccounts(accounts, id){ return id === 'all' ? accounts : accounts.filter(a => accountGroup(a) === id); }
  function groupTotal(accounts, id){ return groupAccounts(accounts, id).filter(a => a.includeNetWorth !== false).reduce((a,x)=>a+signedAccountValue(x),0); }

  window.setAccountGroupFilter = function(id){
    accountFilter = GROUPS.some(g => g[0] === id) ? id : 'all';
    renderAccountsDashboardV06();
  };

  function renderAccountsDashboardV06(){
    ensureAccountsViewV06();
    const accounts = state?.accounts || [];
    const included = accounts.filter(a => a.includeNetWorth !== false);
    const assets = included.reduce((s,a)=>s+Math.max(0, signedAccountValue(a)),0);
    const liabilities = included.reduce((s,a)=>s+Math.abs(Math.min(0, signedAccountValue(a))),0);
    const filtered = groupAccounts(accounts, accountFilter);
    const metrics = document.getElementById('accountsMetrics');
    if(metrics){
      metrics.className = 'v06-account-hero';
      metrics.innerHTML = `<section class="v06-account-net"><span>Included net value</span><strong class="${assets-liabilities>=0?'good':'bad'}">${moneyText(assets-liabilities)}</strong><p>${included.length} included of ${accounts.length} account${accounts.length===1?'':'s'}.</p><div><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button><button type="button" class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button></div></section><section class="v06-account-mini"><span>Assets</span><b class="good">${moneyText(assets)}</b></section><section class="v06-account-mini"><span>Debt</span><b class="bad">${moneyText(liabilities)}</b></section><section class="v06-account-mini"><span>Groups</span><b>${GROUPS.slice(1).filter(g=>groupAccounts(accounts,g[0]).length).length}</b></section>`;
    }
    const tabs = document.getElementById('accountGroupTabsV04') || document.getElementById('v06AccountTabs');
    if(tabs) tabs.outerHTML = `<div id="v06AccountTabs" class="v06-account-tabs">${GROUPS.map(g => { const total = groupTotal(accounts, g[0]); const count = groupAccounts(accounts, g[0]).length; return `<button type="button" class="${accountFilter===g[0]?'active':''}" onclick="setAccountGroupFilter('${g[0]}')"><span>${html(g[3])} ${html(g[1])}</span><b>${count}</b><em class="${total<0?'bad':'good'}">${moneyText(total)}</em></button>`; }).join('')}</div>`;
    const strip = document.getElementById('accountGroupStripV04');
    if(strip) strip.remove();
    const list = document.getElementById('accountsCardList');
    if(list){
      list.className = 'v06-account-list';
      list.innerHTML = accounts.length ? renderAccountGroups(filtered) : `<div class="v06-empty"><b>No accounts yet</b><span>Add checking, savings, investments, property, valuables, debt, or other balances.</span><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div>`;
    }
    const tips = document.getElementById('accountTipsV04');
    if(tips){
      tips.innerHTML = GROUPS.slice(1).map(g => `<div class="mini-item"><div><b>${html(g[1])}</b><br><span>${html(g[2])}</span></div><span class="${groupTotal(accounts,g[0])<0?'bad':'good'}">${moneyText(groupTotal(accounts,g[0]))}</span></div>`).join('');
    }
  }

  function ensureAccountsViewV06(){
    let sec = document.getElementById('view-accounts');
    if(!sec){
      sec = document.createElement('section');
      sec.id = 'view-accounts';
      sec.className = 'view';
      document.getElementById('view-overview')?.after(sec);
    }
    if(sec.dataset.v06Accounts === '1') return;
    sec.dataset.v06Accounts = '1';
    sec.innerHTML = `<div class="page-head v06-page-head"><div><h2 class="section-title">Accounts</h2><p class="section-sub">Grouped balances that are easy to scan on mobile. Include only accounts that should count toward net worth.</p></div><div class="actions"><button type="button" class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div><div id="accountsMetrics" class="v06-account-hero"></div><div class="v06-accounts-layout"><div class="card v06-accounts-main"><div class="card-header"><div><h3 class="card-title">Account groups</h3><p class="card-subtitle">Cash, investments, property, valuables, debt, and everything else.</p></div></div><div id="v06AccountTabs" class="v06-account-tabs"></div><div id="accountsCardList"></div></div><aside class="stack v06-accounts-side"><div class="card"><h3 class="card-title">Primary action</h3><p class="card-subtitle">Add or update balances first, then save a net-worth snapshot.</p><div class="split-line"></div><div class="hero-row"><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button><button type="button" class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button></div></div><div class="card"><h3 class="card-title">Group guide</h3><div class="split-line"></div><div class="mini-list" id="accountTipsV04"></div></div></aside></div>`;
  }

  function renderAccountGroups(accounts){
    const by = {};
    accounts.slice().sort((a,b)=>Math.abs(signedAccountValue(b))-Math.abs(signedAccountValue(a))).forEach(a => { const g = accountGroup(a); (by[g] ||= []).push(a); });
    return Object.entries(by).map(([id, rows]) => {
      const meta = groupMeta(id);
      const total = rows.filter(a=>a.includeNetWorth!==false).reduce((a,x)=>a+signedAccountValue(x),0);
      return `<section class="v06-account-group"><div class="v06-account-group-head"><span>${html(meta[3])}</span><div><b>${html(meta[1])}</b><em>${rows.length} account${rows.length===1?'':'s'} · ${html(meta[2])}</em></div><strong class="${total<0?'bad':'good'}">${moneyText(total)}</strong></div><div class="v06-account-cards">${rows.map(accountCardV06).join('')}</div></section>`;
    }).join('') || `<div class="v06-empty"><b>No accounts in this group</b><span>Try another group or add a new account.</span><button type="button" class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div>`;
  }
  function accountCardV06(a){
    const val = signedAccountValue(a);
    const included = a.includeNetWorth !== false;
    const meta = groupMeta(accountGroup(a));
    return `<article class="v06-account-card"><div class="v06-account-icon">${html(meta[3])}</div><div class="v06-account-main"><h4>${html(a.name || 'Account')}</h4><p>${html(a.institution || 'Manual')} · ${html(a.type || meta[1])}</p><div class="v06-account-badges"><span>${included?'In net worth':'Excluded'}</span><span>Updated ${html(a.updatedAt ? dateLabel(String(a.updatedAt).slice(0,10)) : 'not set')}</span></div></div><div class="v06-account-value"><strong class="${val<0?'bad':'good'}">${moneyText(val)}</strong><div><button type="button" class="btn btn-small" onclick="toggleAccountInclude('${html(a.id)}')">${included?'Exclude':'Include'}</button><button type="button" class="btn btn-small" onclick="openDrawer('account', findById('accounts','${html(a.id)}'))">Edit</button></div></div></article>`;
  }

  function wrapImportFunctions(){
    const oldHandle = window.handleFiles;
    if(typeof oldHandle === 'function' && !oldHandle.__v06Wrapped){
      window.handleFiles = async function(files){
        const result = await oldHandle.apply(this, arguments);
        requestAnimationFrame(() => { autoPrepareImport(); renderImportCoach(); renderHomeLanding(); });
        return result;
      };
      window.handleFiles.__v06Wrapped = true;
    }
    const oldPrepare = window.prepareImportSummary;
    if(typeof oldPrepare === 'function' && !oldPrepare.__v06Wrapped){
      window.prepareImportSummary = function(){
        const result = oldPrepare.apply(this, arguments);
        requestAnimationFrame(renderImportCoach);
        return result;
      };
      window.prepareImportSummary.__v06Wrapped = true;
    }
    const oldClear = window.clearPendingImport;
    if(typeof oldClear === 'function' && !oldClear.__v06Wrapped){
      window.clearPendingImport = function(){
        const result = oldClear.apply(this, arguments);
        requestAnimationFrame(renderImportCoach);
        return result;
      };
      window.clearPendingImport.__v06Wrapped = true;
    }
    const oldCommit = window.commitImport;
    if(typeof oldCommit === 'function' && !oldCommit.__v06Wrapped){
      window.commitImport = function(){
        const before = allTx().length;
        const result = oldCommit.apply(this, arguments);
        setTimeout(() => {
          const added = Math.max(0, allTx().length - before);
          try { if(typeof showView === 'function') showView('overview'); } catch(e) {}
          try { toast(added ? `Import complete. ${added} new transactions are charted on Home.` : 'Import checked. No new transactions were added.'); } catch(e) {}
          renderV06All();
        }, 90);
        return result;
      };
      window.commitImport.__v06Wrapped = true;
    }
  }

  function wrapRender(){
    const oldRenderAll = window.renderAll;
    if(typeof oldRenderAll === 'function' && !oldRenderAll.__v06Wrapped){
      window.renderAll = function(){
        const result = oldRenderAll.apply(this, arguments);
        requestAnimationFrame(renderV06All);
        return result;
      };
      window.renderAll.__v06Wrapped = true;
    }
    const oldShowView = window.showView;
    if(typeof oldShowView === 'function' && !oldShowView.__v06Wrapped){
      window.showView = function(){
        const result = oldShowView.apply(this, arguments);
        requestAnimationFrame(renderV06All);
        return result;
      };
      window.showView.__v06Wrapped = true;
    }
    const oldSettings = window.renderSettings;
    if(typeof oldSettings === 'function' && !oldSettings.__v06Wrapped){
      window.renderSettings = function(){
        const result = oldSettings.apply(this, arguments);
        requestAnimationFrame(markBuild);
        return result;
      };
      window.renderSettings.__v06Wrapped = true;
    }
    window.renderAccountsDashboard = renderAccountsDashboardV06;
  }

  function renderV06All(){
    markBuild();
    setBackupBuild();
    renderHomeLanding();
    renderImportCoach();
    renderTransactionsPolish();
    renderAccountsDashboardV06();
    document.querySelectorAll('button:not([type])').forEach(btn => { btn.type = 'button'; });
  }

  function init(){
    if(initialized) return;
    initialized = true;
    wrapImportFunctions();
    wrapRender();
    renderV06All();
    window.addEventListener('resize', () => requestAnimationFrame(renderV06All), {passive:true});
    window.addEventListener('orientationchange', () => requestAnimationFrame(renderV06All), {passive:true});
    setInterval(markBuild, 1500);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 250);
})();
