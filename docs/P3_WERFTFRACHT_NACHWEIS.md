# P3: Werftfrachter im bezahlten Handelskreislauf

**[ANALYSE / DRAFT, 18.11.2026] Kein Nachweis wiederholbarer F4-Frachten.**
Basis exakt `45d0a2cf6ad383556b629dab6bebbfc240671dfa`, PR #491,
Zielbranch `integrate/p3-werftfrachter-ueberfuehrung-20261118`.
Keine Wirtschaftsregel, Produktdatei, bestehender Test, Roadmap oder Projektstatus geändert.
Kein Merge, kein Deployment. Seed 42, reale S02-Regel204, kein Regel207-Ersatz.

Der erste F4-Auftrag scheitert trotz finanzierbarer Originalofferte an
`K1: ungültigen Zustand nicht speichern: K1-Spielerfracht/Vertragslohn`.
Die in Nadir gefertigte Hülle `sh004` behält nach bezahlter Überführung rechtmäßig
`heimat: nadir`. `m_core_spielerfracht.audit` verlangt dagegen `heimat === 'aldera'`
(`prototypes/welt/welt-kern.js`, Vertragsprüfung um Zeile 889).
Das Angebot prüft nur `execute` auf dem Klon, die tatsächliche J8-Ausführung zusätzlich
Save/Load und Audit. Daher ist das Angebot grün, der Auftrag aber nicht ausführbar.
Ein Umschreiben der Heimat, geliehener Startfrachter oder Weiterrechnen des ungültigen
Klons wäre kein zulässiger Nachweis. Das geschieht hier nicht.

## Reproduktion und tatsächliche Befehle

```sh
node --version  # geprüft: v22.23.4
node tools/p3-werftfrachter-fracht.cjs > /tmp/p3-result.json
node tests/p3-werftfrachter-fracht.test.mjs
node --test tests/*.test.mjs
```

Das Werkzeug liefert komplette Konten-/Lagerstände, Anlagenbuchwerte, Originalaudits,
Negativbefunde und jeden Befehl mit Hash als JSON; keine Laufzeitabhängigkeiten.
Jeder rechtmäßige Schritt besteht Originalaudit, Core-Save/Load und kalten J8-Reload.

Start: `J8.erstellen(); starten195(OLD.create(42,'private195').export(),true)`.
Anschließend ausschließlich vorhandene Core-Politikbefehle wie beim S02-Spielstart:
`politikSetzen({stilllegung:true,betriebsreserve:{werft_extern:1060}})`,
`npcAutoSetzen(true)`, `npcSiliziumSetzen(true)` auf der Weltreferenz.
Die Werftreserve ist eine gespeicherte Dispositionspolitik, keine Geldzuführung.
Die NPCs signieren und bezahlen Erzförderung, W3, W4 und W5 selbst;
der Spieler verfügt nie über ihre Kassen. Nach 300 Minuten sind 50 Erz geliefert,
10 Erz zu 5 Material raffiniert und daraus eine W5-Hülle hergestellt.
W3-Löhne 120, Raffinerielöhne 20, Werftlöhne 30 ISK sind bezahlt.

Die folgenden IDs gehen über `j.ausfuehren(id)` an den Originalkern;
`advance(n)` bedeutet `j.weiterspielen(n)` mit einer Weltminute je Tick.

| Minute | Tatsächlicher Befehl / Ergebnis | Hash danach |
|---:|---|---|
| 60 | `advance(60)` | `4220dd3cc9a9356e` |
| 120 | `advance(60)` | `9d55bd52fcd4826c` |
| 180 | `advance(60)` | `6c072b0cd3eef9ef` |
| 240 | `advance(60)` | `641b88513e21f5c7` |
| 300 | `advance(60)` | `b634031863e65b57` |
| 300 | `buy-st_nadir-frachter` | `126037a82fe38879` |
| 300 | `reposition-sh004` | `f9a2345c3b085fdf` |
| 310 | `advance(10)` | `8c4e8d01909d9725` |
| 320 | `advance(10)` | `1005fb751419090d` |
| 330 | `advance(10)` | `a5cdf84a0f977a4b` |
| 340 | `advance(10)` | `ab9084b2defbb961` |
| 350 | `advance(10)` | `21dbd4a8f01434b4` |
| 360 | `advance(10)` | `da11aacaa43f77bf` |
| 360 | `buy-st_aldera-miner` | `9d7d77dfd50cd98b` |
| 360 | `ice-sh005` | `8b904de4e508ca37` |
| 360 | `freight-sh004 — abgelehnt: Noch keine echte 50er-Eischarge im Quelllager` | `8b904de4e508ca37` |
| 420 | `advance(60)` | `d81505b3ef7f4922` |
| 480 | `advance(60)` | `b90f5cbcb1957541` |
| 480 | `freight-sh004 — abgelehnt: K1: ungültigen Zustand nicht speichern: K1-Spielerfracht/Vertragslohn` | `b90f5cbcb1957541` |

Der Originalkauf kostet 750 eigene ISK; `sh004` steht in `w5.schiffIds`.
Warenledger und Nadir-Lager buchen exakt eine vorhandene Hülle aus.
Der W5ac-Vertrag bindet vor Abflug 60 ISK vollständig in der Lohntreuhand.
Sechs 10-Minuten-Schritte belegen Transit, Lohnzahlung und wirkliche Ankunft;
60 ISK gehen an den Überführungspiloten. Herkunft und Eigentum bleiben erhalten.
Danach Kauf des eigenen Miners `sh005` für 600 ISK und Original-Eispendel.
Der automatische Start prüft 100 ISK komplette Förderlöhne plus 40 ISK Flugreserve
und die 250 ISK Abnahmefähigkeit Alderas. Förderung wird minutengenau bezahlt;
die Flugreserve wird vor Abdocken gebunden. Der Kern hinterlegt Förderlöhne
hier nicht zusätzlich als Fracht-Treuhand. Keine neue Vorfinanzierungsregel ergänzt.
Bei Minute 420 sind 50 selbst geförderte Eis an Bord; bei Minute 480 sind sie
rechtmäßig für 250 ISK verkauft und liegen physisch in Aldera.

## Tatsächliche Rechnung

Firmenvermögen hier: Firmenkasse `house` plus Originalbuchwerte aller eigenen Hüllen.
Privater Pilotenlohn ist getrennt; er wird nicht als Firmenerlös doppelt gezählt.
Während des Zwischenpunkts 310 ist noch Überführungslohn gebunden;
die Endrechnung benutzt den vollständig abgerechneten Zustand 480 ohne eigene Resttreuhand.

| Zustand | Minute | Spieltage seit Start | Firmenkasse | privater Pilot | Hüllenbuchwert | Firmenvermögen | Hash |
|---|---:|---:|---:|---:|---:|---:|---|
| S02 | 0 | 0.000000 | 3000 | 0 | 0 | 3000 | `ce8981e5f1f76276` |
| produced | 300 | 0.208333 | 3000 | 0 | 0 | 3000 | `b634031863e65b57` |
| purchased | 300 | 0.208333 | 2250 | 0 | 750 | 3000 | `126037a82fe38879` |
| ferry-in-transit | 310 | 0.215278 | 2190 | 0 | 747 | 2937 | `8c4e8d01909d9725` |
| arrived | 360 | 0.250000 | 2190 | 0 | 732 | 2922 | `da11aacaa43f77bf` |
| mining-financed | 360 | 0.250000 | 1590 | 0 | 1332 | 2922 | `8b904de4e508ca37` |
| F4-offered | 480 | 0.333333 | 1719 | 21 | 1311 | 3030 | `b90f5cbcb1957541` |
| blocked | 480 | 0.333333 | 1719 | 21 | 1311 | 3030 | `b90f5cbcb1957541` |

| Vorgang | Erlös | Zahlung / Aufwand | Verschleiß / Buchwertverlust | Vermögensänderung |
|---|---:|---:|---:|---:|
| W5-Kauf | 0 | 750 Kaufpreis gegen Anlage 750 | 0 | 0 |
| Überführung | 0 | 60 Pilot | 60 aktive Minuten / 18 ISK | −78 |
| Minerkauf | 0 | 600 Kaufpreis gegen Anlage 600 | 0 | 0 |
| Erste echte Eisförderung und Verkauf | 250 | 100 Förderlohn + 21 Fluglohn | 71 aktive Minuten / 21 ISK | +108 |
| F4-Versuch 1, abgelehnt | 0 | 0 tatsächlich gebunden/gezahlt | 0 | 0 |
| Summe | 250 | 1.531 einschließlich 1.350 Anlagenkäufe | 39 ISK | +30 |

Endkasse: `3000 − 750 − 60 − 600 − 100 − 21 + 250 = 1719`.
Endanlagen: Frachter 732 + Miner 579 = 1.311; Gesamtvermögen 3.030.
Von 40 ISK Miner-Flugreserve sind 21 verausgabt und 19 zurückerstattet.
Die 21 privaten Piloten-ISK stehen gesondert in `pilot_house`.
**Abgeschlossene eigene Frachten: 0.** Keine Transporterlöse, Transportlöhne,
Transportabschreibung oder weitere Investition aus Frachtererlösen nachweisbar.
Die Überführung ist keine verkaufte F4-Fracht. NPC-Frachten sind kein Spielerumsatz.

## Abbruch, Kapital und finanzierbare Option

Minute 480: Firmenkasse 1.719, Aldera 250, Nadir 3.740 ISK;
50 Eis in Aldera, leerer eigener Frachter physisch angedockt in Aldera.
Ein weggeworfener Diagnoseklon zeigt, was der Originalauftrag zunächst bucht:
120 ISK volle Hin-/Rückflug-Lohntreuhand, 490 ISK Käufer-Treuhand
(250 Warenwert + 240 Frachttarif), 50 Eis in `sh004`.
Geld-, Waren-, Eigentums-, Flug-, W3/W4/W5- und W5ac-Unteraudits sind dort grün;
ausschließlich `K1-Spielerfracht/Vertragslohn` scheitert. Schon Speichern wird verweigert.
Die echte Sitzung bleibt bytegleich mit dem Stand vor dem Versuch.

**Der erste Abbruch ist technisch, kein nachgewiesener wirtschaftlicher Engpass.**
Eine Behauptung, Käuferbudget oder Betriebskapital verhindere bereits diese erste
Fracht, wäre falsch. Deshalb keine Wiederholungen und keine erfundene langfristige
Wirtschaftsgrenze. Die erste konkret belegbare Investitionsgrenze ist der erwirtschaftete
Gesamtüberschuss von nur 30 ISK: weder 600-ISK-Miner noch 750-ISK-Frachter sind
allein daraus finanzierbar; Frachtüberschuss ist null.

Eine wirklich ausgeführte Option auf einer getrennten Kopie des unveränderten
Minute-480-Saves: einen zweiten vorhandenen Aldera-Miner für 600 ISK kaufen.
Kasse danach 1.119, drei eigene Hüllen, Vermögen weiterhin 3.030,
Hash `cc75a1672492e4d1`. Das ist aus vorhandenem Kapital finanziert, kein
Ersatzfinanzierungsnachweis aus Frachtgewinn. Aldera hat nur 250 ISK für genau
eine weitere 50er-Abnahme; zusätzliche Miner schaffen keine zusätzlichen Käufer.
Praktisch zunächst Kapital halten und den F4-Widerspruch klären, statt ungesicherte
zusätzliche Absatzkapazität zu versprechen. Kein Rettungskapital implementiert.

## Prüfungen und Grenzen

- Nach jedem rechtmäßigen Schritt Original-Core-Audit einschließlich Geld/Waren,
  Schiffsherkunft, Eigentum, Verträgen und Flugzustand; Weltgeld unabhängig aufsummiert:
  immer 33.000 ISK, Mint/Burn 0, keine negative oder unsichere Kontozahl.
- Voller deterministischer Neuaufbau dreimal im gezielten Test: identisches
  Ergebnisobjekt, alle Schritt-Hashes und bytegleicher Endsave. Zusätzlich kalter
  Endsave-Reload mit erneut atomar scheiterndem F4 und identischer legaler Fortsetzung.
- Transit-Save/Load bei Minute 310 und alle weiteren Zwischenstände, einschließlich
  echter Ankunft, gehen durch Core- und J8-Import. Kein Spielerstand überschrieben.
- Acht manipulierte Saves zurückgewiesen: saldenneutrale Geldverschiebung,
  fremdes Eigentum, gefälschte Aldera-Heimat, Gratis-Eis, unbezahlte Überführung,
  entfernte Werftherkunft, Regel207 und zukünftiges Schema.
- Fehlende Ware ist ein natürlich erreichter Negativfall bei Minute 360.
  Fehlendes Käuferbudget, fehlendes Betriebskapital und beladener Frachter werden
  zusätzlich auf ausdrücklich künstlichen, weggeworfenen Negativkopien isoliert
  geprüft. Jede Ablehnung ändert den jeweiligen Klon nicht. Diese Kopien werden
  weder importiert noch als erreichbare Wirtschaftsverläufe ausgegeben.
- Originalmeldungen: „Nadir kann Eis und Hin-/Rueckfracht nicht bezahlen“,
  „Spieler kann beide Fluege nicht vorfinanzieren“,
  „Eigener leerer Frachter am Aldera-Dock erforderlich“.
- Gezielte Tests direkt unter Node22: 2/2 bestanden, 0 Fehler, 0 übersprungen.
  Vollständige Node22-Suite auf dem finalen Code: **tests 529; pass 529; fail 0; cancelled 0; skipped 0; todo 0; duration_ms 421317.950254**.
  Der erste Sandbox-Lauf meldete 101/106 Dateimodule bestanden, fünf Fehler durch
  `spawnSync git EPERM`. Die fünf unveränderten Dateien bestanden ohne diese
  Prozesssperre mit 11/11 Einzeltests. Anschließend wurde die **gesamte** Suite
  ohne Prozesssperre erneut ausgeführt; obiges Endergebnis gehört diesem Lauf.
  Logdateien der lokalen Ausführung: `/tmp/p3-node22-full.log`,
  `/tmp/p3-node22-suite.log`, `/tmp/p3-node22-retry.log` (nicht versioniert).
- Kein UI-Code verändert; keine neuen Browser-, Touch-, iPad-/Safari- oder
  NAS-Abnahmen. Kein Merge oder Deployment; keine Aussage über öffentliche Integration.

## Empfehlung für den nächsten P3-Spielschritt

Zuerst den Widerspruch zwischen Original-F4-Angebot und Vertragsaudit für eine
rechtmäßig aus Nadir überführte W5-Hülle separat beheben und fachlich prüfen lassen.
Herkunft nicht umschreiben und Audit nicht pauschal lockern. Angebot muss die
Ausführbarkeit einschließlich Audit widerspiegeln. Danach genau diesen Nachweis
mit derselben Schiff-ID bis zu wiederholter Abrechnung und realem Absatzende erneut
laufen lassen. Erst dann Frachtererlöse, Abschreibung, Ersatzfinanzierung und
Wirtschaftlichkeit in die P3-Spielintegration übernehmen. Dieser Draft ist der
reproduzierbare Negativnachweis, keine Freigabe neuer Wirtschaftsregeln.
