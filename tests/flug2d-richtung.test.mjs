// G0/F0-Forschung: bitgleiche Optimierung der Richtungssuche, keine Produktregel.
import test from 'node:test';
import assert from 'node:assert/strict';
import F from '../prototypes/flug2d/flug-kern.js';

// Unabhaengige Vergleichsfassung des 256er-Vollscans aus dem unveraenderten F0.
function richtungAlt(dx, dy) {
  let best = 0, wert = -Infinity;
  for (let i = 0; i < 256; i++) {
    const w = dx * F.cos(i) + dy * F.sin(i);
    if (w > wert) { wert = w; best = i; }
  }
  return best;
}

test('Flug2D-Richtung: die festen Viertelkreis-Steigungen sind streng geordnet', () => {
  let altDc = null, altDs = null;
  for (let i = 0; i < 64; i++) {
    const dc = F.cos(i) - F.cos(i + 1);
    const ds = F.sin(i + 1) - F.sin(i);
    assert.ok(dc > 0 && ds > 0, 'positiver Viertelschritt ' + i);
    if (altDc !== null) {
      // Kreuzmultiplikation: kein float/atan2 und keine fehleranfaellige Division.
      assert.ok(dc * altDs > altDc * ds, 'monotones Steigungsverhaeltnis ' + i);
    }
    altDc = dc; altDs = ds;
  }
});

test('Flug2D-Richtung: Achsen, Quadranten, Nullvektor und 0-vor-255-Gleichstand', () => {
  const faelle = [
    [0, 0, 0], [1, 0, 0], [0, 1, 64], [-1, 0, 128], [0, -1, 192],
    [1, 1, 32], [-1, 1, 96], [-1, -1, 160], [1, -1, 224],
    [402, -5, 0], [804, -10, 0], [402, -6, 255],
    [288, 281, 31], [-288, 281, 96], [-288, -281, 159], [288, -281, 224],
  ];
  for (const [dx, dy, expected] of faelle) {
    assert.equal(richtungAlt(dx, dy), expected, 'Legacy-Referenz ' + dx + ',' + dy);
    assert.equal(F.richtungZu(dx, dy), expected, 'Optimum ' + dx + ',' + dy);
  }
});

test('Flug2D-Richtung: strukturierte Punkte und feste Pseudozufallsstichprobe stimmen bitgleich', () => {
  let faelle = 0;
  const pruefen = (dx, dy) => {
    assert.equal(F.richtungZu(dx, dy), richtungAlt(dx, dy),
      'falsche Kurs-ID bei dx=' + dx + ', dy=' + dy);
    faelle++;
  };
  for (let dx = -48; dx <= 48; dx++) for (let dy = -48; dy <= 48; dy++) pruefen(dx, dy);
  // Test-RNG getrennt vom Spiel-RNG: sichere, ganzzahlige Testvektoren.
  let seed = 0x5ac01617;
  const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
  for (let i = 0; i < 65000; i++) {
    const scale = [1, 7, 100, 10000][i % 4];
    const dx = ((next() % 2001) - 1000) * scale;
    const dy = ((next() % 2001) - 1000) * scale;
    pruefen(dx, dy);
  }
  assert.equal(faelle, 74409);
});
