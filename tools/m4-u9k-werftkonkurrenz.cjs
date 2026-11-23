/* Research only: compare existing house purchase strategy against voluntary
 * deferral of the last Nadir hull during an NPC replacement shortage.
 * No restrictions on the game market, no new NPC purchase or money.
 */
'use strict';
const assert=require('node:assert/strict');
const {simulation}=require('./m4-u9d-langzeit.cjs');
const {restAktivMinuten}=require('./m4-u9-vertragsvorsorge.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
function lauf(days,mode){
 assert.ok(['control','defer'].includes(mode));
 const sz=SZENARIEN.find(x=>x.id==='S02');
 const gates={},windows=[],events=[],pending=new Map();
 let previous=null,lastFreight=null,zeroSince=null,end=null;
 const add=(obj,key)=>obj[key]=(obj[key]||0)+1;
 const project=(w,s)=>{
  const ships=Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&['transport','house'].includes(sh.owner));
  const live=ships.filter(sh=>!w.stillgelegt(s,sh.id)).map(sh=>({id:sh.id,owner:sh.owner,system:sh.system,rest:restAktivMinuten(w,s,sh.id)}));
  return {tick:s.tick,eis:s.w5n.frachtAbgeschlossen,erz:s.w3.abgeschlossen,live,
   bought:ships.length,stock:s.stations.st_nadir.lager.frachter||0,alderaErz:s.stations.st_aldera.lager.erz||0,
   nadir:{...s.stations.st_nadir.lager},cash:Object.fromEntries(['house','transport','werft_extern','npc3'].map(id=>[id,s.owners[id].cash]))};
 };
 const report=simulation(sz,days,42,'vollabnahme',60,{
  weltFabrik:p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),
  vorDisposition(w,s){
   const x=project(w,s);
   if(!previous||x.eis!==previous.eis||x.erz!==previous.erz)lastFreight=x;
   if(!x.live.length){if(zeroSince===null)zeroSince=s.tick;}else zeroSince=null;
   if(previous&&x.bought!==previous.bought){
    events.push(x);if(events.length>24)events.shift();
   }
   previous=x;
   for(const [tick,p] of pending){
    const newShips=Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&!p.ids.has(sh.id));
    if(newShips.length){
     const purchase=newShips.map(sh=>({id:sh.id,owner:sh.owner,home:sh.heimat}));
     add(gates,purchase.some(sh=>sh.owner==='transport')?'later_npc_purchase':'later_other_purchase');
     if(windows.length<40)windows.push({tick,observed:s.tick,event:'later_purchase',purchase});
     pending.delete(tick);
    }else if(s.tick-tick>=1440){add(gates,'no_purchase_within_day');pending.delete(tick);}
   }
  },
  nadirKaufErlaubt(w,s,house){
   add(gates,'house_candidate');
   const x=project(w,s),r=w.rules;
   if(x.stock!==1){add(gates,'not_last_stock');return true;}
   const carriers=x.live.filter(sh=>sh.owner==='transport'),price=r.economy.waren.frachter.basis;
   const route=r.world.gates.find(g=>g[0]==='aldera'&&g[1]==='nadir')[2];
   const transfer=route*r.w5Transfer.lohnJeMinute,work=2*route*r.w3.arbeitJeMinute;
   if(carriers.length>1){add(gates,'multiple_npc_carriers');return true;}
   if(carriers.length===1&&(carriers[0].rest===null||carriers[0].rest*100>Math.ceil(price*1000/w.daten.verschleiss.milliJeMinute.frachter)*60)){add(gates,'npc_not_due');return true;}
   if(s.owners.transport.cash<price+transfer+work){add(gates,'npc_not_funded');return true;}
   const original=w.save(s),q=w.load(original);
   const probe=w.execute(q,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'frachter'});
   assert.equal(w.save(s),original);
   if(!probe.ok){add(gates,'house_original_refusal');return true;}
   assert.deepEqual(pruefen(w,q),[]);
   assert.equal(q.stations.st_nadir.lager.frachter,0);
   assert.equal(q.owners.house.cash,s.owners.house.cash-price);
   add(gates,'eligible_voluntary_deferral');
   if(windows.length<40)windows.push({tick:s.tick,event:mode==='defer'?'deferred':'control_purchase_opportunity',npc:carriers,house:house.map(sh=>sh.id),cash:x.cash});
   if(mode==='control')return true;
   // Never lock stock or alter anyone else's rights. The simulated player
   // merely refrains from using its own legal purchase action for this tick.
   if(!pending.size)pending.set(s.tick,{ids:new Set(Object.keys(s.ships))});
   return false;
  },
  amEnde(w,s){assert.deepEqual(pruefen(w,s),[]);end=project(w,s);}
 });
 const result={days,mode,gates,windows,events,lastFreight,zeroSince,end,
  checkpoints:report.verlauf,houseFollowupTrips:report.ende.folgefahrten.length,decisions:report.ende.entscheidungen,hash:report.ende.hash};
 assert.equal(result.checkpoints.at(-1).weltgeld,33000);
 return result;
}
module.exports={lauf};
if(require.main===module){
 const [mode,days]=process.argv.slice(2);assert.ok([90,365,730].includes(+days));
 const a=lauf(+days,mode);assert.deepEqual(lauf(+days,mode),a);
 if(mode==='control')assert.equal(a.hash,({90:'5e14d64c83e6e942',365:'f0c15f0261a70864',730:'35e809440b315ae4'})[days]);
 console.log('U9K_MARKET',JSON.stringify(a));
}
