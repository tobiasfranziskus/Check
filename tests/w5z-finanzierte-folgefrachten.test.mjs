import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import W3 from '../prototypes/w5y/original-w3-core.js';
import Session from '../prototypes/w5y/session.js';

const {core}=W3;
const total=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
function audit(snapshot,n,phase='frei'){
 const s=snapshot.state, w=s.w3, inFlight=phase!=='frei', back=phase==='rueck';
 assert.equal(core.audit(s).ok,true);
 assert.equal(core.pilotW3Stand(s).ok,true);
 assert.equal(core.pilotWirtschaftsStand(s).ok,true);
 assert.equal(snapshot.audit.ok,true);
 assert.equal(snapshot.freight.audit.ok,true);
 assert.equal(total(s),33000,'independent full sum of current owner cash');
 assert.equal(s.minted,0);
 assert.equal(w.beauftragt,n+Number(inFlight));
 assert.equal(w.abgeschlossen,n);
 assert.equal(w.kaufAusgaben,740*(n+Number(inFlight)));
 assert.equal(s.owners.st_nadir.cash,4000-w.kaufAusgaben,'finite Nadir buyer cash');
 assert.equal(w.geliefert,50*(n+Number(back)));
 assert.equal(s.stations.st_nadir.lager.erz,w.geliefert);
 assert.equal(w.frachtUmsatz,240*n);
 assert.equal(w.arbeitsKosten,120*n+(back?60:0));
 assert.equal(s.owners.fonds_transport.cash,w.arbeitsKosten);
 assert.equal(s.owners.transport.cash,1250+120*n-(inFlight?120:0));
 assert.equal(s.owners.w3_kauf_treuhand?.cash??0,phase==='hin'?740:back?240:0);
 assert.equal(s.owners.w3_arbeit_treuhand?.cash??0,phase==='hin'?120:back?60:0);
 assert.equal(snapshot.freight.audit.status,phase);
 if(!inFlight)assert.equal(w.auftrag,null);
}

test('W5z: 13 RNG seeds, five original paid 50-ore return voyages, sixth order genuinely buyer-finance-blocked',()=>{
 const seeds=[42,7,1,2,3,4,5,6,8,9,11,123,3301],hashes=[];
 for(const seed of seeds){
  const session=Session.create(seed);
  assert.equal(session.snapshot().state.ledger.erz.initial,0,'no initial free ore');
  assert.equal(session.command({type:'freightBuy'}).ok,true);
  assert.equal(session.snapshot().state.owners.transport.cash,1250,'real 750-ISK hull sale');
  session.advance(50);
  assert.equal(session.snapshot().state.stations.st_aldera.lager.erz,50,'ore mined in original core');
  for(let n=0;n<5;n++){
   const before=session.snapshot(),saved=session.export();
   audit(before,n);
   assert.equal(before.freight.quote.ok,true);
   assert.equal(before.freight.shipId,'sh002');
   assert.ok(before.state.stations.st_aldera.lager.erz>=50,'genuine next cargo');
   const quote=session.preview({type:'freightStart',schiff:'sh002'});
   assert.equal(quote.ok,true);
   assert.equal(quote.nadirBefore-quote.nadirAfter,740);
   assert.equal(quote.carrierBefore-quote.carrierAfter,120);
   assert.equal(session.export(),saved,'preview never moves goods or money');
   assert.equal(session.command({type:'freightStart'}).ok,true);
   audit(session.snapshot(),n,'hin');
   const pendingHash=session.snapshot().hash;
   assert.equal(session.command({type:'freightStart'}).ok,false,'no duplicate booking');
   assert.equal(session.snapshot().hash,pendingHash,'failed concurrent booking is atomic');
   session.advance(60);audit(session.snapshot(),n,'rueck');
   if(seed===42||seed===7){
    const replay=Session.create(seed);
    replay.import(session.export());
    assert.equal(replay.snapshot().hash,session.snapshot().hash,'midflight save/load hash');
    replay.advance(60);
    const original=Session.create(seed);
    original.import(session.export());original.advance(60);
    assert.equal(replay.snapshot().hash,original.snapshot().hash,'two replayed returns deterministic');
   }
   session.advance(60);audit(session.snapshot(),n+1);
  }
  const last=session.snapshot(),json=session.export(),hash=last.hash;
  assert.equal(last.state.tick,650);
  assert.equal(last.state.w3.abgeschlossen,5);
  assert.equal(last.state.stations.st_nadir.lager.erz,250);
  assert.equal(last.state.owners.st_nadir.cash,300);
  assert.equal(last.state.owners.transport.cash,1850);
  assert.equal(last.state.owners.export.cash,15500,'foreign credit cannot fund Nadir buyer');
  assert.equal(last.state.stations.st_aldera.lager.erz,100,'physical sixth cargo available');
  assert.equal(last.freight.quote.ok,false);
  assert.match(last.freight.quote.grund,/Kaeufer kann Ware/);
  assert.deepEqual(session.command({type:'freightStart'}),{ok:false,reason:last.freight.quote.grund});
  assert.equal(session.export(),json,'sixth failure must not book or mint');
  const fake=JSON.parse(json);
  fake.owners.st_nadir.cash+=440;fake.owners.export.cash-=440;
  assert.equal(total(fake),33000,'forged balance transfer preserves world sum but not ownership rights');
  assert.throws(()=>session.import(JSON.stringify(fake)),/Audit|audit|W3|unbelegt|finanz|Original/);
  assert.equal(session.snapshot().hash,hash,'forged import leaves world unchanged');
  hashes.push(hash);
  if(seed===42||seed===7)console.log('W5Z_FIVE_REAL_VOYAGES '+JSON.stringify({
   seed,hash,ore:250,nadirSpent:3700,nadirRemaining:300,
   ship:'sh002',carrierCash:1850,workPaid:600,freightPaid:1200,worldMoney:33000}));
 }
 assert.equal(hashes.length,13);
 assert.equal(new Set(hashes).size,13,'seed-dependent deterministic hashes differ');
 console.log('W5Z_MATRIX '+JSON.stringify({rngSeeds:13,originalCoreVoyages:65,distinctEconomicRegimes:1,worldMoney:33000}));
});

test('W5z: source goods and destination cash are both independently necessary',()=>{
 const session=Session.create(42);
 session.command({type:'freightBuy'});
 session.advance(60);
 const before=session.snapshot();
 assert.equal(before.state.stations.st_aldera.lager.erz,0);
 assert.equal(before.state.owners.st_nadir.cash,4000);
 assert.match(before.freight.quote.grund,/Erzcharge/);
 const hash=before.hash;
 assert.equal(session.command({type:'freightStart'}).ok,false);
 assert.equal(session.snapshot().hash,hash);
});

test('W5z: UI demand message uses original W3 refusal, never a local price or transfer',()=>{
 const html=readFileSync(new URL('../prototypes/w5y/index.html',import.meta.url),'utf8');
 const ext=readFileSync(new URL('../prototypes/w5y/extension.js',import.meta.url),'utf8');
 assert.match(html,/id="freight-demand-gate"/);
 assert.match(ext,/freight-demand-gate/);
 assert.match(ext,/q\.grund/);
 assert.doesNotMatch(ext,/s\.owners\.st_nadir\.cash\s*[-+]=/);
 assert.doesNotMatch(ext,/s\.owners\.export\.cash\s*[-+]=/);
 assert.doesNotMatch(ext,/\.advance\(/);
});
