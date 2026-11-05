import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5I_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const ship=(s,owner,klasse,system)=>Object.values(s.ships).find(x=>
  x.owner===owner&&x.klasse===klasse&&(!system||x.system===system));
function independentlyAudit(s,label=''){
 const audit=api.audit(s);
 assert.equal(audit.ok,true,label+' '+JSON.stringify(Object.fromEntries(
   Object.entries(audit).filter(([,v])=>v?.ok===false))));
 assert.equal(s.schema,8);assert.equal(s.rulesVersion,26);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(s.initialSupply,33000);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000,
   'ISK total '+label);
 for(const [id,o]of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'cash '+id+' '+label);
 for(const [ware,book]of Object.entries(s.ledger)){
   const physical=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(physical,book.initial+book.mined+book.produced
     +book.imported-book.consumed-book.exported,'physical '+ware+' '+label);
 }
 const contracts=s.erzpilotVertraege||{};
 const reserved=Object.values(contracts).reduce((n,x)=>n+x.menge,0);
 const onShips=Object.values(s.ships).reduce((n,sh)=>
   n+(contracts[sh.id]?0:(sh.ladung.erz||0)),0);
 const open=s.stations.st_aldera.lager.erz+reserved+onShips;
 assert.ok(open>=0&&open<=50,'W3 pipeline cap '+label);
 assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
 assert.equal(s.owners.export.cash,20000-10*(s.w5h.bestand+s.w5h.unterwegs));
 for(const owner of ['npc3','house']){
   const s0=rules.owners.find(o=>o.id===owner).cash,book=s.stats.konto[owner];
   const bound=Object.entries(contracts).reduce((sum,[id,v])=>
     sum+(s.ships[id]?.owner===owner?s.owners[v.arbeitsKonto]?.cash||0:0),0);
   const extra=owner==='house'?(s.owners.w5b_silizium_arbeit?.cash||0)
     +(s.owners.w5b_fabrik_arbeit?.cash||0)
     +(s.owners.w5f_laser_arbeit?.cash||0):0;
   assert.equal(s.owners[owner].cash+bound+extra,
     s0+book.erloes-book.kosten,'independent owner reconciliation '+owner+' '+label);
 }
 return audit;
}
const success=(s,type,owner,data={})=>{
 const response=api.execute(s,{type,owner,...data},rules);
 assert.equal(response.ok,true,type+'/'+owner+': '+response.reason+' @'+s.tick);
 independentlyAudit(s,type);return response;
};
function refused(s,type,owner,data={}){
 const before=api.hash(s),r=api.execute(s,{type,owner,...data},rules);
 assert.equal(r.ok,false,'unfunded command must fail '+type);
 assert.equal(api.hash(s),before,'refusal cannot change money or goods');
 return r.reason;
}
const step=(s,n)=>{api.advance(s,n,rules);independentlyAudit(s,'tick '+s.tick)};
function freight(s){
 const carrier=ship(s,'transport','frachter');
 for(let n=0;n<650&&(s.w5h.bestand<50||carrier.phase!=='dock');n++)
   api.advance(s,1,rules);
 independentlyAudit(s,'before freight');
 assert.equal(s.w5h.bestand,50,'exactly one funded export lot');
 success(s,'shipFreight','transport',{schiff:carrier.id});
 assert.equal(s.w5h.unterwegs,50);
 step(s,120);
 assert.equal(s.w3.auftrag,null);
}
function factoryAndPurchase(s){
 for(let i=0;i<4;i++){
   success(s,'stationRefine','st_nadir',{station:'st_nadir'});step(s,20);
 }
 success(s,'stationBuildParts','house',{station:'st_nadir'});step(s,64);
 success(s,'stationBuildFighter','house',{station:'st_nadir'});step(s,32);
 success(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 independentlyAudit(s,'paid fighter');
}
function independentNpcThenHouse(seed){
 const s=api.createW5IState(seed);independentlyAudit(s,'initial');
 const npc=ship(s,'npc3','miner','aldera');
 assert.equal(npc.auftrag,'foerdern','NPC3 begins autonomously');
 let housePausedCommands=0,npcMineCommands=0;
 // House does not own an Aldera miner yet; no pause, no NPC work command.
 success(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 success(s,'shipMine','house',{schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 success(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 step(s,60);
 assert.equal(s.stats.verkaeufe[npc.id],1);
 assert.equal(s.stats.konto.npc3.erloes,500);
 freight(s);
 // NPC3's second mining job is automatically reactivated by the existing W2 core
 // after a real funded shipment, without any command from House or the test.
 assert.equal(s.stats.verkaeufe[npc.id],2);
 assert.equal(s.stats.konto.npc3.erloes,1000);
 assert.equal(s.owners.npc3.cash,3200);
 assert.equal(s.w3.geliefert,50);
 // House independently enters the market only when it chooses to invest.
 success(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 const houseMiner=ship(s,'house','miner','aldera');
 success(s,'shipMine','house',{schiff:houseMiner.id,ware:'erz'});
 assert.equal(houseMiner.auftrag,'foerdern');
 freight(s);factoryAndPurchase(s);
 success(s,'shipMine','house',
   {schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 step(s,8);
 for(let n=3;n<=6;n++)freight(s);
 factoryAndPurchase(s);
 for(let n=7;n<=8;n++)freight(s);
 success(s,'shipMine','house',
   {schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 step(s,8);
 factoryAndPurchase(s);
 assert.equal(housePausedCommands,0);
 assert.equal(npcMineCommands,0);
 assert.equal(houseMiner.auftrag,'foerdern','House was never stopped');
 assert.equal(s.stats.verkaeufe[npc.id],2,'two autonomous NPC3 ore receipts');
 assert.equal(s.stats.verkaeufe[houseMiner.id],7,'seven paid player-owned sales');
 assert.equal(s.w3.geliefert,400,'eight physically delivered ore shipments');
 assert.equal(s.w5b.jaegerFertig,3);
 assert.equal(s.w5b.jaegerVerkauft,3);
 assert.equal(s.ledger.jaeger.produced,3);
 assert.equal(s.ledger.jaeger.consumed,3);
 assert.equal(s.owners.npc3.cash,500);
 assert.equal(s.owners.house.cash,964);
 assert.equal(s.owners.st_nadir.cash,2940);
 assert.equal(s.minted,0);
 independentlyAudit(s,'third autonomously financed fighter');
 return s;
}
test('W5k: no product rule, new emission, forced pause or implicit account',()=>{
 assert.equal(rules.rulesVersion,26);assert.equal(rules.schema,8);
 assert.equal(rules.w5i.maxOffen,50);
 assert.equal(rules.erzpilot.preis,10);
 assert.equal(rules.economy.waren.jaeger.basis,900);
 assert.equal(rules.w3.fracht,50);
 assert.equal(rules.w5d.maxChargen,8);
 const normal=api.createW5IState(42);
 independentlyAudit(normal);
 assert.equal(api.hash(api.loadW5I(api.save(normal))),api.hash(normal));
 assert.throws(()=>api.loadW5I(api.save(api.createW5HState(42))),/inkompatibel/);
});
test('W5k: two independent NPC3 mining sales and three paid fighters without House miner pause',()=>{
 const s=independentNpcThenHouse(42);
 assert.equal(s.stats.konto.npc3.erloes,1000);
 assert.equal(s.stats.konto.npc3.kosten,3500); // miner600 + 3 fighters2700 + mining200
 assert.equal(3000+1000-3500,500);
 assert.equal(s.ledger.erz.mined>=450,true);
 assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
 const before=api.hash(s);
 const reason=refused(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 assert.match(reason,/Konzern kann 900-ISK-Jaeger nicht bezahlen|kein Komplettschiff auf Lager|nicht verfuegbar/i);
 assert.equal(api.hash(s),before);
 console.log('W5K_KONKURRENZ '+JSON.stringify({seed:42,
   hash:api.hash(s),npcSales:2,houseSales:7,delivered:s.w3.geliefert,
   built:s.w5b.jaegerFertig,sold:s.w5b.jaegerVerkauft,
   house:s.owners.house.cash,npc:s.owners.npc3.cash,
   nadir:s.owners.st_nadir.cash,minted:s.minted}));
});
test('W5k: entering the manufacturing stage without a paid House sale cannot print budget',()=>{
 const s=api.createW5IState(42),npc=ship(s,'npc3','miner','aldera');
 success(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 success(s,'shipMine','house',{schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 success(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 step(s,60);freight(s);freight(s);
 assert.equal(s.stats.verkaeufe[npc.id],3);
 success(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 success(s,'shipMine','house',{schiff:ship(s,'house','miner','aldera').id,ware:'erz'});
 for(let i=0;i<4;i++){
   success(s,'stationRefine','st_nadir',{station:'st_nadir'});step(s,20);
 }
 success(s,'stationBuildParts','house',{station:'st_nadir'});step(s,64);
 const before=api.hash(s);
 const reason=refused(s,'stationBuildFighter','house',{station:'st_nadir'});
 assert.match(reason,/Hersteller kann Rohstoffe und alle Lohnminuten nicht bezahlen/);
 assert.equal(api.hash(s),before);
 independentlyAudit(s,'unprofitable early factory');
});
test('W5k: 13 seeds x 90 days, paid third fighter and two autonomous NPC revenues with daily audit and deterministic Save/Load',()=>{
 for(const seed of seeds){
   const a=independentNpcThenHouse(seed),b=api.loadW5I(api.save(a));
   for(let day=1;day<=90;day++){
     api.advance(a,1440,rules);api.advance(b,1440,rules);
     independentlyAudit(a,'seed '+seed+' day '+day);
     assert.equal(api.hash(a),api.hash(b),'replay '+seed+'/'+day);
   }
   assert.equal(api.hash(api.loadW5I(api.save(a))),api.hash(a));
   assert.equal(a.stats.konto.npc3.erloes,1000);
   assert.equal(a.w5b.jaegerVerkauft,3);
   assert.equal(a.minted,0);
   console.log('W5K_90T '+JSON.stringify({seed,hash:api.hash(a),
     npcIncome:a.stats.konto.npc3.erloes,
     npc3:a.owners.npc3.cash,house:a.owners.house.cash,
     delivered:a.w3.geliefert,fighters:a.w5b.jaegerVerkauft,minted:a.minted}));
 }
});
