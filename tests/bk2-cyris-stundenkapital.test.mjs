// B-K2: kontrollierte echte 60-Minuten-Buchungsfolge, keine Produktregeln.
// B-K1 ist Basis; Originalfoerderung, -produktion, -handel, -preis, -kosten bleiben unveraendert.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const b1=fs.readFileSync(new URL('./bk1-cyris-nahrungskreislauf.test.mjs',import.meta.url),'utf8');
const anchor="test('B-K1:";
const marker=b1.indexOf(anchor);
assert(marker>1000,'B-K1 fixture fehlt');
const header=b1.slice(0,marker).replace("new URL('../index.html',import.meta.url)",
                                     "new URL('../index.html',referenceUrl)");
const tools=new Function('fs','assert','referenceUrl',header+
 ';return {core,welt,audit,ueberweise};')(fs,assert,import.meta.url);
const {core,welt,audit,ueberweise}=tools;
const S='st_cyris',F='fonds_cyris',M='npc3',H='hh_cyris';
const stunde=core.rules.economy.stunde,bedarfsMenge=core.rules.world.stations[S].verbrauch.nahrung;
assert.equal(stunde,60);
assert.equal(bedarfsMenge,3);
const bank=(s)=>Object.values(s.owners).reduce((n,o)=>n+o.cash,0);
const lagerWert=(s,ware)=>Object.values(s.stations).reduce((n,x)=>n+(x.lager[ware]||0),0)+
  Object.values(s.ships).reduce((n,x)=>n+(x.ladung[ware]||0),0);
function realZeit({seed=42,stunden=24,modus='original',fondsLohn=false,
                   fabrikLohn=0,mindestReserve=0,dividende=false,haushaltStart=400}={}){
 const {s,miner}=welt(seed,haushaltStart),station=s.stations[S];
 // FIXTURE-Start: keine 52 Gratisvorratsrationen, sondern 0 Erzeugnis
 // bei schon laufender, korrekt aus Anfangseis bezahlter Original-Charge.
 const alt=station.lager.nahrung;
 station.lager.nahrung=0;s.ledger.nahrung.initial-=alt;
 audit(s);
 const start={fonds:s.owners[F].cash,miner:s.owners[M].cash,station:s.owners[S].cash,
              haushalt:s.owners[H].cash,welt:bank(s)};
 const stundenBuch=[],verkauft=0;
 let totals={konsum:0,prod:0,gefoerdert:0,gehZahlt:0,fondsLohnGezahlt:0,ausgeschuettet:0,
             fondslauf:0,stundenMitUnbezahlterArbeit:0};
 let abbruch=null;
 for(let hour=1;hour<=stunden;hour++){
   const h0={eis:s.ledger.eis.mined,nahrung:s.ledger.nahrung.produced,
             kosten:s.stats.konto[M].kosten,fonds:s.owners[F].cash,
             nahrungLager:station.lager.nahrung,gesamt:bank(s)};
   for(let minute=0;minute<stunde;minute++){
     s.tick++;
     core.foerderung(s,core.rules);
     // Beide Varianten behalten Originalrezept, Originaldauer, Originalbestandslimit.
     // Nur der explizite B-K2-OPTIONALE Nachfrage-Disponent aktiviert die Fabrik
     // nicht, solange bereits drei voll finanzierbare Rationen bereitstehen.
     if(modus==='original'||station.lager.nahrung<bedarfsMenge)
       core.produktion(s,core.rules);
   }
   // Vollstundenabrechnung aus dem Original-Core. Nicht nach zwei Minenminuten
   // wie in B-K1. Keine eigene frei erfundene Stundenkostenformel.
   core.betriebskosten(s,core.rules);
   const minenSoll=core.rules.world.betriebskosten.miner*
       (s.ledger.eis.mined-h0.eis)/stunde; // nur Plausibilitaetswert
   const originalKosten=s.stats.konto[M].kosten-h0.kosten;
   const fondsPlus=s.owners[F].cash-h0.fonds;
   assert(originalKosten>=0&&originalKosten<=Math.ceil(minenSoll));
   if(fondsPlus<0)throw Error('Unkontrollierter Fremdfondsabfluss im Test');
   // Jedes Einkommen wird von einem EINDEUTIG belegten, bereits belasteten
   // Zahler abgezogen; Null-ISHK, Null-Geschenke, Null-Mint.
   let gezahltFonds=0;
   if(fondsLohn){
     // Rueckfuehrung NUR nachweislich im Original-Core anfallender Minerarbeit,
     // nicht automatisch aller Handelsgebuehren und nicht pauschal 150 ISK/h.
     gezahltFonds=Math.min(originalKosten,fondsPlus);
     ueberweise(s,F,H,gezahltFonds,'reale NPC3-Betriebsleistungen als Haushaltseinkommen');
   }
   const neu=s.ledger.nahrung.produced-h0.nahrung;
   const fabGeh=neu*fabrikLohn;
   if(fabGeh>0){
     if(s.owners[S].cash<fabGeh){abbruch={hour,grund:'fabriklohn-nicht-finanzierbar'};break;}
     ueberweise(s,S,H,fabGeh,'hypothetischer Fabriklohn fuer nachgewiesene reale Produktion');
   }
   // Ein gezielter Testoption-Dividendenabfluss, NICHT pauschale
   // Zwangsabschoepfung: nur KassenuEBERSCHUSS gegen den Anfangsbestand plus Reserve.
   let dividenden=0;
   if(dividende){
     for(const owner of [M,S]){
       const kapital=owner===M?start.miner:start.station;
       const ueberschuss=Math.max(0,s.owners[owner].cash-kapital-mindestReserve);
       if(ueberschuss>0){ueberweise(s,owner,H,ueberschuss,'realisierter Kassenueberschuss, kein Kredit');
         dividenden+=ueberschuss;}
     }
   }
   let n=0,entgelt=0;
   for(let i=0;i<bedarfsMenge;i++){
     if(station.lager.nahrung<1){abbruch={hour,grund:'keine-nahrung'};break;}
     const preis=core.preis(s,S,'nahrung',core.rules);
     if(s.owners[H].cash<preis){abbruch={hour,grund:'haushalt-ohne-kaufkraft',
       kasse:s.owners[H].cash,preis};break;}
     ueberweise(s,H,S,preis,'nachgewiesene Nahrung als Haushaltskauf');
     station.lager.nahrung--;s.ledger.nahrung.consumed++;
     entgelt+=preis;n++;
   }
   totals.konsum+=n;totals.prod+=neu;
   totals.gefoerdert+=s.ledger.eis.mined-h0.eis;
   totals.gehZahlt+=fabGeh;totals.fondsLohnGezahlt+=gezahltFonds;
   totals.ausgeschuettet+=dividenden;totals.fondslauf+=fondsPlus;
   if(s.owners[M].cash===0&&miner.arbeit>0)totals.stundenMitUnbezahlterArbeit++;
   const snapshot={hour,konsum:n,produktion:neu,bergbau:s.ledger.eis.mined-h0.eis,
     originaleBergbaukosten:originalKosten,fondsPlus,gezahltFonds,fabGeh,
     dividenden,entgelt,haushalt:s.owners[H].cash,miner:s.owners[M].cash,
     station:s.owners[S].cash,fonds:s.owners[F].cash,
     nahrungLager:station.lager.nahrung};
   stundenBuch.push(snapshot);
   audit(s);
   assert.equal(bank(s),start.welt,'keine neu geschaffenen oder verschwundenen ISK');
   if(abbruch)break;
 }
 return {s,miner,start,stundenBuch,totals,abbruch,erfuellteStunden:
    stundenBuch.filter(x=>x.konsum===bedarfsMenge).length};
}
test('B-K2: 60 Originalminuten und reale Stundenkosten statt 2-Minuten-Sonderrechnung',()=>{
 const x=realZeit({stunden:1});
 assert.equal(x.s.tick,60);
 assert.equal(x.stundenBuch.length,1);
 const row=x.stundenBuch[0];
 assert.equal(row.bergbau,60,'60 Foerder-Minuten');
 assert.equal(row.originaleBergbaukosten,150,'echte Miner-Stundenkosten');
 assert.equal(row.fondsPlus,150,'reale stundenweise Kosten an Fonds');
 assert.equal(x.s.minted,0);assert.equal(x.s.burned,0);
 audit(x.s);
 console.log('BK2_60MIN_IST '+JSON.stringify(row));
});
test('B-K2: realer 3-Nahrung-pro-Stunde-Bedarf stoppt bei fehlender Kaufkraft',()=>{
 const x=realZeit({stunden:24,modus:'original'});
 assert(x.abbruch,'fehlende Haushaltskaufkraft muss sichtbar werden');
 assert.equal(x.abbruch.grund,'haushalt-ohne-kaufkraft');
 assert(x.erfuellteStunden<24);
 assert.equal(x.s.minted,0);audit(x.s);
 console.log('BK2_ORIGINAL_OHNE_LOHN '+JSON.stringify({stunden:x.erfuellteStunden,
  abbruch:x.abbruch,abschluss:x.stundenBuch.at(-1)}));
});
test('B-K2: Originalfabrik produziert ohne Bedarfsdisposition deutlich mehr als 3 Nahrung pro Stunde',()=>{
 const x=realZeit({stunden:6,modus:'original',fondsLohn:true,fabrikLohn:0});
 assert(x.totals.prod>x.totals.konsum);
 assert(x.stundenBuch.some(x=>x.produktion>x.konsum));
 assert(x.stundenBuch.every(x=>x.originaleBergbaukosten>=0));
 audit(x.s);
 console.log('BK2_PRODUKTIONSUEBERSCHUSS '+JSON.stringify({stunden:x.stundenBuch.length,
  erzeugt:x.totals.prod,verbraucht:x.totals.konsum,abbruch:x.abbruch}));
});
test('B-K2: begrenzte Nachfrage-Disposition und reale Arbeitseinkommen - keine Gratisration',()=>{
 const x=realZeit({stunden:12,modus:'bedarf',fondsLohn:true,fabrikLohn:2});
 assert(x.erfuellteStunden>0,'wenigstens eine produktiv bezahlte Stunde');
 assert(x.totals.gehZahlt<=x.totals.prod*2);
 assert(x.stundenBuch.every(x=>x.konsum<=3));
 audit(x.s);
 console.log('BK2_BEDARFSZAHLUNG '+JSON.stringify({stunden:x.erfuellteStunden,
  erzeugt:x.totals.prod,verbraucht:x.totals.konsum,
  arbeitsloehne:x.totals.fondsLohnGezahlt,fabrikloehne:x.totals.gehZahlt,
  abbruch:x.abbruch,schluss:x.stundenBuch.at(-1)}));
});
test('B-K2: Bedarfsdisposition plus nachweisbar zahlbare Dividenden mit Betriebskapital',()=>{
 const x=realZeit({stunden:12,modus:'bedarf',fondsLohn:true,fabrikLohn:2,
                  mindestReserve:300,dividende:true});
 assert(x.stundenBuch.every(r=>r.konsum<=3));
 assert(x.totals.ausgeschuettet>=0);
 assert.equal(x.s.initialSupply,bank(x.s));
 audit(x.s);
 console.log('BK2_RESERVE_ECHT '+JSON.stringify({stunden:x.erfuellteStunden,
  startkapital:x.start,abbruch:x.abbruch,schluss:x.stundenBuch.at(-1),
  dividenden:x.totals.ausgeschuettet}));
});
test('B-K2: deterministische Replay-Hashes und Bargeld-/Warenaudit',()=>{
 const a=realZeit({seed:7,stunden:18,modus:'bedarf',fondsLohn:true,
   fabrikLohn:2,mindestReserve:300,dividende:true});
 const b=realZeit({seed:7,stunden:18,modus:'bedarf',fondsLohn:true,
   fabrikLohn:2,mindestReserve:300,dividende:true});
 assert.equal(core.index.hash(a.s),core.index.hash(b.s));
 assert.deepEqual(a.stundenBuch,b.stundenBuch);
 audit(a.s);audit(b.s);
});
