'use strict';
// Node-only observation of the unchanged #639 S02 management path.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {lauf, VERGLEICH} = require('./m4-management-szenarien.cjs');
const {pruefen} = require('./w6-szenarien.cjs');
const [sz, pfad] = VERGLEICH.find(([x]) => x.id === 'S02');
const expected = ['2281d74dd8429a94','a54f47e25d4f7e00','ec3b282367838729'];
const relevant = sh => ['house','transport','npc3'].includes(sh.owner) && ['miner','frachter'].includes(sh.klasse);
const fleet = (w,s) => Object.values(s.ships).filter(relevant).map(sh => ({
  id:sh.id, owner:sh.owner, klasse:sh.klasse, system:sh.system, phase:sh.phase,
  auftrag:sh.auftrag, rest:w.restAktivminuten(s,sh.id), still:w.stillgelegt(s,sh.id),
  ladung:{...sh.ladung}
}));
const stock = s => Object.fromEntries(['st_aldera','st_nadir'].map(id=>[id,{...s.stations[id].lager}]));
const hullStock = s => ['st_aldera','st_nadir'].map(id=>[s.stations[id].lager.miner||0,s.stations[id].lager.frachter||0]);
const snapshot = (w,s) => ({
  tick:s.tick, hash:w.hash(s), huellen:fleet(w,s), lager:stock(s),
  kassen:Object.fromEntries(['house','transport','npc3','st_aldera','st_nadir','werft_extern','export'].map(id=>[id,s.owners[id].cash])),
  angebot:w.industrieAngebotslage(s), treuhand:w.bericht(s).gebunden,
  aktiv:{w3:s.w3.auftrag,eis:s.w5n.frachtauftrag,w4:s.w4.auftrag,w5:s.w5.auftrag,
    minerWerft:s.kanon.minerWerft,transfer:s.w5ac.active},
  engpass:s.kanon.engpass, npcPausen:s.kanon.npc?.pausen
});
const commands = [
  ...['house','transport'].flatMap(owner=>['st_aldera','st_nadir'].map(station=>({type:'shipBuy',owner,station,klasse:'frachter'}))),
  ...['house','npc3'].map(owner=>({type:'shipBuy',owner,station:'st_aldera',klasse:'miner'})),
  {type:'stationBuildShip',owner:'werft_extern',station:'st_nadir'}
];
function probe(w,s) {
  const source=w.save(s);
  const result=commands.map(cmd=>{
    const copy=w.load(source), before=w.save(copy);
    const ids=new Set(Object.keys(copy.ships));
    const r=w.execute(copy,cmd);
    let neu=null, ueberfuehrung=null;
    if(r.ok){
      assert.deepEqual(pruefen(w,copy),[]);
      neu=Object.values(copy.ships).find(sh=>!ids.has(sh.id))?.id??null;
      if(neu&&cmd.klasse==='frachter'&&cmd.station==='st_nadir'){
        const beforeTransfer=w.save(copy);
        const transfer=w.execute(copy,{type:'shipReposition',owner:cmd.owner,schiff:neu});
        if(transfer.ok)assert.deepEqual(pruefen(w,copy),[]);
        else assert.equal(w.save(copy),beforeTransfer,'rejected transfer must be atomic');
        ueberfuehrung={ok:transfer.ok,grund:transfer.reason??null};
      }
    }else assert.equal(w.save(copy),before,'rejected purchase/build must be atomic');
    return {cmd,ok:r.ok,grund:r.reason??null,neu,ueberfuehrung};
  });
  assert.equal(w.save(s),source,'original state unchanged by probes');
  return result;
}
function trace(){
  const events=[], angebote=[], letzte={}, checkpoints=[];
  let previous='', lastReason=null, counts={}, lastWorld=null, lastState=null;
  const observe=(w,s,phase)=>{
    lastWorld=w;lastState=s;
    // Count actual offer reasons only at the original manager decision points.
    if(phase==='vorVerwaltung'){
      const q=w.industrieAngebotslage(s), reason=q.ok?'ANGEBOT_MOEGLICH':q.grund;
      if(reason!==lastReason){angebote.push({tick:s.tick,grund:reason});lastReason=reason;}
    }
    // Record exact ticks of economic completions using the same counters as bericht().
    const now={erz:s.w3.abgeschlossen,eis:s.w5n.frachtAbgeschlossen,
      hausEis:(s.kanon.spielerFrachten?.auftraege||[]).filter(x=>x.end!==null).length,
      wasser:s.w5n.wasserProduziert,material:s.w4.materialErzeugt,
      frachter:s.w5.fertig,miner:s.kanon.minerWerft?.geliefert||0};
    for(const [k,v] of Object.entries(now))if(counts[k]!==undefined&&v!==counts[k])
      letzte[k]={tick:s.tick,vorher:counts[k],nachher:v};
    counts=now;
    const huellen=fleet(w,s);
    const signature=JSON.stringify([huellen.map(x=>[x.id,x.owner,x.klasse,x.still]),hullStock(s)]);
    if(signature!==previous){
      const snap=structuredClone(snapshot(w,s));
      // Real commands on disposable validated state at each observed hull/stock transition.
      snap.proben=probe(w,s);
      events.push(snap);previous=signature;
    }
  };
  const result=lauf(sz,30,42,true,pfad,observe);
  assert.deepEqual(result.verlauf.map(x=>x.hash),expected.slice(0,2));
  assert.ok(lastWorld&&lastState&&lastState.tick===30*1440);
  assert.deepEqual(pruefen(lastWorld,lastState),[]);
  const ende=structuredClone(snapshot(lastWorld,lastState));
  ende.proben=probe(lastWorld,lastState);
  assert.equal(ende.hash,expected[1]);
  return {result,events,angebote,letzte,ende};
}
const control=lauf(sz,90,42,true,pfad);
assert.deepEqual(control.verlauf.map(x=>x.hash),expected);
const a=trace();
const b=trace();
assert.deepEqual(a,b,'minute observation and counterprobes must replay exactly');
assert.deepEqual(a.result.verlauf,control.verlauf.slice(0,2),'instrumented checkpoints must be identical');
const {result,...diagnose}=a;
const report={seed:42,reference:expected,diagnose,checkpoints:control.verlauf};
fs.writeFileSync(process.argv[2]||'w6-s02-folgestillstand.json',JSON.stringify(report,null,2)+'\n');
console.log('W6_S02_FOLGESTILLSTAND '+JSON.stringify({
  reference:expected,letzte:a.letzte,letzteAngebotswechsel:a.angebote.slice(-12),
  events:a.events.map(e=>({tick:e.tick,hash:e.hash,
    live:e.huellen.filter(h=>!h.still).map(h=>[h.id,h.owner,h.klasse,h.rest]),
    lager:e.lager,kassen:e.kassen,angebot:e.angebot,
    proben:e.proben.map(p=>({cmd:p.cmd,ok:p.ok,grund:p.grund,ueberfuehrung:p.ueberfuehrung}))})),
  ende:a.ende,deterministic:true,originalUnchanged:true
}));
