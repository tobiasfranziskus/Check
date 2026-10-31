// B8d - Kausaler Einzelversuch: EIN real gekaufter NPC3-Frachter, zwei Materialrunden.
// Kein Produktpatch. Einzige Variante ist 1 vor dem ersten Warenverkauf gebuchter,
// real finanzierter, zweckgebundener Stationsauftrag aus neutraler Meridian-Kasse.
// Das ist eine identifizierte EINZEL-Gegenprobe, KEINE freigegebene Insolvenzregel.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2), opt=(k,def)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??def;
assert(args.every(x=>/^--(mode|days|out)=/.test(x)));
const mode=opt('mode','control'),days=Number(opt('days','90')), seed=42;
assert(['control','ship-only','procurement'].includes(mode));
assert([18,90].includes(days));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('<script>')+8,end=html.indexOf('const m_data_oberflaeche');
assert(start>=8&&end>start);
const source=html.slice(start,end);
const hash256=s=>createHash('sha256').update(s).digest('hex');
assert.equal(hash256(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const loadCore=()=>new Function(source+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const a=loadCore(), b=loadCore();
assert.equal(a.rules.rulesVersion,14);
const s=a.core.createState(seed,a.rules),t=b.core.createState(seed,b.rules);
const commands=[
 {tick:1,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:true}},
 {tick:2,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'nahrung',menge:1,kauf:false}},
 {tick:3,cmd:{owner:'house',type:'shipTrade',schiff:'sh002',ware:'frachter',menge:1,kauf:true}},
 {tick:4,cmd:{owner:'house',type:'shipActivate',schiff:'sh002',klasse:'frachter'}},
 {tick:5,cmd:{owner:'house',type:'shipMine',schiff:'sh001',ware:'erz'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh002'}},
 {tick:5,cmd:{owner:'house',type:'shipHandeln',schiff:'sh029'}}
];
const intervention=mode!=='control';
const META=()=>({stage:'start',ship:null,round:1,events:[],slot:null,
  invoices:0,invoiceAmount:0,invoiceSeller:null,firstSold:0,secondSold:0,attemptedSecond:false,
  hullCount:0,hullPaid:0,transferred:0,failed:null});
const m=META(),n=META();
const log=(world,meta,name,extra={})=>{
 meta.events.push({tick:world.tick,event:name,cashNPC3:world.owners.npc3.cash,
   cashCyris:world.owners.st_cyris.cash,cashMeridian:world.owners.st_meridian.cash,...extra});
};
function submit(core,world,cmd){const res=core.submit(world,cmd,core===a.core?a.rules:b.rules);
 assert(res.ok,'B8d validierter Kernbefehl '+JSON.stringify(cmd)+' '+JSON.stringify(res));
 return res;
}
function before(world,env,meta){
 if(!intervention)return;
 const c=env.core,r=env.rules;
 if(world.tick===14*1440 && meta.stage==='start'){
   assert(!Object.values(world.ships).some(x=>x.owner==='npc3'&&x.klasse==='frachter'),'NPC3 startet ohne Frachter');
   meta.slot=world.sollflotte.npc3.length;
   world.sollflotte.npc3.push({klasse:'frachter',heimat:'veldra',ware:'material',auftrag:'halten'});
   meta.stage='await-hull';
   log(world,meta,'corporate-investment-intent',{shipyard:world.stations[r.world.werft].lager.frachter||0});
 }
 const ship=meta.ship?world.ships[meta.ship]:null;
 if(!ship)return;
 if(meta.stage==='at-source' && ship.phase==='dock'&&ship.system==='veldra'){
   submit(c,world,{owner:'npc3',type:'shipTrade',schiff:ship.id,ware:'material',menge:7,kauf:true});
   meta.stage='buy-sent';log(world,meta,'real-purchase-submitted',{round:meta.round});
 }else if(meta.stage==='loaded'&&ship.phase==='dock'&&ship.system==='veldra'){
   submit(c,world,{owner:'npc3',type:'shipMove',schiff:ship.id,ziel:'st_cyris'});
   meta.stage='inbound';log(world,meta,'real-loaded-travel-submitted',{round:meta.round,cargo:ship.ladung.material||0});
 }else if(meta.stage==='inbound'&&ship.phase==='reise'&&ship.ankunft===world.tick+1
      &&mode==='procurement'&&meta.round===1&&!meta.invoices){
   // Nur identifiziertes Gegenbeispiel: neutraler Auftrag finanziert bezahlte
   // Lieferung. Kein Mint, keine individuelle Rettungsregel, kein wiederholter Auftrag.
   const qty=ship.ladung.material||0;
   const price=c.preis(world,'st_cyris','material',r);
   const due=qty*price;
   const cover=Math.max(0,due-world.owners.st_cyris.cash);
   assert.equal(qty,7,'auftragsbezogene physisch transportierte Materialmenge');
   assert(cover>0,'Kontrollbarriere vorhanden');
   assert(world.owners.st_meridian.cash>=cover,'Meridian neutraler Auftraggeber ausreichend liquide');
   world.owners.st_meridian.cash-=cover;
   world.owners.st_cyris.cash+=cover;
   meta.transferred+=cover;meta.invoiceAmount=due;meta.invoiceSeller=ship.owner;meta.invoices++;
   log(world,meta,'one-real-isk-transfer-to-pay-material-delivery',{cover,due,qty,price});
 }else if(meta.stage==='return'&&ship.phase==='dock'&&ship.system==='cyris'){
   submit(c,world,{owner:'npc3',type:'shipMove',schiff:ship.id,ziel:'st_veldra'});
   meta.stage='back';log(world,meta,'second-cycle-return-submitted');
 }
}
function after(world,env,meta){
 if(!intervention)return;
 const shipList=Object.values(world.ships).filter(x=>x.owner==='npc3'&&x.klasse==='frachter');
 if(meta.stage==='await-hull'&&shipList.length){
   assert.equal(shipList.length,1);
   const sh=shipList[0];
   meta.ship=sh.id;meta.hullCount++;
   // EIN Huelle. Rest der Original-Sollflotte unveraendert, ohne Folge-Neukauf.
   assert.equal(world.sollflotte.npc3.length,meta.slot+1);
   world.sollflotte.npc3.pop();
   meta.stage='at-source';
   const originalShipCost=world.stats.indienst.npc3?.frachter||0;
   assert(originalShipCost>=1,'reale Inbetriebnahme aus Original-Werftpfad');
   log(world,meta,'real-shipyard-acquisition',{ship:sh.id,inService:originalShipCost});
 }
 const ship=meta.ship?world.ships[meta.ship]:null;
 if(!ship){
   if(meta.ship&&!['lost','failed'].includes(meta.stage)){
     meta.stage='lost';meta.failed='real-ship-lost';log(world,meta,'pirate-or-other-real-hull-loss');
   }
   return;
 }
 if(meta.stage==='buy-sent'){
   if((ship.ladung.material||0)>=7){
     meta.stage='loaded';log(world,meta,'real-material-bought',{round:meta.round,qty:ship.ladung.material});
   }else {
     meta.stage='failed';meta.failed='original-core-rejected-real-buy';
     log(world,meta,'real-material-purchase-failed',{round:meta.round,qty:ship.ladung.material||0});
   }
 }else if(meta.stage==='inbound'&&ship.phase==='dock'&&ship.system==='cyris'){
   const cargo=ship.ladung.material||0;
   const sold=7-cargo;
   assert(sold>=0&&sold<=7);
   if(meta.round===1)meta.firstSold=sold;
   else meta.secondSold=sold;
   log(world,meta,'original-core-real-arrival-sale',{round:meta.round,sold,unsold:cargo});
   if(meta.round===1&&sold===7){
     meta.stage='return';
   }else{
     meta.stage=sold===7?'two-deliveries':'stuck';
     if(sold<7)meta.failed='insufficient-real-buyer-cash-or-capacity';
   }
 }else if(meta.stage==='back'&&ship.phase==='dock'&&ship.system==='veldra'){
   meta.stage='at-source';meta.round=2;meta.attemptedSecond=true;
   log(world,meta,'second-cycle-source-arrived');
 }
}
function independentlyAudit(state){
 let cash=0;
 for(const q of Object.values(state.owners)){assert(Number.isSafeInteger(q.cash)&&q.cash>=0);cash+=q.cash}
 assert.equal(cash,state.initialSupply+state.minted-state.burned,'ganzes Geld');
 const inventory={};
 for(const holder of [...Object.values(state.stations).map(x=>x.lager),...Object.values(state.ships).map(x=>x.ladung)])
  for(const [item,qty] of Object.entries(holder)){assert(Number.isSafeInteger(qty)&&qty>=0);
   inventory[item]=(inventory[item]||0)+qty;}
 for(const [item,row] of Object.entries(state.ledger))
  assert.equal(inventory[item]||0,row.initial+row.mined+row.produced+row.imported-row.consumed-row.exported,'Ware '+item);
}
function summary(world,day){
 const o=world.owners;
 return {day,hash:a.core.hash(world),playerCash:o.house.cash,npc3Cash:o.npc3.cash,
   npc1Cash:o.npc1.cash,npc2Cash:o.npc2.cash,cyrisCash:o.st_cyris.cash,meridianCash:o.st_meridian.cash,
   minted:world.minted,burned:world.burned,
   npc3MinerCount:Object.values(world.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner').length,
   npc3FreighterCount:Object.values(world.ships).filter(x=>x.owner==='npc3'&&x.klasse==='frachter').length,
   cyrisMaterial:world.stations.st_cyris.lager.material||0,
   cyrisIce:world.stations.st_cyris.lager.eis||0,
   cyrisMeds:world.stations.st_cyris.lager.medikamente||0,
   medicinesProduced:world.ledger.medikamente.produced,
   medicinesConsumed:world.ledger.medikamente.consumed,
   foodConsumed:world.ledger.nahrung.consumed,
   allRecipes:Object.values(world.stats.rezepte).reduce((v,q)=>v+q,0)};
}
let cursor=0,roundtrips=0,hours=0;
const points=[];
for(let tick=1;tick<=days*1440;tick++){
 for(const [world,env,meta] of [[s,a,m],[t,b,n]]){
  while(commands.some(x=>x.tick===world.tick+1)){
   // Diese Befehle nur je Welt einmal einreichen, getrennt vom Observationscursor.
   const cmd=commands.filter(x=>x.tick===world.tick+1);
   for(const q of cmd)submit(env.core,world,q.cmd);
   break;
  }
  before(world,env,meta);
 }
 const rx=a.core.step(s,a.rules),ry=b.core.step(t,b.rules);
 assert.deepEqual(rx,ry,'identische Befehlsresultate bei Replay');
 after(s,a,m);after(t,b,n);
 if(tick%60===0){
   assert(a.core.audit(s).ok);assert(b.core.audit(t).ok);
   independentlyAudit(s);independentlyAudit(t);
   assert.equal(a.core.hash(s),b.core.hash(t),'stündliche Replay-Hashes');
   hours++;
 }
 if(tick%1440===0){
   const day=tick/1440;
   if([1,7,14,15,16,17,18,30,60,90].includes(day))points.push(summary(s,day));
   if([3,14,18,30,90].includes(day)){
     for(const [world,env] of [[s,a],[t,b]]){
       assert.equal(env.core.hash(env.core.load(env.core.save(world),undefined,env.rules)),env.core.hash(world));
       roundtrips++;
     }
   }
 }
}
assert.equal(a.core.hash(s),b.core.hash(t));
assert.deepEqual(m,n,'Ereignistrace deterministisch reproduziert');
if(mode==='control'&&days===90)
 assert.equal(a.core.hash(s),'784047684dfe5c56','historische 90d-Kontrolle unveraendert');
if(mode!=='procurement')assert.equal(m.transferred,0);
if(intervention)assert(m.hullCount<=1,'nur ein konzerngehoeriger Frachterkauf');
if(mode==='procurement')assert(m.invoices<=1,'maximal ein einmaliger echter Beschaffungsvertrag');
const out={mode,days,seed,hash:a.core.hash(s),sourceSha256:hash256(source),
 hours,roundtrips,events:m.events,contract:{invoices:m.invoices,amount:m.transferred,
   goodsInvoice:m.invoiceAmount,firstSold:m.firstSold,secondSold:m.secondSold,
   attemptedSecond:m.attemptedSecond,hulls:m.hullCount,stage:m.stage,failed:m.failed},
 points,final:summary(s,days)};
const dir=opt('out','/tmp/b8d');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'-'+days+'d.json'),JSON.stringify(out,null,2)+'\n');
console.log('B8D_PASS '+JSON.stringify({mode,hash:out.hash,hours,roundtrips,
 contract:out.contract,events:out.events,points:out.points}));
