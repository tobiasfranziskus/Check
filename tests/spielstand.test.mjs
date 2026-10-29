// Kompatibilitätstests ohne zusätzliche Bibliotheken: Schema und Regelmigration.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
assert.ok(start >= 0 && end > start);

function engine() {
  return vm.runInNewContext(html.slice(start, end) + '\n({ ' + [
    'rules: m_data_rules.RULES',
    'create: m_core_state.createState',
    'save: m_core_serialize.save',
    'load: m_core_index.load',
    'hash: m_core_hash.hash',
    'audit: m_core_audit.audit',
  ].join(', ') + ' })');
}

test('Aktueller Spielstand ist verlustfrei speicher- und ladbar', () => {
  const e = engine();
  const state = e.create(42, e.rules);
  const restored = e.load(e.save(state), undefined, e.rules);
  assert.equal(e.hash(restored), e.hash(state));
  assert.ok(e.audit(restored).ok);
});

test('Schema 7 wird nach Schema 8 migriert, NPC-Produktionslinien bleiben korrekt', () => {
  const e = engine();
  const current = e.create(42, e.rules);
  const old = JSON.parse(e.save(current));
  old.schema = 7;
  for (const station of Object.values(old.stations))
    for (const line of station.linien) delete line.herkunft;
  const restored = e.load(JSON.stringify(old), undefined, e.rules);
  assert.equal(restored.schema, 8);
  for (const station of Object.values(restored.stations))
    for (const line of station.linien) assert.equal(line.herkunft, 'npc');
  assert.equal(e.hash(restored), e.hash(current));
  assert.ok(e.audit(restored).ok);
});

test('Alte Regelversion 6 migriert auf 9 ohne Wirtschaftseinfluss', () => {
  const e = engine();
  const current = e.create(42, e.rules);
  const old = JSON.parse(e.save(current));
  old.rulesVersion = 6;
  const restored = e.load(JSON.stringify(old), undefined, e.rules);
  assert.equal(restored.rulesVersion, e.rules.rulesVersion);
  assert.equal(e.hash(restored), e.hash(current));
  assert.ok(e.audit(restored).ok);
});

test('Zukünftige Spielstandschemas werden zurückgewiesen statt überschrieben', () => {
  const e = engine();
  const old = JSON.parse(e.save(e.create(42, e.rules)));
  old.schema = e.rules.schema + 1;
  assert.throws(() => e.load(JSON.stringify(old), undefined, e.rules), /neuer/);
});

test('Beschädigte Spielstände werden nicht als gültige Zustände übernommen', () => {
  const e = engine();
  assert.throws(() => e.load('{"schema":8,"owners":', undefined, e.rules), /Unexpected end of JSON input/);
});
