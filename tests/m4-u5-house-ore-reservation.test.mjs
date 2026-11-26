import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const J8=require('../prototypes/verbund/konzern-session.js');
const OLD=require('../prototypes/w5ac/session.js');
const {pruefen}=require('../tools/w6-szenarien.cjs');
const {engpassNach48}=require('./m4-u5-engpass-ablauf.cjs');
const signaturen=[
  ['industrialOreAcceptMine','npc3'],['industrialOreAcceptSource','st_aldera'],
  ['industrialOreAcceptYard','werft_extern'],['industrialOreAcceptFreight','house']
];
const offer={type:'industrialOreOffer',owner:'st_nadir',miner:'sh001',frachter:'sh002'};
const stop={type:'shipShuttleStop',owner:'npc3',schiff:'sh001'};
const action=(type,owner,kennung)=>({type,owner,kennung});
const commit=id=>action('industrialOreCommit','st_nadir',id);
const cancel=id=>action('industrialOreCancel','st_nadir',id);

function exec(w,s,cmd) {
  const r=w.execute(s,cmd);
  assert.ok(r.ok,r.reason);
  return r;
}

function ablehnen(w,s,cmd,grund) {
  const vor=w.save(s),r=w.execute(s,cmd);
  assert.equal(r.ok,false);
  assert.match(r.reason,grund);
  assert.equal(w.save(s),vor);
}

function runde(w,s) {
  const json=w.save(s),geladen=w.load(json);
  assert.equal(w.save(geladen),json);
  assert.deepEqual(pruefen(w,geladen),[]);
  return geladen;
}

function bereit(tick=0) {
  const w=W.erstellenHausErz({carrierCash:2000,buyerCash:4000}),s=w.createState(42);
  exec(w,s,stop);
  exec(w,s,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_aldera'});
  w.advance(s,tick);
  return {w,s};
}

function unterschreiben(w,s) {
  let i=s.kanon.industrieErz;
  if(i.phase!=='angebot'){
    exec(w,s,offer);
    i=s.kanon.industrieErz;
  }
  for(const [type,owner] of signaturen)
    if(!i.signaturen[owner])exec(w,s,action(type,owner,i.kennung));
  return i.kennung;
}

for(const tick of [49,50])test('Haus-Erz: Abschluss Minute '+tick+' schützt Förderung und Ware bis zur bezahlten Rückkehr',()=>{
  const {w,s}=bereit(tick);
  const id=unterschreiben(w,s);
  const haus=s.owners.house.cash,lohn=s.owners.pilot_erz.cash,exportiert=s.ledger.erz.exported;
  exec(w,s,commit(id));
  assert.deepEqual([s.owners.w3_kauf_treuhand.cash,s.owners.w3_arbeit_treuhand.cash,
    s.owners.k7_werft_treuhand.cash],[740,120,530]);
  assert.equal(s.erzpilotVertraege.sh001.menge,50);
  const wiederholt=runde(w,s);
  w.advance(s,34);
  assert.ok(s.ships.sh001.ladung.erz>0&&s.ships.sh001.ladung.erz<50);
  ablehnen(w,s,stop,/Förderleistung/);
  ablehnen(w,s,{type:'shipWait',owner:'npc3',schiff:'sh001'},/Pendelauftrag|Förderleistung/);
  ablehnen(w,s,cancel(id),/begonnen/);
  for(const type of ['shipFreight','shipFreightIce','shipReposition'])
    ablehnen(w,s,{type,owner:'house',schiff:'sh002'},/gebunden|Original|Nadir|Erzauftrag|Spedition/);
  let neu=runde(w,s);
  w.advance(neu,120-neu.tick);
  assert.equal(neu.ledger.erz.exported,exportiert);
  if(tick===50){
    assert.equal(neu.stations.st_aldera.lager.erz,50);
    assert.equal(neu.w3.auftrag.phase,'vorbestellt');
  }
  w.advance(neu,122-neu.tick);
  assert.equal(neu.w3.auftrag.phase,'hin');
  assert.equal(neu.ships.sh002.ladung.erz,50);
  neu=runde(w,neu);
  w.advance(neu,190-neu.tick);
  assert.equal(neu.w3.auftrag.phase,'rueck');
  neu=runde(w,neu);
  w.advance(neu,250-neu.tick);
  const b=neu.w5ad.freight.find(f=>f.kennung===id);
  assert.deepEqual([b.amount,b.end-b.start,b.fee,b.work,b.owner],[50,120,240,120,'house']);
  assert.equal(neu.owners.house.cash-haus,120);
  assert.equal(neu.owners.pilot_erz.cash-lohn,120);
  w.advance(neu,360-neu.tick);
  w.advance(wiederholt,360-wiederholt.tick);
  assert.equal(w.save(neu),w.save(wiederholt));
  assert.ok(neu.w4.abgeschlossen>0&&neu.w5.fertig>0);
  assert.equal(neu.owners.k7_werft_treuhand.cash,0);
  runde(w,neu);
});

test('Haus-Erz: gleiche Schiffe im selben Tick brauchen eine neue Zustimmung aller Rollen',()=>{
  const {w,s}=bereit(),a=exec(w,s,offer).kennung;
  ablehnen(w,s,action('industrialOreAcceptSource','house',a),/Rolle/);
  for(const [type,owner] of signaturen.slice(0,3))exec(w,s,action(type,owner,a));
  ablehnen(w,s,commit(a),/Zustimmung/);
  exec(w,s,action('industrialOreAcceptFreight','house',a));
  exec(w,s,cancel(a));
  const b=exec(w,s,offer).kennung;
  assert.notEqual(a,b);
  for(const [type,owner] of signaturen)ablehnen(w,s,action(type,owner,a),/instanz/);
  assert.equal(s.tick,0);
  assert.deepEqual(s.kanon.industrieErz.signaturen,{});
  runde(w,s);
});

test('Haus-Erz: Leerstorno erstattet W1, Flugdienst, W3 und Werft an die ursprünglichen Kassen',()=>{
  const {w,s}=bereit(),id=unterschreiben(w,s);
  const vorher=Object.fromEntries(Object.entries(s.owners).map(([id,o])=>[id,o.cash]));
  exec(w,s,commit(id));
  exec(w,s,cancel(id));
  for(const [id,kasse] of Object.entries(vorher))assert.equal(s.owners[id].cash,kasse,id);
  assert.equal(s.w3.auftrag,null);
  assert.equal(s.erzpilotVertraege.sh001,undefined);
  assert.equal(s.kanon.flugdienst.sh001,undefined);
  assert.equal(s.ledger.erz.mined,0);
  runde(w,s);
});

test('Haus-Erz: revalidiert Abdocken und Finanzierung nach konkreter Unterschrift',()=>{
  const {w,s}=bereit(),id=unterschreiben(w,s);
  exec(w,s,{type:'shipUndock',owner:'npc3',schiff:'sh001'});
  ablehnen(w,s,commit(id),/Aldera-Dock/);
  const ungeeignet=bereit();
  ungeeignet.s.owners.st_nadir.cash=739;
  const vor=ungeeignet.w.canonical(ungeeignet.s);
  assert.match(ungeeignet.w.execute(ungeeignet.s,offer).reason,/vorfinanzieren/);
  assert.equal(ungeeignet.w.canonical(ungeeignet.s),vor);
});

test('Haus-Erz: ausreichende Mindestförderzeit ersetzt den realen An- und Rückflug nicht',()=>{
  for(const [id,rest] of [['sh001',31],['sh001',57],['sh002',40],['sh002',100]]){
    const {w,s}=bereit(),leben=id==='sh001'?2000:2500;
    w.politikSetzen(s,{stilllegung:true});
    s.kanon.verschleiss[id]=leben-rest;
    assert.equal(w.restAktivminuten(s,id),rest);
    ablehnen(w,s,offer,/Restaktivzeit|volle W1/);
  }
});

test('Haus-Erz: freier Miner und dessen Exportcharge bleiben neben der gebundenen Charge nutzbar',()=>{
  const {w,s}=bereit(50);
  exec(w,s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
  const miner=Object.values(s.ships).find(sh=>sh.owner==='house'&&sh.klasse==='miner').id;
  exec(w,s,commit(unterschreiben(w,s)));
  exec(w,s,{type:'shipShuttle',owner:'house',schiff:miner,ware:'erz'});
  const vorher=s.ledger.erz.exported;
  w.advance(s,70);
  assert.equal(s.stations.st_aldera.lager.erz,50);
  assert.equal(s.ledger.erz.exported-vorher,50);
  assert.equal(s.w3.auftrag.phase,'vorbestellt');
  w.advance(s,2);
  assert.equal(s.ships.sh002.ladung.erz,50);
  runde(w,s);
});

test('Haus-Erz: Standardkopie, lokale Zusage, externer Reset und bezahlter Import',()=>{
  const j=J8.erstellen();
  j.starten195(OLD.create(42,'private195').export(),true);
  assert.equal(j.ausfuehren('buy-st_aldera-frachter').ok,true);
  const original=j.exportieren(),h=J8.erstellen();
  assert.throws(()=>h.oeffnenHausErz(original,false,'kopie'),/bestätigen/);
  h.oeffnenHausErz(original,true,'kopie');
  h.weiterspielen(1);
  const offer=h.angebote().find(a=>a.id.startsWith('haus-erz-'));
  assert.ok(offer?.ok,offer?.reason);
  assert.equal(h.ausfuehren(offer.id).ok,true);
  assert.equal(h.ausfuehren(offer.id).ok,false);
  const pending=h.exportieren(),lokal=J8.erstellen(),datei=J8.erstellen();
  assert.throws(()=>J8.erstellen().oeffnen204(pending,true),/eigenes Profil/);
  lokal.oeffnenHausErz(pending,true,'lokal');
  datei.oeffnenHausErz(pending,true,'datei');
  assert.equal(lokal.exportieren(),pending);
  assert.equal(datei.zustandReferenz().kanon.industrieErz.phase,'storniert');
  assert.equal(datei.zustandReferenz().w3.auftrag,null);
  lokal.weiterspielen(1);
  const bezahlt=lokal.exportieren(),importiert=J8.erstellen();
  importiert.oeffnenHausErz(bezahlt,true,'datei');
  assert.equal(importiert.exportieren(),bezahlt);
  assert.equal(importiert.zustandReferenz().w3.auftrag.carrier,'house');
  assert.equal(j.exportieren(),original);
});

test('Haus-Erz: eine weitere real gekaufte Hülle darf während W3 bezahlt überführen',()=>{
  const {w,s}=bereit();
  w.politikSetzen(s,{automatik:false});
  exec(w,s,commit(unterschreiben(w,s)));
  while(s.w5.fertig===0&&s.tick<360)w.minute(s);
  assert.equal(s.w5.fertig,1);
  exec(w,s,{type:'shipBuy',owner:'house',klasse:'frachter',station:'st_nadir'});
  const frei=s.w5.schiffIds.find(id=>s.ships[id].owner==='house');
  while(s.kanon.industrieErz.phase!=='angebot'&&s.tick<540)w.minute(s);
  assert.equal(s.kanon.industrieErz.phase,'angebot');
  const id=unterschreiben(w,s);
  exec(w,s,commit(id));
  exec(w,s,{type:'shipReposition',owner:'house',schiff:frei});
  assert.equal(s.w5ac.active.id,frei);
  const neu=runde(w,s);
  w.advance(neu,60);
  assert.equal(neu.w5ac.completed.at(-1).id,frei);
  assert.equal(neu.w3.auftrag.kennung,id);
  w.advance(neu,200);
  assert.ok(neu.w5ad.freight.some(b=>b.kennung===id));
  runde(w,neu);
});

test('Haus-Erz: der finanzierte 48-Fahrten-Stand kann bei ausgeschalteter Stilllegung seine Hülle einsetzen',()=>{
  const original=engpassNach48(),json=original.exportieren(),haus=J8.erstellen();
  haus.oeffnenHausErz(json,true,'kopie');
  const s=haus.zustandReferenz(),w=haus.weltReferenz();
  assert.equal(s.tick,6300);
  assert.equal(s.kanon.politik.stilllegung,false);
  assert.equal(s.kanon.verschleiss.sh003,5760);
  assert.equal(w.buchwert(s,'sh003'),0);
  w.minute(s);
  const angebot=s.kanon.industrieErz;
  assert.equal(angebot.phase,'angebot');
  assert.equal(angebot.frachter,'sh003');
  exec(w,s,action('industrialOreAcceptFreight','house',angebot.kennung));
  w.advance(s,192);
  const b=s.w5ad.freight.find(f=>f.kennung===angebot.kennung);
  assert.deepEqual([b.id,b.amount,b.end-b.start,b.fee,b.work],['sh003',50,120,240,120]);
  assert.ok(s.w4.abgeschlossen>0&&s.w5.fertig>0);
  assert.equal(original.exportieren(),json);
  runde(w,s);
});
