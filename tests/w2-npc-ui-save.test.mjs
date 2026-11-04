import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
const uiStart = html.indexOf('const m_ui_erzpilot =');
assert.ok(begin >= 0 && end > begin && uiStart > end);
const coreSource = html.slice(begin, end);
const uiSource = html.slice(uiStart, html.indexOf('</script>', uiStart));
const W2_SLOT = 'aphros-void-w2-regel16-v1';
const W1_SLOT = 'aphros-void-erzpilot-regel15-v1';

class FakeElement {
  constructor() {
    this.disabled = false; this.hidden = false; this.style = {};
    this.textContent = ''; this.value = ''; this.href = '';
    this.listeners = {};
    this.classList = { add() {}, toggle() {} };
  }
  addEventListener(kind, callback) { this.listeners[kind] = callback; }
  click() { const e={preventDefault() {},target:this}; return this.listeners.click ? this.listeners.click(e) : this.onclick?.(e); }
  replaceChildren(...children) { this.children = children; }
}
async function settle() { for (let i = 0; i < 15; i++) await Promise.resolve(); }

function boot(mode, initial = {}) {
  const ids = [...html.matchAll(/id="(pilot-[^"]+|erzpilot-app|miner2d|m2-[^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'keine doppelten UI-IDs');
  const el = Object.fromEntries(ids.map(id => [id, new FakeElement()]));
  const store = new Map(Object.entries(initial)), downloads = [], navigations = [];
  const document = {
    hidden: false, body: { classList: { add() {} } },
    getElementById(id) { assert.ok(el[id], 'fehlende UI-ID: '+id); return el[id]; },
    createElement() { return new FakeElement(); },
    addEventListener() {},
  };
  const location = { search: '?modus=' + mode, set href(next) { navigations.push(next); } };
  const sandbox = {
    document, location, Date, URLSearchParams, confirm: () => true,
    matchMedia: () => ({matches:false}), addEventListener() {},
    requestAnimationFrame() {},
    __store: store, __downloads: downloads,
  };
  const services = `
    const m_ui_speicher = {
      dbPut: (key, value) => { __store.set(key,value); return Promise.resolve(); },
      dbGet: (key) => Promise.resolve(__store.get(key)),
      dateiSichern: (text,name) => __downloads.push({text,name})
    };
    const m_ui_miner2d = {
      zustand(s,rules,ship) { return {t:s.tick,entities:Object.values(s.ships).map(x=>({
        id:x.id,nm:x.id,owner:x.owner,ware:'',x:0,y:0
      }))}; },
      grafik:()=>({radius:1,zeichnen(){}}),
      eingabe:()=>({clear(){}}), treffer:()=>null
    };
  `;
  vm.runInNewContext(coreSource+'\n'+services+uiSource, sandbox, {timeout:5000});
  return {el, store, downloads, navigations};
}

test('W2-Konten: eigener Regel16-Spielstand; W1, Regel14 und Alt-Save nicht beruehrt', async () => {
  const initial = { slot1:'ALTES-ORIGINAL', [W1_SLOT]:'W1-SAVE-UNVERAENDERT' };
  const {el, store} = boot('w2konzern',initial);
  assert.equal(el['pilot-kauf'].disabled,true,'bis Ende der Ladepruefung gesperrt');
  await settle();
  assert.equal(el['pilot-w2-panel'].hidden,false);
  assert.match(el['pilot-version'].textContent,/Regel 16/);
  assert.match(el['pilot-titel'].textContent,/W2/);
  assert.equal(el['pilot-w2-link'].hidden,true);
  assert.equal(el['pilot-w1-link'].hidden,false);
  assert.equal(el['pilot-kauf'].disabled,false);
  assert.match(el['pilot-w2-status'].textContent,/Arbeitsbereit/);
  assert.equal(el['pilot-w2-miner'].textContent,'1 / 0');
  el['pilot-stunde'].click();
  el['pilot-stunde'].click();
  await settle();
  assert.ok(store.has(W2_SLOT));
  const s = JSON.parse(store.get(W2_SLOT));
  assert.equal(s.rulesVersion,16);
  assert.equal(s.tick,120);
  assert.equal(Object.values(s.ships).filter(x=>x.owner==='npc3').length,2,
    'bezahlte NPC-Investition wird auch in der UI-Welt ausgefuehrt');
  assert.equal(el['pilot-w2-miner'].textContent,'2 / 0');
  assert.equal(el['pilot-audit'].textContent,'ISK + Waren + Vollkosten OK');
  assert.equal(store.get('slot1'),'ALTES-ORIGINAL');
  assert.equal(store.get(W1_SLOT),'W1-SAVE-UNVERAENDERT');
});

test('W2-Marktkrise wird angezeigt; fortgesetzte Stunde erzeugt weder gratis Nachfrage noch NPC-Arbeit', async () => {
  const {el,store} = boot('w2konzern');
  await settle();
  el['pilot-tag'].click();
  await settle();
  const before = JSON.parse(store.get(W2_SLOT));
  assert.equal(before.owners.export.cash,0);
  assert.equal(before.ledger.erz.exported,2000);
  assert.match(el['pilot-w2-status'].textContent,/Kein finanzierter Absatz/);
  assert.match(el['pilot-w2-miner'].textContent,/2 \/ 2/);
  assert.equal(el['pilot-w2-nachweis'].textContent,'Ja (endlicher Etat)');
  assert.match(el['pilot-w2-vorbestand'].textContent,/\\d+ Erz/);
  assert.match(el['pilot-w2-kundenluecke'].textContent,/\\d+ ISK/);
  assert.match(el['pilot-w2-kaeufer'].textContent,/0 Erz/);
  assert.ok(before.owners.npc3.cash>0,'Absatzstopp ist keine Insolvenz');
  el['pilot-tag'].click();
  await settle();
  const after = JSON.parse(store.get(W2_SLOT));
  assert.equal(after.ledger.erz.mined,before.ledger.erz.mined);
  assert.equal(after.owners.npc3.cash,before.owners.npc3.cash);
  assert.equal(after.minted,0);
});

test('W2 2D-Vorschau nutzt die echte Regel16-Welt statt eines zweiten Wirtschaftskerns', async () => {
  const {el,store} = boot('w2miner2d');
  await settle();
  assert.equal(el.miner2d.hidden,false);
  assert.equal(el['pilot-w2-panel'].hidden,false);
  assert.match(el['m2-status'].textContent,/Noch kein eigenes Schiff/);
  el['pilot-kauf'].click();
  await settle();
  assert.match(el['m2-status'].textContent,/sh002/);
  el['pilot-abbau'].click();
  el['m2-step'].click();
  await settle();
  assert.equal(JSON.parse(store.get(W2_SLOT)).rulesVersion,16);
  assert.ok(!store.has(W1_SLOT));
  assert.ok(!store.has('slot1'));
  assert.equal(el['pilot-audit'].textContent,'ISK + Waren + Vollkosten OK');
});

test('W2-Save: JSON-Export, Restart mit Archiv und W1-Importabweisung', async () => {
  const source = {slot1:'ALTDATEN', [W1_SLOT]:'W1-GESCHUETZT'};
  const {el,store,downloads} = boot('w2konzern',source);
  await settle();
  el['pilot-stunde'].click();
  await settle();
  const old=store.get(W2_SLOT);
  el['pilot-datei'].click();
  assert.equal(downloads.length,1);
  assert.match(downloads[0].name,/regel16-tick-60/);
  assert.equal(downloads[0].text,old);
  await el['pilot-neu'].click();
  await settle();
  const archives=[...store.keys()].filter(x=>x.startsWith(W2_SLOT+'-archiv-'));
  assert.equal(archives.length,1);
  assert.equal(store.get(archives[0]),old);
  assert.equal(JSON.parse(store.get(W2_SLOT)).tick,0);
  const w1=JSON.parse(old);w1.rulesVersion=15;
  const current=store.get(W2_SLOT);
  await el['pilot-datei-input'].listeners.change({target:{
    files:[{text:async()=>JSON.stringify(w1)}],value:'x'
  }});
  await settle();
  assert.equal(store.get(W2_SLOT),current,'inkompatibler Import veraendert nichts');
  assert.match(el['pilot-meldung'].textContent,/Import abgelehnt/);
  assert.equal(store.get('slot1'),'ALTDATEN');
  assert.equal(store.get(W1_SLOT),'W1-GESCHUETZT');
});

test('W2: Konten und 2D laden exakt denselben gespeicherten Regel16-Stand', async () => {
  const a=boot('w2konzern');
  await settle();
  a.el['pilot-stunde'].click();
  a.el['pilot-stunde'].click();
  await settle();
  const before=a.store.get(W2_SLOT), hash=a.el['pilot-hash'].textContent;
  const b=boot('w2miner2d',Object.fromEntries(a.store));
  await settle();
  assert.equal(b.el['pilot-hash'].textContent,hash);
  assert.equal(b.el['pilot-w2-miner'].textContent,'2 / 0');
  assert.equal(b.store.get(W2_SLOT),before,'nur Anzeigenwechsel, keine versteckte Weltstunde');
  b.el['m2-step'].click();
  await settle();
  const after=b.store.get(W2_SLOT);
  assert.equal(JSON.parse(after).tick,121);
  const c=boot('w2konzern',Object.fromEntries(b.store));
  await settle();
  assert.equal(c.el['pilot-hash'].textContent,b.el['pilot-hash'].textContent);
  assert.equal(c.store.get(W2_SLOT),after);
  assert.equal(c.el['pilot-audit'].textContent,'ISK + Waren + Vollkosten OK');
});

test('W2-Save: beschaedigten eigenen Slot niemals still ersetzen', async () => {
  const bad='{"rulesVersion":16,"korrupt":true}';
  const {el,store,downloads}=boot('w2konzern',{[W2_SLOT]:bad});
  await settle();
  assert.equal(el['pilot-stunde'].disabled,true);
  assert.equal(el['pilot-kauf'].disabled,true);
  assert.equal(store.get(W2_SLOT),bad);
  el['pilot-datei'].click();
  assert.equal(downloads[0].text,bad);
  assert.match(downloads[0].name,/regel16-beschaedigt/);
});
