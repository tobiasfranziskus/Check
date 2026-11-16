/* Aphros Void · Managerakademie P1 – guided, read-only original J8 career.
 * No economic actions here. The existing UI/Core performs every purchase,
 * employment, production and freight transfer; this layer merely observes.
 */
(function(scope){
'use strict';
const NODE=typeof module==='object'&&module.exports;
const FAECHER=Object.freeze([
 {id:'markt',titel:'Angebote entdecken',beschreibung:'Prüfe, was deine Stationen tatsächlich anbieten – und welche Geschäfte noch nicht möglich sind.',hilfe:'Öffne die Auftragsübersicht. Eine Offerte ist noch kein Kauf.',panel:'auftraege',aktion:null,cta:'Angebote öffnen'},
 {id:'miner',titel:'Einen Miner erwerben',beschreibung:'Kaufe ein vorhandenes Bergbauschiff aus dem Werftlager in Aldera.',hilfe:'Der Kauf kostet 600 ISK. Eigentum und Geld werden erst nach Bestätigung im Spielkern übertragen.',panel:'auftraege',aktion:'buy-st_aldera-miner',cta:'Zum Miner-Angebot'},
 {id:'frachter',titel:'Einen Frachter erwerben',beschreibung:'Ergänze deine Flotte um einen Transporter für die Handelsroute.',hilfe:'Auch der Frachter muss bereits gebaut und aus deinem Kapital bezahlt sein.',panel:'auftraege',aktion:'buy-st_aldera-frachter',cta:'Zum Frachter-Angebot'},
 {id:'foerderung',titel:'Bergbau beauftragen',beschreibung:'Lass einen eigenen Miner für einen bezahlten Förderauftrag arbeiten.',hilfe:'Erst ein eigener Miner im passenden System kann einen Auftrag erhalten. Bergbau benötigt freie Ressourcen und eine finanzierte Besatzung.',panel:'auftraege',aktion:'ice-',cta:'Zum Förderauftrag'},
 {id:'bestand',titel:'Bestände und Kassen prüfen',beschreibung:'Sieh dir nach der Förderung die Lager, Reserven und unabhängigen Firmen an.',hilfe:'Öffne den Wirtschaftsbericht. Lagerbestände anderer Unternehmen gehören nicht deinem Konzern.',panel:'universum',aktion:null,cta:'Wirtschaftsbericht öffnen'},
 {id:'transport',titel:'Eine Fracht disponieren',beschreibung:'Schicke einen eigenen Frachter erst los, wenn der Auftrag wirklich bezahlt und die Ware verfügbar ist.',hilfe:'Für die Rundfahrt müssen Schiff, Eis, Käuferbudget und die gesamte Arbeit finanzierbar sein.',panel:'auftraege',aktion:'freight-',cta:'Zum Frachtauftrag'},
 {id:'abrechnung',titel:'Handelsergebnis prüfen',beschreibung:'Verfolge, ob dein Frachter die Ware geliefert und seine Vergütung tatsächlich erhalten hat.',hilfe:'Ein begonnener Transport ist noch kein Erlös. Erst der abgeschlossene Rundflug zählt.',panel:'universum',aktion:null,cta:'Zum Wirtschaftsbericht'},
 {id:'verkauf',titel:'Silizium verkaufen',beschreibung:'Optional: Liefere eine vollständig geförderte Charge an die zahlungsfähige Raffinerie in Nadir.',hilfe:'Diese Vertiefung setzt einen autorisierten Nadir-Miner, vollständig geförderte Ware und einen echten Ankauf voraus.',panel:'auftraege',aktion:'sil-sell-',cta:'Zum Siliziumverkauf',optional:true}
]);
const eigener=(s,klasse)=>Object.values(s.ships||{}).filter(x=>x.owner==='house'&&x.klasse===klasse).sort((a,b)=>a.id.localeCompare(b.id));
const daten=(session,gesehen={})=>{
 if(!session||typeof session.ansicht!=='function'
   ||typeof session.weltReferenz!=='function'||typeof session.zustandReferenz!=='function'
   ||typeof session.angebote!=='function')throw Error('Managerakademie: keine gültige Karrieresitzung');
 const s=session.zustandReferenz(),w=session.weltReferenz();
 if(!s||!w||!w.audit(s).ok)throw Error('Managerakademie: nur geprüfte Originalwelt');
 const a=session.ansicht();
 if(![204,207].includes(a.regel)||s.rulesVersion!==a.regel)
   throw Error('Managerakademie: unvereinbare Originalkarriere');
 const angebote=session.angebote(),such=(prefix)=>angebote.find(o=>o.id.startsWith(prefix));
 const gekaufterMiner=eigener(s,'miner'),gekaufterFrachter=eigener(s,'frachter');
 const hausMiner=new Set(gekaufterMiner.map(sh=>sh.id));
 const fracht=s.kanon?.spielerFrachten?.auftraege||[];
 const lieferungen=fracht.filter(x=>gekaufterFrachter.some(sh=>sh.id===x.schiff));
 const verkauf=(s.kanon?.silizium?.belege||[]).some(b=>b.owner==='house'&&
   hausMiner.has(b.schiff)&&Number.isSafeInteger(b.preis)&&b.preis>0);
 const erfuellt={
   markt:!!gesehen.markt,
   miner:gekaufterMiner.length>0,
   frachter:gekaufterFrachter.length>0,
   foerderung:gekaufterMiner.some(sh=>s.kanon?.pendel?.[sh.id]?.ware==='eis')||
     !!(s.kanon?.silizium?.auftrag?.owner==='house'&&hausMiner.has(s.kanon.silizium.auftrag.schiff)),
   bestand:!!gesehen.bestand,
   transport:lieferungen.length>0,
   abrechnung:lieferungen.some(x=>Number.isSafeInteger(x.end)&&x.end>=x.start
     &&Number.isSafeInteger(x.geliefert)&&x.geliefert<=x.end
     &&(s.kanon.spielerFrachten?.gebuehr||0)>0),
   verkauf
 };
 const ziele=FAECHER.map(f=>{
   let angebot=null;
   if(f.aktion){
     angebot=f.aktion.endsWith('-')?such(f.aktion):angebote.find(x=>x.id===f.aktion);
   }
   let bereit=!!angebot?.ok,hinweis=f.hilfe;
   if(f.id==='foerderung'&&!gekaufterMiner.length)hinweis='Kaufe zuerst einen eigenen Miner.';
   if(f.id==='transport'&&!gekaufterFrachter.length)hinweis='Kaufe zuerst einen eigenen Frachter.';
   if(f.id==='verkauf'&&!gekaufterMiner.some(x=>x.system==='nadir'))hinweis='Diese Vertiefung erfordert einen eigenen Miner in Nadir.';
   if(f.aktion&&!bereit&&angebot&&!erfuellt[f.id]&&f.id!=='foerderung')
     hinweis+=' Das Angebot ist momentan gesperrt: prüfe Lager, Kasse und vorhandene Verträge.';
   return Object.freeze({...f,erfuellt:!!erfuellt[f.id],
     bereit:f.aktion?bereit:true,aktionId:angebot?.id||null,
     hinweis});
 });
 return Object.freeze({ok:true,regel:a.regel,weltgeld:a.weltgeld,hausgeld:a.hausgeld,
   erledigt:ziele.filter(x=>x.erfuellt&&!x.optional).length,
   gesamt:ziele.filter(x=>!x.optional).length,ziele:Object.freeze(ziele)});
};
function verbinden({wurzel,sitzung,navigieren}){
 if(!wurzel||typeof sitzung!=='function'||typeof navigieren!=='function')throw Error('Managerakademie: UI-Anschluss fehlt');
 const doc=wurzel.ownerDocument,container=doc.createElement('details');
 container.className='manager-akademie';container.id='manager-akademie';
 const summ=doc.createElement('summary');
 const kicker=doc.createElement('span');kicker.className='manager-akademie-kicker';kicker.textContent='APHROS ACADEMY · KONZERNFÜHRUNG';
 const headline=doc.createElement('strong');headline.textContent='Managerakademie';
 const progress=doc.createElement('span');progress.className='manager-akademie-progress';progress.textContent='8 Lektionen';
 summ.append(kicker,headline,progress);
 const body=doc.createElement('div');body.className='manager-akademie-body';
 const head=doc.createElement('p');head.className='manager-akademie-hint';
 head.textContent='Wähle eine Übung. Jeder Kauf, Auftrag und Verkauf läuft im regulären Spiel – ohne Trainingsgeld.';
 const menu=doc.createElement('nav');menu.className='manager-akademie-nav';menu.setAttribute('aria-label','Manager-Missionen');
 const details=doc.createElement('section');details.className='manager-akademie-detail';details.setAttribute('aria-live','polite');
 body.append(head,menu,details);container.append(summ,body);
 const grid=wurzel.querySelector('.game-grid');if(grid)grid.before(container);else wurzel.prepend(container);
 let aktiveSitzung=null,gesehen={},auswahl='markt';
 const notice=(tag,content)=>{const el=doc.createElement(tag);el.textContent=content;return el;};
 function auffrischen(){
   const ses=sitzung();if(!ses){container.hidden=true;return null;}container.hidden=false;
   if(ses!==aktiveSitzung){aktiveSitzung=ses;gesehen={};auswahl='markt';}
   let m;
   try{m=daten(ses,gesehen);}catch(e){
     menu.replaceChildren();details.replaceChildren(notice('p','Die Karriereprüfung ist derzeit nicht verfügbar. Es werden keine Übungsschritte anerkannt.'));return null;
   }
   progress.textContent=m.erledigt+' / '+m.gesamt+' Kapitel';
   menu.replaceChildren(...m.ziele.map(lesson=>{
     const b=doc.createElement('button');b.type='button';b.dataset.managerMission=lesson.id;
     b.className=auswahl===lesson.id?'manager-akademie-selected':'';
     b.setAttribute('aria-pressed',String(auswahl===lesson.id));
     b.textContent=(lesson.erfuellt?'✓  ':'')+lesson.titel+(lesson.optional?' · Bonus':'');
     b.addEventListener('click',()=>{auswahl=lesson.id;auffrischen();});return b;
   }));
   const l=m.ziele.find(x=>x.id===auswahl)||m.ziele[0];
   const prefix=notice('span',l.erfuellt?'ABGESCHLOSSEN':l.optional?'ZUSATZAUSBILDUNG':'AUSBILDUNG');
   prefix.className='manager-akademie-label';
   const title=notice('h4',l.titel),description=notice('p',l.beschreibung),hint=notice('p',l.hinweis);
   hint.className='manager-akademie-explain';
   const action=doc.createElement('button');action.type='button';action.className='manager-akademie-goto';
   action.textContent=l.cta;action.disabled=l.aktion&&!l.bereit;
   action.addEventListener('click',()=>{
     if(l.id==='markt')gesehen.markt=true;
     if(l.id==='bestand')gesehen.bestand=true;
     navigieren(l.panel,l.aktionId);
     auffrischen();
   });
   details.replaceChildren(prefix,title,description,hint,action);
   return m;
 }
 function gebucht(id){
   // No achievement is credited from a UI callback; the actual world proves it.
   if(typeof id==='string')auffrischen();
 }
 return Object.freeze({auffrischen,gebucht,element:container,stand:()=>aktiveSitzung?daten(aktiveSitzung,gesehen):null});
}
const API=Object.freeze({FAECHER,daten,verbinden});
if(NODE)module.exports=API;else scope.ManagerAkademie=API;
})(globalThis);
