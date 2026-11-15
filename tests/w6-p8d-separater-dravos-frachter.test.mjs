// W6/P8d [FORSCHUNG]: Dravos-Miner NPC3 und fremder Original-W3-Frachter
// von transport: volle Vorfinanzierung, genau einmal Ware und ISK.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const neu=()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42,{politik:S02});
 return {w,s};
};
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const unabhaengig=(w,s)=>{
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(geld(s),33000);
 assert.deepEqual(W6.pruefen(w,s),[]);
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler.join('; '));
};
test('P8d Regel207 ist opt-in, Original204/205/206 sind nicht geaendert',()=>{
 const {w,s}=neu();
 assert.equal(w.regel,207);assert.equal(w.p8dGetrennteSpedition,true);
 assert.equal(K.erstellenJ4c().regel,204);
 assert.equal(K.erstellenP8b().regel,205);
 assert.equal(K.erstellenP8c().regel,206);
 assert.deepEqual(s.kanon.p8d.belege,[]);
 assert.equal(s.kanon.p8d.auftrag,null);
 assert.equal(s.stations.st_dravos.lager.silizium,undefined);
 assert.equal(s.owners.st_dravos.cash,0);
 assert.equal(s.owners.k1_p8d_fracht.cash,0);
 assert.equal(s.owners.k1_p8d_pilot.cash,0);
 assert.equal(Object.values(s.ships).filter(sh=>sh.system==='dravos').length,0);
 unabhaengig(w,s);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
});
test('P8d: unerlaubte Fremdauftraege, leeres Feld und gratis W3-Reise bleiben unveraendert',()=>{
 const {w,s}=neu(),save=w.save(s);
 for(const cmd of [
  {type:'siliconFreightOffer',owner:'house',miner:'sh999',frachter:'sh998'},
  {type:'siliconFreightOffer',owner:'npc3',miner:'sh999',frachter:'sh998'},
  {type:'siliconFreightAccept',owner:'npc3'},
  {type:'siliconFreightDispatch',owner:'transport'},
  {type:'siliconFreightLoad',owner:'transport'},
  {type:'siliconFreightReturn',owner:'transport'},
  {type:'siliconFreightDeliver',owner:'transport'},
  {type:'shipMove',owner:'transport',schiff:'sh999',ziel:'st_dravos'},
  {type:'siliconSell',owner:'transport',schiff:'sh999'}
 ])assert.equal(w.execute(s,cmd).ok,false,JSON.stringify(cmd));
 assert.equal(w.save(s),save);
});
test('P8d S02: getrennte Schiffe, reale Ladequittung, 0 Mint, voller Frachterlohn und einmaliger Verkauf',()=>{
 const {w,s}=neu();
 assert.deepEqual(w.npcAutoSetzen(s,true),{ok:true,aktiviert:true});
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 let hinSave=null,geladenSave=null,buys=0;
 for(let t=20;t<=90*1440;t+=20){
   w.advance(s,20);
   // Wie im belegten P8c-Referenzversuch: echte Lagerabnahme zu Original-900-ISK,
   // keine erfundenen Kaeufer oder Gratis-Abrufe. Ohne Nachfrage stoppt die Kette.
   if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&buys<3){
     const oldHouse=s.owners.house.cash,oldStation=s.owners.st_nadir.cash;
     const buy=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
     assert.equal(buy.ok,true,JSON.stringify(buy));
     assert.equal(oldHouse-s.owners.house.cash,900);
     assert.equal(s.owners.st_nadir.cash-oldStation,900);
     buys++;
   }
   const a=s.kanon.p8d.auftrag;
   if(a?.phase==='hin'&&a.lohnBezahlt>0&&!hinSave){
     hinSave=w.save(s);
     assert.notEqual(s.ships[a.miner].owner,s.ships[a.frachter].owner);
     assert.equal(s.ships[a.miner].ladung.silizium,8);
     assert.equal(s.ships[a.frachter].ladung.silizium||0,0);
   }
   if(a&&['rueckBereit','rueck','ankunft'].includes(a.phase)&&!geladenSave){
     geladenSave=w.save(s);
     assert.equal(s.ships[a.miner].ladung.silizium||0,0);
     assert.equal(s.ships[a.frachter].ladung.silizium,8);
   }
   if(t%(15*1440)===0)unabhaengig(w,s);
 }
 unabhaengig(w,s);
 const p=s.kanon.p8d;
 console.log('P8D_DIAGNOSE',JSON.stringify({tag:90,p8d:p,
  silizium:{auftrag:s.kanon.silizium.auftrag,felder:s.kanon.silizium.felder},
  p8c:s.kanon.p8c,npcSilizium:s.kanon.npcSilizium,
  kassen:{npc3:s.owners.npc3.cash,transport:s.owners.transport.cash,
    gebuehr:s.owners.k1_p8d_fracht.cash,lohn:s.owners.k1_p8d_pilot.cash},
  frachter:Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter')
    .map(x=>({id:x.id,system:x.system,phase:x.phase,auftrag:x.auftrag,ladung:x.ladung,flug:x.flug?.lage})),
  miner:Object.values(s.ships).filter(sh=>sh.owner==='npc3'&&sh.heimat==='nadir')
    .map(x=>({id:x.id,system:x.system,phase:x.phase,ladung:x.ladung,flug:x.flug?.lage}))}));
 assert.ok(p.belege.length>=1,'mindestens eine echte Dravos-Nadir-Fremdfracht');
 assert.ok(hinSave&&geladenSave,'physische Zwischenzustaende vorhanden');
 assert.equal(p.gebuehrBezahlt,p.belege.reduce((n,a)=>n+a.gebuehr,0));
 assert.equal(p.geliefert,p.belege.length*8);
 assert.equal(s.kanon.silizium.felder['dravos-silizium'].verkauft,p.geliefert);
 assert.equal(p.lohnBezahlt,p.lohnGebunden-(s.owners.k1_p8d_pilot.cash));
 assert.equal(s.owners.k1_p8d_fracht.cash,p.auftrag?.gebuehr||0);
 for(const a of p.belege){
   assert.notEqual(s.ships[a.miner].owner,s.ships[a.frachter].owner);
   assert.equal(a.lohnBezahlt,a.lohn);
   assert.ok(s.kanon.silizium.belege.some(b=>
     b.schiff===a.miner&&b.owner==='npc3'&&b.feld==='dravos-silizium'
     &&b.tick===a.ankunftTick&&b.preis===a.preis));
 }
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 for(const txt of [hinSave,geladenSave]){
   const wieder=w.load(txt);unabhaengig(w,wieder);
   const hash=w.hash(wieder);assert.equal(w.hash(w.load(w.save(wieder))),hash);
   w.advance(wieder,20);unabhaengig(w,wieder);
 }
 for(const mut of [
   x=>{x.kanon.p8d.belege[0].lohnBezahlt--;},
   x=>{x.kanon.p8d.belege[0].gebuehr++;},
   x=>{x.kanon.p8d.geliefert+=8;},
   x=>{x.kanon.silizium.felder['dravos-silizium'].vorrat+=8;}
 ]){
   const forged=JSON.parse(w.save(s));mut(forged);
   assert.equal(w.audit(forged).ok,false,'Manipulation muss entdeckt werden');
   assert.throws(()=>w.load(JSON.stringify(forged)));
 }
 console.log('P8D_SEPARATE_DRAVOS_FREIGHT',JSON.stringify({buys,
  hash:w.hash(s),belege:p.belege.length,menge:p.geliefert,lohn:p.lohnBezahlt,
  fracht:p.gebuehrBezahlt,gueter:s.kanon.silizium.felder['dravos-silizium'].verkauft,
  jaeger:s.kanon.jaeger.fertig,weltgeld:geld(s),mint:s.minted,burn:s.burned}));
});
