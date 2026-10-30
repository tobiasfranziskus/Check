// Diagnose und isolierte Wiederanlaufversuche ab Tag 90 ohne Spielerabgabe.
// node tools/npc-restart-v12.mjs --prepare | --case=miner,42 --variant=fonds-pool [--out=work/npc-restart]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {coreSource,engine,Observer,independentAudit,sum} from './longterm-v12-observer.mjs';
import {variants,variantSource} from './npc-restart-v12-variants.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=coreSource(html);
const plain=engine(source),r=plain.r,pr32=JSON.parse(fs.readFileSync(path.join(root,'docs/data/wirtschaft-langzeit-v12.json'),'utf8')),
 pr33=JSON.parse(fs.readFileSync(path.join(root,'docs/data/spieler-rueckfluss-v12.json'),'utf8'));
assert.equal(createHash('sha256').update(html).digest('hex'),pr32.codeSha256);assert.deepEqual(r.world.npcAusgabenArten,['trader','miner']);
const args=process.argv.slice(2),opt=(k,d)=>args.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(args.every(a=>a==='--prepare'||/^--(case|variant|out)=/.test(a)));
const out=path.resolve(opt('out','work/npc-restart')),sourceCommit=process.env.LONGTERM_SOURCE_COMMIT||process.env.GITHUB_SHA;
assert(/^[a-f0-9]{40}$/.test(sourceCommit||''));fs.mkdirSync(out,{recursive:true});
const cases=[['miner',42],['handel-flotte',42],['station',1234],['jagd',98765]],switchTick=90*1440,endTick=365*1440;
const count=(s,owner)=>Object.values(s.ships).filter(sh=>sh.owner===owner).length;
const total=o=>sum(Object.values(o||{}));
const copy=o=>structuredClone(o);
function tapeFor(scenario,seed){return scenario==='miner'?[{tick:1,owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}]:copy(pr32.players.find(p=>p.seed===seed&&p.scenario===scenario).commands);}
function reference(scenario,seed,day){return pr33.cases.find(c=>c.scenario===scenario&&c.seed===seed&&!c.switchDay).variants[0].points.find(p=>p.day===day);}
function supply(s){return sum(Object.values(s.stats.mangel).flatMap(Object.values));}
function diagnosis(s,c){
 const werft=r.world.werft,fund=r.world.systems[s.stations[werft].system].fonds,price=c.preis(s,werft,'frachter',r),fee=c.gebuehr(s,r,werft,price);
 const byKind={};for(const o of Object.values(s.owners))byKind[o.kind]=(byKind[o.kind]||0)+o.cash;
 const stocks=Object.fromEntries(Object.entries(s.stations).map(([id,st])=>[id,copy(st.lager)]));
 return {tick:s.tick,hash:c.hash(s),cash:Object.fromEntries(Object.values(s.owners).map(o=>[o.id,o.cash])),cashByKind:byKind,
  fleets:Object.fromEntries(['npc1','npc2','npc3','house'].map(id=>[id,count(s,id)])),
  werft,fund,price,fee,totalPrice:price+fee,werftStock:stocks[werft],stocks,
  subsidyGap:Object.fromEntries(['npc1','npc2'].map(id=>[id,Math.max(0,price+fee-s.owners[id].cash-s.owners[fund].cash)])),
  poolGap:Object.fromEntries(['npc1','npc2'].map(id=>[id,Math.max(0,price+fee-s.owners[id].cash-(byKind.fund||0))])),
  productionLines:s.stations[werft].linien.map(l=>({recipe:l.rezept,rest:l.rest,inputs:Object.fromEntries(Object.entries(r.economy.rezepte[l.rezept].ein).map(([ware,n])=>[ware,{need:n,stock:s.stations[werft].lager[ware]||0}]))})),
  short:supply(s),ledger:copy(s.ledger),abgabePlayer:s.stats.abgabe.house||0};
}
function prefix(scenario,seed){
 const tape=tapeFor(scenario,seed),schedule=new Map();for(const cmd of tape){if(!schedule.has(cmd.tick))schedule.set(cmd.tick,[]);schedule.get(cmd.tick).push(cmd);}
 const s=plain.c.createState(seed),replay=plain.c.createState(seed),watch=new Observer(s),{c}=engine(source,watch);let audits=0;
 for(let tick=1;tick<=switchTick;tick++){
  for(const {tick:_,...cmd}of schedule.get(tick)||[]){assert(c.submit(s,cmd,r).ok);assert(plain.c.submit(replay,cmd,r).ok);}
  const a=c.step(s,r),b=plain.c.step(replay,r);assert.deepEqual(a,b);assert(a.every(x=>x.ok));
  if(tick%60===0){for(const state of [s,replay]){assert(c.audit(state).ok);independentAudit(state);audits++;}watch.hourly(s,c,r);}
  if(tick%1440===0)assert.equal(c.hash(s),plain.c.hash(replay));
 }
 const preSave=c.save(s);
 for(const {tick:_,...cmd}of schedule.get(switchTick+1)||[])if(cmd.type==='shipRename'){assert(c.submit(s,cmd,r).ok);assert(plain.c.submit(replay,cmd,r).ok);}
 assert.equal(c.canonical(s),plain.c.canonical(replay));assert.equal(c.hash(s),reference(scenario,seed,90).hash,'Unverändertes Tag-90-Diagnosefundament');
 const saved=c.save(s);assert.equal(c.canonical(c.load(saved,undefined,r)),c.canonical(s));
 const data={sourceCommit,codeSha256:pr32.codeSha256,scenario,seed,tape,audits,diagnosis:diagnosis(s,c),flowsBefore90:watch.flows,costsBefore90:watch.costs,
  statsBefore90:copy(s.stats),save:saved,saveWithoutQueuedRename:preSave};
 fs.writeFileSync(path.join(out,'start-'+scenario+'-'+seed+'.json'),JSON.stringify(data)+'\n');
 console.log('RESTART_DIAG '+JSON.stringify({scenario,seed,...data.diagnosis}));
}
class RestartObserver extends Observer{
 constructor(s){super(s);for(const [w,l]of Object.entries(s.ledger))this.consumeRows['vor90/initial/'+w]=l.consumed;this.shipPurchases=[];this.npcTrades=[];this.firstTrade={};this.losses=[];this.s=s;}
 trade(state,ship,station,ware,n,buy,value,fee,recipient){
  super.trade(state,ship,station,ware,n,buy,value,fee,recipient);
  if(!['npc1','npc2'].includes(ship.owner))return;
  if(buy&&ware==='frachter'&&n===1){this.shipPurchases.push({tick:state.tick,owner:ship.owner,id:ship.id,station,value,fee,cashAfter:state.owners[ship.owner].cash,stockBefore:state.stations[station].lager[ware]+1,stockAfter:state.stations[station].lager[ware],firstCargoBuy:null,firstCargoSale:null,lossTick:null});}
  else{
   const row={tick:state.tick,owner:ship.owner,id:ship.id,station,ware,n,buy,value,fee,cashAfter:state.owners[ship.owner].cash};this.npcTrades.push(row);
   const p=this.shipPurchases.find(p=>p.id===ship.id);if(p){if(buy)p.firstCargoBuy??=row;else p.firstCargoSale??=row;}
  }
 }
 lost(ship){super.lost(ship);if(['npc1','npc2'].includes(ship.owner)){const p=this.shipPurchases.find(p=>p.id===ship.id);if(p)p.lossTick=this.s.tick;this.losses.push({tick:this.s.tick,id:ship.id,owner:ship.owner,cargo:copy(ship.ladung)});}}
}
function apply(t,cmd){const a=t.c.submit(t.s,cmd,r),b=t.plain.submit(t.replay,cmd,r);assert.deepEqual(a,b);assert(a.ok,'Festes Befehlsband darf nicht verändert werden');}
function run(scenario,seed,variant){
 assert(variants.includes(variant));const started=performance.now(),cpu=process.cpuUsage(),start=JSON.parse(fs.readFileSync(path.join(out,'start-'+scenario+'-'+seed+'.json'),'utf8'));
 const variantText=variantSource(source,variant),pristine=engine(variantText),s=pristine.c.load(start.save,undefined,r),watch=new RestartObserver(s),{c}=engine(variantText,watch);
 const t={c,plain:pristine.c,s,replay:pristine.c.load(start.save,undefined,r)},daily=[],points=[],fleet={firstBothActive:null,firstBothFull:null,lastBothFull:null,bothActiveHours:0,bothFullHours:0,longestBothFullHours:0,fullRun:0,episodes:{npc1:[],npc2:[]}};
 const schedule=new Map();for(const cmd of start.tape)if(cmd.tick>switchTick){if(!schedule.has(cmd.tick))schedule.set(cmd.tick,[]);schedule.get(cmd.tick).push(cmd);}
 let audits=0,hashes=0,lastNpcTradeCount=0,lastNpcTradeTick=null,noTradeHours=0,longestNoTradeHours=0;
 for(let tick=switchTick+1;tick<=endTick;tick++){
  for(const {tick:_,...cmd}of schedule.get(tick)||[]){if(cmd.type==='shipRename'&&[switchTick+1,180*1440+1].includes(tick))continue;apply(t,cmd);}
  const a=c.step(s,r),b=pristine.c.step(t.replay,r);assert.deepEqual(a,b);assert(a.every(x=>x.ok));
  if(tick%60===0){
   for(const state of [s,t.replay]){assert(c.audit(state).ok);independentAudit(state);audits++;}watch.hourly(s,c,r);assert.equal(s.stats.abgabe.house||0,0,'Keine Spielerabgabe');
   const counts=['npc1','npc2'].map(id=>count(s,id)),active=counts.every(n=>n>0),full=counts.every((n,i)=>n>=s.sollflotte[['npc1','npc2'][i]].length);
   if(active){fleet.firstBothActive??=tick;fleet.bothActiveHours++;}if(full){fleet.firstBothFull??=tick;fleet.lastBothFull=tick;fleet.bothFullHours++;fleet.fullRun++;}else fleet.fullRun=0;
   fleet.longestBothFullHours=Math.max(fleet.longestBothFullHours,fleet.fullRun);
   for(const [i,id]of ['npc1','npc2'].entries()){const ep=fleet.episodes[id],last=ep.at(-1);if(!counts[i]&&(!last||last.end!==null))ep.push({start:tick,end:null});if(counts[i]&&last&&last.end===null)last.end=tick;}
   if(watch.npcTrades.length>lastNpcTradeCount){lastNpcTradeTick=tick;noTradeHours=0;}else noTradeHours++;
   longestNoTradeHours=Math.max(longestNoTradeHours,noTradeHours);lastNpcTradeCount=watch.npcTrades.length;
  }
  if(tick%1440===0){const hash=c.hash(s);assert.equal(hash,pristine.c.hash(t.replay));hashes++;
   daily.push({day:tick/1440,hash,cashHouse:s.owners.house.cash,npc1:count(s,'npc1'),npc2:count(s,'npc2'),short:supply(s),trade:s.stats.handel,npcTrades:watch.npcTrades.length,produced:total(watch.production),werftFrachter:s.stations[r.world.werft].lager.frachter||0,parts:s.stations[r.world.werft].lager.bauteil||0});}
  if([91,100,120,180,270,365].includes(tick/1440)){
   if(tick===180*1440)for(const {tick:_,...cmd}of schedule.get(tick+1)||[])if(cmd.type==='shipRename')apply(t,cmd);
   assert.equal(c.canonical(s),pristine.c.canonical(t.replay));assert.equal(c.canonical(c.load(c.save(s),undefined,r)),c.canonical(s));
   t.replay=pristine.c.load(pristine.c.save(t.replay),undefined,r);assert.equal(c.canonical(s),pristine.c.canonical(t.replay));
   const point={day:tick/1440,...diagnosis(s,c),fleet:copy(fleet),shipPurchases:copy(watch.shipPurchases),npcTrades:watch.npcTrades.length,ledgerProduction:copy(watch.production),costs:copy(watch.costs),flows:copy(watch.flows),stats:copy(s.stats)};
   points.push(point);
   if(variant==='control'&&[180,365].includes(point.day))assert.equal(point.hash,reference(scenario,seed,point.day).hash,'Unveränderte Jahreskontrolle');
   console.log('RESTART_POINT '+JSON.stringify({scenario,seed,variant,day:point.day,hash:point.hash,short:point.short,fleets:point.fleets,paidReplacements:watch.shipPurchases.length,npcTrades:watch.npcTrades.length}));
  }
 }
 assert.equal(watch.shipPurchases.length,['npc1','npc2'].reduce((n,id)=>n+total(s.stats.indienst[id])-total(start.statsBefore90.indienst[id]),0),'Nur tatsächlich bezahlte Ersatzhüllen');
 const cu=process.cpuUsage(cpu),result={sourceCommit,baseCommit:'ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f',diagnosisCommit:'4c55d4b8ebf5e14f818597815d1a9f3e004ed5d8',codeSha256:pr32.codeSha256,
  variant,variantSha256:createHash('sha256').update(variantText).digest('hex'),toolSha256:createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).update(fs.readFileSync(new URL('./npc-restart-v12-variants.mjs',import.meta.url))).update(fs.readFileSync(new URL('./longterm-v12-observer.mjs',import.meta.url))).digest('hex'),
  scenario,seed,days:365,startDay:90,node:process.version,start:start.diagnosis,tape:start.tape,audits,dailyHashComparisons:hashes,saveLoadRoundtrips:points.length*2,points,daily,fleet,
  shipPurchases:watch.shipPurchases,npcTrades:watch.npcTrades,lossesAfter90:watch.losses,lastNpcTradeTick,longestNoTradeHours,
  runtime:{wallSeconds:(performance.now()-started)/1000,cpuSeconds:(cu.user+cu.system)/1e6,maxRssKiB:process.resourceUsage().maxRSS}};
 fs.writeFileSync(path.join(out,scenario+'-'+seed+'-'+variant+'.json'),JSON.stringify(result)+'\n');console.log('RESTART_PASS '+JSON.stringify({scenario,seed,variant,audits,hashes,fleet,runtime:result.runtime}));
}
if(args.includes('--prepare'))for(const [scenario,seed]of cases)prefix(scenario,seed);
else {const [scenario,seedText]=opt('case','miner,42').split(','),seed=Number(seedText);assert(cases.some(([s,n])=>s===scenario&&n===seed));run(scenario,seed,opt('variant','control'));}
