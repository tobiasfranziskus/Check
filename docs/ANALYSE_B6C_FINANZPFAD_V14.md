# B6c – Finanzierbare erste und zweite Handelsfahrt (Regel 14)

**31. Oktober 2026 · [ANALYSE/DRAFT] · verifizierte Diagnose nach CI, keine Produktregel.**

## Ausgangspunkt und Ziel

Produktiv integriert ist **[MAIN] main d454d066**, Spiel **v0.12.5, Regel 14, Schema 8**. B6a [#50](https://github.com/tobiasfranziskus/Check/pull/50) zeigt in vier Langzeit-Krisen fehlenden NPC-Wiederanlauf. B6b-P1 [#51](https://github.com/tobiasfranziskus/Check/pull/51) senkt zwar rechnerisch ungedeckte Arbeit, verschlechtert aber 13 Standardwelten und schafft weiterhin keine NPC-Trader-Verkäufe im Krisenfall. **P1 ist nicht zu integrieren.**

B6c verändert **keine** Wirtschaftsregel und stellt die tatsächlichen Markt-/Geld-/Warenbedingungen an **Tag 90** (Original-B1-Krise), **91, 120, 180, 270 und 365** gegenüber. Standardvergleich mit 13 festen Seeds bis Tag 90. Ziel ist eine begründete Entscheidung darüber, ob an einem bestimmten Zeitpunkt der **Schiffskauf**, die **Transportware**, die **Stationsnachfrage**, der **Konzernkontostand** oder die **Fahrtarbeit** das erste und ein folgendes Handelsgeschäft blockieren.

## Statische Diagnose, keine simulierte Rettung

Das Analysewerkzeug `tools/analyse-b6c-finanzpfad.mjs` nutzt den **unveränderten** Produktkern und übernimmt Markt-, Reserve-, Gebühren-, Routen-, Werft-/Sollplatz-, Stationseinkaufs- und Geldfunktionen aus `m_core_index`. Es prüft für NPC1 und NPC2:

- Welche tatsächlich freien Frachter bestehen, welche Sollplätze fehlen und welche **bereits produzierte** Hülle liegt in der einzigen Werft? Der reale Werftkauf samt Gebühr, die Anfahrt zur ersten Handelsquelle und die Fahrzeitarbeit werden als echte Anfangskosten berechnet.
- Welche Waren sind **oberhalb der Produktions-/Verbrauchsreserve** verkäuflich, welche Ziele haben **realen Lagerplatz und aktuelle Stationskaufkraft**? Wie groß sind Einstand, Zielerlös, Gebühren und der **Nettowert nach vollständiger kalkulierter Fahrtarbeit**?
- Welche zusätzliche Anfangskasse wäre unter dieser isolierten Momentaufnahme erforderlich? Welche bereits vorhandene Kasse befindet sich beim Spieler, bei NPC1/2/3, den Stationen, Fonds, Piraten und der Sicherheit? Bestehende Werftzuschüsse bei leerer Flotte werden **separat** ausgewiesen, nicht als garantierte Verfügbarkeit verrechnet.
- Ist **statisch** eine zweite profitable Transportfahrt vom ersten Ankunftsort aus mit dem ersten gedachten Verkaufserlös finanzierbar? **Wichtig:** Das ist eine rechnerische Kapitaluntergrenze, **keine zweite ausgeführte Simulation**. Nachfrage, Vorräte, Preise, Gegner und Betriebskosten anderer Schiffe bewegen sich in Wirklichkeit weiter.

**Nicht erlaubt:** Freie Schiffe, neue Geldquellen, Steuer auf Spielerersparnisse, Insolvenzregeln, veränderte Piraten, neue Preise, Migration, Produktrefactoring, Änderung von Goldenhashes oder Spielständen. Keine künstliche Kassenkorrektur. Kein Merge/Deployment.

## Prüfgates

- **13 Seed-Welten × 90 Tage** mit exakt erhaltenen 791 Mangelstunden und 310.058 NPC-Trader-Verkäufen;
- **vier echte v12-B1-Spielerzustände an Tag 90**, überprüfter historischer Hash vor v14-Migration, Weiterlauf bis Tag 365 mit originalen validierten Spielerbefehlen;
- zusammen **17 Läufe, 2.270 Tageshashes und 54.480 stündliche unabhängige Geld-/Warenaudits und Replays**, Save/Load, vorhandene 67 Standard-Node-Tests und archivierte PR-/CI-Artefakte;
- bei positiven Modellangeboten gelten die gespeicherten Werte als **theoretische** Kapitaluntergrenzen, nicht als behauptete Handelsabschlüsse. Entscheidend ist, welche belegten Blocker die historisch tatsächlich ausgebliebenen Trader-Verkäufe erklären.

## [TEST] Ausgeführt auf dem ersten PR-Head 5465724

[GitHub Actions #41178502134](https://github.com/tobiasfranziskus/Check/actions/runs/41178502134): **19/19 Jobs erfolgreich**, **67/67** bestehende Node-Tests (0 Fehler, 0 übersprungen). 13 feste Seed-Welten ×90 Tage und vier echte historische v12-B1-Spielerkrisen ×275 Tage auf Regel 14 fortgesetzt. **17 Läufe**, **2.270 Tageshashes**, **54.480 stündliche unabhängige Geld-/Warenaudits / identische Replays**, **220 Save/Load-Roundtrips**. Historische Starts anhand gespeicherter v12-Hashes, Standardwelt-Goldenwerte **791 Mangelstunden** und **310.058 NPC-Trader-Verkäufe**, Krisen-Unterdeckung **4.450 ISK** erfolgreich geprüft. **Kein echter Safari-/NAS-Test**, kein Merge/Deployment.

### Ergebnis: Konzernkassen und benötigtes Startkapital

Die folgenden Zahlen sind auf den tatsächlichen Zuständen von **Tag 90 bzw. Tag 365** auditiert. **Kapitalfehlbeträge sind nur statische Untergrenzen**, keine bereits ausgeführte Finanzierung.

| Fall | Tag | Spieler ISK | NPC1 / NPC2 ISK | Stations-/Fondskassen gesamt ISK | Frachter NPC1 / NPC2 | Frachter in Werft | Sofortiger Hüllenkauf inkl. Gebühr ISK | Mindestfehlbetrag statische erste profitable Fahrt NPC1 / NPC2 ISK | Statische zweite Fahrt NPC1 / NPC2 ISK | Aldera Silizium / Bauteile |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Miner | 90 | 42.795 | 0 / 132 | 5.238 / 1.258 | 0 / 0 | 2 | 780 | 1.018 / 886 | 1.230 / 1.098 | 0 / 0 |
| Miner | 365 | 43.676 | 0 / 132 | 4.045 / 1.305 | 0 / 0 | 2 | 780 | 1.263 / 1.131 | – / – | 0 / 0 |
| Handelsflotte | 90 | 39.762 | 0 / 0 | 4.466 / 1.300 | 0 / 0 | 2 | 780 | 1.018 / 1.018 | 1.247 / 1.247 | 0 / 0 |
| Handelsflotte | 365 | 42.444 | 0 / 0 | 5.312 / 1.500 | 0 / 0 | 2 | 780 | 1.240 / 1.240 | – / – | 0 / 0 |
| Station | 90 | 30.505 | 0 / 0 | 6.151 / 720 | 0 / 0 | 1 | 1.092 | 1.330 / 1.330 | 1.542 / 1.542 | 0 / 0 |
| Station | 365 | 32.710 | 0 / 0 | 7.040 / 1.257 | 0 / 0 | 2 | 780 | 1.018 / 1.018 | 1.230 / 1.230 | 0 / 0 |
| Jagd | 90 | 40.455 | 165 / 0 | 7.337 / 57 | 0 / 0 | 2 | 780 | 853 / 1.018 | 1.065 / 1.230 | 0 / 0 |
| Jagd | 365 | 42.883 | 165 / 0 | 6.018 / 326 | 0 / 0 | 2 | 780 | 853 / 1.018 | 1.295 / 1.460 | 0 / 0 |

**Anmerkung:** Stations- und Fondskassen sind jeweils Summen über verschiedene Orte bzw. Eigentümer, **keine gemeinsame verfügbare Handelsreserve**. Der Werftzuschuss laut `m_core_schiffbau.zuschuss` kann nur aus dem Fonds des Werftsystems finanziert werden und ist bei vollständig leerem Konzern nur in Höhe des Hüllenkaufs möglich. Er ersetzt **keinen** finanzierten Wareneinkauf und keine Folgefahrt. Auf dem Stand Tag 365 haben die Konzerne ohne eigene Frachter weiter keinen Handel wiederaufgenommen. `–` in der Zweitfahrtspalte heißt lediglich, dass **unter den eingefrorenen aktuellen Preis-/Kassen-/Bestandsbedingungen** keine zwei aufeinanderfolgenden Nettomargen-Geschäfte in den geprüften Optionen möglich sind, nicht dass prinzipiell niemals wieder eine Nachfrage entstehen könnte.

### Ein konkretes Rechenbeispiel, kein vollzogener Transport

Am Krisenendtag im Fall `station` findet der statische Rechner als **kapitalärmsten** Ansatz eine Lieferung von **4 Einheiten Silizium aus Dravos nach Aldera**. Die bereits verfügbare Ersatzhülle an der Werft kostet samt Gebühr 780 ISK; Die tatsächlich geprüfte Protokollzeile weist **864 ISK für Hülle + Anfahrt**, **70 ISK Warenkauf samt Gebühr** und **84 ISK Fahrtarbeit** aus, also **1.018 ISK Kapitalbedarf**. Die aus Kauf, Verkauf, Gebühren und Fahrtarbeit abgeleitete isolierte Nettomarge beträgt **12 ISK**, **vor einem wirtschaftlichen Deckungsbeitrag zur Hülle**. Dieser Betrag allein ist keine Zusage für den Schiffersatz oder jahrelange Versorgung.

Im `miner`-Fall beträgt das billigste nominell nach Arbeit noch positive Handelsgeschäft in den geprüften Angeboten am Tag 365 nur **4 ISK Nettomarge**, beim `handel-flotte`-Fall ebenfalls **4 ISK**. Der Optimierer minimiert **Startkapitaldefizit, nicht Maximierung der Rentabilität**. Er belegt keine allgemeine Obergrenze für erreichbare Erträge und berücksichtigt keine zukünftigen Preisänderungen.

### [ANALYSE] Ursache und Entscheidung

**Bestätigt:** In sämtlichen vier Krisen sind bereits an Tag 90 **0 NPC1/2-Frachter** vorhanden; an Tag 365 ebenso. Gleichzeitig existieren Werfthüllen, der Spieler besitzt 30.505–43.676 ISK, die Händler aber 0–165 ISK. Die Regelbegrenzung auf 6.000 ISK bei NPC-Handelskonzernen erklärt den Zustand **nicht unmittelbar**, weil sie in diesen Krisensnapshots weit unter dieser Grenze liegen. Sie schließt aber größere angesparte Arbeitspuffer aus, sobald die Konzerne sich erholen.

**Bestätigte Programmregel:** Ein Fonds kann einem vollständig schiffslosen Konzern beim Hüllenkauf helfen, aber nicht automatisch beim Startkapital für Ware und Fahrzeitarbeit. Stationsbestände sind kein Konzern-Eigentum; Stationskassen können Ware bezahlen, aber sie überweisen derzeit nicht unabhängig vom Handel laufendes Frachtkapital an NPC1/2. Eine bezahlte Hülle kann deshalb ohne Finanzierung des Warenhandels wirtschaftlich stillstehen.

**Interpretation / Grenze:** Die **unmittelbare Liquiditäts- und Asset-Zuordnung** ist das sichtbarste Hindernis. Dass ein alternativer Transfer aus bestehenden Stations-/Fondskassen ohne spätere Versorgungsschäden möglich wäre, ist damit **nicht bewiesen**. Ein bloßes Verschieben von ISK ohne Vertragsleistung, Eigentümer und Folgefinanzierung wäre keine freigegebene Reform.

**Nächster kleiner, separat zu genehmigender Untersuchungsauftrag [OPTION B6d]:** Nicht Spielerersparnisse abschöpfen. Prüfen, ob ein **echter, von einer Station beauftragter und bezahlter Transport** mit bestehenden Stationsmitteln den fehlenden NPC-Handelsumsatz wieder ermöglicht und danach ohne laufende Zuschüsse weiterfinanziert werden kann. Zuvor Fonds des **Werftsystems** und reale Käuferkasse getrennt ausweisen, damit keine nur weltweit aggregierten Geldbeträge als verfügbar gelten. Erste und zweite Lieferung sowie Risiko von Hüllenersatzkosten müssen auf einem tatsächlich fortgeschriebenen Testzustand geprüft werden. Klein, getrennt, mit denselben 13 Standard- und vier Krisenfällen, Audits, Hashes, Save/Load. Insolvenz/Markteintritt und dauerhaftes Geldregime sind weiterhin **nicht beschlossen**.

**Kein Produktcode**, keine Goldenänderung, keine neue Regel, keine Spielstandmigration, kein Merge/Deployment. **[BESCHLOSSEN]** Verbindliche Produktprioritäten ausschließlich in [ROADMAP.md](ROADMAP.md).