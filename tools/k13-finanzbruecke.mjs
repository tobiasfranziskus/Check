/**
 * K13 [ANALYSE] Forschungsadapter fuer zwei real gebuchte, vom korrekten
 * Eigentuemer signierte Finanzierungswege im unveraenderten Regel200-Kern.
 * KEIN Produktfeature/zusatzlicher Core; keine automatische Spendenrettung.
 * State-Transaktionen werden auf einem Save/Load-Klon vorbereitet und nur
 * mit vollstaendig bestandenem Originalaudit als neuer Zustand ausgegeben.
 */
const ganz=n=>Number.isSafeInteger(n)&&n>=0;
const gesamt=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
function fehler(reason){return {ok:false,reason};}
function pruefeKern(w,s){
  if(!w||w.regel!==200||s?.rulesVersion!==200||s?.schema!==8)
    return 'Nur isoliertes K7-/Regel200-Forschungsprofil und Schema8';
  const a=w.audit(s);
  if(!a.ok)return 'Originalaudit abgelehnt: '+JSON.stringify(a.fehler);
  if(s.minted!==0||s.burned!==0||gesamt(s)!==33000)
    return 'W0: ungueltige 33.000-ISK-Erhaltung';
  return null;
}
function transfer(s,von,an,betrag,art){
  if(!ganz(betrag)||betrag<=0||von===an
    ||!s.owners[von]||!s.owners[an]||s.owners[von].cash<betrag)
    throw Error('K13: fehlender rechtmaessiger Transferdeckungsbeleg');
  const key=art+'|'+von+'|'+an,k=s.kanon;
  if(k.buch.summen[key])throw Error('K13: keine wiederholte Finanzbuchung');
  s.owners[von].cash-=betrag;s.owners[an].cash+=betrag;
  k.netto[von]=(k.netto[von]||0)+betrag;
  k.netto[an]=(k.netto[an]||0)-betrag;
  k.buch.summen[key]=betrag;
  k.buch.belege++;
}
function schiff(w,s){
  return Object.keys(s.ships).sort().find(id=>{
    const sh=s.ships[id];
    return sh.owner===w.rules.w5n.frachterOwner&&sh.klasse==='frachter'
      &&sh.phase==='dock'&&sh.system==='aldera'&&sh.auftrag==='halten'
      &&Object.values(sh.ladung).every(n=>n===0);
  });
}
export function oeffnen(w,s,cmd){
  const invalid=pruefeKern(w,s);
  if(invalid)return fehler(invalid);
  const keys=Object.keys(cmd||{}).sort().join(',');
  if(keys!=='einwilligung,modus,schiff,unterzeichner')return fehler('K13: genaue Vertragsform notwendig');
  if(cmd.einwilligung!==true)return fehler('K13: ausdrueckliche freiwillige Unterschrift fehlt');
  if(s.kanon.k13!==undefined)return fehler('K13: bereits ein gebuchter Forschungsvertrag');
  if(s.w5n.frachtauftrag||s.w3.auftrag)return fehler('K13: bestehende W3/W5n-Fracht gebunden');
  const c=w.rules.w5n;
  const q0=w.kern.pilotIceFreightQuote(s,cmd.schiff);
  const mustFail=!q0.ok&&/Spedition kann Flugarbeit nicht vorfinanzieren/.test(q0.grund||'');
  if(!mustFail)return fehler('K13: keine exakt nachgewiesene Crew-Finanzierungsluecke');
  if(cmd.schiff!==schiff(w,s))return fehler('K13: nur bestehender freier eigener Originalfrachter');
  const p={
    crew:2*c.flugMinuten*c.fliegerLohn,
    goods:c.charge*c.eisPreis,
    freight:2*c.flugMinuten*c.frachtJeMinute
  };
  if(p.crew<=0||p.freight<p.crew)return fehler('K13: keine durch realen Frachttarif gedeckte Arbeiterreserve');
  if(s.owners[c.zielStation].cash<p.goods+p.freight)
    return fehler('K13: Auftraggeber kann Originalrechnung nicht bezahlen');
  const fehlbetrag=p.crew-s.owners[c.frachterOwner].cash;
  if(!ganz(fehlbetrag)||fehlbetrag<=0)return fehler('K13: kein realer Fehlbetrag');

  let source,amount,art;
  if(cmd.modus==='kundenvorschuss'){
    if(cmd.unterzeichner!==c.zielStation)return fehler('K13: nur zahlender Originalkunde kann Crewvorschuss freigeben');
    source=c.zielStation;amount=p.crew;art='k13-kunden-vorschuss';
    if(s.owners[source].cash<p.goods+p.freight+amount)
      return fehler('K13: Kunde kann Rechnungsbetrag und bis zum Abschluss auszulegenden Vorschuss nicht zugleich halten');
  }else if(cmd.modus==='eignereinlage'){
    if(cmd.unterzeichner!==w.daten.anteile[c.frachterOwner])
      return fehler('K13: nur eingetragener Firmenanteilseigner darf freiwillig einzahlen');
    source=cmd.unterzeichner;amount=fehlbetrag;art='k13-eigner-einlage';
  }else return fehler('K13: nicht freigegebenes Forschungsszenario');
  if(s.owners[source].cash<amount)return fehler('K13: Einlage nicht aus vorhandener Eigentuemerkasse finanzierbar');

  // Originalzustand wird nie mutiert. Der Forschungsvertrag erhaelt eine
  // eigene K1-konforme Gegenbuchung, keine Umsatz-/Lohnfiktion.
  const t=w.load(w.save(s));
  const contract={version:1,modus:cmd.modus,unterzeichner:cmd.unterzeichner,
    schiff:cmd.schiff,source,amount,art,
    customer:c.zielStation,carrier:c.frachterOwner,
    crew:p.crew,goods:p.goods,freight:p.freight,
    start:t.tick,base:t.w5n.frachtAbgeschlossen,
    paidBase:t.w5ag.paid.eis,iceBase:t.w5n.eisGeliefert,
    revenuesBase:t.w5n.frachtUmsatz,phase:'aktiv'};
  transfer(t,source,c.frachterOwner,amount,art);
  t.kanon.k13=contract;
  const funded=w.kern.pilotIceFreightQuote(t,cmd.schiff);
  if(!funded.ok)return fehler('K13: nach echter Finanzierung dennoch ungueltig: '+funded.grund);
  const started=w.execute(t,{type:'shipFreightIce',owner:c.frachterOwner,schiff:cmd.schiff});
  if(!started.ok)return fehler('K13: Originalkern lehnt trotz Vertragsbuchung ab: '+started.reason);
  const post=pruefeKern(w,t);
  if(post)return fehler('K13: Originalaudit nach Start: '+post);
  if(t.owners.w5n_fracht_kauf.cash!==p.goods+p.freight
    ||t.owners.w5n_fracht_arbeit.cash!==p.crew
    ||t.w5n.frachtauftrag?.schiff!==cmd.schiff
    ||t.w5n.frachtauftrag?.gearbeitet!==0)
    return fehler('K13: unvollstaendige Original-Treuhandbuchung');
  return {ok:true,zustand:t,beleg:{...contract},quote:funded};
}
export function brueckePruefen(w,s){
  const wrong=pruefeKern(w,s);
  if(wrong)return {ok:false,reason:wrong};
  const c=s.kanon.k13;
  if(!c||c.version!==1||!['kundenvorschuss','eignereinlage'].includes(c.modus)
    ||!['aktiv','abgeschlossen'].includes(c.phase))
    return fehler('K13: ungültiger oder fehlender Forschungsbeleg');
  const k=s.kanon.buch.summen,hin=c.art+'|'+c.source+'|'+c.carrier;
  if(!ganz(c.amount)||c.amount<=0||k[hin]!==c.amount
    ||!Number.isSafeInteger(c.start)||c.start>s.tick)
    return fehler('K13: Einlage/Vorschuss nicht im Original-K1-Doppelbuch');
  if(c.customer!==w.rules.w5n.zielStation ||c.carrier!==w.rules.w5n.frachterOwner)
    return fehler('K13: Eigentums- oder Käuferzuordnung manipuliert');
  if(c.modus==='eignereinlage'){
    if(c.art!=='k13-eigner-einlage'||c.source!==w.daten.anteile[c.carrier]
      ||c.amount!==74)
      return fehler('K13: kein vertragsgerechter freiwilliger Kapitaleinleger');
  }else{
    if(c.art!=='k13-kunden-vorschuss'||c.source!==c.customer||c.amount!==c.crew)
      return fehler('K13: nicht gedeckter oder geänderter Kundenanteil');
    const rueck='k13-kunden-rueckzahlung|'+c.carrier+'|'+c.customer;
    if((k[rueck]||0)!==(c.phase==='abgeschlossen'?c.amount:0))
      return fehler('K13: Kundenforderung nicht/mehrfach zurückgebucht');
  }
  const done=s.w5n.frachtAbgeschlossen-c.base;
  if(!ganz(done)||done>1||(c.phase==='abgeschlossen'&&done!==1))
    return fehler('K13: Vertragserfuellung und Rechnungsabschluss unvereinbar');
  if(c.phase==='aktiv' && done===0 &&s.w5n.frachtauftrag?.schiff!==c.schiff)
    return fehler('K13: noch nicht geleistete Fahrt ohne echten Auftrag');
  if(c.phase==='aktiv' && done===1 &&s.w5n.frachtauftrag!==null)
    return fehler('K13: Erfuellung ohne freigegebene Original-Fracht');
  if(done===1 &&
    (s.w5n.eisGeliefert-c.iceBase!==w.rules.w5n.charge
      ||s.w5n.frachtUmsatz-c.revenuesBase!==c.freight
      ||s.w5ag.paid.eis-c.paidBase!==c.crew))
    return fehler('K13: Originalwarenlieferung, Frachtumsatz oder Pilotenlohn ohne Originalbeleg');
  return {ok:true,vertrag:c,geliefert:done};
}
export function abschliessen(w,s,{unterzeichner}={}){
  const q=brueckePruefen(w,s);
  if(!q.ok)return q;
  const c=q.vertrag;
  if(c.phase!=='aktiv')return fehler('K13: bereits endgueltig abgerechnet');
  if(unterzeichner!==c.unterzeichner)
    return fehler('K13: nur ursprünglicher Vertragsunterzeichner darf abschliessen');
  if(s.w5n.frachtauftrag||s.w5n.frachtAbgeschlossen!==c.base+1
    ||s.w5n.eisGeliefert-c.iceBase!==w.rules.w5n.charge
    ||s.w5n.frachtUmsatz-c.revenuesBase!==c.freight
    ||s.w5ag.paid.eis-c.paidBase!==c.crew)
    return fehler('K13: keine echte fertige Hin-/Rundfracht und belegte 120 Arbeitsminuten');
  const t=w.load(w.save(s));
  if(c.modus==='kundenvorschuss')
    transfer(t,c.carrier,c.customer,c.amount,'k13-kunden-rueckzahlung');
  t.kanon.k13.phase='abgeschlossen';
  const after=brueckePruefen(w,t);
  if(!after.ok)return fehler('K13: Forschungskontrakt-Audit nach Zahlung: '+after.reason);
  if(t.owners.w5n_fracht_kauf.cash!==0||t.owners.w5n_fracht_arbeit.cash!==0)
    return fehler('K13: offene Originalcrew- oder Waren-Treuhand nach Fracht');
  return {ok:true,zustand:t,beleg:{...t.kanon.k13}};
}
