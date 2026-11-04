import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const first=html.indexOf('const m_data_systeme =');
const last=html.indexOf('const m_data_oberflaeche =');
assert.ok(first>=0&&last>first);
const api=Function(html.slice(first,last)+'\nreturn m_core_index;')();
const r=api.W3_RULES;

function cargo(s) {
  const sh=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
  assert.ok(sh,'echt gekauftes Speditionsschiff');
  return sh;
}
function bereit(seed=42) {
  const s=api.createW3State(seed);
  assert.equal(s.rulesVersion,17);
  assert.equal(s.stations.st_nadir.lager.erz,0,'Nadir besitzt kein Start-Erz');
  assert.equal(s.ledger.erz.initial,0,'keine Gratisware');
  assert.equal(s.stations.st_aldera.lager.frachter,1,'fertige bezahlbare Huelle');
  assert.equal(api.audit(s).ok,true);
  const zuFrueh=api.execute(s,{type:'shipFreight',owner:'transport',schiff:'sh001'},r);
  assert.equal(zuFrueh.ok,false,'Miner darf kein Frachterauftrag sein');
  api.advance(s,50,r);
  assert.ok(s.stations.st_aldera.lager.erz>=50,'NPC hat Erz tatsächlich gefoerdert und verkauft');
  const buy=api.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'},r);
  assert.equal(buy.ok,true,buy.reason);
  assert.equal(s.owners.transport.cash,1250,'750 ISK Schiffspreis bezahlt');
  assert.equal(s.owners.werft_extern.cash,1350,'Werft erhielt Miner- und Frachterpreise');
  assert.equal(api.audit(s).ok,true);
  return s;
}
function start(s) {
  const sh=cargo(s);
  const order=api.execute(s,{type:'shipFreight',owner:'transport',schiff:sh.id},r);
  assert.equal(order.ok,true,order.reason);
  assert.equal(api.audit(s).ok,true,'sofortige Treuhandbuchung auditierbar');
  return sh;
}

test('W3: Frachterkauf, alle Mittel und echte Ware vorab gesperrt',()=>{
  for(const seed of [42,7]){
    const s=bereit(seed),sh=start(s);
    assert.equal(s.owners.st_nadir.cash,3260);
    assert.equal(s.owners.w3_kauf_treuhand.cash,740);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
    assert.equal(s.owners.transport.cash,1130);
    assert.equal(sh.ladung.erz,50);
    assert.equal(sh.phase,'reise');
    assert.equal(sh.ziel,'st_nadir');
    assert.equal(s.stations.st_nadir.lager.erz,0);
    assert.equal(s.w3.auftrag.phase,'hin');
    assert.equal(api.audit(s).isk.total,33000);
    assert.equal(s.minted,0);
    assert.equal(api.hash(api.loadW3(api.save(s))),api.hash(s));
    console.log('W3_RESERVE '+JSON.stringify({seed,hash:api.hash(s),cash:api.audit(s).w3}));
  }
});

test('W3: Ankunft bezahlt Ware, Rueckfahrt verbraucht echte Arbeit, Entgelt nach Abschluss',()=>{
  for(const seed of [42,7]){
    const s=bereit(seed),sh=start(s);
    const a=api.loadW3(api.save(s));
    api.advance(s,59,r);api.advance(a,59,r);
    assert.equal(sh.phase,'reise');
    assert.equal(sh.ladung.erz,50);
    assert.equal(s.owners.fonds_transport.cash,59);
    assert.equal(api.audit(s).ok,true);
    assert.equal(api.hash(s),api.hash(a));
    api.advance(s,1,r);api.advance(a,1,r);
    assert.equal(sh.phase,'reise');
    assert.equal(sh.ziel,'st_aldera');
    assert.equal(sh.system,'nadir');
    assert.equal(sh.ladung.erz??0,0);
    assert.equal(s.stations.st_nadir.lager.erz,50);
    assert.equal(s.w3.geliefert,50);
    assert.equal(s.owners.w3_kauf_treuhand.cash,240);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,60);
    assert.equal(s.owners.fonds_transport.cash,60);
    assert.equal(api.hash(s),api.hash(a),'Save/Load waehrend realer Ware und Arbeit');
    assert.equal(api.audit(s).ok,true);
    api.advance(s,60,r);api.advance(a,60,r);
    assert.equal(sh.phase,'dock');
    assert.equal(sh.system,'aldera');
    assert.equal(s.w3.auftrag,null);
    assert.equal(s.w3.abgeschlossen,1);
    assert.equal(s.w3.geliefert,50);
    assert.equal(s.owners.w3_kauf_treuhand.cash,0);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,0);
    assert.equal(s.owners.fonds_transport.cash,120);
    assert.equal(s.owners.transport.cash,1370,'2000-750 Schiff-120 Arbeit+240 Fracht');
    assert.equal(s.owners.st_nadir.cash,3260);
    assert.equal(s.owners.werft_extern.cash,1350);
    assert.equal(s.w3.frachtUmsatz,240);
    assert.equal(s.w3.arbeitsKosten,120);
    assert.equal(s.ledger.erz.exported<=s.ledger.erz.mined,true);
    assert.equal(api.hash(s),api.hash(a),'Wiederholung ueber zwei reale Fluege');
    assert.equal(api.audit(s).ok,true);
    assert.equal(s.minted,0);
    console.log('W3_GELIEFERT '+JSON.stringify({seed,tick:s.tick,hash:api.hash(s),w3:api.audit(s).w3}));
  }
});

test('W3: keine Gratis-Fahrt ohne Ware; keine doppelten Verträge, nicht bei W1/14',()=>{
  const s=api.createW3State(42);
  const before=api.hash(s);
  const cmd={type:'shipFreight',owner:'npc3',schiff:'sh001'};
  const fail=api.execute(s,cmd,r);
  assert.equal(fail.ok,false);
  assert.equal(api.hash(s),before);
  const ready=bereit(42),sh=start(ready);
  const booked=api.hash(ready);
  assert.equal(api.execute(ready,{type:'shipFreight',owner:'transport',schiff:sh.id},r).ok,false);
  assert.equal(api.hash(ready),booked);
  assert.equal(api.execute(ready,{type:'shipWait',owner:'transport',schiff:sh.id},r).ok,false);
  assert.equal(api.audit(ready).ok,true);
  assert.throws(()=>api.loadErz(api.save(ready)),/inkompatibel/);
  assert.throws(()=>api.loadW2(api.save(ready)),/inkompatibel/);
  const w1=api.createErzState(42);assert.equal(api.audit(w1).ok,true);
  const w2=api.createW2State(42);assert.equal(api.audit(w2).ok,true);
  assert.throws(()=>api.loadW3(api.save(w2)),/inkompatibel/);
  const main=api.createState(42);api.advance(main,60);
  assert.equal(api.hash(main),'866776f7d84ef15e');
});

test('W3: 13 Seeds x 90 Tage, alle realen Konten/Warenaudits plus Save/Load',()=>{
  const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
  for(const seed of seeds){
    const s=bereit(seed);start(s);
    let saved=api.loadW3(api.save(s));
    for(let d=1;d<=90;d++){
      api.advance(s,1440,r);
      api.advance(saved,1440,r);
      assert.equal(api.audit(s).ok,true,'Geld, Ware, Vertrag '+seed+'/'+d);
      assert.equal(api.audit(s).isk.total,33000);
      assert.equal(s.minted,0);
      assert.equal(api.hash(s),api.hash(saved),'Replay '+seed+'/'+d);
    }
    assert.equal(s.w3.geliefert,50);
    assert.equal(s.w3.abgeschlossen,1);
    assert.equal(api.hash(api.loadW3(api.save(s))),api.hash(s));
  }
});
