import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=(on=true)=>({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,autoLeadDays:2,
  retainFleetEarnings:true,carrierWorkingCapital:true,
  autoOreSettlement:true,autoTakeover:true,...(on?{autoNpcVenture:true}:{})
}});
function dailyAudit(s,r,label){
 const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
 assert.equal(a.ok,true,label+': Core '+JSON.stringify(Object.keys(a).filter(k=>a[k]?.ok===false)));
 assert.equal(f.ok,true,label+': Carrier-Kasse');
 assert.equal(f.oreVenture.ok,true,label+': NPC3-Kapital');
 assert.equal(f.freight.available,f.freight.reconstructed);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
   s.initialSupply,label+': unabhängige Geldsumme');
 for(const [ware,l] of Object.entries(s.ledger)){
  const physical=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
    +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    label+': physische Ware '+ware);
 }
 return f;
}
function run(seed,days,on=true){
 const r=rules(on),s=api.createW5RState(seed,'full','npc3'),
 points={},events=[];let last=0;
 for(let day=1;day<=days;day++){
   api.advance(s,1440,r);
   const f=dailyAudit(s,r,'Seed '+seed+' Tag'+day);
   if(s.w3.abgeschlossen!==last){
     events.push({day,ore:s.w3.abgeschlossen});last=s.w3.abgeschlossen;
   }
   if([30,59,60,61,62,75,90,100,105,120,150,180,240,365].includes(day)){
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
       'Save/Load '+day);
     const venture=f.oreVenture,sh=s.ships[venture.ship];
     points[day]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
       ice:s.w5n.frachtAbgeschlossen,venture,plan:f.oreVenturePlan,
       npcPlan:api.w5sNpcErzStatus(s,r),
       orePlan:f.orePlan,shop:f.yardPlan,
       npcCash:s.owners.npc3.cash,merchantCash:s.owners.export.cash,
       companyCash:s.owners.transport.cash,houseCash:s.owners.w5n_kunden.cash,
       stAldera:s.owners.st_aldera.cash,
       oreAtAldera:s.stations.st_aldera.lager.erz,
       merchantOre:s.w5h.bestand,
       minerStock:s.stations.st_aldera.lager.miner,
       miner:sh?{id:sh.id,owner:sh.owner,cargo:sh.ladung,job:sh.auftrag,ware:sh.ware,phase:sh.phase}:null};
   }
 }
 return {seed,days,on,hash:api.hash(s),events,points,
   ore:s.w3.abgeschlossen,ice:s.w5n.frachtAbgeschlossen,
   water:s.w5n.wasserVerbraucht,
   venture:api.w5sFinanzStatus(s,r).oreVenture,
   npcCash:s.owners.npc3.cash,exportCash:s.owners.export.cash,
   transportCash:s.owners.transport.cash,shipCount:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length};
}
test('W5s-p: Finanzierter NPC-Erzlieferant im selben vollständigen R32-Core',()=>{
 const x=run(42,120,true);
 console.log('W5S_P_DIAG '+JSON.stringify(x));
 assert.equal(x.venture.active,true,'nach Investment tatsächlich gekaufter Miner');
 assert.equal(x.ore,3,'dritte 50er Erzlieferung voll bezahlt');
 assert.ok(x.events.some(e=>e.ore===3&&e.day===104));
 assert.equal(x.water,5724,'echte bezahlte Wasserversorgung');
 assert.equal(x.ice,116,'W3 und W5n weiterhin gemeinsamer Logistikcore');
 assert.equal(x.venture.capital,700);
 assert.equal(x.venture.share,60);
 assert.equal(x.venture.dividends,0,'kein Anlegergewinn bevor Minerhülle und Arbeit amortisiert');
});

const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
test('W5s-p: Flag AUS bleibt exakt W5s-o, ohne neue Konzernkasse',()=>{
 for(const [seed,hash]of [[42,'54e9612605d24486'],
   [7,'32f0beb3131ffc83']]){
  const x=run(seed,90,false);
  assert.equal(x.hash,hash);
  assert.equal(x.venture.active,false);
  assert.equal(x.ore,2);
  assert.equal(x.water,4316);
  console.log('W5S_P_OFF '+JSON.stringify({seed,hash:x.hash,water:x.water,ore:x.ore}));
 }
});
test('W5s-p: 13×120d echte NPC-Kapitalzeichnung, dreimal W3 und volles Weltledger',()=>{
 for(const seed of SEEDS){
  const x=run(seed,120,true);
  assert.equal(x.venture.active,true);
  assert.equal(x.venture.ok,true);
  assert.equal(x.venture.capital,700);
  assert.equal(x.venture.share,60);
  assert.equal(x.venture.investor,'export');
  assert.equal(x.venture.owner,'npc3');
  assert.equal(x.ore,3,'dritte W3-Fracht ohne Spieler-Befehl bis Tag120');
  assert.equal(x.events.find(z=>z.ore===3)?.day,104);
  assert.equal(x.ice,116);
  assert.equal(x.water,5724);
  assert.ok(x.venture.mining>=150);
  assert.ok(x.venture.sold>=100);
  assert.ok(x.shipCount>=2);
  assert.ok(x.venture.dividends<=Math.floor(x.venture.eligible*.6));
  if(seed===42||seed===7)assert.deepEqual(run(seed,120,true),x,
    'kompletter deterministischer Doppelreplay');
  console.log('W5S_P_120D '+JSON.stringify({
    seed,hash:x.hash,ore:x.ore,water:x.water,ice:x.ice,
    venture:x.venture,mining:x.venture.mining,goodsSold:x.venture.sold}));
 }
});
test('W5s-p: Seed42/7 ×365 Tage – keine versteckten weiteren Aufträge',()=>{
 for(const seed of [42,7]){
   const x=run(seed,365,true);
   assert.equal(x.venture.active,true);
   assert.equal(x.venture.ok,true);
   assert.ok(x.ore>=3,'mindestens drei real bezahlte W3-Frachten');
   assert.ok(x.water>=5724);
   assert.ok(x.venture.dividends<=Math.floor(x.venture.eligible*.6));
   console.log('W5S_P_365D '+JSON.stringify({
     seed,hash:x.hash,ore:x.ore,water:x.water,ice:x.ice,
     cash:{npc3:x.npcCash,export:x.exportCash,transport:x.transportCash},
     venture:x.venture,day365:x.points[365],events:x.events}));
 }
});
test('W5s-p: Geldverschiebung ohne Anteil und erfundener Ertrag scheitern am Original-Audit',()=>{
 const r=rules(true),s=api.createW5RState(42,'full','npc3');
 for(let d=1;d<=105;d++)api.advance(s,1440,r);
 const valid=dailyAudit(s,r,'Original nach dritter Fracht');
 assert.equal(valid.oreVenture.active,true);
 const original=api.hash(s);
 for(const mutation of [
   q=>q.w5s.oreVenture.capital++,
   q=>q.w5s.oreVenture.share++,
   q=>q.w5s.oreVenture.ship='sh003',
   q=>q.w5s.oreVenture.dividends+=72,
   q=>{q.owners.npc3.cash+=700;q.owners.export.cash-=700}
 ]){
   const clone=api.loadW5R(api.save(s));
   mutation(clone);
   assert.equal(api.audit(clone).ok,false,'unbelegtes Kapital/Schiff/Anrecht muss scheitern');
 }
 assert.equal(api.hash(s),original,'Originalwelt niemals verändert');
});
