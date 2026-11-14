import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../prototypes/f8-jaeger/f8-trainer.js');
const Z=require('../prototypes/f8-jaeger/f8-treffer.js');
const cmd=(type,more={})=>({type,owner:'house',schiff:T.ID,...more});
const audit=(s,where)=>assert.equal(T.audit(s).ok,true,where+': '+JSON.stringify(T.audit(s)));
function vorZiel(){
 const s=T.neu();
 assert.equal(T.befehl(s,cmd('shipUndock')).ok,true);
 T.schritt(s,40);
 assert.equal(T.befehl(s,cmd('shipFlyTo',{x:T.MARKER.x,y:T.MARKER.y})).ok,true);
 T.schritt(s,225);
 assert.equal(s.erreicht,265);
 audit(s,'arrival');
 return s;
}
test('F8b: eigener Fighter feuert nur im freien Flug und mit strikter Befehlsform',()=>{
 const s=T.neu(),h=JSON.stringify(s);
 for(const c of [cmd('fighterFire'),{...cmd('fighterFire'),owner:'pirates'},
   {...cmd('fighterFire'),schiff:'nicht-kaufbar'},
   {...cmd('fighterFire'),preis:0}])
   assert.equal(T.befehl(s,c).ok,false,JSON.stringify(c));
 assert.equal(JSON.stringify(s),h,'ablehnungen ohne Nebenwirkungen');
 assert.equal(s.zielprobe.hp,Z.K.maxHp);
 assert.equal(Z.K.schaden,45);
 for(const k of ['owners','ledger','minted','burned','rulesVersion','kopfgeld','xp'])
   assert.equal(Object.hasOwn(s,k),false,'kein Wirtschaftskern: '+k);
 audit(s,'initial');
});
test('F8b: drei reale Projektiltreffer aus Jägerkurs, begrenztem Laser und richtiger Distanz',()=>{
 const s=vorZiel();
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
 const locked=JSON.stringify(s);
 assert.match(T.befehl(s,cmd('fighterFire')).reason,/Trainingspause/);
 assert.equal(JSON.stringify(s),locked,'Cooldowngate atomar');
 T.schritt(s,1);
 assert.deepEqual(s.zielprobe.belege,[{schuss:1,tick:266,schaden:45,hp:90}]);
 T.schritt(s,15);
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
 T.schritt(s,1);
 assert.equal(s.zielprobe.hp,45);
 T.schritt(s,15);
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
 T.schritt(s,1);
 assert.equal(s.zielprobe.hp,0);
 assert.equal(s.zielprobe.treffer,3);
 assert.equal(s.zielprobe.schuesse,3);
 assert.deepEqual(s.zielprobe.belege.map(x=>x.tick),[266,282,298]);
 const last=JSON.stringify(s);
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,false);
 assert.equal(JSON.stringify(s),last,'zerstörte Testdrohne gibt keinen weiteren Treffer');
 audit(s,'target inactive');
 const clone=JSON.parse(JSON.stringify(s));audit(clone,'plain JSON roundtrip');
 assert.deepEqual(clone,s);
});
test('F8b: echte Fehlschüsse verfallen – Ziel kann nicht durch Grafik-Klick getroffen werden',()=>{
 const s=T.neu();
 T.befehl(s,cmd('shipUndock'));T.schritt(s,40);
 T.befehl(s,cmd('shipSteer',{kurs:64,fahrt:0}));
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
 T.schritt(s,35);
 assert.equal(s.zielprobe.treffer,0);
 assert.equal(s.zielprobe.hp,135);
 assert.equal(s.zielprobe.geschosse.length,0,'Projektil nach maximaler realer Reichweite beendet');
 audit(s,'miss');
});
test('F8b: Schussbuch, Trefferbeleg und Geschoßpositionen erkennen Manipulationen',()=>{
 const s=vorZiel();T.befehl(s,cmd('fighterFire'));T.schritt(s,1);
 for(const mutate of [
  x=>x.zielprobe.hp=0,
  x=>x.zielprobe.treffer=2,
  x=>x.zielprobe.belege[0].hp=75,
  x=>x.zielprobe.belege[0].tick=x.sekunden+1,
  x=>x.zielprobe.belege.push({...x.zielprobe.belege[0]}),
  x=>x.zielprobe.geschosse.push({id:1,x:0,y:0,vx:0,vy:0,rest:1}),
  x=>x.zielprobe.naechster=0,
  x=>x.zielprobe.unbelegt=true,
  x=>x.minted=900
 ]){
  const copy=structuredClone(s);mutate(copy);
  assert.equal(T.audit(copy).ok,false,'Manipulation ablehnen: '+JSON.stringify(copy.zielprobe));
 }
 audit(s,'unmodified source');
});
test('F8b: deterministischer Replay von freiem 2D-Kurs bis zum dritten Treffer und zurück',()=>{
 const run=()=>{
  const s=vorZiel();
  for(let i=0;i<3;i++){assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);T.schritt(s,16)}
  T.befehl(s,cmd('shipDock',{station:'st_aldera'}));
  for(let n=0;n<6000&&s.ships[T.ID].flug.lage!=='angedockt';n++)T.schritt(s,1);
  audit(s,'final');return s;
 };
 const a=run(),b=run();
 assert.deepEqual(a,b);
 assert.equal(a.ships[T.ID].flug.lage,'angedockt');
 assert.equal(a.zielprobe.hp,0);
 assert.equal(a.zielprobe.belege.length,3);
});
