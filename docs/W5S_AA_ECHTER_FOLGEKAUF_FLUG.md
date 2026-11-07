# W5s-aa – echter W5-Frachterkauf und bezahlte 60-ISK-Überführung der unabhängigen Folgegesellschaft

**[DRAFT/ANALYSE · 07.11.2026]** Auf [W5s-z #230](https://github.com/tobiasfranziskus/Check/pull/230) gestapelt. Separater Forschungsflag `w5s.successorNewPurchase=true` zusätzlich zu `successorNewOrder=true` (und vorhandener Nachfolgerkette). Keine Änderung an **[MAIN] `5a56d9d7`**, GitHub Pages, statischem Server, Standardspeicher/Regel32 oder Emissionsregeln. Keine automatische Rettung, keine künstliche Nachfrage, kein neuer Simulationskern.

## Geld, Eigentum und reale Hülle

Der unabhängige erste Nachfolger `w5s_carrier2` hat nach fünf wirklich finanzierten W3-Erzfahrten und Schiffverschleiß **720 ISK**; ihm fehlt der Ersatzbedarf von **930 ISK**, er erhält absichtlich **weder 210 ISK Zuschuss noch das neue Schiff**.

W5s-z hatte den **separaten, ausdrücklich beauftragten** neuen Käufer `w5s_carrier3` und eine neue physische Hülle geschaffen: Der Investor `export` hatte 930 ISK bereits auf `w5s_new_carrier_reserved` reserviert; W4 hatte zehn vorhandenes Erz gegen 20 ISK Lohn zu fünf Material verarbeitet; W5 hatte weitere 530 ISK echte Vorleistung erbracht. Die Werft hatte bis W5s-z noch keinen Kaufpreis aus diesem Treuhandkapital erhalten.

**W5s-aa** ergänzt einen getrennten, ausweisbar autorisierten Core-Befehl `shipClaimNewCarrier`, der nur mit dem neuen expliziten Flag, dem legitimen Investor und genau einer real produzierten, ausschließlich reservierten und noch unverkauften W5-Hülle ausgeführt werden kann:

- Das bereits hinterlegte **930-ISK-Treuhandgeld** fließt in ein **neues separates Firmenkonto** des `w5s_carrier3`; der Investor gibt kein zweites Kapital aus. Eigentümerschaften der alten Unternehmen bleiben getrennt.
- Der **originale W5-`shipBuy`-Kern** zahlt **750 ISK Kaufpreis** aus dem eigenen Firmenkonto an `werft_extern`, vermindert physisch den Frachterbestand, verbucht `ledger.frachter.consumed` und erzeugt eine **einmalige neue echte Schiffs-ID** in `w5.schiffIds`. Das W5-Audit prüft die neue ID und den tatsächlichen Eigentümer.
- Die Gesellschaft hat nach Kauf **180 ISK**. Ihr eigener, separat zulässiger ursprünglicher `shipReposition`-Auftrag sperrt **60 ISK Pilotenarbeit** vor Abflug und bezahlt in 60 echten Minuten **genau 60 ISK** an die vorhandene Pilotenarbeitskasse. Danach bleiben **120 ISK eigenes Betriebskapital** und ein nachweislich in Aldera angedockter, eindeutig eigener Frachter.
- Das gemeinsame W5s-Transferbuch und seine Originalaudits erkennen diesen zweiten eigenständigen Besitzer. Die neue Gesellschaft erbt weder Frachttreuhand, Schiffe, Einnahmen noch Arbeitsaufträge von `w5s_carrier2` oder der alten `transport`-Firma. Kein neues Frachtgeschäft wird erfunden.

Die Core-Audits rekonstruieren den gesamten Erwerb **aus ursprünglicher Investorenzahlung, unverändertem W5-Produktions-/Verkaufsbuch, neuer Schiffs-ID, Firmenkasse (930 − 750 − 60 = 120), tatsächlichen Werfterlösen, Flugreservierung und vollständig bezahltem Pilotenlohn**. Save/Load bleibt Schema 8 mit optionalen Feldern nur in der isolierten Forschungswelt.

## Grenzen, Prüfung und nächste Stufe

`tests/w5s-aa-eigentum-kauf-flug.test.mjs` prüft Seed42 und Seed7 über die echte W0–W5-Kette, abgewiesene unberechtigte und doppelte Käufe, exakte Werftgutschrift, separate Kassen, den Schiff-/Vertragshash, 60 einzeln bezahlte Flugminuten, Save/Load und Fälschungssperren. Auch zwei bis Tag365 fortgesetzte echte Welten und W5s-v/w/x/y/z-Regressionen sind im neuen eigenen Node22-Workflow vorgesehen.

**[TEST · 07.11.2026]** [W5s-aa Node22 #42354570699](https://github.com/tobiasfranziskus/Check/actions/runs/42354570699) auf Codecommit `abf2fee4`: **27/27 gezielte Gruppen bestanden, 0 Fehler, 0 Skips** (W5s-v/w/x/y/z plus fünf neue Kauf-/Eigentums-/Flugtests). In beiden wirklich gegründeten Seed42/7-Krisenwelten kauft die neue, vom alten Unternehmen getrennte `w5s_carrier3` gegen exakt 750 ISK ein physisches, neu produziertes W5-Frachterexemplar `sh021`, bezahlt danach 60 reale Flugminuten à 1 ISK über das Original-W5s-Treuhand-/Pilotenbuch und behält 120 ISK. Die ursprünglich verarmte `w5s_carrier2` behält ihre eigenen 720 ISK ohne Rettung. Weltgeld 33.000 ISK, Emission/Burn 0. Bis Spieltag365 täglich geprüft und Save/Load: Seed42 Hash `19a1acf30fd1e359`, Seed7 `4bca82bace52ef77`. Negative Prüfungen gegen fiktive Schiffs-IDs, Kaufbelege, Firmenkonten und nicht freigegebene Investorentransfers bestanden. Die neue Hülle fliegt **noch keine echten, bezahlten W3-/W5n-Kundenaufträge**; diese Freigabe und echter Mehrgenerationenbetrieb sind gesonderter nächster Auftrag W5s-ab. Echte Safari-/NAS- und vollständige PR-CI-Abnahme stehen separat aus.

**[OPTION · W5s-ab]** Erst in einer folgenden Stufe eine echte, vom zahlenden W3- oder W5n-Kunden begründete rentable Frachtgenehmigung für `w5s_carrier3` prüfen, dann eigenen Fahrzeugverschleiß und weitere Generationen. Ein Schiff zu besitzen und zu überführen allein belegt **noch keinen wirtschaftlichen Flottenkreislauf**; ein neuer Frachterbedarf erfordert erneut echte Nachfrage statt weiterer Subvention.
