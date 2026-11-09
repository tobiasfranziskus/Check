import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Isolated Node research registration. Never loaded by index.html or browser storage.
export const PROFILE='aphros-research:C1b-1:water-v1';
export const RULE_VERSION=3301;
export const WAGES_PROFILE='aphros-research:C1c-1:earned-industry-wages-v1';
export const PARTS_PROFILE='aphros-research:C1c-2:paid-component-v1';
export const STORAGE_PROFILE='aphros-research:C1c-3:timed-silicon-storage-v1';
export const DELIVERY_PROFILE='aphros-research:C1d-1:physical-delivery-no-mint-v1';
export const EXPORT_PROFILE='aphros-research:C1d-2:once-only-bounded-acceptance-v1';
export const BUNDLE_PROFILE='aphros-research:C1d-3:three-paid-storage-freight-lot-v1';
export const FINANCED_PROFILE='aphros-research:C1d-4:four-paid-storage-preorder-v1';
export const TITLE_PROFILE='aphros-research:C1d-5:owner-custody-storage-v1';
export const FOLLOWUP_PROFILE='aphros-research:C1d-7:post-settlement-journals-v1';
export const SECOND_BATCH_PROFILE='aphros-research:C1d-8:second-real-manufacturing-v1';
export const SECOND_EXPORT_PROFILE='aphros-research:C1d-8b:second-paid-delivery-v1';
export const INTERNAL_DEMAND_PROFILE='aphros-research:C1d-10:paid-station-capacity-v1';
const SOURCE_SHA='aef423e27fb9247d7c9eef63e4a95014cc08a5509a056888c0fac3fa46cf70bd';
const sha=x=>createHash('sha256').update(x).digest('hex');
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const check=(ok,message)=>{if(!ok)throw Error('C1b-1: '+message);};

// One bounded registration path; never accept arbitrary rule callbacks or patched audits.
export function createResearchCore({profile=PROFILE}={}){
 check([PROFILE,'aphros-research:C1b-2:material-precursor-v1',WAGES_PROFILE,PARTS_PROFILE,STORAGE_PROFILE,DELIVERY_PROFILE,EXPORT_PROFILE,BUNDLE_PROFILE,FINANCED_PROFILE,TITLE_PROFILE,FOLLOWUP_PROFILE,SECOND_BATCH_PROFILE,SECOND_EXPORT_PROFILE,INTERNAL_DEMAND_PROFILE].includes(profile),'unbekanntes Forschungsprofil');
 const precursor=profile!==PROFILE;
 const partsFlow=profile===PARTS_PROFILE;
 const internalDemandFlow=profile===INTERNAL_DEMAND_PROFILE;
 const secondExportFlow=profile===SECOND_EXPORT_PROFILE||internalDemandFlow;
 const secondBatchFlow=profile===SECOND_BATCH_PROFILE||secondExportFlow;
 const followupFlow=profile===FOLLOWUP_PROFILE||secondBatchFlow;
 const titleFlow=profile===TITLE_PROFILE||followupFlow;
 const fundedFlow=profile===FINANCED_PROFILE||titleFlow;
 const bundleFlow=profile===BUNDLE_PROFILE||fundedFlow;
 const exportFlow=profile===EXPORT_PROFILE;
 const deliveryFlow=profile===DELIVERY_PROFILE||exportFlow||bundleFlow;
 const storageFlow=profile===STORAGE_PROFILE||deliveryFlow;
 const wageFlow=profile===WAGES_PROFILE||partsFlow||storageFlow;
 const version=internalDemandFlow?3314:secondExportFlow?3313:secondBatchFlow?3312:followupFlow?3311:titleFlow?3310:fundedFlow?3309:bundleFlow?3308:exportFlow?3307:deliveryFlow?3306:storageFlow?3305:partsFlow?3304:wageFlow?3303:precursor?3302:RULE_VERSION;
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 check(sha(html)===SOURCE_SHA,'unbekannte Core-Basis');
 const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
 const boundary=source.indexOf('const m_core_index =');
 check(boundary>0,'Core-Registrierungsgrenze fehlt');
 // Insert a registration callback at a module boundary, without rewriting core functions.
 // Only this fresh private module instance receives aliases for legacy audit dispatch.
 const core=Function('register',source.slice(0,boundary)+`
 register({data:m_data_erzpilot,freeze:m_data_systeme.tiefFrieren,
  water:m_core_w5n,income:m_core_w5o,trade:m_core_handel,state:m_core_state,
  base:m_data_rules.RULES});
 `+source.slice(boundary)+`
return {api:m_core_index,serialize:m_core_serialize,
  trade:m_core_handel,w3:m_core_w3,water:m_core_w5n,income:m_core_w5o,wages:m_core_w5s,parts:m_core_w5b};`)(modules=>register(modules,{profile,version,precursor,wageFlow,partsFlow,storageFlow,deliveryFlow,exportFlow,bundleFlow,fundedFlow,titleFlow,followupFlow,secondBatchFlow,secondExportFlow,internalDemandFlow}));
 const rules=core.api.W5R_RULES;
 const fingerprint=sha(core.serialize.save(rules));
 function identity(s){
  check(s?.schema===8&&s.rulesVersion===version&&s.c1b?.profile===profile,'Profilwechsel verboten');
  check(s.c1b.rules===fingerprint,'Regel-Fingerprint falsch');
  check(s.w5o.mode==='wages'&&s.w5o.minerOwner==='npc3','Einkommensprofil falsch');
  check((wageFlow?!!s.w5s:!s.w5s)&&s.w5q.mode==='off'&&['rate','dayCap','totalCap','exported','minted','payout','stationNet'].every(k=>s.w5q[k]===0)
   &&s.w5q.events.length===0&&s.minted===(exportFlow?(s.c1e?.minted??-1):0)
   &&s.burned===0&&(!fundedFlow||!!s.c1f&&!s.c1e),'Nur belegte C1d-2-Forschungsemission erlaubt');
 }
 function audit(s){
  try{
   identity(s);const base=core.api.audit(s);
   check(base.ok,'Core-Audit '+JSON.stringify(Object.fromEntries(Object.entries(base).filter(([,v])=>v?.ok===false))));
   check(foerderAudit(s),'Arbeitsbelege');check(nachfrageAudit(s),'Nachfragebelege');
   if(wageFlow)check(lohnAudit(s,rules),'wirklich verdiente W3/W4-Loehne');
   if(partsFlow)check(bauteilAudit(s,rules),'bezahlt erzeugtes Bauteil');
   if(storageFlow){
    const original=core.parts.audit(s,rules);
    check(original.ok,'W5b-Originalaudit '+JSON.stringify(original));
    check(lagerAudit(s,rules),'Waren-/Arbeitsminuten fuer zwei Bauteile und Lager');
   }
   if(deliveryFlow){
    check(core.api.audit(s).c1d?.ok===true,'originaler C1d Transport-/Eigentumsaudit');
    check(deliveryAudit(s,rules),'zusaetzliches unabhaengiges C1d-Geldaudit');
    if(bundleFlow)check(bundleAudit(s,rules),'echte Lagermodule nur aus bezahlten Auftraegen');
    if(fundedFlow){
      check(core.api.audit(s).c1f?.ok===true,'Original-C1d-4-Kaeufervertrag');
      check(financedAudit(s,rules),'unabhaengige Kaufgeld-/Treuhand-/Warenbelege');
      if(titleFlow)check(bauteilTitelAudit(s,rules),'unabhaengige W5b-Bauteil-Titel-/Verwahrbelege');
      if(secondExportFlow)check(secondFundingAudit(s,rules),'unabhaengiger zweiter C1f/C1d-Kauf- und Frachtbeleg');
       if(internalDemandFlow)check(stationDemandAudit(s,rules),'Nadir-Budget, echte neunte Ware und produktiver Moduleinbau');
    }
   }
   if(exportFlow){
    check(core.api.audit(s).c1e?.ok===true,'Core-Abnahmeaudit');
    check(exportAudit(s,rules),'unabhaengige Originalwaren-/Emissionsbelege');
   }
   check(Object.values(s.owners).every(o=>integer(o.cash)),'ungueltiges Geld');
   for(const obj of [...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung),...Object.values(s.ledger)])
    check(Object.values(obj).every(integer),'ungueltige Waren');
   check(s.initialSupply===33000&&integer(s.tick),'Startgeld/Tick');
   const purchaseIds=s.w5r.purchases.map(x=>x.id);
   check(new Set(purchaseIds).size===purchaseIds.length,'doppelter Hüllenkauf');
   return {...base,c1b:{ok:true},ok:true};
  }catch(e){return {ok:false,reason:e.message};}
 }
 function validate(s){const result=audit(s);check(result.ok,result.reason);return s;}
 function save(s){validate(s);return core.api.save(s);}
 function load(json){
  const raw=JSON.parse(json);identity(raw);
  const s=core.serialize.load(json,core.serialize.MIGRATIONS,8,version,{});
  return validate(s);
 }
 const allowed=new Set([...(precursor?['shipFreight','stationRefine']:[]),...(partsFlow||storageFlow?['stationBuildParts']:[]),...(storageFlow?['stationBuildStorage']:[]),...(deliveryFlow?['shipCapitalFreight']:[]),...(exportFlow?['stationExportReserve','stationExportAccept']:[]),...(fundedFlow?['stationPrepayStorage','stationAcceptStorage']:[]),
 ...(secondExportFlow?['stationPrepayStorageSecond','stationAcceptStorageSecond','shipCapitalFreightSecond']:[]),...(internalDemandFlow?['stationInstallPaidStorage']:[]),'shipMine','shipWait','shipSellIce','shipFreightIce','stationWater','shipBuy']);
 function execute(s,cmd){
  identity(s);check(allowed.has(cmd?.type),'Befehl ausserhalb des Wasserprofils');
  return core.api.execute(s,cmd,rules);
 }
 function step(s){
  identity(s);check(s.queue.length===0,'nur unmittelbare validierte Forschungsbefehle');
  core.api.step(s,rules);return s;
 }
 function create(seed=42){
  const s=core.api.createW5RState(seed,'wages','npc3','off',0,0,0);
  s.c1b={profile,rules:fingerprint,mining:{},demand:[]};
  if(wageFlow)s.w5s={allocated:0,paid:0,active:null,completed:[],industryWages:{paid:{},events:[]}};
  if(storageFlow){
   s.w5b.lagerBegonnen=0;s.w5b.lagerFertig=0;
   const stored=s.stations.st_nadir.lager.lager||0;
   s.stations.st_nadir.lager.lager=0;
   s.ledger.lager ||= {initial:0,mined:0,produced:0,consumed:0,imported:0,exported:0};
   s.ledger.lager.initial-=stored;
  }
  return validate(s);
 }
 // C1d-11 research-only read quote. No issuing orders or mutating state.
 // All prices, freight costs and physical capacity from the SAME original Core.
 function stationInvestmentQuote(s){
  check(internalDemandFlow,'nur C1d-10 station investment research');
  validate(s);
  const c=rules.c1g,account=s.owners[c.buyer].cash,
    unitCost=c.unitPrice,
    freight=core.w3.kalkulation(rules),
    ore=s.stations[c.station].lager.erz,
    capacity=core.trade.obergrenze(s,rules,c.station,'erz'),
    incoming=rules.w3.fracht,
    physicallyNeeded=ore+incoming>capacity,
    availableOre=s.stations[rules.w3.quellStation].lager.erz,
    ownedOre=s.w5h?.bestand??0,
    carrier=Object.values(s.ships).find(x=>x.owner===rules.w3.spedition&&x.klasse==='frachter'),
    actualW3=carrier?core.w3.pruefen(s,rules,carrier):{ok:false,grund:'Frachter fehlt'};
  return Object.freeze({
   tick:s.tick,station:c.station,
   capacity,stock:ore,remainingCapacity:capacity-ore,upcomingUnits:incoming,
   capacityBottleneck:physicallyNeeded,
   cash:account,unitPrice:unitCost,w3ContractCost:freight.gesamt,
   cashAfterInvestment:account-unitCost,
   fundsForW3Before:account>=freight.gesamt,
   fundsForW3After:account-unitCost>=freight.gesamt,
   currentOreSourceUnits:availableOre,ownedOre,
   originalW3Available:actualW3.ok,w3BlockReason:actualW3.ok?null:actualW3.grund,
   justifiedAutomaticPurchase:!s.c1g?.installed&&physicallyNeeded
     &&availableOre>=incoming&&ownedOre>=incoming
     &&account>=unitCost+freight.gesamt,
  });
 }
 return Object.freeze({profile,rules,fingerprint,create,step,execute,audit,save,load,hash:core.api.hash,
  stationInvestmentQuote,
  // Low-level module entrypoints permit adversarial double-call tests, never browser access.
  diagnostics:Object.freeze({mine:core.water.foerdern,income:core.income.einkommen,demand:core.water.nachfrage,
   oreWages:core.wages.orePilotWage,industryWages:core.wages.industryWage})});
}

// Additional independent accounts check for C1c; the money moves only in the
// pre-existing W5s-q/W5s-r Core wage routines, never in this research adapter.
function lohnAudit(s,r){
 const w=s.w5s;if(!w||!w.industryWages)return false;
 const init=id=>r.owners.find(o=>o.id===id)?.cash??0;
 const paid=w.industryWages.paid;
 const industry=(paid.refinery||0)+(paid.shipyard||0)+(paid.maintenance||0);
 return [w.orePilotWages||0,paid.refinery||0,paid.shipyard||0,paid.maintenance||0]
     .every(integer)
   &&(w.orePilotWages||0)<=s.w3.arbeitsKosten
   &&(paid.refinery||0)<=s.w4.gezahlt
   &&s.owners[r.w3.arbeitsFonds].cash===init(r.w3.arbeitsFonds)
       +s.w3.arbeitsKosten+s.w5n.frachtLohn+(s.w5b?.siliziumLohnBezahlt||0)-s.w5o.lohnFracht-(w.orePilotWages||0)
   &&s.owners[r.w4.arbeitOwner].cash===s.w4.gezahlt-(paid.refinery||0)
   &&s.owners.w5n_kunden.cash===init('w5n_kunden')+s.w5o.ausgezahlt
       +(w.orePilotWages||0)+industry-s.w5n.wasserErlos
   &&s.minted===(s.c1e?.minted||0)&&s.burned===0;
}
// Independent checks beyond the registered original W5b audit. Research rule
// 3304 only establishes the *paid output*, not ten timed C-silicon work minutes.
// Independent of the original W5b goods/escrow audit: exact ten paid
// silicon minutes per unit, two genuine component units and one paid storage lot.
function exportAudit(s,r){
 const w=s.c1e,c=r.c1e,o=w?.order;
 if(!w||!c||c.price!==430||c.dayCap!==400||c.cap30!==12000
   ||c.cap365!==146000||c.carryDays!==30)return false;
 const e=w.events[0],accepted=w.accepted;
 const enough=day=>Math.min(400*Math.min(day+1,30),12000,146000);
 return [accepted,w.minted,w.reserved].every(integer)
   &&accepted<=1&&w.minted===430*accepted
   &&w.reserved===(o?.status==='reserved'?430:0)
   &&s.ledger.lager.exported===accepted
   &&s.stations.st_meridian.lager.lager===s.c1d.delivered-accepted
   &&s.minted===w.minted&&s.burned===0
   &&(o===null
     ?accepted===0&&w.events.length===0
     :o.id==='C1D2-0001'&&o.seller==='house'&&o.station==='st_meridian'
       &&o.day===Math.floor(o.tick/1440)&&o.day>=1
       &&o.available===enough(o.day)&&o.available>=430
       &&o.tick<=s.tick&&o.price===430&&w.events.length===accepted
       &&(accepted
         ?o.status==='accepted'&&e.id===o.id&&e.tick===o.acceptedTick
           &&e.day===o.day&&e.owner==='house'&&e.units===1&&e.amount===430
           &&e.tick>=s.c1d.job.start+240
         :o.status==='reserved'&&o.acceptedTick===null));
}
function bundleAudit(s,r){
 const w=s.w5b,c=r.c1d,j=s.c1d?.job;
 const cap=r.w5b?.maxStorageLots,limit=r.w5b?.maxPartsLots;
 if(!w||!c||c.quantity!==(r.c1f?4:3)
   ||cap!==(r.c1g?.enabled?9:r.c1d.allowSecondManufacturing?8:4)
   ||limit!==cap||r.w5b?.maxSiliconLots!==cap)return false;
 const produced=w.lagerFertig,stored=s.stations.st_nadir.lager.lager,
   travelling=s.ships[j?.ship]?.ladung.lager||0,
   arrived=s.stations.st_meridian.lager.lager;
 return [produced,stored,travelling,arrived].every(integer)
  &&produced<=cap
  &&s.ledger.lager.produced===produced
  &&s.ledger.lager.consumed===(s.c1g?.installed||0)&&s.ledger.lager.exported===(s.c1f?.accepted||0)+(s.c1f?.secondAccepted||0)
  &&stored+travelling+arrived+s.ledger.lager.exported+(s.c1g?.installed||0)===produced
  &&w.bauteilBegonnen<=w.siliziumAbgeschlossen
  &&w.lagerBegonnen<=w.bauteilFertig
  &&w.lagerFertig<=w.lagerBegonnen
  &&w.bauteilFertig<=w.bauteilBegonnen
  &&w.materialVerbraucht===4*w.bauteilBegonnen
  &&w.siliziumVerbraucht===2*w.bauteilBegonnen
  &&w.bauteilVerbraucht===2*w.lagerBegonnen
  &&w.fabrikLohnBezahlt===16*w.bauteilFertig+12*w.lagerFertig+(w.auftrag?.gearbeitet||0)
  &&s.minted===0&&s.burned===0;
}

// Independent C1d-4 contract budget, prepayment and original goods audit.
// Only actually available pre-existing buyer cash is contracted, never new ISK.

function bauteilTitelAudit(s,r){
 const w=s.w5b,c=r.w5b,rows=w?.bauteilTitel;
 if(!c?.directPartsCustody||!Array.isArray(rows)||rows.length!==w.bauteilFertig)
   return false;
 const materialCost=4*c.materialPreis,siCost=2*r.economy.waren.silizium.basis;
 let used=0;
 for(let i=0;i<rows.length;i++){
  const x=rows[i],consumed=x?.usedUnits===2;
  if(!x||x.id!=='C1D5-BT-'+String(i+1).padStart(4,'0')
    ||x.owner!==c.produzent||x.custodian!==c.station||x.units!==2
    ||![0,2].includes(x.usedUnits)||!integer(x.createdTick)
    ||x.createdTick>s.tick
    ||(consumed
      ?!integer(x.usedTick)||x.usedTick<x.createdTick||x.usedTick>s.tick
       ||x.usedBy!=='C1D5-LAGER-'+String(used+1).padStart(4,'0')
      :x.usedTick!==null||x.usedBy!==null))return false;
  if(consumed)used++;
 }
 return used===w.lagerBegonnen
   &&s.stations[c.station].lager.bauteil===2*(w.bauteilFertig-used)
   &&s.ledger.bauteil.produced===2*w.bauteilFertig
   &&s.ledger.bauteil.consumed===2*used
   &&w.bauteilVerbraucht===2*used
   &&w.vorproduktKauf===w.bauteilBegonnen*(materialCost+siCost)
   &&w.bauteilBegonnen===w.bauteilFertig+(w.auftrag?.art==='stationBuildParts'?1:0)
   &&w.materialVerbraucht===4*w.bauteilBegonnen
   &&w.siliziumVerbraucht===2*w.bauteilBegonnen
   &&w.lagerBegonnen<=w.bauteilFertig
   &&s.minted===0&&s.burned===0;
}

// C1d-7 independent amount reconciliation against immutable original
// account-journal baselines. A later legitimate purchase cannot retroactively
// invalidate a settled order; an unbooked transfer still fails.
function reservedAfter(s,id){
 const mining=Object.entries(s.erzpilotVertraege||{}).reduce((sum,[shipId,v])=>
  sum+(s.ships[shipId]?.owner===id&&v.arbeitsKonto
   ?(s.owners[v.arbeitsKonto]?.cash??NaN):0),0);
 return mining+(id==='transport'&&s.w3?.auftrag?(s.owners.w3_arbeit_treuhand?.cash??0):0)+(id==='house'
  ?(s.owners.w5b_silizium_arbeit?.cash??0)
   +(s.owners.w5b_fabrik_arbeit?.cash??0)
   +(s.owners.w5f_laser_arbeit?.cash??0):0);
}
function validJournalCash(s,id,before,snap){
 const j=s.stats?.konto?.[id];
 return integer(before)&&integer(snap?.revenue)&&integer(snap?.costs)
   &&integer(j?.erloes)&&integer(j?.kosten)
   &&j.erloes>=snap.revenue&&j.kosten>=snap.costs
   &&s.owners[id].cash+reservedAfter(s,id)===before+(j.erloes-snap.revenue)-(j.kosten-snap.costs);
}

// C1d-8b: independently account for the SECOND signed contract, while
// retaining the original first job and its non-transferable title/escrow.
// No authority to create demand or ISK: this function only verifies.
function secondFundingAudit(s,r){
 const c=r.c1f,w=s.c1f,v=s.c1d,q=v?.second,o=w?.secondOrder;
 if(!r.c1f?.secondEnabled||!r.c1d?.secondEnabled||!w||!v
   ||s.minted!==0||s.burned!==0)return false;
 const eligible=[w.secondAdvanced,w.secondSettled,w.secondAccepted,
   s.owners.c1f_kaufrest_escrow.cash,s.ledger.lager.exported];
 if(!eligible.every(integer))return false;
 const accepted=w.accepted===4&&w.order?.status==='accepted'&&v.completed===1;
 if(!o)return w.secondAdvanced===0&&w.secondSettled===0
   &&w.secondAccepted===0&&!q
   &&s.ledger.lager.exported===w.accepted;
 if(!accepted||o.id!=='C1D8B-0002'||o.id===w.order.id
   ||o.seller!==c.seller||o.buyer!==c.buyer
   ||o.amount!==1720||o.advance!==340||o.rest!==1380
   ||!integer(o.buyerBefore)||o.buyerBefore<1720
   ||!integer(o.createdTick)||o.createdTick<=w.order.acceptedTick
   ||o.createdTick>s.tick
   ||!validJournalCash(s,c.buyer,o.buyerBefore,o.buyerJournal)
   ||w.secondAdvanced!==340)return false;
 const done=o.status==='accepted';
 if(!['accepted','prepaid'].includes(o.status)
   ||w.secondSettled!==(done?1380:0)
   ||w.secondAccepted!==(done?4:0)
   ||s.ledger.lager.exported!==4+w.secondAccepted
   ||s.owners.c1f_kaufrest_escrow.cash!==(done?0:1380)
   ||(s.w5b?.lagerFertig!==8&&!(r.c1g?.enabled&&done&&s.w5b?.lagerFertig===9))
   ||s.ledger.lager.produced!==s.w5b.lagerFertig)return false;
 if(!q){
   return !done&&o.acceptedTick===null
     &&s.stations.st_nadir.lager.lager===4
     &&s.stations.st_meridian.lager.lager===0;
 }
 const j=q.job,sh=s.ships[j?.ship];
 const fee=300,labour=240;
 if(!j||j.id!=='C1D8B-FREIGHT-0002'||j.start<o.createdTick
   ||j.start<=v.job.start||j.start>s.tick
   ||j.titleOwner!=='house'||sh?.owner!==r.c1d.carrier
   ||sh.klasse!=='frachter'
   ||!validJournalCash(s,'house',j.sellerBefore,j.sellerJournal)
   ||!validJournalCash(s,'transport',j.carrierBefore,j.carrierJournal)
   ||q.ordered!==1||!integer(q.delivered)||!integer(q.completed)
   ||q.delivered>1||q.completed>1
   ||q.feeAllocated!==fee||q.feePaid!==q.completed*fee
   ||q.pilotAllocated!==labour||!integer(q.pilotPaid)
   ||q.pilotPaid>labour||j.paidMinutes!==q.pilotPaid
   ||j.routes.position!==60||j.routes.delivery!==60||j.routes.back!==120
   ||s.owners.c1d_pilot.cash!==240+q.pilotPaid
   ||s.owners.c1d_freight_escrow.cash!==fee-q.feePaid
   ||s.owners.c1d_pilot_escrow.cash!==labour-q.pilotPaid
   ||s.stats.konto.c1d_pilot.erloes!==240+q.pilotPaid)
   return false;
 const stages=['position','delivery','return','finished'],phase=j.phase,
   expectedStart=j.start+(phase==='position'?0:phase==='delivery'?60:
     phase==='return'?120:240);
 if(!stages.includes(phase)||j.phaseStart!==expectedStart
   ||(phase==='finished'?s.tick<j.start+240:s.tick-j.start!==j.paidMinutes)
   ||q.delivered!==(phase==='return'||phase==='finished'?1:0)
   ||q.completed!==(phase==='finished'?1:0)
   ||(done&&(!q.completed||o.acceptedTick<j.start+240
     ||o.acceptedTick>s.tick))||(!done&&o.acceptedTick!==null))return false;
 const nadir=s.stations.st_nadir.lager.lager,
   meridian=s.stations.st_meridian.lager.lager,cargo=sh.ladung.lager||0;
 const physical=phase==='position'?nadir===4&&meridian===0&&cargo===0:
   phase==='delivery'?nadir===0&&meridian===0&&cargo===4:
   phase==='return'?nadir===0&&meridian===4&&cargo===0:
     nadir===(r.c1g?.enabled?s.w5b.lagerFertig-8-(s.c1g?.installed||0):0)
       &&meridian===4-w.secondAccepted&&cargo===0;
 return physical;
}

function financedAudit(s,r){
 const c=r.c1f,w=s.c1f,o=w?.order,esc=s.owners.c1f_kaufrest_escrow;
 if(!c||!w||!esc||c.buyer!=='export'||c.seller!=='house'||c.quantity!==4
   ||c.unitPrice!==430||c.advance!==340)return false;
 const total=4*430,rest=total-340,exported=s.ledger.lager.exported;
 if(![w.advanced,w.settled,w.accepted,esc.cash,exported].every(integer)
   ||s.minted!==0||s.burned!==0||s.c1e)return false;
 if(!o)return w.advanced===0&&w.settled===0&&w.accepted===0
   &&esc.cash===0&&exported===0;
 const done=o.status==='accepted';
 return o.id==='C1D4-0001'&&o.buyer==='export'&&o.seller==='house'
   &&o.amount===total&&o.advance===340&&o.rest===rest
   &&integer(o.buyerBefore)&&o.buyerBefore>=total
   &&(r.c1f.postSettlementJournal
     ?validJournalCash(s,'export',o.buyerBefore,o.buyerJournal)
     :s.owners.export.cash===o.buyerBefore-total)
   &&w.advanced===340&&w.settled===(done?rest:0)
   &&w.accepted===(done?4:0)
   &&esc.cash===(done
     ?(r.c1f.secondEnabled&&w.secondOrder?.status==='prepaid'?rest:0):rest)
   &&exported===(done?4:0)+(r.c1f.secondEnabled?(w.secondAccepted||0):0)
   &&s.stations.st_meridian.lager.lager===4*s.c1d.delivered
     +(r.c1f.secondEnabled?(s.c1d.second?.delivered||0)*4:0)-exported
   &&(!done||s.c1d.completed===1&&s.c1d.pilotPaid===240);
}

function deliveryAudit(s,r){
 const c=s.c1d,j=c?.job;
 if(!c||!r.c1d||!Number.isSafeInteger(c.pilotPaid)
   ||!Number.isSafeInteger(c.pilotAllocated))return false;
 const fee=s.owners.c1d_freight_escrow.cash,work=s.owners.c1d_pilot_escrow.cash,
  pilot=s.owners.c1d_pilot.cash;
 return [fee,work,pilot].every(integer)
  && c.pilotAllocated===c.ordered*240
  && c.feeAllocated===c.ordered*300
  && pilot===c.pilotPaid+(r.c1d.secondEnabled?(c.second?.pilotPaid||0):0)
  && fee===c.feeAllocated-c.feePaid
    +(r.c1d.secondEnabled?(c.second?.feeAllocated||0)-(c.second?.feePaid||0):0)
  && work===c.pilotAllocated-c.pilotPaid
    +(r.c1d.secondEnabled?(c.second?.pilotAllocated||0)-(c.second?.pilotPaid||0):0)
  && c.completed===c.feePaid/300
  &&(!j||(
    j.titleOwner===r.c1d.seller
    &&j.routes.position===60&&j.routes.delivery===60&&j.routes.back===120
    &&j.paidMinutes===c.pilotPaid
    &&(r.c1d.postSettlementJournal
      ?validJournalCash(s,r.c1d.seller,j.sellerBefore,j.sellerJournal)
        &&validJournalCash(s,r.c1d.carrier,j.carrierBefore,j.carrierJournal)
      :s.owners[r.c1d.seller].cash===j.sellerBefore-c.feeAllocated+(s.c1e?.minted||0)+(s.c1f?.settled||0)
        &&s.owners[r.c1d.carrier].cash===j.carrierBefore-c.pilotAllocated+c.feePaid)
  ))
  &&s.minted===(s.c1e?.minted||0)&&s.burned===0
  &&s.ledger.lager.exported===(s.c1e?.accepted||0)+(s.c1f?.accepted||0)
    +(s.c1f?.secondAccepted||0);
}
function lagerAudit(s,r){
 const w=s.w5b,c=r.w5b,f=w?.auftrag,m=w?.siliziumAuftrag;
 if(!w||!c||c.silikonMenge!==2||c.silikonLohn!==1
   ||c.silikonMinutenJeEinheit!==10||!c.allowStorageManufacturing)return false;
 const minWork=w.siliziumAbgeschlossen*20+(m?.gearbeitet||0);
 const allocated=w.bauteilBegonnen*16+w.lagerBegonnen*12;
 const settled=w.bauteilFertig*16+w.lagerFertig*12+(f?.gearbeitet||0);
 return [w.siliziumLohnBezahlt,minWork,allocated,settled,w.lagerBegonnen,w.lagerFertig]
     .every(integer)
   && w.siliziumAbgebaut===w.siliziumAbgeschlossen*2+Math.floor((m?.gearbeitet||0)/10)
   && w.siliziumLohnBezahlt===minWork
   &&(s.owners.w5b_silizium_arbeit?.cash||0)===w.siliziumBegonnen*20-minWork
   &&w.siliziumAbnahme===w.siliziumAbgeschlossen*48
   &&w.bauteilBegonnen===w.bauteilFertig+(f?.art==='stationBuildParts'?1:0)
   &&w.lagerBegonnen===w.lagerFertig+(f?.art==='stationBuildStorage'?1:0)
   &&s.ledger.bauteil.produced===2*w.bauteilFertig
   &&s.ledger.bauteil.consumed===2*w.lagerBegonnen
   &&s.stations.st_nadir.lager.bauteil===2*(w.bauteilFertig-w.lagerBegonnen)
   &&s.ledger.lager.produced===w.lagerFertig
   &&s.ledger.lager.consumed===(s.c1g?.installed||0)
   &&s.stations.st_nadir.lager.lager+(s.ships[s.c1d?.job?.ship]?.ladung?.lager||0)
      +(s.stations.st_meridian?.lager?.lager||0)+(s.c1e?.accepted||0)+(s.c1f?.accepted||0)+(s.c1f?.secondAccepted||0)+(s.c1g?.installed||0)===w.lagerFertig
   &&w.fabrikLohnGebunden===allocated
   &&w.fabrikLohnBezahlt===settled
   &&(s.owners.w5b_fabrik_arbeit?.cash||0)===allocated-settled
   &&s.minted===(s.c1e?.minted||0)&&s.burned===0;
}
function bauteilAudit(s,r){
 const w=s.w5b, p=r.w5b;
 if(!w||!p||p.silikonMenge!==1||p.silikonLohn!==10||p.materialPreis!==48)return false;
 const a=w.auftrag;
 const part=r.economy.rezepte.r_bauteil;
 if(part?.ein.material!==2||part?.ein.silizium!==1||part?.aus.bauteil!==1
    ||part?.dauer!==8)return false;
 const ints=[w.siliziumBegonnen,w.siliziumAbgeschlossen,w.siliziumAbgebaut,
  w.siliziumLohnBezahlt,w.bauteilBegonnen,w.bauteilFertig,w.fabrikLohnGebunden,
  w.fabrikLohnBezahlt,w.materialVerbraucht,w.siliziumVerbraucht,w.vorproduktKauf];
 if(!ints.every(integer))return false;
 return w.siliziumLohnBezahlt===10*w.siliziumAbgebaut
  &&w.siliziumAbnahme===w.siliziumAbgeschlossen*24
  &&w.bauteilBegonnen===w.bauteilFertig+(a?.art==='stationBuildParts'?1:0)
  &&w.materialVerbraucht===2*w.bauteilBegonnen
  &&w.siliziumVerbraucht===w.bauteilBegonnen
  &&w.vorproduktKauf===120*w.bauteilBegonnen
  &&w.fabrikLohnGebunden===8*w.bauteilBegonnen
  &&w.fabrikLohnBezahlt===8*w.bauteilFertig+(a?.gearbeitet||0)
  &&(s.owners.w5b_fabrik_arbeit?.cash||0)
    ===w.fabrikLohnGebunden-w.fabrikLohnBezahlt
  &&s.owners[p.arbeiter].cash===w.fabrikLohnBezahlt
  &&s.ledger.bauteil.produced===w.bauteilFertig
  &&s.ledger.bauteil.consumed===0
  &&s.stations[p.station].lager.bauteil===w.bauteilFertig;
}
function foerderAudit(s){
 const rows=Object.entries(s.c1b?.mining||{}),w=s.w5n;
 return rows.every(([id,x])=>integer(x.minutes)&&integer(x.units)&&[0,1].includes(x.rest)
  &&x.minutes===2*x.units+x.rest&&integer(x.lastTick)&&x.lastTick>0&&x.lastTick<=s.tick
  &&(s.ships[id]?.klasse==='miner'&&s.ships[id].owner==='npc3'
   ||s.w5r.losses.some(l=>l.id===id&&l.type==='miner'&&l.owner==='npc3')))
  &&rows.reduce((n,[,x])=>n+x.minutes,0)===w.mineMinuten
  &&rows.reduce((n,[,x])=>n+x.units,0)===w.eisAbgebaut
  &&w.mineLohn===w.mineMinuten;
}
function nachfrageAudit(s){
 const rows=s.c1b?.demand;if(!Array.isArray(rows)||rows.length!==Math.floor(s.tick/144))return false;
 return rows.every((x,i)=>x.tick===(i+1)*144&&integer(x.cash)&&integer(x.stock)
   &&x.missingCash===(x.cash<18)&&x.missingGoods===(x.stock<1)
   &&x.bought===(!x.missingCash&&!x.missingGoods?1:0))
  &&rows.reduce((n,x)=>n+x.bought,0)===s.w5n.wasserVerbraucht;
}

// C1d-10 independent buyer and tangible utility audit. No new ISK or engine.
function stationDemandAudit(s,r){
 const w=s.c1g,o=w?.order,st=s.stations?.st_nadir;
 if(!r.c1g?.enabled||!w||!st||!integer(w.moduleBefore)||w.moduleBefore>=2
   ||![0,1].includes(w.installed)||s.ledger.lager.consumed!==w.installed
   ||s.minted!==0||s.burned!==0)return false;
 if(!o)return w.installed===0&&(st.module.lager||0)===w.moduleBefore;
 const basis=r.world.stations.st_nadir.ziel.erz*r.world.obergrenze;
 const before=Math.floor(basis*(1000+500*w.moduleBefore)/1000000);
 const after=Math.floor(basis*(1000+500*(w.moduleBefore+1))/1000000);
 return w.installed===1&&o.status==='installed'
   &&o.id==='C1D10-NADIR-0001'&&o.title==='C1D5-LAGER-0009'
   &&o.buyer==='st_nadir'&&o.seller==='house'&&o.station==='st_nadir'
   &&o.price===430&&o.moduleBefore===w.moduleBefore
   &&o.capacityBefore===before&&o.capacityAfter===after&&after>before
   &&integer(o.createdTick)&&o.createdTick>=s.c1f?.secondOrder?.acceptedTick
   &&o.createdTick<=s.tick&&st.module.lager===w.moduleBefore+1
   &&s.w5b?.lagerFertig===9&&s.ledger.lager.produced===9
   &&s.ledger.lager.exported===8&&s.stations.st_nadir.lager.lager===0
   &&validJournalCash(s,'st_nadir',o.buyerBefore,o.buyerJournal)
   &&validJournalCash(s,'house',o.sellerBefore,o.sellerJournal);
}

function register({data,freeze,water,income,trade,state,base},{profile,version,precursor,wageFlow,partsFlow,storageFlow,deliveryFlow,exportFlow,bundleFlow,fundedFlow,titleFlow,followupFlow,secondBatchFlow,secondExportFlow,internalDemandFlow}){
 const rules=structuredClone(data.W5R_RULES);
 rules.rulesVersion=version;
 rules.researchProfile=profile;
 Object.assign(rules.w5n,{mineLohn:1,rezeptEis:50,rezeptWasser:50,
  fabrikMinuten:100,fabrikLohn:1,wasserPreis:18,frachtJeMinute:2.25,verbrauchStunde:0});
 rules.economy.waren.wasser.basis=18;
 rules.c1b={paidMinutesPerIce:2,dayMinutes:1440,scheduledWaterPerDay:10,interval:144};
 if(precursor){
  // C recipe only; upstream ore extraction and W3 freight remain explicitly R32.
  Object.assign(rules.w4,{erzJeCharge:10,materialJeCharge:4,dauer:10,lohnJeMinute:1});
  rules.economy.waren.material.basis=48;
 }
 if(partsFlow||storageFlow){
  // Pre-existing W5b Core contract; the storage profile also enables
  // ten individually financed silicon minutes and paid final production.
  // Pre-existing W5b Core contract: one paid 2m+1Si -> 1 part lot,
  // eight paid fabrication minutes. Silicon's original ONE-tick extraction
  // is deliberately retained, but its 10-ISK gross labour unit cost is
  // C-compatible; the 10-minute cadence is explicitly NOT proven.
  Object.assign(rules.w5b,{silikonMenge:1,silikonLohn:10,materialPreis:48});
  rules.economy.waren.silizium.basis=24;
 }
 if(storageFlow){
  Object.assign(rules.w5b,{silikonMenge:2,silikonLohn:1,
    silikonMinutenJeEinheit:10,materialPreis:48,allowStorageManufacturing:true});
  rules.economy.waren.bauteil.basis=170;
  rules.economy.waren.lager={...base.economy.waren.lager,basis:430};
  rules.economy.rezepte.r_lager=structuredClone(base.economy.rezepte.r_lager);
  rules.world.stations.st_nadir.ziel.lager=2;
 }
 if(deliveryFlow){
  // Research-only geography extension, with no imported or free export goods.
  rules.world.systems.meridian={station:'st_meridian',fonds:'fonds_transport',sicherheit:'gesetzlos'};
  rules.world.gates.push(['nadir','meridian',60]);
  rules.world.stations.st_meridian={system:'meridian',linien:[],verbrauch:{},
   ziel:{lager:2},gebuehr:0};
  rules.owners.push({id:'st_meridian',kind:'station',cash:0});
  rules.c1d={seller:'house',carrier:'transport',freightFee:300,wagePerMinute:1};
 }
 if(bundleFlow){
  // Intentional isolated research caps, not new productive price rules.
  Object.assign(rules.w5b,{maxSiliconLots:4,maxPartsLots:4,maxStorageLots:4});
  rules.world.stations.st_nadir.ziel.lager=4;
  rules.world.stations.st_meridian.ziel.lager=3;
  rules.c1d.quantity=3;
 }
 if(fundedFlow){
  // Legally bound buyer's already existing 20,000-ISK initial budget;
  // no new cash owner and no C1d-2 research minting on this profile.
  rules.c1d.quantity=4;
  rules.world.stations.st_meridian.ziel.lager=4;
  rules.c1f={seller:'house',buyer:'export',quantity:4,unitPrice:430,advance:340};
 }
 if(titleFlow){
  // C1d-5 and its successors: the manufacturer owns its components in station custody.
  // Direct processing does not repurchase its own parts from the custodian.
  rules.w5b.directPartsCustody=true;
 }
 if(followupFlow){
  rules.c1d.postSettlementJournal=true;
  rules.c1f.postSettlementJournal=true;
 }
 if(secondBatchFlow){
  // Only 3312: eight separately paid original production lots across two runs.
  // First C1d/C1f agreement is still one-time; no free export settlement.
  Object.assign(rules.w5b,{maxSiliconLots:8,maxPartsLots:8,maxStorageLots:8});
  rules.world.stations.st_nadir.ziel.lager=8;
  rules.c1d.allowSecondManufacturing=true;
 }
 if(secondExportFlow){
  rules.c1d.secondEnabled=true;
  rules.c1f.secondEnabled=true;
 }
 if(internalDemandFlow){
  Object.assign(rules.w5b,{maxSiliconLots:9,maxPartsLots:9,maxStorageLots:9});
  rules.c1d.internalDemandEnabled=true;
  rules.c1g={enabled:true,buyer:'st_nadir',seller:'house',station:'st_nadir',unitPrice:430};
 }
 if(exportFlow){
  rules.c1e={seller:'house',price:430,dayCap:400,cap30:12000,
    cap365:146000,carryDays:30};
 }
 if(wageFlow){
  // Reuse existing W5s-q (paid W3 flights) and W5s-r (earned W4/W5/W5r
  // labour), without activating its unrelated shipyard/autonomous operations.
  rules.w5s={autoIndustry:true,autoOreWageHousehold:true,autoIndustryWages:true};
 }
 freeze(rules);
 // The stock full-audit dispatch hardcodes these names. Register the SAME frozen
 // research rules in its four private water/income/export/wear slots, before index init.
 for(const key of ['W5N_RULES','W5O_RULES','W5Q_RULES','W5R_RULES'])data[key]=rules;
 water.foerdern=(s,r,sh)=>{
  check(r===rules&&s.rulesVersion===version&&s.c1b?.profile===profile,'falsches Arbeitsprofil');
  check(sh===s.ships[sh.id]&&sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'
   &&sh.phase==='dock'&&sh.auftrag==='foerdern'&&sh.ware==='eis','keine berechtigte Eisarbeit');
  const previous=s.c1b.mining[sh.id];
  check(!previous||previous.lastTick<s.tick,'Doppelabrechnung der Arbeitsminute');
  const used=Object.values(sh.ladung).reduce((a,n)=>a+n,0);
  if(used>=r.economy.cargo||s.owners[sh.owner].cash<r.w5n.mineLohn){
   sh.auftrag='halten';state.protokolliere(s,'auftrag',sh.id+': Eisabbau pausiert (Fracht/Arbeitsgeld)',sh.owner);return 0;
  }
  // Pay before progress. No funding, no work, no unit; unfinished work belongs to this hull.
  s.owners[sh.owner].cash--;s.owners.fonds_aldera.cash++;trade.buche(s,sh.owner,'kosten',1);
  const row=previous||(s.c1b.mining[sh.id]={minutes:0,units:0,rest:0,lastTick:0});
  row.minutes++;row.rest++;row.lastTick=s.tick;
  s.w5n.mineMinuten++;s.w5n.mineLohn++;s.w5o.npcMineLohn++;
  if(row.rest<2)return 0;
  row.rest=0;row.units++;sh.ladung.eis=(sh.ladung.eis||0)+1;
  s.ledger.eis.mined++;s.w5n.eisAbgebaut++;
  const c=r.w5n;
  if(sh.ladung.eis>=c.charge){
   const n=Math.min(sh.ladung.eis,trade.aufnehmbar(s,r,c.quellStation,'eis'));
   if(n>=c.charge)water.verkauf(s,r,sh,n);
  }
  if(Object.values(sh.ladung).reduce((a,n)=>a+n,0)>=r.economy.cargo)sh.auftrag='halten';
  return 1;
 };
 const originalTick=water.tick;
 function nachfrage(s,r){
  check(r===rules&&s.c1b?.profile===profile,'falsches Nachfrageprofil');
  if(s.tick%144!==0)return;
  const rows=s.c1b.demand;
  check(rows.length===s.tick/144-1,'Doppelabrechnung der Nachfrage');
  const customer=s.owners.w5n_kunden,stock=s.stations.st_nadir.lager;
  const row={tick:s.tick,cash:customer.cash,stock:stock.wasser,
   missingCash:customer.cash<18,missingGoods:stock.wasser<1,bought:0};
  if(!row.missingCash&&!row.missingGoods){
   customer.cash-=18;s.owners.st_nadir.cash+=18;stock.wasser--;
   s.ledger.wasser.consumed++;s.w5n.wasserVerbraucht++;s.w5n.wasserErlos+=18;
   trade.buche(s,'w5n_kunden','kosten',18);trade.buche(s,'st_nadir','erloes',18);row.bought=1;
  }
  rows.push(row);
 }
 water.nachfrage=nachfrage;
 water.tick=(s,r)=>{originalTick(s,r);nachfrage(s,r);};
 water.verbrauch=()=>{}; // hourly legacy consumption disabled; no catch-up orders
 water.audit=(s,r)=>wasserAudit(s,r,water.preise);
}

// W5n's complete goods, owner, cash, escrow and work audit, retained from #246.
// Only its old >=1 ice/minute predicate is replaced by the exact paid-work receipts.
 function wasserAudit(s,r,preise){
   const w=s.w5n,c=r.w5n;if(!w||!c)return {ok:false,grund:'W5n-Buch fehlt'};
   const p=preise(r),a=w.frachtauftrag,f=w.fabrikauftrag;
   const iceCargo=Object.values(s.ships).filter(sh=>sh.klasse==='miner')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const iceRoute=Object.values(s.ships).filter(sh=>sh.klasse==='frachter')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const factoryCost=c.fabrikMinuten*c.fabrikLohn;
   const numbers=[w.eisAbgebaut,w.mineMinuten,w.mineLohn,w.mineVerkauft,w.mineVerkaufWert,
     w.eisTransferWert,w.frachtBeauftragt,w.frachtAbgeschlossen,w.eisGeliefert,
     w.kaufAusgaben,w.frachtLohn,w.frachtUmsatz,w.fabrikBegonnen,w.fabrikFertig,
     w.fabrikGebucht,w.fabrikBezahlt,w.eisVerbraucht,w.wasserProduziert,
     w.wasserVerbraucht,w.wasserErlos,w.knappheitsStunden,iceCargo,iceRoute];
   const ok=numbers.every(x=>Number.isSafeInteger(x)&&x>=0)
     &&w.eisAbgebaut===s.ledger.eis.mined&&w.mineLohn===w.mineMinuten*c.mineLohn
     &&foerderAudit(s)
     &&w.eisAbgebaut===w.mineVerkauft+iceCargo+(s.w5r?.lostIce??0)
     &&w.mineVerkaufWert===w.mineVerkauft*c.eisPreis
     &&w.eisTransferWert===w.eisGeliefert*c.eisPreis
     &&w.mineVerkauft===s.stations[c.quellStation].lager.eis+iceRoute+w.eisGeliefert
     &&iceRoute===(a?.phase==='hin'?c.charge:0)
     &&s.stations[c.zielStation].lager.eis===w.eisGeliefert-w.eisVerbraucht
     &&s.stations[c.zielStation].lager.wasser===w.wasserProduziert-w.wasserVerbraucht
       -(s.w5q?.exported??0)
     &&w.eisVerbraucht+(s.w5r?.lostIce??0)===s.ledger.eis.consumed
     &&w.wasserProduziert===s.ledger.wasser.produced
     &&w.wasserVerbraucht===s.ledger.wasser.consumed
     &&w.wasserErlos===w.wasserVerbraucht*c.wasserPreis
     &&s.owners[c.kunde].cash===r.owners.find(o=>o.id===c.kunde).cash-w.wasserErlos
       +(s.w5o?.ausgezahlt??0)+(s.w5s?.orePilotWages??0)
       +Object.values(s.w5s?.industryWages?.paid??{}).reduce((n,x)=>n+x,0)
       +(s.w5q?.payout??0)+(s.w5s?.transferPilotWages??0)
     &&w.frachtBeauftragt===w.frachtAbgeschlossen+(a?1:0)
     &&w.kaufAusgaben===w.frachtBeauftragt*p.gesamt
     &&w.eisGeliefert===(w.frachtAbgeschlossen+(a?.phase==='rueck'?1:0))*c.charge
     &&w.frachtLohn===w.frachtAbgeschlossen*p.arbeit+(a?.gearbeitet??0)*c.fliegerLohn
     &&w.frachtUmsatz===w.frachtAbgeschlossen*p.fracht
     &&(s.owners.w5n_fracht_kauf?.cash||0)===(a?(a.phase==='hin'?p.gesamt:p.fracht):0)
     &&(s.owners.w5n_fracht_arbeit?.cash||0)===(a?p.arbeit-a.gearbeitet*c.fliegerLohn:0)
     &&(!a||(a.eis===p.eis&&a.fracht===p.fracht&&a.arbeit===p.arbeit
       &&a.zeit===p.zeit&&a.gearbeitet>=0&&a.gearbeitet<2*p.zeit
       &&s.ships[a.schiff]?.owner===(a.owner||c.frachterOwner)
       &&(!a.owner||(a.owner===s.w5s?.successor?.owner
          &&a.schiff===s.w5s.successor.ship)
          ||(a.owner===s.w5s?.newCarrierOrder?.buyer
            &&a.schiff===s.w5s.newCarrierOrder.ship
            &&s.w5s.newCarrierOrder.stage==='arrived'))))
     &&w.fabrikBegonnen===w.fabrikFertig+(f?1:0)
     &&w.fabrikGebucht===w.fabrikBegonnen*factoryCost
     &&w.fabrikBezahlt===w.fabrikFertig*factoryCost+(f?.gearbeitet??0)*c.fabrikLohn
     &&s.owners.w5n_arbeit.cash===w.fabrikBezahlt-(s.w5o?.lohnWasser??0)
     &&(s.owners.w5n_fabrik_arbeit?.cash||0)===w.fabrikGebucht-w.fabrikBezahlt
     &&w.eisVerbraucht===w.fabrikFertig*c.rezeptEis
     &&w.wasserProduziert===w.fabrikFertig*c.rezeptWasser
     &&s.minted===(s.w5q?.minted??0)+(s.c1e?.minted||0)&&s.burned===0;
   return {ok,eisAbgebaut:w.eisAbgebaut,eisVerkauft:w.mineVerkauft,
     eisGeliefert:w.eisGeliefert,wasserProduziert:w.wasserProduziert,
     wasserVerbraucht:w.wasserVerbraucht,waterBuyerCash:s.owners[c.kunde].cash,
     kundenZahlungen:w.wasserErlos,frachtAuftrag:a?.phase||'frei',
     fabrikAuftrag:f?'in_arbeit':'frei',knappheitsStunden:w.knappheitsStunden};
 }
