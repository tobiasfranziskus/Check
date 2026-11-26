'use strict';
// Trusted test preparation only. Never include these commands, saves or audits in a model request.
// No direct state writes: standard career, original manager commands, regular JSON import.
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const J8=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const {engpassNach48}=require('../tests/m4-u5-engpass-ablauf.cjs');
const SLOT='aphros-void:spielerkarriere:regel204:v1';
const IDS=Object.freeze({B:'B-fleet-start',C:'C-first-paid-trip',D:'D-original-storage-block',E:'E-second-paid-trip',F:'F-active-freight'});
function prepare(module){
 if(!Object.hasOwn(IDS,module))throw Error('Unsupported prepared module');
 let j;
 if(module==='D')j=engpassNach48();
 else{
  j=J8.erstellen();
  j.starten195(W5.create(42,'private195').export(),true);
  const book=id=>{assert.equal(j.ausfuehren(id).ok,true,'Preparation command rejected: '+id);};
  book('buy-st_aldera-miner');book('buy-st_aldera-frachter');
  if(module!=='B'){
   book('ice-sh002');j.weiterspielen(60);j.weiterspielen(60);
   book('freight-sh003');
   if(module!=='F'){
    j.weiterspielen(60);j.weiterspielen(60);
    assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
    if(module==='E'){book('freight-sh003');j.weiterspielen(60);j.weiterspielen(60);}
   }
  }
 }
 const w=j.weltReferenz(),s=j.zustandReferenz(),json=j.exportieren(),hash=j.ansicht().hash;
 assert.equal(s.rulesVersion,204);assert.equal(s.schema,8);
 assert.equal(s.kanon.piraten,undefined);
 assert.deepEqual(pruefen(w,s),[]);
 const copy=J8.erstellen();copy.oeffnen204(json,true);
 assert.equal(copy.exportieren(),json);assert.equal(copy.ansicht().hash,hash);
 const fleet=Object.values(s.ships).filter(sh=>sh.owner==='house');
 const fees=s.kanon.spielerFrachten.gebuehr, cash=s.owners.house.cash;
 const expect={B:[0,1650,0,2],C:[240,2028,240,2],D:[6300,12263,11520,4],E:[360,2310,480,2],F:[120,1659,0,2]};
 assert.deepEqual([s.tick,cash,fees,fleet.length],expect[module]);
 if(module==='D'){
  assert.equal(hash,'f63f2cd09ba5a88c');
  assert.equal(j.angebote().find(a=>a.id==='freight-sh003').ok,false);
  assert.equal(j.angebote().find(a=>a.id==='freight-sh003').reason,'Eislager Nadir voll');
 }
 return {id:IDS[module],hash,sha256:createHash('sha256').update(json).digest('hex'),json};
}
async function importPrepared(page,fixture){
 // This hook runs before the tester's clock and first observation, in a fresh context.
 // Load through the real file input; never inject or write localStorage.
 await page.waitForURL('**/prototypes/spiel/index.html');
 if(await page.evaluate(key=>localStorage.getItem(key),SLOT)!==null)throw Error('Prepared import requires empty career slot');
 await page.locator('#import-datei').setInputFiles({name:'test-career.json',mimeType:'application/json',buffer:Buffer.from(fixture.json)});
 await page.locator('#manager-transport-status').waitFor({state:'visible'});
 await page.waitForFunction(({key,json})=>localStorage.getItem(key)===json,{key:SLOT,json:fixture.json});
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),SLOT),fixture.json);
}
module.exports={prepare,importPrepared,IDS,SLOT};
