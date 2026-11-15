/* Aphros Void J7 [ANALYSE] – ausschließlich lesende, stufenweise
 * Regel195→199→200→201→202→203→204-Prüfung anhand ORIGINALER Core-Adapter.
 * Kein zweiter Weltzustand, kein Save-Ersatz und keine erfundenen Käufe.
 */
(function(scope){
'use strict';
const W=typeof module==='object'&&module.exports?require('../welt/welt-kern.js'):scope.AphrosWelt;
const STUFEN=Object.freeze([
  Object.freeze({von:195,nach:199,name:'K1 – Wirtschaft und Flugkörper',run:(json)=>W.ausRegel195(json)}),
  Object.freeze({von:199,nach:200,name:'K7 – finanzierte Industrie',run:(json)=>W.ausRegel199K7(json)}),
  Object.freeze({von:200,nach:201,name:'J2b – Silizium',run:(json)=>W.ausRegel200J2b(json)}),
  Object.freeze({von:201,nach:202,name:'J3 – Bauteile',run:(json)=>W.ausRegel201J3(json)}),
  Object.freeze({von:202,nach:203,name:'J4b – Jägerwerft',run:(json)=>W.ausRegel202J4b(json)}),
  Object.freeze({von:203,nach:204,name:'J4c – persönlicher Flug',run:(json)=>W.ausRegel203J4c(json)})
]);
const safe=n=>Number.isSafeInteger(n)&&n>=0;
function inventar(s){
  if(!s||!s.owners||!s.ships||!s.stations||!s.ledger)throw Error('Fehlende Wirtschaftsbücher');
  const konten=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  const gesamt=Object.values(konten).reduce((n,v)=>n+v,0);
  if(!safe(gesamt)||Object.values(konten).some(v=>!safe(v)))throw Error('Unzulässige Geldbestände');
  const schiffe=Object.fromEntries(Object.entries(s.ships).map(([id,x])=>[id,{
    owner:x.owner,klasse:x.klasse,system:x.system,phase:x.phase,
    ladung:{...x.ladung}
  }]));
  const stationen=Object.fromEntries(Object.entries(s.stations).map(([id,x])=>[id,{...x.lager}]));
  const ledger=Object.fromEntries(Object.entries(s.ledger).map(([id,x])=>[id,{...x}]));
  return {konten,gesamt,schiffe,stationen,ledger,rng:s.rng,tick:s.tick,nextShip:s.nextShip};
}
function erhalt(vor,nach){
  if(vor.gesamt!==nach.gesamt)return 'Weltgeld verändert';
  if(vor.rng!==nach.rng||vor.tick!==nach.tick||vor.nextShip!==nach.nextShip)
    return 'RNG, Tick oder Schiffssequenz verändert';
  for(const [id,geld] of Object.entries(vor.konten))
    if(nach.konten[id]!==geld)return 'Konto verändert: '+id;
  for(const [id,geld] of Object.entries(nach.konten))
    if(!Object.hasOwn(vor.konten,id)&&geld!==0)return 'Neues Geldkonto ungleich null: '+id;
  for(const [id,sh] of Object.entries(vor.schiffe)){
    const nachSh=nach.schiffe[id];
    if(!nachSh||JSON.stringify(sh)!==JSON.stringify(nachSh))
      return 'Hülle/Eigentum/Ladung verändert: '+id;
  }
  if(Object.keys(nach.schiffe).length!==Object.keys(vor.schiffe).length)
    return 'Neue oder entfernte Hüllen';
  for(const [id,waren] of Object.entries(vor.stationen)){
    const neu=nach.stationen[id];
    if(!neu)return 'Station verschwunden: '+id;
    for(const [ware,menge] of Object.entries(waren))
      if(neu[ware]!==menge)return 'Stationsware verändert: '+id+'/'+ware;
    for(const [ware,menge] of Object.entries(neu))
      if(!Object.hasOwn(waren,ware)&&menge!==0)
        return 'Neue Stationsware ungleich null: '+id+'/'+ware;
  }
  for(const [ware,werte] of Object.entries(vor.ledger)){
    const neu=nach.ledger[ware];
    if(!neu||JSON.stringify(werte)!==JSON.stringify(neu))
      return 'Warenledger verändert: '+ware;
  }
  for(const [ware,werte] of Object.entries(nach.ledger))
    if(!Object.hasOwn(vor.ledger,ware)&&Object.values(werte).some(v=>v!==0))
      return 'Neue Warenledger-Buchung: '+ware;
  return null;
}
function untersuchen(json){
  if(typeof json!=='string'||json.length===0||json.length>5*1024*1024)
    return Object.freeze({ok:false,stufe:'Quelle',reason:'JSON fehlt oder ist größer als 5 MB',schritte:Object.freeze([])});
  let source;
  try{source=JSON.parse(json);}catch{return Object.freeze({ok:false,stufe:'Quelle',reason:'Ungültiges JSON',schritte:Object.freeze([])});}
  if(!source||Array.isArray(source)||source.rulesVersion!==195||source.schema!==8)
    return Object.freeze({ok:false,stufe:'Quelle',reason:'Nur Regel195/Schema8; keine automatische Migration',schritte:Object.freeze([])});
  const original=JSON.stringify(source),schritte=[];
  let aktuell=json,vor=null,letzte=null,kapital=null;
  for(const k of STUFEN){
    let x;
    try{
      x=k.run(aktuell);
      if(x?.welt?.regel!==k.nach||x.zustand?.rulesVersion!==k.nach
         ||x.welt.audit(x.zustand).ok!==true)throw Error('Zielwelt nicht vollständig auditiert');
      const buch=inventar(x.zustand);
      if(vor){
        const blocker=erhalt(vor,buch);
        if(blocker)throw Error(blocker);
      }
      if(x.nachweis){
        for(const [name,wahr] of Object.entries(x.nachweis))
          if(name.endsWith('Gleich')&&wahr!==true)throw Error('Quellerhalt verletzt: '+name);
      }
      if(JSON.stringify(source)!==original)throw Error('Original-JSON im Speicher verändert');
      schritte.push(Object.freeze({von:k.von,nach:k.nach,name:k.name,
        ok:true,hash:x.welt.hash(x.zustand),tick:x.zustand.tick,weltgeld:buch.gesamt}));
      aktuell=x.welt.save(x.zustand);vor=buch;letzte=x;
      if(x.kapital)kapital=x.kapital;
    }catch(e){
      return Object.freeze({ok:false,stufe:k.von+'→'+k.nach,reason:String(e.message||e),
        schritte:Object.freeze(schritte),originalUnveraendert:JSON.stringify(source)===original});
    }
  }
  // Ein aus Regel195 stammender Spielstand erhält hier keinen Gratisjäger.
  const gekaufte=letzte.zustand.kanon?.jaeger?.kaeufe?.filter(k=>k.owner==='house')||[];
  return Object.freeze({ok:true,stufe:'204',reason:null,
    schritte:Object.freeze(schritte),originalUnveraendert:true,
    weltgeld:vor.gesamt,hash:letzte.welt.hash(letzte.zustand),
    eigenerJägerGekauft:gekaufte.length>0,
    cockpitSofortNutzbar:gekaufte.length>0,
    hinweis:gekaufte.length?'Jäger-Kaufbeleg vorhanden':'Kein gekaufter Jäger: zuerst im autoritativen Core finanzieren',
    profil:kapital});
}
const API=Object.freeze({STUFEN:STUFEN.map(({von,nach,name})=>Object.freeze({von,nach,name})),
  untersuchen});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J7UebernahmeCheck=API;
})(typeof globalThis==='object'?globalThis:this);
