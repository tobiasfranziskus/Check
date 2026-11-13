// K8 [ANALYSE] – prüft einen ZWEITEN finanzierbaren Industrie-Erzvertrag
// nach einer realen K7-50er-Erzlieferung und einem bezahlten Ersatzfrachter.
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
for(const seed of [42,7]){
  test('K8 Folgevertrag auf echter Krisenwelt Seed '+seed,
    {timeout:8*60*1000},()=>{
      const standard=ersterErfolg(seed);
      const varianten=[
        {modus:'NPC-Automatik / 1 Kauf',basis:standard,disposition:false},
        {modus:'Eigentuemer-Disposition / 1 Kauf',basis:standard,disposition:true}
      ];
      // Ausschließlich physisch vorhandene, zum Originalpreis bezahlte
      // Frachterkäufe – keine Überweisung oder bloß vorgemerkte Bestellung.
      for(const kaufLimit of [1,2,3,4,5])
        varianten.push({modus:'Ersatzkauf pausiert / '+kaufLimit+' Kauf',
          basis:ersterErfolg(seed,{ersatzkauf:false},kaufLimit),disposition:true});
      for(const versuch of varianten){
        const {w,vorlage,anfang}=versuch.basis,modus=versuch.modus;
        const s=w.load(vorlage),start=s.tick,geliefert=s.w3.geliefert;
        const kauf=s.w3.kaufAusgaben,beauftragt=s.w3.beauftragt;
        const ledger=s.ledger.erz.mined;
        if(versuch.disposition){
          // Nur vorhandene, dafür berechtigte Befehle; keine Geldänderung.
          w.politikSetzen(s,{eisfracht:false});
          for(const sh of Object.values(s.ships).filter(x=>x.owner==='npc3'&&x.klasse==='miner')){
            if(!s.kanon.pendel[sh.id])continue;
            const before=w.canonical(s);
            const res=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:sh.id});
            if(!res.ok)assert.equal(w.canonical(s),before);
          }
        }
        let auswahl=null,hinweis={},versucht=0;
        for(let n=0;n<=360&&!auswahl;n++){
          const a=angebotVersuchen(w,s);
          versucht++;
          hinweis=a.fehlgruende;
          if(a.miner)auswahl=a;
          else if(n<360)w.minute(s);
          if(n%60===0)pruefe(w,s,'K8 zweiten Auftrag suchen '+n);
        }
        let phase='kein-zweiter-vertrag',grund=null;
        if(auswahl){
          for(const typeOwner of [
            ['industrialOreAcceptMine','npc3'],
            ['industrialOreAcceptFreight','transport'],
            ['industrialOreAcceptYard','werft_extern']
          ]){
            const [type,owner]=typeOwner;
            const vor=w.canonical(s),res=w.execute(s,{type,owner});
            if(!res.ok){grund=type+': '+res.reason;assert.equal(w.canonical(s),vor);break;}
          }
          if(!grund){
            const vor=w.canonical(s),res=w.execute(s,{type:'industrialOreCommit',owner:'st_nadir'});
            if(res.ok){
              phase='zweitvertrag-finanziert';
              assert.equal(s.w3.kaufAusgaben-kauf,740,'auch zweiter Vertrag nur einmal 740 ISK');
              assert.equal(s.w3.beauftragt-beauftragt,1);
              assert.equal(s.owners.w3_kauf_treuhand.cash,740);
              assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
              assert.equal(s.owners.k7_werft_treuhand.cash,530);
              for(let i=0;i<500;i++){
                w.minute(s);
                if(i%60===0)pruefe(w,s,'K8 zweiter Originalauftrag '+i);
                if(s.w3.geliefert>=geliefert+50&&s.w3.auftrag===null)break;
              }
              if(s.w3.geliefert-geliefert===50){
                phase='zweitvertrag-erz-geliefert';
                assert.equal(s.ledger.erz.mined-ledger,50,'zweite reale Erzförderung');
              }else phase='zweitvertrag-noch-offen';
            }else {grund=res.reason;assert.equal(w.canonical(s),vor);}
          }
        }
        if(grund && s.kanon.industrieErz.phase==='angebot')
          befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
        pruefe(w,s,'K8 Abschlusssaldo');
        const gespeichert=w.save(s),geladen=w.load(gespeichert);
        assert.equal(w.hash(geladen),w.hash(s),'getrennter Regel200-Save/Load');
        for(let i=0;i<30;i++){w.minute(s);w.minute(geladen);}
        assert.equal(w.hash(s),w.hash(geladen),'K8 deterministische 30-Minuten-Replays');
        pruefe(w,s,'K8 Replay');
        console.log('K8_FOLGEVERTRAG '+JSON.stringify({seed,modus,phase,grund,
          startTick:start,endTick:s.tick,angebot:auswahl&&{miner:auswahl.miner,frachter:auswahl.frachter},
          letzteAngebotsgruende:hinweis,versucht,ersteLieferung:50,neuerErsatz:s.w5.schiffIds.at(-1),
          werftVerkaufNeu:s.w5.verkauft-anfang.verkauft,
          zweiteLieferung:s.w3.geliefert-geliefert,
          kaeuferBelastet:s.w3.kaufAusgaben-kauf,
          erzSeitVersuch:s.ledger.erz.mined-ledger,
          kassen:{nadir:s.owners.st_nadir.cash,aldera:s.owners.st_aldera.cash,
            spedition:s.owners.transport.cash,npc3:s.owners.npc3.cash,
            werft:s.owners.werft_extern.cash,export:s.owners.export.cash},
          geld:gesamt(s),minted:s.minted,burned:s.burned,hash:w.hash(s),
          werftEigner:s.owners.eigner_werft?.cash??null,
          minerWerft:s.kanon.minerWerft?{
            begonnen:s.kanon.minerWerft.begonnen??null,
            fertig:s.kanon.minerWerft.fertig??null,
            gebunden:s.kanon.minerWerft.auftrag!==null}:null}));
      }
  });
}
