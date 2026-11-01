// B-K5 – Rechenbeleg, KEINE Produktmechanik und KEIN Minting.
// Original-REGEL14-Miner, Handel, Preis, Produktion und Betriebskosten
// fuer 20 Stunden Cyris = 60 echt bezahlte Nahrungseinheiten.
// Explizit modellierte Haushaltloehne/Dividenden/Reserven: nur ANALYSE.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='));
const needle='return { entscheidung };';
assert.equal(source.split(needle).length,2);
const instrument=source.replace(needle,'return { entscheidung, bestesPaar };');
const {core,r,einzel,produktion,foerderung,kosten,handel,preis,route,choose}=new Function(instrument+
  ';return {core:m_core_index,r:m_data_rules.RULES,einzel:m_core_index.audit,'+
  'produktion:m_core_produktion.produktion,foerderung:m_core_foerderung.foerderung,'+
  'kosten:m_core_stunde.betriebskosten,handel:m_core_handel.handel,'+
  'preis:m_core_preis.preis,route:m_core_route.route,choose:m_core_entscheidung.bestesPaar};')();
assert.equal(r.rulesVersion,14);
const S='st_cyris',F='fonds_cyris',M='npc3',H='haushalt_bk5';
const stunde=r.economy.stunde,menge=r.world.stations[S].verbrauch.nahrung;
assert.equal(stunde,60);assert.equal(menge,3);
assert.deepEqual(r.economy.rezepte.r_nahrung.ein,{eis:2});
assert.equal(r.economy.rezepte.r_nahrung.dauer,6);
const total=s=>Object.values(s.owners).reduce((x,o)=>x+o.cash,0);
function audit(s){
 assert(einzel(s).ok,'original Core-Audit');
 assert.equal(total(s),s.initialSupply+s.minted-s.burned,'unabhaengiger ISK-Abgleich');
 const stock={};
 for(const st of Object.values(s.stations))
  for(const [w,n] of Object.entries(st.lager)){
   assert(Number.isSafeInteger(n)&&n>=0);
   stock[w]=(stock[w]||0)+n;
  }
 for(const sh of Object.values(s.ships))
  for(const [w,n] of Object.entries(sh.ladung)){
   assert(Number.isSafeInteger(n)&&n>=0);
   stock[w]=(stock[w]||0)+n;
  }
 for(const [w,l] of Object.entries(s.ledger))
  assert.equal(stock[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
    'Ware: '+w);
}
function pay(s,from,to,amount,why){
 assert(Number.isSafeInteger(amount)&&amount>=0,why);
 assert(s.owners[from]&&s.owners[to]);
 assert(s.owners[from].cash>=amount,why+' ohne Deckung '+amount);
 s.owners[from].cash-=amount;s.owners[to].cash+=amount;
}
function setup(seed=42,householdStart=900){
 const s=core.createState(seed,r);
 assert(s.owners[F].cash>=householdStart);
 pay(s,F,M,0,'init');
 s.owners[F].cash-=householdStart;
 s.owners[H]={id:H,kind:'household',cash:householdStart};
 s.stats.konto[H]={erloes:0,kosten:0};
 s.stats.abgabe[H]=0;
 const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner===M&&
   x.system==='cyris'&&x.ware==='eis');
 assert(miner,'echter Cyris-Eisminer muss existieren');
 for(const ship of Object.values(s.ships)){
  ship.arbeit=0;
  if(ship!==miner){ship.auftrag='halten';ship.ware=null;}
 }
 for(const [id,st] of Object.entries(s.stations))
   st.linien=id===S?st.linien.filter(x=>x.rezept==='r_nahrung'):[];
 assert.equal(s.stations[S].linien.length,1);
 // Vorfinanzierter WIP des Original-Rezeptes, von bestehendem Eis gedeckt.
 produktion(s,r);
 assert.equal(s.stations[S].linien[0].rest,6);
 audit(s);
 return {s,miner};
}
function simulate({seed=42,hours=20,householdStart=900,
  minerReserve=6,factoryReserve=3,fundReturnsFees=false,
  fundPaysWork=true,companyPaysIncome=true}={}){
 const {s,miner}=setup(seed,householdStart);
 const start={household:s.owners[H].cash,station:s.owners[S].cash,
  miner:s.owners[M].cash,fund:s.owners[F].cash,whole:total(s),
  ice:s.stations[S].lager.eis,food:s.stations[S].lager.nahrung,
  produced:s.ledger.nahrung.produced,consumed:s.ledger.nahrung.consumed,
  mined:s.ledger.eis.mined};
 const log=[];
 let stop=null;
 for(let h=1;h<=hours;h++){
  const before={f:s.owners[F].cash,m:s.owners[M].cash,station:s.owners[S].cash,
   hh:s.owners[H].cash,ice:s.stations[S].lager.eis,food:s.stations[S].lager.nahrung,
   raw:s.ledger.eis.mined,prod:s.ledger.nahrung.produced,consumed:s.ledger.nahrung.consumed};
  // Genau 6 neue Eis durch Original-Miner und die Original-Miner-Arbeit.
  for(let m=0;m<6;m++)foerderung(s,r);
  assert.equal(miner.arbeit,6);
  assert.equal(s.ledger.eis.mined-before.raw,6);
  assert.equal(miner.ladung.eis,6);
  const pIce=preis(s,S,'eis',r);
  assert(handel(s,r,miner,S,'eis',6,false),'Original-Stationskauf braucht Geld');
  const rawPurchase=before.station-s.owners[S].cash;
  const feeAndWagesBefore=s.owners[F].cash;
  kosten(s,r); // Original-Betriebskosten: 6/60*150 = 15 ISK
  assert.equal(miner.arbeit,0);
  const fundIn=s.owners[F].cash-feeAndWagesBefore;
  const fundIncome=s.owners[F].cash-before.f;
  const purchaseFee=fundIncome-fundIn;
  assert.equal(fundIn,15,'original Minerkosten = 15 ISK, voll bezahlt');
  assert(purchaseFee>=0);
  // Drei reale Nahrungsrezepte mit 18 Original-Rezeptminuten.
  // Die 54 anderen Minuten entfallen in dieser isolierten Testzelle
  // auf Ruhezeit; hier NICHT den kompletten Weltstundentick behaupten.
  for(let m=0;m<18;m++)produktion(s,r);
  assert.equal(s.ledger.nahrung.produced-before.prod,3);
  assert.equal(s.stations[S].lager.nahrung-before.food,3);
  assert.equal(s.stations[S].lager.eis,before.ice,
    '6 Mineneis gekauft und 6 Eis in 3 Originalrezepte/WIP investiert');
  let demand=0,spent=0;
  for(let i=0;i<3;i++){
   const food=preis(s,S,'nahrung',r);
   if(s.owners[H].cash<food){stop={hour:h,purchased:i,reason:'kaufkraft',cash:s.owners[H].cash,price:food};break;}
   pay(s,H,S,food,'B-K5 tatsaechliche Nahrung');
   s.stations[S].lager.nahrung--;
   s.ledger.nahrung.consumed++;
   spent+=food;demand++;
  }
  // Falls die Haushaltskasse mitten im dritten Kauf leer wird,
  // stoppt der Kontrolllauf, statt durch hypothetische Dividenden
  // eine bereits gescheiterte Runde nachtraeglich zu finanzieren.
  // Erbrachte Minenarbeit und schon bezahlte Kauefe bleiben gebucht.
  if(stop){
   s.tick+=stunde;
   log.push({hour:h,produced:3,consumed:demand,iceMined:6,
     icePrice:pIce,icePurchase:rawPurchase,foodRevenue:spent,
     minerWorkingCost:fundIn,tradingFee:purchaseFee,
     householdEnd:s.owners[H].cash,stopped:stop.reason});
   audit(s);break;
  }
  const netM=s.owners[M].cash-before.m;
  const netS=s.owners[S].cash-before.station;
  assert(netM>=minerReserve,'minerkasse kann Ruecklage finanzieren');
  assert(netS>=factoryReserve,'fabrik kann Ruecklage finanzieren');
  // Analystischer Eigentuemerlohn/Dividende: echte vorhandene Kassenmittel,
  // nie verborgene Kaufkraft. Bis auf Reserven alle realen Erloese
  // an Haushalt (keine reale Produktlohnregel).
  if(companyPaysIncome){
   pay(s,M,H,netM-minerReserve,'miner beispielhafte Einkommensausschuettung');
   pay(s,S,H,netS-factoryReserve,'fabrik beispielhafte Einkommensausschuettung');
  }
  pay(s,F,H,(fundPaysWork?fundIn:0)+(fundReturnsFees?purchaseFee:0),
    'eigene real zuvor bezahlte Minerarbeitsleistung / hypothetische Gebuehrenausgabe');
  s.tick+=stunde;
  const row={hour:h,produced:3,consumed:demand,iceMined:6,icePrice:pIce,
   icePurchase:rawPurchase,foodRevenue:spent,minerWorkingCost:fundIn,
   tradingFee:purchaseFee,netMinerBeforeDividend:netM,
   stationGrossMargin:netS,minerSaved:minerReserve,factorySaved:factoryReserve,
   feePaidToHousehold:fundReturnsFees?purchaseFee:0,
   fundWageToHousehold:fundPaysWork?fundIn:0,
   businessIncomeToHousehold:companyPaysIncome?netM-minerReserve+netS-factoryReserve:0,
   householdEnd:s.owners[H].cash,stationEnd:s.owners[S].cash,
   minerEnd:s.owners[M].cash,fundEnd:s.owners[F].cash};
  log.push(row);
  audit(s);
  if(stop)break;
 }
 return {s,start,log,stop,completed:log.filter(x=>x.consumed===3).length};
}

test('BK5: 20 volle Stunden = 60 bezahlte Nahrung, Originalware und 2 positive Firmenruecklagen',()=>{
 const x=simulate();
 assert.equal(x.completed,20);assert.equal(x.stop,null);
 assert.equal(x.s.ledger.eis.mined-x.start.mined,120);
 assert.equal(x.s.ledger.nahrung.produced-x.start.produced,60);
 assert.equal(x.s.ledger.nahrung.consumed-x.start.consumed,60);
 assert.equal(x.s.stations[S].lager.eis,x.start.ice);
 assert.equal(x.s.stations[S].lager.nahrung,x.start.food);
 assert.equal(x.s.owners[M].cash-x.start.miner,120);
 assert.equal(x.s.owners[S].cash-x.start.station,60);
 assert.equal(x.s.owners[F].cash-x.start.fund,60,
   '20x 3 ISK Originalhandelsgebuehr bleiben im Fonds');
 assert.equal(x.s.owners[H].cash,x.start.household-240);
 assert.equal(x.s.minted,0);assert.equal(x.s.burned,0);
 audit(x.s);
 console.log('BK5_20H_RESERVEN '+JSON.stringify({
  nahrung:60,eis:120,stunden:20,
  hhStart:x.start.household,hhEnd:x.s.owners[H].cash,
  minerReserve:x.s.owners[M].cash-x.start.miner,
  factoryReserve:x.s.owners[S].cash-x.start.station,
  fees:x.s.owners[F].cash-x.start.fund,
  first:x.log[0],last:x.log.at(-1)}));
});
test('BK5: ohne Reserven bleiben selbst mit echten Arbeitseinkommen 3 ISK Gebuehr je Stunde als Nachfrageleck',()=>{
 const x=simulate({minerReserve:0,factoryReserve:0});
 assert.equal(x.completed,20);
 assert.equal(x.s.owners[H].cash,x.start.household-60);
 assert.equal(x.s.owners[F].cash,x.start.fund+60);
 assert.equal(x.s.owners[M].cash,x.start.miner);
 assert.equal(x.s.owners[S].cash,x.start.station);
 audit(x.s);
});
test('BK5: nur volle erbrachte Leistungen und alle Gebuehren zurueck – kein Kapitalaufbau',()=>{
 const x=simulate({minerReserve:0,factoryReserve:0,fundReturnsFees:true});
 assert.equal(x.completed,20);
 assert.equal(x.s.owners[H].cash,x.start.household);
 assert.equal(x.s.owners[F].cash,x.start.fund);
 assert.equal(x.s.owners[M].cash,x.start.miner);
 assert.equal(x.s.owners[S].cash,x.start.station);
 audit(x.s);
 console.log('BK5_NUR_NULL_SPARQUOTE '+JSON.stringify({
  hours:20,household:x.s.owners[H].cash,assetReserve:0,feesLeft:0}));
});
test('BK5: echtes Sparen plus vollständige Gebuehrenausgabe – 180 ISK sinkende Haushaltkasse',()=>{
 const x=simulate({fundReturnsFees:true});
 assert.equal(x.completed,20);
 assert.equal(x.s.owners[H].cash,x.start.household-180);
 assert.equal(x.s.owners[F].cash,x.start.fund);
 assert.equal(x.s.owners[M].cash,x.start.miner+120);
 assert.equal(x.s.owners[S].cash,x.start.station+60);
 audit(x.s);
});
test('BK5: bei endlicher kleiner Haushaltkasse kommt irgendwann ein Echtgeld-Kaufstopp',()=>{
 const x=simulate({householdStart:120,hours:20});
 assert(x.completed<20,'kein Endloskauf bei groesseren Unternehmerruecklagen');
 assert(x.stop?.reason==='kaufkraft');
 assert(x.s.owners[H].cash>=0);
 audit(x.s);
 console.log('BK5_KAUFKRAFTSTOPP '+JSON.stringify({completed:x.completed,stop:x.stop,
  hhEnd:x.s.owners[H].cash,stationCash:x.s.owners[S].cash}));
});
test('BK5: deterministischer 20h-Kreislauf in Seed 7,42 mit exakter Geld-/Warenerhaltung',()=>{
 for(const seed of [7,42]){
  const a=simulate({seed}),b=simulate({seed});
  assert.equal(core.hash(a.s),core.hash(b.s));
  assert.deepEqual(a.log,b.log);
  assert.equal(a.completed,20);
  audit(a.s);audit(b.s);
 }
});
test('BK5: echte Startup-Frachterpaare auch nach Reisearbeit auf Profitabilitaet pruefen',()=>{
 const s=core.createState(42,r);
 let inspect=0,underpriced=0,loss=0;const examples=[];
 for(const ship of Object.values(s.ships)){
  if(ship.klasse!=='frachter'||ship.auftrag!=='handeln'||ship.phase!=='dock')continue;
  const station=r.world.systems[ship.system].station;
  const chosen=choose(s,r,ship,station);
  if(!chosen)continue;
  const tt=route(r.world,ship.system,r.world.stations[chosen.ziel].system);
  assert(tt?.zeit>0);
  const wage=Math.floor(r.world.betriebskosten.frachter*tt.zeit/r.economy.stunde);
  const net=chosen.gewinn-wage;
  inspect++;
  if(net<=0)underpriced++;
  if(net<0)loss+=-net;
  examples.push({ship:ship.id,owner:ship.owner,from:station,to:chosen.ziel,
   ware:chosen.ware,qty:chosen.menge,grossMarginAfterFees:chosen.gewinn,
   flightMinutes:tt.zeit,actualLaborDue:wage,netBeforeReplacement:net});
 }
 assert(inspect>0,'bestehende Frachter starten mit mindestens einer Route');
 assert(examples.every(x=>Number.isSafeInteger(x.netBeforeReplacement)));
 console.log('BK5_TRANSPORT_VOLLKOSTEN '+JSON.stringify({startupTrades:inspect,
   routesNotCoveringOperatingLabor:underpriced,
   aggregateNegativeWorkingMargin:loss,examples}));
});

test('BK5: Rueckleitung von Betriebskosten ist eine notwendige Hypothese - ohne sie fehlen 27 ISK/Stunde',()=>{
 const x=simulate({fundPaysWork:false});
 assert.equal(x.completed,20);
 assert.equal(x.s.owners[H].cash,900-27*20);
 assert.equal(x.s.owners[F].cash-x.start.fund,(15+3)*20);
 assert.equal(x.s.owners[M].cash-x.start.miner,120);
 assert.equal(x.s.owners[S].cash-x.start.station,60);
 audit(x.s);
 console.log('BK5_OHNE_ARBEITSLOHN '+JSON.stringify({
  hours:20,household: x.s.owners[H].cash,
  fundSavings:x.s.owners[F].cash-x.start.fund,householdLossPerHour:27}));
});
test('BK5: main-Core hat keine Eigenlohnauszahlung - ohne zusaetzliche Haushaltseinkuenfte endet Konsum sofort bei endlichem Startgeld',()=>{
 const x=simulate({fundPaysWork:false,companyPaysIncome:false,hours:20});
 assert(x.completed<20);
 assert.equal(x.stop?.reason,'kaufkraft');
 assert(x.stop.hour>1);
 assert(x.s.owners[H].cash<x.stop.price);
 audit(x.s);
 console.log('BK5_OHNE_JEDEN_HAUSHALTSLOHN '+JSON.stringify({
  completed:x.completed,stop:x.stop,haushaltEnde:x.s.owners[H].cash}));
});
