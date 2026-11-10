import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {mount}=createRequire(import.meta.url)('../prototypes/legacy-station/station.js');
function root() {
  const handlers={}, area={scrollTop:0};
  return {innerHTML:'', handlers, addEventListener(k,f){handlers[k]=f;}, removeEventListener(k){delete handlers[k];},
    contains(){return true;}, querySelector(s){return s==='.content'?area:null;},
    click(dataset){handlers.click({target:{closest(){return {dataset};}}});},
    station(i){handlers.change({target:{value:String(i),hasAttribute:k=>k==='data-station'}});}};
}
function fixture(){return {provenance:'Testdaten',stations:[{id:'a',name:'A',ships:[{id:'one',name:'Eins',cargo:[]},{id:'two',name:'Zwei'}],storage:[]},{id:'b',name:'B',ships:[{id:'other',name:'Anderes'}]}]};}
function freeze(o){Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return o;}
test('Navigation und Schiffsauswahl verändern einen tief gefrorenen Snapshot nicht',()=>{
  const data=freeze(fixture()), before=JSON.stringify(data), r=root(), ui=mount(r,data);
  for(const tab of ['hangar','storage','industry','market','orders','connections','overview'])r.click({tab});
  r.click({ship:'1'});r.station(1);
  assert.equal(JSON.stringify(data),before);assert.deepEqual(ui.getSelection(),{stationId:'b',shipId:'other',tab:'overview'});
});
test('Stabile IDs statt Namen, getrennte Mounts und defensive Auswahlkopie',()=>{
  const data=fixture();data.stations[0].ships[1].name='Eins';
  const r=root(),ui=mount(r,data), second=mount(root(),data);r.click({ship:'1'});
  const selection=ui.getSelection();selection.shipId='kaputt';
  assert.equal(ui.getSelection().shipId,'two');assert.equal(second.getSelection().shipId,'one');
});
test('Update kopiert Input, erhält gültige Auswahl und fällt nach Entfernen zurück',()=>{
  const r=root(), data=fixture(),ui=mount(r,data);r.click({tab:'hangar'});r.click({ship:'1'});
  ui.update(freeze(fixture()));assert.equal(ui.getSelection().shipId,'two');
  data.stations[0].name='Nachträglich geändert';r.click({tab:'overview'});assert.doesNotMatch(r.innerHTML,/Nachträglich/);
  ui.update({stations:[{id:'b',name:'Neu',ships:[]}]});assert.deepEqual(ui.getSelection(),{stationId:'b',shipId:null,tab:'overview'});
  ui.update({});assert.equal(ui.getSelection().stationId,null);
});
test('Sichere Textausgabe für Station, Schiff und alle Tabellenfelder',()=>{
  const attack='<img src=x onerror="alert(1)"> & \'',data=fixture(),s=data.stations[0];
  s.name=attack;s.ships[0].name=attack;
  for(const key of ['storage','industry','market','orders'])s[key]=[{name:attack,quantity:attack,input:attack,issuer:attack}];
  const r=root();mount(r,data);
  for(const tab of ['hangar','storage','industry','market','orders']){r.click({tab});assert.doesNotMatch(r.innerHTML,/<img|onerror="/);assert.match(r.innerHTML,/&lt;img/);}
});
test('Fehlende Werte bleiben unbekannt, explizit leere Listen und Nullmengen sind verschieden',()=>{
  const data=fixture();data.stations[0].storage=[{name:'Nullmenge',quantity:0},{name:'Unbekannt',quantity:null}];
  const r=root();mount(r,data);r.click({tab:'storage'});
  assert.match(r.innerHTML,/<td>0<\/td>/);assert.match(r.innerHTML,/Nicht verfügbar/);assert.match(r.innerHTML,/Keine Einträge im Snapshot/);
  for(const tab of ['industry','market','orders']){r.click({tab});assert.match(r.innerHTML,/Nicht verfügbar/);assert.doesNotMatch(r.innerHTML,/undefined|NaN/);}
});
test('Ungültige Navigation ist wirkungslos; Stationswechsel setzt nur Schiff zurück',()=>{
  const r=root(),ui=mount(r,fixture());r.click({tab:'market'});r.station(1);r.click({tab:'buy'});r.click({ship:900});r.station(900);
  assert.deepEqual(ui.getSelection(),{stationId:'b',shipId:'other',tab:'market'});
});
test('Nicht-JSON und doppelte IDs werden abgelehnt; fehlgeschlagenes Update bleibt atomar',()=>{
  const r=root(),ui=mount(r,fixture()),before=r.innerHTML;
  const circular={};circular.self=circular;
  for(const data of [null,[],{x:undefined},{x:()=>1},{x:NaN},circular,{stations:[{id:'a'},{id:'a'}]}])assert.throws(()=>ui.update(data),TypeError);
  assert.equal(r.innerHTML,before);assert.equal(ui.getSelection().stationId,'a');
});
test('Destroy entfernt Listener und lehnt nachträgliches Update ab',()=>{
  const r=root(),ui=mount(r,fixture());ui.destroy();assert.deepEqual(r.handlers,{});assert.equal(r.innerHTML,'');assert.throws(()=>ui.update({}));
});
