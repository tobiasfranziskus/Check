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
 const fees=s.kanon.spielerFrachten?.gebuehr??0, cash=s.owners.house.cash;
 const expect={B:[0,1650,0,2],C:[240,2028,240,2],D:[6300,12263,11520,4],E:[360,2310,480,2],F:[120,1659,0,2]};
 assert.deepEqual([s.tick,cash,fees,fleet.length],expect[module]);
 if(module==='D'){
  assert.equal(hash,'f63f2cd09ba5a88c');
  assert.equal(j.angebote().find(a=>a.id==='freight-sh003').ok,false);
  assert.equal(j.angebote().find(a=>a.id==='freight-sh003').reason,'Eislager Nadir voll');
 }
 return {id:IDS[module],hash,sha256:createHash('sha256').update(json).digest('hex'),json};
}

const SLOT208='aphros-void:spielerkarriere:regel208:v1';
const IDS208=Object.freeze(Object.fromEntries(Object.entries(IDS).map(([m,id])=>[m,'rule208-'+id])));
const EXPECT208=Object.freeze({
 B:[0,1650,0,2,'0b8d4e1a126c2742'],
 C:[240,2028,240,2,'bb4948516ced50cd'],
 D:[6300,12263,11520,4,'24ea9ab3cbe2e5d5'],
 E:[360,2310,480,2,'76b5c7ce0eeb400f'],
 F:[120,1659,0,2,'2939cab4414da90c']
});
// New standard career only. The historical 204 preparation above remains immutable.
// Rule208 values were independently reproduced from the pinned 8607b71 product source.
function prepare208(module){
 if(!Object.hasOwn(IDS208,module))throw Error('Unsupported prepared module');
 const j=J8.erstellen();
 j.starten208(true,false);
 const book=id=>assert.equal(j.ausfuehren(id).ok,true,'Preparation command rejected: '+id);
 const advance=()=>{j.weiterspielen(60);j.weiterspielen(60);};
 book('buy-st_aldera-miner');book('buy-st_aldera-frachter');
 if(module==='D'){
  for(const id of ['ice-sh002','buy-st_aldera-miner','buy-st_aldera-miner','ore-sh004','ore-sh005'])book(id);
  let rounds=0;
  while(rounds<48&&j.zustandReferenz().tick<6300){
   const offers=j.angebote(),freight=offers.find(a=>a.id==='freight-sh003');
   if(freight?.ok){
    for(let i=0;i<(rounds<41?10:3);i++)if(!j.ausfuehren('water-pilot-house-1').ok)break;
    book(freight.id);advance();rounds++;
   }else{
    const water=offers.find(a=>a.id==='water-pilot-house-bedarf');
    if(water?.ok&&freight?.reason?.includes('Quelllager'))book(water.id);
    else j.weiterspielen(60);
   }
  }
  // Reproduced on 208, not inherited from the historical 204 hash.
  assert.equal(rounds,48);
  for(let i=0;i<6;i++)book('water-pilot-house-1');
  const offer=j.angebote().find(a=>a.id==='freight-sh003');
  assert.equal(offer.ok,false);assert.equal(offer.reason,'Eislager Nadir voll');
  assert.equal(j.zustandReferenz().stations.st_nadir.lager.eis,130);
 }else if(module!=='B'){
  book('ice-sh002');advance();book('freight-sh003');
  if(module!=='F'){
   advance();
   if(module==='E'){book('freight-sh003');advance();}
  }
 }
 const w=j.weltReferenz(),s=j.zustandReferenz(),json=j.exportieren(),hash=j.ansicht().hash;
 assert.equal(s.rulesVersion,208);assert.equal(s.schema,8);
 assert.equal(s.kanon.piraten,undefined);assert.equal(s.kanon.hausErz,undefined);
 assert.deepEqual(pruefen(w,s),[]);
 const copy=J8.erstellen();copy.oeffnen208(json,true);
 assert.equal(copy.exportieren(),json);assert.equal(copy.ansicht().hash,hash);
 assert.throws(()=>J8.erstellen().oeffnen204(json,true));
 const fleet=Object.values(s.ships).filter(sh=>sh.owner==='house');
 const fees=s.kanon.spielerFrachten?.gebuehr??0;
 assert.deepEqual([s.tick,s.owners.house.cash,fees,fleet.length,hash],EXPECT208[module]);
 return {id:IDS208[module],hash,sha256:createHash('sha256').update(json).digest('hex'),json};
}
async function importPrepared(page,fixture){
 // This hook runs before the tester's clock and first observation, in a fresh context.
 // Load through the real file input; never inject or write localStorage.
 const raw=JSON.parse(fixture.json),rule=raw.rulesVersion;
 const ids=rule===204?IDS:rule===208?IDS208:null;
 if(!ids||!Object.values(ids).includes(fixture.id)||raw.schema!==8||
    createHash('sha256').update(fixture.json).digest('hex')!==fixture.sha256)
  throw Error('Prepared import requires a matching audited fixture');
 const slot=rule===208?SLOT208:SLOT,other=rule===208?SLOT:SLOT208;
 await page.waitForURL('**/prototypes/spiel/index.html');
 if(await page.evaluate(key=>localStorage.getItem(key),slot)!==null)throw Error('Prepared import requires empty career slot');
 const protectedKeys=[other,other+':vorherige',slot+':vorherige'];
 const before=await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),protectedKeys);
 await page.locator('#import-datei').setInputFiles({name:'test-career.json',mimeType:'application/json',buffer:Buffer.from(fixture.json)});
 await page.locator('#manager-transport-status').waitFor({state:'visible'});
 await page.waitForFunction(({key,json})=>localStorage.getItem(key)===json,{key:slot,json:fixture.json});
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),slot),fixture.json);
 assert.deepEqual(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),protectedKeys),before);
}
module.exports={prepare,prepare208,importPrepared,IDS,IDS208,SLOT,SLOT208};
