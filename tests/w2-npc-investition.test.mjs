import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Regel 16 nutzt exakt dieselben Core-Module aus index.html wie W0/W1.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
assert.ok(begin >= 0 && end > begin);
const api = Function(html.slice(begin, end) + '\nreturn m_core_index;')();
const rules = api.W2_RULES;
const anzahlNpc = (s) => Object.values(s.ships).filter((sh) => sh.owner === 'npc3' && sh.klasse === 'miner').length;

function mitSpieler(s) {
  const kauf = api.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }, rules);
  assert.equal(kauf.ok, true);
  const id = Object.values(s.ships).find((sh) => sh.owner === 'house' && sh.klasse === 'miner').id;
  assert.equal(api.execute(s, { type: 'shipMine', owner: 'house', schiff: id, ware: 'erz' }, rules).ok, true);
  return id;
}

test('W2: eigene Regel16-Forschungswelt, keine geaenderten W1/Regel14-Reihen', () => {
  assert.equal(rules.rulesVersion, 16);
  assert.equal(api.ERZ_RULES.rulesVersion, 15);
  assert.equal(rules.economy, api.ERZ_RULES.economy);
  assert.equal(rules.world, api.ERZ_RULES.world);
  const basis = api.createErzState(42);
  api.advance(basis, 120, api.ERZ_RULES);
  assert.equal(anzahlNpc(basis), 1, 'Regel15 ohne Investitionsautomatik');
  assert.equal(api.audit(basis).ok, true);
  const alt = api.createState(42);
  api.advance(alt, 60);
  assert.equal(api.hash(alt), '866776f7d84ef15e');
  assert.throws(() => api.loadErz(api.save(api.createW2State(42))), /inkompatibel/);
  assert.throws(() => api.loadW2(api.save(basis)), /inkompatibel/);
});

test('W2: Investition erst nach echtem Gewinn und nur mit zweiter finanzierter Charge', () => {
  const s = api.createW2State(42);
  assert.equal(anzahlNpc(s), 1);
  assert.match(api.pilotNpcInvestition(s).grund, /amortisiert/);
  api.advance(s, 119, rules);
  assert.equal(anzahlNpc(s), 1, 'keine voreilige Investition');
  const vorher = s.owners.werft_extern.cash;
  api.advance(s, 1, rules);
  assert.equal(anzahlNpc(s), 2);
  assert.equal(s.owners.werft_extern.cash - vorher, 600, 'Werft verifiziert den Kaufpreis');
  assert.equal(s.stations.st_aldera.lager.miner, 2);
  const neu = Object.values(s.ships).find((sh) => sh.owner === 'npc3' && sh.id !== 'sh001');
  assert.equal(neu.auftrag, 'foerdern');
  assert.equal(s.minted, 0);
  assert.equal(api.audit(s).ok, true);
  assert.equal(api.audit(s).vollkosten.ok, true);
  api.advance(s, 1, rules);
  assert.equal(api.pilotAuftragsStand(s).auftraege, 2);
  assert.equal(api.pilotAuftragsStand(s).gebunden, 1000);
  const restkosten = Object.entries(s.erzpilotVertraege).reduce((gesamt, [shipId, v]) =>
    gesamt + (v.menge - (s.ships[shipId].ladung.erz || 0)) * v.arbeitsPreis, 0);
  assert.equal(restkosten, 156, 'bestehender Miner hat bereits bezahlte Erz im Frachtraum');
  assert.equal(api.pilotAuftragsStand(s).arbeitsGebunden, restkosten);
  assert.equal(api.audit(s).ok, true);
});

test('W2: Spieler- und NPC-Konkurrenz um dieselbe Lager- und Abnahmekapazitaet', () => {
  const s = api.createW2State(42);
  mitSpieler(s);
  api.advance(s, 180, rules);
  assert.equal(anzahlNpc(s), 1);
  assert.match(api.pilotNpcInvestition(s).grund, /Lagerkapazitaet/);
  assert.equal(s.owners.werft_extern.cash, 1200);
  assert.equal(api.audit(s).ok, true);
  assert.equal(s.minted, 0);
});

test('W2: Aufgebrauchtes Kundenbudget stoppt Markt und jede weitere Expansion', () => {
  const s = api.createW2State(42);
  api.advance(s, 2880, rules);
  const gekauft = anzahlNpc(s);
  const minen = s.ledger.erz.mined;
  assert.equal(s.owners.export.cash, 0);
  assert.equal(s.ledger.erz.exported, 2000);
  assert.equal(api.pilotNpcInvestition(s).ok, false);
  assert.equal(s.minted, 0);
  api.advance(s, 1440, rules);
  assert.equal(anzahlNpc(s), gekauft);
  assert.equal(s.ledger.erz.mined, minen);
  assert.equal(api.audit(s).ok, true);
});

test('W2: Investitionsentscheidung ist rein lesend; Replay und Save/Load hashgleich', () => {
  const a = api.createW2State(42), b = api.createW2State(42);
  api.advance(a, 120, rules);
  api.advance(b, 120, rules);
  const vorher = api.hash(a);
  assert.deepEqual(api.pilotNpcInvestition(a), api.pilotNpcInvestition(a));
  assert.equal(api.hash(a), vorher);
  assert.equal(api.hash(a), api.hash(b));
  const geladen = api.loadW2(api.save(a));
  assert.equal(api.hash(geladen), vorher);
  api.advance(a, 600, rules);
  api.advance(geladen, 600, rules);
  assert.equal(api.hash(a), api.hash(geladen));
  assert.equal(api.audit(geladen).ok, true);
});

test('W2: 13 feste Seeds x 90 Tage mit Investition, ohne Emission, taeglichem Audit und Save', () => {
  const seeds = [1, 2, 7, 11, 13, 42, 99, 123, 777, 1234, 4096, 65535, 98765];
  for (const seed of seeds) {
    const s = api.createW2State(seed);
    for (let day = 1; day <= 90; day++) {
      api.advance(s, 1440, rules);
      const audit = api.audit(s);
      assert.equal(audit.ok, true, 'Geld, Ware, Vollkosten, Treuhand: '+seed+'/'+day);
      assert.equal(audit.isk.total, 27000, 'konstante Geldmenge '+seed+'/'+day);
      assert.equal(s.minted, 0, 'keine Emission '+seed+'/'+day);
      assert.ok(Object.values(s.owners).every((o) => Number.isSafeInteger(o.cash) && o.cash >= 0));
    }
    assert.equal(anzahlNpc(s), 2, 'nur finanzierte Expansion '+seed);
    assert.equal(s.ledger.erz.exported, 2000, 'endliche Kundennachfrage '+seed);
    assert.equal(api.hash(api.loadW2(api.save(s))), api.hash(s), 'Save '+seed);
  }
});
