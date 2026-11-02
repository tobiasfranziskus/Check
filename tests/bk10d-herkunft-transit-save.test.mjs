// B-K10d: R15/Schema9 ANALYSE – gespeicherte Neuware auf Frachtern.
// Die vorhandenen R15-V1-Regeln bleiben bis auf expliziten Testschalter unberuehrt.
// Keine neuen ISK, Preise, Loehne oder Gratiswaren.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const anker="return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };";
assert.equal(original.split(anker).length,2,'nur Testexport der realen Kampfverlustroutine');
const testJS=original.replace(anker,
  "return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, entfernen, zerstoeren };");
const {core,base,herkunft,handel,route,sicherheit,preis}=new Function(testJS+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,'+
  'handel:m_core_handel,route:m_core_route.route,sicherheit:m_core_sicherheit,'+
  'preis:m_core_preis.preis};')();
assert.equal(base.rulesVersion,14);
const QUELLE='st_cyris', ZIEL='st_orion';
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true,
  mindeststand:0,fondsObergrenze:1000000000}};
const legacy={...rules,world:{...rules.world,herkunftTransportNeu:false}};
function audit(s){
  const frei=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  const rest=Object.values(s.vertraege.eintraege).reduce((n,e)=>n+e.rest,0);
  assert.equal(frei+rest,s.initialSupply+s.minted-s.burned,'unabhaengige ISK-Bilanz');
  assert(core.audit(s).ok,'Core-Waren-/Geldaudit');
  const h=herkunft.pruefe(s);
  const geladen=core.load(core.save(s),undefined,rules);
  assert.equal(core.hash(geladen),core.hash(s),'Hash nach vollem Save/Load identisch');
  return h;
}
function setup(seed,ueberschuss=1){
  const s=core.createState(seed,rules);
  for(const [id,menge] of [[QUELLE,0],[ZIEL,0]]){
    const st=s.stations[id],vor=st.lager.nahrung;
    st.lager.nahrung=menge;s.ledger.nahrung.initial-=vor-menge;
  }
  s.stations[QUELLE].linien=s.stations[QUELLE].linien.filter(x=>x.rezept==='r_nahrung');
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter'&&sh.auftrag==='handeln')sh.auftrag='halten';
  const sicher=(state)=>audit(state);
  sicher(s);
  const minimum=handel.reserve(rules,QUELLE,'nahrung');
  while(s.stations[QUELLE].lokalNeuNahrung<minimum+ueberschuss && s.tick<1440)
    core.step(s,rules);
  assert(s.tick<1440,'echte Nahrungsproduktion erreicht Marktreserve');
  assert.equal(s.stations[QUELLE].lager.nahrung,s.stations[QUELLE].lokalNeuNahrung,
    'Quell-Lager enthaelt nur neue Nahrung');
  const schiff=Object.values(s.ships).find(x=>x.owner==='npc1'
    && x.klasse==='frachter'&&x.system==='cyris'&&x.phase==='dock');
  assert(schiff,'existierender Haendlerfrachter');
  sicher(s);
  return {s,schiff};
}
function cmd(s,type,schiff,extra){
  const b={type,owner:schiff.owner,schiff:schiff.id,...extra};
  const ok=core.submit(s,b,rules);
  assert(ok.ok,JSON.stringify(ok));
  const ergebnis=core.step(s,rules);
  assert.equal(ergebnis.length,1);
  assert(ergebnis[0].ok,JSON.stringify(ergebnis[0]));
  audit(s);
}
function reise(seed,mehr=1){
  const {s,schiff}=setup(seed,mehr);
  // Den Takt vom ersten folgenden Konsum entkoppeln.
  if((s.tick+2+route(rules.world,'cyris','orion').zeit)%60===0)core.step(s,rules);
  const vor=s.haushaltNeuLedger.produziert;
  const quellePreis=preis(s,QUELLE,'nahrung',rules);
  cmd(s,'shipTrade',schiff,{ware:'nahrung',menge:1,kauf:true});
  assert.equal(schiff.neuLadungNahrung,1);
  assert.equal(s.haushaltNeuLedger.transit,1);
  assert.equal(s.haushaltNeuLedger.ausgelagert,0);
  const vorKasse=s.owners.npc1.cash;
  cmd(s,'shipMove',schiff,{ziel:ZIEL});
  const vertrag=schiff.vertrag;
  assert(vertrag && s.vertraege.eintraege[vertrag].rest===180,
    'echt vorfinanzierter Flug');
  assert.equal(s.owners.npc1.cash,vorKasse-180);
  // Unterwegs MUSS die eine Einheit aus dem gespeicherten Zustand erkennbar sein.
  const unterwegs=core.load(core.save(s),undefined,rules);
  assert.equal(unterwegs.ships[schiff.id].neuLadungNahrung,1);
  assert.equal(unterwegs.haushaltNeuLedger.transit,1);
  const ankunft=schiff.ankunft;
  while(schiff.phase==='reise'&&s.tick<=ankunft+1){
    core.step(s,rules); if(s.tick%10===0)audit(s);
  }
  assert.equal(schiff.phase,'dock');
  assert.equal(schiff.system,'orion');
  assert.equal(schiff.ladung.nahrung,undefined,'reale Entladung abgewickelt');
  assert.equal(schiff.neuLadungNahrung,0);
  assert.equal(s.stations[ZIEL].lokalNeuNahrung,1,'Nahrung kommt als belegte Neuware an');
  assert.equal(s.haushaltNeuLedger.transit,0);
  assert.equal(s.haushaltNeuLedger.produziert,vor+(s.haushaltNeuLedger.produziert-vor));
  audit(s);
  const preisZiel=preis(s,ZIEL,'nahrung',rules);
  const hhVor=s.owners.hh_st_orion.cash;
  assert(hhVor>=preisZiel,'Haushaltsgeld stammt aus bezahlter Arbeit');
  const bis=Math.ceil((s.tick+1)/60)*60;
  while(s.tick<bis)core.step(s,rules);
  const h=s.stats.haushaltskauf[ZIEL];
  assert.equal(h.menge,1,'echte Neueinheit am Ziel bezahlt verbraucht');
  assert.equal(h.alt,0);
  assert.equal(h.isk,preisZiel);
  assert.equal(s.owners.hh_st_orion.cash,hhVor-h.isk);
  audit(s);
  const bericht={seed,quellePreis,preisZiel,flugReserve:180,
    flugBezahlt:s.vertraege.eintraege[vertrag].gezahlt,
    haushaltGezahlt:h.isk,neuZielBezahlt:h.menge,
    haushaltVor:hhVor,haushaltRest:s.owners.hh_st_orion.cash,
    auslagerung:s.haushaltNeuLedger.ausgelagert,
    transit:s.haushaltNeuLedger.transit,minted:s.minted,burned:s.burned,
    hash:core.hash(s)};
  console.log('B-K10d reale Transit-Nahrung',JSON.stringify(bericht));
  return bericht;
}
test('B-K10d: real bezahlte Anlieferung, persistente Herkunft und bezahlter Konsum, 2 Seeds',()=>{
  for(const seed of [42,7]){
    const a=reise(seed);
    assert.equal(a.neuZielBezahlt,1);
    assert.equal(a.haushaltGezahlt,a.preisZiel);
  }
});
test('B-K10d: deterministisches Replay samt identischem Abschluss-Hash',()=>{
  assert.deepEqual(reise(42),reise(42));
});
test('B-K10d: Teilentladung und Reimport buchen Herkunft mengenrichtig',()=>{
  const {s,schiff}=setup(42,3);
  cmd(s,'shipTrade',schiff,{ware:'nahrung',menge:3,kauf:true});
  assert.equal(schiff.neuLadungNahrung,3);
  assert.equal(s.haushaltNeuLedger.transit,3);
  assert(handel.handel(s,rules,schiff,QUELLE,'nahrung',1,false),
    'reale Core-Teilverkaufszahlung');
  assert.equal(schiff.neuLadungNahrung,2);
  assert.equal(s.haushaltNeuLedger.transit,2);
  assert.equal(s.stations[QUELLE].lokalNeuNahrung,
    s.stations[QUELLE].lager.nahrung,'Teilverkauf stellt echten Neu-Beleg wieder her');
  audit(s);
  assert(handel.handel(s,rules,schiff,QUELLE,'nahrung',2,false));
  assert.equal(schiff.neuLadungNahrung,0);
  assert.equal(s.haushaltNeuLedger.transit,0);
  assert.equal(schiff.ladung.nahrung,undefined);
  audit(s);
});
test('B-K10d: Verlust der geladenen Neuware bleibt bilanziert und kann nicht konsumiert werden',()=>{
  const {s,schiff}=setup(7,2);
  cmd(s,'shipTrade',schiff,{ware:'nahrung',menge:2,kauf:true});
  assert.equal(s.haushaltNeuLedger.transit,2);
  const id=schiff.id;
  sicherheit.entfernen(s,rules,schiff); // Original-Funktion, nur fuer Test exportiert.
  assert.equal(s.ships[id],undefined);
  assert.equal(s.haushaltNeuLedger.transit,0);
  assert.equal(s.haushaltNeuLedger.ausgelagert,2,'Schiffverlust = belegte vernichtete Herkunft');
  audit(s);
});
test('B-K10d: korrupten Transit, entfaerbte Ladung und V2-unter-V1 klar verweigern',()=>{
  const {s,schiff}=setup(42,1);
  cmd(s,'shipTrade',schiff,{ware:'nahrung',menge:1,kauf:true});
  function bad(a){
    const x=JSON.parse(core.save(s));a(x);
    assert.throws(()=>core.load(JSON.stringify(x),undefined,rules),/Nahrung|Herkunft|Transit|Schiff/i);
  }
  bad(x=>{x.ships[schiff.id].neuLadungNahrung=0;});
  bad(x=>{x.ships[schiff.id].neuLadungNahrung=2;});
  bad(x=>{x.haushaltNeuLedger.transit=0;});
  bad(x=>{delete x.haushaltNeuLedger.transit;});
  assert.throws(()=>core.load(core.save(s),undefined,legacy),/Herkunftsmodell|benoetigt/i);
  audit(s);
});
test('B-K10d: sichere Alt-V1-Konvertierung nur ohne unklaeren Export',()=>{
  const alt=core.createState(42,legacy);
  const safe=core.load(core.save(alt),undefined,rules);
  assert.equal(safe.haushaltModell,'transport-neu-v2');
  assert.equal(safe.haushaltNeuLedger.transit,0);
  audit(safe);
  const risiko=core.createState(42,legacy);
  risiko.haushaltNeuLedger.produziert=1;
  risiko.haushaltNeuLedger.ausgelagert=1;
  assert.throws(()=>core.load(core.save(risiko),undefined,rules),
    /Altspielstand mit ungeklaertem Nahrungstransit/);
});
