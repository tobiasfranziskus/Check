import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules,destroy}=new Function(src+
  ';return {core:m_core_index,rules:m_data_rules.RULES,destroy:m_core_sicherheit.zerstoeren};')();
const R={...rules,schema:9,rulesVersion:15};
function audit(s){
  assert(core.audit(s).ok);assert(core.vertragPruefen(s));
  const tied=Object.values(s.vertrag.eintraege).reduce((v,c)=>v+c.huelle+c.lohn+c.fee+c.escrow+
    (c.produktion?c.produktion.rohBudget+c.produktion.minerBudget+c.produktion.fabrikLohn+c.produktion.frachtBudget:0),0);
  assert.equal(Object.values(s.owners).reduce((v,o)=>v+o.cash,0)+tied,
    s.initialSupply+s.minted-s.burned);
}
function fixture(){
  let s=core.createState(7,rules);
  const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
  assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
  core.advance(s,4*1440,rules);
  s=core.load(core.save(s),undefined,R);
  const miner=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.ware==='eis');
  const frachter=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter');
  assert(miner&&frachter);
  for(const sh of [miner,frachter]){
    for(const [w,n] of Object.entries(sh.ladung))s.ledger[w].consumed+=n;
    sh.ladung={};sh.system='cyris';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;
    sh.arbeit=0;sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';
    sh.ware=sh.klasse==='miner'?'eis':null;
  }
  for(const sh of Object.values(s.ships))if(sh!==miner&&sh!==frachter){
    sh.auftrag='halten';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;sh.arbeit=0;
  }
  const a={quelle:'st_cyris',ziel:'st_aldera',miner:miner.id,frachter:frachter.id,
    menge:13,fabriklohn:39,ersatzFahrten:20};
  assert(core.nahrungsmarktangebot(s,R,a).ok);
  audit(s);return {s,a,miner,frachter};
}
test('B-K9g: Jede gespeicherte Dock-Reserve hat feste Port-/Frachtgrenze und bleibt im Core-Audit',()=>{
 const {s,a}=fixture();
 const id=core.vertragProduktion(s,a,R);assert(id);
 const c=s.vertrag.eintraege[id];
 assert.equal(c.produktion.rohMenge,26);
 assert(c.produktion.rohMenge<=R.economy.cargo);
 audit(s);
 const copy=JSON.parse(core.save(s));
 copy.vertrag.eintraege[id].produktion.rohMenge=R.economy.cargo+1;
 assert.throws(()=>core.load(JSON.stringify(copy),undefined,R));
 const tampered=JSON.parse(core.save(s));
 tampered.stations.st_cyris.module.dock=-1;
 assert.throws(()=>core.load(JSON.stringify(tampered),undefined,R),/Dock/);
 assert.equal(core.hash(s),core.hash(core.load(core.save(s),undefined,R)));
});
test('B-K9g: Hüllengeld bleibt selbst nach erfolgreicher Lieferung im Vertrag und ist keine freie NPC-Kasse',()=>{
 const {s,a}=fixture();
 const id=core.vertragProduktion(s,a,R);assert(id);
 for(let n=0;n<130;n++)core.step(s,R);
 assert.equal(s.vertrag.eintraege[id].status,'bereit');
 assert(core.vertragFracht(s,id,R));
 for(let n=0;n<60;n++)core.step(s,R);
 const c=s.vertrag.eintraege[id];
 assert.equal(c.status,'erfuellt');
 assert.equal(c.huelle,39);
 const traderBefore=s.owners.npc1.cash;
 // Kein Ersatzauftrag: selbst nach erfolgreichem Flug darf nicht ausgeschüttet werden.
 core.advance(s,1,R);
 assert.equal(c.huelle,39);
 assert.equal(s.owners.npc1.cash,traderBefore);
 audit(s);
 const same=core.load(core.save(s),undefined,R);
 assert.equal(core.hash(s),core.hash(same));
});
test('B-K9g: Echte Original-Werftbuchung darf bezahlte Reserve punktgenau verwenden, sonst bleibt sie gebunden',()=>{
 const {s,a,frachter}=fixture();
 const id=core.vertragProduktion(s,a,R);assert(id);
 for(let n=0;n<130;n++)core.step(s,R);
 assert(core.vertragFracht(s,id,R));
 for(let n=0;n<60;n++)core.step(s,R);
 const c=s.vertrag.eintraege[id];
 assert.equal(c.status,'erfuellt');assert.equal(c.huelle,39);
 // Fehlenden NPC1-Frachter erzeugen: kein kostenloses neues Schiff.
 destroy(s,R,frachter);
 const werft=R.world.werft;
 const available=s.stations[werft].lager.frachter||0;
 const old=s.stats.indienst.npc1?.frachter||0;
 // Originalwerft fehlt entweder im Warenbestand oder beim Eigentümerkonto.
 s.stations[werft].lager.frachter=0;
 s.ledger.frachter.consumed+=available;
 const before=core.hash(s);
 core.ersatzkauf(s,R);
 assert.equal(c.huelle,39,'Ohne verfügbare Originalhülle kein Geld abrufen');
 audit(s);
 // Ein Hüllenvorrat wird NUR in dieser Testfixture als importierte Ware
 // gebucht; kein reales dauerhaftes Wirtschaftsangebot behauptet.
 const shipyardSellable=core.reserve(R,werft,'frachter')+1;
 s.stations[werft].lager.frachter=shipyardSellable;
 s.ledger.frachter.imported+=shipyardSellable;
 const p=core.preis(s,werft,'frachter',R),fee=core.gebuehr(s,R,werft,p);
 const wants=p+fee+(Object.values(s.ships).some(x=>x.owner==='npc1')?R.world.ersatzRuecklage:0);
 const targetCash=wants-39;
 assert(targetCash>=0);
 if(s.owners.npc1.cash>targetCash){
   const n=s.owners.npc1.cash-targetCash;s.owners.npc1.cash-=n;s.owners.house.cash+=n;
 }else{
   const n=targetCash-s.owners.npc1.cash;assert(s.owners.house.cash>=n);
   s.owners.house.cash-=n;s.owners.npc1.cash+=n;
 }
 audit(s);
 console.log('BK9G_WERFT_VORHER '+JSON.stringify({wants,targetCash,fee,preis:p,
    available:s.stations[werft].lager.frachter,
    npc1Ships:Object.values(s.ships).filter(x=>x.owner==='npc1').map(x=>({id:x.id,klasse:x.klasse,sollplatz:x.sollplatz})),
    npc1Plans:s.sollflotte.npc1,oldInService:old,cash:s.owners.npc1.cash}));
 core.ersatzkauf(s,R);
 console.log('BK9G_WERFT_NACHHER '+JSON.stringify({escrow:c.huelle,avail:s.stations[werft].lager.frachter,
   npc1Cash:s.owners.npc1.cash,npc1InService:s.stats.indienst.npc1,
   npc1Ships:Object.values(s.ships).filter(x=>x.owner==='npc1').map(x=>({id:x.id,sollplatz:x.sollplatz}))}));
 assert.equal(c.huelle,0,'Genau diese 39 ISK sind im Original-Werftkauf aufgegangen');
 assert((s.stats.indienst.npc1?.frachter||0)>old);
 audit(s);
 console.log('BK9G_WERFT '+JSON.stringify({reserveUsed:39,price:p,fee,
   originalShipPurchase:true,freeRescue:false,syntheticStockOnlyInTest:true}));
});
