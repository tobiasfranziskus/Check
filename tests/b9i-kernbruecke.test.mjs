// B9i [ANALYSE]: Instrumentiert nur zur Laufzeit den echten Core aus index.html.
// Weder index.html noch Regelversion, Spielstaende oder produktive Wirtschaft werden veraendert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('const m_data_systeme =');
const end=html.indexOf('const m_data_oberflaeche =');
assert(start>=0&&end>start,'Core-Modulgrenzen gefunden');
const original=html.slice(start,end);
function once(src,needle,patch){
  assert.equal(src.split(needle).length,2,'Anker fehlt/nicht eindeutig: '+needle);
  return src.replace(needle,patch);
}

// Test-only-Adapter: Realer Abzug aus der Kasse, explizite Treuhand und
// Frachtbindung in echten Schiffen, Core-Handel beim atomaren Abschluss.
function contractFactory(){
  const entries=s=>Object.values(s.vertraege?.eintraege||{});
  const active=c=>c.status==='offen';
  function freeCargo(s,ship,ware){
    const sh=s.ships[ship];
    if(!sh)return 0;
    const locked=entries(s).filter(c=>active(c)&&c.schiff===ship&&c.ware===ware)
      .reduce((n,c)=>n+c.menge,0);
    return (sh.ladung[ware]||0)-locked;
  }
  function audit(s){
    let escrow=0;
    const lock={};
    for(const c of entries(s)){
      if(!['offen','erfuellt','storniert'].includes(c.status))throw Error('Vertragsstatus ungueltig');
      if(!Number.isSafeInteger(c.escrow)||c.escrow<0)throw Error('Treuhandbetrag ungueltig');
      if(active(c)){
        if(!s.owners[c.kaeufer]||!s.ships[c.schiff])throw Error('Vertragsreferenz fehlt');
        if(!Number.isSafeInteger(c.menge)||c.menge<=0||c.escrow<=0)throw Error('Aktive Vertragsdaten ungueltig');
        const key=c.schiff+'/'+c.ware;
        lock[key]=(lock[key]||0)+c.menge;escrow+=c.escrow;
      }else if(c.escrow!==0)throw Error('Doppelte Treuhandzahlung');
    }
    for(const key of Object.keys(lock)){
      const c=entries(s).find(x=>active(x)&&x.schiff+'/'+x.ware===key);
      if(!c||(s.ships[c.schiff].ladung[c.ware]||0)<lock[key])throw Error('Reservierte Fracht fehlt');
    }
    const total=Object.values(s.owners).reduce((n,o)=>n+o.cash,0)+escrow;
    if(total!==s.initialSupply+s.minted-s.burned)throw Error('Vertrags-Geldbilanz verletzt');
    return escrow;
  }
  function reserve(s,r,ship,buyer,ware,qty){
    const sh=s.ships[ship],owner=s.owners[buyer];
    if(!sh||!owner||!s.stations[buyer]||sh.owner===buyer||
      !Number.isSafeInteger(qty)||qty<=0||!Object.hasOwn(r.economy.waren,ware))return null;
    const p=m_core_preis.preis(s,buyer,ware,r),value=p*qty;
    if(p<=0||!Number.isSafeInteger(value)||value<=0||
      owner.cash<value||freeCargo(s,ship,ware)<qty)return null;
    const v=s.vertraege||(s.vertraege={next:1,eintraege:{}});
    const id='v'+v.next++;
    owner.cash-=value;
    v.eintraege[id]={id,status:'offen',schiff:ship,kaeufer:buyer,ware,menge:qty,preis:p,escrow:value};
    audit(s);return id;
  }
  function cancel(s,id){
    const c=s.vertraege?.eintraege[id];
    if(!c||!active(c))return false;
    s.owners[c.kaeufer].cash+=c.escrow;c.escrow=0;c.status='storniert';
    audit(s);return true;
  }
  function lost(s,ship){
    for(const c of entries(s).filter(c=>active(c)&&c.schiff===ship))cancel(s,c.id);
  }
  function deliver(s,r,id){
    const c=s.vertraege?.eintraege[id],sh=c&&s.ships[c.schiff];
    if(!c||!active(c)||!sh||sh.phase!=='dock'||
      sh.system!==s.stations[c.kaeufer].system)return false;
    // Preisaenderungen nicht still als anders bepreisten Vertrag abrechnen.
    if(m_core_preis.preis(s,c.kaeufer,c.ware,r)!==c.preis)return false;
    const fee=m_core_handel.gebuehr(s,r,c.kaeufer,c.escrow);
    if(s.owners[sh.owner].cash<fee)return false;
    const value=c.escrow;
    // Synchroner Commit via ORIGINAL-handel; Fehlschlag setzt Treuhand zurueck.
    s.owners[c.kaeufer].cash+=value;c.escrow=0;c.status='erfuellt';
    if(!m_core_handel.handel(s,r,sh,c.kaeufer,c.ware,c.menge,false)){
      s.owners[c.kaeufer].cash-=value;c.escrow=value;c.status='offen';
      audit(s);return false;
    }
    audit(s);return true;
  }
  return {audit,freeCargo,reserve,cancel,lost,deliver};
}
let modified=once(original,'const m_core_handel = (() => {',
  'const m_core_vertraege=('+contractFactory.toString()+')();\nconst m_core_handel = (() => {');
modified=once(modified,'if (!reicht) return false;',
  'if (!reicht) return false;\n  if (!kauf && m_core_vertraege.freeCargo(state,schiff.id,ware)<menge) return false;');
modified=once(modified,'function entfernen(state, rules, s) {',
  'function entfernen(state, rules, s) {\n  m_core_vertraege.lost(state,s.id);');
modified=once(modified,'for (const o of Object.values(state.owners)) total += o.cash;',
  'for (const o of Object.values(state.owners)) total += o.cash;\n  for (const c of Object.values(state.vertraege?.eintraege||{})) total += c.escrow;');
modified=once(modified,'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen };',
  'return { patrouille, ueberfall, piratenErsatz, schutzgeld, escorteBewegen, zerstoeren };');

function engine(src){
  return new Function(src+';return {core:m_core_index,bridge:typeof m_core_vertraege==="undefined"?null:m_core_vertraege,rules:m_data_rules.RULES,destroy:m_core_sicherheit.zerstoeren};')();
}
function sample(){
  const e=engine(modified),s=e.core.createState(42,e.rules);
  const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
  assert(sh);
  sh.system='cyris';sh.phase='dock';sh.auftrag='halten';
  sh.ladung.material=12;s.ledger.material.imported+=12; // explizite Test-Einfuhr
  assert(e.core.audit(s).ok);
  return {e,s,sh,buyer:'st_cyris'};
}
function verify(e,s){
  const escrow=e.bridge.audit(s);
  assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0)+escrow,
    s.initialSupply+s.minted-s.burned);
  assert(e.core.audit(s).ok,'Core-Audit mit Treuhand');
  const found={};
  for(const st of Object.values(s.stations))
    for(const [w,n] of Object.entries(st.lager))found[w]=(found[w]||0)+n;
  for(const sh of Object.values(s.ships))
    for(const [w,n] of Object.entries(sh.ladung))found[w]=(found[w]||0)+n;
  for(const [w,l] of Object.entries(s.ledger))
    assert.equal(found[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
      'Unabhaengiger Warenaudit '+w);
}

test('B9i: ohne Vertraege Original- und instrumentierter Core hashgleich',()=>{
  const a=engine(original),b=engine(modified);
  for(const seed of [7,42]){
    const x=a.core.createState(seed,a.rules),y=b.core.createState(seed,b.rules);
    assert.equal(a.core.hash(x),b.core.hash(y));
    a.core.advance(x,1440,a.rules);b.core.advance(y,1440,b.rules);
    assert.equal(a.core.hash(x),b.core.hash(y),'Seed '+seed+' nach 1 Tag');
    assert(a.core.audit(x).ok);verify(b,y);
  }
});
test('B9i: reale Kassenbindung und Originalhandel sperrt fremde Frachtverkaeufe',()=>{
  const {e,s,sh,buyer}=sample(),cash=s.owners[buyer].cash,minted=s.minted;
  const a=e.bridge.reserve(s,e.rules,sh.id,buyer,'material',8);
  const b=e.bridge.reserve(s,e.rules,sh.id,buyer,'material',4);
  assert(a&&b);
  assert.equal(e.bridge.reserve(s,e.rules,sh.id,buyer,'material',1),null);
  assert.equal(s.owners[buyer].cash,cash-12*e.core.preis(s,buyer,'material'));
  assert.equal(e.core.handel(s,e.rules,sh,buyer,'material',1,false),false);
  verify(e,s);
  assert.equal(e.bridge.deliver(s,e.rules,a),true);
  assert.equal(e.bridge.deliver(s,e.rules,a),false,'kein doppelter Abschluss');
  assert.equal(sh.ladung.material,4);
  assert.equal(e.core.handel(s,e.rules,sh,buyer,'material',1,false),false);
  assert.equal(e.bridge.cancel(s,b),true);
  assert.equal(e.bridge.cancel(s,b),false,'keine doppelte Erstattung');
  assert.equal(s.minted,minted);verify(e,s);
});
test('B9i: offene Treuhand bleibt nach Save/Load deterministisch abrechenbar',()=>{
  const {e,s,sh,buyer}=sample();
  const id=e.bridge.reserve(s,e.rules,sh.id,buyer,'material',6);
  const copy=e.core.load(e.core.save(s),undefined,e.rules);
  assert.equal(e.core.hash(s),e.core.hash(copy));
  verify(e,copy);
  assert.equal(e.bridge.deliver(s,e.rules,id),true);
  assert.equal(e.bridge.deliver(copy,e.rules,id),true);
  assert.equal(e.core.hash(s),e.core.hash(copy));
  verify(e,s);verify(e,copy);
});
test('B9i: Preisabweichung stoppt Abschluss; Storno erstattet nur einmal',()=>{
  const {e,s,sh,buyer}=sample(),cash=s.owners[buyer].cash;
  const id=e.bridge.reserve(s,e.rules,sh.id,buyer,'material',6);
  const held=s.vertraege.eintraege[id].escrow;
  s.stations[buyer].lager.material-=60;s.ledger.material.consumed+=60;
  assert.notEqual(e.core.preis(s,buyer,'material'),s.vertraege.eintraege[id].preis);
  assert.equal(e.bridge.deliver(s,e.rules,id),false);
  assert.equal(s.vertraege.eintraege[id].escrow,held);
  assert.equal(e.bridge.cancel(s,id),true);
  assert.equal(e.bridge.cancel(s,id),false);
  assert.equal(s.owners[buyer].cash,cash);verify(e,s);
});
test('B9i: Schiffsverlust mit originaler Piratenbeute storniert Treuhand einmal',()=>{
  const {e,s,sh,buyer}=sample();
  sh.system='meridian';delete sh.ladung.material;s.ledger.material.imported-=12;
  sh.ladung.kristall=15;s.ledger.kristall.imported+=15;
  const id=e.bridge.reserve(s,e.rules,sh.id,buyer,'kristall',15);
  assert(id);
  const cash=s.owners[buyer].cash,held=s.vertraege.eintraege[id].escrow;
  e.destroy(s,e.rules,sh);
  assert(!s.ships[sh.id]);assert.equal(s.owners[buyer].cash,cash+held);
  assert.equal(e.bridge.cancel(s,id),false);
  assert.equal(s.vertraege.eintraege[id].status,'storniert');
  assert.equal(s.vertraege.eintraege[id].escrow,0);
  verify(e,s);
});
test('B9i: Altzustand bleibt kompatibel; manipulierte Treuhand wird erkannt',()=>{
  const e=engine(modified),s=e.core.createState(42,e.rules);
  assert.equal('vertraege' in s,false);
  assert.equal(e.core.hash(e.core.load(e.core.save(s),undefined,e.rules)),e.core.hash(s));
  const {e:x,s:y,sh,buyer}=sample();
  x.bridge.reserve(y,x.rules,sh.id,buyer,'material',6);
  const broken=JSON.parse(x.core.save(y));
  broken.vertraege.eintraege.v1.escrow++;
  assert.throws(()=>x.bridge.audit(broken),/Vertrags-Geldbilanz/);
  verify(x,y);
});
