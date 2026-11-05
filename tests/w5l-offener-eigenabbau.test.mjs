import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5L_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const ownMiner=(s,owner)=>Object.values(s.ships).find(sh=>
  sh.owner===owner&&sh.klasse==='miner'&&sh.system==='aldera');
function independentAudit(s,label=''){
 const a=api.audit(s);
 assert.equal(a.ok,true,label+': '+JSON.stringify(Object.fromEntries(
   Object.entries(a).filter(([,v])=>v?.ok===false))));
 assert.equal(typeof a.ok,'boolean');
 assert.equal(s.rulesVersion,27);assert.equal(s.schema,8);
 assert.equal(s.initialSupply,33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const all=Object.values(s.owners);
 assert.equal(all.reduce((n,o)=>n+o.cash,0),33000,'Money conserved: '+label);
 for(const o of all)assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'cash '+o.id);
 for(const [ware,ledger] of Object.entries(s.ledger)){
   const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(actual,ledger.initial+ledger.mined+ledger.produced
     +ledger.imported-ledger.consumed-ledger.exported,'goods '+ware+': '+label);
 }
 const contracts=s.erzpilotVertraege||{};
 const bound=Object.values(contracts).reduce((n,v)=>n+v.menge,0);
 const storage=s.stations.st_aldera.lager.erz;
 assert.ok(Number.isSafeInteger(bound)&&bound>=0);
 assert.ok(Number.isSafeInteger(storage)&&storage>=0);
 const realCapacity=api.obergrenze(s,rules,'st_aldera','erz');
 assert.ok(storage+bound<=realCapacity,'real station storage limit');
 assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
 assert.equal(s.owners.export.cash,20000-10*(s.w5h.bestand+s.w5h.unterwegs));
 for(const owner of ['npc3','house']){
   const cash0=rules.owners.find(o=>o.id===owner).cash;
   const book=s.stats.konto[owner];
   const boundWork=Object.entries(contracts).reduce((n,[id,v])=>
     n+(s.ships[id]?.owner===owner?(s.owners[v.arbeitsKonto]?.cash||0):0),0);
   const extra=owner==='house'?
     (s.owners.w5b_silizium_arbeit?.cash||0)
       +(s.owners.w5b_fabrik_arbeit?.cash||0)+(s.owners.w5f_laser_arbeit?.cash||0):0;
   assert.equal(cash0+book.erloes-book.kosten,
     s.owners[owner].cash+boundWork+extra,'owner ledger '+owner+': '+label);
 }
 return a;
}
function startTwo(seed){
 const s=api.createW5LState(seed);independentAudit(s,'new state');
 const buy=api.execute(s,{type:'shipBuy',owner:'house',klasse:'miner',
   station:'st_aldera'},rules);
 assert.equal(buy.ok,true,'House buys real mining hull');
 const sh=ownMiner(s,'house');
 const mine=api.execute(s,{type:'shipMine',owner:'house',
   schiff:sh.id,ware:'erz'},rules);
 assert.equal(mine.ok,true,'House chooses mining');
 independentAudit(s,'two owners started');
 return s;
}

test('W5l: old R26 R14 references and strict R27 save/load are isolated',()=>{
 assert.equal(rules.rulesVersion,27);
 assert.equal(rules.schema,8);
 assert.equal(rules.w3.fracht,50,'fraighter batch remains 50, not mining cap');
 assert.equal(rules.erzpilot.preis,10);
 assert.equal(rules.erzpilot.minerJeMinute,2);
 assert.equal(rules.economy.miningRate,1);
 assert.equal(rules.w5l.eigenabbauOhneAbnahme,true);
 const r26=api.createW5IState(42);
 assert.equal(api.hash(r26),'343559f8c88543e4');
 assert.equal(api.audit(r26).ok,true);
 assert.equal(api.hash(api.loadW5I(api.save(r26))),api.hash(r26));
 const r27=api.createW5LState(42);
 assert.equal(api.audit(r27).ok,true);
 assert.equal(api.hash(api.loadW5L(api.save(r27))),api.hash(r27));
 assert.throws(()=>api.loadW5L(api.save(r26)),/inkompatibel/);
 assert.throws(()=>api.loadW5I(api.save(r27)),/inkompatibel/);
});

test('W5l: two genuine miners exceed 50 ore without unlimited paying customers',()=>{
 const s=startTwo(42);
 const initialRevenue={npc:s.stats.konto.npc3.erloes,house:s.stats.konto.house.erloes};
 api.advance(s,55,rules);
 const a=independentAudit(s,'competing minute 55');
 assert.ok(s.ledger.erz.mined>50,'50 is not a global mining hard cap');
 assert.ok(a.w5i.limit===null && a.w5i.freiesAuftragsvolumen===null,
   'no invented global mining limit in the ledger');
 assert.equal(s.w3.geliefert,0,'no free intersystem transport');
 assert.ok(s.ledger.erz.mined>=s.stations.st_aldera.lager.erz,
   'new ore is not a mock market');
 assert.ok(s.stats.konto.npc3.erloes>=initialRevenue.npc);
 assert.ok(s.stats.konto.house.erloes>=initialRevenue.house);
 assert.ok(Object.values(s.ships).some(sh=>sh.klasse==='miner'&&(sh.ladung.erz||0)>0),
   'unsold ore remains physical cargo owned by miner');
 console.log('W5L_OPEN_MINING '+JSON.stringify({seed:42,
   hash:api.hash(s),mined:s.ledger.erz.mined,
   station:s.stations.st_aldera.lager.erz,
   npcOwned:ownMiner(s,'npc3').ladung.erz||0,
   houseOwned:ownMiner(s,'house').ladung.erz||0,
   npcIncome:s.stats.konto.npc3.erloes,houseIncome:s.stats.konto.house.erloes,
   buyerCash:s.owners.st_aldera.cash,minted:s.minted}));
});

test('W5l: exhausted buyers pay no fictional revenue; private cargo and costs remain',()=>{
 const s=startTwo(42);
 api.advance(s,55,rules);independentAudit(s,'buyers before stop');
 const beforeRevenue=s.stats.konto.house.erloes;
 const beforeCargo=ownMiner(s,'house').ladung.erz||0;
 const beforeCosts=s.stats.konto.house.kosten;
 // House deliberately continues at its own risk; no transport to Nadir exists.
 api.advance(s,40,rules);
 independentAudit(s,'buyer empty');
 assert.equal(s.owners.st_aldera.cash,0,'buyer funds cannot be topped up');
 assert.equal(s.stats.konto.house.erloes,beforeRevenue,
   'unsold ore is not automatic revenue');
 assert.ok((ownMiner(s,'house').ladung.erz||0)>beforeCargo);
 assert.ok(s.stats.konto.house.kosten>beforeCosts,'labor actually paid');
 assert.equal(s.w3.geliefert,0,'no invented demand fulfillment');
 assert.equal(s.minted,0);
 const roundtrip=api.loadW5L(api.save(s));
 assert.equal(api.hash(roundtrip),api.hash(s));
 const forged=api.loadW5L(api.save(s));
 forged.owners.house.cash+=500;forged.owners.npc3.cash-=500;
 assert.equal(api.audit(forged).ok,false,'unsupported transfer detected');
 assert.throws(()=>api.loadW5L(api.save(forged)),/fehlerhaft/);
});

test('W5l: cargo capacity and available owner funds, not order count, stop own mining',()=>{
 const s=startTwo(42);
 api.advance(s,160,rules);independentAudit(s,'160m');
 const sh=ownMiner(s,'house');
 assert.ok((sh.ladung.erz||0)<=rules.economy.cargo);
 assert.equal(sh.auftrag,'halten','full cargo ends unpaid-risk mining');
 const h=api.hash(s);
 api.advance(s,10,rules);
 assert.equal(sh.ladung.erz,100);
 assert.equal(api.hash(api.loadW5L(api.save(s))),api.hash(s));
 assert.notEqual(api.hash(s),h,'time continues deterministically');
});

test('W5l: 13 seeds x 90 days, daily independent audits and deterministic replay/save',()=>{
 for(const seed of seeds){
   const a=startTwo(seed);api.advance(a,55,rules);
   const b=api.loadW5L(api.save(a));
   for(let day=1;day<=90;day++){
     api.advance(a,1440,rules);api.advance(b,1440,rules);
     independentAudit(a,'seed '+seed+' day '+day);
     assert.equal(api.hash(a),api.hash(b),'determinism '+seed+'/'+day);
   }
   assert.equal(api.hash(api.loadW5L(api.save(a))),api.hash(a));
   assert.equal(a.minted,0);
   console.log('W5L_90T '+JSON.stringify({seed,hash:api.hash(a),
     mined:a.ledger.erz.mined,ownerCash:a.owners.house.cash,
     npcCash:a.owners.npc3.cash,marketCash:a.owners.st_aldera.cash,
     stationOre:a.stations.st_aldera.lager.erz,minted:a.minted}));
 }
});
