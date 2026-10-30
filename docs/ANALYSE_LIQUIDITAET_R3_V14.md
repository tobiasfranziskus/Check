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

### Schutz und Freigabe

**[ANALYSE]** Der beobachtete alte Spieler-Kollaps ist bestätigt, aber keine pauschale Spieler-Abschöpfung zulässig: Die Roadmap erlaubt grundsätzlich unbegrenztes Sparen. Eine endliche NPC-Geldmenge und beliebig fortgesetzter Spieler-Nettoentzug sind ein strukturelles, nicht durch kosmetische Preispuffer lösbares Problem. Selbst ein wirtschaftlich nützlicher R3-Solo-Test wäre **keine** Freigabe der neuen Produktregel. Der nächste Produktschritt bleibt vollständige Zahlungsfähigkeit vom Warenkauf über Transport/Betrieb bis Folgegeschäft.

**Status bei Anlage:** Neue Werkzeuge und Funktionstests erstellt; die vollständigen CI-/Wirtschaftsläufe sind **noch nicht ausgewertet**. `index.html`, Spielstände, Schemata, bestehende Goldendaten und ROADMAP bleiben unverändert. Kein Merge, kein Deployment und keine echte iPad-/NAS-Abnahme.
