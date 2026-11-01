// B-K4: Produktiver regionaler Endkauf ausschliesslich aus bestehender Fonds-Kasse.
// Originalpreis, originale Ware und Original-Verbrauchslogik: keine Gratisabgabe
// bei zahlungspflichtiger Nahrung/Medizin, kein Minting, keine neuen Savefelder.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const src=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const {c,r}=new Function(src+';return {c:m_core_index,r:m_data_rules.RULES};')();
assert.equal(r.rulesVersion,15);assert.equal(r.schema,8);
const sid='st_cyris',fund=r.world.systems.cyris.fonds,ware='nahrung';
function make(seed=42){const s=c.createState(seed,r);assert(c.audit(s).ok);return s;}
function setFund(s,n){
 const vorher=s.owners[fund].cash;
 s.owners[fund].cash=n;s.owners.fonds_aldera.cash+=vorher-n;
 assert(s.owners.fonds_aldera.cash>=0);assert(c.audit(s).ok);
}
const total=s=>Object.values(s.owners).reduce((a,o)=>a+o.cash,0);
test('B-K4: nahrung aus echtem Lager gegen vorhandene System-ISK - Transfer an Station',()=>{
 const s=make(),p=c.preis(s,sid,ware,r),bedarf=r.world.stations[sid].verbrauch.nahrung;
 assert(p>0&&bedarf>0&&s.stations[sid].lager.nahrung>=bedarf);
 const medCost=r.world.stations[sid].verbrauch.medikamente*c.preis(s,sid,'medikamente',r);
 const b={f:s.owners[fund].cash,st:s.owners[sid].cash,stock:s.stations[sid].lager.nahrung,
  eaten:s.ledger.nahrung.consumed,revenue:s.stats.konto[sid].erloes,expense:s.stats.konto[fund].kosten,
  money:total(s),shortage:s.stats.mangel[sid].nahrung};
 c.verbrauch(s,r);
 const cost=bedarf*p+medCost;
 assert.equal(s.owners[fund].cash,b.f-cost);
 assert.equal(s.owners[sid].cash,b.st+cost);
 assert.equal(s.stations[sid].lager.nahrung,b.stock-bedarf);
 assert.equal(s.ledger.nahrung.consumed,b.eaten+bedarf);
 assert.equal(s.stats.konto[sid].erloes,b.revenue+cost);
 assert.equal(s.stats.konto[fund].kosten,b.expense+cost);
 assert.equal(s.stats.mangel[sid].nahrung,b.shortage);
 assert.equal(total(s),b.money);assert(c.audit(s).ok);
 console.log('BK4_ECHTER_ENDEINKAUF '+JSON.stringify({preis:p,menge:bedarf,kosten:cost,
  zahlenderFonds:fund,station:sid,minted:s.minted}));
});
test('B-K4: ohne Geld bleibt Nahrung Eigentum der Station - Mangel korrekt gezählt',()=>{
 const s=make();setFund(s,0);
 const p=c.preis(s,sid,ware,r),before=s.stations[sid].lager.nahrung,
  c0=s.ledger.nahrung.consumed,h=s.stats.mangel[sid].nahrung,st=s.owners[sid].cash;
 c.verbrauch(s,r);
 assert.equal(s.owners[fund].cash,0);
 assert.equal(s.owners[sid].cash,st);
 assert.equal(s.stations[sid].lager.nahrung,before);
 assert(s.ledger.nahrung.consumed>=c0,'andere Stationen konsumieren ihre separat bezahlte Ware');
 assert.equal(s.stats.mangel[sid].nahrung,h+1);
 assert(p>0);assert(c.audit(s).ok);
});
test('B-K4: Teilleistung aus echtem Budget, Rest bleibt physisch vorhanden',()=>{
 const s=make(),p=c.preis(s,sid,ware,r),b=s.stations[sid].lager.nahrung,
  before=s.owners[sid].cash,h=s.stats.mangel[sid].nahrung;
 setFund(s,p*2);
 c.verbrauch(s,r);
 assert.equal(s.stations[sid].lager.nahrung,b-2);
 assert.equal(s.owners[sid].cash,before+p*2);
 assert.equal(s.owners[fund].cash,0);
 assert.equal(s.stats.mangel[sid].nahrung,h+1);
 assert(c.audit(s).ok);
});
test('B-K4: Medikamente werden bezahlt, Bauteile nicht als Haushaltseinkauf umgedeutet',()=>{
 const s=make(),p=c.preis(s,sid,'medikamente',r),m=r.world.stations[sid].verbrauch.medikamente;
 const old={fund:s.owners[fund].cash,station:s.owners[sid].cash,medicine:s.stations[sid].lager.medikamente,
  parts:s.stations[sid].lager.bauteil};
 assert(s.stations[sid].lager.medikamente>=m&&p>0);
 c.verbrauch(s,r);
 // Kein Preis-Hardcode: Medizin-Entnahme ist Teil des realen Transfers.
 assert(old.fund-s.owners[fund].cash>=m*p);
 assert.equal(s.stations[sid].lager.medikamente,old.medicine-m);
 assert.equal(s.stations[sid].lager.bauteil,old.parts-r.world.stations[sid].verbrauch.bauteil);
 assert(c.audit(s).ok);
});
test('B-K4: Spielerstation wird nur fuer echten Konsum entlohnt, nicht bei Geldnot garantiert',()=>{
 const s=make();s.stations[sid].eigentum='house';
 const before=s.owners[sid].cash,f0=s.owners[fund].cash,player0=s.owners.house.cash;
 c.verbrauch(s,r);
 assert(s.owners[sid].cash>before);
 assert(s.owners[fund].cash<f0);
 assert.equal(s.owners.house.cash,player0);
 assert(c.audit(s).ok);
});
test('B-K4: Regel 14 verbraucht dieselbe Ware weiter unbezahlt (Referenz)',()=>{
 const s=make();s.rulesVersion=14;
 const old={cash:s.owners[sid].cash,source:s.owners[fund].cash,food:s.stations[sid].lager.nahrung};
 c.verbrauch(s,{...r,rulesVersion:14});
 assert.equal(s.owners[sid].cash,old.cash);
 assert.equal(s.owners[fund].cash,old.source);
 assert.equal(s.stations[sid].lager.nahrung,old.food-3);
 assert(c.audit(s).ok);
});
test('B-K4: Fonds ohne Ware bezahlt niemals und Bedarfsstation ohne Nahrung meldet Mangel',()=>{
 const s=make(),q=s.stations[sid].lager.nahrung;
 s.stations[sid].lager.nahrung=0;s.ledger.nahrung.initial-=q;
 const f=s.owners[fund].cash,st=s.owners[sid].cash;
 const medKauf=r.world.stations[sid].verbrauch.medikamente*c.preis(s,sid,'medikamente',r);
 c.verbrauch(s,r);
 // Fuer fehlende Nahrung darf kein Entgelt entstehen, fuer vorhandene
 // Medikamente wird weiterhin echtes Geld aus derselben Kasse bezahlt.
 assert.equal(s.owners[fund].cash,f-medKauf);
 assert.equal(s.owners[sid].cash,st+medKauf);
 assert.equal(s.stations[sid].lager.nahrung,0);
 assert.equal(s.stats.mangel[sid].nahrung,1);
 assert(c.audit(s).ok);
});
test('B-K4: Regel 14→15 migriert ohne Kassen/Waren/Schiff-Datenverlust',()=>{
 const s=make(),before=JSON.parse(c.save(s));before.rulesVersion=14;
 const original=JSON.stringify(before),m=c.load(original,undefined,r);
 assert.equal(m.rulesVersion,15);assert.equal(m.schema,8);
 for(const part of ['owners','ships','stations','ledger'])assert.deepEqual(m[part],before[part]);
 assert.equal(JSON.stringify(before),original);
 assert.equal(c.hash(c.load(c.save(m),undefined,r)),c.hash(m));
 assert(c.audit(m).ok);
 const future={...m,rulesVersion:16};
 assert.throws(()=>c.load(JSON.stringify(future),undefined,r),/neuer/);
});
test('B-K4: zwei identische 3-Tage-Core-Welten bleiben hashgleich, Audits positiv',()=>{
 const a=make(13),b=make(13);
 for(let day=0;day<3;day++){
  c.advance(a,1440,r);c.advance(b,1440,r);
  assert.equal(c.hash(a),c.hash(b));
  assert(c.audit(a).ok);assert(c.audit(b).ok);
 }
 assert.equal(total(a),a.initialSupply+a.minted-a.burned);
});
