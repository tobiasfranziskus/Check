// B4: alle Ergebnisse aus tatsächlich auditierten Varianten, keine Produkt-Goldenwerte.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2),dir=args[0]||'/tmp/b4-minerrolle',dest=args[1]||'/tmp/b4-bericht';
assert(args.length<=2);
const scenarios=['miner','handel-flotte','station','jagd'];
const cases=scenarios.map(x=>JSON.parse(fs.readFileSync(path.join(dir,x+'.json'),'utf8')));
const sha=createHash('sha256').update(fs.readFileSync(new URL('./b4-minerrolle.mjs',import.meta.url))).digest('hex');
const expectedControl={miner:'9b00de8697541ce5','handel-flotte':'b2f44fef99f3d49e',
 station:'7f71d2546a4febfd',jagd:'dc4c66ea46aa08bb'};
const recorded=[];
let md='# B4 – Lebenslauf eines Nadir-Siliziumminers nach Frachteraktivierung\n\n';
md+='[ANALYSE] Vier gleiche B1-Spielerstressfälle, vier getrennte Entscheidungen, keine neuen Wirtschaftsgüter oder Geldquellen. Der Core wird nur im Versuch für bezahlte Rückkehr bzw. ausdrückliche Sollrollenfreigabe modifiziert.\n\n';
md+='| Fall | Variante | Carrier-Silizium neu gefördert | Carrier-Betrieb fällig / bezahlt (ISK) | Minerersatz real gekauft | Fehlende Miner-Sollplätze | Siliziumförderung alle Miner | Aldera/Nadir Lager Silizium | NPC3 Kasse | NPC3 ungedeckter Betrieb |\n';
md+='| --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |\n';
for(const d of cases){
 assert.equal(d.toolSha256,sha,'Werkzeug-SHA-256');
 assert.deepEqual(d.results.map(x=>x.mode),['control','return_native','return_paid','release']);
 const [ctrl,native,paid,release]=d.results;
 const hash=ctrl.initialHash;
 assert(d.results.every(x=>x.initialHash===hash),'gleicher Tag-90-Zustand');
 assert.equal(ctrl.hashes.at(-1).hash,expectedControl[d.scenario],'#37/#40 Tag-365 Kontrollhash');
  assert.equal(ctrl.sourceSha256,native.sourceSha256,'Befehlsversuch nutzt unveränderten Core');
 assert.notEqual(ctrl.sourceSha256,paid.sourceSha256,'Kostenpflicht erfordert klar isolierte Testregel');
 assert.notEqual(ctrl.sourceSha256,release.sourceSha256,'Sollentfall nur in Freigabevariante');
 const at=(x,t)=>{const y=x.milestones.find(z=>z.tick===t);assert(y,'fehlender Ereigniszeitpunkt '+d.scenario+'/'+x.mode+'/'+t);return y;};
 for(const x of d.results){
  assert.equal(x.hashes.length,275,'275 Tage');
  assert.equal(x.roundtrips,12,'sechs Wiederaufnahmen in beiden Replays');
  assert.equal(x.commands.length,x.mode.startsWith('return')?6:4,'nur validierte B1-/Rückreisebefehle');
  assert.equal(at(x,129661).carrier.auftrag,'halten','Aldera stoppt Förderung');
  assert.equal(at(x,129661).carrier.ware,null,'Förderware gelöscht');
  assert.equal(at(x,129661).nadirSiliconSlots,1,'ehemalige Förder-Sollrolle vorhanden');
  assert.equal(at(x,129661).assignedMiners,0,'Carrier erfüllt die Rolle nicht mehr');
  const p=x.points.at(-1);
  assert.equal(p.minerSollTotal,x.mode==='release'?10:11,'Sollrolle nur bewusst gestrichen');
  assert(x.carrierDue>=x.carrierPaid,'keine bezahlten Kosten über fälligen Kosten');
  const costEvents=x.events.filter(e=>e.kind==='carrierCost');
  assert.equal(costEvents.reduce((s,e)=>s+e.due,0),x.carrierDue,'Carrier-Arbeitskosten vollständig');
  assert.equal(costEvents.reduce((s,e)=>s+e.paid,0),x.carrierPaid,'Carrier tatsächlich gezahlt');
  const row={mode:x.mode,endhash:p.hash,minerSoll:p.minerSollTotal,minerOwned:p.minerOwnedTotal,
   newMinerBuys:p.realBuilds.miner,unfilledMiners:p.budget.missingMinerSlots,
   carrier:{id:x.carrier,alive:!!p.carrierStatus,status:p.carrierStatus,mine:x.carrierMined,
    due:x.carrierDue,paid:x.carrierPaid,deathTick:x.carrierLossTick},
   siliconMinedAll:p.siliconTotalMined,alderaSilicon:p.alderaSilicon,nadirSilicon:p.nadirSilicon,
   cash:p.budget.cash,unpaid:p.companyCosts.unpaid,freightNet:p.netOperating,
   minted:x.netMinted,burned:x.netBurned,milestones:x.milestones,
   commands:x.commands,tradeEvents:x.events.filter(e=>e.kind==='trade'&&e.ship===x.carrier),
   lostMinerEvents:x.events.filter(e=>e.kind==='carrierCost')};
  recorded.push({scenario:d.scenario,seed:d.seed,mode:x.mode,results:row});
  md+='| '+d.scenario+' | '+x.mode+' | '+row.carrier.mine+' | '+row.carrier.due+' / '+row.carrier.paid+
   ' | '+row.newMinerBuys+' | '+row.unfilledMiners+' | '+row.siliconMinedAll+
   ' | '+row.alderaSilicon+' / '+row.nadirSilicon+' | '+row.cash+' | '+row.unpaid+' |\n';
 }
 assert.equal(at(release,129663).nadirSiliconSlots,0,'nur Release streicht Originalrolle');
 assert.equal(at(ctrl,129663).nadirSiliconSlots,1);
 assert.equal(at(native,129665).carrier.auftrag,'halten','Original-Return startet gehalten');
 assert.equal(at(paid,129665).carrier.auftrag,'foerdern','Bezahlte Rückfahrt führt wieder Förderauftrag');
 assert.equal(at(paid,129665).carrier.ware,'silizium');
 assert.equal(at(native,129725).carrier.auftrag,'halten','Original schaltet Förderung nicht automatisch ein');
 assert.equal(at(paid,129725).carrier.auftrag,'foerdern','bezahlte Rückfahrt fördert nach Ankunft');
 assert.equal(at(native,129726).carrier.auftrag,'foerdern','gültiges shipMine restauriert Auftrag');
 assert(at(paid,129720).carrierDue>at(native,129720).carrierDue,
  'Kostenpflicht der Rückreise unterscheidet sich vor Wiederaufnahme der Förderung');
}
md+='\n*Carrier-Silizium: tatsächlich durch den ursprünglichen Nadir-Miner neu geförderte Einheiten. Die zweite Förderzahl umfasst alle Miner und kann sich wegen Ersetzungen, Kasseneffekten oder RNG-Abläufen unterscheiden. "return_native" demonstriert eine fehlerhaft kostenlose Rückfahrt; es ist keine wirtschaftlich zulässige Vergleichslösung.*\n';
fs.mkdirSync(dest,{recursive:true});
fs.writeFileSync(path.join(dest,'B4_ERGEBNISSE.md'),md);
fs.writeFileSync(path.join(dest,'b4-minerrolle-daten.json'),JSON.stringify({status:'ANALYSE',toolSha256:sha,basis:cases[0].basis,results:recorded},null,2)+'\n');
console.log('B4_SUMMARY_PASS 4 Fälle × 4 Varianten × 275 Tage = 4400 Tageshashes; B1 und #40 Kontrollen; Auditor und Replay');
console.log(md);
