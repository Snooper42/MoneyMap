/* MoneyMap transaction drawer v0.1.3 — polished desktop and mobile editor */
(function(){
  'use strict';

  if(window.__mmTransactionDrawerV012) return;
  window.__mmTransactionDrawerV012 = true;

  function esc(v){
    if(typeof escapeHtml === 'function') return escapeHtml(String(v ?? ''));
    return String(v ?? '').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }
  function js(v){ return typeof escapeJs === 'function' ? escapeJs(String(v ?? '')) : String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function n(v){ return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function cents(v){ return Math.round(n(v)*100)/100; }
  function amountInputValue(v){ var x=Math.abs(cents(v)); return x ? x.toFixed(2) : ''; }
  function fmt(v){
    try{ if(typeof money === 'function') return money(cents(v),{cents:true}); }catch(e){}
    return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(cents(v));
  }
  function dateText(v){ try{ return typeof dateFmt==='function' ? dateFmt(v) : v; }catch(e){ return v; } }
  function txKind(t){ return (t && (t.hidden || t.category==='Transfers')) ? 'transfer' : ((t && n(t.amount)>0) ? 'income' : 'spend'); }
  function commonCategories(kind){
    if(kind==='income') return ['Income','Savings','Investments','Other'];
    if(kind==='transfer') return ['Transfers','Credit Card Payment','Internal Transfer','Other'];
    return ['Groceries','Dining','Coffee','Gas','Bills','Shopping','Subscriptions','Transportation','Transfers','Other'];
  }
  function setField(id,value){ var el=document.getElementById(id); if(el) el.value=value; }
  function selectedKind(){ return document.querySelector('[data-tx-type].selected')?.dataset.txType || 'spend'; }
  function selectedCategoryButtons(){
    var current=(document.getElementById('qaCat')?.value||'').trim();
    document.querySelectorAll('.mm11-cat-chip').forEach(function(btn){ btn.classList.toggle('selected', btn.dataset.cat===current); });
  }

  window.setTxTypeV012=function(kind){
    document.querySelectorAll('[data-tx-type]').forEach(function(btn){ btn.classList.toggle('selected', btn.dataset.txType===kind); });
    var cat=document.getElementById('qaCat');
    var hiddenSwitch=document.getElementById('qaHidden');
    if(kind==='transfer'){
      if(cat) cat.value='Transfers';
      if(hiddenSwitch) hiddenSwitch.classList.add('on');
    } else {
      if(hiddenSwitch) hiddenSwitch.classList.remove('on');
      if(cat && (!cat.value || (kind==='income' && !['Income','Savings','Investments','Other'].includes(cat.value)) || (kind==='spend' && ['Income','Savings','Investments','Credit Card Payment','Internal Transfer'].includes(cat.value)))) cat.value=kind==='income'?'Income':'Other';
    }
    var chips=document.getElementById('mm11CategoryChips');
    if(chips) chips.innerHTML=commonCategories(kind).map(function(c){ return '<button type="button" class="mm11-cat-chip'+((cat?.value||'')===c?' selected':'')+'" data-cat="'+esc(c)+'" onclick="setQuickCategoryV012(\''+js(c)+'\')">'+esc(c)+'</button>'; }).join('');
    updateTxPreviewV012();
  };
  window.setQuickCategoryV012=function(cat){ setField('qaCat',cat); selectedCategoryButtons(); updateTxPreviewV012(); };
  window.updateTxPreviewV012=function(){
    var kind=selectedKind();
    var raw=cents(document.getElementById('qaAmount')?.value||0);
    var signed=(kind==='income')?Math.abs(raw):-Math.abs(raw);
    var desc=(document.getElementById('qaDesc')?.value||'Transaction').trim()||'Transaction';
    var amount=document.getElementById('mm11TxPreviewAmount');
    var title=document.getElementById('mm11TxPreviewTitle');
    var meta=document.getElementById('mm11TxPreviewMeta');
    if(amount){ amount.textContent=fmt(signed); amount.className='mm11-tx-preview-amount '+(signed<0?'bad':'good'); }
    if(title) title.textContent=desc;
    if(meta) meta.textContent=(document.getElementById('qaCat')?.value||'Other')+' · '+(document.getElementById('qaAcct')?.value||'General')+' · '+dateText(document.getElementById('qaDate')?.value||'');
    selectedCategoryButtons();
  };
  window.toggleTransferV012=function(){
    var sw=document.getElementById('qaHidden');
    if(!sw) return;
    sw.classList.toggle('on');
    var on=sw.classList.contains('on');
    if(on){ setField('qaCat','Transfers'); window.setTxTypeV012('transfer'); } else { window.setTxTypeV012('spend'); }
    selectedCategoryButtons(); updateTxPreviewV012();
  };

  function transactionMarkup(data){
    var t=data||{};
    var kind=txKind(t);
    var isEdit=!!t.id;
    var date=t.date || new Date().toISOString().slice(0,10);
    var desc=t.description || '';
    var cat=t.category || (kind==='income'?'Income':(kind==='transfer'?'Transfers':'Other'));
    var acct=t.account || 'General';
    var hidden=!!t.hidden || cat==='Transfers';
    var chips=commonCategories(kind).map(function(c){ return '<button type="button" class="mm11-cat-chip'+(cat===c?' selected':'')+'" data-cat="'+esc(c)+'" onclick="setQuickCategoryV012(\''+js(c)+'\')">'+esc(c)+'</button>'; }).join('');
    var avatar=esc(String(desc||'?').trim().slice(0,1).toUpperCase()||'?');
    return '<div class="mm11-tx-editor">' +
      '<section class="mm11-tx-preview"><div class="mm11-tx-avatar">'+avatar+'</div><div class="mm11-tx-preview-copy"><div id="mm11TxPreviewTitle">'+esc(desc||'Transaction')+'</div><span id="mm11TxPreviewMeta">'+esc(cat)+' · '+esc(acct)+' · '+esc(dateText(date))+'</span></div><strong id="mm11TxPreviewAmount" class="mm11-tx-preview-amount '+(kind==='spend'?'bad':'good')+'">'+esc(fmt(kind==='income'?Math.abs(n(t.amount)):-Math.abs(n(t.amount))))+'</strong></section>' +
      '<section class="card drawer-form-card mm11-tx-form-card"><div class="tx-type-toggle mm11-type-toggle" role="group" aria-label="Transaction type"><button type="button" class="btn btn-small'+(kind==='spend'?' selected':'')+'" data-tx-type="spend" onclick="setTxTypeV012(\'spend\')">Spend</button><button type="button" class="btn btn-small'+(kind==='income'?' selected':'')+'" data-tx-type="income" onclick="setTxTypeV012(\'income\')">Income</button><button type="button" class="btn btn-small'+(kind==='transfer'?' selected':'')+'" data-tx-type="transfer" onclick="setTxTypeV012(\'transfer\')">Transfer</button></div>' +
      '<div class="mm11-form-grid"><div><label>Amount</label><div class="money-input mm11-money-input"><span>$</span><input class="input" id="qaAmount" type="number" inputmode="decimal" step="0.01" min="0" value="'+esc(amountInputValue(t.amount))+'" placeholder="0.00" autocomplete="off" oninput="updateTxPreviewV012()"></div></div><div><label>Date</label><input class="input" id="qaDate" type="date" value="'+esc(date)+'" onchange="updateTxPreviewV012()"></div></div>' +
      '<div class="form-field"><label>Description</label><input class="input" id="qaDesc" data-autofocus value="'+esc(desc)+'" placeholder="Merchant, payee, or note" autocapitalize="words" autocorrect="off" autocomplete="off" oninput="updateTxPreviewV012()"></div>' +
      '<div class="mm11-form-grid"><div><label>Category</label><input class="input" id="qaCat" list="categoryList" value="'+esc(cat)+'" autocomplete="off" oninput="updateTxPreviewV012()"><div id="mm11CategoryChips" class="mm11-category-chips">'+chips+'</div></div><div><label>Account</label><input class="input" id="qaAcct" value="'+esc(acct)+'" autocomplete="off" oninput="updateTxPreviewV012()"></div></div>' +
      '<button type="button" class="toggle mm11-transfer-toggle" onclick="toggleTransferV012()"><div><b>Mark as transfer</b><br><span class="muted">Hides this item from spend, budgets, and charts.</span></div><span class="switch '+(hidden?'on':'')+'" id="qaHidden" aria-label="Hide as transfer"></span></button>' +
      '<div class="drawer-actions mm11-tx-actions"><button class="btn btn-primary" onclick="saveQuickTransaction(\''+js(t.id||'')+'\')">Save transaction</button><button class="btn" onclick="closeDrawer()">Cancel</button>'+(isEdit?'<button class="btn btn-danger" onclick="deleteTransaction(\''+js(t.id)+'\')">Delete</button>':'')+'</div></section>' +
      '<aside class="mm11-tx-side"><div class="mm11-side-card"><b>Review impact</b><span>Saving marks the transaction as reviewed. Transfers stay hidden from spend reports.</span></div><div class="mm11-side-card"><b>Precision</b><span>Amounts are rounded to cents, so imported floating-point values do not leak into the form.</span></div></aside>' +
      '</div>';
  }

  function openTransactionDrawer(data){
    var d=document.getElementById('drawer'), title=document.getElementById('drawerTitle'), sub=document.getElementById('drawerSub'), body=document.getElementById('drawerBody');
    if(!d||!body) return;
    d.classList.add('active'); d.setAttribute('aria-hidden','false'); d.setAttribute('data-drawer-type','transaction');
    title.textContent=(data&&data.id)?'Edit transaction':'Add transaction';
    sub.textContent='Clean amount, merchant, category, account, and reporting visibility.';
    body.innerHTML=transactionMarkup(data||{});
    requestAnimationFrame(function(){
      try{ if(typeof enhanceDrawerOpen==='function') enhanceDrawerOpen('transaction'); }catch(e){}
      updateTxPreviewV012();
      var focus=body.querySelector('[data-autofocus]'); if(focus) focus.focus({preventScroll:true});
    });
  }

  var priorOpen=window.openDrawer;
  window.openDrawer=function(type,data){
    if(type==='transaction') return openTransactionDrawer(data||null);
    return typeof priorOpen==='function' ? priorOpen.apply(this,arguments) : undefined;
  };

  var priorSave=window.saveQuickTransaction;
  window.saveQuickTransaction=function(id){
    var tx=id?(state.transactions||[]).find(function(t){return t.id===id;}):{id:uid('tx'),createdAt:new Date().toISOString()};
    if(!tx) return;
    var kind=selectedKind();
    var raw=cents(document.getElementById('qaAmount')?.value||0);
    var amount=(kind==='income')?Math.abs(raw):-Math.abs(raw);
    var desc=(document.getElementById('qaDesc')?.value||'').trim() || 'Manual transaction';
    var hidden=(kind==='transfer') || document.getElementById('qaHidden')?.classList.contains('on') || false;
    var category=(document.getElementById('qaCat')?.value||'').trim() || (kind==='income'?'Income':'Other');
    if(hidden) category='Transfers';
    Object.assign(tx,{
      date:document.getElementById('qaDate')?.value || new Date().toISOString().slice(0,10),
      amount:cents(amount),
      description:desc,
      rawDescription:tx.rawDescription || desc,
      category:category,
      account:(document.getElementById('qaAcct')?.value||'').trim() || 'General',
      hidden:hidden,
      hiddenReason:hidden?'Marked as transfer':(tx.hiddenReason&&category==='Transfers'?tx.hiddenReason:undefined),
      reviewed:true,
      updatedAt:new Date().toISOString()
    });
    if(!id) state.transactions.push(tx);
    state.settings.firstRunComplete=true;
    if(typeof saveState==='function') saveState();
    if(typeof closeDrawer==='function') closeDrawer();
    if(typeof toast==='function') toast('Transaction saved.');
    if(typeof renderAll==='function') renderAll();
  };

})();
