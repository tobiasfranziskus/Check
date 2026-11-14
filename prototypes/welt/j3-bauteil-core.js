/* Aphros Void J3 - finanzierte Bauteile, NUR ausdrueckliches Regel202-Profil.
 * Das exakt vorhandene r_bauteil Rezept 2 Material + 1 Silizium -> 1 Bauteil
 * wird vom rechtmaessigen Stationseigentuemer st_nadir abgearbeitet.
 * Gleicher W0-W5-Kern, K1-Doppelbuchungen und autoritativer Wirtschaftstick.
 * Material ist bereits W4-produziert/bezahlt, Silizium J2b-finanziert.
 * Keine zweite Industrie, keine neuen ISK, keine Jäger-/Kopfgeld-Spawns.
 */
(function(scope){
'use strict';
const create=({rules,transfer,summe,ganz})=>{
  if(![202,203,204].includes(rules.rulesVersion)||!rules.j3)throw Error('J3: nur isolierte Regel202/203');
  const C=rules.j3,PAID=C.dauer*C.lohnJeMinute;
  const leer=()=>({begonnen:0,abgeschlossen:0,materialVerbraucht:0,
    siliziumVerbraucht:0,bauteile:0,arbeitsGebunden:0,arbeitsGezahlt:0,
    belege:[],auftrag:null});
  const fehler=(s,cmd)=>{
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||Object.keys(cmd).sort().join()!=='owner,station,type'
      ||cmd.type!=='stationBuildParts')return 'J3: unbekannter oder unerlaubt erweiterter Auftrag';
    if(cmd.owner!==C.owner||cmd.station!==C.station)
      return 'J3: nur eigene Nadir-Industriekasse';
    const b=s.kanon?.bauteile,st=s.stations[C.station];
    if(!b||!st||b.auftrag)return 'J3: ungueltige oder bereits belegte Produktion';
    if((st.lager.material||0)<C.material)return 'J3: nicht genug wirkliches W4-Material';
    if((st.lager.silizium||0)<C.silizium)return 'J3: kein wirklich geliefertes J2b-Silizium';
    if((st.lager.bauteil||0)+C.proCharge>200)return 'J3: kein Lagerplatz fuer Fertigbauteil';
    if(s.owners[C.owner]?.cash<PAID)return 'J3: Arbeitslohn nicht vorfinanziert';
    if((s.owners.j3_arbeit_treuhand?.cash||0)!==0)return 'J3: Lohntreuhand nicht frei';
    if(!audit(s))return 'J3: bestehende Material-/Silizium- oder Lohnbelege ungueltig';
    return null;
  };
  function ausfuehren(s,cmd){
    const f=fehler(s,cmd);
    if(f)return {ok:false,type:cmd?.type,reason:f};
    if(!s.owners.j3_arbeit_treuhand)
      s.owners.j3_arbeit_treuhand={id:'j3_arbeit_treuhand',kind:'k1-reserve',cash:0};
    transfer(s,C.owner,'j3_arbeit_treuhand',PAID,'j3-arbeitsreserve');
    const st=s.stations[C.station],b=s.kanon.bauteile;
    st.lager.material-=C.material;
    st.lager.silizium-=C.silizium;
    s.ledger.material.consumed+=C.material;
    s.ledger.silizium.consumed+=C.silizium;
    b.materialVerbraucht+=C.material;b.siliziumVerbraucht+=C.silizium;
    b.arbeitsGebunden+=PAID;b.begonnen++;
    b.auftrag={tick:s.tick,gearbeitet:0};
    return {ok:true,type:cmd.type,arbeit:PAID};
  }
  function minute(s){
    const b=s.kanon.bauteile,a=b.auftrag;
    if(!a)return;
    if(s.owners.j3_arbeit_treuhand?.cash<C.lohnJeMinute)
      throw Error('J3: nicht bezahlte Arbeitsminute');
    transfer(s,'j3_arbeit_treuhand',C.arbeit,C.lohnJeMinute,'j3-arbeitslohn');
    a.gearbeitet++;b.arbeitsGezahlt+=C.lohnJeMinute;
    if(a.gearbeitet<C.dauer)return;
    if(a.gearbeitet!==C.dauer||s.owners.j3_arbeit_treuhand.cash!==0)
      throw Error('J3: Arbeitszeit/Treuhand ungueltig');
    const st=s.stations[C.station];
    st.lager.bauteil=(st.lager.bauteil||0)+C.proCharge;
    s.ledger.bauteil.produced+=C.proCharge;
    b.bauteile+=C.proCharge;b.abgeschlossen++;
    b.belege.push({start:a.tick,ende:s.tick,owner:C.owner,
      material:C.material,silizium:C.silizium,
      bauteile:C.proCharge,lohn:PAID});
    b.auftrag=null;
  }
  function audit(s){
    const b=s.kanon?.bauteile,a=b?.auftrag;
    if(!b||!Array.isArray(b.belege)
      ||!['begonnen','abgeschlossen','materialVerbraucht','siliziumVerbraucht',
         'bauteile','arbeitsGebunden','arbeitsGezahlt'].every(k=>ganz(b[k]))
      ||b.begonnen!==b.abgeschlossen+(a?1:0)
      ||b.materialVerbraucht!==b.begonnen*C.material
      ||b.siliziumVerbraucht!==b.begonnen*C.silizium
      ||b.bauteile!==b.abgeschlossen*C.proCharge
      ||b.arbeitsGebunden!==b.begonnen*PAID
      ||b.arbeitsGezahlt!==(b.abgeschlossen*C.dauer+(a?.gearbeitet||0))*C.lohnJeMinute
      ||b.belege.length!==b.abgeschlossen
      ||(a&&(!ganz(a.tick)||a.tick>s.tick
        ||!ganz(a.gearbeitet)||a.gearbeitet>=C.dauer))
      ||s.ledger.bauteil?.initial!==0
      ||s.ledger.bauteil?.produced!==b.bauteile
      ||s.ledger.bauteil?.mined!==0
      ||s.ledger.bauteil?.consumed!==(s.kanon.jaeger?.bauteileVerbraucht||0)
      ||s.ledger.bauteil?.imported!==0||s.ledger.bauteil?.exported!==0
      ||s.stations[C.station].lager.bauteil!==b.bauteile-(s.kanon.jaeger?.bauteileVerbraucht||0)
      ||summe(s,'j3-arbeitsreserve')!==b.arbeitsGebunden
      ||summe(s,'j3-arbeitslohn')!==b.arbeitsGezahlt
      ||(s.owners.j3_arbeit_treuhand?.cash||0)!==
        b.arbeitsGebunden-b.arbeitsGezahlt
      ||s.owners[C.arbeit]?.cash!==b.arbeitsGezahlt)return false;
    for(let i=0;i<b.belege.length;i++){
      const e=b.belege[i];
      if(!e||Object.keys(e).sort().join()!=='bauteile,ende,lohn,material,owner,silizium,start'
        ||!ganz(e.start)||!ganz(e.ende)||e.start>e.ende||e.ende>s.tick
        ||e.owner!==C.owner||e.material!==C.material||e.silizium!==C.silizium
        ||e.bauteile!==C.proCharge||e.lohn!==PAID
        ||(i>0&&e.start<b.belege[i-1].ende))return false;
    }
    return true;
  }
  return Object.freeze({C,leer,fehler,ausfuehren,minute,audit});
};
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.J3Bauteile=api;
})(globalThis);
