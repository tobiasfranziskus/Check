# B-K9u: Chargen-FIFO, belegte Herstellkosten und Betriebskapital

**[ANALYSE/DRAFT, 02.11.2026]** Gestapelt auf [#111](https://github.com/tobiasfranziskus/Check/pull/111) mit #110/#109/#108 im neuen [PR #112](https://github.com/tobiasfranziskus/Check/pull/112). **[MAIN]** b4e604d6, v0.12.5/Regel14/Schema8 unverändert. Alle neuen Tests laufen ausschließlich mit expliziter Regel15/Schema9 und bisherigen Lohnszenarien. Keine neue Emission, Preis-/Lohn-/Rezeptregel oder Insolvenzgarantie.

## Methodik

Der Test tests/bk9u-chargen-vollkosten-betriebskapital.test.mjs zeichnet in einer reinen Test-Closure Original-Core-Buchungen auf. Die instrumentierte Core-Ausführung stimmt im 120-Tick-Gegenlauf unter Regel15/Schema9 mit dem unveränderten Core in Hash und Zustand überein. Replays, Save/Load, Geld-/Waren-/Herkunftsaudits und stündliche Kassen-/Vorratsbrücken werden geprüft.

- **Eis-FIFO:** reale Rohstoffeinkäufe mit Tick, Einheit, tatsächlichem Einkaufspreis und Rechnung. Die anfänglichen 80 Eis-Einheiten haben **keinen historischen Einstandsnachweis** und werden als UNBEWERTET geführt, ausdrücklich nicht als kostenlos.
- **Chargen:** Jedes echte Cyris-Nahrungsrezept entnimmt zwei Eis aus FIFO, reserviert vorab sechs Produktionsminuten Lohn und erhält einen eigenen Beleg. Erst bei Fertigstellung wird der Lohn ausgezahlt und eine Nahrungseinheit gebucht.
- **Endabsatz:** Tatsächlich bezahlte Haushaltskäufe ordnen fertigen Nahrungschargen FIFO ihren echten dynamischen Verkaufspreis zu. Übrige neue Ware bleibt als Bestand erhalten; nicht finanzierbarer Bedarf bleibt als Mangel ausgewiesen.
- **Betriebskapital:** Die Brücke erfasst freie Stations-ISK, bezahlte Eisvorräte, bezahlte Fertigwaren, Rohstoffaufwand in unfertigen Chargen und gesperrte Lohnreserven. Laufende Vertragsreservierungen werden gegen das Core-Vertragsbuch geprüft. Die Summe ist wegen unbewerteter Anfangsware zunächst eine **belegte Untergrenze**, keine vollständige Bewertung.
- **Akteursabgrenzung:** Der Eis-Einkauf ist Aufwand der Station und Erlös des Miners. Minerstunden und ihre echten Zahlungen werden separat beobachtet; sie dürfen nicht nochmals zusätzlich zum Eis-Einkauf als Stationsaufwand verbucht werden. Eine systemweit konsolidierte Wertschöpfungsrechnung muss interne Transfers eliminieren.

Versuchsaufbau: Cyris nur mit r_nahrung, anfängliches Nahrungslager 0 und Ledger-Korrektur, Autohändler auf halten; Original-Miner und Original-Ticks bleiben aktiv. Normale Stationsfonds-Auffüllung durch mindeststand=0 und sehr hohe fondsObergrenze unterdrückt, **nicht** sämtliche anderen historischen Subventionspfade. Seeds 42 und 7; Testlöhne 2, 4, 6 ISK/Minute als reine Szenarien. Keine Behauptung für den autonomen Gesamtmarkt.

## Tatsächliche Chargenrechnung, Szenario 4 ISK/Minute

Seeds 42 und 7 liefern in der kontrollierten Cyris-Kette dieselben verifizierten Werte. Alle Zahlen kumuliert ab Start:

| Original-Core-Vorgang | Tag 1 | Tag 2 |
| --- | ---: | ---: |
| Anfangskasse | 4.000 | 4.000 |
| Bezahlter neuer Nahrungsverbrauch: Einnahme | +2.454 | +3.380 |
| Eis: Einkaufszahlung | −3.252 (258 Einheiten) | −3.736 (302 Einheiten) |
| Ausgezahlte Fabriklöhne | −2.856 | −3.408 |
| Kristall: Einkaufszahlung, gesonderter Nebenposten | −234 | −234 |
| **Frei verfügbare Stationskasse** | **112** | **2** |
| Fertiggestellte Nahrungschargen | 119 | 142 |
| Tatsächlich bezahlte Nahrungseinheiten | 72 | 98 |
| Unverkaufte neue Nahrung | 47 | 44 |
| Belegter Einstand dieser Nahrungsbestände | 2.178 | 2.024 |
| Eis im Lager | 100 | 98 |
| Belegter Einstand des verbliebenen Eis | 1.100 | 1.078 |
| **Nachweisbar gebundenes Umlaufkapital** | **3.278** | **3.102** |
| Anfangs-Eis ohne Einkaufsbeleg bereits verbraucht | 80 | 80 |
| Verkaufte Chargen mit vollständig belegtem Eispreis | 32 | 58 |
| **Realisierter Deckungsbeitrag nur dieser exakt bewertbaren Verkäufe** | **−867** | **−1.153** |
| Cyris-Eisminer: tatsächlich gezahlte Stundenkosten | 892 | 999 |
| Cyris-Eisminer: nicht bezahlte Sollkosten | 0 | 0 |
| Fehlende Bedarfs-Einheiten, kumuliert | 0 | 46 |

**Unabhängige Kassenidentität am Tag 2:** 4.000 + 3.380 − 3.736 − 3.408 − 234 = **2 ISK**. Das Stationseis wurde bezahlt, die Fabrikarbeit wurde bezahlt und die Nahrung wurde teilweise bezahlt verbraucht. Zugleich fehlen 22 ISK zum nächsten Lohnbudget von 24 ISK, obwohl mindestens 3.102 ISK bereits in bezahlten Rohstoffen/Fertigwaren stecken. Die Haushaltskasse beträgt zu diesem Zeitpunkt nur 28 ISK. Tag3/4 kommen keine neuen Verkäufe oder Fertigstellungen hinzu; der kumulierte Fehlbedarf steigt auf 118 bzw. 190 Einheiten.

Die negative Marge der 58 belegten Chargen ist **ein echter historischer FIFO-Befund**, kein Preisindikator aus einem späteren Preis-Snapshot. Für Chargen mit Anfangs-Eis ist eine exakte Marge ohne dessen Anschaffungswert unmöglich. Trotz nachgewiesen negativer Teilmargen dürfen deren unbekannte Kosten nicht als 0 gewertet werden. Eine gesamtwirtschaftliche Vollkostenrechnung erfordert außerdem vollständige Zuordnung der Minerkosten, Gebühren, Frachter und bezahlter Ersatzinvestitionen auf einer konsolidierten Ebene.

## Sensitivität ohne Balancing-Freigabe

- **2 ISK/min:** Tag1 34 bezahlte Nahrungseinheiten, 65 Einheiten im vollen Fertigwarenlager, 938 ISK freie Kasse und mindestens 3.592 ISK gebunden. Tag2 keine weiteren Verkäufe/Rezepte. **Absatz-/Lagerblockade**, nicht Lohnreserve-Knappheit; die zuerst verkauften Chargen tragen unbewertetes Anfangseis, daher kein vollständig historisch bewertbarer verkaufter Chargensatz.
- **6 ISK/min:** Tag1 72 bezahlte Einheiten, 135 ISK frei und mindestens 2.856 ISK gebunden. Tag2 118 Einheiten kumuliert, 31 ISK frei, 2.376 ISK gebunden und 26 Fehlbedarf. Die nächste Fabrikreserve beträgt 36 ISK. Die 78 vollständig bepreisten verkauften Chargen erzielen zusammen **−1.538 ISK** Deckungsbeitrag. Höherer Lohn schafft zunächst Nachfrage, beseitigt aber die Verlust- und Kapitalblockade nicht.

## Nachweisgrenzen und Entscheidungsgate

**[BELEGT]** Technisch geschlossener Teilweg: reales Eis bezahlt, echte Fabrikarbeit vorfinanziert, Neuware produziert, Nahrungsverbrauch aus vorhandenen Haushalts-ISK bezahlt und beidseitig auditiert. Mindestens 58 verkaufte Chargen sind bereits vor zusätzlichen Systemkosten negativ. Bezahlte Vorräte binden den Großteil des Betriebskapitals und lassen zu wenig liquide Mittel für die nächste Produktionsreserve.

**[OFFEN]** Historische Vollbewertung der Startware; end-to-end Warenherkunft über Frachter; Miner- und Frachtereinzelchargen, Transportgebühren und bezahlter Schiffersatz; realisierbarer Inventarverkaufswert; aktiver NPC-Markt und bestehende Flottenzuschüsse (B-K9s: 693 ISK in Seed7); 40 tragfähige Wiederholungsperioden, 13×90d/365d und iPad-/NAS-Abnahme. Ein historischer Regel14-Referenzlauf beweist nicht die neue Regel15-Wirtschaft.

**Empfohlen:** Vor jeder Preis-, Lohn- oder Geldquellenentscheidung auf einer getrennten Folgeanalyse die **konsolidierten** Miner-/Frachter-/Produktionszahlungen inklusive Gebühren, Flottenzuschuss und Schiffersatz zuordnen und den erforderlichen Mindestumlauf nachweisen. Erst dann 40 reale Wiederholungsperioden ohne versteckte Individualrettung, danach 13×90d und Krisen. Keine neue ISK-Emission ohne ausdrücklichen Beschluss.
