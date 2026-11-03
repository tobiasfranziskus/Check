# B-K12a – Nadir-Stückkostendeckung und reales Käuferbudget

**[ANALYSE/DRAFT · 03.11.2026]** Eigenständiger Anschluss an [B-K12 #155](https://github.com/tobiasfranziskus/Check/pull/155), historisch isolierter R15-/Schema9-Testkern mit in B-K12 belegten, **nicht produktiv beschlossenen 4 ISK Produktionslohn pro Minute**. **[MAIN]** `b4e604d6` / v0.12.5 Regel14/Schema8 bleibt unverändert. Kein Merge, kein Deployment, keine Änderung von `index.html`, historische Core-Fixture oder alter Spielstände.

## Prüfproblem

B-K12 hat im Nadir-Mikrofall erstmals eine reale lokale Fehlmarge für tatsächlich bezahlten Nahrungskonsum nachgewiesen: 2 Eis × 22 ISK + 24 ISK Lohn = **68 ISK** Stückkosten; erster realer Endverkauf **53 ISK**. Über 23 bezahlte Nahrungseinheiten betragen die originalen realisierten Istkosten **1.564 ISK**, der echte Markt-/Haushaltserlös aber nur **1.031 ISK**, also **−533 ISK**. Ein parallel bei 0 ISK liegender Stationscash wäre sowohl Folge des Betriebsvermögens im Lager als auch dieser negativen Marge. Das ist keine allgemeine Bewertung aller Nahrungspreise oder ein Produktlohnvorschlag.

## Hypothesen – keine genehmigten Produktmechaniken

A. **Nur Haushalt:** Für tatsächlich belegte neue Nahrungs-Kaufchargen zahlt der örtliche Haushalt neben dem unveränderten originalen Marktpreis eine testseitige **zusätzliche, exakt zugeordneten Istkosten-Unterdeckung**. Vor dem Kauf muss er Geld für beide Beträge besitzen; andernfalls wird die neue Ware **nicht** kostenlos konsumiert. Das ist ein hypothetischer ergänzender Leistungsbeitrag, ökonomisch eine höhere effektive Käuferbelastung; ausdrücklich **keine Preisreform-Freigabe**.

B. **Haushalt und vorhandener lokaler Fonds:** Haushalt zahlt den unveränderten Original-Marktpreis; für die nach FIFO real belegte Deckungslücke kann **nur der tatsächlich freie Cash eines lokalen Systemfonds** einen ergänzenden, testseitigen Leistungsauftrag finanzieren. Reicht der Cash nicht, findet kein solcher kostenunterdeckter Neu-Endkauf statt. Keine automatische Aufstockung, keine Emission, keine individuelle Stations-/NPC-Rettung.

**In beiden Gegenarmen:** Zusatzgeld wird nur nach der Original-Core-Nahrungszahlung und nur bei tatsächlich ausgeführtem neuem Konsum über den existierenden `m_core_vertrag.reservieren → bezahlen → abschliessen`-Mechanismus auf das Konto der produzierenden Station gebucht. Geldquelle und Empfänger sind echte Bestandskonten; Vertrags- und Herkunftsaudits müssen stimmen. Keine Zusatzwaren, kein unverdienter Vorschuss, kein Gratisverbrauch, keine Änderung des Original-Marktkurses, der Fabriklohnregel oder der Produktion. Das ist **Abnahmefinanzierung am Verbrauchstag**, ausdrücklich **noch kein vorfinanzierter Beschaffungs-/Produktionsauftrag vor Rohstoffeinkauf**. Es belegt nicht, dass derselbe Fonds die Weiterproduktion oder andere Stationen dauerhaft tragen kann.

## Vergleich und technische Gates

- Original-Nadir aus B-K12 mit Seed42/7, bestehender identischer Entfernung lediglich von anfänglichen Eis-/Nahrungsbeständen **samt anfänglicher Warenledger-Menge**, anfangs alle NPC-Handelsfrachter angehalten; ursprüngliche Core-Simulation für Miner, Haushalt, Station, Kampf und Produktion.
- Beide Käuferarme je Seed **24h**; für Seed42 zusätzlich **7 Tage** Original, ausschließlich Haushalt und geteilte Fondsabnahme. Bei all diesen Gegenwelten entstehen reelle Firmen- und Stationszahlungen; auch die Folgeeffekte ändern sich deterministisch, nicht als Schattenkalkulation.
- Jede Stunde unabhängige Geldprüfung inkl. echter offener Reserven, Warenbilanz und Core-Herkunft; tägliches Save/Load; wirkliche FIFO-Istkosten und gezahlte Markt-/Zusatzbeträge pro verkaufte Neu-Nahrung. Nur Verkäufe mit **tatsächlich vorhandener Deckung** zählen als gedeckt.
- Entscheidend sind **bezahlte Nachfragemengen, verbleibende Kaufkraft, Stations- und Fondscash, ursprünglicher realer Verlust, Produktionsvolumen und Nahrungsmangel gemeinsam**. Ein Modell darf nicht als nachhaltig gelten, wenn es nur weniger Endverbrauch zulässt oder die örtlichen Fonds/Haushalte vollständig leert.
- Die Simulationen sind historisch isolierte Nadir-Mikrowelten **keine 13×90d-Normalwirtschaft**; Testlohn 4, Haushaltsbeiträge und Fondsaufträge sind **nicht** freigegebene Produktregeln.

**[TESTSTATUS]** Die ersten Ergebnisse und ausgeführten GitHub-CI-Läufe werden nach Abschluss eingetragen. Keine Ergebnisse vor bestätigtem Test.
