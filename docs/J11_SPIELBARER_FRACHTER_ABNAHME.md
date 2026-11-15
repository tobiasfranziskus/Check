# J11 · persönlich spielbarer Frachter [DRAFT]

**Ursprungsbericht des Codex-Drafts [#378](https://github.com/tobiasfranziskus/Check/pull/378)**, getestet auf `main 17090ec6a55087f476fc23e3850605e38cfabf36`. Die nachfolgende P1+J11-Integration überführt die geprüften produktiven JS- und Testdateien auf den neueren [MAIN] `650504f2`. In diesem Integrationsbranch **noch kein Merge/Deploy**, kein produktiver Save-Zugriff. Roadmap/Projektstatus bleiben zur Koordination durch ChatGPT unverändert.

## Spielbarer Umfang

In `prototypes/verbund/konzern.html` ausdrücklich eine geprüfte Regel195-Kopie oder einen Regel204-Export öffnen. Einen vorhandenen Aldera-Frachter für **750 ISK** aus eigenem Hausgeld kaufen; die Original-Kaufbelege, Lagerentnahme und Schiffseigentum prüft der unveränderte Core. Persönlich fliegen öffnet das vorhandene RAUM-1-Canvas in derselben laufenden Konzernsitzung. Abdocken bindet **40 ISK** Original-Flugreserve; bezahlte Flugminuten und Rückgabe der Restreserve erfolgen im Core. Zielwahl, Handflug und physisches Docken benutzen Originalbefehle.

Schiffwechsel setzt angehaltene Flugzeit, dasselbe physische Dock, abgeschlossene Vertragskonflikte und abgerechnete Flugreserve voraus. Der Dockwechsel im Cockpit aktualisiert jetzt auch den Controller der Konzernsitzung. Jägerkaufbelege und Miner-Pendelkonflikte bleiben geschützt.

Die Oberfläche bietet **F4 `shipFreightIce`** sowie **F6 `shipGateCheck`/`shipFreightGateIce`** mit Vorschau auf einer auditierten Kopie und erneuter Originalprüfung bei Ausführung. Keine Preise oder Reserven werden im Produkt neu berechnet. Torbelege brauchen weiterhin einen tatsächlich bezahlten Anflug und danach physische Rückkehr zum Aldera-Dock. F4 benötigt echte 50 Eis im Quelllager und vollständig zahlungsfähige Vertragspartner. Ein reproduzierbarer Weg ist: Frachter und Miner kaufen, Original-Eispendel des eigenen Miners starten und 120 Wirtschaftsminuten ausführen. Danach im Frachtercockpit den F4-Vertrag annehmen; Zeit starten oder in der Konzernansicht fortschreiben. Die Vertragsrunde dauert 120 Minuten, zahlt 120 ISK Pilotenlohn und 240 ISK Frachtentgelt aus bestehenden Konten.

## Nachgewiesene Core-Grenzen / fachliche Blocker

* Freiflug nur für leere, ungebundene Spielerfrachter in **Aldera**. Der rechtmäßig gekaufte Nadir-Frachter wird nicht für freien Flug freigeschaltet.
* `welt-kern.js` lässt `shipSteer` für belegte F4-Transits zur Flugprüfung durch. `flug2d/flug-kern.js:steuerbarerTransit` begrenzt das Manöver jedoch ausdrücklich auf Regel199/200. In **Regel204** lehnt der Original-Flugkern es mit „Schiff ist nicht im freien Flug“ ab. Deshalb keine Handsteuerung, freie Zielwahl oder Dockbefehle während der Vertragsfahrt. Das Cockpit zeigt diese Grenze; Transport und bezahlte Lieferung laufen im Originalkern. Im Transit zeigt das Cockpit die tatsächlich gebundene Vertragslohnreserve aus `w5n_fracht_arbeit`, beim Freiflug die bestehende Flugdienstreserve. Keine Umgehung oder Änderung am Wirtschaftskern/Flugkern.
* Keine neue frei wählbare Warenroute, kein Nadir-Systemwechsel im Freiflug, keine Änderung der NPC-K7-Industriepolitik.
* Der Pilot ist wie in J9 ein nicht gespeicherter Controllerzustand. Nach Import ist die Wiederaufnahme eines einzelnen eigenen Schiffs im Flug möglich; bei mehreren eigenen Schiffen verlangt eine neue Auswahl grundsätzlich Dockzustand. Vertragsfortschritt bleibt in der Konzernansicht möglich. Kein erfundener Pilotenort und keine Save-Migration.
* Echter iPad-Safari-/privater NAS-Gerätetest weiterhin offen. Statische HTTP-Auslieferung und WebKit-CI sind keine Geräteabnahme.

## Tatsächlich ausgeführte Prüfungen

* Node22.23.4: drei neue J11-Tests erfolgreich, darunter echter Lagerkauf, Fluglohn/Rückerstattung, Ziel-/Dockbefehle, drei Seeds, bitgleicher Original-Core-Replay, F4-Hin-/Rückfahrt mit 50 realen Eis, Vertragsablehnungen, Geld-/Kaufbeleg-/Eigentumsschutz und JSON-Roundtrip. Unterfinanzierung wird am Original-Core geprüft; manipulierte Finanzierung wird beim Import abgelehnt.
* Chromium (lokaler Systembrowser): je **1180×820, 1024×768, 820×1180, 390×844**, echte Regel195-Kopie, 750-ISK-Frachterkauf, persönliches Cockpit, 40-ISK-Flugreserve, JSON-Export und unabhängiges Laden/Audit im Node-Core; zusätzlicher legal erzeugter F4-Vorbereitungsstand pro Größe, Vertragsannahme im Cockpit, 50 Eis an Bord und gesperrte Transitsteuerung. Keine JavaScript-Seitenfehler. Die archivierten Original-Screenshots bleiben im [Codex-Forschungsbranch](https://github.com/tobiasfranziskus/Check/tree/feature/j11-spielbarer-frachter-f6/docs/j11-screenshots); zusätzlich existieren die unten verlinkten GitHub-Actions-Artefakte. Der Integrationsbranch enthält bewusst keine verdoppelten Binär-Screenshots.
* Vollständige Suite `node --test tests/*.test.mjs` mit Node22.23.4: **296/296 Tests, 0 Fehler, 0 Skips**, 187,163 Sekunden auf dem abschließenden Code-Stand `30402530e8cd1e2067c8acb9983a4bfcd413cc29`. Einschließlich bestehender deterministischer Wirtschafts-/Waren-/Schiffs-/Eigentumsaudits, Jäger-/Miner-/F6-/Save-/Schema-/Root-/NAS-Regressionen und 13×90-Bestandsprüfungen. Zwei frühere redundante lokale Suite-Anläufe wurden beendet und zählen nicht als bestanden.
* Bestehender J9-Miner-Browser: Chromium 1180×820, 820×1180, 390×844 erfolgreich. `node scripts/build-w5-singlefile.mjs --check`: `W5_SINGLEFILE_OK`, 328726 Zeichen, 7 Styles, 15 Scripts, Pages-Navigation geprüft. Zusätzlicher Negativcheck: erneuter Frachterkauf bei leerem Aldera-Lager abgelehnt, Export bytegleich.
* **Abschließender geprüfter Code-Commit `30402530e8cd1e2067c8acb9983a4bfcd413cc29`**, [Draft-PR #378](https://github.com/tobiasfranziskus/Check/pull/378). [Node22-/Root-/NAS-/Touch-/Speicher-CI #43710682810](https://github.com/tobiasfranziskus/Check/actions/runs/43710682810): completed/success. [Browser-CI #43710682788](https://github.com/tobiasfranziskus/Check/actions/runs/43710682788): completed/success, **Chromium und WebKit je vier J11-Touchgrößen** einschließlich der tatsächlichen 120-ISK-Vertragslohnreserve; vorhandene Jäger-/Miner-/RAUM-/J7–J10b-/Sicherheitsbrowser ebenfalls erfolgreich. [JavaScript-/Wirtschafts-CI #43710682765](https://github.com/tobiasfranziskus/Check/actions/runs/43710682765): completed/success; der bedingte Job `sicherheitsgeografie-vergleich` war **skipped**, daher nicht als ausgeführt gewertet.
* CI-Screenshots (je acht PNG: vier Größen, Freiflug/Vertragsfahrt): [Chromium-Artefakt](https://github.com/tobiasfranziskus/Check/actions/runs/43710682788/artifacts/14160312893), ZIP-Digest `sha256:1de3316b49adbf09a5362e7f2a83e469e6094ed5f10d0050053e81832977b006`; [WebKit-Artefakt](https://github.com/tobiasfranziskus/Check/actions/runs/43710682788/artifacts/14160243220), ZIP-Digest `sha256:f02973efaf2dc6e8c66c84a5a22c538f1e2b274f7b5c41c5a311eb9a8ac52817`. Zusätzlich acht lokal erzeugte Chromium-PNG dauerhaft im Repository. CI-Artefakte laut GitHub bis 13.02.2027 verfügbar.
* WebKit lokal nicht ausgeführt: Browser fehlt, Download von Playwright-/Microsoft-CDNs scheitert mit HTTP403 „Domain forbidden“. Die tatsächliche WebKit-Abnahme erfolgte stattdessen erfolgreich in der oben verlinkten GitHub-CI. Kein lokaler WebKit-Erfolg behauptet.

## Deterministische Referenzen

| Nachweis | Seed | Hash |
| --- | --- | --- |
| Kauf + 120 Flugschritte + Original-Dockbefehl + 180 Schritte, Reserve abgerechnet | 42 | `ece830a2e4a013ba` |
| gleicher Ablauf | 7 | `1bf2043f7ad3e15e` |
| gleicher Ablauf | 3301 | `09d0cd4b04ff308b` |
| F4 mit eigenem Eispendel, Start Tick120, 7200 Flugschritte bis Tick240 | 42 | `e4514490aedc13bd` |
| Browser-F4 unmittelbar nach Annahme bei Tick120 | 42 | `62d7ead262a534a7` |

Weltgeld in den geprüften J11-Abläufen **33.000 ISK**, Mint/Burn **0**. Browser-Freiflughashes variieren mit der tatsächlichen Zahl der UI-Schritte; die Node-Referenzen benutzen eine feste Befehlsfolge. Kein W6-Nachhaltigkeitsnachweis durch diese begrenzten Spieltests.

Die ursprünglich von Codex geprüfte Lieferung ergänzt nach den grünen Prüfungen ausschließlich diesen Abnahmebericht. Eine eigenständige P1+J11-Gesamtabnahme auf dem neuen main-Basisstand wird separat in der Integrations-PR dokumentiert. Autoritativer Wirtschafts-/Flugkern, `index.html`, `aphros-void.html`, Regel195/204, Schema8, Roadmap und Projektstatus sind gegenüber der Basis unverändert. Kein Merge oder Deployment; ursprüngliche Spielstände nicht angefasst.
