import test from 'node:test';
import assert from 'node:assert/strict';
import { laufenK4 } from '../tools/k4-ore-allocation.mjs';

for (const seed of [42, 7]) {
  test('K4 Seed ' + seed + ': Originalaufträge vor Export, vollständig finanziert und replayfest', () => {
    const basis = laufenK4(seed, 0, 14);
    const k4 = laufenK4(seed, 2, 14);
    assert.equal(basis.weltgeld, 33000);
    assert.equal(k4.weltgeld, 33000);
    assert.equal(basis.minted, 0);
    assert.equal(k4.minted, 0);
    assert.equal(basis.burned, 0);
    assert.equal(k4.burned, 0);
    assert.equal(basis.audit, true);
    assert.equal(k4.audit, true);
    assert.equal(basis.nullsaldo, 0);
    assert.equal(k4.nullsaldo, 0);
    assert.ok(k4.manuelleW3Auftraege.length > 0,
      'K4 muss mindestens einen zusätzlichen Original-W3-Auftrag tatsächlich finanzieren');
    assert.ok(k4.saveReplay, 'K4 muss mitten in echter Fracht Save/Load prüfen');
    assert.equal(k4.saveReplay.fortsetzungsminuten, 130);
    assert.notEqual(k4.erz.frachtenBeauftragt, basis.erz.frachtenBeauftragt,
      'K4 muss den realen Frachtablauf gegenüber Basis beeinflussen');
  });
}
