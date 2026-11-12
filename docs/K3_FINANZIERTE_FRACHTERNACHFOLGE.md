# K3 – Frachternachfolge und S12-Materialgrenze

**[DRAFT / ANALYSE, 12.11.2026]** Auftrag [#303](https://github.com/tobiasfranziskus/Check/issues/303), gestapelt auf [#301](https://github.com/tobiasfranziskus/Check/pull/301), Basis `d7fe397401cfb8513bd1a7a79dba05483b8a9c71`. Beim Start separat verifiziert: main `04124f2bca27dc33b54be30c07b6a7bbb7387e81`, #300/#301 offen und Draft. Auf der K2-Basis sind K1-CI [43163850385](https://github.com/tobiasfranziskus/Check/actions/runs/43163850385), RC1 [43163850351](https://github.com/tobiasfranziskus/Check/actions/runs/43163850351) und JS [43163850484](https://github.com/tobiasfranziskus/Check/actions/runs/43163850484) completed/success. Das sind Basisprüfungen, keine K3-Abnahme.

## Ergebnis und Abbruchregel

**Der bestehende S12-Lauf enthält bereits vier vollständig bezahlte Frachternachfolgen mit anschließender echter Eisfracht und Wasserproduktion.** Ein fehlender implementierter Kauf-/Transferpfad ist nicht die terminale Ursache. Nach Verbrauch der letzten Hülle fehlt physisches Industriematerial. K3 verwendet deshalb die ausdrückliche Abbruchregel des Issues: reproduzierbarer Negativbeweis und atomare Ablehnungen, keine neue Rettungsregel. Die Wirtschaft bleibt negativ. Es gibt keine Änderung am Disponenten, an Preisen, Rezepten, Tickfolge, Rule-/Schema-Nummern oder Speichern.

Der Beweis gilt für **S12 mit unveränderten Regeln und seiner Befehlsfolge ab dem belegten Engpass**. Er beweist nicht, dass jede denkbare frühere Beschaffungsstrategie unmöglich wäre. Eine frühere andere Verteilung des begrenzten Erzes wäre ein gesondertes Experiment. „Nachfolge grundsätzlich unmöglich“ oder „fehlendes Speditionskapital“ wären falsche Schlussfolgerungen.

## K3a: minutengenaue Diagnose

Reproduktion: `node tools/k3-frachter-diagnose.mjs 42`. Vollständige maschinenlesbare Ausgabe: [K3_DIAGNOSE_SEED42.json](K3_DIAGNOSE_SEED42.json). Keine Log-String-Schätzung: jeder Simulationsminute folgen unabhängige Geld-, Waren-, Hüllen-, Werftarbeits- und Transferreservegleichungen. Die Ausgabe enthält je Bau/Kauf/Überführung/Stilllegung sämtliche Eigentümerkassen, Rücklagen (als Teil der Kasse), offene Verträge, Lager, Fracht und Hash.

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

Abgeschlossene Testzahlen und CI-Links werden nach den Läufen ergänzt. Vorgeschrieben sind Node22-Gesamtsuite, Build-Check und vorhandene 15×90-/5×365-/2×730-Tage-Matrix. Negative Erwartungen bleiben erhalten. Der K1-Workflow prüft zusätzlich den K3-Test und reproduziert die JSON-Ausgabe bytegleich; Chromium und WebKit prüfen je vier Touchgrößen einschließlich JSON/IndexedDB-Wege.

Lokal wurde Playwright1.62.0 installiert; der Browserdownload scheiterte mit HTTP403 `Domain forbidden` für cdn.playwright.dev. Daher keine behauptete lokale Browserabnahme. Echte iPad-Safari-/NAS-Gerätetests nicht ausgeführt. Kein Merge, Deployment, W6-Nachhaltigkeitsbeweis oder Eingriff in produktive Saves.
