/* MoneyMap v0.1.10 — Accounts premium UI redesign. Replaces accounts-desktop-v0.1.9.js. */
(function(){
  'use strict';

  var BUILD = (window.MoneyMapConfig && window.MoneyMapConfig.buildId) || 'v0.1.10';
  window.MoneyMapUseAccountsDesktopV014 = true;
  window.MoneyMapUseAccountsDesktopV017 = true;
  window.MoneyMapAccountsDesktopReady = BUILD;
  var models = {};
  var activeFilter = 'all';

  /* ── helpers ── */
  function esc(v){ return typeof escapeHtml==='function' ? escapeHtml(String(v??'')) : String(v??'').replace(/[&<>'"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
  function n(v){ return typeof nval==='function' ? nval(v) : (Number(v)||0); }
  function fmt(v){ return typeof money==='function' ? money(n(v)) : '$'+n(v).toLocaleString(undefined,{maximumFractionDigits:2}); }
  function dateLbl(v){ return typeof dateFmt==='function' ? dateFmt(v) : String(v||''); }
  function css(name,fb){ try{ return getComputedStyle(document.documentElement).getPropertyValue(name).trim()||fb; }catch(e){ return fb; } }
  function fontFam(){ try{ return getComputedStyle(document.body).fontFamily; }catch(e){ return 'system-ui,sans-serif'; } }
  function markBuild(){
    try{
      window.MONEYMAP_EXPECTED_BUILD=BUILD;
      document.documentElement.setAttribute('data-moneymap-build',BUILD);
      var m=document.querySelector('meta[name="moneymap-build"]'); if(m) m.setAttribute('content',BUILD);
      document.querySelectorAll('#appBuildLabel,[data-build-label]').forEach(function(el){ el.textContent=BUILD; });
    }catch(e){}
  }

  /* ── taxonomy ── */
  var ICONS=[
    {id:'wallet',label:'Cash',group:'cash',svg:'<svg viewBox="0 0 24 24"><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h13"/><path d="M16 13h5"/><path d="M17.5 13.1h.1"/></svg>'},
    {id:'bank',label:'Checking',group:'checking',svg:'<svg viewBox="0 0 24 24"><path d="M3 10h18"/><path d="M5 10v8"/><path d="M9 10v8"/><path d="M15 10v8"/><path d="M19 10v8"/><path d="M4 18h16"/><path d="M12 4 4 8h16z"/></svg>'},
    {id:'piggy',label:'Savings',group:'savings',svg:'<svg viewBox="0 0 24 24"><path d="M7 13h.01"/><path d="M19 9.5 21 8v5l-2-1.5"/><path d="M3 12a6 6 0 0 1 6-6h5a5 5 0 0 1 0 10H8l-1.5 3H4l1-3a6 6 0 0 1-2-4Z"/><path d="M10 6V4h4v2"/></svg>'},
    {id:'chart',label:'Investments',group:'investments',svg:'<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/><path d="M17 7h2v2"/></svg>'},
    {id:'retirement',label:'Retirement',group:'retirement',svg:'<svg viewBox="0 0 24 24"><path d="M12 21c4-4 7-8 7-12a7 7 0 1 0-14 0c0 4 3 8 7 12Z"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>'},
    {id:'home',label:'Property',group:'property',svg:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/></svg>'},
    {id:'car',label:'Vehicle',group:'vehicles',svg:'<svg viewBox="0 0 24 24"><path d="M5 16h14"/><path d="M6 16l1.5-5h9L18 16"/><path d="M7 19h.01"/><path d="M17 19h.01"/><path d="M5 16v3"/><path d="M19 16v3"/></svg>'},
    {id:'box',label:'Collectibles',group:'collectibles',svg:'<svg viewBox="0 0 24 24"><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></svg>'},
    {id:'diamond',label:'Jewelry',group:'jewelry',svg:'<svg viewBox="0 0 24 24"><path d="m12 21 8-12-4-5H8L4 9z"/><path d="M4 9h16"/><path d="m8 4 4 17 4-17"/></svg>'},
    {id:'card',label:'Credit card',group:'credit-cards',svg:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>'},
    {id:'mortgage',label:'Mortgage',group:'mortgage',svg:'<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M9 15h6"/><path d="M9 18h4"/></svg>'},
    {id:'loan',label:'Loan',group:'loans',svg:'<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>'},
    {id:'tag',label:'Other',group:'other-assets',svg:'<svg viewBox="0 0 24 24"><path d="M4 12V5h7l9 9-7 7z"/><path d="M8.5 8.5h.01"/></svg>'}
  ];
  var ICON_MAP=ICONS.reduce(function(m,i){ m[i.id]=i; return m; },{});
  var TYPE_ICON={Checking:'bank',Savings:'piggy',Cash:'wallet','Money Market':'piggy',Brokerage:'chart',Retirement:'retirement',HSA:'retirement','Crypto Wallet':'chart',Property:'home',Vehicle:'car',Collectibles:'box',Jewelry:'diamond','Precious Metals':'diamond',Art:'box','Other Asset':'tag','Credit Card':'card',Loan:'loan','Student Loan':'loan',Mortgage:'mortgage','Auto Loan':'car','Other Liability':'loan'};
  var TYPE_GROUP={Checking:'cash',Savings:'cash',Cash:'cash','Money Market':'cash','CD':'cash','Certificate of Deposit':'cash',Brokerage:'investments',Retirement:'retirement',HSA:'retirement','Crypto Wallet':'investments',Property:'property',Vehicle:'vehicles',Collectibles:'collectibles',Jewelry:'jewelry','Precious Metals':'collectibles',Art:'collectibles','Other Asset':'other-assets','Credit Card':'credit-cards',Loan:'loans','Student Loan':'student-loans',Mortgage:'mortgage','Auto Loan':'auto-loans','Other Liability':'other-debt'};
  var GROUPS=[
    {id:'cash',label:'Cash',icon:'wallet',side:'assets',hint:'Checking, savings, CDs, and cash'},
    {id:'investments',label:'Investments',icon:'chart',side:'assets',hint:'Brokerage and crypto'},
    {id:'retirement',label:'Retirement',icon:'retirement',side:'assets',hint:'IRA, 401(k), HSA'},
    {id:'property',label:'Property',icon:'home',side:'assets',hint:'Home and real estate'},
    {id:'vehicles',label:'Vehicles',icon:'car',side:'assets',hint:'Cars and other vehicles'},
    {id:'collectibles',label:'Collectibles',icon:'box',side:'assets',hint:'Art, metals, collectibles'},
    {id:'jewelry',label:'Jewelry',icon:'diamond',side:'assets',hint:'Jewelry and watches'},
    {id:'other-assets',label:'Other assets',icon:'tag',side:'assets',hint:'Anything else with value'},
    {id:'credit-cards',label:'Credit cards',icon:'card',side:'liabilities',hint:'Card balances owed'},
    {id:'mortgage',label:'Mortgage',icon:'mortgage',side:'liabilities',hint:'Home loans'},
    {id:'auto-loans',label:'Auto loans',icon:'car',side:'liabilities',hint:'Vehicle loans'},
    {id:'student-loans',label:'Student loans',icon:'loan',side:'liabilities',hint:'Education loans'},
    {id:'loans',label:'Personal loans',icon:'loan',side:'liabilities',hint:'Other fixed loans'},
    {id:'other-debt',label:'Other debt',icon:'loan',side:'liabilities',hint:'Other liabilities'}
  ];
  function groupMeta(id){ return GROUPS.find(function(x){ return x.id===id; })||GROUPS.find(function(x){ return x.id==='other-assets'; }); }
  function groupLabel(id){ return groupMeta(id).label; }
  function isLiability(type){ if(typeof accountIsLiability==='function') return accountIsLiability(type); return /credit|loan|debt|mortgage|liability/i.test(String(type||'')); }
  function signed(a){
    if(typeof accountSignedValue==='function') return accountSignedValue(a);
    var bal=Math.abs(n(a&&a.balance));
    return isLiability(a&&a.type) ? -bal : n(a&&a.balance);
  }
  function groupForAccount(a){
    var type=String((a&&a.type)||'').trim();
    if(TYPE_GROUP[type]) return TYPE_GROUP[type];
    var text=(type+' '+String((a&&a.name)||'')+' '+String((a&&a.institution)||'')).toLowerCase();
    if(/credit|card|amex|visa|mastercard/.test(text)) return 'credit-cards';
    if(/mortgage|home loan/.test(text)) return 'mortgage';
    if(/student/.test(text)&&/loan|debt/.test(text)) return 'student-loans';
    if(/auto loan|car loan|vehicle loan/.test(text)) return 'auto-loans';
    if(/loan|debt|liability/.test(text)) return 'loans';
    if(/retirement|ira|401|403|hsa/.test(text)) return 'retirement';
    if(/brokerage|investment|crypto|stock|fund/.test(text)) return 'investments';
    if(/property|home|house|real estate|condo/.test(text)) return 'property';
    if(/vehicle|auto|car|boat|rv|motorcycle/.test(text)) return 'vehicles';
    if(/jewel|watch|ring|diamond/.test(text)) return 'jewelry';
    if(/collectible|gold|silver|precious|metal|art|coin/.test(text)) return 'collectibles';
    if(/checking|savings|money market|cash|wallet|cd|certificate/.test(text)) return 'cash';
    var explicit=ICON_MAP[a&&a.iconKey];
    if(explicit&&explicit.group) return explicit.group;
    return isLiability(type)?'other-debt':'other-assets';
  }
  function defaultIconKey(a){ return (a&&a.iconKey&&ICON_MAP[a.iconKey]) ? a.iconKey : (TYPE_ICON[(a&&a.type)||'']||groupMeta(groupForAccount(a)).icon||'bank'); }
  function iconMarkup(keyOrAccount,extra){
    var key=typeof keyOrAccount==='string' ? keyOrAccount : defaultIconKey(keyOrAccount||{});
    var icon=ICON_MAP[key]||ICON_MAP.bank;
    var group=(typeof keyOrAccount==='string') ? icon.group : groupForAccount(keyOrAccount||{});
    return '<span class="mm-acct-icon-v014 '+esc(group)+' '+esc(extra||'')+'" title="'+esc(icon.label)+'">'+icon.svg+'</span>';
  }
  window.MoneyMapAccountIcons={icons:ICONS,iconMarkup:iconMarkup,defaultIconKey:defaultIconKey,groupForAccount:groupForAccount};
  window.MoneyMapAccountTaxonomy={groups:GROUPS,groupForAccount:groupForAccount,groupLabel:groupLabel,groupMeta:groupMeta,signed:signed,isLiability:isLiability,iconMarkup:iconMarkup};

  /* ── net worth data ── */
  function includedAccounts(){ try{ return ((typeof state!=='undefined'&&state&&Array.isArray(state.accounts))?state.accounts:[]).filter(function(a){ return a.includeNetWorth!==false; }); }catch(e){ return []; } }
  function netBreak(){
    if(typeof netWorthBreakdown==='function') return netWorthBreakdown();
    var assets=includedAccounts().reduce(function(s,a){ return s+Math.max(0,signed(a)); },0);
    var liabilities=includedAccounts().reduce(function(s,a){ return s+Math.abs(Math.min(0,signed(a))); },0);
    return {assets:assets,liabilities:liabilities,netWorth:assets-liabilities};
  }
  function currentRows(){
    var rows=((state&&state.netWorthHistory)||[]).slice().sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); }).filter(function(r){ return r&&r.date; });
    if(!rows.length){
      var b=netBreak();
      rows.push({id:'live',date:new Date().toISOString().slice(0,10),netWorth:b.netWorth,assets:b.assets,liabilities:b.liabilities,note:'Current live value',accountSnapshot:includedAccounts().map(function(a){ return {name:a.name,type:a.type,institution:a.institution,balance:a.balance,iconKey:defaultIconKey(a)}; })});
    }
    return rows.slice(-18);
  }
  function snapshotAccounts(entry){ return Array.isArray(entry&&entry.accountSnapshot)?entry.accountSnapshot:[]; }
  function deltaLabel(rows){
    if(rows.length<2) return 'No prior snapshot';
    var l=rows[rows.length-1],p=rows[rows.length-2];
    var d=n(l.netWorth)-n(p.netWorth);
    return (d>=0?'+':'−')+fmt(Math.abs(d))+' vs '+dateLbl(p.date).split(',')[0]+' · updated '+dateLbl(l.date).split(',')[0];
  }

  /* ── canvas chart (same logic as v0.1.9) ── */
  function roundRect(ctx,x,y,w,h,r){ var rr=Math.min(r,Math.max(0,w/2),Math.max(0,h/2)); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
  function drawChart(canvasId,options){
    options=options||{};
    var canvas=document.getElementById(canvasId); if(!canvas) return;
    var wrap=canvas.parentElement; if(!wrap) return;
    var visible=!!canvas.offsetParent||options.force; if(!visible) return;
    var fixH=Number(options.height||280), dpr=window.devicePixelRatio||1;
    var cssW=Math.max(320,Math.round(wrap.clientWidth||680)), cssH=fixH;
    wrap.style.minHeight=wrap.style.height=wrap.style.maxHeight=cssH+'px';
    canvas.width=Math.round(cssW*dpr); canvas.height=Math.round(cssH*dpr);
    canvas.style.width='100%'; canvas.style.height=cssH+'px';
    var ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
    var w=cssW,h=cssH; ctx.clearRect(0,0,w,h);
    var rows=currentRows(); var vals=rows.map(function(r){ return n(r.netWorth); });
    var minV=Math.min.apply(null,vals), maxV=Math.max.apply(null,vals);
    if(!Number.isFinite(minV)||!Number.isFinite(maxV)){ minV=0; maxV=1; }
    if(minV===maxV){ minV-=Math.max(100,Math.abs(maxV)*.08); maxV+=Math.max(100,Math.abs(maxV)*.08); }
    var pad={l:74,r:28,t:22,b:40};
    var yMin=Math.floor((minV-(maxV-minV)*.10)/100)*100, yMax=Math.ceil((maxV+(maxV-minV)*.10)/100)*100;
    if(yMin===yMax){ yMin-=100; yMax+=100; }
    var xFor=function(i){ return rows.length===1 ? pad.l+(w-pad.l-pad.r)/2 : pad.l+(w-pad.l-pad.r)*(i/(rows.length-1)); };
    var yFor=function(v){ return pad.t+(h-pad.t-pad.b)*(1-(n(v)-yMin)/(yMax-yMin||1)); };
    var active=models[canvasId]&&Number.isInteger(models[canvasId].activeIdx)?models[canvasId].activeIdx:null;
    var blue=css('--blue','#38bdf8'), grid=css('--line','rgba(148,163,184,.22)'), muted=css('--muted','#64748b');
    ctx.lineWidth=1; ctx.font='11px '+fontFam(); ctx.textBaseline='middle';
    [0,.25,.5,.75,1].forEach(function(t){ var v=yMin+(yMax-yMin)*t,y=yFor(v); ctx.strokeStyle=grid; ctx.globalAlpha=.62; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); ctx.globalAlpha=1; ctx.fillStyle=muted; ctx.fillText(fmt(v),8,y); });
    if(active!==null&&rows[active]){ var ax=xFor(active); ctx.strokeStyle='rgba(100,116,139,.42)'; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(ax,pad.t); ctx.lineTo(ax,h-pad.b); ctx.stroke(); ctx.setLineDash([]); }
    var grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b); grad.addColorStop(0,'rgba(56,189,248,.24)'); grad.addColorStop(.65,'rgba(56,189,248,.07)'); grad.addColorStop(1,'rgba(56,189,248,0)');
    ctx.fillStyle=grad; ctx.beginPath(); rows.forEach(function(r,i){ var x=xFor(i),y=yFor(r.netWorth); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }); ctx.lineTo(xFor(rows.length-1),h-pad.b); ctx.lineTo(xFor(0),h-pad.b); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=blue; ctx.lineWidth=3; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.beginPath(); rows.forEach(function(r,i){ var x=xFor(i),y=yFor(r.netWorth); if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }); ctx.stroke();
    rows.forEach(function(r,i){ var x=xFor(i),y=yFor(r.netWorth),act=active===i; if(act){ ctx.fillStyle='rgba(56,189,248,.18)'; ctx.beginPath(); ctx.arc(x,y,15,0,Math.PI*2); ctx.fill(); } ctx.fillStyle=blue; ctx.beginPath(); ctx.arc(x,y,act?6.5:5,0,Math.PI*2); ctx.fill(); ctx.strokeStyle=css('--panel','#fff'); ctx.lineWidth=2.5; ctx.stroke(); });
    ctx.fillStyle=muted; ctx.font='12px '+fontFam(); ctx.textBaseline='alphabetic';
    rows.forEach(function(r,i){ if(rows.length>8&&i%2) return; var lbl=dateLbl(r.date).split(',')[0]; var x=Math.max(0,Math.min(w-56,xFor(i)-22)); ctx.fillText(lbl,x,h-12); });
    models[canvasId]={canvas:canvas,wrap:wrap,rows:rows,pad:pad,width:w,height:h,xFor:xFor,yFor:yFor,yMin:yMin,yMax:yMax,activeIdx:active};
    bindChart(canvasId);
  }
  function hit(canvasId,cx,cy){ var m=models[canvasId]; if(!m) return null; var rect=m.canvas.getBoundingClientRect(); var x=(cx-rect.left)*(m.width/rect.width); var y=(cy-rect.top)*(m.height/rect.height); var best=null,bestD=Infinity; m.rows.forEach(function(r,i){ var dx=m.xFor(i)-x,dy=m.yFor(r.netWorth)-y; var d=Math.sqrt(dx*dx+dy*dy); if(d<bestD){ best=i; bestD=d; } }); if(bestD<=34) return best; if(x>=m.pad.l-24&&x<=m.width-m.pad.r+24&&y>=m.pad.t-28&&y<=m.height-m.pad.b+34){ var near=null,nearX=Infinity; m.rows.forEach(function(r,i){ var d=Math.abs(m.xFor(i)-x); if(d<nearX){ near=i; nearX=d; } }); return nearX<=40?near:null; } return null; }
  function posTip(model,idx,tip){ var x=model.xFor(idx),y=model.yFor(model.rows[idx].netWorth); var cr=model.canvas.getBoundingClientRect(); var sx=cr.width/model.width,sy=cr.height/model.height; var px=x*sx,py=y*sy; var ww=model.wrap.clientWidth||cr.width; var tw=tip.offsetWidth||310; var left=Math.max(8,Math.min(ww-tw-8,px-tw/2)); var top=py-(tip.offsetHeight||140)-18; if(top<6) top=py+22; tip.style.left=left+'px'; tip.style.top=top+'px'; tip.style.setProperty('--arrow-x',Math.max(18,Math.min(tw-18,px-left))+'px'); }
  function showTip(canvasId,idx,persist){
    var m=models[canvasId]; if(!m||!m.rows[idx]) return;
    var old=m.wrap.querySelector('.mm-nw-popover-v014'); if(old) old.remove();
    var row=m.rows[idx]; var rows=m.rows;
    var prev=idx>0?rows[idx-1]:null; var delta=prev?n(row.netWorth)-n(prev.netWorth):null;
    var dateTitle=prev ? (dateLbl(prev.date).split(',')[0]+' – '+dateLbl(row.date).split(',')[0]) : dateLbl(row.date).split(',')[0];
    var accounts=snapshotAccounts(row).slice(0,3).map(function(a){ var liab=isLiability(a.type); var val=liab?-Math.abs(n(a.balance)):n(a.balance); return '<div class="mm-nw-tip-account-v014"><span>'+esc(a.name||a.type||'Account')+'</span><b class="'+(val<0?'bad':'')+'">'+fmt(val)+'</b></div>'; }).join('');
    var tip=document.createElement('div'); tip.className='mm-nw-popover-v014'; tip.dataset.persist=persist?'1':'0';
    tip.innerHTML='<div class="mm-nw-tip-title-v014"><span>'+esc(dateTitle)+'</span><button type="button" aria-label="Close" data-mm-nw-close="1">×</button></div>'+
      '<div class="mm-nw-tip-values-v014"><div><span>Net worth</span><b>'+fmt(row.netWorth)+'</b></div><div><span>Change</span><b class="'+(delta===null?'':(delta>=0?'good':'bad'))+'">'+( delta===null?'—':((delta>=0?'+':'')+fmt(delta)))+'</b></div></div>'+
      (accounts?'<div class="mm-nw-tip-accounts-v014">'+accounts+'</div>':'')+
      '<div class="mm-nw-tip-local-v014">Local snapshot only. Nothing is sent anywhere.</div>';
    m.wrap.appendChild(tip);
    tip.querySelector('[data-mm-nw-close]')?.addEventListener('click',function(e){ e.stopPropagation(); hideTips(); models[canvasId].activeIdx=null; drawChart(canvasId,{force:true}); });
    requestAnimationFrame(function(){ posTip(m,idx,tip); });
  }
  function hideTips(){ document.querySelectorAll('.mm-nw-popover-v014').forEach(function(t){ t.remove(); }); }
  function activate(canvasId,idx,persist){ if(idx===null||idx===undefined) return; if(models[canvasId]) models[canvasId].activeIdx=idx; drawChart(canvasId,{force:true}); showTip(canvasId,idx,persist); }
  function bindChart(canvasId){
    var m=models[canvasId]; if(!m||m.canvas.dataset.v014Bound) return;
    var canvas=m.canvas; canvas.dataset.v014Bound='1';
    canvas.addEventListener('mousemove',function(e){ var idx=hit(canvasId,e.clientX,e.clientY); if(idx===null){ if(!canvas.dataset.v014Pinned){ if(models[canvasId]) models[canvasId].activeIdx=null; hideTips(); drawChart(canvasId,{force:true}); } return; } canvas.dataset.v014Hover=String(idx); if(canvas.dataset.v014Pinned) return; var cur=models[canvasId]&&models[canvasId].activeIdx; if(cur===idx&&m.wrap.querySelector('.mm-nw-popover-v014')) return; activate(canvasId,idx,false); });
    canvas.addEventListener('mouseleave',function(){ if(canvas.dataset.v014Pinned) return; if(models[canvasId]) models[canvasId].activeIdx=null; hideTips(); drawChart(canvasId,{force:true}); });
    canvas.addEventListener('click',function(e){ var idx=hit(canvasId,e.clientX,e.clientY); if(idx===null){ delete canvas.dataset.v014Pinned; hideTips(); if(models[canvasId]) models[canvasId].activeIdx=null; drawChart(canvasId,{force:true}); return; } canvas.dataset.v014Pinned='1'; activate(canvasId,idx,true); e.stopPropagation(); });
    canvas.addEventListener('touchend',function(e){ var t=e.changedTouches&&e.changedTouches[0]; if(!t) return; var idx=hit(canvasId,t.clientX,t.clientY); if(idx===null) return; canvas.dataset.v014Pinned='1'; activate(canvasId,idx,true); e.preventDefault(); },{passive:false});
    canvas.addEventListener('focus',function(){ var rows=models[canvasId]?.rows||[]; if(rows.length) activate(canvasId,rows.length-1,false); });
    canvas.addEventListener('blur',function(){ delete canvas.dataset.v014Pinned; hideTips(); });
  }

  var oldRenderNetWorth=window.renderNetWorthChart;
  window.renderNetWorthChart=function(){ drawChart('netWorthCanvas',{height:260}); };

  /* ── account groups ── */
  function accountGroupSummary(accounts,id){ var items=accounts.filter(function(a){ return groupForAccount(a)===id; }); var included=items.filter(function(a){ return a.includeNetWorth!==false; }); var value=included.reduce(function(s,a){ return s+signed(a); },0); return {id:id,meta:groupMeta(id),items:items,included:included,value:value}; }

  /* ── account row ── */
  function accountRow(a){
    var val=signed(a), included=a.includeNetWorth!==false, group=groupMeta(groupForAccount(a));
    var updated=a.updatedAt?dateLbl(String(a.updatedAt).slice(0,10)):'—';
    return '<button type="button" class="mm-acct-row-v110 '+(included?'included':'excluded')+'" onclick="openDrawer(\'account\', findById(\'accounts\',\''+esc(a.id)+'\'))">'+
      iconMarkup(a)+
      '<span class="mm-acct-v110-row-copy"><h4>'+esc(a.name||'Account')+'</h4><p>'+
        '<span class="mm-acct-v110-type-pill">'+esc(group.label)+'</span>'+
        '<span>'+esc(a.institution||'Manual')+'</span>'+
        (included?'':'<span class="bad">Excluded</span>')+
      '</p></span>'+
      '<span class="mm-acct-v110-row-value"><strong class="'+(val<0?'bad':'good')+'">'+fmt(val)+'</strong><small>'+esc(updated)+'</small></span>'+
    '</button>';
  }

  /* ── filter pills ── */
  function filterPills(accounts){
    var summaries=GROUPS.map(function(g){ return accountGroupSummary(accounts,g.id); }).filter(function(s){ return s.items.length; });
    var assetCnt=summaries.filter(function(s){ return s.meta.side==='assets'; }).length;
    var debtCnt=summaries.filter(function(s){ return s.meta.side==='liabilities'; }).length;
    function pill(id,label,value,meta){
      var isActive=activeFilter===id;
      var isDebt=meta&&meta.side==='liabilities';
      return '<button type="button" class="mm-acct-v110-pill'+(isActive?' active':'')+( isDebt?' debt-pill':'')+'" onclick="MoneyMapSetAccountFilter(\''+esc(id)+'\')">'+
        (meta&&meta.icon?'<span class="mm-acct-v110-pill-icon">'+iconMarkup(meta.icon,meta.id)+'</span>':'')+
        '<span>'+esc(label)+'</span>'+
        (value!==null?'<em>'+fmt(value)+'</em>':'<em>'+( meta===null?summaries.length:meta&&meta.side==='assets'?assetCnt:meta&&meta.side==='liabilities'?debtCnt:0)+'</em>')+
      '</button>';
    }
    return '<div class="mm-acct-v110-filter-wrap">'+
      '<div class="mm-acct-v110-filter-head"><b>Category filter</b><span>Assets, valuables, cards, and loans</span><button type="button" onclick="MoneyMapSetAccountFilter(\'all\')">Reset</button></div>'+
      '<div class="mm-acct-v110-filter-pills">'+
        pill('all','All',null,null)+
        pill('assets','Assets',null,{side:'assets',icon:'wallet',id:'cash'})+
        pill('liabilities','Debt',null,{side:'liabilities',icon:'card',id:'credit-cards'})+
        summaries.map(function(s){ return pill(s.id,s.meta.label,s.value,s.meta); }).join('')+
      '</div>'+
    '</div>';
  }

  /* ── grouped list ── */
  function groupedList(accounts){
    if(!accounts.length) return '<div class="mm-acct-v110-empty"><b>No accounts yet.</b><p>Add cash, savings, investments, property, vehicles, collectibles, jewelry, credit cards, or loans.</p><button class="btn btn-primary" onclick="openDrawer(\'account\')">Add account</button></div>';
    var filtered=GROUPS.filter(function(g){
      if(activeFilter==='all') return true;
      if(activeFilter==='assets') return g.side==='assets';
      if(activeFilter==='liabilities') return g.side==='liabilities';
      return g.id===activeFilter;
    });
    var html='';
    ['assets','liabilities'].forEach(function(side){
      var sideGroups=filtered.filter(function(g){ return g.side===side; });
      var sideSummaries=sideGroups.map(function(g){ return accountGroupSummary(accounts,g.id); }).filter(function(s){ return s.items.length; });
      if(!sideSummaries.length) return;
      var sideTotal=sideSummaries.reduce(function(s,x){ return s+x.value; },0);
      html+='<div class="mm-acct-v110-side-head"><span>'+esc(side==='assets'?'Assets':'Liabilities')+'</span><b class="'+(sideTotal<0?'bad':'good')+'">'+fmt(sideTotal)+'</b></div>';
      sideSummaries.forEach(function(s){
        html+='<div class="mm-acct-v110-group">'+
          '<div class="mm-acct-v110-group-head">'+
            '<div class="mm-acct-v110-group-title">'+
              iconMarkup(s.meta.icon,s.id)+
              '<div><span class="mm-acct-v110-group-label">'+esc(s.meta.label)+'</span>'+
              '<span class="mm-acct-v110-group-meta"> · '+s.items.length+' account'+(s.items.length===1?'':'s')+' · '+esc(s.meta.hint)+'</span></div>'+
            '</div>'+
            '<strong class="mm-acct-v110-group-total '+(s.value<0?'bad':'good')+'">'+fmt(s.value)+'</strong>'+
          '</div>'+
          s.items.sort(function(a,b){ return Math.abs(signed(b))-Math.abs(signed(a)); }).map(accountRow).join('')+
        '</div>';
      });
    });
    if(!html) return '<div class="mm-acct-v110-empty"><b>No accounts in this category.</b><p>Switch filters or add an account.</p><button class="btn" onclick="MoneyMapSetAccountFilter(\'all\')">Show all</button></div>';
    return html;
  }

  /* ── summary panel ── */
  function summaryPanel(accounts,b){
    var rows=currentRows();
    var total=Math.max(1,Math.abs(n(b.assets))+Math.abs(n(b.liabilities)));
    var asPct=Math.max(0,Math.min(100,Math.abs(n(b.assets))/total*100));
    var lbPct=Math.max(0,Math.min(100,Math.abs(n(b.liabilities))/total*100));
    var summaries=GROUPS.map(function(g){ return accountGroupSummary(accounts,g.id); }).filter(function(s){ return s.items.length; });
    var incl=accounts.filter(function(a){ return a.includeNetWorth!==false; }).length;
    var maxG=Math.max(1,summaries.reduce(function(m,s){ return Math.max(m,Math.abs(s.value)); },0));
    return '<div class="mm-acct-v110-summary-card">'+
      '<div class="mm-acct-v110-summary-head"><h3>Summary</h3></div>'+
      '<div class="mm-acct-v110-sum-net">'+
        '<span>Net worth</span>'+
        '<b class="'+(b.netWorth<0?'bad':'good')+'">'+fmt(b.netWorth)+'</b>'+
        '<em>'+incl+' of '+accounts.length+' accounts included</em>'+
      '</div>'+
      '<div class="mm-acct-v110-alloc-bar"><div class="assets" style="width:'+asPct.toFixed(1)+'%"></div><div class="liabilities" style="width:'+lbPct.toFixed(1)+'%"></div></div>'+
      '<div class="mm-acct-v110-sum-rows">'+
        '<div class="mm-acct-v110-sum-row"><span>Assets</span><b class="good">'+fmt(b.assets)+'</b></div>'+
        '<div class="mm-acct-v110-sum-row"><span>Liabilities</span><b class="bad">'+fmt(b.liabilities)+'</b></div>'+
        '<div class="mm-acct-v110-sum-row"><span>Groups active</span><b>'+summaries.length+'</b></div>'+
        '<div class="mm-acct-v110-sum-row"><span>Last snapshot</span><b>'+(rows.length>1?dateLbl(rows[rows.length-1].date).split(',')[0]:'None yet')+'</b></div>'+
      '</div>'+
      '<div class="mm-acct-v110-cat-list">'+
        summaries.slice(0,8).map(function(s){
          var w=Math.max(5,Math.round(Math.abs(s.value)/maxG*100));
          return '<button type="button" class="mm-acct-v110-cat-item" onclick="MoneyMapSetAccountFilter(\''+esc(s.id)+'\')">'+
            '<span class="mm-acct-v110-cat-item-left">'+iconMarkup(s.meta.icon,s.id)+'<span><b>'+esc(s.meta.label)+'</b><small style="margin-left:5px">'+s.items.length+'</small></span></span>'+
            '<span class="mm-acct-v110-cat-item-right '+(s.value<0?'bad':'good')+'">'+fmt(s.value)+'</span>'+
          '</button>';
        }).join('')+
      '</div>'+
      '<div class="mm-acct-v110-sum-actions">'+
        '<button class="btn btn-small" onclick="saveNetWorthSnapshot()">Snapshot</button>'+
        '<button class="btn btn-small" onclick="showView(\'networth\')">History</button>'+
        '<button class="btn btn-small" onclick="exportTrackerCsv(\'accounts\')">Export</button>'+
      '</div>'+
    '</div>';
  }

  /* ── main render ── */
  function ensureView(){
    var sec=document.getElementById('view-accounts');
    if(!sec){ sec=document.createElement('section'); sec.className='view'; sec.id='view-accounts'; document.getElementById('view-overview')?.after(sec); }
    return sec;
  }
  function renderPage(){
    var sec=ensureView();
    sec.className='view mm-accounts-v110';
    var accounts=(state&&state.accounts) ? state.accounts.slice() : [];
    var b=netBreak();
    var rows=currentRows();
    var activeLabel=activeFilter==='all'?'All groups':(activeFilter==='assets'?'Assets':(activeFilter==='liabilities'?'Debt':groupLabel(activeFilter)));
    sec.innerHTML=
      '<div class="mm-acct-v110-header">'+
        '<div class="mm-acct-v110-header-inner">'+
          '<div class="mm-acct-v110-header-left">'+
            '<span class="mm-acct-v110-kicker">Manual balance center</span>'+
            '<h2 class="mm-acct-v110-page-title">Accounts</h2>'+
            '<p class="mm-acct-v110-page-sub">Track balances by cash, savings, investments, property, vehicles, collectibles, jewelry, cards, and loans. Everything stays in this browser.</p>'+
            '<div class="mm-acct-v110-header-actions">'+
              '<button class="btn" onclick="saveNetWorthSnapshot()">Save snapshot</button>'+
              '<button class="btn" onclick="showView(\'networth\')">Snapshot history</button>'+
              '<button class="btn btn-primary" onclick="openDrawer(\'account\')">Add account</button>'+
            '</div>'+
          '</div>'+
          '<div class="mm-acct-v110-header-right">'+
            '<div class="mm-acct-v110-nw-big '+(b.netWorth<0?'bad':'')+'">'+fmt(b.netWorth)+'</div>'+
            '<div class="mm-acct-v110-nw-delta">'+esc(deltaLabel(rows))+'</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<section class="card mm-accounts-chart-card-v014 mm-accounts-chart-card-v018" style="margin-bottom:18px">'+
        '<div class="mm-accounts-chart-top-v014" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px">'+
          '<div><span class="mm-acct-v110-kicker">Net worth trend</span><p style="margin:4px 0 0;font-size:12.5px;color:var(--muted)">Click dots to inspect snapshots. Nothing is shared.</p></div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
            '<span class="mm-accounts-control-pill-v014">Filter <span>'+esc(activeLabel)+'</span></span>'+
            '<span class="mm-accounts-control-pill-v014">Groups <span>'+rows.length+'</span></span>'+
          '</div>'+
        '</div>'+
        '<div class="mm-accounts-chart-wrap-v014" data-chart-height="280"><canvas id="accountsNetWorthCanvas" aria-label="Net worth chart — click dots to inspect snapshots" tabindex="0"></canvas></div>'+
      '</section>'+
      '<div class="mm-acct-v110-layout">'+
        '<section class="card mm-accounts-list-card-v014" style="padding:20px 22px">'+
          '<div class="mm-accounts-list-head-v014">'+
            '<div><h3 style="margin:0;font-size:14.5px;font-weight:800">Balance groups</h3>'+
            '<p style="margin:3px 0 0;font-size:12.5px;color:var(--muted)">Filter by category, click any account to edit balance, type, or icon.</p></div>'+
            '<button class="btn btn-small" onclick="openDrawer(\'account\')">Add</button>'+
          '</div>'+
          filterPills(accounts)+
          groupedList(accounts)+
        '</section>'+
        '<aside class="mm-acct-v110-summary">'+summaryPanel(accounts,b)+'</aside>'+
      '</div>';
    requestAnimationFrame(function(){ drawChart('accountsNetWorthCanvas',{height:280,force:true}); });
  }

  /* ── public API ── */
  window.MoneyMapRefreshAccountChart=function(){ requestAnimationFrame(function(){ drawChart('accountsNetWorthCanvas',{height:280,force:true}); drawChart('netWorthCanvas',{height:260,force:true}); }); };
  window.MoneyMapSetAccountFilter=function(id){ activeFilter=id||'all'; if(document.getElementById('view-accounts')) renderPage(); };
  var priorRA=window.renderAccountsDashboard;
  window.renderAccountsDashboard=function(){ renderPage(); markBuild(); };

  /* ── icon picker ── */
  function iconPickerHtml(selected){
    return '<div class="v014-icon-picker"><label>Account icon</label><input type="hidden" id="acctIconKey" value="'+esc(selected)+'"><div class="v014-icon-grid">'+ICONS.map(function(icon){ return '<button type="button" class="v014-icon-choice '+(icon.id===selected?'active':'')+'" title="'+esc(icon.label)+'" onclick="MoneyMapSetAccountIcon(\''+esc(icon.id)+'\')">'+iconMarkup(icon.id)+'</button>'; }).join('')+'</div></div>';
  }
  window.MoneyMapSetAccountIcon=function(key){ var h=document.getElementById('acctIconKey'); if(h) h.value=key; document.querySelectorAll('.v014-icon-choice').forEach(function(b){ b.classList.toggle('active',b.getAttribute('onclick')?.indexOf("'"+key+"'")>-1); }); };
  function enhanceDrawer(data){
    var body=document.getElementById('drawerBody'); if(!body||document.getElementById('acctIconKey')) return;
    var sel=defaultIconKey(data||{type:document.getElementById('acctType')?.value||'Checking'});
    var anchor=body.querySelector('.v092-field-group')||body.querySelector('.form-row')||body.firstElementChild;
    if(anchor) anchor.insertAdjacentHTML('afterend',iconPickerHtml(sel));
    var type=document.getElementById('acctType');
    if(type&&!type.dataset.v014IconBound){ type.dataset.v014IconBound='1'; type.addEventListener('change',function(){ var h=document.getElementById('acctIconKey'); if(h&&!h.dataset.userTouched) MoneyMapSetAccountIcon(defaultIconKey({type:type.value})); }); }
    document.querySelectorAll('.v014-icon-choice').forEach(function(b){ b.addEventListener('click',function(){ var h=document.getElementById('acctIconKey'); if(h) h.dataset.userTouched='1'; }); });
  }
  var priorOD=window.openDrawer;
  if(typeof priorOD==='function'){ window.openDrawer=function(type,data){ var out=priorOD.apply(this,arguments); if(type==='account') setTimeout(function(){ enhanceDrawer(data||null); },0); return out; }; }
  var priorSA=window.saveAccount;
  if(typeof priorSA==='function'){ window.saveAccount=function(id){ var iconKey=document.getElementById('acctIconKey')?.value||''; var out=priorSA.apply(this,arguments); if(iconKey&&state&&Array.isArray(state.accounts)){ var tgt=id?state.accounts.find(function(a){ return a.id===id; }):state.accounts[state.accounts.length-1]; if(tgt){ tgt.iconKey=iconKey; if(typeof saveState==='function') saveState(); } } if(typeof renderAll==='function') requestAnimationFrame(renderAll); return out; }; }
  var priorSnap=window.saveNetWorthSnapshot;
  if(typeof priorSnap==='function'){ window.saveNetWorthSnapshot=function(){ var out=priorSnap.apply(this,arguments); try{ var rows=(state.netWorthHistory||[]).slice().sort(function(a,b){ return String(b.updatedAt||b.date).localeCompare(String(a.updatedAt||a.date)); }); var latest=rows[0]; if(latest&&Array.isArray(latest.accountSnapshot)){ latest.accountSnapshot.forEach(function(snap){ var acct=(state.accounts||[]).find(function(a){ return String(a.name||'').toLowerCase()===String(snap.name||'').toLowerCase(); }); if(acct) snap.iconKey=defaultIconKey(acct); }); if(typeof saveState==='function') saveState(); } }catch(e){} requestAnimationFrame(function(){ drawChart('accountsNetWorthCanvas',{height:280,force:true}); drawChart('netWorthCanvas',{height:260,force:true}); }); return out; }; }
  var priorSV=window.showView;
  if(typeof priorSV==='function'){ window.showView=function(id){ var out=priorSV.apply(this,arguments); if(id==='accounts') requestAnimationFrame(renderPage); if(id==='networth') requestAnimationFrame(function(){ drawChart('netWorthCanvas',{height:260}); }); return out; }; }
  var priorAll=window.renderAll;
  if(typeof priorAll==='function'){ window.renderAll=function(){ var out=priorAll.apply(this,arguments); if(document.getElementById('view-accounts')?.classList.contains('active')) requestAnimationFrame(renderPage); requestAnimationFrame(function(){ drawChart('netWorthCanvas',{height:260}); }); markBuild(); return out; }; }
  window.addEventListener('resize',function(){ requestAnimationFrame(function(){ drawChart('accountsNetWorthCanvas',{height:280,force:true}); drawChart('netWorthCanvas',{height:260}); }); },{passive:true});
  document.addEventListener('click',function(e){ if(!e.target.closest('.mm-nw-popover-v014')&&!e.target.closest('canvas')){ Object.keys(models).forEach(function(id){ if(models[id]) models[id].activeIdx=null; }); document.querySelectorAll('canvas[data-v014-pinned]').forEach(function(c){ delete c.dataset.v014Pinned; }); hideTips(); drawChart('accountsNetWorthCanvas',{height:280,force:true}); drawChart('netWorthCanvas',{height:260}); } });
  document.addEventListener('DOMContentLoaded',function(){ markBuild(); requestAnimationFrame(function(){ if(document.getElementById('view-accounts')?.classList.contains('active')) renderPage(); }); });
  setTimeout(function(){ markBuild(); if(document.getElementById('view-accounts')?.classList.contains('active')) renderPage(); },360);
  setTimeout(function(){ markBuild(); if(document.getElementById('view-accounts')?.classList.contains('active')) renderPage(); },950);
})();
