/* MoneyMap v0.1.10 — Dashboard command center redesign. Replaces desktop-v0.1.9.js. */
(function(){
  'use strict';
  var BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || 'v0.1.10';
  var HOST_ID = 'mmDashboardV0110';

  /* ── helpers ── */
  function ready(){ try{ return typeof state!=='undefined' && state && Array.isArray(state.transactions); }catch(e){ return false; } }
  function esc(v){ return typeof escapeHtml==='function' ? escapeHtml(String(v??'')) : String(v??'').replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function js(v){ return typeof escapeJs==='function' ? escapeJs(v) : String(v??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function n(v){ return typeof nval==='function' ? nval(v) : (Number(v)||0); }
  function fmt(v){ return typeof money==='function' ? money(v) : '$'+Math.round(n(v)).toLocaleString(); }
  function dateLabel(v){ return typeof dateFmt==='function' ? dateFmt(v) : String(v||''); }
  function mkKey(date){ var d=date?new Date(date):new Date(); if(isNaN(d)) d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
  function curKey(){ return typeof currentMonth==='function' ? currentMonth() : mkKey(); }
  function addMo(key,delta){ var p=String(key||curKey()).split('-'); var d=new Date(Number(p[0]),Number(p[1]||1)-1+delta,1); return mkKey(d); }
  function moShort(key){ var p=String(key||curKey()).split('-'); return new Date(Number(p[0]),Number(p[1]||1)-1,1).toLocaleDateString(undefined,{month:'short'}); }
  function moFull(key){ var p=String(key||curKey()).split('-'); return new Date(Number(p[0]),Number(p[1]||1)-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'}); }
  function txMonth(key){ return typeof monthTransactions==='function' ? monthTransactions(key) : (state.transactions||[]).filter(function(t){ return String(t.date||'').slice(0,7)===key && !t.hidden; }); }
  function spend(rows){ return rows.reduce(function(s,t){ var a=n(t.amount); return s+(a<0?Math.abs(a):0); },0); }
  function income(rows){ return rows.reduce(function(s,t){ var a=n(t.amount); return s+(a>0?a:0); },0); }
  function cats(){ var rows=[]; try{ rows=typeof byCategory==='function' ? byCategory(txMonth(curKey())) : []; }catch(e){ rows=[]; } if(!Array.isArray(rows)) rows=[]; return rows.map(function(r){ return Array.isArray(r)?{name:String(r[0]||'Other'),value:n(r[1])}:{name:String(r.category||'Other'),value:n(r.value||r.spent)}; }).filter(function(r){ return r.value>0; }).sort(function(a,b){ return b.value-a.value; }); }
  function bgets(){ try{ return typeof budgetStats==='function' ? budgetStats(curKey()) : []; }catch(e){ return []; } }
  function nw(){ try{ return typeof netWorthBreakdown==='function' ? netWorthBreakdown() : {assets:0,liabilities:0,netWorth:0}; }catch(e){ return {assets:0,liabilities:0,netWorth:0}; } }
  function aval(a){ try{ return typeof accountSignedValue==='function' ? accountSignedValue(a) : n(a.balance); }catch(e){ return n(a&&a.balance); } }
  function visibles(){ return (state.transactions||[]).filter(function(t){ return !t.hidden; }); }
  function unreviewed(){ return visibles().filter(function(t){ return !t.reviewed; }); }
  function recent(lim){ return visibles().slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); }).slice(0,lim||5); }
  function recurring(lim){ try{ return typeof upcomingRecurringItems==='function' ? upcomingRecurringItems(lim||5) : []; }catch(e){ return []; } }
  function goalPct(g){ var t=n(g.target); return t>0?Math.max(0,Math.min(100,Math.round(n(g.current)/t*100))):0; }
  function empty(title,body,label,action){ return '<div class="mm-v110-empty"><b>'+esc(title)+'</b><p>'+esc(body)+'</p>'+(label?'<button class="btn btn-small" onclick="'+action+'">'+esc(label)+'</button>':'')+'</div>'; }
  function taxonomy(){ return window.MoneyMapAccountTaxonomy||null; }
  function groupFor(a){ var t=taxonomy(); return t&&t.groupForAccount ? t.groupForAccount(a) : String((a&&a.type)||'Other'); }
  function groupLabel(id){ var t=taxonomy(); return t&&t.groupLabel ? t.groupLabel(id) : String(id||'Other').replace(/-/g,' ').replace(/\b\w/g,function(c){ return c.toUpperCase(); }); }
  function snapDelta(){ var snaps=(state.netWorthHistory||[]).slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); }); return snaps.length>=2 ? n(snaps[0].netWorth)-n(snaps[1].netWorth) : null; }

  /* ── collect summary ── */
  function summary(){
    var key=curKey(), rows=txMonth(key);
    var sp=spend(rows), inc=income(rows);
    var bgs=bgets(), over=bgs.filter(function(b){ return n(b.pct)>=100; }).length;
    var tight=bgs.filter(function(b){ return n(b.pct)>=80&&n(b.pct)<100; }).length;
    var unreviewedCount=unreviewed().length;
    var snaps=(state.netWorthHistory||[]).slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')); });
    return {
      key:key, spend:sp, income:inc, net:inc-sp, nw:nw(),
      unreviewed:unreviewedCount, budgets:bgs, cats:cats(),
      over:over, tight:tight,
      last:snaps[0]||null, prev:snaps[1]||null,
      delta:snaps.length>=2 ? n(snaps[0].netWorth)-n(snaps[1].netWorth) : null,
      budPressure:over?(over+' over budget'):(tight?(tight+' near limit'):(bgs.length?'On track':'No budgets set')),
      budPressureCls:over?'mm-v110-bad':tight?'mm-v110-warn':'mm-v110-good'
    };
  }

  /* ── next action ── */
  function nextAction(s){
    if(!(state.transactions||[]).length) return {title:'Start with your first import.',body:'Load a bank CSV, use demo data, or add a transaction manually to see real insights here.',label:'Import CSV',action:"showView('import')"};
    if(s.unreviewed>0) return {title:s.unreviewed+' transaction'+(s.unreviewed===1?' needs':'s need')+' review.',body:'Review queue is the priority — it keeps budgets, categories, and cash flow accurate.',label:'Start review',action:'startWeeklyReview()'};
    if(s.over>0) return {title:s.over+' budget'+(s.over===1?' is':'s are')+' over limit.',body:'Review category spend, then adjust the budget or recategorize the transactions that pushed it over.',label:'Open budgets',action:"showView('budgets')"};
    if(!(state.accounts||[]).length) return {title:'Add accounts to complete your picture.',body:'Manual balances unlock net worth, account groupings, and snapshot history without connecting a bank.',label:'Add account',action:"openDrawer('account')"};
    return {title:'Your workspace is up to date.',body:'Clean queue. Check cash flow, budget pressure, upcoming charges, and save a snapshot when balances change.',label:'Save snapshot',action:'saveNetWorthSnapshot()'};
  }

  /* ── BAND ── */
  function buildBand(s){
    var nx=nextAction(s);
    var deltaTxt=s.delta===null?'Save a snapshot':(s.delta>=0?'+':'')+fmt(s.delta);
    var deltaCls=s.delta===null?'':s.delta>=0?'mm-v110-good':'mm-v110-bad';
    var topCat=s.cats[0]?s.cats[0].name:'No spend yet';
    var topCatVal=s.cats[0]?fmt(s.cats[0].value):'Import transactions';
    var recCount=recurring(10).length;
    return '<section class="mm-v110-band">'+
      '<div class="mm-v110-band-left">'+
        '<div class="mm-v110-kicker">Command center · '+esc(moFull(s.key))+'</div>'+
        '<h2 class="mm-v110-headline">'+esc(nx.title)+'</h2>'+
        '<p class="mm-v110-subline">'+esc(nx.body)+'</p>'+
        '<div class="mm-v110-answer-row">'+
          answerBtn('What changed?',deltaTxt,deltaCls,"showView('accounts')")+
          answerBtn('Where is money going?',topCat,'',topCat==='No spend yet'?"showView('import')":"showCategoryTransactions('"+js(topCat)+"')")+
          answerBtn('Am I on track?',s.budPressure,s.budPressureCls,"showView('budgets')")+
          answerBtn('Upcoming charges',recCount?recCount+' detected':'None yet','',"showView('recurring')")+
        '</div>'+
        '<div class="mm-v110-band-actions">'+
          '<button class="btn btn-primary" onclick="'+esc(nx.action)+'">'+esc(nx.label)+'</button>'+
          '<button class="btn" onclick="showView(\'accounts\')">Accounts</button>'+
          '<button class="btn" onclick="showView(\'transactions\')">Transactions</button>'+
          '<button class="btn" onclick="exportBackup()">Backup</button>'+
        '</div>'+
        '<div class="mm-v110-privacy-note">🔒 Local browser data only. No sync, tracking, or external APIs.</div>'+
      '</div>'+
      '<div class="mm-v110-band-kpis">'+
        bandKpi('Net worth',fmt(s.nw.netWorth),s.delta===null?'No prior snapshot':(s.delta>=0?'+':'')+fmt(s.delta)+' vs prior',s.nw.netWorth>=0?'mm-v110-good':'mm-v110-bad',"showView('accounts')")+
        bandKpi('Monthly cash flow',fmt(s.net),fmt(s.income)+' in · '+fmt(s.spend)+' out',s.net>=0?'mm-v110-good':'mm-v110-bad',"showView('transactions')")+
        bandKpi('Review queue',String(s.unreviewed),s.unreviewed?'Needs cleanup':'Clean — well done',s.unreviewed?'mm-v110-warn':'mm-v110-good','startWeeklyReview()')+
      '</div>'+
    '</section>';
  }
  function answerBtn(label,value,cls,action){
    return '<button class="mm-v110-answer-btn" onclick="'+esc(action)+'"><span class="mm-v110-ab-label">'+esc(label)+'</span><span class="mm-v110-ab-value '+esc(cls)+'">'+esc(value)+'</span></button>';
  }
  function bandKpi(label,value,note,cls,action){
    return '<button class="mm-v110-band-kpi" onclick="'+esc(action)+'"><div class="mm-v110-bk-label">'+esc(label)+'</div><b class="mm-v110-bk-value '+esc(cls)+'">'+esc(value)+'</b><span class="mm-v110-bk-note">'+esc(note)+'</span></button>';
  }

  /* ── QUICK ACTIONS ── */
  function buildQuickbar(){
    return '<div class="mm-v110-quickbar">'+
      qbtn('⇡','Import CSV','Bank CSV',   "showView('import')")+
      qbtn('+','Add','Manual entry',      "openDrawer('transaction')")+
      qbtn('✓','Review','Clean queue',   'startWeeklyReview()')+
      qbtn('▥','Accounts','Balances',    "openDrawer('account')")+
      qbtn('◆','Snapshot','Net worth',   'saveNetWorthSnapshot()')+
      qbtn('↧','Backup','Local export',  'exportBackup()')+
    '</div>';
  }
  function qbtn(icon,label,sub,action){
    return '<button class="mm-v110-quick" onclick="'+esc(action)+'"><div class="mm-v110-quick-icon">'+esc(icon)+'</div><b>'+esc(label)+'</b><span>'+esc(sub)+'</span></button>';
  }

  /* ── CASH FLOW CHART ── */
  function buildCashflow(){
    var months=[]; for(var i=5;i>=0;i--) months.push(addMo(curKey(),-i));
    var pts=months.map(function(k){ var r=txMonth(k); return {key:k,inc:income(r),sp:spend(r)}; });
    var max=Math.max(1,...pts.map(function(p){ return Math.max(p.inc,p.sp); }));
    var bars=pts.map(function(p){
      var ih=Math.max(3,Math.round(p.inc/max*100)), sh=Math.max(3,Math.round(p.sp/max*100));
      return '<div class="mm-v110-month" title="'+esc(moFull(p.key))+'">'+
        '<div class="mm-v110-month-bars"><i class="income" style="height:'+ih+'%"></i><i class="spend" style="height:'+sh+'%"></i></div>'+
        '<small>'+esc(moShort(p.key))+'</small>'+
      '</div>';
    }).join('');
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Cash flow</h3><p>Income and spending — last 6 months.</p></div><span class="pill">6 months</span></div>'+
      '<div class="mm-v110-cashflow-bars">'+bars+'</div>'+
      '<div class="mm-v110-legend"><span><i class="income"></i>Income</span><span><i class="spend"></i>Spending</span></div>'+
    '</section>';
  }

  /* ── SPENDING CATEGORIES ── */
  function buildSpending(s){
    var rows=s.cats.slice(0,8);
    var total=rows.reduce(function(a,r){ return a+r.value; },0)||1;
    var max=Math.max(1,...rows.map(function(r){ return r.value; }));
    var html=rows.length?rows.map(function(r,i){
      var pct=Math.round(r.value/total*100);
      var w=Math.max(4,Math.round(r.value/max*100));
      return '<button class="mm-v110-cat-row" onclick="showCategoryTransactions(\''+js(r.name)+'\')">'+
        '<span class="mm-v110-cat-rank">'+(i+1)+'</span>'+
        '<span class="mm-v110-cat-copy"><span class="mm-v110-cat-name">'+esc(r.name)+'</span><span class="mm-v110-cat-bar"><span style="width:'+w+'%"></span></span></span>'+
        '<strong class="mm-v110-cat-value">'+esc(fmt(r.value))+'</strong>'+
      '</button>';
    }).join('') : empty('No spending data','Import transactions to see category breakdown.','Import CSV',"showView('import')");
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Spending by category</h3><p>'+esc(moFull(s.key))+' · visible spending only.</p></div><button class="btn btn-small" onclick="showView(\'transactions\')">View all</button></div>'+
      '<div>'+html+'</div>'+
    '</section>';
  }

  /* ── BUDGET PRESSURE ── */
  function buildBudgets(s){
    var rows=s.budgets.slice().sort(function(a,b){ return b.pct-a.pct; }).slice(0,6);
    var html=rows.length?rows.map(function(b){
      var cls=b.pct>=100?'bad':b.pct>=80?'warn':'good';
      var left=Math.max(0,n(b.remaining));
      return '<button class="mm-v110-budget-row" onclick="showCategoryTransactions(\''+js(b.category)+'\')">'+
        '<span class="mm-v110-budget-copy"><span class="mm-v110-budget-name">'+esc(b.category)+'</span>'+
        '<span class="mm-v110-budget-info">'+esc(fmt(left))+' left · of '+esc(fmt(b.limit))+'</span>'+
        '<span class="mm-v110-budget-bar"><span class="'+cls+'" style="width:'+Math.min(100,Math.max(3,b.pct))+'%"></span></span></span>'+
        '<strong class="mm-v110-budget-pct '+cls+'">'+esc(String(b.pct))+'%</strong>'+
      '</button>';
    }).join('') : empty('No budgets yet','Add monthly category limits to track spending pressure.','Add budget',"openDrawer('budget')");
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Budget pressure</h3><p>Categories closest to their monthly limit.</p></div><button class="btn btn-small" onclick="showView(\'budgets\')">Manage</button></div>'+
      '<div>'+html+'</div>'+
    '</section>';
  }

  /* ── REVIEW QUEUE ── */
  function buildReview(s){
    var total=visibles().length, done=total-s.unreviewed;
    var pct=total?Math.round(done/total*100):0;
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Review status</h3><p>Cleanup progress before budgets and reports.</p></div>'+
      '<button class="btn btn-small'+(s.unreviewed?' btn-primary':'')+'" onclick="startWeeklyReview()">Review</button></div>'+
      '<div class="mm-v110-review-wrap">'+
        '<div class="mm-v110-ring" style="--p:'+pct+'"><span>'+pct+'%</span></div>'+
        '<div class="mm-v110-review-detail"><b>'+s.unreviewed+' open item'+(s.unreviewed===1?'':'s')+'</b><small>'+done+' reviewed of '+total+' visible transactions</small></div>'+
      '</div>'+
    '</section>';
  }

  /* ── ACCOUNTS SUMMARY ── */
  function buildAccounts(s){
    var accounts=(state.accounts||[]).filter(function(a){ return a.includeNetWorth!==false; });
    var map={};
    accounts.forEach(function(a){
      var id=groupFor(a);
      var tax=taxonomy(); var meta=tax&&tax.groupMeta?tax.groupMeta(id):{side:aval(a)<0?'liabilities':'assets'};
      map[id]=map[id]||{id:id,label:groupLabel(id),value:0,count:0,side:meta.side||'assets'};
      map[id].value+=aval(a); map[id].count++;
    });
    var groups=Object.values(map).sort(function(a,b){ return Math.abs(b.value)-Math.abs(a.value); }).slice(0,8);
    var nwb=s.nw;
    var chipsHtml=groups.length?'<div class="mm-v110-acct-chips">'+groups.map(function(g){
      return '<button class="mm-v110-acct-chip'+(g.side==='liabilities'?' debt':'')+'" onclick="showView(\'accounts\')">'+
        '<span>'+esc(g.label)+'<em>'+g.count+' acct'+(g.count===1?'':'s')+'</em></span>'+
        '<strong class="'+(g.value<0?'mm-v110-bad':'mm-v110-good')+'">'+esc(fmt(g.value))+'</strong>'+
      '</button>';
    }).join('')+'</div>' : empty('No accounts yet','Add balances to enable net worth, snapshots, and account groupings.','Add account',"openDrawer('account')");
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Account groups</h3><p>Cash, investments, property, cards, and loans.</p></div><button class="btn btn-small" onclick="showView(\'accounts\')">Open</button></div>'+
      '<div class="mm-v110-nw-strip">'+
        '<div class="mm-v110-nw-item"><span>Assets</span><b class="mm-v110-good">'+esc(fmt(nwb.assets))+'</b></div>'+
        '<div class="mm-v110-nw-item"><span>Liabilities</span><b class="mm-v110-bad">'+esc(fmt(nwb.liabilities))+'</b></div>'+
        '<div class="mm-v110-nw-item"><span>Groups</span><b>'+esc(String(groups.length))+'</b></div>'+
      '</div>'+
      chipsHtml+
    '</section>';
  }

  /* ── RECENT ACTIVITY ── */
  function buildRecent(){
    var rows=recent(5);
    var html=rows.length?rows.map(function(t){
      var a=n(t.amount);
      return '<button class="mm-v110-list-row" onclick="editTransaction(\''+js(t.id)+'\')">'+
        '<span class="mm-v110-list-copy"><b>'+esc(t.description||'Transaction')+'</b><small>'+esc(dateLabel(t.date))+' · '+esc(t.category||'Other')+'</small></span>'+
        '<strong class="mm-v110-list-value '+(a<0?'mm-v110-bad':'mm-v110-good')+'">'+esc(fmt(a))+'</strong>'+
      '</button>';
    }).join('') : empty('No recent activity','Import or add a transaction.','Add','openDrawer(\'transaction\')');
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Recent activity</h3><p>Latest transactions.</p></div><button class="btn btn-small" onclick="openDrawer(\'transaction\')">Add</button></div>'+
      '<div>'+html+'</div></section>';
  }

  /* ── UPCOMING RECURRING ── */
  function buildRecurring(){
    var rows=recurring(5);
    var html=rows.length?rows.map(function(r){
      return '<button class="mm-v110-list-row" onclick="showView(\'recurring\')">'+
        '<span class="mm-v110-list-copy"><b>'+esc(r.merchant||'Recurring charge')+'</b>'+
        '<small>'+(r.nextDate?dateLabel(r.nextDate):'Next date unknown')+(r.daysUntil!==undefined?' · '+(r.daysUntil<=0?'due now':r.daysUntil+' days'):'')+'</small></span>'+
        '<strong class="mm-v110-list-value">'+esc(fmt(r.monthly||r.amount||0))+'</strong>'+
      '</button>';
    }).join('') : empty('No recurring charges detected','Import more history, then rescan subscriptions.','Open','showView(\'recurring\')');
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Upcoming recurring</h3><p>Subscriptions and bills detected locally.</p></div><button class="btn btn-small" onclick="showView(\'recurring\')">Open</button></div>'+
      '<div>'+html+'</div></section>';
  }

  /* ── GOALS ── */
  function buildGoals(){
    var goals=(state.goals||[]).slice().sort(function(a,b){ return goalPct(b)-goalPct(a); }).slice(0,4);
    var html=goals.length?goals.map(function(g){
      var pct=goalPct(g);
      return '<button class="mm-v110-list-row" onclick="openDrawer(\'goal\', findById(\'goals\',\''+js(g.id)+'\'))">'+
        '<span class="mm-v110-list-copy"><b>'+esc(g.name||'Goal')+'</b>'+
        '<small>'+esc(fmt(n(g.current)))+' of '+esc(fmt(n(g.target)))+'</small>'+
        '<span class="mm-v110-progress"><span style="width:'+pct+'%"></span></span></span>'+
        '<strong class="mm-v110-list-value">'+pct+'%</strong>'+
      '</button>';
    }).join('') : empty('No goals yet','Track savings, payoff, or purchase targets.','Add goal',"openDrawer('goal')");
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Goals progress</h3><p>Savings and payoff targets.</p></div><button class="btn btn-small" onclick="showView(\'goals\')">Open</button></div>'+
      '<div>'+html+'</div></section>';
  }

  /* ── DEBT ── */
  function buildDebt(){
    var debts=(state.debts||[]).filter(function(d){ return n(d.balance)>0; }).sort(function(a,b){ return n(b.apr)-n(a.apr); }).slice(0,4);
    var total=debts.reduce(function(s,d){ return s+n(d.balance); },0);
    var html=debts.length?debts.map(function(d){
      return '<button class="mm-v110-list-row" onclick="openDrawer(\'debt\', findById(\'debts\',\''+js(d.id)+'\'))">'+
        '<span class="mm-v110-list-copy"><b>'+esc(d.name||'Debt')+'</b><small>'+esc(String(n(d.apr)))+'% APR · min '+esc(fmt(d.minPayment||0))+'</small></span>'+
        '<strong class="mm-v110-list-value mm-v110-bad">'+esc(fmt(d.balance))+'</strong>'+
      '</button>';
    }).join('') : empty('No debt tracked','Add debts to see payoff priorities.','Add debt',"openDrawer('debt')");
    return '<section class="mm-v110-card">'+
      '<div class="mm-v110-card-head"><div><h3>Debt snapshot</h3><p>'+esc(total?fmt(total)+' across tracked debt':'Optional payoff tracker')+'</p></div><button class="btn btn-small" onclick="showView(\'debt\')">Open</button></div>'+
      '<div>'+html+'</div></section>';
  }

  /* ── RENDER ── */
  function hideStale(){
    ['accountSnapshotLanding','mm-dash-v010-host','mm-dash-v012-host','mmDesktopDashboardV016','mmDesktopDashboardV017','mmDesktopDashboardV018','mmDesktopDashboardV019'].forEach(function(id){
      var el=document.getElementById(id); if(el) el.setAttribute('aria-hidden','true');
    });
  }
  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var m=document.querySelector('meta[name="moneymap-build"]'); if(m) m.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }
  function polishNav(){
    try{
      document.querySelectorAll('.nav-btn,[data-view]').forEach(function(el){
        var id=el.getAttribute('data-view');
        if(id==='networth'){ var s=el.querySelector('.nav-copy span'); if(s) s.textContent='Snapshots'; }
        if(id==='rules'){ var r=el.querySelector('.nav-copy span'); if(r) r.textContent='Auto cleanup'; }
      });
    }catch(e){}
  }
  function render(){
    if(!ready()) return;
    var view=document.getElementById('view-overview'); if(!view) return;
    hideStale();
    var host=document.getElementById(HOST_ID);
    if(!host){ host=document.createElement('div'); host.id=HOST_ID; view.insertBefore(host,view.firstChild); }
    host.className='mm-v110-dashboard';
    var s=summary();
    host.innerHTML=
      buildBand(s)+
      buildQuickbar()+
      '<div class="mm-v110-main-grid">'+
        '<div class="mm-v110-stack">'+buildCashflow()+buildSpending(s)+'</div>'+
        '<div class="mm-v110-stack">'+buildBudgets(s)+buildReview(s)+buildAccounts(s)+'</div>'+
      '</div>'+
      '<div class="mm-v110-bottom-grid">'+buildRecent()+buildRecurring()+buildGoals()+buildDebt()+'</div>';
    markBuild(); polishNav();
  }

  /* ── wiring ── */
  function wrap(name,after){
    var prior=window[name];
    if(typeof prior!=='function'||prior.__mmV110Wrapped) return;
    window[name]=function(){ var out=prior.apply(this,arguments); requestAnimationFrame(after); return out; };
    window[name].__mmV110Wrapped=true;
  }
  function afterRender(){ render(); polishNav(); markBuild(); }
  if(window.MoneyMapRenderBus) window.MoneyMapRenderBus.register('dashboard-v0110',afterRender,125);
  wrap('renderAll',afterRender);
  wrap('showView',afterRender);
  var priorBN=window.buildNav; if(typeof priorBN==='function'&&!priorBN.__mmV110Wrapped){ window.buildNav=function(){ var out=priorBN.apply(this,arguments); polishNav(); return out; }; window.buildNav.__mmV110Wrapped=true; }
  var priorMN=window.buildMobileNav; if(typeof priorMN==='function'&&!priorMN.__mmV110Wrapped){ window.buildMobileNav=function(){ var out=priorMN.apply(this,arguments); polishNav(); return out; }; window.buildMobileNav.__mmV110Wrapped=true; }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ requestAnimationFrame(afterRender); }); else requestAnimationFrame(afterRender);
  setTimeout(afterRender,130); setTimeout(afterRender,520); setTimeout(afterRender,1500);
})();
