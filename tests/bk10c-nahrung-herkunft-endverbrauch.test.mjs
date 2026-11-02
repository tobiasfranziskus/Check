// B-K10c – ein real aus Bestands-ISK finanzierter Nahrungs-Transportvertrag.
// Test des R15-/Schema9-Drafts, nicht von main. Einzige kausale Gegenprobe:
// ein NICHT produktives, manuell gesetztes Provenienz-Umbuchungsbeispiel.
// Keine neuen ISK, Preise, Loehne oder Produkt-/Save-Regeln.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,base,herkunft,handel,route,preis}=new Function(js+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,'+
  'handel:m_core_handel,route:m_core_route.route,preis:m_core_preis.preis};')();
assert.equal(base.rulesVersion,14,'Produktbasis bleibt Regel 14');
const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
  produktionslohnJeMinute:4,haushaltskaufNeu:true,
  mindeststand:0,fondsObergrenze:1000000000}};
const QUELLE='st_cyris',ZIEL='st_orion';

function pruefe(s,mitSave=true){
  const frei=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
  const gesperrt=Object.values(s.vertraege.eintraege).reduce((n,e)=>n+e.rest,0);
  assert.equal(frei+gesperrt,s.initialSupply+s.minted-s.burned,
    'unabhaengige ISK-Bilanz inklusive atomarer Reserve');
  assert(core.audit(s).ok,'Core-Waren-/Geldaudit');
  herkunft.pruefe(s);
  if(mitSave){
    const geladen=core.load(core.save(s),undefined,rules);
    assert.equal(core.hash(geladen),core.hash(s),'echter Save/Load-Hash');
  }
}
function aufsetzen(seed){
  const s=core.createState(seed,rules);
  // Isolation nur durch die Wegnahme belegter STARTWARE mit Ledger-Korrektur:
  // keine Gratisgutschrift, weder Ware noch Geld werden hinzuerfunden.
  for(const [id,neu] of [[QUELLE,0],[ZIEL,0]]){
    const st=s.stations[id],alt=st.lager.nahrung;
    assert(neu<=alt && st.lokalNeuNahrung===0);
    st.lager.nahrung=neu;s.ledger.nahrung.initial+=neu-alt;
  }
  // Eine echte Cyris-Nahrungsproduktion, ohne konkurrierende Testfabriken.
  s.stations[QUELLE].linien=s.stations[QUELLE].linien.filter(l=>l.rezept==='r_nahrung');
  assert.equal(s.stations[QUELLE].linien.length,1);
  // Haendler halten im kontrollierten Einzelfall; Miner, Fabrik, Verbrauch,
  // Sicherheits- und sonstige Weltregeln laufen weiter im Original-Core.
  for(const sh of Object.values(s.ships))
    if(sh.klasse==='frachter' && sh.auftrag==='handeln')sh.auftrag='halten';
  pruefe(s);
  return s;
}
function befehl(s,cmd){
  const accepted=core.submit(s,cmd,rules);
  assert(accepted.ok,JSON.stringify(accepted));
  const out=core.step(s,rules);
  assert.equal(out.length,1);
  assert(out[0].ok,JSON.stringify(out[0]));
  pruefe(s);
}
function lauf(seed,gegenprobe=false){
  const s=aufsetzen(seed);
  const mindest=handel.reserve(rules,QUELLE,'nahrung');
  // Erst wenn die echte Produktion aus anfangs leerem Food-Lager ihren
  // Vorrat selbst aufgebaut hat, ist die NAECHSTE Einheit handelbar.
  // Altbestand wird also nicht als neue Handelsware fehlklassifiziert.
  while(s.stations[QUELLE].lokalNeuNahrung<=mindest && s.tick<1440)
    core.step(s,rules);
  assert(s.tick<1440,'bezahlte Eigenproduktion baut einen veraesserbaren Neu-Bestand auf');
  // Ankunft nicht exakt auf eine Stundenkante legen: Der Test muss die
  // unveraenderte Herkunft VOR dem folgenden Verbrauch inspizieren koennen.
  const reiseMin=route(rules.world,'cyris','orion').zeit;
  if((s.tick+2+reiseMin)%60===0)core.step(s,rules);
  pruefe(s);
  const source=s.stations[QUELLE],target=s.stations[ZIEL];
  assert(s.tick>10);
  assert.equal(source.lager.nahrung,source.lokalNeuNahrung,
    'der komplette Quellvorrat hat jetzt einen tatsaechlichen Neuware-Beleg');
  assert(source.lokalNeuNahrung>mindest,'Neuwaren-Ueberschuss ueber Stationsreserve');
  assert.equal(target.lager.nahrung,0,'Verbrauchsstation hat echten Fehlbestand');
  const lohnVor=s.stats.konto.hh_st_cyris.erloes;
  assert(lohnVor>=24 && lohnVor%24===0,'aus echten bezahlten Sechsminutenchargen');
  const sh=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter'
    && x.system==='cyris'&&x.phase==='dock');
  assert(sh,'vorhandener NPC1-Frachter in Cyris');
  const id=sh.id;
  const startKassen={produzent:s.owners[QUELLE].cash,haendler:s.owners.npc1.cash,
    zielStation:s.owners[ZIEL].cash,haushalt:s.owners.hh_st_orion.cash};
  const quellePreis=preis(s,QUELLE,'nahrung',rules);
  const quelleErloesVor=s.stats.konto[QUELLE].erloes;
  befehl(s,{type:'shipTrade',owner:'npc1',schiff:id,
    ware:'nahrung',menge:1,kauf:true});
  assert.equal(s.ships[id].ladung.nahrung,1);
  assert.equal(s.stations[QUELLE].lokalNeuNahrung,
    s.stations[QUELLE].lager.nahrung,'wirklich neue Nahrung entnommen, nicht alte');
  assert.equal(s.haushaltNeuLedger.ausgelagert,1);
  assert.equal(s.stats.konto[QUELLE].erloes,quelleErloesVor+quellePreis,
    'Quellstation erhaelt wirklichen Verkaufserloes; gleichzeitige Lohnbindung ist separat');
  const routeDaten=route(rules.world,'cyris','orion');
  assert(routeDaten && routeDaten.zeit>0 && routeDaten.zeit<48);
  const flugSoll=Math.ceil(routeDaten.zeit*rules.world.betriebskosten.frachter/rules.economy.stunde);
  const handlerVorFlug=s.owners.npc1.cash;
  befehl(s,{type:'shipMove',owner:'npc1',schiff:id,ziel:ZIEL});
  const flugID=s.ships[id].vertrag;
  assert(flugID,'echter gebundener Flugvertrag');
  assert.equal(s.vertraege.eintraege[flugID].rest,flugSoll);
  assert.equal(s.owners.npc1.cash,handlerVorFlug-flugSoll);
  // Save/Load waehrend des Flugs behaelt zwar die Warenmenge,
  // aber KEIN unterscheidbares Neuwaren-Attribut auf dem Schiff.
  assert.equal(s.ships[id].ladung.nahrung,1);
  assert.equal(s.ships[id].lokalNeuNahrung,undefined);
  const deadline=s.ships[id].ankunft+1;
  while(s.ships[id].phase==='reise' && s.tick<=deadline){
    core.step(s,rules);
    if(s.tick%10===0)pruefe(s);
  }
  assert.equal(s.ships[id].phase,'dock','echte Original-Core-Ankunft');
  assert.equal(s.ships[id].system,'orion');
  assert.equal(s.ships[id].ladung.nahrung,undefined,'entladen und bezahlt');
  assert.equal(s.stations[ZIEL].lager.nahrung,1);
  assert.equal(s.stations[ZIEL].lokalNeuNahrung,0,
    'Kern verliert die belegte Neuherkunft beim bezahlten Umweg');
  assert.equal(s.haushaltNeuLedger.ausgelagert,1);
  const hhVor=s.owners.hh_st_orion.cash;
  const konsPreis=preis(s,ZIEL,'nahrung',rules);
  assert(hhVor>=konsPreis,
    'Haushalt koennte die angelieferte Nahrung wirklich aus Lohn bezahlen');
  const haendlerNachVerkauf=s.owners.npc1.cash;
  const zielNachVerkauf=s.owners[ZIEL].cash;
  const originVerkauf=s.stats.konto[QUELLE].erloes;
  const zielKauf=s.stats.konto[ZIEL].kosten;
  assert(originVerkauf>=quellePreis && zielKauf>0,
    'beide Seiten des realen Warenhandels dokumentiert');
  pruefe(s);
  if(gegenprobe){
    // Nur im Analyse-Test: die EINE belegte Sendung als Ziel-Neuware
    // klassifizieren. Keine neue Ware/ISK. Dies ist KEIN echter R15-Kernpfad,
    // kein gespeicherter Fracht-Herkunftsnachweis und keine Produktfreigabe.
    assert.equal(s.haushaltNeuLedger.ausgelagert,1);
    s.haushaltNeuLedger.ausgelagert-=1;
    s.stations[ZIEL].lokalNeuNahrung+=1;
    pruefe(s);
  }
  const konsumTick=Math.ceil((s.tick+1)/60)*60;
  while(s.tick<konsumTick)core.step(s,rules);
  pruefe(s);
  const h=s.stats.haushaltskauf[ZIEL];
  const ausgabe={seed,gegenprobe,routeMin:routeDaten.zeit,flugReserveISK:flugSoll,
    quellePreisISK:quellePreis,zielPreisISK:konsPreis,
    quelleLohnBelegtISK:s.stats.konto.hh_st_cyris.erloes,
    quelleErloesISC:s.stats.konto[QUELLE].erloes,
    zielWarenkaufISK:zielKauf,
    haendlerCashNachEntladung:haendlerNachVerkauf,
    zielCashNachEntladung:zielNachVerkauf,
    zielHHVorKonsum:hhVor,zielHHNachKonsum:s.owners.hh_st_orion.cash,
    zielVerbrauchNeuBezahlt:h.menge,zielVerbrauchAlt:h.alt,
    zielKonsumISK:h.isk,ausgelagerteNeunahrung:s.haushaltNeuLedger.ausgelagert,
    zielNeuRest:s.stations[ZIEL].lokalNeuNahrung,
    flugBezahlt:s.vertraege.eintraege[flugID]?.gezahlt||0,
    minted:s.minted,burned:s.burned,
    hash:core.hash(s)};
  console.log('B-K10c realer Zahlungsweg / explizit synthetische Herkunftherstellung',
    JSON.stringify(ausgabe));
  return ausgabe;
}

test('B-K10c: Seed42/7 – echter bezahlter Warenflug vs. verlorener Herkunftsnachweis',()=>{
  for(const seed of [42,7]){
    const original=lauf(seed,false),hypothese=lauf(seed,true);
    assert.equal(original.zielVerbrauchNeuBezahlt,0,
      'Original-Core verbucht importierte Neuware ohne Haushaushaltszahlung');
    assert.equal(original.zielVerbrauchAlt,1);
    assert.equal(original.zielKonsumISK,0);
    assert.equal(original.ausgelagerteNeunahrung,1);
    assert.equal(hypothese.zielVerbrauchNeuBezahlt,1,
      'nur explizit synthetisch wiederhergestellte Herkunft erlaubt Bezahlung');
    assert.equal(hypothese.zielVerbrauchAlt,0);
    assert.equal(hypothese.zielKonsumISK,hypothese.zielPreisISK);
    assert.equal(hypothese.zielHHNachKonsum+hypothese.zielKonsumISK,
      original.zielHHNachKonsum,'keine Haushaltsgutschrift');
    assert.equal(hypothese.flugBezahlt,original.flugBezahlt);
    assert.equal(hypothese.minted,original.minted,'keine neue Geldemission');
    assert.equal(hypothese.burned,original.burned,'keine neue Geldsenke');
  }
});
test('B-K10c: deterministischer Original-Beleglauf und Save/Load-Replay',()=>{
  assert.deepEqual(lauf(42,false),lauf(42,false),'unveraenderter Seed reproduzierbar');
});