/* DOM view: no simulation, storage or ship commands. */
(function(scope){
'use strict';
function verbinden(root,akademie,beiStart){
 const doc=root.ownerDocument,grid=doc.createElement('div'),status=doc.createElement('p');
 grid.className='lektionen';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 root.replaceChildren(grid,status);
 function zeichnen(){
  const fokus=doc.activeElement?.dataset?.lektion;
  grid.replaceChildren();
  for(const l of akademie.menue()){
   const card=doc.createElement('article'),h=doc.createElement('h3'),p=doc.createElement('p'),hinweis=doc.createElement('p'),b=doc.createElement('button');
   h.textContent=l.titel;p.textContent=l.anleitung;hinweis.textContent=l.grund?'Noch nicht verfügbar: '+l.grund:l.klasse+' · Bereit';
   b.type='button';b.dataset.lektion=l.id;b.textContent='Übung starten';b.disabled=!!l.grund;
   b.addEventListener('click',()=>{const r=akademie.starten(l.id);if(r.ok){aktualisieren();beiStart?.(l.id);}else status.textContent=r.reason;});
   card.append(h,p,hinweis,b);grid.append(card);
  }
  if(fokus)grid.querySelector('[data-lektion="'+fokus+'"]')?.focus({preventScroll:true});
  aktualisieren();
 }
 function aktualisieren(){const s=akademie.stand();status.textContent=(s.status==='erfolgreich'?'Geschafft! ':s.status==='unterbrochen'?'Erneuter Versuch nötig. ':'')+s.meldung;}
 zeichnen();return Object.freeze({zeichnen,aktualisieren});
}
scope.PilotenMenue=Object.freeze({verbinden});
})(globalThis);
