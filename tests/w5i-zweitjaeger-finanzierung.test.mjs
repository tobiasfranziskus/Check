import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const api=Function(html.slice(html.indexOf('const m_data_systeme ='),
  html.indexOf('const m_data_oberflaeche ='))+'\nreturn m_core_index;')();
const rules=api.W5I_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const sh=(s,owner,klasse,system)=>Object.values(s.ships).find(x=>x.owner===owner
  &&x.klasse===klasse&&(!system||x.system===system));
function check(s,who=''){
 const a=api.audit(s);
 assert.equal(a.ok,true,who+' '+JSON.stringify(Object.fromEntries(Object.entries(a)
   .filter(([k,v])=>v?.ok===false))));
 assert.equal(s.rulesVersion,26);assert.equal(s.schema,8);
 assert.equal(s.initialSupply,33000);assert.equal(s.minted,0);assert.equal(s.burned,0);
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 for(const [id,o]of Object.entries(s.owners))
   assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,'valid cash '+id);
 for(const [ware,l]of Object.entries(s.ledger)){
   const physical=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
   assert.equal(physical,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,
     'independent physical commodity '+ware+' '+who);
 }
 const count=s.stations.st_aldera.lager.erz
   +Object.values(s.erzpilotVertraege||{}).reduce((n,v)=>n+v.menge,0)
   +Object.values(s.ships).reduce((n,x)=>n+
     (s.erzpilotVertraege?.[x.id]?0:(x.ladung.erz||0)),0);
 assert.ok(count>=0&&count<=50,'50 ore full-pipeline ceiling '+who);
 assert.equal(s.w5h.gekauft,s.w5h.verkauft+s.w5h.bestand+s.w5h.unterwegs);
 assert.equal(s.owners.export.cash,20000-10*s.w5h.bestand-10*s.w5h.unterwegs);
 return a;
}
function command(s,type,owner,rest={}){
 const response=api.execute(s,{type,owner,...rest},rules);
 assert.equal(response.ok,true,JSON.stringify({type,owner,rest,reason:response.reason,tick:s.tick}));
 check(s,type);return response;
}
function refuse(s,type,owner,rest={}){
 const before=api.hash(s);
 const r=api.execute(s,{type,owner,...rest},rules);
 assert.equal(r.ok,false,'ungedeckter '+type+' muss abgelehnt werden');
 assert.equal(api.hash(s),before,'ablehnende Aktion darf keinerlei Buchung erzeugen');
 return r.reason;
}
function advance(s,n){api.advance(s,n,rules);check(s,'tick '+s.tick);}
function freight(s){
 const fr=sh(s,'transport','frachter');
 for(let i=0;i<600 && (s.w5h.bestand<50||fr.phase!=='dock');i++)api.advance(s,1,rules);
 check(s,'before freight');
 assert.equal(s.w5h.bestand,50,'wirklich vorgekaufte 50 Erz');
 command(s,'shipFreight','transport',{schiff:fr.id});
 assert.equal(s.w5h.unterwegs,50,'physical shipment ownership');
 advance(s,120);
 assert.equal(s.w5h.unterwegs,0);
 assert.equal(s.w3.auftrag,null);
}
function factory(s){
 for(let i=0;i<4;i++){command(s,'stationRefine','st_nadir',{station:'st_nadir'});advance(s,20);}
 command(s,'stationBuildParts','house',{station:'st_nadir'});advance(s,64);
 command(s,'stationBuildFighter','house',{station:'st_nadir'});advance(s,32);
 command(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
}
function twoFighters(seed){
 const s=api.createW5IState(seed);check(s,'initial');
 const npc=sh(s,'npc3','miner','aldera');
 assert.ok(npc&&npc.auftrag==='foerdern');
 // Eigentümerentscheid: NPC legt seinen Miner freiwillig still. Keine Geldzahlung,
 // keine Enteignung; W2 kann ihn aus echter Nachfrage später erneut aktivieren.
 command(s,'shipWait','npc3',{schiff:npc.id});
 command(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 command(s,'shipMine','house',{schiff:sh(s,'house','miner','aldera').id,ware:'erz'});
 command(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 command(s,'shipMine','house',{schiff:sh(s,'house','miner','nadir').id,ware:'silizium'});
 command(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 advance(s,60);
 freight(s);factory(s);
 command(s,'shipMine','house',{schiff:sh(s,'house','miner','nadir').id,ware:'silizium'});
 advance(s,8);
 for(let i=2;i<=6;i++)freight(s);
 factory(s);
 check(s,'after two genuinely paid fighters');
 assert.equal(s.w3.abgeschlossen,6);
 assert.equal(s.w3.geliefert,300);
 assert.equal(s.w5b.jaegerFertig,2);
 assert.equal(s.w5b.jaegerVerkauft,2);
 assert.equal(s.w5b.bauteilFertig,2);
 assert.equal(s.ledger.jaeger.produced,2);
 assert.equal(s.ledger.jaeger.consumed,2);
 assert.equal(s.owners.house.cash,2176);
 assert.equal(s.owners.npc3.cash,600);
 assert.equal(s.owners.st_nadir.cash,2500);
 assert.equal(s.minted,0);
 return s;
}
test('W5i: Regel26 setzt echten Auftragsdeckel ohne Preise/Emission/Legacy-Migration',()=>{
 assert.equal(rules.rulesVersion,26);assert.equal(rules.schema,8);
 assert.equal(rules.w5i.maxOffen,50);
 assert.equal(rules.erzpilot.preis,api.W5H_RULES.erzpilot.preis);
 assert.equal(rules.w3.fracht,api.W5H_RULES.w3.fracht);
 assert.equal(rules.economy.waren.jaeger.basis,900);
 assert.equal(rules.w5d.maxChargen,api.W5H_RULES.w5d.maxChargen);
 const s=api.createW5IState(42),old=api.createW5HState(42);
 check(s,'initial');assert.equal(api.audit(old).ok,true);
 assert.throws(()=>api.loadW5I(api.save(old)),/inkompatibel/);
 assert.throws(()=>api.loadW5H(api.save(s)),/inkompatibel/);
 assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
});
test('W5i: tatsächliche Arbeit finanziert zwei komplette Jäger ohne neue ISK',()=>{
 const s=twoFighters(42);
 assert.equal(s.w5h.verkauft,300);
 assert.equal(s.w5h.bestand,50);
 assert.equal(s.owners.export.cash,19500);
 assert.equal(s.stats.konto.npc3.kosten>=1800,true);
 assert.equal(s.stats.konto.house.erloes>0,true);
 assert.equal(api.pilotW5IStand(s).verlustJeJäger,1388);
 refuse(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 // Selbst mit einer fertigen Lagerhülle wäre die reale NPC-Kasse < 900.
 assert.ok(s.owners.npc3.cash<rules.economy.waren.jaeger.basis);
 assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
 console.log('W5I_ZWEI_JAEGER '+JSON.stringify({seed:42,hash:api.hash(s),
   geliefert:s.w3.geliefert,jaeger:s.w5b.jaegerFertig,
   haus:s.owners.house.cash,npc3:s.owners.npc3.cash,
   nadir:s.owners.st_nadir.cash,minted:s.minted}));
});
test('W5i: Eigentums- und Pipelinefaelschung wird sogar bei ausgeglichener ISK-Summe entdeckt',()=>{
 const base=twoFighters(7),raw=api.save(base),hash=api.hash(base);
 const bad=api.loadW5I(raw);
 bad.stations.st_aldera.lager.erz+=1;bad.ledger.erz.initial+=1;
 assert.equal(api.audit(bad).goods.ok,true);
 assert.equal(api.audit(bad).isk.ok,true);
 assert.equal(api.audit(bad).w5i.ok,false);
 assert.throws(()=>api.loadW5I(api.save(bad)),/fehlerhaft/);
 const badCash=api.loadW5I(raw);
 badCash.owners.house.cash+=100;badCash.owners.export.cash-=100;
 assert.equal(api.audit(badCash).isk.ok,true);
 assert.equal(api.audit(badCash).finanzierung.ok,false);
 assert.throws(()=>api.loadW5I(api.save(badCash)),/fehlerhaft/);
 assert.equal(api.hash(base),hash);
});
test('W5i: 13 Seeds x 90 Tage mit zwei bezahlten Jägern, täglichen Audits und deterministischem Save/Load-Replay',()=>{
 for(const seed of seeds){
   const s=twoFighters(seed),replay=api.loadW5I(api.save(s));
   for(let day=1;day<=90;day++){
     api.advance(s,1440,rules);api.advance(replay,1440,rules);
     check(s,'seed '+seed+'/day '+day);
     assert.equal(api.hash(s),api.hash(replay),'deterministic '+seed+'/'+day);
   }
   assert.equal(api.hash(api.loadW5I(api.save(s))),api.hash(s));
   assert.equal(s.w5b.jaegerFertig,2);
   assert.equal(s.owners.npc3.cash,600);
   console.log('W5I_90T '+JSON.stringify({seed,hash:api.hash(s),
     jaeger:s.w5b.jaegerFertig,geliefert:s.w3.geliefert,
     house:s.owners.house.cash,npc3:s.owners.npc3.cash,
     nadir:s.owners.st_nadir.cash,minted:s.minted}));
 }
});
