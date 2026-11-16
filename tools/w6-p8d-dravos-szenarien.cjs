// W6/P8d – unabhängiger, reproduzierbarer Krisen-/Langzeitnachweis Regel207.
// Nur Originalkassen/Original-S02-Käufer, keine Credits, Schiffe oder Bestände im Lauf.
// node tools/w6-p8d-dravos-szenarien.cjs [S01..S13|alle] [1..730]
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('./w6-szenarien.cjs');
const capital=Object.freeze({carrierCash:2000,buyerCash:4000});
const name=process.argv[2]||'alle',days=Number(process.argv[3]||90);
if((name!=='alle'&&!W6.SZENARIEN.some(x=>x.id===name))
  ||!Number.isSafeInteger(days)||days<1||days>730)
  throw Error('P8d: erwartet [S01..S13|alle] [1..730] Tage');
const cash=s=>Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
const stationsWare=(s,ware)=>Object.values(s.stations)
  .reduce((n,st)=>n+(st.lager[ware]||0),0);
const shipsWare=(s,ware)=>Object.values(s.ships)
  .reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
function check(w,s,id,tag){
  const fehler=W6.pruefen(w,s);
  assert.deepEqual(fehler,[],id+' Tag '+tag+': '+fehler.join('; '));
  assert.equal(s.rulesVersion,207);
  assert.equal(cash(s),33000,'keine versteckte Emission/Burn');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(s.owners.st_dravos.cash,0,'Dravos erhält kein künstliches Budget');
  assert.equal(s.stations.st_dravos.lager.silizium,undefined,'kein fingierter Dravos-Handel');
  const b=s.kanon.silizium,f=b.felder,p=s.kanon.p8d;
  assert.equal(f['nadir-primaer'].vorrat+f['dravos-silizium'].vorrat,b.vorrat);
  assert.equal(b.gefoerdert,s.ledger.silizium.mined);
  assert.equal(f['dravos-silizium'].verkauft,p.geliefert,'jede verkaufte Dravos-Ware trägt genau eine Frachtquittung');
  assert.equal(f['dravos-silizium'].gefoerdert,
    f['dravos-silizium'].verkauft+(b.auftrag?.feld==='dravos-silizium'?b.auftrag.gefoerdert:0));
  assert.equal(stationsWare(s,'silizium')+shipsWare(s,'silizium'),
    s.ledger.silizium.initial+s.ledger.silizium.mined
      +s.ledger.silizium.produced+s.ledger.silizium.imported
      -s.ledger.silizium.consumed-s.ledger.silizium.exported,
    'gesamte physische Silizium-Massenbilanz');
  assert.equal(p.geliefert,p.belege.length*w.rules.j2b.charge);
  assert.equal(p.gebuehrBezahlt,p.belege.reduce((n,x)=>n+x.gebuehr,0));
  assert.equal(p.lohnBezahlt,p.belege.reduce((n,x)=>n+x.lohnBezahlt,0)
    +(p.auftrag?.lohnBezahlt||0));
  assert.equal(s.owners.k1_p8d_fracht.cash,p.auftrag?.gebuehr||0);
  assert.equal(s.owners.k1_p8d_pilot.cash,
    p.lohnGebunden-p.lohnBezahlt);
  assert.ok(p.belege.every(x=>{
    const m=s.ships[x.miner],sh=s.ships[x.frachter];
    return m?.owner==='npc3'&&m?.klasse==='miner'
      &&sh?.owner==='transport'&&sh?.klasse==='frachter'
      &&x.inhaber==='npc3'&&x.spediteur==='transport'
      &&x.gebuehr===(x.hin+x.zurueck)*w.rules.w3.frachtgebuehrJeMinute
      &&x.lohnBezahlt===x.lohn
      &&s.kanon.silizium.belege.some(b=>b.feld==='dravos-silizium'
        &&b.schiff===x.miner&&b.owner==='npc3'
        &&b.menge===x.menge&&b.tick===x.ankunftTick);
  }),'alle Rechnungen belegen fremde Schiffseigentümer und originale Warenquelle');
  const save=w.save(s),rehydrated=w.load(save);
  assert.equal(w.hash(rehydrated),w.hash(s),id+' deterministischer JSON-Reload');
}
// P8e: NUR LESENDER Snapshot der Nachfragelocks aus dem originalen W6 NPC-Pfad.
function followupGate(w,s){
  const C=w.rules.j2b,C3=w.rules.j3,C4=w.rules.j4,k=s.kanon,
    lager=s.stations[C.station].lager,b=k.silizium;
  const felder=[C.feld,C.nebenfeld].filter(Boolean);
  const feld=felder.find(f=>b.felder?.[f.id]?.vorrat>=C.charge);
  const vorhanden=(lager.silizium||0)+(lager.bauteil||0)
    +(k.bauteile?.auftrag?C3.proCharge:0);
  const miner=Object.values(s.ships).find(sh=>
    sh.owner==='npc3'&&sh.klasse==='miner'&&sh.heimat==='nadir'
    &&['nadir','dravos'].includes(sh.system)&&!s.kanon.stillgelegt?.[sh.id]);
  const frachter=Object.values(s.ships).filter(sh=>
    sh.owner==='transport'&&sh.klasse==='frachter'&&sh.phase==='dock');
  const status={
    tick:s.tick,fieldChoice:feld?.id||null,fieldRemaining:feld?b.felder[feld.id].vorrat:0,
    fieldTotal:b.vorrat,activeSiliconOrder:b.auftrag?{
      owner:b.auftrag.owner,ship:b.auftrag.schiff,field:b.auftrag.feld,
      mined:b.auftrag.gefoerdert,requested:b.auftrag.menge
    }:null,
    miner:miner?{id:miner.id,system:miner.system,phase:miner.phase,
      flug:miner.flug?.lage,anker:miner.flug?.anker,
      cargo:miner.ladung.silizium||0}:null,
    carrierDocked:frachter.map(sh=>({id:sh.id,system:sh.system,
      cargo:sh.ladung.silizium||0})),
    warehouse:{silicon:lager.silizium||0,parts:lager.bauteil||0,
      materials:lager.material||0,ore:lager.erz||0,fighter:lager.jaeger||0},
    fighterOrder:!!k.jaeger?.auftrag,partsOrder:!!k.bauteile?.auftrag,
    existingSupply:vorhanden,fighterPartsDemand:C4.bauteile,
    minerCash:s.owners.npc3.cash,buyerCash:s.owners[C.station].cash,
    carrierCash:s.owners.transport.cash,
    miningLaborNeeded:C.charge*C.minutenJeEinheit*C.lohnJeMinute,
    buyingCashNeeded:C.charge*C.preis,
    noFighterInStock:!(lager.jaeger>0),noFighterOrder:!k.jaeger?.auftrag,
    needsAdditionalSupply:vorhanden<C4.bauteile,
    sourceAvailable:b.vorrat>=C.charge,
    minerHasFunding:s.owners.npc3.cash>=C.charge*C.minutenJeEinheit*C.lohnJeMinute,
    buyerHasFunding:s.owners[C.station].cash>=C.charge*C.preis
  };
  return status;
}
function run(scenario){
  const w=K.erstellenP8d(capital);
  const s=w.createState(42,{politik:scenario.politik});
  assert.deepEqual(w.npcAutoSetzen(s,true),{ok:true,aktiviert:true});
  assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
  let buys=0,early=days===30?W6.kennzahlen(w,s):null,late=null,peakFracht=0,lastReceipt=0,firstFreight=null;
  check(w,s,scenario.id,0);
  // 120-Minuten-Blöcke benutzen denselben 60-Teilschritt-Kern; dazwischen
  // laufen ALLE 20-/40-Minuten-Original-Reisen mit minutengenauer Entlohnung.
  for(let t=120;t<=days*1440;t+=120){
    w.advance(s,120);
    if(s.stations.st_nadir.lager.jaeger>0 &&s.owners.house.cash>=900&&buys<3){
      const h=s.owners.house.cash,n=s.owners.st_nadir.cash;
      const a=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
      assert.equal(a.ok,true,scenario.id+': '+JSON.stringify(a));
      assert.equal(h-s.owners.house.cash,900);
      assert.equal(s.owners.st_nadir.cash-n,900);
      buys++;
    }
    const p=s.kanon.p8d;
    if(p.belege.length!==lastReceipt){
      check(w,s,scenario.id,t/1440);
      if(!firstFreight)firstFreight={day:t/1440,gate:followupGate(w,s)};
      lastReceipt=p.belege.length;
    }
    peakFracht=Math.max(peakFracht,p.auftrag?1:0);
    if(days>=30&&t===(days-30)*1440)early=W6.kennzahlen(w,s);
    if(t===days*1440)late=W6.kennzahlen(w,s);
    if(t%(15*1440)===0 || t===days*1440)check(w,s,scenario.id,t/1440);
  }
  const p=s.kanon.p8d,field=s.kanon.silizium.felder,k=W6.kennzahlen(w,s);
  const carriers=Object.values(s.ships).filter(x=>x.owner==='transport'&&x.klasse==='frachter');
  const miners=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.heimat==='nadir');
  // Das 30-Tage-Fenster bezieht sich auf das tatsächliche Laufende:
  // 90 Tage => 60–90, 365 Tage => 335–365 (nicht immer 60–90).
  const last30Window=early&&late?{
    startDay:days-30,endDay:days,
    start:{ice:early.eis,waterISK:early.wasserErloes,replacements:early.ersatz},
    end:{ice:late.eis,waterISK:late.wasserErloes,replacements:late.ersatz}
  }:null;
  const result={
    id:scenario.id,days,hash:w.hash(s),contracts:p.belege.length,
    offers:p.angebote,active:p.auftrag?.phase||null,
    siliconDravosMined:field['dravos-silizium'].gefoerdert,
    siliconDravosSold:field['dravos-silizium'].verkauft,
    siliconDravosRemaining:field['dravos-silizium'].vorrat,
    siliconNadirMined:field['nadir-primaer'].gefoerdert,
    feeISK:p.gebuehrBezahlt,pilotISK:p.lohnBezahlt,
    feeEscrow:s.owners.k1_p8d_fracht.cash,
    pilotEscrow:s.owners.k1_p8d_pilot.cash,
    minerTravelISK:s.kanon.p8c.bezahlt,
    boughtFighters:buys,builtFighters:s.kanon.jaeger.fertig,
    npc3Cash:s.owners.npc3.cash,carrierCash:s.owners.transport.cash,
    nadirCash:s.owners.st_nadir.cash,houseCash:s.owners.house.cash,
    carrierCapacity:{aldera:carriers.filter(x=>x.system==='aldera'&&x.phase==='dock').length,
      nadir:carriers.filter(x=>x.system==='nadir'&&x.phase==='dock').length,
      dravos:carriers.filter(x=>x.system==='dravos'&&x.phase==='dock').length,
      enRoute:carriers.filter(x=>x.phase==='reise').length},
    minerPositions:miners.map(x=>({id:x.id,system:x.system,
      silicon:x.ladung.silizium||0})),
    ice:k.eis,waterISK:k.wasserErloes,replacements:k.ersatz,
    last30Window,
    last30Active:last30Window?{
      ice:last30Window.end.ice>last30Window.start.ice,
      water:last30Window.end.waterISK>last30Window.start.waterISK,
      replacement:last30Window.end.replacements>last30Window.start.replacements
    }:null,
    topPauses:Object.entries(s.kanon.npc?.pausen||{}).sort((a,b)=>b[1]-a[1]).slice(0,4),
    worldISK:cash(s),mint:s.minted,burn:s.burned,
    peakParallelFreights:peakFracht,
    firstFreight,
    followupAtEnd:followupGate(w,s)
  };
  assert.ok(peakFracht<=1,'bestehende Forschungsregel207 kann nur eine gebundene Charge haben');
  console.log('W6_P8D_DRAVOS_REGIME',JSON.stringify(result));
  return result;
}
const results=[];
for(const sz of W6.SZENARIEN.filter(x=>name==='alle'||x.id===name)){
  try{results.push(run(sz));}
  catch(e){console.error('W6_P8D_FAILED',sz.id,e?.stack||String(e));process.exitCode=1;break;}
}
if(process.env.P8D_OUTPUT_JSON){
  fs.writeFileSync(process.env.P8D_OUTPUT_JSON,
    JSON.stringify({rule:207,seed:42,days,results},null,2));
}
if(results.length===13)console.log('W6_P8D_13_REGIMES_DONE',JSON.stringify({
  days,scenarios:results.length,withPaidFreight:results.filter(x=>x.contracts>0).map(x=>x.id),
  withoutFreight:results.filter(x=>x.contracts===0).map(x=>x.id),
  liquidityLosses:results.filter(x=>x.npc3Cash===0||x.carrierCash===0).map(x=>x.id),
  mint:results.reduce((n,x)=>n+x.mint,0),burn:results.reduce((n,x)=>n+x.burn,0)
}));
