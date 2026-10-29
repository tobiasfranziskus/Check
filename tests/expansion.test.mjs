import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const {c,b,r}=new Function(source+';return {c:m_core_index,b:m_core_schiffbau,r:m_data_rules.RULES};')();
const ready=()=>c.load(fs.readFileSync(new URL('./fixtures/expansion-ready.json',import.meta.url),'utf8'));
const bought=()=>c.load(fs.readFileSync(new URL('./fixtures/expansion-bought.json',import.meta.url),'utf8'));
function expectUnchanged(s,reason){const before=c.save(s);assert.equal(b.investieren(s,r).reason,reason);assert.equal(c.save(s),before);assert(c.audit(s).ok);}
test('NPC1 kauft den vierten Sollplatz mit eigener Kasse, Ware und bezahlter Reserve',()=>{
 const s=ready(),before=s.owners.npc1.cash,subsidy=s.stats.zuschuss,stock=s.stations.st_aldera.lager.frachter,consumed=s.ledger.frachter.consumed;
 const res=b.investieren(s,r);assert(res.ok);assert.equal(s.sollflotte.npc1.length,4);assert.equal(s.ships[res.schiff].ladung.treibstoff,2);
 assert.equal(s.stations.st_aldera.lager.frachter,stock-1);assert.equal(s.ledger.frachter.consumed,consumed+1);
 assert.equal(s.stats.zuschuss,subsidy);assert.equal(res.vorher,before);assert.equal(res.nachher,s.owners.npc1.cash);assert(res.nachher>=3000);assert(res.nachher<before);assert(c.audit(s).ok);
 assert.equal(c.hash(s),c.hash(bought()));
});
test('Zeit, Höchstgrenze und realer Handel sind Voraussetzungen',()=>{
 const early=ready();early.tick=10079;expectUnchanged(early,'zeit');
 expectUnchanged(bought(),'maximum');
 const idle=ready();for(const ship of Object.values(idle.ships))if(ship.owner==='npc1')ship.auftrag='halten';expectUnchanged(idle,'handel');
});
test('Fehlende Kaufkraft, Ware und Reserve führen zu keiner Scheininvestition',()=>{
 const poor=ready();poor.burned+=poor.owners.npc1.cash-3000;poor.owners.npc1.cash=3000;expectUnchanged(poor,'kapital');
 const empty=ready();empty.ledger.frachter.consumed+=empty.stations.st_aldera.lager.frachter;empty.stations.st_aldera.lager.frachter=0;expectUnchanged(empty,'ware');
 const dry=ready();dry.ledger.treibstoff.consumed+=dry.stations.st_aldera.lager.treibstoff;dry.stations.st_aldera.lager.treibstoff=0;expectUnchanged(dry,'treibstoff');
});
test('Offener Ersatz sperrt Expansion; verlorener Expansionsfrachter wird ohne neuen Sollplatz ersetzt',()=>{
 const missing=ready();const ship=Object.values(missing.ships).find(x=>x.owner==='npc1');
 for(const [w,n]of Object.entries(ship.ladung))missing.ledger[w].consumed+=n;
 delete missing.ships[ship.id];delete missing.stats.verkaeufe[ship.id];expectUnchanged(missing,'ersatz');
 const s=bought(),id=Object.keys(s.ships).sort().at(-1),lost=s.ships[id];assert.equal(lost.owner,'npc1');
 for(const [w,n]of Object.entries(lost.ladung))s.ledger[w].consumed+=n;
 delete s.ships[id];delete s.stats.verkaeufe[id];
 const subsidy=s.stats.zuschuss,old=s.sollflotte.npc1.length;
 b.ersatzkauf(s,r);assert.equal(s.sollflotte.npc1.length,old);assert.equal(Object.values(s.ships).filter(x=>x.owner==='npc1').length,4);assert.equal(s.stats.zuschuss,subsidy);assert(c.audit(s).ok);expectUnchanged(s,'maximum');
});
test('Migration 8→9 und Save/Load erhalten bereits bezahlte Expansion und alle Bestände',()=>{
 for(const s of [ready(),bought()]){
  const copy=structuredClone(s);copy.rulesVersion=8;const loaded=c.load(JSON.stringify(copy));assert.equal(c.hash(loaded),c.hash(s));assert(c.audit(loaded).ok);
  const repeat=c.load(c.save(s));c.advance(s,1000);c.advance(repeat,1000);assert.equal(c.hash(s),c.hash(repeat));assert(c.audit(repeat).ok);
 }
});

test('3000 ISK sind eine echte Grenze nach allen Investitionskosten',()=>{
 const original=ready(),cost=original.owners.npc1.cash-bought().owners.npc1.cash;
 for(const reserve of [2999,3000]){
  const s=ready();s.burned+=s.owners.npc1.cash-(cost+reserve);s.owners.npc1.cash=cost+reserve;
  if(reserve===2999)expectUnchanged(s,'kapital');
  else {const res=b.investieren(s,r);assert(res.ok);assert.equal(res.nachher,3000);assert(c.audit(s).ok);}
 }
});
