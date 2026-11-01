import fs from 'node:fs';
import assert from 'node:assert/strict';
// B-K9l: isolated test-only patch, not a new product rule or source change.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const tradeAnchor='      if (gewinn <= 0) continue;';
const wageAnchor='    const n = Math.min(besitzer.cash, kosten);';
assert.equal(source.split(tradeAnchor).length,2);
assert.equal(source.split(wageAnchor).length,2);
const altered=source.replace(tradeAnchor,[
'      if (gewinn <= 0) continue;',
'      if(profile){',
'        probe.quotes++;',
'        const wage=Math.ceil(r.zeit*w.betriebskosten.frachter/rules.economy.stunde);',
'        const cost=profile.legs*wage+profile.hull;',
'        const invoice=menge*pHier+gebuehr(state,rules,station,menge*pHier);',
'        if(gewinn<=cost){probe.rejectMargin++;continue;}',
'        if(kasse<invoice+cost){probe.rejectCash++;continue;}',
'        probe.acceptQuotes++;',
'      }'
].join('\n')).replace(wageAnchor,[
'    const n = Math.min(besitzer.cash, kosten);',
'    if(["npc1","npc2","npc3"].includes(s.owner)){',
'      probe.workRequired[s.owner]=(probe.workRequired[s.owner]||0)+kosten;',
'      probe.workPaid[s.owner]=(probe.workPaid[s.owner]||0)+n;',
'      probe.workUnpaid[s.owner]=(probe.workUnpaid[s.owner]||0)+(kosten-n);',
'    }'
].join('\n'));
const PROFILES=[
 {key:'original',legs:0,hull:0},
 {key:'hinflug_und_39',legs:1,hull:39},
 {key:'rueckflug_und_39',legs:2,hull:39}
];
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const HOURS=2160, CHECK=new Set([1,7,14,30,60,90]);
function make(p){
 const probe={quotes:0,rejectMargin:0,rejectCash:0,acceptQuotes:0,
   workRequired:{},workPaid:{},workUnpaid:{}};
 const x=new Function('profile','probe',altered+
   ';return {core:m_core_index,rules:m_data_rules.RULES};')(p.key==='original'?null:p,probe);
 assert.equal(x.rules.schema,8);assert.equal(x.rules.rulesVersion,14);
 return {...x,probe};
}
const sum=o=>Object.values(o).reduce((n,v)=>n+v,0);
function audit(s,core){
 assert(core.audit(s).ok);
 const cash=sum(Object.fromEntries(Object.entries(s.owners).map(([k,v])=>[k,v.cash])));
 assert.equal(cash,s.initialSupply+s.minted-s.burned);
 const have={};
 for(const st of Object.values(s.stations))for(const [ware,n] of Object.entries(st.lager)){
   assert(Number.isSafeInteger(n)&&n>=0);have[ware]=(have[ware]||0)+n;
 }
 for(const sh of Object.values(s.ships))for(const [ware,n] of Object.entries(sh.ladung)){
   assert(Number.isSafeInteger(n)&&n>=0);have[ware]=(have[ware]||0)+n;
 }
 for(const [ware,l] of Object.entries(s.ledger))
   assert.equal(have[ware]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     'physical goods '+ware);
}
function snapshot(s,rules,probe){
 const ships=Object.values(s.ships),npc=ships.filter(sh=>sh.klasse==='frachter'&&
   ['npc1','npc2'].includes(sh.owner));
 return {player:s.owners.house.cash,npcTraderCash:s.owners.npc1.cash+s.owners.npc2.cash,
   minerCash:s.owners.npc3.cash,stationsCash:Object.keys(s.stations)
      .reduce((n,id)=>n+s.owners[id].cash,0),
   hulls:npc.length,minerHulls:ships.filter(sh=>sh.klasse==='miner'&&sh.owner==='npc3').length,
   shortages:Object.values(s.stats.mangel).reduce((n,x)=>n+sum(x),0),
   lackingStations:Object.keys(rules.world.stations).filter(id=>
     Object.values(s.stats.mangel[id]).some(x=>x>0)).length,
   trades:s.stats.handel,replaced:sum(s.stats.indienst.npc1||{})+sum(s.stats.indienst.npc2||{}),
   lost:sum(s.stats.verluste.npc1||{})+sum(s.stats.verluste.npc2||{}),
   unpaidTrader:(probe.workUnpaid.npc1||0)+(probe.workUnpaid.npc2||0),
   paidTrader:(probe.workPaid.npc1||0)+(probe.workPaid.npc2||0),
   unpaidMiner:probe.workUnpaid.npc3||0,paidMiner:probe.workPaid.npc3||0,
   minted:s.minted,burned:s.burned};
}
function run(seed,profile,days=90,log=true){
 const {core,rules,probe}=make(profile);
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(player);assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 const startHash=core.hash(s);
 audit(s,core);
 const cps={};let saves=0,checks=0;
 for(let hour=1;hour<=days*24;hour++){
   core.advance(s,60,rules);audit(s,core);checks++;
   if(hour%24===0 && CHECK.has(hour/24)){
     const loaded=core.load(core.save(s),undefined,rules);
     assert.equal(core.hash(s),core.hash(loaded));
     cps[hour/24]=snapshot(s,rules,probe);saves++;
   }
 }
 const x={seed,profile:profile.key,startHash,hash:core.hash(s),days,
    checks,saves,quotes:{total:probe.quotes,approved:probe.acceptQuotes,
    deniedMargin:probe.rejectMargin,deniedCash:probe.rejectCash},
    day1:cps[1],day14:cps[14],end:snapshot(s,rules,probe)};
 if(log)console.log('BK9L_WORLD '+JSON.stringify(x));
 return x;
}
const rows=[];
for(const seed of SEEDS){
 const worlds=PROFILES.map(p=>run(seed,p));
 assert(worlds.every(x=>x.startHash===worlds[0].startHash));
 rows.push({seed,worlds});
}
function median(a){const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
const keys=['player','npcTraderCash','minerCash','stationsCash','hulls','minerHulls',
 'shortages','lackingStations','trades','replaced','lost','unpaidTrader','paidTrader',
 'unpaidMiner','paidMiner','minted','burned'];
const perProfile=PROFILES.map((p,i)=>{
 const w=rows.map(r=>r.worlds[i]);
 return {name:p.key,legs:p.legs,reserve:p.hull,
  hourlyAudits:w.reduce((n,x)=>n+x.checks,0),saveLoads:w.reduce((n,x)=>n+x.saves,0),
  quoteCounts:{checked:w.reduce((n,x)=>n+x.quotes.total,0),
    accepted:w.reduce((n,x)=>n+x.quotes.approved,0),
    marginRejected:w.reduce((n,x)=>n+x.quotes.deniedMargin,0),
    cashRejected:w.reduce((n,x)=>n+x.quotes.deniedCash,0)},
  casesWithRemainingFreighters:w.filter(x=>x.end.hulls>0).length,
  stats:Object.fromEntries(keys.map(k=>[k,{median:median(w.map(x=>x.end[k])),
    min:Math.min(...w.map(x=>x.end[k])),max:Math.max(...w.map(x=>x.end[k])),
    sum:w.reduce((n,x)=>n+x.end[k],0)}]))};
});
const comparisons=rows.map(r=>({seed:r.seed,rows:r.worlds.map(x=>({
  mode:x.profile,hulls:x.end.hulls,shortages:x.end.shortages,
  trades:x.end.trades,npcCash:x.end.npcTraderCash,
  unpaidTrader:x.end.unpaidTrader,minerUnpaid:x.end.unpaidMiner,
  replaced:x.end.replaced,player:x.end.player}))}));
const summary={worlds:rows.length*PROFILES.length,seeds:SEEDS,days:90,
 hourlyIndependentAndCoreAudits:39*HOURS,saveLoadHashes:39*6,
 perProfile,comparisons,
 restrictions:'Test-only original decision gate; price forecasts not guaranteed, no escrow; random empty reposition flights and loaded cargo search unchanged; 39 ISK/20 trips hypothetical, not approved; no additional ISK'};
console.log('BK9L_SUMMARY '+JSON.stringify(summary));
assert.equal(rows.length,13);
assert(rows.every(r=>r.worlds.every(x=>x.checks===HOURS&&x.saves===6)));
const a=run(7,PROFILES[2],14,false),b=run(7,PROFILES[2],14,false);
assert.equal(a.hash,b.hash);
console.log('BK9L_REPLAY '+JSON.stringify({seed:7,profile:PROFILES[2].key,days:14,hash:a.hash,identical:true}));
