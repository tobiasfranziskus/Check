# B-K10d – gespeicherte Herkunft neuer Nahrung im Original-Core (Draft)

**[ANALYSE/DRAFT · 02.11.2026]** [PR #121](https://github.com/tobiasfranziskus/Check/pull/121) auf [#120](https://github.com/tobiasfranziskus/Check/pull/120) → #108. **[MAIN]** `b4e604d6` mit v0.12.5/Regel14/Schema8 unverändert. Kein Merge, keine neue ISK-Quelle, keine Preis-/Lohn-/Fonds-/Produktregel-Freigabe und keine reale Safari-/NAS-Abnahme.

## Präzises Problem

In B-K10c war eine in Cyris **wirklich neu produzierte und dort gekauft** Nahrungseinheit nach dem realen und bezahlten Frachtertransport nur noch als unmarkierte Menge vorhanden. Orion bezahlte bei Entladung 56 ISK, aber der Haushalt verbrauchte bei verfügbaren 280 ISK diese Neuware später **kostenlos als Altware**. Nur eine ausdrücklich manuell veränderte Testherkunft ermöglichte die Zahlung. B-K10d ersetzt diese manuelle Testkorrektur durch einen kleinen, wirklich speicherbaren Core-Lifecycle.

## Isolierte Umsetzung, keine produktive Umstellung

Das bisherige Regel15-Modell `lokal-neu-v1` bleibt bei unverändertem Regelsatz und fehlendem Schalter `herkunftTransportNeu` in seiner ursprünglichen Semantik. Nur eigens erstellte Regel15-/Schema9-Versuchswelten mit `herkunftTransportNeu:true` verwenden `transport-neu-v2`.

- **Quelle und Herkunft:** Eine Nahrungsproduktion erhöht weiterhin `lokalNeuNahrung` und den erzeugten Gesamtzähler; alte Waren werden nicht künstlich als neue markiert.
- **Core-Wareneinkauf:** Der ursprüngliche Core prüft Waren-, Preis-, Kassen- und Reservebedingungen. Bei echtem Kauf wird entsprechend FIFO genau die belegte Neuware auf `schiff.neuLadungNahrung` übertragen; die zugehörige Menge wandert von Stationsbestand in `haushaltNeuLedger.transit`. Im V1-Modell bleibt die alte Buchung `ausgelagert` unverändert.
- **Reise und Save:** Der Frachter enthält die Warenmenge und den darin belegten Neuanteil. Die originalen `shipMove`-Kostenverträge sind unverändert; kein neues Cargo-/Preis-/Fahrtgeld. `core.save` und `core.load` sichern beide Mengen und validieren sie.
- **Echter Verkauf und Teilentladung:** Es werden nur wirklich verkaufte Frachtnahrungseinheiten abgebucht. Alte Ladung zuerst, danach tatsächlicher neuer Anteil; Transit sinkt, der neue Anteil des Stationslagers steigt. Jede Station kann diese Herkunft beim späteren Haushaltskauf für die Originalpreiszahlung verwenden.
- **Verlust, Plünderung, Außenhandel:** Tatsächlich vernichtete oder dauerhaft ausgeführte Neuware wird von Transit oder Station in `ausgelagert` umgebucht. Erhaltene Beute in der Piratenmarktstation wird als neue Ware wieder eingebucht; normale Außenhandel-Einfuhr bleibt unbewiesene Altware.
- **Unabhängige Herkunftsbilanz:** `sum(stations.lokalNeuNahrung) + sum(ships.neuLadungNahrung) + ledger.ausgelagert + ledger.konsumiert = ledger.produziert` und `sum(ships.neuLadungNahrung) = ledger.transit`. Die gebuchten Haushaltskäufe stimmen weiter mit `konsumiert` überein. Zusätzlich müssen Geldbestand samt gebundener Vertragsreserve und das Warenledger unabhängig stimmen.
- **Saveschutz:** Regel15-V1-Saves ohne bereits ausgelagerte Neuware können nur bei explizit gewähltem V2-Testmodus überführt werden. Wenn V1 `ausgelagert>0` meldet, ist die ehemalige Herkunft möglicherweise unauffindbar; die Überführung wird **mit Fehlermeldung verweigert statt Neuware zu erfinden**. V2 unter deaktiviertem Schalter, manipulierte oder gelöschte Transitwerte werden abgewiesen. Keine automatische produktive Save-Migration.

## Abgrenzung und Wirtschaftskosten

Dieser Test speichert nur die **Mengenklassifikation alt/neu**, noch keine vollständige individuelle Rohstoff- oder Nahrungs-Chargen-ID und keine FIFO-Anschaffungskosten pro transportierter Charge. Das aus B-K9u bekannte chargengenaue Vollkostenjournal ist nicht mit den neuen Schiffsmengen verwechselt oder als bereits integriertes Produktmodell dargestellt.

Die bekannte negative Wirtschaftlichkeit des B-K10c-Einzelflugs bleibt: **46 ISK Einkauf + 178 ISK tatsächlich gezahlte Flugkosten gegenüber 56 ISK Stationsverkauf = −168 ISK, noch vor Handelsgebühren und Kapital-/Risikokosten**. Das Beheben eines fehlerhaften Endverbrauchsnachweises ist wichtig, saniert aber den Handel nicht und ermöglicht weiterhin keine langfristige Versorgungsgarantie.

## Teststand und weitere Gates

Die neue Datei [`tests/bk10d-herkunft-transit-save.test.mjs`](../tests/bk10d-herkunft-transit-save.test.mjs) prüft Seeds42/7, den 43-Minuten-Originalflug mit 180-ISK-Reservierung, echten Warenkauf/-verkauf, Lohn-finanzierten Endverbrauch, Save/Load auf Reise, Determinismus, mehrere Einheiten, Teilentladung, realen Verlust-Codepfad, bewusst verfälschte Speicherfelder sowie die explizite V1-V2-Abgrenzung.

**Erster CI-Head `6536a90`: NICHT vollständig bestanden (126/145 grün, 19 rot).** Ursache: Der neue Schiffszähler wurde trotz deaktiviertem V2-Modus auch im V1-Modell beschrieben; die sechs B-K10d-Tests waren bereits erfolgreich, aber ältere R15-Analyseprüfungen korrekt rot. Das wurde im nächsten Test-Head [`9566712`](https://github.com/tobiasfranziskus/Check/commit/9566712f985054861646457975138c72a764d930) durch strikte V2-Aktivierungsprüfung korrigiert. Das endgültige CI-Ergebnis wird gesondert verifiziert; bis dahin **kein bestanden für den Gesamtworkflow**.

**[NÄCHSTE GATES]** Prüfung großer Mischladungen (Alt-/Neu-FIFO), wiederholter Teilentladungen, tatsächlicher Piratenbeute und Außenhandelsexport, negative/positive Herkunftstestfälle mit V1-Saves. Anschließend 13 feste Seeds × 14/90 Spieltage unter echten autonomen Händlern gegen den unveränderten R15-Kontrollkern; gleichzeitig die Händler-Netto-Cashflows und lokale Zahlungsfähigkeit prüfen, ohne illegale Gratiszahlungen, neue Lohn-/Preisregeln oder Emission.

**Status:** reine Draft-Funktion, nicht auf `main`. Produktive Freigabe benötigt gesonderten Entscheid über Regel- und Schemaänderung, Migration und reale iPad-/NAS-Abnahme.
