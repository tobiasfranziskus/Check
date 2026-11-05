// W5p: ausschliesslich lesende Beobachtung des W5o/R30-Geldkreislaufs.
// Diese Datei erhaelt den existierenden Core als Argument; weder eine neue
// Geldemission noch eine abweichende Waren-, Lohn- oder Zeitberechnung.
export function analysiereKaufkraft(api,{
  seed=42,modus='npcSave',minerOwner='npc3',tage=90
}={}){
  if(!Number.isSafeInteger(seed)||!Number.isSafeInteger(tage)
    ||tage<1||tage>365)throw Error('W5p: seed und 1..365 Tage erforderlich');
  const rules=api.W5O_RULES;
  if(!rules||rules.rulesVersion!==30)throw Error('W5p nur fuer W5o/R30');
  const s=api.createW5OState(seed,modus,minerOwner);
  const demand=rules.w5n.verbrauchStunde,preis=rules.w5n.wasserPreis;
  if(demand!==2||preis!==14)throw Error('W5p: unverifizierte Nachfrageparameter');
  const zeit={stunden:0,menge:0,kaufkraftNur:0,wareNur:0,beides:0,
    kaufkraftAlleinStunden:0,wareAlleinStunden:0,beideStunden:0,
    cashLimitStunden:0,stockLimitStunden:0,bezahlteStunden:0,
    letzteBezahlteStunde:null,ersteKaufkraftSperre:null,
    ersteWarenSperre:null,ersteKundenkasseUnter28:null,
    erstMangelWarenbestand:null};
  const verpassterUmsatz={maximal:0,beiVorhandenerWare:0};
  const tagebuch=[];
  let ersteHaushaltsPleite=null,vergangeneBezahlte=0;
  for(let hour=1;hour<=tage*24;hour++){
    // Echte Core-Ticks 1..59; die letzte Minute des Blocks kann
    // Fabrikoutput erzeugen, bevor der Core den Stundenverbrauch bezahlt.
    api.advance(s,59,rules);
    const vorher={
      geld:s.owners.w5n_kunden.cash,
      wasser:s.stations.st_nadir.lager.wasser||0,
      produziert:s.w5n.wasserProduziert,
      verbraucht:s.w5n.wasserVerbraucht
    };
    api.advance(s,1,rules);
    const letzteProduktion=s.w5n.wasserProduziert-vorher.produziert;
    const lieferbar=vorher.wasser+letzteProduktion;
    const bezahlbar=Math.floor(vorher.geld/preis);
    const gekauft=s.w5n.wasserVerbraucht-vorher.verbraucht;
    const pruefwert=Math.min(demand,lieferbar,bezahlbar);
    if(gekauft!==pruefwert)throw Error('W5p: Verbrauch ausserhalb des Core-Vertrags');
    const fehlt=demand-gekauft;
    const wert=fehlt*preis;
    const reinCash=Math.max(0,Math.min(demand,lieferbar)-gekauft);
    const reinWare=Math.max(0,Math.min(demand,bezahlbar)-gekauft);
    if(fehlt>0){
      zeit.stunden++;zeit.menge+=fehlt;
      verpassterUmsatz.maximal+=wert;
      verpassterUmsatz.beiVorhandenerWare+=reinCash*preis;
      const mangeltWare=lieferbar<demand;
      const mangeltCash=bezahlbar<demand;
      if(mangeltWare)zeit.stockLimitStunden++;
      if(mangeltCash)zeit.cashLimitStunden++;
      if(mangeltWare&&mangeltCash){
        zeit.beides++;zeit.beideStunden++;
      }else if(mangeltWare){
        zeit.wareNur++;zeit.wareAlleinStunden++;
        if(zeit.ersteWarenSperre===null)zeit.ersteWarenSperre=hour;
      }else{
        zeit.kaufkraftNur++;zeit.kaufkraftAlleinStunden++;
        if(zeit.ersteKaufkraftSperre===null)zeit.ersteKaufkraftSperre=hour;
      }
    }else zeit.bezahlteStunden++;
    if(gekauft>0){zeit.letzteBezahlteStunde=hour;vergangeneBezahlte+=gekauft;}
    if(vorher.geld<demand*preis&&zeit.ersteKundenkasseUnter28===null)
      zeit.ersteKundenkasseUnter28=hour;
    if(vorher.geld<preis&&ersteHaushaltsPleite===null)
      ersteHaushaltsPleite=hour;
    if(lieferbar<demand&&zeit.erstMangelWarenbestand===null)
      zeit.erstMangelWarenbestand=hour;
    if(hour%24===0){
      const day=hour/24;
      const a=api.audit(s);
      if(!a.ok)throw Error('W5p: bestehender Core-Audit Tag '+day+' Seed '+seed);
      const worldCash=Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
      if(worldCash!==s.initialSupply+s.minted-s.burned||s.minted||s.burned)
        throw Error('W5p: unverifizierte Weltgeldmenge');
      if(day===30||day===60||day===90||day===180||day===365){
        const loaded=api.loadW5O(api.save(s));
        if(api.hash(loaded)!==api.hash(s))throw Error('W5p: Save/Load Hash stimmt nicht');
      }
      tagebuch.push(Object.freeze({tag:day,hash:api.hash(s),
        weltISK:worldCash,haushalt:s.owners.w5n_kunden.cash,
        spieler:s.owners.house.cash,npcMiner:s.owners.npc3.cash,
        frachter:s.owners.transport.cash,
        nadir:s.owners.st_nadir.cash,
        wasserProduziert:s.w5n.wasserProduziert,
        wasserGekauft:s.w5n.wasserVerbraucht,
        wasserLager:s.stations.st_nadir.lager.wasser,
        stundenMangel:s.w5n.knappheitsStunden,
        kundenZahlungen:s.w5n.wasserErlos,
        lohn:s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser,
        npcDividenden:s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation,
        eisVerkauft:s.w5n.mineVerkauft,
        frachtBeendet:s.w5n.frachtAbgeschlossen,
        minted:s.minted,burned:s.burned}));
    }
  }
  const demandTotal=tage*24*demand;
  const totalBought=s.w5n.wasserVerbraucht;
  if(totalBought!==vergangeneBezahlte
    ||demandTotal-totalBought!==zeit.menge
    ||zeit.stunden!==s.w5n.knappheitsStunden
    ||zeit.stunden!==zeit.kaufkraftAlleinStunden+zeit.wareAlleinStunden+zeit.beideStunden)
    throw Error('W5p: unabhaengige Stundenklassifikation widerspruechlich');
  const lohn=s.w5o.lohnEis+s.w5o.lohnFracht+s.w5o.lohnWasser;
  const dividende=s.w5o.divMine+s.w5o.divFracht+s.w5o.divStation;
  const kundenEinnahmen=lohn+dividende;
  const endCash=s.owners.w5n_kunden.cash;
  if(endCash!==1400+kundenEinnahmen-totalBought*preis)
    throw Error('W5p: Kundenkonto nicht mit echten Buchungen gedeckt');
  const result={
    seed,modus,minerOwner,tage,regel:s.rulesVersion,
    nachfrage:{einheiten:demandTotal,nominalISK:demandTotal*preis,
      wirklichGekauft:totalBought,bezahlteISK:s.w5n.wasserErlos,
      unverkauft:zeit.menge,verpassterNominalumsatzISK:verpassterUmsatz.maximal,
      ausfallBeiPhysischVorhandenerWareISK:verpassterUmsatz.beiVorhandenerWare},
    mangel:Object.freeze({...zeit,ersteKundenkasseUnter14:ersteHaushaltsPleite}),
    haushalte:{startISK:1400,lohnISK:lohn,dividendenISK:dividende,
      gesamtEinkommenISK:kundenEinnahmen,
      endISK:endCash},
    restGeld:{weltISK:Object.values(s.owners).reduce((n,o)=>n+o.cash,0),
      spielerISK:s.owners.house.cash,npcMinerISK:s.owners.npc3.cash,
      frachterISK:s.owners.transport.cash,nadirISK:s.owners.st_nadir.cash,
      alderaISK:s.owners.st_aldera.cash},
    ware:{eisGefordert:s.w5n.eisAbgebaut,eisVerkauft:s.w5n.mineVerkauft,
      eisGeliefert:s.w5n.eisGeliefert,
      wasserProduziert:s.w5n.wasserProduziert,
      wasserLagerNadir:s.stations.st_nadir.lager.wasser},
    dienst:{frachtRunden:s.w5n.frachtAbgeschlossen,
      produktionen:s.w5n.fabrikFertig},
    audits:{hash:api.hash(s),w5n:true,w5o:true,
      keinMinting:s.minted===0&&s.burned===0},
    tagebuch:Object.freeze(tagebuch)
  };
  return Object.freeze(result);
}
export function wertekettePro50(rules,{foerderrate=1}={}){
  if(!rules?.w5n||!Number.isSafeInteger(foerderrate)||foerderrate<1
    ||rules.w5n.charge%rules.w5n.rezeptEis!==0
    ||rules.w5n.charge%foerderrate!==0)
    throw Error('W5p: nur komplette, physisch nachvollziehbare Chargen');
  const c=rules.w5n;
  const eis=c.charge*c.eisPreis;
  const hinRueckFracht=c.flugMinuten*2*c.frachtJeMinute;
  const flugLohn=c.flugMinuten*2*c.fliegerLohn;
  const fabrikLohn=c.charge/c.rezeptEis*c.fabrikMinuten*c.fabrikLohn;
  const minerLohn=c.charge/foerderrate*c.mineLohn;
  const wasserEinheiten=c.charge/c.rezeptEis*c.rezeptWasser;
  const wasserUmsatz=wasserEinheiten*c.wasserPreis;
  const minerGewinn=eis-minerLohn;
  const frachtGewinn=hinRueckFracht-flugLohn;
  const stationsGewinn=wasserUmsatz-eis-hinRueckFracht-fabrikLohn;
  const loehne=minerLohn+flugLohn+fabrikLohn;
  const gewinne=minerGewinn+frachtGewinn+stationsGewinn;
  if(wasserUmsatz!==loehne+gewinne||Math.min(
    minerGewinn,frachtGewinn,stationsGewinn)>=wasserUmsatz)
    throw Error('W5p: Leistungsrechnung nicht geschlossen');
  return Object.freeze({foerderrate,ladungEis:c.charge,wasserEinheiten,
    wasserkaufISK:wasserUmsatz,
    arbeitsLohnISK:loehne,minerlLohnISK:minerLohn,
    frachterLohnISK:flugLohn,werkLohnISK:fabrikLohn,
    minerGewinnISK:minerGewinn,frachterGewinnISK:frachtGewinn,
    stationsGewinnISK:stationsGewinn,
    auskehrbarerGewinnISK:gewinne,vollstaendigerRueckflussISK:loehne+gewinne,
    lueckeWennMinerSpartISK:minerGewinn,
    lueckeJeWasserBeiMinerSparenISK:minerGewinn/wasserEinheiten});
}

export function vergleichOhneScheinemission(resultate){
  if(!Array.isArray(resultate)||resultate.length<2)
    throw Error('W5p: mindestens zwei real beobachtete Welten');
  const referenz=resultate.find(x=>x.modus==='full'&&x.minerOwner==='npc3');
  if(!referenz)throw Error('W5p: voll finanzierte NPC-Referenz fehlt');
  if(resultate.some(x=>x.seed!==referenz.seed||x.tage!==referenz.tage
    ||x.regel!==referenz.regel))throw Error('W5p: Welten muessen identische Seed-/Zeit-/Regelbasis haben');
  return Object.freeze(resultate.map(x=>Object.freeze({
    modus:x.modus,minerOwner:x.minerOwner,seed:x.seed,tage:x.tage,
    verkauft:x.nachfrage.wirklichGekauft,
    entgangeneEinheitenGegenReferenz:
      referenz.nachfrage.wirklichGekauft-x.nachfrage.wirklichGekauft,
    entgangenerNominalumsatzGegenReferenzISK:
      (referenz.nachfrage.wirklichGekauft-x.nachfrage.wirklichGekauft)*14,
    nominalerAusfallISK:x.nachfrage.verpassterNominalumsatzISK,
    kaufkraftgebundenerAusfallISK:x.nachfrage.ausfallBeiPhysischVorhandenerWareISK,
    mangelStunden:x.mangel.stunden,
    kundenCash:x.haushalte.endISK,
    weltISK:x.restGeld.weltISK,emissionErforderlichISK:null,
    hinweis:'Nominalumsatz und beobachtete Kaufkraftbindung sind KEIN Emissionsbedarf'
  })));
}
