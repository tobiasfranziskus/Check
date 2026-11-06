import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const core=api.W5R_RULES;
const oreFirst={...core,w5s:{},w5o:{...core.w5o,versorgungZiel:-1}};
const dual={...core,w5s:{concurrent:true}};

function audit(s,context=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,context+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,v])=>v?.ok===false))));
  assert.equal(s.minted,0,'kein Minting');
  assert.equal(s.burned,0,'keine versteckten Senken');
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
  for(const [name,l]of Object.entries(s.ledger)){
    const physical=Object.values(s.stations).reduce((n,x)=>n+(x.lager[name]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[name]||0),0);
    assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      context+' Ware '+name);
  }
}
function cmd(s,r,type,owner,args={}){
  const res=api.execute(s,{type,owner,...args},r);
  assert.equal(res.ok,true,type+' '+res.reason+' tick '+s.tick);
  audit(s,type);
}
function construct(seed){
  const s=api.createW5RState(seed,'full','npc3');
  cmd(s,oreFirst,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  cmd(s,oreFirst,'shipMine','house',{schiff:miner.id,ware:'erz'});
  api.advance(s,60,oreFirst);
  audit(s,'50 Erz gefördert');
  assert.equal(s.w5h.bestand,50);
  const old=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
  cmd(s,oreFirst,'shipFreight','transport',{schiff:old.id});
  api.advance(s,120,oreFirst);
  audit(s,'Erztransport abgeschlossen');
  cmd(s,oreFirst,'stationRefine','st_nadir',{station:'st_nadir'});
  api.advance(s,20,oreFirst);
  cmd(s,oreFirst,'stationBuildShip','werft_extern',{station:'st_nadir'});
  api.advance(s,30,oreFirst);
  assert.equal(s.stations.st_nadir.lager.frachter,1);
  const next=s.nextShip;
  cmd(s,oreFirst,'shipBuy','transport',{station:'st_nadir',klasse:'frachter'});
  const neu='sh'+String(next).padStart(3,'0');
  assert.equal(s.ships[neu].system,'nadir');
  cmd(s,oreFirst,'shipReposition','transport',{schiff:neu});
  api.advance(s,60,oreFirst);
  assert.equal(s.ships[neu].system,'aldera');
  assert.equal(s.w5s.paid,60);
  assert.equal(s.w5r.frachter.id,old.id);
  audit(s,'zweiter real gebauter Frachter in Aldera');
  return {s,old:old.id,neu,miner:miner.id};
}
function scenario(seed,{longDays=0}={}){
  const {s,old,neu,miner}=construct(seed);
  // Alle Erzmengen werden durch denselben validierten Mine-/Handelskern
  // erzeugt und bezahlt; keine künstlichen Lager-/Kassenänderungen.
  cmd(s,oreFirst,'shipMine','house',{schiff:miner,ware:'erz'});
  api.advance(s,100,oreFirst);
  audit(s,'erneuter echter Erzabbau');
  const vor={erz:s.w5h.bestand,ice:s.stations.st_aldera.lager.eis,
    cold:s.owners.transport.cash,buyer:s.owners.st_nadir.cash,
    owner:s.owners.export.cash,miners:s.ledger.erz.mined};
  let simultaneous=false, first=null;
  for(let i=0;i<600;i++){
    api.advance(s,1,dual);
    if(s.w3.auftrag&&s.w5n.frachtauftrag){
      first={tick:s.tick,ore:s.w3.auftrag.schiff,ice:s.w5n.frachtauftrag.schiff};
      assert.notEqual(first.ore,first.ice,'nie dasselbe Schiff doppelt buchen');
      simultaneous=true;break;
    }
  }
  assert.equal(simultaneous,true,'zwei bezahlte gleichzeitige Frachten: '+JSON.stringify({
    vor,after:{w3:s.w3,ice:s.w5n.frachtauftrag,ships:Object.values(s.ships)
      .filter(sh=>sh.klasse==='frachter').map(sh=>({id:sh.id,system:sh.system,phase:sh.phase,auftrag:sh.auftrag})),
      w5h:s.w5h,transport:s.owners.transport.cash}}));
  assert.equal(first.ice,old,'Eisversorgung ist an aktiven R32-Frachter gebunden');
  assert.equal(first.ore,neu,'Erzauftrag nutzt echte zweite Werfthülle');
  audit(s,'gleichzeitige reale Ladung und Lohnreservierung');
  assert.ok(s.owners.w3_arbeit_treuhand.cash>0);
  assert.ok(s.owners.w5n_fracht_arbeit.cash>0);
  const hash=api.hash(s);
  assert.equal(api.execute(s,{type:'shipFreight',owner:'transport',schiff:old},dual).ok,false);
  assert.equal(api.execute(s,{type:'shipFreightIce',owner:'transport',schiff:neu},dual).ok,false);
  assert.equal(api.hash(s),hash,'doppelter Einsatz ohne Seiteneffekt');
  const snap=api.save(s),resumed=api.loadW5R(snap);
  assert.equal(api.hash(resumed),api.hash(s),'Save/Load mitten in beiden bezahlten Frachten');
  api.advance(s,120,dual);
  api.advance(resumed,120,dual);
  assert.equal(api.hash(resumed),api.hash(s),'reproduzierbare Auftragsticks nach Save/Load');
  assert.ok(s.w3.abgeschlossen>=2,'zweite echte Erz-Hin-/Rückfahrt');
  assert.ok(s.w5n.frachtAbgeschlossen>=1,'erste echte Eis-Hin-/Rückfahrt');
  audit(s,'zwei bezahlte abgeschlossene Frachten');
  const row={seed,hash:api.hash(s),first,oreTrips:s.w3.abgeschlossen,
    iceTrips:s.w5n.frachtAbgeschlossen,worldISK:s.initialSupply,
    minted:s.minted,produced:s.ledger.frachter.produced,
    purchased:s.ledger.frachter.consumed,w5sPaid:s.w5s.paid};
  if(longDays){
    for(let day=1;day<=longDays;day++){
      let time=1440;
      while(time>0){const n=Math.min(time,dual.maxAdvanceSteps);api.advance(s,n,dual);time-=n;}
      audit(s,'Langzeit Tag '+day);
      if(day===30||day===60||day===90||day===365)
        assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
          'Tag '+day+' Save/Load');
    }
    row.longHash=api.hash(s);
    row.water=s.w5n.wasserVerbraucht;
    row.iceTrips=s.w5n.frachtAbgeschlossen;
    row.oreTrips=s.w3.abgeschlossen;
    row.losses=s.w5r.frachter.lost;
    row.assigned=s.w5r.assignments?.length??0;
  }
  return row;
}
test('W5s-c: Seed42/7 reale W3-Erz- und W5n-Eisflüge auf zwei verschiedenen finanzierten Hüllen',()=>{
  for(const seed of [42,7]){
    const a=scenario(seed),b=scenario(seed);
    assert.deepEqual(a,b,'gleiche Befehle ergeben denselben Weltzustand');
    console.log('W5S_C_PARALLEL '+JSON.stringify(a));
  }
});


test('W5s-c: 13 feste Seeds × 90 Tage – unabhängige tägliche Geld-/Waren-Audits, Save/Load, keine Gratisrettung',()=>{
  const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
  for(const seed of seeds){
    const data=scenario(seed,{longDays:90});
    assert.equal(data.minted,0);
    assert.ok(data.oreTrips>=2&&data.iceTrips>=1,
      'mindestens der reale zweifache Anfangs-Vertikalschnitt');
    console.log('W5S_C_90D '+JSON.stringify(data));
  }
});
test('W5s-c: 365 Tage ohne individuelle Rettung – reale Zahlungs-/Schiffsmangel-Grenzen',()=>{
  for(const seed of [42,7]){
    const data=scenario(seed,{longDays:365});
    assert.equal(data.minted,0);
    assert.ok(data.produced>=1);
    console.log('W5S_C_365D '+JSON.stringify(data));
  }
});
