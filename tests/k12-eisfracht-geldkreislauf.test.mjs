// K12 [ANALYSE]: tatsächliche Geldfluss- und 74-ISK-Lohnsperre aus K11-Krise.
// KEINE Core-/Produktregeln, keine Buchungen direkt, keine frei erfundene Kasse.
import test from 'node:test';
import assert from 'node:assert/strict';
import {k11K10Endstand} from '../tools/k11-k10-endstand.mjs';
const total=s=>Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
const audit=(w,s,label)=>{
  const a=w.audit(s);assert.equal(a.ok,true,label+': '+JSON.stringify(a.fehler));
  assert.equal(total(s),33000,label+': Weltgeld');assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(s.w5.fertig-s.w5.verkauft,s.stations.st_nadir.lager.frachter);
};
const snap=s=>({
  tick:s.tick,
  transportCash:s.owners.transport.cash,transportEarned:s.stats.konto.transport.erloes,
  transportSpent:s.stats.konto.transport.kosten,
  nadirCash:s.owners.st_nadir.cash,alderaCash:s.owners.st_aldera.cash,
  fondTransportCash:s.owners.fonds_transport.cash,icePilotCash:s.owners.pilot_eis.cash,
  transportShareholderCash:s.owners.eigner_transport.cash,
  transportPaidDividends:s.kanon.buch.summen['dividende|transport|eigner_transport']||0,
  waterRetailPaid:Object.entries(s.kanon.buch.summen).filter(([key])=>key.startsWith('wasser-einzelhandel|'))
    .reduce((sum,[,amount])=>sum+amount,0),
  waterSoldHouseholds:s.kanon.wasser.konsum,
  iceMinerCash:s.owners.npc3.cash,
  iceAtAldera:s.stations.st_aldera.lager.eis,iceAtNadir:s.stations.st_nadir.lager.eis,
  waterNadir:s.stations.st_nadir.lager.wasser,waterAldera:s.stations.st_aldera.lager.wasser,
  iceMined:s.ledger.eis.mined,icePaidMining:s.w5n.mineLohn,
  iceSoldToAldera:s.w5n.mineVerkauft,
  iceFreightCompleted:s.w5n.frachtAbgeschlossen,
  iceFreightRevenue:s.w5n.frachtUmsatz,
  waterProduced:s.w5n.wasserProduziert,
  waterSoldPilots:s.w5n.wasserErlos,
  oreDelivered:s.w3.geliefert,
  waresHeld:s.stations.st_nadir.lager.frachter,
  hullsOwned:Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter').length,
  worldMoney:total(s)
});
function realIceQuote(w,s){
  const id=Object.keys(s.ships).sort().find(k=>{
    const sh=s.ships[k];
    return sh.owner==='transport'&&sh.klasse==='frachter'
      &&sh.phase==='dock'&&sh.system==='aldera'&&sh.auftrag==='halten'
      &&Object.values(sh.ladung).every(n=>n===0);
  });
  assert.ok(id,'K12: bereits existierender freier Speditionsfrachter');
  const r=w.rules.w5n;const original={
    ship:id,customer:r.zielStation,
    legacyFund:r.kunde,
    goods:r.charge*r.eisPreis,
    freight:2*r.flugMinuten*r.frachtJeMinute,
    crew:2*r.flugMinuten*r.fliegerLohn
  };
  original.customerInvoice=original.goods+original.freight;
  original.customerAvailable=s.owners[original.customer].cash;
  original.carrierAvailable=s.owners[r.frachterOwner].cash;
  original.crewShortfall=Math.max(0,original.crew-original.carrierAvailable);
  original.customerShortfall=Math.max(0,original.customerInvoice-original.customerAvailable);
  return {id,original,quote:w.kern.pilotIceFreightQuote(s,id)};
}
for(const seed of [42,7]){
 test('K12 Seed '+seed+': realer Eisabnehmer ist Nadir; einzig Speditionsarbeitsfonds sperrt',
 {timeout:18*60*1000},()=>{
  const {welt:w,zustand:s}=k11K10Endstand(seed);
  audit(w,s,'K12 realer K10 Endstand');
  w.politikSetzen(s,{stilllegung:false,ersatzkauf:true,eisfracht:true});
  const start=snap(s);
  for(let n=0;n<720;n++){w.minute(s);if(n%120===0)audit(w,s,'K12 720 min '+n);}
  audit(w,s,'K12 Eisförderung und echter Kontenfluss');
  const end=snap(s);
  const q=realIceQuote(w,s),p=q.original;
  assert.equal(end.iceAtAldera,52,'K12 echter 50er Eisbestand, nicht simuliert');
  assert.equal(end.iceAtAldera-start.iceAtAldera,50);
  assert.equal(end.iceSoldToAldera-start.iceSoldToAldera,50);
  assert.equal(end.iceFreightCompleted,start.iceFreightCompleted,
    'keine rechtlose Abkürzung des Original-Frachtauftrags');
  assert.equal(end.waterProduced,start.waterProduced,
    'ohne physische Eislieferung kein zusätzliches Wasser');
  assert.equal(end.waterSoldPilots,start.waterSoldPilots,
    'kein neu produziertes Wasser für freien Verbraucherhandel');
  assert.equal(end.iceFreightRevenue,start.iceFreightRevenue,
    'keine unverdienten 240-ISK-Frachthonorare');
  assert.equal(end.transportPaidDividends,start.transportPaidDividends,
    'im Testfenster keine versteckte Reinvestition aus ausgeschüttetem Gewinn');
  assert.equal(end.waterRetailPaid,start.waterRetailPaid,
    'ohne zusätzlich hergestelltes Wasser auch kein neuer echter Wassermarktumsatz');
  assert.ok(Number.isSafeInteger(end.transportPaidDividends));
  assert.ok(Number.isSafeInteger(end.waterRetailPaid));
  assert.equal(end.transportPaidDividends,14613,
    'K12: Original-Firmengewinne wurden wirklich an ihren Eigentümer ausgeschüttet');
  assert.equal(end.transportShareholderCash,261,
    'K12: Eigentümergeld ist vorhanden, aber kein automatisch einzahlbarer Firmenbestand');
  assert.equal(end.waterRetailPaid,128158,
    'K12: kumulierte reale Wasserzahlungen sind nicht aktuelle Speditionsliquidität');
  assert.equal(end.transportCash,46);
  assert.equal(end.nadirCash,3440);
  assert.equal(end.fondTransportCash,0,'getrennte historische Lohnfondskasse');
  assert.equal(end.waresHeld,2,'kein kostenloser Schiffskauf');
  assert.equal(p.customer,'st_nadir');
  assert.equal(p.legacyFund,'fonds_transport');
  assert.notEqual(p.customer,p.legacyFund);
  assert.equal(p.goods,250);assert.equal(p.freight,240);
  assert.equal(p.crew,120);assert.equal(p.customerInvoice,490);
  assert.equal(p.customerAvailable,3440);
  assert.equal(p.customerShortfall,0,'Nadir besitzt Original-Käuferkapital');
  assert.equal(p.carrierAvailable,46);assert.equal(p.crewShortfall,74);
  assert.equal(q.quote.ok,false);
  assert.match(q.quote.grund,/Spedition kann Flugarbeit nicht vorfinanzieren/);
  const originalSave=w.canonical(s);
  const cmd=w.execute(s,{type:'shipFreightIce',owner:'transport',schiff:q.id});
  assert.equal(cmd.ok,false);
  assert.match(cmd.reason,/Flugarbeit nicht vorfinanzieren/);
  assert.equal(w.canonical(s),originalSave,'K12 ungedeckte 50er-Fracht atomar verweigert');
  // Keine unautorisierte Eigentuemereinlage: Die bestehende Dividende
  // erlaubt nur freie Ueberschuesse AN Eigentümer, niemals umgekehrt.
  const cashBefore=w.canonical(s);
  const d=w.execute(s,{type:'dividendPay',owner:'eigner_transport',betrag:74});
  assert.equal(d.ok,false,'K12: privater Anteilseigner kann kein Firmengeld durch Dividenden erzeugen');
  assert.equal(w.canonical(s),cashBefore);
  const reserve=w.ausschuettbar(s,'transport');
  assert.equal(reserve,0,'K12: aus knapper Firmenkasse kann kein rechtmäßiger Dividendenabfluss entstehen');
  // Reiner, ausdrücklich NICHT AUSGEFÜHRTER OPTIONEN-VERGLEICH:
  // Käufer-Nadir könnte 120 des bereits gedeckten 240er Frachttarifs
  // direkt als Crew-Vorschuss halten. Kein Originalbefehl dafür vorhanden.
  const hypothese={status:'NUR_RECHENMODELL_KEIN_CORE_BEFEHL',
    buyerTotal:p.customerInvoice,
    buyerPaysGoods:p.goods,
    freightToCrew:p.crew,
    freightAfterCrew:p.freight-p.crew,
    carrierCashBefore:p.carrierAvailable,
    carrierCashAfterPotentialService:p.carrierAvailable+p.freight-p.crew};
  assert.equal(hypothese.buyerTotal,
    hypothese.buyerPaysGoods+hypothese.freightToCrew+hypothese.freightAfterCrew);
  assert.equal(hypothese.carrierCashAfterPotentialService,166);
  const rekapitalisierungNurOption={
    status:'NUR_RECHENMODELL_KEIN_KAPITALEINLAGE_BEFEHL',
    shareholderCash:end.transportShareholderCash,
    freiwilligNoetigeEinlage:p.crewShortfall,
    shareholderCashDanach:end.transportShareholderCash-p.crewShortfall,
    transportKasseDanach:p.carrierAvailable+p.crewShortfall
  };
  assert.equal(rekapitalisierungNurOption.shareholderCashDanach,187);
  assert.equal(rekapitalisierungNurOption.transportKasseDanach,120);
  // Keine stillschweigende Einlage, weil der Originalkern gar keinen
  // autorisierten Gegenbuchungsbefehl fuer dieses Eigentümerrecht besitzt.
  const fake=w.execute(s,{type:'equityContribution',owner:'eigner_transport',
    company:'transport',amount:p.crewShortfall});
  assert.equal(fake.ok,false,'K12: kein erfundener Kapitalzuschuss durch unbekannten Befehl');
  // Die fehlende echte Anzahlung wird AUF KEIN KONTO gebucht.
  assert.equal(w.canonical(s),cashBefore);
  const json=w.save(s),again=w.load(json),startHash=w.hash(s);
  assert.equal(w.hash(again),startHash);
  for(let n=0;n<120;n++){w.minute(s);w.minute(again);}
  assert.equal(w.hash(s),w.hash(again),'K12 120-Minuten deterministisches Replay');
  audit(w,s,'K12 Replay');
  const out={seed,start,end,preis:p,
    originalQuote:q.quote.grund,
    atmRejected:cmd.reason,
    legalOwnerDividends:reserve,
    oldFundNeverCustomer:true,
    possibleAdvance: hypothese,possibleVoluntaryEquity:rekapitalisierungNurOption,
    money:total(s),minted:s.minted,burned:s.burned,referenceHash:w.hash(s)};
  console.log('K12_GELDKREIS '+JSON.stringify(out));
 });
}
