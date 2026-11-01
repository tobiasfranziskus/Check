// B-K9k.2: Originale frühe NPC-Abflüge, nicht bloß Preisschätzungen.
// Die Original-KI wählt, der Original-Core führt aus; nur die Vollkosten
// werden am tatsächlich ausgelösten Start nachkalkuliert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const h=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=h.slice(h.indexOf('const m_data_systeme ='),h.indexOf('const m_data_oberflaeche ='));
const {core,R}=new Function(src+';return {core:m_core_index,R:m_data_rules.RULES};')();
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const initial=core.createState(1,R),yard=R.world.werft;
const p=core.preis(initial,yard,'frachter');
const replacement20=Math.ceil((p+core.gebuehr(initial,R,yard,p))/20);
const isNPC=x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner);
const sum=o=>Object.values(o||{}).reduce((n,x)=>n+x,0);
const counter=(x,k)=>x[k]=(x[k]||0)+1;
function run(seed){
 const s=core.createState(seed,R);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},R).ok);
 const starts=[],summary={emptyDepartures:0,freshBoughtDepartures:0,
    cargoAlreadyOnBoard:0,freshGrossPositive:0,freshFullCostPositive:0,
    freshGrossPositiveButFullCostNegative:0,unfundedWageStarts:0,
    firstDayStarts:0};
 for(let tick=1;tick<=3*1440;tick++){
  const prev={};
  for(const sh of Object.values(s.ships))if(isNPC(sh)&&sh.phase==='dock'){
   const from=R.world.systems[sh.system].station;
   const prices={};
   for(const ware of Object.keys(R.economy.waren))prices[ware]=core.preis(s,from,ware);
   prev[sh.id]={id:sh.id,system:sh.system,owner:sh.owner,
    wallet:s.owners[sh.owner].cash,cargo:sum(sh.ladung),
    waiting:sh.ankunft<=s.tick+1,prices,stock:{...sh.ladung}};
  }
  // Prices are evaluated at departure's actual post-buy world state,
  // not an invented later buyer price.
  core.step(s,R);
  for(const sh of Object.values(s.ships)){
   if(!isNPC(sh)||sh.phase!=='reise'||!prev[sh.id])continue;
   const old=prev[sh.id];
   if(!old.waiting||sh.ankunft<=s.tick)continue;
   // Only count flights actually initiated in this step; an old dock
   // snapshot can't persist on a later tick in which the ship was traveling.
   const dest=sh.ziel;
   if(!dest || !s.stations[dest])continue;
   const route=core.route(R.world,old.system,R.world.stations[dest].system);
   if(!route||route.zeit<=0)continue;
   const wage=Math.ceil(route.zeit*R.world.betriebskosten.frachter/R.economy.stunde);
   const afterLoad=sum(sh.ladung);
   const type=old.cargo>0?'already_loaded':afterLoad>0?'fresh_buy':'empty';
   const row={seed,day:s.tick/1440,tick:s.tick,id:sh.id,owner:sh.owner,
       from:old.system,to:R.world.stations[dest].system,
       wageOneWay:wage,oldCargo:old.cargo,newCargo:afterLoad,type};
   if(type==='fresh_buy'){
     let gross=0,buyTotal=0,sellTotal=0;
     const source=R.world.systems[old.system].station;
     for(const [ware,n] of Object.entries(sh.ladung)){
       const rawPrice=old.prices[ware],destPrice=core.preis(s,dest,ware);
       const buy=n*rawPrice,sell=n*destPrice;
       const bfee=core.gebuehr(s,R,source,buy),sfee=core.gebuehr(s,R,dest,sell);
       gross+=sell-buy-bfee-sfee;buyTotal+=buy+bfee;sellTotal+=sell-sfee;
     }
     row.gross=gross;row.purchase=buyTotal;row.targetReceipts=sellTotal;
     row.netOneWay=gross-wage;row.netFullCycle20=gross-2*wage-replacement20;
     if(gross>0)summary.freshGrossPositive++;
     if(row.netFullCycle20>0)summary.freshFullCostPositive++;
     if(gross>0&&row.netFullCycle20<=0)summary.freshGrossPositiveButFullCostNegative++;
     summary.freshBoughtDepartures++;
   }else if(type==='already_loaded')summary.cargoAlreadyOnBoard++;
   else summary.emptyDepartures++;
   if(old.wallet<wage)summary.unfundedWageStarts++;
   if(s.tick<=1440)summary.firstDayStarts++;
   starts.push(row);
  }
  if(tick%1440===0)assert(core.audit(s).ok);
 }
 return {seed,summary,firstStarts:starts.slice(0,12),
   totalStarts:starts.length,afterDay3Freighters:Object.values(s.ships).filter(isNPC).length};
}
const res=SEEDS.map(run);for(const x of res)console.log('BK9K_ORIGINAL_DEPARTURES '+JSON.stringify(x));
const totals={};for(const r of res)for(const [k,v] of Object.entries(r.summary))counter(totals,k),totals[k]+=(v-1);
const summary={worlds:res.length,days:3,realDepartures:res.reduce((n,r)=>n+r.totalStarts,0),
  totals,exampleSeed7:res.find(x=>x.seed===7),
  caveat:'Original-Core departure observed. Destination sale and 2nd leg not actually guaranteed; full-cycle is conservative forecast, not booked ledger profit.'};
console.log('BK9K_DEPARTURE_SUMMARY '+JSON.stringify(summary));
assert.equal(res.length,13);
assert(summary.realDepartures===totals.emptyDepartures+totals.freshBoughtDepartures+totals.cargoAlreadyOnBoard);
