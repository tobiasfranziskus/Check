// W-20261127-01: technical management audit, not a blind test or game rule.
// Standard root start, original J8 manager actions only; no injected state,
// private water subsidy, hand flight, policy toggle or optional profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const W5=require('../prototypes/w5ac/session.js');
const Manager=require('../prototypes/spiel/p3-manager-disposition.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');

const DAY=1440, LIMIT=60*DAY, STEP=60;
function start(){
  const j=J8.erstellen();
  j.starten195(W5.create(42,'private195').export(),true);
  assert.equal(j.ansicht().hash,'674400c1d181fcf2');
  return j;
}
function audit(j){
  const w=j.weltReferenz(),s=j.zustandReferenz();
  assert.equal(s.rulesVersion,204);
  assert.equal(Boolean(w.hausErzProfil),false);
  assert.deepEqual(pruefen(w,s),[]);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0); assert.equal(s.burned,0);
  return s;
}
function resume(j){
  const json=j.exportieren(),copy=J8.erstellen();
  copy.oeffnen204(json,true);
  assert.equal(copy.exportieren(),json);
  assert.equal(copy.ansicht().hash,j.ansicht().hash);
  audit(copy);
  return copy;
}
function quote(j){
  const before=j.exportieren(), offers=j.angebote(),s=j.zustandReferenz();
  const p=Manager.auswerten(j.weltReferenz(),s,offers);
  assert.equal(j.exportieren(),before,'quotes and manager view must not book');
  return {offers,p};
}
function snapshot(j,kind,q=quote(j)){
  const s=audit(j),w=j.weltReferenz(),p=q.p;
  const row={kind,tick:s.tick,day:s.tick/DAY,hash:j.ansicht().hash,
    cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
    houseAccount:s.stats.konto.house,freight:{completed:p.frachtAbgeschlossen,
      open:p.frachtOffen,fees:p.frachtGebuehrBisher,wages:p.frachtLohnBisher},
    ore:{mined:s.ledger.erz.mined,exported:s.ledger.erz.exported,localSales:s.stats.verkaeufe},
    warehouses:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager},
    owned:Object.values(s.ships).filter(sh=>sh.owner==='house').map(sh=>({
      id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
      cargo:sh.ladung,pendel:s.kanon.pendel[sh.id]??null,
      value:w.buchwert(s,sh.id),retired:w.stillgelegt(s,sh.id)})),
    w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
    ledger:s.ledger,manager:{ice:p.abbau,freight:p.transport,ore:p.erzauftrag,
      pause:p.aussetzen,exportCash:p.erzExportKasse,oreCost:p.erzKosten,
      nadirIceFree:p.eisFrei,nadirCash:p.nadirKasse,nadirFreightCost:p.nadirFrachtbedarf},
    offers:q.offers.map(({id,ok,reason})=>({id,ok,reason}))};
  console.log('M4_MANAGEMENT_60D_SNAPSHOT',JSON.stringify(row));
  return row;
}
function deny(j,id){
  const before=j.exportieren();
  const r=j.ausfuehren(id);
  assert.equal(r.ok,false,id);
  assert.equal(j.exportieren(),before,id+' must be neutral');
  return r.reason;
}


// Follow-up 27.11.: all branches originate in the actually replayed standard
// checkpoint, not a synthesized fixture. Private consumption is not a subsidy
// for this management strategy. Purchases without a credible sale stay quotes.
function continuation(source){
  const original=source.exportieren(),origin=source.zustandReferenz().tick;
  assert.equal(origin,9120,'pinned original stop, not a fabricated later fixture');
  assert.equal(source.ansicht().hash,'3f4136e766807b9e');
  function open(json,profile,copy=false){
    const j=J8.erstellen();
    if(profile==='house')j.oeffnenHausErz(json,true,copy?'kopie':'lokal');
    else j.oeffnen204(json,true);
    return j;
  }
  function check(j,profile){
    const s=j.zustandReferenz(),w=j.weltReferenz();
    assert.equal(s.rulesVersion,204);
    assert.equal(Boolean(w.hausErzProfil),profile==='house');
    assert.deepEqual(pruefen(w,s),[]);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    return s;
  }
  function report(j,profile){
    const s=check(j,profile),w=j.weltReferenz(),{offers,p}=quote(j);
    return JSON.parse(JSON.stringify({
      tick:s.tick,hash:w.hash(s),cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
      houseAccount:s.stats.konto.house,privateWater:s.kanon.haushalte.pilot_house??null,
      policy:{waterTarget:s.kanon.politik.wasserwerkBis,iceBuffer:s.kanon.politik.eisPufferAldera,
        privateSaving:s.kanon.politik.sparquote.pilot_house},
      warehouses:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager},
      ledger:s.ledger,localSales:s.stats.verkaeufe,
      own:Object.values(s.ships).filter(sh=>sh.owner==='house').map(sh=>({
        id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
        cargo:sh.ladung,pendel:s.kanon.pendel[sh.id]??null,value:w.buchwert(s,sh.id)})),
      freight:{completed:p.frachtAbgeschlossen,fees:p.frachtGebuehrBisher,wages:p.frachtLohnBisher},
      industry:{w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
        houseReceipts:s.w5ad.freight.filter(f=>f.owner==='house'),
        contract:s.kanon.industrieErz,active:s.w3.auftrag,gebunden:w.bericht(s).gebunden},
      offers:offers.map(({id,ok,reason,kaufPlan})=>({id,ok,reason,kaufPlan}))
    }));
  }
  function branch(profile,mode){
    let j=open(original,profile,profile==='house');
    const initial=j.exportieren(),before=report(j,profile),trace=[],saves=new Map(),observations=[before];
    const act=(id,reason)=>{
      const tick=j.zustandReferenz().tick,old=j.exportieren();
      const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);
      assert.notEqual(j.exportieren(),old);
      check(j,profile);trace.push({tick,id,reason});
    };
    const advance=minutes=>{j.weiterspielen(minutes);trace.push({minutes});};
    function checkpoint(){
      const json=j.exportieren();
      saves.set(trace.length,json);
      j=open(json,profile);
      assert.equal(j.exportieren(),json);
      observations.push(report(j,profile));
    }
    if(profile==='standard'){
      for(const id of ['freight-sh003','ore-sh002','ore-sh004','gate-freight-sh003',
        'buy-st_nadir-frachter','buy-st_nadir-miner','buy-st_nadir-jaeger','industrialOreAcceptFreight'])
        deny(j,id);
      // The remaining green options are not equivalent to a paid order. Only
      // try an existing ice miner; no need to buy another idle hull.
      assert.ok(j.angebote().find(o=>o.id==='buy-st_aldera-miner')?.ok);
      assert.ok(j.angebote().find(o=>o.id==='water-pilot-house-1')?.ok);
      if(mode==='ice')act('ice-sh002','test existing ice alternative without buying a redundant miner');
    }else{
      assert.throws(()=>open(initial,'standard'),/Haus-Erz|Profil/);
      assert.throws(()=>J8.erstellen().oeffnenHausErz(original,false,'kopie'));
      deny(j,'industrialOreAcceptFreight');
      advance(1);checkpoint(); // actual first offer decision
    }
    const duration=3*DAY;
    let paused=false,positive=false;
    while(j.zustandReferenz().tick<origin+duration){
      const tick=j.zustandReferenz().tick;
      if(mode!=='idle'){
        const {offers,p}=quote(j);
        const house=offers.find(o=>o.ok&&o.id.startsWith('haus-erz-'));
        const freight=offers.find(o=>o.ok&&o.id.startsWith('freight-'));
        const ore=offers.find(o=>o.ok&&o.id.startsWith('ore-'));
        if(house){act(house.id,'accept a concrete original industrial house offer');positive=true;}
        else if(freight){act(freight.id,'real renewed F4 opportunity');positive=true;}
        else if(ore&&p.erzExportKasse>=p.erzKosten){
          act(ore.id,'real renewed W1 export opportunity');positive=true;
        }
        if(mode==='ice'&&!paused&&tick>=origin+DAY){
          const q=j.angebote().find(o=>o.id==='stop-sh002'&&o.ok);
          if(q&&!positive){act(q.id,'cost control after testing existing ice capacity');paused=true;}
        }
      }
      const remaining=origin+duration-tick;
      advance(remaining>=60?60:remaining>=10?10:1);
      const now=j.zustandReferenz().tick;
      if(now>=origin+DAY*(observations.filter(o=>o.tick>=origin+DAY).length+1))checkpoint();
    }
    checkpoint();
    const after=report(j,profile),end=j.exportieren();
    let replay=open(initial,profile);
    for(let i=0;i<trace.length;i++){
      const step=trace[i];
      if(step.id){
        assert.equal(replay.zustandReferenz().tick,step.tick);
        const r=replay.ausfuehren(step.id);assert.equal(r.ok,true,step.id+': '+r.reason);
      }else replay.weiterspielen(step.minutes);
      if(saves.has(i+1)){
        assert.equal(replay.exportieren(),saves.get(i+1));
        replay=open(replay.exportieren(),profile);
      }
    }
    assert.equal(replay.exportieren(),end);
    assert.equal(source.exportieren(),original,'source must remain byte-identical');
    const delta={houseCash:after.cash.house-before.cash.house,
      houseRevenue:after.houseAccount.erloes-before.houseAccount.erloes,
      houseCost:after.houseAccount.kosten-before.houseAccount.kosten,
      alderaCash:after.cash.st_aldera-before.cash.st_aldera,
      nadirCash:after.cash.st_nadir-before.cash.st_nadir,
      exportCash:after.cash.export-before.cash.export,
      privateCash:after.cash.pilot_house-before.cash.pilot_house,
      iceSales:(after.localSales.sh002||0)-(before.localSales.sh002||0),
      iceTrips:after.freight.completed-before.freight.completed,
      industrialTrips:after.industry.houseReceipts.length-before.industry.houseReceipts.length};
    for(const f of after.industry.houseReceipts.slice(before.industry.houseReceipts.length))
      assert.deepEqual([f.amount,f.end-f.start,f.fee,f.work,f.owner],[50,120,240,120,'house']);
    console.log('M4_MANAGEMENT_60D_CONTINUATION',JSON.stringify({profile,mode,origin,
      sourceHash:'3f4136e766807b9e',sourceUnchanged:true,replay:true,delta,
      actions:trace.filter(x=>x.id),observations,after}));
    return {delta,after};
  }
  const idle=branch('standard','idle');
  const ice=branch('standard','ice');
  const house=branch('house','house');
  console.log('M4_MANAGEMENT_60D_CONTINUATION_RESULT',JSON.stringify({
    idle:idle.delta,ice:ice.delta,house:house.delta,
    endTick:house.after.tick,sourceUnchanged:source.exportieren()===original,
    scope:'Three independent three-day counterfactuals from the actual replayed stop. No private water transfer, no new hull bought without demand; no universal strategy claim, no 60-day pass.'
  }));
}

test('M4 management: continuous standard career, real decisions, audited stop or 60 days', {timeout:20*60*1000},()=>{
  let j=start();
  const trace=[],checkpoints=new Map();
  const act=(id,reason)=>{
    const s=j.zustandReferenz(),tick=s.tick,before=j.exportieren();
    const r=j.ausfuehren(id);
    assert.equal(r.ok,true,id+': '+r.reason);
    assert.notEqual(j.exportieren(),before,id+' must have a real effect');
    trace.push({tick,id,reason});
    audit(j);
  };
  const advance=()=>{
    j.weiterspielen(STEP);
    trace.push({minutes:STEP});
  };
  const checkpoint=kind=>{
    const row=snapshot(j,kind);
    checkpoints.set(trace.length,j.exportieren());
    j=resume(j); // actually continue the reloaded session, not a passive roundtrip
    return row;
  };
  checkpoint('start');
  for(const id of ['ore-sh001','industrialOreAcceptFreight','freight-sh003-20'])deny(j,id);
  act('buy-st_aldera-miner','first productive asset');
  act('buy-st_aldera-frachter','real funded F4 carrier');
  act('ice-sh002','supply ice');
  advance(); advance();
  act('freight-sh003','first paid F4');
  advance(); checkpoint('in-flight');
  advance();
  assert.equal(j.ansicht().hash,'4e86f3fc27a6005a');
  const first=checkpoint('first-paid-round');
  assert.deepEqual([first.freight.completed,first.freight.fees,first.freight.wages],[1,240,120]);
  act('buy-st_aldera-miner','diversify with local W1 ore after first round');
  const extra=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.id!=='sh002');
  assert.ok(extra);
  act('ore-'+extra.id,'original funded local ore sale');
  deny(j,'ore-'+extra.id);
  let lastRevenue=j.zustandReferenz().stats.konto.house.erloes;
  let lastIncomeTick=j.zustandReferenz().tick, lastRestartTick=lastIncomeTick, firstBlocked=null, pauseTick=null, stop=null;
  while(j.zustandReferenz().tick<LIMIT){
    const s=j.zustandReferenz(),tick=s.tick, rev=s.stats.konto.house.erloes;
    if(rev>lastRevenue){lastRevenue=rev;lastIncomeTick=tick;pauseTick=null;}
    const {offers,p}=quote(j), get=id=>offers.find(x=>x.id===id);
    const f=get('freight-sh003');
    if(!p.frachtOffen&&f?.ok){
      act(f.id,'continue legal paid ice transport');
      if(pauseTick!==null){pauseTick=null;lastRestartTick=tick;}
    }else if(!p.frachtOffen&&f&&!f.ok&&!firstBlocked){
      firstBlocked={tick,reason:deny(j,f.id)};
      snapshot(j,'first-blocked-freight');
    }
    // A one-day income drought prompts a real cost-control decision; the
    // policy does not spend private pilot wages solely to fund a buyer.
    if(tick-Math.max(lastIncomeTick,lastRestartTick)>=DAY&&pauseTick===null&&!p.frachtOffen&&!f?.ok){
      pauseTick=tick;
      for(const o of j.angebote().filter(x=>x.ok&&x.id.startsWith('stop-'))){
        const id=o.id.slice(5);
        if(!j.zustandReferenz().kanon.pendel[id]?.beenden)act(o.id,'pause loss-making duty after a day without receipts');
      }
      checkpoint('cost-control');
    }
    // Look for a financially credible restart in the original quotes. A new
    // hull alone cannot cure insufficient buyer cash or a full destination.
    if(pauseTick!==null){
      const fresh=quote(j), pp=fresh.p;
      const ore=fresh.offers.find(o=>o.ok&&o.id.startsWith('ore-'));
      const ice=fresh.offers.find(o=>o.ok&&o.id.startsWith('ice-'));
      const freight=fresh.offers.find(o=>o.ok&&o.id.startsWith('freight-'));
      if(ore&&pp.erzExportKasse>=pp.erzKosten){
        act(ore.id,'restart locally funded ore with real export liquidity');
        pauseTick=null;
        lastRestartTick=tick; // give the newly commissioned work a full observation window
      }else if(ice&&!freight&&pp.eisLager<pp.eisCharge&&pp.eisFrei>=pp.eisCharge
        &&pp.alderaKasse>=pp.ankaufKosten&&pp.nadirKasse>=pp.nadirFrachtbedarf
        &&pp.hausKasse>=pp.frachtLohnbedarf){
        act(ice.id,'restart ice when both ends can finance a complete round');
        pauseTick=null;
        lastRestartTick=tick;
      }else if(freight){
        pauseTick=null;lastRestartTick=tick;
      }else if(tick-pauseTick>=2*DAY){
        const row=checkpoint('observed-economic-stop');
        stop={tick,firstBlocked,pauseTick,lastIncomeTick,reason:'No viable restart of selected W1/F4 strategy after two days of cost-control observation',
          remainingOffers:row.offers};
        break;
      }
    }
    advance();
    if(j.zustandReferenz().tick%DAY===0)checkpoint('daily');
  }
  const end=checkpoint('final');
  assert.ok(end.tick===LIMIT||stop);
  // Check genuine original ownership and money/commodity audits at every
  // checkpoint. Negative commands do not change any byte of the save.
  for(const id of ['ore-sh001','industrialOreAcceptFreight','freight-sh003-20'])deny(j,id);
  const target=j.exportieren();
  let replay=start();
  for(let n=0;n<trace.length;n++){
    const step=trace[n];
    if(step.id){
      assert.equal(replay.zustandReferenz().tick,step.tick);
      const r=replay.ausfuehren(step.id);
      assert.equal(r.ok,true,step.id+': '+r.reason);
    }else replay.weiterspielen(step.minutes);
    if(checkpoints.has(n+1)){
      assert.equal(replay.exportieren(),checkpoints.get(n+1),'checkpoint '+(n+1));
      replay=resume(replay);
    }
  }
  assert.equal(replay.exportieren(),target,'full command/time replay must match byte for byte');
  console.log('M4_MANAGEMENT_60D_RESULT',JSON.stringify({
    technicalAudit:'pass', economicOutcome:stop?'strategy-stop':'60-days-observed',
    tick:end.tick,days:end.tick/DAY,hash:end.hash,firstBlocked,stop,
    actions:trace.filter(x=>x.id),timeSteps:trace.filter(x=>x.minutes).length,
    checkpoints:checkpoints.size,houseAccount:end.houseAccount,cash:end.cash,
    freight:end.freight,ore:end.ore,owned:end.owned,
    limitation:'One explicit management strategy; not a universal earliest stop or a formal blind pass. A green test can reproduce an economic failure.'
  }));
  if(stop)continuation(replay);
});

 
// Early industrial diversification, independently from the late-stop audit.
// Use the published copy path while the original Nadir buyer and Aldera are
// still funded. Same real starting purchase in both arms; no W6 policy toggle.
test('M4 management: early funded industry diversification vs standard control', {timeout:20*60*1000},()=>{
  const source=start();
  assert.equal(source.ausfuehren('buy-st_aldera-frachter').ok,true);
  const original=source.exportieren(),sourceHash=source.ansicht().hash;
  const carrier=Object.values(source.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter').id;
  function open(json,profile,copy=false,external=false){
    const j=J8.erstellen();
    if(profile==='house')j.oeffnenHausErz(json,true,copy?'kopie':external?'datei':'lokal');
    else j.oeffnen204(json,true);
    return j;
  }
  function check(j,profile){
    const w=j.weltReferenz(),s=j.zustandReferenz();
    assert.equal(s.rulesVersion,204);
    assert.equal(Boolean(w.hausErzProfil),profile==='house');
    assert.deepEqual(pruefen(w,s),[]);
    assert.equal(s.owners.house.cash>=0,true);
    assert.equal(s.minted,0);assert.equal(s.burned,0);
    return s;
  }
  function report(j,profile){
    const w=j.weltReferenz(),s=check(j,profile),{offers,p}=quote(j),i=s.kanon.industrieErz;
    return JSON.parse(JSON.stringify({
      tick:s.tick,day:s.tick/DAY,hash:w.hash(s),
      cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
      houseAccount:s.stats.konto.house,privateWater:s.kanon.haushalte.pilot_house??null,
      warehouses:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager},
      ledger:s.ledger,localSales:s.stats.verkaeufe,
      own:Object.values(s.ships).filter(sh=>sh.owner==='house').map(sh=>({
        id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
        cargo:sh.ladung,pendel:s.kanon.pendel[sh.id]??null,value:w.buchwert(s,sh.id)})),
      freight:{completed:p.frachtAbgeschlossen,fees:p.frachtGebuehrBisher,wages:p.frachtLohnBisher},
      industry:{w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
        houseReceipts:s.w5ad.freight.filter(f=>f.owner==='house'),
        contract:i,active:s.w3.auftrag,gebunden:w.bericht(s).gebunden,
        lastRejected:s.kanon.hausErz?.grund??null},
      limits:{waterTarget:s.kanon.politik.wasserwerkBis,iceFree:p.eisFrei,
        oreCost:p.erzKosten,alderaCash:p.alderaKasse,exportCash:p.erzExportKasse,
        privateSaving:s.kanon.politik.sparquote.pilot_house,npcAuto:s.kanon.npcAuto===true},
      offers:offers.map(({id,ok,reason,kaufPlan})=>({id,ok,reason,kaufPlan}))
    }));
  }
  function run(profile){
    let j=open(original,profile,profile==='house');
    const initial=j.exportieren(),trace=[],saves=new Map(),observations=[];
    const action=(id,reason)=>{
      const s=j.zustandReferenz(),before=j.exportieren(),tick=s.tick;
      const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);
      assert.notEqual(j.exportieren(),before);
      check(j,profile);trace.push({tick,id,reason});
    };
    const advance=minutes=>{j.weiterspielen(minutes);trace.push({minutes});};
    function checkpoint(label,external=false){
      const json=j.exportieren();
      saves.set(trace.length,{json,external});
      j=open(json,profile,false,external);
      assert.equal(j.exportieren(),json);
      observations.push({label,...report(j,profile)});
    }
    checkpoint('initial-carrier');
    assert.equal(j.zustandReferenz().tick,0);
    deny(j,'ore-sh001');deny(j,'freight-'+carrier+'-20');
    if(profile==='house'){
      assert.throws(()=>open(initial,'standard'),/Haus-Erz|Profil/);
      assert.throws(()=>J8.erstellen().oeffnenHausErz(original,false,'kopie'));
      advance(1);
      const offer=j.angebote().find(o=>o.ok&&o.id.startsWith('haus-erz-'));
      assert.ok(offer,'existing published minute-one carrier-only path must offer the first contract');
      checkpoint('first-offer');
      action(offer.id,'first funded industrial contract before export buyer depletion');
      deny(j,offer.id);
      // Confirm original funded buyer decision, not an artificial direct core commit.
      advance(1);
      const s=check(j,profile);
      assert.equal(s.w3.auftrag?.carrier,'house');
      assert.deepEqual([s.owners.w3_kauf_treuhand.cash,s.owners.w3_arbeit_treuhand.cash,
        s.owners.k7_werft_treuhand.cash],[740,120,530]);
      checkpoint('first-paid-contract',true);
    }else{
      advance(1);deny(j,'industrialOreAcceptFreight');advance(1);
    }
    action('buy-st_aldera-miner','one productive miner alongside the existing carrier');
    const miner=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
    const ice='ice-'+miner,stopId='stop-'+miner;
    const init=quote(j);
    if(init.offers.find(o=>o.id===ice&&o.ok))action(ice,'local ice supply for genuine paid F4');
    let lastRevenue=j.zustandReferenz().stats.konto.house.erloes,lastIncome=2,
      lastDecision=2,paused=false,stop=null,days=0,lastIndustrial=0;
    while(j.zustandReferenz().tick<LIMIT){
      const s=j.zustandReferenz(),tick=s.tick;
      const receiptCount=s.w5ad.freight.filter(f=>f.owner==='house').length;
      if(receiptCount>lastIndustrial){
        lastIndustrial=receiptCount;checkpoint('industrial-receipt-'+receiptCount);
      }
      const rev=s.stats.konto.house.erloes;
      if(rev>lastRevenue){lastRevenue=rev;lastIncome=tick;}
      const {offers,p}=quote(j);
      const get=id=>offers.find(o=>o.id===id&&o.ok);
      const contract=offers.find(o=>o.ok&&o.id.startsWith('haus-erz-'));
      const f=offers.find(o=>o.ok&&o.id.startsWith('freight-'));
      const busy=Boolean(s.w3.auftrag?.carrier==='house'||p.frachtOffen);
      if(contract){
        action(contract.id,'prioritize fully funded industrial chain');
        deny(j,contract.id);
        lastDecision=tick;
        advance(1);checkpoint('after-industrial-decision');
        continue;
      }
      if(f){
        action(f.id,'use available genuine paid F4 between industrial jobs');
        lastDecision=tick;
      }else if(!busy&&paused){
        const ore=get('ore-'+miner);
        if(ore&&p.erzExportKasse>=p.erzKosten){
          action(ore.id,'diversify idle miner into genuinely funded local W1');
          paused=false;lastDecision=tick;
        }else if(get(ice)&&p.eisLager<p.eisCharge&&p.eisFrei>=p.eisCharge
          &&p.alderaKasse>=p.ankaufKosten&&p.nadirKasse>=p.nadirFrachtbedarf
          &&p.hausKasse>=p.frachtLohnbedarf){
          action(ice,'restart only with credible complete ice round');
          paused=false;lastDecision=tick;
        }
      }
      if(!busy&&!f&&tick-Math.max(lastIncome,lastDecision)>=DAY&&!paused){
        if(get(stopId)&&!j.zustandReferenz().kanon.pendel[miner]?.beenden)
          action(stopId,'cost control after one day without receipts or new orders');
        paused=true;checkpoint('cost-control');
      }
      if(!busy&&!f&&paused&&tick-Math.max(lastIncome,lastDecision)>=3*DAY
        &&!j.zustandReferenz().kanon.pendel[miner]){
        stop={tick,lastIncome,lastDecision,reason:'three days without receipts or new orders, miner paused; no funded restart at observed decision point'};
        break;
      }
      // Observe frequently near contract availability; normal 60-minute
      // manager steps during active work. Never skip or mutate world time.
      const remain=LIMIT-tick;
      const step=busy||f?60:10;
      advance(remain>=step?step:remain>=10?10:1);
      const now=j.zustandReferenz().tick;
      if(Math.floor(now/DAY)>days){days=Math.floor(now/DAY);checkpoint('day-'+days);}
    }
    checkpoint('final');
    const end=report(j,profile),target=j.exportieren();
    assert.ok(stop||end.tick===LIMIT);
    for(const f of end.industry.houseReceipts)
      assert.deepEqual([f.amount,f.end-f.start,f.fee,f.work,f.owner],[50,120,240,120,'house']);
    if(profile==='house'){
      assert.ok(end.industry.houseReceipts.length>=1,'real completed first contract, not just consent');
      assert.ok(end.industry.w4>=1&&end.industry.w5>=1);
    }else assert.equal(end.industry.houseReceipts.length,0);
    let replay=open(initial,profile);
    for(let n=0;n<trace.length;n++){
      const step=trace[n];
      if(step.id){
        assert.equal(replay.zustandReferenz().tick,step.tick);
        const r=replay.ausfuehren(step.id);assert.equal(r.ok,true,step.id+': '+r.reason);
      }else replay.weiterspielen(step.minutes);
      const save=saves.get(n+1);
      if(save){
        assert.equal(replay.exportieren(),save.json);
        replay=open(save.json,profile,false,save.external);
      }
    }
    assert.equal(replay.exportieren(),target);
    assert.equal(source.exportieren(),original);
    // Reproduce the common prefix from the untouched regular career as well.
    const prefix=start();
    assert.equal(prefix.ausfuehren('buy-st_aldera-frachter').ok,true);
    assert.equal(prefix.exportieren(),original);
    assert.equal(open(prefix.exportieren(),profile,profile==='house').exportieren(),initial);
    console.log('M4_MANAGEMENT_60D_EARLY',JSON.stringify({profile,sourceHash,sourceUnchanged:true,
      stop,replay:true,actions:trace.filter(x=>x.id),timeSteps:trace.filter(x=>x.minutes).length,
      checkpoints:observations,final:end}));
    return {tick:end.tick,hash:end.hash,stop,houseCash:end.cash.house,
      houseAccount:end.houseAccount,aldera:end.cash.st_aldera,nadir:end.cash.st_nadir,
      export:end.cash.export,privateCash:end.cash.pilot_house,
      iceTrips:end.freight.completed,industrialTrips:end.industry.houseReceipts.length,
      w4:end.industry.w4,w5:end.industry.w5,gebunden:end.industry.gebunden};
  }
  const standard=run('standard'),house=run('house');
  console.log('M4_MANAGEMENT_60D_EARLY_RESULT',JSON.stringify({standard,house,
    sourceHash,sourceUnchanged:source.exportieren()===original,
    scope:'Paired original career, voluntary early house copy only in second arm; stop or actual 60 days. One carrier/one miner strategy, no policy change, no private rescue, no universal strategy or standard pass claim.'}));
});
