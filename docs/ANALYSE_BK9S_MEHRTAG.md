# B-K9s – Mehrtagestest: Absatzblockade, negative Margen und fehlende Liquidität

**[ANALYSE/DRAFT] 02.11.2026** – Ergebnis im gestapelten [PR #111](https://github.com/tobiasfranziskus/Check/pull/111), **nicht integriert**. Verbindlicher [MAIN] `b4e604d6` (v0.12.5, Regel14/Schema8); hier ausschließlich expliziter R15-/Schema9-Versuch mit vorfinanziertem Frachterflug, 1-ISK-Haushaltsstartkonto, lokalem Herkunftsbeleg und als Szenarien **nicht beschlossenen** Fabriklöhnen.

## Testaufbau

- **Isoliert:** Cyris-Fabrik nur `r_nahrung`; Bestand der Nahrung zu Testbeginn 0 und Gesamtwarenledger entsprechend reduziert; NPC-Handelsautopiloten im Test auf „halten“ gestellt; bestehende Miner, übrige Welt, Stationen, Produktionszeiten, Preissystem, Piraten, Stundenabrechnung und Save/Load im Original-Core. Testlöhne 2, 4, 6 ISK pro Produktionsminute, Seeds 42 und 7, je **7 Tage**. Stündlich Geld- und Warenaudit plus Herkunftscheck; täglich Save/Load mit Hash.
- **Aktiv:** Unveränderte NPC-Handelsdisposition und alle originalen Stationen/Rezepte/Lager, Seeds 42 und 7, Testlohn 4 ISK/Minute, je **5 Tage**, gleiche Audits.
- In beiden Varianten Stationsfonds-Auffüllung deaktiviert mittels `mindeststand=0` und einer sehr hohen Fondsobergrenze. **Das deaktiviert nicht den bereits bestehenden Flottenzuschuss in `m_core_schiffbau.ersatzkauf`**; `state.stats.zuschuss` wird deshalb separat beobachtet. Keine neue Emission oder Starterhöhung.
- `tests/bk9s-mehrtag-finanzierung.test.mjs` führt zudem 2×48h reproduzierbaren Replay durch.
- Testsuite: [GitHub Actions #41420818618](https://github.com/tobiasfranziskus/Check/actions/runs/41420818618), Head `59c8ff8`: **Node-22-Job 107/107 bestanden, keine Fehler/TODO**. Historische Wirtschaftsjobs wurden beim Festhalten des Befunds noch ausgeführt; sie verwenden nicht das R15-Haushaltsmodell.

## Kontrollierte Cyris-Kette – Seed 42

| Fabriklohn | Tag 1 bezahlte Nahrung | Stationskasse Tag 1 | Tag 2 bezahlte Nahrung | Stationskasse Tag 2 | Tag 3 | Tag 7 |
|---|---:|---:|---:|---:|---|---|
| 2 ISK/min | 34 Einheiten, 38 Mangel | 938 ISK | 0 Einheiten, 72 Mangel | 938 ISK | 0 Rezepte, volles Nahrungslager (65) | weiterhin 0 bezahlte Einheiten/Tag |
| 4 ISK/min | 72 Einheiten, 0 Mangel | 112 ISK | 26 Einheiten, 46 Mangel | 2 ISK | 0 Rezepte, nicht genug Geld für nächsten 24-ISK-Lohnzyklus | weiterhin 0 bezahlte Einheiten/Tag |
| 6 ISK/min | 72 Einheiten, 0 Mangel | 135 ISK | 46 Einheiten, 26 Mangel | 31 ISK | 0 Rezepte, nicht genug Geld für nächsten 36-ISK-Lohnzyklus | weiterhin 0 bezahlte Einheiten/Tag |

Die Testassertions belegen beide Ursachen unabhängig: **2 ISK/min** hat an Tag3 eine zahlungsfähige Station (938 ISK), aber das Nahrungs-Lager ist mit 65/65 Einheiten voll. **4 bzw. 6 ISK/min** haben an Tag3 die nächste Produktionsreserve nicht mehr; Rohstoffe und teils unverkaufte Fertigware sind vorhanden. Beide Seeds wurden sieben Tage ausgeführt; keine der Varianten beweist einen zweiten stabilen Produktionstag.

### Momentaner Ersatzkostenindikator (Cyris, Tag 3, Seed 42)

- Aktueller Eispreis: **11 ISK pro Einheit**; Rezept benötigt 2 Eis.
- 2 ISK/min: aktueller Nahrungspreis 26 ISK, hypothetische Rezeptkosten 22 + 12 = **34 ISK**, Indikator **−8 ISK**.
- 4 ISK/min: Nahrungspreis 37 ISK, Kosten 22 + 24 = **46 ISK**, Indikator **−9 ISK**.
- 6 ISK/min: Nahrungspreis 48 ISK, Kosten 22 + 36 = **58 ISK**, Indikator **−10 ISK**.

**Keine realisierte Gewinn- und Verlustrechnung:** Momentane Ersatzpreise sind nicht zwingend historische Einkaufs-/Verkaufspreise; Lagerveränderungen, Fees, Transporte, Schiffersatz und übrige Kosten müssen in einem Chargen-/Kassen-Audit getrennt berücksichtigt werden. Die Indikatoren weisen aber in allen drei stillstehenden kontrollierten Welten auf ein negatives strukturelles Preis-/Arbeitsverhältnis.

## Aktiver Originalmarkt – Seed 42 und 7 mit 4 ISK/min

| Seed | Tag | Cyris Stationskasse | Tägliche bezahlte Nahrung | Täglicher Mangel | NPC-Frachter vorhanden | Historische Flottenzuschüsse |
|---|---:|---:|---:|---:|---:|---:|
| 42 | 1 | 150 ISK | 20 (52 Einheiten Altnahrung konsumiert) | 0 | 5 | 0 ISK |
| 42 | 3 | 23 ISK | 19 | 53 | 5 | 0 ISK |
| 42 | 5 | 23 ISK | 0 | 72 | 5 | 0 ISK |
| 7 | 1 | 170 ISK | 20 (52 Einheiten Altnahrung konsumiert) | 0 | 4 | 0 ISK |
| 7 | 2 | 5 ISK | 37 | 35 | 3 | 0 ISK |
| 7 | 3 | 5 ISK | 0 | 72 | 3 | **693 ISK** |
| 7 | 5 | 5 ISK | 0 | 72 | 3 | **693 ISK** |

**Kritisch:** Der bestehende Flottenzuschuss trotz deaktivierter Stationsauffüllung ist nicht mit einem „vollständig ohne Hilfen“ geführten Markt gleichzusetzen. Er ist ein eigener Prüf- und Integrationsblocker. Die Spur enthält keine neuen ISK, sondern Transfers; sie zeigt aber eine gezielte Rettung, die zur beschlossenen Zielregel „keine individuellen Konkursgarantien/Gratisrettungen“ gesondert bereinigt werden muss.

## Ursachen und konkret nächstes Gate

1. **Nicht pauschal Lohn erhöhen.** 2 ISK/min erzeugt unzureichenden Absatz und Lagerblockade; 4/6 ISK/min führt zu raschem Kapitalverlust und verhindert die nächste Vertragsreserve.
2. **Preis- und Chargenaudit:** Für `eis → nahrung` pro echte Charge Rohstoff-Einkaufspreis und -menge, Arbeitslohn, Endkundenpreis, Gebühren, produzierten, verkauften und gehaltenen Bestand sowie Änderungen des Stationskapitals messen. Vorher keine neue Preisformel oder Rezeptänderung freigeben.
3. **Geldbewegungen und Ersatz:** NPC-Minerkosten, Flottenverträge, nicht finanzierte Arbeitsminuten und vorhandene Flottenzuschüsse gemeinsam kontrollieren. Kein Geldmodell-B-Ausgabewert ohne separate Freigabe.
4. **40 wiederholte Perioden** nur nach (2)–(3), mit echtem Rohstoffnachschub, bezahlten Verbrauchern, Frachtern, Ersatz und ohne automatische Stützung. Danach 13×90 Tage, 365 Tage und Krisenfälle.

Keine Änderung der produktiven Roadmap, von `main` oder der ISK-Emissionsregeln in diesem Test.

## B-K9t – Transaktionsspur statt pauschaler Kostenvermutung

**[ANALYSE/TEST]** `tests/bk9t-rohstoffeinkauf-transaktionsspur.test.mjs` zeichnet die **tatsächlich im Original-Core ausgeführten `m_core_handel.handel`-Buchungen** außerhalb des Spielzustands auf; das Test-Hook wird mit unverändertem 60-Tick-Core-Hash und kanonischem Save auf Gleichheit geprüft. 2 Seeds × 3 Tage, sowohl mit regulärem Kristallminer als auch mit **nur diesem einen Kristallminer angehalten**. Geld-/Warenaudit stündlich, Save/Load täglich. **[Node-22-Job: 110/110 bestanden, 0 Fehler](https://github.com/tobiasfranziskus/Check/actions/runs/41421792886)**, getesteter Commit `f0a166e`; andere historische Jobs wurden zu diesem Zeitpunkt noch ausgeführt.

Seed42 und Seed7 liefern in der isolierten Cyris-Kette bei **4 ISK/min Testlohn** am ersten Tag identische Transaktionen:

| Realer Kassenposten | ISK / Einheit |
|---|---:|
| Anfangs-Stationskasse | 4.000 ISK |
| Haushalte bezahlen 72 Einheiten neue Nahrung | +2.454 ISK |
| Miner verkaufen **258 Eis** an die Station | −3.252 ISK |
| **119 echte `r_nahrung`-Rezeptzyklen** à 24 ISK Lohn | −2.856 ISK |
| Miner verkaufen **9 Kristall** an die Station | −234 ISK |
| Übrige Stationskosten (Belegsumme gegen Core-Kostenstatistik) | **0 ISK** |
| **Stationskasse nach 24 h** | **112 ISK** |

**Unabhängige Kassenidentität:** `4.000 + 2.454 − 3.252 − 2.856 − 234 = 112`. Die Testassertions bestätigen für **jeden der drei Tage** `Kasse(Tag) = Kasse(Vortag) + bezahlte Haushaltsnachfrage − sämtliche Core-gebuchten Stationskosten`. Die 47 bei Tag1 verbleibenden Neu-Nahrungseinheiten erklären die Differenz zwischen Produktion und verkauften Einheiten; ein bloßer Vergleich der Chargenkosten mit ausschließlich verkauften Waren wäre methodisch falsch.

**Gegenprobe nur ohne Cyris-Kristallminer:** Tag1 123 Nahrungsrezepte, 2.952 ISK Lohn, 3.318 ISK Eis-Einkauf, 0 ISK Kristall-Einkauf, 2.370 ISK Haushaltszahlungen, **100 ISK Stationskasse**. Tag2 3 ISK, Tag3 0 Produktion. Die Kristallkosten sind damit *nicht* die Hauptursache; bei dieser Gegenprobe steigt die bezahlte Eis-/Fabrikarbeit sogar an und die Station bleibt ebenfalls insolvenzgefährdet.

**Folgerung:** Die echte Kostenursache liegt nachweislich wesentlich in teurem, vom Miner an die Station bezahltem Eis und den vorfinanzierten Fabriklöhnen, während Endkunden lediglich tatsächlich verfügbare Lohn-ISK zum bestehenden Marktpreis ausgeben. Es ist **noch keine vollständige periodengerechte Gewinnrechnung**: Auch mit 47 unverkauften Nahrungseinheiten als Lagerwert kann die Station den nächsten Rohstoffbezug und die nächste Lohnreserve nicht beliebig finanzieren. Eine bloße Erhöhung des Lohns oder der Endverbraucher-Kasse würde das Kosten-/Absatz- und Kapitalbindungsproblem nicht lösen.

**Nächstes kleines Gate:** eine **chargenbezogene Cash-/Vorratsrechnung** mit aktueller tatsächlicher Rohstoffbeschaffung, gebundenem Betriebskapital, realisierbarem Absatzwert und weiteren Schiffskosten, vor jeder freigegebenen Preis-, Rezept- oder Lohnreform. Alte Zuschüsse (`state.stats.zuschuss`) im aktiven NPC-Fall weiter separat prüfen, nicht mit Stationsauffüllung verwechseln.
