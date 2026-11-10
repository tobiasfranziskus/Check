// F1 Rule196 [DRAFT]: genau ein bestehender Rule195-Wirtschaftskern pro Forschungswelt.
import test from 'node:test';
import assert from 'node:assert/strict';
import F1 from '../prototypes/flug2d/f1-kopplung.js';
import Legacy from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const START = { carrierCash: 2000, buyerCash: 4000 };
function paar(seed = 3301) {
  const flug = F1.erstellen(START), alt = Legacy.createPrivateWageResearch(START);
  return { flug, alt, state: flug.createState(seed), kontrolle: alt.core.createW5State(seed) };
}
const projektion = (flug, state) => {
  const s = JSON.parse(flug.canonical(state));
  delete s.flug;
  s.rulesVersion = 195;
  for (const sh of Object.values(s.ships)) delete sh.flug;
  return s;
};
function wirtschaftGleich(p) {
  assert.equal(p.alt.core.canonical(projektion(p.flug, p.state)), p.alt.core.canonical(p.kontrolle),
    'Regel196 ohne Flugfelder muss in jeder Wirtschaftsposition Rule195 gleichen');
  assert.equal(p.flug.audit(p.state).ok, true, 'F1 Gesamtaudit');
  assert.equal(p.alt.core.audit(p.kontrolle).ok, true, 'Regel195 Gesamtaudit');
}
const miner = s => Object.values(s.ships).find(x => x.klasse === 'miner');
const ablegen = (p, c) => {
  const a = p.flug.execute(p.state, c);
  const b = p.alt.core.execute(p.kontrolle, c, p.alt.rules);
  assert.deepEqual(a, b, 'derselbe Wirtschaftsbefehl');
  wirtschaftGleich(p);
  return a;
};

test('F1: eigenes Regel196-Profil, gleiche 33.000 ISK, keine Core-Duplikation', () => {
  const p = paar();
  assert.equal(F1.PROFIL, 196);
  assert.equal(F1.SCHRITTE, 60);
  assert.equal(p.flug.rules.schema, 8);
  assert.equal(p.flug.rules.rulesVersion, 196);
  assert.equal(p.alt.rules.rulesVersion, 195);
  assert.equal(p.state.initialSupply, 33000);
  assert.equal(p.state.minted, 0);
  assert.equal(p.state.burned, 0);
  assert.equal(p.state.flug.schritt, 0);
  assert.ok(Object.values(p.state.ships).filter(x=>x.klasse==='miner').every(x=>x.flug?.lage==='angedockt'));
  wirtschaftGleich(p);
  assert.equal(typeof Legacy.createFlightResearch, 'undefined', 'Original-Core bleibt ohne F1-Sonderpfad');
  assert.throws(() => F1.erstellen({ flightF1: false }), /W5ag:/);
  assert.throws(() => Legacy.createPrivateWageResearch({ flightF1: true }), /W5ag:/);
});

test('F1: 59 Teilschritte buchen NICHTS, Schritt 60 genau einen Core-Minuten-Tick', () => {
  const p = paar();
  const vorher = p.alt.core.canonical(projektion(p.flug,p.state));
  p.flug.fliegen(p.state, 59);
  assert.equal(p.state.tick, 0);
  assert.equal(p.state.flug.schritt, 59);
  assert.equal(p.alt.core.canonical(projektion(p.flug,p.state)), vorher);
  const r = p.flug.teilschritt(p.state);
  assert.ok(Array.isArray(r));
  p.alt.core.step(p.kontrolle, p.alt.rules);
  assert.equal(p.state.tick, 1);
  assert.equal(p.state.flug.schritt, 0);
  wirtschaftGleich(p);
});

test('F1: stille Minute und 60 einzelne Flugschritte sind einschließlich Zwischenstand bitgleich', () => {
  const p = paar();
  const second = p.flug.load(p.flug.save(p.state));
  p.flug.fliegen(p.state, 17);
  p.flug.fliegen(second, 17);
  p.flug.minute(p.state); // sicherer Stillstands-Schnellweg
  p.flug.fliegen(second, 60);
  assert.equal(p.flug.canonical(p.state), p.flug.canonical(second));
  assert.equal(p.state.flug.schritt, 17);
  assert.equal(p.state.tick, 1);
  p.alt.core.step(p.kontrolle, p.alt.rules);
  wirtschaftGleich(p);
});

test('F1: freier NPC-Miner fliegt, aber Handel, Erz, Eis, Treuhand und RNG bleiben Rule195', () => {
  const p = paar(), s = miner(p.state);
  assert.equal(p.flug.execute(p.state,
    { type:'shipUndock', owner:s.owner, schiff:s.id }).ok, true);
  p.flug.fliegen(p.state, 40);
  assert.equal(s.flug.lage, 'frei');
  assert.equal(p.flug.execute(p.state,
    { type:'shipApproach', owner:s.owner, schiff:s.id, zielArt:'feld', ziel:'aldera:erz' }).ok,true);
  p.flug.fliegen(p.state, 590); // 10.5 Core-Minuten seit Start
  p.alt.core.advance(p.kontrolle, 10, p.alt.rules);
  assert.equal(p.state.tick, 10);
  assert.equal(p.state.flug.schritt, 30);
  assert.equal(p.flug.flugKern.imFeld(s, 'erz'), true);
  wirtschaftGleich(p);
  // Die F1-Forschung bindet wirtschaftliche Mine-Befehle NICHT an den Ort.
  const stoppen = { type:'shipWait', owner:s.owner, schiff:s.id };
  ablegen(p, stoppen);
});

test('F1: finanziert gekauftes Minerschiff erhält Flugkörper, kein geschenktes Geld/Ware', () => {
  const p = paar();
  const befehl = { type:'shipBuy', owner:'house', klasse:'miner', station:'st_aldera' };
  assert.equal(ablegen(p, befehl).ok, true);
  const eigen = Object.values(p.state.ships).find(s=>s.owner==='house'&&s.klasse==='miner');
  assert.ok(eigen && eigen.flug?.lage === 'angedockt');
  assert.equal(p.state.initialSupply, 33000);
  assert.equal(p.state.minted, 0);
  wirtschaftGleich(p);
  const f = { type:'shipUndock', owner:'house', schiff:eigen.id };
  assert.equal(p.flug.execute(p.state,f).ok,true);
  p.flug.minute(p.state);
  p.alt.core.step(p.kontrolle,p.alt.rules);
  wirtschaftGleich(p);
});

test('F1: Wirtschafts-Queue bleibt original, Flugbefehl wird sekundengenau ausgeführt', () => {
  const p = paar(), s = miner(p.state);
  const command = { type:'shipWait', owner:s.owner, schiff:s.id };
  assert.deepEqual(p.flug.submit(p.state,command),
    p.alt.core.submit(p.kontrolle,command,p.alt.rules));
  const reject = p.flug.submit(p.state,{type:'shipUndock',owner:s.owner,schiff:s.id});
  assert.equal(reject.ok,false);
  assert.match(reject.reason,/execute/);
  p.flug.minute(p.state);
  p.alt.core.step(p.kontrolle,p.alt.rules);
  wirtschaftGleich(p);
  assert.equal(s.flug.lage,'angedockt');
});

test('F1: Save/Load mitten in freiem Flug, nach separaten Befehlen exakt fortsetzbar', () => {
  const p = paar(),s = miner(p.state);
  assert.equal(p.flug.execute(p.state,{type:'shipUndock',owner:s.owner,schiff:s.id}).ok,true);
  p.flug.fliegen(p.state, 115);
  assert.equal(p.state.flug.schritt, 55);
  const snapshot = p.flug.save(p.state);
  const frisch = p.flug.load(snapshot);
  assert.equal(p.flug.canonical(frisch),snapshot);
  assert.equal(p.flug.execute(frisch,{type:'shipFlyTo',owner:s.owner,schiff:s.id,x:1200000,y:-300000}).ok,true);
  assert.equal(p.flug.execute(p.state,{type:'shipFlyTo',owner:s.owner,schiff:s.id,x:1200000,y:-300000}).ok,true);
  p.flug.fliegen(frisch,950);
  p.flug.fliegen(p.state,950);
  assert.equal(p.flug.hash(frisch),p.flug.hash(p.state));
  assert.equal(p.flug.canonical(frisch),p.flug.canonical(p.state));
  assert.equal(p.flug.audit(frisch).ok,true);
});

test('F1: fremde Saves und manipulierte Flugkörper/Regelnummern werden abgewiesen', () => {
  const p = paar(),s=miner(p.state);
  const altes=p.alt.core.save(p.kontrolle);
  assert.throws(()=>p.flug.load(altes),/fremde Regelversion/);
  assert.throws(()=>p.alt.core.loadW5(p.flug.save(p.state)),/inkompatibel/);
  const clone=()=>JSON.parse(p.flug.save(p.state));
  const edits=[
    x=>{delete x.flug},
    x=>{x.flug.schritt=60},
    x=>{x.flug.zusatz=1},
    x=>{delete x.ships[s.id].flug},
    x=>{x.ships[s.id].flug.x=999999999},
    x=>{x.ships[s.id].flug.geheim=1},
    x=>{x.rulesVersion=195},
    x=>{x.schema=9},
  ];
  for(let i=0;i<edits.length;i++){
    const t=clone();edits[i](t);
    assert.throws(()=>p.flug.load(JSON.stringify(t)),undefined,'manipuliertes Save '+i);
  }
  const tmp=clone();tmp.flug.schritt=99;
  assert.throws(()=>p.flug.save(tmp),/ungültigen Zustand/);
});

test('F1: ungültige Eigentümer- oder Flugbefehle ändern keine Wirtschaft und keinen Flug', () => {
  const p=paar(),s=miner(p.state),a=p.flug.canonical(p.state);
  for(const c of [
    {type:'shipUndock',owner:'house',schiff:s.id},
    {type:'shipSteer',owner:s.owner,schiff:s.id,kurs:12,fahrt:110},
    {type:'shipApproach',owner:s.owner,schiff:s.id,zielArt:'feld',ziel:'nadir:erz'},
    {type:'shipFlyTo',owner:s.owner,schiff:s.id,x:999999999,y:0},
  ]) {
    const r=p.flug.execute(p.state,c);
    assert.equal(r.ok,false);
    assert.equal(p.flug.canonical(p.state),a);
  }
  wirtschaftGleich(p);
});

test('F1: 13 feste Seeds über je 720 echte Wirtschaftsminuten mit vollem Projektionvergleich', () => {
  const seeds=[42,7,3301,1,2,3,5,11,19,101,202,777,123456];
  for(const seed of seeds){
    const p=paar(seed);
    p.flug.advance(p.state,720);
    p.alt.core.advance(p.kontrolle,720,p.alt.rules);
    wirtschaftGleich(p);
    assert.equal(p.state.tick,720);
    assert.equal(p.state.flug.schritt,0);
  }
});
