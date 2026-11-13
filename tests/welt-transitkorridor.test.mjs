// K1/F5 [DRAFT] – 2D-Physik im bereits bezahlten W5n-Spielertransit.
// Der originale W5n-Frachtkern bleibt alleiniger Uhr-/Liefer-/Zahlungsentscheider.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const Flug = require('../prototypes/flug2d/flug-kern.js');
const geld = s => Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function ausgefuehrt(w,s,cmd) {
  const r=w.execute(s,cmd);
  assert.equal(r.ok,true,cmd.type+': '+r.reason);
}
function abgelehnt(w,s,cmd,muster) {
  const vor=w.canonical(s);
  const r=w.execute(s,cmd);
  assert.equal(r.ok,false,'Fremd-/Dock-/Frachtbefehl muss abgewiesen werden: '+cmd.type);
  if(muster)assert.match(r.reason,muster);
  assert.equal(w.canonical(s),vor,'Ablehnung ohne Nebenwirkung');
}
function pruefe(w,s,grund){
  const a=w.audit(s);
  assert.equal(a.ok,true,grund+': '+JSON.stringify(a.fehler));
  assert.equal(geld(s),33000,grund+' Geldsumme');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
}
function vorbereiten() {
  const w=Welt.erstellen(),s=w.createState(42,{politik:{automatik:false}});
  ausgefuehrt(w,s,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_aldera'});
  ausgefuehrt(w,s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
  const f=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  const m=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  ausgefuehrt(w,s,{type:'shipShuttle',owner:'house',schiff:m.id,ware:'eis'});
  let t=0;
  while(s.w5n.mineVerkauft<50) {
    w.minute(s);assert.ok(++t<200,'originale Förderung/Dockverkauf');
  }
  ausgefuehrt(w,s,{type:'shipShuttleStop',owner:'house',schiff:m.id});
  while(s.kanon.pendel[m.id]) {
    w.minute(s);assert.ok(++t<250,'echter beendeter Minerauftrag');
  }
  assert.equal(m.flug.lage,'angedockt');
  assert.equal(s.stations.st_aldera.lager.eis,50);
  pruefe(w,s,'vor bezahlter Fracht');
  ausgefuehrt(w,s,{type:'shipFreightIce',owner:'house',schiff:f.id});
  assert.equal(f.phase,'reise');
  assert.equal(f.flug.lage,'transit');
  pruefe(w,s,'Originalauftrag gebunden');
  return {w,s,f,m};
}
test('F5: bezahlter Spielertransit bewegt echten 2D-Körper; NPC, Dock, Cargo und freie Flughülle bleiben gesperrt',()=>{
  const {w,s,f}=vorbereiten(), id=f.id;
  const waehrend=w.hash(s),preis=s.owners.house.cash;
  abgelehnt(w,s,{type:'shipSteer',owner:'transport',schiff:id,kurs:64,fahrt:50},/Besitzer/);
  abgelehnt(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:256,fahrt:50},/Kurs/);
  abgelehnt(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:32,fahrt:101},/Fahrt/);
  abgelehnt(w,s,{type:'shipUndock',owner:'house',schiff:id},/nur Miner|Frachter/);
  abgelehnt(w,s,{type:'shipDock',owner:'house',schiff:id,station:'st_aldera'},/nur Miner|Frachter/);
  abgelehnt(w,s,{type:'shipApproach',owner:'house',schiff:id,zielArt:'station',ziel:'st_nadir'},/nur Miner|Frachter/);
  abgelehnt(w,s,{type:'shipFlyTo',owner:'house',schiff:id,x:100,y:100},/nur Miner|Frachter/);
  abgelehnt(w,s,{type:'shipFreightIce',owner:'house',schiff:id},/physisch angedockt/);
  assert.equal(w.hash(s),waehrend);
  ausgefuehrt(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:0,fahrt:60});
  assert.equal(f.flug.modus,'hand');
  assert.equal(f.flug.sollFahrt,60);
  assert.equal(s.owners.house.cash,preis,'Steuerbefehl kostet keinen erfundenen Aufpreis');
  w.teilschritt(s);
  assert.equal(s.flug.schritt,1,'Original-60-Substeps-Integrator aktiv');
  assert.ok(f.flug.vx>0 && f.flug.x>0,'ein reales Physik-Teilschrittmanöver');
  pruefe(w,s,'nach einem tatsächlichen 2D-Teilschritt');
  w.advance(s,3);
  assert.ok(f.flug.x>15000,'Flugkörper bewegt sich auch bei Wirtschaftsminuten');
  assert.equal(s.w5n.frachtauftrag.gearbeitet,3,'W5n nur bezahlte Gesamtminuten');
  assert.equal(s.owners.w5n_fracht_arbeit.cash,117);
  assert.equal(s.owners.pilot_house.cash>=3,true);
  pruefe(w,s,'Steuerflug mit vollem Waren- und Lohn-Audit');
  const hash=w.hash(s);
  assert.equal(w.hash(w.load(w.save(s))),hash,'2D-Transitkommandos und Speed dauerhaft speicherbar');
  ausgefuehrt(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:192,fahrt:50});
  w.advance(s,2);
  assert.ok(f.flug.vy<0,'gleiches Drehrate-/Beschleunigungsmodell für Nordkurs');
  ausgefuehrt(w,s,{type:'shipSteer',owner:'house',schiff:id,kurs:f.flug.kurs,fahrt:0});
  w.advance(s,4);
  pruefe(w,s,'Bremsung im bezahlten Frachtkorridor');
});
test('F5: Manöver verändern weder originalen W5n-Zahlungszeitpunkt noch 50-Eis-Ablieferung',()=>{
  const x=vorbereiten(), y=vorbereiten();
  assert.equal(x.w.hash(x.s),y.w.hash(y.s),'identischer Startzustand ohne neue Regel');
  const id=x.f.id,first=x.s.tick;
  const old={house:x.s.owners.house.cash,nadir:x.s.owners.st_nadir.cash,pilot:x.s.owners.pilot_house.cash};
  ausgefuehrt(x.w,x.s,{type:'shipSteer',owner:'house',schiff:id,kurs:64,fahrt:60});
  x.w.advance(x.s,15); y.w.advance(y.s,15);
  assert.notEqual(x.w.hash(x.s),y.w.hash(y.s),'physische Kursänderung im autoritativen Hash');
  assert.ok(x.f.flug.y>0,'Korridorbewegung tatsächlich nach Süd');
  assert.equal(x.s.w5n.frachtauftrag.gearbeitet,15);
  assert.equal(x.s.owners.house.cash,y.s.owners.house.cash);
  assert.equal(x.s.owners.st_nadir.cash,y.s.owners.st_nadir.cash);
  assert.equal(x.s.owners.pilot_house.cash,y.s.owners.pilot_house.cash);
  pruefe(x.w,x.s,'nach bezahlten 15 Minuten');
  const hash=x.w.hash(x.s);
  assert.equal(x.w.hash(x.w.load(x.w.save(x.s))),hash,'Save/Load bei körperlicher Transitbewegung');
  x.w.advance(x.s,45);y.w.advance(y.s,45);
  assert.equal(x.s.tick,first+60);
  assert.equal(x.f.system,'nadir');
  assert.equal(x.s.w5n.eisGeliefert,50);
  assert.equal(x.s.stations.st_nadir.lager.eis,50);
  assert.equal(x.s.owners.w5n_fracht_kauf.cash,240,'Frachtgeld erst nach Rückkehr');
  assert.equal(x.w.hash(x.s)===y.w.hash(y.s),false,'Flugkörper im Rückkorridor noch unterschiedlich');
  ausgefuehrt(x.w,x.s,{type:'shipSteer',owner:'house',schiff:id,kurs:128,fahrt:80});
  x.w.advance(x.s,60); y.w.advance(y.s,60);
  assert.equal(x.s.tick,first+120);
  assert.equal(x.s.w5n.frachtauftrag,null);
  assert.equal(x.f.phase,'dock');
  assert.equal(x.f.system,'aldera');
  assert.equal(x.f.flug.lage,'angedockt','Original-K1-Dockkörper nach realem W5n-Transport');
  assert.equal(x.s.kanon.spielerFrachten.lohn,120);
  assert.equal(x.s.kanon.spielerFrachten.gebuehr,240);
  assert.equal(x.s.stations.st_nadir.lager.eis,50);
  assert.equal(x.s.owners.house.cash,old.house+120);
  assert.equal(x.s.owners.pilot_house.cash,old.pilot+120);
  assert.equal(x.s.owners.st_nadir.cash,old.nadir);
  assert.equal(x.w.hash(x.s),y.w.hash(y.s),
    'gleiche bezahlte Lieferung und vollständiger Weltzustand nach beiden Flügen');
  pruefe(x.w,x.s,'Rundfahrt mit Handflug');
  assert.equal(x.w.hash(x.w.load(x.w.save(x.s))),x.w.hash(x.s),'Endzustand stabil');
});
test('F5: keine geborgte Transitfähigkeit für NPC, manipulierte Verträge oder beendeten Spielerauftrag',()=>{
  const {w,s,f}=vorbereiten();
  ausgefuehrt(w,s,{type:'shipSteer',owner:'house',schiff:f.id,kurs:32,fahrt:45});
  w.advance(s,2);
  const falsch=structuredClone(s), orig=falsch.ships[f.id];
  orig.owner='transport';
  assert.equal(w.audit(falsch).ok,false,'Fremdeigentum verweigert physikalischen Transit');
  const falsch2=structuredClone(s);
  falsch2.kanon.spielerFrachten.auftraege[0].end=falsch2.tick;
  assert.equal(w.audit(falsch2).ok,false,'nur laufender Originalvertrag darf manövrieren');
  const falsch3=structuredClone(s);
  falsch3.ships[f.id].flug.andocken=true;
  assert.equal(w.audit(falsch3).ok,false,'keine aus dem 2D-Korridor vorgetäuschte Dockfreigabe');
  const falsch4=structuredClone(s);
  falsch4.ships[f.id].flug.vx=Flug.DATEN.klassen.frachter.vmax+1;
  assert.equal(w.audit(falsch4).ok,false,'Manöver niemals schneller als Originalschiff');
  const npc=Object.values(s.ships).find(sh=>sh.owner==='transport' && sh.flug?.lage==='transit');
  if(npc)abgelehnt(w,s,{type:'shipSteer',owner:'transport',schiff:npc.id,kurs:0,fahrt:50},/nur Miner|Frachter/);
  pruefe(w,s,'unmanipulierter Transit');
});
