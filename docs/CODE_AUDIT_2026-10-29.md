# Aphros Void – Architektur- und Qualitätsaudit (v0.11.0)

Datum: **2026-10-29**  
Basis: `main/index.html`, Git-Blob-SHA `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`  
Status: **Quellcodeprüfung + gezielte JavaScript-Kerntests; noch keine Codeänderungen oder iPad-Safari-Tests**

## Gesamtbewertung

Die etwa 197 KB große Single-HTML-Datei mit 3.746 Zeilen ist intern **vergleichsweise sauber in 53 gekapselte IIFE-Module** gegliedert (`m_data_*`, `m_core_*`, `m_ui_*`). Die zentralen Designentscheidungen sind sinnvoll: keine externen Runtime-Abhängigkeiten, feste Schrittfolge, expliziter Seed-RNG, sortierte Schlüssel bei wichtigen Simulationsschleifen, gekapselte Commands, separater Core-Index, Versions-/Migrationsmechanismen und Geld-/Waren-Audit.

**Nicht als fehlerfrei bewerten:** Die folgenden zwei Probleme sind reproduziert und haben Vorrang vor dem Jagdbalancing.

## Bestätigte Fehler / zu prüfende Vertragsverletzungen

### P0 – UI blockiert vorhandene Regelmigrationen

- **Stellen:** `m_core_serialize.load` Zeilen 1785–1799; `m_ui_speicher_huelle.auspacken` 2649–2668; `m_ui_main.einlesen` 3574–3599.
- **Reproduktion:** Regulären v0.11.0-Spielstand erzeugen, ausschließlich `rulesVersion` im Testzustand auf **6** stellen, serialisieren und in eine gültige Speicherhülle legen; `auspacken(..., 7)` ergibt **`regel-alt`**. Der UI-Pfad bietet nur die Sicherung mit Neubeginn. Dagegen lädt `m_core_index.load` denselben Zustand erfolgreich mit Regelmigration **6→7**.
- **Problematik:** Die Anwendung verwirft die im Kern explizit unterstützte Kompatibilität. Bei einer weiteren Regelversionsanhebung für v0.11.1 wäre dieses Verhalten für Bestandsstände besonders kritisch.
- **Vorschlag:** Bei `regel-alt` einen **validierten** Migrationspfad über die Core-Load-Funktion anbieten, ursprüngliche Sicherung unverändert aufbewahren, nach erfolgreichem Laden Audit/Schema- und Referenzprüfungen ausführen und erst danach neu speichern. Unsupported versions weiter bewusst blockieren.
- **Risiko:** Das automatische Laden aller historisch älteren Stände wäre ohne zusätzliche Regressionstests zu aggressiv. Zunächst nur ausdrücklich unterstützte Migrationen aktivieren.

### P1 – Frachtverlust eines zerstörten Jägers fehlt in der Warenbuchhaltung

- **Stelle:** `m_core_sicherheit.entfernen`, Zeilen 1407–1415; Vergleich `zerstoeren`, Zeilen 1417–1433.
- **Reproduktion:** Erzeuge Spielerjäger in Meridian, kaufe per tatsächlichem `m_core_handel.handel` 1 Erz, prüfe `m_core_audit.audit(state).goods.ok === true`. Simuliere mit Seed **42** einen Jagdauftrag: Schiff stirbt bei Tick **420**; anschließend `audit.goods.delta.erz === -1`.
- **Problematik:** Das Schiff verschwindet samt Fracht, aber `ledger.erz.consumed` bleibt unverändert.
- **Vorschlag:** Verlorene Ladung auf dem allgemeinen Schiff-Entfernungspfad **genau einmal** als Warenvernichtung buchen; bestehende Sonderbehandlung in `zerstoeren` gegen Doppelbuchung prüfen.
- **Risiko:** Falsche Positionierung würde beim Zivilverlust Waren doppelt vernichten; gezielte Tests für Pirat/Jäger/Zivilist und Ladung 0, 1, >1 erforderlich.

### P1/P2 – Formal unvollständiger Spielstand wird angenommen und kann UI-Ausnahme verursachen

- **Stellen:** `m_core_serialize.load`, Zeilen 1785–1800 (prüft Pflichtfelder, nicht deren referenzielle Konsistenz); `m_ui_zusammenfassung.kennzahlen`, Zeilen 1954–1964.
- **Reproduktion:** Gültigen Zustand erzeugen, `owners.house` löschen, anschließend `load(save(state))` ausführen: **Load akzeptiert** den Zustand. Der folgende Aufruf von `kennzahlen` wirft **`Cannot read properties of undefined (reading 'cash')`**.
- **Vorschlag:** Minimale Struktur-/Referenzprüfung (Spieler-Owner, Stations-/System-IDs, Cash/Zählertypen, Schiffsreferenzen) **nach** Migration und **vor** UI-Übernahme; defekte Stände mit verständlicher Meldung und Rohtext-Export ablehnen.
- **Risiko:** Zu strenge Validierung kann historische legitime Speicherstände aussperren. Prüfkatalog und Migrations-Tests gemeinsam erarbeiten.

### P2 – Angezeigter Kaufpreis ohne tatsächlich fällige Gebühr

- **Stellen:** `m_ui_markt_ansicht` Zeilen 2798–2806 und `m_ui_flotte_ansicht` 3113–3118; Preis-/Gebührenpfad `m_core_handel.handel` 960–992.
- **Reproduktion:** Startzustand, Aldera: `jaeger` Basis-/Stationspreis **900 ISK**, Gebühr **36 ISK**, tatsächliche Belastung **936 ISK**. Die Schaltfläche zeigt den Grundpreis 900 ISK.
- **Vorschlag:** Entweder `Preis zzgl. Gebühr` klar kennzeichnen oder den Gesamtpreis aus derselben Core-Gebührenfunktion anzeigen. Rabatt durch `dock`-Module berücksichtigen.
- **Risiko:** Nur UI, geringe technische Eingriffstiefe.

## Architektur- und Optimierungsrisiken (noch keine bestätigten Nutzerfehler)

### P2 – Routenalgorithmus skaliert bei hoher Vernetzung schlecht

- **Stelle:** `m_core_route.berechnen`, Zeilen 1085–1111.
- Der Algorithmus enumeriert **alle einfachen Wege** mit rekursiver Tiefensuche, bevor er die kürzeste Route wählt. Das ist bei stark verbundenen Graphen kombinatorisch.
- **Tatsächlich ausgeführter synthetischer Performancevergleich** in einer JavaScript-Laufzeit: vollständige Graphen mit 6/7/8/9 Knoten benötigten ungefähr **5/22/171/1780 ms** für den ersten Routing-Aufruf. Diese Werte sind **keine Safari-Benchmarks**, sondern demonstrieren die Wachstumsform. Bei den aktuellen wenigen Systemen besteht kein nachgewiesenes iPad-Problem.
- **Vorschlag:** Vor Erweiterung auf viele stark vernetzte Sektoren deterministischen Dijkstra-Algorithmus mit gleichem Lexikografie-Tie-Breaking und bestehendem Cache verwenden; Ausgabegleichheit zum Original auf allen heutigen Systempaaren testen.
- **Risiko:** Abweichende Routen würden NPC-Timing und Reproduzierbarkeit beeinflussen, daher separat testen.

### P2 – IndexedDB-Verbindung wird pro Lese-/Schreibvorgang geöffnet

- **Stelle:** `m_ui_speicher.db`, Zeilen 2594–2614.
- Nach `indexedDB.open` sind in den aufrufenden Operationen keine `d.close()`-Aufrufe sichtbar. Die beobachtbare Folge ist wiederholtes Öffnen ohne explizites Schließen; tatsächliche Ressourcenauswirkung auf iPad Safari **nicht gemessen**.
- **Vorschlag:** Ein wiederverwendbares Connection-Promise mit `versionchange`-/Fehlerbehandlung **oder** explizites Schließen nach abgeschlossenen Transaktionen. Die einfachste robuste Variante erst nach Browserprüfung wählen.
- **Risiko:** Lifecycle-Änderungen können Speichern/Import beeinträchtigen: separat und mit Backup testen.

### P2 – Überlappende Speicheranfragen können verworfen werden

- **Stelle:** `m_ui_main.speichern` Zeilen 3529–3546.
- Ist `speicherLaeuft` wahr, gibt der Aufruf **sofort `false`** zurück. Ein danach veränderter Zustand erhält damit keine garantiert nachlaufende Speicherung. Vor allem bei iPad-Backgrounding ist dies ein **begründetes Persistenzrisiko**, noch kein reproduzierter Datenverlust.
- **Vorschlag:** Bei laufender Transaktion den Wunsch auf eine weitere Speicherung vermerken und nach Abschluss coalesced ausführen; Import/Neustart/Seitenwechsel mit speziellen Zuständen berücksichtigen.
- **Risiko:** Autosave nicht mit unendlichen Schreibschleifen überlasten; Safari-Lifecycle testen.

### P3 – UI-Rendering vereinfacht halten, nicht ungeprüft modernisieren

- HTML aus Templates wird in mehreren Ansichten über `innerHTML` eingesetzt, meist mit `esc()` für veränderliche Texte. Aktuell **keine bestätigte HTML-Injection**; dennoch beim Hinzufügen von Spielstand-/Benutzereingaben jeden dynamischen Pfad prüfen.
- Kartenansicht verwendet SVG mit Pointer Events, Kartenpositionen werden aktualisiert statt pauschal neu erzeugt, sowie `touch-action: none` und `safe-area-inset` im CSS. Das ist für iPad ein **solider Ausgangspunkt**, aber **kein ausgeführter Safari-Test**.
- `m_ui_main` (Zeilen 3252–3743) ist der größte Orchestrator und verwaltet mehrere Zustandsvariablen. Keine Aufteilung nur aus Stilgründen; Funktionsschnittstellen und Verantwortlichkeit bei neuen Features beibehalten.
- Für den Ein-Datei-Betrieb ist die interne IIFE-Gliederung akzeptabel. Ein Framework, Build-Prozess oder eine flächige Modularisierung würde hier derzeit mehr Integrationsrisiko als Nutzen erzeugen.

## Ausgeführte positive Kontrolltests

- Determinismus: Zwei vollständige Spielzustände mit Seed **42** lieferten nach **4.320 Ticks** exakt denselben Core-Hash.
- Serialisierung: `hash(load(save(state))) === hash(state)` für frischen Zustand.
- 30-Tage-Audits: Je Seeds **42, 1234, 98765** und Varianten **passiv**, **Erz-Miner aktiv**, **Auto-Handelsfrachter aktiv**, also **9 vollständige 43.200-Tick-Läufe**: `audit.isk.ok` und `audit.goods.ok` waren jedes Mal `true`.
- Diese Stichproben decken **nicht** alle Interaktionen, Speicherstände und iPad-Ereignisse ab; insbesondere widerlegt der gezielte Jagd-Fracht-Test eine allgemeine Fehlerfreiheit.

## Ergänzung Jagdbalancing: reale Startökonomie

Zusätzlich zum [Jagd-Audit](JAGD_AUDIT_2026-10-29.md) wurde ein Jäger **über echte Spielerbefehle** aus der Startkasse von 2.000 ISK beschafft: `shipTrade` (Jäger für **936 ISK inkl. Gebühr**), `shipActivate`, `shipMove` Aldera→Dravos (Treibstoff **32 ISK**) und `shipHunt` nach Ankunft bei **Tick 24**. Ausgangskasse vor Beginn der Jagd: **1.032 ISK**. Seeds wie oben, 30 Tage.

| Faktor | Seed 42 – Kasse/Netto | Seed 1234 – Kasse/Netto | Seed 98765 – Kasse/Netto | Jagdstopp |
|---|---|---|---|---|
| 2 | 7.405 / +5.405 | 0 / −2.000 | 0 / −2.000 | Bei zwei Seeds wegen Geldmangel (Tick 4560 und 7080) |
| 3 | 25.165 / +23.165 | 22.805 / +20.805 | 28.525 / +26.525 | Bei keinem der drei Seeds |
| 4 | 42.925 / +40.925 | 40.445 / +38.445 | 48.805 / +46.805 | Bei keinem der drei Seeds |

Netto = Endkasse minus Startkasse, **inklusive Jägerkauf und Treibstoff**; andere Spielerschiffe blieben ohne eigene Aufträge. Alle neun Läufe bestanden Geld- und Warenaudit. Unter Faktor 2 ist die Jagd **bei knapper Startliquidität** deutlich anfälliger als bei künstlich erhöhter Kasse. Drei Seeds sind ein Orientierungswert, **keine** stabile Überlebens- oder Ausfallwahrscheinlichkeit.

## Priorisierte Änderungspakete

1. **PR A: Spielstandschutz** – akzeptierte Regelmigrationen über UI ermöglichen; vor Übernahme minimal strukturell validieren, Altstand sichern. Dies **vor** v0.11.1-Balancing.
2. **PR B: Warenbilanz** – Frachtvernichtung bei Schiffverlust buchen, Testfälle für doppelte und fehlende Buchung.
3. **PR C: Jagdbalancing** – nach PR A Faktor **3** bei weiterhin 50 Jägerkosten, Regelversion/Migration und Regressionstests.
4. **PR D: Preispräzision** – tatsächlich berechneten Kaufgesamtpreis inklusive Gebühren anzeigen.
5. **Später:** Persistenz-Lifecycle und Routenperformance jeweils als eigenständige, gemessene Verbesserungen angehen.

Alle Implementierungs-PRs benötigen separate Freigabe. **Dieses Audit ändert den Spielcode nicht.**
