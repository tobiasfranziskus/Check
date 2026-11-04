import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {weltSicht} from '../prototypes/w5-welt/m_ui_welt_core.mjs';
import {w5gSitzung,w5gSicht} from '../prototypes/w5-welt/m_ui_w5g_core.mjs';
import {DATENBANK,SLOT,laden,sichern} from '../prototypes/w5-welt/m_ui_w5g_speicher.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
test('W5g UI: 100 rein lesende Welt-/Fabrikansichten verändern weder Tick noch Hash',()=>{
 const s=w5gSitzung(api,api.createW5GState(42));
 const hash=api.hash(s.lesen());
 for(let i=0;i<100;i++){
   const v=w5gSicht(api,s.lesen());
   assert.equal(v.version,'W5gSichtV1');
   assert.equal(v.w5g.hersteller.zahlungen,2288);
   assert.equal(v.w5g.hersteller.fabrikmarge,-1388);
   assert.equal(v.audit.ok,true);
   assert.equal(v.hash,hash);
 }
 assert.equal(api.hash(s.lesen()),hash);
 s.schritt(60);
 assert.notEqual(api.hash(s.lesen()),hash);
});
test('W5g UI: nur Regel24, ursprüngliche R22-/R23-Slots erhalten',()=>{
 const s=w5gSitzung(api);
 const old=s.export(),hash=api.hash(s.lesen());
 assert.throws(()=>s.import(api.save(api.createW5FState(42))),/inkompatibel/);
 assert.throws(()=>s.import(api.save(api.createW5DState(42))),/inkompatibel/);
 assert.throws(()=>s.import('kaputt/'));
 assert.equal(api.hash(s.lesen()),hash);
 assert.equal(s.export(),old);
 assert.equal(weltSicht(api,s.lesen()).version,'W5dGemeinsameWeltV1');
 assert.equal(DATENBANK,'aphros-void-forschungswelt-w5g');
 assert.equal(SLOT,'regel24-ersatz-vollkosten-v1');
 assert.notEqual(DATENBANK,'aphros-void-forschungswelt-w5f');
 assert.notEqual(DATENBANK,'aphros-void');
});
test('W5g UI: Bestellung ohne echten Verlust oder Werftbestand nicht möglich',()=>{
 const s=w5gSitzung(api),before=s.export();
 const ans=s.befehl({type:'shipReplaceFighter',owner:'npc3',station:'st_nadir'});
 assert.equal(ans.ok,false);
 assert.equal(s.export(),before);
 assert.throws(()=>s.neu(-1));
 assert.throws(()=>s.schritt(1440));
 assert.equal(s.export(),before);
});
test('W5g UI: Seite, Aktionen, Speicher-CAS und Preis-Sicht nur im Core',()=>{
 const page=readFileSync(new URL('../prototypes/w5-welt/w5g.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/w5-welt/w5g.mjs',import.meta.url),'utf8');
 for(const action of ['ersatz','frachter','transport','raffinerie','bauteile',
   'jaegerbau','jagd','piratenkauf','laserkauf'])
   assert.match(page,new RegExp('data-aktion="'+action+'"'));
 assert.match(page,/w5g.mjs/);
 assert.match(js,/api\.loadW5G/);
 assert.match(js,/w5gSitzung/);
 assert.match(js,/w5g\.hersteller\.fabrikmarge/);
 assert.doesNotMatch(js,/owners\.[\w.]+\.cash\s*[+-]=/);
 assert.doesNotMatch(js,/state\.minted\s*[+]=/);
});
test('W5g UI: unabhängiger IndexedDB-Slot mit atomarem Versionsschutz',async()=>{
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
 await sichern('save-1',undefined,mock);
 assert.equal(await laden(mock),'save-1');
 await assert.rejects(sichern('falscher Tab',undefined,mock),/anderen Tab/);
 assert.equal(await laden(mock),'save-1');
 await sichern('save-2','save-1',mock);
 assert.equal(await laden(mock),'save-2');
});
