import {vorhandeneModule} from '../w5-frachter/m_ui_frachter_core.mjs';
const $=id=>document.getElementById(id);
const isk=n=>new Intl.NumberFormat('de-DE').format(n)+' ISK';
const number=n=>new Intl.NumberFormat('de-DE').format(n);
let api,state,busy=false;
function message(x){$('status').textContent=String(x);}
function update(){
 const w=api.pilotW5OStand(state),valid=api.audit(state);
 for(const [id,val]of [['wasser',number(w.wasserGekauft)],['mangel',number(w.mangelstunden)],
   ['haushalt',isk(w.haushalt)],['emission',number(state.minted)]])$(id).textContent=val;
 const rows=[
   ['Spieltag',number(Math.floor(state.tick/1440))],
   ['Szenario',w.mode+' / '+w.minerOwner],
   ['Bezahlt an Haushalte (Löhne)',isk(w.lohn)],
   ['Bezahlt an Haushalte (realisierte NPC-Gewinne)',isk(w.dividenden)],
   ['Wirkliche Wasserkäufe',isk(w.zahlungen)],
   ['Eis tatsächlich gefördert',number(w.eis)],
   ['Bezahlte Frachtrunden',number(w.transporte)],
   ['Wasser produziert',number(w.wasser)],
   ['Nadir-Stationskasse',isk(w.nadir)],
   ['NPC3-Unternehmenskasse',isk(w.npc3)],
   ['Transport-Unternehmenskasse',isk(w.transport)],
   ['Spieler-Kasse',isk(w.house)],
   ['Gesamte ISK (inklusive Reserven)',isk(w.geld)],
   ['Independent Audit',valid.ok?'OK':'FEHLER']
 ];
 const fragment=document.createDocumentFragment();
 for(const [key,value]of rows){
   const tr=document.createElement('tr'),th=document.createElement('th'),
     td=document.createElement('td');th.scope='row';th.textContent=key;td.textContent=value;
   tr.append(th,td);fragment.append(tr);
 }
 $('werte').replaceChildren(fragment);
 $('hash').textContent='Deterministischer Hash: '+w.hash;
}
function exportSave(){
 const blob=new Blob([api.save(state)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='aphros-w5o-regel30.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function advance(days){
 for(let day=0;day<days;day++){
   api.advance(state,1440,api.W5O_RULES);
   if(!api.audit(state).ok)throw Error('Auditorischer Fehler am Spieltag '+Math.floor(state.tick/1440));
   if(day%2===1)await new Promise(resolve=>requestAnimationFrame(resolve));
 }
}
async function act(action){
 if(action==='export')return exportSave();
 if(action==='start'){
   if(!confirm('Neue Forschungswelt starten? Den aktuellen Forschungsstand gegebenenfalls vorher als JSON exportieren.'))return;
   const [mode,owner]=$('modus').value.split(':');
   state=api.createW5OState(42,mode,owner);return;
 }
 if(action==='day'||action==='week'||action==='month')
   return advance(action==='day'?1:action==='week'?7:30);
 throw Error('Unbekannte Aktion');
}
try{
 const response=await fetch('../../index.html',{cache:'no-store'});
 if(!response.ok)throw Error('Originalkern nicht geladen');
 ({api}=vorhandeneModule(await response.text()));
 state=api.createW5OState(42,'full','npc3');
 update();message('Forschung Seed 42 bereit. Jede Spielminute wird im Originalkern simuliert.');
 document.querySelectorAll('button[data-act]').forEach(button=>button.addEventListener('click',async()=>{
  if(busy)return;busy=true;
  const buttons=[...document.querySelectorAll('button[data-act]')];
  buttons.forEach(x=>x.disabled=true);
  message('Berechne vollständige, auditierte Spieltage …');
  try{await act(button.dataset.act);update();message('Aktueller Forschungsstand ist geprüft.');}
  catch(e){update();message('Aktion abgelehnt: '+e.message);}
  finally{busy=false;buttons.forEach(x=>x.disabled=false);}
 }));
 $('import').addEventListener('change',async e=>{
  if(busy)return;busy=true;
  try{
   const file=e.target.files?.[0];if(!file)return;
   const imported=api.loadW5O(await file.text());
   state=imported;update();message('R30-Forschungsstand importiert und geprüft.');
  }catch(error){message('Import abgelehnt (bestehender Stand erhalten): '+error.message);}
  finally{busy=false;e.target.value='';}
 });
}catch(e){message('Forschungswelt konnte nicht starten: '+e.message);}
