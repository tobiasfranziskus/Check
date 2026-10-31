// B8i [ANALYSE] Original NPC-Handelsflotte - Routenumsatz, reale Kosten, Käuferliquidität.
// No product edits; read-only hooks in original JS core (no changed rules).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2),opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(seed|scenario|days|out)=/.test(x)));
const seed=Number(opt('seed','42')),scenario=opt('scenario','passive'),days=Number(opt('days','90'));
assert(Number.isSafeInteger(seed)&&[42,7].includes(seed));assert(['passive','active'].includes(scenario));
assert.equal(days,90);
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const hash256=x=>createHash('sha256').update(x).digest('hex');
assert.equal(hash256(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const replacements=[
 ["  buche(state, schiff.owner, 'kosten', fee);","  buche(state, schiff.owner, 'kosten', fee);\n  observer.trade(state,schiff,station,ware,menge,kauf,wert,fee);"],
 ["    if (s.phase === 'reise') { s.arbeit += 1; continue; }",
  "    if (s.phase === 'reise') { s.arbeit += 1; observer.minute(state,s); continue; }"],
 ["    const n = Math.min(besitzer.cash, kosten);",
  "    const n = Math.min(besitzer.cash, kosten);\n    observer.operating(state,s,arbeit,kosten,n);"],
 ["    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n    entladen(state, rules, s);",
  "    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n    const probe = observer.beforeArrival(state,rules,s,m_core_preis.preis,m_core_handel.obergrenze);\n    entladen(state, rules, s);\n    observer.afterArrival(state,s,probe);"]
];
let instrumentation=source;
for(const [a,b] of replacements){assert.equal(instrumentation.split(a).length,2,'unique hook '+a);instrumentation=instrumentation.replace(a,b);}
const engine=obs=>new Function('observer',instrumentation+
 ';return {core:m_core_index,rules:m_data_rules.RULES};')(obs);

const totals=arr=>arr.reduce((a,v)=>a+v,0);
function allocate(total,weights){
  assert(total>=0&&Number.isSafeInteger(total));const n=totals(weights.map(x=>x.weight));
  if(!n)return [];
  let portions=weights.map(x=>({id:x.id,n:Math.floor(total*x.weight/n),
    frac:(total*x.weight)%n}));
  let left=total-totals(portions.map(x=>x.n));
  portions.sort((a,b)=>b.frac-a.frac||a.id.localeCompare(b.id));
  for(let i=0;i<left;i++)portions[i].n++;
  assert.equal(totals(portions.map(x=>x.n)),total);
  return portions;
}
const tradeOwner=new Set(['npc1','npc2']);
class Observer {
 constructor(){
   this.lots=new Map();this.byShip=new Map();this.next=0;this.pending=new Map();
   this.travel={paid:0,due:0,minutes:0,emptyPaid:0,emptyMinutes:0,unallocatedPaid:0,unpaid:0};
   this.arrivals=[];this.tradeCount=0;this.salesCount=0;this.blockedCounts={};
   this.shipDeaths=[];this.routeFlights={};
 }
 idsFor(ship){return this.byShip.get(ship)||[];}
 isTrader(s){return s.klasse==='frachter'&&tradeOwner.has(s.owner);}
 trade(state,ship,station,ware,qty,buy,wert,fee){
   if(!this.isTrader(ship))return;
   this.tradeCount++;
   assert.equal(wert%qty,0);
   if(buy){
     const lot={id:'lot'+(++this.next),owner:ship.owner,ship:ship.id,
       ware,source:station,boughtAt:state.tick,qty,remaining:qty,
       spent:wert+fee,feesBuy:fee, revenue:0,saleFees:0,
       sold:0,sales:[],cargoWork:0,firstDestination:null,sourceCash:state.owners[ship.owner].cash};
     this.lots.set(lot.id,lot);
     this.byShip.set(ship.id,[...this.idsFor(ship.id),lot.id]);
   }else{
     let left=qty,weights=this.idsFor(ship.id).map(id=>this.lots.get(id))
       .filter(l=>l&&l.ware===ware&&l.remaining>0);
     assert(weights.length>0,'NPC trader sale must originate from recorded real purchase '+ship.id+' '+ware);
     for(const lot of weights) {
       const amount=Math.min(left,lot.remaining);
       if(!amount)continue;
       const saleVal=Math.floor(wert*amount/qty),saleFee=Math.floor(fee*amount/qty);
       lot.remaining-=amount;lot.sold+=amount;
       lot.revenue+=saleVal;lot.saleFees+=saleFee;
       lot.sales.push({dest:station,qty:amount,value:saleVal,fee:saleFee,tick:state.tick});
       left-=amount;
     }
     assert.equal(left,0,'full real sale attribution');
     // Correct remainder if split across distinct lots (rare): preserve all original cash.
     const allocations=weights.filter(l=>l.sales.at(-1)?.tick===state.tick);
     const paidRevenue=totals(allocations.map(l=>l.sales.at(-1).value));
     const paidFees=totals(allocations.map(l=>l.sales.at(-1).fee));
     if(allocations.length){const last=allocations.at(-1);last.sales.at(-1).value+=wert-paidRevenue;last.sales.at(-1).fee+=fee-paidFees;
       last.revenue+=wert-paidRevenue;last.saleFees+=fee-paidFees;}
     this.byShip.set(ship.id,this.idsFor(ship.id).filter(id=>this.lots.get(id)?.remaining>0));
     this.salesCount++;
   }
 }
 minute(state,ship){
   if(!this.isTrader(ship))return;
   const alive=this.idsFor(ship.id).map(id=>this.lots.get(id)).filter(l=>l&&l.remaining>0);
   const key=alive.length?'cargo':'empty';
   const arr=this.pending.get(ship.id)||[];
   arr.push({kind:key,ids:alive.map(x=>x.id),weights:alive.map(x=>x.remaining),
     from:ship.system,to:ship.ziel});
   this.pending.set(ship.id,arr);
   this.travel.minutes++;
   if(key==='empty')this.travel.emptyMinutes++;
 }
 operating(state,ship,arbeit,due,paid){
   if(!this.isTrader(ship)||!arbeit)return;
   const list=this.pending.get(ship.id)||[];
   assert.equal(list.length,arbeit,'real flight minutes reconcile '+ship.id+' tick '+state.tick);
   this.pending.delete(ship.id);
   this.travel.paid+=paid;this.travel.due+=due;this.travel.unpaid+=due-paid;
   if(!list.length)return;
   const countCargo=list.filter(x=>x.kind==='cargo').length, countEmpty=list.length-countCargo;
   const segments=allocate(paid,[{id:'cargo',weight:countCargo},{id:'empty',weight:countEmpty}].filter(x=>x.weight));
   const cargoExpense=segments.find(x=>x.id==='cargo')?.n||0;
   const emptyExpense=segments.find(x=>x.id==='empty')?.n||0;
   this.travel.emptyPaid+=emptyExpense;
   if(cargoExpense>0){
     const weights={};
     for(const minute of list.filter(x=>x.kind==='cargo')){
       const all=totals(minute.weights);
       for(let i=0;i<minute.ids.length;i++)weights[minute.ids[i]]=(weights[minute.ids[i]]||0)+minute.weights[i]/all;
     }
     // Divide actual paid hour among original purchase lots, independent of date of sale.
     const distribution=allocate(cargoExpense,Object.entries(weights).map(([id,weight])=>({id,weight:Math.round(weight*1000000)})));
     for(const p of distribution)this.lots.get(p.id).cargoWork+=p.n;
   }
 }
 beforeArrival(state,rules,ship,priceFn,maxFn){
   if(!this.isTrader(ship))return null;
   const ids=this.idsFor(ship.id);
   const cargo=Object.entries(ship.ladung).filter(([,q])=>q>0);
   if(!cargo.length)return null;
   const station=rules.world.systems[ship.system].station;
   const goods=cargo.map(([ware,qty])=>{
     const p=priceFn(state,station,ware,rules);
     const capacity=Math.max(0,maxFn(state,rules,station,ware)
       -(state.stations[station].lager[ware]||0));
     const cash=state.owners[station].cash;
     return {ware,qty,price:p,stationCash:cash,storageCapacity:capacity,
       seller:ship.owner,ship:ship.id,station,lotIds:ids.slice()};
   });
   return {tick:state.tick,goods};
 }
 afterArrival(state,ship,probe){
   if(!probe)return;
   for(const g of probe.goods){
     const rem=ship.ladung[g.ware]||0;
     const sold=g.qty-rem;
     assert(sold>=0&&sold<=g.qty);
     const cashCap=g.price>0?Math.floor(g.stationCash/g.price):0;
     const failure=sold===g.qty?'filled':
       g.storageCapacity===0?'storage':
       cashCap===0?'cash':
       cashCap<g.qty&&g.storageCapacity<g.qty?'mixed':
       cashCap<g.qty?'cash':
       g.storageCapacity<g.qty?'storage':'other';
     this.arrivals.push({...g,tick:probe.tick,sold,unsold:rem,cashCap,failure});
     this.blockedCounts[failure]=(this.blockedCounts[failure]||0)+1;
   }
 }
 result(state){
   const shipRemaining=new Set(Object.keys(state.ships));
   const lots=[...this.lots.values()].map(l=>({...l,
      completed:l.remaining===0,netLoaded:l.revenue-l.saleFees-l.spent-l.cargoWork,
      netMerchandise:l.revenue-l.saleFees-l.spent,
      lost:!shipRemaining.has(l.ship)&&l.remaining>0}));
   const groups=new Map(),roundTrips=new Map();
   for(const l of lots){
     for(const sale of l.sales){
       const key=l.source+'→'+sale.dest+' / '+l.ware;
       const g=groups.get(key)||{route:key,source:l.source,dest:sale.dest,ware:l.ware,
         lots:0,completedLots:0,unitsBought:0,unitsSold:0,spent:0,
         saleGross:0,saleFees:0,loadedCost:0,completedNetLoaded:0,lateOrLost:0};
       groups.set(key,g);
     }
     const dests=[...new Set(l.sales.map(x=>x.dest))];
     if(dests.length===1){
       const g=groups.get(l.source+'→'+dests[0]+' / '+l.ware);
       g.lots++;g.unitsBought+=l.qty;g.unitsSold+=l.sold;g.spent+=l.spent;
       g.saleGross+=l.revenue;g.saleFees+=l.saleFees;g.loadedCost+=l.cargoWork;
       if(l.completed){g.completedLots++;g.completedNetLoaded+=l.netLoaded;}
       else g.lateOrLost++;
     }
   }
   const groupsArr=[...groups.values()].sort((a,b)=>b.unitsSold-a.unitsSold||a.route.localeCompare(b.route));
   const arrivals=this.arrivals;
   const maxExamples=groupsArr.slice(0,35);
   const failed=arrivals.filter(x=>x.sold<x.qty);
   const stationFailure=Object.entries(Object.groupBy(failed,x=>x.station)).map(([station,rows])=>({
     station,count:rows.length,cash:rows.filter(r=>r.failure==='cash').length,
     storage:rows.filter(r=>r.failure==='storage').length,
     mixed:rows.filter(r=>r.failure==='mixed').length,
     other:rows.filter(r=>r.failure==='other').length,
     unpaidUnits:totals(rows.map(r=>r.unsold))})).sort((a,b)=>b.count-a.count);
   const count=v=>v.length;
   return {lotCount:count(lots),completedLots:count(lots.filter(l=>l.completed)),
     unsoldLots:count(lots.filter(l=>l.remaining>0)),lostLots:count(lots.filter(l=>l.lost)),
     trades:this.tradeCount,sales:this.salesCount,travel:this.travel,
     physicalSales:totals(lots.map(l=>l.sold)),
     buyerArrivals:arrivals.length,arrivalCashBlocked:count(failed.filter(a=>a.failure==='cash')),
     arrivalStorageBlocked:count(failed.filter(a=>a.failure==='storage')),
     arrivalMixedBlocked:count(failed.filter(a=>a.failure==='mixed')),
     arrivalOtherBlocked:count(failed.filter(a=>a.failure==='other')),
     arrivalFull:count(arrivals.filter(a=>a.failure==='filled')),
     blockedUnits:totals(failed.map(x=>x.unsold)),
     cashInsufficiencyArrivals:count(arrivals.filter(a=>a.price>0&&a.stationCash<a.qty*a.price)),
     tradeRoutes:groupsArr.length,
     topRoutes:maxExamples,
     stationFailure,allRoutes:groupsArr,
     soldAndCompletedGross:totals(lots.filter(l=>l.completed).map(l=>l.revenue)),
     completedLotsCashNetLoaded:totals(lots.filter(l=>l.completed).map(l=>l.netLoaded)),
     arrivalsSamples:arrivals.filter(x=>x.failure!=='filled').slice(0,24),
     otherDestLots:lots.filter(l=>new Set(l.sales.map(x=>x.dest)).size>1).length,
     openCargo:lots.filter(x=>!x.completed).map(x=>({id:x.id,src:x.source,owner:x.owner,
       ware:x.ware,qty:x.qty,remaining:x.remaining,spent:x.spent,
       loadedCost:x.cargoWork,ship:x.ship})).slice(0,30),
     money:{minted:state.minted,burned:state.burned,house:state.owners.house.cash}};
 }
}
function independentAudit(state){
 let cash=0;
 for(const o of Object.values(state.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0);cash+=o.cash;}
 assert.equal(cash,state.initialSupply+state.minted-state.burned,'money conservation');
 const inv={};
 for(const holder of [...Object.values(state.stations).map(s=>s.lager),
   ...Object.values(state.ships).map(s=>s.ladung)])
   for(const [w,q] of Object.entries(holder)){assert(Number.isSafeInteger(q)&&q>=0);
     inv[w]=(inv[w]||0)+q;}
 for(const [w,l] of Object.entries(state.ledger))
   assert.equal(inv[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'goods '+w);
}
const commands=[
 {tick:1,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}},
 {tick:2,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}},
 {tick:3,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}},
 {tick:4,cmd:{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}},
 {tick:5,cmd:{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh002'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh029'}}
];
const observerA=new Observer(),observerB=new Observer();
const a=engine(observerA),b=engine(observerB);
const state=a.core.createState(seed,a.rules),replay=b.core.createState(seed,b.rules);
assert.equal(a.rules.rulesVersion,14);
let count=0,roundtrips=0;
const active=scenario==='active'?commands:[];
const dates=new Set([7,14,30,60,90]);
const points=[];
for(let tick=1;tick<=days*1440;tick++){
 for(const [world,env] of [[state,a],[replay,b]]){
   for(const item of active.filter(x=>x.tick===world.tick+1)){
     const result=env.core.submit(world,item.cmd,env.rules);
     assert(result.ok,'original 7 commands accepted '+JSON.stringify(result));
   }
 }
 const x=a.core.step(state,a.rules),y=b.core.step(replay,b.rules);
 assert.deepEqual(x,y,'same original core return');
 if(tick%60===0){
   for(const [w,env] of [[state,a],[replay,b]]){
     assert(env.core.audit(w).ok);independentAudit(w);
   }
   assert.equal(a.core.hash(state),b.core.hash(replay),'hourly deterministic independent replay');
   count++;
 }
 if(tick%1440===0){
   const day=tick/1440;
   if(dates.has(day)){
     points.push({day,hash:a.core.hash(state),house:state.owners.house.cash,
       npc1:state.owners.npc1.cash,npc2:state.owners.npc2.cash,
       physicalTrades:state.stats.handel,
       medical:state.ledger.medikamente.consumed,
       food:state.ledger.nahrung.consumed});
   }
   if([3,15,30,90].includes(day)){
     for(const [w,env] of [[state,a],[replay,b]]){
       assert.equal(env.core.hash(env.core.load(env.core.save(w),undefined,env.rules)),env.core.hash(w));
       roundtrips++;
     }
   }
 }
}
assert.equal(count,2160);assert.equal(roundtrips,8);
const aa=observerA.result(state),bb=observerB.result(replay);
assert.deepEqual(aa,bb,'all accounting metrics replay');
const hash=a.core.hash(state);
if(seed===42&&scenario==='active')assert.equal(hash,'784047684dfe5c56');
if(seed===42&&scenario==='passive')assert.equal(hash,'adf155a018b94094');
assert.equal(aa.travel.paid,aa.travel.emptyPaid+
  [...observerA.lots.values()].reduce((s,l)=>s+l.cargoWork,0),'real all NPC freighter flight costs allocated');
assert.equal(aa.physicalSales,
  [...observerA.lots.values()].reduce((sum,l)=>sum+l.sold,0));
const dir=opt('out','/tmp/b8i');fs.mkdirSync(dir,{recursive:true});
const output={seed,scenario,days,hash,sourceSha256:hash256(source),hours:count,roundtrips,
 points,metrics:aa};
fs.writeFileSync(path.join(dir,scenario+'-'+seed+'-'+days+'d.json'),JSON.stringify(output,null,2)+'\n');
console.log('B8I_PASS '+JSON.stringify({seed,scenario,hash,hours:count,roundtrips,
 routes:aa.tradeRoutes,lotCount:aa.lotCount,completedLots:aa.completedLots,
 arrivalFull:aa.arrivalFull,arrivalCashBlocked:aa.arrivalCashBlocked,
 arrivalStorageBlocked:aa.arrivalStorageBlocked,arrivalMixedBlocked:aa.arrivalMixedBlocked,
 blockedUnits:aa.blockedUnits,travel:aa.travel,
 topRoutes:aa.topRoutes.slice(0,13),stationFailure:aa.stationFailure,points}));
