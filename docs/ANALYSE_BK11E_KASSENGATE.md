# B-K11e – Cash-Gate Eis→Nahrung: Liquidität der Quellstationen

**[ANALYSE/DRAFT · 03.11.2026]** Eigenständiger, nicht integrierter Branch direkt auf `main b4e604d6`, Regel14/Schema8. Produktcode `index.html` und Spielregeln bleiben unverändert. Insbesondere **keine Emission, keine Fabriklöhne im Produkt, keine Preisänderung, kein Spieler-Sparlimit und keine NPC-Rettung.**

## Anlass und keine Doppelprüfung

B-K11c [#140](https://github.com/tobiasfranziskus/Check/pull/140) beweist in zwei aktiven 90-Tage-Szenarien, dass die Abwanderung liquider ISK zum Spieler die Wirtschaftskette abwürgt. B-K11d [#141](https://github.com/tobiasfranziskus/Check/pull/141) zeigt wirklichen Endverbrauch, aber 0 ISK Endkundenvergütung und trennt erstmals vernichtete Fracht vom Verbrauch. Ältere, **nicht integrierte** Vollkostenanalysen [#128](https://github.com/tobiasfranziskus/Check/pull/128)–[#131](https://github.com/tobiasfranziskus/Check/pull/131) belegen *unter einer nicht beschlossenen* Fabriklohnannahme 4 ISK/min eine vielfach negative Chargenmarge, regional teure Eisankäufe, den fehlenden kapitalgedeckten Dauerbetrieb und die Möglichkeit zahlungsunfähiger Endkunden. Insbesondere die kontrollierte 24er-Lieferung in #128 hat nur +29 ISK konsolidierten Zahlungsdeckungsbeitrag **vor** Schiffskapital, aber die Quellstation verliert im selben Versuch 1.032 ISK.

**B-K11e wiederholt diese R15/Schema9-Chargentests ausdrücklich nicht.** Es untersucht im **unveränderten Produkt** und ohne Schattenwirtschaftsfortschreibung, an wie vielen echten Produktionsstarts die lokale Kasse überhaupt eine hypothetische Produktionslohnreserve und Markt-Eis-Wiederbeschaffung leisten *könnte*.

## Methode

Original `m_core_produktion.produktion` startet r_nahrung: 2 Eis → 1 Nahrung in 6 Minuten, **ohne Geldzahlung**. `m_core_handel.handel` bezahlt bei erfolgreichem Frachterverkauf Eis real aus der Stationskasse; beim Frachterkauf von Nahrung fließen vorhandene ISK an die Quellstation. `m_core_stunde.fonds` deckt ggf. die Mindestkasse mit realen **Fondsüberweisungen**, ohne Geld zu schaffen. `m_core_stunde.verbrauch` vernichtet Nahrung beim echten zivilen Verbrauch **ohne neuen Endkundenumsatz**.

Ein read-only Instrument am unveränderten Original-Core erfasst an den drei vorhandenen Nahrungsfabriken Cyris, Nadir und Veldra ausschließlich erfolgreiche Eis-/Nahrungs-Warenzahlungen, original gestartete und fertiggestellte Rezepte, tatsächlichen eigenen Nahrungsverbrauch, reale Fonds-Transfers und verfügbare Stationskassen. Der Vergleichs-Core läuft ohne Instrument parallel; jede Stunde muss derselbe Hash und eine unabhängige Geld-/Warenbilanz gelten.

**[ANALYSE: definierte, nicht beschlossene Kostenannahme]** Nur als Schattenindikator aus #128–#131: 4 ISK je Original-Rezeptminute ⇒ 24 ISK je fertigem Nahrungsstück. Beim realen Produkt-Rezeptstart werden separat erfasst:

- **Lohn-Gate:** vorhandene Stationskasse kleiner als 24 ISK (ein hypothetischer neuer Auftrag wäre zu diesem Zeitpunkt nicht vorfinanziert).
- **Wiederbeschaffungs-/Betriebskapital-Signal:** vorhandene freie Stationskasse kleiner als `2 × aktueller Original-Eispreis + 24`. Das Eis wurde im Original zu diesem Zeitpunkt **bereits physisch aus einem Lager beschafft**, der heutige Spotwert ist **keine Ist-Einkaufskostenbuchung**. Diese Kennzahl belegt also keine tatsächliche Unterdeckung oder den Zeitpunkt eines echten zukünftigen Warenkaufs.
- **Momentane Produktionsmarge:** `aktueller Original-Nahrungspreis − 2 × aktueller Eispreis − 24`. Kein vollständiger Chargenbeitrag: echte frühere Eiseinkaufspreise, bisherige Bestandkosten, Gebühren, Lade-/Leerfahrt, Material-/Hullrisiko und Endverbrauchszahlung sind darin **nicht enthalten**.

Zusätzlich getrennte reale Quellstations-Bruttocashflows: bezahlte Nahrungsexporte und Eisverkäufe minus bezahlte Eiseinkäufe und Nahrungseinkäufe; daneben rein rechnerisch minus 24 ISK je gestartetem Rezept. **Keines dieser Salden ist eine konsolidierte Gewinn- oder Verlustrechnung**, weil Startbestände, Lagerveränderungen, übrige Waren-/Schiff- und Fondsbewegungen, Warenherkunft und gezielter Versand fehlen. Die Hypothese einer Produktionskostenzahlung wird nicht in den Core übertragen.

## Prüfumfang

- **13 passive Originalwelten ×72 Stunden** (gepinnt nach `tools/b5b-common.mjs`).
- **Zwei aktive Original-Spielerkrisen ×14 Tage**, jeweils Seed42, mit denselben validierten Spielerbefehlen wie B-K11c/B-K11d; die beiden historischen Tag14-Hashes werden direkt geprüft.
- Stündliche Originalhash-Abgleiche und native/unabhängige Geld-/Warenaudits, täglich Save/Load auf beiden parallelen Welten. Keine Eingriffe in RNG, Markt, Fonds, Produktion, Piraten oder Ersatzkauf.

**Tests erst nach tatsächlich ausgeführter CI als bestanden bezeichnen.** Diese 15 kleinen Originalwelten sind keine 13×90d-Abnahme neuer Produktregeln und keine reale Safari-/NAS-Abnahme.

## Freigabegrenze

Auf Basis der Zahlen lässt sich klären, ob ein fehlender Endkundenzufluss allein die Quellstation zahlungsfähig halten kann, oder ob zusätzlich die reale Eis-/Nahrungsmarge und Betriebskapitalansprüche einen unfinanzierbaren Produktionsstart erzeugen. Für eine neue Produktumsetzung bleiben D2 (Fabriklohn und Empfänger), D3 (Material-/Auftragsbindung), D6 (echter zahlungsfähiger Endkunde) und konkrete Geldmodell-B-Emissionsregeln **gesondert freigabepflichtig**. Keine stillschweigende Übernahme der 4-ISK/min-Testannahme, keine Emissionshöhe aus Bruttoumsatz ableiten, keine individuellen Konkursgarantien.

Keine Änderungen an `main`, keine Merge-/Deployment-Aktion.
