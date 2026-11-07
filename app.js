(function(){
'use strict';
/* ====== EDIT THESE to change the two logins ====== */
const USERS=[
  {email:'andrewjlegare@gmail.com',name:'Andrew',initial:'A',grad:'linear-gradient(135deg,#6366f1,#06b6d4)',c:'#6366f1'},
  {email:'rachelnlegare@gmail.com',name:'Rachel',initial:'R',grad:'linear-gradient(135deg,#ec4899,#f59e0b)',c:'#ec4899'}
];
/* ================================================= */
const KEY='familyApp.v2';
const C=window.Charts,esc=C.esc,money=C.money,money2=C.money2;
const $=(s,r=document)=>r.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,9);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const MOODS=[1,2,3,4,5].map(n=>Icons.svg('f'+n,26,1.6));

let S;
try{S=JSON.parse(localStorage.getItem(KEY))||{}}catch(e){S={}}
S.shopping=S.shopping||[];S.meals=S.meals||{};S.events=S.events||[];S.tasks=S.tasks||[];S.budgets=S.budgets||{};S.extraTx=S.extraTx||[];S.users=S.users||{};if(!S.themeV3){S.theme='dark';S.themeV3=1}S.theme=S.theme||'dark';S.rules=S.rules||{};
USERS.forEach(u=>{S.users[u.email]=S.users[u.email]||{journal:[],habits:[],log:{}}});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const me=()=>USERS.find(u=>u.email===S.session);
const mine=()=>S.users[S.session];

/* ---------- data helpers ---------- */
const allTx=()=>window.BANK_TX.concat(S.extraTx);
const isIncome=t=>t.a>0&&['Paychecks','Other Income','Deposits'].includes(t.c)&&!/HVAC DIRECT/.test(t.t)&&cat(t)!=='Transfers';
const isSpend=t=>(t.a<0||(t.a>0&&!isIncome(t)))&&cat(t)!=='Transfers'; // refunds net against spending
const months=()=>[...new Set(allTx().map(t=>t.d.slice(0,7)))].sort().reverse();
const txOf=m=>allTx().filter(t=>t.d.startsWith(m));
const sum=a=>a.reduce((s,x)=>s+x,0);
function merchant(d){
  let s=d.toUpperCase().replace(/^(SQ \*|IC\* |TST\* |PIN POS |POS )/,'').replace(/[^A-Z&' ]/g,' ').replace(/\b(MD|VA|PA|CA|IL|WA|INC|LLC|STORE|STOR|THURMONT|LUSBY|REISTERSTOW|DUNKIRK)\b/g,'').trim().split(/\s+/).filter(Boolean).slice(0,2).join(' ');
  return (s||d).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}

const FRIENDLY={'General Merchandise':'Shopping & Household','Restaurants and Dining':'Restaurants','Cash Withdrawals':'Cash','Other Expenses':'Other','Home Improvement':'Home Improvement','Services and Supplies':'Business & Services','Service Charges and Fees':'Fees','Subscriptions and Renewals':'Subscriptions','Gas and Fuel':'Gas','Healthcare':'Health','Cable':'Internet & TV','Entertainment':'Fun','Charity':'Giving','Uncategorized':'Needs a label','Paychecks':'Paycheck','Entertainment':'Fun & Travel','Travel':'Fun & Travel','Hobbies':'Fun & Travel','Phone':'Phone & Internet','Cable':'Phone & Internet','Subscriptions and Renewals':'Subscriptions','Charity':'Giving','Healthcare':'Health','Education':'Homeschool & Education','Shipping':'Shopping & Household','Services and Supplies':'Tech & Business','Auto Maintenance':'Car Expenses','Groceries':'Groceries & Snacks'};
const I=(n,z)=>Icons.svg(n,z||18);
const catIcon=c=>Icons.svg(Icons.catIcon(c),15,2);
let openSet=new Set();
const autoCat=t=>{const u=t.t.toUpperCase();for(const r of window.CAT_RULES){if(r[0].test(u)&&(!r[2]||-t.a>=r[2]))return r[1]}return null};
const cat=t=>{const b=S.rules[merchant(t.t)]||autoCat(t)||FRIENDLY[t.c]||t.c;return b==='Transfers'&&t.a<0&&billKeys().has(merchant(t.t))?'Bills & Payments':b};
function byCat(tx){const o={};tx.filter(isSpend).forEach(t=>o[cat(t)]=(o[cat(t)]||0)-t.a);return Object.entries(o).filter(e=>e[1]>0.005).sort((a,b)=>b[1]-a[1])}
function catData(tx,max=8){
  const e=byCat(tx),top=e.slice(0,max).map(([k,v])=>({label:k,v,color:C.color(k)})),rest=sum(e.slice(max).map(x=>x[1]));
  if(rest>0)top.push({label:'Other',v:rest,color:'#94a3b8'});return top;
}
function dailyMap(tx){const o={};tx.filter(isSpend).forEach(t=>o[t.d]=(o[t.d]||0)-t.a);return o}
const prevMonth=m=>{const [y,mo]=m.split('-').map(Number);const d=new Date(y,mo-2,1);return iso(d).slice(0,7)};
const monthName=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo-1,1).toLocaleDateString(undefined,{month:'long',year:'numeric'})};
function mondayOf(d){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x}

let calMonth=iso(new Date()).slice(0,7),calSel=iso(new Date());
let tab='home',month=months()[0],weekStart=mondayOf(new Date()),txf={q:'',cat:''},gq='',gcat='';
let draft={mood:3,text:'',tags:'',shared:false};

/* ---------- shared month pieces ---------- */
let selCat='';
function monthBar(){
  const ms=months(),i=ms.indexOf(month);
  return `<div class="monthbar"><button class="btn alt" data-mo="1" ${i>=ms.length-1?'disabled':''}>${Icons.svg("chev",16).replace("<svg ","<svg style=\"transform:rotate(90deg)\" ")} ${i<ms.length-1?monthName(ms[i+1]).split(' ')[0]:''}</button><h2>${monthName(month)}</h2><button class="btn alt" data-mo="-1" ${i<=0?'disabled':''}>${i>0?monthName(ms[i-1]).split(' ')[0]:''} ${Icons.svg('chev',16).replace('<svg ','<svg style="transform:rotate(-90deg)" ')}</button>
  <select id="bm">${ms.map(m=>`<option value="${m}" ${m===month?'selected':''}>${monthName(m)}</option>`).join('')}</select>${isPartial(month)?'<span class="chip soft">in progress</span>':''}</div>`;
}
function isPartial(m){const n=new Date();return m===iso(n).slice(0,7)}
function monthStats(m){
  const tx=txOf(m),sp=tx.filter(isSpend),inc=sum(tx.filter(isIncome).map(t=>t.a)),spent=-sum(sp.map(t=>t.a));
  const cats=byCat(tx);return {tx,sp,inc,spent,cats,n:sp.length}
}
function story(){
  const s=monthStats(month),pm=prevMonth(month),p=monthStats(pm);
  const days=isPartial(month)?new Date().getDate():new Date(+month.slice(0,4),+month.slice(5),0).getDate();
  const c=s.cats;if(!c.length)return '<p class="mute">No spending recorded this month.</p>';
  const chg=p.spent?Math.round((s.spent-p.spent)/p.spent*100):null;
  const big=s.sp.slice().sort((a,b)=>a.a-b.a)[0];
  return `<p class="story">In ${monthName(month)} you spent <b>${money(s.spent)}</b> on <b>${s.n}</b> purchases — about <b>${money(s.spent/days)}</b> a day.
   Most of it went to <b>${catIcon(c[0][0])} ${esc(c[0][0])}</b> (${money(c[0][1])})${c[1]?`, then <b>${catIcon(c[1][0])} ${esc(c[1][0])}</b> (${money(c[1][1])})`:''}${c[2]?` and <b>${catIcon(c[2][0])} ${esc(c[2][0])}</b> (${money(c[2][1])})`:''}.
   The single biggest purchase was <b>${money(-big.a)}</b> at ${esc(merchant(big.t))}.
   ${s.inc?`You brought in <b>${money(s.inc)}</b> and kept <b>${money(s.inc-s.spent)}</b> (${Math.round((s.inc-s.spent)/s.inc*100)}%).`:''}
   ${chg!==null&&!isPartial(month)?`That's <span class="${chg>0?'up':'dn'}">${Math.abs(chg)}% ${chg>0?'more':'less'}</span> than ${monthName(pm).split(' ')[0]}.`:''}</p>`;
}
function dollar(cats){const t=sum(cats.map(c=>c[1]));return C.cents(cats.map(([k,v])=>({label:k,v,color:C.color(k)}))) + `<div class="mute">For every $1 you spent — hover a color to see who got it</div>`}

/* ---------- BANK BALANCE + GROUPS ---------- */
const groupOf=c=>window.CAT_GROUP_OF[c]||'Cash & Misc';
const GMETA=()=>Object.fromEntries(window.CAT_GROUPS.map(g=>[g[0],g]));
function groupStats(tx){const g={};byCat(tx).forEach(([c,v])=>{const G=groupOf(c);(g[G]=g[G]||{v:0,cats:[]});g[G].v+=v;g[G].cats.push([c,v])});return Object.entries(g).sort((a,b)=>b[1].v-a[1].v)}
const gTile=(n,sz=38)=>Icons.tile(Icons.groupIcon(n),Icons.GCOL[n],sz);
const cTile=(c,sz=30)=>Icons.tile(Icons.catIcon(c),Icons.colorOf(c)||C.color(c),sz);
const pct=(a,b)=>b?Math.round(a/b*100):0;
function deltaTxt(a,b,good){ // good: 'down' means lower is better
  if(!b||isPartial(month))return '';const p=Math.round((a-b)/b*100);if(!p)return '<span class="mute">same as last month</span>';
  const better=good==='down'?p<0:p>0;return `<span class="delta ${better?'ok':'warn'}">${Icons.svg(p>0?'arrow-up':'arrow-down',13,2.4)}${Math.abs(p)}%</span>`;
}
function balanceCard(){
  const B=window.BANK_BALANCE;if(!B)return '';
  const vals=B.eod.map(x=>x[1]);
  return `<section class="card balance"><div class="bal-l"><div class="eyebrow">${Icons.svg('bank',15)} In the bank</div>
   <div class="bigmoney" data-count="${B.posted}">${money2(B.posted)}</div>
   <div class="sub">${B.pendingN} pending (${money2(B.pending)}) · <b>${money2(B.available)}</b> once they clear</div></div>
   <div class="bal-r">${C.spark(vals,'var(--accent)')}<small class="mute">balance, last ${vals.length} days</small></div></section>`;
}
/* ---------- HOME ---------- */
function home(){
  const m=month,s=monthStats(m),pm=prevMonth(m),p=monthStats(pm),inc=s.inc,sp=s.spent,left=inc-sp;
  const hr=new Date().getHours(),greet=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  const gs=groupStats(s.tx),tk=iso(new Date()),meal=S.meals[tk]||{};
  const dm=dailyMap(s.tx),days=Object.keys(dm).sort();
  const need=s.tx.filter(t=>isSpend(t)&&['Needs a label','Other','Checks'].includes(cat(t))).length;
  const ms=months().slice(0,6).reverse();
  const kinds=[['fixed','Fixed bills','#4f46e5'],['everyday','Everyday living','#10b981'],['wants','Fun & subscriptions','#8b5cf6'],['unsorted','Cash & misc','#94a3b8']];
  const meta=GMETA(),kv=k=>sum(gs.filter(([n])=>meta[n]&&meta[n][3]===k).map(([,x])=>x.v));
  const top=gs[0];
  const today=iso(new Date()),next=billsDetect().map(b=>{let n=b.next;const dt=new Date(n);while(n<today){dt.setMonth(dt.getMonth()+(b.every||1));n=iso(dt)}return {...b,due:n,inDays:Math.round((new Date(n)-new Date(today))/864e5)}}).filter(b=>b.inDays<=21).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5);
  const open=S.tasks.filter(t=>!t.done).length,shop=S.shopping.filter(i=>!i.done).length;
  return `<section class="hello"><div><h1>${greet}, ${me().name}</h1><p>${new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</p></div>
   <div class="quick"><button class="pill" data-go="groceries">${Icons.svg('cart',16)} Shopping list <b>${shop}</b></button><button class="pill" data-go="habits">${Icons.svg('check',16)} To-dos <b>${open}</b></button><button class="pill" data-go="journal">${Icons.svg('pen',16)} Journal</button></div></section>
  ${balanceCard()}
  ${monthBar()}
  <section class="card glance"><div class="three">
    <div><div class="eyebrow">Came in</div><div class="num-xl good" data-count="${inc}">${money(inc)}</div>${deltaTxt(inc,p.inc,'up')}</div>
    <div><div class="eyebrow">Spent</div><div class="num-xl" data-count="${sp}">${money(sp)}</div>${deltaTxt(sp,p.spent,'down')}</div>
    <div><div class="eyebrow">${left>=0?'Left over':'Over by'}</div><div class="num-xl ${left>=0?'good':'bad'}" data-count="${Math.abs(left)}">${money(Math.abs(left))}</div><span class="mute">${inc?pct(Math.abs(left),inc)+'% of income':''}</span></div></div>
   ${inc?`<div class="meter" title="${money(sp)} of ${money(inc)}"><i style="width:${Math.min(100,sp/inc*100)}%"></i></div>`:''}
   <p class="story">${s.cats.length?`${isPartial(m)?'So far this month':'In '+monthName(m).split(' ')[0]}, most of the money went to <b>${esc(top[0])}</b> (${money(top[1].v)}). ${need?`<a class="lnk" data-go="money">${need} purchase${need>1?'s':''} still need a label.</a>`:''}`:'Nothing recorded yet.'}</p></section>
  <div class="grid g2">
   <section class="card"><h2>Where it went</h2>
    <div class="split">${C.donut(gs.map(([n,x])=>({label:n,v:x.v,color:Icons.GCOL[n]||'#94a3b8'})),{center:money(sp),sub:'spent'})}
    <div class="grows">${gs.map(([n,x])=>`<button class="grow" data-gotab="money" data-open="${esc(n)}">${gTile(n,30)}<span class="gn">${esc(n)}</span><b>${money(x.v)}</b><em>${pct(x.v,sp)}%</em></button>`).join('')}</div></div></section>
   <section class="card"><h2>Bills vs. everyday</h2>
    <div class="stackbar">${kinds.map(([k,l,c])=>kv(k)?`<i style="flex:${kv(k)};background:${c}" title="${l}: ${money(kv(k))}"></i>`:'').join('')}</div>
    <div class="klist">${kinds.map(([k,l,c])=>`<div><i style="background:${c}"></i><span>${l}</span><b>${money(kv(k))}</b><em>${pct(kv(k),sp)}%</em></div>`).join('')}</div>
    <h3 class="sub-h">Coming up</h3>
    ${next.length?next.map(b=>`<div class="due"><span class="when ${b.inDays<=3?'hot':''}">${b.inDays===0?'Today':b.inDays===1?'Tomorrow':b.inDays+' days'}</span><span class="dn-n">${esc(b.k)}</span><b>${money(b.med)}</b></div>`).join(''):'<p class="mute">Nothing due in the next three weeks.</p>'}</section>
   <section class="card"><h2>Month by month <span class="mute"><i class="dot-k" style="background:#10b981"></i>in <i class="dot-k" style="background:#f43f5e"></i>out</span></h2>${C.bars(ms.map(x=>({label:monthName(x).slice(0,3),v:monthStats(x).spent,v2:monthStats(x).inc,color:'#f43f5e',color2:'#10b981'})))}</section>
   <section class="card"><h2>Today</h2>
    <div class="todayrow">${Icons.tile('utensils','#10b981',32)}<div><small class="mute">Dinner</small><div>${esc(meal.dinner)||'<span class="mute">nothing planned</span>'}</div></div></div>
    <div class="todayrow">${Icons.tile('coffee','#f59e0b',32)}<div><small class="mute">Lunch</small><div>${esc(meal.lunch)||'<span class="mute">nothing planned</span>'}</div></div></div>
    <div class="todayrow">${Icons.tile('calendar','#6366f1',32)}<div><small class="mute">Events</small><div>${eventsOn(tk).map(e=>esc(e.t)).join(' · ')||'<span class="mute">nothing scheduled</span>'}</div></div></div></section>
  </div>`;
}

/* ---------- SPENDING ---------- */
function allCatNames(){return [...new Set(allTx().map(cat).concat(Object.values(S.rules),Object.keys(window.CAT_GROUP_OF).concat(['Transfers'])))].filter(c=>c!=='Paycheck').sort()}
function recatKey(k,cur){return `<select class="recat" data-m="${esc(k)}">${allCatNames().map(c=>`<option ${c===cur?'selected':''}>${esc(c)}</option>`).join('')}</select>`}
function recatSel(t){const k=merchant(t.t),cur=cat(t);return `<select class="recat" data-m="${esc(k)}" title="Change the category for every ${esc(k)} purchase">${allCatNames().map(c=>`<option ${c===cur?'selected':''}>${esc(c)}</option>`).join('')}</select>`}

let mview='month',mwk=mondayOf(new Date()),myear=String(new Date().getFullYear());
const dstr=d=>iso(d);
function periodTx(){
  if(mview==='week'){const a=dstr(mwk),e=new Date(mwk);e.setDate(e.getDate()+6);const z=dstr(e);return allTx().filter(t=>t.d>=a&&t.d<=z)}
  if(mview==='year')return allTx().filter(t=>t.d.startsWith(myear));
  return txOf(month);
}
function statsOf(tx){const inc=sum(tx.filter(isIncome).map(t=>t.a)),sp=tx.filter(isSpend),spent=-sum(sp.map(t=>t.a));return {tx,inc,spent,cats:byCat(tx),n:sp.length}}
function periodBar(){
  const lab=mview==='week'?(()=>{const e=new Date(mwk);e.setDate(e.getDate()+6);const f=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric'});return f(mwk)+' – '+f(e)})():mview==='year'?myear:monthName(month);
  return `<div class="seg3">${[['week','Week'],['month','Month'],['year','Year']].map(([k,l])=>`<button data-mview="${k}" class="${k===mview?'on':''}">${l}</button>`).join('')}</div>
  <div class="monthbar"><button class="btn alt" data-mp="-1">${Icons.svg('chev',16).replace('<svg ','<svg style="transform:rotate(90deg)" ')}</button><h2>${lab}</h2><button class="btn alt" data-mp="1">${Icons.svg('chev',16).replace('<svg ','<svg style="transform:rotate(-90deg)" ')}</button></div>`;
}
function money_(){
  const tx=periodTx(),s=statsOf(tx),meta=GMETA(),gs=groupStats(tx);
  const kv=k=>sum(gs.filter(([n])=>meta[n]&&meta[n][3]===k).map(([,x])=>x.v)),bills=kv('fixed'),other=s.spent-bills,left=s.inc-s.spent;
  const need=tx.filter(t=>isSpend(t)&&['Needs a label','Other','Checks'].includes(cat(t)));
  const incList=(()=>{const o={};tx.filter(isIncome).forEach(t=>o[merchant(t.t)]=(o[merchant(t.t)]||0)+t.a);return Object.entries(o).sort((a,b)=>b[1]-a[1])})();
  const row=t=>`<tr><td class="dt">${t.d.slice(5)}</td><td>${esc(t.t)}${t.p?' <span class="mute">· pending</span>':''}</td><td class="num"><b>${money2(-t.a)}</b></td></tr>`;
  const catBlock=([c,v])=>{const k='c:'+c,items=tx.filter(t=>isSpend(t)&&cat(t)===c).sort((a,b)=>a.a-b.a);
    return `<details class="crow" data-k="${esc(k)}" ${openSet.has(k)?'open':''}><summary>${cTile(c,28)}<span class="cn">${esc(c)}</span><span class="cv">${money(v)}</span>${Icons.svg('chev',16)}</summary>
     <div class="cbody"><div class="mute" style="margin-bottom:6px">${items.length} purchase${items.length>1?'s':''}</div><table>${items.map(t=>row(t).replace('</tr>',`<td>${recatSel(t)}</td></tr>`)).join('')}</table></div></details>`};
  const groupBlock=([n,x])=>{const k='g:'+n,col=Icons.GCOL[n]||'#94a3b8';
    return `<details class="gcard card" data-k="${esc(k)}" style="--c:${col}" ${openSet.has(k)?'open':''}><summary>${gTile(n,44)}<div class="gt"><b>${esc(n)}</b><div class="meter sm"><i style="width:${pct(x.v,gs[0][1].v)}%;background:${col}"></i></div></div><div class="gv"><b>${money(x.v)}</b><em>${pct(x.v,s.spent)}%</em></div>${Icons.svg('chev',18)}</summary><div class="gbody">${x.cats.map(catBlock).join('')}</div></details>`};
  // period chart
  let chart='',chartT='';
  if(mview==='week'){chartT='Day by day';const dm=dailyMap(tx);chart=C.bars(Array.from({length:7},(_,i)=>{const d=new Date(mwk);d.setDate(d.getDate()+i);return {label:d.toLocaleDateString(undefined,{weekday:'short'}),v:dm[dstr(d)]||0,color:Icons.GCOL['Home & Bills']}}))}
  else if(mview==='month'){chartT='Week by week';const dm=dailyMap(tx),first=new Date(month+'-01T12:00'),last=new Date(+month.slice(0,4),+month.slice(5),0),ws=[];let w=mondayOf(first);while(w<=last){let t0=0;for(let i=0;i<7;i++){const d=new Date(w);d.setDate(d.getDate()+i);if(dstr(d).startsWith(month))t0+=dm[dstr(d)]||0}ws.push({label:w.toLocaleDateString(undefined,{month:'short',day:'numeric'}),v:t0,color:'#4f46e5'});w=new Date(w);w.setDate(w.getDate()+7)}chart=C.bars(ws)}
  else{chartT='Month by month';const ms=[...new Set(tx.map(t=>t.d.slice(0,7)))].sort();chart=C.bars(ms.map(x=>{const st=statsOf(tx.filter(t=>t.d.startsWith(x)));return {label:monthName(x).slice(0,3),v:st.spent,v2:st.inc,color:'#f43f5e',color2:'#10b981'}}))}
  // year outlook
  let yearCard='';
  if(mview==='year'){const cur=iso(new Date()).slice(0,7),ms=[...new Set(tx.map(t=>t.d.slice(0,7)))].sort().filter(x=>x!==cur&&x!==ms0()),use=ms.length?ms:[...new Set(tx.map(t=>t.d.slice(0,7)))],avgS=sum(use.map(x=>statsOf(tx.filter(t=>t.d.startsWith(x))).spent))/use.length,avgI=sum(use.map(x=>statsOf(tx.filter(t=>t.d.startsWith(x))).inc))/use.length,bm=sum(billsDetect().map(b=>b.mo||b.med));
    yearCard=`<section class="card"><h2>${I('calendar')} The year at this pace</h2><div class="three"><div><div class="eyebrow">Income / yr</div><div class="num-xl good">${money(avgI*12)}</div></div><div><div class="eyebrow">Spending / yr</div><div class="num-xl">${money(avgS*12)}</div></div><div><div class="eyebrow">Regular bills / yr</div><div class="num-xl">${money(bm*12)}</div></div></div><p class="mute" style="margin-top:12px">Based on ${use.length} full month${use.length>1?'s':''} of data (averages: ${money(avgI)} in, ${money(avgS)} out per month). More history makes this sharper.</p></section>`}
  return `${periodBar()}
  <section class="card glance"><div class="three">
   <div><div class="eyebrow">Income</div><div class="num-xl good">${money(s.inc)}</div></div>
   <div><div class="eyebrow">Bills</div><div class="num-xl">${money(bills)}</div><span class="mute">${pct(bills,s.spent)}% of spending</span></div>
   <div><div class="eyebrow">Everything else</div><div class="num-xl">${money(other)}</div><span class="mute">${s.n} purchases</span></div></div>
   ${s.inc?`<div class="stackbar" style="margin-top:18px;height:14px"><i style="flex:${bills};background:#4f46e5" title="Bills"></i><i style="flex:${Math.max(0,other)};background:#10b981" title="Everything else"></i><i style="flex:${Math.max(0,left)};background:var(--track)" title="Left"></i></div>`:''}
   <p class="story">${left>=0?`Kept <b>${money(left)}</b>`:`Over by <b>${money(-left)}</b>`}${s.inc?` (${pct(Math.abs(left),s.inc)}% of income)`:''}. ${incList.length?'':'No income in this period.'}</p></section>
  <div class="grid g2"><section class="card"><h2>${chartT}</h2>${chart}</section>
   <section class="card"><h2>${I('down')} Income <span class="mute">${money(s.inc)}</span></h2>${incList.length?incList.map(([k,v])=>`<div class="due"><span class="dn-n">${esc(k)}</span><b class="good">${money2(v)}</b></div>`).join(''):'<p class="mute">Nothing came in.</p>'}</section></div>
  ${yearCard}
  <h2 class="sec">Where it went <span class="mute">tap a group to open it</span></h2>
  ${gs.length?gs.map(groupBlock).join(''):'<p class="mute">No spending in this period.</p>'}
  ${need.length?`<section class="card"><h2>${I('tag')} Help me label these <span class="mute">${need.length}</span></h2><p class="mute" style="margin:-6px 0 10px">Pick a category once and every purchase from that place is sorted from now on.</p><div class="scroll"><table>${need.slice(0,25).map(t=>`<tr><td>${esc(t.t)}<div class="mute">${t.d.slice(5)} · ${money2(-t.a)}</div></td><td>${recatSel(t)}</td></tr>`).join('')}</table></div></section>`:''}
  <h2 class="sec">Coming up <span class="mute">bills due &amp; what to expect</span></h2>
  ${forecastCards()}
  <details class="card fold" data-k="lim" ${openSet.has('lim')?'open':''}><summary><h2>${I('shield')} Monthly limits</h2>${Icons.svg('chev',18)}</summary><table>${monthStats(month).cats.map(([c,v])=>{const l=S.budgets[c]||0;return `<tr><td>${cTile(c,24)} ${esc(c)}</td><td class="num">${money(v)}</td><td><input class="lim" data-c="${esc(c)}" type="number" min="0" style="width:84px" value="${l||''}" placeholder="limit"></td><td style="width:28%">${l?`<div class="bar ${v>l?'over':''}"><i style="width:${Math.min(100,v/l*100)}%"></i></div>`:''}</td></tr>`}).join('')}</table></details>
  <details class="card fold" data-k="all" ${openSet.has('all')?'open':''}><summary><h2>${I('list')} Every transaction</h2>${Icons.svg('chev',18)}</summary><div class="row"><input id="tq" placeholder="Search…" value="${esc(txf.q)}"><select id="tc"><option value="">All categories</option>${allCatNames().map(c=>`<option ${c===txf.cat?'selected':''}>${esc(c)}</option>`).join('')}</select><label class="btn alt sm">${I('upload',15)} Import PNC CSV<input id="imp" type="file" accept=".csv" hidden></label></div>
   <table>${tx.filter(t=>(!txf.cat||cat(t)===txf.cat)&&(!txf.q||t.t.toLowerCase().includes(txf.q.toLowerCase()))).sort((a,b)=>b.d.localeCompare(a.d)).slice(0,150).map(t=>`<tr><td class="dt">${t.d.slice(5)}</td><td>${esc(t.t)}${t.p?' <span class="mute">· pending</span>':''}</td><td>${t.a<0?recatSel(t):'<span class="chip" style="background:#10b981">Income</span>'}</td><td class="num ${t.a<0?'':'good'}"><b>${money2(t.a)}</b></td></tr>`).join('')}</table></details>`;
}
const ms0=()=>months()[months().length-1];

/* ---------- BILLS DETECTION + FORECAST ---------- */
let billsCache=null;
const baseCat=t=>S.rules[merchant(t.t)]||autoCat(t)||FRIENDLY[t.c]||t.c;
function billsDetect(){
  if(billsCache)return billsCache;
  const by={};allTx().filter(t=>t.a<0).forEach(t=>{const k=merchant(t.t);(by[k]=by[k]||[]).push(t)});
  const out=[];
  Object.entries(by).forEach(([k,l])=>{
    if(new Set(l.map(t=>t.d.slice(0,7))).size<2)return;
    const amts=l.map(t=>-t.a).sort((a,b)=>a-b),med=amts[Math.floor(amts.length/2)];if(med<5)return;
    const sim=l.filter(t=>Math.abs(-t.a-med)<=Math.max(.5,med*.03)).sort((a,b)=>a.d.localeCompare(b.d));
    if(sim.length<2)return;
    const gaps=[];for(let i=1;i<sim.length;i++){const g=(new Date(sim[i].d)-new Date(sim[i-1].d))/864e5;const dd=Math.abs(new Date(sim[i].d).getDate()-new Date(sim[i-1].d).getDate());const exact=Math.abs(-sim[i].a+sim[i-1].a)<0.01;if(g>=24&&g<=38&&(exact||dd<=4||dd>=26))gaps.push(g)}
    if(!gaps.length)return;
    const last=sim[sim.length-1];if(med<40&&['Restaurants','Groceries & Snacks','Gas','Shopping & Household'].includes(baseCat(last)))return;const ld=new Date(last.d),day=new Date(last.d).getDate(),avg=Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);
    const nx=new Date(ld.getTime()+avg*864e5);
    out.push({k,med,n:sim.length,last:last.d,next:iso(nx),cat:baseCat(last)==='Transfers'?'Bills & Payments':baseCat(last),months:new Set(sim.map(t=>t.d.slice(0,7))).size,day});
  });
  out.forEach(b=>b.keys=[b.k]);
  window.RECURRING.forEach(R=>{
    const l=allTx().filter(t=>t.a<0&&!t.p&&R.re.test(t.t.toUpperCase())).sort((a,b)=>a.d.localeCompare(b.d));if(!l.length)return;
    const med=R.amount||sum(l.map(t=>-t.a))/l.length,last=l[l.length-1],ld=new Date(last.d),ev=R.every||1,nx=new Date(ld.getFullYear(),ld.getMonth()+ev,ld.getDate());
    const ks=[...new Set(l.map(t=>merchant(t.t)))];for(let i=out.length-1;i>=0;i--)if(ks.includes(out[i].k))out.splice(i,1);
    out.push({k:R.label,keys:ks,med,n:l.length,last:last.d,next:iso(nx),cat:R.cat,months:new Set(l.map(t=>t.d.slice(0,7))).size,day:ld.getDate(),forced:1,every:ev,mo:med/ev});
  });
  billsCache=out.sort((a,b)=>b.med-a.med);return billsCache;
}
const billKeys=()=>new Set(billsDetect().flatMap(b=>b.keys));
function coverage(){
  const d=window.BANK_TX.concat(S.extraTx).filter(t=>!t.p).map(t=>t.d).sort(),a=d[0],b=d[d.length-1];
  return {from:a,to:b,days:Math.round((new Date(b)-new Date(a))/864e5)+1,n:allTx().length};
}
function forecast(nMonths=3){
  const cov=coverage(),bk=billKeys(),bills=billsDetect();
  const variable=allTx().filter(t=>isSpend(t)&&!bk.has(merchant(t.t))&&-t.a<=300);
  const win=Math.min(cov.days,90),cut=new Date(cov.to);cut.setDate(cut.getDate()-win);
  const vt=variable.filter(t=>new Date(t.d)>cut),perDay={};
  vt.forEach(t=>{const c=cat(t);perDay[c]=(perDay[c]||0)-t.a/win});
  const incDay=sum(allTx().filter(t=>isIncome(t)&&t.c==='Paychecks'&&new Date(t.d)>cut).map(t=>t.a))/win;
  const billsMo=sum(bills.map(b=>b.mo||b.med));
  const out=[],now=new Date();
  for(let i=1;i<=nMonths;i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1),dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    const parts=Object.entries(perDay).sort((a,b)=>b[1]-a[1]).map(([c,v])=>({label:c,v:v*dim,color:C.color(c)}));
    const top=parts.slice(0,4),rest=sum(parts.slice(4).map(p=>p.v));
    const cols=[{label:'Bills & payments',v:billsMo,color:'#475569'},...top];if(rest>0)cols.push({label:'Everything else',v:rest,color:'#94a3b8'});
    const spend=sum(cols.map(c=>c.v));
    out.push({m:iso(d).slice(0,7),parts:cols,spend,income:incDay*dim,left:incDay*dim-spend});
  }
  return {months:out,billsMo,win,perDay,incDay};
}
function paceThisMonth(){
  const m=iso(new Date()).slice(0,7),s=monthStats(m),now=new Date(),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),left=dim-now.getDate();
  const f=forecast(1),bk=billKeys();
  const varSoFar=-sum(s.tx.filter(t=>isSpend(t)&&!bk.has(merchant(t.t))).map(t=>t.a));
  const billsPaid=new Set(s.tx.filter(isSpend).map(t=>merchant(t.t)));
  const billsToCome=sum(billsDetect().filter(b=>!b.keys.some(k=>billsPaid.has(k))&&new Date(b.next)>=new Date(iso(now))&&b.next.startsWith(m)).map(b=>b.med));
  const varDay=sum(Object.values(f.perDay));
  return {m,spent:s.spent,proj:s.spent+varDay*left+billsToCome,billsToCome,left,income:s.inc};
}

/* ---------- FORECAST TAB ---------- */
function forecastCards(){
  const cov=coverage(),bills=billsDetect(),f=forecast(3),pace=paceThisMonth(),today=iso(new Date());
  const upcoming=bills.map(b=>{let n=b.next;const dt=new Date(n);while(n<today){dt.setMonth(dt.getMonth()+(b.every||1));n=iso(dt)}return {...b,due:n,inDays:Math.round((new Date(n)-new Date(today))/864e5)}}).sort((a,b)=>a.due.localeCompare(b.due));
  const next30=upcoming.filter(b=>b.inDays<=30);
  const hasUtil=bills.some(b=>/ELECTR|POWER|EDISON|WATER|GAS CO|MORTG|RENT|UTIL/i.test(b.k));
  const maxP=Math.max(1,pace.proj,pace.income);
  return `<div class="grid g2">
   <div class="card"><h2>${I("calendar")} Coming due <span class="mute">next 30 days</span></h2>${next30.length?next30.map(b=>`<div class="hb"><span class="chip" style="background:${b.inDays<=3?'#f43f5e':b.inDays<=10?'#f59e0b':'#6366f1'};min-width:62px;text-align:center">${b.inDays===0?'today':b.inDays===1?'tomorrow':b.inDays+' days'}</span><span style="flex:1"><b>${esc(b.k)}</b><br><span class="mute">${b.due.slice(5)} · ${esc(b.cat)}</span></span><b>${money2(b.med)}</b></div>`).join(''):'<p class="mute">Nothing detected yet.</p>'}</div>
   <div class="card"><h2>${I("receipt")} Regular bills <span class="mute">≈ ${money(f.billsMo)}/mo</span></h2><table>${bills.map(b=>`<tr><td><b>${esc(b.k)}</b><div class="mute">${b.every>1?"about every "+b.every+" months":"~day "+b.day+" of the month"}</div></td><td>${recatKey(b.k,b.cat)}</td><td class="num"><b>${money2(b.med)}</b></td></tr>`).join('')||'<tr><td class="mute">None found yet.</td></tr>'}</table>
    ${hasUtil?'':'<div class="callout mute" style="margin-top:10px">I don\'t see a house payment, electric or water bill by name yet. The $1,122.08 "Online Payment" each month looks like it could be your house payment — set it to Housing in the menu above. Electric may be paid from another account or by check.</div>'}</div>
   <div class="card"><h2>Projected spending <span class="mute">next 3 months</span></h2>${C.stacked(f.months.map(m=>({label:monthName(m.m).slice(0,3),parts:m.parts})))}${C.legend(f.months[0].parts)}</div>
   <div class="card"><h2>What to expect</h2><table><tr><th>Month</th><th class="num">Spending</th><th class="num">Income</th><th class="num">Left</th></tr>${f.months.map(m=>`<tr><td><b>${monthName(m.m)}</b></td><td class="num">${money(m.spend)}</td><td class="num">${money(m.income)}</td><td class="num ${m.left<0?'up':'dn'}"><b>${money(m.left)}</b></td></tr>`).join('')}</table>
    <p class="mute" style="margin-top:10px">Built from your regular bills plus your everyday spending rate over the last ${f.win} days. Big one-time purchases over $300 (like a Lowe's run) are left out. Paychecks assumed to continue at the recent pace. It's an estimate — more history makes it sharper.</p></div>
   <div class="card"><h2>This month's pace</h2><div class="hb"><span class="hb-l">Spent so far</span><div class="hb-t"><div class="hb-f" style="width:${pace.spent/maxP*100}%;background:#f43f5e"></div></div><b>${money(pace.spent)}</b></div>
    <div class="hb"><span class="hb-l">Projected finish</span><div class="hb-t"><div class="hb-f" style="width:${pace.proj/maxP*100}%;background:#f59e0b"></div></div><b>${money(pace.proj)}</b></div>
    <div class="hb"><span class="hb-l">Income so far</span><div class="hb-t"><div class="hb-f" style="width:${pace.income/maxP*100}%;background:#10b981"></div></div><b>${money(pace.income)}</b></div>
    <p class="mute">${pace.left} days left · ${money(pace.billsToCome)} of regular bills still to come.</p></div>
   <div class="card"><h2>${I("search")} How far back does my data go?</h2><p class="story">Your bank export covers <b>${cov.from}</b> to <b>${cov.to}</b> — about <b>${Math.round(cov.days/30.4*10)/10} months</b> and <b>${cov.n}</b> transactions. Your Instacart groceries go back to <b>January 2022</b>.</p>
    <p class="mute">To go further back, download older activity from PNC online banking (pick an earlier date range and export CSV), then use <b>Import PNC CSV</b> under Every transaction on the Money tab. You can import as many files as you like — duplicates are skipped automatically, and every chart and forecast here gets smarter with each year added.</p></div></div>`;
}

function importCsv(text){
  const have=new Set(allTx().map(t=>t.d+t.t+t.a));let n=0;
  text.split(/\r?\n/).slice(1).filter(Boolean).forEach(r=>{
    const f=[...r.matchAll(/"((?:[^"]|"")*)"|([^,]+)/g)].map(m=>m[1]??m[2]);if(f.length<3)return;
    const dm=f[0].match(/(\d+)\/(\d+)\/(\d{4})/);const d=dm?`${dm[3]}-${dm[1].padStart(2,'0')}-${dm[2].padStart(2,'0')}`:f[0].slice(0,10);
    const a=parseFloat(f[2].replace(/[\s$,]/g,''));if(isNaN(a))return;
    const t=f[1].replace(/\s+/g,' ').replace(/\s*(CARD|DEBIT CARD|POS PURCHASE|RECURRING D).*$/,'').slice(0,42);
    if(have.has(d+t+a))return;S.extraTx.push({d,t,a,c:f[3]&&f[3]!=='PENDING'?f[3]:'Uncategorized',p:/PENDING/.test(f[0])?1:0});n++;
  });billsCache=null;save();alert(n+' new transactions imported.');render();
}

/* ---------- GROCERIES ---------- */
function runCard(){
  const ms=months().slice(0,6),g=(m,c)=>-sum(txOf(m).filter(t=>cat(t)===c).map(t=>t.a));
  const rows=ms.map(m=>({m,run:g(m,'Monthly Grocery Run'),top:g(m,'Groceries & Snacks'),hh:g(m,'Household Supplies')}));
  const runs=rows.filter(r=>r.run>0),avg=runs.length?sum(runs.map(r=>r.run))/runs.length:0,[m1,m2]=FP.meatBudget,mid=(m1+m2)/2;
  const tops=rows.filter(r=>r.top>0);
  return `<div class="card"><h2>${I("basket")} Monthly grocery run vs. top-ups</h2>
  <p class="story">The big monthly run (<b>Aldi + Jubilee</b>) averages <b>${money(avg)}</b>. Meat is about <b>${money(m1)}–${money(m2)}</b> of that (depends on the month's meals), so everything else — pantry, frozen, produce, dairy — is roughly <b>${money(Math.max(0,avg-mid))}</b>. Small top-up trips (Food Lion, Dollar General, Weis) and Walmart household supplies (diapers, wipes, cleaners, laundry, shampoo) are tracked separately.</p>
  <table><tr><th>Month</th><th class="num">Monthly run</th><th class="num">Top-ups &amp; snacks</th><th class="num">Walmart household</th></tr>${rows.map(r=>`<tr><td>${monthName(r.m)}</td><td class="num"><b>${money(r.run)}</b></td><td class="num">${money(r.top)}</td><td class="num">${money(r.hh)}</td></tr>`).join('')}</table>
  <p class="mute" style="margin-top:8px">Aldi/Jubilee purchases under $40 count as top-ups. Top-ups average ${money(tops.length?sum(tops.map(r=>r.top))/tops.length:0)} a month.</p></div>`;
}
function groceries(){
  const m=month,tx=txOf(m);
  const groc=-sum(tx.filter(t=>cat(t)==='Groceries & Snacks').map(t=>t.a)),din=-sum(tx.filter(t=>cat(t)==='Restaurants').map(t=>t.a));
  const gm=months().slice(0,6).reverse();
  const top=window.STAPLES.slice().sort((a,b)=>b[3]-a[3]).slice(0,12).map(s=>({label:s[0],v:s[3],color:C.color('g'+s[1])}));
  const cc={};window.STAPLES.forEach(s=>cc[s[1]]=(cc[s[1]]||0)+s[2]*s[3]);
  const cd=Object.entries(cc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k,v,color:C.color('g'+k)}));
  const cats=[...new Set(window.STAPLES.map(s=>s[1]))].sort();
  const items=window.STAPLES.filter(s=>(!gcat||s[1]===gcat)&&(!gq||s[0].toLowerCase().includes(gq.toLowerCase()))).sort((a,b)=>b[3]-a[3]);
  const open=S.shopping.filter(i=>!i.done),est=sum(open.map(i=>(i.price||0)*(i.qty||1)));
  const stores=[...new Set(S.shopping.map(i=>i.store||'Any store'))].sort();
  return `<div class="grid g3">
   <div class="kpi k1"><small>Groceries this month</small><div class="v">${money(groc)}</div></div>
   <div class="kpi k2"><small>Eating out this month</small><div class="v">${money(din)}</div></div>
   <div class="kpi k3"><small>On your list now</small><div class="v">${open.length}</div><div class="d">about ${money(est)}</div></div></div>
  ${runCard()}
  <div class="grid g2" style="margin-top:18px">
   <div class="card"><h2>Groceries vs. dining out <span class="mute">by month</span></h2>${C.bars(gm.map(x=>({label:x.slice(5),v:-sum(txOf(x).filter(t=>cat(t)==='Groceries & Snacks').map(t=>t.a)),v2:-sum(txOf(x).filter(t=>cat(t)==='Restaurants').map(t=>t.a)),color:'#10b981',color2:'#f59e0b'})))}<p class="mute">green = groceries · orange = dining out</p></div>
   <div class="card"><h2>What you reorder most <span class="mute">Instacart orders</span></h2>${C.hbars(top,{fmt:v=>v+'×'})}</div>
   <div class="card"><h2>Instacart spend by aisle</h2><div class="split">${C.donut(cd,{center:money(sum(cd.map(d=>d.v))),sub:'staples'})}${C.legend(cd)}</div></div>
   <div class="card"><h2>${I("cart")} Shopping list <span class="mute">≈ ${money2(est)}</span></h2>
    <div class="row"><input id="sn" placeholder="Add item" style="flex:2;min-width:120px"><input id="sq" type="number" min="1" value="1" style="width:64px"><input id="ss" placeholder="Store" list="stl" style="width:110px"><datalist id="stl">${['Food Lion','ALDI','Walmart','Giant Eagle','Wegmans','Costco','Dollar Tree','Weis'].map(s=>`<option>${s}</option>`).join('')}</datalist><button class="btn" id="sadd">Add</button></div>
    ${stores.map(st=>`<h3 style="margin:10px 0 4px;font-size:13px;color:var(--accent)">${esc(st)}</h3>`+S.shopping.filter(i=>(i.store||'Any store')===st).map(i=>`<div class="row" style="margin:2px 0"><input type="checkbox" class="sd" data-id="${i.id}" ${i.done?'checked':''}><span class="${i.done?'done':''}" style="flex:1">${esc(i.name)}${i.qty>1?' × '+i.qty:''}</span><span class="mute">${i.price?money2(i.price*i.qty):''}</span><button class="x" data-act="sdel" data-id="${i.id}">×</button></div>`).join('')).join('')||'<p class="mute">List is empty — add something below or tap a usual item.</p>'}
    <div class="row" style="margin-top:10px"><button class="btn alt" id="sclear">Clear checked</button></div></div></div>
  <div class="card"><h2>Usual items <span class="mute">tap + to add</span></h2><div class="row"><input id="gq" placeholder="Search…" value="${esc(gq)}"><select id="gc"><option value="">All aisles</option>${cats.map(c=>`<option ${c===gcat?'selected':''}>${c}</option>`).join('')}</select></div>
   <div style="max-height:420px;overflow:auto"><table>${items.map(s=>`<tr><td>${esc(s[0])} <span class="chip" style="background:${C.color('g'+s[1])}">${s[1]}</span></td><td class="mute">${s[3]} orders</td><td class="num">${money2(s[2])}</td><td><button class="btn alt" data-add="${esc(s[0])}" data-p="${s[2]}">+</button></td></tr>`).join('')}</table></div></div>`;
}

/* ---------- MEALS ---------- */
const FP=window.FAMILY_PLAN;
function defMeal(k,t){const d=new Date(k+'T12:00'),w=d.getDay();if(t==='breakfast')return FP.breakfast;if(t==='lunch')return FP.lunch;
  if(w===6){const ids=FP.saturdayIdeas[k.slice(0,7)];if(ids)return 'Nice dinner — '+ids.join(' / ')}return FP.dinner[w]||''}
function effMeal(k,t){const m=S.meals[k]||{};return m[t]!==undefined?m[t]:defMeal(k,t)}
function foodNeeds(){
  const tot=FP.eaters.reduce((a,e)=>a+e[2],0),kids=FP.eaters.filter(e=>e[1]!==null);
  return `<div class="card"><h2>${I("utensils")} How much food per day <span class="mute">rough guide</span></h2>
  <p class="story">At the table: <b>2 adults + ${kids.length} kids</b>. Counting each person as a share of an adult portion, every meal needs about <b>${tot.toFixed(1)} adult portions</b> (Judah is still nursing, so he adds almost nothing yet).</p>
  <table>${FP.eaters.map(e=>`<tr><td><b>${e[0]}</b> <span class="mute">${e[1]===null?'adult':'age '+e[1]}</span></td><td class="num">${e[2]} portion</td></tr>`).join('')}<tr><td><b>Whole family</b></td><td class="num"><b>≈ ${tot.toFixed(1)}</b></td></tr></table>
  <div class="callout mute" style="margin-top:10px"><b>Weekly rhythm:</b> Sunday dinner is at your parents' (no home dinner, bring a dish). Dinners at home: 6 a week — Mon frozen (meatballs or Philly cheesesteaks) · Tue sausage &amp; peppers with rice · Wed frozen chicken strips &amp; mac and cheese · Thu soup · Fri pizza · Sat a nice homemade dinner. Breakfast: bagels, cereal, oatmeal, yogurt daily. Lunch: kids sandwiches, bagels or mac &amp; cheese; you two eat leftovers. Snacks: co-op days (Mon &amp; Wed) — one cracker-type pack per kid eating solids (5 kids = 5 packs a day, 10 a week).</div></div>`;
}
function meals(){
  const days=[...Array(7)].map((_,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);return d}),wk=iso(weekStart),tk=iso(new Date());
  const col={breakfast:'#f59e0b',lunch:'#10b981',dinner:'#8b5cf6'};
  const planned=sum(days.map(d=>['breakfast','lunch','dinner'].filter(t=>effMeal(iso(d),t)).length));
  return `<div class="card"><div class="row"><button class="btn alt" id="wp">←</button><b>Week of ${wk}</b><button class="btn alt" id="wn">→</button><button class="btn alt" id="wt">This week</button><span class="mute">${planned}/21 meals planned</span></div>
  <div class="week">${days.map(d=>{const k=iso(d);return `<div class="day ${k===tk?'today':''}"><b>${d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</b>${['breakfast','lunch','dinner'].map(t=>`<input class="meal" style="--c:${col[t]}" data-d="${k}" data-t="${t}" placeholder="${t}" value="${esc(effMeal(k,t))}">`).join('')}</div>`}).join('')}</div></div>
  ${foodNeeds()}
  <div class="card"><h2>Ingredients for this week</h2><p class="mute">One item per line — they go straight onto the shopping list.</p><textarea id="ing" rows="5">${esc(S.meals['ing-'+wk]||'')}</textarea><div class="row" style="margin-top:10px"><button class="btn" id="ingadd">Add lines to shopping list</button></div></div>`;
}

/* ---------- JOURNAL ---------- */
function journal(){
  const entries=USERS.flatMap(u=>S.users[u.email].journal.filter(e=>u.email===S.session||e.shared).map(e=>({...e,by:u}))).sort((a,b)=>(b.date+b.id).localeCompare(a.date+a.id));
  const my=mine().journal.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const byDay={};my.forEach(e=>{(byDay[e.date]=byDay[e.date]||[]).push(e.mood)});
  const dk=Object.keys(byDay).slice(-30),vals=dk.map(d=>sum(byDay[d])/byDay[d].length);
  const avg=my.length?(sum(my.map(e=>e.mood))/my.length):0;
  let streak=0;const set=new Set(my.map(e=>e.date));for(let d=new Date();set.has(iso(d))||(streak===0&&(d.setDate(d.getDate()-1),set.has(iso(d))));d.setDate(d.getDate()-1))streak++;
  return `<div class="grid g3" style="margin-bottom:18px"><div class="kpi k3"><small>Your entries</small><div class="v">${my.length}</div></div><div class="kpi k4"><small>Writing streak</small><div class="v">${streak} day${streak===1?'':'s'}</div></div><div class="kpi k1"><small>Average mood</small><div class="v">${avg?MOODS[Math.round(avg)-1]+' '+avg.toFixed(1):'—'}</div></div></div>
  <div class="grid g2"><div class="card"><h2>New entry <span class="mute">${me().name}</span></h2>
   <div class="row"><input type="date" id="jd" value="${iso(new Date())}"><div class="moods">${MOODS.map((e,i)=>`<button data-mood="${i+1}" class="${draft.mood===i+1?'sel':''}">${e}</button>`).join('')}</div></div>
   <textarea id="jt" rows="6" placeholder="What happened today? What are you grateful for?">${esc(draft.text)}</textarea>
   <div class="row" style="margin-top:10px"><input id="jg" placeholder="tags, comma separated" value="${esc(draft.tags)}" style="flex:1"><label class="mute"><input type="checkbox" id="js" ${draft.shared?'checked':''}> share with ${USERS.find(u=>u.email!==S.session).name}</label><button class="btn" id="jsave">Save entry</button></div></div>
   <div class="card"><h2>Your mood over time</h2>${vals.length>1?C.area(vals,dk.map(d=>d.slice(5)),{c:me().c,id:'j1',fmt:v=>v.toFixed(1)}):'<p class="mute">Add a couple of entries to see your mood trend.</p>'}</div></div>
  <div class="card"><h2>Entries</h2>${entries.map(e=>`<div class="entry" style="--c:${e.by.c}"><div class="meta"><span class="mo">${MOODS[e.mood-1]}</span><b style="color:${e.by.c}">${e.by.name}</b><span>${e.date}</span>${e.shared?'<span class="tag">shared</span>':'<span class="tag">private</span>'}${(e.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')}${e.by.email===S.session?`<button class="x" data-act="jdel" data-id="${e.id}" style="margin-left:auto">×</button>`:''}</div><p>${esc(e.text)}</p></div>`).join('')||'<p class="mute">No entries yet.</p>'}</div>`;
}

/* ---------- HABITS & TODO ---------- */
function habits(){
  const u=mine(),days=[...Array(14)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return d});
  const streakOf=h=>{let n=0;const d=new Date();if(!(u.log[h.id]||{})[iso(d)])d.setDate(d.getDate()-1);while((u.log[h.id]||{})[iso(d)]){n++;d.setDate(d.getDate()-1)}return n};
  const total=u.habits.length*14,done=sum(u.habits.map(h=>days.filter(d=>(u.log[h.id]||{})[iso(d)]).length));
  return `<div class="grid g2"><div class="card"><h2>${me().name}'s habits <span class="mute">last 14 days</span></h2>
   <div class="row"><input id="hn" placeholder="New habit (e.g. read, walk, prayer)" style="flex:1"><button class="btn" id="hadd">Add</button></div>
   ${u.habits.map(h=>`<div class="habit"><span class="nm">${esc(h.name)}</span><div class="hd">${days.map(d=>`<button class="${(u.log[h.id]||{})[iso(d)]?'on':''}" data-h="${h.id}" data-d="${iso(d)}" title="${iso(d)}">${d.getDate()}</button>`).join('')}</div><span class="streak">${I("flame",14)} ${streakOf(h)}</span><button class="x" data-act="hdel" data-id="${h.id}">×</button></div>`).join('')||'<p class="mute">Add a habit to start tracking.</p>'}</div>
   <div class="card"><h2>Consistency</h2>${total?`<div class="split">${C.ring(done/total,{size:130,c:me().c})}<p class="mute">${done} of ${total} possible check-ins in the last two weeks.</p></div>`:'<p class="mute">Nothing to show yet.</p>'}</div></div>
  <div class="card"><h2>Family to-dos</h2><div class="row"><input id="tn" placeholder="New to-do" style="flex:2;min-width:140px"><select id="to">${USERS.map(u=>`<option>${u.name}</option>`).join('')}<option>Both</option></select><button class="btn" id="tadd">Add</button></div>
   ${S.tasks.map(t=>`<div class="row" style="margin:2px 0"><input type="checkbox" class="td" data-id="${t.id}" ${t.done?'checked':''}><span class="${t.done?'done':''}" style="flex:1">${esc(t.text)}</span><span class="chip" style="background:${(USERS.find(u=>u.name===t.owner)||{c:'#94a3b8'}).c}">${esc(t.owner)}</span><button class="x" data-act="tdel" data-id="${t.id}">×</button></div>`).join('')||'<p class="mute">Nothing yet.</p>'}</div>`;
}

/* ---------- CALENDAR ---------- */
const EV_KIND={School:'#6366f1',Family:'#ec4899',Church:'#8b5cf6',Appointment:'#f59e0b',Bill:'#475569',Other:'#10b981'};
function eventsOn(k){
  const d=new Date(k+'T12:00'),out=[];
  if(FP.schoolDays.includes(d.getDay()))out.push({t:'School / co-op day',c:EV_KIND.School});
  if(d.getDay()===0)out.push({t:'Dinner at Andrew\'s parents',c:EV_KIND.Family});
  S.events.forEach(e=>{const s0=new Date(e.date+'T12:00');
    const hit=e.repeat==='weekly'?(d>=s0&&d.getDay()===s0.getDay()):e.repeat==='monthly'?(d>=s0&&d.getDate()===s0.getDate()):e.date===k;
    if(hit)out.push({t:e.title,c:EV_KIND[e.kind]||EV_KIND.Other,id:e.id,kind:e.kind,repeat:e.repeat})});
  const dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  billsDetect().forEach(b=>{const bd=Math.min(new Date(b.next+'T12:00').getDate(),dim);const nd=new Date(b.next+'T12:00'),md=(d.getFullYear()-nd.getFullYear())*12+d.getMonth()-nd.getMonth();if(bd===d.getDate()&&k>=b.last&&md%(b.every||1)===0)out.push({t:b.k+' '+money(b.med),c:EV_KIND.Bill})});
  return out;
}
function calendar(){
  return `<iframe class="calframe" id="calframe" scrolling="no" src="https://andrewjlegare.github.io/family-calendar/" title="Family Calendar" style="height:${window.__calH||1100}px"></iframe>`;
}
window.addEventListener('message',e=>{if(e.origin==='https://andrewjlegare.github.io'&&e.data&&e.data.fcHeight){window.__calH=e.data.fcHeight;const f=document.getElementById('calframe');if(f)f.style.height=e.data.fcHeight+'px'}});
function calendarOld(){
  const [y,mo]=calMonth.split('-').map(Number),first=new Date(y,mo-1,1),dim=new Date(y,mo,0).getDate(),lead=(first.getDay()+6)%7,tk=iso(new Date());
  const cells=[...Array(lead).fill(null),...Array.from({length:dim},(_,i)=>iso(new Date(y,mo-1,i+1)))];while(cells.length%7)cells.push(null);
  const sel=eventsOn(calSel);
  return `<div class="hero"><div><h1>Family Calendar</h1><p>School days, family dinners, appointments and bills due — all in one place.</p></div></div>
  <div class="card"><div class="row"><button class="btn alt" id="cprev">←</button><b style="min-width:150px;text-align:center">${monthName(calMonth)}</b><button class="btn alt" id="cnext">→</button><button class="btn alt" id="ctoday">Today</button>
   <span class="mute">${Object.entries(EV_KIND).map(([k,c])=>`<i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${c};margin:0 4px 0 10px"></i>${k}`).join('')}</span></div>
  <div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="calh">${d}</div>`).join('')}
  ${cells.map(k=>{if(!k)return '<div class="calx"></div>';const ev=eventsOn(k),dn=effMeal(k,'dinner');
   return `<button class="calcell ${k===tk?'today':''} ${k===calSel?'sel':''}" data-cday="${k}"><b>${+k.slice(8)}</b>${ev.slice(0,3).map(e=>`<span class="calev" style="background:${e.c}">${esc(e.t)}</span>`).join('')}${ev.length>3?`<span class="mute">+${ev.length-3} more</span>`:''}<small class="mute">${esc(dn.split(' (')[0].slice(0,26))}</small></button>`}).join('')}</div></div>
  <div class="grid g2"><div class="card"><h2>${new Date(calSel+'T12:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h2>
   ${sel.map(e=>`<div class="hb"><span class="chip" style="background:${e.c}">${e.kind||'●'}</span><span style="flex:1">${esc(e.t)}${e.repeat&&e.repeat!=='none'?` <span class="mute">· repeats ${e.repeat}</span>`:''}</span>${e.id?`<button class="btn alt" data-act="cdel" data-id="${e.id}">${I("x",14)}</button>`:''}</div>`).join('')||'<p class="mute">Nothing on this day.</p>'}
   <p class="mute" style="margin-top:10px">Dinner plan: <b>${esc(effMeal(calSel,'dinner'))}</b></p></div>
  <div class="card"><h2>Add to the calendar</h2><div class="row"><input id="cd" type="date" value="${calSel}"><input id="cti" placeholder="What's happening?" style="flex:2;min-width:150px"></div>
   <div class="row"><select id="ck">${Object.keys(EV_KIND).filter(k=>k!=='Bill').map(k=>`<option>${k}</option>`).join('')}</select><select id="cr"><option value="none">Just once</option><option value="weekly">Every week</option><option value="monthly">Every month</option></select><button class="btn" id="cadd">Add</button></div></div></div>`;
}

/* ---------- shell ---------- */
const TABS=[['home','Home','home'],['money','Money','wallet'],['groceries','Groceries','cart'],['meals','Meal Plan','utensils'],['calendar','Calendar','calendar'],['journal','Journal','pen'],['habits','Habits & To-Do','check']];
const views={home,money:money_,groceries,meals,calendar,journal,habits};
function render(){
  billsCache=null;
  document.documentElement.dataset.theme='dark';
  const u=me();
  $('#login').hidden=!!u;$('#hdr').hidden=!u;
  if(!u){renderLogin();$('#main').innerHTML='';return}
  $('#nav').innerHTML=TABS.map(([k,l,ic])=>`<button data-tab="${k}" class="${k===tab?'active':''}">${Icons.svg(ic,17,1.9)}<span>${l}</span></button>`).join('');
  $('#hr').innerHTML=`<div class="avatar" id="av" style="background:${u.grad}" title="${u.name}">${u.initial}</div>
   <div class="menu" id="menu" hidden><b>${u.name}</b><div class="mute">${u.email}</div><button id="switch">Switch profile</button><button id="signout">Sign out</button></div>`;
  $('#main').innerHTML=views[tab]();
  countUp();
}
function countUp(){document.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count,two=el.classList.contains('bigmoney'),t0=performance.now(),f=two?C.money2:C.money;const step=n=>{const k=Math.min(1,(n-t0)/700),e=1-Math.pow(1-k,3);el.textContent=f(to*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)})}
function renderLogin(){
  $('#login').innerHTML=`<div class="login-box"><div class="login-logo">${Icons.svg("home",30,1.8)}</div><h1>Family Tracker</h1><p class="mute">Who's signing in?</p>
   <div class="profiles">${USERS.map(u=>`<button class="profile" data-email="${u.email}"><div class="avatar" style="background:${u.grad}">${u.initial}</div><b>${u.name}</b><small>${u.email}</small></button>`).join('')}</div>
   <div class="row" style="justify-content:center"><input id="lemail" type="email" placeholder="or type your email" style="width:240px"><button class="btn" id="lgo">Sign in</button></div><div class="err" id="lerr"></div></div>`;
}
function signIn(email){
  const u=USERS.find(x=>x.email===String(email).trim().toLowerCase());
  if(!u){const e=$('#lerr');if(e)e.textContent='That email isn\'t set up for this app.';return}
  S.session=u.email;save();tab='home';render();
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const pr=e.target.closest('[data-email]');if(pr)return signIn(pr.dataset.email);
  const t=e.target.closest('button,.avatar,label')||e.target;
  const id=t.id,ds=t.dataset||{};
  if(id==='lgo')return signIn($('#lemail').value);
  if(id==='av'){const m=$('#menu');m.hidden=!m.hidden;return}
  if(id==='signout'||id==='switch'){S.session=null;save();return render()}
  if(id==='theme'){S.theme=S.theme==='dark'?'light':'dark';save();return render()}
  if(ds.mview){mview=ds.mview;return render()}
  if(ds.mp){const d=+ds.mp;if(mview==='week'){mwk=new Date(mwk);mwk.setDate(mwk.getDate()+7*d)}else if(mview==='year'){myear=String(+myear+d)}else{const ms=months(),i=ms.indexOf(month)-d;if(ms[i])month=ms[i]}return render()}
  if(ds.mo){const ms=months(),i=ms.indexOf(month)-(+ds.mo);if(ms[i]){month=ms[i];render()}return}
  if(t.closest('[data-cat]')&&t.closest('[data-cat]').dataset.cat!==undefined){const c=t.closest('[data-cat]').dataset.cat;selCat=(selCat===c?'':c);render();return}
  if(ds.gotab){tab=ds.gotab;openSet.add('g:'+ds.open);render();return window.scrollTo(0,0)}
  if(ds.tab){tab=ds.tab;render();return window.scrollTo(0,0)}
  if(ds.go){tab=ds.go;return render()}
  if(!S.session)return;
  if(id==='sadd'){const n=$('#sn').value.trim();if(n){const st=window.STAPLES.find(s=>s[0].toLowerCase()===n.toLowerCase());addItem(n,+$('#sq').value,$('#ss').value.trim(),st?st[2]:0);render()}}
  else if(ds.add){addItem(ds.add,1,'Food Lion',+ds.p);render()}
  else if(ds.act==='sdel'){S.shopping=S.shopping.filter(i=>i.id!==ds.id);save();render()}
  else if(ds.act==='tdel'){S.tasks=S.tasks.filter(i=>i.id!==ds.id);save();render()}
  else if(ds.act==='jdel'){mine().journal=mine().journal.filter(i=>i.id!==ds.id);save();render()}
  else if(ds.act==='hdel'){mine().habits=mine().habits.filter(i=>i.id!==ds.id);save();render()}
  else if(ds.cday){calSel=ds.cday;calMonth=ds.cday.slice(0,7);render()}
  else if(id==='cprev'||id==='cnext'){const [y,m]=calMonth.split('-').map(Number),d=new Date(y,m-1+(id==='cnext'?1:-1),1);calMonth=iso(d).slice(0,7);render()}
  else if(id==='ctoday'){calSel=iso(new Date());calMonth=calSel.slice(0,7);render()}
  else if(id==='cadd'){const ti=$('#cti').value.trim(),dt=$('#cd').value;if(ti&&dt){S.events.push({id:uid(),date:dt,title:ti,kind:$('#ck').value,repeat:$('#cr').value});calSel=dt;calMonth=dt.slice(0,7);save();render()}}
  else if(ds.act==='cdel'){S.events=S.events.filter(i=>i.id!==ds.id);save();render()}
  else if(id==='sclear'){S.shopping=S.shopping.filter(i=>!i.done);save();render()}
  else if(id==='tadd'){const v=$('#tn').value.trim();if(v){S.tasks.push({id:uid(),text:v,owner:$('#to').value,done:false});save();render()}}
  else if(id==='hadd'){const v=$('#hn').value.trim();if(v){mine().habits.push({id:uid(),name:v});save();render()}}
  else if(ds.h){const l=mine().log[ds.h]=mine().log[ds.h]||{};l[ds.d]=!l[ds.d];save();render()}
  else if(ds.mood){draft.mood=+ds.mood;render()}
  else if(id==='jsave'){const tx=$('#jt').value.trim();if(!tx)return;mine().journal.push({id:uid(),date:$('#jd').value||iso(new Date()),mood:draft.mood,text:tx,tags:$('#jg').value.split(',').map(s=>s.trim()).filter(Boolean),shared:$('#js').checked});draft={mood:3,text:'',tags:'',shared:false};save();render()}
  else if(id==='wp'){weekStart.setDate(weekStart.getDate()-7);render()}
  else if(id==='wn'){weekStart.setDate(weekStart.getDate()+7);render()}
  else if(id==='wt'){weekStart=mondayOf(new Date());render()}
  else if(id==='ingadd'){$('#ing').value.split('\n').map(s=>s.trim()).filter(Boolean).forEach(n=>addItem(n,1,'',0));S.meals['ing-'+iso(weekStart)]='';save();render()}
  if(!e.target.closest('.hr')){const m=$('#menu');if(m)m.hidden=true}
});
function addItem(name,qty,store,price){S.shopping.push({id:uid(),name,qty:qty||1,store:store||'',price:price||0,done:false});save()}
document.addEventListener('toggle',e=>{const d=e.target;if(d.tagName==='DETAILS'&&d.dataset.k){d.open?openSet.add(d.dataset.k):openSet.delete(d.dataset.k)}},true);
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='bm'){month=t.value;render()}
  else if(t.classList.contains('recat')){S.rules[t.dataset.m]=t.value;save();render()}
  else if(t.id==='tc'){txf.cat=t.value;render()}
  else if(t.id==='gc'){gcat=t.value;render()}
  else if(t.id==='imp'&&t.files[0]){const r=new FileReader();r.onload=()=>importCsv(r.result);r.readAsText(t.files[0])}
  else if(t.classList.contains('lim')){S.budgets[t.dataset.c]=parseFloat(t.value)||0;save();render()}
  else if(t.classList.contains('sd')){S.shopping.find(x=>x.id===t.dataset.id).done=t.checked;save();render()}
  else if(t.classList.contains('td')){S.tasks.find(x=>x.id===t.dataset.id).done=t.checked;save();render()}
  else if(t.classList.contains('meal')){S.meals[t.dataset.d]=S.meals[t.dataset.d]||{};S.meals[t.dataset.d][t.dataset.t]=t.value;save()}
  else if(t.id==='ing'){S.meals['ing-'+iso(weekStart)]=t.value;save()}
  else if(t.id==='js')draft.shared=t.checked;
});
document.addEventListener('input',e=>{
  const t=e.target,keep=id=>{const p=t.selectionStart;render();const n=$('#'+id);n.focus();n.setSelectionRange(p,p)};
  if(t.id==='tq'){txf.q=t.value;keep('tq')}
  else if(t.id==='gq'){gq=t.value;keep('gq')}
  else if(t.id==='jt')draft.text=t.value;
  else if(t.id==='jg')draft.tags=t.value;
});
document.addEventListener('keydown',e=>{const k=e.key==='Enter';
  if(k&&e.target.id==='sn')$('#sadd').click();if(k&&e.target.id==='tn')$('#tadd').click();if(k&&e.target.id==='hn')$('#hadd').click();if(k&&e.target.id==='lemail')$('#lgo').click()});
render();
})();
