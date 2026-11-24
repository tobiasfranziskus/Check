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
