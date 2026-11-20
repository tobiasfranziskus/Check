// M1/M2: direct mining + freight manager controls from original legal J8 offers.
// No manual cockpit, second scheduler, inventory creation, fake buyers or new saves.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const Manager=require('../prototypes/spiel/p3-manager-disposition.js');
const W6=require('../tools/w6-szenarien.cjs');
const start=()=>{const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);return j;};
function show(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),saved=j.exportieren(),hash=j.ansicht().hash;
 const result=Manager.auswerten(w,s,j.angebote());
 assert.equal(j.exportieren(),saved,'read-only manager offers cannot book money or stock');
 assert.equal(j.ansicht().hash,hash,'read-only manager offers cannot advance the world');
 return result;
}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),saved=j.exportieren();
 assert.equal(w.audit(s).ok,true);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const clone=J8.erstellen();clone.oeffnen204(saved,true);
 assert.equal(clone.exportieren(),saved,'manager purchases and orders must survive cold Save/Load');
 assert.equal(clone.ansicht().hash,j.ansicht().hash);
}
test('Manager: finance real miner, carrier, ice and roundtrip without a pilot',()=>{
 const run=()=>{
  const j=start(),initial=show(j),history=[];
  assert.equal(initial.hausKasse,3000);
  assert.equal(initial.minerAnzahl,0);assert.equal(initial.frachterAnzahl,0);
  assert.equal(initial.abbau.aktion,'buy-st_aldera-miner');
  assert.equal(initial.transport.aktion,'buy-st_aldera-frachter');
  assert.equal(initial.abbau.bereit,true);
  assert.equal(initial.transport.bereit,true);
  assert.equal(initial.eisLager,0);
  assert.equal(initial.eisCharge,50);
  const doIt=choice=>{
   assert.equal(choice.bereit,true,choice.grund);
   const original=j.angebote().find(a=>a.id===choice.aktion);
   assert.equal(original?.ok,true,'disposition cannot suggest a non-original legal offer');
   const out=j.ausfuehren(choice.aktion);
   assert.equal(out.ok,true,JSON.stringify(out));
   history.push(choice.aktion);
   audit(j);
  };
  doIt(initial.abbau);
  let p=show(j);
  assert.equal(p.minerAnzahl,1);
  assert.equal(p.transport.aktion,'buy-st_aldera-frachter');
  doIt(p.transport);
  p=show(j);
  assert.equal(p.hausKasse,1650);
  assert.equal(p.abbau.aktion.startsWith('ice-'),true);
  assert.equal(p.abbau.bereit,true);
  doIt(p.abbau);
  p=show(j);
  assert.equal(p.minerAktiv,1);
  assert.equal(p.abbau.bereit,false,'already working miner is not restarted');
  assert.match(p.abbau.grund,/läuft bereits/);
  assert.equal(j.pilotStatus(),null,'manager orders require no cockpit');
  j.weiterspielen(60);j.weiterspielen(60);
  audit(j);
  p=show(j);
  assert.ok(p.eisLager>=50,'physical ice stock must be mined before freight');
  assert.ok(p.transport.aktion.startsWith('freight-'));
  doIt(p.transport);
  p=show(j);
  assert.equal(p.frachtOffen,1);
  assert.equal(p.frachtAbgeschlossen,0,'accepting a contract is not completing delivery');
  j.weiterspielen(60);j.weiterspielen(60);
  audit(j);
  p=show(j);
  assert.equal(p.frachtOffen,0);
  assert.equal(p.frachtAbgeschlossen,1);
  assert.equal(p.frachtGebuehrBisher,240);
  assert.equal(p.frachtLohnBisher,120);
  assert.equal(j.pilotStatus(),null);
  return {save:j.exportieren(),hash:j.ansicht().hash,history};
 };
 const a=run(),b=run();
 assert.equal(a.save,b.save,'all manager decisions must replay identically');
 assert.equal(a.hash,b.hash);
 assert.deepEqual(a.history,b.history);
});
test('Manager: no imaginary spare carrier, original refusal and read-only projection',()=>{
 const j=start();
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 j.weiterspielen(60); // NPC took the only initial Aldera carrier.
 const previous=j.exportieren(),hash=j.ansicht().hash,view=show(j);
 assert.equal(view.abbau.bereit,true,'own miner can still request original work');
 assert.equal(view.transport.aktion,'buy-st_aldera-frachter');
 assert.equal(view.transport.bereit,false);
 assert.equal(view.transport.grund,'kein Komplettschiff auf Lager');
 assert.equal(j.exportieren(),previous);
 assert.equal(j.ansicht().hash,hash);
 assert.equal(j.ausfuehren('buy-st_aldera-frachter').ok,false);
 assert.equal(j.exportieren(),previous);
 audit(j);
});
test('Manager: DOM uses exactly two read-only cards and original J8 submit path',()=>{
 const html=readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const adapter=readFileSync(new URL('../prototypes/spiel/p3-manager-disposition.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../prototypes/spiel/spiel.css',import.meta.url),'utf8');
 for(const id of ['manager-disposition','manager-disposition-kassen','manager-abbau-status',
   'manager-abbau-aktion','manager-abbau-grund','manager-transport-status',
   'manager-transport-aktion','manager-transport-grund']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/<script src="p3-manager-disposition\.js"><\/script>/);
 assert.match(js,/managerDispositionAnzeigen\(s,alleAngebote\)/);
 assert.match(js,/managerDispositionsAuftrag\('abbau'\)/);
 assert.match(js,/managerDispositionsAuftrag\('transport'\)/);
 assert.match(js,/auftrag\(choice\.aktion\)/,'all clicks pass through existing J8 core validation');
 assert.match(css,/\.manager-disposition-card button\{width:100%;min-height:48px/);
 assert.doesNotMatch(adapter,/\.execute\(|\.advance\(|\.save\(|\.load\(|setItem\(|localStorage|\.cash\s*[+\-]?=/,
   'read-only view must not run or mutate the original world');
});
