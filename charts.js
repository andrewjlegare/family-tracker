// Small hand-rolled SVG/HTML chart helpers (no libraries, works offline).
(function(){
const PAL=['#6366f1','#ec4899','#f59e0b','#10b981','#06b6d4','#f43f5e','#8b5cf6','#84cc16','#f97316','#14b8a6','#3b82f6','#d946ef'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0});
const money2=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

const colorMap={};
function color(key){const ic=window.Icons&&window.Icons.colorOf(key);if(ic)return ic;if(!colorMap[key])colorMap[key]=PAL[Object.keys(colorMap).length%PAL.length];return colorMap[key]}

function donut(data,{size=220,center='',sub=''}={}){
  const total=data.reduce((s,d)=>s+d.v,0)||1,r=size/2-24,C=2*Math.PI*r;let off=0;
  const segs=data.map(d=>{const len=d.v/total*C;const s=`<circle class="seg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${d.color}" stroke-width="26"
    stroke-dasharray="${Math.max(0,len-2)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})"><title>${esc(d.label)}: ${money2(d.v)} (${Math.round(d.v/total*100)}%)</title></circle>`;off+=len;return s}).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="donut"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="26"/>${segs}
   <text x="50%" y="48%" text-anchor="middle" class="d-big">${esc(center)}</text><text x="50%" y="60%" text-anchor="middle" class="d-sub">${esc(sub)}</text></svg>`;
}

function legend(data){const t=data.reduce((s,d)=>s+d.v,0)||1;
  return `<div class="legend">${data.map(d=>`<div><i style="background:${d.color}"></i><span>${esc(d.label)}</span><b>${money(d.v)}</b><em>${Math.round(d.v/t*100)}%</em></div>`).join('')}</div>`}

function area(vals,labels,{w=520,h=300,c='#6366f1',fmt=money,id='a'}={}){
  const n=vals.length;if(!n)return '';const mx=Math.max(1,...vals)*1.1,px=34,pb=24,pt=8;
  const X=i=>px+(n===1?0:i/(n-1))*(w-px-8),Y=v=>pt+(1-v/mx)*(h-pb-pt);
  const pts=vals.map((v,i)=>[X(i),Y(v)]);
  const line=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const fill=line+` L${X(n-1)} ${h-pb} L${X(0)} ${h-pb} Z`;
  const grid=[0,.5,1].map(f=>`<line x1="${px}" x2="${w-8}" y1="${Y(mx*f/1.1*1.1*0+mx*f)}" y2="${Y(mx*f)}" stroke="var(--grid)"/><text x="${px-6}" y="${Y(mx*f)+4}" text-anchor="end" class="ax">${fmt(mx*f)}</text>`).join('');
  const step=Math.ceil(n/8);
  const xl=labels.map((l,i)=>i%step===0?`<text x="${X(i)}" y="${h-6}" text-anchor="middle" class="ax">${esc(l)}</text>`:'').join('');
  const dots=pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${n>40?0:4}" fill="${c}" class="dot"><title>${esc(labels[i])}: ${fmt(vals[i])}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".45"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
   ${grid}<path d="${fill}" fill="url(#g${id})"/><path d="${line}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ln"/>${dots}${xl}</svg>`;
}

function bars(items,{h=180,fmt=money}={}){ // items: [{label,v,color,v2?}]
  const mx=Math.max(1,...items.map(i=>Math.max(i.v,i.v2||0)));
  return `<div class="vbars" style="height:${h}px">${items.map(i=>`<div class="vb"><div class="vb-wrap">${i.v2!=null?`<div class="vb-col" style="height:${i.v2/mx*100}%;background:${i.color2||'#10b981'}" title="${esc(i.label)}: ${fmt(i.v2)}"></div>`:''}<div class="vb-col" style="height:${i.v/mx*100}%;background:${i.color||'var(--accent)'}" title="${esc(i.label)}: ${fmt(i.v)}">${i.v2!=null?'':`<em>${fmt(i.v)}</em>`}</div></div><span>${esc(i.label)}</span></div>`).join('')}</div>`;
}

function hbars(items,{fmt=money2}={}){
  const mx=Math.max(1,...items.map(i=>i.v));
  return `<div class="hbars">${items.map(i=>`<div class="hb"><span class="hb-l" title="${esc(i.label)}">${esc(i.label)}</span><div class="hb-t"><div class="hb-f" style="width:${i.v/mx*100}%;background:${i.color||'var(--accent)'}"></div></div><b>${fmt(i.v)}</b></div>`).join('')}</div>`;
}

function ring(pct,{size=84,c='#10b981',label=''}={}){
  const r=size/2-8,C=2*Math.PI*r,p=Math.min(1,pct),col=pct>1?'#f43f5e':pct>.85?'#f59e0b':c;
  return `<svg viewBox="0 0 ${size} ${size}" class="ring"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="9"/>
  <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${p*C} ${C}" transform="rotate(-90 ${size/2} ${size/2})"/>
  <text x="50%" y="54%" text-anchor="middle" class="r-t">${Math.round(pct*100)}%</text></svg>`;
}

function spark(vals,c='#fff'){
  const n=vals.length;if(n<2)return '';const mx=Math.max(...vals),mn=Math.min(...vals),w=100,h=30;
  const pts=vals.map((v,i)=>`${i/(n-1)*w},${h-2-(mx===mn?.5:(v-mn)/(mx-mn))*(h-4)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" class="spark"><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function heatmap(month,byDay,{fmt=money}={}){ // month 'YYYY-MM', byDay {'YYYY-MM-DD':amount}
  const [y,m]=month.split('-').map(Number),first=new Date(y,m-1,1),days=new Date(y,m,0).getDate(),off=first.getDay();
  const mx=Math.max(1,...Object.values(byDay));let cells='';
  ['S','M','T','W','T','F','S'].forEach(d=>cells+=`<div class="hm-h">${d}</div>`);
  for(let i=0;i<off;i++)cells+='<div></div>';
  for(let d=1;d<=days;d++){const k=`${month}-${String(d).padStart(2,'0')}`,v=byDay[k]||0,a=v?0.15+0.85*v/mx:0;
    cells+=`<div class="hm-c" style="background:${v?`rgba(244,63,94,${a.toFixed(2)})`:'var(--track)'}" title="${k}: ${fmt(v)}"><small>${d}</small></div>`;}
  return `<div class="heat">${cells}</div>`;
}


function stacked(cols,{h=200,fmt=money}={}){ // cols:[{label,parts:[{label,v,color}]}]
  const tot=c=>c.parts.reduce((s,p)=>s+p.v,0),mx=Math.max(1,...cols.map(tot));
  return `<div class="vbars" style="height:${h}px">${cols.map(c=>`<div class="vb"><div class="vb-wrap"><div class="stk" style="height:${tot(c)/mx*100}%" title="${esc(c.label)}: ${fmt(tot(c))}">${c.parts.map(p=>`<div style="flex:${p.v};background:${p.color}" title="${esc(p.label)}: ${fmt(p.v)}"></div>`).join('')}<em>${fmt(tot(c))}</em></div></div><span>${esc(c.label)}</span></div>`).join('')}</div>`;
}
function cents(data){const t=data.reduce((s,d)=>s+d.v,0)||1;
  return `<div class="cents">${data.map(d=>`<div style="flex:${d.v};background:${d.color}" title="${esc(d.label)}: ${Math.round(d.v/t*100)}¢ of every $1">${d.v/t>.07?Math.round(d.v/t*100)+'¢':''}</div>`).join('')}</div>`}

window.Charts={stacked,cents,PAL,color,donut,legend,area,bars,hbars,ring,spark,heatmap,money,money2,esc};
})();
