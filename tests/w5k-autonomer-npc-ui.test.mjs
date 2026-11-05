import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {w5kSitzung,w5kSicht,w5kStand} from '../prototypes/w5-welt/m_ui_w5k_core.mjs';
import {laden,sichern,DATENBANK,SLOT} from '../prototypes/w5-welt/m_ui_w5k_speicher.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);

test('W5k UI: 100 read-only snapshots, original W2-owned miner and real NPC mining income',()=>{
 const session=w5kSitzung(api);
 const h=api.hash(session.lesen());
 for(let i=0;i<100;i++){
   const v=w5kSicht(api,session.lesen());
   assert.equal(v.version,'W5kSichtV1');
   assert.equal(v.w5k.npcAuftrag,'foerdern');
   assert.equal(v.w5k.npcErzverkaeufe,0);
   assert.equal(v.w5k.houseErzverkaeufe,0);
   assert.equal(v.w5k.houseAuftrag,'noch nicht gekauft');
   assert.equal(v.w5k.npcErloese,0);
   assert.equal(v.w5k.jaegerGekauft,0);
   assert.equal(v.w5k.minted,0);
   assert.equal(v.hash,h);
   assert.equal(v.audit.ok,true);
 }
 assert.equal(api.hash(session.lesen()),h,'no UI side effects');
 session.schritt(60);
 assert.equal(w5kStand(api,session.lesen()).npcErzverkaeufe,1);
 assert.equal(w5kStand(api,session.lesen()).npcErloese,500);
 assert.equal(api.audit(session.lesen()).ok,true);
});
test('W5k UI: no House pause, no fake NPC commands, no new economic controls',()=>{
 const html=readFileSync(new URL('../prototypes/w5-welt/w5k.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5k.mjs',import.meta.url),'utf8');
 assert.match(html,/data-aktion="minerN"/);
 assert.match(html,/data-aktion="minerA"/);
 assert.match(html,/data-aktion="transport"/);
 assert.match(html,/w5k-vergleich/);
 assert.match(html,/w5k\.mjs/);
 for(const disallowed of ['npcPause','housePause','npcMine']){
   assert.doesNotMatch(html,new RegExp('data-aktion="'+disallowed+'"'));
   assert.doesNotMatch(js,new RegExp("case '"+disallowed+"'"));
 }
 assert.doesNotMatch(js,/type:'shipWait'/);
 assert.doesNotMatch(js,/owner:'npc3',schiff:.*ware:'erz'/);
 assert.match(js,/api\.loadW5I/);
 assert.match(js,/w5kSicht/);
 assert.doesNotMatch(js,/owners\.[\w.]+\.cash\s*[+-]=/);
});
test('W5k UI: separated owner-safe CAS-Slot, no W5i/W5j/main overwrites',()=>{
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5k');
 assert.equal(SLOT,'regel26-autonomer-npc-markteintritt-v1');
 for(const old of ['aphros-void','aphros-void-forschungswelt-w5i',
   'aphros-void-forschungswelt-w5j'])assert.notEqual(DATENBANK,old);
 const s=w5kSitzung(api),before=s.export();
 assert.throws(()=>s.import(api.save(api.createW5HState(42))),/inkompatibel/);
 assert.throws(()=>s.import('{bad'),/JSON|Unexpected|Format|Ungültig|Syntax/);
 assert.equal(s.export(),before);
 assert.throws(()=>s.neu(-1));
 assert.throws(()=>s.schritt(1440));
 assert.equal(api.hash(api.loadW5I(before)),api.hash(s.lesen()));
});
test('W5k UI: rejects stale CAS to protect simultaneous research tabs',async()=>{
 const store=new Map();
 const mock={open(){
   const db={close(){},objectStoreNames:{contains:()=>true},transaction(_name,mode){
     const tx={objectStore(){return {
       get(key){const req={};queueMicrotask(()=>{
         req.result=store.get(key);req.onsuccess?.();
         if(mode==='readonly')queueMicrotask(()=>tx.oncomplete?.());
       });return req;},
       put(data,key){store.set(key,data);queueMicrotask(()=>tx.oncomplete?.());}
     };},abort(){queueMicrotask(()=>tx.onabort?.());}};
     return tx;
   }};
   const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;
 }};
 assert.equal(await laden(mock),undefined);
 await sichern('first',undefined,mock);
 assert.equal(await laden(mock),'first');
 await assert.rejects(sichern('wrong',undefined,mock),/anderen Tab/);
 assert.equal(await laden(mock),'first');
 await sichern('second','first',mock);
 assert.equal(await laden(mock),'second');
});
