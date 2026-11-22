import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const J8=require('../prototypes/verbund/konzern-session.js');
const Manager=require('../prototypes/spiel/p3-manager-disposition.js');
const Karte=require('../prototypes/spiel/p3-manager-karte.js');
const Flotte=require('../prototypes/spiel/p3-manager-flotte.js');
const Handelsweg=require('../prototypes/spiel/p3-handelsweg.js');

test('M4-U5: 48 bezahlte Eisfahrten, Original-Sperren, Lohnkosten und Save/Load',()=>{
 const j=engpassNach48(),w=j.weltReferenz(),s=j.zustandReferenz(),json=j.exportieren();
 const hash=j.ansicht().hash,angebote=j.angebote();
 const p=Manager.auswerten(w,s,angebote);
 assert.equal(hash,'f63f2cd09ba5a88c');
 assert.equal(s.tick,6300);
 assert.deepEqual([p.frachtAbgeschlossen,p.frachtGebuehrBisher,p.frachtLohnBisher],[48,11520,5760]);
 assert.deepEqual([p.eislagerNadir,p.eisFrei,p.eisCharge,p.wasserNadir,p.eisWasserwerkSchwelle],[130,20,50,118,115]);
 assert.deepEqual([p.alderaKasse,p.hausKasse,p.erzExportKasse,p.erzKosten],[513,12263,0,500]);
 assert.deepEqual([p.minerAnzahl,p.frachterAnzahl,p.minerAktiv,p.erzAktiv],[3,1,1,2]);
 assert.deepEqual([w.buchwert(s,'sh003'),w.stillgelegt(s,'sh003')],[0,false]);
 assert.equal(p.transport.grund,'Eislager Nadir voll');
 assert.equal(p.transport.bereit,false);
 assert.equal(p.aussetzen.aktion,'stop-sh004');
 assert.deepEqual([p.nadirKasse,p.nadirFrachtbedarf,p.frachtLohnbedarf],[2884,490,120]);
 assert.equal(p.ersatzAldera.ok,false);
 assert.equal(p.ersatzNadir.ok,false);
 assert.equal(angebote.find(a=>a.id==='water-pilot-house-1').ok,true);
 assert.equal(angebote.some(a=>a.id==='water-pilot-house-bedarf'),false);

 const karte=Karte.auswerten(j.ansicht(),s,w,angebote);
 const flotte=Flotte.auswerten(karte.schiffe,angebote,'sh004',w.bericht(s).schiffe);
 assert.equal(flotte.schiff.auftrag,'Erzförderung');
 assert.deepEqual(flotte.aktionen.map(a=>[a.id,a.ok]),[['stop-sh004',true]]);
 assert.equal(j.exportieren(),json,'Die Anzeigen buchen keine Aufträge');

 for(const id of ['freight-sh003','gate-freight-sh003','buy-st_aldera-frachter','buy-st_nadir-frachter',
  'freight-sh003-20','industrialOreAcceptFreight','water-nadir']){
  assert.equal(j.ausfuehren(id).ok,false,id);
  assert.equal(j.exportieren(),json);
 }
 for(const [cmd,grund] of [
  [{type:'shipFreightIce',owner:'house',schiff:'sh003',menge:20},/Feld/],
  [{type:'shipFreight',owner:'house',schiff:'sh003'},/Frachter/],
  [{type:'industrialOreOffer',owner:'house',miner:'sh004',frachter:'sh003'},/Industriekäufer/],
  [{type:'industrialOreOffer',owner:'st_nadir',miner:'sh004',frachter:'sh003'},/fremdes/],
  [{type:'householdBuy',owner:'house',menge:1},/Haushalt/],
 ]){
  const probe=w.load(json),r=w.execute(probe,cmd);
  assert.equal(r.ok,false,cmd.type);
  assert.match(r.reason,grund);
  assert.equal(w.save(probe),json);
 }
 const quelle=J8.erstellen();
 quelle.oeffnen204(json,true);
 assert.equal(quelle.exportieren(),json);
 assert.equal(quelle.ansicht().hash,hash);
 assert.deepEqual(pruefen(w,s),[]);
 const gefaelscht=JSON.parse(json);
 gefaelscht.owners.export.cash+=500;
 gefaelscht.owners.house.cash-=500;
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(gefaelscht),true));
 const fremd=JSON.parse(json);
 fremd.ships.sh003.owner='transport';
 assert.throws(()=>J8.erstellen().oeffnen204(JSON.stringify(fremd),true));
 const privat=J8.erstellen();
 privat.oeffnen204(json,true);
 assert.equal(privat.ausfuehren('water-pilot-house-1').ok,true);
 const gekauft=privat.zustandReferenz();
 assert.equal(gekauft.owners.pilot_house.cash,s.owners.pilot_house.cash-16);
 assert.equal(gekauft.owners.st_aldera.cash,s.owners.st_aldera.cash+16);
 assert.equal(gekauft.stations.st_aldera.lager.wasser,s.stations.st_aldera.lager.wasser-1);
 assert.deepEqual(gekauft.stations.st_nadir.lager,s.stations.st_nadir.lager);
 assert.equal(privat.angebote().find(a=>a.id==='freight-sh003').reason,'Eislager Nadir voll');
 assert.deepEqual(pruefen(w,gekauft),[]);
 const eigentuemer=Object.fromEntries(Object.values(s.ships).map(sh=>[sh.id,sh.owner]));
 const verkaeufe=s.stats.konto.house.erloes,lohn=s.kanon.fluglohnMinuten;
 for(let i=0;i<48;i++)quelle.weiterspielen(60);
 const spaeter=quelle.zustandReferenz();
 assert.equal(quelle.ansicht().hash,'9b5c05cff2fa1797');
 assert.equal(spaeter.tick,s.tick+2880);
 assert.equal(quelle.angebote().find(a=>a.id==='freight-sh003').reason,'Eislager Nadir voll');
 assert.deepEqual(spaeter.stations.st_nadir.lager,s.stations.st_nadir.lager);
 assert.equal(spaeter.stats.konto.house.erloes,verkaeufe);
 assert.equal(spaeter.kanon.fluglohnMinuten-lohn,5760);
 assert.deepEqual(Object.fromEntries(Object.values(spaeter.ships).map(sh=>[sh.id,sh.owner])),eigentuemer);
 assert.deepEqual(pruefen(w,spaeter),[]);
 assert.equal(w.save(w.load(quelle.exportieren())),quelle.exportieren());

 // Eine echte Förderpause spart Fluglohn. Sie räumt das Eislager nicht frei.
 for(const id of ['stop-sh004','stop-sh005'])assert.equal(j.ausfuehren(id).ok,true);
 assert.equal(j.ausfuehren('stop-sh001').ok,false);
 for(let i=0;i<4;i++)j.weiterspielen(60);
 const pausiert=j.zustandReferenz();
 assert.equal(pausiert.kanon.pendel.sh004,undefined);
 assert.equal(pausiert.kanon.pendel.sh005,undefined);
 assert.equal(pausiert.kanon.flugdienst.sh004,undefined);
 assert.equal(pausiert.kanon.flugdienst.sh005,undefined);
 assert.equal(j.angebote().find(a=>a.id==='ore-sh004').reason,'Exportkäufer kann die Erzcharge derzeit nicht bezahlen');
 assert.equal(j.angebote().find(a=>a.id==='freight-sh003').reason,'Eislager Nadir voll');
 assert.deepEqual(pruefen(w,pausiert),[]);
});

test('M4-U5: Handelsweg wählt ausführbaren Frachter vor einem gesperrten Angebot',()=>{
 const schiffe=[
  {id:'m',owner:'house',klasse:'miner',system:'aldera'},
  {id:'f1',owner:'house',klasse:'frachter',system:'aldera'},
  {id:'f2',owner:'house',klasse:'frachter',system:'aldera'}
 ];
 const angebote=[{id:'freight-f1',ok:false,reason:'Hülle stillgelegt'},{id:'freight-f2',ok:true}];
 const p=Handelsweg.auswerten({rulesVersion:204,kanon:{},ships:schiffe,
  stations:{st_aldera:{lager:{eis:50}}},owners:{house:{cash:3000}}},angebote);
 assert.equal(p.bereit,true);
 assert.equal(p.aktion,'freight-f2');
});
