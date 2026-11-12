// K6: kein kostenloser Produktionsstart; Eigentümer- und Abnahmeengpässe messbar.
// Testet 0/1/2/4 unverändert vorhandene npc3-Miner auf exakt demselben K4-Save.
import test from 'node:test';
import assert from 'node:assert/strict';
import { k6Vergleich, k6Ausdauer, K6_MINUTEN } from '../tools/k6-eisdisposition.mjs';

const K5_HASH = { 42: '032e95033baa5e2c', 7: '49214bdb90ded7a0' };
for (const seed of [42, 7]) {
  test('K6 Seed ' + seed + ': ein bis vier echte NPC-Eisminer ohne neues Erz, Kapital oder fremde Eigentümer', () => {
    const r = k6Vergleich(seed);
    assert.equal(r.varianten.length, 4);
    const [basis, einer, zwei, vier] = r.varianten;
    assert.deepEqual(r.varianten.map(v => v.anzahl), [0, 1, 2, 4]);
    assert.equal(new Set(r.varianten.map(v => v.startHash)).size, 1, 'alle starten auf identischem K4-Zustand');
    assert.equal(r.k4TerminalHash, basis.startHash);
    for (const v of r.varianten) {
      assert.equal(v.tick, 21612 + K6_MINUTEN);
      assert.equal(v.geld, 33000); assert.equal(v.minted, 0); assert.equal(v.burned, 0);
      assert.equal(v.audit, true);
      assert.equal(v.delta.erz, 0, 'abgestellter Erz-/Exportkreislauf ist nicht heimlich repariert');
      assert.equal(v.delta.material, 0);
      assert.equal(v.delta.minerBau, 0);
      assert.equal(v.delta.frachter, 0);
      assert.equal(v.amEnde.erz, 0);
      assert.equal(v.amEnde.material, 0);
      assert.equal(v.befehle.filter(x => x.type === 'shipShuttle').length, v.anzahl);
      assert.deepEqual(v.minerIds, ['sh004','sh005','sh006','sh008'].slice(0, v.anzahl));
      assert.ok(v.befehle.every(x => x.owner === 'npc3'), 'nur Eigentümer-NPC führt seine Originalbefehle aus');
      assert.ok(Object.values(v.arbeit).every(x => x.gefuellt <= 50));
      assert.equal(v.saldo.house, 0, 'keine fremdfinanzierte house-Rettung');
      assert.equal(v.saldo.export, 0, 'kein erfundener Exportetat');
      assert.equal(v.replay.minuten, 130);
      assert.equal(v.checkpoints.at(-1).hash, v.hash);
      assert.equal(v.checkpoints.at(-1).geld, 33000);
      assert.ok(v.delta.eisKauf <= v.delta.eis);
      assert.ok(v.delta.eisFracht <= v.delta.eisKauf);
      assert.ok(v.delta.wasser <= v.delta.eisFracht);
      assert.ok(v.delta.wasserKauf <= v.delta.wasser);
    }
    assert.deepEqual(Object.values(basis.delta), Object.values(basis.delta).map(() => 0),
      'unveränderter K4 still: keine nachträgliche Produktion oder Absatz');
    assert.equal(basis.befehle.length, 0);
    assert.equal(einer.delta.eis, 50, 'K5-Einminer-Gegenversuch bestätigt');
    assert.equal(einer.delta.eisKauf, 50);
    assert.equal(einer.delta.eisFracht, 50);
    assert.equal(einer.delta.wasser, 50);
    assert.equal(einer.delta.wasserKauf, 50);
    assert.equal(einer.k5Hash21865, K5_HASH[seed], 'K5-Diagnosehash durch unabhängige K6-Nachrechnung reproduziert');
    assert.equal(einer.arbeit.sh004.gefuellt, 50);
    assert.equal(einer.arbeit.sh004.stopTick, 21693);
    // Die große Variante ist bewusst kein künstlicher Erfolgsnachweis:
    // tatsächliche Unterschiede und ggf. Käufermangel werden ergebnisoffen ausgegeben.
    assert.ok(zwei.delta.eis <= 100 && vier.delta.eis <= 200);
    assert.ok(zwei.delta.wasserKauf <= zwei.delta.wasser);
    assert.ok(vier.delta.wasserKauf <= vier.delta.wasser);
    for (const v of r.varianten) console.log('K6_RESULT ' + JSON.stringify({
      seed, anzahl: v.anzahl, hash: v.hash, replay: v.replay.hash,
      tick: v.tick, delta: v.delta, arbeit: v.arbeit,
      letzterAbsatz: v.letzterAbsatz, rest: v.amEnde,
      kapital: { npc3: v.kassen.npc3, aldera: v.kassen.st_aldera,
        nadir: v.kassen.st_nadir, transport: v.kassen.transport },
      weltgeld: v.geld, minted: v.minted, burned: v.burned,
    }));
  });
}

for (const seed of [42, 7]) {
  test('K6-Ausdauer Seed ' + seed + ': vier echte NPC-Miner bis zur physischen oder finanziellen Grenze', () => {
    const r = k6Ausdauer(seed);
    assert.equal(r.anzahl, 4); assert.equal(r.chargeLimit, 500);
    assert.equal(r.tick, 21612 + 7000);
    assert.equal(r.minerIds.length, 4);
    assert.equal(r.befehle.filter(x => x.type === 'shipShuttle').length, 4,
      'keine versteckten neuen Aufträge oder Rettungsautomatik');
    assert.equal(r.delta.erz, 0); assert.equal(r.delta.export, 0);
    assert.equal(r.delta.material, 0); assert.equal(r.delta.minerBau, 0); assert.equal(r.delta.frachter, 0);
    assert.equal(r.amEnde.erz, 0); assert.equal(r.amEnde.material, 0);
    assert.equal(r.geld, 33000); assert.equal(r.minted, 0); assert.equal(r.burned, 0);
    assert.equal(r.audit, true);
    assert.equal(r.replay.minuten, 130);
    assert.equal(r.saldo.house, 0); assert.equal(r.saldo.export, 0);
    assert.ok(Object.values(r.arbeit).every(a => a.gefuellt <= 500));
    assert.ok(r.delta.eisKauf <= r.delta.eis);
    assert.ok(r.delta.eisFracht <= r.delta.eisKauf);
    assert.ok(r.delta.wasser <= r.delta.eisFracht);
    assert.ok(r.delta.wasserKauf <= r.delta.wasser);
    assert.ok(r.delta.eis > 0, 'Originalproduktion muss echte Ware liefern');
    console.log('K6_AUSDAUER ' + JSON.stringify({
      seed, minuten: r.minuten, tick: r.tick, hash: r.hash, delta: r.delta,
      arbeit: r.arbeit, letzterAbsatz: r.letzterAbsatz,
      rest: r.amEnde, kapital: {
        npc3: r.kassen.npc3, aldera: r.kassen.st_aldera, nadir: r.kassen.st_nadir,
        transport: r.kassen.transport,
      }, weltgeld: r.geld, minted: r.minted, burned: r.burned,
    }));
  });
}
