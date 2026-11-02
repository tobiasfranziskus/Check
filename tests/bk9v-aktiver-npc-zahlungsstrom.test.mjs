// B-K9v – Zahlungsstrom im AKTIVEN Original-Core. Nur testseitige Instrumentierung.
// Weder Preis-/Lohn-/Rezeptregeln noch Save/State, Emissionen oder Zuschüsse werden geändert.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const quelle=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const buchungen=[];
let inj=quelle;
function einfuegen(anker,zusatz){
  assert.equal(inj.split(anker).length,2,'instrumentierter Core-Anker eindeutig: '+anker.slice(0,60));
  inj=inj.replace(anker,anker+'\n'+zusatz);
}
// Handelszahlungen: Station/Schiff + gesonderte Gebühr mit eigenem Empfänger.
einfuegen("  buche(state, schiff.owner, 'kosten', fee);",
  "  __log.push({art:'handel',tick:state.tick,station,schiff:schiff.id,owner:schiff.owner,ware,menge,kauf,wert,fee,empfaenger});");
// Vertraglich wirklich ausgezahlte Fabrikarbeit – nie nur Reservierung.
einfuegen("            buche(state, 'hh_' + id, 'erloes', betrag);",
  "            __log.push({art:'lohn',tick:state.tick,von:id,an:'hh_'+id,betrag});");
// Endverbrauch bei Kauf – nicht Verbrauch von Altware.
einfuegen("          buche(state, id, 'erloes', geld);",
  "          __log.push({art:'haushalt',tick:state.tick,von:'hh_'+id,an:id,betrag:geld,menge:neuKauf});");
// Tatsächlich gezahlte (nicht bloß angefallene) normale Stundenkosten.
einfuegen("    besitzer.cash -= n;",
  "    __log.push({art:'betrieb',tick:state.tick,von:s.owner,an:w.senkeBesitzer.includes(s.owner)?null:fondsIn(rules,system),betrag:n,klasse:s.klasse,schiff:s.id,soll:kosten});");
// Aus bezahlter Frachterreserve abgerechnete Flugstunden.
const flugMarker="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (s.phase === 'dock') {";
assert.equal(inj.split(flugMarker).length,2,'nur der normale Flugabschluss');
inj=inj.replace(flugMarker,
  "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
  "    __log.push({art:'flug',tick:state.tick,von:s.owner,an:v.empfaenger,betrag:kosten,schiff:s.id});\n"+
  "  }\n  if (s.phase === 'dock') {");
// Bisherige Sonderzuschüsse bei leerer Sollflotte.
const zuschussMarker="  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n; return n;";
assert.equal(inj.split(zuschussMarker).length,2,'Zuschusspfad eindeutig');
inj=inj.replace(zuschussMarker,
  "  f.cash -= n; state.owners[owner].cash += n; state.stats.zuschuss += n;\n"+
  "  __log.push({art:'flottenzuschuss',tick:state.tick,von:fondsIn(rules,state.stations[rules.world.werft].system),an:owner,betrag:n});\n"+
  "  return n;");
// Tatsächliche NPC-Abgabe an Fonds.
einfuegen("    o[id].cash -= n; o[ziel].cash += n;",
  "    __log.push({art:'npcAbgabe',tick:state.tick,von:id,an:ziel,betrag:n});");
// Die beiden Fonds-Rückflussarten sind echte Transfers, keine Emissionen.
einfuegen("    f.cash -= n; o[id].cash += n;",
  "    __log.push({art:'fondsMinimum',tick:state.tick,von:fondsIn(rules,state.stations[id].system),an:id,betrag:n});");
const fondsAlt="    o[arm].cash += f.cash - w.fondsObergrenze; f.cash = w.fondsObergrenze;";
assert.equal(inj.split(fondsAlt).length,2);
inj=inj.replace(fondsAlt,
  "    const rueckfluss = f.cash - w.fondsObergrenze;\n"+
  "    __log.push({art:'fondsUeberschuss',tick:state.tick,von:systemFonds,an:arm,betrag:rueckfluss});\n"+
  fondsAlt.replace("o[arm].cash","o[arm].cash"));
// Der Instrumentierungskontext erhält nur die aktuelle Fonds-ID, kein neues Core-Feld.
const marker="    const f = o[fondsIn(rules, system)];";
assert.equal(inj.split(marker).length,2);
inj=inj.replace(marker,marker+"\n    const systemFonds = fondsIn(rules, system);");
einfuegen("    state.owners[id].cash -= n; state.owners[spieler].cash += n;",
  "    __log.push({art:'dividende',tick:state.tick,von:id,an:spieler,betrag:n});");
// Verlusthandler benutzt den gleichen Beleg-/Buchungstext wie Stundenabrechnung:
// dessen gesonderte Instrumentierung erfolgt über eigenen strukturellen Anker.
const verlustBlock="    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n  }\n  if (!abschliessen(state, id))";
assert.equal(inj.split(verlustBlock).length,2);
inj=inj.replace(verlustBlock,
  "    m_core_handel.buche(state, s.owner, 'kosten', kosten);\n"+
  "    __log.push({art:'flugVerlust',tick:state.tick,von:s.owner,an:v.empfaenger,betrag:kosten,schiff:s.id});\n"+
  "  }\n  if (!abschliessen(state, id))");
// Sicherheits-Kopfgelder (minted) und Piratenkauf als gesonderte Zahlungsarten.
const bounty="      buche(state, g.owner, 'erloes', geld);";
einfuegen(bounty,"      __log.push({art:'kopfgeld',tick:state.tick,an:g.owner,betrag:geld});");
einfuegen("      buche(state, ziel.owner, 'erloes', geld);",
  "      __log.push({art:'kopfgeld',tick:state.tick,an:ziel.owner,betrag:geld});");
einfuegen("    buche(state, owner, 'kosten', p); buche(state, markt, 'erloes', p);",
  "    __log.push({art:'piratenErsatz',tick:state.tick,von:owner,an:markt,betrag:p});");
const {core,base,herkunft}=new Function('const __log=arguments[0];\n'+inj+
  ';return {core:m_core_index,base:m_data_rules.RULES,herkunft:m_core_herkunft};')(buchungen);
const unberuehrt=new Function(quelle+';return m_core_index;')();
const moneyKinds=['handel','lohn','haushalt','betrieb','flug','flugVerlust','flottenzuschuss',
  'npcAbgabe','fondsMinimum','fondsUeberschuss','dividende','kopfgeld','piratenErsatz'];
function rules(){
  return {...base,schema:9,rulesVersion:15,world:{...base.world,
    produktionslohnJeMinute:4,haushaltskaufNeu:true,
    mindeststand:0,fondsObergrenze:1_000_000_000}};
}
const actors=['npc1','npc2','npc3','st_cyris','hh_st_cyris'];
function summe(a){return a.reduce((n,x)=>n+x,0);}
function reserviert(s,id){return summe(Object.values(s.vertraege.eintraege)
  .filter(e=>e.status==='offen'&&e.zahlender===id).map(e=>e.rest));}
function vermoegen(s,id){return s.owners[id].cash+reserviert(s,id);}
function posten(e){
  if(e.art==='handel'){
    const zahlung=e.kauf
      ?{von:e.owner,an:e.station,betrag:e.wert}:{von:e.station,an:e.owner,betrag:e.wert};
    return [{...zahlung,art:'ware',unterart:e.ware},
      {von:e.owner,an:e.empfaenger,betrag:e.fee,art:'gebuehr',unterart:e.ware}];
  }
  if(e.art==='kopfgeld')return [{von:null,an:e.an,betrag:e.betrag,art:e.art}];
  return [{von:e.von,an:e.an,betrag:e.betrag,art:e.art}];
}
function verteil(eintraege){
  const delta={},proArt={};
  for(const ev of eintraege){
    assert(moneyKinds.includes(ev.art),'unbekannter Journaleintrag');
    for(const p of posten(ev)){
      assert(Number.isSafeInteger(p.betrag)&&p.betrag>=0,'Buchung muss ganzzahlig sein');
      if(!p.betrag)continue;
      if(p.von)delta[p.von]=(delta[p.von]||0)-p.betrag;
      if(p.an)delta[p.an]=(delta[p.an]||0)+p.betrag;
      const k=p.art==='ware'?p.art+':'+p.unterart:p.art;
      proArt[k]=(proArt[k]||0)+p.betrag;
    }
  }
  return {delta,proArt};
}
function audit(s,r){
  const frei=summe(Object.values(s.owners).map(o=>o.cash));
  const fest=summe(Object.values(s.vertraege.eintraege).map(e=>e.rest));
  assert.equal(frei+fest,s.initialSupply+s.minted-s.burned);
  assert(core.audit(s).ok,'Core-Geld-und-Waren');
  herkunft.pruefe(s);
  assert.equal(core.hash(core.load(core.save(s),undefined,r)),core.hash(s),'Save/Load');
}
function durchlauf(seed,tage,debug=true){
  const r=rules(),s=core.createState(seed,r),start=buchungen.length;
  const before=Object.fromEntries(actors.map(x=>[x,vermoegen(s,x)]));
  let laufende=before,offset=start, snapshots=[];
  let zuschuss=0,gekauftFrachter=0,gekauftMiner=0,ausgabenFahrt=0,rohEis=0;
  const nachAkteur=Object.fromEntries(actors.map(id=>[id,{}]));
  for(let t=1;t<=tage*1440;t++){
    core.step(s,r);
    if(t%60)continue;
    audit(s,r);
    // Journaleinträge werden ausschließlich ab dem letzten tatsächlich abgenommenen Stundengrenzwert benutzt.
    const eintraege=buchungen.slice(offset);offset=buchungen.length;
    const {delta,proArt}=verteil(eintraege);
    for(const ev of eintraege)for(const p of posten(ev)){
      const art=p.art==='ware'?'ware:'+p.unterart:p.art;
      for(const id of actors){
        const buch=nachAkteur[id];const x=buch[art] ||= {ein:0,aus:0};
        if(p.von===id)x.aus+=p.betrag;
        if(p.an===id)x.ein+=p.betrag;
      }
    }
    for(const id of actors){
      const neu=vermoegen(s,id),erwartet=laufende[id]+(delta[id]||0);
      assert.equal(neu,erwartet,
        'fehlende/doppelte Finanzierung '+id+' Seed'+seed+' Tick'+t+
        ' Delta '+JSON.stringify(proArt));
      laufende[id]=neu;
    }
    zuschuss+=proArt.flottenzuschuss||0;
    gekauftFrachter+=eintraege.filter(e=>e.art==='handel'&&e.kauf&&e.ware==='frachter').length;
    gekauftMiner+=eintraege.filter(e=>e.art==='handel'&&e.kauf&&e.ware==='miner').length;
    ausgabenFahrt+=(proArt.flug||0)+(proArt.flugVerlust||0);
    rohEis+=eintraege.filter(e=>e.art==='handel'&&!e.kauf&&e.ware==='eis')
      .reduce((z,e)=>z+e.wert,0);
    if(t%1440===0){
      const day=t/1440,hh=s.stats.haushaltskauf.st_cyris;
      const row={seed,day,stationISK:s.owners.st_cyris.cash,
        stationReserviert:reserviert(s,'st_cyris'),haushaltISK:s.owners.hh_st_cyris.cash,
        nahrungNeuBezahlt:hh.menge,nahrungNeuISK:hh.isk,nahrungNeuFehlend:hh.fehlend,
        npc1ISK:s.owners.npc1.cash,npc2ISK:s.owners.npc2.cash,npc3ISK:s.owners.npc3.cash,
        npc1Reserviert:reserviert(s,'npc1'),npc2Reserviert:reserviert(s,'npc2'),
        eisVerkaufWeltISK:rohEis,flugArbeitISK:ausgabenFahrt,
        schiffsKaufFrachter:gekauftFrachter,schiffsKaufMiner:gekauftMiner,
        flotteZuschussISK:zuschuss,statzuschuss:s.stats.zuschuss,
        minted:s.minted,burned:s.burned,
        frachterNPC:Object.values(s.ships).filter(x=>x.klasse==='frachter'&&['npc1','npc2'].includes(x.owner)).length};
      assert.equal(row.flotteZuschussISK,row.statzuschuss,'sämtliche alten Individualzuschüsse erfasst');
      assert.equal(s.owners.hh_st_cyris.cash,
        s.stats.konto.hh_st_cyris.erloes-hh.isk,'Haushaltslohn minus echten Kauf');
      snapshots.push(row);if(debug)console.log('B-K9v aktiv',JSON.stringify(row));
    }
  }
  if(debug)console.log('B-K9v Akteure',JSON.stringify({seed,nachAkteur}));
  return {snapshots,hash:core.hash(s),anzahlEvents:offset-start,
    actorEnd:laufende,nachAkteur};
}
test('B-K9v: Original-Core und Test-Journal sind bei 120 aktiven R15-Ticks zustandsidentisch',()=>{
  for(const seed of [42,7]){
    const r=rules(),a=core.createState(seed,r),b=unberuehrt.createState(seed,r);
    for(let i=0;i<120;i++){core.step(a,r);unberuehrt.step(b,r);}
    assert.equal(core.hash(a),unberuehrt.hash(b));
    assert.equal(core.save(a),unberuehrt.save(b));
    audit(a,r);
  }
});
test('B-K9v: zwei aktive NPC-Welten je fünf Tage mit Echtbuchungen/Haushalts- und Reserveaudit',()=>{
  for(const seed of [42,7]){
    const x=durchlauf(seed,5);
    assert.equal(x.snapshots.length,5);
    assert(x.anzahlEvents>0);
    assert(x.snapshots.at(-1).eisVerkaufWeltISK>0,'echter Eis-Erlös statt fiktiver Schätzung');
    assert.equal(x.snapshots.at(-1).flotteZuschussISK,seed===7?693:0,
      'Historischer Flottenrettungs-Transfer wird nicht still verschwiegen');
    const haushalt=x.nachAkteur.hh_st_cyris;
    assert((haushalt.lohn?.ein||0)>0 && (haushalt.haushalt?.aus||0)>0,
      'Haushaltskauf nur aus echtem Lohn');
    const npc1=x.nachAkteur.npc1;
    assert((npc1['ware:frachter']?.aus||0)>0,'echter Frachterersatz kostet ISK');
  }
});
test('B-K9v: deterministischer aktiver Seed42-Haushalt/Flotten-Replay über 2 Tage',()=>{
  const a=durchlauf(42,2,false),b=durchlauf(42,2,false);
  assert.equal(a.hash,b.hash);assert.deepEqual(a.snapshots,b.snapshots);
});
