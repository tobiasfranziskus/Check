# W5s-ad–af: zwei echte Frachtmärkte statt künstlicher Erzaufträge

**[DRAFT/ANALYSE, 7. November 2026]** Stack auf [W5s-ab/ac #232](https://github.com/tobiasfranziskus/Check/pull/232). Der Stand [MAIN] `5a56d9d7` mit öffentlicher GitHub-Pages-Testfassung und unverändertem Archiv bleibt unberührt. Regel32-/Schema8-Forschungsopt-in, kein Merge, Deployment oder genehmigtes Produktionsbalancing.

## Ausgangsproblem: bezahlter Frachter, aber keine neue reale Erzbestellung

Nach W5s-z/aa ist `w5s_carrier3` ausdrücklich privat mit 930 bereits vorhandenen ISK finanziert, hat eine physische W5-Hülle für 750 ISK tatsächlich gekauft und 60 ISK für die reale Nadir–Aldera-Pilotenarbeit gezahlt. Sie besitzt danach 120 eigene ISK und die eigene eindeutige W5-Schiffs-ID `sh021`. Die ältere unabhängige Gesellschaft `w5s_carrier2` bleibt finanziell getrennt mit 720 ISK.

W5s-ab/ac belegt in den Krisenseeds 42/7 **null neue bezahlte Erzfrachten**, weil vorhandene Erzreserven in Nadir die tatsächlich finanzierte Ersatzwerft versorgen. Ein künstlicher Bedarf würde physische Bestände und Gewinnsystem verfälschen. Die neue Stufe öffnet deshalb den anderen **bereits bestehenden** Markt: Eis wird nur für wirklich benötigtes Wasser, mit echtem Käuferetat und realem Haushaltsverbrauch transportiert.

## ad – Finanzierung und Eigentum auch für W5n-Eis

Mit **`w5s.successorNewIce=true`** (zusätzlich zu `successorNewFreight` und bisheriger rechtmäßiger W5s-aa-Kette) prüft `shipFreightIce` denselben Original-W5n-Kern für die dritte Spedition. Das positive Gate setzt zugleich voraus:
- nachweislich gekauftes und bezahltes physisches Schiff in Aldera mit richtiger Eigentümer-ID, abgeschlossene originale 60-Minuten-Überführung;
- wirklich vorhandene volle 50 Eis im Aldera-Stationslager, Zielraum, freie ursprüngliche W5n-Frachttreuhand;
- Nadir-Budget vollständig für Eis und beide Flugtarife gebunden (**490 ISK**, davon 250 tatsächlicher Eisankauf und 240 Frachtertarif); tatsächliche Wasser-Nachfrage und ein Haushalt, der seinen nächsten Verbrauch **wirklich** bezahlen kann;
- eigene Firma reserviert **120 ISK** vollständigen 120-Minuten-Pilotenlohn; 240 ISK Erlös erst nach vollständig bezahlter echter Hin- und Rückfahrt.

Eis-, Geld-, Lohn-, Fracht-, Haushalts- und Pilotenkonten bleiben dieselben wie vorher. Die separate neue Spedition erhält nur tatsächlich von ihr verdiente Erlöse; W5o darf ihre Gewinnmarge nicht dem alten `transport`-Konzern als Dividende zuschreiben.

## ae – ein Dispatcher, zwei reale Märkte, kein Zusatzkern

Die öffentliche rein lesende Funktion `w5sNewCarrierFreight(state,rules)` erklärt beide Nachfrage-/Finanzierungsprüfungen. Mit dem vorherigen `successorNewAuto`-Opt-in prüft der stündliche Dispatcher nach der alten W5o-Fracht und der früheren Nachfolgespedition: zuerst belegten finanzierbaren W5-Erzbedarf, danach zahlungsfähige reale Wasser-/Eisnachfrage. Nur wenn die originalen Checks positive Beweise liefern, erfolgt einer der originalen `shipFreight`-/`shipFreightIce`-Befehle. Unterschiedliche Schiffe dürfen weiterhin dieselben autoritativen W3/W5n-Prüfungen durchlaufen; ein Schiff oder eine Treuhand wird nicht doppelt vergeben.

## af – unabhängige Geld-/Arbeitseigentümerprüfung und Krisen

Das originale W5n-, W5o-, W5s-, W5r- und Konzernbuch berücksichtigt den dritten Eigentümer getrennt bei real reservierter/bezahlter Eis-Pilotenarbeit, Erlösen, Waren- und Schiffsprovenienz, Frachtversand und rechtmäßigem 30-Tage-Verschleiß. Chronologische Dispatcherbelege werden je Frachttyp und tatsächlichem Abschluss begrenzt; fremde Umsätze und gefälschte Arbeitsminuten gelten nicht als eigene.

Neue Testdatei `tests/w5s-ad-af-realnachfrage.test.mjs` einschließlich Seed42/7-Finanz-/Liefergates, 13 Seeds × 90 Tage ohne künstliche Gründung, Seed42/7 × 365 Tage mit echtem W5-Kauf, Original-Audits, manipulierten Belegen und Save/Load. Node22-Github-Actions [Workflow](../.github/workflows/w5s-ad-af-realnachfrage.yml) enthält zudem die vorherigen W5s-ab/ac-, W5s-aa- und W5s-x-Regressionsprüfungen sowie vollständigen Standardlauf. **Erfolg und tatsächliche Zahl neuer Aufträge nur nach finalem CI-Log festhalten.**

## Nicht behauptet / nächste Produktentscheidung

Es wird kein neuer Bedarf durch Schiffsbesitz erschaffen. Eine zusätzliche Eisfracht wird ausdrücklich verweigert, wenn Eis-/Wasserlager voll sind oder der Verbraucher den nächsten Verbrauch nicht bezahlen kann. Ebenso ist eine W3-Erzfracht trotz realer Erzbestände verboten, wenn kein werftbegründeter zusätzlicher Transportbedarf besteht. Die neue Gesellschaft darf scheitern; 30 Forschungs-Spieltage Verschleiß sind noch keine Produktfreigabe. Eine dauerhafte zweite oder dritte Frachtergeneration ist nur mit wirklich bezahlten Folgeaufträgen, ungebundener Eigentümerkasse, realer Werftware und nochmalig realer Finanzierung möglich.

**Offene Abnahmen:** vollständiger Node22-Workflow, iPad-Safari/NAS, Save-/UI-Integration der Forschung, wirtschaftlich belastbare wiederkehrende Endkunden und Produktentscheidung zur Nachfragepolitik.
