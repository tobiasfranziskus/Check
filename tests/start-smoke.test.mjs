// Start-Smoketest mit kontrolliertem DOM und IndexedDB; kein Browser erforderlich.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.slice(html.indexOf('<script>\n') + 8, html.lastIndexOf('</script>'));

function createBrowser() {
  const nodes = new Map();
  const all = [];
  function addNode(tagName, attrs = '', id = null) {
    const listeners = {};
    const dataset = {};
    const cls = attrs.match(/\bclass="([^"]+)"/)?.[1] || '';
    for (const match of attrs.matchAll(/\bdata-([a-z-]+)="([^"]+)"/g)) {
      dataset[match[1].replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())] = match[2];
    }
    const node = {
      id, tagName: tagName.toUpperCase(), dataset, className: cls,
      hidden: /(?:^|\s)hidden(?:\s|$)/.test(attrs),
      innerHTML: '', textContent: '', children: [], scrollTop: 0,
      style: { removeProperty() {}, setProperty() {} }, attributes: {}, listeners,
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(type, callback) { (listeners[type] ||= []).push(callback); },
      setAttribute(key, val) { this.attributes[key] = String(val); },
      removeAttribute(key) { delete this.attributes[key]; },
      append(...children) { this.children.push(...children); },
      focus() {},
      remove() {},
      getBoundingClientRect() { return { width: 1000, height: 1000, top: 0, left: 0 }; },
      querySelector(selector) {
        return selector === 'button' ? this.children.find(child => child.tagName === 'BUTTON') || null : null;
      },
      querySelectorAll(selector) {
        return selector.includes('button') ? this.children.filter(child => child.tagName === 'BUTTON') : [];
      },
    };
    if (id) nodes.set(id, node);
    all.push(node);
    return node;
  }

  for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const tag = match[1];
    if (tag === 'script' || tag === 'style') continue;
    const attrs = match[2];
    const id = attrs.match(/\bid="([^"]+)"/)?.[1] || null;
    if (id || /\bdata-(stufe|ansicht|ansicht-ziel)\b/.test(attrs) ||
        attrs.includes('class="blatt-tafel"') || attrs.includes('class="blatt-inhalt"'))
      addNode(tag, attrs, id);
  }

  const document = {
    getElementById: id => nodes.get(id) || null,
    querySelector(selector) {
      if (selector === 'meta[name=aphros-version]') return { content: 'v0.11.1' };
      if (selector === 'meta[name=theme-color]') return { content: '#ffffff' };
      if (selector === '.blatt-seite:not([hidden])')
        return all.find(node => node.className.split(/\s+/).includes('blatt-seite') && !node.hidden) || null;
      if (selector.startsWith('.'))
        return all.find(node => node.className.split(/\s+/).includes(selector.slice(1))) || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-stufe]') return all.filter(node => node.dataset.stufe !== undefined);
      if (selector === '[data-ansicht]' || selector === '.leiste button')
        return all.filter(node => node.dataset.ansicht !== undefined);
      if (selector === '[data-ansicht-ziel]')
        return all.filter(node => node.dataset.ansichtZiel !== undefined);
      if (selector === '.ansicht')
        return all.filter(node => node.className.split(/\s+/).includes('ansicht'));
      if (selector === '.blatt-seite')
        return all.filter(node => node.className.split(/\s+/).includes('blatt-seite'));
      return [];
    },
    createElement: tag => addNode(tag),
    createElementNS: (_namespace, tag) => addNode(tag),
    addEventListener() {},
    body: { append() {} },
    activeElement: null,
    visibilityState: 'visible',
  };
  const storage = new Map();
  const db = {
    createObjectStore() {},
    transaction() {
      const transaction = {
        objectStore() {
          return {
            get(key) {
              const request = { result: storage.get(key) };
              Promise.resolve().then(() => request.onsuccess?.());
              return request;
            },
            put(value, key) {
              storage.set(key, value);
              Promise.resolve().then(() => transaction.oncomplete?.());
            },
          };
        },
      };
      return transaction;
    },
  };
  const indexedDB = {
    open() {
      const req = { result: db };
      Promise.resolve().then(() => req.onsuccess?.());
      return req;
    },
  };
  const sandbox = {
    document, indexedDB,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    navigator: { storage: null },
    performance: { now: () => 1 },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    addEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '#000000' }),
    location: { reload() {} },
    setTimeout() {},
  };
  const fire = (node, kind, event = {}) => {
    const item = typeof node === 'string' ? nodes.get(node) : node;
    assert.ok(item, 'Element existiert: ' + node);
    assert.ok(item.listeners[kind]?.length, 'Event angebunden: ' + (item.id || item.dataset.stufe || item.dataset.ansicht));
    for (const callback of item.listeners[kind]) callback(event);
  };
  return { sandbox, nodes, all, fire };
}

test('Gesamter Start: Pause, Flotte, Schiffsauswahl, Simulation', async () => {
  const browser = createBrowser();
  vm.runInNewContext(script, browser.sandbox, { timeout: 10000 });
  for (let i = 0; i < 24; i++) await Promise.resolve();

  const get = id => browser.nodes.get(id);
  assert.equal(get('stufentext').textContent, 'Pausiert');
  assert.match(get('hq-kasse').textContent, /2 000 ISK/);
  const speed = browser.all.find(item => item.dataset.stufe === 'x1');
  browser.fire(speed, 'click');
  assert.equal(get('stufentext').textContent, 'Läuft 1×');

  browser.fire(browser.all.find(item => item.dataset.ansicht === 'flotte'), 'click');
  assert.equal(get('ansicht-flotte').hidden, false);
  assert.match(get('flotte-schiffe').innerHTML, /data-schiff="sh001"/);
  assert.match(get('flotte-schiffe').innerHTML, /data-schiff="sh002"/);

  browser.fire('flotte-schiffe', 'click', {
    target: { closest: () => ({ dataset: { schiff: 'sh001' } }) },
  });
  assert.equal(get('blatt').hidden, false);
  assert.equal(get('blatt-titel').textContent, 'Miner');
  assert.match(get('schiff-befehle').innerHTML, /Handeln \(\d+\)/);

  browser.fire('b-hour', 'click');
  assert.equal(get('spielzeit').textContent, 'Tag 1 · 01:00');
});


test('iPad-Bedienpfad: Miner per Dialog umbenennen und wieder zurücksetzen', async () => {
  const browser = createBrowser();
  vm.runInNewContext(script, browser.sandbox, { timeout: 10000 });
  for (let i = 0; i < 24; i++) await Promise.resolve();
  const get = id => browser.nodes.get(id);

  browser.fire(browser.all.find(item => item.dataset.ansicht === 'flotte'), 'click');
  browser.fire('flotte-schiffe', 'click', {
    target: { closest: () => ({ dataset: { schiff: 'sh001' } }) },
  });
  assert.equal(get('blatt-titel').textContent, 'Miner');

  browser.fire('b-schiff-umbenennen', 'click');
  const input = get('dialog-eingabe');
  assert.equal(input.hidden, false);
  assert.equal(input.placeholder, 'Miner');
  input.value = 'Aurora';
  let save = get('dialog-knoepfe').children.find(button => button.textContent === 'Speichern');
  assert.ok(save, 'Speichern-Knopf im Dialog');
  browser.fire(save, 'click');
  assert.equal(get('dialog').hidden, true);
  assert.equal(get('blatt-titel').textContent, 'Aurora');
  assert.match(get('flotte-schiffe').innerHTML, /Aurora/);

  browser.fire('b-schiff-umbenennen', 'click');
  assert.equal(input.value, 'Aurora');
  input.value = '';
  save = [...get('dialog-knoepfe').children].reverse()
    .find(button => button.textContent === 'Speichern');
  browser.fire(save, 'click');
  assert.equal(get('blatt-titel').textContent, 'Miner');
  assert.match(get('flotte-schiffe').innerHTML, / Miner<\/span>/);
});
