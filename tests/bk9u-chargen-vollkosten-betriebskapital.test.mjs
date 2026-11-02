// B-K9u – zustandsneutraler FIFO-Belegtest: Eis -> einzelne Nahrungscharge -> bezahlter Verbrauch.
// Nur Analyse: keine neue Spielregel, kein Preis-/Lohn-/Emissionswechsel.
// Initiale Eisbestände haben ohne Anschaffungsbeleg ausdrücklich UNBEKANNTEN Einstand.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const belege=[];
function ersetzeGenauEinmal(text,alt,neu){
  assert.equal(text.split(alt).length,2,'Instrumentierungsanker eindeutig: '+alt.slice(0,65));
  return text.replace(alt,neu);
}
let instrumentiert=original;
instrumentiert=ersetzeGenauEinmal(instrumentiert,
  '  if (!reicht) return false;',
  '  if (!reicht) return false;\n'+
  "  if (station === 'st_cyris' && !kauf && (ware === 'eis' || ware === 'kristall'))\n"+
  "    __bk9u.push({art:'rohKauf',tick:state.tick,ware,menge,preis:p,wert,fee,schiff:schiff.id});");
instrumentiert=ersetzeGenauEinmal(instrumentiert,
  '      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }',
  "       if (id === 'st_cyris' && linie.rezept === 'r_nahrung')\n"+
  "         __bk9u.push({art:'start',tick:state.tick,linie:index,eis:r.ein.eis,lohn:r.dauer*rules.world.produktionslohnJeMinute});\n"+
  '      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }');
instrumentiert=ersetzeGenauEinmal(instrumentiert,
  '          for (const ware of ids(r.aus)) { st.lager[ware] = anzahl(st.lager, ware) + r.aus[ware]; state.ledger[ware].produced += r.aus[ware]; }',
  "           if (id === 'st_cyris' && linie.rezept === 'r_nahrung')\n"+
  "             __bk9u.push({art:'fertig',tick:state.tick,linie:index,menge:r.aus.nahrung});\n"+
  '          for (const ware of ids(r.aus)) { st.lager[ware] = anzahl(st.lager, ware) + r.aus[ware]; state.ledger[ware].produced += r.aus[ware]; }');
instrumentiert=ersetzeGenauEinmal(instrumentiert,
  '        state.haushaltNeuLedger.altVerbraucht += altEssen;',
  "        if (id === 'st_cyris' && neuKauf > 0)\n"+
  "          __bk9u.push({art:'verkaufNeu',tick:state.tick,menge:neuKauf,wert:neuKauf*p,preis:p});\n"+
  '        state.haushaltNeuLedger.altVerbraucht += altEssen;');
instrumentiert=ersetzeGenauEinmal(instrumentiert,
  '    const n = Math.min(besitzer.cash, kosten);',
  "    if (s.klasse === 'miner' && s.system === 'cyris' && s.ware === 'eis')\n"+
  "      __bk9u.push({art:'minerBetrieb',tick:state.tick,schiff:id,arbeit,kosten,bezahlt:Math.min(besitzer.cash,kosten)});\n"+
  '    const n = Math.min(besitzer.cash, kosten);');
const {core,base,herkunft}=new Function('const __bk9u=arguments[0];\n'+instrumentiert+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft};')(belege);
const normal=new Function(original+';return {core:m_core_index,base:m_data_rules.RULES};')().core;
const SID='st_cyris', HH='hh_st_cyris';
function regeln(lohn){
  return {...base,schema:9,rulesVersion:15,world:{...base.world,
    produktionslohnJeMinute:lohn,haushaltskaufNeu:true,
    mindeststand:0,fondsObergrenze:1_000_000_000}};
}
function szenario(quelle,seed,rules){
  const s=quelle.createState(seed,rules),st=s.stations[SID];
  st.linien=st.linien.filter(x=>x.rezept==='r_nahrung');
  const alt=st.lager.nahrung;
  st.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
  for(const sh of Object.values(s.ships)){
    if(sh.klasse==='frachter' && sh.auftrag==='handeln')sh.auftrag='halten';
  }
  return s;
}
function pruefen(s,rules){
  const frei=Object.values(s.owners).reduce((z,o)=>z+o.cash,0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((z,e)=>z+e.rest,0);
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned,'Geld samt Reserve');
  assert(core.audit(s).ok,'Core-Geld-/Warenaudit');
  herkunft.pruefe(s);
  const laden=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(laden),core.hash(s),'Save/Load-Hash');
}
function neueSpur(startbestandEis){
  const rohe=[{menge:startbestandEis,preis:null}],wip=new Map(),fertig=[],chargen=[];
  const sums={rohEisMenge:0,rohEisISK:0,kristallISK:0,lohnFertig:0,
    absatzISK:0,absatzMenge:0,rohAltVerbraucht:0,rohGekauftVerbraucht:0,
    minerNominal:0,minerBezahlt:0};
  function eisEntnehmen(n){
    let kostenBekannt=0,alt=0,gekauft=0;
    while(n>0){
      const lot=rohe[0];
      assert(lot && lot.menge>0,'Eis nicht ohne echten vorherigen Zugang verwenden');
      const take=Math.min(n,lot.menge);
      if(lot.preis===null)alt+=take;
      else {gekauft+=take;kostenBekannt+=take*lot.preis;}
      lot.menge-=take;n-=take;if(!lot.menge)rohe.shift();
    }
    sums.rohAltVerbraucht+=alt;sums.rohGekauftVerbraucht+=gekauft;
    return {kostenBekannt,alt,gekauft};
  }
  function buchen(e){
    if(e.art==='rohKauf'){
      if(e.ware==='eis'){
        assert.equal(e.wert,e.menge*e.preis);
        rohe.push({menge:e.menge,preis:e.preis});
        sums.rohEisISK+=e.wert;sums.rohEisMenge+=e.menge;
      }else sums.kristallISK+=e.wert;
    }
    if(e.art==='start'){
      assert(!wip.has(e.linie),'kein zweiter Auftrag auf einer belegten Produktionslinie');
      wip.set(e.linie,{...e,...eisEntnehmen(e.eis)});
    }
    if(e.art==='fertig'){
      const c=wip.get(e.linie);
      assert(c,'Fertigstellung ohne begonnenen Rohstoff-/Lohnbeleg');
      assert.equal(e.menge,1,'eine Nahrungseinheit je Rezept');
      wip.delete(e.linie);
      const batch={id:chargen.length+1,start:c.tick,fertig:e.tick,
        eis:c.eis,altEis:c.alt,eisGekauft:c.gekauft,
        eisKostenBelegt:c.kostenBekannt,lohnISK:c.lohn,
        einstandVollstaendig:c.alt===0,verkaufsISK:0,verkauft:false};
      chargen.push(batch);fertig.push(batch);sums.lohnFertig+=batch.lohnISK;
    }
    if(e.art==='verkaufNeu'){
      assert.equal(e.wert,e.menge*e.preis);
      sums.absatzISK+=e.wert;sums.absatzMenge+=e.menge;
      for(let i=0;i<e.menge;i++){
        const c=fertig.shift();
        assert(c,'bezahlter Absatz ohne nachweisbare fertige Neu-Charge');
        assert(!c.verkauft);
        c.verkaufsISK=e.preis;c.verkauft=true;
      }
    }
    if(e.art==='minerBetrieb'){
      sums.minerNominal+=e.kosten;sums.minerBezahlt+=e.bezahlt;
    }
  }
  function stand(s,tag,rules){
    const st=s.stations[SID],hh=s.stats.haushaltskauf[SID];
    const lagerEis=rohe.reduce((z,x)=>z+x.menge,0);
    assert.equal(lagerEis,st.lager.eis,'jeder Eis-Ein-/Ausgang per FIFO abgeglichen');
    assert.equal(fertig.length,st.lokalNeuNahrung,'Neu-Nahrungslager ist Summe offener Chargen');
    assert.equal(sums.absatzMenge,hh.menge,'nur echte bezahlte Neu-Chargen als Absatz');
    assert.equal(sums.absatzISK,hh.isk,'reale Absatzpreise je Charge');
    assert.equal(sums.lohnFertig,s.stats.konto[HH].erloes,
      'jede fertig bezahlte Produktion mit Haushaltslohnstatistik abgeglichen');
    const rezepte=s.stats.rezepte[SID];
    assert.equal(chargen.length,rezepte,'eine Charge je tatsächlichem Rezept');
    const offen=Array.from(wip.values());
    const rohEisInventarISK=rohe.reduce((z,l)=>z+(l.preis===null?0:l.menge*l.preis),0);
    const rohEisUnbewertet=rohe.reduce((z,l)=>z+(l.preis===null?l.menge:0),0);
    const nahrungInventarISK=fertig.reduce((z,c)=>z+c.lohnISK+c.eisKostenBelegt,0);
    const wipRohISK=offen.reduce((z,c)=>z+c.kostenBekannt,0);
    const lohnReserve=offen.reduce((z,c)=>z+c.lohn,0);
    const gebundenNachweisbar=rohEisInventarISK+nahrungInventarISK+wipRohISK+lohnReserve;
    const bekannteVerkaufskosten=chargen.filter(c=>c.verkauft)
      .reduce((z,c)=>z+c.eisKostenBelegt+c.lohnISK,0);
    const exakteChargen=chargen.filter(c=>c.verkauft&&c.einstandVollstaendig);
    const deckungExakt=exakteChargen.reduce((z,c)=>z+c.verkaufsISK-c.eisKostenBelegt-c.lohnISK,0);
    const bekannteNegativ=chargen.filter(c=>c.verkauft &&
      c.verkaufsISK<c.lohnISK+c.eisKostenBelegt).length;
    const weitere=s.stats.konto[SID].kosten-sums.rohEisISK-sums.kristallISK-sums.lohnFertig;
    assert.equal(weitere,0,'gesamte Cyris-Kasse ohne unsichtbare Ausgaben');
    const startISK=4000;
    assert.equal(s.owners[SID].cash,startISK+sums.absatzISK-
      sums.rohEisISK-sums.kristallISK-sums.lohnFertig,'Cyris-Kassenbruecke');
    const lohnNaechste=rules.economy.rezepte.r_nahrung.dauer*rules.world.produktionslohnJeMinute;
    const ausgabe={tag,seed:s.seed??null,lohnJeMinute:rules.world.produktionslohnJeMinute,
      stationFreiISK:s.owners[SID].cash,haushaltFreiISK:s.owners[HH].cash,
      eisEingekauft:sums.rohEisMenge,eisISK:sums.rohEisISK,
      eisAltVerbraucht:sums.rohAltVerbraucht,eisNeuVerbraucht:sums.rohGekauftVerbraucht,
      eisLager:lagerEis,eisLagerBelegtISK:rohEisInventarISK,eisLagerUnbewertet:rohEisUnbewertet,
      produktion:chargen.length,produktionOffen:offen.length,
      bezahltNahrung:hh.menge,absatzISK:sums.absatzISK,fehlbedarf:hh.fehlend,
      neuNahrungLager:fertig.length,neuLagerEinstandMindestensISK:nahrungInventarISK,
      wipMaterialISK:wipRohISK,lohnReserviertISK:lohnReserve,
      gebundenMindestensISK:gebundenNachweisbar,
      verkaufteKostenMindestensISK:bekannteVerkaufskosten,
      verkaufteChargenMitKomplettemEisbeleg:exakteChargen.length,
      deckungExaktISK:deckungExakt,negativerDeckungsbeitragSchonMitUntergrenze:bekannteNegativ,
      minerStundenKostenSollISK:sums.minerNominal,minerStundenTatsaechlichBezahltISK:sums.minerBezahlt,
      minerKostenUnbezahltISK:sums.minerNominal-sums.minerBezahlt,
      kristallISK:sums.kristallISK,lohnBezahltISK:sums.lohnFertig,
      benoetigteLohnreserveNaechsteChargeISK:lohnNaechste,
      naechsterLohnAusFreikasseFinanzierbar:s.owners[SID].cash>=lohnNaechste};
    assert(ausgabe.minerKostenUnbezahltISK>=0);
    return ausgabe;
  }
  return {buchen,stand,chargen};
}
function lauf(seed,lohn,tage,log=true){
  const rules=regeln(lohn),s=szenario(core,seed,rules),normalS=szenario(normal,seed,rules);
  const anfang=belege.length;
  const spur=neueSpur(s.stations[SID].lager.eis),tageStand=[];
  // Hook wirkt nie auf Save/State und wird auch unter Regel15 kontrolliert.
  for(let minute=0;minute<tage*1440;minute++){
    core.step(s,rules);
    const neu=belege.slice(anfang+lauf.versetzt,belege.length);
    for(const e of neu)spur.buchen(e);
    lauf.versetzt+=neu.length;
    if(s.tick%60===0){pruefen(s,rules);}
    if(s.tick%1440===0){
      const tag=s.tick/1440,st=spur.stand(s,tag,rules);
      tageStand.push(st);
      if(log)console.log('B-K9u Chargen',JSON.stringify({seed,...st}));
    }
    if(minute<120){normal.step(normalS,rules);
      assert.equal(core.hash(s),normal.hash(normalS),'Hook ohne Zustandswirkung R15, Tick '+minute);}
  }
  const result={seed,lohn,tage,tageStand,chargen:spur.chargen,
    hash:core.hash(s),save:core.save(s)};
  lauf.versetzt=0;
  return result;
}
lauf.versetzt=0;

test('B-K9u: zwei 4-Tage-Ketten, echte FIFO-Eiszugänge, Lohn, Chargen, Konsum und Kapital',()=>{
  for(const seed of [42,7]){
    const v=lauf(seed,4,4);
    assert.equal(v.tageStand.length,4);
    const t1=v.tageStand[0];
    assert(t1.eisISK>0 && t1.absatzISK>0);
    assert(t1.eisAltVerbraucht>=0);
    assert(t1.gebundenMindestensISK>=0);
    assert.equal(t1.stationFreiISK,112,'B-K9t Tag1-Kassenidentitaet');
    assert(v.chargen.some(c=>c.verkauft));
    assert(v.chargen.some(c=>!c.verkauft),'unverkaufte Fertigware bleibt als Kapitalbindung');
  }
});
test('B-K9u: alternative Testloehne ohne Mechanikwechsel, 2 Seeds ×2 Tage',()=>{
  for(const lohn of [2,6])for(const seed of [42,7]){
    const v=lauf(seed,lohn,2);
    assert(v.tageStand[0].eisISK>0);
    assert(v.tageStand[0].produktion>0);
  }
});
test('B-K9u: 48h-Hash, komplette Chargen-/Belegfolge und Replay reproduzierbar',()=>{
  const a=lauf(42,4,2,false),b=lauf(42,4,2,false);
  assert.deepEqual(a,b);
});
