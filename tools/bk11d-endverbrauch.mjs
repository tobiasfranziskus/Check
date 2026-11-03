// B-K11d [ANALYSE]: Quelle/Empfaenger/Liquiditaet des realen zivilen Endverbrauchs.
// ausschliesslich Entwicklerwerkzeug: Original-core auf b4e604d6, kein Product-Mint/Transfer.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {independentlyAudit} from './b5b-common.mjs';

const SHA256=x=>createHash('sha256').update(x).digest('hex');
const mainSha='b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c';
const mainHtmlSha='7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal(SHA256(html),mainHtmlSha,'nur Original-main, keine Produkt- oder Regelvarianten');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
assert(original.startsWith('const m_data_systeme =') && original.includes('const m_core_index ='));
const replaceOnce=(src,search,replacement)=>{
  assert.equal(src.split(search).length,2,'genau ein Core-Messpunkt: '+search.slice(0,70));
  return src.replace(search,replacement);
};
let observed=replaceOnce(original,
  'const n = Math.min(da, bedarf[ware]);\n      st.lager[ware] = da - n; state.ledger[ware].consumed += n;',
  'const n = Math.min(da, bedarf[ware]);\n      const cashBefore=state.owners[id].cash;\n      st.lager[ware] = da - n; state.ledger[ware].consumed += n;\n      if(watch)watch.consume(state,id,ware,n,da,cashBefore);');
observed=replaceOnce(observed,
  'st.lager[ware] = anzahl(st.lager, ware) + r.aus[ware]; state.ledger[ware].produced += r.aus[ware];',
  'st.lager[ware] = anzahl(st.lager, ware) + r.aus[ware]; state.ledger[ware].produced += r.aus[ware]; if(watch)watch.production(state,id,ware,r.aus[ware]);');
observed=replaceOnce(observed,
  'if (!reicht) return false;\n  const d = kauf ? menge : -menge;',
  'if (!reicht) return false;\n  if(watch&&!kauf)watch.delivery(state,schiff,station,ware,menge,wert,fee);\n  const d = kauf ? menge : -menge;');
const create=(src,watch)=>new Function('watch',src+';return {core:m_core_index,rules:m_data_rules.RULES};')(watch);
const pure=create(original,null);
assert.equal(pure.rules.schema,8);assert.equal(pure.rules.rulesVersion,14);
const args=process.argv.slice(2);
assert(args.every(x=>/^--(scenario|seed|days|out)=/.test(x)));
const opt=(k,d)=>args.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3)??d;
const scenario=opt('scenario','miner'),seed=Number(opt('seed','42'));
const days=Number(opt('days','90')),out=opt('out','/tmp/bk11d.json');
assert(['passive','miner','handel-flotte'].includes(scenario));
assert(Number.isSafeInteger(seed)&&seed>0);
assert(Number.isSafeInteger(days)&&days>=1&&days<=90);
const TYPES=['nahrung','medikamente'];
const sum=o=>Object.values(o||{}).reduce((n,k)=>n+k,0);
const stationKeys=Object.keys(pure.rules.world.stations).sort();
class Observer {
  constructor(){
    this.consumed={nahrung:0,medikamente:0};
    this.produced={nahrung:0,medikamente:0};
    this.delivered={nahrung:0,medikamente:0};
    this.purchasePaid={nahrung:0,medikamente:0};
    this.deliveryFees={nahrung:0,medikamente:0};
    this.stations=Object.fromEntries(stationKeys.map(id=>[id,{
      consumed:{nahrung:0,medikamente:0},produced:{nahrung:0,medikamente:0},
      deliveries:{nahrung:0,medikamente:0},paidPurchases:0,
      fullHours:0,emptyHours:0,
      hours:0
    }]));
    this.events=0;
  }
  consume(s,id,ware,n,stockBefore,cashBefore){
    if(!TYPES.includes(ware))return;
    assert.equal(s.owners[id].cash,cashBefore,'Endverbrauch bucht keine Zahlung');
    assert(n>=0 && n<=stockBefore);
    const st=this.stations[id];
    assert(st,'Endverbrauch nur auf bekannter Station');
    this.consumed[ware]+=n;st.consumed[ware]+=n;this.events++;
    const demand=pure.rules.world.stations[id].verbrauch[ware]||0;
    if(demand>0){
      if(n===demand)st.fullHours++;
      if(n===0)st.emptyHours++;
      st.hours++;
    }
  }
  production(s,id,ware,n){
    if(!TYPES.includes(ware))return;
    assert(n>0&&Number.isSafeInteger(n));
    this.produced[ware]+=n;
    this.stations[id].produced[ware]+=n;
  }
  delivery(s,sh,station,ware,n,price,fee){
    if(!TYPES.includes(ware))return;
    assert(n>0&&n<=sh.ladung[ware]);
    assert(s.owners[station].cash>=price,'echte Station zahlt reale Ware');
    this.delivered[ware]+=n;this.purchasePaid[ware]+=price;this.deliveryFees[ware]+=fee;
    this.stations[station].deliveries[ware]+=n;
    this.stations[station].paidPurchases+=price;
  }
}
const watcher=new Observer(),{core,rules}=create(observed,watcher);
assert.equal(rules.schema,pure.rules.schema);
const state=core.createState(seed,rules),reference=pure.core.createState(seed,pure.rules);
assert.equal(core.hash(state),pure.core.hash(reference));
let initialSupply=state.initialSupply;
const cmdPlan=()=>{
  if(scenario==='passive')return [];
  const ships=Object.values(state.ships).filter(s=>s.owner==='house').sort((a,b)=>a.id.localeCompare(b.id));
  const miner=ships.find(s=>s.klasse==='miner'),freighter=ships.find(s=>s.klasse==='frachter');
  assert(miner&&freighter);
  return [{type:'shipMine',owner:'house',schiff:miner.id,ware:'erz'},
    ...(scenario==='handel-flotte'?[{type:'shipHandeln',owner:'house',schiff:freighter.id}]:[])];
};
const commands=cmdPlan(),hours=rules.economy.stunde;
const snap=(s,day)=>({
  day,hash:core.hash(s),playerCash:s.owners.house.cash,
  traderCash:s.owners.npc1.cash+s.owners.npc2.cash,
  stationCash:stationKeys.reduce((n,id)=>n+s.owners[id].cash,0),
  alderaCash:s.owners.st_aldera.cash,alderaFundCash:s.owners.fonds_aldera.cash,
  minted:s.minted,burned:s.burned,supply:s.initialSupply+s.minted-s.burned,
  shortages:stationKeys.reduce((n,id)=>n+sum(s.stats.mangel[id]),0),
  food:{produced:s.ledger.nahrung.produced,consumed:watcher.consumed.nahrung,
    imported:s.ledger.nahrung.imported,initial:s.ledger.nahrung.initial},
  medicine:{produced:s.ledger.medikamente.produced,consumed:watcher.consumed.medikamente,
    imported:s.ledger.medikamente.imported,initial:s.ledger.medikamente.initial},
  npcFreighters:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner)).length,
  siliconAldera:s.stations.st_aldera.lager.silizium||0,
  partsAldera:s.stations.st_aldera.lager.bauteil||0,
  cashReceipts:watcher.purchasePaid
});
let hourlyAudits=0,roundtrips=0;
const daily=[],checkpoints=[];
for(let t=1;t<=days*1440;t++){
  if(t===1)for(const cmd of commands){
    const a=core.submit(state,cmd,rules),b=pure.core.submit(reference,cmd,pure.rules);
    assert(a.ok&&b.ok,JSON.stringify({a,b,cmd}));
  }
  const a=core.step(state,rules),b=pure.core.step(reference,pure.rules);
  assert.deepEqual(a,b);
  if(t%hours===0){
    assert(core.audit(state).ok&&pure.core.audit(reference).ok);
    independentlyAudit(state);independentlyAudit(reference);
    assert.equal(core.hash(state),pure.core.hash(reference),'unveränderter Core-Hash mit Beobachter');
    for(const ware of TYPES){
      assert.equal(watcher.consumed[ware],state.ledger[ware].consumed,
        'nur zivil tatsächlich verbrauchtes '+ware+' wird gezählt');
      assert.equal(watcher.produced[ware],state.ledger[ware].produced,
        'Produktion aller Erzeugnisse '+ware+' vollständig belegt');
      assert(watcher.delivered[ware]>=0);
    }
    hourlyAudits++;
  }
  if(t%1440===0){
    const x=snap(state,t/1440);daily.push(x);
    if([1,7,14,30,60,90].includes(x.day))checkpoints.push(x);
    for(const [s,c,r] of [[state,core,rules],[reference,pure.core,pure.rules]]){
      const copy=c.load(c.save(s),undefined,r);
      assert.equal(c.hash(copy),c.hash(s));
      independentlyAudit(copy);roundtrips++;
    }
  }
}
assert.equal(hourlyAudits,24*days);assert.equal(roundtrips,2*days);
assert.equal(state.initialSupply,initialSupply);
if(days===90&&seed===42&&scenario!=='passive'){
  const hashExpected=scenario==='miner'?'f733a993164a5e4f':'3a2df2b5d77d2e9e';
  assert.equal(core.hash(state),hashExpected,'historischer main-90d-Produkt-Endhash');
}
const bounds={};
for(const ware of TYPES){
  const l=state.ledger[ware],n=watcher.consumed[ware];
  const lower=Math.max(0,n-l.initial-l.imported);
  const upper=Math.min(n,l.produced);
  assert(lower<=upper,'garantierte neu produzierte Verbrauchs-Untergrenze');
  bounds[ware]={
    initial:l.initial,produced:l.produced,imported:l.imported,exported:l.exported,
    consumed:n,delivered:watcher.delivered[ware],
    paidRealStationPurchases:watcher.purchasePaid[ware],
    realSalesFees:watcher.deliveryFees[ware],
    guaranteedNewConsumptionLower:lower,possibleNewConsumptionUpper:upper,
    baseValue:rules.economy.waren[ware].basis,
    notionalGuaranteedNewValue:lower*rules.economy.waren[ware].basis,
    notionalPossibleNewValue:upper*rules.economy.waren[ware].basis,
    actualConsumerPayments:0
  };
}
const byStation=Object.fromEntries(stationKeys.map(id=>[id,{
  ...watcher.stations[id],cashAtEnd:state.owners[id].cash,
  ownProductionVersusConsumption:Object.fromEntries(TYPES.map(w=>[w,{
    produced:watcher.stations[id].produced[w],
    consumed:watcher.stations[id].consumed[w],
    delivered:watcher.stations[id].deliveries[w]}]))
}]));
const result={base:mainSha,htmlSha256:mainHtmlSha,scenario,seed,days,
  hourAudits:hourlyAudits,saveLoads:roundtrips,observedEvents:watcher.events,
  bounds,byStation,checkpoints,daily,final:daily.at(-1)};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('BK11D_RESULT '+JSON.stringify({scenario,seed,days,hourAudits:hourlyAudits,
  saveLoads:roundtrips,bounds,
  final:{day:days,hash:result.final.hash,shortages:result.final.shortages,
    playerCash:result.final.playerCash,stationCash:result.final.stationCash,
    traderCash:result.final.traderCash,npcFreighters:result.final.npcFreighters},
  day14:checkpoints.find(x=>x.day===14),byStation}));
console.log('BK11D_PASS '+JSON.stringify({scenario,seed,days,hash:result.final.hash}));
