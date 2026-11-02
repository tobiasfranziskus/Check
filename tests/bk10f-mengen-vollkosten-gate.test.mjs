// B-K10f – test-only Mengengate: echte Quellenpreise, Warenkauf, Zielerlös,
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
test('B-K10f: Original-Core Mengen-/Markt-/Hin-Rueckflug-Kosten, Seeds42/7',()=>{
  const ergebnisse=[];
  for(const seed of SEEDS)for(const menge of MENGEN)
    ergebnisse.push(versuch(seed,menge));
  for(const seed of SEEDS){
    const einzel=ergebnisse.find(x=>x.seed===seed&&x.menge===1);
    assert.equal(einzel.status,'abgeschlossen','bekannter 1-Stueck-Kontrollfall');
    assert.equal(einzel.kaufMenge,1);
    assert.equal(einzel.zielVerkaufMenge,1);
    assert(einzel.flugGezahltISK>0);
    assert(einzel.haushaltsMengeNeu>=1,'bezahlter echter Endverbrauch im Kontrollfall');
  }
  assert(ergebnisse.some(x=>x.menge>1&&x.status==='abgeschlossen'),
    'mindestens eine groessere voll bezahlte Fracht nachgewiesen');
});
test('B-K10f: ein gleicher Seed/mengenbasierter Realzyklus ist deterministisch',()=>{
  const a=versuch(42,8,false),b=versuch(42,8,false);
  assert.deepEqual(a,b,'Preis- und ISK-Journal samt Save-Hashes bleiben gleich');
});
