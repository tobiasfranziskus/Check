// B-K9o – die Reserve ist nur ein Kassenbaustein, keine fertige Wirtschaftsregel.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('const m_data_systeme ='), html.indexOf('const m_data_oberflaeche ='));
const { core, rules } = new Function(source
  + ';return {core:m_core_index,rules:m_data_rules.RULES};')();
const r15 = { ...rules, schema: 9, rulesVersion: 15 };
const seeds = [7, 11, 1, 2, 65535, 42, 1234, 98765, 3, 99, 2024, 2025, 314159];

function geldPruefen(s) {
  const frei = Object.values(s.owners).reduce((sum, x) => {
    assert(Number.isSafeInteger(x.cash) && x.cash >= 0);
    return sum + x.cash;
  }, 0);
  const gebunden = Object.values(s.vertraege?.eintraege || {}).reduce((sum, x) => sum + x.rest, 0);
  assert(Number.isSafeInteger(gebunden) && gebunden >= 0);
  assert.equal(frei + gebunden, s.initialSupply + s.minted - s.burned,
    'unabhaengige Geldbilanz umfasst das nicht ausgebbare Treuhandbudget');
  const a = core.audit(s);
  assert.equal(a.isk.total, frei + gebunden);
  assert(a.ok, JSON.stringify(a));
}
function neustart(s, r = r15) {
  const fresh = core.load(core.save(s), undefined, r);
  assert.equal(core.hash(fresh), core.hash(s));
  geldPruefen(fresh);
  return fresh;
}

test('B-K9o: die produktive Regel14-/Schema8-Welt bleibt unveraendert', () => {
  assert.equal(rules.schema, 8);
  assert.equal(rules.rulesVersion, 14);
  const s = core.createState(42, rules);
  assert.equal(s.vertraege, undefined);
  assert.throws(() => core.vertrag.reservieren(s, 'house', 'npc3', 100), /Schema 9/);
  assert.equal(core.hash(core.load(core.save(s))), core.hash(s));
  assert(core.audit(s).ok);
  const old = core.save(s);
  const defekt = JSON.parse(old);
  defekt.vertraege = { naechster: 1, eintraege: {} };
  assert.throws(() => core.load(JSON.stringify(defekt)), /Vertragsbuch in altem Schema/);
});

test('B-K9o: echte Mittelbindung, zwei Auszahlungen, Doppelauszahlung abgelehnt, Rest zurueck', () => {
  const s = core.createState(42, r15);
  const vorher = s.owners.house.cash, empfaenger = s.owners.npc3.cash;
  const id = core.vertrag.reservieren(s, 'house', 'npc3', 300);
  assert.equal(id, 'v1');
  assert.equal(s.owners.house.cash, vorher - 300);
  assert.equal(core.vertrag.bestand(s), 300);
  geldPruefen(s);
  assert.equal(core.vertrag.reservieren(s, 'house', 'npc3', vorher), null,
    'gebundenes Geld kann nicht erneut reserviert werden');
  assert.equal(core.vertrag.bezahlen(s, id, 'leistung:fahrt:1', 170), true);
  assert.equal(core.vertrag.bezahlen(s, id, 'leistung:fahrt:1', 170), false,
    'gleicher Leistungsbeleg nie doppelt');
  assert.equal(core.vertrag.bezahlen(s, id, 'leistung:fahrt:2', 131), false,
    'ausserhalb der realen Reserve nicht zahlen');
  assert.equal(s.owners.npc3.cash, empfaenger + 170);
  geldPruefen(s);
  const geladen = neustart(s);
  assert.equal(core.vertrag.bezahlen(geladen, id, 'leistung:fahrt:2', 80), true);
  assert.equal(core.vertrag.abschliessen(geladen, id), true);
  assert.equal(core.vertrag.abschliessen(geladen, id), false);
  assert.equal(core.vertrag.bezahlen(geladen, id, 'leistung:fahrt:3', 1), false);
  assert.equal(geladen.owners.house.cash, vorher - 250);
  assert.equal(geladen.owners.npc3.cash, empfaenger + 250);
  assert.equal(geladen.vertraege.eintraege[id].erstattet, 50);
  assert.equal(core.vertrag.bestand(geladen), 0);
  neustart(geladen);
});

test('B-K9o: zwei parallele Vertraege und ausdruecklicher Abbruch ohne Mint/Burn', () => {
  const s = core.createState(7, r15);
  const minted = s.minted, burned = s.burned, start = s.owners.house.cash;
  const a = core.vertrag.reservieren(s, 'house', 'npc3', 1000);
  const b = core.vertrag.reservieren(s, 'house', 'npc1', 1000);
  assert(a && b && a !== b);
  assert.equal(s.owners.house.cash, 0);
  assert.equal(core.vertrag.reservieren(s, 'house', 'npc2', 1), null);
  assert.equal(core.vertrag.bezahlen(s, a, 'leistung:abbau:1', 75), true);
  assert.equal(core.vertrag.abschliessen(s, a), true);
  assert.equal(core.vertrag.abschliessen(s, b), true);
  assert.equal(s.owners.house.cash, start - 75);
  assert.equal(s.owners.npc3.cash, rules.owners.find(x => x.id === 'npc3').cash + 75);
  assert.equal(s.minted, minted);
  assert.equal(s.burned, burned);
  geldPruefen(s);
  neustart(s);
});

test('B-K9o: alter Spielstand migriert transparent; neues Format wird alter Regel klar verweigert', () => {
  const old = core.createState(42, rules);
  const oldString = core.save(old);
  const neu = core.load(oldString, undefined, r15);
  assert.equal(neu.schema, 9);
  assert.equal(neu.rulesVersion, 15);
  assert.deepEqual(neu.owners, old.owners);
  assert.deepEqual(neu.ships, old.ships);
  assert.deepEqual(neu.ledger, old.ledger);
  assert.equal(core.vertrag.bestand(neu), 0);
  geldPruefen(neu);
  const id = core.vertrag.reservieren(neu, 'house', 'npc3', 123);
  assert.equal(id, 'v1');
  const spaeter = core.save(neu);
  assert.throws(() => core.load(spaeter, undefined, rules), /Schema 9 ist neuer als 8/);
  neustart(neu);
});

test('B-K9o: unplausible neue Save-Daten werden sichtbar abgewiesen', () => {
  const s = core.createState(11, r15);
  const id = core.vertrag.reservieren(s, 'house', 'npc3', 90);
  assert.equal(core.vertrag.bezahlen(s, id, 'leistung:mine:1', 40), true);
  const rohdaten = JSON.parse(core.save(s));
  const fehler = (f) => {
    const copy = JSON.parse(JSON.stringify(rohdaten));
    f(copy);
    assert.throws(() => core.load(JSON.stringify(copy), undefined, r15));
  };
  fehler(x => { x.vertraege.eintraege.v1.rest = 90; });
  fehler(x => { x.vertraege.eintraege.v1.gezahlt = 80; });
  fehler(x => { x.vertraege.eintraege.v1.belege['leistung:fake'] = 2; });
  fehler(x => { x.vertraege.eintraege.v1.empfaenger = 'erfunden'; });
  fehler(x => { x.vertraege.eintraege.v1.status = 'geschlossen'; });
  fehler(x => { x.vertraege.naechster = 1; });
  fehler(x => { delete x.vertraege; });
  fehler(x => { x.rulesVersion = 16; });
  fehler(x => { x.schema = 10; });
  geldPruefen(s);
});

test('B-K9o: Bezahlung erst nach gemessener realer Foerderung im originalen Tick', () => {
  const s = core.createState(42, r15);
  const eisMiner = Object.values(s.ships).find(x => x.owner === 'npc3'
    && x.klasse === 'miner' && x.ware === 'eis' && x.system === 'cyris');
  assert(eisMiner);
  const vorher = s.ledger.eis.mined;
  const id = core.vertrag.reservieren(s, 'house', 'npc3', 100);
  core.step(s, r15);
  assert(s.ledger.eis.mined > vorher, 'echte geforderte Einheit vor Zahlung');
  // Der Beleg wird hier NUR vom Test nach dem Core-Tick uebergeben;
  // eine produktive Leistungsvalidierung existiert noch nicht.
  assert(core.vertrag.bezahlen(s, id, 'leistung:eis:'+s.tick, 35));
  assert(core.vertrag.abschliessen(s, id));
  geldPruefen(s);
  neustart(s);
});

test('B-K9o: 13 Seeds mit vielen gebundenen und abgeschlossenen Buchungen deterministisch', () => {
  for (const seed of seeds) {
    const lauf = () => {
      const s = core.createState(seed, r15);
      for (let i = 0; i < 50; i++) {
        const payer = i % 2 ? 'npc1' : 'house';
        const recipient = i % 2 ? 'npc2' : 'npc3';
        const id = core.vertrag.reservieren(s, payer, recipient, 10);
        assert(id, 'gebundene Kassen muessen hier fuer 50 kleine Auftraege reichen');
        assert(core.vertrag.bezahlen(s, id, 'leistung:seed:'+seed+':'+i, 6));
        assert(core.vertrag.abschliessen(s, id));
        if (i % 10 === 0) {
          geldPruefen(s);
          neustart(s);
        }
      }
      geldPruefen(s);
      const save = core.save(s);
      return {hash: core.hash(s), save};
    };
    assert.deepEqual(lauf(), lauf(), 'Hash und Save deterministic bei Seed '+seed);
  }
});
