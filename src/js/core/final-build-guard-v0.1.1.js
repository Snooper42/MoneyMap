/* MoneyMap final build guard v0.1.1 — prevents old patch layers from relabeling the live build. */
(function(){
  'use strict';
  var BUILD=(window.MoneyMapConfig&&window.MoneyMapConfig.buildId)||'v0.1.1';
  function mark(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var meta=document.querySelector('meta[name="moneymap-build"]'); if(meta) meta.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }
  mark();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mark); else requestAnimationFrame(mark);
  window.addEventListener('pageshow',mark,{passive:true});
  window.addEventListener('focus',mark,{passive:true});
  setTimeout(mark,120);
  setTimeout(mark,1300);
  setInterval(mark,2000);
})();
