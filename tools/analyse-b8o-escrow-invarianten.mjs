// B8o [ANALYSE] Contract-budget/escrow ledger architecture proof, NOT a patch to index.html.
// Test synthetic payment invariants using Rule14 actual hourly ship costs and 13 fixed seeds.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
assert.equal(createHash('sha256').update(source).digest('hex'),
  '035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const {rules,core}=new Function(source+';return {rules:m_data_rules.RULES,core:m_core_index};')();
const cost=rules.world.betriebskosten;
assert.deepEqual(cost,{miner:150,frachter:250,jaeger:50});
const integer=(n)=>Number.isSafeInteger(n)&&n>=0;
class Ledger {
 constructor(accounts){this.wallet={...accounts};this.held={};this.records={};this.next=1;
  this.initial=this.total();this.events=[];this.audit();}
 total(){return Object.values(this.wallet).reduce((a,b)=>a+b,0)+Object.values(this.held).reduce((a,b)=>a+b,0);}
 audit(){
  assert.equal(this.total(),this.initial,'no ISK creation or loss');
  assert(Object.values(this.wallet).every(integer));
  assert(Object.values(this.held).every(integer));
  for(const [id,c] of Object.entries(this.records)){
   assert(integer(c.spent)&&integer(c.reserved)&&integer(c.refunded));
   assert.equal(c.reserved,c.spent+c.refunded+(this.held[id]||0),
     'every ISK backed by a single escrow allocation');
  }
 }
 reserve(owner,ship,klasse,amount){
  assert(integer(amount)&&amount>0&&cost[klasse]>0);
  assert(Object.hasOwn(this.wallet,owner),'known actor');
  if(this.wallet[owner]<amount)return null;
  const id='esc'+String(this.next++).padStart(6,'0');
  this.wallet[owner]-=amount;this.held[id]=amount;
  this.records[id]={owner,ship,klasse,reserved:amount,spent:0,refunded:0,status:'active'};
  this.events.push({type:'reserve',id,amount});
  this.audit();return id;
 }
 pay(id,amount,to='fund'){
  assert(integer(amount));const c=this.records[id];
  assert(c&&c.status==='active','active escrow only');
  if(!Object.hasOwn(this.wallet,to))throw Error('unknown recipient');
  if(this.held[id]<amount)return false;
  this.held[id]-=amount;this.wallet[to]+=amount;c.spent+=amount;
  this.events.push({type:'pay',id,to,amount});this.audit();return true;
 }
 close(id,reason){
  const c=this.records[id];assert(c&&c.status==='active','cannot double-refund');
  const n=this.held[id];
  this.wallet[c.owner]+=n;c.refunded=n;delete this.held[id];c.status=reason;
  this.events.push({type:reason,id,refund:n});this.audit();return n;
 }
 save(){this.audit();return JSON.stringify({wallet:this.wallet,held:this.held,records:this.records,next:this.next,initial:this.initial,events:this.events});}
 static load(json){
  const value=JSON.parse(json),o=new Ledger({});
  Object.assign(o,value);o.audit();return o;
 }
}
const ceilCost=(klasse,minutes)=>Math.ceil(cost[klasse]*minutes/rules.economy.stunde);
const floorCost=(klasse,minutes)=>core.div(cost[klasse]*minutes,rules.economy.stunde);
const scenarios=[];
{
 const l=new Ledger({company:2000,freighter:0,miner:0,hunter:0,fund:0});
 // Exact current core's fractional accounting versus conservative contract reserve.
 const t=l.reserve('company','sh-t','frachter',ceilCost('frachter',40));
 assert.equal(ceilCost('frachter',40),167);
 assert(l.pay(t,floorCost('frachter',40)));assert.equal(l.close(t,'arrived'),1);
 const m=l.reserve('company','sh-m','miner',2*ceilCost('miner',60));
 assert(l.pay(m,150));assert(l.pay(m,150));assert.equal(l.close(m,'completed'),0);
 const f=l.reserve('company','sh-f','jaeger',3*ceilCost('jaeger',60));
 assert(l.pay(f,50));assert.equal(l.close(f,'ship-lost'),100);
 assert.equal(l.total(),2000);assert.equal(l.wallet.fund,516);
 assert.equal(l.wallet.company,1484);
 assert.throws(()=>l.close(f,'double-refund'));
 scenarios.push({name:'three real-cost ship roles, cancellation and refunds',cash:l.wallet.company,paid:l.wallet.fund});
}
{
 const l=new Ledger({company:180,other:0,fund:0});
 const c=l.reserve('company','shipA','frachter',167);
 assert(c);assert.equal(l.reserve('company','shipB','miner',150),null);
 assert.equal(l.wallet.company,13);
 assert.equal(l.pay(c,168),false);
 // Save/load of an active contract preserves claim and the global money audit.
 const rehydrated=Ledger.load(l.save());
 assert.equal(rehydrated.wallet.company,13);assert.equal(rehydrated.held[c],167);
 assert(rehydrated.pay(c,166));assert.equal(rehydrated.close(c,'arrived'),1);
 assert.equal(rehydrated.wallet.company,14);assert.equal(rehydrated.wallet.fund,166);
 scenarios.push({name:'concurrent overspend rejected and outstanding escrow survives reload',total:rehydrated.total()});
}
const seeds=[1,2,7,11,13,17,23,42,73,101,1234,98765,65535];
const stress=[];
for(const seed of seeds){
 let x=seed>>>0;
 const rng=(n)=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x%n;};
 const l=new Ledger({corpA:30000,corpB:30000,fund:1000});
 const pending=[],paid={miner:0,frachter:0,jaeger:0},refund={miner:0,frachter:0,jaeger:0};
 for(let i=0;i<1000;i++){
  const owner=rng(2)?'corpA':'corpB',classe=['miner','frachter','jaeger'][rng(3)];
  const mins=(1+rng(5))*60,amount=ceilCost(classe,mins);
  const id=l.reserve(owner,'ship'+i,classe,amount);
  if(id)pending.push(id);
  if(pending.length && rng(3)>0){
   const index=rng(pending.length),key=pending.splice(index,1)[0],c=l.records[key];
   const actual=Math.min(l.held[key],floorCost(c.klasse,rng(300)));
   assert(l.pay(key,actual,'fund'));
   paid[c.klasse]+=actual;refund[c.klasse]+=l.close(key,rng(2)?'arrived':'ship-lost');
  }
  if(i%113===0)assert.equal(Ledger.load(l.save()).total(),l.initial);
 }
 for(const key of pending){const c=l.records[key];refund[c.klasse]+=l.close(key,'cancelled');}
 assert.equal(l.total(),61000);assert.equal(Object.keys(l.held).length,0);
 stress.push({seed,transfers:l.events.length,paid,refund,finalCash:{corpA:l.wallet.corpA,corpB:l.wallet.corpB,fund:l.wallet.fund}});
}
console.log('B8O_ESCROW_PASS '+JSON.stringify({codeHash:createHash('sha256').update(source).digest('hex'),scenarios,stressSeeds:seeds,stressTransactions:stress.reduce((sum,s)=>sum+s.transfers,0),
 sample:stress.slice(0,2)}));
