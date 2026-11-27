'use strict';
// Separate explicit CI entry point, using a real pinned old checkout (not
// editing a version field to pretend that the new engine is the old build).
const assert=require('node:assert/strict');
const path=require('node:path');
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const {SZENARIEN,start,pruefen,kennzahlen}=require('../tools/w6-szenarien.cjs');
const cap={carrierCash:2000,buyerCash:4000};
function audit(w,s){assert.deepEqual(pruefen(w,s),[]);}
function roundtrip(w,s){audit(w,s);const json=w.save(s);assert.equal(w.save(w.load(json)),json);return json;}
function execute(w,s,cmd){const a=w.execute(s,cmd);assert.equal(a.ok,true,cmd.type+': '+a.reason);}
function fixture(w){
 const s=w.createState(42);
 execute(w,s,{type:'shipShuttleStop',owner:'npc3',schiff:'sh001'});
 w.advance(s,50);
 for(const cmd of [
  {type:'industrialOreOffer',owner:'st_nadir',miner:'sh001',frachter:'sh002'},
  {type:'industrialOreAcceptMine',owner:'npc3'},
  {type:'industrialOreAcceptFreight',owner:'transport'},
  {type:'industrialOreAcceptYard',owner:'werft_extern'},
  {type:'industrialOreCommit',owner:'st_nadir'}
 ])execute(w,s,cmd);
 return s;
}
function compareGenesis(a,b){
 const A=JSON.parse(a),B=JSON.parse(b);
 assert.equal(A.rulesVersion,204);assert.equal(B.rulesVersion,208);
 delete A.rulesVersion;delete B.rulesVersion;assert.deepEqual(B,A);
}
function compat(oldDirectory){
 const oldRoot=path.resolve(oldDirectory);
 assert.notEqual(oldRoot,path.resolve(__dirname,'..'));
 const OldW=require(path.join(oldRoot,'prototypes/welt/welt-kern.js'));
 const OldJ8=require(path.join(oldRoot,'prototypes/verbund/konzern-session.js'));
 const OldSource=require(path.join(oldRoot,'prototypes/w5ac/session.js'));
 assert.equal(OldW.erstellenNpcErz208,undefined);
 const legacy=OldW.erstellenJ4c(cap),current=W.erstellenJ4c(cap),revised=W.erstellenNpcErz208(cap);
 let a=fixture(legacy),b=fixture(current),c=fixture(revised);
 const checkpoints=[];
 for(const tick of [50,84,119,120,121,240,241,360]){
  legacy.advance(a,tick-a.tick);current.advance(b,tick-b.tick);revised.advance(c,tick-c.tick);
  const x=roundtrip(legacy,a),y=roundtrip(current,b),z=roundtrip(revised,c);
  assert.equal(y,x,'Rule204 bytes at '+tick);
  assert.equal(current.hash(b),legacy.hash(a));
  assert.equal(current.save(current.load(x)),x);
  assert.equal(legacy.save(legacy.load(y)),y);
  assert.throws(()=>legacy.load(z),/Regelversion/);
  assert.throws(()=>revised.load(x),/Regelversion/);
  assert.throws(()=>OldJ8.erstellen().oeffnen204(z,true),/Regel204/);
  if(tick===120){
   assert.equal(current.hash(b),'61c7c97961fad4ac');
   assert.equal(b.ledger.erz.exported,50);
   assert.equal(c.ledger.erz.exported,0);
   assert.equal(c.w3.auftrag.npcErzReserviert,50);
  }
  if(tick===121){assert.equal(b.w3.auftrag.phase,'vorbestellt');assert.equal(c.w3.auftrag.phase,'hin');}
  if(tick===241){assert.ok(c.w3.abgeschlossen>=1);}
  checkpoints.push({tick,oldHash:legacy.hash(a),current204Hash:current.hash(b),new208Hash:revised.hash(c),
   oldExport:b.ledger.erz.exported,newExport:c.ledger.erz.exported,oldPhase:b.w3.auftrag?.phase??null,newPhase:c.w3.auftrag?.phase??null});
  a=legacy.load(x);b=current.load(y);c=revised.load(z);
 }
 for(const s02 of [false,true]){
  const j=OldJ8.erstellen(),n=J8.erstellen(),l=J8.erstellen();
  j.starten195(OldSource.create(42,'private195').export(),true);
  l.starten195(OLD.create(42,'private195').export(),true);
  if(s02)for(const x of [j,l]){
   const w=x.weltReferenz(),s=x.zustandReferenz();
   w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
   w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
  }
  n.starten208(true,s02);
  assert.equal(j.exportieren(),l.exportieren());
  compareGenesis(l.exportieren(),n.exportieren());
  assert.throws(()=>OldJ8.erstellen().oeffnen204(n.exportieren(),true),/Regel204/);
  assert.throws(()=>J8.erstellen().oeffnen208(j.exportieren(),true),/Regel208/);
 }
 console.log('RULE208_ACTUAL_OLD_BUILD',JSON.stringify({oldRoot,checkpoints,oldReplayByteEqual:true,oldLoaderRejectsNew:true,newLoaderRejectsOld:true}));
}
function longterm(id,days){
 const sz=SZENARIEN.find(x=>x.id===id);
 assert.ok(sz&&Number.isSafeInteger(days)&&days>0);
 const source=start(sz.politik);
 const j=J8.erstellen();j.starten208(true,false);
 const w=j.weltReferenz();let s=j.zustandReferenz();
 w.politikSetzen(s,sz.politik);w.npcAutoSetzen(s,true);
 // Same W6 policy, same initial endowments, only new rule number and
 // reservation semantics. No changes to the existing W6 scenario tool.
 compareGenesis(source.welt.save(source.s),w.save(s));
 const reports=[];
 const checkpoints=[7,30,90,365,days];
 for(let day=30;day<days;day+=30)checkpoints.push(day);
 for(const day of [...new Set(checkpoints)].filter(x=>x<=days).sort((a,b)=>a-b)){
  w.advance(s,day*1440-s.tick);
  const json=roundtrip(w,s);s=w.load(json);
  reports.push({day,hash:w.hash(s),...kennzahlen(w,s),worldMoney:w.bericht(s).weltgeld,
   minted:s.minted,burned:s.burned,w3:s.w3.auftrag,industry:s.kanon.industrieErz});
 }
 assert.equal(s.tick,days*1440);
 console.log('RULE208_LONGTERM',JSON.stringify({version:208,scenario:id,days,reports,
  scope:'same original W6 policies, new revision, no forced solvency or artificial trade'}));
}
const [mode,arg,days]=process.argv.slice(2);
if(mode==='compat')compat(arg);
else if(mode==='longterm')longterm(arg,Number(days));
else throw Error('usage: compat OLD_CHECKOUT | longterm SCENARIO DAYS');
