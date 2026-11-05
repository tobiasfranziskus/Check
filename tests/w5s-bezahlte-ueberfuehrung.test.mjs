import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();

// Nur in der expliziten W5s-b-Probe aktiv. Dieselbe R32-Forschungswelt,
// dieselben realen Waren, Preise und Konten; KEIN produktiver Dispatcher.
const full={...api.W5R_RULES,w5s:{}};
const oreFirst={...full,w5o:{...full.w5o,versorgungZiel:-1}};

function valid(s,bezeichnung){
  const a=api.audit(s);
  assert.equal(a.ok,true,bezeichnung+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,v])=>v?.ok===false))));
  assert.equal(s.initialSupply,33000);
  assert.equal(s.minted,0,'kein neues ISK');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,v)=>n+v.cash,0),33000,
    'Weltgeld bleibt erhalten');
  for(const [ware,l]of Object.entries(s.ledger)){
    const ist=Object.values(s.stations).reduce((n,v)=>n+(v.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,v)=>n+(v.ladung[ware]||0),0);
    assert.equal(ist,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      bezeichnung+' Warenaudit '+ware);
  }
}
function cmd(s,r,type,owner,args={}){
  const o=api.execute(s,{type,owner,...args},r);
  assert.equal(o.ok,true,type+' tick '+s.tick+': '+o.reason);
  valid(s,type);
}

function echteHuelle(seed){
  const s=api.createW5RState(seed,'full','npc3');
  cmd(s,oreFirst,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  cmd(s,oreFirst,'shipMine','house',{schiff:miner.id,ware:'erz'});
  api.advance(s,60,oreFirst);
  assert.equal(s.w5h.bestand,50,'50 Erz real an Großhändler verkauft');
  const alt=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
  cmd(s,oreFirst,'shipFreight','transport',{schiff:alt.id});
  api.advance(s,120,oreFirst);
  assert.equal(s.w3.geliefert,50);
  cmd(s,oreFirst,'stationRefine','st_nadir',{station:'st_nadir'});
  api.advance(s,20,oreFirst);
  cmd(s,oreFirst,'stationBuildShip','werft_extern',{station:'st_nadir'});
  assert.equal(s.owners.w5_arbeit_treuhand.cash,30);
  api.advance(s,30,oreFirst);
  assert.equal(s.ledger.frachter.produced,1);
  const next=s.nextShip;
  cmd(s,oreFirst,'shipBuy','transport',{station:'st_nadir',klasse:'frachter'});
  const neu='sh'+String(next).padStart(3,'0');
  assert.equal(s.ships[neu].system,'nadir');
  assert.equal(s.owners.transport.cash,620);
  assert.equal(s.w5.verkauft,1);
  valid(s,'vollständig bezahlte Hülle in Nadir');
  return {s,alt:alt.id,neu};
}
function transfer(seed,saveMid=false){
  const {s,alt,neu}=echteHuelle(seed);
  const unberechtigt=api.hash(s);
  const falscherOwner=api.execute(s,
    {type:'shipReposition',owner:'house',schiff:neu},oreFirst);
  assert.equal(falscherOwner.ok,false,'falscher Eigner darf nicht fliegen');
  assert.equal(api.hash(s),unberechtigt,'Ablehnung hat keine Seitenwirkung');
  const keinProfil=api.execute(s,
    {type:'shipReposition',owner:'transport',schiff:neu},api.W5R_RULES);
  assert.equal(keinProfil.ok,false,'R32 ohne W5s bleibt geschützt');
  assert.equal(api.hash(s),unberechtigt);
  const cash=s.owners.transport.cash;
  s.owners.transport.cash=0;
  const ohneGeld=api.hash(s);
  assert.equal(api.execute(s,{type:'shipReposition',
    owner:'transport',schiff:neu},oreFirst).ok,false,
    'ohne vollständigen Lohnvorschuss kein Start');
  assert.equal(api.hash(s),ohneGeld,'keine Teilreservierung bei Ablehnung');
  s.owners.transport.cash=cash;
  valid(s,'Kasse nach negativer Gegenprobe wiederhergestellt');

  const wage=oreFirst.w5n.fliegerLohn;
  assert.equal(wage,1,'bestehender bezahlter Pilotenlohn');
  const funds=s.owners.transport.cash;
  const shipCount=Object.keys(s.ships).length;
  cmd(s,oreFirst,'shipReposition','transport',{schiff:neu});
  assert.equal(s.owners.transport.cash,funds-60);
  assert.equal(s.owners.w5s_transfer_reserved.cash,60);
  assert.equal(s.w5s.allocated,60);
  assert.equal(s.ships[neu].phase,'reise');
  assert.equal(s.ships[neu].system,'nadir','kein Teleport beim Start');
  assert.equal(s.ships[neu].ankunft-s.tick,60);
  assert.equal(Object.keys(s.ships).length,shipCount,'keine weitere Hülle erschaffen');

  const twice=api.hash(s);
  const wieder=api.execute(s,{type:'shipReposition',
    owner:'transport',schiff:neu},oreFirst);
  assert.equal(wieder.ok,false,'keine doppelte Reise-Reservierung');
  assert.equal(api.hash(s),twice);
  api.advance(s,30,oreFirst);
  assert.equal(s.ships[neu].system,'nadir','erste Hälfte fliegt tatsächlich');
  assert.equal(s.owners.w5s_transfer_reserved.cash,30);
  assert.equal(s.owners.w5s_transfer_pilot.cash,30);
  valid(s,'30 tatsächlich vergütete Reiseminuten');
  const vorFehler=api.hash(s);
  s.w5s.paid++;
  assert.equal(api.audit(s).ok,false,'gefälschte Lohnzahlung fällt auf');
  assert.throws(()=>api.loadW5R(api.save(s)),/Bilanz|inkompatibel/);
  s.w5s.paid--;
  assert.equal(api.hash(s),vorFehler);
  if(saveMid){
    const snap=api.save(s),geladen=api.loadW5R(snap);
    assert.equal(api.hash(geladen),api.hash(s),'Reise-/Treuhand-Roundtrip');
  }
  api.advance(s,30,oreFirst);
  valid(s,'Nadir–Aldera nach 60 real bezahlten Minuten');
  assert.equal(s.ships[neu].system,'aldera');
  assert.equal(s.ships[neu].phase,'dock');
  assert.equal(s.owners.w5s_transfer_reserved.cash,0);
  assert.equal(s.owners.w5s_transfer_pilot.cash,60);
  assert.equal(s.w5s.completed.length,1);
  assert.equal(s.w5r.frachter.id,alt,'vor Verschleiß noch echte Ersthülle');
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));

  while(s.tick<30*1440){
    api.advance(s,Math.min(1440,30*1440-s.tick),oreFirst);
    if(s.tick%1440===0)valid(s,'täglicher unabhängiger Audit');
  }
  assert.equal(s.w5r.frachter.lost,1);
  assert.equal(s.w5r.frachter.id,neu,
    'bereits gekaufte und hergeflogene Hülle ist echter R32-Ersatz');
  assert.equal(s.w5r.frachter.bought,0,
    'kein zweiter Schiffskauf bei R32-Ersatzzuordnung');
  assert.equal(s.w5r.assignments?.length,1);
  assert.equal(s.w5r.assignments[0].id,neu);
  assert.equal(s.ledger.frachter.consumed,2,
    'Originalkauf plus neuer Werftkauf, ohne Doppelzählung');
  assert.equal(s.stations.st_aldera.lager.frachter,0);
  assert.equal(s.ships[neu]?.system,'aldera');
  valid(s,'Tag30: Ersatzhülle belegt ohne Zusatzkauf');
  const alteFrachterzahl=s.w5n.frachtAbgeschlossen;
  api.advance(s,1,full);
  assert.equal(s.w5n.frachtauftrag?.schiff,neu,
    'R32-Autopilot kann echte neue Hülle einsetzen');
  api.advance(s,120,full);
  assert.equal(s.w5n.frachtAbgeschlossen,alteFrachterzahl+1,
    'echte bezahlte Eis-Hin-/Rückrunde abgeschlossen');
  assert.equal(s.ships[neu]?.system,'aldera');
  valid(s,'R32 Eisversorgung nach bezahlter Überführung');
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  return {seed,hash:api.hash(s),ship:neu,replacement:s.w5r.frachter.id,
    iceTrips:s.w5n.frachtAbgeschlossen,transferPaid:s.w5s.paid,
    produced:s.ledger.frachter.produced,consumed:s.ledger.frachter.consumed,
    minted:s.minted};
}

test('W5s-b: Seed42/7 bezahlte Nadir–Aldera Überführung, Ersatz ohne Doppelzahlung, echte Eisrunde',()=>{
  for(const seed of [42,7]){
    const a=transfer(seed,true),b=transfer(seed,false);
    assert.deepEqual(a,b,'Seed und Befehlsfolge wiederholen sich deterministisch');
    console.log('W5S_B_REAL_REPLACEMENT '+JSON.stringify(a));
  }
});
