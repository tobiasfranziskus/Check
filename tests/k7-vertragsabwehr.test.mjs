// K7: negatives Originalrechts-/Save-Gate. Kein Spielstand ohne bewusstes
// Forschungsprofil und keine Umgehung über JSON oder fremdes Eigentum.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const cmd=(w,s,type,owner,extra={})=>w.execute(s,{type,owner,...extra});
const no=(w,s,type,owner,extra={})=>{
  const vor=w.canonical(s),r=cmd(w,s,type,owner,extra);
  assert.equal(r.ok,false,type+' darf nicht stattfinden');
  assert.equal(w.canonical(s),vor,'atomar abgelehnt: '+type);
};
const ja=(w,s,type,owner,extra={})=>{
  const r=cmd(w,s,type,owner,extra);assert.equal(r.ok,true,r.reason);return r;
};
function signieren(w,s){
  ja(w,s,'industrialOreOffer','st_nadir',{miner:'sh004',frachter:'sh020'});
  ja(w,s,'industrialOreAcceptMine','npc3');
  ja(w,s,'industrialOreAcceptFreight','transport');
  ja(w,s,'industrialOreAcceptYard','werft_extern');
  ja(w,s,'industrialOreCommit','st_nadir');
}
for(const seed of [42,7]){
  test('K7 Manipulationsschutz Seed '+seed+': Rule199-Original, Signaturen, Treuhand und Eigentum unverletzt',()=>{
    const {terminalSave,startHash}=k6Start(seed);
    const alt=Welt.erstellen(),quelle=alt.load(terminalSave);
    assert.equal(alt.hash(quelle),startHash);
    no(alt,quelle,'industrialOreOffer','st_nadir',{miner:'sh004',frachter:'sh020'});
    const kopie=Welt.ausRegel199K7(terminalSave),w=kopie.welt,s=kopie.zustand;
    assert.equal(alt.hash(alt.load(terminalSave)),startHash,'Quellwelt nie migriert');
    assert.equal(w.regel,200);
    assert.throws(()=>w.load(terminalSave),/fremde Regelversion/);
    assert.throws(()=>alt.load(w.save(s)),/fremde Regelversion/);
    no(w,s,'industrialOreOffer','st_nadir',{miner:'sh004',frachter:'sh020',zusatz:true});
    no(w,s,'industrialOreOffer','house',{miner:'sh004',frachter:'sh020'});
    ja(w,s,'industrialOreOffer','st_nadir',{miner:'sh004',frachter:'sh020'});
    no(w,s,'industrialOreAcceptMine','transport');
    no(w,s,'industrialOreAcceptFreight','house');
    no(w,s,'industrialOreAcceptYard','npc3');
    no(w,s,'industrialOreCommit','st_nadir');
    ja(w,s,'industrialOreAcceptMine','npc3');
    ja(w,s,'industrialOreAcceptFreight','transport');
    no(w,s,'industrialOreCommit','st_nadir');
    ja(w,s,'industrialOreAcceptYard','werft_extern');
    ja(w,s,'industrialOreCommit','st_nadir');
    no(w,s,'industrialOreOffer','st_nadir',{miner:'sh005',frachter:'sh020'});
    no(w,s,'industrialOreCommit','st_nadir');
    no(w,s,'industrialOreBuildShip','werft_extern');
    // Jeder Schaden am Vertragsbuch oder an der Original-ISK-Treuhand
    // muss beim Laden entdeckt werden, auch bei normalem JSON-Format.
    const save=w.save(s),original=w.hash(s);
    for(const [beschreibung,patch] of [
      ['Nadir 1 ISK unterschlagen',v=>{v.owners.w3_kauf_treuhand.cash--; }],
      ['Werft 1 ISK unterschlagen',v=>{v.owners.k7_werft_treuhand.cash--; }],
      ['Unterschrift gelöscht',v=>{v.kanon.industrieErz.signWerft=false;}],
      ['unbelegter Lieferstatus',v=>{v.kanon.industrieErz.phase='geliefert';}],
      ['erfundenes Schiffseigentum',v=>{v.ships.sh004.owner='house';}],
    ]){
      const f=JSON.parse(save);patch(f);
      assert.throws(()=>w.load(JSON.stringify(f)),Error,beschreibung);
    }
    assert.equal(w.hash(w.load(save)),original,'Originalsave weiterhin intakt');
    assert.equal(w.audit(s).ok,true);
  });
}
test('K7 Abbruch nach bezahlter Förderminute nicht gratis und Werftreserve sperrt Folgeauftrag',()=>{
  const {terminalSave}=k6Start(42),{welt:w,zustand:s}=Welt.ausRegel199K7(terminalSave);
  signieren(w,s);
  const vor=s.ledger.erz.mined;
  for(let n=0;n<60&&s.ledger.erz.mined===vor;n++) w.minute(s);
  assert.ok(s.ledger.erz.mined>vor,'eine echte bezahlte Arbeitsminute');
  no(w,s,'industrialOreCancel','st_nadir');
  const at=s.w3.kaufAusgaben;
  for(let n=0;n<340&&s.kanon.industrieErz.phase!=='geliefert';n++)w.minute(s);
  assert.equal(s.kanon.industrieErz.phase,'geliefert');
  assert.equal(s.owners.k7_werft_treuhand.cash,530,
    'die fehlende Werftsignatur ist nicht nötig; Werftreserve bleibt real gebunden');
  assert.equal(s.w3.kaufAusgaben,at);
  no(w,s,'industrialOreOffer','st_nadir',{miner:'sh005',frachter:'sh020'});
  assert.equal(w.audit(s).ok,true);
  const save=w.save(s);assert.equal(w.hash(w.load(save)),w.hash(s));
});
