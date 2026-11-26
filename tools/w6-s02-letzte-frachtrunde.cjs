'use strict';
// Offline manager decision only: preserve an actually viable last industrial
// round trip instead of booking another optional ice freight.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {experiment}=require('./w6-s02-vertragsvorsorge.cjs');
const {pruefen}=require('./w6-szenarien.cjs');
const expected=['85030b8df72a12ce','4e2e3657ef684657','f4b785f43855f12e'];
function run(reserve, alternative = null){
  const reasons={},windows=[];
  function permit(w,s,sh){
    const count=k=>reasons[k]=(reasons[k]||0)+1;
    const rest=w.restAktivminuten(s,sh.id);
    const route=w.kern.route(w.rules.world,'aldera','nadir');
    assert.ok(route&&route.zeit>0);
    const w3=2*route.zeit,eis=2*w.rules.w5n.flugMinuten;
    assert.ok(Number.isSafeInteger(eis)&&eis>0);
    const live=Object.values(s.ships).filter(x=>x.owner==='house'&&x.klasse==='frachter'&&!w.stillgelegt(s,x.id));
    const stock=(s.stations.st_aldera.lager.frachter||0)+(s.stations.st_nadir.lager.frachter||0);
    if(rest===null||rest<w3||rest-eis>=w3){count('keineLetzteRunde');return true;}
    if(live.length!==1||stock>0){count('ErsatzVerfuegbar');return true;}
    const original=w.save(s),q=w.load(original);
    const cmd={type:'shipFreightIce',owner:'house',schiff:sh.id};
    const r=w.execute(q,cmd);
    if(!r.ok){
      assert.equal(w.save(q),original);
      count('EisauftragOhnehinAbgelehnt');return true;
    }
    assert.deepEqual(pruefen(w,q),[]);
    assert.equal(w.save(s),original);
    count('realeLetzteEisrunde');
    windows.push({tick:s.tick,id:sh.id,rest,w3,eis,hash:w.hash(s),stock,
      lager:structuredClone({aldera:s.stations.st_aldera.lager,nadir:s.stations.st_nadir.lager}),
      kassen:Object.fromEntries(['house','transport','npc3','werft_extern'].map(k=>[k,s.owners[k].cash])),
      miner:Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner'&&!w.stillgelegt(s,x.id))
        .map(x=>({id:x.id,rest:w.restAktivminuten(s,x.id),system:x.system,phase:x.phase})),
      spedition:Object.values(s.ships).filter(x=>x.owner==='transport'&&x.klasse==='frachter'&&!w.stillgelegt(s,x.id))
        .map(x=>({id:x.id,rest:w.restAktivminuten(s,x.id),system:x.system})),
      angebot:w.industrieAngebotslage(s),verzicht:reserve});
    return !reserve;
  }
  const report=experiment(true,permit,alternative);
  return {report,reasons,windows};
}
module.exports={run};
if(require.main===module){
const a=run(false),b=run(true);
assert.deepEqual(a.report.report.verlauf.map(x=>x.hash),expected);
assert.deepEqual(experiment(true),a.report,'observation alone preserves #645');
assert.deepEqual(run(false),a);
assert.deepEqual(run(true),b);
function summary(x){
  const r=x.report;
  const end=r.report.verlauf.at(-1);
  const first=x.windows[0];
  return {reasons:x.reasons,firstWindow:first??null,lastWindow:x.windows.at(-1)??null,
    windows:x.windows.length,block:r.block,
    followup:first?end.fracht.erz.filter(f=>f.id===first.id&&f.start>=first.tick):[],
    cancellations:r.probes.filter(p=>p.storno).length,
    checkpoints:r.report.verlauf.map(v=>({tag:v.tag,hash:v.hash,produktion:v.produktion,auftraege:v.auftraege,
      gebunden:v.gebunden,ersatz:v.ersatzkaeufe,still:v.stilllegungen.length,live:v.huellen.filter(h=>!h.stillgelegt),
      kassen:Object.fromEntries(['house','transport','npc3','werft_extern','st_aldera','st_nadir'].map(k=>[k,v.kassen[k]])),
      lager:v.lager,aktiveAuftraege:v.aktiveAuftraege}))};
}
for(const x of [a,b])for(const v of x.report.report.verlauf){
  assert.equal(v.weltgeld,33000);assert.equal(v.mint,0);assert.equal(v.burn,0);
}
fs.writeFileSync(process.argv[2]||'w6-letzte-frachtrunde.json',JSON.stringify({seed:42,a,b},null,2)+'\n');
console.log('W6_LETZTE_FRACHTRUNDE '+JSON.stringify({control:summary(a),reserve:summary(b),deterministic:true,controlUnchanged:true}));
}
