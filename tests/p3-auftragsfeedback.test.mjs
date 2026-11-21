import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),J=require('../prototypes/verbund/konzern-session.js'),
 OLD=require('../prototypes/w5ac/session.js'),F=require('../prototypes/spiel/p3-auftragsfeedback.js');
const sicht=j=>F.auswerten(j.weltReferenz(),j.zustandReferenz());
function run(){
 const j=J.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const cmd=id=>assert.equal(j.ausfuehren(id).ok,true,id);
 cmd('buy-st_aldera-miner');cmd('buy-st_aldera-frachter');
 const [m]=j.ansicht().schiffe.filter(s=>s.klasse==='miner'),[f]=j.ansicht().schiffe.filter(s=>s.klasse==='frachter');
 cmd('ice-'+m.id);assert.equal(sicht(j).zeitAktiv,true);
 const reject=id=>{const save=j.exportieren();assert.equal(j.ausfuehren(id).ok,false);assert.equal(j.exportieren(),save);};
 reject('ice-'+m.id);
 cmd('stop-'+m.id);assert.equal(sicht(j).foerderung.length,0);cmd('ice-'+m.id);
 j.weiterspielen(60);j.weiterspielen(60);cmd('freight-'+f.id);
 assert.match(sicht(j).frachten[0].status,/Hinflug/);reject('freight-'+f.id);reject('stop-'+f.id);
 j.weiterspielen(60);assert.match(sicht(j).frachten[0].status,/Rückflug/);
 assert.equal(sicht(j).frachten[0].menge,50);assert.equal(sicht(j).gebuehr,0);
 j.weiterspielen(60);assert.equal(sicht(j).frachten[0].status,'Abgeschlossen');
 assert.equal(sicht(j).gebuehr,240);assert.equal(sicht(j).lohn,120);
 const save=j.exportieren(),p=sicht(j),loaded=J.erstellen();loaded.oeffnen204(save,true);
 assert.deepEqual(sicht(loaded),p);assert.equal(j.exportieren(),save);
 assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
 assert.deepEqual([j.ansicht().weltgeld,j.zustandReferenz().minted,j.zustandReferenz().burned],[33000,0,0]);
 return save;
}
test('M-UX3: Originalbelege, Neustart, Abbruch, Ablehnung, Replay und Save/Load',()=>assert.equal(run(),run()));
