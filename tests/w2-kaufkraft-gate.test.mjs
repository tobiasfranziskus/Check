import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const begin = html.indexOf('const m_data_systeme =');
const end = html.indexOf('const m_data_oberflaeche =');
assert.ok(begin >= 0 && end > begin);
const api = Function(html.slice(begin, end) + '\nreturn m_core_index;')();
const rules = api.W2_RULES;
const count = (s) => Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner');

test('W2-Kaufkraft: read-only Kontoherkunft und Nachfragevorrang statt weltweitem Geldmangel', () => {
  for (const seed of [42, 7]) {
    const s = api.createW2State(seed);
    const hash = api.hash(s);
    const before = api.pilotNpcKrisenLage(s);
    assert.equal(before.status,'arbeitsbereit');
    assert.equal(before.kaeuferNachweisOk,true);
    assert.equal(before.kundenlueckeISK,0);
    assert.equal(before.vorbestand,0);
    assert.equal(api.hash(s),hash);
    api.advance(s,1440,rules);
    const stopHash = api.hash(s);
    const after = api.pilotNpcKrisenLage(s);
    assert.equal(after.status,'absatzstopp');
    assert.equal(after.kaeuferCash,0);
    assert.equal(after.kaeuferNachweisOk,true);
    assert.equal(after.planbar,0);
    assert.equal(after.kundenlueckeISK,(after.vorbestand+1)*rules.erzpilot.preis);
    assert.ok(after.kundenlueckeISK>=rules.erzpilot.preis);
    assert.ok(after.unternehmenCash>0,'zahlungsfaehiger NPC besitzt Vermoegen');
    assert.equal(after.ruhend,after.eigene);
    assert.equal(api.hash(s),stopHash,'kein Core-Schritt durch Diagnose');
    assert.equal(api.audit(s).ok,true);
    assert.equal(api.hash(api.loadW2(api.save(s))),stopHash);
    console.log('W2_KAUFKRAFT_STOP '+JSON.stringify({seed,tick:s.tick,
      buyer:after.kaeuferCash,claims:after.vorbestand,minimumMissing:after.kundenlueckeISK,
      npcCash:after.unternehmenCash,status:after.status,hash:stopHash}));
  }
});

test('W2-Kaufkraft: bilanzneutrale, unbelegte Geldumlagerung ist KEINE neue Endkunden-Einnahme', () => {
  for (const seed of [42,7]) {
    const s = api.createW2State(seed);
    api.advance(s,1440,rules);
    const before = api.hash(s);
    const amount = 1000;
    assert.ok(s.owners.npc3.cash>=amount);
    s.owners.npc3.cash-=amount;
    s.owners.export.cash+=amount;
    const a=api.audit(s);
    assert.equal(a.isk.ok,true,'ISK-Gesamtmenge wird nicht manipuliert');
    assert.equal(a.goods.ok,true,'Waren unveraendert');
    assert.equal(a.finanzierung.ok,false,'Kaeuferkonto ohne realen Erlos');
    assert.equal(a.finanzierung.differenz,amount);
    assert.equal(a.ok,false,'falsche Käuferfinanzierung muss den Gesamt-Audit sperren');
    assert.throws(()=>api.loadW2(api.save(s)),/bilanz fehlerhaft|finanzierung/i);
    const l=api.pilotNpcKrisenLage(s);
    assert.equal(l.kaeuferNachweisOk,false);
    assert.equal(l.status,'finanzierungsfehler');
    assert.equal(l.planbar,0);
    assert.equal(l.kaeuferCash,amount);
    assert.notEqual(api.hash(s),before);
    const exported=s.ledger.erz.exported, mined=s.ledger.erz.mined;
    assert.throws(()=>api.advance(s,60,rules),/Endkundenkonto ohne belegte Einnahme/);
    assert.equal(s.owners.export.cash,amount,'illegale Geldaufladung nicht als Verkaufserloes ausgezahlt');
    assert.equal(s.ledger.erz.exported,exported,'keine Exportware aus unverifizierter Nachfrage');
    assert.equal(s.ledger.erz.mined,mined,'keine neue ungedeckte Erzarbeit');
    assert.equal(s.minted,0);
    console.log('W2_KAUFKRAFT_UNBELEGT '+JSON.stringify({seed,buyer:amount,finanzDelta:a.finanzierung.differenz,
      status:l.status,exported,afterExported:s.ledger.erz.exported}));
  }
});

test('W2-Kaufkraft: W1-Regel15 und Regel14 nicht durch W2-Diagnose veraendert',()=>{
  const r14=api.createState(42);
  api.advance(r14,60);
  assert.equal(api.hash(r14),'866776f7d84ef15e');
  const r15=api.createErzState(42);
  assert.deepEqual(api.pilotNpcKrisenLage(r15),{aktiv:false,status:'nicht_aktiv'});
  api.advance(r15,1440,api.ERZ_RULES);
  assert.equal(api.audit(r15).ok,true);
  assert.equal(api.hash(api.loadErz(api.save(r15))),api.hash(r15));
});
