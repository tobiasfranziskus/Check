// B-K9k: Alle in Regel 14 konfigurierten Waren-/Stationsrouten mit echten
// Momentanpreisen, Käuferkassen, Lagergrenzen und tatsächlichen Fluglöhnen.
// Read-only-Analyse; keine zusätzlichen NPC-Schiffe, keine Emission und kein
// Durchsetzen von Paketen. Quotes sind NICHT ausgeführte Fahrten.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const h=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=h.slice(h.indexOf('const m_data_systeme ='),h.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(source+
  ';return {core:m_core_index,rules:m_data_rules.RULES};')();
assert.equal(rules.rulesVersion,14);
assert.equal(rules.schema,8);
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const STATIONS=Object.keys(rules.world.stations).sort();
const WARES=Object.keys(rules.economy.waren).sort();
const SAMPLES=new Set([0,1,2,4,7,14,30,60,90]);
const FREIGHT_PER_MINUTE=rules.world.betriebskosten.frachter/rules.economy.stunde;
const HULL_COST=(()=>{const s=core.createState(42,rules),id=rules.world.werft;
 const p=core.preis(s,id,'frachter');return p+core.gebuehr(s,rules,id,p);})();
const sum=(a)=>a.reduce((n,x)=>n+x,0);
const add=(o,k,v=1)=>o[k]=(o[k]||0)+v;
const ships=s=>Object.values(s.ships).filter(x=>x.klasse==='frachter'&&
  ['npc1','npc2'].includes(x.owner));
const cargo=s=>Object.values(s.ladung).reduce((n,x)=>n+x,0);
const safe=r=>r.weg.every(system=>rules.world.systems[system].sicherheit==='sicher');
const newC=()=>({testedStationWarePairs:0,configuredRouteOffers:0,inventoryPositive:0,
  buyerCapacityPositive:0,spotProfitPositive:0,oneWayWageProfitable:0,
  fullReturnWageProfitable:0,replacement20Profitable:0,replacement40Profitable:0,
  replacement80Profitable:0,oneWaySafeProfitable:0,returnSafeProfitable:0,
  directEmptyFreighter:0,directFreighterFunded:0,globalEmptyShipCanPreposition:0,
  globalPrepositionFunded:0,realDirectFullCostPositive:0,realPrepositionFullCostPositive:0,
  requiredBuyerCashNotPresent:0,sourceUnsellable:0,
  oneWayGrossButNegativeAfterWages:0,profitableButNoDirectShip:0,
  totalTopProfit:0,positiveUniqueRoutes:new Set(),safePositiveUniqueRoutes:new Set()});
function quote(s,from,to,ware,shipSet){
 const src=rules.world.stations[from],dst=rules.world.stations[to];
 if(!(ware in src.ziel)||!(ware in dst.ziel)||from===to)return null;
 const rt=core.route(rules.world,src.system,dst.system);
 if(!rt||rt.zeit<=0)return null;
 const fromPrice=core.preis(s,from,ware),toPrice=core.preis(s,to,ware);
 const sellable=core.verkaufbar(s,from,ware);
 const toAffordable=core.aufnehmbar(s,to,ware);
 const capacity=Math.min(rules.economy.cargo,sellable,toAffordable);
 const expectedDemand=Math.max(0,core.obergrenze(s,to,ware)-
   (s.stations[to].lager[ware]||0));
 if(capacity<=0)return {from,to,ware,time:rt.zeit,capacity:0,
   sellable,toAffordable,expectedDemand,fromPrice,toPrice,sourceCash:s.owners[from].cash,
   targetCash:s.owners[to].cash,reason:sellable<=0?'source':toAffordable<=0?'buyer':'capacity'};
 // With snapshot spot prices, highest quantity maximizes a positive spread.
 // Fees use the original Core; all amounts are integer ISK.
 const amount=capacity,sourceValue=amount*fromPrice,targetValue=amount*toPrice;
 const entryFee=core.gebuehr(s,rules,from,sourceValue);
 const exitFee=core.gebuehr(s,rules,to,targetValue);
 const gross=targetValue-sourceValue-entryFee-exitFee;
 // Conservative reserve: ceil hourly total wage on each leg, not the exact
 // original hourly-batch tick rounding. This is a quoted upper bound.
 const wage=Math.ceil(rt.zeit*FREIGHT_PER_MINUTE);
 const marginOneWay=gross-wage,marginReturn=gross-2*wage;
 const replacement20=Math.ceil(HULL_COST/20);
 const replacement40=Math.ceil(HULL_COST/40);
 const replacement80=Math.ceil(HULL_COST/80);
 const dockShips=shipSet.filter(x=>x.system===src.system&&x.phase==='dock'&&
   cargo(x)===0&&x.ankunft<=s.tick);
 const directFunded=dockShips.filter(x=>s.owners[x.owner].cash>=
   sourceValue+entryFee+2*wage+replacement20);
 const allEmpty=shipSet.filter(x=>x.phase==='dock'&&cargo(x)===0&&x.ankunft<=s.tick);
 const prepositioned=allEmpty.filter(x=>x.system!==src.system)
   .map(x=>({ship:x,path:core.route(rules.world,x.system,src.system)}))
   .filter(z=>z.path&&z.path.zeit>0)
   .map(z=>({...z,wage:Math.ceil(z.path.zeit*FREIGHT_PER_MINUTE)}));
 const prepositionFunded=prepositioned.filter(z=>s.owners[z.ship.owner].cash>=
   sourceValue+entryFee+z.wage+2*wage+replacement20);
 const prepositionFullProfit=prepositionFunded.filter(z=>
   marginReturn-replacement20-z.wage>0);
 return {from,to,ware,amount,fromPrice,toPrice,sourceValue,targetValue,
   targetCash:s.owners[to].cash,sourceCash:s.owners[from].cash,
   inventory:s.stations[from].lager[ware]||0,
   targetStock:s.stations[to].lager[ware]||0,sellable,toAffordable,
   entryFee,exitFee,rt:rt.weg,time:rt.zeit,isSafe:safe(rt),
   wage,gross,marginOneWay,marginReturn,
   margin20:marginReturn-replacement20,
   margin40:marginReturn-replacement40,
   margin80:marginReturn-replacement80,
   directShips:dockShips.map(x=>x.id),
   directFunded:directFunded.map(x=>x.id),
   globalEmpty:allEmpty.length,
   canPreposition:prepositioned.length,
   prepositionFunded:prepositionFunded.length,
   prepositionFullProfit:prepositionFullProfit.map(z=>({
     id:z.ship.id,wage:z.wage,margin:marginReturn-replacement20-z.wage
   })),
   note:'Optimistic original-spot snapshot, assumes both legs could later trade at these prices; not an execution or accepted recurring order'};
}
function scan(s,day,seed){
 const c=newC(),list=[],shipSet=ships(s);
 for(const from of STATIONS)for(const to of STATIONS){
  if(from===to)continue;
  for(const ware of WARES){
   if(!(ware in rules.world.stations[from].ziel)||
      !(ware in rules.world.stations[to].ziel))continue;
   c.testedStationWarePairs++;
   const q=quote(s,from,to,ware,shipSet);if(!q)continue;
   c.configuredRouteOffers++;
   if(q.sellable>0)c.inventoryPositive++;
   else c.sourceUnsellable++;
   if(q.toAffordable>0)c.buyerCapacityPositive++;
   else c.requiredBuyerCashNotPresent++;
   if(q.capacity===0)continue;
   if(q.gross>0)c.spotProfitPositive++;
   if(q.marginOneWay>0)c.oneWayWageProfitable++;
   if(q.marginReturn>0)c.fullReturnWageProfitable++;
   if(q.margin20>0)c.replacement20Profitable++;
   if(q.margin40>0)c.replacement40Profitable++;
   if(q.margin80>0)c.replacement80Profitable++;
   if(q.isSafe&&q.marginOneWay>0)c.oneWaySafeProfitable++;
   if(q.isSafe&&q.marginReturn>0)c.returnSafeProfitable++;
   if(q.directShips.length)c.directEmptyFreighter++;
   if(q.directFunded.length)c.directFreighterFunded++;
   if(q.canPreposition)c.globalEmptyShipCanPreposition++;
   if(q.prepositionFunded)c.globalPrepositionFunded++;
   if(q.margin20>0 && q.directFunded.length)c.realDirectFullCostPositive++;
   if(q.prepositionFullProfit.length)c.realPrepositionFullCostPositive++;
   if(q.gross>0&&q.marginOneWay<=0)c.oneWayGrossButNegativeAfterWages++;
   if(q.margin20>0&&!q.directFunded.length)c.profitableButNoDirectShip++;
   if(q.margin20>0){
     c.positiveUniqueRoutes.add(from+'/'+to+'/'+ware);
     if(q.isSafe)c.safePositiveUniqueRoutes.add(from+'/'+to+'/'+ware);
   }
   if(q.gross>0)list.push(q);
  }
 }
 const top=list.sort((a,b)=>b.margin20-a.margin20||
   a.from.localeCompare(b.from)||a.to.localeCompare(b.to)||a.ware.localeCompare(b.ware)).slice(0,8);
 const out={seed,day,totalTradeHull:shipSet.length,shipAvailable:shipSet.filter(x=>
   x.phase==='dock'&&cargo(x)===0&&x.ankunft<=s.tick).length,
   ownerCash:{npc1:s.owners.npc1.cash,npc2:s.owners.npc2.cash,
     stations:STATIONS.map(id=>({id,cash:s.owners[id].cash}))},
   counters:Object.fromEntries(Object.entries(c).filter(([k])=>!['positiveUniqueRoutes','safePositiveUniqueRoutes'].includes(k))),
   positiveRoutes:[...c.positiveUniqueRoutes],
   safePositiveRoutes:[...c.safePositiveUniqueRoutes],
   top};
 console.log('BK9K_SNAPSHOT '+JSON.stringify(out));
 return out;
}
function simulate(seed){
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(player);
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 const initialHash=core.hash(s),sample=[],audits=[];
 sample.push(scan(s,0,seed));
 for(let hour=1;hour<=90*24;hour++){
  core.advance(s,60,rules);
  if(hour%24===0) {
    const day=hour/24;
    assert(core.audit(s).ok);
    audits.push(day);
    if(SAMPLES.has(day)){
     const reloaded=core.load(core.save(s));
     assert.equal(core.hash(s),core.hash(reloaded),'save/load '+seed+' day '+day);
     sample.push(scan(s,day,seed));
    }
  }
 }
 assert.equal(audits.length,90);
 return {seed,initialHash,endHash:core.hash(s),sample,
   finalTraderShips:ships(s).length,player:s.owners.house.cash,
   stationLiquidity:STATIONS.map(id=>s.owners[id].cash)};
}
const samples=SEEDS.map(simulate);
const all=samples.flatMap(x=>x.sample),totals={};
for(const x of all)for(const [k,v] of Object.entries(x.counters))
 totals[k]=(totals[k]||0)+v;
const routes=new Map();
for(const x of all)for(const q of x.top){
 const key=q.from+'/'+q.to+'/'+q.ware;
 const old=routes.get(key);
 if(!old||q.margin20>old.margin20)routes.set(key,{...q,seed:x.seed,day:x.day});
}
const candidates=[...routes.values()].filter(q=>q.margin20>0).sort((a,b)=>b.margin20-a.margin20);
const summary={seeds:SEEDS.length,worlds:SEEDS.length,days:90,
 sampleDays:[...SAMPLES],snapshots:all.length,
 originalDailyAudits:SEEDS.length*90,originalSaveLoad:all.length-SEEDS.length,
 replacementPriceAtStart:HULL_COST,
 sensitivityReplacementPerTrip:{twenty:Math.ceil(HULL_COST/20),
   forty:Math.ceil(HULL_COST/40),eighty:Math.ceil(HULL_COST/80)},
 totals,
 profitableDistinctTopRoutes:candidates.length,
 topProfitable:candidates.slice(0,18).map(q=>({
  from:q.from,to:q.to,ware:q.ware,seed:q.seed,day:q.day,amount:q.amount,
  sourcePrice:q.fromPrice,destinationPrice:q.toPrice,
  gross:q.gross,wageOneWay:q.wage,marginOneWay:q.marginOneWay,
  fullRoundTripMargin:q.marginReturn,withReplacement20:q.margin20,
  hullFundedAtSource:q.directFunded.length,
  prepositionFullProfit:q.prepositionFullProfit
 })),
 topOriginCount:all.filter(x=>x.counters.realDirectFullCostPositive>0).length,
 scenarios:samples.map(x=>({seed:x.seed,finalFreighters:x.finalTraderShips,
  player:x.player,d0:x.sample[0].counters,d4:x.sample.find(z=>z.day===4)?.counters,
  d14:x.sample.find(z=>z.day===14)?.counters,
  d90:x.sample.at(-1).counters})),
 reminder:'No executed NPC job. Original Core uses spot-gross route score; prices and stock can change during transport. Replacement 20/40/80 trips is a sensitivity assumption, not an approved game rule.'};
console.log('BK9K_13X90_SUMMARY '+JSON.stringify(summary));
assert.equal(samples.length,13);
assert(all.every(x=>x.counters.realDirectFullCostPositive<=x.counters.directFreighterFunded));
