import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Isolated Node research registration. Never loaded by index.html or browser storage.
export const PROFILE='aphros-research:C1b-1:water-v1';
export const RULE_VERSION=3301;
export const WAGES_PROFILE='aphros-research:C1c-1:earned-industry-wages-v1';
export const PARTS_PROFILE='aphros-research:C1c-2:paid-component-v1';
const SOURCE_SHA='6274d118345d505bc3a147eb2e169a31a8c4ed4e1b6eca566f402b70a4ae217b';
const sha=x=>createHash('sha256').update(x).digest('hex');
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const check=(ok,message)=>{if(!ok)throw Error('C1b-1: '+message);};

// One bounded registration path; never accept arbitrary rule callbacks or patched audits.
export function createResearchCore({profile=PROFILE}={}){
 check([PROFILE,'aphros-research:C1b-2:material-precursor-v1',WAGES_PROFILE,PARTS_PROFILE].includes(profile),'unbekanntes Forschungsprofil');
 const precursor=profile!==PROFILE;
 const partsFlow=profile===PARTS_PROFILE;
 const wageFlow=profile===WAGES_PROFILE||partsFlow;
 const version=partsFlow?3304:wageFlow?3303:precursor?3302:RULE_VERSION;
 const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 check(sha(html)===SOURCE_SHA,'unbekannte Core-Basis');
 const source=html.slice(html.indexOf('const m_data_systeme ='),html.indexOf('const m_data_oberflaeche ='));
 const boundary=source.indexOf('const m_core_index =');
 check(boundary>0,'Core-Registrierungsgrenze fehlt');
 // Insert a registration callback at a module boundary, without rewriting core functions.
 // Only this fresh private module instance receives aliases for legacy audit dispatch.
 const core=Function('register',source.slice(0,boundary)+`
 register({data:m_data_erzpilot,freeze:m_data_systeme.tiefFrieren,
  water:m_core_w5n,income:m_core_w5o,trade:m_core_handel,state:m_core_state});
 `+source.slice(boundary)+`
return {api:m_core_index,serialize:m_core_serialize,
  water:m_core_w5n,income:m_core_w5o,wages:m_core_w5s};`)(modules=>register(modules,{profile,version,precursor,wageFlow,partsFlow}));
 const rules=core.api.W5R_RULES;
 const fingerprint=sha(core.serialize.save(rules));
 function identity(s){
  check(s?.schema===8&&s.rulesVersion===version&&s.c1b?.profile===profile,'Profilwechsel verboten');
  check(s.c1b.rules===fingerprint,'Regel-Fingerprint falsch');
  check(s.w5o.mode==='wages'&&s.w5o.minerOwner==='npc3','Einkommensprofil falsch');
  check((wageFlow?!!s.w5s:!s.w5s)&&s.w5q.mode==='off'&&['rate','dayCap','totalCap','exported','minted','payout','stationNet'].every(k=>s.w5q[k]===0)
   &&s.w5q.events.length===0&&s.minted===0&&s.burned===0,'Export/Mint/Rettung nicht Teil dieses Profils');
 }
 function audit(s){
  try{
   identity(s);const base=core.api.audit(s);
   check(base.ok,'Core-Audit '+JSON.stringify(Object.fromEntries(Object.entries(base).filter(([,v])=>v?.ok===false))));
   check(foerderAudit(s),'Arbeitsbelege');check(nachfrageAudit(s),'Nachfragebelege');
   if(wageFlow)check(lohnAudit(s,rules),'wirklich verdiente W3/W4-Loehne');
   if(partsFlow)check(bauteilAudit(s,rules),'bezahlt erzeugtes Bauteil');
   check(Object.values(s.owners).every(o=>integer(o.cash)),'ungueltiges Geld');
   for(const obj of [...Object.values(s.stations).map(x=>x.lager),...Object.values(s.ships).map(x=>x.ladung),...Object.values(s.ledger)])
    check(Object.values(obj).every(integer),'ungueltige Waren');
   check(s.initialSupply===33000&&integer(s.tick),'Startgeld/Tick');
   const purchaseIds=s.w5r.purchases.map(x=>x.id);
   check(new Set(purchaseIds).size===purchaseIds.length,'doppelter Hüllenkauf');
   return {...base,c1b:{ok:true},ok:true};
  }catch(e){return {ok:false,reason:e.message};}
 }
 function validate(s){const result=audit(s);check(result.ok,result.reason);return s;}
 function save(s){validate(s);return core.api.save(s);}
 function load(json){
  const raw=JSON.parse(json);identity(raw);
  const s=core.serialize.load(json,core.serialize.MIGRATIONS,8,version,{});
  return validate(s);
 }
 const allowed=new Set([...(precursor?['shipFreight','stationRefine']:[]),...(partsFlow?['stationBuildParts']:[]),'shipMine','shipWait','shipSellIce','shipFreightIce','stationWater','shipBuy']);
 function execute(s,cmd){
  identity(s);check(allowed.has(cmd?.type),'Befehl ausserhalb des Wasserprofils');
  return core.api.execute(s,cmd,rules);
 }
 function step(s){
  identity(s);check(s.queue.length===0,'nur unmittelbare validierte Forschungsbefehle');
  core.api.step(s,rules);return s;
 }
 function create(seed=42){
  const s=core.api.createW5RState(seed,'wages','npc3','off',0,0,0);
  s.c1b={profile,rules:fingerprint,mining:{},demand:[]};
  if(wageFlow)s.w5s={allocated:0,paid:0,active:null,completed:[],industryWages:{paid:{},events:[]}};
  return validate(s);
 }
 return Object.freeze({profile,rules,fingerprint,create,step,execute,audit,save,load,hash:core.api.hash,
  // Low-level module entrypoints permit adversarial double-call tests, never browser access.
  diagnostics:Object.freeze({mine:core.water.foerdern,income:core.income.einkommen,demand:core.water.nachfrage,
   oreWages:core.wages.orePilotWage,industryWages:core.wages.industryWage})});
}

// Additional independent accounts check for C1c; the money moves only in the
// pre-existing W5s-q/W5s-r Core wage routines, never in this research adapter.
function lohnAudit(s,r){
 const w=s.w5s;if(!w||!w.industryWages)return false;
 const init=id=>r.owners.find(o=>o.id===id)?.cash??0;
 const paid=w.industryWages.paid;
 const industry=(paid.refinery||0)+(paid.shipyard||0)+(paid.maintenance||0);
 return [w.orePilotWages||0,paid.refinery||0,paid.shipyard||0,paid.maintenance||0]
     .every(integer)
   &&(w.orePilotWages||0)<=s.w3.arbeitsKosten
   &&(paid.refinery||0)<=s.w4.gezahlt
   &&s.owners[r.w3.arbeitsFonds].cash===init(r.w3.arbeitsFonds)
       +s.w3.arbeitsKosten+s.w5n.frachtLohn-s.w5o.lohnFracht-(w.orePilotWages||0)
   &&s.owners[r.w4.arbeitOwner].cash===s.w4.gezahlt-(paid.refinery||0)
   &&s.owners.w5n_kunden.cash===init('w5n_kunden')+s.w5o.ausgezahlt
       +(w.orePilotWages||0)+industry-s.w5n.wasserErlos
   &&s.minted===0&&s.burned===0;
}
// Independent checks beyond the registered original W5b audit. Research rule
// 3304 only establishes the *paid output*, not ten timed C-silicon work minutes.
function bauteilAudit(s,r){
 const w=s.w5b, p=r.w5b;
 if(!w||!p||p.silikonMenge!==1||p.silikonLohn!==10||p.materialPreis!==48)return false;
 const a=w.auftrag;
 const part=r.economy.rezepte.r_bauteil;
 if(part?.ein.material!==2||part?.ein.silizium!==1||part?.aus.bauteil!==1
    ||part?.dauer!==8)return false;
 const ints=[w.siliziumBegonnen,w.siliziumAbgeschlossen,w.siliziumAbgebaut,
  w.siliziumLohnBezahlt,w.bauteilBegonnen,w.bauteilFertig,w.fabrikLohnGebunden,
  w.fabrikLohnBezahlt,w.materialVerbraucht,w.siliziumVerbraucht,w.vorproduktKauf];
 if(!ints.every(integer))return false;
 return w.siliziumLohnBezahlt===10*w.siliziumAbgebaut
  &&w.siliziumAbnahme===w.siliziumAbgeschlossen*24
  &&w.bauteilBegonnen===w.bauteilFertig+(a?.art==='stationBuildParts'?1:0)
  &&w.materialVerbraucht===2*w.bauteilBegonnen
  &&w.siliziumVerbraucht===w.bauteilBegonnen
  &&w.vorproduktKauf===120*w.bauteilBegonnen
  &&w.fabrikLohnGebunden===8*w.bauteilBegonnen
  &&w.fabrikLohnBezahlt===8*w.bauteilFertig+(a?.gearbeitet||0)
  &&(s.owners.w5b_fabrik_arbeit?.cash||0)
    ===w.fabrikLohnGebunden-w.fabrikLohnBezahlt
  &&s.owners[p.arbeiter].cash===w.fabrikLohnBezahlt
  &&s.ledger.bauteil.produced===w.bauteilFertig
  &&s.ledger.bauteil.consumed===0
  &&s.stations[p.station].lager.bauteil===w.bauteilFertig;
}
function foerderAudit(s){
 const rows=Object.entries(s.c1b?.mining||{}),w=s.w5n;
 return rows.every(([id,x])=>integer(x.minutes)&&integer(x.units)&&[0,1].includes(x.rest)
  &&x.minutes===2*x.units+x.rest&&integer(x.lastTick)&&x.lastTick>0&&x.lastTick<=s.tick
  &&(s.ships[id]?.klasse==='miner'&&s.ships[id].owner==='npc3'
   ||s.w5r.losses.some(l=>l.id===id&&l.type==='miner'&&l.owner==='npc3')))
  &&rows.reduce((n,[,x])=>n+x.minutes,0)===w.mineMinuten
  &&rows.reduce((n,[,x])=>n+x.units,0)===w.eisAbgebaut
  &&w.mineLohn===w.mineMinuten;
}
function nachfrageAudit(s){
 const rows=s.c1b?.demand;if(!Array.isArray(rows)||rows.length!==Math.floor(s.tick/144))return false;
 return rows.every((x,i)=>x.tick===(i+1)*144&&integer(x.cash)&&integer(x.stock)
   &&x.missingCash===(x.cash<18)&&x.missingGoods===(x.stock<1)
   &&x.bought===(!x.missingCash&&!x.missingGoods?1:0))
  &&rows.reduce((n,x)=>n+x.bought,0)===s.w5n.wasserVerbraucht;
}
function register({data,freeze,water,income,trade,state},{profile,version,precursor,wageFlow,partsFlow}){
 const rules=structuredClone(data.W5R_RULES);
 rules.rulesVersion=version;
 rules.researchProfile=profile;
 Object.assign(rules.w5n,{mineLohn:1,rezeptEis:50,rezeptWasser:50,
  fabrikMinuten:100,fabrikLohn:1,wasserPreis:18,frachtJeMinute:2.25,verbrauchStunde:0});
 rules.economy.waren.wasser.basis=18;
 rules.c1b={paidMinutesPerIce:2,dayMinutes:1440,scheduledWaterPerDay:10,interval:144};
 if(precursor){
  // C recipe only; upstream ore extraction and W3 freight remain explicitly R32.
  Object.assign(rules.w4,{erzJeCharge:10,materialJeCharge:4,dauer:10,lohnJeMinute:1});
  rules.economy.waren.material.basis=48;
 }
 if(partsFlow){
  // Pre-existing W5b Core contract: one paid 2m+1Si -> 1 part lot,
  // eight paid fabrication minutes. Silicon's original ONE-tick extraction
  // is deliberately retained, but its 10-ISK gross labour unit cost is
  // C-compatible; the 10-minute cadence is explicitly NOT proven.
  Object.assign(rules.w5b,{silikonMenge:1,silikonLohn:10,materialPreis:48});
  rules.economy.waren.silizium.basis=24;
 }
 if(wageFlow){
  // Reuse existing W5s-q (paid W3 flights) and W5s-r (earned W4/W5/W5r
  // labour), without activating its unrelated shipyard/autonomous operations.
  rules.w5s={autoIndustry:true,autoOreWageHousehold:true,autoIndustryWages:true};
 }
 freeze(rules);
 // The stock full-audit dispatch hardcodes these names. Register the SAME frozen
 // research rules in its four private water/income/export/wear slots, before index init.
 for(const key of ['W5N_RULES','W5O_RULES','W5Q_RULES','W5R_RULES'])data[key]=rules;
 water.foerdern=(s,r,sh)=>{
  check(r===rules&&s.rulesVersion===version&&s.c1b?.profile===profile,'falsches Arbeitsprofil');
  check(sh===s.ships[sh.id]&&sh.owner==='npc3'&&sh.klasse==='miner'&&sh.system==='aldera'
   &&sh.phase==='dock'&&sh.auftrag==='foerdern'&&sh.ware==='eis','keine berechtigte Eisarbeit');
  const previous=s.c1b.mining[sh.id];
  check(!previous||previous.lastTick<s.tick,'Doppelabrechnung der Arbeitsminute');
  const used=Object.values(sh.ladung).reduce((a,n)=>a+n,0);
  if(used>=r.economy.cargo||s.owners[sh.owner].cash<r.w5n.mineLohn){
   sh.auftrag='halten';state.protokolliere(s,'auftrag',sh.id+': Eisabbau pausiert (Fracht/Arbeitsgeld)',sh.owner);return 0;
  }
  // Pay before progress. No funding, no work, no unit; unfinished work belongs to this hull.
  s.owners[sh.owner].cash--;s.owners.fonds_aldera.cash++;trade.buche(s,sh.owner,'kosten',1);
  const row=previous||(s.c1b.mining[sh.id]={minutes:0,units:0,rest:0,lastTick:0});
  row.minutes++;row.rest++;row.lastTick=s.tick;
  s.w5n.mineMinuten++;s.w5n.mineLohn++;s.w5o.npcMineLohn++;
  if(row.rest<2)return 0;
  row.rest=0;row.units++;sh.ladung.eis=(sh.ladung.eis||0)+1;
  s.ledger.eis.mined++;s.w5n.eisAbgebaut++;
  const c=r.w5n;
  if(sh.ladung.eis>=c.charge){
   const n=Math.min(sh.ladung.eis,trade.aufnehmbar(s,r,c.quellStation,'eis'));
   if(n>=c.charge)water.verkauf(s,r,sh,n);
  }
  if(Object.values(sh.ladung).reduce((a,n)=>a+n,0)>=r.economy.cargo)sh.auftrag='halten';
  return 1;
 };
 const originalTick=water.tick;
 function nachfrage(s,r){
  check(r===rules&&s.c1b?.profile===profile,'falsches Nachfrageprofil');
  if(s.tick%144!==0)return;
  const rows=s.c1b.demand;
  check(rows.length===s.tick/144-1,'Doppelabrechnung der Nachfrage');
  const customer=s.owners.w5n_kunden,stock=s.stations.st_nadir.lager;
  const row={tick:s.tick,cash:customer.cash,stock:stock.wasser,
   missingCash:customer.cash<18,missingGoods:stock.wasser<1,bought:0};
  if(!row.missingCash&&!row.missingGoods){
   customer.cash-=18;s.owners.st_nadir.cash+=18;stock.wasser--;
   s.ledger.wasser.consumed++;s.w5n.wasserVerbraucht++;s.w5n.wasserErlos+=18;
   trade.buche(s,'w5n_kunden','kosten',18);trade.buche(s,'st_nadir','erloes',18);row.bought=1;
  }
  rows.push(row);
 }
 water.nachfrage=nachfrage;
 water.tick=(s,r)=>{originalTick(s,r);nachfrage(s,r);};
 water.verbrauch=()=>{}; // hourly legacy consumption disabled; no catch-up orders
 water.audit=(s,r)=>wasserAudit(s,r,water.preise);
}

// W5n's complete goods, owner, cash, escrow and work audit, retained from #246.
// Only its old >=1 ice/minute predicate is replaced by the exact paid-work receipts.
 function wasserAudit(s,r,preise){
   const w=s.w5n,c=r.w5n;if(!w||!c)return {ok:false,grund:'W5n-Buch fehlt'};
   const p=preise(r),a=w.frachtauftrag,f=w.fabrikauftrag;
   const iceCargo=Object.values(s.ships).filter(sh=>sh.klasse==='miner')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const iceRoute=Object.values(s.ships).filter(sh=>sh.klasse==='frachter')
     .reduce((n,sh)=>n+(sh.ladung.eis||0),0);
   const factoryCost=c.fabrikMinuten*c.fabrikLohn;
   const numbers=[w.eisAbgebaut,w.mineMinuten,w.mineLohn,w.mineVerkauft,w.mineVerkaufWert,
     w.eisTransferWert,w.frachtBeauftragt,w.frachtAbgeschlossen,w.eisGeliefert,
     w.kaufAusgaben,w.frachtLohn,w.frachtUmsatz,w.fabrikBegonnen,w.fabrikFertig,
     w.fabrikGebucht,w.fabrikBezahlt,w.eisVerbraucht,w.wasserProduziert,
     w.wasserVerbraucht,w.wasserErlos,w.knappheitsStunden,iceCargo,iceRoute];
   const ok=numbers.every(x=>Number.isSafeInteger(x)&&x>=0)
     &&w.eisAbgebaut===s.ledger.eis.mined&&w.mineLohn===w.mineMinuten*c.mineLohn
     &&foerderAudit(s)
     &&w.eisAbgebaut===w.mineVerkauft+iceCargo+(s.w5r?.lostIce??0)
     &&w.mineVerkaufWert===w.mineVerkauft*c.eisPreis
     &&w.eisTransferWert===w.eisGeliefert*c.eisPreis
     &&w.mineVerkauft===s.stations[c.quellStation].lager.eis+iceRoute+w.eisGeliefert
     &&iceRoute===(a?.phase==='hin'?c.charge:0)
     &&s.stations[c.zielStation].lager.eis===w.eisGeliefert-w.eisVerbraucht
     &&s.stations[c.zielStation].lager.wasser===w.wasserProduziert-w.wasserVerbraucht
       -(s.w5q?.exported??0)
     &&w.eisVerbraucht+(s.w5r?.lostIce??0)===s.ledger.eis.consumed
     &&w.wasserProduziert===s.ledger.wasser.produced
     &&w.wasserVerbraucht===s.ledger.wasser.consumed
     &&w.wasserErlos===w.wasserVerbraucht*c.wasserPreis
     &&s.owners[c.kunde].cash===r.owners.find(o=>o.id===c.kunde).cash-w.wasserErlos
       +(s.w5o?.ausgezahlt??0)+(s.w5s?.orePilotWages??0)
       +Object.values(s.w5s?.industryWages?.paid??{}).reduce((n,x)=>n+x,0)
       +(s.w5q?.payout??0)+(s.w5s?.transferPilotWages??0)
     &&w.frachtBeauftragt===w.frachtAbgeschlossen+(a?1:0)
     &&w.kaufAusgaben===w.frachtBeauftragt*p.gesamt
     &&w.eisGeliefert===(w.frachtAbgeschlossen+(a?.phase==='rueck'?1:0))*c.charge
     &&w.frachtLohn===w.frachtAbgeschlossen*p.arbeit+(a?.gearbeitet??0)*c.fliegerLohn
     &&w.frachtUmsatz===w.frachtAbgeschlossen*p.fracht
     &&(s.owners.w5n_fracht_kauf?.cash||0)===(a?(a.phase==='hin'?p.gesamt:p.fracht):0)
     &&(s.owners.w5n_fracht_arbeit?.cash||0)===(a?p.arbeit-a.gearbeitet*c.fliegerLohn:0)
     &&(!a||(a.eis===p.eis&&a.fracht===p.fracht&&a.arbeit===p.arbeit
       &&a.zeit===p.zeit&&a.gearbeitet>=0&&a.gearbeitet<2*p.zeit
       &&s.ships[a.schiff]?.owner===(a.owner||c.frachterOwner)
       &&(!a.owner||(a.owner===s.w5s?.successor?.owner
          &&a.schiff===s.w5s.successor.ship)
          ||(a.owner===s.w5s?.newCarrierOrder?.buyer
            &&a.schiff===s.w5s.newCarrierOrder.ship
            &&s.w5s.newCarrierOrder.stage==='arrived'))))
     &&w.fabrikBegonnen===w.fabrikFertig+(f?1:0)
     &&w.fabrikGebucht===w.fabrikBegonnen*factoryCost
     &&w.fabrikBezahlt===w.fabrikFertig*factoryCost+(f?.gearbeitet??0)*c.fabrikLohn
     &&s.owners.w5n_arbeit.cash===w.fabrikBezahlt-(s.w5o?.lohnWasser??0)
     &&(s.owners.w5n_fabrik_arbeit?.cash||0)===w.fabrikGebucht-w.fabrikBezahlt
     &&w.eisVerbraucht===w.fabrikFertig*c.rezeptEis
     &&w.wasserProduziert===w.fabrikFertig*c.rezeptWasser
     &&s.minted===(s.w5q?.minted??0)&&s.burned===0;
   return {ok,eisAbgebaut:w.eisAbgebaut,eisVerkauft:w.mineVerkauft,
     eisGeliefert:w.eisGeliefert,wasserProduziert:w.wasserProduziert,
     wasserVerbraucht:w.wasserVerbraucht,waterBuyerCash:s.owners[c.kunde].cash,
     kundenZahlungen:w.wasserErlos,frachtAuftrag:a?.phase||'frei',
     fabrikAuftrag:f?'in_arbeit':'frei',knappheitsStunden:w.knappheitsStunden};
 }
