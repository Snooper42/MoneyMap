/* MoneyMap v0.5 mobile-first UX shell refresh.
   Final override layer. Keeps stored data shape unchanged and avoids browser-native dialogs. */
(function(){
  const BUILD = 'v0.5';
  const PRIMARY_MOBILE = ['overview','transactions','review','accounts'];
  const MORE_MOBILE = ['import','budgets','networth','investments','recurring','debt','credit','goals','rules','settings'];
  const NAV_META = {
    overview:{title:'Home', mobile:'Home', sub:'Start here', icon:'⌂', primary:'Import CSV'},
    transactions:{title:'Transactions', mobile:'Txns', sub:'Search and clean', icon:'≡', primary:'Add transaction'},
    review:{title:'Review', mobile:'Review', sub:'Weekly cleanup', icon:'✓', primary:'Start review'},
    accounts:{title:'Accounts', mobile:'Accounts', sub:'Grouped balances', icon:'▦', primary:'Add account'},
    import:{title:'Import CSV', mobile:'Import', sub:'Load bank exports', icon:'⇡', primary:'Choose files'},
    budgets:{title:'Budgets', mobile:'Budgets', sub:'Monthly limits', icon:'◌', primary:'Add budget'},
    networth:{title:'Net worth', mobile:'Net worth', sub:'Snapshots and trend', icon:'◆', primary:'Save snapshot'},
    investments:{title:'Investments', mobile:'Invest', sub:'Manual holdings', icon:'△', primary:'Add holding'},
    recurring:{title:'Subscriptions', mobile:'Subs', sub:'Recurring charges', icon:'↻', primary:'Rescan'},
    debt:{title:'Debt', mobile:'Debt', sub:'Payoff plan', icon:'◒', primary:'Add debt'},
    credit:{title:'Credit', mobile:'Credit', sub:'Score logs', icon:'◧', primary:'Add log'},
    goals:{title:'Goals', mobile:'Goals', sub:'Savings targets', icon:'◇', primary:'Add goal'},
    rules:{title:'Rules', mobile:'Rules', sub:'Automation rules', icon:'⚡', primary:'Add rule'},
    settings:{title:'Settings', mobile:'Settings', sub:'Privacy and backups', icon:'⚙', primary:'Export backup'}
  };
  const ACCOUNT_GROUPS_V05 = [
    {id:'all', label:'All', hint:'Every manual balance', icon:'▦'},
    {id:'cash', label:'Cash', hint:'Checking, savings, money market, cash', icon:'$'},
    {id:'investments', label:'Investments', hint:'Brokerage, retirement, HSA, crypto', icon:'△'},
    {id:'property', label:'Property', hint:'Home, vehicle, real assets', icon:'⌂'},
    {id:'valuables', label:'Valuables', hint:'Collectibles, jewelry, metals, art', icon:'◆'},
    {id:'debt', label:'Debt', hint:'Cards, loans, mortgages', icon:'−'},
    {id:'other', label:'Other', hint:'Everything else', icon:'•'}
  ];

  function esc(value){ return typeof escapeHtml === 'function' ? escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmtMoney(value){ return typeof money === 'function' ? money(value) : `$${Math.round(Number(value||0)).toLocaleString()}`; }
  function fmtPct(value){ return typeof pctFmt === 'function' ? pctFmt(value) : `${Math.round(Number(value||0))}%`; }
  function num(value){ return typeof nval === 'function' ? nval(value) : Number(value || 0); }
  function save(){ if(typeof saveState === 'function') saveState(); }
  function todayMonth(){ return typeof currentMonth === 'function' ? currentMonth() : new Date().toISOString().slice(0,7); }
  function monthTxns(){ return typeof monthTransactions === 'function' ? monthTransactions(todayMonth()) : (state?.transactions || []); }
  function spendForMonth(){ return typeof spendingFor === 'function' ? spendingFor(monthTxns()) : 0; }
  function incomeForMonth(){ return typeof incomeFor === 'function' ? incomeFor(monthTxns()) : 0; }
  function budgetRows(){ return typeof budgetStats === 'function' ? budgetStats(todayMonth()) : []; }
  function dateLabel(value){ return typeof dateFmt === 'function' ? dateFmt(value) : String(value || '—'); }

  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD = BUILD;
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      document.querySelector('meta[name="moneymap-build"]')?.setAttribute('content', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
    }catch(e){}
  }

  function accountGroupFor(a){
    const type = String(a?.type || '').toLowerCase();
    const name = String(a?.name || '').toLowerCase();
    const inst = String(a?.institution || '').toLowerCase();
    const hay = `${type} ${name} ${inst}`;
    if(/credit|loan|debt|mortgage|liabil|student|auto loan|card balance/.test(hay)) return 'debt';
    if(/checking|savings|cash|money market|wallet|spend|deposit/.test(hay)) return 'cash';
    if(/brokerage|retirement|ira|401|403|roth|hsa|investment|crypto|stock|fund|portfolio|vanguard|fidelity|schwab|robinhood/.test(hay)) return 'investments';
    if(/property|real estate|home|house|condo|vehicle|auto|car|truck|boat|rv/.test(hay)) return 'property';
    if(/collectible|jewel|watch|gold|silver|precious|metal|art|coin|card|memorabilia|valuable/.test(hay)) return 'valuables';
    return 'other';
  }
  function groupMeta(id){ return ACCOUNT_GROUPS_V05.find(g => g.id === id) || ACCOUNT_GROUPS_V05[ACCOUNT_GROUPS_V05.length - 1]; }
  function signedAccountValue(a){ return typeof accountSignedValue === 'function' ? accountSignedValue(a) : num(a?.balance); }
  function accountSummary(id, accounts){
    const items = id === 'all' ? accounts : accounts.filter(a => accountGroupFor(a) === id);
    const included = items.filter(a => a.includeNetWorth !== false);
    const value = included.reduce((sum,a) => sum + signedAccountValue(a), 0);
    const assets = included.reduce((sum,a) => sum + Math.max(0, signedAccountValue(a)), 0);
    const debt = included.reduce((sum,a) => sum + Math.abs(Math.min(0, signedAccountValue(a))), 0);
    return {id, items, included, value, assets, debt};
  }
  function accountFilter(){
    const raw = state?.settings?.accountGroupFilter || 'all';
    const normalized = raw === 'liabilities' ? 'debt' : raw;
    return ACCOUNT_GROUPS_V05.some(g => g.id === normalized) ? normalized : 'all';
  }
  window.setAccountGroupFilter = function(id){
    state.settings = state.settings || {};
    state.settings.accountGroupFilter = ACCOUNT_GROUPS_V05.some(g => g.id === id) ? id : 'all';
    save();
    window.renderAccountsDashboard?.();
  };

  function ensureAccountsView(){
    let sec = document.getElementById('view-accounts');
    if(!sec){
      sec = document.createElement('section');
      sec.className = 'view';
      sec.id = 'view-accounts';
      document.getElementById('view-overview')?.after(sec);
    }
    if(sec.dataset.v05Ready === 'true') return sec;
    sec.dataset.v05Ready = 'true';
    sec.innerHTML = `<div class="page-head v05-page-head"><div><div class="eyebrow">Manual balances</div><h2 class="section-title">Accounts</h2><p class="section-sub">Review cash, investments, property, valuables, debt, and other balances without scanning a table.</p></div><div class="actions"><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div>
      <div class="v05-account-summary" id="accountsMetrics"></div>
      <div class="v05-two-col"><div class="card v05-card"><div class="card-header"><div><h3 class="card-title">Grouped account list</h3><p class="card-subtitle">Filter by group, then edit or include only the balances that belong in net worth.</p></div></div><div id="accountGroupTabsV05"></div><div id="accountGroupStripV05"></div><div id="accountsCardList"></div></div><div class="stack"><div class="card v05-card"><h3 class="card-title">Primary action</h3><p class="card-subtitle">Add or update account balances first, then save a net-worth snapshot.</p><div class="split-line"></div><div class="hero-row"><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button><button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button></div></div><div class="card v05-card"><h3 class="card-title">Group guide</h3><div class="split-line"></div><div class="mini-list" id="accountTipsV05"></div></div></div></div>`;
    return sec;
  }
  function accountTabs(accounts){
    const active = accountFilter();
    return `<div class="v05-tab-row" role="tablist" aria-label="Account groups">${ACCOUNT_GROUPS_V05.map(g => {
      const summary = accountSummary(g.id, accounts);
      return `<button type="button" class="v05-tab ${active===g.id?'active':''}" onclick="setAccountGroupFilter('${g.id}')" role="tab" aria-selected="${active===g.id}"><span>${esc(g.label)}</span><b>${summary.items.length}</b></button>`;
    }).join('')}</div>`;
  }
  function accountStrip(accounts){
    const summaries = ACCOUNT_GROUPS_V05.filter(g => g.id !== 'all').map(g => ({...g, ...accountSummary(g.id, accounts)}));
    return `<div class="v05-group-strip">${summaries.map(s => `<button type="button" class="v05-group-chip ${accountFilter()===s.id?'active':''}" onclick="setAccountGroupFilter('${s.id}')"><span>${esc(s.icon)} ${esc(s.label)}</span><b class="${s.value<0?'bad':'good'}">${fmtMoney(s.value)}</b><small>${s.items.length} item${s.items.length===1?'':'s'}</small></button>`).join('')}</div>`;
  }
  function accountCard(a){
    const value = signedAccountValue(a);
    const group = groupMeta(accountGroupFor(a));
    const included = a.includeNetWorth !== false;
    return `<article class="v05-account-card"><div class="v05-account-main"><div class="v05-account-icon" aria-hidden="true">${esc(group.icon)}</div><div class="v05-account-copy"><h3>${esc(a.name || 'Account')}</h3><p>${esc(a.institution || 'Manual')} · ${esc(a.type || group.label)}</p></div><div class="v05-account-balance"><strong class="${value<0?'bad':'good'}">${fmtMoney(value)}</strong><span>${esc(group.label)}</span></div></div><div class="v05-card-meta"><span class="balance-badge ${included?'include':'exclude'}">${included?'In net worth':'Excluded'}</span><span>Updated ${a.updatedAt ? dateLabel(String(a.updatedAt).slice(0,10)) : '—'}</span></div><div class="v05-card-actions"><button class="btn btn-small" onclick="toggleAccountInclude('${a.id}')">${included?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('account', findById('accounts','${a.id}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('accounts','${a.id}')">Delete</button></div></article>`;
  }
  function accountList(accounts){
    const active = accountFilter();
    const visible = active === 'all' ? accounts : accounts.filter(a => accountGroupFor(a) === active);
    if(!accounts.length) return typeof emptyMini === 'function' ? emptyMini('No accounts yet','Add checking, savings, investments, property, valuables, loans, or other balances.','Add account','openDrawer(\'account\')') : '';
    if(!visible.length) return typeof emptyMini === 'function' ? emptyMini(`No ${groupMeta(active).label.toLowerCase()} accounts yet`,`Add one or switch back to All.`, 'Add account', 'openDrawer(\'account\')') : '';
    const groups = {};
    visible.slice().sort((a,b) => Math.abs(signedAccountValue(b)) - Math.abs(signedAccountValue(a))).forEach(a => {
      const key = active === 'all' ? accountGroupFor(a) : active;
      groups[key] = groups[key] || [];
      groups[key].push(a);
    });
    return Object.entries(groups).map(([id,items]) => {
      const meta = groupMeta(id);
      const summary = accountSummary(id, items);
      return `<section class="v05-account-group"><div class="v05-account-group-head"><div><b>${esc(meta.icon)} ${esc(meta.label)}</b><span>${items.length} account${items.length===1?'':'s'} · ${summary.included.length} included</span></div><strong class="${summary.value<0?'bad':'good'}">${fmtMoney(summary.value)}</strong></div><div class="v05-account-card-list">${items.map(accountCard).join('')}</div></section>`;
    }).join('');
  }
  window.renderAccountsDashboard = function(){
    ensureAccountsView();
    const accounts = state?.accounts || [];
    const included = accounts.filter(a => a.includeNetWorth !== false);
    const assets = included.reduce((sum,a) => sum + Math.max(0, signedAccountValue(a)), 0);
    const liabilities = included.reduce((sum,a) => sum + Math.abs(Math.min(0, signedAccountValue(a))), 0);
    const by = id => accountSummary(id, accounts).value;
    const metrics = document.getElementById('accountsMetrics');
    if(metrics) metrics.innerHTML = `<div class="v05-net-card"><span>Included net value</span><strong class="${assets-liabilities>=0?'good':'bad'}">${fmtMoney(assets-liabilities)}</strong><p>${included.length} included of ${accounts.length} manual account${accounts.length===1?'':'s'}</p></div><div class="v05-mini-stat"><span>Cash</span><b>${fmtMoney(by('cash'))}</b></div><div class="v05-mini-stat"><span>Investments</span><b>${fmtMoney(by('investments'))}</b></div><div class="v05-mini-stat"><span>Property</span><b>${fmtMoney(by('property'))}</b></div><div class="v05-mini-stat"><span>Valuables</span><b>${fmtMoney(by('valuables'))}</b></div><div class="v05-mini-stat"><span>Debt</span><b class="bad">${fmtMoney(liabilities)}</b></div>`;
    const tabs = document.getElementById('accountGroupTabsV05'); if(tabs) tabs.innerHTML = accountTabs(accounts);
    const strip = document.getElementById('accountGroupStripV05'); if(strip) strip.innerHTML = accountStrip(accounts);
    const list = document.getElementById('accountsCardList'); if(list) list.innerHTML = accountList(accounts);
    const tips = document.getElementById('accountTipsV05');
    if(tips) tips.innerHTML = ACCOUNT_GROUPS_V05.filter(g => g.id !== 'all').map(g => `<div class="mini-item"><div><b>${esc(g.icon)} ${esc(g.label)}</b><br><span>${esc(g.hint)}</span></div><span>${fmtMoney(accountSummary(g.id, accounts).value)}</span></div>`).join('');
  };

  function dashboardStatus(){
    const txns = state?.transactions || [];
    const unreviewed = txns.filter(t => !t.reviewed).length;
    const budgets = state?.budgets || [];
    const accounts = state?.accounts || [];
    const over = budgetRows().filter(b => Number(b.pct) >= 100).length;
    if(!txns.length && !accounts.length) return {tone:'start', title:'Set up your map', copy:'Start with a CSV import or add a few manual accounts.', primary:'Import CSV', action:"showView('import')"};
    if(unreviewed) return {tone:'review', title:'Review is next', copy:`${unreviewed} transaction${unreviewed===1?'':'s'} need cleanup before reports are trustworthy.`, primary:'Review now', action:'startWeeklyReview()'};
    if(!budgets.length && txns.length) return {tone:'budget', title:'Create your first budget', copy:'Spending is imported. Add simple monthly limits to see what is safe to spend.', primary:'Add budget', action:"openDrawer('budget')"};
    if(over) return {tone:'warn', title:'Budget pressure', copy:`${over} budget${over===1?'':'s'} are at or above the limit.`, primary:'Fix budgets', action:"showView('budgets')"};
    if(!accounts.length) return {tone:'accounts', title:'Add account balances', copy:'Transactions are clean. Add balances to make net worth visible.', primary:'Add account', action:"openDrawer('account')"};
    return {tone:'good', title:'Workspace is current', copy:'Review, budgets, and balances are ready for a quick check.', primary:'Open report', action:'exportMonthlyReport()'};
  }
  function nextSteps(){
    const txns = state?.transactions || [];
    const accounts = state?.accounts || [];
    const holdings = state?.holdings || [];
    const unreviewed = txns.filter(t => !t.reviewed).length;
    const steps = [];
    if(!txns.length) steps.push({icon:'1', title:'Import transactions', sub:'Start with a bank or card CSV.', action:"showView('import')", cta:'Import'});
    if(txns.length && unreviewed) steps.push({icon:'1', title:'Clean the review queue', sub:`Approve or categorize ${unreviewed} item${unreviewed===1?'':'s'}.`, action:'startWeeklyReview()', cta:'Review'});
    if(!(state?.budgets || []).length) steps.push({icon:'2', title:'Add simple budgets', sub:'Set a few limits for the categories that matter.', action:"openDrawer('budget')", cta:'Budget'});
    if(!accounts.length) steps.push({icon:'3', title:'Add account balances', sub:'Group cash, investments, property, valuables, debt, and other.', action:"openDrawer('account')", cta:'Add'});
    if(accounts.length && !(state?.netWorthHistory || []).length) steps.push({icon:'3', title:'Save a net-worth snapshot', sub:'Lock in today’s balances for the trend chart.', action:'saveNetWorthSnapshot()', cta:'Save'});
    if(accounts.some(a => accountGroupFor(a)==='investments') && !holdings.length) steps.push({icon:'4', title:'Optional: add holdings', sub:'Use holdings only when position-level detail helps.', action:"showView('investments')", cta:'Holdings'});
    if(!steps.length) steps.push({icon:'✓', title:'Keep the weekly loop', sub:'Import, review, budget, and back up once a week.', action:'exportBackup()', cta:'Backup'});
    return steps.slice(0,3);
  }
  function renderDashboardGuide(){
    const view = document.getElementById('view-overview'); if(!view) return;
    let guide = document.getElementById('v05DashboardGuide');
    if(!guide){
      guide = document.createElement('section');
      guide.id = 'v05DashboardGuide';
      guide.className = 'v05-dashboard-guide';
      view.insertBefore(guide, view.firstChild);
    }
    const status = dashboardStatus();
    const spend = spendForMonth();
    const income = incomeForMonth();
    const net = income - spend;
    const unreviewed = (state?.transactions || []).filter(t => !t.reviewed).length;
    const budgets = budgetRows();
    const over = budgets.filter(b => Number(b.pct) >= 100).length;
    const pressure = budgets.length ? (over ? `${over} over limit` : `${budgets.length} tracked`) : 'No budgets yet';
    const steps = nextSteps();
    guide.innerHTML = `<div class="v05-home-card"><div class="v05-home-copy"><div class="eyebrow">Home</div><h2>${esc(status.title)}</h2><p>${esc(status.copy)}</p><div class="v05-home-actions"><button class="btn btn-primary" onclick="${status.action}">${esc(status.primary)}</button><button class="btn" onclick="openDrawer('quickAdd')">Quick add</button><button class="btn" onclick="exportBackup()">Backup</button></div></div><div class="v05-home-status ${esc(status.tone)}"><span>How you are doing</span><strong class="${net>=0?'good':'bad'}">${fmtMoney(net)}</strong><small>Net cash flow this month</small></div></div><div class="v05-home-metrics"><button type="button" onclick="showView('transactions')"><span>Spending</span><b class="bad">${fmtMoney(spend)}</b><small>This month</small></button><button type="button" onclick="startWeeklyReview()"><span>Review queue</span><b>${unreviewed}</b><small>${unreviewed ? 'Needs cleanup' : 'Clean'}</small></button><button type="button" onclick="showView('budgets')"><span>Budget pressure</span><b>${esc(pressure)}</b><small>${budgets.length ? 'Monthly limits' : 'Add limits'}</small></button></div><div class="v05-next-steps"><div class="v05-next-head"><b>Do next</b><span>One clear path through the app.</span></div>${steps.map(s => `<button type="button" onclick="${s.action}"><i>${esc(s.icon)}</i><span><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></span><strong>${esc(s.cta)}</strong></button>`).join('')}</div>`;
  }

  function ensureMobileMoreSheet(){
    let sheet = document.getElementById('mobileMoreSheet');
    if(!sheet){
      sheet = document.createElement('div');
      sheet.id = 'mobileMoreSheet';
      sheet.className = 'mobile-more-sheet';
      document.body.appendChild(sheet);
    }
    if(sheet.dataset.v05Ready !== 'true'){
      sheet.dataset.v05Ready = 'true';
      sheet.addEventListener('click', event => { if(event.target === sheet) closeMobileMoreSheet(); });
    }
    sheet.innerHTML = `<div class="mobile-more-panel v05-more-panel" role="dialog" aria-modal="true" aria-label="More MoneyMap sections"><div class="mobile-more-head"><div><b>More</b><span>Secondary pages and setup tools.</span></div><button type="button" class="btn btn-small" onclick="closeMobileMoreSheet()">Close</button></div><div class="v05-more-quick"><button class="btn btn-primary" onclick="closeMobileMoreSheet(); showView('import')">Import CSV</button><button class="btn" onclick="closeMobileMoreSheet(); openDrawer('quickAdd')">Quick add</button></div><div class="mobile-more-grid" id="mobileMoreGrid"></div></div>`;
    renderMoreGrid();
    return sheet;
  }
  function renderMoreGrid(){
    const grid = document.getElementById('mobileMoreGrid'); if(!grid) return;
    grid.innerHTML = MORE_MOBILE.map(id => {
      const n = NAV_META[id];
      return `<button type="button" class="mobile-more-item ${activeView===id?'active':''}" onclick="closeMobileMoreSheet(); showView('${id}')" aria-current="${activeView===id?'page':'false'}"><span class="mobile-more-icon">${esc(n.icon)}</span><span class="mobile-more-copy"><strong>${esc(n.title)}</strong><span>${esc(n.sub)}</span></span></button>`;
    }).join('');
  }
  window.openMobileMoreSheet = function(){ const sheet = ensureMobileMoreSheet(); sheet.classList.add('active'); document.body.classList.add('v05-more-open'); renderMoreGrid(); };
  window.closeMobileMoreSheet = function(){ document.getElementById('mobileMoreSheet')?.classList.remove('active'); document.body.classList.remove('v05-more-open'); };
  window.toggleMobileMore = function(open){ open ? openMobileMoreSheet() : closeMobileMoreSheet(); };

  window.buildMobileNav = function(){
    const nav = document.getElementById('mobileNav'); if(!nav) return;
    const moreActive = !PRIMARY_MOBILE.includes(activeView);
    nav.innerHTML = PRIMARY_MOBILE.map(id => {
      const n = NAV_META[id];
      return `<button type="button" class="${activeView===id?'active':''}" onclick="showView('${id}')" aria-label="Open ${esc(n.title)}" aria-current="${activeView===id?'page':'false'}"><span>${esc(n.icon)}</span><span>${esc(n.mobile || n.title)}</span></button>`;
    }).join('') + `<button type="button" class="${moreActive?'active':''}" onclick="openMobileMoreSheet()" aria-label="Open more sections" aria-current="${moreActive?'page':'false'}"><span>☰</span><span>More</span></button>`;
    ensureMobileMoreSheet();
  };
  try{ buildMobileNav = window.buildMobileNav; }catch(e){}

  window.buildNav = function(){
    const side = document.getElementById('sideNav'); if(!side) return;
    const navButton = id => {
      const n = NAV_META[id];
      return `<button class="nav-btn ${id===activeView?'active':''}" data-view="${id}" onclick="showView('${id}')" aria-current="${id===activeView?'page':'false'}"><span class="nav-icon">${esc(n.icon)}</span><span class="nav-copy"><strong>${esc(n.title)}</strong><span>${esc(n.sub)}</span></span></button>`;
    };
    side.innerHTML = `<div class="nav-group v05-nav-primary">${PRIMARY_MOBILE.map(navButton).join('')}</div><div class="nav-kicker nav-more-kicker"><span>More</span></div><div class="nav-group nav-secondary v05-nav-secondary">${MORE_MOBILE.map(navButton).join('')}</div>`;
  };
  try{ buildNav = window.buildNav; }catch(e){}

  function pageTitlePatch(){
    const patches = {
      'view-overview':['Home','Your private command center for import, review, budgets, accounts, and next steps.'],
      'view-import':['Import CSV','Drop a bank or card export, map columns once, then review before accepting.'],
      'view-review':['Weekly review','Clean the queue so charts, budgets, and reports stay trustworthy.'],
      'view-transactions':['Transactions','Find, edit, hide transfers, and export cleaned transaction history.'],
      'view-budgets':['Budgets','Set simple limits and watch budget pressure before the month gets noisy.'],
      'view-recurring':['Subscriptions','Review recurring charges and flag items to keep, review, or cancel.'],
      'view-networth':['Net worth','Save manual balance snapshots after accounts look correct.'],
      'view-investments':['Investments','Track manual holdings only when position-level detail is useful.'],
      'view-settings':['Settings','Appearance, local storage, backups, version, and navigation controls.']
    };
    Object.entries(patches).forEach(([id,[title,sub]]) => {
      const root = document.getElementById(id); if(!root) return;
      const h = root.querySelector('.page-head .section-title'); if(h) h.textContent = title;
      const p = root.querySelector('.page-head .section-sub'); if(p) p.textContent = sub;
    });
  }

  function renderInvestmentGuide(){
    const view = document.getElementById('view-investments'); if(!view) return;
    let guide = document.getElementById('v05InvestmentGuide');
    const metrics = document.getElementById('investmentMetrics');
    if(!guide){
      guide = document.createElement('div');
      guide.id = 'v05InvestmentGuide';
      guide.className = 'v05-investment-guide';
      metrics?.parentNode?.insertBefore(guide, metrics);
    }
    const holdings = state?.holdings || [];
    const value = holdings.reduce((sum,h) => sum + (typeof holdingValue === 'function' ? holdingValue(h) : num(h.quantity) * num(h.price)), 0);
    const included = holdings.filter(h => h.includeNetWorth !== false).reduce((sum,h) => sum + (typeof holdingValue === 'function' ? holdingValue(h) : num(h.quantity) * num(h.price)), 0);
    guide.innerHTML = `<div><div class="eyebrow">Portfolio workspace</div><h3>Manual holdings, cleaner cards.</h3><p>Use this page for position-level detail. If an investment account already counts in Accounts, exclude duplicate holdings from net worth.</p></div><div class="v05-invest-actions"><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button><button class="btn" onclick="showView('accounts')">Review accounts</button></div><div class="v05-invest-mini"><span>Total value</span><b>${fmtMoney(value)}</b><small>${fmtMoney(included)} included in net worth</small></div>`;
    const notes = document.getElementById('investmentNotes');
    if(notes) notes.innerHTML = `<div class="mini-item"><div><b>Net-worth guard</b><br><span>Exclude holdings when the same portfolio is already tracked as an account balance.</span></div><span>Safe</span></div><div class="mini-item"><div><b>Manual prices</b><br><span>MoneyMap does not sync markets or upload portfolio data.</span></div><span>Local</span></div><div class="mini-item"><div><b>Mobile cards</b><br><span>Holdings are shown as cards first. Tables stay hidden on small screens.</span></div><span>${BUILD}</span></div>`;
  }

  function renderSettingsVersionCard(){
    const settings = document.getElementById('view-settings'); if(!settings) return;
    let badge = document.getElementById('v05SettingsVersion');
    const firstCard = settings.querySelector('.card');
    if(!badge && firstCard){
      badge = document.createElement('div');
      badge.id = 'v05SettingsVersion';
      badge.className = 'v05-version-card';
      firstCard.parentNode.insertBefore(badge, firstCard);
    }
    if(badge) badge.innerHTML = `<div><span>Release</span><strong>${BUILD}</strong><small>Mobile UX refresh · cache ${BUILD}</small></div><button class="btn btn-small" onclick="exportBackup()">Backup now</button>`;
    markBuild();
  }

  function runV05Pass(){
    document.body?.classList.add('ux-v05');
    ensureAccountsView();
    renderDashboardGuide();
    window.renderAccountsDashboard?.();
    renderInvestmentGuide();
    renderSettingsVersionCard();
    pageTitlePatch();
    window.buildNav?.();
    window.buildMobileNav?.();
    markBuild();
  }

  const oldRenderAll = window.renderAll;
  window.renderAll = function(){
    const result = typeof oldRenderAll === 'function' ? oldRenderAll.apply(this, arguments) : undefined;
    runV05Pass();
    return result;
  };
  try{ renderAll = window.renderAll; }catch(e){}

  const oldShowView = window.showView;
  window.showView = function(id){
    const result = typeof oldShowView === 'function' ? oldShowView.apply(this, arguments) : undefined;
    if(id !== 'more') window.closeMobileMoreSheet?.();
    runV05Pass();
    const target = document.getElementById('view-' + id);
    if(target && window.matchMedia && window.matchMedia('(max-width: 760px)').matches){ window.scrollTo(0,0); }
    return result;
  };
  try{ showView = window.showView; }catch(e){}

  const oldRenderInvestments = window.renderInvestments;
  if(typeof oldRenderInvestments === 'function'){
    window.renderInvestments = function(){
      const result = oldRenderInvestments.apply(this, arguments);
      renderInvestmentGuide();
      markBuild();
      return result;
    };
    try{ renderInvestments = window.renderInvestments; }catch(e){}
  }

  const oldRenderSettings = window.renderSettings;
  if(typeof oldRenderSettings === 'function'){
    window.renderSettings = function(){
      const result = oldRenderSettings.apply(this, arguments);
      renderSettingsVersionCard();
      markBuild();
      return result;
    };
    try{ renderSettings = window.renderSettings; }catch(e){}
  }

  const oldBackupPayload = window.backupPayload;
  if(typeof oldBackupPayload === 'function'){
    window.backupPayload = function(){
      const payload = oldBackupPayload.apply(this, arguments);
      payload.build = BUILD;
      payload.releaseStage = BUILD;
      return payload;
    };
    try{ backupPayload = window.backupPayload; }catch(e){}
  }

  document.addEventListener('keydown', event => { if(event.key === 'Escape') closeMobileMoreSheet(); });
  document.addEventListener('DOMContentLoaded', () => { requestAnimationFrame(runV05Pass); });
  setTimeout(runV05Pass, 250);
})();
