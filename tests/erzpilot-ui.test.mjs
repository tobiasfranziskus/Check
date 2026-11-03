import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const m_data_systeme =');
const uiStart = html.indexOf('const m_ui_erzpilot =');
const coreEnd = html.indexOf('const m_data_oberflaeche =');
assert.ok(start >= 0 && coreEnd > start && uiStart > coreEnd);
const core = html.slice(start, coreEnd);
const pilotUi = html.slice(uiStart, html.indexOf('</script>', uiStart));

class FakeElement {
  constructor() {
    this.disabled = false; this.hidden = false; this.style = {};
    this.textContent = ''; this.listeners = {};
    this.classList = { add() {}, toggle() {} };
  }
  addEventListener(event, cb) { this.listeners[event] = cb; }
  click() { return this.listeners.click?.({ target: this }); }
}
const tick = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function startPilot(initial = undefined) {
  const ids = [...html.matchAll(/id="(pilot-[^"]+|erzpilot-app)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'keine doppelten Pilot-IDs');
  const elements = Object.fromEntries(ids.map((id) => [id, new FakeElement()]));
  const store = new Map(initial === undefined ? [] : [['aphros-void-erzpilot-regel15-v1', initial]]);
  const document = {
    body: { classList: { add() {} } },
    getElementById(id) {
      assert.ok(elements[id], 'Pilot-ID im DOM vorhanden: ' + id);
      return elements[id];
    },
  };
  const sandbox = { document, location: { search: '?modus=erzpilot' }, URLSearchParams, confirm: () => true, Date };
  const setup = `
    const m_ui_speicher = {
      dbPut: (k, v) => { __store.set(k, v); return Promise.resolve(); },
      dbGet: (k) => Promise.resolve(__store.get(k)),
      dateiSichern: (text, name) => { __downloads.push({ text, name }); },
    };
  `;
  sandbox.__store = store;
  sandbox.__downloads = [];
  vm.runInNewContext(core + '\n' + setup + pilotUi, sandbox, { timeout: 5000 });
  return { elements, store, downloads: sandbox.__downloads };
}

test('Erzpilot ist explizit anwaehlbar und besitzt eigenen Browser-Speicher', async () => {
  assert.match(html, /href="\?modus=erzpilot"/);
  assert.match(html, /if \\(typeof location !== 'undefined' && [^\\n]*return \\{ pilot: true \\}/);
  const { elements: el, store, downloads } = startPilot();
  assert.equal(el['pilot-kauf'].disabled, true, 'UI wartet auf DB-Ladevorgang');
  await tick();
  assert.equal(el['pilot-kauf'].disabled, false, 'nach Start freigegeben');
  assert.match(el['pilot-kasse'].textContent, /3.000/);
  el['pilot-kauf'].click();
  el['pilot-abbau'].click();
  el['pilot-stunde'].click();
  await tick();
  assert.match(el['pilot-audit'].textContent, /ISK \+ Waren OK/);
  assert.equal(el['pilot-miner'].textContent, '1');
  assert.match(el['pilot-mengen'].textContent, /\d+ \/ \d+/);
  const slot = 'aphros-void-erzpilot-regel15-v1';
  assert.ok(store.has(slot), 'Erzpilot-Zustand separat gespeichert');
  assert.ok(!store.has('slot1'), 'regulärer Spielstand-Slot unberührt');
  const stand = JSON.parse(store.get(slot));
  assert.equal(stand.rulesVersion, 15);
  assert.equal(stand.ships.sh002.owner, 'house');
  el['pilot-datei'].click();
  assert.equal(downloads.length, 1);
  assert.match(downloads[0].name, /^aphros-erzpilot-regel15-tick-/);
  assert.equal(JSON.parse(downloads[0].text).tick, 60);
});

test('Erzpilot verweigert inkonsistente vorhandene Daten ohne Ueberschreiben', async () => {
  const kaputt = '{"schema":8,"rulesVersion":15,"unlesbar":true}';
  const { elements: el, store } = startPilot(kaputt);
  await tick();
  assert.equal(el['pilot-kauf'].disabled, true);
  assert.equal(el['pilot-stunde'].disabled, true);
  assert.equal(store.get('aphros-void-erzpilot-regel15-v1'), kaputt);
  assert.match(el['pilot-meldung'].textContent, /nicht lesbar/);
});

test('Neustart archiviert zuerst und ersetzt niemals bestehende Regel-14-Daten', async () => {
  const { elements: el, store } = startPilot();
  store.set('slot1', 'LEGACY-UNVERAENDERT');
  await tick();
  el['pilot-kauf'].click();
  await tick();
  const vorher = store.get('aphros-void-erzpilot-regel15-v1');
  await el['pilot-neu'].click();
  await tick();
  const archive = [...store.keys()].filter((key) => key.startsWith('aphros-void-erzpilot-regel15-v1-archiv-'));
  assert.equal(archive.length, 1);
  assert.equal(store.get(archive[0]), vorher);
  assert.equal(store.get('slot1'), 'LEGACY-UNVERAENDERT');
  assert.equal(JSON.parse(store.get('aphros-void-erzpilot-regel15-v1')).tick, 0);
});

test('Beschaedigter Pilotstand kann als Rohtext exportiert werden', async () => {
  const kaputt = '{"schema":8,"rulesVersion":15,"test":"kaputt"}';
  const { elements: el, downloads, store } = startPilot(kaputt);
  await tick();
  el['pilot-datei'].click();
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].text, kaputt);
  assert.equal(downloads[0].name, 'aphros-erzpilot-regel15-beschaedigt.json');
  assert.equal(store.get('aphros-void-erzpilot-regel15-v1'), kaputt);
});
