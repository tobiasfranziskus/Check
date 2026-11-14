# J1 – finanzierte Jägerwirtschaft: belegter Teilfortschritt

**[DRAFT / ANALYSE · 14.11.2026] [PR #335](https://github.com/tobiasfranziskus/Check/pull/335). Nicht implementierte Einsatzkette.** Dieser Auftrag erreicht die ausdrücklich vorgesehene Abbruchregel: Im tatsächlich laufenden Regel200-Profil fehlen Produktionsgüter und ihre ausführbaren Beschaffungswege. Kein Jäger wurde erzeugt, gekauft oder eingesetzt. Keine vollständige Jägerwirtschaft und keine Nachhaltigkeit nachgewiesen.

## Geprüfte Basis und Dateigrenzen

Ausgangshead von [#331](https://github.com/tobiasfranziskus/Check/pull/331): `f2951c7795c0461d1100253df3090f03e64c6430`; PR-Basis bleibt `codex/k13-f7-werftfrachter-player`, ausdrücklich nicht main. Geprüfter main: `04124f2bca27dc33b54be30c07b6a7bbb7387e81`. Eigener Branch: `feature/j1-jaegerwirtschaft-regel200-20261114`.

Vor Entwicklung gelesen: AGENTS.md, ROADMAP.md, PROJEKTSTATUS.md, F7-Prüfbericht und Metadaten/Beschreibungen von #329, #331, #332, #333 sowie #173, #178, #181 und #183. #329 Head `2a2422f8`, #332 Head `e00834b6`, #333 Head `940cd682` bei Prüfung. Historische PR-Angaben sind Quellen für Anforderungen, keine neu ausgeführten Tests. Kein historischer Code oder Buchungssatz übernommen.

Nur neue `j1-`-Audit-/Testdateien und dieser Bericht. Die beiden erlaubten gemeinsamen Coredateien mussten für diesen Teilfortschritt nicht verändert werden. Keine F8-, Flug-, UI-, Workflow-, Save- oder Regel195-Änderungen. ROADMAP/PROJEKTSTATUS bleiben wegen der ausdrücklich gewünschten konfliktfreien F8-Grenze unverändert; dieser Bericht führt den neuen Analysebefund, keine neue Produktentscheidung. Kein Merge, Deployment oder produktiver Savezugriff.

## Warum die vorhandenen Rezeptnamen nicht genügen

`rule200-k7-industry-core.js` enthält eine allgemeine Wirtschaftstabelle mit Siliziumpreis 24, Jägerbasispreis 900 und den Rezepten `r_bauteil` / `r_jaeger`. `createK7Welt` instanziiert aber das aus ERZ_RULES/W3/W4/W5 abgeleitete Profil. Maßgeblich sind `Welt.erstellenK7().rules` und der daraus erzeugte Weltzustand:

| Eigenschaft | Tatsächliches Regel200-Profil |
| --- | --- |
| Waren | Erz, Miner, Frachter, Material, Eis, Wasser |
| `economy.rezepte` | leer |
| `world.aktiveRezepte` | enthält u.a. r_bauteil/r_jaeger; nur geerbte Namen |
| Vorkommen | Aldera Erz und Eis; kein Silizium |
| Stationslinien | beide leer |
| W4 | eigener bezahlter Spezialpfad: 10 Erz → 5 Material |
| W5 | eigener bezahlter Spezialpfad: 5 Material → Frachter |
| Silizium / Bauteile / Jäger-Ledger | nicht angelegt |
| Käuferpfad | finanzierte Miner/Frachter; Jäger abgewiesen |
| Piraten / Sicherheit | keine Sollschiffe, keine passenden aktiven Konten |
| Jagdauftrag | im Erzpilot-Befehlsprofil nicht freigeschaltet |

Das erste Hindernis ist **nicht lediglich zu wenig Käuferkapital**. Es fehlen registrierte Siliziumware, Förderort, Orts-/Transportweg, finanzierter Förderauftrag und Bauteilfertigung. W5 ist auf Frachter festgelegt. Ein `stationBuildShip` ohne Klassenfeld baut einen Frachter, keinen Jäger; mit `klasse:'jaeger'` wird es atomar abgewiesen.

Der allgemeine `m_core_produktion` bewegt Rezeptwaren ohne den hier geforderten separaten Rohstoffkauf und Arbeitslohn. Ihm nur Linien hinzuzufügen wäre kein Nachweis finanzierter Produktion. Die alten W5b/W5d-Genesen verteilen u.a. einen Starterminer nach Nadir; das wäre hier eine neue Startannahme. J1 führt sie nicht ein. Vor einem Folgeauftrag muss ein vollständig finanzierter Förder-/Transport-/Produktionsweg aus den tatsächlich vorhandenen Hüllen spezifiziert und umgesetzt werden, ohne neue Startware oder Rettungskapital.

Der vorhandene `m_core_kampf.kampf` ist wiederverwendbar. Seine alten Aufrufer `patrouille`/`ueberfall` enthalten jedoch direkte `cash += geld; minted += geld`-Kopfgelder. Sie dürfen nicht unverändert für J1 freigeschaltet werden. `entfernen` löscht Schiffe und führt aggregierte Verluststatistik, liefert aber keinen eindeutigen dauerhaften Piratenverlustbeleg mit Einsatz- und Abschusszuordnung. Ein Statistikzähler ist kein Auszahlungsanspruch.

## Implementierter und ausführbarer Teil

`prototypes/welt/j1-wirtschaftsaudit.cjs` ist ein ausschließlich lesendes Forschungswerkzeug:

```js
const Welt = require('./prototypes/welt/welt-kern.js');
const J1 = require('./prototypes/welt/j1-wirtschaftsaudit.cjs');
const welt = Welt.erstellenK7();
const state = welt.createState(42);
const befund = J1.inspect(welt, state);
const geladen = J1.loadChecked(welt, welt.save(state));
```

`inspect` liefert fehlende registrierte Güter/Rezepte/Vorkommen, tatsächliche Linien, Werftklasse, reale Jäger-IDs, Konto-/Emissionsprüfung und Core-Audit. Zusätzlich rekonstruiert es Lager/Fracht sowie vorhandenes W5ae-Inventar gegen Warenledger und weist unbekannte Ledger, Lagerwaren, Schiffsklassen und Eigentümer zurück. Es erzeugt keinen Wirtschaftszustand, keine Uhr, Befehle, Reserve oder Auszahlung. `status:'BLOCKED'` und sämtliche `implemented:false` sind die feste Ergebniskennzeichnung dieser J1-Analyseversion, **kein zukünftiger allgemeiner Freigabealgorithmus**.

`loadChecked` lädt mit dem Original-Weltloader und prüft danach die zusätzliche J1-Evidenz. Der Original-Loader akzeptiert einzelne unbekannte Zusatzwarenfelder; diese Lücke wird im separaten Prüflader abgefangen. Dieser Wrapper ist **nicht** im Produkt-/F8-Savepfad installiert. Er schützt gegen die getesteten Manipulationen, bietet aber keine kryptografische Authentizität beliebig vollständig umgeschriebener JSON-Welten. Keine geänderten Savefelder oder Migrationen.

## Kosten und Ergebnis

Ein realer Jägereinsatz ist nicht zustande gekommen. Daher gibt es keine tatsächliche J1-Vollkosten-/Rentabilitätsrechnung: Rohstoffkauf, Fertigungslohn, Jägerverkauf, Piloteneinsatz, Kopfgeld und Jägerverlust jeweils **nicht durchgeführt**, kein als profitabel interpretierbarer Nullkostenlauf. Hersteller-, Besitzer- und Auftraggebererträge aus J1: kein realisierter Vorgang.

Nur zur Einordnung, **historische Forschungsrechnung aus #183, nicht Regel200-Buchungen**: 16 Material × 100 + 8 Silizium × 24 = 1.792 ISK Bauteilvorprodukte; 64 ISK Bauteilarbeit; 4 Material × 100 + 32 ISK Jägerarbeit = 432 ISK. Herstellerauszahlungen 2.288 ISK, historischer Jägererlös 900 ISK, Fertigungsbeitrag **−1.388 ISK**. W3/W4/Mine sind separat abzugrenzen; interne Transfers sind kein zusätzlicher Weltverlust. Der historische Fabrik-Materialpreis 100 ist nicht einfach der allgemeine Materialbasispreis 20. Keine dieser Zahlen wird als neuer J1-Tarif eingeführt. Kopfgeldhöhe weiterhin unbeschlossen; 50 ISK aus #181 und 120/180/240 mit Spielerfaktor 3 aus der allgemeinen Quelltabelle sind historische Forschungsparameter, keine Finanzierungsquelle.

## Integrationsvertrag für F8 – erforderlich, noch nicht implementiert

F8-A/B bleiben isoliertes Training. Der folgende Vertrag ist das Ziel einer späteren Core-Erweiterung, **keine bereits vorhandene API**. Solange alle wirtschaftlichen Funktionen oben `false` sind, darf F8 keinen echten Jäger freigeben.

| Bereich | Autoritative Anforderung |
| --- | --- |
| Identität / Eigentum | `state.ships[id]`, Eigentümer-ID und persistenter Produktions-/Kaufbeleg; Anzeigename oder `f8_training_only` nie als Eigentum akzeptieren |
| Physischer Standort | Original-F6-Körper direkt am echten Schiff; `system`, Dock-ID, Lage, Position/Geschwindigkeit aus demselben Weltzustand; keine Trainingskoordinaten importieren |
| Befehle | ausschließlich strenge validierte Corebefehle; Jägerkauf, Produktionsauftrag, Einsatzstart/-abbruch und Abschluss fehlen derzeit. Bestehendes `shipBuy` akzeptiert noch keine Jäger |
| Einsatzstart | Eigentum, intakte Hülle, Ort, verfügbarer Pilot und keine Doppelbelegung prüfen; gesamten endlichen Arbeitsrahmen und gesondertes Auftraggeberbudget vorab atomar reservieren; bei Mangel keine Nebenbuchungen |
| Zeit / Lohn | ein Welt-Tick mit vorhandenen 60 Flugteilschritten pro Minute; keine unabhängige F8-Uhr; nur tatsächlich geleistete Corearbeit aus reserviertem Geld zahlen; bei Reserveende stoppen; kein Treibstoff |
| Treffer | F8-Projektilsystem muss aus echten Körperkoordinaten im Core laufen; Treffer-/Projektil-IDs und Reihenfolge deterministisch; keine von UI behaupteten Treffer als Geldanspruch |
| Kampfabschluss | vorhandenen Kampfkern gezielt anbinden; pro Begegnung genau eine autoritative Schadensauflösung. Alte Patrouillen-Mint-/Ersatzpfade nicht zusätzlich ausführen; F8-Trainingstreffer sind keine Weltabschüsse |
| Verlust | eindeutige persistente Verlust-ID mit Schiff, Eigentümer zum Verlustzeitpunkt, System, Tick, Einsatz, Gegner-/Trefferbezug und zerstörter Hülle; Original-HP/Verlustprüfung; keine UI-beigelegten Belege vertrauen |
| Kopfgeld | Auftraggeberkonto → endliche Treuhand vor Start; Auszahlung nur für genau den bestätigten Piratenverlust dieses Einsatzes; Anspruch einmalig verbrauchen; Fremdschiff, wiederholte Meldung und erfundener Beleg ablehnen |
| Abbruch | unbezahlte Arbeitsreste und unverdientes Kopfgeld an ursprüngliche Geldgeber zurück; verdienter Lohn bleibt bezahlt; Abschluss idempotent |
| Ersatz | neue bezahlte Produktions-ID, Lagerhülle und atomarer regulärer Kauf; ursprüngliche Verlust-/Eigentumsbelege erhalten; kein automatischer Piratenspawn, kein Rettungskauf |
| Audits | getrennte Geld-, Waren-, Hüllen-/Eigentums-, Lohn-/Reserve-, Verlust- und Bounty-Abgleiche; in `welt.audit` und Original-Stufenbilanzen integrieren; doppelte Journale nicht als unabhängigen Beweis behandeln |
| Save/Load | ein Weltumschlag mit Tick/RNG, realen Körpern/Projektilen, Reserven, Arbeitsfortschritt, dauerhaften Verlust-/Anspruchs-IDs; Ladeaudit vor Aktivierung; Altstände ohne neue optionale Felder erhalten; Hash-/Replay einschließlich offenem Einsatz und erneutem Abschluss |

Keine F8-Oberflächenintegration in diesem Draft. Ein Folgeauftrag muss insbesondere den derzeit blockierten Rohstoffpfad und die ehrliche Finanzierung schließen; bloßes Sichtbarmachen der Rezeptnamen reicht nicht.

## Ausgeführte Prüfungen

- Node22 v22.23.4: neue Einzeldatei **3/3 Fälle**, 0 Fehler/Skips; separat mit `--test` **1/1 Dateitest**. Sechs Mutationsvarianten (unbekannte Ware, passender gefälschter Ledger, erfundene Hülle, Geldzufluss, unbekannte Fracht, verfälschte ID) vom J1-Prüfer/Prüflader abgewiesen.
- Seeds42/7: 120 Originalminuten nach den atomar abgelehnten Befehlen; Hashes `9f3decc1bc502233` / `0a500c4d4814e76b`. Unabhängiger Gegenlauf direkt mit dem unveränderten Weltkern ohne J1-Modul liefert dieselben Referenzen. Save/Load und zweiter Befehls-/Zeitlauf gleich.
- **13 politische Wirtschaftsprofile × 90 Tage**, jeweils zwei vollständige identische Läufe mit täglichem Hashvergleich sowie Audit, Geld-/Warenprüfung und finalem Save/Load: **1/1 Testgruppe bestanden**, 0 Fehler/Skips, 220.253 ms. Start aus realer K6/K7-Kette mit neuer Erzlieferung und bezahlter W4/W5-Fertigung; keine neuen Startgüter. Alle Endstände Tick151404, **33.000 ISK, Mint/Burn0, 0 Jäger, 0 Einsätze**. Rohdaten: [j1-90tage-ergebnisse.jsonl](j1-90tage-ergebnisse.jsonl). Das sind 13 unterschiedliche wirtschaftliche Politikvorgaben, keine 13 erfolgreichen Jägerwirtschaften. Gleiche Endhashes bei Basis/Stilllegung zeigen, dass einzelne Vorgaben im blockierten Endstand keine zusätzliche Wirkung haben.
- `node scripts/build-w5-singlefile.mjs --check`: **W5_SINGLEFILE_OK**, 320.217 Zeichen, 7 Styles, 15 Scripts.
- Abschließender gemeinsamer Lauf `node --test tests/j1-*.test.mjs` mit dem vollständigen unabhängigen Warenabgleich: **2/2 Dateitests bestanden**, 0 Fehler/Skips, 220.415 ms; darin nochmals die gesamte 13×90-Tage-Matrix.
- Vollständiger beauftragter Bestandslauf `node --test tests/*.test.mjs` unter Node22 v22.23.4: **77/77 Dateitests bestanden**, 0 Fehler, 0 Skips, 0 abgebrochen, 1.173.158 ms. Der Glob wurde vor Anlage der beiden neuen J1-Testdateien gestartet; deren abschließender gemeinsamer Lauf ist oben separat mit **2/2** belegt. Damit sind alle **79 aktuell vorhandenen Testdateien** geprüft. Die bestandenen älteren 365-/730-Tage-K1-Szenarien sind Bestandsregression und kein Jäger-Nachhaltigkeitsnachweis.
- Abschlussdiff gegen `f2951c7`: genau fünf neue J1-Dateien, keine geänderte Bestandsdatei; `git diff --check` ohne Fehler. Lokale Testergebnisse, keine Behauptung abgeschlossener GitHub-CI.

Reproduktion unter Node22:

```sh
node tests/j1-jaegerwirtschaft.test.mjs
node tests/j1-wirtschaft-90tage.test.mjs
node --test tests/*.test.mjs
node scripts/build-w5-singlefile.mjs --check
```

Chromium/WebKit für diesen Draft nicht ausgeführt: keine Änderung oder Einbindung von Browsercode. Bestehende Browserprüfungen sind kein J1-Einsatznachweis. Echte iPad-Safari-/NAS-Abnahme bleibt ausdrücklich offen. 365-/730-Tage-Jägerläufe nicht ausgeführt; keine Aussage wirtschaftlicher Nachhaltigkeit.

Nicht erreichte Funktionsgates: Herstellung/Kauf/Eigentum eines Jägers, Einsatzlohnreserve, realer Kampfverlust, bestätigter Abschuss, Einmal-Kopfgeldzahlung und bezahlter Ersatz. Entsprechend sind fehlendes Jägerkapital/Pilotenreserve/Auftraggeberbudget und doppelte Auszahlung nicht an einer implementierten Transaktion getestet. Die zweifache unbekannte bountyClaim-Ablehnung ist nur ein Nachweis des fehlenden Auszahlungspfads, kein abgeschlossener Bounty-Sicherheitstest. Unabhängige Jäger-Lohn-/Bounty-/Eigentumsjournalaudits existieren hier noch nicht.
