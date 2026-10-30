# [ANALYSE/DRAFT] Liquiditätsdiagnose und R3-Förderziel – Regel 14

**Start: 30. Oktober 2026.** Produktbasis: `main d454d0661dee48a7bfdb843d05096982d799e51f`, v0.12.5, Regel 14, Schema 8. Kein Produkt- oder Regelpatch. Die unveränderte [Roadmap](ROADMAP.md) beschreibt als nächstes verbindliches Ziel den vollständig finanzierten Handels- und Produktionszyklus unter frei sparendem Spieler. Die Ergebnisse aus #32–#34, #41, #44–#46 sind bereits vorhanden und werden hier nicht als neu ausgegebene Erkenntnisse verkauft.

## Frage und Ausgangshypothese

Ein externer Reformvergleich auf Basis einer älteren Regel-13-Datei hat zwei interessante Punkte vorgeschlagen: (1) bei Spieler-Mining und Bargeld-Hortung zeitweise starker Nettoabfluss aus NPC-Kassen; (2) Rohstofflager liegen lange am oberen Kapazitätsrand, und Miner könnten nur bis zum Lagerziel statt bis zur Obergrenze verkaufen (R3). **Das erste Problem ist durch #32/#33 bereits kausal untersucht; der pauschale Spieler-Rückfluss ist bewusst nicht als Produktregel freigegeben.** Die zweite Maßnahme wurde noch nicht auf dem aktuellen B5b-Kern isoliert bewertet.

**Methode:** Zwei getrennt erzeugte, aber am Start vollständig identische Simulationskerne. `control` enthält exakt die aktuelle unveränderte Produktquelle. `r3_target` verändert nur **eine** Zeile in `m_core_foerderung.foerderung`: Der reale Verkauf der vollen Minerladung erfolgt höchstens für die `ziel - bestand` fehlende Menge; bestehender `aufnehmbar()`-Kassen- und Obergrenzenfilter bleibt zusätzlich wirksam. Alle anderen Regeln, einschließlich Förderung und Frachtraummenge, Preise, Handelsgebühren, Kaufentscheidungen, Piraten, Flug-/Betriebskosten, Personal, Fonds, Geldmenge, Save-Schema und `rulesVersion`, bleiben unverändert. Ein Minerschiff, dessen Heimatlager bereits am Ziel liegt, behält seine Ladung und kann dadurch länger stillstehen. Es gibt **keine** neue Geldquelle, Abgabe, Insolvenz- oder Ersatzregel.

## Reproduzierbare Fälle

1. **Reguläre Wirtschaft ohne Spielerbefehl:** 13 bekannte Seeds `[7,11,1,2,65535,42,1234,98765,3,99,2024,2025,314159]`, je 2 Varianten × 90 Tage. Die Kontrollwelt muss je Seed die historisch unveränderten v12/v14-Mangel- und NPC-Frachter-Warenverkaufswerte reproduzieren.
2. **Spieleraktivität:** Seeds 1–4, je 2 Varianten × 90 Tage, zusätzlich getrennt ein real validierter Befehl `shipMine` für den Start-Miner oder `shipMine` plus `shipHandeln` für den Start-Frachter. Tagesstände 1/3/7/30/60/90 getrennt; kein Spieler-Kaufzwang. Das bildet den extern beschriebenen einfachen Testfall nach, ohne seine alte Version/60-Tage-Werte ungeprüft zu übernehmen.
3. **Nach Kollaps / Wiederanlauf:** Die vier realen B1-Spielerfälle Miner/42, Handelsflotte/42, Station/1234, Jagd/98765 mit historischen, **zuerst im Regel-12-Core hash-verifizierten** Tag-90-Spielständen. Danach werden über den bestehenden Regelmigrationspfad 12→13→14 beide Varianten erzeugt. Die ursprünglich validierten Befehle bleiben unverändert; Fortsetzung je 2 Varianten × 275 Tage bis Tag 365.

**Gesamtplan:** 25 Fallpaare = **50 Simulationen, 5.980 Tageshashes, 143.520 stündliche Replay-/Auditzeitpunkte und 616 Save/Load-Roundtrips**. Start und Befehle innerhalb jedes Paares müssen identisch sein. Beobachter erfassen nur tatsächliche Transaktionen aus `m_core_handel.handel` und tatsächlich fällige/bezahlte Schiffskosten in `betriebskosten`. Kein Nachrechnen oder Ersetzen der Wirtschaftslogik. GitHub CI: `.github/workflows/analyse-liquiditaet-r3.yml`; vollständige Rohdaten und aggregierte Tabellen werden als Artefakt nach bestandenem Vergleich abgelegt.

## Neue Messgrößen und Auswertungsgrenzen

- **Kassen:** Spielerkasse, NPC1/2/3, Stationskassen und Fonds getrennt; leere Stationen und Mittelverteilung. Nur real bestehendes Cash, kein gebuchtes fiktives Rettungskapital.
- **Waren:** Rohstoffe, insbesondere Silizium und Bauteile in Aldera, Ledger/Bestände und Anteil von Markt/Rohstoff-Stunden ab 95 % der echten Obergrenze. Dieser **selbst definierte, explizit dokumentierte Stauindikator** muss nicht identisch mit dem des externen Analysedokuments sein.
- **Leistung:** Kumulierte Rezeptproduktion, wirkliche Warenkäufe und Warenverkäufe nach Owner und Schiffsklasse, Begleitgebühren, Transaktionsfolgen gleicher Schiffs-ID. Ein beobachteter Kauf/Verkauf ist **kein** Gewinnbeweis, und Folgekäufe sind nicht automatisch gedeckt; fällige und bezahlte Arbeit wird getrennt gemessen.
- **Krisen:** Gemessene Mangelstunden, tatsächliche Verluste, Geld-/Warenquellen und Senken, Kassen am Tag 365, unbezahlte NPC-Betriebskosten. Keine Verbesserung behaupten, wenn sich nur Lagerpreise, Handelsumsätze oder volle Frachträume verändern.

## Gemessene Resultate und Entscheidung

**[CI AUSGEFÜHRT]** [Erste vollständige Auswertung #41127883338](https://github.com/tobiasfranziskus/Check/actions/runs/41127883338): **28/28 Jobs erfolgreich**, darunter 5/5 neue isolierte Tests und 72/72 Node-Tests einschließlich der bisherigen 67. **25 Fallpaare, 50 vollständige Läufe, 5.980 Tageshashes, 143.520 stündliche unabhängige Replay- und Auditzeitpunkte, 616 Save/Load-Roundtrips**. Kontrollvariante reproduziert in allen 13 Standardseeds exakt die historischen v12/v14-Mangel- und NPC1/2-Frachterverkaufswerte. Der anschließend ergänzte 60-Tage-Auswertungsabschnitt ändert keine Simulatorquelle, löst aber eine neue CI für den aktuellen PR-Head aus; diese muss gesondert bestätigt werden.

| Messung, kumuliert bis Tag 90, sofern nicht anders angegeben | Normalwelt Kontrolle | Normalwelt R3 | Spieler-Miner Kontrolle | Spieler-Miner R3 | Spieler-Miner+Auto-Frachter Kontrolle | Spieler-Miner+Auto-Frachter R3 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Welten | 13 | 13 | 4 | 4 | 4 | 4 |
| Mangelstunden | 791 | **743** | 143.349 | **146.133** | 146.318 | **147.666** |
| Fertige Rezepte | 1.285.074 | **1.293.994** | 29.183 | **22.000** | 21.200 | **18.067** |
| Real bezahlte Warenverkäufe NPC1/2-Frachter | 310.058 | **316.289** | 7.004 | **5.460** | 4.941 | **4.430** |
| Rohstoff-Lager/Stunden-Paare ab 95 % Obergrenze (Mittel) | 60,2 % | **11,2 %** | 41,7 % | **0,6 %** | 39,2 % | **0,5 %** |
| Durchschnittlicher Erz-Preisfaktor Aldera (‰) | 807 | 1.007 | 803 | 1.003 | 802 | 1.002 |
| Median Spielerkasse am Tag 90 (ISK) | 2.000 | 2.000 | 41.404 | **42.172** | 40.057 | **40.355** |

**[BESTÄTIGT]** R3 vermindert Rohstoffstau und hebt lokale Rohstoffpreise in der **ungestörten Normalwelt**, verbessert dort 48 Mangelstunden und 6.231 NPC-Händler-Verkäufe über 13 Seeds. Der Preis-/Lagergewinn ist aber kein unabhängiger Stabilitätsnachweis. Unter den vier aktiven Minerfällen sinkt die tatsächliche Rezeptproduktion um **7.183 / 24,6 %** und die NPC-Händler-Verkaufszahl um **1.544 / 22,0 %**, während die kumulierten Mangelstunden zunehmen. Mit zusätzlichem Spieler-Autofrachter sinkt die Rezeptproduktion um **3.133 / 14,8 %** und die NPC-Verkaufszahl um **511 / 10,3 %**. Das höhere Spielerguthaben und die gestoppte Miner-Abgabe können die fehlende lokale Kaufkraft/Versorgung verschärfen. Ein konkreter Kausalanteil ist daraus allein nicht eindeutig ableitbar; er erfordert bezahlte Ein- und Auszahlungen über die Zeit.

**B1-Krisenfälle:** In vier historischen Spielerfortsetzungen vom Tag 90 bis Tag 365 betragen die kumulierten Mangelstunden **620.550 → 620.518** (Unterschied 32 Stunden über vier Welten und 275 Tage), abgeschlossene Rezepte **24.356 → 24.425**, **NPC1/2-Warenverkäufe durch Frachter bleiben 0 → 0**. NPC3-Frachter verkaufen **80 → 69** mal Ware. In **allen vier** Fällen liegen Silizium und Bauteile in Aldera unter beiden Varianten am Ende weiterhin bei **0 / 0**. Die vom Beobachter erfasste NPC3-Arbeitskostenunterdeckung fällt **433 → 0 ISK**; das beweist ausdrücklich **nicht**, dass der ausgefallene Handel nun finanziert wäre oder die Produktion wieder läuft. Eine geringere Unterdeckung kann lediglich geringere geleistete Arbeit anzeigen.

Die analysierten Rohstoffstau-Anteile sind als **Markt/Rohstoff/Stunden-Paare ab 95 % des jeweiligen realen Obergrenzenbestands** definiert. Claudes Prozentwerte nutzen möglicherweise andere Auswahl, Gewichtung und Laufdauer; sie sind deshalb **nicht als exakt replizierte 77→8 % zu zitieren**. Unsere Spielerbefehle, Simulation bis Tag 90 und aktuelle Regel 14 unterscheiden sich ebenfalls von der alten v13-Quelle.

**Projekturteil [ANALYSE – negativ für R3 als Einzelmaßnahme]:** Die R3-Variante ist ein potenzielles *späteres Preis-/Lager-Balancing*, nicht die gesuchte Reparatur des Zahlungs- und Wiederanlaufkreislaufs. Wegen der messbaren aktiven Spielerregressionen **nicht zur Produktintegration empfehlen**. Die unmittelbar nächste sinnvolle Phase-B-Arbeit bleibt die engere zahlungsseitige Zyklusdiagnose: nach echtem Warenkauf den Waren-/Kassenpfad, bezahlte Crew-/Flugstunden, Käuferliquidität, Folgeinvestition und gesicherte Rohstoff-/Werftversorgung prüfen; keine pauschale Spielerabgabe, keine zusätzliche Geldquelle oder Insolvenzregel aus dieser Analyse ableiten.

### Schutz und Freigabe

**[ANALYSE]** Der beobachtete alte Spieler-Kollaps ist bestätigt, aber keine pauschale Spieler-Abschöpfung zulässig: Die Roadmap erlaubt grundsätzlich unbegrenztes Sparen. Eine endliche NPC-Geldmenge und beliebig fortgesetzter Spieler-Nettoentzug sind ein strukturelles, nicht durch kosmetische Preispuffer lösbares Problem. Selbst ein wirtschaftlich nützlicher R3-Solo-Test wäre **keine** Freigabe der neuen Produktregel. Der nächste Produktschritt bleibt vollständige Zahlungsfähigkeit vom Warenkauf über Transport/Betrieb bis Folgegeschäft.

**Status:** Erste vollständige Wirtschafts-CI erfolgreich; Dokumentation und der weitere 60-Tage-Tabellenabschnitt wurden anschließend ergänzt und werden auf dem aktuellen PR-Head erneut geprüft. `index.html`, Spielstände, Schemata, bestehende Goldendaten und ROADMAP bleiben unverändert. Kein Merge, kein Deployment und keine echte iPad-/NAS-Abnahme.
