import assert from 'node:assert/strict';
import test from 'node:test';
import W from '../prototypes/welt/welt-kern.js';

function start(w=W.erstellenPiratenAnflug()){
 const s=w.createState(42);
 w.politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}});
 w.npcAutoSetzen(s,true);w.npcSiliziumSetzen(s,true);
 const command=cmd=>w.execute(s,{owner:'house',...cmd});
 assert(command({type:'shipBuy',station:'st_aldera',klasse:'frachter'}).ok);
 assert(command({type:'shipBuy',station:'st_aldera',klasse:'miner'}).ok);
 const f=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='frachter').id;
 const m=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
 assert(command({type:'shipShuttle',schiff:m,ware:'eis'}).ok);
 w.advance(s,120);
 assert(command({type:'shipFreightIce',schiff:f}).ok);
 w.advance(s,56);
 return {w,s,f,command};
}
test('PIR-2d: actual F4 arrives locally and settles the original paid round trip',()=>{
 const {w,s,f,command}=start(),ship=s.ships[f],p=s.ships.pir001;
 assert.equal(s.kanon.piraten.profil,2);
 assert.equal(ship.system,'nadir');assert.equal(ship.flug.lage,'frei');
 assert.equal(ship.flug.x,144000);assert.equal(ship.ladung.eis,50);
 assert.equal(s.owners.w5n_fracht_arbeit.cash,64);
 assert.equal(s.kanon.spielerFrachten.gebuehr,0);
 assert.equal(s.kanon.spielerFrachten.auftraege.at(-1).geliefert,null);
 const t=w.piratenZielbewertung(s).kandidaten.find(x=>x.id===f);
 assert.equal(t.art,'nah');assert.equal(t.verfolgbar,true);assert(t.distanzQuadrat>0);
 assert.equal(p.flug.ziel?.id,f);
 assert.deepEqual(w.audit(s).fehler,[]);
 const export0=w.save(s),replay=w.load(export0);
 const denied=command({type:'shipSteer',schiff:f,kurs:0,fahrt:100});
 assert.equal(denied.ok,false);assert.equal(w.save(s),export0);
 w.teilschritt(s);assert.notEqual(ship.flug.vx,0);
 assert.deepEqual(w.audit(s).fehler,[]);
 const middle=w.save(s);assert.equal(w.save(w.load(middle)),middle);
 w.teilschritt(replay);
 w.advance(s,3);w.advance(replay,3);
 assert.equal(w.save(s),w.save(replay));
 assert.equal(ship.flug.lage,'angedockt');
 assert.equal(ship.ladung.eis,50);
 assert.equal(s.kanon.spielerFrachten.auftraege.at(-1).geliefert,null);
 w.advance(s,1);w.advance(replay,1);
 assert.equal(w.hash(s),w.hash(replay));
 assert.equal(s.kanon.spielerFrachten.auftraege.at(-1).geliefert,180);
 w.advance(s,60);w.advance(replay,60);
 assert.equal(w.save(s),w.save(replay));
 assert.equal(s.kanon.spielerFrachten.gebuehr,240);
 assert.equal(s.kanon.spielerFrachten.lohn,120);
 assert.equal(s.ships[f].owner,'house');
 assert.equal(s.ships[f].system,'aldera');
 assert.deepEqual(w.audit(s).fehler,[]);
 assert.equal(s.minted+s.burned,0);
 console.log('PIR_2D_PAID_LOCAL_F4 '+JSON.stringify({arrival:180,return:s.tick,fee:240,wage:120,hash:w.hash(s)}));
});

test('PIR-2d: no forged dock, profile conversion or premature settlement',()=>{
 const {w,s,f}=start(), original=w.save(s);
 const v=JSON.parse(original);v.ships[f].flug=w.flugKern.koerperAngedockt('nadir');
 assert.throws(()=>w.load(JSON.stringify(v)),/ungültig|Vertragsbilanz/);
 const prof=JSON.parse(original);prof.kanon.piraten.profil=1;
 assert.throws(()=>w.load(JSON.stringify(prof)));
 assert.throws(()=>W.erstellenPiraten().load(original));
 assert.throws(()=>W.erstellenJ4c({carrierCash:2000,buyerCash:4000}).load(original));
 assert.throws(()=>w.load(W.erstellenPiraten().save(W.erstellenPiraten().createState(42))));
 const bad=w.load(original);w.advance(bad,3);
 // Fault injection: forced halt away from the dock. No public order permits it.
 bad.ships[f].flug={...w.flugKern.koerperAngedockt('nadir'),x:144000,lage:'frei',anker:null};
 const owners=structuredClone(bad.owners),ledger=structuredClone(bad.ledger),contract=structuredClone(bad.w5n);
 assert.throws(()=>w.minute(bad),/keine Frachtannahme/);
 assert.equal(bad.tick,179);
 assert.deepEqual(bad.owners,owners);assert.deepEqual(bad.ledger,ledger);assert.deepEqual(bad.w5n,contract);
 assert.equal(w.save(s),original);
});
