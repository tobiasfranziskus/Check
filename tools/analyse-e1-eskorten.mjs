// E1 [ANALYSE] True paid escort participation vs assigned-only original Rule14 core.
// No application changes. Deterministic core-source transformation for analysis only.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(original),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9','fixed unchanged original core');
const originalFilter=`s.klasse === 'jaeger' && s.phase === 'dock' && s.system === system &&
      s.auftrag === 'eskorte' && s.eskorte === ziel.id && s.owner === ziel.owner`;
const coflightFilter=`s.klasse === 'jaeger' && (
       (s.phase === 'dock' && s.system === system) ||
       (ziel.phase === 'reise' && s.phase === 'reise' && s.ziel === ziel.ziel && s.ankunft === ziel.ankunft)
      ) && s.auftrag === 'eskorte' && s.eskorte === ziel.id && s.owner === ziel.owner`;
const abflugNeedle=`function abflug(state, rules, s, station, ziel, ware, menge) {
  const w = rules.world, r = route(w, w.stations[station].system, w.stations[ziel].system);`;
const abflugMandatory=`function abflug(state, rules, s, station, ziel, ware, menge) {
  const w = rules.world, r = route(w, w.stations[station].system, w.stations[ziel].system);
  if (s.owner === 'npc3' && s.klasse === 'frachter' &&
      w.systems[w.stations[ziel].system].sicherheit !== 'sicher') {
    const escortReady = Object.values(state.ships).some(e => e.klasse === 'jaeger' &&
      e.phase === 'dock' && e.system === s.system && e.owner === s.owner &&
      e.auftrag === 'eskorte' && e.eskorte === s.id);
    if (!escortReady) { observer.blocked(state,s,ziel); s.ankunft=state.tick+w.warteLeer; return false; }
  }`;
const hooks=[
 ["    const verteidiger = [ziel, ...eskorten];",
  "    observer.attack(state,ziel,eskorten,system);\n    const verteidiger = [ziel, ...eskorten];"],
 ["function zerstoeren(state, rules, s) {\n  const { markt, owner } = rules.world.piraten;",
  "function zerstoeren(state, rules, s) {\n  observer.loss(state,s);\n  const { markt, owner } = rules.world.piraten;"],
 ["function entfernen(state, rules, s) {\n  // Verbliebene Fracht",
  "function entfernen(state, rules, s) {\n  observer.jLoss(state,s);\n  // Verbliebene Fracht"],
 ["    const n = Math.min(besitzer.cash, kosten);",
  "    const n = Math.min(besitzer.cash, kosten);\n    observer.work(state,s,arbeit,kosten,n);"],
 ["  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n  observer.trade(state,schiff,station,ware,menge,kauf,wert,fee);"]
];
const oneRep=(src,n,v)=>{assert.equal(src.split(n).length,2,'single isolated hook '+n.slice(0,40));return src.replace(n,v);};
function sourceFor(arm){
 let code=original;
 if(arm!=='assigned')code=oneRep(code,originalFilter,coflightFilter);
 if(arm==='mandatory1')code=oneRep(code,abflugNeedle,abflugMandatory);
 for(const [n,v] of hooks)code=oneRep(code,n,v);
 return code;
}
const commands=[
 [1,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}],
 [2,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}],
 [3,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}],
 [4,{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}],
 [5,{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh002'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh029'}]
];
const observer=()=>({
 attacks:[],freightLosses:[],fighterLosses:[],blockedCount:0,blockedSamples:[],
 hulls:{frachter:0,jaeger:0},due:0,paid:0,freightWork:0,fighterWork:0,trades:{buys:0,sales:0},
 attack(w,s,esc,system){if(s.owner==='npc3'&&s.klasse==='frachter')
  this.attacks.push({tick:w.tick,system,ship:s.id,escorts:esc.map(x=>x.id)});},
 loss(w,s){if(s.owner==='npc3'&&s.klasse==='frachter')
  this.freightLosses.push({tick:w.tick,id:s.id,system:s.system});},
 jLoss(w,s){if(s.owner==='npc3'&&s.klasse==='jaeger')
  this.fighterLosses.push({tick:w.tick,id:s.id,system:s.system});},
 blocked(w,s,ziel){if(s.owner==='npc3'&&s.klasse==='frachter'){
  this.blockedCount++;if(this.blockedSamples.length<12)this.blockedSamples.push({tick:w.tick,target:ziel});}},
 work(w,s,min,due,paid){if(s.owner!=='npc3')return;
  this.due+=due;this.paid+=paid;
  if(s.klasse==='frachter')this.freightWork+=paid;
  if(s.klasse==='jaeger')this.fighterWork+=paid;},
 trade(w,s,station,ware,qty,buy,value,fee){if(s.owner!=='npc3')return;
  if(buy&&s.klasse==='frachter'&&ware==='frachter')this.hulls.frachter++;
  if(buy&&s.klasse==='jaeger'&&ware==='jaeger')this.hulls.jaeger++;
  if(s.klasse==='frachter'&&ware!=='frachter'){
    if(buy)this.trades.buys++;else this.trades.sales++;
  }}
});
function run(seed,arm){
 const src=sourceFor(arm),o=observer(),p=observer();
 const a=new Function('observer',src+';return {core:m_core_index,rules:m_data_rules.RULES};')(o);
 const b=new Function('observer',src+';return {core:m_core_index,rules:m_data_rules.RULES};')(p);
 const r=a.rules,s=a.core.createState(seed,r),q=b.core.createState(seed,r);
 let launched=false,startedFreighter=null,startedFighters=[],hourly=0,saves=0,day14hash=null;
 const fightersNeeded=arm==='coflight2'?2:1;
 const submit=cmd=>{
  for(const [world,core] of [[s,a.core],[q,b.core]])
   assert(core.submit(world,cmd,r).ok,'actual valid core command '+JSON.stringify(cmd));
 };
 for(let t=1;t<=90*1440;t++){
  for(const [tick,cmd] of commands)if(tick===t)submit(cmd);
  if(t===14*1440+1){
   for(const w of [s,q]){
    w.sollflotte.npc3.push({klasse:'frachter',heimat:'dravos',auftrag:'halten',ware:null});
    for(let k=0;k<fightersNeeded;k++)
     w.sollflotte.npc3.push({klasse:'jaeger',heimat:'dravos',auftrag:'halten',ware:null});
   }
  }
  if(t>14*1440+1&&!launched){
   const freight=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='frachter');
   const fighters=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='jaeger');
   if(freight?.phase==='dock'&&freight.system==='dravos' &&
     fighters.length>=fightersNeeded&&fighters.slice(0,fightersNeeded)
       .every(j=>j.phase==='dock'&&j.system==='dravos')){
     startedFreighter=freight.id;startedFighters=fighters.slice(0,fightersNeeded).map(x=>x.id);
     for(const j of fighters.slice(0,fightersNeeded))
       submit({type:'shipEscort',owner:'npc3',schiff:j.id,ziel:freight.id});
     submit({type:'shipHandeln',owner:'npc3',schiff:freight.id});
     launched=true;
   }
  }
  assert.deepEqual(a.core.step(s,r),b.core.step(q,r),'same command results');
  if(t%60===0){
   assert(a.core.audit(s).ok&&b.core.audit(q).ok,'original core audit');
   const cash=Object.values(s.owners).reduce((x,v)=>x+v.cash,0);
   assert.equal(cash,s.initialSupply+s.minted-s.burned,'independent cash audit');
   const goods={};
   for(const holder of [...Object.values(s.stations).map(x=>x.lager),
                         ...Object.values(s.ships).map(x=>x.ladung)])
     for(const [w,n] of Object.entries(holder)){assert(Number.isSafeInteger(n)&&n>=0);goods[w]=(goods[w]||0)+n;}
   for(const [w,l] of Object.entries(s.ledger))
     assert.equal(goods[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
       'independent goods '+w);
   assert.equal(a.core.hash(s),b.core.hash(q),'deterministic replay');
   hourly++;
  }
  if(t===14*1440)day14hash=a.core.hash(s);
  if(t%1440===0&&[14,30,60,90].includes(t/1440)){
   for(const [world,core] of [[s,a.core],[q,b.core]])
     assert.equal(core.hash(core.load(core.save(world),undefined,r)),core.hash(world),'save/load');
   saves+=2;
  }
 }
 assert(launched,'one original freighter and escort(s) activated');
 assert.equal(hourly,2160);assert.equal(saves,8);
 assert.deepEqual(JSON.parse(JSON.stringify(o)),JSON.parse(JSON.stringify(p)));
 assert.equal(day14hash,seed===42?'070faf864387fe53':'6e157d8d052dddfc','baseline day14 unchanged');
 const result={seed,arm,sourceHash:sha(original),variantHash:sha(src),hash:a.core.hash(s),
  day14hash,checks:hourly,saves,launched,startedFreighter,startedFighters,
  paidHulls:o.hulls,npc3Cash:s.owners.npc3.cash,npc3Unpaid:o.due-o.paid,
  fighterCost:o.fighterWork,freighterCost:o.freightWork,
  npc3FreightersEnd:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='frachter').length,
  npc3FightersEnd:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='jaeger').length,
  worldTrade:s.stats.handel,nutrition:s.ledger.nahrung.consumed,
  medications:s.ledger.medikamente.consumed,
  ...o};
 assert(o.freightLosses.some(x=>x.id===startedFreighter),'first ship actually destroyed');
 assert(o.paidHulls.frachter>=1&&o.paidHulls.jaeger>=fightersNeeded,'really purchased');
 return result;
}
const all=[];
for(const seed of [42,7])for(const arm of ['assigned','coflight1','mandatory1','coflight2'])
  all.push(run(seed,arm));
const hash={
 '42|assigned':'5b6d871e7b4845cd','7|assigned':'89e8ef345b24e3af',
 '42|coflight1':'a3d4bb979f1ffd9f','7|coflight1':'dfa48693f15a063d',
 '42|mandatory1':'a3d4bb979f1ffd9f','7|mandatory1':'dfa48693f15a063d',
 '42|coflight2':'8a9b8eb1f95329ee','7|coflight2':'a020d593da01a9ba'
};
for(const z of all){
 assert.equal(z.hash,hash[z.seed+'|'+z.arm],'expected independently observed real simulation');
 if(z.arm==='assigned')assert(z.attacks.every(x=>x.escorts.length===0),'assigned only never protected');
 else assert(z.attacks.some(x=>x.escorts.length=== (z.arm==='coflight2'?2:1)),
   'real combat with co-flying paid escort(s)');
 if(z.arm==='mandatory1')assert.equal(z.blockedCount,0,'control gate not activated in tested routes');
}
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'e1-results.json'),JSON.stringify(all,null,2)+'\n');}
console.log('E1_ESCORT_AUDIT_PASS '+JSON.stringify(all.map(x=>({seed:x.seed,arm:x.arm,
 hash:x.hash,checks:x.checks,saves:x.saves,firstShip:x.startedFreighter,
 firstShipLost:x.freightLosses.some(z=>z.id===x.startedFreighter),
 attacks:x.attacks.map(z=>z.escorts.length),paidHulls:x.paidHulls,
 npc3Cash:x.npc3Cash,npc3Unpaid:x.npc3Unpaid,
 fightersLost:x.fighterLosses.length,blocked:x.blockedCount}))));
