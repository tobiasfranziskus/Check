# B6e-P0 – Ein einzelner finanzierter Frachterstart mit echtem Stationsdarlehen

**31. Oktober 2026 · [ANALYSE/DRAFT] – ausgeführter Versuch, keine Freigabe**

## Auslöser

B6c [#52](https://github.com/tobiasfranziskus/Check/pull/52) belegt für alle vier historischen 365-Tage-Spielerkrisen fehlende NPC1/2-Frachter, sehr geringe Kassen und teilweise bereits physisch vorhandene Werfthüllen. B6d [#53](https://github.com/tobiasfranziskus/Check/pull/53) bestätigt, dass **erst nach einer Warenlieferung zahlbare** Frachtvergütung 0/4 Krisen startet. Das beschlossene leichte Jäger-/Eskortenziel aus dem offenen [Roadmap-PR #49](https://github.com/tobiasfranziskus/Check/pull/49) kommt **nach** finanzierbarer Phase-B-Wirtschaft und wird hier **nicht** umgesetzt.

## Engster möglicher Gegenversuch [ANALYSE]

Die **unveränderte** produktive `index.html` (v0.12.5 / Regel 14 / Schema 8 / `main d454d066`) wird als Kern gelesen. In **einem separaten Analyse-Runner** werden nur drei klar lokalisierte Ereignisse ergänzt:

- **Einmalige Kreditprüfung je NPC1/NPC2**, höchstens ein Vertrag pro Eigentümer: Der Konzern ist **vollständig schiffslos**, benötigt laut seiner unveränderten Sollflotte mindestens einen Frachter und an der originalen Werft liegt **mindestens eine echte, bereits produzierte Frachterhülle**. Auszahlungsbedarf = **aktueller Marktpreis inkl. Kaufgebühr dieser Hülle plus 600 ISK Startbudget**, abzüglich tatsächlich vorhandener NPC-Kasse. Wenn kein ausreichend solventer Kreditgeber vorhanden ist, wird **kein** Vertrag geschlossen.
- **Ein einziger neutraler Stationseigentümer** (keine Spielerstation, keine Fonds-Zusammenrechnung, kein Spielerabzug) muss den ganzen Betrag finanzieren können und **mindestens 2.500 ISK** behalten. Bei Abschluss wechseln reale ISK vom Stationskonto zum NPC; der Staatsgeld-/Waren-Audit bleibt vollständig. Der NPC kauft den Frachter **nur durch den originalen `m_core_schiffbau.ersatzkauf` samt echter Ware und Gebühr**. Keine kostenlose Hülle, kein extraktives Stationshonorar.
- **Vertraglich zugeordnete Schuld**, die in einem **nur für diese Analyse zusätzlichen Save-Feld** `b6eContracts` mit Gläubiger, Schuldner, Principal, offenem Betrag, Auszahlungsminute und tatsächlich erfolgten Lieferungen gespeichert wird. Nur **nach einer echten NPC-Frachterwarenlieferung** werden in stündlichen Schritten maximal 25 % der Schuldnerkasse und nur der Überschuss **oberhalb von 750 ISK** zur Tilgung genutzt. Reale Rückzahlung wandert von der NPC-Kasse an **dieselbe** Station. Bei Schiffstotalschaden/fehlender Tilgung bleibt die Forderung offen; sie wird nicht erfunden oder automatisch getilgt.

**Keine neue Geldmenge, keine neuen Waren, keine Spielerbesteuerung, kein freies Produktspielschiff.** Die 600/750/2500 ISK und der Einmaltrigger sind **hypothetische Testparameter**, keine Balancingfreigabe. Ein Darlehen ist keine Stationseinnahme oder NPC-Handelsertrag; es wird bewusst **nicht als Umsatz/Kosten in `stats.konto` verbucht**, sondern als Forderungs-/Verbindlichkeitspaar außerhalb der Betriebserfolgsrechnung nachgehalten.

## Strenge Grenzen

- `b6eContracts` ist **nur ein Experimentfeld**. Dass JSON/der aktuelle v14-Lader es unverändert serialisiert und lädt, heißt **nicht**, dass eine produktive Migration bereits genehmigt ist. Für ein echtes Produktmodell wären Vertragsvalidierung, Regelversion, ältere Saves, Konkurs-/Haftung und Auftrags-/Gläubigerpflicht gesondert festzulegen.
- Der erste Frachter kann in der Realität unter Beschuss geraten. Der Gläubiger hat ohne zusätzliche Regel **keinen Schutz**, keine Vorzugsrechte und keinen Anspruch auf automatisch neuen Kredit. Der Kredit ist maximal einmalig, damit ein nichttragfähiger Betrieb nicht endlos subventioniert wird.
- Die vorgesehene automatische NPC-Handelsentscheidung bleibt **unverändert**; insbesondere kann sie eine auf Dauer zu niedrige Marge oder Käufermangel nicht reparieren. Erneute Investitionsrunden wären **ein eigener genehmigungspflichtiger Versuch**.
- Weltweites Stationsgeld ist **nicht** mit Liquidität **einer** tatsächlich solventen Gläubigerstation gleichzusetzen. Der Kredit kann also korrekt **nullmal** vergeben werden. Das wäre ein negatives Ergebnis, kein Testfehler.
- Im Vergleich werden reale erste und zweite Warenverkäufe, Waren-/Geldkreislauf, Hüllenersatz, Rückzahlungen und verbleibende Gläubigerliquidität untersucht, statt bloß das Volumen vergebener Darlehen zu loben.

## Prüfgate vor jeder Produktentscheidung

13 unveränderte Seedpaare ×90 Tage sowie vier originale B1-Spielerkrisenpaare ×275 Tage, je `control` und `credit`: **34 komplette Simulationen**, **4.540 Tageshashes**, **108.960 stündliche unabhängige Geld-/Warenaudits / deterministische Replays**, mindestens **440 Save/Load-Roundtrips** und die bestehenden **67 Node-Tests**. Historische Startzustände unter v12 per Originalhash prüfen, dann nach v14 migrieren; die **Kontroll-Goldenwerte** bleiben 791 Standard-Mangelstunden, 310.058 Standard-Trader-Verkäufe sowie 4.450 ISK Krisen-Kostenunterdeckung und null NPC1/2-Krisenverkaufsumsatz.

## [TEST] 34 gepaarte Simulationen vollständig ausgeführt

[GitHub Actions #41179991691](https://github.com/tobiasfranziskus/Check/actions/runs/41179991691), geprüfter Code-/PR-Head vor dieser nachträglichen Berichtsergänzung: **19/19 Jobs erfolgreich**, **67/67 bestehende Node-Tests** (0 fehlgeschlagen, 0 übersprungen). Historische Tag-90-Spielerstarts mit echten v12-Hashes geprüft und auf Regel 14 geladen; 13 Seed-Paare ×90 Tage plus vier aktive Krisen-Paare ×275 Tage: **34 Läufe, 4.540 Tageshashes, 108.960 unabhängige stündliche Geld-/Warenaudits und deterministische Replays, 440 Save/Load-Roundtrips**. Kontrollwelt-Goldenwerte bleiben 791 Mangelstunden, 310.058 NPC-Trader-Warenverkäufe und 16.090 ISK Unterdeckung; Krisenkontrolle 4.450 ISK Unterdeckung und null Verkäufe.

### Ergebnisse im direkten Vergleich

| Kennzahl | 13 ×90 Tage Kontrolle | 13 ×90 Tage Kredit | 4 ×275 Krisen Kontrolle | 4 ×275 Krisen Kredit |
| --- | ---: | ---: | ---: | ---: |
| Mangelstunden | 791 | **791** | 620.550 | **620.511** |
| Abgeschlossene Rezepte | 1.285.074 | **1.285.074** | 24.356 | **24.492** |
| NPC-Trader-Warenverkäufe | 310.058 | **310.058** | **0** | **49** |
| Folgekäufe nach Verkauf derselben Schiff-ID | 225.968 | **225.968** | 72 | **117** |
| Tatsächlich fällige NPC-Arbeit | 46.337.480 ISK | 46.337.480 ISK | 21.813 ISK | **31.516 ISK** |
| Tatsächlich bezahlte NPC-Arbeit | 46.321.390 ISK | 46.321.390 ISK | 17.363 ISK | **22.613 ISK** |
| Ungedeckte Arbeit | 16.090 ISK | **16.090 ISK** | 4.450 ISK | **8.903 ISK** |
| Kreditverträge / ausgezahlte ISK | 0 / 0 | **0 / 0** | 0 / 0 | **1 / 1.380** |
| Tilgung / offene Kreditforderung | 0 / 0 ISK | 0 / 0 ISK | 0 / 0 ISK | **0 / 1.380 ISK** |
| NPC1/2-Frachter-Endbestand | 65 | **65** | 0 | **0** |
| Aldera Silizium / Bauteile, Endsummen | 541 / 505 | **541 / 505** | 0 / 0 | **0 / 0** |
| Bezahlte Ersatzhüllen NPC1–3 im Beobachtungszeitraum | 4.622 | **4.622** | 16 | **19** |
| Verluste NPC1–3 im Beobachtungszeitraum | 4.622 | **4.622** | 19 | **22** |

**Standardwelten:** Nicht eine einzige der 13 normalen 90-Tage-Welten löste das enge Kreditkriterium aus; Kontroll- und Kreditvarianten blieben bis zum Ende wirtschaftlich identisch. Damit belegt diese Stichprobe **keine** Regression im Standardfall, aber auch **keinen** allgemeinen Nutzen in normal laufenden Welten. Die auf Krisen nach 90 Tagen ausgerichtete Maßnahme ist nicht an allen denkbaren Normalspielverläufen geprüft.

**Historische Krisen:** Nur der Fall `handel-flotte` erreichte eine solvente einzelne Station: **`st_meridian` zahlte am Tick 130.620 genau 1.380 ISK an NPC1**. Ein alter oder neuer kostenloser Frachter wurde **nicht** erzeugt: die reguläre Werft und ihre Bestands-/Zahlungsregeln blieben gültig. Die **erste tatsächliche Lieferung** durch den Kreditnehmer wurde an Tick **130.676** gemessen, anschließend insgesamt **49 reale NPC1/2-Frachterverkäufe** gegenüber 0 in der Kontrolle. **0 ISK** wurden bis zum Endtag 365 getilgt; **1.380 ISK** Forderung verbleiben. Der Kreditnehmer NPC1 besitzt dann **0 ISK und 0 Frachter**. Der verkürzte Wiederanlauf erhöht im Krisengesamttest die Kostenunterdeckung um **4.453 ISK** sowie die Verlustzahl um 3, ohne die Aldera-Silizium-/Bauteilversorgung zu reaktivieren.

In den Fällen `miner`, `station` und `jagd` wurde **kein** Kredit finanziert. In `miner` und `jagd` scheiterte in jeder geprüften kreditfähigkeitsrelevanten Stunde der gesamte Kapitalbedarf an der einzeln zu prüfenden Stationskasse: `unfunded` jeweils **13.200** Versuche. Im Fall `station` blieben **13.144** Versuche wegen nicht ausreichend finanzierbarem Einzelkredit aus, bei 13 Versuchen fehlte eine fertige Werfthülle. Diese Stundenzählungen sind **wiederholte Prüfungen**, keine Anzahl verschiedener Konzerne oder Verträge.

### [ANALYSE] Entscheidungsempfehlung

**B6e-P0 nicht in `main` integrieren.** Der gezielte Kredit demonstriert, dass *erster realer Warentransport* möglich ist, solange jemand Hülle und Anlaufkapital wirklich bezahlt. Er demonstriert **nicht**, dass daraus bezahlte Arbeit, Tilgung oder erneuter Schiffsersatz finanziert werden können. In den Krisen entsteht sogar zusätzliche Unterdeckung und ein ungetilgter Stationsanspruch. Eine automatische zweite Kreditchance würde ohne Schuld-/Risikobewertung untragfähigen Wiederaufbau erlauben.

**Nächste kleine [ANALYSE] B6f vor jeder neuen Regel:** Die tatsächlichen **49** Verkäufe im einzigen finanzierten Fall vom ersten Wareneinkauf bis zum endgültigen Schiffsausfall zeitlich und bilanziell aufschlüsseln (Warenwert/Preise/Fees, tatsächliche Arbeitszahlung, Käuferkasse, Fahrtzeit, Schäden/Verluste, Kassen vor/nach Erwerb/Verkauf, Zeitpunkt der Hüllenverluste, hypothetische nicht wiederholte Pflichttilgung). Danach entscheiden, ob die Ursache unprofitable Routen nach Arbeitskosten, verteilte Kassen, operative Liquidität, Verluste oder mehrere gleichzeitig sind. **Keine** erneute Kapitalspritze, bevor Gläubiger und realer Rückfluss belegt sind. Getrennt anschließend Jäger-/Escort-Gate aus [Roadmap-Vorschlag #49](https://github.com/tobiasfranziskus/Check/pull/49) prüfen; kein Mix mit dieser Finanzierungsänderung.

**CI-Abnahme des dokumentierten End-HEAD nach dieser Berichtsaktualisierung** erfolgt separat. Weder iPad Safari noch NAS wurden praktisch abgenommen.

Keine Änderung an `index.html`, Produktionsschemas, Goldenwerten oder `docs/ROADMAP.md` in diesem Analyse-PR; Roadmap-Entscheidung ist separat in #49 dokumentiert. **Kein Merge oder Deployment.** Keine echte iPad-/NAS-Abnahme.
