// B-K9m.2: strict isolated test of random empty relocation, no product code edits.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const anchor='    else if (s.warten >= 2) {';
assert.equal(source.split(anchor).length,2);
const amended=source.replace(anchor,
  '    else if (s.warten >= 2 && disableRandom) { s.ankunft = state.tick + w.warteLeer; }\n'+anchor);
const wage='    const n = Math.min(besitzer.cash, kosten);';
assert.equal(amended.split(wage).length,2);
const instrument=amended.replace(wage,
  '    const n = Math.min(besitzer.cash, kosten);\n'+
  '    if(s.klasse==="frachter"&&["npc1","npc2"].includes(s.owner)){\n'+
  '      probe.due+=kosten;probe.paid+=n;probe.unpaid+=kosten-n;\n'+
  '    }');
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const modes=[false,true];
function run(seed,disableRandom){
 const probe={due:0,paid:0,unpaid:0};
 const {core,rules}=new Function('disableRandom','probe',instrument+
   ';return {core:m_core_index,rules:m_data_rules.RULES};')(disableRandom,probe);
 assert.equal(rules.rulesVersion,14);
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 const start=core.hash(s);
 let auditHours=0,saves=0;
 const goods={};
 for(let hour=1;hour<=2160;hour++){
  core.advance(s,60,rules);
  assert(core.audit(s).ok);
  assert.equal(sum(Object.fromEntries(Object.entries(s.owners).map(([id,x])=>[id,x.cash]))),
     s.initialSupply+s.minted-s.burned);
  auditHours++;
  if([24,168,336,720,1440,2160].includes(hour)){
    const copy=core.load(core.save(s),undefined,rules);
    assert.equal(core.hash(copy),core.hash(s));saves++;
  }
 }
 assert.equal(probe.due,probe.paid+probe.unpaid);
 const npc=Object.values(s.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner));
 return {seed,mode:disableRandom?'hold_if_no_trade':'original',
  start,hash:core.hash(s),auditHours,saves,
  hulls:npc.length,shops:s.stats.handel,
  losses:sum(s.stats.verluste.npc1||{})+sum(s.stats.verluste.npc2||{}),
  replacement:sum(s.stats.indienst.npc1||{})+sum(s.stats.indienst.npc2||{}),
  shortage:Object.values(s.stats.mangel).reduce((n,x)=>n+sum(x),0),
  traderCash:s.owners.npc1.cash+s.owners.npc2.cash,
  player:s.owners.house.cash,paidWork:probe.paid,unpaidWork:probe.unpaid,
  dueWork:probe.due};
}
const rows=SEEDS.map(seed=>({seed,control:run(seed,false),hold:run(seed,true)}));
for(const row of rows){
 assert.equal(row.control.start,row.hold.start);
 console.log('BK9M_EMPTY_PAIR '+JSON.stringify(row));
}
const med=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const metrics=['hulls','shops','losses','replacement','shortage','traderCash','player','paidWork','unpaidWork'];
const groups={};
for(const mode of ['control','hold']){
 groups[mode]=Object.fromEntries(metrics.map(k=>[k,{
  min:Math.min(...rows.map(x=>x[mode][k])),median:med(rows.map(x=>x[mode][k])),
  max:Math.max(...rows.map(x=>x[mode][k])),
  sum:rows.reduce((a,x)=>a+x[mode][k],0)}]));
}
const out={seeds:13,worlds:26,days:90,audits:26*2160,saveLoad:26*6,
 groups,identicalStart:rows.every(r=>r.control.start===r.hold.start),
 improvedHulls:rows.filter(r=>r.hold.hulls>r.control.hulls).length,
 reducedShortages:rows.filter(r=>r.hold.shortage<r.control.shortage).length,
 increasedShortages:rows.filter(r=>r.hold.shortage>r.control.shortage).length,
 reducedUnpaid:rows.filter(r=>r.hold.unpaidWork<r.control.unpaidWork).length,
 caveat:'Original goods/owner settlement. Random empty reposition alone disabled in an in-memory test; not ship safety or guaranteed positive trade routes. No new money; unfinanced occupied trips still run.'};
console.log('BK9M_EMPTY_SUMMARY '+JSON.stringify(out));
assert.equal(rows.length,13);
const x=run(7,true),y=run(7,true);
assert.equal(x.hash,y.hash);
console.log('BK9M_EMPTY_REPLAY '+JSON.stringify({seed:7,hash:x.hash,identical:true}));
