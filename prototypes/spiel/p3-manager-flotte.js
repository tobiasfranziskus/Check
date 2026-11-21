/* M4/S2: read-only ship-specific original J8 dispositions.
 * A green quote is not an authorization: the game rechecks J8 on every click.
 * No new command, economy, schedule or save field is introduced here.
 */
(function(scope){
'use strict';
const optionen=Object.freeze({
 'ice-':'Eisförderung beginnen',
 'stop-':'Eigene Förderung beenden',
 'freight-':'50 Eis bezahlt transportieren',
 'reposition-':'Eigene Werfthülle bezahlt nach Aldera überführen'
});
function auswerten(schiffe,angebote,auswahlId=null,schiffbericht=[]){
 if(!Array.isArray(schiffe)||!Array.isArray(angebote))
  throw TypeError('Flottendisposition benötigt eigene Schiffe und originale J8-Angebote');
 // Explicit owner check even when upstream map already exposes only own ships.
 const eigene=schiffe.filter(sh=>sh&&sh.owner==='house'&&typeof sh.id==='string');
 const gewählt=eigene.find(sh=>sh.id===auswahlId)||eigene[0]||null;
 if(!gewählt)return Object.freeze({schiffe:Object.freeze([]),auswahlId:null,schiff:null,aktionen:Object.freeze([])});
 const original=Array.isArray(schiffbericht)?schiffbericht.find(sh=>sh.id===gewählt.id):null;
 const prefixes=gewählt.klasse==='miner'?['ice-','stop-']:
  gewählt.klasse==='frachter'?['freight-','reposition-']:[];
 const aktionen=prefixes.flatMap(prefix=>{
  const id=prefix+gewählt.id;
  // Missing quote means missing offer, never a fabricated core blocking reason.
  const quote=angebote.find(a=>a.id===id);
  if(!quote)return [];
  const kosten=prefix==='reposition-'&&quote.ok===true&&Number.isSafeInteger(quote.kosten)
   ?quote.kosten:null;
  const minuten=prefix==='reposition-'&&quote.ok===true&&Number.isSafeInteger(quote.minuten)
   ?quote.minuten:null;
  return [Object.freeze({
   id,titel:optionen[prefix],ok:quote.ok===true,
   grund:quote.ok===true?null:String(quote.reason||'Originalauftrag derzeit gesperrt'),
   kosten,minuten
  })];
 });
 return Object.freeze({
  schiffe:Object.freeze(eigene.map(sh=>Object.freeze({id:sh.id,name:sh.name}))),
  auswahlId:gewählt.id,
  schiff:Object.freeze({
   id:gewählt.id,name:gewählt.name,ort:gewählt.ort,phase:gewählt.phase,
   stillgelegt:typeof original?.stillgelegt==='boolean'?original.stillgelegt:null,
   flug:gewählt.flug,ladung:gewählt.ladung,
   auftrag:gewählt.auftrag||'Kein laufender Wirtschaftsauftrag',
   buchwert:gewählt.buchwert
  }),
  aktionen:Object.freeze(aktionen)
 });
}
const api=Object.freeze({auswerten});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3ManagerFlotte=api;
})(globalThis);
