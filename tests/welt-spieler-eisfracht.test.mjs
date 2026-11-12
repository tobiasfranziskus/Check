// F4 [DRAFT] – derselbe W5n-Eisfrachtvertrag, aber vom wirklich eigenen Frachter.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const Alt = require('../prototypes/w5ac/rule191-w5-ferry-core.js');
const geld = s => Object.values(s.owners).reduce((n, o) => n + o.cash, 0);
const pruefe = (w,s,phase) => {
  const a=w.audit(s);
  assert.equal(a.ok, true, phase + ': ' + JSON.stringify(a.fehler));
  assert.equal(geld(s), 33000, 'alle vorhandenen ISK verbucht');
  assert.equal(s.minted, 0); assert.equal(s.burned, 0);
};
function start(buyerCash) {
  const w = Welt.erstellen(buyerCash === undefined ? {} : { buyerCash, carrierCash: 2000 });
  const s = w.createState(42, { politik: { automatik: false } });
  const run = (owner,type,extra={}) => {
    const r=w.execute(s,{type,owner,...extra});
    assert.equal(r.ok,true,type+': '+r.reason);
    return r;
  };
  run('house','shipBuy',{klasse:'frachter',station:'st_aldera'});
  run('house','shipBuy',{klasse:'miner',station:'st_aldera'});
  const own=Object.values(s.ships).filter(x=>x.owner==='house');
  const fr=own.find(x=>x.klasse==='frachter'), miner=own.find(x=>x.klasse==='miner');
  assert.ok(fr&&miner);
  return {w,s,run,fr,miner};
}
function realIce(x) {
  x.run('house','shipShuttle',{schiff:x.miner.id,ware:'eis'});
  let i=0;
  while(x.s.w5n.mineVerkauft<50) {
    x.w.minute(x.s);
    assert.ok(++i<150,'50 wirkliche Eisförderungen, Dockverkauf und Arbeit');
  }
  assert.ok(x.s.stations.st_aldera.lager.eis>=50);
  // Der Miner bleibt ein eigenständiges finanzierbares Schiff. Für den
  // isolierten Fracht-Lohnvergleich die laufende freiwillige Bergbaurunde
  // original beenden und erst nach echter Dockrückkehr weiterprüfen.
  x.run('house','shipShuttleStop',{schiff:x.miner.id});
  let rueck=0;
  while(x.s.kanon.pendel[x.miner.id]){
    x.w.minute(x.s);
    assert.ok(++rueck<150,'Miner kehrt über Core-Dockmanöver zurück');
  }
  assert.equal(x.s.ships[x.miner.id].flug.lage,'angedockt');
  pruefe(x.w,x.s,'echte 50 Eis und Miner beendet');
  return i+rueck;
}
function nein(w,s,cmd,reason) {
  const before=w.canonical(s);
  const a=w.execute(s,cmd);
  assert.equal(a.ok,false,'muss abgelehnt sein: '+JSON.stringify(cmd));
  if(reason)assert.match(a.reason,reason);
  assert.equal(w.canonical(s),before,'Negativbefehl ohne Nebenwirkungen');
}
test('F4: Spieler kann originale 50-Eis-/490-ISK-Fracht erst nach realem Bergbau buchen', () => {
  const x=start(); const {w,s,fr}=x;
  const before=w.hash(s);
  const no=w.kern.pilotIceFreightQuote(s,fr.id);
  assert.equal(no.ok,false);assert.match(no.grund,/50er-Eischarge/);
  assert.equal(w.hash(s),before,'Quote ist ausschließlich lesend');
  nein(w,s,{type:'shipFreightIce',owner:'house',schiff:fr.id},/Eischarge/);
  nein(w,s,{type:'shipFreightIce',owner:'npc3',schiff:fr.id},/Besitzer/);
  realIce(x);
  const angebot=w.kern.pilotIceFreightQuote(s,fr.id);
  assert.equal(angebot.ok,true,angebot.grund);
  assert.deepEqual([angebot.eis,angebot.fracht,angebot.arbeit,angebot.gesamt,angebot.zeit],
    [250,240,120,490,60],'Preis und Fluglänge nur aus Original-W5n-Kalkulation');
  assert.equal(w.hash(s),w.hash(s));
  pruefe(w,s,'vor Originalauftrag');
});
test('F4: Originalvertrag reserviert Käufer-Eis und Frachttarif plus volle eigene Pilotenkasse',()=>{
  const x=start();realIce(x);const {w,s,fr}=x;
  const before={house:s.owners.house.cash,nadir:s.owners.st_nadir.cash,
    ice:s.stations.st_aldera.lager.eis,pilot:s.owners.pilot_house.cash,
    transport:s.owners.transport.cash,clock:s.tick};
  x.run('house','shipFreightIce',{schiff:fr.id});
  const a=s.w5n.frachtauftrag,j=s.kanon.spielerFrachten;
  assert.equal(fr.phase,'reise');assert.equal(fr.flug.lage,'transit');
  assert.equal(a.schiff,fr.id);assert.equal(fr.ladung.eis,50);
  assert.equal(s.stations.st_aldera.lager.eis,before.ice-50);
  assert.equal(s.owners.st_nadir.cash,before.nadir-490);
  assert.equal(s.owners.w5n_fracht_kauf.cash,490);
  assert.equal(s.owners.house.cash,before.house-120);
  assert.equal(s.owners.w5n_fracht_arbeit.cash,120);
  assert.equal(s.owners.transport.cash,before.transport,'keine fremden Speditionserlöse');
  assert.equal(j.auftraege.length,1);assert.equal(j.lohn,0);assert.equal(j.gebuehr,0);
  nein(w,s,{type:'shipFreightIce',owner:'house',schiff:fr.id},/physisch angedockt/);
  nein(w,s,{type:'shipUndock',owner:'house',schiff:fr.id},/nur Miner|Frachter/);
  pruefe(w,s,'gebundener Frachtvertrag');
  w.advance(s,1);
  assert.equal(s.owners.pilot_house.cash,before.pilot+1,'original bezahlte Pilotenminute an Spielerkonto');
  assert.equal(s.kanon.spielerFrachten.lohn,1);
  assert.equal(s.owners.pilot_eis.cash,0,'W5ag-Originalkonto nur legitimes Durchlaufkonto');
  assert.equal(s.owners.w5n_fracht_arbeit.cash,119);
  assert.equal(s.owners.transport.cash,before.transport);
  pruefe(w,s,'erste bezahlte Frachtminute');
  const seed=w.save(s),hash=w.hash(s);
  assert.equal(w.hash(w.load(seed)),hash,'Save/Load mitten im bezahlten Transit');
  w.advance(s,59);
  assert.equal(s.tick,before.clock+60);
  assert.equal(s.w5n.eisGeliefert,50,'Original-W5n liefert Ware in Nadir');
  assert.equal(fr.ladung.eis,0);assert.equal(s.stations.st_nadir.lager.eis,50);
  assert.equal(s.owners.w5n_fracht_kauf.cash,240,'Eispreis nach Ablieferung, Frachtzahlung erst später');
  assert.equal(s.kanon.spielerFrachten.auftraege[0].geliefert,s.tick);
  assert.equal(s.owners.pilot_house.cash,before.pilot+60);
  pruefe(w,s,'reale Ablieferung in Nadir');
  w.advance(s,60);
  assert.equal(fr.system,'aldera');assert.equal(fr.phase,'dock');assert.equal(fr.flug.lage,'angedockt');
  assert.equal(s.w5n.frachtauftrag,null);assert.equal(s.w5n.frachtAbgeschlossen,1);
  assert.equal(s.owners.w5n_fracht_kauf.cash,0);assert.equal(s.owners.w5n_fracht_arbeit.cash,0);
  assert.equal(s.owners.house.cash,before.house+120,'Originaltarif 240 minus 120 bezahlte Arbeitskosten');
  assert.equal(s.owners.transport.cash,before.transport,'keine NPC-Umleitung des Spielerentgelts');
  assert.equal(s.owners.pilot_house.cash,before.pilot+120);
  assert.equal(s.kanon.spielerFrachten.gebuehr,240);
  assert.equal(s.kanon.spielerFrachten.lohn,120);
  assert.equal(s.kanon.spielerFrachten.auftraege[0].end,s.tick);
  const report=w.bericht(s);
  assert.equal(report.auftraege.spielerEisfracht,1);
  assert.equal(report.loehne.spielerFrachtpilot,120);
  pruefe(w,s,'komplett bezahlte 120-Minuten-Rundfahrt');
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'Hash bleibt bei Export/Import stabil');
});
test('F4: Unterfinanzierter Kunde wird nicht durch heimliches Zusatzgeld gerettet',()=>{
  const x=start(489);
  realIce(x);
  const a=x.w.kern.pilotIceFreightQuote(x.s,x.fr.id);
  assert.equal(a.ok,false);assert.match(a.grund,/Nadir kann Eis/);
  nein(x.w,x.s,{type:'shipFreightIce',owner:'house',schiff:x.fr.id},/Nadir kann Eis/);
  assert.equal(x.s.kanon.spielerFrachten,undefined);
  pruefe(x.w,x.s,'Käuferunterdeckung ohne Rettung');
});
test('F4: Manipulierte Pilotenzahlung, Kaufbeleg und Frachtabschluss werden abgewiesen',()=>{
  const x=start();realIce(x);x.run('house','shipFreightIce',{schiff:x.fr.id});
  x.w.advance(x.s,17);
  const variants=[
    z=>{z.kanon.spielerFrachten.lohn++;},
    z=>{z.kanon.spielerFrachten.auftraege[0].schiff='sh-fake';},
    z=>{z.kanon.spielerFrachten.auftraege[0].geliefert=z.tick;},
    z=>{z.kanon.buch.summen['spielerfracht-pilot|pilot_eis|pilot_house']++;},
    z=>{z.ships[x.fr.id].owner='transport';}
  ];
  for(const mutate of variants){
    const forged=JSON.parse(x.w.canonical(x.s));mutate(forged);
    assert.equal(x.w.audit(forged).ok,false,'abweichender Vertrag/Arbeit/Haushalt abgelehnt');
    assert.throws(()=>x.w.load(JSON.stringify(forged)),'gefälschter Save nicht still akzeptiert');
  }
  pruefe(x.w,x.s,'Original unverändert nach Angriffen');
});
test('F4: Die veröffentlichte Regel195 gestattet weiterhin keinen Spieler-Eisfrachtervertrag',()=>{
  const engine=Alt.createPrivateWageResearch({buyerCash:1536,carrierCash:2000});
  const s=engine.core.createW5State(42);
  const initial=engine.core.canonical(s);
  assert.equal(engine.rules.rulesVersion,195);
  const r=engine.core.execute(s,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_aldera'},engine.rules);
  assert.equal(r.ok,false,'ohne K1-Opt-in kein Spieler-Frachterkauf');
  assert.equal(engine.core.canonical(s),initial);
});
