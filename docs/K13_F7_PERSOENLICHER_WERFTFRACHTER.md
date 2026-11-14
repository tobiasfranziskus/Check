# K13/F7 – persönlich nutzbarer, bezahlter Werftfrachter

**[DRAFT / OPTION · 14.11.2026]** [Draft-PR #331](https://github.com/tobiasfranziskus/Check/pull/331). Umsetzung von [Issue #330](https://github.com/tobiasfranziskus/Check/issues/330), Basis des Integrationsbranches `integration/k13-f6-spielwirtschaft-20261113`: `2a2422f88aad360fe05ed8bbd2a40559ab9c3632`. `main` geprüft: `04124f2bca27dc33b54be30c07b6a7bbb7387e81`. Kein Merge, Deployment oder Produktregelbeschluss.

## Core-Vertrag

Nur das eingefrorene API-Objekt von `Welt.erstellenK7()` enthält `f7Werftfrachter: true`. Das Merkmal ist kein gespeichertes Zustandsfeld. Regel199 erhält es nicht.

```js
welt.execute(s, {type:'shipBuy', owner:'house', klasse:'frachter', station:'st_nadir'});
welt.kern.pilotW5TransferKalkulation(s, schiffId); // ausschließlich Quote
welt.execute(s, {type:'shipReposition', owner:'house', schiff:schiffId});
welt.execute(s, {type:'shipSteer', owner:'house', schiff:schiffId, kurs:64, fahrt:50});
```

Befehle liefern `{ok,type,reason}` (reason bei Ablehnung); zusätzliche Preis-/Reservefelder sind unerlaubt. Der Kaufpreis kommt aus `rules.economy.waren.frachter.basis` (750 ISK), die W5-Verkaufsprüfung aus dem Originalkern. Vorhandene K7-Signaturen und echte W5-Fertigstellung bleiben erforderlich: im Seed liegt nicht automatisch eine Nadir-Hülle. Preis wird aus der eigenen Firmenkasse bezahlt, der Werft gutgeschrieben, Lager um genau eins reduziert, Ledgerverbrauch gebucht und ein eigenes physisches Schiff mit Heimat Nadir erzeugt. Originale Kassenstatistik und vorhandenes `kanon.spielerFrachterKaeufe` protokollieren den Kauf. `w5.schiffIds` führt alle Nadir-Käufe, nicht nur Speditionskäufe.

Die Quote liefert `{ok,grund,schiff,von,nach,minuten,lohn,kosten}`; Ablehnungen liefern `{ok:false,grund}`. Sie reserviert nichts. Originalroute und Originallohn ergeben 60 Minuten × 1 ISK. Vor Start müssen die gesamten 60 ISK auf `house` frei sein. Bezahlter Transfer verwendet ausschließlich das vorhandene `w5ac`-Journal und `w5ac_transfer_reserved`. Jede Originalminute zahlt an den **unveränderten Originalempfänger `w5ac_transfer_pilot`**; keine zusätzliche Gutschrift an `pilot_house`. Der Spieler kann den Körper im Korridor steuern; Ankunft bleibt Original-W5ac-Logik, keine navigationsabhängige Dockankunft. Normale Raumfahrt braucht keinen Treibstoff.

Ein fremdes Schiff, falsche Klasse, fehlende Hülle, fremder Eigentümer, fehlendes Kapital, laufende W3-/Eisfracht oder Überführung und wiederholte Verwendung derselben Hülle werden vor Mutation abgewiesen. Angebote bleiben Momentaufnahmen; Ausführung prüft erneut. Ein abgeschlossener Transfer ermöglicht dem gleichen eigenen Schiff die bestehenden Aldera-Flug-/Frachtbefehle mit deren eigenen Finanzierungsregeln.

## Audit und Spielstandschutz

Keine neuen Konten, Savefelder, Schemata oder Migrationen. Bereits vorhandene Kauf- und Transferbelege reichen aus; `owner` gehörte schon zum W5ac-Beleg. W1-Vollkosten, W3-Speditionsbilanz und W5ad-Nachfolge trennen jetzt tatsächlich von `house` bezahlte Investitionen/Überführungen von NPC-Ausgaben. W5 prüft bei Spielerhüllen zusätzlich den eigenen Nadir-Kaufbeleg. Transferaudit bindet Eigentümer, Kaufzeitpunkt, Herkunft, Originaldauer/-lohn, Arbeitsfortschritt und physische Schiff-ID zusammen. Ursprüngliche Prüfgleichungen bleiben aktiv.

`prototypes/flug2d/flug-kern.js` musste für den belegten Regel200-Transfer und den bereits integrierten Regel200-Spieler-Eistransit geöffnet werden; vorher erlaubte der Integrator nur Regel199-Eistransit. Andere Transits bleiben gesperrt. Die ursprünglichen Regel199-/Regel195-Referenztests werden unverändert ausgeführt.

Geschützte Dateien: `index.html`, `aphros-void.html`, `prototypes/w5ac/rule191-w5-ferry-core.js` bytegleich mit `main 04124f2b`. UI und Speicherhülle unverändert gegenüber dem Integrationshead. Keine vorhandenen Tests oder Referenzhashes angepasst. Roadmap-/Projektstatusdateien bleiben wegen der expliziten Dateigrenze dieses Auftrags unverändert; dieser Bericht dokumentiert ausschließlich den neuen Draft und keine Änderung beschlossener Meilensteine.

## Abnahme

- `tests/k13-f7-vorbereitung.cjs`: Seeds42/7 aus originalem K6-Endstand, echte neue 50 Erz, W3-Lieferung, mindestens fünf W4-Material, ein bezahlter W5-Frachter. NPC-Ersatzkäufe pausiert, damit der Spieler dieselbe reale knappe Hülle kaufen kann; keine Lagerinjektion.
- `tests/k13-f7-werftfrachter.test.mjs`: Kaufpreis/Kassendeltas/Eigentum, 60 bezahlte Minuten, manuelle Körperbewegung, Aldera-Folgeeinsatz, Quote ohne Mutation, Save/Load und Replay. Negative Tests für 749/0 ISK Kaufkapital, 59/0 ISK Flugreserve, leeres Lager, falsche Preisfelder/Besitzer/Klasse, aktive Aufträge und Doppelverwendung. Manipulierte Eigentümer, Kaufpreis/-ort/-zeit, Flugzeit/-arbeit, Kasse und Treuhand werden verworfen. Kapitalmangeltests verändern isoliert die geprüfte Testkasse; sie sind keine zulässigen Spieltransaktionen.
- `tests/k13-f7-wirtschaft.test.mjs`: 13 verschiedene politische Wirtschaftsprofile je 90 Tage **nach Spieler-Kauf und Überführung**, tägliches Audit/33.000-ISK-Summe, Mint/Burn0, abschließendes Save/Load und Replay. Konservationsprüfung, kein W6-Nachhaltigkeitsbeweis.
- `tests/k13-f7-browser.cjs`: tatsächlich geprüfter industrieller Seed42-Save als Teststart, realer UI-Kauf und Transfer, Zwischenflug über IndexedDB/Reload, vier Touchgrößen je Chromium/WebKit. Der Test ersetzt nur die erste neue Welt durch einen auditierten Save; Produktdateien erhalten keinen Testhook.

### Tatsächlich ausgeführte Ergebnisse

- Node22 v22.23.4: F7-Einzeltests 3/3 bestanden, 0 Fehler/Skips. Seed42 `sh021`, Tick21865, Hash `9c700c7ac665447c`; Seed7 gleicher Ablauf, Hash `055c828bb3fd40cf`. 750 ISK Kauf, 60 ISK Überführung, danach eine weitere bezahlte lokale Flugminute an `pilot_house`.
- **Präzise Grenze:** Nach der K6-/K7-Kette liegen nur zwei echte Eis in Aldera; alle eigenen Miner sind wirtschaftlich verbraucht. Ein zusätzlicher 50-Eis-Frachtauftrag wird rechtmäßig abgelehnt. Der Folgeeinsatznachweis ist deshalb lokaler bezahlter 2D-Flug, kein weiterer abgewickelter Eisvertrag. Eine zwischenzeitliche Testannahme eines noch nutzbaren eigenen Miners fiel bei beiden Seeds durch und wurde als falsche Voraussetzung entfernt; keine Ware/Hülle wurde erzeugt.
- F7-Wirtschaftsmatrix: 1/1 Testgruppe, alle 13 verschiedenen Profile × 90 Tage, 0 Fehler/Skips, 33.000 ISK und Mint/Burn0. Finale Hashes (Profil0–12): `1cf3d123434927f1`, `b0bdb3854eb934a4`, `a1007ee1d8684c2c`, `1cf3d123434927f1`, `3c35f21e46493ad6`, `f46a7bdbe0934de2`, `f1e69d7b385a50b1`, `7ef456aa2994a736`, `11a6f52563e3e9e6`, `5d6ddcf95aa5724c`, `66231c45dd266d7a`, `4e7f2cab3cb03521`, `2faf7fe0dde10262`.
- Chromium: 4/4 Touchgrößen 1180×820, 1024×768, 820×1180, 390×844, Kauf/60-Minuten-Transfer/Save/Reload bestanden; Endhash jeweils `01502c700f07c817`. Installiertes `/usr/bin/chromium`, keine Produktabhängigkeit.
- WebKit: **nicht ausgeführt**. Playwright-WebKit fehlt; Installationsversuch über `playwright.download.prss.microsoft.com` mit HTTP403 `Domain forbidden` blockiert. Test liegt ausführbar für eine Umgebung mit installiertem WebKit vor. Erste lokale Browserstarts scheiterten außerdem an Sandbox-Serverrechten bzw. fehlenden Playwright-Binaries; Chromium wurde anschließend mit lokalem Server außerhalb dieser Sandbox und installiertem Browser erfolgreich geprüft.
- `node scripts/build-w5-singlefile.mjs --check`: `W5_SINGLEFILE_OK`, 320217 Zeichen, 7 Styles/15 Scripts. Geschützte Produktdateien und UI-/Speicherdateien per Git-Diff unverändert bestätigt.
- Vollständige Node22-Regression `node --test tests/*.test.mjs`: **76/76 vom Runner gezählte Dateitests**, 0 Fehler, 0 Skips, 0 abgebrochen, 900362 ms. Der Glob wurde vor Anlage der neuen F7-Wirtschaftsmatrix gestartet; diese zusätzliche Datei wurde separat erfolgreich ausgeführt (1/1 Gruppe, 13×90 Tage). Damit sind alle aktuell 77 Testdateien geprüft, ohne die Zahl der Dateitests mit inneren Einzeltestzahlen zu verwechseln. F7-Einzeldatei zusätzlich direkt ausgeführt: 3/3 Fälle bestanden.
- CI auf Codehead `08161680b4130916da22dc792e939db2d20a5492`: [JS-Regression #43570033380](https://github.com/tobiasfranziskus/Check/actions/runs/43570033380), [W5-RC1 #43570033379](https://github.com/tobiasfranziskus/Check/actions/runs/43570033379), [F0 Node/Chromium #43570033327](https://github.com/tobiasfranziskus/Check/actions/runs/43570033327) und [F0 WebKit #43570033372](https://github.com/tobiasfranziskus/Check/actions/runs/43570033372) **completed/success**. [K1-Gesamtworkflow #43570033353](https://github.com/tobiasfranziskus/Check/actions/runs/43570033353) noch **in_progress** beim Abschluss der lokalen Prüfung; darin K4–K13-Teiljobs und beide Browserjobs bereits **success**, letzter Node-Gesamtregressionsschritt noch laufend. Bestehende Browserjobs enthalten den neuen F7-Nadir-Kauf-/Überführungsablauf nicht; deren grünes WebKit ersetzt den lokal blockierten neuen F7-Test nicht. Der nachfolgende Ergebnis-Commit ändert ausschließlich diesen Bericht.
 Echte iPad-Safari-/NAS-Abnahme bleibt offen; WebKit ist kein reales iPad. Separate UI-Integration und unabhängige Prüfung bleiben erforderlich.
