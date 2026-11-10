// Flug2D-Forschungskern [ANALYSE]: reiner Kinematik-Prototyp, nicht in index.html/Regel195 integriert.
import test from 'node:test';
import assert from 'node:assert/strict';
import F from '../prototypes/flug2d/flug-kern.js';
import R from '../prototypes/flug2d/referenz.js';
import Factory from '../prototypes/w5ac/rule191-w5-ferry-core.js';
const { core, rules } = Factory.createPrivateWageResearch({ carrierCash: 2000, buyerCash: 4000 });
const N = F.DATEN.schritteJeMinute;
const json = (x) => core.canonical(x);
const tempo = (b) => F.isqrt(b.vx * b.vx + b.vy * b.vy);
const cmd = (s, c) => { const r = F.ausfuehren(s, c); assert.equal(r.ok, true, JSON.stringify([c, r])); };
const bis = (s, fertig, max = 20000) => {
  let n = 0;
  while (!fertig()) { assert.ok(n++ < max, 'Bedingung nicht erreicht'); R.vor(s, 1); assert.deepEqual(F.audit(s), { ok: true, grund: 'Flugzustand konsistent' }); }
  return n;
};

test('Richtungstabelle: Literale stimmen mit gerundetem Sinus überein, Wurzel und Kursbestimmung sind exakt', () => {
  for (let i = 0; i < 256; i++) {
    assert.equal(F.sin(i), Math.round(Math.sin(2 * Math.PI * i / 256) * 16384) + 0, 'sin ' + i);
    assert.equal(F.cos(i), Math.round(Math.cos(2 * Math.PI * i / 256) * 16384) + 0, 'cos ' + i);
  }
  for (const n of [0, 1, 2, 3, 4, 15, 16, 17, 999999, 1000000, 2 ** 40 - 1, 2 ** 40, 2 ** 40 + 1]) {
    const r = F.isqrt(n); assert.ok(r * r <= n && (r + 1) * (r + 1) > n, 'isqrt ' + n);
  }
  assert.deepEqual([[1, 0], [0, 1], [-1, 0], [0, -1], [5, 5]].map(([x, y]) => F.richtungZu(x, y)), [0, 64, 128, 192, 32]);
  assert.deepEqual([F.drehen(0, 128, 4), F.drehen(250, 4, 4), F.drehen(4, 250, 4), F.drehen(10, 12, 4)], [4, 254, 0, 12]);
});

test('Referenzlauf: gleiche Befehlsfolge ergibt denselben Zustand; Kettenhash ist fest', () => {
  assert.equal(json(R.lauf()), json(R.lauf()));
  assert.equal(R.kette(core), R.HASH);
  // Bildraten-Unabhängigkeit: beliebige Stückelung der Flugschritte ändert nichts.
  const a = R.welt(), b = R.welt();
  R.vor(a, R.SCHRITTE, R.SKRIPT);
  for (let rest = R.SCHRITTE, k = 1; rest > 0; k = k % 7 + 1) { const n = Math.min(k, rest); R.vor(b, n, R.SKRIPT); rest -= n; }
  assert.equal(json(a), json(b));
  assert.equal(a.tick, 60); assert.equal(a.flug.schritt, 0);
  // Kein negatives Null im Arbeitsspeicher: Zustand ist exakt gleich seiner JSON-Fassung.
  assert.deepStrictEqual(a, JSON.parse(json(a)));
});

test('Save/Load mitten im Flug, im Andocken und im Abdocken setzt bitgleich fort', () => {
  const durch = R.lauf();
  const lagen = new Set();
  for (const halt of [5, 37, 461, 1337, 1915, 2250, 3599]) {
    const s = R.welt(); R.vor(s, halt, R.SKRIPT);
    for (const sh of Object.values(s.ships)) lagen.add(sh.flug.lage);
    const geladen = JSON.parse(json(s));
    assert.deepEqual(F.audit(geladen), { ok: true, grund: 'Flugzustand konsistent' });
    R.vor(geladen, R.SCHRITTE - halt, R.SKRIPT);
    assert.equal(json(geladen), json(durch), 'Fortsetzung ab Schritt ' + halt);
  }
  assert.deepEqual([...lagen].sort(), ['abdocken', 'andocken', 'angedockt', 'frei']);
});

test('Gemeinsame Flugregeln: NPC und Spieler fliegen mit denselben Befehlen dieselbe Bahn', () => {
  const s = R.welt(); delete s.sandbox.np1; // np1 hier ohne Auftragsersatz, nur identische Befehle
  const folge = (owner, schiff) => [
    [0, { type: 'shipUndock', owner, schiff }], [50, { type: 'shipSteer', owner, schiff, kurs: 200, fahrt: 80 }],
    [400, { type: 'shipApproach', owner, schiff, zielArt: 'feld', ziel: 'aldera:erz' }],
    [1500, { type: 'shipDock', owner, schiff, station: 'st_aldera' }]];
  const ergebnisse = R.vor(s, 2600, [...folge('house', 'sp1'), ...folge('npc3', 'np1')]);
  assert.ok(ergebnisse.length === 8 && ergebnisse.every((r) => r.ok));
  assert.deepEqual(s.ships.np1.flug, s.ships.sp1.flug);
  assert.equal(s.ships.sp1.flug.lage, 'angedockt');
});

test('Befehle: fremder Besitzer, falsche Lage und ungültige Werte ändern den Zustand nicht', () => {
  const s = R.welt(), vorher = json(s);
  const nein = (c, grund) => { const r = F.ausfuehren(s, c); assert.equal(r.ok, false); assert.match(r.reason, grund); assert.equal(json(s), vorher); };
  nein({ type: 'shipUndock', owner: 'npc3', schiff: 'sp1' }, /gehört nicht/);
  nein({ type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 50 }, /nicht im freien Flug/);
  nein({ type: 'shipWarp', owner: 'house', schiff: 'sp1' }, /unbekannter Flugbefehl/);
  nein({ type: 'shipUndock', owner: 'house', schiff: 'sp1', treibstoff: 1 }, /unerlaubtes Feld/);
  cmd(s, { type: 'shipUndock', owner: 'house', schiff: 'sp1' }); bis(s, () => s.ships.sp1.flug.lage === 'frei');
  const frei = json(s);
  for (const [c, grund] of [
    [{ type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 256, fahrt: 50 }, /Kurs/],
    [{ type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 1.5, fahrt: 50 }, /Kurs/],
    [{ type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 101 }, /Fahrt/],
    [{ type: 'shipDock', owner: 'house', schiff: 'sp1', station: 'st_nadir' }, /nicht in diesem System/],
    [{ type: 'shipApproach', owner: 'house', schiff: 'sp1', zielArt: 'feld', ziel: 'nadir:erz' }, /nicht in diesem System/],
    [{ type: 'shipFlyTo', owner: 'house', schiff: 'sp1', x: F.DATEN.raumRadius + 1, y: 0 }, /außerhalb/],
    [{ type: 'shipUndock', owner: 'house', schiff: 'sp1' }, /nicht angedockt/]]) {
    const r = F.ausfuehren(s, c); assert.equal(r.ok, false); assert.match(r.reason, grund); assert.equal(json(s), frei);
  }
});

test('Beschleunigen, Höchstfahrt, Bremsen, Anflug und Andocken als Zustandsmaschine', () => {
  const s = R.welt(); delete s.sandbox.np1;
  const sp = s.ships.sp1, k = F.DATEN.klassen.miner;
  cmd(s, { type: 'shipUndock', owner: 'house', schiff: 'sp1' });
  assert.equal(bis(s, () => sp.flug.lage === 'frei'), F.DATEN.andocken.schritte);
  // Schub: Geschwindigkeit steigt je Schritt höchstens um "schub" und endet an vmax.
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 100 });
  let letzte = 0;
  for (let i = 0; i < 100; i++) { R.vor(s, 1); const v = tempo(sp.flug); assert.ok(v - letzte <= k.schub && v <= k.vmax); letzte = v; }
  assert.equal(letzte, k.vmax); assert.equal(sp.flug.vy, 0);
  // Schräger Kurs: die Geschwindigkeit folgt dem Bug, nicht erst einer Achse (keine L-förmige Bahn).
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 0 }); bis(s, () => tempo(sp.flug) === 0);
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 241, fahrt: 0 }); R.vor(s, 8); // im Stand drehen
  assert.deepEqual([sp.flug.kurs, tempo(sp.flug)], [241, 0]);
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 241, fahrt: 100 });
  for (let i = 0; i < 80; i++) { R.vor(s, 1); const ab = (F.richtungZu(sp.flug.vx, sp.flug.vy) - 241) & 255; assert.ok(Math.min(ab, 256 - ab) <= 1, 'Abweichung ' + ab + ' in Schritt ' + i); }
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 100 }); bis(s, () => sp.flug.vx === k.vmax && sp.flug.vy === 0);
  // Schnelles Durchfliegen der Dockzone dockt nicht an; Erz kann im Flug nicht gefördert werden.
  assert.equal(sp.flug.lage, 'frei'); assert.equal(F.angedocktAn(sp, 'st_aldera'), false); assert.equal(F.imFeld(sp, 'erz'), false);
  // Bremsen: Fahrt 0 baut je Schritt höchstens "bremse" ab und endet im Stillstand.
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 0 });
  const bremsweg = bis(s, () => tempo(sp.flug) === 0);
  assert.equal(bremsweg, k.vmax / k.bremse);
  const ruhe = json(sp.flug); R.vor(s, 50); assert.equal(json(sp.flug), ruhe, 'ohne Befehl keine Drift');
  // Anflug an das Erzfeld: hält innerhalb des Feldes an; erst dann ist Förderung örtlich möglich.
  cmd(s, { type: 'shipApproach', owner: 'house', schiff: 'sp1', zielArt: 'feld', ziel: 'aldera:erz' });
  bis(s, () => F.imFeld(sp, 'erz') && tempo(sp.flug) === 0);
  assert.equal(F.imFeld(sp, 'eis'), false);
  // Andocken: Automatik bremst in die Zone, Sequenz läuft fest ab, danach liegt das Schiff exakt am Dock.
  cmd(s, { type: 'shipDock', owner: 'house', schiff: 'sp1', station: 'st_aldera' });
  bis(s, () => sp.flug.lage === 'andocken');
  const d = F.DATEN.andocken;
  assert.ok(sp.flug.x ** 2 + sp.flug.y ** 2 <= d.radius ** 2);
  assert.equal(F.ausfuehren(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 0, fahrt: 100 }).ok, false);
  assert.equal(bis(s, () => sp.flug.lage === 'angedockt'), d.schritte);
  assert.deepEqual([sp.flug.x, sp.flug.y, sp.flug.vx, sp.flug.vy, sp.flug.anker], [0, 0, 0, 0, 'st_aldera']);
  assert.equal(F.angedocktAn(sp, 'st_aldera'), true); assert.equal(F.imFeld(sp, 'erz'), false);
  // Handsteuerung bricht eine laufende Anflugautomatik ab.
  cmd(s, { type: 'shipUndock', owner: 'house', schiff: 'sp1' }); bis(s, () => sp.flug.lage === 'frei');
  cmd(s, { type: 'shipDock', owner: 'house', schiff: 'sp1', station: 'st_aldera' });
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: 64, fahrt: 100 });
  R.vor(s, 600); assert.equal(sp.flug.lage, 'frei'); assert.equal(sp.flug.andocken, false);
});

test('Wiederverwendung: Frachter und Jäger nutzen denselben Integrator nur mit anderen Klassenwerten', () => {
  const zeiten = {};
  for (const [id, owner] of [['sp1', 'house'], ['fr1', 'transport'], ['jg1', 'house']]) {
    const s = R.welt(); delete s.sandbox.np1; const sh = s.ships[id], k = F.DATEN.klassen[sh.klasse];
    cmd(s, { type: 'shipUndock', owner, schiff: id }); bis(s, () => sh.flug.lage === 'frei');
    cmd(s, { type: 'shipApproach', owner, schiff: id, zielArt: 'feld', ziel: 'aldera:erz' });
    let vmax = 0;
    zeiten[sh.klasse] = bis(s, () => { vmax = Math.max(vmax, tempo(sh.flug)); return F.imFeld(sh, 'erz') && tempo(sh.flug) === 0; });
    assert.ok(vmax <= k.vmax && vmax >= k.vmax - k.schub, sh.klasse + ' erreicht Höchstfahrt ' + vmax);
  }
  assert.ok(zeiten.jaeger < zeiten.miner && zeiten.miner < zeiten.frachter, JSON.stringify(zeiten));
});

test('Kein Treibstoff: Flugkörper hat nur Kinematikfelder und fliegt beliebig lange', () => {
  const s = R.welt(); delete s.sandbox.np1; const sp = s.ships.sp1;
  assert.deepEqual(Object.keys(sp.flug).sort(), ['andocken', 'anker', 'kurs', 'lage', 'modus', 'rest', 'sollFahrt', 'sollKurs', 'vx', 'vy', 'x', 'y', 'ziel']);
  cmd(s, { type: 'shipUndock', owner: 'house', schiff: 'sp1' }); R.vor(s, 40);
  const kreis = [];
  for (let i = 0; i < 200; i++) kreis.push([40 + i * 100, { type: 'shipSteer', owner: 'house', schiff: 'sp1', kurs: (i * 16) & 255, fahrt: 100 }]);
  R.vor(s, 20000, kreis);
  assert.equal(tempo(sp.flug) >= F.DATEN.klassen.miner.vmax - F.DATEN.klassen.miner.schub, true);
  assert.deepEqual(F.audit(s), { ok: true, grund: 'Flugzustand konsistent' });
  assert.deepEqual(Object.keys(s).sort(), ['flug', 'sandbox', 'ships', 'tick']);
});

test('Systemrand begrenzt die Position; Audit weist manipulierte Flugzustände ab', () => {
  const s = R.welt(); delete s.sandbox.np1; const jg = s.ships.jg1, Rr = F.DATEN.raumRadius;
  cmd(s, { type: 'shipUndock', owner: 'house', schiff: 'jg1' }); R.vor(s, 40);
  cmd(s, { type: 'shipSteer', owner: 'house', schiff: 'jg1', kurs: 0, fahrt: 100 }); R.vor(s, 2000);
  assert.deepEqual([jg.flug.x, jg.flug.vx], [Rr, 0]);
  const faelschen = (aendern) => { const t = JSON.parse(json(s)); aendern(t); return F.audit(t).ok; };
  assert.equal(faelschen(() => {}), true);
  assert.equal(faelschen((t) => { t.ships.jg1.flug.x = 0.5; }), false);
  assert.equal(faelschen((t) => { t.ships.jg1.flug.vx = F.DATEN.klassen.jaeger.vmax + 1; }), false);
  assert.equal(faelschen((t) => { t.ships.jg1.flug.treibstoff = 100; }), false);
  assert.equal(faelschen((t) => { delete t.ships.jg1.flug.rest; }), false);
  assert.equal(faelschen((t) => { t.ships.sp1.flug.vx = 5; }), false);
  assert.equal(faelschen((t) => { t.ships.sp1.flug.x = 10; }), false);
  assert.equal(faelschen((t) => { t.ships.sp1.flug.anker = 'st_nadir'; }), false);
  assert.equal(faelschen((t) => { t.ships.sp1.flug.lage = 'transit'; }), false);
  assert.equal(faelschen((t) => { t.ships.jg1.flug.ziel = { art: 'feld', id: 'nadir:erz' }; t.ships.jg1.flug.modus = 'anflug'; }), false);
  assert.equal(faelschen((t) => { t.flug.schritt = N; }), false);
  assert.equal(faelschen((t) => { t.flug.uhr = 1; }), false);
});

test('Orthogonalität am echten Regel195-Core: Flug bewegt weder Geld noch Ware noch RNG', () => {
  // Reine Messanordnung im Arbeitsspeicher. Der Core bleibt unverändert und kennt die Flugfelder nicht;
  // geprüft wird nur, dass die Flugschicht keinen Wirtschaftswert berührt (noch keine Ortsbedingungen aktiv).
  const start = () => {
    const s = core.createW5State(42);
    for (const c of [{ type: 'shipBuy', owner: 'house', station: 'st_aldera', klasse: 'miner' },
      { type: 'shipBuy', owner: 'transport', station: 'st_aldera', klasse: 'frachter' }])
      assert.equal(core.execute(s, c, rules).ok, true);
    const eigen = Object.values(s.ships).find((x) => x.owner === 'house').id;
    assert.equal(core.execute(s, { type: 'shipMine', owner: 'house', schiff: eigen, ware: 'erz' }, rules).ok, true);
    return { s, eigen };
  };
  const kontrolle = start(); core.advance(kontrolle.s, 30, rules);
  const { s, eigen } = start();
  for (const sh of Object.values(s.ships)) sh.flug = F.koerperAngedockt(sh.system);
  s.flug = { schritt: 0 };
  const npc = Object.values(s.ships).find((x) => x.owner === 'npc3').id;
  const befehle = [[0, { type: 'shipUndock', owner: 'house', schiff: eigen }], [0, { type: 'shipUndock', owner: 'npc3', schiff: npc }],
    [60, { type: 'shipSteer', owner: 'house', schiff: eigen, kurs: 30, fahrt: 100 }],
    [60, { type: 'shipApproach', owner: 'npc3', schiff: npc, zielArt: 'feld', ziel: 'aldera:erz' }],
    [900, { type: 'shipDock', owner: 'house', schiff: eigen, station: 'st_aldera' }]];
  for (let i = 0; i < 30 * N; i++) {
    for (const [wann, c] of befehle) if (wann === i) assert.equal(F.ausfuehren(s, c).ok, true);
    if (F.schritt(s)) core.step(s, rules); // genau ein unveränderter Minuten-Tick je 60 Flugschritte
  }
  assert.equal(F.audit(s).ok, true);
  assert.notEqual(s.ships[eigen].flug.x, 0);
  const audit = core.audit(s);
  assert.equal(audit.ok, true); assert.equal(audit.isk.total, 33000); assert.equal(s.minted, 0);
  const ohneFlug = JSON.parse(core.save(s)); delete ohneFlug.flug;
  for (const sh of Object.values(ohneFlug.ships)) delete sh.flug;
  assert.equal(core.save(ohneFlug), core.save(kontrolle.s));
  assert.equal(core.hash(ohneFlug), core.hash(kontrolle.s));
  assert.ok(kontrolle.s.ships[eigen].ladung.erz > 0, 'Kontrolllauf enthält echte Core-Förderung');
});

test('Prototyp ist isoliert: Hauptversion lädt keinen Flugkern', async () => {
  const fs = await import('node:fs');
  for (const datei of ['index.html', 'aphros-void.html', 'prototypes/w5ag/index.html'])
    assert.doesNotMatch(fs.readFileSync(new URL('../' + datei, import.meta.url), 'utf8'), /flug2d|FlugKern|shipSteer/);
});
