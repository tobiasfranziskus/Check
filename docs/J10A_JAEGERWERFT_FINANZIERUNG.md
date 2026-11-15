# J10a – Original-Jägerwerft: Finanzierung und Eigentümerrechte sichtbar machen

**[DRAFT / 15.11.2026]** Baseline: `main 9082b22a8c4a142612384e1ee63890ddc64ac9f2`. Dieses Arbeitspaket ändert **keine** Wirtschaftskern-Regeln, Waren, Konten, Werftbesitzer, Kaufpreise, Steuerbefehle oder Saveformate. Die bestehende J8/J9-Konzern- und Minerwelt bleibt der einzige Regel204-Zustand. Das Original-Root195-Spiel und NAS-Datei bleiben unverändert.

## Was ist ab jetzt im Spiel direkt sichtbar?

Unter `prototypes/verbund/konzern.html` ist eine neue **J10-Industrie-/Werfttafel für Nadir** erreichbar. Sie zeigt nach jeder eigenen Kauf-/Förder-/Zeithandlung:

- Tatsächlich gespeicherte Nadir-Bestände Erz, Material, Silizium, Bauteile und fertige Jäger.
- Echte Kassen von `house`, `st_nadir`, `npc3`, `transport` und `werft_extern` (Werft-/K7-Finanzierung bleibt rechtlich getrennt).
- Original-Rezept: **8 Bauteile + 4 Material + 32 finanzierte Jäger-Werftminuten**, danach **900 ISK** Hauskauf. Fehlmengen der hypothetisch vollständigen Rezeptkette (einschließlich der echten J3-Vorprodukte) als **Projektion**, ausdrücklich kein automatischer Auftrag und ohne laufende Arbeit im Anspruch doppelt zu zählen.
- Für `stationRefine`, `stationBuildParts`, `stationBuildFighter`, `industrialOre*` und den Haus-`shipBuy` jeweils den **soeben geprüften** Original-Core-Sperrgrund. J6-W führt jede Testbuchung ausschließlich auf einer vollständig validierten **Kopie** aus; der tatsächliche Worldhash darf sich durch Anzeige nie ändern.
- Eine explizite Kaufmöglichkeit ausschließlich für den **tatsächlich verfügbaren, finanzierten** Jäger (`house`), über **die bereits vorhandene** J8-Whitelist und den Original-`shipBuy`-Befehl. Bei fehlender Hülle/900 ISK ist die Taste deaktiviert, bei zwischenzeitlicher Unterfinanzierung wird der Kern erneut befragt.
- **Keine** Produktions-/Vertragsunterschrift für `st_nadir`, `transport`, `npc3` oder `werft_extern` als Spielerknopf. Die echten Firmen bleiben unabhängig.

## Warum noch kein neuer Jäger aus frischem 195-Export?

Die bereits integrierte J6-W-Folgeproduktion ([Bericht](J6W_SPIELBARE_JAEGERWIRTSCHAFT.md)) wurde aus einem **bestehenden, bereits industriefinanzierten Regel204-Forschungssave** nachgewiesen. Die frische 195→204-Welt hat keine kostenlosen Bauteile/Silizium/Jäger und noch keine unterschriebene vollständige Werft-/Frachtkette. Für fremde rechtmäßige Unternehmerentscheidungen existiert keine freigegebene Spieler-Prokura. Ein Klick zum Setzen aller Firmen-Unterschriften würde den Eigentumsschutz umgehen. Diese Blockade wird **sichtbar statt verdeckt**.

**Nächster echter Wirtschaftsschritt J10b:** Finanzierung und eigenständige NPC-Firmenentscheidungen auf Grundlage vorhandener, legitimer Originalbefehle gesondert prüfen. Entweder schon vorhandene, rechtmäßig autorisierte Automatik auswerten oder eine neue ausdrückliche Vertrags-/Vorbestellregel zur Nutzerentscheidung vorlegen – nicht stillschweigend aktivieren. Daneben kann der Spieler bereits einen echten Nadir-Miner kaufen und selbst Silizium fördern, sofern vorhandenes Betriebskapital und Dock-/Bergbaubedingungen erfüllt sind.

## Tests / negative Gegenfälle

- `tests/j10a-werft-finanzierung.test.mjs`: Startwelt-Kopiervertrag, haus- vs. fremde Werftrechte, tatsächliche Original-J6-Offer-Ergebnisse, kaufbelegtes echtes Geld, Quellhash unverändert, vorhandener Jäger-Save read-only, Manipulationsabwehr.
- `tests/j10a-werft-browser.cjs`: Chromium/WebKit je 3 Touchgrößen, echte JSON-Auswahl, klare Eigentümeranzeige, **kein NPC-Button**, Jägerkauf trotz fehlender Hülle gesperrt, finanzierter Aldera-Miner, 33.000 ISK Weltgeld, unveränderte 195-Quelle.
- Original-W0–W5-Root-/NAS-Preflight, Node22-Gesamtsuite, alte J7/J8/J9-/Jäger-/Miner-Browserregression unverändert prüfen. Neue Wirtschafts- oder Geldemissionsregeln sind **nicht** Bestandteil dieses Arbeitsschritts, deshalb sind historische 13×90-Prüfungen keine neue J10-Nachhaltigkeitsabnahme.

**[STATUS BIS ZUM CI-ENDE]** Kein Test wird vor dem vollständigen tatsächlichen PR-Workflow als bestanden bezeichnet. Draft-PR bleibt bis zu grünem Gate und gesichertem vorherigem main unveröffentlicht. Echte iPad-Safari und private NAS-Geräteprüfung offen.
