import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {w5iSitzung,w5iSicht} from '../prototypes/w5-welt/m_ui_w5i_core.mjs';
import {laden,sichern,DATENBANK,SLOT} from '../prototypes/w5-welt/m_ui_w5i_speicher.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
test('W5i UI: echte R26-Sitzung mit 100 read-only-Projektionen',()=>{
 const s=w5iSitzung(api),h=api.hash(s.lesen());
 for(let i=0;i<100;i++){
   const v=w5iSicht(api,s.lesen());
   assert.equal(v.version,'W5iSichtV1');
   assert.equal(v.w5h.regel,26);
   assert.equal(v.w5i.limit,50);
   assert.equal(v.w5i.house,3000);
   assert.equal(v.audit.ok,true);
   assert.equal(v.hash,h);
 }
 assert.equal(api.hash(s.lesen()),h);
 s.schritt(60);
 assert.notEqual(api.hash(s.lesen()),h);
});
test('W5i UI: eigene streng getrennte Datenbank und unvertraegliche alte Saves',()=>{
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5i');
 assert.equal(SLOT,'regel26-auftragsdeckel-und-zweitjaeger-v1');
 assert.notEqual(DATENBANK,'aphros-void');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5h');
 const s=w5iSitzung(api),raw=s.export(),h=api.hash(s.lesen());
 assert.throws(()=>s.import(api.save(api.createW5HState(42))),/inkompatibel/);
 assert.throws(()=>s.import('{broken'));
 assert.equal(api.hash(s.lesen()),h);
 assert.equal(s.export(),raw);
 assert.throws(()=>s.neu(-1));
 assert.throws(()=>s.schritt(1440));
});
test('W5i UI: echter NPC-Owner-Befehl und keine Browser-Geldbuchungen',()=>{
 const page=readFileSync(new URL('../prototypes/w5-welt/w5i.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5i.mjs',import.meta.url),'utf8');
 assert.match(page,/w5i.mjs/);
 assert.match(page,/data-aktion="npcPause"/);
 assert.match(page,/w5i-pipeline/);
 assert.match(js,/type:'shipWait',owner:'npc3'/);
 assert.match(js,/api\.loadW5I/);
 assert.match(js,/w5iSitzung/);
 assert.match(js,/view\.w5i\.offen/);
 assert.doesNotMatch(js,/owners\.[\w.]+\.cash\s*[+-]=/);
 assert.doesNotMatch(js,/state\.minted\s*[+]=/);
});
test('W5i UI: CAS-Save schützt die eigenständige Forschungsdatenbank',async()=>{
 const value=new Map(),mock={open(){
   const db={close(){},objectStoreNames:{contains:()=>true},transaction(_name,mode){
     const t={objectStore(){return {
       get(key){const req={};queueMicrotask(()=>{
         req.result=value.get(key);req.onsuccess?.();
         if(mode==='readonly')queueMicrotask(()=>t.oncomplete?.());
       });return req;},
       put(raw,key){value.set(key,raw);queueMicrotask(()=>t.oncomplete?.());}
     };},abort(){queueMicrotask(()=>t.onabort?.());}};
     return t;
   }};
   const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;
 }};
 assert.equal(await laden(mock),undefined);
 await sichern('a',undefined,mock);
 assert.equal(await laden(mock),'a');
 await assert.rejects(sichern('overwrite',undefined,mock),/anderen Tab/);
 assert.equal(await laden(mock),'a');
 await sichern('b','a',mock);
 assert.equal(await laden(mock),'b');
});
