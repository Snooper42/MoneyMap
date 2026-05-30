/* MoneyMap charts module.
   Extracted from v0.10.0-alpha app.js with behavior-preserving function moves. */

/* Net worth chart model — used by the interactive overlay in nw-chart.js */
var netWorthChartModel = null;

function renderNetWorthChart(){
  const canvas=document.getElementById('netWorthCanvas'); if(!canvas || !canvas.closest('.view.active')) return; const rect=canvas.parentElement.getBoundingClientRect(); canvas.width=Math.max(600,rect.width*devicePixelRatio); canvas.height=Math.max(240,rect.height*devicePixelRatio); const ctx=canvas.getContext('2d'); ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio; ctx.clearRect(0,0,w,h);
  const rows=(state.netWorthHistory||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-18); if(!rows.length){ netWorthChartModel=null; ctx.fillStyle=getCss('--muted'); ctx.font='14px '+getComputedStyle(document.body).fontFamily; ctx.fillText('Save net worth snapshots to draw your trend.',20,42); return; }
  const vals=rows.map(r=>nval(r.netWorth)); const min=Math.min(...vals,0), max=Math.max(...vals,1); const pad={l:64,r:18,t:18,b:34}; const xFor=i=>pad.l+(rows.length===1?0:(w-pad.l-pad.r)*(i/(rows.length-1))); const yFor=v=>pad.t+(h-pad.t-pad.b)*(1-(v-min)/(max-min||1)); ctx.strokeStyle='rgba(148,163,184,.18)'; ctx.lineWidth=1; [min,(min+max)/2,max].forEach(v=>{ const y=yFor(v); ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); ctx.fillStyle=getCss('--muted'); ctx.font='11px '+getComputedStyle(document.body).fontFamily; ctx.fillText(money(v),8,y+4); });
  /* Area fill under the line */
  const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b); grad.addColorStop(0,'rgba(var(--accent-rgb,83,224,172),.18)'); grad.addColorStop(1,'rgba(var(--accent-rgb,83,224,172),.01)'); ctx.fillStyle=grad; ctx.beginPath(); rows.forEach((r,i)=>{ const x=xFor(i),y=yFor(nval(r.netWorth)); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.lineTo(xFor(rows.length-1),h-pad.b); ctx.lineTo(xFor(0),h-pad.b); ctx.closePath(); ctx.fill();
  /* Line */
  ctx.strokeStyle=getCss('--accent'); ctx.lineWidth=2.5; ctx.beginPath(); rows.forEach((r,i)=>{ const x=xFor(i),y=yFor(nval(r.netWorth)); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke();
  /* Dots — larger on hover target model */
  const activeIdx = netWorthChartModel ? netWorthChartModel.activeIdx : null;
  rows.forEach((r,i)=>{ const x=xFor(i),y=yFor(nval(r.netWorth)); const isActive=activeIdx===i; if(isActive){ ctx.fillStyle='rgba(var(--accent-rgb,83,224,172),.18)'; ctx.beginPath(); ctx.arc(x,y,14,0,Math.PI*2); ctx.fill(); } ctx.fillStyle=getCss('--accent'); ctx.beginPath(); ctx.arc(x,y,isActive?6:4.5,0,Math.PI*2); ctx.fill(); if(isActive){ ctx.strokeStyle=getCss('--bg'); ctx.lineWidth=2.5; ctx.stroke(); } });
  /* X-axis labels */
  ctx.fillStyle=getCss('--muted'); ctx.font='12px '+getComputedStyle(document.body).fontFamily; rows.forEach((r,i)=>{ if(rows.length>7 && i%2) return; ctx.fillText(dateFmt(r.date).split(',')[0],Math.max(0,Math.min(w-48,xFor(i)-22)),h-10); });
  /* Store model for interactive overlay */
  netWorthChartModel={rows,pad,width:w,height:h,xFor,yFor,activeIdx:activeIdx??null};
  bindNetWorthChartEvents(canvas);
}

function bindNetWorthChartEvents(canvas){
  if(!canvas || canvas.dataset.nwHoverBound) return;
  canvas.dataset.nwHoverBound='1';
  canvas.style.cursor='pointer';

  function hit(clientX, clientY){
    if(!netWorthChartModel) return null;
    const {rows,pad,width,height,xFor}=netWorthChartModel;
    const rect=canvas.getBoundingClientRect();
    const scaleX=width/rect.width, scaleY=height/rect.height;
    const x=(clientX-rect.left)*scaleX, y=(clientY-rect.top)*scaleY;
    if(x<pad.l-28||x>width-pad.r+28||y<pad.t-28||y>height-pad.b+28) return null;
    let best=null,bestDist=36;
    rows.forEach((_,i)=>{ const d=Math.abs(xFor(i)-x); if(d<bestDist){best=i;bestDist=d;} });
    return best;
  }

  canvas.addEventListener('click', e=>{
    const idx=hit(e.clientX,e.clientY);
    if(idx===null){ hideNetWorthDotPopup(); return; }
    if(netWorthChartModel) netWorthChartModel.activeIdx=idx;
    renderNetWorthChart();
    const {rows,xFor,yFor}=netWorthChartModel;
    showNetWorthDotPopup(rows[idx], xFor(idx), yFor(nval(rows[idx].netWorth)), canvas);
  });
  canvas.addEventListener('touchend', e=>{
    const t=e.changedTouches[0];
    const idx=hit(t.clientX,t.clientY);
    if(idx===null) return;
    e.preventDefault();
    if(netWorthChartModel) netWorthChartModel.activeIdx=idx;
    renderNetWorthChart();
    const {rows,xFor,yFor}=netWorthChartModel;
    showNetWorthDotPopup(rows[idx], xFor(idx), yFor(nval(rows[idx].netWorth)), canvas);
  },{passive:false});

  document.addEventListener('click', function closeOutside(e){
    if(!e.target.closest('#nwDotPopup') && e.target!==canvas){
      hideNetWorthDotPopup();
      if(netWorthChartModel) netWorthChartModel.activeIdx=null;
      renderNetWorthChart();
    }
  });
}

function showNetWorthDotPopup(entry, dotX, dotY, canvas){
  hideNetWorthDotPopup();
  const popup=document.createElement('div');
  popup.id='nwDotPopup';
  popup.className='nw-dot-popup';
  popup.setAttribute('role','dialog');
  popup.setAttribute('aria-label','Net worth snapshot breakdown');

  const accounts=entry.accountSnapshot||[];
  const liabilityTypes=new Set(['Credit Card','Loan','Student Loan','Mortgage','Auto Loan','Other Liability']);
  const assets=accounts.filter(a=>!liabilityTypes.has(a.type));
  const liabilities=accounts.filter(a=>liabilityTypes.has(a.type));

  const moneyFmt = v => { try{ return money(v); } catch(e){ return '$'+Number(v||0).toLocaleString(); } };

  function row(a){
    const bal=Number(a.balance||0);
    const isLiab=liabilityTypes.has(a.type);
    const cls=isLiab?'bad':'';
    const displayed=isLiab?moneyFmt(-Math.abs(bal)):moneyFmt(bal);
    return `<div class="nw-popup-row"><span class="nw-popup-acct"><span class="nw-popup-name">${escapeHtml(a.name||'Account')}</span><span class="nw-popup-type">${escapeHtml(a.institution||a.type||'')}</span></span><b class="${cls}">${escapeHtml(displayed)}</b></div>`;
  }

  const hasAccounts=assets.length||liabilities.length;
  const assetRows=assets.length?assets.map(row).join(''):'';
  const liabRows=liabilities.length?`<div class="nw-popup-divider"></div>${liabilities.map(row).join('')}`:'';
  const emptyMsg=hasAccounts?'':`<div class="nw-popup-empty">No account breakdown saved.<br><small>Account detail is captured when you save future snapshots.</small></div>`;

  popup.innerHTML=`
    <div class="nw-popup-head">
      <span class="nw-popup-date">${dateFmt(entry.date)}</span>
      <span class="nw-popup-net ${nval(entry.netWorth)>=0?'good':'bad'}">${moneyFmt(nval(entry.netWorth))}</span>
      <button type="button" class="nw-popup-close" onclick="hideNetWorthDotPopup()" aria-label="Close">×</button>
    </div>
    ${emptyMsg}
    ${assetRows}${liabRows}
    ${(entry.assets||entry.liabilities)?`<div class="nw-popup-divider"></div><div class="nw-popup-totals"><span>Assets <b>${moneyFmt(nval(entry.assets))}</b></span><span>Liabilities <b class="bad">${moneyFmt(nval(entry.liabilities))}</b></span></div>`:''}
    ${entry.note?`<div class="nw-popup-note">${escapeHtml(entry.note)}</div>`:''}
  `;

  /* Position the popup relative to the canvas */
  const wrap=canvas.parentElement;
  wrap.style.position='relative';
  wrap.appendChild(popup);

  /* Calculate position in CSS pixels — dotX/dotY are in chart coords */
  const canvasRect=canvas.getBoundingClientRect();
  const scaleX=canvasRect.width/netWorthChartModel.width;
  const scaleY=canvasRect.height/netWorthChartModel.height;
  const pxX=dotX*scaleX;
  const pxY=dotY*scaleY;

  /* Position above dot on desktop, prefer right side on mobile */
  const popupW=220;
  const wrapW=wrap.offsetWidth;
  let left=Math.max(8,Math.min(wrapW-popupW-8, pxX-popupW/2));

  /* Place above if there's room, else below */
  const spaceAbove=pxY-8;
  const top=spaceAbove>120 ? pxY-popup.offsetHeight-16 : pxY+20;

  popup.style.left=left+'px';
  popup.style.top=Math.max(4,top)+'px';
}

window.hideNetWorthDotPopup=function(){
  const p=document.getElementById('nwDotPopup');
  if(p) p.remove();
};


function renderInvestmentChart(){
  const canvas=document.getElementById('investmentCanvas'); if(!canvas || !canvas.closest('.view.active')) return; const rect=canvas.parentElement.getBoundingClientRect(); canvas.width=Math.max(600,rect.width*devicePixelRatio); canvas.height=Math.max(240,rect.height*devicePixelRatio); const ctx=canvas.getContext('2d'); ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio; ctx.clearRect(0,0,w,h);
  const rows=allocationRows(); if(!rows.length){ ctx.fillStyle=getCss('--muted'); ctx.font='14px '+getComputedStyle(document.body).fontFamily; ctx.fillText('Add holdings to draw allocation.',20,42); return; } const max=Math.max(...rows.map(r=>r.value)); const barH=(h-34)/rows.length-8; rows.forEach((r,i)=>{ const y=22+i*(barH+8); const bw=(w-180)*(r.value/max); ctx.fillStyle='rgba(255,255,255,.06)'; roundRect(ctx,130,y,w-170,barH,9); ctx.fill(); ctx.fillStyle=COLORS[i%COLORS.length]; roundRect(ctx,130,y,bw,barH,9); ctx.fill(); ctx.fillStyle=getCss('--text'); ctx.font='600 13px '+getComputedStyle(document.body).fontFamily; ctx.fillText(r.name,14,y+barH/2+4); ctx.fillStyle=getCss('--muted'); ctx.font='12px '+getComputedStyle(document.body).fontFamily; ctx.fillText(`${pctFmt(r.pct)} · ${money(r.value)}`,140+bw,y+barH/2+4); });
}

function creditSeriesConfig(){
  return [
    {key:'average',label:'Average',color:getCss('--accent'),width:3,value:e=>avgScore(e)},
    {key:'experian',label:'Experian',color:getCss('--blue'),width:2,value:e=>e.experian},
    {key:'equifax',label:'Equifax',color:getCss('--purple'),width:2,value:e=>e.equifax},
    {key:'transunion',label:'TransUnion',color:getCss('--orange'),width:2,value:e=>e.transunion}
  ];
}

function chartSwatch(color){ return `<span class="chart-swatch" style="background:${color};color:${color}"></span>`; }

function updateCreditLegend(log,series){
  const el=document.getElementById('creditLegend'); if(!el) return;
  if(!log){ el.innerHTML='<span class="chart-legend-title">No score data</span>'; return; }
  const title=monthLabel(log.month);
  el.innerHTML=`<span class="chart-legend-title">${escapeHtml(title)}</span>`+series.map(s=>`<span class="legend-chip">${chartSwatch(s.color)}${escapeHtml(s.label)} <b>${scoreText(s.value(log))}</b></span>`).join('');
}

function showCreditTooltip(evt){
  const tip=document.getElementById('creditChartTip'); const wrap=document.getElementById('creditChartWrap');
  if(!tip || !wrap || !creditChartModel) return;
  const {logs,series}=creditChartModel; const idx=creditChartHoverIndex;
  if(idx===null || idx===undefined || !logs[idx]){ hideCreditTooltip(); return; }
  const log=logs[idx];
  const util=log.utilization===null || log.utilization===undefined ? '' : `<div class="chart-tip-row"><span class="chart-tip-label">Utilization</span><b>${pctFmt(log.utilization)}</b></div>`;
  const source=log.source ? `<div class="chart-tip-row"><span class="chart-tip-label">Source</span><b>${escapeHtml(log.source)}</b></div>` : '';
  tip.innerHTML=`<div class="chart-tip-title">${escapeHtml(monthLabel(log.month))}<span>Credit</span></div>`+
    series.map(s=>`<div class="chart-tip-row"><span class="chart-tip-label">${chartSwatch(s.color)}${escapeHtml(s.label)}</span><b>${scoreText(s.value(log))}</b></div>`).join('')+util+source;
  tip.classList.add('visible'); tip.setAttribute('aria-hidden','false');
  const rect=wrap.getBoundingClientRect();
  const rawX=evt ? evt.clientX-rect.left+14 : rect.width-260;
  const rawY=evt ? evt.clientY-rect.top+14 : 18;
  const maxX=Math.max(12,rect.width-tip.offsetWidth-12);
  const maxY=Math.max(12,rect.height-tip.offsetHeight-12);
  tip.style.left=`${Math.max(12,Math.min(maxX,rawX))}px`;
  tip.style.top=`${Math.max(12,Math.min(maxY,rawY))}px`;
}

function hideCreditTooltip(){ const tip=document.getElementById('creditChartTip'); if(tip){ tip.classList.remove('visible'); tip.setAttribute('aria-hidden','true'); } }

function bindCreditChartEvents(canvas){
  if(!canvas || canvas.dataset.creditHoverBound) return;
  canvas.dataset.creditHoverBound='1';
  const move=evt=>{
    if(!creditChartModel) return;
    const rect=canvas.getBoundingClientRect();
    const x=evt.clientX-rect.left, y=evt.clientY-rect.top;
    const {logs,pad,width,height,xFor}=creditChartModel;
    if(!logs.length || x<pad.l-24 || x>width-pad.r+24 || y<pad.t-32 || y>height-pad.b+36){ creditChartHoverIndex=null; hideCreditTooltip(); renderCreditChart(null); return; }
    let best=0,bestDist=Infinity;
    logs.forEach((_,i)=>{ const d=Math.abs(xFor(i)-x); if(d<bestDist){ best=i; bestDist=d; } });
    if(creditChartHoverIndex!==best){ creditChartHoverIndex=best; renderCreditChart(best); }
    showCreditTooltip(evt);
  };
  canvas.addEventListener('mousemove',move);
  canvas.addEventListener('mouseleave',()=>{ creditChartHoverIndex=null; hideCreditTooltip(); renderCreditChart(null); });
  canvas.addEventListener('focus',()=>{ if(creditChartModel?.logs?.length){ creditChartHoverIndex=creditChartModel.logs.length-1; renderCreditChart(creditChartHoverIndex); showCreditTooltip(null); } });
  canvas.addEventListener('blur',()=>{ creditChartHoverIndex=null; hideCreditTooltip(); renderCreditChart(null); });
}

function renderCreditChart(hoverIndex=creditChartHoverIndex){
  const canvas=document.getElementById('creditCanvas'); if(!canvas || !canvas.closest('.view.active')) return;
  bindCreditChartEvents(canvas);
  const wrap=canvas.parentElement; const rect=wrap.getBoundingClientRect();
  const dpr=window.devicePixelRatio||1; canvas.width=Math.max(620,rect.width*dpr); canvas.height=Math.max(260,rect.height*dpr);
  const ctx=canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=canvas.width/dpr,h=canvas.height/dpr; ctx.clearRect(0,0,w,h);
  const logs=(state.creditHistory||[]).slice().sort((a,b)=>String(a.month).localeCompare(String(b.month))).slice(-12);
  const series=creditSeriesConfig();
  if(!logs.length){ creditChartModel={logs:[],series,pad:{l:46,r:22,t:22,b:42},width:w,height:h,xFor:()=>0}; updateCreditLegend(null,series); hideCreditTooltip(); ctx.fillStyle=getCss('--muted'); ctx.font='14px '+getComputedStyle(document.body).fontFamily; ctx.fillText('Add monthly credit scores to draw your trend.',20,42); return; }
  const rawValues=[]; logs.forEach(log=>series.forEach(s=>{ const n=Number(s.value(log)); if(Number.isFinite(n) && n>0) rawValues.push(n); }));
  let min=Math.max(300,Math.floor((Math.min(...rawValues)-30)/10)*10); let max=Math.min(850,Math.ceil((Math.max(...rawValues)+30)/10)*10);
  if(!Number.isFinite(min) || !Number.isFinite(max) || min===max){ min=300; max=850; }
  if(max-min<80){ const mid=(min+max)/2; min=Math.max(300,Math.floor((mid-40)/10)*10); max=Math.min(850,Math.ceil((mid+40)/10)*10); }
  const pad={l:46,r:22,t:22,b:42};
  const xFor=i=>pad.l+(w-pad.l-pad.r)*(logs.length===1?0.5:i/(logs.length-1));
  const yFor=s=>pad.t+(h-pad.t-pad.b)*(1-(s-min)/(max-min));
  const tickCount=5; ctx.lineWidth=1; ctx.font='11px '+getComputedStyle(document.body).fontFamily;
  for(let i=0;i<tickCount;i++){
    const score=Math.round((min+(max-min)*(i/(tickCount-1)))/10)*10; const y=yFor(score);
    ctx.strokeStyle='rgba(148,163,184,.18)'; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    ctx.fillStyle=getCss('--muted'); ctx.fillText(String(score),8,y+4);
  }
  const activeIndex=Number.isInteger(hoverIndex) && logs[hoverIndex] ? hoverIndex : null;
  if(activeIndex!==null){
    const x=xFor(activeIndex); ctx.strokeStyle='rgba(148,163,184,.36)'; ctx.setLineDash([4,5]); ctx.beginPath(); ctx.moveTo(x,pad.t-4); ctx.lineTo(x,h-pad.b+4); ctx.stroke(); ctx.setLineDash([]);
  }
  const modelSeries=series.map(s=>{
    const pts=logs.map((e,i)=>({index:i,x:xFor(i),score:Number(s.value(e))})).filter(p=>Number.isFinite(p.score) && p.score>0).map(p=>({...p,y:yFor(p.score)}));
    if(pts.length){
      ctx.strokeStyle=s.color; ctx.lineWidth=s.width; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.stroke();
      pts.forEach(p=>{ const active=activeIndex===p.index; ctx.fillStyle=s.color; ctx.beginPath(); ctx.arc(p.x,p.y,active?6:4,0,Math.PI*2); ctx.fill(); if(active){ ctx.strokeStyle='rgba(255,255,255,.76)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y,9,0,Math.PI*2); ctx.stroke(); } });
    }
    return {...s,points:pts};
  });
  ctx.fillStyle=getCss('--muted'); ctx.font='12px '+getComputedStyle(document.body).fontFamily;
  logs.forEach((e,i)=>{ if(logs.length>6 && i%2) return; const x=xFor(i); const label=monthLabel(e.month).split(' ')[0]; ctx.fillText(label,Math.max(0,Math.min(w-48,x-20)),h-12); });
  creditChartModel={logs,series:modelSeries,pad,width:w,height:h,xFor,yFor,min,max};
  updateCreditLegend(logs[activeIndex ?? logs.length-1],modelSeries);
}

function renderCharts(){ renderSpendChart(); renderCreditChart(); renderNetWorthChart(); renderInvestmentChart(); }

function renderSpendChart(){ const canvas=document.getElementById('spendCanvas'); if(!canvas) return; const rect=canvas.parentElement.getBoundingClientRect(); canvas.width=Math.max(600,rect.width*devicePixelRatio); canvas.height=Math.max(220,rect.height*devicePixelRatio); const ctx=canvas.getContext('2d'); ctx.scale(devicePixelRatio,devicePixelRatio); const w=canvas.width/devicePixelRatio,h=canvas.height/devicePixelRatio; ctx.clearRect(0,0,w,h); const cats=byCategory(monthTransactions(currentMonth())).slice(0,8); if(!cats.length){ ctx.fillStyle=getCss('--muted'); ctx.font='14px '+getComputedStyle(document.body).fontFamily; ctx.fillText('Import transactions to draw the spending map.',20,40); return; } const max=Math.max(...cats.map(c=>c[1])); const barH=(h-38)/cats.length-8; cats.forEach(([cat,val],i)=>{ const y=22+i*(barH+8); const bw=(w-190)*(val/max); ctx.fillStyle='rgba(255,255,255,.06)'; roundRect(ctx,160,y,w-190,barH,9); ctx.fill(); const grad=ctx.createLinearGradient(160,y,160+bw,y); grad.addColorStop(0,COLORS[i%COLORS.length]); grad.addColorStop(1,COLORS[(i+1)%COLORS.length]); ctx.fillStyle=grad; roundRect(ctx,160,y,bw,barH,9); ctx.fill(); ctx.fillStyle=getCss('--text'); ctx.font='600 13px '+getComputedStyle(document.body).fontFamily; ctx.fillText(cat,14,y+barH/2+4); ctx.fillStyle=getCss('--muted'); ctx.font='12px '+getComputedStyle(document.body).fontFamily; ctx.fillText(money(val),160+bw+10,y+barH/2+4); }); }

function roundRect(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }

function getCss(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

function confetti(){ const wrap=document.createElement('div'); wrap.className='confetti'; document.body.appendChild(wrap); for(let i=0;i<80;i++){ const el=document.createElement('i'); el.style.left=Math.random()*100+'vw'; el.style.background=COLORS[i%COLORS.length]; el.style.animationDelay=Math.random()*0.3+'s'; el.style.transform=`rotate(${Math.random()*360}deg)`; wrap.appendChild(el); } setTimeout(()=>wrap.remove(),1600); }
