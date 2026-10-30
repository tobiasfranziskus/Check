// In-memory Gegenversuch: v11-Basis / Lieferprämien / Lieferprämien + echte Modulproduktion.
// Gleicher m_core_* Simulationskern, unveränderte index.html, 13 Seeds × 90 Tage.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {initModules,MODULE_CATALOG,moduleId,priceModule,canCraft,
 craftModule,buyModule,auditModules} from './module-economy-model.mjs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(fixture.results.map(x=>x.seed),seeds);
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
assert.equal(source.split(tradeAnchor).length,2);
const observed=source.replace(tradeAnchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,ware,menge,kauf,p,fee);\n  return true;");
const createEngine=new Function('watchTrade',observed+';return {c:m_core_index,r:m_data_rules.RULES};');
const sum=ns=>ns.reduce((a,b)=>a+b,0);
const median=ns=>[...ns].sort((a,b)=>a-b)[Math.floor(ns.length/2)];
const profiles=[
 {id:'baseline',pay:false,modules:false},
 {id:'wages',pay:true,modules:false},
 {id:'wages_modules',pay:true,modules:true},
];
const active=['npc1','npc2','npc3'];
const originalStations=['st_aldera','st_cyris','st_dravos','st_meridian','st_orion','st_veldra'];
const shortage=(s,ids)=>sum(ids.flatMap(id=>Object.values(s.stats.mangel[id]||{})));
function simulate(seed,profile){
 let state=null,sim=null,rule=null;
 const d={traderWages:0,minerWages:0,wageEvents:0,lostBoughtFreight:0,
  skippedUnmatchedSale:0,pilotContracts:0,rehired:0};
 function setupPilot(s,ship){
  const lab=s.moduleLab;
  if(lab.crew[ship.id])return s.owners[lab.crew[ship.id]];
  let unused=lab.idle[ship.owner]||[];
  let id=unused.shift();
  lab.idle[ship.owner]=unused;
  if(id){d.rehired++;}
  else{
   id='pilot_'+ship.id;
   assert(!s.owners[id],'duplicate pilot');
   s.owners[id]={id,kind:'pilot',employer:ship.owner,cash:0};
   s.stats.konto[id]={erloes:0,kosten:0};
   s.stats.abgabe[id]=0;
   d.pilotContracts++;
  }
  lab.crew[ship.id]=id;
  return s.owners[id];
 }
 function pay(s,ship,amount,role){
  if(amount<=0)return;
  const pilot=setupPilot(s,ship),owner=s.owners[ship.owner];
  assert(amount<=owner.cash,'wage exceeds owner liquidity');
  owner.cash-=amount;
  pilot.cash+=amount;
  s.stats.konto[ship.owner].kosten+=amount;
  s.stats.konto[pilot.id].erloes+=amount;
  d.wageEvents++;
  if(role==='trader')d.traderWages+=amount;
  else d.minerWages+=amount;
 }
 function trade(s,ship,ware,n,buy,p,fee){
  if(!profile.pay||!active.includes(ship.owner)||!['miner','frachter'].includes(ship.klasse))return;
  const lab=s.moduleLab;
  if(buy){
   if(ship.klasse==='frachter'&&ware===ship.klasse)return; // Direkt aktivierter Ersatzfrachter
   (lab.lots[ship.id] ||= []).push({ware,units:n,cost:n*p+fee});
   return;
  }
  const net=n*p-fee;
  if(ship.klasse==='miner'){
   pay(s,ship,Math.floor(Math.max(net,0)*0.2),'miner');
   return;
  }
  const lots=lab.lots[ship.id]||[];
  let remaining=n,cost=0;
  for(const lot of lots){
   if(lot.ware!==ware||remaining<=0||lot.units<=0)continue;
   const count=Math.min(remaining,lot.units);
   const allocated=count===lot.units?lot.cost:Math.floor(lot.cost*count/lot.units);
   lot.units-=count;lot.cost-=allocated;remaining-=count;cost+=allocated;
  }
  lab.lots[ship.id]=lots.filter(x=>x.units>0);
  if(remaining>0){d.skippedUnmatchedSale+=remaining;return;}
  pay(s,ship,Math.floor(Math.max(0,net-cost)*0.1),'trader');
 }
 const engine=createEngine(trade);sim=engine.c;rule=engine.r;
 state=sim.createState(seed,rule);
 if(profile.pay)initModules(state);
 function cleanup(){
  if(!profile.pay)return;
  const lab=state.moduleLab;
  for(const [shipId,pid] of Object.entries(lab.crew)){
   if(state.ships[shipId])continue;
   const employer=state.owners[pid]?.employer;
   assert(employer&&active.includes(employer),'Pilot ohne gültigen Arbeitgeber');
   (lab.idle[employer] ||= []).push(pid);
   delete lab.crew[shipId];
  }
  for(const [shipId,lots] of Object.entries(lab.lots))if(!state.ships[shipId]){
   d.lostBoughtFreight+=sum(lots.map(x=>x.cost));
   delete lab.lots[shipId];
  }
 }
 function buyAtStations(){
  if(!profile.modules)return;
  const lab=state.moduleLab;
  const crafted=new Set();
  for(const shipId of Object.keys(lab.crew).sort()){
   const ship=state.ships[shipId];
   if(!ship||ship.phase!=='dock')continue;
   const pilotId=lab.crew[shipId],pilot=state.owners[pilotId];
   const kind=ship.klasse==='miner'?'miner':ship.klasse==='frachter'?'cargo':null;
   if(!kind)continue;
   const level=pilot.modules?.[kind]||0;
   if(level>=3)continue;
   const mod=moduleId(kind,level+1);
   const station=rule.world.systems[ship.system]?.station;
   if(!station)continue;
   const price=priceModule(state,rule,sim,station,mod);
   if(!price||pilot.cash<price)continue;
   if(!(lab.stock[station]?.[mod]>0) && !crafted.has(station) && canCraft(state,rule,station,mod)){
    assert(craftModule(state,rule,station,mod));
    crafted.add(station);
   }
   // Nach der Fertigung wird der Preis aus den real geänderten Beständen
   // neu berechnet. Fehlende Liquidität ist ein regulärer, nichtfataler Fall.
   if(lab.stock[station]?.[mod]>0 &&
      pilot.cash>=priceModule(state,rule,sim,station,mod)){
    assert(buyModule(state,rule,sim,station,pilotId,mod));
   }
  }
 }
 const points=[];
 for(let tick=1;tick<=129600;tick++){
  sim.step(state,rule);
  if(tick%60===0){
   cleanup();
   if(tick%180===0)buyAtStations();
   assert(sim.audit(state).ok,'Geld-/Warenaudit '+profile.id+'/'+seed+'/'+tick);
   if(profile.pay)assert(auditModules(state).ok,'Modul-Audit '+profile.id+'/'+seed+'/'+tick);
  }
  if(tick===4320||tick===43200||tick===129600)points.push({tick,hash:sim.hash(state)});
 }
 if(profile.id==='baseline')assert.deepEqual(points,fixture.results.find(x=>x.seed===seed).points,'v11-Festhash '+seed);
 assert.equal(sim.hash(sim.load(sim.save(state))),sim.hash(state),'Save-/Load-Hash '+profile.id+'/'+seed);
 if(profile.pay)assert(auditModules(sim.load(sim.save(state))).ok,'Modul-Save-/Load-Audit');
 let pilotCash=0,stationsCash=0,fundsCash=0,corpCash=0,modulesOwned=0;
 for(const owner of Object.values(state.owners)){
  if(owner.kind==='pilot'){
   pilotCash+=owner.cash;
   modulesOwned+=sum(Object.values(owner.ownedModules||{}));
  }else if(owner.kind==='station')stationsCash+=owner.cash;
  else if(owner.kind==='fund')fundsCash+=owner.cash;
  else corpCash+=owner.cash;
 }
 const lab=state.moduleLab;
 const output={seed,scenario:profile.id,commonShortage:shortage(state,originalStations),
  totalShortage:shortage(state,Object.keys(state.stations)),
  pilotCash,stationsCash,fundsCash,corpCash,
  wages:d.traderWages+d.minerWages,wagesTrade:d.traderWages,wagesMiner:d.minerWages,
  modulesProduced:lab?sum(Object.values(lab.produced)):0,
  modulesBought:lab?.transactions||0,moduleSpending:lab?.paidISK||0,
  moduleWareConsumed:lab?sum(Object.values(lab.consumed)):0,
  modulesOwned,pilotContracts:d.pilotContracts,
  npc1Levy:state.stats.abgabe.npc1||0,
  cashNpc1:state.owners.npc1.cash,cashNpc3:state.owners.npc3.cash,
  lostBoughtFreight:d.lostBoughtFreight,skippedUnmatchedSale:d.skippedUnmatchedSale};
 console.log('MODULE_SEED '+JSON.stringify(output));
 return output;
}
const metrics=['commonShortage','totalShortage','pilotCash','stationsCash','fundsCash','corpCash',
 'wages','wagesTrade','wagesMiner','modulesProduced','modulesBought','moduleSpending',
 'moduleWareConsumed','modulesOwned','pilotContracts','npc1Levy','cashNpc1','cashNpc3'];
const summary={source:'v11-world',seeds:seeds.length,days:90,scenarios:{}};
for(const profile of profiles){
 const rows=seeds.map(seed=>simulate(seed,profile));
 const m={};
 for(const key of metrics)m[key]={sum:sum(rows.map(row=>row[key])),median:median(rows.map(row=>row[key]))};
 summary.scenarios[profile.id]={metrics:m};
}
console.log('MODULE_SUMMARY '+JSON.stringify(summary));
