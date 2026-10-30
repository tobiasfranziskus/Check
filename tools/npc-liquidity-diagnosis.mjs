// Diagnose der NPC-Händlerliquidität. Keine Wirtschafts- oder Zustandsänderungen.
// Varianten: v10 + einziges Tor Meridian–Orion; v11 mit Tor + Nadir.
// Aufruf im vollständigen Git-Checkout: node tools/npc-liquidity-diagnosis.mjs
import fs from 'node:fs';
import { v11CoreSource } from './v11-core-source.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const baselineSha='3cff288aa75c2c072c210298e9f81fb7b92a4ec7';
const baseHtml=execFileSync('git',['show',baselineSha+':index.html'],{encoding:'utf8',maxBuffer:10*1024*1024});
const fullHtml=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const old="gates: [{ to: 'veldra', time: 30 }],";
assert.equal(baseHtml.split(old).length,2,'Basistor-Anker eindeutig');
const torHtml=baseHtml.replace(old,"gates: [{ to: 'veldra', time: 30 }, { to: 'orion', time: 26 }],");
const v11Fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const torFixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-tor-only-v10.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(v11Fixture.results.map(x=>x.seed),seeds);
assert.deepEqual(torFixture.results.map(x=>x.seed),seeds);
const watchers=['npc1','npc2'], sum=xs=>xs.reduce((a,b)=>a+b,0);
const add=(map,k,n)=>map[k]=(map[k]||0)+n;
const median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)];
const source=html=>v11CoreSource(html);
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
const levyAnchor="const n = o[id].cash - w.npcObergrenze;\n    if (n <= 0) continue;\n    o[id].cash -= n; o[ziel].cash += n;";
function instrument(html,onTrade,onCost,onLevy) {
 let src=source(html);
 for(const a of [tradeAnchor,costAnchor,levyAnchor])assert.equal(src.split(a).length,2,'eindeutiger Beobachteranker');
 src=src.replace(tradeAnchor,"buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,station,ware,menge,kauf,p,fee);\n  return true;")
 .replace(costAnchor,"watchCost(state,s,kosten,besitzer.cash);\n    "+costAnchor)
 .replace(levyAnchor,"const n = o[id].cash - w.npcObergrenze;\n    if (n <= 0) continue;\n    watchLevy(state,id,n);\n    o[id].cash -= n; o[ziel].cash += n;");
 return new Function('watchTrade','watchCost','watchLevy',src+';return {core:m_core_index,rules:m_data_rules.RULES};')(onTrade,onCost,onLevy);
}
function emptyOwner(){
 return {buyCount:0,buyUnits:0,buySpend:0,buyFees:0,sellCount:0,sellUnits:0,
  sellIncome:0,sellFees:0,sellCostBasis:0,buyUnder250:0,buyUnder750:0,
  buyNoCash:0,unmatchedSellUnits:0,levies:0,levyCount:0,
  replacementCount:0,replacementSpend:0,
  costDue:0,costPaid:0,costUnpaid:0,costEvents:0,unpaidEvents:0,unpaidWithCargo:0,
  samples:0,cashSum:0,cashMin:Infinity,cashZeroHours:0,
  cargoCostSum:0,cargoPeak:0,cargoHours:0,cargoAndNoCashHours:0,
  cargoAndUnder750Hours:0,lostCargoCost:0,lostCargoUnits:0,
  holdWeightedTicks:0,holdSoldUnits:0,buyWare:{},sellWare:{},
  buyStation:{},sellStation:{},lossWare:{},sellUnmatchedWare:{}};
}
function run(html,seed,variant) {
 const byOwner=Object.fromEntries(watchers.map(id=>[id,emptyOwner()]));
 // Der Anschaffungspreis wird pro Schiff und Ware als FIFO-Lot verfolgt:
 // nur tatsächlich bezahlte Handelskäufe; kein künstlicher Gesamtmarktwert.
 const lots=new Map();
 let maxUnpaidEvent=null;
 const get=(id)=>{if(!lots.has(id))lots.set(id,[]);return lots.get(id)};
 const stockCost=(owner)=>{
  let value=0;for(const entries of lots.values())for(const l of entries)if(l.owner===owner)value+=l.units*l.unitCost;
  return value;
 };
 function onTrade(s,ship,station,ware,amount,buy,p,fee) {
  const o=byOwner[ship.owner];if(!o)return;
  const value=amount*p;
  // Ersatzschiffe werden unmittelbar nach dem Kauf aktiviert. Sie sind
  // Anlageinvestitionen und keine zum Weiterverkauf bestimmte Handelsfracht.
  if(buy&&ware===ship.klasse&&ship.klasse==='frachter'){
   o.replacementCount++;o.replacementSpend+=value+fee;return;
  }
  const shipLots=get(ship.id);
  if(buy){
   o.buyCount++;o.buyUnits+=amount;o.buySpend+=value+fee;o.buyFees+=fee;
   add(o.buyWare,ware,value+fee);add(o.buyStation,station,value+fee);
   const cash=s.owners[ship.owner].cash;
   if(cash<250)o.buyUnder250++;
   if(cash<750)o.buyUnder750++;
   if(cash===0)o.buyNoCash++;
   shipLots.push({owner:ship.owner,ware,units:amount,unitCost:(value+fee)/amount,boughtAt:s.tick});
  } else {
   o.sellCount++;o.sellUnits+=amount;o.sellIncome+=value-fee;o.sellFees+=fee;
   add(o.sellWare,ware,value-fee);add(o.sellStation,station,value-fee);
   let left=amount;
   for(const lot of shipLots){
    if(lot.ware!==ware||left<=0||lot.units<=0)continue;
    const n=Math.min(left,lot.units);lot.units-=n;left-=n;
    o.sellCostBasis+=n*lot.unitCost;
    o.holdSoldUnits+=n;o.holdWeightedTicks+=n*(s.tick-lot.boughtAt);
   }
   if(left>0){o.unmatchedSellUnits+=left;add(o.sellUnmatchedWare,ware,left);}
   lots.set(ship.id,shipLots.filter(l=>l.units>0));
  }
 }
 function onCost(s,ship,due,cashBefore){
  const o=byOwner[ship.owner];if(!o)return;
  const paid=Math.min(cashBefore,due),missing=Math.max(0,due-cashBefore);
  o.costEvents++;o.costDue+=due;o.costPaid+=paid;o.costUnpaid+=missing;
  if(missing>0){
   o.unpaidEvents++;
   if(stockCost(ship.owner)>0)o.unpaidWithCargo++;
   if(!maxUnpaidEvent||missing>maxUnpaidEvent.missing)maxUnpaidEvent={
    tick:s.tick,owner:ship.owner,ship:ship.id,due,cashBefore,missing,cargoCost:Math.round(stockCost(ship.owner))};
  }
 }
 function onLevy(s,id,n){if(!byOwner[id])return;byOwner[id].levies+=n;byOwner[id].levyCount++;}
 const {core,rules}=instrument(html,onTrade,onCost,onLevy);
 const s=core.createState(seed);
 function snapshot(){
  for(const id of watchers){
   const o=byOwner[id],cash=s.owners[id].cash,cargo=stockCost(id);
   o.samples++;o.cashSum+=cash;o.cashMin=Math.min(o.cashMin,cash);
   o.cargoCostSum+=cargo;o.cargoPeak=Math.max(o.cargoPeak,cargo);
   if(cash===0)o.cashZeroHours++;
   if(cargo>0)o.cargoHours++;
   if(cargo>0&&cash===0)o.cargoAndNoCashHours++;
   if(cargo>0&&cash<750)o.cargoAndUnder750Hours++;
  }
  // Schiffe sind nicht wiederverwendbare IDs; nicht mehr existierende Lots
  // sind verlorene, zuvor bezahlte Handelsfracht, kein Gewinn/Rückfluss.
  for(const [id,ls] of lots){
   if(s.ships[id])continue;
   for(const l of ls){
    const o=byOwner[l.owner];o.lostCargoCost+=l.units*l.unitCost;
    o.lostCargoUnits+=l.units;add(o.lossWare,l.ware,l.units*l.unitCost);
   }
   lots.delete(id);
  }
 }
 for(let tick=1;tick<=129600;tick++){
  core.step(s);
  if(tick%60===0){assert(core.audit(s).ok,'Audit '+variant+'/'+seed+'/'+tick);snapshot();}
 }
 const expected=variant==='tor'?torFixture.results.find(x=>x.seed===seed).hash
  :v11Fixture.results.find(x=>x.seed===seed).points.at(-1).hash;
 const actual=core.hash(s);
 for(const id of watchers){
  const o=byOwner[id];
  const onHand=sum([...lots.values()].flatMap(ls=>ls).filter(l=>l.owner===id).map(l=>l.units));
  assert.equal(o.buyUnits,o.sellUnits-o.unmatchedSellUnits+onHand+o.lostCargoUnits,
   'FIFO-Stückbilanz '+variant+'/'+seed+'/'+id);
 }
 assert.equal(actual,expected,'Fester Referenzhash '+variant+'/'+seed);
 assert.equal(core.hash(core.load(core.save(s))),actual,'Save/Load '+variant+'/'+seed);
 for(const id of watchers){
  const o=byOwner[id];
  o.cashAvg=Math.round(o.cashSum/o.samples);
  o.cargoCostAvg=Math.round(o.cargoCostSum/o.samples);
  o.cashMin=Number.isFinite(o.cashMin)?o.cashMin:0;
  o.cargoRemaining=Math.round(stockCost(id));
  o.sellGrossMargin=Math.round(o.sellIncome-o.sellCostBasis);
  o.avgHoldHours=o.holdSoldUnits?Math.round(o.holdWeightedTicks/o.holdSoldUnits/60):0;
  for(const k of ['cashSum','cargoCostSum','holdWeightedTicks','holdSoldUnits'])delete o[k];
 }
 return {seed,variant,hash:actual,maxUnpaidEvent,owners:byOwner};
}
const variants={tor:[],nadir:[]};
for(const seed of seeds){
 const tor=run(torHtml,seed,'tor'),nadir=run(fullHtml,seed,'nadir');
 variants.tor.push(tor);variants.nadir.push(nadir);
 console.log('LIQUIDITY_SEED '+JSON.stringify({seed,tor,nadir}));
}
const metrics=['buyCount','buyUnits','buySpend','buyFees','sellCount','sellIncome','sellGrossMargin',
 'buyUnder250','buyUnder750','buyNoCash','replacementCount','replacementSpend',
 'levies','levyCount','costDue','costPaid',
 'costUnpaid','costEvents','unpaidEvents','unpaidWithCargo','cashZeroHours','cashAvg',
 'cargoCostAvg','cargoPeak','cargoHours','cargoAndNoCashHours','cargoAndUnder750Hours',
 'lostCargoCost','lostCargoUnits','cargoRemaining','avgHoldHours'];
const summary={seeds:seeds.length,variant:{},meaning:{
 cash:'Kassenstand stündlich nach allen Simulationsphasen',
 cargo:'Gebundenes Einkaufskapital von noch vorhandener bezahlter Handelsfracht, FIFO',
 cost:'Kostenlücke je Schiff und Kostenabrechnung, ohne Doppelzählung',
 profit:'Verkaufserlös nach Gebühren minus FIFO-Anschaffungskosten; Schiffsverluste und Unterhalt separat',
 replacement:'Sofort aktivierte, bezahlte Ersatzfrachter getrennt von Handelsfracht gebucht',
 limit:'Abgabe oberhalb npcObergrenze, keine tatsächliche Liquiditätsreserve'}};
for(const [name,rows] of Object.entries(variants)){
 const owners={};
 for(const owner of watchers){
  const vals={};
  for(const key of metrics){
   const a=rows.map(r=>r.owners[owner][key]);
   vals[key]={sum:Math.round(sum(a)),median:median(a)};
  }
  const maps={};
  for(const k of ['buyWare','sellWare','buyStation','sellStation','lossWare']){
   const agg={};for(const row of rows)for(const [key,n] of Object.entries(row.owners[owner][k]))add(agg,key,n);
   maps[k]=Object.fromEntries(Object.entries(agg).sort((a,b)=>b[1]-a[1]));
  }
  owners[owner]={metrics:vals,flows:maps};
 }
 summary.variant[name]={owners};
}
console.log('LIQUIDITY_SUMMARY '+JSON.stringify(summary));
