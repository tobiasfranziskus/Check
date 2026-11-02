// B-K9s: mehrtägige Kassen- und Versorgungsdiagnose OHNE neue Produktregel.
// Erst Einzelstandort mit stillgelegten NPC-Händlern, danach unberührte
// Händler-Disposition; beide verwenden denselben Original-Core R15/Schema9.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const quelle=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,baseline,herkunft}=new Function(quelle+
  ';return {core:m_core_index,baseline:m_data_rules.RULES,herkunft:m_core_herkunft};')();
assert.equal(baseline.rulesVersion,14);
const SID='st_cyris', HH='hh_'+SID;
const seeds=[42,7], wageCandidates=[2,4,6];
function regeln(lohn){
  return {...baseline,schema:9,rulesVersion:15,world:{
    ...baseline.world,produktionslohnJeMinute:lohn,haushaltskaufNeu:true,
    // NUR explizit bestehende Stationsauffuellung unterdruecken.
    mindeststand:0,fondsObergrenze:1_000_000_000,
  }};
}
function einrichten(s,isolate){
  if(!isolate)return;
  const st=s.stations[SID];
  st.linien=st.linien.filter(l=>l.rezept==='r_nahrung');
  const original=st.lager.nahrung;
  st.lager.nahrung=0;s.ledger.nahrung.initial-=original;
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
}
function kassenPruefen(s){
  const frei=Object.values(s.owners).reduce((sum,o)=>{
    assert(Number.isSafeInteger(o.cash)&&o.cash>=0);return sum+o.cash;
  },0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((sum,e)=>sum+e.rest,0);
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned,
    'unabhaengiger Zahlungs-/Reserveaudit');
  assert(core.audit(s).ok,'Core-Geld-/Warenaudit '+JSON.stringify(core.audit(s)));
  herkunft.pruefe(s);
}
function moment(s,tag,rules){
  const st=s.stations[SID],h=s.stats.haushaltskauf[SID];
  const lohn=s.stats.konto[HH].erloes,lohnRaus=s.stats.konto[HH].kosten;
  const stationKosten=s.stats.konto[SID].kosten;
  assert.equal(lohnRaus,h.isk,'bezahlte Lebensmittel sind die einzige Ausgabe dieses Haushalts');
  assert.equal(lohn-h.isk,s.owners[HH].cash,'kein verdecktes Haushaltsgeld');
  assert.equal(stationKosten>=lohn,true,'Stationsbetriebskosten enthalten den bezahlten Lohn');
  assert.equal(st.lokalNeuNahrung<=st.lager.nahrung,true);
  const v=Object.values(s.vertraege.eintraege);
  return {
    tag,
    eisPreis:core.preis(s,SID,'eis',rules),
    nahrungPreis:core.preis(s,SID,'nahrung',rules),
    rezeptVollkosten:2*core.preis(s,SID,'eis',rules)
      +rules.economy.rezepte.r_nahrung.dauer*rules.world.produktionslohnJeMinute,
    stationISK:s.owners[SID].cash,haushaltISK:s.owners[HH].cash,
    lohnISK:lohn,haushaltKaufISK:h.isk,gezahlteNahrung:h.menge,
    bedarfFehlt:h.fehlend,alteNahrungKostenlos:h.alt,
    neueNahrungLager:st.lokalNeuNahrung,nahrungLager:st.lager.nahrung,
    eisLager:st.lager.eis,
    rezepte:s.stats.rezepte[SID],
    stationAndereAusgabenISK:stationKosten-lohn,
    stationEinnahmenISK:s.stats.konto[SID].erloes,
    minerISK:s.owners.npc3.cash,npc1ISK:s.owners.npc1.cash,npc2ISK:s.owners.npc2.cash,
    frachterNPC:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner)).length,
    zuschussISK:s.stats.zuschuss,
    offenVertraege:v.filter(x=>x.status==='offen').length,
    eintraege:v.length,
    archivAnzahl:s.vertraege.archiv?.anzahl||0,
  };
}
function rechnen(seed,lohn,isolate,tage){
  const rules=regeln(lohn),s=core.createState(seed,rules);
  einrichten(s,isolate);
  const snapshots=[moment(s,0,rules)];
  let auditStunden=0;
  for(let i=0;i<tage*24*60;i++){
    core.step(s,rules);
    if(s.tick%60===0){kassenPruefen(s);auditStunden++;}
    if(s.tick%1440===0){
      const neu=core.load(core.save(s),undefined,rules);
      assert.equal(core.hash(neu),core.hash(s),'taeglicher Save/Load-Hash');
      kassenPruefen(neu);
      snapshots.push(moment(s,s.tick/1440,rules));
    }
  }
  assert.equal(auditStunden,tage*24);
  return snapshots;
}
function delta(a,b,key){return b[key]-a[key];}
function tageAusgeben(art,seed,lohn,werte){
  for(let i=1;i<werte.length;i++){
    const x=werte[i-1],y=werte[i];
    console.log('B-K9s tag',JSON.stringify({
      art,seed,lohn,tag:y.tag,stationISK:y.stationISK,
      hhISK:y.haushaltISK,
      lohnISK:delta(x,y,'lohnISK'),
      kaufausgabenISK:delta(x,y,'haushaltKaufISK'),
      bezahlteNahrung:delta(x,y,'gezahlteNahrung'),
      fehlbedarf:delta(x,y,'bedarfFehlt'),
      altGratis:delta(x,y,'alteNahrungKostenlos'),
      neueNahrungLager:y.neueNahrungLager,
      eisLager:y.eisLager,rezepte:delta(x,y,'rezepte'),
      ausgabenOhneLohn:delta(x,y,'stationAndereAusgabenISK'),
      stationEinnahmen:delta(x,y,'stationEinnahmenISK'),
      minerISK:y.minerISK,haendlerISK:y.npc1ISK+y.npc2ISK,
      frachterNPC:y.frachterNPC,zuschussISK:y.zuschussISK,
      offen:y.offenVertraege,archiv:y.archivAnzahl,
      eisPreis:y.eisPreis,nahrungPreis:y.nahrungPreis,
      rezeptVollkosten:y.rezeptVollkosten,
      richtwertMarge:y.nahrungPreis-y.rezeptVollkosten,
    }));
  }
}

test('B-K9s: 2 Seeds ×3 Testloehne ×7 Tage – isolierte Cyris-Kette ohne Fondsauffuellung',()=>{
  for(const lohn of wageCandidates)for(const seed of seeds){
    const alle=rechnen(seed,lohn,true,7);
    assert.equal(alle.length,8);
    for(let i=1;i<alle.length;i++){
      assert(alle[i].gezahlteNahrung>=alle[i-1].gezahlteNahrung);
      assert(alle[i].bedarfFehlt>=alle[i-1].bedarfFehlt);
      assert(alle[i].lohnISK>=alle[i-1].lohnISK);
      assert(alle[i].stationISK>=0);
      assert(alle[i].haushaltISK>=0);
      assert(alle[i].offenVertraege>=0);
    }
    // Nachweis des bindenden dritten-Tages-Engpasses:
    // Entweder ist das Nahrungsziel-Lager voll, oder die Station kann
    // einen weiteren sechsminuetigen Produktionsauftrag nicht vorfinanzieren.
    const d3=alle[3],kosten=lohn*baseline.economy.rezepte.r_nahrung.dauer;
    assert.equal(d3.rezepte,alle[2].rezepte,'keine weiteren bezahlten Cyris-Rezepte an Tag 3');
    assert.equal(d3.gezahlteNahrung,alle[2].gezahlteNahrung,'kein Nachfrage-Rueckfluss an Tag 3');
    if(lohn===2){
      const obergrenze=core.obergrenze(core.createState(seed,regeln(lohn)),regeln(lohn),SID,'nahrung');
      assert.equal(d3.nahrungLager,obergrenze,'fehlende Nachfrage blockiert durch volles Lager');
      assert(d3.stationISK>=kosten,'es liegt kein reiner Lohnkassenmangel vor');
    }else{
      assert(d3.stationISK<kosten,'die Station kann ihre eigene naechste Produktionsschicht nicht mehr bezahlen');
      assert(d3.neueNahrungLager>0,'Waren bleiben trotz stationaerem Liquiditaetsausfall verfuegbar');
    }
    tageAusgeben('isoliert',seed,lohn,alle);
  }
});

test('B-K9s: reale NPC-Dispo aktiv; 2 Seeds × 5 Tage bei 4-ISK-Testlohn, ohne Auffuellung',()=>{
  for(const seed of seeds){
    const alle=rechnen(seed,4,false,5);
    assert.equal(alle.length,6);
    assert(alle.at(-1).stationISK>=0);
    assert(alle.at(-1).haushaltISK>=0);
    tageAusgeben('aktiv',seed,4,alle);
  }
});

test('B-K9s: kleiner unabhängiger 48h-Hash-Replayvergleich mit offenen Verträgen',()=>{
  const a=rechnen(42,2,true,2),b=rechnen(42,2,true,2);
  assert.deepEqual(a,b,'alle 48h-Perioden reproduzierbar');
  assert.equal(a.length,3);
});
