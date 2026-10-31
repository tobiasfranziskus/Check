# B6e-P0 – Ein einzelner finanzierter Frachterstart mit echtem Stationsdarlehen

**31. Oktober 2026 · [ANALYSE/DRAFT] – Versuchsplan, erste CI noch ausstehend**

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

**Empfehlung ausstehend.** Keine Änderung an `index.html`, Produktionsschemas, Goldenwerten oder `docs/ROADMAP.md` in diesem Analyse-PR; Roadmap-Entscheidung ist separat in #49 dokumentiert. **Kein Merge oder Deployment.** Keine echte iPad-/NAS-Abnahme.
