// Reproduzierbarer 13×90-Tage-Vergleich, je Seed Kontrolle vs keine Piratenueberfaelle.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {BASE,MODES,SEEDS,SHA,readCore,changePirates,independentlyAudit,calculateSnapshot} from './piratenfrei-common.mjs';
const args=process.argv.slice(2);
const arg=(k,otherwise)=>args.find(x=>x.startsWith('--'+k+'='))?.split('=').slice(1).join('=')??otherwise;
const seed=Number(arg('seed','42')),out=arg('out','/tmp/piraten-90');
assert(SEEDS.includes(seed),'Seed muss im festgelegten Satz enthalten sein');
assert(args.every(x=>/^--(seed|out)=/.test(x)));
const raw=readCore();
const historic=execFileSync('git',['show',BASE+':index.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
assert.equal(SHA(raw),SHA(historic),'Analyse ausschließlich auf gepinntem main, ohne Produktpatch');
const source=raw.slice(raw.indexOf('<script>')+8,raw.indexOf('const m_data_oberflaeche'));
const unpack=x=>new Function(x+';return {c:m_core_index,r:m_data_rules.RULES};')();
const base=unpack(source);
assert.equal(base.r.rulesVersion,13);
const original=base.c.createState(seed,base.r);
const initial=base.c.save(original),initialHash=base.c.hash(original);
const golden=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-priority-v12.json',import.meta.url),'utf8')).results.find(x=>x.seed===seed);
assert(golden,'ungeänderte v12-Referenzdaten fehlen');
const result=[];
for(const mode of MODES){
 const altered=changePirates(source,mode);
 const a=unpack(altered),b=unpack(altered);
 const state=a.c.load(initial,undefined,a.r),replay=b.c.load(initial,undefined,b.r);
 assert.equal(a.c.hash(state),initialHash);
 assert.equal(b.c.hash(replay),initialHash);
 let hours=0,roundtrips=0;
 const checkpoints=[],daily=[];
 for(let i=1;i<=90*1440;i++){
  a.c.step(state,a.r);b.c.step(replay,b.r);
  if(i%60===0){
   assert(a.c.audit(state).ok,'v13 Kern-Audit '+mode+'/'+seed+'/'+i);
   assert(b.c.audit(replay).ok);
   independentlyAudit(state);independentlyAudit(replay);
   assert.equal(a.c.hash(state),b.c.hash(replay),'stündlicher Replay-Hash');
   hours++;
  }
  if(i%1440===0){
   daily.push({day:i/1440,hash:a.c.hash(state)});
   if([20,45,90].includes(i/1440))checkpoints.push({day:i/1440,...calculateSnapshot(state,a.r)});
   if([3,30,90].includes(i/1440)){
    const saved=a.c.save(state),continued=a.c.load(saved,undefined,a.r);
    assert.equal(a.c.hash(continued),a.c.hash(state),'Save/Load Zustand');
    const other=b.c.load(b.c.save(replay),undefined,b.r);
    assert.equal(b.c.hash(other),b.c.hash(replay),'Replay Save/Load');
    // Für den aktuellen Test keine doppelte Produktionskalkulation im Test.
    roundtrips+=2;
   }
  }
 }
 assert.equal(hours,2160);
 assert.equal(roundtrips,6);
 if(mode==='control'){
  const final=checkpoints.at(-1);
  assert.equal(final.totalShortage,golden.totalShortage,'v12→v13 totale Fehlstunden');
  assert.equal(final.shortages.nahrung||0,golden.foodShortage);
  assert.equal(final.shortages.bauteil||0,golden.partsShortage);
  assert.equal(final.shortages.medikamente||0,golden.medicineShortage);
  assert.equal(state.stats.mangel.st_aldera.nahrung,golden.foodAldera);
  assert.equal(state.stats.mangel.st_dravos.nahrung,golden.foodDravos);
  assert.equal(final.minted,golden.minted);
  assert.equal(final.burned,golden.burned);
  const funds=Object.values(state.owners).filter(x=>x.kind==='fund').reduce((x,o)=>x+o.cash,0);
  const stations=Object.values(state.owners).filter(x=>x.kind==='station').reduce((x,o)=>x+o.cash,0);
  assert.equal(funds,golden.fundCash);
  assert.equal(stations,golden.stationsCash);
 }
 result.push({mode,sha:SHA(altered),initialHash,days:90,hours,roundtrips,checkpoints,daily});
 console.log('NO_RAID_90_CASE '+JSON.stringify({seed,mode,final:checkpoints.at(-1),hash:daily.at(-1).hash}));
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'seed-'+seed+'.json'),JSON.stringify({basis:BASE,seed,toolSha:SHA(fs.readFileSync(new URL(import.meta.url))),result})+'\n');
console.log('NO_RAID_90_PASS '+seed+' 2 Varianten, 180 Tage, 180 Tageshashes, 4320 stündliche Replay-/Audits');
