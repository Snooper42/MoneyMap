/* MoneyMap v0.9.2 compact account editor polish.
   Keeps account storage fields and saveAccount() behavior unchanged. */
(function(){
  'use strict';

  if(window.__MoneyMapV092Loaded) return;
  window.__MoneyMapV092Loaded = true;

  const BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.3';
  const GROUPS = [
    {id:'cash', label:'Cash', types:['Checking','Savings','Cash','Money Market']},
    {id:'investments', label:'Investments', types:['Brokerage','Retirement','HSA','Crypto Wallet']},
    {id:'property', label:'Property', types:['Property','Vehicle']},
    {id:'valuables', label:'Valuables', types:['Collectibles','Jewelry','Precious Metals','Art']},
    {id:'debt', label:'Debt', types:['Credit Card','Loan','Student Loan','Mortgage','Auto Loan','Other Liability']},
    {id:'other', label:'Other', types:['Other Asset','Other Liability']}
  ];

  const esc = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function markBuild(){
    window.MONEYMAP_EXPECTED_BUILD = BUILD;
    document.documentElement.setAttribute('data-moneymap-build', BUILD);
    const meta = document.querySelector('meta[name="moneymap-build"]');
    if(meta) meta.setAttribute('content', BUILD);
    document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
  }

  function groupForType(type){
    const text = String(type || '').toLowerCase();
    if(/check|sav|cash|money market/.test(text)) return 'cash';
    if(/broker|retire|401|ira|hsa|invest|crypto/.test(text)) return 'investments';
    if(/property|vehicle|home|house|real estate/.test(text)) return 'property';
    if(/collect|jewel|metal|art/.test(text)) return 'valuables';
    if(/credit|loan|debt|mortgage|liabil/.test(text)) return 'debt';
    return 'other';
  }

  function groupMeta(id){ return GROUPS.find(g => g.id === id) || GROUPS[0]; }

  function accountTitleFromType(type){
    const group = groupMeta(groupForType(type));
    return `${group.label} Account`;
  }

  function ensureDefaultDrawerHead(){
    const head = document.querySelector('#drawer .drawer-head');
    if(!head) return;
    head.innerHTML = `<div><h3 class="section-title" id="drawerTitle">Quick add</h3><p class="section-sub" id="drawerSub">Add or manage data.</p></div><button aria-label="Close drawer" class="btn btn-square drawer-close" onclick="closeDrawer()">×</button>`;
  }

  function compactAccountDrawer(data){
    const drawer = document.getElementById('drawer');
    const head = drawer?.querySelector('.drawer-head');
    const body = document.getElementById('drawerBody');
    if(!drawer || !head || !body) return;

    const currentType = data?.type || 'Checking';
    const currentGroup = groupForType(currentType);
    const typeOptions = groupMeta(currentGroup).types;
    const title = data ? `Edit ${accountTitleFromType(currentType)}` : `Add ${accountTitleFromType(currentType)}`;

    drawer.classList.add('active','v09-account-drawer','v092-account-drawer');
    drawer.dataset.v092EditingAccount = data?.id ? '1' : '0';
    drawer.setAttribute('aria-hidden','false');
    head.innerHTML = `<button type="button" class="btn btn-square v092-icon-btn" onclick="closeDrawer()" aria-label="Back">←</button><div class="v092-head-copy"><h3 class="section-title" id="drawerTitle">${esc(title)}</h3><p class="section-sub" id="drawerSub">Quick manual balance update.</p></div><button type="button" class="btn btn-square v092-icon-btn drawer-close" onclick="closeDrawer()" aria-label="Close">×</button>`;

    body.innerHTML = `<div class="v092-account-form">
      <section class="v092-card v092-primary-card">
        <div class="v092-field v092-field-name">
          <label>Name</label>
          <input class="input" id="acctName" data-autofocus value="${esc(data?.name || '')}" placeholder="Checking">
        </div>
        <div class="v092-field v092-field-group">
          <label>Group</label>
          <div class="v092-chip-grid" id="v092AcctGroupChips">${GROUPS.map(group => `<button type="button" class="${group.id===currentGroup?'active':''}" onclick="v092SetAccountGroup('${group.id}')">${esc(group.label)}</button>`).join('')}</div>
          <input type="hidden" id="acctGroup" value="${esc(currentGroup)}">
        </div>
        <div class="v092-quick-grid">
          <div class="v092-field">
            <label>Type</label>
            <select id="acctType" onchange="v092SyncAccountTitle()">${typeOptions.map(type => `<option ${type===currentType?'selected':''}>${esc(type)}</option>`).join('')}</select>
          </div>
          <div class="v092-field">
            <label>Balance</label>
            <div class="v092-money-input"><span>$</span><input class="input" id="acctBalance" type="number" inputmode="decimal" step="0.01" value="${data?.balance ?? ''}" placeholder="0.00"></div>
          </div>
          <div class="v092-field v092-include-field">
            <label>Net worth</label>
            <button type="button" class="v092-include-toggle ${data?.includeNetWorth===false ? '' : 'on'}" id="acctInclude" onclick="this.classList.toggle('on')"><span></span><b>Include</b></button>
          </div>
        </div>
      </section>
      <details class="v092-card v092-details" ${data?.institution || data?.notes ? 'open' : ''}>
        <summary><span>Optional details</span><i>Institution, date, notes</i></summary>
        <div class="v092-details-grid">
          <div class="v092-field">
            <label>Institution</label>
            <input class="input" id="acctInstitution" value="${esc(data?.institution || '')}" placeholder="Optional">
          </div>
          <div class="v092-field">
            <label>Updated</label>
            <input class="input" id="acctUpdated" type="date" value="${esc(String(data?.updatedAt || new Date().toISOString().slice(0,10)).slice(0,10))}">
          </div>
          <div class="v092-field v092-notes-field">
            <label>Notes</label>
            <textarea class="input" id="acctNotes" placeholder="Optional">${esc(data?.notes || '')}</textarea>
          </div>
        </div>
      </details>
      <div class="drawer-actions v092-actions">
        <button class="btn" onclick="closeDrawer()">Cancel</button>
        <button class="btn btn-primary" onclick="saveAccount('${esc(data?.id || '')}')">Save</button>
        ${data?.id ? `<button class="btn btn-danger" onclick="deleteTrackerItem('accounts','${esc(data.id)}', {closeDrawer:true})">Delete</button>` : ''}
      </div>
    </div>`;

    requestAnimationFrame(() => {
      const first = body.querySelector('[data-autofocus]');
      if(first && window.matchMedia('(pointer:fine)').matches){ first.focus({preventScroll:true}); if(first.select) first.select(); }
      v092SetAccountGroup(currentGroup, currentType, true);
    });
  }

  window.v092SetAccountGroup = function(groupId, desiredType='', skipTitle=false){
    const group = groupMeta(groupId);
    const hidden = document.getElementById('acctGroup');
    const select = document.getElementById('acctType');
    const chips = document.getElementById('v092AcctGroupChips');
    if(hidden) hidden.value = group.id;
    if(chips){
      [...chips.querySelectorAll('button')].forEach(btn => btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === group.label.toLowerCase()));
    }
    if(select){
      const current = desiredType || select.value;
      select.innerHTML = group.types.map(type => `<option ${type===current?'selected':''}>${esc(type)}</option>`).join('');
      if(![...select.options].some(opt => opt.value === current)) select.value = group.types[0] || 'Other Asset';
    }
    if(!skipTitle) v092SyncAccountTitle();
  };

  window.v092SyncAccountTitle = function(){
    const type = document.getElementById('acctType')?.value || 'Checking';
    const editing = document.getElementById('drawer')?.dataset.v092EditingAccount === '1';
    const title = document.getElementById('drawerTitle');
    if(title) title.textContent = `${editing ? 'Edit' : 'Add'} ${accountTitleFromType(type)}`;
  };

  function wrapDrawer(){
    const oldOpen = window.openDrawer;
    if(typeof oldOpen === 'function' && !oldOpen.__v092Wrapped){
      window.openDrawer = function(type, data){
        if(type === 'account') return compactAccountDrawer(data || null);
        const drawer = document.getElementById('drawer');
        if(drawer) delete drawer.dataset.v092EditingAccount;
        drawer?.classList.remove('v092-account-drawer','v09-account-drawer');
        ensureDefaultDrawerHead();
        return oldOpen.apply(this, arguments);
      };
      window.openDrawer.__v092Wrapped = true;
    }

    const oldClose = window.closeDrawer;
    if(typeof oldClose === 'function' && !oldClose.__v092Wrapped){
      window.closeDrawer = function(){
        const drawer = document.getElementById('drawer');
        if(drawer) delete drawer.dataset.v092EditingAccount;
        drawer?.classList.remove('v092-account-drawer','v09-account-drawer');
        return oldClose.apply(this, arguments);
      };
      window.closeDrawer.__v092Wrapped = true;
    }
  }

  function wrapRender(){
    const oldRender = window.renderAll;
    if(typeof oldRender === 'function' && !oldRender.__v092Wrapped){
      window.renderAll = function(){
        const result = oldRender.apply(this, arguments);
        requestAnimationFrame(markBuild);
        return result;
      };
      window.renderAll.__v092Wrapped = true;
    }
  }

  function init(){
    markBuild();
    wrapDrawer();
    wrapRender();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(init, 250);
})();
