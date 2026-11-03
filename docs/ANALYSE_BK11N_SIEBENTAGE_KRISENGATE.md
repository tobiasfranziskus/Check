# B-K11n – 7-Tage-Versorgung und Zahlungsfähigkeit nach Vollkosten-Routenwahl

**[ANALYSE/DRAFT · 03.11.2026]** Gestapelt auf B-K11m #151 → B-K11l #150 usw. **[MAIN]** `b4e604d6`, Regel14/Schema8 unverändert. Historischer isolierter R15-/Schema9-Testkern; ausschließlich Test und Dokumentation, keine produktive Preis-/Lohn-/Geld-/Vertragsregel.

## Frage

B-K11m hat gezeigt, dass das Herausfiltern nominell profitabler, nach Hinflugkosten jedoch negativer Routen nach 48 Stunden **keine Zahlungsfähigkeit der Händler** herstellt und Alderas reale Nahrungskäufe kaum verbessert. Wird die lokale Verbesserung oder Verschlechterung **über eine Woche** in der Gesamtversorgung sichtbar, und können sich NPC1, NPC2 und die Stationswirtschaft ohne individuelle Rettung länger tragen?

## Geplanter Test

Wieder exakt **dieselben** zwei historischen Spielstände nach dritter bezahlter Teilbelieferung bei Tick3960. Fünf zuvor angehaltene echte NPC-Frachter werden in beiden Armen auf `handeln` gestellt; nur die testseitige `bestesPaar`-Wertung unterscheidet sich. **2 Seeds × 2 Varianten × 7 Spieltage**. Jede Stunde unabhängig Waren-, Herkunfts- und Geldbilanz prüfen; täglich Save/Load; deterministische Hashes.

Ergebnisvergleich für **alle sechs Nahrung konsumierenden Stationen**: fehlende Nahrung-/Medizinstunden, tatsächlich bezahlte und verbrauchte neue Nahrung samt ISK, echte Haushaltseinkommen, Stations- und Händlerliquidität, wirkliche Warenverkäufe und NPC-Frachter-Verluste/Ersatz. Kein fiktiver Haushaltkauf und keine aus Mangelstunden rekonstruierte Bezahlung. Original-Kontrollarm bleibt dieselbe echte R15-Logik; Gegenarm zieht nur Hinflugkosten vom Routengewinn ab.

**Teststatus:** CI-Ergebnisse werden noch geprüft. Noch keine Aussagen über bewiesene längerfristige Stabilität. 7 Tage sind ausdrücklich weder 13×90d noch 365 Tage, auch keine unveränderte Naturwelt ab Seed-Start, iPad-/NAS- oder Regel15-/Schema9-Produktfreigabe. Kein Merge.
