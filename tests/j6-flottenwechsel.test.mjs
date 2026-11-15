// J6: derselbe autoritative Regel204-Weltstand, keine Pilotenteleportation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const J6=require('../prototypes/j4c/flotten-wechsel.js');
const original=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const profile=JSON.parse(original).w5ad.profile;
const sitzung=()=>({spielt:false,patrouille:null,duell:null});
function anfang(){
  const w=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
  const s=w.load(original);
  assert.equal(w.audit(s).ok,true);
  return {w,s};
}
function unveraendert(w,s,aktion){
  const save=w.save(s),hash=w.hash(s);
  const result=aktion();
  assert.equal(w.save(s),save,'Flottenauswahl darf Core-Save nicht verändern');
  assert.equal(w.hash(s),hash,'Flottenauswahl darf Worldhash nicht verändern');
  assert.equal(w.audit(s).ok,true);
  return result;
}

test('J6-Angebote unterscheiden eigene bezahlte Jäger, Miner, Frachter und fremde Schiffe',()=>{
  const {w,s}=anfang();
  const angebote=unveraendert(w,s,()=>J6.liste(w,s,'sh023',sitzung()));
  assert.equal(Object.isFrozen(angebote),true);
  assert.ok(angebote.some(sh=>sh.id==='sh023'&&!sh.auswaehlbar));
  assert.ok(angebote.some(sh=>sh.id==='sh022'&&sh.klasse==='miner'&&!sh.auswaehlbar));
  assert.ok(angebote.some(sh=>sh.id==='sh021'&&sh.klasse==='frachter'&&!sh.auswaehlbar));
  assert.equal(angebote.every(sh=>s.ships[sh.id].owner==='house'),true);
  assert.equal(angebote.some(sh=>sh.auswaehlbar),false,'Originalsave besitzt nur einen gekauften Spielerjäger');
  assert.match(J6.pruefen(w,s,'sh023','sh022',sitzung()).reason,/kein eigener/);
  assert.match(J6.pruefen(w,s,'sh023','sh020',sitzung()).reason,/kein eigener/);
  assert.match(J6.pruefen(w,s,'sh023','sh023',sitzung()).reason,/anderes/);
  assert.match(J6.pruefen(w,s,'sh023','nicht-da',sitzung()).reason,/kein eigener/);
  assert.match(J6.pruefen(w,s,'sh023','sh025',sitzung()).reason,/kein eigener/);
});

test('J6 verweigert Flug, fehlende Sitzungsangaben und aktiven Einsatz ohne Zeit-/Geldänderung',()=>{
  const {w,s}=anfang();
  for(const options of [
    null,{spielt:false},{spielt:true,patrouille:null,duell:null},
    {spielt:false,patrouille:{status:'flug'},duell:null},
    {spielt:false,patrouille:null,duell:{status:'aktiv'}}
  ]){
    const r=unveraendert(w,s,()=>J6.pruefen(w,s,'sh023','sh025',options));
    assert.equal(r.ok,false);
  }
  const undock=w.execute(s,{type:'shipUndock',owner:'house',schiff:'sh023'});
  assert.equal(undock.ok,true,JSON.stringify(undock));
  const r=unveraendert(w,s,()=>J6.pruefen(w,s,'sh023','sh025',sitzung()));
  assert.equal(r.ok,false);
  assert.equal(s.kanon.flugdienst.sh023.minuten,0);
  assert.equal(w.audit(s).ok,true);
});

test('J6 erlaubt nur die bezahlte zweite Jägerhülle am selben Dock; kein Teleport, keine versteckten Kosten',()=>{
  const {w,s}=anfang();
  const cmd=(type,extra={})=>{
    const c={type,owner:'st_nadir',station:'st_nadir',...extra};
    if(['siliconMineStart','siliconSell','shipUndock','shipFlyTo'].includes(type)||type.startsWith('industrialOre'))delete c.station;
    const r=w.execute(s,c);
    assert.equal(r.ok,true,JSON.stringify({c,r}));
    assert.equal(w.audit(s).ok,true);
    return r;
  };
  const until=f=>{for(let i=0;!f();i++){assert.ok(i<1000,'Original-Core soll Fortschritt erzielen');w.minute(s);}};
  // Derselbe belegte Originalpfad wie J5-W; keine Waren oder Schiffe hinzuerfinden.
  cmd('siliconMineStart',{owner:'house',schiff:'sh022'});
  cmd('shipUndock',{owner:'house',schiff:'sh022'});w.minute(s);
  cmd('shipFlyTo',{owner:'house',schiff:'sh022',x:720000,y:-480000});
  until(()=>s.kanon.silizium.auftrag.gefoerdert===8);
  cmd('shipDock',{owner:'house',schiff:'sh022'});
  until(()=>s.ships.sh022.flug.lage==='angedockt');
  cmd('siliconSell',{owner:'house',schiff:'sh022'});
  cmd('shipBuy',{owner:'transport',klasse:'frachter'});
  cmd('industrialOreOffer',{miner:'sh008',frachter:'sh020'});
  cmd('industrialOreAcceptMine',{owner:'npc3'});
  cmd('industrialOreAcceptFreight',{owner:'transport'});
  cmd('industrialOreAcceptYard',{owner:'werft_extern'});
  cmd('industrialOreCommit');
  until(()=>s.w3.auftrag?.phase==='rueck');
  cmd('stationRefine');until(()=>!s.w4.auftrag);
  cmd('industrialOreBuildShip',{owner:'werft_extern'});
  until(()=>!s.w5.auftrag&&!s.w3.auftrag);
  for(let i=0;i<4;i++){cmd('stationRefine');until(()=>!s.w4.auftrag);}
  for(let i=0;i<8;i++){cmd('stationBuildParts');until(()=>!s.kanon.bauteile.auftrag);}
  cmd('stationBuildFighter');w.advance(s,32);
  cmd('shipBuy',{owner:'house',klasse:'jaeger'});
  assert.equal(s.ships.sh025.owner,'house');
  assert.equal(s.kanon.jaeger.kaeufe.length,2);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  const hin=unveraendert(w,s,()=>J6.pruefen(w,s,'sh023','sh025',sitzung()));
  assert.deepEqual(hin,{ok:true,pilot:'sh025',vorher:'sh023',station:'st_nadir',
    trainingsanzeigenZuruecksetzen:false});
  const zurueck=unveraendert(w,s,()=>J6.pruefen(w,s,hin.pilot,'sh023',{
    spielt:false,patrouille:{status:'erfolgreich'},duell:null
  }));
  assert.equal(zurueck.ok,true);
  assert.equal(zurueck.trainingsanzeigenZuruecksetzen,true);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
  // Schiffe sind echte, getrennte Hüllen; keine Veränderung ihrer Position.
  assert.equal(s.ships.sh023.flug.anker,'st_nadir');
  assert.equal(s.ships.sh025.flug.anker,'st_nadir');
  assert.equal(s.owners.house.cash,678);
});

test('J6 lehnt manipuliertes Eigentum und fehlende Audit-Nachweise ab',()=>{
  const {w,s}=anfang();
  const imitat={...s.ships.sh023,id:'sh025'};
  s.ships.sh025=imitat; // absichtlich gefälschte Hülle OHNE Bau- und Kaufbelege
  assert.equal(J6.pruefen(w,s,'sh023','sh025',sitzung()).ok,false);
  delete s.ships.sh025;
  assert.equal(w.audit(s).ok,true);
  const alt=unveraendert(w,s,()=>J6.pruefen(w,{...s,rulesVersion:195},'sh023','sh025',sitzung()));
  assert.equal(alt.ok,false);
});
