/* MoneyMap budgets module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

function editBudget(id){ const b=state.budgets.find(x=>x.id===id); if(b) openDrawer('budget', b); }

function budgetStats(month=currentMonth()){
  const txns=monthTransactions(month);
  return (state.budgets||[]).map(b=>{
    const spent=spendingFor(txns.filter(t=>(t.category||'Other')===b.category));
    const limit=Math.max(0,Number(b.limit||0));
    const pct=limit?Math.round((spent/limit)*100):0;
    return {...b,spent,limit,pct,remaining:limit-spent};
  });
}

function budgetRowHtml(b){
  const cls=b.pct>=100?'bad':b.pct>=80?'warn':'good';
  const left=Math.max(0,b.remaining);
  return `<button type="button" class="budget-row budget-heat-row" onclick="editBudget('${b.id}')" aria-label="Edit ${escapeHtml(b.category)} budget"><div class="budget-row-top"><div><div class="budget-name">${escapeHtml(b.category)}</div><div class="budget-meta">${money(b.spent)} spent · ${money(b.limit)} budget</div></div><div class="budget-row-side"><strong class="${cls}">${b.pct}%</strong><span>${money(left)} left</span></div></div><div class="progress budget-progress"><span style="width:${Math.min(100,b.pct)}%"></span></div></button>`;
}

function renderBudgets(){
  const board=document.getElementById('budgetBoard'); if(!board) return;
  const stats=budgetStats().sort((a,b)=>b.pct-a.pct);
  board.innerHTML=stats.length?stats.map(budgetRowHtml).join(''):emptyMini('No budgets yet','Create monthly category limits for quick guardrails.','Add budget','openDrawer(\'budget\')');
  const summary=document.getElementById('budgetSummary');
  if(summary){ const totalLimit=stats.reduce((a,b)=>a+b.limit,0); const totalSpent=stats.reduce((a,b)=>a+b.spent,0); const over=stats.filter(b=>b.pct>100).length; summary.innerHTML=`<div class="mini-item"><div><b>Total budgeted</b><br><span>This month</span></div><strong>${money(totalLimit)}</strong></div><div class="mini-item"><div><b>Spent against budgets</b><br><span>${totalLimit?Math.round(totalSpent/totalLimit*100):0}% used</span></div><strong>${money(totalSpent)}</strong></div><div class="mini-item"><div><b>Over limit</b><br><span>Categories needing attention</span></div><strong class="${over?'bad':'good'}">${over}</strong></div>`; }
  const sugg=document.getElementById('budgetSuggestions');
  if(sugg){ const existing=new Set((state.budgets||[]).map(b=>b.category)); const rows=byCategory(monthTransactions(currentMonth())).filter(([cat])=>!existing.has(cat)).slice(0,4); sugg.innerHTML=rows.length?rows.map(([cat,val])=>`<button class="mini-item" onclick="openDrawer('budget',{category:'${escapeJs(cat)}',limit:${Math.ceil(val*1.15/10)*10}})"><div><b>${escapeHtml(cat)}</b><br><span>Based on ${money(val)} current spend</span></div><strong>${money(Math.ceil(val*1.15/10)*10)}</strong></button>`).join(''):emptyMini('No suggestions','Import more spending or all active categories already have budgets.'); }
}

function quickBudget(cat,limit){ state.budgets.push({id:uid('bud'),category:cat,limit}); toast('Budget added.'); renderAll(); }

function saveBudget(id){ const category=document.getElementById('budCat').value.trim(); const limit=parseFloat(document.getElementById('budLimit').value)||0; if(!category||!limit){toast('Category and limit required.');return;} const b=id?state.budgets.find(x=>x.id===id):null; if(b){b.category=category;b.limit=limit;} else state.budgets.push({id:uid('bud'),category,limit}); closeDrawer(); toast('Budget saved.'); renderAll(); }
