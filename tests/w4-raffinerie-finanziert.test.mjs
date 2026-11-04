import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert.ok(begin>=0&&end>begin);
const api=Function(html.slice(begin,end)+'\nreturn m_core_index;')();
const r=api.W4_RULES,refine={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};

function frachter(s) {
  const f=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
  assert.ok(f,'gekaufter Frachter existiert');
  return f;
}
function startCargo(seed=42) {
  const s=api.createW4State(seed);
  assert.equal(s.rulesVersion,18);
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.stations.st_nadir.lager.material,0);
  assert.equal(s.ledger.material.initial,0);
  assert.equal(s.owners.arbeitskraefte_nadir.cash,0);
  assert.equal(api.audit(s).ok,true);
  const hash=api.hash(s);
  assert.equal(api.execute(s,refine,r).ok,false,'vor der Erzlieferung kein kostenloser Rezeptstart');
  assert.equal(api.hash(s),hash);
  api.advance(s,50,r);
  assert.ok(s.stations.st_aldera.lager.erz>=50);
  const bought=api.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'},r);
  assert.equal(bought.ok,true,bought.reason);
  const f=frachter(s);
  const freight=api.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},r);
  assert.equal(freight.ok,true,freight.reason);
  assert.equal(api.audit(s).ok,true);
  api.advance(s,60,r);
  assert.equal(s.w3.geliefert,50);
  assert.equal(s.w3.auftrag.phase,'rueck');
  assert.equal(s.stations.st_nadir.lager.erz,50);
  assert.equal(api.audit(s).ok,true);
  return s;
}

test('W4: Keine Gratisware und kein Auftrag ohne reales Erz bzw. ohne berechtigten Kontoinhaber',()=>{
  const s=api.createW4State(42),h=api.hash(s);
  assert.equal(api.execute(s,refine,r).ok,false);
  assert.equal(api.execute(s,{...refine,owner:'npc3'},r).ok,false);
  assert.equal(api.execute(s,{...refine,station:'st_aldera'},r).ok,false);
  assert.equal(api.hash(s),h);
  assert.equal(s.ledger.material.produced,0);
  assert.equal(s.minted,0);
  assert.equal(api.audit(s).ok,true);
  const w3=api.createW3State(42);
  assert.equal(api.execute(w3,refine,api.W3_RULES).ok,false);
  assert.throws(()=>api.loadW4(api.save(w3)),/inkompatibel/i);
  assert.throws(()=>api.loadW3(api.save(s)),/inkompatibel/i);
});

test('W4: Echte 10-Erz-zu-5-Material-Charge, 20 Minuten bezahlte Arbeit aus Nadir-Treuhand',()=>{
  for(const seed of [42,7]){
    const s=startCargo(seed),k=api.pilotW4Kalkulation(s);
    assert.equal(k.ok,true,k.grund);
    assert.equal(k.erz,10);
    assert.equal(k.material,5);
    assert.equal(k.arbeit,20);
    const begin=api.execute(s,refine,r);
    assert.equal(begin.ok,true,begin.reason);
    assert.equal(s.owners.st_nadir.cash,3240);
    assert.equal(s.owners.w4_arbeit_treuhand.cash,20);
    assert.equal(s.owners.arbeitskraefte_nadir.cash,0);
    assert.equal(s.stations.st_nadir.lager.erz,50,'Erz ist bis zur Verarbeitung real im Lager');
    assert.equal(s.w4.auftrag.gearbeitet,0);
    assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
    const h=api.hash(s);
    assert.equal(api.execute(s,refine,r).ok,false,'keine Doppelbeauftragung');
    assert.equal(api.hash(s),h);
    const loaded=api.loadW4(api.save(s));
    api.advance(s,19,r);api.advance(loaded,19,r);
    assert.equal(api.hash(s),api.hash(loaded));
    assert.equal(s.w4.auftrag.gearbeitet,19);
    assert.equal(s.owners.w4_arbeit_treuhand.cash,1);
    assert.equal(s.owners.arbeitskraefte_nadir.cash,19);
    assert.equal(s.ledger.material.produced,0,'keine Fertigware vor echter Fertigstellung');
    assert.equal(api.audit(s).ok,true);
    api.advance(s,1,r);api.advance(loaded,1,r);
    assert.equal(api.hash(s),api.hash(loaded));
    assert.equal(s.w4.auftrag,null);
    assert.equal(s.stations.st_nadir.lager.erz,40);
    assert.equal(s.stations.st_nadir.lager.material,5);
    assert.equal(s.ledger.erz.consumed,10);
    assert.equal(s.ledger.material.produced,5);
    assert.equal(s.owners.w4_arbeit_treuhand.cash,0);
    assert.equal(s.owners.arbeitskraefte_nadir.cash,20);
    assert.equal(s.owners.st_nadir.cash,3240);
    assert.equal(s.w4.abgeschlossen,1);
    assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
    assert.equal(api.audit(s).isk.total,33000);
    assert.equal(s.minted,0);
    console.log('W4_ECHTE_CHARGE '+JSON.stringify({seed,tick:s.tick,hash:api.hash(s),
      arbeit:s.w4.gezahlt,material:s.w4.materialErzeugt,erz:s.w4.erzVerbraucht}));
  }
});

test('W4: Reale Fracht- und Raffinerie-Umsaetze bleiben im selben Save begrenzt',()=>{
  const s=startCargo(42);
  // Abgeschlossen nach echtem Rueckflug; Nadir hält Erz, aber kein Material ohne Arbeit.
  api.advance(s,60,r);
  assert.equal(s.w3.abgeschlossen,1);
  const carrier=frachter(s);
  for(let charge=1;charge<=5;charge++){
    assert.equal(api.execute(s,refine,r).ok,true);
    api.advance(s,20,r);
    assert.equal(s.w4.abgeschlossen,charge);
    assert.equal(s.w4.materialErzeugt,charge*5);
    assert.equal(s.stations.st_nadir.lager.erz,50-charge*10);
    assert.equal(s.owners.arbeitskraefte_nadir.cash,charge*20);
    assert.equal(api.audit(s).ok,true,'W4-Zyklen '+charge);
  }
  assert.equal(s.stations.st_nadir.lager.erz,0);
  const before=api.hash(s);
  assert.equal(api.execute(s,refine,r).ok,false,'ohne neues Erz keine weitere Produktion');
  assert.equal(api.hash(s),before);
  // Auch die zweite Fracht muss erst aus weiteren echten NPC-Foerderminuten
  // stammen; es gibt keine automatisch nachgefuellte Erzcharge.
  if(s.stations.st_aldera.lager.erz<50) api.advance(s,50,r);
  assert.ok(s.stations.st_aldera.lager.erz>=50);
  const next=api.execute(s,{type:'shipFreight',owner:'transport',schiff:carrier.id},r);
  assert.equal(next.ok,true,next.reason);
  api.advance(s,120,r);
  assert.equal(s.w3.abgeschlossen,2);
  assert.equal(s.stations.st_nadir.lager.erz,50);
  assert.equal(s.stations.st_nadir.lager.material,25);
  assert.equal(s.owners.st_nadir.cash,4000-2*740-5*20);
  assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
});

test('W4: 5 reale Frachten, 15 Produktionschargen, Stopp bei 0 ISK trotz Rest-Erz',()=>{
  const s=startCargo(42),f=frachter(s);
  api.advance(s,60,r);
  for(let i=2;i<=5;i++){
    assert.equal(api.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},r).ok,true);
    api.advance(s,120,r);
    assert.equal(api.audit(s).ok,true);
  }
  assert.equal(s.owners.st_nadir.cash,300);
  assert.equal(s.stations.st_nadir.lager.erz,250);
  for(let i=1;i<=15;i++){
    assert.equal(api.execute(s,refine,r).ok,true,'Arbeit bezahlt '+i);
    api.advance(s,20,r);
    assert.equal(api.audit(s).ok,true,'W4 Nachweis '+i);
  }
  assert.equal(s.owners.st_nadir.cash,0);
  assert.equal(s.stations.st_nadir.lager.erz,100);
  assert.equal(s.stations.st_nadir.lager.material,75);
  assert.equal(s.owners.arbeitskraefte_nadir.cash,300);
  assert.equal(s.owners.w4_arbeit_treuhand.cash,0);
  const h=api.hash(s);
  const fail=api.execute(s,refine,r);
  assert.equal(fail.ok,false);
  assert.match(fail.reason,/bezahlen|Arbeits|Kasse/);
  assert.equal(api.hash(s),h);
  assert.equal(api.audit(s).ok,true);
  assert.equal(api.hash(api.loadW4(api.save(s))),h);
  assert.equal(s.minted,0);
});

test('W4: 13 Seeds x 90 Tage mit bezahltem Transport, Produktion, Replay, Save und Gesamtbilanz',()=>{
  const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
  for(const seed of seeds){
    const s=startCargo(seed);
    assert.equal(api.execute(s,refine,r).ok,true);
    const compare=api.loadW4(api.save(s));
    for(let day=1;day<=90;day++){
      api.advance(s,1440,r);api.advance(compare,1440,r);
      assert.equal(api.audit(s).ok,true,seed+'/'+day);
      assert.equal(api.audit(s).isk.total,33000,seed+'/'+day);
      assert.equal(s.minted,0);
      assert.equal(api.hash(s),api.hash(compare),'deterministischer W4-Replay '+seed+'/'+day);
    }
    assert.equal(s.w4.abgeschlossen,1);
    assert.equal(s.w3.abgeschlossen,1);
    assert.equal(api.hash(api.loadW4(api.save(s))),api.hash(s));
  }
});
