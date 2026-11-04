import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';
import {weltSitzung,weltSicht} from '../prototypes/w5-welt/m_ui_welt_core.mjs';
import {DATENBANK,SLOT,laden,sichern} from '../prototypes/w5-welt/m_ui_welt_speicher.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html),r=api.W5D_RULES;
const tun=(s,cmd)=>{
 const result=s.befehl(cmd);
 assert.equal(result.ok,true,JSON.stringify({cmd,result,tick:s.lesen().tick}));
};
const ship=(s,owner,klasse,system)=>{
 const sh=Object.keys(s.lesen().ships).sort().map(id=>s.lesen().ships[id])
   .find(x=>x.owner===owner&&x.klasse===klasse&&(!system||x.system===system));
 assert.ok(sh,owner+' '+klasse+' '+(system||''));
 return sh.id;
};
const step=(s,n)=>s.schritt(n);
function ersteIndustrie(seed=42){
 const s=weltSitzung(api,api.createW5DState(seed));
 tun(s,{type:'shipBuy',owner:'house',station:'st_aldera',klasse:'miner'});
 tun(s,{type:'shipMine',owner:'house',schiff:ship(s,'house','miner','aldera'),ware:'erz'});
 tun(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 tun(s,{type:'shipMine',owner:'house',schiff:ship(s,'house','miner','nadir'),ware:'silizium'});
 step(s,50);
 tun(s,{type:'shipBuy',owner:'transport',station:'st_aldera',klasse:'frachter'});
 tun(s,{type:'shipFreight',owner:'transport',schiff:ship(s,'transport','frachter')});
 step(s,120);
 for(let i=0;i<4;i++){tun(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});step(s,20);}
 tun(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});step(s,64);
 tun(s,{type:'stationBuildFighter',owner:'house',station:'st_nadir'});step(s,32);
 tun(s,{type:'shipBuy',owner:'npc3',station:'st_nadir',klasse:'jaeger'});
 return s;
}
test('W5e: ein Regel22-State und echte gemeinsame Uhr, nicht W3+W5d parallel',()=>{
 for(const seed of [7,42]){
  const s=weltSitzung(api,api.createW5DState(seed));
  assert.equal(s.lesen().rulesVersion,22);
  const h=api.hash(s.lesen());
  for(let i=0;i<100;i++){
   const view=weltSicht(api,s.lesen());
   assert.equal(view.hash,h);
   assert.equal(view.audit.ok,true);
   assert.equal(view.version,'W5dGemeinsameWeltV1');
   assert.equal(view.jagd.minted,0);
   assert.ok(Object.isFrozen(view.canvas.entities));
  }
  assert.equal(api.hash(s.lesen()),h,'Anzeige hat keinen Tick und kein Geld verändert');
  step(s,50);
  assert.equal(s.lesen().tick,50);
  assert.notEqual(api.hash(s.lesen()),h);
  assert.equal(weltSicht(api,s.lesen()).lager.aldera.erz>0,true);
  assert.equal(api.audit(s.lesen()).ok,true);
 }
});
test('W5e: Miner, Frachter, Industrie und echter Jäger gehören zum selben Save',()=>{
 const s=ersteIndustrie(42),view=weltSicht(api,s.lesen());
 assert.equal(s.lesen().rulesVersion,22);
 assert.equal(s.lesen().w3.abgeschlossen,1);
 assert.equal(view.transport.geliefert,50);
 assert.equal(view.produktion.jaeger,1);
 assert.equal(view.produktion.verkauft,1);
 assert.ok(view.schiffe.some(x=>x.klasse==='miner'&&x.owner==='house'));
 assert.ok(view.schiffe.some(x=>x.klasse==='frachter'&&x.owner==='transport'));
 assert.ok(view.schiffe.some(x=>x.klasse==='jaeger'&&x.owner==='npc3'));
 assert.equal(view.jagd.minted,0);
 assert.equal(s.lesen().initialSupply,33000);
 assert.equal(api.audit(s.lesen()).ok,true);
 assert.equal(api.hash(api.loadW5D(s.export())),api.hash(s.lesen()));
});
test('W5e: bezahlter Piratenkauf und Ablehnungen erhalten Bilanz und Hash',()=>{
 const s=ersteIndustrie(7),fighter=ship(s,'npc3','jaeger'),hash=api.hash(s.lesen());
 assert.equal(s.befehl({type:'shipHunt',owner:'house',schiff:fighter}).ok,false);
 assert.equal(api.hash(s.lesen()),hash);
 tun(s,{type:'pirateBuy',owner:'pirates',angebot:fighter});
 const v=weltSicht(api,s.lesen(),fighter);
 assert.equal(v.selected.owner,'pirates');
 assert.equal(v.kassen.pirates,0);
 assert.equal(v.jagd.minted,0);
 assert.equal(s.lesen().stats.kopfgeld,0);
 assert.equal(api.audit(s.lesen()).ok,true);
});
test('W5e: fremde und manipulierte Saves werden ohne Zustandswechsel abgelehnt',()=>{
 const s=ersteIndustrie(42),before=s.export(),hash=api.hash(s.lesen());
 for(const raw of [api.save(api.createW3State(42)),api.save(api.createW5CState(42)),'{kaputt']){
   assert.throws(()=>s.import(raw));
   assert.equal(s.export(),before);
   assert.equal(api.hash(s.lesen()),hash);
 }
 const broken=JSON.parse(before);broken.owners.house.cash+=900;
 assert.throws(()=>s.import(JSON.stringify(broken)),/Bilanz|Audit|fehlerhaft/);
 assert.equal(s.export(),before);
 const gleich=weltSitzung(api);gleich.import(before);
 assert.equal(api.hash(gleich.lesen()),hash);
 assert.equal(api.audit(gleich.lesen()).ok,true);
});
test('W5e: eigener Forschungs-Namespace ist nicht der Hauptspiel-Slot',()=>{
 assert.notEqual(DATENBANK,'aphros-void');
 assert.equal(SLOT,'regel22-gemeinsame-welt-v1');
 assert.ok(!/regel1[457]|regel20|regel21/.test(SLOT));
 const source=readFileSync(new URL('../prototypes/w5-welt/welt.html',import.meta.url),'utf8');
 assert.match(source,/welt.mjs/);
 assert.match(source,/separat|eigene/i);
});
function fakeIDB(){
 const data=new Map();
 const db={objectStoreNames:{contains:()=>true},createObjectStore(){},close(){},
   transaction(_name,mode){
     const tx={oncomplete:null,onerror:null,onabort:null,
       abort(){queueMicrotask(()=>tx.onabort?.());},
       objectStore(){
         return {
           get(key){
             const req={};
             queueMicrotask(()=>{req.result=data.get(key);req.onsuccess?.();
               if(mode==='readonly')queueMicrotask(()=>tx.oncomplete?.());});
             return req;
           },
           put(value,key){data.set(key,value);queueMicrotask(()=>tx.oncomplete?.());},
         };
       },
     };return tx;
   },
 };
 return {data,open(){const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;}};
}
test('W5e: atomarer Slot-Vergleich verhindert Überschreiben aus einem zweiten Tab',async()=>{
 const idb=fakeIDB();
 assert.equal(await laden(idb),undefined);
 await sichern('save-A',undefined,idb);
 assert.equal(await laden(idb),'save-A');
 await assert.rejects(sichern('stale-write',undefined,idb),/anderen Tab/);
 assert.equal(await laden(idb),'save-A');
 await sichern('save-B','save-A',idb);
 assert.equal(await laden(idb),'save-B');
 await assert.rejects(sichern('stale-A','save-A',idb),/anderen Tab/);
 assert.equal(await laden(idb),'save-B');
});
