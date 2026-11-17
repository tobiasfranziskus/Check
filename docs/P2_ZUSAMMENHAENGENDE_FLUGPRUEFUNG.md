# P2 – zusammenhängende Flugprüfung [MAIN / PAGES]

**Release-Abnahme 17.11.2026:** Integration über [PR #461](https://github.com/tobiasfranziskus/Check/pull/461) als `main 83768ea0c64af27cb3dd6f86d67203198a40ea9a`, [Pages #44042542600](https://github.com/tobiasfranziskus/Check/actions/runs/44042542600) erfolgreich auf exakt diesem Codecommit. Nach Korrektur der beiden auf zwölf festgelegten Browser-Katalogasserts und Einbindung der neuen Mission als reguläres CI-Gate bestanden **drei vollständige Integrations-Workflows**, inklusive 512/512 Node22 und Chromium **sowie WebKit** jeweils 4/4 Touchgrößen mit vollständiger Flugprüfung, unverändertem normalem Karrierefluss, Altlektionen, Wirtschafts-/Speicher-/NAS-Kompatibilität. Bedingter Sicherheitsgeografietest skipped. Die folgenden ursprünglichen Draft-Lokalbefunde (WebKit-Download HTTP403, Karriere-Timeouts) sind historische Prüfgrenzen **des Drafts** und ersetzen nicht die spätere grüne Integrations-CI. Echtes iPad/NAS weiterhin offen; Vorversion `backup/main-before-p2-flugpruefung-20261117` gesichert.

## Historischer Draft-Nachweis

Basis: tatsächlicher `main c24da3cc0e5ccedb9516e6a53c032105caa8978a`, anschließend auf den ausschließlich dokumentarischen `main 1dd645cfaaeba5eca3f84b449b27788965b2ca90` nachgeführt. W6/P8h war bereits integriert. Kein Merge oder Deployment durch diesen Auftrag.

## Spielbarer Pfad

Normale Karriere → rechtmäßig Miner für 600 ISK kaufen → Flotte → Pilot übernehmen → Konzern → Pilotenakademie → **Flugprüfung – vom Dock zum sicheren Rückflug**.

1. Prüfung im Dock starten; regulär mit Original-Flugreserve abdocken (bestehende 40-Sekunden-Sequenz).
2. Etwas vom Dock wegfliegen, Station auswählen, **Autopilot: Anfliegen**; tatsächlich den Zielbereich erreichen. Alternativ ein vorhandenes Feld anfliegen.
3. Station/Feld und ausdrücklich Radius wählen, z. B. **120000 P**, Orbit starten. Mindestens 30 aufeinanderfolgende Core-Flugsekunden im Band `max(1200 P, 4 %)` und mindestens 0,3 rad Umkreisung. Ziel-/Radiuswechsel oder Orbitabbruch setzen das Halten zurück.
4. Knüppel übernehmen und tatsächliche Bewegungsrichtung gegenüber dem letzten Autopiloten-Vektor um mindestens 0,3 rad ändern. Drehen des Rumpfs oder ein Klick allein reicht nicht.
5. Ausgangsstation wählen, **Andocken**; erst die abgeschlossene Original-Docksequenz mit Stillstand und passendem Anker bestätigt 5/5.

Bestehende Live-Anzeige im Cockpit und Akademiestatus zeigen Etappe, Handlungsziel und bestätigten Fortschritt; beim Orbit zusätzlich Sekunden/Winkel. Fehlendes Schiff/Eigentum/Kauf, ungedeckte Reserve, Strandung, Schiff-/Systemwechsel, verfrühte Dockrückkehr und Beobachtungslücken sperren Start bzw. unterbrechen. Neustart nur wieder im Dock. Pause zählt keine Sekunden oder Umkreisung.

## Umsetzung und Dateigrenzen

Nur `prototypes/tutorial-pilot/akademie.js` als Produktänderung, drei neue gezielte Tests und dieser Bericht. Der vorhandene autoritative Beobachter und die vorhandenen Menüs/Live-Statusfelder tragen die Mission ohne neue Hostanbindung. Alle zwölf Lektionen bleiben in gleicher Reihenfolge erhalten. Keine Befehle/Buchungen/Belohnungen, keine zweite Simulation/Uhr, kein Save-Schema oder gespeicherter Akademiestand. Original-Core-Audit bei jeder Missionsbeobachtung; Beobachterzustand enthält keine Core-Referenzen.

Roadmap/Projektstatus bleiben wegen der ausdrücklichen Dateigrenze unangetastet. Bei unabhängiger Integration P1/P2 gezielt um die dreizehnte Lektion nachführen; kein neuer Wirtschaftsmeilenstein.

## Tatsächlich ausgeführte Prüfung

- Node **22.23.4**: fünf neue deterministische Missionstests, **5/5**, keine Fehler/Skips. Vollständige Original-Core-Mission zweimal mit identischem Hash; bytegleicher Replay ohne Akademie, Geld-/Schiffs-/Eigentums-/Save/Load-Audits, Weltgeld 33000 ISK, Mint/Burn 0. Neue Akademie nach Laden wieder bereit. Negative Fälle: falsche Reihenfolge, vorzeitiges Dock, Orbit-/Radiuswechsel, wiederholte Pause-Snapshots, Knüppelbefehl ohne Flug, Schiff-/Eigentumswechsel, ausgelassene Sekunden, fehlender Flugdienst, Strandung, manipulierte Kaufbelege. Unterfinanzierung durch tatsächlichen Lohnverbrauch bis zur anschließenden Startsperre im Dock hergestellt, keine Test-Geldschenkung.
- Vollständige Node22-Regression `node --test tests/*.test.mjs`: **512/512 bestanden**, 0 Fehler, 0 abgebrochen, 0 Skips, **541,6 s**. Enthält unveränderte Core-/Geld-/Waren-/Schiffs-/Eigentums-/Save-/Determinismusprüfungen einschließlich W6-13×90 und 365/730-Tage-Szenarien. Begonnen auf `c24da3c`, während des Laufs ausschließlich auf den dokumentarischen Folgecommit `1dd645c` nachgeführt; kein Produkt-/Testbyte dabei verändert.
- **Chromium 4/4**: vollständige neue Mission über normalen Karriere-Einstieg, tatsächlichen Kauf, Cockpiteingaben, Radiusfeld, Knüppelziehen und Hardwaretastatur, bestätigten Abschluss am Dock, Export/Originalaudit/Roundtrip, Pause, Reload ohne Unterrichtsfortschritt und Überlaufprüfung; **1180×820, 1024×768, 820×1180, 390×844**. Keine Seiten-JS-Fehler. Browserläufe hängen von der Wandzeit ab; gleiche Core-Befehlsfolge ist im Node-Test deterministisch geprüft.
- Bestehender Standalone-Akademie-Browsertest **Chromium 4/4** mit Dateiimport, bezahltem Abdocken, Handflug, Aufschalten/Lösen, Export und abgelehntem ungültigem Import. Bestehender gezielter Karriere-/Akademiepfad ebenfalls **Chromium 4/4**: Neue Karriere, Originalkauf, Pilotenwahl, Auswahllesson, bezahltes Abdocken mit Knüppelbewegung, Aufschalten/Lösen und flüchtiger Unterricht nach Reload. Alle zwölf Originallektionen zusätzlich durch neun unveränderte Node-Akademietests und die vorhandenen Integrationsprüfungen abgedeckt.
- **Negativbefund:** Der umfangreiche bestehende `p1-spielstart-browser.cjs`-Lauf erreicht beim NPC-Folgen-Schritt (Zeile 576) ein 30-Sekunden-Timeout. Kein grüner Gesamtlauf behauptet; Ursache nicht abschließend eingegrenzt und außerhalb dieser Produktdateigrenze nicht geändert. Kontrolllauf mit unveränderter Akademie aus `main` (HTTP-Testadapter liefert `git show HEAD:…/akademie.js` statt Arbeitsdatei) passiert den Folgen-Schritt und die kompletten bisherigen Pfade in drei Größen, scheitert jedoch in 390×844 an der Managerlektion „Bergbau beauftragen“ (Zeile 266, erwartetes ✓ fehlt). Auch der Basiskontrolllauf ist damit kein grüner Gesamtlauf.
- **WebKit nicht ausgeführt:** Browserstart scheitert am fehlenden `webkit-2336/pw_run.sh`. Separater Installationsversuch für WebKit 26.5 wird vom CDN mit **403 „Domain forbidden“** abgewiesen. Chromium-Download ebenfalls gesperrt; Chromium konnte über das bereits installierte Systembinary geprüft werden. Kein WebKit-Pass behauptet.
- Frühe Testanläufe: ungültige Testannahme zur Dockbeschriftung korrigiert (`Im Dock`); der ursprüngliche Unterfinanzierungstest verbrauchte zu viel Kapital und strandete vor dem Dock. Korrigierter Test erreicht mit realen Restmitteln das Dock. Der erste Gesamtregressionslauf mit diesem alten Test wurde nach belegtem Fehler beendet; nur der abschließende Wiederholungslauf zählt als Gesamtabnahme.

## Reproduktion / Integration

```sh
node --test tests/*.test.mjs
node tests/p2-flugpruefung-browser.cjs
WELT_BROWSER=webkit node tests/p2-flugpruefung-browser.cjs
P2_REGRESSION_SUITE=standalone TUTORIAL_BROWSERS=chromium node tests/p2-akademie-regression-browser.cjs
node tests/p2-akademie-regression-browser.cjs
P2_REGRESSION_SUITE=full node tests/p2-akademie-regression-browser.cjs
```

Browser: `PLAYWRIGHT_MODULE` bei externer Testinstallation setzen; `CHROMIUM_EXECUTABLE` optional. Neuer Regressionstestadapter übernimmt bestehende Szenarien, passt ausschließlich die feste Katalogzahl 12→13 an, nutzt System-Chromium und antwortet lokal mit HTTP 204 für das fehlende Favicon. Ohne `full` führt er gezielt den vorhandenen Karriere-Akademiepfad in vier Größen aus. Keine bestehende Testdatei verändert, keine Assertions zu Core-Erfolg abgeschwächt.

**Offen:** WebKit-Matrix, Aufklärung des vollständigen Karriere-Browsertimeouts, echtes iPad Safari, privates NAS und weitergehende Hintergrund-/Orientierungs-/Zoommatrix. Statisches lokales HTTP ist kein Pages- oder NAS-Nachweis. Keine produktive Wirtschafts-/W6-/Karrierehauptmenü-/RAUM-Datei ändern. Die bisherigen Browser-Runner erwarten hart zwölf Karten; bei Integration die CI auf den neuen Adapter umstellen oder diese Katalogassertions separat autorisiert auf 13 nachführen. Bestehende Tests/Workflows sind hier gemäß Dateigrenze unverändert. Unabhängige ChatGPT-Prüfung und Integration bleiben erforderlich; kein Merge oder Pages-Deploy.
