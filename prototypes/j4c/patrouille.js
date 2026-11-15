/* J4d [DRAFT] – freiwillige 2D-Patrouille mit realem Regel204-Spielerjäger.
 * Nur Beobachter des autoritativen Welt-/F6-Körpers, KEINE eigene Physik/Uhr/Wirtschaft.
 * Fortschritt ist absichtlich NICHT im Welt-Save und erzeugt keinerlei Geld, XP oder Güter.
 */
(function (scope) {
'use strict';
const TORE = Object.freeze([
  Object.freeze({name:'Außenposten Alpha',x:220000,y:-145000,radius:24000,maxTempo:300}),
  Object.freeze({name:'Kontrollboje Beta',x:-260000,y:90000,radius:24000,maxTempo:300}),
  Object.freeze({name:'Sektor Gamma',x:70000,y:230000,radius:24000,maxTempo:300})
]);
const STATION = Object.freeze({name:'Nadir-Dock',x:0,y:0});
const uhr = s => s.tick*60+s.flug.schritt;
const abstand = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const tempo = b => Math.hypot(b.vx,b.vy);
function schiffPruefen(s,id) {
  const sh=s?.ships?.[id];
  if(s?.rulesVersion!==204||!sh||sh.id!==id||sh.owner!=='house'||
     sh.klasse!=='jaeger'||sh.system!=='nadir'||
     !s.kanon?.jaeger?.kaeufe?.some(k=>k.id===id&&k.owner==='house'&&k.station==='st_nadir'))
    throw Error('Patrouille erfordert einen im Regel204-Kern gekauften Spielerjäger');
  return sh;
}
function beginnen(s,id) {
  const sh=schiffPruefen(s,id),b=sh.flug;
  if(b?.lage!=='angedockt'||b.anker!=='st_nadir')
    throw Error('Patrouille muss am echten Nadir-Dock beginnen');
  const t=uhr(s);
  if(!Number.isSafeInteger(t)||t<0)throw Error('Ungültige Weltzeit');
  return {schiff:id,status:'bereit',stufe:0,gestartet:t,letzter:t,
    weg:0,vorher:{x:b.x,y:b.y},ausgedockt:false,kontrollen:[]};
}
function ziel(p) {
  if(!p||p.stufe<0||p.stufe>TORE.length)throw Error('Ungültige Patrouillenstufe');
  return p.stufe===TORE.length?STATION:TORE[p.stufe];
}
function beobachten(p,s) {
  if(!p||!['bereit','flug'].includes(p.status))return p;
  const sh=schiffPruefen(s,p.schiff),b=sh.flug,t=uhr(s);
  if(t===p.letzter)return p;
  if(!Number.isSafeInteger(t)||t!==p.letzter+1) {
    p.status='unterbrochen';return p;
  }
  p.letzter=t;
  p.weg+=Math.round(abstand(p.vorher,b));
  p.vorher={x:b.x,y:b.y};
  if(b.lage==='frei'){p.ausgedockt=true;p.status='flug';}
  if(p.ausgedockt&&b.lage==='angedockt'){
    p.status=p.stufe===TORE.length&&b.anker==='st_nadir'?'erfolgreich':'abgebrochen';
    return p;
  }
  if(b.lage==='frei'&&p.stufe<TORE.length){
    const marke=TORE[p.stufe];
    if(abstand(b,marke)<=marke.radius&&tempo(b)<=marke.maxTempo){
      p.kontrollen.push({name:marke.name,sekunde:t-p.gestartet,x:b.x,y:b.y,
        tempo:Math.round(tempo(b))});
      p.stufe++;
    }
  }
  return p;
}
function stand(p) {
  if(!p)return {status:'nicht gestartet',ziel:TORE[0].name,zeit:0,weg:0,erreicht:0};
  return {status:p.status,ziel:ziel(p).name,zeit:p.letzter-p.gestartet,
    weg:p.weg,erreicht:p.kontrollen.length};
}
const API=Object.freeze({TORE,STATION,beginnen,beobachten,ziel,stand});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J4dPatrouille=API;
})(typeof globalThis==='object'?globalThis:this);
