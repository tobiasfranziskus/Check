import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),J8=require('../prototypes/verbund/konzern-session.js'),
 O=require('../prototypes/w5ac/session.js'),P=require('../prototypes/spiel/jaeger-projekt.js');
const start=()=>{const j=J8.erstellen();j.starten195(O.create(42,'private195').export(),true);return j;};
// Independent conservation counts, in addition to the original core audit.
function audit(j){
 const s=j.zustandReferenz();
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const [ware,l] of Object.entries(s.ledger)){
  const lager=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0);
  const ladung=Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
  assert.equal(l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,lager+ladung,ware);
 }
 const own=Object.values(s.ships).filter(sh=>sh.owner==='house');
 for(const sh of own.filter(sh=>sh.klasse==='frachter'))assert.ok(s.kanon.spielerFrachterKaeufe.some(k=>k.id===sh.id&&k.preis===750));
 assert.equal(own.filter(sh=>sh.klasse==='jaeger').length,s.kanon.jaeger.kaeufe.length);
 assert.equal(j.flugAudit().ok,true);
 const loaded=J8.erstellen();loaded.oeffnen204(j.exportieren(),true);
 assert.equal(loaded.exportieren(),j.exportieren());
}
const offer=(j,id)=>P.erstellen(j).gruppen.flatMap(g=>g.angebote).find(a=>a.id===id);
function action(j,id){assert.equal(offer(j,id)?.ok,true,id);assert.equal(j.ausfuehren(id).ok,true);audit(j);}
test('J13b: actual original offers, live financial gap and all foreign production rights',()=>{
 const j=start(),before=j.exportieren(),p=P.erstellen(j);
 assert.equal(p.aldera.kasse,1000);assert.equal(p.aldera.erzkauf,500);assert.equal(p.aldera.fehlend,0);
 assert.equal(p.sperren.length,4);for(const s of p.sperren){assert.equal(s.ok,false,s.titel);assert.ok(s.grund);}
 assert.equal(offer(j,'buy-st_nadir-miner').ok,false);
 assert.equal(p.silizium.eigeneVerkaeufe,0);
 assert.equal(j.exportieren(),before,'original clones for all probes; no bookings');
 for(const id of ['industrialOreOffer','stationRefine','stationBuildParts','stationBuildFighter'])assert.equal(j.ausfuehren(id).ok,false);
 assert.equal(j.exportieren(),before);audit(j);
});
test('J13b: project orders reproduce funded ice/F4 route, without claiming fighter production',()=>{
 const j=start();action(j,'buy-st_aldera-frachter');action(j,'buy-st_aldera-miner');
 const s=j.zustandReferenz(),f=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter'),m=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
 assert.equal(s.owners.house.cash,1650);assert.equal(offer(j,'freight-'+f.id).ok,false);
 action(j,'ice-'+m.id);
 for(let i=0;i<2;i++){j.weiterspielen(60);audit(j);}
 action(j,'freight-'+f.id);
 const transit=j.exportieren(),reload=J8.erstellen();reload.oeffnen204(transit,true);
 for(let i=0;i<2;i++){j.weiterspielen(60);reload.weiterspielen(60);audit(j);}
 assert.equal(j.exportieren(),reload.exportieren());
 const end=j.zustandReferenz();assert.equal(end.kanon.spielerFrachten.lohn,120);assert.equal(end.kanon.spielerFrachten.gebuehr,240);
 assert.equal(j.ansicht().hash,'e4514490aedc13bd','unchanged original J11 reference');
 assert.equal(end.kanon.jaeger.fertig,0);assert.equal(end.kanon.bauteile.bauteile,0);
 assert.equal(P.erstellen(j).silizium.eigeneVerkaeufe,0);
});
test('J13b: missing finance and foreign signatures fail atomically in the original core',()=>{
 const j=start(),w=j.weltReferenz(),initial=j.exportieren();
 for(const type of ['industrialOreAcceptMine','industrialOreAcceptFreight','industrialOreAcceptYard','industrialOreCommit']){
  const s=w.load(initial),before=w.save(s);assert.equal(w.execute(s,{type,owner:'house'}).ok,false);assert.equal(w.save(s),before);
 }
 for(const type of ['stationBuildParts','stationBuildFighter','stationRefine']){
  const s=w.load(initial),before=w.save(s);assert.equal(w.execute(s,{type,owner:'house',station:'st_nadir'}).ok,false);assert.equal(w.save(s),before);
 }
 // Deliberate negative fixture, never a valid career or a funding solution.
 const poor=w.load(initial);poor.owners.st_aldera.cash+=poor.owners.house.cash;poor.owners.house.cash=0;
 const before=JSON.stringify(poor);
 assert.equal(w.execute(poor,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'}).ok,false);
 assert.equal(JSON.stringify(poor),before);
 assert.equal(j.exportieren(),initial);audit(j);
});
