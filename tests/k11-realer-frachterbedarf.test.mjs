// K11 [ANALYSE] – vorhandene reale Werftware von tatsächlich finanziertem
// Frachterbedarf unterscheiden, auf dem vollständig gebuchten K10-Achterstand.
// Keine Käufersubvention, keine vom Test erzeugte Nachfrage, kein Core-Eingriff.
import test from 'node:test';
import assert from 'node:assert/strict';
import {k11K10Endstand} from '../tools/k11-k10-endstand.mjs';

const geld=s=>Object.values(s.owners).reduce((sum,o)=>sum+o.cash,0);
const frachter=s=>Object.values(s.ships).filter(sh=>sh.owner==='transport'&&sh.klasse==='frachter');
function pruefe(w,s,grund){
  const a=w.audit(s);
  assert.equal(a.ok,true,grund+': '+JSON.stringify(a.fehler));
  assert.equal(geld(s),33000,grund+': Geld bleibt vollständig erhalten');
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(s.w5.fertig-s.w5.verkauft,s.stations.st_nadir.lager.frachter,
    grund+': echte W5-Lagerbilanz');
}
function foto(w,s){
  const fl=frachter(s),tauglich=fl.filter(sh=>w.buchwert(s,sh.id)>0);
  const frei=tauglich.filter(sh=>sh.system==='aldera'&&sh.phase==='dock'
    &&sh.auftrag==='halten'&&Object.values(sh.ladung).every(x=>x===0));
  const waehle=frei.at(0);
  const eisQuote=waehle?w.kern.pilotIceFreightQuote(s,waehle.id):null;
  const erzQuote=waehle?w.kern.pilotW3Kalkulation(s,waehle.id):null;
  const c=w.rules.w5n,fluglohn=2*c.flugMinuten*c.fliegerLohn;
  const kundenauftrag=c.charge*c.eisPreis+2*c.flugMinuten*c.frachtJeMinute;
  return {
    tick:s.tick,
    iceWorkRequired:fluglohn,
    iceBuyerRequired:kundenauftrag,
    iceBuyerAccount:c.kunde,
    iceBuyerISK:s.owners[c.kunde].cash,
    iceCrewShortfall:Math.max(0,fluglohn-s.owners.transport.cash),
    iceBuyerShortfall:Math.max(0,kundenauftrag-s.owners[c.kunde].cash),
    frachterImEigentum:fl.length,neueGekaufte:s.w5.verkauft,
    brauchbareFrachter:tauglich.length,freieFrachterAldera:frei.length,
    transportFrachterIds:fl.map(sh=>sh.id),
    werftlager:s.stations.st_nadir.lager.frachter,
    offeneW5:s.w5.fertig-s.w5.verkauft,
    werftBestellungen:s.w5.begonnen,
    speditionISK:s.owners.transport.cash,
    eisAltera:s.stations.st_aldera.lager.eis,
    eisNadir:s.stations.st_nadir.lager.eis,
    nadirWasser:s.stations.st_nadir.lager.wasser,
    eisQuote:eisQuote?{ok:eisQuote.ok,grund:eisQuote.grund}:null,
    erzQuote:erzQuote?{ok:erzQuote.ok,grund:erzQuote.grund}:null,
    w3Beauftragt:s.w3.beauftragt,
    w3Abgeschlossen:s.w3.abgeschlossen,
    eisFrachtBeauftragt:s.w5n.frachtBeauftragt,
    eisFrachtAbgeschlossen:s.w5n.frachtAbgeschlossen,
    eisGeliefert:s.w5n.eisGeliefert,
    wasserProduziert:s.w5n.wasserProduziert,
    automatischerErsatz:s.kanon.ersatzkaeufe,
    w3Aktiv:!!s.w3.auftrag,
    eisFrachtAktiv:!!s.w5n.frachtauftrag,
    finanzierung:s.owners.st_nadir.cash,
    weltgeld:geld(s),minted:s.minted,burned:s.burned,
    hash:w.hash(s)
  };
}

for (const seed of [42,7]) {
  test('K11 echte Original-Nachfrage gegen physische W5-Lagerbestand Seed '+seed,
    {timeout:18*60*1000},()=>{
      const {welt:w,zustand:grund,bruecke}=k11K10Endstand(seed);
      pruefe(w,grund,'K11 Start nach vollständig finanziertem K10');
      assert.equal(bruecke.erzExtra,50);
      assert.equal(bruecke.lieferExtra,50);
      assert.equal(bruecke.neueW5Produktion,1);
      assert.equal(bruecke.gekauft,1);
      const anfang=foto(w,grund);
      assert.equal(anfang.werftlager,2,'K11 reale vorhandene Lagerhüllen');
      assert.equal(anfang.offeneW5,2,'W5 Buch nicht nur Zukunftsprognose');
      assert.ok(anfang.frachterImEigentum>=3,'Spedition besitzt mehrere echte Frachter');
      assert.ok(anfang.brauchbareFrachter>0,'kein akuter Ersatzbedarf einer ganzen Flotte');
      assert.ok(anfang.freieFrachterAldera>=1,'bezahlbare Fracht kann bereits bedient werden');
      const vor=w.canonical(grund);
      for(const cmd of [
        {type:'shipBuy',owner:'transport',klasse:'frachter',station:'st_nadir'},
        {type:'shipBuy',owner:'npc3',klasse:'frachter',station:'st_nadir'},
        {type:'shipBuy',owner:'st_aldera',klasse:'frachter',station:'st_nadir'}
      ]){
        const result=w.execute(grund,cmd);
        assert.equal(result.ok,false,'K11 darf Lager nicht an ungedeckte/unberechtigte Käufer verteilen');
        assert.equal(w.canonical(grund),vor,'K11: abgelehnte W5-Geschäfte atomar');
      }
      assert.ok(grund.owners.transport.cash<w.rules.w5.verkaufsPreis,
        'K11: Spedition müsste weitere Einnahmen real verdienen');

      const resultate=[];
      for(const policy of [
        {name:'bestehende Nachfrage ohne neuen Verschleiss',patch:{ersatzkauf:true,eisfracht:true,stilllegung:false}},
        {name:'aktive Original-Stilllegung und Ersatzpolitik',patch:{ersatzkauf:true,eisfracht:true,stilllegung:true}}
      ]){
        const s=w.load(w.save(grund));
        w.politikSetzen(s,policy.patch);
        const vorFoto=foto(w,s),anzahlMinuten=720;
        let maximalBelegteJobs=0,maximalBeschaeftigte=0,belegteMinuten=0;
        for(let minute=0;minute<anzahlMinuten;minute++){
          w.minute(s);
          const jobs=Number(!!s.w3.auftrag)+Number(!!s.w5n.frachtauftrag);
          const aktive=frachter(s).filter(sh=>sh.phase==='reise'||sh.auftrag==='w5ac-ueberfuehrung').length;
          maximalBelegteJobs=Math.max(maximalBelegteJobs,jobs);
          maximalBeschaeftigte=Math.max(maximalBeschaeftigte,aktive);
          belegteMinuten+=Number(jobs>0);
          assert.ok(jobs<=1,'Originalkern: Erz und Eis dürfen nie parallel eine Fracht belegen');
          if(minute%60===0)pruefe(w,s,'K11 '+policy.name+' Minute '+minute);
        }
        pruefe(w,s,'K11 '+policy.name+' nach 720 Minuten');
        const nach=foto(w,s);
        const snap=w.save(s),copy=w.load(snap);
        assert.equal(w.hash(s),w.hash(copy),'K11 identischer Save/Load-Hash');
        for(let minute=0;minute<45;minute++){w.minute(s);w.minute(copy);}
        assert.equal(w.hash(s),w.hash(copy),'K11 deterministisches Replay nach Probe');
        pruefe(w,s,'K11 Replay');
        const auswertung={seed,politik:policy.name,minutes:anzahlMinuten,
          vorher:vorFoto,nachher:nach,
          maximalBelegteJobs,maximalBeschaeftigte,
          belegteMinuten,
          neueErzAuftraege:nach.w3Beauftragt-vorFoto.w3Beauftragt,
          neueEisfrachtAuftraege:nach.eisFrachtBeauftragt-vorFoto.eisFrachtBeauftragt,
          neuerW5Absatz:nach.neueGekaufte-vorFoto.neueGekaufte,
          neueAutomatischeErsatzkaeufe:nach.automatischerErsatz-vorFoto.automatischerErsatz,
          lagerAenderung:nach.werftlager-vorFoto.werftlager,
          finanzierteRueckstaende:nach.offeneW5,
          weltgeld:geld(s),minted:s.minted,burned:s.burned,
          nachReplayHash:w.hash(s)};
        resultate.push(auswertung);
        console.log('K11_NACHFRAGE '+JSON.stringify(auswertung));
      }
      assert.equal(resultate.length,2);
      assert.equal(resultate[0].vorher.werftlager,2);
      assert.equal(resultate[1].vorher.werftlager,2);
      for(const r of resultate){
        assert.equal(r.maximalBelegteJobs,0,
          'K11: in 720 Minuten kein echter W3/W5n-Frachtauftrag finanzierbar');
        assert.equal(r.belegteMinuten,0);
        assert.equal(r.neuerW5Absatz,0,'K11: trotz zwei realer Lagerhüllen kein zusätzlicher Kauf');
        assert.equal(r.neueAutomatischeErsatzkaeufe,0,
          'K11: gesunde vorhandene Frachter erfordern keine weitere Ersatzbeschaffung');
        assert.equal(r.nachher.brauchbareFrachter,10,'10 originale gebrauchte Frachter fahrbereit');
        assert.equal(r.nachher.offeneW5,2);
        assert.equal(r.nachher.speditionISK,46);
        assert.equal(r.nachher.iceWorkRequired,120);
        assert.equal(r.nachher.iceCrewShortfall,74,
          'K11: der reale Eis-Pilotenfonds ist 74 ISK unterfinanziert');
        assert.equal(r.nachher.iceBuyerRequired,490);
        assert.equal(r.nachher.iceBuyerAccount,'fonds_transport');
        assert.equal(r.nachher.iceBuyerISK,0,
          'K11: Original-W5n-Käufer hat keinerlei finanzierte Nachfrage');
        assert.equal(r.nachher.iceBuyerShortfall,490,
          'K11: Käuferdefizit kommt UNABHÄNGIG vom fehlenden Frachtlohn hinzu');
        assert.equal(r.nachher.neueGekaufte,r.vorher.neueGekaufte);
        assert.ok(r.nachher.freieFrachterAldera>=1);
        assert.equal(r.nachher.weltgeld,33000);
      }
    });
}
