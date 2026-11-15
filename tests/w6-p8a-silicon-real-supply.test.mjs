// P8a: real Rule204 endowment, signed ownership, financing and absent Dravos route.
// No new resources, no separate simulation, no test-only economic injections.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const P8=require('../prototypes/spiel/silizium-versorgung.js');
const W6=require('../tools/w6-szenarien.cjs');
const S02=W6.SZENARIEN.find(x=>x.id==='S02').politik;
const neue=()=>{
 const {welt:w,s}=W6.start(S02);
 assert.equal(w.regel,204);
 return {w,s};
};
test('P8a: vor realem Abbau zeigt die Diagnose nur vorhandene 16 Silizium und echte Kassen',()=>{
 const {w,s}=neue();
 const initial=w.save(s),hash=w.hash(s);
 const a=P8.erstellen(w,s);
 assert.equal(a.regel,204);
 assert.equal(a.rohstoff.gesamt,16);
 assert.equal(a.rohstoff.rest,16);
 assert.equal(a.rohstoff.gefoerdert,0);
 assert.equal(a.rohstoff.verkauft,0);
 assert.equal(a.rohstoff.moeglicheNeueChargen,2);
 assert.equal(a.rohstoff.auftrag,null);
 assert.equal(a.lager.siliziumNadir,0);
 assert.equal(a.lager.siliziumSchiffe,0);
 assert.equal(a.lager.fertigeJaeger,0);
 assert.equal(a.finanzierung.arbeitJeCharge,128,'J2b: 8 Einheiten x 8 Minuten x 2 ISK');
 assert.equal(a.finanzierung.ankaufJeCharge,192,'J2b: 8 Einheiten x 24 ISK');
 assert.equal(a.finanzierung.flugreserve,40,'nur bestehender K1-Flugvertrag');
 assert.equal(a.finanzierung.npc3MindestMitFlug,168);
 assert.equal(a.weg.fremdeAktiveSiliziumFelder,0);
 assert.equal(a.weg.aktiveSiliziumFelder,1);
 assert.equal(a.weg.dravosAktiv,false);
 assert.deepEqual(a.weg.aktiveSysteme,['aldera','nadir']);
 assert.equal(a.weg.neueLieferrouteFinanziert,false);
 assert.equal(Object.isFrozen(a.rohstoff),true);
 assert.equal(Object.isFrozen(a.finanzierung),true);
 assert.equal(w.hash(s),hash);
 assert.equal(w.save(s),initial,'reines Lesen darf den Originalsave nicht veraendern');
 assert.deepEqual(W6.pruefen(w,s),[]);
});

test('P8a: fremde Dravos-Transportbestellung ist KEIN vorhandenes Rule204-Angebot',()=>{
 const {w,s}=neue(),before=w.save(s);
 assert.equal(w.rules.world.systems.dravos,undefined,'keine nicht vorhandene aktive Dravos-Station erfinden');
 assert.equal(w.rules.world.gates.some(g=>g.includes('dravos')),false);
 const attempted=w.execute(s,{type:'shipBuy',owner:'house',station:'st_dravos',klasse:'miner'});
 assert.equal(attempted.ok,false,'fehlende Station darf keinen finanzierten Kauf buchen');
 assert.equal(w.save(s),before);
 assert.equal(P8.erstellen(w,s).rohstoff.rest,16);
 const forged=JSON.parse(before);
 forged.kanon.silizium.vorrat+=8;
 assert.throws(()=>P8.erstellen(w,forged),/Original-Waren-\/Geld-\/Eigentumsaudit verweigert Status/);
 assert.equal(w.save(s),before,'Manipulationsprobe niemals Originalstand importieren');
});

test('P8a: nach ECHTER NPC-Foerderung, J4-Kauf und Rohstoffende zeigt P8a exakt keinen dritten Rohstoffvorrat',()=>{
 const {w,s}=neue();
 assert.deepEqual(w.npcSiliziumSetzen(s,true),{ok:true,aktiviert:true});
 let gekauft=false;
 const grenze=60*1440;
 for(let tick=120;tick<=grenze&&s.kanon.silizium.vorrat>0;tick+=120){
  w.advance(s,120);
  if(!gekauft&&(s.stations.st_nadir.lager.jaeger||0)>0){
   const vorher=s.owners.house.cash,nadir=s.owners.st_nadir.cash;
   const r=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
   assert.equal(r.ok,true,JSON.stringify(r));
   assert.equal(vorher-s.owners.house.cash,900);
   assert.equal(s.owners.st_nadir.cash-nadir,900);
   gekauft=true;
  }
 }
 assert.equal(gekauft,true,'echte Jägerabnahme muss Produktionsplatz freimachen');
 assert.equal(s.kanon.silizium.vorrat,0,'beide endlichen J2b-Chargen aus echten Belegen');
 const save=w.save(s),hash=w.hash(s);
 const a=P8.erstellen(w,s);
 assert.equal(a.rohstoff.gesamt,16);
 assert.equal(a.rohstoff.gefoerdert,16);
 assert.equal(a.rohstoff.verkauft,16);
 assert.equal(a.rohstoff.rest,0);
 assert.equal(a.rohstoff.moeglicheNeueChargen,0);
 assert.equal(a.weg.fremdeAktiveSiliziumFelder,0);
 assert.equal(a.weg.dravosAktiv,false);
 assert.equal(a.lager.siliziumNadir,s.stations.st_nadir.lager.silizium);
 assert.equal(a.lager.siliziumSchiffe,
  Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung?.silizium||0),0));
 assert.equal(s.owners.house.cash,2100);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0),33000);
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(w.save(s),save);
 assert.equal(w.hash(s),hash);
 assert.equal(w.hash(w.load(save)),hash,'Load/Save, Ressourcenzahl und Kassen sind stabil');
 console.log('W6_P8A_REAL_EXHAUSTION',JSON.stringify({
  day:s.tick/1440,hash,produced:s.kanon.jaeger.fertig,rest:a.rohstoff.rest,
  boughtByHouse:1,weltgeld:33000,minted:0,burned:0}));
});
test('P8a: Browserkarte zeigt nur Bericht und niemals heimliche Core-Aktionen',()=>{
 const html=readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const module=readFileSync(new URL('../prototypes/spiel/silizium-versorgung.js',import.meta.url),'utf8');
 assert.match(html,/id="p8-silizium-lage"/);
 assert.match(html,/src="silizium-versorgung\.js"/);
 assert.match(ui,/scope\.P8SiliziumVersorgung\.erstellen\(session\.weltReferenz\(\),zustand\)/);
 assert.match(ui,/siliziumBericht\(s\)/);
 assert.doesNotMatch(module,/\.advance\(|\.execute\(|\.transfer\(|\.setItem\(|\.innerHTML|\.mint\(/);
 assert.throws(()=>P8.erstellen({},{}),/Regel204/);
});
