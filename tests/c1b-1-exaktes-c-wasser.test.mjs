import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createResearchCore,PROFILE,RULE_VERSION} from '../tools/research/c1b-1-wasser.mjs';

const c=createResearchCore();
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
// A fresh, UNREGISTERED original instance: C1a control and legacy loader isolation.
const stock=Function(html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='))+
 '\nreturn {api:m_core_index,serialize:m_core_serialize,modules:[m_core_w5n,m_core_w5o,m_core_w5q,m_core_w5r]};')();
const oldRules=structuredClone(stock.api.W5R_RULES);
Object.assign(oldRules.w5n,{mineLohn:1,rezeptEis:50,rezeptWasser:50,fabrikMinuten:100,fabrikLohn:1,wasserPreis:18,frachtJeMinute:2.25});
oldRules.economy.waren.wasser.basis=18;
const clone=x=>JSON.parse(JSON.stringify(x));
const good=s=>assert.equal(c.audit(s).ok,true,JSON.stringify(c.audit(s)));
function independent(s,exact){
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0);
 for(const [ware,l]of Object.entries(s.ledger)){
  const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
   +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(actual,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 const w=s.w5n,a=w.frachtauftrag,f=w.fabrikauftrag;
 assert.equal(s.owners.w5n_fracht_arbeit?.cash||0,a?120-a.gearbeitet:0);
 assert.equal(s.owners.w5n_fracht_kauf?.cash||0,a?(a.phase==='hin'?520:270):0);
 assert.equal(s.owners.w5n_fabrik_arbeit?.cash||0,f?100-f.gearbeitet:0);
 assert.equal(w.frachtLohn,120*w.frachtAbgeschlossen+(a?.gearbeitet||0));
 assert.equal(w.frachtUmsatz,270*w.frachtAbgeschlossen);
 assert.equal(w.fabrikBezahlt,100*w.fabrikFertig+(f?.gearbeitet||0));
 assert.equal(w.mineLohn,w.mineMinuten);
 assert.equal(s.w5o.ausgezahlt,s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser);
 assert.ok(s.w5o.lohnEis<=w.mineLohn&&s.w5o.lohnFracht<=w.frachtLohn&&s.w5o.lohnWasser<=w.fabrikBezahlt);
 assert.equal(s.owners.w5n_kunden.cash,1400+s.w5o.ausgezahlt-18*w.wasserVerbraucht);
 assert.equal(w.wasserErlos,18*w.wasserVerbraucht);
 assert.equal(w.wasserProduziert,50*w.fabrikFertig);
 assert.equal(s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation,0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.exported,0);
 if(exact){
  const work=Object.values(s.c1b.mining);
  assert.equal(work.reduce((n,x)=>n+x.minutes,0),w.mineMinuten);
  assert.equal(work.reduce((n,x)=>n+Math.floor(x.minutes/2),0),w.eisAbgebaut);
 }else assert.equal(w.eisAbgebaut,w.mineMinuten);
 const lost=new Set(s.w5r.losses.map(x=>x.id));assert.equal(lost.size,s.w5r.losses.length);
 for(const p of s.w5r.purchases){assert.equal(p.cost,p.type==='miner'?600:750);assert.ok(s.ships[p.id]||lost.has(p.id));}
}
function advance(s,n){for(let i=0;i<n;i++)c.step(s);return s;}

test('C1b-1: registered immutable rules and two-way save/profile isolation',()=>{
 assert.equal(c.profile,PROFILE);assert.equal(c.rules.rulesVersion,RULE_VERSION);
 assert.ok(Object.isFrozen(c.rules.w5n));
 const s=c.create(),legacy=stock.api.createW5RState(42,'wages');
 const h=stock.api.hash(legacy);
 assert.throws(()=>c.load(stock.api.save(legacy)),/Profil/);
 assert.throws(()=>c.step(legacy),/Profil/);assert.equal(stock.api.hash(legacy),h);
 assert.throws(()=>stock.api.loadW5R(c.save(s)),/inkompatibel/);
 assert.throws(()=>stock.api.load(c.save(s)),/neuer|Regel/);
 const control=stock.api.createW5RState(42,'wages');stock.api.step(control,oldRules);
 assert.throws(()=>c.load(stock.api.save(control)),/Profil/,'C1a has no C1b identity');
 assert.equal(c.hash(c.load(c.save(s))),c.hash(s));
 assert.equal(stock.api.W5R_RULES.rulesVersion,32,'private registration did not alter R32');
});
test('C1b-1: exactly 50 ice from 100 paid minutes, odd-minute roundtrip and continuation',()=>{
 let s=c.create();const start=s.owners.npc3.cash;
 c.step(s);assert.equal(s.w5n.eisAbgebaut,0);assert.equal(s.w5n.mineLohn,1);
 assert.equal(s.c1b.mining.sh001.rest,1);
 const h=c.hash(s);s=c.load(c.save(s));assert.equal(c.hash(s),h);
 advance(s,98);assert.equal(s.w5n.eisAbgebaut,49);assert.equal(s.w5n.mineLohn,99);
 s=c.load(c.save(s));c.step(s);
 assert.equal(s.w5n.eisAbgebaut,50);assert.equal(s.w5n.mineMinuten,100);assert.equal(s.w5n.mineLohn,100);
 assert.equal(s.owners.npc3.cash,start-100+250,'real work cost and real ice sale');
 assert.equal(s.c1b.mining.sh001.rest,0);independent(s,true);good(s);
});
test('C1b-1: injected missing funding cannot pay or finish a second work minute',()=>{
 const s=advance(c.create(),1);
 // Adversarial funding fault, NOT a valid economic scenario/save. Preserve world ISK.
 s.owners.house.cash+=s.owners.npc3.cash;s.owners.npc3.cash=0;
 assert.equal(c.audit(s).ok,false,'unreceipted transfer is correctly rejected');
 assert.throws(()=>c.load(JSON.stringify(s)),/Audit/);
 const work=clone(s.c1b.mining),paid=s.w5n.mineLohn;
 s.tick=2;
 const money=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
 assert.equal(c.diagnostics.mine(s,c.rules,s.ships.sh001),0);
 assert.deepEqual(s.c1b.mining,work);assert.equal(s.w5n.eisAbgebaut,0);
 assert.equal(s.w5n.mineLohn,paid);
 assert.deepEqual(Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),money);
 assert.equal(s.c1b.mining.sh001.rest,1);assert.equal(s.minted,0);
});
test('C1b-1: double mining and demand calls rejected before mutation; income is idempotent',()=>{
 const s=advance(c.create(),1),h=c.hash(s);
 assert.throws(()=>c.diagnostics.mine(s,c.rules,s.ships.sh001),/Doppel/);assert.equal(c.hash(s),h);
 advance(s,143);const demandHash=c.hash(s);
 assert.throws(()=>c.diagnostics.demand(s,c.rules),/Doppel/);assert.equal(c.hash(s),demandHash);
 c.diagnostics.income(s,c.rules);const paid=c.hash(s);
 c.diagnostics.income(s,c.rules);assert.equal(c.hash(s),paid);good(s);
});
test('C1b-1: real lack of goods at a planned event causes no sale or replenishment',()=>{
 const s=advance(c.create(),144),first=s.c1b.demand[0];
 assert.equal(first.bought,0);assert.equal(first.missingGoods,true);assert.equal(first.missingCash,false);
 assert.equal(first.stock,0);assert.equal(s.w5n.wasserProduziert,0);
 assert.equal(s.w5n.wasserVerbraucht,0);assert.equal(s.ledger.wasser.consumed,0);
 assert.equal(s.owners.w5n_kunden.cash,1400+s.w5o.ausgezahlt);good(s);independent(s,true);
 advance(s,1296);assert.equal(s.c1b.demand.length,10);
 assert.equal(s.w5n.wasserVerbraucht,9,'missed event is not caught up');good(s);
});
test('C1b-1: forged partial progress, money, work, receipts, rules, owners and mint saves fail closed',()=>{
 const s=advance(c.create(),289),original=c.hash(s);
 for(const mutate of [
  x=>x.c1b.profile='R32',x=>x.rulesVersion=32,x=>x.c1b.rules='wrong',
  x=>x.c1b.mining.sh001.rest=0,x=>x.c1b.mining.sh001.minutes++,
  x=>x.c1b.mining.sh001.lastTick=x.tick+1,x=>x.w5n.mineLohn++,
  x=>x.owners.house.cash++,x=>x.w5o.lohnEis++,
  x=>x.c1b.demand.push(clone(x.c1b.demand[0])),x=>x.c1b.demand[0].bought=1,
  x=>x.c1b.demand[0].missingGoods=false,x=>x.ships.sh001.owner='house',
  x=>{x.minted++;x.owners.house.cash++;},x=>x.w5q.mode='household',
  x=>x.w5o.mode='full',x=>x.owners.w5n_fracht_arbeit.cash++,
  x=>x.stations.st_nadir.lager.wasser++,x=>x.w5n.frachtAbgeschlossen++
 ]){const forged=clone(s);mutate(forged);assert.throws(()=>c.load(JSON.stringify(forged)));}
 assert.equal(c.hash(s),original);
 assert.throws(()=>c.execute(s,{type:'export',owner:'house'}),/ausserhalb/);
 assert.throws(()=>c.load('{'));assert.throws(()=>c.load('null'));
});

const rows=[],prefix=new Map();
function snapshot(s){return {tick:s.tick,hash:stock.api.hash(s),ice:s.w5n.eisAbgebaut,paidMiningMinutes:s.w5n.mineMinuten,
 iceSold:s.w5n.mineVerkauft,iceDelivered:s.w5n.eisGeliefert,freight:s.w5n.frachtAbgeschlossen,
 freightRevenue:s.w5n.frachtUmsatz,water:s.w5n.wasserProduziert,sold:s.w5n.wasserVerbraucht,
 householdIncome:s.w5o.ausgezahlt,householdCash:s.owners.w5n_kunden.cash,
 wages:{mine:s.w5n.mineLohn,freight:s.w5n.frachtLohn,factory:s.w5n.fabrikBezahlt},
 maintenance:s.w5r.servicePaid,purchases:s.w5r.purchases,losses:s.w5r.losses,
 cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),minted:s.minted};}
function run(exact,days){
 const label=exact?'C1b-1':'R32-C1a',r=exact?c.rules:oldRules;
 let s=exact?c.create():stock.api.createW5RState(42,'wages');
 let replay=exact?c.load(c.save(s)):clone(s),lastSale=0,lastWork=0,firstCashBlock=null,checks=0,idle=null;
 const maxPerDay=new Map();
 for(let i=1;i<=days*1440;i++){
  const prev=s.w5n.wasserVerbraucht,work=s.w5n.mineLohn+s.w5n.frachtLohn+s.w5n.fabrikBezahlt;
  if(exact){c.step(s);c.step(replay);}else{stock.api.step(s,r);stock.api.step(replay,r);}
  independent(s,exact);checks++;
  if(s.w5n.mineLohn+s.w5n.frachtLohn+s.w5n.fabrikBezahlt>work)lastWork=i;
  const bought=s.w5n.wasserVerbraucht-prev;
  const day=Math.floor((i-1)/1440);maxPerDay.set(day,(maxPerDay.get(day)||0)+bought);
  if(bought)lastSale=i;
  if(exact&&i%144===0){const row=s.c1b.demand.at(-1);if(!firstCashBlock&&row.missingCash)firstCashBlock=row;}
  if(i===1||i===61||i===101||i%1440===0){
   assert.equal(stock.api.hash(s),stock.api.hash(replay),'deterministic replay '+label+' tick '+i);
   const before=stock.api.hash(s);
   if(exact){good(s);s=c.load(c.save(s));}
   else{for(const m of stock.modules)assert.equal(m.audit(s,r).ok,true);s=stock.serialize.load(stock.api.save(s),stock.serialize.MIGRATIONS,8,32);}
   assert.equal(stock.api.hash(s),before,'roundtrip '+label);
  }
  if(exact&&i===60*1440)idle={income:s.w5o.ausgezahlt,production:s.w5n.wasserProduziert,sales:s.w5n.wasserVerbraucht};
  if(i===30*1440){if(days===30)prefix.set(label,stock.api.hash(s));else assert.equal(stock.api.hash(s),prefix.get(label));}
 }
 if(exact){
  if(days===90)assert.deepEqual({income:s.w5o.ausgezahlt,production:s.w5n.wasserProduziert,sales:s.w5n.wasserVerbraucht},idle,'no work income, production or sales during audited days 60–90');
  assert.equal(s.c1b.demand.length,days*10);
  assert.ok(Math.max(...maxPerDay.values())<=10);
  for(let day=0;day<days;day++)assert.equal(s.c1b.demand.filter(x=>Math.floor((x.tick-1)/1440)===day).length,10);
  assert.ok(s.c1b.demand.some(x=>x.missingCash&&!x.missingGoods),'purchasing power fails with stock available');
  assert.ok(s.c1b.demand.some(x=>x.missingGoods&&!x.missingCash),'stock fails with cash available');
  good(s);
 }
 const row={profile:label,days,seed:42,checks,maxDailyPurchases:Math.max(...maxPerDay.values()),
  planned:exact?s.c1b.demand.length:days*48,
  missingCash:exact?s.c1b.demand.filter(x=>x.missingCash).length:null,
  missingGoods:exact?s.c1b.demand.filter(x=>x.missingGoods).length:null,
  firstCashBlock,lastSaleTick:lastSale,lastWorkTick:lastWork,...snapshot(s)};
 rows.push(row);console.log('C1B1_RESULT '+JSON.stringify(row));return row;
}
test('C1b-1 vs R32-C1a: 30 days first, identical seed/capital/prices/freight/wear/income',()=>{
 for(const exact of [false,true])run(exact,30);
});
test('C1b-1 vs R32-C1a: 90 days with exact 30-day prefixes, audited even in economic standstill',()=>{
 for(const exact of [false,true])run(exact,90);
 const base=rows.find(x=>x.profile==='R32-C1a'&&x.days===90);
 assert.equal(base.water,200);assert.equal(base.sold,172);assert.equal(base.householdCash,4,'independently re-run #246 measurements');
 const exact=rows.find(x=>x.profile==='C1b-1'&&x.days===90);
 assert.ok(exact.lastWorkTick<90*1440);assert.ok(exact.lastSaleTick<90*1440);
 assert.notEqual(exact.hash,base.hash);
 if(process.env.C1B1_REPORT)writeFileSync(process.env.C1B1_REPORT,JSON.stringify(rows,null,2)+'\n');
});
