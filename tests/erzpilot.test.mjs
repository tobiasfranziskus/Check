import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Der Pilot verwendet die Originalmodule aus index.html, keinen zweiten Testkern.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
assert.ok(start >= 0 && end > start, 'Core-Modulgrenzen vorhanden');
const { api } = Function(html.slice(start, end) + '\nreturn { api: m_core_index };')();
const rules = api.ERZ_RULES;

function mitSpielerMiner(seed = 42) {
  const s = api.createErzState(seed);
  const kauf = api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }, rules);
  assert.equal(kauf.ok, true);
  const sh = Object.values(s.ships).find((x) => x.owner === 'house');
  assert.equal(api.execute(s, { type: 'shipMine', owner: 'house', schiff: sh.id, ware: 'erz' }, rules).ok, true);
  return s;
}
test('Erzpilot hat nur Erz, komplette bezahlte Miner, ein endliches Käuferbudget', () => {
  const s = api.createErzState(42);
  assert.deepEqual(Object.keys(s.ledger).sort(), ['erz', 'miner']);
  assert.equal(s.ledger.erz.initial, 0);
  assert.equal(s.owners.npc3.cash, 2400);
  assert.equal(s.owners.werft_extern.cash, 600);
  assert.equal(s.stations.st_aldera.lager.miner, 3);
  assert.equal(s.minted, 0);
  assert.equal(api.audit(s).ok, true);
});
test('Spieler und NPC fördern, zahlen Arbeit und exportieren tatsächlich vorhandenes Erz', () => {
  const s = mitSpielerMiner();
  assert.equal(s.owners.house.cash, 2400);
  assert.equal(s.owners.werft_extern.cash, 1200);
  api.advance(s, 600, rules);
  assert.equal(s.tick, 600);
  assert.ok(s.ledger.erz.mined > 0);
  assert.ok(s.ledger.erz.exported > 0);
  assert.ok(s.ledger.erz.exported <= s.ledger.erz.mined);
  assert.equal(s.owners.export.cash, 20000 - s.ledger.erz.exported * 10);
  assert.ok(s.owners.fonds_aldera.cash > 0);
  assert.equal(s.minted, 0);
  assert.equal(s.burned, 0);
  assert.deepEqual(api.audit(s).goods.delta, {});
  assert.equal(api.audit(s).ok, true);
});
test('Endliches Käuferbudget erschöpft sich ohne Geldschöpfung oder Gratisarbeit', () => {
  const s = mitSpielerMiner();
  for (let i = 0; i < 60; i++) {
    api.advance(s, 60, rules);
    assert.equal(api.audit(s).ok, true);
  }
  assert.equal(s.owners.export.cash, 0);
  assert.equal(s.minted, 0);
  assert.equal(s.ledger.erz.exported, 2000);
  const mengen = s.ledger.erz.mined;
  api.advance(s, 600, rules);
  assert.equal(api.audit(s).ok, true);
  assert.equal(s.ledger.erz.exported, 2000);
  assert.equal(s.ledger.erz.mined, mengen);
});
test('Kauf ist bei fehlendem Bestand/Geld ungültig, ohne Eigentums- oder Geldänderung', () => {
  const s = api.createErzState(7);
  const v = api.hash(s);
  assert.equal(api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'jaeger', station: 'st_aldera' }, rules).ok, false);
  assert.equal(api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_orion' }, rules).ok, false);
  assert.equal(api.hash(s), v);
  s.owners.werft_extern.cash += s.owners.house.cash;
  s.owners.house.cash = 0;
  const davor = api.hash(s);
  assert.equal(api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }, rules).ok, false);
  assert.equal(api.hash(s), davor);
  assert.equal(api.audit(s).ok, true);
});
test('Save/Load und Replay deterministisch; klassische Regel-14-Welt unverändert', () => {
  const a = mitSpielerMiner(13), b = mitSpielerMiner(13);
  api.advance(a, 360, rules);
  api.advance(b, 360, rules);
  assert.equal(api.hash(a), api.hash(b));
  const neu = api.loadErz(api.save(a));
  assert.equal(api.hash(neu), api.hash(a));
  api.advance(neu, 600, rules);
  api.advance(a, 600, rules);
  assert.equal(api.hash(neu), api.hash(a));
  assert.throws(() => api.loadErz(api.save(api.createState(13))), /inkompatibel/);
  assert.throws(() => api.load(api.save(a)), /neuer/);
  const alt = api.createState(42);
  api.advance(alt, 60);
  assert.equal(api.hash(alt), '866776f7d84ef15e');
  assert.equal(api.audit(alt).ok, true);
});


test('13 Seeds x 90 Tage: taegliche unabhaengige Bilanz und Save/Load, aber kein Dauerumsatz', () => {
  const seeds = [1, 2, 7, 11, 13, 42, 99, 123, 777, 1234, 4096, 65535, 98765];
  for (const seed of seeds) {
    const s = api.createErzState(seed);
    for (let tag = 1; tag <= 90; tag++) {
      api.advance(s, 24 * 60, rules);
      const kassen = Object.values(s.owners).reduce((sum, owner) => sum + owner.cash, 0);
      assert.equal(kassen, s.initialSupply + s.minted - s.burned, 'ISK-Bilanz ' + seed + '/' + tag);
      for (const [ware, ledger] of Object.entries(s.ledger)) {
        const lager = Object.values(s.stations).reduce((n, st) => n + (st.lager[ware] || 0), 0);
        const fracht = Object.values(s.ships).reduce((n, sh) => n + (sh.ladung[ware] || 0), 0);
        const erzeugt = ledger.initial + ledger.mined + ledger.produced + ledger.imported;
        const verbraucht = ledger.consumed + ledger.exported;
        assert.equal(lager + fracht, erzeugt - verbraucht, 'Warenbilanz ' + ware + '/' + seed + '/' + tag);
      }
      assert.ok(Object.values(s.owners).every((owner) => owner.cash >= 0));
    }
    assert.equal(s.minted, 0);
    assert.equal(s.owners.export.cash, 0);
    assert.equal(s.ledger.erz.exported, 2000);
    assert.equal(api.hash(api.loadErz(api.save(s))), api.hash(s));
  }
});
