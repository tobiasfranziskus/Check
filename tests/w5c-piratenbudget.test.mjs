import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {w5bJagdSichtAusCore} from '../prototypes/w5-jagd/m_ui_w5b_bridge.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('const m_data_systeme ='),b=html.indexOf('const m_data_oberflaeche =');
assert.ok(a>=0&&b>a);
const api=Function(html.slice(a,b)+'\nreturn m_core_index;')();
const rules=api.W5C_RULES;
const seeds=[1,2,7,11,13,42,99,123,777,1234,4096,65535,98765];
const exec=(s,x)=>{const r=api.execute(s,x,rules);assert.equal(r.ok,true,JSON.stringify({x,r}));};
const fail=(s,x)=>{const h=api.hash(s);const r=api.execute(s,x,rules);
 assert.equal(r.ok,false,JSON.stringify(x));assert.equal(api.hash(s),h,'kein Neben-Effekt');};
function check(s,where='') {
 const a=api.audit(s);
 assert.equal(a.ok,true,where+' '+JSON.stringify({isk:a.isk,goods:a.goods,w3:a.w3,w4:a.w4,w5:a.w5,w5b:a.w5b,w5c:a.w5c,voll:a.vollkosten}));
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);
 return a;
}
function bauen(seed=42) {
 const s=api.createW5CState(seed);
 check(s,'Start');
 exec(s,{type:'shipBuy',owner:'house',station:'st_nadir',klasse:'miner'});
 const miner=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner'&&x.system==='nadir');
 exec(s,{type:'shipMine',owner:'house',schiff:miner.id,ware:'silizium'});
 api.advance(s,50,rules);
 exec(s,{type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_aldera'});
 const frachter=Object.values(s.ships).find(x=>x.owner==='transport'&&x.klasse==='frachter'&&x.system==='aldera');
 exec(s,{type:'shipFreight',owner:'transport',schiff:frachter.id});
 api.advance(s,120,rules);
 for(let i=0;i<4;i++) {
   exec(s,{type:'stationRefine',owner:'st_nadir',station:'st_nadir'});
   api.advance(s,20,rules);
 }
 exec(s,{type:'stationBuildParts',owner:'house',station:'st_nadir'});
 api.advance(s,64,rules);
 exec(s,{type:'stationBuildFighter',owner:'house',station:'st_nadir'});
 api.advance(s,32,rules);
 assert.equal(s.stations.st_nadir.lager.jaeger,1);
 check(s,'Fertigwarenlager');
 return s;
}
function fertig(seed=42) {
 const s=bauen(seed);
 exec(s,{type:'shipBuy',owner:'npc3',klasse:'jaeger',station:'st_nadir'});
 assert.equal(s.stations.st_nadir.lager.jaeger,0);
 assert.equal(s.ledger.jaeger.consumed,1);
 check(s,'NPC bezahlt');
 return s;
}
const angebot=s=>s.w5b.schiffIds[0];

test('W5c: isolierter Regel21-Start ist endlich finanziert und alte Regeln bleiben abweisend',()=>{
 const s=api.createW5CState(42),before=api.hash(s);
 assert.equal(s.rulesVersion,21);
 assert.equal(s.owners.pirates.cash,900);
 assert.equal(s.owners.st_nadir.cash,3100);
 assert.equal(s.ledger.jaeger.initial,0);
 assert.equal(Object.values(s.ships).filter(x=>x.klasse==='jaeger').length,0);
 fail(s,{type:'pirateBuy',owner:'pirates',angebot:'sh999'});
 fail(s,{type:'shipHunt',owner:'npc3',schiff:'sh999'});
 assert.equal(api.hash(s),before);
 assert.throws(()=>api.loadW5B(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.loadW5C(api.save(api.createW5BState(42))),/inkompatibel/);
 assert.equal(api.hash(api.loadW5C(api.save(s))),before);
 assert.equal(api.audit(api.createW5BState(42)).ok,true);
 check(s,'W5c Anfang');
});
test('W5c: gekaufte Industriehuelle geht nur gegen 900 vorhandene ISK in Piratenbesitz',()=>{
 const s=fertig(),id=angebot(s),npc=s.owners.npc3.cash,stock=s.ledger.jaeger.consumed;
 const schiffe=Object.keys(s.ships).length;
 fail(s,{type:'pirateBuy',owner:'house',angebot:id});
 fail(s,{type:'pirateBuy',owner:'pirates',angebot:'erfunden'});
 exec(s,{type:'pirateBuy',owner:'pirates',angebot:id});
 assert.equal(s.owners.pirates.cash,0);
 assert.equal(s.owners.npc3.cash,npc+900);
 assert.equal(s.ships[id].owner,'pirates');
 assert.equal(s.ships[id].auftrag,'pirat');
 assert.equal(s.ledger.jaeger.consumed,stock);
 assert.equal(Object.keys(s.ships).length,schiffe,'kein neues Schiff erschaffen');
 assert.equal(s.w5c.piratenAusgaben,900);
 fail(s,{type:'pirateBuy',owner:'pirates',angebot:id});
 const view=w5bJagdSichtAusCore(api.JagdSichtV1(s));
 assert.deepEqual(view.schiffe.map(x=>x.besitzer),[{id:'pirates',art:'pirat'}]);
 assert.equal(view.ereignisse.length,0);
 assert.equal(api.hash(api.loadW5C(api.save(s))),api.hash(s));
 check(s,'Piratenkauf');
});
test('W5c: vorfinanzierter Jagddienst verbucht Geldtransfer und stoppt nach verbrauchtem Budget',()=>{
 const s=fertig(7),id=angebot(s);
 fail(s,{type:'shipHunt',owner:'pirates',schiff:id});
 const cash=s.owners.npc3.cash,fonds=s.owners.fonds_transport.cash;
 exec(s,{type:'shipHunt',owner:'npc3',schiff:id});
 assert.equal(s.owners.npc3.cash,cash-50);
 assert.equal(s.owners.fonds_transport.cash,fonds+50);
 assert.equal(s.w5c.bezahlteStunden,1);
 assert.equal(s.ships[id].auftrag,'jagd');
 fail(s,{type:'shipHunt',owner:'npc3',schiff:id});
 api.advance(s,59,rules);
 assert.equal(s.w5c.bezahlteStunden,1);
 check(s,'Jagd nach 59 Minuten');
 api.advance(s,1,rules);
 assert.equal(s.w5c.bezahlteStunden,2,'naechste Stunde wurde im Voraus bezahlt');
 assert.equal(s.w5c.jagdKosten,100);
 check(s,'Jagd nach 60 Minuten');
 for(let i=0;i<100;i++)api.advance(s,60,rules);
 assert.equal(s.ships[id].auftrag,'halten');
 assert.equal(s.w5c.budgetStopps,1);
 assert.equal(s.owners.npc3.cash,40,'keine Teilzahlung oder unbezahlte Jagd');
 assert.equal(s.w5c.jagdKosten,3900);
 assert.equal(s.minted,0);
 assert.equal(s.stats.kopfgeld,0,'keine vorgetaeuschten Kampfbelohnungen');
 fail(s,{type:'shipHunt',owner:'npc3',schiff:id});
 assert.equal(api.hash(api.loadW5C(api.save(s))),api.hash(s));
 check(s,'Nullbudget-Abbruch');
});
test('W5c: Abbruch erlaubt erst danach Piratenverkauf; gefaelschte Buchungen fallen im Audit auf',()=>{
 const s=fertig(11),id=angebot(s);
 exec(s,{type:'shipHunt',owner:'npc3',schiff:id});
 fail(s,{type:'pirateBuy',owner:'pirates',angebot:id});
 exec(s,{type:'shipWait',owner:'npc3',schiff:id});
 assert.equal(s.w5c.jagdAktivId,null);
 exec(s,{type:'pirateBuy',owner:'pirates',angebot:id});
 check(s,'nach manueller Jagdpause');
 const money=api.loadW5C(api.save(s));
 money.owners.pirates.cash+=900;
 money.owners.npc3.cash-=900;
 assert.equal(api.audit(money).isk.ok,true);
 assert.equal(api.audit(money).w5c.ok,false,'bilanzneutraler Piratengeld-Trick erkannt');
 assert.throws(()=>api.loadW5C(api.save(money)),/bilanz fehlerhaft/);
 const fake=api.loadW5C(api.save(s));
 fake.w5c.kaufIds=[];
 assert.equal(api.audit(fake).ok,false,'gestrichener Kaufbeleg erkannt');
});
test('W5c: 13 Seeds mal 90 Tage, deterministische Wiederholung und Save/Load',()=>{
 for(const seed of seeds) {
   const s=fertig(seed);
   exec(s,{type:'pirateBuy',owner:'pirates',angebot:angebot(s)});
   const replay=api.loadW5C(api.save(s));
   for(let day=1;day<=90;day++) {
     api.advance(s,1440,rules);
     api.advance(replay,1440,rules);
     check(s,'Seed '+seed+' Tag '+day);
     assert.equal(api.hash(s),api.hash(replay),'W5c-Replay '+seed+'/'+day);
   }
   assert.equal(s.w5c.kaufIds.length,1);
   assert.equal(s.ledger.jaeger.produced,1);
   assert.equal(s.ledger.jaeger.consumed,1);
   assert.equal(api.hash(api.loadW5C(api.save(s))),api.hash(s));
   console.log('W5C_90T '+JSON.stringify({seed,hash:api.hash(s),
     verkauft:s.w5b.jaegerVerkauft,piratenKauf:s.w5c.piratenAusgaben,minted:s.minted}));
 }
});
