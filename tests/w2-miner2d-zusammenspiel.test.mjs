import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const first = html.indexOf('const m_data_systeme =');
const last = html.indexOf('const m_data_oberflaeche =');
const picture = html.indexOf('const m_ui_miner2d =');
const uiEnd = html.indexOf('const m_ui_main =');
assert.ok(first >= 0 && last > first && picture > last && uiEnd > picture);
const { c, ui } = Function(html.slice(first,last) + '\n' + html.slice(picture,uiEnd)
  + '\nreturn { c: m_core_index, ui: m_ui_miner2d };')();
const rules = c.W2_RULES;

function spielerMiner(s) {
  const kauf = c.execute(s, { type: 'shipBuy', owner: 'house', klasse: 'miner', station: 'st_aldera' }, rules);
  assert.equal(kauf.ok, true);
  return Object.values(s.ships).find(sh=>sh.owner==='house').id;
}

test('W1 2D-Start bleibt getrennt vom experimentellen W2-Core ohne Save-Migration', () => {
  assert.match(html, /modus=\(\?:erzpilot\|miner2d\|w2konzern\|w2miner2d\)/);
  assert.match(html, /const SLOT = istW2 \\? 'aphros-void-w2-regel16-v1' : 'aphros-void-erzpilot-regel15-v1'/);
  const a = c.createErzState(42), b = c.createW2State(42);
  assert.equal(a.rulesVersion, 15);
  assert.equal(b.rulesVersion, 16);
  c.advance(a, 180, c.ERZ_RULES);
  assert.equal(Object.values(a.ships).filter(sh=>sh.owner==='npc3').length, 1);
  assert.equal(c.audit(a).ok, true);
  assert.throws(()=>c.loadErz(c.save(b)), /inkompatibel/);
  assert.throws(()=>c.loadW2(c.save(a)), /inkompatibel/);
  assert.equal(c.hash(c.loadErz(c.save(a))),c.hash(a));
  const legacy=c.createState(42);c.advance(legacy,60);
  assert.equal(c.hash(legacy),'866776f7d84ef15e');
});

test('W2 autonomer Schiffsneukauf wird von 2D-Projektion nur angezeigt, nicht simuliert', () => {
  const s=c.createW2State(42), original=c.hash(s);
  c.advance(s,120,rules);
  const npc=Object.values(s.ships).filter(sh=>sh.owner==='npc3');
  assert.equal(npc.length,2,'echte NPC-Investition im Core');
  assert.equal(s.owners.werft_extern.cash,1200,'beide Hüllen wurden bezahlt');
  const vorher=c.hash(s);
  for(const sh of npc) {
    const ansicht=ui.zustand(s,rules,sh.id);
    assert.equal(ansicht.entities.find(e=>e.id===sh.id).owner,'npc3');
    assert.equal(ansicht.cash,s.owners.npc3.cash);
    assert(Object.isFrozen(ansicht.entities[0]));
  }
  assert.equal(c.hash(s),vorher,'2D erteilt durch Beobachtung keinen Core-Befehl');
  assert.notEqual(vorher,original);
  assert.equal(c.audit(s).ok,true);
  assert.equal(c.hash(c.loadW2(c.save(s))),vorher);
});

test('W2 Konkurrenz: im 2D-Miner erteilter Spielerauftrag blockiert unangemessene NPC-Expansion', () => {
  const s=c.createW2State(42), ship=spielerMiner(s);
  const before=c.hash(s), view=ui.zustand(s,rules,ship);
  assert.equal(view.entities.find(e=>e.id===ship).owner,'house');
  assert.equal(view.cash,s.owners.house.cash);
  assert.equal(c.hash(s),before);
  assert.equal(ui.befehl(s,rules,ship,{art:'foerdern',ware:'erz'}).ok,true);
  assert.equal(ui.befehl(s,rules,ship,{art:'warp'}).ok,false);
  c.advance(s,180,rules);
  assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='npc3').length,1);
  assert.equal(c.pilotNpcInvestition(s).ok,false);
  assert.equal(c.audit(s).ok,true);
  assert.equal(c.hash(c.loadW2(c.save(s))),c.hash(s));
  const n=ui.zustand(s,rules,ship);
  assert.equal(n.cargo,s.ships[ship].ladung.erz||0);
  assert.equal(n.cash,s.owners.house.cash);
  assert.equal(n.hash,c.hash(s));
});

test('W2 Endkunde erschöpft: 2D-Zustand bleibt belegbar, keine neuen Erzverkäufe', () => {
  const s=c.createW2State(7);
  c.advance(s,2880,rules);
  assert.equal(s.owners.export.cash,0);
  assert.equal(s.ledger.erz.exported,2000);
  const ids=Object.values(s.ships).filter(sh=>sh.owner==='npc3').map(sh=>sh.id);
  const view=ui.zustand(s,rules,ids[0]);
  assert.equal(view.hash,c.hash(s));
  const verkauf=s.ledger.erz.exported;
  c.advance(s,1440,rules);
  assert.equal(s.ledger.erz.exported,verkauf);
  assert.equal(s.minted,0);
  assert.equal(c.audit(s).ok,true);
});
