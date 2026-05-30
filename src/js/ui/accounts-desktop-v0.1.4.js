/* MoneyMap v0.1.4 — desktop accounts polish, local clickable net-worth dots, and custom account icons. */
(function(){
  'use strict';

  var BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || window.MONEYMAP_EXPECTED_BUILD || 'v0.1.4';
  window.MoneyMapUseAccountsDesktopV014 = true;
  window.MoneyMapAccountsDesktopReady = BUILD;
  var models = {};

  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>'"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]; });
  }
  function n(value){ return typeof nval === 'function' ? nval(value) : (Number(value) || 0); }
  function fmtMoney(value){ return typeof money === 'function' ? money(n(value)) : '$' + n(value).toLocaleString(undefined,{maximumFractionDigits:2}); }
  function fmtDate(value){ return typeof dateFmt === 'function' ? dateFmt(value) : String(value || ''); }
  function css(name, fallback){
    try{ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
    catch(e){ return fallback; }
  }
  function font(){
    try{ return getComputedStyle(document.body).fontFamily; }
    catch(e){ return 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'; }
  }
  function roundRectPath(ctx,x,y,w,h,r){
    var rr=Math.min(r,Math.max(0,w/2),Math.max(0,h/2));
    ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
  }
  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var meta=document.querySelector('meta[name="moneymap-build"]'); if(meta) meta.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }

  var ICONS = [
    {id:'bank', label:'Bank', group:'cash', svg:'<svg viewBox="0 0 24 24"><path d="M3 10h18"/><path d="M5 10v8"/><path d="M9 10v8"/><path d="M15 10v8"/><path d="M19 10v8"/><path d="M4 18h16"/><path d="M12 4 4 8h16z"/></svg>'},
    {id:'wallet', label:'Wallet', group:'cash', svg:'<svg viewBox="0 0 24 24"><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h13"/><path d="M16 13h5"/><path d="M17.5 13.1h.1"/></svg>'},
    {id:'piggy', label:'Savings', group:'cash', svg:'<svg viewBox="0 0 24 24"><path d="M7 13h.01"/><path d="M19 9.5 21 8v5l-2-1.5"/><path d="M3 12a6 6 0 0 1 6-6h5a5 5 0 0 1 0 10H8l-1.5 3H4l1-3a6 6 0 0 1-2-4Z"/><path d="M10 6V4h4v2"/></svg>'},
    {id:'chart', label:'Brokerage', group:'investments', svg:'<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/><path d="M17 7h2v2"/></svg>'},
    {id:'retirement', label:'Retirement', group:'investments', svg:'<svg viewBox="0 0 24 24"><path d="M12 21c4-4 7-8 7-12a7 7 0 1 0-14 0c0 4 3 8 7 12Z"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>'},
    {id:'crypto', label:'Crypto', group:'investments', svg:'<svg viewBox="0 0 24 24"><path d="M12 3 4 8l8 13 8-13z"/><path d="M4 8h16"/><path d="m8 8 4 13 4-13"/></svg>'},
    {id:'home', label:'Home', group:'property', svg:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/></svg>'},
    {id:'car', label:'Vehicle', group:'property', svg:'<svg viewBox="0 0 24 24"><path d="M5 16h14"/><path d="M6 16l1.5-5h9L18 16"/><path d="M7 19h.01"/><path d="M17 19h.01"/><path d="M5 16v3"/><path d="M19 16v3"/></svg>'},
    {id:'diamond', label:'Valuable', group:'valuables', svg:'<svg viewBox="0 0 24 24"><path d="m12 21 8-12-4-5H8L4 9z"/><path d="M4 9h16"/><path d="m8 4 4 17 4-17"/></svg>'},
    {id:'card', label:'Card', group:'liabilities', svg:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>'},
    {id:'loan', label:'Loan', group:'liabilities', svg:'<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>'},
    {id:'tag', label:'Other', group:'other', svg:'<svg viewBox="0 0 24 24"><path d="M4 12V5h7l9 9-7 7z"/><path d="M8.5 8.5h.01"/></svg>'}
  ];
  var ICON_MAP = ICONS.reduce(function(map, icon){ map[icon.id]=icon; return map; }, {});
  var TYPE_ICON = {
    Checking:'bank', Savings:'piggy', Cash:'wallet', 'Money Market':'piggy', Brokerage:'chart', Retirement:'retirement', HSA:'retirement', 'Crypto Wallet':'crypto', Property:'home', Vehicle:'car', Collectibles:'diamond', Jewelry:'diamond', 'Precious Metals':'diamond', Art:'diamond', 'Other Asset':'tag', 'Credit Card':'card', Loan:'loan', 'Student Loan':'loan', Mortgage:'home', 'Auto Loan':'car', 'Other Liability':'loan'
  };

  function isLiability(type){
    if(typeof accountIsLiability === 'function') return accountIsLiability(type);
    return /credit|loan|debt|mortgage|liability/i.test(String(type||''));
  }
  function signed(a){
    if(typeof accountSignedValue === 'function') return accountSignedValue(a);
    var bal=Math.abs(n(a && a.balance));
    return isLiability(a && a.type) ? -bal : n(a && a.balance);
  }
  function groupForAccount(a){
    var explicit=ICON_MAP[a && a.iconKey];
    if(explicit && explicit.group) return explicit.group;
    var text=String((a && a.type) || '') + ' ' + String((a && a.name) || '');
    text=text.toLowerCase();
    if(/credit|loan|debt|mortgage|liability/.test(text)) return 'liabilities';
    if(/brokerage|retirement|ira|401|403|hsa|investment|crypto/.test(text)) return 'investments';
    if(/property|home|house|vehicle|auto|car|boat|rv/.test(text)) return 'property';
    if(/collectible|jewel|watch|gold|silver|precious|metal|art|coin|card|memorabilia|valuable/.test(text)) return 'valuables';
    if(/checking|savings|cash|money market|wallet/.test(text)) return 'cash';
    return 'other';
  }
  var GROUPS = [
    {id:'cash', label:'Cash', icon:'wallet'},
    {id:'investments', label:'Investments', icon:'chart'},
    {id:'property', label:'Property', icon:'home'},
    {id:'valuables', label:'Valuables', icon:'diamond'},
    {id:'liabilities', label:'Debt', icon:'card'},
    {id:'other', label:'Other', icon:'tag'}
  ];
  function groupLabel(id){ var g=GROUPS.find(function(x){ return x.id===id; }); return g ? g.label : 'Other'; }
  function defaultIconKey(a){
    return (a && a.iconKey && ICON_MAP[a.iconKey]) ? a.iconKey : (TYPE_ICON[(a && a.type) || ''] || GROUPS.find(function(g){ return g.id===groupForAccount(a); })?.icon || 'bank');
  }
  function iconMarkup(keyOrAccount, extra){
    var key=typeof keyOrAccount === 'string' ? keyOrAccount : defaultIconKey(keyOrAccount || {});
    var icon=ICON_MAP[key] || ICON_MAP.bank;
    var group=(typeof keyOrAccount === 'string') ? icon.group : groupForAccount(keyOrAccount || {});
    return '<span class="mm-acct-icon-v014 '+esc(group)+' '+esc(extra||'')+'" title="'+esc(icon.label)+'">'+icon.svg+'</span>';
  }
  window.MoneyMapAccountIcons = {icons:ICONS, iconMarkup:iconMarkup, defaultIconKey:defaultIconKey, groupForAccount:groupForAccount};

  function includedAccounts(){ return (window.state && Array.isArray(state.accounts) ? state.accounts : []).filter(function(a){ return a.includeNetWorth !== false; }); }
  function netWorthBreak(){
    if(typeof netWorthBreakdown === 'function') return netWorthBreakdown();
    var assets=includedAccounts().reduce(function(s,a){ return s+Math.max(0,signed(a)); },0);
    var liabilities=includedAccounts().reduce(function(s,a){ return s+Math.abs(Math.min(0,signed(a))); },0);
    return {assets:assets, liabilities:liabilities, netWorth:assets-liabilities};
  }
  function currentRows(){
    var rows=((state && state.netWorthHistory) || []).slice().sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); }).filter(function(row){ return row && row.date; });
    if(!rows.length){
      var b=netWorthBreak();
      rows.push({id:'live', date:new Date().toISOString().slice(0,10), netWorth:b.netWorth, assets:b.assets, liabilities:b.liabilities, note:'Current live value', accountSnapshot:includedAccounts().map(function(a){ return {name:a.name,type:a.type,institution:a.institution,balance:a.balance,iconKey:defaultIconKey(a)}; })});
    }
    return rows.slice(-18);
  }
  function snapshotAccounts(entry){ return Array.isArray(entry && entry.accountSnapshot) ? entry.accountSnapshot : []; }
  function accountSnapshotRow(a){
    var liab=isLiability(a.type);
    var val=liab ? -Math.abs(n(a.balance)) : n(a.balance);
    return '<div class="mm-nw-tip-account-v014"><span>'+esc(a.name || a.type || 'Account')+'</span><b class="'+(val<0?'bad':'')+'">'+fmtMoney(val)+'</b></div>';
  }
  function changeFor(rows, idx){
    var current=rows[idx];
    var prev=idx>0 ? rows[idx-1] : null;
    var delta=prev ? n(current.netWorth)-n(prev.netWorth) : null;
    return {current:current, prev:prev, delta:delta};
  }
  function accountChanges(prev, current){
    var prior=snapshotAccounts(prev);
    var next=snapshotAccounts(current);
    var map={};
    prior.forEach(function(a){ var key=String(a.name||a.type||'Account').toLowerCase(); map[key]=map[key]||{name:a.name||a.type||'Account', before:0, after:0}; map[key].before += isLiability(a.type) ? -Math.abs(n(a.balance)) : n(a.balance); });
    next.forEach(function(a){ var key=String(a.name||a.type||'Account').toLowerCase(); map[key]=map[key]||{name:a.name||a.type||'Account', before:0, after:0}; map[key].after += isLiability(a.type) ? -Math.abs(n(a.balance)) : n(a.balance); });
    return Object.values(map).map(function(x){ return {name:x.name, delta:x.after-x.before, before:x.before, after:x.after}; }).filter(function(x){ return Math.abs(x.delta) >= .005; }).sort(function(a,b){ return Math.abs(b.delta)-Math.abs(a.delta); });
  }

  function drawNetWorthChart(canvasId, options){
    options=options || {};
    var canvas=document.getElementById(canvasId);
    if(!canvas) return;
    var wrap=canvas.parentElement;
    if(!wrap) return;
    var visible=!!canvas.offsetParent || options.force;
    if(!visible) return;
    var rect=wrap.getBoundingClientRect();
    var dpr=window.devicePixelRatio || 1;
    var cssW=Math.max(360, rect.width || 680);
    var cssH=Math.max(options.height || 270, rect.height || options.height || 270);
    canvas.width=Math.round(cssW*dpr);
    canvas.height=Math.round(cssH*dpr);
    canvas.style.width='100%';
    canvas.style.height=cssH+'px';
    var ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var w=cssW, h=cssH;
    ctx.clearRect(0,0,w,h);
    var rows=currentRows();
    var values=rows.map(function(r){ return n(r.netWorth); });
    var min=Math.min.apply(null, values), max=Math.max.apply(null, values);
    if(!Number.isFinite(min) || !Number.isFinite(max)){ min=0; max=1; }
    if(min===max){ min-=Math.max(100, Math.abs(max)*.08); max+=Math.max(100, Math.abs(max)*.08); }
    var pad={l:70,r:28,t:22,b:42};
    var yMin=Math.floor((min-(max-min)*.10)/100)*100;
    var yMax=Math.ceil((max+(max-min)*.10)/100)*100;
    if(yMin===yMax){ yMin-=100; yMax+=100; }
    var xFor=function(i){ return rows.length===1 ? pad.l+(w-pad.l-pad.r)/2 : pad.l+(w-pad.l-pad.r)*(i/(rows.length-1)); };
    var yFor=function(v){ return pad.t+(h-pad.t-pad.b)*(1-(n(v)-yMin)/(yMax-yMin || 1)); };
    var activeIdx=models[canvasId] && Number.isInteger(models[canvasId].activeIdx) ? models[canvasId].activeIdx : null;
    var blue=css('--blue', '#38bdf8');
    var grid=css('--line', 'rgba(148,163,184,.22)');
    var muted=css('--muted', '#64748b');
    var text=css('--text', '#111827');

    ctx.lineWidth=1;
    ctx.font='11px '+font();
    ctx.textBaseline='middle';
    [0,.25,.5,.75,1].forEach(function(t){
      var v=yMin+(yMax-yMin)*t, y=yFor(v);
      ctx.strokeStyle=grid;
      ctx.globalAlpha=.62;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
      ctx.globalAlpha=1;
      ctx.fillStyle=muted;
      ctx.fillText(fmtMoney(v), 8, y);
    });

    if(activeIdx !== null && rows[activeIdx]){
      var ax=xFor(activeIdx);
      ctx.strokeStyle='rgba(100,116,139,.42)';
      ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(ax,pad.t); ctx.lineTo(ax,h-pad.b); ctx.stroke(); ctx.setLineDash([]);
    }

    var grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);
    grad.addColorStop(0,'rgba(56,189,248,.24)');
    grad.addColorStop(.65,'rgba(56,189,248,.07)');
    grad.addColorStop(1,'rgba(56,189,248,0)');
    ctx.fillStyle=grad;
    ctx.beginPath();
    rows.forEach(function(row,i){ var x=xFor(i), y=yFor(row.netWorth); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
    ctx.lineTo(xFor(rows.length-1),h-pad.b); ctx.lineTo(xFor(0),h-pad.b); ctx.closePath(); ctx.fill();

    ctx.strokeStyle=blue;
    ctx.lineWidth=3;
    ctx.lineJoin='round';
    ctx.lineCap='round';
    ctx.beginPath();
    rows.forEach(function(row,i){ var x=xFor(i), y=yFor(row.netWorth); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
    ctx.stroke();

    rows.forEach(function(row,i){
      var x=xFor(i), y=yFor(row.netWorth), active=activeIdx===i;
      if(active){ ctx.fillStyle='rgba(56,189,248,.18)'; ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.fill(); }
      ctx.fillStyle=blue; ctx.beginPath(); ctx.arc(x,y,active?6.5:5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=css('--panel', '#fff'); ctx.lineWidth=2.5; ctx.stroke();
    });

    ctx.fillStyle=muted;
    ctx.font='12px '+font();
    ctx.textBaseline='alphabetic';
    rows.forEach(function(row,i){
      if(rows.length>8 && i%2) return;
      var label=fmtDate(row.date).split(',')[0];
      var x=Math.max(0,Math.min(w-56,xFor(i)-22));
      ctx.fillText(label,x,h-12);
    });

    models[canvasId]={canvas:canvas, wrap:wrap, rows:rows, pad:pad, width:w, height:h, xFor:xFor, yFor:yFor, yMin:yMin, yMax:yMax, activeIdx:activeIdx};
    bindChart(canvasId);
  }

  function hit(canvasId, clientX, clientY){
    var model=models[canvasId]; if(!model) return null;
    var rect=model.canvas.getBoundingClientRect();
    var x=(clientX-rect.left)*(model.width/rect.width);
    var y=(clientY-rect.top)*(model.height/rect.height);
    var best=null, bestDist=Infinity;
    model.rows.forEach(function(row,i){
      var dx=model.xFor(i)-x, dy=model.yFor(row.netWorth)-y;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(d<bestDist){ best=i; bestDist=d; }
    });
    if(bestDist<=34) return best;
    if(x>=model.pad.l-24 && x<=model.width-model.pad.r+24 && y>=model.pad.t-28 && y<=model.height-model.pad.b+34){
      var nearest=null, nearestX=Infinity;
      model.rows.forEach(function(row,i){ var d=Math.abs(model.xFor(i)-x); if(d<nearestX){ nearest=i; nearestX=d; } });
      return nearestX<=40 ? nearest : null;
    }
    return null;
  }
  function positionTip(model, idx, tip){
    var wrap=model.wrap;
    var x=model.xFor(idx), y=model.yFor(model.rows[idx].netWorth);
    var canvasRect=model.canvas.getBoundingClientRect();
    var scaleX=canvasRect.width/model.width, scaleY=canvasRect.height/model.height;
    var pxX=x*scaleX, pxY=y*scaleY;
    var wrapW=wrap.clientWidth || canvasRect.width;
    var tipW=tip.offsetWidth || 310;
    var left=Math.max(8, Math.min(wrapW-tipW-8, pxX-tipW/2));
    var top=pxY-(tip.offsetHeight||140)-18;
    if(top<6) top=pxY+22;
    tip.style.left=left+'px';
    tip.style.top=top+'px';
    tip.style.setProperty('--arrow-x', Math.max(18, Math.min(tipW-18, pxX-left))+'px');
  }
  function showTip(canvasId, idx, persist){
    var model=models[canvasId]; if(!model || !model.rows[idx]) return;
    var old=model.wrap.querySelector('.mm-nw-popover-v014');
    if(old) old.remove();
    var row=model.rows[idx];
    var ch=changeFor(model.rows, idx);
    var delta=ch.delta;
    var dateTitle=ch.prev ? (fmtDate(ch.prev.date).split(',')[0]+' - '+fmtDate(row.date).split(',')[0]) : fmtDate(row.date).split(',')[0];
    var accounts=snapshotAccounts(row).slice(0,3).map(accountSnapshotRow).join('');
    var tip=document.createElement('div');
    tip.className='mm-nw-popover-v014';
    tip.dataset.persist=persist?'1':'0';
    tip.innerHTML='<div class="mm-nw-tip-title-v014"><span>'+esc(dateTitle)+'</span><button type="button" aria-label="Close" data-mm-nw-close="1">×</button></div>'+
      '<div class="mm-nw-tip-values-v014"><div><span>Net worth</span><b>'+fmtMoney(row.netWorth)+'</b></div><div><span>Change</span><b class="'+(delta===null?'':(delta>=0?'good':'bad'))+'">'+(delta===null?'—':((delta>=0?'+':'')+fmtMoney(delta)))+'</b></div></div>'+
      (accounts ? '<div class="mm-nw-tip-accounts-v014">'+accounts+'</div>' : '')+
      '<div class="mm-nw-tip-local-v014">Local snapshot detail only. Nothing is sent anywhere.</div>';
    model.wrap.appendChild(tip);
    tip.querySelector('[data-mm-nw-close]')?.addEventListener('click', function(event){ event.stopPropagation(); hideTips(); models[canvasId].activeIdx=null; drawNetWorthChart(canvasId, {force:true}); });
    requestAnimationFrame(function(){ positionTip(model, idx, tip); });
  }
  function hideTips(){ document.querySelectorAll('.mm-nw-popover-v014').forEach(function(tip){ tip.remove(); }); }
  function activate(canvasId, idx, persist){
    if(idx === null || idx === undefined) return;
    if(models[canvasId]) models[canvasId].activeIdx=idx;
    drawNetWorthChart(canvasId, {force:true});
    showTip(canvasId, idx, persist);
  }
  function bindChart(canvasId){
    var model=models[canvasId]; if(!model || model.canvas.dataset.v014Bound) return;
    var canvas=model.canvas;
    canvas.dataset.v014Bound='1';
    canvas.addEventListener('mousemove', function(event){
      var idx=hit(canvasId,event.clientX,event.clientY);
      if(idx===null){ if(!canvas.dataset.v014Pinned){ if(models[canvasId]) models[canvasId].activeIdx=null; hideTips(); drawNetWorthChart(canvasId,{force:true}); } return; }
      canvas.dataset.v014Hover=String(idx);
      if(!canvas.dataset.v014Pinned) activate(canvasId, idx, false);
    });
    canvas.addEventListener('mouseleave', function(){
      if(canvas.dataset.v014Pinned) return;
      if(models[canvasId]) models[canvasId].activeIdx=null;
      hideTips(); drawNetWorthChart(canvasId,{force:true});
    });
    canvas.addEventListener('click', function(event){
      var idx=hit(canvasId,event.clientX,event.clientY);
      if(idx===null){ delete canvas.dataset.v014Pinned; hideTips(); if(models[canvasId]) models[canvasId].activeIdx=null; drawNetWorthChart(canvasId,{force:true}); return; }
      canvas.dataset.v014Pinned='1';
      activate(canvasId, idx, true);
      event.stopPropagation();
    });
    canvas.addEventListener('touchend', function(event){
      var t=event.changedTouches && event.changedTouches[0]; if(!t) return;
      var idx=hit(canvasId,t.clientX,t.clientY); if(idx===null) return;
      canvas.dataset.v014Pinned='1';
      activate(canvasId, idx, true);
      event.preventDefault();
    }, {passive:false});
    canvas.addEventListener('focus', function(){ var rows=models[canvasId]?.rows || []; if(rows.length) activate(canvasId, rows.length-1, false); });
    canvas.addEventListener('blur', function(){ delete canvas.dataset.v014Pinned; hideTips(); });
  }

  /* Net-worth point popovers are local display only. No explain action is exposed. */
  var oldRenderNetWorth=window.renderNetWorthChart;
  window.renderNetWorthChart=function(){ drawNetWorthChart('netWorthCanvas', {height:260}); };

  function accountGroupSummary(accounts, id){
    var items=accounts.filter(function(a){ return groupForAccount(a)===id; });
    var included=items.filter(function(a){ return a.includeNetWorth!==false; });
    var value=included.reduce(function(sum,a){ return sum+signed(a); },0);
    return {id:id, items:items, included:included, value:value};
  }
  function accountCard(a){
    var val=signed(a), included=a.includeNetWorth!==false;
    return '<button type="button" class="mm-account-row-v014" onclick="openDrawer(\'account\', findById(\'accounts\',\''+esc(a.id)+'\'))">'+
      iconMarkup(a)+
      '<span class="mm-account-copy-v014"><h4>'+esc(a.name||'Account')+'</h4><p>'+esc(a.institution||'Manual')+' · '+esc(a.type||'Account')+'</p></span>'+
      '<span class="mm-account-value-v014"><strong class="'+(val<0?'bad':'good')+'">'+fmtMoney(val)+'</strong><span>'+(included?'Included':'Excluded')+' · '+esc(fmtDate(String(a.updatedAt||'').slice(0,10)) || 'not dated')+'</span></span>'+
      '</button>';
  }
  function groupedAccountHtml(accounts){
    if(!accounts.length) return '<div class="mm-account-empty-v014"><div><b>No accounts yet.</b><p>Add checking, savings, investments, property, cards, or loans.</p><button class="btn btn-primary" onclick="openDrawer(\'account\')">Add account</button></div></div>';
    return GROUPS.map(function(group){
      var summary=accountGroupSummary(accounts, group.id);
      if(!summary.items.length) return '';
      return '<section class="mm-account-group-v014"><div class="mm-account-group-head-v014"><div class="mm-account-group-title-v014">'+iconMarkup(group.icon, group.id)+'<div><b>'+esc(group.label)+'</b><span>'+summary.items.length+' account'+(summary.items.length===1?'':'s')+' · '+summary.included.length+' included</span></div></div><strong class="mm-account-group-total-v014 '+(summary.value<0?'bad':'good')+'">'+fmtMoney(summary.value)+'</strong></div><div class="mm-account-card-list-v014">'+summary.items.sort(function(a,b){ return Math.abs(signed(b))-Math.abs(signed(a)); }).map(accountCard).join('')+'</div></section>';
    }).join('');
  }
  function summaryHtml(accounts, b){
    var total=Math.max(1, Math.abs(n(b.assets))+Math.abs(n(b.liabilities)));
    var assetPct=Math.max(0,Math.min(100,Math.abs(n(b.assets))/total*100));
    var debtPct=Math.max(0,Math.min(100,Math.abs(n(b.liabilities))/total*100));
    var rows=GROUPS.map(function(g){ return accountGroupSummary(accounts,g.id); }).filter(function(s){ return s.items.length; });
    return '<div class="mm-summary-tabs-v014"><button type="button" class="active">Totals</button><button type="button" onclick="showView(\'networth\')">History</button></div>'+
      '<div class="mm-summary-block-v014"><div class="mm-summary-row-v014"><span>Assets</span><b>'+fmtMoney(b.assets)+'</b></div><div class="mm-summary-bar-v014"><i class="assets" style="width:'+assetPct.toFixed(2)+'%"></i><i class="liabilities" style="width:'+debtPct.toFixed(2)+'%"></i></div><div class="mm-summary-row-v014"><span>Liabilities</span><b class="bad">'+fmtMoney(b.liabilities)+'</b></div></div>'+
      '<div class="mm-summary-block-v014">'+rows.map(function(s){ return '<div class="mm-summary-row-v014"><span>'+iconMarkup(GROUPS.find(function(g){return g.id===s.id;})?.icon || 'tag', s.id)+esc(groupLabel(s.id))+'</span><b class="'+(s.value<0?'bad':'good')+'">'+fmtMoney(s.value)+'</b></div>'; }).join('')+'</div>'+
      '<div class="mm-summary-block-v014"><button class="btn btn-primary" style="width:100%" onclick="exportTrackerCsv(\'accounts\')">Download CSV</button></div>';
  }
  function deltaLabel(rows){
    if(rows.length<2) return 'No prior snapshot yet';
    var latest=rows[rows.length-1], prev=rows[rows.length-2];
    var delta=n(latest.netWorth)-n(prev.netWorth);
    return (delta>=0?'+':'−')+fmtMoney(Math.abs(delta))+' since '+fmtDate(prev.date).split(',')[0]+' · last snapshot '+fmtDate(latest.date).split(',')[0];
  }
  function ensureAccountsView(){
    var sec=document.getElementById('view-accounts');
    if(!sec){ sec=document.createElement('section'); sec.className='view'; sec.id='view-accounts'; document.getElementById('view-overview')?.after(sec); }
    return sec;
  }
  function renderAccountsDesktop(){
    var sec=ensureAccountsView();
    sec.classList.add('mm-accounts-v014');
    var accounts=(state && state.accounts) ? state.accounts.slice() : [];
    var b=netWorthBreak();
    var rows=currentRows();
    var net=b.netWorth;
    sec.innerHTML='<div class="page-head mm-accounts-head-v014"><div><h2 class="section-title">Accounts</h2><p class="section-sub">Manual balances in a cleaner desktop layout with private local chart popovers and account-specific icons.</p></div><div class="actions"><button class="btn" onclick="showView(\'accounts\'); MoneyMapRefreshAccountChart()">Refresh all</button><button class="btn" onclick="showView(\'networth\')">History</button><button class="btn btn-primary" onclick="openDrawer(\'account\')">Add account</button></div></div>'+
      '<section class="card mm-accounts-chart-card-v014"><div class="mm-accounts-chart-top-v014"><div><span class="mm-accounts-kicker-v014">Net worth</span><strong class="mm-accounts-net-v014 '+(net<0?'bad':'')+'">'+fmtMoney(net)+'</strong><p class="mm-accounts-net-sub-v014">'+esc(deltaLabel(rows))+'</p></div><div class="mm-accounts-chart-controls-v014"><div class="mm-accounts-control-pill-v014">Net worth performance <span>click dots</span></div><div class="mm-accounts-control-pill-v014">Snapshot range <span>'+rows.length+' point'+(rows.length===1?'':'s')+'</span></div></div></div><div class="mm-accounts-chart-wrap-v014"><canvas id="accountsNetWorthCanvas" aria-label="Clickable net worth performance chart" tabindex="0"></canvas></div></section>'+
      '<div class="mm-accounts-grid-v014"><section class="card mm-accounts-list-card-v014"><div class="mm-accounts-list-head-v014"><div><h3>Accounts</h3><p>Click any row to edit its balance, type, and icon.</p></div><button class="btn btn-small" onclick="openDrawer(\'account\')">Add</button></div>'+groupedAccountHtml(accounts)+'</section><aside class="card mm-accounts-summary-v014"><h3>Summary</h3>'+summaryHtml(accounts,b)+'</aside></div>';
    requestAnimationFrame(function(){ drawNetWorthChart('accountsNetWorthCanvas', {height:300, force:true}); });
  }
  window.MoneyMapRefreshAccountChart=function(){ requestAnimationFrame(function(){ drawNetWorthChart('accountsNetWorthCanvas', {height:300, force:true}); drawNetWorthChart('netWorthCanvas', {height:260, force:true}); }); };

  var priorRenderAccounts=window.renderAccountsDashboard;
  window.renderAccountsDashboard=function(){ renderAccountsDesktop(); markBuild(); };

  function iconPickerMarkup(selected){
    return '<div class="v014-icon-picker"><label>Account icon</label><input type="hidden" id="acctIconKey" value="'+esc(selected)+'"><div class="v014-icon-grid">'+ICONS.map(function(icon){ return '<button type="button" class="v014-icon-choice '+(icon.id===selected?'active':'')+'" title="'+esc(icon.label)+'" onclick="MoneyMapSetAccountIcon(\''+esc(icon.id)+'\')">'+iconMarkup(icon.id)+'</button>'; }).join('')+'</div></div>';
  }
  window.MoneyMapSetAccountIcon=function(key){
    var hidden=document.getElementById('acctIconKey'); if(hidden) hidden.value=key;
    document.querySelectorAll('.v014-icon-choice').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('onclick')?.indexOf("'"+key+"'")>-1); });
  };
  function enhanceAccountDrawer(data){
    var body=document.getElementById('drawerBody'); if(!body || document.getElementById('acctIconKey')) return;
    var selected=defaultIconKey(data || {type:document.getElementById('acctType')?.value || 'Checking'});
    var anchor=body.querySelector('.v092-field-group') || body.querySelector('.form-row') || body.firstElementChild;
    if(anchor){ anchor.insertAdjacentHTML('afterend', iconPickerMarkup(selected)); }
    var type=document.getElementById('acctType');
    if(type && !type.dataset.v014IconBound){
      type.dataset.v014IconBound='1';
      type.addEventListener('change', function(){
        var hidden=document.getElementById('acctIconKey');
        if(hidden && !hidden.dataset.userTouched){ MoneyMapSetAccountIcon(defaultIconKey({type:type.value})); }
      });
    }
    document.querySelectorAll('.v014-icon-choice').forEach(function(btn){ btn.addEventListener('click', function(){ var h=document.getElementById('acctIconKey'); if(h) h.dataset.userTouched='1'; }); });
  }
  var priorOpenDrawer=window.openDrawer;
  if(typeof priorOpenDrawer === 'function'){
    window.openDrawer=function(type, data){
      var out=priorOpenDrawer.apply(this, arguments);
      if(type==='account') setTimeout(function(){ enhanceAccountDrawer(data || null); }, 0);
      return out;
    };
  }
  var priorSaveAccount=window.saveAccount;
  if(typeof priorSaveAccount === 'function'){
    window.saveAccount=function(id){
      var iconKey=document.getElementById('acctIconKey')?.value || '';
      var out=priorSaveAccount.apply(this, arguments);
      if(iconKey && state && Array.isArray(state.accounts)){
        var target=id ? state.accounts.find(function(a){ return a.id===id; }) : state.accounts[state.accounts.length-1];
        if(target){ target.iconKey=iconKey; if(typeof saveState==='function') saveState(); }
      }
      if(typeof renderAll === 'function') requestAnimationFrame(renderAll);
      return out;
    };
  }
  var priorSaveSnapshot=window.saveNetWorthSnapshot;
  if(typeof priorSaveSnapshot === 'function'){
    window.saveNetWorthSnapshot=function(){
      var out=priorSaveSnapshot.apply(this, arguments);
      try{
        var rows=(state.netWorthHistory||[]).slice().sort(function(a,b){ return String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date)); });
        var latest=rows[0];
        if(latest && Array.isArray(latest.accountSnapshot)){
          latest.accountSnapshot.forEach(function(snap){
            var acct=(state.accounts||[]).find(function(a){ return String(a.name||'').toLowerCase()===String(snap.name||'').toLowerCase(); });
            if(acct) snap.iconKey=defaultIconKey(acct);
          });
          if(typeof saveState==='function') saveState();
        }
      }catch(e){}
      requestAnimationFrame(function(){ drawNetWorthChart('accountsNetWorthCanvas', {height:300, force:true}); drawNetWorthChart('netWorthCanvas', {height:260, force:true}); });
      return out;
    };
  }

  var priorShowView=window.showView;
  if(typeof priorShowView === 'function'){
    window.showView=function(id){
      var out=priorShowView.apply(this, arguments);
      if(id==='accounts') requestAnimationFrame(renderAccountsDesktop);
      if(id==='networth') requestAnimationFrame(function(){ drawNetWorthChart('netWorthCanvas', {height:260}); });
      return out;
    };
  }
  var priorRenderAll=window.renderAll;
  if(typeof priorRenderAll === 'function'){
    window.renderAll=function(){
      var out=priorRenderAll.apply(this, arguments);
      if(document.getElementById('view-accounts')?.classList.contains('active')) requestAnimationFrame(renderAccountsDesktop);
      requestAnimationFrame(function(){ drawNetWorthChart('netWorthCanvas', {height:260}); });
      markBuild();
      return out;
    };
  }
  window.addEventListener('resize', function(){ requestAnimationFrame(function(){ drawNetWorthChart('accountsNetWorthCanvas', {height:300, force:true}); drawNetWorthChart('netWorthCanvas', {height:260}); }); }, {passive:true});
  document.addEventListener('click', function(event){
    if(!event.target.closest('.mm-nw-popover-v014') && !event.target.closest('canvas')){
      Object.keys(models).forEach(function(id){ if(models[id]) models[id].activeIdx=null; });
      document.querySelectorAll('canvas[data-v014-pinned]').forEach(function(c){ delete c.dataset.v014Pinned; });
      hideTips();
      drawNetWorthChart('accountsNetWorthCanvas', {height:300, force:true});
      drawNetWorthChart('netWorthCanvas', {height:260});
    }
  });
  document.addEventListener('DOMContentLoaded', function(){ markBuild(); requestAnimationFrame(function(){ if(document.getElementById('view-accounts')?.classList.contains('active')) renderAccountsDesktop(); }); });
  setTimeout(function(){ markBuild(); if(document.getElementById('view-accounts')?.classList.contains('active')) renderAccountsDesktop(); }, 350);
  setTimeout(function(){ markBuild(); if(document.getElementById('view-accounts')?.classList.contains('active')) renderAccountsDesktop(); }, 900);
  setTimeout(function(){ markBuild(); if(document.getElementById('view-accounts')?.classList.contains('active')) renderAccountsDesktop(); }, 1800);
})();
