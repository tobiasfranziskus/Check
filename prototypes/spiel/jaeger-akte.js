/* J13 – lesende Produktionsakte fuer eine ECHTE Regel204-Jaegerhuelle.
 * Zahlen stammen ausschliesslich aus dem Originalkern und dessen geltenden
 * Regeln. Diese Akte fuehrt KEINE NPC-/Werftbefehle aus und gibt keine Prokura.
 */
(function(scope){
'use strict';
function erstellen(welt,zustand,kaufangebot){
 const r=welt?.rules,s=zustand;
 if(r?.rulesVersion!==204||s?.rulesVersion!==204||!r?.j3||!r?.j4||
    !s?.stations?.st_nadir||!s?.owners?.st_nadir||!s?.owners?.house||
    !s?.kanon?.bauteile||!s?.kanon?.jaeger)
   throw Error('J13: nur originale, vollstaendige Regel204-Jaegerwirtschaft');
 const nadir=s.stations.st_nadir.lager, b=s.kanon.bauteile, j=s.kanon.jaeger;
 const menge=k=>Number.isSafeInteger(nadir[k])&&nadir[k]>=0?nadir[k]:0;
 const fehl=(bedarf,vorrat)=>Math.max(0,bedarf-vorrat);
 const gebauteTeile=menge('bauteil'), material=menge('material'),
       silizium=menge('silizium'), lagerJaeger=menge('jaeger');
 const eigene=Object.values(s.ships).filter(sh=>sh.owner==='house'&&sh.klasse==='jaeger').length;
 const werftInArbeit=!!j.auftrag;
 const ersteHuelleVersorgt=werftInArbeit||lagerJaeger>0||eigene>0;
 const teileImBau=b.auftrag?1:0;
 const teileNoch=ersteHuelleVersorgt?0:fehl(r.j4.bauteile,gebauteTeile+teileImBau);
 const materialNoch=ersteHuelleVersorgt?0:fehl(r.j4.material+teileNoch*r.j3.material,material);
 const siliziumNoch=ersteHuelleVersorgt?0:fehl(teileNoch*r.j3.silizium,silizium);
 const arbeitJ3=r.j3.dauer*r.j3.lohnJeMinute;
 const arbeitJ4=r.j4.dauer*r.j4.lohnJeMinute;
 const angebot=kaufangebot&&kaufangebot.id==='buy-st_nadir-jaeger'?kaufangebot:null;
 const k7=s.kanon.industrieErz;
 const ankauf=welt.industriePreise?.alderakauf??null;
 const alderakasse=s.owners.st_aldera?.cash??null;
 const status=(titel,stand,hinweis)=>Object.freeze({titel,stand,hinweis});
 const schritte=[
  status('Erz und W4-Material',materialNoch===0?'erfuellt':'offen',
   material+' Material in Nadir · '+(ersteHuelleVersorgt?'Material fuer diese Huelle bereits verbaut/finanziert':
    materialNoch+' fuer die noch offene Fertigung fehlen')+'. K7-Erzphase: '+(k7?.phase||'keine')+'.'),
  status('J2b-Silizium',siliziumNoch===0?'erfuellt':'offen',
   silizium+' Silizium in Nadir · '+(ersteHuelleVersorgt?'Silizium fuer diese Huelle bereits verarbeitet':
    siliziumNoch+' fuer die noch fehlenden Teile fehlen')+'. Feldrest: '+(s.kanon.silizium?.vorrat??'unbekannt')+'.'),
  status('J3-Bauteile',ersteHuelleVersorgt||gebauteTeile>=r.j4.bauteile?'erfuellt':b.auftrag?'laeuft':'offen',
   gebauteTeile+' von '+r.j4.bauteile+' Bauteilen im Nadir-Lager'+
   (b.auftrag?' · 1 Bauteil wird finanziert gefertigt':'')+
   '. Eine neue Charge kostet '+r.j3.material+' Material, '+r.j3.silizium+
   ' Silizium und '+arbeitJ3+' ISK vorfinanzierten Lohn (Nadir-Kasse: '+s.owners.st_nadir.cash+' ISK).'),
  status('J4-Jaegerwerft',lagerJaeger>0||eigene>0?'erfuellt':werftInArbeit?'laeuft':'offen',
   lagerJaeger+' fertige Huelle(n) im Lager · '+(werftInArbeit?'Werftauftrag arbeitet':'kein laufender Werftauftrag')+
   '. Ein neuer Bau braucht '+r.j4.bauteile+' Bauteile, '+r.j4.material+
   ' Material und '+arbeitJ4+' ISK Nadir-Arbeitslohn (Kasse: '+s.owners.st_nadir.cash+' ISK).'),
  status('Dein 900-ISK-Kauf',eigene>0?'erfuellt':angebot?.ok?'bereit':'offen',
   eigene+' eigene Jaeger · house-Kasse '+s.owners.house.cash+' ISK · Preis '+
   r.j4.verkaufspreis+' ISK. '+(angebot?.ok?'Original-Core bestaetigt den Kauf':
     'Original-Core sperrt: '+(angebot?.reason||'kein Kaufangebot'))),
 ];
 return Object.freeze({
  regel:204,tick:s.tick,schritte:Object.freeze(schritte),
  eigentuemerWerft:r.j4.owner,naechsterArbeitslohn:arbeitJ4,
  k7:Object.freeze({phase:k7?.phase||'unbekannt',alderaKasse:alderakasse,erzkauf:ankauf}),
  lager:Object.freeze({material,silizium,bauteil:gebauteTeile,jaeger:lagerJaeger}),
  fehlbedarf:Object.freeze({material:materialNoch,silizium:siliziumNoch,bauteile:teileNoch}),
  kauf:Object.freeze({ok:!!angebot?.ok,grund:angebot?.reason||null,preis:r.j4.verkaufspreis}),
  eigeneJaeger:eigene,werftInArbeit,
 });
}
const API=Object.freeze({erstellen});
if(typeof module==='object'&&module.exports)module.exports=API;
else scope.J13Werftakte=API;
})(globalThis);
