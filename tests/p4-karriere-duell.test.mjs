// P4 – Genuine financed fighter, original F6 steps, *virtual* F8-E duel.
// No new combat balance, no ammo, no money/loot mint, no save-schema changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const J4e=require('../prototypes/j4c/duell.js');
const J4d=require('../prototypes/j4c/patrouille.js');
const W5=require('../prototypes/w5ac/session.js');
const W=require('../prototypes/welt/welt-kern.js');
const Szene=require('../prototypes/raum/raum-szene.js');

const fixture=()=>fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const session=()=>{
 const ses=J8.erstellen();ses.oeffnen204(fixture(),true);
 const s=ses.zustandReferenz(),w=ses.weltReferenz(),id='sh023';
 assert.equal(w.audit(s).ok,true);
 assert.equal(s.ships[id].owner,'house');
 assert.equal(s.ships[id].klasse,'jaeger');
 assert.ok(s.kanon.jaeger.kaeufe.some(k=>k.id===id&&k.owner==='house'&&k.preis===900));
 assert.equal(ses.uebernehmen(id,false).ok,true);
 return {ses,w,id};
};
const startPaid=()=>{
 const k=session(),{ses,id}=k;
 assert.throws(()=>J4e.beginnen(k.w,ses.zustandReferenz(),id),/vorfinanzierten freien Jägerflug/);
 const geld=ses.zustandReferenz().owners.house.cash;
 const r=ses.flugBefehl({type:'shipUndock',owner:'house',schiff:id});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(ses.zustandReferenz().owners.house.cash,geld-40,'flight salary escrow is real');
 assert.equal(ses.flugSchritte(40),0);
 assert.equal(ses.zustandReferenz().ships[id].flug.lage,'frei');
 const duel=J4e.beginnen(k.w,ses.zustandReferenz(),id);
 assert.equal(duel.status,'aktiv');
 assert.equal(J4e.audit(duel).ok,true);
 return {...k,duel};
};

test('P4: virtual fight begins only in original financed Regel204 ownership and free flight',()=>{
 const a=startPaid(),{ses,w,id,duel}=a;
 const old=ses.exportieren();
 assert.equal(J4e.stand(duel).pilotHp,96);
 assert.equal(J4e.stand(duel).zielHp,135);
 assert.equal(J4e.stand(duel).status,'aktiv');
 assert.equal(ses.exportieren(),old,'no modified world on training start');
 assert.equal(ses.zustandReferenz().minted,0);
 assert.equal(ses.zustandReferenz().burned,0);
 const shot=J4e.feuern(w,ses.zustandReferenz(),duel);
 assert.equal(shot.ok,true,JSON.stringify(shot));
 assert.equal(J4e.stand(duel).schuesse,1);
 assert.equal(J4e.feuern(w,ses.zustandReferenz(),duel).ok,false,'16 real-second cooldown');
 assert.equal(ses.exportieren(),old,'virtual shot cannot create ammo or damage the world');
 assert.equal(J4e.audit(duel).ok,true);
 assert.equal(old.includes('"zielprobe"'),false,'training never enters economic JSON');
 const loaded=J8.erstellen();loaded.oeffnen204(ses.exportieren(),true);
 assert.equal(loaded.exportieren(),old);
});

test('P4: immutable J8 snapshots drive opponent simulation without authority or money changes',()=>{
 const a=startPaid(),b=startPaid(),{ses,w,id,duel}=a;
 const initial=ses.exportieren();
 assert.equal(initial,b.ses.exportieren());
 let steps=0,seen=false;
 const shot=J4e.feuern(w,ses.zustandReferenz(),duel);
 assert.equal(shot.ok,true);
 const follow=ses.flugBefehl({type:'shipFlyTo',schiff:id,owner:'house',
   x:J4e.TREFFER.K.zielX,y:J4e.TREFFER.K.zielY});
 assert.equal(follow.ok,true,JSON.stringify(follow));
 assert.equal(b.ses.flugBefehl({type:'shipFlyTo',schiff:id,owner:'house',
   x:J4e.TREFFER.K.zielX,y:J4e.TREFFER.K.zielY}).ok,true);
 for(let batch=0;batch<5;batch++){
   ses.flugSchritte(900,probe=>{
     steps++;
     if(steps===1){
       assert.equal(Object.isFrozen(probe),true);
       assert.equal(Object.isFrozen(probe.ships[id].flug),true);
       assert.equal(Object.isFrozen(probe.kanon.flugdienst[id]),true);
       assert.equal(probe.kanon.flugdienst[id].konto,'k1_flug_'+id);
       assert.throws(()=>{probe.kanon.flugdienst[id].konto='house';},TypeError);
       assert.throws(()=>{probe.ships[id].flug.kurs=88;},TypeError);
     }
     J4e.beobachten(w,probe,duel);
   });
   b.ses.flugSchritte(900);
   if(duel.zielprobe.gegner.schuesse>0){seen=true;break;}
 }
 assert.ok(steps>=60,'real whole simulation seconds observed');
 assert.equal(ses.exportieren(),b.ses.exportieren(),'training observer must not influence world, salary or RNG');
 assert.equal(w.audit(ses.zustandReferenz()).ok,true);
 assert.equal(ses.zustandReferenz().minted,0);
 assert.equal(ses.zustandReferenz().burned,0);
 assert.equal(Object.values(ses.zustandReferenz().owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(J4e.audit(duel).ok,true);
 assert.ok(J4e.stand(duel).sekunden>0&&J4e.stand(duel).sekunden<=steps,
   'virtual training may end on a real F8 outcome while F6 flight continues');
 assert.equal(seen,true,'real moving drone must fire only after entering its physical range');
 const loaded=J8.erstellen();loaded.oeffnen204(ses.exportieren(),true);
 assert.equal(loaded.exportieren(),ses.exportieren());
 assert.equal(J4e.stand(null).status,'nicht gestartet','training is not persisted');
});

test('P4: forged fighter entitlement or non-fighter ownership cannot start training',()=>{
 const a=session(),{w,ses,id}=a;
 const original=ses.exportieren(),forged=w.load(original);
 forged.kanon.jaeger.kaeufe=[];
 assert.throws(()=>J4e.beginnen(w,forged,id),/auditiert|Originaler Eigentums/i);
 assert.equal(ses.exportieren(),original,'rejected forged record cannot replace the valid career');
 const ok=session();
 const miner=Object.values(ok.ses.zustandReferenz().ships)
   .find(sh=>sh.owner==='house'&&sh.klasse==='miner');
 assert.ok(miner);
 assert.throws(()=>J4e.beginnen(ok.w,ok.ses.zustandReferenz(),miner.id),/Eigentums|Jägerkauf/);
 const start=W5.create(42,'private195').export(),fresh=J8.erstellen();
 fresh.starten195(start,true);
 assert.equal(Object.values(fresh.zustandReferenz().ships).some(sh=>sh.owner==='house'&&sh.klasse==='jaeger'),false);
 assert.equal(fresh.zustandReferenz().minted,0);
 const p4=J4d.stand(null);
 assert.equal(p4.status,'nicht gestartet');
});

test('P4: skipped seconds interrupt the duel; no fabricated training progress',()=>{
 const {ses,w,id,duel}=startPaid();
 const probe=ses.zustandReferenz();
 const miss=J4e.feuern(w,probe,duel);
 assert.equal(miss.ok,true);
 const bogus={
   rulesVersion:204,tick:probe.tick+3,flug:{schritt:0},
   kanon:{jaeger:{kaeufe:[{id,owner:'house',station:'st_nadir'}]},
     flugdienst:{[id]:{konto:'k1_flug_'+id}}},
   ships:{[id]:{id,owner:'house',klasse:'jaeger',system:'nadir',
     flug:{lage:'frei',x:0,y:0,kurs:0,vx:0,vy:0}}}
 };
 J4e.beobachten(w,bogus,duel);
 assert.equal(duel.status,'unterbrochen');
 assert.equal(J4e.feuern(w,probe,duel).ok,false);
 assert.equal(w.audit(ses.zustandReferenz()).ok,true);
});

test('P4: public career loads preexisting F8 modules; does not serialize duel state or new rules',()=>{
 const html=fs.readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const cockpit=fs.readFileSync(new URL('../prototypes/raum/raum-cockpit.js',import.meta.url),'utf8');
 for(const src of ['../f8-jaeger/f8-treffer.js','../f8-jaeger/f8-duell.js','../j4c/duell.js']){
   assert.ok(html.includes('src="'+src+'"'),src);
   assert.ok(html.indexOf('src="'+src+'"')<html.indexOf('src="spiel.js"'),src);
 }
 assert.match(js,/J4eDuell\.beginnen\(/);
 assert.match(js,/J4eDuell\.beobachten\(/);
 assert.match(js,/J4eDuell\.feuern\(/);
 assert.match(js,/duell=null/);
 // Keep the paid active fighter identity gate and whitelist precisely
 // the two ordinary rule revisions, not all rules >= 204.
 assert.match(cockpit,/a\.id === sz\.jaeger && a\.klasse === 'jaeger' && \[204,208\]\.includes\(sz\.regel\)/);
 assert.doesNotMatch(js,/localStorage\.setItem\([^,]+,\s*duell/);
 assert.match(html,/keine Munition, Hüllenschäden, Beute oder ISK-Belohnungen/);
});


test('P4: Rule208 fresh career has no fighter right; paid boundary fixture retains original virtual duel and exact version gates',()=>{
 const fresh=J8.erstellen();fresh.starten208(true,false);
 assert.equal(Object.values(fresh.zustandReferenz().ships).some(sh=>sh.owner==='house'&&sh.klasse==='jaeger'),false);
 const initial=fresh.exportieren();
 assert.throws(()=>J4e.beginnen(fresh.weltReferenz(),fresh.zustandReferenz(),'sh023'),/Eigentums|Jägerkauf/);
 assert.equal(fresh.exportieren(),initial);

 // Controlled test-only compatibility boundary, NOT a user save upgrade
 // and NOT a claim that a fresh 208 career has produced a fighter.
 // The pinned, fully audited 204 fixture already contains a paid 900 ISK
 // fighter, all material and salary journals, no active W3 contract.
 // Change only the revision in this discarded test object; the real 208
 // loader and its full audit must accept the identical paid assets.
 const original=fixture(),raw=JSON.parse(original),p=raw.w5ad.profile;
 const legacy=W.erstellenJ4c(p),old=legacy.load(original);
 assert.equal(legacy.hash(old),'daec00c7618a6cd7');
 assert.equal(old.w3.auftrag,null);assert.equal(legacy.save(old),original);
 const revised=W.erstellenNpcErz208(p);
 raw.rulesVersion=208;
 const controlled=revised.save(revised.load(revised.canonical(raw)));
 assert.deepEqual(JSON.parse(controlled),raw);
 assert.throws(()=>J8.erstellen().oeffnen208(original,true),/Regel208/);
 assert.throws(()=>J8.erstellen().oeffnen204(controlled,true),/Regel204/);
 const ses=J8.erstellen();ses.oeffnen208(controlled,true);
 const w=ses.weltReferenz(),id='sh023';
 assert.equal(ses.uebernehmen(id,false).ok,true);
 assert.equal(w.audit(ses.zustandReferenz()).ok,true);
 assert.throws(()=>J4e.beginnen(w,ses.zustandReferenz(),id),/vorfinanzierten freien Jägerflug/);
 const cash=ses.zustandReferenz().owners.house.cash;
 assert.equal(ses.flugBefehl({type:'shipUndock',owner:'house',schiff:id}).ok,true);
 assert.equal(ses.zustandReferenz().owners.house.cash,cash-40);
 ses.flugSchritte(40);
 const s=ses.zustandReferenz(),before=ses.exportieren();
 assert.equal(s.ships[id].flug.lage,'frei');
 const view=Szene.erzeugen(w,s,id);
 assert.equal(view.regel,208);assert.equal(view.jaeger,id);
 assert.equal(view.aktiv.id,id);assert.equal(view.aktiv.klasse,'jaeger');
 const duel=J4e.beginnen(w,s,id);
 assert.equal(J4e.feuern(w,s,duel).ok,true);
 assert.equal(J4e.feuern(w,s,duel).ok,false);
 assert.equal(J4e.audit(duel).ok,true);
 assert.equal(ses.exportieren(),before);
 assert.equal(before.includes('"zielprobe"'),false);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 const loaded=J8.erstellen();loaded.oeffnen208(before,true);
 assert.equal(loaded.exportieren(),before);
 assert.equal(loaded.ansicht().hash,ses.ansicht().hash);

 // Explicit rejection of the three excluded research versions, even
 // with a paid fighter projection and a purported successful audit.
 // These are isolated guard probes, not valid research save files.
 for(const version of [205,206,207]){
   const probe={...s,rulesVersion:version};
   assert.throws(()=>J4e.beginnen({regel:version,rules:w.rules,audit:()=>({ok:true})},probe,id),/auditiert/);
 }
 assert.throws(()=>J4e.beginnen(legacy,s,id),/auditiert/);
 const forged=w.load(before);forged.kanon.jaeger.kaeufe=[];
 assert.throws(()=>J4e.beginnen(w,forged,id),/auditiert|Eigentums/i);
 assert.equal(ses.exportieren(),before);
 assert.equal(legacy.save(old),original);
});
