/* J2b-Silizium, ausschliesslich opt-in Forschungsregel201.
 * KEIN zweiter Wirtschaftstick; die Welt ruft minute() in ihrem Originaltick.
 * Geld via K1 Original-Doppelbuch, Physik via realem F6 Schiffszustand.
 */
(function(scope){
'use strict';
const create=({rules,FLUG,transfer,summe,ganz,ladungSumme,stillgelegt,pilot})=>{
  if(![201,202,203,204,205,206,207].includes(rules.rulesVersion)||!rules.j2b)
    throw Error('J2b: ungueltige Regel201-205');
  const C=rules.j2b,W=C.charge*C.minutenJeEinheit*C.lohnJeMinute,
    P=C.charge*C.preis;
  // W6/P8b NUR RULE205: endliche Felder, ein physischer Miner und EIN
  // Original-Minuten-/Kassen-/Warenbuch. Rule204 hat weiterhin genau
  // seine urspruengliche 16er-Lagerstaette und die unveraenderte Befehlsform.
  const zweifeld=[205,206,207].includes(rules.rulesVersion);
  const dravos=[206,207].includes(rules.rulesVersion);
  const fremdFracht=rules.rulesVersion===207;
  if(zweifeld&&(!C.nebenfeld||C.nebenfeld.system!==(dravos?'dravos':'nadir')
      ||C.feld.id!=='nadir-primaer'||C.nebenfeld.id!==(dravos?'dravos-silizium':'nadir-sekundaer')
      ||!Number.isSafeInteger(C.nebenfeld.vorrat)||C.nebenfeld.vorrat<=0
      ||C.nebenfeld.vorrat%C.charge!==0))
    throw Error('P8b: ungueltige endliche Zweitgeologie');
  const quellen=zweifeld?[C.feld,C.nebenfeld]:[C.feld];
  const stand=()=>Object.fromEntries(quellen.map(f=>[f.id,{
    vorrat:f.vorrat,gefoerdert:0,verkauft:0
  }]));
  const leer=()=>({vorrat:quellen.reduce((n,f)=>n+f.vorrat,0),
    auftraege:0,gefoerdert:0,verkauft:0,arbeitsMinuten:0,belege:[],auftrag:null,
    ...(zweifeld?{felder:stand()}:{})});
  const quelle=id=>zweifeld?quellen.find(f=>f.id===id):C.feld;
  const feld=(sh,id)=>{
    const f=quelle(id);
    if(!f||!sh||sh.klasse!=='miner'||sh.system!==f.system
      ||sh.flug?.lage!=='frei')return false;
    const b=sh.flug,dx=b.x-f.x,dy=b.y-f.y;
    return dx*dx+dy*dy<=f.radius*f.radius
      &&b.vx*b.vx+b.vy*b.vy<=FLUG.DATEN.abbau.tempo**2;
  };
  const konto=(s,id)=>{
    if(!s.owners[id])s.owners[id]={id,kind:'k1-reserve',cash:0};
    return s.owners[id];
  };
  function pruefen(s,cmd){
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||!['siliconMineStart','siliconSell'].includes(cmd.type)
      ||Object.keys(cmd).sort().join()!==
        (zweifeld&&cmd.type==='siliconMineStart'?'feld,owner,schiff,type':'owner,schiff,type'))
      return 'J2b: strenge Befehlsform';
    const b=s.kanon.silizium,sh=s.ships[cmd.schiff],a=b?.auftrag;
    // Rule207: die Ware ist im fremden TRANSPORT-Frachter nur in Obhut.
    // Eigentum und die bereits gebundene Nadir-Kaufreserve bleiben bei NPC3.
    const fracht=fremdFracht&&cmd.type==='siliconSell'
      &&cmd.owner==='transport'&&sh?.owner==='transport'
      &&sh?.klasse==='frachter'&&a?.owner==='npc3'
      &&a?.feld==='dravos-silizium'
      &&s.kanon.p8d?.auftrag?.frachter===sh.id
      &&s.kanon.p8d?.auftrag?.miner===a.schiff
      &&s.kanon.p8d?.auftrag?.phase==='ankunft';
    if(!b||!sh||(!fracht&&(sh.owner!==cmd.owner||sh.klasse!=='miner'
      ||(!dravos&&sh.system!=='nadir')||sh.heimat!=='nadir'
      ||(dravos&&!['nadir','dravos'].includes(sh.system))
      ||!['house','npc3'].includes(cmd.owner)
      ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===sh.id&&k.owner===cmd.owner))))
      return 'J2b: nur rechtmaessig in Nadir gekaufte K2-Miner';
    const zielFeld=cmd.type==='siliconMineStart'?quelle(cmd.feld):null;
    const zielDock=dravos&&zielFeld?.system==='dravos'?'st_dravos':C.station;
    if(sh.flug?.lage!=='angedockt'||sh.flug.anker!==zielDock
      ||sh.phase!=='dock'||sh.auftrag!=='halten'
      ||(cmd.type==='siliconMineStart'&&sh.system!==zielFeld?.system)
      ||(cmd.type==='siliconSell'&&sh.system!=='nadir'))
      return 'J2b: nur am wirklichen Förder-/Nadir-Käufer-Dock';
    // Für Dravos genügt die Ortsangabe nicht: keine durch manipulierte Saves
    // vorgetäuschte kostenlose Fernstationierung.
    if(dravos&&sh.system==='dravos'&&
      !s.kanon.p8c?.reisen?.some(x=>x.schiff===sh.id
        &&x.nach==='dravos'&&x.ende!==null&&x.ende<=s.tick))
      return 'P8c: keine originale bezahlte Einreise nach Dravos';
    if(cmd.type==='siliconMineStart'){
      if(b.auftrag||b.vorrat<C.charge||ladungSumme(sh)>0
        ||stillgelegt(s,sh)
        ||(zweifeld && (!quelle(cmd.feld)||b.felder?.[cmd.feld]?.vorrat<C.charge)))
        return 'J2b: Feld, Frachtraum oder Auftrag blockiert';
      if(s.owners[cmd.owner].cash<W)return 'J2b: Foerderarbeit nicht vorfinanziert';
      if(s.owners[C.station].cash<P)return 'J2b: Siliziumankauf nicht vorfinanziert';
      if((s.stations[C.station].lager.silizium||0)+C.charge>rules.world.obergrenze)
        return 'J2b: kein Lagerplatz';
    }else{
      const a=b.auftrag;
      if(!a||(fracht ? (a.owner!=='npc3'||a.schiff===sh.id) :
          (a.schiff!==sh.id||a.owner!==cmd.owner))
        ||a.gefoerdert!==C.charge||a.gearbeitet!==C.charge*C.minutenJeEinheit
        ||sh.ladung.silizium!==C.charge)
        return 'J2b: nur vollstaendig gefoerderte echte Ware verkaufen';
    }
    return null;
  }
  function ausfuehren(s,cmd){
    const fehler=pruefen(s,cmd);
    if(fehler)return {ok:false,type:cmd?.type,reason:fehler};
    const b=s.kanon.silizium,sh=s.ships[cmd.schiff];
    if(cmd.type==='siliconMineStart'){
      if(konto(s,'k1_silizium_arbeit').cash!==0
        ||konto(s,'k1_silizium_kauf').cash!==0)
        throw Error('J2b: Treuhand nicht frei');
      transfer(s,cmd.owner,'k1_silizium_arbeit',W,'silizium-arbeitsreserve');
      transfer(s,C.station,'k1_silizium_kauf',P,'silizium-kaufreserve');
      b.auftrag={schiff:sh.id,owner:cmd.owner,menge:C.charge,gearbeitet:0,gefoerdert:0,
        ...(zweifeld?{feld:cmd.feld}:{})};
      b.auftraege++;
    }else{
      const a=b.auftrag;
      sh.ladung.silizium-=a.menge;
      if(sh.ladung.silizium===0)delete sh.ladung.silizium;
      s.stations[C.station].lager.silizium+=a.menge;
      // Verkaufserloes an EIGENTUEMER, nicht an den bloßen Spediteur.
      transfer(s,'k1_silizium_kauf',a.owner,a.menge*C.preis,'silizium-ankauf');
      b.verkauft+=a.menge;
      if(zweifeld)b.felder[a.feld].verkauft+=a.menge;
      b.belege.push({schiff:a.schiff,owner:a.owner,tick:s.tick,
        menge:a.menge,preis:a.menge*C.preis,arbeit:a.gearbeitet*C.lohnJeMinute,
        ...(zweifeld?{feld:a.feld}:{})});
      b.auftrag=null;
    }
    return {ok:true,type:cmd.type};
  }
  function minute(s){
    const b=s.kanon.silizium,a=b.auftrag;
    if(!a||a.gefoerdert===a.menge)return;
    const sh=s.ships[a.schiff];
    if(!feld(sh,a.feld)||s.kanon.flugdienst[sh.id]?.gestrandet)return;
    if(s.owners.k1_silizium_arbeit.cash<C.lohnJeMinute)
      throw Error('J2b: unbezahlte Siliziumarbeit');
    transfer(s,'k1_silizium_arbeit',pilot[a.owner],
      C.lohnJeMinute,'silizium-arbeitslohn');
    a.gearbeitet++;b.arbeitsMinuten++;
    if(a.gearbeitet%C.minutenJeEinheit===0){
      if(b.vorrat===0||ladungSumme(sh)>=rules.economy.cargo
        ||(zweifeld&&b.felder[a.feld].vorrat===0))
        throw Error('J2b: Feld oder Frachtraum erschoepft');
      sh.ladung.silizium=(sh.ladung.silizium||0)+1;
      s.ledger.silizium.mined++;
      b.gefoerdert++;a.gefoerdert++;b.vorrat--;
      if(zweifeld){b.felder[a.feld].gefoerdert++;b.felder[a.feld].vorrat--;}
    }
  }
  function audit(s){
    const b=s.kanon.silizium,a=b?.auftrag,l=s.ledger.silizium;
    if(!b||!['vorrat','auftraege','gefoerdert','verkauft','arbeitsMinuten'].every(k=>ganz(b[k]))
      ||b.vorrat!==quellen.reduce((n,f)=>n+f.vorrat,0)-b.gefoerdert
      ||b.gefoerdert>quellen.reduce((n,f)=>n+f.vorrat,0)
      ||b.gefoerdert<b.verkauft||b.verkauft%C.charge!==0
      ||b.auftraege!==b.verkauft/C.charge+(a?1:0)
      ||!Array.isArray(b.belege)||b.belege.length!==b.verkauft/C.charge
      ||b.arbeitsMinuten!==b.gefoerdert*C.minutenJeEinheit
        +(a?a.gearbeitet-a.gefoerdert*C.minutenJeEinheit:0)
      ||!l||l.initial!==0||l.mined!==b.gefoerdert||l.produced!==0
      ||l.consumed!==(s.kanon.bauteile?.siliziumVerbraucht||0)||l.imported!==0||l.exported!==0
      ||s.stations[C.station].lager.silizium!==b.verkauft-(s.kanon.bauteile?.siliziumVerbraucht||0)
      ||summe(s,'silizium-arbeitsreserve')!==b.auftraege*W
      ||summe(s,'silizium-arbeitslohn')!==b.arbeitsMinuten*C.lohnJeMinute
      ||summe(s,'silizium-kaufreserve')!==b.auftraege*P
      ||summe(s,'silizium-ankauf')!==b.verkauft*C.preis
      ||(s.owners.k1_silizium_arbeit?.cash||0)!==
         b.auftraege*W-b.arbeitsMinuten*C.lohnJeMinute
      ||(s.owners.k1_silizium_kauf?.cash||0)!==
         b.auftraege*P-b.verkauft*C.preis)return false;
    const keys=new Set();
    if(b.belege.some(e=>{
      const sh=s.ships[e?.schiff],key=e?.tick+'|'+e?.schiff;
      if(!e||Object.keys(e).sort().join()!==
          (zweifeld?'arbeit,feld,menge,owner,preis,schiff,tick':'arbeit,menge,owner,preis,schiff,tick')
        ||(zweifeld&&!quelle(e.feld))
        ||keys.has(key)||!ganz(e.tick)||e.tick>s.tick||e.menge!==C.charge
        ||e.preis!==P||e.arbeit!==W||!sh||sh.klasse!=='miner'
        ||sh.owner!==e.owner||sh.heimat!=='nadir'
        ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===e.schiff))return true;
      keys.add(key);return false;
    }))return false;
    const onBoard=Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung.silizium||0),0);
    if(onBoard!==b.gefoerdert-b.verkauft)return false;
    if(a&&(!ganz(a.gearbeitet)||a.gearbeitet>C.charge*C.minutenJeEinheit
      ||(zweifeld&&(Object.keys(a).sort().join()!=='feld,gearbeitet,gefoerdert,menge,owner,schiff'
        ||!quelle(a.feld)))
      ||a.gefoerdert!==Math.floor(a.gearbeitet/C.minutenJeEinheit)
      ||a.menge!==C.charge||!['house','npc3'].includes(a.owner)
      ||s.ships[a.schiff]?.owner!==a.owner
      ||(s.ships[a.schiff]?.ladung.silizium||0)!==
         (fremdFracht&&s.kanon.p8d?.auftrag?.miner===a.schiff
          &&['rueckBereit','rueck','ankunft'].includes(s.kanon.p8d.auftrag.phase)
          ?0:a.gefoerdert)
      ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===a.schiff)))return false;
    if(zweifeld){
      if(!b.felder||typeof b.felder!=='object'||Array.isArray(b.felder)
        ||Object.keys(b.felder).sort().join()!==quellen.map(f=>f.id).sort().join()
        ||quellen.some(f=>{
          const fstate=b.felder[f.id],belege=b.belege.filter(e=>e.feld===f.id);
          return !fstate||typeof fstate!=='object'||Array.isArray(fstate)
            ||Object.keys(fstate).sort().join()!=='gefoerdert,verkauft,vorrat'
            ||!['gefoerdert','verkauft','vorrat'].every(k=>ganz(fstate[k]))
            ||fstate.vorrat!==f.vorrat-fstate.gefoerdert
            ||fstate.gefoerdert>f.vorrat
            ||fstate.verkauft!==belege.length*C.charge
            ||fstate.gefoerdert!==fstate.verkauft
              +(a?.feld===f.id?a.gefoerdert:0);
        })
        ||quellen.reduce((n,f)=>n+b.felder[f.id].gefoerdert,0)!==b.gefoerdert
        ||quellen.reduce((n,f)=>n+b.felder[f.id].verkauft,0)!==b.verkauft
        ||quellen.reduce((n,f)=>n+b.felder[f.id].vorrat,0)!==b.vorrat)
        return false;
    }else if(b.felder!==undefined)return false;
    return true;
  }
  return Object.freeze({C,leer,feld,pruefen,ausfuehren,minute,audit});
};
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.J2bSilizium=api;
})(globalThis);
