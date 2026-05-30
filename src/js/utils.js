/* MoneyMap utils module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function clone(x){ return JSON.parse(JSON.stringify(x)); }

function money(n, opts={}){
  const currency = state.settings.currency || 'USD';
  const cents = opts.cents ?? state.settings.showCents;
  const value = Number(n || 0);
  return new Intl.NumberFormat('en-US',{style:'currency',currency,minimumFractionDigits:cents?2:0,maximumFractionDigits:cents?2:0}).format(value);
}

function dateFmt(d){ const dt = new Date(d+'T00:00:00'); return isNaN(dt) ? d : dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

function monthKey(d){ const dt = new Date(d+'T00:00:00'); if(isNaN(dt)) return 'Unknown'; return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`; }

function monthLabel(key){ if(key==='all') return 'All months'; const [y,m]=key.split('-'); return new Date(Number(y),Number(m)-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); }

function startOfWeek(date=new Date()){
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay(); const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function inCurrentWeek(dateStr){ const d=new Date(String(dateStr||'')+'T00:00:00'); if(isNaN(d)) return false; const s=startOfWeek(); const e=new Date(s); e.setDate(s.getDate()+7); return d>=s && d<e; }

function dateKey(d){ return d.toISOString().slice(0,10); }

function displayWeekRange(){ const s=startOfWeek(); const e=new Date(s); e.setDate(s.getDate()+6); return `${dateFmt(dateKey(s))} to ${dateFmt(dateKey(e))}`; }

function merchantRuleMatches(rule, raw){
  if(!rule || !rule.match || !rule.name) return false;
  const hay = merchantSearchText(raw);
  const compactHay = hay.replace(/\s+/g,'');
  const needle = merchantSearchText(rule.match);
  const compactNeedle = needle.replace(/\s+/g,'');
  return (needle && hay.includes(needle)) || (compactNeedle && compactHay.includes(compactNeedle));
}

function applyMerchantRenameRule(raw){
  const rules = (state?.merchantRules || []).filter(r=>r?.match && r?.name).sort((a,b)=>String(b.match).length-String(a.match).length);
  const hit = rules.find(r=>merchantRuleMatches(r, raw));
  return hit ? hit.name : '';
}

function merchantCoreTokens(raw){
  let s = merchantSearchText(raw);
  s = s.replace(/\b(TST|SQ|SP|PP|PAYPAL|POINT OF SALE|CHECKCARD|CHECK CARD|DEBIT CARD|CREDIT CARD|CARD PURCHASE|PURCHASE AUTHORIZED|PREAUTHORIZED|AUTHORIZATION|AUTH|PENDING|RECURRING|ONLINE|WEB|ACH|ELECTRONIC|POS|VISA|MASTERCARD|AMEX|REF|REFERENCE|TRACE|TRANS|TRANSACTION|ID|THANK YOU|THANKS|NA|USA|US)\b/g,' ');
  s = s.replace(/\b[A-Z0-9]+\.(COM|NET|ORG|CO|US)\b/g,' ');
  s = s.replace(/\b(?=[A-Z0-9-]*\d)(?:[A-Z]{0,4}\d{3,}[A-Z0-9-]*|\d{2,}[A-Z]{1,})\b/g,' ');
  let tokens = s.split(/\s+/).filter(Boolean).filter(t=>t.length>1 && !US_STATE_CODES.has(t) && !MERCHANT_LOCATION_WORDS.has(t));
  const out=[];
  for(const t of tokens){ if(out[out.length-1]!==t) out.push(t); }
  return out.slice(0,4);
}

function merchantRuleMatchFromRaw(raw, cleanName){
  const cleanTokens = merchantSearchText(cleanName).split(/\s+/).filter(Boolean).filter(t=>t.length>1);
  const rawTokens = merchantCoreTokens(raw);
  const rawJoined = rawTokens.join(' ');
  for(let len=Math.min(3, cleanTokens.length); len>=1; len--){
    const phrase = cleanTokens.slice(0,len).join(' ');
    if(phrase && rawJoined.includes(phrase)) return phrase;
  }
  if(rawTokens.length>=2) return rawTokens.slice(0,2).join(' ');
  return rawTokens[0] || merchantSearchText(cleanName).split(/\s+/).filter(Boolean)[0] || '';
}

function upsertMerchantRenameRule(raw, cleanName, source='auto'){
  const name = String(cleanName||'').trim();
  const match = merchantRuleMatchFromRaw(raw, name);
  if(!name || !match || name.length < 2) return false;
  state.merchantRules = state.merchantRules || [];
  const existing = state.merchantRules.find(r=>merchantSearchText(r.match)===merchantSearchText(match));
  const now = new Date().toISOString();
  if(existing){
    existing.name = name;
    existing.hits = Number(existing.hits||0)+1;
    existing.source = existing.source==='manual' || source==='manual' ? 'manual' : 'auto';
    existing.updatedAt = now;
  }else{
    state.merchantRules.unshift({id:uid('mr'), match, name, source, hits:1, createdAt:now, updatedAt:now});
  }
  state.merchantRules = state.merchantRules.slice(0,500);
  return true;
}

function autoMerchantName(raw){
  const learned = applyMerchantRenameRule(raw);
  if(learned) return learned;
  return cleanMerchantName(raw);
}

function learnMerchantRulesFromTransactions(){
  if(state.automation?.merchantCleanup === false) return 0;
  const candidates = new Map();
  (state.transactions || []).forEach(t=>{
    const raw = t.rawDescription || t.description;
    const cleaned = cleanMerchantName(raw);
    if(!raw || !cleaned || cleaned === raw || !merchantLooksMessy(raw)) return;
    const match = merchantRuleMatchFromRaw(raw, cleaned);
    if(!match) return;
    const key = merchantSearchText(match);
    const prev = candidates.get(key) || {raw, cleaned, match, count:0};
    prev.count += 1;
    candidates.set(key, prev);
  });
  let added = 0;
  candidates.forEach(c=>{ if(c.count >= 1 && upsertMerchantRenameRule(c.raw, c.cleaned, 'auto')) added++; });
  return added;
}

function autoCleanAllMerchants(options={}){
  if(state.automation?.merchantCleanup === false && !options.force){ toast('Merchant cleanup automation is off.'); return 0; }
  const learned = learnMerchantRulesFromTransactions();
  let count = 0;
  (state.transactions || []).forEach(t=>{
    const raw = t.rawDescription || t.description;
    const next = autoMerchantName(raw);
    if(next && next !== t.description){
      if(!t.rawDescription) t.rawDescription = t.description;
      t.description = next;
      t.automation = [...new Set([...(t.automation||[]),'merchant'])];
      count++;
    }
  });
  if(count || learned) saveState();
  renderAll();
  if(options.toast !== false) toast(`Merchant automation: ${count} cleaned, ${learned} learned rule${learned===1?'':'s'}.`);
  return count;
}

function toggleMerchantCleanup(){
  state.automation = {...defaultState.automation, ...(state.automation||{})};
  state.automation.merchantCleanup = state.automation.merchantCleanup === false;
  saveState(); renderAll(); toast(`Merchant cleanup automation ${state.automation.merchantCleanup?'on':'off'}.`);
}

function titleCaseWords(s){
  const special={USA:'USA',ACH:'ACH',POS:'POS',ATM:'ATM',IRA:'IRA',FPL:'FPL',LAZ:'LAZ',NJ:'NJ',FL:'FL',PA:'PA',US:'US',LLC:'LLC',INC:'Inc',CO:'Co'};
  return String(s||'').toLowerCase().split(/\s+/).filter(Boolean).map(w=>{
    const raw=w.replace(/[^a-z0-9&’']/gi,''); const upper=raw.toUpperCase();
    if(special[upper]) return special[upper];
    if(/^mc[a-z]/i.test(raw)) return raw.charAt(0).toUpperCase()+raw.charAt(1).toLowerCase()+raw.charAt(2).toUpperCase()+raw.slice(3).toLowerCase();
    return raw.charAt(0).toUpperCase()+raw.slice(1).toLowerCase();
  }).join(' ');
}

function merchantSearchText(raw){
  return String(raw||'').normalize('NFKC').toUpperCase()
    .replace(/&/g,' AND ')
    .replace(/[’']/g,'')
    .replace(/[^A-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function canonicalMerchantName(raw){
  const custom=applyMerchantRenameRule(raw);
  if(custom) return custom;
  const spaced=merchantSearchText(raw);
  const compact=spaced.replace(/\s+/g,'');
  for(const rule of MERCHANT_CANONICAL_RULES){
    if(rule.test.test(spaced) || rule.test.test(compact)) return rule.name;
  }
  return '';
}

function stripMerchantLocationTail(s){
  let tokens=String(s||'').split(/\s+/).filter(Boolean);
  let changed=true;
  while(changed && tokens.length>1){
    changed=false;
    const last=tokens[tokens.length-1].toUpperCase().replace(/[^A-Z]/g,'');
    if(US_STATE_CODES.has(last) || ['US','USA','NA'].includes(last)){ tokens.pop(); changed=true; continue; }
    if(MERCHANT_LOCATION_WORDS.has(last)){ tokens.pop(); changed=true; continue; }
    if(tokens.length>2 && /^[A-Z]$/.test(last)){ tokens.pop(); changed=true; continue; }
  }
  return tokens.join(' ');
}

function dedupeMerchantWords(s){
  const out=[];
  String(s||'').split(/\s+/).filter(Boolean).forEach(w=>{
    const prev=out[out.length-1]||'';
    if(prev.toUpperCase()!==w.toUpperCase()) out.push(w);
  });
  if(out.length===2 && out[0].toUpperCase()===out[1].toUpperCase()) out.pop();
  return out.join(' ');
}

function cleanMerchantName(raw){
  const original=String(raw||'').replace(/\s+/g,' ').trim();
  const canonical=canonicalMerchantName(original);
  if(canonical) return canonical;
  let s=original;
  s=s.normalize('NFKC').replace(/&/g,' and ');
  s=s.replace(/\b(TST|SQ|SP|PP|PAYPAL)\s*[*#:-]?\s*/gi,' ');
  s=s.replace(/\b(POINT OF SALE|CHECKCARD|CHECK CARD|DEBIT CARD|CREDIT CARD|CARD PURCHASE|PURCHASE AUTHORIZED|PREAUTHORIZED|AUTHORIZATION|AUTH|PENDING|RECURRING|ONLINE|WEB|ACH|ELECTRONIC|POS|VISA|MASTERCARD|AMEX)\b/gi,' ');
  s=s.replace(/\b(REF|REFERENCE|TRACE|TRANS|TRANSACTION|ID|AUTH CODE|APPROVAL)\s*[:#-]?\s*[A-Z0-9-]+/gi,' ');
  s=s.replace(/https?:\/\/\S+|www\.\S+/gi,' ');
  s=s.replace(/\b[A-Z0-9-]+\.(COM|NET|ORG|CO|US)\b/gi,' ');
  s=s.replace(/\b[NSEW]?SOUTH\b/gi,' South').replace(/\b[NSEW]?NORTH\b/gi,' North').replace(/\b[NSEW]?EAST\b/gi,' East').replace(/\b[NSEW]?WEST\b/gi,' West');
  s=s.replace(/[-–—_/\|]+/g,' ');
  s=s.replace(/[*#]+/g,' ');
  s=s.replace(/\bMOBILEFT\b/gi,' ');
  s=s.replace(/\b(?=[A-Z0-9-]*\d)(?:[A-Z]{0,4}\d{3,}[A-Z0-9-]*|\d{2,}[A-Z]{1,})\b/gi,' ');
  s=s.replace(/\b(THANK YOU|THANKS|NA|USA|US)\b/gi,' ');
  s=s.replace(/\s+/g,' ').trim();
  s=stripMerchantLocationTail(s);
  s=dedupeMerchantWords(s);
  s=s.replace(/\b(Inc|LLC|Ltd|Co|Company|Corp|Corporation|Store|Stores)\b$/i,'').trim();
  if(!s) s=original||'Unknown merchant';
  return titleCaseWords(s).slice(0,64);
}

function merchantLooksMessy(s){
  const raw=String(s||'');
  return /\b(TST|SQ|SP|POS|CHECKCARD|DEBIT|AUTH|PURCHASE|PENDING|RECURRING|REF|REFERENCE|TRACE|TRANSACTION|ID)\b/i.test(raw)
    || /[#*]{1,}|\d{4,}/.test(raw)
    || /\b[A-Z0-9-]+\.(COM|NET|ORG|CO|US)\b/i.test(raw)
    || /\b(AL|AK|AZ|AR|CA|CO|CT|DC|DE|FL|GA|HI|IA|ID|IL|IN|KS|KY|LA|MA|MD|ME|MI|MN|MO|MS|MT|NC|ND|NE|NH|NJ|NM|NV|NY|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VA|VT|WA|WI|WV|WY)\b$/i.test(raw.trim())
    || raw.length>48;
}

function currentMonth(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,10) + Date.now().toString(36).slice(-4); }

function normalizeMerchant(s){ return String(s||'').toUpperCase().replace(/\b(POS|DEBIT|CREDIT|CARD|PURCHASE|CHECKCARD|ACH|WEB|ONLINE|PAYMENT|AUTOPAY|INC|LLC|STORE)\b/g,' ').replace(/[0-9#*.-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,44) || 'UNKNOWN'; }

function hashTx(tx){ return [tx.date, Number(tx.amount).toFixed(2), normalizeMerchant(tx.rawDescription || tx.description), (tx.account||'').toLowerCase()].join('|'); }

function escapeHtml(str){ return String(str ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }


function ensureMoneyMapDialog(){
  let root=document.getElementById('mmDialogRoot');
  if(root) return root;
  root=document.createElement('div');
  root.id='mmDialogRoot';
  root.className='mm-dialog';
  root.setAttribute('aria-hidden','true');
  document.body.appendChild(root);
  return root;
}

function mmDialog(options={}){
  return new Promise(resolve=>{
    const root=ensureMoneyMapDialog();
    const previous=document.activeElement;
    const type=options.type || 'confirm';
    const isPrompt=type === 'prompt';
    const title=options.title || (isPrompt ? 'Enter value' : 'Confirm action');
    const message=options.message || '';
    const confirmText=options.confirmText || (isPrompt ? 'Save' : 'OK');
    const cancelText=options.cancelText || 'Cancel';
    const danger=Boolean(options.danger);
    const defaultValue=options.defaultValue ?? '';
    const bodyHtml=String(message).split(/\n+/).map(x=>`<p>${escapeHtml(x)}</p>`).join('');
    root.innerHTML=`<div class="mm-dialog-backdrop" data-dialog-cancel="1"></div>
      <div class="mm-dialog-panel ${danger?'danger':''}" role="dialog" aria-modal="true" aria-labelledby="mmDialogTitle">
        <div class="mm-dialog-head">
          <span class="mm-dialog-icon">${danger?'!':'?'}</span>
          <div><h3 id="mmDialogTitle">${escapeHtml(title)}</h3><div class="mm-dialog-copy">${bodyHtml}</div></div>
        </div>
        ${isPrompt?`<input class="input mm-dialog-input" id="mmDialogInput" value="${escapeHtml(defaultValue)}" autocomplete="off">`:''}
        <div class="mm-dialog-actions">
          <button type="button" class="btn" data-dialog-cancel="1">${escapeHtml(cancelText)}</button>
          <button type="button" class="btn ${danger?'btn-danger':'btn-primary'}" data-dialog-confirm="1">${escapeHtml(confirmText)}</button>
        </div>
      </div>`;
    root.classList.add('active');
    root.setAttribute('aria-hidden','false');
    document.body.classList.add('mm-dialog-open');
    const input=root.querySelector('#mmDialogInput');
    const confirmBtn=root.querySelector('[data-dialog-confirm]');
    const close=(value)=>{
      root.classList.remove('active');
      root.setAttribute('aria-hidden','true');
      document.body.classList.remove('mm-dialog-open');
      root.innerHTML='';
      document.removeEventListener('keydown',onKey,true);
      try{ previous?.focus?.(); }catch(e){}
      resolve(value);
    };
    const confirm=()=> close(isPrompt ? (input?.value ?? '') : true);
    const cancel=()=> close(isPrompt ? null : false);
    const onKey=(event)=>{
      if(event.key==='Escape'){ event.preventDefault(); cancel(); }
      if(event.key==='Enter' && (!isPrompt || document.activeElement===input)){ event.preventDefault(); confirm(); }
      if(event.key==='Tab'){
        const focusables=[...root.querySelectorAll('button,input')];
        if(!focusables.length) return;
        const first=focusables[0], last=focusables[focusables.length-1];
        if(event.shiftKey && document.activeElement===first){ event.preventDefault(); last.focus(); }
        else if(!event.shiftKey && document.activeElement===last){ event.preventDefault(); first.focus(); }
      }
    };
    root.onclick=event=>{ if(event.target.closest('[data-dialog-cancel]')) cancel(); if(event.target.closest('[data-dialog-confirm]')) confirm(); };
    document.addEventListener('keydown',onKey,true);
    setTimeout(()=>{ (input || confirmBtn)?.focus?.(); if(input) input.select(); },20);
  });
}

function mmConfirm(message, options={}){ return mmDialog({type:'confirm', message, ...options}); }
function mmPrompt(message, defaultValue='', options={}){ return mmDialog({type:'prompt', message, defaultValue, ...options}); }

function mmCollectionLabel(collection){
  return ({accounts:'account',debts:'debt',holdings:'holding',netWorthHistory:'snapshot',goals:'goal',transactions:'transaction',creditHistory:'credit log',rules:'rule',importMappings:'saved mapping'}[collection] || 'item');
}

function mmItemName(collection,id){
  const item=(state?.[collection]||[]).find(x=>x.id===id);
  if(!item) return mmCollectionLabel(collection);
  return item.name || item.description || item.category || item.symbol || item.date || mmCollectionLabel(collection);
}

function toast(msg){ const wrap=document.getElementById('toast'); const el=document.createElement('div'); el.className='toast-item'; el.textContent=msg; wrap.appendChild(el); setTimeout(()=>el.remove(),3400); }

function daysLeftInMonth(){ const d=new Date(); const last=new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); return Math.max(1,last-d.getDate()+1); }

function daysElapsedInMonth(){ const d=new Date(); return Math.max(1,d.getDate()); }

function spendingPace(month=currentMonth()){
  const c=computeCashflowSummary(month);
  const elapsed=daysElapsedInMonth(); const left=daysLeftInMonth(); const totalDays=elapsed+left-1;
  const projected=c.spend/elapsed*totalDays;
  const pacePct=c.totalBudget?Math.round(projected/c.totalBudget*100):0;
  return {...c,elapsed,left,totalDays,projected,pacePct};
}

function healthStatus(label, value, mode='neutral'){
  if(mode==='good') return `<span class="v5-status good">${escapeHtml(label)}</span>`;
  if(mode==='bad') return `<span class="v5-status bad">${escapeHtml(label)}</span>`;
  if(mode==='warn') return `<span class="v5-status warn">${escapeHtml(label)}</span>`;
  return `<span class="v5-status">${escapeHtml(label)}</span>`;
}

function median(vals){ const a=vals.slice().sort((x,y)=>x-y); if(!a.length) return 0; const mid=Math.floor(a.length/2); return a.length%2?a[mid]:(a[mid-1]+a[mid])/2; }

function nval(v){ const n=Number(v); return Number.isFinite(n)?n:0; }

function pctFmt(v){ return `${Math.round(nval(v)*10)/10}%`; }

function monthDiff(from,to){ const a=new Date(String(from||currentMonth()+'-01').slice(0,10)); const b=new Date(String(to||'')+'T00:00:00'); if(isNaN(a)||isNaN(b)) return null; return Math.max(0,(b.getFullYear()-a.getFullYear())*12 + (b.getMonth()-a.getMonth()) + (b.getDate()>a.getDate()?1:0)); }

function findById(collection,id){ return (state[collection]||[]).find(x=>x.id===id) || null; }

function cleanScore(v){ const n=parseInt(v,10); return Number.isFinite(n) && n>=300 && n<=850 ? n : null; }

function cleanUtilization(v){ if(v==='' || v===null || v===undefined) return null; const n=parseFloat(v); return Number.isFinite(n) && n>=0 && n<=100 ? n : null; }

function avgScore(entry){ const vals=['experian','equifax','transunion'].map(k=>Number(entry?.[k])).filter(n=>Number.isFinite(n) && n>0); return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null; }

function creditSorted(){ return (state.creditHistory||[]).slice().sort((a,b)=>String(b.month).localeCompare(String(a.month))); }

function creditBand(score){ if(!score) return 'Not logged'; if(score>=800) return 'Exceptional'; if(score>=740) return 'Very good'; if(score>=670) return 'Good'; if(score>=580) return 'Fair'; return 'Needs work'; }

function scorePct(score){ if(!score) return 0; return Math.max(0,Math.min(100,Math.round(((score-300)/550)*100))); }

function scoreDelta(label, latest, previous){ if(!latest) return 'No data'; if(!previous) return 'First log'; const d=latest-previous; if(d===0) return 'No change'; return `${d>0?'+':''}${d} since previous log`; }

function latestBureauScore(key){ const logs=creditSorted().filter(e=>Number.isFinite(Number(e[key])) && Number(e[key])>0); return [logs[0]?Number(logs[0][key]):null, logs[1]?Number(logs[1][key]):null]; }

function markOption(selector,value){ document.querySelectorAll(selector).forEach(el=>el.classList.toggle('selected',el.dataset[Object.keys(el.dataset)[0]]===value)); }

function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},0); }

function csvCell(value){ return `"${String(value ?? '').replace(/"/g,'""').replace(/\r?\n/g,' ')}"`; }

function csvRows(headers, rows){ return [headers.map(csvCell).join(',')].concat(rows.map(row=>headers.map(h=>csvCell(typeof h==='function'?h(row):row[h])).join(','))).join('\n'); }

function periodRange(kind){
  const now=new Date(); let start,end,label,slug;
  if(kind==='week'){
    start=startOfWeek(now); end=new Date(start); end.setDate(start.getDate()+7); const last=new Date(end); last.setDate(end.getDate()-1);
    label=`${dateFmt(dateKey(start))} to ${dateFmt(dateKey(last))}`; slug=`week-${dateKey(start)}`;
  } else {
    start=new Date(now.getFullYear(),now.getMonth(),1); end=new Date(now.getFullYear(),now.getMonth()+1,1);
    label=monthLabel(dateKey(start).slice(0,7)); slug=`month-${dateKey(start).slice(0,7)}`;
  }
  return {kind,start,end,startKey:dateKey(start),endKey:dateKey(end),label,slug};
}

function transactionsForRange(range, includeHidden=false){
  return (state.transactions||[]).filter(tx=>{
    const d=new Date(String(tx.date||'')+'T00:00:00');
    return !isNaN(d) && d>=range.start && d<range.end && (includeHidden || !tx.hidden);
  }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

function scoreText(v){ const n=Number(v); return Number.isFinite(n) && n>0 ? String(Math.round(n)) : '—'; }

function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }

function hexToRgb(hex){
  const raw=String(hex||'').trim().replace('#','');
  const full=raw.length===3?raw.split('').map(c=>c+c).join(''):raw;
  if(!/^[0-9a-fA-F]{6}$/.test(full)) return [83,224,172];
  return [parseInt(full.slice(0,2),16),parseInt(full.slice(2,4),16),parseInt(full.slice(4,6),16)];
}

function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase(); }

function mixRgb(a,b,p){ return a.map((v,i)=>Math.round(v+(b[i]-v)*p)); }


/* ---- Refactor 2 dialog layer: app-native confirmations, prompts, and dangerous actions ---- */
(function(){
  function html(value){ return escapeHtml(String(value ?? '')); }
  function detailRows(details){
    const rows=(details||[]).filter(x=>x && (x.value!==undefined && x.value!==null && String(x.value)!==''));
    if(!rows.length) return '';
    return `<div class="mm-dialog-details">${rows.map(x=>`<div class="mm-dialog-detail-row"><span>${html(x.label||'Detail')}</span><b>${html(x.value)}</b></div>`).join('')}</div>`;
  }
  function impactList(items){
    const rows=(items||[]).filter(Boolean);
    if(!rows.length) return '';
    return `<div class="mm-dialog-impact"><b>What happens</b><ul>${rows.map(x=>`<li>${html(x)}</li>`).join('')}</ul></div>`;
  }
  function ensureRoot(){ return ensureMoneyMapDialog(); }

  window.mmDialog=function(options={}){
    return new Promise(resolve=>{
      const root=ensureRoot();
      const previous=document.activeElement;
      const type=options.type || 'confirm';
      const isPrompt=type === 'prompt';
      const danger=Boolean(options.danger);
      const title=options.title || (isPrompt ? 'Enter value' : 'Confirm action');
      const message=options.message || '';
      const confirmText=options.confirmText || (isPrompt ? 'Save' : 'OK');
      const cancelText=options.cancelText || 'Cancel';
      const defaultValue=options.defaultValue ?? '';
      const requireText=options.requireText ? String(options.requireText) : '';
      const requireLabel=options.requireLabel || (requireText ? `Type ${requireText} to confirm` : '');
      const icon=options.icon || (danger ? '!' : (isPrompt ? '✎' : '✓'));
      const bodyHtml=String(message).split(/\n+/).filter(Boolean).map(x=>`<p>${html(x)}</p>`).join('');
      const promptHtml=isPrompt ? `<label class="mm-dialog-field"><span>${html(options.inputLabel||'Value')}</span><input class="input mm-dialog-input" id="mmDialogInput" value="${html(defaultValue)}" autocomplete="off"></label>` : '';
      const requireHtml=requireText ? `<label class="mm-dialog-field mm-dialog-require"><span>${html(requireLabel)}</span><input class="input mm-dialog-input" id="mmDialogRequire" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text"></label>` : '';
      root.innerHTML=`<div class="mm-dialog-backdrop" data-dialog-cancel="1"></div>
        <div class="mm-dialog-panel ${danger?'danger':''}" role="dialog" aria-modal="true" aria-labelledby="mmDialogTitle" aria-describedby="mmDialogDescription">
          <div class="mm-dialog-head">
            <span class="mm-dialog-icon" aria-hidden="true">${html(icon)}</span>
            <div class="mm-dialog-titleblock"><h3 id="mmDialogTitle">${html(title)}</h3><div class="mm-dialog-copy" id="mmDialogDescription">${bodyHtml}</div></div>
          </div>
          ${detailRows(options.details)}
          ${impactList(options.impact || options.consequences)}
          ${promptHtml}
          ${requireHtml}
          <div class="mm-dialog-actions">
            <button type="button" class="btn mm-dialog-cancel" data-dialog-cancel="1">${html(cancelText)}</button>
            <button type="button" class="btn ${danger?'btn-danger':'btn-primary'} mm-dialog-confirm" data-dialog-confirm="1">${html(confirmText)}</button>
          </div>
        </div>`;
      root.classList.add('active');
      root.setAttribute('aria-hidden','false');
      document.body.classList.add('mm-dialog-open');
      const valueInput=root.querySelector('#mmDialogInput');
      const requireInput=root.querySelector('#mmDialogRequire');
      const confirmBtn=root.querySelector('[data-dialog-confirm]');
      const cancelBtn=root.querySelector('[data-dialog-cancel].mm-dialog-cancel');
      const updateConfirm=()=>{
        if(!requireText) return;
        const matches=String(requireInput?.value||'').trim()===requireText;
        confirmBtn.disabled=!matches;
        confirmBtn.setAttribute('aria-disabled', String(!matches));
      };
      updateConfirm();
      requireInput?.addEventListener('input',updateConfirm);
      const close=(value)=>{
        root.classList.remove('active');
        root.setAttribute('aria-hidden','true');
        document.body.classList.remove('mm-dialog-open');
        root.innerHTML='';
        document.removeEventListener('keydown',onKey,true);
        try{ previous?.focus?.(); }catch(e){}
        resolve(value);
      };
      const confirm=()=>{
        if(confirmBtn.disabled) return;
        close(isPrompt ? (valueInput?.value ?? '') : true);
      };
      const cancel=()=> close(isPrompt ? null : false);
      const onKey=(event)=>{
        if(event.key==='Escape'){ event.preventDefault(); cancel(); return; }
        if(event.key==='Enter'){
          if(isPrompt && document.activeElement===valueInput){ event.preventDefault(); confirm(); return; }
          if(requireText && document.activeElement===requireInput && !confirmBtn.disabled){ event.preventDefault(); confirm(); return; }
          if(!danger && !requireText){ event.preventDefault(); confirm(); return; }
        }
        if(event.key==='Tab'){
          const focusables=[...root.querySelectorAll('button:not([disabled]),input')];
          if(!focusables.length) return;
          const first=focusables[0], last=focusables[focusables.length-1];
          if(event.shiftKey && document.activeElement===first){ event.preventDefault(); last.focus(); }
          else if(!event.shiftKey && document.activeElement===last){ event.preventDefault(); first.focus(); }
        }
      };
      root.onclick=event=>{ if(event.target.closest('[data-dialog-cancel]')) cancel(); if(event.target.closest('[data-dialog-confirm]')) confirm(); };
      document.addEventListener('keydown',onKey,true);
      setTimeout(()=>{
        if(valueInput){ valueInput.focus(); valueInput.select(); }
        else if(requireInput){ requireInput.focus(); }
        else if(danger){ cancelBtn?.focus?.(); }
        else { confirmBtn?.focus?.(); }
      },20);
    });
  };

  window.mmConfirm=function(message, options={}){ return window.mmDialog({type:'confirm', message, ...options}); };
  window.mmPrompt=function(message, defaultValue='', options={}){ return window.mmDialog({type:'prompt', message, defaultValue, ...options}); };
  window.mmConfirmDanger=function(message, options={}){ return window.mmDialog({type:'confirm', message, danger:true, ...options}); };
  window.mmConfirmDelete=function(options={}){
    const type=options.itemType || 'item';
    const name=options.itemName || 'this item';
    return window.mmDialog({
      type:'confirm',
      danger:true,
      title:options.title || `Delete ${type}?`,
      message:options.message || `You are deleting “${name}”. This cannot be undone.`,
      confirmText:options.confirmText || `Delete ${type}`,
      cancelText:options.cancelText || 'Cancel',
      details:options.details || [],
      impact:options.impact || options.consequences || [],
      icon:options.icon || '!'
    });
  };
  try{ mmDialog=window.mmDialog; mmConfirm=window.mmConfirm; mmPrompt=window.mmPrompt; mmConfirmDanger=window.mmConfirmDanger; mmConfirmDelete=window.mmConfirmDelete; }catch(e){}
})();
