import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {w5hSitzung,w5hSicht} from '../prototypes/w5-welt/m_ui_w5h_core.mjs';
import {DATENBANK,SLOT,laden,sichern} from '../prototypes/w5-welt/m_ui_w5h_speicher.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
test('W5h UI: ein Core, hundert unveränderte Projektionen und echter Geld-/Warenstatus',()=>{
 const s=w5hSitzung(api);
 const h=api.hash(s.lesen());
 for(let i=0;i<100;i++){
   const v=w5hSicht(api,s.lesen());
   assert.equal(v.version,'W5hSichtV1');
   assert.equal(v.w5h.regel,25);
   assert.equal(v.w5h.grosshandel.gekauft,0);
   assert.equal(v.w5h.grosshandel.exportCash,20000);
   assert.equal(v.w5h.hersteller.fabrikmarge,-1388);
   assert.equal(v.audit.ok,true);
   assert.equal(v.hash,h);
 }
 assert.equal(api.hash(s.lesen()),h);
 s.schritt(60);
 assert.notEqual(api.hash(s.lesen()),h);
});
test('W5h UI: eigenständiger Slot, keine alte Forschungs- oder Hauptspeicherung',()=>{
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5h');
 assert.equal(SLOT,'regel25-ersatz-vollkosten-v1');
 assert.notEqual(DATENBANK,'aphros-void');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5g');
 const s=w5hSitzung(api),before=s.export(),h=api.hash(s.lesen());
 assert.throws(()=>s.import(api.save(api.createW5GState(42))),/inkompatibel/);
 assert.throws(()=>s.import('invalid'));
 assert.equal(api.hash(s.lesen()),h);
 assert.equal(s.export(),before);
 assert.throws(()=>s.neu(-1));
 assert.throws(()=>s.schritt(1440));
 assert.equal(s.export(),before);
});
test('W5h UI: eigene Seite und Core-Buchungen statt UI-Geldmutationen',()=>{
 const page=readFileSync(new URL('../prototypes/w5-welt/w5h.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5h.mjs',import.meta.url),'utf8');
 for(const action of ['frachter','transport','raffinerie','bauteile','jaegerbau',
   'jagd','piratenkauf','ersatz','laserkauf'])
   assert.match(page,new RegExp('data-aktion="'+action+'"'));
 assert.match(page,/w5h.mjs/);
 assert.match(js,/api\.loadW5H/);
 assert.match(js,/w5hSitzung/);
 assert.match(js,/w5h\.grosshandel\.gekauft/);
 assert.doesNotMatch(js,/owners\.[\w.]+\.cash\s*[+-]=/);
 assert.doesNotMatch(js,/state\.minted\s*[+]=/);
});
test('W5h UI: optimistisches CAS stoppt paralleles Überschreiben',async()=>{
 const value=new Map();
 const mock={
   open(){
     const db={close(){},objectStoreNames:{contains:()=>true},
       transaction(_store,mode){
         const t={objectStore(){return {
           get(key){const req={};queueMicrotask(()=>{
             req.result=value.get(key);req.onsuccess?.();
             if(mode==='readonly')queueMicrotask(()=>t.oncomplete?.());
           });return req},
           put(v,key){value.set(key,v);queueMicrotask(()=>t.oncomplete?.())}
         }},abort(){queueMicrotask(()=>t.onabort?.())}};
         return t;
       }};
     const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;
   },
 };
 assert.equal(await laden(mock),undefined);
 await sichern('s1',undefined,mock);
 assert.equal(await laden(mock),'s1');
 await assert.rejects(sichern('nope',undefined,mock),/anderen Tab/);
 assert.equal(await laden(mock),'s1');
 await sichern('s2','s1',mock);
 assert.equal(await laden(mock),'s2');
});
