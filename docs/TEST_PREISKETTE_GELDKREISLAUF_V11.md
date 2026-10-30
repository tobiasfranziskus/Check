# Aphros Void – Preisleiter und Geldumlauf, v11 (Analyse, keine Regeländerung)

Stand: 30.10.2026. [Draft-PR #26](https://github.com/tobiasfranziskus/Check/pull/26) auf [#23](https://github.com/tobiasfranziskus/Check/pull/23). **`main` und `index.html` unverändert; weder Preiswerte noch Spielstandsformat, KI, Reparatur-/Pilotensystem oder Produktionscode wurden geändert.**

## Fragestellung

Bevor Pilotenausgaben, Reparaturen oder weitere Module hinzukommen: Tragen frei abbaubare Rohstoffe, Fabrikprodukte, Schiffe, Kopfgeldschöpfung, Geldsenken und Piratenverluste die aktuelle Wirtschaft? Welche Folgen hat eine mathematisch konsistente Preisstaffelung in einer **unveränderten**, über 90 Tage laufenden Simulation?

## Nachweis

**[GitHub Actions #41024429062](https://github.com/tobiasfranziskus/Check/actions/runs/41024429062), Code-Commit `2cdf070`: erfolgreich.** Node.js 22: **45/45 Standardtests**, vier Preisvarianten × 13 feste Seeds × 90 Spieltage = **52/52 Preis-Simulationsläufe**, alle mit stündlichen `m_core_index.audit`-Geld-/Warenprüfungen, Save-/Load-Hülsen und jeweils identischem Startkapital. Der unveränderte Ausgangsfall erfüllt die fixierten v11-Hashes zu Tagen 3, 30, 90 und dessen zuvor gemessene NPC-Frachterverkäufe, Kopfgeldschöpfung, Geldvernichtung und Mangelstunden. Bestehende v11-Geografiereferenz, NPC-Liquiditäts-/Kapitalgrenzenanalyse und Geografievergleich erfolgreich. Historischer Job `sicherheitsgeografie-vergleich` wurde nur wegen abweichender PR-Basis übersprungen.

Frühere Versuche [#41024165542](https://github.com/tobiasfranziskus/Check/actions/runs/41024165542) und [#41024258244](https://github.com/tobiasfranziskus/Check/actions/runs/41024258244) scheiterten **an Auswertungsfehlern im neuen Analysewerkzeug**: Verwechslung von `state.stats.handel` (sämtliche Handelsaktionen) mit dem engeren Fixwert `sales` (NPC-Frachterverkäufe) sowie `input` statt `inputs` in der Ergebnisberechnung. Nach Korrektur bestanden alle vier Reihen; keine bestehende Spielmechanik war betroffen.

### Unveränderte Preisformel

Basispreise aus `m_data_economy.ECONOMY.waren`; tatsächlich gezahlte Stationspreise berücksichtigen regionalen Faktor, Bestandsabweichung, Begrenzungen und ganzzahlige Rundung über `m_core_preis`. Zusätzlich stationäre Handelsgebühr (typisch 4 %, Meridian 0 %), Vorratsreserve, Stationsbudget, Frachtraum und realen NPC-Kapitalrückfluss. Kalkulierte 20 % je Rezept sind lediglich ein **hypothetischer Materialaufschlag**, kein im Core bereits verbuchter Produktionslohn oder Stationsgewinn.

Vier Varianten bei gleichen 13 Seeds und **unveränderten** Start-ISK, Welt und tatsächlichem Kern:

- **Basis:** Preise vollständig unverändert.
- **Bauteil 100:** nur `bauteil.basis` 75→100. Testet eine isolierte Korrektur.
- **Kette 20:** Erz 10, Eis 12, Silizium 24, Kristalle 24 unverändert; alle nachgeschalteten Basispreise aus Rezeptinput ×1,20 / Ausbringungsmenge, aufgerundet.
- **Rohstoff 14 + Kette 20:** Erz und Eis je 14, sonst wie Kette 20.

## Rechnerische Preiskette in ISK je Einheit

| Gut | Ist | Nur Bauteil 100 | Ganze Kette 20 % | Erz/Eis 14 + Kette |
| --- | ---: | ---: | ---: | ---: |
| Erz | 10 | 10 | 10 | 14 |
| Eis | 12 | 12 | 12 | 14 |
| Silizium | 24 | 24 | 24 | 24 |
| Kristalle | 24 | 24 | 24 | 24 |
| Material | 30 | 30 | 30 | 42 |
| Bauteil | **75** | 100 | 101 | 130 |
| Nahrung | 30 | 30 | 29 | 34 |
| Medikamente | 105 | 105 | 101 | 130 |
| Miner | 600 | 600 | 764 | 987 |
| Frachter | 750 | 750 | 970 | 1.248 |
| Jäger | 900 | 900 | 1.114 | 1.450 |
| Bauschiff | 1.200 | 1.200 | 1.527 | 1.973 |

**Preisfehler ist real:** Aktuelles Rezept `r_bauteil`: 2×30 + 1×24 = 84 ISK Input zu 75 ISK Output. Kalkulatorisch −9 ISK, nach hypothetischem vollständigem Einkauf und Verkauf mit je 4 % Handelsgebühr rund **−16 ISK**. Nur Bauteilpreis 100 behebt diese Stufe (+16 ISK brutto), macht jedoch einen Frachter aus 8×100 = 800 ISK Input bei weiterhin 750 ISK Output zur **nächsten negativen Stufe** (−50 ISK brutto). Das Problem lässt sich nicht konsistent durch Änderung genau eines Preisfeldes lösen. Für eine vollständig fremdbeschaffte Herstellung gilt die Gegenrechnung `Erlös×(1−4 %) − Input×(1+4 %)`; echte Stationsproduktion hat keine explizite Lohnausgabe und verbraucht eingelagerten Bestand, sodass dies **keine tatsächlich beobachtete Gewinnbuchung** ist.

## Gemessene 90-Tage-Wirtschaftsfolgen

**Alle Werte sind Summen aus je 13 vollständigen 90-Tage-Simulationen** (nicht pro Welt).

| Kennzahl | Basis | Nur Bauteil 100 | Kette 20 % | Erz/Eis 14 + Kette |
| --- | ---: | ---: | ---: | ---: |
| Versorgungsmangelstunden | **4.204** | 4.486 | 4.722 | 4.649 |
| Stationen unter Mindestkasse: Stationsstunden | **6.464** | 9.113 | 8.473 | 14.446 |
| NPC1-Stunden bei Kasse = 0 | 34 | 35 | 50 | 122 |
| NPC2-Stunden bei Kasse = 0 | 19 | 7 | 11 | **1.750** |
| Verkaufsevents NPC-Frachter | 298.743 | 300.959 | 300.438 | 292.166 |
| Bestand Stationskassen am Endtag (ISK) | 304.707 | 310.919 | 309.573 | 327.925 |
| Bestand Systemfonds am Endtag (ISK) | 89.840 | 74.321 | 82.259 | 80.362 |
| Zivile NPC-Schiffsverluste | 4.934 | 4.926 | 4.775 | 4.865 |
| Gekaufte zivile NPC-Ersatzschiffe | 4.934 | 4.926 | 4.775 | 4.864 |
| NPC-Fondsabführungen (ISK) | 97.769.119 | 101.707.002 | 100.980.915 | 116.187.621 |
| Fonds-zu-NPC-Zuschuss (ISK) | 0 | 0 | 0 | 30.350 |
| Kopfgeldschöpfung, `minted` (ISK) | 1.643.400 | 1.724.520 | 1.640.160 | 1.840.320 |
| Geldvernichtung, `burned` (ISK) | 1.707.440 | 1.788.920 | 1.704.560 | 1.904.960 |
| Schöpfung minus Vernichtung (ISK) | −64.040 | −64.400 | −64.400 | −64.640 |

Interpretation:

- **Bauteil 100:** 282 zusätzliche Mangelstunden (+6,7 %) bei besseren kalkulatorischen Bauteil-Deckungsbeiträgen und neuem negativen Frachter-Rezept. Die isolierte Korrektur ist daher nicht empfehlenswert.
- **Vollständige 20-%-Kette:** 518 zusätzliche Mangelstunden (+12,3 %), 2.009 zusätzliche Stunden mit Stationskassen unter Mindestniveau (+31,1 %). Der Preisausgleich lässt sich nicht mit einem Beleg für höhere Wirtschaftsstabilität verwechseln.
- **Erz/Eis 14:** Trotz durchkalkulierter Weitergabe verschlechtert sich die Stationsarmut von 6.464 auf 14.446 Stationsstunden (mehr als verdoppelt), NPC2 ist 1.750 statt 19 Stunden vollständig ohne Guthaben. **Höhere Rohstoffpreise sind kein unkritischer Ersatz für Liquidität.**
- **Gesamtgeldmenge bleibt vergleichsweise stabil.** Pro Welt beginnt der Core mit 55.000 ISK, der überwiegende Teil der 90-Tage-Schöpfung durch Kopfgelder wird durch Sicherheitsbetriebskosten absorbiert. Die Nettovernichtung liegt bei rund 4.900–5.000 ISK je Seed. **Geldmenge und Kassenverteilung sind verschiedene Prüfgrößen.**
- **Schiff/Fracht-Verlust ist kein unmittelbares ISK-Burning.** In der Basis sind 225.049 verlorene Frachteinheiten (alle betroffenen Schiffe), 4.934 zivile NPC-Schiffsverluste und 13.695 Piratenschiffsverluste verbucht. Zivile Ersatzschiffe werden als realer Stationskauf aus bestehenden Waren bezahlt, Piratenschiffe hingegen über eine Geldzahlung an Meridian ohne zugeordnete materielle Schiffskomponenten erzeugt. Die beiden Prozesse dürfen bei der Wirtschaftsbetrachtung nicht verwechselt werden.
- **Meridians Außenhandel ist ein materieller Import-/Exportausgleich ohne ISK-Zahlung.** Basis: 43.017 importierte, 232.416 exportierte Einheiten über alle Waren und Seeds. Das stabilisiert Bestände, ist aber keine geschlossene wertmäßige Handelsbuchung. Auch `npcObergrenze` ist momentan kein beliebiger Kontodeckel, sondern führt Handelsgewinne in Stationsfonds zurück.

## Worauf Rohstoff- und Fertigungspreise tatsächlich beruhen sollten

Frei förderbare Ressourcen benötigen **keinen absolut vorgeschriebenen Mindestpreis**. Der relevante Deckungsbeitrag für einen Miner hängt von Förderung × erzieltem Verkaufspreis × Anstellungsvertrag minus realer Auftragskosten, und zusätzlich von Stationsankaufskapazität ab. Beispiel nur für das frühere Testmodell: 60 Einheiten/Stunde × 20 % Pilotanteil × (1−4 % Gebühr) × 10 ISK Erz ≈115 ISK/Stunde; bei Eis zu 12 ≈138 ISK/Stunde. Das kann die heutige pauschale 150-ISK-Stundenkostenposition nicht decken, doch die **geplante** Piloteneigenfinanzierung soll genau diese abstrakte Kostenposition später ersetzen. Rohstoffpreise auf Grundlage dieser künftig entfallenden Kosten zu erzwingen wäre unzulässig. Dauerhafte Pilotengehälter ohne entsprechende Ausgaben akkumulieren außerdem Geld auf Pilotenkonten; dieser Effekt wurde bereits in #24 gemessen und kann durch nominelle Preissteigerung alleine nicht behoben werden.

Die tatsächlichen bereits vorhandenen Mechanismen müssen zunächst getrennt stabilisiert werden: Produktions-/Handelsspannen, regionale Preisschwankungen, stationäre Lagerzielgrößen und Verbrauch, Stationenfonds, NPC-Kasse/Versorgung, NPC-Ersatzschiffökonomie, Außenhandelsausgleich. **Keine weitere Produktionsfunktion ist dafür nötig.**

## Entscheidung und nächster Schritt

**Alle getesteten Preiserhöhungen werden für eine wirtschaftliche Freigabe abgelehnt.** Die Materialwert-Inkonsistenz bei Bauteilen ist ein belegter Bilanzierungs-/Preiskalkulationsfehler, aber ein simples Hochsetzen eines oder aller Preise verschlechtert derzeit die Versorgung. Vor einer Änderung sollten die **Ursachen der 4.204 Basis-Mangelstunden je Ware und Station** ermittelt werden (Rohstoffförderung, Fabrikauslastung, Transport, Einkaufskasse, Vorratsgrenze). Parallel sollten die vorhandene Handels-/Stationsfondsliquidität und NPC-Ersatzinvestitionen untersucht werden, ohne weitere Geldquellen/-senken einzubauen.

Nur die Wirtschaftsanalyse ist abgeschlossen; keine Änderung an `index.html` oder an Spieler-/NPC-Werten. Kein Merge nach `main`, keine iPad- oder NAS-Abnahme.
