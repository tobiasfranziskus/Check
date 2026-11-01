// B8p [ANALYSE] Four bounded civilian-consumption financing counterfactuals.
// Non-production observer only: no model-B emission rule is approved.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
assert.equal(createHash('sha256').update(original).digest('hex'),
 '035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const hooks=[
["      st.lager[ware] = da - n; state.ledger[ware].consumed += n;",
 "      st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      probe.consume(state,rules,id,ware,n);"],
["  buche(state, schiff.owner, 'kosten', fee);",
 "  buche(state, schiff.owner, 'kosten', fee);\n  probe.trade(state,schiff,station,ware,menge,kauf,wert,fee);"]
];
let instrumented=original;
for(const [from,to] of hooks){assert.equal(instrumented.split(from).length,2,'unique core hook');instrumented=instrumented.replace(from,to);}
const historic=[
 [1,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}],
 [2,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}],
 [3,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}],
 [4,{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}],
 [5,{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh002'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh029'}]
];
const RATE=3, DAILY_CAP=120, LIFETIME_CAP=6000;
const keys=['nahrung','medikamente'];
const sum=a=>a.reduce((x,v)=>x+v,0);
function observer(mode){
 return {
  mode,credits:{},payments:0,minted:0,funded:0,paidUnits:0,consumedUnits:0,
  eligibleUnits:0,deliveredUnits:0,dayUsed:{},payoutSamples:[],
  trade(state,ship,station,ware,qty,buy,value,fee){
   if(buy||!keys.includes(ware))return;
   const k=station+':'+ware;
   this.credits[k]=(this.credits[k]||0)+qty;this.deliveredUnits+=qty;
  },
  consume(state,rules,station,ware,n){
   if(!keys.includes(ware)||n<=0)return;
   this.consumedUnits+=n;
   if(this.mode==='control')return;
   const k=station+':'+ware;
   // The optimistic consumption arm pays against any physical consumption,
   // including goods that existed when the world was created.
   const eligible=this.mode==='mint-all-consumption'?n:Math.min(n,this.credits[k]||0);
   if(this.mode!=='mint-all-consumption')this.credits[k]-=eligible;
   if(eligible<=0)return;
   this.eligibleUnits+=eligible;
   const day=Math.floor((state.tick-1)/1440);
   const budget=Math.min(DAILY_CAP-(this.dayUsed[day]||0),LIFETIME_CAP-this.payments,eligible*RATE);
   if(budget<=0)return;
   let credited=0;
   if(this.mode==='fund-delivery'){
    // Conservative: existing common public fund balances only, deterministic IDs.
    // Transfer is financial redistribution, NOT new ISK. No subsidy to specific corporations.
    for(const fund of Object.keys(state.owners).filter(id=>state.owners[id].kind==='fund').sort()){
     const amount=Math.min(state.owners[fund].cash,budget-credited);
     if(amount<=0)continue;
     state.owners[fund].cash-=amount;state.owners[station].cash+=amount;
     credited+=amount;
     if(credited===budget)break;
    }
    this.funded+=credited;
   } else {
    credited=budget;
    state.owners[station].cash+=credited;
    state.minted+=credited;
    this.minted+=credited;
   }
   this.payments+=credited;this.paidUnits+=Math.min(eligible,Math.ceil(credited/RATE));
   this.dayUsed[day]=(this.dayUsed[day]||0)+credited;
   if(this.payoutSamples.length<25&&credited>0)this.payoutSamples.push({tick:state.tick,station,ware,
    consumed:n,eligible,paid:credited,remainingBudget:LIFETIME_CAP-this.payments});
  }
 };
}
function snapshot(st,engine,r,obs,day){
 const owners=Object.fromEntries(Object.entries(st.owners).map(([id,v])=>[id,v.cash]));
 const cashClass={};
 for(const x of Object.values(st.owners))cashClass[x.kind]=(cashClass[x.kind]||0)+x.cash;
 const consumed=Object.fromEntries(keys.map(k=>[k,st.ledger[k].consumed]));
 const shortage={};
 for(const ware of keys){
  shortage[ware]=Object.entries(st.stations).filter(([id])=>r.world.stations[id].verbrauch[ware]>0
    &&st.stats.mangel[id][ware]>0).length;
 }
 // Count shortage during last 24h (new additional shortages, not cumulative).
 return {day,tick:st.tick,cashClass,owners,consumed,shortage,
  traded:st.stats.handel,freighters:Object.values(st.ships).filter(s=>s.klasse==='frachter'&&['npc1','npc2'].includes(s.owner)).length,
  paid:obs.payments,minted:st.minted,burned:st.burned,
  money:Object.values(st.owners).reduce((acc,x)=>acc+x.cash,0)};
}
function run(seed,mode){
 const aa=observer(mode),bb=observer(mode);
 const a=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(aa);
 const b=new Function('probe',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(bb);
 const r=a.rules,s=a.core.createState(seed,r),t=b.core.createState(seed,r);
 let audits=0,saves=0,firstNoFreight=null;
 const dates=new Set([0,1,7,14,15,20,30,60,90]);
 const points=[snapshot(s,a.core,r,aa,0)];
 for(let tick=1;tick<=90*1440;tick++){
  for(const [at,cmd] of historic)if(at===tick){
   assert(a.core.submit(s,cmd,r).ok);assert(b.core.submit(t,cmd,r).ok);
  }
  assert.deepEqual(a.core.step(s,r),b.core.step(t,r));
  if(s.tick>=14*1440&&!firstNoFreight&&Object.values(s.ships).filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter').length===0)
   firstNoFreight=s.tick;
  if(tick%60===0){
   assert(a.core.audit(s).ok&&b.core.audit(t).ok,'core audit money+goods');
   assert.equal(a.core.hash(s),b.core.hash(t),'deterministic replay');
   assert.equal(Object.values(s.owners).reduce((x,z)=>x+z.cash,0),s.initialSupply+s.minted-s.burned,
    'independent money with audited emission');
   const goods={};for(const l of [...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)])
    for(const [k,n] of Object.entries(l)){assert(Number.isSafeInteger(n)&&n>=0);goods[k]=(goods[k]||0)+n;}
   for(const [k,l] of Object.entries(s.ledger))
    assert.equal(goods[k]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,'independent goods');
   assert(aa.payments<=LIFETIME_CAP&&aa.dayUsed[Math.floor((tick-1)/1440)]<=DAILY_CAP,'budget capped');
   audits++;
  }
  if(tick%1440===0){
   const day=tick/1440;
   if(dates.has(day))points.push(snapshot(s,a.core,r,aa,day));
   if([14,30,60,90].includes(day))for(const [e,w] of [[a.core,s],[b.core,t]]){
    assert.equal(e.hash(e.load(e.save(w),undefined,r)),e.hash(w),'save-load within same rules');
    saves++;
   }
  }
 }
 assert.equal(audits,2160);assert.equal(saves,8);
 assert.deepEqual(JSON.parse(JSON.stringify(aa)),JSON.parse(JSON.stringify(bb)));
 if(seed===42&&mode==='control')assert.equal(a.core.hash(s),'784047684dfe5c56','main original hash');
 if(seed===7&&mode==='control')assert.equal(a.core.hash(s),'84153573536268f2','original baseline seed7');
 if(mode==='control')assert.equal(s.minted,0);
 if(mode==='fund-delivery')assert.equal(s.minted,0);
 else if(mode!=='control')assert.equal(s.minted,aa.minted);
 assert.equal(aa.payments,aa.funded+aa.minted);
 return {seed,mode,hash:a.core.hash(s),audits,saves,firstNoFreight,points,
  issued:aa.minted,transferred:aa.funded,paid:aa.payments,eligibleUnits:aa.eligibleUnits,
  deliveredUnits:aa.deliveredUnits,consumedUnits:aa.consumedUnits,payoutSamples:aa.payoutSamples};
}
const all=[];
for(const seed of [42,7])
 for(const mode of ['control','fund-delivery','mint-delivery','mint-all-consumption'])
  all.push(run(seed,mode));
const folder=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(folder){fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'b8p-results.json'),JSON.stringify(all,null,2)+'\n');}
console.log('B8P_AUDIT_PASS '+JSON.stringify(all.map(x=>({
 seed:x.seed,mode:x.mode,hash:x.hash,issued:x.issued,transferred:x.transferred,
 eligibleUnits:x.eligibleUnits,deliveredUnits:x.deliveredUnits,consumedUnits:x.consumedUnits,
 firstNoFreight:x.firstNoFreight,day14:x.points.find(p=>p.day===14),
 day90:x.points.at(-1)
}))));
