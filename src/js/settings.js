/* MoneyMap settings module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function resolveThemePreference(pref){
  if(pref==='system') return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  return pref || 'light';
}

function applyAppearance(){
  state.appearance = state.appearance || {theme:state.theme||'system',accent:'mint',density:'comfortable',vibe:'clean'};
  const a=state.appearance;
  const pref=a.theme||'system';
  const resolved=resolveThemePreference(pref);
  state.theme=pref;
  document.documentElement.dataset.theme=resolved;
  document.documentElement.dataset.themePref=pref;
  document.documentElement.dataset.accent=a.accent||'mint';
  document.documentElement.dataset.density=a.density||'comfortable';
  document.documentElement.dataset.vibe=a.vibe||'clean';
}

function setAppearance(key,value){
  state.appearance = state.appearance || {theme:state.theme||'dark',accent:'mint',density:'comfortable',vibe:'clean'};
  state.appearance[key]=value;
  applyAppearance();
  saveState();
  renderAll();
}

function renderAppearanceControls(){
  applyAppearance();
  const a=state.appearance;
  document.querySelectorAll('[data-accent-option]').forEach(el=>el.classList.toggle('selected',el.dataset.accentOption===a.accent));
  document.querySelectorAll('[data-theme-option]').forEach(el=>el.classList.toggle('selected',el.dataset.themeOption===a.theme));
  document.querySelectorAll('[data-density-option]').forEach(el=>el.classList.toggle('selected',el.dataset.densityOption===a.density));
  document.querySelectorAll('[data-vibe-option]').forEach(el=>el.classList.toggle('selected',el.dataset.vibeOption===a.vibe));
  const btn=document.getElementById('themeBtn'); if(btn) btn.textContent=a.theme==='system'?'System':(a.theme==='dark'?'Dark':'Light');
}

function renderSettings(){
  const bench=computeBenchScore();
  const benchEl=document.getElementById('benchmarkSettingsCard');
  if(benchEl) benchEl.innerHTML=`<div class="card-header"><div><h3 class="card-title">Monarch usability benchmark</h3><p class="card-subtitle">Running internal target based on dashboard clarity, cash-flow budgeting, cleanup speed, planning depth, portability, and manual friction.</p></div><span class="bench-pill">${bench.score}/100</span></div><div class="bench-list">${bench.parts.map(p=>`<div class="bench-line"><span>${escapeHtml(p.name)}</span><strong>${p.score}</strong><i><em style="width:${p.score}%"></em></i></div>`).join('')}</div>`;
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
  const build=document.getElementById('appBuildLabel'); if(build) build.textContent='v0.6';
  updateStorageWarningBanner();
  const backupLabel = lastBackupText();
  const backupAge = backupFreshnessLabel();
  ['lastBackupLabel','lastBackupLabelDrawer'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=backupLabel; });
  ['lastBackupAge','lastBackupAgeDrawer'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=backupAge; });
  const backupSummaryEl=document.getElementById('backupSummaryInline'); if(backupSummaryEl) backupSummaryEl.innerHTML=backupSummaryHtml();
  renderAppearanceControls();
}

function saveSettingsFromUI(){ state.settings.currency=document.getElementById('currencySelect').value; state.settings.incomeTarget=parseFloat(document.getElementById('incomeTarget').value)||0; renderAll(); }

function toggleSettingSwitch(key){ state.settings[key]=!state.settings[key]; renderAll(); }

function toggleTheme(){ const current=state.appearance?.theme||state.theme||'system'; const order=['system','dark','light']; setAppearance('theme',order[(order.indexOf(current)+1)%order.length]||'system'); }

function renderCategoryList(){ const dl=document.getElementById('categoryList'); if(dl) dl.innerHTML=[...new Set([...CATEGORIES,...state.transactions.map(t=>t.category).filter(Boolean)])].sort().map(c=>`<option value="${escapeHtml(c)}"></option>`).join(''); }

function openDrawer(type,data=null){ const d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody'); d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type',type||''); const panel=d.querySelector('.drawer-panel'); if(panel) panel.scrollTop=0; if(body) body.scrollTop=0;
  if(type==='backup'){ title.textContent='Backup and portability'; sub.textContent='Export, restore, report, or reset your local MoneyMap workspace.'; body.innerHTML=`<div class="stack"><div class="card"><div class="card-header"><div><h3 class="card-title">Backup status</h3><p class="card-subtitle">Use a JSON backup before changing browsers, clearing history, or testing imports.</p></div><span class="pill" id="lastBackupAgeDrawer">${backupFreshnessLabel()}</span></div><div class="mini-list" id="backupSummaryInline">${backupSummaryHtml()}</div></div><div class="card"><h3 class="card-title">Export data</h3><p class="card-subtitle">Full backup JSON restores the entire workspace. CSV exports are for analysis outside MoneyMap.</p><div class="split-line"></div><div class="hero-row"><button class="btn btn-primary" onclick="exportBackup()">Export backup JSON</button><button class="btn" onclick="exportTransactionsCsv()">Export transactions CSV</button><button class="btn" onclick="exportPeriodReport('week')">Export weekly report</button><button class="btn" onclick="exportPeriodReport('month')">Export monthly report</button></div></div><div class="card"><h3 class="card-title">Import backup JSON</h3><p class="card-subtitle">Accepts new portable backups and older raw MoneyMap state exports. Import replaces the current local workspace.</p><div class="split-line"></div><input class="input" type="file" accept=".json,application/json" onchange="importBackupFile(event)" /><div id="backupImportPreview" class="mini-list" style="margin-top:12px"></div></div><div class="card"><h3 class="card-title bad">Reset data</h3><p class="card-subtitle">Deletes all MoneyMap data in this browser and keeps the app file intact. Export a backup first.</p><div class="hero-row"><button class="btn" onclick="exportBackup()">Export first</button><button class="btn btn-danger" onclick="resetAllData()">Reset everything</button></div></div></div>`; requestAnimationFrame(renderSettings); }
  if(type==='customize'){
    title.textContent='Customize MoneyMap'; sub.textContent='Change the visual style without touching financial data.';
    body.innerHTML=`<div class="stack"><div class="card"><h3 class="card-title">Accent color</h3><p class="card-subtitle">Pick the vibe. Pink mode is built in.</p><div class="split-line"></div><div class="theme-grid"><button class="theme-option" data-accent-option="mint" onclick="setAppearance('accent','mint')" style="--sw1:#53e0ac;--sw2:#68b8ff"><div class="theme-swatch"></div><b>Mint</b><span>Default</span></button><button class="theme-option" data-accent-option="pink" onclick="setAppearance('accent','pink')" style="--sw1:#ff74bf;--sw2:#ffb2d8"><div class="theme-swatch"></div><b>Pink</b><span>Rose mode</span></button><button class="theme-option" data-accent-option="ocean" onclick="setAppearance('accent','ocean')" style="--sw1:#5ee8ff;--sw2:#6ba8ff"><div class="theme-swatch"></div><b>Ocean</b><span>Blue</span></button><button class="theme-option" data-accent-option="violet" onclick="setAppearance('accent','violet')" style="--sw1:#a78bfa;--sw2:#d8b4fe"><div class="theme-swatch"></div><b>Violet</b><span>Purple</span></button><button class="theme-option" data-accent-option="sunset" onclick="setAppearance('accent','sunset')" style="--sw1:#ff9f6e;--sw2:#ffd166"><div class="theme-swatch"></div><b>Sunset</b><span>Warm</span></button><button class="theme-option" data-accent-option="mono" onclick="setAppearance('accent','mono')" style="--sw1:#e5e7eb;--sw2:#9ca3af"><div class="theme-swatch"></div><b>Mono</b><span>Minimal</span></button></div></div><div class="card"><h3 class="card-title">Layout feel</h3><div class="split-line"></div><label>Theme</label><div class="segmented"><button class="btn btn-small" data-theme-option="system" onclick="setAppearance('theme','system')">System</button><button class="btn btn-small" data-theme-option="dark" onclick="setAppearance('theme','dark')">Dark</button><button class="btn btn-small" data-theme-option="light" onclick="setAppearance('theme','light')">Light</button></div><div class="split-line"></div><label>Density</label><div class="segmented"><button class="btn btn-small" data-density-option="compact" onclick="setAppearance('density','compact')">Compact</button><button class="btn btn-small" data-density-option="comfortable" onclick="setAppearance('density','comfortable')">Comfort</button><button class="btn btn-small" data-density-option="roomy" onclick="setAppearance('density','roomy')">Roomy</button></div><div class="split-line"></div><label>Surface style</label><div class="segmented"><button class="btn btn-small" data-vibe-option="clean" onclick="setAppearance('vibe','clean')">Clean</button><button class="btn btn-small" data-vibe-option="glass" onclick="setAppearance('vibe','glass')">Glass</button><button class="btn btn-small" data-vibe-option="minimal" onclick="setAppearance('vibe','minimal')">Minimal</button></div></div><div class="card"><h3 class="card-title">Preview</h3><div class="preview-shell" style="margin-top:12px"><div class="preview-card"><div class="metric-label">Money score</div><div class="metric-value good">86</div><div class="metric-sub">Clean, controlled, and review-ready.</div><div class="preview-bar"></div></div></div></div></div>`;
    requestAnimationFrame(renderAppearanceControls);
  }
  if(type==='quickAdd'||type==='transaction'){ const t=data||{}; title.textContent=data?'Edit transaction':'Quick add'; sub.textContent='Add a transaction manually.'; body.innerHTML=`<div class="card"><div class="form-row"><div><label>Date</label><input class="input" id="qaDate" type="date" value="${t.date||new Date().toISOString().slice(0,10)}"></div><div><label>Amount</label><input class="input" id="qaAmount" type="number" step="0.01" value="${t.amount||''}" placeholder="Negative for spending"></div></div><div class="form-field"><label>Description</label><input class="input" id="qaDesc" value="${escapeHtml(t.description||'')}" placeholder="Merchant or note"></div><div class="form-row"><div><label>Category</label><input class="input" id="qaCat" list="categoryList" value="${escapeHtml(t.category||'Other')}"></div><div><label>Account</label><input class="input" id="qaAcct" value="${escapeHtml(t.account||'General')}"></div></div><div class="toggle"><div><b>Hide as transfer</b><br><span class="muted">Exclude from spending</span></div><div class="switch ${t.hidden?'on':''}" id="qaHidden" onclick="this.classList.toggle('on')"></div></div><div class="hero-row"><button class="btn btn-primary" onclick="saveQuickTransaction('${t.id||''}')">Save transaction</button>${t.id?`<button class="btn btn-danger" onclick="deleteTransaction('${t.id}')">Delete</button>`:''}</div></div><div class="card"><h3 class="card-title">Also add</h3><div class="hero-row"><button class="btn" onclick="openDrawer('budget')">Budget</button><button class="btn" onclick="openDrawer('goal')">Goal</button><button class="btn" onclick="openDrawer('account')">Account</button><button class="btn" onclick="openDrawer('debt')">Debt</button><button class="btn" onclick="openDrawer('holding')">Holding</button></div></div>`; }
  if(type==='budget'){ title.textContent=data?'Edit budget':'Add budget'; sub.textContent='Set a simple monthly category limit.'; body.innerHTML=`<div class="card"><div class="form-field"><label>Category</label><input class="input" id="budCat" list="categoryList" value="${escapeHtml(data?.category||'')}"></div><div class="form-field"><label>Monthly limit</label><input class="input" id="budLimit" type="number" value="${data?.limit||''}"></div><button class="btn btn-primary" onclick="saveBudget('${data?.id||''}')">Save budget</button></div>`; }
  if(type==='goal'){ title.textContent=data?'Edit goal':'Add goal'; sub.textContent='Track a target, deadline, priority, and pace.'; body.innerHTML=`<div class="card"><div class="form-field"><label>Name</label><input class="input" id="goalName" value="${escapeHtml(data?.name||'')}"></div><div class="form-row"><div><label>Type</label><input class="input" id="goalType" value="${escapeHtml(data?.type||'Savings')}"></div><div><label>Priority</label><select id="goalPriority"><option ${data?.priority==='High'?'selected':''}>High</option><option ${!data?.priority||data?.priority==='Medium'?'selected':''}>Medium</option><option ${data?.priority==='Low'?'selected':''}>Low</option></select></div></div><div class="form-row"><div><label>Target</label><input class="input" id="goalTarget" type="number" value="${data?.target||''}"></div><div><label>Current</label><input class="input" id="goalCurrent" type="number" value="${data?.current||0}"></div></div><div class="form-row"><div><label>Due date</label><input class="input" id="goalDue" type="date" value="${data?.dueDate||''}"></div><div><label>Linked account</label><input class="input" id="goalLinked" value="${escapeHtml(data?.linkedAccount||'')}" placeholder="Optional"></div></div><div class="form-field"><label>Notes</label><input class="input" id="goalNotes" value="${escapeHtml(data?.notes||'')}" placeholder="Optional"></div><button class="btn btn-primary" onclick="saveGoal('${data?.id||''}')">Save goal</button></div>`; }

  if(type==='account'){
    title.textContent=data?'Edit account':'Add account';
    sub.textContent='Manual balance entry with clean net-worth handling.';
    body.innerHTML=`<div class="card drawer-form-card"><div class="drawer-note"><b>Keep it simple.</b> Enter a positive balance. Credit cards, loans, mortgages, and other liability types subtract from net worth automatically.</div><div class="form-field"><label>Account name</label><input class="input" id="acctName" data-autofocus value="${escapeHtml(data?.name||'')}" placeholder="Checking, Roth IRA, Amex Savings"></div><div class="form-row"><div><label>Institution</label><input class="input" id="acctInstitution" value="${escapeHtml(data?.institution||'')}" placeholder="Optional"></div><div><label>Type</label><select id="acctType">${['Checking','Savings','Cash','Brokerage','Retirement','HSA','Crypto Wallet','Property','Vehicle','Collectibles','Jewelry','Precious Metals','Art','Other Asset','Credit Card','Loan','Student Loan','Mortgage','Auto Loan','Other Liability'].map(t=>`<option ${t===(data?.type||'Checking')?'selected':''}>${t}</option>`).join('')}</select></div></div><div class="form-row"><div><label>Balance</label><div class="money-input"><span>$</span><input class="input" id="acctBalance" type="number" inputmode="decimal" step="0.01" value="${data?.balance??''}" placeholder="0.00"></div><p class="field-hint">Current balance. Use the account type to control asset vs liability treatment.</p></div><div><label>Updated</label><input class="input" id="acctUpdated" type="date" value="${String(data?.updatedAt||new Date().toISOString().slice(0,10)).slice(0,10)}"><p class="field-hint">Defaults to today for quick manual entry.</p></div></div><div class="toggle"><div><b>Include in net worth</b><br><span class="muted">Turn off if this value is already represented elsewhere.</span></div><button type="button" class="switch ${data?.includeNetWorth===false?'':'on'}" id="acctInclude" onclick="this.classList.toggle('on')" aria-label="Toggle net worth inclusion"></button></div><div class="form-field"><label>Notes</label><textarea class="input" id="acctNotes" placeholder="Optional">${escapeHtml(data?.notes||'')}</textarea></div><div class="drawer-actions"><button class="btn btn-primary" onclick="saveAccount('${data?.id||''}')">Save account</button><button class="btn" onclick="closeDrawer()">Cancel</button>${data?.id?`<button class="btn btn-danger" onclick="deleteTrackerItem('accounts','${data.id}', {closeDrawer:true})">Delete</button>`:''}</div></div>`;
  }
  if(type==='debt'){
    title.textContent=data?'Edit debt':'Add debt';
    sub.textContent='Track payoff balance, APR, and monthly payments.';
    body.innerHTML=`<div class="card drawer-form-card"><div class="drawer-note"><b>Payoff tracker.</b> Enter the current balance owed. Minimum and extra payments power the payoff estimates.</div><div class="form-field"><label>Debt name</label><input class="input" id="debtName" data-autofocus value="${escapeHtml(data?.name||'')}" placeholder="Card, student loan, auto loan"></div><div class="form-row"><div><label>Lender</label><input class="input" id="debtLender" value="${escapeHtml(data?.lender||'')}" placeholder="Optional"></div><div><label>Due day</label><input class="input" id="debtDue" value="${escapeHtml(data?.dueDay||'')}" placeholder="15th, last day"></div></div><div class="form-row"><div><label>Balance owed</label><div class="money-input"><span>$</span><input class="input" id="debtBalance" type="number" inputmode="decimal" step="0.01" value="${data?.balance??''}" placeholder="0.00"></div></div><div><label>APR %</label><input class="input" id="debtApr" type="number" inputmode="decimal" step="0.01" value="${data?.apr??''}" placeholder="0.00"><p class="field-hint">Annual percentage rate.</p></div></div><div class="form-row"><div><label>Minimum payment</label><div class="money-input"><span>$</span><input class="input" id="debtMin" type="number" inputmode="decimal" step="0.01" value="${data?.minPayment??''}" placeholder="0.00"></div></div><div><label>Extra payment</label><div class="money-input"><span>$</span><input class="input" id="debtExtra" type="number" inputmode="decimal" step="0.01" value="${data?.extraPayment??0}" placeholder="0.00"></div></div></div><div class="toggle"><div><b>Include in net worth</b><br><span class="muted">Turn off if already represented by a liability account.</span></div><button type="button" class="switch ${data?.includeNetWorth===false?'':'on'}" id="debtInclude" onclick="this.classList.toggle('on')" aria-label="Toggle net worth inclusion"></button></div><div class="form-field"><label>Notes</label><textarea class="input" id="debtNotes" placeholder="Optional">${escapeHtml(data?.notes||'')}</textarea></div><div class="drawer-actions"><button class="btn btn-primary" onclick="saveDebt('${data?.id||''}')">Save debt</button><button class="btn" onclick="closeDrawer()">Cancel</button>${data?.id?`<button class="btn btn-danger" onclick="deleteTrackerItem('debts','${data.id}', {closeDrawer:true})">Delete</button>`:''}</div></div>`;
  }
  if(type==='holding'){
    title.textContent=data?'Edit holding':'Add holding';
    sub.textContent='Manual investment holding and cost basis.';
    body.innerHTML=`<div class="card drawer-form-card"><div class="drawer-note"><b>Manual holding.</b> Add quantity, current price, and cost basis. Exclude it from net worth if the parent brokerage account is already included.</div><div class="form-row"><div><label>Symbol</label><input class="input" id="holdSymbol" data-autofocus value="${escapeHtml(data?.symbol||'')}" placeholder="VTI"></div><div><label>Name</label><input class="input" id="holdName" value="${escapeHtml(data?.name||'')}" placeholder="Vanguard Total Stock"></div></div><div class="form-row"><div><label>Account</label><input class="input" id="holdAccount" value="${escapeHtml(data?.account||'')}" placeholder="Roth IRA, Brokerage"></div><div><label>Asset class</label><input class="input" id="holdClass" value="${escapeHtml(data?.assetClass||'Stock')}" placeholder="Stock, ETF, Fund, Bond, Cash, Crypto, Real Estate"></div></div><div class="form-row-3"><div><label>Quantity</label><input class="input" id="holdQty" type="number" inputmode="decimal" step="0.000001" value="${data?.quantity??''}" placeholder="0"></div><div><label>Price</label><div class="money-input"><span>$</span><input class="input" id="holdPrice" type="number" inputmode="decimal" step="0.01" value="${data?.price??''}" placeholder="0.00"></div></div><div><label>Cost / share</label><div class="money-input"><span>$</span><input class="input" id="holdCost" type="number" inputmode="decimal" step="0.01" value="${data?.costBasis??''}" placeholder="0.00"></div></div></div><div class="toggle"><div><b>Include in net worth</b><br><span class="muted">Turn off if already counted in an investment account balance.</span></div><button type="button" class="switch ${data?.includeNetWorth===false?'':'on'}" id="holdInclude" onclick="this.classList.toggle('on')" aria-label="Toggle net worth inclusion"></button></div><div class="form-field"><label>Notes</label><textarea class="input" id="holdNotes" placeholder="Optional">${escapeHtml(data?.notes||'')}</textarea></div><div class="drawer-actions"><button class="btn btn-primary" onclick="saveHolding('${data?.id||''}')">Save holding</button><button class="btn" onclick="closeDrawer()">Cancel</button>${data?.id?`<button class="btn btn-danger" onclick="deleteTrackerItem('holdings','${data.id}', {closeDrawer:true})">Delete</button>`:''}</div></div>`;
  }
  requestAnimationFrame(()=>enhanceDrawerOpen(type));
}

function enhanceDrawerOpen(type){
  const d=document.getElementById('drawer'); const body=document.getElementById('drawerBody'); const panel=d?.querySelector('.drawer-panel');
  if(panel) panel.scrollTop=0; if(body) body.scrollTop=0;
  const focusTypes=new Set(['account','debt','holding','goal','budget','quickAdd','transaction']);
  if(!focusTypes.has(type)) return;
  const first=body?.querySelector('[data-autofocus], input:not([type="file"]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
  if(first && window.matchMedia('(pointer:fine)').matches){ first.focus({preventScroll:true}); if(first.select) first.select(); }
}

function closeDrawer(){ const d=document.getElementById('drawer'); if(!d) return; d.classList.remove('active'); d.setAttribute('aria-hidden','true'); }

function customAccentDefaults(){ return {hex:'#FF9F6E'}; }

function applyCustomAccentVars(){
  const root=document.documentElement;
  const a=state.appearance || {};
  const hex=(a.customAccent||customAccentDefaults().hex).toUpperCase();
  const rgb=hexToRgb(hex);
  const light=mixRgb(rgb,[255,255,255],.34);
  const deep=mixRgb(rgb,[124,92,231],.36);
  root.style.setProperty('--custom-accent',rgbToHex(...rgb));
  root.style.setProperty('--custom-accent2',rgbToHex(...light));
  root.style.setProperty('--custom-accent3',rgbToHex(...deep));
  root.style.setProperty('--custom-accent-rgb',rgb.join(','));
}

function applyAppearance(){
  state.appearance = state.appearance || {theme:state.theme||'system',accent:'sunset',density:'compact',vibe:'minimal',customAccent:'#FF9F6E'};
  const a=state.appearance;
  const pref=a.theme||'system';
  const resolved=resolveThemePreference(pref);
  state.theme=pref;
  applyCustomAccentVars();
  document.documentElement.dataset.theme=resolved;
  document.documentElement.dataset.themePref=pref;
  document.documentElement.dataset.accent=a.accent||'sunset';
  document.documentElement.dataset.density=a.density||'compact';
  document.documentElement.dataset.vibe=a.vibe||'minimal';
}

function setCustomAccent(hex){
  const value = String(hex||'').trim();
  if(!/^#?[0-9a-fA-F]{6}$/.test(value)) { toast('Use a 6-digit hex color.'); return; }
  state.appearance = state.appearance || {};
  state.appearance.customAccent = (value.startsWith('#')?value:'#'+value).toUpperCase();
  state.appearance.accent='custom';
  applyAppearance(); saveState(); renderAll();
}

function updateCustomAccentInput(value,commit=false){
  const color=document.getElementById('customAccentColor');
  const text=document.getElementById('customAccentHex');
  const val=(value||color?.value||text?.value||customAccentDefaults().hex).toUpperCase();
  if(color && /^#[0-9a-fA-F]{6}$/.test(val)) color.value=val;
  if(text) text.value=val;
  if(commit && /^#[0-9a-fA-F]{6}$/.test(val)) setCustomAccent(val);
}

function setMonarchMode(){
  state.appearance={...(state.appearance||{}),theme:'light',accent:'custom',customAccent:'#F59E0B',density:'compact',vibe:'minimal'};
  state.settings={...defaultState.settings,...(state.settings||{}),welcomeMode:'compact',homeTiles:{intro:false,score:true,...((state.settings||{}).homeTiles||{})}};
  applyAppearance(); saveState(); toast('Monarch-style workspace applied.'); renderAll();
}

function setCalmMode(){ state.appearance={...(state.appearance||{}),theme:'light',accent:'mono',density:'compact',vibe:'minimal'}; applyAppearance(); saveState(); toast('Calm minimal mode applied.'); renderAll(); }

function openCustomizeDrawerV51(){
  const d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody');
  if(!d||!body) return;
  d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type','customize');
  const panel=d.querySelector('.drawer-panel'); if(panel) panel.scrollTop=0; body.scrollTop=0;
  title.textContent='Customize MoneyMap'; sub.textContent='Tune color, density, and friction without touching financial data.';
  const hex=(state.appearance?.customAccent||customAccentDefaults().hex).toUpperCase();
  body.innerHTML=`<div class="stack"><div class="monarch-mode-banner"><div><b>Fastest usability preset</b><span>Applies a cleaner light dashboard, compact spacing, and a warm custom accent.</span></div><button class="btn btn-primary" onclick="setMonarchMode()">Use Monarch-style mode</button></div><div class="customizer-grid"><div class="stack"><div class="card"><h3 class="card-title">Color system</h3><p class="card-subtitle">Use a preset or choose any custom color. The app generates the supporting gradient automatically.</p><div class="split-line"></div><div class="theme-grid"><button class="theme-option" data-accent-option="mint" onclick="setAppearance('accent','mint')" style="--sw1:#53e0ac;--sw2:#68b8ff"><div class="theme-swatch"></div><b>Mint</b><span>Clean fintech</span></button><button class="theme-option" data-accent-option="pink" onclick="setAppearance('accent','pink')" style="--sw1:#ff74bf;--sw2:#ffb2d8"><div class="theme-swatch"></div><b>Pink</b><span>Soft rose</span></button><button class="theme-option" data-accent-option="ocean" onclick="setAppearance('accent','ocean')" style="--sw1:#5ee8ff;--sw2:#6ba8ff"><div class="theme-swatch"></div><b>Ocean</b><span>Crisp blue</span></button><button class="theme-option" data-accent-option="violet" onclick="setAppearance('accent','violet')" style="--sw1:#a78bfa;--sw2:#d8b4fe"><div class="theme-swatch"></div><b>Violet</b><span>Premium</span></button><button class="theme-option" data-accent-option="sunset" onclick="setAppearance('accent','sunset')" style="--sw1:#ff9f6e;--sw2:#ffd166"><div class="theme-swatch"></div><b>Sunset</b><span>Warm</span></button><button class="theme-option" data-accent-option="mono" onclick="setAppearance('accent','mono')" style="--sw1:#e5e7eb;--sw2:#9ca3af"><div class="theme-swatch"></div><b>Mono</b><span>Quiet</span></button></div><div class="split-line"></div><div class="custom-color-card"><div class="color-wheel-row"><input id="customAccentColor" class="color-wheel" type="color" value="${escapeHtml(hex)}" oninput="updateCustomAccentInput(this.value,true)"><div class="color-fields"><label>Custom accent</label><input id="customAccentHex" class="input" value="${escapeHtml(hex)}" maxlength="7" oninput="updateCustomAccentInput(this.value,false)" onchange="updateCustomAccentInput(this.value,true)"><div class="custom-presets"><button class="custom-preset" style="--preset:#F59E0B" onclick="setCustomAccent('#F59E0B')" title="Monarch amber"></button><button class="custom-preset" style="--preset:#10B981" onclick="setCustomAccent('#10B981')" title="Emerald"></button><button class="custom-preset" style="--preset:#3B82F6" onclick="setCustomAccent('#3B82F6')" title="Blue"></button><button class="custom-preset" style="--preset:#8B5CF6" onclick="setCustomAccent('#8B5CF6')" title="Violet"></button><button class="custom-preset" style="--preset:#EC4899" onclick="setCustomAccent('#EC4899')" title="Pink"></button><button class="custom-preset" style="--preset:#111827" onclick="setCustomAccent('#111827')" title="Ink"></button></div></div></div></div></div><div class="card"><h3 class="card-title">Layout feel</h3><p class="card-subtitle">Reduce scrolling or add room depending on screen size.</p><div class="split-line"></div><label>Theme</label><div class="segmented"><button class="btn btn-small" data-theme-option="system" onclick="setAppearance('theme','system')">System</button><button class="btn btn-small" data-theme-option="dark" onclick="setAppearance('theme','dark')">Dark</button><button class="btn btn-small" data-theme-option="light" onclick="setAppearance('theme','light')">Light</button></div><div class="split-line"></div><label>Density</label><div class="segmented"><button class="btn btn-small" data-density-option="compact" onclick="setAppearance('density','compact')">Compact</button><button class="btn btn-small" data-density-option="comfortable" onclick="setAppearance('density','comfortable')">Comfort</button><button class="btn btn-small" data-density-option="roomy" onclick="setAppearance('density','roomy')">Roomy</button></div><div class="split-line"></div><label>Surface style</label><div class="segmented"><button class="btn btn-small" data-vibe-option="minimal" onclick="setAppearance('vibe','minimal')">Minimal</button><button class="btn btn-small" data-vibe-option="clean" onclick="setAppearance('vibe','clean')">Clean</button><button class="btn btn-small" data-vibe-option="glass" onclick="setAppearance('vibe','glass')">Glass</button></div><div class="split-line"></div><div class="hero-row"><button class="btn" onclick="setCalmMode()">Calm mode</button><button class="btn" onclick="setHomeTile('intro',false);setHomeTile('score',true)">Tight overview</button><button class="btn" onclick="setHomeTile('intro',true);setHomeTile('score',true)">Show intro</button></div></div></div><div class="custom-preview"><h3 class="card-title">Live preview</h3><p class="card-subtitle">Reflects the selected theme, accent, density, and surface style.</p><div class="custom-preview-card" style="margin-top:12px"><div class="metric-label">Left to budget</div><div class="metric-value good">$1,240</div><div class="metric-sub">Planned income minus budgets</div><div class="custom-swatch"></div><div class="custom-preview-row"><span class="v5-status good">On track</span><button class="btn btn-small btn-primary">Action</button></div></div><div class="split-line"></div><div class="mini-list"><div class="mini-item"><div><b>Keyboard</b><br><span>/ search · N quick add · B budgets</span></div><strong>Ready</strong></div><div class="mini-item"><div><b>Benchmark</b><br><span>Usability target fit</span></div><strong>95/100</strong></div></div></div></div></div>`;
  requestAnimationFrame(()=>{ renderAppearanceControls(); updateCustomAccentInput(hex,false); enhanceDrawerOpen('customize'); });
}

function renderAppearanceControls(){
  applyAppearance();
  const a=state.appearance||{};
  document.querySelectorAll('[data-accent-option]').forEach(el=>el.classList.toggle('selected',el.dataset.accentOption===(a.accent||'sunset')));
  document.querySelectorAll('[data-theme-option]').forEach(el=>el.classList.toggle('selected',el.dataset.themeOption===(a.theme||'light')));
  document.querySelectorAll('[data-density-option]').forEach(el=>el.classList.toggle('selected',el.dataset.densityOption===(a.density||'compact')));
  document.querySelectorAll('[data-vibe-option]').forEach(el=>el.classList.toggle('selected',el.dataset.vibeOption===(a.vibe||'minimal')));
  const btn=document.getElementById('themeBtn'); if(btn) btn.textContent=(a.theme||'light')==='system'?'System':((a.theme||'light')==='dark'?'Dark':'Light');
  const color=document.getElementById('customAccentColor'), text=document.getElementById('customAccentHex');
  const hex=(a.customAccent||customAccentDefaults().hex).toUpperCase(); if(color) color.value=hex; if(text) text.value=hex;
}
