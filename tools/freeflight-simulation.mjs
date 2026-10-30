// Referenzprüfung für PR #19 (Sicherheitswelt, Regelversion 10).
// Aufruf: node tools/freeflight-simulation.mjs
// FIXTURE WIRD NICHT AUTOMATISCH NEU ERZEUGT. Änderungen bedürfen separat geprüfter Referenzen.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-security-v10.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.equal(fixture.sourceCommit,'3cff288aa75c2c072c210298e9f81fb7b92a4ec7');
assert.equal(fixture.rulesVersion,10);
assert.deepEqual(fixture.results.map(x=>x.seed),seeds,'Referenz-Seedliste ist unvollständig oder verändert');

const clean=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(clean.r.rulesVersion,10,'v10-Referenzen nicht für andere Regelversionen verwenden');
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
assert(source.includes(tradeAnchor)&&source.includes(costAnchor),'Instrumentierungsstellen müssen unverändert sein');
const watched=source.replace(tradeAnchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,menge,kauf);\n  return true;")
 .replace(costAnchor,
 "if (['npc1','npc2','npc3'].includes(s.owner)) watchCost(s.owner,Math.max(0,kosten-besitzer.cash));\n    "+costAnchor);
const engine=(trade,cost)=>new Function('watchTrade','watchCost',watched+';return m_core_index;')(trade,cost);
const sum=a=>a.reduce((v,n)=>v+n,0);
const shortage=s=>sum(Object.values(s.stats.mangel).map(row=>sum(Object.values(row))));
const loss=(s,owner)=>sum(Object.values(s.stats.verluste[owner]||{}));
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];

// Unabhängige Formulierung der Geld- und Warenbilanz ohne m_core_audit.
function auditSeparat(s){
 assert.equal(sum(Object.values(s.owners).map(o=>o.cash)),s.initialSupply+s.minted-s.burned,'ISK-Bilanz');
 for(const [ware,l] of Object.entries(s.ledger)){
  const actual=sum(Object.values(s.stations).map(st=>st.lager[ware]||0))
   +sum(Object.values(s.ships).map(sh=>sh.ladung[ware]||0));
  const expected=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
  assert.equal(actual,expected,'Warenbilanz '+ware);
 }
}

const results=[];
for(const seed of seeds){
 let sales=0,weekZeroNpc1=0,unpaidNpc1=0,unpaidNpc2=0,unpaidNpc3=0;
 let lastSales=0,noSaleHours=0,longNoSale=0;
 const observed=engine(
  (state,ship,n,buy)=>{if(!buy&&ship.klasse==='frachter'&&state.owners[ship.owner].kind==='trader')sales++;},
  (owner,short)=>{if(owner==='npc1')unpaidNpc1+=short;else if(owner==='npc2')unpaidNpc2+=short;else unpaidNpc3+=short;}
 );
 const s=observed.createState(seed);
 const expected=fixture.results.find(x=>x.seed===seed);
 assert(expected,'fehlende v10-Referenz '+seed);
 const points=[];
 for(let t=1;t<=129600;t++){
  observed.step(s);
  if(t%60===0){
   assert(observed.audit(s).ok,'Core-Audit '+seed+' Tick '+t);
   auditSeparat(s);
   if(t>=10080&&s.owners.npc1.cash===0)weekZeroNpc1++;
   noSaleHours=sales===lastSales?noSaleHours+1:0;
   longNoSale=Math.max(longNoSale,noSaleHours);
   lastSales=sales;
  }
  if(t===4320||t===43200||t===129600){
   points.push({tick:t,hash:observed.hash(s)});
  }
 }
 assert.deepEqual(points,expected.points,'Instrumentierter Fixpunkt Seed '+seed);
 assert.equal(observed.hash(observed.load(observed.save(s))),observed.hash(s),'Save/Load Seed '+seed);

 // Zweiter Weg ohne Beobachter: unmodifizierter Core, große advance-Blöcke
 // statt einzelner step-Aufrufe. Abgleich gegen externe fixierte Sollwerte.
 const replay=clean.c.createState(seed);
 for(const p of expected.points){
  while(replay.tick<p.tick)clean.c.advance(replay,Math.min(10000,p.tick-replay.tick));
  assert.equal(clean.c.hash(replay),p.hash,'Unveränderter Core und fixer Referenzhash '+seed+'/'+p.tick);
  assert(clean.c.audit(replay).ok,'Replay-Audit '+seed+'/'+p.tick);
  auditSeparat(replay);
 }
 const actual={
  mangel:shortage(s),sales,weekZeroNpc1,unpaidNpc1,unpaidNpc2,unpaidNpc3,longNoSale,
  lossNpc1:loss(s,'npc1'),lossNpc2:loss(s,'npc2'),lossNpc3:loss(s,'npc3'),
  siliconMined:s.ledger.silizium.mined,siliconConsumed:s.ledger.silizium.consumed,
  foodProduced:s.ledger.nahrung.produced,cashNpc1:s.owners.npc1.cash,cashNpc3:s.owners.npc3.cash,
  minted:s.minted,burned:s.burned,initialSupply:s.initialSupply
 };
 assert.deepEqual(actual,expected.final,'Fixierte Wirtschaftskennzahlen Seed '+seed);
 results.push(actual);
 console.log('SECURITY_V10_PASS '+JSON.stringify({seed,points,final:actual}));
}
console.log('SECURITY_V10_SUMMARY '+JSON.stringify({
 seeds:results.length,medianMangel:median(results.map(x=>x.mangel)),
 totalMangel:sum(results.map(x=>x.mangel)),totalSales:sum(results.map(x=>x.sales)),
 totalUnpaidNpc1:sum(results.map(x=>x.unpaidNpc1)),totalSiliconMined:sum(results.map(x=>x.siliconMined))
}));
