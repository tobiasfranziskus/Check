# B8c – Mindestkapital und Wiederholbarkeit von Rohstoffhandel

**31.10.2026 · [ANALYSE/DRAFT]**. Ausgangsbasis `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel14 / Schema8. **[BESCHLOSSEN]** Spieler darf Geld sparen; keine Pflichtsteuern/Einzelrettung; Modell-B-Geldquellen nur gegen echte Leistungen. Die **einzige verbindliche Roadmap** bleibt [docs/ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md).

## Fragestellung

B8b belegte an Tag14 im aktiven Seed42-Spielerfall: Fabriken ohne Eis/Material trotz vorhandener Rohstoffe anderswo; zahlungsunfähige Käufer Cyris und Nadir; NPC1/2 ohne Kapital und Frachter; NPC3 mit realem Kapital. B7f/B7h/B7i/B7k haben außerdem **bereits** echtes NPC3-Investment, selbstständige Folgetransporte, Vollkostenfilter und Risiko untersucht. B8c **wiederholt diese Varianten nicht** und testet **keine neue Geldquelle**.

Hier werden per ausschließlich lesender Originalkern-Instrumentierung die konkreten Einkaufsmengen identifiziert, die **über einen hypothetischen Hin- und Rückflug nach Originalpreisen, beiden Gebühren und angesetzter Fahrtarbeit rechnerisch positiv** wären. Zu jedem Angebot werden **tatsächlich vorhandene** Quellmengen und Ziel-Lagerkapazität, aktuelles Käufercash und daraus folgender Fehlbetrag, die notwendige Handelsvorfinanzierung für einen **frischen real zu kaufenden** NPC3-Konzernfrachter samt Leerpositionierung und der potenzielle zusätzliche Cashbedarf für eine **zweite identische Lieferung ohne zwischenzeitlichen Kaufkraftzufluss** ausgewiesen. Alle vorhandenen NPC-Kassen, alle Stationen und der Spieler bleiben im eigentlichen Weltlauf unverändert.

**Zentrale Grenze:** Das ist ein **Finanzierungsangebot / notwendige Cash-Bedingung**, keine bereits ausgeführte Lieferung und **kein belastbarer positiver Gewinnnachweis**. Betriebskosten werden als Minutenansatz `ceil(routeMinutes × Frachter-ISK/h / 60)` pro Etappe geschätzt. Hüllenpreis/-gebühr sind echte Core-Quotes, ihr Wert bleibt anschließend ein realer Vermögenswert. Leerlauf, Piraten-/Warte-/Minerersatzkosten, Steuern, Produktionsfolgemargen, eine denkbare zweite Käuferzahlung und mögliche günstige Anschlussrouten sind **nicht** als gesicherte Rendite modelliert. Die ausgewiesene komplette Vorfinanzierung enthält daher vorsorglich beide Fahrtarbeitsrichtungen, obwohl ein Verkauf in der Praxis den Rückweg finanzieren könnte; sie ist eine **konservative Größenordnung**, nicht zwingend das mathematische Minimum.

## Prüfung

- Originaler Regel14-Core, sechs historische Spieleraktionen? **Exakt sieben** Original-**B1-Spielerbefehle** ab Tick1 wie in B8b; Seed42 bis Tag90 und passive Seed42-Welt bis Tag14.
- Unveränderte historische Spieler-90d-Endreferenz `784047684dfe5c56`.
- Originalkern gegen nur beobachtend instrumentierten Kern, stündliche unabhängige Waren-/Geldprüfungen und Replayhashes, bestehende Save/Load-Roundtrips und 67 Standardtests.
- Quell- und Zielpreise, Reserven, Käufercash und Vollkostenangebote von Eis nach Nahrungsfabriken sowie Material nach Cyris ausschließlich durch bestehende Core-Funktionen.
- **Keine Änderungen an `index.html`, `tests/**`, Goldenwerten, PRs B7/B8a/B8b, Regeln, Schema, KI, Pacht, Spielern oder bestehenden Saveformaten. Kein echter Test einer ISK-Emission; die Zahlen zeigen nur, wo ein Modell-B-Finanzierungsmechanismus ansetzen müsste.**

## Befunde

**[NOCH ZU PRÜFEN]** Der korrekte Workflow- und Testnachweis sowie die Zahlen werden erst nach tatsächlich erfolgreicher CI aus Logs/Artefakten eingetragen. Ein positiver Quote ist **kein** Transport und keine nachhaltige Liquidität.

**Nächstes Gate:** Wenn an einer konkret produktionskritischen Lieferung Käufer-ISC und Transportkapital wirtschaftlich zu unterscheiden sind, **nur einen** realen End-to-End-Vertrag ausführen und danach Liquiditätsrückfluss, zweiten Kauf und Produktionsfolge nachweisen. Erst danach Modell-B-Quellenentscheidung, 13 Seeds ×90 Tage und 365d-Spielerkrisen; kein Einzel-Bailout.

**Freigabe:** [ANALYSE/DRAFT], nicht mergen, nicht deployen, keine Safari-/NAS-Abnahme.
