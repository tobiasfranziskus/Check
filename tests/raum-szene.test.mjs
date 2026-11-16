// RAUM-1: Das grafische Raumcockpit ist eine reine Ansicht derselben Regel204-Welt.
// Geprüft wird der tatsächliche Integrationscode (raum-szene.js, raum-grafik.js) gegen den
// unveränderten Original-Weltkern und den real finanzierten Seed42-Beispielstand.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const S=require('../prototypes/raum/raum-szene.js');
const G=require('../prototypes/raum/raum-grafik.js');
const Kurs=require('../prototypes/j4c/patrouille.js');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const original=read('prototypes/j4c/beispiel-jaeger-seed42.json');
const profile=JSON.parse(original).w5ad.profile;
const neu=(json=original)=>{
 const w=W.erstellenJ4c({carrierCash:profile.carrierCash,buyerCash:profile.buyerCash});
 return {w,s:w.load(json)};
};
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const eigentum=s=>Object.fromEntries(Object.values(s.ships).map(sh=>[sh.id,sh.owner]));
const szene=(w,s,id,extra={})=>S.erzeugen(w,s,id,{bojen:Kurs.TORE,...extra});
// Befehl ausschließlich über die Abbildung des Cockpits erzeugen und vom Kern ausführen lassen.
const tun=(w,s,id,aktion,ziel)=>{
 const cmd=S.befehl(w,szene(w,s,id),aktion,ziel);
 assert.ok(cmd,'Cockpit erzeugt einen Kernbefehl für '+aktion);
 return w.execute(s,cmd);
};
const laufen=(w,s,bis,max=40000)=>{
 let n=0;
 while(!bis()){w.teilschritt(s);if(++n>max)throw Error('Ziel nicht erreicht nach '+max+' Schritten');}
 return n;
};
const ERLAUBT=new Set(['shipUndock','shipDock','shipApproach','shipFlyTo','shipSteer','siliconMineStart','siliconSell']);

test('Szene ist eine eingefrorene, nicht mutierende Projektion des finanzierten Weltstands',()=>{
 const {w,s}=neu(),hash=w.hash(s),save=w.save(s);
 const sz=szene(w,s,'sh023');
 assert.equal(sz.regel,204);assert.equal(sz.system,'nadir');assert.equal(sz.jaeger,'sh023');
 assert.equal(sz.aktiv.lage,'angedockt');assert.equal(sz.kasse,s.owners.house.cash);
 assert.equal(sz.weltgeld,33000);
 const arten=sz.objekte.map(o=>o.art);
 assert.equal(arten.filter(a=>a==='station').length,1);
 assert.equal(arten.filter(a=>a==='boje').length,3);
 const feld=S.objekt(sz,'nadir:silizium');
 assert.equal(feld.vorrat,s.kanon.silizium.vorrat);
 assert.deepEqual({x:feld.x,y:feld.y,radius:feld.radius},{x:w.siliziumFeld.x,y:w.siliziumFeld.y,radius:w.siliziumFeld.radius});
 assert.deepEqual(sz.gedockt.map(d=>d.id),['sh021','sh022','sh023']);
 assert.equal(sz.gedockt.every(d=>d.eigen),true);
 assert.equal(sz.objekte.some(o=>o.art==='schiff'),false,'im Dock liegende Schiffe sind keine Flugobjekte');
 assert.ok(Object.isFrozen(sz)&&Object.isFrozen(sz.objekte)&&Object.isFrozen(sz.aktiv)&&Object.isFrozen(sz.objekte[0]));
 S.ziele(sz);S.flotte(s,'sh023');S.aktionen(sz,'st_nadir');S.treffer(sz,S.kamera(0,0,900),800,600,400,300);
 assert.equal(w.hash(s),hash);assert.equal(w.save(s),save);assert.equal(save,original);
});

test('Kein Einstieg ohne auditierte Regel204-Welt, gekauften Jäger und eigenes Schiff',()=>{
 const {w,s}=neu();
 assert.throws(()=>szene(w,{...s,rulesVersion:195},'sh023'),/Regel204/);
 assert.throws(()=>szene(w,s,'sh001'),/eigenes Schiff/);
 assert.throws(()=>szene(w,s,'gibt-es-nicht'),/eigenes Schiff/);
 assert.throws(()=>szene(w,s,'__proto__'),/eigenes Schiff/);
 const ohne=JSON.parse(original);ohne.kanon.jaeger.kaeufe=[];
 assert.throws(()=>szene(w,ohne,'sh023'),/gekaufter Spielerjäger/);
 const billig=JSON.parse(original);billig.kanon.jaeger.kaeufe[0].preis=1;
 assert.throws(()=>szene(w,billig,'sh023'),/gekaufter Spielerjäger/);
});

test('Jäger: Abdocken, Bojenflug mit Autopilot, Handsteuerung und Andocken über vorhandene Kernbefehle',()=>{
 const {w,s}=neu(),vorher=eigentum(s),kasse=s.owners.house.cash;
 const p=Kurs.beginnen(s,'sh023');
 const schritt=()=>{w.teilschritt(s);Kurs.beobachten(p,s);};
 assert.deepEqual(tun(w,s,'sh023','abdocken'),{ok:true,type:'shipUndock'});
 assert.equal(szene(w,s,'sh023').aktiv.reserve,40,'Flugreserve wirklich gebunden');
 assert.equal(s.owners.house.cash,kasse-40);
 while(s.ships.sh023.flug.lage!=='frei')schritt();
 assert.equal(szene(w,s,'sh023',{patrouille:p}).objekte.find(o=>o.id==='boje:0').offen,true);
 for(let i=0;i<3;i++){
  assert.deepEqual(tun(w,s,'sh023','anfliegen','boje:'+i),{ok:true,type:'shipFlyTo'});
  let n=0;while(p.stufe===i){schritt();if(++n>5000)throw Error('Boje '+i+' nicht erreicht');}
  assert.equal(szene(w,s,'sh023',{patrouille:p}).objekte.find(o=>o.id==='boje:'+i).erreicht,true);
 }
 // Handflug per Steuerknüppel: reiner shipSteer, danach Stopp.
 const k=S.knueppel(w,66,0,66);
 assert.deepEqual(k,{kurs:0,fahrt:100},'volle Auslenkung nach rechts = Kurs 0, voller Schub');
 assert.equal(tun(w,s,'sh023','steuern',k).ok,true);
 for(let i=0;i<30;i++)schritt();
 assert.equal(s.ships.sh023.flug.modus,'hand');assert.ok(s.ships.sh023.flug.vx>0);
 assert.equal(tun(w,s,'sh023','stopp').ok,true);
 assert.deepEqual(tun(w,s,'sh023','andocken'),{ok:true,type:'shipDock'});
 let n=0;while(s.ships.sh023.flug.lage!=='angedockt'||s.kanon.flugdienst.sh023){schritt();if(++n>20000)throw Error('nicht angedockt');}
 assert.equal(p.status,'erfolgreich','Patrouille aus echten Flugkoordinaten erfüllt');
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.deepEqual(eigentum(s),vorher);
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 assert.ok(s.owners.house.cash<kasse,'Pilotenlohn wurde bezahlt, kein Gratisflug');
 assert.equal(s.owners.house.cash+s.owners.pilot_house.cash,kasse+neu().s.owners.pilot_house.cash,'Lohn fließt nur house → pilot_house');
 const geladen=w.load(w.save(s));
 assert.equal(w.hash(geladen),w.hash(s));
 assert.deepEqual(szene(w,geladen,'sh023'),szene(w,s,'sh023'));
});

test('Determinismus: gleiches Ergebnis unabhängig von Bildrate, Zeitraffer und Save/Load mitten im Flug',()=>{
 // Befehlsplan in Flugschritten seit Sitzungsbeginn – so wie ihn der Flugschreiber der Sitzung festhält.
 const plan=[[0,'abdocken'],[45,'anfliegen','boje:1'],[160,'anfliegen',{x:-90000,y:140000}],[300,'steuern',{kurs:200,fahrt:60}],
  [380,'ausrichten','st_nadir'],[420,'andocken'],[2400,'abdocken'],[2460,'anfliegen','nadir:silizium'],[2700,'stopp'],[2760,'andocken']];
 const ENDE=5200;
 const spielen=(takt,zwischenspeichern)=>{
  let {w,s}=neu(),schritt=0,i=0,rest=0;const journal=[];
  while(schritt<ENDE){
   while(i<plan.length&&plan[i][0]===schritt){
    const cmd=S.befehl(w,szene(w,s,'sh023'),plan[i][1],plan[i][2]);
    journal.push({schritt,cmd,ok:w.execute(s,cmd).ok});i++;
   }
   const grenze=Math.min(ENDE,i<plan.length?plan[i][0]:ENDE)-schritt;
   const t=takt(rest);rest=t.rest;
   const n=Math.min(t.schritte,grenze);
   for(let k=0;k<n;k++)w.teilschritt(s);
   schritt+=n;
   if(zwischenspeichern&&schritt>=zwischenspeichern){s=w.load(w.save(s));zwischenspeichern=0;}
  }
  return {hash:w.hash(s),save:w.save(s),journal,w,s};
 };
 const a=spielen(()=>({schritte:1,rest:0}));
 const b=spielen(rest=>S.zeitgeber(rest,16.7,60,900));
 let z=7;const zufallDt=()=>{z=(z*1103515245+12345)&0x7fffffff;return 4+z%90;};
 const c=spielen(rest=>S.zeitgeber(rest,zufallDt(),300,900));
 const d=spielen(rest=>S.zeitgeber(rest,33,10,900),1234);
 assert.equal(a.journal.every(e=>e.ok),true,JSON.stringify(a.journal.filter(e=>!e.ok)));
 for(const x of [b,c,d]){assert.equal(x.hash,a.hash);assert.equal(x.save,a.save);assert.deepEqual(x.journal,a.journal);}
 assert.equal(geld(a.s),33000);assert.equal(a.w.audit(a.s).ok,true);
 // Replay ausschließlich aus dem Journal (ohne Cockpit) ergibt denselben Weltstand.
 const {w,s}=neu();let schritt=0;
 for(const e of a.journal){while(schritt<e.schritt){w.teilschritt(s);schritt++;}assert.equal(w.execute(s,e.cmd).ok,e.ok);}
 while(schritt<ENDE){w.teilschritt(s);schritt++;}
 assert.equal(w.save(s),a.save);
});

test('Schiffwechsel nur im Dock derselben Station und ohne Zustandsänderung',()=>{
 const {w,s}=neu(),hash=w.hash(s);
 assert.equal(S.wechselGrund(s,'sh023','sh022'),null);
 assert.equal(S.wechselGrund(s,'sh023','sh021'),null,'Frachter ist wählbar; ob er fliegen darf, entscheidet der Kern');
 assert.match(S.wechselGrund(s,'sh023','sh003'),/selben Dock/);
 assert.match(S.wechselGrund(s,'sh023','sh001'),/eigenes Schiff/);
 assert.match(S.wechselGrund(s,'sh023','sh023'),/bereits/);
 assert.match(S.wechselGrund(s,'sh023','constructor'),/eigenes Schiff/);
 const fl=S.flotte(s,'sh023');
 assert.equal(fl.every(f=>s.ships[f.id].owner==='house'),true);
 assert.equal(fl.find(f=>f.id==='sh022').grund,null);
 assert.equal(w.hash(s),hash);
 assert.equal(tun(w,s,'sh023','abdocken').ok,true);
 assert.match(S.wechselGrund(s,'sh023','sh022'),/andocken/);
 // Der Kern, nicht die Oberfläche, verweigert dem Nadir-Frachter das Abdocken – ohne Nebenwirkung.
 const h2=w.hash(s),r=tun(w,s,'sh021','abdocken');
 assert.equal(r.ok,false);assert.match(r.reason,/bezahlte Schiffe/);assert.equal(w.hash(s),h2);
});

test('Miner: vollständig finanzierte Siliziumrunde im Raumcockpit mit Geld-, Waren- und Eigentumsbilanz',()=>{
 const {w,s}=neu(),vorher=eigentum(s),C=w.rules.j2b;
 const start={house:s.owners.house.cash,pilot:s.owners.pilot_house.cash,station:s.owners.st_nadir.cash,
  lager:s.stations.st_nadir.lager.silizium,vorrat:s.kanon.silizium.vorrat,mined:s.ledger.silizium.mined};
 assert.equal(szene(w,s,'sh022').bergbau.auftrag,null);
 assert.deepEqual(tun(w,s,'sh022','siliziumAuftrag'),{ok:true,type:'siliconMineStart'});
 assert.equal(s.owners.k1_silizium_arbeit.cash,C.charge*C.minutenJeEinheit*C.lohnJeMinute,'Förderlohn vorab gebunden');
 assert.equal(s.owners.k1_silizium_kauf.cash,C.charge*C.preis,'Ankauf vorab von der Station gebunden');
 assert.equal(tun(w,s,'sh022','abdocken').ok,true);
 laufen(w,s,()=>s.ships.sh022.flug.lage==='frei');
 assert.deepEqual(tun(w,s,'sh022','anfliegen','nadir:silizium'),{ok:true,type:'shipFlyTo'});
 laufen(w,s,()=>szene(w,s,'sh022').bergbau.imFeld);
 assert.equal(szene(w,s,'sh022').bergbau.auftrag.gefoerdert<C.charge,true);
 laufen(w,s,()=>s.kanon.silizium.auftrag.gefoerdert===C.charge,200000);
 const mitte=szene(w,s,'sh022');
 assert.equal(mitte.bergbau.auftrag.fertig,true);assert.equal(mitte.bergbau.anBord,C.charge);
 assert.equal(mitte.aktiv.ladung,'silizium: '+C.charge);
 assert.equal(tun(w,s,'sh022','siliziumVerkauf').ok,false,'Verkauf nur physisch am Dock');
 assert.equal(tun(w,s,'sh022','andocken').ok,true);
 laufen(w,s,()=>s.ships.sh022.flug.lage==='angedockt'&&!s.kanon.flugdienst.sh022);
 assert.deepEqual(tun(w,s,'sh022','siliziumVerkauf'),{ok:true,type:'siliconSell'});
 // Waren: Feld → Schiff → Stationslager, nichts erfunden, nichts verloren.
 assert.equal(s.kanon.silizium.vorrat,start.vorrat-C.charge);
 assert.equal(s.ledger.silizium.mined,start.mined+C.charge);
 assert.equal(s.stations.st_nadir.lager.silizium,start.lager+C.charge);
 assert.equal(s.ships.sh022.ladung.silizium,undefined);
 // Geld: Ankauf Station → house, Löhne house → pilot_house, Summe der Welt unverändert.
 assert.equal(s.owners.st_nadir.cash,start.station-C.charge*C.preis);
 const lohn=s.owners.pilot_house.cash-start.pilot;
 assert.equal(s.owners.house.cash,start.house+C.charge*C.preis-lohn);
 assert.equal(s.owners.k1_silizium_arbeit.cash,0);assert.equal(s.owners.k1_silizium_kauf.cash,0);
 assert.equal(geld(s),33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.deepEqual(eigentum(s),vorher);
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 // Erschöpftes Feld: Der Kern lehnt eine weitere Charge ab; keine Gratisware über die Oberfläche.
 if(s.kanon.silizium.vorrat<C.charge){
  const h=w.hash(s),r=tun(w,s,'sh022','siliziumAuftrag');
  assert.equal(r.ok,false);assert.equal(w.hash(s),h);
 }
 const geladen=w.load(w.save(s));assert.equal(w.hash(geladen),w.hash(s));
});

test('Befehlsabbildung erzeugt nur vorhandene, dem Spieler gehörende Kernbefehle',()=>{
 const {w,s}=neu();
 tun(w,s,'sh023','abdocken');laufen(w,s,()=>s.ships.sh023.flug.lage==='frei');
 const sz=szene(w,s,'sh023',{duell:{ziel:{x:720000,y:-288000},zielHp:135,status:'aktiv',projektile:[],gegnerGeschosse:[]}});
 const faelle=[['abdocken'],['andocken'],['stopp'],['steuern',{kurs:17,fahrt:55}],['anfliegen','st_nadir'],['anfliegen','boje:2'],
  ['anfliegen','nadir:silizium'],['anfliegen','drohne'],['anfliegen',{x:12345,y:-6789}],['ausrichten','drohne'],['siliziumAuftrag'],['siliziumVerkauf']];
 for(const [aktion,ziel] of faelle){
  const cmd=S.befehl(w,sz,aktion,ziel);
  assert.ok(ERLAUBT.has(cmd.type),aktion+' → '+cmd.type);
  assert.equal(cmd.owner,'house');assert.equal(cmd.schiff,'sh023');
 }
 assert.deepEqual(S.befehl(w,sz,'anfliegen','st_nadir'),{type:'shipApproach',owner:'house',schiff:'sh023',zielArt:'station',ziel:'st_nadir'});
 assert.equal(S.befehl(w,sz,'anfliegen','unbekannt'),null);
 assert.equal(S.befehl(w,sz,'anfliegen',{x:1.5,y:2}),null);
 assert.equal(S.befehl(w,sz,'steuern',{kurs:'1',fahrt:5}),null);
 assert.equal(S.befehl(w,sz,'geldSchenken'),null);
 assert.deepEqual(S.aktionen(sz,'st_nadir').map(a=>a.id),['anfliegen','andocken','orbit','folgen','aufschalten','loesen']);
 assert.deepEqual(S.aktionen(sz,'drohne').map(a=>a.id),['anfliegen','ausrichten','orbit','folgen','aufschalten','loesen']);
 assert.deepEqual(S.aktionen(sz,null),[]);
});

test('Kamera, Tipp-Treffer, Steuerknüppel und Zeitgeber sind reine, begrenzte Geometrie',()=>{
 const {w,s}=neu(),sz=szene(w,s,'sh023'),k=S.kamera(1000,-2000,900);
 const [px,py]=S.zuBild(k,1000,700,220000,-145000);
 assert.deepEqual(S.zuWelt(k,1000,700,px,py,sz.raumRadius),{x:220000,y:-145000});
 assert.equal(S.treffer(sz,k,1000,700,px+10,py-8),'boje:0','Fingerfläche um kleine Objekte');
 assert.equal(S.treffer(sz,k,1000,700,px+90,py+90),null);
 assert.equal(S.kamera(0,0,1).massstab,S.ZOOM.min);assert.equal(S.kamera(0,0,1e9).massstab,S.ZOOM.max);
 assert.deepEqual(S.zuWelt(S.kamera(0,0,9000),100,100,1e7,50,sz.raumRadius),{x:sz.raumRadius,y:0});
 // Boje innerhalb eines Feldes hat Vorrang vor der großen Feldfläche.
 const weit=S.kamera(700000,-470000,2400),f=S.objekt(sz,'nadir:silizium');
 const [fx,fy]=S.zuBild(weit,1000,700,f.x,f.y);
 assert.equal(S.treffer(sz,weit,1000,700,fx+30,fy+20),'nadir:silizium');
 assert.equal(S.knueppel(w,3,-4,66),null,'Totzone');
 assert.equal(S.knueppel(w,0,50,66).kurs,64);assert.equal(S.knueppel(w,-50,0,66).kurs,128);assert.equal(S.knueppel(w,0,-50,66).kurs,192);
 for(const [dx,dy] of [[66,0],[10,9],[-200,300],[5,-13]]){
  const v=S.knueppel(w,dx,dy,66);
  assert.ok(Number.isSafeInteger(v.kurs)&&v.kurs>=0&&v.kurs<=255&&v.fahrt>=5&&v.fahrt<=100&&v.fahrt%5===0);
 }
 let rest=0,summe=0;
 for(let i=0;i<600;i++){const t=S.zeitgeber(rest,1000/60,60,900);rest=t.rest;summe+=t.schritte;}
 assert.ok(Math.abs(summe-600)<=1,'60× über 10 s ≈ 600 Flugschritte, gezählt '+summe);
 assert.equal(S.zeitgeber(0,5000,300,900).schritte,75,'lange Pausen werden auf 250 ms begrenzt');
 assert.deepEqual(S.zeitgeber(0,250,300000,900),{schritte:900,rest:0});
 assert.deepEqual(S.zeitgeber(NaN,NaN,10,900),{schritte:0,rest:0});
});

test('Grafik ist dekorativ: Modelle für alle Kernklassen, eigener fester Zufall, kein Core-RNG',()=>{
 const {w}=neu();
 for(const klasse of Object.keys(w.flugKern.DATEN.klassen)){
  assert.ok(G.MODELLE[G.KLASSE_MODELL[klasse]],'Modell für '+klasse);
  assert.ok(G.modellRadius(klasse)>10);
  assert.ok(G.teile(klasse,'#fff').length>4);
 }
 const a=G.zufall(42),b=G.zufall(42);
 assert.deepEqual([a(),a(),a()],[b(),b(),b()]);
 assert.equal(G.textSeed('nadir:silizium'),G.textSeed('nadir:silizium'));
 for(const datei of ['raum-szene.js','raum-grafik.js','raum-cockpit.js']){
  const text=read('prototypes/raum/'+datei);
  assert.doesNotMatch(text,/Math\.random|\.rng\b|localStorage|indexedDB|fetch\(|XMLHttpRequest|getContext\(\s*['"](?!2d)/,datei);
  assert.doesNotMatch(text,/\.cash\s*[-+]?=[^=]|\.owner\s*=[^=]|\.ladung\.[a-z]+\s*[-+]?=[^=]|minted|burned/,datei+' bucht nichts');
 }
 assert.doesNotMatch(read('prototypes/raum/raum-szene.js'),/document|performance|Date\b|setTimeout|requestAnimationFrame/);
});

test('Sitzung: alle Ansichten nutzen einen Befehls- und einen Zeitschrittweg',()=>{
 const app=read('prototypes/j4c/app.js'),html=read('prototypes/j4c/index.html');
 assert.equal(app.split('welt.execute(').length-1,1,'genau ein Befehlsweg (weltBefehl)');
 assert.equal(app.split('.teilschritt(').length-1,1,'genau ein Zeitschrittweg (weltSchritte)');
 assert.ok(app.includes("fetch('beispiel-jaeger-seed42.json'")&&app.includes('laden(json,false)'));
 assert.doesNotMatch(read('prototypes/raum/raum-cockpit.js'),/\.execute\(|\.teilschritt\(|\.minute\(|\.advance\(|\.load\(/,'Cockpit ruft den Kern nie direkt');
 const folge=['../welt/welt-kern.js','konzern-lage.js','../raum/raum-szene.js','../raum/raum-grafik.js','../raum/raum-cockpit.js','app.js']
  .map(src=>html.indexOf('<script src="'+src+'"></script>'));
 assert.equal(folge.every((p,i)=>p>0&&(i===0||p>folge[i-1])),true,'Skriptreihenfolge');
 for(const id of ['ansicht-raum','raumbereich','raum-leinwand','raum-ersatz','raum-knueppel','raum-start','raum-export','raum-konzern','raum-ziele'])
  assert.ok(html.includes('id="'+id+'"'),id);
 for(const id of ['spielbereich','konzernbereich','ansicht-cockpit','ansicht-konzern','beispiel','datei','export','play','abdocken','andocken','duell-start','patrouille-start'])
  assert.ok(html.includes('id="'+id+'"'),'bestehende Bedienung bleibt: '+id);
 assert.ok(fs.existsSync(path.join(root,'prototypes/raum/raum.css')));
});
