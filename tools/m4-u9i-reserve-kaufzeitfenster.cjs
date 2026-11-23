/* U9i offline study: isolate reserve purchase from warehouse policy and route occupancy.
 * No injected goods, price change, credit, owner transfer or browser behavior.
 */
'use strict';
const assert=require('node:assert/strict');
const {simulation}=require('./m4-u9d-langzeit.cjs');
const {restAktivMinuten}=require('./m4-u9-vertragsvorsorge.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');
const {erstellenU9f}=require('../prototypes/welt/welt-kern.js');
const weltFabrik=p=>erstellenU9f({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
function lauf(sz,tage,seed,lead,mode){
 assert.ok(['control','routefree','purchase'].includes(mode));
 const scenario=sz; // same original warehouse policy in all three arms
 const buys=[],rejections={},ereignisse=[],endfenster=[],gates={},windows=[];
 const count=key=>{gates[key]=(gates[key]||0)+1;};
 let last=null,zeroSince=null,lastFracht=null;
 const option={weltFabrik,vorDisposition(w,s){
   const k=s.kanon,owner=w.rules.w3.spedition, station=w.rules.w5.station;
   const fleet=Object.values(s.ships).filter(sh=>sh.owner===owner&&sh.klasse==='frachter'&&!w.stillgelegt(s,sh.id));
   const house=Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='frachter'&&!w.stillgelegt(s,sh.id));
   const stock=s.stations[station].lager.frachter||0;
   const alderaStock=s.stations.st_aldera.lager.frachter||0, cash=s.owners[owner].cash;
   const rest=fleet.map(sh=>restAktivMinuten(w,s,sh.id));
   const snapshot={tick:s.tick,live:fleet.map((sh,i)=>({id:sh.id,rest:rest[i],system:sh.system,phase:sh.phase})),house:house.map(sh=>sh.id),
     stock,alderaStock,cash,werft:s.owners.werft_extern.cash,material:s.stations[station].lager.material||0,
     erz:s.stations[station].lager.erz||0,alderaErz:s.stations.st_aldera.lager.erz||0,
     gebaut:s.w5.fertig,verkauft:s.w5.verkauft,eis:s.w5n.frachtAbgeschlossen,erzfracht:s.w3.abgeschlossen};
   if(!last||snapshot.eis!==last.eis||snapshot.erzfracht!==last.erzfracht)lastFracht=snapshot;
   if(!last||fleet.length!==last.live.length||stock!==last.stock||snapshot.gebaut!==last.gebaut||snapshot.verkauft!==last.verkauft){
     ereignisse.push(snapshot);
     if(ereignisse.length>24)ereignisse.shift();
   }
   if(fleet.length+house.length===0){
     if(zeroSince===null)zeroSince=s.tick;
   }else zeroSince=null;
   last=snapshot;
   if(!k.politik.stilllegung||!k.politik.ersatzkauf){count('policy');return;}
   if(fleet.length!==1){count('fleet_not_one');return;}
   if(stock<1){count('no_stock');return;}
   if(rest[0]===null){count('unknown_life');return;}
   const preis=w.rules.economy.waren.frachter.basis, rate=w.daten.verschleiss.milliJeMinute.frachter;
   const life=Math.ceil(preis*1000/rate);
   const flug=w.rules.world.gates.find(g=>g[0]==='aldera'&&g[1]==='nadir')[2];
   const transfer=flug*w.rules.w5Transfer.lohnJeMinute;
   const arbeit=2*flug*w.rules.w3.arbeitJeMinute;
   // At most two live carrier hulls. Preserve money for relocation and
   // simultaneous future working capital of both original hulls.
   if(rest[0]*100>life*lead){count('too_early');return;}
   if(cash<preis+transfer+2*arbeit){count('cash');return;}
   const routeBusy=!!(s.w3.auftrag||s.w5n.frachtauftrag||s.w5ac.active||k.rueckfracht||['angebot','aktiv'].includes(k.industrieErz.phase));
   count(routeBusy?'eligible_busy':'eligible_free');
   if(windows.length<24)windows.push({tick:s.tick,stock,cash,rest:rest[0],routeBusy,old:fleet[0].id});
   if(mode==='control'||(mode==='routefree'&&routeBusy))return;
   const original=w.save(s),q=w.load(original),ids=new Set(Object.keys(s.ships));
   const enc=state=>JSON.stringify([state.w3.auftrag,state.w5n.frachtauftrag,state.w5ac.active,state.kanon.rueckfracht,state.kanon.industrieErz]);
   const contracts=enc(s);
   const cmd={type:'shipBuy',owner,klasse:'frachter',station};
   const probe=w.execute(q,cmd);
   if(!probe.ok){assert.equal(w.save(s),original);rejections[probe.reason]=(rejections[probe.reason]||0)+1;return;}
   const neu=Object.keys(q.ships).filter(id=>!ids.has(id));
   assert.equal(neu.length,1);assert.equal(q.ships[neu[0]].owner,owner);
   assert.equal(q.ships[neu[0]].system,'nadir');assert.equal(q.owners[owner].cash,cash-preis);
   assert.equal(q.stations[station].lager.frachter,stock-1);
   assert.equal(enc(q),contracts,'buying an idle hull does not alter existing contracts');
   assert.deepEqual(pruefen(w,q),[]);
   assert.equal(w.save(s),original);
   const r=w.execute(s,cmd);assert.equal(r.ok,true,r.reason);assert.equal(w.save(s),w.save(q));
   buys.push({tick:s.tick,old:fleet[0].id,new:neu[0],rest:rest[0],stock,cash,preis,transfer,arbeit,routeBusy,before:w.hash(w.load(original)),after:w.hash(s)});
 },amEnde(w,s){
   assert.deepEqual(pruefen(w,s),[]);
   for(const sh of Object.values(s.ships).filter(sh=>!w.stillgelegt(s,sh.id))){
     endfenster.push({id:sh.id,owner:sh.owner,klasse:sh.klasse,system:sh.system,phase:sh.phase,
       auftrag:sh.auftrag,flug:sh.flug.lage,ladung:sh.ladung,pendel:s.kanon.pendel[sh.id]??null,
       rest:restAktivMinuten(w,s,sh.id)});
   }
 } };
 const report=simulation(scenario,tage,seed,'vollabnahme',lead,option);
 return {mode,lead,tage,seed,report,buys,rejections,gates,windows,lastFracht,zeroSince,ereignisse,endfenster};
}
module.exports={lauf};
if(require.main===module){
 const [mode='control',dauer='730',lead='60',seed='42',replay='0']=process.argv.slice(2);
 const s=SZENARIEN.find(x=>x.id==='S02');
 assert.ok(Number.isSafeInteger(+dauer)&&+dauer>0&&+dauer<=730&&[40,60,80].includes(+lead));
 const run=()=>lauf(s,+dauer,+seed,+lead,mode);
 const a=run();if(replay==='1')assert.deepEqual(run(),a);
 console.log('U9I_FLOTTE',JSON.stringify(a));
}
