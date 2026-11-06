import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const SEEDS=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
const rules=(lead=2,settle=true)=>({...api.W5R_RULES,w5s:{
  minerIndustry:true,concurrent:true,autoIndustry:true,autoOre:true,
  autoNpcOre:true,prepaidOrders:true,autoStarterMiner:true,
  autoLeadDays:lead,retainFleetEarnings:true,carrierWorkingCapital:true,
  ...(settle?{autoOreSettlement:true}:{})
}});
function verify(s,r,label){
  const a=api.audit(s),f=api.w5sFinanzStatus(s,r);
  assert.equal(a.ok,true,label+': Core-Audit');
  assert.equal(f.ok,true,label+': Speditions-Audit');
  assert.equal(f.freight.available,f.freight.reconstructed,label+': Kassenprovenienz');
  assert.equal(s.minted,0,label+': keine Geldschöpfung');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),
    s.initialSupply,label+': unabhängige Weltgeld-Bilanz');
  for(const [ware,l] of Object.entries(s.ledger)){
    const present=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
    assert.equal(present,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      label+': unabhängiges Warenledger '+ware);
  }
}
function makeState(seed=42){return api.createW5RState(seed,'full','npc3')}
function until(s,r,days){
  while(s.tick<days*1440)api.advance(s,Math.min(1440,days*1440-s.tick),r);
  verify(s,r,'bis Tag'+days);
}
function run(seed,days=90,lead=2,settle=true){
  const r=rules(lead,settle),s=makeState(seed),begin=api.hash(s);
  assert.equal(api.hash(s),begin);
  let second=null,byDay={},last=0;
  while(s.tick<days*1440){
    api.advance(s,1440,r);
    const day=s.tick/1440;
    verify(s,r,'Seed '+seed+' Tag '+day+' Vorlauf '+lead);
    if(s.w3.abgeschlossen>=2&&second===null)second=day;
    if([1,7,15,30,45,60,90,180,365].includes(day)){
      assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
        'sicherer Save-/Load-Roundtrip '+day);
      const f=api.w5sFinanzStatus(s,r);
      byDay[day]={ore:s.w3.abgeschlossen,water:s.w5n.wasserVerbraucht,
        merchant:s.w5h.bestand,oreGate:f.orePlan.stage,
        yardGate:f.yardPlan.stage,
        cash:s.owners.transport.cash};
    }
    assert.ok(s.w3.abgeschlossen>=last,'W3-Endlieferungen monoton');
    last=s.w3.abgeschlossen;
  }
  return {seed,days,lead,settle,hash:api.hash(s),
    ore:s.w3.abgeschlossen,delivered:s.w3.geliefert,
    second,water:s.w5n.wasserVerbraucht,
    ice:s.w5n.frachtAbgeschlossen,iceMined:s.w5n.eisAbgebaut,
    built:s.w5.fertig,sold:s.w5.verkauft+(s.w5.minerVerkauft||0),
    loss:s.w5r.losses.length,replacements:(s.w5r.assignments||[]).length,
    merchantBought:s.w5h.gekauft,merchantSold:s.w5h.verkauft,
    stationBought:s.w5h.bestand,
    stationCash:s.owners.st_aldera.cash,
    npcCash:s.owners.npc3.cash,freightCash:s.owners.transport.cash,
    buyerCash:s.owners.st_nadir.cash,
    minted:s.minted,byDay};
}
test('W5s-m: Aktion ohne Flag, ohne Stationsgeld und für fremde Eigentümer strikt verboten',()=>{
  const s=makeState(),rOff=rules(2,false),rOn=rules(2,true);
  until(s,rOff,7);
  const sh=Object.values(s.ships).find(sh=>sh.owner==='npc3'
    &&sh.klasse==='miner'&&(sh.ladung.erz||0)>0);
  assert.ok(sh);
  assert.equal(s.owners.st_aldera.cash,0,'noch kein freies Ankaufsgeld');
  for(const [cmd,r] of [[{type:'shipSellBookedOre',owner:'npc3',schiff:sh.id},rOff],
    [{type:'shipSellBookedOre',owner:'npc3',schiff:sh.id},rOn],
    [{type:'shipSellBookedOre',owner:'house',schiff:sh.id},rOn]]){
    const hash=api.hash(s),res=api.execute(s,cmd,r);
    assert.equal(res.ok,false,'keine verbotene Verkaufsaktion');
    assert.equal(api.hash(s),hash,'Ablehnung ohne ungebuchte Änderung');
  }
});
test('W5s-m: vorhandene 45 Erz / 55 Eis werden teilweise real verkauft; kein gratis Erz',()=>{
  const s=makeState(),rOff=rules(2,false),rOn=rules(2,true);
  until(s,rOff,30);
  const sh=Object.values(s.ships).find(sh=>sh.owner==='npc3'&&sh.ladung.erz===45);
  assert.ok(sh,'unverkaufter Bestand aus echter Förderung');
  assert.equal(sh.ladung.eis,55,'Mischladung darf nicht verdoppelt werden');
  const before={cash:s.owners.npc3.cash,station:s.owners.st_aldera.cash,
    stock:s.stations.st_aldera.lager.erz,
    owned:s.w5h.bestand,exportCash:s.owners.export.cash,
    minted:s.minted,hash:api.hash(s),auftrag:sh.auftrag,ware:sh.ware};
  assert.equal(before.station,250);
  const denied=api.execute(s,{type:'shipSellBookedOre',owner:'npc3',schiff:sh.id},rOff);
  assert.equal(denied.ok,false);assert.equal(api.hash(s),before.hash);
  const out=api.execute(s,{type:'shipSellBookedOre',owner:'npc3',schiff:sh.id},rOn);
  assert.equal(out.ok,true,'Original-W2-Ankauf über vollfinanzierten Vertrag');
  assert.equal(sh.ladung.erz,20);
  assert.equal(sh.ladung.eis,55);
  assert.equal(s.owners.npc3.cash,before.cash+250);
  assert.equal(s.owners.st_aldera.cash,0);
  assert.equal(s.stations.st_aldera.lager.erz,before.stock+25);
  assert.equal(s.w5h.bestand,before.owned,'Händlerkauf ist eigener Buchungsschritt');
  assert.equal(s.owners.export.cash,before.exportCash);
  assert.equal(s.minted,before.minted);
  assert.equal(sh.auftrag,before.auftrag);assert.equal(sh.ware,before.ware);
  assert.ok(!s.erzpilotVertraege?.[sh.id],'keine offene Doppel-Treuhand');
  const hash=api.hash(s);
  assert.equal(api.execute(s,{type:'shipSellBookedOre',owner:'npc3',schiff:sh.id},rOn).ok,false);
  assert.equal(api.hash(s),hash,'ohne neue Stationskasse kein wiederholter Verkauf');
  verify(s,rOn,'25 real verkaufte Erz, alle Konten stimmen');
  api.advance(s,60,rOn);
  assert.ok(s.w5h.bestand>=before.owned,'Händler zahlt nur für eigene real gelagerte Erz');
  verify(s,rOn,'nach W2-Großhändlerrückfluss');
});
test('W5s-m: 13×90 Tage – zwei reale W3-Frachten mit hohem bezahltem Wasserabsatz',()=>{
  for(const seed of SEEDS){
    const result=run(seed,90,2,true);
    assert.ok(result.ore>=2,'zwei 50-Erz-Aufträge fertig und bezahlt');
    assert.equal(result.delivered,50*result.ore,'nur abgewickelte 50er-Erzladungen');
    assert.ok(result.second!==null&&result.second<=90);
    assert.ok(result.water>=4000,'die Wasserversorgung bleibt in Betrieb');
    assert.ok(result.built>=5,'reale bezahlte Werftfertigung');
    assert.ok(result.merchantBought>=result.delivered,
      'keine Frachten ohne vorangegangenen Großhändlerankauf');
    if(seed===42||seed===7)
      assert.deepEqual(run(seed,90,2,true),result,'deterministischer Replay');
    console.log('W5S_M_90D '+JSON.stringify(result));
  }
});
test('W5s-m: Seed42/7 über 365 Tage, keine ungedeckte Fortsetzung',()=>{
  for(const seed of [42,7]){
    const r=run(seed,365,2,true);
    assert.ok(r.ore>=2);
    assert.equal(r.delivered,50*r.ore);
    console.log('W5S_M_365D '+JSON.stringify(r));
  }
});
test('W5s-m: 2-/7-/30-Tage-Vorlauf, AUS/EIN als kontrollierte Vergleichspaare',()=>{
  for(const seed of [42,7]){
    const results=[];
    for(const lead of [2,7,30]){
      const base=run(seed,90,lead,false),updated=run(seed,90,lead,true);
      assert.equal(base.delivered,base.ore*50);
      assert.equal(updated.delivered,updated.ore*50);
      results.push({lead,oreBefore:base.ore,oreAfter:updated.ore,
        waterBefore:base.water,waterAfter:updated.water,
        iceBefore:base.ice,iceAfter:updated.ice,
        hashBefore:base.hash,hashAfter:updated.hash});
    }
    assert.equal(results[0].oreBefore,1);
    assert.ok(results[0].oreAfter>=2);
    assert.equal(results[0].waterBefore,4316);
    assert.equal(results[0].waterAfter,4316);
    console.log('W5S_M_PAIRS '+JSON.stringify({seed,results}));
  }
});
