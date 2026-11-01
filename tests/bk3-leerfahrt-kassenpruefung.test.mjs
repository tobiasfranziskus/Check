// BK3: echte Regel-15-Produktfunktion gegen Regel-14-Kontrollpfad.
// Originalkasse, Originalrouten, Original-RNG und volle Core-60min-Schritte.
// Kein künstliches Geld oder Änderungen an nicht betroffenen Warenfahrten.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const {c,r,entscheidung}=new Function(code+
 ';return {c:m_core_index,r:m_data_rules.RULES,entscheidung:m_core_entscheidung.entscheidung};')();
assert.equal(r.rulesVersion,15);
const old={...r,rulesVersion:14};
function fixture(seed=42,count=1){
 const s=c.createState(seed,r);
 const ship=Object.values(s.ships).filter(x=>x.owner==='npc1'&&x.klasse==='frachter').slice(0,count);
 assert.equal(ship.length,count);
 for(const sh of Object.values(s.ships))sh.auftrag='halten';
 for(const sh of ship){
  sh.auftrag='handeln';sh.warten=2;sh.phase='dock';sh.ankunft=0;sh.ladung={};
 }
 return {s,ship};
}
function clearBuyers(s){
 // Reale Kassenverschiebung zum Fonds, kein Veraendern der Warenbilanzen:
 // ohne einen zahlungsfaehigen Zielmarkt sind nur Leerpositionierungen moeglich.
 for(const station of Object.keys(s.stations)){
  const n=s.owners[station].cash;
  s.owners[station].cash=0;
  s.owners.fonds_aldera.cash+=n;
 }
 assert(c.audit(s).ok);
}
function setCash(s,owner,n){
 assert(Number.isSafeInteger(n)&&n>=0);
 const difference=s.owners[owner].cash-n;
 assert(s.owners.fonds_aldera.cash+difference>=0);
 s.owners[owner].cash=n;
 s.owners.fonds_aldera.cash+=difference;
 assert(c.audit(s).ok);
}
test('BK3: geschaeftsunfaehiger NPC-Frachter startet keine automatische Leerfahrt',()=>{
 const {s,ship:[sh]}=fixture();
 setCash(s,'npc1',0);
 const vorher=s.owners.npc1.cash,ware=c.save(s);
 entscheidung(s,r);
 assert.equal(sh.phase,'dock');
 assert.equal(sh.warten,2);
 assert.equal(sh.ankunft,r.world.warteLeer);
 assert.equal(s.owners.npc1.cash,vorher);
 assert(c.audit(s).ok);
 assert.notEqual(c.save(s),ware,'ein konkreter Wartezeitpunkt wird gespeichert');
});
test('BK3: Regel-14-Kontrolle faehrt mit 0 ISK los (historisches Problem)',()=>{
 const {s,ship:[sh]}=fixture();
 s.rulesVersion=14;
 setCash(s,'npc1',0);
 entscheidung(s,old);
 assert.equal(sh.phase,'reise');
 assert.notEqual(sh.ziel,null);
 assert.equal(s.owners.npc1.cash,0);
 assert(c.audit(s).ok);
});
test('BK3: positive Restkasse bleibt trotz nicht gesicherter Vollkosten frei disponierbar',()=>{
 const {s,ship:[sh]}=fixture();
 setCash(s,'npc1',249);clearBuyers(s);
 entscheidung(s,r);
 assert.equal(sh.phase,'reise','die problematische Vollkostensperre ist zurueckgenommen');
 assert.equal(s.owners.npc1.cash,249,'Leerfahrt entnimmt beim Abflug kein Geld');
 assert(c.audit(s).ok);
});
test('BK3: ein finanziertes Schiff kann weiterhin automatisch umpositionieren',()=>{
 const {s,ship:[sh]}=fixture();
 setCash(s,'npc1',500);clearBuyers(s);
 entscheidung(s,r);
 assert.equal(sh.phase,'reise');
 const target=sh.ziel;
 const route=c.route(r.world,sh.system,r.world.stations[target].system);
 const cost=Math.ceil(route.zeit/r.economy.stunde)*r.world.betriebskosten.frachter;
 assert(cost<=500);
 assert(c.audit(s).ok);
});
test('BK3: eine positive gemeinsame Kasse ist KEINE atomare Budgetreservierung',()=>{
 const {s,ship}=fixture(42,2);
 setCash(s,'npc1',250);clearBuyers(s);
 entscheidung(s,r);
 assert.equal(ship.filter(x=>x.phase==='reise').length,2,
   'die positive Kasse ist nur Freigabekriterium; NICHT als Full-Cost-Escrow deklarieren');
 assert(c.audit(s).ok);
});
test('BK3: gleiche Regeln/Seed -> identische Hashes und Geld-/Warenbuchungen im Original-Core',()=>{
 for(const seed of [7,13,42]){
  const a=fixture(seed),b=fixture(seed);
  setCash(a.s,'npc1',0);setCash(b.s,'npc1',0);
  entscheidung(a.s,r);entscheidung(b.s,r);
  assert.equal(c.hash(a.s),c.hash(b.s));
  c.advance(a.s,1440,r);c.advance(b.s,1440,r);
  assert.equal(c.hash(a.s),c.hash(b.s));
  assert(c.audit(a.s).ok);assert(c.audit(b.s).ok);
 }
});
test('BK3: v14 Save migriert ohne Waren- oder Kassenveraenderung nach Regel 15',()=>{
 const s=c.createState(42,r),v14=JSON.parse(c.save(s));
 v14.rulesVersion=14;
 const vor=JSON.stringify(v14);
 const next=c.load(vor,undefined,r);
 assert.equal(next.rulesVersion,15);
 assert.equal(next.schema,8);
 assert.deepEqual(next.owners,v14.owners);
 assert.deepEqual(next.stations,v14.stations);
 assert.deepEqual(next.ships,v14.ships);
 assert.deepEqual(next.ledger,v14.ledger);
 assert.equal(JSON.stringify(v14),vor);
 assert.equal(c.hash(c.load(c.save(next),undefined,r)),c.hash(next));
 assert(c.audit(next).ok);
 const future={...next,rulesVersion:16};
 assert.throws(()=>c.load(JSON.stringify(future),undefined,r),/neuer/);
});

test('BK3: zwei NPC-Frachter mit derselben Nullkasse bleiben beide am Dock',()=>{
 const {s,ship}=fixture(42,2);
 setCash(s,'npc1',0);clearBuyers(s);
 entscheidung(s,r);
 assert(ship.every(x=>x.phase==='dock'));
 assert(ship.every(x=>x.ankunft===r.world.warteLeer));
 assert(c.audit(s).ok);
});
test('BK3: Nullkassen-Frachter erzeugt im 60-Minuten-Original-Core keine neuen Arbeitskosten',()=>{
 const {s,ship:[sh]}=fixture();
 setCash(s,'npc1',0);clearBuyers(s);
 const kosten=s.stats.konto.npc1.kosten;
 c.advance(s,60,r);
 assert.equal(sh.phase,'dock');
 assert.equal(sh.auftrag,'handeln');
 assert.equal(s.stats.konto.npc1.kosten,kosten);
 assert.equal(s.owners.npc1.cash,0);
 assert(c.audit(s).ok);
});
