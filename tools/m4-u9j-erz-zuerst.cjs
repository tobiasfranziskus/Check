/* Research only: original W3 warehouse freight before last carrier wears out.
 * No demand, stock, funding, contract or core edits. Both arms use identical S02.
 */
'use strict';
const assert=require('node:assert/strict');
const {simulation}=require('./m4-u9d-langzeit.cjs');
const {restAktivMinuten}=require('./m4-u9-vertragsvorsorge.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
function lauf(days,mode){
 assert.ok(['control','stockfirst'].includes(mode));
 const sz=SZENARIEN.find(x=>x.id==='S02');
 const gates={},bookings=[],refusals={};let lastFreight=null,prev=null,end=null,zeroSince=null;
 const add=(obj,key)=>obj[key]=(obj[key]||0)+1;
 const projection=(w,s)=>({
  tick:s.tick,eis:s.w5n.frachtAbgeschlossen,erz:s.w3.abgeschlossen,
  carriers:Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&['transport','house'].includes(sh.owner)&&!w.stillgelegt(s,sh.id)).map(sh=>({id:sh.id,owner:sh.owner,system:sh.system,rest:restAktivMinuten(w,s,sh.id),phase:sh.phase})),
  alderErz:s.stations.st_aldera.lager.erz||0,nadir:{...s.stations.st_nadir.lager},
  budgets:Object.fromEntries(['transport','npc3','st_aldera','st_nadir','werft_extern'].map(id=>[id,s.owners[id].cash])),
  k7:s.kanon.industrieErz.phase
 });
 const report=simulation(sz,days,42,'vollabnahme',60,{
  weltFabrik:p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash}),
  vorDisposition(w,s){
   const x=projection(w,s);
   if(!prev||x.eis!==prev.eis||x.erz!==prev.erz)lastFreight=x;
   prev=x;
   if(!x.carriers.length){if(zeroSince===null)zeroSince=s.tick;}else zeroSince=null;
   const k=s.kanon,r=w.rules,n=x.nadir,ts=x.carriers.filter(sh=>sh.owner===r.w3.spedition);
   if(!k.politik.stilllegung||!k.politik.ersatzkauf){add(gates,'policy');return;}
   if(ts.length!==1){add(gates,'not_one_transport');return;}
   const carrier=ts[0],price=r.economy.waren.frachter.basis,rate=w.daten.verschleiss.milliJeMinute.frachter;
   const route=r.world.gates.find(g=>g[0]==='aldera'&&g[1]==='nadir')[2];
   if(carrier.rest===null||carrier.rest*100>Math.ceil(price*1000/rate)*60){add(gates,'not_due');return;}
   if(carrier.rest<2*route){add(gates,'insufficient_remaining_life');return;}
   if(n.frachter>0||s.w4.auftrag||s.w5.auftrag||k.minerWerft?.auftrag){add(gates,'replacement_or_production_present');return;}
   if((n.material||0)+Math.floor((n.erz||0)/r.w4.erzJeCharge)*r.w4.materialJeCharge>=r.w5.material){add(gates,'enough_nadir_material');return;}
   if(x.alderErz<r.w3.fracht){add(gates,'no_aldera_ore_charge');return;}
   if(s.w3.auftrag||s.w5n.frachtauftrag||s.w5ac.active||k.rueckfracht||['angebot','aktiv'].includes(k.industrieErz.phase)||(s.owners.k7_werft_treuhand?.cash||0)!==0){add(gates,'route_or_contract_bound');return;}
   const sh=s.ships[carrier.id];
   if(sh.system!=='aldera'||sh.phase!=='dock'||sh.flug?.lage!=='angedockt'||sh.auftrag!=='halten'||Object.values(sh.ladung).some(n=>n!==0)){add(gates,'carrier_not_ready');return;}
   const original=w.save(s),q=w.load(original),cmd={type:'shipFreight',owner:sh.owner,schiff:sh.id};
   const p=w.execute(q,cmd);
   assert.equal(w.save(s),original);
   if(!p.ok){add(gates,'original_refusal');add(refusals,p.reason);return;}
   assert.equal(q.stations.st_aldera.lager.erz,x.alderErz-r.w3.fracht);
   assert.equal(q.ships[sh.id].ladung.erz,r.w3.fracht);
   assert.equal(q.w3.auftrag.schiff,sh.id);
   assert.deepEqual(pruefen(w,q),[]);
   add(gates,'funded_original_window');
   if(mode==='control')return;
   const committed=w.execute(s,cmd);
   assert.equal(committed.ok,true,committed.reason);
   assert.equal(w.save(s),w.save(q));
   bookings.push({tick:s.tick,ship:sh.id,rest:carrier.rest,quantity:r.w3.fracht,hash:w.hash(s)});
  },
  amEnde(w,s){assert.deepEqual(pruefen(w,s),[]);end=projection(w,s);}
 });
 const result={days,mode,gates,refusals,bookings,lastFreight,zeroSince,end,checkpoints:report.verlauf,hash:report.ende.hash};
 assert.equal(result.checkpoints.at(-1).weltgeld,33000);
 return result;
}
module.exports={lauf};
if(require.main===module){
 const [mode,days]=process.argv.slice(2);assert.ok([90,365,730].includes(+days));
 const a=lauf(+days,mode);assert.deepEqual(lauf(+days,mode),a);
 if(mode==='control')assert.equal(a.hash,({90:'5e14d64c83e6e942',365:'f0c15f0261a70864',730:'35e809440b315ae4'})[days]);
 console.log('U9J_ORE',JSON.stringify(a));
}
