# W5s-ag – real finanzierter Wasserbedarf und Lagerbestellvorlauf

**[DRAFT/ANALYSE · 07.11.2026]** [PR #235](https://github.com/tobiasfranziskus/Check/pull/235) auf [W5s-ad–af #233](https://github.com/tobiasfranziskus/Check/pull/233), nicht auf `main`. Keine Produktregel, Veröffentlichung oder Speicheränderung.

## Warum der vorhandene Markt ruht

Die verifizierten W5s-ad–af-Prüflogs melden in beiden Krisenseeds nach vollständiger Finanzierung und Überführung des Drittspediteurs: Nadir 40 physische Eis + 31 Wasser, Aldera 150 physische Eis, Nadir-Kasse 2283 ISK, Endkundenkasse 31 ISK, Drittspediteur 120 ISK. Das originale W5o-Versorgungsziel 60 verhindert zusätzliche Fracht bei bereits 71 physisch vorhandenen Einheiten. Stunden später sind Endkunden auf 8 ISK gefallen und bleiben ohne weitere bezahlte Arbeit kaufunfähig; mit 40 Eis + 29 Wasser produziert das Wasserwerk am ursprünglichen Ziel 24 keine weitere Arbeitsleistung. Schon dieser Bestand beweist: Eine vollfinanzierte neue Spedition allein schafft weder zusätzlichen realen Absatz noch wiederkehrenden Lohn.

## Isolierter Prüfversuch

Nur `w5s.successorDemandLoop:true` verschiebt die bestehenden **physischen Wiederbestellpunkte**, nicht den tatsächlichen Verbrauch und **nicht** die Rechnungsregeln:

- Original-W5o-Wasserverbrauch unverändert 2 Einheiten/Stunde zu je 14 ISK, nur soweit Haushaltsgeld und Wasser real vorhanden sind.
- Neue physische Reserve für Eis- plus Wasserbestände: maximal der höhere Wert aus bisher 60 und 40 Stunden des bereits existierenden Verbrauchs (hier 80). Die Industrie erhält keinen Gratisbedarf.
- Fertigwasserwerk beginnt bei maximal dem höheren Wert aus bisher 24 und 20 Stunden Verbrauch (hier 40). Es benötigt weiterhin 10 tatsächlich gelieferte Eis je 10 Wasser, einen freien Auftrag, Lagerraum und reale 20 ISK für minutengenaue Produktionsarbeit.
- Eisfrachter nur über originales `shipFreightIce`: 50 wirklich vorhandenes Quell-Eis, mindestens 28 ISK bereits vorhandenes Haushaltsgeld für die nächste Verbrauchsstunde, 490 ISK reale Nadir-Käuferkasse und 120 ISK eigene Frachter-Pilotenarbeit. Erst nach vollständig realer Fahrt 240 ISK Umsatz. Original-W3-Erzlogik unverändert; erste Beauftragung nach bisherigem Vorrang.
- **Default OFF**; unverändertes Schema 8 und Regelversion 32. Keine zusätzlichen Konten, Waren, Hausmittel, Schiffe oder Emissionen. W5o-Nachfrage, W5n-Gate, W5s-Eis-/Erzdispatcher, Bedarfsauskunft und Wasserwerk teilen die selben zwei optionalen Grenzwerte.

Die 40/20 Stunden sind ausdrücklich **Forschungsannahmen**, keine beschlossene optimale Bestellpolitik oder garantierte, langfristig finanzierte Endnachfrage. Die nächste bezahlbare Wasserentnahme allein berechtigt noch nicht zu der Behauptung, 40 Stunden Verbrauch seien durch Haushaltseinkommen gedeckt.

## Wirtschaftliche Nachweise / Ausschlusskriterien

`tests/w5s-ag-realwasser-nachfrage.test.mjs` prüft: unveränderte OFF-Welt und Hash, nachträglich optiertes, tatsächlich finanzierbares Angebot, Original-Eis-/490-ISK-/120-Minuten-Abrechnung, fremde Eigentümerkasse, physisch ausgeführte 10:10-Wasserproduktion, tatsächlich bezahlten Endkundenverbrauch, Negative bei fehlendem Kunden-/Stations-/Arbeitskapital und Quellware, 35 Tage fortlaufende Geld-/Waren-/Arbeitsaudits, 13×90d und Seed42/7×365d samt Save/Load. Workflow `.github/workflows/w5s-ag-wasser.yml` führt dazu gesamte Standardregression auf Node 22 aus.

**[TEST]** Erst nach abgeschlossenem GitHub-CI als erfolgreich bezeichnen. Auswerten: Anzahl tatsächlich bezahlter Eis-/Erzfrachten, Lohnzahlungen, Wasserwerk-Chargen, Endkundenverbrauch, Unternehmensnetto, Tage bis zur Nachfrage-/Einkommensblockade. Auch bei 1–2 echten Folgeaufträgen bleibt die Wirtschaft möglicherweise strukturell nicht selbsttragend; dann **keine Produktaktivierung**, sondern Engpass in einem weiteren isolierten Schritt beheben.

**Nicht geändert:** `main`, GitHub Pages, die archivierte Vorversion, Spielstände, Preis- und Geldsystem, iPad-/NAS-Abnahme, paralleles UI-Vorhaben W5u.
