// B-K9b: echte Nachfragepreise gegen Gesamtbudget und Mengen auf originalem
// Regel14-Kern, ohne erfundene Endkunden oder neue ISK.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES};')();
const safeSources=['st_cyris'];
const safeTargets=['st_aldera','st_veldra'];
const seeds=[7,42];
const times=[0,1,2,3,4,5,6,7,10,14];
function prepare(s){
  const miner=Object.values(s.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&x.ware==='eis');
  const trader=Object.values(s.ships).find(x=>x.klasse==='frachter'&&x.owner==='npc1');
  // Das ist eine absichtlich OPTIMISTISCHE Marktschranke:
  // auch nach Hüllenverlust liegen in der Nur-Test-Kopie ideale Schiffe bereit,
  // damit fehlende Flottenverfügbarkeit die PREIS-Frage nicht überdeckt.
  // Kein Schiff wird der tatsächlichen Welt hinzugefügt oder dort bezahlt.
  const copy=core.load(core.save(s));
  const basis=core.createState(42,rules);
  const oldMiner=miner||Object.values(basis.ships).find(x=>x.klasse==='miner'&&x.owner==='npc3'&&x.ware==='eis');
  const oldTrader=trader||Object.values(basis.ships).find(x=>x.klasse==='frachter'&&x.owner==='npc1');
  assert(oldMiner&&oldTrader);
  if(!miner)copy.ships[oldMiner.id]={...oldMiner,ladung:{},arbeit:0};
  if(!trader)copy.ships[oldTrader.id]={...oldTrader,ladung:{},arbeit:0};
  for(const id of [oldMiner.id,oldTrader.id]){
    const sh=copy.ships[id];
    for(const [w,n] of Object.entries(sh.ladung)){copy.ledger[w].consumed+=n;}
    sh.ladung={};sh.phase='dock';sh.system='cyris';sh.ziel=null;sh.ankunft=copy.tick;
    sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';sh.ware=sh.klasse==='miner'?'eis':null;
    sh.arbeit=0;
  }
  assert(core.audit(copy).ok);
  return {s:copy,miner:oldMiner.id,trader:oldTrader.id};
}
function evaluate(original,day){
  const {s,miner,trader}=prepare(original);
  const spot={};
  let offers=0, positive=0, deals=0,best=null;
  for(const quelle of safeSources)for(const ziel of safeTargets){
    const targetSpot=core.preis(s,ziel,'nahrung',rules);
    spot[ziel]={spot:targetSpot,stock:s.stations[ziel].lager.nahrung,cash:s.owners[ziel].cash};
    for(let menge=1;menge<=25;menge++){
      const params={quelle,ziel,miner,frachter:trader,menge,
        endpreis:targetSpot,fabriklohn:Math.max(1,menge*3),ersatzFahrten:20};
      const offer=core.nahrungsangebot(s,rules,params);
      offers++;
      if(offer.margen?.frachter>=0)positive++;
      if(offer.ok)deals++;
      if(offer.margen&&(!best||offer.margen.frachter>best.marge))
        best={menge,ziel,preis:targetSpot,marge:offer.margen.frachter,
          kostenSchwelle:offer.markt.frachtKostendeckendAb,
          alleGates:offer.fehler,
          lagQuelle:s.stations[quelle].lager.nahrung,
          lagZiel:s.stations[ziel].lager.nahrung,
          zahlerCash:s.owners[ziel].cash};
    }
  }
  return {day,offers,positive,deals,best,spot,sourceFood:s.stations.st_cyris.lager.nahrung};
}
function run(seed,player){
  const s=core.createState(seed,rules);
  if(player){
    const m=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
    assert(core.execute(s,{type:'shipMine',owner:'house',schiff:m.id,ware:'erz'},rules).ok);
  }
  const observations=[evaluate(s,0)];
  for(let day=1;day<=14;day++){
    core.advance(s,1440,rules);
    assert(core.audit(s).ok);
    if(times.includes(day))observations.push(evaluate(s,day));
  }
  return {seed,mode:player?'spieler_erz':'passiv',
    positive:observations.reduce((n,x)=>n+x.positive,0),
    deals:observations.reduce((n,x)=>n+x.deals,0),
    best:observations.reduce((p,x)=>!p||x.best?.marge>p.best?.marge?x:p,null),
    observations,hash:core.hash(s)};
}
test('BK9b: tatsächliche stationäre Preise und verfügbare Käuferkassen gegen vollständige Verträge',()=>{
  for(const seed of seeds)for(const player of [false,true]){
    const result=run(seed,player);
    assert.equal(result.observations.length,times.length);
    assert(result.observations.every(x=>x.offers===50));
    assert(result.observations.every(x=>x.spot.st_aldera.spot>0));
    console.log('BK9B_MARKTFENSTER '+JSON.stringify(result));
  }
});
test('BK9b: Produktkalkulation zahlt keinen beliebigen erfundenen Festpreis als automatischen Marktpreis',()=>{
  const start=core.createState(42,rules),{s,miner,trader}=prepare(start);
  const spot=core.preis(s,'st_aldera','nahrung',rules);
  const a={quelle:'st_cyris',ziel:'st_aldera',miner,frachter:trader,menge:3,
    endpreis:spot,fabriklohn:9,ersatzFahrten:20};
  const q=core.nahrungsangebot(s,rules,a);
  assert(!q.ok);
  assert(q.fehler.includes('FRACHTER_VERLUST'));
  assert.equal(q.markt.aktuellerZielpreis,spot);
  assert(q.markt.frachtKostendeckendAb>spot);
});
