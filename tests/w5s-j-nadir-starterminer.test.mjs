import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const withStarter={...base,w5s:{minerIndustry:true,concurrent:true,
  autoIndustry:true,autoOre:true,autoNpcOre:true,autoLeadDays:30,
  prepaidOrders:true,retainFleetEarnings:true,autoStarterMiner:true}};
const withoutStarter={...withStarter,w5s:{...withStarter.w5s,autoStarterMiner:false}};
const assertAudit=(s,tag)=>{
  const a=api.audit(s);
  assert.equal(a.ok,true,tag+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,z])=>z?.ok===false))));
  assert.equal(s.minted,0,'keine zusätzlichen ISK');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),
    s.initialSupply,'Geldmenge muss konstant bleiben');
  for(const [ware,book]of Object.entries(s.ledger)){
    const phys=Object.values(s.stations).reduce(
      (n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce(
      (n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(phys,book.initial+book.mined+book.produced
      +book.imported-book.consumed-book.exported,tag+' Waren: '+ware);
  }
};
function begin(seed,enabled=true){
 const s=api.createW5RState(seed,'full','npc3'),
   r=enabled?withStarter:withoutStarter;
 const before=api.hash(s),p=api.w5sStarterStatus(s,r);
 assert.equal(p.stage,enabled?'starter_kaufen':'inaktiv');
 assert.equal(api.hash(s),before,'Plan darf nichts verändern');
 assert.equal(s.stations.st_nadir.lager.miner,1,'echter Nadir-Anfangsbestand');
 assert.equal(s.w5.minerFertig||0,0);
 api.advance(s,60,r);
 assertAudit(s,'erster bezahlter Tick');
 if(enabled){
   assert.ok(s.w5s?.starterMiner,'belegter echter Nadir-Kauf');
   assert.equal(s.w5s.starterMiner.price,600);
   assert.equal(s.stations.st_nadir.lager.miner,0);
   assert.equal(s.w5.minerFertig||0,0,'kein erfundener Werftneubau');
   assert.equal(s.w5.minerVerkauft||0,0,'kein falscher W5-Verkauf');
   assert.equal(s.w5s.starterMiner.owner,'npc3');
   const id=s.w5s.starterMiner.id,sh=s.ships[id];
   assert.equal(sh.heimat,'nadir');
   assert.equal(sh.owner,'npc3');
   assert.equal(sh.klasse,'miner');
   assert.equal(sh.auftrag,'w5s-ueberfuehrung');
   assert.equal(s.w5s.active?.id,id);
   assert.equal(s.w5s.active?.starter,true);
   assert.equal(s.w5s.allocated,60);
   assert.equal(s.w5s.paid,0);
   assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
     'Save/Load während vollständig vorfinanzierter Reise');
   const hash=api.hash(s);
   const out=api.execute(s,{type:'shipBuy',owner:'npc3',
     station:'st_nadir',klasse:'miner'},r);
   assert.equal(out.ok,false,'kein zweiter Starterkauf');
   assert.equal(api.hash(s),hash,'kein unzulässiger Eingriff');
   s.w5s.starterMiner.price++;
   assert.equal(api.audit(s).ok,false,'falscher Preis im Herkunftsbeleg erkannt');
   assert.throws(()=>api.loadW5R(api.save(s)),
     /bilanz|inkompatibel/i,'manipulierter Starter-Beleg darf nicht laden');
   s.w5s.starterMiner.price--;
   assert.equal(api.hash(s),hash);
 }else assert.equal(s.w5s?.starterMiner,undefined);
 api.advance(s,60,r);
 assertAudit(s,'bezahlte Ankunft');
 if(enabled){
   assert.equal(s.w5s.active,null);
   assert.equal(s.w5s.paid,60);
   assert.equal(s.w5s.completed.filter(x=>x.starter).length,1);
   assert.equal(s.ships[s.w5s.starterMiner.id].system,'aldera');
   assert.equal(s.ships[s.w5s.starterMiner.id].auftrag,'halten');
   assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
 }
 return s;
}
function simulate(seed,days,enabled=true){
 const r=enabled?withStarter:withoutStarter,s=begin(seed,enabled);
 while(s.tick<days*1440){
   api.advance(s,Math.min(1440-s.tick%1440,days*1440-s.tick),r);
   assertAudit(s,'Seed'+seed+' Tag'+Math.floor(s.tick/1440));
   if([15,30,60,90,365].includes(s.tick/1440))
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
 }
 const id=s.w5s?.starterMiner?.id||null;
 const assigned=(s.w5r.assignments||[]).some(x=>x.id===id);
 if(enabled&&days>=15){
   assert.equal(assigned,true,'Starterminer ersetzt nach realem Verlust die alte R32-Eishülle');
   assert.equal(s.w5r.miner.bought,0,'Ersatz ohne erneute Hüllenzahlung');
   assert.ok(s.w5r.losses.some(x=>x.id==='sh001'&&x.type==='miner'));
 }
 assert.ok(Object.values(s.ships).every(x=>x.owner!=='house'),
   'keine Spieler-Schiffskäufe als versteckte Vorbereitung');
 return {seed,days,enabled,hash:api.hash(s),starter:id,assigned,
   water:s.w5n.wasserVerbraucht,freightIce:s.w5n.frachtAbgeschlossen,
   oreMined:s.ledger.erz.mined,oreDelivered:s.w3.geliefert,
   minersBuilt:s.w5.minerFertig||0,minersSold:s.w5.minerVerkauft||0,
   shipsBuilt:s.w5.fertig,shipsSold:s.w5.verkauft+(s.w5.minerVerkauft||0),
   paidTransfer:s.w5s?.paid||0,
   npcCash:s.owners.npc3.cash,carrierCash:s.owners.transport.cash,
   lossMiner:s.w5r.miner.lost,lossFreighter:s.w5r.frachter.lost,
   remainingNadirMiner:s.stations.st_nadir.lager.miner,
   blocker:api.w5sWerkStatus(s,r).stage,minted:s.minted};
}
test('W5s-j: Seed42/7 kaufen und überführen echte Nadir-Starterhülle, eigener Herkunftsaudit',()=>{
 for(const seed of [42,7]){
   const a=simulate(seed,16,true);
   assert.equal(a.assigned,true);
   console.log('W5S_J_START '+JSON.stringify(a));
 }
});
test('W5s-j: ohne Option kein Kauf, keine zusätzliche Hülle, ursprüngliche Referenzlogik',()=>{
 for(const seed of [42,7]){
   const x=simulate(seed,3,false);
   assert.equal(x.starter,null);
   assert.equal(x.remainingNadirMiner,1);
 }
});
test('W5s-j: 13 feste Seeds ×90 Tage mit unabhängigem ISK-/Waren-Audit und Doppelreplay',()=>{
 for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
   const a=simulate(seed,90,true);
   if(seed===42||seed===7)
     assert.deepEqual(simulate(seed,90,true),a,'90 Tage zweimal deterministisch');
   console.log('W5S_J_90D '+JSON.stringify(a));
 }
});
test('W5s-j: 2 ×365 Tage ohne Gratisrettung, Save-Verlust oder ISK-Mint',()=>{
 for(const seed of [42,7]){
   const a=simulate(seed,365,true);
   assert.equal(a.minted,0);
   console.log('W5S_J_365D '+JSON.stringify(a));
 }
});
