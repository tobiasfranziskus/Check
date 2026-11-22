import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');

// Research-only driver: explicit original stop commands, never part of the
// production tick or UI. Intentionally only the reproduced zero-budget case.
// Do not stop a funded contract, loaded ship, transitional flight or NPC.
function kandidaten(s, rules) {
 const cfg=rules.erzpilot, owner=rules.economy.start.owner;
 if(s.owners[cfg.exportOwner].cash!==0)return [];
 return Object.keys(s.kanon.pendel).sort().filter(id=>{
  const p=s.kanon.pendel[id],sh=s.ships[id],lage=sh?.flug?.lage;
  return sh?.owner===owner && sh.klasse==='miner' && p.ware==='erz'
   && !p.beenden && !!lage && !['andocken','abdocken','transit'].includes(lage)
   && !s.kanon.flugdienst[id]?.gestrandet
   && Object.values(sh.ladung).every(n=>n===0)
   && !s.erzpilotVertraege?.[id]
   && s.w3?.auftrag?.industrieMiner!==id;
 });
}
function minuten(j,n){
 const stops=[];
 for(let i=0;i<n;i++){
  const s=j.zustandReferenz(),w=j.weltReferenz();
  for(const id of kandidaten(s,w.rules)){
   const r=j.ausfuehren('stop-'+id);
   assert.equal(r.ok,true,id+': '+r.reason);
   stops.push(id);
  }
  j.weiterspielen(1);
 }
 return stops;
}
function kopie(json){
 const j=J8.erstellen();
 j.oeffnen204(json,true);
 assert.equal(j.exportieren(),json);
 return j;
}

test('M4-U6 Forschung: Kandidatenfilter schliesst Vertrag, Ware, Fremdrechte und Transit aus',()=>{
 const rules={erzpilot:{exportOwner:'export'},economy:{start:{owner:'house'}}};
 const schiff=(owner='house',lage='frei',erz=0)=>({owner,klasse:'miner',flug:{lage},ladung:{erz}});
 const s={owners:{export:{cash:0}},ships:{
  frei:schiff(),vertrag:schiff(),ware:schiff('house','frei',1),
  fremd:schiff('npc3'),transit:schiff('house','transit'),
  industrie:schiff(),angefordert:schiff(),eis:schiff(),gestrandet:schiff()
 },kanon:{pendel:{},flugdienst:{gestrandet:{gestrandet:true}}},
 erzpilotVertraege:{vertrag:{menge:50}},w3:{auftrag:{industrieMiner:'industrie'}}};
 for(const id of Object.keys(s.ships))s.kanon.pendel[id]={ware:'erz'};
 s.kanon.pendel.angefordert.beenden=true;
 s.kanon.pendel.eis.ware='eis';
 assert.deepEqual(kandidaten(s,rules),['frei']);
 s.owners.export.cash=500;
 assert.deepEqual(kandidaten(s,rules),[]);
});

test('M4-U6 Forschung: expliziter sicherer Stop am echten 48-Fahrten-Engpass, Replay und Reload',()=>{
 const original=engpassNach48(),json=original.exportieren(),w=original.weltReferenz();
 const hash=original.ansicht().hash;
 assert.equal(hash,'f63f2cd09ba5a88c');
 const a=kopie(json);
 const stops1=minuten(a,60);
 const b=kopie(a.exportieren());
 const stops2=minuten(a,180);
 assert.deepEqual(minuten(b,180),stops2);
 assert.equal(a.exportieren(),b.exportieren());
 assert.deepEqual([...stops1,...stops2].sort(),['sh004','sh005']);
 for(const id of ['sh004','sh005']){
  const s=a.zustandReferenz();
  assert.equal(s.kanon.pendel[id],undefined);
  assert.equal(s.kanon.flugdienst[id],undefined);
  assert.equal(s.ships[id].flug.lage,'angedockt');
  assert.equal(s.ships[id].owner,'house');
  assert.equal(s.erzpilotVertraege[id],undefined);
 }
 assert.deepEqual(pruefen(w,a.zustandReferenz()),[]);
 assert.equal(a.angebote().find(x=>x.id==='ore-sh004').ok,false);
 assert.equal(a.angebote().find(x=>x.id==='freight-sh003').reason,'Eislager Nadir voll');
 const lohn=a.zustandReferenz().kanon.fluglohnMinuten-original.zustandReferenz().kanon.fluglohnMinuten;
 assert.ok(lohn<480,'Rückkehr muss weniger Lohn als zwei dauerhaft fliegende Miner kosten');
 for(let i=0;i<44;i++)a.weiterspielen(60);
 const nach=a.zustandReferenz();
 assert.equal(nach.tick,original.zustandReferenz().tick+2880);
 for(const id of ['sh004','sh005']){
  assert.equal(nach.kanon.flugdienst[id],undefined);
  assert.equal(nach.kanon.pendel[id],undefined);
 }
 assert.deepEqual(pruefen(w,nach),[]);
 assert.equal(original.exportieren(),json,'Originalfixture bleibt unverändert');
 console.log('M4_U6_RESEARCH',JSON.stringify({stops:[...stops1,...stops2],rueckkehrLohnminuten:lohn,hash:a.ansicht().hash,tick:nach.tick}));
});
