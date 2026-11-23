/* M4-U9: test-only preflight using original funded commands on disposable saves.
 * Never runs in the browser; no new economy, migration or automatic house consent.
 */
'use strict';
const assert=require('node:assert/strict');
const {lauf}=require('./m4-management-szenarien.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');

function restAktivMinuten(welt,s,id){
  const sh=s.ships[id];
  if(!sh || !s.kanon.politik.stilllegung) return null;
  const rate=welt.daten.verschleiss.milliJeMinute[sh.klasse];
  if(!Number.isSafeInteger(rate)||rate<=0) return null;
  const preis=welt.rules.economy.waren[sh.klasse].basis;
  return Math.max(0,Math.ceil(preis*1000/rate)-(s.kanon.verschleiss[id]||0));
}

function vorpruefung(welt,s){
  const i=s.kanon.industrieErz;
  if(i?.phase!=='angebot'||i.carrier!=='house'||i.signFracht||s.w3.auftrag)
    return {status:'KEIN_OFFENES_HAUSANGEBOT'};
  const rest=restAktivMinuten(welt,s,i.miner);
  const minimum=Math.ceil(welt.rules.w3.fracht/welt.rules.economy.miningRate);
  if(rest===null)return {status:'KEINE_STILLLEGUNG'};
  const json=welt.save(s);
  const q=welt.load(json);
  const r=welt.execute(q,{type:'industrialOreAcceptFreight',owner:'house'});
  let status='UNGEKLAERT',minuten=0;
  if(r.ok){
    for(;minuten<240;minuten++){
      welt.advance(q,1);
      const a=q.w3.auftrag,mi=q.ships[i.miner];
      if(a?.industrieMiner===i.miner&&['hin','rueck'].includes(a.phase)){
        status='ERZ_PHYSISCH_VERLADEN';break;
      }
      if(a?.industrieMiner===i.miner&&a.phase==='vorbestellt'&&
          welt.stillgelegt(q,i.miner)&&mi.flug?.lage==='angedockt'&&
          (mi.ladung.erz||0)<a.menge){
        status='STILLLEGUNG_VOR_VOLLER_CHARGE';break;
      }
    }
    assert.deepEqual(pruefen(welt,q),[]);
  }
  assert.equal(welt.save(s),json);
  return {status,miner:i.miner,rest,minimum,minuten,probeHash:welt.hash(q)};
}

function experiment(szenario,tage,seed,aktiv,startpfad='konzerne'){
  const protokoll=[];
  const report=lauf(szenario,tage,seed,true,startpfad,{vorEntscheidung(welt,s){
    const p=vorpruefung(welt,s);
    if(!p.miner)return;
    const vorher=welt.save(s);
    // Only a proven failure may change the test strategy. The existing buyer
    // cancels an unsigned offer, never a paid agreement or a real cargo.
    let storno=false;
    if(aktiv&&p.status==='STILLLEGUNG_VOR_VOLLER_CHARGE'){
      const r=welt.execute(s,{type:'industrialOreCancel',owner:'st_nadir'});
      assert.equal(r.ok,true,r.reason);
      assert.equal(s.w3.auftrag,null);
      assert.deepEqual(pruefen(welt,s),[]);
      storno=true;
    }else assert.equal(welt.save(s),vorher);
    protokoll.push({tick:s.tick,...p,storno});
  }});
  return {report,protokoll};
}
module.exports={restAktivMinuten,vorpruefung,experiment};
if(require.main===module){
  const [id='S02',tage='30',seed='42',startpfad='konzerne']=process.argv.slice(2);
  const s=SZENARIEN.find(x=>x.id===id);
  assert.ok(s&&Number.isSafeInteger(+tage)&&+tage>0&&Number.isSafeInteger(+seed));
  const base=experiment(s,+tage,+seed,false,startpfad);
  const variant=experiment(s,+tage,+seed,true,startpfad);
  console.log(JSON.stringify({base,variant}));
}
