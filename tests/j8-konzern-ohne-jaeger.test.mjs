import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Session=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const W=require('../prototypes/welt/welt-kern.js');
const original=()=>Session.create(42,'private195');
const newSession=()=>J8.erstellen();

test('J8 – explizite, nicht zerstörende Kopie: echte Rule195-Welt wird Rule204-Konzern ohne Gratisjäger',()=>{
 const alt=original(),json=alt.export(),hash=alt.snapshot().hash;
 const s=newSession();
 assert.throws(()=>s.ansicht(),/erst eine geprüfte/);
 assert.throws(()=>s.starten195(json,false),/ausdrückliche/);
 assert.equal(alt.export(),json);
 const a=s.starten195(json,true);
 assert.equal(a.regel,204);
 assert.equal(a.weltgeld,33000);assert.equal(a.eigenerJaeger,0);
 assert.equal(a.pilotierbar,false);assert.equal(a.schiffe.length,0,'frische Rule195-Welt hat keine kostenlosen Spielerhüllen');
 assert.equal(a.quelleHash,hash);
 assert.equal(alt.export(),json,'Originalsave nicht überschrieben');
 assert.equal(alt.snapshot().hash,hash);
 assert.throws(()=>s.starten195(json,true),/nicht überschreiben/);
 assert.throws(()=>s.oeffnen204(s.exportieren(),true),/nicht überschreiben/);
 assert.equal(s.exportieren(),s.exportieren(),'Rule204-JSON strikt deterministisch');
 const p=JSON.parse(s.exportieren());assert.equal(p.rulesVersion,204);
 assert.equal(p.kanon.jaeger.kaeufe.length,0);
 const w=W.erstellenJ4c({carrierCash:p.w5ad.profile.carrierCash,buyerCash:p.w5ad.profile.buyerCash});
 assert.equal(w.audit(w.load(s.exportieren())).ok,true);
 assert.equal(w.hash(w.load(s.exportieren())),a.hash);
});

test('J8 – echte, vorfinanzierte Eisförderung mit eigenem Miner und Original-RNG',()=>{
 const before=original(),source=before.export(),s=newSession();
 const initial=s.starten195(source,true);
 assert.equal(initial.schiffe.length,0,'keinen kostenlosen Startminer erfinden');
 const kauf=s.angebote().find(a=>a.id==='buy-st_aldera-miner');
 assert.equal(kauf?.ok,true,'Original-Regel195 bietet vorhandenen und aus Hausgeld zahlbaren Aldera-Miner');
 const illegal=s.ausfuehren('industrialOreAcceptYard');
 assert.equal(illegal.ok,false,'fremde Firmenentscheidungen nicht als Spielerknopf');
 assert.equal(s.ansicht().hash,initial.hash,'Sperre ist zustandsneutral');
 const bezahlt=s.ausfuehren(kauf.id);
 assert.equal(bezahlt.ok,true,JSON.stringify(bezahlt));
 assert.ok(s.ansicht().hausgeld<initial.hausgeld,'Kauf wurde wirklich bezahlt');
 const ice=s.angebote().find(a=>a.id.startsWith('ice-')&&a.ok);
 assert.ok(ice,'Erst nach bezahltem Miner-Kauf ist eigene Eisförderung zulässig');
 const result=s.ausfuehren(ice.id);
 assert.equal(result.ok,true,JSON.stringify(result));
 const active=s.angebote().find(a=>a.id===ice.id.replace('ice-','stop-'));
 assert.equal(active?.ok,true,'Pendelauftrag wirklich im Core erstellt');
 const after=s.weiterspielen(10);
 assert.ok(after.tick>initial.tick);
 assert.equal(after.weltgeld,initial.weltgeld);
 const json=s.exportieren(),raw=JSON.parse(json);
 assert.ok(raw.kanon?.pendel,'Original-Pendelverwaltung erhalten');
 assert.equal(raw.minted,0);assert.equal(raw.burned,0);
 const second=newSession(),reopen=second.oeffnen204(json,true);
 assert.equal(reopen.hash,after.hash);
 assert.equal(second.exportieren(),json,'Validiertes JSON roundtrip bitgleich');
 assert.equal(before.export(),source,'Altspielstand niemals verändert');
 const doppel=newSession();doppel.starten195(source,true);
 assert.equal(doppel.ausfuehren(kauf.id).ok,true);
 const before2=doppel.ausfuehren(ice.id);assert.equal(before2.ok,true);
 doppel.weiterspielen(10);
 assert.equal(doppel.exportieren(),json,'gleicher Export + gleiche Commands = gleicher Seed-/Zeit-/Worldhash');
});

test('J8 – nur vom Original-Core geprüfte Hauskäufe; keine Gratisjäger und keine NPC-Privilegien',()=>{
 const s=newSession(),a=s.starten195(original().export(),true);
 const alle=s.angebote();
 assert.ok(alle.some(x=>x.id==='buy-st_nadir-jaeger'));
 assert.equal(alle.find(x=>x.id==='buy-st_nadir-jaeger').ok,false,'leeres Jägerlager');
 const hash=a.hash;
 assert.equal(s.ausfuehren('buy-st_nadir-jaeger').ok,false);
 assert.equal(s.ausfuehren('buy-st_nadir-miner').ok,false,'kein kostenloser Nadir-Miner');
 assert.equal(s.ausfuehren('stationBuildFighter').ok,false);
 assert.equal(s.ausfuehren('__proto__').ok,false);
 assert.equal(s.ansicht().hash,hash);
 assert.equal(s.ansicht().weltgeld,33000);
});

test('J8 – beschädigter oder nicht geprüfter Import ersetzt keine laufende Sitzung',()=>{
 const s=newSession(),src=original().export(),bad=JSON.parse(src);
 bad.owners.house.cash++;
 assert.throws(()=>s.starten195(JSON.stringify(bad),true),/J7 blockiert/);
 assert.throws(()=>s.starten195('{}',true),/Regel195/);
 assert.throws(()=>s.starten195(src,false),/ausdrückliche/);
 assert.throws(()=>s.oeffnen204(src,true),/Original-Regel204/);
 const originalAnsicht=s.starten195(src,true);
 for(const fake of ['{',JSON.stringify({...JSON.parse(s.exportieren()),rulesVersion:205})]){
   assert.throws(()=>s.oeffnen204(fake,true),/nicht überschreiben/);
   assert.equal(s.ansicht().hash,originalAnsicht.hash);
 }
 assert.throws(()=>s.weiterspielen(365),/nur 1, 10 oder 60/);
 assert.equal(s.ansicht().hash,originalAnsicht.hash);
});

test('J8 – wiederholter 204-Export kann ohne 195-Rückmigration gelesen werden, ohne Zustand zu verändern',()=>{
 const s=newSession();
 const orig=original().export();const a=s.starten195(orig,true);
 const json=s.exportieren();
 const neu=newSession();
 assert.throws(()=>neu.oeffnen204(json,false),/ausdrückliche/);
 const b=neu.oeffnen204(json,true);
 assert.equal(b.hash,a.hash);assert.equal(b.quelleHash,a.hash);
 assert.equal(neu.angebote().find(x=>x.id==='buy-st_nadir-jaeger')?.ok,false);
 assert.equal(neu.exportieren(),json);
});
