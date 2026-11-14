import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {j3Quelle} from '../tools/j3-bauteile-gate.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const c=()=>({type:'stationBuildParts',owner:'st_nadir',station:'st_nadir'});
const good=(w,s,m)=>assert.equal(w.audit(s).ok,true,m+': '+JSON.stringify(w.audit(s).fehler));
const money=s=>Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
const reject=(w,s,cmd)=>{
 const old=w.canonical(s),r=w.execute(s,cmd);
 assert.equal(r.ok,false,JSON.stringify({cmd,r}));
 assert.equal(w.canonical(s),old,'abgelehnter Befehl darf KEIN Feld aendern');
};
async function run(seed){
 const {welt:w,zustand:s,nachweis,miner}=await j3Quelle(seed);
 assert.equal(w.regel,202);
 assert.equal(s.ledger.bauteil.initial,0);assert.equal(s.stations.st_nadir.lager.bauteil,0);
 assert.equal(s.stations.st_nadir.lager.silizium,8,'physisches bezahltes J2b-Silizium');
 assert.equal(s.kanon.silizium.verkauft,8);
 assert.equal(nachweis.refine,true,'tatsaechliche Original-W4-Erz→Material-Charge');
 assert.ok(nachweis.oreBefore>=10,'kein Raffinat ohne bezahltes W3-Erz');
 assert.ok(nachweis.materialAfter>=4,'2 Bauteile brauchen vier reale Materialeinheiten');
 assert.equal(s.ledger.material.produced,s.w4.materialErzeugt);
 const initial={material:s.stations.st_nadir.lager.material,
  silicon:s.stations.st_nadir.lager.silizium,
  stCash:s.owners.st_nadir.cash,
  worker:s.owners.j3_bauteil_arbeiter.cash,
  ledger:s.ledger.material.consumed};
 good(w,s,'J3-Quelle');
 for(let n=1;n<=2;n++){
  const start=w.execute(s,c());
  assert.equal(start.ok,true,JSON.stringify(start));
  assert.equal(s.owners.st_nadir.cash,initial.stCash-8*n);
  assert.equal(s.stations.st_nadir.lager.material,initial.material-2*n);
  assert.equal(s.stations.st_nadir.lager.silizium,initial.silicon-n);
  assert.equal(s.owners.j3_arbeit_treuhand.cash,8);
  reject(w,s,c());
  good(w,s,'J3 Rohwaren gebunden '+n);
  for(let j=0;j<8;j++){
    w.minute(s);
    good(w,s,'J3 bezahlte Minute '+n+'/'+j);
    assert.equal(s.owners.j3_bauteil_arbeiter.cash,initial.worker+(n-1)*8+j+1);
    if(j<7)assert.equal(s.stations.st_nadir.lager.bauteil,n-1,
      'kein Teil vor Arbeitsabschluss');
  }
  assert.equal(s.owners.j3_arbeit_treuhand.cash,0);
  assert.equal(s.stations.st_nadir.lager.bauteil,n);
  assert.equal(s.ledger.bauteil.produced,n);
 }
 assert.equal(s.kanon.bauteile.begonnen,2);
 assert.equal(s.kanon.bauteile.abgeschlossen,2);
 assert.equal(s.kanon.bauteile.materialVerbraucht,4);
 assert.equal(s.kanon.bauteile.siliziumVerbraucht,2);
 assert.equal(s.kanon.bauteile.arbeitsGezahlt,16);
 assert.equal(s.kanon.bauteile.belege.length,2);
 assert.equal(s.ledger.silizium.consumed,2);
 assert.equal(s.ledger.material.consumed,initial.ledger+4);
 assert.equal(s.stations.st_nadir.lager.silizium,6);
 assert.equal(money(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 good(w,s,'zwei echte Bauteile');
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 assert.deepEqual(w.load(w.save(s)),s);
 return {w,s,initial,nachweis,hash:w.hash(s),miner};
}
for(const seed of [42,7])test('J3 seed '+seed+': J2b-Silizium + W4-Material → zwei echte bezahlte Bauteile',async()=>{
 const r=await run(seed);
 console.log('J3_REAL_PARTS',JSON.stringify({seed,hash:r.hash,
  source:r.nachweis,bauteile:r.s.kanon.bauteile,
  totalCash:money(r.s),mint:r.s.minted,burn:r.s.burned}));
});
test('J3: Original-Rezeptmaterial, Kaufrechte und Lohnreserve atomar erforderlich',async()=>{
 const {welt:w,zustand:s}=await j3Quelle(42),src=w.save(s);
 const invalid=[
  x=>{x.stations.st_nadir.lager.material=1;},
  x=>{x.stations.st_nadir.lager.silizium=0;},
  x=>{x.owners.st_nadir.cash=7;},
 ];
 for(const change of invalid){const x=w.load(src);change(x);reject(w,x,c());}
 for(const command of [
  {...c(),owner:'house'},
  {...c(),station:'st_aldera'},
  {...c(),menge:8},
  {type:'stationBuildParts',owner:'st_nadir'},
  {type:'stationBuildParts',owner:'st_nadir',station:'st_nadir',preis:0},
  {type:'stationBuildShip',owner:'st_nadir',station:'st_nadir',klasse:'jaeger'},
 ]) reject(w,s,command);
 good(w,s,'alte Rechte abgewiesen');
});
test('J3: manipulierte Belege, virtuelle Inventare, Arbeitslohn und doppelte Waren abweisen',async()=>{
 const {w,s}=await run(42);
 const saved=w.save(s);
 for(const mutate of [
  x=>{x.stations.st_nadir.lager.bauteil=3;},
  x=>{x.stations.st_nadir.lager.material+=2;},
  x=>{x.stations.st_nadir.lager.silizium++;},
  x=>{x.ledger.bauteil.produced++;},
  x=>{x.ledger.material.consumed--;},
  x=>{x.ledger.silizium.consumed--;},
  x=>{x.kanon.bauteile.materialVerbraucht--;},
  x=>{x.kanon.bauteile.siliziumVerbraucht++;},
  x=>{x.kanon.bauteile.arbeitsGezahlt--;},
  x=>{x.kanon.bauteile.belege[0].material=0;},
  x=>{x.kanon.bauteile.belege[1].lohn=0;},
  x=>{x.kanon.bauteile.belege[1].ende=x.tick+1;},
  x=>{x.owners.j3_bauteil_arbeiter.cash++;},
  x=>{x.kanon.bauteile.auftrag={tick:x.tick,gearbeitet:0};},
 ]){
  const bad=JSON.parse(saved);mutate(bad);
  assert.equal(w.audit(bad).ok,false,'ungültiger Bauteilzustand abgelehnt');
  assert.throws(()=>w.load(JSON.stringify(bad)),'manipulierter Import abgelehnt');
 }
 good(w,s,'urspruenglicher Zustand nach Attacken unveraendert');
});
test('J3: ausgewaehltes Folgeprofil niemals als J2b-/Regel200-Spielstand akzeptieren',async()=>{
 const {welt:w,zustand:s}=await j3Quelle(42);
 const old=Welt.erstellenJ2b();
 assert.throws(()=>old.load(w.save(s)));
 assert.throws(()=>Welt.ausRegel201J3(w.save(s)),'Regel202 nicht als Regel201 migrieren');
 assert.equal(s.rulesVersion,202);good(w,s,'separate Forschungsregeln');
});


test('J3/J4-Grenze: alle vorhandenen Rohstoffe ausschliesslich durch echte W4-Chargen nutzen, nichts erfinden',async()=>{
 const {welt:w,zustand:s,nachweis}=await j3Quelle(42);
 const oreStart=s.stations.st_nadir.lager.erz,matStart=s.stations.st_nadir.lager.material;
 let refine=0,parts=0;
 for(let gate=0;gate<32;gate++){
   const st=s.stations.st_nadir.lager;
   if(st.material>=2&&st.silizium>=1&&s.owners.st_nadir.cash>=8){
     const r=w.execute(s,c());assert.equal(r.ok,true,JSON.stringify(r));
     for(let i=0;i<8;i++)w.minute(s);
     parts++;good(w,s,'J3 weiterer physischer Bauteilabschluss '+parts);
   }else if(st.material<2&&st.erz>=10){
     const r=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
     if(!r.ok)break; // realer Kapital-/Produktionsengpass, keine Rettung
     for(let i=0;i<20;i++)w.minute(s);
     refine++;good(w,s,'W4 Folgecharge aus echtem Erz '+refine);
   }else break;
 }
 const rem=s.stations.st_nadir.lager;
 const vorgemerkt={
   parts,additionalRefinements:refine,
   oreStart,materialStart:matStart,oreLeft:rem.erz,
   materialLeft:rem.material,siliconLeft:rem.silizium,
   siliconMineSource:s.kanon.silizium.gefoerdert,
   partWorkMinutes:s.kanon.bauteile.arbeitsGezahlt,
   totalCash:money(s),mint:s.minted,burn:s.burned,
   fighterPartsMissing:Math.max(0,8-parts),
   fighterExtraMaterialMissing:Math.max(0,4-rem.material),
   seed:42,hash:w.hash(s)
 };
 assert.ok(parts>=2,'mindestens zwei echte Bauteile');
 assert.ok(parts<=8,'nicht mehr Teile als echt verfuegbares Silizium');
 assert.equal(s.kanon.bauteile.siliziumVerbraucht,parts);
 assert.equal(s.kanon.bauteile.materialVerbraucht,2*parts);
 assert.equal(s.kanon.bauteile.arbeitsGezahlt,8*parts);
 assert.equal(rem.material,matStart+refine*5-parts*2);
 assert.equal(rem.erz,oreStart-refine*10);
 assert.equal(rem.silizium,8-parts);
 assert.equal(money(s),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 good(w,s,'J3 Ende des bezahlbaren Original-W3-Erzbudgets');
 const original=w.canonical(s);
 if(rem.material<2||rem.silizium<1||s.owners.st_nadir.cash<8)reject(w,s,c());
 assert.equal(w.canonical(s),original);
 console.log('J3_J4_ECHTER_MATERIALENGPASS',JSON.stringify(vorgemerkt));
});
