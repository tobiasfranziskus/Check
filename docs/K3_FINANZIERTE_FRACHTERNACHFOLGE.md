# K3 – Frachternachfolge und S12-Materialgrenze

**[DRAFT / ANALYSE, 12.11.2026]** Auftrag [#303](https://github.com/tobiasfranziskus/Check/issues/303), gestapelt auf [#301](https://github.com/tobiasfranziskus/Check/pull/301), Basis `d7fe397401cfb8513bd1a7a79dba05483b8a9c71`. Beim Start separat verifiziert: main `04124f2bca27dc33b54be30c07b6a7bbb7387e81`, #300/#301 offen und Draft. Auf der K2-Basis sind K1-CI [43163850385](https://github.com/tobiasfranziskus/Check/actions/runs/43163850385), RC1 [43163850351](https://github.com/tobiasfranziskus/Check/actions/runs/43163850351) und JS [43163850484](https://github.com/tobiasfranziskus/Check/actions/runs/43163850484) completed/success. Das sind Basisprüfungen, keine K3-Abnahme.

## Ergebnis und Abbruchregel

**Der bestehende S12-Lauf enthält bereits vier vollständig bezahlte Frachternachfolgen mit anschließender echter Eisfracht und Wasserproduktion.** Ein fehlender implementierter Kauf-/Transferpfad ist nicht die terminale Ursache. Nach Verbrauch der letzten Hülle fehlt physisches Industriematerial. K3 verwendet deshalb die ausdrückliche Abbruchregel des Issues: reproduzierbarer Negativbeweis und atomare Ablehnungen, keine neue Rettungsregel. Die Wirtschaft bleibt negativ. Es gibt keine Änderung am Disponenten, an Preisen, Rezepten, Tickfolge, Rule-/Schema-Nummern oder Speichern.

Der Beweis gilt für **S12 mit unveränderten Regeln und seiner Befehlsfolge ab dem belegten Engpass**. Er beweist nicht, dass jede denkbare frühere Beschaffungsstrategie unmöglich wäre. Eine frühere andere Verteilung des begrenzten Erzes wäre ein gesondertes Experiment. „Nachfolge grundsätzlich unmöglich“ oder „fehlendes Speditionskapital“ wären falsche Schlussfolgerungen.

## K3a: minutengenaue Diagnose

Reproduktion: `node tools/k3-frachter-diagnose.mjs 42`. Vollständige maschinenlesbare Ausgabe: [K3_DIAGNOSE_SEED42.json](K3_DIAGNOSE_SEED42.json). Keine Log-String-Schätzung: jeder Simulationsminute folgen unabhängige Geld-, Waren-, Hüllen-, Werftarbeits- und Transferreservegleichungen. Die Ausgabe enthält je Bau/Kauf/Überführung/Stilllegung sämtliche Eigentümerkassen, Rücklagen (als Teil der Kasse), offene Verträge, Lager, Fracht und Hash. Die sechs Firmenkassen werden separat aus Anfangskapital, realisierten Originalerlösen/-kosten, tatsächlich noch gebundenen Arbeits-/Erzkaufmitteln und aus Gegenkonten neu summierten K1-Transfers rekonstruiert; eine ausgeglichene illegale Umbuchung wird ausdrücklich negativ getestet.

| Hülle (Eigentümer transport) | Kauf | Überführung Nadir–Aldera | erste Stilllegung |
| --- | ---: | --- | ---: |
| sh002, Gründung | Tick 0 | bereits Aldera | 2625 |
| sh008 | 2625 | 2645–2705 | 5145 |
| sh011 | 5145 | 5225–5285 | 7725 |
| sh013 | 7725 | 7805–7865 | 10305 |
| sh014 | 10305 | 10385–10445 | 12885 |

Erster stillgelegter Erzminer sh001: Tick2000; Eisminer sh003: Tick3677. Die Ersatzhüllen nutzen dasselbe Originalschiffregister. Stilllegung ist kein Entfernen oder Reaktivieren. sh014 wird während einer bereits bezahlten Rundfracht verbraucht; die laufende vertragliche Rückfahrt wird noch abgeschlossen. Das ist keine neue Gratisfahrt. Ab Tick12965 sind alle fünf Frachter am Aldera-Dock verbraucht und ohne Folgeauftrag.

Letzte abgeschlossene Erz-Rundfracht: Tick2825 (100 Erz insgesamt geliefert); letzte Eis-Rundfracht: Tick12965 (103 insgesamt); letzte Wassercharge: Tick13005; letzter Endabsatz: Tick13045 (5.150 Wasser, 78.408 ISK tatsächlicher Umsatz). Der verbleibende Absatz nach dem Flottenausfall verwendet zuvor gelieferte Ware.

**Eigentümerbilanz bei Tick12965:** Spedition 4.283 ISK, davon 3.750 kalkulatorische Ersatzrücklage, nicht zusätzliches Geld; Werft 530; Nadir 3.980; Aldera 1.100; house 2.826; npc3 1.662. Einzig noch gebunden: 20 ISK laufende Wasserwerksarbeit. Keine offene Werft-, Erz-, Eis- oder Überführungstreuhand. Werft und Stationen sind zahlungsfähig. Eine Hülle plus Transfer plus nächste Flugarbeit benötigen 750+60+120=930 ISK der Spedition; Nadir braucht separat 490 ISK Eisankauf/Fracht (Erz: 740). Die Spedition könnte zahlen; es existiert keine kaufbare Hülle.

**Physische Rechnung:** 2.100 Erz gefördert = 1.993 exportiert + 100 raffiniert + 7 im stillgelegten sh001. Aus 100 Erz entstehen 50 Material; 6 Miner ×5 + 4 Frachter ×5 =50 verbraucht. Nadir: 0 Erz, 0 Material, 0 Hüllen. Aldera: 0 Erz im Stationslager, 0 Hüllen. Die 7 Erz sind fremdes Eigentum und keine verfügbare 10-Erz-Charge; selbst ihre vollständige rechtmäßige Lieferung würde noch 3 Erz für die erste W4-Charge vermissen lassen. Keine Reparaturregel existiert. Erzexportetat: 70 ISK; keine unbegrenzte industrielle Erzabnahme. Förderrechte/Abnahme dürfen nicht durch Diagnosewerkzeuge erfunden werden.

## K3b: originale Finanzierungskette und Grenze

Die bereits ausgeführte Kette bleibt autoritativ:

1. W3 bringt 50 reale Erz nach Nadir: 740 ISK Käuferbudget, separat 120 ISK vorfinanzierte Flugarbeit der Spedition.
2. W4 verarbeitet je 10 Erz in 20 bezahlten Minuten zu 5 Material (20 ISK Nadir-Arbeit).
3. W5 entnimmt 5 Material: Werft zahlt 500 ISK an Nadir und bindet 30 ISK für 30 echte Werftminuten. Hülle erst nach Arbeitsabschluss.
4. `shipBuy` zahlt 750 ISK vom Speditionskonto an die Werft. `shipReposition` bindet weitere 60 ISK und zahlt sie während 60 Flugminuten aus.
5. Erst danach echte Erz-/Eis-Rundfracht mit 120 ISK eigener Arbeitsreserve und unabhängig gedecktem Käuferetat; anschließend Wasserwerk und Endabsatz. Die Tests beweisen diese Folge auf realen S12-Zuständen.

Miner und Frachter teilen dieselbe Werft. Die bestehende gegenseitige Sperre wird im laufenden echten Auftrag getestet. Terminal gibt es keinen verwaisten Werftauftrag: der Bau scheitert an 5 fehlenden Material, die Raffinerie an 10 fehlenden Nadir-Erz. Ein Kauf scheitert am Lager, nicht am Preis. Eine finanzielle Aufstockung allein löst die Fracht-/Materialklemme nicht. Keine Buchung, Lieferung, Hülle oder Überweisung wird simuliert, um den Negativbefund zu kaschieren.

**[OPTION, nicht implementiert]** Eine industrielle Erzabnahme müsste mindestens reale Förderung, rechtmäßigen Dockkauf, Anlieferung und 10 Erz je zusätzlicher Hülle ermöglichen; die Station braucht 20 ISK Raffinerielohn, Werft 530 ISK, Käufer 930 ISK plus separates Kundenbudget. Früheres Bevorraten benötigt rechtzeitige echte Frachtkapazität. Eine neue lokale Werft oder Übernahme fremder Ware wäre eine neue Regel. Keine dieser Optionen ist als Produktentscheidung oder dauerhafter Kreislauf freigegeben.

## K3c: unabhängige Prüfungen und Kompatibilität

`tests/welt-k3-frachter.test.mjs` prüft Seeds42/7 über echte S12-Minuten, vollständige körperliche Bestände und Hüllenregister, ΣKassen=33.000, Mint/Burn=0, Nullsaldo, Werftminuten und Transferreserven. Save/Load und zwei identische Fortsetzungen mitten in Werftarbeit, Überführung und Folgefracht prüfen Doppelbuchungen. Negative Fälle: 529 statt 530 ISK Werftdeckung (explizite isolierte Negativmutation), fehlendes Material, Doppelbau/Minerkonkurrenz, fremder Eigentümer, falscher Flugzustand, verbrauchte Hülle, beschädigtes Reservekonto. S15 und bestehende K2-QA decken fehlende Rückfracht ab.

Bei Tick20160 unveränderte K2-Hashes: Seed42 `841f4d541a8a464b`, Seed7 `2521d0c8b7794e40`. Der Simulationscode bleibt byteidentisch zur Basis. Die neue Anzeige im separaten Welt-Spieltest liest Material, originale Werftkalkulation, Speditionskasse, Transfer und aktuelle Fracht; sie schreibt keinen zusätzlichen Zustand. Regel14/195 sowie produktive Root-Dateien und Save-Ursprünge bleiben unverändert.

## K3d: tatsächliche Abnahme

**Ausgeführt auf Codecommit `0250c134bc00ace5c29ad5499c86714ce90387fd`:**

- K3: **4/4 Tests**, 0 Fehler, 0 übersprungen; Seeds42/7, minutenweise unabhängige Kassen-/Material-/Hüllenprüfungen, Save/Load in drei aktiven Phasen. Die unveränderten Simulationsergebnisse sind oben festgehalten. JSON-Ausgabe in CI bytegleich reproduziert.
- [K1/K3-CI #43165866836](https://github.com/tobiasfranziskus/Check/actions/runs/43165866836): **completed/success**, einschließlich Gesamtregression und Build-Check; dedizierte K3-Prüfung und **15 wirtschaftlich verschiedene 90-Tage-Szenarien, 5×365, 2×730 Tage erfolgreich**. Chromium **4/4** und WebKit **4/4** Touchgrößen erfolgreich, einschließlich geschützter JSON-/IndexedDB-Wege. Das ist Browserautomatisierung, keine Geräteabnahme.
- `node scripts/build-w5-singlefile.mjs --check`: lokal erfolgreich (`W5_SINGLEFILE_OK`, 325006 Zeichen, 7 Styles, 15 Scripts).
- Node v22.23.4: `node --test tests/*.test.mjs` lokal **328/328 bestanden, 0 Fehler, 0 übersprungen, 0 abgebrochen**, Laufzeit 292,825 Sekunden. Auf dem Abschlusscode ausgeführt, einschließlich aller historischen Regressionen und der folgenden 22 Wirtschaftswelten.

Matrix ohne aufgeweichte Erwartungen: S01/S07/S09/S10/S11/S13/S14 laufen bis Tag90; S02–S06/S08/S12/S15 sind erwartete Negativfälle. In den 365-Tage-Proben läuft nur S01; S02/S05/S09/S12 stehen. Bei 730 Tagen läuft S01, S04 steht. Das unveränderte S12-Ergebnis ist kein W6-Dauernachweis. Die historische Gesamtsuite wird zusätzlich ausgeführt; andere RNG-Seeds werden ausdrücklich nicht als zusätzliche Wirtschaftsregime gezählt.

Lokal wurde Playwright1.62.0 installiert; der Browserdownload scheiterte mit HTTP403 `Domain forbidden` für cdn.playwright.dev. Daher keine behauptete lokale Browserabnahme. Echte iPad-Safari-/NAS-Gerätetests nicht ausgeführt. Kein Merge, Deployment, W6-Nachhaltigkeitsbeweis oder Eingriff in produktive Saves.

### Tatsächlich ausgeführte Wirtschaftsmatrix (Seed42)

| Szenario | Tage | Letzter Wasserabsatz (Tag) | Am Ende aktiv | Hash |
| --- | ---: | ---: | --- | --- |
| S01 | 90 | 90 | ja | `b5c745ed039c67ee` |
| S02 | 90 | 12 | **nein** | `b7c4f1ca56c52931` |
| S03 | 90 | 3 | **nein** | `06ec56c7e25c4370` |
| S04 | 90 | 8 | **nein** | `5f0650e998754319` |
| S05 | 90 | 5 | **nein** | `d49e025f8f42dcd9` |
| S06 | 90 | 3 | **nein** | `131fb9f00dc168b5` |
| S07 | 90 | 90 | ja | `d15bc704c9e4711f` |
| S08 | 90 | 0 | **nein** | `251555c3b414c781` |
| S09 | 90 | 90 | ja | `88048bd46d86b156` |
| S10 | 90 | 90 | ja | `cf65f9fb7b256ab9` |
| S11 | 90 | 90 | ja | `7552ed2151190051` |
| S12 | 90 | 10 | **nein** | `25df7f614b16fda4` |
| S13 | 90 | 90 | ja | `ab932bd828e97a8f` |
| S14 | 90 | 90 | ja | `470986144450fa40` |
| S15 | 90 | 2 | **nein** | `0ddb519f847d06f3` |
| S01 | 365 | 365 | ja | `f4e5edc7157b2e94` |
| S02 | 365 | 12 | **nein** | `2c03d6c7d8fa6e18` |
| S05 | 365 | 5 | **nein** | `5162234cf8c611cc` |
| S09 | 365 | 319 | **nein** | `4339bc9ed48a120a` |
| S12 | 365 | 10 | **nein** | `a5492026bc2f6e70` |
| S01 | 730 | 730 | ja | `b6e57ee624fa43fe` |
| S04 | 730 | 8 | **nein** | `aa5bc05a4ced7fc2` |

Unveränderte Core-Quellen (SHA256): `welt-kern.js` `efd811156fcc89d4ec336b7100b591e98ed47eae791e6ae10b6773cc2d434dac`; `rule191-w5-ferry-core.js` `2ba8bf8dfd49a5652dbbe83b3d5ba9d84a2398b90f67b6e972edca9dfd92eb4a`. Git-Diff zur Basis für beide Quellen und beide Root-Einzeldateien ist leer. Nach dem geprüften Codecommit folgen ausschließlich Dokumentationsänderungen.

**Abschließender GitHub-Status für Codecommit `0250c134`:** K1/K3 [43165866836](https://github.com/tobiasfranziskus/Check/actions/runs/43165866836), W5-RC1 [43165866933](https://github.com/tobiasfranziskus/Check/actions/runs/43165866933) und historische JS-Regression [43165866817](https://github.com/tobiasfranziskus/Check/actions/runs/43165866817) jeweils **completed/success**. Liefer-PR: [Draft #304](https://github.com/tobiasfranziskus/Check/pull/304), Ziel ausschließlich K2-Forschungsbranch.
