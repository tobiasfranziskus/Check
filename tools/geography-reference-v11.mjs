// v11-Langlauf gegen fest hinterlegte Referenzwerte. Keine Fixture-Neugenerierung.
// node tools/geography-reference-v11.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const text=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const common=['st_aldera','st_cyris','st_dravos','st_meridian','st_orion','st_veldra'];
assert.equal(fixture.sourceCommit,'f5fcde6380d66b2de0c73dc1fb7ef942f9971e8c');
assert.equal(fixture.rulesVersion,11);
assert.deepEqual(fixture.results.map(r=>r.seed),seeds);
const original=new Function(text+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(original.r.rulesVersion,11);
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const cost="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert(text.includes(trade)&&text.includes(cost),'Instrumentierungsanker');
const instrumented=text.replace(trade,"buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,menge,kauf);\n  return true;")
 .replace(cost,"if (['npc1','npc2','npc3'].includes(s.owner)) watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+cost);
const sum=a=>a.reduce((x,y)=>x+y,0);
const shortage=(s,ids)=>sum(ids.map(id=>sum(Object.values(s.stats.mangel[id]||{}))));
const loss=(s,id)=>sum(Object.values(s.stats.verluste[id]||{}));
const clone=()=>new Function('watchTrade','watchCost',instrumented+';return m_core_index;');
function auditIndependent(s){
 assert.equal(sum(Object.values(s.owners).map(o=>o.cash)),s.initialSupply+s.minted-s.burned,'unabhängiger Geld-Audit');
 for(const [ware,l] of Object.entries(s.ledger)){
  const stock=sum(Object.values(s.stations).map(st=>st.lager[ware]||0))
             +sum(Object.values(s.ships).map(sh=>sh.ladung[ware]||0));
  assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'unabhängiger Waren-Audit '+ware);
 }
}
const final=[];
for(const seed of seeds){
 let sales=0,unpaidNpc1=0,unpaidNpc2=0,unpaidNpc3=0,zeroNpc1=0,longNoSale=0,noSale=0,prevSales=0;
 const c=clone()((s,sh,n,kauf)=>{if(!kauf&&sh.klasse==='frachter'&&s.owners[sh.owner].kind==='trader')sales++;},
 (owner,short)=>{if(owner==='npc1')unpaidNpc1+=short;else if(owner==='npc2')unpaidNpc2+=short;else unpaidNpc3+=short});
 const s=c.createState(seed),ref=fixture.results.find(x=>x.seed===seed);
 const points=[];
 for(let t=1;t<=129600;t++){
  c.step(s);
  if(t%60===0){
   assert(c.audit(s).ok,'Kern-Audit Seed '+seed+' Tick '+t);
   auditIndependent(s);
   if(t>=10080&&s.owners.npc1.cash===0)zeroNpc1++;
   noSale=sales===prevSales?noSale+1:0;
   longNoSale=Math.max(longNoSale,noSale);
   prevSales=sales;
  }
  if(t===4320||t===43200||t===129600)points.push({tick:t,hash:c.hash(s)});
 }
 assert.deepEqual(points,ref.points,'Fixierte Hashes instrumentiert Seed '+seed);
 assert.equal(c.hash(c.load(c.save(s))),c.hash(s),'Save/Load '+seed);
 const replay=original.c.createState(seed);
 for(const p of ref.points){
  while(replay.tick<p.tick)original.c.advance(replay,Math.min(10000,p.tick-replay.tick));
  assert.equal(original.c.hash(replay),p.hash,'Uninstrumentierter Core gegen feste Hashes Seed '+seed+' Tick '+p.tick);
  assert(original.c.audit(replay).ok);
  auditIndependent(replay);
 }
 const result={commonShortage:shortage(s,common),totalShortage:shortage(s,Object.keys(s.stations)),
  nadirShortage:shortage(s,['st_nadir']),sales,unpaidNpc1,unpaidNpc2,unpaidNpc3,zeroNpc1,longNoSale,
  lossNpc1:loss(s,'npc1'),lossNpc2:loss(s,'npc2'),lossNpc3:loss(s,'npc3'),
  lossPirates:loss(s,'pirates'),lossSecurity:loss(s,'security'),
  siliconMined:s.ledger.silizium.mined,siliconConsumed:s.ledger.silizium.consumed,
  foodProduced:s.ledger.nahrung.produced,cashNpc1:s.owners.npc1.cash,cashNpc3:s.owners.npc3.cash,
  minted:s.minted,burned:s.burned,initialSupply:s.initialSupply};
 assert.deepEqual(result,ref.final,'Festes Schlussprofil Seed '+seed);
 final.push(result);
 console.log('GEO_V11_PASS '+JSON.stringify({seed,points}));
}
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
console.log('GEO_V11_SUMMARY '+JSON.stringify({seeds:final.length,
 medianMangel:median(final.map(x=>x.commonShortage)),
 sumMangel:sum(final.map(x=>x.commonShortage)),
 sumNpc1Kostenluecke:sum(final.map(x=>x.unpaidNpc1)),
 sales:sum(final.map(x=>x.sales)),
 siliconMined:sum(final.map(x=>x.siliconMined))}));
