// B8g - EIN Original-NPC3-Frachter, zwei begrenzte, real finanzierte, offene Leistungsnachweise.
// Nur Analyse-Overlay, keine Produkt-/Spielstand-/Regelaenderung. Finanziert aus
// bereits existierender neutraler Kasse; keine neue ISK-Quelle, kein Einzel-Bailout.
// Auswahl nach weltweiten Produktionsdefiziten (Medizin-Rezept), nicht nach Kassenstand.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2), opt=(k,def)=>args.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3)??def;
assert(args.every(x=>/^--(mode|days|out)=/.test(x)));
const mode=opt('mode','control'),days=Number(opt('days','90')), seed=42;
assert(['control','ship-only','one-contract','two-contract'].includes(mode));
assert([18,90].includes(days));
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('<script>')+8,end=html.indexOf('const m_data_oberflaeche');
assert(start>=8&&end>start);
const source=html.slice(start,end);
const hash256=s=>createHash('sha256').update(s).digest('hex');
assert.equal(hash256(source),'035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9');
const arrivalNeedle="    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n    entladen(state, rules, s);";
const tradeNeedle="  buche(state, schiff.owner, 'kosten', fee);";
const costNeedle="    const n = Math.min(besitzer.cash, kosten);";
for(const needle of [arrivalNeedle,tradeNeedle,costNeedle])
 assert.equal(source.split(needle).length,2,'genau ein Originalkern-Beobachtungspunkt');
const instrumented=source.replace(arrivalNeedle,
 "    s.phase = 'dock'; s.ziel = null; s.ankunft = state.tick;\n"+
 "    const proof = observer.onArrival(state,rules,s,m_core_handel.obergrenze,m_core_preis.preis);\n"+
 "    entladen(state, rules, s);\n"+
 "    observer.afterArrival(state,rules,s,proof);")
 .replace(tradeNeedle,tradeNeedle+"\n  observer.onTrade(state,schiff,station,ware,menge,kauf,wert,fee);")
 .replace(costNeedle,costNeedle+"\n    observer.onCost(state,s,kosten,n);");
const loadCore=(observer)=>new Function('observer',instrumented+
 ';return {core:m_core_index,rules:m_data_rules.RULES};')(observer);
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
const META=()=>({stage:'start',ship:null,round:1,events:[],slot:null,target:null,
  contractMaxISK:900,contractMaxLoads:mode==='two-contract'?2:mode==='one-contract'?1:0,
  proof:null,invoice:[],invoices:0,invoiceAmount:0,invoiceSeller:null,
  firstSold:0,secondSold:0,thirdSold:0,attemptedSecond:false,attemptedThird:false,
  hullCount:0,transferred:0,sourceBuys:[],shipOperatingPaid:0,shipOperatingDue:0,
  shipFeePaid:0,failed:null});
const m=META(),n=META();
function demandTarget(state,rules){
 const eligible=Object.keys(state.stations).sort().filter(id=>
   state.stations[id].linien.some(line=>{
     const recipe=rules.economy.rezepte[line.rezept];
     return (recipe.aus.medikamente||0)>0 && (recipe.ein.material||0)>0 &&
       (state.stations[id].lager.material||0)<recipe.ein.material;
   }));
 return eligible;
}
function observer(meta){
 return {
  onTrade(world,ship,station,ware,qty,buy,val,fee){
   if(ship.id!==meta.ship)return;
   meta.shipFeePaid+=fee;
   if(buy&&station==='st_veldra'&&ware==='material'){
     assert.equal(qty,7);
     assert(!meta.proof,'keine unbelegte vorangegangene Ware im Frachter');
     meta.proof={ship:ship.id,owner:ship.owner,from:station,ware,qty,
       cost:val+fee,fee,boughtAt:world.tick,round:meta.round};
     meta.sourceBuys.push({...meta.proof});
   }
  },
  onCost(world,ship,cost,paid){
   if(ship.id!==meta.ship)return;
   meta.shipOperatingDue+=cost;meta.shipOperatingPaid+=paid;
  },
  onArrival(world,rules,ship,capacityFn,priceFn){
   if(meta.stage!=='inbound'||ship.id!==meta.ship||meta.round>meta.contractMaxLoads)return null;
   // Echter Ankunftstick: Schiff ist nach urspruenglichem Reiseabschluss angedockt.
   if(!meta.target||ship.system!==world.stations[meta.target].system)return null;
   const cert=meta.proof;
   assert(cert&&cert.round===meta.round&&cert.owner===ship.owner&&cert.from==='st_veldra',
     'keine Vertragszahlung ohne nachvollziehbaren Original-Core-Kauf und Fahrt');
   const qty=ship.ladung[cert.ware]||0;
   assert.equal(qty,cert.qty);
   const space=capacityFn(world,rules,meta.target,cert.ware)
      -(world.stations[meta.target].lager[cert.ware]||0);
   if(space<qty)return null; // Kein Geld bei nicht abnehmbarem Gut
   const price=priceFn(world,meta.target,cert.ware,rules);
   const invoice=qty*price;
   const missing=Math.max(0,invoice-world.owners[meta.target].cash);
   if(missing+meta.transferred>meta.contractMaxISK)return null;
   // Keine individuelle Insolvenzregel: Vertrag wurde allein nach physischem
   // Rezeptbedarf bei Tag14 ausgeschrieben, nie anhand von Stations-Cash.
   const treasury='st_meridian';
   if(world.owners[treasury].cash<missing)return null; // kein unfinanzierter Auftrag
   world.owners[treasury].cash-=missing;
   world.owners[meta.target].cash+=missing;
   const receipt={round:meta.round,ship:ship.id,source:cert.from,destination:meta.target,
      qty,price,invoice,covered:missing,boughtAt:cert.boughtAt,arrivedAt:world.tick,
      cashBefore:world.owners[meta.target].cash-missing,fromTreasury:treasury};
   meta.transferred+=missing;
   return receipt;
  },
  afterArrival(world,rules,ship,receipt){
   if(!receipt)return;
   const sold=receipt.qty-(ship.ladung.material||0);
   assert.equal(sold,receipt.qty,'Globale Auftragszahlung NUR mit vollzogenem Originalverkauf');
   // Einfaches, vollstaendig abgerechnetes Ausfuehrungszertifikat:
   // Originalhandel liefert die Ladung; stationaerer Warenbestand ist korrekt.
   assert(world.stations[receipt.destination].lager.material>=sold);
   assert.equal(meta.proof?.round,receipt.round);
   meta.proof=null;
   meta.invoice.push({...receipt,sold,confirmedAt:world.tick});
   meta.invoices++;
   meta.invoiceAmount+=receipt.invoice;
  }
 };
}
const a=loadCore(observer(m)),b=loadCore(observer(n));
assert.equal(a.rules.rulesVersion,14);
const s=a.core.createState(seed,a.rules),t=b.core.createState(seed,b.rules);
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
   // Alle weltweiten Medizin-Produktionsstandorte sind ohne Kassen-Lesezugriff
   // prinzipiell beschaffungsberechtigt. Der einmalige Seed42-Versuch waehlt
   // die erste reproduzierbare unversorgte Produktionsstation, NICHT die armste.
   const candidates=demandTarget(world,r);
   assert.deepEqual(candidates,['st_cyris'],'B8g eine eindeutig real beduerftige Produktionsstation');
   meta.target=candidates[0];
   meta.slot=world.sollflotte.npc3.length;
   world.sollflotte.npc3.push({klasse:'frachter',heimat:'veldra',ware:'material',auftrag:'halten'});
   meta.stage='await-hull';
   log(world,meta,'global-material-demand-offered',{candidates,selection:'medical-recipe-input-shortage-only',
      globalCeilingISK:meta.contractMaxISK,maxCoveredLoads:meta.contractMaxLoads,
      shipyard:world.stations[r.world.werft].lager.frachter||0});
 }
 const ship=meta.ship?world.ships[meta.ship]:null;
 if(!ship)return;
 if(meta.stage==='at-source' && ship.phase==='dock'&&ship.system==='veldra'){
   submit(c,world,{owner:'npc3',type:'shipTrade',schiff:ship.id,ware:'material',menge:7,kauf:true});
   meta.stage='buy-sent';log(world,meta,'real-purchase-submitted',{round:meta.round});
 }else if(meta.stage==='loaded'&&ship.phase==='dock'&&ship.system==='veldra'){
   submit(c,world,{owner:'npc3',type:'shipMove',schiff:ship.id,ziel:'st_cyris'});
   meta.stage='inbound';log(world,meta,'real-loaded-travel-submitted',{round:meta.round,cargo:ship.ladung.material||0});
 }else if(meta.stage==='return'&&ship.phase==='dock'&&ship.system==='cyris'){
   submit(c,world,{owner:'npc3',type:'shipMove',schiff:ship.id,ziel:'st_veldra'});
   meta.stage='back';log(world,meta,'next-cycle-return-submitted',{next:meta.round+1});
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
   else if(meta.round===2)meta.secondSold=sold;
   else meta.thirdSold=sold;
   log(world,meta,'original-core-real-arrival-sale',{round:meta.round,sold,unsold:cargo,
     invoice:meta.invoice.find(x=>x.round===meta.round)||null});
   if(sold===7&&meta.round<3){
     meta.stage='return';
   }else{
     meta.stage=sold===7?'three-deliveries':'stuck';
     if(sold<7)meta.failed='insufficient-real-buyer-cash-or-capacity';
   }
 }else if(meta.stage==='back'&&ship.phase==='dock'&&ship.system==='veldra'){
   meta.stage='at-source';meta.round++;
   if(meta.round===2)meta.attemptedSecond=true;
   if(meta.round===3)meta.attemptedThird=true;
   assert(meta.round<=3,'kein vierter wiederholter Auftrag');
   log(world,meta,'next-cycle-source-arrived',{round:meta.round});
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
if(['control','ship-only'].includes(mode))assert.equal(m.transferred,0);
if(intervention)assert(m.hullCount<=1,'nur ein original finanzierter Konzernfrachter');
assert(m.invoices<=m.contractMaxLoads,'kein Mehrfachabschluss ueber globale Kontingentgrenze');
assert(m.transferred<=m.contractMaxISK,'alle echten Zahlungen aus globalem Ausgabenlimit');
assert.equal(m.invoices,m.invoice.length,'pro Lieferung ein einmaliges eindeutiges Zertifikat');
assert.equal(m.invoiceAmount,m.invoice.reduce((a,x)=>a+x.invoice,0));
assert.equal(m.transferred,m.invoice.reduce((a,x)=>a+x.covered,0));
const out={mode,days,seed,hash:a.core.hash(s),sourceSha256:hash256(source),
 hours,roundtrips,events:m.events,contract:{invoices:m.invoices,amount:m.transferred,
   goodsInvoice:m.invoiceAmount,firstSold:m.firstSold,secondSold:m.secondSold,
   thirdSold:m.thirdSold,attemptedSecond:m.attemptedSecond,
   attemptedThird:m.attemptedThird,hulls:m.hullCount,stage:m.stage,failed:m.failed,
   receipts:m.invoice,shipOperatingDue:m.shipOperatingDue,
   shipOperatingPaid:m.shipOperatingPaid,shipOperatingUnpaid:m.shipOperatingDue-m.shipOperatingPaid,
   shipTradeFees:m.shipFeePaid,sourceBuys:m.sourceBuys,globalCeiling:m.contractMaxISK,
   maxLoads:m.contractMaxLoads},
 points,final:summary(s,days)};
const dir=opt('out','/tmp/b8g');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,mode+'-'+days+'d.json'),JSON.stringify(out,null,2)+'\n');
console.log('B8G_PASS '+JSON.stringify({mode,hash:out.hash,hours,roundtrips,
 contract:out.contract,events:out.events,points:out.points}));
