# M4-U4 – UI-Relay und Pilotläufe A/B [DRAFT 25.11.2026]

Entwicklungswerkzeug auf Basis der [modularen Abnahme](M4_U4_KI_BLINDABNAHME.md), gestapelt auf #622. Kein Spielcode, keine Regel-/Save-Änderung. Anders als die vorhandenen Playwright-Funktionstests besitzt der Relay keine spielbezogenen Selektoren, Lösungsschritte oder Zugriff auf den Core. Technische Prüfung und Blindtester bleiben getrennt.

## Lokaler Start (Linux/macOS, Node22, im Checkout)

```sh
npm install --prefix /tmp/aphros-ui playwright@1.51.1
/tmp/aphros-ui/node_modules/.bin/playwright install chromium
export PLAYWRIGHT_MODULE=/tmp/aphros-ui/node_modules/playwright
git rev-parse HEAD
node scripts/m4-u4-ui-relay.cjs .
```

Optional CHROMIUM_PATH für ein vorhandenes kompatibles Chromium. Technische Testleitung vergleicht den bereitgestellten Produktbaum mit dem nachgewiesenen Pages-Stand. Lokaler HTTP-Server auf zufälligem Loopback-Port, frischer nichtpersistenter Browserkontext, keine Nutzerprofile. Nur statische Root-/Prototypdateien, externe Requests blockiert, keine DevTools-/JavaScript-/Netzwerkbefehle im Protokoll. Kein Zugriff auf Live- oder NAS-Saves. Der Screenshot wird lokal gespeichert; technische Testleitung übermittelt ausschließlich das Bild und das neutrale Ziel an den unabhängigen Tester. Keine Repo-Zugriffsrechte für den Tester. CLI ist keine Sicherheits-Sandbox für einen beliebig privilegierten lokalen Agenten.

Eine JSON-Zeile je Aktion auf stdin; Ausgabe jeweils ein JSON-Objekt mit Bildpfad, Runde und Zeit. 1180×820, JPEG, max. zwölf Aktionen und fünf Minuten, begrenzte Wartezeiten; bei Dialog-/Werkzeugfehler als Infrastrukturblockade abbrechen. Native Browserdialoge werden nicht bestätigt; Unterstützung hierfür und für Dateiimport/-export ist noch offen. Normale HTML-Dialoge sind sichtbar und anklickbar.

```json
{"op":"click","x":500,"y":300}
{"op":"type","text":"Beispiel"}
{"op":"scroll","x":900,"y":700,"dy":500}
{"op":"wait","ms":500}
{"op":"reload"}
{"op":"stop"}
```

Koordinaten nur Beispiele, keine Spielanleitung. Frischer Chat mit Bildfähigkeit, keine Projektkonversation, kein Quellcode. Bei manuellem Relay entscheidet die KI, Testleitung übermittelt nur Bild und Aktion unverändert. Ein automatischer Text-Modellanschluss für lokales Ollama und ausdrücklich freigegebene OpenRouter-Free-Modelle ist implementiert (siehe unten), aber noch nicht mit einem realen Modell getestet. ChatGPT-Abonnement ist kein API-Zugang. Text-only-Modelle können alternativ mit `M4_UI_TEXT=1 node scripts/m4-u4-ui-relay.cjs .` bedient werden. Pro Runde maximal 1.800 Zeichen und 32 Zeilen mit sichtbaren Textfragmenten und (x,y)-Koordinaten. Die KI darf nur diese Projektion und das neutrale Ziel erhalten. Keine Attribute, HTML, Skripte oder versteckte Zustände; konservative Viewport-/Trefferprüfung. Abgeschnittene, überdeckte, grafische oder schwer erkennbare Inhalte können fehlen; Darstellung ist keine pixelgenaue OCR oder Grafik-/Touch-Abnahme. Wenn die Projektion keine ausreichenden Informationen liefert, Screenshot-Modus oder Infrastrukturblockade statt erfundener Aktion.

## Lokaler Gemma-4-E4B-Pilot [DRAFT · 26.11.2026]

Auf Nutzerwunsch ist `gemma4:e4b` der feste lokale Pilot, ohne OpenRouter, API-Key, Self-hosted Actions-Runner oder öffentlich erreichbaren Ollama-Port. Der neue Starter `scripts/m4-u4-ollama-local.sh` nutzt den bestehenden Text-Relay und das vorhandene Aktionsprotokoll unverändert. Voraussetzung: Linux/macOS, Git, Node.js ab 22, npm, laufendes Ollama auf 127.0.0.1:11434 und lokal vorhandenes Modell.

Separater Checkout (vorerst Draft-Branch):
```sh
git clone --branch test/m4-u4-ollama-e4b-local-20261126 --single-branch https://github.com/tobiasfranziskus/Check.git Aphros-Blindtest
cd Aphros-Blindtest
ollama list
bash scripts/m4-u4-ollama-local.sh A
```

Der Starter prüft einen sauberen Checkout, setzt Modell, Provider und Loopback-Port fest, entfernt Remote-Credentials aus seiner Umgebung, installiert Playwright 1.51.1/Chromium bei Bedarf im Benutzer-Cache (kein sudo), prüft die lokale Modellliste und verlangt zwei synthetische valide JSON-Entscheidungen (Kaltstart max. 120 s, Warmstart max. 20 s). Keine Probe erhält Spielinhalte. Erst danach startet das isolierte Modul A. Bei Erfolg des Transports Modul B separat mit `bash scripts/m4-u4-ollama-local.sh B` ausführen. Bei fehlendem Modell `ollama pull gemma4:e4b`, bei fehlendem Dienst Ollama lokal starten; bei Browser-Systembibliotheksfehler die konkrete Meldung prüfen. Keine automatische Absenkung des Modells, keine Verlängerung des Abnahmebudgets, keine Remote-Fallbacks. Optional vorhandenes kompatibles Chromium über CHROMIUM_PATH.

Nach jedem Lauf den ausgegebenen JSON-Resultatpfad (evidence.jsonl) samt Terminalausgabe sichern. Checkout-SHA und gegebenenfalls Modell-Digest werden ausgegeben. Produktgleichheit zum veröffentlichten Pages-Stand ist separat nachzuweisen. Jede Sitzung ist neu und nichtpersistent. Auswertung bleibt UNREVIEWED; Textprojektion ist keine visuelle Designabnahme. Die Module C–F benötigen teilweise geeignete regulär erzeugte Teststände und weitere Import-/Save-Prüfung; sie sind noch nicht abgenommen.

Prüfung des Starter-Blobs 292e04f3705913ede0dc496ca573bef9497998c6 am 26.11.: Bash- und eingebettete Node22-Syntax erfolgreich, ungültiges Modul mit Exit 2 abgelehnt; isoliertes temporäres Git-Repository und simulierter Loopback-Modellserver mit Stub des bestehenden Runners: 4/4 Fälle (fester Provider/Modell und Start, fehlendes Modell, falsche Probe, unsauberer Checkout). Kein echter Ollama-, Browser- oder Spieltest in dieser Prüfung; keine Änderung des Spielcodes.

### Erster lokaler Lauf A: Infrastrukturblockade (26.11.2026)

Nutzer-Terminalausgabe für Checkout `1d4e6211`: Browserinstallation erfolgreich (Playwright-Fallback Ubuntu 20.04, OS nicht offiziell unterstützt), gemma4:e4b installiert; synthetische JSON-Proben 32.690 ms kalt und 12.625 ms warm. Lauf A: INFRASTRUCTURE / Model timeout, 0 Aktionen, 41.170 ms, UNREVIEWED. Keine UX-Abnahme, keine Aussage über Spielbarkeit.

Korrektur im selben Draft #642: lokaler Ollama-Aufruf maximal 90 s statt 20 s, begrenzt durch verbleibendes unverändertes 300-s-Budget. Remote-Aufruf weiterhin maximal 20 s, maximal zwei Versuche und 12 Aktionen unverändert. Drei simulierte Budgetfälle am aus GitHub abgerufenen run()-Code bestanden (90 s lokal, 45 s Restbudget, 20 s remote); zusätzliche Node-Regression im PR, CI noch nicht geprüft. Reales Modell erneut starten; bei erneutem Timeout oder Formatfehler Evidenzdatei auswerten. Keine Verlängerung des Abnahmebudgets, keine Modellumstellung und kein Spielcodewechsel. Testcheckout aktualisieren: `git pull --ff-only`, danach `bash scripts/m4-u4-ollama-local.sh A`.

### Zweiter lokaler Lauf A und CPU-Optimierung (26.11.2026)

Nutzer-Evidenz vom Checkout 7361eaff: Modell gemma4:e4b (Ollama ps: 100 % CPU, Kontext 4096). Runde 0 sichtbarer Startscreen, Klick Neue Karriere, nach 30.839 ms Kommandobrücke mit 3.000 ISK und null Schiffen. Runde 1 nach Timeout und Wiederholung gültiger Minerkauf, Runde 2 bei 184.380 ms: 2.400 ISK, ein eigenes Schiff, sichtbare Kaufbestätigung über 600 ISK. Weitere Anfragen Timeout; Ende INFRASTRUCTURE, zwei Aktionen, 300.001 ms, UNREVIEWED. Positiver Teilnachweis, keine vollständige UX-Abnahme.

Der lokale Starter aktiviert nun explizit M4_OLLAMA_NATIVE=1: Loopback /api/chat, think:false, format:json, options.num_predict:256, temperature:0 und keep_alive:5m. Generische bisherige Ollama-Kompatibilität und OpenRouter unverändert. Native Antworten müssen abgeschlossen sein, richtige Modellidentität melden und die unveränderte Aktionsvalidierung bestehen; abgeschnittene/ungültige Antworten abweisen. Nur numerische Laufzeit-/Tokenmetriken werden zusätzlich protokolliert, kein thinking-Inhalt. Kein Spielcode, keine Änderung an neutralem Ziel, sichtbarer Projektion, 90-s-Anfragelimit, 5-Minuten-/12-Aktions-Gesamtgrenze oder Blindheitsregeln. Native API laut https://docs.ollama.com/api/chat und https://docs.ollama.com/capabilities/structured-outputs.

Fünf isolierte Mock-Fälle mit dem aus GitHub abgerufenen config/ask/decision/action-Code und simuliertem Response-Parser geprüft: gültige Antwort samt Metriken, falsche Modellidentität, unvollständige Antwort, abgeschnittene Ausgabe, unzulässige Aktion. Alle erfolgreich; zusätzliche Node-Regression im PR. Keine neue Live-Messung oder vollständige CI für diesen Stand nachgewiesen. Nutzer führt erneut A aus; bei Fehlversuch JSONL und Probenmetriken auswerten. Keine automatische Wahl von E2B oder GPU.

### Dritter lokaler Lauf A: schnellere Probe, ungültige Aktion (26.11.2026)

Nutzer-Terminalausgabe für 46f31bfd: native Ollama-Proben 2.904 und 1.877 ms (zuvor 15.635 und 15.282 ms); jeweils 38 Prompt-/13 Ausgabetokens. Lauf A: eine ausgeführte Aktion, 140.532 ms, INFRASTRUCTURE / Invalid model decision format, UNREVIEWED. Inhalt der Aktion ohne JSONL noch nicht bewertet. Probezeit nicht auf reale Spielentscheidungen extrapolieren.

Korrektur: native Ollama-`format` enthält jetzt ein festes JSON-Schema mit sechs disjunkten erlaubten Aktionsvarianten, ihren Pflichtfeldern, Wertebereichen, ohne zusätzliche Felder, plus note. Keine Änderung der nachgelagerten strikten Aktionsvalidierung; keine automatische Reparatur, kein Raten von Klicks. Bei lokaler Ablehnung wird ausschließlich eine bekannte Validierungskategorie in model_error protokolliert, kein abgelehnter Rohtext. Referenz: https://docs.ollama.com/capabilities/structured-outputs. 12 isolierte Mock-Prüfungen am abgerufenen Schema, nativen ask- und action-Code bestanden (sechs zulässige Aktionen, fünf unzulässige, Schema-Varianten); Node-Regressionsfälle hinzugefügt. CI und tatsächliche Schema-Unterstützung des lokalen Ollama noch nicht nachgewiesen. Unverändertes Modell, Denkmodus aus, 256 Tokens, fünf Minuten / zwölf Aktionen. Nächster Start A nach git pull --ff-only; bei erneutem Fehler vollständiges JSONL prüfen. Keine Abnahme oder Produktänderung.

### Vierter lokaler Lauf A: wirtschaftlicher Teilnachweis, Text-Relay-Hürde (26.11.2026)

Vollständige Nutzer-JSONL für 8070f0cf ausgewertet: sieben Klicks, drei mit sichtbarer Wirkung (neue Standardkarriere, Miner 600 ISK, Frachter 750 ISK), vier ohne sichtbare Änderung (Eishandel-Überschrift, Frachterbeschreibung, Operationsboard-Überschrift, Eisförderung finanzieren). Endstand 1.650 ISK, zwei Schiffe, null Aufträge, Weltzeit 0. Kein Handflug, keine Einnahmen. A-Teilbelege Start, Orientierung und erste wirtschaftliche Aktion vorhanden; formales Ergebnis INFRASTRUKTURBLOCKIERT wegen Model timeout bei 300.003 ms und fehlendem Abschluss, Produktgleichheit zu Pages noch offen. Kein nachgewiesener UI-Defekt im grafischen Spiel. 279.657 ms Modellzeit, davon 210.205 ms Prompt-Evaluation und 69.245 ms Ausgabe (5.461 Prompt-/302 Ausgabetokens über sieben gültige Antworten). Alle vier PR-CI-Workflows auf 8070f0cf erfolgreich (45814116887, 45814116948, 45814116851, 45814116785).

Nächster lokaler Pilot: native Ollama-Textprojektion markiert ausschließlich bereits sichtbaren, treffergeprüften Text innerhalb eines aktivierten nativen HTML-Buttons mit [B]; Überschriften und andere Texte bleiben erhalten, kein automatischer Klick, keine versteckten Inhalte, keine DOM-Attribute im Modellprompt, keine spielbezogenen Selektoren. Generischer bisheriger Relay-Modus bleibt unverändert. Kompakter neutraler lokaler Systemprompt erläutert Marker; keine Lösungsanweisung, unverändertes Ziel, Modell, Limits und Validierung. Browser-Regression für sichtbare, deaktivierte, verdeckte/ausgeblendete bzw. offscreen Buttons und Nichtweitergabe privater Attribute ergänzt (Fixture prüft ausgeblendet/offscreen, vorhandene separate Fixture prüft verdeckten Text). Neue CI und tatsächlicher Pilot noch offen. Die Marker sind eine technische Text-Accessibility-Hilfe, kein Nachweis grafischer UX. Nach git pull --ff-only Modul A erneut frisch starten und vollständige JSONL sichern. 

### Expliziter lokaler Modellvergleich (26.11.2026)

Nutzer meldet installierte Modelle gemma4:e4b, gemma4:12b, qwen3.5:0.8b, qwen3.5:2b und granite4:micro. Der Starter akzeptiert optional genau eines dieser Modelle als zweites Argument (Default unverändert gemma4:e4b), prüft dessen lokale Installation und identische Modell-ID in beiden Proben. Keine automatische Auswahl oder Wechsel, keine Remote-Anfrage. Beispiel: `bash scripts/m4-u4-ollama-local.sh A qwen3.5:0.8b`. Für Vergleich weitere Modelle einzeln starten, frische Sitzung, identisches Modulziel, Button-Marker, Schema, maximal 5 Minuten / 12 Aktionen. Erfolgreiche Spielhandlungen, Modellzeit und Zielerreichung vergleichen, nicht bloß Klickzahl. Das kleinere Modell ist nicht vorab als geeignet bestätigt. Modellunterstützung der nativen API einschließlich think:false und Schema muss die Vorprüfung tatsächlich zeigen. Starter-Blob 0a172d6e4049d086b713fded3f508a29f12d0621 im Container exakt rekonstruiert und bash -n erfolgreich; neun Prüfungen des Auswahlfragments (fünf erlaubte IDs, Default, unerlaubte ID, zu viele Argumente, ungültiges Modul) bestanden. Vollständiger Mock-Start nicht erfolgreich geprüft (Testfixture-Fehler), Live-Lauf und CI offen. Keine Spielcode- oder Abnahmeregeländerung.

## A/B – getrennte Pilotaufträge

A: Neue Standardkarriere. Ziel: „Beginne eine Karriere und finde heraus, was du als Manager tun kannst.“ Erste sichtbare Aktion und gewähltes Ziel protokollieren. B: Frische Sitzung; Ziel: „Erziele mit deiner Flotte Einnahmen.“ Erst mit Standardstart versuchen; falls zwölf Aktionen nicht reichen, getrennt einen validierten, regulär erspielten Teststand mit vorhandenem einsatzfähigem Schiff und offenem Auftrag vorbereiten. Keine Lösungsfolge oder spezifischen Klicks mitteilen. B-Teststand noch nicht erzeugt; dafür bestehenden M4-U3-UI-/Auditpfad als technische Grundlage nutzen, echten JSON-Export und Hash prüfen und nur regulär importieren. Kein Storage-Injektionsweg im Relay. Der vorbereitete Importpfad benötigt weitere Unterstützung und Prüfung.

## Nachweise und Grenzen

CI ist auf Ubuntu 24.04 festgelegt, nachdem der [erste Lauf](https://github.com/tobiasfranziskus/Check/actions/runs/45545330985) bereits bei der Browserinstallation unter Ubuntu 26.04 scheiterte. Die Prüfungen wurden dort übersprungen. CI testet das Aktionsprotokoll, isolierte Browserkontexte, echte Koordinatenklicks, Reload und Rundenlimit auf neutraler Fixture sowie Screenshot- und Text-Smoke vom tatsächlichen Root der Checkout-Kopie. Eine zusätzliche neutrale Fixture prüft sichtbare Koordinaten, tatsächliche Klickwirkung, Ausgabegrenze sowie Ausschluss versteckter, überdeckter, transparenter, außerhalb des Viewports liegender Texte und Attribute. Das ist kein Spieltest A/B und keine UX-Abnahme. Node22-Gesamtregression separat im Workflow. Lokaler Checkout/Browser-Node-Abhängigkeit hier nicht verfügbar; tatsächliche CI-Ergebnisse abwarten und separat dokumentieren. Weitere Module, Live-Modell-Pilot, validierte Teststände, echte iPad-/NAS-Abnahme bleiben offen.

## Automatisierter Pilot A/B (Textmodus)

Der Runner `scripts/m4-u4-model-runner.cjs` übermittelt pro Runde nur das neutrale Ziel, maximal 1.800 Zeichen sichtbaren Text und die letzten zwei Entscheidungen mit je maximal 240 Zeichen Notiz. Keine Toolrechte, kein Codezugriff für das Modell. Maximal zwölf echte Aktionen, fünf Minuten, 20 Sekunden je Modellaufruf, 256 angeforderte Antworttokens; keine automatische Wiederholung bei Quoten-/Formatfehlern. Die JSON-Ausgaben sind strikt validiert. Ein Modellstopp ist keine Abnahme: die lokale JSONL-Evidenz wird unabhängig auf reale Beobachtungen und Modulkriterien geprüft; Status UNREVIEWED. Der technische SHA muss durch die Testleitung vorab anhand der tatsächlichen Produktdateien verifiziert werden.

Lokaler Start mit bereits installiertem und laufendem Ollama, Modellname ausdrücklich setzen (vorher `ollama list`):

```sh
export M4_AI_MODEL='NAME_DES_LOKALEN_MODELLS'
export M4_PRODUCT_SHA='VERIFIZIERTER_PRODUKT_SHA'
node scripts/m4-u4-model-runner.cjs A .
node scripts/m4-u4-model-runner.cjs B .
```

Optional OpenRouter: `M4_AI_PROVIDER=openrouter`, `M4_ALLOW_REMOTE=1`, `M4_AI_MODEL` endet zwingend auf `:free`; `OPENROUTER_API_KEY` lokal als Umgebungsvariable (nicht im Repository, Chat oder Logs). Nur bei bewusster Zustimmung: sichtbare Testspieltexte und kurze Entscheidungen werden an den externen Anbieter gesendet. Keine automatische Modellauswahl oder kostenpflichtige Ausweichroute; Free-Verfügbarkeit/Quota nicht garantiert. Ein lokaler Modellserver ist ebenfalls keine garantierte Testfähigkeit. CI nutzt ausschließlich Mock-Antworten, keine API-Schlüssel/Live-Kosten. Keine realen API-Aufrufe in diesem Arbeitsgang. Modell A/B mit frischem Start; spätere vorbereitete Spielstände brauchen separaten regulären Importweg.

## Mobiler Cloud-Pilot über GitHub Actions [DRAFT]

Workflow: [M4-U4 KI-Blindtest (mobil)](../.github/workflows/m4-u4-mobile-pilot.yml). Ausschließlich manueller Start auf main mit ausdrücklichem Zustimmungsfeld; nur A oder B, expliziter OpenRouter-Name mit `:free`, kein bezahlter Ersatz. Der Workflow ist erst nach Integration in den Default-Branch nutzbar. Er testet eine isolierte lokale Kopie des exakten main-Checkout-SHA, nicht die Live-Pages-Domain. Die Testleitung muss Pages-Produktgleichheit separat belegen. Keine Verbindung zu persönlichen Browser-/NAS-Spielständen.

### Einmalige Einrichtung am iPhone/iPad (Safari, ggf. Desktop-Website anfordern)

1. [OpenRouter API Keys](https://openrouter.ai/keys): eigenen Schlüssel für diesen Testzweck erstellen bzw. vorhandenen dafür geeigneten Schlüssel verwenden. Kein Guthaben für einen kostenpflichtigen Ausweichpfad vorsehen. Schlüssel nie in Chat, Commit oder Workflow-Input eintragen.
2. [GitHub Check – Environments](https://github.com/tobiasfranziskus/Check/settings/environments): Environment `m4-blindtest` anlegen. Unter Deployment branches/tags nur den Branch `main` zulassen. Falls die notwendige Branchbeschränkung nicht verfügbar ist, vor Hinterlegen des Secrets stoppen und Alternativen prüfen. Nicht als allgemeines Repository-Secret hinterlegen.
3. In diesem Environment unter Environment secrets `OPENROUTER_API_KEY` hinzufügen und den Schlüssel als Value speichern. Nicht in Environment variables eintragen. GitHub-Einstellungen/Secret müssen vom Nutzer selbst vorgenommen werden.
4. Nach Integration: [Actions](https://github.com/tobiasfranziskus/Check/actions) öffnen, Workflow **M4-U4 KI-Blindtest (mobil)** auswählen, **Run workflow**, Branch main, Modul A und einen tatsächlich aktuell verfügbaren exakten Modellnamen mit `:free` aus dem [OpenRouter-Katalog](https://openrouter.ai/models) wählen. Zustimmungsfeld für externe Übermittlung der sichtbaren Testspieltexte und GitHub-Artefakt bewusst aktivieren. Erst dann starten. Free-Quota und Verfügbarkeit sind nicht garantiert.
5. Run öffnen: Summary zeigt Transportstatus und Aktionszahl, niemals automatisch BESTANDEN. Unter Artifacts ist die ZIP-Datei mit result.json und evidence.jsonl für sieben Tage verfügbar. Testprotokolle und Actions-Daten können entsprechend der Sichtbarkeit und Zugriffsrechte des Repositories einsehbar sein; keine personenbezogenen Daten eingeben. ZIP für unabhängige Auswertung bereitstellen. Danach Modul B separat starten.

Sicherheitsgrenzen: Workflow nur manuell auf main, read-only GitHub-Token, Checkout ohne persistierte Credentials, Browserinstallation vor Secret-Übergabe, Secret ausschließlich im Modellschritt; Controller entfernt OPENROUTER_API_KEY vor Browserstart aus dem Prozessumfeld. Nur neutraler Teststart, maximal zwölf Aktionen, keine Produktänderung/kein Push. Kein automatisches Bestehen bei Provider-Fehler, Modellstopp oder Limit. Workflow-Datei und Runner sind durch den Repository-Verantwortlichen vor Integration zu prüfen. Ein Environment allein ist kein Schutz, wenn seine Branchrestriktion fehlt. Tests ohne echte Zugangsdaten in der PR-CI; Live-Dispatch noch nicht ausgeführt.

Vorheriger geprüfter Adapterhead 31f6ac30: [CI #45546114353](https://github.com/tobiasfranziskus/Check/actions/runs/45546114353), 10/10 Adapter-/Mocktests und 603/603 Node22-Regression, keine Fehler/Skips. Die Cloud-Erweiterung ist neu und benötigt erneute CI, danach Integration von #622/#623 unter Berücksichtigung von #621. Kein Nachweis eines echten KI-Spieltests.
