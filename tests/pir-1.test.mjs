import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import W from '../prototypes/welt/welt-kern.js';
import J8 from '../prototypes/verbund/konzern-session.js';
import Karte from '../prototypes/spiel/p3-manager-karte.js';
import Wirtschaft from '../tools/pir-wirtschaftsvergleich.cjs';

const standard=()=>W.erstellenJ4c({carrierCash:2000,buyerCash:4000});
function start(){
 const sitzung=J8.erstellen();
 sitzung.startenPiraten(true);
 return {sitzung,w:sitzung.weltReferenz(),s:sitzung.zustandReferenz()};
}

test('PIR-1 bewegt die originale Jägerhülle im gemeinsamen Takt, beobachtet reale Fracht und zahlt Lohn',()=>{
 const {w,s}=start(), normal=standard(), basis=normal.createState(42);
 normal.politikSetzen(basis,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 normal.npcAutoSetzen(basis,true);normal.npcSiliziumSetzen(basis,true);
 const replay=w.load(w.save(s)), startKoerper=structuredClone(s.ships.pir001.flug);
 const phasen=new Set();let tor=false, bewegt=false;
 for(let i=0;i<500;i++){
  w.minute(s);
  phasen.add(s.kanon.piraten.phase);
  bewegt ||= s.ships.pir001.flug.x!==startKoerper.x || s.ships.pir001.flug.y!==startKoerper.y;
  const kontakt=s.kanon.piraten.kontakt;
  if(kontakt?.tick===s.tick){
   const ziel=s.ships[kontakt.id];
   assert.equal(ziel.owner,'transport');assert.equal(ziel.ziel,'st_nadir');
   assert.equal(ziel.phase,'reise');tor=true;
  }
 }
 assert(bewegt&&tor);
 for(const phase of ['auslaufen','patrouille','beobachten','rueckkehr','keinKapital'])assert(phasen.has(phase),phase);
 assert.equal(s.ships.pir001.flug.lage,'angedockt');
 assert.equal(s.owners.pilot_piraten.cash,204);
 assert.equal(s.owners.piraten.cash,36);
 assert.equal(s.owners.k1_flug_pir001.cash,0);
 assert.equal(s.minted+s.burned,0);
 assert.deepEqual(w.audit(s).fehler,[]);
 w.advance(replay,500);
 assert.equal(w.hash(replay),w.hash(s));
 assert.equal(w.hash(w.load(JSON.stringify(JSON.parse(w.save(s))))),w.hash(s));
 normal.advance(basis,500);
 delete basis.kanon.buch.belege;
 assert.equal(w.hash(Wirtschaft.zivilzustand(s)),normal.hash(basis));
});

test('PIR-1 hält Forschungsstände und Befehlsrechte getrennt',()=>{
 const {sitzung,w,s}=start(), text=sitzung.exportieren(), n=J8.erstellen();
 assert.throws(()=>n.oeffnen204(text,true),/PIR-1/);
 assert.throws(()=>n.oeffnenPiraten(text,false),/bestätigen/);
 assert.equal(n.oeffnenPiraten(text,true).hash,w.hash(s));
 assert.equal(sitzung.ansicht().schiffe.length,0);
 const hash=w.hash(s);
 for(const owner of ['house','piraten']){
  assert.equal(w.execute(s,{type:'shipUndock',owner,schiff:'pir001'}).ok,false);
  assert.equal(w.kern.submit(s,{type:'shipWait',owner,schiff:'pir001'},w.rules).ok,false);
 }
 assert.equal(sitzung.flugBefehl({type:'shipUndock',owner:'house',schiff:'pir001'}).ok,false);
 assert.equal(w.hash(s),hash);
 for(const edit of [x=>delete x.kanon.piraten,x=>x.ships.pir001.owner='house',
  x=>x.ships.pir001.system='aldera',x=>delete x.ships.pir001,
  x=>x.queue.push({type:'shipWait',owner:'piraten',schiff:'pir001'}),
  x=>{x.owners.piraten.cash--;x.owners.house.cash++;}]){
  const manipuliert=JSON.parse(text);edit(manipuliert);
  assert.throws(()=>w.load(JSON.stringify(manipuliert)),/Welt ungültig|Vertragsbilanz fehlerhaft/);
 }
});

test('PIR-1 läuft ohne Kapital oder Hülle nicht aus und erschließt keine inaktiven Systeme',()=>{
 const w=W.erstellenPiraten(), s=w.createState(0);
 assert.deepEqual(w.sicherheitslage(s).stufen,{aldera:'sicher',nadir:'umkaempft'});
 const dravos=W.erstellenP8d({carrierCash:2000,buyerCash:4000});
 assert.deepEqual(dravos.sicherheitslage(dravos.createState()).stufen,
  {aldera:'sicher',nadir:'umkaempft',dravos:'gesetzlos'});
 // Negative Laufzeitproben mit absichtlich ungültigen Beständen. Import ist gesperrt.
 const arm=structuredClone(s);
 arm.owners.piraten.cash=0;w.advance(arm,3);
 assert.equal(arm.ships.pir001.flug.lage,'angedockt');assert.equal(arm.owners.pilot_piraten.cash,0);
 const ohne=structuredClone(s);
 delete ohne.ships.pir001;w.advance(ohne,3);
 assert.equal(w.sicherheitslage(ohne).kontakt,null);assert.equal(ohne.ships.pir001,undefined);
 const sicher=structuredClone(s);
 sicher.ships.pir001.system='aldera';sicher.ships.pir001.flug=w.flugKern.koerperAngedockt('aldera');
 w.advance(sicher,3);
 assert.equal(sicher.ships.pir001.flug.lage,'angedockt');assert.equal(sicher.owners.pilot_piraten.cash,0);
});

test('Operationsboard liest Stufe, Piratenkontakt und Patrouillenmeldung aus genau diesem Weltzustand',()=>{
 const {sitzung,w,s}=start();w.advance(s,199);
 const hash=w.hash(s),karte=Karte.auswerten(sitzung.ansicht(),s,w,sitzung.angebote());
 assert.deepEqual(karte.stationen.map(st=>[st.system,st.sicherheit]),[['aldera','Sicher'],['nadir','Umkämpft']]);
 const pirat=karte.fremdeSchiffe.find(sh=>sh.pirat);
 assert.equal(pirat.id,'pir001');assert.equal(pirat.pirat.sicht.id,'sh002');
 assert.deepEqual(pirat.angebote,[]);assert.equal(w.hash(s),hash);
});

test('Eigene bezahlte F4-Route ist nur während tatsächlicher Beobachtung exponiert',()=>{
 const {sitzung:j,w}=start();
 assert(j.ausfuehren('buy-st_aldera-frachter').ok);
 assert(j.ausfuehren('buy-st_aldera-miner').ok);
 const frachter=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
 const miner=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert(j.ausfuehren('ice-'+miner).ok);
 w.advance(j.zustandReferenz(),120);
 assert(j.ausfuehren('freight-'+frachter).ok);
 const s=j.zustandReferenz();w.advance(s,56);
 const karte=Karte.auswerten(j.ansicht(),s,w,j.angebote());
 assert.equal(karte.schiffe.find(sh=>sh.id===frachter).exponiert,true);
 assert.equal(s.kanon.piraten.kontakt.id,frachter);
 w.advance(s,4);
 assert.deepEqual(w.sicherheitslage(s).exponiert,[]);
 w.advance(s,60);
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.deepEqual(w.audit(s).fehler,[]);
});

test('PIR folgt einem legitim gekauften Freiflugjäger und stoppt bei Zielverlust',()=>{
 const w=W.erstellenPiraten(), b=w.createState(42);
 // Testaufbau mit Original-J4c-Kaufbeleg und separatem PIR-Startbestand.
 // Die produktiven Einstiegspfade bieten keine Kombination mit Altsaves an.
 const datei=new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url);
 const s=standard().load(fs.readFileSync(datei,'utf8'));
 for(const id of ['piraten','pilot_piraten'])s.owners[id]=b.owners[id];
 s.ships.pir001=b.ships.pir001;
 s.stats.verkaeufe.pir001=0;
 s.initialSupply=b.initialSupply;
 s.kanon.piraten=b.kanon.piraten;
 assert.deepEqual(w.audit(s).fehler,[]);
 const ziel=s.ships.sh023, cmd={owner:'house',schiff:ziel.id};
 assert(w.execute(s,{...cmd,type:'shipUndock'}).ok);
 w.advance(s,2);
 assert.equal(s.kanon.piraten.phase,'folgen');
 assert.deepEqual(s.ships.pir001.flug.ziel,{art:'schiff',id:ziel.id,abstand:32000});
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
 assert(w.execute(s,{...cmd,type:'shipDock',station:'st_nadir'}).ok);
 w.advance(s,2);
 assert.equal(s.ships.pir001.flug.ziel,null);
 assert.equal(s.kanon.piraten.phase,'beobachten');
 assert.equal(ziel.owner,'house');
 assert.deepEqual(w.audit(s).fehler,[]);
});
