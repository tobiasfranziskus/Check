// B-K10e – test-only Grenzfaelle fuer den R15/Schema9-V2-Herkunftstransit.
// Unveraenderter Original-Core fuer Handel, Flug, Piraten-Verlust, Aussenhandel,
// Save/Load; ausschliesslich Test-Fixierung eines Anfangslagers/Marktziels.
// Keine Spielregel-, Lohn-, Preisformel- oder ISK-Emissionaenderung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const raw = html.slice(html.indexOf('const m_data_systeme ='), html.indexOf('const m_data_oberflaeche ='));
const origExport='return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };';
assert.equal(raw.split(origExport).length,2);
const instrument=raw.replace(origExport,
  'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, zerstoeren };');
const {core,base,handel,sicherheit,herkunft,route}=new Function(instrument+
  ';return {core:m_core_index,base:m_data_rules.RULES,handel:m_core_handel,'+
  'sicherheit:m_core_sicherheit,herkunft:m_core_herkunft,route:m_core_route.route};')();

const Q='st_cyris', O='st_orion', PIR='st_meridian';
const regeln={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,herkunftTransportNeu:true,
  mindeststand:0,fondsObergrenze:1000000000}};
assert.equal(base.schema,8);assert.equal(base.rulesVersion,14);
const SEEDS=[42,7];
function ueberpruefe(s,r=regeln){
  const frei=Object.values(s.owners).reduce((v,o)=>v+o.cash,0);
  const reserviert=Object.values(s.vertraege.eintraege).reduce((v,e)=>v+e.rest,0);
  assert.equal(frei+reserviert,s.initialSupply+s.minted-s.burned,
    'ISK-Erhaltung mitsamt allen vorfinanzierten Vertraegen');
  const h=herkunft.pruefe(s);
  const sumSt=Object.values(s.stations).reduce((v,o)=>v+(o.lokalNeuNahrung||0),0);
  const sumSch=Object.values(s.ships).reduce((v,o)=>v+(o.neuLadungNahrung||0),0);
  assert.equal(sumSch,s.haushaltNeuLedger.transit,'unabhaengige Frachtneu-Summe');
  assert.equal(sumSt+sumSch+s.haushaltNeuLedger.ausgelagert+
    s.haushaltNeuLedger.konsumiert,s.haushaltNeuLedger.produziert,
    'Neuware darf weder verschwinden noch doppelt gebucht werden');
  assert(core.audit(s).ok,'Original-Core Geld-/Warenaudit');
  const re=core.load(core.save(s),undefined,r);
  assert.equal(core.hash(re),core.hash(s),'Save/Load mit identischem Welt-Hash');
  return h;
}
function init(seed,{altQuelle=0,marktZiel=null,marktStart=null}={}){
  const r=marktZiel===null?regeln:{
    ...regeln,world:{...regeln.world,
      stations:{...regeln.world.stations,
        [PIR]:{...regeln.world.stations[PIR],
          ziel:{...regeln.world.stations[PIR].ziel,nahrung:marktZiel}}}}};
  const s=core.createState(seed,r);
  for(const [id,menge] of [[Q,altQuelle],...(marktStart===null?[]:[[PIR,marktStart]])]){
    const st=s.stations[id],vorher=st.lager.nahrung;
    st.lager.nahrung=menge;
    s.ledger.nahrung.initial+=menge-vorher;
  }
  s.stations[Q].linien=s.stations[Q].linien.filter(l=>l.rezept==='r_nahrung');
  for(const sh of Object.values(s.ships))if(sh.klasse==='frachter'&&sh.auftrag==='handeln')
    sh.auftrag='halten';
  const sh=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='npc1'
    && x.system==='cyris'&&x.phase==='dock');
  assert(sh,'real vorhandener NPC1-Frachter');
  ueberpruefe(s,r);
  return {s,r,sh};
}
function bis(s,r,bedingung,limit=1440){
  while(!bedingung()&&s.tick<limit){
    core.step(s,r);
    if(s.tick%60===0)ueberpruefe(s,r);
  }
  assert(bedingung(),'geplanter finanziert-produzierter Ausgangszustand nicht erreicht');
}
function befehl(s,r,sh,type,x={}){
  const ans=core.submit(s,{type,owner:sh.owner,schiff:sh.id,...x},r);
  assert(ans.ok,JSON.stringify(ans));
  const out=core.step(s,r);
  assert.equal(out.length,1);
  assert(out[0].ok,JSON.stringify(out[0]));
  ueberpruefe(s,r);
}
function ankunft(s,r,sh){
  assert.equal(sh.phase,'reise');
  const ende=sh.ankunft;
  while(sh.phase==='reise'&&s.tick<=ende+1) {
    core.step(s,r);
    if(s.tick%10===0)ueberpruefe(s,r);
  }
  assert.equal(sh.phase,'dock','Original-Core Reise tatsaechlich abgeschlossen');
  ueberpruefe(s,r);
}
function neuBereit(s,r,n) {
  const st=s.stations[Q],m=handel.reserve(r,Q,'nahrung');
  return st.lokalNeuNahrung>=m+n
    && handel.verkaufbar(s,r,Q,'nahrung')>=n;
}

test('B-K10e: gemischtes echtes Alt-/Neu-FIFO und mehrfache Teilbuchungen',()=>{
  for(const seed of SEEDS){
    const {s,r,sh}=init(seed,{altQuelle:38});
    let menge=0,alt=0;
    bis(s,r,()=>{
      const st=s.stations[Q];
      alt=st.lager.nahrung-st.lokalNeuNahrung;
      menge=alt+3;
      const p=core.preis(s,Q,'nahrung',r);
      return alt>=2 && st.lokalNeuNahrung>=29
        && menge<=handel.verkaufbar(s,r,Q,'nahrung')
        && menge<=r.economy.cargo && s.owners.npc1.cash>menge*p*1.1;
    });
    const produktionVor=s.haushaltNeuLedger.produziert;
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge,kauf:true});
    assert.equal(sh.ladung.nahrung,menge);
    assert.equal(sh.neuLadungNahrung,3);
    assert.equal(s.haushaltNeuLedger.transit,3);
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:alt-1,kauf:false});
    assert.equal(sh.ladung.nahrung,4);
    assert.equal(sh.neuLadungNahrung,3,'Altware wird vor Neuware abgeladen');
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:2,kauf:false});
    assert.equal(sh.ladung.nahrung,2);
    assert.equal(sh.neuLadungNahrung,2,'der zweite Teilverkauf enthaelt exakt 1 Neu');
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:1,kauf:true});
    assert.equal(sh.ladung.nahrung,3);
    assert.equal(sh.neuLadungNahrung,2,'neuer Alt-Einkauf faerbt bestehende Neuware nicht um');
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:2,kauf:false});
    assert.equal(sh.ladung.nahrung,1);
    assert.equal(sh.neuLadungNahrung,1);
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:1,kauf:false});
    assert.equal(sh.neuLadungNahrung,0);
    assert.equal(sh.ladung.nahrung,undefined);
    assert.equal(s.haushaltNeuLedger.transit,0);
    assert(s.haushaltNeuLedger.produziert>=produktionVor);
    ueberpruefe(s,r);
    console.log('B-K10e Misch-FIFO',JSON.stringify({seed,altImErstkauf:alt,
      neuImErstkauf:3,teilverkaeufe:[alt-1,2,2,1],
      finaleTransitmenge:0,hash:core.hash(s)}));
  }
});
test('B-K10e: reale Original-Piratenbeute, Teilrettung und Restvernichtung',()=>{
  for(const seed of SEEDS){
    const {s,r,sh}=init(seed);
    bis(s,r,()=>neuBereit(s,r,3));
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:3,kauf:true});
    const markt=s.stations[PIR],kap=handel.obergrenze(s,r,PIR,'nahrung');
    // Testfixture: Markt startet im Verlustereignis mit exakt 2 freien Plaetzen.
    // Nur initiale Altware-Menge und korrespondierende Warenbilanz veraendert,
    // nicht Geld, neue Nahrung, Spielerpreise oder sonstige Spielregeln.
    const altVorher=markt.lager.nahrung, neuVorher=markt.lokalNeuNahrung;
    assert.equal(neuVorher,0);
    markt.lager.nahrung=kap-2;s.ledger.nahrung.initial+=kap-2-altVorher;
    ueberpruefe(s,r);
    const fondsVor=s.owners[PIR].cash,piratenVor=s.owners.pirates.cash;
    const geldMintVor=s.minted,burnVor=s.burned;
    const vorherNahrung=s.ledger.nahrung.consumed;
    const preis=core.preis(s,PIR,'nahrung',r);
    const shipId=sh.id;
    sicherheit.zerstoeren(s,r,sh); // Echter Core-Verlust-/Beutepfad, Kampfentscheid erzwungen.
    assert.equal(s.ships[shipId],undefined);
    assert.equal(markt.lokalNeuNahrung,2,'zwei Einheiten als reale Beute eingelagert');
    assert.equal(s.haushaltNeuLedger.transit,0);
    assert.equal(s.haushaltNeuLedger.ausgelagert,1,'eine echte Neuware vernichtet');
    assert.equal(s.ledger.nahrung.consumed-vorherNahrung,1,'ein Schiffsgut verloren');
    assert.equal(s.owners[PIR].cash,fondsVor-2*preis);
    assert.equal(s.owners.pirates.cash,piratenVor+2*preis);
    assert.equal(s.minted,geldMintVor); assert.equal(s.burned,burnVor);
    ueberpruefe(s,r);
    console.log('B-K10e Piratenbeute',JSON.stringify({seed,preis,erhalten:2,
      vernichtet:1,ersatzISK:2*preis,hash:core.hash(s)}));
  }
});
test('B-K10e: echte Nahrungsausfuhr aus der Aussenhandelsroutine entfernt Neu-Nachweis',()=>{
  for(const seed of SEEDS){
    // NUR dieser kontrollierte Markt hat ein Ziel von 4 statt 100 Einheiten.
    // Die Kernformeln und Zahlungsregeln bleiben unveraendert, kein Produktionsbonus.
    const {s,r,sh}=init(seed,{marktZiel:4,marktStart:0});
    bis(s,r,()=>neuBereit(s,r,5));
    befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:5,kauf:true});
    const zeit=route(r.world,'cyris','meridian').zeit;
    if((s.tick+1+zeit)%60===0)core.step(s,r);
    befehl(s,r,sh,'shipMove',{ziel:PIR});
    ankunft(s,r,sh);
    assert.equal(s.stations[PIR].lager.nahrung,5);
    assert.equal(s.stations[PIR].lokalNeuNahrung,5);
    assert.equal(s.haushaltNeuLedger.transit,0);
    const exportVor=s.ledger.nahrung.exported,ausVor=s.haushaltNeuLedger.ausgelagert;
    const mint=s.minted,burn=s.burned;
    core.aussenhandel(s,r); // Originaler stündlicher Aussenhandel, isoliert ausgeführt.
    assert.equal(s.ledger.nahrung.exported-exportVor,1);
    assert.equal(s.haushaltNeuLedger.ausgelagert-ausVor,1);
    assert.equal(s.stations[PIR].lager.nahrung,4);
    assert.equal(s.stations[PIR].lokalNeuNahrung,4);
    assert.equal(s.minted,mint);assert.equal(s.burned,burn);
    ueberpruefe(s,r);
    console.log('B-K10e Aussenhandel',JSON.stringify({seed,marktZiel:4,
      echteNeuwareExportiert:1,restNeu:4,hash:core.hash(s)}));
  }
});
test('B-K10e: Aussenhandelsimport bleibt nachweislich unbelegte Altware',()=>{
  for(const seed of SEEDS){
    const {s,r}=init(seed,{marktStart:0});
    const vor=s.ledger.nahrung.imported;
    core.aussenhandel(s,r);
    assert.equal(s.stations[PIR].lager.nahrung,10,'externer Originalimport = 10');
    assert.equal(s.stations[PIR].lokalNeuNahrung,0,'ausserhalb nicht belegte Ware');
    assert.equal(s.ledger.nahrung.imported-vor,10);
    ueberpruefe(s,r);
  }
});
test('B-K10e: zwei echte Frachterfahrten und bezahlte Endverbrauchsmengen',()=>{
  for(const seed of SEEDS){
    const {s,r,sh}=init(seed);
    // Wie in B-K10d: Orion hat fuer diese Konsumprobe keine kostenlose
    // Alt-Nahrung, sonst konsumiert FIFO den Startbestand statt Lieferung.
    const orion=s.stations[O],alt=orion.lager.nahrung;
    orion.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
    ueberpruefe(s,r);
    bis(s,r,()=>neuBereit(s,r,6));
    for(let i=0;i<2;i++){
      assert(handel.verkaufbar(s,r,Q,'nahrung')>=1,'Quelle verkauft nur ueber Vorratsreserve');
      befehl(s,r,sh,'shipTrade',{ware:'nahrung',menge:1,kauf:true});
      assert.equal(sh.neuLadungNahrung,1);
      // Ein vorheriger Rueckflug kann noch eine gebundene Vertragsreserve
      // bis zum naechsten echten Stundenabschluss tragen.
      if(sh.vertrag){
        const lim=Math.ceil((s.tick+1)/60)*60;
        bis(s,r,()=>!sh.vertrag,lim+1);
      }
      befehl(s,r,sh,'shipMove',{ziel:O});
      ankunft(s,r,sh);
      assert.equal(sh.neuLadungNahrung,0); assert.equal(s.haushaltNeuLedger.transit,0);
      assert.equal(sh.system,'orion');
      if(i===0){
        const bisKonsum=Math.ceil((s.tick+1)/60)*60;
        bis(s,r,()=>s.tick>=bisKonsum,bisKonsum+1);
        assert(s.stats.haushaltskauf[O].menge>=1);
        befehl(s,r,sh,'shipMove',{ziel:Q});
        ankunft(s,r,sh);
        assert.equal(sh.system,'cyris');
      }
    }
    const h=s.stats.haushaltskauf[O];
    const ende=Math.ceil((s.tick+1)/60)*60;
    bis(s,r,()=>s.tick>=ende,ende+1);
    assert(h.menge>=2,'beide echten Neulieferungen aus lokalem Lohn bezahlt konsumiert');
    assert.equal(s.haushaltNeuLedger.transit,0);
    ueberpruefe(s,r);
    console.log('B-K10e Mehrfachfahrt',JSON.stringify({seed,bezahlt:h.menge,
      haushaltISK:h.isk,haendlerCash:s.owners.npc1.cash,hash:core.hash(s)}));
  }
});
