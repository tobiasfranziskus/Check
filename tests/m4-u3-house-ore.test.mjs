// M4-U3: original W1 ore acceptance becomes an alternative HOUSE decision.
// No new W3 shipping authority, budgets, coins, goods, or state fields.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const J8=require('../prototypes/verbund/konzern-session.js');
const W5ac=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');

function start(){
 const j=J8.erstellen();
 j.starten195(W5ac.create(42,'private195').export(),true);
 return j;
}
function audit(j){
 const w=j.weltReferenz(),s=j.zustandReferenz();
 assert.equal(w.audit(s).ok,true,JSON.stringify(w.audit(s).fehler));
 assert.deepEqual(pruefen(w,s),[]);
 assert.equal(Object.values(s.owners).reduce((a,o)=>a+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(w.load(j.exportieren()).rulesVersion,204);
 return s;
}
function action(j,id){
 const r=j.ausfuehren(id);
 assert.equal(r.ok,true,id+': '+r.reason);
}
test('M4-U3: paid Aldera ore is independent of ICE and W3, with original W1 receipts and replay',()=>{
 const j=start(),original=j.ansicht().hash;
 assert.equal(original,'674400c1d181fcf2');
 assert.equal(j.angebote().some(o=>o.id.startsWith('ore-')),false,'no foreign ore miner command');
 action(j,'buy-st_aldera-miner');
 const quote=j.angebote().find(o=>o.id==='ore-sh002');
 assert.equal(quote?.ok,true,quote?.reason);
 const before=audit(j),oldSave=j.exportieren(),oldHash=j.ansicht().hash;
 assert.equal(before.owners.house.cash,2400);
 assert.equal(j.angebote().find(o=>o.id==='ore-sh002')?.ok,true);
 assert.equal(j.exportieren(),oldSave,'quote reading must be read-only');
 assert.equal(j.ansicht().hash,oldHash);
 action(j,'ore-sh002');
 assert.equal(j.zustandReferenz().kanon.pendel.sh002.ware,'erz');
 const duplicate=j.ausfuehren('ore-sh002');
 assert.equal(duplicate.ok,false,'no second contract when already active');
 assert.equal(j.ausfuehren('ore-sh001').ok,false,'never sign on a foreign miner');
 let minutes=0,earned=false;
 for(let i=0;i<16;i++){
   j.weiterspielen(60);minutes+=60;
   const s=audit(j);
   if(s.stats.konto.house.erloes>=500 && s.ledger.erz.mined>=50){earned=true;break;}
 }
 const finished=audit(j);
 assert.equal(earned,true,'original 50-ore production must reach a real, paid station sale by 960 minutes');
 assert.ok(finished.stats.konto.house.erloes>=500,'original Aldera purchaser pays company for ore');
 assert.ok(finished.ledger.erz.mined>=50,'ore must be physically mined, not credited');
 assert.ok(finished.ledger.erz.exported>=0);
 assert.equal(finished.w3.abgeschlossen,0,'local W1 sale is not falsely reported as W3 freight');
 assert.equal(finished.ships.sh002.owner,'house');
 assert.ok(finished.owners.house.cash>0);
 const saved=j.exportieren(),copy=J8.erstellen();copy.oeffnen204(saved,true);
 assert.equal(copy.exportieren(),saved);
 assert.equal(copy.ansicht().hash,j.ansicht().hash);
 const replay=start();action(replay,'buy-st_aldera-miner');action(replay,'ore-sh002');
 for(let i=0;i<minutes/60;i++)replay.weiterspielen(60);
 assert.equal(replay.exportieren(),saved,'seed/commands/minutes must replay byte-identically');
 assert.equal(replay.ansicht().hash,j.ansicht().hash);
 console.log('M4_U3_HOUSE_ORE',JSON.stringify({
   minutes,oreMined:finished.ledger.erz.mined,houseRevenue:finished.stats.konto.house.erloes,
   cash:finished.owners.house.cash,hash:j.ansicht().hash
 }));
});

test('M4-U3: depleted Aldera cash blocks original house ore, without tainting older F4 reference',()=>{
 const j=start();
 for(const a of ['buy-st_aldera-miner','buy-st_aldera-frachter','ice-sh002'])action(j,a);
 j.weiterspielen(60);j.weiterspielen(60);
 action(j,'freight-sh003');
 j.weiterspielen(60);j.weiterspielen(60);
 action(j,'freight-sh003');
 j.weiterspielen(60);j.weiterspielen(60);
 assert.equal(j.ansicht().hash,'1df0f18ff779fd4c','non-ore command references unchanged');
 assert.equal(j.zustandReferenz().owners.st_aldera.cash,255);
 action(j,'buy-st_aldera-miner');
 const s=audit(j),own=Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='miner');
 assert.equal(own.length,2);
 const extra=own.find(x=>x.id!=='sh002');
 const quote=j.angebote().find(o=>o.id==='ore-'+extra.id);
 assert.equal(quote?.ok,false);
 assert.match(quote?.reason||'',/Aldera.*Erzcharge.*nicht bezahlen/);
 const json=j.exportieren(),hash=j.ansicht().hash;
 const denied=j.ausfuehren('ore-'+extra.id);
 assert.equal(denied.ok,false);
 assert.equal(j.exportieren(),json,'denial must not change money, cargo, hash or save');
 assert.equal(j.ansicht().hash,hash);
 const forged=JSON.parse(json);
 forged.owners.st_aldera.cash+=500;
 forged.owners.house.cash-=500;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(forged),true),
  'unreceipted account shuffle cannot satisfy funding guard');
});
