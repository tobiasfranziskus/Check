import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const r={...base,w5s:{minerIndustry:true,concurrent:true,
 autoIndustry:true,autoOre:true,autoLeadDays:30,
 prepaidOrders:true,retainFleetEarnings:true,autoNpcOre:true}};
const without={...r,w5s:{...r.w5s,autoNpcOre:false}};
function audit(s,tag){
 const a=api.audit(s);
 assert.equal(a.ok,true,tag+' '+JSON.stringify(Object.fromEntries(
   Object.entries(a).filter(([,v])=>v?.ok===false))));
 assert.equal(s.minted,0,'kein neu geschöpftes ISK');
 assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
   s.initialSupply,'alle Welt-ISK erhalten');
 for(const [ware,l]of Object.entries(s.ledger)){
   const qty=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   assert.equal(qty,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     tag+' Ware '+ware);
 }
}
function run(seed,days,enabled=true){
 const s=api.createW5RState(seed,'full','npc3'),rules=enabled?r:without;
 const starting=api.hash(s);
 assert.equal(s.ledger.erz.mined,0);
 assert.equal(s.w3.geliefert,0);
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='house').length,0);
 assert.equal(api.w5sNpcErzStatus(s,without).stage,'inaktiv');
 const plan=api.w5sNpcErzStatus(s,r);
 if(enabled){
   assert.equal(plan.stage,'miner_kaufen','vollfinanzierter NPC-Zweitminer aus eigener Kasse');
   assert.equal(plan.preis,600);
   assert.ok(plan.arbeit>=100);
 }
 assert.equal(api.hash(s),starting,'Nur lesen ist keine Aktion');
 const oreBefore=s.owners.npc3.cash;
 api.advance(s,60,rules);
 audit(s,'NPC-Start');
 if(enabled){
   assert.equal(s.w5r.miner.id && s.ships[s.w5r.miner.id].ware,'eis',
     'bestehender NPC-Miner bleibt im Eisabbau');
   const oreShips=Object.values(s.ships).filter(sh=>sh.owner==='npc3'
     &&sh.klasse==='miner'&&sh.id!==s.w5r.miner.id);
   assert.ok(oreShips.length>=1,'zusätzlicher Miner nicht erfunden');
   assert.ok(s.owners.npc3.cash<oreBefore,'neue Hülle aus echter NPC-Kasse gekauft');
 }else assert.equal(s.ledger.erz.mined,0,'ohne Forschungsflag kein NPC-Erzminer');
 while(s.tick<days*1440){
   const n=Math.min(1440-s.tick%1440,days*1440-s.tick);
   api.advance(s,n,rules);
   audit(s,'Seed '+seed+' Tag '+Math.floor(s.tick/1440));
   if([1,7,15,30,60,90,365].includes(s.tick/1440))
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
 }
 const sold=s.w5h.gekauft,delivered=s.w3.geliefert;
 const oreMiners=Object.values(s.ships).filter(sh=>sh.owner==='npc3'
    &&sh.klasse==='miner'&&sh.id!==s.w5r.miner.id);
 if(enabled&&days>=1){
   assert.ok(s.ledger.erz.mined>=50,'NPC hat aus eigener Arbeit 50 echtes Erz gewonnen');
   assert.ok(sold>=50,'Großhändler bezahlt physische Erzcharge');
   assert.ok(delivered>=50,'W3 liefert automatisch an Nadir');
 }
 if(enabled&&days>=3){
   assert.ok(s.w5.fertig>=1,'real aus NPC-Erz mindestens eine Werfthülle gebaut');
   assert.ok(s.w5.verkauft+s.w5.minerVerkauft>=1,
     'mindestens eine echte Werfthülle gegen NPC-Kaufetat verkauft');
   assert.ok(s.w5s?.completed?.length>=1,
     'mindestens eine Hülle nach bezahltem Flug angekommen');
 }
 assert.equal(Object.values(s.ships).some(sh=>sh.owner==='house'),false,
   'Spieler hat weder Schiff gekauft noch Abbau beauftragt');
 return {seed,days,enabled,hash:api.hash(s),
   mined:s.ledger.erz.mined,bought:sold,delivered,
   startedW3:s.w3.beauftragt,completedW3:s.w3.abgeschlossen,
   oreMiners:oreMiners.length,iceShip:s.w5r.miner.id,
   water:s.w5n.wasserVerbraucht,
   material:s.stations.st_nadir.lager.material,
   minerNadir:s.stations.st_nadir.lager.miner,
   built:s.w5.fertig,sold:s.w5.verkauft+s.w5.minerVerkauft,
   flights:s.w5s?.completed?.length||0,
   contractStage:s.w5s?.contract?.stage||null,
   contracts:s.w5s?.orderHistory?.length||0,
   buyerCash:s.owners.npc3.cash,
   freightCash:s.owners.transport.cash,
   warehouseBlock:api.w5sWerkStatus(s,rules).stage,
   minted:s.minted};
}
test('W5s-i: Seed42/7 startet vollständig ohne Spieler einen bezahlten NPC-Erzminer samt W2/W3-Abrechnung',()=>{
 for(const seed of [42,7]){
   const row=run(seed,3,true);
   assert.ok(row.delivered>=50);
   assert.equal(row.minted,0);
   console.log('W5S_I_START '+JSON.stringify(row));
 }
});
test('W5s-i: Ohne Flag unverändert, Eigentum/Erz nicht magisch erzeugt',()=>{
 const a=run(42,3,false);
 assert.equal(a.mined,0);
 assert.equal(a.delivered,0);
});


test('W5s-i: 13 feste Seeds ×90 Tage mit unabhängigen Tagesaudits und Krisenreplay',()=>{
 for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
   const row=run(seed,90,true);
   assert.ok(row.delivered>=50);
   assert.equal(row.minted,0);
   if(seed===42||seed===7)
     assert.deepEqual(run(seed,90,true),row,
       'vollständiger deterministischer 90-Tage-Replay');
   console.log('W5S_I_90D '+JSON.stringify(row));
 }
});
test('W5s-i: Seed42/7 je 365 Tage ohne Rettung, Minting oder ungebuchte Waren',()=>{
 for(const seed of [42,7]){
   const row=run(seed,365,true);
   assert.equal(row.minted,0);
   console.log('W5S_I_365D '+JSON.stringify(row));
 }
});
