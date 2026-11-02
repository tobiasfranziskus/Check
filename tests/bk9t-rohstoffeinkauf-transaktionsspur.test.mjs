// B-K9t – testseitiger Mitschnitt ORIGINALER Kern-Transaktionen.
// Keine Produktregel, keine neuen Felder in State/Save; Protokoll existiert
// nur in der Test-Closure. Untersucht wirkliche Rohstoff-Einkaufsausgaben.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const marker='  if (!reicht) return false;';
assert.equal(original.split(marker).length,2,'einziges Core-Handelsbuchungs-Gate');
const instrument=original.replace(marker,[
  '  if (!reicht) return false;',
  '  __beobachtet.push({tick:state.tick,station,owner:schiff.owner,ware,menge,kauf,',
  '    preis:p,wert,fee});',
].join('\n'));
const {core,grund,handelsbelege}=new Function('const __beobachtet=[];\n'+instrument+
  ';return {core:m_core_index,grund:m_data_rules.RULES,handelsbelege:__beobachtet};')();
const normal=new Function(original+';return m_core_index;')();
const id='st_cyris';
function rules(){return {...grund,schema:9,rulesVersion:15,world:{
  ...grund.world,produktionslohnJeMinute:4,haushaltskaufNeu:true,
  mindeststand:0,fondsObergrenze:1_000_000_000,
}};}
function make(seed,crystalOff){
  const r=rules(),s=core.createState(seed,r),st=s.stations[id];
  st.linien=st.linien.filter(l=>l.rezept==='r_nahrung');
  const alt=st.lager.nahrung;st.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
  let crystal=0;
  for(const sh of Object.values(s.ships)){
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
    if(crystalOff&&sh.owner==='npc3'&&sh.klasse==='miner'
      && sh.system==='cyris'&&sh.ware==='kristall'&&sh.auftrag==='foerdern'){
      sh.auftrag='halten';crystal++;
    }
  }
  if(crystalOff)assert(crystal>0,'kristallminer existiert');
  return {s,r};
}
function audit(s){
  const t=Object.values(s.owners).reduce((x,o)=>x+o.cash,0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((x,v)=>x+v.rest,0);
  assert.equal(t+gebunden,s.initialSupply+s.minted-s.burned);
  assert(core.audit(s).ok);
}
function preisAusgaben(start,ende,ware){
  const entries=handelsbelege.slice(start,ende).filter(x=>
    x.station===id&&!x.kauf&&x.ware===ware);
  return {isk:entries.reduce((n,x)=>n+x.wert,0),
    einheiten:entries.reduce((n,x)=>n+x.menge,0),
    markttransaktionen:entries.length};
}
function probe(seed,crystalOff){
  const {s,r}=make(seed,crystalOff);
  let start=handelsbelege.length;
  const ergebnis=[];
  let prevKonto=0,prevLohn=0,prevKauf=0,prevRezepte=0;
  for(let t=0;t<3*1440;t++){
    core.step(s,r);
    if(s.tick%60===0)audit(s);
    if(s.tick%1440)continue;
    const next=handelsbelege.length;
    const ice=preisAusgaben(start,next,'eis'),kr=preisAusgaben(start,next,'kristall');
    const rawCost=s.stats.konto[id].kosten-prevKonto;
    const wage=s.stats.konto['hh_'+id].erloes-prevLohn;
    const hhSpend=s.stats.haushaltskauf[id].isk-prevKauf;
    const production=s.stats.rezepte[id]-prevRezepte;
    const documented=ice.isk+kr.isk+wage;
    const trace={seed,crystalOff,day:s.tick/1440,
      stationCash:s.owners[id].cash,householdCash:s.owners['hh_'+id].cash,
      rezeptProduktionen:production,lohn:wage,haushaltNachfrage:hhSpend,
      eisKaufISK:ice.isk,eisKaufMenge:ice.einheiten,
      kristallKaufISK:kr.isk,kristallKaufMenge:kr.einheiten,
      weitereKostenISK:rawCost-documented,
      stationAusgabenISK:rawCost,neuLager:s.stations[id].lokalNeuNahrung,
      nahrungBezahlt:s.stats.haushaltskauf[id].menge,
      fehlbedarf:s.stats.haushaltskauf[id].fehlend,
      protokolle:next-start,
    };
    assert(trace.weitereKostenISK>=0,'kein unterschlagener oder doppelt berechneter Stationsaufwand');
    const loaded=core.load(core.save(s),undefined,r);
    assert.equal(core.hash(loaded),core.hash(s));
    audit(loaded);
    ergebnis.push(trace);
    start=next;prevKonto=s.stats.konto[id].kosten;
    prevLohn=s.stats.konto['hh_'+id].erloes;
    prevKauf=s.stats.haushaltskauf[id].isk;prevRezepte=s.stats.rezepte[id];
    console.log('B-K9t Kassenursache',JSON.stringify(trace));
  }
  return ergebnis;
}
test('B-K9t: Test-Hook aendert keinen einzigen Core-Zustand oder Hash',()=>{
  for(const seed of [42,7]){
    const x=core.createState(seed,grund),y=normal.createState(seed,grund);
    assert.equal(core.hash(x),normal.hash(y));
    for(let t=0;t<60;t++){core.step(x,grund);normal.step(y,grund);}
    assert.equal(core.hash(x),normal.hash(y));
    assert.equal(core.save(x),normal.save(y));
  }
});

test('B-K9t: wirkliche Eis-/Kristallzahlungen nach Warentyp – 2 Seeds ×3 Tage',()=>{
  for(const seed of [42,7]){
    const alle=probe(seed,false);
    assert.equal(alle.length,3);
    assert(alle[0].eisKaufISK>0,'nach tatsaechlichem Eisverkauf an Cyris gezahlt');
    assert(alle[0].stationAusgabenISK>=alle[0].lohn+alle[0].eisKaufISK);
  }
});

test('B-K9t: Gegenprobe ohne Kristallminer trennt Nebenkosten vom Nahrungszyklus',()=>{
  for(const seed of [42,7]){
    const alle=probe(seed,true);
    assert.equal(alle.length,3);
    assert.equal(alle.reduce((n,x)=>n+x.kristallKaufISK,0),0,
      'keine Kristallkaufzahlungen ohne aktive Kristallfoerderung');
    assert(alle[0].eisKaufISK>0,'Eisversorgung durch verbleibenden Miner nicht deaktiviert');
  }
});
