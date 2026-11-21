/* Lesende Sektorkarte für die validierte Karrieresitzung. */
(function(scope){
'use strict';
const standorte={
 aldera:{id:'st_aldera',name:'Aldera',profil:'Bergbau · Handel'},
 nadir:{id:'st_nadir',name:'Nadir',profil:'Raffinerie · Werft'},
 dravos:{id:'st_dravos',name:'Dravos',profil:'Silizium'}
};
const klassen={miner:'Bergbauschiff',frachter:'Frachter',jaeger:'Jäger'};
const phasen={hin:'Hinfahrt',rueck:'Rückfahrt',vorbestellt:'Vorbestellt'};
const ort=name=>standorte[name]?.name||name;

function auswerten(a,s,w,angebote){
 const stationen=Object.entries(standorte).flatMap(([system,k])=>{
  if(system==='dravos'&&a.regel!==207)return [];
  const st=a.stationen.find(st=>st.id===k.id&&st.system===system);
  if(!st)return [];
  return [{...k,system,lager:st.lager,kasse:s.owners[k.id]?.cash,
   angebote:angebote.filter(o=>o.id.startsWith('buy-'+k.id+'-')),
   raffinerie:w.rules.w4?.station===k.id&&s.w4?s.w4.auftrag?'In Betrieb':'Kein laufender Auftrag':null,
   werft:w.rules.w5?.station===k.id&&s.w5?s.w5.auftrag?'Baut eine Hülle':'Kein laufender Auftrag':null,
   werftBetreiber:w.rules.w5?.station===k.id?w.rules.w5.werft:null}];
 });
 const eis=s.w5n?.frachtauftrag,erz=s.w3?.auftrag,transfer=s.w5ac?.active;
 const silizium=s.kanon.silizium?.auftrag;
 function schiffAuswerten(sh){
  const original=s.ships[sh.id];
  const fracht=eis?.schiff===sh.id?eis:erz?.schiff===sh.id?erz:null;
  const ueberfuehrung=transfer?.id===sh.id&&transfer.owner===original.owner;
  const pendel=s.kanon.pendel?.[sh.id];
  const reise=sh.phase==='reise'||sh.flug==='transit';
  const ziel=reise?stationen.find(st=>st.id===original.ziel):null;
  const auftrag=fracht?(fracht===eis?'Eisfracht':'Erzfracht')+' · '+phasen[fracht.phase]:
   ueberfuehrung?'Bezahlte Überführung':
   pendel?pendel.ware==='eis'?'Eisförderung':'Bergbaupendel':
   silizium?.schiff===sh.id&&silizium.owner===original.owner?'Siliziumförderung':null;
  const strecke=reise&&(fracht||ueberfuehrung)&&ziel&&
   ((sh.system==='aldera'&&ziel.system==='nadir')||(sh.system==='nadir'&&ziel.system==='aldera'));
  const dock=stationen.find(st=>st.id===original.flug?.anker&&sh.flug==='angedockt');
  const ortText=reise?(ziel?ort(sh.system)+' → '+ziel.name:'Unterwegs'):
   dock?'Am Dock · '+dock.name:'Im System '+ort(sh.system);
  return {...sh,name:(klassen[sh.klasse]||sh.klasse)+' · '+sh.id,
   owner:original.owner,ort:ortText,auftrag,buchwert:w.buchwert(s,sh.id),
   gruppe:strecke?'strecke':reise?'unterwegs':sh.system,
   angebote:original.owner==='house'?angebote.filter(o=>['ice-','stop-','freight-','gate-freight-','sil-start-','sil-sell-']
    .some(prefix=>o.id===prefix+sh.id)):[]};
 }
 const schiffe=a.schiffe.map(schiffAuswerten);
 const fremdeSchiffe=Object.entries(s.ships).filter(([,sh])=>sh.owner!=='house')
  .sort(([a],[b])=>a.localeCompare(b)).map(([id,sh])=>schiffAuswerten({
   id,klasse:sh.klasse,system:sh.system,phase:sh.phase,flug:sh.flug?.lage||null,
   ladung:Object.entries(sh.ladung||{}).filter(([,n])=>n>0).map(([ware,n])=>ware+': '+n).join(' · ')||'leer'
  }));
 return {stationen,schiffe,fremdeSchiffe,auftraege:schiffe.filter(sh=>sh.auftrag).length};
}

function verbinden(wurzel,{waehleAngebot,waehleSchiff,oeffneFlotte,konzernname,titel,fmt}){
 const d=wurzel.ownerDocument,$=id=>d.getElementById(id);
 const auswahl=$('sektor-auswahl'),karte=$('sektor-karte'),details=$('sektor-details');
 let modell=null,gewaehlt=null;
 const key=obj=>obj.owner?'schiff:'+obj.id:'station:'+obj.id;
 function element(tag,text,klasse){
  const el=d.createElement(tag);
  if(text)el.textContent=text;
  if(klasse)el.className=klasse;
  return el;
 }
 function markieren(){
  for(const b of karte.querySelectorAll('[data-sektor]'))
   b.setAttribute('aria-pressed',String(b.dataset.sektor===gewaehlt));
  auswahl.value=gewaehlt;
 }
 function zeigeDetails(obj){
  const vals=obj.owner?[
   ['Eigentümer',konzernname(obj.owner)],['Ort',obj.ort],['Ladung',obj.ladung],
   ['Auftrag',obj.auftrag||'Kein laufender Wirtschaftsauftrag'],
   ['Restbuchwert',Number.isSafeInteger(obj.buchwert)?fmt(obj.buchwert)+' ISK':null]
  ]:[
   ['Stationsbetreiber',konzernname(obj.id)],['Lager',obj.lager],
   ['Stationskasse',Number.isSafeInteger(obj.kasse)?fmt(obj.kasse)+' ISK':null],
   ['Raffinerie',obj.raffinerie],['Werft',obj.werft],
   ['Werftbetreiber',obj.werftBetreiber?konzernname(obj.werftBetreiber):null]
  ];
  const liste=element('dl');
  for(const [label,value] of vals)if(value!==null)liste.append(element('dt',label),element('dd',value));
  details.replaceChildren(element('h3',obj.name),liste);
  if(obj.owner==='house'){
   const button=element('button','In Flotte disponieren','sektor-angebot');
   button.type='button';
   button.addEventListener('click',()=>oeffneFlotte(obj.id));
   details.append(button);
  }
  if(!obj.angebote.length)return;
  const angebote=element('details'),verfuegbar=obj.angebote.filter(o=>o.ok).length;
  angebote.open=details.dataset.object===gewaehlt&&details.dataset.offen==='true';
  angebote.append(element('summary','Angebote · '+verfuegbar+' verfügbar'));
  for(const angebot of obj.angebote){
   if(angebot.ok){
    const button=element('button',titel(angebot),'sektor-angebot');
    button.type='button';
    button.addEventListener('click',()=>waehleAngebot(angebot.id));
    angebote.append(button);
   }else{
    angebote.append(element('p',titel(angebot)+' · '+(angebot.reason||'Zurzeit gesperrt')));
   }
  }
  angebote.addEventListener('toggle',()=>{
   if(angebote.isConnected)details.dataset.offen=String(angebote.open);
  });
  details.dataset.object=gewaehlt;
  details.dataset.offen=String(angebote.open);
  details.append(angebote);
 }
 function waehlen(id,benutzerauswahl=false){
  const obj=[...modell.stationen,...modell.schiffe,...modell.fremdeSchiffe].find(obj=>key(obj)===id);
  if(!obj)return;
  gewaehlt=id;
  markieren();
  zeigeDetails(obj);
  if(benutzerauswahl&&obj.owner==='house')waehleSchiff(obj.id,modell);
 }
 function knopf(obj,klasse,untertitel){
  const b=element('button',null,klasse);
  b.type='button';
  b.dataset.sektor=key(obj);
  b.append(element('strong',obj.name));
  if(untertitel)b.append(element('small',untertitel));
  b.addEventListener('click',()=>waehlen(key(obj),true));
  return b;
 }
 auswahl.addEventListener('change',()=>waehlen(auswahl.value,true));
 return {
  eigenesSchiffWaehlen(id){if(modell?.schiffe.some(sh=>sh.id===id))waehlen('schiff:'+id);},
  zuruecksetzen(){gewaehlt=null;details.dataset.offen='false';},
  anzeigen(neu){
   const fokus=d.activeElement?.dataset?.sektor;
   modell=neu;
   const objekte=[...neu.stationen,...neu.schiffe,...neu.fremdeSchiffe];
   function optionFuer(obj){
    const option=element('option',obj.owner?obj.name+' · '+obj.ort:obj.name);
    option.value=key(obj);
    return option;
   }
   auswahl.replaceChildren(...neu.stationen.map(optionFuer),...neu.schiffe.map(optionFuer));
   if(neu.fremdeSchiffe.length){
    const gruppe=element('optgroup');
    gruppe.label='Fremde Schiffe';
    gruppe.append(...neu.fremdeSchiffe.map(optionFuer));
    auswahl.append(gruppe);
   }
   const uebrig=new Set(neu.schiffe);
   function schiffsgruppe(gruppe,klasse){
    const box=element('div',null,klasse);
    for(const sh of uebrig)if(sh.gruppe===gruppe){
     box.append(knopf(sh,'sektor-schiff',sh.auftrag||sh.ort));
     uebrig.delete(sh);
    }
    return box;
   }
   const netz=element('div',null,'sektor-netz');
   const verbindung=neu.stationen.some(st=>st.system==='aldera')&&neu.stationen.some(st=>st.system==='nadir');
   for(const st of neu.stationen){
    if(st.system==='nadir'&&verbindung){
     const strecke=schiffsgruppe('strecke','sektor-strecke');
     strecke.prepend(element('span','Handelsverbindung · schematisch'));
     netz.append(strecke);
    }
    const gruppe=schiffsgruppe(st.system,'sektor-hafen sektor-'+st.system);
    gruppe.prepend(knopf(st,'sektor-station',st.profil));
    netz.append(gruppe);
   }
   karte.replaceChildren(netz);
   if(uebrig.size){
    const box=element('div',null,'sektor-unterwegs');
    for(const sh of uebrig)box.append(knopf(sh,'sektor-schiff',sh.auftrag||sh.ort));
    karte.append(box);
   }
   $('sektor-auftraege').textContent=fmt(neu.auftraege);
   waehlen(objekte.some(obj=>key(obj)===gewaehlt)?gewaehlt:key(objekte[0]));
   if(fokus)([...karte.querySelectorAll('[data-sektor]')].find(b=>b.dataset.sektor===fokus)||auswahl)
    .focus({preventScroll:true});
  }
 };
}
const api=Object.freeze({auswerten,verbinden});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3ManagerKarte=api;
})(globalThis);
