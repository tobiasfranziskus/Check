// B-K10k [ANALYSE]: Neufoerderung, wirkliche Minerloehne, Original-Eisverkaeufe,
// bezahlte Fabrik-FIFO-Chargen, finanzierter Flug und testseitige Endbestellung.
// Neuware und Geld nur aus realen Core-Buchungen, ausser erklaerter Testzustellung.
// B-K10k: Gegenprobe Nadir -> Aldera, Station vs. vorfinanzierter Haushalt.
// Die Direktabnahme ist ein EXPLIZIT TEST-ONLY Gegenmodell; im Produkt nicht vorhanden.
// Original-Core-Welt, echte Eigentumsfracht, Original-Flugvertraege, echte ISK.
// Keine neuen ISK, keine geschenkte Ware, keine doppelte Konsumverbuchung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let js=html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='));
function einmal(alt,neu){
  assert.equal(js.split(alt).length,2,'eindeutiger Testanker: '+alt.slice(0,60));
  js=js.replace(alt,neu);
}
// Einzig im Test: eigene Schiffsladung bei der Ankunft fuer Haushaltszustellung halten.
const arrival="    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n    entladen(state, rules, s);";
einmal(arrival,"    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n"+
  "    if (!__bk10k_hold(s.id)) entladen(state, rules, s);");
// Direkt aus realer Ladung und vorhandener Haushaltsreserve zahlen, bevor der
// Core dieselbe stundenbasierte Nachfrage ein zweites Mal bedienen koennte.
einmal('      let n = Math.min(da, bedarf[ware]);',
  '      const direkt=__bk10k_direkt(state,rules,id,ware,bedarf[ware]);\n'+
  '      let n = Math.min(da, bedarf[ware]-direkt);');
einmal('state.stats.haushaltskauf[id].fehlend += bedarf[ware] - n;',
  'state.stats.haushaltskauf[id].fehlend += bedarf[ware] - direkt - n;');
einmal('if (n < bedarf[ware]) state.stats.mangel[id][ware] += 1;',
  'if (n < bedarf[ware]-direkt) state.stats.mangel[id][ware] += 1;');
// Nur die tatsaechlichen Original-Core-Handels- und Flugbelege ins Testjournal.
einmal("  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n"+
  "  __bk10k_journal.push({art:'handel',tick:state.tick,schiff:schiff.id,"+
  "station,menge,ware,kauf,wert,fee});\n"+
  "  __bk10k_quelleTrade(state,schiff,station,ware,menge,kauf,wert);");
const anchor="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
einmal(anchor,"    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
  "    __bk10k_journal.push({art:'flug',tick:state.tick,schiff:s.id,betrag:kosten});\n"+
  "  }\n  if (s.phase === 'dock') {");

// B-K10k: Historische FIFO-Belege fuer tatsaechlich am Nadir-Markt bezahltes Eis,
 // Originalrezept-Reservierung/-Fertigstellung sowie lokalen Originalkonsum.
einmal("      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }",
  "      if (id==='st_nadir'&&linie.rezept==='r_nahrung') __bk10k_quelleStart(state,r,index);\n"+
  "      for (const ware of ids(r.ein)) { st.lager[ware] -= r.ein[ware]; state.ledger[ware].consumed += r.ein[ware]; }");
einmal("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
  "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);\n"+
  "          if (id==='st_nadir'&&linie.rezept==='r_nahrung') __bk10k_quelleFertig(state,index);");
einmal("      st.lager[ware] = da - n; state.ledger[ware].consumed += n;",
  "      if (id==='st_nadir'&&ware==='nahrung'&&n>0) __bk10k_quelleKonsum(n);\n"+
  "      st.lager[ware] = da - n; state.ledger[ware].consumed += n;");
einmal("    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;",
  "    const n = Math.min(besitzer.cash, kosten);\n"+
  "    __bk10k_minerKosten(s,kosten,n);\n"+
  "    if (n <= 0) continue;");
einmal("    f.cash -= n; o[id].cash += n;",
  "    __bk10k_fondsZufluss(id,n,'mindest');\n"+
  "    f.cash -= n; o[id].cash += n;");
einmal("    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;",
  "    __bk10k_fondsZufluss(arm,f.cash-w.fondsObergrenze,'ueberschuss');\n"+
  "    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;");
const journal=[],cfg={mode:null,ship:null,order:null,delivered:0,pay:0,fees:0,trace:null};
function traceNeu(){
  return {eisLots:[],foodLots:[],offen:new Map(),verkauft:[],
    eisVonMiner:0,eisAnkaufISK:0,produktion:0,lokalGegessen:0,
    minerArbeitBezahlt:0,minerArbeitSoll:0,minerVerkaeufe:0,
    nadirFondsMindestISK:0,nadirFondsUeberschussISK:0};
}
const tiefKopie=(x)=>JSON.parse(JSON.stringify(x));
function quelleTrade(state,schiff,station,ware,menge,kauf,wert){
  const t=cfg.trace;
  if(!t||station!=='st_nadir')return;
  if(ware==='eis'&&!kauf){
    assert.equal(schiff.id,'sh009','nur Nadir Original-Miner liefert das Eis');
    assert.equal(wert%menge,0,'einheitlicher Originalblockpreis');
    for(let i=0;i<menge;i++)t.eisLots.push({wert:wert/menge});
    t.eisVonMiner+=menge;t.eisAnkaufISK+=wert;t.minerVerkaeufe++;
  }
  if(ware==='nahrung'&&kauf&&schiff.owner==='house'){
    assert(t.foodLots.length>=menge,'kein unproduzierter Quellabsatz');
    for(let i=0;i<menge;i++)t.verkauft.push(t.foodLots.shift());
  }
}
function quelleStart(state,r,index){
  const t=cfg.trace;
  assert(t,'Quelle immer mit Produktions-Herkunft');
  assert(!t.offen.has(index),'pro Linie nur eine begonnene Charge');
  const ice=[];
  for(let i=0;i<r.ein.eis;i++){
    assert(t.eisLots.length>0,'kein Eis ohne bezahlte Original-Minerlieferung');
    ice.push(t.eisLots.shift());
  }
  t.offen.set(index,{eisAnkaufISK:ice.reduce((n,x)=>n+x.wert,0),
    eisAnzahl:ice.length,lohnISK:r.dauer*4,started:state.tick});
}
function quelleFertig(state,index){
  const t=cfg.trace,ein=t.offen.get(index);
  assert(ein&&ein.started<state.tick,'bezahlte Fabrikcharge abgeschlossen');
  assert.equal(ein.lohnISK,24);
  t.offen.delete(index);t.foodLots.push(ein);t.produktion++;
}
function quelleKonsum(menge){
  const t=cfg.trace;
  for(let i=0;i<menge;i++)assert(t.foodLots.shift(),'Konsum nur aus fertig produzierter Ware');
  t.lokalGegessen+=menge;
}
function nadirFondsZufluss(id,isk,art){
  if(!cfg.trace||id!=='st_nadir')return;
  assert(Number.isSafeInteger(isk)&&isk>0);
  if(art==='mindest')cfg.trace.nadirFondsMindestISK+=isk;
  else cfg.trace.nadirFondsUeberschussISK+=isk;
}
function quelleMinerKosten(sh,kosten,gezahlt){
  if(!cfg.trace||sh.id!=='sh009')return;
  cfg.trace.minerArbeitSoll+=kosten;
  cfg.trace.minerArbeitBezahlt+=gezahlt;
}
const sum=x=>x.reduce((n,i)=>n+i,0);
let core=null;
function halten(id){return cfg.mode==='bestellung'&&cfg.ship===id;}
function direkt(s,rules,id,ware,bedarf){
  if(cfg.mode!=='bestellung'||id!=='st_aldera'||ware!=='nahrung'||!cfg.order)return 0;
  const sh=s.ships[cfg.ship],o=cfg.order;
  if(!sh||sh.phase!=='dock'||sh.system!=='aldera')return 0;
  const neu=sh.neuLadungNahrung||0;
  const rest=o.menge-cfg.delivered;
  const n=Math.min(bedarf,neu,rest);
  if(n<=0)return 0;
  assert(sh.ladung.nahrung>=n);
  const geld=n*o.preis;
  assert(geld<=s.vertraege.eintraege[o.id].rest);
  assert(core.vertrag.bezahlen(s,o.id,
    'leistung:bestellung:aldera:'+s.tick,geld),'Original-Vertrag bezahlt echte Lieferung');
  sh.ladung.nahrung-=n;if(sh.ladung.nahrung===0)delete sh.ladung.nahrung;
  sh.neuLadungNahrung-=n;if(sh.neuLadungNahrung===0)delete sh.neuLadungNahrung;
  s.haushaltNeuLedger.transit-=n;
  s.haushaltNeuLedger.konsumiert+=n;
  s.ledger.nahrung.consumed+=n;
  s.stats.haushaltskauf[id].menge+=n;
  s.stats.haushaltskauf[id].isk+=geld;
  s.stats.konto['hh_'+id].kosten+=geld;
  s.stats.konto[sh.owner].erloes+=geld;
  // Auch die hypothetische Direktzustellung soll ihre Marktgebuehr
  // aus echten Haendler-ISK an den existierenden Stationsfonds zahlen.
  const fee=core.gebuehr(s,rules,id,geld);
  assert(s.owners[sh.owner].cash>=fee,'Direkthandel deckt seine Gebuehr');
  s.owners[sh.owner].cash-=fee;
  s.owners['fonds_aldera'].cash+=fee;
  s.stats.konto[sh.owner].kosten+=fee;
  cfg.delivered+=n;cfg.pay+=geld;cfg.fees+=fee;
  return n;
}
const modules=new Function('__bk10k_hold','__bk10k_direkt','__bk10k_journal','__bk10k_quelleTrade','__bk10k_quelleStart','__bk10k_quelleFertig','__bk10k_quelleKonsum','__bk10k_minerKosten','__bk10k_fondsZufluss',js+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,route:m_core_route.route};')(halten,direkt,journal,quelleTrade,quelleStart,quelleFertig,quelleKonsum,quelleMinerKosten,nadirFondsZufluss);
core=modules.core;
const {base,herkunft,route}=modules;
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
const seeds=[42,7],S='st_nadir',Z='st_aldera',H='hh_st_aldera';
function audit(s){
  const frei=sum(Object.values(s.owners).map(x=>x.cash));
  const reserve=sum(Object.values(s.vertraege.eintraege).map(x=>x.rest));
  assert.equal(frei+reserve,s.initialSupply+s.minted-s.burned,'Geld inkl echten Bestellungen/Fluegen');
  for(const [ware,l] of Object.entries(s.ledger)){
    const ist=sum(Object.values(s.stations).map(st=>st.lager[ware]||0))+
      sum(Object.values(s.ships).map(sh=>sh.ladung[ware]||0));
    assert.equal(ist,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'unabhaengige Ware '+ware);
  }
  const h=s.haushaltNeuLedger;
  const lokal=sum(Object.values(s.stations).map(x=>x.lokalNeuNahrung||0));
  const transit=sum(Object.values(s.ships).map(x=>x.neuLadungNahrung||0));
  assert.equal(transit,h.transit);
  assert.equal(lokal+transit+h.ausgelagert+h.konsumiert,h.produziert);
  assert.equal(h.konsumiert,sum(Object.values(s.stats.haushaltskauf).map(x=>x.menge)));
  herkunft.pruefe(s);assert(core.audit(s).ok);
}
function ticks(s,n){
  for(let i=0;i<n;i++){core.step(s,rules);if(s.tick%60===0)audit(s);}
}
function command(s,sh,type,extra={}){
  const a=core.submit(s,{owner:sh.owner,schiff:sh.id,type,...extra},rules);
  assert(a.ok,JSON.stringify(a));
  const res=core.step(s,rules);
  assert.equal(res.length,1);assert(res[0].ok,JSON.stringify(res[0]));
  audit(s);
}
function angekommen(s,sh,system){
  assert.equal(sh.phase,'reise');
  const ende=sh.ankunft+2;
  while(sh.phase==='reise'&&s.tick<=ende)ticks(s,1);
  assert.equal(sh.system,system);assert.equal(sh.phase,'dock');audit(s);
}
function complete(s,sh){
  for(let i=0;i<90&&sh.vertrag;i++)ticks(s,1);
  assert(!sh.vertrag,'echter Frachterflugvertrag beendet');
}
function snapshot(seed){
  cfg.mode=null;cfg.ship=null;cfg.order=null;cfg.delivered=0;
  journal.length=0;
  const s=core.createState(seed,rules);
  // Nur im isolierten Analyseszenario: die beiden Nadir-Startbestaende
  // mit exakt passender initialer Warenledger-Korrektur entfernen.
  const eis=s.stations[S].lager.eis,food=s.stations[S].lager.nahrung;
  assert.equal(s.stations[S].lokalNeuNahrung,0);
  s.stations[S].lager.eis=0;s.stations[S].lager.nahrung=0;
  s.ledger.eis.initial-=eis;s.ledger.nahrung.initial-=food;
  // Konkurrierende autonome Haendler von Beginn an isolieren. Alle Miner,
  // reale Miner-Eisverkaeufe, alle Fabriken, Haushalte und Fonds bleiben aktiv.
  for(const peer of Object.values(s.ships))
    if(peer.klasse==='frachter'&&peer.auftrag==='handeln')peer.auftrag='halten';
  audit(s);
  const player=Object.values(s.ships).find(x=>x.owner==='house'
    && x.klasse==='frachter'&&x.phase==='dock'&&x.system==='aldera');
  assert(player,'vorhandener Spielerfrachter am Ursprungsort');
  assert.equal(s.stations[S].lager.eis,0);assert.equal(s.stations[S].lager.nahrung,0);
  const saved=core.save(s);
  assert.equal(core.hash(core.load(saved,undefined,rules)),core.hash(s));
  return {saved,sha:core.hash(s)};
}
function run(saved,seed,mode,ausgabe=true,angefragt=24){
  const s=core.load(saved,undefined,rules),sh=Object.values(s.ships)
    .find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert(sh);assert.equal(sh.system,'aldera');
  cfg.mode=mode;cfg.ship=sh.id;cfg.order=null;cfg.delivered=0;cfg.pay=0;cfg.fees=0;
  cfg.trace=traceNeu();journal.length=0;
  ticks(s,480); // real finanzierte Eis-Foerderung -> originaler Ankauf -> Original-Fabrik
  assert.equal(cfg.trace.eisLots.length,s.stations[S].lager.eis);
  assert.equal(cfg.trace.foodLots.length,s.stations[S].lager.nahrung);
  assert(cfg.trace.eisVonMiner>=100,'vorher tatsaechlich neues Eis angekauft');
  assert(cfg.trace.produktion>=50,'Nahrung nur aus bezahlter Nadir-Produktion');
  assert.equal(cfg.trace.minerArbeitSoll,cfg.trace.minerArbeitBezahlt,
    'keine unbezahlten Nadir-Minerstunden in der Vorlaufphase');
  // Gleicher ab Tag3 bestehender Markt, danach nur konkurrierende
  // NPC-Frachterauftraege fuer beide kontrollierten Lieferungen anhalten.
  for(const peer of Object.values(s.ships))
    if(peer.owner!=='house'&&peer.klasse==='frachter'
      && peer.auftrag==='handeln')peer.auftrag='halten';
  const t0=s.tick, cash0=s.owners.house.cash, hh0=s.owners[H].cash;
  const st0=s.owners[Z].cash,stats0={...s.stats.haushaltskauf[Z]};
  const r={seed,mode,routeZeit:route(rules.world,'aldera','nadir').zeit,
    startHaendlerCash:cash0,startHaushaltCash:hh0,startStationsCash:st0,
    preisZielBeiBestellung:core.preis(s,Z,'nahrung',rules)};
  // Gleiche echte Positionierung aus Aldera nach Nadir.
  command(s,sh,'shipMove',{ziel:S});
  angekommen(s,sh,'nadir');complete(s,sh);
  const saleable=core.verkaufbar(s,rules,S,'nahrung');
  const echtNeu=s.stations[S].lokalNeuNahrung;
  const alt=s.stations[S].lager.nahrung-echtNeu;
  const menge=Math.min(angefragt,saleable,echtNeu,30);
  assert(menge>=Math.min(angefragt,10),'beide Seeds haben wirklich verkaufbare Nahrung');
  assert.equal(alt,0,'aus Nadir bezogene Nahrung ist nachweislich neu');
  r.menge=menge;r.quellpreis=core.preis(s,S,'nahrung',rules);
  // Testseitige Bestellung vor Warenkauf und vor dem beladenen Abflug.
  if(mode==='bestellung'){
    const max=r.preisZielBeiBestellung*menge;
    const id=core.vertrag.reservieren(s,H,'house',max);
    assert(id,'Bestellung aus zuvor vorhandenem Haushaltgeld gesperrt');
    cfg.order={id,menge,preis:r.preisZielBeiBestellung};
    r.gesichertISK=max;
    audit(s);
  }
  command(s,sh,'shipTrade',{ware:'nahrung',menge,kauf:true});
  assert.equal(sh.neuLadungNahrung,menge);
  r.beladen=sh.ladung.nahrung;
  command(s,sh,'shipMove',{ziel:Z});
  angekommen(s,sh,'aldera');complete(s,sh);
  r.nachAnkunftLadung=sh.ladung.nahrung||0;
  r.nachAnkunftStationsCash=s.owners[Z].cash;
  r.nachAnkunftHHcash=s.owners[H].cash;
  const konsumStart=s.stats.haushaltskauf[Z].menge;
  ticks(s,10*60);
  if(cfg.order){
    const id=cfg.order.id,e=s.vertraege.eintraege[id];
    assert(e,'Bestellvertrag muss noch existieren');
    assert.equal(e.gezahlt,cfg.pay,'nur wirklich erhaltene Nahrung wird bezahlt');
    assert.equal(e.gezahlt+e.rest,e.budget,'Reservierung deckt Auszahlung und Storno');
    r.vorStornoRestISK=e.rest;
    assert(core.vertrag.abschliessen(s,id),'unverbrauchte Haushaltsreserve voll erstatten');
    r.erstattetISK=e.erstattet;
    assert.equal(e.gezahlt+e.erstattet,e.budget,'kein verlorenes Haushaltgeld');
  }
  audit(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
  const ev=journal.filter(e=>e.schiff===sh.id);
  const k=ev.filter(x=>x.art==='handel'&&x.kauf&&x.station===S&&x.ware==='nahrung');
  const v=ev.filter(x=>x.art==='handel'&&!x.kauf&&x.station===Z&&x.ware==='nahrung');
  const fl=ev.filter(x=>x.art==='flug');
  r.fondsNadirErhaltenMinimumISK=cfg.trace.nadirFondsMindestISK;
  r.fondsNadirErhaltenUeberschussISK=cfg.trace.nadirFondsUeberschussISK;
  r.eisVorverkaufMenge=cfg.trace.eisVonMiner;
  r.eisOriginalAnkaufISK=cfg.trace.eisAnkaufISK;
  r.eisOriginalVerkaeufe=cfg.trace.minerVerkaeufe;
  r.eisMinerOriginalGezahltISK=cfg.trace.minerArbeitBezahlt;
  r.eisMinerOriginalSollISK=cfg.trace.minerArbeitSoll;
  r.nahrungOriginalProduziert=cfg.trace.produktion;
  r.nahrungOriginalLokalVerbraucht=cfg.trace.lokalGegessen;
  assert.equal(cfg.trace.verkauft.length,r.menge);
  r.verfolgteEisEinheiten=sum(cfg.trace.verkauft.map(x=>x.eisAnzahl));
  r.quellEisIstAnkaufISK=sum(cfg.trace.verkauft.map(x=>x.eisAnkaufISK));
  r.quellFabriklohnISK=sum(cfg.trace.verkauft.map(x=>x.lohnISK));
  r.minerArbeitskostenAnteilISK=r.verfolgteEisEinheiten*
    rules.world.betriebskosten.miner/rules.economy.stunde;
  assert(Number.isSafeInteger(r.minerArbeitskostenAnteilISK));
  assert(r.minerArbeitskostenAnteilISK<=r.eisMinerOriginalGezahltISK,
    'alle anteiligen Miner-Betriebskosten durch echten Miner bezahlt');
  assert.equal(r.verfolgteEisEinheiten,2*r.menge);
  assert.equal(r.quellFabriklohnISK,24*r.menge);
  r.nadirFondsMindestISK=cfg.trace.nadirFondsMindestISK;
  r.nadirFondsUeberschussISK=cfg.trace.nadirFondsUeberschussISK;
  r.nadirFondsTransferGesamtISK=r.nadirFondsMindestISK+
    r.nadirFondsUeberschussISK;
  r.nadirEndKasse=s.owners[S].cash;
  r.nadirFondsEndKasse=s.owners.fonds_nadir.cash;
  r.einkaufISK=sum(k.map(x=>x.wert));
  r.eisQuellstationDeckungISK=r.einkaufISK-r.quellEisIstAnkaufISK-
    r.quellFabriklohnISK;
  assert(r.eisQuellstationDeckungISK<0,
    'real bezahlte Eis- und Fabriklose sind in diesem Szenario nicht gedeckt');
  r.minerDeckungNachBezahlterArbeitISK=r.quellEisIstAnkaufISK-
    r.minerArbeitskostenAnteilISK;
  r.quellgebuehrISK=sum(k.map(x=>x.fee));
  r.stationsAbsatzMenge=sum(v.map(x=>x.menge));
  r.stationsAbsatzISK=sum(v.map(x=>x.wert));
  r.zielgebuehrISK=sum(v.map(x=>x.fee));
  r.flugGezahltISK=sum(fl.map(x=>x.betrag));
  r.direktAbsatzMenge=cfg.delivered;r.direktAbsatzISK=cfg.pay;
  r.direktGebuehrISK=cfg.fees;
  r.endverbrauchSeitStart=s.stats.haushaltskauf[Z].menge-stats0.menge;
  r.endverbrauchNachAnkunft=s.stats.haushaltskauf[Z].menge-konsumStart;
  r.nach10hFrachterRest=sh.ladung.nahrung||0;
  r.haushaltCashEnde=s.owners[H].cash;
  r.stationsCashEnde=s.owners[Z].cash;
  r.haendlerCashEnde=s.owners.house.cash;
  r.haendlerCashDelta=r.haendlerCashEnde-cash0;
  r.kettenbeitragNachEchtenBetriebskostenISK=r.stationsAbsatzISK+
    r.direktAbsatzISK-r.minerArbeitskostenAnteilISK-r.quellFabriklohnISK-
    r.quellgebuehrISK-r.zielgebuehrISK-r.direktGebuehrISK-r.flugGezahltISK;
  r.nettobeleg=r.stationsAbsatzISK+r.direktAbsatzISK-r.einkaufISK-
    r.quellgebuehrISK-r.zielgebuehrISK-r.direktGebuehrISK-r.flugGezahltISK;
  // Hintergrundakteure koennen den Spieler nicht versteckt finanzieren:
  assert.equal(r.haendlerCashDelta,r.nettobeleg);
  r.konsumKontozahlungISK=s.stats.haushaltskauf[Z].isk-stats0.isk;
  r.supply=s.initialSupply+s.minted-s.burned;
  r.hash=core.hash(s);
  if(ausgabe)console.log('B-K10k echte Bergbau-Fabrik-Transport- und Bestellrechnung',JSON.stringify(r));
  return r;
}
test('B-K10k: neu gefördertes Eis und bezahlte Nahrung in echter Lieferung',()=>{
  for(const seed of seeds){
    const start=snapshot(seed);
    const b=run(start.saved,seed,'station');
    const d=run(start.saved,seed,'bestellung');
    assert.equal(b.menge,d.menge,'gleiche reale Warenmenge');
    assert.deepEqual([b.quellEisIstAnkaufISK,b.quellFabriklohnISK],
      [d.quellEisIstAnkaufISK,d.quellFabriklohnISK],
      'dieselben verbuchten Rohstoff- und Fabrikkosten fuer beide Arme');
    assert(d.quellEisIstAnkaufISK>0,'tatsaechlicher Eisankauf nicht nur angenommener Preis');
    assert(d.eisMinerOriginalGezahltISK>0,'Nadir-Miner wirklich bezahlt');
    assert(d.fondsNadirErhaltenMinimumISK>0,
      'Nadir erhaelt nachweisbar vorhandenes Systemfonds-Geld');
    assert.equal(b.einkaufISK,d.einkaufISK,'gleicher realer Quelleinkauf');
    assert.equal(b.flugGezahltISK,d.flugGezahltISK,'gleiche bezahlte Fahrt');
    assert.equal(d.stationsAbsatzMenge,0,'bestellte Lieferung verwendet keine Stationsankaufkasse');
    assert(d.direktAbsatzMenge>0,'keine imaginäre nur gebuchte Nachfrage');
    assert(d.direktAbsatzMenge<=d.menge,'keine Mehrfachware');
    assert(d.endverbrauchSeitStart>=d.direktAbsatzMenge,
      'auch der Zustell-Stundentick vor dem Ankunfts-Snapshot zaehlt');
    assert(d.nach10hFrachterRest+d.direktAbsatzMenge===d.menge);
    assert(b.stationsAbsatzMenge<=b.menge);
    // Mit frueh ausreichend finanzierter Aldera-Station darf Originalhandel
    // dieselbe Ladung abnehmen; das ist KEIN Nachweis eines Mehrabsatzes.
    assert(d.direktAbsatzMenge>=b.stationsAbsatzMenge);
  }
});
test('B-K10k: Seed42 identischer Ausgangsspielstand und deterministische Auftragslieferung',()=>{
  const start=snapshot(42);
  assert.deepEqual(run(start.saved,42,'bestellung',false),
    run(start.saved,42,'bestellung',false));
});

test('B-K10k: vorfinanzierte, aber nie ausgelieferte Bestellung wird voll erstattet',()=>{
  const start=snapshot(42);
  cfg.mode=null;cfg.ship=null;cfg.order=null;cfg.delivered=0;cfg.trace=traceNeu();
  const s=core.load(start.saved,undefined,rules);
  const anfang=s.owners[H].cash;
  // Fuer diese negative Vertragsprobe stammt das Guthaben aus real bezahlter
  // Original-Fabrikarbeit; keine Testgutschrift und keine neue ISK.
  ticks(s,120);
  assert(s.owners[H].cash>0);
  const vor=s.owners[H].cash,minted=s.minted,burned=s.burned,
    bezahlt=s.stats.haushaltskauf[Z].isk;
  const betrag=Math.min(500,vor);
  const id=core.vertrag.reservieren(s,H,'house',betrag);
  assert(id);
  assert.equal(s.owners[H].cash,vor-betrag);
  assert.equal(s.vertraege.eintraege[id].rest,betrag);
  audit(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
  assert(core.vertrag.abschliessen(s,id),'Storno ohne Leistung');
  assert.equal(s.vertraege.eintraege[id]?.erstattet,betrag);
  assert.equal(s.owners[H].cash,vor,'Haushalt erhaelt vollen Rest zurueck');
  assert.equal(s.stats.haushaltskauf[Z].isk,bezahlt);
  assert.equal(s.minted,minted);assert.equal(s.burned,burned);
  audit(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
  console.log('B-K10k Bestellstorno ohne Lieferung',JSON.stringify({
    vorher:vor,reserviert:betrag,erstattet:betrag,nachher:s.owners[H].cash,
    neueISK:0,neuerBestellverbrauch:0}));
});

test('B-K10k: echte Mengenstaffel 8/16/24 zeigt Unterdeckung trotz bezahlter Bestellung',()=>{
  const start=snapshot(42);
  const werte=[8,16,24].map(n=>run(start.saved,42,'bestellung',false,n));
  for(const r of werte){
    assert.equal(r.menge,r.direktAbsatzMenge);
    assert.equal(r.quellFabriklohnISK,24*r.menge);
    assert.equal(r.verfolgteEisEinheiten,2*r.menge);
    assert(r.eisQuellstationDeckungISK<0);
    assert(r.minerDeckungNachBezahlterArbeitISK>0);
  }
  assert(werte[0].kettenbeitragNachEchtenBetriebskostenISK<
    werte[2].kettenbeitragNachEchtenBetriebskostenISK,
    'fixe reale Flugkosten nur ueber groessere Ladungen verteilbar');
  console.log('B-K10k echte Mengenstaffel',JSON.stringify(werte.map(r=>({
    n:r.menge,quelleEisISK:r.quellEisIstAnkaufISK,
    fabriklohnISK:r.quellFabriklohnISK,quellverlustISK:r.eisQuellstationDeckungISK,
    minerGewinnVorHullISK:r.minerDeckungNachBezahlterArbeitISK,
    haendlerISK:r.haendlerCashDelta,gesamtbeitragVorHullISK:
    r.kettenbeitragNachEchtenBetriebskostenISK}))));
});


test('B-K10k: ohne Fonds-Mindeststuetzung stoppt echte Nadir-Lieferkette vor verkaufbarer Charge',()=>{
  const vorherMindest=rules.world.mindeststand;
  const vorherObergrenze=rules.world.fondsObergrenze;
  try{
    for(const seed of seeds){
      const werte=[];
      for(const fondsAktiv of [true,false]){
        // Explizit nur Versuch: beide Szenarien starten aus demselben
        // Warenledger-abgeglichenen Zustand. Keine neuen ISK oder Waren.
        rules.world.mindeststand=fondsAktiv?vorherMindest:0;
        rules.world.fondsObergrenze=fondsAktiv?vorherObergrenze:1_000_000_000;
        const start=snapshot(seed);
        cfg.mode=null;cfg.ship=null;cfg.order=null;
        cfg.delivered=0;cfg.trace=traceNeu();
        const state=core.load(start.saved,undefined,rules);
        ticks(state,480);
        const x={
          seed,fondsAktiv,produktionen:state.stats.rezepte[S],
          freierNahrungsabsatz:core.verkaufbar(state,rules,S,'nahrung'),
          stationsISK:state.owners[S].cash,
          fondsMindestISK:cfg.trace.nadirFondsMindestISK,
          fondsUeberschussISK:cfg.trace.nadirFondsUeberschussISK,
          eisMinerVerkauft:cfg.trace.eisVonMiner,
          eisMinerBezahlteISK:cfg.trace.eisAnkaufISK,
          fabrikLohnISK:state.stats.konto['hh_'+S].erloes,
          globaleISK:state.initialSupply+state.minted-state.burned,
          hash:core.hash(state),
        };
        assert.equal(cfg.trace.minerArbeitSoll,cfg.trace.minerArbeitBezahlt,
          'keine ungedeckte Minerarbeit in beiden Fondsvarianten');
        assert.equal(core.hash(core.load(core.save(state),undefined,rules)),x.hash);
        assert(x.eisMinerVerkauft>0&&x.eisMinerBezahlteISK>0);
        werte.push(x);
      }
      const [mit,ohne]=werte;
      assert.equal(mit.globaleISK,ohne.globaleISK,
        'Fonds-Umverteilung schafft keine ISK; gleiche Anfangswelt und Seed');
      assert.equal(ohne.fondsMindestISK,0);
      assert.equal(ohne.fondsUeberschussISK,0);
      assert(mit.fondsMindestISK>0,'tatsaechlicher Fonds-Uebertrag statt Annahme');
      assert(mit.produktionen>ohne.produktionen,'ohne Mittel weniger echte Fabrikarbeit');
      assert(mit.freierNahrungsabsatz>=24,
        'originale Warenreserve erlaubt eine 24er-Lieferung');
      assert.equal(ohne.freierNahrungsabsatz,0,
        'ohne Fonds keine 24er-Charge nach 8h auf dem Markt');
      console.log('B-K10k echter Fondsvergleich',JSON.stringify(werte));
    }
  }finally{
    rules.world.mindeststand=vorherMindest;
    rules.world.fondsObergrenze=vorherObergrenze;
  }
});
