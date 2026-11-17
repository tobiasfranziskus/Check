// W6/P8h: Reproduzierbarer Forschungstest, niemals eine neue Produktregel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const K=require('../prototypes/welt/welt-kern.js');
const W6=require('../tools/w6-szenarien.cjs');
const D=require('../tools/w6-p8h-npc-folgeauftrag.cjs');
const policy=W6.SZENARIEN.find(x=>x.id==='S02').politik;
function audit(w,s){
 const a=w.audit(s);
 assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.deepEqual(W6.pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((n,x)=>n+x.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
}
function original90(){
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42,{politik:policy});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);w.materialSupplySetzen(s,true);
 let gekauft=0;
 for(let t=120;t<=90*1440;t+=120){
   w.advance(s,120);
   if(s.stations.st_nadir.lager.jaeger>0&&s.owners.house.cash>=900&&gekauft<3){
     const k=w.execute(s,{type:'shipBuy',owner:'house',klasse:'jaeger',station:'st_nadir'});
     assert.equal(k.ok,true,k.reason);gekauft++;
   }
 }
 assert.equal(w.hash(s),'ad0f037be40c32fd','Produkt-Referenzhash bleibt ohne P8h identisch');
 assert.equal(s.kanon.jaeger.fertig,2);
 audit(w,s);
 return {w,s};
}
function gegenlauf(w,save){
 let s=w.load(save),begonnen=s.w3.abgeschlossen;
 const belege=[],abgewiesen=[],startTick=s.tick;
 for(let schritt=0;schritt<288;schritt++){
   const p=D.plan(w,s);
   if(p.befehle){
     const r=D.ausfuehren(w,s,p);
     if(r.ok){s=r.zustand;belege.push({tag:(s.tick-startTick)/1440,art:p.art,befehle:r.befehle});}
     else if(!abgewiesen.some(x=>x.art===p.art&&x.grund===r.grund))
       abgewiesen.push({art:p.art,grund:r.grund});
   }else if(p.art==='warten'&&!abgewiesen.some(x=>x.art===p.art&&x.grund===p.grund)){
     abgewiesen.push({art:p.art,grund:p.grund});
   }
   w.advance(s,30);
   if(schritt%8===0)audit(w,s);
   if(s.w3.abgeschlossen>begonnen&&s.kanon.industrieErz?.phase==='geliefert')break;
 }
 audit(w,s);
 return {s,belege,abgewiesen,
   originalW3:begonnen,neueW3:s.w3.abgeschlossen-begonnen,
   produktion:s.kanon.jaeger.fertig,
   schiffe:Object.values(s.ships).filter(sh=>sh.klasse==='frachter'&&sh.owner==='transport'
      &&sh.system==='aldera'&&w.buchwert(s,sh.id)>0).map(sh=>sh.id),
   hash:w.hash(s)};
}
test('P8h: Nur echte 207-Forschung darf den Planer nachfragen; alle Diagnosen unveraenderlich',()=>{
 const w=K.erstellenP8d({carrierCash:2000,buyerCash:4000});
 const s=w.createState(42),vorher=w.save(s);
 const p=D.plan(w,s);
 assert.equal(p.art,'gesperrt');
 assert.equal(w.save(s),vorher);
 const r=D.ausfuehren(w,s,{art:'unbefugt',befehle:[{type:'shipReposition',owner:'transport',schiff:'sh999999'}]});
 assert.equal(r.ok,false);
 assert.equal(w.save(s),vorher);
 audit(w,s);
 const alt=K.erstellenJ4c({carrierCash:2000,buyerCash:4000});
 const old=alt.createState(42);
 assert.equal(D.plan(alt,old).art,'gesperrt');
});

test('P8h: S02×90 original – finanzierte Folge-Disposition mit deterministischem Doppel-Replay',()=>{
 const {w,s}=original90(),ursprung=w.save(s),hash=w.hash(s);
 const plan=D.plan(w,s);
 assert.ok(['bauen','kaufen','ueberfuehren','vertrag','warten'].includes(plan.art),
   'Forschungsentscheidung muss aus einer realen Core-Knappheit entstehen: '+JSON.stringify(plan));
 assert.equal(w.hash(s),hash,'Planung veraendert keinen Geld-/Waren-/Schiffszustand');
 const a=gegenlauf(w,ursprung),b=gegenlauf(w,ursprung);
 assert.equal(a.hash,b.hash,'Gleicher Seed, gleiche Politik und Befehlsfolge');
 assert.deepEqual(a.belege,b.belege);
 assert.deepEqual(a.abgewiesen,b.abgewiesen);
 assert.equal(w.hash(w.load(ursprung)),hash,'alter S02×90-Weltstand bleibt reproduzierbar');
 assert.equal(w.save(s),ursprung,'kein Forschungseingriff in Originalwelt');
 console.log('P8H_FINANZIERTE_NPC_FOLGEDISPOSITION',JSON.stringify({
   sourceHash:hash,finalHash:a.hash,belege:a.belege,
   abgewiesen:a.abgewiesen,neueW3:a.neueW3,
   produktion:a.produktion,fahrbereiteFrachter:a.schiffe,
   worldISK:33000,mint:0,burn:0
 }));
 assert.ok(a.belege.some(x=>x.art==='bauen'||x.art==='kaufen'||x.art==='ueberfuehren'||x.art==='vertrag'),
   'Mindestens ein rechtswirksamer, bezahlter Originalentscheid wird erwartet');
 assert.equal(a.belege.filter(x=>x.art==='bauen').length,1,
   'Keine zweite Frachterhuelle herstellen, waehrend der bezahlte Ersatz unterwegs ist');
 assert.ok(a.neueW3>=1,'Tatsaechlicher weiterer 50-Erz-W3-Vertrag muss abgeschlossen sein');
});
