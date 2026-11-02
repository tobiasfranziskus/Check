// B-K10j: Gegenprobe Nadir -> Aldera, Station vs. vorfinanzierter Haushalt.
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
  "    if (!__bk10j_hold(s.id)) entladen(state, rules, s);");
// Direkt aus realer Ladung und vorhandener Haushaltsreserve zahlen, bevor der
// Core dieselbe stundenbasierte Nachfrage ein zweites Mal bedienen koennte.
einmal('      let n = Math.min(da, bedarf[ware]);',
  '      const direkt=__bk10j_direkt(state,rules,id,ware,bedarf[ware]);\n'+
  '      let n = Math.min(da, bedarf[ware]-direkt);');
einmal('state.stats.haushaltskauf[id].fehlend += bedarf[ware] - n;',
  'state.stats.haushaltskauf[id].fehlend += bedarf[ware] - direkt - n;');
einmal('if (n < bedarf[ware]) state.stats.mangel[id][ware] += 1;',
  'if (n < bedarf[ware]-direkt) state.stats.mangel[id][ware] += 1;');
// Nur die tatsaechlichen Original-Core-Handels- und Flugbelege ins Testjournal.
einmal("  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);\n"+
  "  __bk10j_journal.push({art:'handel',tick:state.tick,schiff:schiff.id,"+
  "station,menge,ware,kauf,wert,fee});");
const anchor="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
einmal(anchor,"    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
  "    __bk10j_journal.push({art:'flug',tick:state.tick,schiff:s.id,betrag:kosten});\n"+
  "  }\n  if (s.phase === 'dock') {");

const journal=[],cfg={mode:null,ship:null,order:null,delivered:0,pay:0,fees:0};
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
const modules=new Function('__bk10j_hold','__bk10j_direkt','__bk10j_journal',js+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,route:m_core_route.route};')(halten,direkt,journal);
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
  // Keine NPC-Haendler anhalten, keine Lager manipulieren, keine Fonds aendern.
  ticks(s,72*60);
  const player=Object.values(s.ships).find(x=>x.owner==='house'
    && x.klasse==='frachter'&&x.phase==='dock'&&x.system==='aldera');
  assert(player,'vorhandener Spielerfrachter am Ursprungsort');
  assert(s.owners[H].cash>10*core.preis(s,Z,'nahrung',rules));
  assert(s.stations[S].lokalNeuNahrung>=12);
  const saved=core.save(s);
  assert.equal(core.hash(core.load(saved,undefined,rules)),core.hash(s));
  return {saved,sha:core.hash(s)};
}
function run(saved,seed,mode,ausgabe=true){
  const s=core.load(saved,undefined,rules),sh=Object.values(s.ships)
    .find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert(sh);assert.equal(sh.system,'aldera');
  cfg.mode=mode;cfg.ship=sh.id;cfg.order=null;cfg.delivered=0;cfg.pay=0;cfg.fees=0;
  journal.length=0;
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
  const menge=Math.min(24,saleable,echtNeu,30);
  assert(menge>=10,'beide Seeds haben wirklich verkaufbare Nahrung');
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
    const id=cfg.order.id;
    assert(core.vertrag.abschliessen(s,id),'unverbrauchte Haushaltsreserve voll erstatten');
  }
  audit(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s));
  const ev=journal.filter(e=>e.schiff===sh.id);
  const k=ev.filter(x=>x.art==='handel'&&x.kauf&&x.station===S&&x.ware==='nahrung');
  const v=ev.filter(x=>x.art==='handel'&&!x.kauf&&x.station===Z&&x.ware==='nahrung');
  const fl=ev.filter(x=>x.art==='flug');
  r.einkaufISK=sum(k.map(x=>x.wert));
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
  r.nettobeleg=r.stationsAbsatzISK+r.direktAbsatzISK-r.einkaufISK-
    r.quellgebuehrISK-r.zielgebuehrISK-r.direktGebuehrISK-r.flugGezahltISK;
  // Hintergrundakteure koennen den Spieler nicht versteckt finanzieren:
  assert.equal(r.haendlerCashDelta,r.nettobeleg);
  r.konsumKontozahlungISK=s.stats.haushaltskauf[Z].isk-stats0.isk;
  r.supply=s.initialSupply+s.minted-s.burned;
  r.hash=core.hash(s);
  if(ausgabe)console.log('B-K10j Originalflug vs test-only Haushaltauftrag',JSON.stringify(r));
  return r;
}
test('B-K10j: Seed42/7 echte Fahrt, zwei Zahlungsmethoden, unveraenderte Warenbilanz',()=>{
  for(const seed of seeds){
    const start=snapshot(seed);
    const b=run(start.saved,seed,'station');
    const d=run(start.saved,seed,'bestellung');
    assert.equal(b.menge,d.menge,'gleiche reale Warenmenge');
    assert.equal(b.einkaufISK,d.einkaufISK,'gleicher realer Quelleinkauf');
    assert.equal(b.flugGezahltISK,d.flugGezahltISK,'gleiche bezahlte Fahrt');
    assert.equal(d.stationsAbsatzMenge,0,'bestellte Lieferung verwendet keine Stationsankaufkasse');
    assert(d.direktAbsatzMenge>0,'keine imaginäre nur gebuchte Nachfrage');
    assert(d.direktAbsatzMenge<=d.menge,'keine Mehrfachware');
    assert(d.endverbrauchNachAnkunft>=d.direktAbsatzMenge);
    assert(d.nach10hFrachterRest+d.direktAbsatzMenge===d.menge);
    assert(b.stationsAbsatzMenge<=b.menge);
    assert(d.direktAbsatzMenge>b.stationsAbsatzMenge,
      'Haushaltsbestellung muss reale zusaetzliche Endnachfrage erreichen');
  }
});
test('B-K10j: Seed42 identischer Ausgangsspielstand und deterministische Auftragslieferung',()=>{
  const start=snapshot(42);
  assert.deepEqual(run(start.saved,42,'bestellung',false),
    run(start.saved,42,'bestellung',false));
});
