# P2 Zielsteuerung [MAIN / PAGES]

Entwicklungsbasis: main `6530dae867b56a98c8157ba5738f2817c1ca87e3`, Issue #410. [PR #421](https://github.com/tobiasfranziskus/Check/pull/421) am 16.11.2026 integriert: [MAIN `d86efe41`](https://github.com/tobiasfranziskus/Check/commit/d86efe41d06d287804b8407d740313c18107fca3). [PAGES #43814267718](https://github.com/tobiasfranziskus/Check/actions/runs/43814267718) `completed/success` für genau diesen Merge-Commit. Die frühere Draft-Übergabechronik bleibt als historischer Testnachweis erhalten. P8b/c/d und Wirtschaftsregeln bleiben unverändert.

Gemeinsames Zielmenü für persönlich übernommene Miner/Frachter/Jäger: Annähern mit Originalbefehl, Orbit mit editierbarem Radius, Folgen mit editierbarem Abstand, Aufschalten/Lösen ohne Waffen und originales Andocken. Eingaben bleiben über HUD-Ticks erhalten. Handflug/Stopp ersetzt Orbit/Folgen unmittelbar; Geschwindigkeit baut der vorhandene Integrator kontinuierlich ab. Fremde Schiffe bleiben ausschließlich Ziele, keine Steuerungsübernahme.

`shipOrbit` (`zielArt`, `ziel` oder Punktkoordinaten, `radius`), `shipFollow` (`ziel`, `abstand`), `shipLock` (`zielArt`, `ziel`) und `shipUnlock` sind validierte Regel204-Flugbefehle. Finanzierung, Eigentumsprüfung, Pendelkonkurrenz und Reserveabrechnung verwenden unverändert den Weltkern und die Pilotensitzung. Keine UI-Physik, zweite Wirtschaft, RNG-Änderung oder Kampfhandlung. Radius-/Abstandswerte: ganze Weltpunkte, vom vorhandenen `punktHalt` bis `raumRadius`.

Der Radialregler kombiniert Distanzfehler und Bremsweg mit Zielgeschwindigkeit. Orbit ergänzt eine aus Original-Schub/Wendigkeit begrenzte Tangentialfahrt. Alles erzeugt nur Sollkurs/Sollfahrt für den Originalintegrator. Ein unerreichbar schneller Kontakt kann nicht eingeholt werden; Anflug und Kurven benötigen Zeit. Keine ideale Formation oder garantierte Distanz bei abrupten Manövern bzw. an Systemgrenzen.

Save-Kompatibilität: keine Schema-/Regelversionsänderung oder Migration. Alte Saves bleiben bytegleich, solange keine neuen Befehle ausgeführt werden. Neue Modi verwenden das vorhandene `ziel` mit streng validiertem Radius/Abstand; `erfassung` ist optional. Neue Saves mit P2-Aktivität benötigen diesen Softwarestand (alte Software kann unbekannte Modi zurückweisen). Ungültige Felder, IDs, Werte und Eigentümer werden abgewiesen. Verlorene Kontakte werden beim nächsten Core-Flugschritt gelöscht; Autopilot geht in gebremsten Halt. Aufschalten ist reine Identitätserfassung, ohne neues Radar-/Reichweiten-/Ausrüstungsbalancing.

## Geprüfte Altcode-Muster

Am Quell-SHA `19c3f792fbad8f21163f2f8550aa2ed7bd09a124` gezielt gelesen: `075-kern-simulation.js` (radiale/tangentiale Orbitrichtung, getrennte `lock`/`unlock`-Aktionen), `270-ve10-04-autopilot.js` (Zielverlust, manuelle Priorität), `370-ux06-auswahl.js` (Auswahl vor ausdrücklichem Befehl), `580-ux01-erweiterung.js` (Pointer-/Pinch-Abbruch). Wiederverwendung der Bedien-/Reglermuster im bestehenden RAUM-Cockpit; keine alte Simulation, Sofortstopps, Warp-, Kampf-, Wirtschafts- oder Save-Implementierung kopiert. Folgen ist neu.

## Dateien und Prüfpfade

- `prototypes/flug2d/flug-kern.js`: Befehle, Regelung, Zielverlust und Save-Audit.
- `prototypes/raum/raum-szene.js`, `raum-cockpit.js`, `raum.css`: lesende Projektion, Zielmenü, native Abstandseingaben, HUD; Zielkarte scrollbar oberhalb der Handflugflächen.
- `prototypes/verbund/konzern-session.js`: Pilotbefehls-Whitelist.
- `tests/p2-zielsteuerung.test.mjs`: Klassen, Radius, bewegte Ziele, Bremsen, Rechte, Save/Replay, Zielverlust und Docken.
- `tests/raum-szene.test.mjs`: neues Zielmenü erwartet; alte Referenzen unverändert. `raum-cockpit-browser.cjs` schließt die geöffnete Zielkarte ausdrücklich vor Leinwandtreffern. `j14-pilot-relogin-browser.cjs` wartet den asynchronen Dateiimport ab.
- `tests/p1-spielstart-browser.cjs`, `.github/workflows/p1-spielstart.yml`: öffentlicher Karriereweg mit Orbit/Folgen/Handübernahme und bestehendem Export/Resume/Importschutz; Chromium/WebKit je vier Größen.

Lokale Browserinstallation scheiterte für beide vorhandenen Playwright-Versionen an netzseitigem HTTP403 (`Domain forbidden`); kein lokaler Browserlauf als bestanden gewertet. Physisches iPad Safari und privates NAS bleiben offen. Übergabe an ChatGPT zur unabhängigen Integrationsabnahme.

## Messungen und verbleibende Grenzen

- Klassenmessung: 6.000 Original-Flugschritte, stationärer Radius 120.000 P; nach Anflug in allen drei Klassen unter 1 % Abweichung. Zusätzlicher isolierter Lauf mit vier Kurswechseln (0/64/128/192), anschließend Orbit um bewegten Frachter: Endabstände Miner 120.057, Frachter 120.035, Jäger 120.190 P.
- Sehr enge Orbits unterliegen der Original-Kurs-/Fahrtquantisierung: beim kleinsten erlaubten Radius 3.200 P maß der Jäger ca. 3.339–3.365 P. Kein Anspruch auf mathematisch exakten Radius oder Distanzhaltung bei physikalisch unerreichbaren Zielen/Systemgrenzen.
- Annähern an ein bewegtes Schiff verwendet weiterhin den vorhandenen `shipFlyTo` auf dessen ausgewählte Position. Für kontinuierliche Bewegung gibt es den neuen Folgebefehl. Siliziumfeld/Tor/Bojen ohne eigene Flugkern-ID werden als feste Orbitpunkte behandelt; Aufschalten bleibt dort mit Begründung gesperrt.
- Kein Konvoi-/Eskortvertrag, keine Kampf-/Waffenfreigabe, kein NPC-Missionssystem. Echte iPad-Tastatur, Safari-Gerät und privater NAS-Server wurden nicht getestet.

## Prüfprotokoll

PR: [#421](https://github.com/tobiasfranziskus/Check/pull/421). Letzter Produktcode-Commit: `559101ca6e9022939217ad65263eefcff3eda54a`; danach ausschließlich Browser-Testkorrekturen. Abnahme-Head: `237036ed59bd5ac3b3a3de3f4789001b032d2027`.

Lokale Node22-Ausführung: `node --test tests/*.test.mjs` nach freigegebenem Kindprozesszugriff **360/360**, keine Fehler/Skips; dieser Lauf begann noch vor Ergänzung des fünften P2-Tests. Der vollständige CI-Lauf auf `65780a0` enthält **361/361** inklusive aller fünf neuen Tests, 0 Fehler/Skips ([#43809805553](https://github.com/tobiasfranziskus/Check/actions/runs/43809805553)). Gezielt am letzten Produktcode: P2 **5/5**, RAUM **10/10**. Root-/NAS-Build: `node scripts/build-w5-singlefile.mjs --check` → `W5_SINGLEFILE_OK`, 328.726 Zeichen, 7 Styles, 15 Scripts. `git diff --check` sauber.

Die ersten lokalen Sandbox-Läufe scheiterten ausschließlich bei Git-Kindprozessen (`EPERM`): Standardlauf 71/73 Dateisuites, Isolationsdiagnose 357/360 Tests. Sie gelten nicht als grün; die oben genannte vollständige Wiederholung mit Kindprozesszugriff bestand. Lokale Chromium-/WebKit-Binaries konnten wegen netzseitigem HTTP403 nicht installiert werden; Browsernachweise stammen ausschließlich aus GitHub Actions.

Erster CI-Head `65780a0`: P1 Chromium/WebKit jeweils 4/4 Touchgrößen grün, W5-RC1 inklusive IndexedDB/JSON-/Einzeldatei-Touch und NAS-Auslieferung grün; J4e fand die größere Zielkarte über einer Boje. Korrektur `559101c`: Zielkarte intern scrollbar, Handsteuerung frei; Leinwandtest schließt das bewusst offene Menü. Zwei weitere Test-Rennen wurden korrigiert: J14-Dateiimport vor Sichtbarkeitsprüfung abwarten (`d5ca189`); neuen NPC-Touchschritt als retryfähiges `locator.tap()` ausführen (`237036e`). Fehlgeschlagene Vorläufe sind keine bestandene Abnahme.

Unveränderte Originalreferenzen aus vollständiger CI: J11 Seed42 `ece830a2e4a013ba`, Seed7 `1bf2043f7ad3e15e`, Seed3301 `09d0cd4b04ff308b`; F4 `e4514490aedc13bd`; finanziertes Jägerbeispiel `daec00c7618a6cd7` (SHA256 `e93d504f49c3cc5cdd78a2320d8d5de23eb2b8e22955a9de953b1a2699c1a800`); W6/P6 S02×90 `686355895f27fbb8`. Keine Referenzwerte ersetzt. Browser-Karriere-Endhashes sind wegen realzeitgesteuerter Eingabeschritte keine Seed-Referenz; Core-Save/Replay wird separat deterministisch geprüft.

### Abschließende CI-Abnahme auf `237036e`

| Ebene | Tatsächliches Ergebnis | Nachweis |
| --- | --- | --- |
| Node22-Gesamtsuite | **361/361**, 0 Fehler, 0 Skips; alle fünf P2-Tests enthalten | [CI 43810603589](https://github.com/tobiasfranziskus/Check/actions/runs/43810603589) |
| Historische Wirtschaft/Originalreferenzen | v10/v11/v12/v13/v14 und Geografievarianten erfolgreich; 13×90-/Audit-/Replay-Schritte gemäß Workflow | derselbe CI-Lauf; bedingter Sicherheitsgeografie-Paarvergleich **skipped**, ausdrücklich nicht bestanden |
| Öffentliche Karriere + P2 | Chromium **4/4**, WebKit **4/4**: Root → regulärer Kauf → eigene Übernahme → Orbit/Folgen/Aufschalten → Handübernahme → Export/Resume → ungültiger Import; zusätzlich Original-F4-/Projekt-/W6-Pfade | [P1 43810603583](https://github.com/tobiasfranziskus/Check/actions/runs/43810603583) |
| Bisheriges Cockpit/Touch/Replay | Chromium und WebKit erfolgreich: Leinwandtipp, Zoomtasten, Joystick, Konzernpause, Save-/Replay, Siliziumrunde, grafikloser Fallback sowie J6–J11 und historische Altzugänge | [J4e 43810603575](https://github.com/tobiasfranziskus/Check/actions/runs/43810603575) |
| Import/Wiederaufnahme | J14 Chromium **4/4**, WebKit **4/4**, ursprünglicher legal finanzierter Mehrschiffstand | [J14 43810604577](https://github.com/tobiasfranziskus/Check/actions/runs/43810604577) |
| Root-/NAS-Einzeldatei, Alt-Speicher | Node, vier Touchgrößen mit IndexedDB/JSON/Manipulationsschutz, Standalone-HTML-Touch und Einzeldatei-Auslieferung erfolgreich | [W5-RC1 43810603561](https://github.com/tobiasfranziskus/Check/actions/runs/43810603561) |

Browsergrößen jeweils 1180×820, 1024×768, 820×1180 und 390×844. Statische HTTP-/Einzeldatei-Prüfung ist kein Deploy und kein Zugriff auf das private NAS. Zweifinger-Pinch, echte virtuelle iPad-Tastatur, Hintergrund/Resume auf physischem Safari und echter NAS-Server bleiben **offen**; eine frühere Fortschrittsmeldung fasste den belegten Zoomtastentest zu weit als Pinch zusammen. Keine Geräteabnahme aus Browseremulation ableiten.

Übergabe: Draft #421 gegen unveränderten main, kein Merge/Pages-/NAS-Deploy. Dieser Bericht wird in einem reinen Dokumentationscommit nach dem geprüften Abnahme-Head ergänzt; Produkt- und Testdateien bleiben dabei identisch. ChatGPT soll die Integration unabhängig abnehmen, insbesondere enge Orbits, Systemgrenzen, die scrollbare Zielkarte und reale iPad-Bedienung.

## Unabhängige ChatGPT-Integrationsabnahme · 16.11.2026

**Prüfumfang:** tatsächlich aktueller `main 6530dae867b56a98c8157ba5738f2817c1ca87e3`, Regel- und Roadmap-Vorgaben, gesamter P2-Code-Diff, unveränderte Finanzierungs-/Eigentumsbrücke, P2-Save-/Zielvalidierung, Touch-Zielkarte sowie die GitHub-Actions-Jobresultate. Lokale unabhängige Node-/Browserausführung in der ChatGPT-Umgebung war wegen fehlendem GitHub-DNS-Zugriff auf den Quellcheckout nicht möglich; die GitHub Actions sind reale externe Ausführungen, keine von ChatGPT lokal durchgeführten Tests.

**Unabhängig ergänzte QA:** `d861fab` ergänzt einen browserbasierten Test zweier gleichzeitiger Touch-Pointer, Pinch-out, Pointer-Cancel und ausbleibender irrtümlicher Zielauswahl auf allen vier Touchgrößen. Sein erster P1-Lauf [#43813366963](https://github.com/tobiasfranziskus/Check/actions/runs/43813366963) scheiterte in beiden Engines an der Testinstrumentierung (die öffentliche P1-Karriere hält die Cockpit-Instanz lokal statt unter `RaumCockpit.sitzung`). Dies war **kein bestandener Lauf**. Der reine Testkorrekturcommit `5b5d6b3d33e7ecc2280c3f3b4f7c6189a5acb873` bindet die vorhandene lesende Cockpit-Prüf-API nur innerhalb des Browser-Tests; kein Produktcode wurde dabei geändert.

**Alle fünf Workflows am vollständig geprüften Testcode `5b5d6b3` erfolgreich:**

- [Node22 / JS-Regressionssuite #43813671495](https://github.com/tobiasfranziskus/Check/actions/runs/43813671495) – `completed/success`, 361/361.
- [P1 / neue P2-Pinch-Prüfung #43813671348](https://github.com/tobiasfranziskus/Check/actions/runs/43813671348) – `completed/success`, Chromium/WebKit je vier Touchgrößen, inklusive regulärer Karriere und Altpfade.
- [J4e / Root, Jäger, Touch, Save #43813671321](https://github.com/tobiasfranziskus/Check/actions/runs/43813671321) – `completed/success`, beide Engines.
- [J14 / Mehrschiff-Reload #43813671442](https://github.com/tobiasfranziskus/Check/actions/runs/43813671442) – `completed/success`, beide Engines.
- [W5-RC1 / Save, NAS-Einzeldatei, Touch #43813671488](https://github.com/tobiasfranziskus/Check/actions/runs/43813671488) – `completed/success`.

Backup vor einer Integration: [`backup/main-before-p2-zielsteuerung-20261116`](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-p2-zielsteuerung-20261116) auf exakt `6530dae`. Nur die Browser-Pointeremulation ist neu nachgewiesen; **physisches iPad Safari (inkl. tatsächlichem Multi-Touch, Tastatur/Hintergrundzustand) und privater NAS-Server bleiben offen**. Ein bedingt übersprungenes Geografie-Gate wird weiterhin nicht als bestanden gewertet. Dieses Dokument ist der Vor-Merge-Abnahmebericht; tatsächlicher Merge und Pages-Ergebnis sind getrennt im Projektstatus zu belegen.
