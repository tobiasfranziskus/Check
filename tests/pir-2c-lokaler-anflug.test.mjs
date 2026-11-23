import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

function realContact(){
 const j=J8.erstellen();j.startenPiraten(true);const w=j.weltReferenz();
 assert(j.ausfuehren('buy-st_aldera-frachter').ok);
 assert(j.ausfuehren('buy-st_aldera-miner').ok);
 const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
 const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert(j.ausfuehren('ice-'+m).ok);w.advance(j.zustandReferenz(),120);
 assert(j.ausfuehren('freight-'+f).ok);const s=j.zustandReferenz();w.advance(s,56);
 assert.equal(s.ships[f].ladung.eis,50);
 assert.equal(s.ships[f].flug.lage,'transit');
 assert.equal(s.ships[f].ankunft-s.tick,4);
 return {j,w,s,f};
}

// Isolierte Geometrieprobe am Original-F4-Kontakt. KEIN Welt-Save,
// KEINE wirtschaftliche Zeitfortschreibung, KEIN Produktionspfad.
// Gate-Koordinaten sind Kandidaten, keine behauptete Transitposition.
function probe(w,s,f,x,kurs,folgen){
 const flug=w.flugKern, state=structuredClone(s);
 const sh=state.ships[f], pirate=state.ships.pir001;
 sh.system='nadir';
 sh.flug={...flug.koerperAngedockt('nadir'),x,y:0,kurs,sollKurs:kurs,lage:'frei',anker:null};
 assert(flug.ausfuehren(state,{type:'shipDock',owner:sh.owner,schiff:f,station:'st_nadir'}).ok);
 const command={type:'shipFollow',owner:pirate.owner,schiff:pirate.id,ziel:f,abstand:32000};
 if(folgen)assert(flug.ausfuehren(state,command).ok);
 const steps=(s.ships[f].ankunft-s.tick)*flug.DATEN.schritteJeMinute;
 let dock=null,closest=null,followSteps=0;
 const p0={x:sh.flug.x,y:sh.flug.y};
 for(let i=1;i<=steps;i++){
  flug.schritt(state,flug.DATEN,[f,pirate.id].sort());
  const dx=sh.flug.x-pirate.flug.x,dy=sh.flug.y-pirate.flug.y;
  if(sh.flug.lage==='frei'&&pirate.flug.lage==='frei'){
   const d2=dx*dx+dy*dy;closest=closest===null?d2:Math.min(closest,d2);
  }
  if(pirate.flug.modus==='folgen')followSteps++;
  if(sh.flug.lage==='angedockt'&&dock===null)dock=i;
 }
 assert.equal(sh.ladung.eis,50);
 assert.equal(sh.owner,s.ships[f].owner);
 assert.deepEqual(state.owners,s.owners);
 assert.equal(state.tick,s.tick);
 assert.equal(state.rng,s.rng);
 assert.deepEqual(state.w5n,s.w5n);
 return {gate:x,kurs,folgen,steps,dock,closest,followSteps,
  moved:sh.flug.x!==p0.x||sh.flug.y!==p0.y,
  finalLage:sh.flug.lage,finalFollow:pirate.flug.modus};
}

test('PIR-2c measures local gate-to-dock flight in the existing four-minute F4 window',()=>{
 const {j,w,s,f}=realContact(),before=j.exportieren();
 const rows=[];
 for(const x of [96000,144000,192000,240000,320000])
  for(const kurs of [0,128])
   for(const folgen of [false,true]){
    const a=probe(w,s,f,x,kurs,folgen);
    assert.deepEqual(probe(w,s,f,x,kurs,folgen),a);
    rows.push(a);
   }
 assert(rows.some(x=>x.dock!==null&&x.moved&&x.folgen&&x.followSteps>0));
 assert(rows.some(x=>x.dock===null),'longer approaches must not be reported as successful');
 assert.equal(j.exportieren(),before);
 assert.deepEqual(w.audit(s).fehler,[]);
 console.log('PIR_2C_LOCAL_FLIGHT_MATRIX '+JSON.stringify(rows));
});
