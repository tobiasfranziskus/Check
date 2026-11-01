// B-K9b – ein real gefahrenes MARKTPREIS-Frachtticket im Original-Core.
// Die vier Sperrkonten sind ausdruecklich NUR TESTINSTRUMENTIERUNG.
// Noch kein produktiver Save-vertraeglicher Vertragskern.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const h='st_aldera',q='st_cyris',buyer='bk9b_buyer',wages='bk9b_wages',hull='bk9b_hull',park='bk9b_park';
function give(s,from,to,n){
  assert(Number.isSafeInteger(n)&&n>=0);
  assert(s.owners[from].cash>=n,'real vorhandene ISK '+from);
  s.owners[from].cash-=n;s.owners[to].cash+=n;
}
function check(s){
  assert(core.audit(s).ok);
  assert.equal(Object.values(s.owners).reduce((a,x)=>a+x.cash,0),
    s.initialSupply+s.minted-s.burned);
}
function book(s){
  for(const name of [buyer,wages,hull,park]){
    assert(!s.owners[name]);
    s.owners[name]={id:name,kind:'test-nur-treuhand',cash:0};
    s.stats.konto[name]={erloes:0,kosten:0};
    s.stats.abgabe[name]=0;
  }
}
function make(){
  const s=core.createState(7,rules);
  const m=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(core.execute(s,{type:'shipMine',owner:'house',schiff:m.id,ware:'erz'},rules).ok);
  core.advance(s,5760,rules);
  check(s);
  const x=core.load(core.save(s));
  const origMiner=Object.values(x.ships).find(t=>t.klasse==='miner'&&t.owner==='npc3'&&t.ware==='eis');
  const origTrader=Object.values(x.ships).find(t=>t.klasse==='frachter'&&t.owner==='npc1');
  assert(origMiner&&origTrader);
  // Isolierte Angebotsprobe: vorhandenem Original-NPC1-Schiff wird
  // einmalig das Quellsystem zugeordnet. Kein neues Schiff oder Kapital.
  for(const sh of [origMiner,origTrader]){
    for(const [ware,n] of Object.entries(sh.ladung))x.ledger[ware].consumed+=n;
    sh.ladung={};sh.system='cyris';sh.phase='dock';sh.ziel=null;sh.ankunft=x.tick;
    sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';
    sh.ware=sh.klasse==='miner'?'eis':null;sh.arbeit=0;
  }
  // Andere Schiffe parken, damit die konkrete Reise NICHT durch
  // unverbundene AI-Routen verfaelscht wird. Ihre Waren bleiben bestehen.
  for(const sh of Object.values(x.ships)){
    if(sh.id===origMiner.id||sh.id===origTrader.id)continue;
    sh.auftrag='halten';sh.phase='dock';sh.ziel=null;sh.ankunft=x.tick;sh.arbeit=0;
  }
  check(x);
  const a={quelle:q,ziel:h,miner:origMiner.id,frachter:origTrader.id,
    menge:13,fabriklohn:39,ersatzFahrten:20};
  const quote=core.nahrungsmarktangebot(x,rules,a);
  assert.equal(quote.ok,true,JSON.stringify(quote.fehler));
  assert.equal(quote.endpreis,53);assert.equal(quote.margen.frachter,73);
  return {s:x,quote,ship:origTrader};
}
test('BK9b: reale profitable 13-Nahrungs-Lieferung, Käufer-ISK vorab gebunden, Originalkauf/Flug/Verkauf/Lohn',()=>{
  const {s,quote,ship}=make();
  const start={buyer:s.owners[h].cash,trader:s.owners[ship.owner].cash,
    foodSource:s.stations[q].lager.nahrung,foodDest:s.stations[h].lager.nahrung,
    traded:s.stats.handel,wageStats:s.stats.konto[ship.owner].kosten,
    minted:s.minted,created:s.ledger.nahrung.produced,
    travelled:s.tick};
  book(s);
  // FINANZIERUNG NUR aus bestehenden Kassen. Bezahlbar trotz
  // zeitweilig leerer Zielkasse nach Vertragsbindung.
  give(s,h,buyer,quote.kosten.verkaufswert);
  give(s,ship.owner,wages,quote.kosten.frachterlohn);
  give(s,ship.owner,hull,quote.kosten.ersatzruecklage);
  check(s);
  const buy=core.execute(s,{type:'shipTrade',owner:ship.owner,schiff:ship.id,
    ware:'nahrung',menge:13,kauf:true},rules);
  assert(buy.ok,JSON.stringify(buy));
  assert.equal(ship.ladung.nahrung,13);
  assert.equal(s.stations[q].lager.nahrung,start.foodSource-13);
  check(s);
  const move=core.execute(s,{type:'shipMove',owner:ship.owner,schiff:ship.id,ziel:h},rules);
  assert(move.ok,JSON.stringify(move));
  assert.equal(ship.ankunft-s.tick,25);
  core.advance(s,24,rules);
  assert.equal(ship.phase,'reise');
  assert.equal(s.owners[buyer].cash,quote.kosten.verkaufswert);
  check(s);
  // Hier findet Original-Core-Ankunft und Original-Markthandel statt.
  // Die Treuhand wird erst SYNCHRON mit der Zielverkaufsminute frei.
  assert.equal(core.preis(s,h,'nahrung'),quote.endpreis,
    'keine stille Festpreisueberschreibung bei geaendertem Spot');
  give(s,buyer,h,quote.kosten.verkaufswert);
  core.step(s,rules);
  assert.equal(ship.phase,'dock');assert.equal(ship.system,'aldera');
  assert.equal(ship.ladung.nahrung||0,0,'original entladen und bezahlt');
  assert.equal(s.stations[h].lager.nahrung,start.foodDest+13);
  assert.equal(s.owners[buyer].cash,0);
  assert(s.stats.handel>=start.traded+2);
  check(s);
  const work=ship.arbeit;
  // Die Validierung startet hier synchron bei tick N, die Original-Ankunft
  // erfolgt vor der erneuten Reise-Minutenbuchung in tick N+25.
  assert.equal(work,24,'tatsächlich erfasste Reise-Arbeitsminuten');
  const wageDue=Math.floor(250*work/60);
  assert.equal(wageDue,100);
  assert(wageDue<=quote.kosten.frachterlohnFaellig,
    'Original-Quote ist konservativ, nicht billiger als die tatsächliche Arbeit');
  // Um die Originallohnabrechnung exakt aus der Reservierung zu
  // finanzieren, ist die anderweitig freie NPC1-Kasse kurz geparkt.
  const free=s.owners[ship.owner].cash;
  give(s,ship.owner,park,free);
  give(s,wages,ship.owner,wageDue);
  const pre=s.stats.konto[ship.owner].kosten;
  const toHour=60-(s.tick%60);
  core.advance(s,toHour,rules);
  assert.equal(ship.arbeit,0);
  assert.equal(s.stats.konto[ship.owner].kosten-pre,wageDue,
    'volle Original-Arbeitskosten und NICHT Lohn aus leerer Kasse');
  assert.equal(s.owners[wages].cash,quote.kosten.frachterlohn-wageDue);
  check(s);
  // Nicht verbrauchter wage-Escrow wird nur EINMAL erstattet,
  // echte Ruecklage bleibt in eigener Sperrkasse.
  give(s,park,ship.owner,s.owners[park].cash);
  give(s,wages,ship.owner,s.owners[wages].cash);
  assert.equal(s.owners[buyer].cash,0);
  assert.equal(s.owners[wages].cash,0);
  assert.equal(s.owners[park].cash,0);
  assert.equal(s.owners[hull].cash,quote.kosten.ersatzruecklage);
  assert.equal(quote.kosten.frachterlohn-wageDue,150);
  check(s);
  const replay=core.load(core.save(s));
  assert.equal(core.hash(s),core.hash(replay),'kontenbasiertes Test-Bridge-Replay');
  console.log('BK9B_REALER_ORIGINALHANDEL '+JSON.stringify({
    startTag:4,quelle:q,ziel:h,ware:'nahrung',menge:13,
    endpreis:quote.endpreis,vorherGesichert:quote.kosten.verkaufswert,
    originalEinkauf:true,originalFlugminuten:work,originalZielverkauf:true,
    originalArbeitslohn:wageDue,
    bezahlterLohn:wageDue,
    zurückgegebeneLohnreserve:150,ersatzreserve:s.owners[hull].cash,
    vorherKalkulierteMarge:quote.margen.frachter,
    mintedZusatz:s.minted-start.minted,
    nachweisbareNeueProduktionImVertrag:false,
    schemaProduktreif:false
  }));
});
