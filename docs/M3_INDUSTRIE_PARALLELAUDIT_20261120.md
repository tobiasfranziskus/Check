# M3 – Parallelaudit Erzlieferung → Materialproduktion → Werftversorgung

**[ANALYSE / DRAFT · 20.11.2026]** Geprüfte Basis: `main ca8a41960ca41033326d7b105c974d55b083fb79` nach #524/#525. Branch: `audit/m3-industrie-20261120`. M3 ist **teilweise vorhanden, nicht abgenommen**: Die finanzierte Originalkette und ein eigener Hüllenkauf sind nachweisbar; eine frei vom Spieler beauftragbare Erz-/Raffinerie-/Werftwirtschaft ist durch bestehende Rechte nicht gedeckt. Keine neue Wirtschaftsregel vorgeschlagen oder aktiviert.

## Umfang und Abgrenzung

`AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, aktuelle Quellen, relevante historische Berichte und offene PRs wurden geprüft. Der anfängliche lokale Branch `work` stand auf `ce950445`; vor der Analyse wurde `origin/main` frisch geholt und der neue Branch direkt von `ca8a419` erstellt. Kein zusätzlicher Worktree, kein Import eines Forschungsbranches. Die konkrete Nutzeranweisung hat Vorrang vor der allgemeinen Merge-/Dokumentationspflegefreigabe in AGENTS.md: **kein Merge/Deployment**, keine Änderung von Roadmap/Projektstatus.

Diff ausschließlich dieser neue Bericht und `tests/m3-industrie-audit.test.mjs`. `prototypes/spiel/*`, `index.html`, Wirtschaftskern, Save-Schema, bestehende Tests und Referenzen bleiben unverändert. Ein paralleler read-only Rechteaudit überprüfte Quellen und Spielerzugänge; Ausführungsbelege stammen aus den unten genannten tatsächlichen Node22-Läufen.

Work führt laut Auftrag den M1/M2-Praxistest fort. Die lesende Chat-Inventur zeigte außerdem den aktiven Chat „Spielablauf und Blocker prüfen“. Es wurden keine Nachrichten an diesen Chat geschickt, keine Testsitzungen, Browserdaten oder Arbeitsdateien übernommen. Dieser Bericht ersetzt dessen Praxis-/Browserabnahme nicht.

## 1. Originalbefehle, echte Finanzierung und Rechte

Die heutige Karriere bindet `prototypes/welt/rule200-k7-industry-core.js` über `welt-kern.js:15` ein. Historische „Forschung“-Kommentare und alte Regelnummern in Dateinamen oder Fehlermeldungen sind allein kein Integrationsnachweis; entscheidend sind der ausgeführte Regel204-/207-Zustand und der aktuelle Aufrufpfad.

| Schritt | Originalbefehl und Berechtigung | Wirkliche Mittel und Leistung | Quellbeleg auf geprüfter Basis |
| --- | --- | --- | --- |
| W3 Erztransport | `shipFreight`, eigener freier leerer Aldera-Frachter von `transport`; `cmd.owner` muss Schiffseigner sein | 50 Erz; Nadir bindet **740 ISK** = 500 Erz + 240 Rundfracht; Spedition bindet **120 ISK** für 60+60 Flugminuten. 500 ISK erst bei Ankunft an Aldera, 240 ISK erst nach Rückkehr an die Spedition | `rule200-k7-industry-core.js:703,2172–2200,2303` |
| K7 Erzvorbestellung | `industrialOreOffer` nur Nadir; `industrialOreAcceptMine` nur `npc3`; `industrialOreAcceptFreight` nur `transport`; `industrialOreAcceptYard` nur Werft; `industrialOreCommit` nur Nadir nach Signaturen | Vorbestellung erzeugt keine Ware. Finale Deckungsprüfung über getrennte Bergbau-, Stations-, Transport- und Werftkassen; **530 ISK Werftreserve** zusätzlich zu W3-Treuhand. Eigentümer/Verfügbarkeit werden erneut geprüft | `welt-kern.js:1816–1945` |
| W4 Raffinerie | `stationRefine`, ausschließlich `owner:'st_nadir', station:'st_nadir'` | **10 reale Erz → 5 Material**, 20 Minuten, **20 ISK** vollständige Arbeitstreuhand. Erzverbrauch und Materialerzeugung erst beim Abschluss | `rule200-k7-industry-core.js:2392–2499` |
| W5 Werftversorgung/Bau | `stationBuildShip`, ausschließlich `owner:'werft_extern', station:'st_nadir'`; K7 löst signierte Reserve über `industrialOreBuildShip` aus | **5 Material für 500 ISK** von Nadir kaufen und bereits beim Baustart verbrauchen; **30 ISK** Arbeitstreuhand, **30 bezahlte Minuten** bis zur physischen Hülle | `rule200-k7-industry-core.js:2523–2568`; `welt-kern.js:1890–1911` |
| Eigener Hüllenkauf | J8 `buy-st_nadir-frachter` → `shipBuy`, `owner:'house'` | **750 eigene ISK** an Werft, fertige Lagerhülle 1→0, neue eindeutige Ship-ID in Nadir mit W5-Herkunft. Kein Produktionsauftrag und keine kostenlose Überführung | `rule200-k7-industry-core.js:874,951`; `konzern-session.js:65–73` |
| Eigener Folgebetrieb | J8 `reposition-<id>` → `shipReposition`; später `freight-<id>` → `shipFreightIce` | W5ac **60 ISK/60 Minuten** vorfinanziert; erst physische Aldera-Ankunft erlaubt F4. F4-Eisgeschäft ist ein eigener Vertrag, keine weitere Erzlieferung | `konzern-session.js:56–64`; bestehende P3-Tests |

**Keine Spielerprokura:** Der Weltkern ist eine Mehrfirmen-Schnittstelle. Ein Entwickleraufruf mit `owner:'st_nadir'` oder `owner:'werft_extern'` beweist keinen Spielerzugang. J8 bindet den Spielerplan an `house` und akzeptiert nur angebotene IDs; Angebote werden auf einem geprüften Klon kalkuliert und beim Ausführen erneut validiert (`konzern-session.js:27–83,204–225`). Eine UI darf fremde Owner-IDs nicht einsetzen, um diese Grenze zu umgehen.

Regel207 besitzt zusätzlich `industrialOreOfferMaterial`/`industrialOreCommitMaterial`: Bedarfsgerechte 50-Erz-Folgeversorgung ohne verpflichtende neue W5-Hülle, nach explizitem Material-Opt-in und Signaturen von Bergbau/Transport/Nadir. Eine Werftunterschrift ist in diesem Materialvertrag ausdrücklich verboten (`welt-kern.js:1840–1893`). Das vorhandene P8h-Opt-in aktiviert eigenfinanzierte NPC-Disposition, keine freie Haus-Unterschrift.

## 2. Bestehender Managerzugang und tatsächliche Lücken

| Zugang | Vorhandene Funktion | Grenze für M3 |
| --- | --- | --- |
| Root → Wirtschaftsmanager → Regel204-Karriere | Vorhandene J8-Schiffskäufe, eigene Förderung/F4 und regulärer Zeitfortschritt ohne Handflug | Keine eigene W3-Erzbestellung, W4- oder W5-Fertigungsfreigabe |
| Freiwillig aktivierte S02-NPC-/Siliziumwirtschaft → Kapitel 06 Industrie | Lesende W3/W4/W5-Zähler, Lager und Firmenkassen; Original-Kaufgrund; eigene fertige Hülle kaufen, auswählen, bezahlt überführen und F4 beauftragen | `p3-industrie.js:10–13` blendet die Akte ohne Regel204 + NPC-Auto + NPC-Silizium aus. Im klassischen Standardstart nicht sichtbar; keine allgemeine Manager-Industrieabnahme |
| Jägerprojekt | Bestehende Material-/Produktionsakten und echte Sperren, teilweise bewusst mit `house` geprüfte Fremdaufträge | Beobachtung ist keine Unterschrift; kein Kauf-/Produktionsrecht aus einem Dashboard ableiten |
| Freiwillige Regel207-Karriere | Vorhandenes Material-/NPC-Folgeketten-Opt-in | Eigene Slots und Regeln; nicht still als Standard204 oder Migration behandeln. Die Regel204-Industrieakte ist dort nicht sichtbar |
| Historische W5y/W5aa/W5ab-Hubs | Operator-Schaltflächen für originale W3/W4/W5-Befehle | Alte Regel17/18/19-Pilotwelten; ihre Operatorrechte sind keine heutige Haus-Prokura |

Quellen: `spiel.js:377–417,904,980–1039`, `p3-industrie.js:10–13,30–45,97–126`, `jaeger-projekt.js:17–44`, `konzern-session.js:136–151`. UI-Zugänge hier durch Quellen und Node-Adaptertests geprüft; kein neuer interaktiver Erstspieltest behauptet.

Noch unvollständig ist die durchgehende Darstellung **wer bestellt / wer zahlt / welche Mittel sind gebunden / wann ist geliefert bzw. abgerechnet**. Insbesondere sind `w3.geliefert` und `w3.abgeschlossen` verschiedene Ereignisse. Auch `w5.fertig`, Lagerhülle, Kaufbeleg und tatsächlich verfügbares eigenes Schiff müssen getrennt bleiben. Erfolgreiche Produktion garantiert keinen finanzierbaren Folgekäufer oder Profit.

## 3. Neue deterministische Positivbelege auf aktuellem main

`tests/m3-industrie-audit.test.mjs` startet die echte Regel195→204-J8-Karriere mit Seed42, vorhandener S02-Politik (`stilllegung:true`, Werftbetriebsreserve 1060), NPC-Auto und NPC-Silizium. Keine geschenkte Ware, keine Kassenkorrektur, kein Forschungsschalter. Weltgeld bleibt **33.000 ISK**, Mint/Burn 0; der unabhängige bestehende W6-Prüfer summiert Konten und physische Waren zusätzlich zum Originalaudit.

| Weltminute | Reales Ereignis | Deterministischer Hash |
| ---: | --- | --- |
| 71 | Signierter K7-Auftrag vorbestellt; W3-Kauftreuhand 740, W3-Arbeit 120, K7-Werftreserve 530 ISK | `1ae5ea5e45815f5e` |
| 203 | 50 Erz physisch in Nadir; W3-Rückflug aktiv, **0 abgeschlossene Rundfahrten/0 Frachttarif**; W4-Arbeit 20 ISK reserviert, noch 0 Material | `2702551325650d7a` |
| 223 | 10 Erz verbraucht, 5 Material erzeugt, 20 ISK W4-Lohn bezahlt; Werft hat 5 Material für 500 ISK gekauft/verbraucht; 30 ISK Werftarbeit gebunden, noch 0 fertige Hüllen | `be067b0fa11a2f3a` |
| 253 | 1 fertige Frachterhülle im Nadir-Lager, 30 ISK Werftlohn ausgezahlt | `7a206e578ab46207` |
| 263 | W3-Rundfahrt abgeschlossen: 120 ISK Flugarbeit und 240 ISK Tarif gebucht; beide W3-Treuhandkonten leer | `fc5bc61e17fb95e8` |
| 300 | Fertige Hülle rechtmäßig für den Spieler kaufbar; Hauskasse weiterhin 3.000 ISK, kein erzwungener Kauf | `b634031863e65b57` |

Bei Minute203 werden laufende W3-Rückfracht und W4-Arbeit kalt gespeichert/geladen. Anschließend stimmen **alle 98 Minutenstände 203–300** mit der ununterbrochenen Welt überein. An allen sechs Checkpoints Originalaudit, unabhängige Geld-/Warenprüfung und Save/Load-Hash geprüft. Die lesende Industrieprojektion verändert den Originalsave nicht.

Die erneut ausgeführten vorhandenen P3-Tests bestätigen außerdem den **echten Hauskauf bei Minute300**: `sh004`, 750 ISK bezahlt, Hauskasse 2.250 ISK, Hash `126037a82fe38879`. Der separate 14-Tage-Originaldurchlauf ergibt **4 W3-Verträge/200 Erz, 18 W4-Chargen/90 Material und 7 gefertigte W5-Frachter**, Hash `daafc5405c915767`; Hauskasse ohne erzwungenen Kauf weiterhin 3.000 ISK. Der bestehende bezahlte 60-Minuten-W5ac-Test endet bei Hash `da11aacaa43f77bf`, Hauskasse 2.190 ISK. Diese begrenzten erfolgreichen Pfade sind kein Dauerprofitnachweis.

## 4. Negative Belege und Grenzen

Die neuen Tests verlangen bei jeder abgelehnten Ausführung einen **bytegleich unveränderten Originalsave**, einschließlich Geld, Ware, Vertragsstatus und RNG:

- W4 ohne reales Nadir-Erz: `Es fehlt real angeliefertes Erz in Nadir`; W5 ohne reales Material: `Nicht genug reales W4-Material in Nadir`.
- Fremder W3-Auftrag am vorbestellten, noch angedockten Speditionsfrachter: `Schiff gehört nicht dem Besitzer`. Während späterer Reise sperrt zusätzlich der physische Dock-Gate; dieser spätere Fehler allein wäre kein isolierter Eigentumsbeweis.
- `house:stationRefine` und `house:stationBuildShip` werden trotz laufender realer Industrie abgewiesen. K7-Bergbau-/Fracht-/Werftsignatur und Commit als `house` ebenfalls verweigert.
- Doppelte W4-/W5-Finanzierung während derselben laufenden Arbeit abgewiesen. Nicht angebotene J8-IDs für fremde Fertigung und `transport:shipBuy` verleihen keine Rechte.
- Fünf manipulierte aktive Original-Spielstände werden jeweils **direkt vom Original-Loader und zusätzlich in einer frischen J8-Sitzung** verworfen: geldsummenneutrale Haus→Werft-Umbuchung, geldsummenneutrale Werft→Arbeitstreuhand-Umbuchung, gefälschtes Material mit angepasster Warenledger, Speditionseigentum auf `house` geändert, Werftsignatur entfernt. Eine frische Sitzung akzeptiert zuvor den unveränderten Originalsave. Separat verweigert die bereits laufende Sitzung jeden Überschreibungsversuch und bleibt unverändert.

Vorhandene Regressionen ergänzen echte Unterfinanzierungs-/Absatzbelege: Im historischen unveränderten Rule19-Pfad entsteht eine zweite bezahlte Hülle, aber `transport` hat nur **740 statt 750 ISK**; Kauf ohne Buchung verweigert. Im Rule18-Pfad sind nach fünf bezahlten Erzfrachten und 15 W4-Chargen Nadirs Mittel erschöpft; eine 16. Charge scheitert trotz restlichem Erz. **Diese Altprofil-Belege sind kein angeblicher identischer Kassenverlauf der heutigen Regel204-S02-Welt.**

Entwicklungsfehlversuch transparent: Nach dem ersten grünen 3/3-Lauf wurde eine strengere W3-Rechteassertion ergänzt. Der Zwischenlauf bestand 2/3, weil die Test-Regex `Eigent|fremd` die korrekte Meldung `Schiff gehört nicht dem Besitzer` nicht erfasste. Nur die Assertion wurde auf die tatsächlich geprüfte Meldung korrigiert; keine Core-/Regel-/Referenzänderung. Der finale M3-Lauf besteht 3/3.

Der unabhängige Testreview fand außerdem einen zunächst falsch positiven Beleg: `oeffnen204` auf einer laufenden Sitzung bricht bereits vor dem Ladeaudit mit dem allgemeinen Überschreibungsschutz ab. Die fünf Negativfälle wurden deshalb zusätzlich gegen den Original-Loader und frische Sitzungen ausgeführt; erst dieser korrigierte, erneut **3/3 erfolgreiche** Lauf belegt tatsächlich die Manipulationsabwehr. Es wurde kein Produktfehler behauptet oder durch eine Core-Änderung verdeckt.

## 5. Offene PRs und Kollisionsschutz

Die GitHub-Connector-Suche lieferte **35 offene PRs** (vor Erstellung dieses Drafts). Für #490, #496, #501 und #505–#511 wurden zusätzlich die tatsächlich geänderten Dateilisten gelesen; für #490/#505/#506/#509–#511 auch Head-/Basis-Metadaten. Ein zusätzlicher CLI-Abgleich über `gh pr list` scheiterte mit GraphQL `Forbidden`; er wird nicht als Bestätigung gezählt. Es wurde ausschließlich auf den neuen M3-Branch geschrieben.

| Offener Strang | Geprüfter Stand / Risiko | Abgrenzung dieses Audits |
| --- | --- | --- |
| #496, #501, #505 | Folgezyklen/Zweitkauf und blockierte W5ac-Fenster. #505 Head `0234bf4e`, Basis `main`; dedizierte P3-Minutenfenster-Tests | Keine Änderungen an deren Fixtures, Tests oder Berichten; kein eigener zweiter-F4-/Kapazitätsversuch |
| #506 → #509 → #510 → #511 | Gestapelte Forschung: `2901a204` → `6316e5ab` → `52fddda1` → `da686630`; jeweilige Basis ist der vorherige Forschungsbranch. #506/#509/#510 ändern `welt-kern.js`, #511 unabhängige Tests/Soaks | Kein Cherry-pick, keine Queue-/Prioritätsregel, keine Forschungsaktivierung. Öffentlich beschriebene Fairness-/S03-Risiken bleiben Forschungsbelege, wurden hier nicht neu ausgeführt |
| #507 / #508 | Schwester-F4-Forschung bzw. unabhängiger Queue-Audit; #507 ebenfalls Weltkernänderung | Keine Änderung und kein vermischter Integrationsstatus |
| #490 | W6-Langzeitaudit Head `4ecdb6bf`, Basis `main f86bcd4`; eigene `tests/industrie/`, Werkzeuge/Fixtures/Workflow | Keine Langzeitdatei übernommen oder ersetzt; kein neuer 365-/730-Tage-Freigabenachweis |
| #470, #423, #376, #335, #288, #286, #284, #283, #281, #279, #265, #252, #245, #243, #170 | Weitere offene Wirtschafts-/Regel-/Konzeptforschung einschließlich historischer W5-Originalforschung | Nur PR-Inventur/Einordnung; nicht als heutige Spielerrechte oder integrierte neue Regeln übernommen |
| #337, #321, #317, #305, #291, #198, #195, #189, #187, #186 | Flug-/Legacy-/lesende Vorschauen | Kein Arbeitsauftrag/Integrationskandidat dieses M3-Audits |

Der im PR-Text von #511 beschriebene starke S03-Rückgang der NPC-Eisfrachten bei Forschungsdisposition ist ein zusätzlicher Grund, keine vermeintliche M3-Abkürzung über dessen Warteschlange einzubauen. Die dortigen CI-/Langzeitangaben wurden in diesem Auftrag nicht unabhängig neu ausgeführt und erhalten hier kein grünes Freigabelabel.

## 6. Tatsächlich ausgeführte Prüfungen

Node **22.23.4**, aus dem Repository-Verzeichnis; im Shell-PATH lag zunächst Node24, deshalb wurde explizit `/workspace/check-tools/node-v22.23.4-linux-x64/bin` vorangestellt bzw. der volle Node22-Pfad genutzt.

```sh
node --test tests/*.test.mjs
node --test tests/m3-industrie-audit.test.mjs
node --test tests/w5y-original-w3-freight.test.mjs tests/w5aa-original-w4-refinery.test.mjs tests/w5ab-finanzierter-schiffbau.test.mjs tests/p3-industrie.test.mjs tests/p3-npc-frachterbeschaffung.test.mjs tests/p3-werft-spedition.test.mjs tests/p3-werft-mehrschiff.test.mjs tests/p3-werftfrachter-f4.test.mjs
```

| Ebene / Lauf | Ergebnis |
| --- | --- |
| Neue M3-Tests | **3/3**, 0 Fehler/Skips/Abbrüche; Checkpoints, laufender Save/Replay, Rechte, fehlende Ware, Doppelfinanzierung, fünf Fehlimporte |
| Vorhandene gezielte Industrie-/P3-Regression | **26/26**, 0 Fehler/Skips/Abbrüche; 8 vorhandene Dateien, ca. 34,3 Sekunden |
| Vollständiger bestehender Node22-Pflichtlauf | **535/535**, 0 Fehler/Skips/Abbrüche, ca. **642,7 Sekunden**; Shell-Glob vor Anlegen der drei neuen Tests expandiert, daher neue Tests separat gezählt. Zusammen 538 verschiedene bestandene Tests, der 26er-Fokuslauf ist eine Teilmenge der 535 |
| Chromium-Touchsimulation | In diesem Analyseauftrag nicht ausgeführt; keine Produkt-UI geändert |
| WebKit-Touchsimulation | In diesem Analyseauftrag nicht ausgeführt |
| Pages/HTTP-Smoke | Nicht ausgeführt; kein Deployment-/Veröffentlichungsnachweis dieses Auftrags |
| Echtes iPad Safari / privates NAS | **OFFEN**, nicht getestet und nicht veröffentlicht |

Die breite vorhandene Regression enthält historische 13-Seed-/90-Tage-Checks sowie vorhandene Wirtschaftsregime-Tests. Daraus wird kein neuer vollständiger 13×90-/365-/730-Tage-Nachweis einer vom Spieler steuerbaren M3-Kette abgeleitet. Node simuliert teilweise DOM/Storage und ersetzt keinen Work-Praxistest.

Der in diesem Lauf erneut ausgeführte **Regel207/P8h-S02-Test bis Tag730** protokolliert an Tag90/365/730 jeweils dieselben realen Mengen: **5 abgeschlossene W3-Verträge, 3 W5-Frachter, 4 gebaute/3 verkaufte Jäger, 0 brauchbare Aldera-Speditionsfrachter, 0 Silizium**, bei 33.000 ISK/Mint-Burn 0. Endhash `d50f27e2c0b8e409`. Damit ist ein konkreter negativer Dauerbetriebsbefund aktuell reproduziert; finanzieller Bilanzschutz garantiert keinen fortgesetzten Absatz oder Rohstoffnachschub.

Nach Testabschluss wurde `origin/main` erneut geholt: weiterhin **`ca8a41960ca41033326d7b105c974d55b083fb79`**. Diff-/Whitespaceprüfung: ausschließlich der neue Bericht und die neue Testdatei; keine geschützte Produktdatei geändert.

Ein durch den späteren Draft ausgelöster GitHub-CI-Lauf ist ein eigener Nachweis und wird hier nicht vorab als bestanden bezeichnet. Es gibt in diesem Auftrag kein Merge-/Release-Gate und keinen Pages-Deploy.

## 7. Höchstens drei priorisierte Folgeaufträge (je ca. 30 Minuten)

1. **P1 – M3-Rechte-/Buchungsansicht konkret spezifizieren.** Eigenständiges Dokument mit sechs vorhandenen Original-Checkpoints: Auftraggeber, Eigentümer, Zahler, gebunden/bezahlt, Lieferung/Abschluss und zulässige Hausaktion. Abnahme: jede Zahl auf vorhandenes Core-Feld rückführbar, kein fremder Startknopf, kein Gewinnversprechen; Standard204/S02/207-Sichtbarkeit ausdrücklich erklärt. Nur neue M3-Dokumentation, keine Überschneidung mit Work-UI oder P3-Kernforschung.
2. **P2 – Finanzierungs- und Kapazitätsgrenzen auf Regel204 unabhängig nachweisen.** Nur neue M3-Tests für durch Originalbefehle erreichte echte Budget-/Lager-/Streckenblockaden; volle gegen knappe Finanzierung mit gleichen Seeds gegenüberstellen. Abnahme: exakte Sperrgründe, unveränderte Saves bei Verweigerung, eigener Waren-/Geldcheck und Replay. Keine Kassenmanipulation als gültiges Fixture, keine Forschungskopie und keine Referenzkorrektur für Grün.
3. **P3 – Bestehende S02-Industrieansicht im Managerpfad bedienbar erklären.** Erst nach abgeschlossenem Work-M1/M2-Diff und frischem main-Abgleich ein enges eigenes UI-Paket: vorhandene Industrieakte auffindbar machen und Rechte/Bindungen aus Auftrag1 anzeigen; nur erlaubte Original-Hausaktionen nutzen. Abnahme: Chromium/WebKit-Touch, echter Hüllenkauf/gesperrter Kauf sowie Save/Load; kein automatisches Opt-in, keine neue W3/W4/W5-Prokura und keine W5ac-Prioritätsänderung. Falls in 30 Minuten nicht sauber abgrenzbar: konkrete Lücke dokumentieren statt Work- oder Forschungsdateien zu überlagern.

Diese Folgeaufträge sind Empfehlungen, wurden nicht gestartet und ändern weder Roadmap-Prioritäten noch Wirtschaftsrechte. M1/M2-Praxistest und offene P3-Forschung behalten ihre eigenen Ergebnisse und Integrationsgates.
