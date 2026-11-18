/* Read-only research harness around the ORIGINAL Rule204 world commands.
 * No production rule, rescue transfer or alternative buyer is installed.
 */
'use strict';
const assert=require('node:assert/strict');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const BASE='45d0a2cf6ad383556b629dab6bebbfc240671dfa';
function create(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 return j;
}
function verify(j){
 const w=j.weltReferenz(),s=j.zustandReferenz(),a=w.audit(s);
 assert.equal(a.ok,true,JSON.stringify(a));
 for(const key of ['isk','goods','w3','w4','w5','w5transfer'])assert.equal(a.wirtschaft[key].ok,true,key);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.ok(Object.values(s.owners).every(o=>Number.isSafeInteger(o.cash)&&o.cash>=0));
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 const copy=J8.erstellen();copy.oeffnen204(j.exportieren(),true);
 assert.equal(copy.exportieren(),j.exportieren());
 return a;
}
function snapshot(j,label){
 const w=j.weltReferenz(),s=j.zustandReferenz();verify(j);
 const assets=Object.values(s.ships).filter(x=>x.owner==='house').map(sh=>({
  id:sh.id,klasse:sh.klasse,heimat:sh.heimat,system:sh.system,phase:sh.phase,
  buchwert:w.buchwert(s,sh.id),verschleissMinuten:s.kanon.verschleiss[sh.id]||0}));
 return {label,tick:s.tick,spieltage:s.tick/1440,hash:w.hash(s),cash:s.owners.house.cash,
  pilotCash:s.owners.pilot_house.cash,equity:s.owners.house.cash+assets.reduce((n,x)=>n+x.buchwert,0),assets,
  owners:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
  stock:JSON.parse(JSON.stringify({aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager})),
  production:{ore:s.w3.geliefert,w3:s.w3.abgeschlossen,w4:s.w4.materialErzeugt,w5:s.w5.fertig},
  playerFreight:JSON.parse(JSON.stringify(s.kanon.spielerFrachten||{auftraege:[],lohn:0,gebuehr:0})),
  houseLedger:Object.fromEntries(Object.entries(s.kanon.buch.summen).filter(([k])=>k.includes('|house|')||k.endsWith('|house')))};
}
function run(){
 const j=create(),w=j.weltReferenz(),trace=[],points=[];
 const state=()=>j.zustandReferenz();
 function command(id){const r=j.ausfuehren(id);assert.equal(r.ok,true,JSON.stringify(r));trace.push({tick:state().tick,command:id,hash:w.hash(state())});verify(j);}
 function advance(n){j.weiterspielen(n);trace.push({tick:state().tick,advance:n,hash:w.hash(state())});verify(j);}
 const mark=label=>{const p=snapshot(j,label);points.push(p);return p;};
 mark('S02');for(let i=0;i<5;i++)advance(60);mark('produced');
 command('buy-st_nadir-frachter');
 const ship=Object.values(state().ships).find(sh=>sh.owner==='house'&&state().w5.schiffIds.includes(sh.id)).id;
 mark('purchased');
 for(let i=0;i<24&&!j.angebote().find(x=>x.id==='reposition-'+ship)?.ok;i++)advance(60);
 assert.equal(j.angebote().find(x=>x.id==='reposition-'+ship)?.ok,true);
 command('reposition-'+ship);
 assert.equal(state().w5ac.active.kosten,60);assert.equal(state().owners.w5ac_transfer_reserved.cash,60);
 advance(10);mark('ferry-in-transit');
 const midflight=J8.erstellen();midflight.oeffnen204(j.exportieren(),true);
 for(let i=0;i<5;i++){advance(10);midflight.weiterspielen(10);}
 assert.equal(midflight.exportieren(),j.exportieren(),'cold midflight continuation matches original arrival');
 const arrived=mark('arrived');assert.equal(state().ships[ship].system,'aldera');
 assert.ok(state().w5ac.completed.some(x=>x.id===ship&&x.owner==='house'&&x.kosten===60));
 command('buy-st_aldera-miner');const miner=Object.values(state().ships).find(x=>x.owner==='house'&&x.klasse==='miner').id;
 command('ice-'+miner);mark('mining-financed');
 const noGoodsSave=j.exportieren(),noGoods=j.ausfuehren('freight-'+ship);
 assert.equal(noGoods.ok,false);assert.match(noGoods.reason,/50er-Eischarge/);assert.equal(j.exportieren(),noGoodsSave);
 trace.push({tick:state().tick,command:'freight-'+ship,rejected:noGoods.reason,hash:w.hash(state())});
 for(let i=0;i<24&&!j.angebote().find(x=>x.id==='freight-'+ship)?.ok;i++)advance(60);
 const ready=mark('F4-offered');assert.ok(ready.stock.aldera.eis>=50);
 assert.equal(j.angebote().find(x=>x.id==='freight-'+ship)?.ok,true);
 const save=j.exportieren(),beforeHash=w.hash(state());let error;
 try{j.ausfuehren('freight-'+ship);}catch(e){error=e.message;}
 assert.match(error,/K1-Spielerfracht\/Vertragslohn/);
 trace.push({tick:state().tick,command:'freight-'+ship,rejected:error,hash:beforeHash});
 assert.equal(j.exportieren(),save,'failed session command must be atomic');
 // Inspect the original command on a disposable lawful clone only. Never advance,
 // repair, load or reuse its rejected economic state as a successful transport.
 const rejected=w.load(save),receipt=w.execute(rejected,{type:'shipFreightIce',owner:'house',schiff:ship});
 assert.equal(receipt.ok,true);const rejectedAudit=w.audit(rejected);
 assert.equal(rejectedAudit.ok,false);assert.equal(rejectedAudit.wirtschaft.ok,true);assert.equal(rejectedAudit.flug.ok,true);assert.ok(rejectedAudit.fehler.includes('K1-Spielerfracht/Vertragslohn'));
 assert.equal(rejected.owners.house.cash,ready.cash-120);
 assert.equal(rejected.owners.w5n_fracht_arbeit.cash,120);
 assert.equal(rejected.owners.w5n_fracht_kauf.cash,490);
 assert.equal(rejected.stations.st_aldera.lager.eis,ready.stock.aldera.eis-50);
 assert.throws(()=>w.save(rejected),/K1-Spielerfracht/);
 // Explicit artificial negative inputs ONLY: no test wallet is used in the run.
 const negatives={noGoods:noGoods.reason};
 for(const [name,mutate,pattern] of [
  ['buyerBudget',s=>{s.owners.export.cash+=s.owners.st_nadir.cash;s.owners.st_nadir.cash=0;},/Nadir kann/],
  ['workingCapital',s=>{s.owners.export.cash+=s.owners.house.cash;s.owners.house.cash=0;},/beide Fluege nicht vorfinanzieren/],
  ['shipCapacity',s=>{s.ships[ship].ladung.eis=1;},/leerer Frachter/]
 ]){const s=w.load(save);mutate(s);const h=w.hash(s),r=w.execute(s,{type:'shipFreightIce',owner:'house',schiff:ship});
  assert.equal(r.ok,false);assert.match(r.reason,pattern);assert.equal(w.hash(s),h);negatives[name]=r.reason;}
 const attacks=[s=>{s.owners.house.cash+=1;s.owners.st_nadir.cash-=1;},
  s=>{s.ships[ship].owner='transport';},s=>{s.ships[ship].heimat='aldera';},
  s=>{s.stations.st_aldera.lager.eis+=50;},s=>{s.w5ac.completed[0].kosten=0;},
  s=>{s.w5.schiffIds=[];},s=>{s.rulesVersion=207;},s=>{s.schema=99;}];
 for(const attack of attacks){const s=JSON.parse(save);attack(s);assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(s),true));assert.equal(j.exportieren(),save);}
 // A genuinely affordable action, executed in a separate branch of the same save.
 // It is NOT a freight workaround or proof of future demand.
 const alternative=J8.erstellen();alternative.oeffnen204(save,true);
 assert.equal(alternative.angebote().find(x=>x.id==='buy-st_aldera-miner')?.ok,true);
 assert.equal(alternative.ausfuehren('buy-st_aldera-miner').ok,true);
 const option=snapshot(alternative,'optional-second-miner');assert.equal(option.cash,ready.cash-600);
 const end=mark('blocked');assert.equal(end.playerFreight.auftraege.length,0);
 return {base:BASE,seed:42,rules:204,setup:['starten195(OLD.create(42, private195).export(), true)',
  'politikSetzen: stilllegung=true, betriebsreserve.werft_extern=1060','npcAutoSetzen(true)','npcSiliziumSetzen(true)'],
  ship,miner,trace,points,finalAudit:verify(j),blocked:{error,offered:true,
  completed:0,revenue:0,wages:0,wear:0,equityDelta:0,reason:'F4 audit requires Aldera home; lawful W5 hull retains Nadir provenance'},
  proposedButRejected:{laborEscrow:120,buyerEscrow:490,goods:50,audit:rejectedAudit},negatives,
  tamperedSavesRejected:attacks.length,alternative:option,finalSave:save,arrivalHash:arrived.hash};
}
module.exports={create,verify,snapshot,run};
if(require.main===module){const result=run();delete result.finalSave;console.log(JSON.stringify(result,null,2));}
