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

### Gemma-E4B-Vergleich und nativer Bestätigungsdialog (26.11.2026)

Nutzer-JSONL auf 34ce524: Gemma E4B startete erfolgreich eine Standardkarriere, klickte zweimal auf bereits ausgewähltes Aldera ohne sichtbare Änderung, kehrte über Menü zum Startbildschirm zurück und löste mit erneuter Neuer Karriere einen nativen Browserdialog aus. Der bisherige Relay wies ihn automatisch ab; INFRASTRUCTURE / Browser action failed bei 154.146 ms, fünf versuchte Aktionen, kein Schiffskauf oder wirtschaftlicher Fortschritt. Kein belegter Produktfehler. Alle bisherigen Vergleichsmodelle zeigen Probleme mit Wiederholung/Orientierung; Gemma bleibt aufgrund des älteren Miner-/Frachter-Teilnachweises ein Kandidat, nicht abgenommen.

Korrektur ausschließlich am nativen lokalen Testadapter: Ein während einer UI-Aktion tatsächlich auftretender confirm-Dialog bleibt offen; sichtbarer Dialogtext (max. 600 Zeichen) wird dem Modell vorgelegt, das explizit dialog(choice=accept|dismiss) oder stop wählen muss. Keine automatische Bestätigung, kein Eingriff in Spielcode oder Speicherzustand, nur isoliertes frisches Browserprofil. Abbruch/Schließen verwirft offene Bestätigungen; andere Dialogtypen, nicht unterstützte Sitzungsmodi und Dialoge außerhalb eines laufenden Bedienvorgangs bleiben blockiert. Jede Antwort verbraucht eine reguläre Aktionsrunde. Zusätzlich meldet der lokale Runner nach jeder Aktion lastTextUnchanged anhand der exakten Gleichheit der aufeinanderfolgenden sichtbaren Textprojektionen (keine Aussage über unsichtbaren Spielzustand oder grafische Änderung); keine automatische Aktionskorrektur. 5 Minuten/12 Aktionen, neutrales Ziel und Modellwahl unverändert. Remote-Transport erhält keine neue Bestätigungsoption.

Acht Mock-Prüfungen des abgerufenen session/action-Codes (Dialoganzeige, keine automatische Entscheidung, normales Klicken während Dialog blockiert, explizites Verwerfen/Bestätigen, Cleanup, alter Modus, ungültige Wahl) sowie vier Mock-Prüfungen des abgerufenen Runner-Codes (Aktionsfolge, kontextabhängiges Schema, unveränderter/geänderter Text) bestanden. Browser-Fixture und Runner-Regression im PR ergänzt. Lokaler Versuch mit rekonstruierter Session und installiertem Chromium wurde bei Navigation mit ERR_BLOCKED_BY_ADMINISTRATOR blockiert; daher noch kein erfolgreicher echter Browsernachweis für diese Änderung. CI/realer Ollama-Pilot offen. Keine Abnahme, kein Merge.

### Abschluss Modellvergleich / kompaktes Sitzungsgedächtnis (26.11.2026)

E4B auf 9ecac8c: realer confirm-Dialog dreimal sichtbar, zweimal explizit bestätigt; Menü/Neustart-Dreierzyklus trotz wechselnder Textansichten, neun Aktionen/300.003 ms, INFRASTRUCTURE / Model timeout, kein Schiff. Gemma 12B auf demselben Checkout: erste Aktion neue Karriere erfolgreich bei 75.316 ms, erste Modellentscheidung 74.412 ms (davon 59.105 ms Prompt-Evaluation), zwei Modelltimeouts in Runde 1, Ende bei 256.326 ms mit einer Aktion, INFRASTRUCTURE / Model timeout. Keine wirtschaftliche Aktion, keine Abnahme. Kleine Qwen-/Granite-Kandidaten bislang ebenfalls ohne wirtschaftlichen Fortschritt; älterer E4B-Pilot mit zwei Schiffskäufen bleibt der beste Teilbefund (abweichender Adapterstand). E4B als weiterer lokaler Pilot; 12B nicht weiter priorisieren.

Nur native lokale Sitzung: Jeder exakt gleichen sichtbaren Textprojektion einschließlich Dialogtyp wird eine sitzungsinterne S-ID zugeordnet. Modell erhält aktuelle ID und Besuchszahl sowie maximal zwölf kompakte, selbst gewählte Aktionen mit Ansichtsübergängen; kein verborgenes Spielwissen, keine gespeicherten Zustände, keine automatischen Klicks. Notizen früherer Entscheidungen bleiben im Evidence-Log, werden im kompakten Verlauf nicht erneut übermittelt; lange type-Eingaben dort auf 48 Zeichen plus Auslassungsmarker begrenzt. Kürzerer neutraler Systemprompt, sichtbare Textprojektion unverändert, lastTextUnchanged weiterhin vorhanden. Identische Texte bedeuten nicht identischen Spielzustand oder identische Grafik. Modell entscheidet weiterhin selbst, auch bei Wiederholungen. Keine Änderung der Remote-Requests, Dialogsicherheit, Spielregeln, 5-Minuten-/12-Aktionen-Grenze oder Abnahmebedingungen.

Elf Mock-Prüfungen mit tatsächlich abgerufenem Runner-Code bestanden (Dreierzyklus, IDs/Zähler, geänderte Ansicht bei Wiederkehr, vollständiger Verlauf, keine geheimen Felder, frische Sitzung, Dialogidentität, Legacy-Payload, Begrenzung, unveränderte Schemas und modellgesteuerte Aktionen). Beispielhafte Prompt-Zeichenmessung mit sechs Aktionen: 1124 → 916 Zeichen (keine gemessene Token- oder Laufzeitersparnis). Regressionstest ergänzt; neue CI und echter Ollama-Lauf offen. Kein Merge, keine Abnahme.

### Separates Bedien-Diagnoseprofil (26.11.2026)

E4B auf 08a08083: acht Aktionen, 300.004 ms, INFRASTRUCTURE / Model timeout, UNREVIEWED. Start, Menü, erneuter Start mit bestätigtem Dialog, zwei Klicks auf Aldera und zwei im Bereich Eigene Schiffe; sechs Besuche der identischen Kommandobrücken-Textansicht, keine Schiffe/Aufträge, 3.000 ISK, Weltzeit 0. Die S-ID-Zähler funktionieren im realen Log; ein Modellnutzen ist nicht hinreichend belegt. Acht vollständige Modellantworten: 294.007 ms Gesamtzeit, 220.362 ms Prompt-Evaluation (75 %), 73.398 ms Ausgabe, 5.640 gezählte Prompt-Tokens, 318 Ausgabe-Tokens. Kein Nachweis einer Cache-Trefferrate. Alle vier CI-Workflows auf 08a08083 erfolgreich.

Keine weitere Wiederholung mit unverändertem Runner empfohlen. Opt-in `M4_LOCAL_DIAGNOSTIC=1 bash scripts/m4-u4-ollama-local.sh A gemma4:e4b`: gesonderte Bedien-Diagnose mit nummerierter Liste der bereits als [B] markierten sichtbaren nativen Buttons und den restlichen sichtbaren Texten ohne deren Koordinaten. Modell wählt eine aktuelle Nummer selbst; der Runner übersetzt nur in den zugehörigen regulären Klick. Die Nummer ist an die aktuelle Ansicht gebunden; ungültige Nummern und freie Klicks im Palette-Modus werden abgewiesen. Scrollen, Warten, Eingabe, Reload und Stop bleiben möglich; bei fehlenden Buttons wird die bisherige Textprojektion benutzt, Bestätigungsdialoge bleiben separat. Keine versteckten Daten, keine Spielhinweise, keine automatische Auswahl, kein Eingriff in Spielcode. Die Einschränkung auf markierte Buttons verändert allerdings den Entscheidungsraum: ausdrücklich Diagnose, nicht eigenständiger Nachweis der formalen Blindabnahme. Evidence-Start testMode=text-controls-diagnostic, Modellwahl und tatsächlich ausgeführte Koordinaten protokolliert. Standardmodus und Remote unverändert, gleiche Zeit-/Aktionsgrenzen, Ergebnis UNREVIEWED.

Zwölf gezielte Prüfungen des abgerufenen Codes mit Mock-Provider/Browser bestanden, Regressionstest ergänzt. Neuer CI-/Ollama-Lauf offen; keine gemessene Beschleunigung oder bessere Spielleistung. Keine Änderung der Abnahmebedingungen, kein Merge.

### Direkter Gemini-Developer-API-Pilot (26.11.2026)

Auf Nutzerwunsch direkte Google-Anbindung zusätzlich zu Ollama/OpenRouter. Feste Modell-Allowlist `gemini-3.8-flash` (Default) und `gemini-3.5-flash-lite`: laut [Google-Preisliste](https://ai.google.dev/gemini-api/docs/pricing) am 26.11.2026 Free-Tier für Standard-Textanfragen. Tatsächlicher Zugriff und Kontingente projektabhängig. Nur eigenes kostenloses Google-AI-Studio-Projekt ohne aktivierte Abrechnung verwenden; der Runner kann den Tarif anhand eines API-Schlüssels nicht verifizieren. Explizite Nutzerbestätigung erforderlich, keine kostenpflichtige Modellwahl oder automatische Fallbacks. Free-Tier-Inhalte können laut Google zur Produktverbesserung genutzt werden; ausschließlich isolierte sichtbare Testspieltexte und neutrales Modulziel übermitteln.

```bash
M4_GEMINI_FREE_CONFIRMED=1 bash scripts/m4-u4-gemini-local.sh A
```

Der Starter fragt bei nicht gesetztem GEMINI_API_KEY verdeckt nach dem vorhandenen Schlüssel. Kein Schlüssel in Repo, Prompt, URL, Ausgabe oder Browser-Umgebung; Transport ausschließlich HTTPS an festes generativelanguage.googleapis.com/v1beta/models/<modell>:generateContent per x-goog-api-key-Header, keine Redirects. Keine Google-Suche, Computer-use-Tools oder andere Zusatzdienste. Ein synthetischer JSON-Probeaufruf vor Spielstart, bei Fehler kein Spielstart. Native generateContent-JSON-Schema, Thinking-Level low (Flash) bzw. minimal (Lite), max. 1024 Ausgabetokens inkl. Thinking, nur sichtbarer Antworttext, Nutzungsmetrik ohne Gedankentext. Feste Modell-ID, Versionswechsel innerhalb einer Sitzung blockiert, HTTP 429 beendet den Lauf ohne Wiederholung. Max. 45 s je Modellanfrage, weiterhin höchstens 5 Minuten/12 Aktionen insgesamt. Unveränderte sichtbare Koordinaten-UI mit S-ID-Gedächtnis und expliziter Dialogentscheidung; kein nummeriertes Diagnoseprofil für Gemini. Ollama- und OpenRouter-Transport bleiben unverändert, Schlüssel zusätzlich vor Browserstart aus Prozessumgebung entfernt.

13 gezielte Prüfungen des tatsächlich abgerufenen Codes im Mock-Transport/Browser bestanden, Regressionstest hinzugefügt (Opt-in, feste URL, Header, Schema, kein Schlüssel/verborgene Felder/Tools im Prompt, bereinigte Antwort, falsches Modell, Tokenlimit, Lite/Modal, 429, Versionswechsel). Realer Google-API-Aufruf, Launcher auf Nutzergerät und neue CI noch nicht durchgeführt. Keine Aussage zu tatsächlich verfügbaren Gratisquoten, Geschwindigkeit oder Eignung. Produktstand-/Pages-Gleichheit und Abnahme bleiben offen. Kein Merge.

### Direkter Modellvergleich mit identischer Bedienprojektion (26.11.2026)

Realer E4B-Diagnoselauf f846ed2: 10 Aktionen/300.003 ms, 240 Weltminuten, Miner/Frachter, Eisförderung, 50 Eis, eine bezahlte Eis-Rundfahrt (240 ISK Frachtgebühren, 120 ISK Fluglöhne), zweite Rundfahrt beauftragt, zuletzt 1.908 ISK, 2 Schiffe/2 Aufträge; Model timeout, UNREVIEWED. Realer Gemini-3.5-Flash-Lite-Lauf ca6a04ad: 12 Aktionen/45.897 s, ein 503 mit erfolgreichem Retry, Karrierestart, beide Schiffskäufe und Förderauftrag, Menü/Neustart/Bestätigung, erneute Käufe/Förderauftrag, Menü; zuletzt sichtbare Karriere 1.650 ISK, 2 Schiffe, 1 Auftrag, Weltzeit 0, kein Erlös. LIMIT/UNREVIEWED. Beide Läufe sind keine formale Abnahme. Gemini 3.8 Flash: Metadatenabruf erfolgreich, minimale Generierung 503 (high demand). Alle vier CI-Workflows auf ca6a04ad erfolgreich.

Für kontrollierteren Vergleich ist das bereits vorhandene nummerierte Bedien-Diagnoseprofil jetzt auch für Gemini ausdrücklich zuschaltbar:

```bash
M4_GEMINI_FREE_CONFIRMED=1 M4_LOCAL_DIAGNOSTIC=1 bash scripts/m4-u4-gemini-local.sh A gemini-3.5-flash-lite
```

Gleiche sichtbare Textprojektion, Buttonnummern, Koordinatenabbildung, Sitzungsverlauf, Ziel sowie Zeit-/Aktionsgrenzen wie E4B-Diagnose; keine Änderung des Spiels, keine zusätzliche Spielanleitung. Native Gemini-JSON-Schema-Übersetzung der vorhandenen dynamischen Auswahl, Validierung und tatsächliche Klickausführung gemeinsam genutzt. Free-Projekt-Bestätigung und Modellidentitätsprüfung bleiben erforderlich, kein OpenRouter-Fallback. Standardmodus (freie Koordinatenauswahl) und synthetischer Probeaufruf unverändert. Diagnose bleibt ausdrücklich kein Ersatz für die formale Blindabnahme. Neun gezielte Prüfungen des abgerufenen Codes im Mock-Transport bestanden, Regressionstest ergänzt. Neuer echter API-Lauf und CI offen, keine Behauptung über Spielleistung im neuen Profil. Produktgleichheit separat zu prüfen; kein Merge.

### Gemini 4 Hydrogen (26.11.2026)

Auf Nutzerwunsch `gemini-4-hydrogen` zur festen Modellliste des direkten Gemini-Providers und Launchers hinzugefügt. [Googles offizielle Preisliste](https://ai.google.dev/gemini-api/docs/pricing#gemini-4-hydrogen) bestätigt kostenloses Standard-Input/Output einschließlich Thinking im Free-Tier; Projekt ohne aktivierte Abrechnung weiterhin erforderlich. Tatsächliches Kontingent und Verfügbarkeit nicht verifiziert. Beibehaltung der bisherigen Standardmodellwahl und der expliziten Modellwahl ohne Fallback. Hydrogen verwendet das bestehende Thinking-Level low, feste Modellidentität, 45-s-Requestlimit und unveränderte Sitzungsgrenzen.

```bash
M4_GEMINI_FREE_CONFIRMED=1 bash scripts/m4-u4-gemini-local.sh A gemini-4-hydrogen
M4_GEMINI_FREE_CONFIRMED=1 M4_LOCAL_DIAGNOSTIC=1 bash scripts/m4-u4-gemini-local.sh A gemini-4-hydrogen
```

Erster Befehl freier Koordinatentest, zweiter gesonderte Bedien-Diagnose. Neun gezielte Mock-Prüfungen des abgerufenen Codes erfolgreich, Regressionstest hinzugefügt. Reale API-Probe, Spieltest und neue CI offen. Keine Spielcode-/Abnahmeänderung oder Integration in main.

### Mobiler Gemini-Spieltest über GitHub Actions (26.11.2026)

Auf Nutzerwunsch separater manueller Workflow `.github/workflows/m4-u4-gemini-mobile.yml` (M4-U4 Gemini-Spieltest (mobil)). Laptop und lokale Installation nicht erforderlich. Bevorzugtes Modell für die **funktionale Bedien-Diagnose**: `gemini-3.5-flash-lite` (realer nummerierter Lauf: 12 Aktionen/42,479 s, zwei bezahlte Rundfahrten, 480 ISK Frachtgebühren/240 ISK Fluglöhne, 2.310 ISK Konzernkasse, 360 Weltminuten). Alternative Modelle Hydrogen und 3.8 Flash; keine automatische Umschaltung. Reguläre Blindtestprojektion durch Abschalten der Diagnose auswählbar. Kein formaler Abnahmepass aus den bisherigen Diagnoseprotokollen.

Einmalig auf GitHub: Settings → Environments → m4-blindtest → Environment secrets → Add secret, Name `GEMINI_API_KEY`, Wert eigener Google-API-Key aus einem Projekt ohne aktivierte Abrechnung. Deployment branches/tags auf main beschränken (Konfiguration vor Verwendung überprüfen). Keine Schlüssel im Repository, Chat, Workflow-Input oder Artefakt. Environment-Konfiguration/Secret-Inhalt nicht durch den Runner überprüfbar; Nutzer muss das Secret selbst hinterlegen. Bei öffentlichem Repository können Workflow-Logs/Artefakte für andere Nutzer mit entsprechendem Zugriff sichtbar sein; ausschließlich isolierte Testspieltexte verwenden.

Nach geprüfter Integration in main: Actions → M4-U4 Gemini-Spieltest (mobil) → Run workflow → main. A/B (jeweils frische Karriere; validierte Startzustände B–F separat offen), Modell (Default Flash-Lite), Diagnose (Default an), Free-Tier-/Datenübermittlungszustimmung (Default aus, aktiv bestätigen). Eine synthetische Probe vor Browserinstallation; bei 429/503/Timeout kein Spielstart, keine automatische Modellwahl. Feste HTTPS-Zieladresse, Secret nur in Probe-/Spieltestschritten, vor Browserstart aus der Prozessumgebung entfernt. Manueller Start ausschließlich main, gemeinsam mit bisherigem OpenRouter-Pilot serialisiert, lesendes Repository-Token, isolierter Browser. 5 Minuten/12 Aktionen, Job-Sicherheitslimit 12 Minuten, sieben Tage Artefaktaufbewahrung. Zusammenfassung enthält nur bereinigte Transportdaten, `probe.json`, `result.json` und `evidence.jsonl` als Artefakt; Status UNREVIEWED, Pages-Gleichheit separat prüfen. Bisheriger OpenRouter-Workflow bleibt unverändert.

Zwölf gezielte Prüfungen (abgerufener Runner mit Mock-API und statische Workflow-Prüfungen) erfolgreich, Regressionstest ergänzt. Neuer CI-Lauf, Environment-Schutz/Secret-Konfiguration, echte mobile Ausführung und geprüfte Integration in main offen. Keine Spielcode-/Abnahmeänderung, kein Merge.

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
