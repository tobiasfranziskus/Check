// B-K9w: kausale Gegenprobe zu historischem Flottenzuschuss,
// Nahrungsfracht mit Original-Core-Geld, Waren, Flugvertraegen und Belegen.
// Ausschliesslich Test-Closures: der produktive Core, Rules und Saves bleiben identisch.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const seeds=[42,7];
function einmal(src,a,b){
  assert.equal(src.split(a).length,2,'Original-Core-Instrumentierungsanker eindeutig: '+a.slice(0,70));
  return src.replace(a,b);
}
function modell(zuschussAktiv){
  let src=source,events=[];
  // Nur fuer die kausale TEST-Kontrolle: keine Auszahlung im Werftkauf-Pfad.
  if(!zuschussAktiv)
    src=einmal(src,'if (leer) zuschuss(state, rules, owner, bedarf);',
      'if (leer && false) zuschuss(state, rules, owner, bedarf);');
  const trade="  buche(state, schiff.owner, 'kosten', fee);";
  src=einmal(src,trade,trade+"\n"+
    "  if (schiff.klasse === 'frachter' && ['npc1','npc2'].includes(schiff.owner))\n"+
    "    __events.push({art:'handel',tick:state.tick,owner:schiff.owner,schiff:schiff.id,"+
      "ware,kauf,station,menge,preis:p,wert,fee});");
  const flight="  s.phase = 'reise'; s.ziel = ziel; s.ankunft = state.tick + r.zeit; s.warten = 0;";
  src=einmal(src,flight,flight+"\n"+
    "  if (s.vertrag && ['npc1','npc2'].includes(s.owner)) {\n"+
    "    const cargo = {...s.ladung};\n"+
    "    __events.push({art:'flugStart',tick:state.tick,owner:s.owner,schiff:s.id,"+
      "vertrag:s.vertrag,cargo,von:station,nach:ziel,zeit:r.zeit});\n"+
    "  }");
  const paid="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
  src=einmal(src,paid,
    "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
    "    if (['npc1','npc2'].includes(s.owner))\n"+
    "      __events.push({art:'flugKosten',tick:state.tick,owner:s.owner,"+
      "schiff:s.id,vertrag:id,betrag:kosten});\n"+
    "  }\n  if (s.phase === 'dock') {");
  const lost="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (!abschliessen(state, id))";
  src=einmal(src,lost,
    "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
    "    if (['npc1','npc2'].includes(s.owner))\n"+
    "      __events.push({art:'flugKosten',tick:state.tick,owner:s.owner,"+
      "schiff:s.id,vertrag:id,betrag:kosten,verlust:true});\n"+
    "  }\n  if (!abschliessen(state, id))");
  const grant="  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;";
  src=einmal(src,grant,
    "  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n;\n"+
    "  __events.push({art:'flottenzuschuss',tick:state.tick,owner,betrag:n});\n"+
    "  return n;");
  const {core,base,herkunft}=new Function('const __events=arguments[0];\n'+src+
    ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft};')(events);
  assert.equal(base.rulesVersion,14);
  const rules={...base,schema:9,rulesVersion:15,world:{...base.world,
    produktionslohnJeMinute:4,haushaltskaufNeu:true,mindeststand:0,fondsObergrenze:1_000_000_000}};
  return {core,rules,herkunft,events,zuschussAktiv};
}
function geld(s,core,rules,herkunft,load=false){
  const frei=Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
  const gebunden=Object.values(s.vertraege.eintraege).reduce((a,v)=>a+v.rest,0);
  assert.equal(frei+gebunden,s.initialSupply+s.minted-s.burned,
    'unabhaengiger Geld-/Reserve-Audit');
  assert(core.audit(s).ok,'originales Waren-/Geldaudit');
  herkunft.pruefe(s);
  if(load)assert.equal(core.hash(core.load(core.save(s),undefined,rules)),core.hash(s),
    'Save/Load');
}
function frachtJournal(){
  const offene=new Map(),fluege=new Map();
  const zahlen={kaufMenge:0,kaufISK:0,kaufGebuehrISK:0,
    verkaufMenge:0,verkaufISK:0,verkaufGebuehrISK:0,
    matchingMenge:0,matchingDeckungsbeitragISK:0,unbewertetMenge:0,
    kaufOhneAbsatzMenge:0,flugKostenGesamtISK:0,
    fluegeMitNahrung:0,fluegeNurNahrung:0,fluegeOhneNahrung:0,fluegeGemischt:0,
    flugKostenMitNahrungISK:0,flugKostenNurNahrungISK:0,flugKostenOhneNahrungISK:0,
    flugKostenGemischtISK:0,flottenzuschussISK:0,zuschussAnNPC1ISK:0,
    fahrtAnzahl:0,sonderverlustKostenISK:0};
  const schiffWaren=new Map();
  function los(sh){if(!schiffWaren.has(sh))schiffWaren.set(sh,[]);return schiffWaren.get(sh);}
  function event(e){
    if(e.art==='handel' && e.ware==='nahrung'){
      const queue=los(e.schiff);
      if(e.kauf){
        queue.push({menge:e.menge,einzel:e.preis,gebuehr:e.fee,gesamt:e.menge,verbraucht:0});
        zahlen.kaufMenge+=e.menge;zahlen.kaufISK+=e.wert;zahlen.kaufGebuehrISK+=e.fee;
      }else{
        zahlen.verkaufMenge+=e.menge;zahlen.verkaufISK+=e.wert;zahlen.verkaufGebuehrISK+=e.fee;
        let rest=e.menge,gekostet=0,abgerechneteMenge=0;
        while(rest>0 && queue.length){
          const l=queue[0],teil=Math.min(rest,l.menge);
          const vorher=Math.floor(l.verbraucht*l.gebuehr/l.gesamt);
          l.verbraucht+=teil;
          const jetzt=Math.floor(l.verbraucht*l.gebuehr/l.gesamt);
          gekostet+=teil*l.einzel+jetzt-vorher;
          abgerechneteMenge+=teil;rest-=teil;l.menge-=teil;
          if(!l.menge)queue.shift();
        }
        // Falls Start-/Fremdladung nicht belegt ist: nicht als kostenlos zaehlen.
        zahlen.unbewertetMenge+=rest;
        zahlen.matchingMenge+=abgerechneteMenge;
        // Gebuehr exakt anteilig, Rest auf unbewertete Ware separat.
        const gebuehrMatch=Math.floor(e.fee*abgerechneteMenge/e.menge);
        zahlen.matchingDeckungsbeitragISK+=abgerechneteMenge*e.preis-
          gebuehrMatch-gekostet;
      }
    }else if(e.art==='flugStart'){
      const total=Object.values(e.cargo).reduce((a,v)=>a+v,0);
      const nahrung=e.cargo.nahrung||0;
      assert(nahrung>=0 && nahrung<=total);
      assert(!fluege.has(e.vertrag),'Vertragsnummer eindeutig');
      fluege.set(e.vertrag,{schiff:e.schiff,nahrung,total,kosten:0,von:e.von,nach:e.nach,zeit:e.zeit});
      zahlen.fahrtAnzahl++;
      if(nahrung>0){zahlen.fluegeMitNahrung++;
        if(total===nahrung)zahlen.fluegeNurNahrung++;
        else zahlen.fluegeGemischt++;
      }else zahlen.fluegeOhneNahrung++;
    }else if(e.art==='flugKosten'){
      const f=fluege.get(e.vertrag);
      // Direkte NPC-Kommandofahrten haben ggf. keinen Autohandels-Startbeleg;
      // sie werden nicht der Nahrung zugeordnet, aber als Kosten erfasst.
      zahlen.flugKostenGesamtISK+=e.betrag;
      if(e.verlust)zahlen.sonderverlustKostenISK+=e.betrag;
      if(!f){zahlen.flugKostenOhneNahrungISK+=e.betrag;return;}
      f.kosten+=e.betrag;
      if(f.nahrung){
        zahlen.flugKostenMitNahrungISK+=e.betrag;
        if(f.nahrung===f.total)zahlen.flugKostenNurNahrungISK+=e.betrag;
        else zahlen.flugKostenGemischtISK+=e.betrag;
      }else zahlen.flugKostenOhneNahrungISK+=e.betrag;
    }else if(e.art==='flottenzuschuss'){
      zahlen.flottenzuschussISK+=e.betrag;
      if(e.owner==='npc1')zahlen.zuschussAnNPC1ISK+=e.betrag;
    }
  }
  function stand(){
    const unverkauft=Array.from(schiffWaren.values()).flat().reduce((a,x)=>a+x.menge,0);
    zahlen.kaufOhneAbsatzMenge=unverkauft;
    assert.equal(zahlen.flugKostenGesamtISK,
      zahlen.flugKostenMitNahrungISK+zahlen.flugKostenOhneNahrungISK);
    assert.equal(zahlen.flugKostenMitNahrungISK,
      zahlen.flugKostenNurNahrungISK+zahlen.flugKostenGemischtISK);
    assert.equal(zahlen.kaufMenge,
      zahlen.matchingMenge+zahlen.kaufOhneAbsatzMenge);
    assert.equal(zahlen.verkaufMenge,zahlen.matchingMenge+zahlen.unbewertetMenge);
    return {...zahlen};
  }
  return {event,stand,fluege};
}
function lauf(seed,days=5,logging=true){
  const mit=modell(true),ohne=modell(false);
  const a=mit.core.createState(seed,mit.rules),b=ohne.core.createState(seed,ohne.rules);
  assert.equal(mit.core.hash(a),ohne.core.hash(b));
  const ja=frachtJournal(),nein=frachtJournal();
  const paare=[{m:mit,s:a,j:ja},{m:ohne,s:b,j:nein}];
  const snapshots=[];
  let ersteAbweichung=null,ersterZuschuss=null;
  for(let t=1;t<=days*1440;t++){
    for(const x of paare){
      x.m.core.step(x.s,x.m.rules);
      for(const ev of x.m.events.splice(0))x.j.event(ev);
    }
    if(!ersterZuschuss && a.stats.zuschuss>0)
      ersterZuschuss=t;
    if(t%60!==0)continue;
    for(const x of paare)geld(x.s,x.m.core,x.m.rules,x.m.herkunft,t%1440===0);
    const equal=mit.core.hash(a)===ohne.core.hash(b);
    if(!equal && ersteAbweichung===null)ersteAbweichung=t;
    if(!ersterZuschuss)
      assert(equal,'beide Varianten vor erstem Zuschuss hashidentisch');
    if(t%1440===0){
      const row={seed,tag:t/1440,ersterZuschuss,ersteAbweichung};
      for(const [i,x] of paare.entries()){
        const prefix=i===0?'mit':'ohne',h=x.s.stats.haushaltskauf.st_cyris;
        row[prefix]={cashNPC1:x.s.owners.npc1.cash,
          cashNPC2:x.s.owners.npc2.cash,cashNPC3:x.s.owners.npc3.cash,
          cyrisCash:x.s.owners.st_cyris.cash,
          haushaltCash:x.s.owners.hh_st_cyris.cash,
          nahrungBezahlt:h.menge,nahrungFehlend:h.fehlend,
          nahrungVerkaufISK:h.isk,
          npcFrachter:Object.values(x.s.ships).filter(s=>s.klasse==='frachter'&&
            ['npc1','npc2'].includes(s.owner)).length,
          minted:x.s.minted,burned:x.s.burned,
          zuschuss:x.s.stats.zuschuss,handel:x.s.stats.handel,
          fracht:x.j.stand(),hash:x.m.core.hash(x.s)};
        assert.equal(row[prefix].zuschuss,row[prefix].fracht.flottenzuschussISK,
          'Flottenzuschuss separat aus echtem Original-Core mitgeschrieben');
      }
      if(logging)console.log('B-K9w Gegenprobe',JSON.stringify(row));
      snapshots.push(row);
    }
  }
  assert.equal(ohne.core.hash(b)===mit.core.hash(a),ersterZuschuss===null);
  assert.equal(b.stats.zuschuss,0,'in der Sperrvariante niemals Individualzuschuss');
  return {seed,ersterZuschuss,ersteAbweichung,snapshots,
    mit:ja.stand(),ohne:nein.stand(),
    mitHash:mit.core.hash(a),ohneHash:ohne.core.hash(b)};
}
test('B-K9w: Seed7 mit/ohne Flottenrettung, 5 Tage; Ledger, Fahrtkosten, Herkunft',()=>{
  const z=lauf(7,5);
  assert.equal(z.mit.flottenzuschussISK,693,'historischer Seed7-Zuschuss');
  assert.equal(z.ohne.flottenzuschussISK,0);
  assert(z.ersterZuschuss>0,'Ursache tritt in aktiver Originalwelt auf');
  assert(z.ersteAbweichung!==null,'echter kausaler Unterschied');
  assert.equal(z.snapshots.length,5);
  const ende=z.snapshots.at(-1);
  assert.equal(ende.mit.nahrungBezahlt,ende.ohne.nahrungBezahlt,
    'Flottenzuschuss hat nicht einen weiteren bezahlten Cyris-Verbrauch finanziert');
  assert.equal(ende.mit.nahrungFehlend,ende.ohne.nahrungFehlend);
  assert.equal(z.mit.matchingMenge,39,'nur belegte reale Haendler-Nahrungs-Lose');
  assert.equal(z.mit.matchingDeckungsbeitragISK,481);
  assert.equal(z.mit.flugKostenNurNahrungISK,1184);
  assert.equal(z.mit.matchingDeckungsbeitragISK-z.mit.flugKostenNurNahrungISK,-703,
    'Nahrungshandel nach zuordenbaren Fahrtkosten negativ, ohne Leerfahrt/Zins/Huelle');
  assert.equal(z.mit.fahrtAnzahl-z.ohne.fahrtAnzahl,13,
    'Flottenrettung erzeugt zusaetzliche Fahrten, nicht neue bezahlte Nahrung');
});
test('B-K9w: Seed42 Negativkontrolle, 5 Tage, vor Zuschuss identische Replays',()=>{
  const z=lauf(42,5);
  assert.equal(z.mit.flottenzuschussISK,0,'Seed42 ohne historischen Flottenzuschuss');
  assert.equal(z.ohne.flottenzuschussISK,0);
  assert.equal(z.mitHash,z.ohneHash,'nur Zuschussweg deaktiviert; ohne Auslösung keine Änderung');
  assert.equal(z.mit.matchingMenge,38);
  assert.equal(z.mit.matchingDeckungsbeitragISK,474);
  assert.equal(z.mit.flugKostenNurNahrungISK,602);
  assert.equal(z.mit.matchingDeckungsbeitragISK-z.mit.flugKostenNurNahrungISK,-128,
    'auch Seed42 ist nach realer Nahrungskauf-/Verkaufsmarge plus Fahrtkosten negativ');
});
test('B-K9w: Seed7-Replay, 48 Stunden, Varianten und Frachtherkunft deterministisch',()=>{
  const a=lauf(7,2,false),b=lauf(7,2,false);
  assert.deepEqual(a,b);
});
