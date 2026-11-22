// Characterization test; passing means the observed stale-offer problem exists.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');

test('AUDIT: unaccepted offered freighter departs, stale offer persists and is still selectable',()=>{
 const original=engpassNach48(),originalJson=original.exportieren();
 const j=J8.erstellen();j.oeffnenU7U8(originalJson,true);
 for(const id of ['stop-sh004','stop-sh005'])assert.equal(j.ausfuehren(id).ok,true);
 for(let n=0;n<240&&!j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok);n++)j.weiterspielen(1);
 assert.ok(j.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok));
 const w=j.weltReferenz(),s=w.load(j.exportieren());
 const offer=structuredClone(s.kanon.industrieErz);
 assert.equal(offer.signFracht,false);
 const departure=w.execute(s,{type:'shipUndock',owner:'house',schiff:'sh003'});
 assert.equal(departure.ok,true,departure.reason);
 assert.notEqual(s.ships.sh003.flug.lage,'angedockt');
 w.advance(s,60);
 assert.notEqual(s.ships.sh003.flug.lage,'angedockt');
 assert.deepEqual(s.kanon.industrieErz,offer,'obsolete unaccepted offer stays unchanged');
 assert.equal(s.w3.auftrag,null);
 assert.deepEqual(pruefen(w,s),[]);
 const resumed=J8.erstellen();resumed.oeffnenU7U8(w.save(s),true);
 assert.ok(resumed.angebote().some(x=>x.id==='industry-accept-sh003'&&x.ok),'unavailable ship remains selectable');
 assert.ok(!resumed.angebote().some(x=>/industry.*(reject|decline|cancel|ablehnen|storno)/i.test(x.id)),'no explicit player rejection path');
 const accepted=resumed.ausfuehren('industry-accept-sh003');
 assert.equal(accepted.ok,true,accepted.reason);
 resumed.weiterspielen(1);
 const after=resumed.zustandReferenz();
 assert.equal(after.w3.auftrag,null,'commit correctly rejects unavailable ship');
 assert.equal(after.kanon.industrieErz.phase,'storniert','failed commit cancels instead of dispatch');
 assert.deepEqual(pruefen(resumed.weltReferenz(),after),[]);
 assert.equal(original.exportieren(),originalJson);
 console.log('U7_STALE_OFFER_CHARACTERIZATION',JSON.stringify({offeredAt:offer.erstellt,tick:after.tick,phase:after.kanon.industrieErz.phase,ship:after.ships.sh003.flug.lage}));
});
