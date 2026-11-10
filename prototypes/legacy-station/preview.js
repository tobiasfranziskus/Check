'use strict';
// Deliberately fictional UI fixture. No real Aphros Void balances or offers.
const previewSnapshot = {
  provenance: 'Fiktive UI-Beispieldaten · keine reale Aphros-Void-Welt oder Wirtschaft',
  stations: [
    { id: 'demo-port', name: 'Raumhafen · Vorschau A',
      ships: [
        {id:'demo-miner', name:'Beispiel-Miner', role:'Miner', owner:'Beispielkonzern', status:'Demo: am Dock', cargoUsed:0, cargoCapacity:null, cargo:[]},
        {id:'demo-hauler', name:'Beispiel-Frachter', role:'Frachter', owner:'Beispielkonzern', status:'Demo: am Dock', cargo:[{name:'Beispielware', quantity:null}]}
      ],
      storage:[{name:'Beispielmaterial', quantity:null, owner:'Beispielkonzern'}],
      industry:[{name:'Raffinerie', input:'Material laut Core-Snapshot', output:null, status:'Keine Core-Verbindung'}, {name:'Fertigung', input:null, output:null, status:null}],
      market:[{name:'Beispielware', stock:null, buyPrice:null, sellPrice:null, fee:null}],
      orders:[{name:'Beispiel-Lieferauftrag', issuer:'Beispielkonzern', status:'Nur Ansicht', funding:null}]
    },
    { id:'demo-empty', name:'Raumhafen · Vorschau B', ships:[] }
  ]
};
if (document.getElementById('station')) LegacyStation.mount(document.getElementById('station'), previewSnapshot);
