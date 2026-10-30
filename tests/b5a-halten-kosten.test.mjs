// B5a – Regression der bisherigen Gratisreise bei Auftrag 'halten'.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_data_oberflaeche'));
const e=new Function(code+';return {c:m_core_index,r:m_data_rules.RULES,h:m_core_handel};')();
const {c,r,h}=e;assert.equal(r.rulesVersion,13);
function fixture(){const s=c.createState(42,r);const sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');assert(sh);return {s,sh};}
function settle(n,phase='dock',cash=null){
 const {s,sh}=fixture();sh.auftrag='halten';sh.phase=phase;sh.arbeit=n;
 if(phase==='reise')sh.ziel='st_cyris';
 if(cash!==null){const delta=s.owners.house.cash-cash;s.owners.house.cash=cash;s.burned+=delta;}
 const loc=phase==='reise'?r.world.stations[sh.ziel].system:sh.system;
 const fund=h.fondsIn(r,loc),prior=s.owners.house.cash,fBefore=s.owners[fund].cash;
 const expected=Math.min(prior,Math.floor(r.world.betriebskosten[sh.klasse]*n/r.economy.stunde));
 c.betriebskosten(s,r);assert.equal(sh.arbeit,0);
 assert.equal(s.owners.house.cash,prior-expected);assert.equal(s.owners[fund].cash,fBefore+expected);
 assert(c.audit(s).ok);return {s,sh,expected};}
test('Halten im Flug zahlt alle angefallenen Minuten',()=>{const x=settle(60,'reise');assert.equal(x.expected,r.world.betriebskosten[x.sh.klasse]);});
test('Halten nach der Ankunft zahlt offene Reiseminuten',()=>{assert(settle(24).expected>0);});
test('Untätiges Halten bleibt kostenlos',()=>{assert.equal(settle(0).expected,0);});
test('Bei Kassenmangel wird nur der vorhandene Betrag verteilt',()=>{assert.equal(settle(60,'reise',5).expected,5);});
test('Bereits abgerechnete Arbeit wird nicht doppelt berechnet',()=>{const {s}=settle(60,'reise');const before=s.owners.house.cash;c.betriebskosten(s,r);assert.equal(s.owners.house.cash,before);});
test('Migration eines gehaltenen Flugs von Regel 12 nach 13 erhält den Zustand',()=>{
 const {s,sh}=fixture();sh.auftrag='halten';sh.phase='reise';sh.ziel='st_cyris';sh.ankunft=s.tick+25;sh.arbeit=17;
 const old=JSON.parse(c.save(s));old.rulesVersion=12;
 const newer=c.load(JSON.stringify(old),undefined,r);
 assert.equal(newer.rulesVersion,13);assert.equal(newer.ships[sh.id].arbeit,17);
 assert.equal(c.hash(newer),c.hash({...old,rulesVersion:13}));assert(c.audit(newer).ok);
 const before=newer.owners.house.cash;c.betriebskosten(newer,r);
 assert.equal(newer.owners.house.cash,before-Math.floor(r.world.betriebskosten[sh.klasse]*17/60));
 assert(c.audit(newer).ok);
});

test('Validierter shipWait unterwegs bleibt bei Ankunft kostenpflichtig',()=>{
 const {s,sh}=fixture();
 const move=c.execute(s,{type:'shipMove',owner:'house',schiff:sh.id,ziel:'st_cyris'},r);
 assert(move.ok,move.reason);
 const wait=c.execute(s,{type:'shipWait',owner:'house',schiff:sh.id},r);
 assert(wait.ok,wait.reason);
 c.advance(s,59,r);
 assert.equal(sh.phase,'dock');assert.equal(sh.auftrag,'halten');
 const due=Math.floor(r.world.betriebskosten[sh.klasse]*sh.arbeit/r.economy.stunde);
 assert(due>0);
 const before=s.owners.house.cash;c.betriebskosten(s,r);
 assert.equal(s.owners.house.cash,before-due);
 assert(c.audit(s).ok);
});
test('Zwei validierte Reisen mit Halten zahlen gemeinsam beim Stundenwechsel',()=>{
 const {s,sh}=fixture();
 const first=c.execute(s,{type:'shipMove',owner:'house',schiff:sh.id,ziel:'st_cyris'},r);
 assert(first.ok,first.reason);
 const wait=c.execute(s,{type:'shipWait',owner:'house',schiff:sh.id},r);
 assert(wait.ok,wait.reason);
 c.advance(s,25,r);
 assert.equal(sh.phase,'dock');assert.equal(sh.auftrag,'halten');
 const second=c.execute(s,{type:'shipMove',owner:'house',schiff:sh.id,ziel:'st_dravos'},r);
 assert(second.ok,second.reason);
 const costExpected=Math.floor(r.world.betriebskosten[sh.klasse]*59/r.economy.stunde);
 const before=s.owners.house.cash;
 c.advance(s,35,r);
 assert.equal(sh.phase,'reise');assert.equal(sh.auftrag,'halten');
 assert.equal(sh.arbeit,0);
 assert.equal(s.owners.house.cash,before-costExpected);
 assert(c.audit(s).ok);
});
