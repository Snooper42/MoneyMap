/* MoneyMap core security helpers.
   These helpers are deliberately small and dependency-free so feature modules can share them. */
(function(){
  'use strict';

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[c]));

  const escapeAttr = value => escape(value).replace(/`/g,'&#96;');

  const normalizeId = value => String(value ?? '')
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,96);

  const safeNumber = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  function safeText(el, value){
    if(el) el.textContent = String(value ?? '');
  }

  function safeUrl(value){
    const raw = String(value || '').trim();
    if(!raw) return '';
    try{
      const url = new URL(raw, location.href);
      if(!['http:', 'https:', 'mailto:'].includes(url.protocol)) return '';
      return url.toString();
    }catch(e){ return ''; }
  }

  function setTrustedHtml(el, html){
    // Internal templates only. User supplied values must be escaped before reaching this function.
    if(el) el.innerHTML = String(html ?? '');
  }

  window.MoneyMapSecurity = Object.freeze({
    escape,
    escapeAttr,
    normalizeId,
    safeNumber,
    safeText,
    safeUrl,
    setTrustedHtml
  });
})();
