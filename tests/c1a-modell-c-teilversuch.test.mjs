import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Test adapter only: original minute core, no patched source, no cash/goods engine.
// This is a C-parameterized WATER SUBSET, explicitly not the full C economy.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api,serialize,modules}=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+`\nreturn {api:m_core_index,
 serialize:m_core_serialize,modules:[m_core_w5n,m_core_w5o,m_core_w5q,m_core_w5r]};`)();
const scenarios=['reference','playerMinerSaves','npcRetains','exportOff','carrierFailsDay5'];
function rules(name){
 const r=structuredClone(api.W5R_RULES);
 Object.assign(r.w5n,{mineLohn:1,rezeptEis:50,rezeptWasser:50,
  fabrikMinuten:100,fabrikLohn:1,wasserPreis:18,frachtJeMinute:2.25});
 r.economy.waren.wasser.basis=18;
 // No fractional consumption event invented: 2/hour remains an explicit R32 gap.
 if(name==='carrierFailsDay5')r.w5r.freighterLifeDays=5;
 return r;
}
const digest=r=>createHash('sha256').update(JSON.stringify(r)).digest('hex');
function verify(s,r){
 assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),s.initialSupply+s.minted-s.burned);
 for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,o.id);
 for(const [ware,l] of Object.entries(s.ledger)){
  const stock=Object.values(s.stations).reduce((a,x)=>a+(x.lager[ware]||0),0)
   +Object.values(s.ships).reduce((a,x)=>a+(x.ladung[ware]||0),0);
  assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 for(const m of modules)assert.equal(m.audit(s,r).ok,true,JSON.stringify(m.audit(s,r)));
 // Escrows are owner accounts, counted ONCE; exact unused balances independent of audit.
 const a=s.w5n.frachtauftrag,f=s.w5n.fabrikauftrag;
 assert.equal(s.owners.w5n_fracht_arbeit?.cash||0,a?(120-a.gearbeitet):0);
 assert.equal(s.owners.w5n_fracht_kauf?.cash||0,a?(a.phase==='hin'?520:270):0);
 assert.equal(s.owners.w5n_fabrik_arbeit?.cash||0,f?100-f.gearbeitet:0);
 assert.equal(s.w5n.mineLohn,s.w5n.mineMinuten);
 assert.equal(s.w5n.frachtLohn,120*s.w5n.frachtAbgeschlossen+(a?.gearbeitet||0));
 assert.equal(s.w5n.fabrikBezahlt,100*s.w5n.fabrikFertig+(f?.gearbeitet||0));
 assert.equal(s.w5n.wasserErlos,18*s.w5n.wasserVerbraucht);
 assert.equal(s.owners.w5n_kunden.cash,1400+s.w5o.ausgezahlt-s.w5n.wasserErlos);
 assert.equal(s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation,0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.exported,0);
 const lost=new Set(s.w5r.losses.map(x=>x.id));
 assert.equal(lost.size,s.w5r.losses.length);
 for(const p of s.w5r.purchases){
  assert.equal(p.cost,r.economy.waren[p.type].basis);
  assert.ok(s.ships[p.id]||lost.has(p.id));
 }
}
// Core serializer plus strict TEST envelope. This is not the stock loadW5R;
// that loader selects fixed R32 constants and is a documented integration gap.
function save(s,r){return JSON.stringify({profile:'C1a-water-subset-v1',rules:digest(r),state:api.save(s)});}
function load(json,r){
 const e=JSON.parse(json);assert.equal(e.profile,'C1a-water-subset-v1');assert.equal(e.rules,digest(r));
 const s=serialize.load(e.state,serialize.MIGRATIONS,8,32);verify(s,r);return s;
}
function start(name){
 const s=api.createW5RState(42,'wages',name==='playerMinerSaves'?'house':'npc3');
 // Only initial command setup is original R32. No money/ware changes in adapter.
 // All subsequent work uses the explicit changed C-subset rules.
 const r=rules(name);verify(s,r);return {s,r};
}
const prefix=new Map(),rows=[];
function snapshot(s){return {tick:s.tick,hash:api.hash(s),cash:Object.fromEntries(Object.entries(s.owners).map(([k,v])=>[k,v.cash])),
 ice:s.w5n.eisAbgebaut,iceSold:s.w5n.mineVerkauft,iceDelivered:s.w5n.eisGeliefert,
 freight:s.w5n.frachtAbgeschlossen,freightRevenue:s.w5n.frachtUmsatz,
 water:s.w5n.wasserProduziert,sold:s.w5n.wasserVerbraucht,revenue:s.w5n.wasserErlos,
 wages:{mine:s.w5n.mineLohn,freight:s.w5n.frachtLohn,factory:s.w5n.fabrikBezahlt,household:s.w5o.ausgezahlt},
 maintenance:s.w5r.servicePaid,purchases:s.w5r.purchases,losses:s.w5r.losses,
 stocks:{miner:s.stations.st_aldera.lager.miner,carrier:s.stations.st_aldera.lager.frachter},minted:s.minted};}
function run(name,days){
 let {s,r}=start(name);let replay=load(save(s,r),r),firstBlock=null,firstDemandBlock=null,lastSale=0,checks=0;
 const startCash=snapshot(s).cash;
 // Every simulated minute runs through the SAME api.step. Adapter never produces goods or ISK.
 for(let i=1;i<=days*1440;i++){
  const prev=s.w5n.wasserVerbraucht;
  api.step(s,r);api.step(replay,r);
  verify(s,r);checks++;
  if(s.w5n.wasserVerbraucht>prev)lastSale=i;
  if(!firstDemandBlock&&s.w5n.wasserVerbraucht>0&&s.stations.st_nadir.lager.wasser>0&&s.owners.w5n_kunden.cash<18)
   firstDemandBlock={tick:i,cash:s.owners.w5n_kunden.cash,water:s.stations.st_nadir.lager.wasser};
  if(!firstBlock&&(!s.w5r.frachter.id||!s.w5r.miner.id))firstBlock={tick:i,
    missing:!s.w5r.frachter.id?'carrier':'miner',cash:s.owners.transport.cash,
    carrierStock:s.stations.st_aldera.lager.frachter,minerStock:s.stations.st_aldera.lager.miner};
  if(i===61||i%1440===0){
   assert.equal(api.hash(s),api.hash(replay),'same commands + seed');
   const before=api.hash(s);s=load(save(s,r),r);assert.equal(api.hash(s),before);
  }
  if(i===30*1440){
   if(days===30)prefix.set(name,api.hash(s));else assert.equal(api.hash(s),prefix.get(name),'unchanged day30 prefix');
  }
 }
 const row={scenario:name,days,profile:digest(r),checks,firstBlock,firstDemandBlock,lastSaleTick:lastSale,startCash,...snapshot(s)};
 rows.push(row);console.log('C1A_RESULT '+JSON.stringify(row));return row;
}
test('C1a capability guard: no Meridian/industrial C export and no 22280 founder in R32',()=>{
 const {s,r}=start('reference');
 assert.equal(r.world.systems.meridian,undefined);
 assert.equal(s.owners.gruendungsanbieter,undefined);
 assert.equal(r.w5q.defaultMode,'off');
 assert.equal(r.w5.material,5); // R32, NOT C 8-component carrier recipe
 assert.equal(r.economy.waren.frachter.basis,750);
 assert.notEqual(r.w5n.wasserPreis,api.W5R_RULES.w5n.wasserPreis);
});
test('C1a: execute 30 days first, five explicit scenarios',()=>{
 for(const name of scenarios){const row=run(name,30);assert.ok(row.sold>0);}
});
test('C1a: then 90 days, same parameters, exact 30-day prefixes',()=>{
 for(const name of scenarios)run(name,90);
 for(const days of [30,90])for(const name of ['npcRetains','exportOff'])
  assert.equal(rows.find(x=>x.days===days&&x.scenario===name).hash,rows.find(x=>x.days===days&&x.scenario==='reference').hash,'negative controls are NOT distinct crises');
 if(process.env.C1A_REPORT)writeFileSync(process.env.C1A_REPORT,JSON.stringify(rows,null,2)+'\n');
});
test('C1a: missing hull, no duplicate purchase; forged wages/cash/profile rejected',()=>{
 const {s,r}=start('reference');const h=api.hash(s);
 const result=api.execute(s,{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'},r);
 assert.equal(result.ok,false);assert.equal(api.hash(s),h);
 for(const mutate of [x=>x.owners.house.cash++,x=>x.w5n.mineLohn++,x=>x.w5o.lohnEis++]){
  const x=load(save(s,r),r);mutate(x);assert.throws(()=>verify(x,r));
 }
 // Explicit counterfactual funding fixture, never fed into a running scenario.
 const poor=load(save(s,r),r);poor.owners.transport.cash+=poor.owners.house.cash;poor.owners.house.cash=0;verify(poor,r);
 const prior=api.hash(poor);const unfunded=api.execute(poor,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'},r);
 assert.equal(unfunded.ok,false);assert.match(unfunded.reason,/ISK|Geld|Kapital/i);assert.equal(api.hash(poor),prior);
 const wrong=structuredClone(r);wrong.w5n.wasserPreis++;assert.throws(()=>load(save(s,r),wrong));
});
