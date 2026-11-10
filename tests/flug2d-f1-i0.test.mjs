// Forschungsadapter F1 auf I0: Original-Core + optimiertes F0 + UX08 in einem Zustand.
// Dieser Test verändert weder die Haupt-HTML noch den produktiven Rule195-Serializer.
import test from 'node:test';
import assert from 'node:assert/strict';
import F1 from '../prototypes/flug2d/f1-kopplung.js';
import G from '../prototypes/flug2d/grafik.js';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const START = Object.freeze({ carrierCash: 2000, buyerCash: 4000 });
const REFERENZ = 'ddb96b7b2164c1fb'; // Fixer F1-Forschungs-Hash, nicht F0 e2674c1ef11678ba.
const schiff = (state, owner) =>
  Object.values(state.ships).find(s => s.owner === owner && s.klasse === 'miner');
function geld(state) {
  return Object.values(state.owners).reduce((sum, v) => sum + v.cash, 0);
}
function wirtschaftsprojektion(f, state) {
  const proj = JSON.parse(f.canonical(state));
  delete proj.flug;
  proj.rulesVersion = 195;
  for (const s of Object.values(proj.ships)) delete s.flug;
  return proj;
}
function welt() {
  const f = F1.erstellen(START);
  const o = Original.createPrivateWageResearch(START);
  const state = f.createState(3301), kontroll = o.core.createW5State(3301);
  const gleicheWirtschaft = () => {
    assert.equal(o.core.canonical(wirtschaftsprojektion(f, state)), o.core.canonical(kontroll));
    assert.equal(f.audit(state).ok, true);
    assert.equal(o.core.audit(kontroll).ok, true);
    assert.equal(geld(state), 33000);
    assert.equal(state.minted, 0);
  };
  return { f, o, state, kontroll, gleicheWirtschaft };
}
function anzeigen() {
  const gradient = { addColorStop() {} };
  const g = new Proxy({}, {
    get: (target, k) => {
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => gradient;
      if (k === 'createPattern') return () => ({});
      return target[k] || (() => {});
    },
    set: (target, k, val) => { target[k] = val; return true; },
  });
  return G.erstellen(g, () => ({
    width: 0, height: 0, getContext: () => g,
  }));
}

test('I0+F1: bezahlte Spieler- und NPC-Miner fliegen, UX08 zeichnet ohne Wirtschaftseffekt', () => {
  const p = welt();
  const gekauft = { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' };
  assert.equal(p.f.execute(p.state, gekauft).ok, true);
  assert.equal(p.o.core.execute(p.kontroll, gekauft, p.o.rules).ok, true);
  p.gleicheWirtschaft();
  const npc = schiff(p.state, 'npc3'), spieler = schiff(p.state, 'house');
  assert.ok(npc?.flug && spieler?.flug, 'bezahlter Kauf erzeugt einen echten Flugkörper');
  const vor = p.f.canonical(p.state);
  const render = anzeigen();
  for (let i = 0; i < 200; i++) {
    render.himmel(npc.flug.x, npc.flug.y, 0.1, 1180, 820);
    render.schiff(G.adapter(npc), 200, 180, 0);
    render.schiff(G.adapter(spieler), 320, 180, 1);
  }
  assert.equal(p.f.canonical(p.state), vor, 'UX08 darf auch bei 200 Renderframes nichts buchen');
  assert.ok(render.cache().sprites <= 12);
  assert.ok(render.cache().schichten === 3);
  render.leeren();
  assert.equal(render.cache().pixel, 0);
  p.gleicheWirtschaft();
});

test('I0+F1: festes 34-Minuten-Replay mit Erz/Eis-Anflug, Dock, Save/Load und F1-Hash', () => {
  const p = welt();
  const kaufen = { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' };
  assert.equal(p.f.execute(p.state, kaufen).ok, true);
  assert.equal(p.o.core.execute(p.kontroll, kaufen, p.o.rules).ok, true);
  const npc = schiff(p.state, 'npc3'), spieler = schiff(p.state, 'house');
  for (const s of [npc, spieler])
    assert.equal(p.f.execute(p.state, { type:'shipUndock', owner:s.owner, schiff:s.id }).ok, true);
  p.f.fliegen(p.state, 40);
  for (const [s,ware] of [[npc,'erz'],[spieler,'eis']]) {
    assert.equal(p.f.execute(p.state, {
      type:'shipApproach', owner:s.owner, schiff:s.id, zielArt:'feld', ziel:'aldera:'+ware,
    }).ok, true);
  }
  p.f.fliegen(p.state, 1217);
  p.o.core.advance(p.kontroll, p.state.tick, p.o.rules);
  assert.equal(p.state.tick, 20);
  assert.equal(p.state.flug.schritt, 57);
  assert.equal(p.f.flugKern.imFeld(npc, 'erz'), true);
  assert.equal(p.f.flugKern.imFeld(spieler, 'eis'), true);
  p.gleicheWirtschaft();
  const saved = p.f.save(p.state);
  const wiederhergestellt = p.f.load(saved);
  assert.equal(p.f.canonical(wiederhergestellt), saved);
  for (const s of [npc,spieler]) {
    const cmd = { type:'shipDock', owner:s.owner, schiff:s.id, station:'st_aldera' };
    assert.equal(p.f.execute(p.state, cmd).ok, true);
    assert.equal(p.f.execute(wiederhergestellt, cmd).ok, true);
  }
  p.f.fliegen(p.state, 800);
  p.f.fliegen(wiederhergestellt, 800);
  p.o.core.advance(p.kontroll, p.state.tick-p.kontroll.tick, p.o.rules);
  assert.equal(p.state.tick, 34);
  assert.equal(p.state.flug.schritt, 17);
  assert.equal(p.f.canonical(p.state), p.f.canonical(wiederhergestellt));
  assert.equal(p.f.hash(p.state), REFERENZ);
  p.gleicheWirtschaft();
});

test('I0+F1: separat gespeicherter Flugzustand darf nicht still in Rule195 importiert werden', () => {
  const p = welt();
  const f1 = p.f.save(p.state), original = p.o.core.save(p.kontroll);
  assert.throws(() => p.o.core.loadW5(f1), /inkompatibel/);
  assert.throws(() => p.f.load(original), /fremde Regelversion/);
  assert.equal(p.f.load(f1).rulesVersion, 196);
  p.gleicheWirtschaft();
});
