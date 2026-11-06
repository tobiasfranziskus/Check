import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const r=api.W5R_RULES;
const passive={...r,w5s:{minerIndustry:true,concurrent:true}};
const fast={...r,w5s:{minerIndustry:true,concurrent:true,
  autoIndustry:true,autoLeadDays:30}};
const natural={...r,w5s:{minerIndustry:true,concurrent:true,autoIndustry:true}};

function verify(s,why){
  const a=api.audit(s);
  assert.equal(a.ok,true,why+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,v])=>v?.ok===false))));
  assert.equal(s.minted,0,'kein ISK-Minting');
  assert.equal(s.burned,0,'kein ISK-Burning');
  assert.equal(Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0),
    s.initialSupply,'alle Gelder bleiben vollständig erhalten');
  for(const [ware,b]of Object.entries(s.ledger)){
    const actual=Object.values(s.stations).reduce(
      (n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(actual,b.initial+b.mined+b.produced+b.imported-b.consumed-b.exported,
      why+' Warenledger: '+ware);
  }
}
function cmd(s,rules,type,owner,args={}){
  const o=api.execute(s,{type,owner,...args},rules);
  assert.equal(o.ok,true,type+': '+o.reason);
  verify(s,type);
}
function start(seed){
  const s=api.createW5RState(seed,'full','npc3');
  // Alle W5s-e-Angebote beginnen mit echter selbst bezahlter Erzförderung.
  cmd(s,passive,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const miner=Object.values(s.ships).find(x=>x.owner==='house'
    &&x.klasse==='miner'&&x.system==='aldera');
  cmd(s,passive,'shipMine','house',{schiff:miner.id,ware:'erz'});
  api.advance(s,60,passive);
  assert.equal(s.w5h.bestand,50);
  cmd(s,passive,'shipFreight','transport',{schiff:s.w5r.frachter.id});
  api.advance(s,120,passive);
  assert.equal(s.w3.geliefert,50);
  // Der vorhandene endliche Nadir-Starterminer belegt den einzigen Lagerplatz.
  // Ein realer Hauskauf für 600 ISK gibt diesen Platz frei; kein Löschen.
  cmd(s,passive,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  assert.equal(s.stations.st_nadir.lager.miner,0);
  assert.equal(s.stations.st_nadir.lager.erz,50);
  verify(s,'50 reales Erz / freier Werftplatz');
  return s;
}
function build(seed){
  const s=start(seed);
  const before=api.hash(s),plan=api.w5sWerkStatus(s,fast);
  assert.equal(plan.stage,'raffinieren');
  assert.equal(plan.type,'miner');
  assert.equal(api.hash(s),before,'reiner Werkplan darf Zustand nicht ändern');
  let steps=0;
  while((s.w5s?.completed?.length??0)<2&&steps++<35){
    api.advance(s,60,fast);
    verify(s,'automatischer W4/W5/W5s-Auftrag Stunde '+steps);
  }
  assert.equal(s.w5s?.completed?.length,2,
    'automatische Miner- und Frachterproduktion/Überführung');
  assert.equal(s.w5.fertig,2,'genau zwei bezahlte Werftchargen');
  assert.equal(s.w5.minerFertig,1);
  assert.equal(s.w5.minerVerkauft,1);
  assert.equal(s.w5.verkauft,1);
  assert.equal(s.w4.abgeschlossen,2);
  assert.equal(s.w4.erzVerbraucht,20,'kein künstliches Erz');
  assert.equal(s.w5.materialVerbraucht,10);
  assert.equal(s.ledger.miner.produced,1);
  assert.equal(s.ledger.frachter.produced,1);
  assert.equal(s.w5s.paid,120,'120 wirklich geleistete Pilotenminuten');
  assert.equal(s.w5s.paidTransport,60,'nur 60 überführte Speditionsminuten');
  assert.equal(s.ledger.miner.consumed,
    Object.values(s.ships).filter(x=>x.klasse==='miner').length);
  assert.equal(s.ledger.frachter.consumed,
    Object.values(s.ships).filter(x=>x.klasse==='frachter').length);
  const newMiner=s.w5.minerSchiffIds[0],newFreighter=s.w5.schiffIds[0];
  assert.ok(newMiner&&newFreighter&&newMiner!==newFreighter);
  assert.equal(s.ships[newMiner].system,'aldera');
  assert.equal(s.ships[newFreighter].system,'aldera');
  assert.equal(s.w5r.miner.bought,0);
  assert.equal(s.w5r.frachter.bought,0);
  assert.equal(s.w5r.assignments?.length??0,0,
    'kein vorgezogener R32-Ersatz vor echtem Verschleiß');
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  return {s,newMiner,newFreighter};
}
function run(seed,days){
  const {s,newMiner,newFreighter}=build(seed);
  const until=days*1440;
  while(s.tick<until){
    const n=Math.min(1440-(s.tick%1440),until-s.tick);
    api.advance(s,n,natural);
    verify(s,'Tag '+Math.floor(s.tick/1440));
    if([15,30,60,90,365].includes(s.tick/1440))
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
        'speicherbare reale W5s-e-Welt');
  }
  assert.ok(s.w5r.assignments?.some(x=>x.id===newMiner));
  if(days>=30)assert.ok(s.w5r.assignments?.some(x=>x.id===newFreighter));
  const row={seed,days,hash:api.hash(s),minted:s.minted,
    ore:s.stations.st_nadir.lager.erz,
    mineral:s.stations.st_nadir.lager.material,
    shipMiner:s.w5.minerFertig,shipFreighter:s.w5.fertig-s.w5.minerFertig,
    soldMiner:s.w5.minerVerkauft,soldFreighter:s.w5.verkauft,
    paidTransfers:s.w5s.paid,assignments:s.w5r.assignments.length,
    minerLosses:s.w5r.miner.lost,freightLosses:s.w5r.frachter.lost,
    npcCash:s.owners.npc3.cash,transportCash:s.owners.transport.cash,
    water:s.w5n.wasserVerbraucht};
  return row;
}

test('W5s-e: reale automatische W4→W5→Kauf→Überführung beider Schiffstypen in Seed42/7',()=>{
  for(const seed of [42,7]){
    const a=build(seed),b=build(seed);
    assert.equal(api.hash(a.s),api.hash(b.s),'deterministisch gleich');
    assert.deepEqual(a.s.w5s.completed,b.s.w5s.completed);
    console.log('W5S_E_BOTH '+JSON.stringify({seed,
      hash:api.hash(a.s),miner:a.newMiner,freighter:a.newFreighter,
      paid:a.s.w5s.paid,materials:a.s.w5.materialVerbraucht}));
  }
});
test('W5s-e: ohne Rohstoff kein neuer Bau; ohne Profil/mit Player-Miner kein erzwungener Kauf',()=>{
  const s=api.createW5RState(42,'full','npc3');
  const hash=api.hash(s);
  assert.equal(api.w5sWerkStatus(s,r).stage,'inaktiv');
  assert.equal(api.hash(s),hash);
  assert.notEqual(api.w5sWerkStatus(s,fast).stage,'bauen');
  // Der vorhandene Nadir-Starterbestand wird nicht zum neu produzierten
  // Ersatz umetikettiert. Erst ein regulärer Kauf schafft Werftplatz.
  cmd(s,passive,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  assert.equal(api.w5sWerkStatus(s,fast).stage,'erz_fehlt');
  const mined=s.ledger.miner.produced;
  api.advance(s,180,fast);
  verify(s,'kein Erz, kein künstlicher Neubau');
  assert.equal(s.ledger.miner.produced,mined);
  const house=api.createW5RState(7,'full','house');
  const plan=api.w5sWerkStatus(house,fast);
  assert.notEqual(plan.type,'miner','W5s-e beauftragt keinen Spielerzwangskauf');
  verify(house,'Player-Sparen geschützt');
});
test('W5s-e: 13 Seeds × 90 Tage nach bezahltem Start, tägliche unabhängige Audits',()=>{
  for(const seed of [42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159]){
    const a=run(seed,90);
    if(seed===42||seed===7)
      assert.deepEqual(run(seed,90),a,'deterministischer 90d-Replay');
    console.log('W5S_E_90D '+JSON.stringify(a));
  }
});
test('W5s-e: Seed42/7 × 365 Tage ohne Gratisrettung oder künstliches Kapital',()=>{
  for(const seed of [42,7]){
    const a=run(seed,365);
    assert.equal(a.minted,0);
    console.log('W5S_E_365D '+JSON.stringify(a));
  }
});
