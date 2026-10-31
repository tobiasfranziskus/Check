# B7f – Echter NPC3-Konzernhandel (Seed 42)

31.10.2026 · [ANALYSE/DRAFT], PR #60. **Keine neue produktive Wirtschaftsregel.** Roadmap auf main bleibt einzig verbindlich. Das Flottenkonzept aus Draft #55 sieht Konzernbesitz statt privatem NPC-Pilotenschiff vor.

## [TEST] Tatsächlicher Lauf

[CI #41198367708](https://github.com/tobiasfranziskus/Check/actions/runs/41198367708): **1/1 Job erfolgreich, 67/67 Standardtests**. Fünf 10-/90-Tage-Welten (alte Regel14-Kontrolle und B7b-Schiffskonten je 10/90 Tage, zusätzliche B7f-Schiffskontenwelt über 90 Tage), **6.960 unabhängige Stunden-Geld-/Warenaudits und parallele Replay-Hashes**, **290 Tageshashes**, **58 Save/Load-Roundtrips**. Bis einschließlich Tag15 ist der B7f-Weltzustand exakt identisch zum B7b-Fall; B7b-Referenzhash am Tag90 **82f11deee8c7f566**, B7f-Tag90 **23eb3796fb0b5ec3**. Weltgeldmenge bleibt 50.000 ISK. Keine Änderung an index.html, Regel14/Schema8, Save-Format oder Produktions-PR.

### Echte Schritte des einen Kauf-/Frachtauftrags

Am Ende Tag15 hat NPC3 als *Bergbaukonzern* 4.353 ISK frei und neun Miner. Die Analyse ergänzt einmalig einen Frachter-Sollplatz für diesen **Konzern**, nicht für einen privaten NPC-Piloten. Danach nutzt sie unveränderte reale Kernpfade für Werftkauf, Eigentumsübernahme, Reise, validierten Handel und Ankunft/Entladen:

| Tick | Tatsächlich gebuchter Vorgang |
|---|---|
| **21.660** | Werft verkauft einen realen Frachter sh131 für **750 + 30 ISK** an NPC3. NPC3-Kasse **4.353→3.573**, Aldera-Stationskasse **1.603→2.383 ISK** nach vollständigem Stundenabschluss. Schiff reist automatisch leer Aldera→Dravos. |
| **21.681** | In Dravos wird mit validiertem NPC3-Handelsbefehl **55 Silizium** zu **17 ISK/Stück** plus **37 ISK** Kaufgebühr bezahlt: **935 + 37 = 972 ISK**. NPC3 **3.573→2.601 ISK**, Dravos Siliziumbestand **65→10**. |
| **21.682–21.702** | Echter validierter Flug Dravos→Aldera, dort automatisch Verkauf **55 × 43 = 2.365 ISK** abzüglich **94 ISK** Verkaufsgebühr, also **2.271 ISK Nettoerlös**. NPC3 unmittelbar nach dem Handel **2.601→4.872 ISK**, Aldera-Kasse **2.383→18 ISK**. |

Die zuvor nur hypothetische B7e-Menge **54** wurde tatsächlich **55**, weil der echte stündliche Core-Ablauf nach der realen Schiffsgebühr eine zusätzliche **Fonds→Station-Transferbuchung** auslöste: Die Station erhielt bis zur erneuten Marktentscheidung effektiv **780 statt nur 750 ISK**. Dies ist **kein neu erzeugtes Geld und keine kostenlose Förderung**. Die unmittelbar nach Verkauf beobachtete NPC3-Kasse ist **keine volle spätere Gewinne-/Kostenabrechnung**, denn die Stunden-Arbeitskosten werden später fällig und das Miner-/Schiffsersatzgeschehen läuft weiter. Die Analyse hat exakt **einmal** einen neuen Frachter finanziert; kein automatischer weiterer Kauf und noch **kein** selbständiger Pachtpilot.

## 90-Tage-Vergleich B7b gegen B7f

| Größe | B7b ohne Einstieg | B7f mit NPC3-Lieferung |
|---|---:|---:|
| Produktion kumuliert | 6.934 | **7.022 (+88)** |
| Zivil verbrauchte Nahrung | 3.744 | **3.744 (unverändert)** |
| Zivil verbrauchte Medikamente | 675 | **675 (unverändert)** |
| Zivil verbrauchte Bauteile | 1.481 | **1.504 (+23)** |
| Mangelstunden | 36.095 | 36.085 (−10) |
| NPC1/NPC2-Handelsverkäufe | 1.473 | **1.473 (unverändert)** |
| NPC3-Kasse Tag90 | 4.353 ISK | **2.250 ISK** |
| NPC3-Miner/Frachter Tag90 | 9 / 0 | **9 / 1** |
| NPC3-Minerverluste im bisherigen Gesamtverlauf | 27 | **31 (+4)** |
| NPC3-Ersatzaktivierungen | 25 | **30 (+5)** |
| Fällige und bezahlte Betriebskosten gesamt | 242.875 ISK | **244.463 ISK**, alle bezahlt |
| Gesamtgeld der Welt | 50.000 ISK | **50.000 ISK** |

**[BESTÄTIGT]** NPC3 kann als solventer **Konzerninvestor** tatsächlich mit eigenem Geld einen zuvor ausgefallenen Handelszweig übernehmen. Die Siliziumlieferung löst eine kurze Produktionserholung aus: 88 zusätzliche Abschlüsse, davon tatsächlich 23 weitere zivile Bauteilverbräuche. Keine Rettung von NPC1/NPC2, kein persönlicher NPC-Schiffskauf, keine neue ISK-Emissionsregel.

**[WIRTSCHAFTLICH NEGATIV]** Kein einziger weiterer Tag mit realem Nahrungs-/Medikamentenverbrauch und keine Fortsetzung des Handelszyklus; bereits unmittelbar nach dem Verkauf hat der Käufer Aldera **nur 18 ISK**. Am Ende Tag90 erneut **null Silizium und Bauteile** in Aldera. Das bargeldseitige NPC3-Ergebnis sinkt langfristig auf 2.250 ISK; daraus folgt **keine automatische Selbstfinanzierbarkeit der späteren Flottenexpansion**. Ein einmaliger, manuell festgelegter Testauftrag beweist ausdrücklich **keine autonome NPC-Markteintritts-KI** und keine dauerhafte Nachfrage. Auch die Schiffs-/Risiko-RNG-Pfade ändern sich (vier zusätzliche NPC3-Minerverluste, fünf mehr Ersatzaktivierungen), was bei der Bewertung zusammengehört.

## Nächstes kleines, unverändertes Wirtschaftsgate

**[ANALYSE/OPTION]** Vor weiterer Pacht-/Pilotenkonten- oder Flotten-Automatik zunächst **read-only** bestimmen, welche vorhandenen, wirklich bezahlten Kaufkraftzuflüsse Aldera für eine *zweite* Siliziumlieferung tatsächlich wieder aktivieren könnten. Danach genau einen wiederholbaren Auftrag mit voller Finanzierung, Stationskäufercash, Betriebskosten, Warenaudit und NPC3-Minerreserve erproben. Wenn Endverbrauch weiterhin ohne verlässliche real finanzierte Nachfrage physisch versiegt, Modell-B-Geldregime separat entscheiden; kein individuelles Insolvenzbailout, keine zwangsweise Besteuerung des Spielers. Größere 13-Seed/90-Tage-Tests nur bei positivem Einzelgate.

**Status:** PR #60 bleibt offen/[DRAFT], kein Merge, kein Produktcode, kein Safari-/NAS-Deployment.
