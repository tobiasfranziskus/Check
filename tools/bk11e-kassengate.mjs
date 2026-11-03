// B-K11e [ANALYSE]: Quellstations-Kaufkraft und Margen unter Original-Regel14.
// Beobachtet reale Core-Buchungen; 4 ISK/Fabrikminute NUR Schattenkostenannahme.
// Kein Eingriff in index.html, keine Geldemission, keine zweite Wirtschaft.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {independentlyAudit,SEEDS} from './b5b-common.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const expectedHtml='7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal(sha(html),expectedHtml,'nur gepinnter Original-main b4e604d6');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
assert(source.startsWith('const m_data_systeme =')&&source.includes('const m_core_index ='));
function inject(src,needle,part){
  assert.equal(src.split(needle).length,2,'kein eindeutiger Original-Core-Anker: '+needle.slice(0,45));
  return src.replace(needle,part);
}
let instrumented=inject(source,
  'if (!reicht) return false;\n  const d = kauf ? menge : -menge;',
  'if (!reicht) return false;\n  if(watch && (ware === "eis" || ware === "nahrung"))watch.trade(state,schiff,station,ware,menge,kauf,wert,fee);\n  const d = kauf ? menge : -menge;');
instrumented=inject(instrumented,
  'if (!eingaben || !platz) continue;\n      for (const ware of ids(r.ein))',
  'if (!eingaben || !platz) continue;\n      if(watch && linie.rezept === "r_nahrung")watch.start(state,rules,id,r,m_core_preis.preis);\n      for (const ware of ids(r.ein))');
instrumented=inject(instrumented,
  'if (linie.rest === 0) {\n          for (const ware of ids(r.aus))',
  'if (linie.rest === 0) {\n          if(watch && linie.rezept === "r_nahrung")watch.finish(state,id);\n          for (const ware of ids(r.aus))');
instrumented=inject(instrumented,
  'st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      if (da < bedarf[ware])',
  'st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      if(watch && ware === "nahrung")watch.consume(state,id,n);\n      if (da < bedarf[ware])');
instrumented=inject(instrumented,
  'const n = Math.min(f.cash, w.mindeststand - o[id].cash);\n    if (n <= 0) continue;\n    f.cash -= n; o[id].cash += n;',
  'const n = Math.min(f.cash, w.mindeststand - o[id].cash);\n    if (n <= 0) continue;\n    if(watch)watch.fund(state,id,n);\n    f.cash -= n; o[id].cash += n;');
const compile=(src,watch)=>new Function('watch',src+';return {core:m_core_index,rules:m_data_rules.RULES};')(watch);
const original=compile(source,null);
assert.equal(original.rules.rulesVersion,14);assert.equal(original.rules.schema,8);
const opts=process.argv.slice(2);
assert(opts.every(x=>/^--(scenario|seed|days|out)=/.test(x)));
const option=(k,d)=>opts.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const scenario=option('scenario','passive'),seed=Number(option('seed','42'));
const days=Number(option('days','3')),out=option('out','/tmp/bk11e.json');
assert(['passive','miner','handel-flotte'].includes(scenario));
assert(SEEDS.includes(seed),'fixer belegter Testseed');
assert(Number.isSafeInteger(days)&&days>=1&&days<=14);
const WAGE_PER_MIN=4; // nur B-K9q/B-K10 Vergleichsannahme, niemals im Core bezahlt.
const FACTORIES=['st_cyris','st_nadir','st_veldra'];
const empty=()=>({begun:0,finished:0,consumed:0,iceBoughtUnits:0,iceBoughtISK:0,
  iceSoldUnits:0,iceSoldISK:0,foodSoldUnits:0,foodSoldISK:0,
  foodBoughtUnits:0,foodBoughtISK:0,realFundTransfers:0,
  wageGateMissing:0,workingCapitalSpotMissing:0,
  negativeSpot:0,positiveSpot:0,zeroSpot:0,
  spotProfitSum:0,spotIcePriceSum:0,spotFoodPriceSum:0,
  minCash:Infinity,shadowWagesDue:0,shadowBufferMin:Infinity});
class Watch {
 constructor(){
  this.station=Object.fromEntries(FACTORIES.map(x=>[x,empty()]));
  this.unrelatedFund=0;
 }
 trade(state,ship,id,ware,qty,kauf,value,fee){
   const w=this.station[id];if(!w)return;
   assert.equal(value,qty*m_corePreis(state,id,ware),'gebuchte Core-Verkaufspreise');
   if(ware==='eis'){
     w[kauf?'iceSoldUnits':'iceBoughtUnits']+=qty;
     w[kauf?'iceSoldISK':'iceBoughtISK']+=value;
   }else{
     w[kauf?'foodSoldUnits':'foodBoughtUnits']+=qty;
     w[kauf?'foodSoldISK':'foodBoughtISK']+=value;
   }
 }
 start(state,rules,id,recipe,preis){
   const w=this.station[id];assert(w,'Nahrung nur in drei Quellen');
   const cash=state.owners[id].cash;
   const i=preis(state,id,'eis',rules),f=preis(state,id,'nahrung',rules);
   const wage=recipe.dauer*WAGE_PER_MIN;
   assert.equal(recipe.ein.eis,2);assert.equal(recipe.aus.nahrung,1);
   assert(cash>=0&&i>0&&f>0);
   const replenish=2*i+wage;
   const margin=f-replenish;
   w.begun++;w.spotIcePriceSum+=i;w.spotFoodPriceSum+=f;w.spotProfitSum+=margin;
   w.shadowWagesDue+=wage;
   if(cash<wage)w.wageGateMissing++;
   if(cash<replenish)w.workingCapitalSpotMissing++;
   w.minCash=Math.min(w.minCash,cash);
   w.shadowBufferMin=Math.min(w.shadowBufferMin,cash-replenish);
   if(margin<0)w.negativeSpot++;else if(margin>0)w.positiveSpot++;else w.zeroSpot++;
 }
 finish(state,id){this.station[id].finished++;}
 consume(state,id,n){if(this.station[id])this.station[id].consumed+=n;}
 fund(state,id,n){
   if(this.station[id])this.station[id].realFundTransfers+=n;
   else this.unrelatedFund+=n;
 }
}
let priceFn;
const watch=new Watch(),engine=compile(instrumented,watch);
assert.equal(engine.rules.rulesVersion,14);
priceFn=new Function(source+';return m_core_preis.preis;')();
function m_corePreis(state,id,ware){return priceFn(state,id,ware,original.rules)}
let s=engine.core.createState(seed,engine.rules),plain=original.core.createState(seed,original.rules);
assert.equal(engine.core.hash(s),original.core.hash(plain));
const initialCash=Object.fromEntries(FACTORIES.map(x=>[x,s.owners[x].cash]));
let hourlyAudits=0,roundtrips=0,issued=0;
const daysData=[];
const cmds=()=>{
 if(scenario==='passive')return [];
 const ships=Object.values(s.ships).filter(x=>x.owner==='house').sort((a,b)=>a.id.localeCompare(b.id));
 const mine=ships.find(x=>x.klasse==='miner'),trade=ships.find(x=>x.klasse==='frachter');
 assert(mine&&trade);
 return [{type:'shipMine',owner:'house',schiff:mine.id,ware:'erz'},
   ...(scenario==='handel-flotte'?[{type:'shipHandeln',owner:'house',schiff:trade.id}]:[])];
};
const commands=cmds();
for(let t=1;t<=days*1440;t++){
 if(t===1)for(const cmd of commands){
   const a=engine.core.submit(s,cmd,engine.rules),b=original.core.submit(plain,cmd,original.rules);
   assert(a.ok&&b.ok,JSON.stringify({cmd,a,b}));issued++;
 }
 const a=engine.core.step(s,engine.rules),b=original.core.step(plain,original.rules);
 assert.deepEqual(a,b);
 if(t%60===0){
   assert(engine.core.audit(s).ok&&original.core.audit(plain).ok);
   independentlyAudit(s);independentlyAudit(plain);
   assert.equal(engine.core.hash(s),original.core.hash(plain),'originaler stündlicher Hash');
   hourlyAudits++;
 }
 if(t%1440===0){
   const day=t/1440;
   daysData.push({day,hash:engine.core.hash(s),cash:Object.fromEntries(FACTORIES.map(id=>[id,s.owners[id].cash])),
     begun:Object.fromEntries(FACTORIES.map(id=>[id,watch.station[id].begun])),
     deficits:Object.fromEntries(FACTORIES.map(id=>[id,watch.station[id].negativeSpot])),
     missed:Object.fromEntries(FACTORIES.map(id=>[id,watch.station[id].workingCapitalSpotMissing])),
     traderCash:s.owners.npc1.cash+s.owners.npc2.cash,
     playerCash:s.owners.house.cash,
     traderFreighters:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner)).length});
   for(const [obj,eng,rules] of [[s,engine.core,engine.rules],[plain,original.core,original.rules]]){
     const clone=eng.load(eng.save(obj),undefined,rules);
     assert.equal(eng.hash(clone),eng.hash(obj));independentlyAudit(clone);roundtrips++;
   }
 }
}
assert.equal(hourlyAudits,days*24);assert.equal(roundtrips,days*2);
assert.equal(engine.core.hash(s),original.core.hash(plain));
if(scenario!=='passive'&&seed===42&&days===14){
 assert.equal(engine.core.hash(s),scenario==='miner'?'cfabd13df77ec778':'d175beeaaef304a9',
  'Original-B-K11d-Tag14-Hash');
}
for(const id of FACTORIES){
 const f=watch.station[id];assert(f.begun>=f.finished);
 assert(f.begun<=f.finished+1,'höchstens ein laufender Produktionsauftrag pro Fabrik');
}
const byFactory=Object.fromEntries(FACTORIES.map(id=>{
 const w=watch.station[id],finalCash=s.owners[id].cash;
 return [id,{...w,initialCash:initialCash[id],finalCash,
   factualIceFoodCashFlow:w.foodSoldISK+w.iceSoldISK-w.iceBoughtISK-w.foodBoughtISK,
   counterfactualWageCashFlow:w.foodSoldISK+w.iceSoldISK-w.iceBoughtISK-w.foodBoughtISK-w.shadowWagesDue,
   // Quellbeteiligung, nicht vollständiger Endgewinn: Eis-Warenbestand und Startware unbekannter historischer Preis.
   freeFoodInventory:s.stations[id].lager.nahrung||0,
   freeIceInventory:s.stations[id].lager.eis||0,
   spotNegativeRate:w.begun?w.negativeSpot/w.begun:0
 }];}));
const results={base:'b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c',
 htmlSha256:expectedHtml,scenario,seed,days,minutes:days*1440,issued,hourlyAudits,roundtrips,
 shadowWagePerMinute:WAGE_PER_MIN,
 cashAssumptions:'Hypothetische 4 ISK/Minute nicht bezahlt, Preise Spotwerte, keine reale FIFO-Einstandsmarge',
 originalFinalHash:engine.core.hash(s),byFactory,daysData,
 stationFundTransfers:FACTORIES.reduce((n,id)=>n+byFactory[id].realFundTransfers,0)};
fs.writeFileSync(out,JSON.stringify(results,null,2)+'\n');
console.log('BK11E_RESULT '+JSON.stringify({
 scenario,seed,days,hash:results.originalFinalHash,hourlyAudits,roundtrips,
 factories:Object.fromEntries(FACTORIES.map(id=>{
   const f=byFactory[id];return [id,{
     started:f.begun,finished:f.finished,negativeSpot:f.negativeSpot,
     spotProfitSum:f.spotProfitSum,spotIcePriceSum:f.spotIcePriceSum,spotFoodPriceSum:f.spotFoodPriceSum,
     wageGateMissing:f.wageGateMissing,workingCapitalSpotMissing:f.workingCapitalSpotMissing,
     actualIcePurchasedISK:f.iceBoughtISK,actualFoodSoldISK:f.foodSoldISK,
     actualFoodSoldUnits:f.foodSoldUnits,realFundTransfers:f.realFundTransfers,
     counterfactualWageCashFlow:f.counterfactualWageCashFlow,finalCash:f.finalCash
   }]
 }))}));
console.log('BK11E_PASS '+JSON.stringify({scenario,seed,days,hash:results.originalFinalHash}));
