import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');
const Handel=require('../prototypes/spiel/p3-handelsweg.js');
const W6=require('../tools/w6-szenarien.cjs');

function starten(){
 const j=J8.erstellen();
 j.starten195(OLD.create(42,'private195').export(),true);
 return j;
}
function karte(j,angebote=j.angebote()){
 return Karte.auswerten(j.ansicht(),j.zustandReferenz(),j.weltReferenz(),angebote);
}
function buchen(j,id){
 const r=j.ausfuehren(id);
 assert.equal(r.ok,true,r.reason);
}
test('Sektorkarte: tatsächliche Stationen und Angebote, keine Fremdflotte oder behauptete Fahrt',()=>{
 const j=starten(),v=karte(j);
 assert.deepEqual(v.stationen.map(o=>o.name),['Aldera','Nadir']);
 assert.equal(v.stationen[1].werftBetreiber,'werft_extern');
 assert.equal(v.stationen[1].raffinerie,'In Bereitschaft');
 assert.ok(Object.values(j.zustandReferenz().ships).some(sh=>sh.owner!=='house'));
 assert.deepEqual(v.schiffe,[]);
 assert.equal(v.auftraege,0);
 const save=j.exportieren();
 const fehlt=karte(j,[]);
 assert.deepEqual(fehlt.stationen.map(st=>st.angebote),[[],[]]);
 const s=j.zustandReferenz(),w=j.weltReferenz();
 assert.equal(Handel.auswerten(s,[],w).bereit,false);
 assert.equal(j.exportieren(),save);
 buchen(j,'buy-st_aldera-miner');
 j.weiterspielen(60);
 const gesperrt=karte(j).stationen[0].angebote.find(o=>o.id==='buy-st_aldera-frachter');
 assert.equal(gesperrt.ok,false);
 assert.equal(gesperrt.reason,'kein Komplettschiff auf Lager');
 assert.equal(Handel.auswerten(j.zustandReferenz(),j.angebote(),w).grund,gesperrt.reason);
});
test('Sektorkarte: Dravos nur aus der validierten Regel207-Karriere',()=>{
 const j=J8.erstellen();
 j.startenP8g(true);
 const a=j.ansicht(),s=j.zustandReferenz(),w=j.weltReferenz();
 const v=karte(j);
 assert.ok(a.stationen.some(st=>st.id==='st_dravos'));
 assert.ok(v.stationen.some(st=>st.name==='Dravos'));
 assert.equal(v.auftraege,0);
 assert.equal(Karte.auswerten({...a,stationen:a.stationen.filter(st=>st.id!=='st_dravos')},
  s,w,[]).stationen.some(st=>st.name==='Dravos'),false);
});
test('Sektorkarte: Originalfahrt, Rückweg, Kauf, Waren und Save/Load im Seed42-Referenzreplay',()=>{
 function spielen(){
  const j=starten();
  buchen(j,'buy-st_aldera-miner');
  buchen(j,'buy-st_aldera-frachter');
  const start=karte(j);
  assert.equal(start.auftraege,0);
  assert.deepEqual(start.schiffe.map(sh=>[sh.klasse,sh.owner,sh.gruppe,sh.buchwert]),[
   ['miner','house','aldera',600],['frachter','house','aldera',750]
  ]);
  const [miner,frachter]=start.schiffe;
  buchen(j,'ice-'+miner.id);
  assert.equal(karte(j).auftraege,1);
  j.weiterspielen(60);j.weiterspielen(60);
  const auftrag='freight-'+frachter.id;
  buchen(j,auftrag);
  const hin=j.exportieren();
  assert.equal(j.ausfuehren(auftrag).ok,false);
  assert.equal(j.exportieren(),hin);
  function pruefeFracht(phase,ladung,ort,hash){
   const v=karte(j),sh=v.schiffe.find(sh=>sh.id===frachter.id);
   assert.equal(v.auftraege,2);
   assert.equal(sh.gruppe,'strecke');
   assert.equal(sh.auftrag,'Eisfracht · '+phase);
   assert.equal(sh.ladung,ladung);
   assert.equal(sh.ort,ort);
   assert.equal(j.ansicht().hash,hash);
  }
  pruefeFracht('Hinfahrt','eis: 50','Aldera → Nadir','30a46fa2f3f3a2e3');
  j.weiterspielen(60);
  pruefeFracht('Rückfahrt','leer','Nadir → Aldera','f64b8006ce6ce88f');
  j.weiterspielen(60);
  assert.equal(karte(j).schiffe.find(sh=>sh.id===frachter.id).gruppe,'aldera');
  assert.equal(karte(j).auftraege,1);
  const saved=j.exportieren(),s=j.zustandReferenz(),w=j.weltReferenz();
  assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
  assert.deepEqual(W6.pruefen(w,s),[]);
  assert.deepEqual([j.ansicht().weltgeld,s.minted,s.burned],[33000,0,0]);
  assert.deepEqual([s.kanon.spielerFrachten.gebuehr,s.kanon.spielerFrachten.lohn],[240,120]);
  const clone=J8.erstellen();
  clone.oeffnen204(saved,true);
  assert.equal(clone.exportieren(),saved);
  assert.deepEqual(karte(clone),karte(j));
  assert.equal(j.exportieren(),saved);
  return saved;
 }
 assert.equal(spielen(),spielen());
});
