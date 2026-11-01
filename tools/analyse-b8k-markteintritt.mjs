// B8k [ANALYSE]: actual NPC3-financed market entry on unchanged Rule-14 core.
// Two independent deterministic replays; all interventions are analysis-only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import path from 'node:path';

const html=fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const original=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const sourceHash=createHash('sha256').update(original).digest('hex');
assert.equal(sourceHash,'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
let instrumented=original;
for(const [needle,replacement] of [
 ["  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n  observer.trade(state,schiff,station,ware,menge,kauf,wert,fee);"],
 ["    const n = Math.min(besitzer.cash, kosten);",
  "    const n = Math.min(besitzer.cash, kosten);\n    observer.work(state,s,arbeit,kosten,n);"],
 ["function zerstoeren(state, rules, s) {\n  const { markt, owner } = rules.world.piraten;",
  "function zerstoeren(state, rules, s) {\n  observer.loss(state,s);\n  const { markt, owner } = rules.world.piraten;"]
]){
 assert.equal(instrumented.split(needle).length,2,'unique read-only observer hook');
 instrumented=instrumented.replace(needle,replacement);
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
const observer=()=>({
 trades:[],workDue:0,workPaid:0,shipDue:0,shipPaid:0,losses:[],
 trade(state,s,station,ware,qty,buy,value,fee) {
   if(s.owner==='npc3'&&s.klasse==='frachter')
     this.trades.push({tick:state.tick,ship:s.id,station,ware,qty,buy,value,fee});
 },
 work(state,s,minutes,due,paid) {
   if(s.owner!=='npc3')return;
   this.workDue+=due;this.workPaid+=paid;
   if(s.klasse==='frachter'){this.shipDue+=due;this.shipPaid+=paid;}
 },
 loss(state,s){
   if(s.owner==='npc3'&&s.klasse==='frachter')
     this.losses.push({tick:state.tick,ship:s.id,cargo:{...s.ladung}});
 }
});
function one(seed,scenario,policy) {
 const o=observer(),p=observer();
 const a=new Function('observer',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(o);
 const b=new Function('observer',instrumented+';return {core:m_core_index,rules:m_data_rules.RULES};')(p);
 const c=a.core,r=a.rules,world=c.createState(seed,r),replay=b.core.createState(seed,r);
 let shipId=null,stage='await-hull',cycles=0,attempts=0,checks=0,saves=0;
 let purchaseActual=0,commands=0;
 const events=[],snapshots=[];
 const freighter=()=>Object.values(world.ships).find(x=>x.owner==='npc3'&&x.klasse==='frachter');
 const quote=()=>{
  const from='st_dravos',to='st_aldera',ware='silizium';
  const pb=c.preis(world,from,ware,r),ps=c.preis(world,to,ware,r);
  const available=c.verkaufbar(world,r,from,ware),capacity=c.aufnehmbar(world,r,to,ware);
  const buyer=world.owners.st_aldera.cash;
  const miners=Object.values(world.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length;
  const reserve=miners*r.world.betriebskosten.miner;
  const travel=c.route(r.world,'dravos','aldera');
  const oneLeg=Math.ceil(travel.zeit*r.world.betriebskosten.frachter/60);
  const limit=Math.min(r.economy.cargo,available,capacity,
    Math.floor(buyer*(policy==='buffered'?0.8:1)/Math.max(1,ps)));
  let choice=null;
  for(let n=1;n<=limit;n++){
    const cost=n*pb+c.gebuehr(world,r,from,n*pb);
    const revenue=n*ps-c.gebuehr(world,r,to,n*ps);
    const net=revenue-cost-2*oneLeg;
    if(net>0&&world.owners.npc3.cash-cost-2*oneLeg>=reserve)
      choice={qty:n,predictedNet:net,buyerCash:buyer,minerReserve:reserve};
  }
  return choice;
 };
 const send=(command)=>{
  for(const [s,core] of [[world,c],[replay,b.core]])
   assert(core.submit(s,command,r).ok,'validated actual core command '+JSON.stringify(command));
  commands++;
 };
 for(let t=1;t<=90*1440;t++){
  if(scenario==='active')for(const [tick,command] of historic)if(tick===t)send(command);
  if(policy!=='control'&&t===14*1440+1){
    for(const state of [world,replay])
      state.sollflotte.npc3.push({klasse:'frachter',heimat:'dravos',auftrag:'halten',ware:null});
    events.push({tick:t,action:'intent',cash:world.owners.npc3.cash});
  }
  const ship=policy==='control'?null:freighter();
  if(ship&&!shipId){
   shipId=ship.id;
   events.push({tick:t,action:'real-hull',ship:ship.id,cash:world.owners.npc3.cash});
  }
  if(ship&&ship.id===shipId) {
    let command=null;
    if(stage==='await-hull'&&ship.phase==='dock'&&ship.system==='dravos')stage='source-ready';
    if(stage==='source-ready'&&ship.phase==='dock'&&ship.system==='dravos'
      &&!(ship.ladung.silizium||0)){
      const q=quote();
      if(q){
        command={type:'shipTrade',owner:'npc3',schiff:shipId,ware:'silizium',menge:q.qty,kauf:true};
        stage='await-buy';attempts++;
        events.push({tick:t,action:'buy-quote',...q});
      }
    }else if(stage==='await-buy'&&ship.phase==='dock'&&ship.system==='dravos'
       &&(ship.ladung.silizium||0)>0){
      command={type:'shipMove',owner:'npc3',schiff:shipId,ziel:'st_aldera'};
      stage='await-sale';
    }else if((stage==='await-sale'||stage==='unsold')&&ship.phase==='dock'&&ship.system==='aldera'){
      const rem=ship.ladung.silizium||0;
      if(rem>0){
        if(c.aufnehmbar(world,r,'st_aldera','silizium')>=rem)
          command={type:'shipTrade',owner:'npc3',schiff:shipId,ware:'silizium',menge:rem,kauf:false};
        stage='unsold';
      }else{
        cycles++;
        events.push({tick:t,action:'fully-sold',cycles,cash:world.owners.npc3.cash});
        stage='await-next-opportunity';
      }
    }
    if(stage==='await-next-opportunity'&&ship.phase==='dock'&&ship.system==='aldera'){
      const q=quote();
      if(q){
        command={type:'shipMove',owner:'npc3',schiff:shipId,ziel:'st_dravos'};
        stage='await-source-next';
      }
    }else if(stage==='await-source-next'&&ship.phase==='dock'&&ship.system==='dravos'){
      stage='source-ready';
    }
    if(command)send(command);
  }else if(shipId&&!ship&&stage!=='lost'){
    stage='lost';events.push({tick:t,action:'ship-lost'});
  }
  assert.deepEqual(c.step(world,r),b.core.step(replay,r),'identical executed commands');
  if(t%60===0){
    assert(c.audit(world).ok&&b.core.audit(replay).ok);
    assert.equal(c.hash(world),b.core.hash(replay),'hourly deterministic hash');
    const realCash=Object.values(world.owners).reduce((x,z)=>x+z.cash,0);
    assert.equal(realCash,world.initialSupply+world.minted-world.burned);
    const hold={};
    for(const h of [...Object.values(world.stations).map(x=>x.lager),
                   ...Object.values(world.ships).map(x=>x.ladung)])
      for(const [name,n] of Object.entries(h)){
        assert(Number.isSafeInteger(n)&&n>=0);
        hold[name]=(hold[name]||0)+n;
      }
    for(const [name,l] of Object.entries(world.ledger))
      assert.equal(hold[name]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
        'independent inventory '+name);
    checks++;
  }
  if(t%1440===0){
    const day=t/1440;
    if([14,15,16,17,20,30,60,90].includes(day))
      snapshots.push({day,cash:world.owners.npc3.cash,aldera:world.owners.st_aldera.cash,
        ship:!!freighter(),miners:Object.values(world.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length,
        cycles,stage,unpaid:o.workDue-o.workPaid});
    if([14,30,60,90].includes(day)){
      for(const [s,core] of [[world,c],[replay,b.core]])
        assert.equal(core.hash(core.load(core.save(s),undefined,r)),core.hash(s));
      saves+=2;
    }
  }
 }
 assert.equal(checks,2160);assert.equal(saves,8);
 assert.deepEqual(o,p,'independent observer replay');
 const hull=o.trades.filter(x=>x.ware==='frachter');
 const cargo=o.trades.filter(x=>x.ware!=='frachter');
 const money=cargo.reduce((sum,x)=>sum+(x.buy?-(x.value+x.fee):x.value-x.fee),0);
 const hullCost=hull.reduce((sum,x)=>sum+x.value+x.fee,0);
 const result={seed,scenario,policy,hash:c.hash(world),sourceHash,checks,saves,commands,
   cycles,attempts,stage,shipId,shipAlive:Boolean(shipId&&world.ships[shipId]),
   paidHulls:hull.length,hullCost,freighterCashBeforeWork:money,freighterWorkPaid:o.shipPaid,
   freighterWorkDue:o.shipDue,freighterNet:money-o.shipPaid,
   netAfterHull:money-o.shipPaid-hullCost,
   npc3Unpaid:o.workDue-o.workPaid,npc3Cash:world.owners.npc3.cash,
   cargoPurchases:cargo.filter(x=>x.buy).length,cargoSales:cargo.filter(x=>!x.buy).length,
   npc3Losses:o.losses,events,snapshots};
 if(policy==='control'&&scenario==='active'&&seed===42)
   assert.equal(result.hash,'784047684dfe5c56');
 if(policy==='control'&&scenario==='passive'&&seed===42)
   assert.equal(result.hash,'adf155a018b94094');
 return result;
}
const cases=[];
for(const seed of [42,7]){
 cases.push(one(seed,'active','control'),one(seed,'passive','control'));
 for(const policy of ['fullcash','buffered'])cases.push(one(seed,'active',policy));
}
const expected={
 '42|fullcash':{cycles:4,freighterWorkPaid:660,netAfterHull:207,npc3Cash:428,npc3Unpaid:0,hash:'ef6a05b90ddfdcc7'},
 '7|fullcash':{cycles:3,freighterWorkPaid:577,netAfterHull:1080,npc3Cash:1009,npc3Unpaid:0,hash:'44f7f16e707d4a5c'},
 '42|buffered':{cycles:5,freighterWorkPaid:826,netAfterHull:62,npc3Cash:0,npc3Unpaid:31,hash:'952c829a22fa1ec3'},
 '7|buffered':{cycles:4,freighterWorkPaid:743,netAfterHull:842,npc3Cash:7,npc3Unpaid:0,hash:'04a00543329fb65d'}
};
for(const q of cases){
 const e=expected[q.seed+'|'+q.policy];if(!e)continue;
 for(const [key,val] of Object.entries(e))assert.equal(q[key],val,q.seed+' '+q.policy+' '+key);
 assert.equal(q.paidHulls,1);
 assert(q.shipAlive);
}
const directory=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(directory){fs.mkdirSync(directory,{recursive:true});
 fs.writeFileSync(path.join(directory,'b8k-results.json'),JSON.stringify(cases,null,2)+'\n');}
console.log('B8K_AUDIT_PASS '+JSON.stringify(cases.map(q=>({
 seed:q.seed,scenario:q.scenario,policy:q.policy,hash:q.hash,checks:q.checks,
 cycles:q.cycles,shipAlive:q.shipAlive,paidHulls:q.paidHulls,
 netAfterHull:q.netAfterHull,npc3Cash:q.npc3Cash,npc3Unpaid:q.npc3Unpaid}))));
