// B-K11g [ANALYSE]: Echtwelt-Preis-/Kassenangebot + konkurrierende Geld-/Materialclaims.
// Main-Regel14 bleibt UNVERAENDERT. Kein Auftragssettlement, keine neue ISK, keine
// nachgewiesene Eis-/Fertigwaren-Charge, kein Ersatzschiff, keine Endverbrauchszahlung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {independentlyAudit} from './b5b-common.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
const base='b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c';
const expected='7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal(hash(html),expected,'nur gepinnter Original-main-Stand');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
assert(src.startsWith('const m_data_systeme =')&&src.includes('const m_core_index ='));
const {core,rules}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES};')();
assert.equal(rules.schema,8);assert.equal(rules.rulesVersion,14);
const recipe=rules.economy.rezepte.r_nahrung;
assert.equal(recipe.ein.eis,2);assert.equal(recipe.aus.nahrung,1);assert.equal(recipe.dauer,6);
const sourceStation='st_nadir',buyerStation='st_aldera';
const template=Object.freeze({
  warenart:'nahrung',einsatz:'eis',herkunft:'unbekannter Anfangsbestand',
  source:sourceStation,buyer:buyerStation,miner:'npc3',trader:'house',
  lohnTestISKJeMinute:4,vergleichsbasis:'nur nicht genehmigte B-K10k-Lohnannahme',
  zahlungsart:'Stationsankauf; KEIN bezahlter ziviler Endkonsum',
  zeitpunkt:'Momentangebot, bei Ausfuehrung neu validieren',
});
function near(x){return x>0 && Number.isSafeInteger(x);}
export const createWorld=(seed=42)=>{
 assert(Number.isSafeInteger(seed)&&seed>0);
 const state=core.createState(seed,rules);
 independentlyAudit(state);assert(core.audit(state).ok);
 return state;
};
export const coreApi={core,rules};
function shipFor(state,owner){
 return Object.values(state.ships)
  .filter(s=>s.owner===owner&&s.klasse==='frachter')
  .sort((a,b)=>a.id.localeCompare(b.id))[0]||null;
}
function distance(a,b){return core.route(rules.world,a,b);}
export function quote(state,qty=8,{trader='house'}={}){
 assert(Number.isSafeInteger(qty)&&qty>0&&qty<=rules.economy.cargo);
 const sourceCfg=rules.world.stations[sourceStation];
 const buyerCfg=rules.world.stations[buyerStation];
 const ship=shipFor(state,trader);
 const sourceSystem=sourceCfg.system,buyerSystem=buyerCfg.system;
 const start=ship?.system||null;
 const toSource=start?distance(start,sourceSystem):null;
 const toBuyer=distance(sourceSystem,buyerSystem);
 const workMinutes=qty*recipe.ein.eis/rules.economy.miningRate;
 const requiredIce=qty*recipe.ein.eis;
 const pIce=core.preis(state,sourceStation,'eis',rules);
 const pSource=core.preis(state,sourceStation,'nahrung',rules);
 const pBuyer=core.preis(state,buyerStation,'nahrung',rules);
 const sourceFee=core.gebuehr(state,rules,sourceStation,qty*pSource);
 const buyerFee=core.gebuehr(state,rules,buyerStation,qty*pBuyer);
 // konservativer Bruttowert fuer Reisearbeit: Core rechnet reale Arbeitsminuten
 // bei Stundenabschluss nach rules.world.betriebskosten.frachter ab.
 const flightMinutes=(toSource?.zeit||0)+(toBuyer?.zeit||0);
 const flightUpper=Math.ceil(flightMinutes*rules.world.betriebskosten.frachter/rules.economy.stunde);
 const yard=rules.world.werft;
 const hullValue=core.preis(state,yard,'frachter',rules);
 const hullUpper=hullValue+core.gebuehr(state,rules,yard,hullValue);
 const sourceIceReplacement=requiredIce*pIce;
 const wageShadow=qty*recipe.dauer*4;
 const minerWorkUpper=Math.ceil(workMinutes*rules.world.betriebskosten.miner/rules.economy.stunde);
 const sourceSale=qty*pSource,buyerPurchase=qty*pBuyer;
 const sourceNeed=sourceIceReplacement+wageShadow;
 const traderNeed=sourceSale+sourceFee+buyerFee+flightUpper+hullUpper;
 const buyerNeed=buyerPurchase;
 const requiredCash={ [sourceStation]:sourceNeed, npc3:minerWorkUpper,
   [trader]:traderNeed, [buyerStation]:buyerNeed };
 const blockers=[];
 const add=(a,cond)=>{if(cond)blockers.push(a)};
 add('keinFrachter',!ship);
 add('keineHinOderRueckroute',!toSource||!toBuyer);
 add('FrachtraumUeberschritten',qty>rules.economy.cargo);
 add('nichtGenugEisImLager',(state.stations[sourceStation].lager.eis||0)<requiredIce);
 add('keineNahrungsfabrik',!state.stations[sourceStation].linien.some(x=>x.rezept==='r_nahrung'));
 add('FertiglagerBlockiert',
   (state.stations[sourceStation].lager.nahrung||0)+qty >
   core.obergrenze(state,rules,sourceStation,'nahrung'));
 add('EndstationslagerBlockiert',
   (state.stations[buyerStation].lager.nahrung||0)+qty >
   core.obergrenze(state,rules,buyerStation,'nahrung'));
 for(const [owner,amount]of Object.entries(requiredCash))
   add('ISKfehlen:'+owner,(state.owners[owner]?.cash||0)<amount);
 const sourceGrossMargin=sourceSale-sourceNeed;
 const traderGrossMargin=buyerPurchase-sourceSale-sourceFee-buyerFee-flightUpper;
 const consolidatedBeforeRisk=buyerPurchase-wageShadow-minerWorkUpper-sourceFee-buyerFee-flightUpper;
 const missingProofs=[
  'neue physische Eischarge und bezahlter Anschaffungseinstand nicht belegt',
  'Materialansprueche existieren nicht im heutigen Core/Saves',
  'tatsaechlicher Produktionslohn/Empfaenger nicht beschlossen',
  'zukuenftige Preise/Transport und Piratenverluste nicht garantiert',
  'Stationskauf ist kein bezahlter ziviler Endverbrauch',
  'echte Werfthuelle nach Verlust nicht reserviert',
 ];
 return {seed:state.seed,tick:state.tick,hash:core.hash(state),qty,requiredIce,
   source:sourceStation,destination:buyerStation,trader,shipId:ship?.id||null,
   prices:{ice:pIce,sourceFood:pSource,destinationFood:pBuyer},
   costs:{sourceIceReplacement,wageShadow,minerWorkUpper,sourceFee,buyerFee,
     flightMinutes,flightUpper,hullUpper,sourceSale,buyerPurchase},
   requiredCash,stocks:{
     ice:state.stations[sourceStation].lager.eis||0,
     food:state.stations[sourceStation].lager.nahrung||0,
     destinationFood:state.stations[buyerStation].lager.nahrung||0},
   cash:Object.fromEntries(Object.keys(requiredCash).map(o=>[o,state.owners[o]?.cash??null])),
   sourceGrossMargin,traderGrossMargin,consolidatedBeforeRisk,
   positiveMargins:{source:sourceGrossMargin>=0,trader:traderGrossMargin>=0,
     consolidated:consolidatedBeforeRisk>=0},
   blockers,missingProofs,
   status:!blockers.length?'nurHypothetischVorfinanzierbar':'keineVollstaendigeVorfinanzierung',
   readyForRealCore:false,reason:'nicht als Produktauftrag ausfuehrbar',
   caveat:'Historische Eis-Einstandskosten sind NICHT aktuelle Spotpreise; kein Ist-Deckungsbeitrag, keine qualifizierte Neuware'};
}
export function dryMaterialClaims(state,quantities){
 // Nur materielle Konkurrenzprobe; kein Auftrag, keine Kasse und keine Ware veraendert.
 const stock=state.stations[sourceStation].lager.eis||0;
 let held=0;
 const decisions=[];
 for(const amount of quantities){
   assert(Number.isSafeInteger(amount)&&amount>0);
   const accepted=amount<=stock-held;
   if(accepted)held+=amount;
   decisions.push({amount,accepted,held,free:stock-held});
 }
 assert(held<=stock);
 return {stock,held,decisions};
}
function sum(a){return Object.values(a).reduce((n,b)=>n+b,0);}
export function claims(state){
 const originalHash=core.hash(state),originalSupply=state.initialSupply+state.minted-state.burned;
 const reservedMoney={},reservedIce={ [sourceStation]:0},reservedOutput={ [sourceStation]:0, [buyerStation]:0},orders=new Map();
 let nextId=1;
 const availableMoney=id=>(state.owners[id]?.cash??0)-(reservedMoney[id]||0);
 const iceAvailable=()=> (state.stations[sourceStation].lager.eis||0)-reservedIce[sourceStation];
 function check(){
   assert.equal(core.hash(state),originalHash,'nur unveraenderter Tick/Originalzustand');
   assert.equal(state.initialSupply+state.minted-state.burned,originalSupply);
   for(const [id,value]of Object.entries(reservedMoney)){
     assert(Number.isSafeInteger(value)&&value>=0&&value<=state.owners[id].cash);
   }
   assert(Number.isSafeInteger(reservedIce[sourceStation]));
   assert(iceAvailable()>=0);
   for(const id of [sourceStation,buyerStation])
     assert(reservedOutput[id]>=0&&
       (state.stations[id].lager.nahrung||0)+reservedOutput[id] <= core.obergrenze(state,rules,id,'nahrung'),
       'kein mehrfach an verschiedene Auftraege verkaufter Produktions-/Ankunfts-Lagerplatz');
   const cashFromClaims={},iceFromClaims={};
   for(const o of orders.values()){
     if(o.status!=='reserviert')continue;
     for(const [id,value]of Object.entries(o.money))
       cashFromClaims[id]=(cashFromClaims[id]||0)+value;
     iceFromClaims[sourceStation]=(iceFromClaims[sourceStation]||0)+o.ice;
   }
   for(const [id,amount]of Object.entries(reservedMoney))
     assert.equal(amount,cashFromClaims[id]||0,'kein doppeltes Geld-Claim '+id);
   assert.equal(reservedIce[sourceStation],iceFromClaims[sourceStation]||0);
   for(const station of [sourceStation,buyerStation])
     assert.equal(reservedOutput[station],
       [...orders.values()].filter(o=>o.status==='reserviert')
         .reduce((n,o)=>n+o.qty,0));
 }
 function reserve(spec){
   check();
   const q=quote(state,spec.qty,{trader:spec.trader||'house'});
   const absent=Object.entries(q.requiredCash)
     .filter(([id,amount])=>amount>availableMoney(id))
     .map(([id,amount])=>({owner:id,available:availableMoney(id),needed:amount}));
   const physical=iceAvailable()<q.requiredIce;
   const output=[sourceStation,buyerStation].some(id=>
     (state.stations[id].lager.nahrung||0)+reservedOutput[id]+q.qty >
       core.obergrenze(state,rules,id,'nahrung'));
   if(q.blockers.some(x=>!x.startsWith('ISKfehlen:'))||absent.length||physical||output)
     return {ok:false,missingCash:absent,missingIce:physical,missingOutputCapacity:output,blockers:q.blockers};
   const id='analyse-'+String(nextId++).padStart(4,'0');
   const order={id,qty:q.qty,trader:q.trader,money:q.requiredCash,ice:q.requiredIce,
     status:'reserviert',worldTick:state.tick,worldHash:originalHash};
   for(const [owner,amount]of Object.entries(order.money))
     reservedMoney[owner]=(reservedMoney[owner]||0)+amount;
   reservedIce[sourceStation]+=order.ice;
   reservedOutput[sourceStation]+=q.qty;reservedOutput[buyerStation]+=q.qty;
   orders.set(id,order);
   check();return {ok:true,id,order:JSON.parse(JSON.stringify(order))};
 }
 function cancel(id){
   check();const o=orders.get(id);
   if(!o||o.status!=='reserviert')return false;
   o.status='storniert';
   for(const [owner,amount]of Object.entries(o.money))reservedMoney[owner]-=amount;
   reservedIce[sourceStation]-=o.ice;
   reservedOutput[sourceStation]-=o.qty;reservedOutput[buyerStation]-=o.qty;
   check();return true;
 }
 function inspect(){check();return {worldHash:originalHash,worldTick:state.tick,
   supply:originalSupply,
   material:{reserved:reservedIce[sourceStation],free:iceAvailable()},
   outputCapacity:{sourceFree:core.obergrenze(state,rules,sourceStation,'nahrung')-
     (state.stations[sourceStation].lager.nahrung||0)-reservedOutput[sourceStation],
     destinationFree:core.obergrenze(state,rules,buyerStation,'nahrung')-
     (state.stations[buyerStation].lager.nahrung||0)-reservedOutput[buyerStation]},
   money:{reserved:{...reservedMoney},
     free:Object.fromEntries(Object.keys(reservedMoney).map(id=>[id,availableMoney(id)]))},
   orders:[...orders.values()].map(o=>JSON.parse(JSON.stringify(o)))};}
 function unsafeSettle(){throw Error('Kein Core-Leistungsbeleg/Save-Claims: echte Auszahlung unzulaessig');}
 return {reserve,cancel,inspect,unsafeSettle,availableMoney,iceAvailable};
}
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1]){
 const args=process.argv.slice(2);
 assert(args.every(x=>/^--(seed|days|scenario)=/.test(x)));
 const opt=(key,fallback)=>args.find(x=>x.startsWith('--'+key+'='))?.slice(key.length+3)??fallback;
 const seed=Number(opt('seed','42')),days=Number(opt('days','0')),scenario=opt('scenario','passive');
 assert(['passive','miner','handel-flotte'].includes(scenario));
 assert(Number.isSafeInteger(days)&&days>=0&&days<=14);
 const state=createWorld(seed),comparison=createWorld(seed);
 if(scenario!=='passive'){
   const ships=Object.values(state.ships).filter(x=>x.owner==='house');
   const miner=ships.find(x=>x.klasse==='miner'),freighter=ships.find(x=>x.klasse==='frachter');
   assert(miner&&freighter);
   const commands=[{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},
      ...(scenario==='handel-flotte'?[{type:'shipHandeln',owner:'house',schiff:freighter.id}]:[])];
   for(const command of commands){assert(core.submit(state,command,rules).ok);assert(core.submit(comparison,command,rules).ok);}
 }
 let audits=0;
 for(let i=0;i<days*1440;i++){
   const a=core.step(state,rules),b=core.step(comparison,rules);
   assert.deepEqual(a,b);
   if(state.tick%60===0){
     independentlyAudit(state);assert(core.audit(state).ok);
     assert.equal(core.hash(state),core.hash(comparison));audits++;
   }
 }
 const quote8=quote(state,8),quote24=quote(state,24);
 const ledger=claims(state),result=ledger.reserve({qty:8});
 if(result.ok){assert(ledger.cancel(result.id));}
 assert.equal(core.hash(state),core.hash(comparison));
 console.log('BK11G_RESULT '+JSON.stringify({base,scenario,seed,days,audits,
   finalHash:core.hash(state),quotes:[
    {qty:8,status:quote8.status,blockers:quote8.blockers,prices:quote8.prices,
      margins:{source:quote8.sourceGrossMargin,trader:quote8.traderGrossMargin,
        consolidated:quote8.consolidatedBeforeRisk},cash:quote8.cash,
      requiredCash:quote8.requiredCash,ice:quote8.stocks.ice,ship:quote8.shipId},
    {qty:24,status:quote24.status,blockers:quote24.blockers,prices:quote24.prices,
      margins:{source:quote24.sourceGrossMargin,trader:quote24.traderGrossMargin,
        consolidated:quote24.consolidatedBeforeRisk},cash:quote24.cash,
      requiredCash:quote24.requiredCash,ice:quote24.stocks.ice,ship:quote24.shipId}
   ],order8:result.ok,financiallyClaimed:result.ok?'success':result.missingCash}));
 console.log('BK11G_PASS '+JSON.stringify({seed,days,audits,hash:core.hash(state),unmodified:true}));
}
