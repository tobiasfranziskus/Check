import test from "node:test";
import assert from "node:assert/strict";
import G from "../prototypes/flug2d/grafik.js";
import R from "../prototypes/flug2d/referenz.js";
import Factory from "../prototypes/w5ac/rule191-w5-ferry-core.js";
const { core } = Factory.createPrivateWageResearch({
  carrierCash: 2000,
  buyerCash: 4000,
});
const freeze = (o) => {
  Object.freeze(o);
  for (const v of Object.values(o))
    if (v && typeof v === "object" && !Object.isFrozen(v)) freeze(v);
  return o;
};
// Canvas double exercises all drawing paths without DOM or simulation RNG.
const gradient = { addColorStop() {} };
const context = new Proxy(
  {},
  {
    get: (o, k) => o[k] || (k.startsWith("create") ? () => gradient : () => {}),
    set: (o, k, v) => ((o[k] = v), true),
  },
);
const factory = () => ({ getContext: () => context });
test("Adapter: drei Klassen, unbekannte Typen und keine geteilten Flugreferenzen", () => {
  const s = freeze(R.welt());
  assert.deepEqual(
    Object.values(s.ships).map((v) => G.adapter(v).modell),
    ["miner", "miner", "hauler", "hunter"],
  );
  for (const klasse of ["unbekannt", "toString", "__proto__", undefined])
    assert.equal(G.modell(klasse), "rookie");
  const view = G.adapter(s.ships.sp1);
  view.x = 999;
  assert.notEqual(view.x, s.ships.sp1.flug.x);
});
test("Koordinaten: exakte Endpunkte, begrenzte Interpolation, Kurs und Resize ohne Drift", () => {
  const s = {
    id: "test",
    klasse: "jaeger",
    flug: { x: 140, y: -80, kurs: 64, vx: 12, vy: -3, lage: "frei" },
  };
  assert.deepEqual(
    [
      G.adapter(s, [100, -40], 0).x,
      G.adapter(s, [100, -40], 0.5).x,
      G.adapter(s, [100, -40], 1).x,
    ],
    [100, 120, 140],
  );
  assert.equal(G.adapter(s, null).winkel, Math.PI / 2);
  assert.equal(G.adapter(s, [100, -40], -2).x, 100);
  assert.equal(G.adapter(s, [100, -40], 2).x, 140);
  for (const [w, h] of [
    [1180, 820],
    [1024, 768],
    [820, 1180],
    [390, 844],
  ]) {
    assert.deepEqual(G.projektion(140, -80, 140, -80, 0.2, w, h), [
      w / 2,
      h / 2,
    ]);
    assert.deepEqual(G.projektion(150, -70, 140, -80, 0.2, w, h), [
      w / 2 + 2,
      h / 2 + 2,
    ]);
  }
});
test("Rendern: tief eingefrorener Core bleibt bitgleich, feste Cache-Grenze und Freigabe", () => {
  const state = freeze(R.lauf()),
    before = core.canonical(state),
    hash = core.hash(state);
  const r = G.erstellen(context, factory);
  for (let i = 0; i < 500; i++) {
    r.himmel(i, -i, 0.1, 1180, 820);
    for (const s of Object.values(state.ships))
      r.schiff(G.adapter(s), 100, 100, i % 3);
    r.schiff({ modell: "__proto__", winkel: 0, bewegt: true }, 0, 0, i % 3);
  }
  assert.equal(core.canonical(state), before);
  assert.equal(core.hash(state), hash);
  assert.equal(R.kette(core), "e2674c1ef11678ba");
  assert.deepEqual(r.cache(), {
    sprites: 12,
    teile: 12,
    schichten: 3,
    pixel: 12 * 128 * 128 + 3 * 1536 * 1536,
  });
  r.leeren();
  assert.deepEqual(r.cache(), { sprites: 0, teile: 0, schichten: 0, pixel: 0 });
});
test("Rendern zwischen jedem Flugschritt ändert weder Bahn noch Minuten-Kettenhash", () => {
  const state = R.welt(),
    r = G.erstellen(context, factory);
  let chain = "";
  for (let i = 0; i < R.SCHRITTE; i++) {
    for (const s of Object.values(state.ships)) r.schiff(G.adapter(s), 0, 0);
    R.vor(state, 1, R.SKRIPT);
    if ((i + 1) % 60 === 0)
      chain = core.hashString(chain + core.canonical(state));
  }
  assert.equal(chain, R.HASH);
  assert.equal(core.canonical(state), core.canonical(R.lauf()));
});
