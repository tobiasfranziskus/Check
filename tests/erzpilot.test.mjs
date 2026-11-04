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
    const s = mitSpielerMiner(seed);
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


test('W0: Erzauftrag bindet Geld und Lagerraum atomar vor Förderbeginn', () => {
  const s = mitSpielerMiner();
  api.advance(s, 1, rules);
  const contracts = Object.values(s.erzpilotVertraege);
  assert.equal(contracts.length, 2);
  assert.deepEqual(contracts.map((v) => v.menge).sort(), [50, 50]);
  assert.equal(api.pilotAuftragsStand(s).gebunden, 1000);
  assert.equal(api.pilotAuftragsStand(s).frei, 0);
  assert.equal(s.owners.st_aldera.cash, 0);
  assert.equal(contracts.reduce((x, v) => x + s.owners[v.konto].cash, 0), 1000);
  assert.equal(s.ledger.erz.mined, 2);
  assert.equal(s.minted, 0);
  assert.equal(api.audit(s).contracts.ok, true);
  assert.equal(api.audit(s).ok, true);
});

test('W0: Unfinanzierter Auftrag produziert kein Erz und kostet keinen Lohn', () => {
  const s = api.createErzState(7);
  const cash = s.owners.st_aldera.cash;
  s.owners.st_aldera.cash -= cash;
  s.owners.werft_extern.cash += cash;
  const ownerVorher = s.owners.npc3.cash;
  api.advance(s, 60, rules);
  assert.equal(s.ledger.erz.mined, 0);
  assert.equal(s.owners.npc3.cash, ownerVorher);
  assert.equal(api.pilotAuftragsStand(s).auftraege, 0);
  assert.equal(api.audit(s).ok, true);
  assert.equal(s.minted, 0);
});

test('W0: Stornierung liefert wirklich geförderte Erzteilmenge und gibt Treuhandrest zurück', () => {
  const s = api.createErzState(11);
  api.advance(s, 13, rules);
  const schiff = Object.values(s.ships).find((x) => x.owner === 'npc3');
  const v = s.erzpilotVertraege[schiff.id];
  assert.equal(v.menge, 50);
  assert.equal(s.owners[v.konto].cash, 500);
  const abbruch = api.execute(s, { type: 'shipWait', owner: 'npc3', schiff: schiff.id }, rules);
  assert.equal(abbruch.ok, true);
  assert.equal(s.stations.st_aldera.lager.erz, 13);
  assert.equal(s.owners.st_aldera.cash, 870);
  assert.equal(s.owners.npc3.cash, 2400 - 26 + 130);
  assert.equal(s.owners[v.konto].cash, 0);
  assert.equal(api.pilotAuftragsStand(s).gebunden, 0);
  assert.equal(Object.keys(s.erzpilotVertraege).length, 0);
  assert.equal(api.audit(s).ok, true);
  const mined = s.ledger.erz.mined;
  api.advance(s, 45, rules);
  assert.equal(s.ledger.erz.mined, mined);
});

test('W0: Zahlungsunfähigkeit während des Auftrags stoppt Bergbau, ohne gratis weiterzuarbeiten', () => {
  const s = api.createErzState(42);
  api.advance(s, 8, rules);
  const schiff = Object.values(s.ships).find((x) => x.owner === 'npc3');
  const rest = s.owners.npc3.cash;
  s.owners.npc3.cash = 0;
  s.owners.werft_extern.cash += rest;
  api.advance(s, 1, rules);
  assert.equal(s.ledger.erz.mined, 8);
  assert.equal(s.stations.st_aldera.lager.erz, 8);
  assert.equal(s.ships[schiff.id].auftrag, 'halten');
  assert.equal(api.pilotAuftragsStand(s).gebunden, 0);
  assert.equal(s.owners.npc3.cash, 80);
  assert.equal(api.audit(s).ok, true);
});

test('W0: Aktives Treuhandkonto ist gegen Falschbuchung unabhängig auditierbar', () => {
  const s = api.createErzState(13);
  api.advance(s, 1, rules);
  const v = Object.values(s.erzpilotVertraege)[0];
  s.owners[v.konto].cash -= 10;
  s.owners.st_aldera.cash += 10;
  const b = api.audit(s);
  assert.equal(b.isk.ok, true);
  assert.equal(b.goods.ok, true);
  assert.equal(b.contracts.ok, false);
  assert.equal(b.ok, false);
});

test('W1: Vertrag mit gebundenem Geld ist deterministisch speicherbar und replaystabil', () => {
  const a = mitSpielerMiner(13), b = mitSpielerMiner(13);
  api.advance(a, 7, rules);
  api.advance(b, 7, rules);
  assert.equal(api.pilotAuftragsStand(a).gebunden, 1000);
  assert.equal(api.hash(a), api.hash(b));
  const c = api.loadErz(api.save(a));
  assert.equal(api.hash(c), api.hash(a));
  api.advance(a, 1433, rules);
  api.advance(c, 1433, rules);
  assert.equal(api.hash(a), api.hash(c));
  assert.equal(api.audit(c).ok, true);
});

test('W1: Pilot verbietet Warenhandel außerhalb des vorfinanzierten Auftrags', () => {
  const s = api.createErzState(42);
  const id = Object.keys(s.ships)[0];
  const vorher = api.hash(s);
  assert.equal(api.execute(s, {
    type: 'shipTrade', owner: 'npc3', schiff: id, ware: 'erz', menge: 1, kauf: true,
  }, rules).ok, false);
  assert.equal(api.hash(s), vorher);
});

test('W1: Nach versiegtem Exportbudget darf nur aus echten Fremdmitteln wieder Nachfrage entstehen', () => {
  const s = mitSpielerMiner(7);
  api.advance(s, 1440, rules);
  assert.equal(s.owners.export.cash, 0);
  const verkauft = s.ledger.erz.exported;
  const gefoerdert = s.ledger.erz.mined;
  api.advance(s, 600, rules);
  assert.equal(s.ledger.erz.exported, verkauft);
  assert.equal(s.ledger.erz.mined, gefoerdert);
  assert.equal(api.audit(s).ok, true);
  // Reale externe Refinanzierung durch vorhandenes Geld: kein Minting.
  const finanzierung = 1000;
  assert.ok(s.owners.werft_extern.cash >= finanzierung);
  s.owners.werft_extern.cash -= finanzierung;
  s.owners.export.cash += finanzierung;
  assert.equal(s.minted, 0);
  api.advance(s, 1440, rules);
  assert.ok(s.ledger.erz.exported > verkauft);
  assert.equal(s.owners.export.cash, 0);
  assert.equal(api.audit(s).ok, true);
});

test('W0: Freie Treuhandmittel dürfen nach Rueckgabe wieder gebunden werden', () => {
  const s = api.createErzState(7);
  api.advance(s, 5, rules);
  const schiff = Object.values(s.ships).find((x) => x.owner === 'npc3');
  assert.equal(api.pilotAuftragsStand(s).gebunden, 500);
  assert.equal(api.execute(s, { type: 'shipWait', owner: 'npc3', schiff: schiff.id }, rules).ok, true);
  assert.equal(api.pilotAuftragsStand(s).gebunden, 0);
  assert.equal(api.execute(s, { type: 'shipMine', owner: 'npc3', schiff: schiff.id, ware: 'erz' }, rules).ok, true);
  api.advance(s, 1, rules);
  assert.ok(api.pilotAuftragsStand(s).gebunden > 0);
  assert.equal(api.audit(s).ok, true);
});
