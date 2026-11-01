# B-K2 – Cyris im 60-Minuten-Takt: reale Betriebskosten, Nachfrage und Unternehmenskapital

**Stand:** 01.11.2026. **[MAIN]** `b4e604d` (v0.12.5, Regel14, Schema8), unverändert.
**[ANALYSE/DRAFT]** [PR #86](https://github.com/tobiasfranziskus/Check/pull/86),
auf [B-K1 #85](https://github.com/tobiasfranziskus/Check/pull/85) aufgebaut.
**Keine Produktimplementierung, kein Merge.** Die einzige verbindliche
Produktplanung bleibt [ROADMAP.md](ROADMAP.md), Phase B.

## 1. Präzise Frage und kleinster Test

B-K1 hat isoliert gezeigt, dass die Haushaltsnachfrage nur bei vollständig
zurückgegebenen Nettoerlösen einen konstanten Kontostand behält und dass
selbst eine kleine Unternehmensrücklage die Verbraucherkaufkraft vermindert.

B-K2 prüft deshalb den **realen stündlichen Kostenzeitpunkt** der bestehenden
Wirtschaft, die vorhandene Nahrungsproduktion und die Alternative, nur den
tatsächlichen Bedarf zu produzieren:

- **[ORIGINALFUNKTIONEN]** `createState`,
  `foerderung`, `handel` (durch `foerderung` beim realen Verkauf),
  `produktion`, `preis`, `betriebskosten` und `m_core_index.audit/hash`.
- Die kontrollierte Uhr zählt **60 Original-Förderungs- und Produktionsminuten**,
  dann genau eine stündliche `betriebskosten`-Abrechnung. Der reale
  Cyris-Nahrungsbedarf ist laut Hauptregeln **3 Nahrung je Spielstunde**.
- **[TESTHYPOTHESE]** Eine testweise Haushaltskasse kauft **jede Nahrungseinheit
  einzeln zum jeweils aktuell berechneten Preis** (nicht zu einem
  automatisch festgelegten subventionierten Satz); fehlendes Geld
  verhindert die Ausgabe.
- **[TESTHYPOTHESE]** Ein ausschließlich aus bereits vom Original-Miner
  bezahlten Kosten finanzierter Fondslohn kann an die Haushalte fließen.
  Ein zusätzlicher Fabriklohn von **2 ISK je tatsächlich erzeugter Nahrung**
  ist ausdrücklich eine *analytische Beispielannahme*, nicht
  im produktiven `m_core_produktion` enthalten.
- **[TESTHYPOTHESE]** Dividendenauszahlung nur aus tatsächlicher Kasse,
  die den anfänglichen Unternehmensbestand plus **300 ISK Schutzreserve**
  übersteigt – keine Erhöhung des verfügbaren Gelds, keine Rückzahlung
  eines fiktiven Gewinns.
- **[TESTHYPOTHESE]** Optional wird die **Aufrufhäufigkeit der echten
  Produktionsfunktion** gedrosselt, wenn mindestens drei kaufbare
  Nahrungseinheiten bereits auf Lager liegen. Das ist noch **keine
  automatische Original-Core-Entscheidung**. Das originale Rezept
  (`2 Eis → 1 Nahrung`, Dauer 6) und die originalen
  Fabrikmaterialbuchungen bleiben unverändert.

Die Testanlage schaltet andere aktive Schiffe und Produktionslinien aus.
Sie ruft die echten Teilmodule in korrekter relativer Minuten-/Stunden-
Reihenfolge auf, **aber nicht den gesamten** `m_core_step.step`: originale
Verbrauchs-, Geldfonds-, Piraten-, NPC-Bau- und Außenhandelsaktionen würden
eine andere, unkontrollierte Mehr-Systeme-Welt erzeugen. Dies ist also
**keine 60-Minuten-Abnahme des vollständigen Spiels**.

Die kontrollierte Hauptvariante startet mit **0 Nahrung im Cyris-Lager**;
die vorhandenen 52 Einheiten werden *nur beim Erstellen des Testzustands*
aus dem Eröffnungs-Warenledger und der Startlagerannahme herausgenommen,
nicht als reale Warenvernichtung oder Exportgewinn verbucht. Ein eigener
Gegenlauf verwendet ausdrücklich die **52 echten Startlagereinheiten**
aus `main`, um diese Annahme zu prüfen. Der erste laufende Original-
Produktionsauftrag ist bereits durch den anfänglichen Eisbestand gedeckt.

## 2. Messung: Originalkern, echter Stundenabschluss

**Eine Stunde** im kontrollierten Nullvorratsfall:

- **60 Eis** real gefördert: 60 originäre Arbeitsschritte.
- **150 ISK** echte, voll bezahlte Betriebskosten von NPC3 an den Cyris-Fonds.
- **10 Nahrung** aus dem ursprünglichen sechsminütigen Rezept produziert.
- **3 Nahrung** von der testweise zahlungsfähigen Haushaltskasse gekauft.
- **164 ISK** tatsächlich gezahlt, da dynamische Original-Preise bei
  anfangs leerem Lebensmittellager sehr hoch sind.
- Haushaltsbestand **400 → 236 ISK**. Keine neuen ISK, keine ungedeckte Arbeit.

**[Gegenprobe Original-Startlager]** Sind die realen **52 Anfangseinheiten**
vorhanden, kostet der erste stündliche Dreierkauf nur **85 ISK**;
der Liquiditätsausfall tritt dann beim **fünften** statt beim
dritten Stundenabschluss ein.

## 3. 24-Stunden-Ziel und getrennte Varianten

| Variante | Voll bezahlte Stunden | Stopp |
| --- | ---: | --- |
| Originalproduktion + 400 Haushalts-ISK, **ohne neue Lohneinkommen**, Startlager 0 | **2** | Stunde 3; noch 35 ISK, nächste Nahrung kostet 48 |
| Gleiches, **Originalbestand von 52 Nahrung** | **4** | Stunde 5; noch 22 ISK, nächste Nahrung kostet 27 |
| Originalproduktion + tatsächlichen Minerkosten-Rückfluss | 6 beobachtet | In 6 Stunden **60 Nahrung produziert, 18 konsumiert** – strukturelle Überproduktion |
| Bedarfsgesteuerte Originalproduktion + tatsächlichen Miner-Fondslohn + **2 ISK/Fabrikgut** | **4** | Stunde 5; Haushalt 52 ISK, nächste Nahrung 58 ISK |
| Wie davor + nur kassenfinanzierte Dividenden nach **300 ISK Unternehmens-Reserve** | **4** | Stunde 5; Haushalt 1 ISK, nächste Nahrung 59 ISK |

Die dritte Zeile ist ein **sechs-Stunden-Strukturvergleich**, keine
Abbruch-/Resilienz-Zusage. Die Fabrik braucht nur für 3 konsumierte
Nahrungseinheiten 6 Eis, kann aber nach der unveränderten
6-Minuten-Produktion **10 Nahrung pro Stunde** herstellen und
verbraucht dafür **20 Eis pro Stunde**, sofern der Input vorhanden ist.
Für tatsächliche Arbeits- und Handelsbezahlung reicht es nicht,
lediglich die richtige Rezeptfunktion aufzurufen: auch Disposition,
Nachfrage und Liquidität müssen zusammenpassen.

Im bedarfsgesteuerten Gegenversuch entstanden bis zum fünften Stunden-
abbruch **15 Nahrung** bei **13 abgenommenen**. Der tatsächlich aus
Original-Bergbaubetrieb rückgezahlte Haushaltslohn betrug
**380 ISK**, plus **30 ISK** Test-Fabriklöhne; dennoch war die
fortgesetzte vollständige Endnachfrage nicht finanzierbar. Im
300-ISK-Reservefall kamen **7 ISK** reale Dividenden hinzu,
ohne die Zahlungsunfähigkeit zu verhindern. Beide sind **negative
Wirtschaftsergebnisse**, keine positiven Produktempfehlungen.

Die ursprüngliche Produktionsfunktion kennt bislang keine
eigenständigen Fabriklöhne und keine nachgewiesene Auftraggeber-
Endnachfrage. Der Test beweist weder, dass ein 2-ISK-Lohn richtig wäre,
noch dass 300 ISK die erforderliche Kapitalreserve decken.

## 4. Technische Ergebnisse und Grenzen

**[CI #41321499296](https://github.com/tobiasfranziskus/Check/actions/runs/41321499296)**,
Commit `763fbdd`: **83/83 Node-Tests bestanden** (67 Basis,
9 B-K1 und **7 B-K2**). Die B-K2-Gegenproben zeigen
negative Endkundenzahlung, vollständige Original-Minerstunde,
Produktionsüberhang, bedarfsgesteuerte Vergleichsfahrt,
Fabriklohn/Dividenden aus realen Kassen, unveränderte Geld-/Waren-
Auditwerte und deterministische doppelte Seed-7-Ausführung.

Alle **Produkt-Referenzökonomiejobs** in CI prüfen die
**unveränderte** Welt ohne B-K2-Haushaltsmechanik. Keine
13×90d-Produktwelt mit neuen Haushalten, keine 365d-Langzeitwelt,
kein produktives Save-/Load für das zusätzliche Testkonto,
keine iPad-/NAS-Abnahme. Da die Haushaltskasse mit echten
Bestands-ISK initialisiert und nichts gemintet wird, bleibt die
exakte Geldgleichung erhalten.

## 5. Entscheidung und nächstes kleines Gate

**[ANALYSE NEGATIV]** B-K2 hat die versprochene **wiederholbar
selbstfinanzierte** Wirtschaftszelle **nicht** nachgewiesen.
Das ist ein klarer, nützlicher Widerlegungsbefund, kein Testfehler.

**[BELEGT]** Die ungebremste Nahrungsfabrik überproduziert relativ
zum Bedarf. Das Einkommen aus vorhandenen Kostenflüssen und
produktionsbezogenen Beispiel-Löhnen reicht im untersuchten
Kontrollfall trotz niedrigerer Produktmenge und echter Betriebskasse
nicht, um das gewünschte Haushaltsniveau wiederholt aufrechtzuerhalten.
Bei natürlichen Startbeständen verschiebt sich der Ausfall, verschwindet
aber nicht.

**[NÄCHSTES GATE / OPTION]** Vor weiteren 13×90d-Welten:
eine tatsächliche, aus realen Verkäufen oder belegten **Leistungen**
finanzierte, **wiederkehrende Haushalts-Einnahmekette** mit
minimalem zahlungsfähigem Nahrungsbedarf definieren; keine
Individualrettung, kein ungezieltes Gratisgeld.
**Separat** muss ein reproduzierbarer Kosten-/Gewinn-/Rücklagenplan
für genau eine Nahrungslinie und einen Miner zeigen, ob die
nachgefragte Produktion nach Arbeit und späteren Schiffskosten
profitabel ist. Erst dann entscheiden, ob ein zusätzlicher,
global begrenzter und auditierter Geldmodell-B-Endkundeneinkommenspfad
erforderlich ist. Geldmodell B benötigt eigene Freigabe.

Keine produktive Änderung, keine Regelversion, keine Spielstandmigration,
keine neue Roadmap.
