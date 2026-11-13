// K10 [ANALYSE] – dritter und folgende INDUSTRIELLE Folgeauftraege
// nach einem bereits echt abgeschlossenen K9-50-Erz/W4/W5-Bauzyklus.
// Keine neuen Regeln, keine Ersatzbuchungen, keine Geldschöpfung, keine Teleports.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const gesamt=s=>Object.values(s.owners).reduce((v,o)=>v+o.cash,0);
function pruefe(w,s,phase){
  const a=w.audit(s);
  assert.equal(a.ok,true,phase+' '+JSON.stringify(a.fehler));
  assert.equal(gesamt(s),33000,phase+' unveränderte ISK-Gesamtmenge');
  assert.equal(s.minted,0); assert.equal(s.burned,0);
}
function befehl(w,s,cmd){
  const r=w.execute(s,cmd);
  assert.equal(r.ok,true,JSON.stringify({cmd,tick:s.tick,reason:r.reason}));
  return r;
}
function unterschreiben(w,s,miner='sh004',frachter='sh020'){
  for(const cmd of [
    {type:'industrialOreOffer',owner:'st_nadir',miner,frachter},
    {type:'industrialOreAcceptMine',owner:'npc3'},
    {type:'industrialOreAcceptFreight',owner:'transport'},
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreCommit',owner:'st_nadir'}
  ])befehl(w,s,cmd);
}
function bauUndKauf(w,s,anfang,kaufLimit){
  if(s.stations.st_nadir.lager.erz>=10 && !s.w4.auftrag
    && s.w4.materialErzeugt-anfang.material<5){
    const q=w.kern.pilotW4Kalkulation(s);
    if(q.ok)befehl(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  }
  if(s.w4.materialErzeugt-anfang.material>=5 && !s.w5.auftrag
    && !s.kanon.industrieErz.werftVerwendet
    && s.stations.st_nadir.lager.material>=5)
    befehl(w,s,{type:'industrialOreBuildShip',owner:'werft_extern'});
  if(!s.kanon.industrieErz.werftVerwendet||s.w5.fertig<=anfang.fertig)return;
  // Das W5-Verkaufsbuch enthält historische Frachter-IDs. Die jüngste ID
  // kann also ein ALTES Schiff sein, während ein NEUER Frachter nur im
  // Stationslager liegt. Vor dem Kauf ausschließlich den echten
  // Produktions-/Verkaufszähler und physischen Bestand prüfen.
  const unverkauft=s.w5.fertig-s.w5.verkauft;
  if(s.w5.verkauft-anfang.verkauft<kaufLimit && unverkauft>0
    && (s.stations.st_nadir.lager.frachter||0)>=1
    &&s.owners.transport.cash>=w.rules.w5.verkaufsPreis)
    befehl(w,s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  if(s.w5.verkauft<=anfang.verkauft)return;
  const neu=s.w5.schiffIds.at(-1),sh=s.ships[neu];
  if(sh&&sh.owner==='transport'&&sh.system==='nadir'&&sh.phase==='dock'
    &&sh.auftrag==='halten'){
    const q=w.kern.pilotW5TransferKalkulation(s,neu);
    if(q.ok)befehl(w,s,{type:'shipReposition',owner:'transport',schiff:neu});
  }
}
function ersterErfolg(seed,politik={},kaufLimit=1){
  const {terminalSave}=k6Start(seed);
  const {welt:w,zustand:s}=Welt.ausRegel199K7(terminalSave);
  if(Object.keys(politik).length)w.politikSetzen(s,politik);
  const anfang={mined:s.ledger.erz.mined,geliefert:s.w3.geliefert,
    material:s.w4.materialErzeugt,fertig:s.w5.fertig,verkauft:s.w5.verkauft,kauf:s.w3.kaufAusgaben};
  unterschreiben(w,s);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(s.owners.k7_werft_treuhand.cash,530);
  for(let n=0;n<600;n++){
    w.minute(s);
    bauUndKauf(w,s,anfang,kaufLimit);
    if(n%60===0)pruefe(w,s,'K8-Vorgeschichte '+n);
  }
  pruefe(w,s,'K8 erster Vertrag');
  assert.equal(s.w3.geliefert-anfang.geliefert,50,'erster Original-W3-Erztransport');
  assert.equal(s.ledger.erz.mined-anfang.mined,50,'50 bezahlte, physische Erz');
  assert.ok(s.w4.materialErzeugt-anfang.material>=5,'Originalraffinerie');
  assert.ok(s.w5.fertig-anfang.fertig>=1,'originaler Werftbau');
  assert.equal(s.w5.verkauft-anfang.verkauft,kaufLimit,'nur tatsächlich vorhandene Hüllen zum vollständigen Originalpreis gekauft');
  const ersatzId=s.w5.schiffIds.at(-1),ersatz=s.ships[ersatzId];
  assert.ok(ersatz&&ersatz.owner==='transport','realer Eigentumsübergang des Neubaus');
  assert.ok(s.w5ac.completed.some(x=>x.id===ersatzId),'Neubau gegen bezahlte Arbeit nach Aldera überführt');
  assert.equal(s.w3.kaufAusgaben-anfang.kauf,740,'Originalkäufer nur einmal belastet');
  assert.equal(s.kanon.industrieErz.phase,'geliefert');
  assert.equal(s.owners.k7_werft_treuhand.cash,0);
  return {w,vorlage:w.save(s),anfang};
}
function angebotVersuchen(w,s){
  const miner=Object.keys(s.ships).sort().filter(id=>s.ships[id].klasse==='miner'&&s.ships[id].owner==='npc3');
  const frachter=Object.keys(s.ships).sort().filter(id=>s.ships[id].klasse==='frachter'&&s.ships[id].owner==='transport');
  const fehlgruende=new Map();
  for(const mi of miner)for(const fr of frachter){
    const vorher=w.canonical(s);
    const result=w.execute(s,{type:'industrialOreOffer',owner:'st_nadir',miner:mi,frachter:fr});
    if(result.ok)return {miner:mi,frachter:fr,fehlgruende:Object.fromEntries(fehlgruende)};
    assert.equal(w.canonical(s),vorher,'ungedecktes Angebot muss atomar bleiben');
    fehlgruende.set(result.reason,(fehlgruende.get(result.reason)||0)+1);
  }
  return {miner:null,frachter:null,fehlgruende:Object.fromEntries(fehlgruende)};
}

for (const seed of [42,7]) {
  test('K10 Seed '+seed+': dritter und weitere echte Industrie-Erz-/W4-/W5-Zyklen',
    {timeout: 16*60*1000}, () => {
    const {w,vorlage,anfang}=ersterErfolg(seed,{ersatzkauf:false},3);
    const s=w.load(vorlage);
    const reg=w.rules;
    assert.equal(s.w5.verkauft-anfang.verkauft,3);
    const firstNames=s.w5.schiffIds.slice(-3);
    for(const id of firstNames){
      assert.equal(s.ships[id]?.owner,'transport','K9: gekaufte Hülle im Eigentum');
      assert.ok(s.w5ac.completed.some(x=>x.id===id),'K9: alle drei Hüllen echt bezahlt überführt');
    }
    // Nur rechtmäßige Eigentümer-/Politikaktionen; kein künstlicher Zuschuss.
    w.politikSetzen(s,{eisfracht:false});
    for(const sh of Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner')){
      if(!s.kanon.pendel[sh.id])continue;
      const vor=w.canonical(s),res=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:sh.id});
      if(!res.ok)assert.equal(w.canonical(s),vor,'K9: Ablehnung nur atomar');
    }
    pruefe(w,s,'K9 erste Kette');
    const secondBase={erz:s.ledger.erz.mined,geliefert:s.w3.geliefert,
      w3Kauf:s.w3.kaufAusgaben,w4Material:s.w4.materialErzeugt,
      w4Erz:s.w4.erzVerbraucht,w4Lohn:s.w4.gezahlt,
      w5Fertig:s.w5.fertig,w5Verkauft:s.w5.verkauft,
      w5Material:s.w5.materialVerbraucht,w5Lohn:s.w5.arbeitsGezahlt,
      frachterProduziert:s.ledger.frachter.produced, frachterVerbraucht:s.ledger.frachter.consumed};
    let angebot=null;
    for(let n=0;n<=360&&!angebot;n++){
      let result=angebotVersuchen(w,s);
      if(result.miner)angebot=result;
      else if(n<360)w.minute(s);
    }
    assert.ok(angebot,'K9: kein zweites echtes, verfügbares Werft-/Miner-/Frachtangebot');
    assert.equal(angebot.miner,'sh004','bekanntes im Dock verfügbares NPC-Eigentum');
    for(const [type,owner] of [
      ['industrialOreAcceptMine','npc3'],
      ['industrialOreAcceptFreight','transport'],
      ['industrialOreAcceptYard','werft_extern']
    ])befehl(w,s,{type,owner});
    const kaufVor=s.owners.st_nadir.cash;
    befehl(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
    assert.equal(s.w3.kaufAusgaben-secondBase.w3Kauf,740,'W3-Preis nur bei Vorbestellung');
    assert.equal(s.owners.st_nadir.cash,kaufVor-740,'K9 echter Industriekäufer zahlt');
    assert.equal(s.owners.w3_kauf_treuhand.cash,740);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
    assert.equal(s.owners.k7_werft_treuhand.cash,530,'zweite Werftzusage aus eigener Kasse');
    pruefe(w,s,'K9 zweite Vorbestellung');

    // Kein frühes Material- oder Hüllenerfinden: W1 und W3 müssen erst
    // den gesamten zweiten Vertrag im Original-Core abrechnen.
    let geliefert=false;
    for(let n=0;n<500;n++){
      w.minute(s);
      if(n%60===0)pruefe(w,s,'K9 zweiter Transport '+n);
      if(s.w3.geliefert===secondBase.geliefert+50 &&
        s.w3.auftrag===null && s.kanon.industrieErz.phase==='geliefert'){
        geliefert=true;break;
      }
    }
    assert.ok(geliefert,'K9: zweite physische Erzlieferung muss tatsächlich ankommen');
    assert.equal(s.ledger.erz.mined-secondBase.erz,50,'zweite W1-Lohnförderung');
    assert.equal(s.w3.kaufAusgaben-secondBase.w3Kauf,740,'keine doppelte Käuferbindung');
    assert.equal(s.kanon.industrieErz.werftVerwendet,false);
    assert.equal(s.owners.k7_werft_treuhand.cash,530);
    pruefe(w,s,'K9 zwei Erzlieferungen');
    const savedDelivery=w.save(s);
    assert.equal(w.hash(w.load(savedDelivery)),w.hash(s),'K9 nach Lieferung bitgleiches Save');

    // W5 darf ohne wirklich produziertes Original-W4-Material nicht starten.
    if((s.stations.st_nadir.lager.material||0)<reg.w5.material){
      const vor=w.canonical(s);
      const q=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
      assert.equal(q.ok,false,'K9 verbietet W5-Bau mit fehlendem Originalmaterial');
      assert.equal(w.canonical(s),vor,'K9 kein Geld oder Ware nach Fehlversuch');
    }

    const materialNeed=reg.w5.material,chargeErz=reg.w4.erzJeCharge;
    let minuten=0,auftraege=0;
    while(s.w4.materialErzeugt-secondBase.w4Material<materialNeed&&minuten<360){
      if(!s.w4.auftrag &&
         (s.stations.st_nadir.lager.erz||0)>=chargeErz){
        const q=w.kern.pilotW4Kalkulation(s);
        if(q.ok){
          befehl(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
          auftraege++;
        }
      }
      w.minute(s);minuten++;
      if(minuten%20===0)pruefe(w,s,'K9 zweite Raffinerie '+minuten);
    }
    const chargen=materialNeed/reg.w4.materialJeCharge;
    assert.ok(Number.isInteger(chargen),'K9: Originalrezept muss volle Chargen abbilden');
    assert.equal(auftraege,chargen,'nur aus eigenen bezahlten W4-Originalaufträgen');
    assert.equal(s.w4.materialErzeugt-secondBase.w4Material,materialNeed);
    assert.equal(s.w4.erzVerbraucht-secondBase.w4Erz,chargen*chargeErz,
      'kein Phantom-Erz, originale W4-Materialrezeptur');
    assert.equal(s.w4.gezahlt-secondBase.w4Lohn,chargen*reg.w4.dauer*reg.w4.lohnJeMinute,
      'jede W4-Arbeitsminute bezahlt');
    assert.equal(s.ledger.erz.consumed,s.w4.erzVerbraucht);
    assert.equal(s.ledger.material.produced,s.w4.materialErzeugt);
    assert.ok((s.stations.st_nadir.lager.material||0)>=materialNeed);
    pruefe(w,s,'K9 zweite echte Materialcharge');

    // Signierte 530-ISK-Zusage ausschließlich einmal einlösen, erst NACH
    // der physischen zweiten W3-Lieferung und W4-Originalproduktion.
    let w5Started=false;
    for(let n=0;n<200&&!w5Started;n++){
      if(!s.w5.auftrag&&!s.kanon.minerWerft?.auftrag){
        const vor=w.canonical(s);
        const q=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
        if(q.ok)w5Started=true;
        else {
          assert.equal(w.canonical(s),vor,'abgelehnte zweite W5-Zusage atomar');
          throw Error('K9 zweiter W5-Baubeginn '+q.reason);
        }
      }
      if(!w5Started)w.minute(s);
    }
    assert.ok(w5Started,'K9 kein rechtmäßiger zweiter W5-Werftstart');
    assert.equal(s.kanon.industrieErz.werftVerwendet,true);
    assert.equal(s.owners.k7_werft_treuhand.cash,0,'Werftgeld nur einmal freigegeben');
    const repeat=w.canonical(s),again=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
    assert.equal(again.ok,false,'doppelte Werftzusage strikt blockiert');
    assert.equal(w.canonical(s),repeat);
    let bauMinuten=0;
    while(s.w5.fertig===secondBase.w5Fertig&&bauMinuten<120){
      w.minute(s);bauMinuten++;
      if(bauMinuten%15===0)pruefe(w,s,'K9 zweiter W5-Bau');
    }
    assert.equal(s.w5.fertig-secondBase.w5Fertig,1,'zweiter Original-W5-Neubau');
    assert.equal(s.ledger.frachter.produced-secondBase.frachterProduziert,1,
      'genau eine weitere neue physische Hülle');
    assert.equal(s.w5.materialVerbraucht-secondBase.w5Material,materialNeed);
    assert.equal(s.w5.arbeitsGezahlt-secondBase.w5Lohn,reg.w5.dauer*reg.w5.lohnJeMinute);
    assert.ok((s.stations.st_nadir.lager.frachter||0)>=1,'physische Hülle im Werftlager');
    assert.equal(s.w5.verkauft,secondBase.w5Verkauft,'kein automatischer Gratisverkauf');
    pruefe(w,s,'K9 zweite Werft fertig');

    // Wirklicher Kauf zu Originalpreisen und finanzierte Nadir->Aldera-Fahrt.
    const transportVor=s.owners.transport.cash,werftVor=s.owners.werft_extern.cash;
    const kaufPreis=reg.w5.verkaufsPreis;
    befehl(w,s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
    assert.equal(s.owners.transport.cash,transportVor-kaufPreis);
    assert.equal(s.owners.werft_extern.cash,werftVor+kaufPreis);
    assert.equal(s.w5.verkauft-secondBase.w5Verkauft,1);
    const neu=s.w5.schiffIds.at(-1),sh=s.ships[neu];
    assert.ok(sh&&sh.owner==='transport'&&sh.system==='nadir'&&sh.phase==='dock');
    assert.ok(!firstNames.includes(neu),'K9: tatsächlicher neuer Schiffskörper, keine Doppel-ID');
    const quote=w.kern.pilotW5TransferKalkulation(s,neu);
    assert.equal(quote.ok,true,quote.grund);
    const vorFlug={transport:s.owners.transport.cash,
      escrow:s.owners[reg.w5Transfer.reserved].cash,
      allocated:s.w5ac.allocated,paid:s.w5ac.paid};
    befehl(w,s,{type:'shipReposition',owner:'transport',schiff:neu});
    assert.equal(s.owners.transport.cash,vorFlug.transport-quote.kosten,
      'K9: tatsächlicher Besitzer sichert Fluglohn vor Start');
    assert.equal(s.owners[reg.w5Transfer.reserved].cash,vorFlug.escrow+quote.kosten,
      'K9: vorfinanzierte Original-Flugtreuhand');
    assert.equal(s.w5ac.allocated,vorFlug.allocated+quote.kosten);
    let reise=0;
    while((s.ships[neu].system!=='aldera'||s.ships[neu].phase!=='dock')&&reise<120){
      w.minute(s);reise++;
    }
    assert.equal(reise,quote.minuten,'Original-Überführung ohne Teleport');
    const belegt=s.w5ac.completed.find(x=>x.id===neu);
    assert.ok(belegt,'bezahlte Überführung verbucht');
    assert.equal(belegt.kosten,quote.kosten,'Original-Flugbeleg mit echten Kosten');
    assert.equal(belegt.minuten,quote.minuten,'Flugbeleg ohne Teleport');
    assert.equal(s.w5ac.paid,vorFlug.paid+quote.kosten,
      'K9: alle Fluglohnminuten einzeln aus Treuhand bezahlt');
    assert.equal(s.owners[reg.w5Transfer.reserved].cash,0,'nach Überführung kein Restbetrag');
    assert.equal(s.ships[neu].owner,'transport');
    assert.equal(s.ledger.frachter.consumed-secondBase.frachterVerbraucht,1, 'genau eine gekaufte Hülle verbraucht');
    pruefe(w,s,'K9 zweite W5-Hülle einsatzbereit');

    // K10 startet ausdruecklich nach den 130 simulierten K9-Nachminuten,
    // in einem GEPRUEFTEN, nicht zurechtgebuchten zweiten Neubau-Endzustand.
    for(let i=0;i<130;i++)w.minute(s);
    pruefe(w,s,'K10 realer K9-Endzustand');

    const startHash=w.hash(s),startTick=s.tick;
    const serien=[];
    for(let nummer=3;nummer<=8;nummer++){
      const before=w.save(s),vorHash=w.hash(s),z=cycle(w,s,nummer);
      pruefe(w,s,'K10 Zyklus '+nummer+' Abschluss');
      assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'K10 Save/Load');
      assert.equal(z.cashTotal,33000);
      assert.equal(z.minted,0);assert.equal(z.burned,0);
      serien.push(z);
      console.log('K10_ZYKLUS '+JSON.stringify({seed,...z}));
      if(z.status!=='komplett'){
        // Im negativen Testfall MUSS der unveraenderte Original-Kern
        // seine Konten, Ware, Schiffe und Treuhand weiter korrekt bilanzieren.
        assert.equal(w.audit(s).ok,true);
        break;
      }
      assert.ok(w.hash(s)!==vorHash,'K10: echte neue Wirtschaftsvorgaenge');
      assert.ok(before.length>1000,'K10: kanonischer Original-Save');
    }
    const positiv=serien.filter(x=>x.status==='komplett').length;
    assert.ok(serien.length>=1);
    assert.equal(serien[0].number,3);
    assert.equal(serien[0].status,'komplett',
      'K10: dritter Erz-W4-W5-Vertrag muss real finanziert und vollständig ausgeliefert sein');
    assert.equal(serien[0].additionalOre,50);
    assert.equal(serien[0].additionalMaterial,5);
    assert.equal(serien[0].newHulls,1);
    assert.equal(serien[0].soldHulls,1);
    assert.equal(serien[0].ferryMinutes,60);
    assert.equal(positiv,4,'K10: Folgezyklen 3, 4, 5 und 6 wirklich verkauft');
    assert.equal(serien.at(-1).number,7,'K10: erster W5-Kaufengpass konkret in Runde 7');
    assert.equal(serien.at(-1).status,'frachter-kauf-gesperrt');
    assert.equal(serien.at(-1).kassenNachher.transport,736,
      'K10: Spedition fehlen beim originalen Kaufpreis exakt 14 ISK');
    const bruecke=liquiditaetsBruecke(w,w.load(w.save(s)));
    console.log('K10_BRUECKE '+JSON.stringify({seed,...bruecke}));
    assert.equal(bruecke.status,'kauf-nach-echter-w3-fracht',
      'K10: keine Rettungszahlung, nur eine neue bezahlte Charter kann die vorige Hülle refinanzieren');
    assert.equal(bruecke.zahlungVorher,736);
    assert.ok(bruecke.zahlungNachFracht>=750);
    assert.equal(bruecke.gekauft,1);
    assert.equal(bruecke.ueberfuehrung,60);
    assert.equal(bruecke.neueW5Produktion,1);
    assert.equal(bruecke.neueW5Verkaeufe,1,
      'W5-Sale nur für den VORHER unverkauften 7. Frachter');
    assert.equal(bruecke.lagerFrachter,2,
      '8. Bau ergänzt den bestehenden fungiblen Lagerbestand ohne Gratisverkauf');
    const saved=w.save(s),loaded=w.load(saved);
    for(let n=0;n<70;n++){w.minute(s);w.minute(loaded);}
    assert.equal(w.hash(s),w.hash(loaded),'K10: Wiederholung bis zur Finanzierungsgrenze');
    pruefe(w,s,'K10 deterministischer 70-Minuten-Replay');
    console.log('K10_BILANZ '+JSON.stringify({seed,startTick,endTick:s.tick,
      startHash,finalHash:w.hash(s),completed:positiv,cycles:serien.length,
      last:serien.at(-1),geld:gesamt(s),minted:s.minted,burned:s.burned}));
  });
}

function cycle(w,s,number) {
  const r=w.rules;
  const base={tick:s.tick,delivery:s.w3.geliefert,mined:s.ledger.erz.mined,
    material:s.w4.materialErzeugt,usedOre:s.w4.erzVerbraucht,
    w4Pay:s.w4.gezahlt,produced:s.w5.fertig,sold:s.w5.verkauft,
    w5Material:s.w5.materialVerbraucht,w5Pay:s.w5.arbeitsGezahlt,
    w3Spend:s.w3.kaufAusgaben,ships:s.w5.schiffIds.length,
    hullProd:s.ledger.frachter.produced,hullUsed:s.ledger.frachter.consumed,
    cash:{nadir:s.owners.st_nadir.cash,aldera:s.owners.st_aldera.cash,
      werft:s.owners.werft_extern.cash,transport:s.owners.transport.cash,
      miner:s.owners.npc3.cash}};
  const auditEnd=(status,reason=null,extra={})=>({
    number,status,reason,startTick:base.tick,endTick:s.tick,
    additionalOre:s.ledger.erz.mined-base.mined,
    oreDelivered:s.w3.geliefert-base.delivery,
    additionalMaterial:s.w4.materialErzeugt-base.material,
    w4ConsumedOre:s.w4.erzVerbraucht-base.usedOre,
    w4RealWages:s.w4.gezahlt-base.w4Pay,
    newHulls:s.w5.fertig-base.produced,soldHulls:s.w5.verkauft-base.sold,
    w5UsedMaterial:s.w5.materialVerbraucht-base.w5Material,
    w5RealWages:s.w5.arbeitsGezahlt-base.w5Pay,
    originalBuyerSpent:s.w3.kaufAusgaben-base.w3Spend,
    kassenVorher:base.cash,
    kassenNachher:{nadir:s.owners.st_nadir.cash,aldera:s.owners.st_aldera.cash,
      werft:s.owners.werft_extern.cash,transport:s.owners.transport.cash,
      miner:s.owners.npc3.cash},
    cashTotal:gesamt(s),minted:s.minted,burned:s.burned,
    hash:w.hash(s),...extra});
  // Bestehende Disponentenpolitik, keine neue Wirtschaftsregel.
  w.politikSetzen(s,{eisfracht:false});
  for(const sh of Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner')){
    if(!s.kanon.pendel[sh.id])continue;
    const before=w.canonical(s);
    const result=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:sh.id});
    if(!result.ok)assert.equal(w.canonical(s),before,'K10: bestehende NPC-Sperre darf kein Geld veraendern');
  }
  let offer=null,hints={};
  for(let n=0;n<=400&&!offer;n++){
    const result=angebotVersuchen(w,s);
    hints=result.fehlgruende;
    if(result.miner)offer=result;
    else if(n<400)w.minute(s);
    if(n%100===0)pruefe(w,s,'K10 Vertragsvorlauf '+number+' / '+n);
  }
  if(!offer)return auditEnd('angebot-gesperrt','kein rechtmäßig freies Industrie-Miner/Frachter-Angebot',{fehler:hints});
  // Jede Signatur ist EIN eigener Eigentümerakt, die Werft muss die
  // gesamte W5-Produktion aus ihrem Kapital decken koennen.
  for(const [type,owner] of [
    ['industrialOreAcceptMine','npc3'],
    ['industrialOreAcceptFreight','transport'],
    ['industrialOreAcceptYard','werft_extern']
  ]){
    const before=w.canonical(s);
    const result=w.execute(s,{type,owner});
    if(!result.ok){
      assert.equal(w.canonical(s),before,'K10: fehlgeschlagene Signatur ohne Buchung');
      befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
      return auditEnd('unterschrift-gesperrt',result.reason,{bei:type,fehler:hints});
    }
  }
  const buyerBefore=s.owners.st_nadir.cash,werftBefore=s.owners.werft_extern.cash;
  const before=w.canonical(s),committed=w.execute(s,{type:'industrialOreCommit',owner:'st_nadir'});
  if(!committed.ok){
    assert.equal(w.canonical(s),before,'K10: ungedeckte Zusage atomar abgewiesen');
    befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
    return auditEnd('commit-gesperrt',committed.reason,{fehler:hints});
  }
  assert.equal(s.owners.st_nadir.cash,buyerBefore-740);
  assert.equal(s.owners.werft_extern.cash,werftBefore-530);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(s.owners.k7_werft_treuhand.cash,530);
  assert.equal(s.w3.kaufAusgaben-base.w3Spend,740);
  pruefe(w,s,'K10 korrekte Drittvertragsbindung '+number);
  let lieferZeit=0;
  while(s.w3.geliefert<base.delivery+50&&lieferZeit<700){
    w.minute(s);lieferZeit++;
    if(lieferZeit%80===0)pruefe(w,s,'K10 echte W3-Fahrt '+number);
  }
  if(s.w3.geliefert!==base.delivery+50||s.w3.auftrag!==null
      ||s.kanon.industrieErz.phase!=='geliefert'){
    // Wenn der Rückflug nicht vollendet ist, warten wir weitere Originalminuten.
    for(let n=0;n<200 && s.w3.auftrag!==null;n++)w.minute(s);
  }
  if(s.w3.geliefert!==base.delivery+50||s.w3.auftrag!==null
      ||s.kanon.industrieErz.phase!=='geliefert')
    return auditEnd('transport-unvollstaendig','Original-W3-Gate innerhalb 900 Minuten nicht abgeschlossen',{lieferZeit});
  assert.equal(s.ledger.erz.mined-base.mined,50);
  assert.equal(s.kanon.industrieErz.werftVerwendet,false);
  assert.equal(s.owners.k7_werft_treuhand.cash,530);
  // W4 produziert unter dem Originalrezept und mit echtem Arbeitsbudget.
  if((s.stations.st_nadir.lager.erz||0)<r.w4.erzJeCharge)
    return auditEnd('erz-fehlt','kein realer W4-Rohstoff im Nadir-Lager');
  let quote=w.kern.pilotW4Kalkulation(s);
  if(!quote.ok)return auditEnd('w4-finanzierung-gesperrt',quote.grund);
  befehl(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  for(let n=0;n<=r.w4.dauer;n++){
    if(!s.w4.auftrag)break;
    w.minute(s);
  }
  assert.equal(s.w4.materialErzeugt-base.material,r.w4.materialJeCharge);
  assert.equal(s.w4.erzVerbraucht-base.usedOre,r.w4.erzJeCharge);
  assert.equal(s.w4.gezahlt-base.w4Pay,r.w4.dauer*r.w4.lohnJeMinute);
  pruefe(w,s,'K10 W4 real bezahlt '+number);
  // Keine W5-Produktion, falls altes Material oder Werftkapital fehlt.
  const beforeBuild=w.canonical(s),built=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
  if(!built.ok){
    assert.equal(w.canonical(s),beforeBuild,'K10: fehlender Material- oder Werftbestand ohne Umbuchung');
    return auditEnd('w5-bau-gesperrt',built.reason);
  }
  assert.equal(s.owners.k7_werft_treuhand.cash,0);
  assert.equal(s.kanon.industrieErz.werftVerwendet,true);
  const noDouble=w.canonical(s),dup=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
  assert.equal(dup.ok,false);assert.equal(w.canonical(s),noDouble);
  for(let n=0;n<=r.w5.dauer;n++){
    if(!s.w5.auftrag)break;
    w.minute(s);
  }
  assert.equal(s.w5.fertig-base.produced,1);
  assert.equal(s.w5.materialVerbraucht-base.w5Material,r.w5.material);
  assert.equal(s.w5.arbeitsGezahlt-base.w5Pay,r.w5.dauer*r.w5.lohnJeMinute);
  assert.equal(s.ledger.frachter.produced-base.hullProd,1);
  assert.equal(s.w5.verkauft-base.sold,0,'K10 keine unfinanzierte automatische Werftabnahme');
  pruefe(w,s,'K10 neue Huelle real bezahlt '+number);
  const funds=s.owners.transport.cash;
  const beforeBuy=w.canonical(s),buy=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  if(!buy.ok){
    assert.equal(w.canonical(s),beforeBuy);
    return auditEnd('frachter-kauf-gesperrt',buy.reason);
  }
  assert.equal(s.owners.transport.cash,funds-r.w5.verkaufsPreis);
  assert.equal(s.w5.verkauft-base.sold,1);
  const id=s.w5.schiffIds.at(-1),ship=s.ships[id];
  assert.ok(ship&&ship.owner==='transport'&&ship.system==='nadir'&&ship.phase==='dock');
  const ferry=w.kern.pilotW5TransferKalkulation(s,id);
  if(!ferry.ok)return auditEnd('ueberfuehrung-gesperrt',ferry.grund,{ship:id});
  const beforeFerry=s.owners.transport.cash;
  befehl(w,s,{type:'shipReposition',owner:'transport',schiff:id});
  assert.equal(s.owners.transport.cash,beforeFerry-ferry.kosten);
  assert.equal(s.owners[r.w5Transfer.reserved].cash,ferry.kosten);
  let minutes=0;
  while((s.ships[id].system!=='aldera'||s.ships[id].phase!=='dock')&&minutes<120){
    w.minute(s);minutes++;
  }
  assert.equal(minutes,ferry.minuten,'K10 Originalstrecke ohne Teleport');
  const rec=s.w5ac.completed.find(x=>x.id===id);
  assert.ok(rec&&rec.kosten===ferry.kosten&&rec.minuten===minutes);
  assert.equal(s.owners[r.w5Transfer.reserved].cash,0);
  assert.equal(s.ledger.frachter.consumed-base.hullUsed,1);
  assert.equal(s.ships[id].owner,'transport');
  return auditEnd('komplett',null,{ship:id,ferryMinutes:minutes,
    fighterFee:ferry.kosten,offer:{miner:offer.miner,freighter:offer.frachter},
    searchHints:hints});
}


/**
 * K10-Bruecke: Vermeidet jede verdeckte Kapitalzufuhr. Wenn das W5-Lager
 * nach dem siebten *wirklichen* Bau unverkauft ist, muss eine ACHTE echte
 * W1->W3-Leistung die Spedition mindestens um 14 ISK staerken; erst
 * dann darf sie eine VORHER physisch vorhandene Lagerhuelle kaufen und ueberfuehren.
 * Da W5 nur aggregiertes Lager besitzt, ist keine individuelle Chargen-ID
 * fuer den gekauften Frachter nachweisbar. Der 8. Bau wird separat bezahlt.
 */
function liquiditaetsBruecke(w,s){
  const r=w.rules,alt=s.w5.verkauft,altFertig=s.w5.fertig;
  const vor=s.owners.transport.cash,erz=s.ledger.erz.mined,
    liefer=s.w3.geliefert,material=s.w4.materialErzeugt;
  const end=(status,grund=null,extra={})=>({status,grund,
    zahlungVorher:vor,zahlungNachFracht:extra.zahlungNachFracht??s.owners.transport.cash,
    gekauft:s.w5.verkauft-alt,
    neueW5Produktion:s.w5.fertig-altFertig,
    neueW5Verkaeufe:s.w5.verkauft-alt,
    lagerFrachter:s.stations.st_nadir.lager.frachter||0,
    endTick:s.tick,erzExtra:s.ledger.erz.mined-erz,
    lieferExtra:s.w3.geliefert-liefer,
    materialExtra:s.w4.materialErzeugt-material,
    geld:gesamt(s),minted:s.minted,burned:s.burned,
    hash:w.hash(s),...extra});
  assert.ok(vor<r.w5.verkaufsPreis);
  assert.equal((s.stations.st_nadir.lager.frachter||0),2,
    'K10: echte zwei nicht verkaufte Werftrümpfe einschließlich älterer Lagerware');
  assert.equal(s.w5.fertig-s.w5.verkauft,2,'K10: unabhängig passendes W5-Lagerbuch');
  const vorNichtkauf=w.canonical(s);
  const abgewiesen=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(abgewiesen.ok,false,'K10: Geldmangel ist rechtlich bindend');
  assert.equal(w.canonical(s),vorNichtkauf,'K10: atomar abgelehnter Vorkauf');
  w.politikSetzen(s,{eisfracht:false});
  for(const sh of Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner')){
    if(!s.kanon.pendel[sh.id])continue;
    const canon=w.canonical(s),stop=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:sh.id});
    if(!stop.ok)assert.equal(w.canonical(s),canon);
  }
  let offer=null;
  for(let n=0;n<=400&&!offer;n++){
    const v=angebotVersuchen(w,s);
    if(v.miner)offer=v;
    else if(n<400)w.minute(s);
  }
  if(!offer)return end('acht-angebot-gesperrt','Kein weiterer Eigentümervertrag');
  for(const [type,owner] of [
    ['industrialOreAcceptMine','npc3'],
    ['industrialOreAcceptFreight','transport'],
    ['industrialOreAcceptYard','werft_extern']
  ]){
    const prev=w.canonical(s),v=w.execute(s,{type,owner});
    if(!v.ok){
      assert.equal(w.canonical(s),prev);
      befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
      return end('acht-unterschrift-gesperrt',v.reason);
    }
  }
  const prev=w.canonical(s),committed=w.execute(s,{type:'industrialOreCommit',owner:'st_nadir'});
  if(!committed.ok){
    assert.equal(w.canonical(s),prev);
    befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
    return end('acht-commit-gesperrt',committed.reason);
  }
  assert.equal(s.owners.k7_werft_treuhand.cash,530);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
  for(let n=0;n<600;n++){
    w.minute(s);
    if(n%100===0)pruefe(w,s,'K10 8. echter W3-Transport');
    if(s.w3.auftrag===null &&s.w3.geliefert===liefer+50&&
      s.kanon.industrieErz.phase==='geliefert')break;
  }
  if(s.w3.auftrag || s.w3.geliefert!==liefer+50 ||s.kanon.industrieErz.phase!=='geliefert')
    return end('acht-transport-unvollstaendig','Original-W3-Rueckweg noch offen');
  assert.equal(s.ledger.erz.mined-erz,50,'K10: keine fiktive achte Erzlieferung');
  assert.equal(s.stations.st_nadir.lager.frachter,2,'W5-Lager mit zwei bezahlten Hüllen belegt');
  const nachFracht=s.owners.transport.cash;
  if(nachFracht<r.w5.verkaufsPreis)
    return end('acht-transport-zu-wenig-lohn','Fracht bringt noch kein Kaufbudget',{zahlungNachFracht:nachFracht});
  const transportBefore=s.owners.transport.cash,yardBefore=s.owners.werft_extern.cash;
  befehl(w,s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(s.owners.transport.cash,transportBefore-r.w5.verkaufsPreis);
  assert.equal(s.owners.werft_extern.cash,yardBefore+r.w5.verkaufsPreis);
  assert.equal(s.w5.verkauft-alt,1);
  const id=s.w5.schiffIds.at(-1),sh=s.ships[id];
  assert.ok(sh&&sh.owner==='transport'&&sh.system==='nadir');
  const route=w.kern.pilotW5TransferKalkulation(s,id);
  assert.equal(route.ok,true,route.grund);
  const transportBeforeFlight=s.owners.transport.cash;
  befehl(w,s,{type:'shipReposition',owner:'transport',schiff:id});
  assert.equal(s.owners.transport.cash,transportBeforeFlight-route.kosten);
  assert.equal(s.owners[r.w5Transfer.reserved].cash,route.kosten);
  for(let n=0;n<120 && !s.w5ac.completed.some(x=>x.id===id);n++)w.minute(s);
  assert.ok(s.w5ac.completed.some(x=>x.id===id),'K10: 7. Schiff fliegt nach Eigentuemerwechsel');
  assert.equal(s.owners[r.w5Transfer.reserved].cash,0);
  assert.equal(s.ships[id].system,'aldera');
  pruefe(w,s,'K10 7. gekaufter Rumpf nach weiterem realen Charter');
  // Die ACHTE W5-Produktion erfordert ihre EIGENE unterschriebene Reserve
  // und neues echtes W4-Material. Eigentumszuordnung des verkauften
  // Lagerfrachter zu einem einzelnen historischen Bau wird nicht behauptet.
  const q=w.kern.pilotW4Kalkulation(s);
  if(!q.ok)return end('achte-w4-gesperrt',q.grund,{zahlungNachFracht:nachFracht,ueberfuehrung:route.minuten});
  befehl(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
  for(let n=0;n<=r.w4.dauer&&s.w4.auftrag;n++)w.minute(s);
  assert.equal(s.w4.materialErzeugt-material,5);
  befehl(w,s,{type:'industrialOreBuildShip',owner:'werft_extern'});
  for(let n=0;n<=r.w5.dauer&&s.w5.auftrag;n++)w.minute(s);
  assert.equal(s.w5.fertig-altFertig,1,'K10: auch 8. W5-Rumpf voll bezahlt gebaut');
  assert.equal(s.w5.verkauft-alt,1,'8. Rumpf darf nicht gratis ueberschrieben werden');
  assert.equal(s.stations.st_nadir.lager.frachter,2);
  assert.equal(s.w5.fertig-s.w5.verkauft,2);
  const beforeLast=w.canonical(s),again=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
  assert.equal(again.ok,false);
  assert.equal(w.canonical(s),beforeLast);
  pruefe(w,s,'K10 8. W5-Neubau legal gelagert, Kauf gesperrt');
  const hash=w.hash(s);
  assert.equal(w.hash(w.load(w.save(s))),hash,'K10: Brueckenstrategie save/load');
  const loaded=w.load(w.save(s));
  for(let n=0;n<50;n++){w.minute(s);w.minute(loaded);}
  assert.equal(w.hash(s),w.hash(loaded),'K10: nach Achter-Zyklus deterministisch');
  pruefe(w,s,'K10 Brueckenwiederholung');
  return end('kauf-nach-echter-w3-fracht',null,{zahlungNachFracht:nachFracht,
    ueberfuehrung:route.minuten,gekaufterRumpf:id,gekauft:1,
    anfangFehlbetrag:r.w5.verkaufsPreis-vor});
}
