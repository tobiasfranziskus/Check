// F6 [DRAFT]: bezahltes 2D-Tor vor optionalem Original-W5n-Spielerauftrag.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const Welt=require('../prototypes/welt/welt-kern.js');
const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const ok=(w,s,type,extra={})=>{
  const r=w.execute(s,{type,owner:'house',...extra});
  assert.equal(r.ok,true,type+': '+r.reason); return r;
};
const nein=(w,s,cmd,re)=>{
  const h=w.canonical(s), r=w.execute(s,cmd);
  assert.equal(r.ok,false,cmd.type+' muss abgelehnt sein');
  if(re)assert.match(r.reason,re);
  assert.equal(w.canonical(s),h,'Ablehnung ohne Nebenwirkung');
};
function audit(w,s,phase){
  const r=w.audit(s);
  assert.equal(r.ok,true,phase+': '+JSON.stringify(r.fehler));
  assert.equal(geld(s),33000,phase+' Weltgeld');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
}
function vorbereitet(){
  const w=Welt.erstellen(),s=w.createState(42,{politik:{automatik:false}});
  ok(w,s,'shipBuy',{klasse:'frachter',station:'st_aldera'});
  ok(w,s,'shipBuy',{klasse:'miner',station:'st_aldera'});
  const fr=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter'),
    miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert.ok(fr&&miner);
  ok(w,s,'shipShuttle',{schiff:miner.id,ware:'eis'});
  let m=0;
  while(s.w5n.mineVerkauft<50){
    w.minute(s);assert.ok(++m<180,'echtes gefördertes und verkauftes Eis');
  }
  ok(w,s,'shipShuttleStop',{schiff:miner.id});
  while(s.kanon.pendel[miner.id]){
    w.minute(s);assert.ok(++m<260,'Miner darf zum Dock zurückkehren');
  }
  assert.equal(s.stations.st_aldera.lager.eis,50);
  audit(w,s,'50 Eis bezahlt');
  return {w,s,fr,miner};
}
function torErreichen(x){
  const {w,s,fr}=x, id=fr.id;
  ok(w,s,'shipUndock',{schiff:id});
  w.minute(s);
  assert.equal(fr.flug.lage,'frei','echtes Abdockmanöver');
  const tor=w.daten.tor;
  ok(w,s,'shipFlyTo',{schiff:id,x:tor.x,y:tor.y});
  let dauer=0;
  while(!w.torPruefen(s,fr).ok){
    w.minute(s);
    assert.ok(++dauer<38,'Toranflug mit echter Originalkinematik bezahlbar');
  }
  assert.ok(dauer>0,'Anflug braucht Simulationszeit');
  const lohn=s.kanon.flugdienst[id].minuten;
  assert.ok(lohn>0);
  assert.ok(s.owners.pilot_house.cash>=lohn);
  audit(w,s,'nach echtem bezahltem Toranflug');
  return dauer;
}
function dockRueckkehr(x){
  const {w,s,fr}=x;
  ok(w,s,'shipDock',{schiff:fr.id,station:'st_aldera'});
  let m=0;
  while(fr.flug.lage!=='angedockt'){
    w.minute(s);assert.ok(++m<80,'Original-Dockanflug');
  }
  assert.equal(s.kanon.flugdienst[fr.id],undefined,'Lohnreserve zurückgebucht');
  audit(w,s,'nach physischem Wiederandocken');
}
test('F6: Torbesuch nur durch rechtmäßig gekauften, bezahlten und langsamen 2D-Frachter',()=>{
  const x=vorbereitet(),{w,s,fr,miner}=x;
  const before=w.hash(s);
  assert.equal(s.kanon.tor,undefined,'alte K1-Saves ohne Zusatzfeld bleiben unverändert');
  assert.equal(w.torPruefen(s,fr).ok,false);
  assert.equal(w.hash(s),before,'lesende Prüfung kein Core-Befehl');
  nein(w,s,{type:'shipGateCheck',owner:'house',schiff:fr.id},/nur im echten freien/);
  nein(w,s,{type:'shipGateCheck',owner:'transport',schiff:fr.id},/Schiffeigentuemer/);
  nein(w,s,{type:'shipGateCheck',owner:'house',schiff:miner.id},/Aldera-Frachter/);
  nein(w,s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id},/kein nachgewiesener/);
  const from=s.owners.house.cash, wage=s.owners.pilot_house.cash;
  const dauer=torErreichen(x);
  assert.equal(s.owners.house.cash,from-40,'Originalreserve gebunden statt Gratisanflug');
  assert.ok(s.owners.pilot_house.cash>wage,'persönlicher Pilot original bezahlt');
  const proofHash=w.hash(s);
  ok(w,s,'shipGateCheck',{schiff:fr.id});
  const proof=s.kanon.tor.freigaben[fr.id];
  assert.equal(s.kanon.tor.historie.length,1);
  assert.equal(s.kanon.tor.genutzt,0);
  assert.equal(proof.schiff,fr.id);
  assert.equal(proof.tick,s.tick);
  assert.equal(proof.arbeit,s.kanon.flugdienst[fr.id].minuten);
  assert.ok(proof.arbeit>=dauer);
  assert.notEqual(w.hash(s),proofHash,'nur die explizite Torprüfung erzeugt den Beleg');
  nein(w,s,{type:'shipGateCheck',owner:'house',schiff:fr.id},/bereits vorhanden/);
  nein(w,s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id},/Aldera-Dock/);
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'Torfreigabe im Original-JSON sicher');
  audit(w,s,'Freigabebeleg unabhängig geprüft');
});
test('F6: Torberechtigter Frachtvertrag erfordert echte Dockrückkehr und nutzt unveränderten W5n-Beleg',()=>{
  const x=vorbereitet(),{w,s,fr}=x;
  torErreichen(x);ok(w,s,'shipGateCheck',{schiff:fr.id});
  dockRueckkehr(x);
  const quote=w.kern.pilotIceFreightQuote(s,fr.id);
  assert.equal(quote.ok,true,quote.grund);
  assert.deepEqual([quote.eis,quote.fracht,quote.arbeit],[250,240,120]);
  const torquote=w.torFrachtPruefen(s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id});
  assert.equal(torquote.ok,true,torquote.reason);
  const snapshot=w.save(s), y=w.load(snapshot);
  const baseline=w.hash(y);
  assert.equal(w.hash(s),baseline,'gleicher Startzustand für F4 und F6');
  const house=s.owners.house.cash, pilot=s.owners.pilot_house.cash, nadir=s.owners.st_nadir.cash;
  ok(w,s,'shipFreightGateIce',{schiff:fr.id});
  ok(w,y,'shipFreightIce',{schiff:fr.id});
  assert.equal(s.w5n.frachtauftrag.schiff,fr.id);
  assert.equal(s.kanon.spielerFrachten.auftraege.at(-1).tor.schiff,fr.id);
  assert.equal(s.kanon.tor.freigaben[fr.id],undefined,'einmaliger Beleg verbraucht');
  assert.equal(s.kanon.tor.genutzt,1);
  assert.equal(s.owners.house.cash,house-120);
  assert.equal(s.owners.st_nadir.cash,nadir-490);
  nein(w,s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id},/Aldera-Dock/);
  audit(w,s,'F6 Original-W5n-Start mit echtem Tor');
  w.advance(s,60);w.advance(y,60);
  assert.equal(s.w5n.eisGeliefert,50);
  assert.equal(s.owners.w5n_fracht_kauf.cash,240);
  assert.equal(s.owners.pilot_house.cash,pilot+60);
  audit(w,s,'Nadir-Lieferung ausschließlich nach 60 bezahlt Minuten');
  assert.deepEqual(s.w5n,y.w5n,'W5n-Ledger nach Hinflug exakt gleich F4');
  w.advance(s,60);w.advance(y,60);
  assert.equal(s.w5n.frachtauftrag,null);
  assert.equal(s.w5n.frachtAbgeschlossen,1);
  assert.equal(s.owners.house.cash,house+120);
  assert.equal(s.owners.pilot_house.cash,pilot+120);
  assert.equal(s.stations.st_nadir.lager.eis,50);
  assert.equal(fr.system,'aldera');
  assert.equal(fr.flug.lage,'angedockt');
  for(const field of ['w5n','owners','ships','stations','ledger','stats'])
    assert.deepEqual(s[field],y[field],field+': Original-W5n-Kette ohne Torbonus');
  assert.notEqual(w.hash(s),w.hash(y),'nur der erfolgreiche F6-Beleg bleibt als Geschichtsbeleg');
  nein(w,s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id},/kein nachgewiesener/);
  audit(w,s,'vollständig bezahlte Originalrunde mit verbrauchtem Tor');
  assert.equal(w.hash(w.load(w.save(s))),w.hash(s),'abgeschlossene F6-Runde sicher importierbar');
});
test('F6: F4 ohne Tor bleibt jederzeit erlaubt, alte Hashes unverändert',()=>{
  const x=vorbereitet(),{w,s,fr}=x;
  const hash=w.hash(s);
  assert.equal(w.torFrachtPruefen(s,{type:'shipFreightGateIce',owner:'house',schiff:fr.id}).ok,false);
  assert.equal(w.hash(s),hash);
  ok(w,s,'shipFreightIce',{schiff:fr.id});
  assert.equal(s.kanon.tor,undefined);
  w.advance(s,120);
  assert.equal(s.w5n.frachtAbgeschlossen,1);
  audit(w,s,'historischer F4-Abschluss ohne neue Torpflicht');
});
test('F6: gefälschte Torposition, Eigentümerfreigabe, Wiederverwendung und Torvertragsbeleg werden abgewiesen',()=>{
  const x=vorbereitet(),{w,s,fr}=x;
  torErreichen(x);ok(w,s,'shipGateCheck',{schiff:fr.id});
  dockRueckkehr(x);ok(w,s,'shipFreightGateIce',{schiff:fr.id});
  w.advance(s,8);
  const mutants=[
    t=>{t.kanon.tor.historie[0].x=0;},
    t=>{t.kanon.tor.historie[0].vx=9999;},
    t=>{t.kanon.tor.genutzt=0;},
    t=>{t.kanon.spielerFrachten.auftraege.at(-1).tor.tick=t.tick;},
    t=>{t.kanon.spielerFrachten.auftraege.at(-1).tor.schiff='fake';},
    t=>{t.kanon.tor.freigaben[fr.id]={...t.kanon.tor.historie[0]};},
    t=>{t.kanon.tor.historie.push({...t.kanon.tor.historie[0]});}
  ];
  for(const mutate of mutants){
    const z=JSON.parse(w.canonical(s));mutate(z);
    assert.equal(w.audit(z).ok,false,'geänderter Vertrag oder Flugbeleg wird zurückgewiesen');
    assert.throws(()=>w.load(JSON.stringify(z)),'F6-Manipulationsabwehr im Save');
  }
  audit(w,s,'Original bleibt nach gefälschten Varianten unangetastet');
});
