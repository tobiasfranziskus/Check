/* W6/P8d Rule207 [DRAFT]: getrennte rechtmaessige Dravos-Siliziumfracht.
 * EIN W0-W6-Weltkern. NPC3 besitzt Ware und Miner, transport besitzt
 * den echten Frachter. ISK und Ladung wechseln genau einmal per K1-Buch.
 */
(function(scope){
'use strict';
function create({rules,kern,transfer,summe,ladungSumme,stillgelegt,flugSync,siliziumVerkaufen}){
  if(rules.rulesVersion!==207||!rules.p8d)throw Error('P8d: nur Regel207');
  const MINER='npc3',SPED='transport',PILOT=rules.w5Transfer.pilot;
  const FEE='k1_p8d_fracht',LOHN='k1_p8d_pilot',M=rules.j2b.charge;
  const preis=rules.j2b.preis*M;
  const ganz=n=>Number.isSafeInteger(n)&&n>=0;
  const route=(a,b)=>kern.route(rules.world,a,b);
  const frei=(s,sh)=>sh&&sh.owner===SPED&&sh.klasse==='frachter'
    &&['aldera','nadir'].includes(sh.system)&&sh.phase==='dock'
    &&sh.auftrag==='halten'&&sh.flug?.lage==='angedockt'
    &&sh.flug.anker==='st_'+sh.system&&!stillgelegt(s,sh)
    &&ladungSumme(sh)===0
    &&s.w3?.auftrag?.schiff!==sh.id&&s.w5n?.frachtauftrag?.schiff!==sh.id
    &&s.w5ac?.active?.schiff!==sh.id;
  const minerBereit=(s,sh)=>sh&&sh.owner===MINER&&sh.klasse==='miner'
    &&sh.heimat==='nadir'&&sh.system==='dravos'&&sh.phase==='dock'
    &&sh.auftrag==='halten'&&sh.flug?.lage==='angedockt'
    &&sh.flug.anker==='st_dravos'
    &&s.kanon.minerWerft?.lokaleKaeufe?.some(x=>x.id===sh.id&&x.owner===MINER)
    &&s.kanon.p8c?.reisen?.some(x=>x.schiff===sh.id&&x.nach==='dravos'
      &&x.ende!==null&&x.bezahlt===x.dauer)
    &&s.kanon.silizium.auftrag?.schiff===sh.id
    &&s.kanon.silizium.auftrag?.owner===MINER
    &&s.kanon.silizium.auftrag?.feld==='dravos-silizium'
    &&s.kanon.silizium.auftrag?.gefoerdert===M
    &&s.kanon.silizium.auftrag?.gearbeitet===M*rules.j2b.minutenJeEinheit
    &&sh.ladung.silizium===M&&ladungSumme(sh)===M;
  const leer=()=>({auftrag:null,belege:[],angebote:0,gebuehrBezahlt:0,
    lohnGebunden:0,lohnBezahlt:0,geliefert:0});
  function pruefen(s,cmd){
    if(!cmd||typeof cmd!=='object'||Array.isArray(cmd)
      ||!['siliconFreightOffer','siliconFreightAccept','siliconFreightDispatch',
        'siliconFreightLoad','siliconFreightReturn','siliconFreightDeliver'].includes(cmd.type))
      return 'P8d: unbekannter Auftrag';
    const c=s.kanon.p8d,a=c?.auftrag;
    if(!c)return 'P8d: kein authentisches Vertragsbuch';
    const offer=cmd.type==='siliconFreightOffer';
    const fields=offer?'frachter,miner,owner,type':'owner,type';
    if(Object.keys(cmd).sort().join()!==fields
      ||cmd.owner!==(offer?MINER:SPED))return 'P8d: falscher Rechtstraeger oder Befehlsform';
    if(offer){
      const miner=s.ships[cmd.miner],sh=s.ships[cmd.frachter];
      if(a||!minerBereit(s,miner)||!frei(s,sh))
        return 'P8d: keine freie rechtmaessige Ware oder Speditionshuelle';
      const hin=route(sh.system,'dravos'),zurueck=route('dravos','nadir');
      if(!hin||!zurueck||hin.zeit<=0||zurueck.zeit!==40
        ||zurueck.weg.join(',')!=='dravos,orion,nadir')
        return 'P8d: Original-W3-Route fehlt';
      const preisFracht=(hin.zeit+zurueck.zeit)*rules.w3.frachtgebuehrJeMinute;
      if(s.owners[MINER].cash<preisFracht)return 'P8d: Frachtgebuehr nicht vorfinanziert';
      if(s.owners[SPED].cash<(hin.zeit+zurueck.zeit)*rules.w3.arbeitJeMinute)
        return 'P8d: Spediteur kann Pilotlohn nicht vorfinanzieren';
      if((s.owners[FEE]?.cash||0)!==0||(s.owners[LOHN]?.cash||0)!==0)
        return 'P8d: Treuhand bereits belegt';
      return null;
    }
    if(!a)return 'P8d: kein aktiver unterschriebener Vertrag';
    const m=s.ships[a.miner],f=s.ships[a.frachter];
    if(!m||!f||m.owner!==MINER||f.owner!==SPED
      ||m.klasse!=='miner'||f.klasse!=='frachter')return 'P8d: fremdes Schiff';
    const stage={siliconFreightAccept:'angebot',siliconFreightDispatch:'bereit',
      siliconFreightLoad:'laden',siliconFreightReturn:'rueckBereit',
      siliconFreightDeliver:'ankunft'}[cmd.type];
    if(a.phase!==stage)return 'P8d: Transportphase nicht berechtigt';
    if(cmd.type==='siliconFreightAccept')
      return s.owners[SPED].cash<a.lohn ? 'P8d: Pilotloehne nicht vorfinanziert' : null;
    if(cmd.type==='siliconFreightDispatch')
      return f.system!==a.abfahrt||f.phase!=='dock'||f.flug?.lage!=='angedockt'
        ||ladungSumme(f)!==0 ? 'P8d: Frachter nicht leer im Startdock' : null;
    if(cmd.type==='siliconFreightLoad')
      return !minerBereit(s,m)||f.system!=='dravos'||f.phase!=='dock'
        ||f.flug?.lage!=='angedockt'||f.flug.anker!=='st_dravos'
        ||ladungSumme(f)!==0 ? 'P8d: nur echte Dock-Ladungsuebergabe' : null;
    if(cmd.type==='siliconFreightReturn')
      return f.system!=='dravos'||f.phase!=='dock'||f.flug?.lage!=='angedockt'
        ||f.ladung.silizium!==M||ladungSumme(f)!==M
        ? 'P8d: echte volle Ladung fehlt' : null;
    if(cmd.type==='siliconFreightDeliver')
      return f.system!=='nadir'||f.phase!=='dock'||f.flug?.lage!=='angedockt'
        ||f.flug.anker!=='st_nadir'||f.ladung.silizium!==M
        ||(m.ladung.silizium||0)!==0||a.lohnBezahlt!==a.lohn
        ? 'P8d: keine bezahlte vollstaendige Nadir-Ankunft' : null;
    return 'P8d: unbekannte Phase';
  }
  function ausfuehren(s,cmd){
    const fehler=pruefen(s,cmd);
    if(fehler)return {ok:false,type:cmd?.type,reason:fehler};
    const p=s.kanon.p8d;
    if(cmd.type==='siliconFreightOffer'){
      const f=s.ships[cmd.frachter],hin=route(f.system,'dravos').zeit;
      const zurueck=route('dravos','nadir').zeit,minuten=hin+zurueck;
      const gebuehr=minuten*rules.w3.frachtgebuehrJeMinute;
      const lohn=minuten*rules.w3.arbeitJeMinute;
      transfer(s,MINER,FEE,gebuehr,'p8d-frachtreserve');
      p.angebote++;
      p.auftrag={miner:cmd.miner,frachter:cmd.frachter,inhaber:MINER,
        spediteur:SPED,abfahrt:f.system,hin,zurueck,menge:M,preis,
        gebuehr,lohn,lohnBezahlt:0,phase:'angebot',angebotTick:s.tick,
        hinStart:null,rueckStart:null,ladenTick:null,ankunftTick:null};
    }else if(cmd.type==='siliconFreightAccept'){
      transfer(s,SPED,LOHN,p.auftrag.lohn,'p8d-lohnreserve');
      p.lohnGebunden+=p.auftrag.lohn;
      p.auftrag.phase='bereit';
    }else if(cmd.type==='siliconFreightDispatch'||cmd.type==='siliconFreightReturn'){
      const a=p.auftrag,istRueck=cmd.type==='siliconFreightReturn';
      const ziel=istRueck?'st_nadir':'st_dravos';
      const r=kern.execute(s,{type:'shipMove',owner:SPED,schiff:a.frachter,ziel},rules);
      if(!r.ok)return {ok:false,type:cmd.type,reason:'P8d Original-W3: '+r.reason};
      if(istRueck){a.phase='rueck';a.rueckStart=s.tick;}
      else{a.phase='hin';a.hinStart=s.tick;}
      flugSync(s);
    }else if(cmd.type==='siliconFreightLoad'){
      const a=p.auftrag,m=s.ships[a.miner],f=s.ships[a.frachter];
      m.ladung.silizium-=M;
      if(m.ladung.silizium===0)delete m.ladung.silizium;
      f.ladung.silizium=(f.ladung.silizium||0)+M;
      a.ladenTick=s.tick;a.phase='rueckBereit';
    }else if(cmd.type==='siliconFreightDeliver'){
      const a=p.auftrag;
      const r=siliziumVerkaufen(s,{type:'siliconSell',owner:SPED,schiff:a.frachter});
      if(!r.ok)throw Error('P8d: Original-J2b-Verkauf verweigert: '+r.reason);
      transfer(s,FEE,SPED,a.gebuehr,'p8d-frachtzahlung');
      p.gebuehrBezahlt+=a.gebuehr;p.geliefert+=M;
      p.belege.push({...a,phase:'fertig',ankunftTick:s.tick});
      p.auftrag=null;
    }
    return {ok:true,type:cmd.type};
  }
  function minute(s){
    const p=s.kanon.p8d,a=p.auftrag;
    if(!a||!['hin','rueck'].includes(a.phase))return;
    const hin=a.phase==='hin',start=hin?a.hinStart:a.rueckStart;
    const dauer=hin?a.hin:a.zurueck,f=s.ships[a.frachter];
    if(!ganz(start)||s.tick<=start||s.tick>start+dauer
      ||(s.owners[LOHN]?.cash||0)<rules.w3.arbeitJeMinute)
      throw Error('P8d: nicht vorfinanzierte oder ungueltige Transitminute');
    transfer(s,LOHN,PILOT,rules.w3.arbeitJeMinute,'p8d-pilotenlohn');
    a.lohnBezahlt+=rules.w3.arbeitJeMinute;
    p.lohnBezahlt+=rules.w3.arbeitJeMinute;
    if(s.tick===start+dauer){
      if(f.phase!=='dock'||f.system!==(hin?'dravos':'nadir')
        ||f.ankunft!==s.tick)throw Error('P8d: echte W3-Ankunft fehlt');
      a.phase=hin?'laden':'ankunft';
    }else if(f.phase!=='reise'||f.ziel!==(hin?'st_dravos':'st_nadir')
      ||f.ankunft!==start+dauer)
      throw Error('P8d: physischer Frachter fehlt auf Originalroute');
  }
  function automatisch(s){
    if(s.kanon.npcAuto!==true||s.kanon.politik.automatik!==true
      ||s.kanon.npcSilizium?.aktiv!==true)return;
    const p=s.kanon.p8d,a=p.auftrag;
    if(!a){
      const m=Object.values(s.ships).find(sh=>minerBereit(s,sh));
      const f=Object.values(s.ships).find(sh=>frei(s,sh));
      if(m&&f){
        // Beide Firmenkassen VOR Unterschrift geprueft. Sofortige
        // Gegenzeichnung durch die autorisierte NPC-Spedition in demselben
        // Entscheidungsschritt; keine Zwischenverwendung von gebundenem ISK.
        const r=ausfuehren(s,{type:'siliconFreightOffer',owner:MINER,miner:m.id,frachter:f.id});
        if(r.ok){
          const sign=ausfuehren(s,{type:'siliconFreightAccept',owner:SPED});
          if(!sign.ok)throw Error('P8d: vorgepruefte Firmenfinanzierung ohne Gegenzeichnung');
        }
      }
      return;
    }
    const f=s.ships[a.frachter];
    if(a.phase==='angebot')ausfuehren(s,{type:'siliconFreightAccept',owner:SPED});
    else if(a.phase==='bereit')ausfuehren(s,{type:'siliconFreightDispatch',owner:SPED});
    else if(a.phase==='laden')ausfuehren(s,{type:'siliconFreightLoad',owner:SPED});
    else if(a.phase==='rueckBereit')ausfuehren(s,{type:'siliconFreightReturn',owner:SPED});
    else if(a.phase==='ankunft')ausfuehren(s,{type:'siliconFreightDeliver',owner:SPED});
  }
  function audit(s){
    const p=s.kanon.p8d;
    if(!p||typeof p!=='object'||Array.isArray(p)
      ||Object.keys(p).sort().join()!=='angebote,auftrag,belege,gebuehrBezahlt,geliefert,lohnBezahlt,lohnGebunden'
      ||!Array.isArray(p.belege)
      ||!['angebote','gebuehrBezahlt','geliefert','lohnBezahlt','lohnGebunden'].every(k=>ganz(p[k])))
      return false;
    const all=[...p.belege,...(p.auftrag?[p.auftrag]:[])], ids=new Set();
    let totalFee=0,paidFee=0,totalLohn=0,paidLohn=0,delivered=0;
    for(const [i,a] of all.entries()){
      const done=i<p.belege.length;
      const m=s.ships[a?.miner],f=s.ships[a?.frachter];
      if(!a||Object.keys(a).sort().join()!==
        'abfahrt,angebotTick,ankunftTick,frachter,gebuehr,hin,hinStart,inhaber,ladenTick,lohn,lohnBezahlt,menge,miner,phase,preis,rueckStart,spediteur,zurueck'
        ||!m||!f||m.owner!==MINER||m.klasse!=='miner'||m.heimat!=='nadir'
        ||f.owner!==SPED||f.klasse!=='frachter'
        ||!s.kanon.minerWerft?.lokaleKaeufe?.some(k=>k.id===m.id&&k.owner===MINER)
        ||ids.has(a.angebotTick+'|'+m.id+'|'+f.id)
        ||!ganz(a.angebotTick)||a.angebotTick>s.tick
        ||!['aldera','nadir'].includes(a.abfahrt)
        ||a.hin!==route(a.abfahrt,'dravos')?.zeit||a.zurueck!==40
        ||a.menge!==M||a.preis!==preis
        ||a.gebuehr!==(a.hin+a.zurueck)*rules.w3.frachtgebuehrJeMinute
        ||a.lohn!==(a.hin+a.zurueck)*rules.w3.arbeitJeMinute
        ||!ganz(a.lohnBezahlt)||a.lohnBezahlt>a.lohn
        ||(done ? a.phase!=='fertig'||!ganz(a.ankunftTick)
          ||a.ankunftTick>s.tick||a.lohnBezahlt!==a.lohn
          : !['angebot','bereit','hin','laden','rueckBereit','rueck','ankunft'].includes(a.phase))
        )return false;
      ids.add(a.angebotTick+'|'+m.id+'|'+f.id);
      if(done){
        if(!s.kanon.silizium.belege.some(b=>b.feld==='dravos-silizium'
          &&b.schiff===m.id&&b.owner===MINER&&b.tick===a.ankunftTick
          &&b.menge===M&&b.preis===preis))return false;
        paidFee+=a.gebuehr;delivered+=M;
      }else{
        if(s.kanon.silizium.auftrag?.schiff!==m.id
          ||s.kanon.silizium.auftrag?.owner!==MINER
          ||s.kanon.silizium.auftrag?.feld!=='dravos-silizium'
          ||s.kanon.silizium.auftrag?.gefoerdert!==M)return false;
        const loaded=['rueckBereit','rueck','ankunft'].includes(a.phase);
        if((m.ladung.silizium||0)!==(loaded?0:M)
          ||(f.ladung.silizium||0)!==(loaded?M:0)
          ||m.system!=='dravos'||m.flug?.lage!=='angedockt')return false;
        if(a.phase==='hin'&&(f.phase!=='reise'||f.ziel!=='st_dravos'))return false;
        if(a.phase==='rueck'&&(f.phase!=='reise'||f.ziel!=='st_nadir'))return false;
        if(a.phase==='laden'&&f.system!=='dravos')return false;
        if(a.phase==='ankunft'&&f.system!=='nadir')return false;
      }
      const signed=a.phase!=='angebot';
      totalFee+=a.gebuehr;
      if(signed){totalLohn+=a.lohn;paidLohn+=a.lohnBezahlt;}
    }
    return p.angebote===all.length &&p.geliefert===delivered
      &&p.lohnGebunden===totalLohn&&p.lohnBezahlt===paidLohn
      &&p.gebuehrBezahlt===paidFee
      &&summe(s,'p8d-frachtreserve')===totalFee
      &&summe(s,'p8d-frachtzahlung')===paidFee
      &&summe(s,'p8d-lohnreserve')===totalLohn
      &&summe(s,'p8d-pilotenlohn')===paidLohn
      &&(s.owners[FEE]?.cash||0)===totalFee-paidFee
      &&(s.owners[LOHN]?.cash||0)===totalLohn-paidLohn;
  }
  return Object.freeze({leer,pruefen,ausfuehren,minute,automatisch,audit});
}
const api=Object.freeze({create});
if(typeof module==='object'&&module.exports)module.exports=api;
else scope.P8dFracht=api;
})(globalThis);
