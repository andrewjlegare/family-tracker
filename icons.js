// Hand-drawn line icons (24px grid) + colored "app icon" tiles. No emoji, no libraries.
(function(){
const c=(x,y,r)=>`M${x-r} ${y}a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0`;
const P={
 home:'M3 11l9-8 9 8|M5 10v10h14V10|M10 20v-6h4v6',
 basket:'M3 10h18l-2 10H5z|M8 10l3-6|M16 10l-3-6',
 cart:'M3 4h2l2.4 11h10.2l2-8H6.2|'+c(9,20,1.4)+'|'+c(17,20,1.4),
 utensils:'M7 3v7|M4.5 3v5a2.5 2.5 0 0 0 5 0V3|M7 10v11|M17 3c-2.2 1.2-3 3.5-3 6.5h3V21',
 car:'M3 17v-4l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4z|M3 13h18|'+c(7.5,17,1.3)+'|'+c(16.5,17,1.3),
 fuel:'M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16|M3 21h12|M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V8l-3-3|M7 8h4',
 wrench:'M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
 hammer:'M14 6l4 4|M12 8l5-5 4 4-5 5|M13 9L3.5 18.5a1.4 1.4 0 0 0 2 2L15 11',
 bag:'M5 8h14l-1 12H6z|M9 8V6a3 3 0 0 1 6 0v2',
 package:'M21 8l-9-5-9 5v8l9 5 9-5z|M3 8l9 5 9-5|M12 13v8',
 heart:'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
 pulse:'M3 12h4l2-6 4 12 2-6h6',
 phone:'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z|M11 18h2',
 ticket:'M4 5h16v4a2 2 0 0 0 0 6v4H4v-4a2 2 0 0 0 0-6z|M13 5v14',
 gift:'M3 9h18v4H3z|M5 13v8h14v-8|M12 9v12|M12 9c-3 0-4-4-1.5-4.5S12 9 12 9z|M12 9c3 0 4-4 1.5-4.5S12 9 12 9z',
 users:'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1|'+c(10,7.5,3.5)+'|M20 19v-1a3.5 3.5 0 0 0-2.5-3.3|M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
 send:'M21 3L10 14|M21 3l-7 18-4-7-7-4z',
 book:'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z|M4 19V5|M8 7h7',
 cap:'M2 9l10-5 10 5-10 5z|M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5|M22 9v6',
 receipt:'M6 3h12v18l-3-2-3 2-3-2-3 2z|M9 8h6|M9 12h6',
 bank:'M3 10l9-6 9 6|M5 10v8|M9 10v8|M15 10v8|M19 10v8|M3 20h18',
 zap:'M13 2L4 14h7l-1 8 9-12h-7z',
 shield:'M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z',
 tag:'M3 12V4h8l9 9-8 8z|M8 8h.01',
 repeat:'M17 2l4 4-4 4|M3 11V9a3 3 0 0 1 3-3h15|M7 22l-4-4 4-4|M21 13v2a3 3 0 0 1-3 3H3',
 cash:'M3 7h18v10H3z|'+c(12,12,2.5)+'|M6.5 12h.01|M17.5 12h.01',
 wallet:'M3 7a2 2 0 0 1 2-2h13v4|M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z|M16 14.5h.01',
 up:'M3 17l6-6 4 4 8-8|M15 7h6v6',
 down:'M3 7l6 6 4-4 8 8|M15 17h6v-6',
 calendar:'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z|M4 10h16|M8 3v4|M16 3v4',
 chart:'M4 20V10|M10 20V4|M16 20v-8|M22 20H2',
 check:'M5 12.5l4.5 4.5L19 7.5',
 alert:'M12 4l9.5 16h-19z|M12 10v4|M12 17.5h.01',
 plus:'M12 5v14|M5 12h14',
 x:'M6 6l12 12|M18 6L6 18',
 sun:c(12,12,4)+'|M12 2v2|M12 20v2|M4.9 4.9l1.4 1.4|M17.7 17.7l1.4 1.4|M2 12h2|M20 12h2|M4.9 19.1l1.4-1.4|M17.7 6.3l1.4-1.4',
 moon:'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
 pen:'M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z|M14 7l3 3',
 list:'M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z|M7 6H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1|M9 12h6|M9 16h4',
 laptop:'M5 6h14v9H5z|M2 19h20',
 drop:'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
 coffee:'M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z|M16 10h2a2 2 0 0 1 0 4h-2|M8 3v3|M12 3v3',
 spark:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
 dots:c(6,12,1)+'|'+c(12,12,1)+'|'+c(18,12,1),
 'arrow-up':'M12 19V5|M6 11l6-6 6 6',
 'arrow-down':'M12 5v14|M6 13l6 6 6-6',
 chev:'M6 9l6 6 6-6',
 'chev-r':'M9 6l6 6-6 6',
 flame:'M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5.2 1 .8 1.5 1.5 1.5C11 7 11 5 12 3z',
 download:'M12 4v11|M7 11l5 5 5-5|M5 20h14',
 upload:'M12 16V5|M7 9l5-5 5 5|M5 20h14',
 search:c(11,11,7)+'|M21 21l-5-5',
 lock:'M6 11h12v9H6z|M8 11V8a4 4 0 0 1 8 0v3',
 logout:'M9 4H5v16h4|M16 8l4 4-4 4|M20 12H9',
 sunrise:'M5 18a7 7 0 0 1 14 0|M12 5v3|M3 18h18|M5.6 9.6l1.8 1.8|M18.4 9.6l-1.8 1.8',
 leaf:'M20 4C9 4 4 9 4 15c0 3 2 5 5 5 6 0 11-5 11-16z|M4 20c3-6 7-9 12-11',
 f1:c(12,12,9)+'|M9 9.5h.01|M15 9.5h.01|M8.5 16.5c1-1.4 2.2-2 3.5-2s2.5.6 3.5 2',
 f2:c(12,12,9)+'|M9 9.5h.01|M15 9.5h.01|M9 15.5c1-.7 2-1 3-1s2 .3 3 1',
 f3:c(12,12,9)+'|M9 9.5h.01|M15 9.5h.01|M9 15h6',
 f4:c(12,12,9)+'|M9 9.5h.01|M15 9.5h.01|M8.5 14c1 1.6 2.2 2.2 3.5 2.2s2.5-.6 3.5-2.2',
 f5:c(12,12,9)+'|M9 9.5h.01|M15 9.5h.01|M8 13.5h8c0 2.6-1.8 4-4 4s-4-1.4-4-4z'
};
const svg=(n,s=20,sw=1.8)=>`<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(P[n]||P.dots).split('|').map(d=>`<path d="${d}"/>`).join('')}</svg>`;
const CAT={'Housing':'home','Town Bill':'bank','Phone & Internet':'phone','Insurance':'shield','Taxes':'receipt','Utilities':'zap','Bills & Payments':'receipt','Fees':'tag',
 'Monthly Grocery Run':'basket','Groceries & Snacks':'cart','Restaurants':'utensils','Gas':'fuel','Car Expenses':'wrench','Household Supplies':'drop','Shopping & Household':'bag','Amazon':'package',
 'Home Improvement':'hammer','Activities & Lessons':'users','Homeschool & Education':'book','Childcare & School':'cap','Gifts':'gift','Allowances & Chores':'wallet','Sent to Family':'send','Giving':'heart',
 'Health':'pulse','NFP Monitor':'heart','Subscriptions':'repeat','Fun & Travel':'ticket','Tech & Business':'laptop','Zelle':'send','Miscellaneous':'dots','Cash':'cash','Checks':'receipt','Other':'dots','Needs a label':'tag','Transfers':'repeat'};
const GRP={'Home & Bills':'home','Food':'utensils','Auto':'car','Household & Shopping':'bag','Home Improvement':'hammer','Family & Kids':'users','Health':'pulse','Fun & Subscriptions':'ticket','Cash & Misc':'wallet'};
const GCOL={'Home & Bills':'#4f46e5','Food':'#10b981','Auto':'#0ea5e9','Household & Shopping':'#f59e0b','Home Improvement':'#ea580c','Family & Kids':'#ec4899','Health':'#14b8a6','Fun & Subscriptions':'#8b5cf6','Cash & Misc':'#64748b'};
const mix=(h,t)=>{const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,f=v=>Math.round(v+(255-v)*t);return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')};
const dark=(h,t)=>{const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,f=v=>Math.round(v*(1-t));return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('')};
function colorOf(key){
  if(GCOL[key])return GCOL[key];
  const G=window.CAT_GROUP_OF&&window.CAT_GROUP_OF[key];if(!G||!GCOL[G])return null;
  const g=window.CAT_GROUPS.find(x=>x[0]===G),i=Math.max(0,g[2].indexOf(key));return i?mix(GCOL[G],Math.min(.55,i*.2)):GCOL[G];
}
function tile(icon,color,size=36){const s=Math.round(size*.52);return `<span class="ico" style="--c:${color||'#6366f1'};--c2:${dark(color||'#6366f1',.22)};width:${size}px;height:${size}px;border-radius:${Math.round(size*.3)}px">${svg(icon,s,1.9)}</span>`}
window.Icons={svg,tile,colorOf,catIcon:n=>CAT[n]||'dots',groupIcon:n=>GRP[n]||'dots',GCOL,mix};
})();
