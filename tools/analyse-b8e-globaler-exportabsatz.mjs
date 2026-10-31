// B8e — eigener Phase-B-Analysezweig ab main (Regel14).
// NICHT produktiv. Ein einzelner GLOBALER Vergleich: reale externe Warenausfuhr,
// nur bei aggregiertem Versorgungs- UND Marktliquiditätsmangel, kein Einzel-Bailout.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const opt=(name,def)=>process.argv.slice(2).find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3)??def;
assert(process.argv.slice(2).every(x=>/^--(scenario|mode|days|out)=/.test(x)),'B8e Parameter');
const scenario=opt('scenario','handel-flotte'),mode=opt('mode','baseline');
const days=Number(opt('days','90')),seed=42,MINUTES=60;
assert(['handel-flotte','passiv'].includes(scenario));
assert(['baseline','exportbudget'].includes(mode));
assert([10,90].includes(days));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('<script>')+8,end=html.indexOf('const m_data_oberflaeche');
assert(start>=8&&end>start,'Original-Core gefunden');
const source=html.slice(start,end);
const sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(sha(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9',
  'gepinntes main Regel14; bei main-Aenderung keine unbewusste Neubasierung');

class DemandObserver {
 constructor(){this.hour=[];this.day=new Map();this.paid=0;this.paidHours=0;this.byStation={};this.current=[];
   this.exports=[];this.exportsByWare={};this.exportUnits=0;this.exportHours=0;this.eligibleHours=0;
   this.suppressedHealthy=0;this.suppressedNoExport=0;this.gatedHours=0;this.receivers={};}
 consume(state,id,ware,actual,need,stock,price) {
   if(!['nahrung','medikamente'].includes(ware))return;
   assert(actual>=0&&actual<=need);
   this.current.push({id,ware,actual,need,stock,cash:state.owners[id].cash});
   const day=Math.ceil(state.tick/1440);
   const key=day+'/'+id+'/'+ware;
   const r=this.day.get(key)||{day,id,ware,need:0,actual:0,shortageHours:0,zeroCashHours:0,
     missingStockHours:0,noStockButCouldBuyUnitHours:0,cashBelowOneUnitHours:0,
     firstCash:state.owners[id].cash};
   r.need+=need;r.actual+=actual;
   if(actual<need)r.shortageHours++;
   if(stock===0)r.missingStockHours++;
   if(state.owners[id].cash===0)r.zeroCashHours++;
   if(state.owners[id].cash<price)r.cashBelowOneUnitHours++;
   if(stock===0&&state.owners[id].cash>=price)r.noStockButCouldBuyUnitHours++;
   this.day.set(key,r);
 }

 exported(state,id,ware,units,rules){
   assert(Number.isSafeInteger(units)&&units>0);
   // WIRKLICH aus dem Stationslager entfernt; im Original-Ledger als Export verbucht.
   this.exports.push({id,ware,units,weight:units*(rules.economy.waren[ware]?.basis||0)});
   this.exportUnits+=units;this.exportsByWare[ware]=(this.exportsByWare[ware]||0)+units;
 }
 pay(state,rules){
   const exports=this.exports;
   this.exports=[];
   const demand=this.current;
   this.current=[];
   if(exports.length)this.exportHours++;
   if(mode==='baseline')return;
   const need=demand.reduce((a,x)=>a+x.need,0);
   const actual=demand.reduce((a,x)=>a+x.actual,0);
   const marketCash=Object.values(state.owners).filter(x=>x.kind==='station').reduce((a,x)=>a+x.cash,0);
   const marketLow=marketCash*5 < state.initialSupply;
   const deficit=need>0 && actual*2<need;
   if(!marketLow||!deficit){this.suppressedHealthy++;return;}
   this.gatedHours++;
   if(!exports.length){this.suppressedNoExport++;return;}
   // Testparameter, keine Produktfreigabe: max 20 ISK *weltweit* je Stunde
   // und höchstens 2 ISK pro wirklich physisch exportierter Wareneinheit.
   const W=Math.min(20,exports.reduce((a,x)=>a+x.units,0)*2);
   const bills=exports.filter(x=>x.weight>0);
   const total=bills.reduce((a,x)=>a+x.weight,0);
   if(W<=0||total<=0)return;
   const a=bills.map((x,i)=>({...x,i,isk:Math.floor(W*x.weight/total),rest:(W*x.weight)%total}));
   let leftover=W-a.reduce((t,x)=>t+x.isk,0);
   a.sort((x,y)=>y.rest-x.rest||x.id.localeCompare(y.id)||x.ware.localeCompare(y.ware));
   for(let i=0;i<leftover;i++)a[i].isk++;
   a.sort((x,y)=>x.i-y.i);
   for(const x of a){
     if(x.isk<=0)continue;
     state.owners[x.id].cash+=x.isk;
     state.minted+=x.isk;
     this.byStation[x.id]=(this.byStation[x.id]||0)+x.isk;
     this.receivers[x.ware]=(this.receivers[x.ware]||0)+x.isk;
   }
   this.paid+=W;this.paidHours++;
   this.hour.push({tick:state.tick,isk:W,units:exports.reduce((v,x)=>v+x.units,0),
     cashBefore:marketCash,consumerNeed:need,consumerActual:actual,
     exporters:exports.map(x=>({id:x.id,ware:x.ware,units:x.units}))});
 }

}
const consumeNeedle='st.lager[ware] = da - n; state.ledger[ware].consumed += n;';
const exportNeedle='if (d < 0) state.ledger[ware].exported -= d;';
const stepNeedle='verbrauch(state, rules); betriebskosten(state, rules); aussenhandel(state, rules);';
assert.equal(source.split(consumeNeedle).length,2,'Originalverbrauch genau einmal');
assert.equal(source.split(exportNeedle).length,2,'Original-Aussenhandel Export genau einmal');
assert.equal(source.split(stepNeedle).length,2,'einzige Stunden-Phase');
const instrumented=source.replace(consumeNeedle,consumeNeedle+'\n      observer.consume(state,id,ware,n,bedarf[ware],da,m_core_preis.preis(state,id,ware,rules));')
 .replace(exportNeedle,'if (d < 0) { state.ledger[ware].exported -= d; observer.exported(state,id,ware,-d,rules); }')
 .replace(stepNeedle,'verbrauch(state, rules); betriebskosten(state, rules); aussenhandel(state, rules); observer.pay(state,rules);');
const factory=new Function('observer',instrumented+';return {c:m_core_index,r:m_data_rules.RULES};');
const plain=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(plain.r.rulesVersion,14);
const observer=new DemandObserver(),check=new DemandObserver();
const observed=factory(observer),replay=factory(check);
const s=observed.c.createState(seed,observed.r),t=replay.c.createState(seed,replay.r);
assert.equal(observed.c.hash(s),replay.c.hash(t));
const initialHash=plain.c.hash(plain.c.createState(seed,plain.r));
assert.equal(observed.c.hash(s),initialHash);

const commands=scenario==='handel-flotte'?[
 {tick:1,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}},
 {tick:2,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}},
 {tick:3,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}},
 {tick:4,cmd:{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}},
 {tick:5,cmd:{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh002'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh029'}}
]:[];
function independentAudit(state){
 let cash=0;
 for(const v of Object.values(state.owners)){assert(Number.isSafeInteger(v.cash)&&v.cash>=0);cash+=v.cash;}
 assert.equal(cash,state.initialSupply+state.minted-state.burned,'alle Kassen inkl. Fonds');
 const inventory={};
 for(const holder of [...Object.values(state.stations).map(x=>x.lager),...Object.values(state.ships).map(x=>x.ladung)])
   for(const [ware,n] of Object.entries(holder)){assert(Number.isSafeInteger(n)&&n>=0);inventory[ware]=(inventory[ware]||0)+n;}
 for(const [ware,row] of Object.entries(state.ledger))
   assert.equal(inventory[ware]||0,row.initial+row.mined+row.produced+row.imported-row.consumed-row.exported,'Waren-Audit '+ware);
}
const daily=[];let cursor=0,hours=0,roundtrips=0;
for(let tick=1;tick<=days*1440;tick++){
 while(commands[cursor]?.tick===s.tick+1){
   const cmd=commands[cursor++].cmd;
   assert(observed.c.submit(s,cmd,observed.r).ok,'B1-Historienbefehl original angenommen');
   assert(replay.c.submit(t,cmd,replay.r).ok,'B1-Replaybefehl');
 }
 const a=observed.c.step(s,observed.r),b=replay.c.step(t,replay.r);
 assert.deepEqual(a,b,'B8e gleicher Befehlserfolg');
 if(tick%MINUTES===0){
   assert(observed.c.audit(s).ok);
   assert(replay.c.audit(t).ok);
   independentAudit(s);independentAudit(t);
   assert.equal(observed.c.hash(s),replay.c.hash(t),'B8e identische stündliche Replaywelt');
   hours++;
 }
 if(tick%1440===0){
   const day=tick/1440;
   const now=Array.from(observer.day.values()).filter(x=>x.day===day);
   const totals={};
   for(const ware of ['nahrung','medikamente']){
     const arr=now.filter(x=>x.ware===ware);
     totals[ware]={needed:arr.reduce((a,x)=>a+x.need,0),
       consumed:arr.reduce((a,x)=>a+x.actual,0),
       shortageHours:arr.reduce((a,x)=>a+x.shortageHours,0),
       zeroCashHours:arr.reduce((a,x)=>a+x.zeroCashHours,0),
       missingStockHours:arr.reduce((a,x)=>a+x.missingStockHours,0),
       noStockButCouldBuyUnitHours:arr.reduce((a,x)=>a+x.noStockButCouldBuyUnitHours,0),
       cashBelowOneUnitHours:arr.reduce((a,x)=>a+x.cashBelowOneUnitHours,0)};
   }
   const row={day,hash:observed.c.hash(s),cashHouse:s.owners.house.cash,
     stationCash:Object.values(s.owners).filter(x=>x.kind==='station').reduce((a,x)=>a+x.cash,0),
     fundsCash:Object.values(s.owners).filter(x=>x.kind==='fund').reduce((a,x)=>a+x.cash,0),
     minted:s.minted,burned:s.burned,
     stockFood:Object.values(s.stations).reduce((a,x)=>a+(x.lager.nahrung||0),0),
     stockMeds:Object.values(s.stations).reduce((a,x)=>a+(x.lager.medikamente||0),0),
     foodProduced:s.ledger.nahrung.produced,medicineProduced:s.ledger.medikamente.produced,
     foodImported:s.ledger.nahrung.imported,medicineImported:s.ledger.medikamente.imported,
     foodExported:s.ledger.nahrung.exported,medicineExported:s.ledger.medikamente.exported,
     stations:Object.fromEntries(Object.keys(s.stations).sort().map(id=>[id,{
       cash:s.owners[id].cash,food:s.stations[id].lager.nahrung||0,
       medicine:s.stations[id].lager.medikamente||0,
       ice:s.stations[id].lager.eis||0,crystal:s.stations[id].lager.kristall||0,
       materials:s.stations[id].lager.material||0,
       foodRecipe:s.stations[id].linien.filter(x=>x.rezept==='r_nahrung').length,
       medicineRecipe:s.stations[id].linien.filter(x=>x.rezept==='r_medikamente').length}])) ,
     ...totals};
   daily.push(row);
   if([3,15,30,90].includes(day)){
     for(const core of [observed,replay]){const state=core===observed?s:t;
       assert.equal(core.c.hash(core.c.load(core.c.save(state),undefined,core.r)),core.c.hash(state),'Save/Load '+day);roundtrips++;}
   }
 }
}
assert.equal(cursor,commands.length);
assert.equal(hours,days*24);
assert.equal(observer.paid,check.paid,'deterministische Zahlungssumme');
assert.deepEqual(observer.byStation,check.byStation,'deterministische Empfaenger');
assert.equal(observed.c.hash(s),replay.c.hash(t));
if(mode==='baseline'&&scenario==='handel-flotte'&&days===90)
 assert.equal(observed.c.hash(s),'784047684dfe5c56','B7b originaler Regel14-handel-flotte Kontrolldigest');
if(mode==='baseline')assert.equal(observer.paid,0);
else {
 assert(observer.paid>=0&&observer.paid<=20*hours,'globaler max. Stunden-ISK-Zufluss');
 assert(observer.paid>=observer.paidHours);
 assert.equal(Object.values(observer.byStation).reduce((a,b)=>a+b,0),observer.paid);
}
const consumption=Object.fromEntries(['nahrung','medikamente'].map(ware=>[ware,{
 needed:daily.reduce((a,x)=>a+x[ware].needed,0),
 consumed:daily.reduce((a,x)=>a+x[ware].consumed,0),
 shortageHours:daily.reduce((a,x)=>a+x[ware].shortageHours,0),
 zeroCashHours:daily.reduce((a,x)=>a+x[ware].zeroCashHours,0),
 missingStockHours:daily.reduce((a,x)=>a+x[ware].missingStockHours,0),
 noStockButCouldBuyUnitHours:daily.reduce((a,x)=>a+x[ware].noStockButCouldBuyUnitHours,0),
 cashBelowOneUnitHours:daily.reduce((a,x)=>a+x[ware].cashBelowOneUnitHours,0)
}]));
const output={scenario,mode,seed,days,sourceSha256:sha(source),candidateSourceSha256:sha(instrumented),
 initialHash,finalHash:observed.c.hash(s),hours,dailyHashes:daily.length,roundtrips,
 commands:cursor,consumption,payments:{minted:observer.paid,paidHours:observer.paidHours,byStation:observer.byStation,byWare:observer.receivers,exportUnits:observer.exportUnits,exportHours:observer.exportHours,exportedByWare:observer.exportsByWare,gatedHours:observer.gatedHours,suppressedHealthy:observer.suppressedHealthy,suppressedNoExport:observer.suppressedNoExport},
 money:{initial:s.initialSupply,minted:s.minted,burned:s.burned,
  worldCash:Object.values(s.owners).reduce((a,v)=>a+v.cash,0),playerCash:s.owners.house.cash},
 finalTraderCash:Object.fromEntries(['npc1','npc2','npc3'].map(x=>[x,s.owners[x].cash])),
 last7:daily.slice(-7),dayPoints:daily.filter(x=>[1,7,14,15,16,30,60,90].includes(x.day)),daily,
 byStation:Array.from(observer.day.values())};
const dir=opt('out','/tmp/b8e');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'b8e-'+scenario+'-'+mode+'-'+days+'d.json'),JSON.stringify(output,null,2)+'\n');
console.log('B8E_PASS '+JSON.stringify({scenario,mode,hash:output.finalHash,consumption,payments:output.payments,
  money:output.money,dayPoints:output.dayPoints.map(x=>({day:x.day,nahrung:x.nahrung.consumed,medikamente:x.medikamente.consumed,
    stations:x.stationCash,player:x.cashHouse,minted:x.minted})),hours,roundtrips}));
