// B8b: read-only Diagnose tatsaechlicher Transfers und Fabrik-Nachschubbarrieren.
// Kein Modellumbau, kein Mint, keine Preis-/Routen-/Regelaenderung.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
assert(args.every(x=>/^--(scenario|days|out)=/.test(x)),'B8b Parameter');
const opt=(k,f)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??f;
const scenario=opt('scenario','handel-flotte'), days=Number(opt('days','90')), seed=42;
assert(['handel-flotte','passiv'].includes(scenario));
assert([14,90].includes(days));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('<script>')+8,b=html.indexOf('const m_data_oberflaeche');
assert(a>=8 && b>a,'Original-Core gefunden');
const source=html.slice(a,b),sha=s=>createHash('sha256').update(s).digest('hex');
assert.equal(sha(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');

class Observer {
 constructor(){this.trades=[];this.dividends=[];this.houseSteps=[];this.work=[];this.bounties=[];}
 trade(tick,ship,station,ware,qty,buy,price,fee){
   if(tick>14*1440)return;
   const value=qty*price;
   this.trades.push({tick,ship:ship.id,owner:ship.owner,station,ware,qty,buy,
     value,fee,houseNet:ship.owner==='house'?(buy?-(value+fee):(value-fee)):0});
 }
 workExpense(tick,owner,ship,paid){if(tick<=14*1440&&owner==='house')this.work.push({tick,ship,paid});}
 bounty(tick,owner,amount){if(tick<=14*1440&&owner==='house')this.bounties.push({tick,amount});}
 dividend(tick,id,amount){
   if(tick<=14*1440)this.dividends.push({tick,station:id,amount});
 }
 house(tick,before,after){
   if(tick<=14*1440 && before!==after)this.houseSteps.push({tick,delta:after-before});
 }
}
let instrumented=source;
for(const [needle,insertion] of [
 ["buche(state, schiff.owner, 'kosten', fee);",
  "buche(state, schiff.owner, 'kosten', fee); obs.trade(state.tick,schiff,station,ware,menge,kauf,p,fee);"],
 ["buche(state, id, 'kosten', n); buche(state, spieler, 'erloes', n);",
  "buche(state, id, 'kosten', n); buche(state, spieler, 'erloes', n); obs.dividend(state.tick,id,n);"],
 ["buche(state, s.owner, 'kosten', n);",
  "buche(state, s.owner, 'kosten', n); obs.workExpense(state.tick,s.owner,s.id,n);"],
 ["state.owners[g.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;",
  "state.owners[g.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld; obs.bounty(state.tick,g.owner,geld);"],
 ["state.owners[ziel.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld;",
  "state.owners[ziel.owner].cash += geld; state.minted += geld; state.stats.kopfgeld += geld; obs.bounty(state.tick,ziel.owner,geld);"]
]){
 assert.equal(instrumented.split(needle).length,2,'Instrumentierungsanker eindeutig: '+needle);
 instrumented=instrumented.replace(needle,insertion);
}
const observer=new Observer();
const watched=new Function('obs',instrumented+';return {c:m_core_index,r:m_data_rules.RULES};')(observer);
const original=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(watched.r.rulesVersion,14);
const c=watched.c,r=watched.r,s=c.createState(seed,r),z=original.c.createState(seed,original.r);
assert.equal(c.hash(s),original.c.hash(z));
const commands=scenario==='handel-flotte'?[
 {tick:1,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}},
 {tick:2,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}},
 {tick:3,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}},
 {tick:4,cmd:{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}},
 {tick:5,cmd:{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh002'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh029'}}
]:[];
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0);
function independentAudit(state){
 const cash=sum(Object.values(state.owners),x=>{assert(Number.isSafeInteger(x.cash)&&x.cash>=0);return x.cash;});
 assert.equal(cash,state.initialSupply+state.minted-state.burned,'unabhaengiger Geld-Audit');
 const inv={};
 for(const h of [...Object.values(state.stations).map(x=>x.lager),...Object.values(state.ships).map(x=>x.ladung)])
   for(const [w,n] of Object.entries(h)){assert(Number.isSafeInteger(n)&&n>=0);inv[w]=(inv[w]||0)+n;}
 for(const [w,v] of Object.entries(state.ledger))
   assert.equal(inv[w]||0,v.initial+v.mined+v.produced+v.imported-v.consumed-v.exported,'Waren '+w);
}
function snapshot(state,day){
 const stationIds=Object.keys(state.stations).sort();
 const owners=Object.keys(state.owners).sort();
 const money={house:state.owners.house.cash,
   npc:Object.fromEntries(['npc1','npc2','npc3'].map(x=>[x,state.owners[x]?.cash||0])),
   stations:sum(owners.filter(id=>state.owners[id].kind==='station'),id=>state.owners[id].cash),
   funds:sum(owners.filter(id=>state.owners[id].kind==='fund'),id=>state.owners[id].cash),
   minted:state.minted,burned:state.burned};
 const factories=stationIds.filter(id=>state.stations[id].linien.some(l=>['r_nahrung','r_medikamente'].includes(l.rezept)))
   .map(id=>({id,system:state.stations[id].system,cash:state.owners[id].cash,
      food:state.stations[id].lager.nahrung||0,meds:state.stations[id].lager.medikamente||0,
      ice:state.stations[id].lager.eis||0,materials:state.stations[id].lager.material||0,
      crystal:state.stations[id].lager.kristall||0,
      recipes:state.stations[id].linien.filter(l=>['r_nahrung','r_medikamente'].includes(l.rezept))
        .map(l=>({name:l.rezept,minutesRemaining:l.rest}))}));
 const stations=Object.fromEntries(stationIds.map(id=>[id,{
   system:state.stations[id].system,cash:state.owners[id].cash,
   eis:state.stations[id].lager.eis||0,
   material:state.stations[id].lager.material||0,
   nahrung:state.stations[id].lager.nahrung||0,
   medikamente:state.stations[id].lager.medikamente||0,
   eigentum:state.stations[id].eigentum}]));
 const freighters=Object.values(state.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2','npc3'].includes(x.owner))
   .map(x=>({id:x.id,owner:x.owner,system:x.system,phase:x.phase,auftrag:x.auftrag,
     target:x.ziel,cargo:x.ladung})).sort((a,b)=>a.id.localeCompare(b.id));
 const cargo=Object.values(state.ships).reduce((acc,x)=>{
   for(const w of ['eis','material'])acc[w]=(acc[w]||0)+(x.ladung[w]||0);
   return acc;
 },{});
 const opportunities=[];
 const rawNeeds={eis:['r_nahrung'],material:['r_medikamente']};
 for(const dest of factories){
   for(const [ware,recipes] of Object.entries(rawNeeds)){
     if(!dest.recipes.some(x=>recipes.includes(x.name)))continue;
     const pDest=c.preis(state,dest.id,ware,r),buyCap=c.aufnehmbar(state,r,dest.id,ware);
     const sources=[];
     for(const src of stationIds){
       if(src===dest.id)continue;
       const stock=state.stations[src].lager[ware]||0;
       const avail=c.verkaufbar(state,r,src,ware);
       const rt=c.route(r.world,state.stations[src].system,dest.system);
       if(stock===0 || !rt || !rt.zeit)continue;
       const pSrc=c.preis(state,src,ware,r);
       const near=freighters.filter(x=>x.phase==='dock'&&x.system===state.stations[src].system
         &&x.auftrag==='handeln'&&Object.values(x.cargo).every(v=>v===0));
       const traders=['npc1','npc2'].map(owner=>{
         const shipCash=state.owners[owner].cash;
         const max=Math.min(r.economy.cargo,avail,buyCap);
         let maxBuy=0;
         for(let n=1;n<=max;n++)
           if(n*pSrc+c.gebuehr(state,r,src,n*pSrc)<=shipCash)maxBuy=n;
         const gross=maxBuy>0 ? maxBuy*(pDest-pSrc)
           -c.gebuehr(state,r,src,maxBuy*pSrc)-c.gebuehr(state,r,dest.id,maxBuy*pDest) : 0;
         const fullFlightCost=Math.ceil(2*rt.zeit*r.world.betriebskosten.frachter/r.economy.stunde);
         return {owner,cash:shipCash,qty:maxBuy,tradeGross:gross,
           netAfterReturn:gross-fullFlightCost,
           dockedHere:near.filter(x=>x.owner===owner).map(x=>x.id)};
       });
       sources.push({src,stock,available:avail,pSrc,pDest,routeMinutes:rt.zeit,
         transportCandidates:traders});
     }
     sources.sort((a,b)=>b.available-a.available||a.src.localeCompare(b.src));
     opportunities.push({dest:dest.id,ware,needPerCycle:ware==='eis'?2:2,
       factoryStock:state.stations[dest.id].lager[ware]||0,factoryCash:dest.cash,
       pDest,buyCap,totalSourceStock:sum(sources,x=>x.stock),
       totalSellable:sum(sources,x=>x.available),sources:sources.slice(0,8)});
   }
 }
 return {day,money,factories,stations,freighters,cargo,opportunities,
   production:{food:state.ledger.nahrung.produced,meds:state.ledger.medikamente.produced},
   sales:Object.fromEntries(['npc1','npc2','npc3','house'].map(o=>[o,
     Object.values(state.ships).filter(x=>x.owner===o).reduce((n,x)=>n+(state.stats.verkaeufe[x.id]||0),0)]))};
}
let cursor=0,hours=0,roundtrips=0;const points=[];
for(let tick=1;tick<=days*1440;tick++){
 while(commands[cursor]?.tick===s.tick+1){
   const cmd=commands[cursor++].cmd;
   assert(c.submit(s,cmd,r).ok,'Original-Spielerbefehl erfolgreich');
   assert(original.c.submit(z,cmd,original.r).ok);
 }
 const prev=s.owners.house.cash;
 const x=c.step(s,r),y=original.c.step(z,original.r);
 assert.deepEqual(x,y,'Originalbefehle unveraendert');
 observer.house(s.tick,prev,s.owners.house.cash);
 if(tick%60===0){
   assert(c.audit(s).ok);assert(original.c.audit(z).ok);
   independentAudit(s);independentAudit(z);
   assert.equal(c.hash(s),original.c.hash(z),'read-only Replayhash');
   hours++;
 }
 if(tick%1440===0){
   const d=tick/1440;
   if([1,3,7,10,14,15,30,60,90].includes(d))points.push(snapshot(s,d));
   if([3,14,30,90].includes(d)){
     for(const core of [watched,original]){
       const q=core===watched?s:z;
       assert.equal(core.c.hash(core.c.load(core.c.save(q),undefined,core.r)),core.c.hash(q),'Save/Load '+d);
       roundtrips++;
     }
   }
 }
}
assert.equal(cursor,commands.length);
assert.equal(c.hash(s),original.c.hash(z));
if(scenario==='handel-flotte'&&days===90)
 assert.equal(c.hash(s),'784047684dfe5c56','historischer unveraenderter Kontrollhash');
const first14=observer.trades;
const playerTrades=first14.filter(x=>x.owner==='house');
const playerDividends=sum(observer.dividends,x=>x.amount);
const playerTradeNet=sum(playerTrades,x=>x.houseNet);
const houseDelta=sum(observer.houseSteps,x=>x.delta);
const outsidePlayerTrades=first14.filter(x=>x.owner!=='house');
const inflowsFromStations=sum(playerTrades.filter(x=>!x.buy),x=>x.value);
const outgoingToStations=sum(playerTrades.filter(x=>x.buy),x=>x.value);
const feesFromPlayer=sum(playerTrades,x=>x.fee);
const playerWorkExpense=sum(observer.work,x=>x.paid);
const playerBounty=sum(observer.bounties,x=>x.amount);
const transfer={houseDelta,playerTradeNet,playerDividends,playerWorkExpense,playerBounty,
 otherNet:houseDelta-playerTradeNet-playerDividends+playerWorkExpense-playerBounty,
 residual:houseDelta-playerTradeNet-playerDividends,
 inflowsFromStations,outgoingToStations,feesFromPlayer,
 byStation:Object.fromEntries([...new Set(playerTrades.map(x=>x.station))].sort().map(id=>[id,{
   saleIncome:sum(playerTrades.filter(x=>x.station===id&&!x.buy),x=>x.value),
   buyExpense:sum(playerTrades.filter(x=>x.station===id&&x.buy),x=>x.value),
   fees:sum(playerTrades.filter(x=>x.station===id),x=>x.fee)}])),
 trading:{player:playerTrades.length,others:outsidePlayerTrades.length},
 dividendEvents:observer.dividends.length};
const output={scenario,days,seed,sourceSha256:sha(source),instrumentedSha256:sha(instrumented),
 finalHash:c.hash(s),hours,roundtrips,commands:cursor,transfer,
 houseEvents:observer.houseSteps,dividendEvents:observer.dividends,
 workEvents:observer.work,bountyEvents:observer.bounties,
 playerTradeEvents:playerTrades,points};
const outDir=opt('out','/tmp/b8b');fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'b8b-'+scenario+'-'+days+'d.json'),JSON.stringify(output,null,2)+'\n');
const p14=points.find(x=>x.day===14);
console.log('B8B_PASS '+JSON.stringify({scenario,days,hash:output.finalHash,hours,roundtrips,
 transfer,day14:p14?{money:p14.money,factories:p14.factories,
   routes:p14.opportunities.map(q=>({dest:q.dest,ware:q.ware,stock:q.factoryStock,
      cash:q.factoryCash,price:q.pDest,buyCap:q.buyCap,
      totalSourceStock:q.totalSourceStock,totalSellable:q.totalSellable,
      bestSources:q.sources.slice(0,3)})),
   cargo:p14.cargo,freighters:p14.freighters}:null}));
