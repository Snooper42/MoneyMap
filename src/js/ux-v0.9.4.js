/* MoneyMap v0.9.4 low-key dashboard, account category trends, and investments cleanup. */
(function(){
  'use strict';

  if(window.__MoneyMapV094Loaded) return;
  window.__MoneyMapV094Loaded = true;

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.9';
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
  function signedAccountValueV094(a){
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
    const assets = rows.reduce((sum,a)=>sum+Math.max(0,signedAccountValueV094(a)),0);
    const liabilities = rows.reduce((sum,a)=>sum+Math.abs(Math.min(0,signedAccountValueV094(a))),0);
    return {assets, liabilities, netWorth:assets-liabilities};
  }
  function netWorth(){
    try { return netWorthBreakdown(); } catch(e){ return liveAccountBreakdown(); }
  }
  function snapshots(){ return Array.isArray(state?.netWorthHistory) ? state.netWorthHistory.slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))) : []; }


  function holdings(){ return Array.isArray(state?.holdings) ? state.holdings : []; }
  function includedHoldingsV094(){ return holdings().filter(h => h.includeNetWorth !== false); }
  function holdingValueV094(h){ try { return holdingValue(h); } catch(e){ return n(h?.quantity) * n(h?.price); } }
  function holdingCostV094(h){ try { return holdingCost(h); } catch(e){ return n(h?.quantity) * n(h?.costBasis); } }
  function debts(){ return Array.isArray(state?.debts) ? state.debts : []; }
  function includedDebtsV094(){ return debts().filter(d => d.includeNetWorth !== false); }
  function liveAccountGroupComposition(){
    const comp = {};
    ACCOUNT_GROUPS.filter(g => g.id !== 'all').forEach(g => comp[g.id] = {assets:0, liabilities:0, net:0, count:0, holdings:0, debts:0});
    includedAccounts().forEach(a => {
      const group = groupForAccount(a);
      const value = signedAccountValueV094(a);
      const bucket = comp[group] || (comp[group] = {assets:0, liabilities:0, net:0, count:0, holdings:0, debts:0});
      bucket.count += 1;
      if(value >= 0) bucket.assets += value; else bucket.liabilities += Math.abs(value);
      bucket.net = bucket.assets - bucket.liabilities;
    });
    includedHoldingsV094().forEach(h => {
      const value = Math.max(0, holdingValueV094(h));
      comp.investments.assets += value;
      comp.investments.holdings += value;
      comp.investments.count += 1;
      comp.investments.net = comp.investments.assets - comp.investments.liabilities;
    });
    includedDebtsV094().forEach(d => {
      const value = Math.abs(n(d.balance));
      comp.debt.liabilities += value;
      comp.debt.debts += value;
      comp.debt.count += 1;
      comp.debt.net = comp.debt.assets - comp.debt.liabilities;
    });
    Object.keys(comp).forEach(k => { comp[k].net = comp[k].assets - comp[k].liabilities; });
    return comp;
  }
  function liveAllComposition(){
    const comp = liveAccountGroupComposition();
    const assets = Object.values(comp).reduce((s,g)=>s+n(g.assets),0);
    const liabilities = Object.values(comp).reduce((s,g)=>s+n(g.liabilities),0);
    return {assets, liabilities, net:assets-liabilities, count:Object.values(comp).reduce((s,g)=>s+n(g.count),0), groups:comp};
  }
  function enrichNetWorthSnapshot(row){
    if(!row) return row;
    const comp = liveAccountGroupComposition();
    row.accountGroups = JSON.parse(JSON.stringify(comp));
    row.accountGroupTotals = {
      assets:Object.values(comp).reduce((s,g)=>s+n(g.assets),0),
      liabilities:Object.values(comp).reduce((s,g)=>s+n(g.liabilities),0)
    };
    row.accountGroupVersion = 'v0.9.4';
    return row;
  }
  function patchSaveNetWorthSnapshot(){
    const oldSave = window.saveNetWorthSnapshot;
    if(typeof oldSave !== 'function' || oldSave.__v094Wrapped) return;
    window.saveNetWorthSnapshot = function(){
      const dateEl = document.getElementById('netWorthSnapshotDate');
      const requestedDate = (dateEl && dateEl.value) || new Date().toISOString().slice(0,10);
      const result = oldSave.apply(this, arguments);
      const row = (state.netWorthHistory || []).find(x => x.date === requestedDate) || (state.netWorthHistory || []).slice(-1)[0];
      enrichNetWorthSnapshot(row);
      saveState?.();
      requestAnimationFrame(renderV094);
      return result;
    };
    window.saveNetWorthSnapshot.__v094Wrapped = true;
  }

  window.accountIsLiability = function(type){ return isLiabilityType(type); };
  window.accountSignedValue = function(a){ return signedAccountValueV094(a); };

  function patchSaveAccount(){
    const oldSave = window.saveAccount;
    if(typeof oldSave !== 'function' || oldSave.__v094Wrapped) return;
    window.saveAccount = function(id){
      const result = oldSave.apply(this, arguments);
      const dir = document.getElementById('acctDirection')?.value;
      if(dir && (dir === 'asset' || dir === 'liability')){
        const target = id ? state.accounts.find(x => x.id === id) : state.accounts[state.accounts.length - 1];
        if(target){ target.direction = dir; saveState?.(); requestAnimationFrame(renderV094); }
      }
      return result;
    };
    window.saveAccount.__v094Wrapped = true;
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
    view.classList.add('v094-home-active');
    let root = document.getElementById('v094HomeDashboard');
    if(!root){ root = document.createElement('section'); root.id='v094HomeDashboard'; view.prepend(root); }
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
    root.innerHTML = `<section class="v094-hero">
      <div class="v094-hero-copy"><span class="v094-eyebrow">Home</span><h2>${esc(action.title)}</h2><p>${esc(action.sub)}</p><div class="v094-actions"><button class="btn btn-primary" onclick="${action.fn}">${esc(action.primary)}</button><button class="btn" onclick="showView('import')">Import more</button><button class="btn" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save snapshot</button></div><div class="v094-assurance"><span>Duplicate guard</span><span>Merchant cleanup</span><span>Transfer hiding</span><span>Saved mappings</span></div></div>
      <aside class="v094-worth"><div class="v094-worth-top"><span>Net worth right now</span><b>${hist.length} snapshot${hist.length===1?'':'s'}</b></div><strong class="v094-worth-value ${b.netWorth>=0?'good':'bad'}">${money0(b.netWorth)}</strong><p>${latest?`Last saved ${esc(typeof dateFmt==='function'?dateFmt(latest.date):latest.date)} at ${money0(latest.netWorth)}`:'Save today to start a fixed history.'}</p><div class="v094-worth-grid"><div><span>Assets</span><b class="good">${money0(b.assets)}</b></div><div><span>Liabilities</span><b class="bad">${money0(b.liabilities)}</b></div><div><span>Live vs last</span><b class="${liveDelta>=0?'good':'bad'}">${latest?`${liveDelta>=0?'+':'-'}${money0(Math.abs(liveDelta))}`:'—'}</b></div><div><span>History</span><b>${hist.length}</b></div></div><div class="v094-card-actions"><button class="btn btn-primary btn-small" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save today</button><button class="btn btn-small" onclick="showView('accounts')">Accounts</button></div></aside>
    </section>
    <section class="v094-home-grid">
      <article class="v094-panel v094-history"><div class="v094-panel-head"><div><h3>Spending history</h3><p>Real monthly spend from visible imported transactions.</p></div><span>6 months</span></div><div class="v094-history-stats"><div><span>This month</span><b>${money0(current.spend)}</b><em>${current.count} tx</em></div><div><span>Average</span><b>${money0(avg)}</b><em>Non-zero months</em></div><div><span>Vs last</span><b class="${prev && current.spend-prev.spend>0?'bad':'good'}">${prev?`${current.spend-prev.spend>=0?'+':'-'}${money0(Math.abs(current.spend-prev.spend))}`:'—'}</b><em>${prev?labelMonth(prev.key).split(' ')[0]:'No previous month'}</em></div><div><span>High</span><b>${high?money0(high.spend):'—'}</b><em>${high?labelMonth(high.key):'No spend yet'}</em></div></div><div class="v094-spark-bars">${series.map((m,i)=>{ const h=m.spend?Math.max(12,Math.round(m.spend/maxSpend*100)):4; return `<button class="v094-spark ${i===series.length-1?'active':''}" onclick="v091OpenMonth ? v091OpenMonth('${esc(m.key)}') : showView('transactions')"><span>${m.spend?money0(m.spend):'—'}</span><i><b style="height:${h}%"></b></i><strong>${esc(labelMonth(m.key).split(' ')[0])}</strong><em>${m.count} tx${m.income?` · ${money0(m.income)} in`:''}</em></button>`;}).join('')}</div></article>
      <article class="v094-panel v094-month"><div class="v094-panel-head"><div><h3>${esc(labelMonth(currentMonthKey()))}</h3><p>Current month from visible transactions.</p></div><span>${prev?`${current.spend-prev.spend>=0?'+':'-'}${money0(Math.abs(current.spend-prev.spend))} vs last`:'Current'}</span></div><div class="v094-month-kpis"><div><span>Spent</span><b class="bad">${money0(current.spend)}</b><em>${current.count} tracked</em></div><div><span>Income</span><b class="good">${money0(current.income)}</b><em>${hidden} hidden</em></div><div><span>Cash flow</span><b class="${current.net>=0?'good':'bad'}">${money0(current.net)}</b><em>${unreviewed} unreviewed</em></div></div><div class="v094-breakdown"><div class="v094-breakdown-head"><b>Spending breakdown</b><button class="btn btn-small" onclick="showView('budgets')">Budgets</button></div>${cats.length?cats.map(([name,value],idx)=>categoryRow(name,value,totalSpend,idx)).join(''):`<div class="v094-empty"><b>No spending yet</b><span>Import transactions to see categories.</span></div>`}</div></article>
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
    return `<button class="v094-cat ${over?'over':''}" onclick="showCategoryTransactions ? showCategoryTransactions('${js(name)}') : showView('transactions')"><span class="v094-dot c${idx%5}"></span><span class="v094-cat-main"><b>${esc(name)}</b><em>${budget?`${Math.round(value/n(budget.limit)*100)}% of ${money0(budget.limit)} limit`:`${percent}% of spending`}</em><i><span style="width:${Math.max(4,fill)}%"></span></i></span><strong>${money0(value)}</strong><small>${esc(limitText)}</small></button>`;
  }

  function accountGroupValue(groupId){
    const all = liveAllComposition();
    if(groupId === 'all') return {assets:all.assets, liabilities:all.liabilities, net:all.net, count:all.count};
    const g = all.groups[groupId] || {assets:0, liabilities:0, net:0, count:0};
    return {assets:n(g.assets), liabilities:n(g.liabilities), net:n(g.net), count:n(g.count), holdings:n(g.holdings), debts:n(g.debts)};
  }

  function legacySplitValue(row, groupId){
    const comp = liveAccountGroupComposition();
    const liveGroup = comp[groupId] || {assets:0, liabilities:0};
    const allAssets = Object.values(comp).filter((_, idx)=>true).reduce((s,g)=>s+n(g.assets),0) || 0;
    const allLiabilities = Object.values(comp).reduce((s,g)=>s+n(g.liabilities),0) || 0;
    if(groupId === 'investments'){
      const holdings = Number.isFinite(n(row.holdingsValue)) ? n(row.holdingsValue) : 0;
      const acctAssetBase = Math.max(0, n(row.accountAssets));
      const liveInvestmentAccounts = Math.max(0, n(liveGroup.assets) - n(liveGroup.holdings));
      const liveAccountAssets = Math.max(1, allAssets - n(comp.investments?.holdings));
      return holdings + (acctAssetBase * (liveInvestmentAccounts / liveAccountAssets));
    }
    if(groupId === 'credit' || groupId === 'debt'){
      const accountLiabilities = Math.max(0, n(row.accountLiabilities));
      const debtTracker = groupId === 'debt' ? Math.max(0, n(row.debtLiabilities)) : 0;
      const liveLiabBase = Math.max(1, allLiabilities - n(comp.debt?.debts));
      const liveGroupAccountLiability = Math.max(0, n(liveGroup.liabilities) - (groupId === 'debt' ? n(liveGroup.debts) : 0));
      return -(accountLiabilities * (liveGroupAccountLiability / liveLiabBase) + debtTracker);
    }
    const accountAssets = Math.max(0, n(row.accountAssets));
    const liveAssetBase = Math.max(1, allAssets - n(comp.investments?.holdings));
    return accountAssets * (Math.max(0, n(liveGroup.assets)) / liveAssetBase);
  }

  function snapshotGroupValue(row, groupId){
    if(groupId === 'all') return n(row.netWorth);
    const groups = row.accountGroups || row.groups || row.accountGroupBreakdown;
    const saved = groups && groups[groupId];
    if(saved){
      const assets = n(saved.assets);
      const liabilities = n(saved.liabilities);
      if(Number.isFinite(assets) && Number.isFinite(liabilities)) return assets - liabilities;
      if(Number.isFinite(n(saved.net))) return n(saved.net);
      if(Number.isFinite(n(saved.value))) return n(saved.value);
    }
    return legacySplitValue(row, groupId);
  }

  function categoryTrendPoints(groupId){
    const hist = snapshots();
    const live = accountGroupValue(groupId);
    const rows = hist.map(row => ({
      date:row.date,
      value:snapshotGroupValue(row, groupId),
      saved:true,
      note:row.note || 'Saved snapshot',
      netWorth:n(row.netWorth),
      assets: groupId === 'all' ? n(row.assets) : Math.max(0, snapshotGroupValue(row, groupId)),
      liabilities: groupId === 'all' ? n(row.liabilities) : Math.abs(Math.min(0, snapshotGroupValue(row, groupId))),
      raw:row
    })).filter(r => Number.isFinite(r.value));
    const today = new Date().toISOString().slice(0,10);
    const last = rows[rows.length-1];
    if(!last || last.date !== today || Math.abs(n(last.value) - n(live.net)) > 0.01){
      rows.push({date:today, value:live.net, saved:false, note:'Live balance', netWorth:live.net, assets:live.assets, liabilities:live.liabilities, raw:null});
    }
    return rows.slice(-24);
  }

  function renderAccountChartSubtitle(groupId, live){
    if(groupId === 'investments'){
      const holdingPart = live.holdings ? ` · ${money2(live.holdings)} holdings` : '';
      return `${live.count} investment item${live.count===1?'':'s'} · ${money2(live.assets)} assets${holdingPart}`;
    }
    if(groupId === 'credit' || groupId === 'debt') return `${live.count} included item${live.count===1?'':'s'} · ${money2(live.liabilities)} liabilities`;
    if(groupId === 'all') return `${live.count} included item${live.count===1?'':'s'} · ${money2(live.assets)} assets · ${money2(live.liabilities)} liabilities`;
    return `${live.count} included account${live.count===1?'':'s'} · ${money2(live.assets)} assets`;
  }

  function drawAccountTrend(active){
    const canvas = document.getElementById('v094AccountTrendCanvas');
    if(!canvas) return;
    drawLineChart(canvas, categoryTrendPoints(active), {money:true, group:active, title:groupMeta(active).label});
  }

  function ensureChartTooltip(wrap){
    let tip = wrap.querySelector('.v094-chart-tip');
    if(!tip){
      tip = document.createElement('div');
      tip.className = 'v094-chart-tip';
      tip.setAttribute('aria-hidden','true');
      wrap.appendChild(tip);
    }
    return tip;
  }

  function showChartTip(canvas, point, x, y, opts){
    const wrap = canvas.parentElement;
    const tip = ensureChartTooltip(wrap);
    const date = new Date(`${point.date}T00:00:00`);
    const dateText = Number.isNaN(date.getTime()) ? point.date : date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
    tip.innerHTML = `<b>${esc(dateText)}</b><strong class="${n(point.value)>=0?'good':'bad'}">${money2(point.value)}</strong><span>${point.saved?'Saved snapshot':'Live balance'} · ${esc(opts.title||'Account trend')}</span><em>Assets ${money2(point.assets || Math.max(0,n(point.value)))} · Liabilities ${money2(point.liabilities || Math.abs(Math.min(0,n(point.value))))}</em>`;
    const tx = Math.min(Math.max(10, x + 14), wrap.clientWidth - 230);
    const ty = Math.min(Math.max(10, y - 92), wrap.clientHeight - 108);
    tip.style.left = `${tx}px`;
    tip.style.top = `${ty}px`;
    tip.classList.add('visible');
    tip.setAttribute('aria-hidden','false');
  }
  function hideChartTip(canvas){
    const tip = canvas.parentElement?.querySelector('.v094-chart-tip');
    if(tip){ tip.classList.remove('visible'); tip.setAttribute('aria-hidden','true'); }
  }

  function bindChartInteractions(canvas, model, opts){
    canvas.__v094ChartModel = model;
    canvas.onmousemove = event => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const hit = model.points.reduce((best, p) => {
        const d = Math.hypot(p.x - x, p.y - y);
        return d < best.d ? {p,d} : best;
      }, {p:null,d:Infinity});
      if(hit.p && hit.d <= 22) showChartTip(canvas, hit.p.data, hit.p.x, hit.p.y, opts);
      else hideChartTip(canvas);
    };
    canvas.onmouseleave = () => hideChartTip(canvas);
    canvas.ontouchstart = event => {
      const touch = event.touches && event.touches[0];
      if(!touch) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const hit = model.points.reduce((best, p) => {
        const d = Math.hypot(p.x - x, p.y - y);
        return d < best.d ? {p,d} : best;
      }, {p:null,d:Infinity});
      if(hit.p && hit.d <= 30) showChartTip(canvas, hit.p.data, hit.p.x, hit.p.y, opts);
    };
  }

  function drawLineChart(canvas, points, opts={}){
    const wrap = canvas.parentElement;
    wrap.classList.add('v094-chart-wrap-interactive');
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
    if(!points.length){ bindChartInteractions(canvas,{points:[]},opts); return; }
    const grad=ctx.createLinearGradient(0,pad.t,0,height-pad.b); grad.addColorStop(0,'rgba(84,199,236,.20)'); grad.addColorStop(1,'rgba(84,199,236,0)');
    ctx.beginPath(); points.forEach((p,i)=>{ i?ctx.lineTo(x(i),y(n(p.value))):ctx.moveTo(x(i),y(n(p.value))); }); ctx.lineTo(x(points.length-1),height-pad.b); ctx.lineTo(x(0),height-pad.b); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath(); points.forEach((p,i)=>{ i?ctx.lineTo(x(i),y(n(p.value))):ctx.moveTo(x(i),y(n(p.value))); }); ctx.strokeStyle='#54C7EC'; ctx.lineWidth=3; ctx.stroke();
    const model={points:[]};
    points.forEach((p,i)=>{ const px=x(i), py=y(n(p.value)); model.points.push({x:px,y:py,data:p}); ctx.fillStyle=p.saved?'#54C7EC':'#fb923c'; ctx.beginPath(); ctx.arc(px,py,p.saved?4.5:5.5,0,Math.PI*2); ctx.fill(); if(p.saved){ ctx.strokeStyle='rgba(84,199,236,.35)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(px,py,8,0,Math.PI*2); ctx.stroke(); } });
    const every=points.length>8?Math.ceil(points.length/6):1; ctx.fillStyle=getCss('--muted','#94a3b8');
    points.forEach((p,i)=>{ if(i%every!==0 && i!==points.length-1) return; const d=new Date(`${p.date}T00:00:00`); const label=d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); ctx.fillText(label,Math.max(0,Math.min(width-52,x(i)-20)),height-10); });
    bindChartInteractions(canvas,model,opts);
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
    view.classList.add('v094-investments-active');
    view.innerHTML = `<div class="v094-invest-page"><div class="page-head v094-page-head"><div><h2 class="section-title">Investments</h2><p class="section-sub">Manual holdings, allocation, value, and net-worth inclusion without a dense table-first layout.</p></div><div class="actions"><button class="btn" onclick="exportTrackerCsv('holdings')">Export CSV</button><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div><section class="v094-invest-metrics"><div><span>Portfolio value</span><b class="good">${money0(value)}</b><em>${holdings.length} manual holding${holdings.length===1?'':'s'}</em></div><div><span>Gain / loss</span><b class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money0(gain)}</b><em>${cost?pct(gain/cost*100)+' on cost':'Add cost basis'}</em></div><div><span>Cost basis</span><b>${money0(cost)}</b><em>Manual purchase basis</em></div><div><span>Net worth included</span><b>${money0(included)}</b><em>Exclude duplicates</em></div></section><div class="v094-invest-grid"><section class="card v094-holdings-card"><div class="v094-list-head"><div><h3>Holdings</h3><p>Cards replace the dense table on desktop and mobile.</p></div><button class="btn btn-small" onclick="openDrawer('holding')">Add</button></div>${holdings.length?holdings.map(holdingCard).join(''):`<div class="v094-empty"><b>No holdings yet</b><span>Add stocks, funds, bonds, cash, or crypto manually.</span><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div>`}</section><aside class="card v094-allocation"><h3>Allocation</h3><p>Grouped by asset class.</p><div class="v094-allocation-list">${alloc.length?alloc.map((a,i)=>`<button onclick="filterPortfolioAssetClass ? filterPortfolioAssetClass('${js(a.name)}') : null"><span><b>${esc(a.name)}</b><em>${pct(a.pct)} · ${money0(a.value)}</em></span><i><b style="width:${Math.max(4,a.pct)}%"></b></i></button>`).join(''):`<div class="v094-empty"><b>No allocation yet</b><span>Add holdings to see weights.</span></div>`}</div></aside></div></div>`;
  }
  function holdingValueSafe(h){ try { return holdingValue(h); } catch(e){ return n(h.quantity)*n(h.price); } }
  function holdingCostSafe(h){ try { return holdingCost(h); } catch(e){ return n(h.quantity)*n(h.costBasis); } }
  function assetClass(h){ const raw=String(h.assetClass||'Other'); if(/stock|equity/i.test(raw)) return 'Stocks'; if(/fund|etf|index/i.test(raw)) return 'Funds'; if(/bond|treasury/i.test(raw)) return 'Bonds'; if(/cash|money market/i.test(raw)) return 'Cash'; if(/crypto/i.test(raw)) return 'Crypto'; return raw; }
  function allocationRows(holdings,total){ const map={}; holdings.forEach(h=>{ const k=assetClass(h); map[k]=(map[k]||0)+holdingValueSafe(h); }); return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value,pct:total?value/total*100:0})); }
  function holdingCard(h){ const value=holdingValueSafe(h), cost=holdingCostSafe(h), gain=value-cost; return `<article class="v094-holding"><div class="v094-holding-main"><span>${esc(String(h.symbol||h.name||'H').slice(0,4).toUpperCase())}</span><div><b>${esc(h.symbol||h.name||'Holding')}</b><em>${esc(h.name&&h.symbol?h.name:(h.account||'Manual'))} · ${esc(assetClass(h))}</em></div><strong>${money0(value)}</strong></div><div class="v094-holding-meta"><span>${n(h.quantity).toLocaleString()} shares</span><span>${money2(h.price)} price</span><span class="${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money0(gain)}</span><span>${h.includeNetWorth!==false?'Included':'Excluded'}</span></div><div class="v094-holding-actions"><button class="btn btn-small" onclick="toggleHoldingInclude('${esc(h.id)}')">${h.includeNetWorth!==false?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${esc(h.id)}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${esc(h.id)}')">Delete</button></div></article>`; }


  function patchGroupDirectionSync(){
    const oldSetGroup = window.v092SetAccountGroup;
    if(typeof oldSetGroup === 'function' && !oldSetGroup.__v094Wrapped){
      window.v092SetAccountGroup = function(groupId, desiredType='', skipTitle=false){
        const result = oldSetGroup.apply(this, arguments);
        const dir = document.getElementById('acctDirection');
        const type = document.getElementById('acctType')?.value || '';
        if(dir && !dir.dataset.userTouched){ dir.value = isLiabilityType(type) ? 'liability' : 'asset'; }
        return result;
      };
      window.v092SetAccountGroup.__v094Wrapped = true;
    }
  }

  function patchAccountDrawer(){
    const oldOpen = window.openDrawer;
    if(typeof oldOpen !== 'function' || oldOpen.__v094Wrapped) return;
    window.openDrawer = function(type, data){
      const result = oldOpen.apply(this, arguments);
      if(type === 'account') setTimeout(()=>enhanceAccountDirection(data||null), 0);
      return result;
    };
    window.openDrawer.__v094Wrapped = true;
  }
  function enhanceAccountDirection(data){
    const quick = document.querySelector('.v092-quick-grid');
    if(!quick || document.getElementById('acctDirection')) return;
    const dir = data?.direction || data?.balanceDirection || (isLiabilityType(document.getElementById('acctType')?.value) ? 'liability' : 'asset');
    const field = document.createElement('div');
    field.className = 'v094-field v094-direction-field';
    field.innerHTML = `<label>Direction</label><select id="acctDirection" onchange="this.dataset.userTouched='1'"><option value="asset" ${dir==='asset'?'selected':''}>Asset</option><option value="liability" ${dir==='liability'?'selected':''}>Liability</option></select>`;
    quick.appendChild(field);
  }

  function renderV094(){
    markBuild();
    patchSaveAccount();
    patchSaveNetWorthSnapshot();
    patchGroupDirectionSync();
    patchAccountDrawer();
    renderHome();
    renderAccounts();
    renderInvestments();
  }

  function wrapRender(){
    const oldRender = window.renderAll;
    if(typeof oldRender === 'function' && !oldRender.__v094Wrapped){
      window.renderAll = function(){ const result = oldRender.apply(this, arguments); requestAnimationFrame(renderV094); return result; };
      window.renderAll.__v094Wrapped = true;
    }
    const oldShow = window.showView;
    if(typeof oldShow === 'function' && !oldShow.__v094Wrapped){
      window.showView = function(){ const result = oldShow.apply(this, arguments); requestAnimationFrame(renderV094); return result; };
      window.showView.__v094Wrapped = true;
    }
  }

  function init(){ wrapRender(); renderV094(); window.addEventListener('resize',()=>requestAnimationFrame(()=>{ if(activeView==='accounts') drawAccountTrend(state.settings?.accountsTrendGroup||'all'); }),{passive:true}); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init,250);
})();
