'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {abnahme}=require('./w6-gesamtpaket.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const {angebot,pruefeZustimmungen}=require('./w6-wasser-vorbestellung.cjs');
const id=process.argv[2]||'S02',tage=id==='S02'?365:90;
assert.ok(['S02','S08','S12'].includes(id));
const hashes={S02:'77aae111ae5163df',S08:'fabca2f65d3300cb',S12:'18b9f12b19a90d42'};
function audit(w,s){
 const original=w.save(s);
 assert.deepEqual(pruefen(w,s),[]);
 const ziel=w.rules.w5n.quellStation;
 const ships=Object.values(s.ships).filter(sh=>['house','transport'].includes(sh.owner)
   &&sh.klasse==='frachter'&&sh.system==='aldera'&&!w.stillgelegt(s,sh.id)
   &&(w.restAktivminuten(s,sh.id)??Infinity)>=120).sort((a,b)=>a.id<b.id?-1:1);
 const zielmenge=100;
 const orders=[];
 let rest=zielmenge;
 for(const owner of Object.keys(w.daten.haushalte).sort()){
   if(['pilot_house','eigner_house'].includes(owner)||w.daten.haushalte[owner]!==ziel)continue;
   const h=s.kanon.haushalte[owner],p=s.kanon.politik;
   const heute=h?.tag===Math.floor(s.tick/1440)?h.heute:0;
   const n=Math.min(rest,Math.floor(w.haushaltVerfuegbar(s,owner)/w.daten.wasser.preisAldera),
     p.bedarfJeTag>0?Math.max(0,p.bedarfJeTag-heute):Infinity);
   if(n>0){orders.push({owner,menge:n});rest-=n;}
 }
 const request=schiff=>({schiff,tarif:160,bestellungen:orders});
 const npc=ships.map(sh=>angebot(w,s,request(sh.id)));
 const signs=a=>a.parteien.map(owner=>({owner,angebot:a.id}));
 let positive=null;
 if(id==='S08'){
   assert.equal(rest,0,'S08 has enough actual NPC budgets for the hypothetical order');
   const q=npc.find(x=>x.ok);assert.ok(q,JSON.stringify(npc));
   const req=request(q.angebot.schiff);
   const sig=signs(q.angebot);
   positive=pruefeZustimmungen(w,s,req,sig);
   assert.equal(positive.ok,true);
   assert.equal(positive.angebot.menge,100);
   assert.equal(positive.angebot.stationsmarge,40);
   assert.equal(positive.angebot.frachtmarge,4);
   assert.equal(positive.zahlungsplan.vorbestellTreuhand,1600);
   assert.equal(pruefeZustimmungen(w,s,req,[]).grund,'ZUSTIMMUNG_FEHLT');
   assert.equal(pruefeZustimmungen(w,s,req,sig.map((v,i)=>i===0?{...v,angebot:'fremd'}:v)).grund,'ZUSTIMMUNG_UNGUELTIG');
   assert.equal(pruefeZustimmungen(w,s,req,sig.map((v,i)=>i===1?sig[0]:v)).grund,'ZUSTIMMUNG_UNGUELTIG');
   assert.equal(angebot(w,s,{...req,tarif:100}).grund,'TARIF_UNTERDECKT');
   assert.equal(angebot(w,s,{...req,bestellungen:[{owner:'house',menge:100}]}).grund,'KAEUFER');
   assert.equal(angebot(w,s,{...req,bestellungen:[orders[0],orders[0]]}).ok,false);
   const q2=w.load(original);w.advance(q2,1);
   assert.equal(pruefeZustimmungen(w,q2,req,sig).ok,false,'old consent is not portable');
 }else{
   assert.ok(npc.every(x=>!x.ok),'no fabricated viable NPC order');
   if(id==='S02'){
     assert.equal(rest,87,'only 13 NPC units budgeted');
     // A test fixture, NOT actual consent or a user action: show the
     // difference between existing private funds and automatic demand.
     const req={schiff:'sh004',tarif:160,bestellungen:[{owner:'pilot_house',menge:100}]};
     const q=angebot(w,s,req);assert.ok(q.ok,JSON.stringify(q));
     assert.equal(pruefeZustimmungen(w,s,req,[]).ok,false);
     assert.equal(angebot(w,s,{...req,bestellungen:[{owner:'pilot_house',menge:101}]}).ok,false);
     assert.equal(angebot(w,s,{...req,schiff:'sh009'}).grund,'RESTZEIT');
     positive=pruefeZustimmungen(w,s,req,signs(q.angebot));
     assert.ok(positive.ok);
     assert.equal(positive.status,'ZULASSUNGSPRUEFUNG_NICHT_GEBUCHT');
   }
 }
 assert.equal(w.save(s),original,'quote never modifies the world');
 assert.deepEqual(pruefen(w,s),[]);
 return {npcBudget:100-rest,orders,npc,positive,hypothetical:true};
}
const r=abnahme(id,tage,42,'gesamt',true,audit);
assert.equal(r.verlauf.at(-1).hash,hashes[id]);
fs.writeFileSync(process.argv[3]||'report.json',JSON.stringify(r,null,2)+'\n');
console.log('W6_WASSER_VORBESTELLUNG '+JSON.stringify({id,hash:r.verlauf.at(-1).hash,untersuchung:r.untersuchung,replay:r.replay}));
