// B-K9c: Produktausführung im expliziten Schema9/Regel15-Kandidaten.
// Das veröffentlichte Regel14-Spiel darf unverändert bleiben.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules,destroy}=new Function(source+
  ';return {core:m_core_index,rules:m_data_rules.RULES,destroy:m_core_sicherheit.zerstoeren};')();
const next={...rules,schema:9,rulesVersion:15};
const audit=s=>{
  assert(core.audit(s).ok);
  assert(core.vertragPruefen(s));
  assert.equal(Object.values(s.owners).reduce((a,x)=>a+x.cash,0)+
    Object.values(s.vertrag.eintraege).reduce((a,c)=>a+c.escrow+c.fee+c.lohn+c.huelle,0),
    s.initialSupply+s.minted-s.burned);
  const stock={};
  for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager))
    stock[w]=(stock[w]||0)+n;
  for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung))
    stock[w]=(stock[w]||0)+n;
  for(const [w,l] of Object.entries(s.ledger))
    assert.equal(stock[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w);
};
function fixture(seed=7){
  let s=core.createState(seed,rules);
  const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
  core.advance(s,4*1440,rules);
  s=core.load(core.save(s),undefined,next);
  assert.equal(s.schema,9);assert.equal(s.rulesVersion,15);
  const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&x.ware==='eis');
  const frachter=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='npc1');
  assert(miner&&frachter);
  for(const sh of [miner,frachter]){
    for(const [w,n] of Object.entries(sh.ladung))s.ledger[w].consumed+=n;
    sh.ladung={};sh.system='cyris';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;
    sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';
    sh.ware=sh.klasse==='miner'?'eis':null;sh.arbeit=0;
  }
  for(const sh of Object.values(s.ships))if(sh!==miner&&sh!==frachter){
    sh.auftrag='halten';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;sh.arbeit=0;
  }
  const a={quelle:'st_cyris',ziel:'st_aldera',miner:miner.id,frachter:frachter.id,
    menge:13,fabriklohn:39,ersatzFahrten:20};
  const quote=core.nahrungsmarktangebot(s,next,a);
  assert(quote.ok,JSON.stringify(quote.fehler));
  assert.equal(quote.endpreis,53);
  audit(s);
  return {s,a,quote,frachter};
}
test('BK9c: Schema8/Regel14 wird verlustfrei und ohne Geldänderung nach Schema9/Regel15 migriert',()=>{
  for(const seed of [7,42]){
    const original=core.createState(seed,rules),before=core.save(original);
    const up=core.load(before,undefined,next);
    assert.equal(up.vertrag.next,1);assert.deepEqual(up.vertrag.eintraege,{});
    assert.equal(up.schema,9);assert.equal(up.rulesVersion,15);audit(up);
    assert.equal(core.hash(up),core.hash(core.load(core.save(up),undefined,next)));
    assert.equal(core.save(original),before);
    assert.throws(()=>core.load(core.save(up)),/Schema 9 ist neuer/);
    assert.throws(()=>core.load(JSON.stringify({...original,vertrag:{next:1,eintraege:{}}}),undefined,next),
      /Altschema/);
    assert.throws(()=>core.load(JSON.stringify({...up,schema:10}),undefined,next),/neuer/);
  }
});
test('BK9c: 13 Nahrung zu echtem Zielpreis, vollständig gebundene Kassen, Originalarbeit und Ersatzreserve',()=>{
  const {s,a,quote,frachter}=fixture();
  const pre={source:s.stations.st_cyris.lager.nahrung,dest:s.stations.st_aldera.lager.nahrung,
    buy:s.owners.st_aldera.cash,trader:s.owners.npc1.cash,mint:s.minted};
  const id=core.vertragStarten(s,a,next);assert.equal(id,'v1');
  const c=s.vertrag.eintraege[id];
  assert.equal(c.status,'fahrt');assert.equal(c.escrow,689);
  assert.equal(c.lohn,250);assert.equal(c.huelle,39);
  assert.equal(frachter.ladung.nahrung,13);
  assert.equal(s.stations.st_cyris.lager.nahrung,pre.source-13);
  assert.equal(s.owners.st_aldera.cash,pre.buy-689);
  assert(!core.vertragStarten(s,a,next),'keine doppelte Schiffsbindung');
  const hash=core.hash(s);
  assert.equal(core.execute(s,{type:'shipTrade',owner:'npc1',schiff:frachter.id,
    ware:'nahrung',menge:1,kauf:false},next).ok,false);
  assert.equal(core.hash(s),hash);
  audit(s);
  core.advance(s,10,next);
  const replay=core.load(core.save(s),undefined,next);audit(replay);
  assert.equal(core.hash(s),core.hash(replay));
  core.advance(s,15,next);core.advance(replay,15,next);
  assert.equal(core.hash(s),core.hash(replay));audit(s);
  assert.equal(c.status,'geliefert');
  assert.equal(c.escrow,0);assert.equal(c.fee,0);
  assert.equal(s.stations.st_aldera.lager.nahrung,pre.dest+13);
  assert.equal(frachter.ladung.nahrung||0,0);
  assert.equal(s.owners.st_aldera.cash,pre.buy-689);
  assert.equal(frachter.arbeit,24);
  core.advance(s,35,next);core.advance(replay,35,next);
  assert.equal(core.hash(s),core.hash(replay));
  assert.equal(c.status,'erfuellt');assert.equal(c.lohnBezahlt,100);
  assert.equal(c.lohn,0);assert.equal(c.huelle,39);
  assert.equal(s.minted,pre.mint);
  assert.equal(core.vertragStornieren(s,id),false);
  audit(s);
  console.log('BK9C_ECHTER_VERTRAG '+JSON.stringify({
    schema:s.schema,regel:s.rulesVersion,id,originalWaren:13,
    originalZielpreis:53,buyerEscrow:689,fahrt:25,arbeitsminuten:24,
    bezahlterLohn:c.lohnBezahlt,unusedLohn:150,hullReserve:c.huelle,
    status:c.status,minting:s.minted-pre.mint,saveReplayIdentisch:true}));
});
test('BK9c: echte Käuferinsolvenz vor dem Start stoppt atomar, keine Buchung',()=>{
  const {s,a}=fixture();
  const amount=s.owners.st_aldera.cash;
  s.owners.st_aldera.cash=0;s.owners.house.cash+=amount;
  const before=core.hash(s);
  assert.equal(core.vertragStarten(s,a,next),null);
  assert.equal(core.hash(s),before);audit(s);
});
test('BK9c: Verlorene Hülle bezahlt bis dahin angefallene Arbeit, erstattet Käufer, hält Ersatzrücklage',()=>{
  const {s,a,frachter}=fixture();
  const buyer=s.owners.st_aldera.cash;
  const id=core.vertragStarten(s,a,next);assert(id);
  core.advance(s,23,next);
  const accrued=frachter.arbeit;
  assert.equal(accrued,23);
  destroy(s,next,frachter);
  const c=s.vertrag.eintraege[id];
  assert.equal(c.status,'verloren');
  assert.equal(c.escrow,0);assert.equal(c.fee,0);assert.equal(c.lohn,0);
  assert.equal(c.lohnBezahlt,Math.floor(250*accrued/60));
  assert.equal(s.owners.st_aldera.cash,buyer);
  assert.equal(c.huelle,39);
  assert(!s.ships[frachter.id]);
  assert(!core.vertragStornieren(s,id));
  audit(s);
});
test('BK9c: Zielstation voll → keine Doppelzahlung; Storno erst nach tatsächlich bezahlter Arbeit',()=>{
  const {s,a,frachter}=fixture();
  const buyer=s.owners.st_aldera.cash;
  const id=core.vertragStarten(s,a,next);assert(id);
  const limit=core.obergrenze(s,next,'st_aldera','nahrung');
  const before=s.stations.st_aldera.lager.nahrung;
  s.stations.st_aldera.lager.nahrung=limit;
  s.ledger.nahrung.imported+=limit-before;
  core.advance(s,25,next);
  assert.equal(s.vertrag.eintraege[id].status,'wartet');
  assert.equal(s.owners.st_aldera.cash,buyer-689);
  assert.equal(core.vertragStornieren(s,id),false,'24 Minuten Arbeit unbezahlt');
  core.advance(s,35,next);
  assert.equal(s.vertrag.eintraege[id].lohnBezahlt,100);
  assert(core.vertragStornieren(s,id));
  const c=s.vertrag.eintraege[id];
  assert.equal(c.status,'storniert');assert.equal(c.escrow,0);
  assert.equal(s.owners.st_aldera.cash,buyer);
  assert.equal(c.huelle,0);assert.equal(core.vertragStornieren(s,id),false);
  audit(s);
});
test('BK9c: Defekte Speicherreferenzen, falsche Treuhand und manipulierte Arbeitsrücklage abweisen',()=>{
  const {s,a}=fixture();assert(core.vertragStarten(s,a,next));
  const raw=JSON.parse(core.save(s));
  const mut=[
    x=>{x.vertrag.eintraege.v1.escrow++;},
    x=>{x.vertrag.eintraege.v1.lohn--;},
    x=>{x.vertrag.eintraege.v1.schiff='sh999999';},
    x=>{x.vertrag.eintraege.v1.kaeufer='gefälscht';},
    x=>{x.vertrag.next=1;},
    x=>{x.owners.npc1.cash=-1;},
    x=>{x.rulesVersion=16;}
  ];
  for(const change of mut){
    const x=JSON.parse(JSON.stringify(raw));change(x);
    assert.throws(()=>core.load(JSON.stringify(x),undefined,next));
  }
  assert.equal(core.hash(s),core.hash(core.load(core.save(s),undefined,next)));
  audit(s);
});
test('BK9c: In Regel14 bleiben Referenz-Hashes ohne Vertragsspur unverändert',()=>{
  for(const seed of [7,42]){
    const orig=core.createState(seed,rules);
    const copy=core.load(core.save(orig));
    core.advance(orig,1440,rules);core.advance(copy,1440,rules);
    assert.equal(core.hash(orig),core.hash(copy));
    assert(!Object.hasOwn(orig,'vertrag'));
  }
});
