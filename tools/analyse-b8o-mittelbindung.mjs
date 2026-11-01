// B8o [ANALYSE] Standalone shadow contract ledger + original core replay.
// No mutation of main index.html and no deployment of the shadow ledger.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
assert.equal(createHash('sha256').update(source).digest('hex'),
 '035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const {core,rules}=new Function(source+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const cost=(klass,minutes)=>Math.ceil(minutes*rules.world.betriebskosten[klass]/rules.economy.stunde);
class ShadowLedger {
 constructor(){this.holds=new Map();this.actions=[];}
 balance(owner,state){return state.owners[owner].cash;}
 outstanding(owner){return [...this.holds.values()].filter(h=>h.owner===owner).reduce((v,h)=>v+h.remaining,0);}
 free(owner,state){return this.balance(owner,state)-this.outstanding(owner);}
 reserve(owner,id,amount,state){
  assert(Number.isSafeInteger(amount)&&amount>=0);assert(!this.holds.has(id));
  if(this.free(owner,state)<amount){this.actions.push({type:'reject',owner,id,amount,free:this.free(owner,state)});return false;}
  this.holds.set(id,{owner,remaining:amount,initial:amount});
  this.actions.push({type:'reserve',owner,id,amount});
  return true;
 }
 settle(id,amount,state){
  const h=this.holds.get(id);assert(h);assert(Number.isSafeInteger(amount)&&amount>=0&&amount<=h.remaining);
  // Shadow only: the original game's cash debit would run via the ordinary core.
  assert(state.owners[h.owner].cash>=amount);
  h.remaining-=amount;
  this.actions.push({type:'settle',id,amount});
  if(!h.remaining)this.holds.delete(id);
 }
 cancel(id){const h=this.holds.get(id);if(!h)return 0;this.holds.delete(id);this.actions.push({type:'release',id,amount:h.remaining});return h.remaining;}
 invariant(owner,state){return this.outstanding(owner)<=this.balance(owner,state);}
}
function cases(){
 const base=core.createState(42,rules),starting=base.owners.npc3.cash;
 assert.equal(starting,2000);
 assert.equal(rules.world.betriebskosten.frachter,250);
 assert.equal(rules.world.betriebskosten.miner,150);
 assert.equal(rules.world.betriebskosten.jaeger,50);
 const table=[];
 // Real, shared owner wallet; independent contracts cannot book the same ISK twice.
 for(const klass of ['frachter','miner','jaeger']){
  const l=new ShadowLedger(),one=cost(klass,60),reserve=one+600;
  const st=core.createState(42,rules);
  assert(l.reserve('npc3',klass+':A',reserve,st));
  assert(!l.reserve('npc3',klass+':A',reserve,st)); // duplicate ID is invalid
 }
 // Case 1: Two paid merchant hulls from real NPC3 starting cash + one hour miner reserve.
 const l=new ShadowLedger();
 const freighter=780+cost('frachter',60)+cost('miner',60);
 assert.equal(freighter,1180);
 assert(l.reserve('npc3','shA',freighter,base));
 assert.equal(l.free('npc3',base),820);
 assert.equal(l.reserve('npc3','shB',freighter,base),false);
 assert(l.reserve('npc3','minerX',cost('miner',60),base));
 assert.equal(l.outstanding('npc3'),1330);
 assert.equal(l.free('npc3',base),670);
 assert(l.invariant('npc3',base));
 // Another core spending the same unmarked cash would violate this shadow-only guarantee.
 const other=core.createState(42,rules);
 other.owners.npc3.cash-=800;
 assert.equal(l.invariant('npc3',other),false);
 table.push({case:'two concurrent freighters with shared npc3 wallet',wallet:starting,
  first:freighter,secondRejected:true,remainingFree:670,thirdPartyDebitBreaksCoverage:true});
 // Case 2: Paying the outstanding obligation reduces both cash and the held amount, no ISK minted.
 const paid=core.createState(42,rules);
 paid.owners.npc3.cash-=250;
 l.settle('shA',250,paid);
 assert.equal(l.free('npc3',paid),670);
 assert(l.invariant('npc3',paid));
 assert.equal(l.cancel('shA'),930);
 assert.equal(l.outstanding('npc3'),150);
 assert(l.invariant('npc3',paid));
 assert.equal(core.audit(paid).ok,false); // manually debited cash (no counterparty): intentionally invalid!
 // Case 3: Test accounting with a funded transfer; an escrow is NOT a source/sink of ISK.
 const transfer=core.createState(42,rules),ledger=new ShadowLedger();
 assert(ledger.reserve('npc3','fly',cost('frachter',90),transfer));
 const before=Object.values(transfer.owners).reduce((a,x)=>a+x.cash,0);
 const payment=cost('frachter',60);
 transfer.owners.npc3.cash-=payment;transfer.owners.fonds_aldera.cash+=payment;
 ledger.settle('fly',payment,transfer);
 assert(ledger.invariant('npc3',transfer));
 assert.equal(Object.values(transfer.owners).reduce((a,x)=>a+x.cash,0),before);
 assert(core.audit(transfer).ok);
 assert.equal(ledger.cancel('fly'),cost('frachter',90)-payment);
 table.push({case:'real funded partial hourly payment and cancellation',held:cost('frachter',90),
  paid:payment,remainingReleased:cost('frachter',90)-payment,moneyMinted:0,moneyBurned:0});
 // Case 4: Three class commitments and bankruptcy. This ledger must include *all* account debits,
 // not merely trader departures; artificial cash loss has to be detected as an invariant breach.
 const mixed=core.createState(7,rules),lg=new ShadowLedger();
 for(const [id,klass,minutes] of [['m1','miner',60],['f1','frachter',120],['j1','jaeger',60]])
  assert(lg.reserve('npc3',id,cost(klass,minutes),mixed));
 assert.equal(lg.outstanding('npc3'),700);
 assert(lg.invariant('npc3',mixed));
 mixed.owners.npc3.cash=500;
 assert(!lg.invariant('npc3',mixed));
 table.push({case:'miner-freighter-fighter shared obligations',commitments:700,
  originalWallet:2000,simulatedThirdPartyCash:500,coverageFailureDetected:true});
 return table;
}
function crisis(seed,active){
 const s=core.createState(seed,rules),a=core.createState(seed,rules);
 const cmds=[
 [1,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}],
 [2,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}],
 [3,{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}],
 [4,{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}],
 [5,{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh002'}],
 [5,{owner:'house',type:'shipHandeln',schiff:'sh029'}]
 ];
 let audits=0,saves=0;
 for(let tick=1;tick<=90*1440;tick++){
  if(active)for(const [at,c] of cmds)if(at===tick){assert(core.submit(s,c,rules).ok);assert(core.submit(a,c,rules).ok);}
  core.step(s,rules);core.step(a,rules);
  if(tick%60===0){
   assert(core.audit(s).ok&&core.audit(a).ok);
   assert.equal(core.hash(s),core.hash(a));
   const cash=Object.values(s.owners).reduce((v,x)=>v+x.cash,0);
   assert.equal(cash,s.initialSupply+s.minted-s.burned);
   const goods={};
   for(const x of [...Object.values(s.stations).map(v=>v.lager),...Object.values(s.ships).map(v=>v.ladung)])
    for(const [k,n] of Object.entries(x))goods[k]=(goods[k]||0)+n;
   for(const [k,l] of Object.entries(s.ledger))
    assert.equal(goods[k]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported);
   audits++;
  }
  if(tick%1440===0&&[14,30,60,90].includes(tick/1440)){
   assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
   assert.equal(core.hash(core.load(core.save(a),undefined,rules)),core.hash(a));
   saves+=2;
  }
 }
 assert.equal(audits,2160);assert.equal(saves,8);
 if(seed===42)assert.equal(core.hash(s),active?'784047684dfe5c56':'adf155a018b94094');
 if(seed===7&&active)assert.equal(core.hash(s),'84153573536268f2');
 return {seed,scenario:active?'player-crisis':'passive',hash:core.hash(s),audits,saves,
 cashNpc3:s.owners.npc3.cash,cashTraders:s.owners.npc1.cash+s.owners.npc2.cash};
}
const checks=cases(),worlds=[];
for(const seed of [42,7])for(const active of [true,false])worlds.push(crisis(seed,active));
const out=process.argv.find(x=>x.startsWith('--out='))?.slice(6);
if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'b8o-results.json'),JSON.stringify({checks,worlds},null,2)+'\n');}
console.log('B8O_AUDIT_PASS '+JSON.stringify({checks,worlds}));
