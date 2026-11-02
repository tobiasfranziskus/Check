// B-K9y: originaler Markt / kostenbereinigte Basis ohne zufaellige Leerfluege /
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
  let js=original,events=[];
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

  if(modus==='hinrueck-ziel'){
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
    const gezielt=[
      "    else if (s.warten >= 2) {",
      "      const ziel=zielposition(state,rules,s,station);",
      "      if (ziel && abflug(state,rules,s,station,ziel.ziel,null,0)) {",
      "        __events.push({art:'zielwahl',tick:state.tick,owner:s.owner,schiff:s.id,",
      "          von:station,ziel:ziel.ziel,absatz:ziel.absatz,ware:ziel.ware,",
      "          menge:ziel.menge,prognoseGewinn:ziel.gewinn,positionKosten:ziel.positionKosten});",
      "      } else s.ankunft = state.tick+w.warteLeer;",
      "    }"
    ].join("\n");
    js=unique(js,leerOriginal,gezielt);
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
  const {core,base,herkunft}=new Function('const __events=arguments[0];\n'+js+
    ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft};')(events);
  const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
    produktionslohnJeMinute:4,haushaltskaufNeu:true,mindeststand:0,
    fondsObergrenze:1_000_000_000}};
  assert.equal(base.rulesVersion,14);
  return {core,rules,herkunft,events,modus};
}
function zahlen(){return {nahrungEinkauf:0,nahrungVerkauf:0,nahrungMengeEinkauf:0,
  nahrungMengeVerkauf:0,wareEinkauf:0,wareVerkauf:0,gebuehr:0,
  frachterKauf:0,flugBezahlt:0,fluege:0,fluegeMitNahrung:0,
  leerfahrten:0,flugVerlust:0,zuschuss:0,
  zielwahl:0,zielAnkunft:0,zielKauf:0,prognosePositionISK:0,
  zielOffen:{},zielKaufMenge:0,fehlPrognose:0};}
function verarbeite(z,ev){
  if(ev.art==='ware'){
    if(ev.kauf && z.zielOffen[ev.schiff] && ev.station===z.zielOffen[ev.schiff].ziel) {
      z.zielKauf++;z.zielKaufMenge+=ev.menge;
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
  return {seed,modus:m.modus,tag:day,npcCash:s.owners.npc1.cash+s.owners.npc2.cash,
    npcReserve:reserved,npcFrachter:ships,stationsCash:stationKasse,haushalteCash:hKasse,
    nahrungBezahlt:bezahlt,nahrungBezahlungISK:isk,nahrungFehlendeEinheiten:bedarf,
    nahrungsmangelStationen:stationenMangel,
    fracht:z,nettoHandelscashVorFlug:z.wareVerkauf-z.wareEinkauf-z.gebuehr,
    nettoHandelscashNachFlug:z.wareVerkauf-z.wareEinkauf-z.gebuehr-z.flugBezahlt,
    minted:s.minted,burned:s.burned,hash:m.core.hash(s)};
}
function laufen(seed,tage=6,{write=true}={}){
  const models=['original','hinrueck-ohne-leer','hinrueck-ziel'].map(build);
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
      if(write)for(const row of rows)console.log('B-K9y Ziel',JSON.stringify(row));
      totals.push(rows);
    }
  }
  return totals;
}
test('B-K9y: echte Zielpositionierung vs Stillstand und Original, Seed42/7 x6 Tage',()=>{
  for(const seed of [42,7]){
    const rows=laufen(seed,6);
    assert.equal(rows.length,6);
    for(const row of rows.flat()){
      assert(row.fracht.flugBezahlt>=0);
      assert(row.nahrungFehlendeEinheiten>=0);
      assert(row.fracht.zuschuss>=0);
      if(row.modus==='hinrueck-ohne-leer')
        assert.equal(row.fracht.leerfahrten,0,'Kontrollvariante ohne Leerposition');
      if(row.modus==='hinrueck-ziel'){
        assert.equal(row.fracht.leerfahrten,row.fracht.zielwahl,
          'nur nach belegtem positiven Zieltest sind leere Fahrten gestattet');
        assert(row.fracht.zielKauf<=row.fracht.zielAnkunft,
          'keine gezielt erreichte Station darf mehrere Erstkaeufe doppelt zaehlen');
      }
    }
    // Keine Ergebnisvorgabe, die einen möglichen negativen Befund grünfärbt.
    // Die Evaluationswerte werden im Log und Bericht verglichen.
  }
});
test('B-K9y: deterministische drei-Varianten-Replays, Seed7 × zwei Tage',()=>{
  assert.deepEqual(laufen(7,2,{write:false}),laufen(7,2,{write:false}));
});
test('B-K9y: passiver Original-Core weiterhin hashidentisch (Seed42)',()=>{
  const model=build('original');
  const native=new Function(original+';return m_core_index;')();
  const a=model.core.createState(42,model.rules),b=native.createState(42,model.rules);
  for(let t=1;t<=120;t++){
    model.core.step(a,model.rules);native.step(b,model.rules);
    assert.equal(model.core.hash(a),native.hash(b));
  }
});
