import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
const {core,rules,destroy}=new Function(src+';return {core:m_core_index,rules:m_data_rules.RULES,destroy:m_core_sicherheit.zerstoeren};')();
const R={...rules,schema:9,rulesVersion:15};
const sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
function check(s){
 assert(core.audit(s).ok,'original core audit');
 assert(core.vertragPruefen(s));
 const cc=Object.values(s.vertrag.eintraege);
 const cash=Object.values(s.owners).reduce((n,x)=>n+x.cash,0);
 const escrow=cc.reduce((n,c)=>n+c.escrow+c.fee+c.lohn+c.huelle+
   (c.produktion?c.produktion.rohBudget+c.produktion.minerBudget+
     c.produktion.fabrikLohn+c.produktion.frachtBudget:0),0);
 assert.equal(cash+escrow,s.initialSupply+s.minted-s.burned);
 const goods={};
 for(const st of Object.values(s.stations))for(const [w,n] of Object.entries(st.lager))
   goods[w]=(goods[w]||0)+n;
 for(const sh of Object.values(s.ships))for(const [w,n] of Object.entries(sh.ladung))
   goods[w]=(goods[w]||0)+n;
 for(const c of cc)if(c.produktion){
   goods.eis=(goods.eis||0)+c.produktion.rohLager;
   goods.nahrung=(goods.nahrung||0)+c.produktion.nahrungLager;
 }
 for(const [w,l] of Object.entries(s.ledger))
   assert.equal(goods[w]||0,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,w);
}
function fixture(seed=7){
 let s=core.createState(seed,rules);
 const player=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='miner');
 assert(core.execute(s,{type:'shipMine',owner:'house',schiff:player.id,ware:'erz'},rules).ok);
 core.advance(s,4*1440,rules);
 s=core.load(core.save(s),undefined,R);
 const miner=Object.values(s.ships).find(x=>x.owner==='npc3'&&x.klasse==='miner'&&x.ware==='eis');
 const freighter=Object.values(s.ships).find(x=>x.owner==='npc1'&&x.klasse==='frachter');
 assert(miner&&freighter);
 // Kontrollierte Startposition, genau wie B-K9c. KEINE neue Hull, kein Geld.
 for(const sh of [miner,freighter]){
   for(const [w,n] of Object.entries(sh.ladung))s.ledger[w].consumed+=n;
   sh.ladung={};sh.system='cyris';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;
   sh.arbeit=0;sh.auftrag=sh.klasse==='miner'?'foerdern':'halten';
   sh.ware=sh.klasse==='miner'?'eis':null;
 }
 for(const sh of Object.values(s.ships))if(sh!==miner && sh!==freighter){
   sh.auftrag='halten';sh.phase='dock';sh.ziel=null;sh.ankunft=s.tick;sh.arbeit=0;
 }
 const a={quelle:'st_cyris',ziel:'st_aldera',miner:miner.id,
   frachter:freighter.id,menge:13,fabriklohn:39,ersatzFahrten:20};
 const quote=core.nahrungsmarktangebot(s,R,a);
 assert(quote.ok,'Markt-Preflight '+JSON.stringify(quote.fehler));
 assert.equal(quote.endpreis,53);
 check(s);return {s,a,miner,freighter,quote};
}
function saveHash(s){
 const loaded=core.load(core.save(s),undefined,R);
 check(loaded);assert.equal(core.hash(s),core.hash(loaded));
}
test('B-K9f: genau 26 neue Eis und 13 neue Nahrung bleiben im selben originalen Vertrag bis Verkauf reserviert',()=>{
 const {s,a,miner,freighter,quote}=fixture();
 const start={mined:s.ledger.eis.mined,produced:s.ledger.nahrung.produced,
  sourceFood:s.stations.st_cyris.lager.nahrung,
  sourceIce:s.stations.st_cyris.lager.eis,
  buyer:s.owners.st_aldera.cash,worldMint:s.minted,trade:sum(s.stats.verkaeufe),
  money:sum(s.owners)};
 const id=core.vertragProduktion(s,a,R);
 assert.equal(id,'v1');
 const c=s.vertrag.eintraege[id],p=c.produktion;
 assert(c&&p);
 assert.equal(c.status,'foerderung');
 assert.equal(p.rohMenge,26);
 assert.equal(c.escrow,689);
 assert.equal(c.lohn,250);
 assert.equal(c.huelle,39);
 assert.equal(s.owners.st_aldera.cash,start.buyer-689);
 assert.equal(p.nahrungLager,0);
 saveHash(s);
 let rawStage=null,readyStage=null;
 for(let i=0;i<240;i++){
   core.step(s,R);
   check(s);
   if(!rawStage&&c.status==='produktion'){
      rawStage={tick:i+1,raw:p.rohLager,iceOnShip:miner.ladung.eis||0,
        mined:s.ledger.eis.mined-start.mined};
      // Im selben Originaltick wird die erste Rezeptcharge bereits begonnen:
      // 24 Eis sind gesperrt, 2 Eis sind korrekt als WIP verbraucht.
      assert.equal(p.rohLager+2*p.angefangen,26);
      assert.equal(miner.ladung.eis||0,0);
      saveHash(s);
   }
   if(c.status==='bereit'){readyStage=i+1;break;}
 }
 if(!rawStage) console.log('BK9F_ROH_GATE_DEBUG '+JSON.stringify({
   status:c.status,tick:s.tick,minerCargo:miner.ladung,
   minerWork:miner.arbeit,minerMoney:s.owners.npc3.cash,
   iceMined:s.ledger.eis.mined-start.mined,iceStation:s.stations.st_cyris.lager.eis,
   icePrice:core.preis(s,'st_cyris','eis',R),
   reservedRawCash:p.rohBudget,reservedMinerCash:p.minerBudget,
   sourceCash:s.owners.st_cyris.cash,productLine:s.stations.st_cyris.linien[p.linie]}));
 assert(rawStage,'echte originale Eisproduktion muss starten');
 assert(readyStage,'echte originale Rezeptproduktion muss fertig werden');
 assert.equal(p.fertig,13);
 assert.equal(p.angefangen,13);
 assert.equal(p.nahrungLager,13);
 assert.equal(p.rohLager,0);
 assert.equal(s.ledger.eis.mined-start.mined,26);
 assert.equal(s.ledger.nahrung.produced-start.produced>=13,true);
 assert.equal(p.nahrungLager,p.fertig,
   'nur durch den gemerkten Rezeptabschluss erzeugte Neuware ist gebunden');
 // Das Zivilsystem darf parallel vorhandene Altware verbrauchen oder handeln;
 // ihr Endlagerbestand darf sich deshalb auch verringern.
 assert.equal(p.fabrikLohn,0,'tatsächlich finanzierter Fertigungslohn ausgezahlt');
 assert.equal(s.minted,start.worldMint,'keine zusätzliche Emission während Produktionsphase');
 saveHash(s);
 const beforeShipping=s.stations.st_cyris.lager.nahrung;
 assert(core.vertragFracht(s,id,R),'Exakt diese Charge muss aus Vertragslager in den originalen Frachter');
 assert.equal(c.status,'fahrt');
 assert.equal(freighter.ladung.nahrung,13);
 assert.equal(p.nahrungLager,0);
 assert.equal(s.stations.st_cyris.lager.nahrung,beforeShipping);
 check(s);saveHash(s);
 core.advance(s,25,R);check(s);
 assert.equal(c.status,'geliefert');
 assert.equal(freighter.ladung.nahrung||0,0);
 core.advance(s,60-(s.tick%60),R);
 assert.equal(c.status,'erfuellt');
 assert(c.lohnBezahlt>0);
 assert.equal(c.huelle,39);
 assert.equal(c.escrow,0);
 assert.equal(c.lohn,0);
 assert.equal(s.owners.st_aldera.cash<=start.buyer,true);
 assert.equal(s.minted,start.worldMint);
 saveHash(s);
 console.log('BK9F_VOLLKETTE '+JSON.stringify({id,rawStage,readyTick:readyStage,
   newlyMined:s.ledger.eis.mined-start.mined,
   producedAtLeast:s.ledger.nahrung.produced-start.produced,
   exactCertifiedFood:p.fertig,delivered:13,marketPrice:53,
   buyerEscrow:quote.kosten.verkaufswert,
   minerWork:p.minerArbeit,factoryWages:quote.kosten.fabriklohn,
   freighterWork:c.lohnBezahlt,hullReserve:c.huelle,
   status:c.status,mintedDelta:s.minted-start.worldMint,
   originalSourceFoodPreservedAtHandover:true,
   replayHash:core.hash(s)}));
});
test('B-K9f: Kein Start bei nicht vorhandener Fabrik- oder Minerkasse – keine versteckte Warenreservierung',()=>{
 const {s,a}=fixture();
 const amt=s.owners.st_cyris.cash;s.owners.st_cyris.cash=0;s.owners.house.cash+=amt;
 const old=core.hash(s);
 assert.equal(core.vertragProduktion(s,a,R),null);
 assert.equal(core.hash(s),old);check(s);
 assert.equal(Object.keys(s.vertrag.eintraege).length,0);
});
test('B-K9f: Der Original-Vertragshändler darf die neue Ware vor bestätigter Produktion nicht als Altware ausgeben',()=>{
 const {s,a,freighter}=fixture();
 assert(core.vertragProduktion(s,a,R));
 const old=core.hash(s);
 const cmd=core.execute(s,{type:'shipTrade',owner:'npc1',schiff:freighter.id,
   ware:'nahrung',menge:1,kauf:true},R);
 assert.equal(cmd.ok,false);
 assert.equal(core.hash(s),old);check(s);
});

test('B-K9f: Bei gemeinsamer Konzernkasse darf kein Käufer- oder Betriebsgeld zweimal reserviert werden',()=>{
 const {s,a,miner,freighter}=fixture();
 miner.owner=freighter.owner;
 const q=core.nahrungsmarktangebot(s,R,a);
 assert(q.ok);
 const value=s.owners[miner.owner].cash;
 const quoteNeed=q.benoetigt.miner+q.benoetigt.frachter;
 // Formal reichen die *ursprünglichen* Einzelanforderungen, aber nicht
 // die vorab fest zu bindenden Preispuffer beider Betreiberrollen.
 const keep=quoteNeed+1;
 assert(value>keep,'Testfall muss eine substanzielle Geldsenkung zulassen');
 s.owners[miner.owner].cash=keep;s.owners.house.cash+=value-keep;
 const hash=core.hash(s);
 assert.equal(core.vertragProduktion(s,a,R),null);
 assert.equal(core.hash(s),hash);
 check(s);
});
test('B-K9f: Verlust des Frachters vor der Mine lässt vollständigen Kredit zurück und keine Ware entstehen',()=>{
 const {s,a,freighter}=fixture();
 const buyer=s.owners.st_aldera.cash;
 const id=core.vertragProduktion(s,a,R);assert(id);
 destroy(s,R,freighter);
 assert.equal(s.vertrag.eintraege[id].status,'storniert');
 assert.equal(s.owners.st_aldera.cash,buyer);
 assert.equal(s.vertrag.eintraege[id].escrow,0);
 assert(!s.ships[freighter.id]);
 check(s);saveHash(s);
});
test('B-K9f: Verlust des Miners nach Rohübergabe darf keine offene gebundene Produktion beschädigen',()=>{
 const {s,a,miner}=fixture();
 const id=core.vertragProduktion(s,a,R);assert(id);
 for(let i=0;i<45;i++)core.step(s,R);
 const c=s.vertrag.eintraege[id];
 assert(c.status==='produktion'||c.status==='bereit');
 destroy(s,R,miner);
 check(s);saveHash(s);
 assert(['produktion','bereit','storniert'].includes(c.status));
});
