import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Isolated Node research registration. Never loaded by index.html or browser storage.
export const PROFILE='aphros-research:C1b-1:water-v1';
export const RULE_VERSION=3301;
const SOURCE_SHA='6274d118345d505bc3a147eb2e169a31a8c4ed4e1b6eca566f402b70a4ae217b';
const sha=x=>createHash('sha256').update(x).digest('hex');
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const check=(ok,message)=>{if(!ok)throw Error('C1b-1: '+message);};

// One bounded registration path; never accept arbitrary rule callbacks or patched audits.
export function createResearchCore({profile=PROFILE}={}){
 check([PROFILE,'aphros-research:C1b-2:material-precursor-v1'].includes(profile),'unbekanntes Forschungsprofil');
 const precursor=profile!==PROFILE;
 const version=precursor?3302:RULE_VERSION;
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
  water:m_core_w5n,income:m_core_w5o};`)(modules=>register(modules,{profile,version,precursor}));
 const rules=core.api.W5R_RULES;
 const fingerprint=sha(core.serialize.save(rules));
 function identity(s){
  check(s?.schema===8&&s.rulesVersion===version&&s.c1b?.profile===profile,'Profilwechsel verboten');
  check(s.c1b.rules===fingerprint,'Regel-Fingerprint falsch');
  check(s.w5o.mode==='wages'&&s.w5o.minerOwner==='npc3','Einkommensprofil falsch');
  check(!s.w5s&&s.w5q.mode==='off'&&['rate','dayCap','totalCap','exported','minted','payout','stationNet'].every(k=>s.w5q[k]===0)
   &&s.w5q.events.length===0&&s.minted===0&&s.burned===0,'Export/Mint/Rettung nicht Teil dieses Profils');
 }
 function audit(s){
  try{
   identity(s);const base=core.api.audit(s);
   check(base.ok,'Core-Audit '+JSON.stringify(Object.fromEntries(Object.entries(base).filter(([,v])=>v?.ok===false))));
   check(foerderAudit(s),'Arbeitsbelege');check(nachfrageAudit(s),'Nachfragebelege');
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
 const allowed=new Set([...(precursor?['shipFreight','stationRefine']:[]),'shipMine','shipWait','shipSellIce','shipFreightIce','stationWater','shipBuy']);
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
  return validate(s);
 }
 return Object.freeze({profile,rules,fingerprint,create,step,execute,audit,save,load,hash:core.api.hash,
  // Low-level module entrypoints permit adversarial double-call tests, never browser access.
  diagnostics:Object.freeze({mine:core.water.foerdern,income:core.income.einkommen,demand:core.water.nachfrage})});
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
function register({data,freeze,water,income,trade,state},{profile,version,precursor}){
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
