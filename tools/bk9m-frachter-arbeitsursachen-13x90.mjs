// B-K9m – analyse-only cost attribution; original v14 core unchanged.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const h=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let src=h.slice(h.indexOf('const m_data_systeme ='),h.indexOf('const m_data_oberflaeche ='));
const patches=[
 ["  s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;",
  "  probe.depart(s,ware); s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;"],
 ["    if (s.phase === 'reise') { s.arbeit += 1; continue; }",
  "    if (s.phase === 'reise') { probe.minute(s); s.arbeit += 1; continue; }"],
 ["    const n = Math.min(besitzer.cash, kosten);",
  "    const n = Math.min(besitzer.cash, kosten); probe.wage(s,arbeit,kosten,n);"],
 ["  buche(state, schiff.owner, 'kosten', fee);\n  return true;",
  "  buche(state, schiff.owner, 'kosten', fee);\n  probe.trade(schiff,kauf,wert,fee,menge);\n  return true;"],
 ["function entfernen(state, rules, s) {",
  "function entfernen(state, rules, s) { probe.destroy(s);"]
];
for(const [a,b] of patches){assert.equal(src.split(a).length,2,a);src=src.replace(a,b);}
const cats=['new_cargo','onward_loaded','random_empty','failed_purchase','initial_or_yard','unknown'];
const seeds=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const zero=()=>Object.fromEntries(cats.map(k=>[k,0]));
function createProbe(){
 const p={active:{},minuteBuckets:{},departures:zero(),minutes:zero(),
   chargedMinutes:zero(),wagesDue:zero(),wagesPaid:zero(),wagesUnpaid:zero(),
   hullLosses:zero(),hullLossWithCargo:zero(),unbilledLostMinutes:0,
   buyCash:0,sellCash:0,buyUnits:0,sellUnits:0,unknownMinutes:0};
 const trader=s=>s.klasse==='frachter'&&['npc1','npc2'].includes(s.owner);
 p.depart=(s,ware)=>{
  if(!trader(s))return;
  const loaded=sum(s.ladung);
  const kind=ware!==null?(loaded>0?'new_cargo':'failed_purchase'):
    loaded>0?'onward_loaded':'random_empty';
  p.active[s.id]=kind;p.departures[kind]++;
 };
 p.minute=s=>{
  if(!trader(s))return;
  const kind=p.active[s.id]||'initial_or_yard';
  if(!p.minuteBuckets[s.id])p.minuteBuckets[s.id]={};
  p.minuteBuckets[s.id][kind]=(p.minuteBuckets[s.id][kind]||0)+1;
  p.minutes[kind]++;
 };
 const distribute=(amount,weights)=>{
  const n=sum(weights);if(n===0)return {unknown:amount};
  const a=Object.entries(weights).map(([k,v])=>({
   k,base:Math.floor(amount*v/n),fraction:(amount*v)%n
  }));
  let rest=amount-a.reduce((t,x)=>t+x.base,0);
  a.sort((x,y)=>y.fraction-x.fraction||x.k.localeCompare(y.k));
  for(const item of a){if(rest===0)break;item.base++;rest--;}
  assert.equal(rest,0);return Object.fromEntries(a.map(x=>[x.k,x.base]));
 };
 p.wage=(s,worked,due,paid)=>{
  if(!trader(s))return;
  const weights={...(p.minuteBuckets[s.id]||{})};
  const missing=worked-sum(weights);
  assert(missing>=0);
  if(missing){weights.unknown=(weights.unknown||0)+missing;p.unknownMinutes+=missing;}
  for(const [k,v] of Object.entries(weights))p.chargedMinutes[k]+=v;
  const paidParts=distribute(paid,weights);
  const unpaidParts=distribute(due-paid,weights);
  for(const k of cats){
    p.wagesPaid[k]+=paidParts[k]||0;
    p.wagesUnpaid[k]+=unpaidParts[k]||0;
    p.wagesDue[k]+=(paidParts[k]||0)+(unpaidParts[k]||0);
  }
  p.minuteBuckets[s.id]={};
 };
 p.trade=(s,buy,value,fee,quantity)=>{
  if(!trader(s))return;
  if(buy){p.buyCash+=value+fee;p.buyUnits+=quantity;}
  else{p.sellCash+=value-fee;p.sellUnits+=quantity;}
 };
 p.destroy=s=>{
  if(!trader(s))return;
  const kind=p.active[s.id]||'initial_or_yard';
  p.hullLosses[kind]++;
  if(sum(s.ladung)>0)p.hullLossWithCargo[kind]++;
  // Destroyed ship is removed before original hourly settlement. Do not
  // mislabel these lost working minutes as actually paid or billed wages.
  p.unbilledLostMinutes+=s.arbeit;
  delete p.minuteBuckets[s.id];delete p.active[s.id];
 };
 return p;
}
function independentAudit(s,core){
 assert(core.audit(s).ok);
 assert.equal(sum(Object.fromEntries(Object.entries(s.owners).map(([k,v])=>[k,v.cash]))),
   s.initialSupply+s.minted-s.burned);
 const goods={};
 for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager)){
  assert(Number.isSafeInteger(n)&&n>=0);goods[w]=(goods[w]||0)+n;
 }
 for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung)){
  assert(Number.isSafeInteger(n)&&n>=0);goods[w]=(goods[w]||0)+n;
 }
 for(const [w,l] of Object.entries(s.ledger)){
  assert.equal(goods[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w);
 }
}
function simulate(seed,active=true,days=90,quiet=false){
 const p=createProbe();
 const {core,rules}=new Function('probe',src+
  ';return {core:m_core_index,rules:m_data_rules.RULES};')(p);
 assert.equal(rules.rulesVersion,14);assert.equal(rules.schema,8);
 const s=core.createState(seed,rules);
 if(active){
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(sh);assert(core.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},rules).ok);
 }
 const startHash=core.hash(s),saveDays=new Set([1,7,14,30,60,90]);
 const checkpoints={};let saved=0;
 for(let hour=1;hour<=days*24;hour++){
  core.advance(s,60,rules);
  independentAudit(s,core);
  if(hour%24===0&&saveDays.has(hour/24)){
   const copy=core.load(core.save(s),undefined,rules);
   assert.equal(core.hash(copy),core.hash(s));
   saved++;
   checkpoints[hour/24]={unpaid:sum(p.wagesUnpaid),
     wages:sum(p.wagesDue),lost:sum(p.hullLosses),sold:p.sellCash};
  }
 }
 assert.equal(sum(p.wagesDue),sum(p.wagesPaid)+sum(p.wagesUnpaid));
 const residual=Object.values(p.minuteBuckets).reduce((n,w)=>n+sum(w),0);
 assert.equal(sum(p.minutes)+p.unknownMinutes,
   sum(p.chargedMinutes)+p.unbilledLostMinutes+residual,
   'every actually flown minute must have a single accounting status');
 const outcome={seed,active,days,startHash,hash:core.hash(s),
   audits:days*24,saveLoads:saved,
   departures:p.departures,flightMinutes:p.minutes,
   chargedMinutes:p.chargedMinutes,
   due:p.wagesDue,paid:p.wagesPaid,unpaid:p.wagesUnpaid,
   destroyed:p.hullLosses,cargoLostShip:p.hullLossWithCargo,
   unbilledLostMinutes:p.unbilledLostMinutes,unknownMinutes:p.unknownMinutes,
   trade:{spent:p.buyCash,received:p.sellCash,bought:p.buyUnits,sold:p.sellUnits},
   end:{traderHulls:Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&
     ['npc1','npc2'].includes(sh.owner)).length,
     traderCash:s.owners.npc1.cash+s.owners.npc2.cash,
     hullLosses:sum(s.stats.verluste.npc1||{})+sum(s.stats.verluste.npc2||{}),
     replaced:sum(s.stats.indienst.npc1||{})+sum(s.stats.indienst.npc2||{}),
     shortage:Object.values(s.stats.mangel).reduce((n,x)=>n+sum(x),0),
     playerCash:s.owners.house.cash},
   day14:checkpoints[14]};
 if(!quiet)console.log('BK9M_WORLD '+JSON.stringify(outcome));
 return outcome;
}
const worlds=seeds.map(seed=>simulate(seed));
const passive=[simulate(7,false),simulate(42,false)];
const combine=k=>Object.fromEntries(cats.map(x=>[x,worlds.reduce((n,w)=>n+w[k][x],0)]));
const summary={activeWorlds:worlds.length,passiveWorlds:passive.length,
 days:90,hourlyCoreAndIndependentAudits:15*2160,saveLoadHashes:15*6,
 departures:combine('departures'),minutes:combine('flightMinutes'),
 due:combine('due'),paid:combine('paid'),unpaid:combine('unpaid'),
 destroyed:combine('destroyed'),destroyedWithCargo:combine('cargoLostShip'),
 totalDue:sum(combine('due')),totalPaid:sum(combine('paid')),
 totalUnpaid:sum(combine('unpaid')),
 purchasedCash:worlds.reduce((n,x)=>n+x.trade.spent,0),
 realizedSalesCash:worlds.reduce((n,x)=>n+x.trade.received,0),
 boughtUnits:worlds.reduce((n,x)=>n+x.trade.bought,0),
 soldUnits:worlds.reduce((n,x)=>n+x.trade.sold,0),
 end:worlds.map(w=>({seed:w.seed,...w.end,unpaid:sum(w.unpaid)})),
 passive:passive.map(w=>({seed:w.seed,depart:w.departures,
  due:w.due,unpaid:w.unpaid,ending:w.end})),
 caution:'Exact original wage obligations/payments, but fractional attribution to flight types rounded. Sales and purchases may refer to different cargo, so cash margin difference not complete individual profit. No product rule changed.'};
console.log('BK9M_SUMMARY '+JSON.stringify(summary));
assert.equal(worlds.length,13);
const replay=simulate(7,true,14,true);
const replay2=simulate(7,true,14,true);
assert.equal(replay.hash,replay2.hash);
console.log('BK9M_REPLAY '+JSON.stringify({seed:7,days:14,hash:replay.hash,equal:true}));
