// Aphros Void v14 – isolierter Förderziel-Vergleich und Liquiditäts-/Kostenbeobachter.
// Ausschließlich Analysewerkzeuge, keine Produktänderung. Kein zweiter Wirtschaftskern.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const BASE='d454d0661dee48a7bfdb843d05096982d799e51f';
export const MODES=['control','r3_target'];
export const SEEDS=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
export const SHA=s=>createHash('sha256').update(s).digest('hex');
export const raw=['erz','eis','kristall','silizium'];
export const source=x=>{
 const a=x.indexOf('<script>'),b=x.indexOf('const m_data_oberflaeche');
 assert(a>=0&&b>a,'HTML-Grenzen nicht gefunden');
 return x.slice(a+8,b);
};
export function readCore(){
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert(html.includes('v0.12.5')&&html.includes('schema: 8, rulesVersion: 14,'),'B5b v14-Basis erforderlich');
 return source(html);
}
export const NEEDLE='const m = Math.min(s.ladung[ware], aufnehmbar(state, rules, station, ware));';
export const TARGET='const m = Math.min(s.ladung[ware], aufnehmbar(state, rules, station, ware), Math.max(0, rules.world.stations[station].ziel[ware] - state.stations[station].lager[ware]));';
export function variant(src,mode){
 assert(MODES.includes(mode));
 if(mode==='control')return src;
 assert.equal(src.split(NEEDLE).length,2,'nur ursprüngliche Miner-Abgabe darf sich ändern');
 const newSrc=src.replace(NEEDLE,TARGET);
 assert.equal(newSrc.replace(TARGET,NEEDLE),src,'einzige produktive Variantenabweichung');
 return newSrc;
}
const COST='const n = Math.min(besitzer.cash, kosten);';
const TRADE="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
export function observedSource(src){
 assert.equal(src.split(COST).length,2,'einmalige Kostenstelle');
 assert.equal(src.split(TRADE).length,2,'einmaliger echter Handel');
 return src.replace(COST,"watch.cost(state,s,kosten,Math.min(besitzer.cash,kosten));\n    "+COST)
   .replace(TRADE,"buche(state, schiff.owner, 'kosten', fee);\n  watch.trade(state,schiff,station,ware,menge,kauf,wert,fee);\n  return true;");
}
export function engine(src,watch=null){
 return new Function('watch',src+';return {c:m_core_index,r:m_data_rules.RULES};')(watch);
}
const count=a=>a.reduce((z,n)=>z+n,0);
export function independentlyAudit(s){
 let money=0;
 for(const x of Object.values(s.owners)){assert(Number.isSafeInteger(x.cash)&&x.cash>=0,'negative/ungueltige Kasse');money+=x.cash;}
 assert.equal(money,s.initialSupply+s.minted-s.burned,'unabhaengige ISK-Bilanz');
 const goods={};
 for(const x of Object.values(s.stations))for(const [w,n] of Object.entries(x.lager)){assert(Number.isSafeInteger(n)&&n>=0,'negatives Lager');goods[w]=(goods[w]||0)+n;}
 for(const x of Object.values(s.ships))for(const [w,n] of Object.entries(x.ladung)){assert(Number.isSafeInteger(n)&&n>=0,'negative Fracht');goods[w]=(goods[w]||0)+n;}
 for(const [w,l] of Object.entries(s.ledger)){
  const expected=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
  assert.equal(goods[w]||0,expected,'unabhaengige Warenbilanz '+w);
 }
}
export class Watch{
 constructor(){
  this.due={};this.paid={};this.trades={};this.byShip={};this.rawNearCap=0;this.rawHours=0;
  this.fullMinerHours=0;this.totalMinerHours=0;this.recipeZeroStreak=0;this.maxRecipeZeroStreak=0;
  this.previousRecipes=null;this.priceSum=0;this.priceSamples=0;this.minuteCosts=0;this.rawInventories={};
 }
 ship(id){return this.byShip[id] ||= {buys:0,sells:0,buyValue:0,sellValue:0,fees:0,due:0,paid:0,
  completeCycles:0,repeatBuysAfterSale:0,lastBuy:false,everSale:false};}
 cost(state,s,due,paid){
  if(due<=0)return;
  this.due[s.owner]=(this.due[s.owner]||0)+due;
  this.paid[s.owner]=(this.paid[s.owner]||0)+paid;
  const row=this.ship(s.id);row.due+=due;row.paid+=paid;
 }
 trade(state,s,station,ware,n,buy,value,fee){
  const t=this.trades[s.owner] ||= {buys:0,sells:0,buyValue:0,sellValue:0,fees:0,byClass:{}};
  const name=buy?'buys':'sells';
  t[name]++;t[buy?'buyValue':'sellValue']+=value;t.fees+=fee;
  const cls=t.byClass[s.klasse] ||= {buys:0,sells:0,buyValue:0,sellValue:0,fees:0};
  cls[name]++;cls[buy?'buyValue':'sellValue']+=value;cls.fees+=fee;
  const row=this.ship(s.id);row[name]++;row[buy?'buyValue':'sellValue']+=value;row.fees+=fee;
  if(buy){if(row.everSale)row.repeatBuysAfterSale++;row.lastBuy=true;}
  else{if(row.lastBuy)row.completeCycles++;row.lastBuy=false;row.everSale=true;}
 }
 hour(s,r,core){
  let rawN=0;
  for(const [station,conf] of Object.entries(r.world.stations)){
   for(const w of raw){const z=conf.ziel[w];if(!z)continue;
    const val=s.stations[station].lager[w]||0,upper=core.obergrenze(s,r,station,w);
    rawN++;this.rawHours++;if(val>=0.95*upper)this.rawNearCap++;
    (this.rawInventories[w] ||= {sum:0,count:0,nearCap:0}).sum+=val;
    this.rawInventories[w].count++;
    if(val>=0.95*upper)this.rawInventories[w].nearCap++;
   }
  }
  for(const sh of Object.values(s.ships))if(sh.klasse==='miner'){
   this.totalMinerHours++;
   if((sh.ladung[sh.ware]||0)>=r.economy.cargo)this.fullMinerHours++;
  }
  this.priceSum+=core.faktor(s,'st_aldera','erz',r);this.priceSamples++;
  const recipes=count(Object.values(s.stats.rezepte));
  if(this.previousRecipes!==null){
   this.recipeZeroStreak=recipes===this.previousRecipes?this.recipeZeroStreak+1:0;
   this.maxRecipeZeroStreak=Math.max(this.maxRecipeZeroStreak,this.recipeZeroStreak);
  }
  this.previousRecipes=recipes;
 }
 summary(){
  const cycle=Object.values(this.byShip);
  return {due:{...this.due},paid:{...this.paid},
   unpaid:Object.fromEntries(Object.keys(this.due).map(id=>[id,this.due[id]-(this.paid[id]||0)])),
   trade:JSON.parse(JSON.stringify(this.trades)),
   cycles:{completed:count(cycle.map(x=>x.completeCycles)),repeatBuys:count(cycle.map(x=>x.repeatBuysAfterSale))},
   rawNearCapRatio:this.rawHours?this.rawNearCap/this.rawHours:null,
   fullMinerHoursRatio:this.totalMinerHours?this.fullMinerHours/this.totalMinerHours:null,
   rawInventories:Object.fromEntries(Object.entries(this.rawInventories).map(([w,x])=>[w,{mean:x.sum/x.count,highRatio:x.nearCap/x.count}])),
   alderaErzFactor:this.priceSamples?this.priceSum/this.priceSamples:null,
   maxRecipeZeroStreakHours:this.maxRecipeZeroStreak};
 }
}
export function snapshot(s,r,watch,core){
 const cats={};for(const x of Object.values(s.owners))cats[x.kind]=(cats[x.kind]||0)+x.cash;
 const cash={};for(const id of ['house','npc1','npc2','npc3','security','pirates','st_aldera','st_cyris','st_nadir','st_veldra'])cash[id]=s.owners[id]?.cash??null;
 const zeroStations=Object.keys(s.stations).filter(id=>s.owners[id].cash===0);
 const shortage=count(Object.values(s.stats.mangel).flatMap(x=>Object.values(x)));
 const recipe=count(Object.values(s.stats.rezepte));
 const ships={};for(const owner of ['house','npc1','npc2','npc3']){
  ships[owner]={miner:0,frachter:0};
  for(const sh of Object.values(s.ships))if(sh.owner===owner&&sh.klasse in ships[owner])ships[owner][sh.klasse]++;
 }
 return {tick:s.tick,day:s.tick/1440,shortage,recipes:recipe,minted:s.minted,burned:s.burned,
  cash,cashByKind:cats,zeroStations,ships,ledger:{silizium:{...s.ledger.silizium},bauteil:{...s.ledger.bauteil}},
  aldera:{silizium:s.stations.st_aldera.lager.silizium,bauteil:s.stations.st_aldera.lager.bauteil,
   material:s.stations.st_aldera.lager.material},
  shipsLost:s.stats.verluste,hash:core.hash(s),
  work:{npc1:{due:watch.due.npc1||0,paid:watch.paid.npc1||0},
   npc2:{due:watch.due.npc2||0,paid:watch.paid.npc2||0},
   npc3:{due:watch.due.npc3||0,paid:watch.paid.npc3||0}}};
}
