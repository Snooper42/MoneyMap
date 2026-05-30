/* MoneyMap v0.9.1 Home dashboard polish.
   Adds richer spending history and a cleaner monthly spending breakdown. */
(function(){
  'use strict';

  if(window.__MoneyMapV091Loaded) return;
  window.__MoneyMapV091Loaded = true;

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.1';
  const MONTHS = 6;

  const esc = value => (typeof escapeHtml === 'function')
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const js = value => (typeof escapeJs === 'function') ? escapeJs(String(value ?? '')) : String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const money0 = value => {
    const currency = state?.settings?.currency || 'USD';
    return new Intl.NumberFormat('en-US',{style:'currency',currency,minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(value||0));
  };
  const n = value => typeof nval === 'function' ? nval(value) : Number(value || 0);

  function markBuild(){
    window.MONEYMAP_EXPECTED_BUILD = BUILD;
    document.documentElement.setAttribute('data-moneymap-build', BUILD);
    const meta = document.querySelector('meta[name="moneymap-build"]');
    if(meta) meta.setAttribute('content', BUILD);
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
  }

  function allTx(){ return Array.isArray(state?.transactions) ? state.transactions : []; }
  function visibleTx(){ return allTx().filter(t => !t.hidden); }
  function monthOf(value){ try { return monthKey(value); } catch(e){ return String(value || '').slice(0,7); } }
  function currentMonthKey(){ return typeof currentMonth === 'function' ? currentMonth() : new Date().toISOString().slice(0,7); }
  function labelMonth(value){ try { return monthLabel(value); } catch(e){ return String(value || ''); } }
  function txForMonth(key){ return visibleTx().filter(t => monthOf(t.date) === key); }
  function spendForRows(rows){ return typeof spendingFor === 'function' ? spendingFor(rows) : rows.filter(t => Number(t.amount) < 0 && !['Transfers','Income'].includes(t.category)).reduce((sum,t)=>sum+Math.abs(Number(t.amount||0)),0); }
  function incomeForRows(rows){ return typeof incomeFor === 'function' ? incomeFor(rows) : rows.filter(t => Number(t.amount) > 0).reduce((sum,t)=>sum+Number(t.amount||0),0); }
  function catsForRows(rows){ return typeof byCategory === 'function' ? byCategory(rows) : categoryFallback(rows); }
  function categoryFallback(rows){
    const map = {};
    rows.filter(t => Number(t.amount) < 0 && !t.hidden && !['Transfers','Income'].includes(t.category)).forEach(t => {
      const cat = t.category || 'Other';
      map[cat] = (map[cat] || 0) + Math.abs(Number(t.amount || 0));
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  }
  function breakdown(){ try { return netWorthBreakdown(); } catch(e){ return {assets:0, liabilities:0, netWorth:0}; } }

  function lastMonths(count = MONTHS){
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
      return {key, rows, spend, income, net:income - spend, count:rows.length};
    });
  }

  function latestSnapshot(){
    return (state?.netWorthHistory || []).slice().sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))).slice(-1)[0] || null;
  }

  function trendStats(series){
    const current = series[series.length - 1] || {spend:0,count:0,key:currentMonthKey()};
    const prev = series[series.length - 2] || null;
    const nonzero = series.filter(m => m.spend > 0);
    const average = nonzero.length ? nonzero.reduce((sum,m)=>sum+m.spend,0) / nonzero.length : 0;
    const three = series.slice(-3).filter(m=>m.spend>0);
    const threeAvg = three.length ? three.reduce((sum,m)=>sum+m.spend,0) / three.length : 0;
    const biggest = nonzero.slice().sort((a,b)=>b.spend-a.spend)[0] || null;
    const change = prev ? current.spend - prev.spend : 0;
    return {current, prev, average, threeAvg, biggest, change};
  }

  function budgetForCategory(category){
    const budgets = Array.isArray(state?.budgets) ? state.budgets : [];
    return budgets.find(b => String(b.category || '').toLowerCase() === String(category || '').toLowerCase()) || null;
  }

  function nextAction(){
    const unreviewed = allTx().filter(t => !t.reviewed).length;
    if(!allTx().length) return {title:'Start with one upload.', sub:'Upload transactions and MoneyMap will clean, chart, and remember your imports.', primary:'Upload transactions', fn:"showView('import')"};
    if(unreviewed) return {title:'Review is next.', sub:`${unreviewed} transactions still need approval or cleanup before reports are fully trustworthy.`, primary:`Review ${unreviewed}`, fn:'startWeeklyReview()'};
    return {title:'Your month is organized.', sub:'Spending history, net worth, and categories are ready to scan.', primary:'Import more', fn:"showView('import')"};
  }

  function heroHtml(){
    const action = nextAction();
    const worth = breakdown();
    const snapshots = state?.netWorthHistory || [];
    const latest = latestSnapshot();
    const liveDelta = latest ? n(worth.netWorth) - n(latest.netWorth) : 0;
    return `<section class="v091-hero">
      <div class="v091-hero-copy">
        <span class="v091-eyebrow">Home</span>
        <h2>${esc(action.title)}</h2>
        <p>${esc(action.sub)}</p>
        <div class="v091-actions"><button type="button" class="btn btn-primary" onclick="${action.fn}">${esc(action.primary)}</button><button type="button" class="btn" onclick="showView('import')">Import more</button><button type="button" class="btn" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save net-worth snapshot</button></div>
        <div class="v091-assurance"><span>Duplicate guard</span><span>Merchant cleanup</span><span>Transfer hiding</span><span>Saved mappings</span></div>
      </div>
      <div class="v091-worth-card">
        <div class="v091-worth-top"><span>Net worth right now</span><b>${snapshots.length} snapshot${snapshots.length===1?'':'s'}</b></div>
        <strong class="v091-worth-value ${worth.netWorth>=0?'good':'bad'}">${money0(worth.netWorth)}</strong>
        <p>${latest ? `Last saved ${esc(typeof dateFmt === 'function' ? dateFmt(latest.date) : latest.date)} at ${money0(latest.netWorth)}` : 'No snapshots saved yet. Save today to start a locked history.'}</p>
        <div class="v091-worth-grid"><div><span>Assets</span><b class="good">${money0(worth.assets)}</b></div><div><span>Liabilities</span><b class="bad">${money0(worth.liabilities)}</b></div><div><span>Live vs last save</span><b class="${liveDelta>=0?'good':'bad'}">${latest ? `${liveDelta>=0?'+':'-'}${money0(Math.abs(liveDelta))}` : '—'}</b></div><div><span>Saved history</span><b>${snapshots.length}</b></div></div>
        <div class="v091-card-actions"><button type="button" class="btn btn-primary btn-small" onclick="v07SaveSnapshotToday ? v07SaveSnapshotToday() : saveNetWorthSnapshot()">Save today</button><button type="button" class="btn btn-small" onclick="showView('accounts')">Open accounts</button></div>
      </div>
    </section>`;
  }

  function spendingHistoryHtml(series){
    const stats = trendStats(series);
    const max = Math.max(1, ...series.map(m => m.spend));
    const monthChangeText = !stats.prev ? 'No previous month' : `${stats.change >= 0 ? '+' : '-'}${money0(Math.abs(stats.change))} vs ${labelMonth(stats.prev.key).split(' ')[0]}`;
    return `<section class="v091-panel v091-history-panel">
      <div class="v091-panel-head"><div><h3>Spending history</h3><p>Actual monthly spend from visible imported transactions.</p></div><span>${MONTHS} months</span></div>
      <div class="v091-history-stats">
        <div><span>This month</span><b>${money0(stats.current.spend)}</b><em>${stats.current.count} transaction${stats.current.count===1?'':'s'}</em></div>
        <div><span>Average</span><b>${money0(stats.average)}</b><em>Non-zero months</em></div>
        <div><span>3 month avg</span><b>${money0(stats.threeAvg)}</b><em>${monthChangeText}</em></div>
        <div><span>Highest month</span><b>${stats.biggest ? money0(stats.biggest.spend) : '—'}</b><em>${stats.biggest ? esc(labelMonth(stats.biggest.key)) : 'No spend yet'}</em></div>
      </div>
      <div class="v091-bars">${series.map((m, idx) => {
        const pct = m.spend > 0 ? Math.max(12, Math.round((m.spend / max) * 100)) : 4;
        const isCurrent = idx === series.length - 1;
        const income = m.income > 0 ? `<span class="v091-bar-income">${money0(m.income)} income</span>` : '<span class="v091-bar-income">No income</span>';
        return `<button type="button" class="v091-bar ${isCurrent?'current':''}" onclick="v091OpenMonth('${esc(m.key)}')">
          <span class="v091-bar-label-top">${m.spend ? money0(m.spend) : '—'}</span>
          <span class="v091-bar-rail"><i style="height:${pct}%"></i></span>
          <b>${esc(labelMonth(m.key).split(' ')[0])}</b>
          <em>${m.count} tx</em>
          ${income}
        </button>`;
      }).join('')}</div>
      <div class="v091-history-note"><b>Reading this</b><span>Bars compare real spending. Empty months stay visible so the timeline does not jump around as history grows.</span></div>
    </section>`;
  }

  function monthlySummaryHtml(series){
    const key = currentMonthKey();
    const rows = txForMonth(key);
    const spend = spendForRows(rows);
    const income = incomeForRows(rows);
    const hidden = allTx().filter(t => t.hidden).length;
    const unreviewed = allTx().filter(t => !t.reviewed).length;
    const categories = catsForRows(rows).slice(0,5);
    const prev = series[series.length - 2] || null;
    const change = prev ? spend - prev.spend : 0;
    return `<section class="v091-panel v091-month-panel">
      <div class="v091-panel-head"><div><h3>${esc(labelMonth(key))}</h3><p>Live month summary from visible transactions.</p></div><span>${change ? `${change>0?'+':'-'}${money0(Math.abs(change))} vs last` : 'Current month'}</span></div>
      <div class="v091-month-kpis">
        <div><span>Spent</span><b class="bad">${money0(spend)}</b><em>${rows.length} tracked items</em></div>
        <div><span>Income</span><b class="good">${money0(income)}</b><em>${hidden} hidden or transfer rows excluded</em></div>
        <div><span>Net cash flow</span><b class="${income-spend>=0?'good':'bad'}">${money0(income-spend)}</b><em>${unreviewed} unreviewed transaction${unreviewed===1?'':'s'}</em></div>
      </div>
      <div class="v091-breakdown-head"><div><h4>Spending breakdown</h4><p>Top categories with budget context when a monthly limit exists.</p></div><button type="button" class="btn btn-small" onclick="showView('budgets')">Budgets</button></div>
      <div class="v091-category-list">${categories.length ? categories.map(([category, value], idx) => {
        const budget = budgetForCategory(category);
        const limit = budget ? Math.abs(n(budget.limit)) : 0;
        const pct = budget && limit ? Math.min(140, Math.round((value / limit) * 100)) : Math.round((value / (spend || 1)) * 100);
        const barPct = Math.max(4, Math.min(100, pct));
        const sub = budget && limit ? `${pct}% of ${money0(limit)} limit` : `${pct}% of this month's spend`;
        const remaining = budget && limit ? limit - value : null;
        const tone = remaining !== null && remaining < 0 ? 'over' : idx === 0 ? 'top' : '';
        return `<button type="button" class="v091-category-row ${tone}" onclick="showCategoryTransactions('${js(category)}')">
          <span class="v091-dot c${idx%5}"></span>
          <span class="v091-category-main"><b>${esc(category)}</b><em>${esc(sub)}</em><i><span style="width:${barPct}%"></span></i></span>
          <strong>${money0(value)}</strong>
          <small>${remaining === null ? 'No limit' : remaining >= 0 ? `${money0(remaining)} left` : `${money0(Math.abs(remaining))} over`}</small>
        </button>`;
      }).join('') : `<div class="v091-empty"><b>No spending yet</b><span>Import transactions and this turns into a clean spending breakdown.</span><button type="button" class="btn btn-primary btn-small" onclick="showView('import')">Import</button></div>`}</div>
    </section>`;
  }

  function renderHome(){
    const view = document.getElementById('view-overview');
    if(!view) return;
    view.classList.add('v091-active');
    let el = document.getElementById('v091HomeDashboard');
    if(!el){
      el = document.createElement('section');
      el.id = 'v091HomeDashboard';
      view.prepend(el);
    }
    const series = monthSeries();
    el.innerHTML = `${heroHtml()}<div class="v091-home-grid">${spendingHistoryHtml(series)}${monthlySummaryHtml(series)}</div>`;
  }

  window.v091OpenMonth = function(key){
    try { showView('transactions'); } catch(e) {}
    requestAnimationFrame(() => {
      const sel = document.getElementById('filterMonth');
      if(sel) sel.value = key;
      if(typeof renderAll === 'function') renderAll();
    });
  };

  function renderV091(){
    markBuild();
    renderHome();
  }

  function wrap(){
    const oldRender = window.renderAll;
    if(typeof oldRender === 'function' && !oldRender.__v091Wrapped){
      window.renderAll = function(){
        const result = oldRender.apply(this, arguments);
        requestAnimationFrame(renderV091);
        return result;
      };
      window.renderAll.__v091Wrapped = true;
    }
    const oldShow = window.showView;
    if(typeof oldShow === 'function' && !oldShow.__v091Wrapped){
      window.showView = function(){
        const result = oldShow.apply(this, arguments);
        requestAnimationFrame(renderV091);
        return result;
      };
      window.showView.__v091Wrapped = true;
    }
  }

  function init(){
    wrap();
    renderV091();
    window.addEventListener('resize', () => requestAnimationFrame(renderV091), {passive:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 250);
})();
