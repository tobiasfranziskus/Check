// B-K9e – realer Regel15-Produktvertrags-Pilot in vollständigen Original-Welten.
// Zwei echte Marktgrößen gegen exakt gleiche Ausgangswelt ohne Vertrag.
// Keine Produktänderung/Emission/Gratisrettung. Ausführbar nur als Analyse.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const next={...rules,schema:9,rulesVersion:15};
function money(s){
 const cash=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 const tied=Object.values(s.vertrag.eintraege).reduce((n,c)=>n+c.escrow+c.fee+c.lohn+c.huelle,0);
 assert.equal(cash+tied,s.initialSupply+s.minted-s.burned,'ISK: gesperrt + liquide');
 return {cash,tied};
}
function goods(s){
 const phys={};
 for(const st of Object.values(s.stations))
  for(const [w,n] of Object.entries(st.lager)){assert(n>=0);phys[w]=(phys[w]||0)+n;}
 for(const sh of Object.values(s.ships))
  for(const [w,n] of Object.entries(sh.ladung)){assert(n>=0);phys[w]=(phys[w]||0)+n;}
 for(const [w,l] of Object.entries(s.ledger))
  assert.equal(phys[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w);
}
function check(s){
 assert(core.audit(s).ok);assert(core.vertragPruefen(s));money(s);goods(s);
}
function sum(obj){return Object.values(obj).reduce((a,b)=>a+b,0);}
function snapshot(s,day){
 const t=Object.values(s.vertrag.eintraege);
 return {day,player:s.owners.house.cash,buyer:s.owners.st_aldera.cash,
  source:s.owners.st_cyris.cash,trader:s.owners.npc1.cash,
  ships:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&
      ['npc1','npc2'].includes(x.owner)).length,
  foodMissing:sum(Object.fromEntries(Object.entries(s.stats.mangel).map(([id,x])=>[id,x.nahrung||0]))),
  shortages:sum(Object.fromEntries(Object.entries(s.stats.mangel).map(([id,x])=>[id,sum(x)]))),
  money:money(s),minted:s.minted,burned:s.burned,
  contracts:t.length,contract:t[0]&&{id:t[0].id,status:t[0].status,lohn:t[0].lohn,
      lohnBezahlt:t[0].lohnBezahlt,huelle:t[0].huelle,escrow:t[0].escrow}};
}
function initialize(){
 let s=core.createState(7,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 core.advance(s,4*1440,rules);
 s=core.load(core.save(s),undefined,next);
 const miner=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.ware==='eis');
 const trader=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter');
 assert(miner&&trader);
 // Bedingtes PILOT-Setup: beide vorhandenen Hüllen stehen ab Tag4
 // probeweise am Original-Quellmarkt. Andere Schiffe handeln weiter.
 // Die bereits vorhandene Fracht wird ohne Ersatzgeld ordnungsgemäß
 // als Warenverbrauch ausgebucht. Identisch in Kontroll- und Testwelt.
 for(const sh of [miner,trader]){
   for(const [ware,n] of Object.entries(sh.ladung))s.ledger[ware].consumed+=n;
   sh.ladung={};sh.system='cyris';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;
   sh.arbeit=0;sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';
   sh.ware=sh.klasse==='miner'?'eis':null;
 }
 check(s);
 return {s,minerId:miner.id,traderId:trader.id};
}
function run(q,days=90){
 const {s,minerId,traderId}=initialize();
 const original=core.save(s);
 const source=core.load(original,undefined,next);
 assert.equal(core.hash(s),core.hash(source),'identisches Vertrag-vs-Kontrolle-Setup');
 let id=null;
 if(q){
   const contract={quelle:'st_cyris',ziel:'st_aldera',miner:minerId,
      frachter:traderId,menge:q,fabriklohn:q*3,ersatzFahrten:20};
   const quote=core.nahrungsmarktangebot(s,next,contract);
   assert(quote.ok,'wirklicher zahlungsfähiger Markt am Tag4: '+JSON.stringify(quote.fehler));
   assert.equal(quote.endpreis,53);
   id=core.vertragStarten(s,contract,next);
   assert(id);
 }
 check(s);
 const marked=[0,1,3,7,14,30,60,90];
 const trace=[snapshot(s,0)];
 let audits=0,saveLoads=0;
 for(let day=1;day<=days;day++){
   for(let hour=0;hour<24;hour++){
     core.advance(s,60,next);
     check(s);audits++;
   }
   if(marked.includes(day))trace.push(snapshot(s,day));
   if([1,7,14,30,90].includes(day)){
     const loaded=core.load(core.save(s),undefined,next);
     assert.equal(core.hash(s),core.hash(loaded),'hash nach gespeicherten Verträgen');
     saveLoads++;
   }
 }
 const c=id?s.vertrag.eintraege[id]:null;
 if(c){
   assert(['erfuellt','verloren','storniert'].includes(c.status),
     'Vertrag darf nach 90 Tagen keine ewige blockierte Ware halten');
   if(c.status==='erfuellt'){
      assert.equal(c.escrow,0);assert.equal(c.fee,0);assert.equal(c.lohn,0);
      assert(c.lohnBezahlt>0);assert(c.huelle>0);
   }
 }
 check(s);
 return {scenario:q?'contract_'+q:'control',pilotSeed:7,forcedSameShips:true,
   days,audits,saveLoads,hash:core.hash(s),trace,
   end:trace.at(-1),status:c?.status||null,
   note:'Exakt ein manueller Pilotauftrag, keine NPC-Automatik; Start aus Lagerbestand, nicht neuer zertifizierter Produktion'};
}
const control=run(0),small=run(9),large=run(13);
const again=run(13);
assert.equal(large.hash,again.hash);
assert.deepEqual(large.trace,again.trace);
for(const x of [control,small,large]) {
 assert.equal(x.audits,90*24);
 assert.equal(x.saveLoads,5);
 console.log('BK9E_90D_WELT '+JSON.stringify(x));
}
console.log('BK9E_REPLAY '+JSON.stringify({sameHash:true,hash:large.hash,seed:7}));
console.log('BK9E_DONE '+JSON.stringify({realWorlds:4,days:90,
  hourlyCoreAndIndependentAudits:4*90*24,saveLoadRoundTrips:4*5,
  scenarios:['matched control','real-priced 9 food','real-priced 13 food','deterministic 13-food replay'],
  newISMRule:false,activeContractsOnlyOnePerWorld:true,
  warning:'No miner-produced cargo contract, no 13-seed whole-economy success claimed.'}));
