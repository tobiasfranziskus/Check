import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r=api.W5I_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const ship=(s,owner,klasse,sys)=>Object.values(s.ships).find(sh=>
  sh.owner===owner&&sh.klasse===klasse&&(!sys||sh.system===sys));
function check(s,label=''){
 const a=api.audit(s);
 assert.equal(a.ok,true,label+' '+JSON.stringify(Object.fromEntries(Object.entries(a)
   .filter(([k,v])=>v?.ok===false))));
 assert.equal(s.rulesVersion,26,'No new rule/version');
 assert.equal(s.schema,8);
 assert.equal(s.initialSupply,33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 for(const [id,o]of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'cash '+id);
 for(const [ware,l]of Object.entries(s.ledger)){
   const phys=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(phys,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     'independent goods '+ware+' '+label);
 }
 const contracts=Object.values(s.erzpilotVertraege||{})
   .reduce((n,x)=>n+x.menge,0);
 const uncontracted=Object.values(s.ships).reduce((n,x)=>n+
   (s.erzpilotVertraege?.[x.id]?0:(x.ladung.erz||0)),0);
 const open=(s.stations.st_aldera.lager.erz||0)+contracts+uncontracted;
 assert.ok(open<=50&&open>=0,'payable 50-ore pipeline '+label);
 assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
 assert.equal(s.owners.export.cash,20000-10*(s.w5h.bestand+s.w5h.unterwegs));
 // Buyer bank reconciliation includes actual retained worker escrow for NPC3.
 const miner=ship(s,'npc3','miner','aldera');
 const contract=s.erzpilotVertraege?.[miner?.id];
 const reserved=contract?.arbeitsKonto?s.owners[contract.arbeitsKonto]?.cash:0;
 const book=s.stats.konto.npc3;
 assert.ok(Number.isSafeInteger(reserved)&&reserved>=0);
 assert.equal(s.owners.npc3.cash+reserved,2400+book.erloes-book.kosten,
   'NPC3 no unsupported income '+label);
 return a;
}
function command(s,type,owner,options={}){
 const c=api.execute(s,{type,owner,...options},r);
 assert.equal(c.ok,true,JSON.stringify({type,owner,reason:c.reason,tick:s.tick}));
 check(s,type);return c;
}
function refuse(s,type,owner,options={}){
 const before=api.hash(s),c=api.execute(s,{type,owner,...options},r);
 assert.equal(c.ok,false,'unfunded order must fail');
 assert.equal(api.hash(s),before,'rejection must be atomic');
 return c.reason;
}
const advance=(s,n)=>{api.advance(s,n,r);check(s,'tick '+s.tick)};
function freight(s){
 const fr=ship(s,'transport','frachter');
 for(let i=0;i<700&&(s.w5h.bestand<50||fr.phase!=='dock');i++)
   api.advance(s,1,r);
 check(s,'freight ready');
 assert.equal(s.w5h.bestand,50,'50 real units on warehouse');
 command(s,'shipFreight','transport',{schiff:fr.id});
 assert.equal(s.w5h.unterwegs,50);
 advance(s,120);
 assert.equal(s.w5h.unterwegs,0);
}
function factory(s,{buy=true}={}){
 for(let i=0;i<4;i++){
   command(s,'stationRefine','st_nadir',{station:'st_nadir'});
   advance(s,20);
 }
 command(s,'stationBuildParts','house',{station:'st_nadir'});advance(s,64);
 command(s,'stationBuildFighter','house',{station:'st_nadir'});advance(s,32);
 if(buy)command(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
}
function makeUnpaidThird(seed=42){
 const s=api.createW5IState(seed);check(s,'start');
 command(s,'shipWait','npc3',{schiff:ship(s,'npc3','miner','aldera').id});
 command(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 command(s,'shipMine','house',{schiff:ship(s,'house','miner','aldera').id,ware:'erz'});
 command(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 command(s,'shipMine','house',{schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 command(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 advance(s,60);freight(s);factory(s);
 command(s,'shipMine','house',{schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 advance(s,8);
 for(let k=2;k<=6;k++)freight(s);
 factory(s);
 for(let k=7;k<=8;k++)freight(s);
 command(s,'shipMine','house',{schiff:ship(s,'house','miner','nadir').id,ware:'silizium'});
 advance(s,8);
 factory(s,{buy:false});
 assert.equal(s.w3.geliefert,400);
 assert.equal(s.w5b.jaegerFertig,3);
 assert.equal(s.w5b.jaegerVerkauft,2);
 assert.equal(s.owners.npc3.cash,600);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 const reason=refuse(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 assert.match(reason,/Konzern kann 900-ISK-Jaeger nicht bezahlen/);
 return s;
}
function fundThirdByNpcWork(s){
 const npc=ship(s,'npc3','miner','aldera'),house=ship(s,'house','miner','aldera');
 assert.equal(house.auftrag,'foerdern');
 assert.equal(npc.auftrag,'halten');
 // Freiwilliger Haus-Unternehmerentscheid (nicht vom NPC erzwungen).
 command(s,'shipWait','house',{schiff:house.id});
 command(s,'shipMine','npc3',{schiff:npc.id,ware:'erz'});
 const startRevenue=s.stats.konto.npc3.erloes;
 const startCosts=s.stats.konto.npc3.kosten;
 advance(s,80); // Bereits gekaufte House-Charge blockiert bis zur physischen W3-Lieferung.
 assert.equal(s.stats.konto.npc3.erloes,startRevenue);
 freight(s);
 for(let minute=0;minute<60&&s.stats.konto.npc3.erloes===startRevenue;minute++)
   api.advance(s,1,r);
 check(s,'npc genuine ore sale');
 assert.equal(s.stats.konto.npc3.erloes-startRevenue,500);
 assert.equal(s.stats.konto.npc3.kosten-startCosts,100);
 assert.equal(s.owners.npc3.cash,1000);
 assert.ok(s.stats.verkaeufe[npc.id]>=1);
 assert.equal(s.ledger.erz.mined>=450,true);
 const before=s.owners.npc3.cash;
 command(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 assert.equal(before-s.owners.npc3.cash,900);
 assert.equal(s.owners.npc3.cash,100);
 assert.equal(s.w5b.jaegerVerkauft,3);
 assert.equal(s.w5b.jaegerFertig,3);
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 assert.equal(s.ledger.jaeger.produced,3);
 assert.equal(s.ledger.jaeger.consumed,3);
 assert.equal(s.w3.geliefert,450);
 assert.equal(s.owners.house.cash,1764);
 check(s,'third paid and delivered');
 return s;
}
test('W5j: ohne neue Regel oder Preisreform, unveraenderte W5i-Kernversion und alte Saves',()=>{
 assert.equal(r.rulesVersion,26);
 assert.equal(r.economy.waren.jaeger.basis,900);
 assert.equal(r.erzpilot.preis,10);
 const a=api.createW5IState(42),b=api.createW5HState(42);
 assert.equal(api.audit(a).ok,true);
 assert.equal(api.audit(b).ok,true);
 assert.equal(api.hash(api.loadW5I(api.save(a))),api.hash(a));
 assert.throws(()=>api.loadW5I(api.save(b)),/inkompatibel/);
});
test('W5j: erst Verkäuferleistung dann atomarer Kauf des dritten Jägers, alle Konten belegbar',()=>{
 const s=makeUnpaidThird(42);
 const hash=api.hash(s);
 assert.equal(s.stats.konto.npc3.erloes,0);
 assert.equal(api.hash(s),hash);
 fundThirdByNpcWork(s);
 assert.equal(s.stats.konto.npc3.erloes,500);
 assert.equal(s.stats.konto.npc3.kosten,2800);
 assert.equal(2400+500-2800,100);
 assert.equal(s.minted,0);
 assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
 console.log('W5J_DRITTER_KAUF '+JSON.stringify({seed:42,hash:api.hash(s),
   erzGeliefert:s.w3.geliefert,haus:s.owners.house.cash,npc3:s.owners.npc3.cash,
   nadir:s.owners.st_nadir.cash,npcErloes:s.stats.konto.npc3.erloes,
   npcKosten:s.stats.konto.npc3.kosten,fertig:s.w5b.jaegerFertig,
   verkauft:s.w5b.jaegerVerkauft,minted:s.minted}));
});
test('W5j: ohne freiwillige Hauspause keine garantierte NPC3-Kaufkraft',()=>{
 const s=makeUnpaidThird(7),before=api.hash(s);
 assert.equal(s.owners.npc3.cash,600);
 assert.equal(ship(s,'house','miner','aldera').auftrag,'foerdern');
 assert.equal(api.hash(s),before);
 const reason=refuse(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 assert.match(reason,/nicht bezahlen/);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 check(s,'non-forced buyer default');
});
test('W5j: bilanzerhaltende Manipulation an NPC-Arbeit oder Kasse stoppt Save/Audit',()=>{
 const good=fundThirdByNpcWork(makeUnpaidThird(98765)),raw=api.save(good);
 const fake=api.loadW5I(raw);
 fake.owners.npc3.cash+=500;fake.owners.house.cash-=500;
 assert.equal(api.audit(fake).isk.ok,true);
 assert.equal(api.audit(fake).ok,false);
 assert.throws(()=>api.loadW5I(api.save(fake)),/fehlerhaft/);
 const fakeReceipt=api.loadW5I(raw);
 fakeReceipt.stats.konto.npc3.erloes+=500;
 assert.equal(api.audit(fakeReceipt).ok,false);
 assert.throws(()=>api.loadW5I(api.save(fakeReceipt)),/fehlerhaft/);
 assert.equal(api.hash(api.loadW5I(raw)),api.hash(good));
});
test('W5j: 13 Seeds × 90 Tage mit 3 bezahlten Jaegern, unabhängiger Bilanz, Save/Load und Replay',()=>{
 for(const seed of seeds){
   const s=fundThirdByNpcWork(makeUnpaidThird(seed));
   const replay=api.loadW5I(api.save(s));
   for(let day=1;day<=90;day++){
     api.advance(s,1440,r);api.advance(replay,1440,r);
     check(s,'seed '+seed+' day '+day);
     assert.equal(api.hash(s),api.hash(replay),'deterministic '+seed+' day '+day);
   }
   assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
   assert.equal(s.w5b.jaegerFertig,3);
   assert.equal(s.w5b.jaegerVerkauft,3);
   console.log('W5J_90T '+JSON.stringify({seed,hash:api.hash(s),gekauft:3,
     npc3:s.owners.npc3.cash,haus:s.owners.house.cash,
     nadir:s.owners.st_nadir.cash,geliefert:s.w3.geliefert,minted:s.minted}));
 }
});
