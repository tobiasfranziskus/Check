// Entwicklungstest für die Einzeldatei; benötigt ausschließlich Node.js (kein npm).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_ui_main =');
assert.ok(start >= 0 && end > start, 'Modulgrenzen in index.html gefunden');
const js = html.slice(start, end);
const fullScript = html.slice(html.indexOf('<script>\n') + 8, html.lastIndexOf('</script>'));

function environment() {
  const elements = new Map();
  function element(id) {
    let innerHTML = '';
    let details = [];
    return {
      id, dataset: {}, children: [], events: {}, textContent: '', onclick: null,
      addEventListener(kind, callback) { (this.events[kind] ||= []).push(callback); },
      append(child) { this.children.push(child); },
      setAttribute() {},
      get innerHTML() { return innerHTML; },
      set innerHTML(value) {
        innerHTML = value;
        details = [...value.matchAll(/<details class="befehle-gruppe" data-gruppe="([^"]+)"( open)?>/g)]
          .map(match => ({ dataset: { gruppe: match[1] }, open: !!match[2] }));
      },
      querySelectorAll(selector) { return selector === 'details[data-gruppe]' ? details : []; },
    };
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element(id));
      return elements.get(id);
    },
    createElement: element,
  };
  const E = vm.runInNewContext(js + '\n({ ' + [
    'rules: m_data_rules.RULES',
    'createState: m_core_state.createState',
    'step: m_core_step.step',
    'execute: m_core_commands.execute',
    'submit: m_core_commands.submit',
    'trade: m_core_handel.handel',
    'price: m_core_preis.preis',
    'fee: m_core_handel.gebuehr',
    'hash: m_core_hash.hash',
    'audit: m_core_audit.audit',
    'save: m_core_serialize.save',
    'load: m_core_index.load',
    'dirty: m_ui_dirty',
    'createMarket: m_ui_markt_ansicht.marktErzeugen',
    'drawShip: m_ui_flotte_ansicht.schiffZeichnen',
    'offers: m_ui_handelsangebot',
  ].join(', ') + ' })', { document });
  const state = E.createState(42, E.rules);
  const own = Object.values(state.ships).filter(ship => ship.owner === E.rules.economy.start.owner);
  const miner = own.find(ship => ship.klasse === 'miner');
  const freighter = own.find(ship => ship.klasse === 'frachter');
  const commands = [];
  const shipCommands = [];
  const market = E.createMarket(() => {}, () => {}, () => state, cmd => commands.push(cmd));

  function renderMarket() {
    E.dirty.bump();
    market.zeichnen(state);
    return elements.get('markt-preise').innerHTML;
  }
  function renderShip(id = freighter.id) {
    E.dirty.bump();
    E.drawShip(state, id, cmd => shipCommands.push(cmd));
    return elements.get('schiff-befehle').innerHTML;
  }
  function button(markup, side, ware, field = 'trade') {
    for (const match of markup.matchAll(/<button\b([^>]*)>([^<]*)<\/button>/g)) {
      const data = Object.fromEntries([...match[1].matchAll(/data-([a-z-]+)="([^"]+)"/g)]
        .map(item => [item[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase()), item[2]]));
      if (data[field] === side && data[field === 'trade' ? 'tradeWare' : 'ware'] === ware)
        return { data, text: match[2] };
    }
    return null;
  }
  function clickShip(b) {
    elements.get('schiff-befehle').onclick({
      target: { closest: () => ({ dataset: b.data }) },
    });
    return shipCommands.at(-1);
  }
  function clickMarket(b) {
    for (const callback of elements.get('markt-preise').events.click)
      callback({ target: { closest: () => ({ dataset: b.data }) } });
    return commands.at(-1);
  }
  return { E, state, miner, freighter, elements, renderMarket, renderShip, button, clickShip, clickMarket };
}

test('Gesamtes Inline-JavaScript bleibt syntaktisch gültig', () => {
  assert.doesNotThrow(() => new vm.Script(fullScript));
  assert.ok(html.includes('  spielstandZeigen();'), 'Start-Hotfix enthalten');
  assert.ok(html.includes('@media (min-width: 900px) and (orientation: landscape)'), 'Querformat enthalten');
});

test('Markt und Schiff: 10 Erz für 104 ISK, identische Menge', () => {
  const a = environment();
  const m = a.button(a.renderMarket(), 'buy', 'erz');
  const s = a.button(a.renderShip(a.miner.id), 'buy', 'erz', 'befehl');
  assert.equal(m.data.menge, '10');
  assert.equal(s.data.menge, '10');
  assert.match(m.text, /104 ISK inkl. Gebühr/);
  assert.match(s.text, /104 ISK inkl. Gebühr/);
});

test('Knappe Spielerkasse: 4 Erz für 41 ISK statt ungültiger 10er-Kauf', () => {
  const a = environment();
  const transfer = a.state.owners.house.cash - 50;
  a.state.owners.house.cash -= transfer;
  a.state.owners.st_aldera.cash += transfer;
  assert.ok(a.E.audit(a.state).ok, 'Testkasse bilanzneutral verändert');
  const m = a.button(a.renderMarket(), 'buy', 'erz');
  const s = a.button(a.renderShip(a.miner.id), 'buy', 'erz', 'befehl');
  assert.equal(m.data.menge, '4');
  assert.equal(s.data.menge, '4');
  const command = a.clickShip(s);
  const before = a.state.owners.house.cash;
  assert.ok(a.E.execute(a.state, command, a.E.rules).ok);
  assert.equal(before - a.state.owners.house.cash, 41);
  assert.ok(a.E.audit(a.state).ok);
});

test('Ohne ISK: kein ungültiger Kaufbutton, stattdessen Hinweis', () => {
  const a = environment();
  a.state.owners.house.cash = 0;
  const view = a.renderShip();
  assert.equal(a.button(view, 'buy', 'erz', 'befehl'), null);
  assert.match(view, /Derzeit kein Handel möglich/);
});

test('Stationsreserve: nur zwei Erz kaufbar, in beiden Ansichten', () => {
  const a = environment();
  a.state.stations.st_aldera.lager.erz = 122;
  assert.equal(a.button(a.renderMarket(), 'buy', 'erz').data.menge, '2');
  assert.equal(a.button(a.renderShip(), 'buy', 'erz', 'befehl').data.menge, '2');
});

test('Frachtraum: Markt findet Frachter mit drei freien Plätzen', () => {
  const a = environment();
  a.miner.ladung.erz = 98;
  a.freighter.ladung.erz = 97;
  const m = a.button(a.renderMarket(), 'buy', 'erz');
  assert.equal(m.data.schiff, a.freighter.id);
  assert.equal(m.data.menge, '3');
  assert.equal(a.button(a.renderShip(), 'buy', 'erz', 'befehl').data.menge, '3');
});

test('Stationskasse begrenzt Verkauf auf fünf Erz und 48 ISK netto', () => {
  const a = environment();
  assert.ok(a.E.trade(a.state, a.E.rules, a.freighter, 'st_aldera', 'erz', 10, true));
  a.state.owners.st_aldera.cash = 50;
  const m = a.button(a.renderMarket(), 'sell', 'erz');
  const s = a.button(a.renderShip(), 'sell', 'erz', 'befehl');
  assert.equal(m.data.menge, '5');
  assert.equal(s.data.menge, '5');
  assert.match(s.text, /48 ISK netto/);
  const before = a.state.owners.house.cash;
  assert.ok(a.E.execute(a.state, a.clickShip(s), a.E.rules).ok);
  assert.equal(a.state.owners.house.cash - before, 48);
});

test('Schiffsdetails erlauben ganze Ladung, Markt weiterhin höchstens zehn', () => {
  const a = environment();
  for (const n of [10, 10, 5])
    assert.ok(a.E.trade(a.state, a.E.rules, a.freighter, 'st_aldera', 'erz', n, true));
  const m = a.button(a.renderMarket(), 'sell', 'erz');
  const s = a.button(a.renderShip(), 'sell', 'erz', 'befehl');
  assert.equal(m.data.menge, '10');
  assert.equal(s.data.menge, '25');
  const before = a.state.owners.house.cash;
  const preis = a.E.price(a.state, 'st_aldera', 'erz', a.E.rules);
  const fee = a.E.fee(a.state, a.E.rules, 'st_aldera', 25 * preis);
  assert.ok(a.E.execute(a.state, a.clickShip(s), a.E.rules).ok);
  assert.equal(a.state.owners.house.cash - before, 25 * preis - fee);
  assert.ok(a.E.audit(a.state).ok);
});

test('Jäger bleibt Einzelware: 935 ISK nicht ausreichend, 936 ausreichend', () => {
  const a = environment();
  a.state.owners.house.cash = 935;
  assert.equal(a.button(a.renderShip(), 'buy', 'jaeger', 'befehl'), null);
  a.state.owners.house.cash = 936;
  assert.equal(a.button(a.renderShip(), 'buy', 'jaeger', 'befehl').data.menge, '1');
});

test('Verkäufe von zwei Schiffen bleiben je Ware korrekt gebunden', () => {
  const a = environment();
  assert.ok(a.E.trade(a.state, a.E.rules, a.freighter, 'st_aldera', 'erz', 10, true));
  assert.ok(a.E.trade(a.state, a.E.rules, a.miner, 'st_aldera', 'jaeger', 1, true));
  const m = a.renderMarket();
  assert.equal(a.button(m, 'sell', 'erz').data.schiff, a.freighter.id);
  assert.equal(a.button(m, 'sell', 'jaeger').data.schiff, a.miner.id);
});

test('Befehlskette und geöffnete Handelsgruppe überleben einen Tick', () => {
  const a = environment();
  const button = a.button(a.renderShip(), 'buy', 'erz', 'befehl');
  const el = a.elements.get('schiff-befehle');
  el.querySelectorAll('details[data-gruppe]').find(d => d.dataset.gruppe === 'handel').open = true;
  const command = a.clickShip(button);
  assert.ok(a.E.submit(a.state, command, a.E.rules).ok);
  assert.ok(a.E.step(a.state, a.E.rules)[0].ok);
  a.renderShip();
  assert.equal(el.querySelectorAll('details[data-gruppe]').find(d => d.dataset.gruppe === 'handel').open, true);
});

test('Spielstand bleibt mit unverändertem Format ladbar', () => {
  const a = environment();
  const saved = a.E.save(a.state);
  const restored = a.E.load(saved, undefined, a.E.rules);
  assert.equal(a.E.hash(restored), a.E.hash(a.state));
});

test('Deterministische Drei-Tages-Simulation mit festen Referenz-Hashes', () => {
  const expected = [
    [42, '83c525ce00a82e1f'],
    [1234, 'ddbff4ee4451d56d'],
    [98765, 'beb70fdb280d85ba'],
  ];
  const a = environment();
  for (const [seed, hash] of expected) {
    const state = a.E.createState(seed, a.E.rules);
    for (let tick = 0; tick < 4320; tick++) a.E.step(state, a.E.rules);
    assert.equal(a.E.hash(state), hash, 'Seed ' + seed);
    assert.ok(a.E.audit(state).ok, 'Erhaltung: Seed ' + seed);
  }
});
