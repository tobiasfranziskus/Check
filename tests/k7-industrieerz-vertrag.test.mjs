// K7 positive Forschung: Original-K1/W1–W5-Welt mit EINER, dreifach signierten
// industriellen Erzvorbestellung und ausschließlich realer Finanzierung.
// Keine produktive Aktivierung; Forschung Regel200/Schema8, Seeds42+7.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const kassensumme=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const befehl=(w,s,cmd)=>{
  const before=w.canonical(s),r=w.execute(s,cmd);
  assert.equal(r.ok,true,JSON.stringify({cmd,reason:r.reason,tick:s.tick}));
  assert.notEqual(w.canonical(s),before,'jeder erfolgreiche Vertragsschritt muss echte Wirkung haben');
  return r;
};
const gesperrt=(w,s,cmd)=>{
  const before=w.canonical(s),r=w.execute(s,cmd);
  assert.equal(r.ok,false,'Originalrechtsverletzung akzeptiert: '+JSON.stringify(cmd));
  assert.equal(w.canonical(s),before,'abgelehnter Befehl muss vollständig atomar bleiben');
};
function audit(w,s,phase) {
  const a=w.audit(s);
  assert.equal(a.ok,true,phase+' Tick '+s.tick+': '+JSON.stringify(a.fehler));
  assert.equal(kassensumme(s),33000,phase+' kein neues ISK');
  assert.equal(s.minted,0); assert.equal(s.burned,0);
}
function k7Start(seed) {
  const {terminalSave,startHash}=k6Start(seed);
  const result=Welt.ausRegel199K7(terminalSave);
  assert.equal(result.quellHash,startHash);
  assert.equal(result.zustand.tick,21612);
  assert.equal(result.zustand.rulesVersion,200);
  assert.equal(result.zustand.schema,8);
  assert.equal(result.zustand.w3.storniert,0);
  audit(result.welt,result.zustand,'K7-Konversion');
  return result;
}
for(const seed of [42,7]){
  test('K7 Seed '+seed+': drei Eigentümerzustimmungen, 740-ISK-Treuhand und atomare Sperren',()=>{
    const {welt:w,zustand:s}=k7Start(seed);
    const base=w.hash(s);
    gesperrt(w,s,{type:'industrialOreOffer',owner:'house',miner:'sh004',frachter:'sh020'});
    gesperrt(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh020',frachter:'sh004'});
    assert.equal(w.hash(s),base);
    befehl(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh020'});
    gesperrt(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
    gesperrt(w,s,{type:'industrialOreAcceptMine',owner:'house'});
    gesperrt(w,s,{type:'industrialOreAcceptFreight',owner:'npc3'});
    befehl(w,s,{type:'industrialOreAcceptMine',owner:'npc3'});
    befehl(w,s,{type:'industrialOreAcceptFreight',owner:'transport'});
    gesperrt(w,s,{type:'industrialOreAcceptYard',owner:'house'});
    befehl(w,s,{type:'industrialOreAcceptYard',owner:'werft_extern'});
    const cashBefore={nadir:s.owners.st_nadir.cash,carrier:s.owners.transport.cash};
    befehl(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
    assert.equal(s.owners.st_nadir.cash,cashBefore.nadir-740);
    assert.equal(s.owners.transport.cash,cashBefore.carrier-120);
    assert.equal(s.owners.w3_kauf_treuhand.cash,740);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
    assert.equal(s.owners.k7_werft_treuhand.cash,530);
    assert.equal(s.owners.werft_extern.cash,0,'Werft darf zugesagte Rücklage nicht parallel für Miner ausgeben');
    assert.equal(s.w3.auftrag.phase,'vorbestellt');
    assert.equal(s.stations.st_aldera.lager.erz,0);
    assert.equal(s.ledger.erz.mined,2150,'die bis K4 real geförderten 2150 Erz bleiben unangetastet');
    audit(w,s,'nach Vorbestellung');
    gesperrt(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
    gesperrt(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh005',frachter:'sh020'});
    const save=w.save(s),laden=w.load(save);
    assert.equal(w.hash(laden),w.hash(s),'Treuhand in Save/Load identisch');
    assert.equal(laden.kanon.industrieErz.miner,'sh004');
    console.log('K7_BINDUNG '+JSON.stringify({seed,tick:s.tick,hash:w.hash(s),
      buyerReserve:s.owners.w3_kauf_treuhand.cash,crewReserve:s.owners.w3_arbeit_treuhand.cash}));
  });

  test('K7 Seed '+seed+': finanziertes Erz aus dem Feld bis 50er-W3-Rundfracht und W4/W5',()=>{
    const {welt:w,zustand:s}=k7Start(seed);
    for(const cmd of [
      {type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh020'},
      {type:'industrialOreAcceptMine',owner:'npc3'},
      {type:'industrialOreAcceptFreight',owner:'transport'},
      {type:'industrialOreAcceptYard',owner:'werft_extern'},
      {type:'industrialOreCommit',owner:'st_nadir'},
    ])befehl(w,s,cmd);
    let minedAt=null,dockAt=null,deliveredAt=null,roundAt=null,refinedAt=null,builtAt=null;
    const vorK7={mine:s.ledger.erz.mined,delivered:s.w3.geliefert,
      round:s.w3.abgeschlossen,refined:s.w4.materialErzeugt,
      built:s.w5.fertig,paid:s.w3.kaufAusgaben};
    let initialMined=vorK7.mine;
    let prevHash=w.hash(s);
    for(let n=0;n<1500;n++){
      w.minute(s);
      if(n%60===0) audit(w,s,'K7 Original-Core');
      if(!minedAt&&s.ledger.erz.mined>initialMined)minedAt=s.tick;
      if(!dockAt&&s.kanon.industrieErz.erzAngenommen)dockAt=s.tick;
      if(!deliveredAt&&s.w3.geliefert-vorK7.delivered>=50)deliveredAt=s.tick;
      if(!roundAt&&s.w3.abgeschlossen-vorK7.round>=1)roundAt=s.tick;
      if(!refinedAt&&s.w4.materialErzeugt-vorK7.refined>=5)refinedAt=s.tick;
      if(!builtAt&&s.w5.fertig-vorK7.built>=1)builtAt=s.tick;
      // W4 und W5 dürfen durch die vorhandenen Originalbefehle finanziert werden,
      // falls die vorhandene Automatik wegen ihres Schwellenwertes noch abwartet.
      if(!s.w4.auftrag&&s.stations.st_nadir.lager.erz>=10
        &&s.stations.st_nadir.lager.material<5){
        const q=w.kern.pilotW4Kalkulation(s);
        if(q.ok)befehl(w,s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
      }
      if(s.w4.materialErzeugt-vorK7.refined>=5&&!s.w5.auftrag&&s.w5.fertig===vorK7.built
        &&s.stations.st_nadir.lager.material>=5){
        befehl(w,s,{type:'industrialOreBuildShip',owner:'werft_extern'});
      }
      if(roundAt&&builtAt)break;
      prevHash=w.hash(s);
    }
    audit(w,s,'K7 positive Industriekette');
    console.log('K7_DIAGNOSE '+JSON.stringify({seed,tick:s.tick,minedAt,dockAt,deliveredAt,roundAt,
      oreDelta:s.ledger.erz.mined-initialMined,miner:((sh)=>({id:sh.id,owner:sh.owner,
        auftrag:sh.auftrag,system:sh.system,phase:sh.phase,flug:sh.flug,ladung:sh.ladung}))
        (s.ships.sh004),
      contract:s.kanon.industrieErz,w3:s.w3.auftrag,
      w1:s.erzpilotVertraege?.sh004,engpass:s.kanon.engpass?.aktuell || s.kanon.engpass}));
    assert.ok(minedAt,'tatsächlich bezahlter W1-Bergbau');
    assert.ok(dockAt,'50 physische Erz am Dock an Aldera verkauft');
    assert.ok(deliveredAt,'genau einmal mit bestehender W3-Käufertreuhand bezahlt');
    assert.ok(roundAt,'originale Hin- und Rückfracht abgeschlossen');
    assert.ok(refinedAt,'wirklich angeliefertes Erz zu Original-W4-Material verarbeitet');
    assert.ok(builtAt,'physisch aus echtem W4-Material gebauter W5-Frachter');
    assert.equal(s.w3.kaufAusgaben-vorK7.paid,740,'keine zweite 740er-Bindung');
    assert.equal(s.w3.abgeschlossen-vorK7.round,1);
    assert.equal(s.kanon.industrieErz.phase,'geliefert');
    assert.equal(s.kanon.industrieErz.werftVerwendet,true);
    assert.equal(s.owners.k7_werft_treuhand.cash,0,'Werftreserve nur für reale Produktion ausgegeben');
    assert.equal(s.w3.auftrag,null);
    const save=w.save(s),t=w.load(save);
    assert.equal(w.hash(t),w.hash(s));
    for(let i=0;i<130;i++){w.minute(s);w.minute(t);}
    assert.equal(w.hash(t),w.hash(s),'identische deterministische 130 Minuten nach Save/Load');
    audit(w,s,'K7 Fortsetzung');
    console.log('K7_WARENKETTE '+JSON.stringify({seed,minedAt,dockAt,deliveredAt,roundAt,
      refinedAt,builtAt,hash:w.hash(s),tick:s.tick,
      erz:s.ledger.erz.mined-initialMined,lieferungen:s.w3.geliefert,
      material:s.w4.materialErzeugt,ships:s.w5.fertig,geld:kassensumme(s)}));
  });

  test('K7 Seed '+seed+': unbegonnene Bestellung darf ohne Scheinleistung an dieselben Firmen zurück',()=>{
    const {welt:w,zustand:s}=k7Start(seed);
    befehl(w,s,{type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh020'});
    befehl(w,s,{type:'industrialOreAcceptMine',owner:'npc3'});
    befehl(w,s,{type:'industrialOreAcceptFreight',owner:'transport'});
    befehl(w,s,{type:'industrialOreAcceptYard',owner:'werft_extern'});
    const cash={buyer:s.owners.st_nadir.cash,carrier:s.owners.transport.cash,
      werft:s.owners.werft_extern.cash};
    befehl(w,s,{type:'industrialOreCommit',owner:'st_nadir'});
    befehl(w,s,{type:'industrialOreCancel',owner:'st_nadir'});
    assert.equal(s.owners.st_nadir.cash,cash.buyer);
    assert.equal(s.owners.transport.cash,cash.carrier);
    assert.equal(s.owners.werft_extern.cash,cash.werft);
    assert.equal(s.owners.k7_werft_treuhand.cash,0);
    assert.equal(s.owners.w3_kauf_treuhand.cash,0);
    assert.equal(s.owners.w3_arbeit_treuhand.cash,0);
    assert.equal(s.w3.auftrag,null);
    assert.equal(s.w3.storniert,1);
    assert.equal(s.w3.stornoRueckzahlung,740);
    assert.equal(s.ships.sh004.auftrag,'halten');
    audit(w,s,'K7 entschädigungsfreies Vorarbeitsstorno');
    const x=w.save(s);assert.equal(w.hash(w.load(x)),w.hash(s));
  });
}
