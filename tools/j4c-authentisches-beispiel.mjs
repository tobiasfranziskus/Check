// J4c: vollständig real finanzierten Testspielstand als herunterladbares CI-Artefakt.
// Entwicklungswerkzeug (Node22), NICHT Teil des statischen Browsers. Keine Gratis-Schiffe.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {finanzierteJaegerBauteile} from './j4b-finanzierter-jaeger-gate.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
mkdirSync('artifacts/j4c-jaeger',{recursive:true});
for(const seed of [42,7]){
 const {welt:w,zustand:s,sourceHash}=await finanzierteJaegerBauteile(seed);
 const start=w.execute(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});
 assert.equal(start.ok,true,'Original J4b Werft aus 8 Teilen + 4 Material');
 for(let m=0;m<w.rules.j4.dauer;m++)w.minute(s);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 const bought=w.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'});
 assert.equal(bought.ok,true,'echter 900-ISK-Kauf');
 const trader=s.kanon.jaeger.kaeufe[0],oldHash=w.hash(s);
 assert.equal(trader.id,'sh023');
 assert.equal(s.owners.house.cash,1589);
 const {welt:flight,zustand:p,quellHash}=Welt.ausRegel203J4c(w.save(s));
 assert.equal(quellHash,oldHash);
 assert.equal(w.hash(s),oldHash,'203-Spielstand wird nie überschrieben');
 assert.equal(flight.audit(p).ok,true,JSON.stringify(flight.audit(p).fehler));
 assert.equal(geld(p),33000);assert.equal(p.minted,0);assert.equal(p.burned,0);
 assert.equal(p.ships[trader.id].owner,'house');
 assert.equal(p.ships[trader.id].flug.lage,'angedockt');
 const save=flight.save(p),check=flight.load(save);
 assert.deepEqual(check,p);
 const path='artifacts/j4c-jaeger/aphros-j4c-echt-finanziert-seed-'+seed+'-regel204.json';
 writeFileSync(path,save,'utf8');
 console.log('J4C_SAMPLE',JSON.stringify({seed,sourceHash,Rule203:oldHash,Rule204:flight.hash(p),
   tick:p.tick,ship:trader.id,gameMoney:geld(p),file:path,bytes:Buffer.byteLength(save,'utf8')}));
}
