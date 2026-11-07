# W5s-aj – realer Wasserexport gegen begrenzte ISK-Emission: Gegenprobe im vollständigen W5s-Kern

**[ANALYSE / DRAFT, 07.11.2026]** [PR #238](https://github.com/tobiasfranziskus/Check/pull/238) auf [W5s-ai #237](https://github.com/tobiasfranziskus/Check/pull/237). Weder neue Kernfunktion noch Änderung an `index.html`, Geldmodell, Regeln, Save-Schema oder Spieloberfläche. [MAIN] `5a56d9d7` und öffentlicher Spieltest bleiben unverändert. Die geprüfte Export-/Emissionsfunktion **W5q ist bereits vorhanden**, aber im Normalprofil ausgeschaltet. W5s-aj setzt W5q-Konfigurationswerte ausschließlich in isolierten Testwelten, niemals in der Produktkonfiguration.

## Warum genau dieser Vergleich?

Nach W5s-ah und dem W5s-ai-Ersatzkauf läuft der Originalkern in beiden Krisenseeds korrekt, doch die private Käuferkasse endet bei 8 ISK – unter dem unveränderten 14-ISK-Stückpreis für Wasser. Dabei liegen reale Waren und Eigentümerkassen vor. Zusätzlich verfügbare Kaufkraft darf **nicht einfach einem Verbraucher zugeschrieben** werden: Werftgelder sind Eigentümervermögen, keine Arbeitslöhne, und eine bedingungslose Ausschüttung könnte die nächsten Material- und Schiffbauaufträge gefährden.

Die isolierte R31/W5q-Forschungsfunktion erzeugt hingegen nur gegen **aus dem physischen Lager entfernte Wassereinheiten** nachvollziehbare ISK, limitiert durch `rate`, `dayCap` und `totalCap`. Ihr Buchungsbeleg verbindet `ledger.wasser.exported`, tatsächlich verschickte Einheiten, `w5q.minted`, `state.minted`, stationäre Einnahme und gegebenenfalls den Weg zum Haushalt. Diese Forschungsfunktion ist keine genehmigte Geldmodell-B-Emissionsregel.

## Unabhängig überprüfte Szenarien

Alle Szenarien beginnen **nach demselben vollständig finanzierten W5s-ai-Vorlauf**, mit der bereits wirklich bezahlten, gebauten und übernommenen Drittspeditionshülle ab etwa Tag 155. Die frühere W5s-ai-Ersatzfreigabe bleibt aktiv, W5u und Produkt-Rule14 bleiben außen vor. Die Zahlen sind Zusatzleistungen **seit diesem Ausgangszustand bis exakt Spieltag365**.

| Geldquelle und Empfänger | Tatsächlich exportiertes Wasser | Neu ausgegebene ISK | Zusätzlicher an Haushalte verkaufter Wasserbestand | Private Kundenkasse Tag365 |
| --- | ---: | ---: | ---: | ---: |
| Keine Exportemission (W5s-ai, Referenz) | 0 | 0 | 1.524 | 8 |
| Export zu 7 ISK/Einheit, 3.500-ISK-Cap, Haushalt | 500 | 3.500 | 9.230 | 7 |
| Export zu 14 ISK/Einheit, 3.500-ISK-Cap, Haushalt | 250 | 3.500 | 6.990 | 9 |
| Export zu 14 ISK/Einheit, 7.000-ISK-Cap, Station | 500 | 7.000 | 7.066 | 3 |
| Export zu 14 ISK/Einheit, 7.000-ISK-Cap, Haushalt | 500 | 7.000 | **10.072** | **2.082** |

Die höhere Einzelvergütung führt nicht automatisch zu höherer Wirtschaftsleistung: Mit einem konstanten Gesamtbudget von 3.500 ISK müssen beim Satz 7 ISK zunächst 500 physische Wasser exportiert werden, beim Satz 14 ISK nur 250 Einheiten; dadurch ändern sich Warenbestand, verfügbarer Verbraucherbetrag und spätere Produktion gleichzeitig. Empfänger, nomineller Satz und Emissionsgrenze sind **eigenständige Wirkparameter**; hier ist keine „optimale Rate“ abgeleitet.

### Kurzfristige Verbesserung ist keine Dauerfinanzierung

Die Variante **14 ISK je reales Exportwasser, 7.000-ISK-Cap, Haushalt** erzielt in Seed42 und Seed7 dieselben auditierbaren Leistungen und erreicht volle Endnachfrage bis einschließlich Tag365. Der Export endet nach 500 real ausgelieferten Wassereinheiten; danach wird **kein neues Geld** erzeugt. Haushalt Tag365: **2.082 ISK**. Anschließend fällt die Kasse bis Tag395 auf **500 ISK**, bis **Tag425 auf 8 ISK**, und ab dann stoppt regulärer Wasserabsatz wieder.

Endstand Tag425: Seit Ausgangspunkt **12.174 weitere wirklich bezahlte Wassereinheiten**; **500 Einheiten** Wasser real exportiert; **7.000 neue ISK** exakt gebucht, End-Weltgeld 40.000 ISK; kein unendlicher Haushaltsetat. Unabhängige Seed42/7-Hashes `3731b9b2f70efbf4` und `da311751ca38b39c`.

### Unabhängige Kontrolle / Testverfahren

Neue Testdatei `tests/w5s-aj-physischer-wasserexport-geldgrenzen.test.mjs` enthält vier Gruppen und verwendet ausschließlich die **bereits im GitHub-Branch vorhandene R32-Core-Implementierung**:

- OFF-Referenz Seed42/7 unverändert (bis Tag365, 0 ISK Emission).
- Seed42/7 mit real finanzierter Drittspedition, realem W5s-ai-Ersatzkauf und 7.000-ISK-W5q-Export durchgängig bis Tag425. Warenausfuhr 500, echte Emission 7.000, Original-Finanz- und Warenaudits, deterministische Hashes, Save/Load.
- Drei echte alternative W5q-Budget-/Empfängerkombinationen auf Seed42 bis exakt Tag365.
- Absichtlich verfälschte `minted`-Beträge, Exportwaren, Empfangskassen, Tick-/Ereignisbelege: globales Audit muss ablehnen.

**[TEST – direkt gegen den gespeicherten Code ausgeführt]** Vier von vier neuen Gruppen bestanden. Die gestapelten W5s-ai-Tests enthalten weiterhin 13 Seeds × 90 Tage, tägliche Original-Audits bis Tag365, Manipulationstests und Save/Load. Eine eigene Node22-CI startet gezielte Tests plus die vollständige Standard-Regression. Die GitHub-CI gilt erst nach ihrem Abschluss als bestanden; iPad-/NAS-Abnahme offen.

## Leitlinie für den nächsten Produktentscheid

Geldmodell B ist als Prinzip freigegeben, die **konkreten Emissionsregeln und die Begünstigten nicht**. Dieses Ergebnis rechtfertigt weder eine dauernde Neubefüllung der Haushalte noch automatische Fondsrettungen. Eine mögliche spätere Produktentscheidung muss erklären, **welche äußere Partei** Wasser abnimmt, welcher reale Nutzwert exportiert wird, wie die Emission dauerhaft begrenzt und geprüft wird, und ob/warum Erlöse an Stationseigentümer oder Verbraucherhaushalte fließen. Erst nach dieser Entscheidung sollte ein eigener, kleiner W5s-ak-Implementierungsschritt die laufende Wirtschaft ändern.

Kein Merge nach `main`, kein Deployment, keine Änderung an W5u #234, produktiven Spielständen oder GitHub Pages.
