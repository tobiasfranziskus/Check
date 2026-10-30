# Aphros Void – Versorgungspriorität als produktiver Kernvorschlag (v0.12.3 / Regel 12)

**Integrationshinweis, 30.10.2026:** Dieser Bericht wurde ursprünglich im gestapelten Analyse-Entwurf #28 angelegt. Die tatsächlich zur Integration vorgesehene bereinigte Umsetzung liegt in [PR #30](https://github.com/tobiasfranziskus/Check/pull/30) direkt auf dem integrierten v11-Core; **keine** vorherigen Pilot-, Modul-, Preis- oder Liquiditäts-Analysebranches werden dabei gemergt. Der unabhängig neu zusammengesetzte PR #30 hat in [GitHub Actions #41035813959](https://github.com/tobiasfranziskus/Check/actions/runs/41035813959) **48/48 Standardtests und 13/13 v12-Langläufe** mit identischen unabhängigen Referenzwerten bestanden. Die ursprünglichen #28-Messungen bleiben als Herkunftsnachweis bestehen; der Integrationsstatus ist anhand der tatsächlichen PR-Historie und `docs/PROJEKTSTATUS.md` zu lesen.


Stand: 30.10.2026. **Draft-PR [#28](https://github.com/tobiasfranziskus/Check/pull/28), nicht in `main` gemergt, nicht veröffentlicht.** Basierend auf [wirtschaftlicher Analyse #27](https://github.com/tobiasfranziskus/Check/pull/27). Schema **8** unverändert.

## Problem und ursprünglicher Nachweis

In der v11-Nadir-Welt sind von 4.204 Mangelstunden (13 Seeds × 90 Tage) 3.981 Nahrung. Handel ist zu sehr auf höchste unmittelbare absolute Gewinnspanne pro Minute ausgerichtet. Die unabhängige Voruntersuchung in PR #27 belegte, dass ein maximaler Bonus von 100 % auf die **Routenbewertung** aller tatsächlich konsumierten und am Ziel unter Sollbestand liegenden Waren die Engpässe auf 791 Stunden reduziert, ohne neues Geld, neue Waren oder erzwungene Verlustgeschäfte. Daher wurde **nur** die bereits vorhandene Route-Rangfolge in den Simulationskern aufgenommen.

## Produktionsänderung in `index.html`

- `meta aphros-version: v0.12.3` (nur dieser Entwicklungsbranch).
- `m_data_rules.RULES.rulesVersion: 11→12`. `schema: 8` unverändert.
- `world.versorgungsPrioritaet: 1000` als deklarative feste Gewichtung.
- `m_core_entscheidung.bestesPaar`: Die bereits ermittelte **echte positive Nettohandelsmarge** muss weiterhin größer null sein. Nur die Rangfolge zwischen zulässigen profitablen Angeboten wird geändert:
  - `knappheit = max(0, Stationszielbestand − tatsächlicher Lagerbestand)`
  - `bonus = floor(1000 × knappheit / Stationszielbestand)`, **nur** falls die Zielstation diese Ware ausdrücklich im regulären stündlichen Verbrauch hat
  - `wertung = gewinn × (1000 + bonus)` und Vergleich je bisheriger Reisezeit
  - Keine Änderung an Preisen, Gebühren, Frachtraum, Stationseigentum, Reserven, Kauf-/Verkaufstransaktionen, Schiffbau, Treibstofffreiheit, Zufallsfolge oder UI.
- `RULE_MIGRATIONS[11]`: 11→12 ändert **nur das Regelversionsfeld**, nicht Geld, Waren, Schiffe, Lager, Konzerne, Befehlswarteschlange oder RNG. Historisches v11-Routing bleibt für bitgenaue Referenztests über die explizite Versionsauswahl nachvollziehbar. Ein v11-Spielstand setzt unter dem neuen Regelwerk seine künftigen Handelsentscheidungen bewusst anders fort.
- Fehlende ältere Migrationen **8→9→10→11** bleiben der seit der v11-Geografieentwicklung bestehende, weiterhin explizit abgelehnte Kompatibilitätsbruch. PR #28 führt hierfür keine stillschweigende Übernahme oder Spielstand-Neuinitialisierung ein.

## Nachweise und Regressionen

[CI-Lauf #41028818004](https://github.com/tobiasfranziskus/Check/actions/runs/41028818004), Implementierungscode `02fc7c7`:

- **46/46 Standardtests bestanden**, inklusive neuem Test für verlustfreie Migration einer bereits fortgeschrittenen v11-Welt: vollständiger Zustand bis auf das Versionsfeld identisch, Save/Load identisch und identische deterministische Fortsetzung bei v12.
- **13/13 echte v12-90-Tage-Wirtschaftsläufe** erfolgreich, inklusive vollständiger stündlicher Geld-/Warenaudits, Save/Load je Seed und Hash-Kontrollpunkten nach Tagen 3/30/90.
- Der **neue v12-Kern** wird gegen eine unabhängig vor seiner Implementierung aus [CI #41026155660](https://github.com/tobiasfranziskus/Check/actions/runs/41026155660) konservierte [Fixture](../tests/fixtures/economy-priority-v12.json) geprüft. Die 13 Seed-Einzeldaten zu Mangel, NPC-Frachterverkäufen, Geldschöpfung/-vernichtung, Kassen, Schiffsverlusten und Kostenunterdeckung stimmen überein. Keine nachträgliche Referenz-Neuerzeugung zum Grünmachen.
- Der bereits existierende v11-Basistest hat weiterhin seine **historischen 13×90-Tage-Hashes** bestanden; das getrennte `tools/v11-core-source.mjs` setzt in den historischen **Testwerkzeugen** den v11-Regelzweig, ohne eine weitere Wirtschaft oder einen separaten produktiven Kern aufzubauen.
- Die übrigen v11-Analysen bleiben zusätzlich in eigenen CI-Jobs. Status je ausführbarem Job ist im CI-Lauf nachzusehen; ein historisch wegen seiner PR-Basisbedingung übersprungener Sicherheitsgeografie-Job zählt nicht als bestanden.

| Verifikation, Summe über 13 Seeds × 90 Tage | Vorher v11 | Vorschlag v12 |
| --- | ---: | ---: |
| Versorgungsmangelstunden gesamt | 4.204 | **791** |
| Davon Nahrung | 3.981 | **772** |
| Davon Bauteile | 204 | **18** |
| Davon Medikamente | 19 | **1** |
| NPC1 + NPC2 ungedeckte Kosten (ISK) | 23.731 | **16.090** |
| Stationsguthaben am Endtag (ISK) | 304.707 | 302.449 |
| Händlerguthaben am Endtag (ISK) | 146.463 | 148.930 |
| Zivile NPC-Schiffsverluste | 4.934 | 4.622 |
| NPC-Frachter-Verkaufsvorgänge | 298.743 | 310.058 |

## Risiken und Abnahme

1. **Deterministische Historie:** Nach der Regelmigration verändert sich der künftige Verlauf eines bestehenden v11-Spielstands bewusst. Der Zustand bei Ladebeginn bleibt unverändert; ein v11-Zukunftshash kann nicht als v12-Zukunftshash verlangt werden.
2. **Stabilität jenseits des Versuchs:** Die geprüften Welten laufen je 90 Spieltage und verwenden die 13 fixierten Seeds. Komplexe manuelle Spieleraktionen, 180/365 Tage und künftige Piloten-/Modulwirtschaft sind noch nicht gemeinsam geprüft.
3. **Kompatibilität zu `main`:** v11 ist noch ein Stapel ungemergter Entwicklungs-PRs; ein Merge von #28 allein nach `main` ist nicht zulässig. Die fehlende Migration von älteren Regelversionen ist ein Integrationshindernis des gesamten Stacks.
4. **iPad Safari / NAS:** Keine reale Browser-, Touch-, Speicherexport- oder NAS-Abnahme. Vor jedem Wechsel/Deployment aktuelle Spielstände als JSON exportieren und Sicherheitskopie behalten.

**Empfehlung:** Wirtschaftliche Kernänderung ist auf der v11-Entwicklungswelt nachvollziehbar und durch unabhängige v12-Referenzen getestet. **Keine Integration nach `main` ohne explizite Projektfreigabe und Klärung der historischen Save-Kompatibilität.** Weiterer Funktionsumfang (Pilotengehälter, Module, Reparaturen) ist nicht Gegenstand dieses PRs.
