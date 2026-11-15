# W6/P7 – 730 Tage mit aktivierter NPC-Silizium- und Jägerwirtschaft

**Stand: 15.11.2026 · [ANALYSE, ABGESCHLOSSEN]**. Unabhängige Langzeitprüfung der bereits [MAIN] im opt-in S02-Karrierestart veröffentlichten Regel204-Silizium-/Jägerkette. Sie ist **kein** Nachweis einer unbegrenzt nachhaltigen W6-Gesamtwirtschaft.

## Verifizierte Quelle und Provenienz

- **Forschungs-Draft [#403](https://github.com/tobiasfranziskus/Check/pull/403)**, geprüftes Code-Head `d2ee40dc3ba75a42e7cc410318397753aab9ee7d`. Nach bestandener QA **ohne Merge geschlossen**, Branch und Logs erhalten.
- **[Tatsächlich abgeschlossene GitHub-Actions-Abnahme #43746750588](https://github.com/tobiasfranziskus/Check/actions/runs/43746750588)**: `completed/success` mit Node22; 2/2 P7-Beobachter-/Vertragstests, 0 Fehler/Skips. Parallel geprüfte Node22-Gesamtsuite: **347/347** Tests, 0 Fehler/Skips sowie NAS-Singlefile, Original-Wirtschaftsregression und Touch-Preflight. Der erste Lauf [#43744834523](https://github.com/tobiasfranziskus/Check/actions/runs/43744834523) erreichte zwar Tag730, scheiterte danach aber bei der finalen Ergebnisausgabe an einem falschen Variablennamen und wurde **nicht** als erfolgreich gezählt.
- [GitHub-Actions-Artefakt mit tatsächlichen Save-Dateien zu Tag90/180/365/730](https://github.com/tobiasfranziskus/Check/actions/runs/43746750588/artifacts/14175181732); Aufbewahrung nur sieben Tage. Rohwerte und Abschlussbericht sind auch in den erhaltenen [PR-Kommentaren #403](https://github.com/tobiasfranziskus/Check/pull/403) festgehalten.
- Im 730-Tage-Lauf war die **bereits im Produkt vorhandene** `npcAuto`-W6-S02-Politik aktiviert, dazu `npcSiliziumSetzen(true)`. Nichts wurde gefälscht, gefüllt, geschenkt oder durch einen zweiten Wirtschaftskern erzeugt. In den ersten 90 Tagen exakt derselbe 120-Minuten-Kaufpfad wie im integrierten P6-Regressionstest, Referenzhash `686355895f27fbb8`.

## Wiederholbare, tatsächlich gemessene Ergebnisse

| Spieltag | Core-Hash | gefertigte J4 | Hauskäufe | Siliziumrest | bezahlte Ersatzkäufe | Eisförderung | Wassererlös (ISK) | erfasste Lohnzahlungen (ISK) |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 90 | `686355895f27fbb8` | 2 | 1 | 0 | 93 | 50.734 | 760.900 | 367.802 |
| 180 | `a760744505f6bbe1` | 2 | 1 | 0 | 187 | 102.450 | 1.540.700 | 736.783 |
| 365 | `a8e54b167d8b993a` | 2 | 1 | 0 | 379 | 209.233 | 3.143.518 | 1.493.268 |
| 730 | **`4cae5fa6ea9d1f41`** | **2** | **1** | **0** | **758** | **419.099** | **6.305.344** | **2.986.716** |

Die Lohnspalte bezeichnet ausschließlich die unveränderte aggregierte Kennzahl `W6.kennzahlen(...).loehne`; zusätzliche Raffinerie-/Schiffbau-/Werftlohnarten sind hier nicht vollständig ausgewiesen. Sie ist kein Nachweis einer separat summierten Vollkostenrechnung.

**Originaler Spieler-Kauf:** bei Tick **12.240**, ein vollständig bezahlter Nadir-Jäger für **900 ISK**, danach frei sparbares Spielerrestgeld **2.100 ISK**. Die zweite Hülle verbleibt beim realen Verkäufer, wird nicht gratis übertragen. Alle Checkpoints: **33.000 ISK Weltgeld**, Mint/Burn **0**, keine negative Kasse. Original-Core-/unabhängige Waren-/Schiffs-/Eigentums-/Manipulations- und Save/Load-Prüfungen erfolgreich.

**Determinismus:** Alle vier Core-Hashes aus dem formal zuerst fehlgeschlagenen Lauf wurden im vollständig grünen zweiten Lauf exakt bestätigt. Die am Tag180 und Tag365 gespeicherten Zustände wurden jeweils auf **Tag181 beziehungsweise Tag366** fortgesetzt: ein Original-`advance(1440)` ergab exakt denselben kanonischen Zustand wie **12×`advance(120)`**. Das ist eine tatsächliche Datei-Fortsetzungsprobe; keine Behauptung eines separaten vollständigen 365→730-Replays.

**Grenze einer Protokollkennzahl:** `activeLast30` im ungemergten Forschungswerkzeug vergleicht bei Tag730 tatsächlich **Tag720→730 (10 Tage)**, weil Tag700 kein regulärer Rasterpunkt war. Die positive Änderung belegt den jüngsten 10-Tage-Zeitraum, **keine** exakt 30-tägige Differenz. Dies berührt weder 730-Tage-Zustand, Hashes, Ledger noch die anderen Checkpoints.

## Fachliche Auswertung und nächste Priorität

**[NACHGEWIESEN]** Die S02-Eis-/Wasser-/Lohn-/Ersatzwirtschaft ist am Ende des 730-Tage-Horizonts weiter aktiv. 758 Original-Ersatzkäufe und steigende Eis-/Wasser-/Lohnkennzahlen sind real verbucht, nicht durch Rettungszahlungen simuliert.

**[NACHGEWIESENER NEGATIVBEFUND]** Die Jägerindustrie fertigt **keinen dritten Jäger**: Das eine originale, physische J2b-Siliziumfeld hat nach 16/16 geförderten Einheiten keinen Bestand; Nadir verarbeitet die zwei vollständigen originalfinanzierten J3/J4-Chargen, mehr nicht. Andere Siliziumfelder in allgemeinen Geografiedaten gelten **nicht** als abbaubare Regel204-Waren oder finanzierte Transportketten.

**[OFFEN]** Die übrigen acht krisenhaften 90-Tage-Regime wurden nicht durch S02 geheilt. Eine nachhaltige mehrstufige W6-Jägerkette verlangt weitere **endliche physische** Lagerstätten, einen wirklich bezahlten Miner-, Transport- und Käuferkreislauf, Originaleigentum und prüfbare Verfügbarkeit. Ein stilles Auffüllen des bestehenden Felds, künstliche ISK-Emission oder garantierte Nachfrage sind keine zulässigen Abkürzungen.

**[QUALITÄT]** Bei Tag730 lagen **763 historische Schiffsobjekte** im gespeicherten Zustand. Das Langzeitwerkzeug benötigte im zweiten, parallel mit weiteren GitHub-Jobs laufenden Gesamtprozess **926,15 Sekunden**; dieser Wandwert ist **kein isolierter Browser-/iPad-Benchmark**. Reale iPad-Safari-/NAS-Abnahmen weiterhin offen.

Die abschließende P7-Abnahme wurde **ohne Core- und Produktdateiänderung** durchgeführt. Sie verpflichtet nicht zum Merge der allein zur Forschung erstellten Runner-Tools und ihrer testauslösenden CI-Workflows.
