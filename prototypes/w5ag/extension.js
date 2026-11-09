/* Read-only Rule195 views; every offer and action uses the validated session/Core. */
(function(scope){
'use strict';
const $=id=>document.getElementById(id);
function request(){return {type:'waterBuy',owner:$('pilot-owner').value,menge:Number($('water-amount').value)};}
function render(snap,session){
 const s=snap.state,w=snap.water;
 const rows=[
  ['pilot_erz',s.w5ag.paid.erz],['pilot_eis',s.w5ag.paid.eis]
 ].map(([id,earned])=>{
  const spent=s.w5n.kaufDeals.filter(x=>x.owner===id).reduce((n,x)=>n+x.betrag,0);
  return id+': '+earned+' ISK tatsächlich verdient · '+spent+' ISK ausgegeben · '+s.owners[id].cash+' ISK eigenes Guthaben';
 });
 $('water-state').textContent=rows.join(' | ')+' | Aldera Eis: '+s.stations.st_aldera.lager.eis+
  ' · Nadir Eis: '+s.stations.st_nadir.lager.eis+' · Wasser: '+s.stations.st_nadir.lager.wasser+
  ' · hergestellt: '+s.w5n.wasserProduziert+' · verbraucht: '+s.w5n.wasserVerbraucht+
  ' | Geld-/Waren-/Eigentums-/Lohn-/Schiffsaudits: '+(snap.audit.ok&&w.personal.ok&&w.audit.ok?'OK':'FEHLER');
 const actions=[['ice-mine',{type:'shipMine',schiff:snap.selected,ware:'eis'},'Eisförderung'],
  ['ice-freight',{type:'iceFreight'},'Eisfracht'],['water-start',{type:'waterStart'},'Wasserwerk']];
 const quotes=actions.map(([id,req,label])=>{
  const q=session.preview(req);$(id).disabled=!q.ok;
  return label+': '+(q.ok?'Befehl zulässig; der Core prüft Finanzierung bei Arbeitsbeginn':q.reason);
 });
 $('water-quotes').textContent=quotes.join(' | ');
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
  letzteLohnminuten:s.w5ag.payments.slice(-6),wasserkaufbelege:s.w5n.kaufDeals
 },null,2);
}
function mount(session,run){
 for(const [id,req] of [
  ['ice-mine',()=>({type:'shipMine',schiff:session.snapshot().selected,ware:'eis'})],
  ['ice-freight',()=>({type:'iceFreight'})],['water-start',()=>({type:'waterStart'})],
  ['water-buy',request]])$(id).addEventListener('click',()=>run(()=>session.command(req())));
 for(const id of ['pilot-owner','water-amount'])$(id).addEventListener('input',()=>render(session.snapshot(),session));
}
scope.W5agExtension=Object.freeze({render,mount});
})(globalThis);
