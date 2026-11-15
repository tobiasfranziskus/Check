import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const OLD=require('../prototypes/w5ac/session.js');
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const J10=require('../prototypes/verbund/jaeger-werft-lage.js');
const J6=require('../prototypes/j6w/wirtschaft.js');
const old=()=>OLD.create(42,'private195').export();
const fresh=()=>{const session=J8.erstellen();session.starten195(old(),true);return session;};
test('J10a: nach echter 195→204-Kopie sind alle fremden Werft-/Vertragssperren lesbar, kein Spieler-Mint',()=>{
 const a=fresh(),w=a.weltReferenz(),s=a.zustandReferenz(),hash=a.ansicht().hash,save=a.exportieren();
 const t=J10.erstellen(w,s);
 assert.equal(t.regel,204);
 assert.equal(t.hash,hash);
 assert.equal(t.weltgeld,33000);
 assert.equal(t.j4.kaufpreis,900);
 assert.equal(t.j4.bauteile,8);
 assert.equal(t.j4.material,4);
 assert.equal(t.j4.dauer,32);
 assert.equal(t.j4.lohn,32);
 assert.equal(t.j4.eigentuemer,'st_nadir');
 assert.equal(t.j4.produzierterBestand,0);
 assert.equal(t.lager.jaeger,0);
 assert.equal(t.vorgaenge.find(x=>x.id==='j4').nurAnzeige,true);
 const haus=t.vorgaenge.find(x=>x.id==='house-buy');
 assert.equal(haus.nurAnzeige,false);
 assert.equal(haus.ok,false);
 assert.match(haus.grund,/Lager|bezahlt|Werft|900/);
 assert.equal(t.k7.werftBarmittel,s.owners.werft_extern.cash);
 assert.equal(t.k7.werftReserve,w.industriePreise.werft);
 for(const x of t.vorgaenge){
   const cmdById={
    w4:{type:'stationRefine',station:'st_nadir'},
    j3:{type:'stationBuildParts',station:'st_nadir'},
    j4:{type:'stationBuildFighter',station:'st_nadir'},
    'house-buy':{type:'shipBuy',station:'st_nadir',klasse:'jaeger'},
    'k7-mine':{type:'industrialOreAcceptMine'},
    'k7-freight':{type:'industrialOreAcceptFreight'},
    'k7-yard':{type:'industrialOreAcceptYard'},
    'k7-commit':{type:'industrialOreCommit'}
   };
   if(x.id==='k7-offer')cmdById['k7-offer']={type:'industrialOreOffer',miner:t.k7.angebotMiner,frachter:t.k7.angebotFrachter};
   const check=J6.erstellen(w,x.eigentuemer).angebot(s,cmdById[x.id]);
   assert.equal(x.ok,check.ok,x.id);
   assert.equal(x.grund,check.reason||null,x.id);
 }
 assert.equal(a.exportieren(),save,'keine Buchung durch Sichtprüfung');
 assert.equal(a.ansicht().hash,hash);
 assert.equal(Object.isFrozen(t)&&Object.isFrozen(t.vorgaenge)&&Object.isFrozen(t.kassen),true);
 // Oberflächenmutationen können keinen Konto-/Lagerzustand ändern.
 assert.throws(()=>{t.kassen.house=999999},TypeError);
 console.log('J10A_START',JSON.stringify({
  fighter:t.j4,fehlbedarf:t.fehlbedarf,k7:t.k7,
  bottlenecks:t.vorgaenge.map(v=>({id:v.id,ok:v.ok,owner:v.eigentuemer,reason:v.grund}))
 }));
});
test('J10a: legitimer 600-ISK-Minerkauf aktualisiert nur die eigenen Finanzen, keine Werftproduktion',()=>{
 const s=fresh(),first=s.werftLage?.()||J10.erstellen(s.weltReferenz(),s.zustandReferenz());
 const before=s.exportieren();
 assert.equal(s.ausfuehren('buy-st_aldera-miner').ok,true);
 const after=J10.erstellen(s.weltReferenz(),s.zustandReferenz());
 assert.equal(after.kassen.house,first.kassen.house-600);
 assert.equal(after.weltgeld,first.weltgeld);
 assert.equal(after.j4.produzierterBestand,first.j4.produzierterBestand);
 assert.equal(after.kassen.st_nadir,first.kassen.st_nadir);
 assert.equal(after.lager.jaeger,0);
 assert.notEqual(s.exportieren(),before);
 assert.equal(s.flugAudit().ok,true);
});
test('J10a: vorhandener originaler J4e-Save wird nur analysiert, keine neue Jägerhülle',()=>{
 const json=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
 const raw=JSON.parse(json),p=raw.w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
 const s=w.load(json),before=w.save(s),t=J10.erstellen(w,s);
 assert.equal(t.j4.produzierterBestand,1);
 assert.equal(t.j4.verkauft,1);
 assert.equal(t.lager.jaeger,0);
 assert.equal(t.weltgeld,33000);
 assert.equal(w.save(s),before);
 assert.equal(w.audit(s).ok,true);
});
test('J10a: manipuliertes Geld, unzulässige Welt und Anzeige ohne Autorität abgewiesen',()=>{
 const s=fresh(),w=s.weltReferenz(),copy=JSON.parse(s.exportieren());
 copy.owners.house.cash++;
 assert.throws(()=>J10.erstellen(w,copy),/audit|ungültig|Welt/);
 copy.owners.house.cash--;
 copy.stations.st_nadir.lager.bauteil++;
 assert.throws(()=>J10.erstellen(w,copy),/audit|ungültig|Welt/);
 const original=s.exportieren();
 assert.throws(()=>J10.erstellen({...w,regel:195},s.zustandReferenz()),/Regel204/);
 assert.equal(s.exportieren(),original);
});
