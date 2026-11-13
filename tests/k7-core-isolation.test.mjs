// K7 isolation [DRAFT] – the published Rule195 single-file source stays byte-for-byte
// unchanged; the optional Rule200 industrial contract is loaded only on request.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const original = require('../prototypes/w5ac/rule191-w5-ferry-core.js');
const industrie = require('../prototypes/welt/rule200-k7-industry-core.js');
const Welt = require('../prototypes/welt/welt-kern.js');

test('K7: Original Rule195/199 source does not export Rule200 factory', () => {
  assert.equal(Object.hasOwn(original, 'createKanonWelt'), false);
  assert.equal(typeof industrie.createKanonWelt, 'function');
  assert.equal(Object.hasOwn(original, 'createK7Welt'), false);
  assert.equal(typeof industrie.createK7Welt, 'function');
});

for (const seed of [42, 7]) {
  test('K7: seed ' + seed + ' both profiles start separately with identical 33,000 ISK', () => {
    const normal = Welt.erstellen();
    const k7 = Welt.erstellenK7();
    const a = normal.createState(seed), b = k7.createState(seed);
    assert.equal(a.rulesVersion, 199);
    assert.equal(b.rulesVersion, 200);
    assert.equal(a.schema, 8);
    assert.equal(b.schema, 8);
    assert.equal(normal.audit(a).ok, true);
    assert.equal(k7.audit(b).ok, true);
    for (const state of [a,b]) {
      assert.equal(Object.values(state.owners).reduce((sum, owner) => sum + owner.cash, 0), 33000);
      assert.equal(state.minted, 0);
      assert.equal(state.burned, 0);
    }
    assert.equal(normal.hash(normal.load(normal.save(a))), normal.hash(a));
    assert.equal(k7.hash(k7.load(k7.save(b))), k7.hash(b));
    assert.throws(() => normal.load(k7.save(b)), /fremde Regelversion/);
    assert.throws(() => k7.load(normal.save(a)), /fremde Regelversion/);
  });
}
