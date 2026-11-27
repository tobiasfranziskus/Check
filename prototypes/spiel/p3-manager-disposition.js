/* M1/M2 – lesende Auftragszentrale: dieselben J8-/Core-Angebote wie die normale
 * Auftragsliste. Keine eigene Simulation, kein Vertrag, keine Reserve, kein Savefeld.
 */
(function(scope){
'use strict';
const natural=x=>Number.isSafeInteger(x)&&x>=0;
function auswerten(w,s,angebote){
 if(!s||![204,207,208].includes(s.rulesVersion)||!w||w.regel!==s.rulesVersion||
   !Array.isArray(angebote)||w.audit(s).ok!==true)
   throw Error('Manageraufträge benötigen einen gültigen Originalweltstand und echte Angebote');
 const house=s.owners?.house?.cash,aldera=s.owners?.st_aldera?.cash,
   nadir=s.owners?.st_nadir?.cash,ice=s.stations?.st_aldera?.lager?.eis;
 const charge=w.rules?.w5n?.charge,price=w.rules?.w5n?.eisPreis;
 if([house,aldera,nadir,ice,charge,price].some(x=>!natural(x))||charge===0||price===0
   ||!natural(charge*price))
   throw Error('Manageraufträge: echte Kassen, Lager oder Förderregel fehlen');
 const owned=Object.values(s.ships||{}).filter(sh=>sh.owner==='house')
   .sort((a,b)=>a.id.localeCompare(b.id));
 const miners=owned.filter(sh=>sh.klasse==='miner'&&sh.system==='aldera');
 const carriers=owned.filter(sh=>sh.klasse==='frachter'&&sh.system==='aldera');
 const abnahme=w.rules.erzpilot;
 const erzKosten=abnahme.auftragsMenge*abnahme.preis;
 const erzExportKasse=s.owners[abnahme.exportOwner].cash;
 const ziel=w.rules.w5n.zielStation;
 const eislagerNadir=s.stations[ziel].lager.eis||0;
 const eisFrei=Math.max(0,w.kern.obergrenze(s,w.rules,ziel,'eis')-eislagerNadir);
 const frachtPreise=w.kern.eisfrachtPreise(w.rules);
 const quote=id=>angebote.find(x=>x.id===id)||null;
 const choose=(ships,prefix)=>{
  const orders=ships.map(sh=>({id:prefix+sh.id,quote:quote(prefix+sh.id)}))
    .filter(x=>x.quote);
  return orders.find(x=>x.quote.ok===true)||orders[0]||null;
 };
 const waiting=miners.filter(sh=>!!s.kanon?.pendel?.[sh.id]&&
   s.kanon.pendel[sh.id].ware==='eis');
 const idleMiners=miners.filter(sh=>!s.kanon?.pendel?.[sh.id]);
 // M2: only stop an already running OWN pendulum via the original quote.
 const erzAktiv=miners.filter(sh=>s.kanon?.pendel?.[sh.id]?.ware==='erz');
 const stopKandidaten=erzExportKasse<erzKosten
  ?[...erzAktiv,...waiting]:[...waiting,...erzAktiv];
 const stopMine=choose(stopKandidaten.filter(sh=>!s.kanon.pendel[sh.id].beenden),'stop-');
 const aussetzen=stopMine
   ?{aktion:stopMine.id,bereit:stopMine.quote.ok===true,
      titel:s.kanon.pendel[stopMine.id.slice(5)].ware==='erz'?'Eigene Erzförderung beenden':'Eigene Eisförderung beenden',grund:stopMine.quote.reason||null}
   :{aktion:null,bereit:false,titel:'Keine laufende Eigenförderung',
      grund:'Du kannst einen laufenden Eis- oder Erzauftrag deiner Schiffe beenden.'};
 const nextMine=choose(idleMiners,'ice-');
 const nextOre=choose(idleMiners,'ore-');
 const mineBuy=quote('buy-st_aldera-miner');
 const mine=miners.length===0
   ?{aktion:mineBuy?.id||null,bereit:mineBuy?.ok===true,
      titel:'Bergbauschiff kaufen',grund:mineBuy?.reason||'Kein originales Kaufangebot in Aldera'}
   :nextMine
     ?{aktion:nextMine.id,bereit:nextMine.quote.ok===true,
        titel:'Eisförderung beauftragen',grund:nextMine.quote.reason||null}
     :{aktion:null,bereit:false,titel:waiting.length?'Eisförderung läuft':'Kein freies Bergbauschiff',
        grund:waiting.length?'Ein Eisauftrag läuft bereits. Du kannst ihn in der Flotte beenden.':
          'Deine Bergbauschiffe in Aldera sind für andere Aufträge eingeteilt.'};
 // Alternative W1 commodity: exclusively a quoted, paid, player-owned miner
 // contract. No extra world, revenue formula or third-party industry authority.
 const ore=![204,208].includes(s.rulesVersion)
   ?{aktion:null,bereit:false,titel:'Erzauftrag nicht verfügbar',
      grund:'Für diese Karriere gibt es kein Angebot für lokale Erzförderung in Aldera.'}
   :miners.length===0
   ?{aktion:null,bereit:false,titel:'Erzgeschäft: eigenen Miner benötigt',
      grund:'Zuerst ein Bergbauschiff in Aldera kaufen.'}
   :nextOre
     ?{aktion:nextOre.id,bereit:nextOre.quote.ok===true,
        titel:abnahme.auftragsMenge+' Erz für Aldera fördern',grund:nextOre.quote.reason||null}
     :{aktion:null,bereit:false,titel:'Kein freier Miner für Erz',
        grund:'Die eigenen Miner in Aldera sind bereits eingeteilt. Eine Förderpause gibt den Miner nach der Rückkehr frei.',
        minerkauf:mineBuy?.ok===true};
 // Completed/open freight belongs to the company even while its carrier is in Nadir.
 const ownIds=new Set(owned.filter(sh=>sh.klasse==='frachter').map(sh=>sh.id));
 const entries=(s.kanon?.spielerFrachten?.auftraege||[])
   .filter(a=>ownIds.has(a.schiff));
 const open=entries.filter(a=>a.end===null).length;
 const completed=entries.filter(a=>natural(a.end)&&natural(a.geliefert)).length;
 const nextFreight=choose(carriers,'freight-');
 const freightBuy=quote('buy-st_aldera-frachter');
 const frachterStillgelegt=carriers.length>0&&carriers.every(sh=>w.stillgelegt(s,sh.id));
 // Use a hull already owned by the house before advertising another purchase.
 // The original J8 quote alone authorizes a paid Nadir -> Aldera transfer.
 const ueberfuehrung=(!carriers.length||frachterStillgelegt)&&!open
  ?choose(owned.filter(sh=>sh.klasse==='frachter'&&sh.system==='nadir'&&!w.stillgelegt(s,sh.id)),'reposition-'):null;
 const ersatz=frachterStillgelegt?['buy-st_aldera-frachter','buy-st_nadir-frachter']
  .map(quote).find(a=>a?.ok):null;
 const freight=ueberfuehrung
   ?{aktion:ueberfuehrung.id,bereit:ueberfuehrung.quote.ok===true,
      titel:'Eigenen Nadir-Frachter bezahlt nach Aldera überführen',grund:ueberfuehrung.quote.reason||null}
   :ersatz
   ?{aktion:ersatz.id,bereit:true,titel:'Ersatzfrachter in '+(ersatz.id.includes('nadir')?'Nadir':'Aldera')+' kaufen',grund:null}
   :carriers.length===0
   ?{aktion:freightBuy?.id||null,bereit:freightBuy?.ok===true,
      titel:'Frachter kaufen',grund:freightBuy?.reason||'Kein originales Frachterangebot in Aldera'}
   :nextFreight
     ?{aktion:nextFreight.id,bereit:nextFreight.quote.ok===true,
        titel:charge+' Eis transportieren',grund:nextFreight.quote.reason||null}
     :{aktion:null,bereit:false,titel:'Eistransport nicht verfügbar',
       grund:'Kein originaler Frachtauftrag für einen eigenen Aldera-Frachter'};
 // M2: original book values, receipts and paid wages; never infer a full profit.
 // No book entry is created here. Freight pilot wages are paid to pilot_house,
 // not quietly presented as the HOUSE company's own expenditure.
 const assets=owned.map(sh=>{
  const basis=w.rules?.economy?.waren?.[sh.klasse]?.basis;
  const rest=w.buchwert(s,sh.id);
  if(!natural(basis)||!natural(rest)||rest>basis)
   throw Error('Manager-Betriebsbericht: ungültiger Original-Anlagewert');
  return {id:sh.id,klasse:sh.klasse,basis,rest};
 });
 const anlagewert=assets.reduce((n,sh)=>n+sh.rest,0);
 const verschleiss=assets.reduce((n,sh)=>n+sh.basis-sh.rest,0);
 const startKasse=w.rules.owners?.find(o=>o.id==='house')?.cash;
 const inventarindikator=natural(startKasse)?house+anlagewert-startKasse:null;
 const f=s.kanon?.spielerFrachten;
 const gebuehr=f?.gebuehr||0,lohn=f?.lohn||0;
 if(!natural(gebuehr)||!natural(lohn))
  throw Error('Manager-Betriebsbericht: ungültige Original-Frachtbelege');
 return Object.freeze({
  hausKasse:house,alderaKasse:aldera,nadirKasse:nadir,eisLager:ice,
  eisCharge:charge,ankaufKosten:charge*price,
  minerAnzahl:miners.length,minerAktiv:waiting.length,erzAktiv:erzAktiv.length,
  eislagerNadir,eisFrei,wasserNadir:s.stations[ziel].lager.wasser||0,
  eisWasserwerkSchwelle:s.kanon.politik.wasserwerkBis,
  nadirFrachtbedarf:frachtPreise.gesamt,frachtLohnbedarf:frachtPreise.arbeit,
  erzKosten,erzExportKasse,
  frachterStillgelegt,
  ersatzAldera:freightBuy,ersatzNadir:quote('buy-st_nadir-frachter'),
  frachterAnzahl:carriers.length,frachtOffen:open,frachtAbgeschlossen:completed,
  frachtGebuehrBisher:gebuehr,
  frachtLohnBisher:lohn,
  anlagewert,verschleiss,inventarindikator,
  // Never label this cash/book-value indicator as a balance sheet or net profit.
  aussetzen:Object.freeze(aussetzen),
  abbau:Object.freeze(mine),transport:Object.freeze(freight),
  erzauftrag:Object.freeze(ore)
 });
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3ManagerDisposition=api;
})(globalThis);
