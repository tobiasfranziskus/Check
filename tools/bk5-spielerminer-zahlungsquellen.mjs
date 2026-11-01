// BK5 - Wer zahlt den aktiven Spielerminer in der ersten Krise?
// Original Regel14, exakt derselbe Handelspfad, keine Produktänderung.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const anchor="  besitzer.cash -= geld; kasse.cash += geld;";
assert.equal(src.split(anchor).length,2,'original Handel bezahlt den Schiffeigner');
const workAnchor="    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert.equal(src.split(workAnchor).length,2);
const instrumented=src.replace(anchor,
 "  besitzer.cash -= geld; kasse.cash += geld;\n  watch.record(state.tick, schiff.owner, station, ware, menge, kauf, wert, fee);")
 .replace(workAnchor,
 "    const n = Math.min(besitzer.cash, kosten);\n    watch.expense(s.owner,kosten,n);\n    if (n <= 0) continue;");
const sum=a=>a.reduce((x,n)=>x+n,0);
for(const seed of [7,42]){
 const sold=[];
 let playerWork=0,playerUnpaid=0;
 const watch={
  expense:(owner,due,paid)=>{
   if(owner==='house'){playerWork+=paid;playerUnpaid+=Math.max(0,due-paid);}
  },
  record:(tick,owner,station,ware,n,kauf,wert,fee)=>{
  if(owner!=='house'||kauf)return;
  sold.push({tick,day:Math.floor(tick/1440)+1,station,ware,n,value:wert,fee});
 }};
 const {c,r}=new Function('watch',instrumented+
  ';return {c:m_core_index,r:m_data_rules.RULES};')(watch);
 assert.equal(r.rulesVersion,14);
 const s=c.createState(seed,r);
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(miner);
 assert(c.execute(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},r).ok);
 const initial=s.owners.house.cash;
 const checkpoints=new Set([1,3,5,7,14]);
 for(let day=1;day<=14;day++){
  c.advance(s,1440,r);
  if(!checkpoints.has(day))continue;
  const current=sold.filter(x=>x.day<=day);
  const moneyByStation={};
  for(const sale of current){
   const x=moneyByStation[sale.station]||{value:0,fee:0,quantity:0,sales:0};
   x.value+=sale.value;x.fee+=sale.fee;x.quantity+=sale.n;x.sales++;
   moneyByStation[sale.station]=x;
  }
  const gross=sum(current.map(x=>x.value)),fees=sum(current.map(x=>x.fee)),net=gross-fees;
  const delta=s.owners.house.cash-initial;
  console.log('BK5_SPIELER_VERKAUFSQUELLE '+JSON.stringify({
   seed,day,playerCash:s.owners.house.cash,delta,gross,fees,net,
   otherNetDelta:delta-net,playerWorkPaid:playerWork,playerWorkUnpaid:playerUnpaid,
   stillUnclassified:delta-net+playerWork,stations:moneyByStation,
   stationTotalCash:sum(Object.values(s.owners).filter(o=>o.kind==='station').map(o=>o.cash)),
   npcTraders:s.owners.npc1.cash+s.owners.npc2.cash,
   npcTraderHulls:Object.values(s.ships).filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter').length}));
  assert(c.audit(s).ok);
  assert.equal(sum(Object.values(s.owners).map(o=>o.cash)),s.initialSupply+s.minted-s.burned);
 }
}
console.log('BK5_SPIELER_VERKAUFSQUELLE_DONE '+JSON.stringify({seeds:[7,42],days:14,
 note:'Nur bezahlte Original-Erzverkaeufe gegen vorhandene Stationskassen'}));
