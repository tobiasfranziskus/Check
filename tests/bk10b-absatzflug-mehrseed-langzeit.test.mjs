// B-K10b: two-state causal follow-up for actual paid-absatz-flight selection /
 // testweise gezielte, tatsaechlich per Originalvertrag vorfinanzierte Neuplatzierung.
 // Die Prognose bindet noch KEINE spaetere Kauf- oder Rueckflugreserve.
 // Keine Produktregel, kein Preis-/Lohn-/Rezeptwechsel, keine ISK-Schoepfung.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
function unique(s,old,neu){
  assert.equal(s.split(old).length,2,'nicht eindeutiger Testanker: '+old.slice(0,75));
  return s.replace(old,neu);
}
function build(modus){
  let js=original,events=[],claims=[];
  if(modus!=='original'){
    // Nur die Wahl einer Handelspaar-Kandidatur, KEINE neue Abflugregel.
    js=unique(js,
      '      const menge = Math.min(rules.economy.cargo, vorrat, aufnehmbar(state, rules, ziel, ware),',
      '      let menge = Math.min(rules.economy.cargo, vorrat, aufnehmbar(state, rules, ziel, ware),');
    const old="      if (menge <= 0) continue;\n      const gewinn = menge * (pDort - pHier) - gebuehr(state, rules, station, menge * pHier)\n        - gebuehr(state, rules, ziel, menge * pDort);";
    const newCode=[
      "      if (menge <= 0) continue;",
      "      const vorwaerts = Math.ceil(r.zeit * w.betriebskosten.frachter / rules.economy.stunde);",
      modus.startsWith('hinrueck')
        ?"      const rueckweg = Math.ceil(r.zeit * w.betriebskosten.frachter / rules.economy.stunde);"
        :"      const rueckweg = 0;",
      "      const budgetFuerWare = kasse - vorwaerts - rueckweg;",
      "      menge = Math.min(menge, bezahlbar(rules, station, budgetFuerWare, pHier));",
      "      if (menge <= 0) continue;",
      "      const gewinn = menge * (pDort - pHier) - gebuehr(state, rules, station, menge * pHier)",
      "        - gebuehr(state, rules, ziel, menge * pDort) - vorwaerts - rueckweg;"
    ].join("\n");
    js=unique(js,old,newCode);
  }
  if(modus==='hinrueck-ohne-leer'){
    // Kontrollierte Einzelursache: zufaellige Leer-Umpositionierung unterbinden,
    // NICHT Handelslieferungen oder spaetere echte Frachtabfluege.
    js=unique(js,
      "    else if (s.warten >= 2) {\n"+
      "      const andere = ids(w.stations).filter((x) => x !== station && route(w, s.system, w.stations[x].system));\n"+
      "      if (andere.length > 0) {\n"+
      "        if (!abflug(state, rules, s, station, andere[rngInt(state, andere.length)], null, 0))\n"+
      "          s.ankunft = state.tick + w.warteLeer;\n"+
      "      } else s.ankunft = state.tick + w.warteLeer;\n"+
      "    }",
      "    else if (s.warten >= 2) { s.ankunft = state.tick + w.warteLeer; }");
  }

  if(modus.startsWith('hinrueck-ziel')){
    // Bestehendes originales bestesPaar als Marktsonde wiederverwenden:
    // Kaufbudget und projizierte Marge beruecksichtigen die vorherige Leerfahrt.
    js=unique(js,
      "function bestesPaar(state, rules, s, station) {",
      "function bestesPaar(state, rules, s, station, repositionBudget = 0) {");
    js=unique(js,
      "const w = rules.world, hier = w.stations[station], kasse = state.owners[s.owner].cash;",
      "const w = rules.world, hier = w.stations[station], kasse = state.owners[s.owner].cash - repositionBudget;");
    js=unique(js,
      "        - gebuehr(state, rules, ziel, menge * pDort) - vorwaerts - rueckweg;",
      "        - gebuehr(state, rules, ziel, menge * pDort) - vorwaerts - rueckweg - repositionBudget;");
    const conflict=modus.includes('konflikt')||modus.includes('beide');
    const sale=modus.includes('absatz')||modus.includes('beide');
    const helper=[
      "function zielposition(state, rules, s, station) {",
      "  const w=rules.world, von=w.stations[station].system;",
      "  let best=null;",
      "  // Bereits finanzierte positive Handelsmoeglichkeit an einer ANDEREN Station.",
      "  for(const x of ids(w.stations)) {",
      "    if(x===station) continue;",
      "    const r=route(w,von,w.stations[x].system);",
      "    if(!r || r.zeit<=0) continue;",
      "    const positionKosten=Math.ceil(r.zeit*w.betriebskosten.frachter/rules.economy.stunde);",
      "    if(state.owners[s.owner].cash<=positionKosten) continue;",
      "    const handelsPaar=bestesPaar(state,rules,s,x,positionKosten);",
      "    if(!handelsPaar || handelsPaar.gewinn<=0) continue;",
      conflict
        ? "    if(__claims.some(k=>{const q=state.ships[k.schiff];return k.schiff!==s.id && k.ziel===x && k.ware===handelsPaar.ware && q && q.phase==='reise' && q.ziel===x;})) { __events.push({art:'marktKonflikt',tick:state.tick,schiff:s.id,markt:x,ware:handelsPaar.ware});continue; }"
        : "    // ohne konkurrierende Marktanspruchspruefung",
      "    const dauer=r.zeit+handelsPaar.zeit;",
      "    if(!best || besser(handelsPaar.gewinn,dauer,best.gewinn,best.dauer))",
      "      best={ziel:x,absatz:handelsPaar.ziel,ware:handelsPaar.ware,",
      "        menge:handelsPaar.menge,gewinn:handelsPaar.gewinn,",
      "        dauer,positionKosten};",
      "  }",
      "  return best;",
      "}"
    ].join("\n");
    js=unique(js,"function besterAbsatz(state, rules, s, station) {",
      helper+"\nfunction besterAbsatz(state, rules, s, station) {");
    const leerOriginal=[
      "    else if (s.warten >= 2) {",
      "      const andere = ids(w.stations).filter((x) => x !== station && route(w, s.system, w.stations[x].system));",
      "      if (andere.length > 0) {",
      "        if (!abflug(state, rules, s, station, andere[rngInt(state, andere.length)], null, 0))",
      "          s.ankunft = state.tick + w.warteLeer;",
      "      } else s.ankunft = state.tick + w.warteLeer;",
      "    }"
    ].join("\n");
    let gezielt=[
      "    else if (s.warten >= 2) {",
      "      const ziel=zielposition(state,rules,s,station);",
      "      if (ziel && abflug(state,rules,s,station,ziel.ziel,null,0)) {",
      "        __events.push({art:'zielwahl',tick:state.tick,owner:s.owner,schiff:s.id,",
      "          von:station,ziel:ziel.ziel,absatz:ziel.absatz,ware:ziel.ware,",
      "          menge:ziel.menge,prognoseGewinn:ziel.gewinn,positionKosten:ziel.positionKosten,\n"+
      "          vertrag:s.vertrag,gesperrt:state.vertraege.eintraege[s.vertrag].rest});",
      "      } else s.ankunft = state.tick+w.warteLeer;",
      "    }"
    ].join("\n");
    if(conflict)gezielt=gezielt.replace(
      "      } else s.ankunft = state.tick+w.warteLeer;",
      "        __claims.push({schiff:s.id,ziel:ziel.ziel,ware:ziel.ware});\n"+
      "      } else s.ankunft = state.tick+w.warteLeer;");
    js=unique(js,leerOriginal,gezielt);
    if(sale){
      // Nach dem WARENeinkauf darf der echte Verkauf nicht nur dem nominellen
      // Erloes pro Flugminute folgen, sondern muss die originalen Flugstunden tragen.
      js=unique(js,
        "    if (erloes <= 0) continue;\n"+
        "    if (!best || besser(erloes, r.zeit, best.erloes, best.zeit)) best = { ziel, erloes, zeit: r.zeit };",
        "    const realKosten = Math.ceil(r.zeit * w.betriebskosten.frachter / rules.economy.stunde);\n"+
        "    const netto = ['npc1','npc2'].includes(s.owner) ? erloes-realKosten : erloes;\n"+
        "    if (netto <= 0) { if(['npc1','npc2'].includes(s.owner)) "+
          "__events.push({art:'absatzOhneDeckung',tick:state.tick,schiff:s.id,ziel,erloes,realKosten});continue; }\n"+
        "    if (!best || besser(netto,r.zeit,best.netto,best.zeit)) "+
          "best = {ziel,erloes,netto,zeit:r.zeit};");
    }
    // Ankunft als Beleg, anschliessende echte Warenkaeufe gesondert verfolgen.
    const anchor="    entladen(state, rules, s);\n  }\n}\nreturn { entladen, reise, ankunft };";
    js=unique(js,anchor,
      "    entladen(state, rules, s);\n"+
      "    if(['npc1','npc2'].includes(s.owner)) __events.push({art:'ankunft',"+
        "tick:state.tick,schiff:s.id,station:stationIn(rules,s.system),system:s.system});\n"+
      "  }\n}\nreturn { entladen, reise, ankunft };");
  }
  // Reiner passiver Beobachter: Jedes Handelsgeschaeft und die wirklichen Flugkosten
  // bleiben immer unter Kontrolle des Original-Kerns.
  const traderFilter="['npc1','npc2'].includes(schiff.owner)";
  const handelAnker="  buche(state, schiff.owner, 'kosten', fee);";
  js=unique(js,handelAnker,handelAnker+"\n"+
    "  if ("+traderFilter+") __events.push({art:'ware',tick:state.tick,owner:schiff.owner,"+
    "schiff:schiff.id,ware,menge,kauf,station,preis:p,wert,fee});");
  const startAnker="  s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;";
  js=unique(js,startAnker,startAnker+"\n"+
    "  if (['npc1','npc2'].includes(s.owner))\n"+
    "    __events.push({art:'start',tick:state.tick,owner:s.owner,schiff:s.id,"+
      "ware:cargoWert(s),ziel,zeit:r.zeit});");
  // Die kleine pure Testfunktion wird im selben Abschluss wie m_core_entscheidung bereitgestellt.
  js=unique(js,
    'const m_core_entscheidung = (() => {',
    'const m_core_entscheidung = (() => {\nconst cargoWert = (s) => Object.entries(s.ladung).filter(([k,v]) => v>0).map(([k,v])=>[k,v]);');
  const flightAnker="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
  js=unique(js,flightAnker,
    "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
    "    if (['npc1','npc2'].includes(s.owner)) __events.push({art:'flug',tick:state.tick,"+
      "owner:s.owner,schiff:s.id,betrag:kosten});\n"+
    "  }\n  if (s.phase === 'dock') {");
  const lossAnker="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (!abschliessen(state, id))";
  js=unique(js,lossAnker,
    "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
    "    if (['npc1','npc2'].includes(s.owner)) __events.push({art:'flug',tick:state.tick,"+
      "owner:s.owner,schiff:s.id,betrag:kosten,verlust:true});\n"+
    "  }\n  if (!abschliessen(state, id))");
  const subsidy="  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;";
  js=unique(js,subsidy,
    "  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n;\n"+
    "  __events.push({art:'zuschuss',tick:state.tick,owner,betrag:n});\n"+
    "  return n;");
  const BetriebAnker="    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;";
  js=unique(js,BetriebAnker,
    "    const n = Math.min(besitzer.cash, kosten);\n"+
    "    __events.push({art:'betrieb',tick:state.tick,owner:s.owner,klasse:s.klasse,"+
      "schiff:s.id,soll:kosten,gezahlt:n});\n"+
    "    if (n <= 0) continue;");
  const MinerKaufAnker="  buche(state, schiff.owner, 'kosten', fee);";
  // Der bestehende Haendler-Mitschnitt wird direkt dahinter erweitert:
  js=unique(js,
    "  if ("+traderFilter+") __events.push({art:'ware',tick:state.tick,owner:schiff.owner,"+
    "schiff:schiff.id,ware,menge,kauf,station,preis:p,wert,fee});",
    "  if ("+traderFilter+") __events.push({art:'ware',tick:state.tick,owner:schiff.owner,"+
    "schiff:schiff.id,ware,menge,kauf,station,preis:p,wert,fee});\n"+
    "  if(schiff.owner==='npc3' && kauf && ware==='miner')"+
    " __events.push({art:'minerKauf',tick:state.tick,wert,fee});");
  const {core,base,herkunft,preis}=new Function('const __events=arguments[0];const __claims=arguments[1];\n'+js+
    ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft,preis:m_core_preis.preis};')(events,claims);
  const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
    produktionslohnJeMinute:4,haushaltskaufNeu:true,mindeststand:0,
    fondsObergrenze:1_000_000_000}};
  assert.equal(base.rulesVersion,14);
  return {core,rules,herkunft,preis,events,modus};
}
function zahlen(){return {nahrungEinkauf:0,nahrungVerkauf:0,nahrungMengeEinkauf:0,
  nahrungMengeVerkauf:0,wareEinkauf:0,wareVerkauf:0,gebuehr:0,
  frachterKauf:0,flugBezahlt:0,fluege:0,fluegeMitNahrung:0,
  leerfahrten:0,flugVerlust:0,zuschuss:0,
  minerKostenSoll:0,minerKostenBezahlt:0,minerKaufISK:0,jaegerKostenSoll:0,
  jaegerKostenBezahlt:0,sonstNichtGedeckt:0,
  zielwahl:0,zielAnkunft:0,zielKauf:0,prognosePositionISK:0,
  zielOffen:{},zielKaufMenge:0,zielKaufErwarteteWare:0,
  zielKaufAndereWare:0,fehlPrognose:0,marktKonflikte:0,absatzNichtDeckend:0};}
function verarbeite(z,ev){
  if(ev.art==='ware'){
    if(ev.kauf && z.zielOffen[ev.schiff] && ev.station===z.zielOffen[ev.schiff].ziel) {
      z.zielKauf++;z.zielKaufMenge+=ev.menge;
      if(z.zielOffen[ev.schiff].ware===ev.ware)z.zielKaufErwarteteWare++;
      else z.zielKaufAndereWare++;
      delete z.zielOffen[ev.schiff];
    }
    if(ev.kauf){z.wareEinkauf+=ev.wert; if(ev.ware==='frachter')z.frachterKauf+=ev.wert;}
    else z.wareVerkauf+=ev.wert;
    z.gebuehr+=ev.fee;
    if(ev.ware==='nahrung'){
      if(ev.kauf){z.nahrungEinkauf+=ev.wert;z.nahrungMengeEinkauf+=ev.menge;}
      else {z.nahrungVerkauf+=ev.wert;z.nahrungMengeVerkauf+=ev.menge;}
    }
  }else if(ev.art==='zielwahl'){
    assert(/^v[1-9][0-9]*$/.test(ev.vertrag),'jede Zielpositionierung hat echten Vertrag');
    assert.equal(ev.gesperrt,ev.positionKosten,
      'Neuplatzierung vor Abflug vollständig und atomar aus Eigentümerkasse reserviert');
    assert(ev.prognoseGewinn>0 && ev.positionKosten>0,
      'reale Marktschance nach allen kalkulierten Fahrtkosten');
    z.zielwahl++;
    z.prognosePositionISK+=ev.positionKosten;
    if(z.zielOffen[ev.schiff])z.fehlPrognose++;
    z.zielOffen[ev.schiff]={ziel:ev.ziel,ware:ev.ware,
      erwartet:ev.menge,prognose:ev.prognoseGewinn,tick:ev.tick};
  }else if(ev.art==='ankunft'){
    if(z.zielOffen[ev.schiff] && z.zielOffen[ev.schiff].ziel===ev.station)
      z.zielAnkunft++;
  }else if(ev.art==='start'){
    z.fluege++;
    if(ev.ware.some(([w])=>w==='nahrung'))z.fluegeMitNahrung++;
    if(!ev.ware.length)z.leerfahrten++;
  }else if(ev.art==='flug'){
    z.flugBezahlt+=ev.betrag;
    if(ev.verlust)z.flugVerlust+=ev.betrag;
  }else if(ev.art==='zuschuss')z.zuschuss+=ev.betrag;
  else if(ev.art==='marktKonflikt')z.marktKonflikte++;
  else if(ev.art==='absatzOhneDeckung')z.absatzNichtDeckend++;
  else if(ev.art==='betrieb'){
    if(ev.klasse==='miner'){z.minerKostenSoll+=ev.soll;z.minerKostenBezahlt+=ev.gezahlt;}
    else if(ev.klasse==='jaeger'){z.jaegerKostenSoll+=ev.soll;z.jaegerKostenBezahlt+=ev.gezahlt;}
    else z.sonstNichtGedeckt+=ev.soll-ev.gezahlt;
  }else if(ev.art==='minerKauf')z.minerKaufISK+=ev.wert;
}
function audit(m,s,save=false){
  const reserve=Object.values(s.vertraege.eintraege).reduce((z,v)=>z+v.rest,0);
  const frei=Object.values(s.owners).reduce((z,o)=>z+o.cash,0);
  assert.equal(frei+reserve,s.initialSupply+s.minted-s.burned);
  assert(m.core.audit(s).ok,'Core-Geld-/Warenaudit');
  m.herkunft.pruefe(s);
  if(save)assert.equal(m.core.hash(s),m.core.hash(m.core.load(m.core.save(s),undefined,m.rules)));
}
function report(m,s,z,seed,day){
  const h=Object.values(s.stats.haushaltskauf);
  const bedarf=h.reduce((v,x)=>v+x.fehlend,0);
  const bezahlt=h.reduce((v,x)=>v+x.menge,0);
  const isk=h.reduce((v,x)=>v+x.isk,0);
  const stationKasse=Object.values(s.stations).reduce((v,x)=>v+s.owners[x.id].cash,0);
  const hKasse=Object.keys(s.owners).filter(x=>x.startsWith('hh_')).reduce((v,x)=>v+s.owners[x].cash,0);
  const reserved=Object.values(s.vertraege.eintraege).filter(x=>['npc1','npc2'].includes(x.zahlender))
    .reduce((v,x)=>v+x.rest,0);
  const stationenMangel=Object.keys(s.stats.mangel).filter(id=>s.stats.mangel[id].nahrung>0).length;
  const ships=Object.values(s.ships).filter(x=>['npc1','npc2'].includes(x.owner)&&x.klasse==='frachter').length;
  const stationFood=Object.values(s.stations).reduce((v,x)=>v+(x.lager.nahrung||0),0);
  const neuerBestand=Object.values(s.stations).reduce((v,x)=>v+(x.lokalNeuNahrung||0),0);
  const foodInShips=Object.values(s.ships).reduce((v,x)=>v+(x.ladung.nahrung||0),0);
  const foodProduced=s.ledger.nahrung.produced;
  const ersatz=id=>Object.values(s.stats.indienst[id]||{}).reduce((v,x)=>v+x,0);
  const hhWages=Object.keys(s.stats.konto).filter(x=>x.startsWith('hh_'))
    .reduce((v,x)=>v+s.stats.konto[x].erloes,0);
  const stationenAudit=(day===7 || day===14) && [42,7].includes(seed)
    ? Object.fromEntries(Object.entries(s.stations).map(([id,st])=>{
      const old=(st.lager.nahrung||0)-(st.lokalNeuNahrung||0);
      const bedarf=m.rules.world.stations[id].verbrauch.nahrung||0;
      const p=m.preis(s,id,'nahrung',m.rules);
      const hh=s.owners['hh_'+id].cash;
      return [id,{stationCash:s.owners[id].cash,haushaltCash:hh,
        konsumBedarfJeStunde:bedarf,essenAlt:old,essenNeu:st.lokalNeuNahrung||0,
        preis:p,hhTheoretischKaufbar:Math.floor(hh/p),
        konsumNeuBezahlt:s.stats.haushaltskauf[id].menge,
        konsumFehlend:s.stats.haushaltskauf[id].fehlend}];
      })) : null;
  return {seed,modus:m.modus,tag:day,npcCash:s.owners.npc1.cash+s.owners.npc2.cash,
    npcReserve:reserved,npcFrachter:ships,stationsCash:stationKasse,haushalteCash:hKasse,
    nahrungBezahlt:bezahlt,nahrungBezahlungISK:isk,nahrungFehlendeEinheiten:bedarf,
    nahrungsmangelStationen:stationenMangel,
    nahrungBestandStationen:stationFood,neueNahrungImLager:neuerBestand,
    nahrungImFrachter:foodInShips,nahrungProduziert:foodProduced,
    stationenAudit,
    neuerWarenNachweis:s.haushaltNeuLedger?.produziert||0,
    haushaltLohnISK:hhWages,
    npc3Cash:s.owners.npc3.cash,
    npcErsatzFrachter:ersatz('npc1')+ersatz('npc2'),
    npcErsatzMiner:ersatz('npc3'),
    fracht:z,nettoHandelscashVorFlug:z.wareVerkauf-z.wareEinkauf-z.gebuehr,
    nettoHandelscashNachFlug:z.wareVerkauf-z.wareEinkauf-z.gebuehr-z.flugBezahlt,
    minted:s.minted,burned:s.burned,hash:m.core.hash(s)};
}
function laufen(seed,tage=6,{write=true}={}){
  const models=['hinrueck-ziel','hinrueck-ziel-absatz'].map(build);
  const states=models.map(m=>m.core.createState(seed,m.rules));
  const counter=models.map(zahlen);
  const totals=[];
  for(let t=1;t<=tage*1440;t++){
    for(let i=0;i<models.length;i++){
      const m=models[i],s=states[i];
      m.core.step(s,m.rules);
      for(const e of m.events.splice(0))verarbeite(counter[i],e);
      if(t%60===0)audit(m,s,t%1440===0);
    }
    if(t%1440===0){
      const day=t/1440;
      const rows=models.map((m,i)=>report(m,states[i],{...counter[i]},seed,day));
      if(write)for(const row of rows)console.log('B-K10b Tag',JSON.stringify(row));
      totals.push(rows);
    }
  }
  return totals;
}

const SEEDS=[42,7,11,1,2,13,17,23,31,99,1234,98765,65535];
const TAGE=14;
function auswertung(seed){
  const tage=laufen(seed,TAGE,{write:false});
  const mitte=tage[6],ende=tage.at(-1);
  const [basis,kandidat]=ende;
  function kompakt(r){
    const f=r.fracht;
    return {
      nahrungBezahlt:r.nahrungBezahlt,fehlbedarf:r.nahrungFehlendeEinheiten,
      neueTag8bis14:r.nahrungBezahlt-mitte[ende.indexOf(r)].nahrungBezahlt,
      fehlTag8bis14:r.nahrungFehlendeEinheiten-mitte[ende.indexOf(r)].nahrungFehlendeEinheiten,
      npcCash:r.npcCash,npcReserve:r.npcReserve,npcFrachter:r.npcFrachter,
      stationsCash:r.stationsCash,haushalteCash:r.haushalteCash,npc3Cash:r.npc3Cash,
      nahrungStationen:r.nahrungBestandStationen,neuStationen:r.neueNahrungImLager,
      nahrungImFrachter:r.nahrungImFrachter,nahrungProduziert:r.nahrungProduziert,
      haushaltLohnISK:r.haushaltLohnISK,
      frachterErsatz:r.npcErsatzFrachter,minerErsatz:r.npcErsatzMiner,
      reisekosten:f.flugBezahlt,handelscashNachFlug:r.nettoHandelscashNachFlug,
      minerSoll:f.minerKostenSoll,minerBezahlt:f.minerKostenBezahlt,minerNeuKauf:f.minerKaufISK,
      jaegerSoll:f.jaegerKostenSoll,jaegerBezahlt:f.jaegerKostenBezahlt,
      gezieltePositionen:f.zielwahl,davonGekauft:f.zielKauf,
      abgelehnteAbsatzKandidaten:f.absatzNichtDeckend,
      individuellerZuschuss:f.zuschuss,minted:r.minted,burned:r.burned,
      betroffeneStationen:r.nahrungsmangelStationen,
      einzelstationen:r.stationenAudit
    };
  }
  const beides={seed,tag7:mitte.map(r=>({modus:r.modus,nahrung:r.nahrungBezahlt,
    fehl:r.nahrungFehlendeEinheiten,npcCash:r.npcCash})),
    basis:kompakt(basis),absatz:kompakt(kandidat)};
  beides.differenz={
    versorgung:kandidat.nahrungBezahlt-basis.nahrungBezahlt,
    fehlbedarf:kandidat.nahrungFehlendeEinheiten-basis.nahrungFehlendeEinheiten,
    freieHandlerISK:kandidat.npcCash-basis.npcCash,
    tatsaechlicherFlugISK:kandidat.fracht.flugBezahlt-basis.fracht.flugBezahlt,
    taeglicherVerbrauchWoche2:(kandidat.nahrungBezahlt-mitte[1].nahrungBezahlt)-
      (basis.nahrungBezahlt-mitte[0].nahrungBezahlt)
  };
  for(const x of [basis,kandidat]){
    assert(x.npcCash>=0&&x.npcReserve>=0,'kein negativer Eigentuemerkassen-/Reservebetrag');
    assert(x.fracht.minerKostenBezahlt<=x.fracht.minerKostenSoll,'keine Miner-Gratiszahlung');
    assert(x.fracht.jaegerKostenBezahlt<=x.fracht.jaegerKostenSoll,'keine Jaeger-Gratiszahlung');
    assert(x.fracht.flugBezahlt>=0);
    assert(x.nahrungProduziert>=0);
  }
  console.log('B-K10b Langzeit',JSON.stringify(beides));
  return beides;
}
for(let gruppe=0;gruppe<3;gruppe++){
  const auswahl=SEEDS.slice(gruppe*5,gruppe===2?13:gruppe*5+5);
  test('B-K10b: aktive Wirtschafts- und Versorgungsgegenprobe 14 Tage, Seedgruppe '+(gruppe+1),()=>{
    const result=auswahl.map(auswertung);
    assert.equal(result.length,auswahl.length);
    assert.equal(new Set(result.map(x=>x.seed)).size,auswahl.length);
    const bessereVersorgung=result.filter(x=>x.differenz.versorgung>0).length;
    const schlechtereVersorgung=result.filter(x=>x.differenz.versorgung<0).length;
    const positiveKasse=result.filter(x=>x.differenz.freieHandlerISK>0).length;
    const auchWoche2=result.filter(x=>x.differenz.taeglicherVerbrauchWoche2>0).length;
    console.log('B-K10b Gruppe',JSON.stringify({gruppe:gruppe+1,n:result.length,
      bessereVersorgung,schlechtereVersorgung,positiveKasse,auchWoche2}));
  });
}
test('B-K10b: gleiche zwei Varianten wiederholt deterministisch über 48 Stunden',()=>{
  const a=laufen(7,2,{write:false}),b=laufen(7,2,{write:false});
  assert.deepEqual(a,b);
});
test('B-K10b: passive Original-Core Instrumentierung bleibt hashneutral',()=>{
  const m=build('original'),native=new Function(original+';return m_core_index;')();
  const a=m.core.createState(42,m.rules),b=native.createState(42,m.rules);
  for(let i=0;i<120;i++){
    m.core.step(a,m.rules);native.step(b,m.rules);
    assert.equal(m.core.hash(a),native.hash(b));
  }
});
