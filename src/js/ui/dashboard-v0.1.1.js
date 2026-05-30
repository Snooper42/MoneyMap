/* MoneyMap dashboard v0.1.1 — chart-first mobile/desktop overview */
(function(){
  'use strict';

  var BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.1';
  if(window.__mmDashboardV011) return;
  window.__mmDashboardV011 = true;

  function esc(v){
    if(typeof escapeHtml === 'function') return escapeHtml(String(v ?? ''));
    return String(v ?? '').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function js(v){ return typeof escapeJs === 'function' ? escapeJs(String(v ?? '')) : String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function n(v){ return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function fmt(v){
    try{ if(typeof v54FriendlyMoney === 'function') return v54FriendlyMoney(v); }catch(e){}
    try{ if(typeof money === 'function') return money(v); }catch(e){}
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n(v));
  }
  function fmtFull(v){
    try{ if(typeof money === 'function') return money(v,{cents:true}); }catch(e){}
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n(v));
  }
  function todayMonth(){ return typeof currentMonth === 'function' ? currentMonth() : new Date().toISOString().slice(0,7); }
  function monthName(key){
    try{ if(typeof monthLabel === 'function') return monthLabel(key); }catch(e){}
    return key;
  }
  function monthShort(key){
    var parts = String(key||'').split('-');
    var d = new Date(Number(parts[0]||new Date().getFullYear()), Number(parts[1]||1)-1, 1);
    return d.toLocaleDateString('en-US',{month:'short'});
  }
  function addMonths(key, delta){
    var parts=String(key||todayMonth()).split('-');
    var d=new Date(Number(parts[0]), Number(parts[1])-1+delta, 1);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  }
  function monthKeys(count){
    var now=todayMonth();
    return Array.from({length:count},function(_,i){ return addMonths(now, i-count+1); });
  }
  function txForMonth(key){
    try{ return monthTransactions(key); }catch(e){ return (state.transactions||[]).filter(function(t){ return String(t.date||'').slice(0,7)===key && !t.hidden; }); }
  }
  function cashFor(key){
    var tx=txForMonth(key);
    var spend=0, income=0;
    try{ spend=spendingFor(tx); }catch(e){ spend=tx.filter(function(t){ return n(t.amount)<0 && !t.hidden; }).reduce(function(s,t){return s+Math.abs(n(t.amount));},0); }
    try{ income=incomeFor(tx); }catch(e){ income=tx.filter(function(t){ return n(t.amount)>0 && !t.hidden; }).reduce(function(s,t){return s+n(t.amount);},0); }
    return {key:key, spend:spend, income:income, net:income-spend};
  }
  function catRows(){
    var rows=[];
    try{ rows=byCategory(txForMonth(todayMonth())); }catch(e){ rows=[]; }
    return rows.slice(0,6).map(function(row){ return {name:row[0], value:n(row[1])}; });
  }
  function latestTransactions(limit){
    return (state.transactions||[]).filter(function(t){ return !t.hidden; }).slice().sort(function(a,b){ return String(b.date).localeCompare(String(a.date)); }).slice(0,limit||4);
  }
  function unreviewedTx(){ return (state.transactions||[]).filter(function(t){ return !t.reviewed && !t.hidden; }); }
  function overBudgetRows(){
    try{ return budgetStats().slice().sort(function(a,b){ return b.pct-a.pct; }).slice(0,4); }
    catch(e){ return []; }
  }
  function netWorth(){
    try{ return netWorthBreakdown(); }catch(e){ return {netWorth:0, assets:0, liabilities:0}; }
  }
  function snapshotRows(){
    return (state.netWorthHistory||[]).slice().sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  }
  function sparkline(values){
    if(!values || values.length < 2) return '<div class="mm11-empty-chart">Save more snapshots to chart trend.</div>';
    var min=Math.min.apply(null,values), max=Math.max.apply(null,values), span=max-min || 1;
    var pts=values.map(function(v,i){ var x=(i/(values.length-1))*100; var y=44-((v-min)/span)*38; return x.toFixed(2)+','+y.toFixed(2); }).join(' ');
    return '<svg class="mm11-spark" viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="mm11Spark" x1="0" x2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--good)"/></linearGradient></defs><polyline points="'+pts+'" fill="none" stroke="url(#mm11Spark)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="'+pts+' 100,48 0,48" fill="var(--accent)" opacity=".08" stroke="none"/></svg>';
  }
  function buildTopRail(){
    var open=unreviewedTx().length;
    return '<div class="mm11-rail" aria-label="Primary workflow shortcuts">' +
      '<button type="button" class="mm11-rail-btn primary" onclick="startWeeklyReview()"><span>Review</span><b>'+esc(open)+'</b></button>' +
      '<button type="button" class="mm11-rail-btn" onclick="showView(\'import\')"><span>Import</span></button>' +
      '<button type="button" class="mm11-rail-btn" onclick="showView(\'transactions\')"><span>Transactions</span></button>' +
      '<button type="button" class="mm11-rail-btn" onclick="showView(\'budgets\')"><span>Budgets</span></button>' +
      '</div>';
  }
  function buildHero(){
    var nw=netWorth();
    var snaps=snapshotRows();
    var vals=snaps.slice(-8).map(function(s){ return n(s.netWorth); });
    var latest=snaps[snaps.length-1] || null;
    var previous=snaps[snaps.length-2] || null;
    var delta=latest && previous ? n(latest.netWorth)-n(previous.netWorth) : null;
    var deltaText = delta===null ? 'No prior snapshot' : (delta>=0?'+':'')+fmt(delta)+' since last save';
    var deltaCls = delta===null ? '' : (delta>=0?'good':'bad');
    return '<section class="mm11-hero-card">' +
      '<div class="mm11-hero-copy"><div class="mm11-kicker">Dashboard</div><h2>'+esc(fmt(nw.netWorth))+'</h2><p>Current net worth from included accounts, holdings, and debts.</p><div class="mm11-inline-stats"><span><b class="good">'+esc(fmt(nw.assets))+'</b> assets</span><span><b class="bad">'+esc(fmt(nw.liabilities))+'</b> liabilities</span><span><b class="'+deltaCls+'">'+esc(deltaText)+'</b></span></div></div>' +
      '<div class="mm11-hero-chart"><div class="mm11-chart-head"><span>Net worth trend</span><button type="button" class="btn btn-small" onclick="saveNetWorthSnapshot()">Save snapshot</button></div>'+sparkline(vals)+'</div>' +
      '</section>';
  }
  function buildCashChart(){
    var series=monthKeys(6).map(cashFor);
    var max=Math.max(1, ...series.map(function(r){ return Math.max(r.spend,r.income,Math.abs(r.net)); }));
    var current=series[series.length-1] || {income:0,spend:0,net:0};
    var bars=series.map(function(r){
      var incomeH=Math.max(4,Math.round(r.income/max*100));
      var spendH=Math.max(4,Math.round(r.spend/max*100));
      return '<div class="mm11-month-bar" title="'+esc(monthName(r.key))+'"><div class="mm11-bars"><i class="income" style="height:'+incomeH+'%"></i><i class="spend" style="height:'+spendH+'%"></i></div><span>'+esc(monthShort(r.key))+'</span></div>';
    }).join('');
    return '<section class="mm11-card mm11-cash-card"><div class="mm11-card-head"><div><h3>Cash flow</h3><p>'+esc(monthName(todayMonth()))+'</p></div><strong class="'+(current.net>=0?'good':'bad')+'">'+esc(fmt(current.net))+'</strong></div><div class="mm11-cash-summary"><span><b class="good">'+esc(fmt(current.income))+'</b> income</span><span><b class="bad">'+esc(fmt(current.spend))+'</b> spent</span></div><div class="mm11-bar-chart">'+bars+'</div><div class="mm11-legend"><span><i class="income"></i>Income</span><span><i class="spend"></i>Spend</span></div></section>';
  }
  function buildCategoryChart(){
    var rows=catRows();
    var total=rows.reduce(function(s,r){ return s+r.value; },0);
    var max=Math.max(1, ...rows.map(function(r){ return r.value; }));
    var html=rows.length ? rows.map(function(r,i){
      var pct=total?Math.round(r.value/total*100):0;
      var width=Math.max(3,Math.round(r.value/max*100));
      return '<button type="button" class="mm11-cat-row" onclick="showCategoryTransactions(\''+js(r.name)+'\')"><span class="mm11-cat-rank">'+(i+1)+'</span><span class="mm11-cat-copy"><b>'+esc(r.name)+'</b><i><em style="width:'+width+'%"></em></i></span><span class="mm11-cat-value"><b>'+esc(fmt(r.value))+'</b><small>'+pct+'%</small></span></button>';
    }).join('') : '<div class="mm11-empty-chart">Import transactions to see category charts.</div>';
    return '<section class="mm11-card"><div class="mm11-card-head"><div><h3>Spend mix</h3><p>Top visible categories</p></div><button type="button" class="btn btn-small" onclick="showView(\'transactions\')">View all</button></div><div class="mm11-cat-list">'+html+'</div></section>';
  }
  function buildReviewCard(){
    var open=unreviewedTx();
    var total=(state.transactions||[]).filter(function(t){return !t.hidden;}).length;
    var pct=total?Math.round((total-open.length)/total*100):0;
    var messy=open.filter(function(t){ try{return merchantLooksMessy(t.rawDescription||t.description);}catch(e){return false;} }).length;
    return '<section class="mm11-card mm11-review-card"><div class="mm11-card-head"><div><h3>Review queue</h3><p>Reports are clean after this hits zero.</p></div><strong class="'+(open.length?'warn':'good')+'">'+esc(String(open.length))+'</strong></div><div class="mm11-ring" style="--mm11-p:'+pct+'"><span>'+pct+'%</span></div><div class="mm11-list-compact"><div><span>Approved visible transactions</span><b>'+esc(String(total-open.length))+'/'+esc(String(total))+'</b></div><div><span>Messy merchants in queue</span><b>'+esc(String(messy))+'</b></div></div><button type="button" class="btn btn-primary" onclick="startWeeklyReview()">Review '+esc(String(open.length))+'</button></section>';
  }
  function buildBudgetCard(){
    var rows=overBudgetRows();
    var html=rows.length ? rows.map(function(b){
      var cls=b.pct>=100?'bad':b.pct>=80?'warn':'good';
      return '<button type="button" class="mm11-risk-row" onclick="showCategoryTransactions(\''+js(b.category)+'\')"><div><b>'+esc(b.category)+'</b><span>'+esc(fmt(Math.max(0,b.remaining)))+' left of '+esc(fmt(b.limit))+'</span></div><strong class="'+cls+'">'+esc(String(b.pct))+'%</strong></button>';
    }).join('') : '<div class="mm11-empty-chart">Add budgets to see pressure here.</div>';
    return '<section class="mm11-card"><div class="mm11-card-head"><div><h3>Budget pressure</h3><p>Largest limits and overages</p></div><button type="button" class="btn btn-small" onclick="showView(\'budgets\')">Manage</button></div><div class="mm11-risk-list">'+html+'</div></section>';
  }
  function buildActivityCard(){
    var rows=latestTransactions(4);
    var html=rows.length ? rows.map(function(t){
      var amount=n(t.amount);
      return '<button type="button" class="mm11-tx-row" onclick="editTransaction(\''+js(t.id)+'\')"><span>'+esc(String(t.description||'?').trim().slice(0,1).toUpperCase()||'?')+'</span><div><b>'+esc(t.description||'Transaction')+'</b><small>'+esc(typeof dateFmt==='function'?dateFmt(t.date):t.date)+' · '+esc(t.category||'Other')+'</small></div><strong class="'+(amount<0?'bad':'good')+'">'+esc(fmt(amount))+'</strong></button>';
    }).join('') : '<div class="mm11-empty-chart">No recent transactions yet.</div>';
    return '<section class="mm11-card"><div class="mm11-card-head"><div><h3>Recent activity</h3><p>Tap any row to edit.</p></div><button type="button" class="btn btn-small" onclick="openDrawer(\'transaction\')">Add</button></div><div class="mm11-tx-list">'+html+'</div></section>';
  }
  function buildRecurringCard(){
    var rec=[];
    try{ rec=upcomingRecurringItems(3); }catch(e){ rec=[]; }
    var html=rec.length ? rec.map(function(r){ return '<button type="button" class="mm11-risk-row" onclick="showView(\'recurring\')"><div><b>'+esc(r.merchant)+'</b><span>'+esc(typeof dateFmt==='function'?dateFmt(r.nextDate):r.nextDate)+' · '+esc((r.daysUntil<=0?'due now':r.daysUntil+' days'))+'</span></div><strong>'+esc(fmt(r.monthly))+'</strong></button>'; }).join('') : '<div class="mm11-empty-chart">Import more history to detect bills.</div>';
    return '<section class="mm11-card"><div class="mm11-card-head"><div><h3>Bills watch</h3><p>Detected recurring charges</p></div><button type="button" class="btn btn-small" onclick="showView(\'recurring\')">Open</button></div><div class="mm11-risk-list">'+html+'</div></section>';
  }

  function ensureReviewInMobileNav(){
    try{
      if(!state || !state.settings) return;
      var target=['overview','review','transactions','budgets'];
      var current=state.settings.mobileNavItems;
      var legacy=state.settings.mobileTabs;
      var needs=false;
      if(Array.isArray(current) && !current.includes('review')) needs=true;
      if(Array.isArray(legacy) && !legacy.includes('review')) needs=true;
      if(!Array.isArray(current) || needs) state.settings.mobileNavItems=target.slice();
      if(!Array.isArray(legacy) || needs) state.settings.mobileTabs=target.slice();
    }catch(e){}
  }

  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var meta=document.querySelector('meta[name="moneymap-build"]'); if(meta) meta.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }

  function renderDashboard(){
    var view=document.getElementById('view-overview');
    if(!view) return;
    var isOverview = (typeof activeView !== 'undefined' ? activeView : 'overview') === 'overview' || view.classList.contains('active');
    document.body.classList.add('mm-v011-dashboard');
    document.body.classList.toggle('mm-v011-overview-active', !!isOverview);
    ensureReviewInMobileNav();
    var host=document.getElementById('mm-dash-v011-host');
    if(!host){ host=document.createElement('div'); host.id='mm-dash-v011-host'; host.className='mm-dash-v011'; view.insertBefore(host,view.firstChild); }
    host.innerHTML=buildTopRail()+buildHero()+'<div class="mm11-primary-grid">'+buildCashChart()+buildCategoryChart()+'</div><div class="mm11-secondary-grid">'+buildReviewCard()+buildBudgetCard()+buildRecurringCard()+buildActivityCard()+'</div>';
    try{ if(typeof buildMobileNav==='function') buildMobileNav(); }catch(e){}
    markBuild();
  }

  if(window.MoneyMapRenderBus) window.MoneyMapRenderBus.register('dashboard-v011',renderDashboard,92);
  var oldRender=window.renderAll;
  if(typeof oldRender==='function' && !oldRender.__mmDashV011Wrapped){
    window.renderAll=function(){ var out=oldRender.apply(this,arguments); requestAnimationFrame(renderDashboard); return out; };
    window.renderAll.__mmDashV011Wrapped=true;
  }
  var oldShow=window.showView;
  if(typeof oldShow==='function' && !oldShow.__mmDashV011Wrapped){
    window.showView=function(id){ var out=oldShow.apply(this,arguments); requestAnimationFrame(renderDashboard); return out; };
    window.showView.__mmDashV011Wrapped=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ requestAnimationFrame(renderDashboard); });
  else requestAnimationFrame(renderDashboard);
  setTimeout(renderDashboard,250);
  setInterval(markBuild,1500);
})();
