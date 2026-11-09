import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const money=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const command=(core,state,rules,type,owner,extra={})=>core.execute(state,{type,owner,...extra},rules);
const ok=(core,state,rules,type,owner,extra={})=>{
 const q=command(core,state,rules,type,owner,extra);
 assert.equal(q.ok,true,type+': '+q.reason);assert.equal(core.audit(state).ok,true,type);
 return q;
};
function independent(core,s,r){
 const a=core.audit(s),b=s.w5ae;
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(a.wageTrade.ok,true);
 assert.equal(a.w3.ok,true);assert.equal(a.w4.ok,true);assert.equal(a.w5.ok,true);
 assert.equal(a.replacement.ok,true);assert.equal(a.w5transfer.ok,true);
 assert.equal(money(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.owners.fonds_transport.cash+b.spent,s.w3.arbeitsKosten,'all paid flight minutes belong to workers, not carrier');
 assert.equal(s.stats.konto.fonds_transport.kosten,b.spent);
 assert.equal(s.stats.konto.st_nadir.erloes,s.w5.materialUmsatz+b.spent);
 assert.equal(s.stations.st_nadir.lager.material+b.inventory.material+s.w5.materialVerbraucht,s.w4.materialErzeugt);
 assert.equal(s.ledger.material.consumed,s.w5.materialVerbraucht,
   'worker durable owned material has NOT vanished into fictitious consumption');
 assert.equal(b.inventory.material,b.purchased);
 assert.equal(b.spent,b.purchased*100,'price derived from same W5 material cost');
 assert.equal(b.deals.reduce((n,x)=>n+x.menge,0),b.purchased);
 assert.equal(b.deals.reduce((n,x)=>n+x.betrag,0),b.spent);
 for(const id of Object.keys(s.ledger)){
  const l=s.ledger[id],physical=Object.values(s.stations).reduce((n,x)=>n+(x.lager[id]||0),0)
    +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[id]||0),0)
    +(b.inventory[id]||0);
  assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    'independent physical goods in stations, ships and worker warehouse: '+id);
 }
 return a;
}
function firstGoods({buyerCash=4000,carrierCash=2000,purchase=false,secondBatch=false}={}){
 const {core,rules}=Factory.createWageResearch({buyerCash,carrierCash});
 const s=core.createW5State(42);
 const buy=(type,owner,props)=>ok(core,s,rules,type,owner,props);
 independent(core,s,rules);
 const noWork=command(core,s,rules,'workerMaterialBuy','fonds_transport',{menge:1});
 assert.equal(noWork.ok,false,'no wallet funds, no free wage purchase');
 buy('shipBuy','transport',{klasse:'frachter',station:'st_aldera'});
 core.advance(s,50,rules);
 const freightId=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter').id;
 buy('shipFreight','transport',{schiff:freightId});
 core.advance(s,60,rules);
 buy('stationRefine','st_nadir',{station:'st_nadir'});
 core.advance(s,20,rules);
 independent(core,s,rules);
 assert.equal(s.tick,130);assert.equal(s.owners.fonds_transport.cash,80);
 assert.equal(command(core,s,rules,'workerMaterialBuy','fonds_transport',{menge:1}).ok,false);
 core.advance(s,20,rules);assert.equal(s.tick,150);
 independent(core,s,rules);
 if(purchase)buy('workerMaterialBuy','fonds_transport',{menge:1});
 if(secondBatch){buy('stationRefine','st_nadir',{station:'st_nadir'});core.advance(s,20,rules);}
 return {core,rules,state:s,freightId};
}
test('W5ae: Rule193 worker trade only opt-in, Rule191/192 remain bit-compatible and saves segregated',()=>{
 assert.equal(Factory.rules.rulesVersion,191);
 assert.equal(Factory.createResearch({carrierCash:2000,buyerCash:4000}).rules.rulesVersion,192);
 assert.equal(Factory.createWageResearch({carrierCash:2000,buyerCash:4000}).rules.rulesVersion,193);
 assert.throws(()=>Factory.createResearch({wageTrade:true}),/mischt/);
 assert.throws(()=>Factory.createWageResearch({wageTrade:true}),/Parameter/);
 assert.throws(()=>Factory.createWageResearch({carrierCash:10000,buyerCash:0}),/ungueltig/);
 const no=Factory.createResearch({carrierCash:2000,buyerCash:4000});
 const yes=Factory.createWageResearch({carrierCash:2000,buyerCash:4000});
 const zero=Factory.createWageResearch({carrierCash:2000,buyerCash:4000}).core.createW5State(42);
 assert.equal(no.core.audit(no.core.createW5State(42)).ok,true);
 assert.equal(yes.core.audit(zero).ok,true);
 assert.throws(()=>yes.core.loadW5(no.core.save(no.core.createW5State(42))));
 assert.throws(()=>no.core.loadW5(yes.core.save(zero)));
 assert.equal(yes.core.pilotWageTradeStand(zero).materialOwned,0);
});
test('W5ae: 100 actually paid W3 wages buy 1 ACTUAL W4 material at a known buyer and seller; not consumed',()=>{
 const {core,rules,state:s}=firstGoods({purchase:true});
 assert.equal(s.tick,150);
 assert.equal(s.w3.arbeitsKosten,100);
 assert.equal(s.owners.fonds_transport.cash,0);
 assert.equal(s.owners.st_nadir.cash,3340);
 assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.w5ae.inventory.material,1);
 assert.equal(s.w5ae.spent,100);
 assert.equal(s.w5ae.deals.length,1);
 assert.deepEqual(s.w5ae.deals[0],{tick:150,owner:'fonds_transport',station:'st_nadir',
   ware:'material',menge:1,preis:100,betrag:100});
 assert.equal(core.audit(s).goods.ok,true);
 assert.equal(core.audit(s).wageTrade.cannotClaimConsumption,true);
 const hash=core.hash(s),saved=core.save(s);
 assert.equal(core.hash(core.loadW5(saved)),hash);
 assert.equal(command(core,s,rules,'workerMaterialBuy','fonds_transport',{menge:1}).ok,false);
 assert.equal(core.hash(s),hash,'no double spending from same 100 paid wages');
 const denied=[
  {type:'workerMaterialBuy',owner:'house',menge:1},
  {type:'workerMaterialBuy',owner:'transport',menge:1},
  {type:'workerMaterialBuy',owner:'fonds_transport',menge:0},
  {type:'workerMaterialBuy',owner:'fonds_transport',menge:-1},
  {type:'workerMaterialBuy',owner:'fonds_transport',menge:1.5},
  {type:'workerMaterialBuy',owner:'fonds_transport',menge:1000},
 ];
 for(const c of denied){assert.equal(core.execute(s,c,rules).ok,false,JSON.stringify(c));assert.equal(core.hash(s),hash);}
 assert.equal(core.save(s),saved);
 console.log('W5AE_FIRST_REAL_WAGE_GOODS '+JSON.stringify({seed:42,tick:s.tick,hash,
  wageEarned:100,goods:1,realMaterialInventory:1,sellerRevenue:100,
  consumerUtilityNotProven:true,worldMoney:33000,mint:0}));
});
test('W5ae: worker-owned stock competes with W5 inputs; second W4 batch is real; no free hull',()=>{
 const {core,rules,state:s}=firstGoods({purchase:true});
 const hash=core.hash(s);
 assert.equal(command(core,s,rules,'stationBuildShip','werft_extern',{station:'st_nadir'}).ok,false,
  'after workers own 1/5 material the werft must not steal worker property');
 assert.equal(core.hash(s),hash);
 ok(core,s,rules,'stationRefine','st_nadir',{station:'st_nadir'});core.advance(s,20,rules);
 independent(core,s,rules);
 assert.equal(s.w4.abgeschlossen,2);
 assert.equal(s.ledger.material.produced,10);
 assert.equal(s.w5ae.inventory.material,1);
 assert.equal(s.stations.st_nadir.lager.material,9);
 ok(core,s,rules,'stationBuildShip','werft_extern',{station:'st_nadir'});
 core.advance(s,30,rules);
 independent(core,s,rules);
 assert.equal(s.w5.fertig,1);assert.equal(s.stations.st_nadir.lager.material,4);
 assert.equal(s.w5ae.inventory.material,1);
 assert.equal(s.ledger.material.consumed,5);
 ok(core,s,rules,'shipBuy','transport',{klasse:'frachter',station:'st_nadir'});
 independent(core,s,rules);
 assert.equal(s.w5.schiffIds.length,1);
 assert.equal(s.w5ae.inventory.material,1);
 assert.equal(s.owners.fonds_transport.cash,20,'further 20 actual wages after private material purchase');
 assert.equal(s.owners.st_nadir.cash,3820,'income from real W5 AND worker material purchase');
});
test('W5ae: 100-ISK worker material revenue enables a second fully paid W3 freight at buyerCash=950, without free ISK',()=>{
 // A deliberately strict counterfactual: station with only 950 starting ISK.
 // No worker purchase: 950 - 740 freight - 20 W4 + 500 W5 sale = 690 (<740).
 const no=firstGoods({buyerCash:950,purchase:false});
 const a=no.state,ca=no.core,ra=no.rules;
 ok(ca,a,ra,'stationBuildShip','werft_extern',{station:'st_nadir'});ca.advance(a,30,ra);
 ok(ca,a,ra,'shipBuy','transport',{klasse:'frachter',station:'st_nadir'});
 independent(ca,a,ra);
 assert.equal(a.tick,180);
 assert.equal(a.owners.st_nadir.cash,690);
 ca.advance(a,50,ra); // Wait until original NPC miners have physically replenished the source.
 assert.equal(a.tick,230);
 assert.ok(a.stations.st_aldera.lager.erz>=50,'real source cargo exists; no false scarcity explanation');
 assert.equal(ca.pilotW3Kalkulation(a,no.freightId).ok,false);
 assert.match(ca.pilotW3Kalkulation(a,no.freightId).grund,/Kaeufer kann Ware/);
 assert.equal(command(ca,a,ra,'shipFreight','transport',{schiff:no.freightId}).ok,false);
 // An optional one-unit real worker purchase requires one ADDITIONAL paid W4
 // batch, but transfers 100 ISK in actual earnings to Nadir as a sale.
 const yes=firstGoods({buyerCash:950,purchase:true,secondBatch:true});
 const b=yes.state,cb=yes.core,rb=yes.rules;
 assert.equal(b.tick,170);assert.equal(b.owners.st_nadir.cash,270);
 ok(cb,b,rb,'stationBuildShip','werft_extern',{station:'st_nadir'});
 cb.advance(b,30,rb);
 ok(cb,b,rb,'shipBuy','transport',{klasse:'frachter',station:'st_nadir'});
 independent(cb,b,rb);
 assert.equal(b.tick,200);
 assert.equal(b.owners.st_nadir.cash,770,'worker 100 - extra W4 wage20 yields net real +80');
 cb.advance(b,30,rb); // Same tick230: source ore genuinely arrives in both counterfactual worlds.
 assert.equal(b.tick,230);
 assert.ok(b.stations.st_aldera.lager.erz>=50);
 assert.equal(cb.pilotW3Kalkulation(b,yes.freightId).ok,true);
 ok(cb,b,rb,'shipFreight','transport',{schiff:yes.freightId});
 assert.equal(b.owners.w3_kauf_treuhand.cash,740);
 assert.equal(b.owners.w3_arbeit_treuhand.cash,120);
 cb.advance(b,120,rb);
 independent(cb,b,rb);
 assert.equal(b.w3.abgeschlossen,2);assert.equal(b.w3.geliefert,100);
 assert.equal(b.owners.st_nadir.cash,30,'nonnegative remaining buyer money');
 assert.equal(b.owners.fonds_transport.cash,140,'second W3 pays another 120 actual labor');
 assert.equal(b.w5ae.inventory.material,1,'worker durable goods remain owned');
 assert.equal(b.minted,0);
 console.log('W5AE_GENUINE_WORKER_PURCHASE_UNLOCKS_FREIGHT '+JSON.stringify({
  without:{cash:690,secondFreight:false},with:{cashBeforeContract:770,contractReserve:740,secondFreight:true},
  extraPaidRefineryWork:20,goodsOwned:1,spentFromEarnedWages:100,worldMoney:33000,
  hash:cb.hash(b)}));
});
test('W5ae: fake salary, materially fake goods, fake cash source, fake receipts or wrong schema cannot load',()=>{
 const {core,rules,state:s}=firstGoods({purchase:true});
 const original=core.save(s),hash=core.hash(s);
 const attacks=[
  x=>{x.rulesVersion=192;},
  x=>{x.rulesVersion=191;},
  x=>{x.schema=99;},
  x=>{x.owners.st_nadir.cash+=100;x.owners.transport.cash-=100;},
  x=>{x.owners.st_nadir.cash+=100;x.owners.fonds_transport.cash-=100;},
  x=>{x.w5ae.inventory.material++;x.stations.st_nadir.lager.material--;},
  x=>{x.w5ae.purchased++;},
  x=>{x.w5ae.spent++;},
  x=>{x.w5ae.deals[0].menge=2;},
  x=>{x.w5ae.deals[0].tick=-1;},
  x=>{x.w5ae.deals[0].station='st_aldera';},
  x=>{x.w5ae.deals[0].owner='house';},
  x=>{x.w5ae.deals[0].betrag=0;},
  x=>{x.w5ae.inventory.material=0;x.stations.st_nadir.lager.material++;},
  x=>{x.ledger.material.consumed++;},
  x=>{x.owners.fonds_transport.cash=100;x.owners.st_nadir.cash-=100;},
  x=>{x.w5ae.deals.push(x.w5ae.deals[0]);},
  x=>{x.w5ae.inventory=null;},
  x=>{x.w5ae=null;},
 ];
 for(const attack of attacks){const fake=JSON.parse(original);attack(fake);
  assert.throws(()=>core.loadW5(JSON.stringify(fake)),'mutated trade state is rejected');}
 assert.equal(core.hash(s),hash,'no failed import mutates original core state');
 assert.equal(core.hash(core.loadW5(original)),hash,'valid salary purchase and property save succeeds');
});
test('W5ae: Rule193 keeps UI Rule191-only, no fabricated water/mining/credits',()=>{
 const src=readFileSync(new URL('../prototypes/w5ac/rule191-w5-ferry-core.js',import.meta.url),'utf8');
 assert.match(src,/W5_RULES.rulesVersion=research.wageTrade===true\?193:192/);
 assert.match(src,/workerMaterialBuy: \['menge'\]/);
 assert.match(src,/const m_core_w5_wage_trade=/);
 assert.match(src,/cannotClaimConsumption:true/);
 assert.match(src,/createWageResearch:options/);
 assert.match(src,/if\(state\.w5ae\)zaehle\(state\.w5ae\.inventory\)/);
 assert.doesNotMatch(src,/W5_RULES\.w5WageTrade=\{[^}]*ware:'wasser'/);
 assert.doesNotMatch(src,/Math\.random\(\)/);
});
