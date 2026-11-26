'use strict';
// Same-tick replacement of a proven bad unsigned offer, using only original
// party commands. Offline research; no new rights, money or goods.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./w6-s02-letzte-frachtrunde.cjs');
const {preflight}=require('./w6-s02-vertragsvorsorge.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const expected=['85030b8df72a12ce','4e2e3657ef684657','0fcba572b1065146'];
function experiment(active){
  const attempts=[];
  function fallback(w,s,p){
    assert.equal(s.kanon.industrieErz.phase,'storniert');
    assert.equal(s.w3.auftrag,null);
    const k=s.kanon,original=w.save(s);
    const fr=s.ships[p.frachter];
    assert.ok(fr&&fr.owner==='house');
    // Match the original U7 candidate filters. The original commands
    // additionally validate funding, ownership, route and contract state.
    const candidates=Object.keys(s.ships).sort().map(id=>s.ships[id]).filter(sh=>
      sh.id!==p.miner&&sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'
      &&sh.phase==='dock'&&sh.flug?.lage==='angedockt'
      &&Object.values(sh.ladung).every(n=>n===0)&&!s.erzpilotVertraege?.[sh.id]
      &&!w.stillgelegt(s,sh.id)&&!k.pendel[sh.id]?.beenden
      &&(!k.pendel[sh.id]||k.pendel[sh.id].ware==='erz'));
    // The tie breaker remains canonical ship ID. Rest ranking is a research
    // strategy, not a guarantee; require real successful loading on a copy.
    candidates.sort((a,b)=>(w.restAktivminuten(s,b.id)??Infinity)-(w.restAktivminuten(s,a.id)??Infinity)
      ||(a.id<b.id?-1:a.id>b.id?1:0));
    for(const mi of candidates){
      const commands=[
        {type:'industrialOreOffer',owner:'st_nadir',miner:mi.id,frachter:fr.id},
        {type:'industrialOreAcceptMine',owner:'npc3'},
        {type:'industrialOreAcceptYard',owner:'werft_extern'}
      ];
      const q=w.load(original);
      let failure=null;
      for(const cmd of commands){
        const before=w.save(q),r=w.execute(q,cmd);
        if(!r.ok){assert.equal(w.save(q),before);failure={cmd,reason:r.reason};break;}
      }
      if(failure){attempts.push({tick:s.tick,old:p.miner,new:mi.id,failure});continue;}
      assert.deepEqual(pruefen(w,q),[]);
      const test=preflight(w,q,true);
      assert.ok(test);
      assert.equal(w.save(s),original);
      const entry={tick:s.tick,old:p.miner,new:mi.id,rest:w.restAktivminuten(s,mi.id),
        frachter:fr.id,test,committed:false};
      attempts.push(entry);
      if(test.status!=='ERZ_VERLADEN')continue;
      // The manager's normal step subsequently signs the new offer itself.
      // No active contract is cancelled, no manual state write.
      for(const cmd of commands)assert.equal(w.execute(s,cmd).ok,true);
      assert.equal(w.save(s),w.save(q),'same-tick original commands equal validated copy');
      assert.deepEqual(pruefen(w,s),[]);
      entry.committed=true;
      return;
    }
    assert.equal(w.save(s),original);
  }
  const result=run(true,active?fallback:null);
  return {result,attempts};
}
const a=experiment(false),b=experiment(true);
assert.deepEqual(a.result.report.report.verlauf.map(v=>v.hash),expected);
assert.deepEqual(experiment(false),a,'reference replay');
assert.deepEqual(experiment(true),b,'variant replay');
function summary(x){
 const r=x.result.report, end=r.report.verlauf.at(-1);
 return {attempts:x.attempts.length,accepted:x.attempts.filter(p=>p.committed),
  rejected:x.attempts.filter(p=>!p.committed).slice(0,12),block:r.block,
  cancellations:r.probes.filter(p=>p.storno).length,windows:x.result.windows.length,
  checkpoints:r.report.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,
    auftraege:v.auftraege,gebunden:v.gebunden,ersatz:v.ersatzkaeufe,still:v.stilllegungen.length,
    live:v.huellen.filter(h=>!h.stillgelegt),lager:v.lager,kassen:v.kassen,
    aktiveAuftraege:v.aktiveAuftraege})),
  actualFollowups:x.attempts.filter(p=>p.committed).map(p=>({tick:p.tick,miner:p.new,
    freight:end.fracht.erz.filter(f=>f.id===p.frachter&&f.start>=p.tick).slice(0,1)}))};
}
for(const x of [a,b])for(const v of x.result.report.report.verlauf){
 assert.equal(v.weltgeld,33000);assert.equal(v.mint,0);assert.equal(v.burn,0);
}
fs.writeFileSync(process.argv[2]||'w6-alternativminer.json',JSON.stringify({seed:42,a,b},null,2)+'\n');
console.log('W6_ALTERNATIVMINER '+JSON.stringify({control:summary(a),candidate:summary(b),deterministic:true}));
