'use strict';
// Offline reuse of the #579 original-command preflight, now on the #644
// S02/no-silicon path. No core changes, no fabricated route duration.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {lauf,VERGLEICH}=require('./m4-management-szenarien.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const [sz,pfad]=VERGLEICH.find(([x])=>x.id==='S02');
const reference=['85030b8df72a12ce','4e2e3657ef684657','7038f094f7aa754d'];
const horizon=240;
function preflight(w,s){
  const i=s.kanon.industrieErz;
  if(i?.phase!=='angebot'||i.carrier!=='house'||i.signFracht||s.w3.auftrag)return null;
  const rest=w.restAktivminuten(s,i.miner);
  // More rest than the bounded observation window cannot be exhausted
  // in that window. This is NOT a guarantee of successful delivery.
  if(rest===null||rest>horizon)return null;
  const original=w.save(s),q=w.load(original),id=i.miner;
  const accepted=w.execute(q,{type:'industrialOreAcceptFreight',owner:'house'});
  let status='UNGEKLAERT',minutes=0,commit=false;
  if(accepted.ok){
    for(let n=1;n<=horizon;n++){
      w.advance(q,1);minutes=n;
      const a=q.w3.auftrag,mi=q.ships[id];
      if(n===1&&a?.carrier==='house'){
        commit=true;
        // Mirror the existing manager's optional water consent.
        const r=w.execute(q,{type:'industrialWaterAcceptBackhaul',owner:'house',schiff:i.frachter});
        if(!r.ok)assert.ok(r.reason);
      }
      if(a?.industrieMiner===id&&['hin','rueck'].includes(a.phase)){
        status='ERZ_VERLADEN';break;
      }
      if(a?.industrieMiner===id&&a.phase==='vorbestellt'&&w.stillgelegt(q,id)
        &&mi.flug?.lage==='angedockt'&&(mi.ladung.erz||0)<a.menge){
        status='STILLGELEGT_VOR_CHARGE';break;
      }
      if(n===1&&!a){status='KEIN_COMMIT';break;}
    }
    assert.deepEqual(pruefen(w,q),[]);
  }else assert.equal(w.save(q),original);
  assert.equal(w.save(s),original,'preflight never changes live world');
  return {tick:s.tick,miner:id,frachter:i.frachter,rest,minutes,status,commit,
    ladung:q.ships[id].ladung.erz||0,probeHash:w.hash(q)};
}
function experiment(vorsorge){
  const probes=[],bindings=[],decisions={};
  let prev=null,active=null,block=null;
  function observe(w,s,phase){
    if(phase==='vorVerwaltung'){
      const p=preflight(w,s);
      if(p){
        const before=w.save(s);
        if(vorsorge&&p.status==='STILLGELEGT_VOR_CHARGE'){
          // Use the already implemented buyer cancellation on an unsigned
          // offer only. No cancellation of paid work or physical goods.
          const r=w.execute(s,{type:'industrialOreCancel',owner:'st_nadir'});
          assert.equal(r.ok,true,r.reason);
          assert.equal(s.w3.auftrag,null);
          assert.deepEqual(pruefen(w,s),[]);
          p.storno=true;
        }else{
          assert.equal(w.save(s),before);
          p.storno=false;
        }
        probes.push(p);
        decisions[p.status]=(decisions[p.status]||0)+1;
      }
    }
    const a=s.w3.auftrag;
    if(a?.phase==='vorbestellt'&&a.industrieMiner){
      const id=a.industrieMiner,mi=s.ships[id];
      if(!active||active.id!==id||active.erstellt!==s.kanon.industrieErz.erstellt){
        active={id,erstellt:s.kanon.industrieErz.erstellt,tick:s.tick,
          carrier:a.carrier??'transport',rest:w.restAktivminuten(s,id),
          vorher:prev?.rest[id]??null,vorTick:prev?.tick??null};
        bindings.push(active);
      }
      if(!block&&w.stillgelegt(s,id)){
        const json=w.save(s),q=w.load(json);
        const r=w.execute(q,{type:'industrialOreCancel',owner:'st_nadir'});
        if(!r.ok)assert.equal(w.save(q),json);
        else assert.deepEqual(pruefen(w,q),[]);
        assert.equal(w.save(s),json);
        block={...active,stillTick:s.tick,erz:mi.ladung.erz||0,
          treuhand:Object.fromEntries(['w3_kauf_treuhand','w3_arbeit_treuhand','k7_werft_treuhand'].map(k=>[k,s.owners[k].cash])),storno:r};
      }
    }else active=null;
    // Only update rest for the next observed minute; same-tick callbacks
    // may also contain a management command transition.
    if(!block){
      prev={tick:s.tick,rest:Object.fromEntries(Object.values(s.ships)
        .filter(x=>x.klasse==='miner'&&x.owner==='npc3'&&!w.stillgelegt(s,x.id))
        .map(x=>[x.id,w.restAktivminuten(s,x.id)]))};
    }
  }
  const report=lauf(sz,90,42,true,pfad,observe,false);
  return {report,bindings,block,probes,decisions};
}
const a=experiment(false),b=experiment(true);
assert.deepEqual(a.report.verlauf.map(v=>v.hash),reference,'#644 control');
assert.equal(a.report.verlauf.at(-1).gebunden,1390);
assert.ok(a.block,'reproduce the second contractual deadlock');
assert.deepEqual(experiment(false),a,'control replay');
assert.deepEqual(experiment(true),b,'counterfactual replay');
assert.deepEqual(lauf(sz,90,42,true,pfad,null,false),a.report,'observer does not change control');
for(const r of [a,b])for(const v of r.report.verlauf){
  assert.equal(v.weltgeld,33000);assert.equal(v.mint,0);assert.equal(v.burn,0);
}
function summary(r){return {bindings:r.bindings,block:r.block,decisions:r.decisions,
  cancellations:r.probes.filter(p=>p.storno).length,failedProbes:r.probes.filter(p=>p.status==='STILLGELEGT_VOR_CHARGE').slice(0,10),
  checkpoints:r.report.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,
    auftraege:v.auftraege,gebunden:v.gebunden,ersatz:v.ersatzkaeufe,still:v.stilllegungen.length,
    lager:v.lager,haus:v.kassen.house,aktiveAuftraege:v.aktiveAuftraege,
    live:v.huellen.filter(h=>!h.stillgelegt),entscheidungen:v.entscheidungen}))};}
fs.writeFileSync(process.argv[2]||'w6-s02-vertragsvorsorge.json',JSON.stringify({seed:42,a,b},null,2)+'\n');
console.log('W6_S02_VERTRAGSVORSORGE '+JSON.stringify({control:summary(a),candidate:summary(b),deterministic:true,controlUnchanged:true}));
