/* MoneyMap navigation module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function setStep(id){ ['stepFile','stepMap','stepClean','stepDone'].forEach(s=>document.getElementById(s).classList.toggle('active',s===id)); }

function buildNav(){
  const side = document.getElementById('sideNav');
  side.innerHTML = NAV.map(([id,title,sub,icon])=>`<button class="nav-btn ${id===activeView?'active':''}" data-view="${id}" onclick="showView('${id}')"><span class="nav-icon">${icon}</span><span class="nav-copy"><strong>${title}</strong><span>${sub}</span></span></button>`).join('');
}

function buildMobileNav(){
  const ids = ['overview','review','networth','settings'];
  const buttons = NAV.filter(n=>ids.includes(n[0])).map(([id,title,,icon])=>`<button class="${id===activeView?'active':''}" onclick="showView('${id}')"><span>${icon}</span><span>${title}</span></button>`);
  /* Add quick-add button after Overview — more useful than Import for mobile-first newcomers.
     Keyboard users still have 'N' for quick-add and '⌘K' for import. */
  const addBtn=`<button class="mobile-add-btn" onclick="openQuickAddMenu()" aria-label="Add transaction or balance"><span>＋</span><span>Add</span></button>`;
  buttons.splice(1, 0, addBtn);
  document.getElementById('mobileNav').innerHTML = buttons.join('');
}

function showView(id){ activeView=id; document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+id)); buildNav(); buildMobileNav(); if(id==='review') renderReview(); if(id==='recurring') detectRecurring(false); renderAll(); }

function ensureStarterContent(){
  if(!state.budgets.length){ state.budgets = [
    {id:uid('bud'), category:'Groceries', limit:500}, {id:uid('bud'), category:'Dining', limit:300}, {id:uid('bud'), category:'Shopping', limit:250}, {id:uid('bud'), category:'Subscriptions', limit:120}, {id:uid('bud'), category:'Entertainment', limit:150}
  ]; saveState(); }
  const starters = [
    {contains:'PUBLIX', category:'Groceries', action:'categorize', direction:'spend'},
    {contains:'WHOLE FOODS', category:'Groceries', action:'categorize', direction:'spend'},
    {contains:'UBER EATS', category:'Dining', action:'categorize', direction:'spend'},
    {contains:'NETFLIX', category:'Subscriptions', action:'categorize', direction:'spend'},
    {contains:'TRANSFER', category:'Transfers', action:'transfer', direction:'any'},
    {contains:'CREDIT CARD PAYMENT', category:'Transfers', action:'transfer', direction:'any'},
    {contains:'PAYMENT THANK YOU', category:'Transfers', action:'transfer', direction:'any'}
  ];
  if(!state.rules.length){ state.rules = starters.map(r=>({id:uid('rule'), ...r, hide:r.action!=='categorize', system:true, createdAt:new Date().toISOString()})); saveState(); }
  else {
    let added=false;
    starters.filter(r=>r.action==='transfer').forEach(r=>{
      if(!state.rules.some(x=>String(x.contains||'').toUpperCase()===r.contains)){ state.rules.push({id:uid('rule'), ...r, hide:true, system:true, createdAt:new Date().toISOString()}); added=true; }
    });
    if(added) saveState();
  }
}

function workspaceHasUserData(){ return Boolean((state.transactions||[]).length || (state.imports||[]).length || (state.goals||[]).length || (state.creditHistory||[]).length || (state.accounts||[]).length || (state.netWorthHistory||[]).length || (state.debts||[]).length || (state.holdings||[]).length); }

function shouldShowFirstRun(){
  /* Show for brand-new users who have never completed onboarding.
     Do NOT show on every build bump — that's annoying for existing users.
     Existing users see it again only if they've never set firstRunComplete=true. */
  if(!state.settings.firstRunComplete) return true;
  return false;
}

function openFirstRun(force=false){
  const el=document.getElementById('firstRun');
  if(!el || (!force && !shouldShowFirstRun())) return;
  const foot=document.getElementById('firstRunFootnote');
  if(foot) foot.textContent = workspaceHasUserData() ? 'Existing local workspace detected. Continue keeps your current data.' : 'Private by default. No bank login or backend required.';
  el.classList.add('active');
  el.setAttribute('aria-hidden','false');
}

function openFirstRunIfNeeded(){ openFirstRun(false); }

function closeFirstRun(){ const el=document.getElementById('firstRun'); if(el){ el.classList.remove('active'); el.setAttribute('aria-hidden','true'); } }

function completeFirstRun(){ state.settings.firstRunComplete=true; state.settings.startupSeenBuild=APP_BUILD_ID; saveState(); closeFirstRun(); }

function resetWorkspaceForFreshStart(){
  const keepAppearance = clone(state.appearance || defaultState.appearance);
  const keepSettings = {...defaultState.settings, ...(state.settings || {}), firstRunComplete:true, startupSeenBuild:APP_BUILD_ID};
  state = clone(defaultState);
  state.appearance = keepAppearance;
  state.settings = keepSettings;
  ensureStarterContent();
}

async function chooseFirstRun(mode){
  if(mode==='continue'){ completeFirstRun(); toast('Workspace continued.'); renderAll(); return; }
  if(mode==='demo' && workspaceHasUserData() && !(await mmConfirm('Replace your current workspace with demo data?', {title:'Load demo workspace?', confirmText:'Replace', danger:true}))) return;
  if(mode==='fresh' && workspaceHasUserData() && !(await mmConfirm('Clear existing data and start fresh?', {title:'Start fresh?', confirmText:'Clear workspace', danger:true}))) return;
  if(mode==='demo'){ completeFirstRun(); loadDemoData(); return; }
  if(mode==='import'){ completeFirstRun(); showView('import'); toast('Import center opened. Drop your CSV to begin.'); return; }
  /* fresh — onboarding.js opens the account drawer after render */
  resetWorkspaceForFreshStart();
  saveState();
  closeFirstRun();
  showView('overview');
  toast('Workspace ready. Let\'s add your first account.');
}

function commandActions(){
  return [
    {icon:'⌂',title:'Overview',sub:'Dashboard command center',key:'G O',fn:()=>showView('overview')},
    {icon:'⇡',title:'Import CSV',sub:'Load bank exports',key:'I',fn:()=>showView('import')},
    {icon:'＋',title:'Quick add',sub:'Transaction, budget, goal, account',key:'N',fn:()=>openDrawer('quickAdd')},
    {icon:'✓',title:'Weekly review',sub:'Clean transactions',key:'R',fn:()=>startWeeklyReview()},
    {icon:'◌',title:'Budgets',sub:'Manage category limits',key:'B',fn:()=>showView('budgets')},
    {icon:'↗',title:'Net worth',sub:'Accounts and snapshots',key:'W',fn:()=>showView('networth')},
    {icon:'◆',title:'Goals',sub:'Savings and payoff targets',key:'G',fn:()=>showView('goals')},
    {icon:'●',title:'Customize',sub:'Color wheel, layout, density',key:'C',fn:()=>openDrawer('customize')},
    {icon:'↧',title:'Export backup JSON',sub:'Portable full backup',key:'',fn:()=>exportBackupJson()},
    {icon:'▤',title:'Export monthly report',sub:'HTML and CSV report',key:'',fn:()=>exportMonthlyReport()},
    {icon:'▦',title:'Transactions',sub:'Search, filter, export CSV',key:'T',fn:()=>showView('transactions')},
    {icon:'✎',title:'Clean merchant names',sub:'Normalize all vendor names',key:'',fn:()=>cleanAllMerchants()},
    {icon:'⚙',title:'Settings',sub:'Privacy, categories, data tools',key:'',fn:()=>showView('settings')}
  ];
}

function openCommandPalette(){
  const p=document.getElementById('commandPalette'); const i=document.getElementById('commandInput'); if(!p||!i) return;
  p.classList.add('active'); i.value=''; renderCommandPalette(); setTimeout(()=>i.focus(),20); state.settings.commandPaletteSeen=true; saveState();
}

function closeCommandPalette(){ document.getElementById('commandPalette')?.classList.remove('active'); }

function renderCommandPalette(){
  const q=String(document.getElementById('commandInput')?.value||'').toLowerCase().trim(); const out=document.getElementById('commandResults'); if(!out) return;
  const rows=commandActions().filter(a=>!q || (a.title+' '+a.sub).toLowerCase().includes(q));
  out.innerHTML=rows.length?rows.map((a,i)=>`<button class="command-item ${i===0?'active':''}" data-command-index="${i}" onclick="runCommandAction(${i})"><i>${escapeHtml(a.icon)}</i><div><b>${escapeHtml(a.title)}</b><span>${escapeHtml(a.sub)}</span></div>${a.key?`<kbd>${escapeHtml(a.key)}</kbd>`:''}</button>`).join(''):`<div class="empty"><div><strong>No matching action.</strong><p>Try “budget”, “export”, “net worth”, or “customize”.</p></div></div>`;
}

function runCommandAction(renderedIndex){
  const q=String(document.getElementById('commandInput')?.value||'').toLowerCase().trim(); const rows=commandActions().filter(a=>!q || (a.title+' '+a.sub).toLowerCase().includes(q)); const a=rows[renderedIndex]; if(!a) return; closeCommandPalette(); a.fn();
}

function handleCommandPaletteKey(e){
  if(e.key==='Escape'){ e.preventDefault(); closeCommandPalette(); return; }
  const items=[...document.querySelectorAll('.command-item')]; if(!items.length) return; let idx=items.findIndex(x=>x.classList.contains('active')); if(idx<0) idx=0;
  if(e.key==='ArrowDown' || e.key==='ArrowUp'){ e.preventDefault(); items[idx]?.classList.remove('active'); idx=(idx+(e.key==='ArrowDown'?1:-1)+items.length)%items.length; items[idx].classList.add('active'); items[idx].scrollIntoView({block:'nearest'}); }
  if(e.key==='Enter'){ e.preventDefault(); runCommandAction(Number(items[idx]?.dataset.commandIndex||0)); }
}

function setupKeyboard(){ document.addEventListener('keydown',e=>{ const tag=document.activeElement?.tagName; const inField=['INPUT','SELECT','TEXTAREA'].includes(tag); const key=e.key.toLowerCase(); if((e.metaKey||e.ctrlKey) && key==='k'){ e.preventDefault(); openCommandPalette(); return; } if(e.key==='Escape' && document.getElementById('commandPalette')?.classList.contains('active')){ e.preventDefault(); closeCommandPalette(); return; } if(activeView==='review' && !inField){ const t=currentReviewTx(); if(t && ['a','s','r','c'].includes(key)){ e.preventDefault(); if(key==='a') approveTx(t.id); if(key==='s') skipReview(); if(key==='r') createRuleForTx(t.id); if(key==='c') cleanTxMerchant(t.id); return; } } if(!inField && e.key==='/'){ e.preventDefault(); document.getElementById('globalSearch')?.focus(); return; } if(!inField && key==='n'){ e.preventDefault(); openDrawer('quickAdd'); return; } if(!inField && key==='b'){ e.preventDefault(); showView('budgets'); return; } if(!inField && key==='c'){ e.preventDefault(); openDrawer('customize'); return; } if(!inField && key==='t'){ e.preventDefault(); showView('transactions'); return; } if(!inField && key==='w'){ e.preventDefault(); showView('networth'); return; } }); }
