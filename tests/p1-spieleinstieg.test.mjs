// P1 – Real-World career start, not a synthetic Rule204 test save.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
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
 assert.match(js,/W5acSession\.create\(42,'private195'\)\.export\(\)/);
 assert.match(js,/session\.exportieren\(\)/);
 assert.match(js,/\.oeffnen204\(/);
 assert.match(js,/localStorage\.setItem\(SLOT,json\)/);
 // The only allowed deletion rolls back a newly created U7 backup key after a failed write.
 // No existing save, other storage key or database may be deleted.
 const rollback="if(backup===null)store.removeItem(SLOT_U7+':vorherige');else store.setItem(key,backup);";
 assert.doesNotMatch(js.replace(rollback,''),/indexedDB\.deleteDatabase|localStorage\.clear\(|\.removeItem\(/);
 assert.doesNotMatch(html,/<script[^>]*src="https?:/i);
 assert.doesNotMatch(css,/@import|url\(https?:/);
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\.\.\/[^"]+)"/g)){
   assert.equal(fs.existsSync(path.resolve(root,'prototypes/spiel',match[1])),true,match[1]);
 }
});
