import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api,w5q}=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn {api:m_core_index,w5q:m_core_w5q};')();
const rules=api.W5Q_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function fullAudit(s,label=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+': '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,x])=>x?.ok===false))));
  assert.equal(s.rulesVersion,31);assert.equal(s.schema,8);
  const sum=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  assert.equal(sum,s.initialSupply+s.minted-s.burned,label+' exact ISK conservation');
  assert.equal(sum,33000+s.w5q.minted,label+' original money + one mint');
  assert.equal(s.burned,0);
  for(const [id,o] of Object.entries(s.owners))
    assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,label+' cash '+id);
  for(const [ware,l] of Object.entries(s.ledger)){
    const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
    const ledger=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
    assert.equal(physical,ledger,label+' goods '+ware);
  }
  assert.equal(a.w5n.ok,true,label+' W5n original audit');
  assert.equal(a.w5o.ok,true,label+' W5o original audit');
  assert.equal(a.w5q.ok,true,label+' W5q provenance and cap');
  return a;
}
const make=(mode='off',rate=0,dayCap=0,total=0,seed=42,owner='npc3')=>
  api.createW5QState(seed,'npcSave',owner,mode,rate,dayCap,total);
const run=(s,days)=>{
  for(let i=0;i<days;i++){
    api.advance(s,1440,rules);
    fullAudit(s,'day '+(i+1));
    if([30,60,90,180,365].includes(i+1))
      assert.equal(api.hash(api.loadW5Q(api.save(s))),api.hash(s));
  }
  return s;
};
test('W5q R31: default OFF; R30 and all prior save versions unaffected',()=>{
 const old=api.createW5OState(42,'npcSave','npc3');
 const oldHash=api.hash(old);
 assert.equal(api.audit(old).ok,true);
 assert.equal(api.hash(api.loadW5O(api.save(old))),oldHash);
 const now=make();fullAudit(now,'initial');
 assert.equal(w5q.exportieren(now,rules),0,'nothing to export at new-world creation');
 assert.equal(now.minted,0);assert.equal(now.ledger.wasser.exported,0);
 assert.throws(()=>api.loadW5O(api.save(now)),/inkompatibel/);
 assert.throws(()=>api.loadW5Q(api.save(old)),/inkompatibel/);
 const baseline=run(now,90);
 assert.equal(baseline.w5n.wasserVerbraucht,789);
 assert.equal(baseline.w5n.knappheitsStunden,1766);
 assert.equal(baseline.minted,0);
 assert.equal(baseline.owners.w5n_kunden.cash,9);
 assert.equal(baseline.w5q.exported,0);
 assert.equal(api.hash(old),oldHash);
});
test('W5q: one physically exported 10-water batch mints exactly once, credited to station',()=>{
 const s=make('station',14,140,3500);
 fullAudit(s,'before');
 api.advance(s,1440,rules);
 fullAudit(s,'after first day');
 assert.equal(s.w5q.events.length,1);
 const event=s.w5q.events[0];
 assert.deepEqual(event,{tick:1440,day:1,units:10,amount:140,mode:'station'});
 assert.equal(s.ledger.wasser.exported,10);
 assert.equal(s.w5q.exported,10);
 assert.equal(s.minted,140);
 assert.equal(s.w5q.minted,140);
 assert.equal(s.w5q.stationNet,140);
 assert.equal(s.w5q.payout,0);
 assert.equal(s.initialSupply,33000);
 const former=api.hash(s);
 assert.equal(w5q.exportieren(s,rules),0,'no new physical copy / no second daily payout');
 assert.equal(api.hash(s),former);
 assert.equal(api.hash(api.loadW5Q(api.save(s))),former);
});
test('W5q: station vs household recipient; only one world mint and auditable transfer',()=>{
 const st=run(make('station',14,140,3500),90);
 const ha=run(make('household',14,140,3500),90);
 assert.equal(st.w5q.minted,3500);
 assert.equal(ha.w5q.minted,3500);
 assert.equal(st.w5q.exported,250);
 assert.equal(ha.w5q.exported,250);
 assert.equal(st.w5q.stationNet,3500);
 assert.equal(ha.w5q.stationNet,0);
 assert.equal(ha.w5q.payout,3500);
 assert.equal(ha.owners.house.cash,3000);
 assert.equal(st.owners.house.cash,3000);
 assert.equal(st.w5n.wasserVerbraucht,1533);
 assert.equal(ha.w5n.wasserVerbraucht,1872);
 assert.ok(ha.w5n.wasserVerbraucht>st.w5n.wasserVerbraucht,
   'money reaching consuming households supports more paid sales');
 assert.equal(st.ledger.wasser.exported,250);
 assert.equal(ha.ledger.wasser.exported,250);
 assert.equal(ha.w5q.events.length,25,'daily and cumulative caps');
 console.log('W5Q_90 '+JSON.stringify({station:api.pilotW5QStand(st),
   household:api.pilotW5QStand(ha)}));
});
test('W5q: rate, daily and total cap are independent, no event on shortages',()=>{
 for(const [mode,rate,day,total] of [
   ['off',7,70,1400],['station',0,0,0],
   ['household',17,140,1400],['household',14,1000,1400],
   ['station',14,140,1401],['household',14,0,1400]]){
   assert.throws(()=>make(mode,rate,day,total),/Testmatrix/);
 }
 const low=run(make('household',7,70,3500),90);
 assert.equal(low.w5q.exported,348,'production and demand cap actual physical exports');
 assert.equal(low.w5q.minted,2436);
 assert.equal(low.ledger.wasser.exported,348);
 assert.ok(low.w5q.events.every(e=>e.amount<=70));
 assert.equal(low.w5q.payout,low.minted);
 const before=api.hash(low);
 assert.equal(w5q.exportieren(low,rules),0,'spent physical water or day gate');
 assert.equal(api.hash(low),before);
});
test('W5q: independent anti-forgery rejects duplicate export, counterfeited goods and mint',()=>{
 const s=run(make('household',14,140,3500),25);
 const hash=api.hash(s),saved=api.save(s);
 function falsify(modify){
   const copy=api.loadW5Q(saved);
   modify(copy);
   assert.equal(api.audit(copy).ok,false,'forgery must fail');
   assert.throws(()=>api.loadW5Q(api.save(copy)),/fehlerhaft/);
   assert.equal(api.hash(s),hash,'unchanged good save');
 }
 falsify(x=>x.minted++);
 falsify(x=>x.stations.st_nadir.lager.wasser++);
 falsify(x=>x.ledger.wasser.exported++);
 falsify(x=>x.w5q.exported++);
 falsify(x=>x.w5q.minted++);
 falsify(x=>x.w5q.payout++);
 falsify(x=>x.w5q.events[0].units++);
 falsify(x=>x.w5q.events[0].amount+=14);
 falsify(x=>x.w5q.events.push({...x.w5q.events[0]}));
 falsify(x=>x.w5q.events[0].tick+=1);
 falsify(x=>x.w5q.events[0].mode='station');
 falsify(x=>x.w5q.lastExportDay--);
 falsify(x=>x.w5q.rate=14.5);
});
test('W5q: 365d finite export caps improve liquidity but cannot guarantee endless consumption',()=>{
 const cases=[
   {mode:'off',rate:0,daily:0,total:0,water:789,mint:0,last:17,hash:'a70646bfe8bbc428'},
   {mode:'station',rate:14,daily:140,total:3500,water:1533,mint:3500,last:33,hash:'5198e94f7e86806a'},
   {mode:'household',rate:14,daily:140,total:3500,water:1872,mint:3500,last:40,hash:'d3cc977cfebdf7c5'},
   {mode:'household',rate:14,daily:140,total:7000,water:2775,mint:7000,last:58,hash:'5d2bb4b20ae305c2'}
 ];
 for(const c of cases){
   const s=make(c.mode,c.rate,c.daily,c.total);
   let lastSaleDay=0,prev=0;
   for(let day=1;day<=365;day++){
     api.advance(s,1440,rules);
     fullAudit(s,'365d '+c.mode+' day'+day);
     if(s.w5n.wasserVerbraucht>prev)prev=s.w5n.wasserVerbraucht,lastSaleDay=day;
   }
   assert.equal(s.w5n.wasserVerbraucht,c.water);
   assert.equal(s.minted,c.mint);
   assert.equal(lastSaleDay,c.last);
   assert.equal(api.hash(s),c.hash);
   assert.equal(api.hash(api.loadW5Q(api.save(s))),api.hash(s));
   console.log('W5Q_365 '+JSON.stringify({mode:c.mode,
     rate:c.rate,daily:c.daily,total:c.total,hash:c.hash,
     endWater:c.water,emitted:c.mint,lastPaidDay:c.last}));
 }
});
test('W5q: player can save freely; same external rules do not silently confiscate profits',()=>{
 const candidates=[
   {mode:'off',price:0,day:0,total:0,sold:733,exported:0,minted:0,house:4750,hash:'6483d63b900ace13'},
   {mode:'station',price:14,day:140,total:3500,sold:1479,exported:250,minted:3500,house:7750,hash:'42348ff2ff5a98fe'},
   {mode:'household',price:14,day:140,total:3500,sold:1780,exported:250,minted:3500,house:8650,hash:'8a780200173b3422'},
   {mode:'household',price:14,day:140,total:7000,sold:2722,exported:500,minted:7000,house:12250,hash:'b041133444987235'}
 ];
 for(const c of candidates){
   const s=api.createW5QState(42,'full','house',c.mode,c.price,c.day,c.total);
   run(s,90);
   assert.equal(s.w5n.wasserVerbraucht,c.sold);
   assert.equal(s.w5q.exported,c.exported);
   assert.equal(s.minted,c.minted);
   assert.equal(s.owners.house.cash,c.house);
   assert.equal(s.w5o.divMine,0,'player miner profit retained in player cash');
   assert.ok(s.w5n.knappheitsStunden>0,'no artificial guarantee for player saving');
   assert.equal(api.hash(s),c.hash);
 }
});
test('W5q: 13 seeds x 90d identical replay, independent goods/cash and 30/60/90 saves',()=>{
 for(const seed of seeds){
   const a=make('household',14,140,3500,seed);
   const b=make('household',14,140,3500,seed);
   for(let day=1;day<=90;day++){
     api.advance(a,1440,rules);api.advance(b,1440,rules);
     fullAudit(a,'seed '+seed+' day '+day);
     assert.equal(api.hash(a),api.hash(b),'seed '+seed+' day '+day+' deterministic replay');
     if(day%30===0)assert.equal(api.hash(api.loadW5Q(api.save(a))),api.hash(a));
   }
   assert.equal(a.w5n.wasserVerbraucht,1872);
   assert.equal(a.minted,3500);
   assert.equal(a.w5q.events.length,25);
   console.log('W5Q_90_SEED '+JSON.stringify({seed,hash:api.hash(a),
     exports:a.w5q.exported,minted:a.minted,water:a.w5n.wasserVerbraucht}));
 }
});
