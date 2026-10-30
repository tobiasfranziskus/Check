// EINMALIGER Langlauf für die Abnahme des neuen Reise-/Wirtschaftsmodells.
// Nach erfolgreicher Prüfung in tools/ archivieren, nicht dauerhaft im schnellen Testsatz.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert(source.includes(tradeAnchor) && source.includes(costAnchor),'Observer-Anker');
const observed=source.replace(tradeAnchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,menge,kauf);\n  return true;")
 .replace(costAnchor,
 "if (s.owner === 'npc1' || s.owner === 'npc2') watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+costAnchor);
function engine(text,watchTrade=()=>{},watchCost=()=>{}){
 return new Function('watchTrade','watchCost',text+';return m_core_index;')(watchTrade,watchCost);
}
const base=engine(source);
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const median=arr=>{const a=[...arr].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const shortage=s=>Object.values(s.stats.mangel).reduce((a,station)=>a+Object.values(station).reduce((sum,n)=>sum+n,0),0);

test('13 Seeds mal 90 Tage: Handel, Kosten, Bilanzen und Wiederholungs-Hashes',()=>{
 const results=[];
 for(const seed of seeds){
  let sales=0,weekZeroNpc1=0,unpaidNpc1=0,unpaidNpc2=0,longNoSale=0,noSaleHours=0,prevSales=0;
  const c=engine(observed,
   (state,ship,n,kauf)=>{if(!kauf && ship.klasse==='frachter' && state.owners[ship.owner].kind==='trader')sales++},
   (owner,short)=>{if(owner==='npc1')unpaidNpc1+=short;else unpaidNpc2+=short}
  );
  const s=c.createState(seed), points=[];
  for(let t=1;t<=129600;t++){
   c.step(s);
   if(t%60===0){
    assert(c.audit(s).ok,'Audit Seed '+seed+' Tick '+t);
    if(t>=10080 && s.owners.npc1.cash===0)weekZeroNpc1++;
    if(sales===prevSales)noSaleHours++;else noSaleHours=0;
    longNoSale=Math.max(longNoSale,noSaleHours);prevSales=sales;
   }
   if(t===4320 || t===43200 || t===129600)points.push({tick:t,hash:c.hash(s),mangel:shortage(s),sales});
  }
  const replay=base.createState(seed);
  for(const p of points){
   while(replay.tick<p.tick)base.advance(replay,Math.min(10000,p.tick-replay.tick));
   assert.equal(base.hash(replay),p.hash,'Determinismus Seed '+seed+' Tick '+p.tick);
  }
  assert.equal(c.hash(c.load(c.save(s))),c.hash(s),'Save/Load '+seed);
  const result={seed,mangel:shortage(s),sales,weekZeroNpc1,unpaidNpc1,unpaidNpc2,
   longNoSale,siliconMined:s.ledger.silizium.mined,siliconConsumed:s.ledger.silizium.consumed,
   siliconProduced:s.ledger.silizium.produced,bauteile:s.ledger.bauteil.produced,
   cashNpc1:s.owners.npc1.cash,points};
  console.log('V12_SEED '+JSON.stringify(result));
  results.push(result);
 }
 console.log('V12_SUMMARY '+JSON.stringify({
  seeds:results.length,medianMangel:median(results.map(x=>x.mangel)),maxMangel:Math.max(...results.map(x=>x.mangel)),
  medianSales:median(results.map(x=>x.sales)),minSales:Math.min(...results.map(x=>x.sales)),
  sumZeroNpc1:results.reduce((n,x)=>n+x.weekZeroNpc1,0),
  sumUnpaidNpc1:results.reduce((n,x)=>n+x.unpaidNpc1,0),
  maxNoSaleHours:Math.max(...results.map(x=>x.longNoSale)),
  totalSiliconMined:results.reduce((n,x)=>n+x.siliconMined,0),
  totalSiliconConsumed:results.reduce((n,x)=>n+x.siliconConsumed,0)
 }));
});
