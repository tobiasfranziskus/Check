import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const base=api.W5R_RULES;
const active={...base,w5s:{minerIndustry:true,concurrent:true}};
const oreFirst={...active,w5o:{...base.w5o,versorgungZiel:-1}};
function valid(s,label){
  const a=api.audit(s);
  assert.equal(a.ok,true,label+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([,v])=>v?.ok===false))));
  assert.equal(s.minted,0,'keine neuen ISK');
  assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
  for(const [ware,l]of Object.entries(s.ledger)){
    const phys=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
    assert.equal(phys,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      label+' unabhängiger Waren-Ledger '+ware);
  }
}
function cmd(s,r,type,owner,args={}){
  const before=api.hash(s);
  const result=api.execute(s,{type,owner,...args},r);
  assert.equal(result.ok,true,type+' '+result.reason+' tick '+s.tick);
  assert.notEqual(api.hash(s),before,'erfolgreicher Befehl verändert die Welt');
  valid(s,type);
}
function complete(seed,days=0){
  const s=api.createW5RState(seed,'full','npc3');
  valid(s,'Start');
  const actor='npc3',builder='werft_extern';
  // Initialer 600-ISK-Hausminer fördert 50 echte Erz, kein Startererz und
  // keine Testmaterialzuschüsse. Der NPC-Erstminer bleibt im Eisbergbau.
  cmd(s,oreFirst,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  const oreMiner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='house');
  cmd(s,oreFirst,'shipMine','house',{schiff:oreMiner.id,ware:'erz'});
  api.advance(s,60,oreFirst);
  valid(s,'50 Erz gefördert und real bezahlt');
  assert.equal(s.w5h.bestand,50);
  const original=s.w5r.miner.id;
  assert.equal(s.ships[original].owner,actor);
  const ship=s.w5r.frachter.id;
  cmd(s,oreFirst,'shipFreight','transport',{schiff:ship});
  api.advance(s,120,oreFirst);
  valid(s,'50 Erz real nach Nadir');
  assert.equal(s.w3.geliefert,50);
  cmd(s,oreFirst,'stationRefine','st_nadir',{station:'st_nadir'});
  api.advance(s,20,oreFirst);
  valid(s,'W4: 5 Material');
  assert.equal(s.stations.st_nadir.lager.material,5);
  // Die endliche Nadir-Starterhülle belegt den einzigen Werft-Lagerplatz.
  // Sie wird nicht gelöscht: Der Hauskonzern kauft sie real für 600 ISK.
  assert.equal(s.stations.st_nadir.lager.miner,1);
  cmd(s,oreFirst,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  assert.equal(s.stations.st_nadir.lager.miner,0);
  const price=base.economy.waren.miner.basis;
  assert.equal(price,600);
  const cashBefore=s.owners[builder].cash;
  cmd(s,oreFirst,'stationBuildMiner',builder,{station:'st_nadir'});
  assert.equal(s.owners.w5_arbeit_treuhand.cash,30,
    'alle 30 Werftlöhne vorfinanziert');
  assert.equal(s.stations.st_nadir.lager.material,0);
  assert.equal(s.w5.materialVerbraucht,5);
  api.advance(s,30,oreFirst);
  valid(s,'W5: genau eine reale Minerware produziert');
  assert.equal(s.ledger.miner.produced,1);
  assert.equal(s.w5.minerFertig,1);
  assert.equal(s.owners[builder].cash,cashBefore-530);
  assert.equal(s.owners.arbeiter_werft_nadir.cash,30);
  const npcCash=s.owners[actor].cash;
  const next=s.nextShip;
  cmd(s,oreFirst,'shipBuy',actor,{station:'st_nadir',klasse:'miner'});
  const id='sh'+String(next).padStart(3,'0');
  assert.equal(s.owners[actor].cash,npcCash-price,'NPC kauft 600-ISK-Hülle');
  assert.equal(s.owners[builder].cash,cashBefore-530+price);
  assert.equal(s.ships[id].system,'nadir','kein Teleport aus Werft');
  assert.equal(s.w5.minerVerkauft,1);
  assert.deepEqual(s.w5.minerSchiffIds,[id]);
  assert.equal(s.w5m.minerKaeufe[actor],2);
  const bad=api.hash(s);
  assert.equal(api.execute(s,{type:'shipReposition',owner:'house',schiff:id},oreFirst).ok,false);
  assert.equal(api.hash(s),bad,'falscher Eigentümer unzulässig');
  cmd(s,oreFirst,'shipReposition',actor,{schiff:id});
  assert.equal(s.owners.w5s_transfer_reserved.cash,60,'60 echte Pilot-ISK gebunden');
  assert.equal(s.ships[id].system,'nadir');
  assert.equal(s.ships[id].phase,'reise');
  const mid=api.hash(s);
  api.advance(s,30,oreFirst);
  valid(s,'halbe bezahlte Minerreise');
  const save=api.save(s);
  assert.equal(api.hash(api.loadW5R(save)),api.hash(s),'Save/Load während Miner-Reise');
  api.advance(s,30,oreFirst);
  valid(s,'bezahlte Ankunft des neuen Miners in Aldera');
  assert.equal(s.ships[id].system,'aldera');
  assert.equal(s.owners.w5s_transfer_reserved.cash,0);
  assert.equal(s.owners.w5s_transfer_pilot.cash,60);
  assert.equal(s.w5s.paid,60);
  assert.equal(s.w5s.paidTransport,0,'Spediteur zahlt keine NPC-Minerreise');
  assert.equal(s.w5r.miner.id,original,'noch keine vorgezogene R32-Ersatzzuordnung');
  assert.notEqual(api.hash(s),mid);
  while(s.tick<15*1440){
    api.advance(s,Math.min(1440,15*1440-s.tick),oreFirst);
    valid(s,'alte Minerhülle bis R32-Tag15');
  }
  assert.equal(s.w5r.miner.lost,1,'alte NPC-Minerhülle real verloren');
  assert.equal(s.w5r.miner.id,id,'echt hergeflogene Minerhülle ist R32-Ersatz');
  assert.equal(s.w5r.miner.bought,0,'kein zweiter Kauf auf Kosten des NPC');
  assert.equal(s.w5r.assignments?.find(x=>x.id===id)?.type,'miner');
  assert.equal(s.ships[id].auftrag,'foerdern',
    'Miner wird wieder mit originalem Core-Minebefehl eingesetzt');
  assert.equal(s.ships[id].ware,'eis');
  assert.equal(s.ledger.miner.consumed,
    Object.values(s.ships).filter(x=>x.klasse==='miner').length+s.w5r.miner.lost);
  valid(s,'R32 voll bezahlter Miner-Ersatz');
  const ice=s.w5n.eisAbgebaut;
  api.advance(s,150,active);
  valid(s,'wiederaufgenommene Eisproduktion');
  assert.ok(s.w5n.eisAbgebaut>ice,'die neue Hülle fördert tatsächlich Eis');
  assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s));
  const result = {seed,hash:api.hash(s),minerId:id,replacedId:original,
    werftKosten:530,verkaufspreis:price,repositionPaid:60,
    minerBuilt:s.w5.minerFertig,minerSold:s.w5.minerVerkauft,
    replacement:s.w5r.miner.id,replacementPurchases:s.w5r.miner.bought,
    oreDelivered:s.w3.geliefert,iceMined:s.w5n.eisAbgebaut,
    minted:s.minted};
  if(days){
    const until=days*1440;
    while(s.tick<until){
      let rest=Math.min(1440-(s.tick%1440),until-s.tick);
      while(rest>0){
        const n=Math.min(rest,active.maxAdvanceSteps);
        api.advance(s,n,active);
        rest-=n;
      }
      valid(s,'W5s-d tägliches unabhängiges 90/365-Tage-Audit '+s.tick);
      if(s.tick%1440===0 && [30,60,90,365].includes(s.tick/1440))
        assert.equal(api.hash(api.loadW5R(api.save(s))),api.hash(s),
          'gespeicherte R32-Ersatzwelt an Tag '+s.tick/1440);
    }
    result.longHash=api.hash(s);
    result.water=s.w5n.wasserVerbraucht;
    result.minerLost=s.w5r.miner.lost;
    result.minerExtraPurchased=s.w5r.miner.bought;
    result.minerAssigned=(s.w5r.assignments||[]).filter(x=>x.type==='miner').length;
    result.frachterLost=s.w5r.frachter.lost;
    result.minerCurrent=s.w5r.miner.id;
    result.readyMiner=s.stations.st_aldera.lager.miner;
    result.material=s.stations.st_nadir.lager.material;
    result.ore=s.stations.st_nadir.lager.erz;
    result.npcCash=s.owners.npc3.cash;
    result.minted=s.minted;
  }
  return result;
}
test('W5s-d: Seed42/7 echte Erz→Material→Minerwerft→Kauf→bezahlter Flug→R32-Ersatz→Eisförderung',()=>{
  for(const seed of [42,7]){
    const a=complete(seed),b=complete(seed);
    assert.deepEqual(b,a,'gleicher Seed und Befehle wiederholbar');
    console.log('W5S_D_MINER '+JSON.stringify(a));
  }
});


test('W5s-d: Befehle ohne echten Rohstoff, Werft-Eigentum und Forschungsprofil bleiben seiteneffektfrei',()=>{
  const state=api.createW5RState(42,'full','npc3'),hash=api.hash(state);
  for(const [cmd,rules] of [
    [{type:'stationBuildMiner',owner:'werft_extern',station:'st_nadir'},base],
    [{type:'stationBuildMiner',owner:'npc3',station:'st_nadir'},active],
    [{type:'stationBuildMiner',owner:'werft_extern',station:'st_nadir'},active],
    [{type:'shipBuy',owner:'npc3',station:'st_nadir',klasse:'miner'},active]
  ]){
    const out=api.execute(state,cmd,rules);
    assert.equal(out.ok,false,'kein Beleg für '+cmd.type);
    assert.equal(api.hash(state),hash,'unzulässiger Eingriff ändert keine Daten');
  }
  valid(state,'unveränderte R32-Welt nach abgelehnten Befehlen');
});

test('W5s-d: 13 feste Seeds × 90 Tage, täglicher unabhängiger Audit und Save/Load',()=>{
  const seeds=[42,7,11,1,2,65535,1234,98765,3,99,2024,2025,314159];
  for(const seed of seeds){
    const row=complete(seed,90);
    assert.equal(row.minerBuilt,1);
    assert.equal(row.minerSold,1);
    assert.equal(row.minted,0);
    if(seed===42||seed===7)
      assert.deepEqual(complete(seed,90),row,
        '90 Tage + Referenzseed deterministisch doppelt ausgeführt');
    console.log('W5S_D_90D '+JSON.stringify(row));
  }
});
test('W5s-d: zwei 365-Tage-Krisenläufe mit realen Ressourcen- und Geldengpässen',()=>{
  for(const seed of [42,7]){
    const row=complete(seed,365);
    assert.equal(row.minted,0);
    assert.ok(row.minerLost>=1,'keine unsterbliche Starterhülle');
    console.log('W5S_D_365D '+JSON.stringify(row));
  }
});
