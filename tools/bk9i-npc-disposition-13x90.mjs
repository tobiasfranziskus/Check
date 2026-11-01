// B-K9i: Diagnose der realen NPC-Disposition, KEINE neue Produktmechanik.
// Unterscheidet Abwesenheit / bereits geförderte Ladung / Frachterposition /
// Vollkosten für einen möglichen Leerflug, ohne Schiffe zu teleportieren.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules,route}=new Function(src+
  ';return {core:m_core_index,rules:m_data_rules.RULES,route:m_core_route.route};')();
const R={...rules,schema:9,rulesVersion:15};
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
const SAMPLE_DAYS=new Set([0,1,4,7,14,30,60,90]);
const CARGO=rules.economy.cargo;
const RATE=rules.world.betriebskosten.frachter;
const HOUR=rules.economy.stunde;
const ck=(o,k)=>o[k]=(o[k]||0)+1;
const load=sh=>Object.values(sh.ladung).reduce((n,x)=>n+x,0);
const isEmpty=sh=>load(sh)===0;
const safe=r=>r?.weg?.every(id=>rules.world.systems[id].sicherheit==='sicher')||false;
const count=(s,owner,klass)=>Object.values(s.ships).filter(x=>x.owner===owner&&x.klasse===klass).length;
const orig=seed=>{
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(player);
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 return core.load(core.save(s),undefined,R);
};
function paidFlight(s,ship){
 const r=route(R.world,ship.system,'cyris');
 if(!r||r.zeit<=0)return null;
 const conservative=Math.ceil(r.zeit/HOUR)*RATE;
 const expected=Math.floor(r.zeit*RATE/HOUR);
 return {origin:ship.system,id:ship.id,zeit:r.zeit,conservative,expected,
    validSafe:safe(r),wallet:s.owners[ship.owner].cash,
    wageFundable:s.owners[ship.owner].cash>=conservative,
    // Fehlt noch Original-Einkauf, Zielverkauf, Rückflug und Werftersatz.
    completeRoundTripFunded:false};
}
function counters(){
 return {hours:0,minerNoneInCyris:0,minerDockHere:0,minerPartiallyLoadedHere:0,
  minerFullHere:0,minerDockEmptyHere:0,minerNotDockHere:0,
  shipNoneInCyris:0,shipDockHere:0,shipPartiallyLoadedHere:0,shipDockEmptyHere:0,
  shipNotDockHere:0,simultaneousDockPhysical:0,simultaneousStrictEmpty:0,
  minerAlreadyWorkingFrachterEmpty:0,emptyShipPaidRouteCandidates:0,
  emptyShipUnaffordableRoutes:0,emptyShipUnsafeRoutes:0,
  pricedWindowsWithMinerCargo:0,quoteChecks:0,quoteOk:0,reasonCounts:{},
  bothAtCyrisExamples:[],safePaidRepositionExamples:[]};
}
function classify(s,z,hour,seed){
 z.hours++;
 const miners=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.ware==='eis');
 const ships=Object.values(s.ships).filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter');
 const mh=miners.filter(x=>x.system==='cyris');
 const md=mh.filter(x=>x.phase==='dock');
 const sh=ships.filter(x=>x.system==='cyris');
 const sd=sh.filter(x=>x.phase==='dock');
 const me=md.filter(isEmpty);
 const fe=sd.filter(isEmpty);
 if(!mh.length)z.minerNoneInCyris++;
 if(md.length)z.minerDockHere++;
 if(md.some(x=>load(x)>0&&load(x)<CARGO))z.minerPartiallyLoadedHere++;
 if(md.some(x=>load(x)>=CARGO))z.minerFullHere++;
 if(me.length)z.minerDockEmptyHere++;
 if(mh.some(x=>x.phase!=='dock'))z.minerNotDockHere++;
 if(!sh.length)z.shipNoneInCyris++;
 if(sd.length)z.shipDockHere++;
 if(sd.some(x=>!isEmpty(x)))z.shipPartiallyLoadedHere++;
 if(fe.length)z.shipDockEmptyHere++;
 if(sh.some(x=>x.phase!=='dock'))z.shipNotDockHere++;
 if(md.length&&sd.length)z.simultaneousDockPhysical++;
 if(me.length&&fe.length)z.simultaneousStrictEmpty++;
 if(md.some(x=>!isEmpty(x))&&fe.length)z.minerAlreadyWorkingFrachterEmpty++;
 if(md.length&&sd.length&&z.bothAtCyrisExamples.length<4)z.bothAtCyrisExamples.push({
   seed,hour,miners:md.map(x=>({id:x.id,auftrag:x.auftrag,ice:x.ladung.eis||0,arbeit:x.arbeit})),
   freighters:sd.map(x=>({id:x.id,auftrag:x.auftrag,ladung:load(x)})),
   bank:{miner:s.owners.npc3.cash,fracht:s.owners.npc1.cash,
     quelle:s.owners.st_cyris.cash,ziel:s.owners.st_aldera.cash}});
 const docking=ships.filter(x=>x.system!=='cyris'&&x.phase==='dock'&&isEmpty(x));
 for(const f of docking){
   const p=paidFlight(s,f);
   if(!p)continue;
   if(!p.validSafe)z.emptyShipUnsafeRoutes++;
   else if(p.wageFundable){
     z.emptyShipPaidRouteCandidates++;
     if(z.safePaidRepositionExamples.length<3)z.safePaidRepositionExamples.push({seed,hour,...p});
   }else z.emptyShipUnaffordableRoutes++;
 }
 // Vertragsangebot ausdrücklich unter den echten bestehenden Bedingungen:
 // teilweise belegte Miner führen hier zu MINER, nicht zu "abwesend".
 if(sd.length&&md.length&&hour%6===0){
   for(const m of md.slice(0,1))for(const f of sd.slice(0,1)){
     if(!isEmpty(f))continue;
     for(const menge of [3,9,13]){
       const q=core.nahrungsmarktangebot(s,R,{
          quelle:'st_cyris',ziel:'st_aldera',miner:m.id,frachter:f.id,
          menge,fabriklohn:3*menge,ersatzFahrten:20});
       z.quoteChecks++;
       if(q.ok){z.quoteOk++;if(!isEmpty(m))z.pricedWindowsWithMinerCargo++;}
       else for(const err of q.fehler)ck(z.reasonCounts,err);
     }
   }
 }
}
function sliceShips(s){
 const ships=Object.values(s.ships);
 return {npc3Miner:ships.filter(x=>x.owner==='npc3'&&x.klasse==='miner').map(x=>({
   id:x.id,system:x.system,phase:x.phase,auftrag:x.auftrag,ware:x.ware,
   eis:x.ladung.eis||0,ladung:load(x)})),
 traders:ships.filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter').map(x=>({
   id:x.id,owner:x.owner,system:x.system,phase:x.phase,
   auftrag:x.auftrag,ladung:load(x)})),
 cash:{npc1:s.owners.npc1.cash,npc2:s.owners.npc2.cash,npc3:s.owners.npc3.cash,
   cyris:s.owners.st_cyris.cash,aldera:s.owners.st_aldera.cash},
 originalFoodSpot:core.preis(s,'st_aldera','nahrung',R)};
}
function run(seed){
 const s=orig(seed),before=core.hash(s);
 const z=counters(),samples={};
 samples[0]=sliceShips(s);
 for(let hour=0;hour<90*24;hour++){
   classify(s,z,hour,seed);
   core.advance(s,60,R);
   if((hour+1)%24===0){
     const day=(hour+1)/24;
     if(SAMPLE_DAYS.has(day))samples[day]=sliceShips(s);
     assert(core.audit(s).ok);assert(core.vertragPruefen(s));
   }
 }
 // Ausschließlich Messung: keine Verträge, keine Einnahme-/Kostenänderung.
 assert.equal(Object.keys(s.vertrag.eintraege).length,0);
 const saved=core.load(core.save(s),undefined,R);
 assert.equal(core.hash(saved),core.hash(s));
 assert.equal(z.hours,2160);
 return {seed,initialHash:before,endHash:core.hash(s),stats:z,
   samples:seed===7||seed===42?samples:{0:samples[0],4:samples[4],14:samples[14],90:samples[90]},
   freightersEnd:count(s,'npc1','frachter')+count(s,'npc2','frachter')};
}
const cases=SEEDS.map(run);
for(const x of cases)console.log('BK9I_DIAG '+JSON.stringify(x));
const fields=['minerNoneInCyris','minerDockHere','minerPartiallyLoadedHere','minerFullHere',
 'minerDockEmptyHere','minerNotDockHere','shipNoneInCyris','shipDockHere',
 'shipPartiallyLoadedHere','shipDockEmptyHere','shipNotDockHere',
 'simultaneousDockPhysical','simultaneousStrictEmpty','minerAlreadyWorkingFrachterEmpty',
 'emptyShipPaidRouteCandidates','emptyShipUnaffordableRoutes','emptyShipUnsafeRoutes',
 'quoteChecks','quoteOk','pricedWindowsWithMinerCargo'];
const total=Object.fromEntries(fields.map(f=>[f,cases.reduce((sum,c)=>sum+c.stats[f],0)]));
const reasons={};
for(const c of cases)for(const [k,n] of Object.entries(c.stats.reasonCounts))
 reasons[k]=(reasons[k]||0)+n;
const summary={seeds:13,days:90,observedHours:13*90*24,totals:total,
  quoteRejectReasons:reasons,
  trueWorldNoManipulation:true,contractCount:0,newMintRule:false,
  allFraightersLost:cases.every(c=>c.freightersEnd===0),
  firstInitial:cases[0].initialHash,
  caveat:'Potential paid reposition counts are snapshots, NOT completed trips or profitable full missions.'};
console.log('BK9I_SUMMARY '+JSON.stringify(summary));
assert.equal(cases.length,13);
assert(total.simultaneousStrictEmpty<=total.simultaneousDockPhysical);
assert(total.minerDockEmptyHere<=total.minerDockHere);
assert(total.shipDockEmptyHere<=total.shipDockHere);
