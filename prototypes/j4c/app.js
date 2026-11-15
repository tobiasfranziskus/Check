/* Aphros Void J4c, reines Forschungs-Cockpit. EIN autoritativer Rule204-Weltzustand.
 * Kein lokales Autosave, keine Spawn-Funktion. Import NUR aus vollem, auditiertem JSON.
 */
(()=>{'use strict';
const W=globalThis.AphrosWelt, Kurs=globalThis.J4dPatrouille, Kampf=globalThis.J4eDuell, Lage=globalThis.J5KonzernLage;
if(!W||!Kurs||!Kampf||!Lage)throw Error('J5: Original-Welt, F6, F8 oder reine Konzernprojektion fehlen');
const $=id=>document.getElementById(id),canvas=$('raum'),ctx=canvas.getContext('2d');
let welt=null,weltzustand=null,pilot=null,aktion=null,ursprung='',spielt=false,geschw=45,patrouille=null,duell=null,ansicht='cockpit';
// RAUM-1: optionale dritte Ansicht derselben Sitzung. Fehlt das Modul oder Canvas, bleibt das Steuerpult vollständig nutzbar.
let raum=null,vorherige='cockpit',schrittzaehler=0,journal=[],journalVoll=true;
const JOURNAL_MAX=50000;
const meldung=(text,fehler=false)=>{$('meldung').textContent=text;$('meldung').className=fehler?'fehler':'';};
const geld=()=>Object.values(weltzustand.owners).reduce((n,o)=>n+o.cash,0);
function passendenJaeger(s){
 const ids=new Set((s.kanon?.jaeger?.kaeufe||[]).filter(b=>b.owner==='house').map(b=>b.id));
 return Object.values(s.ships).find(sh=>ids.has(sh.id)&&sh.owner==='house'
   &&sh.klasse==='jaeger'&&sh.system==='nadir');
}
const format=n=>Number(n).toLocaleString('de-DE');
// Kein zweiter Controller/Weltzustand: alle Tabellen lesen ausschließlich weltzustand.
function tabellenzeilen(id,eintraege,werte){
 const body=$(id);
 const zeilen=eintraege.map(e=>{
  const tr=document.createElement('tr');
  for(const wert of werte(e)){
   const td=document.createElement('td');
   td.textContent=String(wert); // niemals fremde Konto-/Schiffsdaten als HTML parsen
   tr.append(td);
  }
  return tr;
 });
 body.replaceChildren(...zeilen);
}
function anzeigeKonzern(){
 if(!welt||!weltzustand){
  $('konzern-hinweis').textContent='Bitte zuerst einen finanzierten Jägerstand im Cockpit laden.';
  for(const id of ['konzern-schiffe','konzern-stationen','konzern-betriebe'])$(id).replaceChildren();
  return;
 }
 const k=Lage.erzeugen(weltzustand,pilot);
 $('konzern-hinweis').textContent='Aktiver eigener Jäger '+k.pilot+' · Regel '+k.regel+
  ' · nur lesende Ansicht des Originalzustands';
 $('konzern-cash').textContent=format(k.spielerkasse)+' ISK';
 $('konzern-pilotcash').textContent=format(k.pilotenkasse)+' ISK';
 $('konzern-eignercash').textContent=format(k.eigentuemerhaushalt)+' ISK';
 $('konzern-reserve').textContent=format(k.fluglohnreserve)+' ISK';
 $('konzern-weltgeld').textContent=format(k.weltgeld)+' ISK';
 $('konzern-tick').textContent=format(k.tick)+' min + '+k.sekunde+' s';
 tabellenzeilen('konzern-schiffe',k.schiffe,
  sh=>[sh.id,sh.klasse+' · '+sh.system,sh.lage,sh.ladung]);
 tabellenzeilen('konzern-stationen',k.stationen,
  st=>[st.id+' · '+st.system,st.lager]);
 tabellenzeilen('konzern-betriebe',k.betriebskassen,
  b=>[b.id,format(b.cash)+' ISK']);
 anzeigeSpielerWirtschaft();
}
// J6-W: ausschließlich eigene, legitim verfügbare Wirtschaftsbefehle in der Konzernansicht.
// Alle NPC-/Stationsfirmen bleiben getrennte Entscheidungsträger. Das aktuelle Angebot ist
// unverbindlich; der Original-Core validiert unmittelbar vor jeder Buchung erneut.
function anzeigeSpielerWirtschaft(){
 const feld=$('j6-w-angebote'), info=$('j6-w-nadir');
 if(!feld||!info||!welt||!weltzustand)return;
 const API=globalThis.J6wWirtschaft;
 if(!API){feld.textContent='Wirtschafts-API nicht geladen';return;}
 try {
  const house=API.erstellen(welt,'house'),nadir=API.erstellen(welt,'st_nadir');
  const l=house.lage(weltzustand),regeln=l.regeln.jaeger;
  const material=weltzustand.stations.st_nadir.lager;
  info.textContent='Nadir-Werft (fremder Eigentümer): '+(material.jaeger||0)+' fertige Jäger im Lager · '
   +(material.bauteil||0)+' Bauteile · '+(material.material||0)+' Material. '
   +'Neubau: '+regeln.bauteile+' Bauteile + '+regeln.material+' Material + '+regeln.dauer
   +' bezahlte Minuten. '+nadir.angebot(weltzustand,{type:'stationBuildFighter',station:'st_nadir'}).reason
   +'. Stationsaufträge sind keine Spielerbefehle.';
  const daten=[
   ['Siliziumauftrag · eigener Miner sh022',{type:'siliconMineStart',schiff:'sh022'}],
   ['Silizium nach Rückdockung verkaufen',{type:'siliconSell',schiff:'sh022'}],
   ['Jäger in Nadir kaufen (900 ISK)',{type:'shipBuy',station:'st_nadir',klasse:'jaeger'}],
   ['Vorhandenen Frachter in Nadir kaufen',{type:'shipBuy',station:'st_nadir',klasse:'frachter'}],
  ];
  const nodes=[];
  for(const [bezeichnung,anfrage] of daten){
   const angebot=house.angebot(weltzustand,anfrage);
   const zeile=document.createElement('div');zeile.className='j6-w-zeile';
   const taste=document.createElement('button');taste.type='button';taste.textContent=bezeichnung;
   taste.disabled=!angebot.ok;taste.className=angebot.ok?'primary':'';
   const status=document.createElement('span');status.className='note';
   status.textContent=angebot.ok?'Finanziert und nach Original-Core zulässig':'Gesperrt: '+(angebot.reason||'Core-Gate');
   taste.addEventListener('click',()=>{
    if(ansicht!=='konzern'||spielt){meldung('Wirtschaftsbefehl nur bei angehaltener Konzernansicht',true);return;}
    const akt=API.erstellen(welt,'house').angebot(weltzustand,anfrage);
    if(!akt.ok){meldung('Auftrag nicht mehr zulässig: '+akt.reason,true);anzeigen();return;}
    const ergebnis=weltBefehl(akt.befehl);
    meldung(ergebnis.ok?'Echter Spielerauftrag ausgeführt: '+bezeichnung
      :'Core-Sperre: '+ergebnis.reason,!ergebnis.ok);
    anzeigen();
   });
   zeile.append(taste,status);nodes.push(zeile);
  }
  feld.replaceChildren(...nodes);
 }catch(e){feld.textContent='Wirtschaftsübersicht konnte nicht auditiert werden: '+e.message;}
}

function wechseln(ziel){
 if(!['cockpit','konzern','raum'].includes(ziel)||ziel===ansicht)return;
 if(ziel==='raum'&&!raum)return;
 // Niemals unbemerkt hinter einer verdeckten Flugansicht simulieren.
 if(spielt){
  spielt=false;$('play').textContent='Flugzeit starten';
 }
 if(ansicht==='raum')raum.deaktivieren();
 if(ansicht!=='konzern')vorherige=ansicht;
 ansicht=ziel;
 $('spielbereich').hidden=ziel!=='cockpit';
 $('konzernbereich').hidden=ziel!=='konzern';
 $('raumbereich').hidden=ziel!=='raum';
 $('ansicht-cockpit').setAttribute('aria-pressed',String(ziel==='cockpit'));
 $('ansicht-konzern').setAttribute('aria-pressed',String(ziel==='konzern'));
 $('ansicht-raum').setAttribute('aria-pressed',String(ziel==='raum'));
 $('konzern-zurueck').textContent=vorherige==='raum'?'Zum gleichen Raumcockpit zurück':'Zum gleichen Jägercockpit zurück';
 if(ziel==='raum')raum.aktivieren();
 anzeigen();
}
// Einziger Weg, auf dem Ansichten Weltzeit vergehen lassen: ganze Original-Teilschritte samt Beobachtern.
function weltSchritte(n){
 let minuten=0;
 for(let i=0;i<n;i++){
  if(welt.teilschritt(weltzustand)!==null)minuten++;
  schrittzaehler++;
  if(patrouille)Kurs.beobachten(patrouille,weltzustand);
  if(duell)Kampf.beobachten(welt,weltzustand,duell);
 }
 return minuten;
}
// Einziger Weg für Kernbefehle aller Ansichten; der Flugschreiber hält die Folge für ein Replay fest.
function weltBefehl(cmd){
 const r=welt.execute(weltzustand,cmd);
 if(journal.length<JOURNAL_MAX)journal.push({schritt:schrittzaehler,cmd:{...cmd},ok:r.ok});
 else journalVoll=false;
 return r;
}
function laden(json,freigabe){
 try{
  if(typeof json!=='string'||json.length>5*1024*1024)throw Error('JSON zu groß oder leer');
  const raw=JSON.parse(json),p=raw?.w5ad?.profile;
  if(!p||![p.carrierCash,p.buyerCash].every(x=>Number.isSafeInteger(x)&&x>=0))
    throw Error('Kein gültiges J4b/J4c-Finanzprofil');
  let neu;
  if(raw.rulesVersion===203){
   if(!freigabe)throw Error('Regel203 erfordert ausdrückliche Forschungsübernahme');
   neu=W.ausRegel203J4c(json);
  }else if(raw.rulesVersion===204){
   const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
   neu={welt:w,zustand:w.load(json),quellHash:w.hash(raw)};
  }else throw Error('Nur Forschungssaves 203 und 204 werden akzeptiert');
  const sh=passendenJaeger(neu.zustand);
  if(!sh)throw Error('Kein tatsächlich für 900 ISK gekaufter Spieler-Jäger im Save');
  if(!neu.welt.audit(neu.zustand).ok)throw Error('K1/J4-Audit nicht bestanden');
  // Atomarer Sitzungswechsel: erst den *neuen* Weltstand vollständig validieren,
  // dann ausdrücklich vor Verlust einer ungesicherten aktuellen Sitzung warnen.
  if(welt&&!window.confirm('Der neue, geprüfte Jägerstand ersetzt die aktuelle Sitzung im Arbeitsspeicher. '
    +'Bitte den bisherigen Stand zuerst mit „Geprüften JSON-Spielstand exportieren“ sichern. '
    +'Jetzt wirklich zur neuen Sitzung wechseln?')){
   $('datei').value='';
   meldung('Sitzungswechsel abgebrochen; deine bisherige Jägersitzung bleibt unverändert.');
   anzeigen();return false;
  }
  welt=neu.welt;weltzustand=neu.zustand;pilot=sh.id;ursprung=neu.quellHash;
  schrittzaehler=0;journal=[];journalVoll=true;
  spielt=false;$('play').textContent='Flugzeit starten';aktion=null;patrouille=null;duell=null;
  $('datei').value='';$('unterschrift').hidden=true;
  meldung('Geprüfter, real bezahlter Jäger '+pilot+' geladen · Quellhash '+ursprung);
  if(raum)raum.sitzungGewechselt();
  anzeigen();return true;
 }catch(e){
  // Nie den vorherigen validen Weltstand oder seine Spielzeit/Flugmission
  // durch fehlerhafte Dateien/Importe/Netzantworten auf null zurücksetzen.
  $('datei').value='';
  meldung('Laden abgebrochen: '+e.message+' · Vorherige Sitzung erhalten.',true);
  anzeigen();return false;
 }
}
function befehl(typ,extra={}){
 if(!welt||!pilot){meldung('Zuerst einen echten J4b-/J4c-Spielstand laden',true);return;}
 const r=weltBefehl({type:typ,owner:'house',schiff:pilot,...extra});
 if(!r.ok){meldung('Befehl abgelehnt: '+r.reason,true);return;}
 meldung(typ+' bestätigt · Eigentümer house · '+pilot);
 anzeigen();
}
function anzeigeFlug(){
 if(!welt||!pilot)return;
 const sh=weltzustand.ships[pilot],b=sh.flug;
 const dienst=weltzustand.kanon.flugdienst[pilot];
 $('schiff').textContent=pilot+' · '+sh.klasse+' · '+sh.owner;
 $('lage').textContent=b.lage;
 $('ort').textContent=format(b.x)+' / '+format(b.y);
 $('fahrt').textContent=format(Math.round(Math.hypot(b.vx,b.vy)))+' P/s';
 $('kurs').textContent=b.kurs+' / 256';
 $('kurswert').value=b.sollKurs;$('tempo').value=b.sollFahrt;
 $('kursanzeige').textContent=b.sollKurs;
 $('tempoanzeige').textContent=b.sollFahrt+' %';
 $('tick').textContent=format(weltzustand.tick)+' min + '+weltzustand.flug.schritt+' s';
 $('weltgeld').textContent=format(geld())+' ISK';
 $('cash').textContent=format(weltzustand.owners.house.cash)+' ISK';
 $('pilotgeld').textContent=format(weltzustand.owners.pilot_house.cash)+' ISK';
 $('reserve').textContent=format(dienst?weltzustand.owners[dienst.konto].cash:0)+' ISK';
 $('wert').textContent=format(welt.buchwert(weltzustand,pilot))+' ISK';
 $('verschleiss').textContent=format(weltzustand.kanon.verschleiss[pilot]||0)+' min';
 $('hps').textContent='Keine echten Kampftreffer implementiert';
 $('andocken').disabled=b.lage!=='frei';
 $('abdocken').disabled=b.lage!=='angedockt';
 $('ziel').disabled=b.lage!=='frei';
 $('steuern').disabled=b.lage!=='frei';
 $('patrouille-start').disabled=b.lage!=='angedockt'||duell?.status==='aktiv';
 $('patrouille-ziel').disabled=!patrouille||!['bereit','flug'].includes(patrouille.status)||b.lage!=='frei';
 const p=Kurs.stand(patrouille);
 $('patrouille-status').textContent=p.status;
 $('patrouille-fortschritt').textContent=p.erreicht+' / '+Kurs.TORE.length;
 $('patrouille-naechstes').textContent=p.ziel;
 $('patrouille-zeit').textContent=format(p.zeit)+' s · '+format(p.weg)+' P';
 const d=Kampf.stand(duell);
 $('duell-start').disabled=b.lage!=='frei'||duell?.status==='aktiv'
   ||(patrouille&&['bereit','flug'].includes(patrouille.status));
 $('duell-anflug').disabled=!duell||duell.status!=='aktiv'||b.lage!=='frei';
 $('duell-ziel').disabled=!duell||duell.status!=='aktiv'||b.lage!=='frei';
 $('duell-feuer').disabled=!duell||duell.status!=='aktiv'||b.lage!=='frei';
 $('duell-status').textContent=d.status;
 $('duell-hp').textContent=d.pilotHp+' / 96 (nur Training)';
 $('duell-zielhp').textContent=d.zielHp+' / 135 (nur Training)';
 $('duell-treffer').textContent=d.treffer+' / 3';
 $('duell-gegentor').textContent=d.gegnerTreffer+' / 4';
 $('duell-sekunden').textContent=format(d.sekunden)+' s';
 $('duell-distanz').textContent=format(Math.round(Math.hypot(d.ziel.x-b.x,d.ziel.y-b.y)))+' P';
 $('duell-sektor').textContent=format(Math.round(Math.hypot(Kampf.TREFFER.K.zielX-b.x,Kampf.TREFFER.K.zielY-b.y)))+' P';
 $('patrouille-ziel').textContent=patrouille?.stufe===Kurs.TORE.length?'Original-F6: Nadir andocken':'Original-F6: nächstes Ziel anfliegen';
 const audit=welt.audit(weltzustand);
 $('audit').textContent=audit.ok?'Wirtschaft / Waren / Eigentum / Flug: OK':'AUDITFEHLER: '+audit.fehler.join('; ');
 $('audit').className=audit.ok?'':'fehler';
 if(!audit.ok)spielt=false;
}
function zeichnen(){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 const cw=Math.max(280,Math.floor(rect.width*dpr)),ch=Math.max(240,Math.floor(rect.height*dpr));
 if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
 const w=cw,h=ch;ctx.fillStyle='#081326';ctx.fillRect(0,0,w,h);
 // Fixsternpunkte: rein visuelle deterministische Projektion, niemals Simulation/RNG.
 const sh=pilot&&weltzustand?.ships[pilot],b=sh?.flug;
 const pos=b||{x:0,y:0};
 for(let i=1;i<=110;i++){
  const px=(((i*7193)%991)*w/991-pos.x/95000*w/991+w*3)%w;
  const py=(((i*9293)%997)*h/997-pos.y/95000*h/997+h*3)%h;
  ctx.fillStyle=i%7===0?'#a9c9e4':'#58799e';ctx.fillRect(px,py,Math.max(1,dpr*(i%6===0?2:1)),Math.max(1,dpr));
 }
 const scale=Math.min(w,h)/560000;
 function point(x,y){return [w/2+(x-pos.x)*scale,h/2+(y-pos.y)*scale];}
 const [sx,sy]=point(0,0);
 ctx.strokeStyle='#55f7d0';ctx.lineWidth=2*dpr;
 if(sx>=-35&&sx<=w+35&&sy>=-35&&sy<=h+35){
  ctx.strokeRect(sx-15*dpr,sy-15*dpr,30*dpr,30*dpr);
  ctx.font=(12*dpr)+'px system-ui';ctx.fillStyle='#95fee1';ctx.fillText('NADIR · STATION',sx+24*dpr,sy-18*dpr);
 }
 for(let i=0;i<Kurs.TORE.length;i++){
  const marke=Kurs.TORE[i], [mx,my]=point(marke.x,marke.y);
  const offen=!!patrouille&&patrouille.stufe===i&&['bereit','flug'].includes(patrouille.status);
  ctx.strokeStyle=patrouille&&i<patrouille.stufe?'#67e0b2':offen?'#ffe39d':'#6c849f';
  ctx.lineWidth=(offen?3:1.6)*dpr;
  ctx.beginPath();ctx.arc(mx,my,10*dpr,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#dce9f8';ctx.font=(11*dpr)+'px system-ui';
  ctx.fillText((i+1)+'. '+marke.name,mx+13*dpr,my-9*dpr);
 }
 if(duell){
  const d=Kampf.stand(duell),[ex,ey]=point(d.ziel.x,d.ziel.y);
  ctx.strokeStyle='#f46bb7';ctx.lineWidth=3*dpr;ctx.beginPath();
  ctx.arc(ex,ey,19*dpr,0,Math.PI*2);ctx.stroke();
  ctx.font=(11*dpr)+'px system-ui';ctx.fillStyle='#f5b3da';
  ctx.fillText('F8-E VIRTUELLE DROHNE · '+d.zielHp+' HP',ex+22*dpr,ey-12*dpr);
  for(const p of d.projektile){
   const [x,y]=point(p.x,p.y);
   ctx.fillStyle='#67f6ff';ctx.beginPath();ctx.arc(x,y,4*dpr,0,Math.PI*2);ctx.fill();
  }
  for(const p of d.gegnerGeschosse){
   const [x,y]=point(p.x,p.y);
   ctx.fillStyle='#ff8578';ctx.beginPath();ctx.arc(x,y,5*dpr,0,Math.PI*2);ctx.fill();
  }
 }
 if(b){
  ctx.save();ctx.translate(w/2,h/2);ctx.rotate(b.kurs*Math.PI/128);
  ctx.fillStyle='#ffe39d';ctx.strokeStyle='#fff';
  ctx.beginPath();ctx.moveTo(19*dpr,0);ctx.lineTo(-12*dpr,-10*dpr);ctx.lineTo(-8*dpr,0);
  ctx.lineTo(-12*dpr,10*dpr);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 ctx.font=(11*dpr)+'px system-ui';ctx.fillStyle='#c1d6e9';ctx.fillText('EIN ZUSTAND · ECHTE F6-KINEMATIK · KEIN TREIBSTOFF',12*dpr,18*dpr);
}
function anzeigen(){anzeigeFlug();if(ansicht==='konzern')anzeigeKonzern();else if(ansicht==='raum')raum.anzeigen();else zeichnen();}
$('ansicht-cockpit').addEventListener('click',()=>wechseln('cockpit'));
$('ansicht-konzern').addEventListener('click',()=>wechseln('konzern'));
$('ansicht-raum').addEventListener('click',()=>wechseln('raum'));
$('konzern-zurueck').addEventListener('click',()=>wechseln(vorherige));
$('beispiel').addEventListener('click',async()=>{
 const knopf=$('beispiel');
 knopf.disabled=true;meldung('Echten finanzierten Jägerstand laden und unabhängig prüfen …');
 try{
  const res=await fetch('beispiel-jaeger-seed42.json',{cache:'no-store'});
  if(!res.ok)throw Error('Beispielwelt fehlt ('+res.status+'). Kein Ersatzjäger wird erzeugt.');
  const json=await res.text();
  laden(json,false);
 }catch(e){meldung('Beispiel nicht verfügbar: '+e.message,true);}
 finally{knopf.disabled=false;}
});
$('datei').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{
  if(f.size>5*1024*1024)throw Error('Datei über 5 MB');
  const json=await f.text(),v=JSON.parse(json).rulesVersion;
  if(v===203){
   $('unterschrift').hidden=false;aktion=json;
   meldung('Regel203 erkannt. Bitte die getrennte Forschungsübernahme ausdrücklich bestätigen.');
  }else{aktion=null;laden(json,false);}
 }catch(err){
  aktion=null;$('unterschrift').hidden=true;$('datei').value='';
  meldung('Import abgebrochen: '+err.message+' · Vorherige Sitzung erhalten.',true);
 }
});
$('uebernahme').addEventListener('click',()=>{if(aktion)laden(aktion,true);});
function patrouilleStarten(){
 try {
  if(duell?.status==='aktiv')throw Error('Zuerst Trainingsduell beenden');
  if(!welt||!pilot)throw Error('Zuerst echten finanzierten Jäger laden');
  patrouille=Kurs.beginnen(weltzustand,pilot);
  return {ok:true};
 }catch(e){return {ok:false,reason:e.message};}
}
$('patrouille-start').addEventListener('click',()=>{
 const r=patrouilleStarten();
 if(r.ok){
  meldung('Patrouille vorbereitet. Echt abdocken und dann die drei Kontrollbojen bei maximal 300 P/s erreichen.');
  anzeigen();
 }else meldung('Patrouille abgelehnt: '+r.reason,true);
});
$('patrouille-ziel').addEventListener('click',()=>{
 if(!patrouille||!['bereit','flug'].includes(patrouille.status))return;
 const z=Kurs.ziel(patrouille);
 if(patrouille.stufe===Kurs.TORE.length)befehl('shipDock',{station:'st_nadir'});
 else befehl('shipFlyTo',{x:z.x,y:z.y});
});
function duellStarten(){
 try{
  if(patrouille&&['bereit','flug'].includes(patrouille.status))
   throw Error('Laufende Patrouille muss zuerst beendet werden');
  duell=Kampf.beginnen(welt,weltzustand,pilot);
  return {ok:true};
 }catch(e){return {ok:false,reason:e.message};}
}
$('duell-start').addEventListener('click',()=>{
 const r=duellStarten();
 if(r.ok){
  meldung('Original-F8-E-Duell auf dem bezahlten Jäger gestartet. Zuerst zur virtuellen Drohne fliegen, physisch ausrichten und selbst feuern.');
  anzeigen();
 }else meldung('Duellstart verweigert: '+r.reason,true);
});
$('duell-anflug').addEventListener('click',()=>{
 if(!duell||duell.status!=='aktiv')return;
 befehl('shipFlyTo',{x:Kampf.TREFFER.K.zielX,y:Kampf.TREFFER.K.zielY});
});
$('duell-ziel').addEventListener('click',()=>{
 if(!duell||duell.status!=='aktiv')return;
 const z=Kampf.stand(duell).ziel,b=weltzustand.ships[pilot].flug;
 const kurs=globalThis.FlugKern.richtungZu(z.x-b.x,z.y-b.y);
 befehl('shipSteer',{kurs,fahrt:0});
});
$('duell-feuer').addEventListener('click',()=>{
 const r=Kampf.feuern(welt,weltzustand,duell);
 meldung(r.ok?'F8-E-Trainingsprojektil gestartet · Schuss '+r.schuss
   :'Schuss gesperrt: '+r.reason,!r.ok);
 anzeigen();
});
$('abdocken').addEventListener('click',()=>befehl('shipUndock'));
$('andocken').addEventListener('click',()=>befehl('shipDock',{station:'st_nadir'}));
$('ziel').addEventListener('click',()=>befehl('shipFlyTo',{x:220000,y:-145000}));
$('steuern').addEventListener('click',()=>befehl('shipSteer',{kurs:Number($('kurswert').value),fahrt:Number($('tempo').value)}));
$('kurswert').addEventListener('input',()=>{$('kursanzeige').textContent=$('kurswert').value;});
$('tempo').addEventListener('input',()=>{$('tempoanzeige').textContent=$('tempo').value+' %';});
$('play').addEventListener('click',()=>{
 if(!welt)return meldung('Zuerst original bezahlten Jäger laden',true);
 spielt=!spielt;$('play').textContent=spielt?'Flugzeit pausieren':'Flugzeit starten';
});
function exportieren(){
 if(!welt)return meldung('Kein geprüfter Weltstand geladen',true);
 try{
  const data=welt.save(weltzustand),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='aphros-j4c-regel204-'+weltzustand.tick+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  meldung('Original-geprüfter Weltstand exportiert. Produktive Saves unberührt.');
 }catch(e){meldung('Sicherung abgelehnt: '+e.message,true);}
}
$('export').addEventListener('click',exportieren);
setInterval(()=>{
 if(!spielt||!welt||ansicht!=='cockpit')return;
 try{
  weltSchritte(geschw);
  anzeigen();
 }catch(e){spielt=false;$('play').textContent='Flugzeit starten';meldung('Welt angehalten: '+e.message,true);}
},700);
// RAUM-1: Brücke zur grafischen Ansicht. Sie erhält keinen eigenen Zustand, nur Zugriff auf diese eine Sitzung.
if(globalThis.RaumCockpit&&globalThis.RaumSzene&&globalThis.RaumGrafik&&$('raumbereich')){
 try{
  raum=globalThis.RaumCockpit.verbinden({
   welt:()=>welt,zustand:()=>weltzustand,jaeger:()=>pilot,bojen:Kurs.TORE,
   patrouille:()=>patrouille,patrouilleStand:()=>Kurs.stand(patrouille),
   duellStand:()=>duell?Kampf.stand(duell):null,
   schritte:weltSchritte,ausfuehren:weltBefehl,audit:()=>welt.audit(weltzustand),
   patrouilleStarten,duellStarten,
   feuern:()=>Kampf.feuern(welt,weltzustand,duell),
   exportieren,ansicht:wechseln,meldung,
   flugschreiber:()=>({format:'aphros-raum-flugschreiber-1',regel:204,quellHash:ursprung,
    schritte:schrittzaehler,vollstaendig:journalVoll,eintraege:journal.map(e=>({...e,cmd:{...e.cmd}}))})
  });
  globalThis.RaumCockpit.sitzung=raum;
  $('ansicht-raum').hidden=false;
 }catch(e){raum=null;meldung('Grafisches Raumcockpit nicht verfügbar ('+e.message+'). Das Steuerpult bleibt nutzbar.',true);}
}
window.addEventListener('resize',()=>{if(ansicht==='cockpit')zeichnen();});
anzeigen();
})();
