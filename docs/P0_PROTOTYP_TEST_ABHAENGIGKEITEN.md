# P0 – Prototyp- und Test-Abhängigkeitsinventur

**[ANALYSE / 15.11.2026]** Quellstand: [main d2db8850](https://github.com/tobiasfranziskus/Check/commit/d2db8850aac71ca954606284a7925a36a804b727). Rekursiver Git-Tree: **342 Dateien** (381 Tree-Einträge einschließlich Verzeichnissen); davon **115 in `prototypes/`**, **110 in `tests/`**, **87 in `docs/`**, 7 Workflows und 13 Dateien in `tools/`. Kein Lösch-/Merge-/Deployauftrag; die einzige Roadmap bleibt [ROADMAP.md](ROADMAP.md).

## Tatsächliche Browser- und Build-Einstiege

| Pfad | Nachgewiesener Zusammenhang |
| --- | --- |
| `index.html` | Generierte öffentliche Root-Einzeldatei; Links zu `prototypes/spiel/index.html` (Karriere), `prototypes/j4c/index.html` (Jäger) und `prototypes/verbund/konzern.html` (Konzern). Bestehende Zugänge schützen. |
| `aphros-void.html` | Separate generierte NAS-Einzeldatei ohne zusätzliche Webassets. Beide Root-Dateien müssen `scripts/build-w5-singlefile.mjs --check` bestehen. |
| `prototypes/w5ag/index.html` | Original-Buildquelle: **7 CSS + 15 JS**. Dazu `legacy-corporation/corporation.css` und `legacy-station/station.css` explizit als Shadow-CSS in den Einzeldatei-Build eingebettet. Benötigt Module aus `w5u`, `w5w`, `w5y`, `w5aa`, `w5ab`, `w5ac`, `w5ag` und Legacy-Komponenten. |
| `prototypes/spiel/index.html` | **2 CSS + 19 JS**, darunter `w5ac/rule191-w5-ferry-core.js` und `session.js`, `legacy-hub/core-adapter.js`, `flug2d/flug-kern.js`, fünf `welt/`-Core-Dateien, `verbund/kompatibilitaet.js` und `konzern-session.js`, `j4c/flotten-wechsel.js`, drei `raum/`-Dateien und vier eigene `spiel/`-Skripte. |
| `prototypes/j4c/index.html` | Öffentlicher Jäger-/Trainingspfad mit **1 CSS + 17 JS**; lädt `f8-jaeger/f8-treffer.js` und `f8-duell.js`, J4C-Steuerung, `j6w/wirtschaft.js`, Welt- und Raumkern. |
| `prototypes/verbund/konzern.html` | Öffentlicher Konzernpfad mit **1 CSS + 15 JS**; inklusive `jaeger-werft-lage.js`, `konzern-session.js`, `konzern-ui.js` und `j6w/wirtschaft.js`. |
| `prototypes/verbund/index.html` | Vom Jäger-/Konzernpfad verlinkter Regel195→204-Prüfeinstieg; lädt `kompatibilitaet.js`, `pruefung-ui.js` und originalen Core. |

Diese Kanten wurden aus den HTML-`script[src]`-/Stylesheet-Links und dem Build-Skript **auf dem angegebenen main** ermittelt. Ein tief verlinktes HTML kann von Spielern weiterhin genutzt werden, auch wenn es nicht in der Root-Navigation steht.

## Schutz-/Archivierungsmatrix nach Verzeichnis und Funktion

| Gruppe | Status | Grund / Grenze |
| --- | --- | --- |
| `spiel/`, `raum/`, `welt/`, `flug2d/` | **[MAIN] LAUFZEIT – SPERREN** | Karriere, Schiffssteuerung/Touch, Kern, Geld/Waren/Eigentum, Save/Load. Keine Verschiebung. |
| `j4c/`, `f8-jaeger/`, `j6w/` | **[MAIN] ÖFFENTLICH + TEST – SPERREN** | Jägerpfad nutzt F8-Trainingsduell und Wirtschaft. Das beweist **keinen** echten, voll finanzierten P4-Piratenkampf. Beispiel-JSON und QA-Helfer behalten. |
| `verbund/` | **[MAIN] + PRÜFUNG – SPERREN** | Konzern-/Kompatibilitäts-/Sitzungsfunktionen öffentlich; zusätzlicher Prüfpfad. |
| `w5ag/` | **[BUILD] – SPERREN** | Erzeugt beide Root-Einzeldateien einschließlich Miner- und Speichereinbindung. |
| `w5ac/` | **[MAIN] + [BUILD] + TEST – SPERREN** | Regel191-Kern und Session in Karriere und Build; Style/Extension im Root; historische HTML/Bootstrap weiterhin regressionsrelevant. |
| `w5u/`, `w5w/`, `w5y/`, `w5aa/`, `w5ab/` | **GEMISCHT – JE DATEI PRÜFEN** | Styles, `w5u/ship-graphics.js`, `w5w/app.js` und W5-Erweiterungen bauen weiterhin das Root-Spiel. `original-*-core.js`, Sessions, Bootstrap und Standalone-HTML sind teils konkrete Testreferenzen. Kein komplettes Verzeichnis verschieben. |
| `w5x/` | **[TEST/DEMO] – SPÄTERER ARCHIVKANDIDAT** | Nicht aus den geprüften öffentlichen Einstiegen geladen, aber `tests/w5x-finanzierte-w2-konzerne.test.mjs` benötigt Original-W2, Session, HTML und Bootstrap/Extension. |
| `legacy-corporation/`, `legacy-station/` | **[BUILD] + LEGACY-TEST – GEMISCHT** | `corporation.js`, `station.js` und beide CSS-Dateien bleiben Root-Build-Abhängigkeiten. `demo.js`, `preview.js` und HTML dienen eigenen UI-Tests. |
| `legacy-hub/` | **[MAIN-ADAPTER] + DEMO – GEMISCHT** | `core-adapter.js` ist produktiv eingebunden. `hub.js`, `core-preview.js`, Demo-HTML/CSS sind eigenständige Altoberflächen mit Browserchecks. |
| `legacy-fitting/`, `legacy-pilot/`, `legacy-mining-scanner/` | **[FUNKTION + TEST] – ERHALTEN** | Lesende UI/Touch-Prototypen, z. T. durch Legacy-Hub verknüpft. Fitting, Pilotenentwicklung, Scanner sind **nicht** als vollständig an den gegenwärtigen autoritativen Karriere-Core gebunden nachgewiesen. Tests und mögliche P2/P4-Wiederverwendung erhalten. |
| `spieltest/w5-rc1/` und `versionen/` | **[ARCHIV/TEST] – ERHALTEN** | Altversionen und Referenz-Einstiege sind in `w5rc1-preservation`, `w5singlefile`, `start-smoke` und W5-Tests verankert. |

**Noch nicht übernommene Funktionen:** P2-Orbit, Aufschalten und **Folgen mit neuer Abstandseinstellung** bleiben getrennte Produktziele. Im alten Void Echoes existierte **keine** Folgen-Abstandseinstellung, siehe [Quellkatalog](VOID_ECHOES_CODEKATALOG.md). P4 benötigt für echten Kampf gesondert finanzierten Schaden, Reparatur und Rechte; die F8-Trainingsgeometrie allein erfüllt das nicht. Für W6 sind [#408 Regel205](https://github.com/tobiasfranziskus/Check/pull/408), [#412 Regel206](https://github.com/tobiasfranziskus/Check/pull/412) und [#415 Regel207](https://github.com/tobiasfranziskus/Check/pull/415) **[DRAFT]**, nicht in main; Branches und Nachweise unangetastet.

## Konkrete Testabhängigkeiten

- `.github/workflows/w5rc1-preflight.yml` startet `node --test tests/*.test.mjs` und den bytegenauen Root-/NAS-Buildcheck; `ui-regression.yml` prüft zusätzlich historische Referenzsimulationen.
- Aktuelle Spielerpfade: `tests/p1-spieleinstieg.test.mjs`, `p1-spielstart-browser.cjs`, `raum-szene.test.mjs`, `raum-cockpit-browser.cjs`, `j4e-oeffentlicher-spieltest.test.mjs`, `j11-frachter.test.mjs`, `j14-pilot-relogin-*`, `w6-p8a-*`; entsprechende CI-Jobs unter `p1-spielstart.yml`, `j4e-public-smoke.yml`, `j14-pilot-relogin.yml`, `w6-p8a-silicon-status.yml`.
- Historische Kernreihen: `tests/w5u-session.test.mjs`, `w5w-funded-w1-hub.test.mjs`, `w5x-finanzierte-w2-konzerne.test.mjs`, `w5y-original-w3-freight.test.mjs`, `w5aa-original-w4-refinery.test.mjs`, `w5ab-finanzierter-schiffbau.test.mjs`, `w5ac-frachterueberfuehrung.test.mjs`, `w5rc1-preservation.test.mjs`.
- Legacy: `tests/legacy-fitting-preview.test.mjs` baut Pfade mit `new URL('../prototypes/legacy-fitting/', import.meta.url)`; `legacy-hub-touch.py`, `legacy-pilot-touch.py`, `browser/legacy-mining-scanner.cjs`, `legacy-corporation-touch.cjs` und `legacy-station-touch.cjs` öffnen die alten HTML-Einstiege über HTTP. **Suche nur nach vollen Dateinamen wäre unvollständig.**

## Wiederholbarer statischer Schutzcheck

`node scripts/p0-prototype-deps.mjs --json` inventarisiert alle getrackten Prototyp-Dateien und klassifiziert konservativ als `LIVE`, `BUILD`, `TEST_PINNED`, `DEMO_REVIEW`, `MANUAL_REVIEW`. `--check` prüft direkt eingebundene lokale HTML-/CSS-Ressourcen, den bekannten Einzeldatei-Build-Eingang, die zwei Shadow-CSS-Quellen und zentrale Laufzeitmodule. `tests/p0-prototype-deps.test.mjs` kontrolliert diese Invarianten mit Node22.

**Reichweite:** Statischer Direktgraph und wörtliche/Verzeichnis-Testreferenzen, **kein** vollständiger JS-Callgraph. Dynamische DOM-/`fetch`-Pfade, durch Code zusammengesetzte Dateienamen, externe Deep Links, Branches und implizite UI-Verträge können fehlen. `MANUAL_REVIEW` oder `DEMO_REVIEW` bedeutet **niemals „sicher löschbar“**. CI- und Browsertests gelten erst nach tatsächlicher Ausführung als bestanden.

## Empfohlenes nächstes P0-Paket (separater PR)

1. Öffentliche HTML-Einstiege, Buildquellen, Welt-/Flugcore, Testdaten und Versionen unverändert **behalten**.
2. In einer kleinen Archiv-PR zuerst ausschließlich eigenständige **Legacy-Demo-Einstiege** (`legacy-fitting`, `legacy-pilot`, `legacy-mining-scanner`, `legacy-hub` **ohne** `core-adapter.js`) auf wirklich einzigartige Funktionen, relative Browser-URLs und nachfolgende Tests prüfen. Kein Entfernen von Fähigkeiten oder bestehenden Links.
3. Danach `w5x` und nur die nicht mehr gebauten **Einzeldateien** der alten W5-Stufen auf mögliche Archivierung prüfen, nicht ganze Ordner.
4. Vor jedem `git mv`: Backup-Commit, korrigierte Test-/Dokumentlinks, Node22-Gesamtsuite, `build-w5-singlefile.mjs --check`, Root-/Karriere-/Jäger-/Konzern-Smoke mit Chromium/WebKit in vier Touchgrößen, JSON/Save/Load, Hash-/Wirtschafts-Audits; Merge und Pages-Deploy separat prüfen.

**Dieser PR:** Inventur + read-only Prüfsystem + Node-Test. Keine produktive Mechanik, kein neuer Save-Stand, keine Migration, kein Archivieren/Löschen, kein Merge oder Pages-Deploy. Der aktuell über Pages ausgelieferte Commit wurde hier nicht unabhängig per Live-HTTP ermittelt.

## P0 Archiv-Batch 1: historische Legacy-Hub-Einstiegsseiten [MAIN / PAGES]

**Quell-main:** `d39899545c6ea6cbd5c30256ced4c03abd6a59c5` (Inventur #417 ist integriert). Der erste bewusst kleine Archiv-Batch verschiebt ausschließlich die **HTML-Inhalte** der zwei historischen Legacy-Hub-Oberflächen zu `prototypes/legacy-hub/archiv/index.html` und `prototypes/legacy-hub/archiv/core-preview.html`.

Die bisherigen öffentlichen URLs `prototypes/legacy-hub/` sowie `prototypes/legacy-hub/core-preview.html` bleiben als minimale statische Weiterleitungsseiten mit klickbarem Fallback bestehen. Die archivierten HTMLs benutzen `<base href="../">`, damit **alle bisherigen JS-/CSS-Assets** im ursprünglichen Verzeichnis beziehungsweise in den Nachbarmodulen bleiben. Das ist eine **Archivierung der zwei Einstiegsseiten**, ausdrücklich **keine Migration von Legacy-Funktionen**. Die Fitting-, Pilot-, Scanner-, Station-, Konzern-, Hub-, W0–W6-Core- und Testdateien werden nicht verschoben. Der ursprüngliche Altcode bleibt außerdem vollständig über Git-Commits wiederherstellbar.

**Validierungsvertrag:** `scripts/p0-prototype-deps.mjs --check` verarbeitet die HTML-Base-Pfade der archivierten Vorschau und verweigert fehlende Ressourcen. `tests/p0-legacy-hub-archive.test.mjs` schützt Weiterleitungs-URLs, Archivdateien und die Original-Core-/UI-Quellen. `tests/p0-legacy-hub-browser.cjs` navigiert über **beide Alt-URLs** zu beiden archivierten Demos, prüft Konzern/Fitting/Scanner sowie die JSON-gestützte lesende Core-Vorschau inklusive HTTP-/JavaScript-Fehlern. Der [`j4e-public-smoke`-Workflow #43769123236](https://github.com/tobiasfranziskus/Check/actions/runs/43769123236) hat diesen Browserpfad tatsächlich **in Chromium und WebKit mit je vier Touchgrößen erfolgreich** ausgeführt. Die komplette Node22-Regression und der bytegenaue Root-/NAS-Singlefile-Check bleiben erforderlich.

**[MAIN / PAGES / GEPRÜFT 15.11.2026]:** [PR #418](https://github.com/tobiasfranziskus/Check/pull/418) nach QA als `main 904653f605902806b5a1e89a670e52f738fbec85` gemergt. [Pages-Deploy #43769509725](https://github.com/tobiasfranziskus/Check/actions/runs/43769509725) getrennt für **exakt diesen SHA** `completed/success`. [Node22, Touch, NAS und Wirtschafts-Regression #43769123221](https://github.com/tobiasfranziskus/Check/actions/runs/43769123221), [Chromium/WebKit #43769123236](https://github.com/tobiasfranziskus/Check/actions/runs/43769123236) und [Referenz-CI #43769123211](https://github.com/tobiasfranziskus/Check/actions/runs/43769123211) erfolgreich; bedingter Sicherheitsgeografie-Gate `skipped`, nicht bestanden. Der ursprünglich fehlgeschlagene Chromium-Test wurde auf Commit `4970d184` ausschließlich durch korrektes Abwarten des fertigen Core-Imports repariert. [Vorversion als Backup](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p0-legacy-hub-archive-20261115). Keine weiteren Ordner-/Branchlöschungen, Hauptspiel und Nutzer-Saves unverändert; echte iPad-/NAS-Geräteabnahme offen.

## P0 Archiv-Batch 2 – Fitting- und Piloten-Demoeinstiege [MAIN / PAGES / 16.11.2026]

**Ausgangsbasis:** `main a0aa82249d4a8692f808da448f403d0815106232`. Nach dem ersten gesicherten Archiv-Batch #418 werden ausschließlich zwei eigenständige alte HTML-Startseiten aus `legacy-fitting/` und `legacy-pilot/` unter `archiv/index.html` eingeordnet. Die bisherigen URLs `/prototypes/legacy-fitting/` und `/prototypes/legacy-pilot/` bleiben durch eine sofortige HTML-Weiterleitung **mit anklickbarem Link-Fallback** erhalten. Die Archiv-HTMLs bekommen `<base href="../">`, sodass ihre CSS-/JS-Abhängigkeiten weiter aus den unveränderten Originalverzeichnissen geladen werden.

**Bewusst nicht angefasst:** Fitting-Modell/Examples/View und Pilot-API/Examples/Preview/CSS, `legacy-hub/core-adapter.js`, `legacy-mining-scanner/` (dessen aktueller Browser-Prüfserver nur vier fest freigegebene Dateinamen akzeptiert), W5x/W5ag, Root/NAS, Spieleinstieg, Spielstände, Geld-/Eigentumskern. Die ursprünglichen HTMLs sind im gesicherten Backup `backup/main-before-p0-fitpilot-archive-20261116` und der Git-Historie vollständig wiederherstellbar.

**Neues Prüf-Gate (noch keine Erfolgsbehauptung):** `tests/p0-legacy-pages-archive.test.mjs` schützt den Erhalt der alten URLs, Archivdateien, Originalassets und `p0-prototype-deps.mjs --json`. Der existierende Playwright-Runner `tests/p0-legacy-hub-browser.cjs` öffnet darüber hinaus **beide alten URLs** und prüft Archiv-Redirect, Modulwahl/Fittingvergleich, Pilotenwechsel/Skillfokus sowie 404-/JavaScriptfehler in **Chromium und WebKit je vier Touchgrößen** über den bestehenden `j4e-public-smoke`-Workflow. Node22-Gesamtsuite sowie Root-/NAS-Buildcheck werden über `w5rc1-preflight` auf dem PR-Head benötigt; keine Versionsmigration, kein Balancing. **Merge und Pages-Deployment gelten bis zu separat belegtem Ergebnis als OFFEN**; echter iPad-/NAS-Gerätetest ebenfalls offen.


**[MAIN / PAGES / GEPRÜFT 16.11.2026]** Dieser Batch ist durch [PR #449](https://github.com/tobiasfranziskus/Check/pull/449) als `main 055d96cb999edba01a990bd79917b3a37a7ab942` integriert; [Pages #43959376080](https://github.com/tobiasfranziskus/Check/actions/runs/43959376080) für genau diesen SHA `completed/success`. [Node22, Root-/NAS-Build, W5-Touch #43958318416](https://github.com/tobiasfranziskus/Check/actions/runs/43958318416), [Chromium und WebKit je vier Größen #43958319412](https://github.com/tobiasfranziskus/Check/actions/runs/43958319412) und [Wirtschafts-Regression #43958318219](https://github.com/tobiasfranziskus/Check/actions/runs/43958318219) bestanden; die auf `main` erneut laufende [Node22-Regression #43959377862](https://github.com/tobiasfranziskus/Check/actions/runs/43959377862) ebenfalls `completed/success`. Keine Produkt- oder Save-Änderung, iPad-/NAS-Echtgerät weiterhin offen.

## P0 Archiv-Batch 3 – W5x-Regel16-Forschungswelt [MAIN / PAGES / 16.11.2026]

**Konkret begrenzte Archivierung:** Ausschließlich `prototypes/w5x/index.html` (historischer Demoeinstieg) wird inhaltlich nach `prototypes/w5x/archiv/index.html` verschoben. Der Original-Deep-Link `prototypes/w5x/` erhält eine einfache HTML-Weiterleitung mit klickbarem Fallback. Die archivierte HTML-Seite nutzt `<base href="../">`, sodass ihre ursprünglichen CSS-/JS-Referenzen vom unveränderten W5x-Verzeichnis aus aufgelöst werden. Ein eigener Node22-Test, der angepasste vorhandene Regel16-Test und Chromium/WebKit-Touchtests der alten URL schützen diesen Vertrag.

**Kritischer Schutz:** `original-w2-core.js` (unveränderter Regel16-Core und SHA256-Quellslice), `session.js`, `extension.js`, `bootstrap.js`, `style.css` und alle originalen W5w-/Legacy-Quellen bleiben byteidentisch und unter denselben Pfaden. `tests/w5x-finanzierte-w2-konzerne.test.mjs` mit **13 Seeds × 90 Tagen**, unabhängigen Geld-/Waren-/Käufer-Audits, endlichem Absatz, Save/Load und Negativfällen bleibt unverändert für die Kernprüfungen; nur sein HTML-Vertragsabschnitt wird für das Archivziel angepasst. Die bestehende Touchprüfung `tests/w5x-touch.py` wird um Weiterleitungsprüfung ergänzt; die beiden CI-Browser überprüfen vier Größen mit echtem Original-Audit und zwei bezahlten NPC-Minern. **Kein** neuer W2-Verkäufer, Gratisgeld, Player-Save, Core-Mechanismus oder Wirtschaftssystem.

**Freigabe-Gate:** Vor Merge Node22-Gesamtsuite, Root-/NAS-Buildcheck, W5x-Chromium-Touchprüfung sowie Chromium/WebKit je vier Touchgrößen über `j4e-public-smoke` nachweisbar grün. Vorversion auf `backup/main-before-p0-w5x-demo-archive-20261116` sichern; Merge und GitHub-Pages-Deploy separat prüfen. Im historischen PR-Entwurf zunächst [DRAFT]; nach bestandener Abnahme [MAIN/PAGES], siehe nachfolgenden Release-Beleg. Echte iPad-/NAS-Gerätetests offen.

**[MAIN / PAGES / GEPRÜFT 16.11.2026]** [PR #450](https://github.com/tobiasfranziskus/Check/pull/450) nach dem korrigierten Code-/Test-Head `40186064d75a89069fed2fdc0ee0dbf77a5691f2` als `main 0245aba2e63274778bb3d373c1cb903eb8a47306` integriert. [Pages #43969493021](https://github.com/tobiasfranziskus/Check/actions/runs/43969493021) `completed/success` **für genau den Main-SHA**. [Node22-Gesamtsuite, W5x-Chromium-Touch, Original-W5/NAS-Build #43968388741](https://github.com/tobiasfranziskus/Check/actions/runs/43968388741), [Chromium/WebKit inklusive W5x-Alt-URL je vier Touchgrößen #43968388821](https://github.com/tobiasfranziskus/Check/actions/runs/43968388821) und [Wirtschaft/13×90 #43968388820](https://github.com/tobiasfranziskus/Check/actions/runs/43968388820) alle erfolgreich; nur historisch konditionaler Sicherheitsgeografie-Job `skipped`. Beim ersten P0-Browserlauf [#43967553407](https://github.com/tobiasfranziskus/Check/actions/runs/43967553407) schlug ein **neuer Testselektor** fehl, weil das unveränderte W5x-Original seine Tabellenzeilen ohne explizites `tbody` erzeugt; ausschließlich dieser Test wurde repariert, danach beide Browser grün. Vorversion: [Backup](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p0-w5x-demo-archive-20261116). Kein Core-/Save-/Finanzierungswechsel, keine NAS-Auslieferung. Hardwareabnahme offen.

## P0 Aktualisierung der Schutzinventur · 23.11.2026 [ANALYSE / DRAFT]

**Basis:** Main `d824040e20e0f9a69188cbe34282901ed6497976`, vollständiger Git-Tree mit 548 Einträgen, davon 495 Dateien, 141 unter `prototypes/`, 180 unter `tests/` (inklusive Hilfs-/Nachweisdateien), 134 unter `docs/`, zehn CI-Workflows. Gegenüber der ursprünglichen Inventur sind 26 Prototyp- und 70 Testverzeichnis-Dateien hinzugekommen. Alte Inventurabschnitte sind historische Momentaufnahmen, keine aktuellen Feature- oder Freigabeaussagen.

### Direkt nachgewiesene HTML-Abhängigkeiten

| Einstieg | JS | CSS | Schutzgrund |
| --- | ---: | ---: | --- |
| `prototypes/spiel/index.html` | 37 | 4 | Reguläre Karriere; sämtliche 16 Dateien in `spiel/` sind Einstieg oder direkt eingebundene Assets. Manager-Karte, Flotte, Disposition, Auftragsfeedback, beide Akademien sowie Welt-/Raumcore. |
| `prototypes/j4c/index.html` | 17 | 1 | Jägertraining, weiter mit regulärem Root verlinkt. |
| `prototypes/verbund/konzern.html` | 15 | 1 | Frühere öffentliche Konzernansicht. |
| `prototypes/verbund/index.html` | 8 | 0 | Vom Jäger- und Konzernpfad verlinkte Kompatibilitätsprüfung; `pruefung-ui.js` schützen. |
| `prototypes/tutorial-pilot/index.html` | 23 | 2 | Separat erreichbare Pilotenseite; explizit in `tests/tutorial-pilot-browser.cjs` für Chromium/WebKit geöffnet. |
| `prototypes/w5ag/index.html` | 15 | 7 | Buildquelle beider Einzeldateien, zusätzlich zwei Legacy-Shadow-CSS. |

Die sechs HTML-Dateien und `scripts/pages-entry.html` wurden auf dem gepinnten SHA gelesen, relative script/src-, stylesheet/href- und a/href-Ziele gegen den vollständigen Git-Tree geprüft: **kein fehlendes Ziel** in diesen sieben Quellen. Der direkte, deduplizierte Schutzumfang umfasst 54 Prototypdateien für fünf Karriere-/Nebenpfade (einschließlich HTML) und 25 für den Build (einschließlich Quelle/Shadow-CSS), drei Überschneidungen, insgesamt **76 verschiedene Prototypdateien**. Der übrige Bestand von 65 Dateien ist **nicht** als entbehrlich klassifiziert. Kein vollständiger JS-/CSS-Transitivgraph, keine Ausführung des Inventurskripts in einem vollständigen Checkout, keine Aussage über alle dynamischen Pfade, externe Deep Links oder sämtliche Testverweise.

### Schutzlücke und technischer Fix im Draft

Der bisherige `scripts/p0-prototype-deps.mjs` führte die Kompatibilitäts- und eigenständige Piloten-HTML ausschließlich im Demo-Graph, obwohl die eine verlinkt und die andere tatsächlich in einem Browsertest geöffnet wird. Der Draft ergänzt beide explizit zur Liste geschützter öffentlicher Einstiege, sowie neun zusätzliche erforderliche Module aus Manager-, Akademie- und Kompatibilitätscode. `tests/p0-prototype-deps.test.mjs` verankert beide Einstiege und die neun Modulklassifikationen. Der bestehende W5-Preflight startet bei Änderungen unter scripts/tests die vollständige Node22-Suite und den bytegenauen Singlefile-Buildcheck. **CI des neuen Drafts erst nach tatsächlicher Ausführung bewerten.**

### Archivierungskandidaten – Entscheidung

- Legacy-Hub, Fitting, Pilot und W5x: vorhandene Weiterleitungs-/Archivverträge beibehalten; Node- und Browserprüfungen referenzieren die Original-URLs und Archivziele.
- Mining-Scanner, Konzern- und Stations-Demo: die drei Original-HTMLs und zugehörigen CSS/JS bleiben unter den bisherigen URLs. Ihre Browser-Testserver bedienen die entsprechenden Verzeichnisse. Konzern/Stations-JS und CSS bleiben außerdem Buildquellen.
- W5x: der originale W2-Core, Session, Bootstrap, Extension, HTML-Weiterleitung und Archiv-HTML werden konkret im Regel16-Test gelesen. Nicht entfernen.
- Tutorial-Nachweisbilder (zwei PNGs) nicht als Laufzeitassets gezählt; mögliche Dokumentations-/Wiederverwendungsreferenzen noch separat prüfen. Nicht löschen.

**Abgrenzung:** Kein produktiver Code, Spielstand, Regel-, Hash- oder Buildquellenwechsel; keine Dateien verschoben/gelöscht, kein Merge, kein Deployment. Lokaler Git-Checkout war wegen fehlender GitHub-Netzwerkauflösung in der Prüfungsumgebung nicht möglich. Die statische Prüfung oben ist tatsächlich über die GitHub-Dateiinhalte erfolgt, keine vorgetäuschte Node-/Browserausführung. Nächstes P0-Paket: nach grünem CI eine separate filegenaue Prüfung der drei verbliebenen Legacy-Demo-Einstiege samt alten Testservern; Archivierung ausschließlich bei nachgewiesenem Nutzen und vollständigem Pfad-/Browsererhalt.

**[FOLGEANALYSE · 23.11.2026]** Die drei verbliebenen Legacy-Demoeinstiege sind nun im [konkreten Wiederverwendungskatalog](P0_LEGACY_MODULE_WIEDERVERWENDUNG.md) mit gepinnten Quellorten, tatsächlichen Build-/Adapteranschlüssen, API-Grenzen und Testverträgen dokumentiert. Alle drei Browser-Testserver besitzen feste Dateifreigabelisten. Konzern- und Stationskomponenten werden produktiv im klassischen W0–W5-Build gemountet; der Scanner bleibt lesende Demo. **Entscheidung: keine weitere reine HTML-Archivierung**, solange kein konkreter Nutzen nachgewiesen ist; stattdessen später gezielte Wiederverwendung in den vorhandenen Manager-/Stations-/Cockpitpfaden. Kein produktiver Code oder Testserver verändert.

## Integrationskandidat 24.11.2026 – neuer Root-Einstieg [DRAFT]

Basis `85a94f9eacf0d965cf45ca47862d4959e9ad81a6` (#615). Quell-Draft #589, Head `7f1528cbbda1e0e0820cd6bdedbfdd268aab7018`: drei PR-Workflows [JavaScript](https://github.com/tobiasfranziskus/Check/actions/runs/45187557156), [J4e](https://github.com/tobiasfranziskus/Check/actions/runs/45187556821) und [W5](https://github.com/tobiasfranziskus/Check/actions/runs/45187556665) completed/success auf dem **alten** Quellstand. Git-Compare: 50 seit alter Basis auf main geänderte Dateien, keine Überschneidung mit den vier P0-Quelldateien. Der aktuelle Root-Einstieg nutzt `scripts/pages-entry.html`, eingebettet in die generierte Root-Datei; relativer Redirect auf Karriere bei leerem Fragment und drei statische interne Pfade. Der Schutzcheck löst die Links relativ zur Root-Datei auf, schützt Redirect-Ziel und Alternativen; der bestehende Singlefile-Buildcheck bleibt erforderlich. Die 65 zuvor nicht direkt geschützten Prototypdateien bleiben konservativ erhalten; neue Inventurzahlen erst aus tatsächlichem Lauf. Keine Änderungen an Produktdateien, Saves oder Regeln. Neue gemeinsame CI und Node-/Browserabnahme offen.
