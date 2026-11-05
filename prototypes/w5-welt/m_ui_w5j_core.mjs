import {w5iSitzung,w5iSicht} from './m_ui_w5i_core.mjs';

// Keine weitere Wirtschaftsregel: Regel26 bleibt der einzige autoritative Core.
// Der W5j-Blick liefert nur unabhaengige Liquiditaetsnachweise fuer NPC3.
export function w5jSitzung(api,anfang=api.createW5IState(42)){
  return w5iSitzung(api,anfang);
}
export function w5jNachfrage(api,state){
  if(state?.rulesVersion!==api.W5I_RULES.rulesVersion||!api.audit(state).ok)
    throw Error('W5j: nur gueltige Regel26-Originalkonten');
  const cfg=api.W5I_RULES,kaeufer='npc3';
  const anfang=cfg.owners.find(o=>o.id===kaeufer).cash;
  const miner=Object.values(state.ships).find(sh=>sh.owner===kaeufer
    &&sh.klasse==='miner'&&sh.system==='aldera');
  const auftrag=miner?.id?state.erzpilotVertraege?.[miner.id]:null;
  const arbeitsreserve=auftrag?.arbeitsKonto
    ?state.owners[auftrag.arbeitsKonto]?.cash:0;
  const konto=state.stats.konto[kaeufer];
  const frei=state.owners[kaeufer].cash;
  const status=Object.freeze({
    anfang,einahmen:konto.erloes,ausgaben:konto.kosten,
    gebundeneBergbauArbeit:arbeitsreserve,frei,
    bilanziert:anfang+konto.erloes-konto.kosten===frei+arbeitsreserve,
    minerId:miner?.id??null,minerAuftrag:miner?.auftrag??'kein Miner',
    verkaufteEigeneErzchargen:state.stats.verkaeufe[miner?.id]??0,
    kaufpreis:cfg.economy.waren.jaeger.basis,
    lagerJaeger:state.stations.st_nadir.lager.jaeger,
    jaegerGebaut:state.w5b.jaegerFertig,
    jaegerVerkauft:state.w5b.jaegerVerkauft,
    bezahlbar:frei>=cfg.economy.waren.jaeger.basis
      &&state.stations.st_nadir.lager.jaeger>=1,
    HausMinerAuftrag:Object.values(state.ships).find(sh=>sh.owner==='house'
      &&sh.klasse==='miner'&&sh.system==='aldera')?.auftrag??'kein Miner',
    drittverkaufBelegt:state.w5b.jaegerVerkauft>=3,
    minted:state.minted
  });
  if(!status.bilanziert)throw Error('W5j: NPC3-Geldfluss nicht nachvollziehbar');
  return status;
}
export function w5jSicht(api,state,selection){
  const vorher=w5iSicht(api,state,selection);
  return Object.freeze({...vorher,version:'W5jSichtV1',
    w5j:w5jNachfrage(api,state)});
}
