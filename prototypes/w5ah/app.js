/* W5ah interface: all money/goods/commands belong exclusively to Rule195. */
(function(){
'use strict';
const $=id=>document.getElementById(id),app=globalThis.W5ahSession.create();
const status=$('message');
const show=(id,value)=>{$(id).textContent=String(value);};
function render(){
 const s=app.snapshot(),p=s.price;
 show('identity','Regel '+s.rulesVersion+' · Tick '+s.tick+' · Audit '+(s.auditOk?'OK':'FEHLER')+' · Hash '+s.hash);
 for(const id of Object.keys(s.cash))show('cash-'+id,s.cash[id]+' ISK');
 show('ore-work',s.wages.erz+' ISK verdient · '+s.bought.erz.isk+' ISK für '+s.bought.erz.menge+' Wasser ausgegeben');
 show('ice-work',s.wages.eis+' ISK verdient · '+s.bought.eis.isk+' ISK für '+s.bought.eis.menge+' Wasser ausgegeben');
 show('stocks','Aldera: '+s.iceAldera+' Eis · Nadir: '+s.iceNadir+' Eis / '+s.waterNadir+' Wasser');
 show('production',s.iceDelivered+' Eis geliefert · '+s.made+' Wasser produziert · '+s.consumed+' Wasser verbraucht · '+s.waterWorks+' Fabrikchargen');
 show('trips',s.oreTrips+' echte Erz-Rundfahrten · '+s.iceTrips+' echte Eis-Rundfahrten');
 show('paid-minutes',s.paidMinutes+' wirkliche private Lohnminuten · Erz '+s.wages.erz+' ISK / Eis '+s.wages.eis+' ISK');
 show('ice-contracts',s.iceContracts+' einzelne Eis-Arbeitsverträge · '+s.iceTrips+' vollständig bezahlt · '+(s.iceActive?'eine Eisfracht läuft':'kein laufender Eisvertrag'));
 show('hull',s.freighter?s.freighter.id+' · '+s.freighter.system+' · '+s.freighter.phase:'kein Speditionsfrachter gekauft');
 show('miner',s.miner?s.miner.id+' · '+s.miner.auftrag+' · '+s.miner.phase:'kein eigener Miner gekauft');
 show('price',p+' ISK je echtes Wasser · keine Kaufpflicht');
 show('cashsum',s.worldCash+' ISK Weltgeld · '+s.minted+' ISK Mint · '+s.waterSales+' ISK nachweislicher Wasserumsatz');
 show('events',s.events.map(e=>typeof e==='string'?e:JSON.stringify(e)).join('\n')||'Noch keine Ereignisse');
 for(const button of document.querySelectorAll('[data-buy]')){
  const v=Number($(button.dataset.buy+'-amount').value);
  button.disabled=!Number.isSafeInteger(v)||v<=0;
 }
}
function perform(fn){
 try{
  const r=fn();
  status.textContent=r.ok?'Original-Core-Befehl erfolgreich gebucht.':'Core verweigert: '+r.reason;
  render();
 }catch(e){status.textContent='Nicht übernommen: '+e.message;render();}
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{
 const buyer=b.dataset.buy;
 perform(()=>app.command(b.dataset.action,buyer?Number($(buyer+'-amount').value):undefined));
}));
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{
 perform(()=>app.advance(Number(b.dataset.step)));
}));
for(const id of ['ore','ice'])$(id+'-amount').addEventListener('input',render);
$('export').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([app.export()],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='w5ah-rule195-research.json';
 document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
});
$('import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const json=await file.text();perform(()=>app.import(json));}
 catch(err){status.textContent='Nicht übernommen: '+err.message;render();}
 finally{e.target.value='';}
});
render();
})();
