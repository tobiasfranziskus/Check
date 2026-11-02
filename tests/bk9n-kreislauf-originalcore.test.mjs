// B-K9n – erster zusammenhaengender Original-Core-Nachweis.
// KEINE neue Wirtschaftsregel: reale Core-Schritte, Commands, Preise, Rezepte,
// Reisezeiten, bezahlte Schiffskosten und Spielstand-Audits.
// Die noch nicht erfuellten Phase-B-Abnahmekriterien stehen explizit als TODOs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const beginn = html.indexOf('const m_data_systeme =');
const ende = html.indexOf('const m_data_oberflaeche =');
assert(beginn >= 0 && ende > beginn, 'bekannte Original-Core-Modulgrenzen');
const { core, rules, produktion, verbrauch } = new Function(
  html.slice(beginn, ende) +
  ';return {core:m_core_index,rules:m_data_rules.RULES,' +
  'produktion:m_core_produktion.produktion,verbrauch:m_core_stunde.verbrauch};'
)();
assert.equal(rules.schema, 8);
assert.equal(rules.rulesVersion, 14);

function kassenspiegel(state) {
  return Object.fromEntries(Object.entries(state.owners).map(([id, owner]) => [id, owner.cash]));
}
function originalAudit(state) {
  const a = core.audit(state);
  assert(a.isk.ok, 'Original-Core-Geldaudit: ' + JSON.stringify(a.isk));
  assert(a.goods.ok, 'Original-Core-Warenaudit: ' + JSON.stringify(a.goods.delta));
  // Unabhaengige Summenpruefung, keine Funktion des originalen Core-Audits.
  const total = Object.values(state.owners).reduce((sum, owner) => sum + owner.cash, 0);
  assert.equal(total, state.initialSupply + state.minted - state.burned);
}
function ausfuehren(state, command) {
  const result = core.execute(state, command, rules);
  assert(result.ok, command.type + ': ' + (result.reason || 'abgelehnt'));
}
function wartenBis(state, condition, limit, grund) {
  for (let i = 0; i < limit && !condition(); i++) core.step(state, rules);
  assert(condition(), grund + '; tick=' + state.tick);
}

// Nur ein deterministisches Szenario: die Test-Startlager in Cyris fuer Eis
// und Nahrung werden auf null gesetzt. Diese ENTNAHME reduziert im exakt
// gleichen Betrag die initiale Warenbilanz; weder neues Geld noch neue Ware.
// So kann hier keine vorgefuellte Cyris-Nahrung als neue Produktion gelten.
function transportSzenario(seed) {
  const state = core.createState(seed, rules);
  const cyris = state.stations.st_cyris;
  const eisMiner = Object.values(state.ships).find((s) =>
    s.owner === 'npc3' && s.klasse === 'miner' && s.system === 'cyris' && s.ware === 'eis');
  const frachter = Object.values(state.ships).find((s) =>
    s.owner === 'house' && s.klasse === 'frachter' && s.system === 'aldera');
  assert(eisMiner && frachter, 'reale Startschiffe fuer Miner und Spielerfrachter');
  for (const ware of ['eis', 'nahrung']) {
    const weg = cyris.lager[ware];
    assert(Number.isSafeInteger(weg) && weg > 0);
    cyris.lager[ware] = 0;
    state.ledger[ware].initial -= weg;
  }
  originalAudit(state);
  const anfang = { mineralVerkaeufe: state.stats.verkaeufe[eisMiner.id],
    produziert: state.ledger.nahrung.produced, houseCash: state.owners.house.cash,
    arbeitskosten: state.stats.konto.house.kosten };

  // Originalbefehl: das Spielerschiff reist 25 echte Minuten nach Cyris.
  ausfuehren(state, { type: 'shipMove', owner: 'house', schiff: frachter.id, ziel: 'st_cyris' });
  const hinreise = frachter.ankunft - state.tick;
  assert.equal(hinreise, core.route(rules.world, 'aldera', 'cyris').zeit);
  const verfuegbar = core.reserve(rules, 'st_cyris', 'nahrung') + 4;

  // Produktion kann erst aus gefordertem und an die Station verkauftem Eis
  // starten. Vier verkaufbare Nahrungs-Einheiten oberhalb der Marktreserve
  // werden fuer einen tatsaechlich gefahrenen, kleinen Transport gebraucht.
  wartenBis(state, () => state.stats.verkaeufe[eisMiner.id] > anfang.mineralVerkaeufe
      && cyris.lager.nahrung >= verfuegbar
      && frachter.system === 'cyris' && frachter.phase === 'dock',
    900, 'neu gefoerdertes Eis soll Nahrung oberhalb der Marktreserve erzeugen');
  assert(state.ledger.eis.mined > 0);
  assert(state.ledger.nahrung.produced > anfang.produziert);
  assert(state.owners.house.cash > 0, 'Spieler muss Kauf und Fluege bezahlen koennen');

  const gekauft = 4;
  ausfuehren(state, { type: 'shipTrade', owner: 'house', schiff: frachter.id,
    ware: 'nahrung', menge: gekauft, kauf: true });
  assert.equal(frachter.ladung.nahrung, gekauft);
  const vorLieferung = state.stats.verkaeufe[frachter.id];
  assert(core.aufnehmbar(state, rules, 'st_aldera', 'nahrung') >= gekauft,
    'Aldera braucht freien Lagerplatz und tatsaechliche Kaufkraft');

  ausfuehren(state, { type: 'shipMove', owner: 'house', schiff: frachter.id, ziel: 'st_aldera' });
  const rueckreise = frachter.ankunft - state.tick;
  assert.equal(rueckreise, hinreise, 'identische reale Rueckreisestrecke');
  const ank = frachter.ankunft;
  wartenBis(state, () => state.tick >= ank, ank - state.tick,
    'Original-Core soll reale Ankunft abarbeiten');
  assert.equal(frachter.phase, 'dock');
  assert.equal(frachter.system, 'aldera');
  assert.equal(frachter.ladung.nahrung || 0, 0, 'wirklicher Verkauf statt Test-Transfer');
  assert.equal(state.stats.verkaeufe[frachter.id], vorLieferung + 1);

  // Der Core buche(t) Arbeitszeit nur zur vollen Stunde. Genau deshalb bis
  // zur naechsten Stundenabrechnung laufen, bevor bezahlte Arbeit behauptet wird.
  wartenBis(state, () => state.tick % rules.economy.stunde === 0,
    rules.economy.stunde, 'naechste Betriebsabrechnung');
  const lohn = Math.floor(rules.world.betriebskosten.frachter * hinreise / rules.economy.stunde)
    + Math.floor(rules.world.betriebskosten.frachter * rueckreise / rules.economy.stunde);
  assert(state.stats.konto.house.kosten - anfang.arbeitskosten >= lohn,
    'beide reale Fluege sind aus Spieler-ISK abgerechnet, zusaetzlich Handelsgebuehr');
  originalAudit(state);
  const roundtrip = core.load(core.save(state), undefined, rules);
  assert.equal(core.hash(roundtrip), core.hash(state), 'Save/Load ohne Hashverlust');
  originalAudit(roundtrip);
  return { hash: core.hash(state), tick: state.tick, lohn,
    produziert: state.ledger.nahrung.produced - anfang.produziert,
    mined: state.ledger.eis.mined, houseCash: state.owners.house.cash,
    kosten: state.stats.konto.house.kosten - anfang.arbeitskosten };
}

test('B-K9n: neues Eis -> echte Produktion -> gekaufter und geflogener Nahrungsabsatz', () => {
  for (const seed of [42, 7]) {
    const first = transportSzenario(seed);
    const replay = transportSzenario(seed);
    assert.deepEqual(replay, first, 'deterministischer Replay Seed ' + seed);
    assert(first.produziert >= 4);
    assert(first.mined >= 100);
    assert(first.lohn > 0);
  }
});

test('B-K9n: Originalproduktion und Endverbrauch haben noch keine eigenen Zahlungen', () => {
  const state = core.createState(42, rules);
  const vor = kassenspiegel(state);
  const altProd = state.ledger.nahrung.produced;
  for (let i = 0; i < 8; i++) produktion(state, rules);
  assert(state.ledger.nahrung.produced > altProd, 'Cyris fertigt echte Nahrung');
  assert.deepEqual(kassenspiegel(state), vor,
    'NEGATIVBEFUND: originaler Fabrikprozess erzeugt keine Fabriklohnzahlung');

  const altVerbrauch = state.ledger.nahrung.consumed;
  verbrauch(state, rules);
  assert(state.ledger.nahrung.consumed > altVerbrauch, 'Haushaltsnahrung wirklich konsumiert');
  assert.deepEqual(kassenspiegel(state), vor,
    'NEGATIVBEFUND: originaler Endverbrauch bezahlt keine Nahrung');
  originalAudit(state);
});

test('B-K9n: reale bezahlte Ersatzhuelle, aber keine kostenlose Rettung bei Mittellosigkeit', () => {
  function gefaellt() {
    const state = core.createState(7, rules);
    const miner = Object.values(state.ships).find((s) =>
      s.owner === 'npc3' && s.klasse === 'miner' && s.heimat === 'cyris' && s.ware === 'eis');
    assert(miner);
    const platz = miner.sollplatz;
    delete state.ships[miner.id];
    delete state.stats.verkaeufe[miner.id];
    return { state, platz, vorher: state.owners.npc3.cash };
  }
  {
    const { state, platz, vorher } = gefaellt();
    const h = state.stations.st_aldera.lager.miner;
    const p = core.preis(state, 'st_aldera', 'miner', rules);
    const brutto = p + core.gebuehr(state, rules, 'st_aldera', p);
    assert(vorher >= brutto + rules.world.ersatzRuecklage);
    core.ersatzkauf(state, rules);
    assert(Object.values(state.ships).some((s) => s.owner === 'npc3' && s.sollplatz === platz
      && s.heimat === 'cyris' && s.ware === 'eis'));
    assert.equal(state.owners.npc3.cash, vorher - brutto);
    assert.equal(state.stations.st_aldera.lager.miner, h - 1);
    assert.equal(state.ledger.miner.consumed, 1);
    originalAudit(state);
  }
  {
    const { state, platz, vorher } = gefaellt();
    // Testinterner Transfer vorhandener ISK, keine neue ISK-Emission.
    state.owners.npc3.cash = 0;
    state.owners.fonds_aldera.cash += vorher;
    const h = state.stations.st_aldera.lager.miner;
    core.ersatzkauf(state, rules);
    assert(!Object.values(state.ships).some((s) =>
      s.owner === 'npc3' && s.sollplatz === platz && s.heimat === 'cyris' && s.ware === 'eis'));
    assert.equal(state.stations.st_aldera.lager.miner, h);
    originalAudit(state);
  }
});

// Die nachfolgenden Kriterien sind die eigentliche spaetere Abnahme.
// Sie sind bewusst NICHT gruen: Das aktuelle Regel14-Schema8 hat weder einen
// vorfinanzierten Haushalt noch Fabrikloehne oder eine Vertragsreservierung.
test.todo('B-K9n Abnahme: Haushalte bezahlen nachweislich nur neu produzierte konsumierte Ware');
test.todo('B-K9n Abnahme: Miner, Fabrik und Frachter erhalten vor Leistung gebundene Vollkosten');
test.todo('B-K9n Abnahme: 40 wiederholte Perioden inklusive vier real finanzierter Ersatzpaare');
test.todo('B-K9n Abnahme: aktive Spielerkrise und 13x90/365d wirtschaftlich tragfaehig');
