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
      const finanz = api.audit(s).finanzierung;
      assert.equal(finanz.ok, true, 'Export-Käuferbudget ohne unbelegte Zuflüsse: ' + seed + '/' + tag);
      assert.equal(finanz.start, finanz.rest + finanz.ausgegeben);
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

test('W0: Vorfinanzierte Arbeit bleibt trotz leerem freien Firmenkonto bezahlbar', () => {
  const s = api.createErzState(42);
  api.advance(s, 8, rules);
  const schiff = Object.values(s.ships).find((x) => x.owner === 'npc3');
  const v = s.erzpilotVertraege[schiff.id];
  assert.equal(s.owners[v.arbeitsKonto].cash, 84);
  const rest = s.owners.npc3.cash;
  s.owners.npc3.cash = 0;
  s.owners.werft_extern.cash += rest;
  api.advance(s, 42, rules);
  assert.equal(s.ledger.erz.mined, 50);
  assert.equal(s.stations.st_aldera.lager.erz, 50);
  assert.equal(s.owners.npc3.cash, 500);
  assert.equal(s.owners[v.arbeitsKonto].cash, 0);
  assert.equal(api.pilotAuftragsStand(s).auftraege, 0);
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

test('W1: Fremdkontogeld ist ohne belegte Endkunden-Einnahme keine gueltige Kaueferfinanzierung', () => {
  const s = mitSpielerMiner(7);
  api.advance(s, 1440, rules);
  assert.equal(s.owners.export.cash, 0);
  assert.equal(s.ledger.erz.exported, 2000);
  assert.deepEqual(api.audit(s).finanzierung, {
    ok: true, start: 20000, ausgegeben: 20000, rest: 0, differenz: 0, exportiert: 2000,
  });
  const verkauft = s.ledger.erz.exported, gefoerdert = s.ledger.erz.mined;
  api.advance(s, 600, rules);
  assert.equal(s.ledger.erz.exported, verkauft);
  assert.equal(s.ledger.erz.mined, gefoerdert);
  assert.equal(api.audit(s).ok, true);
  // Das ist nur eine Gegenbuchung, keine nachgewiesene Leistung des Kaeufers.
  const umbuchen = 1000;
  assert.ok(s.owners.werft_extern.cash >= umbuchen);
  s.owners.werft_extern.cash -= umbuchen;
  s.owners.export.cash += umbuchen;
  assert.equal(s.minted, 0);
  const a = api.audit(s);
  assert.equal(a.isk.ok, true);
  assert.equal(a.goods.ok, true);
  assert.equal(a.finanzierung.ok, false);
  assert.equal(a.finanzierung.differenz, umbuchen);
  assert.equal(a.ok, false);
  assert.throws(() => api.loadErz(api.save(s)), /Vertragsbilanz fehlerhaft/);
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


test('W1: Aeltere Pilotspielstaende ohne Auftragsbuch bleiben beim Anzeigen hashgleich', () => {
  const s = api.createErzState(11);
  delete s.erzpilotVertraege; // Regel 15 vor Einführung vorfinanzierter Aufträge
  const referenz = api.hash(s);
  assert.equal(api.pilotAuftragsStand(s).auftraege, 0);
  assert.equal(api.hash(s), referenz);
  const t = api.loadErz(api.save(s));
  assert.equal(api.hash(t), referenz);
  api.advance(t, 5, rules);
  assert.equal(api.audit(t).ok, true);
});

test('W1: Import mit manipuliertem Treuhandkonto oder unplausibler Lagerbilanz wird abgelehnt', () => {
  const s = api.createErzState(42);
  api.advance(s, 3, rules);
  const v = Object.values(s.erzpilotVertraege)[0];
  s.owners[v.konto].cash -= 10;
  s.owners.st_aldera.cash += 10;
  assert.throws(() => api.loadErz(api.save(s)), /Vertragsbilanz fehlerhaft/);
  const t = api.createErzState(42);
  t.stations.st_aldera.lager.erz += 2;
  assert.throws(() => api.loadErz(api.save(t)), /Vertragsbilanz fehlerhaft/);
});

test('W0: Arbeitskapital ist bei Auftragserteilung gebunden und gegen Falschbuchung auditiert', () => {
  const s = api.createErzState(42);
  api.advance(s, 1, rules);
  const v = Object.values(s.erzpilotVertraege)[0];
  assert.equal(v.arbeitsPreis, 2);
  assert.equal(s.owners[v.arbeitsKonto].cash, 98);
  assert.equal(api.pilotAuftragsStand(s).arbeitsGebunden, 98);
  s.owners[v.arbeitsKonto].cash -= 2;
  s.owners.npc3.cash += 2;
  const a = api.audit(s);
  assert.equal(a.isk.ok, true);
  assert.equal(a.goods.ok, true);
  assert.equal(a.contracts.ok, false);
});

test('W1: Regel-15-Auftrag ohne altes Arbeits-Treuhandfeld bleibt ladbar', () => {
  const s = api.createErzState(42);
  api.advance(s, 2, rules);
  const v = Object.values(s.erzpilotVertraege)[0];
  const arbeitsrest = s.owners[v.arbeitsKonto].cash;
  s.owners.npc3.cash += arbeitsrest;
  delete s.owners[v.arbeitsKonto];
  delete v.arbeitsKonto;
  delete v.arbeitsPreis;
  const h = api.hash(s);
  const geladen = api.loadErz(api.save(s));
  assert.equal(api.hash(geladen), h);
  api.advance(geladen, 48, rules);
  assert.equal(geladen.ledger.erz.mined, 50);
  assert.equal(api.audit(geladen).ok, true);
});

test('W1: Budgetnachweis je Liefercharge bleibt unveraendert und hashdeterministisch', () => {
  const a = mitSpielerMiner(42), b = mitSpielerMiner(42);
  assert.equal(api.audit(a).finanzierung.ausgegeben, 0);
  assert.equal(api.audit(a).finanzierung.rest, 20000);
  api.advance(a, 60, rules); api.advance(b, 60, rules);
  const f = api.audit(a).finanzierung;
  assert.equal(f.ok, true);
  assert.equal(f.differenz, 0);
  assert.equal(f.ausgegeben, a.ledger.erz.exported * rules.erzpilot.preis);
  assert.equal(f.rest + f.ausgegeben, f.start);
  assert.equal(api.hash(a), api.hash(b));
  const saved = api.save(a), loaded = api.loadErz(saved);
  assert.deepEqual(api.audit(loaded).finanzierung, f);
  assert.equal(api.hash(loaded), api.hash(a));
});

test('W1: Fremdtransfer bleibt trotz korrekter ISK- und Warenbilanz gesperrt', () => {
  const s = api.createErzState(1234);
  const normal = api.audit(s).finanzierung;
  assert.equal(normal.ok, true);
  s.owners.export.cash += 10;
  s.owners.werft_extern.cash -= 10;
  const b = api.audit(s);
  assert.equal(b.finanzierung.differenz, 10);
  assert.equal(b.isk.ok, true);
  assert.equal(b.goods.ok, true);
  assert.equal(b.ok, false);
});

test('W1: Nach Endabnahme fließt kein Geld automatisch zum Käufer zurück', () => {
  const s = mitSpielerMiner(42);
  api.advance(s, 2 * 1440, rules);
  const gemessen = Object.fromEntries([
    'house', 'npc3', 'st_aldera', 'fonds_aldera', 'export', 'werft_extern',
  ].map((id) => [id, s.owners[id].cash]));
  assert.deepEqual(gemessen, {
    house: 10800, npc3: 10800, st_aldera: 0,
    fonds_aldera: 4200, export: 0, werft_extern: 1200,
  });
  assert.equal(api.audit(s).isk.total, 27000);
  assert.equal(s.ledger.erz.mined, 2100);
  assert.equal(s.ledger.erz.exported, 2000);
  assert.equal(s.stations.st_aldera.lager.erz, 100);
  assert.equal(api.audit(s).finanzierung.ok, true);
  assert.equal(s.minted, 0);
});
