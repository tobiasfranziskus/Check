/* Read-only Rule195 views; every offer and action uses the validated session/Core. */
(function(scope){
'use strict';
const $=id=>document.getElementById(id);
function request(){return {type:'waterBuy',owner:$('pilot-owner').value,menge:Number($('water-amount').value)};}
function saleRequest(snap,prefix){return {type:'shipSellIce',schiff:snap.selected,menge:Number($(prefix+'-amount').value)};}
function miningLimit(snap,ware){
 const sh=snap.state.ships[snap.selected],rules=scope.W5wOriginal.rules;
 if(!sh)return null;
 if(Object.values(sh.ladung).reduce((n,x)=>n+x,0)>=rules.economy.cargo)return 'Frachtraum voll; vorhandene Ladung zuerst verkaufen';
 if(ware==='eis'&&snap.state.owners.house.cash<rules.w5n.mineLohn)return 'Eigenes Arbeitsgeld für nächste Eis-Förderminute fehlt';
 return null;
}
function capitalBridge(snap,rules=scope.W5wOriginal.rules){
 const state=snap.state,station='st_aldera';
 // W1 buyer funds belong to real original escrow owners, not free Aldera cash.
 const contracts=Object.entries(state.erzpilotVertraege||{}).map(([schiff,c])=>
  Object.freeze({schiff,menge:c.menge,konto:c.konto,
   buyerHeld:state.owners[c.konto]?.cash||0,workerHeld:state.owners[c.arbeitsKonto]?.cash||0}));
 const held=contracts.reduce((sum,c)=>sum+c.buyerHeld,0);
 const initial=rules.owners.find(o=>o.id===station)?.cash;
 const book=state.stats.konto[station];
 const booked=initial+book.erloes-book.kosten;
 const free=state.owners[station].cash;
 return Object.freeze({free,oreBuyerHeld:held,booked,
  bridgeOk:booked===free+held,contracts:Object.freeze(contracts),
  nadirFree:state.owners.st_nadir.cash,
  carrierFree:state.owners.transport.cash,
  nextBuyer:snap.water.freight.gesamt,
  nextWorker:snap.water.freight.arbeit});
}
function capitalText(c){
 return 'Aldera für Eisankauf frei '+c.free+' ISK · für laufende Erzankäufe gebunden '+
  c.oreBuyerHeld+' ISK (nicht frei; Rückfluss nur nach tatsächlichem Original-Core-Auftragsabschluss)'+
  ' · Nadir Käuferkasse frei '+c.nadirFree+' ISK, nächste Eisfracht braucht '+
  c.nextBuyer+' ISK · Spedition frei '+c.carrierFree+' ISK, Fluglohnreserve '+
  c.nextWorker+' ISK'+(c.bridgeOk?' · Aldera-Kassenbrücke geprüft':' · KASSENABWEICHUNG – keine Finanzierungsfreigabe');
}
function renderSale(snap,session,prefix){
 const q=session.preview(saleRequest(snap,prefix)),c=capitalBridge(snap);
 $(prefix).disabled=!q.ok||!c.bridgeOk;
 $(prefix+'-quote').textContent=(q.ok?'Verkauf durch Core gedeckt':'Verkauf gesperrt: '+q.reason)+
  ' · Eigene Eisladung '+(snap.state.ships[snap.selected]?.ladung.eis||0)+
  ' · '+capitalText(c)+'. Der Core prüft Menge, Eigentum, Ort, Lager und Käufergeld erneut.';
}
function render(snap,session){
 const s=snap.state,w=snap.water;
 const rows=[
  ['pilot_erz',s.w5ag.paid.erz],['pilot_eis',s.w5ag.paid.eis]
 ].map(([id,earned])=>{
  const spent=s.w5n.kaufDeals.filter(x=>x.owner===id).reduce((n,x)=>n+x.betrag,0);
  const minutes=s.w5ag.payments.filter(x=>x.owner===id).length;
  return id+': '+minutes+' tatsächlich bezahlte Flugminuten · '+earned+' ISK tatsächlich verdient · '+spent+' ISK ausgegeben · '+s.owners[id].cash+' ISK eigenes Guthaben';
 });
 $('water-state').textContent=rows.join(' | ')+' | Aldera Eis: '+s.stations.st_aldera.lager.eis+
  ' · Nadir Eis: '+s.stations.st_nadir.lager.eis+' · Wasser: '+s.stations.st_nadir.lager.wasser+
  ' · hergestellt: '+s.w5n.wasserProduziert+' · verbraucht: '+s.w5n.wasserVerbraucht+
  ' · Wasserumsatz: '+s.w5n.wasserErlos+' ISK · Chargen begonnen/fertig: '+s.w5n.fabrikBegonnen+'/'+s.w5n.fabrikFertig+
  ' · Eis-Rundflüge fertig: '+s.w5n.frachtAbgeschlossen+
  ' | Geld-/Waren-/Eigentums-/Lohn-/Schiffsaudits: '+(snap.audit.ok&&w.personal.ok&&w.audit.ok?'OK':'FEHLER');
 const actions=[['ice-mine',{type:'shipMine',schiff:snap.selected,ware:'eis'},'Eisförderung'],
  ['ice-freight',{type:'iceFreight'},'Eisfracht'],['water-start',{type:'waterStart'},'Wasserwerk']];
 const quotes=actions.map(([id,req,label])=>{
  const q=session.preview(req),reason=!q.ok?q.reason:req.type==='shipMine'?miningLimit(snap,req.ware):null;$(id).disabled=!!reason;
  return label+': '+(reason||'Befehl zulässig; der Core prüft Finanzierung bei Arbeitsbeginn');
 });
 $('water-quotes').textContent=quotes.join(' | ');
 renderSale(snap,session,'ice-sell');
 $('capital-bridge').textContent=capitalText(capitalBridge(snap));
 const f=w.freight;
 $('water-quotes').textContent+=' | Nadir Käuferkasse '+s.owners.st_nadir.cash+' ISK · Speditionskasse '+s.owners.transport.cash+' ISK'+
  (f.ok?' · Nächste Fracht: '+f.gesamt+' ISK Käuferetat und '+f.arbeit+' ISK Fluglöhne vorab sperren.':' · Fracht gesperrt: '+f.grund);
 const q=session.preview(request());$('water-buy').disabled=!q.ok;
 $('water-buy-quote').textContent=q.ok?'Forschungspreis '+w.price+' ISK je Wasser. Kauf aus diesem eigenen Konto ausführbar; der Core bucht Ware und ISK atomar.':'Kauf gesperrt: '+q.reason;
 $('water-orders').textContent='Eisfracht: '+({hin:'Hinflug',rueck:'Rückflug',frei:'kein aktiver Auftrag'}[w.audit.frachtAuftrag]||w.audit.frachtAuftrag)+
  ' · Wasserwerk: '+(w.audit.fabrikAuftrag==='frei'?'kein aktiver Auftrag':'bezahlte Produktion läuft')+
  ' · Käufergeld Eisfracht gebunden: '+(s.owners.w5n_fracht_kauf?.cash||0)+' ISK'+
  ' · Fluglohn gebunden: '+(s.owners.w5n_fracht_arbeit?.cash||0)+' ISK'+
  ' · Werklohn gebunden: '+(s.owners.w5n_fabrik_arbeit?.cash||0)+' ISK. Jeder Zeitschritt oben zahlt nur tatsächlich ausgeführte Arbeit.';
 $('water-ledger').textContent=JSON.stringify({
  eisFracht:s.w5n.frachtauftrag,erzFracht:s.w3.auftrag,wasserwerk:s.w5n.fabrikauftrag,
  wasserAudit:w.audit,persoenlicherAudit:w.personal,
  eisFlugvertraege:s.w5ag.iceContracts,bezahlteFlugminuten:s.w5ag.payments,
  produktionschargen:{begonnen:s.w5n.fabrikBegonnen,fertig:s.w5n.fabrikFertig},wasserkaufbelege:s.w5n.kaufDeals
 },null,2);
}
function mount(session,run){
 for(const [id,req] of [
  ['ice-mine',()=>({type:'shipMine',schiff:session.snapshot().selected,ware:'eis'})],
  ['ice-freight',()=>({type:'iceFreight'})],['water-start',()=>({type:'waterStart'})],
  ['water-buy',request]])$(id).addEventListener('click',()=>run(()=>session.command(req())));
 $('ice-sell').addEventListener('click',()=>run(()=>session.command(saleRequest(session.snapshot(),'ice-sell'))));
 $('ice-sell-amount').addEventListener('input',()=>render(session.snapshot(),session));
 for(const id of ['pilot-owner','water-amount'])$(id).addEventListener('input',()=>render(session.snapshot(),session));
}
const api=Object.freeze({render,mount,renderSale,saleRequest,miningLimit,capitalBridge,capitalText});
scope.W5agExtension=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(globalThis);
