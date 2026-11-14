// K13/F6 – NPCs may autonomously sign only original, fully funded K7 contracts.
// Research-only and opt-in. No UI action impersonates another ship owner.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function audit(w,s,phase) {
  const a=w.audit(s);
  assert.equal(a.ok,true,phase+': '+JSON.stringify(a.fehler));
  assert.equal(geld(s),33000,phase+': world ISK');
  assert.equal(s.minted,0);
  assert.equal(s.burned,0);
}
test('K7-Automatik ist opt-in, verändert weder K1 noch das W5-Produkt',()=>{
  const k1=Welt.erstellen({}),s1=k1.createState(42),h=k1.hash(s1);
  assert.throws(()=>k1.industrieAutoSetzen(s1,true),/K7-Automatik/);
  assert.equal(k1.hash(s1),h);
  const k7=Welt.erstellenK7({}),s=k7.createState(42);
  assert.equal(s.kanon.industrieAuto,undefined,'K7 bleibt bis zur bewussten Wahl ohne neue Automatik');
  audit(k7,s,'K7 initial');
  const old=k7.canonical(s);
  assert.throws(()=>k7.industrieAutoSetzen(s,'ja'),/Boolean/);
  assert.equal(k7.canonical(s),old,'falscher Politikwert mutiert nichts');
  const price=k7.rules.economy.waren.frachter.basis;
  const start=s.owners.house.cash,available=s.stations.st_aldera.lager.frachter;
  const purchase=k7.execute(s,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_aldera'});
  assert.equal(purchase.ok,true,JSON.stringify(purchase));
  assert.equal(s.owners.house.cash,start-price);
  assert.equal(s.stations.st_aldera.lager.frachter,available-1);
  k7.industrieAutoSetzen(s,true);
  assert.equal(s.kanon.industrieAuto,true);
  audit(k7,s,'K7 auto and player purchase');
  assert.equal(k7.hash(k7.load(k7.save(s))),k7.hash(s));
});

for (const seed of [42,7]) {
  test('K13/F6 K7 seed '+seed+': autonome NPC-Unterschriften, Original-W3/W4/W5, Hash/Save',()=>{
    const {terminalSave}=k6Start(seed);
    const {welt:w,zustand:s}=Welt.ausRegel199K7(terminalSave);
    const before={paid:s.w3.kaufAusgaben, delivered:s.w3.geliefert,
      finished:s.w3.abgeschlossen, material:s.w4.materialErzeugt,
      hulls:s.w5.fertig,miner:s.ledger.erz.mined};
    const initialHash=w.hash(s);
    assert.equal(s.kanon.industrieAuto,undefined,'ohne Freigabe kein neues Industrieverhalten');
    audit(w,s,'initial K7');
    const r=w.industrieAutoSetzen(s,true);
    assert.equal(r.ok,true);
    assert.notEqual(w.hash(s),initialHash);
    assert.equal(s.kanon.industrieErz.phase,'aktiv','NPCs müssen zuerst einen vollständigen realen Vertrag schließen');
    assert.equal(s.kanon.industrieErz.signMiner,true);
    assert.equal(s.kanon.industrieErz.signFracht,true);
    assert.equal(s.kanon.industrieErz.signWerft,true);
    assert.equal(s.owners.k7_werft_treuhand.cash,530);
    assert.equal(s.owners.w3_kauf_treuhand.cash,740);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
    audit(w,s,'K7 signed and fully escrowed');
    const snap=w.load(w.save(s));
    assert.equal(w.hash(s),w.hash(snap));
    for(let i=0;i<1500;i++) {
      w.minute(s);
      if(i%60===0) audit(w,s,'K7 NPC '+i);
      if(s.w3.abgeschlossen>before.finished&&s.w5.fertig>before.hulls)break;
    }
    audit(w,s,'K7 NPC industry finished');
    assert.ok(s.ledger.erz.mined>before.miner,'real new 50-ore mine');
    assert.ok(s.w3.geliefert>=before.delivered+50,'paid physical W3 delivery');
    assert.ok(s.w3.abgeschlossen>=before.finished+1,'paid W3 roundtrip');
    assert.ok(s.w4.materialErzeugt>=before.material+5,'real W4 material work');
    assert.ok(s.w5.fertig>=before.hulls+1,'one real funded W5 hull');
    const after=w.load(w.save(s));
    assert.equal(w.hash(after),w.hash(s));
    for(let n=0;n<30;n++) {w.minute(s);w.minute(after);}
    assert.equal(w.hash(after),w.hash(s),'30-minute deterministic replay after funded industrial run');
    audit(w,s,'K7 NPC replay');
    console.log('K13_F6_NPC_INDUSTRY '+JSON.stringify({seed,tick:s.tick,hash:w.hash(s),
      extraOre:s.ledger.erz.mined-before.miner,extraDelivered:s.w3.geliefert-before.delivered,
      extraRounds:s.w3.abgeschlossen-before.finished,extraMaterial:s.w4.materialErzeugt-before.material,
      extraHulls:s.w5.fertig-before.hulls,worldMoney:geld(s),minted:s.minted,burned:s.burned}));
  });
}
