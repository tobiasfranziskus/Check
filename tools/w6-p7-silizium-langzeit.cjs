// W6/P7 [ANALYSE] – Langzeitprobe der TATSÄCHLICH aktivierten P5-NPC-Silizium-
// und J4-Kette im unveränderten main-Regel204-Kern. Niemals automatisch releasen.
// Node22: node tools/w6-p7-silizium-langzeit.cjs [180|365|730] [output-directory]
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const W6 = require('./w6-szenarien.cjs');
const MINUTEN = 1440;
const ORIGINAL_90_HASH = '686355895f27fbb8';
const ORIGINAL_GELD = 33000;
const ORIGINAL_JAEGERPREIS = 900;
const S02 = W6.SZENARIEN.find(x => x.id === 'S02');
if (!S02) throw Error('Original-S02 fehlt');

// Keine weiteren Core-/Balancing-Funktionen: nur originale Befehle,
// kanonische Savedaten und eine von audit() unabhängige Ledger-Zählung.
function audit(w, s) {
  const errors = W6.pruefen(w, s);
  assert.deepEqual(errors, [], 'Original-Core + unabhängige Waren-/Geldprüfung');
  assert.equal(Object.values(s.owners).reduce((sum, o) => sum + o.cash, 0), ORIGINAL_GELD);
  assert.equal(s.minted, 0);
  assert.equal(s.burned, 0);
  for (const [id, ship] of Object.entries(s.ships)) {
    assert.equal(ship.id, id, 'stabile unveränderte Hull-ID');
    assert.ok(s.owners[ship.owner], 'bekannter bezahlter Eigentümer: ' + id);
  }
  for (const klasse of ['miner', 'frachter'])
    assert.equal(Object.values(s.ships).filter(sh => sh.klasse === klasse).length,
      s.ledger[klasse].consumed, klasse + ': Schiffshistorie = bezahlte Entnahme');
  assert.deepEqual(s.kanon.npc.abgelehnt, {}, 'keine verdeckte rechtswidrige Firmenorder');
  assert.equal(s.owners.house.cash, 2100, '900 ISK legal bezahlt, Rest frei sparbar');
  assert.equal(Object.values(s.ships).filter(x => x.owner === 'house' && x.klasse === 'jaeger').length,
    1, 'ein tatsächlich gekaufter Jäger; zweiter bleibt beim Hersteller');
  assert.equal(s.kanon.jaeger.kaeufe.filter(x => x.owner === 'house' && x.preis === ORIGINAL_JAEGERPREIS).length,
    1, 'exakt ein Kaufbeleg über 900 ISK');
  assert.ok(s.kanon.silizium.vorrat >= 0, 'keine negativen Rohstoffmengen');
  assert.ok(s.kanon.silizium.gefoerdert <= w.rules.j2b.feld.vorrat,
    'physische Förderung darf niemals den anfänglichen Feldvorrat überschreiten');
  const original = w.hash(s);
  const saved = w.save(s), reloaded = w.load(saved);
  assert.equal(w.hash(reloaded), original, 'vollständiger Hash nach Save/Load');
  assert.equal(w.canonical(reloaded), w.canonical(s), 'kanonischer Datei-Roundtrip');
  return saved;
}
function snapshot(w, s) {
  const b = W6.kennzahlen(w, s);
  const lag=s.stations.st_nadir.lager;
  const byOwner=Object.fromEntries(Object.entries(s.owners).map(([owner, account])=>[owner,account.cash]));
  const hulls=Object.values(s.ships);
  return {
    day:s.tick / MINUTEN,hash:w.hash(s),worldMoney:ORIGINAL_GELD,
    minted:s.minted,burned:s.burned,playerCash:s.owners.house.cash,
    fightersBuilt:s.kanon.jaeger.fertig,fightersSold:s.kanon.jaeger.verkauft,
    playerFighterPurchases:s.kanon.jaeger.kaeufe.filter(x=>x.owner==='house').length,
    fighterWarehouse:lag.jaeger || 0,
    siliconMined:s.kanon.silizium.gefoerdert,
    siliconSold:s.kanon.silizium.verkauft,
    siliconRemaining:s.kanon.silizium.vorrat,
    siliconWarehouse:lag.silizium || 0,
    partsCompleted:s.kanon.bauteile.abgeschlossen,
    partsWarehouse:lag.bauteil || 0,
    replacements:b.ersatz,iceMined:b.eis,waterSalesISK:b.wasserErloes,
    paidWagesISK:b.loehne,oreMined:b.erz,materialMade:b.material,
    hullsTotal:hulls.length,hullsWithWearLedger:hulls.filter(x=>s.kanon.verschleiss[x.id]!==undefined).length,
    accounts:byOwner,
    topPauses:Object.entries(s.kanon.npc.pausen).sort((a,b)=>b[1]-a[1]).slice(0,5),
    topBottlenecks:s.kanon.engpass
      ?Object.entries(s.kanon.engpass.zaehler).sort((a,b)=>b[1]-a[1]).slice(0,5):[]
  };
}
function run(days=730,output=null,opts={}) {
  if (![180,365,730].includes(days)) throw RangeError('P7 nur 180, 365 oder 730 Spieltage');
  const start=performance.now(),{welt:w,s}=W6.start(S02.politik);
  assert.equal(s.kanon.npcSilizium,undefined,'kein produktiv heimlicher Aktivierungszustand');
  assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
  assert.equal(s.owners.house.cash,3000);
  if (output) fs.mkdirSync(output,{recursive:true});
  let bought=false,firstPurchaseTick=null;
  // Exakt dieselbe Reihenfolge/Raster/Kaufsemantik wie der bereits in main
  // referenzierte 90-Tage-P6-Test, damit seine Hash-Referenz verbindlich bleibt.
  for(let tick=120;tick<=90*MINUTEN;tick+=120){
    w.advance(s,120);
    if(!bought && (s.stations.st_nadir.lager.jaeger||0)>0){
      const before=s.owners.st_nadir.cash;
      const result=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
      assert.equal(result.ok,true,'Original-Kauf muss erfolgreich sein: '+JSON.stringify(result));
      assert.equal(s.owners.st_nadir.cash,before+ORIGINAL_JAEGERPREIS);
      bought=true;firstPurchaseTick=s.tick;
    }
  }
  assert.equal(bought,true,'ohne fremde Firmenrechte oder Gratisware kein erster Jäger');
  const firstSave=audit(w,s);
  assert.equal(w.hash(s),ORIGINAL_90_HASH,
    'veröffentlichte 90-Tage-Referenz für gleiche Spielerbefehle nicht verändern');
  const checkpoints=[],saved90=firstSave;
  let previous=null;
  function checkpoint(saved=null) {
    const day=s.tick / MINUTEN;
    const stateSave=saved||audit(w,s);
    const item=snapshot(w,s);
    item.firstFighterPurchaseTick=firstPurchaseTick;
    item.saveBytes=Buffer.byteLength(stateSave);
    item.wallSeconds=(performance.now()-start)/1000;
    item.memoryRSS=process.memoryUsage().rss;
    item.delta=previous?{
      ice:item.iceMined-previous.iceMined,
      waterSalesISK:item.waterSalesISK-previous.waterSalesISK,
      paidWagesISK:item.paidWagesISK-previous.paidWagesISK,
      replacements:item.replacements-previous.replacements,
      newFighters:item.fightersBuilt-previous.fightersBuilt
    }:null;
    checkpoints.push(item);previous=item;
    if(output){
      fs.writeFileSync(path.join(output,'latest.save.json'),stateSave);
      if([90,180,365,730].includes(day))
        fs.writeFileSync(path.join(output,'day'+day+'.save.json'),stateSave);
      fs.writeFileSync(path.join(output,'progress.json'),JSON.stringify({
        requestedDays:days,completedDay:day,complete:false,checkpoints
      },null,2)+'\n');
    }
    console.log('W6_P7_CHECKPOINT '+JSON.stringify(item));
  }
  checkpoint(saved90);
  const wanted=new Set([180,365,730,days].filter(x=>x<=days));
  for(let day=120;day<days;day+=30)wanted.add(day);
  for(const day of [...wanted].sort((a,b)=>a-b)){
    if(day<=90)continue;
    const before=s.tick;
    w.advance(s,day*MINUTEN-s.tick);
    assert.equal(s.tick,day*MINUTEN,'vollständiger vorfinanzierter Zeitfortschritt');
    checkpoint();
    // Unabhängige 1-Tages-Dateifortsetzung und Gleichheit des DIREKTEN Pfads
    // mit einer am Tag180/365 gespeicherten legalen Welt (kein Save-Fixture).
    if([180,365].includes(day) && day<days){
      const original=w.save(s),clone=w.load(original);
      w.advance(clone,MINUTEN);
      const direct=w.load(original);
      for(let i=0;i<12;i++)w.advance(direct,120);
      assert.equal(w.canonical(clone),w.canonical(direct),
        'File-Resume identisch bei 1×1440 vs 12×120 Originalminuten');
      assert.deepEqual(W6.pruefen(w,clone),[]);
      console.log('W6_P7_DATEI_FORTSETZUNG '+JSON.stringify({fromDay:day,toDay:day+1,
        hash:w.hash(clone),canonicalEqual:true}));
    }
  }
  const end=checkpoints.at(-1),at90=checkpoints[0];
  assert.equal(at90.siliconMined,16,'90-Tage-Referenz hat begrenzten Vorrat genutzt');
  assert.equal(at90.siliconRemaining,0,'Feld bei Tag90 wirklich physisch leer');
  const last=checkpoints.find(x=>x.day===Math.max(90,days-30))||checkpoints.at(-2);
  const activeLast30=end.iceMined>last.iceMined&&
    end.waterSalesISK>last.waterSalesISK&&end.paidWagesISK>last.paidWagesISK;
  const finished={
    mode:'S02+P5',days,complete:true,elapsedSeconds:(performance.now()-start)/1000,
    initialMoney:ORIGINAL_GELD,firstFighterPurchaseTick,first90Hash:at90.hash,
    lastHash:end.hash,siliconEnd:end.siliconRemaining,fightersBuilt:end.fightersBuilt,
    fightersPurchasedByHouse:end.playerFighterPurchases,
    replacements:end.replacements,activeLast30,
    deltaLastCheckpoint:end.delta,checkpoints,
    limits:[
      'Das Siliziumfeld enthält nur 16 Einheiten; keine Nachschubautomatik freigegeben.',
      'S02-Positivwerte beweisen weder 13 krisenfeste Regime noch unbegrenzten Jägerbau.'
    ]
  };
  if(output)fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(finished,null,2)+'\n');
  console.log('W6_P7_RESULT '+JSON.stringify({
    mode:finished.mode,days,hash:finished.lastHash,elapsedSeconds:finished.elapsedSeconds,
    siliconEnd:finished.siliconEnd,fightersBuilt:finished.fightersBuilt,
    replacements:finished.replacements,activeLast30:finished.activeLast30,
    worldMoney:ORIGINAL_GELD,minted:0,burned:0
  }));
  return finished;
}
module.exports={audit,snapshot,run};
if(require.main===module){
 const days=Number(process.argv[2]||730),out=process.argv[3]||null;
 try{run(days,out);}catch(err){
  console.error('W6_P7_FAILED '+JSON.stringify({message:String(err.message||err),stack:String(err.stack||'')}));
  process.exitCode=1;
 }
}
