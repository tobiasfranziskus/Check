> **[HISTORISCHER NEGATIVNACHWEIS / Abnahme-PR #349]** Dieser unveränderte Audittext bezieht sich auf den geprüften Integrationshead `aa41ed0` **vor** Korrektur der Blocker B1/B2. Stand 15.11.2026 auf dem Integrationsbranch: Es liegen Codekorrekturen für CSS-Einbettung und atomaren Import mit Sitzungswechselbestätigung vor; die daraus deterministisch erzeugten Root-/NAS-Dateien sowie Node22-/Chromium-/WebKit-Tests müssen noch vollständig auf dem endgültigen Head ausgeführt werden. **Keine nachträgliche Umdeutung der damaligen Bewertung „blockiert“.** 

# J4e: unabhängige Release-Abnahme

**Bewertung: BLOCKIERT für Integration nach main.** Die Wirtschafts-, Flug- und Save-Prüfungen liefern positive Nachweise. Das harte Kriterium „keine fehlenden Dateien“ scheitert im Root. WebKit ist nicht ausgeführt; die drei CI-Läufe des Integrationsheads sind bislang nur eingereiht. Außerdem verwirft ein ungültiger Jägerimport die laufende ungesicherte Sitzung. Keine Produktreparatur, kein Merge, kein Deployment, kein NAS-Zugriff durch diese Abnahme.

## Prüfbasis und Umfang

Prüfung am **14.11.2026 UTC** (Branchname auftragsgemäß mit Datum 20261115).

- Repository: https://github.com/tobiasfranziskus/Check
- Tatsächlicher `main`: `5d4194f275fccd0e0c8dae4e176653ed9ae275e8`.
- PR [#348](https://github.com/tobiasfranziskus/Check/pull/348): offen, Draft, Basis main; tatsächlicher Integrationshead **`aa41ed05745db4b2bf44b12ca5092f3c90ca46d9`**, entspricht Auftrag. Vor Arbeitsbeginn über Connector und Git-Fetch geprüft.
- Eigener Branch: `audit/j4e-public-release-qa-20261115`, Basis exakt dieser Integrationshead.
- Gelesen: AGENTS.md, ROADMAP, PROJEKTSTATUS, J4e-Forschungsbericht, betroffene Module, vorhandene Tests/Workflow. Historische Aussagen wurden nicht als aktuelle Freigabe übernommen.
- #348 umfasst gegenüber main **23 Dateien, 7.639 Hinzufügungen, 7 Löschungen**. Die im PR-Text genannten 413 Commits sind kein entsprechender Produktdateiumfang.
- Diese Abnahme fügt ausschließlich die beiden erlaubten Testdateien und diesen Bericht hinzu. Wirtschaftskern, Produktcode, Referenzen, Speicherformate, Roadmap und Workflows bleiben unverändert.

## Ausgeführte Prüfungen

Node **22.23.4**, Playwright **1.62.1**, vorinstalliertes Chromium **154.0.8037.57**, statischer HTTP-Testserver auf Loopback, frische isolierte Browserkontexte. Keine vorhandenen Nutzer-Spielstände angefasst. Der Netzwerksandbox-Zugriff auf Git und Browserprozesse erforderte Ausführung außerhalb der lokalen Prozesssandbox; dies ist keine Produktfreigabe.

| Prüfung | Tatsächliches Ergebnis |
| --- | --- |
| Ursprüngliche Gesamtsuite `node --test tests/*.test.mjs` | **41/41 Testdateien**, 0 Fehler/Skips, 237.677 ms. Der Runner meldet Dateiaggregate; keine Behauptung von 41 einzelnen Assertions. |
| Abschließende Gesamtsuite einschließlich neuer Testdatei | **42/42 Testdateien**, 0 Fehler/Skips, 189.172 ms, Exit0. |
| Neue unabhängige Abnahme direkt `node tests/j4e-release-abnahme.test.mjs` | **16/16 Einzeltests**, 0 Fehler/Skips: Referenz/physische Waren, 12 Manipulationen, ungültiges JSON, Seeds42/7 mit Replay und Roundtrip. |
| Vorhandene J4b/J4d/J4e-Tests aus #346 gegen Integrationsmodule | **3/3 Testdateien**, 0 Fehler/Skips, 110.609 ms. Keine Forschungsproduktmodule unterschoben; siehe Reproduktion unten. |
| Vorhandene J4b-/J4d-Tests direkt | **6/6** bzw. **4/4 Einzeltests**, jeweils 0 Fehler/Skips. |
| Vorhandener J4e-Duelltest direkt | **4/4 Einzeltests**, 0 Fehler/Skips, Seeds42/7, Sieg, Niederlage, Rückkehr, ungültige Trainerzustände. |
| Singlefile-Generator `--check` | erfolgreich: 320.217 Zeichen, 7 Styles, 15 Scripts, Pages-Navigation vorhanden. |
| Vorhandener Chromium-Duelltest | **4/4 Touchdurchläufe** erfolgreich; Root → Beispiel → echtes Abdocken → Duell-Anflug/Ausrichten/Schuss → geprüfter JSON-Download. |
| Neuer Chromium-Sicherheitsbrowser | **4/4 funktionale** Patrouille/Handflug/Rückkehr/Save/Import/IDB-Proben, jeweils Tick22366/Hash `f75f7dbc72ca7f11`; Gesamtprüfung wegen CSS-404 **fehlgeschlagen** (Details unten). |
| WebKit | **0/4 ausgeführt**, Browser fehlt; Startversuch Exit1, Installationsversuch HTTP403 „Domain forbidden“ von cdn.playwright.dev. Kein bestandenes WebKit-Gate. |
| Echtes iPad Safari / privates NAS / öffentliche Pages-Neufassung | **nicht geprüft**. Lokaler statischer HTTP-Test ist kein Geräte- oder Deploymentnachweis. |

Die neue Node-Datei wiederholt weder Regel195-Speicherhüllenprüfungen noch Archiv-/Root-Tests: diese laufen mit `regel195-storage`, `w5singlefile`, `w5rc1-preservation` und der bestehenden Gesamtsuite. Der neue Browser ergänzt gezielt die bisher fehlende Patrouille und den browserübergreifenden Datenbankschutz. Der alte Duellbrowser zählt HTTP-Fehler nicht mit; sein Erfolg widerlegt den CSS-Befund nicht.

## Referenzen, Produktion und Eigentum

Öffentliches Seed42-JSON: SHA256 **`e93d504f49c3cc5cdd78a2320d8d5de23eb2b8e22955a9de953b1a2699c1a800`**, Regel204/Schema8, Tick **22355**, Corehash **`daec00c7618a6cd7`**, 23 Schiffe, RNG42. `save(load(json))` ist bytegleich. Die vollständige Wiedererzeugung über den vorhandenen Finanzierungshelper und reguläre Bau-/Kauf-/Übernahmebefehle ergab für Seed42 **bytegleich die öffentliche Datei**; Seed7 wurde getrennt erzeugt. Physische Waren wurden unabhängig aus sämtlichen Stationslagern und Schiffsladungen summiert und für jede Ware mit `initial + mined + produced + imported − consumed − exported` verglichen.

- Jäger `sh023`: Eigentümer `house`, Nadir, angedockt, 900-ISK-Kaufbeleg, kein anfänglicher Jägerbestand. Jäger-Ledger: initial0, produced1, consumed1, imported/exported0.
- Vor Bau/Kauf: acht Bauteile, vier Material; Spielerkasse2489, Nadir4184, 22 Schiffe. 32 echte Werftminuten von22323 bis22355, 32 ISK aus Nadir über Arbeitstreuhand an `j4_jaeger_arbeiter`. Anschließend Spielerkasse1589, Nadir5052: **2489−900=1589**, **4184−32+900=5052**.
- Vorhandene J4b-Prüfungen laufen die gesamte bezahlte Beschaffungs-/Produktionskette mit Seeds42/7 erneut, einschließlich Ablehnung von Hüllenkauf vor Fertigstellung, Fremdeigentum, unterfinanzierten Aufträgen und kostenloser Zusatzparameter.
- Gesamtweltgeld **33000**, `minted=0`, `burned=0`; keine neue Geldquelle durch Training. Ein Guthaben anderer Eigentümer wurde nicht als Spielerkapital behandelt.
- Original F6 aus `prototypes/flug2d/flug-kern.js`, gleicher Weltzustand und 60 Teilschritte je Wirtschaftsminute. 40 ISK Flugreserve aus Spielergeld, tatsächlich bezahlter Pilotendienst, verbrauchter Rest zurück nach Dock, Buchwert sinkt durch reale Nutzung.

| Deterministische Probe | Seed42 | Seed7 |
| --- | --- | --- |
| Regel204-Neustart nach120 Originalsekunden, zweimal unabhängig erzeugt + Save/Load | `da262ca402798fbe` | `519fa590d3479893` |
| Vollständige Produktion + Kauf, Regel204 Tick22355 | `daec00c7618a6cd7` | `afaf668fa1f0076c` |
| Vollständige bezahlte J4e-Kette, drei Treffer, zwei Gegentreffer, Rückkehr Tick22366 | `f36dce70abb376af` | `b714ec3fe6ed9c1b` |

Beim letztgenannten Duell: Pilot48/96 Trainings-HP, Ziel0/135, 11 ISK tatsächlicher Fluglohn, Jägerbuchwert897 ISK, Weltgeld33000. Jeder Trainingsschuss lässt den Original-Welthash unverändert; nur die folgenden echten Flugsekunden erzeugen Kosten/Verschleiß. Trainingsniederlage belässt das rechtmäßige Schiff und ermöglicht bezahlte Rückkehr. Kein Kopfgeld, XP, Beute, reales Reparaturgeschäft oder kostenloser wirtschaftlicher Schadenersatz. F8-Journal/Trainings-HP fehlen absichtlich im exportierten Welt-JSON; Training ist nach Reload nicht fortsetzbar.

## Save-/Import- und Archivschutz

Positiv: öffentliches Beispiel regulär validiert, Welt-JSON Export/Load, laufender Flug mit Dienstkonto speicherbar, Browserdownload erneut importiert und bytegleich exportiert. Regel204 liegt im Arbeitsspeicher und in ausdrücklich exportierter JSON-Datei, **nicht in einem eigenen IndexedDB-Autosave**. Die Oberfläche weist auf manuellen Export hin. Getrennt von Regel195; keine stille Migration.

Negativ: Mint, Burn, zusätzliches Geld, ausgeglichene unrechtmäßige Eigentümerumbuchung, falscher Schiffeigentümer, kostenloser Kaufbeleg, falscher Werftlohn, zusätzliche Ware, Zusatzschiff, Regel205, Regel195 und Schema99 sowie kaputtes/leeres JSON werden abgewiesen. Browser: manipuliertes JSON mit Kaufpreis0 verworfen; danach kein Export eines ungeprüften Weltstands möglich. Einschränkung: dabei geht auch die zuvor valide Sitzung im Arbeitsspeicher verloren (B2).

Im Browser wurden alle bestehenden IndexedDB-Datenbanken/Stores nach Root-Initialisierung aufgenommen, zusätzlich ein eigener Legacy-Sentinel angelegt. Nach Navigation, Flug, gültigem und ungültigem Import sind Inhalte vollständig gleich. Die alten Regel195-Daten werden nicht überschrieben. Das beweist den getesteten Ablauf im isolierten Kontext, nicht beliebige fremde Datenbankformate.

NAS-Einzeldatei `aphros-void.html` identisch zu main: Gitblob **`76f2a07056c6cdf2783f9b7b355e74c46381639e`**, SHA256 **`91be09d5d282c94da516431adafb17e3e3ee874fd140778bd2ac7256405ec9db`**. Root weicht nur durch genau eine Spielmodi-Navigation ab. Historische Archive unverändert gegenüber main: `main-pre-w5-20261110/index.html` Blob **`b2ab84d5c7d5c177268fe750a6987abdc1825f78`**, `v0.12.5/index.html` Blob **`a2bcf5d2f9d3322c2a5edd4440eb77d094c84b9a`**. Keine NAS-Datei ersetzt.

## Browserbefunde und Lösungsvorschläge

Vier Touchgrößen je Runner: **1180×820**, **1024×768** (iPad quer), **820×1180**, **390×844**. Chromium-Duell alle vier mit Tick22360, Hash `8b1b0fcde3162f30`, Weltgeld33000, keine JS-Ausnahmen. Neuer Browser steuert drei Patrouillentore, Handflug, echte Rückkehr, positiven und negativen Import und IDB-Vergleich; Schuss-/Duelllogik wird im vorhandenen Runner geprüft.

**B1 – Root lädt zwei nicht vorhandene Stylesheets (Abnahmekriterium verletzt).** Reproduktion: statischen Server im Repository starten, `/` laden, Netzwerk beobachten. Requests auf `/legacy-corporation/corporation.css` und `/legacy-station/station.css` liefern404. Ursache: inlined Root-Komponenten behalten relative externe Stylesheetpfade. Dieselben Verweise sind schon in main vorhanden; deshalb **keine neu eingeführte J4e-Regression**, aber auch kein fehlfreier öffentlicher Einstieg. Lösungsvorschlag für gesonderten Produktauftrag: Singlefile-Komponenten verwenden bereits eingebettete Styles bzw. enthalten keine Laufzeitlinks auf nicht ausgelieferte Dateien; danach Root-/NAS-Singlefile und visuelle Komponentenprüfung wiederholen. Keine bloßen Dummydateien oder unterdrückten Netzwerkfehler als Behebung.

**B2 – fehlgeschlagener Import verwirft laufende Jägersitzung.** Reproduktion: Beispiel laden, fliegen, gültig exportieren, JSON-Kaufpreis auf0 setzen, importieren. Meldung „Laden abgebrochen“; anschließend Export → „Kein geprüfter Weltstand geladen“. `laden()` setzt im catch Weltzustand und Pilot auf null. Auch der Beispielknopf ersetzt eine bestehende Sitzung ohne Sicherungsbestätigung. IndexedDB/Originaldateien bleiben erhalten; unexportierter Fortschritt kann verloren gehen. Lösungsvorschlag: vollständig in temporärem Kandidaten validieren, erst bei Erfolg wechseln; bei Fehler bisherige Sitzung erhalten. Vor gültigem Austausch/Beispielneustart Sicherung bzw. ausdrücklichen Sitzungswechsel anbieten. Negativer Import muss anschließend den vorherigen Hash exportieren können. Keine Speicherformatänderung nötig.

**B3 – WebKit und CI-Gate offen.** Browserinstallation scheitert an geltender Netzfreigabe. In einer Umgebung mit freigegebenem Playwright-WebKit wiederholen; echte iPad-Safari-/NAS-Abnahme bleibt zusätzlich als Geräteprüfung offen. Kein Sicherheitsblock durch Abschalten von TLS oder Netzrichtlinien umgangen.

## Unabhängige Reproduktion

Im Auditbranch mit Node22:

```sh
node --test tests/*.test.mjs
node tests/j4e-release-abnahme.test.mjs
node scripts/build-w5-singlefile.mjs --check
CHROMIUM_EXECUTABLE=/usr/bin/chromium node tests/j4e-sicherheits-browser.cjs
WELT_BROWSER=webkit node tests/j4e-sicherheits-browser.cjs
node tests/j4e-duell-browser.cjs
WELT_BROWSER=webkit node tests/j4e-duell-browser.cjs
```

`PLAYWRIGHT_MODULE` unterstützt eine außerhalb des Produktrepos installierte Playwright-Version. `CHROMIUM_EXECUTABLE` ist nur für den neuen Runner vorgesehen. Für den vorhandenen Runner wurde außerhalb des Repos ein Adapter verwendet, der ausschließlich `chromium.launch` mit `/usr/bin/chromium` aufruft; alle Assertions bleiben unverändert. Neuer Sicherheitsrunner beendet sich wegen B1/B2 mit Exit1, auch wenn seine funktionalen Proben erfolgreich sind. WebKit beendet sich schon vor dem ersten Viewport.

Die im reduzierten Integrationsbranch fehlenden vorhandenen Forschungsprüfungen wurden vom unveränderlichen #346-Head **`882ac7cb562a5344b729a6aee6e46222a45043d6`** wiederverwendet:

1. `git fetch origin pull/346/head:refs/remotes/origin/audit-source-346`; SHA vergleichen.
2. In temporäres Verzeichnis `git archive <SHA> tools` entpacken. `tests/j4b-finanzierter-jaegerbau.test.mjs`, `tests/j4d-patrouille.test.mjs`, `tests/j4e-bezahltes-duell.test.mjs`, `tests/k13-f7-vorbereitung.cjs` und `prototypes/welt/j1-wirtschaftsaudit.cjs` mit `git show <SHA>:<Pfad>` dort ablegen.
3. Alle übrigen `prototypes`-Dateien mit Symlinks auf **diesen Integrationscheckout** verbinden. Kein Forschungs-Wirtschafts-/Flugmodul übernehmen. Die zusätzliche `j1-wirtschaftsaudit.cjs` ist ein lesender Testauditor.
4. Die drei `.test.mjs` mit Node22 ausführen; für Einzeltestzahlen zusätzlich jede Datei direkt mit Node starten. Keine Forschungsverzeichnisse in diesen PR kopieren.

Der Integrationsbranch enthält weiterhin keine allgemeine K1-13×90-/365-/730-Tage-Release-Matrix. Die vorhandenen W5-Langzeittests laufen in der Gesamtsuite, ersetzen aber **keinen langfristigen Regel204-Wirtschaftsnachweis**. Dieser Audit ändert keine Wirtschaftsregeln und behauptet keine W6-Stabilität.

## CI und Übergabe

Am Prüfzeitpunkt für `aa41ed0` alle **queued**, Conclusion null:

- [J4e #43652115625](https://github.com/tobiasfranziskus/Check/actions/runs/43652115625)
- [JavaScript #43652115594](https://github.com/tobiasfranziskus/Check/actions/runs/43652115594)
- [W5-RC1 #43652115586](https://github.com/tobiasfranziskus/Check/actions/runs/43652115586)

Die Workflow-Abfrage für den aktuellen main-SHA lieferte keine PR-Workflowläufe; daraus folgt kein grüner main-CI-Nachweis. Main und Integrationshead wurden vor Übergabe erneut per `git ls-remote` bestätigt. Keiner dieser eingereihten Läufe gilt als bestanden. Vor einer späteren Freigabe B1/B2 gezielt beheben und erneut abnehmen, WebKit vierfach ausführen und CI-Ergebnisse am tatsächlichen Integrationshead prüfen. Dieser Draft ist gegen den Integrationsbranch von #348 gerichtet, nicht gegen main. Kein Merge/Deploy aus diesem Bericht ableiten.
