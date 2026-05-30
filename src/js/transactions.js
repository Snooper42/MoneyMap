/* MoneyMap transactions module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function showUnreviewedTransactions(){ showView('transactions'); requestAnimationFrame(()=>{ const v=document.getElementById('filterVisibility'); if(v) v.value='unreviewed'; renderAll(); }); }

function showCategoryTransactions(cat){ showView('transactions'); requestAnimationFrame(()=>{ const c=document.getElementById('filterCategory'); const v=document.getElementById('filterVisibility'); if(c) c.value=cat; if(v) v.value='visible'; renderAll(); }); }

function visibleTransactions(){
  const topQ = document.getElementById('globalSearch')?.value?.toLowerCase().trim() || '';
  const localQ = document.getElementById('transactionSearch')?.value?.toLowerCase().trim() || '';
  const q = [topQ, localQ].filter(Boolean).join(' ');
  const m = document.getElementById('filterMonth')?.value || currentMonth();
  const c = document.getElementById('filterCategory')?.value || 'all';
  const acct = document.getElementById('filterAccount')?.value || 'all';
  const vis = document.getElementById('filterVisibility')?.value || 'visible';
  const amountType = document.getElementById('filterAmountType')?.value || 'all';
  return state.transactions.filter(tx=>{
    const hay = `${tx.description} ${tx.rawDescription||''} ${tx.category} ${tx.account} ${tx.notes||''}`.toLowerCase();
    if(q && !q.split(/\s+/).every(term=>hay.includes(term))) return false;
    if(m !== 'all' && monthKey(tx.date)!==m) return false;
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
}

function monthTransactions(key=currentMonth(), includeHidden=false){
  return state.transactions.filter(tx=>(key==='all'||monthKey(tx.date)===key) && (includeHidden || !tx.hidden));
}

function spendingFor(txns){ return txns.filter(t=>Number(t.amount)<0 && !['Transfers','Income'].includes(t.category)).reduce((a,t)=>a+Math.abs(Number(t.amount)),0); }

function incomeFor(txns){ return txns.filter(t=>Number(t.amount)>0 && !t.hidden).reduce((a,t)=>a+Number(t.amount),0); }

function byCategory(txns){
  const map={}; txns.filter(t=>Number(t.amount)<0 && !t.hidden && !['Transfers','Income'].includes(t.category)).forEach(t=>{ map[t.category||'Other']=(map[t.category||'Other']||0)+Math.abs(Number(t.amount)); });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function miniTx(t){ const amt=Number(t.amount); return `<button type="button" class="mini-item click-card tx-mini-row" onclick="editTransaction('${t.id}')" aria-label="Edit ${escapeHtml(t.description)}"><div class="tx-mini-icon">${escapeHtml(String(t.description||'?').trim().slice(0,1).toUpperCase()||'?')}</div><div class="tx-mini-main"><b>${escapeHtml(t.description)}</b><span>${dateFmt(t.date)} · ${escapeHtml(t.category||'Other')}</span></div><strong class="${amt<0?'bad':'good'}">${money(amt)}</strong></button>`; }

function emptyMini(title,sub,actionLabel='',action=''){ return `<div class="empty" style="min-height:140px"><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(sub)}</p>${actionLabel?`<div class="empty-actions"><button class="btn btn-small btn-primary" onclick="${action}">${escapeHtml(actionLabel)}</button></div>`:''}</div></div>`; }

function escapeJs(str){ return String(str ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderFilters(){
  const monthSel=document.getElementById('filterMonth'); if(monthSel){ const months=[...new Set(state.transactions.map(t=>monthKey(t.date)))].sort().reverse(); const current=monthSel.value || currentMonth(); monthSel.innerHTML = `<option value="${currentMonth()}">This month</option><option value="all">All months</option>` + months.filter(m=>m!==currentMonth()).map(m=>`<option value="${m}">${monthLabel(m)}</option>`).join(''); monthSel.value = [...monthSel.options].some(o=>o.value===current)?current:currentMonth(); }
  const catSel=document.getElementById('filterCategory'); if(catSel){ const cats=[...new Set([...CATEGORIES,...state.transactions.map(t=>t.category).filter(Boolean),...state.budgets.map(b=>b.category)])].sort(); const current=catSel.value||'all'; catSel.innerHTML=`<option value="all">All categories</option>`+cats.map(c=>`<option>${escapeHtml(c)}</option>`).join(''); catSel.value=[...catSel.options].some(o=>o.value===current)?current:'all'; }
  const acctSel=document.getElementById('filterAccount'); if(acctSel){ const accounts=[...new Set(state.transactions.map(t=>t.account||'General'))].sort(); const current=acctSel.value||'all'; acctSel.innerHTML=`<option value="all">All accounts</option>`+accounts.map(a=>`<option>${escapeHtml(a)}</option>`).join(''); acctSel.value=[...acctSel.options].some(o=>o.value===current)?current:'all'; }
}

function renderTransactions(){
  const body=document.getElementById('transactionRows'); if(!body) return; const txns=visibleTransactions();
  if(!txns.length){ body.innerHTML=`<tr><td colspan="7"><div class="empty"><div><strong>No matching transactions.</strong><p>Import a CSV, add a transaction manually, or change the filters.</p><div class="empty-actions"><button class="btn btn-primary" onclick="showView('import')">Import CSV</button><button class="btn" onclick="openDrawer('quickAdd')">Add manually</button></div></div></div></td></tr>`; return; }
  body.innerHTML=txns.map(t=>{
    const raw=t.rawDescription&&t.rawDescription!==t.description?`<br><span class="muted">Raw: ${escapeHtml(t.rawDescription)}</span>`:'';
    const needsClean=merchantLooksMessy(t.rawDescription || t.description);
    const auto=t.hiddenReason?`<br><span class="muted">${escapeHtml(t.hiddenReason)}</span>`:'';
    const hideBtn=t.hidden?`<button class="btn btn-small" onclick="toggleTxHidden('${t.id}')">Unhide</button>`:`<button class="btn btn-small" onclick="toggleTxHidden('${t.id}')">Hide</button>`;
    return `<tr><td>${dateFmt(t.date)}</td><td><b>${escapeHtml(t.description)}</b>${raw}${auto}</td><td>${categorySelectHtml(t)}</td><td>${escapeHtml(t.account||'General')}</td><td>${t.hidden?'<span class="pill">Hidden</span>':t.reviewed?'<span class="pill">Reviewed</span>':'<span class="pill gold">Needs review</span>'}</td><td class="amount-cell ${Number(t.amount)<0?'bad':'good'}">${money(t.amount)}</td><td class="right"><div class="tx-actions">${needsClean?`<button class="btn btn-small" onclick="cleanTxMerchant('${t.id}')">Clean</button>`:''}${hideBtn}<button class="btn btn-small" onclick="createRuleForTx('${t.id}')">Rule</button><button class="btn btn-small" onclick="editTransaction('${t.id}')">Edit</button></div></td></tr>`;
  }).join('');
}

function categorySelectHtml(t){ const cats=[...new Set([...CATEGORIES,...state.budgets.map(b=>b.category), t.category])].filter(Boolean).sort(); return `<select onchange="updateTxCategory('${t.id}',this.value)" style="min-width:160px;padding:8px 10px;border-radius:999px">${cats.map(c=>`<option ${c===t.category?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select>`; }

function recordCategoryEdit(tx,cat,source='manual'){
  if(!tx || !cat) return; state.categoryStatus=state.categoryStatus||{};
  const key=normalizeMerchant(tx.rawDescription || tx.description); const entry=state.categoryStatus[key] || {edits:0,categories:{},contains:suggestRuleContains(tx),lastDescription:tx.description};
  entry.edits=(entry.edits||0)+1; entry.categories=entry.categories||{}; entry.categories[cat]=(entry.categories[cat]||0)+1; entry.lastCategory=cat; entry.lastSource=source; entry.contains=entry.contains || suggestRuleContains(tx); entry.lastDescription=tx.description; entry.updatedAt=new Date().toISOString(); state.categoryStatus[key]=entry;
}

function updateTxCategory(id,cat){ const t=state.transactions.find(x=>x.id===id); if(t){t.category=cat;t.hidden=cat==='Transfers'?true:t.hidden;t.hiddenReason=cat==='Transfers'?'Manual transfer category':t.hiddenReason; t.reviewed=true; recordCategoryEdit(t,cat,'transaction-list'); saveState();renderAll(); maybeToastRuleSuggestion(t,cat);} }

function toggleTxHidden(id){ const t=state.transactions.find(x=>x.id===id); if(!t) return; t.hidden=!t.hidden; if(t.hidden){ t.hiddenReason='Manually hidden'; t.reviewed=true; } else { delete t.hiddenReason; if(t.category==='Transfers') t.category='Other'; } saveState(); toast(t.hidden?'Transaction hidden from dashboards.':'Transaction restored to dashboards.'); renderAll(); }

function editTransaction(id){
  const t=state.transactions.find(x=>x.id===id); if(!t) return; openDrawer('transaction', t);
}

function parseCSV(text){
  const rows=[]; let row=[]; let cur=''; let inQuotes=false;
  const clean = String(text || '').replace(/^\uFEFF/, '');
  for(let i=0;i<clean.length;i++){
    const ch=clean[i], next=clean[i+1];
    if(ch==='"'){
      if(inQuotes && next==='"'){ cur+='"'; i++; }
      else inQuotes=!inQuotes;
    } else if(ch===',' && !inQuotes){
      row.push(cur); cur='';
    } else if((ch==='\n'||ch==='\r') && !inQuotes){
      if(ch==='\r'&&next==='\n') i++;
      row.push(cur);
      if(row.some(v=>String(v).trim()!=='')) rows.push(row);
      row=[]; cur='';
    } else cur+=ch;
  }
  row.push(cur); if(row.some(v=>String(v).trim()!=='')) rows.push(row);
  if(!rows.length) return {headers:[],rows:[]};
  const headers=dedupeHeaders(rows[0].map(h=>String(h).trim() || 'Column'));
  const data=rows.slice(1).map(r=>{ const o={}; headers.forEach((h,i)=>o[h]=String(r[i]??'').trim()); return o; });
  return {headers,rows:data};
}

function dedupeHeaders(headers){
  const seen={};
  return headers.map(h=>{ const base=h || 'Column'; const key=base.toLowerCase(); seen[key]=(seen[key]||0)+1; return seen[key]===1?base:`${base} ${seen[key]}`; });
}

function normalizeHeader(h){ return String(h||'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim(); }

function headerSignature(headers){ return headers.map(normalizeHeader).join('|'); }

function stripCsvName(name){ return String(name||'Bank export').replace(/\.csv$/i,'').replace(/[_-]+/g,' ').trim() || 'Bank export'; }

function guessMapping(headers){
  const norm=headers.map(normalizeHeader);
  const find=(exact=[], partial=[])=>{
    let idx=norm.findIndex(h=>exact.includes(h));
    if(idx>=0) return headers[idx];
    idx=norm.findIndex(h=>partial.some(t=>h.includes(t)));
    return idx>=0?headers[idx]:'';
  };
  const amount=find(['amount','transactionamount','signedamount','netamount','value'],['amount','amt']);
  const debit=find(['debit','withdrawal','withdrawals','charge','charges','outflow','paidout'],['debit','withdraw','charge','outflow']);
  const credit=find(['credit','deposit','deposits','inflow','paidin'],['credit','deposit','inflow']);
  return {
    date:find(['date','transactiondate','posteddate','postdate','postingdate','authorizeddate','effectiveDate'.toLowerCase()],['date','posted','posting']),
    description:find(['description','merchant','name','payee','memo','details','originaldescription','transactiondescription','narrative'],['description','merchant','payee','memo','details','name']),
    amount:amount && !/creditcard|account/.test(normalizeHeader(amount)) ? amount : '',
    debit,
    credit,
    account:find(['account','accountname','accountnumber','card','cardnumber','source','institution'],['account','card','institution']),
    category:find(['category','classification','spendcategory'],['category','classification'])
  };
}

function translateSavedMapping(saved, headers){
  const byNorm=Object.fromEntries(headers.map(h=>[normalizeHeader(h),h]));
  const out={date:'',description:'',amount:'',debit:'',credit:'',account:'',category:''};
  Object.keys(out).forEach(k=>{ const old=saved?.mapping?.[k]; if(old && byNorm[normalizeHeader(old)]) out[k]=byNorm[normalizeHeader(old)]; });
  return out;
}

function findSavedMapping(headers){
  const list=state.importMappings || [];
  if(!list.length) return null;
  const sig=headerSignature(headers);
  let exact=list.find(m=>m.signature===sig);
  if(exact) return {entry:exact, mapping:translateSavedMapping(exact, headers), exact:true};
  const current=new Set(headers.map(normalizeHeader));
  let best=null;
  for(const m of list){
    const mapped=translateSavedMapping(m,headers);
    const hits=Object.values(mapped).filter(Boolean).length;
    const overlap=(m.headers||[]).map(normalizeHeader).filter(h=>current.has(h)).length;
    const score=hits*2+overlap;
    if(score>=6 && (!best || score>best.score)) best={entry:m,mapping:mapped,score,exact:false};
  }
  return best;
}

function initialMappingFor(headers){
  const guessed=guessMapping(headers);
  const saved=findSavedMapping(headers);
  if(!saved) return {mapping:guessed, saved:null};
  return {mapping:{...guessed,...Object.fromEntries(Object.entries(saved.mapping).filter(([,v])=>v))}, saved:saved.entry};
}

function mappingConfidence(mapping){
  let score=0;
  if(mapping.date) score+=30;
  if(mapping.description) score+=30;
  if(mapping.amount || mapping.debit || mapping.credit) score+=30;
  if(mapping.account) score+=5;
  if(mapping.category) score+=5;
  return Math.min(100,score);
}

function setupImport(){
  const input=document.getElementById('csvInput'); const dz=document.getElementById('dropzone');
  if(!input || !dz) return;
  input.addEventListener('change',e=>handleFiles(e.target.files));
  ['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));
}

async function handleFiles(files){
  const csvs=[...files].filter(f=>/\.csv$/i.test(f.name)||String(f.type||'').includes('csv')||f.type==='text/plain');
  if(!csvs.length){toast('No CSV files found.');return;}
  const parsed=[];
  for(const file of csvs){
    const text=await file.text(); const p=parseCSV(text);
    if(!p.rows.length || !p.headers.length) continue;
    const initMap=initialMappingFor(p.headers);
    parsed.push({
      id:uid('file'), name:file.name, headers:p.headers, rows:p.rows, signature:headerSignature(p.headers),
      mapping:initMap.mapping, savedMappingId:initMap.saved?.id || null, profileName:initMap.saved?.name || stripCsvName(file.name)
    });
  }
  if(!parsed.length){toast('CSV files were empty or unreadable.');return;}
  pendingImport={files:parsed, active:0, summary:null};
  renderMapping(); setStep('stepMap');
  toast(`Loaded ${parsed.length} CSV file${parsed.length>1?'s':''}. Review mapping before accepting.`);
}

function selectImportFile(index){ if(!pendingImport) return; pendingImport.active=Math.max(0,Math.min(index,pendingImport.files.length-1)); renderMapping(); }

function updateActiveProfileName(value){ if(!pendingImport) return; pendingImport.files[pendingImport.active].profileName=String(value||'').trim(); }

function updateImportMapping(key,value){
  if(!pendingImport) return;
  const f=pendingImport.files[pendingImport.active]; f.mapping[key]=value; f.savedMappingId=null;
  invalidateImportSummary(); renderMappingPreview(); renderMappingStatus();
}

function autoDetectActiveMapping(){
  if(!pendingImport) return;
  const f=pendingImport.files[pendingImport.active]; f.mapping=guessMapping(f.headers); f.savedMappingId=null;
  invalidateImportSummary(); renderMapping(); toast('Columns auto-detected again.');
}

function saveMappingForFile(f, silent=false){
  if(!f) return null;
  if(!state.importMappings) state.importMappings=[];
  const now=new Date().toISOString(); const name=(f.profileName || stripCsvName(f.name)).trim();
  let existing=state.importMappings.find(m=>m.id===f.savedMappingId) || state.importMappings.find(m=>m.signature===f.signature && m.name.toLowerCase()===name.toLowerCase()) || state.importMappings.find(m=>m.signature===f.signature);
  const entry={ id: existing?.id || uid('map'), name, signature:f.signature, headers:[...f.headers], mapping:{...f.mapping}, updatedAt:now, createdAt:existing?.createdAt || now, useCount:(existing?.useCount||0)+1 };
  if(existing) state.importMappings=state.importMappings.map(m=>m.id===existing.id?entry:m); else state.importMappings.unshift(entry);
  state.importMappings=state.importMappings.slice(0,30); f.savedMappingId=entry.id; f.profileName=name; saveState();
  if(!silent) toast(`Saved mapping for ${name}.`);
  return entry;
}

function saveActiveMapping(){ if(!pendingImport) return; saveMappingForFile(pendingImport.files[pendingImport.active], false); renderMappingStatus(); }

function renderSavedMappings(){
  const el=document.getElementById('savedMappingsList'); if(!el) return;
  const maps=(state.importMappings||[]).slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  el.innerHTML=maps.length?maps.map(m=>`<div class="mini-item"><div><b>${escapeHtml(m.name||'Bank mapping')}</b><br><span>${(m.headers||[]).length} columns · used ${m.useCount||0} time${(m.useCount||0)===1?'':'s'}${m.updatedAt?` · ${dateFmt(String(m.updatedAt).slice(0,10))}`:''}</span></div><div class="table-actions"><button class="btn btn-small btn-danger" onclick="deleteSavedMapping('${m.id}')">Delete</button></div></div>`).join(''):emptyMini('No saved mappings yet','Save a bank mapping from the import center to reuse it later.');
}

async function deleteSavedMapping(id){ const ok=await mmConfirm('Delete this saved CSV mapping?', {title:'Delete saved mapping?', confirmText:'Delete', danger:true}); if(!ok) return; state.importMappings=(state.importMappings||[]).filter(m=>m.id!==id); toast('Saved mapping deleted.'); renderAll(); }

function invalidateImportSummary(){ if(pendingImport){ pendingImport.summary=null; renderImportSummaryPanel(); setStep('stepMap'); } }

function renderMapping(){
  const empty=document.getElementById('mappingEmpty'), content=document.getElementById('mappingContent');
  if(!empty || !content) return;
  if(!pendingImport){ empty.style.display='grid'; content.style.display='none'; renderImportSummaryPanel(); return; }
  empty.style.display='none'; content.style.display='block';
  const f=pendingImport.files[pendingImport.active]; const headers=f.headers;
  const tabs=document.getElementById('fileTabs');
  if(tabs) tabs.innerHTML=pendingImport.files.map((file,i)=>`<button type="button" class="file-tab ${i===pendingImport.active?'active':''}" onclick="selectImportFile(${i})"><b>${escapeHtml(file.name)}</b><span>${file.rows.length} rows</span></button>`).join('');
  const profile=document.getElementById('mappingProfileName'); if(profile) profile.value=f.profileName || stripCsvName(f.name);
  const fields=[['date','Date'],['description','Description'],['amount','Amount'],['debit','Debit column'],['credit','Credit column'],['account','Account'],['category','Category']];
  document.getElementById('mappingFields').innerHTML=fields.map(([key,label])=>`<div><label>${label}</label><select id="map-${key}" onchange="updateImportMapping('${key}',this.value)"><option value="">None</option>${headers.map(h=>`<option ${f.mapping[key]===h?'selected':''}>${escapeHtml(h)}</option>`).join('')}</select></div>`).join('');
  renderMappingStatus(); renderMappingPreview(); renderImportSummaryPanel();
}

function renderMappingStatus(){
  if(!pendingImport) return;
  const f=pendingImport.files[pendingImport.active]; const el=document.getElementById('mappingStatus'); if(!el) return;
  const confidence=mappingConfidence(f.mapping); const requiredOk=!!(f.mapping.date && f.mapping.description && (f.mapping.amount || f.mapping.debit || f.mapping.credit));
  const profile=f.savedMappingId ? `Saved mapping: ${escapeHtml(f.profileName || stripCsvName(f.name))}` : 'Unsaved mapping';
  const amountMode=f.mapping.amount ? `Amount: ${escapeHtml(f.mapping.amount)}` : (f.mapping.debit || f.mapping.credit) ? `Debit/Credit: ${escapeHtml(f.mapping.debit||'none')} / ${escapeHtml(f.mapping.credit||'none')}` : 'Amount not mapped';
  el.innerHTML=`<div class="mini-item"><div><b>${profile}</b><br><span>${escapeHtml(f.headers.length)} columns detected · ${escapeHtml(amountMode)}</span></div><span class="confidence-pill ${requiredOk?'good':'warn'}">${confidence}% match</span></div>`;
}

function renderMappingPreview(){
  if(!pendingImport) return; const f=pendingImport.files[pendingImport.active];
  const rows=f.rows.slice(0,6).map((r,i)=>mapRow(r,f.mapping,{fileName:f.name,rowNumber:i+2,preview:true}));
  document.getElementById('mappingPreview').innerHTML = rows.length ? rows.map((r,i)=>`<div class="preview-card"><b>Row ${i+1}</b><span>${escapeHtml(r.date||'No date')} · ${escapeHtml(r.description||'No description')}<br>${money(r.amount||0,{cents:true})} · ${escapeHtml(r.account||'General')} · ${escapeHtml(r.category||'Other')}</span></div>`).join('') : `<div class="empty"><div><strong>No preview rows.</strong><p>This CSV has headers but no transaction rows.</p></div></div>`;
}

function parseAmount(v){
  if(v==null||v==='') return 0;
  let s=String(v).trim().replace(/[$,]/g,'').replace(/\s+/g,''); let neg=false;
  if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1);} if(s.endsWith('-')){neg=true;s=s.slice(0,-1);} if(s.startsWith('+')) s=s.slice(1);
  const n=parseFloat(s); return (neg?-1:1)*(isNaN(n)?0:n);
}

function normalizeDate(v){
  const s=String(v||'').trim(); if(!s) return new Date().toISOString().slice(0,10);
  if(/^\d{4}-\d{1,2}-\d{1,2}/.test(s)){ const d=new Date(s); if(!isNaN(d)) return d.toISOString().slice(0,10); }
  const m=s.match(/^(\d{1,2})[\/. -](\d{1,2})[\/. -](\d{2,4})$/);
  if(m){ const y=m[3].length===2?'20'+m[3]:m[3]; return new Date(Number(y),Number(m[1])-1,Number(m[2])).toISOString().slice(0,10); }
  const d=new Date(s); if(!isNaN(d)) return d.toISOString().slice(0,10);
  return new Date().toISOString().slice(0,10);
}

function mapRow(row,map,meta={}){
  let amount = map.amount ? parseAmount(row[map.amount]) : 0;
  if(!amount && (map.debit || map.credit)){ const debit=parseAmount(row[map.debit]); const credit=parseAmount(row[map.credit]); amount = credit ? Math.abs(credit) : debit ? -Math.abs(debit) : 0; }
  const rawDescription=String(row[map.description]||'Unknown merchant').trim() || 'Unknown merchant';
  const tx={ id:uid('tx'), date:normalizeDate(row[map.date]), rawDescription, description:autoMerchantName(rawDescription), amount, account:String(row[map.account]||'General').trim()||'General', category:String(row[map.category]||'Other').trim()||'Other', reviewed:false, hidden:false, notes:'', createdAt:new Date().toISOString(), sourceFile:meta.fileName||'', sourceRow:meta.rowNumber||null, automation:[] };
  applyAutomationToTx(tx,{guess:true});
  return tx;
}

function guessCategory(desc, amount){ const d=String(desc).toUpperCase(); if(amount>0) return 'Income'; if(/PUBLIX|WHOLE|TRADER|COSTCO|GROCERY|MARKET/.test(d)) return 'Groceries'; if(/STARBUCKS|COFFEE|DUNKIN/.test(d)) return 'Coffee'; if(/UBER EATS|DOORDASH|RESTAURANT|CHIPOTLE|TACO|PIZZA|SUSHI/.test(d)) return 'Dining'; if(/SHELL|CHEVRON|EXXON|BP|GAS/.test(d)) return 'Gas'; if(/UBER|LYFT|PARKING|TRANSIT/.test(d)) return 'Transportation'; if(/NETFLIX|SPOTIFY|APPLE.COM|HULU|MAX|DISNEY|ADOBE|PARAMOUNT|PEACOCK|YOUTUBE|GOOGLE STORAGE|ICLOUD/.test(d)) return 'Subscriptions'; if(/AMAZON|TARGET|WALMART|BEST BUY|SHOP/.test(d)) return 'Shopping'; if(/FPL|ELECTRIC|WATER|INTERNET|COMCAST|AT&T|VERIZON|T-MOBILE/.test(d)) return 'Bills'; if(transferDetectionReason({description:desc,rawDescription:desc,amount,category:''})) return 'Transfers'; return 'Other'; }

function canonicalRule(r={}){
  const action = r.action || (r.hide ? (String(r.category||'').toLowerCase()==='transfers' ? 'transfer' : 'hide') : 'categorize');
  const category = action==='transfer' ? 'Transfers' : (r.category || 'Other');
  return {id:r.id||uid('rule'), contains:String(r.contains||'').trim(), category, action, direction:r.direction||'any', hide:action!=='categorize', system:!!r.system, createdAt:r.createdAt||new Date().toISOString()};
}

function ruleDirectionMatches(rule, tx){ const n=Number(tx.amount||0); return rule.direction==='spend'?n<0:rule.direction==='income'?n>0:rule.direction==='zero'?n===0:true; }

function ruleMatchesTx(rule, tx){
  const r=canonicalRule(rule); if(!r.contains || !ruleDirectionMatches(r,tx)) return false;
  const needle=normalizeMerchant(r.contains); const hay=[tx.rawDescription, tx.description, normalizeMerchant(tx.rawDescription||tx.description)].join(' ').toUpperCase();
  return hay.includes(String(r.contains).toUpperCase()) || hay.includes(needle);
}

function applyRuleToTx(tx, rule){
  const r=canonicalRule(rule); if(!ruleMatchesTx(r,tx)) return false;
  tx.ruleId=r.id; tx.reviewed=true; tx.reviewedAt=tx.reviewedAt || new Date().toISOString();
  tx.automation = [...new Set([...(tx.automation||[]),'rule'])];
  if(r.action==='transfer'){ tx.category='Transfers'; tx.hidden=true; tx.hiddenReason=`Rule: ${r.contains}`; }
  else if(r.action==='hide'){ tx.category=r.category||tx.category||'Other'; tx.hidden=true; tx.hiddenReason=`Rule: ${r.contains}`; }
  else { tx.category=r.category||tx.category||'Other'; }
  return true;
}

function transferDetectionReason(tx){
  const d=`${tx.rawDescription||''} ${tx.description||''}`.toUpperCase();
  const cat=String(tx.category||'').toUpperCase();
  if(cat==='TRANSFERS') return 'Category is Transfers';
  const patterns=[
    [/\b(ONLINE|INTERNAL|EXTERNAL|ACH|ACCOUNT|ACCT)?\s*(TRANSFER|XFER)\b/, 'Account transfer'],
    [/\bCREDIT\s*CARD\s*PAYMENT\b|\bCARDMEMBER\s*SERVICES\b|\bPAYMENT\s*THANK\s*YOU\b|\bAUTOPAY\s*PAYMENT\b/, 'Credit-card payment'],
    [/\bTO\s+(SAVINGS|CHECKING|BROKERAGE)\b|\bFROM\s+(SAVINGS|CHECKING|BROKERAGE)\b/, 'Own-account movement'],
    [/\bPAYPAL\b.*\bTRANSFER\b|\bVENMO\b.*\bCASH\s*OUT\b|\bZELLE\b.*\bTRANSFER\b/, 'Peer transfer']
  ];
  const hit=patterns.find(([rx])=>rx.test(d));
  return hit ? hit[1] : '';
}

function applyTransferDetection(tx){
  if(!state.automation?.transferDetection) return false;
  const reason=transferDetectionReason(tx); if(!reason) return false;
  tx.category='Transfers'; tx.hidden=true; tx.hiddenReason=reason; tx.reviewed=true; tx.reviewedAt=tx.reviewedAt || new Date().toISOString(); tx.automation=[...new Set([...(tx.automation||[]),'transfer'])]; return true;
}

function applyAutomationToTx(tx, opts={}){
  tx.automation = tx.automation || [];
  let ruleApplied=false;
  if(opts.rules!==false){ for(const rule of (state.rules||[])){ if(applyRuleToTx(tx,rule)){ ruleApplied=true; break; } } }
  const transferApplied = !ruleApplied && opts.transfer!==false ? applyTransferDetection(tx) : false;
  if(opts.guess!==false && (!tx.category || tx.category==='Other')) tx.category=guessCategory(tx.rawDescription || tx.description, tx.amount);
  return {ruleApplied, transferApplied};
}

function applyRules(tx){ return applyAutomationToTx(tx,{guess:false}).ruleApplied; }

function validateImportMappings(){
  if(!pendingImport) return [];
  return pendingImport.files.filter(f=>!(f.mapping.date && f.mapping.description && (f.mapping.amount || f.mapping.debit || f.mapping.credit))).map(f=>f.name);
}

function buildImportSummary(){
  const existing=new Set(state.transactions.map(hashTx)); const seen=new Set();
  const transactions=[]; const duplicateSamples=[]; const warnings=[]; const filesSummary=[];
  for(const f of pendingImport.files){
    let rows=0, added=0, dupes=0, zeroAmounts=0, unknownMerchants=0, autoHidden=0, ruleApplied=0, transfers=0;
    f.rows.forEach((row,idx)=>{
      rows++;
      const tx=mapRow(row,f.mapping,{fileName:f.name,rowNumber:idx+2}); const hash=hashTx(tx); tx.importHash=hash;
      if(!Number(tx.amount)) zeroAmounts++;
      if(!tx.description || tx.description==='Unknown merchant') unknownMerchants++;
      if(tx.hidden) autoHidden++;
      if((tx.automation||[]).includes('rule')) ruleApplied++;
      if((tx.automation||[]).includes('transfer') || tx.category==='Transfers') transfers++;
      if(existing.has(hash) || seen.has(hash)){
        dupes++; if(duplicateSamples.length<8) duplicateSamples.push({file:f.name, row:idx+2, tx});
      } else {
        seen.add(hash); transactions.push({file:f.name,row:idx+2,tx}); added++;
      }
    });
    if(zeroAmounts) warnings.push(`${f.name}: ${zeroAmounts} row${zeroAmounts===1?'':'s'} have a zero or unread amount.`);
    if(unknownMerchants) warnings.push(`${f.name}: ${unknownMerchants} row${unknownMerchants===1?'':'s'} have no mapped description.`);
    filesSummary.push({name:f.name, rows, added, dupes, zeroAmounts, autoHidden, ruleApplied, transfers, profileName:f.profileName || stripCsvName(f.name)});
  }
  const totals=filesSummary.reduce((a,f)=>({rows:a.rows+f.rows, added:a.added+f.added, dupes:a.dupes+f.dupes, zeroAmounts:a.zeroAmounts+f.zeroAmounts, autoHidden:a.autoHidden+f.autoHidden, ruleApplied:a.ruleApplied+f.ruleApplied, transfers:a.transfers+f.transfers}),{rows:0,added:0,dupes:0,zeroAmounts:0,autoHidden:0,ruleApplied:0,transfers:0});
  return {createdAt:new Date().toISOString(), filesSummary, totals, transactions, duplicateSamples, warnings};
}

function prepareImportSummary(){
  if(!pendingImport) return;
  const missing=validateImportMappings();
  if(missing.length){ toast(`Finish required mapping for: ${missing.slice(0,2).join(', ')}${missing.length>2?'...':''}`); return; }
  pendingImport.summary=buildImportSummary(); setStep('stepClean'); renderImportSummaryPanel();
  toast(`Review ready: ${pendingImport.summary.totals.added} new, ${pendingImport.summary.totals.dupes} duplicates.`);
}

function renderImportSummaryPanel(){
  const el=document.getElementById('importSummary'); const btn=document.getElementById('acceptImportBtn');
  if(!el) return;
  const summary=pendingImport?.summary;
  if(btn){ btn.disabled=!summary; btn.classList.toggle('btn-disabled', !summary); }
  if(!pendingImport){ el.innerHTML=''; return; }
  if(!summary){ el.className='import-summary placeholder'; el.innerHTML='<div><strong>Review step pending.</strong><p>Confirm the mapping, then click Review import to see new rows, duplicates, warnings, and a sample before accepting.</p></div>'; return; }
  el.className='import-summary';
  const sample=summary.transactions.slice(0,6).map(x=>x.tx);
  const filesHtml=summary.filesSummary.length ? `<div><h4>File breakdown</h4><div class="mini-list">${summary.filesSummary.map(f=>`<div class="mini-item"><div><b>${escapeHtml(f.name)}</b><br><span>${f.rows} rows · ${f.added} new · ${f.dupes} duplicate${f.dupes===1?'':'s'} · ${f.ruleApplied||0} rule hits · ${f.transfers||0} transfers · mapping: ${escapeHtml(f.profileName||'Bank export')}</span></div><span>${f.zeroAmounts?`${f.zeroAmounts} check`: 'Ready'}</span></div>`).join('')}</div></div>` : '';
  const duplicateHtml=summary.duplicateSamples.length ? `<div><h4>Duplicate samples</h4><div class="mini-list">${summary.duplicateSamples.map(d=>`<div class="mini-item"><div><b>${escapeHtml(d.tx.description)}</b><br><span>${escapeHtml(d.file)} row ${d.row} · ${dateFmt(d.tx.date)} · ${money(d.tx.amount,{cents:true})}</span></div><span>Skipped</span></div>`).join('')}</div></div>` : '';
  const warningHtml=summary.warnings.length ? `<div><h4>Warnings</h4><div class="mini-list">${summary.warnings.slice(0,5).map(w=>`<div class="mini-item"><div><b>Check mapping</b><br><span>${escapeHtml(w)}</span></div><span class="warn">Review</span></div>`).join('')}</div></div>` : '';
  el.innerHTML=`<div><h4>Import summary</h4><p class="card-subtitle">Review these totals before accepting the batch.</p></div><div class="import-summary-grid"><div class="import-stat"><span>Files</span><b>${summary.filesSummary.length}</b></div><div class="import-stat"><span>Rows</span><b>${summary.totals.rows}</b></div><div class="import-stat"><span>New</span><b class="good">${summary.totals.added}</b></div><div class="import-stat"><span>Duplicates</span><b class="gold">${summary.totals.dupes}</b></div><div class="import-stat"><span>Auto-hidden</span><b class="purple">${summary.totals.autoHidden}</b></div><div class="import-stat"><span>Rules</span><b class="blue">${summary.totals.ruleApplied}</b></div></div>${filesHtml}<div class="table-wrap summary-table"><table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Source</th><th class="right">Amount</th></tr></thead><tbody>${sample.length?sample.map(t=>`<tr><td>${dateFmt(t.date)}</td><td><b>${escapeHtml(t.description)}</b></td><td>${escapeHtml(t.category)}</td><td>${escapeHtml(t.sourceFile||'CSV')}</td><td class="amount-cell ${Number(t.amount)<0?'bad':'good'}">${money(t.amount,{cents:true})}</td></tr>`).join(''):`<tr><td colspan="5"><div class="empty"><div><strong>No new transactions.</strong><p>Every row appears to be a duplicate of existing data or another selected file.</p></div></div></td></tr>`}</tbody></table></div>${duplicateHtml}${warningHtml}`;
}

function commitImport(){
  if(!pendingImport) return;
  if(!pendingImport.summary){ prepareImportSummary(); return; }
  setStep('stepDone');
  const now=new Date().toISOString(); const batchId=uid('imp'); const existing=new Set(state.transactions.map(hashTx));
  const transactionIds=[]; let guardDupes=0;
  pendingImport.summary.transactions.forEach(item=>{
    const tx={...item.tx, id:item.tx.id || uid('tx'), importBatchId:batchId, importedAt:now};
    const h=hashTx(tx);
    if(existing.has(h)){ guardDupes++; return; }
    existing.add(h); transactionIds.push(tx.id); state.transactions.push(tx);
  });
  pendingImport.files.forEach(f=>saveMappingForFile(f,true));
  const summary=pendingImport.summary; const dupes=summary.totals.dupes + guardDupes;
  state.imports.unshift({id:batchId, file:summary.filesSummary.map(f=>f.name).join(', '), files:summary.filesSummary, date:now, rows:summary.totals.rows, added:transactionIds.length, dupes, transactionIds, mappings:summary.filesSummary.map(f=>f.profileName)});
  state.imports=state.imports.slice(0,30); pendingImport=null; state.settings.firstRunComplete=true;
  const merchantCleaned = autoCleanAllMerchants({toast:false});
  saveState(); renderMapping(); detectRecurring(true); renderImportHistory(); toast(`Imported ${transactionIds.length} transactions. Skipped ${dupes} duplicates. Cleaned ${merchantCleaned} merchant name${merchantCleaned===1?'':'s'}.`); showView('review');
}

function clearPendingImport(){ pendingImport=null; renderMapping(); setStep('stepFile'); const input=document.getElementById('csvInput'); if(input) input.value=''; }

function undoImport(id){
  const rec=state.imports.find(i=>i.id===id) || state.imports[0];
  if(!rec || !rec.transactionIds || !rec.transactionIds.length){ toast('This import cannot be undone because it has no transaction list.'); return; }
  const ids=new Set(rec.transactionIds); const before=state.transactions.length;
  state.transactions=state.transactions.filter(t=>!ids.has(t.id)); state.imports=state.imports.filter(i=>i.id!==rec.id);
  detectRecurring(false); saveState(); renderAll(); toast(`Undid import. Removed ${before-state.transactions.length} transactions.`);
}

function renderImportHistory(){
  const el=document.getElementById('importHistory'); if(!el) return; document.getElementById('ruleCountImport').textContent=`${state.rules.length} rules`;
  const savedCount=(state.importMappings||[]).length; const history=state.imports.slice(0,8);
  el.innerHTML=history.length?history.map((i,idx)=>{ const canUndo=Array.isArray(i.transactionIds)&&i.transactionIds.length; const fileLabel=i.files?.length?`${i.files.length} file${i.files.length>1?'s':''}`:escapeHtml(i.file||'CSV import'); return `<div class="mini-item"><div><b>${fileLabel}</b><br><span>${new Date(i.date).toLocaleString()} · ${i.rows||0} rows · ${i.added||0} added · ${i.dupes||0} dupes${savedCount?` · ${savedCount} saved mappings`:''}</span></div>${idx===0&&canUndo?`<button class="btn btn-small" onclick="undoImport('${i.id}')">Undo</button>`:`<span>${canUndo?'Undoable':'Locked'}</span>`}</div>`; }).join(''):emptyMini('No imports yet','CSV batches, duplicate counts, and undo options will appear here.','Choose CSV','document.getElementById(\'csvInput\')?.click()');
}

function startWeeklyReview(){ showView('review'); reviewIndex=0; renderReview(); }

function reviewScopeValue(){ return document.getElementById('reviewScope')?.value || 'all'; }

function reviewSearchValue(){ return document.getElementById('reviewSearch')?.value?.toLowerCase().trim() || ''; }

function reviewCandidates(){
  const q=reviewSearchValue(); const scope=reviewScopeValue();
  return state.transactions.filter(t=>{
    if(t.reviewed) return false;
    if(scope==='week' && !inCurrentWeek(t.date)) return false;
    if(scope==='month' && monthKey(t.date)!==currentMonth()) return false;
    if(scope==='uncategorized' && !['Other','Uncategorized',''].includes(t.category||'')) return false;
    const hay=`${t.description} ${t.rawDescription||''} ${t.category} ${t.account}`.toLowerCase();
    if(q && !q.split(/\s+/).every(term=>hay.includes(term))) return false;
    return true;
  }).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

function weeklySummaryStats(){
  const week=state.transactions.filter(t=>inCurrentWeek(t.date) && !t.hidden);
  const prevStart=startOfWeek(); prevStart.setDate(prevStart.getDate()-7); const prevEnd=new Date(prevStart); prevEnd.setDate(prevStart.getDate()+7);
  const prev=state.transactions.filter(t=>{ const d=new Date(String(t.date||'')+'T00:00:00'); return !t.hidden && !isNaN(d) && d>=prevStart && d<prevEnd; });
  const spend=spendingFor(week); const income=incomeFor(week); const prevSpend=spendingFor(prev); const unreviewedWeek=week.filter(t=>!t.reviewed).length;
  const top=byCategory(week)[0] || ['No spend',0]; const delta=prevSpend?spend-prevSpend:0;
  return {week,spend,income,prevSpend,delta,unreviewedWeek,top};
}

function renderWeeklySummary(){
  const el=document.getElementById('weeklyReviewSummary'); if(!el) return; const s=weeklySummaryStats();
  const deltaText=s.prevSpend?`${s.delta>=0?'+':''}${money(s.delta)} vs last week`:'No previous week yet';
  el.innerHTML=`<button type="button" class="week-card click-card" onclick="setReviewScope('week')"><div class="metric-label">This week spent</div><div class="metric-value bad">${money(s.spend)}</div><div class="metric-sub">${escapeHtml(displayWeekRange())}</div></button><button type="button" class="week-card click-card" onclick="setReviewScope('week')"><div class="metric-label">Needs review</div><div class="metric-value gold">${s.unreviewedWeek}</div><div class="metric-sub">Unreviewed items this week</div></button><button type="button" class="week-card click-card" onclick="showCategoryTransactions('${escapeJs(s.top[0])}')"><div class="metric-label">Top category</div><div class="metric-value blue">${money(s.top[1])}</div><div class="metric-sub">${escapeHtml(s.top[0])}</div></button><div class="week-card"><div class="metric-label">Week change</div><div class="metric-value ${s.delta>0?'warn':'good'}">${s.prevSpend?money(Math.abs(s.delta)):'—'}</div><div class="metric-sub">${escapeHtml(deltaText)}</div></div>`;
}

function setReviewScope(scope){ const sel=document.getElementById('reviewScope'); if(sel) sel.value=scope; reviewIndex=0; renderReview(); }

function currentReviewTx(){ const cand=reviewCandidates(); if(reviewIndex>=cand.length) reviewIndex=0; return cand[reviewIndex] || null; }

function renderReview(){
  renderWeeklySummary();
  const q=document.getElementById('reviewQueue'); if(!q) return; const cand=reviewCandidates(); const allUnreviewed=state.transactions.filter(t=>!t.reviewed); const weekUnreviewed=state.transactions.filter(t=>!t.reviewed && inCurrentWeek(t.date)); const stats=document.getElementById('reviewStats');
  if(stats) stats.innerHTML=`<div class="mini-item"><b>In current view</b><span>${cand.length}</span></div><div class="mini-item"><b>This week</b><span>${weekUnreviewed.length}</span></div><div class="mini-item"><b>All waiting</b><span>${allUnreviewed.length}</span></div><div class="mini-item"><b>Rules</b><span>${state.rules.length}</span></div>`;
  if(!cand.length){ q.innerHTML=`<div class="empty"><div><strong>Everything in this queue is reviewed.</strong><p>${allUnreviewed.length?'Change the review filter to see the remaining transactions.':'You are clear for the week.'}</p><div class="review-empty-actions"><button class="btn btn-primary" onclick="showView('import')">Import more</button><button class="btn" onclick="setReviewScope('all')">Show all waiting</button></div></div></div>`; return; }
  if(reviewIndex>=cand.length) reviewIndex=0; const t=cand[reviewIndex]; const cleaned=cleanMerchantName(t.rawDescription || t.description); const changed=cleaned!==t.description;
  const pct=Math.round(((reviewIndex+1)/cand.length)*100);
  q.innerHTML=`<div class="review-transaction"><p class="review-merchant">${escapeHtml(t.description)}</p><div class="review-meta"><span>${dateFmt(t.date)}</span><span>·</span><span>${escapeHtml(t.account||'General')}</span><span>·</span><span>${reviewIndex+1} of ${cand.length}</span><span>·</span><span>${escapeHtml(t.category||'Other')}</span></div><div class="review-amount ${Number(t.amount)<0?'bad':'good'}">${money(t.amount)}</div><div class="review-progress-label"><span>Queue progress</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div><div class="merchant-preview"><span class="cleanup-badge">Merchant cleanup</span><br>${t.rawDescription?`Raw import: ${escapeHtml(t.rawDescription)}<br>`:''}Suggested display: <b>${escapeHtml(cleaned)}</b></div><div class="review-merchant-line"><div><label>Merchant display name</label><input class="input" id="reviewMerchantInput" value="${escapeHtml(t.description)}" onkeydown="if(event.key==='Enter') saveReviewMerchant('${t.id}')" /></div><button class="btn" onclick="${changed?`cleanTxMerchant('${t.id}')`:`saveReviewMerchant('${t.id}')`}">${changed?'Use clean name':'Save name'}</button></div><label>One-click category</label><div class="category-grid">${CATEGORIES.filter(c=>c!=='Income'||Number(t.amount)>0).slice(0,16).map(c=>`<button class="cat-btn ${c===(t.category||'Other')?'active':''}" onclick="reviewSetCategory('${t.id}','${escapeJs(c)}')">${escapeHtml(c)}</button>`).join('')}</div><div class="hero-row"><button class="btn btn-primary" onclick="approveTx('${t.id}')">Approve ${escapeHtml(t.category||'Other')}</button><button class="btn" onclick="createRuleForTx('${t.id}')">Create rule</button><button class="btn" onclick="hideTx('${t.id}')">Hide transfer</button><button class="btn" onclick="createHideRuleForTx('${t.id}')">Hide like this</button><button class="btn" onclick="skipReview()">Skip</button></div></div>`;
}

function reviewSetCategory(id,cat){ const t=state.transactions.find(x=>x.id===id); if(t){t.category=cat;t.hidden=cat==='Transfers'?true:t.hidden;t.hiddenReason=cat==='Transfers'?'Manual transfer category':t.hiddenReason;t.reviewed=true;t.reviewedAt=new Date().toISOString();recordCategoryEdit(t,cat,'review');saveState();reviewIndex=0;renderAll();maybeToastRuleSuggestion(t,cat);} }

function approveTx(id){ const t=state.transactions.find(x=>x.id===id); if(t){t.reviewed=true;t.reviewedAt=new Date().toISOString();saveState();reviewIndex=0;renderAll();} }

function approveCurrentWeek(){ const items=state.transactions.filter(t=>!t.reviewed && inCurrentWeek(t.date)); items.forEach(t=>{t.reviewed=true;t.reviewedAt=new Date().toISOString();}); toast(items.length?`Approved ${items.length} transaction${items.length===1?'':'s'} for this week.`:'No current-week transactions need review.'); renderAll(); if(items.length) confetti(); }

function approveAllReviewed(){ const items=visibleTransactions().filter(t=>!t.reviewed); items.forEach(t=>{t.reviewed=true;t.reviewedAt=new Date().toISOString();}); toast(items.length?`Approved ${items.length} visible transaction${items.length===1?'':'s'}.`:'No visible transactions needed approval.'); renderAll(); }

function skipReview(){ reviewIndex++; renderReview(); }

function hideTx(id){ const t=state.transactions.find(x=>x.id===id); if(t){t.hidden=true;t.category='Transfers';t.hiddenReason='Manually hidden as transfer';t.reviewed=true;t.reviewedAt=new Date().toISOString();saveState();renderAll();} }

function saveReviewMerchant(id){ const t=state.transactions.find(x=>x.id===id); const val=document.getElementById('reviewMerchantInput')?.value?.trim(); if(t && val){ t.description=val; if(t.rawDescription || merchantLooksMessy(t.description)) upsertMerchantRenameRule(t.rawDescription || t.description, val, 'manual'); saveState(); toast('Merchant name updated and remembered.'); renderAll(); } }

function applyMerchantCleanupToTransactions(txns,label='merchant name'){
  let count=0;
  (txns||[]).forEach(t=>{
    const source=t.rawDescription || t.description;
    const next=autoMerchantName(source);
    if(next && next!==t.description){
      if(!t.rawDescription) t.rawDescription=t.description;
      t.description=next;
      count++;
    }
  });
  if(count) saveState();
  toast(count?`Cleaned ${count} ${label}${count===1?'':'s'}.`:`${label.charAt(0).toUpperCase()+label.slice(1)}s already look clean.`);
  renderAll();
  return count;
}

function cleanTxMerchant(id){ const t=state.transactions.find(x=>x.id===id); if(!t) return; applyMerchantCleanupToTransactions([t],'merchant name'); }

function cleanVisibleMerchants(){ return applyMerchantCleanupToTransactions(visibleTransactions(),'visible merchant name'); }

function cleanReviewQueueMerchants(){ return applyMerchantCleanupToTransactions(reviewCandidates(),'review queue merchant name'); }

function cleanAllMerchants(){ return autoCleanAllMerchants({force:true}); }

function suggestRuleContains(tx){ return normalizeMerchant(tx.rawDescription || tx.description).split(' ').filter(Boolean).slice(0,3).join(' ') || cleanMerchantName(tx.description); }

function createRuleForTx(id){ const t=state.transactions.find(x=>x.id===id); if(!t) return; showView('rules'); requestAnimationFrame(()=>{ const contains=document.getElementById('ruleContains'), cat=document.getElementById('ruleCategory'), action=document.getElementById('ruleAction'), dir=document.getElementById('ruleDirection'); if(contains) contains.value=suggestRuleContains(t); if(cat) cat.value=t.category||'Other'; if(action) action.value=t.hidden||t.category==='Transfers'?'transfer':'categorize'; if(dir) dir.value=Number(t.amount)<0?'spend':Number(t.amount)>0?'income':'any'; syncRuleFormAction(); }); toast('Rule draft filled from transaction.'); }

function createHideRuleForTx(id){ const t=state.transactions.find(x=>x.id===id); if(!t) return; const contains=suggestRuleContains(t); state.rules.unshift(canonicalRule({id:uid('rule'), contains, category:'Transfers', action:'transfer', direction:'any', createdBy:'review'})); state.transactions.forEach(tx=>applyAutomationToTx(tx,{guess:false})); saveState(); toast(`Hide rule added for ${contains}.`); renderAll(); }

function maybeToastRuleSuggestion(tx,cat){ const key=normalizeMerchant(tx.rawDescription||tx.description); const entry=state.categoryStatus?.[key]; if(entry && (entry.categories?.[cat]||0)>=2 && !ruleExistsForContains(entry.contains||suggestRuleContains(tx))){ toast('Rule suggestion available on the Rules page.'); } }

function upcomingRecurringItems(limit=5){
  const base=detectRecurring(false).filter(r=>r.status!=='cancel').slice().sort((a,b)=>Number(b.monthly||0)-Number(a.monthly||0));
  const now=new Date();
  return base.slice(0,limit).map((r,i)=>{
    const last=new Date(String(r.lastDate||dateKey(now))+'T00:00:00');
    const next=new Date(last);
    if((r.frequency||'monthly')==='weekly') next.setDate(last.getDate()+7);
    else if((r.frequency||'monthly')==='annual') next.setFullYear(last.getFullYear()+1);
    else next.setMonth(last.getMonth()+1);
    if(next<now){
      if((r.frequency||'monthly')==='weekly') while(next<now) next.setDate(next.getDate()+7);
      else if((r.frequency||'monthly')==='annual') while(next<now) next.setFullYear(next.getFullYear()+1);
      else while(next<now) next.setMonth(next.getMonth()+1);
    }
    return {...r,nextDate:dateKey(next),daysUntil:Math.ceil((next-now)/(1000*60*60*24))};
  });
}

function subscriptionKey(tx){ return cleanMerchantName(tx.rawDescription || tx.description).replace(/\b(Subscription|Recurring)\b/gi,'').trim() || normalizeMerchant(tx.rawDescription||tx.description); }

function detectRecurring(force){
  if(!state.automation?.subscriptionDetection && !force) return state.recurring||[];
  const existingByMerchant=Object.fromEntries((state.recurring||[]).map(r=>[r.merchant,r]));
  const groups={}; state.transactions.filter(t=>Number(t.amount)<0&&!t.hidden&&t.category!=='Transfers').forEach(t=>{ const key=subscriptionKey(t); if(!groups[key]) groups[key]=[]; groups[key].push(t); });
  const rec=[];
  Object.entries(groups).forEach(([merchant,items])=>{
    if(items.length<2) return; items.sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const amounts=items.map(t=>Math.abs(Number(t.amount))).filter(Boolean); const med=median(amounts); if(!med) return;
    const close=amounts.filter(a=>Math.abs(a-med)<=Math.max(3,med*.16)).length; if(close<2) return;
    const days=[]; for(let i=1;i<items.length;i++){ const diff=(new Date(items[i].date)-new Date(items[i-1].date))/(1000*60*60*24); if(Number.isFinite(diff)&&diff>0) days.push(diff); }
    const avgGap=days.length?days.reduce((a,b)=>a+b,0)/days.length:30; let frequency='recurring', monthly=med;
    if(days.some(d=>d>=24&&d<=38) || (items.length>=3 && avgGap>=22 && avgGap<=42)){ frequency='monthly'; monthly=med; }
    else if(days.some(d=>d>=6&&d<=9) || (items.length>=4 && avgGap>=5 && avgGap<=10)){ frequency='weekly'; monthly=med*4.33; }
    else if(days.some(d=>d>=340&&d<=390)){ frequency='annual'; monthly=med/12; }
    else if(items.length>=3){ frequency='recurring'; monthly=med; }
    else return;
    const confidence=Math.min(98,Math.round(45 + close/items.length*30 + Math.min(20,items.length*5) + (frequency==='monthly'?8:0)));
    const existing=existingByMerchant[merchant];
    rec.push({id:existing?.id||uid('rec'),merchant,monthly,lastAmount:amounts[amounts.length-1],lastDate:items[items.length-1].date,count:items.length,status:existing?.status||'keep',category:items[0].category||'Subscriptions',frequency,confidence});
  });
  state.recurring=rec.sort((a,b)=>b.monthly-a.monthly); if(force){saveState();toast(`Detected ${rec.length} recurring charge${rec.length===1?'':'s'}.`)} return rec;
}

function renderRecurring(){
  const list=document.getElementById('recurringList'); if(!list) return; const rec=state.recurring; const monthly=rec.filter(r=>r.status!=='cancel').reduce((a,r)=>a+Number(r.monthly||0),0); const cuts=rec.filter(r=>r.status==='review'||r.status==='cancel').reduce((a,r)=>a+Number(r.monthly||0),0);
  document.getElementById('recMonthly').textContent=money(monthly); document.getElementById('recAnnual').textContent=money(monthly*12); document.getElementById('recCount').textContent=rec.length; document.getElementById('recCuts').textContent=money(cuts);
  list.innerHTML=rec.length?rec.map(r=>`<div class="mini-item"><div><b>${escapeHtml(r.merchant)}</b><br><span>${money(r.monthly,{cents:true})}/mo estimate · last ${dateFmt(r.lastDate)}</span><div class="recurring-meta"><span class="rule-chip">${escapeHtml(r.frequency||'recurring')}</span><span class="rule-chip">${r.count} hits</span><span class="confidence-pill ${Number(r.confidence)>=75?'good':'warn'}">${r.confidence||60}%</span></div></div><div class="rule-card-actions"><select onchange="setRecurringStatus('${r.id}',this.value)"><option ${r.status==='keep'?'selected':''} value="keep">Keep</option><option ${r.status==='review'?'selected':''} value="review">Review</option><option ${r.status==='cancel'?'selected':''} value="cancel">Cancel target</option></select><button class="btn btn-small" onclick="createSubscriptionRule('${escapeJs(r.merchant)}')">Rule</button></div></div>`).join(''):emptyMini('No recurring charges detected','Import at least two months of transactions for better detection.','Import CSV','showView(\'import\')');
}

function setRecurringStatus(id,status){ const r=state.recurring.find(x=>x.id===id); if(r){r.status=status;saveState();renderAll();} }

function createSubscriptionRule(merchant){ if(ruleExistsForContains(merchant)){ toast('A matching rule already exists.'); return; } state.rules.unshift(canonicalRule({id:uid('rule'),contains:merchant,category:'Subscriptions',action:'categorize',direction:'spend'})); state.transactions.forEach(tx=>applyAutomationToTx(tx,{guess:false})); saveState(); toast('Subscription rule added.'); renderAll(); }

function syncRuleFormAction(){ const action=document.getElementById('ruleAction')?.value; const cat=document.getElementById('ruleCategory'); if(action==='transfer' && cat) cat.value='Transfers'; }

function ruleActionLabel(r){ const rule=canonicalRule(r); return rule.action==='transfer'?'Mark transfer + hide':rule.action==='hide'?'Set category + hide':'Set category'; }

function ruleExistsForContains(contains){ const target=normalizeMerchant(contains); return (state.rules||[]).some(r=>{ const c=normalizeMerchant(r.contains); return c===target || c.includes(target) || target.includes(c); }); }

function renderRules(){
  const list=document.getElementById('rulesList'); const sug=document.getElementById('suggestedRulesList'); const stats=document.getElementById('automationStats'); if(!list) return;
  const rules=(state.rules||[]).map(canonicalRule); const suggestions=state.automation?.ruleSuggestions ? suggestedRules() : [];
  list.innerHTML=rules.length?rules.map(r=>`<div class="mini-item"><div><b>If description contains “${escapeHtml(r.contains)}”</b><br><span>${escapeHtml(ruleActionLabel(r))} · Category: ${escapeHtml(r.category)} · ${escapeHtml(r.direction==='any'?'any amount':r.direction)}</span><div class="recurring-meta"><span class="rule-chip">${r.system?'starter':'custom'}</span>${r.hide?'<span class="rule-chip">hidden</span>':''}</div></div><div class="rule-card-actions"><button class="btn btn-small" onclick="moveRule('${r.id}',-1)">↑</button><button class="btn btn-small" onclick="moveRule('${r.id}',1)">↓</button><button class="btn btn-small btn-danger" onclick="deleteRule('${r.id}')">Delete</button></div></div>`).join(''):emptyMini('No rules','Create merchant rules to automate imports.','Focus rule','document.getElementById(\'ruleContains\')?.focus()');
  if(sug) sug.innerHTML=suggestions.length?suggestions.map(s=>`<div class="mini-item"><div><span class="suggestion-source">${escapeHtml(s.source)}</span><br><b>${escapeHtml(s.contains)} → ${escapeHtml(s.category)}</b><br><span>${s.count} matching transaction${s.count===1?'':'s'} · ${Math.round(s.confidence)}% confidence</span></div><div class="rule-card-actions"><button class="btn btn-small btn-primary" onclick="addSuggestedRule('${escapeJs(s.contains)}','${escapeJs(s.category)}','${escapeJs(s.action)}','${escapeJs(s.direction)}')">Accept</button><button class="btn btn-small" onclick="showCategoryTransactions('${escapeJs(s.category)}')">Review</button></div></div>`).join(''):emptyMini(state.automation?.ruleSuggestions?'No suggestions yet':'Suggestions off',state.automation?.ruleSuggestions?'Suggestions appear after repeated edits or repeated merchants with consistent categories.':'Turn suggestions on to see repeated merchant patterns.','Review queue','showView(\'review\')');
  if(stats){ const transferCandidates=state.transactions.filter(t=>transferDetectionReason(t)).length; const hiddenTransfers=state.transactions.filter(t=>t.hidden&&t.category==='Transfers').length; const recurring=(state.recurring||[]).length; stats.innerHTML=`<div class="automation-grid"><div class="automation-stat"><span>Rules</span><b>${rules.length}</b></div><div class="automation-stat"><span>Hidden transfers</span><b>${hiddenTransfers}</b></div><div class="automation-stat"><span>Subscriptions</span><b>${recurring}</b></div></div><div class="mini-item"><div><b>Transfer detection</b><br><span>${transferCandidates} likely transfer${transferCandidates===1?'':'s'} found in transaction history</span></div><button class="btn btn-small ${state.automation.transferDetection?'selected':''}" onclick="toggleAutomationSetting('transferDetection')">${state.automation.transferDetection?'On':'Off'}</button></div><div class="mini-item"><div><b>Subscription detection</b><br><span>Recurring charge detection from repeated merchants and similar amounts</span></div><button class="btn btn-small ${state.automation.subscriptionDetection?'selected':''}" onclick="toggleAutomationSetting('subscriptionDetection')">${state.automation.subscriptionDetection?'On':'Off'}</button></div><div class="mini-item"><div><b>Rule suggestions</b><br><span>Suggests merchant rules after repeated edits</span></div><button class="btn btn-small ${state.automation.ruleSuggestions?'selected':''}" onclick="toggleAutomationSetting('ruleSuggestions')">${state.automation.ruleSuggestions?'On':'Off'}</button></div><div class="mini-item"><div><b>Merchant cleanup</b><br><span>${(state.merchantRules||[]).length} learned rename rule${(state.merchantRules||[]).length===1?'':'s'} apply during import</span></div><div class="rule-card-actions"><button class="btn btn-small ${state.automation.merchantCleanup?'selected':''}" onclick="toggleMerchantCleanup()">${state.automation.merchantCleanup?'On':'Off'}</button><button class="btn btn-small" onclick="autoCleanAllMerchants({force:true})">Run now</button></div></div>`; }
}

function addRuleFromForm(){ const contains=document.getElementById('ruleContains').value.trim(); const action=document.getElementById('ruleAction')?.value||'categorize'; const direction=document.getElementById('ruleDirection')?.value||'any'; const category=(action==='transfer'?'Transfers':document.getElementById('ruleCategory').value.trim()||'Other'); if(!contains){toast('Add matching text first.');return;} state.rules.unshift(canonicalRule({id:uid('rule'),contains,category,action,direction,createdBy:'user'})); document.getElementById('ruleContains').value=''; document.getElementById('ruleCategory').value=''; if(document.getElementById('ruleAction')) document.getElementById('ruleAction').value='categorize'; if(document.getElementById('ruleDirection')) document.getElementById('ruleDirection').value='any'; saveState(); toast('Rule added.'); renderAll(); }

function addSuggestedRule(contains,category,action='categorize',direction='spend'){ if(ruleExistsForContains(contains)){ toast('A matching rule already exists.'); return; } state.rules.unshift(canonicalRule({id:uid('rule'),contains,category,action,direction,createdBy:'suggestion'})); state.transactions.forEach(tx=>applyAutomationToTx(tx,{guess:false})); saveState(); toast('Suggested rule accepted.'); renderAll(); }

async function deleteRule(id){ const ok=await mmConfirm('Delete this automation rule?', {title:'Delete rule?', confirmText:'Delete', danger:true}); if(!ok) return; state.rules=state.rules.filter(r=>r.id!==id); saveState(); renderAll(); }

function moveRule(id,dir){ const i=state.rules.findIndex(r=>r.id===id); if(i<0) return; const j=Math.max(0,Math.min(state.rules.length-1,i+dir)); const [r]=state.rules.splice(i,1); state.rules.splice(j,0,r); saveState(); renderAll(); }

function suggestedRules(){
  const out=[]; const add=(s)=>{ if(!s.contains || !s.category || ['Other','Income','Transfers',''].includes(s.category)) return; if(ruleExistsForContains(s.contains)) return; if(out.some(x=>normalizeMerchant(x.contains)===normalizeMerchant(s.contains))) return; out.push(s); };
  Object.values(state.categoryStatus||{}).forEach(e=>{ const cats=e.categories||{}; const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]; if(top && top[1]>=2) add({contains:e.contains,category:top[0],action:'categorize',direction:'spend',count:top[1],confidence:Math.min(95,68+top[1]*8),source:'Repeated edits'}); });
  const groups={}; state.transactions.filter(t=>!t.hidden && Number(t.amount)<0).forEach(t=>{ const key=normalizeMerchant(t.rawDescription||t.description); if(!groups[key]) groups[key]=[]; groups[key].push(t); });
  Object.values(groups).forEach(items=>{ if(items.length<2) return; const cats={}; items.forEach(t=>cats[t.category||'Other']=(cats[t.category||'Other']||0)+1); const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]; const share=top?top[1]/items.length:0; if(top && top[1]>=2 && share>=.75){ const tx=items[0]; add({contains:suggestRuleContains(tx),category:top[0],action:'categorize',direction:'spend',count:items.length,confidence:Math.min(92,55+share*30+items.length*4),source:'Repeated merchant'}); } });
  return out.sort((a,b)=>b.confidence-a.confidence).slice(0,8);
}

function toggleAutomationSetting(key){ state.automation[key]=!state.automation[key]; saveState(); if(key==='subscriptionDetection' && state.automation[key]) detectRecurring(false); toast(`${key.replace(/([A-Z])/g,' $1')} ${state.automation[key]?'enabled':'disabled'}.`); renderAll(); }

function runTransferScan(showToast=false){ let count=0; state.transactions.forEach(t=>{ const was=t.hidden&&t.category==='Transfers'; if(applyTransferDetection(t) && !was) count++; }); saveState(); if(showToast) toast(count?`Auto-hidden ${count} transfer${count===1?'':'s'}.`:'No new transfers found.'); renderAll(); return count; }

function applyRulesToAll(){ let ruleHits=0, transferHits=0; state.transactions.forEach(tx=>{ const beforeRule=tx.ruleId; const beforeTransfer=tx.hidden&&tx.category==='Transfers'; const res=applyAutomationToTx(tx,{guess:true}); if(res.ruleApplied || tx.ruleId!==beforeRule) ruleHits++; if((res.transferApplied || (tx.hidden&&tx.category==='Transfers')) && !beforeTransfer) transferHits++; }); detectRecurring(false); saveState(); toast(`Automation applied: ${ruleHits} rule hit${ruleHits===1?'':'s'}, ${transferHits} new transfer${transferHits===1?'':'s'} hidden.`); renderAll(); }

function saveQuickTransaction(id){ const tx=id?state.transactions.find(t=>t.id===id):{id:uid('tx'),createdAt:new Date().toISOString()}; if(!tx) return; Object.assign(tx,{date:document.getElementById('qaDate').value, amount:parseFloat(document.getElementById('qaAmount').value)||0, description:document.getElementById('qaDesc').value.trim()||'Manual transaction', rawDescription:document.getElementById('qaDesc').value.trim()||'Manual transaction', category:document.getElementById('qaCat').value.trim()||'Other', account:document.getElementById('qaAcct').value.trim()||'General', hidden:document.getElementById('qaHidden').classList.contains('on'), reviewed:true}); if(!id) state.transactions.push(tx); state.settings.firstRunComplete=true; closeDrawer(); toast('Transaction saved.'); renderAll(); }

async function deleteTransaction(id){ const ok=await mmConfirm('Delete this transaction? This cannot be undone.', {title:'Delete transaction?', confirmText:'Delete', danger:true}); if(!ok) return; state.transactions=state.transactions.filter(t=>t.id!==id); closeDrawer(); toast('Transaction deleted.'); renderAll(); }

function exportTransactionsCsv(){
  const headers=['date','description','rawDescription','amount','category','account','reviewed','hidden','notes','createdAt'];
  const rows=(state.transactions||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  downloadBlob(new Blob([csvRows(headers,rows)],{type:'text/csv'}),`moneymap-transactions-${new Date().toISOString().slice(0,10)}.csv`);
  toast('Transactions CSV exported.');
}
