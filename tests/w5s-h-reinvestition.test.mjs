import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
 html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const prep={...base,w5s:{minerIndustry:true,concurrent:true,
 autoIndustry:true,autoOre:true,autoLeadDays:30,prepaidOrders:true},
 w5o:{...base.w5o,versorgungZiel:-1}};
const natural={...base,w5s:{...prep.w5s,autoLeadDays:2}};
const reinvest={...natural,w5s:{...natural.w5s,retainFleetEarnings:true}};
function audit(s,label){
 const a=api.audit(s);
 assert.equal(a.ok,true,label+' '+JSON.stringify(Object.fromEntries(
 Object.entries(a).filter(([,v])=>v?.ok===false))));
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000,'Weltgeld');
 for(const [ware,l] of Object.entries(s.ledger)){
   const goods=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(goods,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     label+' Warenledger '+ware);
 }
}
function cmd(s,r,type,owner,arg={}){
 const v=api.execute(s,{type,owner,...arg},r);assert.equal(v.ok,true,type+': '+v.reason);
 audit(s,type);
}
function start(seed,intervention){
 const rules=intervention?{...prep,w5s:{...prep.w5s,retainFleetEarnings:true}}:prep;
 const s=api.createW5RState(seed,'full','npc3');
 cmd(s,rules,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 const m=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner'
   &&x.system==='aldera');
 cmd(s,rules,'shipMine','house',{schiff:m.id,ware:'erz'});
 cmd(s,rules,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 for(let i=0;i<15&&(s.w5s?.completed||[]).length<2;i++){
   api.advance(s,60,rules);audit(s,'Anlauf Stunde '+i);
 }
 assert.equal(s.w5s?.completed?.length,2,'beide Hüllen real bezahlt, gebaut und überführt');
 assert.equal(s.w3.geliefert,50,'echte einmalige erste Erzlieferung');
 assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
 return s;
}
function simulate(seed,days,intervention){
 const rules=intervention?reinvest:natural,s=start(seed,intervention),observed={};
 while(s.tick<days*1440){
   api.advance(s,Math.min(1440-s.tick%1440,days*1440-s.tick),rules);
   audit(s,'Seed '+seed+' Tag '+(s.tick/1440)+' Variante '+intervention);
   if([15,30,60,90,365].includes(s.tick/1440)){
     assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
     observed[s.tick/1440]={
       cashMiner:s.owners.npc3.cash,cashCarrier:s.owners.transport.cash,
       household:s.owners.w5n_kunden.cash,
       mineDiv:s.w5o.divMine,carrierDiv:s.w5o.divFracht,
       water:s.w5n.wasserVerbraucht,
       built:s.w5.fertig,sold:s.w5.verkauft+s.w5.minerVerkauft};
   }
 }
 const p=api.w5sKapitalLage(s,rules);
 return {seed,days,variant:intervention?'reinvest':'original',
   hash:api.hash(s),minted:s.minted,water:s.w5n.wasserVerbraucht,
   oreMined:s.ledger.erz.mined,oreDelivered:s.w3.geliefert,
   iceTrips:s.w5n.frachtAbgeschlossen,
   hullsBuilt:s.w5.fertig,hullsSold:s.w5.verkauft+s.w5.minerVerkauft,
   lossesMiner:s.w5r.miner.lost,lossesCarrier:s.w5r.frachter.lost,
   cashMiner:p.miner.free,cashCarrier:p.freight.free,
   shortfallMiner:p.miner.shortfall,shortfallCarrier:p.freight.shortfall,
   dividendMiner:p.paidDividends.miner,dividendCarrier:p.paidDividends.freight,
   dividendStation:p.paidDividends.station,customerCash:s.owners.w5n_kunden.cash,
   contractCash:s.owners.w5s_order_reserved?.cash||0,observed};
}
test('W5s-h: read-only Kapitaldiagnose, keine Rückwirkung und Originalreplay',()=>{
 const s=api.createW5RState(42,'full','npc3');
 const h=api.hash(s),p=api.w5sKapitalLage(s,natural);
 assert.equal(p.miner.target,660);assert.equal(p.freight.target,810);
 assert.equal(api.hash(s),h);
 assert.deepEqual(api.w5sKapitalLage(s,reinvest),p);
 const a=start(42,false),b=start(42,false);
 assert.equal(api.hash(a),api.hash(b));
});
test('W5s-h: 13x90d kontrollierter Vergleich Original/Gewinnrücklage',()=>{
 let improved=0,worsened=0;
 for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
   const original=simulate(seed,90,false),kept=simulate(seed,90,true);
   if(kept.water>original.water)improved++;
   if(kept.water<original.water)worsened++;
   if([42,7].includes(seed)){
     assert.deepEqual(simulate(seed,90,false),original,'Original Doppelreplay');
     assert.deepEqual(simulate(seed,90,true),kept,'Rücklagen Doppelreplay');
   }
   console.log('W5S_H_90D '+JSON.stringify({seed,original,reinvest:kept,
      waterDelta:kept.water-original.water,
      soldDelta:kept.hullsSold-original.hullsSold}));
 }
 console.log('W5S_H_SUMMARY '+JSON.stringify({improved,worsened,
   unchanged:13-improved-worsened}));
});
test('W5s-h: 2x365d kein Mint, Save/Load und vollständige Krisengegenprobe',()=>{
 for(const seed of [42,7]){
   const old=simulate(seed,365,false),next=simulate(seed,365,true);
   assert.equal(old.minted,0);assert.equal(next.minted,0);
   console.log('W5S_H_365D '+JSON.stringify({seed,original:old,reinvest:next,
      waterDelta:next.water-old.water,hullDelta:next.hullsSold-old.hullsSold}));
 }
});
