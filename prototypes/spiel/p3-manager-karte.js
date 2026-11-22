/* Lesende Sektorkarte für die validierte Karrieresitzung. */
(function(scope){
'use strict';
const standorte={
 aldera:{id:'st_aldera',name:'Aldera',profil:'Bergbau · Handel'},
 nadir:{id:'st_nadir',name:'Nadir',profil:'Raffinerie · Werft'},
 dravos:{id:'st_dravos',name:'Dravos',profil:'Außenposten · Silizium'}
};
const klassen={miner:'Bergbauschiff',frachter:'Frachter',jaeger:'Jäger'};
const phasen={hin:'Hinfahrt',rueck:'Rückfahrt',vorbestellt:'Vorbestellt'};
const ort=name=>standorte[name]?.name||name;

// Schematische Etappe aus dem Core-Takt. Ohne belegte Dauer und Ankunft
// genügt der Transitstatus, auch wenn das Systemziel bekannt ist.
function flugzeit(tick,ankunft,dauer){
 if(![tick,ankunft,dauer].every(Number.isSafeInteger)||dauer<=0)return null;
 const vergangen=tick-(ankunft-dauer);
 return vergangen>=0&&vergangen<dauer?{vergangen,dauer}:null;
}

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
 const frachtbeleg=s.kanon.spielerFrachten?.auftraege?.at(-1);
 function schiffAuswerten(sh){
  const original=s.ships[sh.id];
  const fracht=eis?.schiff===sh.id?eis:erz?.schiff===sh.id?erz:null;
  const ueberfuehrung=transfer?.id===sh.id&&transfer.owner===original.owner;
  const pendel=s.kanon.pendel?.[sh.id];
  const reise=sh.phase==='reise'||sh.flug==='transit';
  const ziel=reise?stationen.find(st=>st.id===original.ziel):null;
  const auftrag=fracht?(fracht===eis?'Eisfracht':'Erzfracht')+' · '+(phasen[fracht.phase]||'Transport'):
   ueberfuehrung?'Bezahlte Überführung':
   pendel?pendel.ware==='eis'?'Eisförderung':'Bergbaupendel':
   silizium?.schiff===sh.id&&silizium.owner===original.owner?'Siliziumförderung':
   original.auftrag==='foerdern'?'Bergbau':null;
  const strecke=reise&&(fracht||ueberfuehrung)&&ziel&&
   ((sh.system==='aldera'&&ziel.system==='nadir')||(sh.system==='nadir'&&ziel.system==='aldera'));
  const dock=stationen.find(st=>st.id===original.flug?.anker&&sh.flug==='angedockt');
  const ortText=reise?(ziel?ort(sh.system)+' → '+ziel.name:'Unterwegs'):
   dock?'Am Dock · '+dock.name:
   sh.flug==='andocken'?'Beim Andocken · '+ort(sh.system):
   sh.flug==='abdocken'?'Beim Abdocken · '+ort(sh.system):'Im System '+ort(sh.system);
  const zeit=strecke?flugzeit(s.tick,original.ankunft,
   fracht?fracht.zeit:transfer.minuten):null;
  const lieferung=eis?.schiff===sh.id&&eis.phase==='rueck'&&original.owner==='house'
   &&frachtbeleg?.schiff===sh.id&&frachtbeleg.end===null&&Number.isSafeInteger(frachtbeleg.geliefert)
   ?{menge:frachtbeleg.menge,ziel:ort(sh.system)}:null;
  return {...sh,name:(klassen[sh.klasse]||sh.klasse)+' · '+sh.id,
   owner:original.owner,ort:ortText,auftrag,zeit,lieferung,
   rueckfahrt:fracht?.phase==='rueck',nachAldera:reise&&ziel?.system==='aldera',
   buchwert:w.buchwert(s,sh.id),
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

const stationGrafik={
 aldera:{
  rumpf:'M13 58H36V43H45V33H58V42H70V27H90V35H105V46H119V56H143V62H119V70H40V64H13Z',
  detail:'M21 58V45H38 M28 58V50H38 M44 67V50H60V67 M48 55H56 M48 60H56 M74 43V32H85V43 M69 47H110 M75 53H84V64H75Z M91 53H100V64H91Z M107 53H115V64H107Z M127 56V46H140'
 },
 nadir:{
  rumpf:'M15 46H33L52 23H109L128 46H146V56H128L109 79H52L33 56H15Z M56 31L42 51L56 71H105L119 51L105 31Z',
  detail:'M41 51H119 M58 35V67 M102 35V67 M73 44H88V58H73Z M80 26V44 M80 58V76 M22 46V33H40 M140 56V69H121 M62 51H72 M89 51H99'
 },
 dravos:{
  rumpf:'M31 58H55L64 47H91L99 58H130V65H101L91 74H65L54 65H31Z',
  detail:'M79 47V29 M73 34H86 M76 29H82 M62 60H72V67H62Z M78 60H88V67H78Z M94 60H101 M49 65V73 M112 65V73 M108 38L119 45L131 29'
 }
};

function svgElement(d,tag,attribute){
 const el=d.createElementNS('http://www.w3.org/2000/svg',tag);
 for(const [name,value] of Object.entries(attribute))el.setAttribute(name,value);
 return el;
}

function stationsbild(d,system){
 const {rumpf,detail}=stationGrafik[system];
 const svg=svgElement(d,'svg',{viewBox:'0 0 160 88',width:'100%',height:88,'aria-hidden':'true',focusable:'false'});
 const metall='sektor-metall-'+system;
 const gradient=svgElement(d,'linearGradient',{id:metall,x2:'0%',y2:'100%'});
 gradient.append(svgElement(d,'stop',{offset:'0%','stop-color':'#526873'}),
  svgElement(d,'stop',{offset:'100%','stop-color':'#17232c'}));
 svg.append(gradient,
  svgElement(d,'path',{d:'M8 23V12H19 M141 12H152V23 M8 65V76H19 M141 76H152V65 M80 9V17 M80 77V85',
   fill:'none',stroke:'#677980',opacity:'.75'}),
  svgElement(d,'ellipse',{cx:80,cy:51,rx:70,ry:24,fill:'none',stroke:'#43545d'}),
  svgElement(d,'path',{d:rumpf,fill:'url(#'+metall+')','fill-rule':'evenodd',stroke:'#b7c5c8','stroke-width':1.5}),
  svgElement(d,'path',{d:detail,fill:'none',stroke:'#c6a36c','stroke-width':1.5}));
 return svg;
}

function schiffsbild(d,obj){
 const eigen=obj.owner==='house',farbe=eigen?'#e7e6dc':'#c6a36c';
 const grafik=scope.RaumGrafik;
 const modell=grafik?.MODELLE[grafik.KLASSE_MODELL[obj.klasse]];
 const svg=svgElement(d,'svg',{viewBox:'0 0 120 36',width:96,height:29,
  'aria-hidden':'true',focusable:'false'});
 const {zeit}=obj;
 // Der Marker springt ausschließlich mit dem nächsten angezeigten Welt-Tick.
 const x=zeit?24+72*(obj.nachAldera?1-zeit.vergangen/zeit.dauer:zeit.vergangen/zeit.dauer):60;
 if(zeit)svg.append(svgElement(d,'path',{d:'M4 18H116 M5 14V22 M115 14V22',
  stroke:eigen?'#77c7be':farbe,'stroke-dasharray':'3 3',fill:'none'}));
 if(modell){
  const gruppe=svgElement(d,'g',{transform:'translate('+x+' 18) scale('+(obj.nachAldera?-.68:.68)+' .68)'});
  gruppe.append(svgElement(d,'polygon',{points:modell.koerper.map(p=>p.join(',')).join(' '),
   fill:'#17232c',stroke:farbe,'stroke-width':2}),
  svgElement(d,'path',{d:'M-12 0H11',stroke:eigen?'#77c7be':farbe,'stroke-width':2}));
  svg.append(gruppe);
 }else{
  svg.append(svgElement(d,'circle',{cx:x,cy:18,r:6,fill:'#17232c',stroke:farbe,'stroke-width':2}));
 }
 return svg;
}

function verbinden(wurzel,{waehleAngebot,waehleSchiff,oeffneFlotte,konzernname,titel,fmt}){
 const d=wurzel.ownerDocument,$=id=>d.getElementById(id);
 const auswahl=$('sektor-auswahl'),karte=$('sektor-karte'),details=$('sektor-details');
 karte.setAttribute('aria-label','Wirtschaftsstandorte und Schiffe');
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
  const offen=details.dataset.object===gewaehlt&&details.querySelector('details')?.open===true;
  const vals=obj.owner?[
   ['Eigentümer',konzernname(obj.owner)],['Ort',obj.ort],['Ladung',obj.ladung],
   ['Auftrag',obj.auftrag||'Kein laufender Wirtschaftsauftrag'],
   ['Lieferung',obj.lieferung?fmt(obj.lieferung.menge)+' Eis in '+obj.lieferung.ziel+' geliefert':null]
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
   button.dataset.sektorDetail='flotte';
   button.addEventListener('click',()=>oeffneFlotte(obj.id));
   details.append(button);
  }
  const buchwert=obj.owner&&Number.isSafeInteger(obj.buchwert);
  if(!obj.angebote.length&&!buchwert)return;
  const angebote=element('details'),verfuegbar=obj.angebote.filter(o=>o.ok).length;
  angebote.open=offen;
  const summary=element('summary',buchwert?'Schiffsdetails':'Angebote · '+verfuegbar+' verfügbar');
  summary.dataset.sektorDetail='details';
  angebote.append(summary);
  if(buchwert)angebote.append(element('div','Restbuchwert: '+fmt(obj.buchwert)+' ISK'));
  for(const angebot of obj.angebote){
   if(angebot.ok){
    const button=element('button',titel(angebot),'sektor-angebot');
    button.type='button';
    button.dataset.sektorDetail=angebot.id;
    button.addEventListener('click',()=>waehleAngebot(angebot.id));
    angebote.append(button);
   }else{
    angebote.append(element('p',titel(angebot)+' · '+(angebot.reason||'Zurzeit gesperrt')));
   }
  }
  details.dataset.object=gewaehlt;
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
  b.append(obj.owner?schiffsbild(d,obj):stationsbild(d,obj.system));
  b.append(element('strong',obj.name));
  if(untertitel)b.append(element('small',untertitel));
  if(obj.zeit)b.append(element('small',obj.zeit.vergangen===0&&!obj.rueckfahrt?'Abflug':
   fmt(obj.zeit.vergangen)+' / '+fmt(obj.zeit.dauer)+' Flugminuten'));
  b.addEventListener('click',()=>waehlen(key(obj),true));
  return b;
 }
 auswahl.addEventListener('change',()=>waehlen(auswahl.value,true));
 return {
  eigenesSchiffWaehlen(id){if(modell?.schiffe.some(sh=>sh.id===id))waehlen('schiff:'+id);},
  zuruecksetzen(){gewaehlt=null;delete details.dataset.object;},
  anzeigen(neu){
   const fokus=d.activeElement;
   const fokusMarker=fokus?.dataset?.sektor;
   const fokusDetail=details.contains(fokus)?fokus?.dataset?.sektorDetail:null;
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
   if(neu.fremdeSchiffe.length){
    const box=element('div',null,'sektor-unterwegs');
    box.setAttribute('aria-label','Fremde Schiffe');
    box.setAttribute('role','group');
    for(const sh of neu.fremdeSchiffe){
     const button=knopf(sh,'sektor-kontakt','Fremd · '+sh.ort);
     box.append(button);
    }
    karte.append(box);
   }
   $('sektor-auftraege').textContent=fmt(neu.auftraege);
   if(objekte.length)waehlen(objekte.some(obj=>key(obj)===gewaehlt)?gewaehlt:key(objekte[0]));
   if(fokusDetail)([...details.querySelectorAll('[data-sektor-detail]')]
    .find(b=>b.dataset.sektorDetail===fokusDetail)||details.querySelector('summary')||auswahl)
    .focus({preventScroll:true});
   if(fokusMarker)([...karte.querySelectorAll('[data-sektor]')].find(b=>b.dataset.sektor===fokusMarker)||auswahl)
    .focus({preventScroll:true});
  }
 };
}
const api=Object.freeze({auswerten,verbinden});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P3ManagerKarte=api;
})(globalThis);
