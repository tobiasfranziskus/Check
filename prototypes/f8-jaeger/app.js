/* F8: Browsersteuerung ausschliesslich fuer eine isolierte 2D-Fluguebung.
 * Keine Core-Physik im Renderer: alle Befehle an den gemeinsamen FlugKern.
 * Kein ISK, kein Kampf, kein Speicherzugriff, keine Emission, kein NPC-Eigentum.
 */
(function(scope){
'use strict';
const T=scope.F8JaegerTraining,G=scope.FlugGrafik,F=T.flug,$=id=>document.getElementById(id);
if(!T||!G)throw Error('F8: Original-Flugkern oder Grafik nicht geladen');
const canvas=$('raum'),ctx=canvas.getContext('2d'),graph=G.erstellen(ctx);
let s=T.neu(),laeuft=false,letztesBild=0,rueckstand=0,frame=0;
const sh=()=>s.ships[T.ID],body=()=>sh().flug,fmt=n=>Math.trunc(n).toLocaleString('de-DE');
const melden=t=>{$('meldung').textContent=t;};
function befehl(type,extra={}){
  const cmd={type,owner:'house',schiff:T.ID,...extra},r=T.befehl(s,cmd);
  if(!r.ok)melden('Core hat abgelehnt: '+r.reason);
  else melden('F6-Flugkern: '+type+' angenommen. Zustand: '+body().lage);
  anzeigen();
  return r;
}
function anzeigen(){
  const b=body(),v=T.status(s),sp=Math.trunc(Math.hypot(b.vx,b.vy));
  $('uhr').textContent=v.minuten+':'+String(v.sekunden%60).padStart(2,'0');
  $('geschwindigkeit').textContent=fmt(sp);
  $('entfernung').textContent=fmt(v.distanz);
  $('lage').textContent=v.lage;
  $('erfolg').textContent=v.erreicht===null?'Offen':'Erreicht bei '+v.erreicht+' s';
  $('zielHp').textContent=v.zielHp+' / '+T.TRAINING.maxHp;
  $('treffer').textContent=v.treffer+' / '+v.schuesse;
  $('pilotHp').textContent=v.pilotHp+' / '+T.DUELL.pilotMaxHp;
  $('duellErgebnis').textContent=v.duellErgebnis==='sieg'?'Duell gewonnen (Übung)'
    :v.duellErgebnis==='niederlage'?'Übungsjäger deaktiviert'
      :v.duellErgebnis==='aktiv'?'Duell läuft':'Zielübung';
  $('zielModus').value=v.zielModus;
  $('zielModus').disabled=s.sekunden!==0;
  $('bewegungStatus').textContent=(v.zielModus==='duell'
    ?'2D-Duell mit drohendem Gegenfeuer · '
    :v.zielModus==='beweglich'
    ?'Drohne in Bewegung (Kreisbahn) · ':'Drohne steht · ')
    +'Position '+fmt(v.zielPosition.x)+' / '+fmt(v.zielPosition.y)
    +'. Ziel erfassen dreht den Jäger zur aktuellen Position, ein Treffer braucht echte 2D-Projektilnähe.';
  $('kursWert').textContent=$('kurs').value;
  $('fahrtWert').textContent=$('fahrt').value;
  const verloren=v.duellErgebnis==='niederlage';
  $('steuern').disabled=$('bremsen').disabled=$('marke').disabled=$('andocken').disabled=
    b.lage!=='frei'||verloren;
  $('abdocken').disabled=b.lage!=='angedockt'||verloren;
  $('feuern').disabled=b.lage!=='frei'||verloren||v.zielHp===0||s.sekunden<v.naechsterSchuss;
  $('zielErfassen').disabled=b.lage!=='frei'||verloren||v.zielHp===0;
  $('schussStatus').textContent=verloren
    ?'Trainingsjäger im Duell deaktiviert. Keine weitere Steuerung; neue Übung erforderlich.'
    :v.zielHp===0
    ?'Trainingsziel deaktiviert – drei echte 2D-Treffer protokolliert; keine ISK/XP.'
    :s.sekunden<v.naechsterSchuss
      ?'Trainingswaffe lädt noch '+(v.naechsterSchuss-s.sekunden)+' Flugsekunden.'
      :'Trainingslaser bereit. Beim Schuss werden Position, Kurs und Projektilbahn im Kern geprüft.';
  $('start').disabled=laeuft;$('pause').disabled=!laeuft;
  malen();
}
function malen(){
  const box=canvas.getBoundingClientRect(),dpi=Math.min(2,scope.devicePixelRatio||1);
  const w=Math.max(1,Math.round(box.width*dpi)),h=Math.max(1,Math.round(box.height*dpi));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.setTransform(dpi,0,0,dpi,0,0);
  const breite=box.width,hoehe=box.height,b=body(),ziel=T.MARKER;
  const links=Math.min(0,b.x,ziel.x)-125000,rechts=Math.max(0,b.x,ziel.x)+125000;
  const oben=Math.min(0,b.y,ziel.y)-125000,unten=Math.max(0,b.y,ziel.y)+125000;
  const centerX=(links+rechts)/2,centerY=(oben+unten)/2;
  const zoom=Math.min(breite/(rechts-links),hoehe/(unten-oben));
  ctx.fillStyle='#040b15';ctx.fillRect(0,0,breite,hoehe);
  graph.himmel(centerX,centerY,zoom,breite,hoehe);
  const punkt=(x,y)=>G.projektion(x,y,centerX,centerY,zoom,breite,hoehe);
  const position=T.status(s).zielPosition,station=punkt(0,0),
    marke=punkt(ziel.x,ziel.y),drohne=punkt(position.x,position.y),fighter=punkt(b.x,b.y);
  ctx.save();
  ctx.strokeStyle='rgba(102,213,239,.24)';ctx.setLineDash([6,7]);
  ctx.beginPath();ctx.moveTo(...station);ctx.lineTo(...marke);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#91ccd7';ctx.beginPath();ctx.arc(...station,12,0,Math.PI*2);ctx.fill();
  // Zielmarke bleibt als Trainings-Anflugziel fest; die Drohne kann separat
  // entlang einer deterministischen Kreisbahn fliegen (kein NPC/keine Wirtschaft).
  ctx.strokeStyle='#668c9e';ctx.lineWidth=1;ctx.beginPath();
  ctx.arc(...marke,Math.max(8,ziel.radius*zoom),0,Math.PI*2);ctx.stroke();
  if(s.zielprobe.modus!=='stationaer'){
    ctx.strokeStyle='rgba(234,187,114,.30)';ctx.setLineDash([4,7]);
    ctx.beginPath();ctx.arc(...marke,T.TRAINING.orbitRadius*zoom,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle=s.zielprobe.hp===0?'#7d9da5':'#eabb72';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(...drohne,Math.max(11,T.TRAINING.abstand*zoom),0,Math.PI*2);ctx.stroke();
  ctx.fillStyle=s.zielprobe.hp===0?'#536c79':'#e6ad60';
  ctx.beginPath();ctx.arc(...drohne,5,0,Math.PI*2);ctx.fill();
  ctx.font='14px system-ui';ctx.fillStyle='#d7e7f5';
  ctx.fillText('Aldera-Dock',station[0]+14,station[1]-15);
  ctx.fillText('Flugmarke',marke[0]+7,marke[1]+18);
  ctx.fillText('Drohne · '+s.zielprobe.hp+' HP',drohne[0]-25,drohne[1]-20);
  // Gegenfeuer ist reiner Trainingszustand und benutzt den selben F6-Tick.
  ctx.fillStyle='#ff7878';
  for(const p of s.zielprobe.gegner.geschosse){
    const [px,py]=punkt(p.x,p.y);
    ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();
  }
  // Projektile sind echte, je Flugsekunde fortgeschriebene Ganzzahl-Kernobjekte,
  // keine Grafiktreffer und keine wirtschaftlichen Raumschiffe.
  ctx.fillStyle='#ffc985';
  for(const p of s.zielprobe.geschosse){
    const [px,py]=punkt(p.x,p.y);
    ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#88edff';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(...fighter,34,0,Math.PI*2);ctx.stroke();
  graph.schiff(G.adapter(sh()),fighter[0],fighter[1],0);
  ctx.restore();
}
function laufen(zeit){
  if(!laeuft)return;
  if(letztesBild===0)letztesBild=zeit;
  const delta=Math.min(250,Math.max(0,zeit-letztesBild));letztesBild=zeit;
  rueckstand+=delta;
  const schritte=Math.min(8,Math.floor(rueckstand/(1000/60)));
  if(schritte){T.schritt(s,schritte);rueckstand-=schritte*(1000/60)}
  if(schritte)anzeigen();
  if(T.status(s).duellErgebnis==='niederlage'){
    laeuft=false;letztesBild=0;rueckstand=0;
    melden('Übungsjäger deaktiviert: nur „Neue Übung“ startet einen frischen Trainingslauf.');
    anzeigen();
    return;
  }
  frame=requestAnimationFrame(laufen);
}
function starten(){if(laeuft)return;laeuft=true;letztesBild=0;rueckstand=0;anzeigen();frame=requestAnimationFrame(laufen)}
function stoppen(){laeuft=false;cancelAnimationFrame(frame);letztesBild=0;rueckstand=0;anzeigen()}
$('kurs').addEventListener('input',anzeigen);
$('fahrt').addEventListener('input',anzeigen);
$('steuern').addEventListener('click',()=>befehl('shipSteer',{kurs:Number($('kurs').value),fahrt:Number($('fahrt').value)}));
$('bremsen').addEventListener('click',()=>{$('fahrt').value='0';befehl('shipSteer',{kurs:body().kurs,fahrt:0})});
$('abdocken').addEventListener('click',()=>befehl('shipUndock'));
$('marke').addEventListener('click',()=>befehl('shipFlyTo',{x:T.MARKER.x,y:T.MARKER.y}));
$('andocken').addEventListener('click',()=>befehl('shipDock',{station:'st_aldera'}));
$('feuern').addEventListener('click',()=>befehl('fighterFire'));
$('zielModus').addEventListener('change',()=>befehl('fighterTargetMode',
  {modus:$('zielModus').value}));
$('zielErfassen').addEventListener('click',()=>{
  const v=T.status(s),b=body();
  if(b.lage!=='frei')return;
  const dx=v.zielPosition.x-b.x,dy=v.zielPosition.y-b.y;
  const kurs=F.richtungZu(dx,dy);
  $('kurs').value=String(kurs);$('fahrt').value='0';
  befehl('shipSteer',{kurs,fahrt:0});
});
$('start').addEventListener('click',starten);
$('pause').addEventListener('click',stoppen);
$('sekunde').addEventListener('click',()=>{stoppen();T.schritt(s,1);anzeigen()});
$('minute').addEventListener('click',()=>{stoppen();T.schritt(s,60);anzeigen()});
$('neu').addEventListener('click',()=>{stoppen();s=T.neu();$('kurs').value='0';$('fahrt').value='0';melden('Neue isolierte Fluguebung. Keine Wirtschafts- oder Spielstandaenderung.');anzeigen()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stoppen()});
scope.addEventListener('resize',malen);
scope.__f8=Object.freeze({
  zustand:()=>JSON.stringify(s),status:()=>T.status(s),audit:()=>T.audit(s),
  befehl:(type,extra={})=>befehl(type,extra),
  schritte:(n)=>{stoppen();T.schritt(s,n);anzeigen();return T.status(s)},
  neu:()=>{stoppen();s=T.neu();anzeigen()}
});
anzeigen();
})(globalThis);
