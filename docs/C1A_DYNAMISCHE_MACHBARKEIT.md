# C1a – dynamischer Teilnachweis und technische Machbarkeitsgrenze

**[DRAFT/ANALYSE, 08.11.2026] Kein Nachweis einer vollständigen Modell-C-Wirtschaft.** Eigener Branch auf dem unveränderten Forschungs-Core [#243/e921fd29](https://github.com/tobiasfranziskus/Check/pull/243), PR-Basis dessen Forschungsbranch, nicht main. Aktueller geprüfter main: `fd3e915`; dessen AGENTS, Roadmap und Projektstatus sind Grundlage. Konzept: vollständiges [Modell C aus #245/008728e](https://github.com/tobiasfranziskus/Check/blob/008728e1f011540842eb090144fa40b284833788/docs/GESAMTWIRTSCHAFT_REFERENZMODELL.md). Das Papier ist nicht auf dem Forschungsbranch vorhanden; es wird nicht durch Cherry-Pick zu einer verbindlichen Roadmap gemacht.

## Ergebnis und Reichweite

**Bestanden:** Ein kleiner, mit ausgewählten C-Parametern laufender Eis–Fracht–Wasser-Teilversuch im vorhandenen Minuten-Core, bezahlter Konsum aus vorhandenem Anfangsgeld und tatsächlich überwiesenen Löhnen, finanzierte R32-Minerersatzkäufe aus vorhandenem Werftlager. Zehn gestartete Welten (fünf Konfigurationen zu 30 und anschließend 90 Tagen), jeweils vollständiger zweiter deterministischer Replay. 864.000 geprüfte Minuten der Erstläufe, zusätzlich gleich viele Replay-Minuten. Seed überall 42; Varianten verändern Verhalten/Eigentum bzw. eine Ausfallfrist, keine bloßen RNG-Nummern.

**Wirtschaftlich nicht bestanden:** Der Teilkreislauf liefert keinen dauerhaften Absatz. Haushaltsgeld fehlt bereits bei vorhandenem Wasser; Ersatzfrachter fehlen später trotz Betreiberkapital. Das ist ein ehrlicher negativer Teilbefund, keine Widerlegung oder Bestätigung des noch nicht implementierten Gesamtmodells C.

**Nicht getestet:** industrielles C-Endprodukt, C-Ersatzproduktion, Meridian-Auslieferung/-Abnahme, erneuerbarer Industrieexportetat, 55.000-ISK-Erstverteilung/22.280-ISK-Gründungsanbieter, außergewöhnlich hohe Spielerhortung, echte Teilewartung, Schutz und Kampf. Dafür wäre ein größerer Core-Umbau nötig. Gemäß Auftragsgrenze wird kein 19-Waren-Modell implementiert. Keine neuen C-365/730-Tage-Versuche. Bestehende historische Langzeittests werden nur als unveränderte Repository-Regression getrennt behandelt.

## Ist/Soll und begründete Abbruchgrenze des Gesamtvorhabens

| Baustein aus #245 | Im Core #243 | C1a |
| --- | --- | --- |
| Eigentümer, Kassen, physische Waren, Fracht | ausführbar | benutzt; Treuhand ist echtes separates Owner-Cash, nicht doppelt gezählt |
| Reservierung von Fracht-/Fabrikarbeit, Zahlung nach Minute | ausführbar | überprüft, unveränderte Core-Funktionen |
| Kontinuierlicher Eisabbau 1 ISK je zwei Minuten | nur anpassbar; R32 fördert mindestens eine ganze Einheit/Minute | Lohn auf 1/Minute angepasst, Tempo bleibt **1 Eis/Minute** statt C 0,5; kein erfundener Cadence-Kern |
| Eis 5, Wassercharge 50→50/100 Minuten | über Regeln anpassbar | tatsächlich so ausgeführt |
| Fernfracht 270 pro 120-Minuten-Runde | über Regeln anpassbar | tatsächlich 270, Satz 2,25/Minute für die Rundvergütung; Pilotlohn 1/Minute. Nur der resultierende gesamte Rechnungsbetrag ist Cash, keine Bruchteils-Lohnbuchung |
| Hersteller 16 + Einzelhandel bis 18 | getrennte Unternehmen nicht vorhanden | **kombinierter** Stationsverkauf 18; keine behauptete Hersteller-/Retail-Marge |
| Verbrauch 10 Wasser/Tag | R32 2 pro Stunde | bleibt **48 Soll/Tag**; zeitliche Konsummengenverteilung ist keine Modell-C-Umsetzung |
| Haushaltseinkommen aus Lohn, getrennte Gewinne | vorhanden, Gewinnausschüttung nur vereinfachte direkte Kostenformel | Modus `wages`: nur verdiente Löhne, keine Dividenden; keine behaupteten C-Nettogewinne |
| Wartung mit Material und eigener Abschreibung | R32 nur 60 Arbeitsminuten alle 20 Tage | reale **Arbeitswartung** gemessen; Teile-/Kapitalwirtschaft fehlt |
| Nutzungsbasierter Verschleiß | R32 Kalenderstress 15/30 Tage | unverändert, Sonderfall Frachterfrist 5 Tage; kein behauptetes Kampfereignis |
| C-Miner 1.340/C-Frachter 1.690 plus Lieferung | R32 600/750 | ursprüngliche bezahlte Start-/Ersatzkäufe, ausdrücklich **nicht C-Kosten** |
| C-Frachter aus 8 Bauteilen mit Vollkosten | R32 5 Material, besondere Preise und Teilpfade | **nicht gebaut**; Nutzung dieses Rezepts wäre ein falscher C-Nachweis |
| Meridian und sieben Standorte | R32 nur Aldera/Nadir, 60 Minuten einfach | unverändert; **kein Meridian** |
| Industrieexport mit globalen Leistungsrechten | W5q nur Wasserexport, endlicher Sonderetat, kein C-Reservierungs-/Fenstersystem | ausgeschaltet; kein Ersatz durch Wasser-Minting |
| 55.000 Anfangsgeld/Gründungslager | R32 33.000, Investor `export` 20.000 | unverändert; kein neues Gründerkonto und kein Umbenennen als Modell C |
| Save/Load passender Forschungsregeln | Stock-Loader wählt feste R32-Konstanten | Core-Serializer mit strikter **Testhülle** für Parameteridentität und expliziten Modulaudits; keine produktive Ladefreigabe |

Diese Lücken verhindern den verlangten vollständigen Fünf-Schritte-Referenzfall schon **vor** einem vermeintlichen Langzeiterfolg. Für 3/4 fehlen zentrale Regeln und Orte; für 5 ist nur der R32-Ersatz aus Anfangsbestand ausführbar. Ein unveränderter R32-Industrie- oder Wasserexport würde diese Lücken nicht schließen. C1a fügt deshalb ausschließlich Tests, Messdaten, Workflow und diesen Bericht hinzu; `index.html` bleibt auch relativ zur Forschungsbasis unverändert.

## Ausführung und Prüfmethodik

```sh
node --version  # Node 22
C1A_REPORT=/tmp/c1a-results.json node tests/c1a-modell-c-teilversuch.test.mjs
node --test tests/*.test.mjs
```

Die Testdatei extrahiert unveränderte vorhandene Core-Module, wie schon die Forschungswerkzeuge in #243. Sie patcht keinen Quelltext und führt keine eigenen Produktions-, Zahlungs- oder Tickregeln aus. Start erfolgt über `createW5RState`, einschließlich real bezahltem Miner und Frachter. Nach dem Start verwenden **alle folgenden Minuten** die expliziten Teilprofil-Regeln; der Startkauf bleibt R32. Das ist als Übergangsgrenze im Test kommentiert, keine verdeckte Neukalibrierung nach einem Zusammenbruch.

`api.step` treibt jede Minute beide Welten voran. Nach **jeder** Minute des Erstlaufs prüfen unabhängige Formeln Geldmenge, nichtnegative ganzzahlige Owner-Cashsalden, jede Warenbilanz, exakte Fracht-/Fabrikreserven und Verknüpfung von geleisteter Arbeit und Bezahlung. Darüber hinaus laufen die vorhandenen W5n/o/q/r-Modulaudits mit dem tatsächlich verwendeten Regelobjekt. Der vollständige Stock-Audit/Stock-Loader verwendet feste R32-Konstanten und wird nicht als angepasste C-Auditfreigabe ausgegeben. Unbenutzte Industriepfade sind damit nicht umfassend neu abgenommen.

Alle 1.440 Minuten sowie bei Minute 61 wird der Hash mit dem zweiten Replay verglichen und Save/Load durchlaufen. Minute 61 liegt noch in einem offenen Vorgang. Die Testhülle enthält Profilkennung und SHA-256 des Regelobjekts; der eigentliche Zustand wird vom **vorhandenen** Core-Serializer gespeichert/geladen. Falsches Profil oder manipuliertes Geld/Lohn werden in negativen Prüfungen abgewiesen. Eine spätere echte Produktintegration braucht registrierte Regelidentität und validierten Gesamtloader, nicht diese nur für Node-Tests bestimmte Hülle.

30-Tage-Läufe werden vollständig vor den 90-Tage-Läufen ausgeführt. Die 90-Tage-Läufe müssen nach Tag30 exakt denselben Hash wie ihr kürzerer Vorlauf haben. Es findet keine Parameterkorrektur zwischen den Horizonten statt. Die gepaarten Geldsummen sind immer `33.000 + 0 − 0`; bei nicht vorhandenem Emissionspfad sind Export-/Budgetprüfungen ausschließlich Null-Kontrollen und **kein positiver Emissionsnachweis**.

## Getrennte Szenarien

| Auftragsszenario | Tatsächliche C1a-Prüfung | Grenze |
| --- | --- | --- |
| Normaler Umlauf | R32-Kassen, C-Wasserparameter, tatsächlich zurückfließende Löhne | kein vollständiger C-Referenzfall |
| Gründer spart 22.280 | technische Lücke per Capability-Prüfung belegt | nicht simuliert, Gründer/Gründungslager fehlen |
| Spieler spart große Guthaben | Mensch als Eisminer, Firmenverkaufserlös bleibt beim Spieler | nur tatsächlich verdientes R32-Guthaben, **kein 80/95-%-Konzentrationsversuch** |
| NPC behalten Gewinne | `wages`, keine Gewinnausschüttung | identisch zum Basisfall, kein zusätzliches Krisenprofil |
| Außenexport fällt aus | Außenexport schon im Basisfall aus | identische Negativkontrolle; **kein Übergang von laufendem C-Export auf null** |
| Frachter fällt aus | echte R32-Entfernung am Dock an Tag5 statt Tag30 | betrieblicher Kalenderstress, kein simulierter Abschuss |
| Ersatz fehlt Kapital | isolierte, explizit balancierte Gegenfaktual-Startfixture ohne Käufercash; Kauf wird ohne Zustandsänderung abgewiesen | kein laufender Markt-/Insolvenznachfolger; keine Gelder im Szenariolauf verändert |
| Ersatz fehlt Ware | erneuter Frachterkauf nach Start und automatische Ersatzversuche nach Ausfall | ausreichend echtes Betreiberkapital, aber Werftlager 0; kein Phantomschiff |

`npcRetains` und `exportOff` müssen im Test dieselben Endhashes wie `reference` haben. Fünf Namen sind deshalb **nur drei unterschiedliche Verläufe**. Der Spieler-Miner-Fall lässt außerdem die ursprüngliche NPC-Erzautomatik zu: deren Umsatz wird aus dem endlichen vorhandenen Investorkonto finanziert, nicht gemintet. Diese zusätzliche R32-Aktivität ist keine Industrieexportleistung in Meridian.

## Tatsächlich gemessene Ergebnisse

Die vollständigen Owner-Kassen vor/nach jedem Horizont, Löhne, Werftbestände, verlorene IDs, Ersatzbelege und Hashes stehen in [C1A_MESSWERTE.json](data/C1A_MESSWERTE.json). Die Datei enthält Messausgaben, keine Golden-Fixture und keine zur Erzeugung von Ergebnissen gelesenen Tabellen. CI erzeugt dieselbe Struktur als Artefakt neu.

| Konfiguration | Tage | Wasser produziert / gekauft | Fracht bezahlt | Haushaltseinkommen | Haushalt Rest | Arbeitswartung | bezahlte Ersatzminer | letzter Verkauf Tick |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| reference | 30 | 200 / 166 | 1350 | 1600 | 12 | 60 | 2 | 21840 |
| playerMinerSaves | 30 | 200 / 161 | 1350 | 1500 | 2 | 60 | 1 | 21840 |
| npcRetains | 30 | 200 / 166 | 1350 | 1600 | 12 | 60 | 2 | 21840 |
| exportOff | 30 | 200 / 166 | 1350 | 1600 | 12 | 60 | 2 | 21840 |
| carrierFailsDay5 | 30 | 200 / 166 | 1350 | 1600 | 12 | 60 | 2 | 21840 |
| reference | 90 | 200 / 172 | 1350 | 1700 | 4 | 240 | 2 | 43440 |
| playerMinerSaves | 90 | 200 / 161 | 1350 | 1500 | 2 | 240 | 1 | 21840 |
| npcRetains | 90 | 200 / 172 | 1350 | 1700 | 4 | 240 | 2 | 43440 |
| exportOff | 90 | 200 / 172 | 1350 | 1700 | 4 | 240 | 2 | 43440 |
| carrierFailsDay5 | 90 | 200 / 172 | 1350 | 1700 | 4 | 240 | 2 | 43440 |

### Erster kausaler Engpass statt bloßer Endstand

Der erste beobachtete ungedeckte **nächste** Wasserkauf im Basisfall liegt bei Tick **5.040 = Tag3,5**: Haushalt **2 ISK**, gleichzeitig **39 Wasser** am Ziel; Preis 18. Das ist zunächst eine Kaufkraftunterbrechung, kein permanenter Stillstand (spätere verdiente Löhne ermöglichen weitere Verkäufe). Im Spieler-Miner-Fall tritt sie schon bei Tick **4.860 = Tag3,375** auf, 10 ISK bei 45 vorhandenen Wasser. Der Test misst diesen ersten Zustand gesondert vom letzten späteren Verkauf.

Die Ursache im Teilprofil ist nachvollziehbar: Alle Firmen behalten Gewinne, nur Löhne zirkulieren, und der R32-Sollverbrauch 48/Tag ist höher als der C-Korb 10/Tag. Das Anfangsgeld des Kunden wird aufgebraucht. Genau der zweite reale Einkommenskanal über C-Industrieexport fehlt. Deshalb ist das Resultat **keine Aussage**, dass das gesamte C-Modell unter dessen niedrigerem Verbrauch zwangsläufig scheitert.

An Tag15 und Tag30 werden tatsächlich zwei Miner aus vorhandenem Anfangs-Werftlager für je **600 ISK** gekauft (`sh003`, `sh004` im Basisfall); die Kasse `werft_extern` steigt dadurch von 1.350 auf 2.550. Die alten Schiffe werden mit je 100 Eisverlust real entfernt und bilanziert. Diese Ersatzkäufe sind finanziert, aber weder industriell neu gebaut noch zu C-Preisen kalkuliert. Ihre Existenz beweist lediglich den begrenzten Ersatzpfad.

An Tag30 fehlt der Frachter: Spedition **2.000 ISK**, freie Hülle **0**. Das erste physische Ersatzhindernis ist Ware, nicht Weltgeld oder Betreiberarmut. Im Stressfall geschieht dieselbe echte Entfernung an Tag5; die Transport-/Absatzmengen sind bis dahin bereits entstanden und erreichen deshalb dieselben Gesamtsummen. Die geänderte Frist verändert den Zustandshash, erzeugt aber in dieser Konfiguration **keinen zusätzlichen Mengenrückgang**. Das wird nicht als wirtschaftlich wirksame Schockdiversität verkauft.

Im Basisfall bis Tag90: **700 Eis gefördert**, davon 400 verkauft; 250 Eis physisch angeliefert, fünf bezahlte Rundfrachten, 200 Wasser erzeugt und 172 bezahlt konsumiert. Haushalt: `1.400 + 1.700 − 3.096 = 4 ISK`. Die 240 ISK Arbeitswartung sind vier reale 60-Minuten-Dienste; der Wartungsarbeiter erhält sie und gibt sie im vorhandenen R32-Modul nicht automatisch als Haushaltsgeld aus. Auch dies ist eine zusätzliche Einkommensinsel und eine C-Lücke. Der letzte bezahlte Wasserverkauf des 90-Tage-Basisfalls liegt bei Tick **43.440 = Tag30,1667**. Danach bis Tag90 keine weiteren bezahlten Wasserkäufe; nur noch weitere begrenzte Restaktivitäten/Arbeitswartung.

### Was die grünen Tests bedeuten

Vier technische Testgruppen bestehen, wenn die tatsächlichen Vorgänge korrekt, deterministisch und bilanzerhaltend ablaufen – **auch wenn die Wirtschaft stoppt**. Die Zustandsdaten enthalten alle beteiligten Kassen einschließlich Treuhand und Fonds; Schiffsverlust vernichtet Waren, kein Cash. Positive Exportbuchung, Emissionsreservierung und gleitende C-Deckel sind mangels Implementierung ausdrücklich **nicht bestanden/nicht getestet**, nicht bloß „Audit grün bei null Emission“.

## Empfehlung für C1b

**Zuerst ein registriertes, strikt isoliertes C-Wasser-Forschungsprofil**, bevor Industrieexporte oder Langzeitstabilität behauptet werden:

1. Regel-/Profilidentität und Parameter beim normalen Core-Audit/Save-Loader registrieren; keine testseitige Hülle als Produktlösung übernehmen. Unveränderte Regel14-/R32-Saves weiter ablehnen bzw. getrennt laden.
2. Exakte C-Cadence (1 Eis je zwei bezahlte Minuten), 10 Wasser/Tag und getrennte Hersteller-/Retail-Rechnung 16/18, echte Reserve-/Wartungs-/Ersatzkosten für **eine** Kette beschließen und implementieren. Keine willkürliche Haushaltsnachfüllung nach Unterbrechung.
3. Erst danach eine einzige vollständige C-Industriekette auswählen: etwa Material/kleines Modul mit realem Käufer, eigener Vorfinanzierung und einem realen Liefervertrag nach Meridian. Für jeden fehlenden Standort-/Kauf-/Abnahmebefehl Kosten und Herkunft ergänzen; nicht das R32-5-Material-Frachterrezept als C übernehmen.
4. Für einen positiven Exportnachweis vollständige, global reservierte 30-/365-Tage-Leistungsrechte und physisch eindeutige Abnahme vor Mint implementieren; Negativfälle Doppelabnahme, Reexport/Startware, Etatbindung, verspätete Lieferung und Kapitallücke einzeln prüfen. Erst diese Stufe kann den zweiten Einkommenskanal beurteilen.

Das sind vorgeschlagene nächste Schritte, keine Änderung der Roadmap. Ein längerer C-365/730-Versuch ist noch nicht gerechtfertigt, solange die fünf zusammenhängenden Vorgänge nicht tatsächlich existieren. Weitere R32-Parameterreparaturen würden die zentrale Implementierungslücke nicht schließen.

## Validierung und CI-Status

- Lokal Node **v22.23.4**, gezielter direkter Lauf der endgültigen Testdatei: **4/4 Tests, 0 Fehler, 0 Skips**, ca. 18 Sekunden. Ergebnisse aus diesem Lauf wurden unverändert als JSON dokumentiert.
- `node --test tests/*.test.mjs` ist separat als vollständige Regression gestartet; sein Ergebnis wird nach Abschluss ergänzt. Dieser Befehl führt auch bereits vorhandene historische 365/730-Regressionen aus; diese sind **keine neuen C-Langzeitversuche**.
- Verifizierte Basis-CI auf #243 Head e921fd29: [Regression #42422575578](https://github.com/tobiasfranziskus/Check/actions/runs/42422575578) erfolgreich (sieben erfolgreiche Jobs, ein übersprungener historischer Vergleich), [W5s-ao #42422575576](https://github.com/tobiasfranziskus/Check/actions/runs/42422575576) erfolgreich. Das sind Basisbelege, keine C1a-Freigabe.
- Der neue dedizierte C1a-Workflow führt Node22 und den Teilversuch aus und veröffentlicht dessen Mess-JSON als Artefakt. Erfolg wird erst nach tatsächlichem Lauf gemeldet.
- Keine Safari-/NAS-/Geräteprüfung, kein Save-Import in produktiven Browser, kein Merge, kein Pages-Schreibzugriff und kein Deployment. Forschungsindex, Core, Tests/Fixtures des Vorgängers und verbindliche Roadmap werden nicht geändert.
