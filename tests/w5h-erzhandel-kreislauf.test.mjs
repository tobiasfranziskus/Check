import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5H_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];

function check(s,where=''){
  const a=api.audit(s);
  assert.equal(a.ok,true,where+' '+JSON.stringify(Object.fromEntries(
    Object.entries(a).filter(([k,v])=>v?.ok===false))));
  assert.equal(s.rulesVersion,25);
  assert.equal(s.schema,8);
  assert.equal(s.initialSupply,33000);
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
  for(const [id,o] of Object.entries(s.owners)){
    assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'negative/invalid '+id);
  }
  for(const [w,l] of Object.entries(s.ledger)){
    const phys=Object.values(s.stations).reduce((n,st)=>n+(st.lager[w]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[w]||0),0);
    assert.equal(phys,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'independent physical stock '+w+' '+where);
  }
  assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
  assert.equal(s.owners.export.cash,20000-10*s.w5h.bestand-10*s.w5h.unterwegs);
}
function cmd(s,type,owner,rest={}){
  const result=api.execute(s,{type,owner,...rest},rules);
  assert.equal(result.ok,true,JSON.stringify({type,owner,rest,reason:result.reason,tick:s.tick}));
  check(s,type);return result;
}
function reject(s,type,owner,rest={}){
  const before=api.hash(s);
  const r=api.execute(s,{type,owner,...rest},rules);
  assert.equal(r.ok,false,'unfunded '+type);
  assert.equal(api.hash(s),before,'failed transaction must be atomic');
}
function tick(s,n){
  api.advance(s,n,rules);
  check(s,'tick '+s.tick);
}
const miner=(s,sys)=>Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner'&&sh.system===sys)?.id;
const carrier=s=>Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter')?.id;

function start(seed=42){
  const s=api.createW5HState(seed);check(s,'start');
  reject(s,'shipFreight','transport',{schiff:'sh001'});
  cmd(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
  cmd(s,'shipMine','house',{schiff:miner(s,'aldera'),ware:'erz'});
  cmd(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
  cmd(s,'shipMine','house',{schiff:miner(s,'nadir'),ware:'silizium'});
  cmd(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
  tick(s,60);
  assert.equal(s.w5h.bestand,50,'real 50 ore purchased, not removed');
  assert.equal(s.ledger.erz.exported,0);
  return s;
}
function liefern(s){
  const fr=carrier(s);
  for(let i=0;i<600 && (s.w5h.bestand<50||s.ships[fr].phase!=='dock');i++)api.advance(s,1,rules);
  check(s,'warehouse ready');
  assert.equal(s.w5h.bestand,50,'no phantom buyer stock');
  const before=s.owners.export.cash,delivered=s.w3.geliefert;
  cmd(s,'shipFreight','transport',{schiff:fr});
  assert.equal(s.w5h.bestand,0);
  assert.equal(s.w5h.unterwegs,50);
  tick(s,60);
  assert.equal(s.w3.geliefert,delivered+50);
  assert.equal(s.owners.export.cash,before+500,'shipment reimburses prior real purchase');
  assert.equal(s.w5h.unterwegs,0);
  tick(s,60);
}
function produzieren(s){
  for(let i=0;i<4;i++){cmd(s,'stationRefine','st_nadir',{station:'st_nadir'});tick(s,20);}
  cmd(s,'stationBuildParts','house',{station:'st_nadir'});tick(s,64);
  cmd(s,'stationBuildFighter','house',{station:'st_nadir'});tick(s,32);
  assert.ok(s.stations.st_nadir.lager.jaeger>0);
  cmd(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
}
test('W5h: isolierter voll auditierter Forschungsstand und unveränderte frühere Regeln',()=>{
  assert.equal(rules.rulesVersion,25);assert.equal(rules.schema,8);
  assert.equal(rules.erzpilot.preis,api.W5G_RULES.erzpilot.preis);
  assert.equal(rules.economy.waren.jaeger.basis,900);
  assert.equal(rules.w5d.maxChargen,8);
  const a=api.createW5HState(42),b=api.createW5GState(42);
  check(a);
  assert.equal(api.audit(b).ok,true);
  assert.equal(api.hash(api.loadW5H(api.save(a))),api.hash(a));
  assert.throws(()=>api.loadW5H(api.save(b)),/inkompatibel/);
  assert.throws(()=>api.loadW5G(api.save(a)),/inkompatibel/);
});
test('W5h: echte Ware und zweimal bezahlter W3-Transport ohne neue Export-ISK',()=>{
  const s=start();
  const before=s.owners.export.cash;
  assert.equal(before,19500);
  liefern(s);
  assert.equal(s.w5h.verkauft,50);
  assert.equal(s.owners.export.cash,20000);
  assert.equal(s.ledger.erz.exported,0);
  produzieren(s);
  cmd(s,'shipMine','house',{schiff:miner(s,'nadir'),ware:'silizium'});
  tick(s,8);
  liefern(s);
  assert.equal(s.w5h.verkauft,100);
  assert.equal(s.owners.export.cash,20000);
  assert.ok(s.w3.abgeschlossen>=2);
  check(s,'two funded shipments');
});
test('W5h: gleicher Gesamtbetrag schützt nicht vor gefälschter Kassen- oder Wareneigentumsbuchung',()=>{
  const s=start(98765),raw=api.save(s),hash=api.hash(s);
  const x=api.loadW5H(raw);
  x.w5h.bestand+=50;
  assert.equal(api.audit(x).isk.ok,true);
  assert.equal(api.audit(x).goods.ok,true);
  assert.equal(api.audit(x).w5h.ok,false);
  assert.throws(()=>api.loadW5H(api.save(x)),/fehlerhaft/);
  const y=api.loadW5H(raw);
  y.owners.export.cash+=500;
  y.owners.house.cash-=500;
  assert.equal(api.audit(y).isk.ok,true);
  assert.equal(api.audit(y).finanzierung.ok,false);
  assert.throws(()=>api.loadW5H(api.save(y)),/fehlerhaft/);
  assert.equal(api.hash(s),hash);
});
test('W5h: 13 Seeds x 90 Tage, zwei echte Lieferungen, Bilanz, Replay und Save/Load',()=>{
  for(const seed of seeds){
    const s=start(seed);
    liefern(s);produzieren(s);
    cmd(s,'shipMine','house',{schiff:miner(s,'nadir'),ware:'silizium'});
    tick(s,8);
    liefern(s);
    check(s,'real two shipments');
    assert.equal(s.w5h.verkauft,100);
    assert.equal(s.ledger.erz.exported,0);
    const replay=api.loadW5H(api.save(s));
    for(let day=1;day<=90;day++){
      api.advance(s,1440,rules);
      api.advance(replay,1440,rules);
      check(s,'seed '+seed+'/day '+day);
      assert.equal(api.hash(s),api.hash(replay),'deterministic '+seed+'/'+day);
    }
    assert.equal(api.hash(api.loadW5H(api.save(s))),api.hash(s));
    console.log('W5H_90T '+JSON.stringify({seed,hash:api.hash(s),geliefert:s.w3.geliefert,
      bezahlt:s.w5h.verkauft,imLager:s.w5h.bestand,unterwegs:s.w5h.unterwegs,
      exporter:s.owners.export.cash,house:s.owners.house.cash,
      npc3:s.owners.npc3.cash,produziert:s.w5b.jaegerFertig,minted:s.minted}));
  }
});
