/* U9h: offline test of two independent owner decisions. Not product NPC policy. */
'use strict';
const assert=require('node:assert/strict');
const {simulation}=require('./m4-u9d-langzeit.cjs');
const {restAktivMinuten}=require('./m4-u9-vertragsvorsorge.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
const weltFabrik=p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
function versuch(sz,tage,seed,strategie){
 const belege=[],counts={reserve:0,freigabe:0,abgelehnt:0};
 const reserve=['reserve','kombiniert'].includes(strategie),freigabe=strategie==='kombiniert';
 const log=(typ,data)=>{counts[typ]++;if(belege.length<100)belege.push({typ,...data});};
 const round=w=>2*w.rules.w5n.flugMinuten;
 const rest=(w,s,sh)=>restAktivMinuten(w,s,sh.id)??Infinity;
 const carrier=(w,s,sh)=>sh.klasse==='frachter'&&['house','transport'].includes(sh.owner)&&
   ['aldera','nadir'].includes(sh.system)&&!w.stillgelegt(s,sh.id)&&rest(w,s,sh)>=round(w);
 function lage(w,s){
   return {freieFracht:Object.values(s.ships).filter(sh=>carrier(w,s,sh)).map(sh=>sh.id),
     lager:s.stations.st_nadir.lager.frachter||0,aldera:s.stations.st_aldera.lager.frachter||0};
 }
 const report=simulation(sz,tage,seed,'vollabnahme',60,{weltFabrik,
  eisFreigabe(w,s,sh){
   if(!reserve||!s.kanon.politik.stilllegung||!s.kanon.politik.ersatzkauf)return true;
   const q=lage(w,s);
   if(q.lager||q.aldera||q.freieFracht.some(id=>id!==sh.id)||rest(w,s,sh)>=2*round(w))return true;
   const quote=w.kern.pilotIceFreightQuote(s,sh.id);
   if(quote.ok)log('reserve',{tick:s.tick,schiff:sh.id,rest:rest(w,s,sh),dauer:round(w),hash:w.hash(s)});
   return false;
  },
  vorVerwaltung(w,s){
   if(!freigabe||!s.kanon.politik.automatik||s.w3.auftrag||s.w5n.frachtauftrag||
     s.w5ac.active||s.kanon.rueckfracht||!lage(w,s).freieFracht.length)return;
   if(w.industrieAngebotslage(s).grund!=='Meridian hat keinen freien Erzminer am Aldera-Dock.')return;
   const p=s.kanon.politik,k=s.kanon;
   // No competing paid ore contract; no unfunded ice production or remote sale.
   if((s.stations.st_aldera.lager.eis||0)<p.eisPufferAldera)return;
   const mi=Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.klasse==='miner'&&
     sh.system==='aldera'&&sh.phase==='dock'&&sh.flug?.lage==='angedockt'&&
     !w.stillgelegt(s,sh.id)&&Object.values(sh.ladung).every(n=>n===0)&&
     !s.erzpilotVertraege?.[sh.id]&&k.pendel[sh.id]?.ware==='eis'&&!k.pendel[sh.id].beenden)
     .sort((a,b)=>rest(w,s,b)-rest(w,s,a)||a.id.localeCompare(b.id))[0];
   if(!mi)return;
   const original=w.save(s),probe=w.load(original);
   const cmd={type:'shipShuttleStop',owner:'npc3',schiff:mi.id};
   const r=w.execute(probe,cmd);
   assert.equal(w.save(s),original);
   if(!r.ok){assert.equal(w.save(probe),original);log('abgelehnt',{tick:s.tick,reason:r.reason});return;}
   assert.equal(probe.kanon.pendel[mi.id],undefined);
   assert.deepEqual(pruefen(w,probe),[]);
   const real=w.execute(s,cmd);
   assert.equal(real.ok,true,real.reason);assert.equal(w.save(s),w.save(probe));
   log('freigabe',{tick:s.tick,miner:mi.id,rest:rest(w,s,mi),nach:w.hash(s)});
  }});
 return {strategie,counts,belege,report};
}
module.exports={versuch};
if(require.main===module){
 const [id='S02',tage='730',seed='42',strategie='kombiniert',replay='1']=process.argv.slice(2);
 const sz=SZENARIEN.find(x=>x.id===id);
 assert.ok(sz&&Number.isSafeInteger(+tage)&&+tage>0&&+tage<=730&&['kontrolle','reserve','kombiniert'].includes(strategie));
 const run=()=>versuch(sz,+tage,+seed,strategie);
 const a=run();if(replay==='1')assert.deepEqual(run(),a);
 console.log('U9H_RESULT',JSON.stringify(a));
}
