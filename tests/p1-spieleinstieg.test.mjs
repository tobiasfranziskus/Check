// P1 – Real-World career start, not a synthetic Rule204 test save.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const root=path.resolve(import.meta.dirname,'..');

test('P1: new career is the original audited Rule195 seed42 converted through J7/J8, not minted',()=>{
 const source=W5.create(42,'private195').export();
 const first=JSON.parse(source),ses=J8.erstellen();
 assert.equal(first.rulesVersion,195);
 const initial=ses.starten195(source,true),w=ses.weltReferenz(),s=ses.zustandReferenz();
 assert.equal(initial.regel,204);
 assert.equal(initial.weltgeld,33000);
 assert.equal(initial.hausgeld,3000);
 assert.equal(initial.schiffe.length,0);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.kanon.jaeger.fertig,0);
 assert.equal(w.audit(s).ok,true);
 assert.equal(W5.create(42,'private195').export(),source);
 const save=ses.exportieren();
 const loaded=J8.erstellen(),second=loaded.oeffnen204(save,true);
 assert.equal(second.hash,initial.hash);
 assert.equal(second.weltgeld,33000);
 assert.equal(loaded.exportieren(),save);
 console.log('P1_AUTHENTIC_START',JSON.stringify({hash:initial.hash,tick:s.tick,worldMoney:33000,house:initial.hausgeld}));
});

test('P1: first player ship is bought for 600 ISK, flown with 40 ISK real reserve, and persistently audited',()=>{
 const source=W5.create(42,'private195').export(),s=J8.erstellen();
 s.starten195(source,true);
 const offer=s.angebote().find(x=>x.id==='buy-st_aldera-miner');
 assert.ok(offer);assert.equal(offer.ok,true,JSON.stringify(offer));
 const before=s.ansicht();
 const bought=s.ausfuehren(offer.id);
 assert.equal(bought.ok,true,JSON.stringify(bought));
 const after=s.ansicht();
 assert.equal(before.hausgeld-after.hausgeld,600);
 assert.equal(after.schiffe.length,1);
 const sh=after.schiffe[0];
 assert.equal(sh.klasse,'miner');assert.equal(sh.system,'aldera');
 assert.equal(s.uebernehmen(sh.id).ok,true);
 const undock=s.flugBefehl({type:'shipUndock',owner:'house',schiff:sh.id});
 assert.equal(undock.ok,true,JSON.stringify(undock));
 const current=s.zustandReferenz(),dienst=current.kanon.flugdienst[sh.id];
 assert.ok(dienst);assert.equal(current.owners[dienst.konto].cash,40);
 assert.equal(current.owners.house.cash,2400-40);
 assert.equal(s.flugSchritte(60),1);
 const rt=J8.erstellen(),save=s.exportieren();rt.oeffnen204(save,true);
 assert.equal(rt.ansicht().hash,s.ansicht().hash);
 assert.equal(rt.zustandReferenz().ships[sh.id].owner,'house');
 assert.equal(rt.zustandReferenz().minted,0);
 assert.equal(rt.zustandReferenz().burned,0);
 assert.equal(rt.weltReferenz().audit(rt.zustandReferenz()).ok,true);
 assert.equal(W5.create(42,'private195').export(),source);
 console.log('P1_PAID_FIRST_FLIGHT',JSON.stringify({ship:sh.id,worldMoney:after.weltgeld,house:current.owners.house.cash,hash:s.ansicht().hash}));
});

test('P1: standalone player entry only adds a separate shell, no core or old save migration',()=>{
 const html=fs.readFileSync(path.join(root,'prototypes/spiel/index.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'prototypes/spiel/spiel.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'prototypes/spiel/spiel.css'),'utf8');
 assert.match(html,/id="startseite"/);
 assert.match(html,/id="briefing"/);
 assert.match(html,/id="spielwelt"/);
 assert.match(html,/id="raumbereich"/);
 assert.match(html,/src="\.\.\/verbund\/konzern-session\.js"/);
 assert.match(html,/src="\.\.\/raum\/raum-cockpit\.js"/);
 assert.match(html,/src="\.\.\/w5ac\/session\.js"/);
 assert.match(html,/id="neues-spiel"/);
 assert.match(html,/id="karriere-direkt"/);
 assert.doesNotMatch(html,/class="entry-features"|class="hero-side"|class="faction"/);
 assert.match(js,/const standardStart=\(\)=>\{for\(const id of \[\x27w6-npc-start\x27,\x27w6-p8g-start\x27,\x27pir-start\x27\]\)\$\(id\)\.checked=false;startNeu\(\);\}/);
 const j8=fs.readFileSync(path.join(root,'prototypes/verbund/konzern-session.js'),'utf8');
 // The original seed conversion is now inside J8's fresh-only entry,
 // not an arbitrary imported career or a second core.
 assert.match(js,/neu\.starten208\(true,w6Aktiv\)/);
 assert.match(j8,/genesis\.starten195\(OLD\.create\(42,'private195'\)\.export\(\),true\)/);
 assert.match(js,/\.oeffnen208\(/);
 assert.match(js,/const SLOT='aphros-void:spielerkarriere:regel204:v1'/);
 assert.match(js,/const SLOT_208='aphros-void:spielerkarriere:regel208:v1'/);
 assert.match(js,/session\.exportieren\(\)/);
 assert.match(js,/\.oeffnen204\(/);
 assert.match(js,/localStorage\.setItem\(SLOT,json\)/);
 assert.doesNotMatch(js,/indexedDB\.deleteDatabase|localStorage\.clear\(/);
 // Only undo the newly created 208 backup when replacement failed;
 // never delete any existing 204, 207, PIR or house-ore slot.
 const rollback='storage.removeItem(BACKUP_208)';
 assert.equal(js.split(rollback).length,2);
 assert.doesNotMatch(js.replace(rollback,''),/\.removeItem\s*\(/);
 assert.doesNotMatch(html,/<script[^>]*src="https?:/i);
 assert.doesNotMatch(css,/@import|url\(https?:/);
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\.\.\/[^"]+)"/g)){
   assert.equal(fs.existsSync(path.resolve(root,'prototypes/spiel',match[1])),true,match[1]);
 }
});


test('P1: fresh 208 starts use original 195 assets; 204 remains readable and neither loader upgrades a save',()=>{
 const source=W5.create(42,'private195').export();
 for(const s02 of [false,true]){
   const old=J8.erstellen(),fresh=J8.erstellen();
   old.starten195(source,true);
   if(s02){
     const w=old.weltReferenz(),s=old.zustandReferenz();
     w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
     w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
   }
   const initial=fresh.starten208(true,s02);
   assert.equal(initial.regel,208);assert.equal(initial.weltgeld,33000);
   assert.equal(initial.hausgeld,3000);assert.equal(initial.schiffe.length,0);
   const previous=old.exportieren(),newSave=fresh.exportieren();
   const a=JSON.parse(previous),b=JSON.parse(newSave);
   assert.equal(a.rulesVersion,204);assert.equal(b.rulesVersion,208);
   delete a.rulesVersion;delete b.rulesVersion;assert.deepEqual(a,b);
   assert.throws(()=>J8.erstellen().oeffnen204(newSave,true),/Regel204/);
   assert.throws(()=>J8.erstellen().oeffnen208(previous,true),/Regel208/);
   assert.throws(()=>J8.erstellen().starten208(false,s02),/Regel208/);
   assert.throws(()=>fresh.starten208(true,s02),/Regel208/);
   assert.equal(fresh.exportieren(),newSave);
   for(const [ses,version] of [[old,204],[fresh,208]]){
     const w=ses.weltReferenz();
     assert.equal(ses.ausfuehren('buy-st_aldera-miner').ok,true);
     assert.equal(ses.ansicht().hausgeld,2400);
     const sh=ses.ansicht().schiffe[0];
     assert.equal(sh.klasse,'miner');assert.equal(ses.uebernehmen(sh.id).ok,true);
     assert.equal(ses.flugBefehl({type:'shipUndock',owner:'house',schiff:sh.id}).ok,true);
     assert.equal(ses.zustandReferenz().owners.house.cash,2360);
     ses.flugSchritte(60);
     const save=ses.exportieren(),reloaded=J8.erstellen();
     if(version===204)reloaded.oeffnen204(save,true);else reloaded.oeffnen208(save,true);
     const state=reloaded.zustandReferenz();
     assert.equal(reloaded.exportieren(),save);
     assert.equal(reloaded.ansicht().hash,ses.ansicht().hash);
     assert.equal(state.ships[sh.id].owner,'house');
     assert.equal(state.minted,0);assert.equal(state.burned,0);
     assert.equal(w.audit(state).ok,true);
   }
   const A=JSON.parse(old.exportieren()),B=JSON.parse(fresh.exportieren());
   delete A.rulesVersion;delete B.rulesVersion;assert.deepEqual(A,B);
 }
 assert.equal(W5.create(42,'private195').export(),source);
});

test('P1: actual 208 storage helper preserves original 204 slots and restores backup after failed replacement',()=>{
 const js=fs.readFileSync(path.join(root,'prototypes/spiel/spiel.js'),'utf8');
 const start=js.indexOf('function speichern208('),end=js.indexOf('function hausErzSpeichern(',start);
 assert.ok(start>=0&&end>start);
 const oldKey='aphros-void:spielerkarriere:regel204:v1',newKey='aphros-void:spielerkarriere:regel208:v1';
 const oldBackup=oldKey+':vorherige',newBackup=newKey+':vorherige';
 // Inject storage failures only; execute the actual source helper,
 // not a reimplementation of its algorithm. Real browser gates are separate.
 for(const priorBackup of [null,'previous-208']){
   const slots=new Map([[oldKey,'original-204'],[oldBackup,'previous-204'],[newKey,'current-208']]);
   if(priorBackup!==null)slots.set(newBackup,priorBackup);
   let failKey=null;
   const storage={
     getItem:k=>slots.get(k)??null,
     setItem(k,v){if(k===failKey)throw Error('test storage write failure');slots.set(k,v);},
     removeItem(k){assert.equal(k,newBackup);slots.delete(k);}
   };
   const save=vm.runInNewContext(js.slice(start,end)+'\nspeichern208',{
     scope:{localStorage:storage},SLOT_208:newKey,BACKUP_208:newBackup
   });
   const before=[...slots.entries()].sort();
   for(const key of [newBackup,newKey]){
     failKey=key;assert.throws(()=>save('replacement-208',true),/storage write failure/);
     assert.deepEqual([...slots.entries()].sort(),before);
   }
   failKey=null;save('replacement-208',true);
   assert.equal(slots.get(newKey),'replacement-208');
   assert.equal(slots.get(newBackup),'current-208');
   assert.equal(slots.get(oldKey),'original-204');assert.equal(slots.get(oldBackup),'previous-204');
 }
});
