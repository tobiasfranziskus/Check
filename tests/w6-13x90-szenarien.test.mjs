// W6 [DRAFT/ANALYSE] – 13 wirtschaftlich unterschiedliche 90-Tage-Regime derselben Regel204-Welt
// (gleicher Seed, gleiche Regeln/Preise/Geldmenge; nur gespeichertes Akteursverhalten variiert).
// Ein Zusammenbruch ist ein gültiges Ergebnis; geprüft wird, dass er ehrlich gebucht ist.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W6=require('../tools/w6-szenarien.cjs');

// hash: Referenz nach 129.600 Minuten; aktiv: im letzten Drittel noch Förderung, Absatz und Lohn.
const ERWARTET={
 S01:{hash:'9b8e3482493461d2',aktiv:true},
 S02:{hash:'5582aecc49d4de89',aktiv:true},
 S03:{hash:'2457086d6dc9d3db',aktiv:false,engpass:/Werft kann Material und alle Lohnminuten nicht finanzieren/},
 S04:{hash:'b93426bd306b9801',aktiv:true},
 S05:{hash:'211970d95d14316f',aktiv:false,engpass:/Aldera kann nächste Eischarge nicht bezahlen/},
 S06:{hash:'73f68c113c848f1f',aktiv:false,engpass:/Aldera kann nächste Eischarge nicht bezahlen/},
 S07:{hash:'2060fcb1a3e8babb',aktiv:false},
 S08:{hash:'d0f4db55ff82f74f',aktiv:false,engpass:/Eislager Nadir voll/},
 S09:{hash:'5272be3d5b55d4f0',aktiv:false,engpass:/Eislager Nadir voll/},
 S10:{hash:'5abf6829115e78c8',aktiv:false,engpass:/nicht vorfinanziert/},
 S11:{hash:'d8c1e60ea7d34633',aktiv:true},
 S12:{hash:'c46a93f5c4cc519b',aktiv:false},
 S13:{hash:'b35642dd2bb1705c',aktiv:true},
};
const ergebnis={};
assert.equal(W6.SZENARIEN.length,13);
assert.equal(new Set(W6.SZENARIEN.map(x=>JSON.stringify(x.politik))).size,13,'13 verschiedene Regime, nicht 13 Seeds');

for(const sz of W6.SZENARIEN)test(`W6 ${sz.id}: ${sz.name}`,()=>{
 const r=W6.lauf(sz,90),e=ERWARTET[sz.id],w=r.welt,s=r.zustand;
 ergebnis[sz.id]=r;
 assert.deepEqual(r.fehler,[]);
 assert.equal(s.tick,129600);
 assert.equal(r.hash,e.hash);
 assert.equal(w.hash(w.load(w.save(s))),r.hash,'Save/Load');
 assert.equal(r.aktivZuletzt,e.aktiv);
 if(e.engpass)assert.ok(r.engpass.haeufigste.some(([grund])=>e.engpass.test(grund)),JSON.stringify(r.engpass));
 // Kein Firmenbefehl außerhalb der eigenen Rechte, keiner vom Kern abgelehnt.
 assert.ok(Object.keys(r.befehle).every(k=>/^(npc3|st_nadir):/.test(k)));
 assert.deepEqual(s.kanon.npc.abgelehnt,{});
 // Spieler spart unberührt; kein Schiff ohne bezahlte Lagerentnahme.
 assert.equal(s.owners.house.cash,3000);
 for(const klasse of ['frachter','miner'])
  assert.equal(Object.values(s.ships).filter(sh=>sh.klasse===klasse).length,s.ledger[klasse].consumed);
 console.log('W6_SZENARIO',JSON.stringify({id:r.id,hash:r.hash,aktiv:r.aktivZuletzt,eis:r.ende.eis,
  wasserErloes:r.ende.wasserErloes,frachter:r.ende.frachter,miner:r.ende.miner,ersatz:r.ende.ersatz,
  haushalte:r.ende.haushalte,firmen:r.ende.firmen,engpass:r.engpass?.haeufigste[0]?.[0]??null}));
});

test('W6 13×90: die Regime unterscheiden sich wirtschaftlich, nicht nur im Hash',()=>{
 const e=id=>ergebnis[id].ende;
 assert.equal(Object.keys(ergebnis).length,13);
 assert.equal(new Set(Object.values(ergebnis).map(r=>r.hash)).size,13);
 // Ohne Stilllegung keine Ersatzwirtschaft; mit ihr dauerhaft bezahlte Werftarbeit.
 assert.equal(e('S01').ersatz,0);
 assert.ok(e('S02').ersatz>=90&&e('S02').frachter>=45&&e('S02').miner>=40);
 assert.ok(ergebnis.S02.ersatzZuletzt>=25,'Ersatzkäufe auch im letzten Drittel');
 // Dieselbe Welt bricht ab, wenn die Werft nur einen Bau vorfinanzieren kann.
 assert.ok(e('S03').frachter<e('S02').frachter/4);
 // Nachfragemangel/Geldhortung: Geld bleibt vollständig erhalten, liegt aber fest.
 assert.ok(e('S04').wasserErloes<e('S02').wasserErloes/20);
 assert.ok(e('S05').haushalte>20000&&e('S05').wasserErloes<e('S04').wasserErloes);
 assert.ok(e('S06').firmen>29000&&e('S06').haushalte<100);
 // Rohstoff-/Transport-/Verarbeitungsausfall.
 assert.equal(e('S07').ersatz,0);
 assert.equal(e('S09').wasserErloes,0);
 assert.ok(e('S08').wasserErloes>0&&e('S08').wasserErloes<e('S02').wasserErloes/100);
});
