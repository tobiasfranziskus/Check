/* Unabhängige M4/S1-Negativprüfung: keine Produkt-/Core-Änderung.
 * Aufgesetzt auf exakt a12036ef (#546), nicht von dessen Autorentests abgeleitet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');

function neu(){
 const j=J8.erstellen();
 j.starten195(W5.create(42,'private195').export(),true);
 return j;
}
function model(j,quotes=j.angebote()){
 return Karte.auswerten(j.ansicht(),j.zustandReferenz(),j.weltReferenz(),quotes);
}

test('Unabhängiger S1-Audit: Karte liest nur Eigenbestand und ändert auch bei Wiederholung keine Bücher',()=>{
 const j=neu(),initial=j.exportieren(),s=j.zustandReferenz();
 const npc=Object.values(s.ships).filter(sh=>sh.owner!=='house');
 assert.ok(npc.length>0,'Prüfung braucht tatsächlich fremde Schiffe');
 for(let i=0;i<8;i++){
  const m=model(j);
  assert.deepEqual(m.schiffe,[]);
  assert.equal(m.auftraege,0);
  assert.deepEqual(m.stationen.map(st=>st.id),['st_aldera','st_nadir']);
  assert.equal(j.exportieren(),initial,'Kartendarstellung darf das Save nicht ändern');
 }
 const fremderMiner=npc.find(sh=>sh.klasse==='miner');
 assert.ok(fremderMiner,'Tatsächlich vorhandener fremder Miner für Berechtigungsgrenze');
 const before=j.exportieren();
 assert.equal(j.ausfuehren('ice-'+fremderMiner.id).ok,false);
 assert.equal(j.exportieren(),before,'Fremdauftrag darf keine Buchungen verursachen');
});

test('Unabhängiger S1-Audit: veraltete Kaufanzeige berechtigt weder zu Doppel- noch zu Phantomkauf',()=>{
 const j=neu();
 const vorher=model(j);
 assert.equal(vorher.stationen[0].angebote.find(q=>q.id==='buy-st_aldera-frachter')?.ok,true);
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 j.weiterspielen(60); // NPC kann das letzte Aldera-Frachterangebot aufbrauchen
 const aktuell=model(j);
 const frachter=aktuell.stationen[0].angebote.find(q=>q.id==='buy-st_aldera-frachter');
 assert.equal(frachter?.ok,false);
 assert.equal(frachter?.reason,'kein Komplettschiff auf Lager');
 const before=j.exportieren();
 const r=j.ausfuehren('buy-st_aldera-frachter');
 assert.equal(r.ok,false,'Staler Quote darf nicht als Autorisierung dienen');
 assert.equal(j.exportieren(),before);
 assert.equal(model(j).schiffe.filter(sh=>sh.klasse==='frachter').length,0);
 assert.equal(j.weltReferenz().audit(j.zustandReferenz()).ok,true);
});

test('Unabhängiger S1-Audit: Regel207 zeigt nur existierende Standorte, niemals fiktive Fahrerfolge',()=>{
 const j=J8.erstellen();j.startenP8g(true);
 const s=j.zustandReferenz(),w=j.weltReferenz(),a=j.ansicht();
 const initial=j.exportieren();
 const m=Karte.auswerten(a,s,w,j.angebote());
 assert.ok(m.stationen.some(st=>st.id==='st_dravos'));
 assert.ok(m.schiffe.every(sh=>sh.owner==='house'));
 assert.equal(m.schiffe.filter(sh=>sh.gruppe==='strecke').length,0);
 assert.equal(m.auftraege,0);
 const ohneDravos=Karte.auswerten({...a,stationen:a.stationen.filter(st=>st.id!=='st_dravos')},s,w,[]);
 assert.ok(ohneDravos.stationen.every(st=>st.id!=='st_dravos'));
 assert.equal(j.exportieren(),initial);
});
