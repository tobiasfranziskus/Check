import assert from 'node:assert/strict';
import W5ac from '../../prototypes/w5ac/rule191-w5-ferry-core.js';
export const scenarios=Object.freeze([
 {id:'baseline',carrierCash:2000,buyerCash:4000,lossAfter:3},
 {id:'earned',carrierCash:1000,buyerCash:6000,lossAfter:7},
 {id:'exact-930',carrierCash:960,buyerCash:6000,lossAfter:6},
 {id:'short-929',carrierCash:959,buyerCash:6000,lossAfter:6},
 {id:'buyer-739',carrierCash:2000,buyerCash:739,lossAfter:3},
 {id:'early-loss',carrierCash:1000,buyerCash:6000,lossAfter:1},
 {id:'no-yard-production',carrierCash:2000,buyerCash:4000,lossAfter:3,build:false},
 {id:'saving-1500',carrierCash:2000,buyerCash:4000,lossAfter:3,reserve:1500},
 {id:'buffer-600',carrierCash:2000,buyerCash:4000,lossAfter:3,reserve:600},
 {id:'demand-one',carrierCash:2000,buyerCash:4000,lossAfter:1,orderLimit:1},
 {id:'idle-saving',carrierCash:2000,buyerCash:4000,lossAfter:null,orderLimit:2},
 {id:'second-loss',carrierCash:2000,buyerCash:4000,lossAfter:3,secondLossAfter:1},
 {id:'no-refinery-material',carrierCash:2000,buyerCash:4000,lossAfter:3,refine:false},
]);
const cash=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
// Independent accounting: derive physical goods, paid work and ownership from
// contract receipts + live inventory; do not use core.audit's output as the oracle.
export function independent(s,r){
 assert.equal(cash(s),33000);assert.equal(s.initialSupply,33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,o.id);
 for(const [ware,l] of Object.entries(s.ledger)){
  const actual=[...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)]
   .reduce((n,x)=>n+(x[ware]??0),0);
  assert.equal(actual,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 const b=s.w5ad,active=s.w3.auftrag;
 const worked=b.freight.reduce((n,x)=>n+(x.end-x.start),0)+(active?.gearbeitet??0);
 assert.equal(s.owners.fonds_transport.cash,worked*r.w3.arbeitJeMinute);
 assert.equal(s.owners.w3_arbeit_treuhand?.cash??0,active?120-active.gearbeitet:0);
 const ferries=s.w5ac.completed.reduce((n,x)=>n+x.ankunft-x.start,0)+(s.w5ac.active?.gearbeitet??0);
 assert.equal(s.owners.w5ac_transfer_pilot.cash,ferries);
 assert.equal(s.owners.w5ac_transfer_reserved.cash,s.w5ac.active?60-s.w5ac.active.gearbeitet:0);
 assert.equal(s.owners.arbeitskraefte_nadir.cash,s.w4.abgeschlossen*20+(s.w4.auftrag?.gearbeitet??0));
 assert.equal(s.owners.arbeiter_werft_nadir.cash,s.w5.fertig*30+(s.w5.auftrag?.gearbeitet??0));
 // Independently reconcile EACH original owner's account. The old W1/W3
 // labor funds receive cash without a stats.konto revenue entry; account for
 // those actual receipts explicitly rather than treating them as missing money.
 for(const o of r.owners){
  const stat=s.stats.konto[o.id]??{erloes:0,kosten:0};let held=0,unbooked=0;
  if(o.id==='transport')held=s.owners.w3_arbeit_treuhand?.cash??0;
  if(o.id==='werft_extern')held=s.owners.w5_arbeit_treuhand?.cash??0;
  if(o.id==='house'||o.id==='npc3')held=Object.entries(s.erzpilotVertraege)
   .filter(([id])=>s.ships[id]?.owner===o.id)
   .reduce((n,[,v])=>n+(s.owners[v.arbeitsKonto]?.cash??0),0);
  if(o.id==='st_aldera')held=Object.values(s.erzpilotVertraege)
   .reduce((n,v)=>n+s.owners[v.konto].cash,0);
  if(o.id==='fonds_aldera')unbooked=s.ledger.erz.mined*2;
  if(o.id==='fonds_transport')unbooked=worked;
  if(o.id==='w5ac_transfer_reserved')unbooked=s.w5ac.allocated-s.w5ac.paid;
  assert.equal(s.owners[o.id].cash+held,o.cash+stat.erloes-stat.kosten+unbooked,
   'independent owner account '+o.id);
 }
 const initial=r.owners.find(x=>x.id==='transport').cash;
 const fee=b.freight.reduce((n,x)=>n+x.fee,0);
 assert.equal(s.owners.transport.cash+(s.owners.w3_arbeit_treuhand?.cash??0)
   +s.owners.w5ac_transfer_reserved.cash,
   initial-b.purchases.reduce((n,x)=>n+x.preis,0)+fee-worked-ferries);
 const initialBuyer=r.owners.find(x=>x.id==='st_nadir').cash;
 assert.equal(s.owners.st_nadir.cash+(s.owners.w3_kauf_treuhand?.cash??0)
   +(s.owners.w4_arbeit_treuhand?.cash??0),
   initialBuyer-(b.freight.length+(active?.phase==='rueck'?1:0))*500
   -fee-s.w4.gezahlt+s.w5.materialUmsatz);
 assert.equal(b.purchases.length,Object.values(s.ships).filter(x=>x.owner==='transport').length+b.losses.length);
 assert.equal(new Set(b.purchases.map(x=>x.id)).size,b.purchases.length);
 for(const x of b.losses)assert.ok(!s.ships[x.id]);
 for(const x of b.assignments){
  assert.equal(b.purchases.filter(p=>p.id===x.id).length,1);
  assert.ok(b.losses.some(l=>l.id===x.lost));
  assert.ok(x.cashBefore>=750+60+x.reserve);
 }
 assert.equal(new Set(b.assignments.map(x=>x.lost)).size,b.assignments.length);
 assert.equal(s.w5.fertig,s.ledger.frachter.produced);
 assert.equal(s.w5.fertig-s.w5.verkauft,s.stations.st_nadir.lager.frachter);
 return true;
}
export function runScenario(config,days=90,{seed=42,check=true}={}){
 const {core:c,rules:r}=W5ac.createResearch({carrierCash:config.carrierCash,buyerCash:config.buyerCash});
 let s=c.createW5State(seed),first=null,second=null;
 const events=[],blocks={},checkpoints=[];let dailyAudits=0,saveChecks=0;
 function verify(){if(check){assert.equal(c.audit(s).ok,true,JSON.stringify(c.audit(s)));independent(s,r);}}
 function roundtrip(){const h=c.hash(s);s=c.loadW5(c.save(s));assert.equal(c.hash(s),h);saveChecks++;}
 function command(type,owner,extra={}){
  const out=c.execute(s,{type,owner,...extra},r);
  if(!out.ok)blocks[type]=out.reason;
  else {verify();if(['shipReplace','researchShipLoss'].includes(type)){
   events.push({tick:s.tick,type,cash:s.owners.transport.cash,losses:s.w5ad.losses.length,
    assignments:s.w5ad.assignments.length,quote:type==='shipReplace'?null:c.replacementQuote(s,extra.schiff,config.reserve??0)});
   roundtrip();}}
  return out;
 }
 assert.equal(command('shipBuy','transport',{klasse:'frachter',station:'st_aldera'}).ok,true);
 const starter=s.w5ad.purchases[0].id;
 // This is a deterministic command driver, not a simulation. Every minute, good,
 // payment, ship, route and production step belongs exclusively to c.advance.
 for(let minute=0;minute<days*1440;minute++){
  if(!s.w3.auftrag&&!s.w5ac.active){
   if(!first&&config.lossAfter!==null&&s.w3.abgeschlossen>=config.lossAfter){
    assert.equal(command('researchShipLoss','transport',{schiff:starter}).ok,true);first=starter;
   }
   const assignment=s.w5ad.assignments[0];
   if(config.secondLossAfter&&assignment&&!second
     &&s.w5ad.freight.filter(f=>f.id===assignment.id).length>=config.secondLossAfter){
    assert.equal(command('researchShipLoss','transport',{schiff:assignment.id}).ok,true);second=assignment.id;
   }
  }
  // The research operator may save or withhold orders. No forced buyer or transfer.
  if(minute%10===0){
   const desiredHulls=Math.max(1,s.w5ad.losses.length);
   if(config.refine!==false&&s.w4.materialErzeugt<5*desiredHulls)
    command('stationRefine','st_nadir',{station:'st_nadir'});
   if(config.build!==false&&s.w5.fertig<desiredHulls)
    command('stationBuildShip','werft_extern',{station:'st_nadir'});
   const pending=s.w5ad.losses.find(l=>!s.w5ad.assignments.some(a=>a.lost===l.id));
   if(pending)command('shipReplace','transport',{verlust:pending.id,reserve:config.reserve??0});
   const sh=Object.values(s.ships).filter(x=>x.owner==='transport'&&x.klasse==='frachter')
    .sort((a,b)=>a.id.localeCompare(b.id))[0];
   if(sh&&s.w3.abgeschlossen<(config.orderLimit??Infinity))
    command('shipFreight','transport',{schiff:sh.id});
  }
  c.advance(s,1,r);
  if(check&&(s.w5ac.active?.gearbeitet===30||s.w3.auftrag?.gearbeitet===30)){
   verify();roundtrip();
  }
  if(s.tick%1440===0){verify();dailyAudits++;roundtrip();
   if([1,90,365].includes(s.tick/1440))checkpoints.push({day:s.tick/1440,
    trips:s.w3.abgeschlossen,lost:s.w5ad.losses.length,replaced:s.w5ad.assignments.length,
    carrierCash:s.owners.transport.cash,buyerCash:s.owners.st_nadir.cash,
    freightWages:s.w3.arbeitsKosten,ferryWages:s.w5ac.paid});
  }
 }
 verify();roundtrip();
 const b=s.w5ad,a=c.audit(s),accounts={};
 for(const o of r.owners){
  const stat=s.stats.konto[o.id]??{};
  accounts[o.id]={initial:o.cash,cash:s.owners[o.id].cash,bookedRevenue:stat.erloes??0,bookedCost:stat.kosten??0};
 }
 const finalGates={
  sourceOre:s.stations.st_aldera.lager.erz,deliveredOre:s.stations.st_nadir.lager.erz,
  material:s.stations.st_nadir.lager.material,freeHulls:s.stations.st_nadir.lager.frachter,
  buyerRequired:740,buyerShortfall:Math.max(0,740-s.owners.st_nadir.cash),
  minimumReplacement:930,capitalShortfall:Math.max(0,930-s.owners.transport.cash),
  requestedReserve:Math.max(120,config.reserve??0),
  demandWithheld:s.w3.abgeschlossen>=(config.orderLimit??Infinity),
  refinery:c.pilotW4Kalkulation(s),shipyard:c.pilotW5Kalkulation(s),
 };
 const ships=Object.values(s.ships).filter(x=>x.owner==='transport');
 return {state:s,core:c,rules:r,result:{id:config.id,days,seed,config,hash:c.hash(s),
  trips:s.w3.abgeschlossen,ore:s.w3.geliefert,freightRevenue:s.w3.frachtUmsatz,
  freightWages:s.w3.arbeitsKosten,ferryWages:s.w5ac.paid,
  hullsProduced:s.w5.fertig,hullsBought:s.w5.verkauft,lost:b.losses.length,
  replaced:b.assignments.length,deployed:a.replacement.deployed,
  idleShips:ships.filter(x=>x.phase==='dock'&&x.auftrag==='halten').length,carrierCash:s.owners.transport.cash,buyerCash:s.owners.st_nadir.cash,
  unmetReplacementCapital:b.losses.filter(l=>!b.assignments.some(x=>x.lost===l.id))
   .map(l=>({id:l.id,quote:c.replacementQuote(s,l.id,config.reserve??0)})),
  events,blocks,finalGates,checkpoints,accounts,dailyAudits,saveChecks,worldCash:cash(s),minted:s.minted}};
}
