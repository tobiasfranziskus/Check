// E2a [ANALYSE] Independent economy/risk experiment on original Rule 14 core.
// The only variant is an isolated, seeded NPC3 trade decision filter.
// No production, price, ship-combat, world, RNG or save-format changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(original),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const hooks=[
 ["      if (gewinn <= 0) continue;",
  "      if (gewinn <= 0) continue;\n      if (!probe.offer(state,rules,s,station,ziel,ware,menge,gewinn,r.zeit,pHier,pDort)) continue;"],
 ["    if (erloes <= 0) continue;",
  "    if (erloes <= 0) continue;\n    if (!probe.disposal(state,rules,s,station,ziel,erloes,r.zeit)) continue;"],
 ["  if (!r || r.zeit <= 0) return false;\n  if (ware !== null) {",
  "  if (!r || r.zeit <= 0) return false;\n  if (!probe.depart(state,rules,s,station,ziel,ware,r.zeit,r.weg)) {\n    s.ankunft=state.tick+w.warteLeer; return false;\n  }\n  if (ware !== null) {"],
 ["  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n  probe.trade(state,schiff,station,ware,menge,kauf,wert,fee);"],
 ["    const n = Math.min(besitzer.cash, kosten);",
  "    const n = Math.min(besitzer.cash, kosten);\n    probe.work(state,s,arbeit,kosten,n);"],
 ["function zerstoeren(state, rules, s) {\n  const { markt, owner } = rules.world.piraten;",
  "function zerstoeren(state, rules, s) {\n  probe.destroy(state,s);\n  const { markt, owner } = rules.world.piraten;"]
];
let instrumented=original;
for(const [needle,replace] of hooks){
 assert.equal(instrumented.split(needle).length,2,'unique original core hook: '+needle.slice(0,40));
 instrumented=instrumented.replace(needle,replace);
}
const historic=[
 [1,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}],
 [2,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}],
 [3,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}],
 [4,{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}],
 [5,{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh002'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh029'}]
];
const sum=a=>a.reduce((x,y)=>x+y,0);
function observer(mode){
 return {
 mode,offers:{considered:0,blockedRisk:0,blockedMargin:0,blockedReserve:0,approved:0},
 disposalBlocks:0,departureBlocks:0,blockSamples:[],departs:[],
 traded:[],workPaid:{miner:0,frachter:0,jaeger:0},workDue:{miner:0,frachter:0,jaeger:0},
 destroyed:[],
 isFocus(s){return s.owner==='npc3' && s.klasse==='frachter';},
 risky(rules,target){return rules.world.systems[rules.world.stations[target].system].sicherheit!=='sicher';},
 offer(state,rules,s,source,target,ware,qty,gross,minutes,pBuy,pSell){
  if(!this.isFocus(s)||this.mode==='control'||this.mode==='autonomous')return true;
  this.offers.considered++;
  if(this.risky(rules,target)){
    this.offers.blockedRisk++;
    if(this.blockSamples.length<20)this.blockSamples.push({tick:state.tick,type:'risky-offer',source,target,ware,qty,gross});
    return false;
  }
  if(this.mode==='fullcost'){
    const costOneLeg=Math.ceil(minutes*rules.world.betriebskosten.frachter/60);
    const fullTravel=2*costOneLeg;
    if(gross<=fullTravel){this.offers.blockedMargin++;return false;}
    const purchase=qty*pBuy+Math.floor(qty*pBuy*rules.world.stations[source].gebuehr/1000);
    const miners=Object.values(state.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length;
    const reserve=miners*rules.world.betriebskosten.miner;
    if(state.owners.npc3.cash<purchase+fullTravel+reserve){
      this.offers.blockedReserve++;return false;
    }
  }
  this.offers.approved++;return true;
 },
 disposal(state,rules,s,from,to){
   if(!this.isFocus(s)||this.mode==='control'||this.mode==='autonomous')return true;
   if(!this.risky(rules,to))return true;
   this.disposalBlocks++;return false;
 },
 depart(state,rules,s,from,to,ware,minutes,path){
  if(!this.isFocus(s)||this.mode==='control'||this.mode==='autonomous')return true;
  // Actual Rule14 raid engine checks the flight destination system. It does NOT
  // attack intermediate waypoints; do not pretend this gate protects the path.
  if(this.risky(rules,to)){
    this.departureBlocks++;
    if(this.blockSamples.length<20)this.blockSamples.push({tick:state.tick,type:'risky-departure',from,to,ware,minutes,path});
    return false;
  }
  if(this.departs.length<80)this.departs.push({tick:state.tick,from,to,ware,minutes,path});
  return true;
 },
 trade(state,ship,station,ware,qty,buy,value,fee){
  if(!this.isFocus(ship))return;
  this.traded.push({tick:state.tick,ship:ship.id,station,ware,qty,buy,value,fee});
 },
 work(state,ship,minutes,due,paid){
  if(ship.owner!=='npc3'||!(ship.klasse in this.workDue))return;
  this.workDue[ship.klasse]+=due;this.workPaid[ship.klasse]+=paid;
 },
 destroy(state,s){
  if(!this.isFocus(s))return;
  this.destroyed.push({tick:state.tick,id:s.id,system:s.system,phase:s.phase,
    cargo:{...s.ladung},cash:state.owners.npc3.cash});
 }
 };
}
function run(seed,mode){
 const aObs=observer(mode),bObs=observer(mode);
 const a=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(aObs);
 const b=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(bObs);
 const rules=a.rules,w=a.core.createState(seed,rules),v=b.core.createState(seed,rules);
 let firstShip=null,started=false,checks=0,saves=0,day14hash=null,firstLoss=null;
 const rows=[];
 const submit=(cmd)=>{for(const [state,engine] of [[w,a.core],[v,b.core]])
   assert(engine.submit(state,cmd,rules).ok,'validated command '+JSON.stringify(cmd));};
 for(let tick=1;tick<=90*1440;tick++){
  for(const [t,cmd] of historic)if(t===tick)submit(cmd);
  if(mode!=='control'&&tick===20161)
    for(const world of [w,v])world.sollflotte.npc3.push({klasse:'frachter',heimat:'dravos',auftrag:'halten',ware:null});
  if(mode!=='control'&&!started){
   const ship=Object.values(w.ships).find(x=>x.owner==='npc3'&&x.klasse==='frachter');
   if(ship?.phase==='dock'&&ship.system==='dravos'){
    firstShip=ship.id;submit({type:'shipHandeln',owner:'npc3',schiff:ship.id});started=true;
   }
  }
  assert.deepEqual(a.core.step(w,rules),b.core.step(v,rules),'same real executed commands');
  if(tick===14*1440)day14hash=a.core.hash(w);
  if(tick%60===0){
   assert(a.core.audit(w).ok&&b.core.audit(v).ok,'original core money and goods audit');
   assert.equal(a.core.hash(w),b.core.hash(v),'hourly deterministic state replay');
   assert.equal(Object.values(w.owners).reduce((x,z)=>x+z.cash,0),w.initialSupply+w.minted-w.burned,'independent money');
   const goods={};
   for(const l of [...Object.values(w.stations).map(x=>x.lager),...Object.values(w.ships).map(x=>x.ladung)])
    for(const [k,n] of Object.entries(l)){assert(Number.isSafeInteger(n)&&n>=0);goods[k]=(goods[k]||0)+n;}
   for(const [k,l] of Object.entries(w.ledger))
     assert.equal(goods[k]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'independent goods '+k);
   checks++;
  }
  if(tick%1440===0){
   const day=tick/1440;
   if([14,15,16,20,30,60,90].includes(day))
    rows.push({day,ownerCash:w.owners.npc3.cash,alderaCash:w.owners.st_aldera.cash,
      liveFreighters:Object.values(w.ships).filter(s=>s.owner==='npc3'&&s.klasse==='frachter').length,
      originalAlive:firstShip?Boolean(w.ships[firstShip]):null,trade:w.stats.handel,
      nutrition:w.ledger.nahrung.consumed,medications:w.ledger.medikamente.consumed,
      unpaid:sum(Object.keys(aObs.workDue).map(k=>aObs.workDue[k]-aObs.workPaid[k]))});
   if([14,30,60,90].includes(day)){
    for(const [state,engine] of [[w,a.core],[v,b.core]])
      assert.equal(engine.hash(engine.load(engine.save(state),undefined,rules)),engine.hash(state),'save-load');
    saves+=2;
   }
  }
 }
 assert.equal(day14hash,seed===42?'070faf864387fe53':'6e157d8d052dddfc','identical original day14');
 assert.equal(checks,2160);assert.equal(saves,8);
 assert.deepEqual(JSON.parse(JSON.stringify(aObs)),JSON.parse(JSON.stringify(bObs)),'identical replay observer data');
 if(mode!=='control'){
  assert(started,'NPC3 started genuine paid autonomy');
  assert(aObs.traded.some(x=>x.ware==='frachter'&&x.buy&&x.value+x.fee===780),
    'genuine paid original hull purchase');
 }
 const hull=aObs.traded.filter(x=>x.ware==='frachter');
 const goods=aObs.traded.filter(x=>x.ware!=='frachter');
 const cargoNet=goods.reduce((v,x)=>v+(x.buy?-x.value-x.fee:x.value-x.fee),0);
 const result={seed,mode,sourceHash:sha(original),variantHash:sha(instrumented),
  hash:a.core.hash(w),day14hash,checks,saves,started,firstShip,
  firstShipAlive:firstShip?Boolean(w.ships[firstShip]):null,
  firstShipLoss:aObs.destroyed.find(x=>x.id===firstShip)||null,
  newHulls:hull.length,purchasedHullCash:sum(hull.map(x=>x.value+x.fee)),
  cargoPurchases:goods.filter(x=>x.buy).length,cargoSales:goods.filter(x=>!x.buy).length,
  cargoNet,freighterWorkPaid:aObs.workPaid.frachter,freighterWorkDue:aObs.workDue.frachter,
  freighterNetAfterHull: cargoNet-aObs.workPaid.frachter-sum(hull.map(x=>x.value+x.fee)),
  npc3AllWorkPaid:sum(Object.values(aObs.workPaid)),
  npc3Unpaid:sum(Object.keys(aObs.workDue).map(k=>aObs.workDue[k]-aObs.workPaid[k])),
  finalCash:w.owners.npc3.cash, finalTotalShips:Object.values(w.ships).filter(x=>x.owner==='npc3').length,
  totalPirateLosses:aObs.destroyed.length,
  traderEvents:aObs.traded.length,
  worldTrade:w.stats.handel,totalFood:w.ledger.nahrung.consumed,totalMedicine:w.ledger.medikamente.consumed,
  risk:aObs.offers,disposalBlocks:aObs.disposalBlocks,departureBlocks:aObs.departureBlocks,
  firstBlocked:aObs.blockSamples,departures:aObs.departs,losses:aObs.destroyed,rows};
 if(mode==='control'&&seed===42)assert.equal(result.hash,'784047684dfe5c56','original baseline seed42 active');
 if(mode==='autonomous'&&seed===42)assert.equal(result.hash,'b0a31d1fbceeb2c0','original unguided control from E1 seed42');
 return result;
}
const all=[];
for(const seed of [42,7])for(const mode of ['control','autonomous','risk-only','fullcost'])
 all.push(run(seed,mode));
const folder=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(folder){fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'e2a-results.json'),JSON.stringify(all,null,2)+'\n');}
console.log('E2A_AUDIT_PASS '+JSON.stringify(all.map(x=>({
 seed:x.seed,mode:x.mode,hash:x.hash,paidHulls:x.newHulls,firstAlive:x.firstShipAlive,
 firstLossTick:x.firstShipLoss?.tick||null,cargoBuys:x.cargoPurchases,cargoSales:x.cargoSales,
 netAfterHull:x.freighterNetAfterHull,npc3End:x.finalCash,unpaid:x.npc3Unpaid,
 worldTrade:x.worldTrade,riskBlocked:x.risk.blockedRisk,marginBlocked:x.risk.blockedMargin,
 reserveBlocked:x.risk.blockedReserve,departureBlocks:x.departureBlocks
}))));
