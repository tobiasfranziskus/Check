# B-K9q – bezahlte Fabrikarbeit als kontrollierter Phase-B-Versuch

**[ANALYSE/DRAFT] 02.11.2026.** Unveränderter produktiver `main b4e604d` (Regel 14, Schema 8). Gestapelt auf [PR #109](https://github.com/tobiasfranziskus/Check/pull/109), der wiederum [PR #108](https://github.com/tobiasfranziskus/Check/pull/108) benötigt. Keine Merge- oder Emissionsfreigabe.

## Was der neue Testzweig beweist

Nur wenn ein expliziter Testregelsatz `schema:9`, `rulesVersion:15` und `world.produktionslohnJeMinute:1` setzt, bezahlt der Original-Core die Fabrikarbeit. **1 ISK/Minute ist eine nicht freigegebene Testannahme, keine beschlossene Spielregel.** Der Parameter ist weder in `m_data_rules.RULES` noch in der regulären Oberfläche enthalten.

- Vor dem Verbrauch der vorhandenen Produktionsrohstoffe reserviert die Stationskasse für den gesamten Rezeptzyklus `dauer × testlohn`. Reicht ihre verfügbare Kasse nicht, beginnt sie **weder Produktion noch Rohstoffverbrauch**.
- Bei wirklicher Rezeptfertigstellung nach den ursprünglichen `dauer`-Ticks zahlt derselbe Core einen eindeutigen Leistungsbeleg aus der Reserve an ein lokales Haushaltskonto `hh_<stations-id>` und bucht Stationskosten/Haushaltserlös. Vorher ist der Lohn gebunden, aber nicht ausgezahlt.
- Neue Haushaltskonten starten mit **0 ISK**, ohne `initialSupply` zu erhöhen. Alte Schema-8-Spielstände erhalten sie durch explizite Migration in diese Testvariante; neuere beschädigte Teststände werden abgewiesen, nicht still repariert.
- Spieler-Rezeptwechsel und Modulabbau dürfen laufende finanzierte Produktionsaufträge nicht verwaisen lassen.
- Das bisher unbegrenzt wachsende Vertragsbuch begrenzt **abgeschlossene** Belege auf 128 einzelne Einträge. Weitere abgeschlossene Buchungen werden in einem dauerhaft gespeicherten Summenarchiv (`anzahl, budget, gezahlt, erstattet`) aggregiert. Offene Reserven bleiben vollständig und einzeln gespeichert. Es wird weder ISK vernichtet noch erzeugt.

## Noch KEIN geschlossener Kreislauf

- **Rohstoffbezogenheit**: Eine Fabrik konsumiert vorhandenes Lager; dieses Lager kann aus Startbeständen stammen. Die historische Finanzierung jedes Lagerguts ist nicht bewiesen. Aktuelle Miner-/Händler-Verkäufe verwenden die regulären realen Kaufzahlungen, aber die Herkunft aller Bestände ist noch zu auditieren.
- **Haushalt/Nachfrage**: Das Haushaltskonto erhält Lohn, zahlt jedoch **noch keine Nahrung**. Die Endnachfrage und ihr Finanzierungsausgleich sind der nächste gesonderte Schritt; bis dahin entziehen Fabriklöhne Stationen laufend Kaufkraft.
- **Arbeit**: Die Fabrikzahlung deckt die gewählte Testannahme pro Rezeptminute, nicht eine legitimierte vollständige Kostenkalkulation. Transport-Rückfahrten, Materialkosten, Schiffsersatz und Haushaltspreis sind gemeinsam erst nach kompletter Kette zu bewerten.
- **Vertragsarchiv**: Summen werden auditiert, aber einzelne ältere Leistungsbelege sind nach der Verdichtung nicht mehr reproduzierbar. Für langfristige Nachvollziehbarkeit bedarf es ggf. eines kompakten rollierenden Prüfhashs. Die Begrenzung offener Verträge und eine Sparsamlauf-/iPad-Performance-Abnahme fehlen ebenfalls.

## Testumfang und Grenzen

`tests/bk9q-bezahlte-produktion.test.mjs`: tatsächliche Eis→Nahrung-Ticks, Vorab-Reservierung, 0-ISK-Blockade, gebundener Rezeptwechsel, Save/Load, explizite Regelmigration, 140 Buchungen mit Archiv-Geldbilanz, 13 Seed-Replays; bestehende Regressionen bleiben zu testen. Die bisherigen 90-/365-Tage-Wirtschaftsjobs testen historisch **Regel 14**, nicht dieses neue Lohnmodell. Eine bestandene Standard-CI ist damit noch kein belastbarer wirtschaftlicher Langzeitnachweis.

**Nächster produktiver Forschungs-Gate:** zivile Haushalte bezahlen ihren tatsächlich verbrauchten **neu gelieferten** Bedarf aus erwirtschaftetem Lohngeld, ohne pauschale ISK-Emission oder Rettung. Danach real wiederholte Perioden einschließlich bezahltem Frachter- und Minenersatz.
