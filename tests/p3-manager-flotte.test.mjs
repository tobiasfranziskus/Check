import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');
const Flotte=require('../prototypes/spiel/p3-manager-flotte.js');
const Audit=require('../tools/w6-szenarien.cjs');

function starten(){
 const j=J8.erstellen();
 j.starten195(W5.create(42,'private195').export(),true);
 return j;
}
function befehl(j,id){
 const r=j.ausfuehren(id);assert.equal(r.ok,true,r.reason);return r;
}
function ansehen(j,wahl=null){
 const quotes=j.angebote();
 const karte=Karte.auswerten(j.ansicht(),j.zustandReferenz(),j.weltReferenz(),quotes);
 return Flotte.auswerten(karte.schiffe,quotes,wahl,
  j.weltReferenz().bericht(j.zustandReferenz()).schiffe);
}
test('S2: keine Fremdschiffe, keine Phantomaktionen, leerer Start bleibt lese- und save-neutral',()=>{
 const j=starten(),save=j.exportieren(),leer=ansehen(j);
 assert.deepEqual(leer.schiffe,[]);
 assert.deepEqual(leer.aktionen,[]);
 assert.equal(leer.auswahlId,null);
 const npc=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner!=='house');
 assert.ok(npc);
 assert.deepEqual(Flotte.auswerten([{...npc,ort:'NPC-Ort'}],
  [{id:'freight-'+npc.id,ok:true}],npc.id).schiffe,[]);
 assert.equal(j.ausfuehren('freight-'+npc.id).ok,false);
 assert.equal(j.exportieren(),save);
});
test('S2: Eigenminer kann nur Originalförderung starten und pausieren',()=>{
 const j=starten();befehl(j,'buy-st_aldera-miner');
 const miner=j.ansicht().schiffe.find(sh=>sh.klasse==='miner');
 const vor=j.exportieren(),m=ansehen(j,miner.id);
 assert.equal(m.auswahlId,miner.id);
 assert.equal(m.schiff.buchwert,600);
 assert.deepEqual(m.aktionen.map(a=>a.id),['ice-'+miner.id]);
 assert.equal(m.aktionen[0].ok,j.angebote().find(a=>a.id==='ice-'+miner.id).ok);
 assert.equal(j.exportieren(),vor);
 befehl(j,'ice-'+miner.id);
 const laeuft=ansehen(j,miner.id);
 assert.equal(laeuft.schiff.auftrag,'Eisförderung');
 assert.equal(laeuft.aktionen.length,1);
 assert.equal(laeuft.aktionen[0].id,'stop-'+miner.id);
 assert.equal(laeuft.aktionen[0].ok,true);
 befehl(j,'stop-'+miner.id);
 assert.equal(ansehen(j,miner.id).schiff.auftrag,'Kein laufender Wirtschaftsauftrag');
 assert.deepEqual(Audit.pruefen(j.weltReferenz(),j.zustandReferenz()),[]);
});
test('S2: eigener Frachter – Quote und Sperre bei Hin-/Rückfahrt, Save/Load und Referenzhash',()=>{
 function replay(){
  const j=starten();
  befehl(j,'buy-st_aldera-miner');befehl(j,'buy-st_aldera-frachter');
  const miner=j.ansicht().schiffe.find(sh=>sh.klasse==='miner');
  const frachter=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter');
  const vor=ansehen(j,frachter.id);
  assert.equal(vor.auswahlId,frachter.id);
  assert.equal(vor.aktionen.some(q=>q.id==='reposition-'+frachter.id),false,
   'Starterfrachter ist keine überführbare Nadir-Werfthülle');
  assert.equal(vor.aktionen.find(q=>q.id==='freight-'+frachter.id)?.ok,
   j.angebote().find(q=>q.id==='freight-'+frachter.id).ok);
  befehl(j,'ice-'+miner.id);j.weiterspielen(60);j.weiterspielen(60);
  befehl(j,'freight-'+frachter.id);
  for(const [phase,hash] of [
   ['Hinfahrt','30a46fa2f3f3a2e3'],
   ['Rückfahrt','f64b8006ce6ce88f']
  ]){
   const vorher=j.exportieren(),p=ansehen(j,frachter.id);
   assert.match(p.schiff.auftrag,new RegExp('Eisfracht · '+phase));
   assert.equal(p.aktionen.find(q=>q.id==='freight-'+frachter.id).ok,false);
   assert.equal(p.aktionen.find(q=>q.id==='freight-'+frachter.id).grund,
    j.angebote().find(q=>q.id==='freight-'+frachter.id).reason);
   assert.equal(j.ansicht().hash,hash);
   assert.equal(j.exportieren(),vorher);
   assert.equal(j.ausfuehren('freight-'+frachter.id).ok,false);
   assert.equal(j.exportieren(),vorher);
   j.weiterspielen(60);
  }
  const fertig=ansehen(j,frachter.id),s=j.zustandReferenz(),json=j.exportieren();
  assert.equal(fertig.schiff.auftrag,'Kein laufender Wirtschaftsauftrag');
  assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
  assert.deepEqual(Audit.pruefen(j.weltReferenz(),s),[]);
  assert.deepEqual([j.ansicht().weltgeld,s.minted,s.burned],[33000,0,0]);
  assert.deepEqual([s.kanon.spielerFrachten.gebuehr,s.kanon.spielerFrachten.lohn],[240,120]);
  const neu=J8.erstellen();neu.oeffnen204(json,true);
  assert.equal(neu.exportieren(),json);
  assert.deepEqual(ansehen(neu,frachter.id),fertig);
  assert.equal(ansehen(j,'entfernt').auswahlId,miner.id,'alte UI-Wahl wird verworfen');
  assert.equal(j.exportieren(),json);
  return json;
 }
 assert.equal(replay(),replay());
});
test('S2: Überführungskosten stammen ausschließlich aus der übergebenen Original-Quote',()=>{
 const schiff={id:'eigene-werft-huelle',owner:'house',name:'Frachter',
   klasse:'frachter',ort:'Nadir',ladung:'leer',buchwert:750,auftrag:null};
 const ohne=Flotte.auswerten([schiff],[],schiff.id);
 assert.deepEqual(ohne.aktionen,[]);
 const sperre=Flotte.auswerten([schiff],[
  {id:'reposition-'+schiff.id,ok:false,reason:'Strecke bereits belegt'}
 ],schiff.id);
 assert.deepEqual(sperre.aktionen.map(a=>[a.ok,a.grund,a.kosten,a.minuten]),
  [[false,'Strecke bereits belegt',null,null]]);
 const mitOriginalquote=Flotte.auswerten([schiff],[
  {id:'reposition-'+schiff.id,ok:true,kosten:40,minuten:60}
 ],schiff.id);
 assert.deepEqual([mitOriginalquote.aktionen[0].kosten,mitOriginalquote.aktionen[0].minuten],[40,60]);
 // This test is a pure UI-contract fixture, NOT proof that such a real ferry is currently available.
});

test('S2: tatsächlich gebaute Werfthülle mit rechtmäßig bezahlter W5ac-Überführung',()=>{
 const j=starten(),w=j.weltReferenz(),s=j.zustandReferenz();
 // Reuse the existing audited S02 configuration from p3-industrie.test.mjs.
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 for(let i=0;i<5;i++)j.weiterspielen(60);
 befehl(j,'buy-st_nadir-frachter');
 const ship=Object.values(j.zustandReferenz().ships).find(sh=>
  sh.owner==='house'&&sh.system==='nadir'&&j.zustandReferenz().w5.schiffIds.includes(sh.id));
 assert.ok(ship,'Nur eine wirklich bezahlte W5-Hülle eignet sich für die Prüfung');
 const cmd='reposition-'+ship.id;
 let quote=j.angebote().find(q=>q.id===cmd);
 for(let i=0;i<24&&!quote?.ok;i++){
  const blocked=ansehen(j,ship.id).aktionen.find(a=>a.id===cmd);
  assert.equal(blocked?.ok,false);
  assert.equal(blocked.grund,quote?.reason,'Originalsperre nicht übermalen');
  j.weiterspielen(60);quote=j.angebote().find(q=>q.id===cmd);
 }
 assert.equal(quote?.ok,true,quote?.reason);
 const cash=j.zustandReferenz().owners.house.cash,saved=j.exportieren();
 const bereit=ansehen(j,ship.id);
 const angebot=bereit.aktionen.find(a=>a.id===cmd);
 assert.equal(angebot?.ok,true);
 assert.deepEqual([angebot.kosten,angebot.minuten],[quote.kosten,quote.minuten]);
 assert.equal(j.exportieren(),saved,'Bereitstellung ist nur eine lesende Auswahl');
 befehl(j,cmd);
 const active=j.zustandReferenz().w5ac.active;
 assert.equal(active.id,ship.id);
 assert.equal(active.owner,'house');
 assert.equal(j.zustandReferenz().owners.house.cash,cash-quote.kosten);
 const unterwegs=ansehen(j,ship.id);
 assert.equal(unterwegs.schiff.auftrag,'Bezahlte Überführung');
 const während=j.exportieren(),resume=J8.erstellen();resume.oeffnen204(während,true);
 assert.deepEqual(ansehen(resume,ship.id),unterwegs);
 assert.equal(resume.exportieren(),während);
 assert.equal(j.ausfuehren(cmd).ok,false,'Doppelüberführung gesperrt');
 assert.equal(j.exportieren(),während);
 let rest=active.minuten;
 while(rest>0){const min=rest>=60?60:rest>=10?10:1;j.weiterspielen(min);rest-=min;}
 const end=j.zustandReferenz();
 assert.equal(end.ships[ship.id].system,'aldera');
 assert.ok(end.w5ac.completed.some(x=>x.id===ship.id&&x.owner==='house'&&x.kosten===quote.kosten));
 assert.deepEqual(Audit.pruefen(w,end),[]);
 assert.deepEqual([j.ansicht().weltgeld,end.minted,end.burned],[33000,0,0]);
 assert.equal(ansehen(j,ship.id).schiff.auftrag,'Kein laufender Wirtschaftsauftrag');
});

test('S2: Stilllegung ist ein Original-Berichtswert und keine angenommene Schiffphase',()=>{
 const id='eigener-verbrauchter-frachter';
 const beispiel={id,owner:'house',klasse:'frachter',name:'Frachter',ort:'Am Dock · Aldera',
  phase:'dock',flug:'angedockt',ladung:'leer',auftrag:null,buchwert:0};
 const gesperrt=Flotte.auswerten([beispiel],[
  {id:'freight-'+id,ok:false,reason:'K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen'}
 ],id,[{id,stillgelegt:true,buchwert:0}]);
 assert.equal(gesperrt.schiff.phase,'dock','Stilllegung ändert nicht künstlich den Original-Dockstatus');
 assert.equal(gesperrt.schiff.stillgelegt,true);
 assert.deepEqual(gesperrt.aktionen.map(a=>[a.ok,a.grund]),[
  [false,'K1: Hülle ist verbraucht und stillgelegt; Ersatz kaufen']]);
 // Synthetic projection only; the independent original-Core stilllegung test remains a separate gate.
});
