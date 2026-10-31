// [ANALYSE] B8f - Bilanz des einzigen Außenhandelsplatzes, ORIGINALKERN nur beobachtet.
// Zwei Prioritäts-Zuordnungen identischer Lagerware sind illustrativ, KEIN Ursprungsbeweis.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const arg=(k,d)=>process.argv.slice(2).find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??d;
assert(process.argv.slice(2).every(x=>/^--(scenario|days|out)=/.test(x)));
const scenario=arg('scenario','handel-flotte'),days=Number(arg('days','90')),seed=42;
assert(['handel-flotte','passiv'].includes(scenario));
assert.equal(days,90,'B8f nur volle historische 90 Tage');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const HUB='st_meridian',B=['initial','imported','delivered','salvaged'];
const sum=xs=>xs.reduce((a,b)=>a+b,0);
class Observer{
 constructor(){
   this.stats={imports:{},exports:{},delivered:{},shipBought:{},salvaged:{},
     paidByHub:{},paidToHub:{},inboundByOwner:{},outboundByOwner:{},
     fundToStation:{},fundOverflow:{},externalByWarehouse:{},origins:{}};
   this.sources={};
   this.events=0;
 }
 init(state){
   for(const [w,n] of Object.entries(state.stations[HUB].lager)){
     this.sources[w]={first:{initial:n,imported:0,delivered:0,salvaged:0},
       last:{initial:n,imported:0,delivered:0,salvaged:0}};
   }
 }
 line(w){return this.sources[w]??=( {first:{initial:0,imported:0,delivered:0,salvaged:0},
   last:{initial:0,imported:0,delivered:0,salvaged:0}} )}
 add(w,b,n){
   assert(n>0&&Number.isSafeInteger(n));for(const which of ['first','last'])this.line(w)[which][b]+=n;
 }
 remove(w,n,tag){
   assert(n>0&&Number.isSafeInteger(n));
   const res={};
   for(const which of ['first','last']){
     const buckets=this.line(w)[which];
     const priority=which==='first'?['imported','initial','delivered','salvaged']:['delivered','salvaged','initial','imported'];
     let rest=n;res[which]={};
     for(const b of priority){const take=Math.min(rest,buckets[b]);buckets[b]-=take;rest-=take;res[which][b]=take;}
     assert.equal(rest,0,'Meridian beobachtete Entnahme gedeckt / '+w+'/'+which+'/'+tag);
   }
   if(tag==='export'){
     this.stats.origins[w]||={first:{},last:{}};
     for(const which of ['first','last'])for(const [b,q] of Object.entries(res[which]))
       this.stats.origins[w][which][b]=(this.stats.origins[w][which][b]||0)+q;
   }
 }
 inc(obj,k,n){obj[k]=(obj[k]||0)+n;}
 trade(state,ship,station,ware,qty,buy,val,fee){
   if(station!==HUB)return;
   assert.equal(fee,0,'Meridian Handelsgebuehr ist null');
   this.events++;
   if(buy){
     this.remove(ware,qty,'shipPurchase');
     this.inc(this.stats.shipBought,ware,qty);
     this.inc(this.stats.paidToHub,ship.owner,val);
     this.inc(this.stats.outboundByOwner,ship.owner,qty);
   }else{
     this.add(ware,'delivered',qty);
     this.inc(this.stats.delivered,ware,qty);
     this.inc(this.stats.paidByHub,ship.owner,val);
     this.inc(this.stats.inboundByOwner,ship.owner,qty);
   }
 }
 external(state,id,ware,delta){
   if(!delta)return;
   assert.equal(id,HUB,'einziger Aussenhandel ist Meridian');
   this.events++;
   if(delta>0){this.add(ware,'imported',delta);this.inc(this.stats.imports,ware,delta);}
   if(delta<0){this.remove(ware,-delta,'export');this.inc(this.stats.exports,ware,-delta);}
 }
 salvage(state,market,ware,n){
   if(market!==HUB||n<=0)return;
   this.events++;this.add(ware,'salvaged',n);this.inc(this.stats.salvaged,ware,n);
 }
 fund(state,id,n){if(n>0)this.inc(this.stats.fundToStation,id,n);}
 overflow(state,id,n){if(n>0)this.inc(this.stats.fundOverflow,id,n);}
 audit(state){
   for(const [ware,n] of Object.entries(state.stations[HUB].lager)){
     for(const which of ['first','last']){
       const amounts=this.line(ware)[which];
       for(const val of Object.values(amounts))assert(Number.isSafeInteger(val)&&val>=0);
       assert.equal(sum(Object.values(amounts)),n,'Meridian Origin-Buchungsbilanz '+ware+'/'+which+' Tick '+state.tick);
     }
   }
 }
 report(state){
   this.audit(state);
   const t=this.stats;
   const all=Object.keys(state.stations[HUB].lager).sort();
   const provenance=Object.fromEntries(all.map(w=>[w,{exported:t.exports[w]||0,
     imports:t.imports[w]||0,shipDelivered:t.delivered[w]||0,
     shippedOut:t.shipBought[w]||0,pirateSalvaged:t.salvaged[w]||0,
     creditedAsImportFirst:t.origins[w]?.first?.imported||0,
     creditedAsImportLast:t.origins[w]?.last?.imported||0,
     remainderFirst:this.line(w).first,remainderLast:this.line(w).last}]));
   return {provenance,imports:sum(Object.values(t.imports)),exports:sum(Object.values(t.exports)),
     shipDelivered:sum(Object.values(t.delivered)),shipBought:sum(Object.values(t.shipBought)),
     salvaged:sum(Object.values(t.salvaged)),originalStock:sum(all.map(w=>this.line(w).first.initial)),
     paidByHubTotal:sum(Object.values(t.paidByHub)),paidToHubTotal:sum(Object.values(t.paidToHub)),
     ...t,observedExternalAndTradeEvents:this.events};
 }
}
const needles=[
 ["  buche(state, schiff.owner, 'kosten', fee);","  buche(state, schiff.owner, 'kosten', fee);\n  observer.trade(state,schiff,station,ware,menge,kauf,wert,fee);"],
 ["      if (d < 0) state.ledger[ware].exported -= d;","      if (d < 0) state.ledger[ware].exported -= d;\n      observer.external(state,id,ware,d);"],
 ["      state.stations[markt].lager[ware] = anzahl(state.stations[markt].lager, ware) + m;","      state.stations[markt].lager[ware] = anzahl(state.stations[markt].lager, ware) + m;\n      observer.salvage(state,markt,ware,m);"],
 ["    f.cash -= n; o[id].cash += n;","    f.cash -= n; o[id].cash += n;\n    observer.fund(state,id,n);"],
 ["    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;","    observer.overflow(state,arm,f.cash - w.fondsObergrenze);\n    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;"]
];
let instrumented=source;
for(const [needle,replacement] of needles){assert.equal(instrumented.split(needle).length,2,'genau ein Hook '+needle);instrumented=instrumented.replace(needle,replacement);}
const engine=new Function('observer',instrumented+';return {c:m_core_index,r:m_data_rules.RULES};');
const plain=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(plain.r.rulesVersion,14);
const obs=new Observer(),check=new Observer(),a=engine(obs),b=engine(check),s=a.c.createState(seed,a.r),t=b.c.createState(seed,b.r);
obs.init(s);check.init(t);
const commands=scenario==='handel-flotte'?[
 {tick:1,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}},
 {tick:2,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}},
 {tick:3,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}},
 {tick:4,cmd:{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}},
 {tick:5,cmd:{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh002'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh029'}}
]:[];
const snapshots=[];
let cursor=0,hours=0,roundtrips=0;
function independentlyAudit(world) {
 let cash=0;
 for(const o of Object.values(world.owners)){assert(Number.isSafeInteger(o.cash)&&o.cash>=0);cash+=o.cash;}
 assert.equal(cash,world.initialSupply+world.minted-world.burned);
 const stock={};
 for(const holder of [...Object.values(world.stations).map(x=>x.lager),...Object.values(world.ships).map(x=>x.ladung)])
   for(const [ware,qty] of Object.entries(holder)){assert(Number.isSafeInteger(qty)&&qty>=0);stock[ware]=(stock[ware]||0)+qty;}
 for(const [ware,v] of Object.entries(world.ledger))
   assert.equal(stock[ware]||0,v.initial+v.mined+v.produced+v.imported-v.consumed-v.exported,'Originalwarenledger '+ware);
}
for(let tick=1;tick<=days*1440;tick++){
 while(commands[cursor]?.tick===s.tick+1){
   const cmd=commands[cursor++].cmd;
   assert(a.c.submit(s,cmd,a.r).ok);assert(b.c.submit(t,cmd,b.r).ok);
 }
 const x=a.c.step(s,a.r),y=b.c.step(t,b.r);assert.deepEqual(x,y);
 if(tick%60===0){
   assert(a.c.audit(s).ok);assert(b.c.audit(t).ok);
   independentlyAudit(s);independentlyAudit(t);
   obs.audit(s);check.audit(t);
   assert.equal(a.c.hash(s),b.c.hash(t));
   hours++;
 }
 if(tick%1440===0){
   const day=tick/1440;
   if([1,7,14,15,30,60,90].includes(day))
     snapshots.push({day,hash:a.c.hash(s),meridianCash:s.owners.st_meridian.cash,
       house:s.owners.house.cash,npc1:s.owners.npc1.cash,npc2:s.owners.npc2.cash,npc3:s.owners.npc3.cash,
       stationCash:Object.values(s.owners).filter(q=>q.kind==='station').reduce((v,q)=>v+q.cash,0),
       meridianStock:Object.fromEntries(Object.entries(s.stations[HUB].lager))});
   if([3,15,30,90].includes(day)){
     for(const [w,e] of [[s,a],[t,b]]){assert.equal(e.c.hash(e.c.load(e.c.save(w),undefined,e.r)),e.c.hash(w));roundtrips++;}
   }
 }
}
assert.equal(cursor,commands.length);
assert.equal(hours,2160);
assert.equal(a.c.hash(s),b.c.hash(t));
assert.deepEqual(obs.stats,check.stats,'gleiche Geld-/Herkunftstraces');
if(scenario==='handel-flotte')assert.equal(a.c.hash(s),'784047684dfe5c56','historische Originalreferenz');
const result={scenario,seed,days,coreSha256:sha(source),hash:a.c.hash(s),hours,roundtrips,
  meridianInitial:Object.fromEntries(Object.keys(s.stations[HUB].lager).map(w=>[w,plain.c.createState(seed,plain.r).stations[HUB].lager[w]])),
  meridianFinal:s.stations[HUB].lager,
  observation:obs.report(s),
  snapshots};
fs.mkdirSync(arg('out','/tmp/b8f'),{recursive:true});
fs.writeFileSync(path.join(arg('out','/tmp/b8f'),scenario+'-90d.json'),JSON.stringify(result,null,2)+'\n');
console.log('B8F_PASS '+JSON.stringify({scenario,hash:result.hash,hours,roundtrips,observation:result.observation,snapshots:result.snapshots}));
