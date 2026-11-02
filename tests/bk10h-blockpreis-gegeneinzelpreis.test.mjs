// B-K10h: Nur Analyse der Preistiefe mit Original-Core-Handel()
// Ein identischer, realer 24er-Frachterflug, wahlweise 1x24 oder 24x1
// Vertrags- und Geldbuchungen; keine Preis-, Lohn-, Geldregel- oder
// Produktionscodeaenderung. Nur Testinstrumentierung unterdrueckt die
// automatische Ankunftsentladung und fuehrt echte Core-Handelsbuchungen aus.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const anker='    entladen(state, rules, s);';
assert.equal(js.split(anker).length,2,'nur in dieser Testkopie automatische Entladung ausschalten');
js=js.replace(anker,'    if (!__bk10h_deferUnload) entladen(state, rules, s);');
const {core,base,handel,route,herkunft}=new Function('const __bk10h_deferUnload=arguments[0];\n'+js+
  ';return {core:m_core_index,base:m_data_rules.RULES,handel:m_core_handel,'+
  'route:m_core_route.route,herkunft:m_core_herkunft};')(true);
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const Q='st_cyris',Z='st_orion',N=24;
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true,
  mindeststand:0,fondsObergrenze:1_000_000_000}};
function sum(a){return a.reduce((x,y)=>x+y,0);}
function audit(s){
  const freie=sum(Object.values(s.owners).map(x=>x.cash));
  const reserve=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(freie+reserve,s.initialSupply+s.minted-s.burned,'Geldbilanz inklusive Reserven');
  assert(core.audit(s).ok,'Original-Warenaudit');
  herkunft.pruefe(s);
  const station=sum(Object.values(s.stations).map(x=>x.lokalNeuNahrung||0));
  const transit=sum(Object.values(s.ships).map(x=>x.neuLadungNahrung||0));
  assert.equal(transit,s.haushaltNeuLedger.transit);
  assert.equal(station+transit+s.haushaltNeuLedger.ausgelagert+
    s.haushaltNeuLedger.konsumiert,s.haushaltNeuLedger.produziert);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
}
function ticken(s,zahl=1){
  for(let i=0;i<zahl;i++){
    core.step(s,rules);if(s.tick%60===0)audit(s);
  }
}
function aufsetzen(seed){
  const s=core.createState(seed,rules);
  for(const id of [Q,Z]){
    const st=s.stations[id],alt=st.lager.nahrung;
    assert.equal(st.lokalNeuNahrung||0,0);
    st.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
  }
  s.stations[Q].linien=s.stations[Q].linien.filter(x=>x.rezept==='r_nahrung');
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
  const sh=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter'
    && x.phase==='dock'&&x.system==='cyris');
  assert(sh,'original vorhandener Frachter');
  const min=handel.reserve(rules,Q,'nahrung');
  while(s.tick<1440&&
    (s.stations[Q].lokalNeuNahrung<min+N||
     handel.verkaufbar(s,rules,Q,'nahrung')<N))ticken(s);
  assert(handel.verkaufbar(s,rules,Q,'nahrung')>=N);
  audit(s);
  return {s,sh};
}
function befehl(s,sh,type,rest={}){
  const r=core.submit(s,{type,owner:sh.owner,schiff:sh.id,...rest},rules);
  assert(r.ok,JSON.stringify(r));
  const out=core.step(s,rules);
  assert.equal(out.length,1);assert(out[0].ok,JSON.stringify(out[0]));
  audit(s);
}
function lande(s,sh){
  assert.equal(sh.phase,'reise');
  while(sh.phase==='reise'&&s.tick<=sh.ankunft+3)ticken(s);
  assert.equal(sh.phase,'dock');
  audit(s);
}
function vertragsende(s,sh){
  for(let i=0;i<70&&sh.vertrag;i++)ticken(s);
  assert(!sh.vertrag,'Vertrag wirklich abgeschlossen');
}
function ausfuehren(seed,einzeln,ausgabe=true){
  const {s,sh}=aufsetzen(seed);
  const tag='nahrung',w=s.owners.npc1,vorGeld=w.cash;
  const erstPreis=core.preis(s,Q,tag,rules);
  const vorZielPreis=core.preis(s,Z,tag,rules);
  const startTick=s.tick;
  const kauf={wert:0,gebuehr:0,preise:[]};
  const verkauf={wert:0,gebuehr:0,preise:[]};
  const beleg=(station,n,kaufseite,tracker)=>{
    const p=core.preis(s,station,tag,rules);
    const fee=handel.gebuehr(s,rules,station,n*p);
    const oldCash=w.cash;
    assert(handel.handel(s,rules,sh,station,tag,n,kaufseite),
      'echter Core-Einzel- oder Blockhandel muss Kassen- und Lagertests bestehen');
    assert.equal(w.cash-oldCash,kaufseite?-(n*p+fee):(n*p-fee));
    tracker.wert+=n*p;tracker.gebuehr+=fee;tracker.preise.push([p,n]);
    audit(s);
  };
  for(let i=0;i<(einzeln?N:1);i++)beleg(Q,einzeln?1:N,true,kauf);
  const preisQuelleDanach=core.preis(s,Q,tag,rules);
  const auftrag=sh.ladung.nahrung;
  assert.equal(auftrag,N);
  befehl(s,sh,'shipMove',{ziel:Z});
  const hinId=sh.vertrag;
  lande(s,sh);
  assert.equal(sh.ladung.nahrung,N,'Test entlaedt nicht automatisch, reale Fracht bleibt');
  assert.equal(sh.system,'orion');
  const startZielPreis=core.preis(s,Z,tag,rules);
  for(let i=0;i<(einzeln?N:1);i++)beleg(Z,einzeln?1:N,false,verkauf);
  const preisZielDanach=core.preis(s,Z,tag,rules);
  assert.equal(sh.ladung.nahrung||0,0);
  vertragsende(s,sh);
  const flugHin=s.vertraege.eintraege[hinId].gezahlt;
  befehl(s,sh,'shipMove',{ziel:Q});
  const rueckId=sh.vertrag;
  lande(s,sh);vertragsende(s,sh);
  const flugRueck=s.vertraege.eintraege[rueckId].gezahlt;
  const totalFlug=flugHin+flugRueck;
  const netto=verkauf.wert-kauf.wert-kauf.gebuehr-verkauf.gebuehr-totalFlug;
  assert.equal(w.cash-vorGeld,netto,'Haendlercash stimmt mit Einkaufs-/Verkaufs-/Flugbelegen');
  const vorKonsum=s.stats.haushaltskauf[Z].menge;
  ticken(s,720);
  const konsum=s.stats.haushaltskauf[Z].menge-vorKonsum;
  audit(s);
  const x={seed,verfahren:einzeln?'24x1':'1x24',startTick,
    preisQuelleVorher:erstPreis,preisQuelleDanach,
    preisZielVorher:vorZielPreis,preisZielBeimVerkauf:startZielPreis,
    preisZielDanach,quelleWert:kauf.wert,zielWert:verkauf.wert,
    quelleGebuehr:kauf.gebuehr,zielGebuehr:verkauf.gebuehr,
    flugHin,flugRueck,totalFlug,netto,bezahlterKonsumNach12h:konsum,
    zielNeuRest:s.stations[Z].lokalNeuNahrung,
    zielStationFrei:s.owners[Z].cash,
    hash:core.hash(s)};
  if(ausgabe)console.log('B-K10h identischer 24er Handel, Block gegen Teilpreise',JSON.stringify(x));
  return x;
}
test('B-K10h: echte Block- gegen 24 Einzeltransaktionen, Seeds42/7',()=>{
  for(const seed of [42,7]){
    const block=ausfuehren(seed,false),einzel=ausfuehren(seed,true);
    assert.equal(block.quelleWert,816);
    assert.equal(block.zielWert,1368);
    assert.equal(block.netto,109,'alte Blockpreisrendite reproduziert');
    assert(einzel.quelleWert>block.quelleWert,'Mengenaufteilung verteuert reale Quelle');
    assert(einzel.zielWert<block.zielWert,'Mengenaufteilung senkt realen Zielerloes');
    assert(einzel.netto<block.netto,'Preisstruktur kann nicht blockunabhaengig sein');
    assert(block.bezahlterKonsumNach12h>0);
    assert(einzel.bezahlterKonsumNach12h>0);
  }
});
test('B-K10h: identischer Einzelhandel mit unveraendertem Hash-Replay',()=>{
  assert.deepEqual(ausfuehren(42,true,false),ausfuehren(42,true,false));
});
