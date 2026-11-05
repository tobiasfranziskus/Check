import {vorhandeneModule} from '../w5-frachter/m_ui_frachter_core.mjs';
import {w5jSitzung,w5jSicht} from './m_ui_w5j_core.mjs';
import {laden,sichern,DATENBANK,SLOT} from './m_ui_w5j_speicher.mjs';
const $=id=>document.getElementById(id);
const canvas=document.querySelector('canvas');
const msg=s=>{$('meldung').textContent=s;};
function download(raw,name){
 const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const geld=n=>new Intl.NumberFormat('de-DE').format(n)+' ISK';
try{
 const response=await fetch('../../index.html',{cache:'no-store'});
 if(!response.ok)throw Error('Core-HTML nicht geladen');
 const {api,grafik}=vorhandeneModule(await response.text());
 const renderer=grafik.grafik(canvas);
 const lokal={x:0,y:0,zoom:.28,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,selected:null};
 let session=w5jSitzung(api),last=undefined,defekt=null,view=null,selected=null;
 let locked=false,busy=false,dbOk=true,bereit=false;
 function zeichnen(){if(view)renderer.zeichnen(view.canvas,lokal,0);}
 function waehle(id){selected=id;render();}
 function befehlsdaten(aktion){
   const s=session.lesen(),ships=Object.keys(s.ships).sort().map(id=>s.ships[id]);
   const f=(owner,klasse,system)=>ships.find(x=>x.owner===owner&&x.klasse===klasse&&(!system||x.system===system));
   switch(aktion){
     case 'npcPause':return {type:'shipWait',owner:'npc3',schiff:f('npc3','miner','aldera')?.id};
     case 'housePause':return {type:'shipWait',owner:'house',schiff:f('house','miner','aldera')?.id};
     case 'npcMine':return {type:'shipMine',owner:'npc3',schiff:f('npc3','miner','aldera')?.id,ware:'erz'};
     case 'minerA':return {type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'};
     case 'minerN':return {type:'shipBuy',owner:'house',klasse:'miner',station:'st_nadir'};
     case 'erz':return {type:'shipMine',owner:'house',schiff:f('house','miner','aldera')?.id,ware:'erz'};
     case 'silizium':return {type:'shipMine',owner:'house',schiff:f('house','miner','nadir')?.id,ware:'silizium'};
     case 'frachter':return {type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'};
     case 'transport':return {type:'shipFreight',owner:'transport',schiff:f('transport','frachter')?.id};
     case 'raffinerie':return {type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
     case 'bauteile':return {type:'stationBuildParts',owner:'house',station:'st_nadir'};
     case 'jaegerbau':return {type:'stationBuildFighter',owner:'house',station:'st_nadir'};
     case 'jaegerkauf':return {type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'};
     case 'piratenkauf':return {type:'pirateBuy',owner:'pirates',
       angebot:ships.find(x=>x.owner==='npc3'&&x.klasse==='jaeger'&&x.id!==s.w5f.pilotSchiffId&&!x.laserMk1Pilot)?.id};
     case 'jagd':return {type:'shipHunt',owner:'npc3',schiff:
       (s.w5f.pilotSchiffId&&s.ships[s.w5f.pilotSchiffId]?.owner==='npc3'
        ?s.w5f.pilotSchiffId
        :ships.filter(x=>x.owner==='npc3'&&x.klasse==='jaeger').at(-1)?.id)};
     case 'laserbau':return {type:'stationBuildLaser',owner:'house',station:'st_nadir'};
     case 'ersatz':return {type:'shipReplaceFighter',owner:'npc3',station:'st_nadir'};
     case 'laserkauf':return {type:'pilotBuyLaser',owner:'pilot_npc3',schiff:s.w5f.pilotSchiffId};
     case 'lasereinbau':return {type:'pilotFitLaser',owner:'pilot_npc3',schiff:s.w5f.laserSchiffId};
     default:throw Error('Unbekannte Bedienaktion');
   }
 }
 function render(){
   view=w5jSicht(api,session.lesen(),selected);
   selected=view.selected?.id??null;lokal.selected=selected;
   canvas.dataset.schiff=selected??'';
   const sel=$('schiffe'),ids=view.schiffe.map(s=>s.id).join('|');
   if(sel.dataset.ids!==ids){
     sel.replaceChildren(...view.schiffe.map(s=>new Option(s.name+' · '+s.klasse+' · '+s.owner+' · '+s.id,s.id)));
     if(!view.schiffe.length)sel.add(new Option('Noch kein Schiff',''));
     sel.dataset.ids=ids;
   }
   sel.value=selected??'';
   $('auswahl').textContent=view.selected
     ? 'Gewählt: '+view.selected.name+' · '+view.selected.id+' · '+view.selected.owner+' · '+view.selected.klasse+' · '+view.selected.system+' · '+view.selected.phase+' / '+view.selected.auftrag
     : 'Noch kein Schiff vorhanden';
   $('zeit').textContent='Core-Tick '+view.tick+' · pausiert zwischen Zeitschritten';
   $('hash').textContent='Core-Hash '+view.hash;
   const a=view.lager.aldera,n=view.lager.nadir;
   $('lager').textContent='Aldera: '+a.erz+' Erz, '+a.miner+' Miner, '+a.frachter+' Frachter. Nadir: '+n.erz+' Erz, '+n.material+' Material, '+n.silizium+' Silizium, '+n.bauteil+' Bauteile, '+n.jaeger+' Jäger.';
   $('kassen').textContent=Object.entries(view.kassen).map(([id,n])=>id+': '+geld(n)).join(' · ');
   const f=view.transport,p=view.produktion,j=view.jagd;
   $('vorgaenge').textContent='Frachterfahrten '+f.abgeschlossen+'/'+f.beauftragt+', geliefert '+f.geliefert+' Erz'
     +(f.auftrag?' · Fahrt '+f.auftrag.phase+' / '+f.auftrag.rest+' min':'')
     +' · Raffinerie '+p.raffinerie+' · Bauteile '+p.bauteile+' · Jäger '+p.jaeger+' gebaut/'+p.verkauft+' verkauft'
     +' · Jagdstunden bezahlt '+j.bezahlteStunden+' ('+geld(j.jagdkosten)+') · Kämpfe '+j.kaempfe+' · Verluste '+j.verluste.length
     +' · Kopfgeld '+geld(j.kopfgeld)+' · neue ISK '+geld(j.minted)+'.';
   $('w5j-nachfrage').textContent='NPC3-Nachfrage: Anfang '+geld(view.w5j.anfang)
      +' · reale Einnahmen '+geld(view.w5j.einnahmen)
      +' · Ausgaben '+geld(view.w5j.ausgaben)
      +' · Arbeitsreserve '+geld(view.w5j.gebundeneBergbauArbeit)
      +' · frei '+geld(view.w5j.frei)
      +' · Finanzierung '+(view.w5j.bilanziert?'geprüft':'FEHLER')
      +' · eigene Erzverkäufe '+view.w5j.verkaufteEigeneErzchargen
      +' · fertige Jäger '+view.w5j.jaegerGebaut
      +' / verkauft '+view.w5j.jaegerVerkauft
      +' · dritter Jäger '+(view.w5j.drittverkaufBelegt?'vollständig bezahlt'
          :view.w5j.bezahlbar?'mit bestehender Kasse kaufbar':'nicht finanziert')
      +' · House-Miner '+view.w5j.HausMinerAuftrag
      +' / NPC3-Miner '+view.w5j.minerAuftrag
      +' · minted '+geld(view.w5j.minted)+'.';
   $('w5i-pipeline').textContent='Bezahlte Auftragspipeline '+view.w5i.offen+'/'+view.w5i.limit
      +' Erz · House '+geld(view.w5i.house)+', NPC3 '+geld(view.w5i.npc3)
      +', Nadir '+geld(view.w5i.nadir)
      +' · Jäger verkauft '+view.w5i.jaegerVerkauft
      +' · Herstellerdefizit pro Jäger '+geld(view.w5i.verlustJeJäger)
      +' · Nachfrage nur aus echten Unternehmensleistungen finanzierbar.';
   $('w5hkosten').textContent='Hersteller-Aufwand je Jäger: '+geld(view.w5h.hersteller.zahlungen)
      +' (Bauteile '+geld(view.w5h.hersteller.teile)
      +', Schiff '+geld(view.w5h.hersteller.jaeger)+')'
      +' · Jägererlös '+geld(view.w5h.hersteller.verkauf)
      +' · Fertigungsmarge '+geld(view.w5h.hersteller.fabrikmarge)
      +' · Zustand '+view.w5h.naechsterErsatz
      +' · bezahlter Ersatz '+view.w5h.ersatz
      +' · Piratenkasse '+geld(view.w5h.kassen.pirates)
      +' · Exportkasse '+geld(view.w5h.naechsteCharge.exportKaufkraft)
      +' · Erz Aldera '+view.w5h.naechsteCharge.erzAldera
      +(view.w5h.naechsteCharge.kaufkraftstopp
         ? ' · ACHTUNG: Dritte Erzfracht wegen leerer Exportkasse nicht finanzierbar':'')
      +' · Händler: '+view.w5h.grosshandel.gekauft+' Erz bezahlt, '
      +view.w5h.grosshandel.verkauft+' geliefert, '
      +view.w5h.grosshandel.bestand+' im Lager, '
      +view.w5h.grosshandel.unterwegs+' unterwegs'
      +' · neues Geld '+geld(view.w5h.minted)+'. Vorgelagerte Bergbau-/Fracht-/Raffineriekosten werden getrennt ausgewiesen, nicht doppelt addiert.';
   $('laserstand').textContent='Pilotenkasse '+geld(view.pilot.cash)
      +' · echte Dienste '+view.pilot.stunden+' · Pilotengehalt '+geld(view.pilot.lohn)
      +' · Kopfgeld '+geld(view.pilot.kopfgeld)+' · XP '+view.pilot.xp
      +' · MK1: '+view.laser.gefertigt+' gefertigt / '+view.laser.verkauft+' gekauft / '+view.laser.eingebaut+' eingebaut'
      +' · Vollkosten '+geld(view.laser.vollkosten)+' · Kampfbonus +'+view.laser.bonus+'.';
   $('audit').textContent=view.audit.ok?'Geld-, Waren- und Vertragsaudit: OK':'AUDITFEHLER: Core-Aktionen gesperrt';
   const block=locked||busy||!bereit||!view.audit.ok;
   document.querySelectorAll('[data-aktion],[data-step]').forEach(b=>b.disabled=block);
   $('neu').disabled=busy||!bereit;$('import').disabled=busy||!bereit;
   $('export').disabled=!bereit;$('schiffe').disabled=!bereit;
   $('retten').hidden=defekt===null;
   zeichnen();
 }
 async function persist(){
   if(!dbOk){msg('Nur flüchtige Sitzung – IndexedDB nicht verfügbar. Bitte JSON exportieren.');return;}
   const raw=session.export();
   try{await sichern(raw,last);last=raw;}
   catch(e){locked=true;msg('Autospeichern gesperrt: '+e.message+' Bitte JSON exportieren.');}
 }
 async function ausfuehren(arbeit){
   if(!bereit||busy||locked)return;
   busy=true;render();
   try{
     const result=arbeit();
     if(result?.ok===false){msg('Core lehnt ab: '+result.reason);return;}
     if(!api.audit(session.lesen()).ok)throw Error('Core-Audit fehlgeschlagen');
     await persist();
     if(!locked)msg('Ein gemeinsamer Core-Schritt ausgeführt und Forschungsstand gesichert.');
   }catch(e){locked=true;msg('Core- oder Speicherfehler. Keine weiteren Aktionen; JSON exportieren: '+e.message);}
   finally{busy=false;render();}
 }
 document.querySelectorAll('[data-aktion]').forEach(b=>b.onclick=()=>ausfuehren(()=>session.befehl(befehlsdaten(b.dataset.aktion))));
 document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>ausfuehren(()=>session.schritt(Number(b.dataset.step))));
 $('schiffe').onchange=()=>waehle($('schiffe').value);
 $('zoomminus').onclick=()=>{lokal.zoom=Math.max(.08,lokal.zoom-.04);zeichnen();};
 $('zoomplus').onclick=()=>{lokal.zoom=Math.min(.5,lokal.zoom+.04);zeichnen();};
 grafik.eingabe(canvas,lokal,(x,y)=>{
   if(!view)return;
   const hit=grafik.treffer(view.canvas,lokal,canvas.getBoundingClientRect(),x,y,renderer.radius);
   if(hit?.ty==='p')waehle(hit.id);
 },()=>selected);
 canvas.addEventListener('pointermove',zeichnen);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(zeichnen).observe(canvas);
 else addEventListener('resize',zeichnen);
 $('export').onclick=()=>download(session.export(),'aphros-forschungswelt-r26-tick-'+session.lesen().tick+'.json');
 $('retten').onclick=()=>{if(defekt!==null)download(String(defekt),'aphros-unlesbarer-w5d-stand.json');};
 $('neu').onclick=async()=>{
   if(busy||!bereit)return;
   const seed=Number($('seed').value);
   if(!Number.isSafeInteger(seed)||seed<1||seed>2147483647){msg('Seed muss zwischen 1 und 2147483647 liegen.');return;}
   if(!confirm('Neuer Regel-26-Forschungsstand? Bestehenden Stand zuvor als JSON sichern; Hauptspiel bleibt unberührt.'))return;
   busy=true;
   try{
     download(last??session.export(),'aphros-w5j-backup-vor-neustart.json');
     session.neu(seed);defekt=null;locked=false;
     await persist();selected=null;
     if(!locked)msg('Neue Forschungswelt angelegt und gesichert. Backup angeboten.');
   }catch(e){locked=true;msg('Neustart abgebrochen: '+e.message);}
   finally{busy=false;render();}
 };
 $('import').onchange=async e=>{
   const file=e.target.files?.[0];e.target.value='';
   if(!file||busy||!bereit)return;
   busy=true;render();
   try{
     const raw=await file.text();
     api.loadW5I(raw);
     if(!confirm('Geprüften Regel-26-Spielstand in diesen Forschungs-Slot übernehmen? Backup des bisherigen Stands wird angeboten.'))return;
     download(last??session.export(),'aphros-w5j-backup-vor-import.json');
     session.import(raw);defekt=null;locked=false;selected=null;
     await persist();
     if(!locked)msg('Validierter Regel-26-Stand übernommen und gesichert.');
   }catch(err){msg('Import abgelehnt: '+err.message+' Bisheriger Slot nicht überschrieben.');}
   finally{busy=false;render();}
 };
 try{
   last=await laden();
   if(last!==undefined){
     try{session.import(last);msg('Vorhandener separater Regel-26-Stand geladen.');}
     catch(e){locked=true;defekt=last;msg('Gespeicherter Forschungsstand ungültig: '+e.message+'. Rohstand sichern, nichts überschrieben.');}
   }else msg('Neue flüchtige Regel-26-Welt (Seed42). Erste Aktion sichert in '+DATENBANK+'/'+SLOT+'.');
 }catch(e){dbOk=false;msg('IndexedDB nicht verfügbar: '+e.message+'. Nur flüchtige Sitzung, JSON-Export verwenden.');}
 bereit=true;render();
}catch(e){msg('Forschungswelt nicht verfügbar: '+e.message+'. Eine strenge Content-Security-Policy kann die bisherige Inline-Core-Extraktion blockieren.');}
