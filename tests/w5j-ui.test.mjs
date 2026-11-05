import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {w5jSitzung,w5jSicht,w5jNachfrage} from '../prototypes/w5-welt/m_ui_w5j_core.mjs';
import {laden,sichern,DATENBANK,SLOT} from '../prototypes/w5-welt/m_ui_w5j_speicher.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
test('W5j UI: 100 rein lesende Statusprojektionen ohne eigene Simulationsregel',()=>{
 const s=w5jSitzung(api),old=api.hash(s.lesen());
 for(let n=0;n<100;n++){
   const v=w5jSicht(api,s.lesen());
   assert.equal(v.version,'W5jSichtV1');
   assert.equal(v.w5i.limit,50);
   assert.equal(v.w5j.anfang,2400);
   assert.equal(v.w5j.frei,2400);
   assert.equal(v.w5j.einahmen,0);
   assert.equal(v.w5j.ausgaben,0);
   assert.equal(v.w5j.bilanziert,true);
   assert.equal(v.w5j.bezahlbar,false);
   assert.equal(v.audit.ok,true);
   assert.equal(v.hash,old);
 }
 assert.equal(api.hash(s.lesen()),old);
 s.schritt(60);assert.notEqual(api.hash(s.lesen()),old);
 assert.equal(w5jNachfrage(api,s.lesen()).bilanziert,true);
});
test('W5j UI: fremde Spielstaende und eigenstaendige CAS-Datenbank',()=>{
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5j');
 assert.equal(SLOT,'regel26-npc-bergbaueinnahmen-drittjaeger-v1');
 assert.notEqual(DATENBANK,'aphros-void');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5i');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5h');
 const s=w5jSitzung(api),before=s.export(),hash=api.hash(s.lesen());
 assert.throws(()=>s.import(api.save(api.createW5HState(42))),/inkompatibel/);
 assert.throws(()=>s.import('invalid'));
 assert.equal(s.export(),before);assert.equal(api.hash(s.lesen()),hash);
 assert.throws(()=>s.neu(-1));
 assert.throws(()=>s.schritt(1440));
});
test('W5j UI: separate Owner-Befehle, keine eigenen Geld- oder W5i-Buchungen',()=>{
 const page=readFileSync(new URL('../prototypes/w5-welt/w5j.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5j.mjs',import.meta.url),'utf8');
 for(const act of ['npcPause','housePause','npcMine','erz','transport',
   'silizium','raffinerie','bauteile','jaegerbau','jaegerkauf'])
   assert.match(page,new RegExp('data-aktion="'+act+'"'));
 assert.match(page,/w5j.mjs/);
 assert.match(page,/w5j-nachfrage/);
 assert.match(js,/type:'shipWait',owner:'house'/);
 assert.match(js,/type:'shipMine',owner:'npc3'/);
 assert.match(js,/w5jSitzung/);
 assert.match(js,/api\.loadW5I/);
 assert.doesNotMatch(js,/owners\.[\w.]+\.cash\s*[+-]=/);
 assert.doesNotMatch(js,/state\.minted\s*[+]=/);
});
test('W5j UI: CAS-Save überschreibt keine Änderungen eines anderen Tabs',async()=>{
 const data=new Map(),fake={open(){
   const db={close(){},objectStoreNames:{contains:()=>true},transaction(_name,mode){
     const tx={objectStore(){return {
       get(key){const req={};queueMicrotask(()=>{
         req.result=data.get(key);req.onsuccess?.();
         if(mode==='readonly')queueMicrotask(()=>tx.oncomplete?.());
       });return req},
       put(raw,key){data.set(key,raw);queueMicrotask(()=>tx.oncomplete?.())}
     };},abort(){queueMicrotask(()=>tx.onabort?.())}};
     return tx;
   }};
   const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;
 }};
 assert.equal(await laden(fake),undefined);
 await sichern('valid','',fake).then(()=>assert.fail('wrong CAS'),()=>{});
 assert.equal(await laden(fake),undefined);
 await sichern('r1',undefined,fake);
 assert.equal(await laden(fake),'r1');
 await assert.rejects(sichern('wrong',undefined,fake),/anderen Tab/);
 assert.equal(await laden(fake),'r1');
 await sichern('r2','r1',fake);assert.equal(await laden(fake),'r2');
});
