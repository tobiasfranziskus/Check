import assert from 'node:assert/strict';
import test from 'node:test';
import J8 from '../prototypes/verbund/konzern-session.js';

function original(){
  const j=J8.erstellen(); j.startenPiraten(true,'kampf');
  const w=j.weltReferenz(), s=j.zustandReferenz();
  assert(j.ausfuehren('buy-st_aldera-frachter').ok);
  assert(j.ausfuehren('buy-st_aldera-miner').ok);
  const f=j.ansicht().schiffe.find(sh=>sh.klasse==='frachter').id;
  const m=j.ansicht().schiffe.find(sh=>sh.klasse==='miner').id;
  assert(j.ausfuehren('ice-'+m).ok); w.advance(s,120);
  assert(j.ausfuehren('freight-'+f).ok); w.advance(s,56);
  for(let i=0;i<240;i++) w.teilschritt(s);
  w.advance(s,60);
  assert.equal(s.kanon.piraten.kampf.huellen[f],48);
  assert.equal(s.kanon.spielerFrachten.lohn,120);
  assert.equal(s.kanon.spielerFrachten.gebuehr,240);
  assert.equal(s.w5n.eisGeliefert,50);
  assert.equal(s.minted+s.burned,0);
  assert.equal(s.ships[f].owner,'house');
  assert.deepEqual(w.audit(s).fehler,[]);
  return {w,s,f};
}

test('PIR-3b baseline: actual damaged hull remains owned and paid F4 is settled once',()=>{
  const {w,s,f}=original(), json=w.save(s);
  assert.equal(w.save(w.load(json)),json);
  assert.equal(w.hash(s),'aa301a2025e848cb');
  const sum=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  assert.equal(sum,s.initialSupply);
  console.log('PIR_3B_ORIGINAL '+JSON.stringify({id:f,hull:s.kanon.piraten.kampf.huellen[f],worldMoney:sum,hash:w.hash(s)}));
});

test('PIR-3b audit probes distinguish live state invariants from same-session import gate',()=>{
  const {w,s,f}=original(), before=w.save(s);
  const probes=[
    ['heal-only',k=>{k.huellen[f]=96;}],
    ['erase-only',k=>{k.ereignisse=[];}],
    ['erase-both',k=>{k.ereignisse=[];k.huellen={};}],
    ['remove-last-hit-consistently',k=>{k.ereignisse.pop();k.huellen[f]=72;}],
  ];
  const rows=[];
  for(const [name,mutate] of probes){
    const c=structuredClone(s); mutate(c.kanon.piraten.kampf);
    const a=w.audit(c);
    assert.throws(()=>w.load(JSON.stringify(c)),/unveränderte/);
    if(name==='heal-only'||name==='erase-only') assert.equal(a.ok,false);
    // Paired mutations are diagnostic: an accepted live audit is a finding,
    // not a passing security guarantee. Never register these clones with save().
    rows.push({name,liveAuditAccepted:a.ok,errors:a.fehler,externalImportRejected:true});
  }
  assert.equal(w.save(s),before);
  console.log('PIR_3B_AUDIT '+JSON.stringify(rows));
});
