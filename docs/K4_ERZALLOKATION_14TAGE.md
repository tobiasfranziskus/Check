# K4 – Vor Export gebundene Erzfrachten: quantitativer 14-/30-/90-Tage-Nachweis

**[DRAFT / ANALYSE · 12.11.2026]** Forschungsbranch `research/k4-ore-allocation-20261112`, [PR #308](https://github.com/tobiasfranziskus/Check/pull/308) auf K3 [#304](https://github.com/tobiasfranziskus/Check/pull/304). **Keine Produktregel, kein Merge, kein Deployment.** Originalsimulation, Startgeld, Preise, Waren und Eigentümer unverändert.

## Frage und Eingriff

Kann in Aldera bereits **rechtmäßig gefördertes** Erz unmittelbar vor dem stündlichen Außenexport mit gültigen, vollständig gedeckten Original-`shipFreight`-Aufträgen nach Nadir geliefert werden, statt ungenutzt für die Ersatzwirtschaft exportiert zu werden?

Unveränderte S12-Automatik gegen **höchstens zwei** vorgezogene W3-Aufträge mit identischen 33.000 Welt-ISK, Seeds 42/7, 14 Tage. Jeder Auftrag nutzt `pilotW3Kalkulation`, den Originalbefehl `shipFreight`, die originalen Kauf-/Flugkosten, echte vorhandene Hülle und Warenbestände. **Keine** Geldschöpfung, keine Preisänderung, keine zusätzliche Hülle, Ware, Beihilfe oder Teleportation.

Die Testintervention nutzt die vorhandene W3-API bei Tick 599 und 839:
- Tick 599: 68 Erz am Aldera-Dock, Nadir vor Auftrag 3.040 ISK, Spedition 1.786 ISK.
- Tick 839: 50 Erz am Aldera-Dock, Nadir vor Auftrag 2.326 ISK, Spedition 2.063 ISK.
- Beide: 500 ISK Erzpreis, 120 ISK Frachtarbeit, 240 ISK Frachtgebühr nach Originalkalkulation. Käuferetat und Arbeitsreserve werden ausschließlich gemäß Original-Core gebunden/abgerechnet.

**Wichtig:** Zwei zusätzlich ausgelöste Aufträge bedeuten **netto nur einen zusätzlichen abgeschlossenen Erz-Rundtransport** gegenüber S12, da sich die automatische Folge anders entwickelt: insgesamt 3 statt 2 abgeschlossene W3-Frachten. Keine zusätzliche Frachtsendung als reine Zählbehauptung.

## Tatsächlich ausgeführtes Ergebnis: Tick 20160 / Tag 14

| Kennzahl | S12 ohne Eingriff (Seed42 und 7) | Vor-Export-K4 (Seed42 und 7) | Differenz |
| --- | ---: | ---: | ---: |
| Gefördertes Erz | 2.100 | 2.150 | +50 |
| Erz exportiert | 1.993 | 2.000 | +7 |
| W3-Erz nach Nadir geliefert | 100 | 150 | +50 |
| Abgeschlossene W3-Erzfrachten | 2 | 3 | +1 |
| Material aus W4 | 50 | 75 | +25 |
| Frachter gebaut | 4 | 8 | +4 |
| Frachter verkauft | 4 | 7 | +3 |
| Miner gebaut/geliefert | 6 | 7 | +1 |
| Wasser produziert | 5.150 | 8.000 | +2.850 |
| Wasser an Nadir verkauft | 1.996 | 2.928 | +932 |
| Wasser an Aldera verkauft | 3.154 | 4.994 | +1.840 |
| Wasser insgesamt verkauft | 5.150 | 7.922 | +2.772 |
| Letzter Wasserverkauf (Tick) | 13.045 | 20.157 | +7.112 Minuten |
| Aktive Frachter am Ende | 0 | 1 | +1 |
| Weltgeld | 33.000 | 33.000 | 0 |
| Mint/Burn | 0/0 | 0/0 | 0 |
| Original-Audit / Kassen-Nullsaldo | ok / 0 | ok / 0 | unverändert |

**K4 verkauft sieben von acht neu gebauten Frachtern; eine neu gebaute Hülle bleibt im Bestand.** Einschließlich Gründungsfrachter existieren am Ende acht Speditionsfrachter, davon genau einer noch nicht stillgelegt. Die 75 physisch erzeugten Materialeinheiten verteilen sich auf 8 Frachter × 5 und 7 Miner × 5. Die noch unverkauften 78 Wasser sind vorhandene Ware, kein zusätzlicher kostenloser Absatz.

### Deterministische Endhashes

| Seed | S12 (unveränderte K3-Referenz) | Vor-Export-K4 |
| --- | --- | --- |
| 42 | `841f4d541a8a464b` | `52b6fca43d1018a2` |
| 7 | `2521d0c8b7794e40` | `8f34e59d66f6d471` |

**Die S12-Historienhashes sind bytegleich** mit den in K3 dokumentierten 14-Tage-Hashes. Die K4-Diagnose führt den Zeitpunkt des letzten Wasserabsatzes nach einer Messkorrektur außerhalb des autoritativen Weltzustands. Zuvor irreführend als `Vorher` bezeichnete Auftragskassen und Quelllager werden nun wirklich **vor** Original-`shipFreight` erfasst.

## Langzeitkontrolle: 30 und 90 Tage (Seed 42 und 7)

Zusätzlicher, **tatsächlich ausgeführter** K4-CI-Gegenversuch [#43177016371](https://github.com/tobiasfranziskus/Check/actions/runs/43177016371), separater Job `k4-vergleich`. Vier längere Dateien: S12-Basis und Vor-Export-Intervention je Seed 42/7 für **30 bzw. 90 Tage**. Die K4-Intervention startet weiterhin exakt zwei gültige Original-W3-Aufträge; keine zusätzliche Regel oder weitere Eingriffe nach Tick 839. Das hier ist **ein Wirtschaftsregime und zwei Seeds**, nicht 13 unterschiedliche K4-Krisenszenarien.

| Wert am Ende | S12-Basis, Tag 30/90 | K4, Tag 30/90 |
| --- | ---: | ---: |
| Erz gefördert | 2.100 | 2.150 |
| Erz exportiert | 1.993 | 2.000 |
| Erz nach Nadir geliefert | 100 | 150 |
| Verarbeitetes Erz (aus Material abgeleitet) | 100 | 150 |
| Material erzeugt / verfügbar | 50 / 0 | 75 / 0 |
| Frachter gebaut / verkauft | 4 / 4 | **8 / 8** |
| Miner gebaut / geliefert | 6 / 6 | 7 / 7 |
| Wasser erzeugt / verkauft | 5.150 / 5.150 | **8.400 / 8.400** |
| Letzter Wasserverkauf (Tick) | 13.045 (Tag 10) | **21.611 (Tag 16)** |
| Frachter insgesamt / noch nicht stillgelegt | 5 / 0 | **9 / 1** |
| Geldmenge / Mint / Burn | 33.000 / 0 / 0 | 33.000 / 0 / 0 |
| Audit / Transfer-Nullsaldo | bestanden / 0 | bestanden / 0 |

**[ANALYSE / NEGATIVE LANGZEITGRENZE]** Gegenüber K3 bewirkt K4 **+3.250** tatsächliche Wasserverkäufe und beinahe sechs weitere Tage mit Absatz, **aber keinen weiteren Absatz von Tick 21.612 bis Tick 129.600**. Das 30-Tage-Ergebnis bleibt am 90. Tag unverändert. Ein existierender, nicht stillgelegter Frachter ist kein Nachweis weiterer tatsächlicher Versorgung: Im beobachteten Lauf bleiben nach Verarbeitung **0 Erz und 0 Material** verfügbar; das Produkt kann aus diesem Versuch nicht als nachhaltige W6-Ökonomie freigegeben werden.

K4 verarbeitet 150 statt 100 Erz zu 75 statt 50 Material; 75 Material gehen vollständig in 8 Frachter und 7 Miner zu je 5 Einheiten. Die Erzrechnung ist `2.150 Förderung = 2.000 Export + 150 Verarbeitung`, ohne freien Rest. Für S12 gilt zusätzlich das bekannte 7-Erz-Restlager auf einer stillgelegten Hülle. Der strengere auditierte Mengenbericht ist in den JSON-Dateien archiviert; der Nullrest der K4-Industrielager bleibt entscheidend.

**Deterministische Hashes, jeweils Tag 30 / Tag 90:**

| Seed | S12 Tag30 / Tag90 | K4 Tag30 / Tag90 |
| --- | --- | --- |
| 42 | `41770a775581f982` / `25df7f614b16fda4` | `134a00c2125b22f5` / `c23397a320fa63ff` |
| 7 | `9891fcc3e15bdf83` / `f50f8a82ac620947` | `a0e35cbd84a25152` / `4a818a41b592f887` |

Im K4-CI-Job wurden alle acht Langzeit-Kennzahlenzeilen (`K4_LANG`) aus echten Simulationsläufen ausgegeben, jeweils mit `audit=true`, `weltgeld=33000`, `minted=0`, `burned=0`; vollständiges Archiv `k4-s12-lang-30-90-seed42-7`. Der **gesonderte Gesamtlauf** ist unabhängig vom erfolgreichen K4-Vergleichsjob zu beurteilen.

## Prüfbelege und Grenzen

- [K4-CI-Vergleichslauf #43175907075](https://github.com/tobiasfranziskus/Check/actions/runs/43175907075), Job `k4-vergleich`: **completed/success**, JSON mit `basis` und `vorExport` für beide Seeds auf GitHub als Artefakt `k4-s12-14tage-seed42-7` gespeichert; vier `K4_RESULT`-Zeilen mit den Zahlen oben.
- **Aktueller Abschlusscode `1db70aba4e766fecb709a220eba01748170784d5`**: [K4-CI #43175907075](https://github.com/tobiasfranziskus/Check/actions/runs/43175907075) **completed/success** mit **330/330 Node22-Gesamttests**, 0 Fehler/Skips/Abbrüche, gezielt K4 **2/2**, allen K1/K2/K3- sowie historischen Regressionen, 15×90/5×365/2×730-Tage-K1-Läufen und `W5_SINGLEFILE_OK`. Chromium **4/4** und WebKit **4/4** Größen erfolgreich. Die zeitgleich gestartete [W5-RC1 #43175907104](https://github.com/tobiasfranziskus/Check/actions/runs/43175907104) und [JavaScript-CI #43175906990](https://github.com/tobiasfranziskus/Check/actions/runs/43175906990) sind ebenfalls **completed/success**. Die K1-Langläufe enthielten **keinen** K4-Auftrag.
- Der frühere K4-Codehead `87c2e88c` hatte schon [CI #43173985525](https://github.com/tobiasfranziskus/Check/actions/runs/43173985525) mit **330/330 Node22-Tests** und Chromium/WebKit 4/4 erfolgreich bestanden; für die reine Diagnose-Messkorrektur ist nun der neuere Abschlusslauf maßgeblich.
- Je nach Seed exakt zwei tatsächlich finanzierte Eingriffe, Geld-/Ware-/Schiff-/Eigentümer-Audits, Save/Load während echter Fracht und zwei deterministische 130-Minuten-Fortsetzungen. Weltgeld bleibt unverändert.
- **Kein W6-Dauernachweis.** Nach dem positiven 14-Tage-Test zeigen jetzt **30-/90-Tage-K4-Prüfungen denselben wirtschaftlichen Stillstand ab Tag 16** trotz eines noch nicht stillgelegten Frachters. Keine K4-Krisenvariationen über mehrere Wirtschaftsregime, kein 365-/730-Tage-K4-Nachweis. Die übrigen 15 unterschiedlichen K1-Regime im CI-Workflow enthalten **keinen** K4-Eingriff und dürfen nicht als K4-Robustheitsbeleg gezählt werden.
- Kein reales iPad Safari und keine reale NAS-Abnahme. Keine Änderungen an `prototypes/welt/welt-kern.js`, Produkt-Root, Regel195, alten Spielständen oder wirtschaftlichem Balancing.

## Bewertung und nächstes Gate

**[ANALYSE / POSITIV BIS TAG 16, DANACH NEGATIV]** Frühere Allokation echten Erzes durch Original-W3-Aufträge **verbessert** in S12 den Ersatz- und Wasserkreislauf messbar ohne finanzielle Rettung. **Ab Tick 21.612 bis Tag 90** ist kein weiterer Wasserabsatz nachgewiesen. Der engere K3-Negativbefund zur **dortigen** automatischen Befehlsfolge bleibt gültig; er war kein allgemeiner Unmöglichkeitsbeweis.

**[OPTION / NICHT FREIGEGEBEN]** Als nächstes die reale Herkunft des Stillstands ab Tag 16 eingrenzen (erreichbare Erz-/Eislieferungen, Käuferkapital, Frachterstatus, Bergbau-/Werftkapazität). Vor einer neuen NPC-Disposition oder für Spieler bedienbaren Vorbestellung erst klar nachweisen, welche Originalaufträge wirtschaftlich sinnvoll und finanzierbar wären. Keine stille Änderung des Produkt-Disponenten, der Exportpriorität, von Preisen oder Waren ohne Produktentscheidung.

**Spielbarkeit parallel:** [PR #306](https://github.com/tobiasfranziskus/Check/pull/306) enthält den separaten K1-Miner-Cockpit-Spieltest auf derselben K3-Basis; der K4-Forschungsbefund ist nicht in diese UI oder nach `main` integriert.
