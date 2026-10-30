// Ausschließlich Analyse: bestehende Preise, Waren- und Geldkreisläufe der v11-Welt.
// Keine Änderung an index.html, Save-Schema oder den produktiven Regeln.
// node tools/price-chain-scenarios.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const beg=html.indexOf('<script>')+8,end=html.indexOf('const m_data_oberflaeche');
assert(beg>=8&&end>beg,'Core-Quelle fehlt');
const orig=html.slice(beg,end);
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
assert.equal(orig.split(tradeAnchor).length,2,'Handelsbeobachter-Ausstieg verändert');
const patched=orig.replace(tradeAnchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  observeTrade(state,schiff,station,ware,menge,kauf,p,fee);\n  return true;");
const engine=new Function('observeTrade',patched+
 ';return {core:m_core_index,rules:m_data_rules.RULES};');
const rawCore=new Function(orig+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(fixture.results.map(x=>x.seed),seeds);
assert.equal(rawCore.rules.rulesVersion,11);
const DAYS=90,STEPS=DAYS*1440;
const sum=x=>x.reduce((a,b)=>a+b,0);
const median=x=>[...x].sort((a,b)=>a-b)[Math.floor(x.length/2)];
const variants=['basis','bauteil100','kette20','rohstoff14_kette20'];
const rawMaterials=['erz','eis','silizium','kristall'];

function pricedRules(variant){
 const r=structuredClone(rawCore.rules);
 if(variant==='bauteil100')r.economy.waren.bauteil.basis=100;
 else if(variant==='kette20'||variant==='rohstoff14_kette20'){
  if(variant==='rohstoff14_kette20'){
   r.economy.waren.erz.basis=14;
   r.economy.waren.eis.basis=14;
  }
  const recipes={};
  for(const cfg of Object.values(r.economy.rezepte)){
   assert.equal(Object.keys(cfg.aus).length,1,'Mehrfachprodukt erfordert neue Allokationsregel');
   const ware=Object.keys(cfg.aus)[0];
   assert(!recipes[ware],'Doppelrezept fuer '+ware);
   recipes[ware]=cfg;
  }
  const computed=new Set();
  function compute(w){
   if(rawMaterials.includes(w))return r.economy.waren[w].basis;
   if(computed.has(w))return r.economy.waren[w].basis;
   const recipe=recipes[w];
   assert(recipe,'kein Preisrezept: '+w);
   let cost=0;
   for(const [source,n] of Object.entries(recipe.ein))cost+=compute(source)*n;
   const count=recipe.aus[w];
   r.economy.waren[w].basis=Math.ceil(cost*120/(100*count));
   computed.add(w);
   return r.economy.waren[w].basis;
  }
  for(const w of Object.keys(r.economy.waren).sort())compute(w);
 }
 return r;
}
function unitEconomics(r){
 const rows=[];
 for(const [recipeId,recipe] of Object.entries(r.economy.rezepte)){
  const inputs=sum(Object.entries(recipe.ein).map(([w,n])=>r.economy.waren[w].basis*n));
  const output=sum(Object.entries(recipe.aus).map(([w,n])=>r.economy.waren[w].basis*n));
  rows.push({recipe:recipeId,input:inputs,output,margin:output-input,
   netWithTwo4PctFees:Math.floor(output*.96)-Math.ceil(inputs*1.04),
   minutes:recipe.dauer});
 }
 return rows;
}
function ownersMoney(state){
 const out={station:0,fund:0,trader:0,miner:0,authority:0,pirate:0,player:0};
 for(const o of Object.values(state.owners)){
  assert(Object.hasOwn(out,o.kind),'unbekannter Owner '+o.kind);
  out[o.kind]+=o.cash;
 }
 return out;
}
function losses(state,owner){
 return sum(Object.values(state.stats.verluste[owner]||{}));
}
function commissioned(state,owner){
 return sum(Object.values(state.stats.indienst[owner]||{}));
}
function run(seed,variant){
 const r=pricedRules(variant),trade={
  volume:0,events:0,fee:0,minerRevenue:0,minerSales:0,
  traderSales:0,traderSalesRevenue:0,traderBuyVolume:0,traderBuyCost:0
 };
 const observe=(s,ship,station,ware,n,buy,p,fee)=>{
  const value=p*n;
  trade.events++;trade.volume+=value;trade.fee+=fee;
  if(!buy&&ship.klasse==='miner'){trade.minerRevenue+=value-fee;trade.minerSales++;}
  if(ship.klasse==='frachter'&&ship.owner.startsWith('npc')){
   if(buy){trade.traderBuyCost+=value+fee;trade.traderBuyVolume+=n;}
   else{trade.traderSalesRevenue+=value-fee;trade.traderSales++;}
  }
 };
 const {core}=engine(observe);
 const state=core.createState(seed,r);
 const ref=fixture.results.find(o=>o.seed===seed);
 let poorStationHours=0,zeroStationHours=0,zeroNpc1=0,zeroNpc2=0;
 let checkpoint=[];
 for(let t=1;t<=STEPS;t++){
  core.step(state,r);
  if(t%60===0){
   const audit=core.audit(state);
   assert(audit.ok,variant+'/'+seed+'/tick='+t+' Audit '+JSON.stringify(audit));
   for(const id of Object.keys(state.stations)){
    if(state.owners[id].cash<r.world.mindeststand)poorStationHours++;
    if(state.owners[id].cash===0)zeroStationHours++;
   }
   if(state.owners.npc1.cash===0)zeroNpc1++;
   if(state.owners.npc2.cash===0)zeroNpc2++;
  }
  if(t===4320||t===43200||t===129600)checkpoint.push({tick:t,hash:core.hash(state)});
 }
 assert.equal(core.hash(core.load(core.save(state),undefined,r)),core.hash(state),'Save/Load '+variant+'/'+seed);
 if(variant==='basis'){
  assert.deepEqual(checkpoint,ref.points,'Referenz-Hashes '+seed);
  assert.equal(state.minted,ref.final.minted);
  assert.equal(state.burned,ref.final.burned);
  assert.equal(state.stats.handel,ref.final.sales);
  assert.equal(sum(Object.values(state.stats.mangel).flatMap(x=>Object.values(x))),ref.final.totalShortage);
 }
 const money=ownersMoney(state);
 const vals={
  shortage:sum(Object.values(state.stats.mangel).flatMap(x=>Object.values(x))),
  commonShortage:sum(Object.entries(state.stats.mangel).filter(([id])=>id!=='st_nadir').flatMap(([,x])=>Object.values(x))),
  sales:state.stats.handel,production:sum(Object.values(state.stats.rezepte)),
  minted:state.minted,burned:state.burned,netMint:state.minted-state.burned,
  cashStation:money.station,cashFunds:money.fund,cashTraders:money.trader,
  cashMiners:money.miner,cashSecurity:money.authority,cashPirates:money.pirate,
  poorStationHours,zeroStationHours,zeroNpc1,zeroNpc2,
  merchantLevies:sum(Object.values(state.stats.abgabe)),copies:state.stats.zuschuss,
  civilianLosses:losses(state,'npc1')+losses(state,'npc2')+losses(state,'npc3'),
  pirateLosses:losses(state,'pirates'),
  cargoDestroyed:state.stats.vernichtet,
  boughtReplacementShips:commissioned(state,'npc1')+commissioned(state,'npc2')+commissioned(state,'npc3'),
  pirateReplacements:state.stats.piratenErsatz,
  miningOre:state.ledger.erz.mined,miningIce:state.ledger.eis.mined,
  miningSilicon:state.ledger.silizium.mined,miningCrystal:state.ledger.kristall.mined,
  consumedMaterial:state.ledger.material.consumed,consumedParts:state.ledger.bauteil.consumed,
  imported:sum(Object.values(state.ledger).map(v=>v.imported)),
  exported:sum(Object.values(state.ledger).map(v=>v.exported)),
  ...trade
 };
 console.log('PRICE_RUN '+JSON.stringify({seed,variant,values:vals}));
 return vals;
}

const report={baseRulesVersion:rawCore.rules.rulesVersion,schema:rawCore.rules.schema,seeds:seeds.length,
 days:DAYS,variants:{},notes:[
 'Die 20%-Kette ist eine kalkulatorische Hypothese je Rezept, keine echten Arbeits-/Produktionkosten',
 'Kosten-Audit: alle existierenden dynamischen Marktpreise, alle Lager-/Geldzustaende im echten Core',
 'Keine Pilotenkonten, keine neuen Ausgaben. Vorige Lohnversuche bleiben eine separate Diagnose',
 'Fixe Geldmenge am Start fuer alle Varianten; keine Preisskalierung von Stationsbudget oder NPC-Startkapital',
 'Aussenhandel Meridian erzeugt/verbraucht Waren ohne ISK-Kauf',
 'Piratenersatz transferiert ISK an Meridian, erzeugt aber Piratenschiffe ohne Materialbedarf'
 ]};
for(const variant of variants){
 const rows=seeds.map(seed=>run(seed,variant));
 const summary={};
 for(const k of Object.keys(rows[0]))summary[k]={sum:sum(rows.map(row=>row[k])),median:median(rows.map(row=>row[k]))};
 report.variants[variant]={
  bases:Object.fromEntries(Object.keys(pricedRules(variant).economy.waren).sort().map(k=>[k,pricedRules(variant).economy.waren[k].basis])),
  recipeEconomics:unitEconomics(pricedRules(variant)),
  metrics:summary
 };
}
console.log('PRICE_SUMMARY '+JSON.stringify(report));
