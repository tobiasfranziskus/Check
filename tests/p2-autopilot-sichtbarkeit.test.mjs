import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),W=require('../prototypes/welt/welt-kern.js'),S=require('../prototypes/raum/raum-szene.js');
const original=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
function cockpit(bridge=true){
 const p=JSON.parse(original).w5ad.profile,w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});let s=w.load(original);
 const ids=new Map();
 class Element{
  set id(v){this._id=v;ids.set(v,this)} get id(){return this._id}
  constructor(){this.textContent='';this.children=[];this.dataset={};this.style={};this.events={};this.attributes={};this.classList={add(){},remove(){},toggle(){}};}
  append(...n){this.children.push(...n)} replaceChildren(...n){this.children=n} before(){} getContext(){return null}
  setAttribute(k,v){this.attributes[k]=v} addEventListener(k,f){this.events[k]=f} click(){if(!this.disabled)this.events.click?.({})} reportValidity(){return true}
 }
 const doc={getElementById:id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id)},createElement:()=>new Element(),addEventListener(){},body:new Element()};
 const commands=[],ctx=vm.createContext({document:doc,RaumSzene:S,RaumGrafik:{},addEventListener(){},requestAnimationFrame:()=>1});
 vm.runInContext(fs.readFileSync(new URL('../prototypes/raum/raum-cockpit.js',import.meta.url),'utf8'),ctx);
 const B={welt:()=>w,zustand:()=>s,jaeger:()=>'sh023',bojen:[],patrouille:()=>null,patrouilleStand:()=>({status:'nicht gestartet'}),duellStand:()=>null,audit:()=>w.audit(s),meldung(){},ausfuehren:cmd=>{commands.push(cmd);return w.execute(s,cmd)}};
 if(bridge)B.angebot=cmd=>w.execute(w.load(w.save(s)),cmd);
 const api=ctx.RaumCockpit.verbinden(B);api.aktivieren();
 return {w,sperren(reason){B.angebot=()=>({ok:false,reason});api.anzeigen()},get s(){return s},api,commands,$:doc.getElementById,select(id){const b=doc.getElementById('raum-ziele').children.find(b=>b.dataset.raum==='objekt-'+id);assert.ok(b);b.click()},action(id){return doc.getElementById('raum-zielaktionen').children.find(b=>b.dataset.raum==='ziel-'+id)},free(){doc.getElementById('raum-abdocken').click();for(let i=0;i<40;i++)w.teilschritt(s);api.anzeigen()}};
}
for(const bridge of [true,false])test('Echter HUD: Anfliegen, Auswahl ≠ Flugziel, Pause/Handübernahme/Stop, reine Core-Angebote ('+bridge+')',()=>{
 const c=cockpit(bridge),before=c.w.save(c.s);c.api.anzeigen();assert.equal(c.w.save(c.s),before);assert.equal(c.commands.length,0);
 c.free();assert.equal(c.s.owners['flug_sh023']?.cash??S.erzeugen(c.w,c.s,'sh023').aktiv.reserve,40);
 c.select('st_nadir');assert.equal(c.action('anfliegen').textContent,'Autopilot: Anfliegen');c.action('anfliegen').click();
 assert.equal(c.commands.at(-1).type,'shipApproach');assert.match(c.$('raum-flugstatus').textContent,/Autopilot: Anfliegen.*Station Nadir.*Zeit läuft/);
 c.select('nadir:silizium');assert.match(c.$('raum-auswahl').textContent,/Silizium/);assert.match(c.$('raum-flugstatus').textContent,/Station Nadir/);
 c.$('raum-start').click();assert.match(c.$('raum-flugstatus').textContent,/Zeit pausiert/);
 const prior={...c.s.ships.sh023.flug};c.$('raum-hand').click();
 assert.equal(c.s.ships.sh023.flug.modus,'hand');assert.equal(c.commands.at(-1).kurs,prior.sollKurs);assert.equal(c.commands.at(-1).fahrt,prior.sollFahrt);
 c.$('raum-stopp').click();assert.equal(c.commands.at(-1).fahrt,0);assert.equal(c.s.ships.sh023.flug.ziel,null);
 assert.equal(c.w.audit(c.s).ok,true);assert.equal(c.w.save(c.w.load(c.w.save(c.s))),c.w.save(c.s));
 const replay=c.w.load(original);
 for(const [i,cmd] of c.commands.entries()){
  assert.equal(c.w.execute(replay,cmd).ok,true);
  if(i===0)for(let j=0;j<40;j++)c.w.teilschritt(replay);
 }
 assert.equal(c.w.hash(replay),c.w.hash(c.s),'UI und Original-Core mit gleicher Befehlsfolge hashgleich');
});
test('Core-Ablehnung sperrt sichtbaren Autopiloten ohne Ausführungsversuch',()=>{
 const c=cockpit();c.free();c.s.kanon.pendel.sh023={}; // konkurrierender autonomer Auftrag
 c.select('st_nadir');assert.equal(c.action('anfliegen').disabled,true);
 const n=c.commands.length;c.action('anfliegen').click();assert.equal(c.commands.length,n);
 assert.ok(c.$('raum-zielaktionen').children.some(x=>/Pendel|pendel/.test(x.textContent)));
});

test('Vorschau: ungültiges Ziel und fehlende Flugreserve bleiben atomar gesperrt',()=>{
 const c=cockpit(),before=c.w.save(c.s);
 const cmd={type:'shipApproach',owner:'house',schiff:'sh023',zielArt:'station',ziel:'unknown'};
 assert.equal(S.angebot(c.w,c.s,cmd).ok,false);assert.equal(c.w.save(c.s),before);
 // Die Sitzungsbrücke meldet den abgelehnten Finanzierungscheck an die UI.
 const poor=c.w.save(c.s);c.sperren('Flugreserve nicht finanzierbar');
 assert.equal(c.$('raum-abdocken').disabled,true);
 assert.ok(c.$('raum-dockinhalt').children.some(x=>/Flugreserve nicht finanzierbar/.test(x.textContent)));
 c.$('raum-abdocken').click();assert.equal(c.w.save(c.s),poor);
});
