# Aphros Void – Wirtschaftsanalysen v11: Abschlussarchiv (30.10.2026)

**Status:** Historische, ausgeführte Analysen. **Keine zweite Produkt-Roadmap.** Verbindlicher Plan: [ROADMAP.md](ROADMAP.md). Produktiver Stand: [PROJEKTSTATUS.md](PROJEKTSTATUS.md).

## Abgeschlossene, nicht integrierte Untersuchungen

| PR | Gegenstand | Beobachteter Befund | Entscheidung |
| --- | --- | --- | --- |
| [#16](https://github.com/tobiasfranziskus/Check/pull/16) | NPC1-Flottenexpansion | Investitionen und laufende Kosten waren nicht hinreichend finanziert | Geschlossen, **nicht integrieren**, bis wirtschaftlich abgesichert |
| [#23](https://github.com/tobiasfranziskus/Check/pull/23) | Kapital-/Geldflussdiagnose | Stationskassen verlieren Versorgungskapazität, wenn NPC-Kapital nicht mehr umverteilt wird; bestehende Kapitalobergrenze ist ein wichtiger Rückfluss | Analyse abgeschlossen, Ergebnis bewahren |
| [#24](https://github.com/tobiasfranziskus/Check/pull/24) | Pilotengehalt-Szenarien | Pilotenguthaben ohne realen Rückfluss verschlechtern Stationsliquidität und Versorgung stark; 13 Seeds × 90 Tage | Experiment archiviert, **kein Lohnsystem** integrieren |
| [#25](https://github.com/tobiasfranziskus/Check/pull/25) | Modulproduktion/-käufe | 281 Module produziert, 280 verkauft, 75.477 ISK Pilotenumsatz; Mangelstunden trotz realer Rückflüsse noch 483.539 | Experiment archiviert, **kein produktives Modulsystem** |
| [#26](https://github.com/tobiasfranziskus/Check/pull/26) | Preisstaffel, Kosten, Schiffsersatz | Bauteil-Input 84 ISK bei 75 ISK Basiswert; pauschale Preiserhöhungen verschlechterten Versorgung und Teilkassen | Preisleiter dokumentiert, pauschale Erhöhungen abgelehnt |
| [#27](https://github.com/tobiasfranziskus/Check/pull/27) | Gewinnorientierte vs. bedarfspriorisierte Routen | 13 Seeds × neun Varianten × 90 Tage: Gesamtmangel 4.204→791 bei +100 % maximaler Priorisierung für **alle** tatsächlich konsumierten Güter | Ergebnis als unabhängige v12-Goldenwerte für [#30](https://github.com/tobiasfranziskus/Check/pull/30) gesichert |
| [#28](https://github.com/tobiasfranziskus/Check/pull/28) | Erster produktiver Routenpatch auf gestapelten Analysen | Erfolgreiche v12-Wirtschaftsprüfungen, aber unzulässige PR-Basen für Produktionsintegration | **Durch sauberen [#30](https://github.com/tobiasfranziskus/Check/pull/30) ersetzt**, nicht selbst mergen |

### Gemeinsame Erkenntnisse

**Keine zusätzlichen Ausgabenmechaniken als Ersatz für Ursachenanalyse.** Die v11-Welt stellt bereits mehr Nahrung her als sie regulär verbraucht; die Hauptlücke liegt in der Verteilung. Die reine Nahrungspreisanhebung 30→50 ISK senkte 4.204 auf 1.120 Mangelstunden, verzerrte aber die Rezeptmarge. Der effizientere vorhandene Hebel ist die Priorisierung **bereits profitabler** Handelsangebote nach realer Zielstationsknappheit, ohne neue ISK oder Waren.

**Geldfluss ≠ Warenfluss.** Einkommen aus Kopfgeldern entsteht neu; Sicherheitsbetriebskosten vernichten ISK; Handel, Gebühren, Fondsabgaben und Pilotengehälter sind Transfers zwischen tatsächlichen Eigentümern. Fracht-/Schiffszerstörung vernichtet ökonomische Güter, nicht automatisch ISK. Außenhandel bei Meridian und die Piratenschiffs-Ersatzlogik sind später getrennt zu bilanzieren. Langfristige Stations-/Konzernliquidität, Schiffskäufe und unterdeckte Kosten bleiben Qualitätsgates.

**Messung nicht mit Integration verwechseln.** Die Tests der Archive wurden in ihren jeweiligen GitHub-Actions-Läufen ausgeführt, belegen aber keinen Produktiv-Merge, keine iPad-Safari- oder NAS-Abnahme. Der bereinigte Produkt-PR #30 darf nur nach eigener CI und unabhängigen Hash-/Geld-/Warenaudits integrieren. Die historischen PR-Branches bleiben für Nachvollziehbarkeit erhalten und müssen nicht in `main` gemergt werden.

## Aktuelle Bereinigungsentscheidung

Die Projektleitung hat am 30.10.2026 die historische Repo- und PR-Bereinigung sowie die Integration freigabefähiger Arbeitspakete ausdrücklich beauftragt und bestätigt, dass **keine aktiven Spieler oder Spielstände** existieren. Ältere, inkompatible Regelstände dürfen ausdrücklich abgewiesen werden; stille Überschreibungen/Löschungen bleiben verboten. Kein daraus abgeleitetes NAS-/Safari-Deployment.

Der Abschluss der Bereinigung, die jeweilige Merge-/Closed-Historie und die nächste Priorität werden ausschließlich in [ROADMAP.md](ROADMAP.md) und [PROJEKTSTATUS.md](PROJEKTSTATUS.md) aktuell gehalten.
