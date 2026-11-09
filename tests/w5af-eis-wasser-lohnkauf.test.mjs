import test from 'node:test';
import assert from 'node:assert/strict';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const sumCash=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const cmd=(c,s,r,type,owner,rest={})=>c.execute(s,{type,owner,...rest},r);
function yes(c,s,r,type,owner,rest={}){
 const v=cmd(c,s,r,type,owner,rest);
 assert.equal(v.ok,true,type+': '+v.reason);audit(c,s,r);return v;
}
function audit(core,s,r){
 const a=core.audit(s),w=s.w5n,ice=s.ledger.eis,water=s.ledger.wasser;
 assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.isk.total,33000);
 assert.equal(a.goods.ok,true);assert.equal(a.water.ok,true);
 assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);
 assert.equal(a.w5transfer.ok,true);assert.equal(a.replacement.ok,true);
 assert.equal(a.wageTrade.ok,true);assert.equal(a.vollkosten.ok,true);
 assert.equal(sumCash(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash+(s.w5ae?.spent??0)+w.wasserErlos,
   s.w3.arbeitsKosten+w.frachtLohn,'all actual flight wages accounted for once');
 assert.equal(s.owners.w5n_arbeit.cash,w.fabrikBezahlt,'real water-factory wages');
 assert.equal(s.owners.fonds_aldera.cash,
   s.ledger.erz.mined*r.erzpilot.minerJeMinute+w.mineLohn,
   'real ice-mining salaries paid into the Aldera labor fund');
 const icePhysical=Object.values(s.stations).reduce((n,st)=>n+(st.lager.eis??0),0)
   +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung.eis??0),0);
 assert.equal(icePhysical,ice.initial+ice.mined+ice.produced+ice.imported-ice.consumed-ice.exported);
 const waterPhysical=Object.values(s.stations).reduce((n,st)=>n+(st.lager.wasser??0),0)
   +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung.wasser??0),0);
 assert.equal(waterPhysical,water.initial+water.mined+water.produced+water.imported-water.consumed-water.exported);
 assert.equal(w.wasserVerbraucht,w.kaufDeals.reduce((n,v)=>n+v.menge,0));
 assert.equal(w.wasserErlos,w.kaufDeals.reduce((n,v)=>n+v.betrag,0));
 assert.equal(w.wasserErlos,w.wasserVerbraucht*14);
 assert.equal(s.stations.st_nadir.lager.wasser,w.wasserProduziert-w.wasserVerbraucht);
 assert.equal(s.stations.st_nadir.lager.eis,w.eisGeliefert-w.eisVerbraucht);
 return a;
}
function start(){
 const {core,rules}=Factory.createWaterResearch({carrierCash:2000,buyerCash:4000});
 const s=core.createW5State(42);
 audit(core,s,rules);
 assert.equal(s.rulesVersion,194);
 assert.equal(s.stations.st_aldera.lager.eis,0);
 assert.equal(s.stations.st_nadir.lager.eis,0);
 assert.equal(s.stations.st_nadir.lager.wasser,0);
 assert.equal(s.ledger.eis.initial,0);assert.equal(s.ledger.wasser.initial,0);
 assert.equal(cmd(core,s,rules,'stationWater','st_nadir',{station:'st_nadir'}).ok,false);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:1}).ok,false);
 yes(core,s,rules,'shipBuy','transport',{klasse:'frachter',station:'st_aldera'});
 yes(core,s,rules,'shipBuy','house',{klasse:'miner',station:'st_aldera'});
 const freighter=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 yes(core,s,rules,'shipMine','house',{schiff:miner.id,ware:'eis'});
 core.advance(s,50,rules);audit(core,s,rules);
 assert.equal(s.w5n.eisAbgebaut,50);
 assert.equal(s.w5n.mineLohn,100);
 assert.equal(s.w5n.mineVerkauft,50);
 assert.equal(s.stations.st_aldera.lager.eis,50);
 assert.equal(s.owners.house.cash,2550,'real mine hull+100 minutes of ice wages, then ice sale');
 yes(core,s,rules,'shipWait','house',{schiff:miner.id});
 return {core,rules,s,miner,freighter};
}
test('W5af: isolated Rule194, real 50-ice wage-funded mining and real 490/120 ISK transport, no initial goods',()=>{
 const {core,rules,s,freighter}=start();
 assert.equal(Factory.rules.rulesVersion,191);
 assert.equal(Factory.createResearch({}).rules.rulesVersion,192);
 assert.equal(Factory.createWageResearch({}).rules.rulesVersion,193);
 assert.equal(rules.rulesVersion,194);
 const old=Factory.createWageResearch({carrierCash:2000,buyerCash:4000});
 assert.throws(()=>core.loadW5(old.core.save(old.core.createW5State(42))));
 assert.throws(()=>old.core.loadW5(core.save(s)));
 assert.equal(core.pilotIceFreightQuote(s,freighter.id).ok,true);
 assert.deepEqual((({eis,fracht,arbeit,gesamt,zeit})=>({eis,fracht,arbeit,gesamt,zeit}))
   (core.pilotIceFreightQuote(s,freighter.id)),
   {eis:250,fracht:240,arbeit:120,gesamt:490,zeit:60});
 yes(core,s,rules,'shipFreightIce','transport',{schiff:freighter.id});
 assert.equal(s.owners.st_nadir.cash,3510);
 assert.equal(s.owners.w5n_fracht_kauf.cash,490);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(s.owners.transport.cash,1130);
 assert.equal(s.stations.st_aldera.lager.eis,0);
 assert.equal(s.ships[freighter.id].ladung.eis,50);
 const h=core.hash(s);
 assert.equal(cmd(core,s,rules,'shipFreightIce','transport',{schiff:freighter.id}).ok,false);
 assert.equal(cmd(core,s,rules,'shipFreight','transport',{schiff:freighter.id}).ok,false);
 assert.equal(core.hash(s),h);
 core.advance(s,60,rules);audit(core,s,rules);
 assert.equal(s.tick,110);
 assert.equal(s.w5n.eisGeliefert,50);
 assert.equal(s.stations.st_nadir.lager.eis,50);
 assert.equal(s.w5n.mineVerkaufWert,250,'Aldera paid the own miner for real 50 Eis');
 assert.equal(s.w5n.eisTransferWert,250,'Nadir paid Aldera for the same physically shipped 50 Eis');
 assert.equal(s.stats.konto.st_aldera.erloes,750,'500 verified ore exports plus 250 actual ice shipment revenue');
 assert.equal(s.owners.fonds_transport.cash,60);
 assert.equal(s.owners.w5n_fracht_kauf.cash,240);
 const saved=core.save(s);assert.equal(core.hash(core.loadW5(saved)),core.hash(s));
 core.advance(s,60,rules);audit(core,s,rules);
 assert.equal(s.w5n.frachtAbgeschlossen,1);
 assert.equal(s.owners.fonds_transport.cash,120);
 assert.equal(s.owners.w5n_fracht_kauf.cash,0);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,0);
 assert.equal(s.owners.transport.cash,1370);
 assert.equal(s.ships[freighter.id].phase,'dock');
 assert.equal(s.ships[freighter.id].system,'aldera');
});
test('W5af: 10 actual ice -> 10 water after 20 paid work minutes; 80 salary buys 5 units, 6 blocked',()=>{
 const {core,rules,s,freighter}=start();
 yes(core,s,rules,'shipFreightIce','transport',{schiff:freighter.id});
 core.advance(s,60,rules);audit(core,s,rules);
 const preview=core.pilotWaterFactoryQuote(s);
 assert.equal(preview.ok,true);assert.equal(preview.arbeit,20);
 yes(core,s,rules,'stationWater','st_nadir',{station:'st_nadir'});
 assert.equal(s.owners.w5n_fabrik_arbeit.cash,20);
 assert.equal(s.owners.st_nadir.cash,3490);
 core.advance(s,10,rules);audit(core,s,rules);
 assert.equal(s.stations.st_nadir.lager.wasser,0);
 assert.equal(s.owners.w5n_arbeit.cash,10);
 const mid=core.save(s),midHash=core.hash(s),copy=core.loadW5(mid);
 assert.equal(core.hash(copy),midHash);
 core.advance(s,10,rules);core.advance(copy,10,rules);
 assert.equal(core.hash(s),core.hash(copy));
 audit(core,s,rules);
 assert.equal(s.tick,130);assert.equal(s.w5n.wasserProduziert,10);
 assert.equal(s.w5n.eisVerbraucht,10);assert.equal(s.stations.st_nadir.lager.eis,40);
 assert.equal(s.stations.st_nadir.lager.wasser,10);
 assert.equal(s.owners.w5n_arbeit.cash,20);
 assert.equal(s.owners.fonds_transport.cash,80);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:6}).ok,false);
 const before=core.hash(s);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','transport',{menge:5}).ok,false);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:0}).ok,false);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:1.5}).ok,false);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:100}).ok,false);
 assert.equal(core.hash(s),before,'denials atomic, no free water');
 yes(core,s,rules,'workerWaterBuy','fonds_transport',{menge:5});
 assert.equal(s.owners.fonds_transport.cash,10);
 assert.equal(s.stations.st_nadir.lager.wasser,5);
 assert.equal(s.ledger.wasser.consumed,5);
 assert.equal(s.w5n.wasserErlos,70);
 assert.equal(s.owners.st_nadir.cash,3560);
 const paidHash=core.hash(s);
 assert.equal(core.hash(core.loadW5(core.save(s))),paidHash);
 core.advance(s,40,rules);audit(core,s,rules);
 assert.equal(s.tick,170);assert.equal(s.owners.fonds_transport.cash,50);
 yes(core,s,rules,'workerWaterBuy','fonds_transport',{menge:3});
 assert.equal(s.owners.fonds_transport.cash,8);
 assert.equal(s.stations.st_nadir.lager.wasser,2);
 assert.equal(s.w5n.wasserVerbraucht,8);
 assert.equal(s.w5n.wasserErlos,112);
 assert.equal(s.w5n.frachtAbgeschlossen,1);
 assert.equal(s.minted,0);
 console.log('W5AF_WATER_ORIGIN_TO_REAL_WAGE_CONSUMPTION '+JSON.stringify({
  seed:42,tick:170,hash:core.hash(s),iceMined:50,
  iceTransported:50,waterProduced:10,waterUsed:8,
  boughtFromRealFlightSalary:112,paidMineWages:100,
  paidShipPilotWages:120,paidWaterFactoryWages:20,
  workerCash:8,worldISK:33000,mint:0}));
});
test('W5af: no money, no ice, no real water, or cross-owner order cannot buy/produce/ship',()=>{
 const {core,rules,s,freighter}=start();
 assert.equal(cmd(core,s,rules,'stationWater','st_nadir',{station:'st_nadir'}).ok,false);
 assert.equal(cmd(core,s,rules,'shipFreightIce','house',{schiff:freighter.id}).ok,false);
 assert.equal(cmd(core,s,rules,'shipSellIce','house',{schiff:freighter.id,menge:1}).ok,false);
 assert.equal(cmd(core,s,rules,'workerWaterBuy','fonds_transport',{menge:1}).ok,false);
 assert.equal(cmd(core,s,rules,'shipFreightIce','transport',{schiff:freighter.id}).ok,true);
 assert.equal(cmd(core,s,rules,'shipFreight','transport',{schiff:freighter.id}).ok,false,
   'W3 cannot simultaneously reserve freight on top of an ice job');
 audit(core,s,rules);
});
test('W5af: an ice-loaded paid miner cannot switch to an overlapping ore load, even if ore is available',()=>{
 const {core,rules}=Factory.createWaterResearch({carrierCash:2000,buyerCash:4000});
 const s=core.createW5State(42);
 yes(core,s,rules,'shipBuy','house',{klasse:'miner',station:'st_aldera'});
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 yes(core,s,rules,'shipMine','house',{schiff:miner.id,ware:'eis'});
 core.advance(s,10,rules);audit(core,s,rules);
 assert.equal(s.ships[miner.id].ladung.eis,10);
 const before=core.hash(s);
 const wrong=cmd(core,s,rules,'shipMine','house',{schiff:miner.id,ware:'erz'});
 assert.equal(wrong.ok,false);
 assert.match(wrong.reason,/Erz- und Eisfracht/);
 assert.equal(core.hash(s),before);
 assert.equal(s.ships[miner.id].ladung.eis,10);
 assert.equal(s.ships[miner.id].ware,'eis');
});
test('W5af: fake ownership, water without factory, salary source, buy history and balanced forged transfers cannot load',()=>{
 const {core,rules,s,freighter}=start();
 yes(core,s,rules,'shipFreightIce','transport',{schiff:freighter.id});
 core.advance(s,60,rules);
 yes(core,s,rules,'stationWater','st_nadir',{station:'st_nadir'});
 core.advance(s,20,rules);
 yes(core,s,rules,'workerWaterBuy','fonds_transport',{menge:5});
 const original=core.save(s),hash=core.hash(s);
 const attacks=[
  x=>{x.rulesVersion=193;},x=>{x.schema=7;},
  x=>{x.owners.st_nadir.cash+=70;x.owners.transport.cash-=70;},
  x=>{x.owners.st_nadir.cash+=70;x.owners.fonds_transport.cash-=70;},
  x=>{x.stations.st_nadir.lager.wasser+=1;},
  x=>{x.ledger.wasser.produced++;},
  x=>{x.w5n.wasserProduziert++;},
  x=>{x.w5n.wasserErlos+=14;},
  x=>{x.w5n.wasserVerbraucht++;},
  x=>{x.w5n.kaufDeals[0].owner='house';},
  x=>{x.w5n.kaufDeals[0].tick=-1;},
  x=>{x.w5n.kaufDeals[0].menge=6;},
  x=>{x.w5n.kaufDeals[0].preis=7;},
  x=>{x.w5n.kaufDeals[0].betrag=0;},
  x=>{x.w5n.kaufDeals=[];},
  x=>{x.w5n.fabrikBezahlt=0;},
  x=>{x.owners.w5n_arbeit.cash+=1;x.owners.w5n_fabrik_arbeit.cash-=1;},
  x=>{x.w5n.eisGeliefert++;},
  x=>{x.w5n.mineLohn=0;},
 ];
 for(const fn of attacks){const forged=JSON.parse(original);fn(forged);
  assert.throws(()=>core.loadW5(JSON.stringify(forged)),'invalid wage/ware provenance rejected');}
 assert.equal(core.hash(s),hash);
 assert.equal(core.hash(core.loadW5(original)),hash);
});
