import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../prototypes/tutorial-manager/manager.js');
const J=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');
const Handel=require('../prototypes/spiel/p3-handelsweg.js');
const lesson=(m,id)=>{const x=m.ziele.find(x=>x.id===id);assert.ok(x,'no lesson '+id);return x;};
const neu=()=>{
 const s=J.erstellen();
 const start=s.starten195(W5.create(42,'private195').export(),true);
 assert.equal(start.regel,204);assert.equal(start.weltgeld,33000);
 assert.equal(s.weltReferenz().audit(s.zustandReferenz()).ok,true);
 return s;
};
test('Managerakademie: eight selectable steps, no imaginary ships/rewards, blocked market prices',()=>{
 const s=neu(),before=s.exportieren(),a=T.daten(s);
 assert.equal(a.ok,true);assert.equal(a.gesamt,7);assert.equal(a.ziele.length,8);
 assert.equal(a.erledigt,0);
 assert.equal(lesson(a,'miner').erfuellt,false);
 assert.equal(lesson(a,'frachter').erfuellt,false);
 assert.equal(lesson(a,'foerderung').erfuellt,false);
 assert.equal(lesson(a,'transport').erfuellt,false);
 assert.equal(lesson(a,'abrechnung').erfuellt,false);
 assert.equal(lesson(a,'verkauf').erfuellt,false);
 assert.equal(lesson(a,'miner').aktionId,'buy-st_aldera-miner');
 assert.equal(lesson(a,'frachter').aktionId,'buy-st_aldera-frachter');
 assert.equal(lesson(a,'foerderung').bereit,false);
 assert.equal(lesson(a,'transport').bereit,false);
 assert.equal(s.exportieren(),before,'read-only tutorial evaluation must leave byte-identical economic save');
 const b=T.daten(s,{markt:true,bestand:true,foerderung:true});
 assert.equal(b.erledigt,2,'visual lessons may count after opening the real menu');
 assert.equal(lesson(b,'foerderung').erfuellt,false,'forged UI event cannot simulate paid mining');
 assert.equal(s.exportieren(),before,'no added tuition escrow or world inventory');
});

test('Managerakademie: paid miner, paid freighter, original ice order and actual freight settlement',()=>{
 const s=neu();
 assert.equal(s.ausfuehren('buy-st_aldera-miner').ok,true);
 let m=T.daten(s);
 assert.equal(lesson(m,'miner').erfuellt,true);
 assert.equal(lesson(m,'frachter').erfuellt,false);
 assert.equal(lesson(m,'foerderung').erfuellt,false);
 assert.equal(s.ausfuehren('buy-st_aldera-frachter').ok,true);
 m=T.daten(s);
 assert.equal(s.ansicht().hausgeld,1650);
 assert.equal(lesson(m,'frachter').erfuellt,true);
 const miner=s.ansicht().schiffe.find(sh=>sh.klasse==='miner');
 const freighter=s.ansicht().schiffe.find(sh=>sh.klasse==='frachter');
 assert.ok(miner);assert.ok(freighter);
 assert.equal(lesson(m,'foerderung').aktionId,'ice-'+miner.id);
 assert.equal(s.ausfuehren('ice-'+miner.id).ok,true);
 m=T.daten(s);
 assert.equal(lesson(m,'foerderung').erfuellt,true);
 assert.equal(lesson(m,'transport').erfuellt,false);
 s.weiterspielen(60);s.weiterspielen(60);
 m=T.daten(s);
 assert.equal(lesson(m,'transport').aktionId,'freight-'+freighter.id);
 assert.equal(lesson(m,'transport').bereit,true);
 assert.equal(s.ausfuehren('freight-'+freighter.id).ok,true);
 m=T.daten(s);
 assert.equal(lesson(m,'transport').erfuellt,true);
 assert.equal(lesson(m,'abrechnung').erfuellt,false,'departure is not a paid delivery');
 s.weiterspielen(60);s.weiterspielen(60);
 m=T.daten(s);
 assert.equal(lesson(m,'abrechnung').erfuellt,true);
 assert.equal(lesson(m,'verkauf').erfuellt,false,'freight fees are not a fabricated silicon sale');
 const state=s.zustandReferenz(),f=state.kanon.spielerFrachten;
 assert.equal(f.lohn,120);
 assert.equal(f.gebuehr,240);
 assert.equal(f.auftraege[0].end!==null,true);
 assert.equal(state.minted,0);assert.equal(state.burned,0);
 assert.equal(Object.values(state.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.weltReferenz().audit(state).ok,true);
 // The academy uses a miner-first purchase order. The historical
 // e4514490... reference uses a *different* order: freighter before miner.
 // Prove that observing the lessons changes nothing: run a fresh original
 // session through exactly the same commands *without* the tutorial layer.
 const noTutor=neu();
 assert.equal(noTutor.ausfuehren('buy-st_aldera-miner').ok,true);
 assert.equal(noTutor.ausfuehren('buy-st_aldera-frachter').ok,true);
 assert.equal(noTutor.ausfuehren('ice-'+miner.id).ok,true);
 noTutor.weiterspielen(60);noTutor.weiterspielen(60);
 assert.equal(noTutor.ausfuehren('freight-'+freighter.id).ok,true);
 noTutor.weiterspielen(60);noTutor.weiterspielen(60);
 assert.equal(s.ansicht().hash,noTutor.ansicht().hash,
   'tutorial observation must preserve original seed and economic hash');
 assert.equal(s.exportieren(),noTutor.exportieren(),
   'same commands with and without lessons must produce byte-identical save');
 const saved=s.exportieren(),round=J.erstellen();round.oeffnen204(saved,true);
 assert.equal(round.exportieren(),saved);
 assert.equal(lesson(T.daten(round),'abrechnung').erfuellt,true,'economic receipts survive legitimate save/load');
 assert.equal(lesson(T.daten(round),'foerderung').erfuellt,true,'current own miner task survives save/load');
});

test('Managerakademie: no forged owner or non-authoritative world',()=>{
 assert.throws(()=>T.daten({weltReferenz:()=>({audit:()=>({ok:false})}),
   zustandReferenz:()=>({rulesVersion:204}),ansicht:()=>({regel:204}),angebote:()=>[]}),/Originalwelt/);
 assert.throws(()=>T.daten(null),/Karrieresitzung/);
 const s=neu();
 const before=s.exportieren();
 const fake={weltReferenz:()=>s.weltReferenz(),
   zustandReferenz:()=>({...s.zustandReferenz(),minted:999}),
   ansicht:()=>s.ansicht(),angebote:()=>[]};
 assert.throws(()=>T.daten(fake),/Originalwelt/);
 assert.equal(s.exportieren(),before);
});

test('Managerakademie: one optional silicon sale but no dependency on remote NPC signatures',()=>{
 const s=neu(),m=T.daten(s);
 assert.equal(lesson(m,'verkauf').optional,true);
 assert.equal(lesson(m,'verkauf').bereit,false);
 assert.match(lesson(m,'verkauf').hinweis,/Nadir/);
 assert.ok(T.FAECHER.every(x=>!x.hilfe.includes('Regel204')));
 assert.ok(T.FAECHER.every(x=>!x.beschreibung.includes('Prototyp')));
});

test('Managerakademie: public HTML integrates only a read-only UI extension',()=>{
 const html=fs.readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 assert.match(html,/src="\.\.\/tutorial-manager\/manager\.js"/);
 assert.match(html,/href="\.\.\/tutorial-manager\/manager\.css"/);
 assert.ok(html.indexOf('../tutorial-manager/manager.js')<html.indexOf('src="spiel.js"'));
 assert.match(js,/ManagerAkademie\.verbinden\(/);
 assert.match(js,/managerTutor\?\.auffrischen\(\)/);
 assert.match(js,/managerTutor\?\.gebucht\(id\)/);
 assert.doesNotMatch(fs.readFileSync(new URL('../prototypes/tutorial-manager/manager.js',import.meta.url),'utf8'),/localStorage|session\.ausfuehren\(/);
});


test('Wirtschaftsmanager: ticks can exhaust the freighter offer and the original refusal leaves the save untouched',()=>{
 const s=neu();
 const handel=()=>Handel.auswerten(s.zustandReferenz(),s.angebote(),s.weltReferenz());
 assert.equal(handel().aktion,'buy-st_aldera-miner');
 assert.equal(s.ausfuehren(handel().aktion).ok,true);
 assert.equal(handel().aktion,'buy-st_aldera-frachter');
 assert.equal(handel().bereit,true);
 assert.equal(s.ansicht().tick,0);
 s.weiterspielen(60);
 const vorher=s.exportieren(),blockiert=handel();
 assert.equal(blockiert.bereit,false);
 assert.equal(blockiert.grund,'kein Komplettschiff auf Lager');
 assert.equal(s.ausfuehren(blockiert.aktion).ok,false);
 assert.equal(s.exportieren(),vorher);
});
