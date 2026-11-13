// K9 [ANALYSE] – zweiter original finanzierter W4/W5-Bauzyklus
// aus der zweiten realen K8-50-Erzlieferung, ohne neue Wirtschaftsregeln.
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
  test('K9 Seed '+seed+': zweite Industrie-Erzfracht wird zu Material, zweiter W5-Huelle, Verkauf und Ueberfuehrung',
    {timeout: 12*60*1000}, () => {
    // K8-Krisenwelt mit einer ersten echten Industrieerzfracht und drei
    // freiwillig aus vorhandenen Beständen bezahlten und überführten Hüllen.
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
      frachterProduziert:s.ledger.frachter.produced};
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
    const quote=w.kern.pilotW5TransferKalkulation(s,neu);
    assert.equal(quote.ok,true,quote.grund);
    befehl(w,s,{type:'shipReposition',owner:'transport',schiff:neu});
    let reise=0;
    while((s.ships[neu].system!=='aldera'||s.ships[neu].phase!=='dock')&&reise<120){
      w.minute(s);reise++;
    }
    assert.equal(reise,quote.minutes,'Original-Überführung ohne Teleport');
    assert.ok(s.w5ac.completed.some(x=>x.id===neu),'bezahlte Überführung verbucht');
    assert.equal(s.ships[neu].owner,'transport');
    assert.equal(s.ledger.frachter.consumed-secondBase.w5Verkauft>=1,true);
    pruefe(w,s,'K9 zweite W5-Hülle einsatzbereit');
    const save=w.save(s),loaded=w.load(save),savedHash=w.hash(s);
    assert.equal(w.hash(loaded),savedHash);
    for(let n=0;n<130;n++){w.minute(s);w.minute(loaded);}
    assert.equal(w.hash(s),w.hash(loaded),'K9 deterministisches Replay nach zweitem W5-Kauf');
    pruefe(w,s,'K9 Replay');

    console.log('K9_ZWEITER_W5 '+JSON.stringify({seed,secondOre:50,
      oreDelivery:s.w3.geliefert-secondBase.geliefert,
      w4OriginalCharges:auftraege,w4Material:s.w4.materialErzeugt-secondBase.w4Material,
      w4ErzVerbraucht:s.w4.erzVerbraucht-secondBase.w4Erz,
      w5Built:s.w5.fertig-secondBase.w5Fertig,
      w5Sold:s.w5.verkauft-secondBase.w5Verkauft,ship:neu,
      ferryMinutes:reise,w3BuyerSpent:s.w3.kaufAusgaben-secondBase.w3Kauf,
      money:gesamt(s),minted:s.minted,burned:s.burned,hash:w.hash(s),
      cash:{werft:s.owners.werft_extern.cash,transport:s.owners.transport.cash,
        nadir:s.owners.st_nadir.cash,aldera:s.owners.st_aldera.cash,npc3:s.owners.npc3.cash}}));
  });
}
