// K13 [ANALYSE] – echte (nur Forschungsadapter) Buchung + ORIGINAL W5n-Eisfracht.
// Kein Produktpatch, keine Gratis-Förderung, keine unautorisierte Firmenrettung.
import test from 'node:test';
import assert from 'node:assert/strict';
import {k11K10Endstand} from '../tools/k11-k10-endstand.mjs';
import {oeffnen,abschliessen,brueckePruefen} from '../tools/k13-finanzbruecke.mjs';

const geld=s=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const audit=(w,s,phase)=>{
  const a=w.audit(s);assert.equal(a.ok,true,phase+' Originalaudit: '+JSON.stringify(a.fehler));
  assert.equal(s.minted,0);assert.equal(s.burned,0);
  assert.equal(geld(s),33000,phase+' 33000-ISK-Weltgeld');
  assert.equal(s.w5.fertig-s.w5.verkauft,s.stations.st_nadir.lager.frachter,
    phase+' Werftlagererhaltung');
};
function originalNachK12(seed){
  const {welt:w,zustand:s}=k11K10Endstand(seed);
  audit(w,s,'K13 K10 realer Endzustand');
  w.politikSetzen(s,{stilllegung:false,ersatzkauf:true,eisfracht:true});
  for(let n=0;n<720;n++){
    w.minute(s);
    if(n%120===0)audit(w,s,'K13 Ursprung Minute '+n);
  }
  assert.equal(s.stations.st_aldera.lager.eis,52);
  assert.equal(s.owners.st_nadir.cash,3440);
  assert.equal(s.owners.transport.cash,46);
  assert.equal(s.owners.eigner_transport.cash,261);
  assert.equal(s.w5n.frachtauftrag,null);
  // Zwei Finanzierungsprofile werden mit EXAKT EINEM vom Eigentuemer
  // unterschriebenen Originalauftrag verglichen. Original-NPC-Auto-
  // Frachtfolge wird danach als eigener Positiv-/Langzeitversuch geprueft.
  // Ein bestehender manuell signierter shipFreightIce bleibt zugelassen.
  w.politikSetzen(s,{eisfracht:false});
  audit(w,s,'K13 Ausgang voller 50-Eis-Bestand');
  return {w,s};
}
function betrag(s,key){return s.kanon.buch.summen[key]||0;}
for(const seed of [42,7]){
  test('K13 Seed '+seed+': Original-Fracht über rechtsverbindliche Rechnungs- oder Eigenkapitalbrücke',
    {timeout:18*60*1000},()=>{
      const {w,s}=originalNachK12(seed);
      const vor=w.canonical(s),vorHash=w.hash(s);
      const frei=Object.keys(s.ships).sort().find(id=>{
        const sh=s.ships[id];
        return sh.owner==='transport'&&sh.klasse==='frachter'
          &&sh.phase==='dock'&&sh.system==='aldera'&&sh.auftrag==='halten'
          &&Object.values(sh.ladung).every(x=>x===0);
      });
      assert.ok(frei);
      const quote=w.kern.pilotIceFreightQuote(s,frei);
      assert.equal(quote.ok,false);assert.match(quote.grund,/Spedition kann Flugarbeit nicht vorfinanzieren/);

      for(const bad of [
        {modus:'kundenvorschuss',unterzeichner:'st_nadir',einwilligung:false,schiff:frei},
        {modus:'kundenvorschuss',unterzeichner:'eigner_transport',einwilligung:true,schiff:frei},
        {modus:'eignereinlage',unterzeichner:'st_nadir',einwilligung:true,schiff:frei},
        {modus:'eignereinlage',unterzeichner:'eigner_transport',einwilligung:true,schiff:frei,amount:9999},
        {modus:'eignereinlage',unterzeichner:'eigner_transport',einwilligung:true,schiff:'sh404'}
      ]){
        const fail=oeffnen(w,s,bad);
        assert.equal(fail.ok,false,'K13: ungültiger Vertrag muss rechtsverbindlich abgewiesen werden');
        assert.equal(w.canonical(s),vor,'K13: fehlgeschlagener Vertrag ohne einzige Buchung');
      }
      const resultate=[];
      for(const [modus,unterzeichner,amount,src,art] of [
        ['kundenvorschuss','st_nadir',120,'st_nadir','k13-kunden-vorschuss'],
        ['eignereinlage','eigner_transport',74,'eigner_transport','k13-eigner-einlage']
      ]){
        const basis=w.load(w.save(s));
        const origCash={
          transport:basis.owners.transport.cash,
          nadir:basis.owners.st_nadir.cash,
          shareholder:basis.owners.eigner_transport.cash,
          wage:basis.w5ag.paid.eis,
          completed:basis.w5n.frachtAbgeschlossen,
          ice:basis.w5n.eisGeliefert,
          freight:basis.w5n.frachtUmsatz,
          water:basis.w5n.wasserProduziert
        };
        const start=oeffnen(w,basis,{modus,unterzeichner,einwilligung:true,schiff:frei});
        assert.equal(start.ok,true,'K13: Originalfracht muss nach expliziter Vertragsbuchung starten: '+start.reason);
        assert.equal(w.canonical(basis),vor,'K13: Research-Finanzierung gibt neuen Zustand aus statt Ursprungswelt zu ändern');
        const t=start.zustand;
        assert.equal(t.kanon.k13.phase,'aktiv');
        assert.equal(t.w5n.frachtauftrag.schiff,frei);
        assert.equal(t.w5n.frachtauftrag.phase,'hin');
        assert.equal(t.owners.w5n_fracht_arbeit.cash,120);
        assert.equal(t.owners.w5n_fracht_kauf.cash,490);
        assert.equal(t.owners.transport.cash,origCash.transport+amount-120);
        assert.equal(t.owners[src].cash,origCash[src==='st_nadir'?'nadir':'shareholder']-amount-(src==='st_nadir'?490:0),
          'K13: Kundenkonto zahlt zusätzlich zum echten Vorschuss die ORIGINAL 490-ISK-Treuhandrechnung');
        assert.equal(betrag(t,art+'|'+src+'|transport'),amount);
        assert.equal(brueckePruefen(w,t).ok,true);
        audit(w,t,'K13 '+modus+' nach echtem Original-Frachtstart');
        const again=oeffnen(w,t,{modus,unterzeichner,einwilligung:true,schiff:frei});
        assert.equal(again.ok,false,'K13: Doppelbuchung eines signierten Auftrags verboten');
        const beforeEarly=w.canonical(t);
        assert.equal(abschliessen(w,t,{unterzeichner}).ok,false,
          'K13: keine Vorauszahlung als verdiente Abschlagszahlung vor Fracht');
        assert.equal(w.canonical(t),beforeEarly);

        // Manipulation der nur K13-eigenen Rechtsbelege bleibt erkennbar.
        const fake=w.load(w.save(t));fake.kanon.k13.amount++;
        assert.equal(brueckePruefen(w,fake).ok,false,
          'K13: Korruption des unterschriebenen Originals nicht akzeptiert');
        assert.equal(w.canonical(t),beforeEarly,'K13: Fremdmanipulation wirkt nicht auf echten Zustand');

        const savedStart=w.load(w.save(t));assert.equal(w.hash(t),w.hash(savedStart));
        for(let n=0;n<60;n++){
          w.minute(t);w.minute(savedStart);
          if(n%20===0)audit(w,t,'K13 halbe Original-Rundfracht '+modus);
        }
        assert.equal(w.hash(t),w.hash(savedStart),'K13: 60 Originalflugminuten deterministisch');
        assert.equal(t.w5n.eisGeliefert-origCash.ice,50,
          'K13: Eis mit physischer 60-Minuten-Hinfahrt Nadir erreicht');
        assert.equal(t.w5n.frachtauftrag.phase,'rueck');
        assert.equal(t.w5ag.paid.eis-origCash.wage,60,
          'K13: 60 echte, einzeln bezahlte Pilotenminuten');
        const early=w.canonical(t);
        assert.equal(abschliessen(w,t,{unterzeichner}).ok,false,
          'K13: erst der wirkliche Rückflug darf eine Schlussrechnung freigeben');
        assert.equal(w.canonical(t),early);
        for(let n=0;n<60;n++){
          w.minute(t);w.minute(savedStart);
          if(n%20===0)audit(w,t,'K13 zweite Originalflug-Hälfte '+modus);
        }
        assert.equal(w.hash(t),w.hash(savedStart),'K13: 120 Originalflugminuten identisch');
        assert.equal(t.w5n.frachtauftrag,null);
        assert.equal(t.w5n.frachtAbgeschlossen-origCash.completed,1);
        assert.equal(t.w5n.eisGeliefert-origCash.ice,50);
        assert.equal(t.w5n.frachtUmsatz-origCash.freight,240);
        assert.equal(t.w5ag.paid.eis-origCash.wage,120);
        assert.equal(t.ships[frei].system,'aldera');
        assert.equal(t.ships[frei].phase,'dock');
        assert.equal(t.owners.w5n_fracht_kauf.cash,0);
        assert.equal(t.owners.w5n_fracht_arbeit.cash,0);
        assert.ok(t.w5n.wasserProduziert-origCash.water>=10,
          'K13: reales nach der Lieferung erzeugtes Wasser');
        audit(w,t,'K13 Abfahrt/Hin-/Rückfahrt abgeschlossen');
        assert.equal(brueckePruefen(w,t).ok,true,
          'K13: echte Lieferung darf als ausstehende Schlussrechnung geprüft werden');

        const wrongClose=abschliessen(w,t,{unterzeichner:'house'});
        assert.equal(wrongClose.ok,false,'K13: nur signierender Eigentümer bekommt Abschlussrecht');
        const beforeClose=w.canonical(t);
        const close=abschliessen(w,t,{unterzeichner});
        assert.equal(close.ok,true,close.reason);
        assert.equal(w.canonical(t),beforeClose,
          'K13: Abschluss ist eine atomar neue Forschungszustandsfassung');
        const done=close.zustand;
        assert.equal(done.kanon.k13.phase,'abgeschlossen');
        assert.equal(brueckePruefen(w,done).ok,true);
        assert.equal(abschliessen(w,done,{unterzeichner}).ok,false,
          'K13: zweimalige Erstattung des Kundenvorschusses verboten');
        if(modus==='kundenvorschuss'){
          assert.equal(betrag(done,'k13-kunden-rueckzahlung|transport|st_nadir'),120);
          assert.equal(done.owners.transport.cash,166);
          assert.equal(done.owners.eigner_transport.cash,261);
        }else{
          assert.equal(betrag(done,'k13-kunden-rueckzahlung|transport|st_nadir'),0);
          assert.equal(done.owners.transport.cash,240);
          assert.equal(done.owners.eigner_transport.cash,187);
        }
        const clone=w.load(w.save(done));
        assert.equal(w.hash(done),w.hash(clone),'K13 Vertrag bleibt sicher im JSON-Save');
        for(let n=0;n<70;n++){w.minute(done);w.minute(clone);}
        assert.equal(w.hash(done),w.hash(clone),'K13 nach Abschluss 70-Minuten-Determinismus');
        audit(w,done,'K13 '+modus+' post settlement');
        const data={seed,modus,beleg:close.beleg,
          originalStartCash:origCash,
          after:{transport:done.owners.transport.cash,
            shareholder:done.owners.eigner_transport.cash,
            nadir:done.owners.st_nadir.cash,
            iceDelivered:done.w5n.eisGeliefert-origCash.ice,
            freightRevenue:done.w5n.frachtUmsatz-origCash.freight,
            paidPilotMinutes:done.w5ag.paid.eis-origCash.wage,
            waterProduced:done.w5n.wasserProduziert-origCash.water,
            freightComplete:done.w5n.frachtAbgeschlossen-origCash.completed,
            iceEscrow:done.owners.w5n_fracht_kauf.cash,
            crewEscrow:done.owners.w5n_fracht_arbeit.cash,
            money:geld(done),minted:done.minted,burned:done.burned},
          hash:w.hash(done)};
        resultate.push(data);
        console.log('K13_ECHTE_BRUECKE '+JSON.stringify(data));
      }
      assert.equal(resultate.length,2);
      assert.equal(resultate[0].after.transport+resultate[0].after.shareholder,427);
      assert.equal(resultate[1].after.transport+resultate[1].after.shareholder,427);
      assert.equal(resultate[0].after.iceDelivered,resultate[1].after.iceDelivered);
      assert.equal(resultate[0].after.money,33000);
      assert.equal(resultate[1].after.money,33000);
      assert.equal(w.hash(s),vorHash,'K13: K10/K12-Ausgangszustand unverändert und auditierbar');
      audit(w,s,'K13 Original unangetastet');
    });
}
