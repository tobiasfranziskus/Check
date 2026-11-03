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

// Gepinnter, historisch ausgefuehrter R15/Schema9-Kern aus PR #128;
 // NICHT main R14, keine Produktdatei und kein neues Laufzeitmodul.
const html=fs.readFileSync(new URL('./fixtures/bk11h-r15-core-snapshot.txt',import.meta.url),'utf8');
let js=html;
assert(js.startsWith('const m_data_systeme ='));
assert(js.includes('const m_core_vertrag =')&&js.includes('const m_core_herkunft ='));
assert(js.includes('const m_core_index ='));
const fixtureSHA=(await import('node:crypto')).createHash('sha256').update(js).digest('hex');
assert.equal(fixtureSHA,'e5e2c5092fda778b38064dcda2692004889635639ff56dc5c0c61b2377dd7680',
  'test-only Core-Quelle muss exakt dem erfolgreich geprueften PR #128 entsprechen');
console.log('BK11H_R15_FIXTURE_SHA256 '+fixtureSHA);
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
  "    __bk10k_journal.push({art:'flug',tick:state.tick,schiff:s.id,owner:s.owner,"+
  "empfaenger:rules.world.systems[system].fonds,betrag:kosten});\n"+
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
  "    __bk10k_minerKosten(state,s,kosten,n);\n"+
  "    if (n <= 0) continue;");
einmal("    f.cash -= n; o[id].cash += n;",
  "    __bk10k_fondsZufluss(id,n,'mindest');\n"+
  "    f.cash -= n; o[id].cash += n;");
einmal("    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;",
  "    __bk10k_fondsZufluss(arm,f.cash-w.fondsObergrenze,'ueberschuss');\n"+
  "    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;");
const journal=[],cfg={mode:null,ship:null,order:null,delivered:0,pay:0,fees:0,trace:null,gateLog:null,accountOnly:false,l11:null};
function traceNeu(){
  return {eisLots:[],foodLots:[],offen:new Map(),verkauft:[],
    eisVonMiner:0,eisAnkaufISK:0,produktion:0,lokalGegessen:0,
    minerArbeitBezahlt:0,minerArbeitSoll:0,minerVerkaeufe:0,
    nadirFondsMindestISK:0,nadirFondsUeberschussISK:0};
}
const tiefKopie=(x)=>JSON.parse(JSON.stringify(x));
function quelleTrade(state,schiff,station,ware,menge,kauf,wert){
  if(cfg.l11){
    const original=journal.at(-1);
    assert(original&&original.art==='handel'&&original.schiff===schiff.id);
    cfg.l11.trades.push({tick:state.tick,owner:schiff.owner,
      klasse:schiff.klasse,station,ware,menge,kauf,wert,fee:original.fee,
      feeEmpfaenger:state.stations[station].eigentum
        ?station:rules.world.systems[state.stations[station].system].fonds});
  }
  if(cfg.accountOnly)return; // nur B-K11k: aggregierte echte Core-Konten statt strengem Ein-Miner-FIFO
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
  if(cfg.accountOnly)return;
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
  if(cfg.accountOnly)return;
  const t=cfg.trace,ein=t.offen.get(index);
  assert(ein&&ein.started<state.tick,'bezahlte Fabrikcharge abgeschlossen');
  assert.equal(ein.lohnISK,24);
  t.offen.delete(index);t.foodLots.push(ein);t.produktion++;
}
function quelleKonsum(menge){
  if(cfg.accountOnly)return;
  const t=cfg.trace;
  for(let i=0;i<menge;i++)assert(t.foodLots.shift(),'Konsum nur aus fertig produzierter Ware');
  t.lokalGegessen+=menge;
}
function nadirFondsZufluss(id,isk,art){
  if(cfg.accountOnly)return;
  if(!cfg.trace||id!=='st_nadir')return;
  assert(Number.isSafeInteger(isk)&&isk>0);
  if(art==='mindest')cfg.trace.nadirFondsMindestISK+=isk;
  else cfg.trace.nadirFondsUeberschussISK+=isk;
}
function quelleMinerKosten(state,sh,kosten,gezahlt){
  if(cfg.accountOnly)return;
  if(sh.id==='sh009' && cfg.gateLog && gezahlt<kosten)
    cfg.gateLog.push({art:'miner-betrieb',tick:state.tick,akteur:sh.owner,schiff:sh.id,
      brauchtISK:kosten,vorhandenISK:state.owners[sh.owner].cash,
      bezahltISK:gezahlt,fehlbetragISK:kosten-gezahlt});
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
// B-K11j: ausschliesslich beobachtender Hook an der echten fehlgeschlagenen
// Produktionsmittelbindung; keine Buchung, kein Retry und keine Sonderzahlung.
function bk11jProduktionsGate(state,id,index,linie,rezept,lohn){
  if(cfg.l11&&id==='st_aldera'&&!cfg.l11.firstPayroll)
    cfg.l11.firstPayroll={tick:state.tick,station:id,rezept:linie.rezept,
      linie:index,bedarf:lohn,liquid:state.owners[id].cash,
      fehlbetrag:lohn-state.owners[id].cash,
      inputs:rezept.ein,outputs:rezept.aus,
      hhCash:state.owners['hh_'+id].cash,
      localFonds:state.owners.fonds_aldera.cash};
  if(id!=='st_nadir'||!cfg.gateLog)return;
  const cash=state.owners[id].cash;
  cfg.gateLog.push({art:'produktion-escrow',tick:state.tick,akteur:id,
    linie:index,rezept:linie.rezept,brauchtISK:lohn,vorhandenISK:cash,
    fehlbetragISK:Math.max(0,lohn-cash),eisLager:state.stations[id].lager.eis,
    nahrungLager:state.stations[id].lager.nahrung,
    haushaltISK:state.owners['hh_'+id].cash,
    fondsISK:state.owners.fonds_nadir.cash});
}
einmal("        const idVertrag = m_core_vertrag.reservieren(state, id, 'hh_' + id, lohn);\n        if (!idVertrag) continue;",
  "        const idVertrag = m_core_vertrag.reservieren(state, id, 'hh_' + id, lohn);\n"+
  "        if (!idVertrag) __bk11j_prodGate(state,id,index,linie,r,lohn);\n"+
  "        if (!idVertrag) continue;");

// B-K11l: ungeschriebene, rein testseitige Kontoereignisse. Die Hooks stehen
// an realen, vom Original-Core erreichten Zahlungs- bzw. Ablehnungsstellen.
function bk11lEvent(state,art,id,gegen,n,info={}){
  if(!cfg.l11)return;
  assert(Number.isSafeInteger(n)&&n>0,'B-K11l beobachtet reale ISK-Betraege');
  cfg.l11.events.push({tick:state.tick,art,von:id,an:gegen,isk:n,...info});
}
function bk11lFlightGate(state,schiff,station,ziel,ware,budget,art){
  if(!cfg.l11||!['npc1','npc2'].includes(schiff.owner))return;
  const id=schiff.owner;
  if(cfg.l11.firstFlight[id])return;
  cfg.l11.firstFlight[id]={tick:state.tick,owner:id,schiff:schiff.id,
    art,station,ziel,ware,cash:state.owners[id].cash,
    flightBudget:budget,
    priceUnit:ware?core.preis(state,station,ware,rules):null,
    cargo:Object.fromEntries(Object.entries(schiff.ladung))};
}
einmal("            buche(state, id, 'kosten', betrag);",
  "            __bk11l_event(state,'produktionslohn',id,'hh_'+id,betrag,"+
  "{rezept:linie.rezept});\n            buche(state, id, 'kosten', betrag);");
einmal("    o[id].cash -= n; o[ziel].cash += n;",
  "    __bk11l_event(state,'npc-abgabe',id,ziel,n);\n"+
  "    o[id].cash -= n; o[ziel].cash += n;");
einmal("    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;",
  "    __bk11l_event(state,'fonds-ueberschuss',fondsIn(rules,system),arm,"+
  "f.cash-w.fondsObergrenze);\n"+
  "    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;");
einmal("          hh.cash -= geld;",
  "          __bk11l_event(state,'lokaler-endverbrauch','hh_'+id,id,geld,"+
  "{ware});\n          hh.cash -= geld;");
einmal("    f.cash -= n; o[id].cash += n;",
  "    __bk11l_event(state,'fonds-mindest',fondsIn(rules,state.stations[id].system),id,n);\n"+
  "    f.cash -= n; o[id].cash += n;");
einmal("    if (bezahlbar(rules, station, state.owners[s.owner].cash - budget, preis(state, station, ware, rules)) <= 0)\n      return false;",
  "    if (bezahlbar(rules, station, state.owners[s.owner].cash - budget, preis(state, station, ware, rules)) <= 0) {\n"+
  "      __bk11l_flightGate(state,s,station,ziel,ware,budget,'handel-vorlauf');\n"+
  "      return false;\n    }");
einmal("  if (finanziert && !m_core_vertrag.fahrtStart(state, rules, s, ziel, r.zeit)) return false;",
  "  if (finanziert && !m_core_vertrag.fahrtStart(state, rules, s, ziel, r.zeit)) {\n"+
  "    __bk11l_flightGate(state,s,station,ziel,ware,"+
  "Math.ceil(r.zeit*w.betriebskosten.frachter/rules.economy.stunde),'fahrt-escrow');\n"+
  "    return false;\n  }");
const modules=new Function('__bk10k_hold','__bk10k_direkt','__bk10k_journal','__bk10k_quelleTrade','__bk10k_quelleStart','__bk10k_quelleFertig','__bk10k_quelleKonsum','__bk10k_minerKosten','__bk10k_fondsZufluss','__bk11j_prodGate','__bk11l_event','__bk11l_flightGate',js+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,route:m_core_route.route};')(halten,direkt,journal,quelleTrade,quelleStart,quelleFertig,quelleKonsum,quelleMinerKosten,nadirFondsZufluss,bk11jProduktionsGate,bk11lEvent,bk11lFlightGate);
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
function run(saved,seed,mode,ausgabe=true,angefragt=24,extras={}){
  const s=core.load(saved,undefined,rules),sh=Object.values(s.ships)
    .find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert(sh);assert.equal(sh.system,'aldera');
  cfg.mode=mode;cfg.ship=sh.id;cfg.order=null;cfg.delivered=0;cfg.pay=0;cfg.fees=0;
  // B-K11i: gleicher Original-Core-Spielstand und durchgaengiger FIFO-Testtrace.
  // Alte belegte Eis-/Nahrungs-Lots duerfen nicht bei Charge zwei vergessen werden.
  if(!extras.continueTrace)cfg.trace=traceNeu();
  assert(cfg.trace,'FIFO-Trace muss vorhanden sein');
  const traceStart=Object.fromEntries([
    'eisVonMiner','eisAnkaufISK','minerVerkaeufe','produktion','lokalGegessen',
    'minerArbeitBezahlt','minerArbeitSoll','nadirFondsMindestISK','nadirFondsUeberschussISK'
  ].map(key=>[key,cfg.trace[key]]));
  const soldAtStart=cfg.trace.verkauft.length;
  journal.length=0;
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
  const nadirCash0=s.owners[S].cash,nadirHH0=s.owners['hh_'+S].cash;
  const nadirStats0={...s.stats.konto[S]};
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
  if(extras.allowBlocked && menge<angefragt){
    audit(s);
    const blocked={blocked:true,reason:'nicht genuegend verkaufbare echte Neuware',
      seed,tick:s.tick,requested:angefragt,saleable,realNew:echtNeu,
      nahrungLager:s.stations[S].lager.nahrung,
      stationCash:s.owners[S].cash,buyerCash:s.owners[H].cash,
      fondstransfersSinceFirst:cfg.trace.nadirFondsMindestISK-traceStart.nadirFondsMindestISK,
      producedSinceFirst:cfg.trace.produktion-traceStart.produktion,
      hash:core.hash(s),finalSaved:core.save(s)};
    assert.equal(core.hash(core.load(blocked.finalSaved,undefined,rules)),blocked.hash);
    return blocked;
  }
  assert(menge>=Math.min(angefragt,10),'beide Seeds haben wirklich verkaufbare Nahrung');
  assert.equal(alt,0,'aus Nadir bezogene Nahrung ist nachweislich neu');
  r.menge=menge;r.quellpreis=core.preis(s,S,'nahrung',rules);
  // Testseitige Bestellung vor Warenkauf und vor dem beladenen Abflug.
  if(mode==='bestellung'){
    const max=r.preisZielBeiBestellung*menge;
    const id=core.vertrag.reservieren(s,H,'house',max);
    if(!id&&extras.allowBlocked){
      // Kein Testtrick: Der Original-Core hat die Vertragsreservierung
      // ohne Zahlung/Buchung abgewiesen. Keine Ware kaufen/transferieren.
      audit(s);
      const buyerCash=s.owners[H].cash;
      assert(buyerCash<max,'erster echter Käufer-Finanzierungsgate');
      const blocked={blocked:true,reason:'Haushalt kann 24er-Bestellung nicht vorfinanzieren',
        gate:'haushalt-bestellung',seed,tick:s.tick,requested:angefragt,
        saleable,realNew:echtNeu,nahrungLager:s.stations[S].lager.nahrung,
        eisLager:s.stations[S].lager.eis,requiredBudgetISK:max,
        buyerCash,shortfallISK:max-buyerCash,buyerCashDelta:buyerCash-hh0,
        stationCash:s.owners[S].cash,stationCashDelta:s.owners[S].cash-nadirCash0,
        nadirErloeseDelta:s.stats.konto[S].erloes-nadirStats0.erloes,
        nadirKostenDelta:s.stats.konto[S].kosten-nadirStats0.kosten,
        nadirHaushaltCash:s.owners['hh_'+S].cash,
        nadirHaushaltCashDelta:s.owners['hh_'+S].cash-nadirHH0,
        neuerEisAnkaufISK:cfg.trace.eisAnkaufISK-traceStart.eisAnkaufISK,
        neueEisMenge:cfg.trace.eisVonMiner-traceStart.eisVonMiner,
        neueNahrung:cfg.trace.produktion-traceStart.produktion,
        minerArbeitISK:cfg.trace.minerArbeitBezahlt-traceStart.minerArbeitBezahlt,
        stationVerkaufbar:core.verkaufbar(s,rules,S,'nahrung'),
        traderCash:s.owners.house.cash,
        minerCash:s.owners[s.ships.sh009.owner].cash,
        fondsCash:s.owners.fonds_nadir.cash,
        fondsMinimumSinceStart:cfg.trace.nadirFondsMindestISK-traceStart.nadirFondsMindestISK,
        produktionSinceStart:cfg.trace.produktion-traceStart.produktion,
        hash:core.hash(s),finalSaved:core.save(s)};
      assert.equal(core.hash(core.load(blocked.finalSaved,undefined,rules)),blocked.hash);
      return blocked;
    }
    assert(id,'Bestellung aus zuvor vorhandenem Haushaltgeld gesperrt');
    cfg.order={id,menge,preis:r.preisZielBeiBestellung};
    r.gesichertISK=max;
    audit(s);
  }
  command(s,sh,'shipTrade',{ware:'nahrung',menge,kauf:true});
  assert.equal(sh.neuLadungNahrung,menge);
  r.beladen=sh.ladung.nahrung;
  command(s,sh,'shipMove',{ziel:Z});
  if(extras.lossInTransit) {
    // Explizit deterministischer TEST-Unfall auf der echten Flugroute:
    // die reale neu erzeugte Schiffsfracht wird vor Ankunft vernichtet.
    // Keine willkuerliche Pirate-RNG, keine kostenlose Ware/ISK.
    assert.equal(mode,'bestellung','Verlust nur bei voll vorfinanziertem Endkunden');
    assert.equal(sh.phase,'reise');assert.equal(sh.neuLadungNahrung,menge);
    const verloren=sh.ladung.nahrung;
    assert.equal(verloren,menge,'aus Original-Produktion gekaufte Fracht');
    delete sh.ladung.nahrung;delete sh.neuLadungNahrung;
    s.haushaltNeuLedger.transit-=verloren;
    s.haushaltNeuLedger.ausgelagert+=verloren;
    s.ledger.nahrung.consumed+=verloren;
    s.stats.vernichtet+=verloren;
    r.verlorenImTest=verloren;
    audit(s);
  }
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
  r.fondsNadirErhaltenMinimumISK=(cfg.trace.nadirFondsMindestISK-traceStart.nadirFondsMindestISK);
  r.fondsNadirErhaltenUeberschussISK=(cfg.trace.nadirFondsUeberschussISK-traceStart.nadirFondsUeberschussISK);
  r.eisVorverkaufMenge=(cfg.trace.eisVonMiner-traceStart.eisVonMiner);
  r.eisOriginalAnkaufISK=(cfg.trace.eisAnkaufISK-traceStart.eisAnkaufISK);
  r.eisOriginalVerkaeufe=(cfg.trace.minerVerkaeufe-traceStart.minerVerkaeufe);
  r.eisMinerOriginalGezahltISK=(cfg.trace.minerArbeitBezahlt-traceStart.minerArbeitBezahlt);
  r.eisMinerOriginalSollISK=(cfg.trace.minerArbeitSoll-traceStart.minerArbeitSoll);
  r.nahrungOriginalProduziert=(cfg.trace.produktion-traceStart.produktion);
  r.nahrungOriginalLokalVerbraucht=(cfg.trace.lokalGegessen-traceStart.lokalGegessen);
  const newlySold=cfg.trace.verkauft.slice(soldAtStart);
  assert.equal(newlySold.length,r.menge,'nur aktuelle reale FIFO-Charge');
  r.verfolgteEisEinheiten=sum(newlySold.map(x=>x.eisAnzahl));
  r.quellEisIstAnkaufISK=sum(newlySold.map(x=>x.eisAnkaufISK));
  r.quellFabriklohnISK=sum(newlySold.map(x=>x.lohnISK));
  r.minerArbeitskostenAnteilISK=r.verfolgteEisEinheiten*
    rules.world.betriebskosten.miner/rules.economy.stunde;
  assert(Number.isSafeInteger(r.minerArbeitskostenAnteilISK));
  assert(r.minerArbeitskostenAnteilISK<=r.eisMinerOriginalGezahltISK,
    'alle anteiligen Miner-Betriebskosten durch echten Miner bezahlt');
  assert.equal(r.verfolgteEisEinheiten,2*r.menge);
  assert.equal(r.quellFabriklohnISK,24*r.menge);
  r.nadirFondsMindestISK=(cfg.trace.nadirFondsMindestISK-traceStart.nadirFondsMindestISK);
  r.nadirFondsUeberschussISK=(cfg.trace.nadirFondsUeberschussISK-traceStart.nadirFondsUeberschussISK);
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
  if(extras.returnSave)r.finalSaved=core.save(s);
  if(extras.continueTrace||extras.returnSave)r.remainingTrace={
    eisLots:cfg.trace.eisLots.length,foodLots:cfg.trace.foodLots.length,
    active:cfg.trace.offen.size};
  if(ausgabe)console.log('B-K10k echte Bergbau-Fabrik-Transport- und Bestellrechnung',JSON.stringify(r));
  return r;
}

test('B-K11h: bestehende echte Core-Lieferung aus bezahltem Eis und Factory-/Frachterarbeit unveraendert wiederholt',()=>{
  for(const [seed,expectedHash] of [[42,'7f65cee9b1330747'],[7,'f2f8983d53c26e3d']]){
    const start=snapshot(seed),r=run(start.saved,seed,'bestellung',false,24);
    assert.equal(r.menge,24);
    assert.equal(r.verfolgteEisEinheiten,48);
    assert.equal(r.quellEisIstAnkaufISK,1056);
    assert.equal(r.quellFabriklohnISK,576);
    assert.equal(r.eisMinerOriginalGezahltISK,r.eisMinerOriginalSollISK);
    assert.equal(r.direktAbsatzMenge,24);
    assert.equal(r.direktAbsatzISK,1296);
    assert.equal(r.flugGezahltISK,499);
    assert.equal(r.erstattetISK,0);
    assert.equal(r.hash,expectedHash,'urspruenglichen R15-/Schema9-Testreferenzhash unabhaengig beibehalten');
    assert.equal(r.kettenbeitragNachEchtenBetriebskostenISK,29);
    assert.equal(r.eisQuellstationDeckungISK,-1032);
    assert(r.fondsNadirErhaltenMinimumISK>0,'Quelle benoetigt vorhandenes regionales Fondsgeld');
    console.log('BK11H_SUCCESS '+JSON.stringify({seed,hash:r.hash,iceBought:r.quellEisIstAnkaufISK,
      factoryWage:r.quellFabriklohnISK,miningPaid:r.eisMinerOriginalGezahltISK,
      freightPaid:r.flugGezahltISK,orderedISK:r.direktAbsatzISK,sourceContribution:r.eisQuellstationDeckungISK,
      groupContribution:r.kettenbeitragNachEchtenBetriebskostenISK,sourceFund:r.fondsNadirErhaltenMinimumISK}));
  }
});
test('B-K11h: auf realem Flug vernichtete Neuware niemals als zivilen Verbrauch oder verdiente Zahlung behandeln',()=>{
 for(const seed of [42,7]){
  const start=snapshot(seed);
  const success=run(start.saved,seed,'bestellung',false,24);
  const lost=run(start.saved,seed,'bestellung',false,24,{lossInTransit:true,returnSave:true});
  assert.equal(lost.menge,24);
  assert.equal(lost.hash,seed===42?'7f628068dedb1aea':'b84997113b084206',
    'Testverlust reproduziert seinen eigenstaendigen festen Seed-Hash');
  assert.equal(lost.verlorenImTest,24);
  assert.equal(lost.beladen,24);
  assert.equal(lost.nach10hFrachterRest,0);
  assert.equal(lost.direktAbsatzMenge,0);
  assert.equal(lost.direktAbsatzISK,0);
  assert.equal(lost.direktGebuehrISK,0);
  assert.equal(lost.vorStornoRestISK,1296,'unverdienter ganzer Auftrag bleibt gesperrt');
  assert.equal(lost.erstattetISK,1296,'vollstaendige Rueckerstattung nach realem Frachtverlust');
  assert.equal(lost.quellEisIstAnkaufISK,success.quellEisIstAnkaufISK);
  assert.equal(lost.quellFabriklohnISK,success.quellFabriklohnISK);
  assert.equal(lost.eisMinerOriginalGezahltISK,success.eisMinerOriginalGezahltISK);
  assert.equal(lost.flugGezahltISK,success.flugGezahltISK);
  assert.equal(lost.einkaufISK,success.einkaufISK);
  assert(lost.haendlerCashDelta<0,'bezahlt erfolgte Fahrt ohne Verkaufserloes');
  const s=core.load(lost.finalSaved,undefined,rules);
  assert.equal(s.ledger.nahrung.consumed>=24,true);
  assert.equal(s.stats.vernichtet>=24,true,'Ladung wurde physisch zerstoert');
  assert.equal(s.haushaltNeuLedger.transit,0,'keine frei schwebende Neuware');
  assert.equal(s.vertraege.eintraege[cfg.order.id].rest,0);
  audit(s);
  assert.equal(core.hash(s),lost.hash);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),lost.hash);
  console.log('BK11H_LOSS '+JSON.stringify({seed,hash:lost.hash,priceRefund:lost.erstattetISK,
    realCargoDestroyed:lost.verlorenImTest,consumerDelivered:lost.direktAbsatzMenge,
    factoryWagesPaid:lost.quellFabriklohnISK,realFlightPaid:lost.flugGezahltISK,
    traderChange:lost.haendlerCashDelta,minted:s.minted,burned:s.burned}));
 }
});
test('B-K11h: erneute echte Endkunden-Vorfinanzierung moeglich, jedoch KEIN zweiter Warenkreislauf bewiesen',()=>{
 for(const seed of [42,7]){
  const start=snapshot(seed);
  const r=run(start.saved,seed,'bestellung',false,24,{returnSave:true});
  const s=core.load(r.finalSaved,undefined,rules);
  const moneyBefore=s.owners[H].cash;
  const needed=r.preisZielBeiBestellung*24;
  assert.equal(needed,1296);
  assert(moneyBefore>=needed,'tatsaechlicher Haushaltslohn aus fortlaufender Produktion');
  assert(r.fondsNadirErhaltenMinimumISK>0,'Konsumnachfrage stammt indirekt aus vorheriger Fondsfinanzierung');
  const mintedBefore=s.minted,burnedBefore=s.burned,supply=s.initialSupply+s.minted-s.burned;
  const id=core.vertrag.reservieren(s,H,'house',needed);
  assert(id,'echtes Core-Budget fuer moeglichen Folgeauftrag');
  assert.equal(s.owners[H].cash,moneyBefore-needed);
  assert.equal(s.vertraege.eintraege[id].rest,needed);
  audit(s);
  assert(core.vertrag.abschliessen(s,id),'kein zweiter Produktkauf ohne Ware');
  assert.equal(s.owners[H].cash,moneyBefore);
  assert.equal(s.minted,mintedBefore);assert.equal(s.burned,burnedBefore);
  assert.equal(s.initialSupply+s.minted-s.burned,supply);
  audit(s);
  console.log('BK11H_REBOOK '+JSON.stringify({seed,buyerCash:moneyBefore,secondBudget:needed,
    couldPrefinanceSecond:true,secondActuallyDelivered:false,
    sourceFundTransfer:r.fondsNadirErhaltenMinimumISK}));
 }
});


test('B-K11i: ZWEI tatsaechliche R15-Lieferungen im selben Save, jede neu vorfinanziert und auditiert',()=>{
 for(const seed of [42,7]){
  const start=snapshot(seed);
  const first=run(start.saved,seed,'bestellung',false,24,{returnSave:true});
  assert.equal(first.direktAbsatzMenge,24);
  const initialSecondHash=core.hash(core.load(first.finalSaved,undefined,rules));
  const firstSourceCash=first.nadirEndKasse;
  const firstBuyerCash=first.haushaltCashEnde;
  assert(firstBuyerCash>=1296,'echte Haushaltseinnahmen decken zweite Bestellung');
  const second=run(first.finalSaved,seed,'bestellung',false,24,
    {continueTrace:true,returnSave:true});
  const after=core.load(second.finalSaved,undefined,rules);
  assert.notEqual(second.hash,initialSecondHash,'zweiter echter Durchlauf statt Kopie');
  assert.equal(second.menge,24);
  assert.equal(second.direktAbsatzMenge,24,'zweite Lieferung tatsaechlich konsumiert');
  assert.equal(second.direktAbsatzISK,24*second.preisZielBeiBestellung);
  assert(second.verfolgteEisEinheiten===48);
  assert(second.eisOriginalAnkaufISK>0,'auch im zweiten Zeitraum kauft die Station echtes Eis');
  assert(second.nahrungOriginalProduziert>0,'auch im zweiten Zeitraum produziert die Station echt');
  assert(second.quellFabriklohnISK===576);
  assert(second.flugGezahltISK>0);
  assert(second.fondsNadirErhaltenMinimumISK>=0);
  assert(second.konsumKontozahlungISK>=second.direktAbsatzISK);
  assert.equal(second.erstattetISK,0);
  audit(after);assert.equal(core.hash(after),second.hash);
  assert.equal(core.hash(core.load(core.save(after),undefined,rules)),second.hash);
  console.log('BK11I_TWO_REAL '+JSON.stringify({seed,firstHash:first.hash,secondHash:second.hash,
    firstDelivery:first.direktAbsatzMenge,secondDelivery:second.direktAbsatzMenge,
    firstBuyerISK:first.startHaushaltCash,afterFirstBuyerISK:firstBuyerCash,
    secondBuyerAtStart:second.startHaushaltCash,
    firstSourceCash,secondSourceCash:second.nadirEndKasse,
    firstFundMinimum:first.nadirFondsMindestISK,secondFundMinimum:second.nadirFondsMindestISK,
    firstSourceContribution:first.eisQuellstationDeckungISK,
    secondSourceContribution:second.eisQuellstationDeckungISK,
    secondNewIceBought:second.eisVorverkaufMenge,
    secondNewProduction:second.nahrungOriginalProduziert,
    secondFreightCost:second.flugGezahltISK,secondPaidOrderISK:second.direktAbsatzISK}));
 }
});
test('B-K11i: ohne regionale Fonds-Mindestzahlung kann reale Source-Fabrik keine 24er-Charge finanzieren',()=>{
 const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
 try{
  for(const seed of [42,7]){
   const start=snapshot(seed);
   rules.world.mindeststand=0;
   rules.world.fondsObergrenze=1_000_000_000;
   cfg.mode=null;cfg.order=null;cfg.ship=null;
   cfg.trace=traceNeu();journal.length=0;
   const state=core.load(start.saved,undefined,rules);
   ticks(state,480);
   audit(state);
   const available=core.verkaufbar(state,rules,S,'nahrung');
   const realCash=state.owners[S].cash;
   const produced=state.stats.rezepte[S];
   assert(available<24,'ohne Mindeststand-Fonds keine tatsaechlich verkaufbare volle Charge');
   assert.equal(cfg.trace.nadirFondsMindestISK,0);
   assert.equal(cfg.trace.nadirFondsUeberschussISK,0);
   assert.equal(core.hash(core.load(core.save(state),undefined,rules)),core.hash(state));
   console.log('BK11I_NO_FUND '+JSON.stringify({seed,available,stationCash:realCash,
     actualProduction:produced,canStartFirstFullDelivery:available>=24,
     canCompleteTwoFullDeliveries:false,minimumFundISK:0,hash:core.hash(state)}));
  }
 } finally {
   rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
 }
});


test('B-K11i: Fonds AUS erst NACH identischer erster bezahlter Lieferung, zweite reale Charge nur falls gedeckt',()=>{
 const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
 try{
  for(const seed of [42,7]){
   // Gleicher erster Fonds-Aktiv-Lauf in beiden Seeds, erst danach Ausschaltung.
   rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
   const start=snapshot(seed);
   const first=run(start.saved,seed,'bestellung',false,24,{returnSave:true});
   const afterFirstHash=first.hash;
   const sourceAfterFirst=first.nadirEndKasse;
   const realFirstBuyerCash=first.haushaltCashEnde;
   rules.world.mindeststand=0;
   rules.world.fondsObergrenze=1_000_000_000;
   const second=run(first.finalSaved,seed,'bestellung',false,24,
     {continueTrace:true,returnSave:true,allowBlocked:true});
   assert.equal(second.blocked?second.fondstransfersSinceFirst:
     second.nadirFondsMindestISK,0,'zweiter Versuch erhielt kein regionales Fonds-Mindestgeld');
   assert.notEqual(second.hash,afterFirstHash,'wirklich weitergelaufene gleiche Welt');
   const state=core.load(second.finalSaved,undefined,rules);
   audit(state);
   assert.equal(core.hash(core.load(core.save(state),undefined,rules)),second.hash);
   if(second.blocked){
     assert(second.saleable<24,'keine volle zweite Charge ohne ausgeglichenes Material');
     console.log('BK11I_AFTER_FIRST_FUND_OFF '+JSON.stringify({
       seed,firstSourceCash:sourceAfterFirst,buyerCash:realFirstBuyerCash,
       secondDelivered:0,reason:second.reason,firstHash:afterFirstHash,
       laterHash:second.hash,available:second.saleable,
       secondNewProduction:second.producedSinceFirst,sourceCash:second.stationCash,
       fundMinimumPaid:0
     }));
   }else{
     assert.equal(second.direktAbsatzMenge,24);
     console.log('BK11I_AFTER_FIRST_FUND_OFF '+JSON.stringify({
       seed,firstSourceCash:sourceAfterFirst,buyerCash:realFirstBuyerCash,
       secondDelivered:second.direktAbsatzMenge,firstHash:afterFirstHash,
       laterHash:second.hash,sourceCash:second.nadirEndKasse,
       secondNewProduction:second.nahrungOriginalProduziert,
       secondSourceContribution:second.eisQuellstationDeckungISK,
       fundMinimumPaid:0
     }));
   }
  }
 }finally{rules.world.mindeststand=min;rules.world.fondsObergrenze=max;}
});

test('B-K11j: erster realer Finanzierungsgate nach zwei voll bezahlten Lieferungen ohne Fonds',()=>{
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  try {
    for(const [seed,secondHash,secondSource] of [
      [42,'fecad114e0b10608',917],[7,'1bd24ad0814a5dc1',1041]
    ]){
      rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
      cfg.gateLog=null;
      const start=snapshot(seed);
      const first=run(start.saved,seed,'bestellung',false,24,{returnSave:true});
      rules.world.mindeststand=0;rules.world.fondsObergrenze=1_000_000_000;
      const second=run(first.finalSaved,seed,'bestellung',false,24,
        {continueTrace:true,returnSave:true,allowBlocked:true});
      assert.equal(second.blocked,undefined,'zweite reale Lieferung muss erfolgen');
      assert.equal(second.hash,secondHash,'identischer zweiter Save wie B-K11i');
      assert.equal(second.nadirEndKasse,secondSource);
      const s=core.load(second.finalSaved,undefined,rules);
      audit(s);
      const kassen=state=>{
        const miner=state.ships.sh009.owner;
        return Object.fromEntries([S,'hh_'+S,H,'house',miner,'fonds_nadir','fonds_aldera']
          .filter((x,i,a)=>a.indexOf(x)===i&&state.owners[x])
          .map(id=>[id,state.owners[id].cash]));
      };
      const kontenStart=kassen(s),nachZweiter=s.tick;
      const traceStart={
        eisVonMiner:cfg.trace.eisVonMiner,
        minerVerkaeufe:cfg.trace.minerVerkaeufe,
        eisAnkaufISK:cfg.trace.eisAnkaufISK,
        produktion:cfg.trace.produktion,
        minerArbeitBezahlt:cfg.trace.minerArbeitBezahlt,
        minerArbeitSoll:cfg.trace.minerArbeitSoll,
        fondsMindest:cfg.trace.nadirFondsMindestISK
      };
      cfg.mode=null;cfg.order=null;cfg.ship=null;
      cfg.gateLog=[];
      // Original-Core: Miner verkörpern wirkliche Folgegeschaefte, Fabrik
      // versucht die naechsten realen Vorfinanzierungen, ohne Geldinjektion.
      for(let i=0;i<2880&&cfg.gateLog.length===0;i++){
        core.step(s,rules);
        if(s.tick%60===0)audit(s);
      }
      assert(cfg.gateLog.length>0,'in 48h muss ein wirklicher Kontogate erreicht werden');
      const erster=cfg.gateLog[0];
      assert(erster.tick>=nachZweiter,'kein historisches Event wiederverwendet');
      assert(erster.fehlbetragISK>0,'tatsaechlich nicht gedeckte Mittelbindung');
      assert(erster.vorhandenISK<erster.brauchtISK,'kein bloßer Buchungs-/Lagerfehler');
      assert.equal(cfg.trace.nadirFondsMindestISK,traceStart.fondsMindest,
        'Fonds hat nach erster Lieferung kein Mindestkapital neu eingespeist');
      audit(s);
      const endHash=core.hash(s),save=core.save(s);
      assert.equal(core.hash(core.load(save,undefined,rules)),endHash);
      const kassenEnde=kassen(s),kontodifferenz=Object.fromEntries(
        Object.keys(kontenStart).map(id=>[id,kassenEnde[id]-kontenStart[id]]));
      const belege={
        seed,ausgangspunkt:secondHash,tickNachZweiter:nachZweiter,
        ersterFinanzierungsGate:erster,tickEnde:s.tick,minutenSeitZweiter:s.tick-nachZweiter,
        kassenVorher:kontenStart,kassenNachher:kassenEnde,kassenDelta:kontodifferenz,
        neuerEisAnkauf:cfg.trace.eisAnkaufISK-traceStart.eisAnkaufISK,
        neueEisMenge:cfg.trace.eisVonMiner-traceStart.eisVonMiner,
        neueEisVerkaeufe:cfg.trace.minerVerkaeufe-traceStart.minerVerkaeufe,
        neueNahrung:cfg.trace.produktion-traceStart.produktion,
        minerGeleisteteKosten:cfg.trace.minerArbeitSoll-traceStart.minerArbeitSoll,
        minerTatsaechlichBezahlt:cfg.trace.minerArbeitBezahlt-traceStart.minerArbeitBezahlt,
        fondsNeu:cfg.trace.nadirFondsMindestISK-traceStart.fondsMindest,
        nahrungLager:s.stations[S].lager.nahrung,eisLager:s.stations[S].lager.eis,
        offenesEscrowISK:sum(Object.values(s.vertraege.eintraege).map(x=>x.rest)),
        supply:s.initialSupply+s.minted-s.burned,
        hash:endHash
      };
      console.log('BK11J_FIRST_GATE '+JSON.stringify(belege));
      cfg.gateLog=null;
    }
  } finally {
    cfg.gateLog=null;rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
  }
});

test('B-K11j: aktive echte Folgelieferungen ab identischem zweitem Save bis zum ersten Kontogate',()=>{
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  try {
    for(const [seed,expected] of [[42,'fecad114e0b10608'],[7,'1bd24ad0814a5dc1']]){
      cfg.gateLog=null;
      rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
      const start=snapshot(seed);
      const first=run(start.saved,seed,'bestellung',false,24,{returnSave:true});
      rules.world.mindeststand=0;rules.world.fondsObergrenze=1_000_000_000;
      const second=run(first.finalSaved,seed,'bestellung',false,24,
        {continueTrace:true,returnSave:true,allowBlocked:true});
      assert.equal(second.hash,expected);
      let save=second.finalSaved;
      const auftraege=[];
      cfg.gateLog=[];
      for(let lieferung=3;lieferung<=8;lieferung++){
        const outcome=run(save,seed,'bestellung',false,24,
          {continueTrace:true,returnSave:true,allowBlocked:true});
        auftraege.push({
          lieferung,tick:outcome.tick??null,blocked:!!outcome.blocked,reason:outcome.reason||null,
          gate:outcome.gate||null,requiredBudgetISK:outcome.requiredBudgetISK??null,
          buyerISK:outcome.buyerCash??null,shortfallISK:outcome.shortfallISK??null,
          buyerCashDelta:outcome.buyerCashDelta??null,
          stationCashDelta:outcome.stationCashDelta??null,
          stationRevenues:outcome.nadirErloeseDelta??null,
          stationCosts:outcome.nadirKostenDelta??null,
          nadirHHDelta:outcome.nadirHaushaltCashDelta??null,
          newerEiskaufISK:outcome.neuerEisAnkaufISK??null,
          neueNahrung:outcome.neueNahrung??null,
          saleableFood:outcome.saleable??null,
          geliefert:outcome.direktAbsatzMenge||0,
          bezahltISK:outcome.direktAbsatzISK||0,
          quellKasse:outcome.nadirEndKasse??outcome.stationCash,
          haushaltKasse:outcome.haushaltCashEnde??outcome.buyerCash,
          produktionsmenge:outcome.nahrungOriginalProduziert??outcome.producedSinceFirst,
          fondsMinimumISK:outcome.nadirFondsMindestISK??outcome.fondstransfersSinceFirst,
          hash:outcome.hash
        });
        save=outcome.finalSaved;
        if(outcome.blocked || cfg.gateLog.length)break;
      }
      assert.equal(auftraege.length,1,'exakt die dritte reale Bestellung ist das erste aktive Blocker-Gate');
      assert.equal(auftraege[0].lieferung,3);
      assert.equal(auftraege[0].gate,'haushalt-bestellung');
      assert.equal(auftraege[0].geliefert,0);
      assert.equal(auftraege[0].requiredBudgetISK,1296);
      assert.equal(auftraege[0].buyerISK,seed===42?796:956);
      assert.equal(auftraege[0].shortfallISK,seed===42?500:340);
      assert.equal(auftraege[0].saleableFood,37);
      const s=core.load(save,undefined,rules);
      audit(s);
      const firstGate=cfg.gateLog[0]??null;
      assert.equal(firstGate,null,'vor dem dritten Bestellungsversuch war noch kein Nadir-Lohn-Escrow blockiert');
      assert.equal(core.hash(s),auftraege.at(-1).hash);
      assert.equal(core.hash(s),seed===42?'14f991547a41737c':'28a52381e2b2561e',
        'dritter abgewiesener Core-Geschäftsabschluss ist deterministisch gepinnt');
      assert.equal(s.ships[Object.keys(s.ships).find(id=>s.ships[id].owner==='house'&&s.ships[id].klasse==='frachter')].neuLadungNahrung||0,0,
        'keine dritte Nahrung durch abgewiesene Bestellung an den Spieler verschenkt');
      assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
      console.log('BK11J_ACTIVE_CONTINUATION '+JSON.stringify({
        seed,secondHash:expected,auftraege,firstGate,
        nadirCash:s.owners[S].cash,
        buyerCash:s.owners[H].cash,
        traderCash:s.owners.house.cash,
        minerCash:s.owners[s.ships.sh009.owner].cash,
        fondNadir:s.owners.fonds_nadir.cash,
        foodStock:s.stations[S].lager.nahrung,
        saleableFood:core.verkaufbar(s,rules,S,'nahrung'),
        finalHash:core.hash(s)
      }));
      cfg.gateLog=null;
    }
  }finally{
    cfg.gateLog=null;rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
  }
});

test('B-K11j: nach abgewiesenem 24er-Auftrag echten kleineren Drittauftrag im SELBEN Save ausfuehren',()=>{
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  try {
    for(const seed of [42,7]){
      cfg.gateLog=null;rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
      const initial=snapshot(seed);
      const first=run(initial.saved,seed,'bestellung',false,24,{returnSave:true});
      rules.world.mindeststand=0;rules.world.fondsObergrenze=1_000_000_000;
      const second=run(first.finalSaved,seed,'bestellung',false,24,
        {continueTrace:true,returnSave:true,allowBlocked:true});
      assert.equal(second.direktAbsatzMenge,24);
      cfg.gateLog=[];
      const third=run(second.finalSaved,seed,'bestellung',false,24,
        {continueTrace:true,returnSave:true,allowBlocked:true});
      assert.equal(third.gate,'haushalt-bestellung');
      const s=core.load(third.finalSaved,undefined,rules);
      audit(s);
      const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
      assert(sh&&sh.system==='nadir'&&sh.phase==='dock');
      const p=core.preis(s,Z,'nahrung',rules),buyer0=s.owners[H].cash;
      const source0=s.owners[S].cash,trader0=s.owners.house.cash;
      const verfuegbar=core.verkaufbar(s,rules,S,'nahrung');
      const menge=Math.min(verfuegbar,Math.floor(buyer0/p),24);
      assert(menge>0&&menge<24,'kleinere Lieferung als Gegenprobe zu teurer 24er-Charge');
      const budget=menge*p;
      const id=core.vertrag.reservieren(s,H,'house',budget);
      assert(id,'wirklich finanzierter kleinerer Haushaltvertrag');
      cfg.mode='bestellung';cfg.ship=sh.id;cfg.order={id,menge,preis:p};
      cfg.delivered=0;cfg.pay=0;cfg.fees=0;
      audit(s);
      command(s,sh,'shipTrade',{ware:'nahrung',menge,kauf:true});
      assert.equal(sh.neuLadungNahrung,menge,'tatsaechliche Neuware auf bezahltem Frachter');
      command(s,sh,'shipMove',{ziel:Z});
      angekommen(s,sh,'aldera');complete(s,sh);
      ticks(s,600);
      const e=s.vertraege.eintraege[id];
      assert.equal(cfg.delivered,menge,'echter Endverbrauch von kleinerer neuer Fracht');
      assert.equal(cfg.pay,budget,'genau vertraglich zugesagte ISK, kein Gratisgeld');
      assert.equal(e.gezahlt,budget);
      assert.equal(e.rest,0);
      assert(core.vertrag.abschliessen(s,id));
      audit(s);
      // Nach wirklich bezahlter kleiner Lieferung: naechster kleinster
      // Kundenauftrag ist JETZT ebenfalls nicht gedeckt (ohne Zukunftseinkommen zu behaupten).
      const preisEinzel=core.preis(s,Z,'nahrung',rules);
      const restKunde=s.owners[H].cash;
      assert(restKunde<preisEinzel,'kein einziges neues Stueck aus aktueller Haushaltskasse');
      const vorEinzelversuch=core.hash(s);
      assert.equal(core.vertrag.reservieren(s,H,'house',preisEinzel),null,
        'Original-Core verweigert wirklich die naechste kleinste Reservierung');
      assert.equal(core.hash(s),vorEinzelversuch,'fehlgeschlagene Reservierung ohne Seiteneffekt');
      audit(s);
      const hash=core.hash(s);
      assert.equal(core.hash(core.load(core.save(s),undefined,rules)),hash);
      assert.equal(cfg.trace.nadirFondsMindestISK-second.nadirFondsMindestISK-first.nadirFondsMindestISK,0,
        'auch bei Drittlieferung kein neuer Nadir-Mindesttransfer');
      console.log('BK11J_PARTIAL_REAL_THIRD '+JSON.stringify({
        seed,tick:s.tick,fullOrderRejected:true,asked:24,
        affordable:menge,buyerStart:buyer0,priceEach:p,paidOrderISK:budget,
        realDelivered:cfg.delivered,unpaidRemainingCapacity:24-menge,
        sourceCashBefore:source0,sourceCashAfter:s.owners[S].cash,
        traderCashBefore:trader0,traderCashAfter:s.owners.house.cash,
        buyerCashAfter:s.owners[H].cash,
        nextSinglePrice:preisEinzel,nextSingleOrderRejected:true,
        fundNadir:s.owners.fonds_nadir.cash,
        addedFundMin:0,hash
      }));
      cfg.gateLog=null;
    }
  }finally{cfg.gateLog=null;rules.world.mindeststand=min;rules.world.fondsObergrenze=max;}
});


// B-K11k: nur aus den tatsaechlich durchlaufenen B-K11j-Auftraegen
// einen identischen Save nach der TEILWEISEN dritten Lieferung herstellen.
function bk11kNachDrittemTeilauftrag(seed){
  cfg.accountOnly=false;cfg.gateLog=null;
  const initial=snapshot(seed);
  const first=run(initial.saved,seed,'bestellung',false,24,{returnSave:true});
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  rules.world.mindeststand=0;rules.world.fondsObergrenze=1_000_000_000;
  assert(min>0 && max<1_000_000_000,'B-K11k setzt nach realem erstem Fondsstart ein');
  const second=run(first.finalSaved,seed,'bestellung',false,24,
    {continueTrace:true,returnSave:true,allowBlocked:true});
  assert.equal(second.direktAbsatzMenge,24);
  const rejected=run(second.finalSaved,seed,'bestellung',false,24,
    {continueTrace:true,returnSave:true,allowBlocked:true});
  assert.equal(rejected.gate,'haushalt-bestellung');
  const s=core.load(rejected.finalSaved,undefined,rules);
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  const p=core.preis(s,Z,'nahrung',rules),cash=s.owners[H].cash;
  const menge=Math.min(24,core.verkaufbar(s,rules,S,'nahrung'),Math.floor(cash/p));
  assert.equal(menge,seed===42?14:17);
  const id=core.vertrag.reservieren(s,H,'house',menge*p);
  assert(id,'reale Teilbestellung finanziert');
  cfg.mode='bestellung';cfg.ship=sh.id;cfg.order={id,menge,preis:p};
  cfg.delivered=0;cfg.pay=0;cfg.fees=0;
  command(s,sh,'shipTrade',{ware:'nahrung',menge,kauf:true});
  command(s,sh,'shipMove',{ziel:Z});
  angekommen(s,sh,'aldera');complete(s,sh);ticks(s,600);
  assert.equal(cfg.delivered,menge);assert.equal(cfg.pay,menge*p);
  assert(core.vertrag.abschliessen(s,id));
  audit(s);
  const h=core.hash(s);
  assert.equal(h,seed===42?'ed0151cdaa03a8a1':'61c198365462ede4');
  assert.equal(s.tick,3960);
  assert.equal(s.owners[H].cash,seed===42?40:38);
  return {saved:core.save(s),hash:h,partial:menge};
}

// Nur vorhandene Zahlungen/Buchungen, keine Eingriffe in Preise, Geld, Lohn.
// Zwei Gegenwelten aus DEMSELBEN echten Save; die experimentell angehaltenen
// NPC-Haendler werden allein durch Umstellen ihres schon vorhandenen
// auftrag-Felds freigegeben. Dies ist KEIN globaler Normalweltvergleich.
function bk11kKontopfad(save,seed,freigabe,minuten=2880){
  const s=core.load(save,undefined,rules);
  const startHash=core.hash(s),before={};
  const beobachtete=[H,'hh_'+S,Z,S,'house','npc1','npc2','npc3','fonds_aldera','fonds_nadir'];
  for(const id of beobachtete){
    const k=s.stats.konto[id]||{erloes:0,kosten:0};
    before[id]={cash:s.owners[id].cash,erloes:k.erloes,kosten:k.kosten};
  }
  const startMenge=s.stats.haushaltskauf[Z].menge;
  const startSupply=s.initialSupply+s.minted-s.burned;
  const startMinted=s.minted,startBurned=s.burned;
  const baselineShips=Object.fromEntries(Object.values(s.ships).map(sh=>[sh.id,{owner:sh.owner,klasse:sh.klasse}]));
  cfg.accountOnly=true;cfg.mode=null;cfg.ship=null;cfg.order=null;cfg.gateLog=null;
  journal.length=0;
  let released=0;
  if(freigabe){
    for(const sh of Object.values(s.ships)){
      if(sh.owner!=='house'&&sh.owner.startsWith('npc')
        && sh.klasse==='frachter'&&sh.auftrag==='halten'){
        sh.auftrag='handeln';released++;
      }
    }
    assert(released>0,'nur fuer Gegenarm echte vorher angehaltene NPC-Haendler freigegeben');
  }
  const firstAffordable=()=>s.owners[H].cash>=core.preis(s,Z,'nahrung',rules);
  assert.equal(firstAffordable(),false,'Start nach Teilauftrag unter Einheitskosten');
  let firstEarned=null,firstAble=null,firstFull=null;
  for(let i=0;i<minuten;i++){
    core.step(s,rules);
    if(s.tick%60===0){
      audit(s);
      if(s.tick%1440===0){
        const loaded=core.load(core.save(s),undefined,rules);
        assert.equal(core.hash(loaded),core.hash(s),'regel15 Save/Load des Markt-Gegenarms');
      }
    }
    if(firstEarned===null&&s.stats.konto[H].erloes>before[H].erloes)firstEarned=s.tick;
    if(firstAble===null&&firstAffordable())firstAble=s.tick;
    if(firstFull===null&&s.owners[H].cash>=core.preis(s,Z,'nahrung',rules)*24)firstFull=s.tick;
  }
  audit(s);
  const konten={};
  for(const id of beobachtete){
    const k=s.stats.konto[id]||{erloes:0,kosten:0};
    konten[id]={anfang:before[id].cash,ende:s.owners[id].cash,
      delta:s.owners[id].cash-before[id].cash,
      erloese:k.erloes-before[id].erloes,kosten:k.kosten-before[id].kosten};
    assert.equal(konten[id].ende,konten[id].anfang+konten[id].delta);
  }
  const handelFrachter=journal.filter(x=>x.art==='handel' &&
    baselineShips[x.schiff]?.owner.startsWith('npc')&&baselineShips[x.schiff]?.klasse==='frachter');
  const npcSales=handelFrachter.filter(x=>!x.kauf);
  const npcBuys=handelFrachter.filter(x=>x.kauf);
  const npcMinerSales=journal.filter(x=>x.art==='handel'&&!x.kauf &&
    baselineShips[x.schiff]?.owner.startsWith('npc')&&baselineShips[x.schiff]?.klasse==='miner');
  const traderMoves=journal.filter(x=>x.art==='flug'&&
    baselineShips[x.schiff]?.owner.startsWith('npc')&&baselineShips[x.schiff]?.klasse==='frachter');
  const hash=core.hash(s),saved=core.save(s);
  assert.equal(core.hash(core.load(saved,undefined,rules)),hash);
  const budget=24*core.preis(s,Z,'nahrung',rules);
  // Unabhaengige Original-Core-Gegenprobe auf einer Save-KOPIE:
  // ein echter 24er-Budgetvertrag ist verfuegbar, wenn und nur wenn
  // das lokale Haushaltskonto ausreichend ISK hat. Er wird wieder
  // geschlossen, ohne Lieferung oder Auszahlung zu fingieren.
  const pruef=core.load(saved,undefined,rules);
  const id=core.vertrag.reservieren(pruef,H,'house',budget);
  const reservierbar=id!==null;
  assert.equal(reservierbar,s.owners[H].cash>=budget);
  if(id){
    assert.equal(pruef.vertraege.eintraege[id].rest,budget);
    assert.equal(pruef.owners[H].cash,s.owners[H].cash-budget);
    audit(pruef);
    assert(core.vertrag.abschliessen(pruef,id));
    assert.equal(pruef.owners[H].cash,s.owners[H].cash);
  }else assert.equal(core.hash(pruef),hash);
  audit(pruef);
  return {seed,freigabe,baseline:startHash,released,fullOrderBudgetISK:budget,
    fullOrderReservierbar:reservierbar,
    minuten,tick:s.tick,firstEarned,firstAble,firstFull,
    HH_aldera:konten[H],HH_nadir:konten['hh_'+S],
    station_aldera:konten[Z],station_nadir:konten[S],
    spieler:konten.house,npc1:konten.npc1,npc2:konten.npc2,npc3:konten.npc3,
    fonds_aldera:konten.fonds_aldera,fonds_nadir:konten.fonds_nadir,
    npcFreighterBuys:npcBuys.length,npcFreighterSales:npcSales.length,
    npcMinerSales:npcMinerSales.length,npcFreighterFlights:traderMoves.length,
    foodConsumedAldera:s.stats.haushaltskauf[Z].menge-startMenge,
    priceFood:core.preis(s,Z,'nahrung',rules),
    liquid:s.owners[H].cash,
    totalMoneyBefore:startSupply,totalMoneyAfter:s.initialSupply+s.minted-s.burned,
    mintedDelta:s.minted-startMinted,burnedDelta:s.burned-startBurned,
    hash};
}

test('B-K11k: tatsaechliche Haushaltslohn-Konten und bestehende NPC-Handelswege kausal abgleichen',()=>{
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  try {
    for(const seed of [42,7]){
      rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
      const start=bk11kNachDrittemTeilauftrag(seed);
      assert.equal(rules.world.mindeststand,0);
      const still=bk11kKontopfad(start.saved,seed,false);
      const npc=bk11kKontopfad(start.saved,seed,true);
      assert.equal(still.baseline,start.hash);
      assert.equal(npc.baseline,start.hash);
      assert.equal(still.released,0);
      assert(npc.released>0);
      // *Wirklich* nur das Aktivieren der zuvor gehaltenen NPC-Haendler
      // trennt beide Vergleichswelten; globale Geldbilanz unabhaengig pruefen.
      assert(still.HH_aldera.anfang===npc.HH_aldera.anfang);
      assert(still.HH_nadir.anfang===npc.HH_nadir.anfang);
      assert(still.HH_aldera.anfang<54);
      assert(still.HH_nadir.anfang>1000);
      assert.equal(still.npcFreighterBuys,0);
      assert.equal(still.npcFreighterSales,0);
      assert(npc.npcFreighterBuys>0&&npc.npcFreighterSales>0);
      assert.equal(still.HH_aldera.erloese,0,'ohne NPC-Lieferung kein neuer Aldera-Lohn');
      assert(npc.HH_aldera.erloese>0,'neue reale Aldera-Produktion ist von Station bezahlt');
      assert(npc.HH_aldera.delta>0,'lokale Kaufkraft kommt durch reale Lohngeschaefte');
      assert(npc.firstEarned!==null&&npc.firstAble!==null);
      assert(npc.firstFull!==null,'24er Auftragsbudget nach bezahlter lokaler Produktion moeglich');
      assert.equal(still.fullOrderReservierbar,false);
      assert.equal(npc.fullOrderReservierbar,true);
      assert.equal(npc.fullOrderBudgetISK,1296);
      assert(npc.station_aldera.ende<10,'Aldera-Station finanziert Lohn und laeuft fast leer');
      assert(npc.npc1.ende<150&&npc.npc2.ende<150,
        'wiederbelebter NPC-Handel kostet den beiden Haendlerkonzernen Liquiditaet');
      const reference=seed===42
        ?{held:'39a8ef0e72def48d',npc:'0d47d35f43f1bac6'}
        :{held:'cc55753322483e85',npc:'e18524faeb778a7c'};
      assert.equal(still.hash,reference.held,'Kontrollhash aus ausgefuehrtem R15-Kontolauf');
      assert.equal(npc.hash,reference.npc,'NPC-Gegenhash aus ausgefuehrtem R15-Kontolauf');
      console.log('BK11K_ACCOUNT_FLOW '+JSON.stringify({seed,startHash:start.hash,
        still,npc,deltaHHAldera:npc.HH_aldera.delta-still.HH_aldera.delta,
        deltaHHNadir:npc.HH_nadir.delta-still.HH_nadir.delta}));
    }
  }finally{cfg.accountOnly=false;cfg.gateLog=null;
    rules.world.mindeststand=min;rules.world.fondsObergrenze=max;}
});


// B-K11l: unabhängig nachvollzogene Cash- und noch gesperrte
// Vertragsreserve-Salden; keine Buchung wird durch diese Rechnungen ausgelöst.
function bk11lOffeneReserve(s,owner){
  return sum(Object.values(s.vertraege.eintraege)
    .filter(v=>v.status==='offen'&&v.zahlender===owner)
    .map(v=>v.rest));
}
test('B-K11l: erste Finanzierungssperren und echte Gegenbuchungen im wiederbelebten NPC-Handel',()=>{
  const min=rules.world.mindeststand,max=rules.world.fondsObergrenze;
  const ids=['st_aldera','npc1','npc2','hh_st_aldera','fonds_aldera','st_nadir','fonds_nadir'];
  try{
    for(const seed of [42,7]){
      rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
      const third=bk11kNachDrittemTeilauftrag(seed);
      assert.equal(rules.world.mindeststand,0);
      const s=core.load(third.saved,undefined,rules);
      const startCash=Object.fromEntries(ids.map(id=>[id,{
        cash:s.owners[id].cash,reserve:bk11lOffeneReserve(s,id)}]));
      cfg.accountOnly=true;cfg.mode=null;cfg.ship=null;cfg.order=null;cfg.gateLog=null;
      cfg.l11={trades:[],events:[],firstPayroll:null,firstFlight:{}};
      journal.length=0;
      let release=0;
      for(const sh of Object.values(s.ships)){
        if(sh.owner!=='house'&&sh.owner.startsWith('npc')
          && sh.klasse==='frachter'&&sh.auftrag==='halten'){
          sh.auftrag='handeln';release++;
        }
      }
      assert.equal(release,5);
      for(let t=0;t<2880;t++){
        core.step(s,rules);
        if(s.tick%60===0)audit(s);
        if(s.tick%1440===0)assert.equal(
          core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
      }
      const endHash=core.hash(s);
      assert.equal(endHash,seed===42?'0d47d35f43f1bac6':'e18524faeb778a7c',
        'B-K11l beobachtet Original-Core ohne Tick-/Hash-Veraenderung');
      const flights=journal.filter(e=>e.art==='flug');
      const trade=cfg.l11.trades,ev=cfg.l11.events;
      const net={};const posten={};
      for(const id of ids){net[id]=0;posten[id]={};}
      function buchen(id,art,v){
        if(!Object.hasOwn(net,id)||v===0)return;
        net[id]+=v;posten[id][art]=(posten[id][art]||0)+v;
      }
      for(const t of trade){
        buchen(t.owner,t.kauf?'warenankauf':'warenabsatz',
          t.wert*(t.kauf?-1:1));
        buchen(t.station,t.kauf?'stationsverkauf':'stationseinkauf',
          t.wert*(t.kauf?1:-1));
        buchen(t.owner,'marktgebuehren',-t.fee);
        buchen(t.feeEmpfaenger,'gebuehrenempfang',t.fee);
      }
      for(const x of flights){
        assert(x.owner&&x.empfaenger,'Originalfluege mit realen Eigentuemern/Fonds');
        buchen(x.owner,'bezahlte-flugkosten',-x.betrag);
        buchen(x.empfaenger,'flugkostenempfang',x.betrag);
      }
      for(const e of ev){
        buchen(e.von,e.art,-e.isk);buchen(e.an,e.art,e.isk);
      }
      const actor={};
      for(const id of ids){
        const now=s.owners[id].cash,old=startCash[id].cash;
        const reserveAlt=startCash[id].reserve, reserveNeu=bk11lOffeneReserve(s,id);
        const liquidDelta=now-old;
        const kapDelta=liquidDelta+reserveNeu-reserveAlt;
        actor[id]={start:old,end:now,liquidDelta,
          reserveStart:reserveAlt,reserveEnd:reserveNeu,
          kapitalDelta:kapDelta,gebuchteFluesse:net[id],
          ungeklärt:kapDelta-net[id],posten:posten[id]};
      }
      const gates={firstPayroll:cfg.l11.firstPayroll,
        firstFlight:cfg.l11.firstFlight};
      const nachfrage=core.preis(s,'st_aldera','nahrung',rules)*24;
      assert.equal(nachfrage,1296);
      assert.equal(s.owners['hh_st_aldera'].cash>=nachfrage,true);
      assert(actor.npc1.end<150&&actor.npc2.end<150);
      assert(actor.st_aldera.end<10);
      assert(cfg.l11.firstPayroll||Object.keys(cfg.l11.firstFlight).length>0,
        'mindestens eine wirklich erreichte Finanzierungssperre statt nur Kassen-Naehe');
      assert(trade.some(x=>x.owner==='npc1'&&x.kauf));
      assert(trade.some(x=>x.owner==='npc2'&&x.kauf));
      console.log('BK11L_ACCOUNT_RECONCILIATION '+JSON.stringify({
        seed,base:third.hash,finalHash:endHash,gates,
        actor,tradeCount:trade.length,flightCount:flights.length,
        payrollEvents:ev.filter(x=>x.art==='produktionslohn').length,
        fundTransfers:ev.filter(x=>x.art.startsWith('fonds-')).length,
        npcTransfers:ev.filter(x=>x.art==='npc-abgabe').length,
        newMinted:s.minted,newBurned:s.burned
      }));
      // Unterdeckt ein weiterer Wertungseffekt die Einnahmen, offen ausweisen
      // statt einen Transfer in Test/Dokumentation zu erfinden.
      cfg.l11=null;
    }
  }finally{
    cfg.l11=null;cfg.accountOnly=false;cfg.gateLog=null;
    rules.world.mindeststand=min;rules.world.fondsObergrenze=max;
  }
});
