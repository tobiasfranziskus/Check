// M3-P3: authentic Rule204/S02 NPC-account receipts, never synthetic player rights.
// The new manager view is a read-only explanation of the existing W3→W4→W5.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const Industry=require('../prototypes/spiel/p3-industrie.js');
function start(){
 const j=J8.erstellen();j.starten195(OLD.create(42,'private195').export(),true);
 const w=j.weltReferenz(),s=j.zustandReferenz();
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 assert.equal(w.audit(s).ok,true);return {j,w,s};
}
function view(j,w,s){
 const before=w.save(s),hash=w.hash(s),p=Industry.auswerten(w,s,j.angebote());
 assert.equal(w.save(s),before,'read-only industrial view must never alter save bytes');
 assert.equal(w.hash(s),hash,'read-only industrial view must not advance simulation');
 assert.equal(p.sichtbar,true);
 assert.equal(p.buchungen.auftraggeber,'st_nadir');
 assert.equal(p.buchungen.raffinerieEigentuemer,'st_nadir');
 assert.equal(p.buchungen.werftEigentuemer,'werft_extern');
 return p;
}
test('M3-P3: original reserves, payments, signatures and unsold stock at six real checkpoints',()=>{
 const {j,w,s}=start(),marks=[];
 for(let minute=0;minute<=300;minute++){
  if([71,203,223,253,263,300].includes(minute)){
   const p=view(j,w,s),b=p.buchungen;
   assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
   assert.equal(s.minted,0);assert.equal(s.burned,0);
   assert.equal(w.audit(s).ok,true);
   assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
   assert.equal(p.hullenNadir,s.stations.st_nadir.lager.frachter);
   if(minute===71){
    assert.equal(b.k7Phase,'aktiv');
    assert.equal(b.minerEigentuemer,'npc3');
    assert.equal(b.frachterEigentuemer,'transport');
    assert.deepEqual(b.signaturen,{bergbau:true,spediteur:true,werft:true});
    assert.equal(b.w3.kaufReserve,740);
    assert.equal(b.w3.arbeitsReserve,120);
    assert.equal(b.w3.frachttarifAusgezahlt,0);
    assert.equal(b.w5.k7WerftReserve,530);
   }
   if(minute===203){
    assert.equal(b.w3.kaufReserve,240);
    assert.equal(b.w3.fluglohnBezahlt,60);
    assert.equal(b.w3.frachttarifAusgezahlt,0,'delivery is not paid return');
    assert.equal(b.w4.arbeitsReserve,20);
    assert.equal(b.w4.arbeitsBezahlt,0);
   }
   if(minute===223){
    assert.equal(b.w4.arbeitsBezahlt,20);
    assert.equal(b.w5.k7WerftReserve,0);
    assert.equal(b.w5.materialBezahlt,500);
    assert.equal(b.w5.arbeitsReserve,30);
    assert.equal(b.w5.arbeitsBezahlt,0);
    assert.equal(p.hullenNadir,0,'work in progress is not inventory');
   }
   if(minute===253){
    assert.equal(b.w5.arbeitsBezahlt,30);
    assert.equal(b.w5.arbeitsReserve,0);
    assert.equal(p.hullenNadir,1,'finished hull belongs to station stock');
    assert.equal(p.werftSpielerAnzahl,0,'NPC construction is never a free house ship');
    assert.equal(p.kaufberechtigt,true,'original house quote is already executable');
    assert.equal(s.w3.abgeschlossen,0,'W3 return not yet completed');
   }
   if(minute===263){
    assert.equal(b.w3.kaufReserve,0);
    assert.equal(b.w3.arbeitsReserve,0);
    assert.equal(b.w3.fluglohnBezahlt,120);
    assert.equal(b.w3.frachttarifAusgezahlt,240);
    assert.equal(s.w3.abgeschlossen,1);
   }
   if(minute===300){
    assert.equal(p.hullenNadir,1);
    assert.equal(p.werftSpielerAnzahl,0);
    assert.equal(p.hausKasse,3000);
    assert.equal(p.hausKaufbereit,true);
   }
   marks.push({minute,hash:w.hash(s),cash:s.owners.house.cash,
    stock:p.hullenNadir,reserves:[b.w3.kaufReserve,b.w3.arbeitsReserve,
     b.w4.arbeitsReserve,b.w5.k7WerftReserve,b.w5.arbeitsReserve]});
  }
  if(minute<300)w.advance(s,1);
 }
 const price=j.ausfuehren('buy-st_nadir-frachter');
 assert.equal(price.ok,true,JSON.stringify(price));
 const after=j.zustandReferenz(),p=view(j,w,after);
 assert.equal(p.hullenNadir,0);
 assert.equal(p.werftSpielerAnzahl,1);
 assert.equal(p.hausKasse,2250);
 assert.equal(p.kaufberechtigt,false);
 assert.equal(after.w5.verkauft,1);
 assert.equal(w.audit(after).ok,true);
 console.log('M3_P3_ACTUAL_BOOKING_TIMELINE '+JSON.stringify(marks));
});
test('M3-P3: no industrial book on classic Rule204 or separate Rule207 career',()=>{
 const regular=J8.erstellen();regular.starten195(OLD.create(42,'private195').export(),true);
 const w=regular.weltReferenz(),s=regular.zustandReferenz(),before=w.save(s);
 assert.equal(Industry.auswerten(w,s,regular.angebote()).sichtbar,false);
 assert.equal(w.save(s),before);
 const other=J8.erstellen();other.startenP8g(true);
 const w6=other.weltReferenz(),s6=other.zustandReferenz(),before6=w6.save(s6);
 assert.equal(Industry.auswerten(w6,s6,other.angebote()).sichtbar,false);
 assert.equal(w6.save(s6),before6);
});
test('M3-P3: the visible manager section binds each read-only receipt and no new action',()=>{
 const html=readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const ids=['p3-industrie-rechte','p3-industrie-k7','p3-industrie-w3-geld',
  'p3-industrie-w4-geld','p3-industrie-w5-geld','p3-industrie-eigentum'];
 for(const id of ids){
  assert.match(html,new RegExp('id="'+id+'"'),'every payment detail needs its own element');
  assert.ok(js.includes("$('"+id+"').textContent"),'only textContent renders '+id);
 }
 assert.match(html,/<details id="p3-industrie-buchungen">/);
 assert.match(js,/const book=p.buchungen/);
 assert.doesNotMatch(js.slice(js.indexOf('const book=p.buchungen'),
  js.indexOf("const b=$('p3-industrie-kauf')")),/\.ausfuehren\(|\.weiterspielen\(/);
});
