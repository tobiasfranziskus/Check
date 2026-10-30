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

## Ursache lokalisiert: Nahrung, nicht allgemeine Rohstoffteuerung

Der bereits im CI erfolgreich ausgeführte `tools/geography-three-way.mjs`-Vergleich liefert für die v11-Entwicklungswelt die unabhängige vollständige Mangelaufteilung: **3.981 der 4.204 Mangelstunden (94,7 %) sind Nahrung**, nur **204 Bauteile** und **19 Medikamente**. Davon entfallen **2.181 Nahrungsmangelstunden auf Aldera**, **1.795 auf Dravos** und 5 auf Orion; alle übrigen Stationen ohne Nahrungsausfall.

Das Modell produziert bereits insgesamt 491.900 Nahrungseinheiten über 13 × 90 Tage. Rechnerischer regulärer Bedarf: 17 Einheiten je Spielstunde × 2.160 Spielstunden × 13 Welten = **477.360 Nahrungseinheiten**. Die reine Produktionsmenge wäre also ausreichend, aber Standort, Handelsrouten, Vorräte und Liquidität entscheiden über die **tatsächliche Belieferung**.

### Gegenprobe: Nur Nahrungspreis variieren

[GitHub Actions #41025210706](https://github.com/tobiasfranziskus/Check/actions/runs/41025210706), `tools/food-price-scenarios.mjs`: **52/52 Läufe** (13 Seeds × vier Preise × 90 Tage) erfolgreich; gleiche Welt, gleiche Anfangskassen, gleicher deterministischer Kern, stündlicher Geld-/Warenaudit, Save/Load und fixierter v11-Referenzhash im Ursprungsfall. **Nur `economy.waren.nahrung.basis` wird experimentell geändert**, keine geänderte KI, Produktionsmenge pro Rezept, Startkapital, Gebühren, sonstigen Preise oder neue Spielmechanik.

| Kennzahl (Summe 13 × 90 Tage) | Nahrung 30 (Ist) | Nahrung 36 | Nahrung 42 | Nahrung 50 |
| --- | ---: | ---: | ---: | ---: |
| Alle Versorgungsmangelstunden | **4.204** | 2.791 | 1.730 | **1.120** |
| Davon Nahrung | 3.981 | 2.509 | 1.488 | **826** |
| Nahrung Aldera: Mangelstunden | 2.181 | 1.362 | 813 | 442 |
| Nahrung Dravos: Mangelstunden | 1.795 | 1.143 | 675 | 384 |
| Alle anderen Waren: Mangelstunden | 223 | 282 | 242 | 294 |
| Nahrung produziert (Einheiten) | 491.900 | 498.772 | 504.161 | 508.646 |
| Nahrung tatsächlich verbraucht (Einheiten) | 468.596 | 472.278 | 474.911 | 476.365 |
| Stationskassen am Endtag (ISK) | 304.707 | 304.823 | 301.496 | 303.229 |
| Fonds am Endtag (ISK) | 89.840 | 87.147 | 83.377 | 84.372 |
| Händler-NPCs am Endtag (ISK) | 146.463 | 144.903 | 150.455 | 146.879 |

Der Betrag **50 ISK** senkt die Gesamtversorgungsunterdeckung um **3.084 Mangelstunden (73,4 %)** gegenüber dem unveränderten Fall, ohne im geprüften 90-Tage-Lauf einen vergleichbaren Rückgang der Schlusskassen zu erzeugen. Schon 42 ISK senkt den Mangel um 58,8 %.

Tatsächlich nachgewiesene Nahrungstransporte (13 Seeds, jeweils 90 Tage; nur Frachterhandel):

| Zielstation | Bei Preis 30: gekauft durch Station / verkauft an Station | Bei Preis 50: gekauft durch Station / verkauft an Station |
| --- | ---: | ---: |
| Aldera | 97.047 / 18.165 | 114.521 / 31.323 |
| Dravos | 91.945 / 12.080 | 115.302 / 31.984 |

**Begriffspräzisierung:** `an Station verkauft` heißt, ein Frachter liefert Nahrung an die Station. Die Tabellenüberschrift oben ist in der Reihenfolge `Station kauft vom Frachter / Station verkauft an Frachter` zu lesen. Nettoeinfuhren (Lieferungen minus Abholungen): Aldera **78.882 → 83.198**, Dravos **79.865 → 83.318** Einheiten. Der fixe lokale Gesamtbedarf beträgt je Station 84.240 Einheiten über 13 × 90 Tage. Der Mehrtransport nähert sich also dem realen Verbrauch, statt die Produktion durch unbelegte Quellen aufzufüllen.

**Mechanistische Erklärung als Hypothese mit Gegenprobe:** Die bestehende Handels-KI sortiert die Kandidaten nach erzielbarem Gewinn und Reisezeit. Ein höherer Nahrungspreis steigert den absoluten Gewinn auf örtliche Preisunterschiede und macht Nahrungsrouten attraktiver. Der Versuch belegt die stärkere Belieferung, aber keine isolierte Kausalzerlegung zwischen Produktionsanreiz, Stationsbeständen und Routenwahl.

**Balancing-Risiko:** Bei Nahrung 50 und Eis 12 ist die Rohstoffwertspanne des Rezepts 2 Eis → 1 Nahrung bereits 50−24 = **26 ISK**, statt bisher 30−24 = 6 ISK, also rund 108 % statt 25 % Kalkulationsaufschlag vor Handelsgebühren. Das ist eine erhebliche, nicht durch verbuchte Produktionskosten begründete relative Preisverzerrung. Höhere Nachfrage nach Nahrung verdrängt zudem einzelne Lieferungen anderer Warengruppen (Mangel ohne Nahrung: 223 → 294). Eine dauerhafte Festlegung auf 50 ISK ist damit **nicht freigegeben**, aber eine eng begrenzte Anpassung der Nahrungsanreize (Preis oder Priorisierung nach vorhandener Handels-KI) ist jetzt der richtige nächste Untersuchungsgegenstand.

## Worauf Rohstoff- und Fertigungspreise tatsächlich beruhen sollten

Frei förderbare Ressourcen benötigen **keinen absolut vorgeschriebenen Mindestpreis**. Der relevante Deckungsbeitrag für einen Miner hängt von Förderung × erzieltem Verkaufspreis × Anstellungsvertrag minus realer Auftragskosten, und zusätzlich von Stationsankaufskapazität ab. Beispiel nur für das frühere Testmodell: 60 Einheiten/Stunde × 20 % Pilotanteil × (1−4 % Gebühr) × 10 ISK Erz ≈115 ISK/Stunde; bei Eis zu 12 ≈138 ISK/Stunde. Das kann die heutige pauschale 150-ISK-Stundenkostenposition nicht decken, doch die **geplante** Piloteneigenfinanzierung soll genau diese abstrakte Kostenposition später ersetzen. Rohstoffpreise auf Grundlage dieser künftig entfallenden Kosten zu erzwingen wäre unzulässig. Dauerhafte Pilotengehälter ohne entsprechende Ausgaben akkumulieren außerdem Geld auf Pilotenkonten; dieser Effekt wurde bereits in #24 gemessen und kann durch nominelle Preissteigerung alleine nicht behoben werden.

Die tatsächlichen bereits vorhandenen Mechanismen müssen zunächst getrennt stabilisiert werden: Produktions-/Handelsspannen, regionale Preisschwankungen, stationäre Lagerzielgrößen und Verbrauch, Stationenfonds, NPC-Kasse/Versorgung, NPC-Ersatzschiffökonomie, Außenhandelsausgleich. **Keine weitere Produktionsfunktion ist dafür nötig.**

## Entscheidung und nächster Schritt

**Pauschale Rohstoff-/Produktpreiserhöhungen werden wirtschaftlich nicht freigegeben.** Die Materialwert-Inkonsistenz bei Bauteilen ist bestätigt, wird aber nicht durch isoliertes Hochsetzen behoben. Der bereits vorhandene Handelsalgorithmus reagiert auf **gezielte Nahrungsanreize** dagegen stark: von 4.204 auf 1.120 Mangelstunden bei Nahrung 50, wobei eine solche Preisänderung hohe Rohstoffmargen erzeugt. Bevor irgendeine Produktionsregel oder neue Funktion hinzukommt, sollte als nächstes die **bestehende Handelsroute-Priorisierung für Versorgung gegenüber reiner Gewinnmaximierung** isoliert gegen die Preisvariante 42/50 geprüft werden. Keine KI- oder Parameteränderung ohne unabhängigen Simulationserfolg und Integrationsfreigabe.

Nur die Wirtschaftsanalyse ist abgeschlossen; keine Änderung an `index.html` oder an Spieler-/NPC-Werten. Kein Merge nach `main`, keine iPad- oder NAS-Abnahme.
