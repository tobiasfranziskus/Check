// Anzeige-Regression ohne Browser oder zusätzliche Pakete (Node.js 22).
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_ui_karte_ansicht =');
assert(start >= 0 && end > start);

function umgebung() {
  const elemente = new Map();
  const document = {
    getElementById(id) {
      if (!elemente.has(id)) elemente.set(id, { dataset: {}, innerHTML: '' });
      return elemente.get(id);
    },
  };
  const api = new Function('document', html.slice(start, end)
    + ';return { namen:m_data_namen.KONZERNE, regeln:m_data_rules.RULES,'
    + ' karte:m_data_karte.KARTE, create:m_core_index.createState,'
    + ' save:m_core_index.save, lage:m_ui_sicht.lage, zeichnen:m_ui_hq.systemZeichnen };')(document);
  return { ...api, elemente };
}

test('Konzernnamen sind nur Anzeige-Daten; bestehende IDs bleiben erhalten', () => {
  const e = umgebung(), s = e.create(1);
  assert.equal(e.namen.npc1, 'Asterion Handelsunion');
  assert.equal(e.namen.npc2, 'Veldra Transit');
  assert.equal(s.owners.npc1.id, 'npc1');
  assert.equal(s.owners.npc2.id, 'npc2');
  assert.equal(s.rulesVersion, 8);
});

test('Systemansicht zeigt benannte Konzerne und korrekt zugeordnete Schiffe', () => {
  const e = umgebung(), s = e.create(1), vorher = e.save(s);
  const lage = e.lage(s, e.regeln, e.karte);
  assert.equal(lage.aldera.konzerne.npc1, 1);
  assert.equal(lage.dravos.konzerne.npc2, 1);
  assert.equal(lage.aldera.konzerne.npc2 || 0, 0);

  e.zeichnen(lage.aldera);
  let liste = e.elemente.get('sys-schiffe').innerHTML;
  assert.match(liste, /Asterion Handelsunion/);
  assert.doesNotMatch(liste, /Veldra Transit/);
  assert.match(liste, /Neutrale Schiffe/);

  e.zeichnen(lage.dravos);
  liste = e.elemente.get('sys-schiffe').innerHTML;
  assert.match(liste, /Veldra Transit/);
  assert.doesNotMatch(liste, /Asterion Handelsunion/);
  assert.equal(e.save(s), vorher, 'Anzeigen verändern keinen Simulationszustand');
});
