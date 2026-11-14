# K13 + F6 – gemeinsamer Forschungs-Spielkern

**[DRAFT / Integrationsversuch · 13.11.2026]** Basis K13 [#328](https://github.com/tobiasfranziskus/Check/pull/328), selektive Übernahme der Spielbarkeit aus F3–F6 [#318](https://github.com/tobiasfranziskus/Check/pull/318)–[#321](https://github.com/tobiasfranziskus/Check/pull/321).

## Ergebnis des ersten Entwicklungsschritts

- Ein Weltzustand: K7/Regel200 nutzt die isolierte K1-/K7-Quelle `prototypes/welt/rule200-k7-industry-core.js`; F6 ergänzt diesen getrennten Forschungskern um den selbst finanzierten Spielerfrachter, echte 2D-Steuerung im Transit und die Torfreigabe.
- Ein Tick: Nach dem ursprünglichen `kern.step` folgen F6-Spielerfracht-Lohnabrechnung und K7-Vertragsstatus. Zusätzliche Flugsteuerung erzeugt keinen zweiten wirtschaftlichen Tick.
- Das K1-Touch-Cockpit `prototypes/welt/index.html` nutzt weiter Regel199. Der neue separate Spieltest `spieltest/k13-f6/index.html` aktiviert K7/Regel200 über denselben Forschungs-Core mit eigenem IndexedDB-Ursprung `aphros-void-welt-k13-f6-v1` und eigenem JSON-Umschlag. Vollständig spielbare K7-Industrieverträge fehlen noch.
- Vorhandene Regel195-Produktdateien (`index.html`, `aphros-void.html`) und Original-W5-Source (`prototypes/w5ac/rule191-w5-ferry-core.js`) bleiben gegenüber `main 04124f2b` unverändert. Keine Migration und kein Deployment.
- K13-Kundenvorschuss und Eigentümereinlage bleiben **[OPTION / ANALYSE]** in ihrem getrennten Forschungsadapter; keine Finanzierungsvorgabe, keine heimliche automatische Entnahme aus Privatkonten.

## Konfliktauflösung

Der F6-Forschungszweig enthielt Anpassungen in einer mit Regel195 geteilten Datei. Diese Anpassungen werden **nur in die K7-isolierte Quellkopie** übertragen. Bei gemeinsamen W3-/W4-/W5-Audits bleiben die speziellen K7-Storno-/Treuhandkorrekturen erhalten, während der tatsächlich vom Spieler bezahlte Frachterkauf aus der Speditions-Bilanz herausgerechnet wird.

## K13/F6b – opt-in NPC-Industrie im spielbaren Regel200-Forschungsprofil

**[DRAFT/OPTION · keine Produktregel]** Die eigenständige Testseite `spieltest/k13-f6/index.html` erhält den Schalter **„NPC-Industrie freiwillig einschalten“**. Er ändert ausschließlich die gespeicherte K7-Forschungspolitik `kanon.industrieAuto` (optional; bei alten K7-Ständen fehlt das Feld und das ursprüngliche Verhalten bleibt unverändert). Es gibt keinen Spielerknopf, der sich als `st_nadir`, `npc3`, `transport` oder `werft_extern` ausgibt.

Bei tatsächlicher Freigabe durch den Spieler disponiert ausschließlich der **gemeinsame K7-Core** mit den bereits vorhandenen `industrialOreOffer`, `industrialOreAcceptMine`, `industrialOreAcceptFreight`, `industrialOreAcceptYard`, `industrialOreCommit` und `industrialOreBuildShip`. Die NPCs benötigen jeweils korrektes Eigentum an echten, verfügbaren Schiffen sowie Kassen für Bergbau, Warenkauf, Käuferetats, Transportlohn und Werftarbeit. Jede fehlende Voraussetzung verhindert den Folgeauftrag – ohne Beihilfe, Minting oder kostenlose Materialproduktion. Die K7-Werftreserve ist an die echte Warenanlieferung in Nadir gekoppelt. Die Lagerzielprüfung verhindert einen Auftrag ohne physisches Nachfrageziel. Die NPC-Automatik kann jederzeit abgestellt werden; bereits rechtsgültig finanzierte Verträge bleiben bestehen und werden nicht gratis storniert.

Die Regel200-Browseroberfläche zeigt Vertragsphase, drei Unterschriften, tatsächliche Wareneingänge, Reserven und Kassen. Ein eigener Touch-Browsertest prüft den opt-in-Schalter; die neue Node22-Testdatei `tests/k13-f6-npc-industrie.test.mjs` prüft Seeds 42/7 von dem belegten K6-Stoppzustand bis zur vollständig realen W3-/W4-/W5-Kette und mit Replay, Geld-/Eigentumsprüfung und negativen Regel199-Gates.

**QA-Status bei Erstellung dieser Ergänzung:** neue Tests auf dem aktualisierten Code-Head **noch nicht abgeschlossen**. Die positive K7-Einzelregel-Prüfung aus den älteren PRs ist kein Beweis für die neue NPC-Automatik.

## Qualitätssicherung

- Neue Node-Integration: `tests/k13-f6-gemeinsamer-spielkern.test.mjs` prüft Rule200 + F6-Funktionen, Startaudit, Weltgeld, Replay, Hash und Save/Load sowie explizite Regel199-Abgrenzung.
- Alle Original-`tests/*.test.mjs`, K7–K13-Wirtschaftstestgruppen, 15×90-, 5×365- und 2×730-Tage-Szenarien, die W5-Einzeldatei-Buildprüfung, neun F6-Browsertests und ein zusätzlicher Regel200-Browser-Test (vier Größen je Engine) sind im K1-Workflow vorgesehen.
- Bis zu einem tatsächlich abgeschlossenen Lauf **keine** dieser neuen Integrationsprüfungen als bestanden werten.
- Negative Befunde dokumentieren; keine pauschale Rettung und keine Referenzhashanpassung nur für grünes CI.

## Weiterer Integrationsschritt

Der isolierte Regel200-Spieltest-Einstieg ist implementiert und erhält einen eigenen Browser-Smoke-Test. Nach einem grünen Core-Gate folgen die autorisierten NPC-/Industrieverträge sowie der vollständige Spielerablauf bis zum Produktions-/W5-Kaufabschluss. Danach End-to-End-Geld-/Waren-/Eigentumsprüfung und Touchabnahme. Keine automatische Regel200-Produktfreigabe.

Offen: echte iPad-Safari-/NAS-Geräteabnahme, reale navigationsabhängige Nadir-Ankunft, nachhaltiges W6-Endkundengeld, Beschluss zu K13-Finanzierungsoptionen.
