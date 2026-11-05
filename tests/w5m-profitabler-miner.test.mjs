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
  const fresh=api.createW5MState(42),first=miner(fresh,'npc3');
  rejectWithoutMutation(fresh,{type:'shipUpgradeMiner',owner:'npc3',schiff:first.id});
  rejectWithoutMutation(fresh,{type:'shipUpgradeMiner',owner:'house',schiff:first.id});
  rejectWithoutMutation(fresh,{type:'shipUpgradeMiner',owner:'npc3',schiff:first.id,rate:99});
  // Ohne Absatz bleibt die vom Miner selbst finanzierte Rohware Eigentum.
  const s=start(42),npc=miner(s,'npc3');
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
test('W5m: MK1 extracts twice as much per paid labor minute, but creates no buyer',()=>{
  const base=start(42),up=start(42);
  fit(up,'house');
  const b=api.pilotW5MStand(base),u=api.pilotW5MStand(up);
  assert.equal(b.unternehmen.house.schiffe[0].rate,1);
  assert.equal(u.unternehmen.house.schiffe[0].rate,2);
  assert.equal(up.owners.st_aldera.cash,0,'no unconditional buyer refill');
  const beforeB=base.ledger.erz.mined,beforeU=up.ledger.erz.mined;
  const baseLohn=api.pilotW5MStand(base).unternehmen.house.foerderlohn;
  const upgradeLohn=api.pilotW5MStand(up).unternehmen.house.foerderlohn;
  const bIncome=base.stats.konto.house.erloes,uIncome=up.stats.konto.house.erloes;
  api.advance(base,10,rules);api.advance(up,10,rules);
  audit(base,'base 10m');audit(up,'mk1 10m');
  assert.equal(base.ledger.erz.mined-beforeB,10,'baseline 1 ore per minute');
  assert.equal(up.ledger.erz.mined-beforeU,20,'MK1 2 ore per minute');
  assert.equal(api.pilotW5MStand(base).unternehmen.house.foerderlohn-baseLohn,20,
    'basic miner pays all 10 real working minutes');
  assert.equal(api.pilotW5MStand(up).unternehmen.house.foerderlohn-upgradeLohn,20,
    'MK1 does not pay fictitious double work time for twice the output');
  assert.equal(base.stats.konto.house.erloes,bIncome,'buyer broke');
  assert.equal(up.stats.konto.house.erloes,uIncome,'speed cannot generate revenue');
  assert.equal(api.pilotW5MStand(up).unternehmen.house.schiffe[0].rate,2);
});
test('W5m: after three genuine paid W3 deliveries MK1 yields more net profit than basic miner',()=>{
  const base=start(42,true),up=start(42,true);
  assert.equal(base.owners.st_aldera.cash,500,'only funded external sale refills the original buyer');
  assert.equal(up.owners.st_aldera.cash,500);
  fit(up,'npc3');
  assert.equal(api.pilotW5MStand(base).unternehmen.npc3.umsatz,500);
  assert.equal(api.pilotW5MStand(up).unternehmen.npc3.umsatz,500);
  // Strict comparison under identical, finite real customers; no free subsidy
  // and no forced House pause. Three full W3 round-trips each cost real money.
  for(let round=1;round<=3;round++){
    for(const [label,world] of [['basis',base],['mk1',up]]){
      const transport=Object.values(world.ships).find(sh=>
        sh.owner==='transport'&&sh.klasse==='frachter');
      const f=api.execute(world,{type:'shipFreight',owner:'transport',
        schiff:transport.id},rules);
      assert.equal(f.ok,true,label+' funded round '+round+': '+f.reason);
      api.advance(world,120,rules);
      audit(world,label+' delivered round '+round);
      assert.equal(world.w3.geliefert,round*50,'exact paid physical delivery');
    }
  }
  const b=api.pilotW5MStand(base).unternehmen.npc3;
  const u=api.pilotW5MStand(up).unternehmen.npc3;
  assert.equal(b.verkauft,225);
  assert.equal(u.verkauft,225,'limited demand means NO fictitious extra sale');
  assert.equal(b.amortisierterSaldo,1054,'full-cost baseline with actual sales');
  assert.equal(u.amortisierterSaldo,1094,'full-cost MK1 including ore opportunity');
  assert.equal(b.foerderlohn,596);
  assert.equal(u.foerderlohn,396,'faster extraction means less REAL paid work');
  assert.ok(u.gefoerdert>b.gefoerdert);
  assert.ok(u.amortisierterSaldo>b.amortisierterSaldo,'MK1 earns 40 ISK more after all costs');
  assert.equal(base.minted,0);assert.equal(up.minted,0);
  assert.equal(base.owners.st_nadir.cash,up.owners.st_nadir.cash);
  assert.equal(api.hash(api.loadW5M(api.save(up))),api.hash(up));
  console.log('W5M_RENTABILITAET '+JSON.stringify({seed:42,minute:up.tick,
    baseline:{sold:b.verkauft,mined:b.gefoerdert,wages:b.foerderlohn,
      profit:b.amortisierterSaldo},
    mk1:{sold:u.verkauft,mined:u.gefoerdert,wages:u.foerderlohn,
      profit:u.amortisierterSaldo},surplus:u.amortisierterSaldo-b.amortisierterSaldo,
    cashNadir:up.owners.st_nadir.cash,hash:api.hash(up),minted:up.minted}));
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
