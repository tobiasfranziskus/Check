// Isolierter Gegenversuch: ausschließlich npcAusgabenArten += 'player' in Testregeln.
// LONGTERM_SOURCE_COMMIT=<SHA> node tools/player-reflux-v12.mjs --case=miner|players|baseline|recovery [--seeds=7,11] [--days=365] [--out=work/rueckfluss]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { coreSource, engine, Observer, independentAudit, sum } from './longterm-v12-observer.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = fs.readFileSync(path.join(root,'index.html'),'utf8'), source = coreSource(html);
const plain = engine(source), baseRules = plain.r;
const pr32 = JSON.parse(fs.readFileSync(path.join(root,'docs/data/wirtschaft-langzeit-v12.json'),'utf8'));
const golden = JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/economy-priority-v12.json'),'utf8'));
const sourceCommit = process.env.LONGTERM_SOURCE_COMMIT || process.env.GITHUB_SHA;
assert(/^[a-f0-9]{40}$/.test(sourceCommit || ''),'Quellcommit erforderlich');
assert.equal(createHash('sha256').update(html).digest('hex'),pr32.codeSha256,'Produktionsdatei gegenüber PR #32 verändert');
const experimentRules = structuredClone(baseRules);
assert.deepEqual(experimentRules.world.npcAusgabenArten,['trader','miner']);
experimentRules.world.npcAusgabenArten.push('player');
const checkRules = structuredClone(experimentRules); checkRules.world.npcAusgabenArten.pop();
assert.deepEqual(checkRules,baseRules,'Ausschließlich Owner-Filter darf abweichen');
const freeze = o => { if(o && typeof o==='object') { Object.freeze(o); for(const v of Object.values(o)) freeze(v); } };
freeze(experimentRules);
const args = process.argv.slice(2), opt = (key,fallback) => args.find(a=>a.startsWith('--'+key+'='))?.split('=')[1] ?? fallback;
assert(args.every(a=>/^--(case|seeds|days|out)=/.test(a)),'Unbekannte Option');
const mode = opt('case','miner'), days = Number(opt('days','365')), out = path.resolve(opt('out','work/rueckfluss'));
assert(['miner','players','baseline','recovery'].includes(mode)); assert(Number.isInteger(days)&&days>=1&&days<=365);
fs.mkdirSync(out,{recursive:true});
const total = o => sum(Object.values(o || {}));
function counters(s) {
 return { shortage:sum(Object.values(s.stats.mangel).flatMap(Object.values)),tradeOperations:s.stats.handel,
   produced:sum(Object.values(s.ledger).map(l=>l.produced)),mined:sum(Object.values(s.ledger).map(l=>l.mined)) };
}
function investment(c,s,r) {
 const own = Object.values(s.ships).filter(sh=>sh.owner==='house');
 const cargo = own.reduce((n,sh)=>n+sum(Object.entries(sh.ladung).map(([w,q])=>q*c.preis(s,r.world.systems[sh.system].station,w,r))),0);
 const hulls = own.reduce((n,sh)=>n+r.economy.waren[sh.klasse].basis,0);
 const stationCash = sum(Object.values(s.stations).filter(st=>st.eigentum==='house').map(st=>s.owners[st.id].cash));
 return {cash:s.owners.house.cash,hullBaseValue:hulls,cargoLocalQuote:cargo,ownedStationCash:stationCash,
   assetProxy:s.owners.house.cash+hulls+cargo+stationCash,ownedStations:Object.values(s.stations).filter(st=>st.eigentum==='house').map(st=>st.id)};
}
class CashObserver extends Observer {
 constructor(s) { super(s); this.state=s; this.maxDuringCore=s.owners.house.cash; this.maxBeforePlayerSweep=0; this.playerSweepCount=0; this.firstPlayerSweepTick=null; this.lastPlayerSweepTick=null; }
 flow(kind,from,to,n) {
  super.flow(kind,from,to,n);
  if(this.state) this.maxDuringCore=Math.max(this.maxDuringCore,this.state.owners.house.cash);
  if(kind==='npcAbgabe' && from==='house' && n>0) {
   this.playerSweepCount++; this.firstPlayerSweepTick ??= this.state.tick; this.lastPlayerSweepTick=this.state.tick;
   this.maxBeforePlayerSweep=Math.max(this.maxBeforePlayerSweep,this.state.owners.house.cash+n);
  }
 }
}
function createTrack(label,seed) {
 const state = plain.c.createState(seed), watch = new CashObserver(state), {c} = engine(source,watch);
 return {label,c,watch,state,replay:plain.c.createState(seed),points:[],daily:[],commandResults:[],episodes:{npc1:[],npc2:[]},
   budget:{maxCommandWindowCash:2000,first8000Tick:null,ticksAtLeast8000:0,firstAffordableStation:null,first8000AffordableStation:null},
   lastCounters:counters(state),lastTradeTick:0,lastProductionTick:0,lastMiningTick:0,firstDifferenceTick:null,
   firstTradeAfterSwitch:null,firstProductionAfterSwitch:null,firstMiningAfterSwitch:null};
}
function sampleBudget(t,r) {
 const s=t.state,c=t.c,b=t.budget,cash=s.owners.house.cash;
 b.maxCommandWindowCash=Math.max(b.maxCommandWindowCash,cash);
 if(cash>=8000){ b.first8000Tick ??= s.tick; b.ticksAtLeast8000++; }
 if(!b.firstAffordableStation || (!b.first8000AffordableStation && cash>=8000)) {
  const sh=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.phase==='dock'&&!s.stations[r.world.systems[sh.system].station].eigentum
    && Object.values(s.stations).filter(st=>st.eigentum==='house').length<r.world.reichsgroesse
    && cash>=c.stationspreis(s,r,r.world.systems[sh.system].station));
  if(sh){
   const station=r.world.systems[sh.system].station, price=c.stationspreis(s,r,station), copy=c.load(c.save(s),undefined,r);
   // Kauf-Fähigkeit mit echtem Core-Befehl auf Wegwerfkopie prüfen; Haupttrajektorie unverändert.
   const result=plain.c.execute(copy,{owner:'house',type:'stationBuy',schiff:sh.id},r);
   assert(result.ok); independentAudit(copy); assert(c.audit(copy).ok);
   const point={tick:s.tick,cash,station,price,ship:sh.id,verifiedWithExecute:true};
   b.firstAffordableStation ??= point;
   if(cash>=8000) b.first8000AffordableStation ??= point;
  }
 }
}
function point(t,r) {
 const s=t.state, w=t.watch, cashByKind={};
 for(const o of Object.values(s.owners)) cashByKind[o.kind]=(cashByKind[o.kind]||0)+o.cash;
 const houseFlows=Object.fromEntries(Object.entries(w.flows).filter(([k])=>k.includes(':house>')||k.endsWith('>house')));
 const flows={};for(const [k,n] of Object.entries(w.flows)) flows[k.split(':')[0]]=(flows[k.split(':')[0]]||0)+n;
 return structuredClone({day:s.tick/1440,hash:t.c.hash(s),...counters(s),cash:Object.fromEntries(Object.values(s.owners).map(o=>[o.id,o.cash])),cashByKind,
   investment:investment(t.c,s,r),budget:t.budget,houseFlows,flows,ledger:s.ledger,shortageByStation:s.stats.mangel,
   fleets:Object.fromEntries(['house','npc1','npc2','npc3','security'].map(id=>[id,Object.values(s.ships).filter(sh=>sh.owner===id).length])),
   costs:w.costs,liquidity:w.liquidity,fleetHistory:w.fleet,losses:s.stats.verluste,replacements:s.stats.indienst,
   subsidy:s.stats.zuschuss,minted:s.minted,burned:s.burned,initialSupply:s.initialSupply,
   playerSurplus:s.stats.abgabe.house||0,playerSweepCount:w.playerSweepCount,maxBeforePlayerSweep:w.maxBeforePlayerSweep,
   maxDuringCore:w.maxDuringCore,episodes:t.episodes,commandResults:t.commandResults});
}
function fixedTape(seed,scenario) {
 if(scenario==='miner')return [{tick:1,owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}];
 if(scenario==='baseline')return [];
 const row=pr32.players.find(r=>r.seed===seed && r.scenario===scenario); assert(row);return structuredClone(row.commands);
}
function checkReference(t,seed,scenario,p) {
 let checked=false;
 if(scenario==='miner' && p.day===90){
  const ref=JSON.parse(fs.readFileSync(path.join(root,'docs/data/wirtschaft-langzeit-v12-spielerkontrollen.json'),'utf8'));
  checked=true; assert.equal(p.hash,ref.results.find(r=>r.scenario==='nur-miner').points.find(p=>p.day===90).hash,'Unveränderte Miner-Kontrolle');
 } else if(scenario!=='miner') {
  const ref=[...pr32.baseline,...pr32.players].find(r=>r.seed===seed&&r.scenario===scenario)?.points.find(q=>q.day===p.day);
  if(ref){checked=true;assert.equal(p.hash,ref.hash,'Unveränderte PR32-Referenz '+scenario+'/'+seed+'/'+p.day);assert.equal(p.shortage,ref.metrics.shortage);}
 }
 if(scenario==='baseline' && p.day===90){
  const ref=golden.results.find(r=>r.seed===seed), shortage={};
  for(const row of Object.values(p.shortageByStation))for(const [ware,n]of Object.entries(row))shortage[ware]=(shortage[ware]||0)+n;
  const actual={seed,totalShortage:p.shortage,foodShortage:shortage.nahrung||0,partsShortage:shortage.bauteil||0,medicineShortage:shortage.medikamente||0,
   foodAldera:p.shortageByStation.st_aldera.nahrung,foodDravos:p.shortageByStation.st_dravos.nahrung,
   traderSales:sum(Object.entries(t.watch.trades).filter(([k])=>/^npc[12]\/frachter\/.*\/verkauf$/.test(k)).map(([,v])=>v.count)),
   npc1Unpaid:p.costs.npc1.unpaid,npc2Unpaid:p.costs.npc2.unpaid,stationsCash:p.cashByKind.station,fundCash:p.cashByKind.fund,traderCash:p.cashByKind.trader,
   civilianLosses:sum(['npc1','npc2','npc3'].flatMap(id=>Object.values(p.losses[id]||{}))),minted:p.minted,burned:p.burned};
  checked=true;assert.deepEqual(actual,ref,'Alle unabhängigen v12-Fixwerte');
 }
 return checked;
}
function applyCommand(t,entry,r) {
 const {tick,...cmd}=entry;
 const a=t.c.submit(t.state,cmd,r),b=plain.c.submit(t.replay,cmd,r); assert.deepEqual(a,b);
 t.commandResults.push({tick,type:cmd.type,schiff:cmd.schiff,submit:a});
 if(t.label==='control')assert(a.ok,'Produktive Befehlsfolge muss unverändert erfolgreich sein');
}
function run(seed,scenario,switchDay=0) {
 const started=performance.now(),cpuStart=process.cpuUsage(),tape=fixedTape(seed,scenario),tracks=[createTrack('control',seed),createTrack(switchDay?'player-ab90':'player',seed)];
 const checkpointDays=[30,90,180,365,days].filter(d=>d<=days), renames=new Set(tape.filter(x=>x.type==='shipRename'&&[90*1440+1,180*1440+1].includes(x.tick)).map(x=>x.tick));
 const byTick=new Map();for(const e of tape){if(!byTick.has(e.tick))byTick.set(e.tick,[]);byTick.get(e.tick).push(e);}
 let audits=0,hashComparisons=0,referenceChecks=0;
 for(let tick=1;tick<=days*1440;tick++){
  for(const [i,t] of tracks.entries()){
   const r=i===0 || tick<=switchDay*1440 ? baseRules : experimentRules;
   for(const cmd of byTick.get(tick)||[])if(!renames.has(tick)||cmd.type!=='shipRename')applyCommand(t,cmd,r);
   const a=t.c.step(t.state,r),b=plain.c.step(t.replay,r);assert.deepEqual(a,b,'Replay-Befehlsausgang');
   if(i===0)assert(a.every(x=>x.ok),'Produktive Befehle müssen erfolgreich sein');
   if(a.length)t.commandResults.push({tick,executions:a});
   sampleBudget(t,r);
   if(tick%60===0){
    assert(t.c.audit(t.state).ok);assert(plain.c.audit(t.replay).ok);independentAudit(t.state);independentAudit(t.replay);t.watch.hourly(t.state,t.c,r);audits+=2;
    for(const id of ['npc1','npc2']){
     const count=Object.values(t.state.ships).filter(sh=>sh.owner===id).length,eps=t.episodes[id],last=eps.at(-1);
     if(!count && (!last||last.endTick!==null))eps.push({startTick:tick,endTick:null});
     if(count && last && last.endTick===null)last.endTick=tick;
    }
    const now=counters(t.state);
    for(const [field,timeField,recoveryField]of [['tradeOperations','lastTradeTick','firstTradeAfterSwitch'],['produced','lastProductionTick','firstProductionAfterSwitch'],['mined','lastMiningTick','firstMiningAfterSwitch']]){
     if(now[field]>t.lastCounters[field]){t[timeField]=tick;if(switchDay && tick>switchDay*1440)t[recoveryField]??=tick;}
    }
    t.lastCounters=now;
   }
   if(tick%1440===0){
    const hash=t.c.hash(t.state);assert.equal(hash,plain.c.hash(t.replay),'Täglicher Replayhash');hashComparisons++;
    t.daily.push({day:tick/1440,hash,...counters(t.state),cash:t.state.owners.house.cash,playerSurplus:t.state.stats.abgabe.house||0});
   }
  }
  const [control,experiment]=tracks;
  if(control.state.rng!==experiment.state.rng || control.state.owners.house.cash!==experiment.state.owners.house.cash)
   experiment.firstDifferenceTick ??= tick;
  if(tick%1440===0 && (scenario==='baseline'||tick<=switchDay*1440))assert.equal(control.c.canonical(control.state),experiment.c.canonical(experiment.state),'Vor Eingriff / inaktive Baseline identisch');
  if(checkpointDays.includes(tick/1440)){
   for(const [i,t]of tracks.entries()){
    const r=i===0||tick<=switchDay*1440?baseRules:experimentRules;
    for(const cmd of byTick.get(tick+1)||[])if(renames.has(cmd.tick)&&cmd.type==='shipRename')applyCommand(t,cmd,r);
    assert.equal(t.c.canonical(t.state),plain.c.canonical(t.replay));
    const loaded=t.c.load(t.c.save(t.state),undefined,r);assert.equal(t.c.canonical(loaded),t.c.canonical(t.state));
    t.replay=plain.c.load(plain.c.save(t.replay),undefined,r);assert.equal(t.c.canonical(t.state),plain.c.canonical(t.replay));
    t.points.push(point(t,r));
    if(i===0 || scenario==='baseline')if(checkReference(t,seed,scenario,t.points.at(-1)))referenceChecks++;
   }
   console.log('REFLUX_POINT '+JSON.stringify({seed,scenario,switchDay,day:tick/1440,rows:tracks.map(t=>({variant:t.label,hash:t.points.at(-1).hash,shortage:t.points.at(-1).shortage,cash:t.state.owners.house.cash,fleets:t.points.at(-1).fleets,budget:t.budget}))}));
  }
 }
 const cpu=process.cpuUsage(cpuStart),result={sourceCommit,baseCommit:'ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f',diagnosisCommit:'8cd87134c3c5869319455b3670e92f3e42133027',
  codeSha256:pr32.codeSha256,toolSha256:createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).update(fs.readFileSync(new URL('./longterm-v12-observer.mjs',import.meta.url))).digest('hex'),
  ruleDelta:{world:{npcAusgabenArten:{before:baseRules.world.npcAusgabenArten,after:experimentRules.world.npcAusgabenArten}}},seed,scenario,switchDay,days,tape,
  audits,hashComparisons,referenceChecks,node:process.version,runtime:{wallSeconds:(performance.now()-started)/1000,cpuSeconds:(cpu.user+cpu.system)/1e6,peakRssKiB:process.resourceUsage().maxRSS},
  variants:tracks.map(t=>({label:t.label,points:t.points,daily:t.daily,budget:t.budget,episodes:t.episodes,commandResults:t.commandResults,
   lastTradeTick:t.lastTradeTick,lastProductionTick:t.lastProductionTick,lastMiningTick:t.lastMiningTick,firstDifferenceTick:t.firstDifferenceTick,
   firstTradeAfterSwitch:t.firstTradeAfterSwitch,firstProductionAfterSwitch:t.firstProductionAfterSwitch,firstMiningAfterSwitch:t.firstMiningAfterSwitch}))};
 fs.writeFileSync(path.join(out,scenario+'-'+seed+(switchDay?'-ab90':'')+'.json'),JSON.stringify(result)+'\n');
 console.log('REFLUX_PASS '+JSON.stringify({seed,scenario,switchDay,audits,hashComparisons,runtime:result.runtime}));
}
if(mode==='miner')run(42,'miner');
if(mode==='players')for(const [seed,scenario]of [[42,'handel-flotte'],[1234,'station'],[98765,'jagd']])run(seed,scenario);
if(mode==='recovery')for(const [seed,scenario]of [[42,'miner'],[1234,'station']])run(seed,scenario,90);
if(mode==='baseline')for(const seed of opt('seeds',pr32.seeds.join(',')).split(',').map(Number)){assert(pr32.seeds.includes(seed));run(seed,'baseline');}
