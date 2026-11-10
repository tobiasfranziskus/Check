import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url),{create}=require('../prototypes/w5u/session.js'),{core,rules}=require('../prototypes/w5u/original-core.js');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const check=s=>{const x=s.snapshot();assert.equal(x.audit.ok,true);assert.equal(core.hash(core.load(s.export())),x.hash);assert.equal(core.hash(x.state),x.hash);};
const cmd=(s,type,args={})=>s.command({type,schiff:s.snapshot().selected,...args});
test('W5u-Regel14-Core ist historisch bytegleich, Main-Rule14-Daten unverändert und Replay weiterhin stabil',()=>{
 const file=readFileSync(new URL('../prototypes/w5u/original-core.js',import.meta.url),'utf8');
 // Main contains new isolated Rule15+ sections after Rule14; comparing the entire
 // current data-to-UI slice to historic W5u would incorrectly conflate profiles.
 const first=html.indexOf('const m_data_systeme ='),next=html.indexOf('// Erzpilot: Regel-15-',first);
 assert.ok(first>=0&&next>first,'current main contains original Rule14 and later isolated profiles');
 assert.ok(file.includes(html.slice(first,next)),'actual current Rule14 data matches historic W5u');
 const bytes=Buffer.from(file,'utf8');
 const sha=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 assert.equal(sha,'ced7e4424346e38dbb841220653843882b50277e','unmodified historical Rule14 Core blob');
 for(const seed of [42,7,1234]){
  const s=create(seed),r=core.createState(seed);
  assert.equal(s.snapshot().hash,core.hash(r));s.advance(60);core.advance(r,60);
  assert.equal(s.snapshot().hash,core.hash(r));check(s);
 }
});
test('Auswahl, Projektion und Snapshots ändern weder Zeit noch Geld, Waren oder Hash',()=>{
 const s=create(),saved=s.export();for(let i=0;i<10;i++){s.snapshot();s.select('sh002');s.snapshot();s.select('sh001');}assert.equal(s.export(),saved);
 const v=s.snapshot();v.state.owners.house.cash=99999;assert.equal(s.export(),saved);assert.equal(v.bundle.corporation.company.result,null);
 assert.throws(()=>s.select('sh003'));assert.equal(s.export(),saved);assert.equal(v.bundle.corporation.ships.length,2);check(s);
});
test('Kauf, Verkauf und Inbetriebnahme erhalten echte Geld-/Warenbilanz und Save/Load',()=>{
 const s=create(),before=s.snapshot().state;const quantity=before.stations.st_aldera.lager.miner;
 assert.equal(cmd(s,'shipTrade',{ware:'miner',menge:1,kauf:true}).ok,true);let x=s.snapshot().state;
 assert.equal(x.ships.sh001.ladung.miner,1);assert.equal(x.stations.st_aldera.lager.miner,quantity-1);assert.ok(x.owners.house.cash<before.owners.house.cash);check(s);
 assert.equal(cmd(s,'shipTrade',{ware:'miner',menge:1,kauf:false}).ok,true);check(s);
 assert.equal(cmd(s,'shipTrade',{ware:'miner',menge:1,kauf:true}).ok,true);
 assert.equal(cmd(s,'shipActivate',{klasse:'miner'}).ok,true);x=s.snapshot().state;
 const added=Object.keys(x.ships).filter(id=>!before.ships[id]);assert.equal(added.length,1);assert.equal(x.ships[added[0]].owner,'house');assert.equal(x.ships.sh001.ladung.miner,undefined);check(s);
 const loaded=create(7);loaded.import(s.export());assert.equal(loaded.export(),s.export());
});
test('Ablehnungen: fremdes Eigentum, kein Geld, Bestand, falsche Rolle und Import sind atomar',()=>{
 const s=create();const saved=s.export();
 for(const action of [()=>s.command({type:'shipWait',schiff:'sh003',owner:'npc3'}),()=>cmd(s,'shipHandeln'),()=>cmd(s,'shipTrade',{ware:'miner',menge:999999,kauf:true}),()=>cmd(s,'shipActivate',{klasse:'jaeger'}),()=>cmd(s,'stationBuildShip')]){assert.equal(action().ok,false);assert.equal(s.export(),saved);}
 for(const change of [v=>v.rulesVersion=32,v=>v.schema=9,v=>v.owners.house.cash++,v=>v.stations.st_aldera.lager.miner++,v=>v.ships.sh001.owner='fake']){const v=JSON.parse(saved);change(v);assert.throws(()=>s.import(JSON.stringify(v)));assert.equal(s.export(),saved);}
 assert.throws(()=>s.import('{'));assert.equal(s.export(),saved);check(s);
});
test('Mine, Halten, Handeln, Reise, Rename: nur Originalbefehle, Replay und Audit',()=>{
 const a=create(),b=create();
 for(const s of [a,b]){
  for(const [type,args] of [['shipRename',{name:'<img src=x onerror=x>'}],['shipMine',{ware:'erz'}],['shipWait',{}]]){assert.equal(cmd(s,type,args).ok,true);check(s);}
  s.select('sh002');assert.equal(cmd(s,'shipHandeln').ok,true);assert.equal(cmd(s,'shipWait').ok,true);
  assert.equal(cmd(s,'shipMove',{ziel:'st_nadir'}).ok,true);check(s);s.advance(60);check(s);
 }
 assert.equal(a.export(),b.export());assert.equal(a.snapshot().selected,'sh002');
});
