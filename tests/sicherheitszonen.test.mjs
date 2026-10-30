// Sicherheitsstufen sind feste Weltregeln; Piratenlage und Handel bleiben dynamisch.
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('<script>')+8,html.indexOf('const m_ui_main ='));
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,{dataset:{},innerHTML:'',textContent:''});return elements.get(id)}};
const {core,rules,ui,karte,zeichnen,security}=new Function('document',source+
 ';return {core:m_core_index,rules:m_data_rules.RULES,ui:m_ui_sicht,karte:m_data_karte.KARTE,zeichnen:m_ui_hq.systemZeichnen,security:m_core_sicherheit};')(document);
const expected={aldera:'sicher',cyris:'sicher',veldra:'sicher',orion:'umkaempft',nadir:'umkaempft',dravos:'gesetzlos',meridian:'gesetzlos'};
test('Sieben Sicherheitseinstufungen steuern Piratenvorkommen und Sicherheitsjäger',()=>{
 const s=core.createState(7);
 assert.equal(rules.rulesVersion,10);
 assert.deepEqual(Object.fromEntries(Object.entries(rules.world.systems).map(([id,o])=>[id,o.sicherheit])),expected);
 for(const [sys,level] of Object.entries(expected)){
  const pirates=Object.values(s.ships).filter(sh=>sh.owner==='pirates'&&sh.system===sys);
  if(level==='sicher') assert.equal(pirates.length,0,'Piraten in '+sys);
  else assert(pirates.length>0,'kein Piratenrisiko in '+sys);
 }
 assert(!rules.world.sicherheit.jaeger.includes('dravos'),'kein Staatsjäger in Gesetzlos-Zone');
 assert(!rules.world.sicherheit.jaeger.includes('meridian'));
 assert(rules.world.sicherheit.jaeger.includes('orion'));
 assert(rules.world.sicherheit.jaeger.includes('nadir'));
 assert(core.audit(s).ok);
});
test('Auch ein nachträglich gesetzter Pirat darf in sicherem System niemanden angreifen',()=>{
 const s=core.createState(8),r=structuredClone(rules),sh=Object.values(s.ships).find(x=>x.owner==='house'&&x.klasse==='frachter');
 assert(sh);
 r.world.ueberfallChance=1000;
 const id='test_pirat';s.ships[id]={id,owner:'pirates',klasse:'pirat_gross',system:'aldera',phase:'dock',auftrag:'pirat',ladung:{}};
 s.stats.verkaeufe[id]=0;
 const kontrollfall=structuredClone(s);
 delete kontrollfall.ships[id];delete kontrollfall.stats.verkaeufe[id];
 security.ueberfall(kontrollfall,r);
 security.ueberfall(s,r);
 assert.equal(s.rng,kontrollfall.rng,'sicherer Pirat darf RNG trotz anderer Piratengebiete nicht verändern');
 assert.equal(JSON.stringify(s.stats.verluste),JSON.stringify(kontrollfall.stats.verluste));
 assert.equal(Object.keys(s.ships).length,Object.keys(kontrollfall.ships).length+1);
 assert(s.ships[id], 'Pirat aus sicherem System bleibt ohne Angriff');
 assert(core.audit(s).ok);
});
test('Piratenersatz ist in sicheren Systemen auch bei fehlerhaftem Soll-Eintrag gesperrt',()=>{
 const s=core.createState(9),r=structuredClone(rules);
 r.world.piraten.soll.aldera={pirat_klein:1};
 security.piratenErsatz(s,r);
 assert.equal(Object.values(s.ships).filter(x=>x.owner==='pirates'&&x.system==='aldera').length,0);
 assert(core.audit(s).ok);
});
test('Sicherheitsstufe und Piratenlage sind in Systemansicht getrennt sichtbar',()=>{
 const s=core.createState(10),lage=ui.lage(s,rules,karte);
 for(const [id,level] of Object.entries(expected))assert.equal(lage[id].sicherheit,level,id);
 assert.match(ui.lageMarke(lage.aldera).text,/Sicher/);
 assert.match(ui.lageMarke(lage.dravos).text,/Gesetzlos/);
 assert.match(ui.lageMarke(lage.orion).text,/Umkämpft/);
 assert.match(ui.lageMarke(lage.meridian).text,/Piratenhafen/);
 const before=core.hash(s);
 zeichnen(lage.dravos);
 assert.match(elements.get('sys-kopf').innerHTML,/Sicherheit/);
 assert.match(elements.get('sys-kopf').innerHTML,/Gesetzlos/);
 assert.equal(core.hash(s),before,'Anzeige ändert keinen Zustand');
});

test('Direktes Meridian–Orion-Tor und zwei Zugänge zum Nadir-Sektor',()=>{
 const kanten=rules.world.gates;
 const verbindung=(a,b)=>kanten.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
 assert.equal(verbindung('meridian','orion')?.[2],26);
 assert.equal(verbindung('nadir','orion')?.[2],18);
 assert.equal(verbindung('nadir','meridian')?.[2],21);
 const direkt=core.route(rules.world,'meridian','orion');
 assert.deepEqual(direkt.weg,['meridian','orion']);
 assert.equal(direkt.zeit,26);
 assert.equal(core.route(rules.world,'nadir','aldera')?.zeit>0,true);
});

test('Nadir liefert tatsächlich Silizium und Eis in umkämpfter Zone',()=>{
 const s=core.createState(12);
 const nadir=rules.world.stations.st_nadir;
 assert.equal(rules.world.systems.nadir.sicherheit,'umkaempft');
 assert.deepEqual(nadir.linien,['r_nahrung']);
 assert.deepEqual(nadir.verbrauch,{nahrung:2,medikamente:1,bauteil:1});
 assert.equal(s.stations.st_nadir.lager.silizium,52);
 for(const ware of ['silizium','eis']){
  assert(rules.world.fields.some(f=>f.system==='nadir'&&f.ware===ware&&f.miner===1));
  assert(Object.values(s.ships).some(sh=>sh.owner==='npc3'&&sh.system==='nadir'&&sh.ware===ware));
 }
 const mined=s.ledger.silizium.mined;
 core.advance(s,1440);
 assert(s.ledger.silizium.mined>mined,'Silizium muss aus realem Minerbetrieb stammen');
 assert(core.audit(s).ok);
 assert.equal(core.hash(core.load(core.save(s))),core.hash(s));
});
