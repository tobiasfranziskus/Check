/* U9d: research-only paired long-horizon comparison, existing policy knob.
 * All actual purchases, production and travel remain original core commands.
 */
'use strict';
const assert=require('node:assert/strict');
const {lauf}=require('./m4-management-szenarien.cjs');
const {restAktivMinuten,vorpruefung}=require('./m4-u9-vertragsvorsorge.cjs');
const {SZENARIEN,pruefen}=require('./w6-szenarien.cjs');

function simulation(sz,tage,seed,mode,vorlauf){
 const stats={vorsorge:0,abrechnung:0,abgelehnt:0,belege:[],gruende:{}};
 const add=(obj,key)=>{obj[key]=(obj[key]||0)+1;};
 // An explicit override explores an existing policy parameter, not a new rule.
 const scenario=vorlauf===undefined?sz:{...sz,politik:{...sz.politik,ersatzVorlaufProzent:vorlauf}};
 let letzteProbe=-1440;
 const report=lauf(scenario,tage,seed,true,'konzerne',mode==='original'?null:{
   vorEntscheidung(welt,s){
     const i=s.kanon.industrieErz,a=s.w3.auftrag;
     // Only mathematically insufficient minimum mining time needs a costly
     // original-command counterfactual. No automatic cancellation on estimate.
     if(i?.phase==='angebot'&&i.carrier==='house'&&!i.signFracht&&!a){
       const rest=restAktivMinuten(welt,s,i.miner);
       const minimum=Math.ceil(welt.rules.w3.fracht/welt.rules.economy.miningRate);
       if(rest!==null&&rest<minimum){
         const p=vorpruefung(welt,s);
         if(p.status==='STILLLEGUNG_VOR_VOLLER_CHARGE'){
           const r=welt.execute(s,{type:'industrialOreCancel',owner:'st_nadir'});
           assert.equal(r.ok,true,r.reason);assert.deepEqual(pruefen(welt,s),[]);
           stats.vorsorge++;
           stats.belege.push({typ:'vorsorge',tick:s.tick,miner:i.miner,rest,probeHash:p.probeHash});
         }
       }
     }
     if(mode!=='kombiniert'||a?.phase!=='vorbestellt'||i?.phase!=='aktiv'||
        s.tick-letzteProbe<1440)return;
     const mi=s.ships[a.industrieMiner];
     if(!mi||!welt.stillgelegt(s,mi.id)||mi.flug?.lage!=='angedockt'||!(mi.ladung.erz>0))return;
     letzteProbe=s.tick;
     const vor=welt.save(s),hash=welt.hash(s);
     const q=welt.u9TeilabrechnungProbe(s,{hash,parteien:['st_nadir','st_aldera','npc3',i.carrier??'transport','werft_extern']});
     assert.equal(welt.save(s),vor);
     if(!q.ok){stats.abgelehnt++;add(stats.gruende,q.reason);return;}
     const neu=welt.load(q.json);
     assert.equal(neu.w3.auftrag,null);assert.deepEqual(pruefen(welt,neu),[]);
     stats.abrechnung++;
     stats.belege.push({typ:'abrechnung',tick:s.tick,miner:mi.id,...q.abrechnung,vor:hash,nach:q.hash});
     return q.json;
   }
 });
 const end=report.verlauf.at(-1);
 const compact=report.verlauf.map(v=>({tag:v.tag,hash:v.hash,gebunden:v.gebunden,
   eis:v.auftraege.eisfrachten,erz:v.auftraege.erzfrachten,
   wasser:v.auftraege.rueckfrachtWasser,minerGebaut:v.produktion.minerGebaut,
   minerGeliefert:v.produktion.minerGeliefert,frachterGebaut:v.produktion.frachterGebaut,
   kasse:v.kassen.house,meridian:v.kassen.npc3,stilllegungen:v.stilllegungen.length,
   lager:v.lager,weltgeld:v.weltgeld}));
 for(const v of compact)assert.equal(v.weltgeld,33000);
 return {szenario:sz.id,seed,tage,mode,vorlauf:vorlauf??'original',stats,
  verlauf:compact,ende:{hash:end.hash,aktiveAuftraege:end.aktiveAuftraege,
    entscheidungen:end.entscheidungen,huellen:end.huellen,kassen:end.kassen,
    folgefahrten:report.folgefahrten}};
}
module.exports={simulation};
if(require.main===module){
 const [id='S02',dauer='90',seed='42',mode='kombiniert',vorlauf='original',replay='0']=process.argv.slice(2);
 const sz=SZENARIEN.find(x=>x.id===id);
 assert.ok(sz&&Number.isSafeInteger(+dauer)&&+dauer>0&&+dauer<=730&&Number.isSafeInteger(+seed));
 assert.ok(['original','vorsorge','kombiniert'].includes(mode));
 assert.ok(vorlauf==='original'||['40','60','80'].includes(vorlauf));
 const args=[sz,+dauer,+seed,mode,vorlauf==='original'?undefined:+vorlauf];
 const result=simulation(...args);
 if(replay==='1')assert.deepEqual(simulation(...args),result);
 console.log(JSON.stringify(result));
}
