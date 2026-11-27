/* #437: disposable lesson observer. The host owns the world, clock and commands.
 * beobachten() receives the authoritative full state after each original second;
 * no references to that state are retained. No storage, reward or command API.
 */
(function(scope){
'use strict';
const LEKTIONEN=Object.freeze([
 ['auswahl','Schiff übernehmen','Alle','Wähle ein gekauftes eigenes Schiff in der Flotte und steige ins Cockpit.'],
 ['abdocken','Abdocken','Alle','Tippe im Dock auf Abdocken. Warte auf freien Flug und bewege es mit dem Steuerknüppel aus dem Dockbereich.'],
 ['annaehern','Annähern','Alle','Tippe auf Station oder Feld, dann auf Annähern. Erreiche das Ziel mit dem Autopiloten.'],
 ['andocken','Sicher andocken','Alle','Tippe auf Andocken. Warte auf die bestätigte Ankunft im Dock.'],
 ['handflug','Handsteuerung übernehmen','Alle','Starte einen Anflug, Orbit oder Folgen. Ziehe dann den Steuerknüppel und fliege selbst.'],
 ['orbit','Orbit halten','Alle','Wähle ein Ziel, gib den Radius ein und starte Orbit. Halte den Radius während einer sichtbaren Umkreisung.'],
 ['folgen','Abstand halten','Alle','Wähle ein frei fliegendes Schiff und gib den Folgeabstand ein. Folge ihm mit stabilem Abstand.'],
 ['aufschalten','Aufschalten und lösen','Alle','Wähle Station oder Schiff, tippe auf Aufschalten und anschließend auf Lösen.'],
 ['bergbau','Miner: echte Förderung','Miner','Übernimm deinen Miner. Starte einen bezahlten Siliziumauftrag, fliege ins Feld und fördere mindestens eine Einheit.'],
 ['fracht','Frachter: bezahlte Rundfahrt','Frachter','Beobachte deinen bereits angenommenen Eisfrachtauftrag bis zur Lieferung und bezahlten Rückkehr.'],
 ['patrouille','Jäger: Bojenpatrouille','Jäger','Starte im Nadir-Dock die Patrouille. Passiere drei Bojen langsam und kehre zum Dock zurück.'],
 ['duell','Jäger: Duelltraining','Jäger','Fliege im bezahlten freien Flug zur Übungsdrohne, starte das Duelltraining und besiege sie. Trefferpunkte sind virtuell; es entstehen keine realen Schäden oder Beute.'],
 ['flugpruefung','Flugprüfung – vom Dock zum sicheren Rückflug','Alle','Übernimm dein gekauftes Schiff im Dock. Docke bezahlt ab, fliege ein Ziel per Autopilot an, halte einen ausdrücklich gewählten Orbit, ändere den Kurs von Hand und kehre zum Ausgangsdock zurück.']
].map(([id,titel,klasse,anleitung])=>Object.freeze({id,titel,klasse,anleitung})));
const zeit=s=>s.tick*60+s.flug.schritt;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function erstellen(B){
 let lauf=null;
 function lesen(){
  const w=B.welt(),s=B.zustand(),id=B.aktiv(),sh=s?.ships?.[id];
  if(!w||!s)return {grund:'Lade eine gesicherte Karriere mit einem gekauften Schiff.'};
  if(!w.audit(s).ok)return {grund:'Der Spielstand hat die Eigentums- und Kassenprüfung nicht bestanden.'};
  if(!sh||sh.owner!=='house'||!sh.flug)return {grund:'Kaufe ein eigenes Schiff und übernimm es im Cockpit.'};
  // Existing scene performs the original ownership/purchase checks too.
  try{B.szene.erzeugen(w,s,id);}catch(_){return {grund:'Ein gültiger Schiffskauf und Flugkörper sind erforderlich.'};}
  return {w,s,id,sh};
 }
 function grund(id,r){
  if(r.grund)return r.grund;
  const {s,sh,w}=r,b=sh.flug;
  if(['bergbau','fracht','patrouille','duell'].includes(id)){
   const klasse=id==='bergbau'?'miner':id==='fracht'?'frachter':'jaeger';
   if(sh.klasse!==klasse)return 'Übernimm einen gekauften '+({miner:'Miner',frachter:'Frachter',jaeger:'Jäger'}[klasse])+'.';
  }
  if(['abdocken','flugpruefung'].includes(id)){
   if(b.lage!=='angedockt')return 'Kehre zuerst ins Dock zurück.';
   const a=B.angebot?.({type:'shipUndock',owner:'house',schiff:sh.id});
   if(!a?.ok)return a?.reason?.replace(/^[A-Z]\d+(?:\/[A-Z]\d+)?:\s*/, '')||'Ein rechtmäßig finanzierter Abdockflug ist erforderlich.';
  }
  if(['andocken','annaehern','handflug','orbit','folgen','aufschalten','duell'].includes(id)&&b.lage!=='frei')return 'Docke zuerst mit bezahlter Flugreserve ab.';
  if(id==='folgen'&&!Object.values(s.ships).some(x=>x.id!==sh.id&&x.system===sh.system&&x.flug?.lage==='frei'))return 'Ein anderes frei fliegendes Schiff im selben System wird benötigt.';
  if(id==='bergbau'){
   if(sh.system!=='nadir')return 'Für diese Förderübung wird ein gekaufter Miner in Nadir mit Siliziumauftrag benötigt. Eis-Pendel allein ist kein persönlicher Feldflug.';
   if(s.kanon.silizium?.auftrag?.schiff!==sh.id)return 'Nimm zuerst den vorhandenen, vollständig finanzierten Siliziumauftrag an.';
  }
  if(id==='fracht'&&!s.kanon.spielerFrachten?.auftraege?.some(x=>x.schiff===sh.id&&x.end===null))return 'Nimm zuerst einen finanzierbaren Eisfrachtauftrag für diesen Frachter an.';
  if(id==='patrouille'&&(![204,208].includes(s.rulesVersion)||sh.system!=='nadir'||b.lage!=='angedockt'))return 'Beginne mit dem gekauften Jäger am Nadir-Dock.';
  if(id==='duell'&&(![204,208].includes(s.rulesVersion)||!s.kanon.flugdienst?.[sh.id]))return 'Ein bezahlter Jägerflug in Nadir wird benötigt.';
  if(['patrouille','duell'].includes(id)&&['bereit','flug','aktiv'].includes(B[id+'Stand']?.()?.status))return 'Beende zuerst das laufende Training und starte danach eine neue Übung.';
  if(['patrouille','duell'].includes(id)&&!B[id+'Stand'])return 'Das zugehörige Training muss im Cockpit verfügbar sein.';
  if(id==='duell'&&sh.system!=='nadir')return 'Fliege den gekauften Jäger in Nadir.';
  return null;
 }
 function menue(){const r=lesen();return LEKTIONEN.map(l=>({...l,grund:grund(l.id,r)}));}
 function starten(id){
  if(!LEKTIONEN.some(l=>l.id===id))return {ok:false,reason:'Unbekannte Übung.'};
  const r=lesen(),g=grund(id,r);if(g)return {ok:false,reason:g};
  const b=r.sh.flug;
  lauf={id,schiff:r.id,status:'aktiv',meldung:'Übung läuft. '+LEKTIONEN.find(l=>l.id===id).anleitung,
   letzter:zeit(r.s),start:zeit(r.s),vorher:{...b},weg:0,stabil:0,winkel:0,gesehen:false,
   ladung:r.sh.ladung?.silizium||0,gefoerdert:r.s.kanon.silizium?.gefoerdert||0,
   fracht:r.s.kanon.spielerFrachten?.auftraege?.find(x=>x.schiff===r.id&&x.end===null)?.start,
   system:r.sh.system,systemWechsel:false,trainingAlt:B[id+'Stand']?.()?.status,belege:[]};
  if(id==='flugpruefung'){lauf.etappe=0;lauf.dock=b.anker;lauf.abflug=false;missionsText();}
  if(id==='auswahl')fertig('Gekauftes eigenes Schiff ist als Pilotenschiff ausgewählt.');
  return {ok:true};
 }
 // Only core seconds count; command snapshots can arm a newly selected target.
 const ETAPPEN=[
  'Abdocken: Tippe auf Abdocken und warte auf freien, finanzierten Flug.',
  'Zielanflug: Wähle Station oder Feld und Autopilot: Anfliegen. Erreiche den Zielbereich.',
  'Orbit: Wähle ein Ziel und ausdrücklich einen Radius (z. B. 120000 P). Halte ihn 30 Flugsekunden bei mindestens 0,3 rad Umkreisung.',
  'Handflug: Übernimm den Orbit mit dem Knüppel. Ändere die tatsächliche Bewegungsrichtung um mindestens 0,3 rad.',
  'Rückflug: Wähle die Ausgangsstation und Andocken. Warte auf die bestätigte Dockankunft.'
 ];
 function missionsText(){
  const p=lauf;
  p.meldung=p.belege.length+'/5 Etappen bestätigt · Etappe '+(p.etappe+1)+'/5 · '+ETAPPEN[p.etappe]
   +(p.etappe===2?' Fortschritt: '+p.stabil+'/30 Flugsekunden, '+p.winkel.toFixed(2)+'/0,30 rad.':'');
 }
 function missionsEtappe(text){
  const p=lauf;p.belege.push(text);p.etappe++;p.ziel=null;p.stabil=0;p.winkel=0;p.polar=null;
  if(p.etappe===5){p.status='erfolgreich';p.meldung='5/5 Etappen bestätigt. Flugprüfung bestanden: sicher am Ausgangsdock zurück.';}
 }
 function mission(s,sh,b,v,dt,bewegung,dienst){
  const p=lauf,w=B.welt();
  if(!w.audit(s).ok){fehler('Eigentums- und Kassenprüfung fehlgeschlagen.');return;}
  if(sh.system!==p.system){fehler('Das Prüfungssystem wurde verlassen.');return;}
  if(p.etappe>0&&b.lage==='angedockt'&&p.etappe<4){fehler('Vor Abschluss der Flugaufgaben angedockt.');return;}
  if(b.lage!=='angedockt'&&!dienst){fehler('Der finanzierte Flugdienst fehlt.');return;}
  const z=b.ziel,sys=w.flugKern.DATEN.systeme[sh.system];
  const ziel=z?.art==='station'?sys.station:z?.art==='feld'?sys.felder.find(f=>f.id===z.id):null;
  if(p.etappe===0){
   if(b.lage==='abdocken')p.abflug=true;
   if(dt===1&&p.abflug&&b.lage==='frei'&&dienst)missionsEtappe('Regulär und finanziert vom Ausgangsdock abgedockt.');
  }else if(p.etappe===1){
   if(dt===1&&b.lage==='frei'&&b.modus==='anflug'&&!b.andocken&&ziel&&bewegung>0
     &&dist(b,ziel)<dist(v,ziel)&&dist(b,ziel)<=(ziel.radius||w.flugKern.DATEN.andocken.radius))
    missionsEtappe('Gewähltes Ziel im Original-Autopiloten erreicht.');
  }else if(p.etappe===2){
   if(b.modus==='orbit'&&ziel&&Number.isInteger(z.radius)&&z.radius>0){
    const sign=JSON.stringify(z);
    if(p.ziel!==sign){p.ziel=sign;p.stabil=0;p.winkel=0;p.polar=null;}
    if(dt===1){
     const passt=Math.abs(dist(b,ziel)-z.radius)<=Math.max(1200,z.radius*0.04)&&bewegung>0;
     const a=Math.atan2(b.y-ziel.y,b.x-ziel.x);
     if(passt){p.stabil++;if(p.polar!==null)p.winkel+=Math.abs(Math.atan2(Math.sin(a-p.polar),Math.cos(a-p.polar)));}
     else{p.stabil=0;p.winkel=0;}
     p.polar=a;
     if(p.stabil>=30&&p.winkel>=0.3){
      p.handBasis={vx:b.vx,vy:b.vy};missionsEtappe('Gewählten Radius '+z.radius+' P stabil umkreist.');
     }
    }
   }else{p.ziel=null;p.stabil=0;p.winkel=0;p.polar=null;}
  }else if(p.etappe===3){
   // Keep the last autopilot velocity; steering the hull alone is insufficient.
   if(['orbit','anflug','folgen'].includes(b.modus)&&Math.hypot(b.vx,b.vy)>0)p.handBasis={vx:b.vx,vy:b.vy};
   const a=p.handBasis;
   if(dt===1&&b.modus==='hand'&&!b.ziel&&bewegung>0&&Math.hypot(b.vx,b.vy)>1&&a&&Math.hypot(a.vx,a.vy)>1){
    const d=Math.abs(Math.atan2(a.vx*b.vy-a.vy*b.vx,a.vx*b.vx+a.vy*b.vy));
    if(d>=0.3)missionsEtappe('Handübernahme und echte Richtungsänderung bestätigt.');
   }
  }else if(p.etappe===4&&dt===1&&b.lage==='angedockt'&&v.lage==='andocken'&&b.anker===p.dock&&Math.hypot(b.vx,b.vy)===0)
   missionsEtappe('Sicher am Ausgangsdock angedockt.');
  if(p.status==='aktiv')missionsText();
 }
 function fertig(text){lauf.status='erfolgreich';lauf.meldung=text;lauf.belege.push(text);}
 function fehler(text){lauf.status='unterbrochen';lauf.meldung=text+' Starte die Übung erneut.';}
 function beobachten(s){
  if(!lauf||lauf.status!=='aktiv')return stand();
  const p=lauf,sh=s?.ships?.[p.schiff],b=sh?.flug,t=s&&zeit(s);
  if(B.aktiv()!==p.schiff||!sh||sh.owner!=='house'||!b){fehler('Pilotenschiff oder Eigentum wurde gewechselt.');return stand();}
  if(t!==p.letzter&&t!==p.letzter+1){fehler('Die Flugbeobachtung wurde unterbrochen.');return stand();}
  const dt=t-p.letzter,v=p.vorher,bewegung=dist(b,v);p.weg+=bewegung;
  const dienst=s.kanon?.flugdienst?.[p.schiff];
  if(dienst?.gestrandet){fehler('Die Flugarbeit ist nicht mehr finanziert.');return stand();}
  if(p.id==='flugpruefung'){mission(s,sh,b,v,dt,bewegung,dienst);p.vorher={...b};p.letzter=t;return stand();}
  if(p.id==='abdocken'&&b.lage==='frei'&&dienst&&p.weg>0)fertig('Freier Flug, finanzierte Flugreserve und echte Positionsänderung bestätigt.');
  if(p.id==='andocken'&&b.lage==='angedockt'&&v.lage!=='angedockt'&&b.anker&&Math.hypot(b.vx,b.vy)===0)fertig('Sichere Ankunft am Dock bestätigt.');
  if(p.id==='handflug'){
   if(['anflug','orbit','folgen'].includes(b.modus))p.gesehen=true;
   if(p.gesehen&&b.modus==='hand'&&!b.ziel&&bewegung>0)fertig('Autopilot durch Handflug abgelöst; echte Bewegung bestätigt.');
  }
  if(p.id==='aufschalten'){
   if(b.erfassung)p.gesehen=true;
   if(p.gesehen&&!b.erfassung&&b.lage==='frei')fertig('Zielerfassung gesetzt und im freien Flug gelöst.');
  }
  if(['annaehern','orbit','folgen'].includes(p.id)){
   const z=b.ziel,sys=B.welt().flugKern.DATEN.systeme[sh.system];
   const ziel=z?.art==='station'?sys.station:z?.art==='feld'?sys.felder.find(f=>f.id===z.id):z?.art==='schiff'?s.ships[z.id]?.flug:z?.art==='punkt'?z:null;
   const modus={annaehern:'anflug',orbit:'orbit',folgen:'folgen'}[p.id];
   if(b.modus===modus&&ziel){
    const sign=JSON.stringify(z);if(p.ziel!==sign){p.stabil=0;p.winkel=0;p.ziel=sign;p.polar=null;}
    const d=dist(b,ziel),radius=z.radius||z.abstand;
    if(p.id==='annaehern'&&bewegung>0&&d<dist(v,ziel)&&d<=(ziel.radius||B.welt().flugKern.DATEN.andocken.radius))fertig('Ziel im echten Anflug erreicht; Abstand hat sich verringert.');
    if(p.id!=='annaehern'){
     const passt=Math.abs(d-radius)<=Math.max(1200,radius*0.04)&&bewegung>0
      &&(p.id!=='folgen'||Math.hypot(ziel.vx,ziel.vy)>0);
     p.stabil=passt?p.stabil+dt:0;
     const a=Math.atan2(b.y-ziel.y,b.x-ziel.x);
     if(p.polar!==null&&p.polar!==undefined&&passt)p.winkel+=Math.abs(Math.atan2(Math.sin(a-p.polar),Math.cos(a-p.polar)));
     if(!passt)p.winkel=0;p.polar=a;
     if(p.stabil>=30&&(p.id==='folgen'?Math.hypot(ziel.vx,ziel.vy)>0:p.winkel>=0.3))fertig('Echte Bewegung mit '+(p.id==='orbit'?'stabilem Orbitradius und Umkreisung':'stabilem Abstand zum bewegten Ziel')+' bestätigt.');
    }
   }else{p.stabil=0;p.winkel=0;p.polar=null;}
  }
  if(p.id==='bergbau'&&s.kanon?.silizium?.auftrag?.schiff===p.schiff&&s.kanon.silizium.gefoerdert>p.gefoerdert&&(sh.ladung?.silizium||0)>p.ladung&&p.weg>0)fertig('Original-Förderzähler und Siliziumladung nach echtem Feldflug gestiegen.');
  if(p.id==='fracht'){
   if(b.lage==='transit')p.gesehen=true;
   if(sh.system!==p.system)p.systemWechsel=true;
   const a=s.kanon?.spielerFrachten?.auftraege?.find(x=>x.schiff===p.schiff&&x.start===p.fracht);
   if(a&&a.end!==null&&a.geliefert!==null&&a.end>p.start/60&&b.lage==='angedockt'&&p.gesehen&&p.systemWechsel)fertig('Originalvertrag: Lieferung und bezahlte Rundfahrt bis zum Dock abgeschlossen.');
  }
  if(['patrouille','duell'].includes(p.id)){
   const a=B[p.id+'Stand']?.();
   if(['bereit','flug','aktiv'].includes(a?.status)&&!['bereit','flug','aktiv'].includes(p.trainingAlt))p.gesehen=true;
   if(p.gesehen&&a?.status===(p.id==='duell'?'sieg':'erfolgreich')&&p.weg>0)fertig(p.id==='duell'?'Original-Duell gewonnen. Alle Treffer bleiben virtuell.':'Drei Bojen und Dock vom Patrouillenbeobachter bestätigt.');
   if(p.gesehen&&['niederlage','abgebrochen','unterbrochen'].includes(a?.status))fehler('Das Training wurde ohne erfolgreichen Abschluss beendet.');
  }
  p.vorher={...b};p.letzter=t;return stand();
 }
 function stand(){return lauf?JSON.parse(JSON.stringify(lauf)):{status:'bereit',meldung:'Wähle eine einzelne Flugübung.'};}
 return Object.freeze({menue,starten,beobachten,stand,zuruecksetzen(){lauf=null;}});
}
const API=Object.freeze({LEKTIONEN,erstellen});
if(typeof module==='object'&&module.exports)module.exports=API;else scope.PilotenAkademie=API;
})(globalThis);
