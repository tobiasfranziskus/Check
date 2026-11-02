// B-K10g – gleiche Welt, zweimaliger 24er-Lieferzyklus: echte Quellenpreise, Warenkauf, Zielerlös,
// Flugvertragskosten beider Richtungen und späterer bezahlter Endverbrauch.
// R15/Schema9-Draft; kein Eingriff in index.html, Marktpreise, Löhne oder Emission.
// Die isolierten Fälle entfernen nur zwei Startbestände mit Warenledger-Gegenbuchung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function einmal(text,alt,neu){
  assert.equal(text.split(alt).length,2,'eindeutiger unveraenderter Instrumentierungsanker');
  return text.replace(alt,neu);
}
let js=original;
js=einmal(js,"  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n"+
  "  __bk10f.push({art:'handel',tick:state.tick,schiff:schiff.id,station,ware,menge,kauf,wert,fee});");
const flug="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
js=einmal(js,flug,"    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
  "    __bk10f.push({art:'flug',tick:state.tick,schiff:s.id,kosten});\n"+
  "  }\n  if (s.phase === 'dock') {");
const journal=[];
const {core,base,handel,herkunft,route}=new Function('const __bk10f=arguments[0];\n'+js+
  ';return {core:m_core_index,base:m_data_rules.RULES,handel:m_core_handel,'+
  'herkunft:m_core_herkunft,route:m_core_route.route};')(journal);
assert.equal(base.schema,8); assert.equal(base.rulesVersion,14);

const Q='st_cyris',Z='st_orion',SEEDS=[42,7],MENGEN=[1,4,8,16,24,32,35];
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true,
  mindeststand:0,fondsObergrenze:1_000_000_000}};
function sum(a){return a.reduce((v,x)=>v+x,0);}
function freieUndReserve(s,id){
  return s.owners[id].cash+sum(Object.values(s.vertraege.eintraege)
    .filter(v=>v.status==='offen'&&v.zahlender===id).map(v=>v.rest));
}
function audit(s){
  const frei=sum(Object.values(s.owners).map(x=>x.cash));
  const gebunden=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned,'unabhaengiger ISK-Audit');
  assert(core.audit(s).ok,'Original-Core-Audit');
  herkunft.pruefe(s);
  const transit=sum(Object.values(s.ships).map(x=>x.neuLadungNahrung||0));
  const lokal=sum(Object.values(s.stations).map(x=>x.lokalNeuNahrung||0));
  assert.equal(transit,s.haushaltNeuLedger.transit);
  assert.equal(lokal+transit+s.haushaltNeuLedger.ausgelagert+
    s.haushaltNeuLedger.konsumiert,s.haushaltNeuLedger.produziert);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
}
function tick(s,n=1){
  for(let i=0;i<n;i++){
    core.step(s,rules);
    if(s.tick%60===0)audit(s);
  }
}
function befehl(s,schiff,type,extra={}){
  const ann=core.submit(s,{type,owner:schiff.owner,schiff:schiff.id,...extra},rules);
  if(!ann.ok)return {ok:false,grund:'submit: '+JSON.stringify(ann)};
  const res=core.step(s,rules);
  assert.equal(res.length,1,'genau ein Benutzerbefehl');
  audit(s);
  return res[0].ok?{ok:true}:{ok:false,grund:'core: '+JSON.stringify(res[0])};
}
function ankunft(s,schiff){
  if(schiff.phase!=='reise')return false;
  const lim=schiff.ankunft+3;
  while(schiff.phase==='reise'&&s.tick<=lim)tick(s);
  audit(s);
  return schiff.phase==='dock';
}
function bisVertragsabschluss(s,schiff){
  for(let i=0;i<70&&schiff.vertrag;i++)tick(s);
  return !schiff.vertrag;
}
function starte(seed){
  const s=core.createState(seed,rules);
  for(const id of [Q,Z]){
    const st=s.stations[id],alt=st.lager.nahrung;
    assert.equal(st.lokalNeuNahrung||0,0);
    st.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
  }
  s.stations[Q].linien=s.stations[Q].linien.filter(x=>x.rezept==='r_nahrung');
  for(const schiff of Object.values(s.ships))
    if(schiff.klasse==='frachter'&&schiff.auftrag==='handeln')schiff.auftrag='halten';
  const schiff=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter'
    && x.system==='cyris'&&x.phase==='dock');
  assert(schiff,'existierender NPC1-Frachter');
  audit(s);return {s,schiff};
}
function versuch(seed,menge,ausgabe=true){
  const {s,schiff}=starte(seed),anfang=journal.length,kapazitaet=rules.economy.cargo;
  const routeHin=route(rules.world,'cyris','orion');
  const routeRueck=route(rules.world,'orion','cyris');
  const zielLeerPreis=core.preis(s,Z,'nahrung',rules);
  const anfangCash=freieUndReserve(s,'npc1');
  const hVor=s.stats.haushaltskauf[Z].menge;
  const r={seed,menge,kapazitaet,routeHinMin:routeHin.zeit,
    routeRueckMin:routeRueck.zeit,zielPreisLeer:zielLeerPreis,
    startHaendlerISK:anfangCash,status:'offen'};
  function ende(status,grund){
    r.status=status;if(grund)r.grund=grund;
    const belege=journal.slice(anfang).filter(e=>e.schiff===schiff.id);
    const kauf=belege.filter(e=>e.art==='handel'&&e.kauf&&e.station===Q&&e.ware==='nahrung');
    const absatz=belege.filter(e=>e.art==='handel'&&!e.kauf&&e.station===Z&&e.ware==='nahrung');
    const sonstVerkauf=belege.filter(e=>e.art==='handel'&&!e.kauf&&e.station!==Z);
    const bewegung=belege.filter(e=>e.art==='flug');
    r.kaufMenge=sum(kauf.map(e=>e.menge));
    r.kaufISK=sum(kauf.map(e=>e.wert));
    r.zielVerkaufMenge=sum(absatz.map(e=>e.menge));
    r.zielVerkaufISK=sum(absatz.map(e=>e.wert));
    r.zielVerkaufPreisProStueck=r.zielVerkaufMenge?r.zielVerkaufISK/r.zielVerkaufMenge:null;
    r.andereVerkaeufeISK=sum(sonstVerkauf.map(e=>e.wert));
    r.handelsgebuehrenISK=sum(belege.filter(e=>e.art==='handel').map(e=>e.fee));
    r.flugGezahltISK=sum(bewegung.map(e=>e.kosten));
    r.decksbeitragNachBezahltemFlugISK=r.zielVerkaufISK-r.kaufISK-
      r.handelsgebuehrenISK-r.flugGezahltISK;
    r.realisierterHaendlerCashEnde=freieUndReserve(s,'npc1');
    r.haendlerCashDelta=r.realisierterHaendlerCashEnde-anfangCash;
    r.restFracht=schiff.ladung.nahrung||0;
    r.zielNeuRest=s.stations[Z].lokalNeuNahrung||0;
    r.haushaltsMengeNeu=s.stats.haushaltskauf[Z].menge-hVor;
    r.haushaltsISKNeu=s.stats.haushaltskauf[Z].isk;
    r.zielHaushaltCash=s.owners['hh_'+Z].cash;
    r.minted=s.minted;r.burned=s.burned;r.hash=core.hash(s);
    audit(s);
    if(ausgabe)console.log('B-K10f realer Mengenbeleg',JSON.stringify(r));
    return r;
  }
  if(menge>kapazitaet)return ende('geblockt','Schiffskapazitaet');
  const mind=handel.reserve(rules,Q,'nahrung');
  while(s.tick<1440 && !(s.stations[Q].lokalNeuNahrung>=mind+menge &&
    handel.verkaufbar(s,rules,Q,'nahrung')>=menge))tick(s);
  if(s.stations[Q].lokalNeuNahrung<mind+menge ||
      handel.verkaufbar(s,rules,Q,'nahrung')<menge)
    return ende('geblockt','Quellproduktion oder reale verkaufbare Markttiefe');
  r.quellPreisVorKauf=core.preis(s,Q,'nahrung',rules);
  r.zielPreisVorFahrt=core.preis(s,Z,'nahrung',rules);
  r.quelleNeuVorKauf=s.stations[Q].lokalNeuNahrung;
  const kauf=befehl(s,schiff,'shipTrade',{ware:'nahrung',menge,kauf:true});
  if(!kauf.ok)return ende('geblockt','Einkauf '+kauf.grund);
  r.preisQuelleNachKauf=core.preis(s,Q,'nahrung',rules);
  r.haendlerISKNachKauf=freieUndReserve(s,'npc1');
  const flug=befehl(s,schiff,'shipMove',{ziel:Z});
  if(!flug.ok)return ende('geblockt','Hinflug '+flug.grund);
  if(!ankunft(s,schiff))return ende('geblockt','Hinflug nicht angekommen');
  r.zielPreisNachEntladung=core.preis(s,Z,'nahrung',rules);
  r.haendlerISKNachHinflug=freieUndReserve(s,'npc1');
  r.restNachEntladung=schiff.ladung.nahrung||0;
  r.zielStationCashNachEntladung=s.owners[Z].cash;
  if(!bisVertragsabschluss(s,schiff))return ende('geblockt','Hinvertrag noch offen');
  const rueck=befehl(s,schiff,'shipMove',{ziel:Q});
  if(!rueck.ok)return ende('geblockt','Rueckflug '+rueck.grund);
  if(!ankunft(s,schiff))return ende('geblockt','Rueckflug nicht angekommen');
  if(!bisVertragsabschluss(s,schiff))return ende('geblockt','Rueckvertrag noch offen');
  r.volleHinRueckrunde=true;
  // Nachfrage nicht durch rein rechnerischen Stationskauf ersetzen:
  // echte stündliche Original-Haushaltszahlungen über 12h beobachten.
  tick(s,720);
  r.zielPreisNach12h=core.preis(s,Z,'nahrung',rules);
  return ende('abgeschlossen');
}

function gegenstand(s){
  const st=s.stations[Z],q=s.stations[Q],h=s.stats.haushaltskauf[Z];
  return {tick:s.tick,tag:Number((s.tick/1440).toFixed(3)),
    haendlerFrei:s.owners.npc1.cash,haendlerInklReserve:freieUndReserve(s,'npc1'),
    zielStationFrei:s.owners[Z].cash,zielStationInklReserve:freieUndReserve(s,Z),
    zielHaushaltISK:s.owners['hh_'+Z].cash,haushaltKaufMenge:h.menge,
    haushaltKaufISK:h.isk,haushaltFehlmenge:h.fehlend,
    quelleBestand:q.lager.nahrung,quelleNeu:q.lokalNeuNahrung,
    quelleVerkaufbar:handel.verkaufbar(s,rules,Q,'nahrung'),
    quellPreis:core.preis(s,Q,'nahrung',rules),
    zielBestand:st.lager.nahrung,zielNeu:st.lokalNeuNahrung,
    zielPreis:core.preis(s,Z,'nahrung',rules),
    minted:s.minted,burned:s.burned};
}
function warenfahrt(s,sh,n) {
  const start=journal.length, vor=gegenstand(s);
  const out={start:vor,menge:n,status:'offen'};
  function abschliessen(status,reason){
    out.status=status;if(reason)out.grund=reason;
    const ev=journal.slice(start).filter(e=>e.schiff===sh.id);
    const kaufe=ev.filter(e=>e.art==='handel'&&e.kauf&&e.station===Q&&e.ware==='nahrung');
    const ziel=ev.filter(e=>e.art==='handel'&&!e.kauf&&e.station===Z&&e.ware==='nahrung');
    const rueck=ev.filter(e=>e.art==='handel'&&!e.kauf&&e.station===Q&&e.ware==='nahrung');
    out.erstKaufISK=sum(kaufe.map(e=>e.wert));
    out.verkaufZielISK=sum(ziel.map(e=>e.wert));
    out.verkaufZielMenge=sum(ziel.map(e=>e.menge));
    out.rueckverkaufISK=sum(rueck.map(e=>e.wert));
    out.rueckverkaufMenge=sum(rueck.map(e=>e.menge));
    out.gebuehrISK=sum(ev.filter(e=>e.art==='handel').map(e=>e.fee));
    out.flugGezahltISK=sum(ev.filter(e=>e.art==='flug').map(e=>e.kosten));
    out.nettoAuftragsbelegISK=out.verkaufZielISK+out.rueckverkaufISK-
      out.erstKaufISK-out.gebuehrISK-out.flugGezahltISK;
    out.end=gegenstand(s);
    out.npcKassenbewegungISK=out.end.haendlerInklReserve-vor.haendlerInklReserve;
    out.restLadung=sh.ladung.nahrung||0;
    audit(s);return out;
  }
  if(sh.phase!=='dock'||sh.system!=='cyris')return abschliessen('blocked','Schiff nicht an Quelle');
  if(handel.verkaufbar(s,rules,Q,'nahrung')<n)return abschliessen('blocked','Kein voll handelbarer Quellvorrat');
  const kauf=befehl(s,sh,'shipTrade',{ware:'nahrung',menge:n,kauf:true});
  if(!kauf.ok)return abschliessen('blocked','Einkauf '+kauf.grund);
  const hin=befehl(s,sh,'shipMove',{ziel:Z});
  if(!hin.ok)return abschliessen('blocked','Hinflug '+hin.grund);
  if(!ankunft(s,sh))return abschliessen('blocked','Hinflug nicht abgeschlossen');
  out.nachEntladung=gegenstand(s);
  out.restLadungZiel=sh.ladung.nahrung||0;
  if(!bisVertragsabschluss(s,sh))return abschliessen('blocked','Hinflugvertrag nicht beendet');
  const zurueck=befehl(s,sh,'shipMove',{ziel:Q});
  if(!zurueck.ok)return abschliessen('blocked','Rückflug '+zurueck.grund);
  if(!ankunft(s,sh))return abschliessen('blocked','Rückflug nicht abgeschlossen');
  if(!bisVertragsabschluss(s,sh))return abschliessen('blocked','Rückflugvertrag nicht beendet');
  return abschliessen('rundfahrt_abgeschlossen');
}
function gleicheWelt(seed,ausgabe=true){
  const {s,schiff}=starte(seed);
  const reservemenge=handel.reserve(rules,Q,'nahrung');
  const start=gegenstand(s);
  while(s.tick<1440&&
    (s.stations[Q].lokalNeuNahrung<reservemenge+24||
       handel.verkaufbar(s,rules,Q,'nahrung')<24))tick(s);
  assert(handel.verkaufbar(s,rules,Q,'nahrung')>=24,'erste 24er-Charge real verkaufbar');
  const erste=warenfahrt(s,schiff,24);
  assert.equal(erste.status,'rundfahrt_abgeschlossen','erste Belegfahrt');
  assert.equal(erste.verkaufZielMenge,24,'erster Zielkauf wirklich 24');
  // Haushaltseinnahmen und Verbrauch laufen anschließend original weiter.
  tick(s,720);
  const nachErsten12h=gegenstand(s);
  const firstConsumption=nachErsten12h.haushaltKaufMenge-
    erste.nachEntladung.haushaltKaufMenge;
  // Quelle nicht mit Waren auffüllen und keinen Fonds aufstocken.
  // Höchstens weitere 48h Original-Core-Produktion/Preisregeln laufen lassen.
  let wait=0;
  while(wait<2880&&
    (s.stations[Q].lokalNeuNahrung<reservemenge+24||
      handel.verkaufbar(s,rules,Q,'nahrung')<24)){
    tick(s);wait++;
  }
  const vorZweiter=gegenstand(s);
  const zweite=warenfahrt(s,schiff,24);
  tick(s,720);
  const nachZweiter12h=gegenstand(s);
  const zweitConsumption=nachZweiter12h.haushaltKaufMenge-
    vorZweiter.haushaltKaufMenge;
  const result={seed,start,erste,nachErsten12h,firstConsumption,
    warteMinutenZweiteQuelle:wait,vorZweiter,zweite,nachZweiter12h,
    zweitConsumption,hash:core.hash(s)};
  audit(s);
  if(ausgabe)console.log('B-K10g gleiche Welt, zweite Finanzierung',JSON.stringify(result));
  return result;
}
test('B-K10g: zweimal 24 Einheiten in demselben State; Realkassen vor zweiter Fahrt',()=>{
  for(const seed of SEEDS){
    const r=gleicheWelt(seed);
    assert.equal(r.erste.erstKaufISK,816);
    assert.equal(r.erste.verkaufZielISK,1368);
    assert.equal(r.erste.nettoAuftragsbelegISK,109);
    assert.equal(r.erste.nachEntladung.zielStationFrei,262);
    assert(r.firstConsumption>0,'erste Lieferung führt zu bezahltem Endverbrauch');
    assert(r.zweite.status==='blocked'||r.zweite.status==='rundfahrt_abgeschlossen');
    if(r.zweite.status==='rundfahrt_abgeschlossen'){
      assert(r.zweite.verkaufZielMenge<=24);
      assert.equal(r.zweite.verkaufZielMenge+r.zweite.rueckverkaufMenge+r.zweite.restLadung,24,
        'zweite Lieferung bleibt vollständig in echtem Verkauf oder belegter Restfracht');
    }
  }
});
test('B-K10g: vollständiger Zwei-Runden-Seed42-Replay bleibt identisch',()=>{
  const a=gleicheWelt(42,false),b=gleicheWelt(42,false);
  assert.deepEqual(a,b);
});
