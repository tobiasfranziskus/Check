# B-K10f – echte Mengengrenzen und stationäre Käuferfinanzierung

**[ANALYSE/DRAFT · 02.11.2026]** [PR #123](https://github.com/tobiasfranziskus/Check/pull/123) ist auf #122 → #108 gestapelt. **[MAIN]** `b4e604d6` unverändert (v0.12.5 / Regel14 / Schema8). Keine Produktpreis-, Lohn-, Emissions-, Rezept-, Save-, UI- oder Spielerregel geändert. Ausschließlich testseitige Beobachtung des R15-/Schema9-Kandidaten.

## Nachweis und isolierte Bedingungen

[GitHub Actions #41453968996](https://github.com/tobiasfranziskus/Check/actions/runs/41453968996) auf Code-Commit [`f6caf0b6`](https://github.com/tobiasfranziskus/Check/commit/f6caf0b6d0596ff94cfaf30f923e931901fed1b6) **erfolgreich**: **152/152 Node-Tests, 0 Fehler**. Alle ausgeführten historischen v10–v14/Geografie-Jobs erfolgreich; gesonderter Sicherheitsgeografievergleich **planmäßig übersprungen**. Kein Safari-/NAS-Test, keine R15-Langzeitwelt.

Je Seed42 und Seed7 sieben **getrennt neu erzeugte, analytische** Testwelten. Quell- und Ziel-Nahrungsstartbestände werden ausschließlich unter korrekter `ledger.initial`-Gegenbuchung entfernt; diese Testabgrenzung ist keine normale Produktinitialisierung. Reale Cyris-Produktion, wirklicher Markt-Kauf, tatsächlicher `shipMove` mit reservierter und ausgezahlter Hin-/Rückflug-Arbeit, Original-Autoentladung/Teilverkauf, Originalgebühren, 12h bezahlte Haushaltskonsumption; zusätzlich Geld-/Waren-/Herkunftsaudits, Save/Load-Hashes, deterministischer 8er-Replay. Keine zusätzlichen ISK/Waren.

| Startladung | Quelle `ISK/Stk` | Zielverkauf Stk | Handels-ISK Ziel | Quellrückverkauf ISK | Gebühren | Flug bezahlt ISK | Händlerkassenänderung | Ziel: Haushalt bezahlt in 12h | Ziel: belegter Rest |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 46 | 1 | 57 | 0 | 3 | 357 | −349 | 1 | 0 |
| 4 | 44 | 4 | 228 | 0 | 16 | 357 | −321 | 4 | 0 |
| 8 | 42 | 8 | 456 | 0 | 31 | 357 | −268 | 5 | 3 |
| 16 | 38 | 16 | 912 | 0 | 60 | 357 | −113 | 6 | 10 |
| 24 | 34 | 24 | 1.368 | 0 | 86 | 357 | **+109** | 7 | 17 |
| 32 | 30 | 28 | 1.596 | 160 | 107 | 357 | **+332** | 7 | 21 |
| 35 | 28 | 28 | 1.596 | 266 | 112 | 357 | **+413** | 7 | 21 |

Die tabellierten, aus Original-Core-Zahlungen abgeleiteten Werte sind für beide Seeds gleich. Händler-ISK bei 32/35 umfassen **echte Rückverkäufe an die Quellstation**, nicht ausschließlich Absatz am Nachfragemarkt; die bloße Zielverkaufsdeckung ohne diese Rückverkäufe beträgt **+172/+147 ISK**. 32er/35er-Einheiten sind am Ziel nur 28-mal verkäuflich, die übrigen 4/7 werden auf dem Hin-/Rückweg nicht konsumiert, sondern an Cyris verkauft. Es ist kein sicher dauerhaft reproduzierbarer Warenkreislauf.

**Beispiel 24er:** Bei 34 ISK Quellpreis = 816 ISK realer Einkauf, 1.368 ISK realer Stationsverkauf, 86 ISK Gebühren, 357 ISK tatsächlich gezahlter Hin-/Rückflug; Händler netto **+109 ISK** (ohne Hüllenverschleiß, Schiffsersatz/Risiko). Die Zielstation Orion besitzt unmittelbar danach nur noch **262 ISK**. In folgenden 12h kaufen Haushalte **7** Einheiten für insgesamt **270 ISK**, **17** Neu-Einheiten liegen weiter auf Station. **Stationsverkauf und Haushaltsendverbrauch sind nicht identisch**. Vorausbezahlte Stationseinkäufe können durch vorhandene Startkasse finanziert werden, ohne dass ihre Wiederholbarkeit erwiesen ist. Haushalt/Lohn, lokale Lager- und Kassenentwicklungen nach Verbrauch sind gesondert zu beurteilen.

## Wirtschaftliche Diagnose und Grenzen

- **Positiv, aber eng:** Der Originalkern erlaubt eine bargeldgedeckte profitable **einzelne** vollständige Handels-Hin-/Rückrunde ab 24 Stück in diesem besonderen Marktzustand. Die zuvor genannte lineare 36-Stück-Schwelle gilt nur bei starrer Spanne 10 ISK/Stück und ignoriert das tatsächliche Preismodell; `quellPreis` fällt bei wachsendem Vorrat (46 bis 28), Marktankauf und Gebühren bleiben jedoch endlich.
- **Wiederholbarkeit offen:** Die 24er-Zielstation bezahlt 1.368 ISK sofort, Haushalte nur 270 ISK in 12h. Eine einmalige Händlerrendite kann zulasten des Ziel-Betriebskapitals entstehen. Nächste echte Lieferung und Rückweg ohne Zuschuss, Händler-/Stationscash, Haushaltslohn und unverkaufter Warenbestand müssen im **gleichen** State gemessen werden, ohne Welt-Reset.
- **Vollkosten noch unvollständig:** Händlerwerte enthalten zwar Warenkauf, Handelsgebühren und vollständig bezahlte Flüge, **aber nicht** gesamte Eisförderung, Fabriklohn, Stations- und Hüllenkapitalkosten, Hüllenverluste/-ersatz oder einen globalen ökonomischen Mehrwert. Die Eis→Fabrik→Lohn-Belege aus B-K9u sind nicht mit einzelnen Frachterlosen verkettet. Keine Gewinnbehauptung für den Konzern bzw. die Gesamtwirtschaft.
- **Langzeit:** Weder 13 Seeds×14/90 Tage unter autonomer Konkurrenz noch NPC-Schiffsersatz, Jägerunterdeckung und eine dauerhaft bezahlte Endnachfrage sind geprüft. Zwei Seeds liefern keinen allgemeinen Stabilitätsnachweis.

**[OPTION B-K10g]** Ohne Produktmechanikänderung in denselben zwei isolierten Seeds das **zweite** 24er-Handelsgeschäft aus **demselben** Spielstand auf echter Kauf-, Frachterflug-, Rückflug-, stations- und haushaltsseitiger Liquidität versuchen: Verkaufslimit, Zielpreis/Restbestand, freie und gebundene ISK, erzeugte/verbrauchte Nahrung, vollständige Zahlungen und nachweislicher Blocker. Danach erst autonome Weltanalyse. Keine ISK-Emission, Preis-/Lohnänderung oder Merge-/Deployment-Freigabe.
