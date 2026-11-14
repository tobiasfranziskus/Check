/* Aphros Void J4b · isolierte Regel203-Forschung: erste bezahlte Jägerhülle.
 * Original R14-Rezept r_jaeger: 8 Bauteile + 4 Material -> 1 Jäger in 32 Minuten.
 * Nadir besitzt das reale, aus J3/J4a finanzierte Lager. Lohn aus Nadir-ISK.
 * Schiffs-ID und 900-ISK-Kauf durch den vorhandenen Original-m_core_commands,
 * nie eine simulierte Gratis-Hülle; Kampf und Kopfgeld sind NICHT aktiviert.
 */
(function(scope){
'use strict';
const create=({rules,transfer,summe,ganz})=>{
  if(![203,204].includes(rules.rulesVersion)||!rules.j4)
    throw Error('J4b: nur explizites Regel203-Profil');
  const C=rules.j4,L=C.dauer*C.lohnJeMinute;
  const leer=()=>({begonnen:0,fertig:0,verkauft:0,materialVerbraucht:0,
    bauteileVerbraucht:0,lohnGebunden:0,lohnBezahlt:0,
    auftrag:null,belege:[],kaeufe:[]});
  function pruefen(s,cmd){
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||Object.keys(cmd).sort().join()!=='owner,station,type'
      ||cmd.type!=='stationBuildFighter')
      return 'J4b: nur strenger Jäger-Werftauftrag';
    if(cmd.owner!==C.owner||cmd.station!==C.station)
      return 'J4b: nur Nadir als echter Materialeigentümer';
    const b=s.kanon?.jaeger,st=s.stations[C.station];
    if(!b||!st||b.auftrag||s.w5?.auftrag||s.kanon.minerWerft?.auftrag)
      return 'J4b: Werft belegt oder Auftragsbuch fehlt';
    if(st.lager.bauteil<C.bauteile||st.lager.material<C.material)
      return 'J4b: acht echte Bauteile und vier echte Material fehlen';
    if((st.lager.jaeger||0)>=C.lagerMax)
      return 'J4b: Jägerlager voll';
    if(s.owners[C.owner].cash<L||s.owners.j4_arbeit_treuhand?.cash>0)
      return 'J4b: 32 ISK Arbeit fehlen oder doppelt gebunden';
    if(!audit(s))return 'J4b: Material-/Lohn-/Eigentumsbuch manipuliert';
    return null;
  }
  function bauen(s,cmd){
    const f=pruefen(s,cmd);
    if(f)return {ok:false,type:cmd?.type,reason:f};
    const b=s.kanon.jaeger,st=s.stations[C.station];
    if(!s.owners.j4_arbeit_treuhand)
      s.owners.j4_arbeit_treuhand={id:'j4_arbeit_treuhand',kind:'k1-reserve',cash:0};
    transfer(s,C.owner,'j4_arbeit_treuhand',L,'j4-arbeitsreserve');
    st.lager.bauteil-=C.bauteile;st.lager.material-=C.material;
    s.ledger.bauteil.consumed+=C.bauteile;
    s.ledger.material.consumed+=C.material;
    b.bauteileVerbraucht+=C.bauteile;b.materialVerbraucht+=C.material;
    b.lohnGebunden+=L;b.begonnen++;
    b.auftrag={start:s.tick,gearbeitet:0};
    return {ok:true,type:cmd.type};
  }
  function minute(s){
    const b=s.kanon.jaeger,a=b.auftrag;
    if(!a)return;
    if(s.owners.j4_arbeit_treuhand?.cash<C.lohnJeMinute)
      throw Error('J4b: unbezahlte Werftminute');
    transfer(s,'j4_arbeit_treuhand',C.arbeiter,C.lohnJeMinute,'j4-arbeitslohn');
    a.gearbeitet++;b.lohnBezahlt+=C.lohnJeMinute;
    if(a.gearbeitet<C.dauer)return;
    if(a.gearbeitet!==C.dauer||s.owners.j4_arbeit_treuhand.cash!==0)
      throw Error('J4b: Arbeit ohne vollständige Vorfinanzierung');
    const lager=s.stations[C.station].lager;
    lager.jaeger++;s.ledger.jaeger.produced++;
    b.fertig++;
    b.belege.push({start:a.start,ende:s.tick,
      station:C.station,bauteile:C.bauteile,material:C.material,lohn:L});
    b.auftrag=null;
  }
  function kaufPruefen(s,cmd){
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||Object.keys(cmd).sort().join()!=='klasse,owner,station,type'
      ||cmd.type!=='shipBuy'||cmd.owner!=='house'||cmd.station!==C.station
      ||cmd.klasse!=='jaeger')return 'J4b: nur echter persönlicher Nadir-Jägerkauf';
    const b=s.kanon.jaeger;
    if(!audit(s)||b.auftrag)return 'J4b: Werft-/Eigentumsbeleg fehlerhaft';
    if(s.stations[C.station].lager.jaeger<1||b.fertig-b.verkauft<1)
      return 'J4b: noch kein bezahlter Jäger im Lager';
    if(s.owners[cmd.owner].cash<C.verkaufspreis)
      return 'J4b: 900 ISK für den Jägerkauf fehlen';
    return null;
  }
  function kaufVerbuchen(s,cmd,shipId){
    const b=s.kanon.jaeger,sh=s.ships[shipId];
    if(!sh||sh.id!==shipId||sh.owner!==cmd.owner||sh.klasse!=='jaeger'
      ||sh.system!=='nadir'||sh.heimat!=='nadir'
      ||sh.phase!=='dock'||sh.flug?.lage!=='angedockt'
      ||sh.flug.anker!==C.station)
      throw Error('J4b: Originalkauf lieferte kein echtes Nadir-Schiff');
    b.verkauft++;
    b.kaeufe.push({id:shipId,tick:s.tick,owner:cmd.owner,
      station:C.station,preis:C.verkaufspreis});
  }
  function audit(s){
    const b=s.kanon?.jaeger,a=b?.auftrag,l=s.stations[C.station]?.lager;
    if(!b||!l||!Array.isArray(b.belege)||!Array.isArray(b.kaeufe)
      ||!['begonnen','fertig','verkauft','materialVerbraucht','bauteileVerbraucht',
        'lohnGebunden','lohnBezahlt'].every(k=>ganz(b[k]))
      ||b.begonnen!==b.fertig+(a?1:0)||b.fertig<b.verkauft
      ||b.materialVerbraucht!==b.begonnen*C.material
      ||b.bauteileVerbraucht!==b.begonnen*C.bauteile
      ||b.lohnGebunden!==b.begonnen*L
      ||b.lohnBezahlt!==(b.fertig*C.dauer+(a?.gearbeitet||0))*C.lohnJeMinute
      ||b.belege.length!==b.fertig||b.kaeufe.length!==b.verkauft
      ||(a&&(!ganz(a.start)||a.start>s.tick||!ganz(a.gearbeitet)||a.gearbeitet>=C.dauer))
      ||s.ledger.jaeger?.initial!==0||s.ledger.jaeger?.produced!==b.fertig
      ||s.ledger.jaeger?.mined!==0||s.ledger.jaeger?.consumed!==b.verkauft
      ||s.ledger.jaeger?.imported!==0||s.ledger.jaeger?.exported!==0
      ||l.jaeger!==b.fertig-b.verkauft
      ||summe(s,'j4-arbeitsreserve')!==b.lohnGebunden
      ||summe(s,'j4-arbeitslohn')!==b.lohnBezahlt
      ||(s.owners.j4_arbeit_treuhand?.cash||0)!==b.lohnGebunden-b.lohnBezahlt
      ||s.owners[C.arbeiter]?.cash!==b.lohnBezahlt
    )return false;
    for(let i=0;i<b.belege.length;i++){
      const e=b.belege[i];
      if(!e||Object.keys(e).sort().join()!=='bauteile,ende,lohn,material,start,station'
        ||!ganz(e.start)||!ganz(e.ende)||e.start>e.ende||e.ende>s.tick
        ||e.station!==C.station||e.bauteile!==C.bauteile
        ||e.material!==C.material||e.lohn!==L
        ||(i>0&&e.start<b.belege[i-1].ende))return false;
    }
    const names=new Set();
    for(const e of b.kaeufe){
      const sh=s.ships[e?.id];
      if(!e||Object.keys(e).sort().join()!=='id,owner,preis,station,tick'
        ||names.has(e.id)||typeof e.id!=='string'
        ||!ganz(e.tick)||e.tick>s.tick||e.owner!=='house'
        ||e.station!==C.station||e.preis!==C.verkaufspreis
        ||!sh||sh.owner!==e.owner||sh.klasse!=='jaeger'
        ||sh.heimat!=='nadir'||sh.system!=='nadir'
        ||sh.phase!=='dock' || !sh.flug
        || (sh.flug.lage==='angedockt'
           ? sh.flug.anker!==C.station
           : (!rules.j4c || !s.kanon.flugdienst[e.id]
              || !['abdocken','frei','andocken'].includes(sh.flug.lage))))return false;
      names.add(e.id);
    }
    if(Object.values(s.ships).filter(sh=>sh.klasse==='jaeger'&&sh.owner==='house').length!==b.verkauft)
      return false;
    return true;
  }
  return Object.freeze({C,leer,pruefen,bauen,minute,kaufPruefen,kaufVerbuchen,audit});
};
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.J4bJaegerWerft=api;
})(globalThis);
