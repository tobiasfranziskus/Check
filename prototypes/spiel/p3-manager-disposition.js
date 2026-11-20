/* M1/M2 – lesende Auftragszentrale: dieselben J8-/Core-Angebote wie die normale
 * Auftragsliste. Keine eigene Simulation, kein Vertrag, keine Reserve, kein Savefeld.
 */
(function(scope){
'use strict';
const natural=x=>Number.isSafeInteger(x)&&x>=0;
function auswerten(w,s,angebote){
 if(!s||![204,207].includes(s.rulesVersion)||!w||w.regel!==s.rulesVersion||
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
 const stopMine=choose(waiting,'stop-');
 const aussetzen=stopMine
   ?{aktion:stopMine.id,bereit:stopMine.quote.ok===true,
      titel:'Eigene Eisförderung beenden',grund:stopMine.quote.reason||null}
   :{aktion:null,bereit:false,titel:'Keine laufende Eigenförderung',
      grund:'Nur ein rechtmäßig laufendes eigenes Eis-Pendel kann beendet werden.'};
 const nextMine=choose(idleMiners,'ice-');
 const mineBuy=quote('buy-st_aldera-miner');
 const mine=miners.length===0
   ?{aktion:mineBuy?.id||null,bereit:mineBuy?.ok===true,
      titel:'Bergbauschiff kaufen',grund:mineBuy?.reason||'Kein originales Kaufangebot in Aldera'}
   :nextMine
     ?{aktion:nextMine.id,bereit:nextMine.quote.ok===true,
        titel:'Eisförderung beauftragen',grund:nextMine.quote.reason||null}
     :{aktion:null,bereit:false,titel:'Eisförderung läuft',
        grund:waiting.length?'Eigener Eisauftrag läuft bereits. 60 Weltminuten fortsetzen oder im Auftragsverzeichnis beenden.':
          'Kein freier eigener Miner für einen neuen Eisauftrag in Aldera.'};
 // Completed/open freight belongs to the company even while its carrier is in Nadir.
 const ownIds=new Set(owned.filter(sh=>sh.klasse==='frachter').map(sh=>sh.id));
 const entries=(s.kanon?.spielerFrachten?.auftraege||[])
   .filter(a=>ownIds.has(a.schiff));
 const open=entries.filter(a=>a.end===null).length;
 const completed=entries.filter(a=>natural(a.end)&&natural(a.geliefert)).length;
 const nextFreight=choose(carriers,'freight-');
 const freightBuy=quote('buy-st_aldera-frachter');
 const freight=carriers.length===0
   ?{aktion:freightBuy?.id||null,bereit:freightBuy?.ok===true,
      titel:'Frachter kaufen',grund:freightBuy?.reason||'Kein originales Frachterangebot in Aldera'}
   :nextFreight
     ?{aktion:nextFreight.id,bereit:nextFreight.quote.ok===true,
        titel:'50 Eis transportieren',grund:nextFreight.quote.reason||null}
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
  minerAnzahl:miners.length,minerAktiv:waiting.length,
  frachterAnzahl:carriers.length,frachtOffen:open,frachtAbgeschlossen:completed,
  frachtGebuehrBisher:gebuehr,
  frachtLohnBisher:lohn,
  anlagewert,verschleiss,inventarindikator,
  // Never label this cash/book-value indicator as a balance sheet or net profit.
  aussetzen:Object.freeze(aussetzen),
  abbau:Object.freeze(mine),transport:Object.freeze(freight)
 });
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3ManagerDisposition=api;
})(globalThis);
