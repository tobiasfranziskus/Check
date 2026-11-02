// B-K10p [ANALYSE] Werft-Ersatzkette und reale NPC-Handelsrouten.
// Keine Produktions-/Preis-/Fonds-/Routenänderung am Originalkern.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function once(old,neu){
  assert.equal(src.split(old).length,2,'Original-Core Buchungsstelle eindeutig: '+old.slice(0,55));
  src=src.replace(old,neu);
}
once("  buche(state, schiff.owner, 'kosten', fee);",
  "  buche(state, schiff.owner, 'kosten', fee);"+
  "  __bk10p_trade(state,schiff,station,ware,menge,kauf,wert);");
once("      linie.rest = r.dauer;",
  "      __bk10p_production(state,id,linie.rezept,'start');"+
  "      linie.rest = r.dauer;");
once("          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);",
  "          __bk10p_production(state,id,linie.rezept,'finish');"+
  "          if (r.aus.nahrung) m_core_herkunft.erzeugen(state, rules, id, r.aus.nahrung);");
once("    if (paar) abflug(state, rules, s, station, paar.ziel, paar.ware, paar.menge);",
  "    if (paar) __bk10p_choice(state,rules,s,station,paar);"+
  "    if (paar) abflug(state, rules, s, station, paar.ziel, paar.ware, paar.menge);");
const lineTypes=['r_material','r_bauteil','r_frachter','r_miner'],ships=['npc1','npc2','npc3'];
const sum=x=>x.reduce((a,b)=>a+b,0);
const report=(day)=>({day,yard:null,sources:null,merchants:null,deliveryCount:{npc1:0,npc2:0},
  siliconDelivered:0,completed:{},pending:0,shipsInYard:0});
let active=null,core;
function trade(state,ship,station,ware,menge,kauf,wert){
  if(!active)return;
  if(ship.klasse==='frachter'&&['npc1','npc2'].includes(ship.owner)){
    const b=active.sales[ship.owner];
    if(!kauf){
      b.sales++;b.volume+=menge;
      b.byDestination[station]=(b.byDestination[station]||0)+menge;
      if(ware==='nahrung')b.food+=menge;
      if(ware==='silizium'&&station==='st_aldera'){
        b.siliconAtYard+=menge;b.siliconPaid+=wert;
        active.siliconLastDeliveryTick=state.tick;
      }
    }
  }
}
function production(state,id,recipe,phase){
  if(!active||id!=='st_aldera'||!lineTypes.includes(recipe))return;
  const bucket=active.production[recipe];bucket[phase]++;
  if(phase==='finish')bucket.lastFinishTick=state.tick;
}
function choice(state,rules,ship,station,pair){
  if(!active||!['npc1','npc2'].includes(ship.owner))return;
  const b=active.choice[ship.owner];
  b.choices++;
  const cash=state.owners[ship.owner].cash;
  const flight=Math.ceil(pair.zeit*rules.world.betriebskosten.frachter/rules.economy.stunde);
  const price=core.preis(state,station,pair.ware,rules);
  const remaining=cash-flight;
  const affordable=remaining>0?Math.floor(remaining*1000/
    (price*(1000+rules.world.stations[station].gebuehr))):0;
  if(affordable===0){
    b.rejectMin++;
    if(!b.firstBlocked)b.firstBlocked={tick:state.tick,ship:ship.id,station,
      target:pair.ziel,ware:pair.ware,cash,flight,price,quotedUnits:pair.menge};
    b.lastBlocked={tick:state.tick,ship:ship.id,station,target:pair.ziel,
      ware:pair.ware,cash,flight,price,quotedUnits:pair.menge};
  }else b.genuinelyFundable++;
}
const modules=new Function('__bk10p_trade','__bk10p_production','__bk10p_choice',
  src+';return {core:m_core_index,base:m_data_rules.RULES,route:m_core_route.route};')(
    trade,production,choice);
core=modules.core;
const base=modules.base,route=modules.route;
// [ANALYSE] Nur eine Gegenhypothese in einer zweiten Test-Core-Kopie:
// Warenbudget erst NACH echter Flugreservierung fuer die gewaehlte Route
// aus dem bestehenden Eigentuemergeld pruefen, keine Kasse manipulieren.
const finanzanker='bezahlbar(rules, station, kasse, pHier)';
assert.equal(src.split(finanzanker).length,2);
const alternativeSource=src.replace(finanzanker,
  'bezahlbar(rules, station, kasse - Math.ceil(r.zeit * w.betriebskosten.frachter / rules.economy.stunde), pHier)');
const altModules=new Function('__bk10p_trade','__bk10p_production','__bk10p_choice',
  alternativeSource+';return {core:m_core_index,base:m_data_rules.RULES,route:m_core_route.route};')(
    trade,production,choice);
assert.equal(altModules.base.rulesVersion,base.rulesVersion);
function alternative(seed,days){
  core=altModules.core;
  try{return run(seed,days);}finally{core=modules.core;}
}
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true}};
function audit(state){
  const money=sum(Object.values(state.owners).map(o=>o.cash));
  const escrow=sum(Object.values(state.vertraege.eintraege).map(x=>x.rest));
  assert.equal(money+escrow,state.initialSupply+state.minted-state.burned);
  for(const [ware,l] of Object.entries(state.ledger)){
    const physical=sum(Object.values(state.stations).map(x=>x.lager[ware]||0))+
      sum(Object.values(state.ships).map(x=>x.ladung[ware]||0));
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Original-Warenfluss '+ware);
  }
  assert(core.audit(state).ok);
}
function snapshot(state,day,ev){
  const yard=state.stations.st_aldera,needed=['erz','material','silizium','bauteil','frachter','miner'];
  const sources=Object.fromEntries(['st_nadir','st_dravos'].map(id=>[id,{
    silicon:state.stations[id].lager.silizium,
    siliconCap:core.obergrenze(state,rules,id,'silizium'),
    siliconSellable:core.verkaufbar(state,rules,id,'silizium'),
    siliconPrice:core.preis(state,id,'silizium',rules),
    stationCash:state.owners[id].cash
  }]));
  const merchants=Object.fromEntries(['npc1','npc2'].map(o=>{
    const fleet=Object.values(state.ships).filter(s=>s.owner===o&&s.klasse==='frachter');
    return [o,{wallet:state.owners[o].cash,shipCount:fleet.length,
      sellDeals:ev.sales[o].sales,goodsSold:ev.sales[o].volume,
      foodSold:ev.sales[o].food,siliconToYard:ev.sales[o].siliconAtYard,
      rejectedQuotedPairs:ev.choice[o].rejectMin,
      attemptedQuotes:ev.choice[o].choices,
      fleet:fleet.map(x=>{
        const routes=Object.keys(rules.world.systems).filter(id=>id!==x.system).map(id=>
          route(rules.world,x.system,id)).filter(Boolean).map(x=>x.zeit);
        const minMin=Math.min(...routes);
        return {id:x.id,system:x.system,phase:x.phase,order:x.auftrag,
          cash:state.owners[o].cash,loaded:Object.values(x.ladung).reduce((a,b)=>a+b,0),
          minEmptyFlightISK:Math.ceil(minMin*rules.world.betriebskosten.frachter/
            rules.economy.stunde),wait:x.warten};
      })}];
  }));
  const depot=Object.fromEntries(needed.map(k=>[k,yard.lager[k]||0]));
  const possible=Object.fromEntries(lineTypes.map(k=>{
    const line=yard.linien.find(x=>x.rezept===k),r=rules.economy.rezepte[k];
    const missing=Object.fromEntries(Object.entries(r.ein).filter(([ware,n])=>
      (yard.lager[ware]||0)<n).map(([ware,n])=>[ware,n-(yard.lager[ware]||0)]));
    return [k,{inProgress:line.rest>0,missing,
      blockedByOutput:Object.entries(r.aus).some(([ware,n])=>
        (yard.lager[ware]||0)+n>core.obergrenze(state,rules,'st_aldera',ware)),
      cash:state.owners.st_aldera.cash,requiredWage:r.dauer*4,
      starts:ev.production[k].start,finished:ev.production[k].finish,
      lastFinishedTick:ev.production[k].lastFinishTick}];
  }));
  return {day,warehouse:depot,yardCash:state.owners.st_aldera.cash,
    sources,merchants,prod:possible,
    yardCanBuySilicon:core.aufnehmbar(state,rules,'st_aldera','silizium'),
    yardSiliconPrice:core.preis(state,'st_aldera','silizium',rules),
    siliconInMiners:Object.values(state.ships).filter(x=>
      x.klasse==='miner'&&x.ware==='silizium'&&x.ladung.silizium)
      .map(x=>({owner:x.owner,at:x.system,qty:x.ladung.silizium})),
    minedSilicon:state.ledger.silizium.mined,
    siliconLastDeliveryTick:ev.siliconLastDeliveryTick,
    fleetCount:Object.fromEntries(ships.map(o=>[o,Object.values(state.ships).filter(x=>x.owner===o).length])),
    hash:core.hash(state)};
}
function run(seed,days=14){
  const state=core.createState(seed,rules);active={
    production:Object.fromEntries(lineTypes.map(x=>[x,{start:0,finish:0,lastFinishTick:null}])),
    sales:{npc1:{sales:0,volume:0,food:0,siliconAtYard:0,siliconPaid:0,byDestination:{}},
      npc2:{sales:0,volume:0,food:0,siliconAtYard:0,siliconPaid:0,byDestination:{}}},
    choice:{npc1:{choices:0,rejectMin:0,genuinelyFundable:0,firstBlocked:null,lastBlocked:null},
      npc2:{choices:0,rejectMin:0,genuinelyFundable:0,firstBlocked:null,lastBlocked:null}},
    siliconLastDeliveryTick:null
  };
  const ev=active,daysOut=[];audit(state);
  for(let i=0;i<days*1440;i++){
    core.step(state,rules);
    if(state.tick%1440===0){
      audit(state);
      const loaded=core.load(core.save(state),undefined,rules);
      assert.equal(core.hash(loaded),core.hash(state),'Original-Hash und Save/Load je Tag');
      daysOut.push(snapshot(state,state.tick/1440,ev));
    }
  }
  const result={seed,days,records:daysOut,
    final:daysOut[daysOut.length-1],
    totals:{production:ev.production,sold:ev.sales,selection:ev.choice,
      lastSiliconArrival:ev.siliconLastDeliveryTick},
    globalMoney:state.initialSupply+state.minted-state.burned};
  active=null;return result;
}
test('B-K10p: Seed42 Original-Werftketten-Stopp und ausbleibende Haendler-Nachfolge 14d',()=>{
  const x=run(42);
  const a=x.records[2],b=x.records[8],c=x.final;
  assert(a.warehouse.silizium>0,'Werft wird zu Anfang tatsaechlich mit Silizium versorgt');
  assert.equal(b.warehouse.silizium,0);
  assert.equal(c.warehouse.silizium,0);
  assert.equal(c.warehouse.bauteil,0);
  assert.equal(c.warehouse.frachter,0);
  assert.equal(c.merchants.npc2.shipCount,0);
  assert(c.merchants.npc2.wallet>0,'nicht nur NPC-Bankrott, auch reale Werftluecke');
  assert(c.sources.st_nadir.silicon>=65&&c.sources.st_dravos.silicon>=65,
    'Silizium physisch vorhanden, aber nicht bei der Werft');
  assert(c.sources.st_nadir.siliconSellable>0&&c.sources.st_dravos.siliconSellable>0,
    'die Quellstationen haben tatsaechlich ueber Reserve kaufbares Silizium');
  assert(c.yardCanBuySilicon>0,'die Werft hat wirklich freie Lagerkapazitaet und Ankauf-ISK');
  assert(c.merchants.npc1.rejectedQuotedPairs>1000,
    'Original-Routenwahl versucht wiederholt nicht voll finanzierte Transportgeschaefte');
  assert(c.merchants.npc1.rejectedQuotedPairs<=c.merchants.npc1.attemptedQuotes);
  assert(c.siliconInMiners.some(x=>x.qty===100),'gefoerdertes Silizium steckt im Miner');
  assert.equal(c.prod.r_bauteil.finished,b.prod.r_bauteil.finished,
    'an Tag9 bereits stehende Bauteilherstellung bleibt bis Tag14 aus');
  assert.equal(c.prod.r_frachter.finished,b.prod.r_frachter.finished);
  assert.equal(c.merchants.npc1.sellDeals,x.records[3].merchants.npc1.sellDeals,
    'verbliebener NPC1-Frachter uebernimmt nach Tag4 keine einzige Lieferung');
  assert(c.merchants.npc1.shipCount>0,'NPC1-Frachter existiert, transportiert aber nicht');
  console.log('B-K10p Werftstopp Seed42',JSON.stringify({
    start:x.records[0],day3:a,day6:x.records[5],day9:b,day14:c,totals:x.totals}));
});
test('B-K10p: Seed7 Original-Haendler stehen trotz vorhandenen Schiffen und Silizium',()=>{
  const x=run(7);
  const c=x.final;
  assert.equal(c.warehouse.silizium,0);
  assert.equal(c.warehouse.bauteil,0);
  assert(c.merchants.npc1.shipCount>=1&&c.merchants.npc2.shipCount>=1,
    'mehrere noch existierende, aber nicht arbeitende Frachter');
  for(const o of ['npc1','npc2']){
    assert(c.merchants[o].fleet.every(x=>x.cash<x.minEmptyFlightISK),
      'jeder noch vorhandene Haendler kann nicht einmal den kuerzesten Leerflug bezahlen');
    assert.equal(c.merchants[o].sellDeals,x.records[5].merchants[o].sellDeals,
      'keine echten NPC-Lieferungen nach Spieltag 6');
  }
  assert(c.sources.st_nadir.siliconSellable>0&&c.sources.st_dravos.siliconSellable>0);
  assert(c.yardCanBuySilicon>0,'Werft kann echtes Silizium bezahlen und aufnehmen');
  assert(c.merchants.npc1.rejectedQuotedPairs>10000);
  assert(c.merchants.npc2.rejectedQuotedPairs>10000);
  assert(c.siliconInMiners.some(x=>x.qty===100));
  console.log('B-K10p Handelsstillstand Seed7',JSON.stringify({
    day3:x.records[2],day6:x.records[5],day14:c,totals:x.totals}));
});
test('B-K10p: Determinismus/Original-Kern plus fruehe Original-Werftproduktion',()=>{
  const a=run(42,3),b=run(42,3);
  assert.deepEqual(a,b);
  assert(a.final.prod.r_bauteil.finished>0);
  assert(a.final.prod.r_frachter.finished>0);
  assert(a.totals.sold.npc1.siliconAtYard+
    a.totals.sold.npc2.siliconAtYard>0,'tatsaechlicher Silizium-NPC-Handel vor dem Stillstand');
});


test('B-K10p: allein testseitige Vorflug-Kaufkraftpruefung behebt ungedeckte Routenzusagen',()=>{
  const seedResults=[];
  for(const seed of [42,7]){
    const normal=run(seed,7),gated=alternative(seed,7);
    assert.equal(normal.globalMoney,gated.globalMoney,
      'keine testseitige Emission oder Geldvernichtung');
    assert.equal(gated.totals.selection.npc1.rejectMin,0,
      'mit Vorflug-Kassenabzug waehlt NPC1 nie eine unfinanzierbare Warenfahrt');
    assert.equal(gated.totals.selection.npc2.rejectMin,0,
      'mit Vorflug-Kassenabzug waehlt NPC2 nie eine unfinanzierbare Warenfahrt');
    seedResults.push({seed,original:{
      yard:normal.final.warehouse,owner1:normal.final.merchants.npc1,
      owner2:normal.final.merchants.npc2,
      choices:normal.totals.selection,
      silica:normal.final.sources
    },preflight:{yard:gated.final.warehouse,
      owner1:gated.final.merchants.npc1,owner2:gated.final.merchants.npc2,
      choices:gated.totals.selection,
      silica:gated.final.sources},
      sameStateHash:normal.final.hash===gated.final.hash});
  }
  console.log('B-K10p Vorflug-Kassenfilter nur Analysegegenprobe',
    JSON.stringify(seedResults));
});
