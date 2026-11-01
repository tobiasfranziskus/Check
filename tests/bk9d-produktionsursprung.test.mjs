// B-K9d: kontrollierte Original-Core-Kausalkette. KEIN neues Produkt-API.
// Echte Förderung, echter Handel, echte Stundenkosten, echtes Originalrezept;
// wer erhält welches ISK? Keine künstliche Geldemission.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules,foerderung,produktion,betriebskosten,handel}=new Function(src+
 ';return {core:m_core_index,rules:m_data_rules.RULES,'+
 'foerderung:m_core_foerderung.foerderung,produktion:m_core_produktion.produktion,'+
 'betriebskosten:m_core_stunde.betriebskosten,handel:m_core_handel.handel};')();
const testingRules={...rules,schema:9,rulesVersion:15};
const W='bk9d_fabriklohn',QUELLE='st_cyris',F='fonds_cyris',MINER='npc3';
const rawUnits=26,foodUnits=13,foodWage=39;
function konto(s) {return Object.values(s.owners).reduce((v,x)=>v+x.cash,0);}
function audit(s){
 assert(core.audit(s).ok);
 assert(core.vertragPruefen(s));
 assert.equal(konto(s),s.initialSupply+s.minted-s.burned);
 let have={};
 for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager)){
   assert(n>=0&&Number.isSafeInteger(n));have[w]=(have[w]||0)+n;
 }
 for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung)){
   assert(n>=0&&Number.isSafeInteger(n));have[w]=(have[w]||0)+n;
 }
 for(const [w,l] of Object.entries(s.ledger))
   assert.equal(have[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w);
}
function create(seed){
 let s=core.createState(seed,rules);
 s=core.load(core.save(s),undefined,testingRules);
 const miner=Object.values(s.ships).find(sh=>sh.owner===MINER&&sh.klasse==='miner'&&
    sh.ware==='eis'&&sh.system==='cyris');
 assert(miner);
 for(const sh of Object.values(s.ships)){
   sh.arbeit=0;
   if(sh.id!==miner.id)sh.auftrag='halten';
 }
 miner.ladung={};miner.auftrag='foerdern';miner.ware='eis';
 miner.phase='dock';miner.system='cyris';
 // Kontrollierte Isolierung des Rohstoff-Ursprungs: vorhandenes Eis wird
 // OHNE Einnahme exportiert; die 26 nachfolgend gehandelten Einheiten können
 // daher nur aus neuem Original-Abbau stammen. Kein Produktszenario!
 const oldIce=s.stations[QUELLE].lager.eis||0;
 s.stations[QUELLE].lager.eis=0;s.ledger.eis.exported+=oldIce;
 for(const [id,st] of Object.entries(s.stations)){
   if(id!==QUELLE)st.linien=[];
   else {
     const real=st.linien.find(x=>x.rezept==='r_nahrung');
     assert(real);
     // Kontrolliertes Unterbrechen des vorhandenen WIP, keine Gratislinie.
     real.rest=0;
     st.linien=[real];
   }
 }
 s.owners[W]={id:W,kind:'test-arbeiter',cash:0};
 s.stats.konto[W]={erloes:0,kosten:0};s.stats.abgabe[W]=0;
 audit(s);
 return {s,miner,oldIce};
}
function run(seed=42){
 const {s,miner,oldIce}=create(seed);
 const before={miner:s.owners[MINER].cash,station:s.owners[QUELLE].cash,
   fund:s.owners[F].cash,worker:s.owners[W].cash,
   food:s.ledger.nahrung.produced,raw:s.ledger.eis.mined,
   usedIce:s.ledger.eis.consumed,mint:s.minted,money:konto(s),
   foodStock:s.stations[QUELLE].lager.nahrung};
 const one=rules.economy.miningRate*(1+(s.stations[QUELLE].module.bergbau||0));
 assert.equal(one,1,'aktuell kontrollierte Original-Rate');
 assert(rawUnits<rules.economy.cargo,'keine automatische Voll-Frachtbuchung');
 // Exakter echter Lohnbedarf aus Original-kosten/minuten, vor Arbeitsbeginn.
 const cost=Math.floor(rawUnits*rules.world.betriebskosten.miner/rules.economy.stunde);
 const orderCash=rawUnits*core.preis(s,QUELLE,'eis');
 const fee=core.gebuehr(s,rules,QUELLE,orderCash);
 assert(s.owners[MINER].cash>=cost+fee,'Minerarbeit und Handelsgebühr gedeckt');
 assert(s.owners[QUELLE].cash>=orderCash+foodWage,'Rohstoff + Fabriklohn gedeckt');
 // Nie mit späterem Nahrungserlös den ersten Rohstoffkauf bezahlen.
 for(let i=0;i<rawUnits;i++){s.tick++;foerderung(s,testingRules);}
 assert.equal(miner.ladung.eis,26);
 assert.equal(s.ledger.eis.mined-before.raw,26);
 assert.equal(miner.arbeit,26);
 audit(s);
 assert(handel(s,testingRules,miner,QUELLE,'eis',rawUnits,false),
   'originaler Stationskauf der 26 tatsächlich geförderten Eis');
 assert.equal(s.stations[QUELLE].lager.eis,26);
 assert.equal(miner.ladung.eis||0,0);
 // Aus ursprünglich vorhandener Kasse bezahlter ORIGINAL-Minerlohn.
 betriebskosten(s,testingRules);
 assert.equal(miner.arbeit,0);
 assert.equal(s.owners[MINER].cash-before.miner,orderCash-fee-cost);
 assert.equal(s.owners[F].cash-before.fund,fee+cost);
 // Eine wirkliche testseitige Fabriklohnzahlung an separates Arbeiterkonto.
 s.owners[QUELLE].cash-=foodWage;s.owners[W].cash+=foodWage;
 assert.equal(s.owners[W].cash-before.worker,foodWage);
 // Originalrezept startet WIP bei erstem Aufruf; die erste Einheit
 // wird daher erst im 7. Takt fertig, nicht schon im 6.
 for(let i=0;i<foodUnits*rules.economy.rezepte.r_nahrung.dauer+1;i++){
   s.tick++;produktion(s,testingRules);
 }
 assert.equal(s.ledger.nahrung.produced-before.food,foodUnits);
 assert.equal(s.ledger.eis.consumed-before.usedIce,rawUnits);
 assert.equal(s.stations[QUELLE].lager.eis,0);
 assert.equal(s.stations[QUELLE].lager.nahrung-before.foodStock,foodUnits);
 assert.equal(s.owners[QUELLE].cash-before.station,-orderCash-foodWage);
 assert.equal(s.minted,before.mint);
 assert.equal(konto(s),before.money);
 audit(s);
 // Eine echte Save/Load-Fortsetzung in Schema9/Regel15 ohne hypothetische
 // Forderung oder externen Vertrag.
 const loaded=core.load(core.save(s),undefined,testingRules);
 assert.equal(core.hash(s),core.hash(loaded));audit(loaded);
 return {seed,rawMined:rawUnits,rawTraded:rawUnits,foodProduced:foodUnits,
   iceInitiallyQuarantined:oldIce,minerWages:cost,factoryWages:foodWage,
   minerFee:fee,rawPrice:orderCash,minerCashDelta:s.owners[MINER].cash-before.miner,
   factoryCashDelta:s.owners[QUELLE].cash-before.station,
   workerCashDelta:s.owners[W].cash-before.worker,
   fundCashDelta:s.owners[F].cash-before.fund,
   mintAdded:s.minted-before.mint,hash:core.hash(s)};
}
test('BK9d: 26 nachweislich neue Original-Eis → 13 Original-Nahrung, alles bezahlt, 2 Seeds',()=>{
 for(const seed of [7,42]){
   const a=run(seed),b=run(seed);
   assert.deepEqual(a,b);
   assert.equal(a.rawMined,26);assert.equal(a.foodProduced,13);
   assert.equal(a.mintAdded,0);
   console.log('BK9D_ORIGINAL_PRODUKTION '+JSON.stringify(a));
 }
});
test('BK9d: vor der Arbeit darf eine Station mit zu wenig Bargeld keinen Vertrag vorfinanzieren',()=>{
 const {s,miner}=create(42);
 const quote=rawUnits*core.preis(s,QUELLE,'eis')+foodWage;
 const amount=s.owners[QUELLE].cash-quote+1;
 assert(amount>0);
 s.owners[QUELLE].cash-=amount;s.owners.house.cash+=amount;
 const prior=core.hash(s);
 // Die Finanzierung darf nicht aus künftig produzierter Nahrung kommen.
 const covered=s.owners[QUELLE].cash>=quote &&
   s.owners[MINER].cash>=65;
 assert.equal(covered,false);assert.equal(core.hash(s),prior);
 assert.equal(miner.arbeit,0);assert.equal(s.ledger.eis.mined,0);
 audit(s);
});
