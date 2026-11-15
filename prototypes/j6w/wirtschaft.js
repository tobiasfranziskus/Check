/* Zustandsneutrale Angebote; alle Wirkungen und Ablehnungen aus dem Original-Core.
 * UMD: im Browser nach welt-kern.js laden. Kein DOM, eigener Tick oder Saveformat.
 */
(function(scope){
'use strict';
const formen=Object.freeze({
  siliconMineStart:['schiff'],siliconSell:['schiff'],
  shipUndock:['schiff'],shipDock:['schiff','station'],shipFlyTo:['schiff','x','y'],
  shipBuy:['station','klasse'],stationRefine:['station'],stationBuildParts:['station'],
  stationBuildFighter:['station'],industrialOreOffer:['miner','frachter'],
  industrialOreAcceptMine:[],industrialOreAcceptFreight:[],industrialOreAcceptYard:[],
  industrialOreCommit:[],industrialOreCancel:[],industrialOreBuildShip:[],
});
const kopie=x=>JSON.parse(JSON.stringify(x));
function erstellen(welt,akteur){
  if(welt?.regel!==204||typeof akteur!=='string')throw TypeError('J6-W benötigt Regel204 und einen festen Akteur');
  const r=welt.rules;
  function befehl(eingabe){
    if(!eingabe||typeof eingabe!=='object'||Array.isArray(eingabe)
      ||!Object.hasOwn(formen,eingabe.type))throw Error('Unbekannter Wirtschaftsauftrag');
    const felder=['type',...formen[eingabe.type]].sort();
    if(Object.keys(eingabe).sort().join()!==felder.join())throw Error('Unerlaubte Auftragsfelder (Eigentümer wird vom Kontext gesetzt)');
    for(const k of formen[eingabe.type]){
      if(['x','y'].includes(k)?!Number.isSafeInteger(eingabe[k]):typeof eingabe[k]!=='string')
        throw Error('Ungültiges Auftragsfeld '+k);
    }
    if(eingabe.type==='shipBuy'&&!['jaeger','frachter'].includes(eingabe.klasse))throw Error('Unzulässige Schiffsklasse');
    return {...eingabe,owner:akteur};
  }
  function geprueft(s){
    const c=welt.load(welt.canonical(s));
    if(!Object.hasOwn(c.owners,akteur))throw Error('Unbekannter Akteur');
    return c;
  }
  function angebot(s,eingabe){
    try{
      const cmd=befehl(eingabe),probe=geprueft(s),hash=welt.hash(probe);
      const ergebnis=welt.execute(probe,cmd);
      return {ok:ergebnis.ok,reason:ergebnis.reason||null,hash,tick:s.tick,
        befehl:cmd,ergebnis,
        // Nur tatsächlich vom Originalbefehl jetzt gebuchte Geldbewegungen.
        zahlungen:Object.keys(probe.owners).sort().flatMap(id=>{
          const vorher=s.owners[id]?.cash||0,nachher=probe.owners[id].cash;
          return vorher===nachher?[]:[{owner:id,vorher,nachher,delta:nachher-vorher}];
        })};
    }catch(e){return {ok:false,reason:e.message};}
  }
  function ausfuehren(s,eingabe){
    // Alte/gefälschte Angebote werden niemals als Berechtigung übernommen.
    const a=angebot(s,eingabe);
    if(!a.ok)return {ok:false,reason:a.reason};
    return welt.execute(s,a.befehl);
  }
  function lage(s){
    const c=geprueft(s);
    return kopie({tick:c.tick,hash:welt.hash(c),akteur,
      konten:c.owners,stationen:c.stations,schiffe:c.ships,
      // Kassen sind unmittelbar ausgebbares Geld; Treuhand ist ein separates Konto.
      finanzierung:welt.industriePreise,
      regeln:{silizium:r.j2b,bauteile:r.j3,jaeger:r.j4,raffinerie:r.w4,werft:r.w5},
      auftraege:{silizium:c.kanon.silizium,bauteile:c.kanon.bauteile,
        jaeger:c.kanon.jaeger,erz:c.kanon.industrieErz,fracht:c.w3,
        raffinerie:c.w4,werft:c.w5,flug:c.kanon.flugdienst},
    });
  }
  function angebote(s){
    const l=lage(s),anfragen=[];
    for(const type of ['stationRefine','stationBuildParts','stationBuildFighter'])anfragen.push({type,station:r.j4.station});
    for(const type of ['industrialOreAcceptMine','industrialOreAcceptFreight','industrialOreAcceptYard',
      'industrialOreCommit','industrialOreCancel','industrialOreBuildShip'])anfragen.push({type});
    for(const [klasse,station] of [['jaeger',r.j4.station],['frachter',r.w3.quellStation],['frachter',r.j4.station]])anfragen.push({type:'shipBuy',klasse,station});
    for(const sh of Object.values(l.schiffe).filter(sh=>sh.owner===akteur&&sh.klasse==='miner')){
      for(const type of ['siliconMineStart','siliconSell','shipUndock','shipDock'])anfragen.push({type,schiff:sh.id,...(type==='shipDock'?{station:r.world.systems[sh.system].station}:{})});
      anfragen.push({type:'shipFlyTo',schiff:sh.id,x:r.j2b.feld.x,y:r.j2b.feld.y});
    }
    // Kein stiller Schiffswähler: alle konkreten Kandidaten samt Core-Sperre zeigen.
    if(akteur===r.j4.owner)for(const mi of Object.values(l.schiffe).filter(x=>x.klasse==='miner'&&x.owner==='npc3'))
      for(const fr of Object.values(l.schiffe).filter(x=>x.klasse==='frachter'&&x.owner==='transport'))
        anfragen.push({type:'industrialOreOffer',miner:mi.id,frachter:fr.id});
    return anfragen.map(anfrage=>({anfrage,...angebot(s,anfrage)}));
  }
  return Object.freeze({angebot,angebote,ausfuehren,lage});
}
const api=Object.freeze({erstellen});
if(typeof module==='object'&&module.exports)module.exports=api;else scope.J6wWirtschaft=api;
})(globalThis);
