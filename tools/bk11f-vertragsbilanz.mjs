// [ANALYSE] B-K11f – deterministisches Kassen-/Escrow-Replay bereits belegter B-K10k-Belege.
// KEIN Core-Produktauftrag, KEINE neuen Preise/ISK/Arbeit im Produkt: wirtschaftliche
// Rechnung ueber historische Original-Core-Belege aus PR #128 / GitHub CI.
// Das bereitgestellte Kaeuferguthaben ist eine explizite VORAUSSETZUNG,
// kein vom Einzelauftrag erzeugtes Einkommen.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const pinned='7ee2d3786dece413bcea7152b64ea7ed5218f2ec68c9001c10c0fe7f987e33f5';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.equal(createHash('sha256').update(html).digest('hex'),pinned,
  'B-K11f nur auf unveraendertem Original-main b4e604d6');
const js=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(js+';return {core:m_core_index,rules:m_data_rules.RULES};')();
assert.equal(rules.rulesVersion,14);assert.equal(rules.schema,8);
assert.deepEqual(rules.economy.rezepte.r_nahrung.ein,{eis:2});
assert.deepEqual(rules.economy.rezepte.r_nahrung.aus,{nahrung:1});
assert.equal(rules.economy.rezepte.r_nahrung.dauer,6);
assert.equal(rules.world.betriebskosten.miner,150);
const nativeState=core.createState(42,rules);
assert.equal(nativeState.owners.st_nadir.cash,4000);
assert.equal(nativeState.owners.npc3.cash,2000);
assert.equal(nativeState.owners.house.cash,2000);
assert(core.audit(nativeState).ok);
export const source={main:'b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c',
 originalProof:'https://github.com/tobiasfranziskus/Check/pull/128',
 proofType:'historische wirkliche R15-Belege, isoliertes neues buchhalterisches Replay; KEIN neuer Produktkernlauf',
 costAssumption:'4 ISK/Fabrikminute; ausschliesslich historischer nicht integrierter Testtarif',
 feesAndFlight:'historische Summen bei genau den alten Preisen; Repricing wuerde Gebuehren aendern'};
const initialFunds=q=>({
 source:nativeState.owners.st_nadir.cash, // Original-Kasse am Weltstart
 miner:nativeState.owners.npc3.cash,
 trader:nativeState.owners.house.cash,
 buyer:54*q, // NUR angenommene bereits anderweitig verdiente, tatsaechlich vorhandene ISK
 worker:0,funds:0,shipyard:0
});
const clone=x=>JSON.parse(JSON.stringify(x));
const sum=o=>Object.values(o).reduce((a,v)=>a+v,0);
const iceCost=q=>44*q; // B-K10k 48 echte Eis = 1056 ISK, ueber 8/16/24 proportional
const minerWork=q=>5*q; // 48 min zu 150 ISK/h = 120 ISK bei q=24
const wage=q=>24*q; // wirklich gezahlter B-K10k-Testlohn
const wholesale=q=>25*q; // B-K10k Original-Quellstationspreis
const freight=499; // B-K10k tatsaechlich bezahlte 2 x 60min Originalfluege
const fees=q=>3*q; // B-K10k direkte und Quell-Gebuehren, zusammen 72 ISK
const finalSale=q=>54*q; // B-K10k 24 x 54 = 1296 ISK
const hullReserve=780; // damaliger Original-Marktpreis Frachter+Gebuehr (nur Cash-Reserve!)

export const invoice=q=>{
 assert([8,16,24].includes(q),'ausschliesslich exakt belegte B-K10k-Mengen');
 return {q,ice:2*q,iceISK:iceCost(q),minerWorkISK:minerWork(q),
   wageISK:wage(q),wholesaleISK:wholesale(q),freightISK:freight,
   feesISK:fees(q),customerISK:finalSale(q),hullReserveISK:hullReserve};
};
function accounts(wallets){
 const w=clone(wallets),escrow={},journal=[],starting=sum(w);
 for(const [id,value] of Object.entries(w))
   assert(Number.isSafeInteger(value)&&value>=0,'Nur wirklich bestehende Kontoguthaben: '+id);
 function audit(){
   for(const a of [w,escrow])for(const v of Object.values(a))
     assert(Number.isSafeInteger(v)&&v>=0,'keine negative Kasse/Kredit');
   assert.equal(sum(w)+sum(escrow),starting,'keine neue ISK / Verluste durch Buchung');
 }
 function reserveBatch(requests){
   const needed={};
   for(const r of requests){
     assert(r.amount>=0&&Number.isSafeInteger(r.amount));
     assert(!Object.hasOwn(escrow,r.key),'keine doppelte Vertrags-ID');
     needed[r.owner]=(needed[r.owner]??0)+r.amount;
   }
   const missing=Object.entries(needed).filter(([owner,v])=>(w[owner]??0)<v)
     .map(([owner,v])=>({owner,need:v,have:w[owner]??0}));
   if(missing.length)return {ok:false,missing};
   for(const r of requests){
     w[r.owner]-=r.amount;escrow[r.key]=r.amount;
     journal.push({action:'reserve',from:r.owner,to:'escrow:'+r.key,amount:r.amount});
   }
   audit();return {ok:true};
 }
 function settle(key,to,amount,why){
   assert(Object.hasOwn(escrow,key),'existierende Forderung');
   assert(amount>0&&amount<=escrow[key]);
   escrow[key]-=amount;w[to]+=amount;
   journal.push({action:'pay',from:'escrow:'+key,to,amount,why});
   audit();
 }
 function refund(key,to,why){
   assert(Object.hasOwn(escrow,key));
   const amount=escrow[key];
   if(amount) {escrow[key]=0;w[to]+=amount;
     journal.push({action:'refund',from:'escrow:'+key,to,amount,why});}
   audit();
 }
 function snapshot(){audit();return {wallets:clone(w),escrow:clone(escrow),journal:clone(journal),supply:starting};}
 return {reserveBatch,settle,refund,snapshot};
}
const requirements=v=>[
 {owner:'source',key:'ice',amount:v.iceISK},
 {owner:'source',key:'wage',amount:v.wageISK},
 {owner:'miner',key:'minerWork',amount:v.minerWorkISK},
 {owner:'trader',key:'wholesale',amount:v.wholesaleISK},
 {owner:'trader',key:'flights',amount:v.freightISK},
 {owner:'trader',key:'fees',amount:v.feesISK},
 {owner:'trader',key:'hull',amount:v.hullReserveISK},
 {owner:'buyer',key:'buyer',amount:v.customerISK}
];

export function order({q=24,wallets=initialFunds(q),outcome='delivered'}={}){
 assert(['delivered','lost'].includes(outcome));
 const v=invoice(q),initial=clone(wallets),book=accounts(wallets);
 const gate=book.reserveBatch(requirements(v));
 if(!gate.ok){
   const end=book.snapshot();assert.deepEqual(end.wallets,initial);
   assert.deepEqual(end.escrow,{});assert.equal(end.journal.length,0);
   return {ok:false,invoice:v,initial,wallets:end.wallets,missing:gate.missing,
     moneyConserved:true,source};
 }
 // Waren starten als 2q historisch durch Original-Miner NEU gefoerderte Eiseinheiten
 // (Beleg #128), nicht als kostenlose Testproduktion.
 const goods={minerIce:v.ice,stationIce:0,stationFood:0,traderFood:0,
   buyerFood:0,iceUsed:0,foodProduced:0,foodConsumed:0,foodDestroyed:0};
 const auditGoods=()=>{
   assert.equal(goods.minerIce+goods.stationIce+goods.iceUsed,v.ice);
   assert.equal(goods.stationFood+goods.traderFood+goods.buyerFood+
     goods.foodConsumed+goods.foodDestroyed,goods.foodProduced);
   assert(goods.foodProduced<=v.q);
   assert(Object.values(goods).every(n=>Number.isSafeInteger(n)&&n>=0));
 };
 const cashSnapshots=[];
 const snap=(step)=>{auditGoods();cashSnapshots.push({step,...book.snapshot(),goods:clone(goods)});};
 snap('vor nachgewiesener Eisfoerder-/Verkaufsleistung');
 book.settle('minerWork','funds',v.minerWorkISK,'tatsaechlich geleistete Minerarbeit');
 book.settle('ice','miner',v.iceISK,'nachgewiesene 2q Originaleis-FIFO-Einkaeufe');
 goods.minerIce-=v.ice;goods.stationIce+=v.ice;snap('48 nachweislich bezahlte Eis');
 goods.stationIce-=v.ice;goods.iceUsed+=v.ice;
 book.settle('wage','worker',v.wageISK,'24 Originalrezeptloehne zu 6min');
 goods.stationFood+=v.q;goods.foodProduced+=v.q;
 snap('24 aus bezahltem Eis und Fabriklohn gefertigte Nahrung');
 book.settle('wholesale','source',v.wholesaleISK,'Original-Quellstations-Nahrungsverkauf');
 goods.stationFood-=v.q;goods.traderFood+=v.q;
 book.settle('flights','funds',v.freightISK,'zwei original bezahlte Reisen');
 book.settle('fees','funds',v.feesISK,'historische reale Gebuehren');
 snap('bezahlter Warenkauf und Flug; noch keine Ankunftsleistung');
 if(outcome==='delivered'){
   goods.traderFood-=v.q;goods.buyerFood+=v.q;
   book.settle('buyer','trader',v.customerISK,'einmalig abgenommene Original-Endlieferung');
   goods.buyerFood-=v.q;goods.foodConsumed+=v.q;
   book.refund('hull','trader','Huelle erhalten: eingezahlte reine Ausfallreserve');
 }else{
   goods.traderFood-=v.q;goods.foodDestroyed+=v.q;
   book.refund('buyer','buyer','KEINE Endlieferung; unverdiente Bestell-ISK zurueck');
   // Nur der Preis eines hypothetischen Ersatzes wird bezahlt, KEINE neue Huelle erzeugt.
   book.settle('hull','shipyard',v.hullReserveISK,
     'Nur finanzielle Ersatzkosten, keine vorhandene Werfthuelle nachgewiesen');
 }
 snap(outcome==='delivered'?'abgenommen und zivil verbraucht':'Fracht verloren; Kunde erstattet');
 const final=book.snapshot();
 assert(Object.values(final.escrow).every(n=>n===0),'kein haengender Escrow');
 assert.equal(final.supply,sum(final.wallets),'money initial=money final');
 const delta=Object.fromEntries(Object.keys(initial).map(x=>[x,final.wallets[x]-initial[x]]));
 const groupBusiness=delta.source+delta.miner+delta.trader;
 if(outcome==='delivered'){
   assert.equal(delta.source,v.wholesaleISK-v.iceISK-v.wageISK);
   assert.equal(delta.miner,v.iceISK-v.minerWorkISK);
   assert.equal(delta.trader,v.customerISK-v.wholesaleISK-v.freightISK-v.feesISK);
   assert.equal(groupBusiness,v.customerISK-v.wageISK-v.minerWorkISK-v.freightISK-v.feesISK);
   assert.equal(goods.foodConsumed,v.q);
 }else{
   assert.equal(goods.foodConsumed,0);assert.equal(goods.foodDestroyed,v.q);
   assert.equal(delta.buyer,0);
 }
 return {ok:true,outcome,invoice:v,initial,delta,final:final.wallets,
   groupBusiness,goods,supply:final.supply,escrowRemaining:sum(final.escrow),
   cashSnapshots,source};
}
export function preflight(q=24,wallets=initialFunds(q)){
 const v=invoice(q),book=accounts(wallets),gate=book.reserveBatch(requirements(v));
 return {invoice:v,gate,...book.snapshot()};
}
export function repairRange(q=24){
 const i=invoice(q);
 const minIce=i.minerWorkISK;
 const minWholesale=minIce+i.wageISK;
 const maxWholesale=i.customerISK-i.freightISK-i.feesISK;
 const historicalWithIce=i.iceISK;
 const historicalSourceNeeds=historicalWithIce+i.wageISK;
 const fixedFeeCustomerFloor=historicalSourceNeeds+i.freightISK+i.feesISK;
 return {minIceISK:minIce,sourceCostWithMinerAtCost:minWholesale,
   merchantMaxWholesaleISK:maxWholesale,
   totalRedistributableBusinessMargin:maxWholesale-minWholesale,
   historicalIceISK:historicalWithIce,
   sourceMinWholesaleAtHistoricalIceISK:historicalSourceNeeds,
   fixedFeeCustomerMinWithHistoricalIceISK:fixedFeeCustomerFloor,
   additionalCustomerISKLowerBoundAtFixedFees:
      fixedFeeCustomerFloor-i.customerISK,
   note:'Diese Gegenangebote sind nur Algebra mit eingefrorenen Originalgebuehren, nicht Original-Core-Preise oder freigegebene Produktregeln.'};
}
const asScript=process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1];
if(asScript){
 const results=[8,16,24].map(q=>{
   const r=order({q});return {q,paid:r.ok,delta:r.delta,
     netThreeBusinesses:r.groupBusiness,sourceWorkingCapital:r.invoice.iceISK+r.invoice.wageISK,
     merchantWorkingCapital:r.invoice.wholesaleISK+r.invoice.freightISK+r.invoice.feesISK+
       r.invoice.hullReserveISK,realInvoice:r.invoice};});
 const first=order(),second=order({wallets:first.final});
 const lost=order({outcome:'lost'});
 const report={source,examples:results,repairRange:repairRange(24),
   repeatWithoutOtherBuyerIncome:{first:first.ok,second:second.ok,blockedBy:second.missing},
   loss:{buyerCashDelta:lost.delta.buyer,shipyardCashReceipt:lost.delta.shipyard,
     traderCashDelta:lost.delta.trader,foodDestroyed:lost.goods.foodDestroyed,
     foodConsumed:lost.goods.foodConsumed},
   caveat:'Formales Rechnungs-Replay historischer Belege; keine im neuen CI erneut real gefahrene Strecke, kein belastbarer Langzeit-Kreislauf und keine Geldmodell-B-Emissionsregel.'};
 console.log('BK11F_RESULT '+JSON.stringify(report));
 console.log('BK11F_PASS '+JSON.stringify({accounting:true,variants:3,lossRefund:true,initialMoneyConserved:true}));
}
