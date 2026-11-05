import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5M_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const miner=(s,owner)=>Object.values(s.ships).find(sh=>
  sh.klasse==='miner'&&sh.owner===owner&&sh.system==='aldera');
function audit(s,label=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+': '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,v])=>v?.ok===false))));
  assert.equal(s.rulesVersion,28);assert.equal(s.schema,8);
  assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000,label+' money');
  for(const x of Object.values(s.owners))
    assert.ok(Number.isSafeInteger(x.cash)&&x.cash>=0,x.id);
  for(const [ware,b]of Object.entries(s.ledger)){
    const actual=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
    assert.equal(actual,b.initial+b.mined+b.produced+b.imported-b.consumed-b.exported,
      label+' '+ware);
  }
  assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
  assert.equal(s.owners.export.cash,20000-10*(s.w5h.bestand+s.w5h.unterwegs));
  assert.equal(a.w5m.ok,true);
}
function start(seed,carrier=false){
  const s=api.createW5MState(seed);audit(s,'initial');
  const buy=api.execute(s,{type:'shipBuy',owner:'house',
    station:'st_aldera',klasse:'miner'},rules);
  assert.equal(buy.ok,true,buy.reason);
  const start=api.execute(s,{type:'shipMine',owner:'house',
    schiff:miner(s,'house').id,ware:'erz'},rules);
  assert.equal(start.ok,true,start.reason);
  if(carrier){
    const cb=api.execute(s,{type:'shipBuy',owner:'transport',
      station:'st_aldera',klasse:'frachter'},rules);
    assert.equal(cb.ok,true,cb.reason);
  }
  api.advance(s,60,rules);
  audit(s,'two miners / 60m');
  return s;
}
function fit(s,owner){
  const sh=miner(s,owner);
  const r=api.execute(s,{type:'shipUpgradeMiner',owner,schiff:sh.id},rules);
  assert.equal(r.ok,true,r.reason);
  audit(s,'fitted '+owner);
  return sh;
}
function rejectWithoutMutation(s,command){
  const h=api.hash(s),result=api.execute(s,command,rules);
  assert.equal(result.ok,false,'invalid command unexpectedly accepted');
  assert.equal(api.hash(s),h,'refusal must not change state');
  return result.reason;
}
test('W5m: R28 is isolated; old R26/R27 states and hashes remain unchanged',()=>{
  assert.equal(rules.rulesVersion,28);assert.equal(rules.schema,8);
  assert.equal(rules.erzpilot.preis,10);assert.equal(rules.erzpilot.minerJeMinute,2);
  assert.equal(rules.economy.miningRate,1);assert.equal(rules.w5m.rate,2);
  assert.equal(rules.w5m.material,10);assert.equal(rules.w5m.arbeit,60);
  const r26=api.createW5IState(42);
  assert.equal(api.hash(r26),'343559f8c88543e4');
  assert.equal(api.audit(r26).ok,true);
  const r27=api.createW5LState(42);
  assert.equal(api.hash(api.loadW5L(api.save(r27))),api.hash(r27));
  assert.equal(api.audit(r27).ok,true);
  const r28=api.createW5MState(42);audit(r28,'R28');
  assert.equal(api.hash(api.loadW5M(api.save(r28))),api.hash(r28));
  assert.throws(()=>api.loadW5M(api.save(r27)),/inkompatibel/);
  assert.throws(()=>api.loadW5L(api.save(r28)),/inkompatibel/);
  rejectWithoutMutation(r27,{type:'shipUpgradeMiner',owner:'npc3',schiff:miner(r27,'npc3').id});
});
test('W5m: raw ore and paid labor are essential; module neither free nor duplicable',()=>{
  const s=api.createW5MState(42),npc=miner(s,'npc3');
  rejectWithoutMutation(s,{type:'shipUpgradeMiner',owner:'npc3',schiff:npc.id});
  rejectWithoutMutation(s,{type:'shipUpgradeMiner',owner:'house',schiff:npc.id});
  rejectWithoutMutation(s,{type:'shipUpgradeMiner',owner:'npc3',schiff:npc.id,rate:99});
  api.advance(s,60,rules);audit(s,'60m no House');
  assert.ok((npc.ladung.erz||0)>=10,'unpaid customer cannot gift ore');
  const before={cash:s.owners.npc3.cash,fund:s.owners.fonds_aldera.cash,
    ore:npc.ladung.erz,consumed:s.ledger.erz.consumed,minted:s.minted};
  fit(s,'npc3');
  assert.equal(npc.bohrerMk1,true);
  assert.equal(npc.ladung.erz,before.ore-10);
  assert.equal(s.ledger.erz.consumed,before.consumed+10);
  assert.equal(s.owners.npc3.cash,before.cash-60);
  assert.equal(s.owners.fonds_aldera.cash,before.fund+60);
  assert.equal(s.minted,before.minted);
  rejectWithoutMutation(s,{type:'shipUpgradeMiner',owner:'npc3',schiff:npc.id});
  assert.equal(api.hash(api.loadW5M(api.save(s))),api.hash(s));
});
test('W5m: faster mining pays proportionally more labor, never creates demand',()=>{
  const base=start(42),up=start(42);
  fit(up,'house');
  const b=api.pilotW5MStand(base),u=api.pilotW5MStand(up);
  assert.equal(b.unternehmen.house.schiffe[0].rate,1);
  assert.equal(u.unternehmen.house.schiffe[0].rate,2);
  assert.equal(up.owners.st_aldera.cash,0,'no unconditional buyer refill');
  const beforeB=base.ledger.erz.mined,beforeU=up.ledger.erz.mined;
  const bIncome=base.stats.konto.house.erloes,uIncome=up.stats.konto.house.erloes;
  api.advance(base,10,rules);api.advance(up,10,rules);
  audit(base,'base 10m');audit(up,'mk1 10m');
  assert.equal(base.ledger.erz.mined-beforeB,10,'baseline 1 ore per minute');
  assert.equal(up.ledger.erz.mined-beforeU,20,'MK1 2 ore per minute');
  assert.equal(base.stats.konto.house.erloes,bIncome,'buyer broke');
  assert.equal(up.stats.konto.house.erloes,uIncome,'speed cannot generate revenue');
  assert.equal(api.pilotW5MStand(up).unternehmen.house.schiffe[0].rate,2);
});
test('W5m: funded buyer repays faster Miner MK1; competition stays genuine',()=>{
  const base=start(42,true),up=start(42,true);
  assert.equal(base.owners.st_aldera.cash,500,'only existing export money refills buyer');
  assert.equal(up.owners.st_aldera.cash,500);
  fit(up,'npc3');
  const beforeBase=api.pilotW5MStand(base).unternehmen.npc3;
  const beforeUp=api.pilotW5MStand(up).unternehmen.npc3;
  assert.equal(beforeBase.umsatz,500);
  assert.equal(beforeUp.umsatz,500);
  api.advance(base,25,rules);api.advance(up,25,rules);
  audit(base,'baseline after 25m');audit(up,'mk1 after 25m');
  const b=api.pilotW5MStand(base).unternehmen.npc3;
  const u=api.pilotW5MStand(up).unternehmen.npc3;
  assert.ok(u.gefoerdert>b.gefoerdert,'higher real production under same clock');
  assert.ok(u.verkauft>b.verkauft,'faster paid sale, not virtual ISK');
  assert.ok(u.umsatz>b.umsatz,'actual station payment');
  assert.ok(u.amortisierterSaldo>b.amortisierterSaldo,
    'full cost including physical ore opportunity');
  assert.equal(up.minted,0);assert.equal(base.minted,0);
  console.log('W5M_RENTABILITAET '+JSON.stringify({baseline:b,upgrade:u,
    stationISK:up.owners.st_aldera.cash,hash:api.hash(up)}));
});
test('W5m: module and money tampering, invalid saves rejected',()=>{
  const s=start(42);fit(s,'house');
  const legal=api.hash(s);
  const altered=api.loadW5M(api.save(s));
  altered.w5m.moduleIds=[];
  assert.equal(api.audit(altered).ok,false);
  assert.throws(()=>api.loadW5M(api.save(altered)),/fehlerhaft/);
  const forged=api.loadW5M(api.save(s));
  forged.ships[miner(forged,'npc3').id].bohrerMk1=true;
  assert.equal(api.audit(forged).ok,false);
  assert.throws(()=>api.loadW5M(api.save(forged)),/fehlerhaft/);
  const cash=api.loadW5M(api.save(s));
  cash.owners.house.cash+=1;
  assert.equal(api.audit(cash).ok,false);
  assert.equal(api.hash(s),legal);
});
test('W5m: 13 seeds x 90d with owned module, independent money/goods audit, save/load',()=>{
 for(const seed of seeds){
   const s=start(seed);
   fit(s,'house');
   const after=api.hash(s);
   assert.equal(api.hash(api.loadW5M(api.save(s))),after);
   for(let day=1;day<=90;day++){
     api.advance(s,1440,rules);
     audit(s,'seed '+seed+' day '+day);
     if(day===30||day===60||day===90){
       const loaded=api.loadW5M(api.save(s));
       assert.equal(api.hash(loaded),api.hash(s));
       const oldHash=api.hash(s);
       const a=api.pilotW5MStand(s);
       assert.equal(a.audit.ok,true);
       assert.equal(api.hash(s),oldHash,'projection read only');
     }
   }
   console.log('W5M_90T '+JSON.stringify({seed,hash:api.hash(s),
     ore:s.ledger.erz.mined,sold:api.pilotW5MStand(s).unternehmen.house.verkauft,
     cash:s.owners.house.cash,minted:s.minted}));
 }
});
