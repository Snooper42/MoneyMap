(function(){
  'use strict';
  const BUILD_ID='v0.9.8', STORAGE_KEY='moneymap_v1';
  window.MoneyMapConfig=Object.freeze({buildId:BUILD_ID,expectedBuild:BUILD_ID,storageKey:STORAGE_KEY,releaseName:'Touch gestures + keyboard-aware forms',cacheBust:BUILD_ID,localOnly:true});
  window.MONEYMAP_EXPECTED_BUILD=BUILD_ID;
  window.MoneyMap={version:BUILD_ID,storageKey:STORAGE_KEY,config:window.MoneyMapConfig};
  function markBuild(){try{document.documentElement.setAttribute('data-moneymap-build',BUILD_ID);const m=document.querySelector('meta[name="moneymap-build"]');if(m)m.setAttribute('content',BUILD_ID);document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(el=>{el.textContent=BUILD_ID;});}catch(e){}}
  window.MoneyMapConfigMarkBuild=markBuild;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markBuild);else markBuild();
})();
