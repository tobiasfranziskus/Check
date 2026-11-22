// Independent M4-U3 regression: the second job is playable AFTER one paid ice round.
// No new game rules, data mutations outside original J8 commands, or second simulation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const W5ac=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');
function start(){
 const j=J8.erstellen();
 j.starten195(W5ac.create(42,'private195').export(),true);
 return j;
}
function action(j,id){
 const r=j.ausfuehren(id);
 assert.equal(r.ok,true,id+': '+r.reason);
}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz();
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 assert.deepEqual(pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 return s;
}
test('M4-U3: funded W1 ore from second owned miner is playable after an actual paid F4 ice round',()=>{
 const j=start();
 for(const cmd of ['buy-st_aldera-miner','buy-st_aldera-frachter','ice-sh002']) action(j,cmd);
 j.weiterspielen(60);j.weiterspielen(60);
 action(j,'freight-sh003');
 j.weiterspielen(60);j.weiterspielen(60);
 assert.equal(j.ansicht().hash,'4e86f3fc27a6005a','existing first-round reference must remain intact');
 const before=audit(j);
 assert.equal(before.kanon.spielerFrachten.gebuehr,240);
 assert.equal(before.kanon.spielerFrachten.lohn,120);
 assert.equal(before.w3.abgeschlossen,0);
 assert.ok(before.owners.st_aldera.cash>=500,'real original Aldera purchasing cash');
 assert.equal(j.angebote().some(q=>q.id==='ore-sh002'),false,
   'existing ice duty cannot be double-booked as ore');
 action(j,'buy-st_aldera-miner');
 const s=audit(j);
 const second=Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='miner')
   .find(sh=>sh.id!=='sh002');
 assert.ok(second,'second owned real miner purchased');
 const quote=j.angebote().find(q=>q.id==='ore-'+second.id);
 assert.equal(quote?.ok,true,'real funded W1 alternative must be offered: '+quote?.reason);
 const oldRevenue=s.stats.konto.house.erloes;
 action(j,'ore-'+second.id);
 assert.equal(j.zustandReferenz().kanon.pendel[second.id]?.ware,'erz');
 assert.equal(j.ausfuehren('ore-'+second.id).ok,false,'no duplicate');
 let end;
 for(let i=0;i<16;i++){
   j.weiterspielen(60);end=audit(j);
   if(end.stats.konto.house.erloes>=oldRevenue+500 && (end.stats.verkaeufe?.[second.id]||0)>=1)break;
 }
 assert.ok(end.stats.konto.house.erloes>=oldRevenue+500,'a real additional 500 ISK sale must occur');
 assert.ok((end.stats.verkaeufe?.[second.id]||0)>=1,'the purchased ore miner, not incidental ice sales, must receive an original station purchase');
 assert.equal(end.w3.abgeschlossen,0,'local W1 is not W3 shipping');
 assert.equal(end.ships[second.id].owner,'house');
 const json=j.exportieren(),copy=J8.erstellen();
 copy.oeffnen204(json,true);
 assert.equal(copy.exportieren(),json);
 assert.equal(copy.ansicht().hash,j.ansicht().hash);
 console.log('M4_U3_AFTER_ICE',JSON.stringify({
   minute:end.tick,houseRevenueGain:end.stats.konto.house.erloes-oldRevenue,
   alderaBefore:before.owners.st_aldera.cash,oreMinerSales:end.stats.verkaeufe[second.id],hash:j.ansicht().hash
 }));
});
