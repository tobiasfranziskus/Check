# B-K9x – Flugkosten in der Handelsentscheidung und Leerflug-Gegenprobe

**[ANALYSE/DRAFT · 02.11.2026]** Draft [#115](https://github.com/tobiasfranziskus/Check/pull/115), auf #114 → #113 → #112 → #111 → #110 → #109 → #108. [MAIN] weiterhin `b4e604d6`, Produkt v0.12.5 / Regel14 / Schema8. **Keinerlei** Änderung an Produkt-`index.html`, Runtime, Preisen, Löhnen, Rezepten, Geldschöpfung, Save/Load oder bestehender Flottenrettung.

## Prüffrage

Das bisherige `m_core_entscheidung.bestesPaar` bewertet einen handelbaren Warenpreisunterschied **abzüglich beider Handelsgebühren**, aber **vor** tatsächlichen Flugkosten. `m_core_entscheidung.entscheidung` erlaubt nach wiederholter erfolgloser Warenwahl ausdrücklich zufällige Leerpositionierungen. B-K9w hatte für wirklich gekaufte, transportierte und verkaufte Nahrung bereits Verluste **nach** Flugkosten von −128/−703 ISK in Seed42/7 belegt.

B-K9x vergleicht vier **ausschließlich im Test in separaten Core-Kopien** ausgeführte Varianten, alle mit derselben Startwelt, vollem NPC-Autohandel, Piraten/Kampf, originalem Waren-/Haushaltskreislauf und echten Verträgen:

1. **Original:** bestehender Preis-Spread mit Gebühren, keine Flugkosten in der Wahl.
2. **Hin:** Kandidatenhandel nur bei positiver Spanne **nach** kalkulierter Hinfahrt und nach Abzug einer konservativen Hinfahrt-Kaufkassenreserve.
3. **Hin/Rück:** zusätzlich gleich teure hypothetische Rückfahrt, damit positive Spanne und verbleibende Kaufkasse **nach beiden Fahrtkosten** erforderlich sind.
4. **Hin/Rück ohne zufällige Leerpositionierung:** identische Bewertung wie 3, aber die bestehende zufällige Umpositionierung ohne Ladung nach zweimal erfolgloser Kandidatensuche wird **nur im Test** unterdrückt. Liegt bereits Ladung vor, bleibt die Suche nach einem bezahlbaren Absatzsystem bestehen.

**Grenzen:** Die Hinfahrt wird erst beim echten Abflug original-konform reserviert, die konservativ kalkulierte Rückfahrt **nicht** real gebunden und kann auch anders verlaufen; dies ist kein vollfinanzierter Hin-/Rückflugvertrag. Schiffskapital, Ersatzrisiko, Lagerbindung, weitere Linien, laufende Verteilung und echte Endverbraucherstabilität werden nicht als automatisch gelöst unterstellt. Allgemeine Fonds-Mindeststandauffüllung wurde wie B-K9v/w analytisch mit `mindeststand=0` und hoher Fondsobergrenze ausgeschaltet; vorhandene Werftfonds-Zuschüsse bleiben aktiv und werden gemessen. Testlohn 4 ISK/min im Regel15-/Schema9-Kandidaten ist keine neue Produktentscheidung.

## Real ausgeführte Ergebnisse, Seed42/7, sechs Spieltage

Alle Werte kumulativ bis Tag6 außer verfügbare Kassen und Anzahl physischer Schiffe. `Netto-Waren-Cashflow nach Flug` ist **kein buchhalterischer Gewinn** (er enthält auch bezahlte, noch nicht abverkaufte Vorräte und ggf. Hüllenkäufe; offene Inventarwerte und sonstige Betriebskosten fehlen).

| Wert | Seed42: Original | Hin | Hin/Rück | Hin/Rück ohne Leer |
|---|---:|---:|---:|---:|
| NPC1+NPC2 freie Kasse (ISK) | 528 | 81 | 77 | **7.726** |
| NPC-Handelsfrachter vorhanden | 5 | 4 | 4 | 2 |
| Neue Nahrung **bezahlt** verbraucht (gesamt) | 185 | 191 | 197 | **214** |
| Fehlende Nahrungseinheiten, kumuliert | 2.061 | 2.048 | 2.050 | **2.008** |
| Tatsächliche bezahlte Flugstunden (ISK) | 10.154 | 8.023 | 11.923 | **3.075** |
| Zufällige Leerstarts (Anzahl) | 10 | 20 | 66 | **0** |
| Netto-Waren-Cashflow nach Flug (ISK) | −5.202 | −5.578 | −5.744 | **+2.075** |
| Bestehender Werftfonds-Zuschuss (ISK) | 0 | 0 | 0 | 0 |
| Verbrauchten Stationen mit Nahrungsmangel | 6 | 6 | 6 | 6 |

| Wert | Seed7: Original | Hin | Hin/Rück | Hin/Rück ohne Leer |
|---|---:|---:|---:|---:|
| NPC1+NPC2 freie Kasse (ISK) | 35 | 54 | 59 | **8.604** |
| NPC-Handelsfrachter vorhanden | 3 | 5 | 2 | 2 |
| Neue Nahrung **bezahlt** verbraucht (gesamt) | 134 | 206 | **249** | 202 |
| Fehlende Nahrungseinheiten, kumuliert | 2.115 | 2.041 | **2.005** | 2.020 |
| Tatsächliche bezahlte Flugstunden (ISK) | 12.204 | 12.803 | 11.467 | **3.322** |
| Zufällige Leerstarts (Anzahl) | 10 | 69 | 58 | **0** |
| Netto-Waren-Cashflow nach Flug (ISK) | −6.558 | −5.867 | −7.309 | **+2.866** |
| Bestehender Werftfonds-Zuschuss (ISK) | 693 | 0 | 1.530 | **0** |
| Verbrauchsstationen mit Nahrungsmangel | 6 | 6 | 6 | 6 |

## Abgrenzung der Ursachen

**[BELEGT]** Die alleinige, rein prognostische Hinfahrt-/Rückfahrt-Kalkulation beseitigt die Verluste nicht, denn das bestehende Leerpositions-Verhalten tritt unabhängig weiter ein. Verglichen mit Original steigen etwa im Seed42 die zufälligen Leerstarts von 10 auf 66 im reinen Hin-/Rück-Kalkulationsmodell. Das ist nicht das beabsichtigte Ergebnis eines echten Vollkosten-Gates.

**[BELEGT]** Kombiniert mit ausschließlich testweise gesperrter zufälliger Leerpositionierung entstehen 0 leere Starts aus diesem Mechanismus, die tatsächlich bezahlten Flugstunden sinken auf 3.075/3.322 ISK und es verbleiben 7.726/8.604 ISK bei NPC1+NPC2. Der direkt erfasste Netto-Waren-Zahlungsstrom nach Flug ist +2.075/+2.866 ISK statt in allen drei anderen Varianten negativ. Diese Werte sind **Cashflows**, keine voll kalkulierten Konzernrenditen; die verbleibenden Schiffskäufe und Depot-/Fremdströme müssen noch gegenbewertet werden.

**[BELEGT]** Das Abschalten der zufälligen Leerpositionierungen verschlechtert die **Seed7-Versorgung gegenüber dem reinen Hin-/Rück-Gate** (249 → 202 gekaufte Neueinheiten, kumulierter Fehlbedarf 2.005 → 2.020). Gegenüber der *bisherigen* Routenwahl (134) verbessern sich die bezahlten Einheiten trotzdem auf 202. Seed42 verbessert sich sogar gegenüber allen drei Vorläufern. **Alle sechs Verbrauchsstationen weisen in jeder Variante nach Tag6 Nahrungsmangel auf.** Der globale Kreis ist weiterhin nicht stabil.

**[BELEGT]** Die alte individuelle Werftfonds-Rettung verschwindet in der Variante ohne Leerfahrten zwar in diesen Seeds zufällig/kausal durch die anders laufende Disposition; das ist **keine** produktive Abschaffung des Mechanismus. Die Alternativwelten erzeugen auch unterschiedliche ursprüngliche Kopfgeld-`minted` und Senken-`burned` durch abweichende Schiffs-/Kampfpässe. Diese Veränderungen sind keine zusätzlich beschlossene Emission.

## Prüfprotokoll

- Testdatei `tests/bk9x-routenkosten-gegenprobe.test.mjs`, Test-Head **0a293f7**: vier aktive Regel15/Schema9-Varianten je Seed42/7 ×6 Tage; stündlich unabhängige Summe freier ISK + vertraglich gebundener Restbeträge gegen `initialSupply + minted − burned`, Original-Core-Waren- und Herkunftsaudit; täglich Save/Load, 48h-Replay sowie 120-Tick-Hash-Gegenprobe des völlig unveränderten Instrumentierungs-Kerns.
- [GitHub Actions #41434929485](https://github.com/tobiasfranziskus/Check/actions/runs/41434929485) für erweiterten Stand `0a293f7`: **Workflow erfolgreich vollständig abgeschlossen**; Node.js **123/123 bestanden**, 0 Fehler, alle ausgeführten historischen v10–v14-/Geografie-Jobs erfolgreich, geplanter Sicherheitsgeografie-Vergleich übersprungen. Der erste dreivariantige Stand `e87c210` hatte ebenfalls einen erfolgreichen Workflow [#41434625000](https://github.com/tobiasfranziskus/Check/actions/runs/41434625000) mit 123/123.
- Keine reale iPad-/NAS-Abnahme. Die historischen v10–v14-Jobs sind keine R15-Stabilitätsbelege; **40 fortlaufende tragfähige Perioden und 13×90d/365d** stehen aus.

## Wirtschaftliche Empfehlung (noch kein Produktbeschluss)

1. Die **Ursache** ist besser lokalisiert: Die Handelsentscheidung ignoriert die Fahrtkosten, aber insbesondere der **separate zufällige Leerpositionsmechanismus** kann eine strengere Wahl wirtschaftlich wieder zunichtemachen. Daher **kein Merge** eines bloßen Hin-/Rück-Gates und keine blinde Abschaltung sämtlicher Leerfahrten.
2. Als **B-K9y [ANALYSE/OPTION]** nur eine *bezahlte, nachweislich wirtschaftliche Neuplatzierung* mit konkreter Waren-/Absatzchance als Alternativkontrolle testen, statt zufällige Leerfahrten abzuschaffen und Märkte nicht mehr zu erreichen. Auf dem Weg muss die Versorgung nachweisbar mindestens erhalten bleiben; alle Geld-/Waren-/Vertragsaudits bleiben verbindlich.
3. Erst nach echtem Nachweis von Handlung, Marge, freien Mitteln für Nachfolgeauftrag und bezahltem Endverbrauch den kleinsten produktiven Regelvorschlag zur ausdrücklichen Entscheidung vorlegen. **Keine Lohn-/Preisreform und keine zusätzlichen ISK.**
