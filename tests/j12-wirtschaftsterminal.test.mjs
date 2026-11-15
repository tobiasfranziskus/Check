// J12: live company terminal is a pure view of the original verified career.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const W5=require('../prototypes/w5ac/session.js');
const J8=require('../prototypes/verbund/konzern-session.js');

test('J12: terminal uses current core snapshots, escaped DOM text, and no NPC command authority',()=>{
 const html=readFileSync(new URL('../prototypes/spiel/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../prototypes/spiel/spiel.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../prototypes/spiel/spiel.css',import.meta.url),'utf8');
 assert.match(html,/id="tab-universum"/);
 assert.match(html,/id="sektorwirtschaft"/);
 assert.match(js,/function wirtschaftsbericht\(a,s,angebote\)/);
 assert.match(js,/wirtschaftsbericht\(a,s,alleAngebote\)/);
 assert.match(js,/const alleAngebote=session\.angebote\(\)/);
 assert.match(js,/\.dataset\.j12Offer=angebot\.id/);
 assert.match(css,/\.economy-section/);
 const view=js.split('function wirtschaftsbericht(a,s,angebote){')[1]?.split('\nfunction anzeigen(){')[0];
 assert.ok(view,'the live view is separate from the economic core');
 assert.match(view,/s\.owners\[st\.id\]/);
 assert.match(view,/s\.ships/);
 assert.match(view,/angebot\.ok/);
 assert.match(view,/\.textContent=/);
 assert.doesNotMatch(view,/\.innerHTML\s*=|session\.ausfuehren|welt\.execute|npcAutoSetzen|localStorage\./);
 assert.doesNotMatch(html,/<script[^>]*src="https?:/i);
});

test('J12: reading verified offers and owners changes neither money nor goods; only real purchase changes the world',()=>{
 const original=W5.create(42,'private195').export(),ses=J8.erstellen();
 const initial=ses.starten195(original,true),before=ses.exportieren(),state=ses.zustandReferenz();
 assert.equal(initial.weltgeld,33000);
 assert.equal(initial.hausgeld,3000);
 assert.equal(initial.schiffe.length,0);
 assert.ok(initial.stationen.length>=2);
 for(const st of initial.stationen){
   assert.equal(st.id in state.stations,true);
   assert.equal(st.lager, Object.entries(state.stations[st.id].lager)
     .filter(([,n])=>n>0).map(([ware,n])=>ware+': '+n).join(' · ')||'leer');
 }
 const offers=ses.angebote();
 assert.equal(offers.find(x=>x.id==='buy-st_aldera-miner')?.ok,true);
 assert.ok(offers.some(x=>x.id==='buy-st_nadir-jaeger'&&!x.ok));
 assert.equal(ses.exportieren(),before,'view quotes must not mutate the world');
 assert.equal(ses.ansicht().hash,initial.hash);
 assert.equal(Object.values(state.owners).reduce((sum,x)=>sum+x.cash,0),33000);
 const buy=ses.ausfuehren('buy-st_aldera-miner');
 assert.equal(buy.ok,true);
 assert.equal(ses.ansicht().hausgeld,2400);
 assert.equal(ses.ansicht().schiffe.length,1);
 const after=ses.zustandReferenz();
 assert.equal(after.minted,0);assert.equal(after.burned,0);
 assert.equal(Object.values(after.owners).reduce((sum,x)=>sum+x.cash,0),33000);
 assert.equal(ses.weltReferenz().audit(after).ok,true);
 const restored=J8.erstellen();
 const saved=ses.exportieren();
 restored.oeffnen204(saved,true);
 assert.equal(restored.exportieren(),saved);
 assert.equal(restored.ansicht().hash,ses.ansicht().hash);
 assert.equal(W5.create(42,'private195').export(),original);
});
