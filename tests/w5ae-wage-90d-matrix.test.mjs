import test from 'node:test';
import assert from 'node:assert/strict';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const variants=[
 {id:'low-buyer-spending-unlocks',carrier:2000,buyer:950,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'low-buyer-saving-blocks',carrier:2000,buyer:950,build:true,follow:true},
 {id:'low-buyer-goods-hoarding',carrier:2000,buyer:950,buyAt:150,qty:1,build:true,follow:true},
 {id:'low-buyer-too-many-goods',carrier:2000,buyer:950,buyAt:150,qty:2,build:true,follow:true},
 {id:'buy-before-80-wage',carrier:2000,buyer:950,buyAt:130,qty:1,build:true,follow:true},
 {id:'buy-at-99-wage',carrier:2000,buyer:950,buyAt:149,qty:1,build:true,follow:true},
 {id:'wage-spend-without-refinery-restock',carrier:2000,buyer:950,buyAt:150,qty:1,build:false,follow:true},
 {id:'buyer-740-funds-no-refinery',carrier:2000,buyer:740,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'buyer-739-no-first-freight',carrier:2000,buyer:739,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'carrier-869-no-work-reserve',carrier:869,buyer:950,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'carrier-870-exact-120-reserve',carrier:870,buyer:950,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'buyer-1200-paid-worker-goods',carrier:2000,buyer:1200,buyAt:150,qty:1,extraRefine:true,build:true,follow:true},
 {id:'buyer-4000-workers-save-then-stockpile',carrier:2000,buyer:4000,extraRefine:true,build:true,follow:true,postQty:2}
];
function audit(core,s){
 const a=core.audit(s),w=s.w5ae;
 assert.equal(a.ok,true,JSON.stringify({tick:s.tick,a}));
 assert.equal(a.wageTrade.ok,true);assert.equal(a.w3.ok,true);
 assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);assert.equal(a.replacement.ok,true);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash+w.spent,s.w3.arbeitsKosten);
 assert.equal(w.spent,w.purchased*100);
 assert.equal(s.stations.st_nadir.lager.material+w.inventory.material+s.w5.materialVerbraucht,s.w4.materialErzeugt);
 const g=s.ledger.material,physical=s.stations.st_nadir.lager.material+w.inventory.material;
 assert.equal(physical,g.initial+g.produced+g.imported-g.consumed-g.exported);
 assert.equal(s.owners.st_nadir.cash+s.w3.kaufAusgaben+s.w4.gebucht
   -s.w5.materialUmsatz-w.spent,
   core.W5_RULES.owners.find(x=>x.id==='st_nadir').cash);
 return true;
}
function run(config,verify=true){
 const {core,rules}=Original.createWageResearch({carrierCash:config.carrier,buyerCash:config.buyer});
 let s=core.createW5State(42),attempts={},stateAt230=null;
 const cmd=(type,owner,fields={})=>{
  const r=core.execute(s,{type,owner,...fields},rules);
  if(!r.ok)attempts[type]=r.reason;
  else if(verify)audit(core,s);
  return r.ok;
 };
 const advanceTo=(tick)=>{assert.ok(s.tick<=tick);core.advance(s,tick-s.tick,rules);};
 const initial=cmd('shipBuy','transport',{klasse:'frachter',station:'st_aldera'});
 assert.equal(initial,true);
 const starter=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter').id;
 advanceTo(50);
 if(core.pilotW3Kalkulation(s,starter).ok)cmd('shipFreight','transport',{schiff:starter});
 advanceTo(110);
 if(core.pilotW4Kalkulation(s).ok)cmd('stationRefine','st_nadir',{station:'st_nadir'});
 advanceTo(130);
 if(config.buyAt===130)cmd('workerMaterialBuy','fonds_transport',{menge:config.qty});
 advanceTo(149);
 if(config.buyAt===149)cmd('workerMaterialBuy','fonds_transport',{menge:config.qty});
 advanceTo(150);
 if(config.buyAt===150)cmd('workerMaterialBuy','fonds_transport',{menge:config.qty});
 if(config.extraRefine&&core.pilotW4Kalkulation(s).ok)
  cmd('stationRefine','st_nadir',{station:'st_nadir'});
 advanceTo(170);
 if(config.build&&core.pilotW5Kalkulation(s).ok)
  cmd('stationBuildShip','werft_extern',{station:'st_nadir'});
 advanceTo(200);
 if(s.stations.st_nadir.lager.frachter>0&&core.pilotW5Verkauf(s).ok)
  cmd('shipBuy','transport',{klasse:'frachter',station:'st_nadir'});
 advanceTo(230);
 const source=s.stations.st_aldera.lager.erz,
   buyer=s.owners.st_nadir.cash,quote=core.pilotW3Kalkulation(s,starter);
 stateAt230={source,buyer,quote};
 if(config.follow&&quote.ok)cmd('shipFreight','transport',{schiff:starter});
 advanceTo(350);
 if(config.postQty)cmd('workerMaterialBuy','fonds_transport',{menge:config.postQty});
 if(verify)audit(core,s);
 const saved=core.save(s),copy=core.loadW5(saved),startHash=core.hash(s);
 assert.equal(core.hash(copy),startHash);
 for(let day=1;day<=90;day++){
  core.advance(s,1440,rules);core.advance(copy,1440,rules);
  if(verify)audit(core,s);
  assert.equal(core.hash(s),core.hash(copy),config.id+' replay day '+day);
  if(verify&&day===30)assert.equal(core.hash(core.loadW5(core.save(s))),core.hash(s));
 }
 if(verify)assert.equal(core.hash(core.loadW5(core.save(s))),core.hash(s));
 return {id:config.id,hash:core.hash(s),buyerInitial:config.buyer,
  bought:config.buyAt??config.postQty??0,actualWorkerMaterial:s.w5ae.purchased,
  workerInventory:s.w5ae.inventory.material,workerMoney:s.owners.fonds_transport.cash,
  employeeSpend:s.w5ae.spent,returnedToSeller:s.w5ae.spent,
  freightJobs:s.w3.abgeschlossen,paidFreightWages:s.w3.arbeitsKosten,
  materialProduced:s.w4.materialErzeugt,
  materialToWerft:s.w5.materialVerbraucht,
  buyerAt230:stateAt230.buyer,oreAt230:stateAt230.source,
  freightQuoteAt230:stateAt230.quote.ok,
  freightBlock:stateAt230.quote.ok?null:stateAt230.quote.grund,
  physicalGoodsKept:!(s.ledger.material.consumed>s.w5.materialVerbraucht),
  worldMoney:33000,mint:0,testsDays:90};
}
test('W5ae: 13 economically different 90-day worker-saving/warehouse/financing worlds, identical seeded replays',()=>{
 assert.equal(variants.length,13);
 const results=variants.map(config=>run(config)),again=variants.map(config=>run(config,false));
 for(let i=0;i<results.length;i++)assert.equal(results[i].hash,again[i].hash,variants[i].id);
 const row=id=>results.find(v=>v.id===id);
 assert.equal(row('low-buyer-spending-unlocks').freightJobs,2);
 assert.equal(row('low-buyer-spending-unlocks').buyerAt230,770);
 assert.equal(row('low-buyer-spending-unlocks').actualWorkerMaterial,1);
 assert.equal(row('low-buyer-saving-blocks').buyerAt230,690);
 assert.equal(row('low-buyer-saving-blocks').freightJobs,1);
 assert.equal(row('low-buyer-saving-blocks').oreAt230>=50,true);
 assert.match(row('low-buyer-saving-blocks').freightBlock,/Kaeufer kann Ware/);
 assert.equal(row('low-buyer-goods-hoarding').actualWorkerMaterial,1);
 assert.equal(row('low-buyer-goods-hoarding').materialToWerft,0);
 assert.equal(row('low-buyer-too-many-goods').actualWorkerMaterial,0);
 assert.equal(row('buy-before-80-wage').actualWorkerMaterial,0);
 assert.equal(row('buy-at-99-wage').actualWorkerMaterial,0);
 assert.equal(row('buyer-739-no-first-freight').freightJobs,0);
 assert.equal(row('carrier-869-no-work-reserve').freightJobs,0);
 assert.equal(row('carrier-870-exact-120-reserve').freightJobs>=1,true);
 assert.equal(row('buyer-4000-workers-save-then-stockpile').actualWorkerMaterial,2);
 for(const x of results)assert.equal(x.worldMoney,33000);
 console.log('W5AE_13_REAL_ECONOMIC_REGIMES '+JSON.stringify(results));
});
