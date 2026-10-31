// B8j: purely observational hooks into ORIGINAL Regel14 core, no product patch.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const argv=process.argv.slice(2),opt=(key,def)=>argv.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??def;
assert(argv.every(x=>/^--(seed|scenario|out)=/.test(x)));
const seed=Number(opt('seed','42')),scenario=opt('scenario','active');
assert([42,7].includes(seed));assert(['active','passive'].includes(scenario));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sha=txt=>createHash('sha256').update(txt).digest('hex');
assert.equal(sha(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const mods=[
 ["function zerstoeren(state, rules, s) {\n  const { markt, owner } = rules.world.piraten;",
  "function zerstoeren(state, rules, s) {\n  observer.destroyed(state,rules,s,'pirate-raid');\n  const { markt, owner } = rules.world.piraten;"],
 ["function entfernen(state, rules, s) {\n  // Verbliebene Fracht",
  "function entfernen(state, rules, s) {\n  observer.removed(state,rules,s);\n  // Verbliebene Fracht"],
 ["  for (const owner of ids(state.sollflotte)) {\n    if (owner === w.piraten.owner || state.owners[owner].kind === 'player') continue;\n    const leer = !ids(state.ships).some((id) => state.ships[id].owner === owner);\n    for (const x of fehlend(state, owner)) {",
  "  for (const owner of ids(state.sollflotte)) {\n    if (owner === w.piraten.owner || state.owners[owner].kind === 'player') continue;\n    const leer = !ids(state.ships).some((id) => state.ships[id].owner === owner);\n    observer.ownerCycle(state,rules,owner,leer,fehlend(state,owner));\n    for (const x of fehlend(state, owner)) {\n      observer.attempt(state,rules,owner,leer,x,preis,gebuehr,fondsIn,m_core_handel.reserve);"],
 ["  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;",
  "  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n;\n  observer.grant(state,rules,owner,n); return n;"],
 ["      if (!handel(state, rules, s, werft, x.klasse, 1, true)) {\n        delete state.ships[s.id];",
  "      if (!handel(state, rules, s, werft, x.klasse, 1, true)) {\n        observer.purchaseFailed(state,rules,owner,x,s);\n        delete state.ships[s.id];"],
 ["      state.stats.indienst[owner][x.klasse] = anzahl(state.stats.indienst[owner], x.klasse) + 1;\n      s.ankunft",
  "      state.stats.indienst[owner][x.klasse] = anzahl(state.stats.indienst[owner], x.klasse) + 1;\n      observer.purchased(state,rules,owner,x,s);\n      s.ankunft"]
];
let instrumented=source;
for(const [oldText,newText] of mods){assert.equal(instrumented.split(oldText).length,2,
  'one original-core hook: '+oldText.slice(0,90));instrumented=instrumented.replace(oldText,newText);}
const load=observer=>new Function('observer',instrumented+
  ';return {core:m_core_index,rules:m_data_rules.RULES};')(observer);
const focus=['npc1','npc2'];
function countShips(state,owner,kind=null){return Object.values(state.ships)
 .filter(s=>s.owner===owner&&(!kind||s.klasse===kind)).length;}
function summarizeShip(state,s){return {id:s.id,owner:s.owner,klasse:s.klasse,system:s.system,
  phase:s.phase,ziel:s.ziel,slot:s.sollplatz??null,auftrag:s.auftrag,
  cargo:{...s.ladung}};}
function fundCash(state,rules) {
 const werft=rules.world.werft;
 const system=state.stations[werft].system;
 return {werft,system,id:rules.world.systems[system].fonds,
   cash:state.owners[rules.world.systems[system].fonds].cash,
   inventory:{...state.stations[werft].lager}};
}
class Observer {
 constructor(){this.losses=[];this.removeEvents=[];this.grants=[];this.purchases=[];
  this.failedBuys=[];this.attemptStats={};this.cycleStats={};this.attemptSamples=[];
  this.firstAttemptByCause={};this.firstZeroFrachter={};this.firstZeroCash={};
  this.firstMissingWithOtherShips={};this.firstRescueEligible={};
  this.lastAttemptByOwner={};this.tickDetails=[];}
 destroyed(state,rules,s,cause){
  if(!focus.includes(s.owner)||s.klasse!=='frachter')return;
  const cash=fundCash(state,rules);
  this.losses.push({...summarizeShip(state,s),tick:state.tick,
    day:Math.ceil(state.tick/1440),cause,
    ownerCash:state.owners[s.owner].cash,ownerAllShips:countShips(state,s.owner),
    otherShips:countShips(state,s.owner)-countShips(state,s.owner,'frachter'),
    fundCash:cash.cash,werftStock:cash.inventory.frachter||0,
    remainingCargo:Object.values(s.ladung).reduce((a,q)=>a+q,0)});
 }
 removed(state,rules,s){
  if(!focus.includes(s.owner)||s.klasse!=='frachter')return;
  this.removeEvents.push({id:s.id,tick:state.tick,owner:s.owner});
 }
 grant(state,rules,owner,amount){
  if(!focus.includes(owner))return;
  this.grants.push({tick:state.tick,owner,amount,
   afterCash:state.owners[owner].cash,fund:fundCash(state,rules).cash});
 }
 ownerCycle(state,rules,owner,leer,missing){
  if(!focus.includes(owner))return;
  const k=owner+'|'+(leer?'emptyOwner':'hasOtherShips')+'|missing-'+missing.length;
  this.cycleStats[k]=(this.cycleStats[k]||0)+1;
  if(missing.length&&countShips(state,owner,'frachter')===0){
   if(countShips(state,owner)>0&&!this.firstMissingWithOtherShips[owner])
    this.firstMissingWithOtherShips[owner]={tick:state.tick,shipCount:countShips(state,owner),
      kinds:Object.values(state.ships).filter(s=>s.owner===owner).map(s=>s.klasse),
      missing:missing.map(x=>x.klasse),cash:state.owners[owner].cash};
   if(countShips(state,owner)===0&&!this.firstRescueEligible[owner])
    this.firstRescueEligible[owner]={tick:state.tick,missing:missing.map(x=>x.klasse),
      cash:state.owners[owner].cash,fund:fundCash(state,rules).cash};
  }
 }
 attempt(state,rules,owner,leer,x,priceFn,feeFn,fundFn,reserveFn){
  if(!focus.includes(owner))return;
  const w=rules.world,werf=w.werft,st=state.stations[werf];
  const stock=st.lager[x.klasse]||0;
  const p=priceFn(state,werf,x.klasse,rules);
  const fee=feeFn(state,rules,werf,p),due=p+fee;
  const reserve=reserveFn(rules,werf,x.klasse);
  const ownCash=state.owners[owner].cash;
  const funding=state.owners[fundFn(rules,st.system)].cash;
  const gap=Math.max(0,due-ownCash);
  const possibleGrant=leer&&gap>0&&funding>=gap;
  const finalCash=ownCash+(possibleGrant?gap:0);
  const threshold=due+(leer?0:w.ersatzRuecklage);
  const reasons=[];
  if(stock<1)reasons.push('no-physical-hull');
  if(stock>=1&&finalCash<threshold)reasons.push('cash-or-reserve-deficit');
  if(stock>=1&&stock-1<reserve)reasons.push('shipyard-reserve');
  if(leer&&gap>0&&funding<gap)reasons.push('fund-cannot-cover-reentry-gap');
  if(!reasons.length)reasons.push('eligible');
  const record={tick:state.tick,owner,klasse:x.klasse,platz:x.platz??null,
    emptyOwner:leer,ownShips:countShips(state,owner),otherShips:countShips(state,owner)-countShips(state,owner,'frachter'),
    ownCash,funding,stock,reserve,price:p,fee,due,gap,possibleGrant,threshold,reasons,
    target:x.heimat};
  this.lastAttemptByOwner[owner]=record;
  for(const reason of reasons) {
   const key=owner+'|'+x.klasse+'|'+reason;
   this.attemptStats[key]=(this.attemptStats[key]||0)+1;
   if(!this.firstAttemptByCause[key])this.firstAttemptByCause[key]=record;
  }
  if(this.attemptSamples.length<32&&x.klasse==='frachter')this.attemptSamples.push(record);
 }
 purchased(state,rules,owner,x,s){
  if(!focus.includes(owner))return;
  this.purchases.push({tick:state.tick,owner,klasse:x.klasse,
    ship:s.id,slot:x.platz,remainingCash:state.owners[owner].cash,
    remainingStock:state.stations[rules.world.werft].lager[x.klasse]||0});
 }
 purchaseFailed(state,rules,owner,x,s){
  if(!focus.includes(owner))return;
  this.failedBuys.push({tick:state.tick,owner,klasse:x.klasse,slot:x.platz,
    lastAttempt:this.lastAttemptByOwner[owner]});
 }
 afterStep(state,rules){
  if(state.tick%60!==0)return;
  for(const owner of focus) {
   const freighters=countShips(state,owner,'frachter');
   if(freighters===0&&!this.firstZeroFrachter[owner])
    this.firstZeroFrachter[owner]={tick:state.tick,day:state.tick/1440,
     otherShips:countShips(state,owner),cash:state.owners[owner].cash,
     werft:fundCash(state,rules)};
   if(state.owners[owner].cash===0&&!this.firstZeroCash[owner])
    this.firstZeroCash[owner]={tick:state.tick,day:state.tick/1440,
      ships:countShips(state,owner),freighters};
  }
 }
 finish(state,rules,points) {
  return {losses:this.losses,removeEvents:this.removeEvents,purchases:this.purchases,
    failedBuys:this.failedBuys,grants:this.grants,
    attemptStats:this.attemptStats,cycleStats:this.cycleStats,
    firstAttemptByCause:this.firstAttemptByCause,
    firstZeroFrachter:this.firstZeroFrachter,firstZeroCash:this.firstZeroCash,
    firstMissingWithOtherShips:this.firstMissingWithOtherShips,
    firstRescueEligible:this.firstRescueEligible,attemptSamples:this.attemptSamples,
    lastAttemptByOwner:this.lastAttemptByOwner,points,
    final:fundCash(state,rules)};
 }
}
function audit(world){
  let cash=0;for(const o of Object.values(world.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0);cash+=o.cash;}
  assert.equal(cash,world.initialSupply+world.minted-world.burned,'independent money conservation');
  const inventory={};
  for(const holder of [...Object.values(world.stations).map(x=>x.lager),...Object.values(world.ships).map(x=>x.ladung)])
   for(const [w,n] of Object.entries(holder)){assert(Number.isSafeInteger(n)&&n>=0);
    inventory[w]=(inventory[w]||0)+n;}
  for(const [w,ledger] of Object.entries(world.ledger))
   assert.equal(inventory[w]||0,ledger.initial+ledger.mined+ledger.produced+ledger.imported-ledger.consumed-ledger.exported,'goods '+w);
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
const obs=new Observer(),obsB=new Observer();
const a=load(obs),b=load(obsB);
assert.equal(a.rules.rulesVersion,14);
const state=a.core.createState(seed,a.rules),replay=b.core.createState(seed,b.rules);
const initial=Object.fromEntries(focus.map(owner=>[owner,{
  cash:state.owners[owner].cash,
  ships:Object.values(state.ships).filter(x=>x.owner===owner).map(x=>summarizeShip(state,x)),
  plan:state.sollflotte[owner]}]));
let hours=0,saves=0;
const points=[];
for(let tick=1;tick<=90*1440;tick++){
 for(const [world,env] of [[state,a],[replay,b]]){
  if(scenario==='active')for(const q of commands.filter(x=>x.tick===world.tick+1))
   assert(env.core.submit(world,q.cmd,env.rules).ok,'historical B1 command accepted');
 }
 const x=a.core.step(state,a.rules),y=b.core.step(replay,b.rules);
 assert.deepEqual(x,y,'same original game results');
 obs.afterStep(state,a.rules);obsB.afterStep(replay,b.rules);
 if(tick%60===0){
  for(const [world,env] of [[state,a],[replay,b]]){assert(env.core.audit(world).ok);audit(world);}
  assert.equal(a.core.hash(state),b.core.hash(replay),'hourly original hash replay');
  hours++;
 }
 if(tick%1440===0){
  const day=tick/1440;
  if([1,2,3,4,5,6,7,8,10,12,14,15,16,20,30,60,90].includes(day)){
   points.push({day,hash:a.core.hash(state),
    fleets:Object.fromEntries(focus.map(owner=>[owner,{
     cash:state.owners[owner].cash,
     ships:countShips(state,owner),frachter:countShips(state,owner,'frachter'),
     other:countShips(state,owner)-countShips(state,owner,'frachter'),
     desiredFrachter:state.sollflotte[owner].filter(x=>x.klasse==='frachter').length}])),
    ...fundCash(state,a.rules),
    subsidy:state.stats.zuschuss,
    deliveries:state.stats.handel,
    hullProduced:state.ledger.frachter?.produced||0,
    hullConsumed:state.ledger.frachter?.consumed||0});
  }
  if([3,14,30,90].includes(day))for(const [world,env] of [[state,a],[replay,b]]){
   assert.equal(env.core.hash(env.core.load(env.core.save(world),undefined,env.rules)),env.core.hash(world));
   saves++;
  }
 }
}
assert.equal(hours,2160);assert.equal(saves,8);
assert.equal(a.core.hash(state),b.core.hash(replay));
const m=obs.finish(state,a.rules,points),n=obsB.finish(replay,b.rules,points);
assert.deepEqual(m,n,'identical independent B8j observer event chain');
const hash=a.core.hash(state);
if(seed===42&&scenario==='active')assert.equal(hash,'784047684dfe5c56');
if(seed===42&&scenario==='passive')assert.equal(hash,'adf155a018b94094');
const removed=new Set(m.removeEvents.map(x=>x.id)),losses=new Set(m.losses.map(x=>x.id));
assert.equal(removed.size,m.removeEvents.length);
assert.equal(losses.size,m.losses.length);
for(const lost of losses)assert(removed.has(lost),'all pirate freight losses flow via original entfernen');
const output={seed,scenario,hash,sourceSha256:sha(source),hours,saves,initial,results:m,
 summary:{losses:m.losses.length,purchases:m.purchases.length,
  grants:m.grants.length,finalFrachter:Object.fromEntries(focus.map(id=>[id,countShips(state,id,'frachter')])),
  finalCash:Object.fromEntries(focus.map(id=>[id,state.owners[id].cash]))}};
const dir=opt('out','/tmp/b8j');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,scenario+'-'+seed+'-90d.json'),JSON.stringify(output,null,2)+'\n');
console.log('B8J_PASS '+JSON.stringify({seed,scenario,hash,hours,saves,
  initial,summary:output.summary,losses:m.losses,purchases:m.purchases,
  grants:m.grants,firstMissingWithOtherShips:m.firstMissingWithOtherShips,
  firstRescueEligible:m.firstRescueEligible,
  firstZeroFrachter:m.firstZeroFrachter,firstZeroCash:m.firstZeroCash,
  attemptStats:m.attemptStats,firstAttemptByCause:m.firstAttemptByCause,
  points:m.points}));
