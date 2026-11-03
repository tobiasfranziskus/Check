// [ANALYSE/DRAFT] No product runtime, prices, wages or emission changes.
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {model,fixture,withoutGrants,simulate,audit,capital,summary,strictRules,sum} from './lib/bk12-analyse.mjs';

const variants=['reference','public','roundtrip','combined'];
const expected={
  passive:{42:['6a18f8b6500db63a','89be7c614bc20c4e','f270c43dd4204bba','52c728a836572ee8'],
    7:['63a3378e5a004c27','4cbc78ba8aaf5677','4d934c6619a0ac15','5bda139cb777a0a3']},
  crisis:{42:['0eae03d3ca39624e','9add54820d8c54d4','8c46f4dba0661242','5f3bbed3c939c239'],
    7:['ea766c1569998aec','381d0d96bb03bf6b','4e44b39aa29d0446','c4824fedd9d32b64']}
};
function artifact(name,obj) {
  if(!process.env.BK12_OUTPUT_DIRECTORY)return;
  fs.mkdirSync(process.env.BK12_OUTPUT_DIRECTORY,{recursive:true});
  fs.writeFileSync(path.join(process.env.BK12_OUTPUT_DIRECTORY,name+'.json'),JSON.stringify(obj,null,2)+'\n');
}

test('B-K12 [MAIN]: unveraenderter main und historischer Kern im Default R14 ergeben gleiche Siebentage-Welten',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_ui_main ='));
  const records=[];
  for(const seed of [42,7]) {
    const runs=[];
    for(const js of [source,fixture]) {
      const {core,rules}=new Function(js+';return {core:m_core_index,rules:m_data_rules.RULES}')();
      assert.equal(rules.schema,8);assert.equal(rules.rulesVersion,14);
      const s=core.createState(seed,rules);
      for(let t=0;t<10080;t++) {core.step(s,rules);if(s.tick%60===0)audit(s,core);}
      const hash=core.hash(s);assert.equal(core.hash(core.load(core.save(s),undefined,rules)),hash);
      runs.push({seed,hash,foodMissing:sum(Object.values(s.stats.mangel).map(x=>x.nahrung||0)),
        medMissing:sum(Object.values(s.stats.mangel).map(x=>x.medikamente||0)),
        minted:s.minted,burned:s.burned,capital:capital(s),subsidy:s.stats.zuschuss});
    }
    assert.deepEqual(runs[0],runs[1]);
    assert.equal(runs[0].hash,seed===42?'c58bbe3979b7dc8b':'0e4952a9cafd2019');
    records.push(runs[0]);
  }
  artifact('main-r14',records);
});

test('B-K12: Kontenbeobachter sind fuer alle Arme und Seeds zustandsneutral',()=>{
  for(const seed of [42,7])for(const variant of [...variants,'household','household-roundtrip']) {
    const a=simulate({seed,variant,minutes:120}),b=simulate({seed,variant,minutes:120,observe:false});
    assert.equal(a.result.hash,b.result.hash,seed+'/'+variant);
    assert.equal(a.save,b.save,'byte-identischer Save mit und ohne Beobachtung');
  }
});

test('B-K12 [DRAFT]: unveraendertes R15-Modell MIT seinen historischen Fondsregeln bleibt als eigene Kontrolle sichtbar',()=>{
  const rows=[];
  for(const seed of [42,7]) {
    const a=simulate({seed,strict:false,minutes:10080});
    const b=simulate({seed,strict:false,minutes:10080,observe:false});
    assert.equal(a.save,b.save);
    assert.equal(a.result.hash,seed===42?'b3803735380b3bd1':'dc6076bb08960a69');
    assert.equal(a.result.foodMissing,seed===42?374:468);
    assert.equal(a.result.medMissing,seed===42?564:664);
    assert.equal(a.result.subsidy,0);
    rows.push({seed,...a.result,daily:a.daily});
  }
  artifact('unmodified-r15',rows);
});

test('B-K12 A: gesperrte Fondsmittel bezahlen keine Ware; nur echter Konsum erhaelt eine Zahlung',()=>{
  const m=model({variant:'public'}),s=m.core.createState(7,m.rules);
  const stocks=JSON.stringify(Object.fromEntries(Object.entries(s.stations).map(([id,st])=>[id,st.lager])));
  const reserves=[];
  for(const [id,o] of Object.entries(s.owners).filter(([,o])=>o.kind==='fund')) {
    reserves.push(m.core.vertrag.reservieren(s,id,'house',o.cash));
  }
  assert(reserves.every(Boolean));const before=capital(s);
  m.core.verbrauch(s,m.rules);audit(s,m.core,m.provenance);
  assert.deepEqual(capital(s),before);assert.equal(m.log.payments.length,0);
  assert.equal(JSON.stringify(Object.fromEntries(Object.entries(s.stations).map(([id,st])=>[id,st.lager]))),stocks);
  for(const id of reserves)assert(m.core.vertrag.abschliessen(s,id));
  const consumptionBefore={...Object.fromEntries(Object.entries(s.ledger).map(([w,l])=>[w,l.consumed]))};
  m.core.verbrauch(s,m.rules);audit(s,m.core,m.provenance);
  const posts=m.log.payments.filter(x=>x.kind==='public-consumption');assert(posts.length>0);
  for(const p of posts) {
    const original=m.core.createState(7,m.rules);
    assert.equal(p.isk,p.qty*m.core.preis(original,p.to,p.ware,m.rules));
    assert(p.qty<=m.rules.world.stations[p.to].verbrauch[p.ware]);
  }
  for(const ware of ['nahrung','medikamente','bauteil'])
    assert.equal(s.ledger[ware].consumed-consumptionBefore[ware],sum(posts.filter(x=>x.ware===ware).map(x=>x.qty)));
  assert.equal(s.minted,0);assert.equal(s.burned,0);
});

test('B-K12: bezahltes Miner-Eis, echter Fabriklohn, FIFO-Endverkauf und Lagervermoegen getrennt',()=>{
  const records=[];
  for(const seed of [42,7]) {
    const m=model({source:withoutGrants,traceSource:true});strictRules(m);
    const s=m.core.createState(seed,m.rules);
    // Same declared isolation as B-K11h: remove, never add, initial Nadir stock.
    for(const w of ['eis','nahrung']) {
      s.ledger[w].initial-=s.stations.st_nadir.lager[w];s.stations.st_nadir.lager[w]=0;
    }
    for(const sh of Object.values(s.ships))if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
    const initial=structuredClone(s),starting=capital(s),checkpoints=[];
    const raw=model({source:withoutGrants,observe:false});strictRules(raw);
    const replay=raw.core.load(m.core.save(s),undefined,raw.rules);
    for(let t=0;t<10080;t++) {
      m.core.step(s,m.rules);raw.core.step(replay,raw.rules);
      if(s.tick%60===0) {
        audit(s,m.core,m.provenance);
        const trace=m.api.sourceTrace();
        assert.equal(trace.ice.length,s.stations.st_nadir.lager.eis);
        assert.equal(trace.food.length,s.stations.st_nadir.lager.nahrung);
        assert.equal(m.core.hash(s),raw.core.hash(replay));
      }
      if([120,1440,10080].includes(s.tick)) {
        const trace=structuredClone(m.api.sourceTrace());
        assert.equal(m.core.hash(m.core.load(m.core.save(s),undefined,m.rules)),m.core.hash(s));
        checkpoints.push({tick:s.tick,hash:m.core.hash(s),cash:s.owners.st_nadir.cash,
          hh:s.owners.hh_st_nadir.cash,reserve:capital(s).st_nadir-s.owners.st_nadir.cash,
          realizedQty:sum(trace.realized.map(x=>x.qty)),paid:sum(trace.realized.map(x=>x.paid)),
          realizedCost:sum(trace.realized.map(x=>x.cost)),
          iceQty:trace.ice.length,iceCost:sum(trace.ice.map(x=>x.cost)),
          foodQty:trace.food.length,foodCost:sum(trace.food.map(x=>x.cost)),pending:trace.pending});
      }
    }
    const trace=m.api.sourceTrace(),first=trace.realized[0];
    assert.deepEqual({tick:first.tick,qty:first.qty,paid:first.paid,cost:first.cost},{tick:120,qty:1,paid:53,cost:68});
    assert.equal(first.lots[0].wage,24);assert.equal(first.lots[0].finished,106);
    assert(first.lots[0].inputs.every(x=>x.tick===100&&x.ship==='sh009'&&x.cost===22));
    assert.equal(checkpoints[1].realizedQty,23);assert.equal(checkpoints[1].paid,1031);
    assert.equal(checkpoints[1].realizedCost,1564);
    assert.equal(checkpoints[1].iceCost,1721);assert.equal(checkpoints[1].foodCost,1428);
    const sourceTrades=m.log.trades.filter(x=>x.station==='st_nadir');
    const wages=-(m.log.net.produktion.st_nadir||0);
    const purchases=sum(sourceTrades.filter(x=>!x.buy).map(x=>x.value));
    assert.equal(capital(s).st_nadir,starting.st_nadir-purchases-wages+sum(trace.realized.map(x=>x.paid)));
    records.push({seed,checkpoints,first,sourceTrades,summary:summary(s,m,initial,starting)});
  }
  artifact('micro-source',records);
});

for(const crisis of [false,true])test('B-K12: gepaarte 7 Tage '+(crisis?'Spielerkrise':'passiver Spieler')+', alle sechs Stationen und volle Konten',()=>{
  const records=[];
  for(const seed of [42,7])for(const [i,variant] of variants.entries()) {
    const a=simulate({seed,variant,minutes:10080,crisis});
    // Independent replay crosses an actual save/load boundary on day 1.
    const day1=simulate({seed,variant,minutes:1440,crisis,observe:false});
    const replay=simulate({seed,variant,minutes:8640,saved:day1.save,observe:false});
    assert.equal(a.result.hash,replay.result.hash,'deterministic split continuation');
    assert.equal(a.save,replay.save);assert.equal(a.daily.length,7);
    assert.equal(a.result.hash,expected[crisis?'crisis':'passive'][seed][i]);
    assert.equal(a.result.subsidy,0,'kein individueller Huellezuschuss');
    assert.equal(Object.keys(a.result.stations).length,6);
    for(const id of ['npc1','npc2']) {
      const k=a.result.traderCashflow[id];
      assert.equal(k.delta,k.sales-k.purchases-k.fees-k.paidWork-k.hulls-k.levy,
        'vollstaendige reale Haendler-Kassenidentitaet '+id);
    }
    // Negative gate is deliberate: no improved cash account counts as success
    // while essential supply breaks. No 13x90d stability claim follows.
    assert(a.result.foodMissing>500);assert(a.result.medMissing>700);
    const r={seed,crisis,...a.result,daily:a.daily};records.push(r);
    console.log('BK12_RESULT '+JSON.stringify({seed,crisis,variant,hash:r.hash,
      food:r.foodMissing,med:r.medMissing,sales:r.sales,foodUnits:r.deliveredFood,
      medUnits:r.deliveredMed,npc1:r.cash.npc1,npc2:r.cash.npc2}));
    artifact((crisis?'crisis':'passive')+'-'+seed+'-'+variant+'-journal',a.m.log);
  }
  artifact(crisis?'crisis':'passive',records);
});

test('B-K12 A: vollstaendig zahlender Haushalt allein und mit B, gegen jeweilige unveraenderte Fonds-Kontrolle',()=>{
  const hashes={
    strict:{42:['7cb9074b49f14797','abc7a31b317339d3'],7:['ab62b6bdb1293483','d0ab356f38af5f6a']},
    original:{42:['295e281aec272830','d1ada082978501bd'],7:['2af8647c2f97dc85','6610fc8db20f8039']}
  };
  const rows=[];
  for(const strict of [true,false])for(const seed of [42,7])for(const [i,variant] of ['household','household-roundtrip'].entries()) {
    const a=simulate({seed,strict,variant,minutes:10080});
    const day1=simulate({seed,strict,variant,minutes:1440,observe:false});
    const b=simulate({seed,strict,variant,minutes:8640,saved:day1.save,observe:false});
    assert.equal(a.save,b.save,'Save/Load-Fortsetzung ohne verlorenes Ausgabenbudget');
    assert.equal(a.result.hash,hashes[strict?'strict':'original'][seed][i]);
    assert.equal(a.result.subsidy,0);
    assert(a.result.foodMissing>500&&a.result.medMissing>650,'keine Nachhaltigkeitsfreigabe');
    rows.push({seed,strict,...a.result,daily:a.daily});
    artifact('household-'+strict+'-'+seed+'-'+variant+'-journal',a.m.log);
  }
  artifact('household',rows);
});
