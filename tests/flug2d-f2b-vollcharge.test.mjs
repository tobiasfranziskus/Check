// F2b: volle 50er-Eischarge, getrennte Original-W5n-Arbeit und Dockabnahme.
// Rule195/196/197 bleiben unabhaengig und ihre letzten Referenzen unveraendert.
import test from 'node:test';
import assert from 'node:assert/strict';
import F2b from '../prototypes/flug2d/f2b-vollcharge.js';
import F2a from '../prototypes/flug2d/f2a-eis-pendel.js';
import F1 from '../prototypes/flug2d/f1-kopplung.js';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const START=Object.freeze({carrierCash:2000,buyerCash:4000});
const seeds=[42,7,3301,1,2,3,5,11,19,101,202,777,123456];
const total=s=>Object.values(s.owners).reduce((x,v)=>x+v.cash,0);
function mission(owner='npc3',seed=3301) {
  const f=F2b.erstellen(START),s=f.createState(seed);
  if(owner==='house')
    assert.equal(f.execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'}).ok,true);
  const sh=Object.values(s.ships).find(x=>x.owner===owner&&x.klasse==='miner');
  assert.ok(sh,owner+' miner fehlt');
  const start=f.start(s,owner,sh.id);
  assert.equal(start.ok,true);
  assert.deepEqual(start.finanziert,{arbeit:100,ankauf:250});
  return {f,s,sh};
}
function runToEnd(f,s,sh,max=5000) {
  let n=0;while(s.f2a.missionen[sh.id].status!=='fertig'&&n<max){f.teilschritt(s);n++}
  assert.equal(s.f2a.missionen[sh.id].status,'fertig');
  return n;
}
function delivered(f,s,sh,expectedHash) {
  const m=s.f2a.missionen[sh.id];
  assert.equal(m.menge,50);
  assert.equal(m.verkauft,50);
  assert.equal(m.status,'fertig');
  assert.equal(sh.flug.lage,'angedockt');
  assert.equal(sh.ladung.eis||0,0);
  assert.equal(s.w5n.eisAbgebaut,50);
  assert.equal(s.w5n.mineVerkauft,50);
  assert.equal(s.w5n.mineVerkaufWert,250);
  assert.equal(s.w5n.mineLohn,100);
  assert.equal(s.w5n.mineMinuten,50);
  assert.equal(s.stations.st_aldera.lager.eis,50);
  assert.equal(s.ledger.eis.mined,50);
  assert.equal(s.minted,0);
  assert.equal(s.burned,0);
  assert.equal(total(s),33000);
  assert.equal(s.tick,70);
  assert.equal(s.flug.schritt,26);
  assert.equal(f.audit(s).ok,true);
  if(expectedHash)assert.equal(f.hash(s),expectedHash);
}
test('F2b: reines Opt-in Rule198, F1/197 dürfen das Core-Flag nicht aktivieren',()=>{
  const f=F2b.erstellen(START),f2a=F2a.erstellen(START),f1=F1.erstellen(START);
  assert.equal(f.rules.rulesVersion,198);
  assert.equal(f.rules.w5n.charge,50);
  assert.equal(f.rules.w5n.f2bDockOnly,true);
  assert.equal(f2a.rules.rulesVersion,197);
  assert.equal(f2a.rules.w5n.f2bDockOnly,undefined);
  assert.equal(f1.rules.rulesVersion,196);
  assert.equal(f1.rules.w5n.f2bDockOnly,undefined);
  assert.throws(()=>F1.erstellen(START,{researchProfile:198}),/F1: /);
  assert.throws(()=>F1.erstellen(START,{researchProfile:197,dockOnlyIce:true}),/F1: /);
  assert.throws(()=>F1.erstellen(START,{dockOnlyIce:true}),/F1: /);
  const state=f.createState(3301);
  assert.throws(()=>f1.load(f.save(state)),/fremde Regelversion/);
  assert.throws(()=>f2a.load(f.save(state)),/fremde Regelversion/);
  const old=Original.createPrivateWageResearch(START);
  assert.throws(()=>old.core.loadW5(f.save(state)),/inkompatibel/);
  assert.equal(total(state),33000);
});

test('F2b: volle 50 werden im Eisfeld real erarbeitet und bis zum Dock nicht verkauft',()=>{
  const {f,s,sh}=mission(),cash=s.owners.npc3.cash;
  let mining=0,steps=0;
  while(s.f2a.missionen[sh.id].status!=='fertig'&&steps<5000){
    const before=s.ledger.eis.mined,stage=s.f2a.missionen[sh.id].status;
    f.teilschritt(s);steps++;
    if(s.ledger.eis.mined>before){
      mining++;
      assert.equal(f.flugKern.imFeld(sh,'eis'),true,'Produktion nur am echten Eisfeld');
    }
    if(s.f2a.missionen[sh.id].status!=='fertig') {
      assert.equal(s.w5n.mineVerkauft,0,'keine automatische Fernabnahme bei 50');
      assert.equal(s.stations.st_aldera.lager.eis,0);
    }
    if(stage==='rueck') {
      assert.equal(s.w5n.eisAbgebaut,50);
      assert.equal(s.w5n.mineLohn,100);
    }
  }
  assert.equal(steps,4226);
  assert.equal(mining,50);
  assert.equal(s.owners.npc3.cash,cash-100+250);
  delivered(f,s,sh,'7be9ef8c7d66d847');
});

test('F2b: Spieler kauft echte 600-ISK-Hülle, fördert 50 Eis und erhält 250 ISK erst am Dock',()=>{
  const {f,s,sh}=mission('house');
  const steps=runToEnd(f,s,sh);
  assert.equal(steps,4226);
  assert.equal(s.owners.house.cash,3000-600-100+250);
  delivered(f,s,sh,'187300eeaeb8029b');
});

test('F2b: Save/Load nach Feldförderung und mitten im Rückflug bitgleich',()=>{
  const {f,s,sh}=mission();
  f.fliegen(s,2500);
  assert.equal(s.f2a.missionen[sh.id].status,'abbau');
  const originalSave=f.save(s),copy=f.load(originalSave);
  assert.equal(f.canonical(copy),originalSave);
  f.fliegen(s,1300);f.fliegen(copy,1300);
  assert.equal(s.f2a.missionen[sh.id].status,'rueck');
  assert.equal(f.canonical(s),f.canonical(copy));
  const back=f.load(f.save(s));
  for(const x of [s,copy,back])f.fliegen(x,426);
  for(const x of [s,copy,back])delivered(f,x,x.ships[sh.id],'7be9ef8c7d66d847');
  assert.equal(f.canonical(s),f.canonical(back));
  assert.equal(f.canonical(s),f.canonical(copy));
});

test('F2b: unerlaubte Abnahme, fremder Besitzer und gefälschte Dock-Saves blockiert',()=>{
  const {f,s,sh}=mission();
  const stable=f.canonical(s);
  for(const cmd of [
    {type:'shipSellIce',owner:sh.owner,schiff:sh.id,menge:50},
    {type:'shipMine',owner:sh.owner,schiff:sh.id,ware:'eis'},
    {type:'shipDock',owner:sh.owner,schiff:sh.id,station:'st_aldera'},
    {type:'shipWait',owner:sh.owner,schiff:sh.id},
  ]){
    assert.equal(f.execute(s,cmd).ok,false);
    assert.equal(f.submit(s,cmd).ok,false);
    assert.equal(f.canonical(s),stable);
  }
  const wrong=JSON.parse(f.save(s));wrong.f2a.missionen[sh.id].status='abnahme';
  assert.throws(()=>f.load(JSON.stringify(wrong)));
  const illegal=JSON.parse(f.save(s));illegal.ships[sh.id].ladung.eis=50;
  assert.throws(()=>f.load(JSON.stringify(illegal)));
  const foreign=JSON.parse(f.save(s));foreign.rulesVersion=197;
  assert.throws(()=>f.load(JSON.stringify(foreign)),/fremde Regelversion/);
  assert.equal(f.audit(s).ok,true);
});

test('F2a / Rule197: alte 48er-Referenz trotz Core-F2b-Hook bitgleich',()=>{
  const f=F2a.erstellen(START),s=f.createState(3301),sh=s.ships.sh001;
  assert.equal(f.start(s,sh.owner,sh.id).ok,true);
  assert.equal(runToEnd(f,s,sh),4106);
  assert.equal(f.hash(s),'1f478521b3490907');
  assert.equal(s.w5n.mineVerkauft,48);
  assert.equal(f.audit(s).ok,true);
});

test('Rule195: Original-Core verkauft ohne Opt-in weiterhin automatisch bei 50',()=>{
  const e=Original.createPrivateWageResearch(START),s=e.core.createW5State(3301);
  const sh=s.ships.sh001;
  const result=e.core.execute(s,{type:'shipMine',owner:sh.owner,schiff:sh.id,ware:'eis'},e.rules);
  assert.equal(result.ok,true);
  e.core.advance(s,50,e.rules);
  assert.equal(s.w5n.eisAbgebaut,50);
  assert.equal(s.w5n.mineVerkauft,50);
  assert.equal(s.stations.st_aldera.lager.eis,50);
  assert.equal(e.core.audit(s).ok,true);
});

test('F2b: 13 deterministische Saatwelten, 50 bezahlte Einheiten und kein Mint',()=>{
  for(const seed of seeds){
    const {f,s,sh}=mission('npc3',seed);
    const steps=runToEnd(f,s,sh);
    assert.equal(steps,4226,'Seed '+seed);
    delivered(f,s,sh);
    const restored=f.load(f.save(s));
    assert.equal(f.canonical(restored),f.canonical(s));
  }
});
