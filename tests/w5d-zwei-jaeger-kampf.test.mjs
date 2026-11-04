import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {w5bJagdSichtAusCore} from '../prototypes/w5-jagd/m_ui_w5b_bridge.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const from=html.indexOf('const m_data_systeme ='),to=html.indexOf('const m_data_oberflaeche =');
assert.ok(from>=0&&to>from);
const api=Function(html.slice(from,to)+'\nreturn m_core_index;')();
const rules=api.W5D_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];

const act=(state,type,owner,rest={})=>{
  const c={type,owner,...rest},res=api.execute(state,c,rules);
  assert.equal(res.ok,true,JSON.stringify({cmd:c,result:res,tick:state.tick}));
  return res;
};
const reject=(state,type,owner,rest={})=>{
  const c={type,owner,...rest},hash=api.hash(state),res=api.execute(state,c,rules);
  assert.equal(res.ok,false,JSON.stringify(c));
  assert.equal(api.hash(state),hash,'nicht finanzierter Versuch ohne Nebenwirkung');
};
function pruefen(state,context='') {
  const a=api.audit(state);
  assert.equal(a.ok,true,context+' '+JSON.stringify({
    isk:a.isk,goods:a.goods,w3:a.w3,w4:a.w4,w5:a.w5,
    w5b:a.w5b,w5c:a.w5c,w5d:a.w5d,voll:a.vollkosten}));
  assert.equal(state.initialSupply,33000);
  assert.equal(state.minted,0);
  assert.equal(state.stats.kopfgeld,0);
  return a;
}
function industrielleZwei(seed=42) {
  const state=api.createW5DState(seed);
  assert.equal(state.rulesVersion,22);
  pruefen(state,'Start');

  // Beide Bergbauschiffe sind voll bezahlt. Der eigene Aldera-Miner
  // verdient Arbeitserloese, die eine zweite Werftcharge finanzieren.
  act(state,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const oreMiner=Object.values(state.ships).find(x=>x.owner==='house'&&x.system==='aldera');
  act(state,'shipMine','house',{schiff:oreMiner.id,ware:'erz'});
  act(state,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  const siMiner=Object.values(state.ships).find(x=>x.owner==='house'&&x.system==='nadir');
  act(state,'shipMine','house',{schiff:siMiner.id,ware:'silizium'});
  api.advance(state,50,rules);
  act(state,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
  const fr=Object.values(state.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter');
  act(state,'shipFreight','transport',{schiff:fr.id});
  api.advance(state,120,rules);
  for(let i=0;i<4;i++){
    act(state,'stationRefine','st_nadir',{station:'st_nadir'});
    api.advance(state,20,rules);
  }
  act(state,'stationBuildParts','house',{station:'st_nadir'});
  api.advance(state,64,rules);
  act(state,'stationBuildFighter','house',{station:'st_nadir'});
  api.advance(state,32,rules);
  act(state,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
  const pirateId=state.w5b.schiffIds[0];
  act(state,'pirateBuy','pirates',{angebot:pirateId});
  pruefen(state,'erste physische Huelle');

  // Zweite wirkliche Siliziumcharge und neue Erzlieferung;
  // keine vorgefundenen Materialien oder Geschenk-ISK.
  act(state,'shipMine','house',{schiff:siMiner.id,ware:'silizium'});
  api.advance(state,8,rules);
  let bereit=false;
  for(let i=0;i<300;i++){
    if(state.stations.st_aldera.lager.erz>=50&&fr.phase==='dock') {
      bereit=true;break;
    }
    api.advance(state,1,rules);
  }
  assert.ok(bereit,'zweite 50er-Erzcharge aus wirklichem Bergbau');
  act(state,'shipFreight','transport',{schiff:fr.id});
  api.advance(state,120,rules);
  for(let i=0;i<4;i++){
    act(state,'stationRefine','st_nadir',{station:'st_nadir'});
    api.advance(state,20,rules);
  }
  act(state,'stationBuildParts','house',{station:'st_nadir'});
  api.advance(state,64,rules);
  act(state,'stationBuildFighter','house',{station:'st_nadir'});
  api.advance(state,32,rules);
  act(state,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
  const npcId=state.w5b.schiffIds[1];
  assert.equal(state.ships[pirateId].owner,'pirates');
  assert.equal(state.ships[npcId].owner,'npc3');
  assert.notEqual(pirateId,npcId);
  assert.equal(state.w5b.jaegerFertig,2);
  assert.equal(state.w5b.jaegerVerkauft,2);
  assert.equal(state.ledger.jaeger.produced,2);
  assert.equal(state.ledger.jaeger.consumed,2);
  assert.equal(state.stations.st_nadir.lager.jaeger,0);
  assert.equal(state.w5c.piratenAusgaben,900);
  assert.equal(state.owners.pirates.cash,0);
  assert.equal(state.w5b.materialVerbraucht,40);
  assert.equal(state.w5b.siliziumAbgebaut,16);
  assert.equal(state.w5b.fabrikLohnBezahlt,192);
  pruefen(state,'zwei reale Jaeger');
  return {state,pirateId,npcId};
}
test('W5d: zwei Jaeger aus echter W3/W4/W5b-Kette, kein dritter ohne Ware',()=>{
  const {state,pirateId,npcId}=industrielleZwei();
  const schnitt=w5bJagdSichtAusCore(api.JagdSichtV1(state));
  assert.deepEqual(schnitt.schiffe.map(x=>x.id),[pirateId,npcId]);
  assert.deepEqual(schnitt.schiffe.map(x=>x.besitzer.art),['pirat','npc']);
  assert.equal(schnitt.ereignisse.length,0);
  reject(state,'stationBuildFighter','house',{station:'st_nadir'});
  reject(state,'stationBuildParts','house',{station:'st_nadir'});
  reject(state,'pirateBuy','pirates',{angebot:npcId});
  assert.equal(api.hash(api.loadW5D(api.save(state))),api.hash(state));
  assert.throws(()=>api.loadW5C(api.save(state)),/inkompatibel/);
  assert.throws(()=>api.loadW5D(api.save(api.createW5CState(42))),/inkompatibel/);
  assert.equal(api.audit(api.createW5CState(42)).ok,true);
});
test('W5d: realer Kampf vernichtet Huelle, dokumentiert Bedarf und sperrt Gratisersatz',()=>{
  const {state,pirateId,npcId}=industrielleZwei(42);
  act(state,'shipHunt','npc3',{schiff:npcId});
  const first=state.owners.npc3.cash;
  assert.ok(first>=0);
  assert.equal(state.w5c.bezahlteStunden,1,'Stunde bezahlt vor Jagd');
  for(let i=0;i<150&&state.w5d.verluste.length===0;i++) {
    api.advance(state,60,rules);
    pruefen(state,'Kampf '+i);
  }
  const a=pruefen(state,'Verlust');
  assert.ok(a.w5d.kaempfe>0,'wirklicher zentraler Kampfkern ausgefuehrt');
  assert.equal(a.w5d.piratenVerluste,1);
  assert.equal(a.w5d.piratenErsatzbedarf,1);
  assert.equal(a.w5d.bezahltErsatz,0);
  assert.ok(!state.ships[pirateId],'Pirat physisch vernichtet');
  assert.ok(state.ships[npcId],'Seed42: bezahlter NPC-Jaeger ueberlebt');
  assert.ok(state.w5b.zerstoerteIds.includes(pirateId));
  assert.equal(state.w5c.kaufIds[0],pirateId);
  assert.equal(state.ledger.jaeger.produced,2);
  assert.equal(state.ledger.jaeger.consumed,2,'keine Warenverdopplung');
  assert.equal(state.minted,0);
  assert.equal(state.stats.kopfgeld,0);
  reject(state,'pirateBuy','pirates',{angebot:npcId});
  assert.equal(api.hash(api.loadW5D(api.save(state))),api.hash(state));
  const manipuliert=api.loadW5D(api.save(state));
  manipuliert.w5b.zerstoerteIds=[];
  assert.equal(api.audit(manipuliert).ok,false,'ungedeckter Verlust faellt auf');
});
test('W5d: 13 Seeds x 90 Tage inkl. Tagesaudit, deterministischem Replay und Save/Load',()=>{
  for(const seed of seeds) {
    const {state,npcId}=industrielleZwei(seed);
    act(state,'shipHunt','npc3',{schiff:npcId});
    const replay=api.loadW5D(api.save(state));
    for(let day=1;day<=90;day++){
      api.advance(state,1440,rules);
      api.advance(replay,1440,rules);
      const a=pruefen(state,'Seed '+seed+' Tag '+day);
      assert.equal(api.hash(state),api.hash(replay),'Replay '+seed+'/'+day);
      assert.equal(a.w5d.piratenErsatzbedarf,a.w5d.piratenVerluste);
    }
    const a=pruefen(state,'Seed '+seed+' Ende');
    assert.equal(a.w5d.piratenVerluste,1);
    assert.equal(a.w5d.bezahltErsatz,0);
    assert.equal(state.owners.pirates.cash,0);
    assert.equal(state.w5b.jaegerFertig,2);
    assert.equal(state.ledger.jaeger.consumed,2);
    assert.equal(api.hash(api.loadW5D(api.save(state))),api.hash(state));
    console.log('W5D_90T '+JSON.stringify({seed,hash:api.hash(state),
      kaempfe:a.w5d.kaempfe,verlustPiraten:a.w5d.piratenVerluste,
      verlustKonzern:a.w5d.konzernVerluste,ersatzOhneWare:0,minted:state.minted}));
  }
});
