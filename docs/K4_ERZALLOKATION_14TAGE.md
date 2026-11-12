# K4 – Vor Export gebundene Erzfrachten: quantitativer 14-Tage-Nachweis

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

## Prüfbelege und Grenzen

- [K4-CI-Vergleichslauf #43175907075](https://github.com/tobiasfranziskus/Check/actions/runs/43175907075), Job `k4-vergleich`: **completed/success**, JSON mit `basis` und `vorExport` für beide Seeds auf GitHub als Artefakt `k4-s12-14tage-seed42-7` gespeichert; vier `K4_RESULT`-Zeilen mit den Zahlen oben.
- Die bereits abgeschlossene ursprüngliche [K4-CI #43173985525](https://github.com/tobiasfranziskus/Check/actions/runs/43173985525) prüfte **330/330 Node22-Tests**, Chromium und WebKit je vier Größen erfolgreich **vor** der Messkorrektur. Auf dem neuen Head ist der komplette Node22-Lauf davon **getrennt** abzunehmen.
- Je nach Seed exakt zwei tatsächlich finanzierte Eingriffe, Geld-/Ware-/Schiff-/Eigentümer-Audits, Save/Load während echter Fracht und zwei deterministische 130-Minuten-Fortsetzungen. Weltgeld bleibt unverändert.
- **Kein W6-Dauernachweis.** Laufzeit exakt 14 Tage, 2 Seeds eines einzigen Wirtschaftsregimes, kein 90-/365-/730-Tage-K4-Krisenvergleich; die übrigen 15 Wirtschaftsregime im K1-Workflow sind **ohne K4-Eingriff** und dürfen nicht als K4-Nachweis gezählt werden. Dass am Tag 14 ein Frachter aktiv ist und ein letzter Wasserabsatz stattfand, erlaubt keine Aussage über Tag 15, 30 oder 90.
- Kein reales iPad Safari und keine reale NAS-Abnahme. Keine Änderungen an `prototypes/welt/welt-kern.js`, Produkt-Root, Regel195, alten Spielständen oder wirtschaftlichem Balancing.

## Bewertung und nächstes Gate

**[ANALYSE / POSITIV, BEGRENZT]** Frühere Allokation echten Erzes durch Original-W3-Aufträge **verbessert** in S12 den Ersatz- und Wasserkreislauf für nachgewiesene 14 Tage, ohne finanzielle Rettung. Der engere K3-Negativbefund zur **dortigen** automatischen Befehlsfolge bleibt gültig; er war kein allgemeiner Unmöglichkeitsbeweis.

**[OPTION / NICHT FREIGEGEBEN]** Einen getrennten 30-/90-Tage-K4-Vergleich durchführen und danach nur bei robustem Nachweis eine NPC-Disposition oder für Spieler bedienbare Vorbestellung als eigenständige, finanzierte Mechanik vorschlagen. Keine stille Änderung des Produkt-Disponenten, der Exportpriorität, von Preisen oder Waren ohne Produktentscheidung.

**Spielbarkeit parallel:** [PR #306](https://github.com/tobiasfranziskus/Check/pull/306) enthält den separaten K1-Miner-Cockpit-Spieltest auf derselben K3-Basis; der K4-Forschungsbefund ist nicht in diese UI oder nach `main` integriert.
