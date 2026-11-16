// P8f W6 research: real original commands on isolated Rule207 save forks.
// No new policy, prices, raw goods, forced contracts, or authoritative core changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const money=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
function valid(w,s){
  const a=w.audit(s);
  assert.equal(a.ok,true,a.fehler?.join('; '));
  assert.deepEqual(W6.pruefen(w,s),[]);
  assert.equal(money(s),33000);
  assert.equal(s.minted,0);
  assert.equal(s.burned,0);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function snapshotAfterFirstFreight(){
  const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
  const s=w.createState(42,{politik:S02});
  assert.equal(w.npcAutoSetzen(s,true).ok,true);
  assert.equal(w.npcSiliziumSetzen(s,true).ok,true);
  let purchases=0;
  for(let t=120;t<=25*1440;t+=120){
    w.advance(s,120);
    if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&purchases<3){
      const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
      assert.equal(r.ok,true,r.reason);
      purchases++;
    }
    if(s.kanon.p8d.belege.length)break;
  }
  valid(w,s);
  assert.equal(s.kanon.p8d.belege.length,1);
  assert.equal(s.kanon.p8d.auftrag,null);
  assert.equal(s.stations.st_nadir.lager.silizium,8);
  assert.equal(s.stations.st_nadir.lager.material,10);
  assert.equal(s.stations.st_nadir.lager.erz,0);
  assert.equal(s.stations.st_nadir.lager.bauteil,0);
  return {w,save:w.save(s),originalHash:w.hash(s),firstDay:s.tick/1440};
}

test('P8f: Original-J3 kann Lagerware gegen echten Nadir-Lohn verarbeiten; die Jägerkette bleibt ohne neues Material begrenzt',()=>{
  const {w,save,originalHash,firstDay}=snapshotAfterFirstFreight();
  const s=w.load(save),before=s.stations.st_nadir.lager,begin=s.kanon.bauteile.abgeschlossen;
  const count=Math.min(Math.floor(before.material/w.rules.j3.material),before.silizium);
  assert.equal(count,5);
  const initial={material:before.material,silicon:before.silizium,parts:before.bauteil,
    station:s.owners.st_nadir.cash,world:money(s)};
  for(let n=0;n<count;n++){
    const cmd={type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'};
    const r=w.execute(s,cmd);
    assert.equal(r.ok,true,'Original-J3-Abbruch #'+n+': '+r.reason);
    w.advance(s,w.rules.j3.dauer);
    assert.equal(s.kanon.bauteile.abgeschlossen,begin+n+1);
    valid(w,s);
  }
  assert.equal(s.stations.st_nadir.lager.material,0);
  assert.equal(s.stations.st_nadir.lager.silizium,3);
  assert.equal(s.stations.st_nadir.lager.bauteil,5);
  assert.equal(s.kanon.jaeger.fertig,2,'keine fiktive dritte Jägerhülle');
  const rejectedSave=w.save(s);
  const refused=w.execute(s,{type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
  assert.equal(refused.ok,false,'Original-J3 muss bei fehlendem Material abbrechen');
  assert.equal(w.save(s),rejectedSave,'kein Geld/Warenmutationspfad bei Ablehnung');
  valid(w,s);
  const fresh=w.load(save);
  assert.equal(w.hash(fresh),originalHash,'Gegenversuch hat Ausgangswelt nicht verändert');
  console.log('P8F_J3_COUNTERFACTUAL',JSON.stringify({firstDay,originalHash,
    initial,partsProduced:count,after:{
      material:s.stations.st_nadir.lager.material,silicon:s.stations.st_nadir.lager.silizium,
      parts:s.stations.st_nadir.lager.bauteil,world:money(s),mint:s.minted,burn:s.burned,
      hash:w.hash(s)},blockedNext:refused.reason}));
});

test('P8f: Original-W3 und W4 lehnen nicht vorhandenes 50er Erz ab; Abbruch verändert keine Kassen oder Bestände',()=>{
  const {w,save,originalHash,firstDay}=snapshotAfterFirstFreight();
  const s=w.load(save),hash=w.hash(s);
  const sh=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter'
    &&x.system==='aldera'&&x.phase==='dock'&&x.auftrag==='halten'
    &&Object.values(x.ladung).every(n=>n===0));
  assert.ok(sh,'realer leerer Speditionsfrachter fehlt');
  const attempts=[
    {type:'shipFreight',owner:'transport',schiff:sh.id},
    {type:'stationRefine',owner:'st_nadir',station:'st_nadir'},
  ];
  const denied=[];
  for(const cmd of attempts){
    const unchanged=w.save(s),r=w.execute(s,cmd);
    assert.equal(r.ok,false,'kein unfinanzierter Originalauftrag: '+JSON.stringify(cmd));
    assert.equal(w.save(s),unchanged);
    denied.push({type:cmd.type,reason:r.reason});
  }
  valid(w,s);
  assert.equal(w.hash(s),hash);
  assert.equal(hash,originalHash);
  console.log('P8F_NO_FREE_ORE',JSON.stringify({firstDay,hash,denied,realOreAtNadir:0}));
});

test('P8f: Original-NPC3-Mining in separater Kopie ist keine Liefer- oder Käufergarantie',()=>{
  const {w,save,originalHash}=snapshotAfterFirstFreight();
  const s=w.load(save);
  const sh=Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'
    &&x.system==='aldera'&&x.phase==='dock'&&x.flug?.lage==='angedockt'
    &&Object.values(x.ladung).every(n=>n===0)).sort((a,b)=>a.id.localeCompare(b.id))[0];
  assert.ok(sh,'kein echter Aldera-Miner für den Gegenversuch');
  const before={erz:s.ledger.erz.mined,source:s.stations.st_aldera.lager.erz,
    target:s.stations.st_nadir.lager.erz,contracts:s.w3.abgeschlossen};
  const cmd={type:'shipMine',owner:'npc3',schiff:sh.id,ware:'erz'};
  const command=w.execute(s,cmd);
  w.advance(s,120);
  valid(w,s);
  const after={erz:s.ledger.erz.mined,source:s.stations.st_aldera.lager.erz,
    target:s.stations.st_nadir.lager.erz,contracts:s.w3.abgeschlossen};
  assert.equal(w.hash(w.load(save)),originalHash,'Probe verändert nur ihre eigene Kopie');
  console.log('P8F_MINING_ONLY_PROBE',JSON.stringify({ship:sh.id,
    result:command.ok?'accepted':command.reason,before,after,
    world:money(s),mint:s.minted,burn:s.burned,
    noAutomaticBuyingGuarantee:true}));
});
