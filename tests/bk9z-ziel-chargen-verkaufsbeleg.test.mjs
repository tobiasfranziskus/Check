// B-K9z: originaler Markt / kostenbereinigte Basis ohne zufaellige Leerfluege /
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
      "          menge:ziel.menge,prognoseGewinn:ziel.gewinn,positionKosten:ziel.positionKosten,\n"+
      "          vertrag:s.vertrag,gesperrt:state.vertraege.eintraege[s.vertrag].rest});",
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
  zielOffen:{},zielKaufMenge:0,zielKaufErwarteteWare:0,
  zielKaufAndereWare:0,fehlPrognose:0};}
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
}

// B-K9z: Einzelfallbelege. Der originale Core entscheidet, bucht, fliegt und zahlt.
// Die folgende Sicht klassifiziert nur Ereignisse; sie verleiht weder Ware noch ISK.
function zielBelege(){
  const ziele=[], offen=new Map(),fluege=new Map(),lose=new Map();
  let gesamtFlug=0,zugeordnetFlug=0,ueberlappung=0,verkaufsMengeOhneZiel=0;
  function losliste(s){if(!lose.has(s))lose.set(s,[]);return lose.get(s);}
  function erfassen(e){
    if(e.art==='start'){
      fluege.set(e.schiff,{tick:e.tick,ware:e.ware,id:null});
    }else if(e.art==='zielwahl'){
      const vor=offen.get(e.schiff);
      if(vor && !vor.gekauft)vor.ueberplant=true;
      const gleich=Array.from(offen.values()).filter(x=>x!==vor && !x.gekauft
        && !x.ueberplant && x.ziel===e.ziel && x.ware===e.ware);
      ueberlappung+=gleich.length;
      const f=fluege.get(e.schiff);
      assert(f && !f.ware.length && f.tick===e.tick,'Ziel nur mit echtem Leerflug');
      const t={id:ziele.length+1,schiff:e.schiff,tick:e.tick,ziel:e.ziel,
        von:e.von,ware:e.ware,erwartet:e.menge,absatz:e.absatz,
        prognose:e.prognoseGewinn,budget:e.positionKosten,
        gegenplaner:gleich.map(x=>x.id),ankunft:null,gekauft:false,
        gekauftVorhergesagt:false,gekauftWare:null,menge:0,
        einkauf:0,gebuehrEinkauf:0,verkauft:0,erloes:0,gebuehrVerkauf:0,
        positionGezahlt:0,frachtGezahlt:0,ueberplant:false,
        kostenAbverkauft:0};
      ziele.push(t);offen.set(e.schiff,t);f.id=t.id;
    }else if(e.art==='ankunft'){
      const t=offen.get(e.schiff);
      if(t && !t.ankunft && t.ziel===e.station)t.ankunft=e.tick;
    }else if(e.art==='ware'){
      if(e.kauf){
        const t=offen.get(e.schiff);
        if(t && t.ankunft!==null && !t.gekauft && e.station===t.ziel){
          t.gekauft=true;t.gekauftVorhergesagt=e.ware===t.ware;
          t.gekauftWare=e.ware;t.menge=e.menge;t.einkauf=e.wert;
          t.gebuehrEinkauf=e.fee;
          losliste(e.schiff).push({t,ware:e.ware,menge:e.menge,
            anf:e.menge,einzel:e.preis,einFee:e.fee,gebuehrVerbraucht:0});
        }
      }else{
        let menge=e.menge, l=losliste(e.schiff);
        for(const lot of l){
          if(lot.ware!==e.ware || lot.menge===0)continue;
          const n=Math.min(lot.menge,menge);
          if(n<=0)continue;
          // Vollstaendig bezahlten Verkauf nur zum jeweiligen echten Core-Preis.
          lot.menge-=n; menge-=n;
          const feeTeil=n*e.fee/e.menge;
          lot.t.verkauft+=n;lot.t.erloes+=n*e.preis;
          lot.t.gebuehrVerkauf+=feeTeil;
          lot.t.kostenAbverkauft+=n*(lot.einzel+lot.einFee/lot.anf);
          if(!menge)break;
        }
        verkaufsMengeOhneZiel+=menge;
      }
    }else if(e.art==='flug'){
      gesamtFlug+=e.betrag;
      const f=fluege.get(e.schiff);
      if(f && f.id){
        const t=ziele[f.id-1];
        t.positionGezahlt+=e.betrag;zugeordnetFlug+=e.betrag;
      }else if(f && f.ware.length){
        const gesamt=f.ware.reduce((n,p)=>n+p[1],0);
        const verteilbar=losliste(e.schiff).filter(l=>l.menge>0);
        const betragEinheiten=verteilbar.reduce((n,l)=>n+Math.min(l.menge,
          (f.ware.find(p=>p[0]===l.ware)||[])[1]||0),0);
        if(gesamt>0 && betragEinheiten){
          for(const l of verteilbar){
            const menge=Math.min(l.menge,(f.ware.find(p=>p[0]===l.ware)||[])[1]||0);
            const kosten=e.betrag*menge/gesamt;
            l.t.frachtGezahlt+=kosten;
            zugeordnetFlug+=kosten;
          }
        }
      }
    }
  }
  function ergebnis(){
    const summen=ziele.reduce((acc,t)=>{
      for(const [k,v]of [
        ['positionGezahlt',t.positionGezahlt],['frachtGezahlt',t.frachtGezahlt],
        ['gekaufteMenge',t.menge],['verkaufteMenge',t.verkauft],
        ['einkauf',t.einkauf],['einkaufsFee',t.gebuehrEinkauf],
        ['verkauf',t.erloes],['verkaufsFee',t.gebuehrVerkauf]
      ])acc[k]=(acc[k]||0)+v;
      return acc;
    },{});
    const unverkaufteEinheiten=ziele.reduce((n,t)=>n+t.menge-t.verkauft,0);
    const cashNachBelegen=(summen.verkauf||0)-(summen.verkaufsFee||0)-
      (summen.einkauf||0)-(summen.einkaufsFee||0)-
      (summen.positionGezahlt||0)-(summen.frachtGezahlt||0);
    const v={ziele:ziele.length,ankunft:ziele.filter(t=>t.ankunft!==null).length,
      gekaufteZiele:ziele.filter(t=>t.gekauft).length,
      passendeWare:ziele.filter(t=>t.gekauftVorhergesagt).length,
      andersGekauft:ziele.filter(t=>t.gekauft&&!t.gekauftVorhergesagt).length,
      teilsVerkauft:ziele.filter(t=>t.verkauft>0).length,
      ganzVerkauft:ziele.filter(t=>t.gekauft&&t.verkauft===t.menge).length,
      ohneKauf:ziele.filter(t=>!t.gekauft).length,
      neuUeberplant:ziele.filter(t=>t.ueberplant).length,
      konkurrenzOffeneZiele:ueberlappung,
      unverkaufteEinheiten,gesamteFlugzahlungen:gesamtFlug,
      davonZuordnungZuZielen:zugeordnetFlug,
      ...summen,
      bezahlterZielCashflow:cashNachBelegen,
      verkaufOhneZielLosen:verkaufsMengeOhneZiel};
    assert(v.davonZuordnungZuZielen<=v.gesamteFlugzahlungen+1e-6);
    assert(v.verkaufteMenge<=v.gekaufteMenge);
    assert.equal(v.gekaufteZiele,v.passendeWare+v.andersGekauft);
    assert.equal(v.ziele,v.gekaufteZiele+v.ohneKauf);
    return {s:v,details:ziele.map(t=>({
      id:t.id,tick:t.tick,schiff:t.schiff,ziel:t.ziel,
      warePrognose:t.ware,wareKauf:t.gekauftWare,
      mitbewerber:t.gegenplaner,ankunft:t.ankunft,ueberplant:t.ueberplant,
      kaufMenge:t.menge,verkaufMenge:t.verkauft,
      kasseZahlung:t.erloes-t.gebuehrVerkauf-t.einkauf-
        t.gebuehrEinkauf-t.positionGezahlt-t.frachtGezahlt,
      erklaerteKosten:{position:t.positionGezahlt,transport:t.frachtGezahlt},
      handelsumsatz:t.erloes
    }))};
  }
  return {erfassen,ergebnis};
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
  const belege=models.map(m=>m.modus==='hinrueck-ziel'?zielBelege():null);
  const totals=[];
  for(let t=1;t<=tage*1440;t++){
    for(let i=0;i<models.length;i++){
      const m=models[i],s=states[i];
      m.core.step(s,m.rules);
      for(const e of m.events.splice(0)) {
        verarbeite(counter[i],e);
        if(belege[i])belege[i].erfassen(e);
      }
      if(t%60===0)audit(m,s,t%1440===0);
    }
    if(t%1440===0){
      const day=t/1440;
      const rows=models.map((m,i)=>report(m,states[i],{...counter[i]},seed,day));
      if(write)for(const row of rows)console.log('B-K9y Ziel',JSON.stringify(row));
      totals.push(rows);
    }
  }
  return {tage:totals,belege:belege.find(Boolean)?.ergebnis()};
}

test('B-K9z: einzelne Zielprognose bis Kauf, Verkauf und bezahlter Fracht, Seed 42/7 × 6 Tage',()=>{
  for(const seed of [42,7]){
    const r=laufen(seed,6,{write:false}),x=r.belege;
    assert.equal(r.tage.length,6);
    assert(x.s.ziele>0);
    assert(x.s.ganzVerkauft<=x.s.gekaufteZiele);
    assert(x.s.gesamteFlugzahlungen>0);
    assert.equal(x.s.ankunft,x.s.ziele);
    for(const d of x.details){
      if(d.kaufMenge>0)assert(d.ankunft!==null);
      assert(d.verkaufMenge<=d.kaufMenge);
      assert(d.erklaerteKosten.position>=0 && d.erklaerteKosten.transport>=0);
    }
    console.log('B-K9z Ergebnis',JSON.stringify({seed,...x.s,
      tag6:r.tage.at(-1).map(y=>({modus:y.modus,
        nahrungBezahlt:y.nahrungBezahlt,nahrungFehlende:y.nahrungFehlendeEinheiten,
        npcCash:y.npcCash,leerfahrten:y.fracht.leerfahrten}))}));
    console.log('B-K9z Ziel-Details',JSON.stringify({seed,ziele:x.details}));
  }
});
test('B-K9z: deterministisches Belegreplay Seed7 zwei Tage',()=>{
  assert.deepEqual(laufen(7,2,{write:false}),laufen(7,2,{write:false}));
});
test('B-K9z: Original-Core-Hash bleibt durch passives Instrumentieren erhalten',()=>{
  const m=build('original'),native=new Function(original+';return m_core_index;')();
  const a=m.core.createState(42,m.rules),b=native.createState(42,m.rules);
  for(let t=1;t<=120;t++){m.core.step(a,m.rules);native.step(b,m.rules);
    assert.equal(m.core.hash(a),native.hash(b));}
});
