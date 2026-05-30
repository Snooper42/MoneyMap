/* MoneyMap storage module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function loadState(){
  const readJson = key => {
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      console.warn(`MoneyMap could not read ${key}.`, e);
      return null;
    }
  };
  const current = readJson(STORAGE_KEY);
  if(current) return mergeState(defaultState, current);
  for(const key of OLD_STORAGE_KEYS){
    const legacy = readJson(key);
    if(!legacy) continue;
    const migrated = mergeState(defaultState, legacy);
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(key);
      storageMigrationNotice = `Migrated local workspace from ${key} to ${STORAGE_KEY}.`;
    }catch(e){
      storageWriteFailed = true;
      storageMigrationNotice = `Loaded legacy workspace from ${key}, but could not save the new storage key. Export a backup now.`;
      console.warn('MoneyMap storage migration could not be saved.', e);
    }
    return migrated;
  }
  return clone(defaultState);
}

function mergeState(base, saved){
  const out = clone(base);
  Object.assign(out, saved || {});
  out.settings = {...base.settings, ...(saved.settings || {})};
  out.settings.homeTiles = {...base.settings.homeTiles, ...((saved.settings || {}).homeTiles || {})};
  out.appearance = {...base.appearance, ...(saved.appearance || {})};
  out.automation = {...base.automation, ...(saved.automation || {})};
  out.trackerSettings = {...base.trackerSettings, ...(saved.trackerSettings || {})};
  if(saved.theme && !(saved.appearance && saved.appearance.theme)) out.appearance.theme = saved.theme;
  out.theme = out.appearance.theme;
  out.transactions = saved.transactions || [];
  out.rules = saved.rules || [];
  out.merchantRules = (saved.merchantRules || []).map(r=>({id:r.id||uid('mr'), match:String(r.match||'').trim(), name:String(r.name||'').trim(), source:r.source||'auto', hits:Number(r.hits||0), createdAt:r.createdAt||new Date().toISOString(), updatedAt:r.updatedAt||r.createdAt||new Date().toISOString()})).filter(r=>r.match&&r.name);
  out.budgets = saved.budgets || [];
  out.goals = (saved.goals || []).map(g=>({priority:'Medium', dueDate:'', linkedAccount:'', notes:'', ...g}));
  out.accounts = (saved.accounts || []).map(a=>({includeNetWorth:true, updatedAt:a.updatedAt||a.createdAt||'', ...a}));
  out.netWorthHistory = saved.netWorthHistory || [];
  out.debts = (saved.debts || []).map(d=>({includeNetWorth:true, extraPayment:0, dueDay:'', ...d}));
  out.holdings = (saved.holdings || []).map(h=>({includeNetWorth:true, assetClass:'Stock', account:'', ...h}));
  out.creditHistory = (saved.creditHistory || []).map(c=>({source:'', utilization:null, ...c}));
  out.imports = saved.imports || [];
  out.importMappings = saved.importMappings || [];
  out.recurring = saved.recurring || [];
  return out;
}

function storageSnapshot(){ return JSON.stringify(state); }

function storageSizeKb(){
  try{ return Math.round(((localStorage.getItem(STORAGE_KEY)||'').length)/1024); }
  catch(e){ return Math.round((window.__moneyMapMemoryState||storageSnapshot()||'').length/1024); }
}

function storageHealthLevel(kb=storageSizeKb()){
  if(storageWriteFailed) return 'danger';
  if(kb >= 5120) return 'danger';
  if(kb >= 4096) return 'warn';
  if(kb >= 2048) return 'notice';
  return 'ok';
}

function storageHealthMessage(kb=storageSizeKb()){
  if(storageWriteFailed) return {
    title:'Storage save failed',
    body:'MoneyMap could not write to browser storage. Export a backup now before refreshing or closing this tab.'
  };
  if(kb >= 5120) return {
    title:'Storage is at the danger threshold',
    body:`Workspace is about ${kb} KB. Browser localStorage may reject future saves. Export a backup now.`
  };
  if(kb >= 4096) return {
    title:'Storage is getting close to the browser limit',
    body:`Workspace is about ${kb} KB. Export a backup before importing more transactions.`
  };
  if(kb >= 2048) return {
    title:'Backup recommended',
    body:`Workspace is about ${kb} KB. Keep a recent JSON backup before larger imports.`
  };
  return null;
}

function ensureStorageWarningBanner(){
  let banner=document.getElementById('storageWarningBanner');
  if(banner) return banner;
  banner=document.createElement('div');
  banner.id='storageWarningBanner';
  banner.className='storage-warning-banner';
  banner.setAttribute('role','status');
  banner.setAttribute('aria-live','polite');
  const main=document.querySelector('.main');
  if(main) main.insertBefore(banner, main.firstChild);
  else document.body.prepend(banner);
  return banner;
}

function updateStorageWarningBanner(){
  const banner=ensureStorageWarningBanner();
  const kb=storageSizeKb();
  const level=storageHealthLevel(kb);
  const msg=storageHealthMessage(kb);
  banner.className=`storage-warning-banner ${level}`;
  if(!msg){ banner.classList.remove('visible'); banner.innerHTML=''; return; }
  banner.classList.add('visible');
  banner.innerHTML=`<div><b>${escapeHtml(msg.title)}</b><span>${escapeHtml(msg.body)}</span></div><div class="banner-actions"><button class="btn btn-small btn-primary" onclick="exportBackup()">Export backup</button><button class="btn btn-small" onclick="openDrawer('backup')">Backup center</button></div>`;
}

function notifyStorageProblem(message='Storage is full or unavailable. Export a backup now.'){
  storageWriteFailed = true;
  window.__moneyMapMemoryState = storageSnapshot();
  console.warn(message);
  requestAnimationFrame(()=>{
    updateStorageWarningBanner();
    if(typeof toast === 'function') toast(message);
    const badge=document.getElementById('storageUsage');
    if(badge) badge.textContent='Save failed';
  });
}

function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, storageSnapshot());
    storageWriteFailed = false;
    updateStorageWarningBanner();
    return true;
  }catch(e){
    notifyStorageProblem('Storage is full or unavailable. Export a backup now.');
    try{ openDrawer('backup'); }catch(drawerError){ console.warn('MoneyMap could not open the backup drawer after a storage failure.', drawerError); }
    console.warn('MoneyMap saveState failed.', e);
    throw e;
  }
}

function storageStatusText(){
  if(storageWriteFailed) return 'Save failed';
  const kb = storageSizeKb();
  if(kb >= 5120) return `${kb} KB · danger threshold`;
  if(kb >= 4096) return `${kb} KB · near browser limit`;
  if(kb >= 2048) return `${kb} KB · backup recommended`;
  return `${kb} KB`;
}

function checkStorageHealth(){
  const kb=storageSizeKb();
  updateStorageWarningBanner();
  if(storageWriteFailed) notifyStorageProblem('Storage is full or unavailable. Export a backup now.');
  else if(kb>=5120) requestAnimationFrame(()=>toast('Storage is at the danger threshold. Export a backup now.'));
  else if(kb>=4096) requestAnimationFrame(()=>toast('Workspace storage is near the browser limit. Export a backup.'));
  else if(kb>=2048) requestAnimationFrame(()=>toast('Workspace is growing. Export a backup before larger imports.'));
}

function backupSummary(){
  const visibleTx=(state.transactions||[]).filter(t=>!t.hidden).length;
  return {
    transactions:(state.transactions||[]).length,
    visibleTransactions:visibleTx,
    budgets:(state.budgets||[]).length,
    goals:(state.goals||[]).length,
    accounts:(state.accounts||[]).length,
    netWorthSnapshots:(state.netWorthHistory||[]).length,
    debts:(state.debts||[]).length,
    holdings:(state.holdings||[]).length,
    creditLogs:(state.creditHistory||[]).length,
    rules:(state.rules||[]).length,
    imports:(state.imports||[]).length,
    recurring:(state.recurring||[]).length
  };
}

function lastBackupText(){ return state.settings.lastBackup ? new Date(state.settings.lastBackup).toLocaleString() : 'Never'; }

function backupFreshnessLabel(){
  if(!state.settings.lastBackup) return 'No backup';
  const ms=Date.now()-new Date(state.settings.lastBackup).getTime();
  if(!Number.isFinite(ms)) return 'Unknown';
  const days=Math.floor(ms/86400000);
  if(days<=0) return 'Backed up today';
  if(days===1) return 'Backed up yesterday';
  if(days<=7) return `${days} days old`;
  if(days<=30) return `${Math.round(days/7)} weeks old`;
  return `${Math.round(days/30)} months old`;
}

function backupSummaryHtml(){
  const s=backupSummary(); const kb=Math.max(1,storageSizeKb());
  return `<div class="mini-item"><div><b>Last backup</b><br><span id="lastBackupLabelDrawer">${escapeHtml(lastBackupText())}</span></div><span class="pill">${escapeHtml(backupFreshnessLabel())}</span></div><div class="mini-item"><div><b>Workspace size</b><br><span>Approximate localStorage footprint</span></div><strong>${escapeHtml(storageStatusText())}</strong></div><div class="mini-item"><div><b>Records included</b><br><span>${s.transactions} transactions · ${s.accounts} accounts · ${s.goals} goals</span></div><strong>${s.debts + s.holdings + s.creditLogs}</strong></div><div class="mini-item"><div><b>Portability coverage</b><br><span>Transactions, rules, budgets, trackers, settings, imports, mappings, and history.</span></div><strong class="good">Full</strong></div>`;
}

function backupPayload(exportedAt=new Date().toISOString()){
  const data=clone(state);
  data.settings={...defaultState.settings, ...(data.settings||{}), lastBackup:exportedAt};
  return {app:'MoneyMap', kind:'full-backup', build:APP_BUILD_ID, storageKey:STORAGE_KEY, schemaVersion:data.version||defaultState.version, exportedAt, summary:backupSummary(), data};
}

function exportBackup(){
  const exportedAt=new Date().toISOString();
  state.settings.lastBackup=exportedAt;
  const payload=backupPayload(exportedAt);
  saveState();
  downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`moneymap-backup-${exportedAt.slice(0,10)}.json`);
  toast('Backup JSON exported.');
  renderAll();
}

function extractBackupState(parsed){
  if(parsed && parsed.data && typeof parsed.data==='object') return parsed.data;
  if(parsed && (Array.isArray(parsed.transactions) || Array.isArray(parsed.budgets) || Array.isArray(parsed.goals))) return parsed;
  throw new Error('Not a MoneyMap backup');
}

function importBackupFile(e){
  const input=e.target; const file=input.files && input.files[0]; if(!file) return;
  file.text().then(text=>{
    try{
      const parsed=JSON.parse(text);
      const incoming=extractBackupState(parsed);
      const summary=parsed.summary || {
        transactions:(incoming.transactions||[]).length,
        accounts:(incoming.accounts||[]).length,
        goals:(incoming.goals||[]).length,
        debts:(incoming.debts||[]).length,
        holdings:(incoming.holdings||[]).length,
        creditLogs:(incoming.creditHistory||[]).length
      };
      const exported=parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString() : 'unknown date';
      const msg=`Import backup from ${exported}? This replaces your current local MoneyMap workspace.\n\nTransactions: ${summary.transactions||0}\nAccounts: ${summary.accounts||0}\nGoals: ${summary.goals||0}\nDebts: ${summary.debts||0}\nHoldings: ${summary.holdings||0}\nCredit logs: ${summary.creditLogs||0}`;
      if(!confirm(msg)){ input.value=''; return; }
      state=mergeState(defaultState,incoming);
      state.settings.lastRestore=new Date().toISOString();
      state.settings.startupSeenBuild=APP_BUILD_ID;
      saveState();
      closeDrawer();
      toast('Backup JSON imported.');
      renderAll();
    }catch(err){
      const preview=document.getElementById('backupImportPreview');
      if(preview) preview.innerHTML=`<div class="mini-item"><div><b>Import failed</b><br><span>${escapeHtml(err.message||'Could not read this JSON file.')}</span></div><strong class="bad">Error</strong></div>`;
      toast('Could not import backup JSON.');
    }finally{ input.value=''; }
  });
}

function resetAllData(){
  if(!confirm('Delete all MoneyMap data in this browser? Export a backup first if you may need this workspace later.')) return;
  if(!confirm('Final confirmation: this clears transactions, budgets, trackers, imports, rules, and settings from localStorage.')) return;
  state=clone(defaultState);
  ensureStarterContent();
  try{ OLD_STORAGE_KEYS.forEach(key=>localStorage.removeItem(key)); }catch(e){}
  saveState();
  closeDrawer();
  toast('Local data reset.');
  renderAll();
  openFirstRunIfNeeded();
}

function exportBackupJson(){ return exportBackup(); }


// Load the local-first workspace after state defaults and storage helpers exist.
state = loadState();
