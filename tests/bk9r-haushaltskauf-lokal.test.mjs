// B-K9r – bezahlter lokaler Endverbrauch ausschliesslich fuer wirklich
// produzierte Nahrung. Keine neue ISK, keine Verguetung von Startlagerbestand.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('const m_data_systeme ='), html.indexOf('const m_data_oberflaeche ='));
const {core,base,herkunft} = new Function(source +
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft};')();
const rules = {...base,schema:9,rulesVersion:15,world:{
  ...base.world,produktionslohnJeMinute:1,haushaltskaufNeu:true,
}};
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];

function geld(s) {
  const frei=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((n,e)=>n+e.rest,0);
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned);
}
function pruefe(s) {
  geld(s);
  const o=herkunft.pruefe(s);
  const a=core.audit(s);
  assert(a.ok,JSON.stringify(a));
  assert.equal(o.gekauft,s.haushaltNeuLedger.konsumiert);
}
function runde(s) {
  const fresh=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(fresh),core.hash(s));
  pruefe(fresh);
  return fresh;
}
function tick(s,n){for(let i=0;i<n;i++)core.step(s,rules);}
function nurNahrung(s,startbestand=0) {
  const st=s.stations.st_cyris;
  // Nur die lokale Nahrungsfabrik als beobachtete Linie, ohne Zufuhr neuer ISK.
  st.linien=st.linien.filter(l=>l.rezept==='r_nahrung');
  const alt=st.lager.nahrung;
  st.lager.nahrung=startbestand;
  s.ledger.nahrung.initial+=startbestand-alt;
  // Autonome Haendler bleiben bei dieser lokalen Herkunftsprobe im Dock.
  for (const sh of Object.values(s.ships)) {
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
  }
  return st;
}

test('B-K9r: Default 14/8 und nackte 15/9 ohne Haushaltskauf bleiben unberuehrt',()=>{
  const old=core.createState(42,base);
  assert.equal(old.schema,8);
  assert.equal(old.haushaltModell,undefined);
  assert.equal(old.stations.st_cyris.lokalNeuNahrung,undefined);
  assert(core.audit(old).ok);
  const no=core.createState(42,{...rules,world:{...rules.world,haushaltskaufNeu:false}});
  assert.equal(no.haushaltModell,undefined);
  assert.equal(no.stats.haushaltskauf,undefined);
});

test('B-K9r: Neuware entsteht nur durch reale lokale Produktionsfertigstellung',()=>{
  const s=core.createState(42,rules),st=nurNahrung(s,0);
  assert.equal(st.lokalNeuNahrung,0);
  const hh=s.owners.hh_st_cyris.cash;
  tick(s,1);
  assert.equal(st.lokalNeuNahrung,0,'Lohn reserviert, aber noch keine Ware');
  assert.equal(s.owners.hh_st_cyris.cash,hh);
  tick(s,6);
  assert.equal(st.lokalNeuNahrung,1);
  assert(s.haushaltNeuLedger.produziert>=1,
    'Weltzaehler umfasst auch andere lokal produzierende Stationen');
  assert.equal(s.owners.hh_st_cyris.cash,hh+6);
  pruefe(s);runde(s);
});

test('B-K9r: bei unzureichendem Lohn weder kostenloser Neukonsum noch ISK-Emission',()=>{
  const s=core.createState(42,rules),st=nurNahrung(s,0);
  tick(s,7);assert.equal(st.lokalNeuNahrung,1);
  const before=s.ledger.nahrung.consumed;
  const issuer=s.minted, paid=s.stats.haushaltskauf.st_cyris.isk;
  core.verbrauch(s,rules);
  assert.equal(st.lokalNeuNahrung,1,'Haushalt kann teure Neuware nicht bezahlen');
  assert.equal(s.stats.haushaltskauf.st_cyris.menge,0);
  assert.equal(s.stats.haushaltskauf.st_cyris.isk,paid);
  assert.equal(s.minted,issuer);
  assert(s.stats.haushaltskauf.st_cyris.fehlend>=3);
  assert(s.ledger.nahrung.consumed>=before,'andere Stationen duerfen gleichzeitig verbrauchen');
  pruefe(s);
});

test('B-K9r: bezahlter Endverbrauch fliesst zu realem Stationsmarktpreis zur Station zurueck',()=>{
  const s=core.createState(42,rules),st=nurNahrung(s,0);
  const vorKasse=s.owners.hh_st_cyris.cash;
  let erreicht=false;
  for(let i=0;i<8;i++){
    tick(s,60);
    pruefe(s);
    if(s.stats.haushaltskauf.st_cyris.menge>0){erreicht=true;break;}
  }
  assert(erreicht,'mit echtem Fabriklohn muss mindestens ein Haushalt bezahlte Nahrung kaufen koennen');
  const h=s.stats.haushaltskauf.st_cyris;
  assert(h.menge>0);assert(h.isk>0);
  assert(s.owners.hh_st_cyris.cash>=vorKasse);
  assert.equal(s.haushaltNeuLedger.konsumiert,h.menge);
  assert.equal(h.alt,0,'lokal in Cyris wurden keine eigenen Altbestände verbraucht');
  assert(s.stats.konto.hh_st_cyris.kosten>=h.isk);
  assert(s.stats.konto.st_cyris.erloes>=h.isk);
  assert(s.haushaltNeuLedger.produziert>=h.menge+st.lokalNeuNahrung);
  runde(s);
  console.log('B-K9r lokale Preis-/Lohnprobe',JSON.stringify({
    minuten:s.tick,lohn:s.stats.konto.hh_st_cyris.erloes,bezahlt:h.isk,
    nahrung:h.menge,restLohn:s.owners.hh_st_cyris.cash,
    neuRest:st.lokalNeuNahrung,fehlbedarf:h.fehlend,
  }));
});

test('B-K9r: vorgefuellter Bestand ist nicht als bezahlte Neuware buchbar',()=>{
  const s=core.createState(42,rules),st=nurNahrung(s,5);
  assert.equal(st.lokalNeuNahrung,0);
  tick(s,7);assert.equal(st.lokalNeuNahrung,1);
  const vorSt=st.lager.nahrung,vorNeu=st.lokalNeuNahrung;
  const altVorher=vorSt-vorNeu;
  core.verbrauch(s,rules);
  assert.equal(st.lager.nahrung,vorSt-Math.min(3,altVorher),
    'bei neu auftauchenden Lieferungen nur den lokalen Altbestand priorisieren');
  assert.equal(st.lokalNeuNahrung,1);
  assert.equal(s.stats.haushaltskauf.st_cyris.alt,3);
  assert.equal(s.stats.haushaltskauf.st_cyris.menge,0);
  assert.equal(s.haushaltNeuLedger.altVerbraucht,
    Object.values(s.stats.haushaltskauf).reduce((sum,x)=>sum+x.alt,0),
    'weltweiter Altverbrauch wird aus den einzelnen Stationskonten abgeglichen');
  pruefe(s);runde(s);
});

test('B-K9r: ausgehandelte lokale Neuware verliert vorsichtig die lokale Bezahlherkunft',()=>{
  const s=core.createState(42,rules),st=nurNahrung(s,0);
  tick(s,20);
  assert(st.lokalNeuNahrung>=2);
  const sh=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='house');
  assert(sh);
  sh.system='cyris'; // nur Testposition, der eigentliche Handelsvorgang ist der Core
  const vorher=st.lokalNeuNahrung;
  assert(core.handel(s,rules,sh,'st_cyris','nahrung',2,true,true),
    'Core-interne Freistellung nur hier fuer das Provenienz-Grenzfall-Testing');
  assert.equal(st.lokalNeuNahrung,vorher-2);
  assert.equal(s.haushaltNeuLedger.ausgelagert,2);
  assert(core.handel(s,rules,sh,'st_cyris','nahrung',2,false),
    'Rueckverkauf ist normale Ware, nicht nochmal lokal nachgewiesene');
  assert.equal(st.lokalNeuNahrung,vorher-2);
  pruefe(s);runde(s);
});

test('B-K9r: korrupte Herkunft und ungeeigneter Regelsatz werden nicht still akzeptiert',()=>{
  const s=core.createState(42,rules);nurNahrung(s,0);tick(s,14);
  const bad=fn=>{const x=JSON.parse(core.save(s));fn(x);
    assert.throws(()=>core.load(JSON.stringify(x),undefined,rules));};
  bad(x=>{x.stations.st_cyris.lokalNeuNahrung+=10;});
  bad(x=>{x.haushaltNeuLedger.produziert=0;});
  bad(x=>{x.haushaltNeuLedger.ausgelagert=1;});
  bad(x=>{delete x.haushaltNeuLedger;});
  bad(x=>{delete x.haushaltModell;});
  bad(x=>{delete x.stats.haushaltskauf.st_cyris;});
  bad(x=>{x.stats.haushaltskauf.st_cyris.menge=1;});
  assert.throws(()=>core.load(core.save(s),undefined,{...rules,world:{
    ...rules.world,haushaltskaufNeu:false,
  }}),/nicht aktiviertem Haushaltsmodell/);
  pruefe(s);runde(s);
});

test('B-K9r: alte Schema8-Saves bekommen keinen erfundenen Neubestand',()=>{
  const original=core.createState(42,base);
  const migrated=core.load(core.save(original),undefined,rules);
  assert.equal(migrated.haushaltModell,'lokal-neu-v1');
  assert.equal(migrated.stations.st_cyris.lokalNeuNahrung,0);
  assert.equal(migrated.haushaltNeuLedger.produziert,0);
  assert.equal(migrated.owners.hh_st_cyris.cash,0);
  assert.equal(migrated.initialSupply,original.initialSupply);
  assert.deepEqual(migrated.ledger,original.ledger);
  pruefe(migrated);runde(migrated);
  assert.throws(()=>core.load(core.save(migrated),undefined,base),/neuer als 8/);
});

test('B-K9r: 13 Seeds je vier Stunden, Audits, Hashes und Save/Load',()=>{
  for(const seed of seeds){
    const work=()=>{
      const s=core.createState(seed,rules);
      nurNahrung(s,0);
      for(let i=0;i<4;i++){tick(s,60);pruefe(s);runde(s);}
      return {hash:core.hash(s),save:core.save(s),bezahlte:s.stats.haushaltskauf.st_cyris.menge};
    };
    assert.deepEqual(work(),work(),'gleicher Determinismus Seed '+seed);
  }
});


test('B-K9r: zwei 24-Stunden-Kassenlaeufe zeigen bezahlte Nachfrage und Fehlbedarf ungeschoent',()=>{
  for(const seed of [42,7]){
    const s=core.createState(seed,rules);
    const st=nurNahrung(s,0);
    for(let i=0;i<24;i++){
      tick(s,60);
      pruefe(s);
      if(i%6===0)runde(s);
    }
    const h=s.stats.haushaltskauf.st_cyris;
    const lohn=s.stats.konto.hh_st_cyris.erloes;
    assert.equal(s.owners.hh_st_cyris.cash,lohn-h.isk,
      'tatsaechliches Haushaltseinkommen minus Kaufzahlungen = freie Haushaltskasse');
    assert(h.isk>0 && h.menge>0,'mindestens ein bezahlter echter Nahrungsverbrauch');
    assert(st.lokalNeuNahrung>=0);
    assert(h.fehlend>=0);
    pruefe(s);runde(s);
    console.log('B-K9r 24h Zahlungsbefund',JSON.stringify({
      seed,lohn,haushaltAusgaben:h.isk,haushaltKasse:s.owners.hh_st_cyris.cash,
      neuGekauft:h.menge,altVerbraucht:h.alt,nichtGedeckt:h.fehlend,
      neuImLager:st.lokalNeuNahrung,stationKasse:s.owners.st_cyris.cash,
      migriertVonStartlager:false,
    }));
  }
});


test('B-K9r: 24h-Lohn-/Preissensitivitaet ohne Produktfreigabe, 2 Seeds und 4 Testloehne',()=>{
  for(const lohnJeMinute of [1,2,4,6]){
    for(const seed of [42,7]){
      const r={...rules,world:{...rules.world,produktionslohnJeMinute:lohnJeMinute}};
      const s=core.createState(seed,r);
      const st=nurNahrung(s,0);
      for(let t=0;t<24*60;t++){
        core.step(s,r);
        if((t+1)%60===0){
          geld(s);
          assert(core.audit(s).ok,'Audit Seed='+seed+' Lohn='+lohnJeMinute);
          herkunft.pruefe(s);
        }
      }
      const h=s.stats.haushaltskauf.st_cyris;
      const kosten=s.stats.konto.hh_st_cyris.erloes;
      assert.equal(kosten-h.isk,s.owners.hh_st_cyris.cash);
      const copy=core.load(core.save(s),undefined,r);
      assert.equal(core.hash(copy),core.hash(s));
      console.log('B-K9r Sensitivitaet',JSON.stringify({
        seed,lohnJeMinute,lohn:kosten,gekauft:h.isk,nahrung:h.menge,
        bedarfFehlt:h.fehlend,neuLager:st.lokalNeuNahrung,
        haushaltCash:s.owners.hh_st_cyris.cash,stationCash:s.owners.st_cyris.cash,
      }));
    }
  }
});
