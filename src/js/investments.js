/* MoneyMap investments module.
   v0.1.9 cleans the investment tracker into a portfolio-first view while preserving the manual/local data shape. */

function includedHoldings(){ return (state.holdings||[]).filter(h=>h.includeNetWorth!==false); }

function holdingValue(h){ return nval(h.quantity)*nval(h.price); }

function holdingCost(h){ return nval(h.quantity)*nval(h.costBasis); }

function holdingGain(h){ return holdingValue(h)-holdingCost(h); }

function holdingWeight(h,total){ return total ? holdingValue(h)/total*100 : 0; }

function holdingDisplayName(h){ return h.symbol || h.name || 'Holding'; }

function normalizedAssetClass(h){
  const value=String(h.assetClass||'Other').trim();
  if(!value) return 'Other';
  if(/etf|fund|index|mutual/i.test(value)) return 'Funds';
  if(/stock|equity|share/i.test(value)) return 'Stocks';
  if(/bond|treasury|fixed/i.test(value)) return 'Bonds';
  if(/cash|money market|mmf/i.test(value)) return 'Cash';
  if(/crypto|bitcoin|ethereum/i.test(value)) return 'Crypto';
  if(/real estate|reit/i.test(value)) return 'Real estate';
  return value;
}

function portfolioTotals(){
  const holdings=state.holdings||[];
  const value=holdings.reduce((a,h)=>a+holdingValue(h),0);
  const cost=holdings.reduce((a,h)=>a+holdingCost(h),0);
  const gain=value-cost;
  const included=includedHoldings().reduce((a,h)=>a+holdingValue(h),0);
  return {holdings,value,cost,gain,included};
}

function holdingCard(h,total){
  const value=holdingValue(h);
  const cost=holdingCost(h);
  const gain=value-cost;
  const pct=holdingWeight(h,total);
  const included=h.includeNetWorth!==false;
  const title=holdingDisplayName(h);
  const subtitle=[h.name && h.symbol ? h.name : '', h.account || 'Manual', normalizedAssetClass(h)].filter(Boolean).join(' · ');
  return `<article class="holding-card-v04 click-card">
    <div class="holding-card-main">
      <div class="holding-symbol-badge">${escapeHtml(String(title).slice(0,4).toUpperCase())}</div>
      <div class="holding-copy"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div>
      <span class="balance-badge ${included?'include':'exclude'}">${included?'Included':'Excluded'}</span>
    </div>
    <div class="holding-value-row"><strong>${money(value)}</strong><span class="${gain>=0?'good':'bad'}">${cost?`${gain>=0?'+':''}${money(gain)} · ${pctFmt(gain/cost*100)}`:'No cost basis'}</span></div>
    <div class="holding-meter"><span style="width:${Math.min(100,Math.max(0,pct))}%"></span></div>
    <div class="holding-facts-v04">
      <div><span>Quantity</span><b>${nval(h.quantity).toLocaleString()}</b></div>
      <div><span>Price</span><b>${money(h.price,{cents:true})}</b></div>
      <div><span>Weight</span><b>${pctFmt(pct)}</b></div>
    </div>
    <div class="holding-actions-v04">
      <button class="btn btn-small" onclick="toggleHoldingInclude('${h.id}')">${included?'Exclude':'Include'}</button>
      <button class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${h.id}'))">Edit</button>
      <button class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${h.id}')">Delete</button>
    </div>
  </article>`;
}

function renderPortfolioCards(holdings,total){
  if(!holdings.length) return emptyMini('No holdings yet','Add stocks, funds, crypto, bonds, or cash positions manually.','Add holding','openDrawer(\'holding\')');
  const grouped={};
  holdings.slice().sort((a,b)=>holdingValue(b)-holdingValue(a)).forEach(h=>{
    const key=normalizedAssetClass(h);
    grouped[key]=grouped[key]||[];
    grouped[key].push(h);
  });
  return Object.entries(grouped).map(([group,items])=>{
    const groupTotal=items.reduce((a,h)=>a+holdingValue(h),0);
    return `<section class="portfolio-group"><div class="portfolio-group-head"><div><b>${escapeHtml(group)}</b><span>${items.length} holding${items.length===1?'':'s'}</span></div><strong>${money(groupTotal)}</strong></div><div class="portfolio-card-list">${items.map(h=>holdingCard(h,total)).join('')}</div></section>`;
  }).join('');
}

function renderInvestments(){
  const metrics=document.getElementById('investmentMetrics'); if(!metrics) return;
  const {holdings,value,cost,gain,included}=portfolioTotals();
  const gainPct=cost ? gain/cost*100 : 0;
  metrics.innerHTML=`<div class="tracker-stat v04-stat"><div class="metric-label">Portfolio value</div><div class="metric-value good">${money(value)}</div><div class="metric-sub">${holdings.length} manual holding${holdings.length===1?'':'s'}</div></div><div class="tracker-stat v04-stat"><div class="metric-label">Cost basis</div><div class="metric-value blue">${money(cost)}</div><div class="metric-sub">Weighted from cost/share</div></div><div class="tracker-stat v04-stat"><div class="metric-label">Gain / loss</div><div class="metric-value ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}</div><div class="metric-sub">${cost?pctFmt(gainPct):'Add cost basis for performance'}</div></div><div class="tracker-stat v04-stat"><div class="metric-label">Net worth included</div><div class="metric-value purple">${money(included)}</div><div class="metric-sub">Exclude duplicates with account balances</div></div>`;

  const rows=document.getElementById('holdingRows');
  if(rows){ rows.innerHTML=holdings.length?holdings.map(h=>{ const value=holdingValue(h); const cost=holdingCost(h); const gain=value-cost; return `<tr><td><b>${escapeHtml(holdingDisplayName(h))}</b><br><span class="muted">${escapeHtml(h.name||'Manual holding')} · <span class="balance-badge ${h.includeNetWorth!==false?'include':'exclude'}">${h.includeNetWorth!==false?'Included':'Excluded'}</span></span></td><td>${escapeHtml(h.account||'Manual')}</td><td>${escapeHtml(normalizedAssetClass(h))}</td><td class="amount-cell">${nval(h.quantity).toLocaleString()}</td><td class="amount-cell">${money(h.price,{cents:true})}</td><td class="amount-cell good">${money(value)}</td><td class="amount-cell ${gain>=0?'good':'bad'}">${gain>=0?'+':''}${money(gain)}</td><td class="right"><div class="table-actions"><button class="btn btn-small" onclick="toggleHoldingInclude('${h.id}')">${h.includeNetWorth!==false?'Exclude':'Include'}</button><button class="btn btn-small" onclick="openDrawer('holding', findById('holdings','${h.id}'))">Edit</button><button class="btn btn-small btn-danger" onclick="deleteTrackerItem('holdings','${h.id}')">Delete</button></div></td></tr>`; }).join(''):`<tr><td colspan="8"><div class="empty" style="min-height:150px"><div><strong>No holdings yet.</strong><p>Add stocks, funds, crypto, bonds, or cash positions manually.</p><button class="btn btn-primary" onclick="openDrawer('holding')">Add holding</button></div></div></td></tr>`; }

  let cards=document.getElementById('holdingCardsV04');
  const holdingsCard=document.querySelector('#view-investments .card .table-wrap')?.closest('.card');
  if(holdingsCard && !cards){
    cards=document.createElement('div');
    cards.id='holdingCardsV04';
    cards.className='portfolio-holdings-v04';
    const tableWrap=holdingsCard.querySelector('.table-wrap');
    holdingsCard.insertBefore(cards, tableWrap || null);
  }
  if(cards) cards.innerHTML=renderPortfolioCards(holdings,value);

  const alloc=allocationRows(); const list=document.getElementById('allocationList');
  if(list){ list.innerHTML=alloc.length?alloc.map((a,i)=>`<button type="button" class="mini-item allocation-row-v04" onclick="filterPortfolioAssetClass('${escapeJs(a.name)}')"><div><b><span class="dot" style="background:${COLORS[i%COLORS.length]}"></span> ${escapeHtml(a.name)}</b><br><span>${pctFmt(a.pct)} of portfolio</span><div class="allocation-bar"><span style="width:${a.pct}%;background:${COLORS[i%COLORS.length]}"></span></div></div><strong>${money(a.value)}</strong></button>`).join(''):emptyMini('No allocation yet','Add holdings to see asset class weights.','Add holding','openDrawer(\'holding\')'); }
  const notes=document.getElementById('investmentNotes');
  if(notes){ notes.innerHTML=`<div class="mini-item"><div><b>Double-count guard</b><br><span>Exclude holdings from net worth if the same portfolio is already included as an account balance.</span></div><span>Important</span></div><div class="mini-item"><div><b>Manual pricing</b><br><span>MoneyMap stays private and local. Prices do not update automatically.</span></div><span>Private</span></div><div class="mini-item"><div><b>Cleaner account split</b><br><span>Use Accounts for balances. Use Holdings for position-level detail.</span></div><span>v0.1.9</span></div>`; }
}

function allocationRows(){ const total=(state.holdings||[]).reduce((a,h)=>a+holdingValue(h),0); const map={}; (state.holdings||[]).forEach(h=>{ const k=normalizedAssetClass(h); map[k]=(map[k]||0)+holdingValue(h); }); return Object.entries(map).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value,pct:total?value/total*100:0})); }

function filterPortfolioAssetClass(assetClass){
  const q=String(assetClass||'').trim();
  if(!q) return;
  toast(`${q} allocation selected.`);
  document.querySelectorAll('.portfolio-group').forEach(group=>{
    const title=group.querySelector('.portfolio-group-head b')?.textContent||'';
    group.classList.toggle('is-highlighted', title===q);
  });
}

function toggleHoldingInclude(id){ const h=(state.holdings||[]).find(x=>x.id===id); if(!h) return; h.includeNetWorth=h.includeNetWorth===false; renderAll(); toast(h.includeNetWorth?'Holding included in net worth.':'Holding excluded from net worth.'); }

function saveHolding(id){ const payload={symbol:document.getElementById('holdSymbol').value.trim().toUpperCase(), name:document.getElementById('holdName').value.trim(), account:document.getElementById('holdAccount').value.trim(), assetClass:document.getElementById('holdClass').value.trim()||'Stock', quantity:nval(document.getElementById('holdQty').value), price:nval(document.getElementById('holdPrice').value), costBasis:nval(document.getElementById('holdCost').value), includeNetWorth:document.getElementById('holdInclude').classList.contains('on'), notes:document.getElementById('holdNotes').value.trim()}; if(!payload.symbol && !payload.name){ toast('Symbol or holding name required.'); return; } if(!payload.quantity || !payload.price){ toast('Quantity and price required.'); return; } state.holdings=state.holdings||[]; const item=id?state.holdings.find(x=>x.id===id):null; if(item) Object.assign(item,payload); else state.holdings.push({id:uid('hold'),createdAt:new Date().toISOString(),...payload}); closeDrawer(); toast('Holding saved.'); renderAll(); }
