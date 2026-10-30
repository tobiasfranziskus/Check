// v11-Pruefung nur des Nahrungsbasispreises (unveränderte Kernfunktion).
// node tools/food-price-scenarios.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const ref=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const anchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
assert.equal(script.split(anchor).length,2);
const code=script.replace(anchor,
 "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,station,ware,menge,kauf,p,fee);\n  return true;");
const createCore=new Function('watchTrade',code+';return {c:m_core_index,r:m_data_rules.RULES};');
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const prices=[30,36,42,50];
const outputs={seeds:seeds.length,days:90,scenarios:{}};
for(const foodPrice of prices){
 const results=[];
 for(const seed of seeds){
  const records={};
  const watcher=(s,ship,station,ware,count,buy,p,fee)=>{
   if(ware!=='nahrung'||ship.klasse!=='frachter')return;
   records[station] ||= {purchases:0,sales:0,purchaseValue:0,saleValue:0};
   const v=records[station];
   if(buy){v.purchases+=count;v.purchaseValue+=count*p+fee;}
   else{v.sales+=count;v.saleValue+=count*p-fee;}
  };
  const {c,r}=createCore(watcher);
  const rules=structuredClone(r);
  rules.economy.waren.nahrung.basis=foodPrice;
  const s=c.createState(seed,rules),points=[];
  for(let t=1;t<=129600;t++){
   c.step(s,rules);
   if(t%60===0)assert(c.audit(s).ok,'Core-Audit '+foodPrice+'/'+seed+'/'+t);
   if([4320,43200,129600].includes(t))points.push({tick:t,hash:c.hash(s)});
  }
  assert.equal(c.hash(c.load(c.save(s),undefined,rules)),c.hash(s),'Save/Load');
  if(foodPrice===30)assert.deepEqual(points,ref.results.find(x=>x.seed===seed).points,'Festreferenz');
  const shortage=Object.fromEntries(Object.entries(s.stats.mangel).map(([id,m])=>[id,{...m}]));
  const money={station:0,fund:0,trader:0,miner:0,player:0,authority:0,pirate:0};
  for(const o of Object.values(s.owners))money[o.kind]+=o.cash;
  results.push({seed,shortage,records,money,produced:s.ledger.nahrung.produced,
   consumed:s.ledger.nahrung.consumed,imported:s.ledger.nahrung.imported,
   exported:s.ledger.nahrung.exported,
   npcTraderSales:sum(Object.entries(records).map(([station,x])=>x.sales)),
   minted:s.minted,burned:s.burned,npc1:s.owners.npc1.cash,npc2:s.owners.npc2.cash});
  console.log('FOOD_PRICE_RUN '+JSON.stringify({seed,foodPrice,shortage,records}));
 }
 const byStation={};const byWare={};const byTrade={};
 for(const row of results){
  for(const [station,wareMap] of Object.entries(row.shortage)){
   byStation[station] ||= {};
   for(const [ware,n] of Object.entries(wareMap)){
    byStation[station][ware]=(byStation[station][ware]||0)+n;
    byWare[ware]=(byWare[ware]||0)+n;
   }
  }
  for(const [station,amounts] of Object.entries(row.records)){
   byTrade[station] ||= {purchases:0,sales:0,purchaseValue:0,saleValue:0};
   for(const [k,v] of Object.entries(amounts))byTrade[station][k]+=v;
  }
 }
 const fields=['produced','consumed','imported','exported','minted','burned','npc1','npc2'];
 outputs.scenarios[foodPrice]={byStation,byWare,byTrade,
  shortage:sum(Object.values(byWare)),
  foodShortage:byWare.nahrung||0,
  fields:Object.fromEntries(fields.map(k=>[k,sum(results.map(x=>x[k]))])),
  money:Object.fromEntries(Object.keys(results[0].money).map(k=>[k,sum(results.map(x=>x.money[k]))]))
 };
 if(foodPrice===30){
  assert.equal(outputs.scenarios[foodPrice].shortage,4204);
  assert.equal(outputs.scenarios[foodPrice].foodShortage,3981);
  assert.equal(byStation.st_aldera.nahrung,2181);
  assert.equal(byStation.st_dravos.nahrung,1795);
 }
}
console.log('FOOD_PRICE_SUMMARY '+JSON.stringify(outputs));
