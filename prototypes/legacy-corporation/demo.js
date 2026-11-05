'use strict';
// Fictional display fixture, never a simulation or a Core adapter.
const corporationDemo={
  demo:true,provenance:'Frei erfundene UI-Beispiele · keine verbundene Spielwelt',asOf:'Demo · Tag 12, 18:00',
  company:{id:'demo-corp',name:'Aphros Exploration',availableCapital:'4.200 ISK',capitalEvidence:'Demo-Kassenstand K12',income:'800 ISK',expenses:'300 ISK',period:'Demo · Tag 12',coverage:'Nur zwei Beispielbuchungen; keine vollständigen Unternehmensdaten',result:null,resultScope:'Vollkosten nicht verfügbar'},
  flows:[{id:'f1',name:'Erzverkauf',from:'Demo-Station',to:'demo-corp',amount:'800 ISK',kind:'Einnahme',shipId:'miner-1',at:'Tag 12 · 16:00',evidence:'Demo-Beleg B1'},{id:'f2',name:'Bezahlte Bergbauarbeit',from:'demo-corp',to:'Demo-Arbeitskonto',amount:'300 ISK',kind:'Ausgabe',shipId:'miner-1',at:'Tag 12 · 17:00',evidence:'Demo-Beleg B2'}],
  ships:[{id:'miner-1',name:'Prospektor',role:'miner',ownerId:'demo-corp',location:'Aldera',activity:'Am Dock',condition:null,income:'800 ISK',costs:'300 ISK',period:'Demo · Tag 12',evidence:'Demo B1 / B2 · nur Bergbaubuchungen',funding:'Nicht verfügbar',cargo:[{name:'Erz',aboard:20,available:0,unit:'Einheiten',evidence:'Demo · vollständig gebunden'}]},{id:'hauler-1',name:'Meridian',role:'hauler',ownerId:'demo-corp',location:'Nadir',activity:'Wartet auf Finanzierung',funding:'Unzureichend laut Demo-Snapshot',fundingEvidence:'Demo-Auftrag A2',cargo:[]},{id:'fighter-1',name:'Wacht',role:'fighter',ownerId:'demo-corp',location:'Aldera',activity:'Bereitschaft',cargo:[]}],
  orders:[{id:'a1',name:'Erzabnahme',shipId:'miner-1',phase:'completed',status:'Abgeschlossen',funding:'Abgerechnet',fundingState:'settled',evidence:'Demo B1'},{id:'a2',name:'Transportanfrage',shipId:'hauler-1',phase:'open',status:'Offen · nicht gestartet',funding:'Unzureichend',fundingState:'insufficient',evidence:'Demo-Auftraggeber meldet fehlendes Budget'}],
  production:[{id:'p1',name:'Erz',quantity:100,unit:'Einheiten',shipId:'miner-1',period:'Demo · Tag 12',evidence:'Demo-Förderprotokoll P1'}],
  sales:[{id:'s1',name:'Erz',quantity:80,unit:'Einheiten',income:'800 ISK',period:'Demo · Tag 12',evidence:'Demo B1'}],
  inventory:[{id:'i1',name:'Erz',location:'Prospektor',quantity:20,available:0,unit:'Einheiten',evidence:'Demo · für Folgeauftrag gebunden'}],transports:[]
};
window.corporationPreview=LegacyCorporation.mount(document.getElementById('corporation'),corporationDemo);
