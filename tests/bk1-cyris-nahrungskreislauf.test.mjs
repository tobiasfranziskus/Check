// B-K1: Kontrollierte Nahrungsoekonomie, NICHT produktiv.
// Nutzt ORIGINAL createState, Miner-Foerderung, Handel, Fabrikrezept,
// Betriebskosten, Preisfunktion und Geld-/Warenaudits aus index.html.
// NUR Endkundenzahlung und Eigentuemerrueckfluss sind neue, isolierte Hypothesen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const anfang=html.indexOf('const m_data_systeme =');
const ende=html.indexOf('const m_data_oberflaeche =');
assert(anfang>=0&&ende>anfang,'Original-Core-Quellenbereich fehlt');
const core=new Function(html.slice(anfang,ende)+
 ';return {rules:m_data_rules.RULES,index:m_core_index,foerderung:m_core_foerderung.foerderung,'+
 'produktion:m_core_produktion.produktion,handel:m_core_handel.handel,'+
 'betriebskosten:m_core_stunde.betriebskosten,preis:m_core_preis.preis,'+
 'gebuehr:m_core_handel.gebuehr,canonical:m_core_hash.canonical};')();
const R=core.rules, S='st_cyris', F='fonds_cyris', M='npc3', H='hh_cyris';
const rez=R.economy.rezepte.r_nahrung;
assert.deepEqual(rez.ein,{eis:2});
assert.deepEqual(rez.aus,{nahrung:1});
assert.equal(rez.dauer,6);
assert.equal(R.world.minerOwner,M);

const summe=(s)=>Object.values(s.owners).reduce((v,x)=>v+x.cash,0);
function audit(s){
  assert(core.index.audit(s).ok,'Original-Core-Audit');
  assert.equal(summe(s),s.initialSupply+s.minted-s.burned,'Geld gesamthaft');
  for(const [ware,l] of Object.entries(s.ledger)){
    let ist=0;
    for(const st of Object.values(s.stations))ist+=st.lager[ware]||0;
    for(const sh of Object.values(s.ships))ist+=sh.ladung[ware]||0;
    assert.equal(ist,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware+' Geld/Waren-Audit');
  }
}
function welt(seed=42,haushaltStart=400){
  const s=core.index.createState(seed,R);
  // Haushalte: getrennte Test-Kasse, ausschliesslich bestehendes Geld aus Fonds,
  // keine neuen ISK und keine Bevorzugung des Spieler-Kontos.
  assert(s.owners[F].cash>=haushaltStart);
  s.owners[F].cash-=haushaltStart;
  s.owners[H]={id:H,kind:'household',cash:haushaltStart};
  s.stats.konto[H]={erloes:0,kosten:0};s.stats.abgabe[H]=0;
  // Kontrollierte EIN-Zellen-Rechnung: andere Betriebe und Schiffe aussetzen,
  // damit keine fremden Warenfluesse die Ursachen verdecken.
  const miner=Object.values(s.ships).find(sh=>sh.klasse==='miner'&&sh.owner===M
    &&sh.system==='cyris'&&sh.ware==='eis');
  assert(miner,'Original-Miner fuer Eis in Cyris fehlt');
  for(const sh of Object.values(s.ships)){
    sh.arbeit=0;
    if(sh!==miner){sh.auftrag='halten';sh.ware=null;}
  }
  for(const [id,st] of Object.entries(s.stations))
    st.linien=id===S?st.linien.filter(l=>l.rezept==='r_nahrung'):[];
  assert.equal(s.stations[S].linien.length,1,'genau eine Original-Nahrungslinie');
  // Originalproduktion beginnt beim Fertigstellen sofort den naechsten Batch.
  // Erster Batch als WIP wird mit 2 tatsaechlich verbrauchten Einheiten
  // aus dem vorhandenen Stationslager vorfinanziert.
  core.produktion(s,R);
  assert.equal(s.stations[S].linien[0].rest,rez.dauer);
  audit(s);return {s,miner};
}
function ueberweise(s,von,nach,betrag,grund){
  if(!Number.isSafeInteger(betrag)||betrag<0)throw Error('ungueltige Zahlung '+grund);
  if(!s.owners[von]||!s.owners[nach]||s.owners[von].cash<betrag)
    throw Error('ungedeckte Zahlung '+grund);
  s.owners[von].cash-=betrag;s.owners[nach].cash+=betrag;
}
// Eine Runde: 2 Eis tatsaechlich foerdern; bezahlt verkaufen; 1 Nahrung
// mit dem Originalrezept herstellen; Haushalte bezahlen tatsaechlichen Verbrauch.
// Die Entnahme/Bezahlung der neuen Endnachfrage ist der EINZIGE Konsum-Prototyp.
function runde(s,miner,{rueckfluss=false}={}){
  const hh=s.owners[H],st=s.stations[S];
  const nahrPreis=core.preis(s,S,'nahrung',R);
  if(hh.cash<nahrPreis)return {ok:false,grund:'haushalt-ohne-kaufkraft',
    rest:hh.cash,preis:nahrPreis};
  // Der Warenursprung ist neu gefoerdertes Eis; Ausgangslager bleibt konstant.
  const before={eis:st.lager.eis,food:st.lager.nahrung,erz:s.ledger.eis.mined,
    erzeugt:s.ledger.nahrung.produced,verbraucht:s.ledger.nahrung.consumed,
    miner:s.owners[M].cash,station:s.owners[S].cash,fonds:s.owners[F].cash,
    haushalt:hh.cash,energie:summe(s),tick:s.tick};
  core.foerderung(s,R);core.foerderung(s,R);
  assert.equal(s.ledger.eis.mined,before.erz+2);
  assert.equal(miner.ladung.eis,2);
  const preisEis=core.preis(s,S,'eis',R);
  assert(core.handel(s,R,miner,S,'eis',2,false),'Original-Warenkauf muss finanziert sein');
  const quellKosten=before.station-s.owners[S].cash;
  assert.equal(quellKosten,2*preisEis);
  assert.equal(miner.ladung.eis,undefined);
  // Echte bisher aufgelaufene Minenarbeit wird im ORIGINAL-Core abgerechnet.
  const workBefore=miner.arbeit;
  assert.equal(workBefore,2);
  core.betriebskosten(s,R);
  assert.equal(miner.arbeit,0);
  const minedWageCost=s.owners[M].cash-before.miner;
  const fondsNet=s.owners[F].cash-before.fonds;
  // Original-Fabrik hat zurzeit KEINE eigene Bezahlung.
  let fertig=false;
  for(let step=0;step<=rez.dauer;step++){
    if(s.ledger.nahrung.produced>before.erzeugt){fertig=true;break;}
    core.produktion(s,R);
  }
  assert(fertig,'Original-Produktionsrezept hat Nahrung hergestellt');
  assert.equal(s.ledger.nahrung.produced,before.erzeugt+1);
  assert.equal(st.lager.eis,before.eis,'genau 2 Mineneis tatsaechlich verarbeitet');
  assert.equal(st.lager.nahrung,before.food+1);
  // Nur bezahlter Endverbrauch; kein Konsum, wenn Haushalt nicht zahlen kann.
  ueberweise(s,H,S,nahrPreis,'Kauf einer wirklichen Nahrungseinheit');
  st.lager.nahrung-=1;s.ledger.nahrung.consumed+=1;
  assert.equal(st.lager.nahrung,before.food);
  // Empirisch geteilte ECHTE Salden, nicht frei erfundene Loehne:
  // Miner-Einkommen nach realem Original-Arbeitskostenabfluss;
  // Stations-Mehrwert nach realem Quellkauf und Verkauf.
  const nettoMiner=s.owners[M].cash-before.miner;
  const nettoStation=s.owners[S].cash-before.station;
  assert(nettoMiner>=0&&nettoStation>=0,'kein Gewinn fuer Arbeit oder Eigentum');
  ueberweise(s,M,H,nettoMiner,'Minerarbeitslohn und Eigentuemerausschuettung');
  ueberweise(s,S,H,nettoStation,'Fabrikarbeitslohn und Eigentuemerausschuettung');
  const staatlicherRueckfluss=s.owners[F].cash-before.fonds;
  if(rueckfluss)
    ueberweise(s,F,H,staatlicherRueckfluss,'HYPOTHETISCHER transparent finanzierter Fondsrueckfluss');
  assert.equal(s.ledger.nahrung.consumed,before.verbraucht+1);
  assert.equal(st.lager.eis,before.eis);
  assert.equal(st.lager.nahrung,before.food);
  assert.equal(summe(s),before.energie);
  audit(s);
  return {ok:true,preisEis,nahrPreis,quellKosten,arbeitKosten:Math.max(0,quellKosten-minedWageCost),
    minerNet:nettoMiner,stationNet:nettoStation,fondsNet,
    nettoHaushalt:hh.cash-before.haushalt,haushalt:hh.cash,
    fonds:s.owners[F].cash,rueckfluss:staatlicherRueckfluss};
}
function lauf({seed=42,runden=20,rueckfluss=false,haushaltStart=400}={}){
  const {s,miner}=welt(seed,haushaltStart),ergebnisse=[];
  for(let i=0;i<runden;i++){
    const ergebnis=runde(s,miner,{rueckfluss});
    ergebnisse.push(ergebnis);
    if(!ergebnis.ok)break;
  }
  return {s,miner,ergebnisse,abgeschlossen:ergebnisse.filter(e=>e.ok).length};
}

test('B-K1: eine echte Liefer-/Fertigungs-/Verbrauchsrunde, Geld und Waren vollständig auditiert',()=>{
  const {s,miner}=welt(42);
  const vor=core.index.hash(s);
  const e=runde(s,miner);
  assert(e.ok);assert.notEqual(core.index.hash(s),vor);
  assert(e.nahrPreis>0&&e.preisEis>0);
  assert(e.fondsNet>=0);
  assert.equal(s.ledger.eis.mined,2);
  assert(s.ledger.nahrung.produced>=1);
  assert.equal(summe(s),s.initialSupply);
  console.log('BK1_EINZELRUNDEN_IST '+JSON.stringify(e));
});
test('B-K1: 20 Runden ohne hypothetischen Fondsrueckfluss legen Liquiditaetsleck offen',()=>{
  const {s,ergebnisse,abgeschlossen}=lauf({runden:20});
  assert.equal(abgeschlossen,20);
  assert(ergebnisse.every(x=>x.ok));
  const start=400,end=s.owners[H].cash;
  const je=ergebnisse[0];
  assert(je.nettoHaushalt<=0);
  assert.equal(end-start,ergebnisse.reduce((v,e)=>v+e.nettoHaushalt,0));
  console.log('BK1_OHNE_RUECKFLUSS '+JSON.stringify({zyklen:abgeschlossen,haushaltStart:start,
    haushaltEnde:end,gesamterFondsZuwachs:s.owners[F].cash-600,jeRunde:je}));
  audit(s);
});
test('B-K1: rein finanzierter Fondsrueckfluss erlaubt 20 identische Runden ohne neuen ISK',()=>{
  const a=lauf({runden:20,rueckfluss:true});
  assert.equal(a.abgeschlossen,20);
  assert(a.ergebnisse.every(e=>e.ok));
  assert.equal(a.s.owners[H].cash,400,'beim Vollrueckfluss konstante Endnachfrage');
  assert.equal(a.s.minted,0);assert.equal(a.s.burned,0);
  assert.equal(a.s.ledger.eis.mined,40);
  assert.equal(a.s.ledger.nahrung.consumed-0>=20,true);
  audit(a.s);
  console.log('BK1_VOLL_RUECKFLUSS '+JSON.stringify({zyklen:20,haushalt:a.s.owners[H].cash,
    herkunft:'realer Miner; Original-Kauf und -Produktion; bezahlte Haushaltsentnahme',
    modellgrenze:'Fondsrueckgabe ist Hypothese, kein verabschiedetes Budgetmodell'}));
});
test('B-K1: ohne Rueckfluss stoppt wiederholter Nahrungskauf bei Zahlungsunfaehigkeit',()=>{
  const a=lauf({runden:150});
  assert(a.abgeschlossen<150);
  assert.equal(a.ergebnisse.at(-1).grund,'haushalt-ohne-kaufkraft');
  assert(a.s.owners[H].cash<a.ergebnisse.at(-1).preis);
  audit(a.s);
  console.log('BK1_KAUFKRAFT_STOPP '+JSON.stringify({zyklen:a.abgeschlossen,
    endgrund:a.ergebnisse.at(-1).grund,haushalt:a.s.owners[H].cash}));
});
test('B-K1: deterministischer Hash in 20 Runden und getrenntes Fonds-/Geld-Audit',()=>{
  const a=lauf({seed:13,rueckfluss:true});
  const b=lauf({seed:13,rueckfluss:true});
  assert.equal(core.index.hash(a.s),core.index.hash(b.s));
  assert.equal(core.canonical(a.s),core.canonical(b.s));
  audit(a.s);audit(b.s);
});
test('B-K1: 13 Seeds -> gleiche zellgebundene Transaktionen ohne RNG-Nebenwirkungen',()=>{
  for(const seed of [1,2,3,7,11,13,42,73,101,1234,4444,65535,98765]){
    const a=lauf({seed,rueckfluss:true,runden:20});
    assert.equal(a.abgeschlossen,20,'Seed '+seed);
    assert.equal(a.s.owners[H].cash,400,'Seed '+seed);
    audit(a.s);
  }
});
test('B-K1: Haushalte bekommen kein Gratisgut bei fehlendem Geld',()=>{
  const {s,miner}=welt(42,0),h=core.index.hash(s);
  const x=runde(s,miner);
  assert.equal(x.ok,false);assert.equal(x.grund,'haushalt-ohne-kaufkraft');
  assert.equal(core.index.hash(s),h,'Ablehnung erfolgt vor Foerderung oder Produktion');
  audit(s);
});
