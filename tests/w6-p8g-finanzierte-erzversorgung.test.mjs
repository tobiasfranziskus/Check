// W6/P8g: originalfinanzierte 50-Erz-Materialversorgung ohne W5-Frachterneubau.
// Nur Rule207-Forschungswelt; kein neuer Geld-/Waren-/Schiffsgenesiszustand.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const total=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function check(w,s){
  const a=w.audit(s);
  assert.equal(a.ok,true,a.fehler?.join('; '));
  assert.deepEqual(W6.pruefen(w,s),[]);
  assert.equal(total(s),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function afterFreight(){
  const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42,{politik:policy});
  assert.equal(w.npcAutoSetzen(s,true).ok,true);
  assert.equal(w.npcSiliziumSetzen(s,true).ok,true);
  for(let i=0;i<25*1440;i+=120){
    w.advance(s,120);
    if(s.stations.st_nadir.lager.jaeger>0 && s.owners.house.cash>=900){
      assert.equal(w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'}).ok,true);
    }
    if(s.kanon.p8d.belege.length)break;
  }
  assert.equal(s.kanon.p8d.belege.length,1);
  assert.equal(s.stations.st_nadir.lager.material,10);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  assert.equal(s.stations.st_nadir.lager.erz,0);
  check(w,s);
  w.politikSetzen(s,{automatik:false});
  assert.deepEqual(w.materialSupplySetzen(s,true),{ok:true,aktiviert:true});
  check(w,s);
  return {w,s};
}

test('P8g – kein Materialvertrag ohne industriellen Bedarf und autorisierten Käufer',()=>{
  const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42,{politik:policy}),original=w.save(s);
  for(const cmd of [
    {type:'industrialOreOfferMaterial',owner:'house',miner:'sh001',frachter:'sh002'},
    {type:'industrialOreOfferMaterial',owner:'st_nadir',miner:'sh001',frachter:'sh002'},
    {type:'industrialOreCommitMaterial',owner:'st_nadir'},
  ]){
    const r=w.execute(s,cmd);
    assert.equal(r.ok,false,'keine Gratisabnahme ohne J3-Materialnachfrage: '+JSON.stringify(cmd));
    assert.equal(w.save(s),original);
  }
  check(w,s);
});

test('P8g – echte Nadir-Materialnachfrage beauftragt 50 Erz mit W3-Vorfinanzierung ohne W5-Werft',()=>{
  const {w,s}=afterFreight(),originalHash=w.hash(s),startDay=s.tick/1440;
  const stock=s.stations.st_nadir.lager.frachter,ids=new Set(Object.keys(s.ships));
  const paid=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(paid.ok,true,'Ersatz mit echtem Original-W5-Kauf: '+paid.reason);
  const newId=Object.keys(s.ships).find(id=>!ids.has(id));
  assert.ok(newId);
  const move=w.execute(s,{type:'shipReposition',owner:'transport',schiff:newId});
  assert.equal(move.ok,true,'realer W5ac-Lohntransfer: '+move.reason);
  w.advance(s,60);check(w,s);
  const freighter=s.ships[newId];
  assert.equal(freighter.system,'aldera');
  assert.equal(freighter.phase,'dock');
  assert.equal(s.stations.st_nadir.lager.frachter,stock-1);
  assert.equal(s.w5ac.completed.find(x=>x.id===newId)?.kosten,60);
  const miners=Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner'
    &&sh.system==='aldera'&&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
    &&Object.values(sh.ladung).every(x=>x===0)
    &&w.buchwert(s,sh.id)>0).sort((a,b)=>a.id.localeCompare(b.id));
  console.log('P8G_MINER_CAPACITY',JSON.stringify({day:s.tick/1440,
    viable:miners.map(x=>({id:x.id,value:w.buchwert(s,x.id),task:x.auftrag})),
    all:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'
      &&x.system==='aldera').map(x=>({id:x.id,value:w.buchwert(s,x.id),
        task:x.auftrag,system:x.system,phase:x.phase,flug:x.flug?.lage})),
    localMinerStock:s.stations.st_aldera.lager.miner,npc3Cash:s.owners.npc3.cash}));
  assert.ok(miners.length>0,'für realen P8g-Vertrag fehlt ein einsatzfähiger eigener NPC3-Miner');
  const miner=miners.find(x=>!s.erzpilotVertraege?.[x.id])||miners[0];
  if(s.kanon.pendel[miner.id]?.ware==='eis'){
    // Unterschrift und Disposition liegen beim tatsächlichen Eigentümer;
    // bestehender pendelnder Eisauftrag darf nicht still übernommen werden.
    const stop=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:miner.id});
    assert.equal(stop.ok,true,'Original-Eisauftrag ordentlich abbrechen: '+stop.reason);
    assert.equal(s.kanon.pendel[miner.id],undefined);
    check(w,s);
  }
  const belegeVor=s.w3.abgeschlossen,werftVor=s.w5.fertig;
  const offer={type:'industrialOreOfferMaterial',owner:'st_nadir',miner:miner.id,frachter:newId};
  for(const cmd of [
    offer,{type:'industrialOreAcceptMine',owner:'npc3'},
    {type:'industrialOreAcceptFreight',owner:'transport'},
  ]){
    const r=w.execute(s,cmd);
    assert.equal(r.ok,true,'Eigentümer-Gate: '+JSON.stringify(cmd)+' '+r.reason);
  }
  assert.equal(s.kanon.industrieErz.materialOnly,true);
  for(const cmd of [
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreCommit',owner:'st_nadir'},
  ]){
    const before=w.save(s),r=w.execute(s,cmd);
    assert.equal(r.ok,false);
    assert.equal(w.save(s),before);
  }
  const commit=w.execute(s,{type:'industrialOreCommitMaterial',owner:'st_nadir'});
  assert.equal(commit.ok,true,commit.reason);
  assert.equal(s.w3.auftrag.phase,'vorbestellt');
  assert.equal(s.owners.k7_werft_treuhand?.cash||0,0);
  check(w,s);
  // Negativ-/Manipulationsabwehr: kein signierter Werftauftrag, keine
  // umetikettierte Materialbestellung und keine gefälschte Erst-Freigabe.
  const unversehrt=w.save(s);
  for(const cmd of [
    {type:'industrialOreOfferMaterial',owner:'st_nadir',miner:miner.id,frachter:newId},
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreBuildShip',owner:'werft_extern'},
    {type:'industrialOreCommitMaterial',owner:'st_nadir'},
  ]){
    const rejected=w.execute(s,cmd);
    assert.equal(rejected.ok,false,'bereits gebundene Ware/unerlaubte Werft: '+JSON.stringify(cmd));
    assert.equal(w.save(s),unversehrt,'kein mutierter Zustand bei abgewiesenem Auftrag');
  }
  for(const change of [
    raw=>{raw.kanon.industrieErz.signWerft=true;},
    raw=>{raw.kanon.industrieErz.materialOnly=false;},
    raw=>{raw.kanon.materialSupplyEnabled=false;},
    raw=>{raw.w3.auftrag.menge=51;},
  ]){
    const raw=JSON.parse(unversehrt);change(raw);
    assert.equal(w.audit(raw).ok,false,'manipulierter Materialvertrag erkannt');
    assert.throws(()=>w.load(JSON.stringify(raw)),'gefälschten Vertrag nicht ladbar machen');
    assert.equal(w.save(s),unversehrt,'Originalsave wurde nicht überschrieben');
  }
  assert.throws(()=>w.materialSupplySetzen(s,false),
    'keine nachträgliche Freigaberücknahme eines finanziert laufenden Vertrags');
  assert.equal(w.save(s),unversehrt);
  let days=0;
  while(s.kanon.industrieErz.phase!=='geliefert'&&days<25*1440){
    w.advance(s,120);days+=120;
    if(days%(2*1440)===0)check(w,s);
  }
  console.log('P8G_DELIVERY_DIAGNOSTIC',JSON.stringify({days:days/1440,
    phase:s.kanon.industrieErz.phase,ore:s.stations.st_nadir.lager.erz,
    mined:s.ledger.erz.mined,w3Done:s.w3.abgeschlossen,
    w3:s.w3.auftrag,miner:s.ships[miner.id],freighter:s.ships[newId]}));
  assert.equal(s.kanon.industrieErz.phase,'geliefert');
  assert.equal(s.w3.abgeschlossen,belegeVor+1);
  assert.ok(s.stations.st_nadir.lager.erz>=50);
  assert.equal(s.w5.fertig,werftVor,'keine ungefragte Frachterproduktion');
  check(w,s);
  const refine=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  assert.equal(refine.ok,true,refine.reason);
  w.advance(s,w.rules.w4.dauer);
  check(w,s);
  assert.ok(s.stations.st_nadir.lager.material>=11);
  // Reale W4-Kette mit 50 angeliefertem Erz: vorhandenes Forschungsrezept
  // ist 10 Erz -> 5 Material je Charge (keine neue Balanceänderung).
  for(let i=1;i<5;i++){
    const r=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
    assert.equal(r.ok,true,'W4-Charge '+i+': '+r.reason);
    w.advance(s,w.rules.w4.dauer);
    check(w,s);
  }
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.stations.st_nadir.lager.material,35,
    '10 altes Material + 5×5 neues W4-Material ohne Gratisware');
  // Bereits 8 bezahlte Dravos-Siliziumeinheiten liegen rechtmäßig in Nadir.
  // Mit der realen Erz-Nachlieferung werden aus ihnen acht J3-Bauteile.
  const bauteileVor=s.kanon.bauteile.abgeschlossen,jaegerVor=s.kanon.jaeger.fertig;
  for(let i=0;i<8;i++){
    const r=w.execute(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
    assert.equal(r.ok,true,'J3-Bauteile aus realem Nachschub '+i+': '+r.reason);
    w.advance(s,w.rules.j3.dauer);
    check(w,s);
  }
  assert.equal(s.kanon.bauteile.abgeschlossen,bauteileVor+8);
  assert.equal(s.stations.st_nadir.lager.bauteil,8);
  assert.equal(s.stations.st_nadir.lager.silizium,0);
  const bauen=w.execute(s,{type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'});
  assert.equal(bauen.ok,true,'originalfinanzierter J4-Jäger: '+bauen.reason);
  w.advance(s,w.rules.j4.dauer);check(w,s);
  assert.equal(s.kanon.jaeger.fertig,jaegerVor+1);
  assert.equal(s.stations.st_nadir.lager.jaeger,1);
  const cashVor=s.owners.house.cash,werftCashVor=s.owners.st_nadir.cash;
  assert.ok(cashVor>=900,'Spieler kann eigenen Original-Jäger aus vorhandenem Konto zahlen');
  const purchase=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
  assert.equal(purchase.ok,true,'Original-900-ISK-Jägerkauf: '+purchase.reason);
  assert.equal(cashVor-s.owners.house.cash,900);
  assert.equal(s.owners.st_nadir.cash-werftCashVor,900);
  check(w,s);
  console.log('P8G_W6_THIRD_FIGHTER',JSON.stringify({newOre:50,materialsFromOre:25,
    newParts:8,newFighter:1,realHousePurchase:900,
    totalFighters:s.kanon.jaeger.fertig,oreRemaining:s.stations.st_nadir.lager.erz,
    materialRemaining:s.stations.st_nadir.lager.material,
    siliconRemaining:s.stations.st_nadir.lager.silizium,
    freightersBuilt:0,worldISK:total(s),mint:s.minted,burn:s.burned,
    finalHash:w.hash(s)}));
  console.log('P8G_FINANCED_DELIVERY',JSON.stringify({originalHash,startDay,day:s.tick/1440,
    oreAtNadir:s.stations.st_nadir.lager.erz,material:s.stations.st_nadir.lager.material,
    parts:s.stations.st_nadir.lager.bauteil,freighter:newId,miner:miner.id,
    cargoDelivered:50,freightersBuiltSinceContract:0,worldISK:total(s),
    mint:s.minted,burn:s.burned,hash:w.hash(s)}));
});

test('P8g – externes JSON kann sein Opt-in nicht selbst autorisieren, nur separate Importfreigabe',()=>{
  const options={carrierCash:2000,buyerCash:4000};
  const w1=K.erstellenP8d(options);
  const s=w1.createState(42,{politik:policy});
  const old=w1.save(s),raw=JSON.parse(old);
  assert.equal(raw.kanon.materialSupplyEnabled,undefined);
  raw.kanon.materialSupplyEnabled=true;
  assert.throws(()=>w1.load(JSON.stringify(raw)),/P8g: externer Import/);
  assert.equal(w1.hash(w1.load(old)),w1.hash(s),'alte unveraenderte Save-Runde ohne P8g weiterhin gültig');

  assert.deepEqual(w1.materialSupplySetzen(s,true),{ok:true,aktiviert:true});
  const authorized=w1.save(s);
  assert.equal(w1.hash(w1.load(authorized)),w1.hash(s),
    'selbe Welt darf selbst erzeugten Original-Save weiterhin laden');
  const w2=K.erstellenP8d(options);
  assert.throws(()=>w2.load(authorized),/P8g: externer Import/,
    'P8g-Datei aus anderer Sitzung verlangt echte Nutzerentscheidung');
  assert.throws(()=>w2.load(authorized,{p8gImportFreigegeben:false}),/P8g: externer Import/);
  assert.throws(()=>w2.load(authorized,{p8gImportFreigegeben:'true'}),TypeError);
  assert.throws(()=>w2.load(authorized,{p8gImportFreigegeben:true,anderes:'yes'}),TypeError);
  const imported=w2.load(authorized,{p8gImportFreigegeben:true});
  assert.equal(w2.hash(imported),w1.hash(s),
    'ausdrücklich genehmigter externer P8g-Import bleibt vollständig original');
  assert.equal(imported.kanon.materialSupplyEnabled,true);
  assert.equal(w2.hash(w2.load(w2.save(imported))),w2.hash(imported),
    'nach expliziter Importfreigabe bleibt lokales Save/Load möglich');
  check(w2,imported);
  console.log('P8G_EXTERNAL_IMPORT_GATE',JSON.stringify({legacyUnchanged:true,
    foreignWithoutConsentRejected:true,explicitConsentRestores:true,
    formatChanged:false,crossSessionHash:w2.hash(imported)}));
});
