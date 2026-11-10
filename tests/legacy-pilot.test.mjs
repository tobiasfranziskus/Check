import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { mount, copySnapshot } = createRequire(import.meta.url)('../prototypes/legacy-pilot/pilot.js');
function dom() {
  const doc = { activeElement: null, createElement(tag) { return new Element(tag); } };
  class Element {
    constructor(tag) { this.tagName = tag; this.ownerDocument = doc; this.children = []; this.dataset = {}; this.attrs = {}; this.textContent = ''; }
    set innerHTML(_) { throw Error('Unsichere HTML-Ausgabe'); }
    append(...nodes) { nodes.forEach(n => { n.parent = this; this.children.push(n); }); }
    replaceChildren(...nodes) { this.children.forEach(n => { n.parent = null; }); this.children = []; this.append(...nodes); }
    setAttribute(k, v) { this.attrs[k] = v; }
    contains(n) { return n === this || this.children.some(c => c.contains(n)); }
    focus() { doc.activeElement = this; }
    remove() { this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; }
  }
  return new Element('root');
}
const all = node => [node, ...node.children.flatMap(all)];
const output = node => all(node).map(n => n.textContent).join('\n');
const buttons = root => all(root).filter(n => n.tagName === 'button');
const sample = () => ({ pilot: { id: 'p1', name: 'Mara', role: 'NPC-Miner', corporation: 'Helix', ship: 's1', shipOwner: 'Helix' },
  experience: { current: 2, target: 8, percent: 25 }, skillPoints: 0,
  skills: [{ id: 'a', name: 'Bergbau', status: 'locked', reason: 'Nachweis fehlt', progress: '2 / 3', requirements: [{ name: 'Erz', have: 2, need: 3, assessment: 'Offen' }] }, { id: 'b', name: 'Transport', status: 'unlocked' }] });
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
test('Snapshot bleibt bei Mount, Auswahl, Update und Destroy unverändert', () => {
  const s = freeze(sample()), before = JSON.stringify(s), root = dom(), view = mount(root, s);
  buttons(root)[0].onclick(); view.update(s); view.destroy(); assert.equal(JSON.stringify(s), before);
});
test('Defensive Kopie isoliert spätere Änderungen des Aufrufers', () => {
  const s = sample(), root = dom(), view = mount(root, s); s.skills[0].reason = 'verändert';
  buttons(root)[0].onclick(); assert.match(output(root), /Nachweis fehlt/); assert.doesNotMatch(output(root), /verändert/); view.destroy();
});
test('Fehlende Werte bleiben unbekannt, echte Nullwerte sichtbar', () => {
  const root = dom(); const view = mount(root, {}); assert.match(output(root), /Nicht verfügbar/); assert.match(output(root), /Keine Leistungsdaten/);
  view.update(sample()); assert.match(output(root), /0 Skillpunkte/);
  assert.equal(copySnapshot({ experience: { current: NaN, percent: Infinity } }).experience.percent, null);
  for (const s of [null, undefined, { pilot: null, skills: [null, {}, { id: 'a' }, { id: 'a' }] }]) assert.doesNotThrow(() => view.update(s));
});
test('Skill-Sperren und Anforderungen stammen unverändert aus dem Snapshot', () => {
  const root = dom(), s = sample(); s.skills[0].requirements[0].have = 999; const view = mount(root, s);
  buttons(root)[0].onclick(); assert.match(output(root), /Gesperrt/); assert.match(output(root), /Nachweis fehlt/); assert.match(output(root), /vorhanden 999 \/ benötigt 3/);
  s.skills[0].status = 'future'; view.update(s); assert.match(output(root), /Noch nicht bewertbar/);
});
test('Alle Daten werden als sicherer Text ausgegeben', () => {
  const root = dom(), s = sample(), payload = '<img src=x onerror=alert(1)>';
  s.pilot.name = payload; s.skills[0].reason = payload; s.skills[0].requirements[0].name = payload; s.history = [{ title: payload, evidence: payload }];
  mount(root, s); buttons(root)[0].onclick(); assert.ok(output(root).includes(payload)); assert.ok(all(root).every(n => n.tagName !== 'img'));
});
test('Auswahl, Aktualisierung, Fokus und Pilotwechsel', () => {
  const root = dom(), s = sample(), view = mount(root, s); buttons(root)[0].focus(); buttons(root)[0].onclick();
  s.skills[0].progress = '3 / 3'; view.update(s); assert.equal(buttons(root)[0].attrs['aria-pressed'], 'true'); assert.match(output(root), /3 \/ 3/);
  assert.equal(root.ownerDocument.activeElement, buttons(root)[0]);
  s.skills = s.skills.slice(1); view.update(s); assert.match(output(root), /Fähigkeit auswählen/);
  buttons(root)[0].onclick(); s.pilot.id = 'p2'; view.update(s); assert.equal(buttons(root)[0].attrs['aria-pressed'], 'false');
});
test('Historie unterscheidet fehlend, leer und belegte Einträge', () => {
  const root = dom(), s = sample(), view = mount(root, s); assert.match(output(root), /Keine Leistungsdaten/);
  s.history = []; view.update(s); assert.match(output(root), /keine Leistungseinträge/);
  s.history = [{ title: 'Abschuss', value: 1, evidence: 'core-77' }]; view.update(s); assert.match(output(root), /Abschuss · 1 · Beleg: core-77/);
});
test('Destroy ist idempotent, entfernt nur eigenen Teilbaum und deaktiviert alte Handler', () => {
  const root = dom(), sibling = root.ownerDocument.createElement('p'); root.append(sibling);
  const view = mount(root, sample()), oldButton = buttons(root)[0]; view.destroy(); view.destroy(); view.update(sample()); oldButton.onclick();
  assert.deepEqual(root.children, [sibling]);
});
