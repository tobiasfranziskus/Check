// B8p [ANALYSE] Hypothetical capped end-consumption transfers/issuance; not an authorized product rule.
// No new money source, no changes in tariffs, station demand or product logic.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(original),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
let instrumented=original;
for(const [search,replace] of [
 ["      st.lager[ware] = da - n; state.ledger[ware].consumed += n;","      st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      probe.consume(state,rules,id,ware,n);"],
 ['  buche(state, schiff.owner, \'kosten\', fee);',"  buche(state, schiff.owner, 'kosten', fee);\n  probe.trade(state,schiff,station,ware,menge,kauf,wert,fee);"],
 ['    const n = Math.min(besitzer.cash, kosten);',"    const n = Math.min(besitzer.cash, kosten);\n    probe.work(state,s,arbeit,kosten,n);"]
]){
 assert.equal(instrumented.split(search).length,2,'unique hook '+search);
 instrumented=instrumented.replace(search,replace);
}
const historic=[
 [1,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}],
 [2,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}],
 [3,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}],
 [4,{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}],
 [5,{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh002'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh029'}]
];
const categories=['player','trader','miner','station','fund','pirate','authority'];
function observer(mode){
 return {mode,consume(state,rules,station,ware,n){
   if(n===0 || mode==='original' || (ware!=='nahrung'&&ware!=='medikamente'))return;
   const stats=state.stats.b8p ||= {day:-1,today:0,total:0,payments:0,units:0};
   const day=Math.floor((state.tick-1)/1440);
   if(stats.day!==day){stats.day=day;stats.today=0;}
   const cap=mode==='mint-6k'?6000:mode==='mint-12k'?12000:Number.MAX_SAFE_INTEGER;
   const requested=(ware==='nahrung'?5:10)*n;
   const affordable=Math.max(0,Math.min(requested,200-stats.today,cap-stats.total));
   if(affordable<=0)return;
   let payment=affordable;
   if(mode==='transfer'){
     const fund=rules.world.systems[rules.world.stations[station].system].fonds;
     payment=Math.min(affordable,state.owners[fund].cash);
     state.owners[fund].cash-=payment;
   }else{state.minted+=payment;}
   state.owners[station].cash+=payment;
   stats.today+=payment;stats.total+=payment;
   if(payment>0){stats.payments++;stats.units+=n;}
 },volume:{},tradeCount:{},stationPay:{},stationReceive:{},sellerReceives:{},buyerPays:{},
 workPaid:{},workDue:{},lastDeals:[], hourOfferCounts:[],
 trade(state,ship,station,ware,qty,buy,value,fee){
  const k=ware+':'+(buy?'from-station':'to-station'),p=station;
  this.volume[k]=(this.volume[k]||0)+qty;
  this.tradeCount[k]=(this.tradeCount[k]||0)+1;
  if(!buy){this.stationPay[p]=(this.stationPay[p]||0)+value;
     this.sellerReceives[ship.owner]=(this.sellerReceives[ship.owner]||0)+value-fee;}
  else{this.stationReceive[p]=(this.stationReceive[p]||0)+value;
     this.buyerPays[ship.owner]=(this.buyerPays[ship.owner]||0)+value+fee;}
  if(state.tick>=14*1440&&this.lastDeals.length<40)
    this.lastDeals.push({t:state.tick,owner:ship.owner,station,ware,qty,buy,value,fee,
      stationCash:state.owners[station].cash,ownerCash:state.owners[ship.owner].cash});
 },
 work(state,s,min,due,paid){
  const k=s.owner+':'+s.klasse;
  this.workDue[k]=(this.workDue[k]||0)+due;
  this.workPaid[k]=(this.workPaid[k]||0)+paid;
 }};
}
function snapshot(s,c,r,day,observer){
 const wallets=Object.fromEntries(categories.map(k=>[k,0]));
 const perOwner={};
 for(const [k,o] of Object.entries(s.owners)){
  wallets[o.kind]=(wallets[o.kind]||0)+o.cash;
  perOwner[k]=o.cash;
 }
 const needs=[],byGood={};
 for(const [station,st] of Object.entries(s.stations)){
  const cfg=r.world.stations[station],cash=s.owners[station].cash;
  const candidates=new Set([...Object.keys(cfg.verbrauch),...Object.keys(cfg.ziel),
    ...cfg.linien.flatMap(id=>Object.keys(r.economy.rezepte[id].ein))]);
  for(const ware of candidates){
   const ziel=cfg.ziel[ware]||0,have=st.lager[ware]||0,consumption=cfg.verbrauch[ware]||0;
   const price=c.preis(s,station,ware,r);
   const deficit=Math.max(0,ziel-have),capacity=c.aufnehmbar(s,r,station,ware),
     maxBuyFromCash=price>0?Math.floor(cash/price):0;
   const isEssential=consumption>0;
   if(isEssential||deficit>0){
    needs.push({station,ware,consumption,have,target:ziel,deficit,price,cash,maxBuyFromCash,capacity});
    if(!byGood[ware])byGood[ware]={needSlots:0,deficitUnits:0,noCashSlots:0,noCashUnits:0,canBuyUnits:0,consumingStations:0,stockoutStations:0};
    const x=byGood[ware];x.needSlots++;x.deficitUnits+=deficit;
    if(deficit>0&&cash<price){x.noCashSlots++;x.noCashUnits+=deficit;}
    x.canBuyUnits+=capacity;if(isEssential){x.consumingStations++;if(have<consumption)x.stockoutStations++;}
   }
  }
 }
 const money=Object.values(s.owners).reduce((z,o)=>z+o.cash,0);
 assert.equal(money,s.initialSupply+s.minted-s.burned);
 const npcFreighters=Object.values(s.ships).filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter').length;
 return {day,tick:s.tick,hash:c.hash(s),money,initialSupply:s.initialSupply,minted:s.minted,burned:s.burned,
 wallets,perOwner,npcFreighters,npc3Miners:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length,
 market:byGood,essential:needs.filter(x=>x.consumption>0),
 globalTrades:s.stats.handel,foodConsumed:s.ledger.nahrung.consumed,medicinesConsumed:s.ledger.medikamente.consumed,
 shortage:s.stats.mangel,ownerOutlays:observer.buyerPays,stationPays:observer.stationPay,
 ownerReceipts:observer.sellerReceives,stationReceipts:observer.stationReceive,
 usageFees:s.stats.abgabe};
}
function run(seed,active,mode){
 const aa=observer(mode),bb=observer(mode);
 const a=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(aa);
 const b=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(bb);
 const r=a.rules,s=a.core.createState(seed,r),t=b.core.createState(seed,r);
 const points=[0,1,7,14,15,16,20,30,60,90],snap=[snapshot(s,a.core,r,0,aa)];
 let audits=0,saves=0;
 for(let tick=1;tick<=90*1440;tick++){
  if(active)for(const [time,cmd] of historic)if(time===tick)
   for(const [engine,st] of [[a.core,s],[b.core,t]])
    assert(engine.submit(st,cmd,r).ok,'validated historic command');
  assert.deepEqual(a.core.step(s,r),b.core.step(t,r),'same original transition');
  if(tick%60===0){
   assert(a.core.audit(s).ok&&b.core.audit(t).ok,'core supply audit');
   assert.equal(a.core.hash(s),b.core.hash(t),'deterministic replay hourly');
   const cash=Object.values(s.owners).reduce((v,x)=>v+x.cash,0);
   assert.equal(cash,s.initialSupply+s.minted-s.burned,'independent money audit');
   const goods={};
   for(const x of [...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)])
    for(const [k,n] of Object.entries(x)){assert(n>=0&&Number.isSafeInteger(n));goods[k]=(goods[k]||0)+n;}
   for(const [k,l] of Object.entries(s.ledger))
    assert.equal(goods[k]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'independent goods '+k);
   if(mode==='mint-6k'||mode==='mint-12k')
     assert.equal(s.minted-s.stats.kopfgeld,s.stats.b8p?.total||0,'global minted includes existing bounties and new audited pilot payments');
   if(mode==='transfer')assert.equal(s.minted,s.stats.kopfgeld,'transfer mode cannot mint new coins');
   audits++;
  }
  if(tick%1440===0){
    const day=tick/1440;
    if(points.includes(day))snap.push(snapshot(s,a.core,r,day,aa));
    if([14,30,60,90].includes(day))
      for(const [engine,st] of [[a.core,s],[b.core,t]]) {
       assert.equal(engine.hash(engine.load(engine.save(st),undefined,r)),engine.hash(st),'save load');saves++;
      }
  }
 }
 assert.equal(audits,2160);assert.equal(saves,8);
 assert.deepEqual(JSON.parse(JSON.stringify(aa)),JSON.parse(JSON.stringify(bb)),'same observer counts');
 assert.equal(a.core.hash(s),b.core.hash(t));
 if(mode==='original'&&seed===42)assert.equal(a.core.hash(s),active?'784047684dfe5c56':'adf155a018b94094','historical main control 90d');
 if(mode==='original'&&seed===7&&active)assert.equal(a.core.hash(s),'84153573536268f2','historical Seed7 active');
 return {seed,scenario:active?'active-hoarding':'passive',mode,hash:a.core.hash(s),audits,saves,
 totalEndDemand:s.stats.b8p?.total||0,bounties:s.stats.kopfgeld,totalMinted:s.minted,totalBurned:s.burned,
 snapshots:snap,trades:aa.tradeCount,tradeUnits:aa.volume,workDue:aa.workDue,workPaid:aa.workPaid,
 tradeSamples:aa.lastDeals};
}
const results=[];
for(const seed of [42,7])for(const mode of ['original','transfer','mint-6k','mint-12k'])results.push(run(seed,true,mode));
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'b8p-results.json'),JSON.stringify(results,null,2)+'\n');}
console.log('B8P_AUDIT_PASS '+JSON.stringify(results.map(x=>({seed:x.seed,scenario:x.scenario,mode:x.mode,hash:x.hash,raised:x.totalEndDemand,bounties:x.bounties,minted:x.totalMinted,burned:x.totalBurned,
 start:x.snapshots[0].wallets,day14:x.snapshots.find(s=>s.day===14)&&{
 wallets:x.snapshots.find(s=>s.day===14).wallets,npcFreighters:x.snapshots.find(s=>s.day===14).npcFreighters},
 day90:{wallets:x.snapshots.at(-1).wallets,npcFreighters:x.snapshots.at(-1).npcFreighters,
 shortage:x.snapshots.at(-1).market,food:x.snapshots.at(-1).foodConsumed,med:x.snapshots.at(-1).medicinesConsumed},
 trades:x.trades}))));
