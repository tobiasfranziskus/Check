import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5R_RULES;
const oreFirst={...rules,w5o:{...rules.w5o,versorgungZiel:-1}};
// Nur ein explizites Diagnoseszenario, KEINE freigegebene Produktregel:
// Der automatische Eisversand wird fuer den einmaligen Werkstattversuch
// angehalten, damit dieselbe schon bezahlte Frachterhuelle Erz fahren kann.

function valid(s,label){
  const result=api.audit(s);
  assert.equal(result.ok,true,label+' '+JSON.stringify(Object.fromEntries(
    Object.entries(result).filter(([,v])=>v?.ok===false))));
  assert.equal(s.initialSupply,33000);
  assert.equal(s.minted,0,'kein neues ISK');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
  for(const [ware,w] of Object.entries(s.ledger)){
    const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
    assert.equal(physical,w.initial+w.mined+w.produced+w.imported-w.consumed-w.exported,
      label+' Ware '+ware);
  }
}
function doCmd(s,r,type,owner,args={}){
  const x=api.execute(s,{type,owner,...args},r);
  assert.equal(x.ok,true,type+' '+x.reason+' tick '+s.tick);
  valid(s,type);
}
function supply(s,r){
  doCmd(s,r,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner');
  doCmd(s,r,'shipMine','house',{schiff:miner.id,ware:'erz'});
  return miner;
}

test('W5s: normaler R32 Eisautopilot bindet Frachter, echter Zusatzminer bleibt auditiert',()=>{
  const s=api.createW5RState(42,'full','npc3');
  valid(s,'R32 start');
  supply(s,rules);
  api.advance(s,50,rules);
  valid(s,'50 echte Erz- und Eisminuten');
  assert.equal(s.ledger.erz.mined,50);
  assert.equal(s.stations.st_aldera.lager.erz,50);
  const f=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
  assert.equal(s.w5n.frachtauftrag?.schiff,f.id);
  const prior=api.hash(s);
  const rejected=api.execute(s,{type:'shipFreight',owner:'transport',schiff:f.id},rules);
  assert.equal(rejected.ok,false,'ein Frachter darf nicht doppelt eingesetzt werden');
  assert.equal(api.hash(s),prior,'abgelehnter Erzauftrag ohne Seiteneffekt');
  console.log('W5S_R32_BLOCK '+JSON.stringify({ore:s.ledger.erz.mined,
    ship:f.id,reason:rejected.reason,paidIceCargo:f.ladung.eis}));
});

test('W5s: aus echter Erzlieferung, Raffinerie und bezahlter Werft wird ein real gekaufter Ersatzfrachter in Nadir',()=>{
  for(const seed of [42,7]){
    const s=api.createW5RState(seed,'full','npc3');
    supply(s,oreFirst);
    api.advance(s,60,oreFirst);
    valid(s,'bezahlte Erzminuten und Handelsuebergang');
    assert.equal(s.ledger.erz.mined>=50,true);
    assert.equal(s.w5h.bestand,50,'Grosshaendler hat 50 reale Erz gekauft');
    const f=Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
    assert.equal(f.system,'aldera','kein kostenloser Flug');
    doCmd(s,oreFirst,'shipFreight','transport',{schiff:f.id});
    api.advance(s,120,oreFirst);
    valid(s,'voll bezahlter W3-Hin-Rueckflug');
    assert.equal(s.w3.abgeschlossen,1);
    assert.equal(s.stations.st_nadir.lager.erz,50);
    doCmd(s,oreFirst,'stationRefine','st_nadir',{station:'st_nadir'});
    api.advance(s,20,oreFirst);
    valid(s,'W4 Material aus echter Erzcharge');
    assert.equal(s.stations.st_nadir.lager.material,5);
    const werftVorher=s.owners.werft_extern.cash;
    doCmd(s,oreFirst,'stationBuildShip','werft_extern',{station:'st_nadir'});
    assert.equal(s.owners.w5_arbeit_treuhand.cash,30);
    api.advance(s,30,oreFirst);
    valid(s,'30 einzelne Werftlohnminuten');
    assert.equal(s.ledger.frachter.produced,1);
    assert.equal(s.stations.st_nadir.lager.frachter,1);
    assert.equal(s.owners.arbeiter_werft_nadir.cash,30);
    assert.equal(s.owners.werft_extern.cash,werftVorher-530);
    const before=s.owners.transport.cash,id=api.hash(s),next=s.nextShip;
    doCmd(s,oreFirst,'shipBuy','transport',{station:'st_nadir',klasse:'frachter'});
    assert.notEqual(api.hash(s),id);
    assert.equal(s.owners.transport.cash,before-750);
    assert.equal(s.owners.werft_extern.cash,werftVorher-530+750);
    assert.equal(s.stations.st_nadir.lager.frachter,0);
    assert.equal(s.w5.verkauft,1);
    const newId='sh'+String(next).padStart(3,'0');
    assert.equal(s.ships[newId]?.system,'nadir','Ersatzschiff liegt physisch in Nadir');
    assert.equal(s.ships[newId]?.owner,'transport');
    assert.equal(s.ledger.frachter.produced,1);
    assert.equal(s.ledger.frachter.consumed,2);
    assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
      'Speicher-Roundtrip ohne Schemawechsel');
    const deny=api.execute(s,{type:'shipFreightIce',owner:'transport',schiff:newId},oreFirst);
    assert.equal(deny.ok,false,'Nadir-Huelle ist nicht magisch in Aldera');
    valid(s,'gekaufte, aber noch nicht zur Eisroute gebrachte Huelle');
    console.log('W5S_REALE_ERSATZHUELLE '+JSON.stringify({seed,hash:api.hash(s),
      hullenId:newId,ort:s.ships[newId].system,
      erzTransportiert:s.w3.geliefert,materialProduziert:s.w4.materialErzeugt,
      frachterProduziert:s.w5.fertig,verkauft:s.w5.verkauft,
      werftlohn:s.w5.arbeitsGezahlt,
      fluss:{werftAusgabe:530,werftEinnahme:750,kaufSpedition:750},
      transportCash:s.owners.transport.cash,worldISK:s.initialSupply}));
  }
});
