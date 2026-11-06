import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r=api.W5R_RULES,auto={...r,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,
  autoOre:true,autoLeadDays:30},
  w5o:{...r.w5o,versorgungZiel:-1}};
const active={...r,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true}};
const off={...auto,w5s:{minerIndustry:true,concurrent:true,
  autoIndustry:true,autoLeadDays:30}};

function audit(s,label=''){
  const result=api.audit(s);
  assert.equal(result.ok,true,label+' '+JSON.stringify(Object.fromEntries(
    Object.entries(result).filter(([,x])=>x?.ok===false))));
  assert.equal(s.minted,0,'kein neues ISK');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),s.initialSupply,
    'kein verloren gegangener oder erschaffener Kontosaldo');
  for(const [ware,l] of Object.entries(s.ledger)){
    const stock=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(stock,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      label+' Bestandsprüfung '+ware);
  }
}
function cmd(s,rules,type,owner,more={}){
  const x=api.execute(s,{type,owner,...more},rules);
  assert.equal(x.ok,true,type+': '+x.reason);
  audit(s,type);
}
function basic(seed){
  const s=api.createW5RState(seed,'full','npc3');
  cmd(s,auto,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner'
    &&x.system==='aldera');
  cmd(s,auto,'shipMine','house',{schiff:sh.id,ware:'erz'});
  // Das einzige endliche Nadir-Fertigminer-Lagerfach wird durch einen
  // realen Zahlungsvorgang frei – nicht durch einen Test-Zustands-Hack.
  cmd(s,auto,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.stations.st_nadir.lager.miner,0);
  assert.equal(api.w5sErzStatus(s,auto).stage,'gekauftes_erz_fehlt');
  audit(s,'W5s-f Anfang');
  return s;
}
function deliveries(seed){
  const s=basic(seed),initialOre=s.w3.geliefert;
  let v=api.hash(s);
  assert.equal(api.w5sErzStatus(s,off).stage,'inaktiv');
  assert.equal(api.hash(s),v,'ausgeschaltete Auto-Erzplanung rein lesend');
  api.advance(s,60,auto);
  audit(s,'erste Stunde wirklich produzierte Erzcharge');
  assert.equal(s.w3.beauftragt,1,'W3 bekommt ohne manuellen Frachtbefehl Auftrag');
  assert.equal(s.w3.auftrag?.schiff,s.w5r.frachter.id,
    'einziger R32-Frachter nur bei zurückgestellter Eisroute');
  assert.equal(s.w3.auftrag?.menge,50);
  assert.equal(s.w5h.gekauft,50,'50 Erz real von Großhändler bezahlt');
  assert.ok(s.owners.w3_kauf_treuhand.cash>0);
  assert.ok(s.owners.w3_arbeit_treuhand.cash>0);
  const freightHash=api.hash(s);
  assert.equal(api.hash(api.loadW5R(api.save(s))),freightHash,
    'transitierte W3-Erzfracht Save/Load');
  const ship=s.w5r.frachter.id;
  assert.equal(api.execute(s,{type:'shipFreight',owner:'transport',schiff:ship},auto).ok,
    false,'kein doppelter Transport');
  assert.equal(api.hash(s),freightHash);
  api.advance(s,120,auto);
  audit(s,'volle 120 reale Erzflugminuten und erste W4-Arbeit');
  assert.equal(s.w3.abgeschlossen,1);
  assert.equal(s.w3.geliefert,initialOre+50);
  assert.equal(s.owners.w3_kauf_treuhand.cash,0);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,0);
  let steps=0;
  while((s.w5s?.completed?.length||0)<2 && steps++<35){
    api.advance(s,60,auto);
    audit(s,'automatische Werft- und Kaufphase '+steps);
  }
  assert.equal(s.w5s?.completed?.length,2,
    'nach neu automatisch bezahltem W3-Erz auch W5 automatisch');
  assert.equal(s.w5.fertig,2);
  assert.equal(s.w5.minerFertig,1);
  assert.equal(s.w5.verkauft,1);
  assert.equal(s.w5.minerVerkauft,1);
  assert.equal(s.w4.abgeschlossen,2);
  assert.equal(s.w5.materialVerbraucht,10);
  assert.equal(s.w5s.paid,120,'beide Hüllen 60 Min bezahlt überführt');
  assert.equal(s.w5r.assignments?.length||0,0,'keine vorzeitige Ersatzzuordnung');
  assert.equal(s.minted,0);
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  return s;
}
function replay(seed,days){
  const s=deliveries(seed);
  while(s.tick<days*1440){
    api.advance(s,Math.min(1440-(s.tick%1440),days*1440-s.tick),active);
    audit(s,'Tag '+Math.floor(s.tick/1440));
    if([15,30,60,90,365].includes(s.tick/1440))
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  }
  const row={seed,days,hash:api.hash(s),mined:s.ledger.erz.mined,
    delivered:s.w3.geliefert,shipments:s.w3.abgeschlossen,
    minerBuilt:s.w5.minerFertig,freighterBuilt:s.w5.fertig-s.w5.minerFertig,
    minerSold:s.w5.minerVerkauft,freighterSold:s.w5.verkauft,
    lostMiners:s.w5r.miner.lost,lostFreighters:s.w5r.frachter.lost,
    assignments:s.w5r.assignments.length,
    water:s.w5n.wasserVerbraucht,cashNPC:s.owners.npc3.cash,
    cashTransport:s.owners.transport.cash,
    minted:s.minted,oreStatus:api.w5sErzStatus(s,active).stage,
    shopStatus:api.w5sWerkStatus(s,active).stage};
  return row;
}
test('W5s-f: reale bezahlte W3-Erstlieferung automatisch aus echter Erzförderung, beide Hüllen in Seed42/7',()=>{
  for(const seed of [42,7]){
    const a=deliveries(seed),b=deliveries(seed);
    assert.equal(api.hash(a),api.hash(b),'gleiches Startkapital, gleicher Replay');
    console.log('W5S_F_START '+JSON.stringify({seed,hash:api.hash(a),
      w3Ore:a.w3.geliefert,material:a.w5.materialVerbraucht,
      built:a.w5.fertig,transferPaid:a.w5s.paid,
      cashNPC:a.owners.npc3.cash,cashTransport:a.owners.transport.cash}));
  }
});
test('W5s-f: ohne Käufererz oder aktiven Bedarf keine zusätzlichen bezahlten Frachten und keine Eigenmächtigkeit am Hausminer',()=>{
  const s=api.createW5RState(42,'full','npc3'),before=api.hash(s);
  const one=api.w5sErzStatus(s,auto);
  assert.equal(one.stage,'gekauftes_erz_fehlt');
  assert.equal(api.hash(s),before);
  api.advance(s,180,auto);
  audit(s,'kein vorhandenes Verkäufererz, kein Versand');
  assert.equal(s.w3.beauftragt,0);
  const house=api.createW5RState(7,'full','house');
  const p=api.w5sErzStatus(house,auto);
  assert.notEqual(p.stage,'erztransport_starten',
    'nicht aus leerem Frachter Erzgüter schöpfen');
  const houseMiner=Object.values(house.ships)
    .filter(sh=>sh.owner==='house'&&sh.klasse==='miner');
  assert.ok(houseMiner.every(sh=>sh.ware!=='erz'),
    'Hausminer wird nicht ohne Spielerbefehl auf Erz umgestellt');
  audit(house,'Sparrecht des Spielers');
});
test('W5s-f: Eisversorgung schlägt Erzlieferung auf nur einem freien R32-Frachter',()=>{
  const noAuto={...auto,w5s:{...auto.w5s,autoOre:false}};
  const s=basic(42);
  api.advance(s,60,noAuto);
  audit(s,'50 Erz am Großhandel vorhanden, kein W3 Auftrag');
  assert.equal(s.w5h.bestand,50);
  assert.equal(s.w3.auftrag,null);
  const before=api.hash(s);
  const iceFirst=api.w5sErzStatus(s,{...active,
    w5s:{...active.w5s,autoLeadDays:30}});
  assert.equal(iceFirst.stage,'kein_freier_frachter',
    'kein Stehlen des einzigen noch für Eis benötigten Frachters');
  assert.equal(iceFirst.eisPrioritaet,true);
  assert.equal(api.hash(s),before,'reine Planung ohne Buchung');
  const oreFirst=api.w5sErzStatus(s,auto);
  assert.equal(oreFirst.stage,'erztransport_starten');
  assert.equal(oreFirst.schiff,s.w5r.frachter.id);
  assert.equal(api.hash(s),before,'auch positiver Plan mutiert nichts');
});
test('W5s-f: 13 Seedwelten ×90 Tage, Tag-Audit, Save/Load und Krisen-Replay',()=>{
  for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
    const a=replay(seed,90);
    if([42,7].includes(seed))
      assert.deepEqual(replay(seed,90),a,'90 Tage vollständig deterministisch');
    console.log('W5S_F_90D '+JSON.stringify(a));
  }
});
test('W5s-f: Seeds42 und 7 je 365 Tage, ohne neue ISK oder kostenlose Folgekäufe',()=>{
  for(const seed of [42,7]){
    const a=replay(seed,365);
    assert.equal(a.minted,0);
    console.log('W5S_F_365D '+JSON.stringify(a));
  }
});
