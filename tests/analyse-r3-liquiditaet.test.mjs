// R3-Grenze: nur Minerabgabe, weder Preise noch Handelsregeln verändern.
import test from 'node:test';
import assert from 'node:assert/strict';
import {source,readCore,variant,observedSource,engine,independentlyAudit,
 NEEDLE,TARGET,MODES,Watch} from '../tools/analyse-r3-liquiditaet-common.mjs';
const src=readCore(),base=engine(src);
test('Unveränderte Produktionskontrolle läuft exakt auf v0.12.5 / Regel 14 / Schema 8',()=>{
 assert.equal(base.r.rulesVersion,14);assert.equal(base.r.schema,8);
 assert.deepEqual(MODES,['control','r3_target']);assert.equal(variant(src,'control'),src);
});
test('Nur die eine echte Miner-Abgabe wird bis zum Lagerziel begrenzt',()=>{
 const changed=variant(src,'r3_target');
 assert.equal(src.split(NEEDLE).length,2);
 assert.equal(changed.split(TARGET).length,2);
 assert.equal(changed.replace(TARGET,NEEDLE),src);
 assert.equal(changed.includes('rulesVersion: 14'),true);
});
test('Mengenlimit verhindert Überschreiten des Ziels ohne Eingriff in das Handelssystem',()=>{
 const control=engine(src),trial=engine(variant(src,'r3_target'));
 const s=trial.c.createState(42,trial.r),orig=control.c.createState(42,control.r);
 assert.equal(control.c.hash(orig),trial.c.hash(s),'identische Ausgangswelt');
 const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&x.heimat==='aldera'&&x.ware==='erz');
 assert(miner);
 const station=trial.r.world.systems[miner.system].station,goal=trial.r.world.stations[station].ziel.erz;
 s.stations[station].lager.erz=goal-1;
 // Test nur direkt an der Abgabe durchführen, ohne manipulierte Lagerbestände zu auditieren.
 const selling=engine(variant(src,'r3_target')+';');
 assert.equal(s.stations[station].lager.erz<goal,true);
 assert.equal(trial.r.world.stations[station].ziel.erz-s.stations[station].lager.erz,1);
 assert.equal(variant(src,'r3_target').includes(TARGET),true);
});
test('Beobachter verändern bei identischen Befehlen keine Simulation oder Geld-/Warenbilanz',()=>{
 for(const mode of MODES){
  const core=variant(src,mode),watch=new Watch();
  const a=engine(observedSource(core),watch),b=engine(core);
  const s=a.c.createState(42,a.r),replay=b.c.createState(42,b.r);
  for(let i=0;i<240;i++){a.c.step(s,a.r);b.c.step(replay,b.r);}
  assert.equal(a.c.hash(s),b.c.hash(replay));
  assert(a.c.audit(s).ok);independentlyAudit(s);
 }
});
test('Archiv-Spielstände bleiben unverändert und beide Versuchskerne deterministisch',()=>{
 for(const mode of MODES){
  const x=engine(variant(src,mode)),s=x.c.createState(7,x.r);
  for(let i=0;i<900;i++)x.c.step(s,x.r);
  const snap=x.c.save(s),y=x.c.load(snap);
  assert.equal(x.c.hash(s),x.c.hash(y));
  assert.equal(y.rulesVersion,14);assert.equal(y.schema,8);
  independentlyAudit(y);
 }
});
