// B9j – reine Testinstrumentierung. Weder index.html noch B9i wird veraendert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const b9i=fs.readFileSync(new URL('./b9i-vertragskern.test.mjs',import.meta.url),'utf8');
const a=b9i.indexOf('const html='),b=b9i.indexOf("test('B9i-1:");
assert(a>0&&b>a);
let prelude=b9i.slice(a,b).replace("new URL('../index.html',import.meta.url)",
                                 "new URL('../index.html',baseUrl)");
// B9j: Ein finanzierter Flug darf nicht durch einen direkten B9i-Storno
// seine Reise-Lohnreserve verlieren. Abbruch nur nach Ankunft oder Verlust.
const directCancel="if(!c||!active(c))return false;\n    s.owners[c.kaeufer].cash+=c.escrow;";
assert.equal(prelude.split(directCancel).length,2);
prelude=prelude.replace(directCancel,
 "if(!c||!active(c)||s.fahrten?.[id]?.status==='fahrt')return false;\n    s.owners[c.kaeufer].cash+=c.escrow;");
const env=new Function('fs','assert','baseUrl',prelude+
  ';return {src,run,kandidatLaden};')(fs,assert,import.meta.url);
let src=env.src;
function patch(a,b){
  assert.equal(src.split(a).length,2,'B9j Adapter-Anker eindeutig? '+a.slice(0,85));
  src=src.replace(a,b);
}
function fahrtKern(){
  const offen=(s)=>Object.values(s.vertrag?.eintraege||{}).filter(x=>x.status==='offen');
  const geld=(x)=>Number.isSafeInteger(x)&&x>=0;
  function pruefen(s){
    if(!s.fahrten)return true;
    for(const [id,f] of Object.entries(s.fahrten)){
      if(!f||!s.owners[f.konto]||!s.owners[f.besitzer]||!s.vertrag.eintraege[id]||
         !geld(f.arbeitskosten)||!geld(f.erstBudget)||!geld(f.quellKosten)||
         !['fahrt','beendet','abbruch'].includes(f.status))
         throw Error('B9j Budgetbezug defekt');
      const c=s.vertrag.eintraege[id],konto=s.owners[f.konto];
      if(f.status==='fahrt'&&(c.status!=='offen'||!s.ships[f.schiff]||
         c.schiff!==f.schiff||c.verkaeufer!==f.besitzer||
         !geld(konto.cash)||konto.cash+f.arbeitskosten!==f.erstBudget))
         throw Error('B9j Vorfinanzierung inkonsistent');
      if(f.status!=='fahrt'&&(konto.cash!==0||c.status==='offen'))
         throw Error('B9j Restbudget nicht abgeschlossen');
    }
    return true;
  }
  function arbeitsfreigabe(s,schiff,wert){
    const ticket=Object.values(s.fahrten||{}).find(f=>f.status==='fahrt'&&f.schiff===schiff);
    if(!ticket)return false;
    if(!geld(wert)||wert>s.owners[ticket.konto].cash)
      throw Error('B9j nicht finanzierte Arbeitsstunde');
    s.owners[ticket.konto].cash-=wert;
    s.owners[ticket.besitzer].cash+=wert;
    ticket.arbeitskosten+=wert;
    return true;
  }
  function beenden(s,schiff,reason){
    const ticket=Object.values(s.fahrten||{}).find(f=>f.status==='fahrt'&&f.schiff===schiff);
    if(!ticket)return false;
    const rest=s.owners[ticket.konto].cash;
    s.owners[ticket.konto].cash=0;
    s.owners[ticket.besitzer].cash+=rest;
    ticket.status=reason;
    return true;
  }
  function starten(s,r,schiff,kaeufer,ware,menge,quelle){
    const sh=s.ships[schiff],st=s.stations[quelle],ziel=s.stations[kaeufer];
    if(!sh||!st||!ziel||sh.klasse!=='frachter'||sh.phase!=='dock'||
       sh.auftrag!=='halten'||sh.arbeit!==0||sh.system!==st.system||
       Object.values(sh.ladung).some(n=>n>0)||
       offen(s).some(c=>c.schiff===schiff)||quelle===kaeufer||
       !Number.isSafeInteger(menge)||menge<=0||menge>r.economy.cargo)return null;
    const route=m_core_route.route(r.world,st.system,ziel.system);
    if(!route||route.zeit<=0)return null;
    const srcWert=menge*m_core_preis.preis(s,quelle,ware,r);
    const srcGebuehr=m_core_handel.gebuehr(s,r,quelle,srcWert);
    const destWert=menge*m_core_preis.preis(s,kaeufer,ware,r);
    const destGebuehr=m_core_handel.gebuehr(s,r,kaeufer,destWert);
    const reserveStunden=Math.ceil(route.zeit/r.economy.stunde)+1;
    const lohn=reserveStunden*r.world.betriebskosten[sh.klasse];
    const quellKosten=srcWert+srcGebuehr,gesamt=quellKosten+destGebuehr+lohn;
    if(!geld(quellKosten)||!geld(destGebuehr)||!geld(lohn)||!geld(gesamt)||
       srcWert<=0||destWert<=0||s.owners[sh.owner].cash<gesamt||
       s.owners[kaeufer].cash<destWert||
       m_core_vertrag.freeStock(s,quelle,ware)-m_core_handel.reserve(r,quelle,ware)<menge)
       return null;
    const id=m_core_vertrag.reserve(s,r,schiff,kaeufer,ware,menge,quelle);
    if(!id)return null;
    const konto='budget_'+id;
    if(s.owners[konto])throw Error('B9j Treuhand-ID bereits vergeben');
    s.owners[sh.owner].cash-=quellKosten+lohn;
    s.owners[konto]={cash:quellKosten+lohn,kind:'auftragsbudget'};
    s.fahrten||={};
    s.fahrten[id]={id,konto,schiff,besitzer:sh.owner,status:'fahrt',
      erstBudget:lohn,arbeitskosten:0,quellKosten,routeZeit:route.zeit};
    // Synchronous original source purchase, no provisional credit or price minting.
    s.owners[konto].cash-=quellKosten;
    s.owners[sh.owner].cash+=quellKosten;
    if(!m_core_vertrag.pickup(s,r,id)){
      s.owners[sh.owner].cash-=quellKosten;
      s.owners[konto].cash+=quellKosten;
      beenden(s,schiff,'abbruch');
      m_core_vertrag.cancel(s,id);
      return null;
    }
    sh.phase='reise';sh.ziel=kaeufer;sh.ankunft=s.tick+route.zeit;sh.warten=0;
    pruefen(s);m_core_vertrag.audit(s);return id;
  }
  function abschliessen(s,r,id){
    const ticket=s.fahrten?.[id],c=s.vertrag?.eintraege[id];
    if(!ticket||!c||ticket.status!=='fahrt'||!s.ships[ticket.schiff]||
       s.ships[ticket.schiff].arbeit!==0)return false;
    if(!m_core_vertrag.deliver(s,r,id))return false;
    beenden(s,ticket.schiff,'beendet');pruefen(s);
    return true;
  }
  function abbrechen(s,id){
    const f=s.fahrten?.[id],sh=f&&s.ships[f.schiff];
    if(!f||f.status!=='fahrt'||!sh||sh.phase!=='dock'||sh.arbeit!==0)return false;
    beenden(s,sh.id,'abbruch');
    return m_core_vertrag.cancel(s,id);
  }
  return {starten,pruefen,arbeitsfreigabe,beenden,abschliessen,abbrechen};
}
// Die Finanzierungs-Gates werden nur in dieser Kopie des Original-Cores eingeschaltet.
patch('function betriebskosten(state, rules) {\n  const w = rules.world;\n  for (const id of ids(state.ships)) {\n    const s = state.ships[id]; const arbeit = s.arbeit; s.arbeit = 0;',
      'function betriebskostenEinzeln(state,rules,s) {\n  const w=rules.world;\n  const arbeit=s.arbeit;s.arbeit=0;');
patch('    if (arbeit === 0) continue;', '    if (arbeit === 0) return;');
patch('    const besitzer = state.owners[s.owner];',
      '    const besitzer = state.owners[s.owner];\n    m_b9j_fahrt.arbeitsfreigabe(state,s.id,kosten);');
patch('    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) continue;', '    const n = Math.min(besitzer.cash, kosten);\n    if (n <= 0) return;');
patch('  }\n}\nfunction aussenhandel(state, rules) {',
      '}\nfunction betriebskosten(state,rules) {\n  for(const id of ids(state.ships))betriebskostenEinzeln(state,rules,state.ships[id]);\n}\nfunction aussenhandel(state, rules) {');
patch('return { verbrauch, betriebskosten, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag };',
      'return { verbrauch, betriebskosten, betriebskostenEinzeln, aussenhandel, npcAusgaben, fonds, dividende, wirksamerFreibetrag };');
patch('function entfernen(state, rules, s) {\n  m_core_vertrag.lost(state,s.id);',
      'function entfernen(state, rules, s) {\n  m_core_stunde.betriebskostenEinzeln(state,rules,s);\n  m_b9j_fahrt.beenden(state,s.id,"abbruch");\n  m_core_vertrag.lost(state,s.id);');
patch('function zerstoeren(state, rules, s) {\n  m_core_vertrag.lost(state,s.id);',
      'function zerstoeren(state, rules, s) {\n  m_core_stunde.betriebskostenEinzeln(state,rules,s);\n  m_b9j_fahrt.beenden(state,s.id,"abbruch");\n  m_core_vertrag.lost(state,s.id);');
src+='\nconst m_b9j_fahrt=('+fahrtKern.toString()+')();\n';
function run(modified=src){
  return new Function(modified+
    ';return {core:m_core_index,rules:m_data_rules.RULES,bridge:m_core_vertrag,'+
    'fahrt:m_b9j_fahrt,serialize:m_core_serialize,destroy:m_core_sicherheit.zerstoeren};')();
}
function setup(){
  const e=run(),old=e.core.createState(42,e.rules);
  const s=env.kandidatLaden(e,e.core.save(old));
  const ship=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  ship.system='cyris';ship.phase='dock';ship.auftrag='halten';
  assert(e.core.audit(s).ok);
  return {e,s,ship};
}
function audit(e,s){
  assert(e.fahrt.pruefen(s));
  assert.equal(e.bridge.audit(s)>=0,true);
  assert(e.core.audit(s).ok);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0)+
     Object.values(s.vertrag?.eintraege||{}).reduce((n,c)=>n+c.escrow+c.feeEscrow,0),
     s.initialSupply+s.minted-s.burned);
}
test('B9j: ohne Auftrag Seed7/42 unveraenderte 1440-tick Hashes',()=>{
  const a=env.run(env.src),b=run();
  for(const seed of [7,42]){
    const x=a.core.createState(seed,a.rules),y=b.core.createState(seed,b.rules);
    a.core.advance(x,1440,a.rules);b.core.advance(y,1440,b.rules);
    assert.equal(a.core.hash(x),b.core.hash(y));audit(b,y);
  }
});
test('B9j: ohne Verkaufskasse oder Einkaufskasse kein Start und kein Geldfluss',()=>{
  for(const owner of ['house','st_aldera']){
    const {e,s,ship}=setup(),money=s.owners[owner].cash;
    s.owners[owner].cash=0;s.owners.npc1.cash+=money;
    const before=e.core.hash(s);
    assert.equal(e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris'),null);
    assert.equal(e.core.hash(s),before);audit(e,s);
  }
});
test('B9j: Kauf, Gebuehr und Lohn gebunden, Original-Core zahlt trotz leerer freier Kasse',()=>{
  const {e,s,ship}=setup(),source=s.owners.st_cyris.cash;
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  const c=s.vertrag.eintraege[id],f=s.fahrten[id],budget=s.owners[f.konto];
  assert.equal(ship.phase,'reise');
  assert.equal(c.quelle,'schiff');
  assert(s.owners.st_cyris.cash>source);
  assert.equal(budget.cash,f.erstBudget);
  const rest=s.owners.house.cash;s.owners.house.cash=0;s.owners.npc1.cash+=rest;
  const ticks=Math.ceil((f.routeZeit+1)/e.rules.economy.stunde)*e.rules.economy.stunde;
  e.core.advance(s,ticks,e.rules);
  assert(s.ships[ship.id],'reale Fahrt beendet');
  assert.equal(s.ships[ship.id].phase,'dock');
  assert.equal(s.ships[ship.id].arbeit,0);
  assert(f.arbeitskosten>0,'Original-Kern hat Arbeit bezahlt');
  assert(budget.cash< f.erstBudget);
  assert(e.fahrt.abschliessen(s,e.rules,id));
  assert.equal(c.status,'erfuellt');
  assert.equal(budget.cash,0);
  assert(!e.fahrt.abschliessen(s,e.rules,id));
  audit(e,s);
});
test('B9j: zweite Belegung derselben Huelle wird atomar abgewiesen',()=>{
  const {e,s,ship}=setup();
  assert(e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris'));
  const before=e.core.hash(s);
  assert.equal(e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris'),null);
  assert.equal(e.core.hash(s),before);audit(e,s);
});
test('B9j: Abschuss zwischen zwei Stunden bezahlt geleistete Minuten und erstattet Rest',()=>{
  const {e,s,ship}=setup();
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  e.core.advance(s,23,e.rules);
  assert(s.ships[ship.id].arbeit>0);
  e.destroy(s,e.rules,ship);
  assert.equal(s.vertrag.eintraege[id].status,'storniert');
  assert(s.fahrten[id].arbeitskosten>0);
  assert.equal(s.owners[s.fahrten[id].konto].cash,0);
  assert(!e.fahrt.beenden(s,ship.id,'abbruch'));
  audit(e,s);
});
test('B9j: SaveLoad mit unterwegs gebundener Reserve deterministisch fortsetzbar',()=>{
  const {e,s,ship}=setup();
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  e.core.advance(s,30,e.rules);
  const twin=env.kandidatLaden(e,e.core.save(s));
  assert.equal(e.core.hash(s),e.core.hash(twin));
  const ticks=Math.ceil((s.fahrten[id].routeZeit+1)/60)*60-30;
  e.core.advance(s,ticks,e.rules);e.core.advance(twin,ticks,e.rules);
  assert.equal(e.core.hash(s),e.core.hash(twin));
  assert(e.fahrt.abschliessen(s,e.rules,id));
  assert(e.fahrt.abschliessen(twin,e.rules,id));
  assert.equal(e.core.hash(s),e.core.hash(twin));audit(e,s);
});
test('B9j: manipuliertes Budget erkannt, keine Doppelzahlung',()=>{
  const {e,s,ship}=setup();
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  const dup=JSON.parse(e.core.save(s));
  dup.owners[dup.fahrten[id].konto].cash++;
  assert.throws(()=>e.fahrt.pruefen(dup));
  assert.equal(e.fahrt.pruefen(s),true);
  audit(e,s);
});

test('B9j: freiwilliger Storno waehrend der Fahrt darf keinen ungedeckten Lohn erzeugen',()=>{
  const {e,s,ship}=setup();
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  const original=e.core.hash(s);
  assert.equal(e.bridge.cancel(s,id),false);
  assert.equal(e.fahrt.abbrechen(s,id),false);
  assert.equal(e.core.hash(s),original);
  const ticks=Math.ceil((s.fahrten[id].routeZeit+1)/60)*60;
  e.core.advance(s,ticks,e.rules);
  assert.equal(e.fahrt.abbrechen(s,id),true);
  assert.equal(s.vertrag.eintraege[id].status,'storniert');
  assert.equal(s.owners[s.fahrten[id].konto].cash,0);
  assert(!e.fahrt.abbrechen(s,id));
  audit(e,s);
});

test('B9j: auch ein NPC-Konzern zahlt Quellkauf, Lohn und Gebuehren selbst',()=>{
  const {e,s}=setup();
  const ship=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner!=='house'&&
    x.owner!==e.rules.world.piraten.owner);
  assert(ship,'mindestens ein NPC-Frachter');
  for(const [ware,n] of Object.entries(ship.ladung)){
    s.ledger[ware].consumed+=n;
    delete ship.ladung[ware];
  }
  ship.system='cyris';ship.phase='dock';ship.auftrag='halten';ship.arbeit=0;
  const owner=ship.owner;
  const move=Math.max(0,10000-s.owners[owner].cash);
  assert(s.owners.house.cash>=move);
  s.owners.house.cash-=move;s.owners[owner].cash+=move; // nur existierendes Geld
  const funds=s.owners[owner].cash;
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  assert(s.owners[owner].cash<funds);
  const hours=Math.ceil((s.fahrten[id].routeZeit+1)/60)*60;
  e.core.advance(s,hours,e.rules);
  assert(s.ships[ship.id]);
  assert(e.fahrt.abschliessen(s,e.rules,id));
  assert(s.fahrten[id].arbeitskosten>0);
  assert.equal(s.vertrag.eintraege[id].status,'erfuellt');
  audit(e,s);
});
test('B9j: nach Ausbuchung der Zielkasse bleibt vereinbarter Treuhandverkauf zahlbar',()=>{
  const {e,s,ship}=setup();
  const id=e.fahrt.starten(s,e.rules,ship.id,'st_aldera','material',5,'st_cyris');
  assert(id);
  const ticks=Math.ceil((s.fahrten[id].routeZeit+1)/60)*60;
  e.core.advance(s,ticks,e.rules);
  const remaining=s.owners.st_aldera.cash;
  s.owners.st_aldera.cash=0;s.owners.npc1.cash+=remaining;
  assert(e.fahrt.abschliessen(s,e.rules,id));
  assert.equal(s.vertrag.eintraege[id].status,'erfuellt');
  audit(e,s);
});
