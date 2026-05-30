/* MoneyMap accounts module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function accountIsLiability(type){ return /credit|loan|debt|mortgage|liability/i.test(String(type||'')); }

function accountSignedValue(a){ const bal=Math.abs(nval(a.balance)); return accountIsLiability(a.type) ? -bal : nval(a.balance); }

function includedAccounts(){ return (state.accounts||[]).filter(a=>a.includeNetWorth!==false); }

function includedDebts(){ return (state.debts||[]).filter(d=>d.includeNetWorth!==false); }

function netWorthBreakdown(){
  const acct=includedAccounts();
  const accountAssets=acct.reduce((a,x)=>a+Math.max(0,accountSignedValue(x)),0);
  const accountLiabilities=acct.reduce((a,x)=>a+Math.abs(Math.min(0,accountSignedValue(x))),0);
  const holdingsValue=includedHoldings().reduce((a,h)=>a+holdingValue(h),0);
  const debtLiabilities=includedDebts().reduce((a,d)=>a+Math.abs(nval(d.balance)),0);
  const assets=accountAssets+holdingsValue;
  const liabilities=accountLiabilities+debtLiabilities;
  return {assets,liabilities,netWorth:assets-liabilities,accountAssets,accountLiabilities,holdingsValue,debtLiabilities};
}

function renderNetWorth(){
  const metrics=document.getElementById('netWorthMetrics'); if(!metrics) return;
  const b=netWorthBreakdown(); const snapshots=(state.netWorthHistory||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))); const prev=snapshots[1]; const latest=snapshots[0]; const delta=latest&&prev?nval(latest.netWorth)-nval(prev.netWorth):null;
  const today=document.getElementById('netWorthSnapshotDate'); if(today && !today.value) today.value=new Date().toISOString().slice(0,10);
  metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Net worth</div><div class="metric-value ${b.netWorth>=0?'good':'bad'}">${money(b.netWorth)}</div><div class="metric-sub">Included assets minus included liabilities</div></div><div class="tracker-stat"><div class="metric-label">Assets</div><div class="metric-value good">${money(b.assets)}</div><div class="metric-sub">${money(b.accountAssets)} balances + ${money(b.holdingsValue)} holdings</div></div><div class="tracker-stat"><div class="metric-label">Liabilities</div><div class="metric-value bad">${money(b.liabilities)}</div><div class="metric-sub">${money(b.accountLiabilities)} account debt + ${money(b.debtLiabilities)} debt tracker</div></div><div class="tracker-stat"><div class="metric-label">Snapshot delta</div><div class="metric-value ${delta===null?'muted':delta>=0?'good':'bad'}">${delta===null?'—':money(delta)}</div><div class="metric-sub">${latest?`Latest: ${dateFmt(latest.date)}`:'No snapshots yet'}</div></div>`;
  const rows=document.getElementById('accountRows');
  if(rows){ rows.innerHTML=(state.accounts||[]).length?(state.accounts||[]).map(a=>{ const signed=accountSignedValue(a); return `<tr><td><b>${escapeHtml(a.name||'Account')}</b><br><span class="muted">${escapeHtml(a.institution||'Manual')}</span></td><td>${escapeHtml(a.type||'Account')}</td><td>${a.updatedAt?dateFmt(String(a.updatedAt).slice(0,10)):'—'}</td><td><span class="balance-badge ${a.includeNetWorth!==false?'include':'exclude'}">${a.includeNetWorth!==false?'Included':'Excluded'}</span></td><td class="amount-cell ${signed<0?'bad':'good'}">${money(signed)}</td><td class="right"><div class="table-actions"><button class="btn btn-small" onclick="toggleAccountInclude('${a.id}')">${a.includeNetWorth!==false?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('account', findById('accounts','${a.id}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('accounts','${a.id}')">Delete</button></div></td></tr>`; }).join(''):`<tr><td colspan="6"><div class="empty" style="min-height:150px"><div><strong>No manual balances yet.</strong><p>Add checking, savings, brokerage, card, loan, or other balances.</p><button class="btn btn-primary" onclick="openDrawer('account')">Add account</button></div></div></td></tr>`; }
  const list=document.getElementById('netWorthSnapshotList');
  if(list){ list.innerHTML=snapshots.length?snapshots.slice(0,8).map(e=>`<div class="snapshot-row"><div><b>${dateFmt(e.date)}</b><br><span>${escapeHtml(e.note||'Manual snapshot')}</span></div><div><strong class="${nval(e.netWorth)>=0?'good':'bad'}">${money(e.netWorth)}</strong><div class="table-actions" style="margin-top:8px"><button class="btn btn-small" onclick="restoreSnapshotNote('${e.id}')">Edit note</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('netWorthHistory','${e.id}')">Delete</button></div></div></div>`).join(''):emptyMini('No snapshots yet','Save your current net worth to start history.','Save snapshot','saveNetWorthSnapshot()'); }
}

function saveNetWorthSnapshot(){
  const b=netWorthBreakdown(); const dateEl=document.getElementById('netWorthSnapshotDate'); const noteEl=document.getElementById('netWorthSnapshotNote'); const date=(dateEl&&dateEl.value)||new Date().toISOString().slice(0,10); const note=(noteEl&&noteEl.value.trim())||'';
  state.netWorthHistory=state.netWorthHistory||[]; const existing=state.netWorthHistory.find(x=>x.date===date);
  const payload={date,note,netWorth:b.netWorth,assets:b.assets,liabilities:b.liabilities,accountAssets:b.accountAssets,holdingsValue:b.holdingsValue,accountLiabilities:b.accountLiabilities,debtLiabilities:b.debtLiabilities,updatedAt:new Date().toISOString()};
  if(existing) Object.assign(existing,payload); else state.netWorthHistory.push({id:uid('nw'),createdAt:new Date().toISOString(),...payload});
  if(noteEl) noteEl.value=''; toast('Net worth snapshot saved.'); renderAll();
}

async function restoreSnapshotNote(id){ const e=(state.netWorthHistory||[]).find(x=>x.id===id); if(!e) return; const note=await mmPrompt('Update the note for this net worth snapshot.', e.note||'', {title:'Edit snapshot note', confirmText:'Save note'}); if(note===null) return; e.note=note.trim(); e.updatedAt=new Date().toISOString(); renderAll(); }

function toggleAccountInclude(id){ const a=(state.accounts||[]).find(x=>x.id===id); if(!a) return; a.includeNetWorth=a.includeNetWorth===false; renderAll(); toast(a.includeNetWorth?'Account included in net worth.':'Account excluded from net worth.'); }

function renderDebt(){
  const metrics=document.getElementById('debtMetrics'); if(!metrics) return;
  const debts=(state.debts||[]).slice(); const total=debts.reduce((a,d)=>a+nval(d.balance),0); const minPay=debts.reduce((a,d)=>a+nval(d.minPayment),0); const extra=debts.reduce((a,d)=>a+nval(d.extraPayment),0); const weighted=total?debts.reduce((a,d)=>a+nval(d.balance)*nval(d.apr),0)/total:0; const plan=debtPlanRows(); const focus=plan[0];
  const strat=document.getElementById('debtStrategy'); if(strat) strat.value=state.trackerSettings?.debtStrategy||'avalanche';
  metrics.innerHTML=`<div class="tracker-stat"><div class="metric-label">Total debt</div><div class="metric-value bad">${money(total)}</div><div class="metric-sub">Across ${debts.length} tracked balance${debts.length===1?'':'s'}</div></div><div class="tracker-stat"><div class="metric-label">Monthly payment</div><div class="metric-value gold">${money(minPay+extra)}</div><div class="metric-sub">${money(minPay)} minimum + ${money(extra)} extra</div></div><div class="tracker-stat"><div class="metric-label">Weighted APR</div><div class="metric-value warn">${pctFmt(weighted)}</div><div class="metric-sub">Weighted by current balance</div></div><div class="tracker-stat"><div class="metric-label">Active strategy</div><div class="metric-value blue">${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'Snowball':'Avalanche'}</div><div class="metric-sub">${focus?`Focus: ${escapeHtml(focus.name)}`:'Add debt to build a plan'}</div></div>`;
  const rows=document.getElementById('debtRows');
  if(rows){ rows.innerHTML=debts.length?debts.map(d=>{ const pay=nval(d.minPayment)+nval(d.extraPayment); const months=payoffMonths(nval(d.balance),nval(d.apr),pay); return `<tr><td><b>${escapeHtml(d.name||'Debt')}</b><br><span class="muted">${escapeHtml(d.lender||'Manual')} ${d.dueDay?`· due ${escapeHtml(d.dueDay)}`:''}</span></td><td>${pctFmt(d.apr)}</td><td>${money(d.minPayment)}</td><td>${money(d.extraPayment)}</td><td><span class="balance-badge ${d.includeNetWorth!==false?'include':'exclude'}">${d.includeNetWorth!==false?'Included':'Excluded'}</span></td><td class="amount-cell bad">${money(d.balance)}</td><td class="right"><div class="table-actions"><button class="btn btn-small" onclick="toggleDebtInclude('${d.id}')">${d.includeNetWorth!==false?'Exclude':'Include'}</button><button class="btn btn-small" title="${payoffLabel(months)}" onclick="openDrawer('debt', findById('debts','${d.id}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('debts','${d.id}')">Delete</button></div></td></tr>`; }).join(''):`<tr><td colspan="7"><div class="empty" style="min-height:150px"><div><strong>No debts tracked.</strong><p>Add cards, student loans, auto loans, or other payoff balances.</p><button class="btn btn-primary" onclick="openDrawer('debt')">Add debt</button></div></div></td></tr>`; }
  const focusEl=document.getElementById('debtFocus'); if(focusEl){ focusEl.innerHTML=focus?`<div class="eyebrow">Next best payment</div><h3>${escapeHtml(focus.name)}</h3><p>Target this first with the ${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'snowball':'avalanche'} method. Balance ${money(focus.balance)}, APR ${pctFmt(focus.apr)}, projected payoff ${payoffLabel(focus.months)} at current payment.</p><div class="hero-row"><button class="btn btn-primary" onclick="openDrawer('debt', findById('debts','${focus.id}'))">Update payment</button><button class="btn" onclick="setDebtStrategy('${(state.trackerSettings?.debtStrategy||'avalanche')==='snowball'?'avalanche':'snowball'}')">Switch strategy</button></div>`:`<div class="eyebrow">Payoff focus</div><h3>No debt yet</h3><p>Add a balance to generate a payoff order and monthly payment insight.</p><div class="hero-row"><button class="btn btn-primary" onclick="openDrawer('debt')">Add debt</button></div>`; }
  const planEl=document.getElementById('debtPlan'); if(planEl){ planEl.innerHTML=plan.length?plan.map((d,i)=>`<div class="mini-item"><div><b>${i+1}. ${escapeHtml(d.name)}</b><br><span>${money(d.balance)} · ${pctFmt(d.apr)} APR · ${payoffLabel(d.months)}</span></div><strong>${money(nval(d.minPayment)+nval(d.extraPayment))}/mo</strong></div>`).join(''):emptyMini('No plan yet','Add at least one debt to see the payoff order.','Add debt','openDrawer(\'debt\')'); }
}

function payoffMonths(balance,apr,payment){ balance=nval(balance); payment=nval(payment); const r=nval(apr)/100/12; if(balance<=0) return 0; if(payment<=0) return Infinity; if(r<=0) return Math.ceil(balance/payment); if(payment<=balance*r) return Infinity; return Math.ceil(-Math.log(1-balance*r/payment)/Math.log(1+r)); }

function payoffLabel(months){ if(months===Infinity) return 'payment too low'; if(months===null || months===undefined || isNaN(months)) return 'unknown'; if(months<=0) return 'paid off'; const y=Math.floor(months/12), m=months%12; return y?`${y}y ${m}m`:`${m}m`; }

function debtPlanRows(){ const strat=state.trackerSettings?.debtStrategy||'avalanche'; return (state.debts||[]).slice().map(d=>({...d,months:payoffMonths(d.balance,d.apr,nval(d.minPayment)+nval(d.extraPayment))})).sort((a,b)=>strat==='snowball'?nval(a.balance)-nval(b.balance):nval(b.apr)-nval(a.apr)); }

function setDebtStrategy(value){ state.trackerSettings=state.trackerSettings||{}; state.trackerSettings.debtStrategy=value; toast(`Debt strategy set to ${value==='snowball'?'snowball':'avalanche'}.`); renderAll(); }

function toggleDebtInclude(id){ const d=(state.debts||[]).find(x=>x.id===id); if(!d) return; d.includeNetWorth=d.includeNetWorth===false; renderAll(); toast(d.includeNetWorth?'Debt included in net worth.':'Debt excluded from net worth.'); }

async function deleteTrackerItem(collection,id,options={}){ if(!state[collection]) return; const label=mmCollectionLabel(collection); const name=mmItemName(collection,id); const ok=await mmConfirm(`Delete ${label} "${name}"? This cannot be undone.`, {title:`Delete ${label}?`, confirmText:'Delete', danger:true}); if(!ok) return false; state[collection]=state[collection].filter(x=>x.id!==id); if(options.closeDrawer) closeDrawer(); toast(`${label.charAt(0).toUpperCase()+label.slice(1)} deleted.`); renderAll(); return true; }

function saveAccount(id){ const payload={name:document.getElementById('acctName').value.trim(), institution:document.getElementById('acctInstitution').value.trim(), type:document.getElementById('acctType').value, balance:nval(document.getElementById('acctBalance').value), updatedAt:document.getElementById('acctUpdated').value||new Date().toISOString().slice(0,10), includeNetWorth:document.getElementById('acctInclude').classList.contains('on'), notes:document.getElementById('acctNotes').value.trim()}; if(!payload.name){ toast('Account name required.'); return; } state.accounts=state.accounts||[]; const item=id?state.accounts.find(x=>x.id===id):null; if(item) Object.assign(item,payload); else state.accounts.push({id:uid('acct'),createdAt:new Date().toISOString(),...payload}); closeDrawer(); toast('Account saved.'); renderAll(); }

function saveDebt(id){ const payload={name:document.getElementById('debtName').value.trim(), lender:document.getElementById('debtLender').value.trim(), balance:Math.abs(nval(document.getElementById('debtBalance').value)), apr:nval(document.getElementById('debtApr').value), minPayment:nval(document.getElementById('debtMin').value), extraPayment:nval(document.getElementById('debtExtra').value), dueDay:document.getElementById('debtDue').value.trim(), includeNetWorth:document.getElementById('debtInclude').classList.contains('on'), notes:document.getElementById('debtNotes').value.trim()}; if(!payload.name || !payload.balance){ toast('Debt name and balance required.'); return; } state.debts=state.debts||[]; const item=id?state.debts.find(x=>x.id===id):null; if(item) Object.assign(item,payload); else state.debts.push({id:uid('debt'),createdAt:new Date().toISOString(),...payload}); closeDrawer(); toast('Debt saved.'); renderAll(); }

function exportTrackerCsv(kind){
  const configs={
    networth:{name:'net-worth-history',rows:state.netWorthHistory||[],headers:['date','netWorth','assets','liabilities','note']},
    debts:{name:'debts',rows:state.debts||[],headers:['name','lender','balance','apr','minPayment','extraPayment','dueDay','includeNetWorth','notes']},
    holdings:{name:'holdings',rows:state.holdings||[],headers:['symbol','name','account','assetClass','quantity','price','costBasis','includeNetWorth','notes']},
    goals:{name:'goals',rows:state.goals||[],headers:['name','type','target','current','dueDate','priority','linkedAccount','notes']}
  }; const cfg=configs[kind]; if(!cfg) return; const lines=[cfg.headers.join(',')].concat(cfg.rows.map(r=>cfg.headers.map(h=>`"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))); downloadBlob(new Blob([lines.join('\n')],{type:'text/csv'}),`moneymap-${cfg.name}-${new Date().toISOString().slice(0,10)}.csv`);
}
