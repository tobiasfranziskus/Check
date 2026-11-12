// K7 [DRAFT / REGEL200] – 13 wirtschaftlich verschiedene 90-Tage-
// Szenarien NACH einem echten industriellen Erzvertrag aus identischem K4-
// Krisenzustand. Keine Kapitalzufuhr, keine stille Erhöhung des Exportetats.
// Das hier ist eine Krisen-/Konservationsprüfung, kein W6-Nachhaltigkeitsbeweis.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { k6Start } from '../tools/k6-eisdisposition.mjs';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');

const szenarien=Object.freeze([
  {id:'K7-01',typ:'Basis: K7-Ersatz und eigentümerfinanzierte K6-Eisdisposition',politik:{}},
  {id:'K7-02',typ:'NPC-Automatik ausgeschaltet',politik:{automatik:false}},
  {id:'K7-03',typ:'Kein automatischer Ersatzkauf',politik:{ersatzkauf:false}},
  {id:'K7-04',typ:'Stilllegung beim Wertverzehr',politik:{stilllegung:true}},
  {id:'K7-05',typ:'Keine Wasserrückfracht',politik:{rueckfracht:false}},
  {id:'K7-06',typ:'Kein autonomer Eistransport',politik:{eisfracht:false}},
  {id:'K7-07',typ:'Wasserwerk abgeschaltet',politik:{wasserwerk:false}},
  {id:'K7-08',typ:'Privatkunden sparen 100 Prozent',politik:{sparquoteStandard:1000}},
  {id:'K7-09',typ:'Privatkunden sparen 30 Prozent',politik:{sparquoteStandard:300}},
  {id:'K7-10',typ:'NPC-Unternehmen thesaurieren',politik:{
    ausschuettung:{npc3:0,transport:0,st_aldera:0,st_nadir:0,werft_extern:0}}},
  {id:'K7-11',typ:'K7 ohne Umwidmung – 50 Erz allein erzeugen keine Wasser-Nachfrage',politik:{},eisUmstellen:false},
  {id:'K7-12',typ:'Frühere Ersatzvorschau 80 Prozent',politik:{ersatzVorlaufProzent:80}},
  {id:'K7-13',typ:'Aldera bezieht kein Rückfrachtwasser',politik:{wasserZielAldera:0}},
]);
assert.equal(szenarien.length,13);
const {terminalSave} = k6Start(42);
const startgeld=33000;
const summe=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function richteAuf(w,s){
  for(const cmd of [
    {type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh020'},
    {type:'industrialOreAcceptMine',owner:'npc3'},
    {type:'industrialOreAcceptFreight',owner:'transport'},
    {type:'industrialOreAcceptYard',owner:'werft_extern'},
    {type:'industrialOreCommit',owner:'st_nadir'},
  ]) {
    const r=w.execute(s,cmd);
    assert.equal(r.ok,true,cmd.type+': '+r.reason);
  }
}
const audit=(w,s,tag)=>{
  const a=w.audit(s);
  assert.equal(a.ok,true,'K7 Tag '+tag+' Tick '+s.tick+': '+JSON.stringify(a.fehler));
  assert.equal(summe(s),startgeld,'Geldidentität Tag '+tag);
  assert.equal(s.minted,0); assert.equal(s.burned,0);
};
function loeseProduktionAus(w,s,initial) {
  const zusatzErz=s.ledger.erz.mined-initial.erz;
  if(s.stations.st_nadir.lager.erz>=10&&!s.w4.auftrag
    &&s.w4.materialErzeugt-initial.material<5) {
    const q=w.kern.pilotW4Kalkulation(s);
    if(q.ok) {
      const r=w.execute(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
      assert.equal(r.ok,true,r.reason);
    }
  }
  if(s.w4.materialErzeugt-initial.material>=5 && !s.w5.auftrag
    &&!s.kanon.industrieErz.werftVerwendet && s.stations.st_nadir.lager.material>=5) {
    const r=w.execute(s,{type:'industrialOreBuildShip',owner:'werft_extern'});
    assert.equal(r.ok,true,r.reason);
  }
  if(s.kanon.industrieErz.werftVerwendet&&s.w5.fertig>initial.frachter){
    const neue=s.w5.schiffIds.at(-1);
    if(s.stations.st_nadir.lager.frachter>=1&&s.ships[neue]===undefined
      &&s.owners.transport.cash>=w.rules.w5.verkaufsPreis){
      const r=w.execute(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'});
      assert.equal(r.ok,true,r.reason);
    }
    const sh=s.ships[neue];
    if(sh&&sh.owner==='transport'&&sh.system==='nadir'&&sh.phase==='dock'
      &&sh.auftrag==='halten'&&s.owners.transport.cash>=w.rules.w5Transfer.lohnJeMinute*60){
      const q=w.kern.pilotW5TransferKalkulation(s,neue);
      if(q.ok) {
        const r=w.execute(s,{type:'shipReposition',owner:'transport',schiff:neue});
        assert.equal(r.ok,true,r.reason);
      }
    }
  }
}
for(const sc of szenarien){
  test('K7 90 Tage '+sc.id+' – '+sc.typ, {timeout:20*60*1000}, ()=>{
    const {welt:w,zustand:s}=Welt.ausRegel199K7(terminalSave);
    w.politikSetzen(s,sc.politik);
    const initial={erz:s.ledger.erz.mined,w3:s.w3.geliefert,material:s.w4.materialErzeugt,
      frachter:s.w5.fertig,kauf:s.w3.kaufAusgaben};
    richteAuf(w,s);
    const start=s.tick;
    // Nur die initiale echte Material-/Hüllenproduktionskette erhält
    // Eigentümerbefehle, wenn die ORIGINAL Quotes sie tatsächlich decken.
    // Die folgenden 90 Tage agieren ausschließlich die unveränderten NPC.
    for(let minute=0;minute<500;minute++){
      w.minute(s);
      loeseProduktionAus(w,s,initial);
      if(minute%60===0)audit(w,s,'Anlauf '+minute);
    }
    audit(w,s,'nach Anlauf');
    assert.equal(s.w3.kaufAusgaben-initial.kauf,740,
      'Vertrag belegt auch im Krisenszenario nur 740 ISK Käufergeld');
    assert.equal(s.w3.geliefert-initial.w3,50,'eine physische K7-Erzlieferung');
    assert.equal(s.ledger.erz.mined-initial.erz,50,
      'eine tatsächlich und bezahlt geförderte 50er-Charge');
    assert.equal(s.kanon.industrieErz.phase,'geliefert');
    assert.equal(s.w3.auftrag,null);
    assert.equal(s.w3.abgeschlossen>=1,true);
    assert.ok(s.w4.materialErzeugt-initial.material>=5,
      'echtes W4-Material für mindestens einen Frachter');
    assert.ok(s.w5.fertig-initial.frachter>=1,
      'mindestens eine echte, signierte W5-Werftproduktion');
    assert.equal(s.owners.k7_werft_treuhand.cash,0,'nur eingelöste Werftreserve');
    // K6-Gegenversuch jetzt *nach* realer K7-Lieferung und tatsächlich
    // bezahltem Ersatzfrachter: npc3 disponiert nur EIGENE vier Miner per
    // bereits existierenden Originalbefehlen, nicht als geänderte KI-Produktregel.
    const umgestellt=[];
    if(sc.eisUmstellen!==false)for(const id of ['sh004','sh005','sh006','sh008']){
      const sh=s.ships[id];
      assert.equal(sh.owner,'npc3','nur rechtmäßiges Eigentum umwidmen');
      assert.equal(sh.flug.lage,'angedockt','kein Teleport bei Umwidmung');
      const stop=w.execute(s,{type:'shipShuttleStop',owner:'npc3',schiff:id});
      assert.equal(stop.ok,true,'NPC-Erzpendel stoppen '+id+': '+stop.reason);
      const start=w.execute(s,{type:'shipShuttle',owner:'npc3',schiff:id,ware:'eis'});
      assert.equal(start.ok,true,'NPC-Eispendel starten '+id+': '+start.reason);
      umgestellt.push(id);
    }
    audit(w,s,'nach Eigentümer-Umwidmung');
    const beginnWasser=s.kanon.wasser.konsum;
    const beginnEis=s.w5n.eisAbgebaut;
    let letzterAbsatztag=0;
    for(let tag=1;tag<=90;tag++){
      const vor=s.kanon.wasser.konsum;
      w.advance(s,1440);
      audit(w,s,tag);
      if(s.kanon.wasser.konsum>vor)letzterAbsatztag=tag;
    }
    assert.equal(s.tick,start+500+90*1440);
    const nach=s.kanon.wasser.konsum-beginnWasser;
    const eisNeu=s.w5n.eisAbgebaut-beginnEis;
    if(sc.eisUmstellen===false){
      assert.equal(eisNeu,0,'Kontrolle: kein Eis nach abgelaufenem Exportauftrag');
      assert.equal(nach,0,'Kontrolle: keine Wasserkäufe aus Phantomware');
    } else assert.equal(umgestellt.length,4);
    const json=w.save(s),geladen=w.load(json);
    assert.equal(w.hash(geladen),w.hash(s),'90 Tage Save/Load bitgleich');
    assert.equal(geladen.rulesVersion,200);
    const t=structuredClone(s);
    for(let n=0;n<130;n++){w.minute(t);w.minute(geladen);}
    assert.equal(w.hash(t),w.hash(geladen),'Replay 130 Minuten');
    audit(w,geladen,'Replay');
    console.log('K7_90_TAGE '+JSON.stringify({id:sc.id,titel:sc.typ,
      tag:90,tick:s.tick,hash:w.hash(s),erzk7:50,materialNeu:s.w4.materialErzeugt-initial.material,
      frachterNeu:s.w5.fertig-initial.frachter,
      eisNeu,umgestellteMiner:umgestellt,wasserKaeufe:nach,letzterAbsatztag,
      eisGesamt:s.w5n.eisAbgebaut,
      gesamtWasser:s.kanon.wasser.konsum,
      frachterEinsatzfaehig:Object.values(s.ships).filter(sh=>sh.klasse==='frachter'
        &&sh.owner==='transport'&&w.buchwert(s,sh.id)>0).length,
      eisMinerEinsatzfaehig:Object.values(s.ships).filter(sh=>sh.klasse==='miner'
        &&sh.owner==='npc3'&&w.buchwert(s,sh.id)>0).length,
      frei:{export:s.owners.export.cash,nadir:s.owners.st_nadir.cash,
        transport:s.owners.transport.cash,werft:s.owners.werft_extern.cash},
      geld:summe(s),minted:s.minted,burned:s.burned}));
  });
}
