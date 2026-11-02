# B-K9r – lokaler, ausschließlich aus Lohn bezahlter Nahrungskonsum

**02.11.2026 · [ANALYSE/DRAFT].** Gestapelter Kandidat auf [PR #110](https://github.com/tobiasfranziskus/Check/pull/110), der #109/#108 voraussetzt. Verbindlicher [MAIN]-Stand bleibt `b4e604d`, v0.12.5, Regel14/Schema8.

## Eng begrenzter Nachweis

Der Versuch ergänzt **keinen** allgemeinen Geldzufluss und keine Subvention. Ausschließlich in einer expliziten Testkonfiguration `schema: 9`, `rulesVersion: 15`, `world.produktionslohnJeMinute: 1` und `world.haushaltskaufNeu: true` darf ein Haushalt lokale neu produzierte Nahrung zum **bestehenden Core-Marktpreis** aus eigenem, bereits bezahltem Lohn erwerben. Beide Schalter sind **nicht** Teil der regulären Spielregeln auf `main` und kein freigegebener wirtschaftlicher Parametersatz.

- Die Produktion ist nach [B-K9q](https://github.com/tobiasfranziskus/Check/pull/110) bereits vorfinanziert. Bei Fertigstellung entsteht eine Einheit **lokal nachgewiesene Neuware** und der volle Rezeptlohn wird aus der Reserve bezahlt.
- Beim stündlichen Original-Endverbrauch werden nicht nachgewiesene Altbestände zuerst konsumiert und **als nicht finanziert protokolliert**, jedoch niemals als neuer bezahlter Wirtschaftskreislauf ausgegeben. Erst darüber hinaus kann der Haushalt aus seiner tatsächlichen Kasse neue Nahrung kaufen. Unbezahlbare Neuware bleibt im Lager und erzeugt tatsächlichen Fehlbedarf statt Gratisversorgung.
- Für jede bezahlte Einheit überweist das Haushaltskonto `hh_<station>` an das Stationskonto `st_<station>`. Die Ledger-/Statistikbuchung weist den Nahrungsverbrauch und beide Geldseiten aus. Es wird kein ISK gemintet.
- Herkunft wird bewusst nur für **lokal produzierte Nahrung** nachgewiesen: `station.lokalNeuNahrung` erfasst die verbleibenden neuen Einheiten. Beim Schiffskauf oder Neutralexport wird zuvor unmarkierte Ware zuerst entnommen; abgegebene Neuware zählt als `ausgelagert` und erhält bei Wiederverkauf **keine** neue lokale Kennzeichnung. Angelieferte Nahrung bleibt also vorläufig nicht als neu bezahlt nachgewiesen (konservativ, aber keine vollständige Warenprovenienz).
- Unabhängige Herkunftsidentität: `lokaler Neubestand + exportierte Neuware + aus Neuware gekaufte und konsumierte Menge = lokal erzeugte Neuware`. Der Check läuft im bestehenden `core.audit` und beim `load`; weitere Haushaltskosten und Einnahmen bleiben im `stats.konto` nachvollziehbar.
- Ein Schema-8-/Regel-14-Altspielstand migriert mit `lokalNeuNahrung = 0` und einem leeren Herkunftsledger, **ohne vorhandene Startnahrung nachträglich neu zu deklarieren**. Neuere Schema-9-Spielstände ohne aktiviertes Haushaltsmodell können nicht still in dieses Modell geladen werden; umgekehrt werden aktivierte Stände bei unpassender Testkonfiguration abgewiesen.

## Vorläufige Bewertung und Grenzen

**Die Hauptfrage ist jetzt quantifizierbar:** Reicht der Lohn aus echten Produktionsminuten für Nahrung zum aktuellen Marktkurs? Fehlender Haushaltserlös darf nicht durch individuelle Zuschüsse, vermutete Startlager-Kaufkraft oder ungenehmigte Geldmodell-B-Emission kaschiert werden.

Dieser **lokale** Kreislauf beweist noch nicht: Vergütung von tatsächlich gefördertem Eis und dessen gesamte Herkunft, globale Warenprovenienz über Frachter hinweg, Bezahlung der bisherigen freien Altnahrung, Schiffsreparatur und bezahlten Ersatz, Haushalte mit Einkommen aus anderen Tätigkeiten oder wiederholt tragfähige 40 Perioden. Auch eine erfolgreiche 13-Seed-Determinismusprüfung ist keine 13×90d-Wirtschaftsstabilität. Die historisch grünen Regel14-Workflows testen nicht automatisch die neue Variante.

## Tests / Freigabestatus

`tests/bk9r-haushaltskauf-lokal.test.mjs` prüft neue lokale Produktion, zahlungsunfähige Haushalte, tatsächlich bezahlte und konsumierte Ware, nicht angerechnete Startlager, konservative Schiffsauslagerung, Migration/Korruptionsablehnung und 13 Seeds × vier Stunden inklusive Audit/Replay/Save/Load. Ergebnisse werden erst nach realem CI-Lauf eingetragen.

**Kein Merge/Deployment ohne ausdrückliche Freigabe.**
