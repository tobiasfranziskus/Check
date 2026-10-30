// Kompatibilitätstests ohne zusätzliche Bibliotheken: Schema und Regelmigration.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { v11CoreSource } from '../tools/v11-core-source.mjs';

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

test('Alte Treibstoff-Regelstände bleiben unverändert und werden eindeutig abgelehnt', () => {
  const e = engine();
  const current = e.create(42, e.rules);
  const old = JSON.parse(e.save(current));
  old.rulesVersion = 8;
  assert.throws(() => e.load(JSON.stringify(old), undefined, e.rules), /keine Regelmigration vorhanden/);
  assert.equal(e.hash(current), e.hash(e.create(42,e.rules)));
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

test('Regelversion 11 wird ohne Waren-, Kassen- oder Schiffsdatenverlust nach 14 migriert', () => {
  const e=engine();
  const htmlSource=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const legacy=new Function(v11CoreSource(htmlSource)+
    ';return {core:m_core_index, rules:m_data_rules.RULES};')();
  const old=legacy.core.createState(42);
  legacy.core.advance(old,4320);
  const oldSnapshot=JSON.parse(legacy.core.save(old));
  assert.equal(oldSnapshot.rulesVersion,11);
  assert(legacy.core.audit(old).ok);
  const loaded=e.load(legacy.core.save(old),undefined,e.rules);
  assert.equal(loaded.rulesVersion,14);
  assert.equal(loaded.schema,oldSnapshot.schema);
  for (const [id, oldShip] of Object.entries(oldSnapshot.ships)) {
    const now=loaded.ships[id];
    const {sollplatz, ...oldFields}=now;
    assert.deepEqual(JSON.parse(JSON.stringify(oldFields)),oldShip,'Alle bisherigen Schiffsdaten unverändert');
    if(oldSnapshot.sollflotte[now.owner]?.length)assert(Number.isSafeInteger(sollplatz));
  }
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.owners)),oldSnapshot.owners,'Kassen unverändert');
  assert.deepEqual(JSON.parse(JSON.stringify(loaded.ledger)),oldSnapshot.ledger,'Warenbuchhaltung unverändert');
  assert(e.audit(loaded).ok);
  const copy=e.load(e.save(loaded),undefined,e.rules);
  assert.equal(e.hash(copy),e.hash(loaded),'v14 Save/Load nach Migration');
  const c=new Function(htmlSource.slice(htmlSource.indexOf('<script>')+8,
    htmlSource.indexOf('const m_data_oberflaeche'))+
    ';return {core:m_core_index,rules:m_data_rules.RULES};')();
  c.core.advance(loaded,1440,c.rules);
  c.core.advance(copy,1440,c.rules);
  assert.equal(c.core.hash(loaded),c.core.hash(copy),'Deterministische Fortsetzung migrierter v11-Spielstände');
  assert(c.core.audit(loaded).ok);
});


test('Regelversion 12 wird ohne Buchungs- oder Arbeitsdatenverlust nach 13 migriert', () => {
  const e=engine(),current=e.create(13,e.rules),alt=JSON.parse(e.save(current));
  for(const x of Object.values(alt.ships))delete x.sollplatz;
  const s=Object.values(alt.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert(s);
  s.auftrag='halten';s.phase='reise';s.ziel='st_cyris';s.ankunft=alt.tick+25;s.arbeit=17;
  alt.rulesVersion=12;
  const before=JSON.stringify(alt);
  const restored=e.load(before,undefined,e.rules);
  assert.equal(restored.rulesVersion,14);
  assert.equal(restored.schema,8);
  assert.equal(restored.ships[s.id].arbeit,17);
  assert.equal(restored.ships[s.id].phase,'reise');
  assert.equal(restored.ships[s.id].auftrag,'halten');
  assert.equal(restored.ships[s.id].sollplatz, current.ships[s.id].sollplatz);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.owners)),alt.owners);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.ledger)),alt.ledger);
  assert.equal(JSON.stringify(alt),before,'Eingangsdaten dürfen nicht verändert werden');
  assert.ok(e.audit(restored).ok);
  const copy=e.load(e.save(restored),undefined,e.rules);
  assert.equal(e.hash(copy),e.hash(restored));
  const future=structuredClone(restored);future.rulesVersion=15;
  assert.throws(()=>e.load(JSON.stringify(future),undefined,e.rules),/neuer/);
});
