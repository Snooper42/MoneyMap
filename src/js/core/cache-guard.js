/* MoneyMap cache guard.
   Split from app.js in v0.8 so build checks are isolated from feature code. */
(function(){
  'use strict';

  const BUILD = window.MoneyMapConfig?.buildId || window.MONEYMAP_EXPECTED_BUILD || 'v0.8';
  const RELOAD_KEY = 'moneymap-cache-reload-' + BUILD;
  const STYLE_ID = 'moneymap-cache-guard-style';

  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD = BUILD;
      document.documentElement.setAttribute('data-moneymap-build', BUILD);
      const meta = document.querySelector('meta[name="moneymap-build"]');
      if(meta) meta.setAttribute('content', BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el => { el.textContent = BUILD; });
    }catch(e){}
  }

  function currentStateBuild(){
    try{ return (typeof APP_BUILD_ID !== 'undefined') ? APP_BUILD_ID : BUILD; }
    catch(e){ return BUILD; }
  }

  function injectStyle(){
    const css = `
      .cache-reset-notice{
        position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:99999;
        max-width:720px;margin:0 auto;padding:14px 16px;border-radius:18px;
        background:var(--panel,#111827);border:1px solid var(--line,rgba(148,163,184,.25));
        box-shadow:0 18px 60px rgba(0,0,0,.35);color:var(--text,#e5e7eb);display:none;gap:12px;align-items:center;justify-content:space-between;
      }
      .cache-reset-notice.active{display:flex;}
      .cache-reset-notice b{display:block;margin-bottom:2px;}
      .cache-reset-notice span{display:block;color:var(--muted,#9ca3af);font-size:13px;line-height:1.35;}
      .cache-reset-notice button{border:0;border-radius:999px;padding:9px 12px;font-weight:800;background:var(--accent,#fb923c);color:#061018;cursor:pointer;white-space:nowrap;}
      @media(max-width:640px){.cache-reset-notice{align-items:stretch;flex-direction:column;bottom:calc(82px + env(safe-area-inset-bottom));}.cache-reset-notice button{width:100%;}}
    `;
    let style = document.getElementById(STYLE_ID);
    if(!style){ style = document.createElement('style'); style.id = STYLE_ID; document.head.appendChild(style); }
    if(style.textContent !== css) style.textContent = css;
  }

  function hideNotice(){
    const notice = document.getElementById('cacheResetNotice');
    if(notice) notice.remove();
  }

  function unregisterWorkersAndCaches(){
    try{
      if('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => {
          const scope = String(reg.scope || '');
          if(!scope || scope.includes(location.origin)) reg.unregister().catch(()=>{});
        })).catch(()=>{});
      }
    }catch(e){}
    try{
      if(window.caches && caches.keys){
        caches.keys().then(keys => keys.forEach(key => {
          if(/moneymap|money-map|workbox|precache|runtime/i.test(key)) caches.delete(key).catch(()=>{});
        })).catch(()=>{});
      }
    }catch(e){}
  }

  function showCacheNotice(current){
    try{
      injectStyle();
      let notice = document.getElementById('cacheResetNotice');
      if(!notice){
        notice = document.createElement('div');
        notice.id = 'cacheResetNotice';
        notice.className = 'cache-reset-notice';
        notice.innerHTML = `<div><b>Cached files detected</b><span>MoneyMap loaded mixed assets: ${window.MoneyMapSecurity ? window.MoneyMapSecurity.escape(current || 'unknown') : 'unknown'} instead of ${window.MoneyMapSecurity ? window.MoneyMapSecurity.escape(BUILD) : BUILD}. Reload once to finish the update.</span></div><button type="button">Reload</button>`;
        document.body.appendChild(notice);
        notice.querySelector('button')?.addEventListener('click', () => forceReload(true));
      }
      notice.classList.add('active');
    }catch(e){}
  }

  function forceReload(userInitiated){
    try{ unregisterWorkersAndCaches(); }catch(e){}
    try{ if(!userInitiated) sessionStorage.setItem(RELOAD_KEY, '1'); }catch(e){}
    const url = new URL(location.href);
    url.searchParams.set('mmcache', BUILD + '-' + Date.now());
    location.replace(url.toString());
  }

  function verifyAssets(){
    markBuild();
    unregisterWorkersAndCaches();
    const stateBuild = currentStateBuild();
    const stale = stateBuild && BUILD && stateBuild !== BUILD;
    if(!stale){ hideNotice(); return; }
    let alreadyReloaded = false;
    try{ alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === '1'; }catch(e){}
    if(!alreadyReloaded){ forceReload(false); return; }
    showCacheNotice(stateBuild);
  }

  function wrapRender(){
    const priorRenderAll = window.renderAll;
    if(typeof priorRenderAll === 'function' && !priorRenderAll.__cacheGuardWrapped){
      window.renderAll = function(){ const out = priorRenderAll.apply(this, arguments); requestAnimationFrame(verifyAssets); return out; };
      window.renderAll.__cacheGuardWrapped = true;
    }
    const priorShowView = window.showView;
    if(typeof priorShowView === 'function' && !priorShowView.__cacheGuardWrapped){
      window.showView = function(){ const out = priorShowView.apply(this, arguments); requestAnimationFrame(verifyAssets); return out; };
      window.showView.__cacheGuardWrapped = true;
    }
  }

  wrapRender();
  document.addEventListener('DOMContentLoaded', verifyAssets);
  window.addEventListener('pageshow', verifyAssets, {passive:true});
  window.addEventListener('focus', verifyAssets, {passive:true});
  setTimeout(verifyAssets, 80);
  setTimeout(verifyAssets, 1200);
  markBuild();
})();
