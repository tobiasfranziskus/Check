// J6-Integration: Codex-Wirtschaft und ChatGPT-Flottenwechsel ohne zweite Welt.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const W=require('../prototypes/welt/welt-kern.js');
const Wirtschaft=require('../prototypes/j6w/wirtschaft.js');
const Flotte=require('../prototypes/j4c/flotten-wechsel.js');
const json=fs.readFileSync(new URL('../prototypes/j4c/beispiel-jaeger-seed42.json',import.meta.url),'utf8');
const p=JSON.parse(json).w5ad.profile;
const w=W.erstellenJ4c({carrierCash:p.carrierCash,buyerCash:p.buyerCash});
const sitzung=()=>({spielt:false,patrouille:null,duell:null});
function check(s){
 const a=w.audit(s);assert.equal(a.ok,true,a.fehler?.join('; '));
 assert.equal(Object.values(s.owners).reduce((n,o)=>n+o.cash,0),33000);
 assert.equal(s.minted,0);assert.equal(s.burned,0);
}
const aus=(s,owner,type,felder={})=>{
 const r=Wirtschaft.erstellen(w,owner).ausfuehren(s,{type,...felder});
 assert.equal(r.ok,true,JSON.stringify({owner,type,felder,r}));
 return r;
};
const bis=(s,done)=>{
 for(let i=0;!done();i++){
  assert.ok(i<1000,'kein unbegrenzter automatischer Finanzierungs-/Produktionsloop');
  w.minute(s);
 }
 check(s);
};

test('J6 kombiniert 100% bezahlten Jäger-Folgekauf über Wirtschafts-API mit örtlich gesicherter Cockpit-Auswahl',()=>{
 const s=w.load(json);
 check(s);
 const anfang=w.hash(s);
 const old=Flotte.liste(w,s,'sh023',sitzung());
 assert.ok(old.some(sh=>sh.id==='sh023'&&!sh.auswaehlbar));
 assert.equal(w.hash(s),anfang,'Angebote lesen dieselbe Welt');
 const haus=Wirtschaft.erstellen(w,'house');
 const angebot=haus.angebot(s,{type:'siliconMineStart',schiff:'sh022'});
 assert.equal(angebot.ok,true);
 assert.equal(w.hash(s),anfang,'Wirtschaftsangebot ist nur eine Probe');
 aus(s,'house','siliconMineStart',{schiff:'sh022'});
 aus(s,'house','shipUndock',{schiff:'sh022'});
 w.minute(s);
 aus(s,'house','shipFlyTo',{schiff:'sh022',x:720000,y:-480000});
 bis(s,()=>s.kanon.silizium.auftrag.gefoerdert===8);
 aus(s,'house','shipDock',{schiff:'sh022',station:'st_nadir'});
 bis(s,()=>s.ships.sh022.flug.lage==='angedockt');
 aus(s,'house','siliconSell',{schiff:'sh022'});
 aus(s,'transport','shipBuy',{station:'st_nadir',klasse:'frachter'});
 aus(s,'st_nadir','industrialOreOffer',{miner:'sh008',frachter:'sh020'});
 aus(s,'npc3','industrialOreAcceptMine');
 aus(s,'transport','industrialOreAcceptFreight');
 aus(s,'werft_extern','industrialOreAcceptYard');
 aus(s,'st_nadir','industrialOreCommit');
 bis(s,()=>s.w3.auftrag?.phase==='rueck');
 aus(s,'st_nadir','stationRefine',{station:'st_nadir'});
 bis(s,()=>!s.w4.auftrag);
 aus(s,'werft_extern','industrialOreBuildShip');
 bis(s,()=>!s.w5.auftrag&&!s.w3.auftrag);
 for(let i=0;i<4;i++){
  aus(s,'st_nadir','stationRefine',{station:'st_nadir'});
  bis(s,()=>!s.w4.auftrag);
 }
 for(let i=0;i<8;i++){
  aus(s,'st_nadir','stationBuildParts',{station:'st_nadir'});
  bis(s,()=>!s.kanon.bauteile.auftrag);
 }
 aus(s,'st_nadir','stationBuildFighter',{station:'st_nadir'});
 w.advance(s,32);
 aus(s,'house','shipBuy',{station:'st_nadir',klasse:'jaeger'});
 check(s);
 assert.equal(s.kanon.jaeger.kaeufe.length,2);
 assert.equal(s.ships.sh025.owner,'house');
 assert.equal(s.tick,22806);
 assert.equal(w.hash(s),'3630b67418d15855');
 assert.equal(w.hash(w.load(w.save(s))),w.hash(s));
 const before=w.save(s),hash=w.hash(s);
 const rueck=Flotte.pruefen(w,s,'sh023','sh025',sitzung());
 assert.equal(rueck.ok,true,JSON.stringify(rueck));
 assert.equal(rueck.station,'st_nadir');
 assert.equal(rueck.pilot,'sh025');
 assert.equal(Flotte.pruefen(w,s,rueck.pilot,'sh023',sitzung()).ok,true);
 assert.equal(Flotte.pruefen(w,s,'sh023','sh025',{spielt:true,patrouille:null,duell:null}).ok,false);
 assert.equal(Flotte.pruefen(w,s,'sh023','sh025',{spielt:false,patrouille:null,duell:{status:'aktiv'}}).ok,false);
 assert.equal(w.save(s),before,'Cockpit-Auswahl schreibt kein Save-Feld');
 assert.equal(w.hash(s),hash,'Cockpit-Auswahl erzeugt keine zweite Welt');
});

test('J6 gemeinsamer Auftrags-/Flottenadapter verleiht house keine fremden Werft- oder Schiffrechte',()=>{
 const s=w.load(json),vor=w.save(s),hash=w.hash(s);
 const api=Wirtschaft.erstellen(w,'house');
 const werft=api.ausfuehren(s,{type:'stationBuildFighter',station:'st_nadir'});
 assert.equal(werft.ok,false);
 const kauf=api.ausfuehren(s,{type:'shipBuy',station:'st_nadir',klasse:'jaeger'});
 assert.equal(kauf.ok,false);
 assert.equal(Flotte.pruefen(w,s,'sh023','sh020',sitzung()).ok,false);
 assert.equal(Flotte.pruefen(w,s,'sh023','sh022',sitzung()).ok,false);
 assert.equal(w.save(s),vor);
 assert.equal(w.hash(s),hash);
 check(s);
});
