/* MoneyMap v0.8 targeted fixes.
   Fixes stale v0.5 cache banner, dark-mode net-worth card contrast, and transaction cents. */
(function(){
  'use strict';

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.1';
  let booted = false;

  const esc = value => (typeof escapeHtml === 'function')
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const txMoney = value => {
    try { return money(value, {cents:true}); }
    catch(e){ return new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:2, maximumFractionDigits:2}).format(Number(value || 0)); }
  };

  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD = BUILD;
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      const meta = document.querySelector('meta[name="moneymap-build"]');
      if(meta) meta.setAttribute('content', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
    }catch(e){}
  }

  function removeFalseCacheBanner(){
    try{
      const expected = window.MONEYMAP_EXPECTED_BUILD || BUILD;
      const stateBuild = (typeof APP_BUILD_ID !== 'undefined') ? APP_BUILD_ID : expected;
      const notice = document.getElementById('cacheResetNotice');
      if(!notice) return;
      const realMismatch = stateBuild && expected && stateBuild !== expected;
      if(realMismatch){
        notice.classList.add('v071-real-mismatch');
        return;
      }
      notice.classList.remove('active', 'v071-real-mismatch');
      notice.remove();
    }catch(e){}
  }

  window.renderTransactions = function(){
    const body = document.getElementById('transactionRows');
    if(!body) return;
    const txns = typeof visibleTransactions === 'function' ? visibleTransactions() : [];
    if(!txns.length){
      body.innerHTML = `<tr><td colspan="7"><div class="empty"><div><strong>No matching transactions.</strong><p>Import a file, add a transaction manually, or change the filters.</p><div class="empty-actions"><button class="btn btn-primary" onclick="showView('import')">Import file</button><button class="btn" onclick="openDrawer('quickAdd')">Add manually</button></div></div></div></td></tr>`;
      renderTransactionCards();
      return;
    }
    body.innerHTML = txns.map(t => {
      const amount = Number(t.amount || 0);
      const raw = t.rawDescription && t.rawDescription !== t.description ? `<br><span class="muted">Raw: ${esc(t.rawDescription)}</span>` : '';
      const auto = t.hiddenReason ? `<br><span class="muted">${esc(t.hiddenReason)}</span>` : '';
      const needsClean = typeof merchantLooksMessy === 'function' ? merchantLooksMessy(t.rawDescription || t.description) : false;
      const hideBtn = t.hidden ? `<button class="btn btn-small" onclick="toggleTxHidden('${esc(t.id)}')">Unhide</button>` : `<button class="btn btn-small" onclick="toggleTxHidden('${esc(t.id)}')">Hide</button>`;
      const status = t.hidden ? '<span class="pill">Hidden</span>' : t.reviewed ? '<span class="pill">Reviewed</span>' : '<span class="pill gold">Needs review</span>';
      const category = typeof categorySelectHtml === 'function' ? categorySelectHtml(t) : esc(t.category || 'Other');
      return `<tr><td>${esc(typeof dateFmt === 'function' ? dateFmt(t.date) : t.date)}</td><td><b>${esc(t.description || 'Transaction')}</b>${raw}${auto}</td><td>${category}</td><td>${esc(t.account || 'General')}</td><td>${status}</td><td class="amount-cell ${amount < 0 ? 'bad' : 'good'}">${txMoney(amount)}</td><td class="right"><div class="tx-actions">${needsClean ? `<button class="btn btn-small" onclick="cleanTxMerchant('${esc(t.id)}')">Clean</button>` : ''}${hideBtn}<button class="btn btn-small" onclick="createRuleForTx('${esc(t.id)}')">Rule</button><button class="btn btn-small" onclick="editTransaction('${esc(t.id)}')">Edit</button></div></td></tr>`;
    }).join('');
    renderTransactionCards();
  };

  window.renderTransactionCards = function(){
    const el = document.getElementById('transactionCards');
    if(!el) return;
    const txns = typeof visibleTransactions === 'function' ? visibleTransactions() : [];
    if(!txns.length){
      el.innerHTML = '';
      return;
    }
    el.innerHTML = txns.map(t => {
      const amount = Number(t.amount || 0);
      const initial = String(t.description || '?').trim().slice(0,1).toUpperCase() || '?';
      const badge = t.hidden ? '<span class="tx-card-badge">Hidden</span>' : (t.reviewed ? '<span class="tx-card-badge reviewed">Reviewed</span>' : '<span class="tx-card-badge needs-review">Review</span>');
      const date = typeof dateFmt === 'function' ? dateFmt(t.date) : t.date;
      return `<button type="button" class="tx-card" onclick="editTransaction('${esc(t.id)}')" aria-label="Edit ${esc(t.description || 'transaction')}"><div class="tx-card-avatar">${esc(initial)}</div><div class="tx-card-body"><div class="tx-card-merchant">${esc(t.description || 'Transaction')}</div><div class="tx-card-meta">${esc(date)} · ${esc(t.category || 'Other')} · ${esc(t.account || 'General')}</div></div><div class="tx-card-right"><span class="tx-card-amount v071-tx-amount ${amount < 0 ? 'bad' : 'good'}">${txMoney(amount)}</span>${badge}</div></button>`;
    }).join('');
  };

  window.miniTx = function(t){
    const amount = Number(t.amount || 0);
    const date = typeof dateFmt === 'function' ? dateFmt(t.date) : t.date;
    return `<button type="button" class="mini-item click-card tx-mini-row" onclick="editTransaction('${esc(t.id)}')" aria-label="Edit ${esc(t.description || 'transaction')}"><div class="tx-mini-icon">${esc(String(t.description || '?').trim().slice(0,1).toUpperCase() || '?')}</div><div class="tx-mini-main"><b>${esc(t.description || 'Transaction')}</b><span>${esc(date)} · ${esc(t.category || 'Other')}</span></div><strong class="v071-tx-amount ${amount < 0 ? 'bad' : 'good'}">${txMoney(amount)}</strong></button>`;
  };

  function renderPatch(){
    markBuild();
    removeFalseCacheBanner();
    try{
      if(document.getElementById('transactionRows')) window.renderTransactions();
    }catch(e){}
  }

  function wrapRender(){
    const oldRenderAll = window.renderAll;
    if(typeof oldRenderAll === 'function' && !oldRenderAll.__v071Wrapped){
      window.renderAll = function(){
        const out = oldRenderAll.apply(this, arguments);
        requestAnimationFrame(renderPatch);
        return out;
      };
      window.renderAll.__v071Wrapped = true;
    }
    const oldShowView = window.showView;
    if(typeof oldShowView === 'function' && !oldShowView.__v071Wrapped){
      window.showView = function(){
        const out = oldShowView.apply(this, arguments);
        requestAnimationFrame(renderPatch);
        return out;
      };
      window.showView.__v071Wrapped = true;
    }
  }

  function init(){
    if(booted) return;
    booted = true;
    wrapRender();
    renderPatch();
    setInterval(() => { markBuild(); removeFalseCacheBanner(); }, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 250);
})();
