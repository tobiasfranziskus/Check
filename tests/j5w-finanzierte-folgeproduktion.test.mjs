import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),W=require('../prototypes/welt/welt-kern.js');
const original=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const w=W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
// Seed7 ist eine explizite RNG-Variation der auditierten Seed42-Fortsetzung,
// keine Behauptung einer unabhängig erzeugten Seed7-Vorgeschichte.
function start(seed=42){const s=JSON.parse(original);s.rng=seed;return w.load(JSON.stringify(s));}
function audit(s){
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 for(const [ware,l] of Object.entries(s.ledger)){
  const phys=[...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung)].reduce((n,l)=>n+(l[ware]||0),0);
  assert.equal(phys,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 for(const sh of Object.values(s.ships))assert.ok(s.owners[sh.owner]);
 assert.equal(Object.values(s.ships).filter(x=>x.klasse==='jaeger'&&x.owner==='house').length,s.kanon.jaeger.verkauft);
}
function run(seed=42,{purchase=true,observe=()=>{}}={}){
 const s=start(seed),before=w.load(w.save(s));
 const cmd=(type,extra={})=>{
  const c={type,owner:'st_nadir',station:'st_nadir',...extra};
  if(['siliconMineStart','siliconSell','shipUndock','shipFlyTo'].includes(type)||type.startsWith('industrialOre'))delete c.station;
  const r=w.execute(s,c);assert.equal(r.ok,true,JSON.stringify({c,r}));audit(s);observe(s,type);return r;
 };
 const until=f=>{for(let i=0;!f();i++){assert.ok(i<1000,'begrenzter echter Core-Fortschritt');w.minute(s);audit(s);}observe(s,'minute');};
 cmd('siliconMineStart',{owner:'house',schiff:'sh022'});
 cmd('shipUndock',{owner:'house',schiff:'sh022'});w.minute(s);
 cmd('shipFlyTo',{owner:'house',schiff:'sh022',x:720000,y:-480000});
 until(()=>s.kanon.silizium.auftrag.gefoerdert===8);
 cmd('shipDock',{owner:'house',schiff:'sh022'});until(()=>s.ships.sh022.flug.lage==='angedockt');
 cmd('siliconSell',{owner:'house',schiff:'sh022'});
 // Reale Expansion: 750 ISK, eine existierende Hülle, neuer Eigentümer.
 cmd('shipBuy',{owner:'transport',klasse:'frachter'});
 assert.equal(s.ships.sh024.owner,'transport');
 cmd('industrialOreOffer',{miner:'sh008',frachter:'sh020'});
 cmd('industrialOreAcceptMine',{owner:'npc3'});
 cmd('industrialOreAcceptFreight',{owner:'transport'});
 cmd('industrialOreAcceptYard',{owner:'werft_extern'});cmd('industrialOreCommit');
 until(()=>s.w3.auftrag?.phase==='rueck');
 assert.equal(s.w3.geliefert-before.w3.geliefert,50);
 cmd('stationRefine');until(()=>!s.w4.auftrag);
 cmd('industrialOreBuildShip',{owner:'werft_extern'});until(()=>!s.w5.auftrag&&!s.w3.auftrag);
 for(let i=0;i<4;i++){cmd('stationRefine');until(()=>!s.w4.auftrag);}
 for(let i=0;i<8;i++){cmd('stationBuildParts');until(()=>!s.kanon.bauteile.auftrag);}
 observe(s,'vorWerft');cmd('stationBuildFighter');
 w.advance(s,31);audit(s);assert.equal(s.kanon.jaeger.fertig,1);
 assert.equal(s.owners.j4_arbeit_treuhand.cash,1);
 assert.equal(w.execute(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'jaeger'}).ok,false);
 w.minute(s);audit(s);assert.equal(s.kanon.jaeger.fertig,2);
 if(purchase)cmd('shipBuy',{owner:'house',klasse:'jaeger'});
 const j=s.kanon.jaeger;
 assert.equal(j.lohnBezahlt-before.kanon.jaeger.lohnBezahlt,32);
 assert.equal(s.owners.j4_jaeger_arbeiter.cash-before.owners.j4_jaeger_arbeiter.cash,32);
 assert.equal(s.owners.j3_bauteil_arbeiter.cash-before.owners.j3_bauteil_arbeiter.cash,64);
 assert.equal(s.w3.arbeitsKosten-before.w3.arbeitsKosten,120);
 assert.equal(s.w3.kaufAusgaben-before.w3.kaufAusgaben,740);
 assert.equal(s.kanon.silizium.belege[1].preis,192);
 assert.equal(s.kanon.silizium.belege[1].arbeit,128);
 assert.equal(j.belege[1].ende-j.belege[1].start,32);
 assert.equal(s.ledger.erz.mined-before.ledger.erz.mined,50);
 assert.equal(s.ledger.silizium.mined-before.ledger.silizium.mined,8);
 assert.equal(s.w4.materialErzeugt-before.w4.materialErzeugt,25);
 assert.equal(j.bauteileVerbraucht,16);assert.equal(j.materialVerbraucht,8);
 audit(s);return s;
}
for(const seed of [42,7])test(`J5-W Fortsetzung RNG ${seed}: echte Förderung, Lieferung, 32 Minuten, 900-ISK-Kauf, Replay`,()=>{
 const a=run(seed),b=run(seed);
 assert.equal(w.hash(a),w.hash(b));assert.equal(w.hash(w.load(w.save(a))),w.hash(a));
 assert.equal(a.kanon.jaeger.verkauft,2);assert.equal(a.ships.sh025.owner,'house');
 assert.equal(a.kanon.jaeger.kaeufe[1].preis,900);
 assert.equal(a.owners.house.cash,678);
 assert.match(w.execute(a,{type:'siliconMineStart',owner:'house',schiff:'sh022'}).reason,/Feld/);
 console.log('J5W_RESULT',JSON.stringify({seed,tick:a.tick,hash:w.hash(a),house:a.owners.house.cash,nadir:a.owners.st_nadir.cash}));
 const fresh=w.createState(seed);audit(fresh);assert.equal(fresh.rng,seed);
});

test('J5-W erste Sperren und positive Gegenprobe ohne Gratisrettung',()=>{
 const s=start();audit(s);
 const reject=c=>{const hash=w.hash(s);const r=w.execute(s,c);assert.equal(r.ok,false);assert.equal(w.hash(s),hash);return r.reason;};
 assert.match(reject({type:'stationBuildFighter',owner:'st_nadir',station:'st_nadir'}),/Bauteile/);
 assert.match(reject({type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'}),/Material/);
 for(let i=0;i<3;i++){assert.equal(w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'}).ok,true);w.advance(s,20);}
 assert.match(reject({type:'stationRefine',owner:'st_nadir',station:'st_nadir'}),/Erz/);
 assert.equal(s.stations.st_nadir.lager.material,15);
 assert.equal(w.execute(s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh008',frachter:'sh020'}).ok,true);
 assert.match(reject({type:'industrialOreAcceptYard',owner:'werft_extern'}),/nicht gedeckt/);
 assert.equal(s.owners.werft_extern.cash,290);
 assert.equal(w.execute(s,{type:'industrialOreCancel',owner:'st_nadir'}).ok,true);
 // Endkunden-Exportkonto ist leer: normaler Erzauftrag erzeugt keinen Absatz.
 assert.equal(s.owners.export.cash,0);
 assert.equal(w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:'sh008'}).ok,true);
 assert.equal(w.execute(s,{type:'shipMine',owner:'npc3',schiff:'sh008',ware:'erz'}).ok,true);
 assert.equal(w.execute(s,{type:'shipShuttle',owner:'npc3',schiff:'sh008',ware:'erz'}).ok,true);
 w.advance(s,240);audit(s);assert.equal(s.stations.st_aldera.lager.erz,0);
 assert.equal(s.erzpilotVertraege.sh008,undefined);
 run(42); // derselbe Originalstart mit real bezahlter Expansion funktioniert.
});

test('J5-W Save/Load während Förderung, Fracht, Produktion; Import-Manipulationen',()=>{
 const snapshots=[];
 const s=run(42,{observe:(s,type)=>{assert.equal(w.hash(w.load(w.save(s))),w.hash(s));if(type==='vorWerft')snapshots.push(w.save(s));}});
 const mutate={
  ware:s=>s.stations.st_nadir.lager.material++,
  silizium:s=>s.kanon.silizium.belege[1].menge++,
  fracht:s=>s.w3.geliefert++,
  lohn:s=>s.kanon.jaeger.lohnBezahlt--,
  zeit:s=>s.kanon.jaeger.belege[1].start++,
  kauf:s=>s.kanon.jaeger.kaeufe[1].preis=0,
  eigentum:s=>s.ships.sh025.owner='npc3',
  schiff:s=>s.ships.fake={...s.ships.sh025,id:'fake'},
  umbuchung:s=>{s.owners.house.cash++;s.owners.st_nadir.cash--;},
  mint:s=>s.minted++,schema:s=>s.schema=99,
 };
 for(const [name,change] of Object.entries(mutate)){const copy=JSON.parse(w.save(s));change(copy);assert.throws(()=>w.load(JSON.stringify(copy)),name);}
 for(const text of ['{','null','[]','{}'])assert.throws(()=>w.load(text));
 const pre=w.load(snapshots[0]);
 const hash=w.hash(pre);assert.equal(w.execute(pre,{type:'stationBuildFighter',owner:'house',station:'st_nadir'}).ok,false);assert.equal(w.hash(pre),hash);
 assert.equal(fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8'),original);
});
