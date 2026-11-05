import {vorhandeneModule} from '../w5-frachter/m_ui_frachter_core.mjs';
const $=id=>document.getElementById(id);
const geld=n=>new Intl.NumberFormat('de-DE').format(n)+' ISK';
let api,state;
function msg(x){$('meldung').textContent=String(x);}
function miner(){return Object.values(state.ships).find(s=>s.owner==='house'&&s.klasse==='miner'&&s.system==='aldera');}
function frachter(){return Object.values(state.ships).find(s=>s.owner==='transport'&&s.klasse==='frachter');}
function cmd(type,owner,data={}){
 const out=api.execute(state,{type,owner,...data},api.W5N_RULES);
 if(!out.ok)throw Error(out.reason||'Befehl abgelehnt');
}
function show(){
 const v=api.pilotW5NStand(state),audit=api.audit(state);
 $('meta').textContent='Tick '+state.tick+' · Hash '+api.hash(state)+' · Core-Audit '+(audit.ok?'OK':'FEHLER')
  +' · Geldmenge '+geld(Object.values(state.owners).reduce((n,o)=>n+o.cash,0))
  +' · neue ISK '+state.minted;
 const rows=[
  ['Eis real gefördert',v.gefoerdert],
  ['Eis wirklich verkauft',v.verkauft],
  ['Eis nach Nadir geliefert',v.eisGeliefert],
  ['Beendete bezahlte Frachtrunden',v.lieferungen],
  ['Wasser wirklich hergestellt',v.wasserProduziert],
  ['Wasser bezahlt verbraucht',v.wasserVerbraucht],
  ['Wasserkunden: tatsächlich bezahlt',geld(v.zahlung)],
  ['Wasserkunden: noch vorhandene ISK',geld(v.kundenRest)],
  ['Nadir-Stationskasse',geld(v.nadirKasse)],
  ['Aldera-Stationskasse',geld(v.alderaKasse)],
  ['House-Kasse',geld(v.houseKasse)],
  ['Transport-Kasse',geld(v.frachtKasse)],
  ['Stunden ohne voll bezahlte Wasserversorgung',v.knappheitsStunden]
 ];
 const frag=document.createDocumentFragment();
 for(const [name,value]of rows){
  const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');
  th.scope='row';th.textContent=name;td.textContent=String(value);tr.append(th,td);frag.append(tr);
 }
 $('werte').replaceChildren(frag);
}
function download(){
 const blob=new Blob([api.save(state)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='aphros-void-w5n-regel29.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function run(action){
 switch(action){
  case 'miner':return cmd('shipBuy','house',{station:'st_aldera',klasse:'miner'});
  case 'mine':{const sh=miner();if(!sh)throw Error('House besitzt noch keinen Aldera-Miner');
    return cmd('shipMine','house',{schiff:sh.id,ware:'eis'});}
  case 'sell':{const sh=miner();if(!sh)throw Error('Kein eigener Miner');
    return cmd('shipSellIce','house',{schiff:sh.id,menge:Math.min(50,sh.ladung.eis||0)});}
  case 'freighter':return cmd('shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
  case 'ship':{const sh=frachter();if(!sh)throw Error('Noch kein Frachter gekauft');
    return cmd('shipFreightIce','transport',{schiff:sh.id});}
  case 'water':return cmd('stationWater','st_nadir',{station:'st_nadir'});
  case '50':return api.advance(state,50,api.W5N_RULES);
  case '60':return api.advance(state,60,api.W5N_RULES);
  case '120':return api.advance(state,120,api.W5N_RULES);
  case 'day':return api.advance(state,1440,api.W5N_RULES);
  case 'export':return download();
  case 'new':{
    if(!confirm('Nur die nicht gespeicherte W5n-Forschungswelt neu beginnen?'))return;
    state=api.createW5NState(42);return;
  }
  default:throw Error('Unbekannter Forschungsbefehl');
 }
}
try{
 const response=await fetch('../../index.html',{cache:'no-store'});
 if(!response.ok)throw Error('Gemeinsamen Spielkern nicht geladen');
 ({api}=vorhandeneModule(await response.text()));
 state=api.createW5NState(42);show();
 msg('Bereit · Seed 42. Alle Befehle werden im echten Core geprüft.');
 document.querySelectorAll('button[data-act]').forEach(button=>button.addEventListener('click',()=>{
  try{run(button.dataset.act);show();msg('Aktion geprüft: '+button.textContent);}
  catch(err){show();msg('Abgelehnt: '+err.message);}
 }));
 $('import').addEventListener('change',async e=>{
  try{
   const file=e.target.files?.[0];if(!file)return;
   const imported=api.loadW5N(await file.text());
   state=imported;show();msg('R29-Forschungsstand erfolgreich geladen.');
  }catch(err){msg('Import abgelehnt (alter Spielstand bleibt): '+err.message);}
  finally{e.target.value='';}
 });
}catch(err){msg('Forschungswelt nicht geladen: '+err.message);}
