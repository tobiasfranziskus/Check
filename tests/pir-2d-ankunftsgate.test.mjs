import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

function kontakt(anflug=false){
 const j=J8.erstellen(); j.startenPiraten(true,anflug);
 const w=j.weltReferenz();
 assert(j.ausfuehren('buy-st_aldera-frachter').ok);
 assert(j.ausfuehren('buy-st_aldera-miner').ok);
 const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
 const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert(j.ausfuehren('ice-'+m).ok);
 w.advance(j.zustandReferenz(),120);
 assert(j.ausfuehren('freight-'+f).ok);
 const s=j.zustandReferenz();
 w.advance(s,56);
 assert.equal(s.ships[f].ankunft-s.tick,4);
 assert.equal(s.ships[f].ladung.eis,50);
 assert.equal(s.w5n.frachtauftrag.phase,'hin');
 assert.deepEqual(w.audit(s).fehler,[]);
 return {j,w,s,f};
}

// CURRENT boundary, not a future acceptance criterion. Remove/replace this
// baseline assertion only in the explicitly isolated new arrival profile.
test('PIR-2d baseline: an invented local body is rejected by both existing audits',()=>{
 const {j,w,s,f}=kontakt(),before=j.exportieren();
 for(const lage of ['frei','angedockt']){
  const c=structuredClone(s),sh=c.ships[f];
  sh.system='nadir';
  sh.flug=w.flugKern.koerperAngedockt('nadir');
  if(lage==='frei') Object.assign(sh.flug,{lage,x:96000,anker:null,kurs:128,sollKurs:128});
  const flug=w.flugKern.audit(c);
  assert.equal(flug.ok,false);
  assert.match(flug.grund,/Transit passt nicht/);
  const a=w.audit(c).fehler;
  assert(a.some(x=>x.includes('Transit passt nicht')));
  assert(a.some(x=>x.includes('K1-Spielerfracht/Vertragslohn')));
 }
 assert.equal(j.exportieren(),before);
 assert.deepEqual(w.audit(s).fehler,[]);
});

test('PIR-2d baseline: original delivery and return use the clock, not a Nadir dock receipt',()=>{
 const {w,s,f}=kontakt();
 const start=s.tick,receipt=s.kanon.spielerFrachten.auftraege.at(-1);
 const initialWork=s.owners.w5n_fracht_arbeit.cash;
 const initialBuy=s.owners.w5n_fracht_kauf.cash;
 const delivered=s.w5n.eisGeliefert, wages=s.kanon.spielerFrachten.lohn;
 const rows=[];
 for(let i=1;i<=4;i++){
  w.advance(s,1);
  assert.equal(s.owners.w5n_fracht_arbeit.cash,initialWork-i);
  assert.equal(s.kanon.spielerFrachten.lohn,wages+i);
  assert.equal(s.ships[f].owner,'house');
  assert.equal(s.ships[f].flug.lage,'transit');
  assert.deepEqual(w.audit(s).fehler,[]);
  assert.equal(w.save(w.load(w.save(s))),w.save(s));
  if(i<4){
   assert.equal(s.ships[f].ladung.eis,50);
   assert.equal(s.owners.w5n_fracht_kauf.cash,initialBuy);
   assert.equal(s.w5n.eisGeliefert,delivered);
   assert.equal(receipt.geliefert,null);
  }else{
   assert.equal(s.ships[f].ladung.eis,0);
   assert.equal(s.ships[f].system,'nadir');
   assert.equal(s.w5n.frachtauftrag.phase,'rueck');
   assert.equal(s.w5n.eisGeliefert,delivered+50);
   assert.equal(s.owners.w5n_fracht_kauf.cash,initialBuy-receipt.eis);
   assert.equal(receipt.geliefert,start+4);
   assert.equal(receipt.end,null);
  }
  rows.push({tick:s.tick,lage:s.ships[f].flug.lage,system:s.ships[f].system,
   phase:s.w5n.frachtauftrag.phase,work:s.owners.w5n_fracht_arbeit.cash,
   buy:s.owners.w5n_fracht_kauf.cash,ice:s.ships[f].ladung.eis});
 }
 w.advance(s,60);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.minted+s.burned,0);
 assert.deepEqual(w.audit(s).fehler,[]);
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
 console.log('PIR_2D_ARRIVAL_BASELINE '+JSON.stringify({rows,hash:w.hash(s)}));
});

test('PIR-2d flies the financed approach and books the original round trip once',()=>{
 const {w,s,f}=kontakt(true);
 const sh=s.ships[f],expected=[96000,0,128];
 assert.deepEqual([sh.flug.x,sh.flug.y,sh.flug.kurs],expected);
 assert.equal(sh.system,'nadir');
 const geld=s.initialSupply, start=s.tick, delivered=s.w5n.eisGeliefert;
 const kopien=[w.load(w.save(s))];
 for(let i=1;i<=240;i++){
  w.teilschritt(s);
  if(i===135) assert.equal(sh.flug.lage,'angedockt');
  if(i<240) assert.equal(sh.ladung.eis,50);
  if(i%17===0||i%60===0){
   const exportiert=w.save(s);
   const geladen=w.load(exportiert);
   assert.equal(w.save(geladen),exportiert);
   if(i%60===0||i===17) kopien.push(geladen);
  }
 }
 assert.equal(s.tick,start+4);
 assert.equal(s.w5n.frachtauftrag.phase,'rueck');
 assert.equal(s.w5n.eisGeliefert,delivered+50);
 assert.equal(s.owners.w5n_fracht_kauf.cash,240);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,60);
 w.advance(s,60);
 for(const kopie of kopien){
  w.advance(kopie,s.tick-kopie.tick);
  assert.equal(w.hash(s),w.hash(kopie));
 }
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),geld);
 assert.deepEqual(w.audit(s).fehler,[]);
});

test('PIR-2d rejects forged docking, profile and commands and halts a missed arrival',()=>{
 const {w,s,f}=kontakt(true), before=w.save(s), raw=JSON.parse(before);
 raw.ships[f].flug=w.flugKern.koerperAngedockt('nadir');
 assert.throws(()=>w.load(JSON.stringify(raw)),/unveränderte/);
 const normal=kontakt().w;
 assert.throws(()=>normal.load(before),/PIR-1/);
 for(const owner of ['house','transport']){
  assert.equal(w.execute(s,{type:'shipDock',schiff:f,owner,station:'st_nadir'}).ok,false);
 }
 const neueSitzung=J8.erstellen();
 assert.throws(()=>neueSitzung.oeffnenPiraten(before,true),/PIR-1/);
 neueSitzung.oeffnenPiraten(before,true,true);
 assert.equal(neueSitzung.exportieren(),before);
 assert.equal(w.save(s),before);
 // Inject a flight fault at the live core boundary, not by authorizing a save import.
 w.advance(s,3);
 const sh=s.ships[f];
 Object.assign(sh.flug,{lage:'frei',x:96000,y:0,anker:null,modus:'halt',andocken:false,ziel:null});
 const kauf=s.owners.w5n_fracht_kauf.cash,lohn=s.owners.w5n_fracht_arbeit.cash,tick=s.tick;
 w.advance(s,30);
 assert.equal(s.tick,tick);
 assert.equal(s.kanon.piraten.ankunftBlockiert,true);
 assert.equal(s.owners.w5n_fracht_kauf.cash,kauf);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,lohn);
 assert.equal(sh.ladung.eis,50);
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
});

test('PIR-2e intercepts and locks the real loaded freighter only after local arrival',()=>{
 const {w,s,f}=kontakt('abfangen');
 const pirat=s.ships.pir001, mission=s.kanon.piraten;
 assert.equal(mission.phase,'abfangen');
 assert.equal(pirat.flug.ziel.id,f);
 assert.equal(pirat.flug.erfassung.id,f);
 const geladen=w.load(w.save(s));
 w.advance(s,1);
 assert.equal(mission.phase,'angriffsfenster');
 assert.equal(s.ships[f].ladung.eis,50);
 assert.equal(w.execute(s,{type:'shipUnlock',owner:'piraten',schiff:pirat.id}).ok,false);
 w.advance(s,1);
 assert.equal(mission.phase,'rueckkehr');
 const rueckkehr=w.load(w.save(s));
 w.advance(s,2); w.advance(geladen,4); w.advance(rueckkehr,2);
 assert.equal(w.hash(s),w.hash(geladen));
 assert.equal(w.hash(s),w.hash(rueckkehr));
 assert.equal(mission.phase,'bereit');
 assert.equal(pirat.flug.erfassung,undefined);
 assert.deepEqual(w.audit(s).fehler,[]);
});

test('PIR-3 journals and applies real nonlethal hull damage with deterministic replay',()=>{
 const {w,s,f}=kontakt('kampf');
 let vorAngriff=null, aufRueckkehr=null;
 for(let i=0;i<240;i++){
  w.teilschritt(s);
  if(vorAngriff===null&&s.kanon.piraten.kampf.ereignisse.some(e=>e.schaden>0))
   vorAngriff=w.load(w.save(s));
  if(aufRueckkehr===null && s.kanon.piraten.phase==='rueckkehr')
   aufRueckkehr=w.load(w.save(s));
 }
 const k=s.kanon.piraten.kampf;
 assert(vorAngriff,'the original real freighter must actually receive damage');
 assert(k.ereignisse.some(e=>e.ziel===f&&e.angreifer==='pir001'&&e.schaden===24));
 assert(k.huellen[f]<96&&k.huellen[f]>=24);
 assert.equal(s.w5n.eisGeliefert,50);
 w.advance(s,60); w.advance(vorAngriff,s.tick-vorAngriff.tick);
 assert.equal(w.hash(vorAngriff),w.hash(s));
 assert(aufRueckkehr);
 w.advance(aufRueckkehr,s.tick-aufRueckkehr.tick);
 assert.equal(w.hash(aufRueckkehr),w.hash(s));
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.deepEqual(w.audit(s).fehler,[]);
 const json=w.save(s), manipuliert=JSON.parse(json);
 manipuliert.kanon.piraten.kampf.huellen[f]=96;
 assert.throws(()=>w.load(JSON.stringify(manipuliert)),/unveränderte/);
 assert.equal(s.minted+s.burned,0);
 console.log('PIR_3_REPLAY '+JSON.stringify({ereignisse:k.ereignisse,hash:w.hash(s)}));
});

test('PIR-3 stops firing without a valid target, local jurisdiction, or return reserve',()=>{
 const basis=kontakt('kampf');
 const {w,f}=basis;
 const schutz=[
  s=>{ s.ships[f].flug=w.flugKern.koerperAngedockt('nadir'); },
  s=>{ s.owners.k1_flug_pir001.cash=12; },
  s=>{ s.kanon.verschleiss.pir001=100000; },
  s=>{ s.ships.pir001.system=s.ships[f].system='aldera'; },
  s=>{ s.ships.pir001.system=s.ships[f].system='dravos'; },
  s=>{ s.kanon.piraten.kampf.huellen[f]=24; },
 ];
 for(const stoerung of schutz){
  const s=structuredClone(basis.s);
  stoerung(s);
  // Faults are injected at the authorised runtime boundary of this test.
  // They are deliberately not submitted as imports or regarded as audited saves.
  w.teilschritt(s);
  assert.deepEqual(s.kanon.piraten.kampf.ereignisse,[]);
 }
 assert.equal(w.sicherheitslage(basis.s).stufen.aldera,'sicher');
 assert.equal(w.sicherheitslage(basis.s).stufen.nadir,'umkaempft');
});

test('PIR-2e orders equal-value reachable contacts by stable ID',()=>{
 const {w,s,f}=kontakt('abfangen');
 const origin=s.ships[f], anderer=Object.values(s.ships)
  .find(sh=>sh.klasse==='miner'&&sh.owner==='house');
 assert(anderer);
 // Synthetic equal-value freighter contacts assigned to two existing IDs.
 anderer.klasse='frachter';
 anderer.system=origin.system;
 anderer.flug=structuredClone(origin.flug);
 anderer.ladung=structuredClone(origin.ladung);
 anderer.phase='dock';
 const k=w.piratenZielbewertung(s).kandidaten.filter(x=>[f,anderer.id].includes(x.id));
 assert.deepEqual(k.map(x=>x.id),[f,anderer.id].sort());
 assert(k.every(x=>x.verfolgbar&&x.referenzwert===250));
});

test('PIR-3b: authentic damage quote cannot teleport material or repair the ship',()=>{
 const {w,s,f}=kontakt('kampf');
 w.advance(s,64);
 const before=w.save(s), sh=s.ships[f];
 assert.equal(sh.system,'aldera');
 assert.equal(sh.flug.lage,'angedockt');
 assert.equal(s.kanon.piraten.kampf.huellen[f],48);
 const local=w.reparaturAngebot(s,{owner:'house',schiff:f,station:'st_aldera'});
 assert.equal(local.ok,false);
 assert.equal(local.angedockt,true);
 assert.equal(local.werftVorhanden,false);
 assert.equal(local.bestand,0);
 assert.equal(local.material,3);
 assert.equal(local.minuten,15);
 assert.equal(local.kosten,315);
 const remote=w.reparaturAngebot(s,{owner:'house',schiff:f,station:'st_nadir'});
 assert.equal(remote.werftVorhanden,true);
 assert.equal(remote.angedockt,false);
 assert.equal(remote.bestand,s.stations.st_nadir.lager.material||0);
 assert.equal(remote.ok,false);
 assert.equal(w.reparaturAngebot(s,{owner:'transport',schiff:f,station:'st_nadir'}).ok,false);
 assert.equal(w.reparaturAngebot(s,{owner:'house',schiff:f,station:'st_nadir',kosten:0}).ok,false);
 assert.equal(w.execute(s,{type:'shipRepair',owner:'house',schiff:f,station:'st_aldera'}).ok,false);
 assert.equal(w.execute(s,{type:'shipRepair',owner:'house',schiff:f,station:'st_nadir'}).ok,false);
 assert.equal(w.save(s),before);
 assert.deepEqual(w.reparaturAngebot(w.load(before),{owner:'house',schiff:f,station:'st_nadir'}),remote);
 const fake=structuredClone(s);
 fake.kanon.piraten.kampf.huellen[f]=72;
 assert.equal(w.reparaturAngebot(fake,{owner:'house',schiff:f,station:'st_nadir'}).grund,'Welt- oder Schadensbeleg ungültig');
 assert.throws(()=>w.load(JSON.stringify(fake)),/unveränderte/);
 assert.deepEqual(w.audit(s).fehler,[]);
 console.log('PIR_3B_REPAIR_GATE '+JSON.stringify({local,remote,hash:w.hash(s)}));
});
