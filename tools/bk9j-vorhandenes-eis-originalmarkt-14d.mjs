// B-K9j: Original-Regel14-Preflight für bereits existierende 100-Eis-Fracht.
// Ausschließlich ANALYSE. Keine neue Produktmechanik, kein Teleport oder Mint.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(source+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const ITEMS=13,RAW=26,FACTORY_WAGE=39,HULL_RESERVE=39,SHIP_RESERVE=250;
const seedSamples=[0,1,2,4,7,14];
function count(d,k){d[k]=(d[k]||0)+1;}
function inStock(s,st,w){return s.stations[st].lager[w]||0;}
function amount(o){return Object.values(o).reduce((a,b)=>a+b,0);}
function model(s,ship,miner){
 const src='st_cyris',dst='st_aldera';
 const ice=core.preis(s,src,'eis',rules),
   foodAtSource=core.preis(s,src,'nahrung',rules),
   foodAtDestination=core.preis(s,dst,'nahrung',rules);
 const rawCost=RAW*ice, factoryReceipts=ITEMS*foodAtSource,
   destinationPayment=ITEMS*foodAtDestination;
 const minerSaleFee=core.gebuehr(s,rules,src,rawCost),
   sourceFee=core.gebuehr(s,rules,src,factoryReceipts),
   destinationFee=core.gebuehr(s,rules,dst,destinationPayment);
 const rt=core.route(rules.world,'cyris','aldera');
 const routeWage=Math.ceil(rt.zeit*rules.world.betriebskosten.frachter/rules.economy.stunde);
 const preposition=ship.system==='cyris'?null:core.route(rules.world,ship.system,'cyris');
 const repositionWage=preposition
   ? Math.ceil(preposition.zeit*rules.world.betriebskosten.frachter/rules.economy.stunde):0;
 const sourceGain=factoryReceipts-rawCost-FACTORY_WAGE;
 const freightGain=destinationPayment-factoryReceipts-sourceFee-destinationFee
   -routeWage-repositionWage-HULL_RESERVE;
 const fowner=s.owners[ship.owner].cash;
 const buyFunded=destinationPayment<=s.owners[dst].cash,
   sourceCanAdvance=rawCost+FACTORY_WAGE<=s.owners[src].cash+destinationPayment,
   shipCanAdvance=factoryReceipts+sourceFee+SHIP_RESERVE+HULL_RESERVE+repositionWage<=fowner;
 const room=core.obergrenze(s,rules,src,'eis')-inStock(s,src,'eis');
 const loading=amount(ship.ladung);
 const validEmpty=loading===0 && ship.phase==='dock';
 const physical=room>=RAW && (miner.ladung.eis||0)>=RAW && validEmpty;
 const profitable=sourceGain>=0 && freightGain>0;
 const economicallyPossible=buyFunded&&sourceCanAdvance&&shipCanAdvance&&
   profitable&&physical&&!!rt&&(ship.system==='cyris'||!!preposition);
 const reasons=[];
 if((miner.ladung.eis||0)<RAW)reasons.push('NICHT_GENUG_ALTE_EIS');
 if(room<RAW)reasons.push('ROHLAGER_KEIN_PLATZ_26');
 if(!validEmpty)reasons.push('KEIN_LEERER_GEDOCKTER_FRACHTER');
 if(!buyFunded)reasons.push('ENDKUNDE_ZU_WENIG_CASH');
 if(!sourceCanAdvance)reasons.push('ROHSTOFF_UND_FABRIK_NICHT_GEDECKT');
 if(!shipCanAdvance)reasons.push('FRACHTER_VORFINANZIERUNG_FEHLT');
 if(sourceGain<0)reasons.push('FABRIKMARGE_NEGATIV');
 if(freightGain<=0)reasons.push('FRACHTERMARGE_NEGATIV');
 if(!rt || (ship.system!=='cyris' && !preposition))reasons.push('KEINE_ROUTE');
 return {ice,foodAtSource,foodAtDestination,rawCost,factoryReceipts,
   destinationPayment,minerSaleFee,sourceFee,destinationFee,
   routeMinutes:rt?.zeit??null,routeWage,repositionMinutes:preposition?.zeit||0,
   repositionWage,sourceGain,freightGain,room,
   sourceCash:s.owners[src].cash,destinationCash:s.owners[dst].cash,
   freighterCash:fowner,minerLoad:miner.ladung.eis||0,
   freighterLoad:loading,shipId:ship.id,shipOwner:ship.owner,
   shipSystem:ship.system,shipPhase:ship.phase,
   buyFunded,sourceCanAdvance,shipCanAdvance,profitable,physical,
   economicallyPossible,reasons};
}
function create(seed){
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(player);
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 return s;
}
function run(seed) {
 const s=create(seed),init=core.hash(s),reasons={},byStage={};
 let found=0,withCargo=0,withWarehouse=0,withBuyer=0,
   withFactoryMargin=0,withFreightMargin=0,withAllFinancial=0,
   withEmptyDock=0,withFeasible=0,withSourceDock=0;
 const samples={},positive=[];
 const horizon=14*24;
 for(let hour=0;hour<horizon;hour++){
   const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&
     x.system==='cyris'&&x.ware==='eis');
   assert(miner);
   const candidates=Object.values(s.ships).filter(x=>x.klasse==='frachter'&&
     ['npc1','npc2'].includes(x.owner)&&x.phase==='dock'&&amount(x.ladung)===0);
   const allTrader=Object.values(s.ships).filter(x=>x.klasse==='frachter'&&
     ['npc1','npc2'].includes(x.owner));
   if(candidates.some(x=>x.system==='cyris'))withSourceDock++;
   if(candidates.length)withEmptyDock++;
   const someTrader=candidates[0]||allTrader[0];
   if(someTrader){
     const q=model(s,someTrader,miner);
     if((miner.ladung.eis||0)>=RAW)withCargo++;
     if(q.room>=RAW)withWarehouse++;
     if(q.buyFunded)withBuyer++;
     if(q.sourceGain>=0)withFactoryMargin++;
     if(q.freightGain>0)withFreightMargin++;
     if(q.buyFunded && q.sourceCanAdvance&&q.shipCanAdvance &&q.profitable)withAllFinancial++;
     if(seedSamples.includes(hour/24) && hour%24===0)samples[hour/24]=q;
   }
   // Der Vollkosten-Nachweis muss ALLE real verfügbaren leeren Frachter
   // prüfen, nicht nur den zufällig zuerst ausgewählten.
   for(const sh of candidates){
     found++;
     const q=model(s,sh,miner);
     for(const reason of q.reasons)count(reasons,reason);
     if(q.economicallyPossible){
       withFeasible++;
       if(positive.length<4)positive.push({hour,ship:sh.id,q});
     }
   }
   core.advance(s,60,rules);
   if((hour+1)%24===0){
     assert(core.audit(s).ok);
     const loaded=core.load(core.save(s));
     assert.equal(core.hash(loaded),core.hash(s));
   }
 }
 return {seed,initialHash:init,endHash:core.hash(s),hours:horizon,
   scannedTraders:found,hoursWithEmptyDock:withEmptyDock,
   hoursWithEmptyInSource:withSourceDock,
   withCargo,withWarehouse,withBuyer,withFactoryMargin,
   withFreightMargin,withAllFinancial,withFeasible,
   reasons,samples:seed===7||seed===42?samples:{0:samples[0],4:samples[4],14:samples[14]},
   positive,mintAtEnd:s.minted,originalCargoEnd:Object.values(s.ships).find(x=>
     x.owner==='npc3'&&x.klasse==='miner'&&x.system==='cyris'&&x.ware==='eis')?.ladung.eis||0};
}
const results=SEEDS.map(run);
for(const o of results)console.log('BK9J_SEED '+JSON.stringify(o));
const sum=k=>results.reduce((x,r)=>x+r[k],0);
const all={seeds:SEEDS.length,originalRulesVersion:rules.rulesVersion,
 days:14,observedHours:SEEDS.length*14*24,shipQuotes:sum('scannedTraders'),
 hoursWithEmptyDock:sum('hoursWithEmptyDock'),
 hoursWithEmptyInSource:sum('hoursWithEmptyInSource'),
 withCargo:sum('withCargo'),withWarehouse:sum('withWarehouse'),
 withBuyer:sum('withBuyer'),withFactoryMargin:sum('withFactoryMargin'),
 withFreightMargin:sum('withFreightMargin'),withAllFinancial:sum('withAllFinancial'),
 withFeasible:sum('withFeasible'),reasons:{},positiveWorlds:results.filter(x=>x.withFeasible>0).length,
 seed7:results.find(x=>x.seed===7).samples,
 seed42:results.find(x=>x.seed===42).samples,
 note:'Read-only original-v14 affordability windows: actual buyer/source cash, already mined ice, source/dest spot, paid original freight and replacement; NOT a executed contract.'};
for(const x of results)for(const [k,v] of Object.entries(x.reasons))
 all.reasons[k]=(all.reasons[k]||0)+v;
console.log('BK9J_SUMMARY '+JSON.stringify(all));
assert.equal(results.length,13);
assert(all.withFeasible<=all.shipQuotes);
