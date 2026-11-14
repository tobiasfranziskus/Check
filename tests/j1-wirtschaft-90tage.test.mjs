import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {supply}=require('./k13-f7-vorbereitung.cjs');
const {inspect,loadChecked}=require('../prototypes/welt/j1-wirtschaftsaudit.cjs');
// Policies only; no stock, cash or ship injections. Existing real K7 industry first.
const profiles=[
 ['basis',{}],['pause',{automatik:false}],['kein-ersatz',{ersatzkauf:false}],
 ['stilllegung',{stilllegung:true}],['keine-rueckfracht',{rueckfracht:false}],
 ['keine-eisfracht',{eisfracht:false}],['kein-wasserwerk',{wasserwerk:false}],
 ['sparen-1000',{sparquoteStandard:1000}],['sparen-300',{sparquoteStandard:300}],
 ['keine-dividenden',{ausschuettung:{npc3:0,transport:0,st_aldera:0,st_nadir:0,werft_extern:0}}],
 ['wasserziel-0',{wasserZielAldera:0}],['ersatz-80',{ersatzVorlaufProzent:80}],
 ['bedarf-1',{bedarfJeTag:1}],
];
test('J1 blocker matrix: 13 economic policies × 90 days, no completed fighter scenario',async()=>{
 const {w,s}=await supply(42), start=w.save(s);
 for(const [name,policy] of profiles){
  const z=loadChecked(w,start);
  w.politikSetzen(z,{automatik:true,ersatzkauf:true,eisfracht:true,...policy});
  const replay=loadChecked(w,w.save(z));
  for(let day=1;day<=90;day++){
   w.advance(z,1440);w.advance(replay,1440);
   const r=inspect(w,z);
   assert.equal(r.audit.ok,true,JSON.stringify({name,day,audit:r.audit}));
   assert.equal(r.audit.money,33000);
   assert.deepEqual(r.fighters,[]);
   assert.deepEqual(r.missingGoods,['silizium','bauteil','jaeger']);
   assert.equal(w.hash(z),w.hash(replay),`${name}: day ${day} replay`);
  }
  assert.equal(w.hash(loadChecked(w,w.save(z))),w.hash(z));
  console.log('J1_90D '+JSON.stringify({name,tick:z.tick,hash:w.hash(z),money:33000,
   fighters:0,completedSorties:0,status:'BLOCKED'}));
 }
});
