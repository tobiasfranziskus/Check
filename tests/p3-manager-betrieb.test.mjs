// M2 operating view: actual house liquidity/book values, paid original F4
// receipts/wages, legal pause and deterministic repeated cockpit-free business.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const P3=require('../prototypes/spiel/p3-handelsweg.js');
const M2=require('../prototypes/spiel/p3-manager-disposition.js');
const W6=require('../tools/w6-szenarien.cjs');
function start(){const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);return j;}
function report(j){
 const before=j.exportieren(),hash=j.ansicht().hash,
   p=M2.auswerten(j.weltReferenz(),j.zustandReferenz(),j.angebote());
 assert.equal(j.exportieren(),before,'operating report cannot change original save');
 assert.equal(j.ansicht().hash,hash,'operating report cannot change original hash');
 return p;
}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),saved=j.exportieren();
 assert.equal(w.audit(s).ok,true);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const loaded=J8.erstellen();loaded.oeffnen204(saved,true);
 assert.equal(loaded.exportieren(),saved);
 assert.equal(loaded.ansicht().hash,j.ansicht().hash);
}
test('M2: two complete original paid ice cycles show actual receipts, wages, asset depreciation and liquidity',()=>{
 function run(){
  const j=start();
  let p=report(j);assert.equal(p.hausKasse,3000);
  assert.equal(p.anlagewert,0);assert.equal(p.verschleiss,0);
  assert.equal(p.inventarindikator,0);
  for(const id of ['buy-st_aldera-miner','buy-st_aldera-frachter']){
   const q=j.angebote().find(x=>x.id===id);
   assert.equal(q?.ok,true);
   assert.equal(j.ausfuehren(id).ok,true);
  }
  p=report(j);
  assert.equal(p.hausKasse,1650);
  assert.equal(p.anlagewert,1350);
  assert.equal(p.verschleiss,0);
  assert.equal(p.inventarindikator,0);
  assert.equal(p.aussetzen.bereit,false);
  assert.equal(j.pilotStatus(),null);
  const history=[];
  for(let step=0;step<45;step++){
   const guide=P3.auswerten(j.zustandReferenz(),j.angebote(),j.weltReferenz());
   p=report(j);
   if(p.frachtAbgeschlossen>=2)break;
   assert.equal(guide.bereit,true,guide.grund||guide.titel);
   if(guide.art==='zeit'){
    j.weiterspielen(60);history.push('tick+60');
   }else{
    const q=j.angebote().find(x=>x.id===guide.aktion);
    assert.equal(q?.ok,true);
    assert.equal(j.ausfuehren(guide.aktion).ok,true);
    history.push(guide.aktion);
   }
   audit(j);
   assert.equal(j.pilotStatus(),null);
  }
  p=report(j);
  assert.equal(p.frachtAbgeschlossen,2,'two ORIGINAL fully paid round trips');
  assert.equal(p.frachtOffen,0);
  assert.equal(p.frachtGebuehrBisher,480);
  assert.equal(p.frachtLohnBisher,240);
  assert.ok(p.anlagewert>0&&p.anlagewert<1350,'real ship usage reduces original book values');
  assert.equal(p.verschleiss,1350-p.anlagewert);
  assert.equal(p.inventarindikator,p.hausKasse+p.anlagewert-3000);
  assert.ok(history.filter(x=>x.startsWith('freight-')).length>=2);
  audit(j);
  return {report:p,save:j.exportieren(),hash:j.ansicht().hash,history};
 }
 const a=run(),b=run();
 assert.equal(a.save,b.save,'repeat of paid original business must be deterministic');
 assert.equal(a.hash,b.hash);assert.deepEqual(a.history,b.history);
});
test('M2: a running own ice pendulum offers only the legal shipShuttleStop; no phantom cancellation',()=>{
 const j=start();let p=report(j);
 assert.equal(p.aussetzen.bereit,false);
 assert.equal(p.aussetzen.aktion,null);
 assert.equal(j.ausfuehren('buy-st_aldera-miner').ok,true);
 p=report(j);
 assert.equal(p.aussetzen.bereit,false);
 const quote=j.angebote().find(x=>x.id===p.abbau.aktion);
 assert.equal(quote.ok,true);
 assert.equal(j.ausfuehren(p.abbau.aktion).ok,true);
 p=report(j);
 assert.equal(p.aussetzen.bereit,true,'only an actual running own miner is stoppable');
 assert.match(p.aussetzen.aktion,/^stop-/);
 const original=j.angebote().find(x=>x.id===p.aussetzen.aktion);
 assert.equal(original?.ok,true,'pause must be an original funded owner quote');
 assert.equal(j.ausfuehren(p.aussetzen.aktion).ok,true);
 audit(j);
 const pendel=Object.values(j.zustandReferenz().kanon.pendel||{});
 assert.ok(pendel.length===0||pendel.some(x=>x.beenden===true),
  'stopping may remain an original pending stop until the ship reaches dock');
});
test('M2: two controls reuse existing original J8 and normal +60 clock, no new monetary authority',()=>{
 const html=readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const adapter=readFileSync(new URL('../prototypes/spiel/p3-manager-disposition.js',import.meta.url),'utf8');
 for(const id of ['manager-betrieb','manager-betrieb-geld','manager-betrieb-frachten',
  'manager-betrieb-risiko','manager-zeit-aktion','manager-aussetzen-aktion','manager-aussetzen-grund'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/\$\('manager-zeit-aktion'\)\?\.addEventListener\('click'/);
 assert.match(js,/weiter\(60\)/);
 assert.match(js,/\$\('manager-aussetzen-aktion'\)\?\.addEventListener\('click'/);
 assert.match(js,/auftrag\(p\.aussetzen\.aktion\)/);
 assert.match(adapter,/w\.buchwert\(s,sh\.id\)/);
 assert.doesNotMatch(adapter,/\.execute\(|\.advance\(|\.save\(|\.load\(|setItem\(|localStorage|\.cash\s*[+\-]?=/);
});
