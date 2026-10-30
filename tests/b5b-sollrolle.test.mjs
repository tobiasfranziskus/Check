// B5b: dauerhafte, eindeutige Sollplatzbindung statt vorübergehender Förderware.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const anchor='return { zuschuss, ersatzkauf };';
assert.equal(source.split(anchor).length,2,'isoliert nur fehlend zur Prüfung exportieren');
const {c,r,b}=new Function(source.replace(anchor,'return { zuschuss, ersatzkauf, fehlend };')
 +';return {c:m_core_index,r:m_data_rules.RULES,b:m_core_schiffbau};')();
assert.equal(r.rulesVersion,14);assert.equal(r.schema,8);
function setup(seed=42){
 const s=c.createState(seed,r);
 const sh=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'
  &&x.heimat==='nadir'&&x.ware==='silizium');
 assert(sh,'geplanter Nadir-Siliziumminer fehlt');
 return {s,sh};
}
function count(s,owner,klasse){
 return Object.values(s.ships).filter(x=>x.owner===owner&&x.klasse===klasse).length;
}
function migrate(s,rule=13){
 const old=JSON.parse(c.save(s));
 for(const sh of Object.values(old.ships))delete sh.sollplatz;
 old.rulesVersion=rule;
 return {old,loaded:c.load(JSON.stringify(old),undefined,r)};
}
function oldFields(sh){const {sollplatz,...keep}=sh;return keep;}
test('Jeder geplante Startplatz ist genau einer realen Hülle zugeordnet',()=>{
 const s=c.createState(42,r);
 for(const [owner,slots] of Object.entries(s.sollflotte)){
  const roles=Object.values(s.ships).filter(x=>x.owner===owner&&Number.isSafeInteger(x.sollplatz));
  assert.equal(roles.length,slots.length);
  assert.equal(new Set(roles.map(x=>x.sollplatz)).size,roles.length);
  assert.deepEqual(roles.map(x=>x.sollplatz).sort((x,y)=>x-y),slots.map((_,i)=>i));
  assert.equal(b.fehlend(s,owner).length,0);
 }
 assert.equal(Object.values(s.ships).filter(x=>x.owner==='pirates'&&x.sollplatz!==undefined).length,0);
 assert(c.audit(s).ok);
});
test('Realer Nadir–Aldera-Transport löscht vorübergehende Förderware, nicht die Dauerrolle',()=>{
 const {s,sh}=setup(),start=sh.sollplatz,miners=count(s,'npc3','miner');
 const cmd=c.execute(s,{type:'shipMove',owner:'npc3',schiff:sh.id,ziel:'st_aldera'},r);
 assert(cmd.ok,cmd.reason);
 const ticks=sh.ankunft-s.tick;
 for(let t=0;t<ticks;t++)c.step(s,r);
 assert.equal(sh.system,'aldera');assert.equal(sh.auftrag,'halten');assert.equal(sh.ware,null);
 assert.equal(sh.sollplatz,start);
 assert.equal(b.fehlend(s,'npc3').length,0);
 const beforeCash=s.owners.npc3.cash;
 b.ersatzkauf(s,r);
 assert.equal(count(s,'npc3','miner'),miners,'kein zweiter Miner auf denselben Platz');
 assert.equal(s.owners.npc3.cash,beforeCash,'kein versehentlicher Hüllenkauf');
 assert(c.audit(s).ok);
});
test('Warten und neuer Förderauftrag dürfen den dauerhaften Sollplatz nicht umetikettieren',()=>{
 const {s,sh}=setup(),slot=sh.sollplatz;
 assert(c.execute(s,{type:'shipWait',owner:'npc3',schiff:sh.id},r).ok);
 assert.equal(sh.auftrag,'halten');assert.equal(sh.sollplatz,slot);
 assert.equal(b.fehlend(s,'npc3').length,0);
 assert(c.execute(s,{type:'shipMine',owner:'npc3',schiff:sh.id,ware:'silizium'},r).ok);
 assert.equal(sh.auftrag,'foerdern');assert.equal(sh.sollplatz,slot);
 assert.equal(b.fehlend(s,'npc3').length,0);
});
test('Ein echtes Schiff geht verloren: genau sein Sollplatz wird real finanziert ersetzt',()=>{
 const {s,sh}=setup(),slot=sh.sollplatz,oldCount=count(s,'npc3','miner');
 const beforeCash=s.owners.npc3.cash,beforeStock=s.stations[r.world.werft].lager.miner;
 delete s.ships[sh.id];delete s.stats.verkaeufe[sh.id];
 assert.deepEqual(b.fehlend(s,'npc3').map(x=>x.platz),[slot]);
 b.ersatzkauf(s,r);
 assert.equal(count(s,'npc3','miner'),oldCount);
 assert.equal(s.stations[r.world.werft].lager.miner,beforeStock-1);
 assert(s.owners.npc3.cash<beforeCash,'Hülle aus realer Konzernkasse bezahlt');
 assert.equal(b.fehlend(s,'npc3').length,0);
 const neuw=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.sollplatz===slot);
 assert.equal(neuw.length,1);
 assert.notEqual(neuw[0].id,sh.id);
 assert.equal(neuw[0].ware,'silizium');
 assert(c.audit(s).ok);
});
test('Zwei gleiche Minerrollen behalten trotzdem unterschiedliche Sollplatzidentitäten',()=>{
 const {s}=setup();
 const sh=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'
  &&x.heimat==='aldera'&&x.ware==='erz');
 assert(sh);
 const second=Object.values(s.ships).find(x=>x.id!==sh.id&&x.owner===sh.owner&&x.klasse==='miner'
  &&x.heimat===sh.heimat&&x.ware===sh.ware);
 assert(second,'mindestens zwei gleiche Aldera-Erzminer');
 const firstSlot=sh.sollplatz,secondSlot=second.sollplatz;
 assert.notEqual(firstSlot,secondSlot);
 sh.ware=null;sh.auftrag='halten';
 assert.equal(b.fehlend(s,sh.owner).length,0,'laufender Miner bleibt zugeordnet');
 delete s.ships[second.id];delete s.stats.verkaeufe[second.id];
 assert.deepEqual(b.fehlend(s,sh.owner).map(x=>x.platz),[secondSlot]);
});
test('Regel-13-Save rekonstruiert gestoppten Nadir-Miner eindeutig ohne Waren-/Geldverlust',()=>{
 const {s,sh}=setup(),slot=sh.sollplatz;
 sh.auftrag='halten';sh.ware=null;sh.system='aldera';sh.arbeit=23;sh.ladung.silizium=0;
 const {old,loaded}=migrate(s);
 assert.equal(loaded.rulesVersion,14);assert.equal(loaded.schema,8);
 assert.equal(loaded.ships[sh.id].sollplatz,slot);
 assert.equal(loaded.ships[sh.id].ware,null);
 assert.equal(loaded.ships[sh.id].arbeit,23);
 assert.deepEqual(loaded.sollflotte,old.sollflotte);
 assert.deepEqual(loaded.owners,old.owners);
 assert.deepEqual(loaded.ledger,old.ledger);
 for(const id of Object.keys(old.ships))assert.deepEqual(oldFields(loaded.ships[id]),old.ships[id]);
 assert.equal(b.fehlend(loaded,'npc3').length,0);
 assert.equal(c.hash(c.load(c.save(loaded))),c.hash(loaded));
 assert(c.audit(loaded).ok);
});
test('Regel-13-Spielstand mit echtem Verlust behält einen freien Ersatz-Sollplatz',()=>{
 const {s,sh}=setup(),slot=sh.sollplatz;
 delete s.ships[sh.id];delete s.stats.verkaeufe[sh.id];
 const {loaded}=migrate(s);
 assert.deepEqual(b.fehlend(loaded,'npc3').map(x=>x.platz),[slot]);
 assert(c.audit(loaded).ok);
});
test('Uneindeutige alte Rollenzuordnung wird sichtbar abgewiesen statt still geraten',()=>{
 const {s,sh}=setup();
 for(const [id,x] of Object.entries(s.ships))if(x.owner==='npc3'&&id!==sh.id)delete s.ships[id];
 s.sollflotte.npc3=[
  {klasse:'miner',heimat:'nadir',ware:'silizium',auftrag:'foerdern'},
  {klasse:'miner',heimat:'nadir',ware:'eis',auftrag:'foerdern'},
 ];
 sh.ware=null;sh.auftrag='halten';
 const old=JSON.parse(c.save(s));old.rulesVersion=13;
 for(const x of Object.values(old.ships))delete x.sollplatz;
 const prior=JSON.stringify(old);
 assert.throws(()=>c.load(prior,undefined,r),/uneindeutige Sollrollen/);
 assert.equal(JSON.stringify(old),prior,'Quellspielstand nicht verändert');
});
test('Spieleraktivierte Hüllen erhalten keinen fremden oder erfundenen Sollplatz',()=>{
 const {s,sh}=setup();const next=s.nextShip,plans=s.sollflotte.npc3.length;
 const newcomer=c.createState(42,r);
 const carrier=Object.values(newcomer.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
 const id=carrier.id;carrier.ladung.frachter=1;
 newcomer.ledger.frachter.imported+=1;
 assert(c.execute(newcomer,{type:'shipActivate',owner:'house',schiff:id,klasse:'frachter'},r).ok);
 const neu=newcomer.ships['sh'+String(next).padStart(3,'0')];
 assert(neu);
 assert.equal(neu.sollplatz,undefined,'frei aktiviertes Schiff ohne Ersatzpflicht');
 assert.equal(newcomer.sollflotte.npc3.length,plans);
 assert(c.audit(newcomer).ok);
});
test('Regel 11/12 migriert weiter bis 14, alte Regel 8–10 und Zukunftsversion 15 nicht',()=>{
 const {s}=setup();
 for(const oldVersion of [11,12,13]){
  const old=JSON.parse(c.save(s));old.rulesVersion=oldVersion;
  for(const x of Object.values(old.ships))delete x.sollplatz;
  const loaded=c.load(JSON.stringify(old),undefined,r);
  assert.equal(loaded.rulesVersion,14);
  assert(c.audit(loaded).ok);
 }
 for(const version of [8,9,10,15]){
  const old=JSON.parse(c.save(s));old.rulesVersion=version;
  assert.throws(()=>c.load(JSON.stringify(old),undefined,r),version===15?/neuer/:/keine Regelmigration vorhanden/);
 }
});
