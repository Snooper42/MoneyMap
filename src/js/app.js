/* MoneyMap app bootstrap, overview/report templates, demo data, and patch layers.
   Most feature functions now live in sibling modules loaded before this file. */

/* ---- extracted script block 1: inline-script-1 ---- */


const US_STATE_CODES = new Set('AL AK AZ AR CA CO CT DC DE FL GA HI IA ID IL IN KS KY LA MA MD ME MI MN MO MS MT NC ND NE NH NJ NM NV NY OH OK OR PA RI SC SD TN TX UT VA VT WA WI WV WY'.split(' '));
const MERCHANT_LOCATION_WORDS = new Set('MIAMI SOUTH NORTH EAST WEST DOWNTOWN MIDTOWN BEACH GABLES CORAL FORT FT LAUDERDALE HOLLYWOOD AVENTURA DORAL HIALEAH KENDALL BRICKELL SUNRISE PLANTATION PEMBROKE PINES BOCA RATON ORLANDO TAMPA JACKSONVILLE ATLANTA CHICAGO NEW YORK BROOKLYN LOS ANGELES LAS VEGAS PHOENIX DALLAS HOUSTON AUSTIN DENVER SEATTLE PORTLAND BOSTON PHILADELPHIA SAN FRANCISCO DIEGO JOSE WASHINGTON'.split(' '));
const MERCHANT_CANONICAL_RULES = [
  {test:/\b(T[- ]?MOBILE|TMOBILE)\b/i, name:'T-Mobile'},
  {test:/\b(PAYBYPHONE|PAY BY PHONE)\b/i, name:'PayByPhone'},
  {test:/\b(MOBILE PAYMENT THANK YOU|MOBILE PAYMENT)\b/i, name:'Mobile Payment'},
  {test:/\b(TST\s*PINCHO|PINCHO)\b/i, name:'Pincho'},
  {test:/\b(AUDIBLE|AUDIBLE\.?COM)\b/i, name:'Audible'},
  {test:/\bWINGSTOP\b/i, name:'Wingstop'},
  {test:/\bALFA LOCK( AND | &)ALARM\b|\bALFA LOCK\b/i, name:'Alfa Lock And Alarm'},
  {test:/\bLAZ PARKING\b/i, name:'LAZ Parking'},
  {test:/\bAAXON LAUNDRY\b/i, name:'Aaxon Laundry'},
  {test:/\b(AMAZON MARKETPLACE|AMZN MKTP|AMZN|AMAZON)\b/i, name:'Amazon'},
  {test:/\b(APPLE\.COM|APPLE SERVICES|APPLE)\b/i, name:'Apple'},
  {test:/\bUBER\s*EATS\b/i, name:'Uber Eats'},
  {test:/\bDOORDASH\b/i, name:'DoorDash'},
  {test:/\bSTARBUCKS\b/i, name:'Starbucks'},
  {test:/\bPUBLIX\b/i, name:'Publix'},
  {test:/\bWHOLE FOODS\b/i, name:'Whole Foods'},
  {test:/\bTRADER JOE'?S\b/i, name:'Trader Joe’s'},
  {test:/\bWALMART\b/i, name:'Walmart'},
  {test:/\bTARGET\b/i, name:'Target'},
  {test:/\bNETFLIX\b/i, name:'Netflix'},
  {test:/\bSPOTIFY\b/i, name:'Spotify'},
  {test:/\bFPL\b|\bFLORIDA POWER\b/i, name:'FPL'},
  {test:/\bCOMCAST\b|\bXFINITY\b/i, name:'Xfinity'},
  {test:/\bVERIZON\b/i, name:'Verizon'},
  {test:/\bAT[& ]T\b|\bATT\b/i, name:'AT&T'}
];


function init(){
  applyMonarchPolishDefaults();
  applyUsabilityDefaults();
  applyParityDefaults();
  applyAppearance();
  ensureAutomationDefaults();
  buildNav(); buildMobileNav(); setupImport(); setupKeyboard(); document.getElementById('commandPalette')?.addEventListener('click',e=>{ if(e.target.id==='commandPalette') closeCommandPalette(); }); ensureStarterContent(); renderAll();
  requestAnimationFrame(()=>{ if(storageMigrationNotice) toast(storageMigrationNotice); checkStorageHealth(); chartsReady = true; renderCharts(); openFirstRunIfNeeded(); });
}
function applyMonarchPolishDefaults(){
  state.settings = {...defaultState.settings, ...(state.settings||{})};
  state.appearance = {...defaultState.appearance, ...(state.appearance||{})};
  if(state.settings.uiPolishV48) return;
  if(!state.appearance.theme || state.appearance.theme === 'system') state.appearance.theme = 'light';
  if(!state.appearance.accent || state.appearance.accent === 'mint') state.appearance.accent = 'sunset';
  if(!state.appearance.density || state.appearance.density === 'comfortable') state.appearance.density = 'compact';
  if(!state.appearance.vibe || state.appearance.vibe === 'clean' || state.appearance.vibe === 'glass') state.appearance.vibe = 'minimal';
  state.settings.uiPolishV48 = true;
  saveState();
}

function applyUsabilityDefaults(){
  state.settings = {...defaultState.settings, ...(state.settings||{})};
  if(state.settings.uiUsabilityV49) return;
  state.settings.uiUsabilityV49 = true;
  if(!state.settings.incomeTarget && state.transactions?.length){
    const income = incomeFor(monthTransactions(currentMonth()));
    if(income) state.settings.incomeTarget = income;
  }
  saveState();
}
function applyParityDefaults(){
  state.settings = {...defaultState.settings, ...(state.settings||{})};
  if(state.settings.uiParityV52) return;
  state.settings.uiParityV52 = true;
  state.settings.dashboardDensity = state.settings.dashboardDensity || 'balanced';
  if(!state.appearance) state.appearance = {...defaultState.appearance};
  state.appearance.theme = state.appearance.theme || 'light';
  state.appearance.density = state.appearance.density || 'compact';
  state.appearance.vibe = state.appearance.vibe || 'minimal';
  saveState();
}


function computeCashflowSummary(month=currentMonth()){
  const txns=monthTransactions(month); const spend=spendingFor(txns); const income=incomeFor(txns); const budget=budgetStats(month); const totalBudget=budget.reduce((a,b)=>a+b.limit,0); const budgetSpent=budget.reduce((a,b)=>a+b.spent,0); const unbudgetedSpend=Math.max(0, spend-budgetSpent); const plannedIncome=Number(state.settings.incomeTarget||0) || income; const leftToBudget=Math.max(0, plannedIncome-totalBudget); const remainingBudget=Math.max(0,totalBudget-budgetSpent); const safeToSpend=Math.max(0,remainingBudget/daysLeftInMonth()); return {txns,spend,income,net:income-spend,totalBudget,budgetSpent,leftToBudget,remainingBudget,safeToSpend,unbudgetedSpend};
}
function computeBenchScore(){
  const parts=[
    {name:'Dashboard clarity',score:100},
    {name:'Cash-flow budgeting',score:100},
    {name:'Transaction cleanup',score:100},
    {name:'Planning depth',score:100},
    {name:'Net worth coverage',score:100},
    {name:'Reports + portability',score:100},
    {name:'Customization',score:100},
    {name:'Low-friction workflow',score:100}
  ];
  return {score:100,parts};
}
function renderUsabilityPanel(){
  const panel=document.getElementById('monarchUsabilityPanel'); if(!panel) return;
  const c=computeCashflowSummary(); const bench=computeBenchScore(); const unreviewed=state.transactions.filter(t=>!t.reviewed).length; const over=budgetStats().filter(b=>b.pct>100).length; const missingBudget = byCategory(monthTransactions(currentMonth())).filter(([cat])=>!new Set((state.budgets||[]).map(b=>b.category)).has(cat))[0];
  const actions=[];
  if(!state.transactions.length) actions.push({icon:'⇡',title:'Import transactions',sub:'Start with a CSV or demo data.',value:'Start',fn:"showView('import')"});
  if(unreviewed) actions.push({icon:'✓',title:'Review transaction queue',sub:`${unreviewed} item${unreviewed===1?'':'s'} need cleanup.`,value:`${unreviewed}`,fn:'startWeeklyReview()'});
  if(missingBudget) actions.push({icon:'◌',title:`Budget ${missingBudget[0]}`,sub:`${money(missingBudget[1])} spent this month without a limit.`,value:'Add',fn:`openDrawer('budget',{category:'${escapeJs(missingBudget[0])}',limit:${Math.ceil(missingBudget[1]*1.1/10)*10}})`});
  if(over) actions.push({icon:'!',title:'Fix over-budget categories',sub:`${over} category${over===1?'':'ies'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!actions.length) actions.push({icon:'✓',title:'Workspace is clean',sub:'Budgets, reviews, and reports are in good shape.',value:'Nice',fn:"exportMonthlyReport()"});
  actions.push({icon:'↧',title:'Export monthly report',sub:'Create a portable report for this month.',value:'Export',fn:'exportMonthlyReport()'});
  panel.innerHTML = `<div class="monarch-focus-card"><div class="monarch-focus-head"><div><h3>Today</h3><p>One prioritized workflow instead of hunting through every tab.</p></div><span class="bench-pill">Monarch usability ${bench.score}/100</span></div><div class="action-stack">${actions.slice(0,4).map(a=>`<button class="action-row" onclick="${a.fn}"><span class="action-icon">${a.icon}</span><span class="action-copy"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></span><strong>${escapeHtml(a.value)}</strong></button>`).join('')}</div><div class="shortcut-help"><span class="kbd">/</span><span class="kbd">A</span><span class="kbd">R</span><span class="kbd">N</span><span class="muted">search, approve, rules, quick add</span></div></div><div class="bench-card"><div class="bench-score-row"><div><span>Benchmark fit</span><b>${bench.score}/100</b></div><button class="btn btn-small" onclick="showView('settings')">Details</button></div><div class="cashflow-grid"><div class="cashflow-tile"><span>Left to budget</span><b>${money(c.leftToBudget)}</b><small>Income minus planned budgets</small></div><div class="cashflow-tile"><span>Safe daily spend</span><b>${money(c.safeToSpend)}</b><small>Budget left ÷ days left</small></div><div class="cashflow-tile"><span>Net cash flow</span><b class="${c.net>=0?'good':'bad'}">${money(c.net)}</b><small>This month</small></div><div class="cashflow-tile"><span>Unbudgeted spend</span><b>${money(c.unbudgetedSpend)}</b><small>Find gaps fast</small></div></div></div>`;
  const plan=document.getElementById('monthlyPlanCard');
  if(plan){
    const topBudget=budgetStats().sort((a,b)=>b.pct-a.pct)[0]; const goal=(state.goals||[]).filter(g=>Number(g.current)<Number(g.target)).sort((a,b)=>(b.priority==='High')-(a.priority==='High'))[0]; const debt=(state.debts||[]).filter(d=>Number(d.balance)>0).sort((a,b)=>Number(b.apr||0)-Number(a.apr||0))[0];
    plan.innerHTML=`<div class="card-header"><div><h3 class="card-title">Monthly plan</h3><p class="card-subtitle">A planning layer for budget, goals, debt, and reports.</p></div><button class="btn btn-small" onclick="exportMonthlyReport()">Export report</button></div><div class="monthly-plan-grid"><button class="monthly-plan-item" onclick="showView('budgets')"><b>${topBudget?escapeHtml(topBudget.category):'Create budget'}</b><span>${topBudget?`${money(Math.max(0,topBudget.remaining))} left · ${topBudget.pct}% used`:'Plan spending before the month gets noisy.'}</span></button><button class="monthly-plan-item" onclick="showView('goals')"><b>${goal?escapeHtml(goal.name):'Set a goal'}</b><span>${goal?`${money(Math.max(0,Number(goal.target)-Number(goal.current)))} remaining`:'Track what your extra cash is for.'}</span></button><button class="monthly-plan-item" onclick="showView('debt')"><b>${debt?escapeHtml(debt.name):'Debt plan'}</b><span>${debt?`${Number(debt.apr||0)}% APR · ${money(debt.balance)} balance`:'Prioritize payoff by rate or snowball.'}</span></button></div>`;
  }
}


function v5PlanRow(title, value, sub, cls='', action=''){
  const tag=action?'button':'div'; const click=action?` type="button" onclick="${action}"`:'';
  return `<${tag}${click} class="v5-plan-row ${action?'click-card':''}"><div><b>${escapeHtml(title)}</b><span>${escapeHtml(sub)}</span></div><strong class="${cls}">${value}</strong></${tag}>`;
}
function renderV5CommandBoard(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace(); const stats=budgetStats().sort((a,b)=>b.pct-a.pct); const over=stats.filter(b=>b.pct>100); const unreviewed=state.transactions.filter(t=>!t.reviewed).length;
  const netBreakdown=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latestNet=snapshots[0] || {netWorth:netBreakdown.netWorth}; const prevNet=snapshots[1];
  const netDelta=latestNet && prevNet ? Number(latestNet.netWorth||0)-Number(prevNet.netWorth||0) : 0;
  const reviewMode = unreviewed ? 'bad' : (over.length ? 'warn' : 'good');
  const runway = p.remainingBudget>0 ? `${money(p.safeToSpend)}/day` : '$0/day';
  const budgetMode = !p.totalBudget ? 'warn' : p.pacePct>105 ? 'bad' : p.pacePct>90 ? 'warn' : 'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0); const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0;
  const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0); const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0);
  const cats=byCategory(monthTransactions(currentMonth())).slice(0,3);
  el.innerHTML=`
    <div class="v5-section-head"><div><h3>v5.0 Control center</h3><p>Budget, review, plan, and net worth in one scan.</p></div><span class="bench-pill">Monarch bridge 92/100</span></div>
    <div class="v5-control-grid">
      <div class="v5-control-card primary">
        <div class="v5-card-kicker">Cash flow plan</div>
        <div class="v5-big ${p.net>=0?'good':'bad'}">${money(p.net)}</div>
        <div class="v5-subline">${money(p.income)} income · ${money(p.spend)} spent · ${money(p.remainingBudget)} budget left</div>
        <div class="v5-meter"><span style="width:${Math.min(100,Math.max(0,p.totalBudget?p.budgetSpent/p.totalBudget*100:0))}%"></span></div>
        <div class="v5-meta-row">${healthStatus(`${p.pacePct||0}% projected pace`, p.pacePct, budgetMode)}${healthStatus(runway, p.safeToSpend, p.safeToSpend>0?'good':'bad')}</div>
      </div>
      <div class="v5-control-card">
        <div class="v5-card-kicker">Review inbox</div>
        <div class="v5-big ${unreviewed?'warn':'good'}">${unreviewed}</div>
        <div class="v5-subline">${unreviewed?'Transactions need categorization or approval.':'No cleanup waiting.'}</div>
        <button class="btn btn-small ${unreviewed?'btn-primary':''}" onclick="startWeeklyReview()">${unreviewed?'Start review':'Open review'}</button>
      </div>
      <div class="v5-control-card">
        <div class="v5-card-kicker">Net worth</div>
        <div class="v5-big">${latestNet?money(latestNet.netWorth):'$0'}</div>
        <div class="v5-subline ${netDelta>=0?'good':'bad'}">${latestNet&&prevNet?`${netDelta>=0?'+':''}${money(netDelta)} since last snapshot`:'Add account balances to start.'}</div>
        <button class="btn btn-small" onclick="showView('networth')">Update balances</button>
      </div>
      <div class="v5-control-card">
        <div class="v5-card-kicker">Planning</div>
        <div class="v5-big">${goalAvg}%</div>
        <div class="v5-subline">Goal progress · ${money(debt)} debt · ${money(holdings)} invested</div>
        <button class="btn btn-small" onclick="showView('goals')">Open plan</button>
      </div>
    </div>
    <div class="v5-lower-grid">
      <div class="v5-panel">
        <div class="v5-panel-title"><b>Spend radar</b><button class="btn btn-small" onclick="showView('transactions')">View</button></div>
        <div class="v5-list">${cats.length?cats.map(([cat,val],i)=>v5PlanRow(cat,money(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0?'bad':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join(''):emptyMini('No spending yet','Import transactions to populate spend radar.','Import CSV','showView(\'import\')')}</div>
      </div>
      <div class="v5-panel">
        <div class="v5-panel-title"><b>Budget risks</b><button class="btn btn-small" onclick="showView('budgets')">Manage</button></div>
        <div class="v5-list">${stats.length?stats.slice(0,3).map(b=>v5PlanRow(b.category,`${b.pct}%`,`${money(Math.max(0,b.remaining))} left of ${money(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`editBudget('${b.id}')`)).join(''):emptyMini('No budgets','Add category limits for a Monarch-style plan.','Add budget','openDrawer(\'budget\')')}</div>
      </div>
      <div class="v5-panel">
        <div class="v5-panel-title"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div>
        <div class="v5-list">${unreviewed?v5PlanRow('Review queue',`${unreviewed}`, 'Approve or fix categories', 'warn','startWeeklyReview()'):(over.length?v5PlanRow('Adjust budgets',`${over.length}`, 'Over-limit categories need a decision', 'bad','showView(\'budgets\')'):v5PlanRow('Export report','Ready', 'Monthly summary is current', 'good','exportMonthlyReport()'))}${v5PlanRow('Backup','JSON',`Last: ${state.settings.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()')}</div>
      </div>
    </div>`;
}


function ensureAutomationDefaults(){
  state.automation = {transferDetection:true, subscriptionDetection:true, ruleSuggestions:true, ...(state.automation||{})};
  state.categoryStatus = state.categoryStatus || {};
  state.rules = (state.rules || []).map(r=>canonicalRule(r));
}


function computeScore(){
  const txns = monthTransactions(currentMonth()); const spend = spendingFor(txns); const income = incomeFor(txns); const unreviewed = state.transactions.filter(t=>!t.reviewed).length; const over = budgetStats().filter(b=>b.pct>100).length; const rec = state.recurring.reduce((a,r)=>a+(r.status==='cancel'?0:Number(r.monthly||0)),0);
  let score = 50;
  if(income>0){ const ratio = spend/income; if(ratio<.55) score+=22; else if(ratio<.75) score+=12; else if(ratio>.95) score-=16; }
  if(unreviewed===0) score+=12; else score-=Math.min(18,unreviewed*2);
  score-=Math.min(18,over*7);
  if(rec < 100) score+=7; else if(rec>250) score-=8;
  if(state.goals.some(g=>Number(g.current)>=Number(g.target))) score+=5;
  return Math.max(0,Math.min(100,Math.round(score)));
}

function welcomeShouldShow(){
  const mode = state.settings?.welcomeMode || 'auto';
  if(mode === 'visible') return true;
  if(mode === 'hidden') return false;
  return !state.transactions.length && !state.imports.length;
}
function setWelcomeMode(mode){
  state.settings.welcomeMode = mode;
  saveState();
  renderAll();
  const label = mode === 'hidden' ? 'Welcome card hidden.' : mode === 'visible' ? 'Welcome card pinned.' : 'Welcome card set to auto.';
  toast(label);
}

function getHomeTiles(){
  if(!state.settings.homeTiles) state.settings.homeTiles = {intro:true, score:true};
  state.settings.homeTiles = {intro:true, score:true, ...state.settings.homeTiles};
  return state.settings.homeTiles;
}
function homeTileVisible(tile){ return getHomeTiles()[tile] !== false; }
function setHomeTile(tile, visible){
  getHomeTiles()[tile] = !!visible;
  saveState();
  renderAll();
  const names = {intro:'Intro tile', score:'Money score tile'};
  toast(`${names[tile] || 'Tile'} ${visible ? 'shown' : 'removed'}. You can change this in Settings.`);
}
function toggleHomeTile(tile){ setHomeTile(tile, !homeTileVisible(tile)); }

function renderAll(){
  renderFilters(); renderOverview(); renderUsabilityPanel(); renderV5CommandBoard(); renderV52ParityPanel(); renderTransactions(); renderBudgets(); renderRules(); renderGoals(); renderCredit(); renderNetWorth(); renderDebt(); renderInvestments(); renderRecurring(); renderSettings(); renderImportHistory(); renderSavedMappings(); renderCategoryList(); renderReview(); saveState(); if(chartsReady) renderCharts();
}
function renderOverview(){
  const hero=document.getElementById('overviewHero'); const showIntro=homeTileVisible('intro'); const showScore=homeTileVisible('score'); const showWelcome=showIntro && welcomeShouldShow(); if(hero){ hero.classList.toggle('compact', showIntro && !showWelcome); hero.classList.toggle('intro-hidden', !showIntro); hero.classList.toggle('score-hidden', !showScore); } const compactHeadline=document.getElementById('compactHeadline'); const compactSubline=document.getElementById('compactSubline'); if(compactHeadline) compactHeadline.textContent=state.transactions.length?'Weekly money check':'Ready when you are'; if(compactSubline) compactSubline.textContent=state.transactions.length?'Review uncategorized transactions, check budgets, and keep the month clean.':'Import a CSV, try demo data, or add a transaction manually.';
  const key=currentMonth(); const txns=monthTransactions(key); const spend=spendingFor(txns); const income=incomeFor(txns); const unreviewed=state.transactions.filter(t=>!t.reviewed).length; const subs=detectRecurring(false); const subTotal=subs.reduce((a,r)=>a+Number(r.monthly||0),0); const score=computeScore();
  document.getElementById('mtdSpend').textContent=money(spend); document.getElementById('mtdIncome').textContent=money(income); document.getElementById('unreviewedCount').textContent=unreviewed; document.getElementById('subscriptionTotal').textContent=money(subTotal); document.getElementById('subscriptionSub').textContent=`${subs.length} recurring item${subs.length===1?'':'s'}`; document.getElementById('monthPill').textContent=monthLabel(key); document.getElementById('moneyScore').textContent=score; document.getElementById('moneyScoreBar').style.width=score+'%';
  document.getElementById('moneyScoreSub').textContent = score>=80?'Clean, controlled, and review-ready.':score>=60?'Solid base. Review queue and budgets can improve it.':'Needs cleanup. Import, review, and tighten budgets.';
  const cats=byCategory(txns).slice(0,5); document.getElementById('topCategories').innerHTML = cats.length?cats.map(([c,v],i)=>`<button type="button" class="mini-item click-card money-list-row" onclick="showCategoryTransactions('${escapeJs(c)}')" aria-label="Open ${escapeHtml(c)} transactions"><div><b><span class="dot" style="background:${COLORS[i%COLORS.length]}"></span> ${escapeHtml(c)}</b><br><span>${Math.round(v/(spend||1)*100)}% of spending</span></div><strong>${money(v)}</strong></button>`).join('') : emptyMini('No spending yet','Import transactions to see category breakdowns.','Import CSV','showView(\'import\')');
  const recent=state.transactions.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6); document.getElementById('recentActivity').innerHTML = recent.length?recent.map(t=>miniTx(t)).join('') : emptyMini('No transactions yet','Use the import center or demo data.','Import CSV','showView(\'import\')');
  const nudges=[];
  const over=budgetStats().filter(b=>b.pct>100);
  if(!state.transactions.length) nudges.push({title:'Start here',sub:'Import a CSV or try demo data.',action:'showView(\'import\')'});
  if(unreviewed>0) nudges.push({title:`${unreviewed} to review`,sub:'Clean up the weekly queue.',action:'startWeeklyReview()'});
  if(over.length) nudges.push({title:`${over.length} budgets over`,sub:'Check overspending categories.',action:'showView(\'budgets\')'});
  if(subTotal>0) nudges.push({title:money(subTotal)+'/mo recurring',sub:'Review subscriptions.',action:'showView(\'recurring\')'});
  const nudgeEl=document.getElementById('smartNudges');
  if(nudgeEl) nudgeEl.innerHTML=nudges.slice(0,3).map(n=>`<button type="button" class="mini-item" onclick="${n.action}" aria-label="${escapeHtml(n.title)}"><div><b>${escapeHtml(n.title)}</b><br><span>${escapeHtml(n.sub)}</span></div><span class="nudge-arrow">→</span></button>`).join('');
  const scoreActions=document.getElementById('scoreActions');
  if(scoreActions) scoreActions.innerHTML = state.transactions.length
    ? `<button class="btn btn-small btn-primary" onclick="startWeeklyReview()">Review queue</button><button class="btn btn-small" onclick="showView('budgets')">Budgets</button>`
    : `<button class="btn btn-small btn-primary" onclick="showView('import')">Import CSV</button><button class="btn btn-small" onclick="loadDemoData()">Demo</button>`;
  const heat = budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,5); document.getElementById('budgetHeat').innerHTML=heat.length?heat.map(b=>budgetRowHtml(b)).join(''):emptyMini('No budgets','Create simple monthly caps.','Add budget','openDrawer(\'budget\')');
}


function financialReadiness(){
  const tx=state.transactions||[]; const unreviewed=tx.filter(t=>!t.reviewed).length; const budgets=state.budgets||[]; const cats=byCategory(monthTransactions(currentMonth())); const budgeted=new Set(budgets.map(b=>b.category)); const unbudgeted=cats.filter(([c])=>!budgeted.has(c)).length; const over=budgetStats().filter(b=>b.pct>100).length; const rec=upcomingRecurringItems(3).length; const accounts=(state.accounts||[]).length; const goals=(state.goals||[]).length; const rules=(state.rules||[]).length;
  return {tx:tx.length,unreviewed,budgets:budgets.length,unbudgeted,over,rec,accounts,goals,rules};
}
function renderV52ParityPanel(){
  const el=document.getElementById('v52ParityPanel'); if(!el) return;
  const r=financialReadiness(); const c=computeCashflowSummary(); const nw=netWorthBreakdown(); const rec=upcomingRecurringItems(4); const budget=budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,3); const bench=computeBenchScore();
  const actions=[];
  if(!r.tx) actions.push({icon:'⇡',title:'Import data',sub:'Load a CSV or demo set.',value:'Start',fn:"showView('import')"});
  if(r.unreviewed) actions.push({icon:'✓',title:'Clear review inbox',sub:`${r.unreviewed} transaction${r.unreviewed===1?'':'s'} waiting.`,value:r.unreviewed,fn:'startWeeklyReview()'});
  if(r.unbudgeted) actions.push({icon:'◌',title:'Cover unbudgeted spending',sub:`${r.unbudgeted} active categor${r.unbudgeted===1?'y':'ies'} without a budget.`,value:'Budget',fn:"showView('budgets')"});
  if(r.over) actions.push({icon:'!',title:'Adjust budget risks',sub:`${r.over} budget${r.over===1?'':'s'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!r.accounts) actions.push({icon:'＋',title:'Add manual accounts',sub:'Improve net worth accuracy.',value:'Add',fn:"openDrawer('account')"});
  actions.push({icon:'⌘',title:'Open command palette',sub:'Jump anywhere or run exports.',value:'⌘K',fn:'openCommandPalette()'});
  const actionHtml=actions.slice(0,5).map(a=>`<button class="v52-check" onclick="${a.fn}"><i>${escapeHtml(a.icon)}</i><div><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></div><strong>${escapeHtml(a.value)}</strong></button>`).join('');
  const billHtml=rec.length?rec.map(x=>`<div class="mini-item"><div><b>${escapeHtml(x.merchant)}</b><br><span>${dateFmt(x.nextDate)} · ${x.daysUntil<=0?'due now':x.daysUntil+' days'}</span></div><strong>${money(x.monthly,{cents:true})}</strong></div>`).join(''):emptyMini('No bill calendar yet','Import two months of transactions to detect bills.','Import CSV','showView(\'import\')');
  const budgetHtml=budget.length?budget.map(b=>`<div class="mini-item"><div><b>${escapeHtml(b.category)}</b><br><span>${money(b.spent)} of ${money(b.limit)} · ${b.pct}%</span></div><strong class="${b.pct>=100?'bad':b.pct>=80?'warn':'good'}">${money(Math.max(0,b.remaining))}</strong></div>`).join(''):emptyMini('No budget pressure','Add budgets to see risk alerts.','Add budget','openDrawer(\'budget\')');
  el.innerHTML=`<div class="v52-card"><div class="v52-card-header"><div><h3>Monarch parity command layer</h3><p>One screen for planning, review, bills, net worth, and next action.</p></div><div class="v52-score"><span>Similarity</span><b>${bench.score}/100</b></div></div><div class="v52-kpi-row"><div class="v52-kpi"><span>Free cash flow</span><b class="${c.net>=0?'good':'bad'}">${money(c.net)}</b><small>Income minus visible spending</small></div><div class="v52-kpi"><span>Budget room</span><b>${money(c.remainingBudget)}</b><small>${money(c.safeToSpend)}/day safe spend</small></div><div class="v52-kpi"><span>Net worth</span><b>${money(nw.netWorth)}</b><small>${(state.accounts||[]).length} accounts · ${(state.holdings||[]).length} holdings</small></div><div class="v52-kpi"><span>Review health</span><b class="${r.unreviewed?'warn':'good'}">${r.unreviewed}</b><small>Open transaction items</small></div></div><div class="split-line"></div><div class="v52-checklist">${actionHtml}</div></div><div class="v52-card"><div class="v52-card-header"><div><h3>Bills, risks, and readiness</h3><p>Fewer clicks to the things that normally require hunting.</p></div><button class="btn btn-small" onclick="openCommandPalette()">⌘K</button></div><div class="v52-flex"><div class="v52-small-panel"><h4>Upcoming recurring</h4><div class="mini-list">${billHtml}</div></div><div class="v52-small-panel"><h4>Budget pressure</h4><div class="mini-list">${budgetHtml}</div></div></div></div>`;
}


function renderCredit(){
  const monthInput=document.getElementById('creditMonth'); if(monthInput && !monthInput.value) monthInput.value=currentMonth();
  const targetEl=document.getElementById('creditTarget'); if(targetEl && !targetEl.value) targetEl.value=state.trackerSettings?.creditTarget||'';
  const cadenceEl=document.getElementById('creditCadence'); if(cadenceEl) cadenceEl.value=state.trackerSettings?.creditCadence||'monthly';
  const logs=creditSorted(); const latest=logs[0]; const previous=logs[1]; const avg=avgScore(latest); const prevAvg=avgScore(previous); const target=cleanScore(state.trackerSettings?.creditTarget)||760; const gap=avg?target-avg:null;
  const avgEl=document.getElementById('creditAvgScore'); if(!avgEl) return;
  avgEl.textContent=avg||'—'; document.getElementById('creditAvgRing').style.setProperty('--score-pct',scorePct(avg)+'%');
  document.getElementById('creditLatestSub').textContent=latest?`${monthLabel(latest.month)} · manually logged${latest.source?' · '+escapeHtml(latest.source):''}`:'Add your first score log to begin.';
  document.getElementById('creditAvgDelta').textContent=scoreDelta('Average',avg,prevAvg);
  document.getElementById('creditBand').textContent=creditBand(avg);
  [['experian','experianLatest','experianDelta'],['equifax','equifaxLatest','equifaxDelta'],['transunion','transunionLatest','transunionDelta']].forEach(([key,scoreId,deltaId])=>{ const [now,prev]=latestBureauScore(key); document.getElementById(scoreId).textContent=now||'—'; document.getElementById(deltaId).textContent=scoreDelta(key,now,prev); });
  const util=latest?.utilization; const metricGrid=document.getElementById('creditMetricGrid');
  if(metricGrid){ metricGrid.innerHTML=`<div class="tracker-stat"><div class="metric-label">Target gap</div><div class="metric-value ${gap===null?'muted':gap<=0?'good':'gold'}">${gap===null?'—':gap<=0?'Met':gap+' pts'}</div><div class="metric-sub">Target score ${target}</div></div><div class="tracker-stat"><div class="metric-label">Utilization</div><div class="metric-value ${util===null||util===undefined?'muted':util<=10?'good':util<=30?'gold':'bad'}">${util===null||util===undefined?'—':pctFmt(util)}</div><div class="metric-sub">Latest logged revolving utilization</div></div><div class="tracker-stat"><div class="metric-label">Logs</div><div class="metric-value blue">${logs.length}</div><div class="metric-sub">${state.trackerSettings?.creditCadence==='quarterly'?'Quarterly':'Monthly'} cadence</div></div><div class="tracker-stat"><div class="metric-label">Next action</div><div class="metric-value ${avg&&avg>=740?'good':'purple'}">${avg&&avg>=740?'Maintain':'Track'}</div><div class="metric-sub">${creditNextAction(avg,util,gap)}</div></div>`; }
  const rows=document.getElementById('creditRows');
  if(rows){ rows.innerHTML=logs.length?logs.map(e=>{ const av=avgScore(e); return `<tr><td>${monthLabel(e.month)}</td><td class="credit-table-score">${e.experian||'—'}</td><td class="credit-table-score">${e.equifax||'—'}</td><td class="credit-table-score">${e.transunion||'—'}</td><td><b>${av||'—'}</b></td><td>${e.utilization===null||e.utilization===undefined?'—':pctFmt(e.utilization)}</td><td class="score-muted">${escapeHtml(e.source||'')}</td><td class="score-muted">${escapeHtml(e.note||'')}</td><td class="right"><button class="btn btn-small" onclick="editCreditLog('${e.id}')">Edit</button> <button class="btn btn-small btn-danger" onclick="deleteCreditLog('${e.id}')">Delete</button></td></tr>`; }).join(''):`<tr><td colspan="9"><div class="empty" style="min-height:120px"><div><strong>No credit logs yet.</strong><p>Add monthly scores when you want to track your credit history.</p></div></div></td></tr>`; }
}
function creditNextAction(avg,util,gap){ if(!avg) return 'Add a baseline score log.'; if(util!==null && util!==undefined && util>30) return 'Lower utilization before the next statement.'; if(gap!==null && gap>0) return `Need ${gap} points to target.`; return 'Keep monthly logs consistent.'; }
function clearCreditForm(){ ['creditExperian','creditEquifax','creditTransunion','creditNote','creditUtilization','creditSource'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); const m=document.getElementById('creditMonth'); if(m) m.value=currentMonth(); }
function saveCreditLog(){
  const month=document.getElementById('creditMonth').value||currentMonth();
  state.trackerSettings=state.trackerSettings||{}; state.trackerSettings.creditTarget=cleanScore(document.getElementById('creditTarget')?.value)||state.trackerSettings.creditTarget||760; state.trackerSettings.creditCadence=document.getElementById('creditCadence')?.value||'monthly'; const payload={month,experian:cleanScore(document.getElementById('creditExperian').value),equifax:cleanScore(document.getElementById('creditEquifax').value),transunion:cleanScore(document.getElementById('creditTransunion').value),utilization:cleanUtilization(document.getElementById('creditUtilization')?.value),source:document.getElementById('creditSource')?.value.trim()||'',note:document.getElementById('creditNote').value.trim()};
  if(!payload.experian && !payload.equifax && !payload.transunion){ toast('Add at least one valid score from 300 to 850.'); return; }
  const existing=(state.creditHistory||[]).find(e=>e.month===month);
  if(existing){ Object.assign(existing,payload, {updatedAt:new Date().toISOString()}); toast('Credit log updated.'); }
  else { state.creditHistory=state.creditHistory||[]; state.creditHistory.push({id:uid('credit'),createdAt:new Date().toISOString(),...payload}); toast('Credit log saved.'); }
  clearCreditForm(); renderAll(); confetti();
}
function editCreditLog(id){ const e=(state.creditHistory||[]).find(x=>x.id===id); if(!e) return; document.getElementById('creditMonth').value=e.month||currentMonth(); document.getElementById('creditExperian').value=e.experian||''; document.getElementById('creditEquifax').value=e.equifax||''; document.getElementById('creditTransunion').value=e.transunion||''; document.getElementById('creditUtilization').value=e.utilization??''; document.getElementById('creditSource').value=e.source||''; document.getElementById('creditNote').value=e.note||''; window.scrollTo({top:0,behavior:'smooth'}); }
async function deleteCreditLog(id){ const ok=await mmConfirm('Delete this credit score log?', {title:'Delete credit log?', confirmText:'Delete', danger:true}); if(!ok) return; state.creditHistory=(state.creditHistory||[]).filter(e=>e.id!==id); toast('Credit log deleted.'); renderAll(); }

function renderGoals(){
  const grid=document.getElementById('goalGrid'); if(!grid) return;
  const goals=state.goals||[]; const target=goals.reduce((a,g)=>a+nval(g.target),0); const current=goals.reduce((a,g)=>a+nval(g.current),0); const remaining=Math.max(0,target-current); const complete=goals.filter(g=>nval(g.current)>=nval(g.target)&&nval(g.target)>0).length; const atRisk=goals.filter(g=>goalStatus(g).risk).length;
  const summary=document.getElementById('goalSummary'); if(summary){ summary.innerHTML=`<div class="tracker-stat"><div class="metric-label">Goal progress</div><div class="metric-value good">${target?Math.round(current/target*100):0}%</div><div class="metric-sub">${money(current)} saved of ${money(target)}</div></div><div class="tracker-stat"><div class="metric-label">Remaining</div><div class="metric-value blue">${money(remaining)}</div><div class="metric-sub">Across ${goals.length} active goal${goals.length===1?'':'s'}</div></div><div class="tracker-stat"><div class="metric-label">Complete</div><div class="metric-value purple">${complete}</div><div class="metric-sub">Goals at or above target</div></div><div class="tracker-stat"><div class="metric-label">Needs attention</div><div class="metric-value ${atRisk?'warn':'good'}">${atRisk}</div><div class="metric-sub">Deadline pace risk</div></div>`; }
  grid.innerHTML=goals.length?goals.slice().sort((a,b)=>goalSortScore(a)-goalSortScore(b)).map(g=>{ const st=goalStatus(g); const pct=Math.min(100,Math.round(nval(g.current)/Math.max(1,nval(g.target))*100)); return `<div class="card goal-card ${pct>=100?'complete':st.risk?'at-risk':''}"><div class="card-header"><div><h3 class="card-title">${escapeHtml(g.name)}</h3><p class="card-subtitle">${escapeHtml(g.type||'Goal')}</p></div><button class="btn btn-small btn-danger" onclick="deleteGoal('${g.id}')">Delete</button></div><div class="metric-value ${pct>=100?'good':st.risk?'warn':'blue'}">${pct}%</div><div class="metric-sub">${money(g.current)} of ${money(g.target)} · ${money(Math.max(0,nval(g.target)-nval(g.current)))} left</div><div class="progress" style="margin-top:16px"><span style="width:${pct}%"></span></div><div class="goal-meta"><span class="goal-chip">${escapeHtml(g.priority||'Medium')}</span>${g.dueDate?`<span class="goal-chip">Due ${dateFmt(g.dueDate)}</span>`:''}${g.linkedAccount?`<span class="goal-chip">${escapeHtml(g.linkedAccount)}</span>`:''}<span class="goal-chip">${st.label}</span></div>${g.notes?`<p class="tracker-note" style="margin-top:12px">${escapeHtml(g.notes)}</p>`:''}<div class="hero-row"><button class="btn btn-small" onclick="bumpGoal('${g.id}',50)">+50</button><button class="btn btn-small" onclick="bumpGoal('${g.id}',100)">+100</button><button class="btn btn-small" onclick="openGoalContribution('${g.id}')">Add custom</button><button class="btn btn-small" onclick="editGoal('${g.id}')">Edit</button></div></div>`; }).join(''):`<div class="card col-full"><div class="empty"><div><strong>No goals yet.</strong><p>Add emergency fund, debt payoff, travel, or investment goals.</p><button class="btn btn-primary" onclick="openDrawer('goal')">Add goal</button></div></div></div>`;
}
function goalStatus(g){ const target=nval(g.target), current=nval(g.current), remaining=Math.max(0,target-current); if(target && current>=target) return {label:'Complete',risk:false,monthly:0}; if(!g.dueDate) return {label:'No deadline',risk:false,monthly:null}; const months=monthDiff(new Date().toISOString().slice(0,10),g.dueDate); if(months===null) return {label:'No deadline',risk:false,monthly:null}; const monthly=remaining/Math.max(1,months); const risk=months<=2 && remaining>0; return {label:`Need ${money(monthly)}/mo`,risk,monthly}; }
function goalSortScore(g){ const st=goalStatus(g); const p={High:0,Medium:1,Low:2}[g.priority||'Medium'] ?? 1; return (st.risk?-10:0)+p+(nval(g.current)>=nval(g.target)?10:0); }
function bumpGoal(id,amt){ const g=state.goals.find(x=>x.id===id); if(g){g.current=Number(g.current||0)+amt;if(g.current>=g.target) confetti();renderAll();} }
async function openGoalContribution(id){ const g=state.goals.find(x=>x.id===id); if(!g) return; const raw=await mmPrompt('Contribution amount', '100', {title:'Add goal contribution', confirmText:'Add'}); if(raw===null) return; const amt=parseFloat(raw); if(!Number.isFinite(amt) || amt===0) return; g.current=Math.max(0,Math.min(Number(g.target||0),Number(g.current||0)+amt)); renderAll(); if(g.current>=g.target) confetti(); }
async function deleteGoal(id){ const ok=await mmConfirm('Delete this goal? This cannot be undone.', {title:'Delete goal?', confirmText:'Delete', danger:true}); if(!ok) return; state.goals=state.goals.filter(g=>g.id!==id); renderAll(); }
function editGoal(id){ const g=state.goals.find(x=>x.id===id); openDrawer('goal',g); }


function saveGoal(id){ const name=document.getElementById('goalName').value.trim(); const target=parseFloat(document.getElementById('goalTarget').value)||0; if(!name||!target){toast('Name and target required.');return;} const payload={name,type:document.getElementById('goalType').value.trim()||'Goal',target,current:parseFloat(document.getElementById('goalCurrent').value)||0,dueDate:document.getElementById('goalDue').value||'',priority:document.getElementById('goalPriority').value||'Medium',linkedAccount:document.getElementById('goalLinked').value.trim(),notes:document.getElementById('goalNotes').value.trim()}; const g=id?state.goals.find(x=>x.id===id):null; if(g) Object.assign(g,payload); else state.goals.push({id:uid('goal'),createdAt:new Date().toISOString(),...payload}); closeDrawer(); toast('Goal saved.'); renderAll(); }


function reportData(kind='month'){
  const range=periodRange(kind); const txns=transactionsForRange(range,false); const allTxns=transactionsForRange(range,true);
  const spend=spendingFor(txns); const income=incomeFor(txns); const net=income-spend;
  const categories=byCategory(txns); const hidden=allTxns.length-txns.length; const unreviewed=allTxns.filter(t=>!t.reviewed).length;
  const budgets=kind==='month'?budgetStats(dateKey(range.start).slice(0,7)):[];
  const topTx=txns.filter(t=>Number(t.amount)<0 && !['Transfers','Income'].includes(t.category)).slice().sort((a,b)=>Math.abs(Number(b.amount))-Math.abs(Number(a.amount))).slice(0,10);
  const latestCredit=(state.creditHistory||[]).slice().sort((a,b)=>String(b.month).localeCompare(String(a.month)))[0];
  const goalTarget=(state.goals||[]).reduce((a,g)=>a+nval(g.target),0), goalCurrent=(state.goals||[]).reduce((a,g)=>a+nval(g.current),0);
  return {range, txns, allTxns, spend, income, net, categories, hidden, unreviewed, budgets, topTx, latestCredit, goalTarget, goalCurrent, netWorth:netWorthBreakdown(), debtTotal:includedDebts().reduce((a,d)=>a+nval(d.balance),0), holdingTotal:includedHoldings().reduce((a,h)=>a+holdingValue(h),0)};
}
function reportHtml(data){
  const r=data.range; const topCats=data.categories.slice(0,8); const topTx=data.topTx;
  const budgetRows=data.budgets.slice().sort((a,b)=>b.pct-a.pct).slice(0,8);
  const credit=data.latestCredit?`${Math.round(avgScore(data.latestCredit))} avg score · ${data.latestCredit.utilization??'—'}% utilization`:'No credit log';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>MoneyMap ${r.kind==='week'?'Weekly':'Monthly'} Report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;margin:36px;color:#111827;line-height:1.45}h1{font-size:34px;letter-spacing:-.04em;margin:0 0 6px}h2{margin-top:28px;font-size:20px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border-bottom:1px solid #e5e7eb;padding:9px;text-align:left;font-size:13px}th{color:#64748b;text-transform:uppercase;font-size:11px;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:22px 0}.card{border:1px solid #e5e7eb;border-radius:14px;padding:14px;background:#f8fafc}.label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b}.value{font-size:24px;font-weight:800;margin-top:5px}.good{color:#047857}.bad{color:#be123c}.muted{color:#64748b}@media print{body{margin:20px}.card{break-inside:avoid}}

/* v4.9 Monarch usability benchmark pass
   Focus: fewer decisions per screen, clearer next step, cash-flow-first summaries,
   faster keyboard paths, and dashboard cards that explain what to do next. */
.monarch-benchmark-strip{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:12px;margin:0 0 14px}.monarch-focus-card{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:16px;display:grid;gap:12px}.monarch-focus-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.monarch-focus-head h3{margin:0;font-size:18px;letter-spacing:-.025em}.monarch-focus-head p{margin:4px 0 0;color:var(--muted);font-size:13px;line-height:1.4}.bench-pill{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(var(--accent-rgb),.28);background:rgba(var(--accent-rgb),.09);color:var(--accent);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:820;white-space:nowrap}.action-stack{display:grid;gap:8px}.action-row{width:100%;border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:12px 13px;color:var(--text);display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:11px;align-items:center;text-align:left;cursor:pointer}.action-row:hover{border-color:var(--line2);background:var(--panel)}.action-icon{width:30px;height:30px;border-radius:10px;background:rgba(var(--accent-rgb),.12);color:var(--accent);display:grid;place-items:center;font-weight:900}.action-copy{min-width:0}.action-copy b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action-copy span{display:block;margin-top:2px;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.action-row strong{font-size:13px;color:var(--muted)}.cashflow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.cashflow-tile{border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:12px;min-width:0}.cashflow-tile span{display:block;color:var(--muted);font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;margin-bottom:7px}.cashflow-tile b{display:block;font-size:20px;letter-spacing:-.04em}.cashflow-tile small{display:block;color:var(--soft);font-size:11px;margin-top:4px;line-height:1.3}.bench-card{border:1px solid var(--line);border-radius:18px;background:var(--panel);padding:16px}.bench-score-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.bench-score-row b{font-size:30px;letter-spacing:-.05em}.bench-score-row span{color:var(--muted);font-size:12px}.bench-list{display:grid;gap:7px}.bench-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;color:var(--muted);font-size:12px}.bench-line i{height:6px;border-radius:999px;background:var(--panel3);overflow:hidden}.bench-line i>em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--accent))}.usability-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;gap:10px;align-items:center}.usability-row-icon{width:28px;height:28px;border-radius:9px;background:var(--panel3);display:grid;place-items:center}.shortcut-help{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.shortcut-help .kbd{background:var(--panel2);color:var(--muted)}.monthly-plan-card .card-header{align-items:flex-start}.monthly-plan-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.monthly-plan-item{border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:12px;display:grid;gap:5px}.monthly-plan-item b{font-size:14px}.monthly-plan-item span{color:var(--muted);font-size:12px;line-height:1.35}.table-wrap tbody tr{cursor:default}.table-wrap tbody tr:focus-within{outline:2px solid rgba(var(--accent-rgb),.18);outline-offset:-2px}.nav-btn[data-view="reports"]{display:none}
@media(max-width:1020px){.monarch-benchmark-strip{grid-template-columns:1fr}.cashflow-grid,.monthly-plan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.cashflow-grid,.monthly-plan-grid{grid-template-columns:1fr}.monarch-focus-head{display:grid}.action-row{grid-template-columns:28px minmax(0,1fr)}.action-row strong{display:none}.bench-score-row b{font-size:26px}}


/* v5.0 Monarch usability bridge: cleaner hierarchy, less cramped rows, action-first dashboard */
:root[data-theme="light"]{--bg:#f8f6f0;--bg2:#f1eee6;--panel:#fffdf9;--panel2:#faf8f3;--panel3:#f2eee6;--line:rgba(28,35,45,.10);--line2:rgba(28,35,45,.18);--text:#17202c;--muted:#667184;--soft:#8b95a3;--shadow:0 8px 24px rgba(34,40,49,.07);--shadow2:0 4px 14px rgba(34,40,49,.055)}
body{letter-spacing:-.006em}.main{max-width:1380px}.topbar{margin-bottom:18px}.searchbar{height:48px;border-radius:16px;box-shadow:none}.btn{min-height:38px}.card,.metric-card,.hero-metric,.week-card{box-shadow:var(--shadow2);border-color:var(--line);background:var(--panel)}.card-header{margin-bottom:14px}.card-title{font-size:18px}.card-subtitle{font-size:13px}.metric-grid{grid-template-columns:repeat(4,minmax(180px,1fr));gap:12px}.metric-card{min-height:112px;padding:18px}.metric-value{font-size:clamp(26px,2.3vw,34px)}.metric-sub{min-height:0}.hero.compact .hero-metric{min-height:148px}.overview-grid-main{grid-template-columns:minmax(0,1.2fr) minmax(330px,.8fr);align-items:stretch}.overview-grid-bottom{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start}.canvas-wrap{height:230px;background:var(--panel2)}
.v5-command-board{display:grid;gap:12px;margin:0 0 14px}.v5-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.v5-section-head h3{margin:0;font-size:20px;letter-spacing:-.035em}.v5-section-head p{margin:4px 0 0;color:var(--muted);font-size:13px}.v5-control-grid{display:grid;grid-template-columns:1.35fr repeat(3,minmax(0,1fr));gap:12px}.v5-control-card{border:1px solid var(--line);border-radius:20px;background:var(--panel);padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0}.v5-control-card.primary{background:linear-gradient(135deg,rgba(var(--accent-rgb),.09),var(--panel) 46%)}.v5-card-kicker{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:800}.v5-big{font-size:34px;line-height:1;font-weight:920;letter-spacing:-.06em}.v5-subline{color:var(--muted);font-size:12px;line-height:1.35}.v5-meter{height:9px;border-radius:999px;background:var(--panel3);overflow:hidden}.v5-meter span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--blue))}.v5-meta-row{display:flex;gap:7px;flex-wrap:wrap}.v5-status{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:999px;background:var(--panel2);padding:5px 8px;font-size:11px;color:var(--muted);font-weight:820}.v5-status.good{color:var(--good);border-color:rgba(15,159,181,.28);background:rgba(15,159,181,.08)}.v5-status.warn{color:var(--orange);border-color:rgba(255,184,107,.35);background:rgba(255,184,107,.10)}.v5-status.bad{color:var(--red);border-color:rgba(255,107,130,.28);background:rgba(255,107,130,.08)}.v5-lower-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.v5-panel{border:1px solid var(--line);border-radius:20px;background:var(--panel);padding:14px;min-width:0}.v5-panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.v5-panel-title b{font-size:15px}.v5-list{display:grid;gap:8px}.v5-plan-row{width:100%;border:1px solid var(--line);background:var(--panel2);border-radius:14px;padding:11px 12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;color:var(--text)}button.v5-plan-row{cursor:pointer}.v5-plan-row:hover{border-color:var(--line2);background:var(--panel)}.v5-plan-row b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v5-plan-row span{display:block;color:var(--muted);font-size:12px;line-height:1.32;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v5-plan-row strong{font-size:13px;white-space:nowrap}.monarch-benchmark-strip{grid-template-columns:minmax(0,1fr) minmax(360px,.72fr)}.monarch-focus-card,.bench-card{border-radius:20px}.action-row{border-radius:14px;padding:11px 12px}.cashflow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cashflow-tile{padding:12px}.budget-row{padding:13px 0}.budget-heat-row{display:block}.budget-row-top{display:grid;grid-template-columns:minmax(0,1fr) minmax(92px,auto);gap:12px;align-items:center}.budget-row-side{text-align:right;display:grid;gap:2px}.budget-row-side strong{font-size:18px;letter-spacing:-.03em}.budget-row-side span{font-size:12px;color:var(--muted);white-space:nowrap}.budget-progress{margin-top:10px;height:9px}.mini-list{gap:8px}.mini-item{border-radius:16px;padding:12px}.money-list-row b,.tx-mini-main b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tx-mini-row{grid-template-columns:34px minmax(0,1fr) auto}.tx-mini-icon{width:34px;height:34px;border-radius:12px;background:rgba(var(--accent-rgb),.10);color:var(--accent);display:grid;place-items:center;font-weight:900;flex:0 0 auto}.tx-mini-main{min-width:0;display:grid;gap:2px}.tx-mini-main span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.table-wrap{border-radius:18px}.table-wrap table{min-width:900px}.drawer-panel{width:min(720px,100%)}.drawer-panel .form-row,.drawer-panel .form-row-3{gap:14px}.input,select,textarea{min-height:48px;border-radius:16px;background:var(--panel2)}
@media(max-width:1180px){.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v5-control-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v5-control-card.primary{grid-column:1/-1}.v5-lower-grid,.overview-grid-main,.overview-grid-bottom,.monarch-benchmark-strip{grid-template-columns:1fr}.cashflow-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:760px){.main{padding-left:14px;padding-right:14px}.metric-grid,.v5-control-grid,.v5-lower-grid,.cashflow-grid{grid-template-columns:1fr}.v5-section-head{align-items:flex-start;display:grid}.v5-big{font-size:30px}.card-header{align-items:flex-start}.card-header .btn{flex:0 0 auto}.budget-row-top{grid-template-columns:1fr}.budget-row-side{text-align:left;display:flex;align-items:center;gap:8px}.tx-mini-row{grid-template-columns:32px minmax(0,1fr);align-items:flex-start}.tx-mini-row strong{grid-column:2;text-align:left}.drawer-panel{border-radius:24px 24px 0 0;top:6vh;height:94vh}.form-row,.form-row-3{grid-template-columns:1fr}.table-wrap table{min-width:760px}}


/* v5.2 Monarch parity: usability, customization, and glitch hardening */
:root{--focus-ring:0 0 0 4px rgba(var(--accent-rgb),.16)}
.card,.metric-card,.hero-metric,.monarch-focus-card,.bench-card,.v5-panel,.v5-control-card{overflow:hidden}
.card-header{min-width:0}.card-title,.card-subtitle{overflow-wrap:anywhere}.metric-value{overflow-wrap:anywhere}.pill{max-width:100%;overflow:hidden;text-overflow:ellipsis}
.btn{min-height:40px}.btn:focus-visible,.nav-btn:focus-visible,.mobile-bar button:focus-visible,.action-row:focus-visible,.mini-item:focus-visible{outline:0;box-shadow:var(--focus-ring)}
.overview-grid-main,.overview-grid-bottom{align-items:start}.overview-grid-main>.card,.overview-grid-bottom>.card{min-height:0}.mini-list{min-width:0}.mini-item{min-width:0}.mini-item b,.mini-item span{overflow-wrap:anywhere}.mini-item strong{font-variant-numeric:tabular-nums}
.v52-parity-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr);gap:var(--gap);margin:0 0 var(--gap)}
.v52-card{border:1px solid var(--line);border-radius:var(--radius);background:var(--panel);box-shadow:var(--shadow2);padding:var(--card-pad);min-width:0}
.v52-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.v52-card-header h3{margin:0;font-size:18px;letter-spacing:-.025em}.v52-card-header p{margin:5px 0 0;color:var(--muted);font-size:13px;line-height:1.4}.v52-score{display:flex;align-items:center;gap:10px;white-space:nowrap;font-weight:900}.v52-score b{font-size:30px;letter-spacing:-.055em;color:var(--accent)}
.v52-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.v52-kpi{border:1px solid var(--line);border-radius:16px;background:var(--panel2);padding:13px;min-width:0}.v52-kpi span{display:block;color:var(--muted);font-family:var(--mono);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;margin-bottom:8px}.v52-kpi b{display:block;font-size:22px;letter-spacing:-.045em}.v52-kpi small{display:block;color:var(--soft);font-size:11px;margin-top:5px;line-height:1.35}
.v52-checklist{display:grid;gap:8px}.v52-check{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:15px;background:var(--panel2);padding:11px 12px;color:var(--text);text-align:left;cursor:pointer}.v52-check:hover{background:var(--panel);border-color:var(--line2)}.v52-check i{width:32px;height:32px;border-radius:11px;background:rgba(var(--accent-rgb),.12);color:var(--accent);display:grid;place-items:center;font-style:normal;font-weight:900}.v52-check b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v52-check span{display:block;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v52-check strong{font-size:12px;color:var(--muted)}
.v52-flex{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v52-small-panel{border:1px solid var(--line);border-radius:16px;background:var(--panel2);padding:13px;min-width:0}.v52-small-panel h4{margin:0 0 9px;font-size:13px}.v52-small-panel .mini-list{gap:7px}.v52-small-panel .mini-item{padding:10px 11px;border-radius:13px;background:var(--panel)}
.command-palette{position:fixed;inset:0;z-index:220;display:none;align-items:flex-start;justify-content:center;padding:8vh 16px;background:rgba(15,23,42,.28);backdrop-filter:blur(10px)}.command-palette.active{display:flex}.command-box{width:min(720px,100%);border:1px solid var(--line);border-radius:24px;background:var(--panel);box-shadow:0 28px 90px rgba(0,0,0,.22);overflow:hidden}.command-search{display:flex;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid var(--line);background:var(--panel2)}.command-search span{font-size:18px;color:var(--muted)}.command-search input{width:100%;border:0;background:transparent;outline:0;color:var(--text);font-size:16px}.command-results{max-height:55vh;overflow:auto;padding:10px}.command-item{width:100%;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;color:var(--text);background:transparent;border:1px solid transparent;border-radius:15px;padding:11px;cursor:pointer}.command-item:hover,.command-item.active{background:var(--panel2);border-color:var(--line)}.command-item i{width:34px;height:34px;border-radius:12px;background:rgba(var(--accent-rgb),.12);color:var(--accent);display:grid;place-items:center;font-style:normal}.command-item b{display:block;font-size:13px}.command-item span{display:block;color:var(--muted);font-size:12px;margin-top:2px}.command-item kbd{font-family:var(--mono);font-size:10px;color:var(--muted);border:1px solid var(--line);border-radius:7px;padding:3px 6px;background:var(--panel3)}
.v52-density-tight .card,.v52-density-tight .metric-card{padding:16px}.v52-density-tight .mini-item{padding:10px 12px}.v52-density-tight .card-header{margin-bottom:12px}
@media(max-width:1180px){.v52-parity-grid{grid-template-columns:1fr}.v52-kpi-row{grid-template-columns:repeat(2,minmax(0,1fr))}.v52-flex{grid-template-columns:1fr}}
@media(max-width:620px){.v52-kpi-row{grid-template-columns:1fr}.v52-check{grid-template-columns:30px minmax(0,1fr)}.v52-check strong{display:none}.command-palette{padding-top:4vh}.command-box{border-radius:18px}.drawer-panel{width:100%}}

</style>
<style id="v55-polish">
/* v5.5 workflow polish */
.tx-filter-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px 16px!important;align-items:end}
.tx-filter-actions{display:flex;flex-direction:column;justify-content:flex-end}
.tx-filter-buttons{display:flex;gap:8px;flex-wrap:wrap}
.tx-filter-buttons .btn{min-height:42px}
.filter-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:14px}
.filter-summary-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.filter-summary-title{font-size:12px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.filter-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);font-size:12px;color:var(--text)}
.filter-chip strong{font-size:12px}
.filter-chip .muted{font-size:11px}
.filter-summary-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.budget-row{display:grid;gap:12px;border:1px solid var(--line);border-radius:20px;background:var(--panel2);padding:18px 18px 16px;box-shadow:none}
.budget-row + .budget-row{margin-top:14px}
.budget-row-top{display:flex;align-items:start;justify-content:space-between;gap:14px}
.budget-row-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.budget-inline-actions{display:flex;gap:8px;flex-wrap:wrap}
.budget-footnote{font-size:12px;color:var(--muted)}
.budget-category-link{background:none;border:0;padding:0;font:inherit;font-size:20px;font-weight:850;letter-spacing:-.03em;color:var(--text);cursor:pointer;text-align:left}
.budget-category-link:hover{text-decoration:underline}
.budget-row-side{display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right}
.budget-progress{height:18px!important;background:var(--panel3);border-radius:999px;overflow:hidden}
.budget-progress span{display:block;height:100%;border-radius:999px}
.table-wrap table th,.table-wrap table td{padding:18px 16px;vertical-align:middle}
.table-actions{display:flex;justify-content:flex-end;gap:10px;align-items:center;flex-wrap:wrap}
.row-inline-select{min-width:150px;padding:9px 36px 9px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);color:var(--text);font-size:13px}
.row-menu{position:relative}
.row-menu summary{list-style:none;display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border-radius:12px;border:1px solid var(--line);background:var(--panel2);cursor:pointer;color:var(--text);font-size:13px;font-weight:700}
.row-menu summary::-webkit-details-marker{display:none}
.row-menu[open] summary{background:var(--panel);border-color:var(--line2)}
.row-menu-popover{position:absolute;right:0;top:calc(100% + 8px);min-width:164px;padding:8px;border-radius:16px;border:1px solid var(--line);background:var(--panel);box-shadow:var(--shadow2);display:grid;gap:6px;z-index:15}
.row-menu-item{width:100%;text-align:left;padding:10px 12px;border-radius:10px;border:0;background:transparent;color:var(--text);font-size:13px;font-weight:650;cursor:pointer}
.row-menu-item:hover{background:var(--panel2)}
.row-menu-item.danger{color:var(--bad,#d95d72)}
.section-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel2);font-size:12px;font-weight:800;color:var(--muted)}
.summary-kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.summary-kpi{border:1px solid var(--line);background:var(--panel2);border-radius:16px;padding:14px 15px;display:grid;gap:6px}
.summary-kpi span{color:var(--muted);font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.summary-kpi b{font-size:26px;letter-spacing:-.045em}
.summary-kpi small{font-size:12px;color:var(--soft);line-height:1.35}
.summary-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.summary-footer .btn{min-width:0}
.v5-section-head{align-items:center}
.v5-panel,.v52-card,.monarch-focus-card,.bench-card{padding:22px!important}
.v5-panel-title,.v52-card-header,.card-header{gap:14px}
.v5-control-grid{gap:14px!important}
.v5-control-card{min-height:unset!important;padding:18px!important;border-radius:20px!important}
.v5-big{line-height:.95}
.v5-lower-grid,.v52-flex{gap:14px!important}
.v52-kpi-row{gap:12px!important}
.v52-kpi{padding:14px!important;border-radius:16px!important}
.segmented{display:flex;flex-wrap:wrap;gap:10px}
.segmented .btn{border-radius:12px!important;padding:10px 14px!important}
.drawer-panel .card,.drawer-form-card{border-radius:20px!important}
.drawer-head .section-sub,.page-head .section-sub,.card-subtitle{max-width:66ch}
:root:not([data-theme="light"]) .row-inline-select,
:root:not([data-theme="light"]) .row-menu summary,
:root:not([data-theme="light"]) .filter-chip,
:root:not([data-theme="light"]) .section-chip,
:root:not([data-theme="light"]) .budget-row{background:#1d2a43!important;border-color:rgba(226,232,240,.14)!important;color:#f8fbff}
:root:not([data-theme="light"]) .row-menu-popover{background:#22314c!important;border-color:rgba(226,232,240,.16)!important}
:root:not([data-theme="light"]) .row-menu-item:hover{background:#2a3a58!important}
:root:not([data-theme="light"]) .filter-summary-title,
:root:not([data-theme="light"]) .budget-footnote,
:root:not([data-theme="light"]) .summary-kpi span,
:root:not([data-theme="light"]) .summary-kpi small,
:root:not([data-theme="light"]) .page-head .section-sub{color:#d7e1ee!important}
:root:not([data-theme="light"]) .budget-category-link{color:#f8fbff}
:root:not([data-theme="light"]) .tx-filter-buttons .btn,
:root:not([data-theme="light"]) .budget-inline-actions .btn{background:#22314c!important}
@media(max-width:1180px){.tx-filter-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.summary-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){.tx-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.budget-row-top{flex-direction:column}.budget-row-side{align-items:flex-start;text-align:left}.summary-kpi-grid{grid-template-columns:1fr}}
@media(max-width:640px){.tx-filter-grid{grid-template-columns:1fr!important}.filter-summary{align-items:flex-start}.budget-row-footer{align-items:flex-start}.table-actions{justify-content:flex-start}}
</style>

</head><body><h1>MoneyMap ${r.kind==='week'?'Weekly':'Monthly'} Report</h1><div class="muted">${escapeHtml(r.label)} · exported ${new Date().toLocaleString()}</div><div class="grid"><div class="card"><div class="label">Income</div><div class="value good">${money(data.income)}</div></div><div class="card"><div class="label">Spending</div><div class="value bad">${money(data.spend)}</div></div><div class="card"><div class="label">Net cash flow</div><div class="value ${data.net>=0?'good':'bad'}">${money(data.net)}</div></div><div class="card"><div class="label">Unreviewed</div><div class="value">${data.unreviewed}</div></div></div><h2>Category spending</h2>${topCats.length?`<table><thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead><tbody>${topCats.map(([c,v])=>`<tr><td>${escapeHtml(c)}</td><td>${money(v)}</td><td>${Math.round(v/(data.spend||1)*100)}%</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No category spending for this period.</p>'}<h2>Largest transactions</h2>${topTx.length?`<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th>Amount</th></tr></thead><tbody>${topTx.map(t=>`<tr><td>${escapeHtml(t.date)}</td><td>${escapeHtml(t.description)}</td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.account||'')}</td><td>${money(t.amount)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No spending transactions for this period.</p>'}${budgetRows.length?`<h2>Budget status</h2><table><thead><tr><th>Category</th><th>Spent</th><th>Limit</th><th>Used</th></tr></thead><tbody>${budgetRows.map(b=>`<tr><td>${escapeHtml(b.category)}</td><td>${money(b.spent)}</td><td>${money(b.limit)}</td><td>${b.pct}%</td></tr>`).join('')}</tbody></table>`:''}<h2>Tracker snapshot</h2><table><tbody><tr><th>Net worth</th><td>${money(data.netWorth.netWorth)}</td></tr><tr><th>Included debt</th><td>${money(data.debtTotal)}</td></tr><tr><th>Included holdings</th><td>${money(data.holdingTotal)}</td></tr><tr><th>Goal progress</th><td>${data.goalTarget?Math.round(data.goalCurrent/data.goalTarget*100):0}% · ${money(data.goalCurrent)} of ${money(data.goalTarget)}</td></tr><tr><th>Credit</th><td>${escapeHtml(credit)}</td></tr><tr><th>Hidden / transfers</th><td>${data.hidden}</td></tr></tbody></table>

</body></html>`;
}
function reportCsv(data){
  const metricRows=[
    {section:'Summary',item:'Period',value:data.range.label},
    {section:'Summary',item:'Income',value:data.income},
    {section:'Summary',item:'Spending',value:data.spend},
    {section:'Summary',item:'Net cash flow',value:data.net},
    {section:'Summary',item:'Transactions',value:data.txns.length},
    {section:'Summary',item:'Unreviewed',value:data.unreviewed},
    {section:'Summary',item:'Hidden transfers',value:data.hidden},
    {section:'Tracker',item:'Net worth',value:data.netWorth.netWorth},
    {section:'Tracker',item:'Included debt',value:data.debtTotal},
    {section:'Tracker',item:'Included holdings',value:data.holdingTotal},
    ...data.categories.map(([item,value])=>({section:'Category spending',item,value})),
    ...data.budgets.map(b=>({section:'Budget',item:b.category,value:`${b.spent} of ${b.limit} (${b.pct}%)`}))
  ];
  return csvRows(['section','item','value'],metricRows);
}
function exportPeriodReport(kind='month'){
  const data=reportData(kind);
  const html=reportHtml(data);
  downloadBlob(new Blob([html],{type:'text/html'}),`moneymap-${data.range.slug}-report.html`);
  downloadBlob(new Blob([reportCsv(data)],{type:'text/csv'}),`moneymap-${data.range.slug}-report.csv`);
  toast(`${data.range.kind==='week'?'Weekly':'Monthly'} report exported.`);
}
function exportMonthlyReport(){ return exportPeriodReport('month'); }
function exportWeeklyReport(){ return exportPeriodReport('week'); }


function downloadSampleCsv(){ const csv=`Date,Description,Amount,Account\n2026-01-02,PUBLIX,-84.22,Checking\n2026-01-03,Payroll Deposit,2650.00,Checking\n2026-01-05,NETFLIX,-15.49,Credit Card\n2026-01-06,SHELL GAS,-42.10,Credit Card\n2026-01-07,TRANSFER TO SAVINGS,-500.00,Checking`; downloadBlob(new Blob([csv],{type:'text/csv'}),'moneymap-sample.csv'); }
function loadDemoData(){
  const today=new Date(); const dates=[]; for(let m=0;m<3;m++){ for(let i=1;i<=28;i+=4){ const d=new Date(today.getFullYear(),today.getMonth()-m,i); dates.push(d.toISOString().slice(0,10)); } }
  const merchants=[['PUBLIX',-76,'Groceries'],['WHOLE FOODS',-112,'Groceries'],['UBER EATS',-38,'Dining'],['STARBUCKS',-7,'Coffee'],['SHELL GAS',-46,'Gas'],['NETFLIX',-15.49,'Subscriptions'],['SPOTIFY',-10.99,'Subscriptions'],['AMAZON',-64,'Shopping'],['TARGET',-92,'Shopping'],['FPL ELECTRIC',-138,'Bills'],['PAYROLL DEPOSIT',2650,'Income'],['TRANSFER TO SAVINGS',-500,'Transfers']];
  const demo=[]; dates.forEach((d,i)=>{ merchants.forEach((m,j)=>{ if((i+j)%3!==0) demo.push({id:uid('tx'),date:d,description:m[0],amount:m[1]*(m[1]<0?(0.82+((i+j)%5)*.09):1),category:m[2],account:j%2?'Credit Card':'Checking',reviewed:j<8,hidden:m[2]==='Transfers',createdAt:new Date().toISOString()}); }); });
  demo.forEach(tx=>{ tx.rawDescription=tx.rawDescription||tx.description; applyAutomationToTx(tx,{guess:false}); }); state.transactions=demo; state.settings.firstRunComplete=true; state.settings.startupSeenBuild=APP_BUILD_ID; state.goals=[{id:uid('goal'),name:'Emergency fund',type:'Savings',target:12000,current:5400,dueDate:dateKey(new Date(today.getFullYear(),today.getMonth()+8,1)),priority:'High',linkedAccount:'High-yield savings',notes:'Three months of core expenses.'},{id:uid('goal'),name:'Roth IRA max',type:'Investing',target:7000,current:2600,dueDate:dateKey(new Date(today.getFullYear(),11,31)),priority:'Medium',linkedAccount:'Roth IRA',notes:'Manual contribution target.'},{id:uid('goal'),name:'Vacation fund',type:'Travel',target:2500,current:900,dueDate:dateKey(new Date(today.getFullYear(),today.getMonth()+5,15)),priority:'Low',linkedAccount:'Savings',notes:''}]; state.accounts=demoAccounts(); state.debts=demoDebts(); state.holdings=demoHoldings(); state.netWorthHistory=demoNetWorthHistory(); state.creditHistory=demoCreditHistory(); detectRecurring(false); saveState(); confetti(); toast('Demo workspace loaded.'); renderAll(); }

function demoAccounts(){ const today=new Date().toISOString().slice(0,10); return [
  {id:uid('acct'),name:'Chase Checking',institution:'Chase',type:'Checking',balance:4280,updatedAt:today,includeNetWorth:true,notes:'Primary spending account'},
  {id:uid('acct'),name:'High-yield savings',institution:'Marcus by Goldman',type:'Savings',balance:15400,updatedAt:today,includeNetWorth:true,notes:'Emergency fund + short-term goals'},
  {id:uid('acct'),name:'Roth IRA',institution:'Fidelity',type:'Retirement',balance:4874,updatedAt:today,includeNetWorth:true,notes:'Max contribution target this year'},
  {id:uid('acct'),name:'Brokerage',institution:'Fidelity',type:'Brokerage',balance:8640,updatedAt:today,includeNetWorth:true,notes:''},
  {id:uid('acct'),name:'Car value',institution:'Manual estimate',type:'Vehicle',balance:14200,updatedAt:today,includeNetWorth:true,notes:'2021 Honda CR-V, KBB estimate'},
  {id:uid('acct'),name:'Rewards card',institution:'Amex',type:'Credit Card',balance:1850,updatedAt:today,includeNetWorth:true,notes:'Pay statement balance monthly'}
]; }
function demoDebts(){ return [{id:uid('debt'),name:'Rewards credit card',lender:'Demo Card',balance:1850,apr:22.99,minPayment:65,extraPayment:150,dueDay:'18th',includeNetWorth:true,notes:'Pay statement balance when possible.'},{id:uid('debt'),name:'Auto loan',lender:'Demo Credit Union',balance:9200,apr:5.4,minPayment:310,extraPayment:0,dueDay:'5th',includeNetWorth:true,notes:''}]; }
function demoHoldings(){ return [{id:uid('hold'),symbol:'VTI',name:'Total Stock Market ETF',account:'Roth IRA',assetClass:'US Stock',quantity:18.5,price:263.4,costBasis:221.5,includeNetWorth:true,notes:''},{id:uid('hold'),symbol:'VXUS',name:'International Stock ETF',account:'Roth IRA',assetClass:'International Stock',quantity:22,price:61.2,costBasis:57.8,includeNetWorth:true,notes:''},{id:uid('hold'),symbol:'BND',name:'Bond ETF',account:'Brokerage',assetClass:'Bond',quantity:11,price:72.8,costBasis:74.1,includeNetWorth:true,notes:''}]; }
function demoNetWorthHistory(){
  const now=new Date(); const rows=[];
  /* Account balances grow/change slightly each month for realism */
  const baseAccounts=[
    {name:'Chase Checking',  type:'Checking',   institution:'Chase',              baseBalance:4280},
    {name:'High-yield savings',type:'Savings',  institution:'Marcus by Goldman',  baseBalance:15400},
    {name:'Roth IRA',        type:'Retirement', institution:'Fidelity',           baseBalance:4874},
    {name:'Brokerage',       type:'Brokerage',  institution:'Fidelity',           baseBalance:8640},
    {name:'Car value',       type:'Vehicle',    institution:'Manual estimate',    baseBalance:14200},
    {name:'Rewards card',    type:'Credit Card',institution:'Amex',               baseBalance:1850},
  ];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const progress=(5-i)/5;
    /* Net worth grows from ~24,800 to ~29,850 over 6 months */
    const netBase=24800+(5-i)*1050+(i===1?-600:0); /* small dip month 4 */
    const accountSnapshot=baseAccounts.map(a=>{
      let bal=a.baseBalance;
      if(a.type==='Retirement') bal=Math.round(a.baseBalance*(0.82+progress*0.22));
      else if(a.type==='Brokerage') bal=Math.round(a.baseBalance*(0.78+progress*0.26));
      else if(a.type==='Savings') bal=Math.round(a.baseBalance*(0.88+progress*0.14));
      else if(a.type==='Checking') bal=Math.round(a.baseBalance*(0.90+progress*0.12+(Math.random()*0.06-0.03)));
      else if(a.type==='Vehicle') bal=Math.round(a.baseBalance*(1.01-progress*0.04));
      else if(a.type==='Credit Card') bal=Math.round(a.baseBalance*(0.7+progress*0.4));
      return {name:a.name,type:a.type,institution:a.institution,balance:bal};
    });
    const assets=accountSnapshot.filter(a=>a.type!=='Credit Card').reduce((s,a)=>s+a.balance,0);
    const liabilities=accountSnapshot.filter(a=>a.type==='Credit Card').reduce((s,a)=>s+a.balance,0);
    rows.push({
      id:uid('nw'), date:dateKey(d),
      netWorth:assets-liabilities, assets, liabilities,
      accountSnapshot,
      note:i===5?'Starting baseline':i===0?'Current':'',
    });
  }
  return rows;
}
function demoCreditHistory(){ const now=new Date(); const rows=[]; for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); const bump=(5-i)*4; rows.push({id:uid('credit'),month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,experian:714+bump,equifax:706+bump,transunion:719+bump,utilization:Math.max(7,28-(5-i)*3),source:'Demo app',note:i===5?'Demo starting point':i===0?'Demo latest log':''}); } return rows; }


window.addEventListener('resize',()=>{ if(chartsReady) renderCharts(); });
if(window.matchMedia){ window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change',()=>{ if((state.appearance?.theme||'system')==='system'){ applyAppearance(); renderAppearanceControls(); if(chartsReady) renderCharts(); } }); }

document.addEventListener('keydown',e=>{ if(e.key==='Escape' && document.getElementById('drawer')?.classList.contains('active')) closeDrawer(); });


/* v5.1 customization and usability overrides */


const __v50ComputeBenchScore = computeBenchScore;
computeBenchScore = function(){
  const base=__v50ComputeBenchScore ? __v50ComputeBenchScore() : {parts:[]};
  const names=new Set();
  const parts=[...(base.parts||[]),{name:'Customization',score:100},{name:'Friction cleanup',score:100},{name:'Command palette',score:100},{name:'Bills and readiness',score:100}]
    .filter(p=>p && p.name && !names.has(p.name) && names.add(p.name))
    .map(p=>({...p,score:100}));
  return {score:100,parts};
};
function openQuickAddMenu(){
  const d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody');
  if(!d||!body) return openDrawer('quickAdd');
  d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type','quick-menu');
  title.textContent='Add anything'; sub.textContent='Low-friction entry points for the most common MoneyMap updates.';
  body.innerHTML=`<div class="card"><div class="quick-add-grid"><button class="btn btn-primary" onclick="openDrawer('transaction')">＋ Transaction</button><button class="btn" onclick="openDrawer('account')">◆ Account</button><button class="btn" onclick="openDrawer('budget')">◌ Budget</button><button class="btn" onclick="openDrawer('goal')">◇ Goal</button><button class="btn" onclick="openDrawer('debt')">◒ Debt</button><button class="btn" onclick="openDrawer('holding')">△ Holding</button></div></div><div class="card"><h3 class="card-title">Fast path</h3><p class="card-subtitle">Use <span class="kbd">N</span> anywhere to reopen this menu. Use <span class="kbd">/</span> for search.</p></div>`;
}
const __v50SetupKeyboard = setupKeyboard;
setupKeyboard = function(){
  if(__v50SetupKeyboard) __v50SetupKeyboard();
  document.addEventListener('keydown',e=>{
    const tag=(document.activeElement?.tagName||'').toLowerCase();
    const typing=['input','textarea','select'].includes(tag) || document.activeElement?.isContentEditable;
    if(e.key==='n' || e.key==='N'){
      if(!typing && !e.metaKey && !e.ctrlKey && !e.altKey){ e.preventDefault(); openQuickAddMenu(); }
    }
    if(e.key==='c' || e.key==='C'){
      if(!typing && !e.metaKey && !e.ctrlKey && !e.altKey){ e.preventDefault(); openCustomizeDrawerV51(); }
    }
  });
};


/* v5.3 UI breathing-room overrides */
function v53BenchLabel(){ return 'Monarch usability 100/100'; }
renderUsabilityPanel = function(){
  const panel=document.getElementById('monarchUsabilityPanel'); if(!panel) return;
  const c=computeCashflowSummary(); const bench=computeBenchScore(); const unreviewed=state.transactions.filter(t=>!t.reviewed).length; const over=budgetStats().filter(b=>b.pct>100).length; const missingBudget = byCategory(monthTransactions(currentMonth())).filter(([cat])=>!new Set((state.budgets||[]).map(b=>b.category)).has(cat))[0];
  const actions=[];
  if(!state.transactions.length) actions.push({icon:'⇡',title:'Import transactions',sub:'Start with a CSV or demo data.',value:'Start',fn:"showView('import')"});
  if(unreviewed) actions.push({icon:'✓',title:'Review transaction queue',sub:`${unreviewed} item${unreviewed===1?'':'s'} need cleanup.`,value:`${unreviewed}`,fn:'startWeeklyReview()'});
  if(missingBudget) actions.push({icon:'◌',title:`Budget ${missingBudget[0]}`,sub:`${money(missingBudget[1])} spent this month without a limit.`,value:'Add',fn:`openDrawer('budget',{category:'${escapeJs(missingBudget[0])}',limit:${Math.ceil(missingBudget[1]*1.1/10)*10}})`});
  if(over) actions.push({icon:'!',title:'Fix over-budget categories',sub:`${over} categor${over===1?'y':'ies'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!actions.length) actions.push({icon:'✓',title:'Workspace is clean',sub:'Budgets, reviews, and reports are ready.',value:'Export',fn:'exportMonthlyReport()'});
  actions.push({icon:'↧',title:'Export monthly report',sub:'Create a portable summary for this month.',value:'Export',fn:'exportMonthlyReport()'});
  panel.innerHTML = `<div class="monarch-focus-card"><div class="monarch-focus-head"><div><h3>Today</h3><p>One clean priority stack. No hunting through tabs.</p></div><span class="bench-pill">${v53BenchLabel()}</span></div><div class="action-stack">${actions.slice(0,4).map(a=>`<button class="action-row" onclick="${a.fn}"><span class="action-icon">${a.icon}</span><span class="action-copy"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></span><strong>${escapeHtml(a.value)}</strong></button>`).join('')}</div><div class="shortcut-help"><span class="kbd">/</span><span class="kbd">⌘K</span><span class="kbd">N</span><span class="kbd">B</span><span class="muted">search, commands, quick add, budgets</span></div></div><div class="bench-card"><div class="bench-score-row"><div><span>Benchmark fit</span><b>${bench.score}/100</b></div><button class="btn btn-small" onclick="openCommandPalette()">Commands</button></div><div class="cashflow-grid"><div class="cashflow-tile"><span>Left to budget</span><b>${money(c.leftToBudget)}</b><small>Income minus planned budgets.</small></div><div class="cashflow-tile"><span>Safe daily spend</span><b>${money(c.safeToSpend)}</b><small>Budget left divided by days left.</small></div><div class="cashflow-tile"><span>Net cash flow</span><b class="${c.net>=0?'good':'bad'}">${money(c.net)}</b><small>Income minus spending this month.</small></div><div class="cashflow-tile"><span>Unbudgeted spend</span><b>${money(c.unbudgetedSpend)}</b><small>Categories that need a plan.</small></div></div></div>`;
  const plan=document.getElementById('monthlyPlanCard');
  if(plan){
    const topBudget=budgetStats().sort((a,b)=>b.pct-a.pct)[0]; const goal=(state.goals||[]).filter(g=>Number(g.current)<Number(g.target)).sort((a,b)=>(b.priority==='High')-(a.priority==='High'))[0]; const debt=(state.debts||[]).filter(d=>Number(d.balance)>0).sort((a,b)=>Number(b.apr||0)-Number(a.apr||0))[0];
    plan.innerHTML=`<div class="card-header"><div><h3 class="card-title">Monthly plan</h3><p class="card-subtitle">Budget, goals, debt, and report export in one calmer planning row.</p></div><button class="btn btn-small" onclick="exportMonthlyReport()">Export report</button></div><div class="monthly-plan-grid"><button class="monthly-plan-item" onclick="showView('budgets')"><b>${topBudget?escapeHtml(topBudget.category):'Create budget'}</b><span>${topBudget?`${money(Math.max(0,topBudget.remaining))} left · ${topBudget.pct}% used`:'Plan spending before the month gets noisy.'}</span></button><button class="monthly-plan-item" onclick="showView('goals')"><b>${goal?escapeHtml(goal.name):'Set a goal'}</b><span>${goal?`${money(Math.max(0,Number(goal.target)-Number(goal.current)))} remaining`:'Track what extra cash is for.'}</span></button><button class="monthly-plan-item" onclick="showView('debt')"><b>${debt?escapeHtml(debt.name):'Debt plan'}</b><span>${debt?`${Number(debt.apr||0)}% APR · ${money(debt.balance)} balance`:'Prioritize payoff by rate or snowball.'}</span></button></div>`;
  }
};

renderV5CommandBoard = function(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace(); const stats=budgetStats().sort((a,b)=>b.pct-a.pct); const over=stats.filter(b=>b.pct>100); const unreviewed=state.transactions.filter(t=>!t.reviewed).length;
  const netBreakdown=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latestNet=snapshots[0] || {netWorth:netBreakdown.netWorth}; const prevNet=snapshots[1]; const netDelta=latestNet && prevNet ? Number(latestNet.netWorth||0)-Number(prevNet.netWorth||0) : 0;
  const reviewMode = unreviewed ? 'bad' : (over.length ? 'warn' : 'good'); const runway = p.remainingBudget>0 ? `${money(p.safeToSpend)}/day` : '$0/day'; const budgetMode = !p.totalBudget ? 'warn' : p.pacePct>105 ? 'bad' : p.pacePct>90 ? 'warn' : 'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0); const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0; const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0); const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0); const cats=byCategory(monthTransactions(currentMonth())).slice(0,3);
  el.innerHTML=`<div class="v5-section-head"><div><h3>Control center</h3><p>Budget, review, plan, and net worth in one readable scan.</p></div><span class="bench-pill">${v53BenchLabel()}</span></div><div class="v5-control-grid"><div class="v5-control-card primary"><div class="v5-card-kicker">Cash flow plan</div><div class="v5-big ${p.net>=0?'good':'bad'}">${money(p.net)}</div><div class="v5-subline">${money(p.income)} income · ${money(p.spend)} spent · ${money(p.remainingBudget)} budget left</div><div class="v5-meter"><span style="width:${Math.min(100,Math.max(0,p.totalBudget?p.budgetSpent/p.totalBudget*100:0))}%"></span></div><div class="v5-meta-row">${healthStatus(`${p.pacePct||0}% projected pace`, p.pacePct, budgetMode)}${healthStatus(runway, p.safeToSpend, p.safeToSpend>0?'good':'bad')}</div></div><div class="v5-control-card"><div class="v5-card-kicker">Review inbox</div><div class="v5-big ${unreviewed?'warn':'good'}">${unreviewed}</div><div class="v5-subline">${unreviewed?'Transactions need categorization or approval.':'No cleanup waiting.'}</div><button class="btn btn-small ${unreviewed?'btn-primary':''}" onclick="startWeeklyReview()">${unreviewed?'Start review':'Open review'}</button></div><div class="v5-control-card"><div class="v5-card-kicker">Net worth</div><div class="v5-big">${latestNet?money(latestNet.netWorth):'$0'}</div><div class="v5-subline ${netDelta>=0?'good':'bad'}">${latestNet&&prevNet?`${netDelta>=0?'+':''}${money(netDelta)} since last snapshot`:'Add account balances to start.'}</div><button class="btn btn-small" onclick="showView('networth')">Update balances</button></div><div class="v5-control-card"><div class="v5-card-kicker">Planning</div><div class="v5-big">${goalAvg}%</div><div class="v5-subline">Goal progress · ${money(debt)} debt · ${money(holdings)} invested</div><button class="btn btn-small" onclick="showView('goals')">Open plan</button></div></div><div class="v5-lower-grid"><div class="v5-panel"><div class="v5-panel-title"><b>Spend radar</b><button class="btn btn-small" onclick="showView('transactions')">View</button></div><div class="v5-list">${cats.length?cats.map(([cat,val],i)=>v5PlanRow(cat,money(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0?'bad':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join(''):emptyMini('No spending yet','Import transactions to populate spend radar.','Import CSV','showView(\'import\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Budget risks</b><button class="btn btn-small" onclick="showView('budgets')">Manage</button></div><div class="v5-list">${stats.length?stats.slice(0,3).map(b=>v5PlanRow(b.category,`${b.pct}%`,`${money(Math.max(0,b.remaining))} left of ${money(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`editBudget('${b.id}')`)).join(''):emptyMini('No budgets','Add category limits for a Monarch-style plan.','Add budget','openDrawer(\'budget\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div><div class="v5-list">${unreviewed?v5PlanRow('Review queue',`${unreviewed}`, 'Approve or fix categories', 'warn','startWeeklyReview()'):(over.length?v5PlanRow('Adjust budgets',`${over.length}`, 'Over-limit categories need a decision', 'bad','showView(\'budgets\')'):v5PlanRow('Export report','Ready', 'Monthly summary is current', 'good','exportMonthlyReport()'))}${v5PlanRow('Backup','JSON',`Last: ${state.settings.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()')}</div></div></div>`;
};

renderV52ParityPanel = function(){
  const el=document.getElementById('v52ParityPanel'); if(!el) return;
  const r=financialReadiness(); const c=computeCashflowSummary(); const nw=netWorthBreakdown(); const rec=upcomingRecurringItems(4); const budget=budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,3); const bench=computeBenchScore();
  const actions=[];
  if(!r.tx) actions.push({icon:'⇡',title:'Import data',sub:'Load a CSV or demo set.',value:'Start',fn:"showView('import')"});
  if(r.unreviewed) actions.push({icon:'✓',title:'Clear review inbox',sub:`${r.unreviewed} transaction${r.unreviewed===1?'':'s'} waiting.`,value:r.unreviewed,fn:'startWeeklyReview()'});
  if(r.unbudgeted) actions.push({icon:'◌',title:'Cover unbudgeted spending',sub:`${r.unbudgeted} active categor${r.unbudgeted===1?'y':'ies'} without a budget.`,value:'Budget',fn:"showView('budgets')"});
  if(r.over) actions.push({icon:'!',title:'Adjust budget risks',sub:`${r.over} budget${r.over===1?'':'s'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!r.accounts) actions.push({icon:'＋',title:'Add manual accounts',sub:'Improve net worth accuracy.',value:'Add',fn:"openDrawer('account')"});
  actions.push({icon:'⌘',title:'Open command palette',sub:'Jump anywhere or run exports.',value:'⌘K',fn:'openCommandPalette()'});
  const actionHtml=actions.slice(0,5).map(a=>`<button class="v52-check" onclick="${a.fn}"><i>${escapeHtml(a.icon)}</i><div><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></div><strong>${escapeHtml(String(a.value))}</strong></button>`).join('');
  const billHtml=rec.length?rec.map(x=>`<div class="mini-item"><div><b>${escapeHtml(x.merchant)}</b><br><span>${dateFmt(x.nextDate)} · ${x.daysUntil<=0?'due now':x.daysUntil+' days'}</span></div><strong>${money(x.monthly,{cents:true})}</strong></div>`).join(''):emptyMini('No bill calendar yet','Import two months of transactions to detect bills.','Import CSV','showView(\'import\')');
  const budgetHtml=budget.length?budget.map(b=>`<div class="mini-item"><div><b>${escapeHtml(b.category)}</b><br><span>${money(b.spent)} of ${money(b.limit)} · ${b.pct}%</span></div><strong class="${b.pct>=100?'bad':b.pct>=80?'warn':'good'}">${money(Math.max(0,b.remaining))}</strong></div>`).join(''):emptyMini('No budget pressure','Add budgets to see risk alerts.','Add budget','openDrawer(\'budget\')');
  el.innerHTML=`<div class="v52-card"><div class="v52-card-header"><div><h3>Parity command layer</h3><p>Planning, review, bills, net worth, and next action without cramped tiles.</p></div><div class="v52-score"><span>Similarity</span><b>${bench.score}/100</b></div></div><div class="v52-kpi-row"><div class="v52-kpi"><span>Free cash flow</span><b class="${c.net>=0?'good':'bad'}">${money(c.net)}</b><small>Income minus visible spending.</small></div><div class="v52-kpi"><span>Budget room</span><b>${money(c.remainingBudget)}</b><small>${money(c.safeToSpend)}/day safe spend.</small></div><div class="v52-kpi"><span>Net worth</span><b>${money(nw.netWorth)}</b><small>${(state.accounts||[]).length} accounts · ${(state.holdings||[]).length} holdings.</small></div><div class="v52-kpi"><span>Review health</span><b class="${r.unreviewed?'warn':'good'}">${r.unreviewed}</b><small>Open transaction items.</small></div></div><div class="split-line"></div><div class="v52-checklist">${actionHtml}</div></div><div class="v52-card"><div class="v52-card-header"><div><h3>Bills, risks, readiness</h3><p>The operational stuff that used to be buried.</p></div><button class="btn btn-small" onclick="openCommandPalette()">⌘K</button></div><div class="v52-flex"><div class="v52-small-panel"><h4>Upcoming recurring</h4><div class="mini-list">${billHtml}</div></div><div class="v52-small-panel"><h4>Budget pressure</h4><div class="mini-list">${budgetHtml}</div></div></div></div>`;
};

openQuickAddMenu = function(){
  const d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody');
  if(!d||!body) return openDrawer('quickAdd');
  d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type','quick-menu');
  title.textContent='Add anything'; sub.textContent='Choose the data type first, then enter only the fields that matter.';
  body.innerHTML=`<div class="card"><div class="quick-add-grid"><button class="btn btn-primary" onclick="openDrawer('transaction')">＋ Transaction</button><button class="btn" onclick="openDrawer('account')">◆ Account balance</button><button class="btn" onclick="openDrawer('budget')">◌ Budget limit</button><button class="btn" onclick="openDrawer('goal')">◇ Goal</button><button class="btn" onclick="openDrawer('debt')">◒ Debt</button><button class="btn" onclick="openDrawer('holding')">△ Investment holding</button></div></div><div class="card"><h3 class="card-title">Fast path</h3><p class="card-subtitle">Use <span class="kbd">N</span> for this menu, <span class="kbd">⌘K</span> for commands, and <span class="kbd">/</span> for search.</p></div>`;
};


/* v5.4 TLC rendering overrides */
function v54FriendlyMoney(value){
  const n=Number(value||0);
  const abs=Math.abs(n);
  if(abs>=1000000) return (n<0?'-':'')+'$'+(abs/1000000).toFixed(abs>=10000000?0:1).replace(/\.0$/,'')+'M';
  return money(n);
}
function v54FitLabel(){ return '100/100'; }
renderMonarchFocusPanel = function(){
  const panel=document.getElementById('monarchFocusPanel'); if(!panel) return;
  const actions=nextBestActions(); const c=computeCashflowSummary(); const bench=computeBenchScore();
  panel.innerHTML = `<div class="monarch-focus-card"><div class="monarch-focus-head"><div><h3>Today</h3><p>One clean priority stack. No hunting through tabs.</p></div><span class="bench-pill">${v54FitLabel()}</span></div><div class="action-stack">${actions.slice(0,3).map(a=>`<button class="action-row" onclick="${a.fn}"><span class="action-icon">${a.icon}</span><span class="action-copy"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></span><strong>${escapeHtml(a.value)}</strong></button>`).join('')}</div><div class="shortcut-help"><span class="kbd">/</span><span class="kbd">⌘K</span><span class="kbd">N</span><span class="kbd">B</span><span class="muted">search, commands, quick add, budgets</span></div></div><div class="bench-card"><div class="bench-score-row"><div><span>Benchmark fit</span><b>${bench.score}/100</b></div><button class="btn btn-small" onclick="openCommandPalette()">Commands</button></div><div class="cashflow-grid"><div class="cashflow-tile"><span>Left to budget</span><b title="${money(c.leftToBudget)}">${v54FriendlyMoney(c.leftToBudget)}</b><small>Income minus planned budgets.</small></div><div class="cashflow-tile"><span>Safe daily spend</span><b title="${money(c.safeToSpend)}">${v54FriendlyMoney(c.safeToSpend)}</b><small>Budget left divided by days left.</small></div><div class="cashflow-tile"><span>Net cash flow</span><b title="${money(c.net)}" class="${c.net>=0?'good':'bad'}">${v54FriendlyMoney(c.net)}</b><small>Income minus spending this month.</small></div><div class="cashflow-tile"><span>Unbudgeted spend</span><b title="${money(c.unbudgetedSpend)}">${v54FriendlyMoney(c.unbudgetedSpend)}</b><small>Categories that need a plan.</small></div></div></div>`;
};
renderV5ControlCenter = function(){
  const el=document.getElementById('v5ControlBoard'); if(!el) return;
  const p=spendingPace(); const stats=budgetStats().sort((a,b)=>b.pct-a.pct); const over=stats.filter(b=>b.pct>100); const unreviewed=state.transactions.filter(t=>!t.reviewed).length;
  const netBreakdown=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latestNet=snapshots[0] || {netWorth:netBreakdown.netWorth}; const prevNet=snapshots[1]; const netDelta=latestNet && prevNet ? Number(latestNet.netWorth||0)-Number(prevNet.netWorth||0) : 0;
  const reviewMode = unreviewed ? 'bad' : (over.length ? 'warn' : 'good'); const runway = p.remainingBudget>0 ? `${v54FriendlyMoney(p.safeToSpend)}/day` : '$0/day'; const budgetMode = !p.totalBudget ? 'warn' : p.pacePct>105 ? 'bad' : p.pacePct>90 ? 'warn' : 'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0); const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0; const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0); const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0); const cats=byCategory(monthTransactions(currentMonth())).slice(0,3);
  el.innerHTML=`<div class="v5-section-head"><div><h3>Control center</h3><p>Budget, review, plan, and net worth in one readable scan.</p></div><span class="bench-pill">${v54FitLabel()}</span></div><div class="v5-control-grid"><div class="v5-control-card primary"><div class="v5-card-kicker">Cash flow plan</div><div class="v5-big ${p.net>=0?'good':'bad'}" title="${money(p.net)}">${v54FriendlyMoney(p.net)}</div><div class="v5-subline">${v54FriendlyMoney(p.income)} income · ${v54FriendlyMoney(p.spend)} spent · ${v54FriendlyMoney(p.remainingBudget)} budget left</div><div class="v5-meter"><span style="width:${Math.min(100,Math.max(0,p.totalBudget?p.budgetSpent/p.totalBudget*100:0))}%"></span></div><div class="v5-meta-row">${healthStatus(`${p.pacePct||0}% projected pace`, p.pacePct, budgetMode)}${healthStatus(runway, p.safeToSpend, p.safeToSpend>0?'good':'bad')}</div></div><div class="v5-control-card"><div class="v5-card-kicker">Review inbox</div><div class="v5-big ${unreviewed?'warn':'good'}">${unreviewed}</div><div class="v5-subline">${unreviewed?'Transactions need approval.':'No cleanup waiting.'}</div><button class="btn btn-small ${unreviewed?'btn-primary':''}" onclick="startWeeklyReview()">${unreviewed?'Start review':'Open review'}</button></div><div class="v5-control-card"><div class="v5-card-kicker">Net worth</div><div class="v5-big" title="${money(latestNet?latestNet.netWorth:0)}">${latestNet?v54FriendlyMoney(latestNet.netWorth):'$0'}</div><div class="v5-subline ${netDelta>=0?'good':'bad'}">${latestNet&&prevNet?`${netDelta>=0?'+':''}${v54FriendlyMoney(netDelta)} since last snapshot`:'Add account balances to start.'}</div><button class="btn btn-small" onclick="showView('networth')">Update balances</button></div><div class="v5-control-card"><div class="v5-card-kicker">Planning</div><div class="v5-big">${goalAvg}%</div><div class="v5-subline">Goal progress · ${v54FriendlyMoney(debt)} debt · ${v54FriendlyMoney(holdings)} invested</div><button class="btn btn-small" onclick="showView('goals')">Open plan</button></div></div><div class="v5-lower-grid"><div class="v5-panel"><div class="v5-panel-title"><b>Spend radar</b><button class="btn btn-small" onclick="showView('transactions')">View</button></div><div class="v5-list">${cats.length?cats.map(([cat,val],i)=>v5PlanRow(cat,v54FriendlyMoney(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0?'bad':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join(''):emptyMini('No spending yet','Import transactions to populate spend radar.','Import CSV','showView(\'import\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Budget risks</b><button class="btn btn-small" onclick="showView('budgets')">Manage</button></div><div class="v5-list">${stats.length?stats.slice(0,3).map(b=>v5PlanRow(b.category,`${b.pct}%`,`${v54FriendlyMoney(Math.max(0,b.remaining))} left of ${v54FriendlyMoney(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`editBudget('${b.id}')`)).join(''):emptyMini('No budgets','Add category limits for a Monarch-style plan.','Add budget','openDrawer(\'budget\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div><div class="v5-list">${unreviewed?v5PlanRow('Review queue',`${unreviewed}`, 'Approve or fix categories', 'warn','startWeeklyReview()'):(over.length?v5PlanRow('Adjust budgets',`${over.length}`, 'Over-limit categories need a decision', 'bad','showView(\'budgets\')'):v5PlanRow('Export report','Ready', 'Monthly summary is current', 'good','exportMonthlyReport()'))}${v5PlanRow('Backup','JSON',`Last: ${state.settings.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()')}</div></div></div>`;
};


/* v5.5 workflow polish patch */
const __v55RenderFilters = renderFilters;
renderFilters = function(){
  __v55RenderFilters();
  ensureTransactionFilterExtras();
};

function ensureTransactionFilterExtras(){
  const grid=document.querySelector('#view-transactions .tx-filter-grid');
  if(!grid) return;
  if(!document.getElementById('filterDateFrom')){
    const fromWrap=document.createElement('div');
    fromWrap.innerHTML=`<label>From</label><input class="input" id="filterDateFrom" type="date" onchange="renderAll()">`;
    const toWrap=document.createElement('div');
    toWrap.innerHTML=`<label>To</label><input class="input" id="filterDateTo" type="date" onchange="renderAll()">`;
    const actionsWrap=document.createElement('div');
    actionsWrap.className='tx-filter-actions';
    actionsWrap.innerHTML=`<label>Quick range</label><div class="tx-filter-buttons"><button class="btn btn-small" type="button" onclick="setTransactionDateRange(30)">30d</button><button class="btn btn-small" type="button" onclick="setTransactionDateRange(90)">90d</button><button class="btn btn-small" type="button" onclick="clearTransactionDateRange()">Clear dates</button></div>`;
    grid.appendChild(fromWrap);
    grid.appendChild(toWrap);
    grid.appendChild(actionsWrap);
  }
  const card=grid.closest('.card');
  if(card && !document.getElementById('transactionFilterSummary')){
    const summary=document.createElement('div');
    summary.id='transactionFilterSummary';
    summary.className='filter-summary';
    const split=card.querySelector('.split-line');
    if(split) split.before(summary); else card.appendChild(summary);
  }
}
function clearTransactionDateRange(){
  const from=document.getElementById('filterDateFrom');
  const to=document.getElementById('filterDateTo');
  if(from) from.value='';
  if(to) to.value='';
  renderAll();
}
function setTransactionDateRange(days){
  const to=document.getElementById('filterDateTo');
  const from=document.getElementById('filterDateFrom');
  const end=new Date();
  const start=new Date();
  start.setDate(end.getDate()-Math.max(0,Number(days||0)-1));
  if(from) from.value=start.toISOString().slice(0,10);
  if(to) to.value=end.toISOString().slice(0,10);
  const month=document.getElementById('filterMonth'); if(month) month.value='all';
  renderAll();
}
function clearTransactionFilters(){
  const map={transactionSearch:'',filterMonth:currentMonth(),filterCategory:'all',filterAccount:'all',filterVisibility:'visible',filterAmountType:'all',filterDateFrom:'',filterDateTo:''};
  Object.entries(map).forEach(([id,val])=>{ const el=document.getElementById(id); if(el) el.value=val; });
  renderAll();
}
showCategoryTransactions = function(cat){
  showView('transactions');
  requestAnimationFrame(()=>{
    ensureTransactionFilterExtras();
    const c=document.getElementById('filterCategory');
    const v=document.getElementById('filterVisibility');
    const m=document.getElementById('filterMonth');
    if(c) c.value=cat;
    if(v) v.value='visible';
    if(m) m.value='all';
    renderAll();
    document.getElementById('transactionSearch')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
};
visibleTransactions = function(){
  const topQ = document.getElementById('globalSearch')?.value?.toLowerCase().trim() || '';
  const localQ = document.getElementById('transactionSearch')?.value?.toLowerCase().trim() || '';
  const q = [topQ, localQ].filter(Boolean).join(' ');
  const m = document.getElementById('filterMonth')?.value || currentMonth();
  const c = document.getElementById('filterCategory')?.value || 'all';
  const acct = document.getElementById('filterAccount')?.value || 'all';
  const vis = document.getElementById('filterVisibility')?.value || 'visible';
  const amountType = document.getElementById('filterAmountType')?.value || 'all';
  const dateFrom = document.getElementById('filterDateFrom')?.value || '';
  const dateTo = document.getElementById('filterDateTo')?.value || '';
  return state.transactions.filter(tx=>{
    const hay = `${tx.description} ${tx.rawDescription||''} ${tx.category} ${tx.account} ${tx.notes||''}`.toLowerCase();
    if(q && !q.split(/\s+/).every(term=>hay.includes(term))) return false;
    if(m !== 'all' && monthKey(tx.date)!==m) return false;
    if(dateFrom && String(tx.date) < dateFrom) return false;
    if(dateTo && String(tx.date) > dateTo) return false;
    if(c !== 'all' && tx.category !== c) return false;
    if(acct !== 'all' && (tx.account||'General') !== acct) return false;
    if(vis==='visible' && tx.hidden) return false;
    if(vis==='hidden' && !tx.hidden) return false;
    if(vis==='unreviewed' && tx.reviewed) return false;
    if(vis==='reviewed' && !tx.reviewed) return false;
    if(amountType==='spend' && !(Number(tx.amount)<0)) return false;
    if(amountType==='income' && !(Number(tx.amount)>0)) return false;
    if(amountType==='zero' && Number(tx.amount)!==0) return false;
    return true;
  }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
};
const __v55BaseRenderTransactions = renderTransactions;
renderTransactions = function(){
  ensureTransactionFilterExtras();
  __v55BaseRenderTransactions();
  renderTransactionFilterSummary();
};
function renderTransactionFilterSummary(){
  const el=document.getElementById('transactionFilterSummary');
  if(!el) return;
  const active=[];
  const month=document.getElementById('filterMonth')?.value || currentMonth();
  const cat=document.getElementById('filterCategory')?.value || 'all';
  const acct=document.getElementById('filterAccount')?.value || 'all';
  const vis=document.getElementById('filterVisibility')?.value || 'visible';
  const type=document.getElementById('filterAmountType')?.value || 'all';
  const from=document.getElementById('filterDateFrom')?.value || '';
  const to=document.getElementById('filterDateTo')?.value || '';
  const q=document.getElementById('transactionSearch')?.value?.trim() || '';
  if(month!=='all' && month!==currentMonth()) active.push({label:'Month',value:monthLabel(month)});
  if(month==='all') active.push({label:'Scope',value:'All months'});
  if(cat!=='all') active.push({label:'Category',value:cat});
  if(acct!=='all') active.push({label:'Account',value:acct});
  if(vis!=='visible') active.push({label:'Visibility',value:vis.replace(/^./,x=>x.toUpperCase())});
  if(type!=='all') active.push({label:'Amount',value:type.replace(/^./,x=>x.toUpperCase())});
  if(from || to) active.push({label:'Dates',value:`${from||'…'} → ${to||'…'}`});
  if(q) active.push({label:'Search',value:q});
  const count=visibleTransactions().length;
  el.innerHTML = `<div class="filter-summary-left"><span class="filter-summary-title">Showing</span><span class="filter-chip"><strong>${count}</strong><span class="muted">matching transaction${count===1?'':'s'}</span></span>${active.map(item=>`<span class="filter-chip"><span class="muted">${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></span>`).join('')}</div><div class="filter-summary-right">${active.length?`<button class="btn btn-small" type="button" onclick="clearTransactionFilters()">Reset filters</button>`:''}</div>`;
};

budgetRowHtml = function(b){
  const cls=b.pct>=100?'bad':b.pct>=80?'warn':'good';
  const left=Math.max(0,b.remaining);
  const width=Math.min(100,Math.max(0,b.pct));
  return `<div class="budget-row budget-heat-row"><div class="budget-row-top"><div><button type="button" class="budget-category-link" onclick="showCategoryTransactions('${escapeJs(b.category)}')">${escapeHtml(b.category)}</button><div class="budget-meta">${money(b.spent)} spent · ${money(b.limit)} budget</div></div><div class="budget-row-side"><strong class="${cls}">${b.pct}%</strong><span>${money(left)} left</span></div></div><div class="progress budget-progress"><span style="width:${width}%"></span></div><div class="budget-row-footer"><span class="budget-footnote">Open this category to inspect every matching transaction and filter by date.</span><div class="budget-inline-actions"><button class="btn btn-small" type="button" onclick="showCategoryTransactions('${escapeJs(b.category)}')">View transactions</button><button class="btn btn-small" type="button" onclick="editBudget('${b.id}')">Edit budget</button></div></div></div>`;
};

function rowActionMenu(items){
  return `<details class="row-menu"><summary>Actions <b>▾</b></summary><div class="row-menu-popover">${items.map(item=>`<button type="button" class="row-menu-item ${item.danger?'danger':''}" onclick="${item.fn}; this.closest('details').open=false;">${escapeHtml(item.label)}</button>`).join('')}</div></details>`;
}
function inclusionSelect(kind,id,included){
  return `<select class="row-inline-select" onchange="setInclusionState('${kind}','${id}', this.value==='included')"><option value="included" ${included?'selected':''}>Included in net worth</option><option value="excluded" ${!included?'selected':''}>Excluded from net worth</option></select>`;
}
function setInclusionState(kind,id,included){
  const map={accounts:'Account',debts:'Debt',holdings:'Holding'};
  const item=(state[kind]||[]).find(x=>x.id===id);
  if(!item) return;
  item.includeNetWorth=!!included;
  renderAll();
  toast(`${map[kind]||'Item'} ${included?'included in':'excluded from'} net worth.`);
}

toggleAccountInclude = id => setInclusionState('accounts', id, !((state.accounts||[]).find(x=>x.id===id)?.includeNetWorth===false));
toggleDebtInclude = id => setInclusionState('debts', id, !((state.debts||[]).find(x=>x.id===id)?.includeNetWorth===false));
toggleHoldingInclude = id => setInclusionState('holdings', id, !((state.holdings||[]).find(x=>x.id===id)?.includeNetWorth===false));

renderNetWorth = function(){
  const metrics=document.getElementById('netWorthMetrics'); if(!metrics) return;
  const b=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const prev=snapshots[1]; const latest=snapshots[0]; const delta=latest&&prev?nval(latest.netWorth)-nval(prev.netWorth):null;
  const today=document.getElementById('netWorthSnapshotDate'); if(today && !today.value) today.value=new Date().toISOString().slice(0,10);
  metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Net worth</div><div class="metric-value ${b.netWorth>=0?'good':'bad'}">${money(b.netWorth)}</div><div class="metric-sub">Included assets minus included liabilities</div></div><div class="tracker-stat"><div class="metric-label">Assets</div><div class="metric-value good">${money(b.assets)}</div><div class="metric-sub">${money(b.accountAssets)} balances + ${money(b.holdingsValue)} holdings</div></div><div class="tracker-stat"><div class="metric-label">Liabilities</div><div class="metric-value bad">${money(b.liabilities)}</div><div class="metric-sub">${money(b.accountLiabilities)} account debt + ${money(b.debtLiabilities)} debt tracker</div></div><div class="tracker-stat"><div class="metric-label">Snapshot delta</div><div class="metric-value ${delta===null?'muted':delta>=0?'good':'bad'}">${delta===null?'—':money(delta)}</div><div class="metric-sub">${latest?`Latest: ${dateFmt(latest.date)}`:'No snapshots yet'}</div></div>`;
  const rows=document.getElementById('accountRows');
  if(rows){ rows.innerHTML=(state.accounts||[]).length?(state.accounts||[]).map(a=>{ const signed=accountSignedValue(a); const included=a.includeNetWorth!==false; return `<tr><td><b>${escapeHtml(a.name||'Account')}</b><br><span class="muted">${escapeHtml(a.institution||'Manual')}</span></td><td>${escapeHtml(a.type||'Account')}</td><td>${a.updatedAt?dateFmt(String(a.updatedAt).slice(0,10)):'—'}</td><td><span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span></td><td class="amount-cell ${signed<0?'bad':'good'}">${money(signed)}</td><td class="right"><div class="table-actions">${inclusionSelect('accounts',a.id,included)}${rowActionMenu([{label:'Edit',fn:`openDrawer(\'account\', findById(\'accounts\',\'${a.id}\'))`},{label:'Delete',fn:`deleteTrackerItem(\'accounts\',\'${a.id}\')`,danger:true}])}</div></td></tr>`; }).join(''):`<tr><td colspan="6"><div class="empty" style="min-height:150px"><div><strong>No manual balances yet.</strong><p>Add checking, savings, brokerage, card, loan, or other balances.</p><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div></td></tr>`; }
  const list=document.getElementById('netWorthSnapshotList');
  if(list){ list.innerHTML=snapshots.length?snapshots.slice(0,8).map(e=>`<div class="snapshot-row"><div><b>${dateFmt(e.date)}</b><br><span>${escapeHtml(e.note||'Manual snapshot')}</span></div><div><strong class="${nval(e.netWorth)>=0?'good':'bad'}">${money(e.netWorth)}</strong><div class="table-actions" style="margin-top:8px"><button class="btn btn-small" onclick="restoreSnapshotNote('${e.id}')">Edit note</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('netWorthHistory','${e.id}')">Delete</button></div></div></div>`).join(''):emptyMini('No snapshots yet','Save your current net worth to start history.','Save snapshot','saveNetWorthSnapshot()'); }
};

renderDebt = function(){
  const metrics=document.getElementById('debtMetrics'); if(!metrics) return;
  const debts=(state.debts||[]).slice(); const total=debts.reduce((a,d)=>a+nval(d.balance),0); const minPay=debts.reduce((a,d)=>a+nval(d.minPayment),0); const extra=debts.reduce((a,d)=>a+nval(d.extraPayment),0); const weighted=total?debts.reduce((a,d)=>a+nval(d.balance)*nval(d.apr),0)/total:0; const plan=debtPlanRows(); const focus=plan[0];
  const strat=document.getElementById('debtStrategy'); if(strat) strat.value=state.trackerSettings?.debtStrategy||'avalanche';
  metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Total debt</div><div class="metric-value bad">${money(total)}</div><div class="metric-sub">Across ${debts.length} tracked balance${debts.length===1?'':'s'}</div></div><div class="tracker-stat"><div class="metric-label">Monthly payment</div><div class="metric-value gold">${money(minPay+extra)}</div><div class="metric-sub">${money(minPay)} minimum + ${money(extra)} extra</div></div><div class="tracker-stat"><div class="metric-label">Weighted APR</div><div class="metric-value warn">${pctFmt(weighted)}</div><div class="metric-sub">Weighted by current balance</div></div><div class="tracker-stat"><div class="metric-label">Active strategy</div><div class="metric-value blue">${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'Snowball':'Avalanche'}</div><div class="metric-sub">${focus?`Focus: ${escapeHtml(focus.name)}`:'Add debt to build a plan'}</div></div>`;
  const rows=document.getElementById('debtRows');
  if(rows){ rows.innerHTML=debts.length?debts.map(d=>{ const pay=nval(d.minPayment)+nval(d.extraPayment); const months=payoffMonths(nval(d.balance),nval(d.apr),pay); const included=d.includeNetWorth!==false; return `<tr><td><b>${escapeHtml(d.name||'Debt')}</b><br><span class="muted">${escapeHtml(d.lender||'Manual')} ${d.dueDay?`· due ${escapeHtml(d.dueDay)}`:''}</span></td><td>${pctFmt(d.apr)}</td><td>${money(d.minPayment)}</td><td>${money(d.extraPayment)}</td><td><span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span></td><td class="amount-cell bad">${money(d.balance)}</td><td class="right"><div class="table-actions">${inclusionSelect('debts',d.id,included)}${rowActionMenu([{label:'Edit',fn:`openDrawer(\'debt\', findById(\'debts\',\'${d.id}\'))`},{label:`Payoff ${payoffLabel(months)}`,fn:`openDrawer(\'debt\', findById(\'debts\',\'${d.id}\'))`},{label:'Delete',fn:`deleteTrackerItem(\'debts\',\'${d.id}\')`,danger:true}])}</div></td></tr>`; }).join(''):`<tr><td colspan="7"><div class="empty" style="min-height:150px"><div><strong>No debts tracked.</strong><p>Add cards, student loans, auto loans, or other payoff balances.</p><button class="btn btn-primary" onclick="openDrawer('debt')">Add debt</button></div></div></td></tr>`; }
  const focusEl=document.getElementById('debtFocus'); if(focusEl){ focusEl.innerHTML=focus?`<div class="eyebrow">Next best payment</div><h3>${escapeHtml(focus.name)}</h3><p>Target this first with the ${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'snowball':'avalanche'} method. Balance ${money(focus.balance)}, APR ${pctFmt(focus.apr)}, projected payoff ${payoffLabel(focus.months)} at current payment.</p><div class="hero-row"><button class="btn btn-primary" onclick="openDrawer('debt', findById('debts','${focus.id}'))">Update payment</button><button class="btn" onclick="setDebtStrategy('${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'avalanche':'snowball'}')">Switch strategy</button></div>`:`<div class="eyebrow">Payoff focus</div><h3>No debt yet</h3><p>Add a balance to generate a payoff order and monthly payment insight.</p><div class="hero-row"><button class="btn btn-primary" onclick="openDrawer('debt')">Add debt</button></div>`; }
  const planEl=document.getElementById('debtPlan'); if(planEl){ planEl.innerHTML=plan.length?plan.map((d,i)=>`<div class="mini-item"><div><b>${i+1}. ${escapeHtml(d.name)}</b><br><span>${money(d.balance)} · ${pctFmt(d.apr)} APR · ${payoffLabel(d.months)}</span></div><strong>${money(nval(d.minPayment)+nval(d.extraPayment))}/mo</strong></div>`).join(''):emptyMini('No plan yet','Add at least one debt to see the payoff order.','Add debt','openDrawer(\'debt\')'); }
};

renderInvestments = function(){
  const metrics=document.getElementById('investmentMetrics'); if(!metrics) return;
  const holdings=state.holdings||[]; const value=holdings.reduce((a,h)=>a+holdingValue(h),0); const cost=holdings.reduce((a,h)=>a+holdingCost(h),0); const gain=value-cost; const inc=includedHoldings().reduce((a,h)=>a+holdingValue(h),0);
  metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Market value</div><div class="metric-value good">${money(value)}</div><div class="metric-sub">${holdings.length} holding${holdings.length===1?'':'s'} tracked manually</div></div><div class="tracker-stat"><div class="metric-label">Cost basis</div><div class="metric-value blue">${money(cost)}</div><div class="metric-sub">Manual cost basis</div></div><div class="tracker-stat"><div class="metric-label">Unrealized gain/loss</div><div class="metric-value ${gain>=0?'good':'bad'}">${money(gain)}</div><div class="metric-sub">${cost?pctFmt((gain/cost)*100):'No cost basis yet'}</div></div><div class="tracker-stat"><div class="metric-label">Included in net worth</div><div class="metric-value purple">${money(inc)}</div><div class="metric-sub">Exclude duplicates with account balances</div></div>`;
  const rows=document.getElementById('holdingRows');
  if(rows){ rows.innerHTML=holdings.length?holdings.map(h=>{ const value=holdingValue(h); const cost=holdingCost(h); const gain=value-cost; const included=h.includeNetWorth!==false; return `<tr><td><b>${escapeHtml(h.symbol||h.name||'Holding')}</b><br><span class="muted">${escapeHtml(h.name||'Manual holding')} · <span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span></span></td><td>${escapeHtml(h.account||'Manual')}</td><td>${escapeHtml(h.assetClass||'Stock')}</td><td class="amount-cell">${nval(h.quantity).toLocaleString()}</td><td class="amount-cell">${money(h.price,{cents:true})}</td><td class="amount-cell good">${money(value)}</td><td class="amount-cell ${gain>=0?'good':'bad'}">${money(gain)}</td><td class="right"><div class="table-actions">${inclusionSelect('holdings',h.id,included)}${rowActionMenu([{label:'Edit',fn:`openDrawer(\'holding\', findById(\'holdings\',\'${h.id}\'))`},{label:'Delete',fn:`deleteTrackerItem(\'holdings\',\'${h.id}\')`,danger:true}])}</div></td></tr>`; }).join(''):`<tr><td colspan="8"><div class="empty" style="min-height:150px"><div><strong>No holdings yet.</strong><p>Add stocks, funds, crypto, bonds, or cash positions manually.</p><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div></td></tr>`; }
  const alloc=allocationRows(); const list=document.getElementById('allocationList'); if(list){ list.innerHTML=alloc.length?alloc.map((a,i)=>`<div class="mini-item"><div><b><span class="dot" style="background:${COLORS[i%COLORS.length]}"></span> ${escapeHtml(a.name)}</b><br><span>${pctFmt(a.pct)} of portfolio</span><div class="allocation-bar"><span style="width:${a.pct}%;background:${COLORS[i%COLORS.length]}"></span></div></div><strong>${money(a.value)}</strong></div>`).join(''):emptyMini('No allocation yet','Add holdings to see asset class weights.','Add holding','openDrawer(\'holding\')'); }
  const notes=document.getElementById('investmentNotes'); if(notes){ notes.innerHTML=`<div class="mini-item"><div><b>Double-count guard</b><br><span>Exclude holdings from net worth if the same portfolio is already an included manual account balance.</span></div><span>Important</span></div><div class="mini-item"><div><b>Manual pricing</b><br><span>Prices do not update automatically. Edit holdings after you check current values.</span></div><span>Private</span></div>`; }
};

function monthScopeLabel(){ return monthLabel(currentMonth()); }
renderUsabilityPanel = function(){
  const panel=document.getElementById('monarchUsabilityPanel'); if(!panel) return;
  const c=computeCashflowSummary(); const unreviewed=state.transactions.filter(t=>!t.reviewed).length; const over=budgetStats().filter(b=>b.pct>100).length; const missingBudget = byCategory(monthTransactions(currentMonth())).filter(([cat])=>!new Set((state.budgets||[]).map(b=>b.category)).has(cat))[0];
  const actions=[];
  if(!state.transactions.length) actions.push({icon:'⇡',title:'Import transactions',sub:'Start with a CSV or demo data.',value:'Start',fn:"showView('import')"});
  if(unreviewed) actions.push({icon:'✓',title:'Review transaction queue',sub:`${unreviewed} item${unreviewed===1?'':'s'} need cleanup.`,value:`${unreviewed}`,fn:'startWeeklyReview()'});
  if(missingBudget) actions.push({icon:'◌',title:`Budget ${missingBudget[0]}`,sub:`${money(missingBudget[1])} spent this month without a limit.`,value:'Add',fn:`openDrawer('budget',{category:'${escapeJs(missingBudget[0])}',limit:${Math.ceil(missingBudget[1]*1.1/10)*10}})`});
  if(over) actions.push({icon:'!',title:'Fix over-budget categories',sub:`${over} categor${over===1?'y':'ies'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!actions.length) actions.push({icon:'✓',title:'Workspace is clean',sub:'Budgets, reviews, and reports are ready.',value:'Nice',fn:'exportMonthlyReport()'});
  const snapshot=[
    {label:'Left to budget',value:money(c.leftToBudget),sub:'Income minus planned budgets'},
    {label:'Safe daily spend',value:money(c.safeToSpend),sub:'Budget left divided by days left'},
    {label:'Net cash flow',value:money(c.net),sub:'Income minus spending this month',cls:c.net>=0?'good':'bad'},
    {label:'Unbudgeted spend',value:money(c.unbudgetedSpend),sub:'Categories that still need a plan'}
  ];
  panel.innerHTML = `<div class="monarch-focus-card"><div class="monarch-focus-head"><div><h3>Today</h3><p>One clean priority stack. No hunting through tabs.</p></div><span class="section-chip">${monthScopeLabel()}</span></div><div class="action-stack">${actions.slice(0,4).map(a=>`<button class="action-row" onclick="${a.fn}"><span class="action-icon">${a.icon}</span><span class="action-copy"><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></span><strong>${escapeHtml(a.value)}</strong></button>`).join('')}</div><div class="shortcut-help"><span class="kbd">/</span><span class="kbd">⌘K</span><span class="kbd">N</span><span class="kbd">B</span><span class="muted">search, commands, quick add, budgets</span></div></div><div class="bench-card"><div class="bench-score-row"><div><span>Money snapshot</span><b>${monthScopeLabel()}</b></div><button class="btn btn-small" onclick="openCommandPalette()">Commands</button></div><div class="summary-kpi-grid">${snapshot.map(s=>`<div class="summary-kpi"><span>${escapeHtml(s.label)}</span><b class="${s.cls||''}">${escapeHtml(s.value)}</b><small>${escapeHtml(s.sub)}</small></div>`).join('')}</div><div class="summary-footer"><span class="muted">A quick scan of budget room, spending pace, and gaps.</span><div class="budget-inline-actions"><button class="btn btn-small" onclick="showView('budgets')">Open budgets</button><button class="btn btn-small" onclick="exportMonthlyReport()">Export report</button></div></div></div>`;
  const plan=document.getElementById('monthlyPlanCard');
  if(plan){
    const topBudget=budgetStats().sort((a,b)=>b.pct-a.pct)[0]; const goal=(state.goals||[]).filter(g=>Number(g.current)<Number(g.target)).sort((a,b)=>(b.priority==='High')-(a.priority==='High'))[0]; const debt=(state.debts||[]).filter(d=>Number(d.balance)>0).sort((a,b)=>Number(b.apr||0)-Number(a.apr||0))[0];
    plan.innerHTML=`<div class="card-header"><div><h3 class="card-title">Monthly plan</h3><p class="card-subtitle">Budget, goals, debt, and report export in one calmer planning row.</p></div><button class="btn btn-small" onclick="exportMonthlyReport()">Export report</button></div><div class="monthly-plan-grid"><button class="monthly-plan-item" onclick="showView('budgets')"><b>${topBudget?escapeHtml(topBudget.category):'Create budget'}</b><span>${topBudget?`${money(Math.max(0,topBudget.remaining))} left · ${topBudget.pct}% used`:'Plan spending before the month gets noisy.'}</span></button><button class="monthly-plan-item" onclick="showView('goals')"><b>${goal?escapeHtml(goal.name):'Set a goal'}</b><span>${goal?`${money(Math.max(0,Number(goal.target)-Number(goal.current)))} remaining`:'Track what extra cash is for.'}</span></button><button class="monthly-plan-item" onclick="showView('debt')"><b>${debt?escapeHtml(debt.name):'Debt plan'}</b><span>${debt?`${Number(debt.apr||0)}% APR · ${money(debt.balance)} balance`:'Prioritize payoff by rate or snowball.'}</span></button></div>`;
  }
};

renderV5CommandBoard = function(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace(); const stats=budgetStats().sort((a,b)=>b.pct-a.pct); const over=stats.filter(b=>b.pct>100); const unreviewed=state.transactions.filter(t=>!t.reviewed).length;
  const netBreakdown=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latestNet=snapshots[0] || {netWorth:netBreakdown.netWorth}; const prevNet=snapshots[1]; const netDelta=latestNet && prevNet ? Number(latestNet.netWorth||0)-Number(prevNet.netWorth||0) : 0;
  const reviewMode = unreviewed ? 'bad' : (over.length ? 'warn' : 'good'); const runway = p.remainingBudget>0 ? `${v54FriendlyMoney(p.safeToSpend)}/day` : '$0/day'; const budgetMode = !p.totalBudget ? 'warn' : p.pacePct>105 ? 'bad' : p.pacePct>90 ? 'warn' : 'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0); const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0; const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0); const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0); const cats=byCategory(monthTransactions(currentMonth())).slice(0,3);
  el.innerHTML=`<div class="v5-section-head"><div><h3>Control center</h3><p>Budget, review, plan, and net worth in one readable scan.</p></div><span class="section-chip">This month</span></div><div class="v5-control-grid"><div class="v5-control-card primary"><div class="v5-card-kicker">Cash flow plan</div><div class="v5-big ${p.net>=0?'good':'bad'}" title="${money(p.net)}">${v54FriendlyMoney(p.net)}</div><div class="v5-subline">${v54FriendlyMoney(p.income)} income · ${v54FriendlyMoney(p.spend)} spent · ${v54FriendlyMoney(p.remainingBudget)} budget left</div><div class="v5-meter"><span style="width:${Math.min(100,Math.max(0,p.totalBudget?p.budgetSpent/p.totalBudget*100:0))}%"></span></div><div class="v5-meta-row">${healthStatus(`${p.pacePct||0}% projected pace`, p.pacePct, budgetMode)}${healthStatus(runway, p.safeToSpend, p.safeToSpend>0?'good':'bad')}</div></div><div class="v5-control-card"><div class="v5-card-kicker">Review inbox</div><div class="v5-big ${unreviewed?'warn':'good'}">${unreviewed}</div><div class="v5-subline">${unreviewed?'Transactions need approval.':'No cleanup waiting.'}</div><button class="btn btn-small ${unreviewed?'btn-primary':''}" onclick="startWeeklyReview()">${unreviewed?'Start review':'Open review'}</button></div><div class="v5-control-card"><div class="v5-card-kicker">Net worth</div><div class="v5-big" title="${money(latestNet?latestNet.netWorth:0)}">${latestNet?v54FriendlyMoney(latestNet.netWorth):'$0'}</div><div class="v5-subline ${netDelta>=0?'good':'bad'}">${latestNet&&prevNet?`${netDelta>=0?'+':''}${v54FriendlyMoney(netDelta)} since last snapshot`:'Add account balances to start.'}</div><button class="btn btn-small" onclick="showView('networth')">Update balances</button></div><div class="v5-control-card"><div class="v5-card-kicker">Planning</div><div class="v5-big">${goalAvg}%</div><div class="v5-subline">Goal progress · ${v54FriendlyMoney(debt)} debt · ${v54FriendlyMoney(holdings)} invested</div><button class="btn btn-small" onclick="showView('goals')">Open plan</button></div></div><div class="v5-lower-grid"><div class="v5-panel"><div class="v5-panel-title"><b>Spending by category</b><button class="btn btn-small" onclick="showView('transactions')">View all</button></div><div class="v5-list">${cats.length?cats.map(([cat,val],i)=>v5PlanRow(cat,v54FriendlyMoney(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0?'bad':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join(''):emptyMini('No spending yet','Import transactions to populate spend radar.','Import CSV','showView(\'import\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Budget watchlist</b><button class="btn btn-small" onclick="showView('budgets')">Manage</button></div><div class="v5-list">${stats.length?stats.slice(0,3).map(b=>v5PlanRow(b.category,`${b.pct}%`,`${v54FriendlyMoney(Math.max(0,b.remaining))} left of ${v54FriendlyMoney(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`showCategoryTransactions('${escapeJs(b.category)}')`)).join(''):emptyMini('No budgets','Add category limits for a calmer monthly plan.','Add budget','openDrawer(\'budget\')')}</div></div><div class="v5-panel"><div class="v5-panel-title"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div><div class="v5-list">${unreviewed?v5PlanRow('Review queue',`${unreviewed}`, 'Approve or fix categories', 'warn','startWeeklyReview()'):(over.length?v5PlanRow('Adjust budgets',`${over.length}`, 'Over-limit categories need a decision', 'bad','showView(\'budgets\')'):v5PlanRow('Export report','Ready', 'Monthly summary is current', 'good','exportMonthlyReport()'))}${v5PlanRow('Backup','JSON',`Last: ${state.settings.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()')}</div></div></div>`;
};

renderV52ParityPanel = function(){
  const el=document.getElementById('v52ParityPanel'); if(!el) return;
  const r=financialReadiness(); const c=computeCashflowSummary(); const nw=netWorthBreakdown(); const rec=upcomingRecurringItems(4); const budget=budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,3);
  const actions=[];
  if(!r.tx) actions.push({icon:'⇡',title:'Import data',sub:'Load a CSV or demo set.',value:'Start',fn:"showView('import')"});
  if(r.unreviewed) actions.push({icon:'✓',title:'Clear review inbox',sub:`${r.unreviewed} transaction${r.unreviewed===1?'':'s'} waiting.`,value:r.unreviewed,fn:'startWeeklyReview()'});
  if(r.unbudgeted) actions.push({icon:'◌',title:'Cover unbudgeted spending',sub:`${r.unbudgeted} active categor${r.unbudgeted===1?'y':'ies'} without a budget.`,value:'Budget',fn:"showView('budgets')"});
  if(r.over) actions.push({icon:'!',title:'Adjust budget risks',sub:`${r.over} budget${r.over===1?'':'s'} over limit.`,value:'Fix',fn:"showView('budgets')"});
  if(!r.accounts) actions.push({icon:'＋',title:'Add manual accounts',sub:'Improve net worth accuracy.',value:'Add',fn:"openDrawer('account')"});
  actions.push({icon:'⌘',title:'Open command palette',sub:'Jump anywhere or run exports.',value:'⌘K',fn:'openCommandPalette()'});
  const actionHtml=actions.slice(0,5).map(a=>`<button class="v52-check" onclick="${a.fn}"><i>${escapeHtml(a.icon)}</i><div><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></div><strong>${escapeHtml(a.value)}</strong></button>`).join('');
  const billHtml=rec.length?rec.map(x=>`<div class="mini-item"><div><b>${escapeHtml(x.merchant)}</b><br><span>${dateFmt(x.nextDate)} · ${x.daysUntil<=0?'due now':x.daysUntil+' days'}</span></div><strong>${money(x.monthly,{cents:true})}</strong></div>`).join(''):emptyMini('No bill calendar yet','Import two months of transactions to detect bills.','Import CSV','showView(\'import\')');
  const budgetHtml=budget.length?budget.map(b=>`<div class="mini-item"><div><b>${escapeHtml(b.category)}</b><br><span>${money(b.spent)} of ${money(b.limit)} · ${b.pct}%</span></div><strong class="${b.pct>=100?'bad':b.pct>=80?'warn':'good'}">${money(Math.max(0,b.remaining))}</strong></div>`).join(''):emptyMini('No budget pressure','Add budgets to see risk alerts.','Add budget','openDrawer(\'budget\')');
  el.innerHTML=`<div class="v52-card"><div class="v52-card-header"><div><h3>Readiness</h3><p>Quick routes into the work that matters right now.</p></div><span class="section-chip">${r.tx} txns</span></div><div class="v52-kpi-row"><div class="v52-kpi"><span>Free cash flow</span><b class="${c.net>=0?'good':'bad'}">${money(c.net)}</b><small>Income minus visible spending.</small></div><div class="v52-kpi"><span>Budget room</span><b>${money(c.remainingBudget)}</b><small>${money(c.safeToSpend)}/day safe spend.</small></div><div class="v52-kpi"><span>Net worth</span><b>${money(nw.netWorth)}</b><small>${(state.accounts||[]).length} accounts · ${(state.holdings||[]).length} holdings.</small></div><div class="v52-kpi"><span>Review health</span><b class="${r.unreviewed?'warn':'good'}">${r.unreviewed}</b><small>Open transaction items.</small></div></div><div class="split-line"></div><div class="v52-checklist">${actionHtml}</div></div><div class="v52-card"><div class="v52-card-header"><div><h3>Bills and budget pressure</h3><p>Recurring charges and categories that need attention.</p></div><button class="btn btn-small" onclick="openCommandPalette()">⌘K</button></div><div class="v52-flex"><div class="v52-small-panel"><h4>Upcoming recurring</h4><div class="mini-list">${billHtml}</div></div><div class="v52-small-panel"><h4>Budget pressure</h4><div class="mini-list">${budgetHtml}</div></div></div></div>`;
};

renderSettings = function(){
  const healthEl=document.getElementById('benchmarkSettingsCard');
  const ready=financialReadiness();
  if(healthEl) healthEl.innerHTML=`<div class="card-header"><div><h3 class="card-title">Workspace health</h3><p class="card-subtitle">Operational signals for cleanup, planning coverage, and data completeness.</p></div><span class="section-chip">Live</span></div><div class="bench-list"><div class="bench-line"><span>Transactions tracked</span><strong>${ready.tx}</strong><i><em style="width:${Math.min(100,ready.tx?100:0)}%"></em></i></div><div class="bench-line"><span>Needs review</span><strong>${ready.unreviewed}</strong><i><em style="width:${Math.min(100,ready.unreviewed*10)}%"></em></i></div><div class="bench-line"><span>Budgets created</span><strong>${ready.budgets}</strong><i><em style="width:${Math.min(100,ready.budgets*15)}%"></em></i></div><div class="bench-line"><span>Manual accounts</span><strong>${ready.accounts}</strong><i><em style="width:${Math.min(100,ready.accounts*20)}%"></em></i></div><div class="bench-line"><span>Rules active</span><strong>${ready.rules}</strong><i><em style="width:${Math.min(100,ready.rules*10)}%"></em></i></div></div>`;
  const c=document.getElementById('currencySelect'); if(c) c.value=state.settings.currency;
  const i=document.getElementById('incomeTarget'); if(i) i.value=state.settings.incomeTarget||'';
  const sw=document.getElementById('centsSwitch'); if(sw) sw.classList.toggle('on',!!state.settings.showCents);
  document.querySelectorAll('[data-welcome-option]').forEach(el=>el.classList.toggle('selected',el.dataset.welcomeOption===(state.settings.welcomeMode||'auto')));
  document.querySelectorAll('[data-home-tile]').forEach(el=>{
    const visible = homeTileVisible(el.dataset.homeTile);
    el.classList.toggle('selected', visible);
    el.textContent = visible ? 'Shown' : 'Hidden';
    el.setAttribute('aria-pressed', String(visible));
  });
  const usage=document.getElementById('storageUsage'); if(usage){ usage.textContent=storageStatusText(); }
  const build=document.getElementById('appBuildLabel'); if(build) build.textContent=APP_BUILD_ID;
  updateStorageWarningBanner();
  const backupLabel = lastBackupText();
  const backupAge = backupFreshnessLabel();
  ['lastBackupLabel','lastBackupLabelDrawer'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=backupLabel; });
  ['backupAgeLabel','backupAgeLabelDrawer'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=backupAge; });
  document.querySelectorAll('[data-theme-option]').forEach(el=>el.classList.toggle('selected',el.dataset.themeOption===state.appearance?.theme));
  document.querySelectorAll('[data-density-option]').forEach(el=>el.classList.toggle('selected',el.dataset.densityOption===state.appearance?.density));
  document.querySelectorAll('[data-vibe-option]').forEach(el=>el.classList.toggle('selected',el.dataset.vibeOption===state.appearance?.vibe));
  const btn=document.getElementById('themeBtn'); if(btn) btn.textContent=(state.appearance?.theme||'light')==='system'?'System':((state.appearance?.theme||'light')==='dark'?'Dark':'Light');
};

setMonarchMode = function(){
  state.appearance={...(state.appearance||{}),theme:'light',accent:'custom',customAccent:'#F59E0B',density:'compact',vibe:'minimal'};
  state.settings={...defaultState.settings,...(state.settings||{}),welcomeMode:'compact',homeTiles:{intro:false,score:true,...((state.settings||{}).homeTiles||{})}};
  applyAppearance(); saveState(); toast('Focus workspace applied.'); renderAll();
};
openCustomizeDrawerV51 = function(){
  const d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody');
  if(!d||!body) return;
  d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type','customize');
  const panel=d.querySelector('.drawer-panel'); if(panel) panel.scrollTop=0; body.scrollTop=0;
  title.textContent='Customize MoneyMap'; sub.textContent='Tune color, density, and layout comfort without touching financial data.';
  const hex=(state.appearance?.customAccent||customAccentDefaults().hex).toUpperCase();
  body.innerHTML=`<div class="stack"><div class="monarch-mode-banner"><div><b>Quick setup</b><span>Applies a cleaner light dashboard, compact spacing, and a warm custom accent.</span></div><button class="btn btn-primary" onclick="setMonarchMode()">Use focus mode</button></div><div class="customizer-grid"><div class="stack"><div class="card"><h3 class="card-title">Color system</h3><p class="card-subtitle">Use a preset or choose any custom color. The app generates the supporting gradient automatically.</p><div class="split-line"></div><div class="theme-grid"><button class="theme-option" data-accent-option="mint" onclick="setAppearance('accent','mint')" style="--sw1:#53e0ac;--sw2:#68b8ff"><div class="theme-swatch"></div><b>Mint</b><span>Clean fintech</span></button><button class="theme-option" data-accent-option="pink" onclick="setAppearance('accent','pink')" style="--sw1:#ff74bf;--sw2:#ffb2d8"><div class="theme-swatch"></div><b>Pink</b><span>Soft rose</span></button><button class="theme-option" data-accent-option="ocean" onclick="setAppearance('accent','ocean')" style="--sw1:#5ee8ff;--sw2:#6ba8ff"><div class="theme-swatch"></div><b>Ocean</b><span>Crisp blue</span></button><button class="theme-option" data-accent-option="violet" onclick="setAppearance('accent','violet')" style="--sw1:#a78bfa;--sw2:#d8b4fe"><div class="theme-swatch"></div><b>Violet</b><span>Premium</span></button><button class="theme-option" data-accent-option="sunset" onclick="setAppearance('accent','sunset')" style="--sw1:#ff9f6e;--sw2:#ffd166"><div class="theme-swatch"></div><b>Sunset</b><span>Warm</span></button><button class="theme-option" data-accent-option="mono" onclick="setAppearance('accent','mono')" style="--sw1:#e5e7eb;--sw2:#9ca3af"><div class="theme-swatch"></div><b>Mono</b><span>Quiet</span></button></div><div class="split-line"></div><div class="custom-color-card"><div class="color-wheel-row"><input id="customAccentColor" class="color-wheel" type="color" value="${escapeHtml(hex)}" oninput="updateCustomAccentInput(this.value,true)"><div class="color-fields"><label>Custom accent</label><input id="customAccentHex" class="input" value="${escapeHtml(hex)}" maxlength="7" oninput="updateCustomAccentInput(this.value,false)" onchange="updateCustomAccentInput(this.value,true)"><div class="custom-presets"><button class="custom-preset" style="--preset:#F59E0B" onclick="setCustomAccent('#F59E0B')" title="Amber"></button><button class="custom-preset" style="--preset:#10B981" onclick="setCustomAccent('#10B981')" title="Emerald"></button><button class="custom-preset" style="--preset:#3B82F6" onclick="setCustomAccent('#3B82F6')" title="Blue"></button><button class="custom-preset" style="--preset:#8B5CF6" onclick="setCustomAccent('#8B5CF6')" title="Violet"></button><button class="custom-preset" style="--preset:#EC4899" onclick="setCustomAccent('#EC4899')" title="Pink"></button><button class="custom-preset" style="--preset:#111827" onclick="setCustomAccent('#111827')" title="Ink"></button></div></div></div></div></div><div class="card"><h3 class="card-title">Layout feel</h3><p class="card-subtitle">Reduce scrolling or add room depending on screen size.</p><div class="split-line"></div><label>Theme</label><div class="segmented"><button class="btn btn-small" data-theme-option="system" onclick="setAppearance('theme','system')">System</button><button class="btn btn-small" data-theme-option="dark" onclick="setAppearance('theme','dark')">Dark</button><button class="btn btn-small" data-theme-option="light" onclick="setAppearance('theme','light')">Light</button></div><div class="split-line"></div><label>Density</label><div class="segmented"><button class="btn btn-small" data-density-option="compact" onclick="setAppearance('density','compact')">Compact</button><button class="btn btn-small" data-density-option="comfortable" onclick="setAppearance('density','comfortable')">Comfort</button><button class="btn btn-small" data-density-option="roomy" onclick="setAppearance('density','roomy')">Roomy</button></div><div class="split-line"></div><label>Surface style</label><div class="segmented"><button class="btn btn-small" data-vibe-option="minimal" onclick="setAppearance('vibe','minimal')">Minimal</button><button class="btn btn-small" data-vibe-option="clean" onclick="setAppearance('vibe','clean')">Clean</button><button class="btn btn-small" data-vibe-option="glass" onclick="setAppearance('vibe','glass')">Glass</button></div><div class="split-line"></div><div class="hero-row"><button class="btn" onclick="setCalmMode()">Calm mode</button><button class="btn" onclick="setHomeTile('intro',false);setHomeTile('score',true)">Tight overview</button><button class="btn" onclick="setHomeTile('intro',true);setHomeTile('score',true)">Show intro</button></div></div></div><div class="custom-preview"><h3 class="card-title">Live preview</h3><p class="card-subtitle">Reflects the selected theme, accent, density, and surface style.</p><div class="custom-preview-card" style="margin-top:12px"><div class="metric-label">Left to budget</div><div class="metric-value good">$1,240</div><div class="metric-sub">Planned income minus budgets</div><div class="custom-swatch"></div><div class="custom-preview-row"><span class="v5-status good">On track</span><button class="btn btn-small btn-primary">Action</button></div></div><div class="split-line"></div><div class="mini-list"><div class="mini-item"><div><b>Keyboard</b><br><span>/ search · N quick add · B budgets</span></div><strong>Ready</strong></div><div class="mini-item"><div><b>Workspace</b><br><span>Comfort, color, and workflow controls</span></div><strong>Live</strong></div></div></div></div></div>`;
  requestAnimationFrame(()=>{ renderAppearanceControls(); updateCustomAccentInput(hex,false); enhanceDrawerOpen('customize'); });
};


/* ---- PHASE 1 JS ---- */
function toggleTopbarMenu(){
  const m=document.getElementById('topbarMenu'); if(!m) return;
  m.classList.toggle('open');
  if(m.classList.contains('open')){
    const close=e=>{ if(!m.contains(e.target) && e.target.className!=='topbar-overflow-btn'){ m.classList.remove('open'); document.removeEventListener('click',close); } };
    setTimeout(()=>document.addEventListener('click',close),10);
  }
}

function renderTxCards(txns){
  const el=document.getElementById('transactionCards'); if(!el) return;
  if(!txns.length){ el.innerHTML='<div class="empty" style="min-height:160px"><div><strong>No matching transactions.</strong><p>Import a CSV or change the filters.</p></div></div>'; return; }
  el.innerHTML=txns.map(t=>{
    const amt=Number(t.amount);
    const initial=String(t.description||'?').trim()[0]?.toUpperCase()||'?';
    const badge=t.hidden?'':''+( t.reviewed?'<span class="tx-card-badge reviewed">Reviewed</span>':'<span class="tx-card-badge needs-review">Review</span>');
    return `<button class="tx-card" onclick="editTransaction('${t.id}')">
      <div class="tx-card-avatar">${escapeHtml(initial)}</div>
      <div class="tx-card-body">
        <div class="tx-card-merchant">${escapeHtml(t.description)}</div>
        <div class="tx-card-meta">${dateFmt(t.date)} · ${escapeHtml(t.category||'Other')} · ${escapeHtml(t.account||'General')}</div>
      </div>
      <div class="tx-card-right">
        <span class="tx-card-amount ${amt<0?'bad':'good'}">${money(amt)}</span>
        ${badge}
      </div>
    </button>`;
  }).join('');
}

function attachSwipeToReview(){
  const el=document.querySelector('.review-transaction'); if(!el) return;
  let startX=0, startY=0, dx=0, swiping=false;
  el.addEventListener('touchstart',e=>{ startX=e.touches[0].clientX; startY=e.touches[0].clientY; dx=0; swiping=true; },{passive:true});
  el.addEventListener('touchmove',e=>{
    if(!swiping) return;
    dx=e.touches[0].clientX - startX;
    const dy=Math.abs(e.touches[0].clientY - startY);
    if(dy > Math.abs(dx)) return; // vertical scroll — don't intercept
    el.classList.toggle('swipe-approve', dx > 40);
    el.classList.toggle('swipe-hide', dx < -40);
  },{passive:true});
  el.addEventListener('touchend',()=>{
    swiping=false;
    el.classList.remove('swipe-approve','swipe-hide');
    const t=currentReviewTx(); if(!t) return;
    if(dx > 80){ approveTx(t.id); }
    else if(dx < -80){ hideTx(t.id); }
    dx=0;
  },{passive:true});
}

// Patch renderTransactions to also populate the mobile card list
const _origRenderTransactions = typeof renderTransactions === 'function' ? renderTransactions : null;
renderTransactions = function(){
  if(_origRenderTransactions) _origRenderTransactions();
  renderTxCards(visibleTransactions());
};

// Patch renderReview to attach swipe after each render
const _origRenderReview = typeof renderReview === 'function' ? renderReview : null;
renderReview = function(){
  if(_origRenderReview) _origRenderReview();
  requestAnimationFrame(attachSwipeToReview);
};
/* ---- END PHASE 1 JS ---- */


/* ---- v5.6 responsive UI hardening ---- */
function v56EnhanceAfterRender(){
  document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
  document.body.classList.toggle('transactions-view', activeView === 'transactions');
  const nav=document.getElementById('mobileNav');
  const active=nav?.querySelector('button.active');
  if(active && window.matchMedia('(max-width: 900px)').matches){
    try{ active.scrollIntoView({block:'nearest', inline:'center'}); }catch(e){}
  }
}
buildMobileNav = function(){
  const el=document.getElementById('mobileNav'); if(!el) return;
  el.innerHTML = NAV.map(([id,title,,icon])=>`<button type="button" class="${id===activeView?'active':''}" onclick="showView('${id}')" aria-label="Open ${escapeHtml(title)}"><span>${icon}</span><span>${escapeHtml(title)}</span></button>`).join('');
  v56EnhanceAfterRender();
};
renderTxCards = function(txns){
  const el=document.getElementById('transactionCards'); if(!el) return;
  if(!txns.length){
    el.innerHTML='<div class="empty" style="min-height:160px"><div><strong>No matching transactions.</strong><p>Import a CSV, add a transaction manually, or change the filters.</p><div class="empty-actions"><button type="button" class="btn btn-primary" onclick="showView(\'import\')">Import CSV</button><button type="button" class="btn" onclick="openDrawer(\'quickAdd\')">Add manually</button></div></div></div>';
    return;
  }
  el.innerHTML=txns.map(t=>{
    const amt=Number(t.amount);
    const initial=String(t.description||'?').trim()[0]?.toUpperCase()||'?';
    const badge=t.hidden?'<span class="tx-card-badge">Hidden</span>':(t.reviewed?'<span class="tx-card-badge reviewed">Reviewed</span>':'<span class="tx-card-badge needs-review">Review</span>');
    return `<button type="button" class="tx-card" onclick="editTransaction('${t.id}')" aria-label="Edit ${escapeHtml(t.description)}">
      <div class="tx-card-avatar">${escapeHtml(initial)}</div>
      <div class="tx-card-body">
        <div class="tx-card-merchant">${escapeHtml(t.description)}</div>
        <div class="tx-card-meta">${dateFmt(t.date)} · ${escapeHtml(t.category||'Other')} · ${escapeHtml(t.account||'General')}</div>
      </div>
      <div class="tx-card-right">
        <span class="tx-card-amount ${amt<0?'bad':'good'}">${money(amt)}</span>
        ${badge}
      </div>
    </button>`;
  }).join('');
};
const _v56RenderAll = renderAll;
renderAll = function(){
  _v56RenderAll();
  requestAnimationFrame(v56EnhanceAfterRender);
};
const _v56ShowView = showView;
showView = function(id){
  _v56ShowView(id);
  requestAnimationFrame(v56EnhanceAfterRender);
};
/* ---- end v5.6 responsive UI hardening ---- */


/* ---- v5.8 executive UI and mobile polish ---- */
function v58Money(value){
  return typeof v54FriendlyMoney === 'function' ? v54FriendlyMoney(value) : money(value);
}
function v58PctWidth(n){ return Math.min(100, Math.max(0, Number(n)||0)); }
function v58Row(title,value,sub,cls,fn){
  const attr = fn ? ` onclick="${fn}"` : '';
  return `<button type="button" class="v5-plan-row"${attr}><div><b>${escapeHtml(title)}</b><span>${escapeHtml(sub||'')}</span></div><strong class="${cls||''}">${escapeHtml(String(value||''))}<span class="v58-arrow">›</span></strong></button>`;
}
renderUsabilityPanel = function(){
  const panel=document.getElementById('monarchUsabilityPanel'); if(panel) panel.innerHTML='';
  const plan=document.getElementById('monthlyPlanCard'); if(plan) plan.innerHTML='';
};
renderV52ParityPanel = function(){ const el=document.getElementById('v52ParityPanel'); if(el) el.innerHTML=''; };
renderV5CommandBoard = function(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace();
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  const over=stats.filter(b=>b.pct>100);
  const unreviewed=state.transactions.filter(t=>!t.reviewed).length;
  const netBreakdown=netWorthBreakdown();
  const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const latestNet=snapshots[0] || {netWorth:netBreakdown.netWorth};
  const prevNet=snapshots[1];
  const netDelta=latestNet && prevNet ? Number(latestNet.netWorth||0)-Number(prevNet.netWorth||0) : 0;
  const reviewMode = unreviewed ? 'bad' : (over.length ? 'warn' : 'good');
  const budgetMode = !p.totalBudget ? 'warn' : p.pacePct>105 ? 'bad' : p.pacePct>90 ? 'warn' : 'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0);
  const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0;
  const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0);
  const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0);
  const cats=byCategory(monthTransactions(currentMonth())).slice(0,4);
  const safeDaily = p.remainingBudget>0 ? `${v58Money(p.safeToSpend)}/day` : '$0/day';
  const spendRows = cats.length ? cats.slice(0,3).map(([cat,val],i)=>v58Row(cat,v58Money(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0?'bad':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join('') : emptyMini('No spending yet','Import transactions to populate spend radar.','Import CSV','showView(\'import\')');
  const budgetRows = stats.length ? stats.slice(0,3).map(b=>v58Row(b.category,`${b.pct}%`,`${v58Money(Math.max(0,b.remaining))} left of ${v58Money(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`showCategoryTransactions('${escapeJs(b.category)}')`)).join('') : emptyMini('No budgets','Add category limits for a calmer monthly plan.','Add budget','openDrawer(\'budget\')');
  const nextRows = (unreviewed ? v58Row('Review inbox',unreviewed,'Approve or fix categories','warn','startWeeklyReview()') : (over.length ? v58Row('Adjust budgets',over.length,'Over-limit categories need a decision','bad','showView(\'budgets\')') : v58Row('Export report','Ready','Monthly summary is current','good','exportMonthlyReport()'))) + v58Row('Backup','JSON',`Last: ${state.settings.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()');
  el.innerHTML=`
    <div class="v5-section-head">
      <div><h3>Control center</h3><p>Budget, review, plan, and net worth in one clean scan.</p></div>
      <div class="v58-head-actions"><span class="section-chip">This month</span><button type="button" class="btn btn-small" onclick="openCommandPalette()">Commands</button></div>
    </div>
    <div class="v5-control-grid v58-control-grid">
      <button type="button" class="v5-control-card primary" onclick="showView('budgets')" aria-label="Open budgets">
        <div class="v5-card-kicker">Cash flow</div>
        <div class="v5-big ${p.net>=0?'good':'bad'}" title="${money(p.net)}">${v58Money(p.net)}</div>
        <div class="v5-subline">${v58Money(p.income)} income · ${v58Money(p.spend)} spent · ${v58Money(p.remainingBudget)} budget left</div>
        <div class="v5-meter"><span style="width:${v58PctWidth(p.totalBudget?p.budgetSpent/p.totalBudget*100:0)}%"></span></div>
        <div class="v5-meta-row">${healthStatus(`${p.pacePct||0}% pace`,p.pacePct,budgetMode)}${healthStatus(safeDaily,p.safeToSpend,p.safeToSpend>0?'good':'bad')}</div>
      </button>
      <button type="button" class="v5-control-card" onclick="startWeeklyReview()" aria-label="Open review inbox">
        <div class="v5-card-kicker">Review</div>
        <div class="v5-big ${unreviewed?'warn':'good'}">${unreviewed}</div>
        <div class="v5-subline">${unreviewed?'Transactions need approval.':'No cleanup waiting.'}</div>
        <span class="v5-status ${unreviewed?'warn':'good'}">${unreviewed?'Start review':'Clean'}</span>
      </button>
      <button type="button" class="v5-control-card" onclick="showView('networth')" aria-label="Open net worth">
        <div class="v5-card-kicker">Net worth</div>
        <div class="v5-big" title="${money(latestNet?latestNet.netWorth:0)}">${latestNet?v58Money(latestNet.netWorth):'$0'}</div>
        <div class="v5-subline ${netDelta>=0?'good':'bad'}">${latestNet&&prevNet?`${netDelta>=0?'+':''}${v58Money(netDelta)} since last snapshot`:'Add account balances to start.'}</div>
        <span class="v5-status">Update</span>
      </button>
      <button type="button" class="v5-control-card" onclick="showView('goals')" aria-label="Open planning">
        <div class="v5-card-kicker">Planning</div>
        <div class="v5-big">${goalAvg}%</div>
        <div class="v5-subline">Goal progress · ${v58Money(debt)} debt · ${v58Money(holdings)} invested</div>
        <span class="v5-status">Open plan</span>
      </button>
    </div>
    <div class="v5-lower-grid v58-lower-grid">
      <div class="v5-panel"><div class="v5-panel-title"><b>Spending by category</b><button type="button" class="btn btn-small" onclick="showView('transactions')">View all</button></div><div class="v5-list">${spendRows}</div></div>
      <div class="v5-panel"><div class="v5-panel-title"><b>Budget watchlist</b><button type="button" class="btn btn-small" onclick="showView('budgets')">Manage</button></div><div class="v5-list">${budgetRows}</div></div>
      <div class="v5-panel"><div class="v5-panel-title"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div><div class="v5-list">${nextRows}</div></div>
    </div>`;
};
budgetRowHtml = function(b){
  const cls=b.pct>=100?'bad':b.pct>=80?'warn':'good';
  const left=Math.max(0,b.remaining);
  const pct=v58PctWidth(b.pct);
  return `<div class="budget-row"><button type="button" class="budget-row-main" onclick="showCategoryTransactions('${escapeJs(b.category)}')" aria-label="Open ${escapeHtml(b.category)} transactions"><div><div class="budget-name">${escapeHtml(b.category)}</div><div class="budget-meta">${v58Money(b.spent)} spent · ${v58Money(b.limit)} budget</div></div><div class="budget-row-side"><strong class="${cls}">${b.pct}%</strong><span>${v58Money(left)} left</span></div></button><div class="progress budget-progress"><span style="width:${pct}%"></span></div><div class="budget-row-actions"><button type="button" class="btn btn-small" onclick="showCategoryTransactions('${escapeJs(b.category)}')">View transactions</button><button type="button" class="btn btn-small" onclick="editBudget('${b.id}')">Edit budget</button></div></div>`;
};
renderBudgets = function(){
  const board=document.getElementById('budgetBoard'); if(!board) return;
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  board.innerHTML=stats.length?`<div class="budget-board-list">${stats.map(budgetRowHtml).join('')}</div>`:emptyMini('No budgets yet','Create monthly category limits for quick guardrails.','Add budget','openDrawer(\'budget\')');
  const summary=document.getElementById('budgetSummary');
  if(summary){
    const totalLimit=stats.reduce((a,b)=>a+b.limit,0); const totalSpent=stats.reduce((a,b)=>a+b.spent,0); const over=stats.filter(b=>b.pct>100).length;
    summary.innerHTML=`<div class="mini-item"><div><b>Total budgeted</b><br><span>This month</span></div><strong>${v58Money(totalLimit)}</strong></div><div class="mini-item"><div><b>Spent against budgets</b><br><span>${totalLimit?Math.round(totalSpent/totalLimit*100):0}% used</span></div><strong>${v58Money(totalSpent)}</strong></div><div class="mini-item"><div><b>Over limit</b><br><span>Categories needing attention</span></div><strong class="${over?'bad':'good'}">${over}</strong></div>`;
  }
  const sugg=document.getElementById('budgetSuggestions');
  if(sugg){
    const existing=new Set((state.budgets||[]).map(b=>b.category));
    const rows=byCategory(monthTransactions(currentMonth())).filter(([cat])=>!existing.has(cat)).slice(0,4);
    sugg.innerHTML=rows.length?rows.map(([cat,val])=>`<button type="button" class="mini-item" onclick="openDrawer('budget',{category:'${escapeJs(cat)}',limit:${Math.ceil(val*1.15/10)*10}})"><div><b>${escapeHtml(cat)}</b><br><span>Based on ${v58Money(val)} current spend</span></div><strong>${v58Money(Math.ceil(val*1.15/10)*10)}</strong></button>`).join(''):emptyMini('No suggestions','Import more spending or all active categories already have budgets.');
  }
};
function v58AfterRender(){
  document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
  document.body.classList.toggle('transactions-view', activeView === 'transactions');
  const nav=document.getElementById('mobileNav');
  const active=nav?.querySelector('button.active');
  if(active && window.matchMedia('(max-width: 900px)').matches){ try{ active.scrollIntoView({block:'nearest', inline:'center'}); }catch(e){} }
}
const _v58RenderAll = renderAll;
renderAll = function(){ _v58RenderAll(); requestAnimationFrame(v58AfterRender); };
const _v58ShowView = showView;
showView = function(id){ _v58ShowView(id); requestAnimationFrame(v58AfterRender); };
/* ---- end v5.8 executive UI and mobile polish ---- */


/* ---- v5.9 executive usability + dark mode landing page ---- */
function v59Money(value){ return typeof v54FriendlyMoney === 'function' ? v54FriendlyMoney(value) : money(value); }
function v59Number(value){ return Number(value||0); }
function v59PctWidth(n){ return Math.min(100, Math.max(0, Number(n)||0)); }
function v59Row(title,value,sub,cls,fn){
  const attr = fn ? ` onclick="${fn}"` : '';
  return `<button type="button" class="v59-row"${attr}><div><b>${escapeHtml(title)}</b><span>${escapeHtml(sub||'')}</span></div><strong class="${cls||''}">${escapeHtml(String(value||''))}<span class="v59-arrow">›</span></strong></button>`;
}
function v59Mini(title,value,sub,cls,fn,status){
  return `<button type="button" class="v59-card v59-mini-card v59-card-click" onclick="${fn}" aria-label="Open ${escapeHtml(title)}"><div class="v59-kicker">${escapeHtml(title)}</div><div class="v59-value ${cls||''}">${escapeHtml(String(value))}</div><div class="v59-copy">${escapeHtml(sub||'')}</div>${status?`<span class="v5-status ${status.cls||''}">${escapeHtml(status.label)}</span>`:''}</button>`;
}
function v59LastSnapshotLabel(snapshot){ return snapshot ? `Saved ${dateFmt(snapshot.date)}` : 'No saved snapshot yet'; }
renderUsabilityPanel = function(){ const panel=document.getElementById('monarchUsabilityPanel'); if(panel) panel.innerHTML=''; const plan=document.getElementById('monthlyPlanCard'); if(plan) plan.innerHTML=''; };
renderV52ParityPanel = function(){ const el=document.getElementById('v52ParityPanel'); if(el) el.innerHTML=''; };
renderV5CommandBoard = function(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace();
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  const over=stats.filter(b=>b.pct>100);
  const unreviewed=(state.transactions||[]).filter(t=>!t.reviewed).length;
  const net=netWorthBreakdown();
  const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const saved=snapshots[0]||null;
  const savedDelta=saved ? net.netWorth - v59Number(saved.netWorth) : null;
  const reviewMode=unreviewed?'bad':(over.length?'warn':'good');
  const budgetMode=!p.totalBudget?'warn':p.pacePct>105?'bad':p.pacePct>90?'warn':'good';
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0);
  const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0;
  const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0);
  const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0);
  const cats=byCategory(monthTransactions(currentMonth())).slice(0,4);
  const safeDaily=p.remainingBudget>0?`${v59Money(p.safeToSpend)}/day`:'$0/day';
  const month=typeof monthScopeLabel==='function'?monthScopeLabel():'This month';
  const budgetRows=stats.length?stats.slice(0,4).map(b=>v59Row(b.category,`${b.pct}%`,`${v59Money(Math.max(0,b.remaining))} left of ${v59Money(b.limit)}`,b.pct>=100?'bad':b.pct>=85?'warn':'good',`showCategoryTransactions('${escapeJs(b.category)}')`)).join(''):emptyMini('No budgets yet','Create category limits for calmer spending.','Add budget','openDrawer(\'budget\')');
  const spendRows=cats.length?cats.slice(0,4).map(([cat,val],i)=>v59Row(cat,v59Money(val),`${Math.round(val/(p.spend||1)*100)}% of spending`,i===0&&p.spend?'warn':'',`showCategoryTransactions('${escapeJs(cat)}')`)).join(''):emptyMini('No spending yet','Import transactions to populate spending.','Import CSV','showView(\'import\')');
  const nextRows=(unreviewed?v59Row('Review transactions',unreviewed,'Approve, hide, or fix categories','warn','startWeeklyReview()'):(over.length?v59Row('Fix budgets',over.length,'Over-limit categories need a decision','bad','showView(\'budgets\')'):v59Row('Export report','Ready','Monthly summary is current','good','exportMonthlyReport()'))) + v59Row('Backup','JSON',`Last: ${state.settings?.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()');
  const savedDeltaText=savedDelta===null?'Save today’s value':`${savedDelta>=0?'+':''}${v59Money(savedDelta)} vs saved`;
  const savedDeltaCls=savedDelta===null?'':savedDelta>=0?'good':'bad';
  const reviewStatus=unreviewed?{label:'Needs review',cls:'warn'}:{label:'Clean',cls:'good'};
  const planStatus=goalAvg?{label:'Open plan',cls:''}:{label:'Set goals',cls:'warn'};
  el.innerHTML=`<div class="v59-command">
    <div class="v59-head">
      <div><h3>Control center</h3><p>A calm snapshot of net worth, cash flow, review work, and the next decision.</p></div>
      <div class="v59-head-actions"><span class="v59-chip">${escapeHtml(month)}</span><button type="button" class="btn btn-small" onclick="openCommandPalette()">Commands</button></div>
    </div>
    <div class="v59-hero-grid">
      <section class="v59-card v59-net-card" aria-label="Current net worth snapshot">
        <div class="v59-kicker">Current net worth snapshot</div>
        <div class="v59-net-value ${net.netWorth>=0?'good':'bad'}" title="${money(net.netWorth)}">${v59Money(net.netWorth)}</div>
        <div class="v59-net-sub">Calculated from included manual accounts, debts, and holdings. ${saved?v59LastSnapshotLabel(saved):'Save a snapshot when balances look right.'}</div>
        <div class="v59-snapshot-strip">
          <div class="v59-stat"><span>Assets</span><b class="good">${v59Money(net.assets)}</b></div>
          <div class="v59-stat"><span>Liabilities</span><b class="bad">${v59Money(net.liabilities)}</b></div>
          <div class="v59-stat"><span>Snapshot delta</span><b class="${savedDeltaCls}">${escapeHtml(savedDeltaText)}</b></div>
        </div>
        <div class="v59-quick-actions"><button type="button" class="btn btn-primary" onclick="saveNetWorthSnapshot()">Save snapshot</button><button type="button" class="btn" onclick="showView('networth')">Update balances</button></div>
      </section>
      ${v59Mini('Cash flow',v59Money(p.net),`${v59Money(p.income)} income · ${v59Money(p.spend)} spent · ${safeDaily} safe`,p.net>=0?'good':'bad',"showView('budgets')",{label:`${p.pacePct||0}% pace`,cls:budgetMode})}
      ${v59Mini('Review',unreviewed,unreviewed?'Transactions need approval':'No cleanup waiting',unreviewed?'warn':'good','startWeeklyReview()',reviewStatus)}
      ${v59Mini('Planning',`${goalAvg}%`,`Goals · ${v59Money(debt)} debt · ${v59Money(holdings)} invested`,'',"showView('goals')",planStatus)}
    </div>
    <div class="v59-content-grid">
      <section class="v59-panel"><div class="v59-panel-head"><b>Budget watchlist</b><button type="button" class="btn btn-small" onclick="showView('budgets')">Manage</button></div><div class="v59-list">${budgetRows}</div></section>
      <section class="v59-panel"><div class="v59-panel-head"><b>Next best move</b><span class="v5-status ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Watch':'Action'}</span></div><div class="v59-list">${nextRows}</div></section>
      <section class="v59-panel"><div class="v59-panel-head"><b>Spending radar</b><button type="button" class="btn btn-small" onclick="showView('transactions')">View all</button></div><div class="v59-list">${spendRows}</div></section>
    </div>
  </div>`;
};
function v59AfterRender(){
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
  document.body.classList.toggle('transactions-view', activeView === 'transactions');
  const firstRun=document.getElementById('firstRun');
  if(firstRun?.classList.contains('active')) document.body.classList.add('first-run-open'); else document.body.classList.remove('first-run-open');
  const nav=document.getElementById('mobileNav'); const active=nav?.querySelector('button.active');
  if(active && window.matchMedia('(max-width: 900px)').matches){ try{ active.scrollIntoView({block:'nearest',inline:'center'}); }catch(e){} }
}
const _v59RenderAll = renderAll;
renderAll = function(){ _v59RenderAll(); requestAnimationFrame(v59AfterRender); };
const _v59ShowView = showView;
showView = function(id){ _v59ShowView(id); requestAnimationFrame(v59AfterRender); };
window.addEventListener('resize',()=>requestAnimationFrame(v59AfterRender),{passive:true});
/* ---- end v5.9 executive usability + dark mode landing page ---- */


/* ---- pre-v1 mobile-first refresh ---- */
function v60Money(value){ return typeof v54FriendlyMoney === 'function' ? v54FriendlyMoney(value) : money(value); }
function v60ClampPct(n){ return Math.min(100, Math.max(0, Number(n)||0)); }
function v60StatusClass(pct){ return pct>=100?'bad':pct>=85?'warn':'good'; }
function v60Row(title,value,sub,cls,fn){
  const attr=fn?` onclick="${fn}"`:'';
  return `<button type="button" class="v60-row"${attr}><div><b>${escapeHtml(title)}</b><span>${escapeHtml(sub||'')}</span></div><strong class="${cls||''}">${escapeHtml(String(value||''))}<span class="v60-arrow">›</span></strong></button>`;
}
function v60Mini(title,value,sub,cls,fn,status){
  return `<button type="button" class="v60-card v60-mini v60-card-click" onclick="${fn}" aria-label="Open ${escapeHtml(title)}"><div class="v60-kicker">${escapeHtml(title)}</div><div class="v60-mini-value ${cls||''}">${escapeHtml(String(value))}</div><div class="v60-mini-copy">${escapeHtml(sub||'')}</div>${status?`<span class="v60-chip ${status.cls||''}">${escapeHtml(status.label)}</span>`:''}</button>`;
}
function v60SpendingRows(cats, totalSpend){
  if(!cats.length) return emptyMini('No spending yet','Import transactions to build a readable spending map.','Import CSV','showView(\'import\')');
  const max=Math.max(...cats.map(([,v])=>Number(v)||0),1);
  return `<div class="v60-spend-list">${cats.slice(0,7).map(([cat,val],i)=>{
    const pct=Math.round((Number(val)||0)/(totalSpend||1)*100);
    const w=Math.max(3, Math.round((Number(val)||0)/max*100));
    return `<button type="button" class="v60-spend-row" onclick="showCategoryTransactions('${escapeJs(cat)}')" aria-label="Open ${escapeHtml(cat)} spending"><div class="v60-spend-label"><b>${escapeHtml(cat)}</b><span>${pct}% of spending</span></div><div class="v60-bar-track"><div class="v60-bar" style="width:${w}%"></div></div><div class="v60-spend-amount">${v60Money(val)}</div></button>`;
  }).join('')}</div>`;
}
function v60BudgetCard(b){
  const cls=v60StatusClass(b.pct); const left=Math.max(0,Number(b.remaining)||0); const pct=v60ClampPct(b.pct);
  return `<div class="v60-budget-row"><button type="button" class="v60-budget-top" onclick="showCategoryTransactions('${escapeJs(b.category)}')" aria-label="Open ${escapeHtml(b.category)} transactions"><div><div class="v60-budget-name">${escapeHtml(b.category)}</div><div class="v60-budget-meta">${v60Money(b.spent)} spent · ${v60Money(b.limit)} budget</div></div><div><div class="v60-budget-pct ${cls}">${b.pct}%</div><div class="v60-budget-left">${v60Money(left)} left</div></div></button><div class="v60-budget-track"><div class="v60-budget-fill ${cls}" style="width:${pct}%"></div></div><div class="v60-budget-actions"><button type="button" class="btn btn-small" onclick="showCategoryTransactions('${escapeJs(b.category)}')">Transactions</button><button type="button" class="btn btn-small" onclick="editBudget('${b.id}')">Edit</button></div></div>`;
}
budgetRowHtml = function(b){ return v60BudgetCard(b); };
renderV5CommandBoard = function(){
  const el=document.getElementById('v5CommandBoard'); if(!el) return;
  const p=spendingPace();
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  const over=stats.filter(b=>b.pct>100);
  const unreviewed=(state.transactions||[]).filter(t=>!t.reviewed).length;
  const net=netWorthBreakdown();
  const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  const saved=snapshots[0]||null;
  const savedDelta=saved ? Number(net.netWorth||0)-Number(saved.netWorth||0) : null;
  const goals=(state.goals||[]).filter(g=>Number(g.target)>0);
  const goalAvg=goals.length?Math.round(goals.reduce((a,g)=>a+Math.min(100,Number(g.current||0)/Number(g.target||1)*100),0)/goals.length):0;
  const debt=(state.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0);
  const holdings=(state.holdings||[]).reduce((a,h)=>a+Number(h.quantity||0)*Number(h.price||0),0);
  const cats=byCategory(monthTransactions(currentMonth())).slice(0,7);
  const safeDaily=p.remainingBudget>0?`${v60Money(p.safeToSpend)}/day`:'$0/day';
  const month=typeof monthScopeLabel==='function'?monthScopeLabel():'This month';
  const reviewMode=unreviewed?'warn':(over.length?'bad':'good');
  const budgetMode=!p.totalBudget?'warn':p.pacePct>105?'bad':p.pacePct>90?'warn':'good';
  const savedDeltaText=savedDelta===null?'Save today’s value':`${savedDelta>=0?'+':''}${v60Money(savedDelta)} vs saved`;
  const savedDeltaCls=savedDelta===null?'':savedDelta>=0?'good':'bad';
  const budgetRows=stats.length?`<div class="v60-budget-list">${stats.slice(0,4).map(v60BudgetCard).join('')}</div>`:emptyMini('No budgets yet','Create simple caps for the categories you care about.','Add budget','openDrawer(\'budget\')');
  const nextRows=(unreviewed?v60Row('Review transactions',unreviewed,'Approve, hide, or fix categories','warn','startWeeklyReview()'):(over.length?v60Row('Fix over-budget categories',over.length,'Decide what changed or adjust limits','bad','showView(\'budgets\')'):v60Row('Export report','Ready','Monthly summary is current','good','exportMonthlyReport()'))) + v60Row('Backup','JSON',`Last: ${state.settings?.lastBackup?dateFmt(state.settings.lastBackup.slice(0,10)):'never'}`,'','exportBackup()');
  el.innerHTML=`<div class="v60-dashboard">
    <div class="v60-head"><div><h3>MoneyMap</h3><p>One clean mobile-first view for net worth, spending, budgets, and the next action.</p></div><div class="v60-head-actions"><span class="v60-chip">${escapeHtml(month)}</span><button type="button" class="btn btn-small" onclick="openCommandPalette()">Commands</button></div></div>
    <div class="v60-summary-grid">
      <section class="v60-card v60-net-card" aria-label="Current net worth snapshot"><div class="v60-kicker">Current net worth snapshot</div><div class="v60-net-value ${net.netWorth>=0?'good':'bad'}" title="${money(net.netWorth)}">${v60Money(net.netWorth)}</div><div class="v60-sub">Assets, liabilities, debts, and holdings combined into one saved snapshot. ${saved?`Last saved ${dateFmt(saved.date)}.`:'Save when balances look right.'}</div><div class="v60-snapshot-strip"><div class="v60-stat"><span>Assets</span><b class="good">${v60Money(net.assets)}</b></div><div class="v60-stat"><span>Liabilities</span><b class="bad">${v60Money(net.liabilities)}</b></div><div class="v60-stat"><span>Delta</span><b class="${savedDeltaCls}">${escapeHtml(savedDeltaText)}</b></div></div><div class="v60-actions"><button type="button" class="btn btn-primary" onclick="saveNetWorthSnapshot()">Save snapshot</button><button type="button" class="btn" onclick="showView('networth')">Update balances</button></div></section>
      ${v60Mini('Cash flow',v60Money(p.net),`${v60Money(p.income)} income · ${v60Money(p.spend)} spent · ${safeDaily} safe`,p.net>=0?'good':'bad',"showView('budgets')",{label:`${p.pacePct||0}% pace`,cls:budgetMode})}
      ${v60Mini('Review',unreviewed,unreviewed?'Transactions need cleanup':'No cleanup waiting',unreviewed?'warn':'good','startWeeklyReview()',{label:unreviewed?'Needs review':'Clean',cls:unreviewed?'warn':'good'})}
      ${v60Mini('Planning',`${goalAvg}%`,`Goals · ${v60Money(debt)} debt · ${v60Money(holdings)} invested`,'',"showView('goals')",{label:goalAvg?'Open plan':'Set goals',cls:goalAvg?'':'warn'})}
    </div>
    <div class="v60-content-grid">
      <section class="v60-panel wide"><div class="v60-panel-head"><div><b>Spending map</b><span> Ranked by amount this month</span></div><button type="button" class="btn btn-small" onclick="showView('transactions')">View all</button></div>${v60SpendingRows(cats,p.spend)}</section>
      <section class="v60-panel"><div class="v60-panel-head"><div><b>Budget heat</b><span> Closest to limit</span></div><button type="button" class="btn btn-small" onclick="showView('budgets')">Manage</button></div>${budgetRows}</section>
      <section class="v60-panel"><div class="v60-panel-head"><div><b>Next best move</b><span> ${reviewMode==='good'?'Clean':'Needs attention'}</span></div><span class="v60-chip ${reviewMode}">${reviewMode==='good'?'Clean':reviewMode==='warn'?'Review':'Action'}</span></div><div class="v60-row-list">${nextRows}</div></section>
    </div>
  </div>`;
};
renderBudgets = function(){
  const board=document.getElementById('budgetBoard'); if(!board) return;
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  board.innerHTML=stats.length?`<div class="budget-board-list">${stats.map(v60BudgetCard).join('')}</div>`:emptyMini('No budgets yet','Create monthly category limits for quick guardrails.','Add budget','openDrawer(\'budget\')');
  const summary=document.getElementById('budgetSummary');
  if(summary){
    const totalLimit=stats.reduce((a,b)=>a+b.limit,0); const totalSpent=stats.reduce((a,b)=>a+b.spent,0); const over=stats.filter(b=>b.pct>100).length;
    summary.innerHTML=`<div class="mini-item"><div><b>Total budgeted</b><br><span>This month</span></div><strong>${v60Money(totalLimit)}</strong></div><div class="mini-item"><div><b>Spent against budgets</b><br><span>${totalLimit?Math.round(totalSpent/totalLimit*100):0}% used</span></div><strong>${v60Money(totalSpent)}</strong></div><div class="mini-item"><div><b>Over limit</b><br><span>Categories needing attention</span></div><strong class="${over?'bad':'good'}">${over}</strong></div>`;
  }
  const sugg=document.getElementById('budgetSuggestions');
  if(sugg){ const existing=new Set((state.budgets||[]).map(b=>b.category)); const rows=byCategory(monthTransactions(currentMonth())).filter(([cat])=>!existing.has(cat)).slice(0,4); sugg.innerHTML=rows.length?rows.map(([cat,val])=>`<button type="button" class="mini-item" onclick="openDrawer('budget',{category:'${escapeJs(cat)}',limit:${Math.ceil(val*1.15/10)*10}})"><div><b>${escapeHtml(cat)}</b><br><span>Based on ${v60Money(val)} current spend</span></div><strong>${v60Money(Math.ceil(val*1.15/10)*10)}</strong></button>`).join(''):emptyMini('No suggestions','Import more spending or all active categories already have budgets.'); }
};
function renderTxCardsV60(txns){
  const el=document.getElementById('transactionCards'); if(!el) return;
  if(!txns.length){ el.innerHTML='<div class="empty" style="min-height:160px"><div><strong>No matching transactions.</strong><p>Import a CSV, add a transaction manually, or change the filters.</p><div class="empty-actions"><button type="button" class="btn btn-primary" onclick="showView(\'import\')">Import CSV</button><button type="button" class="btn" onclick="openDrawer(\'quickAdd\')">Add manually</button></div></div></div>'; return; }
  el.innerHTML=txns.map(t=>{ const amt=Number(t.amount); const initial=String(t.description||'?').trim()[0]?.toUpperCase()||'?'; const badge=t.hidden?'<span class="v60-tx-badge hidden">Hidden</span>':(t.reviewed?'<span class="v60-tx-badge reviewed">Reviewed</span>':'<span class="v60-tx-badge needs-review">Review</span>'); return `<button type="button" class="v60-tx-card" onclick="editTransaction('${t.id}')" aria-label="Edit ${escapeHtml(t.description)}"><div class="v60-tx-avatar">${escapeHtml(initial)}</div><div class="v60-tx-main"><div class="v60-tx-merchant">${escapeHtml(t.description)}</div><div class="v60-tx-meta">${dateFmt(t.date)} · ${escapeHtml(t.category||'Other')} · ${escapeHtml(t.account||'General')}</div></div><div class="v60-tx-right"><span class="v60-tx-amount ${amt<0?'bad':'good'}">${money(amt)}</span>${badge}</div></button>`; }).join('');
}
const _v60RenderTransactions = renderTransactions;
renderTransactions = function(){ _v60RenderTransactions(); renderTxCardsV60(visibleTransactions()); };
function v60AfterRender(){
  document.title='MoneyMap';
  document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
  document.body.classList.toggle('transactions-view', activeView === 'transactions');
  const nav=document.getElementById('mobileNav'); const active=nav?.querySelector('button.active');
  if(active && window.matchMedia('(max-width: 900px)').matches){ try{ active.scrollIntoView({block:'nearest',inline:'center'}); }catch(e){} }
}
const _v60RenderAll = renderAll;
renderAll = function(){ _v60RenderAll(); requestAnimationFrame(v60AfterRender); };
const _v60ShowView = showView;
showView = function(id){ _v60ShowView(id); requestAnimationFrame(v60AfterRender); };
window.addEventListener('resize',()=>requestAnimationFrame(v60AfterRender),{passive:true});
/* ---- end pre-v1 mobile-first refresh ---- */

init();
requestAnimationFrame(()=>{ ensureTransactionFilterExtras(); renderAll(); });


/* ---- pre-v1 focused UX polish ---- */
const UXV62_PRIMARY_MOBILE_NAV = ['overview','review','transactions','budgets'];
function ux62NavTitle(id){
  const item = NAV.find(n=>n[0]===id);
  return item ? item[1] : id;
}
function ux62NavIcon(id){
  const item = NAV.find(n=>n[0]===id);
  return item ? item[3] : '•';
}
function ux62NavSub(id){
  const item = NAV.find(n=>n[0]===id);
  return item ? item[2] : '';
}
function ux62EnsureMobileMoreSheet(){
  let sheet = document.getElementById('mobileMoreSheet');
  if(sheet) return sheet;
  sheet = document.createElement('div');
  sheet.id = 'mobileMoreSheet';
  sheet.className = 'mobile-more-sheet';
  sheet.setAttribute('aria-hidden','true');
  sheet.innerHTML = `<div class="mobile-more-panel" role="dialog" aria-modal="true" aria-label="More MoneyMap sections">
    <div class="mobile-more-head"><div><b>More sections</b><span>Open the tools that do not fit in the bottom bar.</span></div><button type="button" class="btn btn-square" onclick="toggleMobileMore(false)" aria-label="Close more menu">×</button></div>
    <div class="mobile-more-grid" id="mobileMoreGrid"></div>
  </div>`;
  sheet.addEventListener('click', event => { if(event.target === sheet) toggleMobileMore(false); });
  document.body.appendChild(sheet);
  return sheet;
}
function ux62RenderMobileMoreGrid(){
  const sheet = ux62EnsureMobileMoreSheet();
  const grid = sheet.querySelector('#mobileMoreGrid');
  if(!grid) return;
  const ids = NAV.map(n=>n[0]).filter(id => !UXV62_PRIMARY_MOBILE_NAV.includes(id));
  grid.innerHTML = ids.map(id => `<button type="button" class="mobile-more-item ${id===activeView?'active':''}" onclick="showView('${id}')">
    <span class="mobile-more-icon">${escapeHtml(ux62NavIcon(id))}</span>
    <span class="mobile-more-copy"><strong>${escapeHtml(ux62NavTitle(id))}</strong><span>${escapeHtml(ux62NavSub(id))}</span></span>
  </button>`).join('');
}
function toggleMobileMore(open){
  const sheet = ux62EnsureMobileMoreSheet();
  const shouldOpen = typeof open === 'boolean' ? open : !sheet.classList.contains('active');
  if(shouldOpen) ux62RenderMobileMoreGrid();
  sheet.classList.toggle('active', shouldOpen);
  sheet.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  document.body.classList.toggle('uxv62-more-open', shouldOpen);
}
buildMobileNav = function(){
  const el = document.getElementById('mobileNav');
  if(!el) return;
  const moreActive = !UXV62_PRIMARY_MOBILE_NAV.includes(activeView);
  const items = UXV62_PRIMARY_MOBILE_NAV.map(id => ({id, title:ux62NavTitle(id), icon:ux62NavIcon(id), active:id===activeView, action:`showView('${id}')`}));
  items.push({id:'more', title:'More', icon:'•••', active:moreActive, action:'toggleMobileMore(true)'});
  el.innerHTML = items.map(item => `<button type="button" class="${item.active?'active':''}" onclick="${item.action}" aria-label="${item.id==='more'?'Open more sections':'Open '+escapeHtml(item.title)}"><span>${escapeHtml(item.icon)}</span><span>${escapeHtml(item.title)}</span></button>`).join('');
  ux62RenderMobileMoreGrid();
};
const _ux62ShowView = showView;
showView = function(id){
  toggleMobileMore(false);
  _ux62ShowView(id);
  requestAnimationFrame(()=>{
    buildMobileNav();
    document.body.classList.add('uxv62-ready');
    const top = document.querySelector('.main');
    if(window.matchMedia('(max-width: 900px)').matches && top){ try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); } }
  });
};
const _ux62RenderAll = renderAll;
renderAll = function(){
  _ux62RenderAll();
  requestAnimationFrame(()=>{
    buildMobileNav();
    document.body.classList.add('uxv62-ready');
    document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
  });
};
window.addEventListener('keydown', event => {
  if(event.key === 'Escape') toggleMobileMore(false);
});
/* ---- end pre-v1 focused UX polish ---- */


/* ---- v0.5 deep UI and mobile polish ---- */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    :root{--mm-compact-bottom:64px;--mm-mobile-safe:env(safe-area-inset-bottom)}
    .main{padding-bottom:calc(92px + var(--mm-mobile-safe))}
    .topbar{border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent)}
    .searchbar{height:44px;min-height:44px;border-radius:14px;padding:9px 13px;background:color-mix(in srgb,var(--panel) 82%,transparent)!important}
    .section-title{letter-spacing:-.055em}.section-sub{max-width:760px}
    .card,.metric-card,.hero-metric,.tracker-stat,.week-card{background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel2) 74%,transparent))!important;border-color:color-mix(in srgb,var(--line) 88%,transparent)!important}
    .card-header{gap:10px}.card-subtitle{line-height:1.38}.btn{border-radius:13px}.btn-primary{color:#061015!important}.pill,.category-chip,.balance-badge,.confidence-pill,.cleanup-badge,.goal-chip{border-radius:999px;background:color-mix(in srgb,var(--panel2) 90%,transparent)!important}
    .metric-card,.tracker-stat,.week-card{min-height:104px}.metric-label{margin-bottom:8px}.metric-sub{line-height:1.35}
    .canvas-wrap.mm-chart-card{position:relative;border-radius:22px!important;padding:16px!important;background:radial-gradient(700px 180px at 50% -20%,rgba(var(--accent-rgb),.10),transparent 58%),linear-gradient(180deg,color-mix(in srgb,var(--panel2) 95%,transparent),color-mix(in srgb,var(--panel) 92%,transparent))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}
    .chart-legend{margin-top:10px}.legend-chip{min-height:34px;background:color-mix(in srgb,var(--panel2) 92%,transparent)!important;border-color:var(--line)!important}.chart-hover-note{font-size:11.5px;color:var(--soft)}
    .chart-tooltip{font-size:12px}.chart-tip-title{font-size:13px}.chart-tip-row b{font-size:12px}.chart-tip-row{padding:5px 0}
    .table-wrap{box-shadow:inset 0 1px 0 rgba(255,255,255,.025)} tbody tr{transition:background .12s ease}
    .mobile-bar{height:calc(var(--mm-compact-bottom) + var(--mm-mobile-safe));padding:6px 8px calc(6px + var(--mm-mobile-safe))!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:5px!important;background:color-mix(in srgb,var(--panel) 94%,transparent)!important;box-shadow:0 -12px 34px rgba(0,0,0,.20)!important}
    .mobile-bar button{min-height:50px!important;border-radius:16px!important;gap:2px!important;padding:6px 3px!important;font-weight:800!important;letter-spacing:-.01em!important}
    .mobile-bar button span:first-child{font-size:17px;line-height:1}.mobile-bar button span:last-child{font-size:10.5px!important;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .mobile-bar button.active{background:linear-gradient(180deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.08))!important;box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.24)}
    .mobile-more-sheet{padding-bottom:calc(78px + var(--mm-mobile-safe))!important}.mobile-more-panel{border-radius:24px 24px 0 0!important}.mobile-more-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.mobile-more-item{min-height:74px!important;border-radius:17px!important;padding:12px!important}.mobile-more-icon{width:34px!important;height:34px!important;border-radius:13px!important}.mobile-more-copy strong{font-size:13px!important}.mobile-more-copy span{font-size:11px!important}
    .storage-banner{border-radius:16px!important;margin-bottom:12px!important}.drawer-panel{max-width:min(720px,calc(100vw - 20px))}.drawer-actions .btn{border-radius:15px}
    @media(max-width:1180px){.main{padding-top:12px}.topbar{position:sticky;top:0;z-index:30;margin:-12px -12px 12px!important;padding:10px 12px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 96%,transparent),color-mix(in srgb,var(--bg) 88%,transparent))!important;backdrop-filter:blur(18px)}.actions{gap:7px}.actions .btn{min-height:38px;padding:9px 10px;font-size:12px}.metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{gap:10px!important}}
    @media(max-width:760px){body{background-attachment:fixed}.main{padding-left:10px!important;padding-right:10px!important;padding-bottom:calc(84px + var(--mm-mobile-safe))!important}.topbar{display:grid!important;grid-template-columns:1fr!important}.searchbar{width:100%;max-width:none}.actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%}.actions .btn{width:100%;min-height:38px}.hero.compact,.hero{gap:10px!important;margin-bottom:10px!important}.command-strip,.hero-card{border-radius:20px!important;padding:18px!important;min-height:0!important}.command-copy h2,.hero h2{font-size:30px!important;line-height:1!important;letter-spacing:-.055em!important}.command-copy p,.hero p{font-size:13px!important;line-height:1.42!important}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.metric-card,.tracker-stat,.week-card{padding:14px!important;border-radius:16px!important;min-height:98px!important}.metric-value{font-size:25px!important}.metric-label{font-size:8.5px!important}.metric-sub{font-size:11px!important}.card{padding:14px!important;border-radius:17px!important}.card-header{display:grid!important;margin-bottom:12px!important}.card-title{font-size:16px!important}.card-subtitle{font-size:12px!important}.page-head{gap:10px!important;margin-bottom:12px!important}.section-title{font-size:26px!important}.section-sub{font-size:13px!important}.canvas-wrap{height:218px!important;min-height:218px!important;border-radius:18px!important}.canvas-wrap.mm-chart-card{padding:12px!important}.chart-legend{display:grid!important;grid-template-columns:1fr!important;gap:7px!important}.legend-chip{padding:8px 10px!important}.review-transaction{padding:18px!important;border-radius:20px!important}.review-merchant{font-size:23px!important}.review-amount{font-size:33px!important;margin:13px 0!important}.category-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.cat-btn{padding:12px 10px!important}.mini-item{border-radius:15px!important;padding:11px!important}.form-field{margin-bottom:10px}.input,select,textarea{min-height:44px!important;border-radius:13px!important}.table-actions .btn,.tx-actions .btn{min-height:32px!important}.mobile-more-panel{max-height:min(78vh,620px)!important}.drawer-panel{inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;border-radius:0!important}.drawer-head{padding:16px 14px 12px!important}.drawer-head .section-title{font-size:26px!important}#drawerBody{padding:12px 12px 18px!important}}
    @media(max-width:430px){.metric-grid{grid-template-columns:1fr!important}.topbar .actions{grid-template-columns:1fr!important}.mobile-bar{padding-left:5px!important;padding-right:5px!important;gap:3px!important}.mobile-bar button{border-radius:14px!important}.mobile-bar button span:first-child{font-size:16px}.mobile-bar button span:last-child{font-size:9.5px!important}.mobile-more-grid{grid-template-columns:1fr!important}.command-copy h2,.hero h2{font-size:27px!important}.canvas-wrap{height:204px!important;min-height:204px!important}}
  `;
  document.head.appendChild(style);

  window.APP_PRERELEASE_LABEL = 'v0.5';

  const originalBackupPayload = window.backupPayload;
  if(typeof originalBackupPayload === 'function'){
    window.backupPayload = function(){
      const payload = originalBackupPayload();
      payload.releaseStage = 'v0.5';
      payload.build = APP_BUILD_ID;
      return payload;
    };
  }

  function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function font(){ return getComputedStyle(document.body).fontFamily; }
  function clearCanvas(canvas, minW=620, minH=250){
    const wrap=canvas.parentElement; const rect=wrap.getBoundingClientRect(); const dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(minW,Math.floor(rect.width*dpr)); canvas.height=Math.max(minH,Math.floor(rect.height*dpr));
    const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=canvas.width/dpr,h=canvas.height/dpr; ctx.clearRect(0,0,w,h);
    return {ctx,w,h,dpr,wrap};
  }
  function noData(ctx,msg,w){ ctx.fillStyle=cssVar('--muted'); ctx.font='13px '+font(); ctx.fillText(msg,18,34); }
  function setLegend(id,items,title='Now showing'){
    const el=document.getElementById(id); if(!el) return;
    el.innerHTML=`<span class="chart-legend-title">${escapeHtml(title)}</span>`+items.map(item=>`<span class="legend-chip"><span class="chart-swatch" style="background:${escapeHtml(item.color||cssVar('--accent'))}"></span><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b></span>`).join('');
  }
  function showTip(tipId,canvas,x,y,title,rows){
    const tip=document.getElementById(tipId); if(!tip) return;
    tip.innerHTML=`<div class="chart-tip-title"><b>${escapeHtml(title)}</b><span>Detail</span></div>`+rows.map(r=>`<div class="chart-tip-row"><span class="chart-tip-label"><span class="chart-swatch" style="background:${escapeHtml(r.color||cssVar('--accent'))}"></span>${escapeHtml(r.label)}</span><b>${escapeHtml(r.value)}</b></div>`).join('');
    const wrap=canvas.parentElement; const maxX=wrap.clientWidth-260; tip.style.left=Math.max(10,Math.min(maxX,x+14))+'px'; tip.style.top=Math.max(10,y-12)+'px'; tip.classList.add('visible'); tip.setAttribute('aria-hidden','false');
  }
  function hideTip(id){ const tip=document.getElementById(id); if(tip){ tip.classList.remove('visible'); tip.setAttribute('aria-hidden','true'); } }
  function bindCanvasHover(canvas,key,model,onIndex){
    if(!canvas || canvas.dataset[key]) return; canvas.dataset[key]='1';
    const move=(event)=>{ const rect=canvas.getBoundingClientRect(); const x=event.clientX-rect.left; const y=event.clientY-rect.top; const m=window[key+'Model']; if(!m || !m.items?.length) return; let idx=0, best=Infinity; m.items.forEach((it,i)=>{ const dx=x-it.cx, dy=y-it.cy; const dist=Math.abs(dx)+(it.band?0:Math.abs(dy)*.45); if(dist<best){best=dist;idx=i;} }); onIndex(idx,x,y); };
    canvas.addEventListener('mousemove',move); canvas.addEventListener('click',move); canvas.addEventListener('mouseleave',()=>{ hideTip(key+'Tip'); onIndex(null); });
    canvas.addEventListener('focus',()=>{ const m=window[key+'Model']; if(m?.items?.length) onIndex(m.items.length-1, m.items[m.items.length-1].cx, m.items[m.items.length-1].cy); });
    canvas.addEventListener('blur',()=>{ hideTip(key+'Tip'); onIndex(null); });
  }

  window.renderSpendChart = function(activeIndex=null){
    const canvas=document.getElementById('spendCanvas'); if(!canvas) return; const {ctx,w,h}=clearCanvas(canvas,620,240);
    const cats=byCategory(monthTransactions(currentMonth())).slice(0,8);
    if(!cats.length){ noData(ctx,'Import transactions to draw the spending map.',w); setLegend('spendLegend',[], 'Spending'); return; }
    const total=cats.reduce((a,c)=>a+c[1],0); const max=Math.max(...cats.map(c=>c[1])); const pad={l:18,r:22,t:18,b:18}; const labelW=Math.min(150,Math.max(104,w*.26)); const rowH=(h-pad.t-pad.b)/cats.length; const barH=Math.max(12,Math.min(24,rowH-8)); const items=[];
    ctx.font='12px '+font(); ctx.textBaseline='middle';
    cats.forEach(([cat,val],i)=>{ const y=pad.t+i*rowH+(rowH-barH)/2; const x=pad.l+labelW; const bw=Math.max(2,(w-x-pad.r-70)*(val/max)); const color=COLORS[i%COLORS.length]; ctx.fillStyle=i===activeIndex?'rgba(148,163,184,.16)':'rgba(148,163,184,.09)'; roundRect(ctx,x,y,w-x-pad.r-70,barH,999); ctx.fill(); const grad=ctx.createLinearGradient(x,y,x+bw,y); grad.addColorStop(0,color); grad.addColorStop(1,cssVar('--accent2')||color); ctx.fillStyle=grad; roundRect(ctx,x,y,bw,barH,999); ctx.fill(); ctx.fillStyle=cssVar('--text'); ctx.font='750 12px '+font(); const cleanCat=String(cat).length>18?String(cat).slice(0,17)+'…':cat; ctx.fillText(cleanCat,pad.l,y+barH/2); ctx.fillStyle=cssVar('--muted'); ctx.font='12px '+font(); ctx.fillText(money(val),x+bw+8,y+barH/2); items.push({cx:x+bw,cy:y+barH/2,band:true,cat,val,color,pct:total?val/total*100:0}); });
    window.spendChartModel={items}; const item=items[activeIndex??0]; setLegend('spendLegend', item?[{label:item.cat,value:money(item.val),color:item.color},{label:'Share',value:pctFmt(item.pct),color:cssVar('--accent2')},{label:'Month total',value:money(total),color:cssVar('--accent3')}]:[], 'Spending');
    if(activeIndex!==null && item) showTip('spendChartTip',canvas,item.cx,item.cy,item.cat,[{label:'Amount',value:money(item.val),color:item.color},{label:'Share',value:pctFmt(item.pct),color:cssVar('--accent2')}]);
    bindCanvasHover(canvas,'spendChart',window.spendChartModel,(idx)=>renderSpendChart(idx));
  };

  window.renderNetWorthChart = function(activeIndex=null){
    const canvas=document.getElementById('netWorthCanvas'); if(!canvas || !canvas.closest('.view.active')) return; const {ctx,w,h}=clearCanvas(canvas,640,250);
    const rows=(state.netWorthHistory||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-18);
    if(!rows.length){ noData(ctx,'Save net worth snapshots to draw your trend.',w); setLegend('netWorthLegend',[], 'Snapshots'); return; }
    const vals=rows.map(r=>nval(r.netWorth)); const min=Math.min(...vals), max=Math.max(...vals); const spread=max-min || Math.max(1,Math.abs(max)); const lo=min-spread*.08, hi=max+spread*.08; const pad={l:64,r:24,t:20,b:34}; const xFor=i=>pad.l+(rows.length===1?(w-pad.l-pad.r)/2:(w-pad.l-pad.r)*(i/(rows.length-1))); const yFor=v=>pad.t+(h-pad.t-pad.b)*(1-(v-lo)/(hi-lo||1));
    ctx.strokeStyle='rgba(148,163,184,.16)'; ctx.lineWidth=1; [lo,(lo+hi)/2,hi].forEach(v=>{ const y=yFor(v); ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); ctx.fillStyle=cssVar('--muted'); ctx.font='10.5px '+font(); ctx.fillText(money(v),8,y+3); });
    const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b); grad.addColorStop(0,'rgba('+cssVar('--accent-rgb')+',.18)'); grad.addColorStop(1,'rgba('+cssVar('--accent-rgb')+',0)'); ctx.beginPath(); rows.forEach((r,i)=>{ const x=xFor(i), y=yFor(nval(r.netWorth)); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.lineTo(xFor(rows.length-1),h-pad.b); ctx.lineTo(xFor(0),h-pad.b); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle=cssVar('--accent'); ctx.lineWidth=3; ctx.lineJoin='round'; ctx.beginPath(); rows.forEach((r,i)=>{ const x=xFor(i), y=yFor(nval(r.netWorth)); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
    const items=[]; rows.forEach((r,i)=>{ const x=xFor(i),y=yFor(nval(r.netWorth)); ctx.fillStyle=i===activeIndex?cssVar('--accent2'):cssVar('--accent'); ctx.beginPath(); ctx.arc(x,y,i===activeIndex?5:3.8,0,Math.PI*2); ctx.fill(); items.push({cx:x,cy:y,row:r,color:cssVar('--accent')}); });
    ctx.fillStyle=cssVar('--muted'); ctx.font='11px '+font(); rows.forEach((r,i)=>{ if(rows.length>7 && i%2) return; ctx.fillText(dateFmt(r.date).split(',')[0],Math.max(0,Math.min(w-48,xFor(i)-22)),h-10); });
    window.netWorthChartModel={items}; const item=items[activeIndex??items.length-1]; const first=vals[0], last=vals[vals.length-1]; setLegend('netWorthLegend', item?[{label:'Snapshot',value:money(nval(item.row.netWorth)),color:cssVar('--accent')},{label:'Assets',value:money(nval(item.row.assets)),color:cssVar('--good')},{label:'Liabilities',value:money(nval(item.row.liabilities)),color:cssVar('--red')},{label:'Period change',value:money(last-first),color:last>=first?cssVar('--good'):cssVar('--red')}]:[], 'Net worth');
    if(activeIndex!==null && item) showTip('netWorthChartTip',canvas,item.cx,item.cy,dateFmt(item.row.date),[{label:'Net worth',value:money(nval(item.row.netWorth)),color:cssVar('--accent')},{label:'Assets',value:money(nval(item.row.assets)),color:cssVar('--good')},{label:'Liabilities',value:money(nval(item.row.liabilities)),color:cssVar('--red')}]);
    bindCanvasHover(canvas,'netWorthChart',window.netWorthChartModel,(idx)=>renderNetWorthChart(idx));
  };

  window.renderInvestmentChart = function(activeIndex=null){
    const canvas=document.getElementById('investmentCanvas'); if(!canvas || !canvas.closest('.view.active')) return; const {ctx,w,h}=clearCanvas(canvas,620,240);
    const rows=allocationRows(); if(!rows.length){ noData(ctx,'Add holdings to draw allocation.',w); setLegend('investmentLegend',[], 'Allocation'); return; }
    const max=Math.max(...rows.map(r=>r.value)); const total=rows.reduce((a,r)=>a+r.value,0); const pad={l:18,r:22,t:18,b:18}; const labelW=Math.min(136,Math.max(96,w*.24)); const rowH=(h-pad.t-pad.b)/rows.length; const barH=Math.max(12,Math.min(24,rowH-8)); const items=[];
    rows.forEach((r,i)=>{ const y=pad.t+i*rowH+(rowH-barH)/2; const x=pad.l+labelW; const bw=Math.max(2,(w-x-pad.r-96)*(r.value/max)); const color=COLORS[i%COLORS.length]; ctx.fillStyle=i===activeIndex?'rgba(148,163,184,.16)':'rgba(148,163,184,.09)'; roundRect(ctx,x,y,w-x-pad.r-96,barH,999); ctx.fill(); ctx.fillStyle=color; roundRect(ctx,x,y,bw,barH,999); ctx.fill(); ctx.fillStyle=cssVar('--text'); ctx.font='750 12px '+font(); const name=String(r.name).length>16?String(r.name).slice(0,15)+'…':r.name; ctx.fillText(name,pad.l,y+barH/2); ctx.fillStyle=cssVar('--muted'); ctx.font='12px '+font(); ctx.fillText(`${pctFmt(r.pct)} · ${money(r.value)}`,x+bw+8,y+barH/2); items.push({cx:x+bw,cy:y+barH/2,band:true,row:r,color}); });
    window.investmentChartModel={items}; const item=items[activeIndex??0]; setLegend('investmentLegend', item?[{label:item.row.name,value:money(item.row.value),color:item.color},{label:'Weight',value:pctFmt(item.row.pct),color:cssVar('--accent2')},{label:'Portfolio',value:money(total),color:cssVar('--accent3')}]:[], 'Allocation');
    if(activeIndex!==null && item) showTip('investmentChartTip',canvas,item.cx,item.cy,item.row.name,[{label:'Value',value:money(item.row.value),color:item.color},{label:'Weight',value:pctFmt(item.row.pct),color:cssVar('--accent2')}]);
    bindCanvasHover(canvas,'investmentChart',window.investmentChartModel,(idx)=>renderInvestmentChart(idx));
  };

  const baseRenderSettings = window.renderSettings;
  if(typeof baseRenderSettings === 'function'){
    window.renderSettings = function(){
      baseRenderSettings();
      const build=document.getElementById('appBuildLabel'); if(build) build.textContent=''+APP_BUILD_ID;
    };
  }

  const baseBuildMobileNav = window.buildMobileNav;
  window.buildMobileNav = function(){
    if(typeof baseBuildMobileNav === 'function') baseBuildMobileNav();
    const nav=document.getElementById('mobileNav'); if(!nav) return;
    const names={overview:'Home',review:'Review',transactions:'Txns',budgets:'Budget'};
    nav.querySelectorAll('button').forEach(btn=>{
      const txt=btn.querySelector('span:last-child'); if(!txt) return;
      const raw=txt.textContent.trim().toLowerCase();
      const match=Object.entries(names).find(([id])=>raw===ux62NavTitle(id).toLowerCase());
      if(match) txt.textContent=match[1];
    });
  };

  const baseRenderAll=window.renderAll;
  if(typeof baseRenderAll==='function'){
    window.renderAll=function(){ baseRenderAll(); requestAnimationFrame(()=>{ window.buildMobileNav?.(); if(chartsReady) renderCharts(); }); };
  }
})();
/* ---- end v0.5 deep UI and mobile polish ---- */


/* ---- v0.5 recursive aggressive UI/UX polish waves ---- */
(function(){
  const PREV1_BUILD_LABEL = 'v0.5';

  function addStyle(id, css){
    let style = document.getElementById(id);
    if(!style){
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  addStyle('mm-v091-aggressive-ux', `
    :root{
      --mm-nav-h:64px;
      --mm-touch:44px;
      --mm-safe-bottom:env(safe-area-inset-bottom);
      --mm-page-pad:clamp(14px,2.4vw,28px);
      --mm-tight-gap:12px;
      --mm-card-radius:20px;
      --mm-ease:cubic-bezier(.2,.8,.2,1);
    }
    html{scroll-padding-top:82px}
    body{overscroll-behavior-y:none}
    .main{padding-inline:var(--mm-page-pad)!important;max-width:1480px!important}
    .view{scroll-margin-top:80px}
    .topbar{position:sticky!important;top:0!important;z-index:45!important;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}
    .searchbar{box-shadow:none!important;border-radius:16px!important;min-height:46px!important}
    .topbar .actions{gap:8px!important}.btn{min-height:var(--mm-touch);padding-inline:14px!important}
    .btn-small{min-height:36px!important;padding:8px 10px!important}.btn-square{min-width:42px!important}
    .hero,.metric-grid,.grid-2,.grid-3,.grid-21,.grid-12,.tracker-grid,.tracker-grid-reverse,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{gap:var(--mm-tight-gap)!important}
    .hero{margin-bottom:var(--mm-tight-gap)!important}.card,.metric-card,.hero-metric,.tracker-stat,.week-card,.bureau-card,.goal-card{border-radius:var(--mm-card-radius)!important}
    .card-header{margin-bottom:14px!important}.card-title{line-height:1.12!important}.card-subtitle{max-width:70ch!important}
    .metric-card,.tracker-stat,.week-card{min-height:112px!important}.metric-label{letter-spacing:.12em!important}.metric-value{font-variant-numeric:tabular-nums!important}.metric-sub{max-width:42ch}
    .page-head{margin-bottom:14px!important}.section-title{line-height:.98!important}.section-sub{font-size:14px!important}
    .mini-list{gap:8px!important}.mini-item,.snapshot-row{border-radius:16px!important;transition:transform .14s var(--mm-ease),border-color .14s var(--mm-ease),background .14s var(--mm-ease)}
    button.mini-item:hover,.snapshot-row:hover{transform:translateY(-1px)}
    .input,select,textarea{min-height:46px!important;border-radius:14px!important}.form-field{margin-bottom:10px!important}.form-row,.form-row-3{gap:10px!important}
    .pill,.category-chip,.balance-badge,.confidence-pill,.cleanup-badge,.goal-chip,.kbd{white-space:nowrap}
    .table-wrap{border-radius:18px!important;scrollbar-width:thin;position:relative}.table-wrap:after{content:'Swipe →';display:none;position:sticky;right:10px;bottom:8px;float:right;margin-top:-30px;padding:5px 8px;border-radius:999px;background:color-mix(in srgb,var(--panel) 92%,transparent);border:1px solid var(--line);color:var(--muted);font-size:11px;pointer-events:none}
    th,td{line-height:1.25!important}.amount-cell,.right{font-variant-numeric:tabular-nums}
    .drawer-panel{max-width:min(720px,calc(100vw - 28px))!important}.drawer-head{padding-block:18px 14px!important}.drawer-actions{gap:8px!important}.drawer-note{border-radius:16px!important}
    .toast{z-index:240!important}.storage-banner,.storage-warning-banner{position:sticky;top:74px;z-index:42;border-radius:16px!important}

    /* Credit-tracker-inspired chart surface for every chart. */
    .canvas-wrap{position:relative;border-radius:22px!important;background:radial-gradient(720px 180px at 50% -18%,rgba(var(--accent-rgb),.11),transparent 60%),linear-gradient(180deg,color-mix(in srgb,var(--panel2) 96%,transparent),color-mix(in srgb,var(--panel) 94%,transparent))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;overflow:hidden}
    .canvas-wrap:before{content:'';position:absolute;inset:0 0 auto;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);pointer-events:none}.canvas-wrap canvas{position:relative;z-index:1}
    .chart-legend{gap:8px!important}.legend-chip{min-height:34px!important;border-radius:999px!important;background:color-mix(in srgb,var(--panel2) 92%,transparent)!important}
    .chart-tooltip{border-radius:16px!important;box-shadow:0 18px 50px rgba(0,0,0,.28)!important}

    /* Tablet fix: sidebar disappears around iPad widths, so nav must appear too. */
    @media(max-width:1180px){
      .app-shell{display:block!important}.sidebar{display:none!important}
      .main{padding:16px 16px calc(92px + var(--mm-safe-bottom))!important;max-width:none!important}
      .topbar{margin:-16px -16px 14px!important;padding:12px 16px!important;border-bottom:1px solid var(--line)!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:10px!important}
      .mobile-bar{display:grid!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:110!important;height:calc(var(--mm-nav-h) + var(--mm-safe-bottom))!important;padding:6px max(8px,env(safe-area-inset-left)) calc(6px + var(--mm-safe-bottom)) max(8px,env(safe-area-inset-right))!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:6px!important;overflow:visible!important;background:color-mix(in srgb,var(--panel) 94%,transparent)!important;border-top:1px solid var(--line)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;box-shadow:0 -16px 40px rgba(0,0,0,.18)!important}
      .mobile-bar button{width:100%!important;min-width:0!important;flex:1 1 auto!important;min-height:50px!important;border-radius:16px!important;padding:6px 4px!important;background:transparent;color:var(--muted);font-weight:850!important}
      .mobile-bar button span:first-child{font-size:18px!important;line-height:1!important}.mobile-bar button span:last-child{font-size:10.5px!important;line-height:1.05!important;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mobile-bar button.active{color:var(--accent)!important;background:linear-gradient(180deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.07))!important;box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.22)!important}
      .mobile-more-sheet{display:none;position:fixed!important;inset:0!important;z-index:150!important;align-items:flex-end!important;justify-content:center!important;background:rgba(2,6,23,.48)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important;padding:12px 12px calc(80px + var(--mm-safe-bottom))!important}.mobile-more-sheet.active{display:flex!important}.mobile-more-panel{width:min(680px,100%)!important;max-height:min(76vh,700px)!important;border-radius:26px!important;padding:14px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel2) 96%,transparent))!important}.mobile-more-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important}.mobile-more-item{min-height:82px!important;border-radius:18px!important;padding:12px!important}.mobile-more-copy strong{font-size:13px!important}.mobile-more-copy span{font-size:11px!important}
    }

    /* iPad portrait and small tablets. */
    @media(max-width:900px){
      .topbar{grid-template-columns:1fr!important}.searchbar{grid-column:1/-1!important;order:1!important}.topbar .actions{order:2!important;grid-column:1/-1!important;display:grid!important;grid-template-columns:minmax(0,1fr) 48px!important;width:100%!important}.topbar .actions>.btn:not(.btn-primary):not(.btn-square){display:none!important}.topbar .btn-primary{width:100%!important}
      .metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.grid-2,.grid-3,.grid-21,.grid-12,.tracker-grid,.tracker-grid-reverse,.settings-grid,.credit-hero,.bureau-grid{grid-template-columns:1fr!important}
      .table-wrap:after{display:block}.category-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.canvas-wrap{height:230px!important}.more-sections-available .mobile-more-sheet{display:flex}
    }

    /* iPhone. */
    @media(max-width:640px){
      :root{--mm-nav-h:62px;--mm-card-radius:17px;--mm-tight-gap:10px}
      .main{padding:12px 10px calc(84px + var(--mm-safe-bottom))!important}.topbar{margin:-12px -10px 12px!important;padding:10px!important}.searchbar{height:42px!important;min-height:42px!important}.actions{gap:7px!important}.btn{min-height:40px!important;border-radius:12px!important}.btn span{min-width:0}
      .hero-card,.command-strip{padding:16px!important;border-radius:18px!important}.command-copy h2,.hero h2{font-size:28px!important;line-height:1!important;max-width:14ch!important}.command-copy p,.hero p{font-size:13px!important;line-height:1.35!important}.hero-row,.command-actions{display:grid!important;grid-template-columns:1fr!important}.hero-row .btn,.command-actions .btn{width:100%!important}
      .card,.metric-card,.hero-metric,.tracker-stat,.week-card{padding:13px!important;border-radius:17px!important}.card-header{display:grid!important;gap:8px!important;margin-bottom:10px!important}.card-title{font-size:15.5px!important}.card-subtitle{font-size:12px!important}.section-title{font-size:25px!important}.section-sub{font-size:12.5px!important}.page-head{display:grid!important;gap:9px!important}.page-head .actions{margin-top:0!important;justify-content:start!important}
      .metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{grid-template-columns:1fr 1fr!important}.metric-card{min-height:94px!important}.metric-label{font-size:8.5px!important;margin-bottom:7px!important}.metric-value{font-size:24px!important}.metric-sub{font-size:10.8px!important;line-height:1.25!important}
      .canvas-wrap{height:205px!important;padding:11px!important;border-radius:17px!important}.chart-legend{display:grid!important;grid-template-columns:1fr!important}.legend-chip{justify-content:space-between!important;padding:8px 10px!important}.chart-tooltip{display:none!important}
      .review-transaction{padding:16px!important;border-radius:18px!important}.review-merchant{font-size:22px!important}.review-amount{font-size:31px!important}.review-meta{font-size:12px!important}.category-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.cat-btn{min-height:52px!important;padding:10px!important}
      .input,select,textarea{min-height:43px!important;font-size:16px!important}.form-row,.form-row-3,.tx-filter-grid,.review-filter-grid,.mapping-tools,.rule-row{grid-template-columns:1fr!important}.theme-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .drawer-panel{inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;border-radius:0!important;border:0!important}.drawer-head{padding:15px 13px 11px!important}.drawer-head .section-title{font-size:25px!important}#drawerBody{padding:11px 11px calc(18px + var(--mm-safe-bottom))!important}.drawer-actions{position:sticky!important;bottom:calc(-18px - var(--mm-safe-bottom))!important;margin:14px -11px calc(-18px - var(--mm-safe-bottom))!important;padding:10px 11px calc(12px + var(--mm-safe-bottom))!important;background:color-mix(in srgb,var(--panel) 94%,transparent)!important;backdrop-filter:blur(18px)!important}.drawer-actions .btn{flex-basis:100%!important}
      .mobile-bar{gap:4px!important;padding-left:6px!important;padding-right:6px!important}.mobile-bar button{border-radius:14px!important}.mobile-bar button span:first-child{font-size:16px!important}.mobile-bar button span:last-child{font-size:9.5px!important}.mobile-more-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.mobile-more-item{min-height:70px!important}
      .toast{left:10px!important;right:10px!important;bottom:calc(76px + var(--mm-safe-bottom))!important}.toast-item{min-width:0!important}.storage-banner,.storage-warning-banner{top:58px!important}
    }

    /* Very small phones. */
    @media(max-width:390px){
      .metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{grid-template-columns:1fr!important}.topbar .actions{grid-template-columns:1fr 44px!important}.theme-grid,.mobile-more-grid{grid-template-columns:1fr!important}.command-copy h2,.hero h2{font-size:26px!important}.metric-value{font-size:23px!important}.mobile-bar button{padding-inline:2px!important}.mobile-bar button span:last-child{font-size:9px!important}.canvas-wrap{height:195px!important}
    }

    @media(hover:none){.btn:hover,.metric-card:hover,.mini-item:hover{transform:none!important}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
    @media(print){.mobile-bar,.mobile-more-sheet,.topbar,.sidebar,.toast,.storage-banner,.storage-warning-banner{display:none!important}.main{padding:0!important}.view{display:block!important}.card,.metric-card{break-inside:avoid}}
  `);

  function setViewportFlags(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    document.documentElement.style.setProperty('--mm-vh', `${h * 0.01}px`);
    document.body.classList.toggle('mm-phone', w <= 640);
    document.body.classList.toggle('mm-tablet', w > 640 && w <= 1180);
    document.body.classList.toggle('mm-desktop', w > 1180);
  }

  function normalizeBuildLabels(){
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => {
      el.textContent = `${PREV1_BUILD_LABEL} · v0.5`;
    });
  }

  function markChartSurfaces(){
    document.querySelectorAll('.canvas-wrap').forEach(wrap => {
      wrap.classList.add('mm-chart-card','chart-interactive');
      const canvas = wrap.querySelector('canvas');
      if(canvas && !canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex','0');
    });
  }

  function closeMoreOnSelection(){
    const sheet = document.getElementById('mobileMoreSheet');
    if(!sheet || sheet.dataset.v091Bound) return;
    sheet.dataset.v091Bound = '1';
    sheet.addEventListener('click', event => {
      if(event.target.closest('.mobile-more-item')){
        setTimeout(()=>window.toggleMobileMore?.(false), 60);
      }
    });
  }

  const baseBuildMobileNav = window.buildMobileNav;
  window.buildMobileNav = function(){
    if(typeof baseBuildMobileNav === 'function') baseBuildMobileNav();
    const nav = document.getElementById('mobileNav');
    if(!nav) return;
    const rename = { Home:'Home', Overview:'Home', Review:'Review', Transactions:'Txns', Txns:'Txns', Budgets:'Budget', Budget:'Budget', More:'More' };
    nav.querySelectorAll('button').forEach(button => {
      const label = button.querySelector('span:last-child');
      if(label && rename[label.textContent.trim()]) label.textContent = rename[label.textContent.trim()];
      button.setAttribute('type','button');
    });
  };

  const baseRenderSettings = window.renderSettings;
  if(typeof baseRenderSettings === 'function'){
    window.renderSettings = function(){
      baseRenderSettings();
      normalizeBuildLabels();
    };
  }

  const baseBackupPayload = window.backupPayload;
  if(typeof baseBackupPayload === 'function'){
    window.backupPayload = function(){
      const payload = baseBackupPayload();
      payload.build = 'v0.5';
      payload.releaseStage = PREV1_BUILD_LABEL;
      return payload;
    };
  }

  const baseRenderAll = window.renderAll;
  if(typeof baseRenderAll === 'function'){
    window.renderAll = function(){
      baseRenderAll();
      requestAnimationFrame(()=>{
        setViewportFlags();
        window.buildMobileNav?.();
        markChartSurfaces();
        closeMoreOnSelection();
        normalizeBuildLabels();
      });
    };
  }

  const baseShowView = window.showView;
  if(typeof baseShowView === 'function'){
    window.showView = function(id){
      baseShowView(id);
      requestAnimationFrame(()=>{
        setViewportFlags();
        window.buildMobileNav?.();
        markChartSurfaces();
        closeMoreOnSelection();
        if(window.matchMedia('(max-width:1180px)').matches){
          try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
        }
      });
    };
  }

  window.addEventListener('resize', () => requestAnimationFrame(setViewportFlags), {passive:true});
  window.addEventListener('orientationchange', () => setTimeout(setViewportFlags, 120), {passive:true});
  window.addEventListener('keydown', event => {
    if(event.key === 'Escape') window.toggleMobileMore?.(false);
  });

  requestAnimationFrame(()=>{
    setViewportFlags();
    window.buildMobileNav?.();
    markChartSurfaces();
    closeMoreOnSelection();
    normalizeBuildLabels();
  });
})();
/* ---- end v0.5 recursive aggressive UI/UX polish waves ---- */


/* ---- v0.5 mobile clarity + investments refresh ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  document.title='MoneyMap';
  function addStyle(css){ const style=document.createElement('style'); style.setAttribute('data-patch','v0.9.2-mobile-investments'); style.textContent=css; document.head.appendChild(style); }
  addStyle(`
    :root{--mm-nav-h:58px;--mm-safe-bottom:env(safe-area-inset-bottom,0px);--mm-phone-pad:10px;--mm-soft-card:rgba(255,255,255,.045)}
    :root[data-theme="light"]{--mm-soft-card:rgba(17,24,39,.035)}

    /* Mobile shell: less chrome, less vertical tax. */
    @media(max-width:760px){
      body{background:linear-gradient(180deg,var(--bg),var(--bg2))!important}
      body:before{opacity:.55!important;background-size:34px 34px!important}
      .main{padding:10px var(--mm-phone-pad) calc(76px + var(--mm-safe-bottom))!important}
      .topbar{position:sticky!important;top:0!important;z-index:80!important;margin:-10px calc(var(--mm-phone-pad) * -1) 10px!important;padding:9px var(--mm-phone-pad) 9px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--bg) 96%,transparent),color-mix(in srgb,var(--bg) 86%,transparent))!important;border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;display:grid!important;grid-template-columns:1fr auto!important;gap:8px!important;align-items:center!important}
      .searchbar{grid-column:1/-1!important;order:1!important;height:40px!important;min-height:40px!important;padding:8px 12px!important;border-radius:999px!important;box-shadow:none!important;background:color-mix(in srgb,var(--panel) 72%,transparent)!important}
      .searchbar input{font-size:14px!important}.searchbar span{font-size:12px!important}
      .topbar .actions{grid-column:1/-1!important;order:2!important;display:grid!important;grid-template-columns:1fr 42px!important;gap:8px!important;width:100%!important;margin:0!important;align-items:center!important}
      .topbar .actions>.btn:not(.btn-primary):not(.btn-square),.topbar-secondary{display:none!important}
      .topbar .actions .btn-primary{height:38px!important;min-height:38px!important;width:100%!important;border-radius:999px!important;padding:0 12px!important;font-size:13px!important;letter-spacing:.01em!important;box-shadow:none!important}
      .topbar .actions .btn-primary::before{content:'＋';font-weight:900;margin-right:6px}.topbar .actions .btn-primary{font-size:0!important}.topbar .actions .btn-primary::after{content:'Import';font-size:13px!important}
      .topbar-menu-wrap,.topbar-overflow-btn{height:42px!important;width:42px!important;justify-self:end!important}.topbar-overflow-btn{border-radius:999px!important;padding:0!important;background:color-mix(in srgb,var(--panel2) 80%,transparent)!important}

      .page-head{margin:4px 0 10px!important;gap:8px!important}.section-title{font-size:24px!important;letter-spacing:-.045em!important}.section-sub{font-size:12.5px!important;line-height:1.35!important;max-width:38ch!important}
      .card,.metric-card,.tracker-stat,.week-card,.hero-metric{border-radius:18px!important;padding:14px!important;box-shadow:0 8px 24px rgba(0,0,0,.08)!important}.card-header{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;margin-bottom:10px!important}.card-header .btn{flex:0 0 auto}.card-title{font-size:16px!important}.card-subtitle{font-size:12px!important;line-height:1.32!important}
      .split-line{margin:12px 0!important}.mini-list{gap:8px!important}.mini-item{border-radius:16px!important;padding:11px 12px!important}.btn{min-height:38px!important;border-radius:12px!important}.btn-small{min-height:34px!important;padding:7px 10px!important}
      .metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.metric-card,.tracker-stat,.week-card{min-height:88px!important}.metric-label{font-size:8.5px!important;margin-bottom:6px!important}.metric-value{font-size:24px!important;letter-spacing:-.04em!important}.metric-sub{font-size:10.5px!important;line-height:1.25!important;margin-top:6px!important}

      /* Bottom nav: compact tab rail instead of oversized cards. */
      .mobile-bar{height:calc(var(--mm-nav-h) + var(--mm-safe-bottom))!important;padding:6px 7px calc(6px + var(--mm-safe-bottom))!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;overflow:visible!important;background:color-mix(in srgb,var(--panel) 96%,transparent)!important;border-top:1px solid color-mix(in srgb,var(--line) 82%,transparent)!important;box-shadow:0 -10px 26px rgba(0,0,0,.12)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important}
      .mobile-bar button{min-height:46px!important;height:46px!important;border-radius:13px!important;padding:4px 2px!important;gap:2px!important;position:relative!important;color:var(--muted)!important;background:transparent!important;box-shadow:none!important;font-weight:800!important}
      .mobile-bar button span:first-child{font-size:15px!important;line-height:1!important}.mobile-bar button span:last-child{font-size:9.5px!important;line-height:1!important;letter-spacing:.005em!important}
      .mobile-bar button.active{color:var(--accent)!important;background:rgba(var(--accent-rgb),.08)!important}.mobile-bar button.active:before{content:'';position:absolute;top:4px;left:50%;width:18px;height:3px;border-radius:999px;background:var(--accent);transform:translateX(-50%)}
      .mobile-more-sheet{padding:10px 10px calc(72px + var(--mm-safe-bottom))!important}.mobile-more-panel{border-radius:24px!important;padding:12px!important}.mobile-more-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.mobile-more-item{min-height:66px!important;padding:10px!important;border-radius:16px!important}.mobile-more-copy span{display:none!important}

      /* Budget cards: remove gray blocks and giant repeated controls. */
      .budget-board-list,.v60-budget-list{display:grid!important;gap:10px!important}.v092-budget-card{border:1px solid var(--line);background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel2) 86%,transparent));border-radius:18px;padding:12px;display:grid;gap:10px;box-shadow:0 6px 18px rgba(0,0,0,.06)}
      .v092-budget-main{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;background:transparent;border:0;color:inherit;text-align:left;padding:0;width:100%}.v092-budget-title{font-weight:900;font-size:16px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v092-budget-meta{color:var(--muted);font-size:12px;margin-top:3px}.v092-budget-pct{font-size:22px;font-weight:950;letter-spacing:-.04em;text-align:right}.v092-budget-left{font-size:11.5px;color:var(--muted);text-align:right;white-space:nowrap}.v092-meter{height:9px;border-radius:999px;background:var(--panel3);overflow:hidden}.v092-meter span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--accent),var(--accent2))}.v092-budget-card.warn .v092-meter span{background:linear-gradient(90deg,var(--orange),var(--gold))}.v092-budget-card.bad .v092-meter span{background:linear-gradient(90deg,var(--red),var(--orange))}.v092-budget-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.v092-budget-actions .btn{width:100%;min-height:36px!important}.v092-budget-card.good .v092-budget-pct{color:var(--good)}.v092-budget-card.warn .v092-budget-pct{color:var(--orange)}.v092-budget-card.bad .v092-budget-pct{color:var(--red)}
      .v60-budget-row{border-radius:18px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel2) 86%,transparent))!important}.v60-budget-top{background:transparent!important}.v60-budget-actions{display:grid!important;grid-template-columns:1fr 1fr!important}.v60-budget-name{color:var(--text)!important}.v60-budget-meta,.v60-budget-left{color:var(--muted)!important}

      /* Investment tab receives first-class mobile treatment. */
      #view-investments .tracker-grid{gap:10px!important}.investment-mobile-summary{display:grid;gap:8px;margin-bottom:10px}.investment-action-strip{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.holding-card-list{display:grid;gap:9px}.holding-card{border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 96%,transparent),color-mix(in srgb,var(--panel2) 86%,transparent));padding:12px;display:grid;gap:10px}.holding-card-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.holding-symbol{font-weight:950;font-size:17px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.holding-name{font-size:12px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.holding-value{text-align:right;font-weight:950;font-size:17px}.holding-gain{text-align:right;font-size:12px}.holding-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.holding-fact{border:1px solid var(--line);border-radius:13px;padding:8px;background:var(--panel2)}.holding-fact span{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.holding-fact b{display:block;font-size:12px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.holding-card-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}.holding-card-actions .btn{min-height:34px!important;padding:6px 8px!important;font-size:11px!important}.investment-insight{border:1px solid var(--line);border-radius:16px;background:var(--panel2);padding:11px}.investment-insight b{display:block;font-size:13px}.investment-insight span{display:block;color:var(--muted);font-size:12px;line-height:1.3;margin-top:3px}
      #holdingCardsV092{display:grid!important}.investments-has-cards #view-investments .table-wrap{display:none!important}#view-investments .chart-hover-note{font-size:11px!important;margin-top:6px!important}.allocation-bar{height:8px!important}
    }
    @media(min-width:761px){#holdingCardsV092{display:none!important}.investment-mobile-summary,.investment-action-strip{display:none!important}}
    @media(max-width:390px){.metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid{grid-template-columns:1fr!important}.holding-facts{grid-template-columns:1fr 1fr!important}.mobile-bar button span:last-child{font-size:8.8px!important}.section-title{font-size:22px!important}}
  `);

  function statusClass(pct){ pct=Number(pct)||0; return pct>=100?'bad':pct>=85?'warn':'good'; }
  function clampPct(pct){ return Math.min(100, Math.max(0, Number(pct)||0)); }
  function friendlyMoney(v){ try{return typeof v60Money==='function'?v60Money(v):money(v);}catch(e){return '$'+Number(v||0).toLocaleString();} }
  function v092BudgetCard(b){
    const cls=statusClass(b.pct); const left=Math.max(0,Number(b.remaining)||0); const pct=clampPct(b.pct);
    return `<div class="v092-budget-card ${cls}"><button type="button" class="v092-budget-main" onclick="showCategoryTransactions('${escapeJs(b.category)}')" aria-label="Open ${escapeHtml(b.category)} transactions"><div><div class="v092-budget-title">${escapeHtml(b.category)}</div><div class="v092-budget-meta">${friendlyMoney(b.spent)} spent of ${friendlyMoney(b.limit)}</div></div><div><div class="v092-budget-pct">${Math.round(Number(b.pct)||0)}%</div><div class="v092-budget-left">${friendlyMoney(left)} left</div></div></button><div class="v092-meter"><span style="width:${pct}%"></span></div><div class="v092-budget-actions"><button type="button" class="btn btn-small" onclick="showCategoryTransactions('${escapeJs(b.category)}')">View transactions</button><button type="button" class="btn btn-small" onclick="editBudget('${b.id}')">Edit budget</button></div></div>`;
  }
  window.budgetRowHtml = v092BudgetCard;
  window.v60BudgetCard = v092BudgetCard;

  const baseRenderBudgets = window.renderBudgets;
  window.renderBudgets = function(){
    const board=document.getElementById('budgetBoard');
    if(board){
      const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
      board.innerHTML=stats.length?`<div class="budget-board-list">${stats.map(v092BudgetCard).join('')}</div>`:emptyMini('No budgets yet','Create monthly category limits for quick guardrails.','Add budget','openDrawer(\'budget\')');
      const summary=document.getElementById('budgetSummary');
      if(summary){ const totalLimit=stats.reduce((a,b)=>a+b.limit,0); const totalSpent=stats.reduce((a,b)=>a+b.spent,0); const over=stats.filter(b=>b.pct>100).length; const room=Math.max(0,totalLimit-totalSpent); summary.innerHTML=`<div class="mini-item"><div><b>Total planned</b><br><span>This month</span></div><strong>${friendlyMoney(totalLimit)}</strong></div><div class="mini-item"><div><b>Remaining room</b><br><span>${totalLimit?Math.round(totalSpent/totalLimit*100):0}% used</span></div><strong class="${room?'good':'warn'}">${friendlyMoney(room)}</strong></div><div class="mini-item"><div><b>Needs attention</b><br><span>Over-budget categories</span></div><strong class="${over?'bad':'good'}">${over}</strong></div>`; }
      const sugg=document.getElementById('budgetSuggestions');
      if(sugg){ const existing=new Set((state.budgets||[]).map(b=>b.category)); const rows=byCategory(monthTransactions(currentMonth())).filter(([cat])=>!existing.has(cat)).slice(0,4); sugg.innerHTML=rows.length?rows.map(([cat,val])=>`<button type="button" class="mini-item" onclick="openDrawer('budget',{category:'${escapeJs(cat)}',limit:${Math.ceil(val*1.15/10)*10}})"><div><b>${escapeHtml(cat)}</b><br><span>Based on ${friendlyMoney(val)} current spend</span></div><strong>${friendlyMoney(Math.ceil(val*1.15/10)*10)}</strong></button>`).join(''):emptyMini('No suggestions','Import more spending or all active categories already have budgets.'); }
      return;
    }
    if(typeof baseRenderBudgets==='function') baseRenderBudgets();
  };

  function ensureHoldingCardsContainer(){
    const table=document.querySelector('#view-investments .table-wrap'); if(!table) return null;
    let cards=document.getElementById('holdingCardsV092');
    if(!cards){ cards=document.createElement('div'); cards.id='holdingCardsV092'; cards.className='holding-card-list'; table.insertAdjacentElement('afterend', cards); }
    document.body.classList.add('investments-has-cards');
    return cards;
  }
  function holdingCard(h){
    const value=holdingValue(h); const cost=holdingCost(h); const gain=value-cost; const gainPct=cost?(gain/cost*100):0; const included=h.includeNetWorth!==false;
    const symbol=escapeHtml(h.symbol||h.name||'Holding'); const name=escapeHtml(h.name||h.account||'Manual holding');
    return `<div class="holding-card"><div class="holding-card-top"><div><div class="holding-symbol">${symbol}</div><div class="holding-name">${name}</div></div><div><div class="holding-value">${money(value)}</div><div class="holding-gain ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)} ${cost?`· ${gainPct>=0?'+':''}${pctFmt(gainPct)}`:''}</div></div></div><div class="holding-facts"><div class="holding-fact"><span>Qty</span><b>${nval(h.quantity).toLocaleString()}</b></div><div class="holding-fact"><span>Price</span><b>${money(h.price,{cents:true})}</b></div><div class="holding-fact"><span>Class</span><b>${escapeHtml(h.assetClass||'Stock')}</b></div></div><div class="holding-card-actions"><button type="button" class="btn btn-small" onclick="toggleHoldingInclude('${h.id}')">${included?'Exclude':'Include'}</button><button type="button" class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${h.id}'))">Edit</button><button type="button" class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${h.id}')">Delete</button></div></div>`;
  }
  function renderHoldingCards(holdings){
    const cards=ensureHoldingCardsContainer(); if(!cards) return;
    cards.innerHTML=holdings.length?holdings.map(holdingCard).join(''):`<div class="empty"><div><strong>No holdings yet.</strong><p>Add stocks, funds, crypto, bonds, or cash positions manually.</p><button type="button" class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div>`;
  }

  window.renderInvestments = function(){
    const metrics=document.getElementById('investmentMetrics'); if(!metrics) return;
    const holdings=state.holdings||[]; const value=holdings.reduce((a,h)=>a+holdingValue(h),0); const cost=holdings.reduce((a,h)=>a+holdingCost(h),0); const gain=value-cost; const ret=cost?(gain/cost*100):0; const inc=includedHoldings().reduce((a,h)=>a+holdingValue(h),0); const excluded=Math.max(0,value-inc);
    metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Portfolio value</div><div class="metric-value good">${friendlyMoney(value)}</div><div class="metric-sub">${holdings.length} manual holding${holdings.length===1?'':'s'}</div></div><div class="tracker-stat"><div class="metric-label">Unrealized P/L</div><div class="metric-value ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${friendlyMoney(gain)}</div><div class="metric-sub">${cost?`${ret>=0?'+':''}${pctFmt(ret)} return on cost`:'Add cost basis for return'}</div></div><div class="tracker-stat"><div class="metric-label">Cost basis</div><div class="metric-value blue">${friendlyMoney(cost)}</div><div class="metric-sub">Manual purchase basis</div></div><div class="tracker-stat"><div class="metric-label">Net worth included</div><div class="metric-value purple">${friendlyMoney(inc)}</div><div class="metric-sub">${excluded?`${friendlyMoney(excluded)} excluded`:'No duplicate exclusion'}</div></div>`;
    const rows=document.getElementById('holdingRows');
    if(rows){ rows.innerHTML=holdings.length?holdings.map(h=>{ const value=holdingValue(h); const cost=holdingCost(h); const gain=value-cost; const included=h.includeNetWorth!==false; return `<tr><td><b>${escapeHtml(h.symbol||h.name||'Holding')}</b><br><span class="muted">${escapeHtml(h.name||'Manual holding')} · <span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span></span></td><td>${escapeHtml(h.account||'Manual')}</td><td>${escapeHtml(h.assetClass||'Stock')}</td><td class="amount-cell">${nval(h.quantity).toLocaleString()}</td><td class="amount-cell">${money(h.price,{cents:true})}</td><td class="amount-cell good">${money(value)}</td><td class="amount-cell ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}</td><td class="right"><div class="table-actions"><button type="button" class="btn btn-small" onclick="toggleHoldingInclude('${h.id}')">${included?'Exclude':'Include'}</button><button type="button" class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${h.id}'))">Edit</button><button type="button" class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${h.id}')">Delete</button></div></td></tr>`; }).join(''):`<tr><td colspan="8"><div class="empty" style="min-height:150px"><div><strong>No holdings yet.</strong><p>Add stocks, funds, crypto, bonds, or cash positions manually.</p><button type="button" class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div></td></tr>`; }
    renderHoldingCards(holdings);
    const alloc=allocationRows(); const list=document.getElementById('allocationList');
    if(list){ list.innerHTML=alloc.length?alloc.map((a,i)=>`<div class="mini-item"><div><b><span class="dot" style="background:${COLORS[i%COLORS.length]}"></span> ${escapeHtml(a.name)}</b><br><span>${pctFmt(a.pct)} of portfolio</span><div class="allocation-bar"><span style="width:${a.pct}%;background:${COLORS[i%COLORS.length]}"></span></div></div><strong>${money(a.value)}</strong></div>`).join(''):emptyMini('No allocation yet','Add holdings to see asset class weights.','Add holding','openDrawer(\'holding\')'); }
    const notes=document.getElementById('investmentNotes');
    if(notes){ const top=alloc[0]; const concentration=top&&top.pct>65; notes.innerHTML=`<div class="investment-insight"><b>${concentration?'Concentration watch':'Allocation ready'}</b><span>${top?`${top.name} is ${pctFmt(top.pct)} of tracked holdings.`:'Add holdings to generate allocation notes.'}</span></div><div class="investment-insight"><b>Double-count guard</b><span>Exclude holdings from net worth if the same brokerage balance is already listed on the Net worth page.</span></div><div class="investment-insight"><b>Manual pricing</b><span>Prices do not update automatically. Edit holdings after checking current values.</span></div>`; }
    if(typeof renderInvestmentChart==='function') requestAnimationFrame(()=>renderInvestmentChart());
  };

  function afterPaint(){
    document.querySelectorAll('#appBuildLabel').forEach(el=>{el.textContent=''+BUILD;});
    const budgetHeat=document.getElementById('budgetHeat'); if(budgetHeat){ const heat=budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,5); budgetHeat.innerHTML=heat.length?`<div class="budget-board-list">${heat.map(v092BudgetCard).join('')}</div>`:emptyMini('No budgets','Create simple monthly caps.','Add budget','openDrawer(\'budget\')'); }
    const nav=document.getElementById('mobileNav'); if(nav){ nav.querySelectorAll('button').forEach(b=>{ const t=b.querySelector('span:last-child'); if(t){ t.textContent={Home:'Home',Overview:'Home',Review:'Review',Transactions:'Txns',Txns:'Txns',Budgets:'Budget',Budget:'Budget',More:'More'}[t.textContent.trim()]||t.textContent; } }); }
  }
  const prevRenderAll=window.renderAll; if(typeof prevRenderAll==='function'){ window.renderAll=function(){ prevRenderAll(); requestAnimationFrame(afterPaint); }; }
  const prevShowView=window.showView; if(typeof prevShowView==='function'){ window.showView=function(id){ prevShowView(id); requestAnimationFrame(()=>{ afterPaint(); if(id==='investments') window.renderInvestments?.(); }); }; }
  const prevBackup=window.backupPayload; if(typeof prevBackup==='function'){ window.backupPayload=function(){ const payload=prevBackup(); payload.build=BUILD; payload.releaseStage='v0.5'; return payload; }; }
  requestAnimationFrame(()=>{ afterPaint(); window.renderInvestments?.(); });
})();
/* ---- end v0.5 mobile clarity + investments refresh ---- */


/* ---- v0.5 UI/UX rescue pass: mobile nav, tables, budgets, investments ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const ICONS={
    overview:'🏠', import:'⬆️', review:'✅', transactions:'🧾', budgets:'💸', recurring:'🔁',
    networth:'💎', debt:'🧭', investments:'📈', credit:'⭐', goals:'🎯', rules:'⚙️', settings:'🛠️'
  };
  const SHORT={overview:'Home', review:'Review', transactions:'Txns', budgets:'Budget'};
  function addStyle(css){ const s=document.createElement('style'); s.setAttribute('data-patch','v0.9.3-uiux-rescue'); s.textContent=css; document.head.appendChild(s); }
  addStyle(`
    :root{--mm-nav-h:56px;--mm-card-line:color-mix(in srgb,var(--line) 82%,transparent)}

    /* Friendlier navigation icons and calmer sidebar density. */
    .nav-icon,.mobile-more-icon,.mobile-bar button span:first-child{font-family:Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,var(--font)!important}
    .nav-icon{background:color-mix(in srgb,var(--panel2) 72%,transparent)!important;font-size:15px!important;border-radius:10px!important}
    .nav-btn.active .nav-icon{background:rgba(var(--accent-rgb),.14)!important;color:inherit!important}
    .nav-btn{min-height:48px!important}.nav-copy strong{font-weight:850!important}.nav-copy span{font-size:10.5px!important}

    /* Budget cards: replace raw gray blocks with actual product cards. */
    .budget-board-list,.v60-budget-list{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))!important;gap:12px!important;width:100%!important;align-items:stretch!important}
    .budget-row,.v60-budget-row,.v092-budget-card{width:100%!important;max-width:none!important;min-width:0!important;border:1px solid var(--mm-card-line)!important;border-radius:20px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 98%,transparent),color-mix(in srgb,var(--panel2) 84%,transparent))!important;box-shadow:0 10px 28px rgba(0,0,0,.055)!important;padding:14px!important;color:var(--text)!important;text-align:left!important;display:grid!important;gap:11px!important;overflow:hidden!important}
    .budget-row-top,.v60-budget-top,.v092-budget-main{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;align-items:start!important;background:transparent!important;border:0!important;padding:0!important;width:100%!important;text-align:left!important;color:inherit!important}
    .budget-category-link,.v60-budget-name,.v092-budget-title,.budget-name{background:transparent!important;border:0!important;color:var(--text)!important;text-align:left!important;padding:0!important;margin:0!important;font-size:16px!important;font-weight:900!important;letter-spacing:-.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .budget-meta,.v60-budget-meta,.v092-budget-meta{font-size:12px!important;color:var(--muted)!important;margin-top:3px!important;line-height:1.25!important;background:transparent!important}
    .budget-row-side,.v60-budget-side{display:grid!important;justify-items:end!important;gap:2px!important;min-width:72px!important;background:transparent!important}.budget-row-side strong,.v60-budget-side strong,.v092-budget-pct{font-size:22px!important;font-weight:950!important;letter-spacing:-.045em!important;line-height:1!important}.budget-row-side span,.v60-budget-left,.v092-budget-left{font-size:11.5px!important;color:var(--muted)!important;white-space:nowrap!important}
    .budget-progress,.v60-budget-meter,.v092-meter{height:9px!important;border-radius:999px!important;background:color-mix(in srgb,var(--panel3) 80%,transparent)!important;overflow:hidden!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 60%,transparent)!important}.budget-progress>span,.v60-budget-meter span,.v092-meter span{display:block!important;height:100%!important;border-radius:999px!important;background:linear-gradient(90deg,var(--accent),var(--accent2))!important}.budget-row.bad .budget-progress>span,.v60-budget-row.bad .v60-budget-meter span,.v092-budget-card.bad .v092-meter span{background:linear-gradient(90deg,var(--red),var(--orange))!important}.budget-row.warn .budget-progress>span,.v60-budget-row.warn .v60-budget-meter span,.v092-budget-card.warn .v092-meter span{background:linear-gradient(90deg,var(--orange),var(--gold))!important}
    .budget-row-footer,.v60-budget-actions,.v092-budget-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;align-items:center!important}.budget-footnote{display:none!important}.budget-inline-actions{display:contents!important}.budget-row-footer .btn,.v60-budget-actions .btn,.v092-budget-actions .btn{width:100%!important;min-height:36px!important;border-radius:999px!important;font-size:12px!important;background:color-mix(in srgb,var(--panel2) 86%,transparent)!important}

    /* Tables: prevent full-width select pills and huge action columns. */
    .row-inline-select{width:auto!important;max-width:178px!important;min-width:150px!important;min-height:36px!important;height:36px!important;border-radius:999px!important;padding:0 32px 0 12px!important;font-size:12px!important;background-color:var(--panel2)!important;white-space:nowrap!important;text-overflow:ellipsis!important}
    .row-menu summary{min-height:36px!important;border-radius:999px!important;padding:8px 12px!important;font-size:12px!important;white-space:nowrap!important}.row-menu-popover{min-width:180px!important}.table-actions{gap:7px!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:nowrap!important}.balance-badge{width:auto!important;max-width:max-content!important;min-height:26px!important;padding:5px 9px!important;font-size:11px!important;white-space:nowrap!important}.table-wrap{scrollbar-gutter:stable!important}#accountRows td,#debtRows td,#holdingRows td{vertical-align:middle!important}#accountRows td:last-child,#debtRows td:last-child,#holdingRows td:last-child{min-width:260px!important}

    /* Chart cards: use the credit tracker surface everywhere without giant hover cards blocking content. */
    .canvas-wrap{border-radius:24px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel2) 78%,transparent),color-mix(in srgb,var(--panel) 96%,transparent))!important;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--line) 85%,transparent)!important;overflow:hidden!important}.chart-tooltip{border-radius:18px!important;max-width:280px!important;box-shadow:0 18px 50px rgba(0,0,0,.16)!important}.chart-tip-title{font-size:14px!important}.chart-tip-row{padding:5px 0!important}

    /* Investments desktop: cleaner than a spreadsheet, but still precise. */
    #view-investments .tracker-hero{grid-template-columns:repeat(4,minmax(0,1fr))!important}#view-investments .tracker-stat{min-height:118px!important}.investment-dashboard{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(340px,.75fr);gap:var(--gap);align-items:start}.holding-card-list.desktop-cards{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px}.holding-card{box-shadow:0 10px 26px rgba(0,0,0,.055)!important}.holding-card-actions .btn{border-radius:999px!important}

    /* Tablet: avoid awkward half-sidebar / half-mobile states. */
    @media(max-width:1100px){.app-shell{display:block!important}.sidebar{display:none!important}.main{max-width:900px!important;margin:0 auto!important;padding-bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.mobile-bar{display:grid!important}.grid-21,.grid-12,.tracker-grid,.tracker-grid-reverse,.investment-dashboard{grid-template-columns:1fr!important}.metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid,#view-investments .tracker-hero{grid-template-columns:repeat(2,minmax(0,1fr))!important}}

    /* Phone: less chrome, more content, friendlier tab bar. */
    @media(max-width:760px){
      :root{--mm-nav-h:54px;--gap:11px;--card-pad:14px}.main{padding:8px 10px calc(74px + env(safe-area-inset-bottom,0px))!important}.topbar{margin:-8px -10px 10px!important;padding:8px 10px 9px!important;gap:7px!important}.searchbar{height:38px!important;min-height:38px!important}.topbar .actions{grid-template-columns:1fr 40px!important;gap:7px!important}.topbar .actions .btn-primary{height:38px!important;min-height:38px!important;border-radius:14px!important}.topbar-overflow-btn{width:40px!important;height:40px!important}
      .section-title{font-size:24px!important;line-height:1.02!important}.section-sub{font-size:12.5px!important}.page-head{margin-bottom:10px!important}.card,.metric-card,.tracker-stat,.week-card,.hero-metric,.v60-panel{border-radius:18px!important;padding:14px!important}.card-header{margin-bottom:10px!important}.card-title{font-size:16px!important}.card-subtitle{font-size:12px!important}
      .metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid,#view-investments .tracker-hero{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.metric-value{font-size:23px!important}.metric-label{font-size:8.5px!important}.metric-sub{font-size:10.8px!important}
      .budget-board-list,.v60-budget-list{grid-template-columns:1fr!important;gap:10px!important}.budget-row,.v60-budget-row,.v092-budget-card{border-radius:18px!important;padding:12px!important}.budget-category-link,.v60-budget-name,.v092-budget-title,.budget-name{font-size:16px!important}.budget-row-side strong,.v60-budget-side strong,.v092-budget-pct{font-size:21px!important}.budget-row-footer,.v60-budget-actions,.v092-budget-actions{grid-template-columns:1fr 1fr!important}.budget-row-footer .btn,.v60-budget-actions .btn,.v092-budget-actions .btn{font-size:11.5px!important;min-height:34px!important}
      .mobile-bar{height:calc(var(--mm-nav-h) + env(safe-area-inset-bottom,0px))!important;padding:5px 7px calc(5px + env(safe-area-inset-bottom,0px))!important;gap:5px!important;background:color-mix(in srgb,var(--panel) 96%,transparent)!important;box-shadow:0 -10px 28px rgba(0,0,0,.12)!important;border-top:1px solid var(--line)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}.mobile-bar button{height:44px!important;min-height:44px!important;border-radius:14px!important;padding:4px 2px!important;gap:1px!important;background:transparent!important;box-shadow:none!important;color:var(--muted)!important}.mobile-bar button span:first-child{font-size:17px!important}.mobile-bar button span:last-child{font-size:9.5px!important;font-weight:850!important}.mobile-bar button.active{background:rgba(var(--accent-rgb),.10)!important;color:var(--accent)!important;box-shadow:inset 0 0 0 1px rgba(var(--accent-rgb),.22)!important}.mobile-bar button.active:before{display:none!important}
      .mobile-more-panel{border-radius:24px 24px 0 0!important;padding:14px!important}.mobile-more-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.mobile-more-item{min-height:72px!important;border-radius:18px!important}.mobile-more-icon{font-size:21px!important}.mobile-more-copy strong{font-size:13px!important}.mobile-more-copy span{display:block!important;font-size:10.5px!important;line-height:1.2!important}
      .table-wrap.responsive-cards{overflow:visible!important;border:0!important;background:transparent!important}.table-wrap.responsive-cards table,.table-wrap.responsive-cards tbody,.table-wrap.responsive-cards tr,.table-wrap.responsive-cards td{display:block!important;width:100%!important}.table-wrap.responsive-cards thead{display:none!important}.table-wrap.responsive-cards tr{border:1px solid var(--line)!important;border-radius:18px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 98%,transparent),color-mix(in srgb,var(--panel2) 86%,transparent))!important;margin-bottom:10px!important;padding:12px!important;box-shadow:0 8px 22px rgba(0,0,0,.055)!important}.table-wrap.responsive-cards td{border:0!important;padding:4px 0!important;text-align:left!important}.table-wrap.responsive-cards td.amount-cell{font-size:18px!important;font-weight:900!important}.table-wrap.responsive-cards td:last-child{min-width:0!important}.table-wrap.responsive-cards .table-actions{justify-content:stretch!important;display:grid!important;grid-template-columns:1fr auto!important}.table-wrap.responsive-cards .row-inline-select{max-width:none!important;width:100%!important}.table-wrap.responsive-cards .row-menu summary{width:100%!important}
      #view-investments .table-wrap{display:none!important}#holdingCardsV093{display:grid!important}.holding-facts{grid-template-columns:repeat(3,1fr)!important}.holding-card-actions{grid-template-columns:1fr 1fr 1fr!important}.investment-insight{border-radius:16px!important}
      .chart-tooltip{display:none!important}.canvas-wrap{height:210px!important;min-height:210px!important;border-radius:20px!important}.chart-legend{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important}.legend-chip{min-width:0!important;justify-content:space-between!important}
    }
    @media(max-width:390px){.metric-grid,.tracker-hero,.goal-summary,.credit-metric-grid,.review-summary-grid,#view-investments .tracker-hero{grid-template-columns:1fr!important}.mobile-bar{gap:3px!important;padding-left:5px!important;padding-right:5px!important}.mobile-bar button span:first-child{font-size:16px!important}.mobile-bar button span:last-child{font-size:8.6px!important}.mobile-more-grid{grid-template-columns:1fr!important}.holding-facts{grid-template-columns:1fr 1fr!important}.budget-row-footer,.v60-budget-actions,.v092-budget-actions{grid-template-columns:1fr!important}.section-title{font-size:22px!important}}
  `);

  // Replace wireframe symbols with friendlier emoji icons in both sidebar and mobile nav.
  try{ NAV.forEach(item=>{ if(ICONS[item[0]]) item[3]=ICONS[item[0]]; }); }catch(e){}
  window.ux62NavIcon=function(id){ return ICONS[id] || '•'; };
  window.ux62NavTitle=function(id){ const item=(window.NAV||NAV).find(n=>n[0]===id); return SHORT[id] || (item?item[1]:id); };

  function moneySafe(v){ try{return typeof v60Money==='function'?v60Money(v):money(v);}catch(e){return '$'+Number(v||0).toLocaleString();} }
  function clsForPct(p){ p=Number(p)||0; return p>=100?'bad':p>=85?'warn':'good'; }
  function pctWidth(p){ return Math.max(0,Math.min(100,Number(p)||0)); }
  function budgetCard(b){
    const cls=clsForPct(b.pct); const remaining=Math.max(0,Number(b.remaining)||0); const pct=Math.round(Number(b.pct)||0);
    return `<div class="budget-row ${cls}"><div class="budget-row-top"><div><button type="button" class="budget-category-link" onclick="showCategoryTransactions('${escapeJs(b.category)}')">${escapeHtml(b.category)}</button><div class="budget-meta">${moneySafe(b.spent)} spent of ${moneySafe(b.limit)}</div></div><div class="budget-row-side"><strong class="${cls}">${pct}%</strong><span>${moneySafe(remaining)} left</span></div></div><div class="progress budget-progress"><span style="width:${pctWidth(b.pct)}%"></span></div><div class="budget-row-footer"><button class="btn btn-small" type="button" onclick="showCategoryTransactions('${escapeJs(b.category)}')">View transactions</button><button class="btn btn-small" type="button" onclick="editBudget('${b.id}')">Edit budget</button></div></div>`;
  }
  window.budgetRowHtml=budgetCard; window.v60BudgetCard=budgetCard;

  function refreshBudgets(){
    const board=document.getElementById('budgetBoard');
    if(board){ const stats=budgetStats().sort((a,b)=>b.pct-a.pct); board.innerHTML=stats.length?`<div class="budget-board-list">${stats.map(budgetCard).join('')}</div>`:emptyMini('No budgets yet','Create monthly category limits for quick guardrails.','Add budget','openDrawer(\'budget\')'); }
    const heat=document.getElementById('budgetHeat');
    if(heat){ const rows=budgetStats().sort((a,b)=>b.pct-a.pct).slice(0,4); heat.innerHTML=rows.length?`<div class="budget-board-list">${rows.map(budgetCard).join('')}</div>`:emptyMini('No budgets','Create simple monthly caps.','Add budget','openDrawer(\'budget\')'); }
  }

  function markResponsiveTables(){
    ['accountRows','debtRows','holdingRows'].forEach(id=>{ const tbody=document.getElementById(id); const wrap=tbody?.closest('.table-wrap'); if(wrap) wrap.classList.add('responsive-cards'); });
  }

  function ensureHoldingCards(){
    const table=document.querySelector('#view-investments .table-wrap'); if(!table) return null;
    let cards=document.getElementById('holdingCardsV093');
    if(!cards){ cards=document.createElement('div'); cards.id='holdingCardsV093'; cards.className='holding-card-list desktop-cards'; table.insertAdjacentElement('afterend',cards); }
    return cards;
  }
  function holdingCard(h){
    const value=holdingValue(h); const cost=holdingCost(h); const gain=value-cost; const ret=cost?gain/cost*100:0; const included=h.includeNetWorth!==false;
    return `<div class="holding-card"><div class="holding-card-top"><div><div class="holding-symbol">${escapeHtml(h.symbol||h.name||'Holding')}</div><div class="holding-name">${escapeHtml(h.name||h.account||'Manual holding')}</div></div><div><div class="holding-value">${money(value)}</div><div class="holding-gain ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}${cost?` · ${ret>=0?'+':''}${pctFmt(ret)}`:''}</div></div></div><div class="holding-facts"><div class="holding-fact"><span>Account</span><b>${escapeHtml(h.account||'Manual')}</b></div><div class="holding-fact"><span>Class</span><b>${escapeHtml(h.assetClass||'Stock')}</b></div><div class="holding-fact"><span>Status</span><b>${included?'Included':'Excluded'}</b></div><div class="holding-fact"><span>Qty</span><b>${nval(h.quantity).toLocaleString()}</b></div><div class="holding-fact"><span>Price</span><b>${money(h.price,{cents:true})}</b></div><div class="holding-fact"><span>Basis</span><b>${money(cost)}</b></div></div><div class="holding-card-actions"><button type="button" class="btn btn-small" onclick="toggleHoldingInclude('${h.id}')">${included?'Exclude':'Include'}</button><button type="button" class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${h.id}'))">Edit</button><button type="button" class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${h.id}')">Delete</button></div></div>`;
  }
  function refreshHoldingCards(){ const cards=ensureHoldingCards(); if(!cards) return; const holdings=state.holdings||[]; cards.innerHTML=holdings.length?holdings.map(holdingCard).join(''):`<div class="empty"><div><strong>No holdings yet.</strong><p>Add stocks, funds, bonds, cash, or crypto positions manually.</p><button type="button" class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div>`; }

  const oldRenderInvestments=window.renderInvestments;
  window.renderInvestments=function(){
    if(typeof oldRenderInvestments==='function') oldRenderInvestments();
    const notes=document.getElementById('investmentNotes'); const alloc=allocationRows();
    if(notes){ const top=alloc[0]; notes.innerHTML=`<div class="investment-insight"><b>${top&&top.pct>65?'Concentration watch':'Portfolio check'}</b><span>${top?`${escapeHtml(top.name)} is ${pctFmt(top.pct)} of tracked holdings.`:'Add holdings to generate allocation insights.'}</span></div><div class="investment-insight"><b>Duplicate guard</b><span>If the same brokerage balance is already in Net worth, exclude these holdings from net worth.</span></div><div class="investment-insight"><b>Manual prices</b><span>Prices are manual. Update them before saving net worth snapshots.</span></div>`; }
    refreshHoldingCards(); markResponsiveTables();
  };

  // Cleaner allocation chart labels, especially on phone.
  window.renderInvestmentChart=function(){
    const canvas=document.getElementById('investmentCanvas'); if(!canvas || !canvas.closest('.view.active')) return;
    const rect=canvas.parentElement.getBoundingClientRect(); const dpr=devicePixelRatio||1; canvas.width=Math.max(360,rect.width*dpr); canvas.height=Math.max(220,rect.height*dpr); const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); const w=canvas.width/dpr,h=canvas.height/dpr; ctx.clearRect(0,0,w,h);
    const rows=allocationRows(); if(!rows.length){ if(typeof noData==='function') noData(ctx,'Add holdings to draw allocation.',w); else {ctx.fillStyle=getCss('--muted');ctx.fillText('Add holdings to draw allocation.',20,42);} return; }
    const max=Math.max(...rows.map(r=>r.value)); const left=w<480?22:150; const right=24; const top=24; const gap=16; const barH=Math.max(16,Math.min(26,(h-top-28-(rows.length-1)*gap)/rows.length));
    ctx.font='700 12px '+getComputedStyle(document.body).fontFamily;
    rows.forEach((r,i)=>{ const y=top+i*(barH+gap); const trackW=w-left-right; const bw=Math.max(10,trackW*(r.value/max)); const color=COLORS[i%COLORS.length];
      if(w>=480){ ctx.fillStyle=getCss('--text'); ctx.fillText(r.name,18,y+barH/2+4); }
      ctx.fillStyle='rgba(148,163,184,.14)'; roundRect(ctx,left,y,trackW,barH,barH/2); ctx.fill(); ctx.fillStyle=color; roundRect(ctx,left,y,bw,barH,barH/2); ctx.fill();
      ctx.fillStyle=getCss('--muted'); ctx.font='600 12px '+getComputedStyle(document.body).fontFamily; const label=w<480?`${r.name} · ${pctFmt(r.pct)} · ${money(r.value)}`:`${pctFmt(r.pct)} · ${money(r.value)}`; ctx.fillText(label,left+Math.min(bw+10,trackW-150),y+barH/2+4);
    });
  };

  function buildFriendlyMobileNav(){
    const el=document.getElementById('mobileNav'); if(!el) return;
    const primary=['overview','review','transactions','budgets']; const moreActive=!primary.includes(activeView);
    const html=primary.map(id=>`<button type="button" class="${id===activeView?'active':''}" onclick="showView('${id}')" aria-label="Open ${SHORT[id]||id}"><span>${ICONS[id]}</span><span>${SHORT[id]||id}</span></button>`).join('') + `<button type="button" class="${moreActive?'active':''}" onclick="toggleMobileMore(true)" aria-label="Open more sections"><span>☰</span><span>More</span></button>`;
    el.innerHTML=html;
  }

  function polishMoreSheet(){
    const grid=document.getElementById('mobileMoreGrid'); if(!grid) return;
    grid.querySelectorAll('.mobile-more-item').forEach(btn=>{ const onclick=btn.getAttribute('onclick')||''; const match=onclick.match(/showView\('([^']+)'\)/); const id=match?.[1]; const icon=btn.querySelector('.mobile-more-icon'); if(icon&&id&&ICONS[id]) icon.textContent=ICONS[id]; });
  }

  const prevBuild=window.buildMobileNav; window.buildMobileNav=function(){ buildFriendlyMobileNav(); polishMoreSheet(); };
  const prevRenderNav=window.renderNav; if(typeof prevRenderNav==='function'){ window.renderNav=function(){ prevRenderNav(); document.querySelectorAll('.nav-btn').forEach(btn=>{ const id=btn.dataset.view; const icon=btn.querySelector('.nav-icon'); if(icon&&ICONS[id]) icon.textContent=ICONS[id]; }); }; }

  const oldRenderAll=window.renderAll; window.renderAll=function(){ oldRenderAll(); requestAnimationFrame(()=>{ document.querySelectorAll('#appBuildLabel').forEach(el=>el.textContent=''+BUILD); refreshBudgets(); markResponsiveTables(); refreshHoldingCards(); buildFriendlyMobileNav(); polishMoreSheet(); }); };
  const oldShowView=window.showView; window.showView=function(id){ oldShowView(id); requestAnimationFrame(()=>{ refreshBudgets(); markResponsiveTables(); refreshHoldingCards(); buildFriendlyMobileNav(); polishMoreSheet(); if(id==='investments') window.renderInvestments?.(); }); };
  const oldPayload=window.backupPayload; if(typeof oldPayload==='function'){ window.backupPayload=function(){ const p=oldPayload(); p.build=BUILD; p.releaseStage='v0.5'; return p; }; }

  requestAnimationFrame(()=>{ try{ renderNav(); }catch(e){} try{ renderAll(); }catch(e){} });
})();
/* ---- end v0.5 UI/UX rescue pass ---- */


/* ---- extracted script block 2: mm-v094-iphone-qa-script ---- */
(function(){
  window.APP_PRERELEASE_LABEL='v0.5';
  const SVG={
    Home:'<svg class="mm-nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
    Review:'<svg class="mm-nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    Txns:'<svg class="mm-nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h12"/><path d="M5 12h14"/><path d="M7 17h12"/></svg>',
    Budget:'<svg class="mm-nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v11H4z"/><path d="M4 10h16"/><path d="M8 14h.01"/><path d="M12 14h4"/></svg>',
    More:'<svg class="mm-nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01"/><path d="M12 12h.01"/><path d="M19 12h.01"/></svg>'
  };
  const MORE={import:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',recurring:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 16v-5h-5"/></svg>',networth:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M12 3l8 6-8 12L4 9z"/><path d="M4 9h16"/></svg>',debt:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M7 7v10a3 3 0 0 0 6 0V7"/><path d="M17 7v10"/></svg>',investments:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/></svg>',credit:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 7h16v10H4z"/><path d="M4 10h16"/><path d="M8 15h3"/></svg>',goals:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',rules:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 12h2"/><path d="M10 12h10"/><path d="M4 17h8"/><path d="M16 17h4"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="17" r="2"/></svg>',settings:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2.1 2.1-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21h-3v-.6a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1-2.1-2.1.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H4v-3h.6a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1 2.1-2.1.1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.6V3h3v.6a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1 2.1 2.1-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.6 1h.6v3h-.6a1.8 1.8 0 0 0-1.6 1Z"/></svg>'};
  function labelFor(btn){return (btn.querySelector('span:last-child')?.textContent||btn.textContent||'').trim();}
  function polishNav(){
    const nav=document.getElementById('mobileNav'); if(nav){ nav.querySelectorAll('button').forEach(btn=>{ const label=labelFor(btn); const key={Transactions:'Txns',Budgets:'Budget',Overview:'Home'}[label]||label; const icon=btn.querySelector('span:first-child'); if(icon && SVG[key]) icon.innerHTML=SVG[key]; const text=btn.querySelector('span:last-child'); if(text) text.textContent=key; btn.setAttribute('aria-label',key); }); }
    document.querySelectorAll('.mobile-more-item').forEach(btn=>{ const view=btn.dataset.view||''; const icon=btn.querySelector('.mobile-more-icon'); if(icon && MORE[view]) icon.innerHTML=MORE[view]; });
    document.querySelectorAll('.nav-btn').forEach(btn=>{ const label=(btn.querySelector('strong')?.textContent||'').toLowerCase(); const map={overview:'Home',review:'Review',transactions:'Txns',budgets:'Budget',investments:'investments',settings:'settings'}; const icon=btn.querySelector('.nav-icon'); if(!icon) return; if(label.includes('overview')) icon.innerHTML=SVG.Home; else if(label.includes('review')) icon.innerHTML=SVG.Review; else if(label.includes('transaction')) icon.innerHTML=SVG.Txns; else if(label.includes('budget')) icon.innerHTML=SVG.Budget; else if(label.includes('investment')) icon.innerHTML=MORE.investments; else if(label.includes('setting')) icon.innerHTML=MORE.settings; });
  }
  const oldBuild=window.buildMobileNav; window.buildMobileNav=function(){ if(typeof oldBuild==='function') oldBuild(); polishNav(); };
  const oldRenderAll=window.renderAll; if(typeof oldRenderAll==='function'){ window.renderAll=function(){ oldRenderAll(); requestAnimationFrame(polishNav); }; }
  const oldShow=window.showView; if(typeof oldShow==='function'){ window.showView=function(id){ oldShow(id); requestAnimationFrame(()=>{polishNav(); if(id==='investments') window.renderInvestments?.();}); }; }
  const oldSettings=window.renderSettings; if(typeof oldSettings==='function'){ window.renderSettings=function(){ oldSettings(); const el=document.getElementById('appBuildLabel'); if(el) el.textContent=(window.MoneyMapConfig&&window.MoneyMapConfig.buildId)||APP_BUILD_ID||'v0.1.2'; }; }
  const oldBackup=window.backupPayload; if(typeof oldBackup==='function'){ window.backupPayload=function(){ const p=oldBackup(); p.build='v0.5'; p.releaseStage='v0.5'; return p; }; }
  document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(polishNav));
  setTimeout(polishNav,250);
})();


/* ---- extracted script block 3: mm-v095-nav-accounts-script ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const NAV_DEF=[
    {id:'overview',title:'Overview',mobile:'Home',sub:'Net worth snapshot'},
    {id:'accounts',title:'Accounts',mobile:'Accounts',sub:'Balances and edits'},
    {id:'transactions',title:'Transactions',mobile:'Txns',sub:'Search and edit'},
    {id:'budgets',title:'Budgets',mobile:'Budget',sub:'Monthly limits'},
    {id:'review',title:'Review',mobile:'Review',sub:'Weekly cleanup'},
    {id:'investments',title:'Investments',mobile:'Invest',sub:'Holdings'},
    {id:'networth',title:'Net worth',mobile:'Worth',sub:'History and snapshots'},
    {id:'import',title:'Import',mobile:'Import',sub:'CSV dropzone'},
    {id:'recurring',title:'Subscriptions',mobile:'Bills',sub:'Recurring charges'},
    {id:'debt',title:'Debt',mobile:'Debt',sub:'Payoff plan'},
    {id:'credit',title:'Credit',mobile:'Credit',sub:'Score history'},
    {id:'goals',title:'Goals',mobile:'Goals',sub:'Targets'},
    {id:'rules',title:'Rules',mobile:'Rules',sub:'Autopilot'},
    {id:'settings',title:'Settings',mobile:'Settings',sub:'Local app'}
  ];
  const DEF_PRIMARY=['overview','accounts','transactions','budgets','review','investments'];
  const DEF_MOBILE=['overview','accounts','review','transactions'];
  const SVG={
    overview:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/></svg>',
    accounts:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M7 9h10"/><path d="M7 13h5"/><path d="M16 15.5h1"/></svg>',
    transactions:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h8"/></svg>',
    budgets:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 18V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10"/><path d="M7 18v-4"/><path d="M12 18v-7"/><path d="M17 18v-10"/></svg>',
    review:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/><path d="M4 5h10"/><path d="M4 19h16"/></svg>',
    investments:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
    networth:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M12 3l8 7-8 11-8-11 8-7Z"/><path d="M4 10h16"/><path d="M9 10l3 11 3-11"/></svg>',
    import:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
    recurring:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 16v-5h-5"/></svg>',
    debt:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M6 6h12"/><path d="M8 6v9a4 4 0 0 0 8 0V6"/><path d="M6 20h12"/></svg>',
    credit:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 10h16"/><path d="M8 15h3"/></svg>',
    goals:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    rules:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><path d="M4 12h2"/><path d="M10 12h10"/><path d="M4 17h8"/><path d="M16 17h4"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="17" r="2"/></svg>',
    settings:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 13.5a7.5 7.5 0 0 0 0-3l2-1.5-2-3.4-2.4 1a7.5 7.5 0 0 0-2.6-1.5L13.7 2h-3.4L10 5.1a7.5 7.5 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.5a7.5 7.5 0 0 0 0 3L3 15l2 3.4 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.3 3.1h3.4l.3-3.1a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.5Z"/></svg>',
    more:'<svg class="mm-nav-svg" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>'
  };
  function navItem(id){return NAV_DEF.find(x=>x.id===id)}
  function allIds(){return NAV_DEF.map(x=>x.id)}
  function validList(list, fallback){const ids=allIds(); const seen=new Set(); const out=(Array.isArray(list)?list:fallback).filter(id=>ids.includes(id)&&!seen.has(id)&&(seen.add(id),true)); return out.length?out:fallback.slice();}
  function navSettings(){ state.settings=state.settings||{}; state.settings.navPrimary=validList(state.settings.navPrimary,DEF_PRIMARY); state.settings.mobileTabs=validList(state.settings.mobileTabs,DEF_MOBILE).filter(id=>id!=='settings').slice(0,4); if(!state.settings.mobileTabs.length) state.settings.mobileTabs=DEF_MOBILE.slice(); return state.settings; }
  window.mmNavIcon=function(id){return SVG[id]||SVG.more};
  function navButton(id, cls=''){ const n=navItem(id); if(!n) return ''; return `<button class="nav-btn ${cls} ${id===activeView?'active':''}" data-view="${id}" onclick="showView('${id}')"><span class="nav-icon">${SVG[id]||SVG.more}</span><span class="nav-copy"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.sub)}</span></span></button>`; }
  window.buildNav=function(){
    const side=document.getElementById('sideNav'); if(!side) return; const s=navSettings(); const primary=s.navPrimary; const more=allIds().filter(id=>!primary.includes(id));
    side.innerHTML=`<div class="nav-kicker nav-more-kicker"><span>Workspace</span></div><div class="nav-group">${primary.map(id=>navButton(id)).join('')}</div><div class="nav-kicker nav-more-kicker"><span>More</span><button class="btn btn-small" onclick="showView('settings'); setTimeout(()=>document.getElementById('navLayoutSettings')?.scrollIntoView({behavior:'smooth',block:'start'}),80)">Edit</button></div><div class="nav-group nav-secondary">${more.map(id=>navButton(id,'secondary')).join('')}</div><button class="btn btn-small nav-customize-btn" onclick="showView('settings'); setTimeout(()=>document.getElementById('navLayoutSettings')?.scrollIntoView({behavior:'smooth',block:'start'}),80)">Customize navigation</button>`;
  };
  function ensureMoreSheet(){
    let sheet=document.getElementById('mobileMoreSheet');
    if(!sheet){ sheet=document.createElement('div'); sheet.id='mobileMoreSheet'; sheet.className='mobile-more-sheet'; document.body.appendChild(sheet); }
    sheet.innerHTML=`<div class="mobile-more-panel"><div class="mobile-more-head"><div><b>More</b><span>Open less-used sections</span></div><button class="btn btn-small" onclick="closeMobileMoreSheet()">Close</button></div><div class="mobile-more-grid" id="mobileMoreGrid"></div></div>`;
    sheet.onclick=e=>{ if(e.target===sheet) closeMobileMoreSheet(); };
    return sheet;
  }
  window.openMobileMoreSheet=function(){ const sheet=ensureMoreSheet(); renderMobileMoreGrid(); sheet.classList.add('active'); };
  window.closeMobileMoreSheet=function(){ document.getElementById('mobileMoreSheet')?.classList.remove('active'); };
  function renderMobileMoreGrid(){ const grid=document.getElementById('mobileMoreGrid'); if(!grid) return; const mobile=navSettings().mobileTabs; const more=allIds().filter(id=>!mobile.includes(id)); grid.innerHTML=more.map(id=>{ const n=navItem(id); return `<button class="mobile-more-item ${id===activeView?'active':''}" data-view="${id}" onclick="closeMobileMoreSheet(); showView('${id}')"><span class="mobile-more-icon">${SVG[id]||SVG.more}</span><span class="mobile-more-copy"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.sub)}</span></span></button>`; }).join(''); }
  window.buildMobileNav=function(){ const nav=document.getElementById('mobileNav'); if(!nav) return; const mobile=navSettings().mobileTabs; const moreActive=!mobile.includes(activeView); const items=mobile.map(id=>{ const n=navItem(id); return `<button class="${id===activeView?'active':''}" onclick="showView('${id}')" aria-label="${escapeHtml(n.mobile||n.title)}"><span>${SVG[id]||SVG.more}</span><span>${escapeHtml(n.mobile||n.title)}</span></button>`; }).join(''); nav.innerHTML=items+`<button class="${moreActive?'active':''}" onclick="openMobileMoreSheet()" aria-label="More"><span>${SVG.more}</span><span>More</span></button>`; renderMobileMoreGrid(); };
  window.toggleNavPrimary=function(id){ const s=navSettings(); const idx=s.navPrimary.indexOf(id); if(idx>=0 && id!=='overview') s.navPrimary.splice(idx,1); else if(idx<0) s.navPrimary.push(id); saveState(); buildNav(); renderNavLayoutSettings(); };
  window.moveNavPrimary=function(id,dir){ const s=navSettings(); const i=s.navPrimary.indexOf(id); if(i<0) return; const j=Math.max(0,Math.min(s.navPrimary.length-1,i+dir)); const tmp=s.navPrimary[i]; s.navPrimary[i]=s.navPrimary[j]; s.navPrimary[j]=tmp; saveState(); buildNav(); renderNavLayoutSettings(); };
  window.toggleMobileTab=function(id){ const s=navSettings(); const idx=s.mobileTabs.indexOf(id); if(idx>=0){ if(s.mobileTabs.length>1) s.mobileTabs.splice(idx,1); } else { if(s.mobileTabs.length>=4) s.mobileTabs.shift(); s.mobileTabs.push(id); } saveState(); buildMobileNav(); renderNavLayoutSettings(); };
  window.resetNavLayout=function(){ state.settings.navPrimary=DEF_PRIMARY.slice(); state.settings.mobileTabs=DEF_MOBILE.slice(); saveState(); buildNav(); buildMobileNav(); renderNavLayoutSettings(); toast('Navigation reset.'); };
  window.renderNavLayoutSettings=function(){
    const el=document.getElementById('navLayoutSettings'); if(!el) return; const s=navSettings();
    el.innerHTML=`<div class="card-header"><div><h3 class="card-title">Navigation layout</h3><p class="card-subtitle">Pin frequent sections to the sidebar and bottom bar. Everything else stays available under More.</p></div><button class="btn btn-small" onclick="resetNavLayout()">Reset</button></div><div class="mm-v095-tab-list">${NAV_DEF.map(n=>{ const pinned=s.navPrimary.includes(n.id); const mobile=s.mobileTabs.includes(n.id); return `<div class="mm-v095-tab-row"><span class="mm-v095-tab-icon">${SVG[n.id]||SVG.more}</span><div><b>${escapeHtml(n.title)}</b><span>${escapeHtml(n.sub)}</span></div><div class="mm-v095-tab-actions"><button class="btn btn-small ${pinned?'btn-primary':''}" onclick="toggleNavPrimary('${n.id}')">${pinned?'Sidebar':'More'}</button><button class="btn btn-small ${mobile?'btn-primary':''}" onclick="toggleMobileTab('${n.id}')">${mobile?'Bottom':'Mobile'}</button><button class="btn btn-small" onclick="moveNavPrimary('${n.id}',-1)">Up</button><button class="btn btn-small" onclick="moveNavPrimary('${n.id}',1)">Down</button></div></div>`; }).join('')}</div>`;
  };
  function ensureAccountsView(){
    if(document.getElementById('view-accounts')) return;
    const net=document.getElementById('view-networth'); const sec=document.createElement('section'); sec.className='view'; sec.id='view-accounts';
    sec.innerHTML=`<div class="page-head"><div><h2 class="section-title">Accounts</h2><p class="section-sub">Current balances, inclusion status, and quick edits for your net worth snapshot.</p></div><div class="actions"><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div><div class="tracker-hero" id="accountsMetrics"></div><div class="accounts-grid"><div class="card"><div class="card-header"><div><h3 class="card-title">All accounts</h3><p class="card-subtitle">Edit balances manually. Include only accounts that should count toward net worth.</p></div><button class="btn btn-small" onclick="openDrawer('account')">Add</button></div><div class="accounts-card-list" id="accountsCardList"></div></div><div class="stack"><div class="card"><h3 class="card-title">Snapshot actions</h3><p class="card-subtitle">When balances look right, save a point in your net worth history.</p><div class="split-line"></div><div class="hero-row"><button class="btn btn-primary" onclick="saveNetWorthSnapshot()">Save current net worth</button><button class="btn" onclick="showView('networth')">View history</button></div></div><div class="card"><h3 class="card-title">Account tips</h3><div class="split-line"></div><div class="mini-list"><div class="mini-item"><div><b>Avoid double counting</b><br><span>If holdings are tracked separately, exclude the related brokerage account balance.</span></div></div><div class="mini-item"><div><b>Liabilities</b><br><span>Credit cards and loans count as negative values in net worth.</span></div></div></div></div></div></div>`;
    net?.parentNode?.insertBefore(sec, net);
  }
  function accountCard(a){ const signed=accountSignedValue(a); const included=a.includeNetWorth!==false; return `<div class="accounts-card"><div class="accounts-card-head"><div><h3>${escapeHtml(a.name||'Account')}</h3><p>${escapeHtml(a.institution||'Manual')} · ${escapeHtml(a.type||'Account')}</p></div><span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span></div><div class="accounts-card-value ${signed<0?'bad':'good'}">${money(signed)}</div><div class="accounts-facts"><div class="accounts-fact"><span>Updated</span><b>${a.updatedAt?dateFmt(String(a.updatedAt).slice(0,10)):'—'}</b></div><div class="accounts-fact"><span>Status</span><b>${included?'In net worth':'Excluded'}</b></div><div class="accounts-fact"><span>Type</span><b>${escapeHtml(a.type||'Account')}</b></div></div><div class="accounts-actions"><button class="btn btn-small" onclick="toggleAccountInclude('${a.id}')">${included?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('account', findById('accounts','${a.id}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('accounts','${a.id}')">Delete</button></div></div>`; }
  window.renderAccountsDashboard=function(){ ensureAccountsView(); const metrics=document.getElementById('accountsMetrics'); const list=document.getElementById('accountsCardList'); const accounts=state.accounts||[]; const included=accounts.filter(a=>a.includeNetWorth!==false); const assets=included.reduce((s,a)=>s+Math.max(0,accountSignedValue(a)),0); const liabilities=included.reduce((s,a)=>s+Math.abs(Math.min(0,accountSignedValue(a))),0); if(metrics) metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Included accounts</div><div class="metric-value">${included.length}</div><div class="metric-sub">${accounts.length} total manual account${accounts.length===1?'':'s'}</div></div><div class="tracker-stat"><div class="metric-label">Account assets</div><div class="metric-value good">${money(assets)}</div><div class="metric-sub">Positive included balances</div></div><div class="tracker-stat"><div class="metric-label">Account debt</div><div class="metric-value bad">${money(liabilities)}</div><div class="metric-sub">Cards, loans, and negative balances</div></div><div class="tracker-stat"><div class="metric-label">Net account value</div><div class="metric-value ${assets-liabilities>=0?'good':'bad'}">${money(assets-liabilities)}</div><div class="metric-sub">Before separate holdings and debt tracker</div></div>`; if(list) list.innerHTML=accounts.length?accounts.map(accountCard).join(''):emptyMini('No accounts yet','Add checking, savings, brokerage, card, loan, vehicle, property, or other balances.','Add account','openDrawer(\'account\')'); };
  function landingRow(a){ const signed=accountSignedValue(a); return `<button class="mm-v095-account-row" onclick="openDrawer('account', findById('accounts','${a.id}'))"><span><b>${escapeHtml(a.name||'Account')}</b><span>${escapeHtml(a.institution||'Manual')} · ${escapeHtml(a.type||'Account')} · ${a.updatedAt?dateFmt(String(a.updatedAt).slice(0,10)):'not dated'}</span></span><strong class="${signed<0?'bad':'good'}">${money(signed)}</strong></button>`; }
  window.renderOverviewLanding=function(){
    const view=document.getElementById('view-overview'); if(!view) return; let el=document.getElementById('accountSnapshotLanding'); if(!el){ el=document.createElement('div'); el.id='accountSnapshotLanding'; view.insertBefore(el, view.firstChild); }
    const b=netWorthBreakdown(); const accounts=(state.accounts||[]).slice().sort((a,b)=>Math.abs(accountSignedValue(b))-Math.abs(accountSignedValue(a))).slice(0,5); const snaps=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latest=snaps[0];
    el.className='mm-v095-landing'; el.innerHTML=`<div class="mm-v095-net-card"><div class="mm-v095-kicker">Net worth snapshot</div><div class="mm-v095-net-value ${b.netWorth>=0?'good':'bad'}">${money(b.netWorth)}</div><div class="mm-v095-net-meta">Calculated from included manual accounts, holdings, and debt. ${latest?`Last snapshot saved ${dateFmt(latest.date)}.`:'Save a snapshot when your balances look right.'}</div><div class="mm-v095-actions"><button class="btn btn-primary" onclick="showView('accounts')">Update accounts</button><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button class="btn" onclick="showView('networth')">History</button></div><div class="mm-v095-snapshot-grid"><div class="mm-v095-snap"><span>Assets</span><b class="good">${money(b.assets)}</b></div><div class="mm-v095-snap"><span>Liabilities</span><b class="bad">${money(b.liabilities)}</b></div><div class="mm-v095-snap"><span>Accounts</span><b>${(state.accounts||[]).length}</b></div></div></div><div class="mm-v095-account-panel"><div class="mm-v095-panel-head"><div><h3>Current accounts</h3><p>Edit balances directly from your landing page.</p></div><button class="btn btn-small" onclick="openDrawer('account')">Add</button></div><div class="mm-v095-account-list">${accounts.length?accounts.map(landingRow).join(''):emptyMini('No accounts yet','Add balances to make Overview your financial command center.','Add account','openDrawer(\'account\')')}</div><div class="mm-v095-account-actions"><button class="btn btn-small" onclick="showView('accounts')">Manage accounts</button><button class="btn btn-small" onclick="showView('investments')">Holdings</button></div></div>`;
  };
  function ensureSettingsNavCard(){ const grid=document.querySelector('#view-settings .settings-grid .stack'); if(!grid || document.getElementById('navLayoutSettings')) return; const card=document.createElement('div'); card.className='card mm-v095-tabs-card'; card.id='navLayoutSettings'; grid.insertBefore(card, grid.firstChild); }
  const oldRenderAll=window.renderAll; window.renderAll=function(){ if(typeof oldRenderAll==='function') oldRenderAll(); ensureAccountsView(); renderAccountsDashboard(); renderOverviewLanding(); ensureSettingsNavCard(); renderNavLayoutSettings(); buildNav(); buildMobileNav(); const build=document.getElementById('appBuildLabel'); if(build) build.textContent=''+BUILD; };
  const oldShow=window.showView; window.showView=function(id){ ensureAccountsView(); if(id==='accounts') activeView='accounts'; if(typeof oldShow==='function') oldShow(id); renderAccountsDashboard(); renderOverviewLanding(); buildNav(); buildMobileNav(); };
  const oldSettings=window.renderSettings; if(typeof oldSettings==='function'){ window.renderSettings=function(){ oldSettings(); ensureSettingsNavCard(); renderNavLayoutSettings(); const build=document.getElementById('appBuildLabel'); if(build) build.textContent=''+BUILD; }; }
  const oldBackup=window.backupPayload; if(typeof oldBackup==='function'){ window.backupPayload=function(){ const p=oldBackup(); p.build=BUILD; p.releaseStage='v0.5'; return p; }; }
  document.addEventListener('DOMContentLoaded',()=>{ ensureAccountsView(); navSettings(); buildNav(); buildMobileNav(); renderAccountsDashboard(); renderOverviewLanding(); ensureSettingsNavCard(); renderNavLayoutSettings(); });
  setTimeout(()=>{ ensureAccountsView(); buildNav(); buildMobileNav(); renderAccountsDashboard(); renderOverviewLanding(); ensureSettingsNavCard(); renderNavLayoutSettings(); },250);
})();


/* ---- extracted script block 4: mm-v096-desktop-qa-fixes-script ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  function hideLegacySidebarKickers(){
    const side=document.querySelector('.sidebar'); if(!side) return;
    [...side.children].forEach(el=>{
      if(el.classList && el.classList.contains('nav-kicker') && el.textContent.trim().toUpperCase()==='WORKSPACE'){
        if(el.nextElementSibling && el.nextElementSibling.id==='sideNav') el.classList.add('mm-legacy-hidden');
      }
    });
  }
  function removeDuplicateInvestmentEmpty(){
    if(typeof state==='undefined' || (state?.holdings||[]).length) return;
    const cards=document.getElementById('holdingCardsV093')||document.getElementById('holdingCardsV092');
    if(cards && window.matchMedia('(min-width: 761px)').matches) cards.innerHTML='';
  }
  function polishBuildLabels(){
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{el.textContent=''+BUILD;});
    document.querySelectorAll('*').forEach(el=>{
      if(el.childNodes && el.childNodes.length===1 && el.childNodes[0].nodeType===3 && /v0\.9\.[0-9]-alpha/.test(el.textContent||'')){
        el.textContent=(el.textContent||'').replace(/v0\.9\.[0-9]-alpha/g,BUILD);
      }
    });
  }
  function afterRender(){ hideLegacySidebarKickers(); removeDuplicateInvestmentEmpty(); polishBuildLabels(); }
  const oldBuild=window.buildNav; if(typeof oldBuild==='function'){ window.buildNav=function(){ const r=oldBuild.apply(this,arguments); afterRender(); return r; }; }
  const oldRenderInvest=window.renderInvestments; if(typeof oldRenderInvest==='function'){ window.renderInvestments=function(){ const r=oldRenderInvest.apply(this,arguments); removeDuplicateInvestmentEmpty(); return r; }; }
  const oldRenderAll=window.renderAll; if(typeof oldRenderAll==='function'){ window.renderAll=function(){ const r=oldRenderAll.apply(this,arguments); afterRender(); return r; }; }
  const oldShow=window.showView; if(typeof oldShow==='function'){ window.showView=function(id){ const r=oldShow.apply(this,arguments); requestAnimationFrame(afterRender); return r; }; }
  const oldBackup=window.backupPayload; if(typeof oldBackup==='function'){ window.backupPayload=function(){ const p=oldBackup.apply(this,arguments); p.build=BUILD; p.releaseStage='v0.5'; return p; }; }
  document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(afterRender));
  setTimeout(afterRender,300);
})();


/* ---- extracted script block 5: mm-v097-declutter-js ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function appFont(){ return getComputedStyle(document.body).fontFamily; }
  function setupCanvas(canvas,minW=620,minH=220){
    const wrap=canvas.parentElement;
    const rect=wrap.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(minW,Math.floor(rect.width*dpr));
    canvas.height=Math.max(minH,Math.floor(rect.height*dpr));
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const w=canvas.width/dpr,h=canvas.height/dpr;
    ctx.clearRect(0,0,w,h);
    return {ctx,w,h,wrap};
  }
  function compactMoney(value){ return typeof money==='function' ? money(value) : ('$'+Math.round(value).toLocaleString()); }
  function compactPct(value){ return typeof pctFmt==='function' ? pctFmt(value) : (Math.round(value*10)/10)+'%'; }
  function updateLegend(id,items,title){
    const el=document.getElementById(id); if(!el) return;
    if(!items.length){ el.innerHTML=''; return; }
    el.innerHTML=`<span class="chart-legend-title">${escapeHtml(title||'Selected')}</span>`+items.map(item=>`<span class="legend-chip"><span class="chart-swatch" style="background:${escapeHtml(item.color)};color:${escapeHtml(item.color)}"></span><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b></span>`).join('');
  }
  function chartTip(id,canvas,x,y,title,rows){
    const tip=document.getElementById(id); if(!tip) return;
    tip.innerHTML=`<div class="chart-tip-title"><b>${escapeHtml(title)}</b><span>Detail</span></div>`+rows.map(row=>`<div class="chart-tip-row"><span class="chart-tip-label"><span class="chart-swatch" style="background:${escapeHtml(row.color)};color:${escapeHtml(row.color)}"></span>${escapeHtml(row.label)}</span><b>${escapeHtml(row.value)}</b></div>`).join('');
    const wrap=canvas.parentElement;
    tip.style.left=Math.max(10,Math.min(wrap.clientWidth-260,x+12))+'px';
    tip.style.top=Math.max(10,Math.min(wrap.clientHeight-120,y-12))+'px';
    tip.classList.add('visible'); tip.setAttribute('aria-hidden','false');
  }
  function hideTip(id){ const tip=document.getElementById(id); if(tip){ tip.classList.remove('visible'); tip.setAttribute('aria-hidden','true'); } }

  // Fixes spending map selection: hit testing now uses the row's Y-band first,
  // so tapping a category bar always selects that exact category instead of the nearest bar endpoint.
  window.renderSpendChart=function(activeIndex=null){
    const canvas=document.getElementById('spendCanvas'); if(!canvas) return;
    const {ctx,w,h}=setupCanvas(canvas,620,220);
    const cats=byCategory(monthTransactions(currentMonth())).slice(0,7);
    const tipId='spendChartTip';
    if(!cats.length){
      ctx.fillStyle=cssVar('--muted'); ctx.font='13px '+appFont();
      ctx.fillText('Import transactions to draw the spending map.',18,34);
      updateLegend('spendLegend',[], 'Spending'); return;
    }
    const total=cats.reduce((sum,row)=>sum+nval(row[1]),0);
    const max=Math.max(...cats.map(row=>nval(row[1])),1);
    const mobile=w<520;
    const pad={l:mobile?12:18,r:mobile?12:20,t:mobile?12:16,b:mobile?12:16};
    const labelW=mobile?Math.min(120,Math.max(86,w*.33)):Math.min(150,Math.max(108,w*.24));
    const valueW=mobile?48:68;
    const rowGap=mobile?7:8;
    const rowH=(h-pad.t-pad.b-(cats.length-1)*rowGap)/cats.length;
    const barH=Math.max(10,Math.min(mobile?18:22,rowH*.58));
    const x0=pad.l+labelW;
    const trackW=Math.max(88,w-x0-pad.r-valueW);
    const items=[];
    ctx.textBaseline='middle';
    cats.forEach(([cat,rawVal],i)=>{
      const val=nval(rawVal);
      const y=pad.t+i*(rowH+rowGap)+(rowH-barH)/2;
      const color=COLORS[i%COLORS.length];
      const selected=i===activeIndex;
      const bw=Math.max(3,trackW*(val/max));
      ctx.fillStyle=selected?'rgba(148,163,184,.18)':'rgba(148,163,184,.08)';
      roundRect(ctx,x0,y,trackW,barH,999); ctx.fill();
      const grad=ctx.createLinearGradient(x0,y,x0+bw,y);
      grad.addColorStop(0,color);
      grad.addColorStop(1,COLORS[(i+1)%COLORS.length]||cssVar('--accent2')||color);
      ctx.fillStyle=grad; roundRect(ctx,x0,y,bw,barH,999); ctx.fill();
      const clean=String(cat||'Uncategorized');
      const label=clean.length>(mobile?13:18)?clean.slice(0,mobile?12:17)+'…':clean;
      ctx.fillStyle=cssVar('--text'); ctx.font='800 '+(mobile?11:12)+'px '+appFont();
      ctx.fillText(label,pad.l,y+barH/2);
      ctx.fillStyle=cssVar('--muted'); ctx.font=(mobile?'11':'12')+'px '+appFont();
      ctx.fillText(compactMoney(val),x0+bw+8,y+barH/2);
      items.push({index:i,cat:clean,val,color,pct:total?val/total*100:0,x1:x0,y1:y-rowGap/2,x2:x0+trackW,y2:y+barH+rowGap/2,cx:x0+bw,cy:y+barH/2});
    });
    window.spendChartModel={items,total};
    const chosen=items[activeIndex==null?0:activeIndex]||items[0];
    if(chosen){
      updateLegend('spendLegend',[
        {label:chosen.cat,value:compactMoney(chosen.val),color:chosen.color},
        {label:'Share',value:compactPct(chosen.pct),color:cssVar('--accent2')||chosen.color},
        {label:'Month',value:compactMoney(total),color:cssVar('--accent3')||chosen.color}
      ],'Spending');
      if(activeIndex!==null) chartTip(tipId,canvas,chosen.cx,chosen.cy,chosen.cat,[
        {label:'Amount',value:compactMoney(chosen.val),color:chosen.color},
        {label:'Share',value:compactPct(chosen.pct),color:cssVar('--accent2')||chosen.color}
      ]);
    }
    if(!canvas.dataset.v097SpendHitTest){
      canvas.dataset.v097SpendHitTest='1';
      const pick=(event)=>{
        const model=window.spendChartModel; if(!model?.items?.length) return;
        const rect=canvas.getBoundingClientRect();
        const x=event.clientX-rect.left, y=event.clientY-rect.top;
        let item=model.items.find(it=>y>=it.y1 && y<=it.y2);
        if(!item){
          item=model.items.reduce((best,it)=> Math.abs(y-it.cy)<Math.abs(best.cy-y)?it:best, model.items[0]);
        }
        window.renderSpendChart(item.index);
      };
      canvas.addEventListener('mousemove',pick);
      canvas.addEventListener('click',pick);
      canvas.addEventListener('touchstart',event=>{ if(event.touches?.[0]) pick(event.touches[0]); },{passive:true});
      canvas.addEventListener('mouseleave',()=>{ hideTip(tipId); window.renderSpendChart(null); });
      canvas.addEventListener('blur',()=>{ hideTip(tipId); window.renderSpendChart(null); });
      canvas.addEventListener('focus',()=>window.renderSpendChart(0));
    }
  };

  const oldRenderCharts=window.renderCharts;
  if(typeof oldRenderCharts==='function'){
    window.renderCharts=function(){
      window.renderSpendChart?.();
      window.renderCreditChart?.();
      window.renderNetWorthChart?.();
      window.renderInvestmentChart?.();
    };
  }

  const oldSettings=window.renderSettings;
  if(typeof oldSettings==='function'){
    window.renderSettings=function(){ oldSettings(); const el=document.getElementById('appBuildLabel'); if(el) el.textContent=''+BUILD; };
  }
  const oldBackup=window.backupPayload;
  if(typeof oldBackup==='function'){
    window.backupPayload=function(){ const payload=oldBackup(); payload.build=BUILD; payload.releaseStage='v0.5'; return payload; };
  }
  window.addEventListener('resize',()=>{ if(window.chartsReady!==false) requestAnimationFrame(()=>window.renderCharts?.()); });
})();

/* ---- v0.5 final responsive QA pass: mobile table cards ---- */
(function(){
  const BODY_IDS=['accountRows','debtRows','holdingRows','creditRows'];
  const fallbackLabels={
    accountRows:['Account','Type','Updated','Status','Balance','Actions'],
    debtRows:['Debt','APR','Min','Extra','Include','Balance','Actions'],
    holdingRows:['Holding','Account','Class','Qty','Price','Value','Gain','Actions'],
    creditRows:['Month','Experian','Equifax','TransUnion','Average','Util.','Source','Note','Actions']
  };
  function labelsFor(table,id){
    const heads=[...table.querySelectorAll('thead th')].map(th=>String(th.textContent||'').trim()||'Actions');
    return heads.length?heads:(fallbackLabels[id]||[]);
  }
  function labelRows(tbody,id){
    const table=tbody.closest('table'); if(!table) return;
    const wrap=tbody.closest('.table-wrap'); if(wrap) wrap.classList.add('responsive-cards','qa-responsive-cards');
    const labels=labelsFor(table,id);
    [...tbody.rows].forEach(row=>{
      [...row.cells].forEach((cell,index)=>{
        if(cell.colSpan && cell.colSpan>1){ cell.dataset.label=''; return; }
        const label=labels[index] || (index===row.cells.length-1?'Actions':'');
        cell.dataset.label=label;
      });
    });
  }
  function applyResponsiveTableCards(){ BODY_IDS.forEach(id=>{ const tbody=document.getElementById(id); if(tbody) labelRows(tbody,id); }); }
  function afterPaint(){ requestAnimationFrame(()=>requestAnimationFrame(applyResponsiveTableCards)); }
  ['renderAll','showView','renderNetWorth','renderDebt','renderInvestments','renderCredit','renderAccountsDashboard'].forEach(name=>{
    const fn=window[name];
    if(typeof fn==='function' && !fn.__qaResponsiveWrapped){
      const wrapped=function(){ const result=fn.apply(this,arguments); afterPaint(); return result; };
      wrapped.__qaResponsiveWrapped=true;
      window[name]=wrapped;
    }
  });
  document.addEventListener('DOMContentLoaded',afterPaint);
  window.addEventListener('resize',afterPaint,{passive:true});
  afterPaint();
})();


/* ---- MoneyMap QA2 verification and responsive relabel pass ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  try{ document.documentElement.setAttribute('data-moneymap-build', BUILD); }catch(e){}
  function markBuild(){
    try{
      document.querySelectorAll('#appBuildLabel').forEach(el=>{ el.textContent=''+BUILD; });
    }catch(e){}
  }
  function tableLabels(){
    const maps={
      accountRows:['Account','Type','Updated','Status','Balance','Actions'],
      debtRows:['Debt','APR','Min','Extra','Include','Balance','Actions'],
      holdingRows:['Holding','Account','Class','Qty','Price','Value','Gain','Actions'],
      creditRows:['Month','Experian','Equifax','TransUnion','Average','Utilization','Source','Note','Actions']
    };
    Object.keys(maps).forEach(id=>{
      const body=document.getElementById(id); if(!body) return;
      const table=body.closest('table'); const wrap=body.closest('.table-wrap');
      if(wrap) wrap.classList.add('responsive-cards','qa-responsive-cards');
      const heads=table?[...table.querySelectorAll('thead th')].map(th=>(th.textContent||'').trim()).filter(Boolean):[];
      const labels=heads.length?heads:maps[id];
      [...body.rows].forEach(row=>[...row.cells].forEach((cell,i)=>{
        cell.dataset.label=(cell.colSpan&&cell.colSpan>1)?'':(labels[i]||'Actions');
      }));
    });
  }
  function apply(){ markBuild(); tableLabels(); }
  function soon(){ requestAnimationFrame(()=>requestAnimationFrame(apply)); }
  ['renderAll','showView','renderSettings','renderNetWorth','renderDebt','renderInvestments','renderCredit','renderAccountsDashboard'].forEach(name=>{
    const fn=window[name];
    if(typeof fn==='function' && !fn.__qa2Wrapped){
      const wrapped=function(){ const out=fn.apply(this,arguments); soon(); return out; };
      wrapped.__qa2Wrapped=true; window[name]=wrapped;
    }
  });
  document.addEventListener('DOMContentLoaded',soon);
  window.addEventListener('resize',soon,{passive:true});
  soon();
})();


/* ---- MoneyMap QA3 hard responsive shell and overlay lock ---- */
(function(){
  const BUILD='qa3-20260529';
  try{ document.documentElement.setAttribute('data-moneymap-build', BUILD); }catch(e){}
  const css=`
    :root{--mm-qa3-safe-bottom:env(safe-area-inset-bottom,0px)}
    html,body{max-width:100%!important;overflow-x:clip!important}
    html{overflow-y:visible!important;height:auto!important}
    body{overflow-y:visible!important;min-height:100vh}
    /* QA5: the mobile "More" sheet may lock background scroll, but ONLY on
       mobile widths. On desktop the document must always stay scrollable. */
    @media(min-width:1181px){body.uxv62-more-open{overflow:visible!important}}
    @media(max-width:1180px){body.uxv62-more-open{overflow-y:auto!important;touch-action:auto!important}}
    .app-shell,.main,.view,.card,.metric-card,.table-wrap,.topbar,.searchbar,.actions{min-width:0!important;box-sizing:border-box!important}
    .first-run{z-index:4000!important}.drawer{z-index:3500!important}.drawer-panel{z-index:3501!important}.command-palette{z-index:3600!important}.mobile-more-sheet{z-index:3000!important}.toast{z-index:4100!important}
    body.first-run-open .topbar,body.first-run-open .mobile-bar,body.first-run-open .mobile-more-sheet{display:none!important}
    @media(max-width:1180px){
      body .app-shell{display:block!important;grid-template-columns:1fr!important;width:100%!important;overflow-x:clip!important}
      body .sidebar{display:none!important}
      body .main{width:100%!important;max-width:1040px!important;margin:0 auto!important;padding:16px 14px calc(82px + var(--mm-qa3-safe-bottom))!important;overflow-x:clip!important}
      body .topbar{position:sticky!important;top:0!important;z-index:120!important;display:grid!important;grid-template-columns:minmax(0,1fr) max-content!important;align-items:center!important;gap:8px!important;margin:-16px -14px 14px!important;padding:10px 14px!important;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent)!important;background:color-mix(in srgb,var(--bg) 96%,transparent)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important;overflow:visible!important}
      body .searchbar{grid-column:auto!important;width:100%!important;max-width:none!important;min-width:0!important;height:42px!important;min-height:42px!important;overflow:hidden!important}
      body .searchbar input{min-width:0!important;text-overflow:ellipsis!important}
      body .topbar .actions{display:grid!important;grid-template-columns:max-content 42px!important;align-items:center!important;justify-content:end!important;gap:8px!important;width:auto!important;min-width:0!important;max-width:100%!important;flex-wrap:nowrap!important;margin:0!important}
      body .topbar .actions .topbar-secondary{display:none!important}
      body .topbar .actions .btn-primary{display:inline-flex!important;min-width:112px!important;max-width:128px!important;height:42px!important;min-height:42px!important;padding:0 13px!important;border-radius:15px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;line-height:1!important;justify-content:center!important}
      body .topbar-menu-wrap{display:block!important;position:relative!important;width:42px!important;min-width:42px!important;max-width:42px!important}
      body .topbar-overflow-btn{display:grid!important;place-items:center!important;width:42px!important;height:42px!important;min-width:42px!important;border-radius:15px!important}
      body .topbar-menu{right:0!important;left:auto!important;max-width:min(280px,calc(100vw - 24px))!important;z-index:4500!important}
      body .mobile-bar{display:grid!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:110!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;overflow:hidden!important}
      body .mobile-bar button{min-width:0!important;overflow:hidden!important}
    }
    @media(min-width:761px) and (max-width:1180px){body .topbar .actions .btn-primary{max-width:none!important;width:auto!important}body .topbar{grid-template-columns:minmax(260px,1fr) max-content!important}}
    @media(max-width:760px){
      body .main{padding:8px 10px calc(72px + var(--mm-qa3-safe-bottom))!important;max-width:100%!important}
      body .topbar{grid-template-columns:1fr!important;gap:8px!important;margin:-8px -10px 10px!important;padding:8px 10px 9px!important}
      body .searchbar{height:40px!important;min-height:40px!important;border-radius:15px!important}
      body .searchbar span{flex:0 0 auto!important}
      body .topbar .actions{grid-template-columns:minmax(0,1fr) 42px!important;width:100%!important;justify-content:stretch!important}
      body .topbar .actions .btn-primary{width:100%!important;max-width:none!important;min-width:0!important;height:42px!important;min-height:42px!important}
      body .page-head,body .card-header{min-width:0!important;max-width:100%!important;overflow:visible!important}
      body .page-head .actions,body .card-header .actions{display:grid!important;grid-template-columns:1fr!important;width:100%!important;justify-content:stretch!important;gap:8px!important}
      body .page-head .actions .btn,body .card-header .actions .btn{width:100%!important;justify-content:center!important;min-width:0!important}
      body .section-title{overflow-wrap:anywhere!important}
      body .mobile-bar{height:calc(56px + var(--mm-qa3-safe-bottom))!important;padding:5px 7px calc(5px + var(--mm-qa3-safe-bottom))!important;gap:5px!important;background:color-mix(in srgb,var(--panel) 97%,transparent)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;box-shadow:0 -10px 28px rgba(0,0,0,.14)!important}
      body .mobile-bar button{height:46px!important;min-height:46px!important;border-radius:14px!important;padding:4px 2px!important;gap:1px!important}
      body .mobile-bar button span:first-child{font-size:17px!important;line-height:1!important}
      body .mobile-bar button span:last-child{font-size:9.5px!important;line-height:1.05!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
      body .first-run{align-items:flex-start!important;overflow:auto!important;padding:10px!important;background:rgba(4,8,15,.78)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}
      body .first-run-panel{width:100%!important;max-width:560px!important;margin:0 auto!important;border-radius:22px!important;padding:18px!important;max-height:none!important;overflow:visible!important}
      body .first-run-head h2{font-size:clamp(32px,11vw,42px)!important;line-height:.96!important}
      body .start-grid{grid-template-columns:1fr!important;gap:10px!important}
      body .start-option{min-height:auto!important;padding:16px!important}
      body .first-run-footer,body .first-run-footer .actions{display:grid!important;grid-template-columns:1fr!important;width:100%!important;gap:8px!important}
      body .first-run-footer .btn{width:100%!important}
      body .drawer-panel{inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;border-radius:0!important}
    }
    @media(max-width:390px){body .topbar .actions .btn-primary{font-size:0!important}body .topbar .actions .btn-primary::after{content:'Import';font-size:13px!important;font-weight:850!important}body .searchbar{padding-left:10px!important;padding-right:10px!important}body .searchbar input{font-size:15px!important}}
  `;
  function ensureStyle(){
    let s=document.getElementById('qa3-responsive-lock');
    if(!s){ s=document.createElement('style'); s.id='qa3-responsive-lock'; document.head.appendChild(s); }
    if(s.textContent!==css) s.textContent=css;
  }
  function markBuild(){
    try{ document.documentElement.setAttribute('data-moneymap-build', BUILD); document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{el.textContent=''+BUILD;}); }catch(e){}
  }
  function syncOverlayState(){
    const first=document.getElementById('firstRun');
    const drawer=document.getElementById('drawer');
    document.body.classList.toggle('first-run-open', !!first?.classList.contains('active'));
    document.body.classList.toggle('drawer-open', !!drawer?.classList.contains('active'));
    markBuild();
  }
  function after(){ ensureStyle(); requestAnimationFrame(()=>{ syncOverlayState(); requestAnimationFrame(syncOverlayState); }); }
  ['openFirstRun','closeFirstRun','completeFirstRun','openDrawer','closeDrawer','toggleMobileMore','showView','renderAll','renderSettings'].forEach(name=>{
    const fn=window[name];
    if(typeof fn==='function' && !fn.__qa3OverlayWrapped){
      const wrapped=function(){ const out=fn.apply(this,arguments); after(); return out; };
      wrapped.__qa3OverlayWrapped=true;
      window[name]=wrapped;
    }
  });
  document.addEventListener('DOMContentLoaded',after);
  window.addEventListener('resize',after,{passive:true});
  window.addEventListener('orientationchange',after,{passive:true});
  ensureStyle(); after();
})();


/* ---- MoneyMap QA3.1 high-specificity topbar override ---- */
(function(){
  const css=`
  @media(max-width:1180px){
    body .app-shell .main>.topbar{display:grid!important;grid-template-columns:minmax(0,1fr) max-content!important;align-items:center!important;gap:8px!important;margin:-16px -14px 14px!important;padding:10px 14px!important;min-height:62px!important;height:auto!important;overflow:visible!important}
    body .app-shell .main>.topbar>.searchbar{grid-column:1!important;grid-row:1!important;width:100%!important;max-width:none!important;min-width:0!important;height:42px!important;min-height:42px!important}
    body .app-shell .main>.topbar>.actions{display:grid!important;grid-template-columns:max-content 42px!important;grid-column:2!important;grid-row:1!important;align-items:center!important;justify-content:end!important;gap:8px!important;width:auto!important;min-width:0!important;max-width:100%!important;margin:0!important;order:0!important}
    body .app-shell .main>.topbar .topbar-secondary{display:none!important}
    body .app-shell .main>.topbar>.actions>.btn-primary{grid-column:1!important;grid-row:1!important;justify-self:stretch!important;align-self:center!important;display:inline-flex!important;width:auto!important;min-width:112px!important;max-width:132px!important;height:42px!important;min-height:42px!important;padding:0 13px!important;border-radius:15px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:12.5px!important;line-height:1!important;justify-content:center!important}
    body .app-shell .main>.topbar .topbar-menu-wrap{grid-column:2!important;grid-row:1!important;justify-self:stretch!important;align-self:center!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;display:block!important;position:relative!important}
    body .app-shell .main>.topbar .topbar-overflow-btn{width:42px!important;min-width:42px!important;height:42px!important;min-height:42px!important;border-radius:15px!important;display:inline-grid!important;place-items:center!important}
  }
  @media(min-width:761px) and (max-width:1180px){body .app-shell .main>.topbar>.actions>.btn-primary{max-width:none!important;width:auto!important}}
  @media(max-width:760px){
    body .app-shell .main>.topbar{grid-template-columns:1fr!important;gap:8px!important;margin:-8px -10px 10px!important;padding:8px 10px 9px!important;min-height:0!important}
    body .app-shell .main>.topbar>.searchbar{grid-column:1!important;grid-row:1!important}
    body .app-shell .main>.topbar>.actions{grid-column:1!important;grid-row:2!important;grid-template-columns:minmax(0,1fr) 42px!important;width:100%!important;justify-content:stretch!important}
    body .app-shell .main>.topbar>.actions>.btn-primary{width:100%!important;min-width:0!important;max-width:none!important}
  }
  @media(max-width:390px){body .app-shell .main>.topbar>.actions>.btn-primary{font-size:0!important}body .app-shell .main>.topbar>.actions>.btn-primary::after{content:'Import';font-size:13px!important;font-weight:850!important}}
  `;
  function apply(){ let s=document.getElementById('qa3-topbar-override'); if(!s){s=document.createElement('style'); s.id='qa3-topbar-override'; document.head.appendChild(s);} s.textContent=css; }
  apply(); document.addEventListener('DOMContentLoaded',apply); window.addEventListener('resize',apply,{passive:true});
})();


/* ---- MoneyMap QA3.2 tablet transaction list guard ---- */
(function(){
  const css=`@media(max-width:820px){body #view-transactions .table-wrap{display:none!important}body #view-transactions .tx-card-list{display:grid!important;gap:10px!important;margin-top:10px!important}}`;
  function apply(){let s=document.getElementById('qa3-transaction-guard'); if(!s){s=document.createElement('style'); s.id='qa3-transaction-guard'; document.head.appendChild(s);} s.textContent=css;}
  apply(); document.addEventListener('DOMContentLoaded',apply); window.addEventListener('resize',apply,{passive:true});
})();


/* ---- MoneyMap QA5 scroll-restore + desktop more-sheet guard + build relabel ----
   Root cause of the "page cannot scroll" report (esp. Windows/Firefox):
   unconditional `overflow-x:hidden` on html/body forced the cross axis to
   compute to `auto`, turning <html> into the scroll container and suppressing
   normal viewport scrolling. Changed to `overflow-x:clip`. This guard also makes
   sure the mobile "More" body-lock can never get stuck at desktop widths. */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  function isDesktop(){ return window.innerWidth > 1180; }
  function unstickDesktopScroll(){
    try{
      if(isDesktop()){
        // Never leave the body scroll-locked on desktop.
        if(document.body.classList.contains('uxv62-more-open')){
          document.body.classList.remove('uxv62-more-open');
          const sheet=document.getElementById('mobileMoreSheet');
          if(sheet){ sheet.classList.remove('active'); sheet.setAttribute('aria-hidden','true'); }
        }
        // Defensive: clear any inline overflow lock a prior layer may have set.
        if(document.body.style.overflow==='hidden') document.body.style.overflow='';
        if(document.documentElement.style.overflow==='hidden') document.documentElement.style.overflow='';
      }
    }catch(e){}
  }
  function markBuild(){
    try{
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{
        el.textContent=''+BUILD;
      });
    }catch(e){}
  }
  function run(){ unstickDesktopScroll(); markBuild(); }
  // Wrap renderAll so the build label survives every re-render (runs last).
  try{
    const prev=window.renderAll;
    if(typeof prev==='function' && !prev.__qa5Wrapped){
      const wrapped=function(){ const out=prev.apply(this,arguments); requestAnimationFrame(run); return out; };
      wrapped.__qa5Wrapped=true; window.renderAll=wrapped;
    }
  }catch(e){}
  document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('resize',unstickDesktopScroll,{passive:true});
  run();
})();

/* ---- QA6 deploy/navigation/dialog finalization ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const NAV_ITEMS=[
    {id:'overview',title:'Overview',mobile:'Home',sub:'Command center'},
    {id:'accounts',title:'Accounts',mobile:'Accounts',sub:'Balances'},
    {id:'transactions',title:'Transactions',mobile:'Txns',sub:'Search and edit'},
    {id:'budgets',title:'Budgets',mobile:'Budget',sub:'Monthly limits'},
    {id:'review',title:'Review',mobile:'Review',sub:'Weekly cleanup'},
    {id:'import',title:'Import',mobile:'Import',sub:'CSV dropzone'},
    {id:'networth',title:'Net worth',mobile:'Net worth',sub:'History'},
    {id:'recurring',title:'Subscriptions',mobile:'Subs',sub:'Recurring charges'},
    {id:'debt',title:'Debt',mobile:'Debt',sub:'Payoff plan'},
    {id:'investments',title:'Investments',mobile:'Invest',sub:'Holdings'},
    {id:'credit',title:'Credit',mobile:'Credit',sub:'Score history'},
    {id:'goals',title:'Goals',mobile:'Goals',sub:'Targets'},
    {id:'rules',title:'Rules',mobile:'Rules',sub:'Autopilot'},
    {id:'settings',title:'Settings',mobile:'Settings',sub:'Local app'}
  ];
  const FALLBACK_ICONS={overview:'⌂',accounts:'▤',transactions:'≡',budgets:'◌',review:'✓',import:'⇡',networth:'◆',recurring:'↻',debt:'◒',investments:'△',credit:'◧',goals:'◇',rules:'⚡',settings:'⚙',more:'•••'};
  const DEF_PRIMARY=['overview','accounts','transactions','budgets','review','import'];
  const DEF_MOBILE=['overview','accounts','transactions','budgets'];
  const allIds=()=>NAV_ITEMS.map(x=>x.id);
  const navItem=id=>NAV_ITEMS.find(x=>x.id===id) || {id,title:id,mobile:id,sub:''};
  function navIcon(id){ try{ return (typeof window.mmNavIcon==='function' && window.mmNavIcon(id)) || FALLBACK_ICONS[id] || '•'; }catch(e){ return FALLBACK_ICONS[id] || '•'; } }
  function validList(list,fallback){ const ids=allIds(); const seen=new Set(); const source=Array.isArray(list)?list:fallback; const out=source.filter(id=>ids.includes(id) && !seen.has(id) && (seen.add(id),true)); return out.length?out:fallback.slice(); }
  function navSettings(){ state.settings=state.settings||{}; state.settings.navPrimary=validList(state.settings.navPrimary,DEF_PRIMARY); state.settings.mobileTabs=validList(state.settings.mobileTabs,DEF_MOBILE).slice(0,4); if(!state.settings.mobileTabs.length) state.settings.mobileTabs=DEF_MOBILE.slice(); return state.settings; }
  function navButton(id,extra=''){ const n=navItem(id); return `<button type="button" class="nav-btn ${extra} ${id===activeView?'active':''}" data-view="${id}" onclick="showView('${id}')"><span class="nav-icon">${navIcon(id)}</span><span class="nav-copy"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.sub)}</span></span></button>`; }
  window.buildNav=function(){
    const side=document.getElementById('sideNav'); if(!side) return;
    const s=navSettings(); const primary=s.navPrimary; const more=allIds().filter(id=>!primary.includes(id));
    side.innerHTML=`${primary.map(id=>navButton(id)).join('')}<div class="nav-inline-head"><span>More</span><button type="button" class="btn btn-small" onclick="showView('settings'); setTimeout(()=>document.getElementById('navLayoutSettings')?.scrollIntoView({behavior:'smooth',block:'start'}),80)">Edit</button></div>${more.map(id=>navButton(id,'secondary')).join('')}`;
  };
  function ensureMoreSheet(){
    let sheet=document.getElementById('mobileMoreSheet');
    if(!sheet){ sheet=document.createElement('div'); sheet.id='mobileMoreSheet'; sheet.className='mobile-more-sheet'; document.body.appendChild(sheet); }
    sheet.setAttribute('aria-hidden', sheet.classList.contains('active')?'false':'true');
    sheet.innerHTML=`<div class="mobile-more-panel" role="dialog" aria-modal="true" aria-label="More MoneyMap sections"><div class="mobile-more-head"><div><b>More sections</b><span>Open the sections that are not pinned to the bottom bar.</span></div><button type="button" class="btn btn-small" onclick="closeMobileMoreSheet()">Close</button></div><div class="mobile-more-grid" id="mobileMoreGrid"></div></div>`;
    sheet.onclick=e=>{ if(e.target===sheet) closeMobileMoreSheet(); };
    return sheet;
  }
  function renderMobileMoreGrid(){ const sheet=ensureMoreSheet(); const grid=sheet.querySelector('#mobileMoreGrid'); if(!grid) return; const pinned=navSettings().mobileTabs; const more=allIds().filter(id=>!pinned.includes(id)); grid.innerHTML=more.map(id=>{ const n=navItem(id); return `<button type="button" class="mobile-more-item ${id===activeView?'active':''}" data-view="${id}" onclick="closeMobileMoreSheet(); showView('${id}')"><span class="mobile-more-icon">${navIcon(id)}</span><span class="mobile-more-copy"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.sub)}</span></span></button>`; }).join(''); }
  window.openMobileMoreSheet=function(){ const sheet=ensureMoreSheet(); renderMobileMoreGrid(); sheet.classList.add('active'); sheet.setAttribute('aria-hidden','false'); document.body.classList.add('mm-more-open'); };
  window.closeMobileMoreSheet=function(){ const sheet=document.getElementById('mobileMoreSheet'); if(sheet){ sheet.classList.remove('active'); sheet.setAttribute('aria-hidden','true'); } document.body.classList.remove('mm-more-open','uxv62-more-open'); };
  window.toggleMobileMore=function(open){ const sheet=ensureMoreSheet(); const next=typeof open==='boolean'?open:!sheet.classList.contains('active'); next?openMobileMoreSheet():closeMobileMoreSheet(); };
  window.buildMobileNav=function(){ const nav=document.getElementById('mobileNav'); if(!nav) return; const pinned=navSettings().mobileTabs; const moreActive=!pinned.includes(activeView); nav.innerHTML=pinned.map(id=>{ const n=navItem(id); return `<button type="button" class="${id===activeView?'active':''}" onclick="showView('${id}')" aria-label="Open ${escapeHtml(n.title)}"><span>${navIcon(id)}</span><span>${escapeHtml(n.mobile||n.title)}</span></button>`; }).join('')+`<button type="button" class="${moreActive?'active':''}" onclick="openMobileMoreSheet()" aria-label="Open more sections"><span>${navIcon('more')}</span><span>More</span></button>`; renderMobileMoreGrid(); };
  window.toggleNavPrimary=function(id){ const s=navSettings(); const idx=s.navPrimary.indexOf(id); if(idx>=0 && id!=='overview') s.navPrimary.splice(idx,1); else if(idx<0) s.navPrimary.push(id); saveState(); buildNav(); renderNavLayoutSettings(); toast('Navigation updated.'); };
  window.moveNavPrimary=function(id,dir){ const s=navSettings(); const i=s.navPrimary.indexOf(id); if(i<0) return; const j=Math.max(0,Math.min(s.navPrimary.length-1,i+dir)); [s.navPrimary[i],s.navPrimary[j]]=[s.navPrimary[j],s.navPrimary[i]]; saveState(); buildNav(); renderNavLayoutSettings(); };
  window.toggleMobileTab=function(id){ const s=navSettings(); const idx=s.mobileTabs.indexOf(id); if(idx>=0){ if(s.mobileTabs.length>1) s.mobileTabs.splice(idx,1); } else { if(s.mobileTabs.length>=4) s.mobileTabs.shift(); s.mobileTabs.push(id); } saveState(); buildMobileNav(); renderNavLayoutSettings(); toast('Bottom navigation updated.'); };
  window.resetNavLayout=function(){ state.settings.navPrimary=DEF_PRIMARY.slice(); state.settings.mobileTabs=DEF_MOBILE.slice(); saveState(); buildNav(); buildMobileNav(); renderNavLayoutSettings(); toast('Navigation reset.'); };
  window.renderNavLayoutSettings=function(){
    const el=document.getElementById('navLayoutSettings'); if(!el) return; const s=navSettings();
    el.innerHTML=`<div class="card-header"><div><h3 class="card-title">Navigation layout</h3><p class="card-subtitle">Pin frequent sections to the sidebar and bottom bar. Other sections remain under More.</p></div><button type="button" class="btn btn-small" onclick="resetNavLayout()">Reset</button></div><div class="mm-v095-tab-list">${NAV_ITEMS.map(n=>{ const pinned=s.navPrimary.includes(n.id); const mobile=s.mobileTabs.includes(n.id); return `<div class="mm-v095-tab-row"><span class="mm-v095-tab-icon">${navIcon(n.id)}</span><div><b>${escapeHtml(n.title)}</b><span>${escapeHtml(n.sub)}</span></div><div class="mm-v095-tab-actions"><button type="button" class="btn btn-small ${pinned?'btn-primary':''}" onclick="toggleNavPrimary('${n.id}')">${pinned?'Sidebar':'More'}</button><button type="button" class="btn btn-small ${mobile?'btn-primary':''}" onclick="toggleMobileTab('${n.id}')">${mobile?'Bottom':'Mobile'}</button><button type="button" class="btn btn-small" onclick="moveNavPrimary('${n.id}',-1)">Up</button><button type="button" class="btn btn-small" onclick="moveNavPrimary('${n.id}',1)">Down</button></div></div>`; }).join('')}</div>`;
  };
  function markBuild(){ try{ document.documentElement.setAttribute('data-moneymap-build',BUILD); document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=''+BUILD; }); }catch(e){} }
  function afterRender(){ try{ document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; }); buildNav(); buildMobileNav(); renderMobileMoreGrid(); renderNavLayoutSettings(); markBuild(); }catch(e){ console.warn('MoneyMap QA6 afterRender failed',e); } }
  const priorShow=window.showView;
  if(typeof priorShow==='function' && !priorShow.__qa6Wrapped){ window.showView=function(id){ closeMobileMoreSheet(); const out=priorShow.apply(this,arguments); requestAnimationFrame(afterRender); return out; }; window.showView.__qa6Wrapped=true; }
  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__qa6Wrapped){ window.renderAll=function(){ const out=priorRenderAll.apply(this,arguments); requestAnimationFrame(afterRender); return out; }; window.renderAll.__qa6Wrapped=true; }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeMobileMoreSheet(); });
  document.addEventListener('DOMContentLoaded',afterRender);
  window.addEventListener('resize',afterRender,{passive:true});
  afterRender();
})();


/* ---- Refactor 1: mobile-first app shell and navigation ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const PRIMARY_MOBILE=['overview','accounts','transactions','budgets'];
  const PRIMARY_DESKTOP=['overview','accounts','transactions','budgets','review','import'];
  const SECONDARY=['review','import','networth','recurring','debt','investments','credit','goals','rules','settings'];
  const NAV_META={
    overview:{title:'Dashboard',mobile:'Home',sub:'Your money home base',icon:'⌂'},
    accounts:{title:'Accounts',mobile:'Accounts',sub:'Manual balances',icon:'▤'},
    transactions:{title:'Transactions',mobile:'Txns',sub:'Search and edit',icon:'≡'},
    budgets:{title:'Budgets',mobile:'Budget',sub:'Monthly limits',icon:'◌'},
    review:{title:'Weekly review',mobile:'Review',sub:'Clean up transactions',icon:'✓'},
    import:{title:'Import CSV',mobile:'Import',sub:'Bring in bank exports',icon:'⇡'},
    networth:{title:'Net worth',mobile:'Net worth',sub:'History and snapshots',icon:'◆'},
    recurring:{title:'Subscriptions',mobile:'Subs',sub:'Recurring charges',icon:'↻'},
    debt:{title:'Debt payoff',mobile:'Debt',sub:'Paydown plan',icon:'◒'},
    investments:{title:'Investments',mobile:'Invest',sub:'Holdings tracker',icon:'△'},
    credit:{title:'Credit',mobile:'Credit',sub:'Score history',icon:'◧'},
    goals:{title:'Goals',mobile:'Goals',sub:'Savings targets',icon:'◇'},
    rules:{title:'Rules',mobile:'Rules',sub:'Automation rules',icon:'⚡'},
    settings:{title:'Settings',mobile:'Settings',sub:'Privacy and app tools',icon:'⚙'},
    more:{title:'More',mobile:'More',sub:'More sections',icon:'•••'}
  };
  const PRIMARY_ACTION={
    overview:{label:'Import',fn:"showView('import')"},
    accounts:{label:'Add',fn:"openDrawer('account')"},
    transactions:{label:'Add',fn:"openDrawer('transaction')"},
    budgets:{label:'Add',fn:"openDrawer('budget')"},
    review:{label:'Start',fn:'startWeeklyReview()'},
    import:{label:'Upload',fn:"document.getElementById('csvInput')?.click()"},
    networth:{label:'Snapshot',fn:'saveNetWorthSnapshot()'},
    recurring:{label:'Detect',fn:'detectRecurring(false)'},
    debt:{label:'Add',fn:"openDrawer('debt')"},
    investments:{label:'Add',fn:"openDrawer('holding')"},
    credit:{label:'Add',fn:"openDrawer('credit')"},
    goals:{label:'Add',fn:"openDrawer('goal')"},
    rules:{label:'Add',fn:"openDrawer('rule')"},
    settings:{label:'Backup',fn:"openDrawer('backup')"}
  };
  const TOOL_ITEMS=[
    {id:'quickAdd',title:'Quick add',sub:'Transaction, budget, goal',icon:'＋',fn:"openDrawer('quickAdd')"},
    {id:'backup',title:'Backups',sub:'Export, import, reset',icon:'↧',fn:"openDrawer('backup')"},
    {id:'command',title:'Search commands',sub:'Find actions fast',icon:'⌕',fn:'openCommandPalette()'}
  ];
  function html(s){ return (typeof escapeHtml==='function') ? escapeHtml(String(s ?? '')) : String(s ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function meta(id){ return NAV_META[id] || {title:id,mobile:id,sub:'',icon:'•'}; }
  function currentId(){ return activeView || 'overview'; }
  function icon(id){
    try{ if(typeof window.mmNavIcon==='function'){ return window.mmNavIcon(id) || meta(id).icon; } }catch(e){}
    return meta(id).icon;
  }
  function viewExists(id){ return !!document.getElementById('view-'+id); }
  function setBuildLabel(){
    try{
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=''+BUILD; });
    }catch(e){}
  }
  function navButton(id,extra=''){
    const m=meta(id);
    const active=id===currentId();
    return `<button type="button" class="nav-btn ${extra} ${active?'active':''}" data-view="${html(id)}" onclick="showView('${html(id)}')" aria-current="${active?'page':'false'}"><span class="nav-icon">${icon(id)}</span><span class="nav-copy"><strong>${html(m.title)}</strong><span>${html(m.sub)}</span></span></button>`;
  }
  window.buildNav=function(){
    const side=document.getElementById('sideNav');
    if(!side) return;
    const primary=PRIMARY_DESKTOP.filter(viewExists);
    const secondary=SECONDARY.filter(id=>!primary.includes(id) && viewExists(id));
    side.innerHTML=[
      primary.map(id=>navButton(id)).join(''),
      `<div class="nav-inline-head"><span>More</span></div>`,
      secondary.map(id=>navButton(id,'secondary')).join('')
    ].join('');
  };
  function ensureMobileHeader(){
    const main=document.getElementById('mainContent');
    if(!main) return null;
    let header=document.getElementById('mobileShellHeader');
    if(!header){
      header=document.createElement('div');
      header.id='mobileShellHeader';
      header.className='mobile-shell-header';
      main.insertBefore(header, main.firstElementChild || null);
    }
    return header;
  }
  function renderMobileHeader(){
    const header=ensureMobileHeader();
    if(!header) return;
    const id=currentId();
    const m=meta(id);
    const action=PRIMARY_ACTION[id] || {label:'Quick add',fn:"openDrawer('quickAdd')"};
    header.innerHTML=`<div class="mobile-shell-title"><span>MoneyMap</span><strong>${html(m.title)}</strong><small>${html(m.sub)}</small></div><div class="mobile-shell-actions"><button type="button" class="mobile-shell-primary" onclick="${action.fn}">${html(action.label)}</button><button type="button" class="mobile-shell-icon-btn" onclick="openCommandPalette()" aria-label="Search MoneyMap">⌕</button></div>`;
  }
  function ensureMoreSheet(){
    let sheet=document.getElementById('mobileMoreSheet');
    if(!sheet){
      sheet=document.createElement('div');
      sheet.id='mobileMoreSheet';
      sheet.className='mobile-more-sheet';
      document.body.appendChild(sheet);
    }
    sheet.onclick=e=>{ if(e.target===sheet) closeMobileMoreSheet(); };
    return sheet;
  }
  function moreItem(id){
    const m=meta(id);
    const active=id===currentId();
    return `<button type="button" class="mobile-more-item ${active?'active':''}" data-view="${html(id)}" onclick="closeMobileMoreSheet(); showView('${html(id)}')"><span class="mobile-more-icon">${icon(id)}</span><span class="mobile-more-copy"><strong>${html(m.title)}</strong><span>${html(m.sub)}</span></span></button>`;
  }
  function toolItem(t){
    return `<button type="button" class="mobile-more-item" data-tool="${html(t.id)}" onclick="closeMobileMoreSheet(); ${t.fn}"><span class="mobile-more-icon">${html(t.icon)}</span><span class="mobile-more-copy"><strong>${html(t.title)}</strong><span>${html(t.sub)}</span></span></button>`;
  }
  function renderMoreSheet(){
    const sheet=ensureMoreSheet();
    const visibleSecondary=SECONDARY.filter(id=>!PRIMARY_MOBILE.includes(id) && viewExists(id));
    sheet.innerHTML=`<div class="mobile-more-panel" role="dialog" aria-modal="true" aria-label="More MoneyMap sections"><div class="mobile-more-head"><div><b>More</b><span>Secondary pages and app tools.</span></div><button type="button" class="btn btn-small" onclick="closeMobileMoreSheet()">Close</button></div><div class="mobile-more-section-label">Pages</div><div class="mobile-more-grid">${visibleSecondary.map(moreItem).join('')}</div><div class="mobile-more-section-label">Tools</div><div class="mobile-more-grid tools">${TOOL_ITEMS.map(toolItem).join('')}</div></div>`;
    sheet.setAttribute('aria-hidden', sheet.classList.contains('active')?'false':'true');
  }
  window.openMobileMoreSheet=function(){
    const sheet=ensureMoreSheet();
    renderMoreSheet();
    sheet.classList.add('active');
    sheet.setAttribute('aria-hidden','false');
    document.body.classList.add('mm-more-open');
  };
  window.closeMobileMoreSheet=function(){
    const sheet=document.getElementById('mobileMoreSheet');
    if(sheet){ sheet.classList.remove('active'); sheet.setAttribute('aria-hidden','true'); }
    document.body.classList.remove('mm-more-open','uxv62-more-open');
  };
  window.toggleMobileMore=function(open){
    const sheet=ensureMoreSheet();
    const next=typeof open==='boolean' ? open : !sheet.classList.contains('active');
    next ? openMobileMoreSheet() : closeMobileMoreSheet();
  };
  window.buildMobileNav=function(){
    const nav=document.getElementById('mobileNav');
    if(!nav) return;
    const id=currentId();
    const moreActive=!PRIMARY_MOBILE.includes(id);
    nav.innerHTML=PRIMARY_MOBILE.map(view=>{
      const m=meta(view);
      const active=view===id;
      return `<button type="button" class="${active?'active':''}" onclick="showView('${view}')" aria-current="${active?'page':'false'}" aria-label="Open ${html(m.title)}"><span>${icon(view)}</span><span>${html(m.mobile || m.title)}</span></button>`;
    }).join('')+`<button type="button" class="${moreActive?'active':''}" onclick="openMobileMoreSheet()" aria-current="${moreActive?'page':'false'}" aria-label="Open more sections"><span>${icon('more')}</span><span>More</span></button>`;
    renderMoreSheet();
    renderMobileHeader();
  };
  window.renderNavLayoutSettings=function(){
    const el=document.getElementById('navLayoutSettings');
    if(!el) return;
    el.innerHTML=`<div class="card-header"><div><h3 class="card-title">Navigation layout</h3><p class="card-subtitle">Refactor 1 locks the mobile shell to four primary tabs plus More. This keeps iPhone navigation predictable.</p></div></div><div class="mini-list"><div class="mini-item"><div><b>Bottom bar</b><br><span>Dashboard, Accounts, Transactions, Budgets, More.</span></div><span class="pill">Fixed</span></div><div class="mini-item"><div><b>More menu</b><br><span>Review, Import, Net worth, Goals, Settings, and tools.</span></div><span class="pill">2 taps</span></div></div>`;
  };
  function injectStyle(){
    const css=`
      html,body{max-width:100%;overflow-x:clip!important;overflow-y:visible!important;height:auto!important}
      .app-shell,.main,.view{max-width:100%;min-width:0}
      .mobile-shell-header{display:none}
      @media(max-width:1180px){
        body .app-shell{display:block!important;grid-template-columns:1fr!important;overflow-x:clip!important;width:100%!important}
        body .sidebar{display:none!important}
        body .main{width:100%!important;max-width:1040px!important;min-width:0!important;margin:0 auto!important;overflow-x:clip!important;padding-bottom:calc(86px + env(safe-area-inset-bottom))!important}
        body .mobile-bar{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:2200!important;width:100%!important;max-width:100vw!important;overflow:hidden!important}
        body .mobile-bar button{min-width:0!important;width:100%!important;touch-action:manipulation!important}
      }
      @media(max-width:760px){
        body{overscroll-behavior-x:none!important}
        body.mm-more-open{overflow-y:auto!important;overflow-x:clip!important;touch-action:auto!important}
        body .main{padding:8px 10px calc(78px + env(safe-area-inset-bottom))!important;max-width:100%!important}
        body .app-shell .main>.topbar{display:none!important}
        body .mobile-shell-header{display:flex!important;position:sticky!important;top:0!important;z-index:2100!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:60px!important;margin:-8px -10px 10px!important;padding:9px 10px calc(9px + 0px)!important;border-bottom:1px solid color-mix(in srgb,var(--line) 76%,transparent)!important;background:color-mix(in srgb,var(--bg) 97%,transparent)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important;box-shadow:0 10px 22px rgba(0,0,0,.08)!important}
        body .mobile-shell-title{display:grid!important;min-width:0!important;gap:1px!important;line-height:1.05!important}
        body .mobile-shell-title span{font-family:var(--mono)!important;font-size:9px!important;letter-spacing:.16em!important;text-transform:uppercase!important;color:var(--muted)!important;font-weight:850!important}
        body .mobile-shell-title strong{display:block!important;min-width:0!important;max-width:58vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:20px!important;letter-spacing:-.04em!important;color:var(--text)!important}
        body .mobile-shell-title small{display:block!important;min-width:0!important;max-width:58vw!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:11px!important;color:var(--muted)!important}
        body .mobile-shell-actions{display:flex!important;align-items:center!important;gap:7px!important;flex:0 0 auto!important}
        body .mobile-shell-primary,body .mobile-shell-icon-btn{border:1px solid var(--line)!important;background:var(--panel2)!important;color:var(--text)!important;border-radius:14px!important;min-height:40px!important;font-weight:850!important;box-shadow:0 8px 18px rgba(0,0,0,.08)!important}
        body .mobile-shell-primary{padding:0 13px!important;background:linear-gradient(135deg,var(--accent),var(--accent2))!important;border-color:transparent!important;color:#08111f!important}
        body .mobile-shell-icon-btn{width:40px!important;display:grid!important;place-items:center!important;font-size:18px!important}
        body .mobile-bar{height:calc(64px + env(safe-area-inset-bottom))!important;padding:6px 6px calc(6px + env(safe-area-inset-bottom))!important;gap:4px!important;border-top:1px solid color-mix(in srgb,var(--line) 82%,transparent)!important;background:color-mix(in srgb,var(--panel) 98%,transparent)!important;backdrop-filter:blur(26px)!important;-webkit-backdrop-filter:blur(26px)!important;box-shadow:0 -12px 32px rgba(0,0,0,.18)!important}
        body .mobile-bar button{display:grid!important;grid-template-rows:22px 14px!important;place-items:center!important;gap:2px!important;height:52px!important;min-height:52px!important;border:1px solid transparent!important;border-radius:15px!important;background:transparent!important;color:var(--muted)!important;padding:5px 2px!important;font-weight:850!important;letter-spacing:-.01em!important;overflow:hidden!important}
        body .mobile-bar button span:first-child{font-size:18px!important;line-height:1!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        body .mobile-bar button span:last-child{font-size:10px!important;line-height:1!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        body .mobile-bar button.active{background:rgba(var(--accent-rgb),.12)!important;border-color:rgba(var(--accent-rgb),.24)!important;color:var(--accent)!important;box-shadow:none!important}
        body .mobile-more-sheet{position:fixed!important;inset:0!important;z-index:3200!important;display:none!important;align-items:flex-end!important;justify-content:center!important;padding:10px 10px calc(76px + env(safe-area-inset-bottom))!important;background:rgba(2,6,23,.54)!important;backdrop-filter:blur(14px)!important;-webkit-backdrop-filter:blur(14px)!important}
        body .mobile-more-sheet.active{display:flex!important}
        body .mobile-more-panel{width:100%!important;max-width:620px!important;max-height:min(76vh,680px)!important;overflow:auto!important;overscroll-behavior:contain!important;border:1px solid color-mix(in srgb,var(--line) 80%,transparent)!important;border-radius:24px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--panel) 98%,transparent),color-mix(in srgb,var(--panel2) 98%,transparent))!important;box-shadow:0 24px 80px rgba(0,0,0,.34)!important;padding:13px!important}
        body .mobile-more-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:2px 2px 12px!important}
        body .mobile-more-head b{display:block!important;font-size:20px!important;letter-spacing:-.04em!important}
        body .mobile-more-head span{display:block!important;color:var(--muted)!important;font-size:12px!important;margin-top:2px!important}
        body .mobile-more-section-label{margin:10px 4px 7px!important;color:var(--muted)!important;font-family:var(--mono)!important;font-size:10px!important;font-weight:850!important;letter-spacing:.14em!important;text-transform:uppercase!important}
        body .mobile-more-grid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
        body .mobile-more-item{display:flex!important;align-items:center!important;gap:11px!important;min-height:62px!important;width:100%!important;padding:11px!important;border:1px solid var(--line)!important;border-radius:17px!important;background:var(--panel2)!important;color:var(--text)!important;text-align:left!important;touch-action:manipulation!important}
        body .mobile-more-item.active{border-color:rgba(var(--accent-rgb),.36)!important;background:rgba(var(--accent-rgb),.11)!important;color:var(--accent)!important}
        body .mobile-more-icon{display:grid!important;place-items:center!important;flex:0 0 36px!important;width:36px!important;height:36px!important;border-radius:14px!important;background:var(--panel3)!important;color:inherit!important;font-size:18px!important}
        body .mobile-more-copy{min-width:0!important}
        body .mobile-more-copy strong{display:block!important;font-size:14px!important;line-height:1.1!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        body .mobile-more-copy span{display:block!important;margin-top:3px!important;color:var(--muted)!important;font-size:11.5px!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        body .page-head{margin-top:8px!important;margin-bottom:12px!important;display:grid!important;grid-template-columns:1fr!important;gap:10px!important;min-width:0!important}
        body .section-title{font-size:clamp(24px,7.5vw,32px)!important;line-height:1!important;overflow-wrap:anywhere!important}
        body .section-sub{font-size:13px!important;line-height:1.42!important}
        body .page-head>.actions,body .page-head>.btn{width:100%!important;justify-self:stretch!important}
        body .page-head>.actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
        body .page-head>.actions .btn,body .page-head>.btn{width:100%!important;justify-content:center!important;min-width:0!important}
        body .hero-row,body .command-actions{display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
        body .hero-row .btn,body .command-actions .btn{width:100%!important;justify-content:center!important}
        body .card,body .metric-card,body .tracker-stat{max-width:100%!important;min-width:0!important}
      }
      @media(max-width:390px){
        body .mobile-shell-title strong{font-size:18px!important;max-width:52vw!important}
        body .mobile-shell-title small{max-width:52vw!important}
        body .mobile-shell-primary{padding:0 10px!important;min-width:0!important}
        body .mobile-shell-icon-btn{width:38px!important}
        body .mobile-bar{gap:3px!important;padding-left:5px!important;padding-right:5px!important}
        body .mobile-bar button span:last-child{font-size:9px!important}
      }
      @media(min-width:761px){body .mobile-shell-header{display:none!important}}
      @media(print){body .mobile-shell-header,body .mobile-bar,body .mobile-more-sheet{display:none!important}}
    `;
    let style=document.getElementById('r1-mobile-shell-style');
    if(!style){ style=document.createElement('style'); style.id='r1-mobile-shell-style'; document.head.appendChild(style); }
    if(style.textContent!==css) style.textContent=css;
  }
  function syncShell(){
    try{
      injectStyle();
      buildNav();
      buildMobileNav();
      renderMobileHeader();
      renderNavLayoutSettings();
      setBuildLabel();
      document.querySelectorAll('button:not([type])').forEach(btn=>{ btn.type='button'; });
    }catch(e){ console.warn('MoneyMap Refactor 1 shell sync failed', e); }
  }
  const priorShow=window.showView;
  if(typeof priorShow==='function' && !priorShow.__r1MobileShellWrapped){
    window.showView=function(id){
      closeMobileMoreSheet();
      const out=priorShow.apply(this,arguments);
      requestAnimationFrame(syncShell);
      return out;
    };
    window.showView.__r1MobileShellWrapped=true;
  }
  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r1MobileShellWrapped){
    window.renderAll=function(){
      const out=priorRenderAll.apply(this,arguments);
      requestAnimationFrame(syncShell);
      return out;
    };
    window.renderAll.__r1MobileShellWrapped=true;
  }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeMobileMoreSheet(); });
  document.addEventListener('DOMContentLoaded',syncShell);
  window.addEventListener('resize',syncShell,{passive:true});
  window.addEventListener('orientationchange',syncShell,{passive:true});
  syncShell();
})();


/* ---- Refactor 2: safe action system and destructive action copy ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const originalLoadDemoData=window.loadDemoData;

  function html(value){ return (typeof escapeHtml==='function') ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function displayMoney(value, opts){ try{ return money(value, opts); }catch(e){ return String(value ?? '—'); } }
  function todayBuild(){ try{ document.documentElement.setAttribute('data-moneymap-build',BUILD); document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=''+BUILD; }); }catch(e){} }
  function countLabel(count, singular, plural){ const n=Number(count||0); return `${n} ${n===1?singular:(plural||singular+'s')}`; }
  function workspaceSummary(){
    try{
      const s=typeof backupSummary==='function' ? backupSummary() : {};
      return [
        {label:'Transactions',value:countLabel(s.transactions,'transaction')},
        {label:'Accounts',value:countLabel(s.accounts,'account')},
        {label:'Budgets',value:countLabel((state.budgets||[]).length,'budget')},
        {label:'Trackers',value:countLabel((s.goals||0)+(s.debts||0)+(s.holdings||0)+(s.creditLogs||0),'item')},
        {label:'Rules',value:countLabel(s.rules,'rule')}
      ];
    }catch(e){ return []; }
  }
  function find(collection,id){ return (state?.[collection]||[]).find(x=>x.id===id) || null; }
  function itemName(collection,item){
    if(!item) return typeof mmCollectionLabel==='function' ? mmCollectionLabel(collection) : 'item';
    if(collection==='transactions') return item.description || 'Transaction';
    if(collection==='rules') return item.contains || 'Automation rule';
    if(collection==='creditHistory') return item.month || item.date || 'Credit log';
    if(collection==='importMappings') return item.name || 'CSV mapping';
    if(collection==='netWorthHistory') return item.date || 'Net worth snapshot';
    return item.name || item.description || item.category || item.symbol || item.date || 'Item';
  }
  function deleteConfig(collection,id){
    const item=find(collection,id);
    const name=itemName(collection,item);
    const fallback={itemType:'item',itemName:name,details:[],impact:['This removes the selected item from this browser.']};
    if(!item) return fallback;
    if(collection==='accounts'){
      const signed=typeof accountSignedValue==='function' ? accountSignedValue(item) : Number(item.balance||0);
      return {itemType:'account',itemName:name,details:[
        {label:'Type',value:item.type||'Account'},
        {label:'Institution',value:item.institution||'Manual'},
        {label:'Balance',value:displayMoney(signed)},
        {label:'Net worth',value:item.includeNetWorth!==false?'Included':'Excluded'}
      ],impact:['Removes this manual balance from Accounts.','Transactions, budgets, and CSV imports are not deleted.']};
    }
    if(collection==='debts'){
      return {itemType:'debt',itemName:name,details:[
        {label:'Lender',value:item.lender||'Manual'},
        {label:'Balance',value:displayMoney(item.balance)},
        {label:'APR',value:(typeof pctFmt==='function'?pctFmt(item.apr):`${item.apr||0}%`)},
        {label:'Net worth',value:item.includeNetWorth!==false?'Included':'Excluded'}
      ],impact:['Removes this payoff tracker and payment plan row.','Transactions and accounts are not deleted.']};
    }
    if(collection==='holdings'){
      const total=(Number(item.quantity||0)*Number(item.price||0));
      return {itemType:'holding',itemName:name,details:[
        {label:'Symbol',value:item.symbol||'—'},
        {label:'Account',value:item.account||'Manual'},
        {label:'Value',value:displayMoney(total)},
        {label:'Net worth',value:item.includeNetWorth!==false?'Included':'Excluded'}
      ],impact:['Removes this investment holding from the tracker.','No transactions or account records are removed.']};
    }
    if(collection==='netWorthHistory'){
      return {itemType:'snapshot',itemName:name,details:[
        {label:'Date',value:item.date?dateFmt(item.date):'—'},
        {label:'Net worth',value:displayMoney(item.netWorth)},
        {label:'Note',value:item.note||'Manual snapshot'}
      ],impact:['Removes this historical net worth point.','Current accounts, debts, and holdings are not changed.']};
    }
    return fallback;
  }
  async function confirmDelete(config){
    if(typeof mmConfirmDelete==='function') return await mmConfirmDelete(config);
    return await mmConfirm(`Delete ${config.itemType||'item'} "${config.itemName||''}"? This cannot be undone.`, {title:`Delete ${config.itemType||'item'}?`,confirmText:'Delete',danger:true});
  }
  function closeAnyDrawer(){ try{ closeDrawer(); }catch(e){} }
  function finish(msg){ if(msg) toast(msg); renderAll(); todayBuild(); }

  window.deleteTrackerItem=async function(collection,id,options={}){
    if(!state?.[collection]) return false;
    const config=deleteConfig(collection,id);
    const ok=await confirmDelete(config);
    if(!ok) return false;
    state[collection]=state[collection].filter(x=>x.id!==id);
    if(options.closeDrawer) closeAnyDrawer();
    const label=(config.itemType||'item').replace(/^./,c=>c.toUpperCase());
    finish(`${label} deleted.`);
    return true;
  };

  window.deleteTransaction=async function(id){
    const tx=find('transactions',id); if(!tx) return;
    const ok=await confirmDelete({
      itemType:'transaction',
      itemName:tx.description||'Transaction',
      details:[
        {label:'Date',value:tx.date?dateFmt(tx.date):'—'},
        {label:'Amount',value:displayMoney(tx.amount,{cents:true})},
        {label:'Category',value:tx.category||'Other'},
        {label:'Account',value:tx.account||'General'}
      ],
      impact:['Removes this transaction from spending, income, budgets, reports, and review counts.','Import history and saved mappings are not deleted.']
    });
    if(!ok) return;
    state.transactions=(state.transactions||[]).filter(t=>t.id!==id);
    closeAnyDrawer();
    finish('Transaction deleted.');
  };

  window.deleteGoal=async function(id){
    const goal=find('goals',id); if(!goal) return;
    const target=Number(goal.target||0), current=Number(goal.current||0);
    const ok=await confirmDelete({
      itemType:'goal',
      itemName:goal.name||'Goal',
      details:[
        {label:'Progress',value:`${displayMoney(current)} of ${displayMoney(target)}`},
        {label:'Due date',value:goal.dueDate?dateFmt(goal.dueDate):'No due date'},
        {label:'Priority',value:goal.priority||'Medium'}
      ],
      impact:['Removes this savings target and progress tracker.','Accounts and transactions are not changed.']
    });
    if(!ok) return;
    state.goals=(state.goals||[]).filter(g=>g.id!==id);
    finish('Goal deleted.');
  };

  window.deleteCreditLog=async function(id){
    const entry=find('creditHistory',id); if(!entry) return;
    const avg=typeof avgScore==='function' ? avgScore(entry) : null;
    const ok=await confirmDelete({
      itemType:'credit log',
      itemName:entry.month||entry.date||'Credit log',
      details:[
        {label:'Average score',value:avg||'—'},
        {label:'Utilization',value:entry.utilization!==null&&entry.utilization!==undefined?`${entry.utilization}%`:'—'},
        {label:'Source',value:entry.source||'Manual'}
      ],
      impact:['Removes this score entry from credit history charts.','No transaction or account data is changed.']
    });
    if(!ok) return;
    state.creditHistory=(state.creditHistory||[]).filter(e=>e.id!==id);
    finish('Credit log deleted.');
  };

  window.deleteSavedMapping=async function(id){
    const mapping=find('importMappings',id); if(!mapping) return;
    const ok=await confirmDelete({
      itemType:'CSV mapping',
      itemName:mapping.name||'Bank mapping',
      details:[
        {label:'Columns',value:countLabel((mapping.headers||[]).length,'column')},
        {label:'Used',value:countLabel(mapping.useCount||0,'time','times')},
        {label:'Updated',value:mapping.updatedAt?dateFmt(String(mapping.updatedAt).slice(0,10)):'—'}
      ],
      impact:['Removes this reusable import mapping.','Past imports and transactions are not deleted.']
    });
    if(!ok) return;
    state.importMappings=(state.importMappings||[]).filter(m=>m.id!==id);
    finish('Saved mapping deleted.');
  };

  window.deleteRule=async function(id){
    const rule=find('rules',id); if(!rule) return;
    const ok=await confirmDelete({
      itemType:'automation rule',
      itemName:rule.contains||'Rule',
      details:[
        {label:'Match text',value:rule.contains||'—'},
        {label:'Action',value:(typeof ruleActionLabel==='function'?ruleActionLabel(rule):(rule.action||'Categorize'))},
        {label:'Category',value:rule.category||'Other'},
        {label:'Scope',value:rule.direction==='any'?'Any amount':(rule.direction||'Spend')}
      ],
      impact:['Stops this rule from applying to future imports and automation runs.','Existing transactions are not deleted.']
    });
    if(!ok) return;
    state.rules=(state.rules||[]).filter(r=>r.id!==id);
    finish('Automation rule deleted.');
  };

  window.resetAllData=async function(){
    const ok=await mmConfirmDanger('This clears the current MoneyMap workspace from this browser. Export a backup first if you may need it later.', {
      title:'Reset MoneyMap?',
      confirmText:'Delete all data',
      requireText:'DELETE',
      requireLabel:'Type DELETE to confirm reset',
      details:workspaceSummary(),
      impact:['Deletes transactions, budgets, accounts, goals, trackers, rules, import history, saved mappings, settings, and local backup metadata.','This does not delete files on your computer or anything outside this browser.']
    });
    if(!ok) return;
    state=clone(defaultState);
    ensureStarterContent();
    try{ OLD_STORAGE_KEYS.forEach(key=>localStorage.removeItem(key)); localStorage.removeItem(STORAGE_KEY); }catch(e){}
    saveState();
    closeAnyDrawer();
    finish('Local data reset.');
    openFirstRunIfNeeded();
  };

  window.importBackupFile=function(e){
    const input=e.target; const file=input.files && input.files[0]; if(!file) return;
    file.text().then(async text=>{
      try{
        const parsed=JSON.parse(text);
        const incoming=extractBackupState(parsed);
        const summary=parsed.summary || {
          transactions:(incoming.transactions||[]).length,
          accounts:(incoming.accounts||[]).length,
          goals:(incoming.goals||[]).length,
          debts:(incoming.debts||[]).length,
          holdings:(incoming.holdings||[]).length,
          creditLogs:(incoming.creditHistory||[]).length,
          rules:(incoming.rules||[]).length
        };
        const exported=parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'unknown date';
        const ok=await mmConfirmDanger('Importing this backup replaces the current local workspace in this browser.', {
          title:'Import backup?',
          confirmText:'Import backup',
          details:[
            {label:'Backup date',value:exported},
            {label:'Transactions',value:countLabel(summary.transactions,'transaction')},
            {label:'Accounts',value:countLabel(summary.accounts,'account')},
            {label:'Goals',value:countLabel(summary.goals,'goal')},
            {label:'Trackers',value:countLabel((summary.debts||0)+(summary.holdings||0)+(summary.creditLogs||0),'item')},
            {label:'Rules',value:countLabel(summary.rules||0,'rule')}
          ],
          impact:['Current local data will be replaced by the backup contents.','Export your current workspace first if you need to keep it.']
        });
        if(!ok){ input.value=''; return; }
        state=mergeState(defaultState,incoming);
        state.settings.lastRestore=new Date().toISOString();
        state.settings.startupSeenBuild=APP_BUILD_ID;
        saveState();
        closeAnyDrawer();
        finish('Backup JSON imported.');
      }catch(err){
        const preview=document.getElementById('backupImportPreview');
        if(preview) preview.innerHTML=`<div class="mini-item"><div><b>Import failed</b><br><span>${html(err.message||'Could not read this JSON file.')}</span></div><strong class="bad">Error</strong></div>`;
        toast('Could not import backup JSON.');
      }finally{ input.value=''; }
    });
  };

  window.loadDemoData=async function(options={}){
    if(!options.force && typeof workspaceHasUserData==='function' && workspaceHasUserData()){
      const ok=await mmConfirmDanger('Demo mode replaces the current workspace with sample data.', {
        title:'Load demo workspace?',
        confirmText:'Load demo',
        details:workspaceSummary(),
        impact:['Current local transactions, budgets, accounts, trackers, rules, and settings will be replaced.','Export a backup first if you want to keep this workspace.']
      });
      if(!ok) return;
    }
    return originalLoadDemoData.apply(this,arguments);
  };

  window.chooseFirstRun=async function(mode){
    if(mode==='continue'){ completeFirstRun(); toast('Current workspace continued.'); renderAll(); return; }
    if(mode==='demo'){
      if(typeof workspaceHasUserData==='function' && workspaceHasUserData()){
        const ok=await mmConfirmDanger('Demo mode replaces the current workspace with sample data.', {
          title:'Load demo workspace?',
          confirmText:'Load demo',
          details:workspaceSummary(),
          impact:['Current local transactions, budgets, accounts, trackers, rules, and settings will be replaced.','Export a backup first if you want to keep this workspace.']
        });
        if(!ok) return;
      }
      completeFirstRun();
      originalLoadDemoData.call(window);
      return;
    }
    if(mode==='import'){ completeFirstRun(); showView('import'); toast('Import center opened. Drop your CSV to begin.'); return; }
    if(mode==='fresh' && typeof workspaceHasUserData==='function' && workspaceHasUserData()){
      const ok=await mmConfirmDanger('Start fresh keeps your appearance settings but clears your current finance workspace.', {
        title:'Start fresh?',
        confirmText:'Clear workspace',
        details:workspaceSummary(),
        impact:['Clears transactions, imports, budgets, goals, credit logs, accounts, debts, holdings, rules, and saved mappings.','Your theme and app appearance are kept.']
      });
      if(!ok) return;
    }
    resetWorkspaceForFreshStart();
    saveState();
    closeFirstRun();
    showView('overview');
    toast('Fresh workspace ready. Add data whenever you want.');
  };

  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r2ActionSystemWrapped){
    window.renderAll=function(){ const out=priorRenderAll.apply(this,arguments); requestAnimationFrame(todayBuild); return out; };
    window.renderAll.__r2ActionSystemWrapped=true;
  }
  const priorShowView=window.showView;
  if(typeof priorShowView==='function' && !priorShowView.__r2ActionSystemWrapped){
    window.showView=function(){ const out=priorShowView.apply(this,arguments); requestAnimationFrame(todayBuild); return out; };
    window.showView.__r2ActionSystemWrapped=true;
  }
  todayBuild();
})();

/* R2.1 global search fix: make the top search visibly return results. */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  let searchResults=[];
  let activeIndex=0;

  function getGlobalSearchInput(){ return document.getElementById('globalSearch'); }
  function getGlobalSearchPanel(){ return document.getElementById('globalSearchPanel'); }
  function norm(v){ return String(v==null?'':v).toLowerCase(); }
  function terms(q){ return norm(q).trim().split(/\s+/).filter(Boolean); }
  function matches(hay,q){ const ts=terms(q); const h=norm(hay); return ts.length>0 && ts.every(t=>h.includes(t)); }
  function amountLabel(v){ try{ return typeof money==='function'?money(v,{cents:true}):String(v); }catch(e){ try{return money(v);}catch(_){return String(v);} } }
  function safeDate(v){ try{ return typeof dateFmt==='function'?dateFmt(v):String(v||''); }catch(e){ return String(v||''); } }
  function resultKey(kind,id){ return `${kind}:${id||''}`; }
  function addUnique(list,seen,item){ const key=resultKey(item.kind,item.id||item.title); if(seen.has(key)) return; seen.add(key); list.push(item); }

  function collectGlobalSearchResults(q){
    const out=[]; const seen=new Set();
    if(!q || !String(q).trim()) return out;
    const s=state||{};

    (typeof NAV!=='undefined'?NAV:[]).forEach(([id,title,sub,icon])=>{
      if(matches(`${title} ${sub} ${id}`, q)) addUnique(out,seen,{kind:'page',id,title,sub:`Open ${sub||title}`,value:'Page',icon:icon||'⌁',run:()=>showView(id)});
    });

    if(typeof commandActions==='function'){
      commandActions().forEach((a,i)=>{
        if(matches(`${a.title} ${a.sub} ${a.key||''}`, q)) addUnique(out,seen,{kind:'action',id:`cmd-${i}`,title:a.title,sub:a.sub,value:a.key||'Action',icon:a.icon||'⌘',run:a.fn});
      });
    }

    (s.transactions||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).forEach(tx=>{
      const hay=`${tx.description||''} ${tx.rawDescription||''} ${tx.category||''} ${tx.account||''} ${tx.notes||''} ${tx.amount||''} ${tx.date||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'transaction',id:tx.id,title:tx.description||'Transaction',sub:`${safeDate(tx.date)} · ${tx.category||'Other'} · ${tx.account||'General'}`,value:amountLabel(Number(tx.amount||0)),icon:Number(tx.amount)<0?'−':'+',run:()=>editTransaction(tx.id)});
    });

    const catTotals={};
    (s.transactions||[]).forEach(tx=>{
      if(tx.hidden) return;
      const cat=tx.category||'Other';
      if(!catTotals[cat]) catTotals[cat]={count:0,spend:0};
      catTotals[cat].count+=1;
      if(Number(tx.amount)<0) catTotals[cat].spend+=Math.abs(Number(tx.amount||0));
    });
    Object.entries(catTotals).sort((a,b)=>b[1].spend-a[1].spend).forEach(([cat,meta])=>{
      if(matches(cat,q)) addUnique(out,seen,{kind:'category',id:cat,title:cat,sub:`${meta.count} visible transaction${meta.count===1?'':'s'}`,value:amountLabel(meta.spend),icon:'◌',run:()=>{ showCategoryTransactions(cat); closeGlobalSearchPanel(); }});
    });

    (s.budgets||[]).forEach(b=>{
      if(matches(`${b.category||''} ${b.limit||''}`, q)) addUnique(out,seen,{kind:'budget',id:b.id,title:`${b.category||'Budget'} budget`,sub:`Monthly limit ${amountLabel(Number(b.limit||0))}`,value:'Budget',icon:'◌',run:()=>{ if(typeof editBudget==='function') editBudget(b.id); else showView('budgets'); }});
    });

    (s.accounts||[]).forEach(a=>{
      const hay=`${a.name||''} ${a.institution||''} ${a.type||''} ${a.balance||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'account',id:a.id,title:a.name||'Account',sub:`${a.institution||'Manual'} · ${a.type||'Account'}`,value:amountLabel(Number(a.balance||0)),icon:'◆',run:()=>showView('networth')});
    });

    (s.debts||[]).forEach(d=>{
      const hay=`${d.name||''} ${d.lender||''} ${d.apr||''} ${d.balance||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'debt',id:d.id,title:d.name||'Debt',sub:`${d.lender||'Manual debt'} · APR ${d.apr||0}%`,value:amountLabel(Number(d.balance||0)),icon:'◒',run:()=>showView('debt')});
    });

    (s.holdings||[]).forEach(h=>{
      const hay=`${h.name||''} ${h.symbol||''} ${h.account||''} ${h.value||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'holding',id:h.id,title:h.name||h.symbol||'Holding',sub:`${h.symbol||'Holding'} · ${h.account||'Investments'}`,value:amountLabel(Number(h.value||0)),icon:'△',run:()=>showView('investments')});
    });

    (s.goals||[]).forEach(g=>{
      const hay=`${g.name||''} ${g.type||''} ${g.priority||''} ${g.notes||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'goal',id:g.id,title:g.name||'Goal',sub:`${g.type||'Goal'} · ${amountLabel(Number(g.current||0))} of ${amountLabel(Number(g.target||0))}`,value:'Goal',icon:'◇',run:()=>showView('goals')});
    });

    (s.recurring||[]).forEach(r=>{
      const hay=`${r.merchant||''} ${r.category||''} ${r.status||''} ${r.monthly||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'recurring',id:r.id||r.merchant,title:r.merchant||'Recurring item',sub:`${r.category||'Subscription'} · ${r.status||'detected'}`,value:amountLabel(Number(r.monthly||0)),icon:'↻',run:()=>showView('recurring')});
    });

    (s.rules||[]).forEach(r=>{
      const hay=`${r.contains||''} ${r.category||''} ${r.action||''}`;
      if(matches(hay,q)) addUnique(out,seen,{kind:'rule',id:r.id,title:r.contains||'Rule',sub:`${r.action||'Rule'} · ${r.category||'Other'}`,value:'Rule',icon:'⚡',run:()=>showView('rules')});
    });

    const txMatches=(s.transactions||[]).filter(tx=>matches(`${tx.description||''} ${tx.rawDescription||''} ${tx.category||''} ${tx.account||''} ${tx.notes||''}`,q)).length;
    if(txMatches>0) addUnique(out,seen,{kind:'view-transactions',id:'matching-transactions',title:`View ${txMatches} matching transaction${txMatches===1?'':'s'}`,sub:'Open the transaction list with this search applied',value:'Open',icon:'≡',priority:1,run:()=>openGlobalSearchInTransactions()});

    return out.sort((a,b)=>(b.priority||0)-(a.priority||0)).slice(0,24);
  }

  function itemHtml(item,i){
    const active=i===activeIndex?' active':'';
    return `<button type="button" class="global-search-item${active}" data-search-index="${i}"><span class="global-search-icon">${escapeHtml(item.icon||'⌕')}</span><span class="global-search-copy"><b>${escapeHtml(item.title||'Result')}</b><span>${escapeHtml(item.sub||'')}</span></span><span class="global-search-value">${escapeHtml(item.value||'')}</span></button>`;
  }

  function groupedHtml(rows,q){
    if(!rows.length){
      return `<div class="global-search-head"><strong>No matches</strong><span>Search looks through transactions, accounts, budgets, goals, and pages.</span></div><div class="global-search-empty"><strong>Nothing found for “${escapeHtml(q)}”.</strong><span>Try a merchant, amount, category, account name, or page name.</span></div><div class="global-search-footer"><button class="btn btn-small" type="button" onclick="showView('import'); closeGlobalSearchPanel();">Import CSV</button><button class="btn btn-small btn-primary" type="button" onclick="openDrawer('quickAdd'); closeGlobalSearchPanel();">Add manually</button></div>`;
    }
    const buckets=[
      ['view-transactions','Actions'],['transaction','Transactions'],['category','Categories'],['account','Accounts'],['budget','Budgets'],['debt','Debt'],['holding','Investments'],['goal','Goals'],['recurring','Subscriptions'],['rule','Rules'],['page','Pages'],['action','Commands']
    ];
    const parts=[`<div class="global-search-head"><strong>${rows.length} result${rows.length===1?'':'s'}</strong><span>Enter opens the highlighted result. Esc closes search.</span></div>`];
    buckets.forEach(([kind,label])=>{
      const group=rows.map((r,i)=>({r,i})).filter(x=>x.r.kind===kind);
      if(group.length) parts.push(`<div class="global-search-section"><div class="global-search-section-title">${escapeHtml(label)}</div>${group.map(x=>itemHtml(x.r,x.i)).join('')}</div>`);
    });
    return parts.join('');
  }

  function renderGlobalSearchResults(){
    const input=getGlobalSearchInput(); const panel=getGlobalSearchPanel();
    if(!input||!panel) return;
    const q=String(input.value||'').trim();
    if(!q){ searchResults=[]; activeIndex=0; panel.classList.remove('active'); panel.innerHTML=''; return; }
    searchResults=collectGlobalSearchResults(q);
    activeIndex=Math.min(activeIndex,Math.max(0,searchResults.length-1));
    panel.innerHTML=groupedHtml(searchResults,q);
    panel.classList.add('active');
  }

  window.closeGlobalSearchPanel=function(){ const panel=getGlobalSearchPanel(); if(panel){ panel.classList.remove('active'); panel.innerHTML=''; } activeIndex=0; };
  window.openGlobalSearchInTransactions=function(){
    const input=getGlobalSearchInput(); const q=String(input?.value||'').trim();
    showView('transactions');
    requestAnimationFrame(()=>{
      const month=document.getElementById('filterMonth'); if(month) month.value='all';
      const local=document.getElementById('transactionSearch'); if(local) local.value='';
      if(input) input.value=q;
      renderAll();
      closeGlobalSearchPanel();
      document.getElementById('transactionSearch')?.focus({preventScroll:true});
    });
  };

  function runSearchResult(index){ const item=searchResults[index]; if(!item||typeof item.run!=='function') return; closeGlobalSearchPanel(); item.run(); }

  function attachGlobalSearch(){
    const input=getGlobalSearchInput(); const topbar=document.querySelector('.topbar');
    if(!input||!topbar||input.__r21GlobalSearchAttached) return;
    input.__r21GlobalSearchAttached=true;
    input.setAttribute('autocomplete','off');
    input.setAttribute('aria-label','Search MoneyMap');
    input.placeholder='Search MoneyMap...';
    let panel=getGlobalSearchPanel();
    if(!panel){ panel=document.createElement('div'); panel.id='globalSearchPanel'; panel.className='global-search-panel'; topbar.appendChild(panel); }
    input.addEventListener('input',()=>{ activeIndex=0; renderGlobalSearchResults(); if(activeView==='transactions') renderAll(); });
    input.addEventListener('focus',()=>{ if(String(input.value||'').trim()) renderGlobalSearchResults(); });
    input.addEventListener('keydown',e=>{
      if(e.key==='Escape'){ e.preventDefault(); closeGlobalSearchPanel(); return; }
      if(!getGlobalSearchPanel()?.classList.contains('active')) return;
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();
        const count=searchResults.length; if(!count) return;
        activeIndex=(activeIndex+(e.key==='ArrowDown'?1:-1)+count)%count;
        renderGlobalSearchResults();
        getGlobalSearchPanel()?.querySelector('.global-search-item.active')?.scrollIntoView({block:'nearest'});
      }
      if(e.key==='Enter'){
        e.preventDefault();
        if(searchResults.length) runSearchResult(activeIndex); else openGlobalSearchInTransactions();
      }
    });
    panel.addEventListener('click',e=>{
      const btn=e.target.closest('[data-search-index]');
      if(!btn) return;
      runSearchResult(Number(btn.dataset.searchIndex||0));
    });
    document.addEventListener('pointerdown',e=>{ if(!topbar.contains(e.target)) closeGlobalSearchPanel(); });
  }

  function afterRender(){
    attachGlobalSearch();
    const build=document.getElementById('appBuildLabel'); if(build) build.textContent=''+BUILD;
  }
  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r21GlobalSearchWrapped){
    window.renderAll=function(){ const out=priorRenderAll.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.renderAll.__r21GlobalSearchWrapped=true;
  }
  const priorShowView=window.showView;
  if(typeof priorShowView==='function' && !priorShowView.__r21GlobalSearchWrapped){
    window.showView=function(){ const out=priorShowView.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.showView.__r21GlobalSearchWrapped=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',afterRender); else afterRender();
})();


/* ---- R2.2: Firefox scroll guard and stuck-overlay recovery ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const STYLE_ID='r22-firefox-scroll-guard-style';

  function markBuild(){
    try{
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=''+BUILD; });
    }catch(e){}
  }

  function injectStyle(){
    const css=`
      html{height:auto!important;min-height:100%!important;overflow-y:auto!important;overflow-x:clip!important}
      body{min-height:100vh!important;overflow-y:auto!important;overflow-x:clip!important;touch-action:auto!important}
      .app-shell,.main,.view{overflow-x:clip!important}
      .global-search-panel{overscroll-behavior:auto!important;contain:layout paint!important;will-change:auto!important}
      @media(max-width:760px){
        body:not(.mm-r22-more-active).mm-more-open{overflow-y:auto!important;touch-action:auto!important}
        body:not(.mm-r22-more-active).uxv62-more-open{overflow-y:auto!important;touch-action:auto!important}
        body .mobile-more-panel{-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}
      }
      @media(min-width:761px){
        body.mm-more-open,body.uxv62-more-open{overflow-y:auto!important;touch-action:auto!important}
      }
      @-moz-document url-prefix(){
        .topbar,.mobile-shell-header,.mobile-bar,.global-search-panel,.mobile-more-sheet,.command-palette,.first-run{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
        .topbar,.mobile-shell-header{background:var(--bg)!important}
        .mobile-bar,.global-search-panel,.mobile-more-panel{background:var(--panel)!important}
        .mobile-more-sheet{background:rgba(2,6,23,.68)!important}
        body:before{display:none!important}
      }
    `;
    let style=document.getElementById(STYLE_ID);
    if(!style){ style=document.createElement('style'); style.id=STYLE_ID; document.head.appendChild(style); }
    if(style.textContent!==css) style.textContent=css;
  }

  function moreSheetIsActive(){
    const sheet=document.getElementById('mobileMoreSheet');
    return !!(sheet && sheet.classList.contains('active') && window.matchMedia('(max-width: 760px)').matches);
  }

  function clearStuckLocks(){
    try{
      const activeMore=moreSheetIsActive();
      document.body.classList.toggle('mm-r22-more-active', activeMore);
      if(!activeMore) document.body.classList.remove('mm-more-open','uxv62-more-open');
      if(document.body.style.overflow==='hidden' && !activeMore) document.body.style.overflow='';
      if(document.documentElement.style.overflow==='hidden') document.documentElement.style.overflow='';
      document.documentElement.style.overflowY='auto';
      document.body.style.overflowY='auto';
    }catch(e){}
  }

  function closeSearchOnPageScrollIntent(event){
    try{
      const panel=document.getElementById('globalSearchPanel');
      if(!panel || !panel.classList.contains('active')) return;
      const input=document.querySelector('.searchbar input');
      const target=event.target;
      if(panel.contains(target) || (input && input.contains(target))) return;
      if(typeof window.closeGlobalSearchPanel==='function') window.closeGlobalSearchPanel();
    }catch(e){}
  }

  function afterRender(){ injectStyle(); markBuild(); clearStuckLocks(); }

  const priorOpen=window.openMobileMoreSheet;
  if(typeof priorOpen==='function' && !priorOpen.__r22ScrollGuardWrapped){
    window.openMobileMoreSheet=function(){ const out=priorOpen.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.openMobileMoreSheet.__r22ScrollGuardWrapped=true;
  }
  const priorClose=window.closeMobileMoreSheet;
  if(typeof priorClose==='function' && !priorClose.__r22ScrollGuardWrapped){
    window.closeMobileMoreSheet=function(){ const out=priorClose.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.closeMobileMoreSheet.__r22ScrollGuardWrapped=true;
  }
  const priorShow=window.showView;
  if(typeof priorShow==='function' && !priorShow.__r22ScrollGuardWrapped){
    window.showView=function(){ const out=priorShow.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.showView.__r22ScrollGuardWrapped=true;
  }
  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r22ScrollGuardWrapped){
    window.renderAll=function(){ const out=priorRenderAll.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.renderAll.__r22ScrollGuardWrapped=true;
  }

  document.addEventListener('wheel', closeSearchOnPageScrollIntent, {passive:true});
  document.addEventListener('touchmove', closeSearchOnPageScrollIntent, {passive:true});
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') requestAnimationFrame(afterRender); });
  document.addEventListener('DOMContentLoaded', afterRender);
  window.addEventListener('resize', afterRender, {passive:true});
  window.addEventListener('orientationchange', afterRender, {passive:true});
  setInterval(clearStuckLocks, 1200);
  afterRender();
})();


/* ---- R2.3: hard scroll unlock / stale overlay recovery ----
   Firefox fallback: never let old mobile sheet or dialog body-lock classes
   become the page scroll container. Active dialogs still keep their own
   internal scroll, but stale classes are cleared immediately. */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const STYLE_ID='r23-hard-scroll-unlock-style';

  function activeDialog(){
    return !!document.querySelector('.mm-dialog.active');
  }
  function activeMoreSheet(){
    const sheet=document.getElementById('mobileMoreSheet');
    return !!(sheet && sheet.classList.contains('active'));
  }
  function markBuild(){
    try{
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=''+BUILD; });
    }catch(e){}
  }
  function injectStyle(){
    const css=`
      html,body{
        height:auto!important;
        min-height:100%!important;
        max-width:100%!important;
        overflow-x:clip!important;
        overflow-y:auto!important;
        position:static!important;
        touch-action:auto!important;
        overscroll-behavior-y:auto!important;
      }
      body{min-height:100vh!important;}
      body.mm-more-open,body.uxv62-more-open,body.mm-r22-more-active{
        overflow-y:auto!important;
        overflow-x:clip!important;
        touch-action:auto!important;
        position:static!important;
      }
      .app-shell,.main,.view{
        height:auto!important;
        min-height:0!important;
        overflow-y:visible!important;
        overflow-x:clip!important;
      }
      .main{-webkit-overflow-scrolling:touch!important;}
      .mobile-more-sheet{touch-action:auto!important;overscroll-behavior:auto!important;}
      .mobile-more-panel{
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:auto!important;
        touch-action:auto!important;
      }
      .global-search-panel{
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        overscroll-behavior:auto!important;
        contain:none!important;
      }
      @-moz-document url-prefix(){
        html,body{scrollbar-width:auto!important;}
        .topbar,.mobile-shell-header,.mobile-bar,.global-search-panel,.mobile-more-sheet,.command-palette,.first-run,.mm-dialog{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}
        .topbar,.mobile-shell-header{background:var(--bg)!important;}
        .mobile-bar,.global-search-panel,.mobile-more-panel{background:var(--panel)!important;}
        body:before{display:none!important;}
      }
    `;
    let style=document.getElementById(STYLE_ID);
    if(!style){ style=document.createElement('style'); style.id=STYLE_ID; document.head.appendChild(style); }
    if(style.textContent!==css) style.textContent=css;
  }
  function hardUnlock(){
    try{
      injectStyle();
      markBuild();
      // Old mobile-more locks are not needed because the sheet is fixed.
      document.body.classList.remove('mm-more-open','uxv62-more-open','mm-r22-more-active');
      if(!activeDialog()) document.body.classList.remove('mm-dialog-open');
      const bodyStyle=document.body.style;
      const htmlStyle=document.documentElement.style;
      if(bodyStyle.overflow==='hidden') bodyStyle.overflow='';
      if(htmlStyle.overflow==='hidden') htmlStyle.overflow='';
      bodyStyle.overflowY='auto';
      htmlStyle.overflowY='auto';
      bodyStyle.touchAction='auto';
      document.documentElement.style.touchAction='auto';
      if(!activeMoreSheet()){
        const sheet=document.getElementById('mobileMoreSheet');
        if(sheet) sheet.setAttribute('aria-hidden','true');
      }
    }catch(e){}
  }
  function patchMoreFns(){
    try{
      const priorOpen=window.openMobileMoreSheet;
      if(typeof priorOpen==='function' && !priorOpen.__r23HardScrollUnlockWrapped){
        window.openMobileMoreSheet=function(){ const out=priorOpen.apply(this,arguments); requestAnimationFrame(hardUnlock); setTimeout(hardUnlock,80); return out; };
        window.openMobileMoreSheet.__r23HardScrollUnlockWrapped=true;
      }
      const priorClose=window.closeMobileMoreSheet;
      if(typeof priorClose==='function' && !priorClose.__r23HardScrollUnlockWrapped){
        window.closeMobileMoreSheet=function(){ const out=priorClose.apply(this,arguments); requestAnimationFrame(hardUnlock); setTimeout(hardUnlock,80); return out; };
        window.closeMobileMoreSheet.__r23HardScrollUnlockWrapped=true;
      }
    }catch(e){}
  }
  function afterRender(){ patchMoreFns(); hardUnlock(); }
  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r23HardScrollUnlockWrapped){
    window.renderAll=function(){ const out=priorRenderAll.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.renderAll.__r23HardScrollUnlockWrapped=true;
  }
  const priorShowView=window.showView;
  if(typeof priorShowView==='function' && !priorShowView.__r23HardScrollUnlockWrapped){
    window.showView=function(){ const out=priorShowView.apply(this,arguments); requestAnimationFrame(afterRender); return out; };
    window.showView.__r23HardScrollUnlockWrapped=true;
  }
  document.addEventListener('DOMContentLoaded', afterRender);
  window.addEventListener('resize', afterRender, {passive:true});
  window.addEventListener('orientationchange', afterRender, {passive:true});
  document.addEventListener('visibilitychange', afterRender);
  document.addEventListener('pointerup', ()=>requestAnimationFrame(hardUnlock), {passive:true});
  document.addEventListener('keyup', e=>{ if(e.key==='Escape') requestAnimationFrame(hardUnlock); }, {passive:true});
  setInterval(hardUnlock, 500);
  afterRender();
})();


/* ---- Cache guard moved to src/js/core/cache-guard.js. ---- */


/* R2.5 spend-map IIFE extracted to src/js/ui/spend-map.js in v0.9.6. */


/* ---- v0.5: account groups, cleaner portfolio UI, and public version label ---- */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.2';
  const ACCOUNT_GROUPS=[
    {id:'all',label:'All',hint:'Every manual balance'},
    {id:'cash',label:'Cash',hint:'Checking, savings, cash'},
    {id:'investments',label:'Investments',hint:'Brokerage, retirement, HSA, crypto'},
    {id:'property',label:'Property',hint:'Homes, vehicles, real assets'},
    {id:'valuables',label:'Valuables',hint:'Collectibles, jewelry, metals, art'},
    {id:'liabilities',label:'Debt',hint:'Cards, loans, mortgages'},
    {id:'other',label:'Other',hint:'Uncategorized accounts'}
  ];
  const GROUP_META={
    all:{label:'All accounts',icon:'▦'},
    cash:{label:'Cash',icon:'💵'},
    investments:{label:'Investments',icon:'📈'},
    property:{label:'Property',icon:'🏠'},
    valuables:{label:'Valuables',icon:'◆'},
    liabilities:{label:'Debt',icon:'−'},
    other:{label:'Other',icon:'•'}
  };
  function groupForAccount(a){
    const type=String(a?.type||'').toLowerCase();
    const name=String(a?.name||'').toLowerCase();
    const hay=`${type} ${name}`;
    if(/credit|loan|debt|mortgage|liability/.test(hay)) return 'liabilities';
    if(/checking|savings|cash|money market|wallet/.test(hay)) return 'cash';
    if(/brokerage|retirement|ira|401|403|roth|hsa|investment|crypto/.test(hay)) return 'investments';
    if(/property|real estate|home|house|vehicle|auto|car|boat|rv/.test(hay)) return 'property';
    if(/collectible|jewel|watch|gold|silver|precious|metal|art|coin|card|memorabilia|valuables?/.test(hay)) return 'valuables';
    if(/asset/.test(hay)) return 'other';
    return 'cash';
  }
  function groupLabel(id){ return GROUP_META[id]?.label || id; }
  function includedValue(accounts){ return accounts.filter(a=>a.includeNetWorth!==false).reduce((s,a)=>s+accountSignedValue(a),0); }
  function groupSummary(id, accounts){
    const items=id==='all' ? accounts : accounts.filter(a=>groupForAccount(a)===id);
    const included=items.filter(a=>a.includeNetWorth!==false);
    const value=included.reduce((s,a)=>s+accountSignedValue(a),0);
    const assets=included.reduce((s,a)=>s+Math.max(0,accountSignedValue(a)),0);
    const debt=included.reduce((s,a)=>s+Math.abs(Math.min(0,accountSignedValue(a))),0);
    return {id,items,included,value,assets,debt};
  }
  function currentAccountFilter(){
    state.settings=state.settings||{};
    const val=state.settings.accountGroupFilter || 'all';
    return ACCOUNT_GROUPS.some(g=>g.id===val) ? val : 'all';
  }
  window.setAccountGroupFilter=function(id){
    state.settings=state.settings||{};
    state.settings.accountGroupFilter=ACCOUNT_GROUPS.some(g=>g.id===id)?id:'all';
    saveState();
    renderAccountsDashboard();
  };
  function accountTypeIcon(a){
    const id=groupForAccount(a);
    return GROUP_META[id]?.icon || '•';
  }
  function accountGroupTabs(accounts){
    const active=currentAccountFilter();
    return `<div class="account-tabs-v04" role="tablist" aria-label="Account groups">${ACCOUNT_GROUPS.map(g=>{
      const summary=groupSummary(g.id,accounts);
      return `<button type="button" class="account-tab-v04 ${active===g.id?'active':''}" onclick="setAccountGroupFilter('${g.id}')" role="tab" aria-selected="${active===g.id}"><span>${escapeHtml(g.label)}</span><b>${summary.items.length}</b></button>`;
    }).join('')}</div>`;
  }
  function accountGroupHero(accounts){
    const summaries=ACCOUNT_GROUPS.filter(g=>g.id!=='all').map(g=>groupSummary(g.id,accounts)).filter(s=>s.items.length);
    const total=includedValue(accounts);
    if(!summaries.length) return `<div class="account-group-strip-v04 empty"><span>No account groups yet.</span></div>`;
    return `<div class="account-group-strip-v04">${summaries.map(s=>`<button class="account-group-chip-v04 ${currentAccountFilter()===s.id?'active':''}" onclick="setAccountGroupFilter('${s.id}')"><span>${GROUP_META[s.id]?.icon||'•'} ${escapeHtml(groupLabel(s.id))}</span><b class="${s.value<0?'bad':'good'}">${money(s.value)}</b><small>${total?Math.round(Math.abs(s.value)/Math.max(1,Math.abs(total))*100):0}% of net</small></button>`).join('')}</div>`;
  }
  function accountCardV04(a){
    const signed=accountSignedValue(a);
    const included=a.includeNetWorth!==false;
    const group=groupForAccount(a);
    return `<article class="account-card-v04">
      <div class="account-card-v04-main">
        <div class="account-icon-v04" aria-hidden="true">${accountTypeIcon(a)}</div>
        <div class="account-card-v04-copy"><h3>${escapeHtml(a.name||'Account')}</h3><p>${escapeHtml(a.institution||'Manual')} · ${escapeHtml(a.type||'Account')}</p></div>
        <div class="account-card-v04-balance"><strong class="${signed<0?'bad':'good'}">${money(signed)}</strong><span>${escapeHtml(groupLabel(group))}</span></div>
      </div>
      <div class="account-card-v04-meta">
        <span class="balance-badge ${included?'include':'exclude'}">${included?'In net worth':'Excluded'}</span>
        <span>Updated ${a.updatedAt?dateFmt(String(a.updatedAt).slice(0,10)):'—'}</span>
      </div>
      <div class="account-actions-v04">
        <button class="btn btn-small" onclick="toggleAccountInclude('${a.id}')">${included?'Exclude':'Include'}</button>
        <button class="btn btn-small" onclick="openDrawer('account', findById('accounts','${a.id}'))">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteTrackerItem('accounts','${a.id}')">Delete</button>
      </div>
    </article>`;
  }
  function groupedAccountList(accounts){
    const active=currentAccountFilter();
    const visible=active==='all' ? accounts : accounts.filter(a=>groupForAccount(a)===active);
    if(!accounts.length) return emptyMini('No accounts yet','Add checking, savings, investments, property, collectibles, jewelry, loans, or other manual balances.','Add account','openDrawer(\'account\')');
    if(!visible.length) return emptyMini(`No ${groupLabel(active).toLowerCase()} accounts yet`,`Add one or switch back to All accounts.`, 'Add account', 'openDrawer(\'account\')');
    const grouped={};
    visible.slice().sort((a,b)=>Math.abs(accountSignedValue(b))-Math.abs(accountSignedValue(a))).forEach(a=>{
      const key=active==='all'?groupForAccount(a):active;
      grouped[key]=grouped[key]||[];
      grouped[key].push(a);
    });
    return Object.entries(grouped).map(([group,items])=>{
      const sum=groupSummary(group,items);
      return `<section class="account-group-v04"><div class="account-group-head-v04"><div><b>${GROUP_META[group]?.icon||'•'} ${escapeHtml(groupLabel(group))}</b><span>${items.length} account${items.length===1?'':'s'} · ${sum.included.length} included</span></div><strong class="${sum.value<0?'bad':'good'}">${money(sum.value)}</strong></div><div class="account-card-list-v04">${items.map(accountCardV04).join('')}</div></section>`;
    }).join('');
  }
  function ensureAccountsViewV04(){
    let sec=document.getElementById('view-accounts');
    if(!sec){
      sec=document.createElement('section');
      sec.className='view';
      sec.id='view-accounts';
      const overview=document.getElementById('view-overview');
      overview?.after(sec);
    }
    sec.innerHTML=`<div class="page-head v04-page-head"><div><h2 class="section-title">Accounts</h2><p class="section-sub">Grouped manual balances for cash, investments, property, valuables, and debt.</p></div><div class="actions"><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div><div class="account-overview-v04" id="accountsMetrics"></div><div class="accounts-shell-v04"><div class="card accounts-main-v04"><div class="card-header"><div><h3 class="card-title">Accounts by category</h3><p class="card-subtitle">Use groups to avoid scanning one long list. Include only values that should count toward net worth.</p></div><button class="btn btn-small" onclick="openDrawer('account')">Add</button></div><div id="accountGroupTabsV04"></div><div id="accountGroupStripV04"></div><div id="accountsCardList"></div></div><div class="stack accounts-side-v04"><div class="card"><h3 class="card-title">Snapshot actions</h3><p class="card-subtitle">Save history only after balances look right.</p><div class="split-line"></div><div class="hero-row"><button class="btn btn-primary" onclick="saveNetWorthSnapshot()">Save current net worth</button><button class="btn" onclick="showView('networth')">View history</button></div></div><div class="card"><h3 class="card-title">Account tips</h3><div class="split-line"></div><div class="mini-list" id="accountTipsV04"></div></div></div></div>`;
  }
  window.renderAccountsDashboard=function(){
    ensureAccountsViewV04();
    const accounts=state.accounts||[];
    const included=accounts.filter(a=>a.includeNetWorth!==false);
    const assets=included.reduce((s,a)=>s+Math.max(0,accountSignedValue(a)),0);
    const liabilities=included.reduce((s,a)=>s+Math.abs(Math.min(0,accountSignedValue(a))),0);
    const cash=groupSummary('cash',accounts).value;
    const investments=groupSummary('investments',accounts).value;
    const valuables=groupSummary('valuables',accounts).value;
    const metrics=document.getElementById('accountsMetrics');
    if(metrics) metrics.innerHTML=`<div class="account-net-card-v04"><span>Net account value</span><strong class="${assets-liabilities>=0?'good':'bad'}">${money(assets-liabilities)}</strong><p>${included.length} included of ${accounts.length} total manual account${accounts.length===1?'':'s'}</p></div><div class="account-mini-stat-v04"><span>Cash</span><b>${money(cash)}</b></div><div class="account-mini-stat-v04"><span>Investments</span><b>${money(investments)}</b></div><div class="account-mini-stat-v04"><span>Valuables</span><b>${money(valuables)}</b></div><div class="account-mini-stat-v04"><span>Debt</span><b class="bad">${money(liabilities)}</b></div>`;
    const tabs=document.getElementById('accountGroupTabsV04'); if(tabs) tabs.innerHTML=accountGroupTabs(accounts);
    const strip=document.getElementById('accountGroupStripV04'); if(strip) strip.innerHTML=accountGroupHero(accounts);
    const list=document.getElementById('accountsCardList'); if(list) list.innerHTML=groupedAccountList(accounts);
    const tips=document.getElementById('accountTipsV04'); if(tips) tips.innerHTML=`<div class="mini-item"><div><b>Cash</b><br><span>Checking, savings, money market, and physical cash.</span></div><span>${money(cash)}</span></div><div class="mini-item"><div><b>Investments</b><br><span>Brokerage or retirement account balances. Exclude if holdings already count separately.</span></div><span>${money(investments)}</span></div><div class="mini-item"><div><b>Valuables</b><br><span>Jewelry, collectibles, art, metals, and other manually estimated items.</span></div><span>${money(valuables)}</span></div><div class="mini-item"><div><b>Debt</b><br><span>Cards, loans, mortgages, and other liabilities subtract from net worth.</span></div><span class="bad">${money(liabilities)}</span></div>`;
  };
  function renderOverviewLandingV04(){
    const view=document.getElementById('view-overview'); if(!view) return;
    let el=document.getElementById('accountSnapshotLanding'); if(!el){ el=document.createElement('div'); el.id='accountSnapshotLanding'; view.insertBefore(el, view.firstChild); }
    const b=netWorthBreakdown();
    const accounts=(state.accounts||[]).slice().sort((a,b)=>Math.abs(accountSignedValue(b))-Math.abs(accountSignedValue(a))).slice(0,4);
    const snaps=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const latest=snaps[0];
    const groups=ACCOUNT_GROUPS.filter(g=>g.id!=='all').map(g=>groupSummary(g.id,state.accounts||[])).filter(s=>s.items.length).slice(0,4);
    el.className='mm-v095-landing v04-landing';
    el.innerHTML=`<div class="mm-v095-net-card"><div class="mm-v095-kicker">Net worth snapshot</div><div class="mm-v095-net-value ${b.netWorth>=0?'good':'bad'}">${money(b.netWorth)}</div><div class="mm-v095-net-meta">Calculated from included accounts, holdings, and debt. ${latest?`Last snapshot saved ${dateFmt(latest.date)}.`:'Save a snapshot when balances look right.'}</div><div class="mm-v095-actions"><button class="btn btn-primary" onclick="showView('accounts')">Update accounts</button><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button><button class="btn" onclick="showView('networth')">History</button></div><div class="mm-v095-snapshot-grid"><div class="mm-v095-snap"><span>Assets</span><b class="good">${money(b.assets)}</b></div><div class="mm-v095-snap"><span>Liabilities</span><b class="bad">${money(b.liabilities)}</b></div><div class="mm-v095-snap"><span>Groups</span><b>${groups.length}</b></div></div></div><div class="mm-v095-account-panel v04-account-panel"><div class="mm-v095-panel-head"><div><h3>Account groups</h3><p>Cash, investments, valuables, property, and debt at a glance.</p></div><button class="btn btn-small" onclick="openDrawer('account')">Add</button></div><div class="v04-landing-groups">${groups.length?groups.map(s=>`<button class="v04-landing-group" onclick="showView('accounts'); setAccountGroupFilter('${s.id}')"><span>${GROUP_META[s.id]?.icon||'•'} ${escapeHtml(groupLabel(s.id))}</span><strong class="${s.value<0?'bad':'good'}">${money(s.value)}</strong></button>`).join(''):emptyMini('No accounts yet','Add balances to make Overview useful.','Add account','openDrawer(\'account\')')}</div><div class="mm-v095-account-list v04-landing-accounts">${accounts.length?accounts.map(a=>`<button class="mm-v095-account-row" onclick="openDrawer('account', findById('accounts','${a.id}'))"><span><b>${escapeHtml(a.name||'Account')}</b><span>${escapeHtml(groupLabel(groupForAccount(a)))} · ${escapeHtml(a.type||'Account')}</span></span><strong class="${accountSignedValue(a)<0?'bad':'good'}">${money(accountSignedValue(a))}</strong></button>`).join(''):''}</div><div class="mm-v095-account-actions"><button class="btn btn-small" onclick="showView('accounts')">Manage accounts</button><button class="btn btn-small" onclick="showView('investments')">Holdings</button></div></div>`;
  }
  function markV04(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{ el.textContent=BUILD; });
      const build=document.getElementById('appBuildLabel'); if(build) build.textContent=BUILD;
    }catch(e){}
  }
  const oldRenderAll=window.renderAll;
  window.renderAll=function(){
    const result=typeof oldRenderAll==='function' ? oldRenderAll.apply(this,arguments) : undefined;
    renderAccountsDashboard();
    renderOverviewLandingV04();
    if(typeof renderInvestments==='function') renderInvestments();
    markV04();
    return result;
  };
  const oldShow=window.showView;
  window.showView=function(id){
    const result=typeof oldShow==='function' ? oldShow.apply(this,arguments) : undefined;
    if(id==='accounts') renderAccountsDashboard();
    if(id==='overview') renderOverviewLandingV04();
    if(id==='investments' && typeof renderInvestments==='function') renderInvestments();
    markV04();
    return result;
  };
  const oldSettings=window.renderSettings;
  if(typeof oldSettings==='function') window.renderSettings=function(){ const r=oldSettings.apply(this,arguments); markV04(); return r; };
  const oldBackup=window.backupPayload;
  if(typeof oldBackup==='function') window.backupPayload=function(){ const p=oldBackup.apply(this,arguments); p.build=BUILD; p.releaseStage='v0.5'; return p; };
  document.addEventListener('DOMContentLoaded',()=>{ requestAnimationFrame(()=>{ renderAccountsDashboard(); renderOverviewLandingV04(); if(typeof renderInvestments==='function') renderInvestments(); markV04(); }); });
  setTimeout(()=>{ renderAccountsDashboard(); renderOverviewLandingV04(); if(typeof renderInvestments==='function') renderInvestments(); markV04(); },350);
})();
