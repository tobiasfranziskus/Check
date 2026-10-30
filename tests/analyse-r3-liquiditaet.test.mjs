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
test('R3 liefert aus voller Miner-Fracht nur bis zum Ziel und wahrt den Ledger',()=>{
 const srcR3=variant(src,'r3_target');
 const target=new Function(srcR3+';return {c:m_core_index,r:m_data_rules.RULES,m:m_core_foerderung};')();
 const origin=new Function(src+';return {c:m_core_index,r:m_data_rules.RULES,m:m_core_foerderung};')();
 const s=target.c.createState(42,target.r);
 const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'
  &&x.heimat==='aldera'&&x.ware==='erz');
 assert(miner);
 const station=target.r.world.systems[miner.system].station,goal=target.r.world.stations[station].ziel.erz;
 // Synthetische Warenbewegung mit eigenständiger korrekter Ledger-Gegenbuchung.
 s.stations[station].lager.erz=goal-1;s.ledger.erz.consumed+=1;
 miner.ladung.erz=100;s.ledger.erz.mined+=100;
 independentlyAudit(s);
 const old=origin.c.load(origin.c.save(s),undefined,origin.r);
 target.m.foerderung(s,target.r);
 origin.m.foerderung(old,origin.r);
 assert.equal(s.stations[station].lager.erz,goal,'Miner nur bis zum Zielbestand');
 assert.equal(s.ships[miner.id].ladung.erz,99,'übrige bezahlbare Ladung verbleibt auf Miner');
 assert(old.stations[station].lager.erz>goal,'die Originalregel würde über das Ziel hinaus verkaufen');
 independentlyAudit(s);independentlyAudit(old);
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
