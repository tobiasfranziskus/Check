/* U9c: offline follow-up from the exact U9b S02 snapshot.
 * No state editing, no change to the production strategy or simulated prices.
 */
'use strict';
const assert=require('node:assert/strict');
const {lauf,verwaltung,kontrollstand}=require('./m4-management-szenarien.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');

function ausgang(){
 let snapshot;
 const sz=SZENARIEN.find(x=>x.id==='S02');
 lauf(sz,30,42,true,'konzerne',{amEnde(welt,s){
   assert.equal(welt.hash(s),'478696c8bbb0c153');
   const i=s.kanon.industrieErz,original=welt.save(s);
   const q=welt.u9TeilabrechnungProbe(s,{hash:welt.hash(s),parteien:[
     'st_nadir','st_aldera','npc3',i.carrier??'transport','werft_extern']});
   assert.equal(q.ok,true,q.reason);
   assert.deepEqual(q.abrechnung,{menge:22,wert:220});
   assert.equal(q.hash,'71414d11cf071dda');
   assert.equal(welt.save(s),original);
   snapshot={welt,original,settled:q.json};
 }});
 return snapshot;
}

// Optional fictional Meridian decision, separate from house manager actions.
// Only when the existing live industrial offer check names missing free miner,
// all earlier actual demand and budget gates have passed, and a hull is on sale.
function ersatz(welt,s,log){
 const lage=welt.industrieAngebotslage(s);
 if(lage.ok||lage.grund!=='Meridian hat keinen freien Erzminer am Aldera-Dock.')return;
 if(log.some(x=>x.ok))return; // at most one extra deliberate purchase in this experiment
 const price=welt.rules.economy.waren.miner.basis;
 const work=welt.rules.w3.fracht*welt.rules.erzpilot.minerJeMinute;
 const reserve=welt.daten.flug.reserveMinuten;
 const stock=s.stations.st_aldera.lager.miner||0, cash=s.owners.npc3.cash;
 if(!s.kanon.politik.ersatzkauf||!stock||cash<price+work+reserve){
   if(log.length===0)log.push({tick:s.tick,ok:false,reason:'Originalangebot ohne freie Hülle / gedeckten Kauf und Betrieb',stock,cash,price,work,reserve});
   return;
 }
 const before=welt.save(s),ids=new Set(Object.keys(s.ships));
 const r=welt.execute(s,{type:'shipBuy',owner:'npc3',klasse:'miner',station:'st_aldera'});
 if(!r.ok){
   assert.equal(welt.save(s),before);
   if(log.length===0)log.push({tick:s.tick,ok:false,reason:r.reason,stock,cash});
   return;
 }
 const newIds=Object.keys(s.ships).filter(id=>!ids.has(id));
 assert.equal(newIds.length,1);
 const id=newIds[0];
 assert.equal(s.ships[id].owner,'npc3');
 assert.equal(s.ships[id].klasse,'miner');
 assert.equal(s.stations.st_aldera.lager.miner,stock-1);
 assert.equal(s.owners.npc3.cash,cash-price);
 assert.deepEqual(pruefen(welt,s),[]);
 log.push({tick:s.tick,ok:true,id,price,stockBefore:stock,cashBefore:cash,cashAfter:s.owners.npc3.cash});
}

function folgelauf(welt,json,tage,option){
 const s=welt.load(json),beg=kontrollstand(welt,s),endeTick=s.tick+tage*1440;
 const entscheidungen={},kaeufe=[],vertraege={},belege=[],verlauf=[];
 const altesErz=s.w5ad.freight.length;
 const alteEisIds=new Set((s.kanon.spielerFrachten?.auftraege||[]).filter(x=>x.end!==null).map(x=>x.schiff+':'+x.start));
 while(s.tick<endeTick){
   const next=Math.min(s.tick+60,endeTick);
   if(option)ersatz(welt,s,kaeufe);
   verwaltung(welt,s,entscheidungen,true);
   while(s.tick<next){
     const a=s.w3.auftrag;
     if(a?.start!==undefined&&a.phase!=='vorbestellt')vertraege[a.schiff+':'+a.start]={
       miner:a.industrieMiner??null,carrier:a.carrier??'transport'};
     welt.advance(s,1);
     const danach=s.w3.auftrag;
     if(danach?.start!==undefined&&danach.phase!=='vorbestellt')vertraege[danach.schiff+':'+danach.start]={
       miner:danach.industrieMiner??null,carrier:danach.carrier??'transport'};
   }
   if((s.tick-beg.tick)%1440===0){
     const b=kontrollstand(welt,s);
     verlauf.push({tick:b.tick,hash:b.hash,gebunden:b.gebunden,auftraege:b.auftraege});
   }
 }
 const end=kontrollstand(welt,s);
 for(const x of s.w5ad.freight.slice(altesErz)){
   assert.ok(x.amount>0&&x.fee>0&&x.work>0&&x.end>=beg.tick);
   belege.push({ware:'erz',...x,...vertraege[x.id+':'+x.start]});
 }
 for(const x of (s.kanon.spielerFrachten?.auftraege||[])){
   if(x.end===null||alteEisIds.has(x.schiff+':'+x.start))continue;
   assert.ok(x.menge>0&&x.fracht>0&&x.arbeit>0&&x.end>=beg.tick);
   belege.push({ware:'eis',...x});
 }
 const neueHuellen=end.huellen.filter(x=>!beg.huellen.some(y=>y.id===x.id));
 const delta={erz:end.auftraege.erzfrachten-beg.auftraege.erzfrachten,
   eis:end.auftraege.eisfrachten-beg.auftraege.eisfrachten,
   hausEis:end.auftraege.spielerEisfracht-beg.auftraege.spielerEisfracht};
 assert.equal(belege.filter(x=>x.ware==='erz').length,delta.erz);
 assert.equal(belege.filter(x=>x.ware==='eis').length,delta.hausEis);
 assert.equal(end.weltgeld,33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 const status=delta.erz||delta.eis?'BEZAHLTE_FOLGEFAHRT':'BLOCKIERT';
 return {status,delta,kaeufe,neueHuellen,belege,verlauf,entscheidungen,
   beginn:{hash:beg.hash,gebunden:beg.gebunden,kassen:beg.kassen,lager:beg.lager},
   ende:{hash:end.hash,gebunden:end.gebunden,kassen:end.kassen,lager:end.lager,
     aktiveAuftraege:end.aktiveAuftraege,angebot:welt.industrieAngebotslage(s),
     npcPausen:s.kanon.npc?.pausen??null,huellen:end.huellen}};
}
module.exports={ausgang,folgelauf};
if(require.main===module){
 const tage=Number(process.argv[2]||7);
 assert.ok(Number.isSafeInteger(tage)&&tage>0&&tage<=730);
 const {welt,original,settled}=ausgang();
 console.log(JSON.stringify({kontrolle:folgelauf(welt,original,tage,false),
   abgerechnet:folgelauf(welt,settled,tage,false),
   ersatzentscheidung:folgelauf(welt,settled,tage,true)}));
}
