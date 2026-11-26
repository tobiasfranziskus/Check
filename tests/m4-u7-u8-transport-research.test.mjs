import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const W=require('../prototypes/welt/welt-kern.js');

// Read-only research calculation; NOT an executable offer, new tariff or core.
// Derive amounts from the original W3/W5n and K1 configuration.
function kalkulation(w,s,shipId){
 const r=w.rules,c=r.w3,n=r.w5n,e=r.erzpilot,sh=s.ships[shipId];
 const al=s.stations[c.quellStation].lager,na=s.stations[c.zielStation].lager;
 const a=s.owners[c.quellStation].cash,b=s.owners[c.zielStation].cash;
 const f=w.kern.eisfrachtPreise(r);
 const lohn=2*f.zeit*c.arbeitJeMinute,tarif=2*f.zeit*c.frachtgebuehrJeMinute;
 const menge=c.fracht,erzWert=menge*e.preis;
 const wasserFrei=Math.max(0,Math.min(W.DATEN.wasser.lagerAldera,s.kanon.politik.wasserZielAldera)-(al.wasser||0));
 const wasserMenge=Math.min(wasserFrei,na.wasser||0,r.economy.cargo);
 const wasserWert=wasserMenge*n.wasserPreis;
 const inkrement=wasserMenge*W.DATEN.wasser.rueckfrachtJeEinheit;
 const frei=!!sh&&sh.owner===r.economy.start.owner&&sh.klasse==='frachter'
  &&sh.system==='aldera'&&sh.phase==='dock'&&sh.auftrag==='halten'
  &&sh.flug?.lage==='angedockt'&&sh.flug.anker===c.quellStation
  &&Object.values(sh.ladung).every(x=>x===0)&&!w.stillgelegt(s,shipId);
 const gebunden=!!(s.w3.auftrag||s.w5n.frachtauftrag||s.w5ac?.active||s.kanon.rueckfracht
  ||['angebot','aktiv'].includes(s.kanon.industrieErz?.phase));
 return Object.freeze({frei,gebunden,menge,erzWert,lohn,tarif,
  erzNadirBudget:erzWert+tarif,erzQuellbestand:al.erz||0,
  erzZielplatz:w.kern.obergrenze(s,r,c.zielStation,'erz')-(na.erz||0),
  wasserMenge,wasserWert,inkrement,
  wasserSeparatBudget:wasserWert+tarif,
  wasserKombiniertBudget:wasserWert+inkrement,
  wasserAltTarifDeckung:inkrement-lohn,
  wasserSeparatDeckung:tarif-lohn,
  // These are counterfactual budgets, not permission to dispatch.
  erzAlderaDeckung:a>=erzWert,erzNadirDeckung:b>=erzWert+tarif,
  hausLohnDeckung:!!sh&&s.owners[sh.owner].cash>=lohn,
  wasserSeparatDeckungKaeufer:a>=wasserWert+tarif,
  wasserKombiniertVorfinanzierung:a>=erzWert+wasserWert+inkrement,
  wasserKombiniertNachErzankunft:a>=wasserWert+inkrement,
  eisFrei:w.kern.obergrenze(s,r,c.zielStation,'eis')-(na.eis||0)});
}

test('M4-U7/U8: 48-Fahrten-Originalwelt, getrennte Transportbudgets und kombinierte Rückladung',()=>{
 const j=engpassNach48(),w=j.weltReferenz(),s=j.zustandReferenz(),json=j.exportieren();
 assert.equal(j.ansicht().hash,'f63f2cd09ba5a88c');
 const q=kalkulation(w,s,'sh003');
 assert.equal(q.frei,true);
 assert.equal(q.gebunden,false);
 assert.deepEqual([q.menge,q.erzWert,q.lohn,q.tarif,q.erzNadirBudget],[50,500,120,240,740]);
 assert.equal(q.erzQuellbestand,0);
 assert.ok(q.erzZielplatz>=q.menge);
 assert.equal(q.erzAlderaDeckung,true);
 assert.equal(q.erzNadirDeckung,true);
 assert.equal(q.hausLohnDeckung,true);
 assert.deepEqual([q.wasserMenge,q.wasserWert,q.inkrement],[12,168,12]);
 assert.equal(q.wasserSeparatBudget,408);
 assert.equal(q.wasserKombiniertBudget,180);
 assert.equal(q.wasserAltTarifDeckung,-108);
 assert.equal(q.wasserSeparatDeckung,120);
 assert.equal(q.wasserSeparatDeckungKaeufer,true);
 assert.equal(q.wasserKombiniertVorfinanzierung,false);
 assert.equal(q.wasserKombiniertNachErzankunft,true);
 assert.equal(q.eisFrei,20);
 // Same world, still no legitimate original player offer.
 for(const id of ['freight-sh003','ore-freight-sh003','water-freight-sh003']){
  assert.equal(j.ausfuehren(id).ok,false,id);
  assert.equal(j.exportieren(),json);
 }
 const cmd={type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh003'};
 const probe=w.load(json),result=w.execute(probe,cmd);
 assert.equal(result.ok,false);
 assert.match(result.reason,/fremdes/);
 assert.equal(w.save(probe),json);
 assert.deepEqual(pruefen(w,s),[]);
 assert.equal(j.exportieren(),json);
 console.log('M4_U7_U8_RESEARCH',JSON.stringify(q));
});
