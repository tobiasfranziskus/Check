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

## [TEST] Ausgeführter B-K11e-Beleg vom 03.11.2026

**[CI #41589675159](https://github.com/tobiasfranziskus/Check/actions/runs/41589675159)** vollständig erfolgreich auf Analysecode `98312d8a`. Der Workflow überprüft einen Node-Smoke, **13 passive Originalwelt-Seeds ×72h** und zwei aktive **Seed42-Spielerwelten ×14 Tage**, jeweils mit einem **parallel laufenden Original-Core ohne Instrumentierung**, stündlichem Original-/independent-Geld-/Waren-Audit und Hash-Abgleich, täglich Save/Load. Das sind **936 + 672 = 1.608 stündliche Audit-/Replayzeitpunkte** und **78 + 56 = 134** Save/Load-Roundtrips (jeweils zwei Welten pro Tagesprüfung; 13×3×2 + 2×14×2 = **134**). Die beiden aktiven Tag14-Hashes sind **`cfabd13df77ec778` / `d175beeaaef304a9`**, identisch zu B-K11d. Achtung: 13×72h **ist keine** 13×90d-Gesamtwirtschaft.

| Original-main mit *hypothetischem* 4-ISK/min-Lohn-Gate | 13 passive Welten ×72h | Miner42 ×14d | Miner+Handel42 ×14d |
| --- | ---: | ---: | ---: |
| Ausgeführte originale Produktionsstarts Nahrung | **16.621** | 3.365 | 2.435 |
| Davon negativer Spotabstand `P(Nahrung) − 2×P(Eis) −24` | **16.594** | 3.364 | 2.435 |
| **Summe der Spotabstände, nur Schattenindikator** | **−293.198 ISK** | −61.277 ISK | −46.642 ISK |
| Mittlerer Spotabstand je Start | **−17,64 ISK** | −18,21 ISK | −19,15 ISK |
| Starts, bei denen Stationskasse <24 ISK war | **516** | 725 | 643 |
| Starts, bei denen Stationskasse <`2×Spot-Eis+24` war | **563** | 798 | 706 |
| Wirklich bezahlte Eisankäufe der drei Quellstationen | 518.338 ISK | 96.296 ISK | 75.080 ISK |
| Tatsächlich erhaltenes Geld aus Original-Nahrungsexporten | 327.720 ISK | 64.911 ISK | 44.926 ISK |
| Original-Fonds→Quellstation-Mindeststandzahlungen, **Bruttotransfers** | 1.394.632 ISK | 225.360 ISK | 189.571 ISK |
| Tatsächlich im Produkt bezahlte Fabriklöhne | **0 ISK** | **0 ISK** | **0 ISK** |

**Passive 13-Welten-Gruppe:** Von 16.621 realen Rezeptstarts haben **99,84 %** unter dem **nicht freigegebenen** Lohnsatz von 4 ISK/Minute einen negativen Momentabstand. Für Nadir (4.167/4.167) und Veldra (7.255/7.255) gilt dies in allen beobachteten Starts, für Cyris in 5.172/5.199. Der Mittelwert über die 13 **getrennten** Welten (kein Gemeinschaftskonto) ist ein Spotindikator, keine bereinigte Gewinnrechnung. Die realen Fondsüberweisungen sind **mehrfach umgesetzte vorhandene ISK**, niemals eine gemessene erforderliche Emission.

**Aktive Seed42-Krisen:** Die 24-ISK-Kassenhürde ist im Originalprodukt aufgrund kostenloser Herstellung noch **kein** Produktionsstopper. Im gedachten Lohnmodell könnte sie allerdings bereits bei 725/3.365 Starts des Minerfalls bzw. 643/2.435 des Handelsfalls eine Vorfinanzierung verhindern. Das aktive Produkt hört in beiden Fällen nach Tag14 auf, weitere Nahrungsrezepte zu produzieren – der eigentliche Kollaps ist im bestehenden Produkt **nicht** durch eine bezahlte Fabrikrechnung verursacht.

**Wichtig: Keine doppelte oder falsche Wirtschaftsaussage.** Eisankäufe und Nahrungsverkäufe sind echte beobachtete Zahlungen, aber sie sind wegen alter Eingangsvorräte, konkurrierender Geschäfte, lagender Ware, fehlender bisheriger Fabriklöhne, zusätzlicher Fondsflüsse sowie nicht zugeordneter Transport-/Schiffskosten **keine identische fertige Charge**. Die hypothetischen 24 ISK werden **nicht** vom Originalkonto abgezogen und **nicht** als Leistungsauszahlung ausgegeben. Auch die große negative Summe der Momentabstände ist **kein** durch neue ISK auszugleichender nomineller Schuldposten. Die bestehenden B-K10k–n-Chargentests liefern getrennte reale R15-Einkaufs- und Lohnbelege, sind aber nicht ohne weiteres mit dem hier unveränderten Regel14-Zustand zu verrechnen.

## Entscheidung und nächster kleiner Schritt [ANALYSE]

**Nach B-K11c, d und e sind zwei voneinander unabhängige Voraussetzungen sichtbar:** **(a)** eine belegte, wiederkehrende Geldquelle/Käuferkaufkraft und **(b)** ein lokaler Produktionsauftrag mit sinnvoller Marge und vollständig gebundenem Betriebs-/Beschaffungs- und Ersatzkapital. Keines darf durch bloße Fondsüberweisung, zusätzliche Start-ISK oder Gratisarbeit kaschiert werden.

**Empfehlung:** Keine ungezielte weitere 13×90d-Fächerung, bevor D2 (echter Lohn-/Produktionskostenempfänger), D3 (Bestellung und reale Waren-/Geldbindung) und D6 (echte, begrenzte Endkundenzahlung) als konsistentes **Einzelgeschäft** mit transparentem Kassen- und Preisangebot festgelegt sind. Der bereits getestete Einzelbeleg aus #128 (24 Nahrung, nur +29 ISK vor Kapital, Quellstation −1.032) zeigt, dass selbst ein gruppenweit positives Geschäft aus lokaler Sicht ohne korrekt bezahlte Quelle nicht wiederholbar ist. **Geldmodell-B ist nur als Rahmen beschlossen**. Kein neuer Lohnsatz, Preisaufschlag, Anspruch auf Endkunden-ISK oder Merge aus diesen Zahlen automatisch autorisiert.
