// 13 different policies AFTER the real player hull purchase and paid ferry.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{supply}=require('./k13-f7-vorbereitung.cjs');
const profiles=[{}, {automatik:false}, {ersatzkauf:false}, {stilllegung:true},
 {rueckfracht:false}, {eisfracht:false}, {wasserwerk:false},
 {sparquoteStandard:1000}, {sparquoteStandard:300},
 {ausschuettung:{npc3:0,transport:0,st_aldera:0,st_nadir:0,werft_extern:0}},
 {wasserZielAldera:0}, {ersatzVorlaufProzent:80}, {bedarfJeTag:1}];
test('F7: 13 economic policies × 90 days after funded player purchase/ferry',async()=>{
 const {w,s}=await supply(42);
 const execute=c=>{const r=w.execute(s,c);assert.equal(r.ok,true,JSON.stringify(r));};
 execute({type:'shipBuy',owner:'house',klasse:'frachter',station:'st_nadir'});
 const id=s.kanon.spielerFrachterKaeufe.at(-1).id;
 execute({type:'shipReposition',owner:'house',schiff:id});w.advance(s,60);
 const save=w.save(s);
 for(const [index,profile] of profiles.entries()){
  const z=w.load(save);w.politikSetzen(z,{automatik:true,ersatzkauf:true,eisfracht:true,...profile});
  for(let day=0;day<90;day++){
   w.advance(z,1440);
   assert.equal(w.audit(z).ok,true,JSON.stringify({index,day,audit:w.audit(z)}));
   assert.equal(Object.values(z.owners).reduce((n,o)=>n+o.cash,0),33000);
   assert.equal(z.minted,0);assert.equal(z.burned,0);
  }
  const replay=w.load(w.save(z));w.minute(z);w.minute(replay);
  assert.equal(w.hash(replay),w.hash(z));
  console.log('F7_90D '+JSON.stringify({index,hash:w.hash(z),tick:z.tick,worldMoney:33000}));
 }
});
