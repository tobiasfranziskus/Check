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
// W-20261127-02: record original binding objects, not a UI inference.
function freightBindings(j){
  const s=j.zustandReferenz(),w=j.weltReferenz();
  const a=s.w3.auftrag, i=s.kanon.industrieErz, e=s.w5n.frachtauftrag;
  const ship=id=>{const sh=s.ships[id];return sh?{id,owner:sh.owner,klasse:sh.klasse,
    system:sh.system,phase:sh.phase,auftrag:sh.auftrag,flug:sh.flug?.lage,
    cargo:sh.ladung,pendel:s.kanon.pendel[id]??null,
    oreContract:s.erzpilotVertraege?.[id]??null,retired:w.stillgelegt(s,id),
    remaining:w.restAktivminuten(s,id)}:null;};
  return JSON.parse(JSON.stringify({
    w3:a,ice:e,industry:i,transfer:s.w5ac.active,returnWater:s.kanon.rueckfracht,
    minerTransfer:s.kanon.minerWerft?.transport??null,
    w3Carrier:ship(a?.schiff),w3Miner:ship(a?.industrieMiner),
    houseCarriers:Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='frachter').map(sh=>ship(sh.id)),
    openHouseF4:(s.kanon.spielerFrachten?.auftraege??[]).filter(x=>x.end===null),
    lastHouseF4:s.kanon.spielerFrachten?.auftraege.at(-1)??null,
    reserves:Object.fromEntries(['w3_kauf_treuhand','w3_arbeit_treuhand','k7_werft_treuhand',
      'w5n_fracht_kauf','w5n_fracht_arbeit','w5ac_transfer_reserved'].map(id=>[id,s.owners[id]?.cash??0])),
    oreAtSource:s.stations.st_aldera.lager.erz,oreAtDestination:s.stations.st_nadir.lager.erz
  }));
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
    bindings:freightBindings(j),ledger:s.ledger,manager:{ice:p.abbau,freight:p.transport,ore:p.erzauftrag,
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
  // Pinned standard control: its observed stop is not a foreign W3 reservation.
  assert.equal(end.tick,9120);
  assert.equal(end.bindings.w3,null);
  assert.equal(end.bindings.ice,null);
  assert.equal(end.bindings.reserves.w3_kauf_treuhand,0);
  assert.equal(end.bindings.reserves.w3_arbeit_treuhand,0);
  assert.equal(deny(j,'freight-sh003'),'Eislager Nadir voll');
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


// Rounds 8/9: the existing S02 start exactly as published in spiel.js:176-200.
// Round 9 corrects the test-only replacement ferry timing after inspecting actual logs.
// This is neither the ordinary standard career nor a new rule/combined profile.
test('M4 management: published S02 opt-in, funded fleet replacement and 60-day gate', {timeout:20*60*1000},()=>{
  const standard=start(),standardJson=standard.exportieren();
  const activate=()=>{
    const j=start(),w=j.weltReferenz(),s=j.zustandReferenz();
    // Exactly the three existing public start-controller calls, no other policy changes.
    w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
    w.npcAutoSetzen(s,true);
    w.npcSiliziumSetzen(s,true);
    assert.ok(w.audit(s).ok);
    return j;
  };
  function check(j){
    const s=j.zustandReferenz(),w=j.weltReferenz();
    assert.equal(s.rulesVersion,204);
    assert.equal(Boolean(w.hausErzProfil),false);
    assert.equal(s.kanon.npcAuto,true);
    assert.equal(s.kanon.npcSilizium.aktiv,true);
    assert.equal(s.kanon.politik.stilllegung,true);
    assert.equal(s.kanon.politik.betriebsreserve.werft_extern,1060);
    assert.deepEqual(pruefen(w,s),[]);
    return s;
  }
  let j=activate();
  const initial=j.exportieren(),trace=[],saves=new Map(),reports=[];
  assert.equal(j.zustandReferenz().owners.house.cash,3000);
  assert.notEqual(j.ansicht().hash,standard.ansicht().hash);
  function open(json){
    const j=J8.erstellen();j.oeffnen204(json,true);check(j);return j;
  }
  function report(label){
    const s=check(j),w=j.weltReferenz(),{offers,p}=quote(j),book=s.kanon.buch?.summen||{};
    const row=JSON.parse(JSON.stringify({label,tick:s.tick,day:s.tick/DAY,hash:w.hash(s),
      cash:Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash])),
      houseAccount:s.stats.konto.house,ledger:s.ledger,
      warehouses:{aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager},
      owned:Object.values(s.ships).filter(sh=>sh.owner==='house').map(sh=>({
        id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
        value:w.buchwert(s,sh.id),retired:w.stillgelegt(s,sh.id),
        activeRemaining:w.restAktivminuten(s,sh.id),cargo:sh.ladung,pendel:s.kanon.pendel[sh.id]??null})),
      ownership:Object.values(s.ships).map(sh=>({id:sh.id,owner:sh.owner,klasse:sh.klasse})),
      freight:{completed:p.frachtAbgeschlossen,fees:p.frachtGebuehrBisher,wages:p.frachtLohnBisher},
      industry:{w3:s.w3.abgeschlossen,w4:s.w4.abgeschlossen,w5:s.w5.fertig,
        replacement:s.kanon.ersatzkaeufe,transfers:s.w5ac.completed},
      npc:s.kanon.npc,privateWater:s.kanon.haushalte.pilot_house??null,
      bindings:freightBindings(j),books:book,world:w.bericht(s),offers:offers.map(({id,ok,reason,kaufPlan})=>({id,ok,reason,kaufPlan}))
    }));
    reports.push(row);
    console.log('M4_MANAGEMENT_60D_S02_CHECKPOINT',JSON.stringify(row));
    return row;
  }
  function checkpoint(label){
    const json=j.exportieren();
    saves.set(trace.length,json);
    j=open(json);
    assert.equal(j.exportieren(),json);
    return report(label);
  }
  function act(id,reason){
    const before=j.exportieren(),s=j.zustandReferenz(),tick=s.tick,
      cash=s.owners.house.cash,ships=new Set(Object.keys(s.ships));
    const r=j.ausfuehren(id);assert.equal(r.ok,true,id+': '+r.reason);
    assert.notEqual(j.exportieren(),before);
    const end=check(j);
    const acquired=Object.values(end.ships).filter(sh=>!ships.has(sh.id));
    if(id.startsWith('buy-')){
      assert.equal(acquired.length,1);assert.equal(acquired[0].owner,'house');
      assert.ok(end.owners.house.cash<cash);
    }
    trace.push({tick,id,reason,houseCashDelta:end.owners.house.cash-cash,
      acquired:acquired.map(sh=>sh.id)});
  }
  function advance(minutes){j.weiterspielen(minutes);trace.push({minutes});}
  checkpoint('S02-start');
  for(const id of ['ore-sh001','industrialOreAcceptFreight','buy-st_nadir-frachter-for-transport',
    'stationBuildShip-for-house','transport:shipBuy'])deny(j,id);
  const invalid=JSON.parse(initial);invalid.kanon.npcSilizium.aktiv='gratis';
  assert.throws(()=>open(JSON.stringify(invalid)));
  // Reuse the published, already verified P3 S02 first industrial-hull route.
  // Leave the founding Aldera freighter to the independent NPC logistics firm.
  for(let i=0;i<5;i++)advance(60);
  const first=checkpoint('first-NPC-industry-300');
  assert.ok(first.industry.w3>=1&&first.industry.w4>=1&&first.industry.w5>=1);
  act('buy-st_nadir-frachter','reinvest original start cash into real W5 production, not a rescue purchase');
  const firstCarrier=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter').id;
  assert.ok(j.zustandReferenz().w5.schiffIds.includes(firstCarrier));
  act('reposition-'+firstCarrier,'paid original 60-minute W5ac ferry');
  checkpoint('paid-ferry-in-progress');
  advance(60);
  act('buy-st_aldera-miner','one productive miner to supply paid ice business');
  const firstMiner=Object.values(j.zustandReferenz().ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
  act('ice-'+firstMiner,'start original ice shuttle');
  advance(60);advance(60);
  checkpoint('first-ice-supply');
  let lastRevenue=j.zustandReferenz().stats.konto.house.erloes,
    lastIncome=j.zustandReferenz().tick,lastDecision=lastIncome,lastFreight=0,
    stopped=null,lastDay=0;
  const replacementFerries=[],blockedFerries=new Set(),recoverySources=new Map();
  while(j.zustandReferenz().tick<LIMIT){
    const s=check(j),w=j.weltReferenz(),tick=s.tick,{offers,p}=quote(j);
    if(s.stats.konto.house.erloes>lastRevenue){lastRevenue=s.stats.konto.house.erloes;lastIncome=tick;}
    if(tick===32570||tick===7220||tick===11520||tick===27570||tick===33120)
      recoverySources.set(tick,j.exportieren());
    if(p.frachtAbgeschlossen>lastFreight){
      lastFreight=p.frachtAbgeschlossen;
      if(lastFreight===1)checkpoint('first-paid-house-F4');
    }
    const available=id=>offers.find(o=>o.id===id&&o.ok);
    const own=Object.values(s.ships).filter(sh=>sh.owner==='house'&&!w.stillgelegt(s,sh.id));
    const carriers=own.filter(sh=>sh.klasse==='frachter');
    const miners=own.filter(sh=>sh.klasse==='miner'&&sh.system==='aldera');
    const activeMiner=miners.some(sh=>s.kanon.pendel[sh.id]&&!s.kanon.pendel[sh.id].beenden);
    const freight=offers.find(o=>o.ok&&o.id.startsWith('freight-'));
    const capable=carriers.some(sh=>sh.system==='aldera'&&(w.restAktivminuten(s,sh.id)??Infinity)>=120);
    const buyerReady=p.eisFrei>=p.eisCharge&&p.nadirKasse>=p.nadirFrachtbedarf
      &&p.hausKasse>=p.frachtLohnbedarf;
    const sourceReady=p.eisLager>=p.eisCharge||p.alderaKasse>=p.ankaufKosten;
    let acted=false;
    // A replacement bought for a genuinely financed route is an existing
    // asset, not a fresh speculative purchase. Its paid ferry need NOT
    // coincide with 50 free ice slots in Nadir. The old audit mistakenly
    // required buyerReady/sourceReady at the ferry decision as well.
    const pending=carriers.filter(sh=>sh.system==='nadir'&&s.w5.schiffIds.includes(sh.id)
      &&!s.w5ac.completed.some(t=>t.id===sh.id));
    const pendingOffer=offers.find(o=>o.ok&&pending.some(sh=>o.id==='reposition-'+sh.id));
    for(const sh of pending){
      const o=offers.find(o=>o.id==='reposition-'+sh.id);
      if(o&&!o.ok&&!blockedFerries.has(sh.id)){
        assert.equal(deny(j,o.id),o.reason);
        blockedFerries.add(sh.id);
        console.log('M4_MANAGEMENT_60D_S02_FERRY_BLOCKED',JSON.stringify({tick,id:sh.id,reason:o.reason,
          w3:s.w3.auftrag,w5n:s.w5n.frachtauftrag,w5ac:s.w5ac.active}));
      }
    }
    if(pendingOffer&&p.hausKasse>=pendingOffer.kosten+p.frachtLohnbedarf){
      assert.deepEqual([pendingOffer.kosten,pendingOffer.minuten],[60,60]);
      const id=pendingOffer.id.slice(11),cash=s.owners.house.cash;
      act(pendingOffer.id,'deploy already purchased replacement at first observed legal paid ferry window');
      const paid=check(j);
      assert.equal(paid.owners.house.cash,cash-60);
      assert.equal(paid.w5ac.active?.id,id);
      assert.equal(paid.w5ac.active?.owner,'house');
      replacementFerries.push({id,start:tick,cost:60,buyerReady,sourceReady});
      checkpoint('replacement-ferry-paid-'+id);
      acted=true;
    }else if(freight){
      act(freight.id,'accept actually funded house F4 with available original hull');
      acted=true;
    }else if(!capable&&!p.frachtOffen&&buyerReady&&sourceReady){
      if(!carriers.some(sh=>sh.system==='nadir')&&!s.w5ac.active){
        // Only a needed replacement, not speculative purchase of all output.
        const buy=available('buy-st_aldera-frachter')||available('buy-st_nadir-frachter');
        if(buy){
          const need=(buy.kaufPlan?.kaufpreis??w.rules.economy.waren.frachter.basis)
            +(buy.id.includes('nadir')?(buy.kaufPlan?.ueberfuehrung?.kosten??60):0)
            +p.frachtLohnbedarf;
          if(p.hausKasse>=need){
            act(buy.id,'replace exhausted productive carrier only while route is financed');
            checkpoint('replacement-purchase');
            acted=true;
          }
        }
      }
    }
    if(!acted&&!activeMiner&&buyerReady&&p.eisLager<p.eisCharge&&p.alderaKasse>=p.ankaufKosten){
      const ice=offers.find(o=>o.ok&&o.id.startsWith('ice-'));
      if(ice){act(ice.id,'restart ice supply using existing hull');acted=true;}
      else if(!miners.length&&available('buy-st_aldera-miner')&&capable){
        act('buy-st_aldera-miner','replace exhausted ice miner for funded operating route');acted=true;
      }
    }
    if(!acted&&!activeMiner){
      const ore=offers.find(o=>o.ok&&o.id.startsWith('ore-'));
      if(ore&&p.erzExportKasse>=p.erzKosten){act(ore.id,'real local ore alternative when export and source are funded');acted=true;}
    }
    if(acted)lastDecision=tick;
    if(!acted&&!p.frachtOffen&&tick-Math.max(lastIncome,lastDecision)>=DAY){
      const pause=offers.find(o=>o.ok&&o.id.startsWith('stop-')
        &&!s.kanon.pendel[o.id.slice(5)]?.beenden);
      if(pause){act(pause.id,'stop unproductive duty after a day without receipts or orders');checkpoint('cost-control');}
    }
    // NPCs can resume trade independently; allow seven full days of observation
    // after last paid receipt / new order before calling this strategy stopped.
    if(!acted&&!p.frachtOffen&&!s.w5ac.active&&
      tick-Math.max(lastIncome,lastDecision)>=7*DAY&&
      !miners.some(sh=>s.kanon.pendel[sh.id]&&!s.kanon.pendel[sh.id].beenden)){
      stopped={tick,lastIncome,lastDecision,reason:'seven days without receipt or new funded productive decision, no active house freight'};
      break;
    }
    // Use normal 10-minute manager steps while awaiting a free global
    // transfer slot. Do not skip a newly purchased hull's first quote.
    const step=p.frachtOffen||acted||s.w5ac.active?60:10,remain=LIMIT-tick;
    advance(remain>=step?step:remain>=10?10:1);
    const day=Math.floor(j.zustandReferenz().tick/DAY);
    if(day>lastDay){lastDay=day;checkpoint('day-'+day);}
  }
  const end=checkpoint('final'),target=j.exportieren();
  assert.ok(stopped||end.tick===LIMIT);
  assert.ok(end.freight.completed>=1,'real house business, not just NPC world evolution');
  assert.equal(end.freight.fees,end.freight.completed*240);
  assert.equal(end.freight.wages,end.freight.completed*120);
  for(const ferry of replacementFerries){
    const receipt=end.industry.transfers.find(t=>t.id===ferry.id&&t.owner==='house');
    assert.ok(receipt,'replacement transfer must complete with original receipt');
    assert.deepEqual([receipt.start,receipt.ankunft,receipt.kosten,receipt.minuten],
      [ferry.start,ferry.start+60,60,60]);
  }
  assert.ok(replacementFerries.length>=1,'known reachable replacement ferry must be exercised');
  // Independent reproduction on the unchanged strategy and original stop.
  assert.equal(end.tick,42650);
  assert.equal(end.hash,'f066f574f2748a4c');
  const bound=end.bindings, old=j.exportieren(), w=j.weltReferenz();
  const hull=bound.houseCarriers.find(sh=>sh.id==='sh026');
  assert.equal(hull.owner,'house');
  assert.deepEqual([hull.system,hull.phase,hull.auftrag,hull.flug,hull.retired,hull.remaining],
    ['aldera','dock','halten','angedockt',false,2320]);
  assert.ok(Object.values(hull.cargo).every(n=>n===0));
  assert.equal(hull.pendel,null);
  assert.equal(bound.ice,null);
  assert.equal(bound.transfer,null);
  assert.deepEqual(bound.openHouseF4,[]);
  assert.deepEqual([bound.lastHouseF4.schiff,bound.lastHouseF4.start,bound.lastHouseF4.geliefert,
    bound.lastHouseF4.end,bound.lastHouseF4.menge,bound.lastHouseF4.fracht,bound.lastHouseF4.arbeit],
    ['sh026',32450,32510,32570,50,240,120]);
  assert.ok(bound.w3,'original global W3 binding');
  assert.notEqual(bound.w3.schiff,'sh026');
  assert.equal(bound.w3Carrier.owner,'transport');
  assert.equal(bound.w3.phase,'vorbestellt');
  assert.deepEqual([bound.reserves.w3_kauf_treuhand,bound.reserves.w3_arbeit_treuhand,
    bound.reserves.k7_werft_treuhand],[740,120,530]);
  assert.deepEqual([bound.reserves.w5n_fracht_kauf,bound.reserves.w5n_fracht_arbeit,
    bound.reserves.w5ac_transfer_reserved],[0,0,0]);
  assert.equal(deny(j,'freight-sh026'),'Frachter bereits gebunden');
  const commands=j.angebote();
  assert.ok(!commands.some(o=>o.id==='industrialOreCancel'));
  const playerCancel=deny(j,'industrialOreCancel');
  deny(j,'industrialOreAcceptFreight');
  // Counterfactual authority probe ONLY on independent original save clones.
  // Never perform an NPC command in the played or replayed strategy.
  const rejected=w.load(old);
  const ownCancel=w.execute(rejected,{type:'industrialOreCancel',owner:'house'});
  assert.equal(ownCancel.ok,false);
  assert.equal(w.save(rejected),old);
  const probe=w.load(old);
  const buyerCancel=w.execute(probe,{type:'industrialOreCancel',owner:'st_nadir'});
  let afterCancel=null;
  if(buyerCancel.ok){
    assert.deepEqual(pruefen(w,probe),[]);
    assert.equal(probe.w3.auftrag,null);
    assert.deepEqual([probe.owners.w3_kauf_treuhand.cash,probe.owners.w3_arbeit_treuhand.cash,
      probe.owners.k7_werft_treuhand.cash],[0,0,0]);
    const q=open(w.save(probe));
    const post=quote(q).offers.find(o=>o.id==='freight-sh026');
    afterCancel={bindings:freightBindings(q),offer:post,world:w.bericht(probe)};
  }else assert.equal(w.save(probe),old);
  // W-20261127-02 follow-up: distinguish unpaid W3 flight from already
  // completed W1 work. Original NPC commands only on discarded save clones.
  assert.equal(bound.industry.erzAngenommen,true);
  assert.equal(bound.oreAtSource,9);
  assert.equal(buyerCancel.ok,true,'current implementation allows cancellation after W1 acceptance');
  const accounts=s=>Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  const owners=s=>Object.fromEntries(Object.entries(s.ships).map(([id,sh])=>[id,sh.owner]));
  const refund=(source,label,accepted)=>{
    const state=w.load(source),before=accounts(state),goods=JSON.stringify(state.ledger),
      ownership=owners(state),i=structuredClone(state.kanon.industrieErz);
    assert.equal(i.erzAngenommen,accepted);
    const res=w.execute(state,{type:'industrialOreCancel',owner:'st_nadir'});
    assert.equal(res.ok,true,label);
    assert.deepEqual(pruefen(w,state),[]);
    assert.equal(JSON.stringify(state.ledger),goods);
    assert.deepEqual(owners(state),ownership);
    const cash=accounts(state),deltas=Object.fromEntries(Object.keys(before)
      .filter(id=>cash[id]!==before[id]).map(id=>[id,cash[id]-before[id]]));
    assert.deepEqual(deltas,{st_nadir:740,transport:120,werft_extern:530,
      w3_kauf_treuhand:-740,w3_arbeit_treuhand:-120,k7_werft_treuhand:-530});
    assert.equal(state.w3.auftrag,null);
    assert.equal(state.kanon.industrieErz.phase,'storniert');
    const canceled=w.save(state);
    assert.equal(open(canceled).exportieren(),canceled);
    return {label,tick:state.tick,accepted,deltas,sourceUnchanged:true,json:canceled};
  };
  const rejectCancel=(source,label,owner='st_nadir')=>{
    const state=w.load(source),res=w.execute(state,{type:'industrialOreCancel',owner});
    assert.equal(res.ok,false,label);
    assert.equal(w.save(state),source,label+' state-neutral');
    return {label,tick:state.tick,owner,reason:res.reason};
  };
  // Follow the exact reached start of the final W3 reservation minute by
  // minute; there are no real manager commands before the next day checkpoint.
  const source=recoverySources.get(32570);
  assert.ok(source,'actual W3 commit checkpoint');
  assert.ok(!trace.some(x=>x.id&&x.tick>=32570&&x.tick<33120));
  const microscopic=w.load(source);
  const changes=[], startLedger=structuredClone(microscopic.ledger.erz);
  assert.equal(microscopic.kanon.industrieErz.erstellt,32570);
  assert.equal(microscopic.kanon.industrieErz.erzAngenommen,false);
  let partial=null,unbegun=null,previous='';
  for(let n=0;n<=550;n++){
    const m=microscopic.ships.sh024, i=microscopic.kanon.industrieErz;
    const row={tick:microscopic.tick,accepted:i.erzAngenommen,
      mine:microscopic.ledger.erz.mined,export:microscopic.ledger.erz.exported,
      ore:microscopic.stations.st_aldera.lager.erz,cargo:m.ladung.erz??0,
      contract:microscopic.erzpilotVertraege?.sh024??null,
      flight:m.flug.lage,order:m.auftrag};
    if(JSON.stringify({...row,tick:0})!==previous){
      changes.push(structuredClone(row));previous=JSON.stringify({...row,tick:0});
    }
    if(!partial&&!i.erzAngenommen&&row.cargo>0&&row.contract)
      partial=w.save(microscopic);
    if(!unbegun&&!i.erzAngenommen&&!row.contract&&!row.cargo&&m.flug.lage==='angedockt')
      unbegun=w.save(microscopic);
    if(n<550)w.advance(microscopic,1);
  }
  assert.equal(w.save(microscopic),recoverySources.get(33120),'minute trace matches actual career checkpoint');
  assert.ok(partial,'real positive partial W1 cargo');
  assert.equal(microscopic.ledger.erz.mined-startLedger.mined,50);
  assert.equal(microscopic.ledger.erz.exported-startLedger.exported,41);
  assert.equal(microscopic.stations.st_aldera.lager.erz,9);
  const acceptance=changes.find(x=>x.accepted);
  assert.ok(acceptance);
  // Earlier reached checkpoints cover empty cancellation and actual W3 transit.
  const emptySource=unbegun??recoverySources.get(7220);
  assert.ok(emptySource);
  const empty=w.load(emptySource);
  assert.equal(empty.kanon.industrieErz.erzAngenommen,false);
  assert.equal(empty.erzpilotVertraege?.[empty.w3.auftrag.industrieMiner],undefined);
  const activeSource=recoverySources.get(27570);
  assert.equal(w.load(activeSource).w3.auftrag.phase,'rueck');
  const cases=[rejectCancel(emptySource,'foreign house','house'),
    rejectCancel(emptySource,'foreign carrier','transport'),
    rejectCancel(partial,'real partial ore'),
    rejectCancel(activeSource,'active W3 return')];
  const emptyRefund=refund(emptySource,'unbegun W3/W1',false);
  const lateRefund=refund(old,'W1 accepted, W3 still unbegun (existing behavior, NOT proposed automatic recovery)',true);
  // Counterfactual only: the current command permits the late refund.
  // This is a feasibility demonstration, not an endorsement of this cancellation.
  const runF4=()=>{
    let q=open(lateRefund.json);
    const b=q.zustandReferenz().kanon.spielerFrachten;
    const count=b.auftraege.length,fees=b.gebuehr,lohn=b.lohn,tick=q.zustandReferenz().tick;
    assert.equal(q.ausfuehren('freight-sh026').ok,true);
    q.weiterspielen(60);
    const mid=q.exportieren();q=open(mid);
    assert.equal(q.exportieren(),mid);
    q.weiterspielen(60);
    const result=check(q).kanon.spielerFrachten, last=result.auftraege.at(-1);
    assert.equal(result.auftraege.length,count+1);
    assert.deepEqual([last.schiff,last.start,last.geliefert,last.end,last.menge,
      result.gebuehr-fees,result.lohn-lohn],['sh026',tick,tick+60,tick+120,50,240,120]);
    return {receipt:last,hash:q.ansicht().hash,json:q.exportieren()};
  };
  const counter=runF4();assert.equal(runF4().json,counter.json);
  assert.equal(j.exportieren(),old);
  console.log('M4_MANAGEMENT_60D_W3_RECOVERY',JSON.stringify({
    start:32570,end:33120,changes,acceptance,
    rejected:cases,refunds:[emptyRefund,lateRefund].map(({json,...rest})=>rest),
    counterfactual:{receipt:counter.receipt,hash:counter.hash,replay:true},
    actualSourceUnchanged:true,
    scope:'No NPC command in actual manager trace. Existing late cancellation permits W1-accepted case; not a safe automatic empty cancellation. No rule change.'
  }));
  console.log('M4_MANAGEMENT_60D_W3_BINDING',JSON.stringify({tick:end.tick,hash:end.hash,
    bindings:bound,playerCancel,ownCancel,buyerCancel,afterCancel,
    sourceUnchanged:true,scope:'Counterfactual legal-owner command on isolated save only; no NPC impersonation or cancellation in actual manager trace.'}));
  let replay=activate();
  assert.equal(replay.exportieren(),initial);
  for(let n=0;n<trace.length;n++){
    const step=trace[n];
    if(step.id){
      assert.equal(replay.zustandReferenz().tick,step.tick);
      const r=replay.ausfuehren(step.id);assert.equal(r.ok,true,step.id+': '+r.reason);
    }else replay.weiterspielen(step.minutes);
    if(saves.has(n+1)){
      assert.equal(replay.exportieren(),saves.get(n+1));
      replay=open(replay.exportieren());
    }
  }
  assert.equal(replay.exportieren(),target);
  assert.equal(standard.exportieren(),standardJson);
  assert.equal(standard.zustandReferenz().kanon.npcAuto,undefined);
  console.log('M4_MANAGEMENT_60D_S02_RESULT',JSON.stringify({
    profile:'published Rule204 S02 opt-in',tick:end.tick,hash:end.hash,stop:stopped,
    lastIncome,lastDecision,houseCash:end.cash.house,houseAccount:end.houseAccount,
    freight:end.freight,industry:end.industry,owned:end.owned,
    cash:end.cash,world:end.world,replacementFerries,actions:trace.filter(x=>x.id),
    checkpoints:reports.length,replay:true,standardSourceUnchanged:true,
    scope:'Existing published S02 only; no Haus-Erz combination, no standard pass, no private rescue; one need-based replacement strategy, not an exhaustive optimizer. Technical JSON separation, not separate browser storage slots.'
  }));
});
