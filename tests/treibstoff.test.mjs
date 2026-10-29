import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('<script>') + 8, html.indexOf('const m_data_oberflaeche'));
const { c, r, h, a, fuel, b } = new Function(source + ';return {c:m_core_index,r:m_data_rules.RULES,h:m_core_handel,a:m_core_ankunft,fuel:m_core_treibstoff,b:m_core_schiffbau};')();
function fixture() { const s = c.createState(7); return { s, ship: Object.values(s.ships).find(x => x.owner === 'npc1' && x.system === 'aldera') }; }
function buy(s, ship, ware, menge) { assert(c.execute(s, {type:'shipTrade', owner:ship.owner, schiff:ship.id, ware, menge, kauf:true}).ok); }
test('Reserve bezahlt, Handelsware einschließlich einzelner Einheit bleibt verkaufbar', () => {
  for (const cargo of [3, 22]) {
    const { s, ship } = fixture(); const cash = s.owners[ship.owner].cash;
    buy(s, ship, 'treibstoff', cargo);
    assert(s.owners[ship.owner].cash < cash);
    const before = s.stations.st_aldera.lager.treibstoff;
    a.entladen(s, r, ship);
    assert.equal(ship.ladung.treibstoff, 2);
    assert.equal(s.stations.st_aldera.lager.treibstoff - before, cargo - 2);
    assert(c.audit(s).ok);
  }
});
test('Plan und Ausführung: Gebühren, Bordverbrauch und Frachtraum', () => {
  const { s, ship } = fixture(); buy(s, ship, 'treibstoff', 2);
  const plan = fuel.treibstoffPlan(s, r, ship, 'st_aldera', 3);
  const cash = s.owners[ship.owner].cash, consumed = s.ledger.treibstoff.consumed;
  assert(h.tanken(s, r, ship, 'st_aldera', 3, true));
  assert.equal(cash - s.owners[ship.owner].cash, plan.cash);
  assert.equal(s.ledger.treibstoff.consumed - consumed, 3);
  assert.equal(ship.ladung.treibstoff, plan.post);
  assert(Object.values(ship.ladung).reduce((a,b)=>a+b,0) <= r.economy.cargo);
  assert(c.audit(s).ok);
});
test('Trockene Station: Bordreserve ermöglicht Abflug, ohne Kaufkraft keine ungedeckte Zahlung', () => {
  const { s, ship } = fixture(); buy(s, ship, 'treibstoff', 2);
  // Bilanzierte, isolierte Verbrauchs-/Kostensituation, keine Referenzsimulation.
  const amount = s.stations.st_aldera.lager.treibstoff;
  s.stations.st_aldera.lager.treibstoff = 0; s.ledger.treibstoff.consumed += amount;
  s.burned += s.owners[ship.owner].cash; s.owners[ship.owner].cash = 0;
  assert(h.tanken(s, r, ship, 'st_aldera', 1, true));
  assert.equal(ship.ladung.treibstoff, 1);
  const before = c.save(s);
  assert.equal(h.tanken(s, r, ship, 'st_aldera', 2, true), false);
  assert.equal(c.save(s), before);
  assert(c.audit(s).ok);
});
test('Voller Frachtraum: keine zusätzliche Reserve; Spieler tankt unverändert aus Station', () => {
  const { s, ship } = fixture(); buy(s, ship, 'erz', 100);
  assert.equal(fuel.reserveErgaenzen(s, r, ship, 'st_aldera'), 0);
  const player = s.ships.sh002; buy(s, player, 'treibstoff', 2);
  const before = s.stations.st_aldera.lager.treibstoff;
  assert(h.tanken(s, r, player, 'st_aldera', 1, true));
  assert.equal(player.ladung.treibstoff, 2);
  assert.equal(s.stations.st_aldera.lager.treibstoff, before - 1);
  assert(c.audit(s).ok);
});
test('Regelmigration 7→9 erhält Reise, Treibstofffracht und sämtliche Konten', () => {
  const { s, ship } = fixture(); buy(s, ship, 'treibstoff', 3);
  assert(c.execute(s, {type:'shipMove',owner:ship.owner,schiff:ship.id,ziel:'st_cyris'}).ok);
  s.rulesVersion = 7;
  const old = c.save(s), restored = c.load(old);
  s.rulesVersion = 9;
  assert.equal(c.hash(restored), c.hash(s));
  assert.equal(restored.ships[ship.id].phase, 'reise');
  assert.equal(restored.ships[ship.id].ladung.treibstoff, 3);
  assert.equal(restored.schema, 8);
  assert(c.audit(restored).ok);
  for(let i=0;i<60;i++) { c.step(s); c.step(restored); }
  assert.equal(c.hash(restored), c.hash(s));
});
test('Regulärer Ersatz bezahlt Schiff und Überführung; Heimat/Soll bleiben korrekt', () => {
  const { s, ship } = fixture();
  const target = Object.values(s.ships).find(x => x.owner === 'npc1' && x.heimat === 'cyris');
  delete s.ships[target.id]; delete s.stats.verkaeufe[target.id]; // isolierter leerer Sollplatz
  const before = s.owners.npc1.cash, soll = c.canonical(s.sollflotte);
  b.ersatzkauf(s,r);
  const replacement = Object.values(s.ships).find(x=>x.owner==='npc1'&&x.heimat==='cyris');
  assert(replacement); assert.equal(replacement.ladung.treibstoff,2);
  assert.equal(replacement.phase, 'reise'); assert.equal(replacement.heimat, 'cyris');
  assert(s.ledger.treibstoff.consumed > 0);
  assert(s.owners.npc1.cash < before); assert.equal(c.canonical(s.sollflotte),soll);
  const paid = s.owners.npc1.cash;
  b.ersatzkauf(s,r); assert.equal(s.owners.npc1.cash,paid);
  assert(c.audit(s).ok);
});

test('Realer Regel-7-Spielstand mitten auf Reise migriert ausschließlich die Regelnummer', () => {
  const text = fs.readFileSync(new URL('./fixtures/rules7-inflight.json', import.meta.url), 'utf8');
  const expected = JSON.parse(text); expected.rulesVersion = 9;
  const restored = c.load(text);
  assert.equal(c.canonical(restored), c.canonical(expected));
  assert(Object.values(restored.ships).some(x => x.phase === 'reise' && x.ladung.treibstoff > 0));
  assert(c.audit(restored).ok);
  const again = c.load(c.save(restored));
  c.advance(restored, 120); c.advance(again, 120);
  assert.equal(c.hash(restored), c.hash(again)); assert(c.audit(restored).ok);
});

test('Zukünftige Regelversion wird nicht stillschweigend übernommen', () => {
  const { s } = fixture(); s.rulesVersion = 10;
  assert.throws(() => c.load(c.save(s)), /neuer/);
});
