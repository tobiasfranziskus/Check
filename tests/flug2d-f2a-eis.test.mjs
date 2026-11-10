// F2a Eis-Pendel: 48 echte, bezahlte Eis-Einheiten, physisch am Feld gewonnen,
// als F0-Fracht zur Station und erst NACH Andocken via ORIGINAL shipSellIce abgenommen.
import test from 'node:test';
import assert from 'node:assert/strict';
import F2 from '../prototypes/flug2d/f2a-eis-pendel.js';
import F1 from '../prototypes/flug2d/f1-kopplung.js';
import Original from '../prototypes/w5ac/rule191-w5-ferry-core.js';

const START={carrierCash:2000,buyerCash:4000};
const SEEDS=[42,7,3301,1,2,3,5,11,19,101,202,777,123456];
const geld=s=>Object.values(s.owners).reduce((sum,x)=>sum+x.cash,0);
const miner=(s,owner='npc3')=>Object.values(s.ships).find(x=>x.owner===owner&&x.klasse==='miner');
function neueWelt(seed=3301) {
  const f=F2.erstellen(START),s=f.createState(seed);
  assert.equal(f.audit(s).ok,true);
  return {f,s};
}
function bisFertig(f,s,id) {
  let n=0;
  while(s.f2a.missionen[id].status!=='fertig' && n<5000) {
    f.teilschritt(s);n++;
  }
  assert.equal(s.f2a.missionen[id].status,'fertig','Pendelauftrag muss am Dock ankommen');
  return n;
}

test('F2a: eigenständige Forschung197; weder alter F1- noch Produkt-Save wird übernommen',()=>{
  const {f,s}=neueWelt();
  const alt=F1.erstellen(START),original=Original.createPrivateWageResearch(START);
  assert.equal(f.rules.rulesVersion,197);
  assert.equal(F2.PROFIL,197);
  assert.equal(F2.CHARGE,48);
  assert.equal(s.initialSupply,33000);
  assert.equal(s.minted,0);
  assert.equal(s.burned,0);
  assert.equal(geld(s),33000);
  assert.equal(miner(s).auftrag,'halten','NPC beginnt ohne ungeprüfte Dock-Förderung');
  assert.throws(()=>alt.load(f.save(s)),/fremde Regelversion/);
  assert.throws(()=>f.load(alt.save(alt.createState(3301))),/fremde Regelversion/);
  assert.throws(()=>original.core.loadW5(f.save(s)),/inkompatibel/);
  assert.equal(f.canonical(f.load(f.save(s))),f.canonical(s));
});

test('F2a: 48 bezahlte Feld-Eis-Einheiten bleiben bis zum echten Andocken im Frachtraum',()=>{
  const {f,s}=neueWelt(),sh=miner(s),anfangCash=s.owners[sh.owner].cash;
  const start=f.start(s,sh.owner,sh.id);
  assert.deepEqual(start.finanziert,{arbeit:96,ankauf:240});
  assert.equal(start.ok,true);
  assert.equal(sh.phase,'flug');
  assert.equal(f.audit(s).ok,true);
  let firstField=null,lastField=null,lastStage='';
  let steps=0;
  while(s.f2a.missionen[sh.id].status!=='fertig'&&steps<5000) {
    const m=s.f2a.missionen[sh.id],prior=s.ledger.eis.mined;
    const previousStock=s.stations.st_aldera.lager.eis;
    f.teilschritt(s);
    if(s.ledger.eis.mined>prior){
      assert.equal(f.flugKern.imFeld(sh,'eis'),true,'jede Mine-Minute ausschließlich im Eisfeld');
      assert.equal(s.w5n.mineVerkauft,0,'kein vorzeitiger automatischer Verkauf am Feld');
      firstField??=steps;lastField=steps;
    }
    if(m.status!=='fertig') {
      assert.equal(s.stations.st_aldera.lager.eis,0,'Stationslager bleibt bis zum Dock leer');
      assert.equal(s.w5n.mineVerkauft,0,'48er-Ladung wird nicht aus der Ferne verkauft');
    } else {
      assert.equal(previousStock,0);
      assert.equal(sh.flug.lage,'angedockt');
    }
    if(lastStage!==m.status)lastStage=m.status;
    steps++;
  }
  assert.equal(steps,4106);
  assert.ok(firstField>=600 && lastField<3500);
  assert.equal(s.tick,68);
  assert.equal(s.flug.schritt,26);
  assert.equal(s.w5n.eisAbgebaut,48);
  assert.equal(s.w5n.mineMinuten,48);
  assert.equal(s.w5n.mineLohn,96);
  assert.equal(s.w5n.mineVerkauft,48);
  assert.equal(s.w5n.mineVerkaufWert,240);
  assert.equal(s.stations.st_aldera.lager.eis,48);
  assert.equal(sh.ladung.eis,0);
  assert.equal(s.owners[sh.owner].cash,anfangCash-96+240);
  assert.equal(geld(s),33000);
  assert.equal(s.minted,0);
  assert.equal(s.burned,0);
  assert.equal(f.hash(s),'1f478521b3490907');
  assert.equal(f.audit(s).ok,true);
});

test('F2a: vollständig bezahlter Spieler-Miner, 48 Eis, Rückflug, echte Abnahme',()=>{
  const {f,s}=neueWelt(),anfangCash=s.owners.house.cash;
  assert.equal(f.execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'}).ok,true);
  const sh=miner(s,'house');
  assert.ok(sh&&sh.flug?.lage==='angedockt');
  assert.equal(s.owners.house.cash,anfangCash-600);
  const r=f.start(s,'house',sh.id);
  assert.equal(r.ok,true);
  const steps=bisFertig(f,s,sh.id);
  assert.equal(steps,4106);
  assert.equal(s.owners.house.cash,anfangCash-600-96+240);
  assert.equal(s.w5n.eisAbgebaut,48);
  assert.equal(s.w5n.mineVerkauft,48);
  assert.equal(s.stations.st_aldera.lager.eis,48);
  assert.equal(s.minted,0);
  assert.equal(geld(s),33000);
  assert.equal(f.hash(s),'c60851bb5f4f1475');
  assert.equal(f.audit(s).ok,true);
});

test('F2a: Save/Load während Förderung und Rückflug ergibt denselben Hash',()=>{
  const {f,s}=neueWelt(),sh=miner(s);
  assert.equal(f.start(s,sh.owner,sh.id).ok,true);
  f.fliegen(s,1300);
  assert.equal(s.f2a.missionen[sh.id].status,'abbau');
  assert.ok(s.ledger.eis.mined>0);
  const ore=f.load(f.save(s));
  assert.equal(f.canonical(s),f.canonical(ore));
  f.fliegen(s,2400);
  f.fliegen(ore,2400);
  assert.equal(f.canonical(s),f.canonical(ore),'abgeleitete Zwischenflüge identisch');
  assert.equal(s.f2a.missionen[sh.id].status,'rueck');
  const trip=f.load(f.save(s));
  const rest=4106-3700;
  f.fliegen(s,rest);f.fliegen(ore,rest);f.fliegen(trip,rest);
  assert.equal(s.f2a.missionen[sh.id].status,'fertig');
  assert.equal(f.hash(s),f.hash(ore));
  assert.equal(f.hash(s),f.hash(trip));
  assert.equal(f.audit(trip).ok,true);
  assert.equal(geld(trip),33000);
});

test('F2a: Fremdeigner, Direktverkauf, Remote-Abbau und Flug-Hijacking werden abgewiesen',()=>{
  const {f,s}=neueWelt(),sh=miner(s);
  assert.equal(f.start(s,'house',sh.id).ok,false);
  assert.equal(f.execute(s,{type:'shipMine',owner:sh.owner,schiff:sh.id,ware:'eis'}).ok,false);
  assert.equal(f.submit(s,{type:'shipMine',owner:sh.owner,schiff:sh.id,ware:'eis'}).ok,false);
  const state=f.canonical(s);
  assert.equal(f.start(s,sh.owner,sh.id).ok,true);
  const traveling=f.canonical(s);
  for(const cmd of [
    {type:'shipMine',owner:sh.owner,schiff:sh.id,ware:'eis'},
    {type:'shipSellIce',owner:sh.owner,schiff:sh.id,menge:48},
    {type:'shipWait',owner:sh.owner,schiff:sh.id},
    {type:'shipFlyTo',owner:sh.owner,schiff:sh.id,x:100000,y:500000},
    {type:'shipDock',owner:sh.owner,schiff:sh.id,station:'st_aldera'}
  ]){
    assert.equal(f.execute(s,cmd).ok,false,cmd.type);
    assert.equal(f.submit(s,cmd).ok,false,cmd.type+' queue');
    assert.equal(f.canonical(s),traveling,'abgelehnte Befehle verändern Zustand nicht');
  }
  assert.notEqual(traveling,state);
  assert.equal(f.audit(s).ok,true);
});

test('F2a: manipulierte Forschungs-Missionen und 195/196/197-Saves dürfen keine Abnahme fälschen',()=>{
  const {f,s}=neueWelt(),sh=miner(s);
  f.start(s,sh.owner,sh.id);
  f.fliegen(s,1500);
  const good=f.save(s);
  const changes=[
    t=>{delete t.f2a;},
    t=>{t.f2a.missionen[sh.id].menge=50;},
    t=>{t.f2a.missionen[sh.id].verkauft=48;},
    t=>{t.f2a.missionen[sh.id].status='fertig';t.f2a.missionen[sh.id].ende=t.tick;t.f2a.missionen[sh.id].verkauft=48;},
    t=>{t.ships[sh.id].ladung.eis=49;},
    t=>{t.ships[sh.id].phase='flug';},
    t=>{t.rulesVersion=196;},
    t=>{t.rulesVersion=195;},
    t=>{t.minted=100;},
  ];
  for(const [i,change] of changes.entries()){
    const t=JSON.parse(good);change(t);
    assert.throws(()=>f.load(JSON.stringify(t)),undefined,'Verfälschung '+i);
  }
  assert.equal(f.canonical(f.load(good)),good);
});

test('F2a: 13 feste Seedwelten – realer 48er-Eisrundlauf mit voller Geld-/Waren-/Savebilanz',()=>{
  for(const seed of SEEDS){
    const {f,s}=neueWelt(seed),sh=miner(s);
    assert.equal(f.start(s,sh.owner,sh.id).ok,true);
    const steps=bisFertig(f,s,sh.id);
    assert.equal(steps,4106,'Seed '+seed);
    assert.equal(s.w5n.eisAbgebaut,48);
    assert.equal(s.w5n.mineVerkauft,48);
    assert.equal(s.stations.st_aldera.lager.eis,48);
    assert.equal(s.w5n.mineLohn,96);
    assert.equal(s.w5n.mineVerkaufWert,240);
    assert.equal(geld(s),33000);
    assert.equal(f.audit(s).ok,true,'Seed '+seed);
    assert.equal(f.canonical(f.load(f.save(s))),f.canonical(s));
  }
});
