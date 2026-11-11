// K2: unabhängige Gegenprüfungen für reale Material-/ISK-/Transportherkunft.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { SZENARIEN, vorbereiten } from '../tools/welt-szenarien.mjs';
const require = createRequire(import.meta.url);
const Welt = require('../prototypes/welt/welt-kern.js');
const geld = (s) => Object.values(s.owners).reduce((n, o) => n + o.cash, 0);

test('K2: ohne tatsächlich angeliefertes W4-Material wird kein Miner hergestellt oder bezahlt', () => {
  const w = Welt.erstellen(), s = w.createState(42);
  const cmd = { type: 'stationBuildMiner', owner: 'werft_extern', station: 'st_nadir', besteller: 'npc3' };
  const vorher = w.canonical(s);
  const r = w.execute(s, cmd);
  assert.equal(r.ok, false); assert.match(r.reason, /Material/);
  assert.equal(w.canonical(s), vorher, 'abgelehnter Produktionsauftrag verändert nichts');
  assert.equal(s.kanon.minerWerft, undefined, 'K1-Spielstände bleiben ohne K2-Zusatzbuch');
  assert.equal(s.ledger.miner.produced, 0);
  assert.equal(geld(s), 33000); assert.equal(w.audit(s).ok, true);
  for (const falsch of [
    { ...cmd, owner: 'house' }, { ...cmd, besteller: 'export' },
    { ...cmd, station: 'st_aldera' }, { ...cmd, menge: 1 },
  ]) {
    const alt = w.canonical(s), q = w.execute(s, falsch);
    assert.equal(q.ok, false);
    assert.equal(w.canonical(s), alt);
  }
});

test('K2: alte K1-Welt bleibt ohne vorzeitige K2-Konten/Versionserhöhung ladbar', () => {
  const w = Welt.erstellen(), s = w.createState(7);
  assert.equal(s.rulesVersion, 199); assert.equal(s.schema, 8);
  assert.equal(s.kanon.minerWerft, undefined);
  assert.equal(s.owners.k1_miner_arbeit, undefined);
  assert.equal(s.owners.k1_miner_fracht, undefined);
  const z = w.load(w.save(s));
  assert.equal(w.hash(z), w.hash(s));
  assert.equal(w.audit(z).ok, true);
});

test('K2: Verschleißwelt produziert nur aus W4-Material und bucht anschließend echte Rückfracht und Ersatzkauf', () => {
  const x = vorbereiten(SZENARIEN.find((s) => s.id === 'S12'));
  const { welt: w, state: s } = x;
  const alt = Object.values(s.ships).filter((sh) => sh.klasse === 'miner').map((sh) => sh.id);
  let ersterBau = null, ersteLieferung = null, ersterErsatz = null;
  for (let i = 0; i < 14 * 1440; i++) {
    w.minute(s);
    if (!ersterBau && s.kanon.minerWerft?.fertig) ersterBau = s.tick;
    if (!ersteLieferung && s.kanon.minerWerft?.geliefert) ersteLieferung = s.tick;
    if (!ersterErsatz && Object.values(s.ships).some((sh) => sh.klasse === 'miner' && !alt.includes(sh.id)))
      ersterErsatz = s.tick;
    if (i % 1440 === 0) {
      const a = w.audit(s);
      assert.equal(a.ok, true, 'Audit Tag ' + Math.floor(i / 1440) + ': ' + a.fehler.join('; '));
      assert.equal(geld(s), 33000, 'kein Mint/Transferverlust');
    }
  }
  const b = s.kanon.minerWerft, bericht = w.bericht(s);
  assert.ok(b?.begonnen > 0, 'Minerproduktion muss tatsächlich anlaufen');
  assert.ok(b?.fertig > 0, 'realer Miner aus Material und bezahlten Arbeitsminuten');
  assert.ok(b?.verladen > 0 && b?.geliefert > 0, 'Nadir → Aldera auf Frachter mit bezahlter Rückfracht');
  assert.ok(ersteLieferung >= ersterBau, 'Lieferung nach Herstellung');
  assert.ok(ersterErsatz >= ersteLieferung, 'Original-Schiffskauf erst nach Ankunft');
  assert.ok(s.ledger.miner.produced === b.fertig);
  assert.ok(s.ledger.material.consumed >= b.materialVerbraucht);
  assert.equal(bericht.weltgeld, 33000);
  assert.equal(bericht.minted, 0);
  assert.equal(bericht.burned, 0);
  assert.equal(w.audit(s).ok, true);
  const gespeichert = w.save(s);
  const geladen = w.load(gespeichert);
  assert.equal(w.hash(geladen), w.hash(s));
  assert.deepEqual(w.audit(geladen).fehler, []);
  const b1 = s.kanon.buch.summen;
  assert.equal(Object.entries(b1).filter(([k]) => k.startsWith('miner-material|'))
    .reduce((n, [, v]) => n + v, 0), b.begonnen * w.rules.w5.material * w.rules.w5.materialPreis);
  assert.equal(Object.entries(b1).filter(([k]) => k.startsWith('miner-arbeitslohn|'))
    .reduce((n, [, v]) => n + v, 0),
    b.fertig * w.rules.w5.dauer * w.rules.w5.lohnJeMinute
      + (b.auftrag?.gearbeitet || 0) * w.rules.w5.lohnJeMinute);
  assert.equal(Object.entries(b1).filter(([k]) => k.startsWith('miner-fracht|'))
    .reduce((n, [, v]) => n + v, 0), b.geliefert * w.rules.w5n.flugMinuten);
  console.log('K2_MINER_VOLLKETTE ' + JSON.stringify({
    ersterBau, ersteLieferung, ersterErsatz, gebaut: b.fertig, geliefert: b.geliefert,
    ersatzkaeufe: bericht.ersatzkaeufe, material: b.materialVerbraucht,
    hash: w.hash(s), letzterWasserabsatz: bericht.verkaeufe.wasserNadir + bericht.verkaeufe.wasserAldera,
  }));
});
