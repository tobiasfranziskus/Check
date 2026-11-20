/* ANALYSE: unchanged integrated Rule204, Seed42, 13 existing policies.
 * No player purchases, rescue commands or policy changes during a run.
 * node tools/w6-industrie-langzeit.cjs [S01..S13|alle] [days]
 */
'use strict';
const assert=require('node:assert/strict');
const W6=require('./w6-szenarien.cjs');
function start(sz){const r=W6.start(sz.politik);r.welt.npcSiliziumSetzen(r.s,true);return r;}
function independent(s,rules){
 const errors=[];
 const cash=Object.values(s.owners);
 if(cash.reduce((n,o)=>n+o.cash,0)!==33000||s.minted||s.burned)errors.push('money');
 if(cash.some(o=>!Number.isSafeInteger(o.cash)||o.cash<0))errors.push('cash');
 for(const [ware,e] of Object.entries(s.ledger)){
  const actual=[...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)]
   .reduce((n,l)=>n+(l[ware]||0),0);
  if(actual!==e.initial+e.mined+e.produced+e.imported-e.consumed-e.exported)errors.push('goods:'+ware);
 }
 if(rules)for(const id of ['house','npc3','transport','werft_extern']){
  const ledger=s.stats.konto[id],begin=rules.owners.find(o=>o.id===id).cash;
  let held=0;
  if(id==='transport')held=(s.owners.w3_arbeit_treuhand?.cash||0)
   +(s.owners.w5ac_transfer_reserved?.cash||0)+(s.owners.w5n_fracht_arbeit?.cash||0);
  if(id==='werft_extern')held=s.owners.w5_arbeit_treuhand?.cash||0;
  if(id==='house'||id==='npc3')held=Object.entries(s.erzpilotVertraege)
   .filter(([ship])=>s.ships[ship]?.owner===id)
   .reduce((n,[,contract])=>n+(s.owners[contract.arbeitsKonto]?.cash||0),0);
  // Derive additional net transfers from paired receipts, not kanon.netto or core.audit.
  let out=0;
  for(const [key,amount] of Object.entries(s.kanon.buch.summen)){
   const [,from,to]=key.split('|');if(from===id)out+=amount;if(to===id)out-=amount;
  }
  if(s.owners[id].cash+held!==begin+ledger.erloes-ledger.kosten-out)errors.push('account:'+id);
 }
 const ships=Object.values(s.ships);
 for(const type of ['miner','frachter','jaeger'])if(s.ledger[type]
  &&ships.filter(x=>x.klasse===type).length!==s.ledger[type].consumed)errors.push('ships:'+type);
 const receipts=s.w5ad?.purchases||[];
 for(const sh of ships){
  if(!s.owners[sh.owner])errors.push('owner:'+sh.id);
  // This experiment issues no player purchases or ownership transfers.
  if(sh.klasse==='miner'&&sh.owner!=='npc3'||sh.klasse==='frachter'&&sh.owner!=='transport')errors.push('scenario-owner:'+sh.id);
  const receipt=receipts.find(r=>r.id===sh.id);
  if(receipt&&sh.owner!=='transport')errors.push('receipt:'+sh.id);
 }
 if(new Set(receipts.map(r=>r.id)).size!==receipts.length)errors.push('duplicate-receipt');
 for(const r of receipts)if(!s.ships[r.id])errors.push('missing-ship:'+r.id);
 if(s.w5.fertig!==s.ledger.frachter.produced||s.w5.fertig-s.w5.verkauft!==s.stations.st_nadir.lager.frachter)errors.push('hull-stock');
 if(s.w4.gebucht-s.w4.gezahlt!==(s.owners.w4_arbeit_treuhand?.cash||0))errors.push('refinery-escrow');
 if(s.w5.arbeitsGebunden-s.w5.arbeitsGezahlt!==(s.owners.w5_arbeit_treuhand?.cash||0))errors.push('yard-escrow');
 const c=s.w4.materialErzeugt;
 if(c!==5*s.w4.abgeschlossen||s.w4.erzVerbraucht!==10*s.w4.abgeschlossen)errors.push('refinery');
 if(s.ledger.material.consumed!==s.w5.materialVerbraucht+(s.kanon.minerWerft?.materialVerbraucht||0)
  +(s.kanon.bauteile?.materialVerbraucht||0)+(s.kanon.jaeger?.materialVerbraucht||0))errors.push('material-use');
 return errors;
}
function audit(w,s){assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s)));assert.deepEqual(independent(s,w.rules),[]);}
function snapshot(w,s){
 const b=w.bericht(s),ships=Object.values(s.ships),n=s.stations.st_nadir.lager;
 return {day:s.tick/1440,hash:w.hash(s),w3:s.w3.abgeschlossen,ore:s.w3.geliefert,w4:s.w4.abgeschlossen,
  material:s.w4.materialErzeugt,w5:s.w5.fertig,sold:s.w5.verkauft,miner:(s.kanon.minerWerft?.fertig||0),
  fighter:s.kanon.jaeger.fertig,replacements:s.kanon.ersatzkaeufe,
  stock:{aldera:s.stations.st_aldera.lager,nadir:n},
  cash:Object.fromEntries(['npc3','transport','st_aldera','st_nadir','werft_extern','house','export'].map(k=>[k,s.owners[k].cash])),
  ownerCash:Object.fromEntries(Object.entries(s.owners).map(([k,o])=>[k,o.cash])),
  worldCash:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),mint:s.minted,burn:s.burned,
  fleet:{total:ships.filter(x=>x.owner==='transport').length,
   viable:ships.filter(x=>x.owner==='transport'&&w.buchwert(s,x.id)>0).length,
   ready:ships.filter(x=>x.owner==='transport'&&w.buchwert(s,x.id)>0&&x.system==='aldera'&&x.phase==='dock'&&x.auftrag==='halten').length},
  quotes:{refine:w.kern.pilotW4Kalkulation(s),build:w.kern.pilotW5Kalkulation(s)},
  flows:{orePurchases:s.w3.kaufAusgaben,oreFreightRevenue:s.w3.frachtUmsatz,
   oreFreightWages:s.w3.arbeitsKosten,refineryWages:s.w4.gezahlt,
   yardMaterials:s.w5.materialUmsatz,yardWages:s.w5.arbeitsGezahlt,
   carrierHullPayments:s.w5ad.purchases.reduce((n,r)=>n+r.preis,0),
   ferryAllocated:s.w5ac.allocated,ferryPaid:s.w5ac.paid},
  wages:b.loehne,waterRevenue:b.verkaeufe.wasserErloes,
  firstRecordedGate:s.kanon.engpass?.erster||null,
  gates:s.kanon.engpass?.zaehler||{},pauses:s.kanon.npc.pausen};
}
function run(sz,days){
 const {welt:w,s}=start(sz),initial=w.save(s),checkpoints=[],daily=[];
 const firstGates={};
 let previous=[0,0,0],lastProgress={w3:0,w4:0,w5:0};
 for(let day=1;day<=days;day++){
  w.advance(s,1440);
  for(const reason of Object.keys(s.kanon.engpass?.zaehler||{}))if(!firstGates[reason])firstGates[reason]={observedByDay:day};
  const counts=[s.w3.abgeschlossen,s.w4.abgeschlossen,s.w5.fertig];
  ['w3','w4','w5'].forEach((k,i)=>{if(counts[i]>previous[i])lastProgress[k]=day;});previous=counts;
  daily.push({day,w3:counts[0],w4:counts[1],w5:counts[2],sold:s.w5.verkauft});
  if(day===14||day%30===0||day===365||day===days){
   audit(w,s);assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
   checkpoints.push(structuredClone(snapshot(w,s)));
   if(process.env.W6_PROGRESS==='1')process.stderr.write(`${sz.id} day ${day}/${days}: ${w.hash(s)} W3=${s.w3.abgeschlossen} W4=${s.w4.abgeschlossen} W5=${s.w5.fertig}\n`);
  }
 }
 return {result:{id:sz.id,name:sz.name,seed:42,rules:s.rulesVersion,policy:sz.politik,days,
  initialHash:w.hash(w.load(initial)),firstGates,lastProgress,checkpoints,daily},w,s,initial};
}
function trace(sz,days=15){
 const {welt:w,s}=start(sz),seen=new Set(),events=[];
 for(let t=0;t<days*1440;t++){
  w.advance(s,1);
  for(const reason of Object.keys(s.kanon.engpass?.zaehler||{})){
   if(seen.has(reason))continue;seen.add(reason);
   events.push({tick:s.tick,reason,state:structuredClone(snapshot(w,s))});
  }
 }
 audit(w,s);return events;
}
module.exports={start,run,trace,audit,independent,snapshot};
if(require.main===module){
 const id=process.argv[2]||'alle',days=Number(process.argv[3]||90);
 if(id==='trace'){console.log(JSON.stringify(trace(W6.SZENARIEN[1],days)));process.exit(0);}
 assert.ok(Number.isSafeInteger(days)&&days>0);
 const scenarios=W6.SZENARIEN.filter(s=>id==='alle'||s.id===id);assert.ok(scenarios.length);
 for(const sz of scenarios)console.log(JSON.stringify(run(sz,days).result));
}
