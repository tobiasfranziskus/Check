// B-K9: Neue produktive, aber noch nicht aktive Core-Preflightfunktion.
// Kein Vertragsbuch, kein Minting, keine Bearbeitung des Spielzustands.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(source+
  ';return {core:m_core_index,rules:m_data_rules.RULES};')();
const angebot=core.nahrungsangebot;
assert.equal(typeof angebot,'function','über offiziellen Core-Index nutzbar');
assert.equal(rules.rulesVersion,14);assert.equal(rules.schema,8);
function seedState(seed=42){
  const s=core.createState(seed,rules);
  const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&x.system==='cyris'&&x.ware==='eis');
  const frachter=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='npc1'&&x.system==='cyris'&&x.phase==='dock');
  assert(miner&&frachter,'echte Startschiffe aus Original-Regel14');
  const a={quelle:'st_cyris',ziel:'st_aldera',miner:miner.id,frachter:frachter.id,
    menge:3,endpreis:400,fabriklohn:9,ersatzFahrten:20};
  return {s,a,miner,frachter};
}
function calc(s,a){const hash=core.hash(s),before=core.save(s);const x=angebot(s,rules,a);
  assert.equal(core.hash(s),hash,'Preflight darf niemals die Welt verändern');
  assert.equal(core.save(s),before);
  assert(core.audit(s).ok);
  return x;
}
function transfer(s,from,to,amount){
  assert(s.owners[from].cash>=amount);
  s.owners[from].cash-=amount;s.owners[to].cash+=amount;
}
test('B-K9: Ein echter Cyris→Aldera-Nahrungsauftrag ist bei ausreichendem Festpreis und vier echten Kassen finanzierbar',()=>{
  const {s,a}=seedState();
  const x=calc(s,a);
  assert.deepEqual(x.fehler,[]);
  assert.equal(x.ok,true);assert.equal(x.reserviert,false);
  assert.equal(x.menge,3);
  assert.equal(x.kosten.rohwert,6*core.preis(s,'st_cyris','eis'));
  assert.equal(x.kosten.minerkosten,15);
  assert.equal(x.kosten.frachterlohn,250,'ganze Stunde als konservative Reserve, kein 25-Minuten-Scheingewinn');
  assert.equal(x.zeit.flugminuten,25);
  assert.equal(x.zeit.rezeptminuten,18);
  assert.equal(x.kosten.ersatzruecklage,Math.ceil(x.kosten.huellenpreis/20));
  assert(x.margen.miner>=0&&x.margen.fabrik>=0&&x.margen.frachter>=0);
  assert(x.benoetigt.kunde<=x.haben.kunde);
  console.log('BK9_ECHTES_ANGEBOT '+JSON.stringify(x));
});
test('B-K9: Kunde ohne Kasse wird vor Mining, Produktion oder Abflug ohne Mutation abgewiesen',()=>{
  const {s,a}=seedState();
  transfer(s,'st_aldera','house',4000);
  const x=calc(s,a);
  assert.equal(x.ok,false);assert(x.fehler.includes('KASSE_KUNDE'));
});
test('B-K9: Fabrik darf künftigen Auftragserlös nicht zur Vorausfinanzierung der Eisrechnung verwenden',()=>{
  const {s,a}=seedState();transfer(s,'st_cyris','house',4000);
  const x=calc(s,a);
  assert.equal(x.ok,false);assert(x.fehler.includes('KASSE_FABRIK'));
});
test('B-K9: Auch der Miner muss seine echte anfallende Arbeit bereits finanzieren können',()=>{
  const {s,a}=seedState();transfer(s,'npc3','house',2000);
  const x=calc(s,a);
  assert.equal(x.ok,false);assert(x.fehler.includes('KASSE_MINER'));
});
test('B-K9: Frachterkasse muss Quellkauf, beiden Gebühren, volle Flugstunde UND Ersatzreserve abdecken',()=>{
  const {s,a}=seedState();transfer(s,'npc1','house',3000);
  const x=calc(s,a);
  assert.equal(x.ok,false);assert(x.fehler.includes('KASSE_FRACHTER'));
});
test('B-K9: Positiver bloßer Rohhandel deckt keine vollen Frachterkosten bei zu niedrigem Endpreis',()=>{
  const {s,a}=seedState();a.endpreis=40;
  const x=calc(s,a);
  assert.equal(x.ok,false);assert(x.fehler.includes('FRACHTER_VERLUST'));
});
test('B-K9: Produktmodell nimmt unbekannten Lohn, Nullrücklage und ungültige Mengen nicht kommentarlos an',()=>{
  const {s,a}=seedState();
  for(const mutate of [
    x=>{x.fabriklohn=0;},x=>{x.ersatzFahrten=0;},x=>{x.menge=-2;},
    x=>{x.endpreis=1.5;},x=>{x.menge=101;}
  ]) {const x={...a};mutate(x);const q=calc(s,x);assert.equal(q.ok,false);}
});
test('B-K9: Ohne echte Rezeptlinie oder Minenarbeit kein finanzierbares Angebot',()=>{
  const {s,a,miner}=seedState();
  s.stations.st_cyris.linien=[];
  assert(calc(s,a).fehler.includes('FABRIK'));
  s.stations.st_cyris.linien=[{rezept:'r_nahrung',rest:0,herkunft:'npc'}];
  miner.auftrag='halten';
  assert(calc(s,a).fehler.includes('MINER'));
});
test('B-K9: Kettenangebot darf weder gefährliche Route noch Frachter am falschen Ort als sicher behandeln',()=>{
  const {s,a,frachter}=seedState();
  a.ziel='st_dravos';
  assert(calc(s,a).fehler.includes('RISIKOROUTE'));
  a.ziel='st_aldera';frachter.system='aldera';
  assert(calc(s,a).fehler.includes('FRACHTER'));
});
test('B-K9: Angebotsfähigkeit für echte verfügbare Zielspeicherfläche erforderlich',()=>{
  const {s,a}=seedState();
  s.stations.st_aldera.lager.nahrung=core.obergrenze(s,rules,'st_aldera','nahrung');
  // Testfixture verändert Bestand: unabhängiges Warenledger berichtigen.
  const diff=s.stations.st_aldera.lager.nahrung-20;
  s.ledger.nahrung.initial+=diff;
  const x=calc(s,a);assert(x.fehler.includes('LAGERPLATZ'));
});
test('B-K9: Keine Weltveränderung und deterministische Quote in 13 festen Seeds',()=>{
  for(const seed of [1,2,7,11,13,42,99,123,1001,1234,9876,98765,65535]){
    const {s,a}=seedState(seed);
    const x=calc(s,a);const y=calc(s,a);
    assert.deepEqual(x,y);
    assert.equal(x.ok,true,'Seed '+seed);
  }
});
test('B-K9: Auch 1 voller passiver Tag ändert durch die nur lesbare neue Core-Funktion keinerlei bekannte Spielregeln',()=>{
  for(const seed of [7,42]){
    const {s,a}=seedState(seed);
    const q=calc(s,a);
    assert(q.ok);
    const copy=core.load(core.save(s));
    assert.equal(core.hash(copy),core.hash(s));
    core.advance(s,1440,rules);
    const second=core.load(core.save(s));
    assert.equal(core.hash(second),core.hash(s));
    assert(core.audit(s).ok);
  }
});

test('B-K9: Derselbe Konzern darf Miner und Frachter betreiben, aber 439 ISK nie zweimal zur Deckung zählen',()=>{
  const {s,a,miner}=seedState();
  miner.owner='npc1'; // künstliche Besitzerkombination, keine gratis Kasse
  const offer=calc(s,a);
  assert.equal(offer.ok,true,'Gemeinsamer Besitzer ist grundsätzlich zugelassen');
  const minBalance=Math.max(offer.benoetigt.miner,offer.benoetigt.frachter);
  transfer(s,'npc1','house',s.owners.npc1.cash-minBalance);
  const insuff=calc(s,a);
  assert.equal(insuff.haben.frachter,minBalance);
  assert(!insuff.fehler.includes('KASSE_FRACHTER'));
  assert(!insuff.fehler.includes('KASSE_MINER'));
  assert(insuff.fehler.includes('KASSE_GEMEINSAM_npc1'));
  assert.equal(insuff.ok,false);
});
test('B-K9: Der derzeitige Aldera-Spotpreis deckt den vollständigen sicheren Ferntransport nicht',()=>{
  const {s,a}=seedState();
  a.endpreis=core.preis(s,'st_aldera','nahrung');
  const q=calc(s,a);
  assert(!q.ok);
  assert(q.fehler.includes('FRACHTER_VERLUST'));
  console.log('BK9_SPOTPREIS_GRENZE '+JSON.stringify({
    spotNahrung:a.endpreis,prognose:q.margen.frachter,
    transportreserve:q.kosten.frachterlohn,
    ersatzreserve:q.kosten.ersatzruecklage,
    note:'400 ISK je Stück im positiven Test ist nur hypothetischer Festpreis, keine tatsächliche Marktnachfrage'
  }));
});
test('B-K9: 2^53-Überlauf im Vertragswert kann weder Quote noch Budget schaffen',()=>{
  const {s,a}=seedState();
  a.endpreis=Number.MAX_SAFE_INTEGER;
  const q=calc(s,a);
  assert.equal(q.ok,false);
  assert(q.fehler.includes('UEBERLAUF'));
});


test('B-K9: Marktpreis und tatsächlich kostendeckender Vertragsmindestpreis werden exakt unterschieden',()=>{
  const {s,a}=seedState();
  const q=calc(s,a);
  assert.equal(q.markt.aktuellerZielpreis,core.preis(s,'st_aldera','nahrung'));
  assert.equal(q.markt.aktuellerZielpreis,30);
  const floor=q.markt.frachtKostendeckendAb;
  assert.equal(floor,136,'3 Nahrung Cyris–Aldera: voll gebundene 250 ISK Reise-/39 ISK Ersatzreserve');
  assert(floor>q.markt.aktuellerZielpreis);
  const just=calc(s,{...a,endpreis:floor});
  assert(just.margen.frachter>=0);
  const tooLow=calc(s,{...a,endpreis:floor-1});
  assert(tooLow.margen.frachter<0);
  assert(tooLow.fehler.includes('FRACHTER_VERLUST'));
  console.log('BK9_MINDESTPREIS '+JSON.stringify({
    aktuellerSpotpreis:q.markt.aktuellerZielpreis,
    konservativerFrachtMindestpreis:floor,
    verlustBeiSpot:calc(s,{...a,endpreis:q.markt.aktuellerZielpreis}).margen.frachter
  }));
});
