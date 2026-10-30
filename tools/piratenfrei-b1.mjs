// Vier historische B1-Spielerfälle, unveränderte validierte Befehle, aktuelle Regel 13.
// Piratenschutz nur in dynamisch abgeleitetem Analyse-Core, nicht in index.html.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {BASE,MODES,PINS,SHA,readCore,changePirates,instrumentPirateTarget,independentlyAudit,calculateSnapshot} from './piratenfrei-common.mjs';
const args=process.argv.slice(2);
const opt=(k,d)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(x=>/^--(case|evidence|b1|starts|out)=/.test(x)));
const scenario=opt('case','miner'),seed={miner:42,'handel-flotte':42,station:1234,jagd:98765}[scenario];
assert(seed,'nur vier gepinnte B1-Fälle zulässig');
const evidence=opt('evidence','/tmp/pirat-evidence'),b1dir=opt('b1','/tmp/pirat-b1'),startDir=opt('starts','/tmp/pirat-start'),out=opt('out','/tmp/piraten-b1');
const obsText=fs.readFileSync(path.join(evidence,'tools/longterm-v12-observer.mjs'),'utf8');
assert.equal(SHA(obsText),'6f5c2a2a0e16b47a63160889d425250d6c37a651673cfdd83a63824d943eaee0');
const {engine,coreSource,Observer,independentAudit,sum}=await import('data:text/javascript;base64,'+Buffer.from(obsText).toString('base64'));
const b1=JSON.parse(fs.readFileSync(path.join(b1dir,'docs/data/b1-handelszyklus-v12.json'),'utf8')).cases.find(x=>x.scenario===scenario);
assert.equal(b1.start.tick,129600);
const prepared=JSON.parse(fs.readFileSync(path.join(startDir,'start-'+scenario+'-'+seed+'.json'),'utf8'));
const legacyHtml=fs.readFileSync(path.join(evidence,'index.html'),'utf8');
const legacy=engine(coreSource(legacyHtml));
assert.equal(legacy.r.rulesVersion,12);
assert.equal(legacy.c.hash(legacy.c.load(prepared.save)),b1.start.hash,'B1-Save bit-identisch');
const html=readCore(),src=coreSource(html);
const fixed=engine(src);
assert.equal(fixed.r.rulesVersion,13);
const migrated=fixed.c.load(prepared.save,undefined,fixed.r);
assert.equal(migrated.rulesVersion,13);
assert.equal(migrated.schema,8);
const initialSave=fixed.c.save(migrated);
const initialHash=fixed.c.hash(migrated);
const expectedCommands=b1.active.commands.map(x=>({tick:x.tick,cmd:x.cmd}));
const id=expectedCommands.find(x=>x.cmd.type==='shipHandeln').cmd.schiff;

class Watch extends Observer{
 constructor(initial){super(initial);this.s=initial;this.attacks=[];this.fleetLosses=[];this.freighterTrade={buys:0,sells:0,buyValue:0,sellValue:0};
  this.freighterDue=0;this.freighterPaid=0;this.companyCostsDue=0;this.companyCostsPaid=0;
  // Beobachtungsfenster beginnt an Tag 90: ältere Warenverbräuche separat vortragen.
  for(const [ware,ledger] of Object.entries(initial.ledger))this.consumeRows['vor90/'+ware]=ledger.consumed;
 }
 pirateTarget(state,ship,system){
  this.attacks.push({tick:state.tick,system,owner:ship.owner,klasse:ship.klasse,ship:ship.id,
   cash:state.owners[ship.owner].cash,cargo:Object.entries(ship.ladung).reduce((a,[k,n])=>a+n,0)});
 }
 trade(state,ship,station,ware,n,buy,value,fee,recipient){
  super.trade(state,ship,station,ware,n,buy,value,fee,recipient);
  if(ship.owner==='npc3'&&ship.klasse==='frachter'){
   this.freighterTrade[buy?'buys':'sells']++;
   this.freighterTrade[buy?'buyValue':'sellValue']+=value;
  }
 }
 cost(state,ship,due,paid,system,rules){
  super.cost(state,ship,due,paid,system,rules);
  if(ship.owner==='npc3'){this.companyCostsDue+=due;this.companyCostsPaid+=paid;}
  if(ship.owner==='npc3'&&ship.klasse==='frachter'){this.freighterDue+=due;this.freighterPaid+=paid;}
 }
 lost(ship){
  if(ship.owner==='npc3'&&(ship.klasse==='frachter'||ship.klasse==='miner'))
   this.fleetLosses.push({tick:this.s.tick,ship:ship.id,klasse:ship.klasse,cargo:{...ship.ladung}});
  super.lost(ship);
 }
}
const results=[];
for(const mode of MODES){
 const changed=changePirates(src,mode),plain=engine(changed);
 const state=plain.c.load(initialSave,undefined,plain.r);
 const w=new Watch(state),instrumented=engine(instrumentPirateTarget(changed),w);
 let replay=plain.c.load(initialSave,undefined,plain.r);
 assert.equal(plain.c.hash(state),initialHash);
 assert.equal(instrumented.c.hash(state),initialHash);
 let commands=0,roundtrips=0,hours=0,firstDeath=null;
 const daily=[],checkpoints=[];
 for(let tick=1;tick<=275*1440;tick++){
  while(expectedCommands[commands]?.tick===state.tick+1){
   const {cmd}=expectedCommands[commands++];
   const a=instrumented.c.submit(state,cmd,instrumented.r),b=plain.c.submit(replay,cmd,plain.r);
   assert(a.ok && b.ok,mode+'/'+scenario+'/'+cmd.type+': '+JSON.stringify({a,b}));
  }
  const a=instrumented.c.step(state,instrumented.r),b=plain.c.step(replay,plain.r);
  assert.deepEqual(a,b);
  assert(a.every(x=>x.ok),'B1-Queue-Befehl gültig');
  if(firstDeath===null&&state.tick>=129664&&!state.ships[id])firstDeath=state.tick;
  if(tick%60===0){
   assert(instrumented.c.audit(state).ok,'instrumentiertes Geld/Warenaudit');
   assert(plain.c.audit(replay).ok);
   independentlyAudit(state);independentlyAudit(replay);
   independentAudit(state);independentAudit(replay);
   assert.equal(instrumented.c.hash(state),plain.c.hash(replay),'B1 deterministischer Stundenhash');
   w.hourly(state,instrumented.c,instrumented.r);
   hours++;
  }
  if(tick%1440===0){
   daily.push({day:tick/1440,hash:instrumented.c.hash(state)});
   if([1,7,30,90,180,275].includes(tick/1440)){
    checkpoints.push({day:tick/1440,...calculateSnapshot(state,instrumented.r,
      {npc3Unpaid:w.companyCostsDue-w.companyCostsPaid,hash:instrumented.c.hash(state)}),
     originalFreighterAlive:!!state.ships[id],freighterTrade:{...w.freighterTrade},
     freightDue:w.freighterDue,freightPaid:w.freighterPaid,
     npc3Attacks:w.attacks.filter(x=>x.owner==='npc3').length});
    for(const s of [state,replay]){
     assert.equal(plain.c.hash(plain.c.load(plain.c.save(s))),plain.c.hash(s),'Save/Load-Roundtrip');
     roundtrips++;
    }
    replay=plain.c.load(plain.c.save(replay));
   }
  }
 }
 assert.equal(commands,expectedCommands.length);
 assert.equal(hours,6600);
 assert.equal(roundtrips,12);
 assert.equal(daily.length,275);
 assert.equal(instrumented.c.hash(state),plain.c.hash(replay));
 if(mode==='no_raids')assert.equal(w.attacks.length,0,'Überfallbeobachter in friedlicher Variante vollständig leer');
 const result={mode,initialHash,sourceSha:SHA(changed),originalFreighter:id,firstDeath,
  firstLifeHours:firstDeath===null?null:(firstDeath-129664)/60,
  pirateAttacks:w.attacks,freighterLosses:w.fleetLosses,
  cashFlow:w.flows,freighterTrade:w.freighterTrade,freighterDue:w.freighterDue,
  freighterPaid:w.freighterPaid,npc3CostsDue:w.companyCostsDue,npc3CostsPaid:w.companyCostsPaid,
  days:275,hours,roundtrips,daily,checkpoints};
 results.push(result);
 console.log('NO_RAID_B1_CASE '+JSON.stringify({scenario,mode,firstDeath,firstLifeHours:result.firstLifeHours,
  attacks:w.attacks.length,freighterTrade:w.freighterTrade,freightDue:w.freighterDue,
  npc3Unpaid:w.companyCostsDue-w.companyCostsPaid,final:checkpoints.at(-1)}));
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,scenario+'.json'),JSON.stringify({basis:BASE,scenario,seed,toolSha:SHA(fs.readFileSync(new URL(import.meta.url))),legacyB1Hash:b1.start.hash,migratedHash:initialHash,results})+'\n');
console.log('NO_RAID_B1_PASS '+scenario+' 2×275 Tage / 550 Tageshashes / 13200 stündliche Audits beider Engines');
