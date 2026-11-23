import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

test('PIR-2b: paid F4 freight is observed but cannot be intercepted by the original follow command',()=>{
 const j=J8.erstellen();j.startenPiraten(true);
 const w=j.weltReferenz();
 assert(j.ausfuehren('buy-st_aldera-frachter').ok);
 assert(j.ausfuehren('buy-st_aldera-miner').ok);
 const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
 const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
 assert(j.ausfuehren('ice-'+m).ok);
 w.advance(j.zustandReferenz(),120);
 assert(j.ausfuehren('freight-'+f).ok);
 const s=j.zustandReferenz(), start=s.tick, snapshots=[];
 for(let i=0;i<=120;i++){
  const target=s.ships[f], cargo=Object.values(target.ladung).reduce((n,q)=>n+q,0);
  const a=w.piratenZielbewertung(s);
  const t=a.kandidaten.find(x=>x.id===f);
  if(cargo>0) assert.notEqual(target.flug.lage,'frei','loaded freight must not be represented as a local free body');
  if(t){
   assert.equal(t.art,'tor');
   assert.equal(t.distanzQuadrat,null);
   assert.equal(t.verfolgbar,false);
   assert.equal(target.flug.lage,'transit');
   const before=w.hash(s);
   const cmd={type:'shipFollow',owner:'piraten',schiff:'pir001',ziel:f,abstand:32000};
   // Read-only flight validation, then public ownership gate. No internal order is issued.
   assert.equal(w.flugKern.pruefen(s,cmd),'Ziel nicht verfügbar');
   const denied=w.execute(s,cmd);
   assert.equal(denied.ok,false);
   assert.match(denied.reason,/NPC-Patrouille/);
   assert.equal(w.hash(s),before);
   snapshots.push({tick:s.tick,elapsed:s.tick-start,cargo,transitRestminuten:t.transitRestminuten,
     referenzwert:t.referenzwert,grund:'Ziel nicht verfügbar'});
  }
  if(i<120)w.advance(s,1);
 }
 assert(snapshots.some(x=>x.cargo===50&&x.transitRestminuten===4));
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.ships[f].owner,'house');
 assert.deepEqual(w.audit(s).fehler,[]);
 assert.equal(s.minted+s.burned,0);
 assert.equal(w.save(w.load(w.save(s))),w.save(s));
 console.log('PIR_2B_F4_INTERCEPT_BOUNDARY '+JSON.stringify({start,contacts:snapshots,feeISK:240,wagesISK:120,hash:w.hash(s)}));
});
