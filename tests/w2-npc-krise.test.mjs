import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert.ok(start>=0&&end>start);
const api=Function(html.slice(start,end)+'\nreturn m_core_index;')();
const rules=api.W2_RULES;
const npcShips=(s)=>Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner');

function withPlayer(s) {
  assert.equal(api.execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'},rules).ok,true);
  const sh=Object.values(s.ships).find(x=>x.owner==='house');
  assert.equal(api.execute(s,{type:'shipMine',owner:'house',schiff:sh.id,ware:'erz'},rules).ok,true);
  return sh.id;
}

test('W2-Krise: reine Diagnose unterscheidet zahlungskräftigen Konzern von fehlender Nachfrage',()=>{
  const s=api.createW2State(42);
  const original=api.hash(s);
  const before=api.pilotNpcKrisenLage(s);
  assert.equal(before.aktiv,true);
  assert.equal(before.status,'arbeitsbereit');
  assert.equal(before.planbar,50);
  assert.equal(before.unternehmenCash,2400);
  assert.deepEqual(api.pilotNpcKrisenLage(s),before);
  assert.equal(api.hash(s),original,'Abfrage ist ohne Seiteneffekt');
  const w1=api.createErzState(42);
  assert.deepEqual(api.pilotNpcKrisenLage(w1),{aktiv:false,status:'nicht_aktiv'});
  assert.equal(w1.rulesVersion,15);
});

test('W2-Krise: bezahlte Aufträge werden trotz fehlender weiterer Abnahme fertiggestellt',()=>{
  const s=api.createW2State(42);
  withPlayer(s);
  api.advance(s,1160,rules);
  const lage=api.pilotNpcKrisenLage(s);
  assert.equal(lage.status,'absatzstopp');
  assert.equal(lage.planbar,0);
  assert.equal(lage.finanzierte,1,'bereits bezahlter NPC-Auftrag aktiv');
  const npc=npcShips(s)[0];
  assert.equal(npc.auftrag,'foerdern','laufenden Auftrag nicht stornieren');
  const vert=structuredClone(s.erzpilotVertraege[npc.id]);
  assert.ok(vert.menge>0);
  const vorherMined=s.ledger.erz.mined;
  api.advance(s,30,rules);
  assert.ok(s.ledger.erz.mined>vorherMined,'Arbeit aus echtem Treuhand bleibt erlaubt');
  assert.equal(api.audit(s).ok,true);
  assert.equal(s.minted,0);
});

test('W2-Krise: nach aufgebrauchtem Käuferbudget stoppen NPCs ohne Gratisrettung',()=>{
  for(const spieler of [false,true]){
    const s=api.createW2State(42);
    if(spieler) withPlayer(s);
    api.advance(s,1440,rules);
    assert.equal(s.owners.export.cash,0);
    assert.equal(s.ledger.erz.exported,2000);
    const l=api.pilotNpcKrisenLage(s);
    assert.equal(l.status,'absatzstopp');
    assert.equal(l.planbar,0);
    assert.equal(l.finanzierte,0);
    assert.ok(l.unternehmenCash>0,'Nachfrageausfall ist keine Insolvenz');
    assert.equal(l.ruhend,npcShips(s).length);
    assert.ok(npcShips(s).every(sh=>sh.auftrag==='halten'));
    const anzahl=npcShips(s).length,vorher=s.ledger.erz.mined;
    const cash=s.owners.npc3.cash, minted=s.minted;
    api.advance(s,1440,rules);
    assert.equal(npcShips(s).length,anzahl,'keine weitere Flottenexpansion');
    assert.equal(s.ledger.erz.mined,vorher,'keine unbezahlte NPC-Arbeit');
    assert.equal(s.owners.npc3.cash,cash,'keine verdeckten Kosten oder Rettungs-ISK');
    assert.equal(s.minted,minted);
    assert.equal(api.audit(s).ok,true);
    assert.equal(api.hash(api.loadW2(api.save(s))),api.hash(s));
  }
});

test('W2-Krise: 13 Seeds x 90 Tage, keine neuen Arbeitsausgaben nach Absatzstopp',()=>{
  const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
  for(const seed of seeds){
    const a=api.createW2State(seed),b=api.createW2State(seed);
    let ende=null;
    for(let day=1;day<=90;day++){
      api.advance(a,1440,rules);
      api.advance(b,1440,rules);
      const audit=api.audit(a),lage=api.pilotNpcKrisenLage(a);
      assert.equal(audit.ok,true,seed+'/'+day);
      assert.equal(audit.isk.total,27000);
      assert.equal(a.minted,0);
      assert.equal(api.hash(a),api.hash(b),'Replay '+seed+'/'+day);
      if(lage.status==='absatzstopp'){
        assert.ok(npcShips(a).every(sh=>sh.auftrag==='halten'),'alle NPC-Miner ruhen '+seed+'/'+day);
        if(ende){
          assert.equal(a.owners.npc3.cash,ende.cash,'Cash bleibt bei fehlender Nachfrage erhalten '+seed+'/'+day);
          assert.equal(a.ledger.erz.mined,ende.ore,'keine neuen Erzaufträge '+seed+'/'+day);
        }
        ende={cash:a.owners.npc3.cash,ore:a.ledger.erz.mined};
      }
    }
    assert.ok(ende,'Käuferbudget tatsächlich erschöpft '+seed);
    assert.equal(a.ledger.erz.exported,2000);
    assert.equal(api.hash(api.loadW2(api.save(a))),api.hash(a));
    assert.equal(api.audit(a).ok,true);
  }
});

test('W2-Krise: Regel14 und Regel15 bleiben getrennt und Save-kompatibel',()=>{
  const alt=api.createState(42);
  api.advance(alt,60);
  assert.equal(api.hash(alt),'866776f7d84ef15e');
  const w1=api.createErzState(42);
  api.advance(w1,2880,api.ERZ_RULES);
  assert.equal(npcShips(w1).length,1);
  assert.equal(npcShips(w1)[0].auftrag,'foerdern','Regel15 nicht mit W2-Krisenmechanik verwechseln');
  assert.equal(api.audit(w1).ok,true);
  assert.equal(api.hash(api.loadErz(api.save(w1))),api.hash(w1));
  const w2=api.createW2State(42);
  api.advance(w2,1440,rules);
  assert.throws(()=>api.loadErz(api.save(w2)),/inkompatibel/);
  assert.throws(()=>api.loadW2(api.save(w1)),/inkompatibel/);
});

test('W2-Krise: neuer Auftrag darf den noch freien Endkundenetat nicht ueberziehen',()=>{
  const s=api.createW2State(42);
  api.advance(s,1249,rules);
  assert.equal(s.owners.export.cash,1000);
  const npc=npcShips(s);
  assert.equal(npc.length,2);
  for(const sh of npc){
    assert.equal(s.erzpilotVertraege[sh.id]?.menge,50);
    assert.equal(sh.ladung.erz,49);
    assert.equal(api.execute(s,{type:'shipWait',owner:'npc3',schiff:sh.id},rules).ok,true);
  }
  assert.equal(api.audit(s).ok,true);
  api.advance(s,11,rules);
  assert.equal(s.owners.export.cash,20,'nach 98 verkauften Erz bleiben exakt 2 finanzierbar');
  assert.equal(api.pilotNpcKrisenLage(s).kaeuferMenge,2);
  api.advance(s,1,rules);
  const aktiv=Object.entries(s.erzpilotVertraege);
  assert.equal(aktiv.length,1);
  assert.equal(aktiv[0][1].menge,2,'nicht 50 Erz vom Stationsgeld ohne zahlenden Endkunden');
  assert.equal(s.owners[aktiv[0][1].konto].cash,20);
  assert.equal(s.owners[aktiv[0][1].arbeitsKonto].cash,2);
  assert.equal(api.audit(s).ok,true);
  api.advance(s,59,rules);
  assert.equal(s.owners.export.cash,0);
  assert.equal(s.ledger.erz.exported,2000);
  assert.equal(s.ledger.erz.mined,2000);
  assert.equal(api.audit(s).ok,true);
  assert.equal(api.hash(api.loadW2(api.save(s))),api.hash(s));
});
