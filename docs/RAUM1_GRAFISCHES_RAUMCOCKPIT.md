> **[MAIN / nachträglich integriert, 15.11.2026]** Die ursprüngliche RAUM-1-Forschung [#358](https://github.com/tobiasfranziskus/Check/pull/358) wurde nach unabhängiger Anpassung durch [Integrations-PR #359](https://github.com/tobiasfranziskus/Check/pull/359) übernommen und als `main ffd0654e` auf GitHub Pages veröffentlicht. Die nachfolgenden `[DRAFT]`-Angaben dokumentieren ausschließlich den historischen Ausgangszustand. Finale Abnahme: 272/272 Node22, Chromium/WebKit je vier Touchgrößen, finanzierte Spieleraufträge und reale Flotten-/Eigentumsgates; echte iPad-/NAS-Gerätetests weiterhin offen.
# RAUM-1 · Grafisches Raumcockpit in der Regel204-Sitzung – Bestandsaufnahme und Übergabe

**Status: [DRAFT] · 15.11.2026.** Einmaliger, abgegrenzter Sonderauftrag (grafische Gameplay-Integration aus Void Echoes). Kein Merge, kein Pages-Deploy, keine neue Wirtschaftsregel. Prüfung, Integration und Veröffentlichung liegen bei ChatGPT als Hauptentwickler.

- **Ausgangsbasis:** `main 399a36ab38c1f6bf4b1b0d40f6a1254d4a52d434` (enthält J5 [#351](https://github.com/tobiasfranziskus/Check/pull/351) und J5-W [#354](https://github.com/tobiasfranziskus/Check/pull/354), das [#352](https://github.com/tobiasfranziskus/Check/pull/352) ersetzt hat). Die geprüften offenen Drafts #315–#346 sind ältere, gegeneinander gestapelte Forschungsstände; keiner davon zielt auf `main`.
- **Referenz (nur gelesen):** `tobiasfranziskus/void-echoes` `19c3f792`. Dort wurde nichts geändert.

## 1. Gameplay-Bestandsaufnahme (Aphros Void `main` ↔ Void Echoes)

| Bereich | Aphros Void vorhanden | Void Echoes besser | Wiederverwendet in RAUM-1 | Anpassung nötig | Nicht übernehmen |
|---|---|---|---|---|---|
| 1. Weltraumdarstellung | Canvas mit Punktsternen, Quadrat-Station, Dreieck-Jäger, Neuzeichnen alle 700 ms (`j4c/app.js`); schematischer 2D-Miner im W0–W5-Hauptspiel | Vektor-Schiffsmodelle je Rolle (`390-ux08`), Parallax-Himmel (`080`), Effekte, 60-fps-Schleife; zusätzlich WebGL-3D (`570`) | Schiffsmodelle, Himmel, Station, Auswahlklammern, Ringeffekte, Fahrtbogen als eigenes Modul `raum-grafik.js` | Entkopplung von VE-Globals; fester dekorativer Zufall getrennt vom Core-RNG | **WebGL-3D** (Roadmap §1: nicht ohne Freigabe), `Math.random`-Effekte |
| 2. Steuerung / Navigation / Autopilot | Deterministischer Ganzzahl-Flugkern `flug2d/flug-kern.js` (shipSteer/Approach/FlyTo/Dock/Undock), bedient über Schieberegler und Knöpfe | Tippen ins All, Zoomgesten, flüssiger Echtzeitflug; Autopilot-Programme (`270`, `420`) | Bedienmuster Tippen/Kneifen; **Flugkern unverändert** | Echtzeit-Takt als UI-Hülle über ganzen Kernschritten; Steuerknüppel → `shipSteer` | VE-Fließkomma-Physik (`dt`-abhängig), Warp, Nachbrenner/Energie, Autopilot-Zustandsautomaten |
| 3. Cockpit / HUD / Touch | Statustabellen, 50-px-Knöpfe, zwei Ansichten (J5) | Overlay-HUD, Zielkarte, Übersichtsliste, Statusbögen | HUD-Aufbau, Zielkarte, Übersicht mit Distanz, Bogenanzeige | Werte ausschließlich aus Kernprojektion; keine Hover-Aktionen | VE-Markup/CSS-Kaskade (70 kB, mehrfach überlagert) |
| 4. NPC-Schiffe | 14 Schiffe fremder Firmen im Kern (neben 9 eigenen); fliegen nur über Pendelaufträge mit demselben Integrator. Im Seed42-Stand ruhen alle | Lebendiger Verkehr mit Rollen-KI (Miner, Händler, Jäger, Piraten) | Darstellung jedes nicht angedockten Schiffs des Systems samt Eigentümerfarbe; Liegeplätze am Dock | – | VE-NPC-KI, Spawns, Respawn, Piratenbeute (eigene Wirtschaft) |
| 5. Zielauswahl / Annäherung / Orbit / Andocken | Anflug, Andocksequenz mit Radius/Tempo im Kern; Zielwahl nur über feste Knöpfe | Antippen, Klammern, Aufschalten, Orbitmenü | Antippen + Klammern + „erst wählen, dann bestätigen“ (UX06) | Trefferprüfung als reine Geometrie in `raum-szene.js` | **Orbit** und Aufschalten: im Kern nicht vorhanden, daher nicht vorgetäuscht |
| 6. Bergbau / Frachtraum | Kernbergbau mit Vorfinanzierung: Eis/Erz (Aldera), Silizium (Nadir: `siliconMineStart`/`siliconSell`), Ladung je Schiff | Bergbaulaser-Strahl, Brockenerschöpfung/Regeneration sichtbar | Felddarstellung mit Vorrat, Förderanzeige, Ring bei jeder geförderten Einheit | Bedienung an Dock/Feld des Kerns gebunden | Regenerierende Brocken, Erzverkauf mit VE-Preisen |
| 7. Waffen / Schilde / Kampf | Nur virtuelles F8-E-Training (Projektile, Trainings-HP, nicht im Save) | Schild/Panzer/Hülle, Module, Treffer- und Explosionseffekte, Kampfton | Drohne, Projektile und Trainings-HP-Bogen im Raumbild | Ausdrücklich als „virtuell/Training“ beschriftet | Echte Schäden, Beute, Kopfgeld, Versicherung, Reparaturkosten (nicht freigegeben) |
| 8. Stationen / Handel / Fitting | Dock als Flugzustand; Stationslager im Kern; `legacy-station`/`legacy-fitting` nur Vorschau ohne Core | Stationsansicht mit Markt, Lager, Fitting, Werft | Dockkarte „Stationsdienste“ nur mit real vorhandenen Kernaktionen | – | VE-Markt, Fitting, Werft, Versicherungen (eigene Geldschöpfung/Preise) |
| 9. Spielerstandort / Schiffwechsel / Konzern | J5: lesende Konzernansicht derselben Sitzung; fester Jäger als einziges Spielerschiff; kein Standort im Kern | Ein Pilot = ein Schiff, Schiffskauf in der Werft | Konzernwechsel aus J5 unverändert genutzt | Schiffwechsel nur am selben Dock, ohne Zustandsänderung | Pilotenprofile/XP, NAS-/PHP-Speicher, WebRTC-Multiplayer |

## 2. Integrationsstrategie

1. **Keine neue Welt, keine neue Seite:** Das Raumcockpit ist die dritte Ansicht der bestehenden Regel204-Sitzung (`prototypes/j4c`). Steuerpult, Raumcockpit und Konzernansicht lesen dasselbe `welt`/`weltzustand`-Objekt.
2. **Ein Befehlsweg, ein Zeitweg:** `app.js` bündelt alle Kernaufrufe in `weltBefehl()` (einziges `welt.execute`) und `weltSchritte()` (einziges `welt.teilschritt`). Das Cockpit kennt den Kern nur über diese Brücke.
3. **Ansicht = Projektion:** `raum-szene.js` erzeugt je Bild eine eingefrorene Szene aus dem Weltzustand und bildet Eingaben auf vorhandene Befehle ab. Lehnt der Kern ab, wird seine Begründung angezeigt.
4. **Echtzeit ohne Zeitabhängigkeit der Regeln:** `requestAnimationFrame` bestimmt nur, wie viele ganze Flugschritte ausgeführt werden (1×/10×/60×/300×). Zwischen zwei Schritten wird die Position nur zeichnerisch interpoliert.
5. **Bestehendes bleibt:** Alle bisherigen IDs, Knöpfe, Tests und der Save-/Importweg sind unverändert; `index.html`/`aphros-void.html` (W0–W5, NAS) sind byteidentisch.

## 3. Übernommene Gameplay-Funktionen

- Grafische Weltraumansicht des Systems: Station mit Dockradius und Liegeplätzen, Siliziumfeld mit Kernvorrat, Patrouillenbojen, alle fliegenden Schiffe, Radar, Randpfeile zu Station/Auswahl/offener Boje.
- Flug des **tatsächlich für 900 ISK gekauften Jägers** `sh023` in Echtzeit: Abdocken (40 ISK Flugreserve), Autopilot zu Objekt oder frei getipptem Raumpunkt, Handflug per Steuerknüppel oder Tastatur, Stopp, Andocken.
- Zielauswahl durch Antippen der Leinwand oder über die Objektliste; Flug erst nach Bestätigung.
- **Bergbau** mit dem gekauften Miner `sh022`: Siliziumauftrag am Dock, Flug ins Feld, Förderung durch den Kern, Verkauf am Dock.
- **Schiffwechsel** zwischen eigenen Schiffen am selben Dock; **Stationsansicht** mit Lager (als Fremdbestand gekennzeichnet) und den vorhandenen Diensten.
- Patrouille (J4d) und virtuelles Duelltraining (J4e) aus dem Raumbild heraus; Fortschritt bleibt beim Ansichtswechsel erhalten.
- Wechsel **Raumcockpit ↔ Konzern & Flotte ↔ Steuerpult** ohne Verlust von Position, Geld, Waren, Eigentum und Spielzeit; verdeckte Ansichten simulieren nie weiter.
- JSON-Export aus dem Raumcockpit; zusätzlich **Flugschreiber** (Schrittindex + Kernbefehl) für ein bitgleiches Replay.

## 4. Spielbare Bedienfolge

1. Root-Seite öffnen → **„Jäger selbst fliegen · Patrouille & Duell“**.
2. **„Finanzierten Beispieljäger (Seed 42) starten“** (oder eigenen Regel204-Stand importieren).
3. Oben **„Raumcockpit · Grafik“** antippen. Die Dockkarte zeigt Station Nadir.
4. Optional **„Patrouille beginnen“**, dann **„Abdocken“**. Die Weltzeit läuft sichtbar (Standard 10×).
5. Boje auf der Leinwand antippen → **„Anfliegen“**. Oder leeren Raum antippen → **„Hierhin fliegen“**. Oder den **Steuerknüppel** unten links ziehen. Zwei Finger bzw. **− / +** zoomen.
6. Im freien Flug **„Duelltraining“** → Drohne anfliegen → **„Ausrichten“** → **„Feuer (Training)“**.
7. **„Konzern & Flotte“**: Flug pausiert, gleiche Kasse und Weltzeit. **„Zum gleichen Raumcockpit zurück“**.
8. **„Andocken“**. Nach der Abrechnung der Flugreserve hält die Zeit im Dock von selbst an.
9. In der Dockkarte **„Miner sh022 · Steuerung übernehmen“** → **„Siliziumauftrag annehmen“** → **„Abdocken“** → in der Liste **„Siliziumfeld Nadir“** → **„Anfliegen“** → mit **300×** fördern (8/8) → **„Andocken“** → **„Geförderte Charge verkaufen“**.
10. **„Geprüften JSON-Spielstand exportieren“** (kein Autosave).

Gemessene Geldflüsse der Siliziumrunde im Seed42-Stand (unveränderte Kernregel): `house` −11 ISK, `pilot_house` +203 ISK, `st_nadir` −192 ISK, 83 Spielminuten, Feldvorrat danach 0. Weltgeld 33.000 ISK, Mint/Burn 0.

## 5. Geänderte Dateien

| Datei | Änderung |
|---|---|
| `prototypes/raum/raum-szene.js` (neu) | Lesende Szene, Kamera, Tipp-Treffer, Knüppel, Befehlsabbildung, Schiffwechselregel, Zeitgeber |
| `prototypes/raum/raum-grafik.js` (neu) | Dekorative Canvas-2D-Grafik aus Void Echoes |
| `prototypes/raum/raum-cockpit.js` (neu) | Ansicht: Bildschleife, HUD, Touch-/Zeiger-/Tastatureingabe |
| `prototypes/raum/raum.css` (neu) | Layout, Touchflächen ≥ 48 px, Hoch-/Querformat, Safe Areas |
| `prototypes/j4c/app.js` | Dritte Ansicht, `weltBefehl`/`weltSchritte`, Flugschreiber, Brücke; Patrouille/Duell/Export als wiederverwendbare Funktionen |
| `prototypes/j4c/index.html` | Umschalter, Abschnitt `#raumbereich`, Einbindung der vier Dateien |
| `tests/raum-szene.test.mjs` (neu) | 10 Node-Tests |
| `tests/raum-cockpit-browser.cjs` (neu) | Browserabnahme vier Touchgrößen + ohne Canvas |
| `.github/workflows/j4e-public-smoke.yml` | Neue Pfade und Testschritte |
| `docs/RAUM1_GRAFISCHES_RAUMCOCKPIT.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md` | Dokumentation |

Unverändert: Weltkern, Flugkern, alle Regel-/Preisdaten, Speicherformat, `beispiel-jaeger-seed42.json`, `index.html`, `aphros-void.html`, `versionen/`.

## 6. Ausgeführte Tests (lokal, Node v22.23.4, 15.11.2026)

| Prüfung | Ergebnis |
|---|---|
| `node --test tests/*.test.mjs` | **256/256** bestanden, 0 Fehler, 0 übersprungen (246 bestehende + 10 neue) |
| `node scripts/build-w5-singlefile.mjs --check` | `W5_SINGLEFILE_OK` – Root-/NAS-HTML unverändert reproduzierbar |
| `tests/raum-szene.test.mjs` | Projektion mutationsfrei; Einstiegsschutz; Jägerflug + Patrouille; Bildraten-/Zeitraffer-Unabhängigkeit, Save/Load mitten im Flug, Journal-Replay; Schiffwechsel; Siliziumrunde mit Geld-/Waren-/Eigentumsbilanz; Befehlsweißliste; Geometrie; statische Prüfungen |
| `tests/raum-cockpit-browser.cjs`, **Chromium** | 1180×820, 1024×768, 820×1180, 390×844 bestanden; Fallback ohne Canvas bestanden. Exportierter Stand in jeder Größe **bitgleich** zum Node-Replay des Flugschreibers |
| `tests/j4e-duell-browser.cjs`, `tests/j4e-sicherheits-browser.cjs`, **Chromium** | je 4/4 Größen bestanden (keine Regression) |

**Nicht ausgeführt:** WebKit (lokal nicht installiert; läuft erst in der CI dieses PRs über `j4e-public-smoke.yml`), echtes iPad Safari, NAS-Auslieferung, GitHub-Pages-Deploy. Keine neuen 13×90-/365-Tage-Szenarien, weil keine Wirtschaftsregel geändert wurde; die bestehenden Matrizen laufen in der Gesamtregression mit.

## 7. Offene Probleme und Grenzen

- **Kein NPC-Verkehr im Beispielstand:** Der Kern bewegt NPC-Schiffe nur über Pendelaufträge; in Seed42 ruhen alle 23 Schiffe. Die Darstellung fliegender Fremdschiffe ist vorhanden, aber nur über die Szenenprojektion geprüft, nicht mit echtem NPC-Flug.
- **Spielerstandort fehlt im Kern.** Der Schiffwechsel ist deshalb eine reine Steuerungswahl am selben Dock. Die sechs eigenen Aldera-Miner sind vom Nadir-Start aus nicht erreichbar.
- **Nadir-Frachter `sh021` darf laut Kern nicht frei fliegen** (nur freie Aldera-Frachter). Das Cockpit zeigt die Ablehnung an.
- **Siliziumfeld endlich:** eine Charge im Beispielstand; danach lehnt der Kern weitere Aufträge ab.
- **Regel195-Hauptspiel und Regel204-Sitzung bleiben getrennt**; kein Autosave der Regel204-Sitzung, Laden/Import nur im Steuerpult.
- Kein Orbit, kein Aufschalten, kein Handel/Fitting, keine echten Kampfschäden – jeweils mangels freigegebener Kernregel.
- Zeitraffer 300× führt bis zu 900 Kernschritte je Bild aus; auf einem echten iPad ungemessen.
- Der Flugschreiber fasst höchstens 50.000 Befehle und meldet danach `vollstaendig:false`.

## 8. Nächste Integrationsschritte

1. CI dieses PRs abwarten (WebKit, vier Größen), danach Abnahme auf echtem iPad Safari im Hoch- und Querformat.
2. Produktentscheidung **Spielerstandort** (Station/Schiff als Kernzustand) – Voraussetzung für Schiffwechsel über Systeme und eine echte Stationsansicht.
3. Raumcockpit zum Standard-Einstieg der Jägerseite machen und das Steuerpult als Fallback behalten; Laden/Import ins Raumcockpit holen.
4. Aldera als zweites spielbares System: Eis-/Erzfelder und Abflugtor sind in der Szene bereits abgebildet; nötig ist ein regelkonformer Weg des Spielers dorthin.
5. NPC-Verkehr sichtbar machen, sobald ein Stand mit laufenden Pendelaufträgen vorliegt; dann die Darstellung mit echtem Fremdflug testen.
6. Frachterflug in Nadir und Orbit nur nach eigener Kernregel mit Freigabe.
