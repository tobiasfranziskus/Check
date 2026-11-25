import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

function original(){
  const j=J8.erstellen(); j.startenPiraten(true,'kampf');
  const w=j.weltReferenz();
  assert(j.ausfuehren('buy-st_aldera-frachter').ok);
  assert(j.ausfuehren('buy-st_aldera-miner').ok);
  const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
  const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
  assert(j.ausfuehren('ice-'+m).ok); w.advance(j.zustandReferenz(),120);
  assert(j.ausfuehren('freight-'+f).ok); const s=j.zustandReferenz(); w.advance(s,56);
  let firstHit=null;
  for(let i=0;i<240;i++){
    w.teilschritt(s);
    if(firstHit===null && s.kanon.piraten.kampf.ereignisse.some(e=>e.schaden>0))
      firstHit=structuredClone(s);
  }
  assert(firstHit);
  w.advance(s,60);
  assert.equal(s.kanon.piraten.kampf.huellen[f],48);
  assert.equal(s.kanon.spielerFrachten.lohn,120);
  assert.equal(s.kanon.spielerFrachten.gebuehr,240);
  assert.equal(s.w5n.eisGeliefert,50);
  assert.equal(s.minted+s.burned,0);
  assert.equal(s.ships[f].owner,'house');
  assert.deepEqual(w.audit(s).fehler,[]);
  return {w,s,f,firstHit};
}

test('PIR-3b baseline: actual damaged hull remains owned and paid F4 is settled once',()=>{
  const {w,s,f}=original(), json=w.save(s);
  assert.equal(w.save(w.load(json)),json);
  assert.equal(w.hash(s),'aa301a2025e848cb');
  const sum=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  assert.equal(sum,s.initialSupply);
  console.log('PIR_3B_ORIGINAL '+JSON.stringify({id:f,hull:s.kanon.piraten.kampf.huellen[f],worldMoney:sum,hash:w.hash(s)}));
});

test('PIR-3b audit probes distinguish live state invariants from same-session import gate',()=>{
  const {w,s,f}=original(), before=w.save(s);
  const probes=[
    ['heal-only',k=>{k.huellen[f]=96;}],
    ['erase-only',k=>{k.ereignisse=[];}],
    ['erase-both',k=>{k.ereignisse=[];k.huellen={};}],
    ['remove-last-hit-consistently',k=>{k.ereignisse.pop();k.huellen[f]=72;}],
  ];
  const rows=[];
  for(const [name,mutate] of probes){
    const c=structuredClone(s); mutate(c.kanon.piraten.kampf);
    const a=w.audit(c);
    assert.throws(()=>w.load(JSON.stringify(c)),/unveränderte/);
    if(name==='heal-only'||name==='erase-only') assert.equal(a.ok,false);
    // Paired mutations are diagnostic: an accepted live audit is a finding,
    // not a passing security guarantee. Never register these clones with save().
    rows.push({name,liveAuditAccepted:a.ok,errors:a.fehler,externalImportRejected:true});
  }
  assert.equal(w.save(s),before);
  console.log('PIR_3B_AUDIT '+JSON.stringify(rows));
});

/** Independent comparison of two snapshots from the SAME observed run.
 * The earlier snapshot must be trusted externally, never supplied by an importer.
 * Not a signature, not a product runtime gate. */
function assertHistoryPrefix(w, earlier, later){
  assert(earlier.tick<=later.tick,'time rollback');
  const a=earlier.kanon.piraten.kampf.ereignisse;
  const b=later.kanon.piraten.kampf.ereignisse;
  assert(b.length>=a.length,'history shortened');
  assert.equal(w.canonical(b.slice(0,a.length)),w.canonical(a),'observed history changed');
}

test('PIR-3b trusted checkpoint accepts actual later hits but rejects observed history rollback',()=>{
  const {w,s,f,firstHit}=original();
  assert(firstHit.kanon.piraten.kampf.ereignisse.length<s.kanon.piraten.kampf.ereignisse.length);
  assertHistoryPrefix(w,firstHit,s);
  const checkpoint=structuredClone(s);
  const shortened=structuredClone(s);
  shortened.kanon.piraten.kampf.ereignisse.pop();
  shortened.kanon.piraten.kampf.huellen[f]=72;
  assert.equal(w.audit(shortened).ok,true);
  assert.throws(()=>assertHistoryPrefix(w,checkpoint,shortened),/history shortened/);
  const cleared=structuredClone(s);
  cleared.kanon.piraten.kampf={ereignisse:[],huellen:{}};
  assert.equal(w.audit(cleared).ok,true);
  assert.throws(()=>assertHistoryPrefix(w,checkpoint,cleared),/history shortened/);
  const edited=structuredClone(s);
  edited.kanon.piraten.kampf.ereignisse[0].distanzQuadrat=0;
  assert.throws(()=>assertHistoryPrefix(w,checkpoint,edited),/observed history changed/);
  w.advance(s,60);
  assertHistoryPrefix(w,checkpoint,s);
  assert.deepEqual(w.audit(s).fehler,[]);
  console.log('PIR_3B_PREFIX '+JSON.stringify({observed:checkpoint.kanon.piraten.kampf.ereignisse.length,earlier:firstHit.kanon.piraten.kampf.ereignisse.length,rollbackRejected:true,editRejected:true}));
});

test('PIR-3b repair feasibility inventory uses original audited stocks and dock',()=>{
  const {w,s,f}=original();
  const before=w.save(s), rows=[];
  for(const minutes of [0,60,1380,8640]){
    if(minutes) w.advance(s,minutes);
    const sh=s.ships[f];
    assert.equal(sh.owner,'house');
    assert.deepEqual(w.audit(s).fehler,[]);
    const hash=w.hash(s);
    const stationen=Object.keys(s.stations).sort().map(id=>({
      id,material:s.stations[id].lager.material??0,bauteile:s.stations[id].lager.bauteil??0,
      cash:s.owners[id]?.cash??null
    }));
    rows.push({tick:s.tick,system:sh.system,lage:sh.flug.lage,huelle:s.kanon.piraten.kampf.huellen[f],buchwert:w.buchwert(s,f),haus:s.owners.house.cash,stationen,werftkonten:Object.keys(s.owners).filter(id=>id.includes('werft')).sort().map(id=>({id,cash:s.owners[id].cash})),weltgeld:Object.values(s.owners).reduce((n,o)=>n+o.cash,0)});
    assert.equal(w.hash(s),hash);
    assert.equal(rows.at(-1).weltgeld,s.initialSupply);
  }
  assert.equal(w.hash(w.load(before)),'aa301a2025e848cb');
  console.log('PIR_3B_REPAIR_STOCK '+JSON.stringify(rows));
});

test('PIR-3b original industrial policy counterfactual: real refinery stock versus actual repair dock',()=>{
  const {w,s,f}=original(), source=w.save(s), initial=w.hash(s);
  const run=(optIn)=>{
    const c=w.load(source);
    // J8 PIR start ALREADY activates S02/NPC/Silicon. A real paired
    // experiment switches off only the existing NPC dispatcher in the control.
    // The civil policy and all existing obligations remain identical.
    assert.equal(c.kanon.npcAuto,true);
    assert.equal(c.kanon.npcSilizium.aktiv,true);
    if(!optIn) assert.equal(w.npcAutoSetzen(c,false).ok,true);
    assert.equal(c.kanon.npcAuto,optIn);
    assert.deepEqual(w.audit(c).fehler,[]);
    const start=c.tick, baseProduced=c.ledger.material.produced, baseConsumed=c.ledger.material.consumed;
    let firstNadir=null,firstAldera=null,peakNadir=0,peakAldera=0;
    const rows=[];
    function observe(){
      const a=c.stations.st_aldera.lager.material||0,n=c.stations.st_nadir.lager.material||0;
      if(a>0&&firstAldera===null)firstAldera=c.tick;
      if(n>0&&firstNadir===null)firstNadir=c.tick;
      peakAldera=Math.max(peakAldera,a);peakNadir=Math.max(peakNadir,n);
      assert.equal(c.ships[f].owner,'house');
      assert.equal(c.ships[f].system,'aldera');
      assert.equal(c.kanon.piraten.kampf.huellen[f],48);
      assert.equal(c.owners.house.cash,2028);
    }
    for(let i=1;i<=7*1440;i++){
      w.advance(c,1);observe();
      if(i===60||i===300||i%1440===0){
        assert.deepEqual(w.audit(c).fehler,[]);
        assert.equal(Object.values(c.owners).reduce((n,o)=>n+o.cash,0),c.initialSupply);
        assert.equal(c.minted+c.burned,0);
        rows.push({elapsed:i,nadir:c.stations.st_nadir.lager.material||0,aldera:c.stations.st_aldera.lager.material||0,produced:c.ledger.material.produced-baseProduced,consumed:c.ledger.material.consumed-baseConsumed,ore:c.stations.st_nadir.lager.erz||0,contract:c.kanon.industrieErz.phase,house:c.owners.house.cash});
      }
    }
    assert.equal(c.tick,start+7*1440,'no silently halted simulation');
    assert.equal(w.hash(w.load(w.save(c))),w.hash(c));
    return {optIn,start,firstNadir,firstAldera,peakNadir,peakAldera,rows,hash:w.hash(c)};
  };
  const control=run(false), industry=run(true), replay=run(true);
  assert.deepEqual(industry,replay);
  assert.notEqual(control.hash,industry.hash,'actual different NPC setting');
  assert.equal(w.hash(w.load(source)),initial);
  console.log('PIR_3B_SUPPLY_PAIR '+JSON.stringify({control,industry}));
});

test('PIR-3b original K7 contract prerequisites and real command counterprobe',()=>{
  const {w,s}=original(), source=w.save(s), initial=w.hash(s), rows=[];
  const thresholds={npc3:w.industriePreise.bergbau,st_aldera:w.industriePreise.alderakauf,
    st_nadir:w.industriePreise.nadiraufwand,transport:w.industriePreise.frachtlohn,
    werft_extern:w.industriePreise.werft};
  const c=w.load(source);
  for(const delta of [0,60,240,1140,8640]){
    w.advance(c,delta);
    assert.deepEqual(w.audit(c).fehler,[]);
    const before=w.save(c), probe=w.load(before), start=probe.tick;
    const cash=Object.entries(thresholds).map(([id,need])=>({id,need,actual:probe.owners[id].cash}));
    const fleet=Object.values(probe.ships).filter(sh=>sh.owner==='npc3'||sh.owner==='transport').map(sh=>({id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,lage:sh.flug?.lage,auftrag:sh.auftrag,ladung:sh.ladung,pendel:probe.kanon.pendel[sh.id]??null,stillgelegt:w.buchwert(probe,sh.id)===0}));
    const miners=fleet.filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner'&&!sh.stillgelegt);
    const freighters=fleet.filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter'&&!sh.stillgelegt);
    const m=miners.find(sh=>sh.system==='aldera'&&sh.lage==='angedockt'&&Object.values(sh.ladung).every(n=>n===0))??miners[0];
    const f=freighters.find(sh=>sh.system==='aldera'&&sh.phase==='dock'&&sh.auftrag==='halten'&&Object.values(sh.ladung).every(n=>n===0))??freighters[0];
    const commands=[];
    if(m&&f){
      for(const cmd of [{type:'industrialOreOffer',owner:'st_nadir',miner:m.id,frachter:f.id},{type:'industrialOreAcceptMine',owner:'npc3'},{type:'industrialOreAcceptFreight',owner:'transport'},{type:'industrialOreAcceptYard',owner:'werft_extern'},{type:'industrialOreCommit',owner:'st_nadir'}]){
        const pre=w.hash(probe), r=w.execute(probe,cmd);
        commands.push({type:cmd.type,ok:r.ok,reason:r.reason??null});
        if(!r.ok){assert.equal(w.hash(probe),pre,'rejection must be atomic');break;}
      }
      if(commands.length===5&&commands.every(x=>x.ok)){
        w.advance(probe,300);
        assert.deepEqual(w.audit(probe).fehler,[]);
      }
    }
    assert.equal(w.save(c),before,'counterprobe never changes original');
    assert.equal(Object.values(probe.owners).reduce((n,o)=>n+o.cash,0),probe.initialSupply);
    assert.equal(probe.minted+probe.burned,0);
    rows.push({tick:start,actualTick:probe.tick,cash,fleet,commands,contract:probe.kanon.industrieErz.phase,material:probe.stations.st_nadir.lager.material||0,produced:probe.ledger.material.produced,npcPauses:c.kanon.npc.pausen});
  }
  assert.equal(w.hash(w.load(source)),initial);
  console.log('PIR_3B_K7_GATES '+JSON.stringify(rows));
});

test('PIR-3b real founding-hull competition: carrier first versus house first, without new stock',()=>{
  const snapshot=(w,s)=>({
    tick:s.tick,house:s.owners.house.cash,transport:s.owners.transport.cash,
    stock:Object.fromEntries(Object.keys(s.stations).sort().map(id=>[id,s.stations[id].lager.frachter||0])),
    consumed:s.ledger.frachter.consumed,produced:s.ledger.frachter.produced,
    fleet:Object.values(s.ships).filter(sh=>sh.klasse==='frachter').map(sh=>({id:sh.id,owner:sh.owner,system:sh.system})),
    contract:s.kanon.industrieErz.phase,material:s.stations.st_nadir.lager.material||0,
    materialProduced:s.ledger.material.produced,oreDelivered:s.w3.geliefert??null,hash:w.hash(s)
  });
  const start=()=>{
    const j=J8.erstellen(); j.startenPiraten(true,'kampf');
    return {j,w:j.weltReferenz()};
  };
  const clean=(w,s)=>{
    assert.deepEqual(w.audit(s).fehler,[]);
    assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply);
    assert.equal(s.minted+s.burned,0);
  };
  const a=start(), b=start();
  const initial=snapshot(a.w,a.j.zustandReferenz());
  assert.deepEqual(snapshot(b.w,b.j.zustandReferenz()),initial);
  assert(a.j.ausfuehren('buy-st_aldera-frachter').ok);
  const houseFirst=snapshot(a.w,a.j.zustandReferenz());
  const sa=a.j.zustandReferenz();
  a.w.advance(sa,1); clean(a.w,sa);
  const houseFirstMinute=snapshot(a.w,sa);
  const sb=b.j.zustandReferenz();
  b.w.advance(sb,1);clean(b.w,sb);
  const carrierFirstMinute=snapshot(b.w,sb);
  const offer=b.j.ausfuehren('buy-st_aldera-frachter');
  const houseAfterCarrier=snapshot(b.w,b.j.zustandReferenz());
  if(!offer.ok) assert.deepEqual(houseAfterCarrier,carrierFirstMinute);
  const c=b.j.zustandReferenz();
  const rows=[];
  for(const delta of [59,240,1140,8640]){
    b.w.advance(c,delta);clean(b.w,c);rows.push(snapshot(b.w,c));
  }
  assert.equal(c.tick,10080);
  assert.equal(b.w.hash(b.w.load(b.w.save(c))),b.w.hash(c));
  // Also try each existing ship market after the actual damaged F4.
  const o=original(), saved=o.w.save(o.s);
  const attempts=[];
  for(const station of ['st_aldera','st_nadir']){
    const copy=o.w.load(saved), before=snapshot(o.w,copy);
    const r=o.w.execute(copy,{type:'shipBuy',owner:'transport',klasse:'frachter',station});
    const after=snapshot(o.w,copy);
    if(!r.ok)assert.deepEqual(after,before);
    else{
      assert.equal(before.transport-after.transport,o.w.rules.economy.waren.frachter.basis);
      assert.equal(after.stock[station],before.stock[station]-1);
      assert.equal(after.consumed,before.consumed+1);
      assert.equal(after.fleet.filter(x=>x.owner==='transport').length,before.fleet.filter(x=>x.owner==='transport').length+1);
    }
    clean(o.w,copy);
    attempts.push({station,ok:r.ok,reason:r.reason??null,before,after});
  }
  assert.equal(o.w.save(o.s),saved);
  console.log('PIR_3B_FOUNDING_PAIR '+JSON.stringify({initial,houseFirst,houseFirstMinute,carrierFirstMinute,houseAfterCarrier,houseBuy:{ok:offer.ok,reason:offer.reason??null},rows,attempts}));
});

test('PIR-3b carrier-first followed by real player purchase and paid ferry',()=>{
  const j=J8.erstellen();j.startenPiraten(true,'kampf');
  const w=j.weltReferenz(),start=j.zustandReferenz();
  w.advance(start,300);
  assert.equal(start.stations.st_nadir.lager.frachter,1);
  assert.equal(start.w5.fertig,1);
  const original=w.save(start),control=w.load(original);
  const cash=start.owners.house.cash, ids=new Set(Object.keys(start.ships));
  assert(j.ausfuehren('buy-st_nadir-frachter').ok);
  let s=j.zustandReferenz();
  const sh=Object.values(s.ships).find(x=>!ids.has(x.id));
  assert(sh&&sh.owner==='house'&&sh.system==='nadir'&&s.w5.schiffIds.includes(sh.id));
  const f=sh.id;
  assert.equal(cash-s.owners.house.cash,750);
  assert.equal(s.stations.st_nadir.lager.frachter,0);
  assert.equal(s.w5.fertig,1);
  let ferry=null;
  for(let i=0;i<=24;i++){
    const q=j.angebote().find(x=>x.id==='reposition-'+f);
    if(q?.ok){
      const before=j.zustandReferenz().owners.house.cash;
      assert(j.ausfuehren('reposition-'+f).ok);
      s=j.zustandReferenz();
      ferry={tick:s.tick,cost:q.kosten,duration:q.minuten};
      assert.equal(before-s.owners.house.cash,q.kosten);
      w.advance(s,q.minuten);
      assert.equal(s.ships[f].system,'aldera');
      assert.equal(s.ships[f].flug.lage,'angedockt');
      break;
    }
    if(i<24)j.weiterspielen(60);
  }
  s=j.zustandReferenz();
  const afterFerry=s.tick,minerBuy=j.ausfuehren('buy-st_aldera-miner');
  let ice=null,freight=null;
  if(minerBuy.ok){
    const m=j.ansicht().schiffe.find(x=>x.klasse==='miner').id;
    ice=j.ausfuehren('ice-'+m);
    if(ice.ok){
      w.advance(j.zustandReferenz(),120);
      freight=j.ausfuehren('freight-'+f);
      if(freight.ok)w.advance(j.zustandReferenz(),120);
    }
  }
  s=j.zustandReferenz();
  const elapsed=7*1440;
  assert(s.tick<elapsed);
  w.advance(s,elapsed-s.tick); w.advance(control,elapsed-control.tick);
  const report=x=>{
    assert.equal(x.tick,elapsed);
    assert.deepEqual(w.audit(x).fehler,[]);
    assert.equal(Object.values(x.owners).reduce((n,o)=>n+o.cash,0),x.initialSupply);
    assert.equal(x.minted+x.burned,0);
    assert.equal(w.hash(w.load(w.save(x))),w.hash(x));
    return {tick:x.tick,house:x.owners.house.cash,transport:x.owners.transport.cash,ore:x.w3.geliefert,materialProduced:x.ledger.material.produced,materialNadir:x.stations.st_nadir.lager.material||0,frachterBuilt:x.w5.fertig,frachterStock:x.stations.st_nadir.lager.frachter||0,fleet:Object.values(x.ships).filter(y=>y.klasse==='frachter').map(y=>({id:y.id,owner:y.owner,system:y.system})),hulls:x.kanon.piraten.kampf.huellen,hash:w.hash(x)};
  };
  assert.equal(w.hash(w.load(original)),w.hash(start));
  console.log('PIR_3B_PLAYER_SECOND '+JSON.stringify({f,ferry,afterFerry,minerBuy,ice,freight,player:report(s),control:report(control)}));
});


test('PIR-3b financed patrol lifetime versus early and carrier-first F4 arrival',()=>{
  // Compare actual command schedules, not artificial pirates or injected cash.
  function run(carrierFirst,profil='kampf'){
    const j=J8.erstellen();j.startenPiraten(true,profil);
    const w=j.weltReferenz(), rows=[], phases={};
    let firstNoCapital=null,lastPaidTick=null,previousWage=0,f=null;
    const snapshot=()=>{
      const s=j.zustandReferenz(),p=s.kanon.piraten,sh=s.ships.pir001;
      const dienst=s.kanon.flugdienst.pir001;
      return {tick:s.tick,phase:p.phase,lage:sh.flug.lage,bis:p.bis,
        pirateCash:s.owners.piraten.cash,pilotCash:s.owners.pilot_piraten.cash,
        reserve:dienst?s.owners[dienst.konto].cash:0,
        contact:p.kontakt?.id??null,shots:p.kampf.ereignisse.length,
        target:f?{id:f,phase:s.ships[f].phase,system:s.ships[f].system,
          lage:s.ships[f].flug.lage,arrival:s.ships[f].ankunft,
          ice:s.ships[f].ladung.eis??0,hull:p.kampf.huellen[f]??96}:null};
    };
    function advance(n,observe=false){
      for(let i=0;i<n;i++){
        const s=j.zustandReferenz(),t=s.tick;
        w.advance(s,1);
        assert.equal(s.tick,t+1,'simulation advances exactly one minute');
        const r=snapshot();
        phases[r.phase]=(phases[r.phase]??0)+1;
        if(r.phase==='keinKapital'&&firstNoCapital===null)firstNoCapital=r.tick;
        if(r.pilotCash>previousWage)lastPaidTick=r.tick;
        previousWage=r.pilotCash;
        if(observe||r.tick%60===0)rows.push(r);
      }
    }
    if(carrierFirst)advance(300);
    const s0=j.zustandReferenz(),ids=new Set(Object.keys(s0.ships));
    const market=carrierFirst?'st_nadir':'st_aldera';
    assert(j.ausfuehren('buy-'+market+'-frachter').ok);
    f=Object.values(j.zustandReferenz().ships).find(sh=>!ids.has(sh.id)).id;
    if(carrierFirst){
      const q=j.angebote().find(x=>x.id==='reposition-'+f);
      assert(q?.ok);assert(j.ausfuehren('reposition-'+f).ok);
      advance(q.minuten);
    }
    assert(j.ausfuehren('buy-st_aldera-miner').ok);
    const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
    assert(j.ausfuehren('ice-'+m).ok);advance(120);
    const freightStart=j.zustandReferenz().tick;
    assert(j.ausfuehren('freight-'+f).ok);
    rows.push(snapshot());
    advance(120,true);
    const s=j.zustandReferenz(),end=snapshot();
    assert.equal(s.tick,freightStart+120);
    assert.equal(s.kanon.spielerFrachten.lohn,120);
    assert.equal(s.kanon.spielerFrachten.gebuehr,240);
    assert.equal(s.w5n.eisGeliefert,50);
    assert.equal(s.ships[f].owner,'house');
    assert.deepEqual(w.audit(s).fehler,[]);
    assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply);
    assert.equal(s.minted+s.burned,0);
    const hash=w.hash(s);assert.equal(w.hash(w.load(w.save(s))),hash);
    const window=rows.filter(r=>r.target?.ice>0&&r.target.system==='nadir'&&r.target.lage!=='transit');
    return {carrierFirst,freightStart,firstNoCapital,lastPaidTick,phases,
      arrivalWindow:window,end,hash};
  }
  const early=run(false),late=run(true);
  assert.deepEqual(run(false),early);
  assert.deepEqual(run(true),late);
  assert.equal(early.hash,'aa301a2025e848cb');
  assert.equal(early.end.target.hull,48);
  // Late hull outcome and patrol overlap are diagnostic. No forced attack.
  console.log('PIR_3B_PATROL_LIFETIME '+JSON.stringify({early,late}));
  const earlyTraffic=run(false,'verkehr'),lateTraffic=run(true,'verkehr');
  assert.deepEqual(run(false,'verkehr'),earlyTraffic);
  assert.deepEqual(run(true,'verkehr'),lateTraffic);
  for(const r of [earlyTraffic,lateTraffic]){
    assert.equal(r.firstNoCapital,null);
    assert(r.end.pilotCash>0 && r.end.pilotCash<40,'one funded short patrol');
    assert.equal(r.end.pirateCash+r.end.pilotCash+r.end.reserve,240);
    assert(r.arrivalWindow.some(x=>x.lage==='frei' && x.reserve>12),'actual financed overlap');
    assert.equal(r.end.reserve,0,'full unused reserve returned');
    assert.equal(r.end.lage,'angedockt');
    assert.equal(r.end.target.ice,0);
  }
  assert.equal(late.end.shots,0);
  // Actual shots and damage are independently reported; no artificial hit.
  console.log('PIR_3C_TRAFFIC '+JSON.stringify({earlyTraffic,lateTraffic}));
  const earlyLocal=run(false,'lokal'),lateLocal=run(true,'lokal');
  assert.deepEqual(run(false,'lokal'),earlyLocal);
  assert.deepEqual(run(true,'lokal'),lateLocal);
  for(const r of [earlyLocal,lateLocal]){
    assert.equal(r.firstNoCapital,null);
    assert.equal(r.end.pirateCash+r.end.pilotCash+r.end.reserve,240);
    assert(r.end.pilotCash>0 && r.end.pilotCash<40,'actual short paid sortie');
    assert.equal(r.end.reserve,0);
    assert.equal(r.end.lage,'angedockt');
    const launch=r.arrivalWindow.find(x=>x.phase==='auslaufen');
    assert(launch,'launch only on actual local arrival');
    assert.equal(launch.tick,r.freightStart+56);
    assert.equal(launch.target.lage,'frei');
    assert.equal(launch.target.ice,50);
    assert.equal(launch.shots,0);
    assert.equal(launch.pilotCash,0,'no earlier paid sortie');
    assert.equal(launch.reserve,40);
  }
  // A launch from an actual observation is required, not a guaranteed hit.
  console.log('PIR_3D_LOCAL '+JSON.stringify({earlyLocal,lateLocal}));
});

test('PIR-3c without authenticated F4: no patrol cost, profile cannot cross-load',()=>{
  const j=J8.erstellen();j.startenPiraten(true,'verkehr');
  const w=j.weltReferenz(),s=j.zustandReferenz(),initial=w.save(s);
  const classic=J8.erstellen();classic.startenPiraten(true,'kampf');
  const cw=classic.weltReferenz(),cs=classic.zustandReferenz(),other=cw.save(cs);
  assert.throws(()=>cw.load(initial));
  assert.throws(()=>w.load(other));
  const forged=JSON.parse(initial);forged.kanon.piraten.profil=4;
  assert.throws(()=>w.load(JSON.stringify(forged)));
  const forbidden=J8.erstellen();
  assert.throws(()=>forbidden.startenPiraten(false,'verkehr'));
  for(const day of [7,90]){
    w.advance(s,day*1440-s.tick);
    assert.equal(s.tick,day*1440);
    assert.equal(s.kanon.piraten.profil,5);
    assert.equal(s.ships.pir001.flug.lage,'angedockt');
    assert.equal(s.kanon.piraten.phase,'bereit');
    assert.equal(s.owners.piraten.cash,240);
    assert.equal(s.owners.pilot_piraten.cash,0);
    assert.equal(s.kanon.flugdienst.pir001,undefined);
    assert.deepEqual(s.kanon.piraten.kampf.ereignisse,[]);
    assert.deepEqual(w.audit(s).fehler,[]);
    assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply);
    assert.equal(s.minted+s.burned,0);
    const hash=w.hash(s);assert.equal(w.hash(w.load(w.save(s))),hash);
    console.log('PIR_3C_IDLE '+JSON.stringify({day,hash,pirateCash:s.owners.piraten.cash,pilotCash:s.owners.pilot_piraten.cash,worldMoney:s.initialSupply}));
  }
});



test('PIR-3d no local target: idle budget and cross-profile save rejection',()=>{
  const j=J8.erstellen();j.startenPiraten(true,'lokal');
  const w=j.weltReferenz(),s=j.zustandReferenz();
  const traffic=J8.erstellen();traffic.startenPiraten(true,'verkehr');
  assert.throws(()=>traffic.weltReferenz().load(w.save(s)));
  assert.throws(()=>w.load(traffic.weltReferenz().save(traffic.zustandReferenz())));
  w.advance(s,7*1440);
  assert.equal(s.tick,7*1440);
  assert.equal(s.kanon.piraten.profil,6);
  assert.equal(s.owners.piraten.cash,240);
  assert.equal(s.owners.pilot_piraten.cash,0);
  assert.equal(s.ships.pir001.flug.lage,'angedockt');
  assert.deepEqual(s.kanon.piraten.kampf.ereignisse,[]);
  assert.deepEqual(w.audit(s).fehler,[]);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),s.initialSupply);
  assert.equal(s.minted+s.burned,0);
  const hash=w.hash(s);assert.equal(w.hash(w.load(w.save(s))),hash);
  console.log('PIR_3D_IDLE '+JSON.stringify({tick:s.tick,hash,pirateCash:s.owners.piraten.cash}));
});
