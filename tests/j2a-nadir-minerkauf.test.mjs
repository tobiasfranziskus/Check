import test from 'node:test';
import assert from 'node:assert/strict';
import {versuch, bestand, ablehnen} from '../tools/j2-silizium-gate.mjs';

const cmd=(owner='house',more={})=>({type:'stationClaimMinerLocal',owner,station:'st_nadir',...more});
const check=(w,s)=>assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));
const buying=async seed=>{
  const {w,s,report}=await versuch(seed);
  check(w,s);
  assert.equal(s.stations.st_nadir.lager.miner,1);
  assert.equal(s.kanon.minerWerft.wartetAuf,'house');
  assert.equal(report.final.hash,seed===42?'c5d9d3becc36c4a4':'d7fbd58bc707e2ae');
  return {w,s};
};
for(const seed of [42,7])test('J2a seed '+seed+': originalbezahlte K2-Huelle lokal kaufen, kein Gratis-/Doppelkauf',async()=>{
  const {w,s}=await buying(seed);
  const original=w.canonical(s),ownerVor=s.owners.house.cash,werftVor=s.owners.werft_extern.cash;
  const minerVor=Object.values(s.ships).filter(x=>x.klasse==='miner').length;
  const ledgerVor=s.ledger.miner.consumed;
  const reject=()=>{
    for(const c of [
      {type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'}, // J2 unveraendert
      cmd('npc3'),
      cmd('transport'),
      cmd('house',{preis:0}),
      cmd('house',{station:'st_aldera'}),
      {type:'stationClaimMinerLocal',owner:'house'}, // Stationspflicht
    ]) ablehnen(w,s,c);
    assert.equal(w.canonical(s),original);
  };
  reject();
  const gekauft=w.execute(s,cmd());
  assert.equal(gekauft.ok,true,JSON.stringify(gekauft));
  check(w,s);
  assert.equal(s.owners.house.cash,ownerVor-600,'realer 600-ISK-Kaufpreis');
  assert.equal(s.owners.werft_extern.cash,werftVor+600,'reale Werft Einnahme');
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(s.ledger.miner.consumed,ledgerVor+1,'echt verbrauchte Lagerhuelle');
  assert.equal(s.stations.st_nadir.lager.miner,0,'Nadir-Lager minus 1');
  assert.equal(Object.values(s.ships).filter(x=>x.klasse==='miner').length,minerVor+1);
  const r=s.kanon.minerWerft;
  assert.equal(r.lokalGekauft,1);
  assert.equal(r.wartetAuf,null);
  assert.equal(r.lokaleKaeufe.length,1);
  const inv=r.lokaleKaeufe[0],sh=s.ships[inv.id];
  assert.equal(inv.owner,'house');
  assert.equal(inv.station,'st_nadir');
  assert.equal(inv.preis,600);
  assert.equal(sh.owner,'house');
  assert.equal(sh.klasse,'miner');
  assert.equal(sh.system,'nadir');
  assert.equal(sh.heimat,'nadir');
  assert.equal(sh.flug.lage,'angedockt','original F6 koerper am richtigen Ort');
  assert.equal(sh.flug.anker,'st_nadir');
  const once=w.canonical(s);
  for(const duplicate of [cmd('house'),cmd('npc3'),{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'}])
    ablehnen(w,s,duplicate);
  assert.equal(w.canonical(s),once);
  const saved=w.save(s),loaded=w.load(saved);
  assert.equal(w.hash(loaded),w.hash(s));
  assert.deepEqual(loaded,s,'buchhaltungs- und kaufbelege save/load-identisch');
  const replay=await buying(seed);
  assert.equal(replay.w.execute(replay.s,cmd()).ok,true);
  assert.equal(replay.w.hash(replay.s),w.hash(s),'deterministische Eigentumsuebertragung');
  bestand(w,s);
});
test('J2a: fehlender 600. ISK, Ware, Werft-Vormerkung oder falscher Besitzer atomar verweigert',async()=>{
  const {w,s}=await buying(42);
  const negative=[
    z=>{z.owners.house.cash=599;},
    z=>{z.stations.st_nadir.lager.miner=0;},
    z=>{z.kanon.minerWerft.wartetAuf='npc3';},
    z=>{z.kanon.minerWerft.fertig++;},
    z=>{z.kanon.minerWerft.transport={schiff:'fake',besteller:'house'};},
  ];
  const raw=w.save(s);
  for(const mutate of negative){
    const invalid=w.load(raw);mutate(invalid);
    const before=w.canonical(invalid);
    const result=w.execute(invalid,cmd());
    assert.equal(result.ok,false,'bei Mangel nicht kaufen: '+JSON.stringify(result));
    assert.equal(w.canonical(invalid),before,'keine Nebenbuchungen trotz absichtlich ungueltigem Negativfixture');
  }
  const wrong=JSON.parse(raw);wrong.stations.st_nadir.lager.miner=0;
  assert.throws(()=>w.load(JSON.stringify(wrong)),'Lager-Manipulation beim Laden');
});
test('J2a: gefaelschter K2-Eigentums-, Lokalverkauf- und Schiffsbeleg wird beim Laden erkannt',async()=>{
  const {w,s}=await buying(42);
  assert.equal(w.execute(s,cmd()).ok,true);
  const original=w.save(s);
  for(const mutate of [
    z=>{z.kanon.minerWerft.lokalGekauft=0;},
    z=>{z.kanon.minerWerft.lokaleKaeufe=[];},
    z=>{z.kanon.minerWerft.lokaleKaeufe[0].preis=0;},
    z=>{z.kanon.minerWerft.lokaleKaeufe[0].owner='npc3';},
    z=>{z.kanon.minerWerft.lokaleKaeufe[0].id='f8_training_only';},
    z=>{z.kanon.minerWerft.lokaleKaeufe[0].tick=z.tick+1;},
    z=>{z.stations.st_nadir.lager.miner=1;},
    z=>{z.ledger.miner.consumed--;},
    z=>{z.ships[z.kanon.minerWerft.lokaleKaeufe[0].id].owner='npc3';},
    z=>{z.ships[z.kanon.minerWerft.lokaleKaeufe[0].id].system='aldera';},
  ]){
    const invalid=JSON.parse(original);mutate(invalid);
    assert.equal(w.audit(invalid).ok,false,'manipulierten Zustand ablehnen');
    assert.throws(()=>w.load(JSON.stringify(invalid)),'manipulierte JSON-Datei');
  }
  check(w,s);
});
test('J2a: keine vorgetaeuschte Siliziumfoerderung – K2-Miner bleibt endliche wirtschaftliche Huelle',async()=>{
  const {w,s}=await buying(42);
  assert.equal(w.execute(s,cmd()).ok,true);
  const sh=s.ships[s.kanon.minerWerft.lokaleKaeufe[0].id];
  const before=w.canonical(s);
  ablehnen(w,s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'silizium'});
  assert.equal(w.canonical(s),before);
  assert.equal(s.ledger.silizium,undefined);
  assert.equal(s.stations.st_nadir.lager.silizium,undefined);
  assert.equal(Object.values(s.ships).filter(x=>x.klasse==='jaeger').length,0);
  check(w,s);
});
