import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const T=require('../prototypes/f8-jaeger/f8-trainer.js');
const F=require('../prototypes/flug2d/flug-kern.js');
const cmd=(type,extra={})=>({type,owner:'house',schiff:T.ID,...extra});
const check=s=>assert.equal(T.audit(s).ok,true,JSON.stringify(T.audit(s)));
const makeMoving=()=>{
 const s=T.neu(),c=T.befehl(s,cmd('fighterTargetMode',{modus:'beweglich'}));
 assert.equal(c.ok,true,JSON.stringify(c));
 check(s);
 return s;
};
function targetAndFire(){
 const s=makeMoving();
 assert.equal(T.befehl(s,cmd('shipUndock')).ok,true);
 T.schritt(s,40);
 assert.equal(T.befehl(s,cmd('shipFlyTo',{x:T.MARKER.x,y:T.MARKER.y})).ok,true);
 T.schritt(s,225);
 assert.equal(s.erreicht,265,'F8-A golden marker time must stay identical');
 for(let n=1;n<=3;n++){
   const p=T.status(s).zielPosition,b=s.ships[T.ID].flug;
   assert.equal(T.befehl(s,cmd('shipSteer',{
     kurs:F.richtungZu(p.x-b.x,p.y-b.y),fahrt:0})).ok,true);
   T.schritt(s,8);
   const shot=T.befehl(s,cmd('fighterFire'));
   assert.equal(shot.ok,true,JSON.stringify(shot));
   T.schritt(s,16);
   assert.equal(s.zielprobe.hp,135-n*45,'only real projectile contact may damage target');
   assert.equal(s.zielprobe.treffer,n);
   check(s);
 }
 return s;
}
test('F8d: original stationary-target default and legacy F8b flight golden are protected',()=>{
 const s=T.neu();
 assert.equal(T.status(s).zielModus,'stationaer');
 assert.deepEqual(T.status(s).zielPosition,{x:720000,y:-288000});
 check(s);
 T.befehl(s,cmd('shipUndock'));T.schritt(s,40);
 T.befehl(s,cmd('shipFlyTo',{x:T.MARKER.x,y:T.MARKER.y}));T.schritt(s,225);
 assert.equal(s.erreicht,265);
 check(s);
});
test('F8d: moving drone follows integer sine trajectory independent of the renderer',()=>{
 const s=makeMoving(),first=T.status(s).zielPosition;
 assert.deepEqual(first,{x:816000,y:-288000});
 for(let n=0;n<5;n++)T.schritt(s);
 let a=T.status(s).zielPosition;
 assert.notDeepEqual(a,first,'moving target actually moved after five original F6 seconds');
 assert.equal(a.x,720000+Math.trunc(F.cos(1)*96000/F.DATEN.einheit));
 assert.equal(a.y,-288000+Math.trunc(F.sin(1)*96000/F.DATEN.einheit));
 for(let n=0;n<1275;n+=255)T.schritt(s,255);
 assert.deepEqual(T.status(s).zielPosition,first,'precisely deterministic circular orbit after 1280 seconds');
 check(s);
});
test('F8d: changing the target after simulation starts, alien commands and unknown modes are atomic rejects',()=>{
 const s=makeMoving();
 const before=JSON.stringify(s);
 for(const wrong of [
  cmd('fighterTargetMode',{modus:'fast'}),
  cmd('fighterTargetMode',{modus:'stationaer',preis:1}),
  {...cmd('fighterTargetMode',{modus:'stationaer'}),owner:'pirates'},
  {...cmd('fighterTargetMode',{modus:'stationaer'}),schiff:'sh999'},
 ]){assert.equal(T.befehl(s,wrong).ok,false);assert.equal(JSON.stringify(s),before)}
 T.schritt(s,1);
 const running=JSON.stringify(s);
 assert.equal(T.befehl(s,cmd('fighterTargetMode',{modus:'stationaer'})).ok,false);
 assert.equal(JSON.stringify(s),running);
 check(s);
});
test('F8d: maneuver to orbiting target, three true projectile hits, paid economy untouched, JSON replay',()=>{
 const a=targetAndFire(),b=targetAndFire();
 assert.deepEqual(a,b,'exactly replayable on identical command sequence');
 assert.equal(a.zielprobe.schuesse,3);assert.equal(a.zielprobe.treffer,3);
 assert.equal(a.zielprobe.hp,0);
 assert.notDeepEqual(T.status(a).zielPosition,{x:720000,y:-288000});
 for(const key of ['owners','ledger','minted','burned','rulesVersion','kopfgeld','xp'])
   assert.equal(Object.hasOwn(a,key),false,'training never creates economic property: '+key);
 const clone=JSON.parse(JSON.stringify(a));check(clone);assert.deepEqual(clone,a);
 T.befehl(a,cmd('shipDock',{station:'st_aldera'}));
 for(let n=0;n<6000&&T.status(a).lage!=='angedockt';n++)T.schritt(a,1);
 assert.equal(T.status(a).lage,'angedockt');check(a);
});
test('F8d: physical near-miss does not damage moving target; changed mode and counterfeit hit rejected',()=>{
 const s=makeMoving();
 T.befehl(s,cmd('shipUndock'));T.schritt(s,40);
 T.befehl(s,cmd('shipSteer',{kurs:128,fahrt:0}));
 assert.equal(T.befehl(s,cmd('fighterFire')).ok,true);
 T.schritt(s,35);
 assert.equal(s.zielprobe.hp,135);assert.equal(s.zielprobe.treffer,0);
 assert.equal(s.zielprobe.geschosse.length,0);
 check(s);
 for(const change of [
  x=>{x.zielprobe.modus='unbekannt'},
  x=>{x.zielprobe.hp=90},
  x=>{x.zielprobe.belege=[{schuss:1,tick:40,schaden:45,hp:90}]},
  x=>{x.zielprobe.naechster=999999},
 ]){const tampered=structuredClone(s);change(tampered);assert.equal(T.audit(tampered).ok,false)}
});
