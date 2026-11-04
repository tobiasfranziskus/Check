import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert.ok(start>=0&&end>start);
const api=Function(html.slice(start,end)+'\nreturn m_core_index;')();
const rules=api.W5_RULES;
const raff={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
const bau={type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'};
const kauf={type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'};
function freight(s){
  const f=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter'&&sh.system==='aldera');
  assert.ok(f,'vorfinanzierter echter Erstfrachter in Aldera');
  return f;
}
function realChain(seed=42){
  const s=api.createW5State(seed);
  assert.equal(s.rulesVersion,19);
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.stations.st_nadir.lager.material,0);
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  assert.equal(s.ledger.frachter.produced,0);
  assert.equal(s.owners.arbeiter_werft_nadir.cash,0);
  assert.equal(s.initialSupply,33000,'keine neue ISK am Weltanfang');
  assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
  api.advance(s,50,rules);
  assert.equal(api.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'},rules).ok,true);
  const f=freight(s);
  assert.equal(api.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},rules).ok,true);
  api.advance(s,120,rules);
  assert.equal(s.w3.abgeschlossen,1);
  assert.equal(s.stations.st_nadir.lager.erz,50);
  assert.equal(api.execute(s,raff,rules).ok,true);
  api.advance(s,20,rules);
  assert.equal(s.w4.abgeschlossen,1);
  assert.equal(s.stations.st_nadir.lager.material,5);
  assert.equal(s.owners.st_nadir.cash,3240);
  assert.equal(s.owners.werft_extern.cash,1350);
  assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
  return s;
}
test('W5: Ohne echte Raffineriecharge kein Schiff, keine kostenlose Werftarbeit',()=>{
  const s=api.createW5State(42),h=api.hash(s);
  assert.equal(api.execute(s,bau,rules).ok,false);
  assert.equal(api.execute(s,{...bau,owner:'npc3'},rules).ok,false);
  assert.equal(api.execute(s,kauf,rules).ok,false);
  assert.equal(api.hash(s),h);
  assert.equal(s.ledger.frachter.produced,0);
  assert.equal(s.minted,0);
  assert.equal(api.audit(s).ok,true);
  assert.throws(()=>api.loadW4(api.save(s)),/inkompatibel/i);
  assert.throws(()=>api.loadW5(api.save(api.createW4State(42))),/inkompatibel/i);
});

test('W5: Echtes W4-Material wird fuer 500 ISK gekauft, 30 ISK Werftarbeit bezahlt',()=>{
  for(const seed of [42,7]){
    const s=realChain(seed);
    const plan=api.pilotW5Kalkulation(s);
    assert.equal(plan.ok,true,plan.grund);
    assert.equal(plan.material,5);assert.equal(plan.materialKosten,500);
    assert.equal(plan.arbeitKosten,30);assert.equal(plan.preis,750);
    assert.equal(api.execute(s,bau,rules).ok,true);
    assert.equal(s.stations.st_nadir.lager.material,0);
    assert.equal(s.ledger.material.consumed,5);
    assert.equal(s.owners.st_nadir.cash,3740,'Nadir hat echte Verkaufserloese erhalten');
    assert.equal(s.owners.werft_extern.cash,820);
    assert.equal(s.owners.w5_arbeit_treuhand.cash,30);
    assert.equal(s.owners.arbeiter_werft_nadir.cash,0);
    assert.equal(s.ledger.frachter.produced,0,'vor Arbeitsabschluss kein Schiff');
    const h=api.hash(s);
    assert.equal(api.execute(s,bau,rules).ok,false);
    assert.equal(api.hash(s),h);
    assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
    const loaded=api.loadW5(api.save(s));
    api.advance(s,29,rules);api.advance(loaded,29,rules);
    assert.equal(api.hash(s),api.hash(loaded));
    assert.equal(s.owners.w5_arbeit_treuhand.cash,1);
    assert.equal(s.owners.arbeiter_werft_nadir.cash,29);
    assert.equal(s.stations.st_nadir.lager.frachter,0);
    assert.equal(api.audit(s).ok,true);
    api.advance(s,1,rules);api.advance(loaded,1,rules);
    assert.equal(api.hash(s),api.hash(loaded));
    assert.equal(s.ledger.frachter.produced,1);
    assert.equal(s.stations.st_nadir.lager.frachter,1);
    assert.equal(s.w5.fertig,1);
    assert.equal(s.w5.auftrag,null);
    assert.equal(s.owners.arbeiter_werft_nadir.cash,30);
    assert.equal(s.owners.w5_arbeit_treuhand.cash,0);
    assert.equal(s.minted,0);
    assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
    console.log('W5_ECHTES_SCHIFF '+JSON.stringify({seed,tick:s.tick,hash:api.hash(s),
      nadirCash:s.owners.st_nadir.cash,werft:s.owners.werft_extern.cash}));
  }
});

test('W5: Frachterverkauf an reale Spedition bezahlt bestehende Werft – Schiff liegt physisch in Nadir',()=>{
  for(const seed of [42,7]){
    const s=realChain(seed);
    assert.equal(api.execute(s,bau,rules).ok,true);
    api.advance(s,30,rules);
    assert.equal(api.pilotW5Verkauf(s).ok,true);
    const before=api.hash(s);
    const buyerCash=s.owners.transport.cash;
    const werftCash=s.owners.werft_extern.cash;
    assert.equal(api.execute(s,kauf,rules).ok,true);
    assert.notEqual(api.hash(s),before);
    assert.equal(s.owners.transport.cash,buyerCash-750);
    assert.equal(s.owners.werft_extern.cash,werftCash+750);
    assert.equal(s.w5.verkauft,1);
    assert.equal(s.stations.st_nadir.lager.frachter,0);
    assert.equal(s.ledger.frachter.produced,1);
    assert.equal(s.ledger.frachter.consumed,2,'alter und neu bezahlter Frachter physisch aktiviert');
    const sh=s.ships[s.w5.schiffIds[0]];
    assert.equal(sh.owner,'transport');
    assert.equal(sh.klasse,'frachter');
    assert.equal(sh.system,'nadir');
    assert.equal(sh.phase,'dock');
    assert.equal(sh.auftrag,'halten');
    assert.equal(s.initialSupply,33000);
    assert.equal(s.minted,0);
    assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
    assert.equal(api.hash(api.loadW5(api.save(s))),api.hash(s));
    console.log('W5_BEZAHLTER_VERKAUF '+JSON.stringify({seed,tick:s.tick,hash:api.hash(s),shiff:sh.id,
      buyerCash:s.owners.transport.cash,stationCash:s.owners.st_nadir.cash}));
  }
});

test('W5: Materialverkauf gibt Nadir tatsächlich neues Käuferbudget für W3, kein künstliches Auffüllen',()=>{
  const s=realChain(42),f=freight(s);
  assert.equal(s.owners.st_nadir.cash,3240);
  assert.equal(api.execute(s,bau,rules).ok,true);
  assert.equal(s.owners.st_nadir.cash,3740);
  assert.equal(s.w5.materialUmsatz,500);
  // Neue W3-Lieferung muss zusätzlich und vollständig aus dem real vorhandenen
  // Nadir-Budget finanziert werden – Waren- und Arbeitsseite unabhängig.
  let n=0;
  while(s.stations.st_aldera.lager.erz<50&&n<240){api.advance(s,1,rules);n++;}
  assert.ok(s.stations.st_aldera.lager.erz>=50,'echte Folgecharge vorhanden');
  const before=s.owners.st_nadir.cash;
  const job=api.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},rules);
  assert.equal(job.ok,true,job.reason);
  assert.equal(s.owners.st_nadir.cash,before-740);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(api.audit(s).ok,true,JSON.stringify(api.audit(s)));
});

test('W5: Manipulation an Material, Werftkonto oder fertiggestelltem Frachter wird erkannt',()=>{
  const s=realChain(42);
  assert.equal(api.execute(s,bau,rules).ok,true);
  const a=api.audit(s);
  assert.equal(a.ok,true);
  s.owners.werft_extern.cash+=1;
  s.owners.st_nadir.cash-=1;
  assert.equal(api.audit(s).isk.ok,true,'Weltgeldmenge allein kann Ruecktransfer nicht beweisen');
  assert.equal(api.audit(s).w5.ok,false,'Werftkonto unabhängig geprüft');
  assert.throws(()=>api.loadW5(api.save(s)),/bilanz fehlerhaft/i);
  const clean=realChain(42);
  api.execute(clean,bau,rules);api.advance(clean,30,rules);
  clean.stations.st_nadir.lager.frachter++;
  clean.ledger.frachter.produced++;
  const bad=api.audit(clean);
  assert.equal(bad.goods.ok,true,'Warenledger gefälscht');
  assert.equal(bad.w5.ok,false,'Fertigungsbuch bleibt unabhängiger Prüfpfad');
  assert.equal(bad.ok,false);
});

test('W5: 13 Seeds x 90 Tage nach W0–W5-Kauf, Materialproduktion, Schiffbau und Save-Replay',()=>{
  const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
  for(const seed of seeds){
    const s=realChain(seed);
    assert.equal(api.execute(s,bau,rules).ok,true);
    api.advance(s,30,rules);
    assert.equal(api.execute(s,kauf,rules).ok,true);
    const replay=api.loadW5(api.save(s));
    for(let day=1;day<=90;day++){
      api.advance(s,1440,rules);api.advance(replay,1440,rules);
      const a=api.audit(s);
      assert.equal(a.ok,true,JSON.stringify({seed,day,components:a.w5,goods:a.goods,w3:a.w3,w4:a.w4}));
      assert.equal(a.isk.total,33000);
      assert.equal(s.minted,0);
      assert.equal(api.hash(s),api.hash(replay),'W5 hash seed'+seed+' day'+day);
    }
    assert.equal(s.w5.fertig,1);
    assert.equal(s.w5.verkauft,1);
    assert.equal(api.hash(api.loadW5(api.save(s))),api.hash(s));
  }
});
