// J6-Rollenprüfung: Original-F6-Flugfähigkeiten bezahlter Spielerhüllen.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const original=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const profile=JSON.parse(original).w5ad.profile;
const laden=()=>{const w=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
 const s=w.load(original);assert.equal(w.audit(s).ok,true);return {w,s};};
const weltgeld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const pruef=(w,s)=>{const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));assert.equal(weltgeld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);};

test('J6: tatsächlich gekaufter Nadir-Miner fährt mit Original-F6, bindet reale Reserve',()=>{
 const {w,s}=laden(),id='sh022',sh=s.ships[id],k=s.kanon.minerWerft.lokaleKaeufe;
 assert.ok(k.some(b=>b.id===id&&b.owner==='house'&&b.preis===600&&b.station==='st_nadir'));
 assert.equal(sh.klasse,'miner');assert.equal(sh.flug.lage,'angedockt');
 const house=s.owners.house.cash;
 const start=w.execute(s,{type:'shipUndock',owner:'house',schiff:id});
 assert.equal(start.ok,true,JSON.stringify(start));
 assert.equal(s.owners.house.cash,house-40,'Original-Fluglohnreserve');
 assert.equal(s.owners['k1_flug_'+id].cash,40);
 assert.equal(s.kanon.flugdienst[id].minuten,0);
 pruef(w,s);
 // Realer F6-Flug: der Übergang aus dem Dock erfordert Teilschritte.
 for(let i=0;i<120&&sh.flug.lage!=='frei';i++)w.teilschritt(s);
 assert.equal(sh.flug.lage,'frei','gekaufter Miner ist wirklich im Weltraum');
 const fly=w.execute(s,{type:'shipFlyTo',owner:'house',schiff:id,x:220000,y:-145000});
 assert.equal(fly.ok,true,JSON.stringify(fly));
 assert.equal(sh.flug.ziel?.art,'punkt');
 for(let i=0;i<60;i++)w.teilschritt(s);
 pruef(w,s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.ok(s.kanon.flugdienst[id],'echter Flugdienst läuft');
});

test('J6: Nadir-Frachter ist rechtmäßig gekauft, aber für freien Nadir-F6-Flug im aktuellen Core gesperrt',()=>{
 const {w,s}=laden(),id='sh021';
 assert.equal(s.ships[id].owner,'house');
 assert.equal(s.ships[id].klasse,'frachter');
 assert.equal(s.ships[id].system,'nadir');
 const vor=w.save(s),hash=w.hash(s);
 const result=w.execute(s,{type:'shipUndock',owner:'house',schiff:id});
 assert.equal(result.ok,false,'keine unfreigegebene Nadir-Frachterpilotenfunktion behaupten');
 assert.match(result.reason,/J4c|freie|bezahlt|K1/i);
 assert.equal(w.save(s),vor);
 assert.equal(w.hash(s),hash);
 pruef(w,s);
});

test('J6: fremde NPC-Miner/Frachter dürfen nicht als Spielerschiffe abdocken',()=>{
 const {w,s}=laden();
 for(const id of ['sh008','sh020']){
  assert.equal(s.ships[id].owner!=='house',true);
  const hash=w.hash(s);
  const result=w.execute(s,{type:'shipUndock',owner:'house',schiff:id});
  assert.equal(result.ok,false,'kein Fremdschiff steuern: '+id);
  assert.equal(w.hash(s),hash,'Ablehnung ist atomar: '+id);
 }
 pruef(w,s);
});
