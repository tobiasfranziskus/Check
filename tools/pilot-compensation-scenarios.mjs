// Nur Entwicklungswerkzeug: Pilotengewinnbeteiligung im bestehenden Simulationskern.
// Keine Änderung von index.html. node tools/pilot-compensation-scenarios.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const fixture=JSON.parse(fs.readFileSync(new URL('../tests/fixtures/economy-geography-v11.json',import.meta.url),'utf8'));
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
assert.deepEqual(fixture.results.map(x=>x.seed),seeds);
const trade="buche(state, schiff.owner, 'kosten', fee);\n  return true;";
const start="function betriebskosten(state, rules) {";
const stop="function aussenhandel(state, rules) {";
const account="const besitzer = state.owners[s.owner];";
const book="buche(state, s.owner, 'kosten', n);";
for(const x of [trade,start,stop])assert.equal(source.split(x).length,2,'instrumentierungsanker fehlt');
const first=source.replace(trade,
 "buche(state, schiff.owner, 'kosten', fee);\n  watchTrade(state,schiff,ware,menge,kauf,p,fee);\n  return true;");
const i=first.indexOf(start),j=first.indexOf(stop),cost=first.slice(i,j);
assert.equal(cost.split(account).length,2);assert.equal(cost.split(book).length,2);
const patched=first.slice(0,i)+cost
 .replace(account,"const besitzer = watchPayer(state,s);\n    watchCost(state,s,kosten,besitzer.cash,besitzer.id);")
 .replace(book,"buche(state, besitzer.id, 'kosten', n);")+first.slice(j);
const engine=new Function('watchTrade','watchPayer','watchCost',patched+
 ';return {core:m_core_index,rules:m_data_rules.RULES};');
const sum=x=>x.reduce((n,v)=>n+v,0);
const median=x=>[...x].sort((a,b)=>a-b)[Math.floor(x.length/2)];
const employers=['npc1','npc2','npc3'];
const scenarios=[
 {id:'basis',trade:0,mine:0,pilotCosts:false},
 {id:'anteil_konzernkosten',trade:100,mine:200,pilotCosts:false},
 {id:'anteil_pilotkosten',trade:100,mine:200,pilotCosts:true},
 {id:'anteil_hoch_pilotkosten',trade:250,mine:400,pilotCosts:true},
];
function run(seed,scenario){
 const counts={wages:0,wagesTrade:0,wagesMine:0,events:0,assigned:0,rehired:0,
  duePilot:0,paidPilot:0,unpaidPilot:0,dueCorp:0,paidCorp:0,unpaidCorp:0,
  lostFreightCost:0,unmatchedSaleUnits:0,activePilots:0,lowCorpHours:0,
  wagesByOwner:{npc1:0,npc2:0,npc3:0}};
 const crew=new Map(),idle=new Map(employers.map(o=>[o,[]])),lots=new Map();
 const enabled=scenario.trade>0||scenario.mine>0;
 const eligible=ship=>employers.includes(ship.owner)&&['miner','frachter'].includes(ship.klasse);
 function cleanup(s){
  for(const [shipId,p] of crew)if(!s.ships[shipId]){
   idle.get(p.owner).push(p.pid);crew.delete(shipId);
  }
  for(const [shipId,ls] of lots)if(!s.ships[shipId]){
   counts.lostFreightCost+=sum(ls.map(l=>l.cost));lots.delete(shipId);
  }
 }
 function pilot(s,ship){
  if(!enabled||!eligible(ship))return null;
  if(crew.has(ship.id))return s.owners[crew.get(ship.id).pid];
  cleanup(s);
  const queue=idle.get(ship.owner);
  const pid=queue.length?queue.shift():'pilot_'+ship.id;
  if(s.owners[pid])counts.rehired++;
  else{
   s.owners[pid]={id:pid,kind:'pilot',cash:0};
   s.stats.konto[pid]={erloes:0,kosten:0};s.stats.abgabe[pid]=0;
   counts.assigned++;
  }
  crew.set(ship.id,{pid,owner:ship.owner});
  return s.owners[pid];
 }
 function remunerate(s,ship,amount,role){
  if(amount<=0)return;
  const account=pilot(s,ship),firm=s.owners[ship.owner];
  assert(account&&amount<=firm.cash,'Prämie ohne gedeckten Unternehmensanteil');
  firm.cash-=amount;account.cash+=amount;
  s.stats.konto[ship.owner].kosten+=amount;
  s.stats.konto[account.id].erloes+=amount;
  counts.wages+=amount;counts.events++;
  counts.wagesByOwner[ship.owner]+=amount;
  if(role==='mine')counts.wagesMine+=amount;else counts.wagesTrade+=amount;
 }
 function onTrade(s,ship,ware,quantity,buy,p,fee){
  if(!enabled||!eligible(ship))return;
  if(buy){
   if(ware===ship.klasse)return; // Aktivierung eines Ersatzschiffs
   const positions=lots.get(ship.id)||[];
   positions.push({ware,units:quantity,cost:quantity*p+fee});
   lots.set(ship.id,positions);return;
  }
  const proceeds=quantity*p-fee;
  if(ship.klasse==='miner'){
   remunerate(s,ship,Math.floor(Math.max(0,proceeds)*scenario.mine/1000),'mine');
   return;
  }
  let remaining=quantity,basis=0;
  const positions=lots.get(ship.id)||[];
  for(const lot of positions){
   if(lot.ware!==ware||remaining<=0||lot.units<=0)continue;
   const used=Math.min(remaining,lot.units);
   const apportioned=used===lot.units?lot.cost:Math.floor(lot.cost*used/lot.units);
   basis+=apportioned;lot.cost-=apportioned;lot.units-=used;remaining-=used;
  }
  lots.set(ship.id,positions.filter(x=>x.units>0));
  if(remaining>0){counts.unmatchedSaleUnits+=remaining;return;}
  remunerate(s,ship,Math.floor(Math.max(0,proceeds-basis)*scenario.trade/1000),'trade');
 }
 function payer(s,ship){
  return scenario.pilotCosts&&eligible(ship)?pilot(s,ship):s.owners[ship.owner];
 }
 function onCost(s,ship,due,cash,payerId){
  if(!employers.includes(ship.owner)||due<=0)return;
  const paid=Math.min(cash,due),unpaid=due-paid;
  if(payerId.startsWith('pilot_')){
   counts.duePilot+=due;counts.paidPilot+=paid;counts.unpaidPilot+=unpaid;
  }else{
   counts.dueCorp+=due;counts.paidCorp+=paid;counts.unpaidCorp+=unpaid;
  }
 }
 const {core,rules}=engine(onTrade,payer,onCost);
 assert.equal(rules.rulesVersion,11);
 const s=core.createState(seed),points=[];
 for(let t=1;t<=129600;t++){
  core.step(s,rules);
  if(t%60===0){
   assert(core.audit(s).ok,'Core-Audit '+scenario.id+'/'+seed+'/'+t);
   if(s.owners.npc1.cash<750)counts.lowCorpHours++;
   if(enabled)cleanup(s);
  }
  if([4320,43200,129600].includes(t))points.push({tick:t,hash:core.hash(s)});
 }
 assert.equal(core.hash(core.load(core.save(s))),core.hash(s),'Save/Load '+scenario.id+'/'+seed);
 if(scenario.id==='basis'){
  const expected=fixture.results.find(x=>x.seed===seed);
  assert.deepEqual(points,expected.points,'Festwertvergleich '+seed);
 }
 const money={pilot:0,station:0,fund:0,corp:0};
 for(const o of Object.values(s.owners)){
  if(o.kind==='pilot'){money.pilot+=o.cash;if(o.cash>0)counts.activePilots++;}
  else if(o.kind==='station')money.station+=o.cash;
  else if(o.kind==='fund')money.fund+=o.cash;
  else money.corp+=o.cash;
 }
 const shortage=sum(Object.values(s.stats.mangel).flatMap(x=>Object.values(x)));
 return {seed,scenario:scenario.id,shortage,money,npc1:s.owners.npc1.cash,
  npc2:s.owners.npc2.cash,npc3:s.owners.npc3.cash,
  npc1Levy:s.stats.abgabe.npc1||0,stats:counts,hash:core.hash(s)};
}
const metrics=['shortage','npc1','npc2','npc3','npc1Levy'];
const detail=['wages','wagesTrade','wagesMine','events','assigned','rehired',
 'duePilot','paidPilot','unpaidPilot','dueCorp','paidCorp','unpaidCorp',
 'lostFreightCost','unmatchedSaleUnits','activePilots','lowCorpHours'];
const results={};
for(const scen of scenarios){
 const values=[];
 for(const seed of seeds){const row=run(seed,scen);values.push(row);console.log('PILOT_RUN '+JSON.stringify(row));}
 results[scen.id]=values;
}
const summary={seeds:seeds.length,days:90,scenarios:{},caveats:[
 'Pauschale bisherige Betriebskosten im Experiment lediglich auf Pilotenkonto umgebucht: keine echten Reparaturservices',
 'Nur reale Lieferungen: Handelsmarge nach Kauf- und Verkaufsgebühr; Miner Nettolieferung',
 'Pilotenkonto überlebt Schiffsverlust und kann bei Ersatzschiff desselben Konzerns wiederverwendet werden',
 'Keine Erfahrung, Ausrüstung, Bounties oder Pilot-UI implementiert; keine Produktionscodeänderung']};
for(const scen of scenarios){
 const a=results[scen.id],m={};
 for(const k of metrics)m[k]={sum:sum(a.map(x=>x[k])),median:median(a.map(x=>x[k]))};
 for(const k of detail)m[k]={sum:sum(a.map(x=>x.stats[k])),median:median(a.map(x=>x.stats[k]))};
 for(const k of Object.keys(a[0].money))m['money_'+k]={sum:sum(a.map(x=>x.money[k])),median:median(a.map(x=>x.money[k]))};
 summary.scenarios[scen.id]={params:scen,metrics:m};
}
console.log('PILOT_SUMMARY '+JSON.stringify(summary));
