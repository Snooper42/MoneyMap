/* MoneyMap v0.9.3 low-key dashboard, account category trends, and investments cleanup. */
(function(){
  'use strict';

  if(window.__MoneyMapV093Loaded) return;
  window.__MoneyMapV093Loaded = true;

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.1';
  const MONTHS = 6;
  const ACCOUNT_GROUPS = [
    {id:'all', label:'All accounts', short:'All', icon:'◌'},
    {id:'cash', label:'Cash', short:'Cash', icon:'$'},
    {id:'investments', label:'Investments', short:'Invest', icon:'△'},
    {id:'credit', label:'Credit cards', short:'Cards', icon:'−'},
    {id:'debt', label:'Loans and debt', short:'Debt', icon:'◒'},
    {id:'property', label:'Property', short:'Property', icon:'⌂'},
    {id:'valuables', label:'Valuables', short:'Valuables', icon:'◆'},
    {id:'other', label:'Other', short:'Other', icon:'•'}
  ];

  const esc = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const js = value => typeof escapeJs === 'function' ? escapeJs(String(value ?? '')) : String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const n = value => typeof nval === 'function' ? nval(value) : Number(value || 0);
  const money0 = value => new Intl.NumberFormat('en-US',{style:'currency',currency:state?.settings?.currency||'USD',minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(value||0));
  const money2 = value => new Intl.NumberFormat('en-US',{style:'currency',currency:state?.settings?.currency||'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0));
  const pct = value => `${Math.round(Number(value||0))}%`;

  function markBuild(){
    window.MONEYMAP_EXPECTED_BUILD = BUILD;
    document.documentElement.setAttribute('data-moneymap-build', BUILD);
    const meta = document.querySelector('meta[name="moneymap-build"]');
    if(meta) meta.setAttribute('content', BUILD);
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
  }

  function monthOf(value){ try { return monthKey(value); } catch(e){ return String(value||'').slice(0,7); } }
  function labelMonth(value){ try { return monthLabel(value); } catch(e){ return String(value||''); } }
  function currentMonthKey(){ return typeof currentMonth === 'function' ? currentMonth() : new Date().toISOString().slice(0,7); }
  function allTx(){ return Array.isArray(state?.transactions) ? state.transactions : []; }
  function visibleTx(){ return allTx().filter(t => !t.hidden); }
  function txForMonth(key){ return visibleTx().filter(t => monthOf(t.date) === key); }
  function spendForRows(rows){ return typeof spendingFor === 'function' ? spendingFor(rows) : rows.filter(t=>Number(t.amount)<0 && !['Transfers','Income'].includes(t.category)).reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0); }
  function incomeForRows(rows){ return typeof incomeFor === 'function' ? incomeFor(rows) : rows.filter(t=>Number(t.amount)>0).reduce((a,t)=>a+Number(t.amount||0),0); }
  function catsForRows(rows){ return typeof byCategory === 'function' ? byCategory(rows) : categoryFallback(rows); }
  function categoryFallback(rows){
    const map = {};
    rows.filter(t => Number(t.amount) < 0 && !t.hidden && !['Transfers','Income'].includes(t.category)).forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + Math.abs(Number(t.amount || 0));
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function lastMonths(count=MONTHS){
    const base = new Date(`${currentMonthKey()}-01T00:00:00`);
    return Array.from({length:count}, (_, idx) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (count - 1 - idx), 1);
      return d.toISOString().slice(0,7);
    });
  }
  function monthSeries(){
    return lastMonths().map(key => {
      const rows = txForMonth(key);
      const spend = spendForRows(rows);
      const income = incomeForRows(rows);
      return {key, rows, spend, income, net:income-spend, count:rows.length};
    });
  }

  function isLiabilityType(type){ return /credit|loan|debt|mortgage|liability/i.test(String(type||'')); }
  function accountDirection(a){
    const dir = String(a?.direction || a?.balanceDirection || '').toLowerCase();
    if(dir === 'asset' || dir === 'liability') return dir;
    return isLiabilityType(a?.type) ? 'liability' : 'asset';
  }
  function signedAccountValueV093(a){
    const balance = Math.abs(n(a?.balance));
    return accountDirection(a) === 'liability' ? -balance : balance;
  }
  function accounts(){ return Array.isArray(state?.accounts) ? state.accounts : []; }
  function groupForAccount(a){
    const type = String(a?.type || '').toLowerCase();
    if(/check|sav|cash|money market/.test(type)) return 'cash';
    if(/broker|retire|401|ira|hsa|invest|crypto/.test(type)) return 'investments';
    if(/credit/.test(type)) return 'credit';
    if(/loan|debt|mortgage|liability/.test(type)) return 'debt';
    if(/property|vehicle|home|house|real estate/.test(type)) return 'property';
    if(/collect|jewel|metal|art/.test(type)) return 'valuables';
    return 'other';
  }
  function groupMeta(id){ return ACCOUNT_GROUPS.find(g=>g.id===id) || ACCOUNT_GROUPS[0]; }
  function includedAccounts(){ return accounts().filter(a => a.includeNetWorth !== false); }
  function liveAccountBreakdown(){
    const rows = includedAccounts();
    const assets = rows.reduce((sum,a)=>sum+Math.max(0,signedAccountValueV093(a)),0);
    const liabilities = rows.reduce((sum,a)=>sum+Math.abs(Math.min(0,signedAccountValueV093(a))),0);
    return {assets, liabilities, netWorth:assets-liabilities};
  }
  function netWorth(){
    try { return netWorthBreakdown(); } catch(e){ return liveAccountBreakdown(); }
  }
  function snapshots(){ return Array.isArray(state?.netWorthHistory) ? state.netWorthHistory.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))) : []; }

  window.accountIsLiability = function(type){ return isLiabilityType(type); };
  window.accountSignedValue = function(a){ return signedAccountValueV093(a); };

  function patchSaveAccount(){
    const oldSave = window.saveAccount;
    if(typeof oldSave !== 'function' || oldSave.__v093Wrapped) return;
    window.saveAccount = function(id){
      const result = oldSave.apply(this, arguments);
      const dir = document.getElementById('acctDirection')?.value;
      if(dir && (dir === 'asset' || dir === 'liability')){
        const target = id ? state.accounts.find(x => x.id === id) : state.accounts[state.accounts.length - 1];
        if(target){ target.direction = dir; saveState?.(); requestAnimationFrame(renderV093); }
      }
      return result;
    };
    window.saveAccount.__v093Wrapped = true;
  }

  function latestSnapshot(){ return snapshots().slice(-1)[0] || null; }
  function nextAction(){
    const unreviewed = allTx().filter(t => !t.reviewed).length;
    if(!allTx().length) return {title:'Start with one upload.', sub:'Upload transactions and MoneyMap will clean, chart, and remember your imports.', primary:'Upload', fn:"showView('import')"};
    if(unreviewed) return {title:'Review is next.', sub:`${unreviewed} transactions need approval before reports are fully trustworthy.`, primary:`Review ${unreviewed}`, fn:'startWeeklyReview()'};
    return {title:'Your month is organized.', sub:'Spending, cash flow, and balances are ready to scan.', primary:'Import more', fn:"showView('import')"};
  }

  function renderHome(){
    const view = document.getElementById('view-overview');
    if(!view) return;
    view.classList.add('v093-home-active');
    let root = document.getElementById('v093HomeDashboard');
    if(!root){ root = document.createElement('section'); root.id='v093HomeDashboard'; view.prepend(root); }
    const action = nextAction();
    const b = netWorth();
    const latest = latestSnapshot();
    const liveDelta = latest ? n(b.netWorth) - n(latest.netWorth) : 0;
    const hist = snapshots();
    const series = monthSeries();
    const current = series[series.length-1] || {spend:0,income:0,count:0,key:currentMonthKey()};
    const prev = series[series.length-2] || null;
    const nonzero = series.filter(m=>m.spend>0);
    const avg = nonzero.length ? nonzero.reduce((s,m)=>s+m.spend,0)/nonzero.length : 0;
    const high = nonzero.slice().sort((a,b)=>b.spend-a.spend)[0] || null;
    const hidden = allTx().filter(t=>t.hidden).length;
    const unreviewed = allTx().filter(t=>!t.reviewed).length;
    const cats = catsForRows(txForMonth(currentMonthKey())).slice(0,5);
    const maxSpend = Math.max(1,...series.map(m=>m.spend));
    const totalSpend = current.spend || 1;
    root.innerHTML = `<section class="v093-hero">
      <div class="v093-hero-copy"><span class="v093-eyebrow">Home</span><h2>${esc(action.title)}</h2><p>${esc(action.sub)}</p><div class="v093-actions"><button class="btn btn-primary" onclick="${action.fn}">${esc(action.primary)}</button><button class="btn" onclick="showView('import')">Import more</button><button class="btn" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save snapshot</button></div><div class="v093-assurance"><span>Duplicate guard</span><span>Merchant cleanup</span><span>Transfer hiding</span><span>Saved mappings</span></div></div>
      <aside class="v093-worth"><div class="v093-worth-top"><span>Net worth right now</span><b>${hist.length} snapshot${hist.length===1?'':'s'}</b></div><strong class="v093-worth-value ${b.netWorth>=0?'good':'bad'}">${money0(b.netWorth)}</strong><p>${latest?`Last saved ${esc(typeof dateFmt==='function'?dateFmt(latest.date):latest.date)} at ${money0(latest.netWorth)}`:'Save today to start a fixed history.'}</p><div class="v093-worth-grid"><div><span>Assets</span><b class="good">${money0(b.assets)}</b></div><div><span>Liabilities</span><b class="bad">${money0(b.liabilities)}</b></div><div><span>Live vs last</span><b class="${liveDelta>=0?'good':'bad'}">${latest?`${liveDelta>=0?'+':'-'}${money0(Math.abs(liveDelta))}`:'—'}</b></div><div><span>History</span><b>${hist.length}</b></div></div><div class="v093-card-actions"><button class="btn btn-primary btn-small" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save today</button><button class="btn btn-small" onclick="showView('accounts')">Accounts</button></div></aside>
    </section>
    <section class="v093-home-grid">
      <article class="v093-panel v093-history"><div class="v093-panel-head"><div><h3>Spending history</h3><p>Real monthly spend from visible imported transactions.</p></div><span>6 months</span></div><div class="v093-history-stats"><div><span>This month</span><b>${money0(current.spend)}</b><em>${current.count} tx</em></div><div><span>Average</span><b>${money0(avg)}</b><em>Non-zero months</em></div><div><span>Vs last</span><b class="${prev && current.spend-prev.spend>0?'bad':'good'}">${prev?`${current.spend-prev.spend>=0?'+':'-'}${money0(Math.abs(current.spend-prev.spend))}`:'—'}</b><em>${prev?labelMonth(prev.key).split(' ')[0]:'No previous month'}</em></div><div><span>High</span><b>${high?money0(high.spend):'—'}</b><em>${high?labelMonth(high.key):'No spend yet'}</em></div></div><div class="v093-spark-bars">${series.map((m,i)=>{ const h=m.spend?Math.max(12,Math.round(m.spend/maxSpend*100)):4; return `<button class="v093-spark ${i===series.length-1?'active':''}" onclick="v091OpenMonth ? v091OpenMonth('${esc(m.key)}') : showView('transactions')"><span>${m.spend?money0(m.spend):'—'}</span><i><b style="height:${h}%"></b></i><strong>${esc(labelMonth(m.key).split(' ')[0])}</strong><em>${m.count} tx${m.income?` · ${money0(m.income)} in`:''}</em></button>`;}).join('')}</div></article>
      <article class="v093-panel v093-month"><div class="v093-panel-head"><div><h3>${esc(labelMonth(currentMonthKey()))}</h3><p>Current month from visible transactions.</p></div><span>${prev?`${current.spend-prev.spend>=0?'+':'-'}${money0(Math.abs(current.spend-prev.spend))} vs last`:'Current'}</span></div><div class="v093-month-kpis"><div><span>Spent</span><b class="bad">${money0(current.spend)}</b><em>${current.count} tracked</em></div><div><span>Income</span><b class="good">${money0(current.income)}</b><em>${hidden} hidden</em></div><div><span>Cash flow</span><b class="${current.net>=0?'good':'bad'}">${money0(current.net)}</b><em>${unreviewed} unreviewed</em></div></div><div class="v093-breakdown"><div class="v093-breakdown-head"><b>Spending breakdown</b><button class="btn btn-small" onclick="showView('budgets')">Budgets</button></div>${cats.length?cats.map(([name,value],idx)=>categoryRow(name,value,totalSpend,idx)).join(''):`<div class="v093-empty"><b>No spending yet</b><span>Import transactions to see categories.</span></div>`}</div></article>
    </section>`;
  }

  function categoryRow(name,value,total,idx){
    const budget = (state.budgets||[]).find(b=>String(b.category||'').toLowerCase()===String(name||'').toLowerCase());
    const percent = Math.round(value/(total||1)*100);
    let limitText = 'No limit';
    let over = false;
    let fill = percent;
    if(budget && n(budget.limit)>0){
      const left = n(budget.limit) - value;
      over = left < 0;
      fill = Math.min(100,Math.round(value/n(budget.limit)*100));
      limitText = over ? `${money0(Math.abs(left))} over` : `${money0(left)} left`;
    }
    return `<button class="v093-cat ${over?'over':''}" onclick="showCategoryTransactions ? showCategoryTransactions('${js(name)}') : showView('transactions')"><span class="v093-dot c${idx%5}"></span><span class="v093-cat-main"><b>${esc(name)}</b><em>${budget?`${Math.round(value/n(budget.limit)*100)}% of ${money0(budget.limit)} limit`:`${percent}% of spending`}</em><i><span style="width:${Math.max(4,fill)}%"></span></i></span><strong>${money0(value)}</strong><small>${esc(limitText)}</small></button>`;
  }

  function accountGroupValue(groupId){
    const rows = includedAccounts().filter(a => groupId === 'all' || groupForAccount(a) === groupId);
    const assets = rows.reduce((s,a)=>s+Math.max(0,signedAccountValueV093(a)),0);
    const liabilities = rows.reduce((s,a)=>s+Math.abs(Math.min(0,signedAccountValueV093(a))),0);
    return {assets, liabilities, net:assets-liabilities, count:rows.length};
  }

  function categoryTrendPoints(groupId){
    const hist = snapshots();
    const live = accountGroupValue(groupId);
    let rows = hist.map(row => ({date:row.date, value: groupId==='all' ? n(row.netWorth) : inferCategorySnapshotValue(row, groupId), saved:true}));
    rows = rows.filter(r => Number.isFinite(r.value));
    const today = new Date().toISOString().slice(0,10);
    rows.push({date:today, value: groupId==='all'?live.net:live.net, saved:false});
    return rows.slice(-24);
  }
  function inferCategorySnapshotValue(row, groupId){
    // Historical per-category values did not exist in older storage. Use the current live value as a stable line until future richer snapshots exist.
    const live = accountGroupValue(groupId);
    if(groupId === 'credit' || groupId === 'debt') return -live.liabilities;
    return live.net;
  }

  function renderAccounts(){
    const view = document.getElementById('view-accounts');
    if(!view) return;
    const active = state.settings?.accountsTrendGroup || 'all';
    const live = accountGroupValue(active);
    const total = accountGroupValue('all');
    const meta = groupMeta(active);
    const directionCount = accounts().filter(a=>a.direction).length;
    const rows = accounts().slice().sort((a,b)=>Math.abs(signedAccountValueV093(b))-Math.abs(signedAccountValueV093(a)));
    view.classList.add('v093-accounts-active');
    view.innerHTML = `<div class="v093-accounts-page"><div class="page-head v093-page-head"><div><h2 class="section-title">Accounts</h2><p class="section-sub">Balances by category with an asset/liability toggle for every manual account.</p></div><div class="actions"><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div>
      <section class="v093-account-chart card"><div class="v093-chart-toolbar"><div><span class="v093-kicker">${esc(meta.label)}</span><strong class="${live.net>=0?'good':'bad'}">${money2(live.net)}</strong><p>${live.count} included account${live.count===1?'':'s'} · ${money2(live.assets)} assets · ${money2(live.liabilities)} liabilities</p></div><div class="v093-chart-pills">${ACCOUNT_GROUPS.map(g=>`<button class="${active===g.id?'active':''}" onclick="setV093AccountTrend('${g.id}')">${esc(g.short)}</button>`).join('')}</div></div><div class="v093-account-chart-wrap"><canvas id="v093AccountTrendCanvas"></canvas></div></section>
      <div class="v093-account-grid"><section class="card v093-account-list"><div class="v093-list-head"><div><h3>Manual balances</h3><p>Choose whether each balance counts as an asset or liability.</p></div><button class="btn btn-small" onclick="openDrawer('account')">Add</button></div>${rows.length?renderAccountGroups(rows):`<div class="v093-empty"><b>No accounts yet</b><span>Add cash, investments, property, cards, loans, or other balances.</span><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div>`}</section><aside class="card v093-account-summary"><h3>Summary</h3><div class="v093-summary-line"><span>Assets</span><b class="good">${money2(total.assets)}</b></div><div class="v093-summary-line"><span>Liabilities</span><b class="bad">${money2(total.liabilities)}</b></div><div class="v093-summary-line total"><span>Net worth</span><b class="${total.net>=0?'good':'bad'}">${money2(total.net)}</b></div><div class="v093-summary-note">${directionCount} account${directionCount===1?'':'s'} have an explicit asset/liability setting. Older accounts still infer from type until changed.</div></aside></div></div>`;
    requestAnimationFrame(()=>drawAccountTrend(active));
  }
  window.setV093AccountTrend = function(id){ state.settings = state.settings || {}; state.settings.accountsTrendGroup = id; saveState?.(); renderAccounts(); };

  function renderAccountGroups(rows){
    return ACCOUNT_GROUPS.filter(g=>g.id!=='all').map(g=>{
      const items = rows.filter(a=>groupForAccount(a)===g.id);
      if(!items.length) return '';
      const val = items.reduce((s,a)=>s+signedAccountValueV093(a),0);
      return `<section class="v093-account-group"><div class="v093-account-group-head"><div><b>${esc(g.icon)} ${esc(g.label)}</b><span>${items.length} account${items.length===1?'':'s'}</span></div><strong class="${val>=0?'good':'bad'}">${money2(val)}</strong></div>${items.map(a=>{ const sv=signedAccountValueV093(a); const direction=accountDirection(a); return `<button class="v093-account-row" onclick="openDrawer('account', findById('accounts','${esc(a.id)}'))"><span>${esc(g.icon)}</span><div><b>${esc(a.name||'Account')}</b><em>${esc(a.type||g.label)}${a.institution?` · ${esc(a.institution)}`:''}</em></div><i>${direction==='liability'?'Liability':'Asset'}</i><strong class="${sv>=0?'good':'bad'}">${money2(Math.abs(sv))}</strong></button>`;}).join('')}</section>`;
    }).join('');
  }

  function drawAccountTrend(active){
    const canvas = document.getElementById('v093AccountTrendCanvas');
    if(!canvas) return;
    drawLineChart(canvas, categoryTrendPoints(active), {money:true});
  }

  function drawLineChart(canvas, points, opts={}){
    const wrap = canvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(220, Math.round(rect.height || 260));
    canvas.width = width*dpr; canvas.height = height*dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
    const values = points.map(p=>n(p.value));
    let min = values.length ? Math.min(...values) : 0, max = values.length ? Math.max(...values) : 0;
    if(min===max){ min-=Math.max(100,Math.abs(min)*.1||100); max+=Math.max(100,Math.abs(max)*.1||100); }
    const padVal = Math.max(50,(max-min)*.14); min-=padVal; max+=padVal;
    const pad = {l:62,r:18,t:18,b:34}; const pw=width-pad.l-pad.r, ph=height-pad.t-pad.b;
    const x=i=>pad.l+pw*(points.length===1?.5:i/(points.length-1)); const y=v=>pad.t+ph*(1-((v-min)/(max-min||1)));
    ctx.font='12px Inter, system-ui, sans-serif'; ctx.fillStyle=getCss('--muted','#94a3b8'); ctx.strokeStyle='rgba(148,163,184,.17)'; ctx.lineWidth=1;
    for(let i=0;i<4;i++){ const val=min+(max-min)*(i/3); const yy=y(val); ctx.beginPath(); ctx.moveTo(pad.l,yy); ctx.lineTo(width-pad.r,yy); ctx.stroke(); ctx.fillText(opts.money?money0(val):String(Math.round(val)),8,yy+4); }
    if(!points.length) return;
    const grad=ctx.createLinearGradient(0,pad.t,0,height-pad.b); grad.addColorStop(0,'rgba(84,199,236,.20)'); grad.addColorStop(1,'rgba(84,199,236,0)');
    ctx.beginPath(); points.forEach((p,i)=>{ i?ctx.lineTo(x(i),y(n(p.value))):ctx.moveTo(x(i),y(n(p.value))); }); ctx.lineTo(x(points.length-1),height-pad.b); ctx.lineTo(x(0),height-pad.b); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); points.forEach((p,i)=>{ i?ctx.lineTo(x(i),y(n(p.value))):ctx.moveTo(x(i),y(n(p.value))); }); ctx.strokeStyle='#54C7EC'; ctx.lineWidth=3; ctx.stroke();
    points.forEach((p,i)=>{ ctx.fillStyle=p.saved?'#54C7EC':'#fb923c'; ctx.beginPath(); ctx.arc(x(i),y(n(p.value)),p.saved?4:5,0,Math.PI*2); ctx.fill(); });
    const every=points.length>8?Math.ceil(points.length/6):1; ctx.fillStyle=getCss('--muted','#94a3b8');
    points.forEach((p,i)=>{ if(i%every!==0 && i!==points.length-1) return; const d=new Date(`${p.date}T00:00:00`); const label=d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); ctx.fillText(label,Math.max(0,Math.min(width-52,x(i)-20)),height-10); });
  }
  function getCss(name,fallback=''){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }

  function renderInvestments(){
    const view = document.getElementById('view-investments');
    if(!view) return;
    const holdings = Array.isArray(state?.holdings) ? state.holdings : [];
    const value = holdings.reduce((s,h)=>s+holdingValueSafe(h),0);
    const cost = holdings.reduce((s,h)=>s+holdingCostSafe(h),0);
    const gain = value-cost;
    const included = holdings.filter(h=>h.includeNetWorth!==false).reduce((s,h)=>s+holdingValueSafe(h),0);
    const alloc = allocationRows(holdings,value);
    view.classList.add('v093-investments-active');
    view.innerHTML = `<div class="v093-invest-page"><div class="page-head v093-page-head"><div><h2 class="section-title">Investments</h2><p class="section-sub">Manual holdings, allocation, value, and net-worth inclusion without a dense table-first layout.</p></div><div class="actions"><button class="btn" onclick="exportTrackerCsv('holdings')">Export CSV</button><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div><section class="v093-invest-metrics"><div><span>Portfolio value</span><b class="good">${money0(value)}</b><em>${holdings.length} manual holding${holdings.length===1?'':'s'}</em></div><div><span>Gain / loss</span><b class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money0(gain)}</b><em>${cost?pct(gain/cost*100)+' on cost':'Add cost basis'}</em></div><div><span>Cost basis</span><b>${money0(cost)}</b><em>Manual purchase basis</em></div><div><span>Net worth included</span><b>${money0(included)}</b><em>Exclude duplicates</em></div></section><div class="v093-invest-grid"><section class="card v093-holdings-card"><div class="v093-list-head"><div><h3>Holdings</h3><p>Cards replace the dense table on desktop and mobile.</p></div><button class="btn btn-small" onclick="openDrawer('holding')">Add</button></div>${holdings.length?holdings.map(holdingCard).join(''):`<div class="v093-empty"><b>No holdings yet</b><span>Add stocks, funds, bonds, cash, or crypto manually.</span><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div>`}</section><aside class="card v093-allocation"><h3>Allocation</h3><p>Grouped by asset class.</p><div class="v093-allocation-list">${alloc.length?alloc.map((a,i)=>`<button onclick="filterPortfolioAssetClass ? filterPortfolioAssetClass('${js(a.name)}') : null"><span><b>${esc(a.name)}</b><em>${pct(a.pct)} · ${money0(a.value)}</em></span><i><b style="width:${Math.max(4,a.pct)}%"></b></i></button>`).join(''):`<div class="v093-empty"><b>No allocation yet</b><span>Add holdings to see weights.</span></div>`}</div></aside></div></div>`;
  }
  function holdingValueSafe(h){ try { return holdingValue(h); } catch(e){ return n(h.quantity)*n(h.price); } }
  function holdingCostSafe(h){ try { return holdingCost(h); } catch(e){ return n(h.quantity)*n(h.costBasis); } }
  function assetClass(h){ const raw=String(h.assetClass||'Other'); if(/stock|equity/i.test(raw)) return 'Stocks'; if(/fund|etf|index/i.test(raw)) return 'Funds'; if(/bond|treasury/i.test(raw)) return 'Bonds'; if(/cash|money market/i.test(raw)) return 'Cash'; if(/crypto/i.test(raw)) return 'Crypto'; return raw; }
  function allocationRows(holdings,total){ const map={}; holdings.forEach(h=>{ const k=assetClass(h); map[k]=(map[k]||0)+holdingValueSafe(h); }); return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value,pct:total?value/total*100:0})); }
  function holdingCard(h){ const value=holdingValueSafe(h), cost=holdingCostSafe(h), gain=value-cost; return `<article class="v093-holding"><div class="v093-holding-main"><span>${esc(String(h.symbol||h.name||'H').slice(0,4).toUpperCase())}</span><div><b>${esc(h.symbol||h.name||'Holding')}</b><em>${esc(h.name&&h.symbol?h.name:(h.account||'Manual'))} · ${esc(assetClass(h))}</em></div><strong>${money0(value)}</strong></div><div class="v093-holding-meta"><span>${n(h.quantity).toLocaleString()} shares</span><span>${money2(h.price)} price</span><span class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money0(gain)}</span><span>${h.includeNetWorth!==false?'Included':'Excluded'}</span></div><div class="v093-holding-actions"><button class="btn btn-small" onclick="toggleHoldingInclude('${esc(h.id)}')">${h.includeNetWorth!==false?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${esc(h.id)}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${esc(h.id)}')">Delete</button></div></article>`; }


  function patchGroupDirectionSync(){
    const oldSetGroup = window.v092SetAccountGroup;
    if(typeof oldSetGroup === 'function' && !oldSetGroup.__v093Wrapped){
      window.v092SetAccountGroup = function(groupId, desiredType='', skipTitle=false){
        const result = oldSetGroup.apply(this, arguments);
        const dir = document.getElementById('acctDirection');
        const type = document.getElementById('acctType')?.value || '';
        if(dir && !dir.dataset.userTouched){ dir.value = isLiabilityType(type) ? 'liability' : 'asset'; }
        return result;
      };
      window.v092SetAccountGroup.__v093Wrapped = true;
    }
  }

  function patchAccountDrawer(){
    const oldOpen = window.openDrawer;
    if(typeof oldOpen !== 'function' || oldOpen.__v093Wrapped) return;
    window.openDrawer = function(type, data){
      const result = oldOpen.apply(this, arguments);
      if(type === 'account') setTimeout(()=>enhanceAccountDirection(data||null), 0);
      return result;
    };
    window.openDrawer.__v093Wrapped = true;
  }
  function enhanceAccountDirection(data){
    const quick = document.querySelector('.v092-quick-grid');
    if(!quick || document.getElementById('acctDirection')) return;
    const dir = data?.direction || data?.balanceDirection || (isLiabilityType(document.getElementById('acctType')?.value) ? 'liability' : 'asset');
    const field = document.createElement('div');
    field.className = 'v093-field v093-direction-field';
    field.innerHTML = `<label>Direction</label><select id="acctDirection" onchange="this.dataset.userTouched='1'"><option value="asset" ${dir==='asset'?'selected':''}>Asset</option><option value="liability" ${dir==='liability'?'selected':''}>Liability</option></select>`;
    quick.appendChild(field);
  }

  function renderV093(){
    markBuild();
    patchSaveAccount();
    patchGroupDirectionSync();
    patchAccountDrawer();
    renderHome();
    renderAccounts();
    renderInvestments();
  }

  function wrapRender(){
    const oldRender = window.renderAll;
    if(typeof oldRender === 'function' && !oldRender.__v093Wrapped){
      window.renderAll = function(){ const result = oldRender.apply(this, arguments); requestAnimationFrame(renderV093); return result; };
      window.renderAll.__v093Wrapped = true;
    }
    const oldShow = window.showView;
    if(typeof oldShow === 'function' && !oldShow.__v093Wrapped){
      window.showView = function(){ const result = oldShow.apply(this, arguments); requestAnimationFrame(renderV093); return result; };
      window.showView.__v093Wrapped = true;
    }
  }

  function init(){ wrapRender(); renderV093(); window.addEventListener('resize',()=>requestAnimationFrame(()=>{ if(activeView==='accounts') drawAccountTrend(state.settings?.accountsTrendGroup||'all'); }),{passive:true}); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init,250);
})();
