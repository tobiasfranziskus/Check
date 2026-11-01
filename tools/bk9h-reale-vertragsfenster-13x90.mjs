// B-K9h: 13 x 90 Tage, kontrollierte Regel15-Welten vs. deterministische
// Test-Disposition OHNE Teleport, Gratisgeld, neue Hüllen oder neue Marktpreise.
// Nicht als Produkt-AI implementiert, keine Spielregel oder Geldschöpfung.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const R={...rules,schema:9,rulesVersion:15};
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const HOURS=90*24;
const INIT_HASHES={};
const count=(a)=>a.reduce((s,x)=>s+x,0);
const ownerCash=s=>Object.values(s.owners).reduce((x,y)=>x+y.cash,0);
const escrow=s=>Object.values(s.vertrag.eintraege).reduce((x,c)=>x+c.huelle+c.fee+c.lohn+c.escrow+
  (c.produktion?c.produktion.rohBudget+c.produktion.minerBudget+c.produktion.fabrikLohn+c.produktion.frachtBudget:0),0);
function invariant(s){
 const a=core.audit(s);
 assert(a.ok,'original rule15 core audit '+JSON.stringify(a));
 assert(core.vertragPruefen(s));
 assert.equal(ownerCash(s)+escrow(s),s.initialSupply+s.minted-s.burned);
 const goods={};
 for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager)){
   assert(Number.isSafeInteger(n)&&n>=0);
   goods[w]=(goods[w]||0)+n;
 }
 for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung)){
   assert(Number.isSafeInteger(n)&&n>=0);
   goods[w]=(goods[w]||0)+n;
 }
 for(const c of Object.values(s.vertrag.eintraege))if(c.produktion){
   goods.eis=(goods.eis||0)+c.produktion.rohLager;
   goods.nahrung=(goods.nahrung||0)+c.produktion.nahrungLager;
 }
 for(const [w,l] of Object.entries(s.ledger))
   assert.equal(goods[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     'unabhängige Warenerhaltung '+w);
}
function shortage(s){
 return Object.values(s.stats.mangel).reduce((n,x)=>n+Object.values(x).reduce((a,b)=>a+b,0),0);
}
function tickQuote(s,agent,counters){
 // Nach Vertragsschluss ggf. denselben Frachter wieder für normalen
 // Handel freigeben. Keine Flottenneuanschaffung oder Positionsänderung.
 for(const c of Object.values(s.vertrag.eintraege)){
   if(c.status==='bereit'){
     counters.shipTries++;
     if(core.vertragFracht(s,c.id,R))counters.shipStarted++;
   }
   if(c.status==='erfuellt' && !agent.released.has(c.id)){
     const sh=s.ships[c.schiff];
     if(sh && sh.phase==='dock' && sh.auftrag==='halten')
       sh.auftrag='handeln'; // normaler NPC-Auftrag, ohne Teleport
     agent.released.add(c.id);
   }
 }
 if(Object.keys(s.vertrag.eintraege).length>=30)return;
 // Eine echte stationäre Verfügbarkeit ist Pflicht. Nicht wie B-K9f
 // Testschiffe künstlich nach Cyris bewegen.
 const miners=Object.values(s.ships).filter(x=>x.klasse==='miner'&&x.owner==='npc3'&&
   x.system==='cyris'&&x.phase==='dock'&&x.ware==='eis'&&
   Object.values(x.ladung).every(n=>n===0)).sort((a,b)=>a.id.localeCompare(b.id));
 const ships=Object.values(s.ships).filter(x=>x.klasse==='frachter'&&
   ['npc1','npc2'].includes(x.owner)&&x.system==='cyris'&&x.phase==='dock'&&
   Object.values(x.ladung).every(n=>n===0)).sort((a,b)=>a.id.localeCompare(b.id));
 if(!miners.length){counters.noMiner++;return;}
 if(!ships.length){counters.noFreighter++;return;}
 counters.coLocated++;
 for(const m of miners)for(const f of ships){
   const oldMiner=m.auftrag,oldF=f.auftrag;
   // Befehlsannahme in der Test-Disposition: der vorhandene NPC kann
   // zwischen 'halten' und seiner üblichen Tätigkeit disponieren.
   if(m.auftrag==='halten')m.auftrag='foerdern';
   if(f.auftrag==='handeln')f.auftrag='halten';
   for(const ziel of ['st_aldera','st_veldra'])for(let menge=1;menge<=26;menge++){
     const a={quelle:'st_cyris',ziel,miner:m.id,frachter:f.id,
       menge,fabriklohn:3*menge,ersatzFahrten:20};
     const q=core.nahrungsmarktangebot(s,R,a);counters.quotes++;
     if(q.ok){
       counters.positiveQuotes++;
       const id=core.vertragProduktion(s,a,R);
       if(id){
         counters.started++;
         counters.bookedFood+=menge;
         counters.startedIds.push(id);
         return;
       }
       counters.rejectedAfterQuote++;
     }
   }
   m.auftrag=oldMiner;f.auftrag=oldF;
 }
}
function start(seed){
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(player);
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 return core.load(core.save(s),undefined,R);
}
function run(seed,useAgent,days=90){
 const s=start(seed);
 const initialHash=core.hash(s);
 if(!(seed in INIT_HASHES))INIT_HASHES[seed]=initialHash;
 assert.equal(INIT_HASHES[seed],initialHash);
 const counters={quotes:0,positiveQuotes:0,started:0,bookedFood:0,shipTries:0,
   shipStarted:0,noMiner:0,noFreighter:0,coLocated:0,rejectedAfterQuote:0,startedIds:[]};
 const agent={released:new Set()};
 let checks=0,saves=0;
 const day14={},day90={};
 invariant(s);
 for(let hour=0;hour<days*24;hour++){
   if(useAgent)tickQuote(s,agent,counters);
   core.advance(s,60,R);
   invariant(s);checks++;
   if((hour+1)%(24*14)===0 && hour+1===24*14)
     Object.assign(day14,{shortage:shortage(s),player:s.owners.house.cash});
   if([24,168,336,720,1440,2160].includes(hour+1)){
     const saved=core.load(core.save(s),undefined,R);
     assert.equal(core.hash(s),core.hash(saved));
     saves++;
   }
 }
 const contracts=Object.values(s.vertrag.eintraege);
 Object.assign(day90,{shortage:shortage(s),player:s.owners.house.cash,
   npcCash:(s.owners.npc1?.cash||0)+(s.owners.npc2?.cash||0),
   npcShips:Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&
     ['npc1','npc2'].includes(sh.owner)).length,
   hullEscrow:contracts.reduce((n,c)=>n+c.huelle,0),
   cash:ownerCash(s),escrow:escrow(s),minted:s.minted,burned:s.burned});
 const statuses={};for(const c of contracts)statuses[c.status]=(statuses[c.status]||0)+1;
 const result={seed,mode:useAgent?'true_market_agent':'control',days,
   auditHours:checks,saveRoundTrips:saves,initialHash,hash:core.hash(s),
   counters:{...counters,startedIds:undefined},statuses,day14,day90,
   report:'This only measures a test-side dispatcher with genuine ship positions and ISK; not integrated NPC AI.'};
 console.log('BK9H_WELT '+JSON.stringify(result));
 return result;
}
const results=[];
for(const seed of SEEDS){
 const control=run(seed,false);
 const agent=run(seed,true);
 assert.equal(control.initialHash,agent.initialHash);
 results.push({seed,control,agent});
}
const short=results.map(x=>({
 seed:x.seed,started:x.agent.counters.started,ready:x.agent.counters.shipStarted,
 npcShips0:x.control.day90.npcShips,npcShips1:x.agent.day90.npcShips,
 shortage0:x.control.day90.shortage,shortage1:x.agent.day90.shortage,
 cash0:x.control.day90.npcCash,cash1:x.agent.day90.npcCash,
 coLocatedHours:x.agent.counters.coLocated,positive:x.agent.counters.positiveQuotes}));
const successes=short.filter(x=>x.started>0);
const summary={seeds:SEEDS.length,worlds:SEEDS.length*2,days:90,
 checks:SEEDS.length*2*HOURS,saveLoads:SEEDS.length*2*6,
 worldCasesWithFundedContracts:successes.length,
 totalContracts:count(short.map(x=>x.started)),
 totalCompleted:count(results.map(x=>x.agent.statuses.erfuellt||0)),
 totalUndelivered:count(results.map(x=>x.agent.statuses.bereit||0)),
 totalOpen:count(results.map(x=>['foerderung','roh-wartet','produktion','fahrt','wartet','geliefert']
   .reduce((n,k)=>n+(x.agent.statuses[k]||0),0))),
 averageShortageDelta:count(short.map(x=>x.shortage1-x.shortage0))/SEEDS.length,
 comparisons:short};
console.log('BK9H_13X90_SUMMARY '+JSON.stringify(summary));
assert.equal(results.length,13);
assert(results.every(x=>x.control.auditHours===HOURS&&x.agent.auditHours===HOURS));
assert(results.every(x=>x.control.saveRoundTrips===6&&x.agent.saveRoundTrips===6));
