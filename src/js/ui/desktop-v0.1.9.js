/* MoneyMap v0.1.9 — dashboard command center polish, account shortcuts, and local-only preview flow. */
(function(){
  'use strict';
  var BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || 'v0.1.9';
  var hostId = 'mmDesktopDashboardV019';

  function stateReady(){ try{ return typeof state !== 'undefined' && state && Array.isArray(state.transactions); }catch(e){ return false; } }
  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];});
  }
  function js(value){ return typeof escapeJs === 'function' ? escapeJs(value) : String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function n(value){ return typeof nval === 'function' ? nval(value) : (Number(value) || 0); }
  function fmt(value){ return typeof money === 'function' ? money(value) : '$' + Math.round(n(value)).toLocaleString(); }
  function dateLabel(value){ return typeof dateFmt === 'function' ? dateFmt(value) : String(value || ''); }
  function monthKey(date){ var d=date?new Date(date):new Date(); if(isNaN(d)) d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
  function currentKey(){ return typeof currentMonth === 'function' ? currentMonth() : monthKey(); }
  function monthName(key){ var parts=String(key||currentKey()).split('-'); var d=new Date(Number(parts[0]), Number(parts[1]||1)-1, 1); return d.toLocaleDateString(undefined,{month:'long',year:'numeric'}); }
  function monthShort(key){ var parts=String(key||currentKey()).split('-'); var d=new Date(Number(parts[0]), Number(parts[1]||1)-1, 1); return d.toLocaleDateString(undefined,{month:'short'}); }
  function addMonths(key, delta){ var parts=String(key||currentKey()).split('-'); var d=new Date(Number(parts[0]), Number(parts[1]||1)-1 + delta, 1); return monthKey(d); }
  function txMonth(key){ return typeof monthTransactions === 'function' ? monthTransactions(key) : (state.transactions||[]).filter(function(t){ return String(t.date||'').slice(0,7)===key && !t.hidden; }); }
  function spendForRows(rows){ return rows.reduce(function(sum,t){ var amount=n(t.amount); return sum + (amount<0 ? Math.abs(amount) : 0); },0); }
  function incomeForRows(rows){ return rows.reduce(function(sum,t){ var amount=n(t.amount); return sum + (amount>0 ? amount : 0); },0); }
  function catRows(){
    var rows=[];
    try{ rows = typeof byCategory === 'function' ? byCategory(txMonth(currentKey())) : []; }catch(e){ rows=[]; }
    if(!Array.isArray(rows)) rows=[];
    return rows.map(function(r){ return Array.isArray(r) ? {name:String(r[0]||'Other'), value:n(r[1])} : {name:String(r.category||'Other'), value:n(r.value||r.spent)}; }).filter(function(r){ return r.value>0; }).sort(function(a,b){ return b.value-a.value; });
  }
  function budgets(){
    try{ return typeof budgetStats === 'function' ? budgetStats(currentKey()) : []; }catch(e){ return []; }
  }
  function netWorth(){
    try{ return typeof netWorthBreakdown === 'function' ? netWorthBreakdown() : {assets:0, liabilities:0, netWorth:0}; }catch(e){ return {assets:0, liabilities:0, netWorth:0}; }
  }
  function accountValue(a){
    try{ return typeof accountSignedValue === 'function' ? accountSignedValue(a) : n(a.balance); }catch(e){ return n(a && a.balance); }
  }
  function visibleTx(){ return (state.transactions||[]).filter(function(t){ return !t.hidden; }); }
  function unreviewedTx(){ return visibleTx().filter(function(t){ return !t.reviewed; }); }
  function recentTx(limit){ return visibleTx().slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); }).slice(0,limit||5); }
  function recurring(limit){ try{ return typeof upcomingRecurringItems === 'function' ? upcomingRecurringItems(limit||5) : []; }catch(e){ return []; } }
  function goalPct(g){ var target=n(g.target); return target>0 ? Math.max(0,Math.min(100,Math.round(n(g.current)/target*100))) : 0; }
  function empty(title, body, label, action){ return '<div class="mm-d16-empty"><b>'+esc(title)+'</b><p>'+esc(body)+'</p>'+(label?'<button class="btn btn-small" onclick="'+action+'">'+esc(label)+'</button>':'')+'</div>'; }

  function accountTaxonomy(){ return window.MoneyMapAccountTaxonomy || null; }
  function groupForAccount(a){ var tax=accountTaxonomy(); return tax&&tax.groupForAccount ? tax.groupForAccount(a) : String((a&&a.type)||'Other'); }
  function groupLabel(id){ var tax=accountTaxonomy(); return tax&&tax.groupLabel ? tax.groupLabel(id) : String(id||'Other').replace(/-/g,' ').replace(/\b\w/g,function(c){ return c.toUpperCase(); }); }
  function accountGroups(limit){
    var tax=accountTaxonomy();
    var accounts=(state.accounts||[]).filter(function(a){ return a.includeNetWorth!==false; });
    var map={};
    accounts.forEach(function(a){
      var id=groupForAccount(a);
      var meta=tax&&tax.groupMeta ? tax.groupMeta(id) : {side:accountValue(a)<0?'liabilities':'assets'};
      map[id]=map[id]||{id:id,label:groupLabel(id),value:0,count:0,side:meta.side||'assets'};
      map[id].value+=accountValue(a); map[id].count++;
    });
    return Object.values(map).sort(function(a,b){ return Math.abs(b.value)-Math.abs(a.value); }).slice(0, limit||8);
  }
  function openAccountsWithFilter(id){ return "showView('accounts'); if(window.MoneyMapSetAccountFilter) setTimeout(function(){MoneyMapSetAccountFilter('"+js(id)+"')},0)"; }
  function buildHero(summary){
    var next = summary.next;
    var tone = summary.unreviewed ? 'warn' : (summary.netFlow >= 0 ? 'good' : 'bad');
    var snapDelta = summary.lastSnapshot && summary.prevSnapshot ? n(summary.lastSnapshot.netWorth)-n(summary.prevSnapshot.netWorth) : null;
    var changedLabel = snapDelta === null ? 'Save a snapshot' : (snapDelta>=0?'+':'−')+fmt(Math.abs(snapDelta));
    var changedNote = snapDelta === null ? 'No prior snapshot' : 'Since prior snapshot';
    var topCategory = summary.categories[0] ? summary.categories[0].name : 'No spend yet';
    var upcomingCount = recurring(10).length;
    var upcomingLabel = upcomingCount ? upcomingCount+' upcoming' : 'None detected';
    var trackLabel = summary.unreviewed ? summary.unreviewed+' to review' : (summary.overBudgets ? summary.overBudgets+' over budget' : (summary.tightBudgets ? summary.tightBudgets+' tight budget' : (summary.netFlow>=0 ? 'Positive flow' : 'Outflow month')));
    return `<section class="mm-d16-hero mm-d18-hero mm-d19-hero">
      <div class="mm-d16-panel mm-d17-command-panel mm-d18-command-panel mm-d19-command-panel"><div class="mm-d16-kicker">Money brief</div><h2 class="mm-d16-title">${esc(next.title)}</h2><p class="mm-d16-sub">${esc(next.body)}</p><div class="mm-d17-next-strip mm-d19-next-strip"><div><span>Next action</span><b class="${tone}">${esc(next.label)}</b></div><div><span>This month cash flow</span><b class="${summary.netFlow>=0?'good':'bad'}">${esc(fmt(summary.netFlow))}</b></div><div><span>Review queue</span><b class="${summary.unreviewed?'warn':'good'}">${esc(String(summary.unreviewed))}</b></div></div><div class="mm-d19-answer-grid"><button onclick="showView('accounts')"><span>What changed?</span><b class="${snapDelta===null?'':' '+(snapDelta>=0?'good':'bad')}">${esc(changedLabel)}</b><em>${esc(changedNote)}</em></button><button onclick="showView('transactions')"><span>Where is money going?</span><b>${esc(topCategory)}</b><em>${esc(summary.categories[0]?fmt(summary.categories[0].value):'Import transactions')}</em></button><button onclick="showView('budgets')"><span>Am I on track?</span><b class="${summary.overBudgets?'bad':summary.tightBudgets?'warn':'good'}">${esc(trackLabel)}</b><em>${esc(summary.budgetPressureLabel)}</em></button><button onclick="showView('recurring')"><span>Upcoming charges</span><b>${esc(upcomingLabel)}</b><em>Detected from local history</em></button></div><div class="mm-d16-local">Local browser data only. No sync, tracking, analytics, or external APIs.</div><div class="mm-d16-action-row"><button class="btn btn-primary" onclick="${next.action}">${esc(next.label)}</button><button class="btn" onclick="showView('accounts')">Accounts</button><button class="btn" onclick="showView('transactions')">Transactions</button><button class="btn" onclick="exportBackup()">Backup</button></div></div>
      <div class="mm-d16-card mm-d17-quick-card mm-d19-quick-card"><div class="mm-d16-card-head"><div><h3>Quick actions</h3><p>Common workflows without hunting through sections.</p></div><span class="mm-d16-pill">${esc(BUILD)}</span></div><div class="mm-d16-quick-grid mm-d19-quick-grid">${quick('Import CSV','Load bank export',"showView('import')")}${quick('Add transaction','Manual entry',"openDrawer('transaction')")}${quick('Review','Clean queue','startWeeklyReview()')}${quick('Add account','Balance tracker',"openDrawer('account')")}${quick('Save snapshot','Net worth history','saveNetWorthSnapshot()')}${quick('Export','Local backup','exportBackup()')}</div></div></section>`;
  }
  function quick(title,sub,action){ return '<button class="mm-d16-quick" onclick="'+action+'"><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></button>'; }

  function nextAction(summary){
    if(!(state.transactions||[]).length) return {title:'Start with your first data import.',body:'Import a CSV, use demo data, or add a transaction manually. The dashboard uses real local data and shows empty states until data exists.',label:'Import CSV',action:'showView(\'import\')'};
    if(summary.unreviewed>0) return {title:summary.unreviewed+' transaction'+(summary.unreviewed===1?' needs':'s need')+' review.',body:'Clear the queue first so budgets, category totals, reports, and cash flow are accurate.',label:'Start review',action:'startWeeklyReview()'};
    if(summary.overBudgets>0) return {title:summary.overBudgets+' budget'+(summary.overBudgets===1?' is':'s are')+' over limit.',body:'Review pressure by category, then adjust the budget or recategorize transactions.',label:'Open budgets',action:'showView(\'budgets\')'};
    if(!(state.accounts||[]).length) return {title:'Add accounts to complete the picture.',body:'Manual balances unlock net worth, account groups, and snapshot history without connecting a bank.',label:'Add account',action:'openDrawer(\'account\')'};
    return {title:'Your workspace is current.',body:'Review is clean. Check cash flow, budget pressure, upcoming recurring charges, and save a snapshot when balances change.',label:'Save snapshot',action:'saveNetWorthSnapshot()'};
  }

  function buildKpis(summary){
    var nw=summary.nw;
    var last=summary.lastSnapshot;
    var prev=summary.prevSnapshot;
    var snapDelta = last && prev ? n(last.netWorth)-n(prev.netWorth) : null;
    return '<section class="mm-d16-kpi-grid">'+
      kpi('Net worth',fmt(nw.netWorth),(snapDelta===null?'No prior snapshot':(snapDelta>=0?'+':'')+fmt(snapDelta)+' since prior'),'showView(\'accounts\')',nw.netWorth>=0?'good':'bad')+
      kpi('Cash flow',fmt(summary.netFlow),fmt(summary.income)+' income · '+fmt(summary.spend)+' spent','showView(\'transactions\')',summary.netFlow>=0?'good':'bad')+
      kpi('Review queue',String(summary.unreviewed),summary.unreviewed?'Needs cleanup':'Clean','startWeeklyReview()',summary.unreviewed?'warn':'good')+
      kpi('Budget pressure',summary.budgetPressureLabel,summary.budgetSub,'showView(\'budgets\')',summary.overBudgets?'bad':summary.tightBudgets?'warn':'good')+
    '</section>';
  }
  function kpi(label,value,note,action,cls){ return '<button class="mm-d16-card clickable" onclick="'+action+'"><span class="mm-d16-label">'+esc(label)+'</span><b class="mm-d16-value '+(cls||'')+'">'+esc(value)+'</b><span class="mm-d16-note">'+esc(note)+'</span></button>'; }

  function buildCashChart(){
    var months=[]; for(var i=5;i>=0;i--) months.push(addMonths(currentKey(),-i));
    var points=months.map(function(key){ var rows=txMonth(key); var spend=spendForRows(rows); var income=incomeForRows(rows); return {key:key,spend:spend,income:income,net:income-spend}; });
    var max=Math.max(1, ...points.map(function(p){ return Math.max(p.spend,p.income); }));
    var bars=points.map(function(p){ var ih=Math.max(4,Math.round(p.income/max*100)); var sh=Math.max(4,Math.round(p.spend/max*100)); return '<div class="mm-d16-month" title="'+esc(monthName(p.key))+'"><div class="mm-d16-month-bars"><i class="income" style="height:'+ih+'%"></i><i class="spend" style="height:'+sh+'%"></i></div><small>'+esc(monthShort(p.key))+'</small></div>'; }).join('');
    return '<section class="mm-d16-card mm-d16-chart-card"><div class="mm-d16-card-head"><div><h3>Cash flow trend</h3><p>Income and spending from visible transactions.</p></div><span class="mm-d16-pill">6 months</span></div><div class="mm-d16-cash-bars">'+bars+'</div><div class="mm-d16-legend"><span><i></i>Income</span><span><i class="spend"></i>Spending</span></div></section>';
  }

  function buildSpendingCard(summary){
    var rows=summary.categories.slice(0,8); var total=rows.reduce(function(s,r){ return s+r.value; },0) || 1; var max=Math.max(1,...rows.map(function(r){return r.value;}));
    var html=rows.length ? rows.map(function(r,i){
      var pct=Math.round(r.value/total*100); var width=Math.max(3,Math.round(r.value/max*100));
      return '<button class="mm-d16-spend-row" onclick="showCategoryTransactions(\''+js(r.name)+'\')"><span class="mm-d16-rank">'+(i+1)+'</span><span class="mm-d16-row-copy"><b>'+esc(r.name)+'</b><span>'+pct+'% of top category spend</span><span class="mm-d16-bar"><span style="width:'+width+'%"></span></span></span><strong class="mm-d16-row-value">'+esc(fmt(r.value))+'</strong></button>';
    }).join('') : empty('No spending categories yet','Import transactions to see where money is going.','Import CSV','showView(\'import\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Spending by category</h3><p>'+esc(monthName(currentKey()))+' · visible spending only.</p></div><button class="btn btn-small" onclick="showView(\'transactions\')">View all</button></div><div class="mm-d16-spend-list">'+html+'</div></section>';
  }

  function buildBudgetCard(summary){
    var rows=summary.budgets.slice().sort(function(a,b){ return b.pct-a.pct; }).slice(0,5);
    var html=rows.length ? rows.map(function(b){ var cls=b.pct>=100?'bad':b.pct>=80?'warn':'good'; var left=Math.max(0,n(b.remaining)); return '<button class="mm-d16-list-row" onclick="showCategoryTransactions(\''+js(b.category)+'\')"><span class="mm-d16-row-copy"><b>'+esc(b.category)+'</b><span>'+esc(fmt(left))+' left of '+esc(fmt(b.limit))+'</span><span class="mm-d16-bar"><span class="'+cls+'" style="width:'+Math.min(100,Math.max(3,b.pct))+'%"></span></span></span><strong class="mm-d16-row-value '+cls+'">'+esc(String(b.pct))+'%</strong></button>'; }).join('') : empty('No budgets yet','Add monthly category limits to track pressure and safe spending.','Add budget','openDrawer(\'budget\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Budget pressure</h3><p>Categories closest to limit.</p></div><button class="btn btn-small" onclick="showView(\'budgets\')">Manage</button></div><div class="mm-d16-list">'+html+'</div></section>';
  }

  function buildReviewCard(summary){
    var total=visibleTx().length; var done=total-summary.unreviewed; var pct=total?Math.round(done/total*100):0;
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Review queue</h3><p>Cleanup status before reports and budgets.</p></div><button class="btn btn-small '+(summary.unreviewed?'btn-primary':'')+'" onclick="startWeeklyReview()">Review</button></div><div class="mm-d16-review"><div class="mm-d16-ring" style="--p:'+pct+'"><span>'+pct+'%</span></div><div class="mm-d16-list"><div class="mm-d16-list-row" onclick="showUnreviewedTransactions()"><span class="mm-d16-row-copy"><b>'+summary.unreviewed+' open item'+(summary.unreviewed===1?'':'s')+'</b><span>'+done+' reviewed of '+total+' visible transactions</span></span><strong class="mm-d16-row-value '+(summary.unreviewed?'warn':'good')+'">'+(summary.unreviewed?'Action':'Clean')+'</strong></div></div></div></section>';
  }

  function buildAccountsCard(summary){
    var groups=accountGroups(8);
    var assetCount=groups.filter(function(g){ return g.side==='assets'; }).length;
    var debtCount=groups.filter(function(g){ return g.side==='liabilities'; }).length;
    var html=groups.length ? '<div class="mm-d17-account-groups mm-d18-account-groups">'+groups.map(function(g){ return '<button class="mm-d17-account-chip '+(g.side==='liabilities'?'debt':'asset')+'" onclick="'+openAccountsWithFilter(g.id)+'"><span>'+esc(g.label)+'<em>'+g.count+' acct'+(g.count===1?'':'s')+'</em></span><b class="'+(g.value<0?'bad':'good')+'">'+esc(fmt(g.value))+'</b></button>'; }).join('')+'</div>' : empty('No accounts yet','Add manual balances to make net worth and snapshots useful.','Add account',"openDrawer('account')");
    var nw=summary.nw;
    return `<section class="mm-d16-card mm-d17-accounts-card mm-d18-accounts-card"><div class="mm-d16-card-head"><div><h3>Accounts summary</h3><p>Cash, savings, property, vehicles, collectibles, jewelry, cards, and loans.</p></div><button class="btn btn-small" onclick="showView('accounts')">Open</button></div><div class="mm-d16-snapshot"><div><span>Assets</span><b class="good">${esc(fmt(nw.assets))}</b></div><div><span>Liabilities</span><b class="bad">${esc(fmt(nw.liabilities))}</b></div><div><span>Groups</span><b>${esc(String(assetCount+debtCount))}</b></div></div>${html}</section>`;
  }

  function buildRecentCard(){
    var rows=recentTx(5);
    var html=rows.length ? rows.map(function(t){ var amount=n(t.amount); return '<button class="mm-d16-list-row" onclick="editTransaction(\''+js(t.id)+'\')"><span class="mm-d16-row-copy"><b>'+esc(t.description||'Transaction')+'</b><span>'+esc(dateLabel(t.date))+' · '+esc(t.category||'Other')+' · '+esc(t.account||'Account')+'</span></span><strong class="mm-d16-row-value '+(amount<0?'bad':'good')+'">'+esc(fmt(amount))+'</strong></button>'; }).join('') : empty('No recent activity','Import or add transactions to fill this list.','Add transaction','openDrawer(\'transaction\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Recent activity</h3><p>Latest transactions.</p></div><button class="btn btn-small" onclick="openDrawer(\'transaction\')">Add</button></div><div class="mm-d16-list">'+html+'</div></section>';
  }

  function buildRecurringCard(){
    var rows=recurring(5);
    var html=rows.length ? rows.map(function(r){ return '<button class="mm-d16-list-row" onclick="showView(\'recurring\')"><span class="mm-d16-row-copy"><b>'+esc(r.merchant||'Recurring charge')+'</b><span>'+esc(r.nextDate?dateLabel(r.nextDate):'Next date unknown')+(r.daysUntil!==undefined?' · '+esc(r.daysUntil<=0?'due now':r.daysUntil+' days'):'')+'</span></span><strong class="mm-d16-row-value">'+esc(fmt(r.monthly||r.amount||0))+'</strong></button>'; }).join('') : empty('No recurring charges detected','Import more history, then rescan subscriptions.','Open subscriptions','showView(\'recurring\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Upcoming recurring</h3><p>Bills and subscriptions from local history.</p></div><button class="btn btn-small" onclick="showView(\'recurring\')">Open</button></div><div class="mm-d16-list">'+html+'</div></section>';
  }

  function buildGoalsCard(){
    var goals=(state.goals||[]).slice().sort(function(a,b){ return goalPct(b)-goalPct(a); }).slice(0,4);
    var html=goals.length ? goals.map(function(g){ var pct=goalPct(g); return '<button class="mm-d16-list-row" onclick="openDrawer(\'goal\', findById(\'goals\',\''+js(g.id)+'\'))"><span class="mm-d16-row-copy"><b>'+esc(g.name||'Goal')+'</b><span>'+esc(fmt(n(g.current)))+' of '+esc(fmt(n(g.target)))+'</span><span class="mm-d16-progress"><span style="width:'+pct+'%"></span></span></span><strong class="mm-d16-row-value">'+pct+'%</strong></button>'; }).join('') : empty('No goals yet','Track savings, payoff, or purchase targets.','Add goal','openDrawer(\'goal\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Goals progress</h3><p>Targets that need funding.</p></div><button class="btn btn-small" onclick="showView(\'goals\')">Open</button></div><div class="mm-d16-list">'+html+'</div></section>';
  }

  function buildDebtCard(){
    var debts=(state.debts||[]).filter(function(d){ return n(d.balance)>0; }).sort(function(a,b){ return n(b.apr)-n(a.apr); }).slice(0,4);
    var total=debts.reduce(function(s,d){ return s+n(d.balance); },0);
    var html=debts.length ? debts.map(function(d){ return '<button class="mm-d16-list-row" onclick="openDrawer(\'debt\', findById(\'debts\',\''+js(d.id)+'\'))"><span class="mm-d16-row-copy"><b>'+esc(d.name||'Debt')+'</b><span>'+esc(String(n(d.apr)))+'% APR · min '+esc(fmt(d.minPayment||0))+'</span></span><strong class="mm-d16-row-value bad">'+esc(fmt(d.balance))+'</strong></button>'; }).join('') : empty('No debt tracked','Add debts to see payoff pressure and priorities.','Add debt','openDrawer(\'debt\')');
    return '<section class="mm-d16-card"><div class="mm-d16-card-head"><div><h3>Debt snapshot</h3><p>'+esc(total?fmt(total)+' across tracked debt':'Optional payoff tracker')+'</p></div><button class="btn btn-small" onclick="showView(\'debt\')">Open</button></div><div class="mm-d16-list">'+html+'</div></section>';
  }

  function collectSummary(){
    var key=currentKey(); var rows=txMonth(key); var spend=spendForRows(rows); var income=incomeForRows(rows); var budgetRows=budgets();
    var over=budgetRows.filter(function(b){ return n(b.pct)>=100; }).length; var tight=budgetRows.filter(function(b){ return n(b.pct)>=80 && n(b.pct)<100; }).length;
    var snapshots=(state.netWorthHistory||[]).slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); });
    var summary={month:key,spend:spend,income:income,netFlow:income-spend,nw:netWorth(),unreviewed:unreviewedTx().length,budgets:budgetRows,categories:catRows(),overBudgets:over,tightBudgets:tight,lastSnapshot:snapshots[0]||null,prevSnapshot:snapshots[1]||null};
    summary.budgetPressureLabel=over?String(over)+' over':(tight?String(tight)+' tight':(budgetRows.length?'On track':'No budgets'));
    summary.budgetSub=budgetRows.length?(over?'Over limit categories need attention':(tight?'Close to limit':'Tracked budgets are under control')):'Add budgets to see safe spending';
    summary.next=nextAction(summary);
    return summary;
  }

  function cleanupLegacyHosts(){
    ['accountSnapshotLanding','mm-dash-v010-host','mm-dash-v012-host','mmDesktopDashboardV016','mmDesktopDashboardV017','mmDesktopDashboardV018'].forEach(function(id){ var el=document.getElementById(id); if(el) el.setAttribute('aria-hidden','true'); });
  }
  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var meta=document.querySelector('meta[name="moneymap-build"]'); if(meta) meta.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }
  function polishNavLabels(){
    try{
      document.querySelectorAll('.nav-btn,[data-view],.mobile-more-item').forEach(function(el){
        var id=el.getAttribute('data-view');
        if(id==='networth'){
          var strong=el.querySelector('strong'); if(strong) strong.textContent='History';
          var sub=el.querySelector('.nav-copy span,.mobile-more-copy span'); if(sub) sub.textContent='Snapshots';
        }
        if(id==='rules'){
          var ruleSub=el.querySelector('.nav-copy span,.mobile-more-copy span'); if(ruleSub) ruleSub.textContent='Auto cleanup';
        }
      });
    }catch(e){}
  }
  function renderDashboard(){
    if(!stateReady()) return;
    var view=document.getElementById('view-overview'); if(!view) return;
    cleanupLegacyHosts();
    var host=document.getElementById(hostId);
    if(!host){ host=document.createElement('div'); host.id=hostId; view.insertBefore(host, view.firstChild); } host.className='mm-d16-dashboard mm-d19-dashboard';
    var summary=collectSummary();
    host.innerHTML=buildHero(summary)+buildKpis(summary)+'<section class="mm-d16-main-grid"><div class="mm-d16-side-stack">'+buildCashChart()+buildSpendingCard(summary)+'</div><div class="mm-d16-side-stack">'+buildReviewCard(summary)+buildBudgetCard(summary)+buildAccountsCard(summary)+'</div></section><section class="mm-d16-bottom-grid">'+buildRecentCard()+buildRecurringCard()+buildGoalsCard()+buildDebtCard()+'</section>';
    markBuild(); polishNavLabels();
  }

  function wrap(name, after){
    var prior=window[name];
    if(typeof prior !== 'function' || prior.__mmD19Wrapped) return;
    window[name]=function(){ var out=prior.apply(this,arguments); requestAnimationFrame(after); return out; };
    window[name].__mmD19Wrapped=true;
  }
  function afterRender(){ renderDashboard(); polishNavLabels(); markBuild(); }
  if(window.MoneyMapRenderBus) window.MoneyMapRenderBus.register('desktop-v019', afterRender, 120);
  wrap('renderAll', afterRender);
  wrap('showView', afterRender);
  var priorBuildNav=window.buildNav; if(typeof priorBuildNav==='function' && !priorBuildNav.__mmD19Wrapped){ window.buildNav=function(){ var out=priorBuildNav.apply(this,arguments); polishNavLabels(); return out; }; window.buildNav.__mmD19Wrapped=true; }
  var priorMobile=window.buildMobileNav; if(typeof priorMobile==='function' && !priorMobile.__mmD19Wrapped){ window.buildMobileNav=function(){ var out=priorMobile.apply(this,arguments); polishNavLabels(); return out; }; window.buildMobileNav.__mmD19Wrapped=true; }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ requestAnimationFrame(afterRender); }); else requestAnimationFrame(afterRender);
  window.addEventListener('resize', function(){ requestAnimationFrame(function(){ try{ if(typeof renderNetWorthChart==='function') renderNetWorthChart(); }catch(e){} }); }, {passive:true});
  setTimeout(afterRender,120); setTimeout(afterRender,500); setTimeout(afterRender,1400);
})();
