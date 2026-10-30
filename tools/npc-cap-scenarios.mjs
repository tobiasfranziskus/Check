// Kapitaleinbehalt: reine Gegenrechnung auf v11-Welt; KEINE Änderung an index.html.
// node tools/npc-cap-scenarios.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const ref=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(ref.results.map(x=>x.seed),seeds);
const costAnchor="const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
const tradeAnchor="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
assert.equal(source.split(costAnchor).length,2);
assert.equal(source.split(tradeAnchor).length,2);
const instrument=source.replace(costAnchor,
 "watchCost(state,s,kosten,besitzer.cash);\n    "+costAnchor)
 .replace(tradeAnchor,
  "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,station,ware,menge,kauf);\n  return true;");
const sum=a=>a.reduce((x,y)=>x+y,0);
const med=values=>[...values].sort((x,y)=>x-y)[Math.floor(values.length/2)];
const variants=[
 {name:'baseline6000',limit:6000},
 {name:'limit12000',limit:12000},
 {name:'limitOff',limit:Number.MAX_SAFE_INTEGER}
];
const results={};
for(const variant of variants){
 const data=[];
 for(const seed of seeds){
  const diag={unpaidNpc1:0,unpaidNpc2:0,unpaidNpc3:0,unpaidEventsNpc1:0,salesNpc1:0,salesNpc2:0,
    buyNpc1:0,buyNpc2:0,lowNpc1Hours:0,zeroNpc1Hours:0,lowNpc2Hours:0,
    minNpc1:Infinity,maxNpc1:0,cashSumNpc1:0,cashSumNpc2:0,cashSumStations:0,fundCashSum:0};
  const engine=new Function('watchCost','watchTrade',instrument+';return {core:m_core_index,rules:m_data_rules.RULES};')(
    (state,ship,due,cash)=>{
     if(ship.owner!=='npc1'&&ship.owner!=='npc2'&&ship.owner!=='npc3')return;
     const missing=Math.max(0,due-cash);
     diag['unpaid'+ship.owner.toUpperCase().replace('NPC','Npc')]+=missing;
     if(ship.owner==='npc1'&&missing>0)diag.unpaidEventsNpc1++;
    },
    (state,ship,station,ware,amount,buy)=>{
     if(ship.klasse!=='frachter'||(ship.owner!=='npc1'&&ship.owner!=='npc2'))return;
     // Ersatzschiffkauf ist keine echte NPC-Handelsinvestition.
     if(buy && ware===ship.klasse)return;
     const k=(buy?'buy':'sales')+(ship.owner==='npc1'?'Npc1':'Npc2');
     diag[k]++;
    });
  const rules=structuredClone(engine.rules);
  rules.world.npcObergrenze=variant.limit;
  const s=engine.core.createState(seed,rules),points=[];
  for(let t=1;t<=129600;t++){
   engine.core.step(s,rules);
   if(t%60===0){
    assert(engine.core.audit(s).ok,variant.name+' Geld/Waren '+seed+'/'+t);
    const c1=s.owners.npc1.cash,c2=s.owners.npc2.cash;
    diag.cashSumNpc1+=c1;diag.cashSumNpc2+=c2;
    diag.minNpc1=Math.min(diag.minNpc1,c1);diag.maxNpc1=Math.max(diag.maxNpc1,c1);
    if(c1<750)diag.lowNpc1Hours++;
    if(c1===0)diag.zeroNpc1Hours++;
    if(c2<750)diag.lowNpc2Hours++;
    diag.cashSumStations+=sum(Object.entries(s.owners).filter(([id])=>id.startsWith('st_')).map(([,o])=>o.cash));
    diag.fundCashSum+=sum(Object.entries(s.owners).filter(([id])=>id.startsWith('fonds_')).map(([,o])=>o.cash));
   }
   if(t===4320||t===43200||t===129600)points.push({tick:t,hash:engine.core.hash(s)});
  }
  if(variant.name==='baseline6000'){
   assert.deepEqual(points,ref.results.find(x=>x.seed===seed).points,'Unveränderte v11-Referenz '+seed);
   assert.equal(diag.unpaidNpc1,ref.results.find(x=>x.seed===seed).final.unpaidNpc1);
  } else {
   const replay=engine.core.createState(seed,rules);
   for(const p of points){
    while(replay.tick<p.tick)engine.core.advance(replay,Math.min(10000,p.tick-replay.tick),rules);
    assert.equal(engine.core.hash(replay),p.hash,'Deterministischer Gegenlauf '+variant.name+'/'+seed+'/'+p.tick);
   }
  }
  assert.equal(engine.core.hash(engine.core.load(engine.core.save(s))),engine.core.hash(s),'Save/Load '+variant.name+'/'+seed);
  const shortageByStation=Object.fromEntries(Object.entries(s.stats.mangel).map(([id,row])=>[id,{...row}]));
  const values={seed,shortage:sum(Object.values(shortageByStation).flatMap(x=>Object.values(x))),
   shortageByStation,leviesNpc1:s.stats.abgabe.npc1||0,leviesNpc2:s.stats.abgabe.npc2||0,
   unpaidNpc1:diag.unpaidNpc1,unpaidNpc2:diag.unpaidNpc2,unpaidNpc3:diag.unpaidNpc3,
   unpaidEventsNpc1:diag.unpaidEventsNpc1,salesNpc1:diag.salesNpc1,salesNpc2:diag.salesNpc2,
   buyNpc1:diag.buyNpc1,buyNpc2:diag.buyNpc2,
   lowNpc1Hours:diag.lowNpc1Hours,zeroNpc1Hours:diag.zeroNpc1Hours,lowNpc2Hours:diag.lowNpc2Hours,
   avgCashNpc1:Math.round(diag.cashSumNpc1/2160),avgCashNpc2:Math.round(diag.cashSumNpc2/2160),
   avgStationsCash:Math.round(diag.cashSumStations/2160),avgFundsCash:Math.round(diag.fundCashSum/2160),
   minNpc1:diag.minNpc1,maxNpc1:diag.maxNpc1,finalNpc1:s.owners.npc1.cash,
   finalNpc2:s.owners.npc2.cash,hash:engine.core.hash(s)};
  data.push(values);
  console.log('CAP_SEED '+JSON.stringify({variant:variant.name,...values}));
 }
 results[variant.name]=data;
}
const keys=['shortage','leviesNpc1','leviesNpc2','unpaidNpc1','unpaidNpc2','unpaidNpc3',
 'unpaidEventsNpc1','salesNpc1','salesNpc2','buyNpc1','buyNpc2',
 'lowNpc1Hours','zeroNpc1Hours','avgCashNpc1','avgCashNpc2','avgStationsCash','avgFundsCash',
 'finalNpc1','finalNpc2'];
const out={seeds:seeds.length,rulesVersion:11,scenarios:{},note:'Vergleich von Regelvarianten, nicht Balancefreigabe; stündliche Audits und Hash-Kontrollen'};
for(const variant of variants){
 const rows=results[variant.name],m={};
 for(const k of keys)m[k]={sum:sum(rows.map(r=>r[k])),median:med(rows.map(r=>r[k]))};
 const stations={};
 for(const row of rows)for(const [id,wares] of Object.entries(row.shortageByStation)){
  for(const [ware,n] of Object.entries(wares)){
   stations[id]??={};stations[id][ware]=(stations[id][ware]||0)+n;
  }
 }
 out.scenarios[variant.name]={limit:variant.limit,metrics:m,shortages:stations};
}
console.log('CAP_SUMMARY '+JSON.stringify(out));
