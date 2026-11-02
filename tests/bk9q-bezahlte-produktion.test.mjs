// B-K9q – bezahlte Originalproduktion (Schema9/Regel15, expliziter 1-ISK-Minutenversuch).
// Kein Produktparameter, keine neue ISK, keine selbsterfundene Rohstoffbeschaffung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,base,produktion}=new Function(source+
  ';return {core:m_core_index,base:m_data_rules.RULES,produktion:m_core_produktion.produktion};')();
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,produktionslohnJeMinute:1}};
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function audit(s) {
  const frei=Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
  const rest=Object.values(s.vertraege.eintraege).reduce((n,x)=>n+x.rest,0);
  assert.equal(frei+rest,s.initialSupply+s.minted-s.burned);
  assert(core.audit(s).ok,'Core Geld- und Warenaudit '+JSON.stringify(core.audit(s)));
}
function persist(s) {
  const neu=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(neu),core.hash(s),'Save/Load und Hash');
  audit(neu);return neu;
}
function line(s,id='st_cyris',rezept='r_nahrung'){
  const st=s.stations[id],l=st.linien.find(l=>l.rezept===rezept);
  assert(l,rezept+' in '+id);return l;
}
function isoliert(s, eis=2){
  const st=s.stations.st_cyris;
  st.linien=st.linien.filter(l=>l.rezept==='r_nahrung');
  const alt=st.lager.eis;st.lager.eis=eis;s.ledger.eis.initial+=eis-alt;
  return st;
}
function tick(s,n){for(let i=0;i<n;i++)core.step(s,rules);}

test('B-K9q: nur expliziter R15-Lohnversuch; produktives R14 behält alte Regeln',()=>{
  const s=core.createState(42,base);
  assert.equal(s.schema,8);assert.equal(s.rulesVersion,14);
  assert(!('hh_st_cyris' in s.owners));
  assert(s.stations.st_cyris.linien.some(l=>l.rezept==='r_nahrung'));
  assert(core.audit(s).ok);
  const p=core.createState(42,rules);
  assert.equal(p.owners.hh_st_cyris.cash,0);
  assert.equal(p.owners.hh_st_cyris.kind,'household');
  assert.equal(p.initialSupply,s.initialSupply,'0-ISK-Haushalte minten kein Geld');
  audit(p);
});

test('B-K9q: Ein echter Eis-Nahrungs-Zyklus reserviert vor Arbeitsbeginn und bezahlt erst nach 6 Minuten',()=>{
  const s=core.createState(42,rules),st=isoliert(s);
  const l=line(s),startKasse=s.owners.st_cyris.cash,startHH=s.owners.hh_st_cyris.cash;
  const vorNahrung=s.ledger.nahrung.produced;
  const cyrisNahrung=st.lager.nahrung;
  tick(s,1);
  assert.equal(l.rest,6);
  const id=l.vertrag;
  assert(id);
  assert.equal(s.vertraege.eintraege[id].rest,6);
  assert.equal(st.lager.eis,0);
  assert.equal(s.owners.st_cyris.cash,startKasse-6);
  assert.equal(s.owners.hh_st_cyris.cash,startHH);
  assert.equal(s.ledger.nahrung.produced,vorNahrung);
  const geladen=persist(s);
  tick(geladen,6);
  assert.equal(geladen.vertraege.eintraege[id].status,'geschlossen');
  assert.equal(geladen.vertraege.eintraege[id].gezahlt,6);
  assert.equal(geladen.vertraege.eintraege[id].erstattet,0);
  assert.equal(geladen.stations.st_cyris.lager.eis,0);
  assert.equal(geladen.stations.st_cyris.lager.nahrung,cyrisNahrung+1,
    'gezieltes Produktionslager statt globalen Mehrstationszaehlers pruefen');
  assert(geladen.ledger.nahrung.produced>vorNahrung);
  assert.equal(geladen.owners.st_cyris.cash,startKasse-6);
  assert.equal(geladen.owners.hh_st_cyris.cash,startHH+6);
  assert.equal(geladen.stats.konto.st_cyris.kosten,6);
  assert.equal(geladen.stats.konto.hh_st_cyris.erloes,6);
  assert(!line(geladen).vertrag);
  audit(geladen);persist(geladen);
});

test('B-K9q: 0-ISK-Station kann Rohstoffe nicht gratis zu Nahrung verarbeiten',()=>{
  const s=core.createState(42,rules),st=isoliert(s);
  const k=s.owners.st_cyris.cash;s.owners.st_cyris.cash=0;s.owners.house.cash+=k;
  tick(s,10);
  assert.equal(st.lager.eis,2,'Input wird bei fehlender Reservierung nicht verbraucht');
  assert.equal(st.lager.nahrung,52);
  assert.equal(line(s).rest,0);
  assert(!line(s).vertrag);
  assert.equal(s.owners.hh_st_cyris.cash,0);
  audit(s);
});

test('B-K9q: Rezeptwechsel waehrend gebundener Fabrikarbeit wird abgelehnt',()=>{
  const s=core.createState(42,rules);
  const st=isoliert(s);
  st.eigentum='house';tick(s,1);
  assert(line(s).vertrag);
  const vor=core.hash(s);
  const out=core.execute(s,{type:'stationRecipe',owner:'house',station:'st_cyris',rezept:'r_material'},rules);
  assert.equal(out.ok,false);
  assert.match(out.reason,/finanzierter Produktionsauftrag/);
  assert.equal(core.hash(s),vor);
  audit(s);persist(s);
});

test('B-K9q: corrupt Save mit verwaister, umgebuchter oder geloeschter Lohnreserve faellt auf',()=>{
  const s=core.createState(42,rules);isoliert(s);tick(s,1);
  const id=line(s).vertrag;
  function reject(fn){
    const x=JSON.parse(core.save(s));fn(x);
    assert.throws(()=>core.load(JSON.stringify(x),undefined,rules));
  }
  reject(x=>{delete x.stations.st_cyris.linien[0].vertrag;});
  reject(x=>{x.stations.st_cyris.linien[0].vertrag='v999';});
  reject(x=>{x.vertraege.eintraege[id].produktion.station='st_aldera';});
  reject(x=>{x.vertraege.eintraege[id].produktion.linie=99;});
  reject(x=>{x.vertraege.eintraege[id].empfaenger='npc3';});
  reject(x=>{delete x.owners.hh_st_cyris;});
  reject(x=>{x.vertraege.eintraege[id].rest+=1;});
  audit(s);persist(s);
});

test('B-K9q: alte Schema8-Spielstaende gewinnen 0-ISK-Haushaltskonten ohne Inventarverlust',()=>{
  const old=core.createState(42,base);
  const oldHash=core.hash(old);
  const migrated=core.load(core.save(old),undefined,rules);
  assert.equal(migrated.schema,9);assert.equal(migrated.rulesVersion,15);
  assert.equal(migrated.owners.hh_st_cyris.cash,0);
  assert.equal(migrated.initialSupply,old.initialSupply);
  assert.deepEqual(migrated.ledger,old.ledger);
  assert.deepEqual(migrated.ships,old.ships);
  assert.notEqual(core.hash(migrated),oldHash);
  audit(migrated);persist(migrated);
  assert.throws(()=>core.load(core.save(migrated),undefined,base),/neuer als 8/);
});

test('B-K9q: 140 abgeschlossene Vertraege werden auf 128 Belege + unabhaengig auditierte Summen begrenzt',()=>{
  const s=core.createState(11,rules),initial=s.owners.house.cash;
  for(let i=0;i<140;i++){
    const id=core.vertrag.reservieren(s,'house','npc3',2);
    assert(id);
    assert(core.vertrag.bezahlen(s,id,'leistung:test:'+i,1));
    assert(core.vertrag.abschliessen(s,id));
    if(i%17===0){audit(s);persist(s);}
  }
  assert.equal(Object.keys(s.vertraege.eintraege).length,128);
  assert.equal(s.vertraege.archiv.anzahl,12);
  assert.equal(s.vertraege.archiv.budget,24);
  assert.equal(s.vertraege.archiv.gezahlt,12);
  assert.equal(s.vertraege.archiv.erstattet,12);
  assert.equal(s.owners.house.cash,initial-140);
  assert.equal(core.vertrag.bestand(s),0);
  audit(s);persist(s);
  const bad=JSON.parse(core.save(s));bad.vertraege.archiv.budget++;
  assert.throws(()=>core.load(JSON.stringify(bad),undefined,rules),/Vertragsarchiv/);
});

test('B-K9q: 13 Seeds mit echten Produktionsperioden, Audits und deterministischem Replay',()=>{
  for(const seed of seeds){
    const run=()=>{
      const s=core.createState(seed,rules);
      isoliert(s,40);
      const k=s.owners.hh_st_cyris.cash;
      tick(s,80);
      assert(s.ledger.nahrung.produced>0);
      assert(s.owners.hh_st_cyris.cash>k,'tatsaechlich bezahlte Nahrungsarbeit');
      audit(s);persist(s);
      return {hash:core.hash(s),wage:s.owners.hh_st_cyris.cash,save:core.save(s)};
    };
    assert.deepEqual(run(),run(),String(seed));
  }
});
