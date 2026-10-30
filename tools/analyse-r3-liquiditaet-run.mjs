// Aphros Void: R3-Zielabgabe und Liquiditätsdiagnose auf dem B5b-main-Kern.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {SHA,BASE,MODES,SEEDS,source,readCore,variant,observedSource,engine,
 independentlyAudit,Watch,snapshot} from './analyse-r3-liquiditaet-common.mjs';

const opts=Object.fromEntries(process.argv.slice(2).map(v=>{
 assert(/^--[a-z-]+=.*/.test(v));const i=v.indexOf('=');return [v.slice(2,i),v.slice(i+1)];
}));
const type=opts.type||'standard',seed=Number(opts.seed||42),scenario=opts.scenario||'miner';
assert(['standard','player-miner','player-auto','b1'].includes(type));
if(type==='standard')assert(SEEDS.includes(seed));
else if(type==='b1')assert({miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario]===seed);
else assert([1,2,3,4].includes(seed));
const htmlSource=readCore(),original=engine(htmlSource);
const golden=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-priority-v12.json',import.meta.url),'utf8'));
const reference=golden.results.find(x=>x.seed===seed);
assert.equal(original.r.rulesVersion,14);assert.equal(original.r.schema,8);
let initialSave,initialHash,commands=[],legacyHash=null;
if(type==='b1'){
 const evidence=opts.evidence||'/tmp/r3-evidence',b1dir=opts.b1||'/tmp/r3-b1',starts=opts.starts||'/tmp/r3-start';
 const b1=JSON.parse(fs.readFileSync(path.join(b1dir,'docs/data/b1-handelszyklus-v12.json'),'utf8')).cases.find(x=>x.scenario===scenario);
 assert(b1,'B1-Fall fehlt');
 const prepared=JSON.parse(fs.readFileSync(path.join(starts,'start-'+scenario+'-'+seed+'.json'),'utf8'));
 const old=engine(source(fs.readFileSync(path.join(evidence,'index.html'),'utf8')));
 assert.equal(old.r.rulesVersion,12);
 assert.equal(old.c.hash(old.c.load(prepared.save)),b1.start.hash,'originaler Regel-12-B1-Start-Hash');
 const migrated=original.c.load(prepared.save,undefined,original.r);
 assert.equal(migrated.rulesVersion,14);assert.equal(migrated.tick,129600);
 initialSave=original.c.save(migrated);initialHash=original.c.hash(migrated);
 legacyHash=b1.start.hash;commands=b1.active.commands.map(x=>({tick:x.tick,cmd:x.cmd}));
}else{
 const base=original.c.createState(seed,original.r);
 initialSave=original.c.save(base);initialHash=original.c.hash(base);
 if(type!=='standard'){
  const miner=Object.values(base.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(miner);commands.push({tick:1,cmd:{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'}});
  if(type==='player-auto'){
   const f=Object.values(base.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
   assert(f);commands.push({tick:1,cmd:{type:'shipHandeln',owner:'house',schiff:f.id}});
  }
 }
}
const days=type==='b1'?275:90,results=[];
for(const mode of MODES){
 const modified=variant(htmlSource,mode),observed=observedSource(modified);
 const watch=new Watch(),ins=engine(observed,watch),plain=engine(modified);
 const state=ins.c.load(initialSave,undefined,ins.r);let replay=plain.c.load(initialSave,undefined,plain.r);
 assert.equal(ins.c.hash(state),initialHash);assert.equal(plain.c.hash(replay),initialHash);
 let cmdIdx=0,hours=0,roundtrips=0;const points=[],daily=[];
 const checkpoints=new Set(type==='b1'?[1,7,30,60,90,180,275]:[1,3,7,30,60,90]);
 for(let t=1;t<=days*1440;t++){
  while(commands[cmdIdx]?.tick===state.tick+1){
   const cmd=commands[cmdIdx++].cmd;
   const a=ins.c.submit(state,cmd,ins.r),b=plain.c.submit(replay,cmd,plain.r);
   assert(a.ok&&b.ok,'Befehl abgelehnt '+JSON.stringify({mode,cmd,a,b}));
  }
  const a=ins.c.step(state,ins.r),b=plain.c.step(replay,plain.r);
  assert.deepEqual(a,b,'Beobachter ohne Seiteneffekt');
  assert(a.every(x=>x.ok),'Fehler in geplanter Queue '+state.tick);
  if(t%60===0){
   assert(ins.c.audit(state).ok,'Core-Geld-/Warenaudit');
   assert(plain.c.audit(replay).ok,'Replay-Audit');
   independentlyAudit(state);independentlyAudit(replay);
   assert.equal(ins.c.hash(state),plain.c.hash(replay),'stündlicher Replay-Hash');
   watch.hour(state,ins.r,ins.c);hours++;
  }
  if(t%1440===0){
   const day=t/1440;daily.push({day,hash:ins.c.hash(state),house:state.owners.house.cash});
   if(checkpoints.has(day)){
    points.push({relativeDay:day,...snapshot(state,ins.r,watch,ins.c)});
    assert.equal(ins.c.hash(ins.c.load(ins.c.save(state))),ins.c.hash(state),'Save/Load');
    assert.equal(plain.c.hash(plain.c.load(plain.c.save(replay))),plain.c.hash(replay),'Replay Save/Load');
    replay=plain.c.load(plain.c.save(replay));roundtrips+=2;
   }
  }
 }
 assert.equal(cmdIdx,commands.length);assert.equal(hours,days*24);assert.equal(daily.length,days);
 const end=points.at(-1),extra=watch.summary();
 if(type==='standard'&&mode==='control'){
  assert.equal(end.shortage,reference.totalShortage,'historischer 13-Seed-Mangelwert');
  const sales=(extra.trade.npc1?.byClass.frachter?.sells||0)+(extra.trade.npc2?.byClass.frachter?.sells||0);
  assert.equal(sales,reference.traderSales,'historische NPC-Händler-Verkäufe');
 }
 results.push({mode,sourceSha:SHA(modified),initialHash,days,hours,roundtrips,points,daily,extra});
 console.log('R3_CASE '+JSON.stringify({type,seed,scenario,mode,end:{
  shortage:end.shortage,recipes:end.recipes,house:end.cash.house,
  stationCash:end.cashByKind.station,fundCash:end.cashByKind.fund,
  traderSales:(extra.trade.npc1?.byClass.frachter?.sells||0)+(extra.trade.npc2?.byClass.frachter?.sells||0),
  npc3FreighterSales:extra.trade.npc3?.byClass.frachter?.sells||0,
  npc3Unpaid:extra.unpaid.npc3||0,aldera:end.aldera,
  rawNearCapRatio:extra.rawNearCapRatio,alderaErzFactor:extra.alderaErzFactor,
  cycles:extra.cycles,zeroStations:end.zeroStations.length}}));
}
const report={base:BASE,rule:14,type,seed,b1Case:type==='b1'?scenario:null,
 legacyHash,initialHash,commands:commands.map(x=>({tick:x.tick,type:x.cmd.type,ship:x.cmd.schiff})),results};
const out=opts.out||'/tmp/r3-results';
const filename=type==='b1'?'b1-'+scenario+'-'+seed+'.json':type+'-'+seed+'.json';
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,filename),JSON.stringify(report)+'\n');
console.log('R3_RUN_PASS '+JSON.stringify({type,seed,scenario,days,variants:MODES.length,
 dayHashes:days*MODES.length,hourlyReplayAudits:days*24*MODES.length,filename}));
