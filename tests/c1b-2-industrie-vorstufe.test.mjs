import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createResearchCore} from '../tools/research/c1b-1-wasser.mjs';

const PROFILE='aphros-research:C1b-2:material-precursor-v1';
const c=createResearchCore({profile:PROFILE}),base=createResearchCore();
const clone=structuredClone;
const refine={type:'stationRefine',owner:'st_nadir',station:'st_nadir'};
const freight={type:'shipFreight',owner:'transport',schiff:'sh002'};
const rows=[];
function good(s){assert.equal(c.audit(s).ok,true,JSON.stringify(c.audit(s)));}
function execute(s,cmd){const x=c.execute(s,cmd);assert.equal(x.ok,true,x.reason);}
function independent(s){
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 for(const o of Object.values(s.owners))assert.ok(Number.isSafeInteger(o.cash)&&o.cash>=0,o.id);
 for(const [ware,l] of Object.entries(s.ledger)){
  const actual=Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)
    +Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
  assert.equal(actual,l.initial+l.mined+l.produced+l.imported-l.consumed-l.exported,ware);
 }
 const a=s.w3.auftrag,f=s.w4.auftrag;
 const initial=id=>c.rules.owners.find(o=>o.id===id).cash;
 const ore=s.w5m.schiffe.sh003;
 assert.equal(s.owners.house.cash,initial('house')-600+ore.erloes-ore.lohn-(s.owners.erz_arbeit_sh003?.cash||0));
 assert.equal(s.owners.export.cash,initial('export')-10*s.w5h.gekauft+10*s.w5h.verkauft);
 assert.equal(s.owners.st_nadir.cash,initial('st_nadir')-s.w3.kaufAusgaben-s.w4.gebucht
  -s.w5n.kaufAusgaben-s.w5n.fabrikGebucht+s.w5n.wasserErlos);
 assert.equal(s.owners.transport.cash,initial('transport')-750-s.w3.arbeitsKosten
  -(s.owners.w3_arbeit_treuhand?.cash||0)+s.w3.frachtUmsatz
  -s.w5n.frachtLohn-(s.owners.w5n_fracht_arbeit?.cash||0)+s.w5n.frachtUmsatz);
 assert.equal(s.owners.fonds_aldera.cash,initial('fonds_aldera')+ore.lohn+s.w5n.mineLohn-s.w5o.lohnEis);
 assert.equal(s.owners.fonds_transport.cash,initial('fonds_transport')+s.w3.arbeitsKosten
  +s.w5n.frachtLohn-s.w5o.lohnFracht);
 assert.equal(s.owners.w3_kauf_treuhand?.cash||0,a?(a.phase==='hin'?740:240):0);
 assert.equal(s.owners.w3_arbeit_treuhand?.cash||0,a?120-a.gearbeitet:0);
 assert.equal(s.w3.arbeitsKosten,120*s.w3.abgeschlossen+(a?.gearbeitet||0));
 assert.equal(s.w3.frachtUmsatz,240*s.w3.abgeschlossen);
 assert.equal(s.w3.kaufAusgaben,740*s.w3.beauftragt);
 assert.equal(s.owners.w4_arbeit_treuhand?.cash||0,f?10-f.gearbeitet:0);
 assert.equal(s.w4.gezahlt,10*s.w4.abgeschlossen+(f?.gearbeitet||0));
 assert.equal(s.owners.arbeitskraefte_nadir.cash,s.w4.gezahlt);
 assert.equal(s.w4.materialErzeugt,4*s.w4.abgeschlossen);
 assert.equal(s.stations.st_nadir.lager.material,s.w4.materialErzeugt);
 assert.equal(s.stations.st_nadir.lager.erz,s.w3.geliefert-10*s.w4.abgeschlossen);
 const ids=Object.keys(s.ships);assert.equal(new Set(ids).size,ids.length);
 for(const p of s.w5r.purchases)assert.equal(s.ships[p.id]?.owner,p.owner);
 assert.equal(s.ships.sh003.owner,'house');assert.equal(s.ships.sh003.klasse,'miner');
 assert.equal(s.ships.sh002.owner,'transport');assert.equal(s.ships.sh002.klasse,'frachter');
 if(a){
  const sh=s.ships[a.schiff];assert.equal(sh.phase,'reise');
  assert.equal(sh.system,a.phase==='hin'?'aldera':'nadir');
  assert.equal(sh.ziel,a.phase==='hin'?'st_nadir':'st_aldera');
  assert.equal(sh.ladung.erz||0,a.phase==='hin'?50:0);
  assert.equal(sh.ankunft,a.phase==='hin'?120:180);
 }
 assert.equal(s.owners.w5n_kunden.cash,1400+s.w5o.ausgezahlt-18*s.w5n.wasserVerbraucht);
 assert.equal(s.minted,0);assert.equal(s.burned,0);assert.equal(s.w5q.minted,0);
 assert.equal(s.w5q.exported,0);assert.deepEqual(s.w5q.events,[]);
}
function start(seed=42){
 const s=c.create(seed);
 execute(s,{type:'shipWait',owner:'npc3',schiff:'sh001'});
 execute(s,{type:'shipBuy',owner:'house',klasse:'miner',station:'st_aldera'});
 execute(s,{type:'shipMine',owner:'house',schiff:'sh003',ware:'erz'});
 return s;
}
function advance(s,n){for(let i=0;i<n;i++){c.step(s);good(s);independent(s);}return s;}
function loaded(s){const h=c.hash(s),out=c.load(c.save(s));assert.equal(c.hash(out),h);return out;}
function ready(seed=42){
 const s=advance(start(seed),60);
 execute(s,{type:'shipWait',owner:'house',schiff:'sh003'});
 assert.equal(s.w5m.schiffe.sh003.lohn,120);assert.equal(s.w5m.schiffe.sh003.erz,60);
 assert.equal(s.w5h.gekauft,50);assert.equal(s.w5h.bestand,50);
 assert.equal(s.owners.export.cash,19500,'existing wholesaler pays 500; no export mint');
 return s;
}
function snapshot(s){return {profile:PROFILE,tick:s.tick,hash:c.hash(s),
 oreWork:s.w5m.schiffe.sh003,wholesaler:s.w5h,freight:s.w3,refinery:s.w4,
 householdIncome:s.w5o.ausgezahlt,householdCash:s.owners.w5n_kunden.cash,
 waterBought:s.w5n.wasserVerbraucht,minted:s.minted,
 cash:Object.fromEntries(Object.entries(s.owners).map(([k,o])=>[k,o.cash]))};}

test('C1b-2 precursor: single registration, immutable C recipe, original C1b-1 and mutual save isolation',()=>{
 assert.equal(c.rules.w4.erzJeCharge,10);assert.equal(c.rules.w4.materialJeCharge,4);
 assert.equal(c.rules.w4.dauer,10);assert.equal(c.rules.w4.lohnJeMinute,1);
 assert.ok(Object.isFrozen(c.rules.w4));assert.equal(c.rules.economy.waren.material.basis,48);
 assert.notEqual(c.fingerprint,base.fingerprint);assert.equal(base.rules.rulesVersion,3301);
 assert.throws(()=>base.load(c.save(c.create())),/Profil/);
 assert.throws(()=>c.load(base.save(base.create())),/Profil/);
 assert.throws(()=>createResearchCore({profile:'arbitrary'}),/unbekannt/);
});
test('C1b-2 precursor: real bought hull, paid ore, wholesaler ownership and 120 paid flight minutes',()=>{
 for(const seed of [42,7]){
  let s=ready(seed),replay=loaded(s);
  assert.equal(s.ledger.erz.initial,0);assert.equal(s.ledger.material.initial,0);
  execute(s,freight);execute(replay,freight);
  assert.equal(s.owners.w3_kauf_treuhand.cash,740);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,120);
  assert.equal(s.w5h.unterwegs,50);assert.equal(s.w5h.bestand,0);
  advance(s,59);advance(replay,59);assert.equal(s.w3.geliefert,0);
  s=loaded(s);advance(s,1);advance(replay,1);
  assert.equal(s.w3.geliefert,50);assert.equal(s.w5h.verkauft,50);
  assert.equal(s.owners.export.cash,20000-10*s.w5h.bestand,'resale returns the SAME 500 ISK; another 10 ore remain paid inventory');
  execute(s,refine);execute(replay,refine);
  assert.equal(s.owners.w4_arbeit_treuhand.cash,10);
  advance(s,9);advance(replay,9);assert.equal(s.w4.materialErzeugt,0);
  s=loaded(s);advance(s,1);advance(replay,1);
  assert.equal(s.w4.materialErzeugt,4);assert.equal(s.w4.erzVerbraucht,10);
  advance(s,49);advance(replay,49);assert.equal(s.w3.abgeschlossen,0);
  assert.equal(s.owners.w3_arbeit_treuhand.cash,1,'last return minute still reserved');
  s=loaded(s);advance(s,1);advance(replay,1);
  assert.equal(s.w3.abgeschlossen,1);assert.equal(s.w3.auftrag,null);
  assert.equal(s.w3.arbeitsKosten,120);assert.equal(s.w3.frachtUmsatz,240);
  assert.equal(c.hash(s),c.hash(replay));loaded(s);
  rows.push({seed,...snapshot(s)});
 }
});
test('C1b-2 precursor: missing delivery, wrong owner, duplicate order and absent labour funding fail without mutation',()=>{
 const s=start(),h=c.hash(s);
 assert.equal(c.execute(s,refine).ok,false);assert.equal(c.hash(s),h);
 advance(s,60);execute(s,{type:'shipWait',owner:'house',schiff:'sh003'});execute(s,freight);
 const before=c.hash(s);assert.equal(c.execute(s,freight).ok,false);assert.equal(c.hash(s),before);
 advance(s,60);
 assert.equal(c.execute(s,{...refine,owner:'house'}).ok,false);
 const bad=clone(s);bad.owners.house.cash+=bad.owners.st_nadir.cash;bad.owners.st_nadir.cash=0;
 const fault=c.hash(bad);assert.equal(c.execute(bad,refine).ok,false);assert.equal(c.hash(bad),fault);
 assert.throws(()=>c.load(JSON.stringify(bad)));
 execute(s,refine);const once=c.hash(s);
 assert.equal(c.execute(s,refine).ok,false);assert.equal(c.hash(s),once);
});
test('C1b-2 precursor: tampered provenance, labour, escrow, cash, ownership and mint rejected by SAME core audits',()=>{
 const s=ready();execute(s,freight);advance(s,60);execute(s,refine);advance(s,5);
 for(const mutate of [x=>x.w5h.gekauft++,x=>x.w3.geliefert++,x=>x.w4.gezahlt++,
  x=>x.w4.auftrag.gearbeitet++,x=>x.owners.w4_arbeit_treuhand.cash++,
  x=>x.stations.st_nadir.lager.material++,x=>x.ships.sh003.owner='npc3',
  x=>{x.minted++;x.owners.house.cash++;},x=>x.c1b.rules='wrong']){
  const bad=clone(s);mutate(bad);assert.throws(()=>c.load(JSON.stringify(bad)));
 }
});
test('C1b-2 precursor: 3-day unchanged C1b-1 control, paid industrial wages remain outside household channel',()=>{
 // Unchanged reference vs a scheduled precursor; NOT an isolated export-treatment effect.
 let s=ready();execute(s,freight);advance(s,60);execute(s,refine);advance(s,60);
 let control=base.create();for(let i=0;i<3*1440;i++)base.step(control);
 let replay=loaded(s);
 while(s.tick<3*1440){
  advance(s,1);c.step(replay);
  if(s.tick%1440===0){assert.equal(c.hash(s),c.hash(replay));s=loaded(s);}
 }
 loaded(s);
 const result={days:3,precursor:snapshot(s),control:{profile:base.profile,hash:base.hash(control),
  householdIncome:control.w5o.ausgezahlt,householdCash:control.owners.w5n_kunden.cash,
  waterBought:control.w5n.wasserVerbraucht,minted:control.minted},
  refineryPrivateWages:s.owners.arbeitskraefte_nadir.cash,
  refineryHouseholdTransfer:0,exportContract:null,exportAcceptance:null,
  exportPayout:0,positiveExportProof:false};
 assert.equal(result.refineryPrivateWages,10);
 assert.equal(s.w5n.wasserVerbraucht,28);assert.equal(control.w5n.wasserVerbraucht,29);
 assert.equal(s.w5o.ausgezahlt,control.w5o.ausgezahlt);
 assert.equal(s.w5s,undefined,'no hidden second industrial household allocation');
 assert.equal(s.w5o.ausgezahlt,s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser);
 rows.push(result);console.log('C1B2_RESULT '+JSON.stringify(result));
 if(process.env.C1B2_REPORT)writeFileSync(process.env.C1B2_REPORT,JSON.stringify(rows,null,2)+'\n');
});
test('C1b-2 precursor: executable capability gap; no substitute export or free final good allowed',()=>{
 const s=c.create(),h=c.hash(s);
 assert.equal(c.rules.world.systems.meridian,undefined);
 assert.equal(c.rules.world.stations.st_meridian,undefined);
 assert.equal(c.rules.economy.rezepte.r_lager,undefined);
 for(const type of ['export','acceptExport','stationBuildStorage'])
  assert.throws(()=>c.execute(s,{type,owner:'st_nadir'}),/ausserhalb/);
 assert.equal(c.hash(s),h);assert.equal(s.minted,0);
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.includes('const m_core_w4 ='));
 assert.ok(!html.includes(PROFILE),'research not loaded by product');
});
