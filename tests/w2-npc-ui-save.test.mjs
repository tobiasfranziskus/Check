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
  // Der echte DOM initialisiert <section id="miner2d" hidden>; FakeElement
  // muss denselben Ausgangszustand abbilden.
  el.miner2d.hidden = true;
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
  assert.match(el['pilot-w2-vorbestand'].textContent,/[0-9]+ Erz/);
  assert.match(el['pilot-w2-kundenluecke'].textContent,/[0-9]+ ISK/);
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

test('W3 UI: Frachter bezahlen, Erz liefern und beide Flugstrecken sicher abrechnen',async()=>{
  const seed={slot1:'REGEL14-ALT',[W1_SLOT]:'REGEL15-ALT',[W2_SLOT]:'REGEL16-ALT'};
  const {el,store}=boot('w3frachter',seed);
  const W3_SLOT='aphros-void-w3-regel17-v1';
  await settle();
  assert.equal(el['pilot-w3-panel'].hidden,false);
  assert.equal(el['pilot-w2-panel'].hidden,false);
  assert.equal(el.miner2d.hidden,false);
  assert.match(el['pilot-version'].textContent,/Regel 17/);
  assert.equal(el['pilot-w3-start'].disabled,true);
  assert.equal(el['pilot-w3-kauf'].disabled,false);
  el['pilot-w3-kauf'].click();await settle();
  assert.match(el['pilot-w3-schiff'].textContent,/sh002/);
  el['pilot-w3-50'].click();await settle();
  assert.equal(el['pilot-w3-start'].disabled,false,'echtes Erz erst nach dem Core-Abbau');
  el['pilot-w3-start'].click();await settle();
  let s=JSON.parse(store.get(W3_SLOT));
  assert.equal(s.rulesVersion,17);
  assert.equal(s.w3.auftrag.phase,'hin');
  assert.equal(s.owners.st_nadir.cash,3260);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(s.minted,0);
  assert.equal(el['pilot-w3-audit'].textContent,'W3-Konten + Ware OK');
  el['pilot-stunde'].click();await settle();
  s=JSON.parse(store.get(W3_SLOT));
  assert.equal(s.w3.geliefert,50);
  assert.equal(s.w3.auftrag.phase,'rueck');
  assert.equal(s.stations.st_nadir.lager.erz,50);
  el['pilot-stunde'].click();await settle();
  s=JSON.parse(store.get(W3_SLOT));
  assert.equal(s.w3.abgeschlossen,1);
  assert.equal(s.w3.auftrag,null);
  assert.equal(s.owners.fonds_transport.cash,120);
  assert.equal(el['pilot-w3-audit'].textContent,'W3-Konten + Ware OK');
  assert.equal(store.get('slot1'),'REGEL14-ALT');
  assert.equal(store.get(W1_SLOT),'REGEL15-ALT');
  assert.equal(store.get(W2_SLOT),'REGEL16-ALT');
});

test('W3 UI: Konten- und 2D-Ansicht setzen exakt den gleichen geschützten Save fort',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1';
  const a=boot('w3frachter');
  await settle();
  a.el['pilot-w3-kauf'].click();
  a.el['pilot-w3-50'].click();
  a.el['pilot-w3-start'].click();
  await settle();
  const json=a.store.get(W3_SLOT),hash=a.el['pilot-hash'].textContent;
  const b=boot('w3konten',Object.fromEntries(a.store));
  await settle();
  assert.equal(b.el['pilot-w3-panel'].hidden,false);
  assert.equal(b.el.miner2d.hidden,true);
  assert.equal(b.el['pilot-hash'].textContent,hash);
  assert.equal(b.store.get(W3_SLOT),json);
  b.el['pilot-w3-50'].click();await settle();
  assert.equal(JSON.parse(b.store.get(W3_SLOT)).tick,100);
  const c=boot('w3frachter',Object.fromEntries(b.store));
  await settle();
  assert.equal(c.el['pilot-hash'].textContent,b.el['pilot-hash'].textContent);
  assert.equal(c.el['pilot-w3-audit'].textContent,'W3-Konten + Ware OK');
});

test('W3 UI: inkompatibler W2-Import scheitert, Neustart archiviert nur Regel17',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1';
  const {el,store,downloads}=boot('w3konten',{slot1:'ALT', [W1_SLOT]:'W1', [W2_SLOT]:'W2'});
  await settle();
  el['pilot-w3-kauf'].click();await settle();
  const old=store.get(W3_SLOT);
  el['pilot-datei'].click();
  assert.equal(downloads.length,1);
  assert.match(downloads[0].name,/regel17/);
  const invalid=JSON.parse(old);invalid.rulesVersion=16;
  await el['pilot-datei-input'].listeners.change({target:{
    files:[{text:async()=>JSON.stringify(invalid)}],value:'invalid'
  }});
  await settle();
  assert.equal(store.get(W3_SLOT),old);
  assert.match(el['pilot-meldung'].textContent,/Import abgelehnt/);
  await el['pilot-neu'].click();await settle();
  const archives=[...store.keys()].filter(k=>k.startsWith(W3_SLOT+'-archiv-'));
  assert.equal(archives.length,1);
  assert.equal(store.get(archives[0]),old);
  assert.equal(JSON.parse(store.get(W3_SLOT)).rulesVersion,17);
  assert.equal(store.get('slot1'),'ALT');
  assert.equal(store.get(W1_SLOT),'W1');
  assert.equal(store.get(W2_SLOT),'W2');
});

test('W4 UI: echte Fracht zuerst, dann 10 Erz zu 5 Material und 20 ISK Lohn',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1', W4_SLOT='aphros-void-w4-regel18-v1';
  const old={slot1:'MAIN-ALT',[W1_SLOT]:'W1-ALT',[W2_SLOT]:'W2-ALT',[W3_SLOT]:'W3-ALT'};
  const {el,store}=boot('w4raffinerie',old);
  await settle();
  assert.match(el['pilot-version'].textContent,/Regel 18/);
  assert.equal(el['pilot-w4-panel'].hidden,false);
  assert.equal(el['pilot-w3-panel'].hidden,false);
  assert.equal(el.miner2d.hidden,false);
  assert.equal(el['pilot-w4-start'].disabled,true,'ohne W3-Transport keine Erzverarbeitung');
  assert.equal(el['pilot-w3-kauf'].disabled,false);
  el['pilot-w3-kauf'].click();await settle();
  el['pilot-w3-50'].click();await settle();
  el['pilot-w3-start'].click();await settle();
  assert.equal(JSON.parse(store.get(W4_SLOT)).rulesVersion,18);
  assert.equal(el['pilot-w4-start'].disabled,true,'Erz nur an Bord, noch nicht in Nadir');
  el['pilot-stunde'].click();await settle();
  assert.equal(el['pilot-w4-erz'].textContent,'50 Erz');
  assert.equal(el['pilot-w4-material'].textContent,'0 Material');
  assert.equal(el['pilot-w4-start'].disabled,false);
  el['pilot-w4-start'].click();await settle();
  let s=JSON.parse(store.get(W4_SLOT));
  assert.equal(s.owners.st_nadir.cash,3240);
  assert.equal(s.owners.w4_arbeit_treuhand.cash,20);
  assert.equal(s.w4.auftrag.gearbeitet,0);
  assert.match(el['pilot-w4-status'].textContent,/20 Minuten/);
  assert.equal(el['pilot-w4-start'].disabled,true);
  assert.equal(el['pilot-w4-audit'].textContent,'Material + Arbeitslohn OK');
  el['pilot-w4-20'].click();await settle();
  s=JSON.parse(store.get(W4_SLOT));
  assert.equal(s.stations.st_nadir.lager.erz,40);
  assert.equal(s.stations.st_nadir.lager.material,5);
  assert.equal(s.w4.auftrag,null);
  assert.equal(s.ledger.material.produced,5);
  assert.equal(s.owners.arbeitskraefte_nadir.cash,20);
  assert.equal(s.owners.w4_arbeit_treuhand.cash,0);
  assert.equal(el['pilot-w4-material'].textContent,'5 Material');
  assert.equal(el['pilot-w4-lohn'].textContent,'20 ISK');
  assert.equal(el['pilot-w4-audit'].textContent,'Material + Arbeitslohn OK');
  assert.equal(el['pilot-audit'].textContent,'ISK + Waren + Vollkosten OK');
  assert.equal(s.minted,0);
  for(const [key,value] of Object.entries(old))assert.equal(store.get(key),value);
});

test('W4 UI: Konto-/2D-Wechsel liest denselben Hash, archiviert nur eigenen Save',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1', W4_SLOT='aphros-void-w4-regel18-v1';
  const old={slot1:'ALTMAIN',[W1_SLOT]:'ALT15',[W2_SLOT]:'ALT16',[W3_SLOT]:'ALT17'};
  const a=boot('w4raffinerie',old);
  await settle();
  a.el['pilot-w3-kauf'].click();await settle();
  a.el['pilot-w3-50'].click();await settle();
  a.el['pilot-w3-start'].click();await settle();
  a.el['pilot-stunde'].click();await settle();
  a.el['pilot-w4-start'].click();await settle();
  const before=a.store.get(W4_SLOT),hash=a.el['pilot-hash'].textContent;
  const b=boot('w4konten',Object.fromEntries(a.store));await settle();
  assert.equal(b.el['pilot-w4-panel'].hidden,false);
  assert.equal(b.el.miner2d.hidden,true);
  assert.equal(b.el['pilot-hash'].textContent,hash);
  assert.equal(b.store.get(W4_SLOT),before);
  b.el['pilot-w4-20'].click();await settle();
  const processed=b.store.get(W4_SLOT);
  assert.equal(JSON.parse(processed).w4.abgeschlossen,1);
  const c=boot('w4raffinerie',Object.fromEntries(b.store));await settle();
  assert.equal(c.el['pilot-hash'].textContent,b.el['pilot-hash'].textContent);
  assert.equal(c.store.get(W4_SLOT),processed);
  assert.equal(c.el['pilot-w4-audit'].textContent,'Material + Arbeitslohn OK');
  // Inkompatible andere Regel wird nicht still in Regel18 umgewandelt.
  const invalid=JSON.parse(processed);invalid.rulesVersion=17;
  await c.el['pilot-datei-input'].listeners.change({target:{
    files:[{text:async()=>JSON.stringify(invalid)}],value:'bad'
  }});await settle();
  assert.equal(c.store.get(W4_SLOT),processed);
  assert.match(c.el['pilot-meldung'].textContent,/Import abgelehnt/);
  c.el['pilot-datei'].click();
  assert.match(c.downloads[0].name,/regel18/);
  await c.el['pilot-neu'].click();await settle();
  const archives=[...c.store.keys()].filter(k=>k.startsWith(W4_SLOT+'-archiv-'));
  assert.equal(archives.length,1);
  assert.equal(c.store.get(archives[0]),processed);
  assert.equal(JSON.parse(c.store.get(W4_SLOT)).rulesVersion,18);
  for(const [key,value] of Object.entries(old))assert.equal(c.store.get(key),value);
});

test('W4 UI: beschädigter Regel18-Slot bleibt gesperrt und als Original exportierbar',async()=>{
  const W4_SLOT='aphros-void-w4-regel18-v1';
  const broken='{"rulesVersion":18,"fake":true}';
  const {el,store,downloads}=boot('w4konten',{[W4_SLOT]:broken});
  await settle();
  assert.equal(el['pilot-w4-start'].disabled,true);
  assert.equal(el['pilot-w3-start'].disabled,true);
  assert.equal(el['pilot-stunde'].disabled,true);
  assert.equal(store.get(W4_SLOT),broken);
  el['pilot-datei'].click();
  assert.equal(downloads[0].text,broken);
  assert.match(downloads[0].name,/regel18-beschaedigt/);
});

test('W5 UI: echtes Material, bezahlter Werftbau und realer Frachterkauf',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1',W4_SLOT='aphros-void-w4-regel18-v1',
    W5_SLOT='aphros-void-w5-regel19-v1';
  const originals={slot1:'MAIN-ALT',[W1_SLOT]:'W1-ALT',[W2_SLOT]:'W2-ALT',
    [W3_SLOT]:'W3-ALT',[W4_SLOT]:'W4-ALT'};
  const {el,store}=boot('w5werft',originals);
  await settle();
  assert.equal(el.miner2d.hidden,false);
  assert.equal(el['pilot-w5-panel'].hidden,false);
  assert.equal(el['pilot-w4-panel'].hidden,false);
  assert.match(el['pilot-version'].textContent,/Regel 19/);
  assert.equal(el['pilot-w5-bauen'].disabled,true,'zuerst echte Raffinerieware');
  assert.equal(el['pilot-w5-kaufen'].disabled,true,'kein kostenloses Fertigschiff');
  el['pilot-w3-kauf'].click();await settle();
  el['pilot-w3-50'].click();await settle();
  el['pilot-w3-start'].click();await settle();
  el['pilot-stunde'].click();await settle();
  el['pilot-stunde'].click();await settle();
  el['pilot-w4-start'].click();await settle();
  el['pilot-w4-20'].click();await settle();
  assert.equal(el['pilot-w5-material'].textContent,'5 Material');
  assert.equal(el['pilot-w5-bauen'].disabled,false);
  el['pilot-w5-bauen'].click();await settle();
  let state=JSON.parse(store.get(W5_SLOT));
  assert.equal(state.rulesVersion,19);
  assert.equal(state.owners.st_nadir.cash,3740);
  assert.equal(state.w5.materialUmsatz,500);
  assert.equal(state.owners.w5_arbeit_treuhand.cash,30);
  assert.equal(state.stations.st_nadir.lager.material,0);
  assert.equal(state.ledger.frachter.produced,0);
  assert.equal(el['pilot-w5-bauen'].disabled,true);
  assert.match(el['pilot-w5-status'].textContent,/30 Minuten/);
  el['pilot-w5-30'].click();await settle();
  state=JSON.parse(store.get(W5_SLOT));
  assert.equal(state.stations.st_nadir.lager.frachter,1);
  assert.equal(state.ledger.frachter.produced,1);
  assert.equal(state.owners.arbeiter_werft_nadir.cash,30);
  assert.equal(el['pilot-w5-kaufen'].disabled,false,'echtes Fertigschiff und Käuferbudget');
  el['pilot-w5-kaufen'].click();await settle();
  state=JSON.parse(store.get(W5_SLOT));
  assert.equal(state.w5.verkauft,1);
  assert.equal(state.stations.st_nadir.lager.frachter,0);
  assert.equal(state.ships[state.w5.schiffIds[0]].system,'nadir');
  assert.equal(state.ships[state.w5.schiffIds[0]].owner,'transport');
  assert.equal(el['pilot-w5-audit'].textContent,'Bau + Verkauf + Geld OK');
  assert.equal(el['pilot-audit'].textContent,'ISK + Waren + Vollkosten OK');
  assert.equal(state.minted,0);
  assert.equal(state.initialSupply,33000);
  for(const [id,value] of Object.entries(originals)) assert.equal(store.get(id),value);
});

test('W5 UI: Ansichtswechsel ist hashgleich, Importablehnung und Archiv nur Regel19',async()=>{
  const W3_SLOT='aphros-void-w3-regel17-v1',W4_SLOT='aphros-void-w4-regel18-v1',
    W5_SLOT='aphros-void-w5-regel19-v1';
  const old={slot1:'MAINALT',[W1_SLOT]:'W1',[W2_SLOT]:'W2',[W3_SLOT]:'W3',[W4_SLOT]:'W4'};
  const a=boot('w5werft',old);await settle();
  a.el['pilot-w3-kauf'].click();await settle();
  a.el['pilot-w3-50'].click();await settle();
  a.el['pilot-w3-start'].click();await settle();
  a.el['pilot-stunde'].click();await settle();
  a.el['pilot-stunde'].click();await settle();
  a.el['pilot-w4-start'].click();await settle();
  a.el['pilot-w4-20'].click();await settle();
  a.el['pilot-w5-bauen'].click();await settle();
  const firstHash=a.el['pilot-hash'].textContent,firstSave=a.store.get(W5_SLOT);
  const b=boot('w5konten',Object.fromEntries(a.store));await settle();
  assert.equal(b.el.miner2d.hidden,true);
  assert.equal(b.el['pilot-w5-panel'].hidden,false);
  assert.equal(b.el['pilot-hash'].textContent,firstHash);
  assert.equal(b.store.get(W5_SLOT),firstSave);
  b.el['pilot-w5-30'].click();await settle();
  const next=b.store.get(W5_SLOT);
  assert.equal(JSON.parse(next).w5.fertig,1);
  const c=boot('w5werft',Object.fromEntries(b.store));await settle();
  assert.equal(c.el['pilot-hash'].textContent,b.el['pilot-hash'].textContent);
  assert.equal(c.store.get(W5_SLOT),next);
  const wrong=JSON.parse(next);wrong.rulesVersion=18;
  await c.el['pilot-datei-input'].listeners.change({target:{
    files:[{text:async()=>JSON.stringify(wrong)}],value:'invalid'
  }});await settle();
  assert.equal(c.store.get(W5_SLOT),next,'kein heimlicher Import eines W4-Standes');
  assert.match(c.el['pilot-meldung'].textContent,/Import abgelehnt/);
  c.el['pilot-datei'].click();
  assert.match(c.downloads[0].name,/regel19/);
  await c.el['pilot-neu'].click();await settle();
  const archives=[...c.store.keys()].filter(k=>k.startsWith(W5_SLOT+'-archiv-'));
  assert.equal(archives.length,1);
  assert.equal(c.store.get(archives[0]),next);
  assert.equal(JSON.parse(c.store.get(W5_SLOT)).rulesVersion,19);
  for(const [id,val] of Object.entries(old))assert.equal(c.store.get(id),val);
});

test('W5 UI: korrupter Regel19-Slot ist gesperrt und roh exportierbar',async()=>{
  const W5_SLOT='aphros-void-w5-regel19-v1',broken='{"rulesVersion":19,"fake":true}';
  const {el,store,downloads}=boot('w5konten',{[W5_SLOT]:broken});
  await settle();
  assert.equal(el['pilot-w5-bauen'].disabled,true);
  assert.equal(el['pilot-w5-kaufen'].disabled,true);
  assert.equal(el['pilot-w5-30'].disabled,true);
  assert.equal(el['pilot-stunde'].disabled,true);
  assert.equal(store.get(W5_SLOT),broken);
  el['pilot-datei'].click();
  assert.equal(downloads[0].text,broken);
  assert.match(downloads[0].name,/regel19-beschaedigt/);
});
