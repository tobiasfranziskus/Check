import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {MODULE_KINDS,MODULE_CATALOG,moduleId,initModules,priceModule,
 canCraft,craftModule,buyModule,auditModules} from '../tools/module-economy-model.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const {c,r}=new Function(source+';return {c:m_core_index,r:m_data_rules.RULES};')();
function setup(seed=7){
 const s=c.createState(seed);
 const pid='pilot_test';
 const money=1000;
 s.owners.house.cash-=money;
 s.owners[pid]={id:pid,kind:'pilot',cash:money};
 s.stats.konto[pid]={erloes:0,kosten:0};s.stats.abgabe[pid]=0;
 initModules(s);
 return{s,pid};
}
test('Sieben Modularten und drei unverwechselbare, ressourcengebundene Stufen',()=>{
 assert.equal(MODULE_KINDS.length,7);
 assert.equal(Object.keys(MODULE_CATALOG).length,21);
 assert.deepEqual(MODULE_KINDS.map(x=>x.id),['cargo','miner','shield','laser','afterburner','battery','radar']);
 for(const kind of MODULE_KINDS.map(x=>x.id))for(let tier=1;tier<=3;tier++){
  const id=moduleId(kind,tier),recipe=MODULE_CATALOG[id];
  assert.equal(recipe.kind,kind);
  assert.equal(recipe.tier,tier);
  assert(recipe.inputs.material>0&&recipe.inputs.bauteil>0);
  assert(Object.keys(recipe.inputs).every(ware=>r.economy.waren[ware]),'Unbekannte Ware '+id);
 }
});
test('Modulbau verbraucht wirklich gelagerte Industriegüter, kein Ersatzlager',()=>{
 const {s}=setup(),id='cargo-mk1',st='st_aldera',recipe=MODULE_CATALOG[id];
 assert.equal(canCraft(s,r,st,id),true);
 const old=structuredClone(s.stations[st].lager);
 const ledger=structuredClone(s.ledger);
 assert.equal(craftModule(s,r,st,id),true);
 for(const [ware,n] of Object.entries(recipe.inputs)){
  assert.equal(s.stations[st].lager[ware],old[ware]-n);
  assert.equal(s.ledger[ware].consumed,ledger[ware].consumed+n);
 }
 assert.equal(s.moduleLab.stock[st][id],1);
 assert(c.audit(s).ok);
 assert(auditModules(s).ok);
 assert.equal(craftModule(s,r,'st_meridian',id),false,'Keine Fertigungslinie am Handelshafen');
});
test('Ein Pilot kauft ein reales Modul: Stationseinnahme, Pilotausgabe, prüfbare Bilanz',()=>{
 const {s,pid}=setup(),st='st_aldera',id='cargo-mk1';
 assert(craftModule(s,r,st,id));
 const p=priceModule(s,r,c,st,id);
 const oldCash=s.owners[pid].cash,oldStation=s.owners[st].cash,initial=s.initialSupply;
 assert(p>0&&p<=oldCash);
 assert(buyModule(s,r,c,st,pid,id));
 assert.equal(s.owners[pid].cash,oldCash-p);
 assert.equal(s.owners[st].cash,oldStation+p);
 assert.equal(s.initialSupply,initial);
 assert.equal(s.owners[pid].modules.cargo,1);
 assert.equal(s.moduleLab.stock[st][id],0);
 assert.equal(s.moduleLab.sold[id],1);
 assert.equal(s.moduleLab.paidISK,p);
 assert.equal(buyModule(s,r,c,st,pid,id),false);
 assert(c.audit(s).ok);
 assert(auditModules(s).ok);
 const loaded=c.load(c.save(s));
 assert.equal(c.hash(loaded),c.hash(s));
 assert(c.audit(loaded).ok);
 assert(auditModules(loaded).ok);
});
test('Fehlendes Geld und fehlende Ressourcen verändern keinen Zustand',()=>{
 const {s,pid}=setup(),st='st_aldera',id='laser-mk3';
 const before=c.hash(s);
 assert.equal(buyModule(s,r,c,st,pid,id),false);
 assert.equal(c.hash(s),before);
 const cfg=r.world.stations[st];
 for(const [ware,n] of Object.entries(MODULE_CATALOG[id].inputs)){
  s.stations[st].lager[ware]=Math.floor((cfg.ziel[ware]||0)/2)+n-1;
 }
 const mid=c.hash(s);
 assert.equal(craftModule(s,r,st,id),false);
 assert.equal(c.hash(s),mid,'Kein teilweiser Materialverbrauch');
});
test('Reihenfolge I/II/III wird erzwungen und keine Produktion aus dem Nichts',()=>{
 const {s,pid}=setup(),st='st_aldera';
 assert(craftModule(s,r,st,'cargo-mk2'));
 const before=c.hash(s);
 assert.equal(buyModule(s,r,c,st,pid,'cargo-mk2'),false);
 assert.equal(c.hash(s),before);
 assert(craftModule(s,r,st,'cargo-mk1'));
 assert(buyModule(s,r,c,st,pid,'cargo-mk1'));
 assert.equal(s.owners[pid].modules.cargo,1);
 assert(auditModules(s).ok&&c.audit(s).ok);
});
