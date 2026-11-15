# J11 · persönlich spielbarer Frachter [DRAFT]

Basis: `main 17090ec6a55087f476fc23e3850605e38cfabf36`, Branch `feature/j11-spielbarer-frachter-f6`. Kein Merge, Deploy oder Zugriff auf produktive Saves. Roadmap/Projektstatus bleiben zur Koordination durch ChatGPT unverändert.

## Spielbarer Umfang

In `prototypes/verbund/konzern.html` ausdrücklich eine geprüfte Regel195-Kopie oder einen Regel204-Export öffnen. Einen vorhandenen Aldera-Frachter für **750 ISK** aus eigenem Hausgeld kaufen; die Original-Kaufbelege, Lagerentnahme und Schiffseigentum prüft der unveränderte Core. Persönlich fliegen öffnet das vorhandene RAUM-1-Canvas in derselben laufenden Konzernsitzung. Abdocken bindet **40 ISK** Original-Flugreserve; bezahlte Flugminuten und Rückgabe der Restreserve erfolgen im Core. Zielwahl, Handflug und physisches Docken benutzen Originalbefehle.

Schiffwechsel setzt angehaltene Flugzeit, dasselbe physische Dock, abgeschlossene Vertragskonflikte und abgerechnete Flugreserve voraus. Der Dockwechsel im Cockpit aktualisiert jetzt auch den Controller der Konzernsitzung. Jägerkaufbelege und Miner-Pendelkonflikte bleiben geschützt.

Die Oberfläche bietet **F4 `shipFreightIce`** sowie **F6 `shipGateCheck`/`shipFreightGateIce`** mit Vorschau auf einer auditierten Kopie und erneuter Originalprüfung bei Ausführung. Keine Preise oder Reserven werden im Produkt neu berechnet. Torbelege brauchen weiterhin einen tatsächlich bezahlten Anflug und danach physische Rückkehr zum Aldera-Dock. F4 benötigt echte 50 Eis im Quelllager und vollständig zahlungsfähige Vertragspartner. Ein reproduzierbarer Weg ist: Frachter und Miner kaufen, Original-Eispendel des eigenen Miners starten und 120 Wirtschaftsminuten ausführen. Danach im Frachtercockpit den F4-Vertrag annehmen; Zeit starten oder in der Konzernansicht fortschreiben. Die Vertragsrunde dauert 120 Minuten, zahlt 120 ISK Pilotenlohn und 240 ISK Frachtentgelt aus bestehenden Konten.

## Nachgewiesene Core-Grenzen / fachliche Blocker

* Freiflug nur für leere, ungebundene Spielerfrachter in **Aldera**. Der rechtmäßig gekaufte Nadir-Frachter wird nicht für freien Flug freigeschaltet.
* `welt-kern.js` lässt `shipSteer` für belegte F4-Transits zur Flugprüfung durch. `flug2d/flug-kern.js:steuerbarerTransit` begrenzt das Manöver jedoch ausdrücklich auf Regel199/200. In **Regel204** lehnt der Original-Flugkern es mit „Schiff ist nicht im freien Flug“ ab. Deshalb keine Handsteuerung, freie Zielwahl oder Dockbefehle während der Vertragsfahrt. Das Cockpit zeigt diese Grenze; Transport und bezahlte Lieferung laufen im Originalkern. Keine Umgehung oder Änderung am Wirtschaftskern/Flugkern.
* Keine neue frei wählbare Warenroute, kein Nadir-Systemwechsel im Freiflug, keine Änderung der NPC-K7-Industriepolitik.
* Der Pilot ist wie in J9 ein nicht gespeicherter Controllerzustand. Nach Import ist die Wiederaufnahme eines einzelnen eigenen Schiffs im Flug möglich; bei mehreren eigenen Schiffen verlangt eine neue Auswahl grundsätzlich Dockzustand. Vertragsfortschritt bleibt in der Konzernansicht möglich. Kein erfundener Pilotenort und keine Save-Migration.
* Echter iPad-Safari-/privater NAS-Gerätetest weiterhin offen. Statische HTTP-Auslieferung und WebKit-CI sind keine Geräteabnahme.

## Tatsächlich ausgeführte Prüfungen

* Node22.23.4: drei neue J11-Tests erfolgreich, darunter echter Lagerkauf, Fluglohn/Rückerstattung, Ziel-/Dockbefehle, drei Seeds, bitgleicher Original-Core-Replay, F4-Hin-/Rückfahrt mit 50 realen Eis, Vertragsablehnungen, Geld-/Kaufbeleg-/Eigentumsschutz und JSON-Roundtrip. Unterfinanzierung wird am Original-Core geprüft; manipulierte Finanzierung wird beim Import abgelehnt.
* Chromium (lokaler Systembrowser): je **1180×820, 1024×768, 820×1180, 390×844**, echte Regel195-Kopie, 750-ISK-Frachterkauf, persönliches Cockpit, 40-ISK-Flugreserve, JSON-Export und unabhängiges Laden/Audit im Node-Core; zusätzlicher legal erzeugter F4-Vorbereitungsstand pro Größe, Vertragsannahme im Cockpit, 50 Eis an Bord und gesperrte Transitsteuerung. Keine JavaScript-Seitenfehler. Screenshots unter [j11-screenshots/](j11-screenshots/).
* Vollständige Node22-Suite und bestehende Browserregressionen: Ergebnis wird nach Abschluss ergänzt. Zwei frühere redundante lokale Suite-Anläufe wurden beendet und zählen nicht als bestanden.
* WebKit lokal nicht ausgeführt: Browser fehlt, Download von Playwright-/Microsoft-CDNs scheitert mit HTTP403 „Domain forbidden“. Bestehender CI-Matrixablauf um J11 und Screenshot-Artefakte erweitert; ein bloß konfigurierter Lauf zählt nicht als bestanden.

## Deterministische Referenzen

| Nachweis | Seed | Hash |
| --- | --- | --- |
| Kauf + 120 Flugschritte + Original-Dockbefehl + 180 Schritte, Reserve abgerechnet | 42 | `ece830a2e4a013ba` |
| gleicher Ablauf | 7 | `1bf2043f7ad3e15e` |
| gleicher Ablauf | 3301 | `09d0cd4b04ff308b` |
| F4 mit eigenem Eispendel, Start Tick120, 7200 Flugschritte bis Tick240 | 42 | `e4514490aedc13bd` |
| Browser-F4 unmittelbar nach Annahme bei Tick120 | 42 | `62d7ead262a534a7` |

Weltgeld in den geprüften J11-Abläufen **33.000 ISK**, Mint/Burn **0**. Browser-Freiflughashes variieren mit der tatsächlichen Zahl der UI-Schritte; die Node-Referenzen benutzen eine feste Befehlsfolge. Kein W6-Nachhaltigkeitsnachweis durch diese begrenzten Spieltests.
