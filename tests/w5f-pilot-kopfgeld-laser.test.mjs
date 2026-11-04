import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {vorhandeneModule} from '../prototypes/w5-frachter/m_ui_frachter_core.mjs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {api}=vorhandeneModule(html);
const rules=api.W5F_RULES;
const seeds=[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159];
const command=(s,type,owner,other={})=>{
 const cmd={type,owner,...other},result=api.execute(s,cmd,rules);
 assert.equal(result.ok,true,JSON.stringify({cmd,result,tick:s.tick,audit:api.audit(s)}));
 assert.equal(api.audit(s).ok,true,'audit after '+type);
};
const reject=(s,type,owner,other={})=>{
 const h=api.hash(s),r=api.execute(s,{type,owner,...other},rules);
 assert.equal(r.ok,false,JSON.stringify({type,owner,other,r}));
 assert.equal(api.hash(s),h,'rejected command must not change state');
};
const find=(s,owner,klasse,system)=>{
 const x=Object.values(s.ships).find(sh=>sh.owner===owner&&sh.klasse===klasse
   &&(!system||sh.system===system));
 assert.ok(x,'missing '+owner+'/'+klasse+'/'+(system||''));
 return x.id;
};
function independent(s){
 const total=Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
 assert.equal(total,s.initialSupply+s.minted-s.burned);
 assert.equal(s.initialSupply,33000);
 assert.equal(s.minted,0);
 assert.equal(s.burned,0);
 for(const [ware,l] of Object.entries(s.ledger)){
   const actual=Object.values(s.stations).reduce((n,st)=>n+(st.lager[ware]||0),0)
     +Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung[ware]||0),0);
   const expected=l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported;
   assert.equal(actual,expected,'independent goods '+ware);
 }
 for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0);
 assert.equal(api.audit(s).ok,true,'core full audits must agree');
 return total;
}
function twoFighters(seed=42){
 const s=api.createW5FState(seed);
 independent(s);
 command(s,'shipBuy','house',{station:'st_aldera',klasse:'miner'});
 const ore=find(s,'house','miner','aldera');
 command(s,'shipMine','house',{schiff:ore,ware:'erz'});
 command(s,'shipBuy','house',{station:'st_nadir',klasse:'miner'});
 const si=find(s,'house','miner','nadir');
 command(s,'shipMine','house',{schiff:si,ware:'silizium'});
 api.advance(s,50,rules);
 command(s,'shipBuy','transport',{station:'st_aldera',klasse:'frachter'});
 const fr=find(s,'transport','frachter','aldera');
 command(s,'shipFreight','transport',{schiff:fr});
 api.advance(s,120,rules);
 for(let i=0;i<4;i++){
   command(s,'stationRefine','st_nadir',{station:'st_nadir'});
   api.advance(s,20,rules);
 }
 command(s,'stationBuildParts','house',{station:'st_nadir'});
 api.advance(s,64,rules);
 command(s,'stationBuildFighter','house',{station:'st_nadir'});
 api.advance(s,32,rules);
 command(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 const pirateCandidate=find(s,'npc3','jaeger');
 command(s,'shipMine','house',{schiff:si,ware:'silizium'});
 api.advance(s,8,rules);
 let ready=false;
 for(let i=0;i<300;i++){
   if(s.stations.st_aldera.lager.erz>=50 && s.ships[fr].phase==='dock'){ready=true;break;}
   api.advance(s,1,rules);
 }
 assert.equal(ready,true);
 command(s,'shipFreight','transport',{schiff:fr});
 api.advance(s,120,rules);
 for(let i=0;i<4;i++){
   command(s,'stationRefine','st_nadir',{station:'st_nadir'});
   api.advance(s,20,rules);
 }
 command(s,'stationBuildParts','house',{station:'st_nadir'});
 api.advance(s,64,rules);
 command(s,'stationBuildFighter','house',{station:'st_nadir'});
 api.advance(s,32,rules);
 command(s,'shipBuy','npc3',{station:'st_nadir',klasse:'jaeger'});
 const fighter=Object.keys(s.ships).find(id=>s.ships[id].owner==='npc3'
   &&s.ships[id].klasse==='jaeger'&&id!==pirateCandidate);
 assert.ok(fighter,'second actual hunter');
 independent(s);
 assert.equal(s.w5b.jaegerFertig,2);
 assert.equal(s.ledger.jaeger.consumed,2);
 return {s,pirateCandidate,fighter};
}
function laserAndHunter(seed=42){
 const {s,pirateCandidate,fighter}=twoFighters(seed);
 // Bereits bezahlte Bereitschaft: echter Lohn, aber ohne Gegner/Kopfgeld.
 command(s,'shipHunt','npc3',{schiff:fighter});
 const sal=s.w5f.lohnBezahlt;
 assert.equal(sal,0,'no salary for clicking start');
 assert.equal(s.w5f.dienstOffen,rules.w5c.jaegerStunde);
 const initialReserve=s.owners.w5f_kopfgeld_reserve.cash;
 assert.equal(initialReserve,rules.w5f.bounty);
 api.advance(s,120,rules);
 assert.ok(s.w5f.lohnBezahlt>=2*rules.w5c.jaegerStunde);
 assert.equal(s.stats.kopfgeld,0,'no piracy, no bounty');
 command(s,'shipWait','npc3',{schiff:fighter});
 assert.equal(s.owners.w5f_kopfgeld_reserve.cash,0,'unused bounty refunded');
 assert.equal(s.w5f.rueckerstattet,rules.w5f.bounty);
 assert.equal(s.w5f.kopfgeldBezahlt,0);
 // Dritte echte W4-Materialcharge, nur aus den übrigen Nadir-Erzbeständen.
 command(s,'stationRefine','st_nadir',{station:'st_nadir'});
 api.advance(s,20,rules);
 assert.ok(s.stations.st_nadir.lager.material>=1);
 const materialBefore=s.stations.st_nadir.lager.material;
 const full=api.pilotW5FVollkosten();
 assert.equal(full,rules.economy.waren.material.basis+rules.w4.dauer*rules.w4.lohnJeMinute);
 assert.equal(full,40,'fully costed with already specified W4 material basis');
 assert.ok(s.owners.pilot_npc3.cash>=full);
 command(s,'stationBuildLaser','house',{station:'st_nadir'});
 assert.equal(s.stations.st_nadir.lager.material,materialBefore-1);
 assert.equal(s.stations.st_nadir.lager.laser_mk1,0);
 assert.equal(s.owners.w5f_laser_arbeit.cash,rules.w4.dauer*rules.w4.lohnJeMinute);
 api.advance(s,20,rules);
 assert.equal(s.stations.st_nadir.lager.laser_mk1,1);
 assert.equal(s.owners.w5f_laser_arbeit.cash,0);
 command(s,'pilotBuyLaser','pilot_npc3',{schiff:fighter});
 assert.equal(s.ships[fighter].ladung.laser_mk1,1);
 assert.equal(s.ships[fighter].owner,'npc3','corporate fighter stays corporate');
 command(s,'pilotFitLaser','pilot_npc3',{schiff:fighter});
 assert.equal(s.ships[fighter].laserMk1Pilot,'pilot_npc3');
 assert.equal(s.ledger.laser_mk1.produced,1);
 assert.equal(s.ledger.laser_mk1.consumed,1);
 assert.equal(s.w5f.eingebaut,1);
 assert.equal(api.pilotW5FAngriff(s),
   rules.combat.einheiten.jaeger.angriff+rules.w5f.bonusAngriff,
   'actual central combat function receives the effective laser attack');
 reject(s,'pirateBuy','pirates',{angebot:fighter});
 const paidIncome=s.owners.pilot_npc3.cash;
 command(s,'pirateBuy','pirates',{angebot:pirateCandidate});
 assert.equal(s.owners.pirates.cash,0);
 command(s,'shipHunt','npc3',{schiff:fighter});
 assert.ok(s.owners.pilot_npc3.cash>=paidIncome,'new duty hour paid');
 independent(s);
 return {s,pirateCandidate,fighter};
}
test('W5f: research rule 23 starts with 33000 ISK, no new money and has separate save',()=>{
 const s=api.createW5FState(42);
 assert.equal(s.rulesVersion,23);assert.equal(s.schema,8);
 assert.equal(s.owners.pilot_npc3.cash,0);
 assert.equal(s.owners.arbeiter_laser_nadir.cash,0);
 assert.equal(s.ledger.laser_mk1.initial,0);
 assert.equal(s.stations.st_nadir.lager.laser_mk1,0);
 independent(s);
 assert.equal(api.hash(api.loadW5F(api.save(s))),api.hash(s));
 assert.throws(()=>api.loadW5D(api.save(s)),/inkompatibel/);
 assert.throws(()=>api.loadW5F(api.save(api.createW5DState(42))),/inkompatibel/);
 assert.equal(api.audit(api.createW5DState(42)).ok,true);
});
test('W5f: clicking start/stop repeatedly cannot generate unearned pilot salary',()=>{
 const {s,fighter}=twoFighters(42),startNpc=s.owners.npc3.cash;
 const startFund=s.owners.fonds_transport.cash;
 for(let i=0;i<100;i++){
   command(s,'shipHunt','npc3',{schiff:fighter});
   assert.equal(s.owners.pilot_npc3.cash,0,'not yet worked one minute');
   command(s,'shipWait','npc3',{schiff:fighter});
   assert.equal(s.w5f.dienstOffen,0);
   assert.equal(s.owners.w5f_kopfgeld_reserve.cash,0);
   assert.equal(s.w5c.jagdKosten,0);
   independent(s);
 }
 assert.equal(s.owners.pilot_npc3.cash,0);
 assert.equal(s.owners.npc3.cash,startNpc,'all unworked service hours refunded');
 assert.equal(s.owners.fonds_transport.cash,startFund);
 assert.equal(s.w5f.storniert,100);
 assert.equal(s.w5f.dienstBeauftragt,100);
});
test('W5f: entirely paid pilot salary, escrowed bounty, laser purchase and fitting',()=>{
 const {s,fighter}=laserAndHunter(42);
 assert.equal(s.minted,0);
 assert.equal(s.stats.kopfgeld,0,'no kill yet');
 assert.equal(s.w5f.kopfgeldBezahlt,0);
 assert.equal(s.w5f.verkauft,1);
 assert.equal(s.w5f.arbeitsBezahlt,rules.w4.dauer*rules.w4.lohnJeMinute);
 reject(s,'pilotBuyLaser','house',{schiff:fighter});
 reject(s,'stationBuildLaser','house',{station:'st_nadir'});
 reject(s,'pilotFitLaser','pilot_npc3',{schiff:fighter});
 assert.equal(api.hash(api.loadW5F(api.save(s))),api.hash(s));
 independent(s);
});
test('W5f: actual pirate destruction awards bounty only from one prepaid reserve',()=>{
 const {s,pirateCandidate,fighter}=laserAndHunter(42);
 const initial=s.owners.pilot_npc3.cash;
 for(let i=0;i<150&&s.w5f.kopfgeldBezahlt===0;i++){
   api.advance(s,60,rules);
   independent(s);
 }
 assert.equal(s.w5f.kopfgeldBezahlt,rules.w5f.bounty);
 assert.equal(s.stats.kopfgeld,rules.w5f.bounty);
 assert.equal(s.w5f.abschuesse.length,1);
 assert.equal(s.w5f.abschuesse[0].id,pirateCandidate);
 assert.ok(s.w5d.verluste.some(x=>x.id===pirateCandidate));
 assert.equal(s.owners.w5f_kopfgeld_reserve.cash,0);
 assert.ok(s.owners.pilot_npc3.cash>=initial+rules.w5f.bounty);
 assert.equal(s.w5f.xp,1,'real kill yields one skill proof, no automatic cash');
 assert.equal(s.minted,0);
 assert.equal(s.ledger.laser_mk1.produced,1);
 independent(s);
 if(s.ships[fighter])assert.equal(s.ships[fighter].laserMk1Pilot,'pilot_npc3');
 const after=api.hash(s);
 reject(s,'pirateBuy','pirates',{angebot:pirateCandidate});
 assert.equal(api.hash(s),after);
});
test('W5f: insufficient reserve and material cannot spawn money or modules',()=>{
 const s=api.createW5FState(42);
 reject(s,'stationBuildLaser','house',{station:'st_nadir'});
 reject(s,'pilotBuyLaser','pilot_npc3',{schiff:'not-a-ship'});
 reject(s,'pilotFitLaser','pilot_npc3',{schiff:'not-a-ship'});
 const r=twoFighters(11);
 r.s.owners.fonds_transport.cash=0;
 const sum=Object.values(r.s.owners).reduce((n,o)=>n+o.cash,0);
 assert.notEqual(sum,r.s.initialSupply,'tampering detected by audit');
 reject(r.s,'shipHunt','npc3',{schiff:r.fighter});
 assert.equal(api.audit(r.s).ok,false);
});
test('W5f: plausible balanced cash forgery and module duplication fail auditing',()=>{
 const {s}=laserAndHunter(42);
 const raw=api.save(s),good=api.hash(s);
 const fake=api.loadW5F(raw);
 fake.owners.pilot_npc3.cash+=50;fake.owners.fonds_transport.cash-=50;
 assert.equal(api.audit(fake).isk.ok,true,'global cash balances still match');
 assert.equal(api.audit(fake).w5f.ok,false,'pilot income lacks payment receipt');
 assert.throws(()=>api.loadW5F(api.save(fake)),/Bilanz|fehlerhaft/);
 const counterfeit=api.loadW5F(raw);
 counterfeit.ledger.laser_mk1.produced++;
 counterfeit.stations.st_nadir.lager.laser_mk1++;
 assert.equal(api.audit(counterfeit).goods.ok,true,'simple goods totals still balance');
 assert.equal(api.audit(counterfeit).w5f.ok,false,'production receipt invalid');
 assert.throws(()=>api.loadW5F(api.save(counterfeit)),/Bilanz|fehlerhaft/);
 assert.equal(api.hash(s),good);
});
test('W5f: 13 independent 90-day crisis simulations, daily audits, replay and save',()=>{
 for(const seed of seeds){
   const {s}=laserAndHunter(seed);
   const replay=api.loadW5F(api.save(s));
   for(let day=1;day<=90;day++){
     api.advance(s,1440,rules);
     api.advance(replay,1440,rules);
     independent(s);
     assert.equal(api.hash(s),api.hash(replay),'daily deterministic replay '+seed+'/'+day);
     assert.equal(s.minted,0);
     assert.equal(s.stats.kopfgeld,s.w5f.kopfgeldBezahlt);
     assert.ok(s.w5f.kopfgeldBezahlt<=rules.w5f.bounty);
   }
   assert.equal(api.hash(api.loadW5F(api.save(s))),api.hash(s));
   assert.equal(s.w5f.verkauft,1);
   assert.equal(s.w5f.eingebaut,1);
   assert.equal(s.w5f.abschuesse.length,1);
   assert.equal(s.w5f.kopfgeldBezahlt,rules.w5f.bounty);
   assert.ok(s.owners.pirates.cash>=0);
   console.log('W5F_90T '+JSON.stringify({seed,hash:api.hash(s),
     minted:s.minted,kopfgeld:s.w5f.kopfgeldBezahlt,
     laser:s.w5f.fertig,lohn:s.w5f.lohnBezahlt,
     konzerne:{npc3:s.owners.npc3.cash,house:s.owners.house.cash},
     piratenVerluste:s.w5d.verluste.length}));
 }
});
