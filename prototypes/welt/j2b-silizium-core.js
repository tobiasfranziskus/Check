/* J2b-Silizium, ausschliesslich opt-in Forschungsregel201.
 * KEIN zweiter Wirtschaftstick; die Welt ruft minute() in ihrem Originaltick.
 * Geld via K1 Original-Doppelbuch, Physik via realem F6 Schiffszustand.
 */
(function(scope){
'use strict';
const create=({rules,FLUG,transfer,summe,ganz,ladungSumme,stillgelegt,pilot})=>{
  if(![201,202,203].includes(rules.rulesVersion)||!rules.j2b)throw Error('J2b: nur Regel201/202-Forschungsprofil');
  const C=rules.j2b,W=C.charge*C.minutenJeEinheit*C.lohnJeMinute,
    P=C.charge*C.preis;
  const leer=()=>({vorrat:C.feld.vorrat,auftraege:0,gefoerdert:0,
    verkauft:0,arbeitsMinuten:0,belege:[],auftrag:null});
  const feld=sh=>{
    if(!sh||sh.klasse!=='miner'||sh.system!==C.feld.system
      ||sh.flug?.lage!=='frei')return false;
    const b=sh.flug,dx=b.x-C.feld.x,dy=b.y-C.feld.y;
    return dx*dx+dy*dy<=C.feld.radius*C.feld.radius
      &&b.vx*b.vx+b.vy*b.vy<=FLUG.DATEN.abbau.tempo**2;
  };
  const konto=(s,id)=>{
    if(!s.owners[id])s.owners[id]={id,kind:'k1-reserve',cash:0};
    return s.owners[id];
  };
  function pruefen(s,cmd){
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||!['siliconMineStart','siliconSell'].includes(cmd.type)
      ||Object.keys(cmd).sort().join()!=='owner,schiff,type')
      return 'J2b: strenge Befehlsform';
    const b=s.kanon.silizium,sh=s.ships[cmd.schiff];
    if(!b||!sh||sh.owner!==cmd.owner||sh.klasse!=='miner'
      ||sh.system!=='nadir'||sh.heimat!=='nadir'
      ||!['house','npc3'].includes(cmd.owner)
      ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===sh.id&&k.owner===cmd.owner))
      return 'J2b: nur rechtmaessig in Nadir gekaufte K2-Miner';
    if(sh.flug?.lage!=='angedockt'||sh.flug.anker!==C.station
      ||sh.phase!=='dock'||sh.auftrag!=='halten')
      return 'J2b: Miner muss am Nadir-Dock stehen';
    if(cmd.type==='siliconMineStart'){
      if(b.auftrag||b.vorrat<C.charge||ladungSumme(sh)>0
        ||stillgelegt(s,sh))return 'J2b: Feld, Frachtraum oder Auftrag blockiert';
      if(s.owners[cmd.owner].cash<W)return 'J2b: Foerderarbeit nicht vorfinanziert';
      if(s.owners[C.station].cash<P)return 'J2b: Siliziumankauf nicht vorfinanziert';
      if((s.stations[C.station].lager.silizium||0)+C.charge>rules.world.obergrenze)
        return 'J2b: kein Lagerplatz';
    }else{
      const a=b.auftrag;
      if(!a||a.schiff!==sh.id||a.owner!==cmd.owner
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
      b.auftrag={schiff:sh.id,owner:cmd.owner,menge:C.charge,gearbeitet:0,gefoerdert:0};
      b.auftraege++;
    }else{
      const a=b.auftrag;
      sh.ladung.silizium-=a.menge;
      if(sh.ladung.silizium===0)delete sh.ladung.silizium;
      s.stations[C.station].lager.silizium+=a.menge;
      transfer(s,'k1_silizium_kauf',cmd.owner,a.menge*C.preis,'silizium-ankauf');
      b.verkauft+=a.menge;
      b.belege.push({schiff:sh.id,owner:cmd.owner,tick:s.tick,
        menge:a.menge,preis:a.menge*C.preis,arbeit:a.gearbeitet*C.lohnJeMinute});
      b.auftrag=null;
    }
    return {ok:true,type:cmd.type};
  }
  function minute(s){
    const b=s.kanon.silizium,a=b.auftrag;
    if(!a||a.gefoerdert===a.menge)return;
    const sh=s.ships[a.schiff];
    if(!feld(sh)||s.kanon.flugdienst[sh.id]?.gestrandet)return;
    if(s.owners.k1_silizium_arbeit.cash<C.lohnJeMinute)
      throw Error('J2b: unbezahlte Siliziumarbeit');
    transfer(s,'k1_silizium_arbeit',pilot[a.owner],
      C.lohnJeMinute,'silizium-arbeitslohn');
    a.gearbeitet++;b.arbeitsMinuten++;
    if(a.gearbeitet%C.minutenJeEinheit===0){
      if(b.vorrat===0||ladungSumme(sh)>=rules.economy.cargo)
        throw Error('J2b: Feld oder Frachtraum erschoepft');
      sh.ladung.silizium=(sh.ladung.silizium||0)+1;
      s.ledger.silizium.mined++;
      b.gefoerdert++;a.gefoerdert++;b.vorrat--;
    }
  }
  function audit(s){
    const b=s.kanon.silizium,a=b?.auftrag,l=s.ledger.silizium;
    if(!b||!['vorrat','auftraege','gefoerdert','verkauft','arbeitsMinuten'].every(k=>ganz(b[k]))
      ||b.vorrat!==C.feld.vorrat-b.gefoerdert||b.gefoerdert>C.feld.vorrat
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
      if(!e||Object.keys(e).sort().join()!=='arbeit,menge,owner,preis,schiff,tick'
        ||keys.has(key)||!ganz(e.tick)||e.tick>s.tick||e.menge!==C.charge
        ||e.preis!==P||e.arbeit!==W||!sh||sh.klasse!=='miner'
        ||sh.owner!==e.owner||sh.heimat!=='nadir'
        ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===e.schiff))return true;
      keys.add(key);return false;
    }))return false;
    const onBoard=Object.values(s.ships).reduce((n,sh)=>n+(sh.ladung.silizium||0),0);
    if(onBoard!==b.gefoerdert-b.verkauft)return false;
    if(a&&(!ganz(a.gearbeitet)||a.gearbeitet>C.charge*C.minutenJeEinheit
      ||a.gefoerdert!==Math.floor(a.gearbeitet/C.minutenJeEinheit)
      ||a.menge!==C.charge||!['house','npc3'].includes(a.owner)
      ||s.ships[a.schiff]?.owner!==a.owner
      ||(s.ships[a.schiff]?.ladung.silizium||0)!==a.gefoerdert
      ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===a.schiff)))return false;
    return true;
  }
  return Object.freeze({C,leer,feld,pruefen,ausfuehren,minute,audit});
};
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.J2bSilizium=api;
})(globalThis);
