import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert.ok(start>=0 && end>start);
const api=Function(html.slice(start,end)+'\nreturn m_core_index;')();
const betriebe=['house','npc3'];

function belege(state) {
  const status=api.pilotKonzernStatus(state);
  assert.ok(status && status.ok, 'Nachweis muss mit echter Buchhaltung stimmen');
  for(const id of betriebe) {
    const firma=status[id];
    assert.equal(firma.freieKasse+firma.arbeitsReserve,
      firma.anfang+firma.erloese-firma.ausgaben,'Original-Kassengleichheit '+id);
    assert.equal(firma.arbeitsReserve,firma.offeneFoerderkosten,
      'Jede offene Förderminute vorfinanziert '+id);
    assert.equal(firma.kassenbelegOk,true);
    assert.equal(firma.insolvenz,'nicht_belegbar',
      'Ohne fällige Schuld und Forderungsbuch kein Insolvenzurteil');
    assert.equal(firma.unbezahlteFaelligeSchulden,null);
  }
  return status;
}

test('W2–W5 Konzernbericht ist rein lesend und ändert weder Regel14 noch Regel15',()=>{
  const legacy=api.createState(42);
  api.advance(legacy,60);
  assert.equal(api.hash(legacy),'866776f7d84ef15e');
  const w1=api.createErzState(42);
  assert.equal(api.pilotKonzernStatus(w1),null);
  const vorher=api.hash(w1);
  api.advance(w1,120,api.ERZ_RULES);
  assert.equal(api.audit(w1).ok,true);
  assert.equal(api.hash(api.loadErz(api.save(w1))),api.hash(w1));
  assert.notEqual(api.hash(w1),vorher);
  assert.match(html,/id="pilot-w2-kassenbeleg"/);
  assert.match(html,/id="pilot-w2-insolvenz"/);
});

test('W2 Konzernstatus trennt Anschaffung, freie Kasse und gebundene Förderarbeit',()=>{
  const s=api.createW2State(42);
  let q=belege(s);
  assert.equal(q.house.betrieb,'ohne_miner');
  assert.equal(q.npc3.betrieb,'auftrag_wartet');
  assert.equal(q.npc3.kassenwirksamerSaldo,-600);
  assert.equal(q.npc3.freieKasse,2400);
  assert.equal(q.npc3.arbeitsReserve,0);
  assert.equal(q.npc3.schiffe,1);
  const h=api.hash(s);
  assert.deepEqual(api.pilotKonzernStatus(s),q);
  assert.equal(api.hash(s),h,'Auswerten verändert keine Spielwelt');
  api.advance(s,1,api.W2_RULES);
  q=belege(s);
  assert.equal(q.npc3.betrieb,'finanzierte_arbeit');
  assert.equal(q.npc3.freieKasse,2300);
  assert.equal(q.npc3.arbeitsReserve,98);
  assert.equal(q.npc3.offeneFoerderkosten,98);
  assert.equal(q.npc3.kassenwirksamerSaldo,-602);
  assert.equal(q.npc3.finanzierteVertraege,1);
  assert.equal(api.audit(s).ok,true);
});

test('W2 Absatzkrise ist keine Insolvenz: 17.800 ISK beim ruhenden NPC',()=>{
  const s=api.createW2State(42);
  api.advance(s,1440,api.W2_RULES);
  const h=api.hash(s);
  const q=belege(s);
  assert.equal(q.npc3.freieKasse,17800);
  assert.equal(q.npc3.arbeitsReserve,0);
  assert.equal(q.npc3.kassenwirksamerSaldo,14800);
  assert.equal(q.npc3.betrieb,'exportpause');
  assert.equal(q.house.betrieb,'ohne_miner');
  assert.equal(q.freieKaeuferMenge,0);
  assert.equal(q.exportmarkt,'absatzstopp');
  assert.equal(s.owners.export.cash,0);
  assert.equal(s.minted,0);
  assert.equal(api.hash(s),h);
  for(let tag=0;tag<90;tag++) api.advance(s,1440,api.W2_RULES);
  assert.equal(belege(s).npc3.freieKasse,17800);
  assert.equal(api.audit(s).ok,true);
});

test('W5 Schiffbauwelt nutzt dieselben Konzernbelege ohne doppelte Firmenkassen',()=>{
  const s=api.createW5State(42);
  assert.equal(s.rulesVersion,19);
  assert.equal(belege(s).npc3.freieKasse,2400);
  api.advance(s,2880,api.W5_RULES);
  const a=belege(s);
  assert.equal(a.npc3.freieKasse,17800);
  assert.equal(a.npc3.betrieb,'exportpause');
  assert.equal(a.ok,true);
  assert.equal(api.audit(s).ok,true);
  assert.equal(s.minted,0);
  const saved=api.save(s),h=api.hash(s);
  assert.equal(api.hash(api.loadW5(saved)),h);
  assert.equal(api.hash(s),h);
});

test('Bilanzneutrale Fremdumbuchung bleibt trotz gleicher Welt-ISK erkennbar',()=>{
  const s=api.createW5State(7);
  api.advance(s,120,api.W5_RULES);
  assert.equal(belege(s).ok,true);
  const vorher=api.audit(s).isk.total;
  s.owners.npc3.cash-=30;
  s.owners.house.cash+=30;
  assert.equal(api.audit(s).isk.total,vorher,'Weltgeld bleibt gleich');
  const status=api.pilotKonzernStatus(s);
  assert.equal(status.ok,false,'Fehlbuchung wird firmenweise entdeckt');
  assert.equal(status.npc3.kassenbelegOk,false);
  assert.equal(status.house.kassenbelegOk,false);
  assert.equal(api.audit(s).ok,false);
  assert.throws(()=>api.loadW5(api.save(s)),/fehlerhaft/);
});

test('W5 Konzernberichte in 13 Seeds x 90 Tagen: Tagesaudit, Save und keine ISK-Emission',()=>{
  const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
  for(const seed of seeds) {
    const s=api.createW5State(seed);
    for(let tag=1;tag<=90;tag++){
      api.advance(s,1440,api.W5_RULES);
      const hash=api.hash(s);
      const bericht=belege(s);
      assert.equal(api.hash(s),hash,'Konzernabfrage darf keine Zeit erzeugen '+seed+'/'+tag);
      assert.equal(bericht.insolvenzmodell,'kein_forderungsbuch_im_piloten');
      assert.equal(api.audit(s).ok,true,'Weltprüfung '+seed+'/'+tag);
      assert.equal(s.minted,0);
      if(tag===1 || tag===30 || tag===90){
        const geladen=api.loadW5(api.save(s));
        assert.equal(api.hash(geladen),hash,'Save '+seed+'/'+tag);
        assert.deepEqual(api.pilotKonzernStatus(geladen),bericht);
      }
    }
  }
});
