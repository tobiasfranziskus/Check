import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5G_RULES,seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function pruefen(s,who=''){
 const audit=api.audit(s);
 assert.equal(audit.ok,true,who+': '+JSON.stringify(Object.fromEntries(
   Object.entries(audit).filter(([k,v])=>v?.ok===false))));
 assert.equal(s.rulesVersion,24);assert.equal(s.schema,8);
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 const total=Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
 assert.equal(total,33000,'independent ISK-supply '+who);
 for(const [id,o]of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,id+' negative/invalid cash');
 for(const [ware,l]of Object.entries(s.ledger)){
   const physisch=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
      +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   assert.equal(physisch,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     'independent commodity ledger '+ware+' '+who);
 }
}
function cmd(s,type,owner,rest={}){
 const r=api.execute(s,{type,owner,...rest},rules);
 assert.equal(r.ok,true,JSON.stringify({type,owner,rest,reason:r.reason,tick:s.tick}));
 pruefen(s,type);return r;
}
function reject(s,type,owner,rest={}){
 const before=api.hash(s),r=api.execute(s,{type,owner,...rest},rules);
 assert.equal(r.ok,false,'must not pass '+type);
 assert.equal(api.hash(s),before,'rejection must be atomic');
}
const mine=(s,owner,system)=>Object.values(s.ships).find(sh=>sh.owner===owner
  &&sh.klasse==='miner'&&sh.system===system)?.id;
const carrier=s=>Object.values(s.ships).find(sh=>sh.owner==='transport'&&sh.klasse==='frachter')?.id;
function advance(s,n){api.advance(s,n,rules);pruefen(s,'tick '+n);}
function factory(s){
 for(let i=0;i<4;i++){cmd(s,'stationRefine','st_nadir',{station:'st_nadir'});advance(s,20);}
 cmd(s,'stationBuildParts','house',{station:'st_nadir'});advance(s,64);
 cmd(s,'stationBuildFighter','house',{station:'st_nadir'});advance(s,32);
}
function freight(s){
 const fr=carrier(s);
 let ready=false;
 for(let i=0;i<500;i++){
   if(s.stations.st_aldera.lager.erz>=50&&s.ships[fr].phase==='dock'){
     ready=true;break;
   }
   api.advance(s,1,rules);
 }
 assert.ok(ready,'real 50-ore deposit and dock');
 cmd(s,'shipFreight','transport',{schiff:fr});
 advance(s,120);
}
function start(seed){
 const s=api.createW5GState(seed);pruefen(s,'initial');
 cmd(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 cmd(s,'shipMine','house',{schiff:mine(s,'house','aldera'),ware:'erz'});
 cmd(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 cmd(s,'shipMine','house',{schiff:mine(s,'house','nadir'),ware:'silizium'});
 advance(s,50);
 cmd(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 freight(s);
 factory(s);
 cmd(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 const pirateCandidate=s.w5b.schiffIds.at(-1);
 cmd(s,'shipMine','house',{schiff:mine(s,'house','nadir'),ware:'silizium'});
 advance(s,8);
 freight(s);factory(s);
 cmd(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 const hunter=s.w5b.schiffIds.at(-1);
 assert.notEqual(hunter,pirateCandidate);
 assert.equal(s.w5b.jaegerFertig,2);
 assert.equal(s.w5b.jaegerVerkauft,2);
 return {s,pirateCandidate,hunter};
}
function kampf({s,pirateCandidate,hunter}){
 cmd(s,'pirateBuy','pirates',{angebot:pirateCandidate});
 assert.equal(s.owners.pirates.cash,0);
 cmd(s,'shipHunt','npc3',{schiff:hunter});
 let attempts=0;
 while(s.w5d.verluste.length===0&&attempts<150){
   advance(s,60);attempts++;
 }
 assert.ok(s.w5d.verluste.length>=1,'real deterministic battle must occur');
 assert.equal(s.w5d.verluste.some(v=>v.owner==='pirates'),true);
 assert.equal(s.owners.pirates.cash,0);
 return {lossNpc:s.w5d.verluste.find(v=>v.owner==='npc3')??null,attempts};
}
function dritte(s){
 const prior=s.w5b.jaegerFertig;
 assert.equal(prior,2);
 cmd(s,'shipMine','house',{schiff:mine(s,'house','nadir'),ware:'silizium'});
 advance(s,8);
 freight(s);factory(s);
 assert.equal(s.w3.abgeschlossen,3);
 assert.equal(s.w4.abgeschlossen,12);
 assert.equal(s.w5b.siliziumAbgeschlossen,3);
 assert.equal(s.w5b.bauteilFertig,3);
 assert.equal(s.w5b.jaegerFertig,3);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 assert.equal(s.ledger.jaeger.produced,3);
 return api.pilotW5GPlan(s);
}
test('W5g: Regel24 hat genau drei echte Chargen, alte Preise, keine ISK-Emission',()=>{
 const s=api.createW5GState(42),p=api.pilotW5GPlan(s);
 assert.equal(rules.rulesVersion,24);
 assert.equal(rules.w5d.maxChargen,3);
 assert.equal(api.W5F_RULES.w5d.maxChargen,2);
 assert.equal(p.hersteller.teile,1856);
 assert.equal(p.hersteller.jaeger,432);
 assert.equal(p.hersteller.zahlungen,2288);
 assert.equal(p.hersteller.verkauf,900);
 assert.equal(p.hersteller.fabrikmarge,-1388);
 assert.equal(p.vorgelagert.erzProJäger,40);
 assert.equal(p.vorgelagert.w3Auftragswert,740);
 assert.equal(p.vorgelagert.w3Arbeit,120);
 assert.equal(p.vorgelagert.w4ArbeitProJäger,80);
 assert.equal(rules.economy.waren.jaeger.basis,api.W5F_RULES.economy.waren.jaeger.basis);
 assert.equal(rules.economy.waren.material.basis,api.W5F_RULES.economy.waren.material.basis);
 assert.equal(rules.w5b.materialPreis,api.W5F_RULES.w5b.materialPreis);
 assert.equal(s.initialSupply,33000);pruefen(s);
 assert.equal(api.hash(api.loadW5G(api.save(s))),api.hash(s));
 assert.throws(()=>api.loadW5F(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.loadW5G(api.save(api.createW5FState(42))),/inkompatibel/);
 assert.equal(api.audit(api.createW5FState(42)).ok,true);
});
test('W5g: Seed98765 – echter Doppelverlust, dritte Rohstoff-/Fabrikcharge, gekaufter Ersatz',()=>{
 const x=start(98765),{s,hunter}=x,early=api.hash(s);
 reject(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
 assert.equal(api.hash(s),early);
 const result=kampf(x);
 assert.ok(result.lossNpc&&result.lossNpc.id===hunter,
   'wirklich im zentralen Kampf gefallener Konzernjäger');
 reject(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
 const plan=dritte(s);
 assert.equal(plan.naechsterErsatz,'ersatz_bezahlbar');
 const buyerBefore=s.owners.npc3.cash,sellerBefore=s.owners.house.cash;
 cmd(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
 assert.equal(s.owners.npc3.cash,buyerBefore-900);
 assert.equal(s.owners.house.cash,sellerBefore+900);
 assert.equal(s.owners.pirates.cash,0);
 assert.equal(s.ledger.jaeger.consumed,3);
 assert.equal(s.w5g.ersatz.length,1);
 const receipt=s.w5g.ersatz[0];
 assert.equal(receipt.verlustId,hunter);
 assert.equal(receipt.preis,900);
 assert.equal(receipt.schiffId,s.w5b.schiffIds.at(-1));
 assert.equal(s.ships[receipt.schiffId].owner,'npc3');
 assert.ok(!Object.hasOwn(s.ships,hunter));
 assert.equal(api.audit(s).w5g.ok,true);
 assert.equal(api.pilotW5GPlan(s).naechsterErsatz,'kein_npc_verlust');
 reject(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
 reject(s,'pirateBuy','pirates',{angebot:receipt.schiffId});
 reject(s,'stationBuildParts','house',{station:'st_nadir'});
 reject(s,'stationBuildFighter','house',{station:'st_nadir'});
 assert.equal(api.hash(api.loadW5G(api.save(s))),api.hash(s));
});
test('W5g: echtes fertiges Drittschiff ohne NPC-Verlust ist KEIN Ersatzauftrag',()=>{
 const x=start(42),{s}=x;kampf(x);const plan=dritte(s);
 assert.equal(plan.naechsterErsatz,'kein_npc_verlust');
 reject(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 assert.equal(s.owners.pirates.cash,0,'pirates cannot get second hull');
 reject(s,'pirateBuy','pirates',{angebot:x.hunter});
 pruefen(s);
});
test('W5g: falsche Verlustbelege, fabrikneue Phantomhüllen und Transfers werden abgewiesen',()=>{
 const x=start(98765),{s}=x;kampf(x);dritte(s);
 const before=api.save(s),hash=api.hash(s);
 const forged=api.loadW5G(before);
 forged.w5g.ersatz=[{verlustId:'unbekannt',schiffId:x.hunter,preis:900,tick:s.tick}];
 assert.equal(api.audit(forged).w5g.ok,false);
 assert.throws(()=>api.loadW5G(api.save(forged)),/fehlerhaft/);
 const falscherPreis=api.loadW5G(before);
 falscherPreis.w5g.ersatz=[{verlustId:x.hunter,schiffId:x.pirateCandidate,preis:0,tick:s.tick}];
 assert.equal(api.audit(falscherPreis).ok,false);
 const fakeCash=api.loadW5G(before);
 fakeCash.owners.pirates.cash+=900;fakeCash.owners.npc3.cash-=900;
 assert.equal(api.audit(fakeCash).isk.ok,true);
 assert.equal(api.audit(fakeCash).ok,false,'even globally balanced theft rejected');
 const noFunds=api.loadW5G(before);
 noFunds.owners.npc3.cash=899;
 reject(noFunds,'shipReplaceFighter','npc3',{station:'st_nadir'});
 assert.equal(api.audit(noFunds).ok,false,'do not accept tampered liquidity');
 assert.equal(api.hash(s),hash);pruefen(s);
});
function dritteNurBeiEchterKaufkraft(s){
  // Vorleistung ist gebunden: Aufträge dürfen an fehlendem Exportgeld scheitern.
  // Keine Kapitalzufuhr, keine geschenkte Exportnachfrage und keine harten Test-Fakes.
  cmd(s,'shipMine','house',{schiff:mine(s,'house','nadir'),ware:'silizium'});
  advance(s,8);
  const fr=carrier(s);
  let ready=false;
  for(let i=0;i<500;i++){
    if(s.stations.st_aldera.lager.erz>=50&&s.ships[fr].phase==='dock'){
      ready=true;break;
    }
    api.advance(s,1,rules);
  }
  pruefen(s,'Dritte Charge: verfügbare Exportmittel');
  if(!ready){
    return {ok:false,grund:'echte Erzlieferung nicht bezahlbar',
      exportCash:s.owners.export.cash,erz:s.stations.st_aldera.lager.erz,
      frachterPhase:s.ships[fr].phase};
  }
  cmd(s,'shipFreight','transport',{schiff:fr});
  advance(s,120);factory(s);
  assert.equal(s.w5b.jaegerFertig,3);
  return {ok:true,grund:'dritte Charge vollständig bezahlt',
    exportCash:s.owners.export.cash,erz:s.stations.st_aldera.lager.erz};
}
test('W5g: 13 Seeds × 90 Tage – reale Drittchargen oder ehrliche Kaufkraftblockade, Replay und Audits',()=>{
 for(const seed of seeds){
   const x=start(seed),{s}=x,combat=kampf(x);
   const attempt=dritteNurBeiEchterKaufkraft(s);
   const p=api.pilotW5GPlan(s);
   assert.equal(p.hersteller.fabrikmarge,-1388);
   if(attempt.ok && combat.lossNpc){
     const c=s.owners.npc3.cash;
     assert.ok(c>=900,'no individual rescue for NPC');
     cmd(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
     assert.equal(s.owners.npc3.cash,c-900);
   }else{
     reject(s,'shipReplaceFighter','npc3',{station:'st_nadir'});
     assert.equal(s.stations.st_nadir.lager.jaeger,attempt.ok?1:0);
   }
   if(!attempt.ok){
     assert.ok(attempt.erz<50,'fehlende Ware nach 500 echten Minuten');
     assert.equal(attempt.exportCash,0,
       'nur belegter Stillstand durch erschöpfte Exportnachfrage zählt als ökonomischer Stopp');
   }
   const replay=api.loadW5G(api.save(s));
   for(let day=1;day<=90;day++){
     api.advance(s,1440,rules);
     api.advance(replay,1440,rules);
     pruefen(s,'seed '+seed+'/day '+day);
     assert.equal(api.hash(s),api.hash(replay),'replay '+seed+'/day '+day);
   }
   assert.equal(s.minted,0);
   assert.equal(s.w5b.jaegerFertig,attempt.ok?3:2);
   assert.equal(s.w5g.ersatz.length,attempt.ok&&combat.lossNpc?1:0);
   assert.equal(s.owners.pirates.cash,0);
   assert.equal(api.hash(api.loadW5G(api.save(s))),api.hash(s));
   console.log('W5G_90T '+JSON.stringify({seed,hash:api.hash(s),
     npcLost:!!combat.lossNpc,ersatz:s.w5g.ersatz.length,
     dritteCharge:attempt.ok,blockGrund:attempt.ok?null:attempt.grund,
     exportCash:attempt.exportCash,
     house:s.owners.house.cash,npc3:s.owners.npc3.cash,
     lager:s.stations.st_nadir.lager.jaeger,minted:s.minted}));
 }
});
