// B-K10i [ANALYSE/DRAFT]: Zahlungsempfaenger fuer tatsaechlich
// erbrachte Fabrik-/Frachter-/Miner-/Jaegerarbeit in aktiven Originalwelten.
// Kein Produkt-, Emissions-, Lohn-, Preis-, Fonds- oder Save-Regelwechsel.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='));
const EINZIG={
  bezahlung:'state.owners[e.empfaenger].cash += betrag;',
  betrieb:'if (w.senkeBesitzer.includes(s.owner)) state.burned += n;',
  fondsSt:'f.cash -= n; o[id].cash += n;',
  fondsMehr:'o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;',
  abgabe:'o[id].cash -= n; o[ziel].cash += n;',
};
function genauEinmal(alt,neu) {
  assert.equal(js.split(alt).length,2,'genau ein Instrumentierungsanker: '+alt);
  js=js.replace(alt,neu);
}
genauEinmal(EINZIG.bezahlung,
  "__bk10i_events.push({art:e.produktion?'produktion':e.fahrt?'flug':'sonstVertrag',tick:state.tick,zahlender:e.zahlender,empfaenger:e.empfaenger,betrag,schiff:e.fahrt?.schiff||null}); "+EINZIG.bezahlung);
genauEinmal(EINZIG.betrieb,
  "__bk10i_events.push({art:'betrieb',tick:state.tick,zahlender:s.owner,empfaenger:w.senkeBesitzer.includes(s.owner)?'SENKE':fondsIn(rules,system),betrag:n,klasse:s.klasse,schiff:s.id}); "+EINZIG.betrieb);
genauEinmal(EINZIG.fondsSt,
  "__bk10i_events.push({art:'fondsAnStation',tick:state.tick,zahlender:f.id,empfaenger:id,betrag:n}); "+EINZIG.fondsSt);
genauEinmal(EINZIG.fondsMehr,
  "__bk10i_events.push({art:'fondsUeberschuss',tick:state.tick,zahlender:f.id,empfaenger:arm,betrag:f.cash-w.fondsObergrenze}); "+EINZIG.fondsMehr);
genauEinmal(EINZIG.abgabe,
  "__bk10i_events.push({art:'npcAbgabe',tick:state.tick,zahlender:id,empfaenger:ziel,betrag:n}); "+EINZIG.abgabe);
const events=[];
const {core,base}=new Function('__bk10i_events',js+
  ';return {core:m_core_index,base:m_data_rules.RULES};')(events);
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
const seeds=[42,7];
const sum=(xs)=>xs.reduce((a,b)=>a+b,0);
function bilanz(s){
  const frei=sum(Object.values(s.owners).map(o=>o.cash));
  const reserviert=sum(Object.values(s.vertraege.eintraege).map(e=>e.rest));
  assert.equal(frei+reserviert,s.initialSupply+s.minted-s.burned,'Geldbilanz inklusive Vertragsreserven');
  assert(core.audit(s).ok,'unabhaengiger Core-Warenaudit');
}
function geldgruppen(s){
  let haushalt=0,station=0,fonds=0,konzern=0,sonstige=0;
  for(const o of Object.values(s.owners)){
    if(o.kind==='household')haushalt+=o.cash;
    else if(o.kind==='station')station+=o.cash;
    else if(o.kind==='fund')fonds+=o.cash;
    else if(['trader','miner','player'].includes(o.kind))konzern+=o.cash;
    else sonstige+=o.cash;
  }
  const gebunden=sum(Object.values(s.vertraege.eintraege).map(e=>e.rest));
  return {haushalt,station,fonds,konzern,sonstige,gebunden};
}
function analyse(seed,stunden=72,ausgabe=true){
  events.length=0;
  // Voll aktiver Originalstart: alle NPC-Haendler, Miner, Piraten, Schutzjaeger,
  // Fonds-/Mindeststandregeln und Stationsstartlager bleiben unveraendert.
  const s=core.createState(seed,rules);
  const init=geldgruppen(s);
  const proTag=[];
  for(let t=0;t<stunden*60;t++){
    core.step(s,rules);
    if(s.tick%60===0){
      bilanz(s);
      if(s.tick%1440===0){
        const load=core.load(core.save(s),undefined,rules);
        assert.equal(core.hash(load),core.hash(s),'Save/Load/Hash Tag '+s.tick/1440);
        bilanz(load);
      }
      if(s.tick%1440===0||s.tick===stunden*60){
        const orion=s.stats.haushaltskauf.st_orion;
        proTag.push({tick:s.tick,gruppen:geldgruppen(s),
          stationOrion:s.owners.st_orion.cash,haushaltOrion:s.owners.hh_st_orion.cash,
          orionLohn:s.stats.konto.hh_st_orion.erloes,
          orionNahrungBezahlt:orion.isk,orionNahrungStueck:orion.menge,
          orionMangelEinheiten:orion.fehlend,
          orionNahrungNeu:s.stations.st_orion.lokalNeuNahrung,
          minted:s.minted,burned:s.burned});
      }
    }
  }
  const n={produktion:0,flug:0,betriebMiner:0,betriebFrachter:0,
    betriebJaeger:0,betriebAndere:0,verbranntBetrieb:0,
    fondsAnStation:0,fondsUeberschuss:0,npcAbgabe:0};
  const empfang={haushalt:0,fonds:0,station:0,senke:0,sonstige:0};
  for(const e of events){
    assert(Number.isSafeInteger(e.betrag)&&e.betrag>0);
    if(e.art==='flug'||e.art==='produktion'){
      n[e.art]+=e.betrag;
      if(e.art==='flug')assert.match(e.empfaenger,/^fonds_/,'Fluglohn geht an Systemfonds');
      if(e.art==='produktion')assert.match(e.empfaenger,/^hh_st_/,'Fabriklohn geht zum Stationshaushalt');
    }else if(e.art==='betrieb'){
      const k='betrieb'+(e.klasse==='miner'?'Miner':e.klasse==='frachter'?'Frachter':e.klasse==='jaeger'?'Jaeger':'Andere');
      n[k]+=e.betrag;
      if(e.empfaenger==='SENKE')n.verbranntBetrieb+=e.betrag;
      else assert.match(e.empfaenger,/^fonds_/,'sonstige Arbeitskosten an Fonds');
    }else if(e.art==='fondsAnStation'||e.art==='fondsUeberschuss'||e.art==='npcAbgabe')
      n[e.art]+=e.betrag;
    if(e.art==='betrieb'||e.art==='flug'||e.art==='produktion'){
      const ziel=e.empfaenger==='SENKE'?'senke':
        e.empfaenger.startsWith('hh_')?'haushalt':
        e.empfaenger.startsWith('fonds_')?'fonds':
        e.empfaenger.startsWith('st_')?'station':'sonstige';
      empfang[ziel]+=e.betrag;
    }
  }
  assert.equal(empfang.haushalt,n.produktion,
    'nur die Produktionsvertraege ueberweisen Arbeitseinkommen an HH');
  assert.equal(empfang.fonds,n.flug+n.betriebMiner+n.betriebFrachter+
    n.betriebJaeger+n.betriebAndere-n.verbranntBetrieb);
  assert.equal(empfang.senke,n.verbranntBetrieb);
  assert(n.produktion>0,'echte lokale Arbeitsloehne wurden ausgezahlt');
  assert(n.flug>0,'echte bezahlte NPC-Frachterfahrten wurden erfasst');
  assert(n.betriebMiner>0,'Miner-Arbeitskosten wurden erfasst');
  assert(n.betriebJaeger>0,'Jaeger-Arbeitskosten wurden erfasst');
  assert(n.fondsAnStation>0,'Fondsfinanzierung von Stationen wurde erfasst');
  const haushaltLohnSum=sum(Object.entries(s.stats.konto)
    .filter(([id])=>id.startsWith('hh_st_')).map(([,v])=>v.erloes));
  assert.equal(haushaltLohnSum,n.produktion);
  const stationKaufkraft=Object.keys(s.stations).sort().map(id=>{
    const h=s.owners['hh_'+id],hs=s.stats.haushaltskauf[id],
      st=s.stations[id],p=core.preis(s,id,'nahrung',rules);
    const stationKaufmaxISK=s.owners[id].cash,
      stationAnkaufMaxStueck=core.aufnehmbar(s,rules,id,'nahrung'),
      haushaltKaufbarStueck=Math.floor(h.cash/p);
    assert(stationAnkaufMaxStueck<=Math.floor(stationKaufmaxISK/p),
      'Groessere Wareneinkaeufe sind nicht ohne echte Stationskasse moeglich');
    assert.equal(h.cash,s.stats.konto['hh_'+id].erloes-hs.isk,
      'stationaerer Haushalt darf nur echte lokale Loehne ausgeben: '+id);
    return {station:id,stationISK:s.owners[id].cash,
      haushaltISK:h.cash,
      lohnISK:s.stats.konto['hh_'+id].erloes,
      nahrungBezahltISK:hs.isk,nahrungBezahltMenge:hs.menge,
      mangelEinheiten:hs.fehlend,neuNahrung:st.lokalNeuNahrung,
      nahrungPreisISK:p,
      haushaltKaufbarStueck,stationAnkaufMaxStueck,
      nahrungLagerGesamt:st.lager.nahrung,
      haushaltKannEinStueckKaufen:h.cash>=p,
      stationKannNaechstenLohnVorfinanzieren:st.linien.some(l=>
        s.owners[id].cash>=rules.economy.rezepte[l.rezept].dauer*
        rules.world.produktionslohnJeMinute)};
  });
  assert.equal(sum(stationKaufkraft.map(x=>x.haushaltISK)),geldgruppen(s).haushalt);
  assert.equal(sum(stationKaufkraft.map(x=>x.stationISK)),geldgruppen(s).station);
  const gesamtGeschaeftskosten=sum([
    n.produktion,n.flug,n.betriebMiner,n.betriebFrachter,
    n.betriebJaeger,n.betriebAndere]);
  const summary={seed,stunden,start:init,ende:geldgruppen(s),geschaeftskosten:gesamtGeschaeftskosten,
    zahlungen:n,arbeitsEntgeltZiel:empfang,
    bezahlterHaushaltsNahrungsverbrauchISK:
      sum(Object.values(s.stats.haushaltskauf).map(x=>x.isk)),
    bezahltNeueNahrungEinheiten:
      sum(Object.values(s.stats.haushaltskauf).map(x=>x.menge)),
    mangelfehlEinheiten:
      sum(Object.values(s.stats.haushaltskauf).map(x=>x.fehlend)),
    tageswerte:proTag,stationKaufkraft,
    cashSupply:s.initialSupply+s.minted-s.burned,hash:core.hash(s)};
  if(ausgabe)console.log('B-K10i Originalwelt Arbeitsempfaenger',JSON.stringify(summary));
  return summary;
}
test('B-K10i: echte aktive Welten, volle Zahlungsziele Seeds42/7 je 72h',()=>{
  for(const seed of seeds){
    const x=analyse(seed);
    assert(x.arbeitsEntgeltZiel.fonds>x.arbeitsEntgeltZiel.haushalt,
      'erwarteter Engpass: mehr Schiffsarbeit am Fonds als Fabrikloehne bei Haushalten');
    assert(x.ende.fonds>=0);
    const a=x.stationKaufkraft.find(v=>v.station==='st_aldera');
    const o=x.stationKaufkraft.find(v=>v.station==='st_orion');
    assert(a.haushaltKaufbarStueck>a.stationAnkaufMaxStueck,
      'Aldera hat effektive Verbraucher-ISK, aber geringeres Zwischenhandelskapital');
    assert.equal(o.haushaltKaufbarStueck,0,
      'Orion-Haushalt kann trotz vorhandener Neuware keine Einheit bezahlen');
  }
});
test('B-K10i: Seed42 24h Replay inklusive Geld-/Waren-/Vertrags-/Saveaudits',()=>{
  assert.deepEqual(analyse(42,24,false),analyse(42,24,false));
});
