// B-K5: 90-Tage-Liquiditaetstimeline bei aktiv sparendem Spielerminer.
// Nur originaler main / Regel14, keine Produktimplementierung.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const anchor="    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert.equal(src.split(anchor).length,2);
const instrumented=src.replace(anchor,
 "    const n = Math.min(besitzer.cash, kosten);\n    watch.work(s.owner,s.klasse,kosten,n);\n    if (n <= 0) continue;");
const seeds=[7,42];
const sum=a=>a.reduce((x,y)=>x+y,0);
function capture(s,c,label,event){
 const cashOwners=Object.fromEntries(['house','npc1','npc2','npc3','security','pirates']
   .map(o=>[o,s.owners[o]?.cash??0]));
 const fundCash=sum(Object.values(s.owners).filter(x=>x.kind==='fund').map(x=>x.cash));
 const stationCash=sum(Object.values(s.owners).filter(x=>x.kind==='station').map(x=>x.cash));
 const freighters=Object.fromEntries(['npc1','npc2','npc3']
   .map(o=>[o,Object.values(s.ships).filter(x=>x.owner===o&&x.klasse==='frachter').length]));
 const stocked={nahrung:0,medikamente:0};
 for(const x of Object.values(s.stations))for(const w of Object.keys(stocked))stocked[w]+=x.lager[w]||0;
 const shortage={};for(const st of Object.values(s.stats.mangel))
  for(const [w,n] of Object.entries(st))shortage[w]=(shortage[w]||0)+n;
 assert(c.audit(s).ok,'Original-Core-Audit');
 assert.equal(sum(Object.values(s.owners).map(x=>x.cash)),s.initialSupply+s.minted-s.burned,
  'eigenstaendiges Geld-Audit');
 const qty={};
 for(const st of Object.values(s.stations))
  for(const [w,n] of Object.entries(st.lager))qty[w]=(qty[w]||0)+n;
 for(const sh of Object.values(s.ships))
  for(const [w,n] of Object.entries(sh.ladung))qty[w]=(qty[w]||0)+n;
 for(const [w,l] of Object.entries(s.ledger))
  assert.equal(qty[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
   'eigenstaendiges Warenaudit: '+w);
 return {label,day:s.tick/1440,cashOwners,fundCash,stationCash,freighters,stocked,
  shortageFood:shortage.nahrung||0,shortageMed:shortage.medikamente||0,
  unpaid:{...event.unpaid},paid:{...event.paid},
  consumedFood:s.ledger.nahrung.consumed,consumedMedicine:s.ledger.medikamente.consumed,
  tradeEvents:s.stats.handel,
  minted:s.minted,burned:s.burned,hash:c.hash(s)};
}
for(const seed of seeds){
 const event={unpaid:{npc1:0,npc2:0,npc3:0},paid:{npc1:0,npc2:0,npc3:0}};
 const watch={work:(o,klass,due,paid)=>{
  if(Object.hasOwn(event.unpaid,o)){
   event.unpaid[o]+=Math.max(0,due-paid);event.paid[o]+=paid;
  }
 }};
 const {c,r}=new Function('watch',instrumented+
  ';return {c:m_core_index,r:m_data_rules.RULES};')(watch);
 assert.equal(r.rulesVersion,14);
 const s=c.createState(seed,r);
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(miner,'Spielerminer fehlt');
 const cmd=c.execute(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},r);
 assert(cmd.ok,cmd.reason);
 const wanted=new Set([0,1,3,7,14,30,60,90]);
 console.log('BK5_KRISE_TIMELINE '+JSON.stringify({seed,point:capture(s,c,'start',event)}));
 for(let day=1;day<=90;day++){
  c.advance(s,1440,r);
  if(day%7===0||wanted.has(day))capture(s,c,'audit',event);
  if(wanted.has(day)){
   const point=capture(s,c,'situation',event);
   assert.equal(c.hash(c.load(c.save(s),undefined,r)),c.hash(s),'Save/Load nach '+day);
   console.log('BK5_KRISE_TIMELINE '+JSON.stringify({seed,point}));
  }
 }
}
console.log('BK5_KRISE_TIMELINE_DONE '+JSON.stringify({seeds,days:90,
 note:'main original, kein neuer ISK-Finanzierungsmechanismus'}));
