// B-K9i.2: Ursachenzerlegung einer dauerhaft vollen Eis-Minerladung.
// Derselbe ORIGINAL-HANDEL wird NICHT ausgeführt/verändert, nur seine
// unveränderten Lager-/Kaufkraft-Gates werden lesend nachgerechnet.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const h=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=h.slice(h.indexOf('const m_data_systeme ='),h.indexOf('const m_data_oberflaeche ='));
const {core,rules,handel}=new Function(src+
  ';return {core:m_core_index,rules:m_data_rules.RULES,handel:m_core_handel};')();
const R={...rules,schema:9,rulesVersion:15};
const SEEDS=[1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535];
function inspect(s) {
 const m=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'&&
   x.system==='cyris'&&x.ware==='eis');
 assert(m);
 const station='st_cyris',ware='eis',inventory=s.stations[station].lager[ware]||0;
 const price=core.preis(s,station,ware,R);
 const cap=handel.obergrenze(s,R,station,ware);
 const cash=s.owners[station].cash;
 const room=Math.max(0,cap-inventory);
 const cashUnits=Math.floor(cash/price);
 const actualAffordable=handel.aufnehmbar(s,R,station,ware);
 assert.equal(actualAffordable,Math.min(room,cashUnits));
 const load=m.ladung.eis||0;
 const blocked=load>0&&actualAffordable===0;
 const cause=blocked
  ? room===0 && cashUnits===0?'beides'
    : room===0?'lager_voll':'kunde_ohne_kaufgeld'
  : 'technisch_kaufbar';
 return {id:m.id,load,price,inventory,cap,room,cash,cashUnits,
   affordable:actualAffordable,blocked,cause,
   minerWallet:s.owners.npc3.cash,minerArbeit:m.arbeit,
   workerLine:s.stations[station].linien.find(x=>x.rezept==='r_nahrung')};
}
function create(seed){
 const s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 return core.load(core.save(s),undefined,R);
}
function analyze(seed){
 const s=create(seed),sample={0:inspect(s)};
 const agg={hours:0,loadFull:0,fullBlocked:0,blockedBy:{},neverDeliveredOnceFull:0,
  fullyFundableEvenWhenFull:0,originalIceMined:0,originalIceConsumed:0,
  originalIceStationDelta:0};
 const initMined=s.ledger.eis.mined,initConsumed=s.ledger.eis.consumed;
 const initStation=s.stations.st_cyris.lager.eis;
 let onceFull=false,firstFull=null;
 for(let hour=0;hour<14*24;hour++){
  const x=inspect(s);agg.hours++;
  if(x.load===R.economy.cargo){
   onceFull=true;
   if(firstFull===null)firstFull=hour;
   agg.loadFull++;
   if(x.blocked){agg.fullBlocked++;agg.blockedBy[x.cause]=(agg.blockedBy[x.cause]||0)+1;}
   else agg.fullyFundableEvenWhenFull++;
  }
  core.advance(s,60,R);
  if((hour+1)%24===0){
   const day=(hour+1)/24;
   if([1,2,4,7,14].includes(day))sample[day]=inspect(s);
   assert(core.audit(s).ok);
  }
 }
 const m=inspect(s);
 agg.neverDeliveredOnceFull=onceFull&&m.load===R.economy.cargo?1:0;
 agg.originalIceMined=s.ledger.eis.mined-initMined;
 agg.originalIceConsumed=s.ledger.eis.consumed-initConsumed;
 agg.originalIceStationDelta=s.stations.st_cyris.lager.eis-initStation;
 const result={seed,firstFullHour:firstFull,aggregate:agg,samples:sample,
    hash:core.hash(s)};
 console.log('BK9I_EIS_GATE '+JSON.stringify(result));
 return result;
}
const res=SEEDS.map(analyze);
const all={cases:13,days:14,totalFullHours:res.reduce((n,c)=>n+c.aggregate.loadFull,0),
  blockedFullHours:res.reduce((n,c)=>n+c.aggregate.fullBlocked,0),
  fullWithPositiveAffordability:res.reduce((n,c)=>n+c.aggregate.fullyFundableEvenWhenFull,0),
  alreadyFullOnDay14:res.filter(x=>x.samples[14].load===R.economy.cargo).length,
  causes:{},firstFullHours:res.map(x=>({seed:x.seed,hour:x.firstFullHour})),
  seed7Day4:res.find(x=>x.seed===7).samples[4],
  seed42Day4:res.find(x=>x.seed===42).samples[4]};
for(const c of res)for(const [k,n] of Object.entries(c.aggregate.blockedBy))
 all.causes[k]=(all.causes[k]||0)+n;
console.log('BK9I_EIS_SUMMARY '+JSON.stringify(all));
assert.equal(res.length,13);
assert(all.blockedFullHours<=all.totalFullHours);
