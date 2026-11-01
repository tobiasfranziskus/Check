// B9i: Erweiterte, NICHTPRODUKTIVE Core-Instrumentierung (kein index.html-Patch).
// Verbindliche Einkaufs-/Verkaufs- und Warenbuchungswege bleiben die Originalfunktionen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const beg=html.indexOf('const m_data_systeme ='),end=html.indexOf('const m_data_oberflaeche =');
assert(beg>=0&&end>beg);
let src=html.slice(beg,end);
function change(oldText,newText){
  assert.equal(src.split(oldText).length,2,'B9i-Quellanker fehlt oder doppelt: '+oldText);
  src=src.replace(oldText,newText);
}

function createBridge(){
  const all=s=>Object.values(s.vertrag?.eintraege||{});
  const active=c=>c.status==='offen';
  const amount=x=>Number.isSafeInteger(x)&&x>=0;
  function freeCargo(s,ship,ware){
    if(!s.ships[ship])return 0;
    const locked=all(s).filter(x=>active(x)&&x.quelle==='schiff'&&x.schiff===ship&&x.ware===ware)
      .reduce((a,x)=>a+x.menge,0);
    return (s.ships[ship].ladung[ware]||0)-locked;
  }
  function freeStock(s,station,ware){
    if(!s.stations[station])return 0;
    const locked=all(s).filter(x=>active(x)&&x.quelle==='station'&&x.quellstation===station&&x.ware===ware)
      .reduce((a,x)=>a+x.menge,0);
    return (s.stations[station].lager[ware]||0)-locked;
  }
  function audit(s){
    if(s.vertrag===undefined)return 0; // Alter 8/14-Kern ohne Vertragsfelder.
    if(s.vertrag===null||typeof s.vertrag!=='object'||Array.isArray(s.vertrag)||
       !Number.isSafeInteger(s.vertrag.next)||s.vertrag.next<1||
       !s.vertrag.eintraege||typeof s.vertrag.eintraege!=='object'||
       Array.isArray(s.vertrag.eintraege))throw Error('Vertragsbuch ungueltig');
    let locked=0,maxId=0;
    const cargo={},stock={};
    for(const [key,c] of Object.entries(s.vertrag.eintraege)){
      if(!/^v[1-9][0-9]*$/.test(key)||!c||typeof c!=='object'||Array.isArray(c)||
         c.id!==key||!Number.isSafeInteger(Number(key.slice(1))))
         throw Error('Vertrags-ID ungueltig');
      maxId=Math.max(maxId,Number(key.slice(1)));
      if(!['offen','storniert','erfuellt'].includes(c.status)||
         !amount(c.escrow)||!amount(c.feeEscrow)||
         !Number.isSafeInteger(c.menge)||c.menge<=0||
         !Number.isSafeInteger(c.preis)||c.preis<=0||
         !amount(c.fee)||typeof c.ware!=='string'||
         !['schiff','station'].includes(c.quelle)||
         typeof c.kaeufer!=='string'||!s.stations[c.kaeufer]||
         typeof c.verkaeufer!=='string'||!s.owners[c.verkaeufer]||
         typeof c.schiff!=='string'||!s.owners[c.kaeufer])
         throw Error('Vertrag ungueltig');
      if(active(c)){
        if(!s.ships[c.schiff]||s.ships[c.schiff].owner!==c.verkaeufer||
           c.escrow!==c.menge*c.preis||!Number.isSafeInteger(c.escrow)||
           c.feeEscrow!==c.fee)
           throw Error('Vertragsreferenz/Betrag ungueltig');
        locked+=c.escrow+c.feeEscrow;
        if(c.quelle==='station'){
          const k=c.quellstation+'|'+c.ware;
          stock[k]=(stock[k]||0)+c.menge;
        }else if(c.quelle==='schiff'){
          const k=c.schiff+'|'+c.ware;
          cargo[k]=(cargo[k]||0)+c.menge;
        }else throw Error('Vertragsquelle ungueltig');
      }else if(c.escrow||c.feeEscrow)throw Error('Doppelte Schlussabrechnung');
      if(c.quelle==='station'&&(!s.stations[c.quellstation]||
          typeof c.quellstation!=='string'))throw Error('Quellstation fehlt');
    }
    if(maxId>=s.vertrag.next)throw Error('Vertragszaehler inkonsistent');
    for(const k of Object.keys(stock)){
      const c=all(s).find(x=>active(x)&&x.quelle==='station'&&x.quellstation+'|'+x.ware===k);
      if(!c||!s.stations[c.quellstation]||
         s.stations[c.quellstation].lager[c.ware]<stock[k])throw Error('Stationsware ueberreserviert');
    }
    for(const k of Object.keys(cargo)){
      const c=all(s).find(x=>active(x)&&x.quelle==='schiff'&&x.schiff+'|'+x.ware===k);
      if(!c||s.ships[c.schiff].ladung[c.ware]<cargo[k])throw Error('Fracht ueberreserviert');
    }
    const cash=Object.values(s.owners).reduce((a,o)=>{
      if(!amount(o.cash))throw Error('negative/ungueltige Kasse');
      return a+o.cash;
    },0);
    if(cash+locked!==s.initialSupply+s.minted-s.burned)throw Error('Treuhandgeld nicht gedeckt');
    return locked;
  }
  function reserve(s,r,ship,buyer,ware,qty,source=null){
    const sh=s.ships[ship],b=s.owners[buyer];
    if(!sh||!b||!s.stations[buyer]||sh.owner===buyer||!Number.isSafeInteger(qty)||
       qty<=0||!Object.hasOwn(r.economy.waren,ware))return null;
    if(source===null){
      if(freeCargo(s,ship,ware)<qty)return null;
    }else{
      if(!s.stations[source]||s.stations[source].system!==sh.system||
         freeStock(s,source,ware)-m_core_handel.reserve(r,source,ware)<qty)return null;
    }
    const price=m_core_preis.preis(s,buyer,ware,r),value=qty*price;
    const fee=m_core_handel.gebuehr(s,r,buyer,value);
    if(price<=0||!amount(value)||!amount(fee)||!value||
       b.cash<value||s.owners[sh.owner].cash<fee)return null;
    const book=s.vertrag||(s.vertrag={next:1,eintraege:{}});
    const id='v'+book.next++;
    b.cash-=value;s.owners[sh.owner].cash-=fee;
    book.eintraege[id]={id,status:'offen',schiff:ship,verkaeufer:sh.owner,kaeufer:buyer,ware,menge:qty,
      quellstation:source,quelle:source===null?'schiff':'station',preis:price,fee,
      escrow:value,feeEscrow:fee};
    audit(s);return id;
  }
  function cancel(s,id){
    const c=s.vertrag?.eintraege[id];
    if(!c||!active(c))return false;
    s.owners[c.kaeufer].cash+=c.escrow;
    s.owners[c.verkaeufer].cash+=c.feeEscrow;
    c.escrow=0;c.feeEscrow=0;c.status='storniert';
    audit(s);return true;
  }
  function lost(s,ship){
    for(const c of all(s).filter(c=>active(c)&&c.schiff===ship))cancel(s,c.id);
  }
  function pickup(s,r,id){
    const c=s.vertrag?.eintraege[id],ship=c&&s.ships[c.schiff];
    if(!c||!active(c)||c.quelle!=='station'||!ship||ship.phase!=='dock'||
       ship.system!==s.stations[c.quellstation].system)return false;
    c.quelle='abholung';
    const ok=m_core_handel.handel(s,r,ship,c.quellstation,c.ware,c.menge,true);
    c.quelle=ok?'schiff':'station';
    audit(s);return ok;
  }
  function deliver(s,r,id){
    const c=s.vertrag?.eintraege[id],ship=c&&s.ships[c.schiff];
    if(!c||!active(c)||c.quelle!=='schiff'||!ship||ship.phase!=='dock'||
       ship.system!==s.stations[c.kaeufer].system)return false;
    const value=c.escrow,fee=c.feeEscrow;
    // Freigabe NUR waehrend synchroner Original-Handelsbuchung.
    s.owners[c.kaeufer].cash+=value;
    s.owners[c.verkaeufer].cash+=fee;
    c.status='abwicklung';c.escrow=0;c.feeEscrow=0;
    const ok=m_core_handel.handel(s,r,ship,c.kaeufer,c.ware,c.menge,false,false,{id});
    if(ok)c.status='erfuellt';
    else{
      s.owners[c.kaeufer].cash-=value;s.owners[c.verkaeufer].cash-=fee;
      c.status='offen';c.escrow=value;c.feeEscrow=fee;
    }
    audit(s);return ok;
  }
  return {audit,freeCargo,freeStock,reserve,cancel,lost,pickup,deliver};
}

change('const m_core_handel = (() => {',
  'const m_core_vertrag=('+createBridge.toString()+')();\nconst m_core_handel = (() => {');
change('function handel(state, rules, schiff, station, ware, menge, kauf, freigestellt = false) {',
  'function handel(state, rules, schiff, station, ware, menge, kauf, freigestellt = false, fix = null) {');
change('  if (!Number.isSafeInteger(menge) || menge <= 0) return false;\n  const p = preis(state, station, ware, rules);',
  "  if (!Number.isSafeInteger(menge) || menge <= 0) return false;\n  const c = fix && state.vertrag?.eintraege[fix.id];\n  if (fix && (!c || c.status!=='abwicklung' || kauf || c.schiff!==schiff.id || c.kaeufer!==station || c.ware!==ware || c.menge!==menge)) return false;\n  const p = fix ? c.preis : preis(state, station, ware, rules);");
change('  const fee = gebuehr(state, rules, station, wert);',
  '  const fee = fix ? c.fee : gebuehr(state, rules, station, wert);');
change('  if (!reicht) return false;',
  '  if (!reicht) return false;\n  if (state.vertrag && (kauf ? m_core_vertrag.freeStock(state,station,ware)<menge : m_core_vertrag.freeCargo(state,schiff.id,ware)<menge)) return false;\n  if (state.vertrag && !kauf && !fix && besitzer.cash < fee) return false;');
change('function entfernen(state, rules, s) {',
  'function entfernen(state, rules, s) {\n  m_core_vertrag.lost(state,s.id);');
change('function zerstoeren(state, rules, s) {',
  'function zerstoeren(state, rules, s) {\n  m_core_vertrag.lost(state,s.id);');
change('for (const o of Object.values(state.owners)) total += o.cash;',
  'for (const o of Object.values(state.owners)) total += o.cash;\n  for(const c of Object.values(state.vertrag?.eintraege||{}))total+=c.escrow+c.feeEscrow;');
change('const eingaben = ids(r.ein).every((w) => anzahl(st.lager, w) >= r.ein[w]);',
  'const eingaben = ids(r.ein).every((w) => m_core_vertrag.freeStock(state,id,w) >= r.ein[w]);');
change('const n = Math.min(da, bedarf[ware]);',
  'const n = Math.min(m_core_vertrag.freeStock(state,id,ware), bedarf[ware]);');
change('if (da < bedarf[ware]) state.stats.mangel[id][ware] += 1;',
  'if (n < bedarf[ware]) state.stats.mangel[id][ware] += 1;');
change('const d = div(cfg.ziel[ware] - da, rules.world.aussenhandelTeiler);',
  'const raw = div(cfg.ziel[ware] - da, rules.world.aussenhandelTeiler);\n      const d = raw<0?Math.max(raw,-m_core_vertrag.freeStock(state,id,ware)):raw;');
change("if (!Object.hasOwn(s.ladung, cmd.klasse) || s.ladung[cmd.klasse] < 1) return 'Schiff nicht im Frachtraum';",
  "if (m_core_vertrag.freeCargo(state,s.id,cmd.klasse)<1) return 'Schiff nicht frei im Frachtraum';");
change("if (anzahlLadung(s.ladung, cmd.modul) < 1) return 'Modul nicht im Frachtraum';",
  "if (m_core_vertrag.freeCargo(state,s.id,cmd.modul)<1) return 'Modul nicht frei im Frachtraum';");
change('return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };',
  'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, zerstoeren };');


// Simulierter, bewusst NOCH NICHT produktiver Versionssprung: Schema 8 -> 9
// speichert erstmalig Escrow; Regel 14 -> 15 kennzeichnet neue Buchungssemantik.
// Vorhandene Kernmigrationen 7->8 und Regel 11->14 bleiben erhalten.
function kandidatLaden(e,json){
  const raw=JSON.parse(json);
  if(raw&&raw.schema<9&&Object.hasOwn(raw,'vertrag'))
    throw Error('Vertragsdaten in Altschema nicht erlaubt');
  if(raw&&raw.schema===9&&raw.rulesVersion!==15)
    throw Error('Schema 9 erfordert Regel 15');
  const schema={...e.serialize.MIGRATIONS,8:s=>({
    ...s,schema:9,vertrag:{next:1,eintraege:{}}
  })};
  const rules={...e.serialize.RULE_MIGRATIONS,14:s=>({...s,rulesVersion:15})};
  const state=e.serialize.load(json,schema,9,15,rules);
  if(!state.vertrag)throw Error('Vertragsbuch im neuen Schema fehlt');
  e.bridge.audit(state);
  return state;
}
function kandidatStand(e,s){
  return kandidatLaden(e,e.core.save(s));
}
function run(modified){
  return new Function(modified+
    ';return {core:m_core_index,bridge:typeof m_core_vertrag==="undefined"?null:m_core_vertrag,rules:m_data_rules.RULES,serialize:m_core_serialize,destroy:m_core_sicherheit.zerstoeren,produktion:m_core_produktion.produktion,aussenhandel:m_core_stunde.aussenhandel,verbrauch:m_core_stunde.verbrauch};')();
}
function setup(){
  const e=run(src),s=e.core.createState(42,e.rules),ship=
    Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  ship.system='cyris';ship.phase='dock';ship.auftrag='halten';
  ship.ladung.material=12;s.ledger.material.imported+=12;
  assert(e.core.audit(s).ok);
  const fresh=kandidatStand(e,s);
  return {e,s:fresh,ship:fresh.ships[ship.id],buyer:'st_cyris'};
}
function verify(e,s){
  const held=e.bridge.audit(s);
  assert(e.core.audit(s).ok);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0)+held,
    s.initialSupply+s.minted-s.burned);
  const stocks={};
  for(const st of Object.values(s.stations))
    for(const [w,n] of Object.entries(st.lager))stocks[w]=(stocks[w]||0)+n;
  for(const sh of Object.values(s.ships))
    for(const [w,n] of Object.entries(sh.ladung))stocks[w]=(stocks[w]||0)+n;
  for(const [w,l] of Object.entries(s.ledger))
    assert.equal(stocks[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Warenaudit '+w);
}
test('B9i-1: ohne Vertragsaktivierung Original-Hash nach 1 Tag unveraendert',()=>{
  const a=run(html.slice(beg,end)),b=run(src);
  for(const seed of [7,42]){
    const x=a.core.createState(seed,a.rules),y=b.core.createState(seed,b.rules);
    a.core.advance(x,1440,a.rules);b.core.advance(y,1440,b.rules);
    assert.equal(a.core.hash(x),b.core.hash(y));verify(b,y);
  }
});
test('B9i-1: Geld inkl. Kaeufer- und Gebuehrenbindung nicht doppelt verfuegbar',()=>{
  const {e,s,ship,buyer}=setup();
  const buyerCash=s.owners[buyer].cash,sellerCash=s.owners.house.cash;
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  assert(id);
  const c=s.vertrag.eintraege[id];
  assert.equal(s.owners[buyer].cash,buyerCash-c.escrow);
  assert.equal(s.owners.house.cash,sellerCash-c.fee);
  const second=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  assert(second);
  assert.equal(e.bridge.reserve(s,e.rules,ship.id,buyer,'material',1),null);
  assert.equal(e.core.handel(s,e.rules,ship,buyer,'material',1,false),false);
  assert(e.bridge.cancel(s,id));assert(!e.bridge.cancel(s,id));
  assert(e.bridge.cancel(s,second));verify(e,s);
});
test('B9i-1: Warenreserve an Station trotz zivilem Verbrauch bleibt physisch gedeckt',()=>{
  const {e,s,ship}=setup();
  ship.ladung={};s.ledger.material.imported-=12;
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','nahrung',5,'st_cyris');
  assert(id);
  e.core.advance(s,60,e.rules);
  assert(s.stations.st_cyris.lager.nahrung>=5);
  assert.equal(e.bridge.freeStock(s,'st_cyris','nahrung'),
    s.stations.st_cyris.lager.nahrung-5);
  assert.equal(e.bridge.reserve(s,e.rules,ship.id,'st_aldera','nahrung',1000,'st_cyris'),null);
  assert(e.bridge.cancel(s,id));verify(e,s);
});
test('B9i-1/2: realer Einkauf aus Stationslager, Frachtbindung, fixer Weiterverkauf',()=>{
  const {e,s,ship}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','material',7,'st_cyris');
  assert(id);
  const before=s.stations.st_cyris.lager.material,beforeCash=s.owners.house.cash;
  assert(e.bridge.pickup(s,e.rules,id));
  assert.equal(s.stations.st_cyris.lager.material,before-7);
  assert(s.owners.house.cash<beforeCash,'Quellware real bezahlt');
  assert.equal(e.bridge.freeCargo(s,ship.id,'material'),12);
  ship.system='aldera'; // Nur Test-Setup; in echten Welten faehrt das Schiff!
  assert(e.bridge.deliver(s,e.rules,id));
  assert(!e.bridge.deliver(s,e.rules,id));
  verify(e,s);
});
test('B9i-2: geaenderte Spotpreise und Dockgebuehr aendern Vertrag nicht',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  assert(id);
  const c=s.vertrag.eintraege[id],value=c.escrow,fee=c.fee;
  const cashBuyer=s.owners[buyer].cash,cashSeller=s.owners.house.cash;
  s.stations[buyer].lager.material-=60;s.ledger.material.consumed+=60;
  s.stations[buyer].module.dock=1;
  assert.notEqual(e.core.preis(s,buyer,'material'),c.preis);
  assert.notEqual(e.core.gebuehr(s,e.rules,buyer,value),fee);
  assert(e.bridge.deliver(s,e.rules,id));
  assert.equal(s.owners[buyer].cash,cashBuyer);
  assert.equal(s.owners.house.cash,cashSeller+value);
  assert.equal(c.escrow,0);assert.equal(c.feeEscrow,0);
  assert(!e.bridge.cancel(s,id));verify(e,s);
});
test('B9i-2: fehlende Zielkapazitaet => keine halbe Zahlung, nur spaetere Abrechnung',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  const c=s.vertrag.eintraege[id],locked=c.escrow,fee=c.feeEscrow,cash=s.owners[buyer].cash;
  const max=e.core.obergrenze(s,e.rules,buyer,'material');
  const add=max-s.stations[buyer].lager.material;
  s.stations[buyer].lager.material+=add;s.ledger.material.imported+=add;
  assert.equal(e.bridge.deliver(s,e.rules,id),false);
  assert.equal(c.status,'offen');assert.equal(c.escrow,locked);
  assert.equal(c.feeEscrow,fee);assert.equal(s.owners[buyer].cash,cash);
  assert(e.bridge.cancel(s,id));verify(e,s);
});
test('B9i-1: echter Schiffsverlust storniert Lager- und Frachtbindung einmal',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  const cash=s.owners[buyer].cash,refund=s.vertrag.eintraege[id].escrow;
  const seller=s.owners.house.cash,fee=s.vertrag.eintraege[id].feeEscrow;
  e.destroy(s,e.rules,ship);
  assert(!s.ships[ship.id]);assert.equal(s.owners[buyer].cash,cash+refund);
  assert.equal(s.owners.house.cash,seller+fee);
  assert(!e.bridge.cancel(s,id));verify(e,s);
});
test('B9i-1/2: offenes Escrow ueberlebt Save/Load und deterministischen Abschluss',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  const copy=kandidatLaden(e,e.core.save(s));
  assert.equal(e.core.hash(s),e.core.hash(copy));verify(e,copy);
  assert(e.bridge.deliver(s,e.rules,id));assert(e.bridge.deliver(copy,e.rules,id));
  assert.equal(e.core.hash(s),e.core.hash(copy));verify(e,s);
});
test('B9i-1: manipulierte Kasse oder Warenbindung scheitert geschlossen',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  const corrupted=JSON.parse(e.core.save(s));
  corrupted.vertrag.eintraege[id].escrow++;
  assert.throws(()=>e.bridge.audit(corrupted),/Vertragsreferenz\/Betrag|Treuhandgeld/);
  const bad2=JSON.parse(e.core.save(s));
  bad2.ships[ship.id].ladung.material=1;
  assert.throws(()=>e.bridge.audit(bad2),/Fracht ueberreserviert/);
  verify(e,s);
});

test('B9i-1: Produktionsrezepte duerfen gesperrtes Stationsmaterial nicht verbrauchen',()=>{
  const {e,s,ship}=setup();
  ship.ladung={};s.ledger.material.imported-=12;
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','material',6,'st_cyris');
  assert(id);
  const old=s.stations.st_cyris.lager.material;
  const removed=old-6;
  s.stations.st_cyris.lager.material=6;s.ledger.material.consumed+=removed;
  e.produktion(s,e.rules);
  assert.equal(s.stations.st_cyris.lager.material,6);
  assert.equal(e.bridge.freeStock(s,'st_cyris','material'),0);
  verify(e,s);
});
test('B9i-1: neutraler Aussenhandel darf keine schon reservierte Stationsware exportieren',()=>{
  const {e,s,ship}=setup();
  ship.system='meridian';ship.ladung={};s.ledger.material.imported-=12;
  s.stations.st_meridian.lager.material+=150;s.ledger.material.imported+=150;
  // Kaufkraft nur per realem Transfer aus bestehender Sicherheitskasse auffuellen.
  s.owners.security.cash-=5000;s.owners.st_aldera.cash+=5000;
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','material',200,'st_meridian');
  assert(id);
  s.stations.st_meridian.lager.material=200;s.ledger.material.consumed+=50;
  e.aussenhandel(s,e.rules);
  assert.equal(s.stations.st_meridian.lager.material,200);
  assert.equal(e.bridge.freeStock(s,'st_meridian','material'),0);
  verify(e,s);
});
test('B9i-1: Schiffsaktivierung darf ausschliesslich freie Schiffsfracht verwenden',()=>{
  const {e,s,ship,buyer}=setup();
  ship.ladung.frachter=1;s.ledger.frachter.imported+=1;
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','frachter',1);
  assert(id);
  const cmd={type:'shipActivate',owner:ship.owner,schiff:ship.id,klasse:'frachter'};
  const denied=e.core.execute(s,cmd,e.rules);
  assert.equal(denied.ok,false);
  assert.match(denied.reason,/nicht frei im Frachtraum/);
  assert(e.bridge.cancel(s,id));
  const success=e.core.execute(s,cmd,e.rules);
  assert.equal(success.ok,true);
  verify(e,s);
});
test('B9i-2: Gebuehrenbetrag und Zahlungsziel entsprechen dem regulaeren Core-Buchungspfad',()=>{
  const {e,s,ship,buyer}=setup();
  const seller='house',fond='fonds_cyris';
  const buyerBefore=s.owners[buyer].cash,sellerBefore=s.owners[seller].cash;
  const fundBefore=s.owners[fond].cash;
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  assert(id);
  const {escrow,fee}=s.vertrag.eintraege[id];
  assert.equal(s.owners[buyer].cash,buyerBefore-escrow);
  assert.equal(s.owners[seller].cash,sellerBefore-fee);
  assert(e.bridge.deliver(s,e.rules,id));
  assert.equal(s.owners[seller].cash,sellerBefore+escrow-fee);
  assert.equal(s.owners[fond].cash,fundBefore+fee);
  assert.equal(s.owners[buyer].cash,buyerBefore-escrow);
  verify(e,s);
});


test('B9i: v14 Spielstand ohne Vertraege wird schema9/rule15 ohne Waren- oder Geldveraenderung migriert',()=>{
  const e=run(src),old=e.core.createState(42,e.rules);
  const oldSum=Object.values(old.owners).reduce((a,o)=>a+o.cash,0);
  const before=JSON.parse(e.core.save(old));
  const loaded=kandidatStand(e,old);
  assert.equal(loaded.schema,9);assert.equal(loaded.rulesVersion,15);
  assert.deepEqual(loaded.vertrag,{next:1,eintraege:{}});
  assert.deepEqual(loaded.owners,before.owners);
  assert.deepEqual(loaded.stations,before.stations);
  assert.deepEqual(loaded.ledger,before.ledger);
  assert.equal(Object.values(loaded.owners).reduce((a,o)=>a+o.cash,0),oldSum);
  verify(e,loaded);
  assert.equal(e.core.hash(kandidatLaden(e,e.core.save(loaded))),e.core.hash(loaded));
});
test('B9i: unterstützte ältere Schema-/Regelstände laufen durch originale Migrationskette',()=>{
  const e=run(src),s=e.core.createState(13,e.rules);
  const alt=JSON.parse(e.core.save(s));
  alt.schema=7;alt.rulesVersion=12;
  for(const st of Object.values(alt.stations))
    for(const line of st.linien)delete line.herkunft;
  for(const sh of Object.values(alt.ships))delete sh.sollplatz;
  const prev=JSON.stringify(alt);
  const up=kandidatLaden(e,prev);
  assert.equal(up.rulesVersion,15);assert.equal(up.schema,9);
  assert.equal(up.vertrag.next,1);
  assert.equal(JSON.stringify(alt),prev);
  verify(e,up);
});
test('B9i: Zukunftsversionen und eingeschmuggelte Verträge im Altschema werden abgewiesen',()=>{
  const e=run(src),s=e.core.createState(42,e.rules);
  const x=kandidatStand(e,s),future=JSON.parse(e.core.save(x));
  future.schema=10;
  assert.throws(()=>kandidatLaden(e,JSON.stringify(future)),/neuer/);
  future.schema=9;future.rulesVersion=16;
  assert.throws(()=>kandidatLaden(e,JSON.stringify(future)),/neuer|erfordert/);
  const smuggled=JSON.parse(e.core.save(s));
  smuggled.vertrag={next:1,eintraege:{}};
  assert.throws(()=>kandidatLaden(e,JSON.stringify(smuggled)),/Altschema/);
  assert.equal(e.core.hash(s),e.core.hash(e.core.createState(42,e.rules)));
});
test('B9i: aktiver Vertrag aus manipuliertem Spielstand wird VOR Übernahme abgewiesen',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',6);
  assert(id);
  const save=e.core.save(s),baseline=e.core.hash(s);
  const valid=kandidatLaden(e,save);
  assert.equal(e.core.hash(valid),baseline);
  const mutate=fn=>{
    const raw=JSON.parse(save);fn(raw);
    assert.throws(()=>kandidatLaden(e,JSON.stringify(raw)));
  };
  mutate(x=>{x.vertrag.eintraege[id].escrow+=1;});
  mutate(x=>{x.vertrag.eintraege[id].feeEscrow+=1;});
  mutate(x=>{x.vertrag.eintraege[id].verkaeufer='npc1';});
  mutate(x=>{x.vertrag.eintraege[id].id='v999';});
  mutate(x=>{x.vertrag.next=1;});
  mutate(x=>{x.vertrag.eintraege[id].status='erfuellt';});
  mutate(x=>{x.vertrag.eintraege[id].menge=100;});
  mutate(x=>{delete x.ships[ship.id];});
  mutate(x=>{x.owners.house.cash=-1;});
  assert.equal(e.core.hash(s),baseline,'Quelle nicht verändert');
});
test('B9i: gebundene Stationsware/aktive Fracht wird beim Laden gegen Überreservierung geprüft',()=>{
  const {e,s,ship}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,'st_aldera','material',7,'st_cyris');
  assert(id);
  const sav=e.core.save(s),broken=JSON.parse(sav);
  broken.stations.st_cyris.lager.material=1;
  assert.throws(()=>kandidatLaden(e,JSON.stringify(broken)),/ueberreserviert/);
  assert.equal(e.core.hash(kandidatLaden(e,sav)),e.core.hash(s));
  assert(e.bridge.pickup(s,e.rules,id));
  const after=e.core.save(s),brokenCargo=JSON.parse(after);
  brokenCargo.ships[ship.id].ladung.material=1;
  assert.throws(()=>kandidatLaden(e,JSON.stringify(brokenCargo)),/ueberreserviert/);
  assert.equal(e.core.hash(kandidatLaden(e,after)),e.core.hash(s));
});
test('B9i: zwei fortgesetzte Speicherstände liefern denselben Hash und identische Quittung',()=>{
  const {e,s,ship,buyer}=setup();
  const id=e.bridge.reserve(s,e.rules,ship.id,buyer,'material',5);
  const clone=kandidatLaden(e,e.core.save(s));
  assert(e.bridge.deliver(s,e.rules,id));
  assert(e.bridge.deliver(clone,e.rules,id));
  e.core.advance(s,60,e.rules);e.core.advance(clone,60,e.rules);
  assert.equal(e.core.hash(s),e.core.hash(clone));
  verify(e,s);
});
