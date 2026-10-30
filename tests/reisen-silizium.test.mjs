// Neue Wirtschaftsregel: freie Sternentorreisen und Silizium als Industrierohstoff.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const { c, r, b, p }=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES,b:m_core_schiffbau,p:m_core_produktion};')();

test('Silizium ist abbaubar und wird für Bauteile benötigt; Flugtreibstoff existiert nicht',()=>{
 assert.equal(r.economy.waren.treibstoff,undefined);
 assert.equal(r.economy.waren.silizium.stufe,'rohstoff');
 assert.equal(r.economy.rezepte.r_treibstoff,undefined);
 assert.equal(r.economy.rezepte.r_bauteil.ein.silizium,1);
 assert(r.world.fields.some(f=>f.system==='dravos'&&f.ware==='silizium'));
 assert(Object.values(r.world.stations).some(st=>st.ziel.silizium>0));
 assert(Object.values(r.world.stations).every(st=>!Object.hasOwn(st.verbrauch,'treibstoff')));
});

test('Spielerfrachter reist ohne ISK, ohne lokale Rohstoffvorräte und ohne Warenverbrauch',()=>{
 const s=c.createState(7), sh=Object.values(s.ships).find(z=>z.owner==='house'&&z.klasse==='frachter');
 assert(sh);
 const cash=s.owners.house.cash;s.owners.house.cash=0;s.burned+=cash;
 const sil=s.stations.st_aldera.lager.silizium;s.stations.st_aldera.lager.silizium=0;s.ledger.silizium.consumed+=sil;
 const goods=structuredClone(s.ledger);
 const result=c.execute(s,{owner:'house',schiff:sh.id,type:'shipMove',ziel:'st_cyris'});
 assert(result.ok, result.reason);assert.equal(sh.phase,'reise');assert.equal(sh.ziel,'st_cyris');
 assert.deepEqual(s.ledger,goods);assert(c.audit(s).ok);
 c.advance(s,25);
 assert.equal(sh.system,'cyris');assert.equal(sh.phase,'dock');assert(c.audit(s).ok);
});

test('Autonome NPC-Frachter handeln auch ohne Flugtreibstoff weiter',()=>{
 const s=c.createState(11);c.advance(s,360);
 assert(Object.values(s.ships).some(sh=>sh.owner==='npc1'&&sh.auftrag==='handeln'));
 assert(s.stats.handel>0);
 assert(c.audit(s).ok);
});

test('Bauteilproduktion verbraucht Silizium als reales Industriegut',()=>{
 const s=c.createState(42),before=s.ledger.silizium.consumed;
 const lin=s.stations.st_aldera.linien.find(l=>l.rezept==='r_bauteil');
 assert(lin);lin.rest=0;
 p.produktion(s,r);
 assert.equal(s.ledger.silizium.consumed,before+1);
 assert(c.audit(s).ok);
});

test('NPC-Ersatzfrachter wird bezahlt und darf ohne Treibstoff überführt werden',()=>{
 const s=c.createState(7),old=Object.values(s.ships).find(sh=>sh.owner==='npc1');
 assert(old);for(const [ware,n] of Object.entries(old.ladung))s.ledger[ware].consumed+=n;
 delete s.ships[old.id];delete s.stats.verkaeufe[old.id];
 const cash=s.owners.npc1.cash,stock=s.stations.st_aldera.lager.frachter;
 b.ersatzkauf(s,r);
 assert.equal(Object.values(s.ships).filter(sh=>sh.owner==='npc1').length,3);
 assert.equal(s.stations.st_aldera.lager.frachter,stock-1);
 assert(s.owners.npc1.cash<cash);
 assert(c.audit(s).ok);
});

test('Neue Regelversion lädt; alte Treibstoffökonomie wird klar abgelehnt',()=>{
 const s=c.createState(1),restored=c.load(c.save(s));
 assert.equal(r.rulesVersion,9);assert.equal(restored.rulesVersion,9);
 assert.equal(c.hash(s),c.hash(restored));
 const alt=structuredClone(s);alt.rulesVersion=8;
 assert.throws(()=>c.load(JSON.stringify(alt)),/keine Regelmigration vorhanden/);
});

test('Freie Reisen bleiben für mehrere Seeds deterministisch und bilanztreu',()=>{
 for(const seed of [7,11,42]){
  const s=c.createState(seed),t=c.createState(seed);
  c.advance(s,4320);c.advance(t,4320);
  assert.equal(c.hash(s),c.hash(t),'Seed '+seed);
  assert(c.audit(s).ok);assert(c.audit(t).ok);
 }
});
