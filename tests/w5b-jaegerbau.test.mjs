import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert.ok(start>=0&&end>start);
const api=Function(html.slice(start,end)+'\nreturn m_core_index;')();
const rules=api.W5B_RULES;
const cmd=(type,owner,station='st_nadir')=>({type,owner,station});
const mine={type:'shipMine',owner:'house',ware:'silizium'};
const seedListe=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
function check(s,where=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,where+' '+JSON.stringify({isk:a.isk,goods:a.goods,w3:a.w3,w4:a.w4,w5:a.w5,w5b:a.w5b,voll:a.vollkosten}));
  assert.equal(a.isk.total,33000);
  assert.equal(s.minted,0);
  return a;
}
function bauKette(seed=42){
  const s=api.createW5BState(seed);
  assert.equal(s.rulesVersion,20);
  assert.equal(s.initialSupply,33000,'keine neuen Start-ISK');
  for(const ware of ['silizium','bauteil','jaeger'])assert.equal(s.stations.st_nadir.lager[ware],0);
  assert.equal(s.stations.st_aldera.lager.miner,2,'NPC-Starterkauf bereits erfolgt; ein weiterer Miner nach Nadir verteilt');
  assert.equal(s.stations.st_nadir.lager.miner,1);
  check(s,'Anfang');
  const kauf=api.execute(s,cmd('shipBuy','house','st_nadir'),rules);
  // Der generische Befehl verlangt eine explizite Klasse.
  assert.equal(kauf.ok,false);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'},rules).ok,true);
  const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.system==='nadir'&&sh.klasse==='miner');
  assert.ok(miner);
  assert.equal(api.execute(s,{...mine,schiff:miner.id},rules).ok,true);
  api.advance(s,1,rules);
  assert.equal(s.owners.w5b_silizium_kauf.cash,192);
  assert.equal(s.owners.w5b_silizium_arbeit.cash,14);
  check(s,'Silizium im Bau');
  api.advance(s,7,rules);
  assert.equal(s.w5b.siliziumAbgebaut,8);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  assert.equal(s.ledger.silizium.mined,8);
  assert.equal(s.owners.house.cash,2576);
  assert.equal(s.owners.fonds_transport.cash,16);
  check(s,'Silizium fertig');
  // W3: bezahlten Startfrachter aus endlichem Marktbestand kaufen.
  api.advance(s,42,rules);
  assert.ok(s.stations.st_aldera.lager.erz>=50);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'},rules).ok,true);
  const sh=Object.values(s.ships).find(o=>o.owner==='transport'&&o.klasse==='frachter'&&o.system==='aldera');
  assert.ok(sh);
  assert.equal(api.execute(s,{type:'shipFreight',owner:'transport',schiff:sh.id},rules).ok,true);
  api.advance(s,120,rules);
  assert.equal(s.w3.geliefert,50);
  assert.equal(s.stations.st_nadir.lager.erz,50);
  for(let i=0;i<4;i++){
    assert.equal(api.execute(s,cmd('stationRefine','st_nadir'),rules).ok,true);
    api.advance(s,20,rules);
    check(s,'Raffinerie '+i);
  }
  assert.equal(s.stations.st_nadir.lager.material,20);
  assert.equal(s.ledger.material.produced,20);
  const original=api.hash(s);
  const parts=api.execute(s,cmd('stationBuildParts','house'),rules);
  assert.equal(parts.ok,true,parts.reason);
  assert.equal(s.stations.st_nadir.lager.material,4);
  assert.equal(s.stations.st_nadir.lager.silizium,0);
  assert.equal(s.ledger.material.consumed,16);
  assert.equal(s.ledger.silizium.consumed,8);
  assert.equal(s.owners.w5b_fabrik_arbeit.cash,64);
  assert.notEqual(api.hash(s),original);
  check(s,'Bauteile finanziert');
  api.advance(s,64,rules);
  assert.equal(s.stations.st_nadir.lager.bauteil,8);
  assert.equal(s.ledger.bauteil.produced,8);
  assert.equal(s.owners.arbeiter_w5b_nadir.cash,64);
  check(s,'Bauteile fertig');
  assert.equal(api.execute(s,cmd('stationBuildFighter','house'),rules).ok,true);
  assert.equal(s.stations.st_nadir.lager.bauteil,0);
  assert.equal(s.stations.st_nadir.lager.material,0);
  assert.equal(s.ledger.bauteil.consumed,8);
  assert.equal(s.ledger.material.consumed,20);
  assert.equal(s.owners.w5b_fabrik_arbeit.cash,32);
  check(s,'Jaeger finanziert');
  api.advance(s,32,rules);
  assert.equal(s.owners.arbeiter_w5b_nadir.cash,96);
  assert.equal(s.ledger.jaeger.produced,1);
  assert.equal(s.stations.st_nadir.lager.jaeger,1);
  assert.equal(api.JagdSichtV1(s).jaeger.length,0,'Lagerware ist noch kein NPC-Schiff');
  check(s,'Jaeger fertig');
  return s;
}

test('W5b: Regel14-Rezepte ohne erfundene Vorprodukte oder Gelder',()=>{
  assert.deepEqual(rules.economy.rezepte.r_bauteil.ein,{material:2,silizium:1});
  assert.deepEqual(rules.economy.rezepte.r_jaeger.ein,{bauteil:8,material:4});
  const s=api.createW5BState(42),h=api.hash(s);
  assert.equal(api.execute(s,cmd('stationBuildParts','house'),rules).ok,false);
  assert.equal(api.execute(s,cmd('stationBuildFighter','house'),rules).ok,false);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'},rules).ok,false);
  assert.equal(api.hash(s),h,'Mangel leistet keinerlei Nebenbuchung');
  assert.throws(()=>api.loadW5(api.save(s)),/inkompatibel/);
  assert.throws(()=>api.loadW5B(api.save(api.createW5State(42))),/inkompatibel/);
  assert.equal(api.hash(api.loadW5B(api.save(s))),h);
  check(s);
});

test('W5b: Echte bezahlte Silizium-, Bauteil- und Jaegercharge mit atomarem Verkauf',()=>{
  const s=bauKette();
  const before=api.hash(s),npc=s.owners.npc3.cash,house=s.owners.house.cash;
  assert.equal(api.execute(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'},rules).ok,true);
  assert.equal(s.owners.npc3.cash,npc-900);
  assert.equal(s.owners.house.cash,house+900);
  assert.equal(s.ledger.jaeger.consumed,1);
  assert.equal(s.w5b.jaegerVerkauft,1);
  assert.equal(s.stations.st_nadir.lager.jaeger,0);
  assert.equal(s.w5b.schiffIds.length,1);
  const sh=s.ships[s.w5b.schiffIds[0]];
  assert.equal(sh.owner,'npc3');
  assert.equal(sh.klasse,'jaeger');
  assert.equal(sh.system,'nadir');
  assert.equal(sh.heimat,'nadir');
  assert.match(sh.id,/^sh[0-9]+$/);
  assert.notEqual(api.hash(s),before);
  const view=api.JagdSichtV1(s);
  assert.equal(view.jaeger.length,1);
  assert.equal(view.jaeger[0].id,sh.id);
  assert.equal(view.werft.ersatzbedarf,0);
  assert.ok(Object.isFrozen(view)&&Object.isFrozen(view.jaeger)&&Object.isFrozen(view.jaeger[0]));
  assert.equal(api.hash(s),api.hash(api.loadW5B(api.save(s))));
  check(s,'Nach Kauf');
  console.log('W5B_JAEGER '+JSON.stringify({seed:42,hash:api.hash(s),tick:s.tick,
    jaeger:sh.id,npcCash:s.owners.npc3.cash,hausCash:s.owners.house.cash,
    vorproduktKauf:s.w5b.vorproduktKauf,arbeitsLohn:s.w5b.fabrikLohnBezahlt}));
});

test('W5b: Kauf- und Materialmangel bleiben atomar, Geldverschiebung wird entdeckt',()=>{
  const s=bauKette(7);
  assert.equal(api.execute(s,cmd('stationBuildParts','house'),rules).ok,false);
  const cash=s.owners.npc3.cash;
  s.owners.npc3.cash=0;
  s.owners.house.cash+=cash;
  const h=api.hash(s);
  const fail=api.execute(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'},rules);
  assert.equal(fail.ok,false);
  assert.equal(api.hash(s),h);
  assert.equal(api.audit(s).isk.ok,true,'gleich bleibende Gesamtgeldmenge');
  assert.equal(api.audit(s).ok,false,'unerlaubter bilanzneutraler Transfer erkannt');
  assert.throws(()=>api.loadW5B(api.save(s)),/bilanz fehlerhaft/);
  const rein=bauKette(11);
  rein.stations.st_nadir.lager.jaeger++;
  rein.ledger.jaeger.produced++;
  assert.equal(api.audit(rein).goods.ok,true);
  assert.equal(api.audit(rein).w5b.ok,false,'Fertigungsbuch ist unabhängig vom Lagerledger');
});

test('W5b: Deterministischer 13 x 90 Tage Lauf inkl. Tag-Audit und Save/Load',()=>{
  for(const seed of seedListe){
    const s=bauKette(seed);
    assert.equal(api.execute(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'},rules).ok,true);
    const replay=api.loadW5B(api.save(s));
    for(let tag=1;tag<=90;tag++){
      api.advance(s,1440,rules);
      api.advance(replay,1440,rules);
      check(s,`Seed ${seed} Tag ${tag}`);
      assert.equal(api.hash(s),api.hash(replay),'Determinismus '+seed+'/'+tag);
    }
    assert.equal(s.w5b.jaegerFertig,1);
    assert.equal(s.w5b.jaegerVerkauft,1);
    assert.equal(api.hash(api.loadW5B(api.save(s))),api.hash(s));
    console.log('W5B_90T '+JSON.stringify({seed,hash:api.hash(s),
      minted:s.minted,produziert:s.w5b.jaegerFertig,verkauft:s.w5b.jaegerVerkauft}));
  }
});
