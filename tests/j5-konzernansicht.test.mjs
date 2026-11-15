// J5: Firmenansicht ist eine reine Projektion derselben geprüften Regel204-Welt.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const Lage=require('../prototypes/j4c/konzern-lage.js');
const original=fs.readFileSync(path.join(root,'prototypes/j4c/beispiel-jaeger-seed42.json'),'utf8');
const profile=JSON.parse(original).w5ad.profile;
const erstellen=()=>{
 const w=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
 return {w,s:w.load(original)};
};
const geld=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);

test('J5-Konzernansicht liest originalfinanzierte Spielerflotte und getrennte Konten ohne Mutation',()=>{
 const {w,s}=erstellen();
 const vorher=w.save(s),hash=w.hash(s);
 const a=Lage.erzeugen(s,'sh023');
 assert.equal(a.regel,204);
 assert.equal(a.pilot,'sh023');
 assert.equal(a.spielerkasse,s.owners.house.cash);
 assert.equal(a.pilotenkasse,s.owners.pilot_house.cash);
 assert.equal(a.eigentuemerhaushalt,s.owners.eigner_house.cash);
 assert.equal(a.weltgeld,33000);
 assert.ok(a.schiffe.some(sh=>sh.id==='sh023'&&sh.klasse==='jaeger'));
 assert.ok(a.schiffe.some(sh=>sh.id==='sh021'&&sh.klasse==='frachter'));
 assert.ok(a.schiffe.some(sh=>sh.klasse==='miner'));
 assert.equal(a.schiffe.every(sh=>s.ships[sh.id].owner==='house'),true);
 assert.ok(a.stationen.some(st=>st.id==='st_nadir'&&st.lager.includes('erz: 30')));
 assert.ok(a.betriebskassen.some(k=>k.id==='transport'));
 assert.equal(w.hash(s),hash);
 assert.equal(w.save(s),vorher);
 assert.equal(geld(s),33000);
 assert.equal(w.audit(s).ok,true);
 assert.ok(Object.isFrozen(a));
 assert.ok(Object.isFrozen(a.schiffe));
});
test('J5 wechselt die Darstellung nicht den Weltkern: Flugreserve und Buchungen erscheinen live',()=>{
 const {w,s}=erstellen();
 const before=Lage.erzeugen(s,'sh023');
 const r=w.execute(s,{type:'shipUndock',owner:'house',schiff:'sh023'});
 assert.equal(r.ok,true,JSON.stringify(r));
 const next=Lage.erzeugen(s,'sh023');
 assert.equal(next.fluglohnreserve,40);
 assert.ok(next.spielerkasse<before.spielerkasse);
 assert.equal(next.weltgeld,before.weltgeld);
 for(let i=0;i<65;i++)w.teilschritt(s);
 const later=Lage.erzeugen(s,'sh023');
 assert.ok(later.tick>=before.tick+1);
 assert.ok(later.pilotenkasse>=before.pilotenkasse);
 assert.equal(later.weltgeld,33000);
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 const loaded=w.load(w.save(s));
 assert.deepEqual(Lage.erzeugen(loaded,'sh023'),Lage.erzeugen(s,'sh023'));
});
test('J5 akzeptiert weder fremden Jäger noch alte Regelwelt als Spieler-Konzernsession',()=>{
 const {s}=erstellen();
 assert.throws(()=>Lage.erzeugen({...s,rulesVersion:195},'sh023'),/Regel204/);
 assert.throws(()=>Lage.erzeugen(s,'sh001'),/Spielerjäger/);
 assert.throws(()=>Lage.erzeugen(s,'nicht-vorhanden'),/Spielerjäger/);
});
