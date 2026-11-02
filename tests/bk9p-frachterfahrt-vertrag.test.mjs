// B-K9p: reale, vom Original-Core gesteuerte Frachterfahrten mit Reserve.
// Exakt der r15/Schema9-Draft; Default-Spielversion bleibt Regel14/Schema8.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('const m_data_systeme ='), html.indexOf('const m_data_oberflaeche ='));
const anchor = 'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };';
assert.equal(src.split(anchor).length, 2, 'nur zum Test originalen Verlustpfad sichtbar machen');
const wahl = 'return { entscheidung };';
assert.equal(src.split(wahl).length, 2, 'Original-Autodisposition exakt einmal vorhanden');
const {core,base,entfernen,abflug} = new Function(src.replace(anchor,
  'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, entfernen };')
  .replace(wahl,'return { entscheidung, abflug };')+
  ';return {core:m_core_index,base:m_data_rules.RULES,'+
  'entfernen:m_core_sicherheit.entfernen,abflug:m_core_entscheidung.abflug};')();
const rules={...base,schema:9,rulesVersion:15};
const SEEDS=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
function frachter(s,owner='house'){
  const x=Object.values(s.ships).find(sh=>sh.owner===owner&&sh.klasse==='frachter'&&sh.phase==='dock');
  assert(x,'Frachter vorhanden');return x;
}
function bilanziere(s){
  const frei=Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((a,e)=>a+e.rest,0);
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned);
  const a=core.audit(s);assert(a.ok,JSON.stringify(a));
}
function roundtrip(s) {
  const copy=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(s),core.hash(copy));bilanziere(copy);return copy;
}
function move(s,sh,ziel){
  return core.execute(s,{type:'shipMove',owner:sh.owner,schiff:sh.id,ziel},rules);
}
function runTo(s,tick) {for(;s.tick<tick;)core.step(s,rules);return s;}
function preisReise(r=25){return Math.ceil(r*base.world.betriebskosten.frachter/base.economy.stunde);}

test('B-K9p: produktiver Regel14-Zweig erzeugt keine Fahrtvertraege',()=>{
  assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
  const s=core.createState(42,base),sh=frachter(s);
  const vor=s.owners.house.cash;
  assert(core.execute(s,{type:'shipMove',owner:'house',schiff:sh.id,ziel:'st_cyris'},base).ok);
  assert.equal(s.vertraege,undefined);assert.equal(sh.vertrag,undefined);
  assert.equal(s.owners.house.cash,vor);
  assert(core.audit(s).ok);
});

test('B-K9p: reale 25-Minuten-Fahrt reserviert im Core, bezahlt einmal im Stundentick',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  const budget=preisReise(),cash=s.owners.house.cash, bezahlt=s.stats.konto.house.kosten;
  assert.equal(budget,105);
  assert(move(s,sh,'st_cyris').ok);
  const id=sh.vertrag;assert(id);
  assert.equal(s.vertraege.eintraege[id].rest,budget);
  assert.equal(s.owners.house.cash,cash-budget);
  bilanziere(s);
  runTo(s,12);
  assert.equal(s.ships[sh.id].arbeit,12);
  assert.equal(s.owners.house.cash,cash-budget,'gebundene ISK nicht erneut abziehen');
  const mitSave=roundtrip(s);
  assert.equal(mitSave.ships[sh.id].vertrag,id);
  runTo(s,25);
  assert.equal(sh.phase,'dock');
  assert.equal(sh.system,'cyris');
  assert.equal(sh.vertrag,id,'Vertrag bleibt bis Stundenabrechnung gebunden');
  assert.equal(move(s,sh,'st_aldera').ok,false,'keinen zweiten Vorabvertrag auf die gleiche Arbeitszeit');
  runTo(s,60);
  const e=s.vertraege.eintraege[id];
  assert.equal(e.status,'geschlossen');
  assert.equal(sh.vertrag,undefined);
  assert.equal(e.gezahlt,100); // 24 reale Arbeitsminuten, Original-Core stundengerundet
  assert.equal(e.erstattet,5);
  assert.equal(s.owners.house.cash,cash-e.gezahlt);
  assert.equal(s.stats.konto.house.kosten-bezahlt,e.gezahlt);
  assert.equal(e.belege['leistung:flug:'+sh.id+':60'],100);
  bilanziere(s);roundtrip(s);
});

test('B-K9p: nicht finanzierbarer Start bleibt atomar ohne Teilfahrt und ohne Beleg',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  const fehlt=s.owners.house.cash-(preisReise()-1);
  s.owners.house.cash-=fehlt;s.owners.npc3.cash+=fehlt; // vorhandenes Geld, kein Mint
  const hash=core.hash(s);
  const r=move(s,sh,'st_cyris');
  assert.equal(r.ok,false);
  assert.match(r.reason,/nicht vollstaendig vorfinanziert/);
  assert.equal(core.hash(s),hash,'kein mutierter Zustand beim abgelehnten Befehl');
  assert.equal(sh.phase,'dock');
  assert.equal(s.vertraege.naechster,1);
  bilanziere(s);
});

test('B-K9p: Flug ueber eine Stundenkante bezahlt beide Teilrechnungen einmal',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  runTo(s,50);assert.equal(sh.arbeit,0);
  const cash=s.owners.house.cash,before=s.stats.konto.house.kosten;
  assert(move(s,sh,'st_cyris').ok);
  const id=sh.vertrag;
  runTo(s,60);
  const e=s.vertraege.eintraege[id];
  assert.equal(e.gezahlt,41,'erste 10 Minuten zur Stunde 60');
  assert.equal(e.rest,preisReise()-41);
  assert.equal(e.status,'offen');
  const geladen=roundtrip(s);
  runTo(geladen,120);
  const end=geladen.vertraege.eintraege[id];
  assert.equal(end.gezahlt,99,'10+14 Arbeitsminuten separat gerundet');
  assert.equal(end.erstattet,6);
  assert.equal(end.status,'geschlossen');
  assert.equal(geladen.owners.house.cash,cash-99);
  assert.equal(geladen.stats.konto.house.kosten-before,99);
  bilanziere(geladen);
});

test('B-K9p: Haltebefehl waehrend Reise erlaesst keine erflogene Lohnminute',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  assert(move(s,sh,'st_cyris').ok);
  runTo(s,10);
  assert(core.execute(s,{type:'shipWait',owner:'house',schiff:sh.id},rules).ok);
  const id=sh.vertrag;
  runTo(s,60);
  assert.equal(s.vertraege.eintraege[id].gezahlt,100);
  assert.equal(sh.auftrag,'halten');
  assert.equal(sh.vertrag,undefined);
  bilanziere(s);
});

test('B-K9p: Schiffsverlust rechnet schon geflogene Minuten vor Freigabe ab',()=>{
  const s=core.createState(7,rules),sh=frachter(s);
  const cash=s.owners.house.cash;
  assert(move(s,sh,'st_cyris').ok);
  runTo(s,10);
  assert.equal(sh.arbeit,10);
  const id=sh.vertrag;
  entfernen(s,rules,sh); // der tatsaechlich verwendete Core-Verlustpfad
  const e=s.vertraege.eintraege[id];
  assert.equal(s.ships[sh.id],undefined);
  assert.equal(e.status,'geschlossen');
  assert.equal(e.gezahlt,41); // 10 * 250 / 60, ganzzahlig
  assert.equal(e.erstattet,preisReise()-41);
  assert.equal(s.owners.house.cash,cash-41);
  assert.equal(s.stats.konto.house.kosten,41);
  bilanziere(s);roundtrip(s);
});

test('B-K9p: gekaufte Nahrung hat real bezahlten Hin-/Ruecktransport',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  assert(move(s,sh,'st_cyris').ok);
  runTo(s,60);assert.equal(sh.system,'cyris');assert.equal(sh.vertrag,undefined);
  const kauf=core.execute(s,{type:'shipTrade',owner:'house',schiff:sh.id,
    ware:'nahrung',menge:4,kauf:true},rules);
  assert(kauf.ok,kauf.reason);
  const vor=s.stats.verkaeufe[sh.id],cash=s.owners.house.cash;
  assert(move(s,sh,'st_aldera').ok);
  const id=sh.vertrag;
  assert.equal(s.owners.house.cash,cash-preisReise());
  runTo(s,120);
  assert.equal(sh.system,'aldera');
  assert.equal(sh.ladung.nahrung||0,0);
  assert.equal(s.stats.verkaeufe[sh.id],vor+1);
  assert.equal(s.vertraege.eintraege[id].status,'geschlossen');
  assert.equal(s.vertraege.eintraege[id].gezahlt,100);
  const flug=Object.values(s.vertraege.eintraege).filter(e=>e.fahrt&&e.zahlender==='house');
  assert.equal(flug.length,2);
  assert.equal(flug.reduce((a,e)=>a+e.gezahlt,0),200);
  bilanziere(s);roundtrip(s);
});


test('B-K9p: Original-NPC-Abflug bezahlt Betriebskosten vor und vermeidet leere Storno-Spamvertraege',()=>{
  const s=core.createState(42,rules);
  const sh=Object.values(s.ships).find(x=>x.klasse==='frachter'
    && x.owner==='npc1' && x.system==='aldera');
  assert(sh,'autonomer NPC1-Frachter am realen Startort');
  const start=sh.system, station='st_'+start;
  const former=s.owners.npc1.cash;
  // Die echte Core-Entscheidungsfunktion wird direkt mit einer gueltigen Route
  // aufgerufen; Handels- und Flugausfuehrung bleibt originale NPC-Mechanik.
  assert(abflug(s,rules,sh,station,'st_cyris','eis',3));
  const id=sh.vertrag;
  assert(id);
  assert.equal(s.vertraege.eintraege[id].budget,preisReise());
  assert(s.owners.npc1.cash < former-preisReise(),'Ware und Fahrt sind getrennt bezahlt');
  runTo(s,60);
  assert.equal(s.vertraege.eintraege[id].gezahlt,100);
  assert.equal(s.vertraege.eintraege[id].status,'geschlossen');
  bilanziere(s);roundtrip(s);

  const k=core.createState(42,rules);
  const trader=Object.values(k.ships).find(x=>x.klasse==='frachter'
    && x.owner==='npc1' && x.system==='aldera');
  const moved=k.owners.npc1.cash-105;
  k.owners.npc1.cash-=moved;k.owners.house.cash+=moved;
  const old=core.hash(k);
  for(let i=0;i<5;i++)assert.equal(abflug(k,rules,trader,'st_aldera','st_cyris','eis',3),false);
  assert.equal(core.hash(k),old,'kein unbezahlbares Warenangebot erzeugt eine Contract-Leiche');
  assert.equal(k.vertraege.naechster,1);
  bilanziere(k);
});

test('B-K9p: gespeicherte Fahrtverknuepfungen und falsche Restbetraege werden abgewiesen',()=>{
  const s=core.createState(42,rules),sh=frachter(s);
  assert(move(s,sh,'st_cyris').ok);
  const bad=fn=>{
    const clone=JSON.parse(core.save(s));fn(clone);
    assert.throws(()=>core.load(JSON.stringify(clone),undefined,rules));
  };
  bad(c=>{delete c.ships[sh.id].vertrag;});
  bad(c=>{c.ships[sh.id].vertrag='v999';});
  bad(c=>{c.vertraege.eintraege.v1.rest+=1;});
  bad(c=>{c.vertraege.eintraege.v1.fahrt.schiff='falsch';});
  bad(c=>{c.vertraege.eintraege.v1.status='geschlossen';});
  bilanziere(s);roundtrip(s);
});

test('B-K9p: 13 Seeds, voll finanzierter Single-Hop und Hash-Replays',()=>{
  for(const seed of SEEDS){
    const einmal=()=>{
      const s=core.createState(seed,rules),sh=frachter(s);
      assert(move(s,sh,'st_cyris').ok);
      runTo(s,60);
      bilanziere(s);roundtrip(s);
      return {hash:core.hash(s),cash:s.owners.house.cash,
        kontrakt:s.vertraege.eintraege.v1};
    };
    assert.deepEqual(einmal(),einmal(),'reproduzierbarer Original-Core Seed '+seed);
  }
});
