# B-K11g – Gemeinsames Auftrags-Gate: echtes Marktangebot, Geld- und Warenansprüche

**[ANALYSE/DRAFT, 03.11.2026]** Isoliert auf [`main b4e604d6`](https://github.com/tobiasfranziskus/Check/commit/b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c), Regel 14 / Schema 8. `index.html` und alle Produkt-, Geld-, Preis-, Steuer-, Personal-, Speicher- und UI-Regeln bleiben unverändert. **Kein Merge und kein Deployment.** Verbindliche Prioritäten stehen ausschließlich in `docs/ROADMAP.md` auf main.

## Warum dieser weitere Schritt nicht B-K11f wiederholt

[B-K11f #144](https://github.com/tobiasfranziskus/Check/pull/144) hat ein **isoliertes Settlement bereits historisch ausgeführter B-K10k-Belege** korrekt finanziert; dort kamen die Werte nicht mehr aus einem dynamischen aktuellen Markt. B-K11g misst jetzt die andere offene Vertragshälfte: **Kann ein Auftrag bei heutigen echten Preisen, vorhandenen Eigentümerkassen, verfügbarem Eis, Stationlagergrenzen, einem existierenden Frachter und realer Route überhaupt belastbar angeboten werden?** Können zwei Betreiber dasselbe Geld oder Rohstoffstück gleichzeitig verplanen?

`tools/bk11g-auftrag-preflight.mjs` liest nur die Original-Core-Routentabelle, Preis-, Gebühren-, Werftpreis-, Warenlager-, Kassen- und Schiffszustände. **Alle Quotierungen werden aus dem originalen Zustand errechnet** und gegen Save/Load/Hashes verglichen. Sie sind Momentaufnahmen, keine bindenden Original-Core-Aufträge. Vor echtem Handeln muss beim selben Tick aus Originalwerten neu validiert werden.

## Objekt- und Leistungsstandard [OPTION – keine produktive Regel]

Ein künftiger Auftragsbeleg bräuchte mindestens `id, regelVersion, stateHash/tick, type, quelle, ziel, material, menge, herkunftId, herstellerId, transporteurSchiffId, bestellerId, zahlungsberechtigte, preisobergrenze, frist, claimsGeld[], claimsWare[], claimsLagerplatz[], erbrachteLeistungBelege[], status`. **Identität und Eigentum** kommen aus dem echten Core, niemals aus Schiffsnamen, Clienttext oder UI-Anzeigen.

Phasen: `angeboten → komplett-vorfinanziert → Material real beschafft → Produktion bezahlt/fertig → Ware versandt → wirklich übernommen/verbraucht → abgeschlossen`, mit den getrennten Abbrüchen `abgelehnt/gescheitert/verfallen`. Ein vollständig finanziertes Anfangsangebot bedeutet **nicht**, dass später produziert, geliefert, konsumiert oder eine Hülle erworben wurde. Ein offenes Angebot hat keinerlei Anspruch auf eine Rettung bei Insolvenz.

**Interlocks nötig:** Ein Core-integrierter `frei = real vorhanden − gültig beansprucht`-Check muss für **alle** konkurrierenden Verwendungen derselben Ware gelten: Produktion aller Linien, NPC-/Spielerhandel, stündlicher Verbrauch, Außenhandel, Schiffsladung sowie künftige Werft. Claim-Bindung eines künftigen Lagerplatzes und eines tatsächlich vorhandenen Schiffes verhindert weitere Doppelbuchung. Geldclaims einschließlich Gebühren, Arbeit und Risiko müssen direkt die verfügbare Eigentümerkasse einschränken; `core.audit` und Save/Load müssen Escrow als eindeutig zuordenbare Bestände erhalten. **Keine nur in der Oberfläche oder im Analyseschatten existierende Reservierung integrieren.**

**Leistungsbelege:** Nur von bestätigten Core-Ereignissen abgeleitete IDs (echte Förderung, originaler Warenverkauf, tatsächlich abgeschlossene Rezeptzeit, Flug-/Frachtankunft, physisch abgenommene Einheit) berechtigen zu genau einer Auszahlung; ein frei eingegebener `leistung:...`-Text oder ein Preisangebot nicht. Bei Verlust werden unverdiente Gelder erstattet und Material tatsächlich vernichtet; vergangene Arbeit bleibt bezahlt; eine 780-ISK-Cashreserve erzeugt **keine reale Hülle**. Auch ein erfolgreich bezahlter Stationsankauf ist **nicht automatisch ein erneuter Endkundenumsatz**.

## Realer Markt-Preflight vs. Test-Schätzungen

Zum Vergleich einer Nahrungsproduktion in Nadir mit einem realen Stationsein- **nicht** Endverkauf in Aldera wird aus dem Originalmarkt je angefragter Menge berechnet:

- Material: 2 Eis je Nahrung, vorhandene Nadir-Eisbestände, Nahrungs-Quell-/Ziellager-Kapazität, physischer Frachter und Originalroute.
- Vorfinanzierung: Quellstation sichert **konservativ den momentanen Eis-Wiederbeschaffungswert** plus den **nicht freigegebenen Schatten-Fabriklohn** von 4 ISK je Original-Rezeptminute; der echte Miner-Eigentümer die gerundete Minertätigkeit.
- Händler sichert den echten Original-Quellmarktpreis plus echte Quelle-/Zielgebühren, eine konservative Originalarbeits-Kostenobergrenze der Hin-/Lieferreise und einen **rein finanziellen** Frachterersatzbetrag zum aktuellen Werftmarktpreis. Die Zielstation bindet ihren originalen Kaufbetrag.
- Aus Preis-/Betriebskosten folgen drei **unterschiedliche** Indikatoren: lokaler Quellenmomentabstand, Händlerbeitrag vor Ersatz und gesamter Beitrag vor Hüllenrisiko. Die künftige echte Marktpreis-Änderung, tatsächliche alte Eis-Provenienz, vorhandenes Eis-Einstandsbuch, ein **garantierter ziviler Endverbraucher** und der echte Produktionslohn fehlen weiterhin. Keiner dieser Momentwerte ist eine finale Gewinn- oder Kostenbuchung.

**Test-only Claims:** Nur im separaten Entwicklungsregister werden Geld, Eis und beiden zukünftigen Nahrungs-Lagerplätzen atomar zugeordnet. Ein zweiter Auftrag kann bereits gebundene Gelder und Waren **nicht** nochmals verwenden; ein scheiternder Antrag verändert keine Reserve. Storno gibt nur unverdiente Ansprüche frei. Die Registerbindung wird bei jeder echten Änderung des ursprünglichen Tick-/Core-Hash **ungültig**; kein dauerhaftes Schatten-Claim-System. **Auszahlung ist absichtlich unmöglich** (`unsafeSettle` wirft) solange echte signierte Core-Ereignisse und persistente Claims fehlen. Ein separater Material-only-Stresstest prüft `48+48+16` Eis direkt gegen original vorhandene 100 Einheiten, ohne zusätzliche Mittel zu erfinden; das ist **kein bezahlter Auftrag**.

## Freigabegrenzen / nächste Entscheidung

- **D2:** Echt bezahlter Fabriklohn und Empfängerkonto; die 4 ISK/min sind bisher eine **unbeschlossene Testannahme**.
- **D3:** Verträge, Echtclaims, Last-/Fertigladung, Prioritäten bei Konkurrenz, Save-Migration und Abbruchfolgen; alle Warenverbraucher müssen Claims beachten.
- **D4/D5:** Existierender Original-Routen-/Preisalgorithmus, echter Betrieb, Verlustexposition, Wiederbeschaffungszeit; ein Preisfenster aus B-K11f ist kein tatsächlicher Neuauftrag.
- **D6/H1:** Nur aus tatsächlich vorhandenen Käufer-ISK kann der Original-Stationsankauf bezahlt werden; ein eigener ziviler Endverbraucher braucht eine **gesonderte Entscheidung** über Einkommen/Finanzierungsquelle und gegebenenfalls konkrete global begrenzte Modell-B-Ausgabe. **Kein Abziehen von Spielerersparnissen, kein individuelles NPC-Rettungsbudget.**

**[TEST]** Ergebnisse, Node-Testzahl, Seeds und CI-Erfolg erst nach Ausführung ergänzen. Keine 13×90d-Abnahme eines veränderten Produkts, keine iPad-/NAS-Abnahme, keine Produktionsfreigabe.
