/* MoneyMap spend-map — v0.9.6
   Extracted from src/js/app.js (was the R2.5 IIFE) in v0.9.6.
   Renders the Overview spending category list with exact DOM rows instead
   of canvas hit-testing. Wraps window.renderAll and window.renderOverview
   via the existing guard pattern (future: use MoneyMapRenderBus instead).

   Dependencies (all global by the time this file loads):
   - state, COLORS, CATEGORIES (state.js)
   - currentMonth, monthTransactions, monthLabel, money (utils.js / app.js)
   - emptyMini, escapeHtml, escapeJs (utils.js / security.js)
   - showView, showCategoryTransactions, ensureTransactionFilterExtras (app.js)
   - renderAll, renderOverview (app.js)

   Load order: after app.js, cache-guard.js, render-bus.js, shared-helpers.js.
   See index.html. */
/* ---- R2.5 Spending map precision patch ----
   Replaces the dashboard spending map's canvas hit-testing with exact DOM rows.
   This removes imprecise hover/tap selection and keeps category totals aligned
   with the transaction filter users land on after clicking a category. */
(function(){
  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.9';
  const EXCLUDED_SPEND_CATEGORIES=new Set(['Income','Transfers']);
  const CATEGORY_ALIASES={
    'transfer':'Transfers',
    'transfers':'Transfers',
    'xfer':'Transfers',
    'income':'Income',
    'paycheck':'Income',
    'salary':'Income'
  };

  function cleanCategoryName(cat){
    let raw=String(cat ?? '').replace(/\s+/g,' ').trim();
    if(!raw || /^uncategorized$/i.test(raw)) raw='Other';
    const aliasKey=raw.toLowerCase();
    if(CATEGORY_ALIASES[aliasKey]) return CATEGORY_ALIASES[aliasKey];
    const known=[];
    try{ if(Array.isArray(CATEGORIES)) known.push(...CATEGORIES); }catch(e){}
    try{ (state.budgets||[]).forEach(b=>{ if(b?.category) known.push(b.category); }); }catch(e){}
    const exact=known.find(k=>String(k).trim().toLowerCase()===aliasKey);
    return exact ? String(exact).trim() : raw;
  }

  function isSpendTx(tx){
    if(!tx || tx.hidden) return false;
    const amount=Number(tx.amount);
    if(!Number.isFinite(amount) || amount>=0) return false;
    return !EXCLUDED_SPEND_CATEGORIES.has(cleanCategoryName(tx.category));
  }

  function categoryRows(txns){
    const rows=new Map();
    (txns||[]).forEach(tx=>{
      if(!isSpendTx(tx)) return;
      const category=cleanCategoryName(tx.category);
      const amount=Math.abs(Number(tx.amount));
      const current=rows.get(category) || {category,total:0,count:0};
      current.total += amount;
      current.count += 1;
      rows.set(category,current);
    });
    return [...rows.values()].sort((a,b)=>b.total-a.total || a.category.localeCompare(b.category));
  }

  try{
    spendingFor=function(txns){
      return (txns||[]).reduce((sum,tx)=>isSpendTx(tx) ? sum+Math.abs(Number(tx.amount)) : sum, 0);
    };
    byCategory=function(txns){
      return categoryRows(txns).map(row=>[row.category,row.total]);
    };
  }catch(e){}

  window.openSpendCategory=function(category){
    window.showCategoryTransactions(category);
  };

  const priorShowCategory=window.showCategoryTransactions;
  window.showCategoryTransactions=function(category){
    const clean=cleanCategoryName(category);
    showView('transactions');
    requestAnimationFrame(()=>{
      try{ ensureTransactionFilterExtras?.(); }catch(e){}
      const ids={
        globalSearch:'',
        transactionSearch:'',
        filterCategory:clean,
        filterVisibility:'visible',
        filterAmountType:'spend',
        filterDateFrom:'',
        filterDateTo:''
      };
      Object.entries(ids).forEach(([id,value])=>{ const el=document.getElementById(id); if(el) el.value=value; });
      const month=document.getElementById('filterMonth');
      if(month) month.value=currentMonth();
      renderAll();
      document.getElementById('transactionSearch')?.scrollIntoView({behavior:'smooth',block:'center'});
    });
    return typeof priorShowCategory==='function' ? true : undefined;
  };

  function ensureSpendMapHost(){
    let host=document.getElementById('spendMapList');
    if(host) return host;
    const canvas=document.getElementById('spendCanvas');
    const wrap=canvas?.parentElement;
    if(!wrap) return null;
    wrap.classList.remove('chart-interactive','mm-chart-card','canvas-wrap');
    wrap.classList.add('spend-map-list-wrap');
    wrap.innerHTML='<div class="spend-map-list" id="spendMapList" aria-label="Monthly spending by category"></div><div class="spend-map-summary" id="spendMapSummary"></div>';
    return document.getElementById('spendMapList');
  }

  function renderPreciseSpendMap(){
    const host=ensureSpendMapHost();
    if(!host) return;
    const txns=monthTransactions(currentMonth());
    const rows=categoryRows(txns).slice(0,6);
    const total=rows.reduce((sum,row)=>sum+row.total,0);
    const max=rows[0]?.total || 1;
    const colors=(typeof COLORS!=='undefined' && COLORS.length) ? COLORS : ['var(--accent)','var(--accent2)','var(--accent3)'];
    if(!rows.length){
      host.innerHTML=emptyMini('No spending yet','Import transactions to see category breakdowns.','Import CSV','showView(\'import\')');
      const summary=document.getElementById('spendMapSummary');
      if(summary) summary.textContent='';
      return;
    }
    host.innerHTML=rows.map((row,i)=>{
      const pct=total ? Math.round(row.total/total*100) : 0;
      const width=Math.max(3, Math.round(row.total/max*100));
      const color=colors[i%colors.length];
      const label=`${row.count} transaction${row.count===1?'':'s'} · ${pct}% of spending`;
      return `<button type="button" class="spend-map-row" onclick="openSpendCategory('${escapeJs(row.category)}')" aria-label="Open ${escapeHtml(row.category)} transactions for ${monthLabel(currentMonth())}">
        <span class="spend-map-label"><span class="spend-map-dot" style="background:${escapeHtml(color)}"></span><span class="spend-map-label-text"><b>${escapeHtml(row.category)}</b><span>${escapeHtml(label)}</span></span></span>
        <span class="spend-map-track" aria-hidden="true"><span class="spend-map-fill" style="width:${width}%;background:linear-gradient(90deg,${escapeHtml(color)},var(--accent2))"></span></span>
        <span class="spend-map-amount">${money(row.total)}</span>
      </button>`;
    }).join('');
    const summary=document.getElementById('spendMapSummary');
    if(summary){
      const count=rows.reduce((sum,row)=>sum+row.count,0);
      summary.textContent=`Showing ${rows.length} categor${rows.length===1?'y':'ies'} from ${count} spending transaction${count===1?'':'s'} in ${monthLabel(currentMonth())}. Tap a row to open the exact filtered transactions.`;
    }
  }

  const priorRenderOverview=window.renderOverview;
  if(typeof priorRenderOverview==='function' && !priorRenderOverview.__r25SpendMapWrapped){
    window.renderOverview=function(){
      const out=priorRenderOverview.apply(this,arguments);
      renderPreciseSpendMap();
      return out;
    };
    window.renderOverview.__r25SpendMapWrapped=true;
  }

  const priorRenderAll=window.renderAll;
  if(typeof priorRenderAll==='function' && !priorRenderAll.__r25SpendMapWrapped){
    window.renderAll=function(){
      const out=priorRenderAll.apply(this,arguments);
      requestAnimationFrame(renderPreciseSpendMap);
      return out;
    };
    window.renderAll.__r25SpendMapWrapped=true;
  }

  window.addEventListener('resize',()=>requestAnimationFrame(renderPreciseSpendMap),{passive:true});
  document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(renderPreciseSpendMap));
  setTimeout(renderPreciseSpendMap,120);
  try{ document.documentElement.dataset.moneymapBuild=BUILD; }catch(e){}
})();
