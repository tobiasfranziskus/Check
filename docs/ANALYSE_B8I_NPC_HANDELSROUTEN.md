# B8i – Tatsächliche NPC-Handelsrouten, Frachterkosten und liquide Abnehmer

**[ANALYSE/DRAFT] 31.10.2026.** `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8. Einzige verbindliche Planung: [ROADMAP.md auf main](https://github.com/tobiasfranziskus/Check/blob/main/docs/ROADMAP.md). **Keine neue Wirtschaftsregel, kein geändertes `index.html`.**

## Anlass / Kausalfrage

[B8h Draft #68](https://github.com/tobiasfranziskus/Check/pull/68) belegte **+22 ISK je tatsächlich vollständig abgeschlossener Material-Handelsrunde Veldra↔Cyris**, aber keine dauerhafte Abnehmerliquidität ohne zwei zusätzliche, **aus bereits vorhandener Meridian-Kasse** gedeckte Realrechnungen. Daraus ist nicht abzuleiten, dass andere gehandelte Güter und Routen dieselben Margen haben. B8i betrachtet deshalb **keine** geskriptete NPC3-Hilfslieferung, sondern die tatsächlich im **unveränderten Core autonom** zustande kommenden Geschäfte der NPC1-/NPC2-Frachter, mit den echten Corekosten und dem **wirklich vorhandenen** Käufergeld an den jeweiligen Ankunftsterminen.

## Reproduzierbarer Versuchsaufbau

Vier Original-Core-Welten für Seed **42** und **7**, je aktive historische B1-7-Befehle-Spielerkrise und passive Welt, jeweils **90 reale Spieltage**, zweimal unabhängig deterministisch ausgeführt. Unveränderten Core über SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9` fixieren, historischen Seed42-90d-Spielerhash `784047684dfe5c56` und passiven Hash `adf155a018b94094` unabhängig kontrollieren. Node-only-Observation fügt Beobachter an vier Originalkern-Operationen an, ohne selbst Verkäufe, Flugrouten, Hüllen, Angebote oder Kassen zu verändern:

1. `m_core_handel.handel`: jeden **tatsächlich ausgeführten**, bezahlten Kauf/Verkauf von NPC1/2-Frachtern mit Warenmenge, Stations-ID, Preis und Gebühren protokollieren und dem originalen Einkaufslos zuordnen; unverkaufte Ladungen bleiben offen. Kein Versuch, aus einer bloßen Routenprognose einen bereits bezahlten Abschluss abzuleiten.
2. `m_core_ankunft.reise` / `m_core_stunde.betriebskosten`: wirkliche Flug-Arbeitsminuten und stündlich fällige/**tatsächlich bezahlte** Beträge aus den Originalabrechnungen erfassen; die ganzzahligen Stundenkosten allein im Beobachter proportional auf **beladene** und **leere** Flugminuten verteilen. Beladene Kosten werden auf die tatsächlich mitgeführten ursprünglichen Waren-Einkaufslose verteilt. Kosten der *leeren* Positionierungen bleiben **als eigenständiger Flottenkostenblock** stehen; sie dürfen nicht still als profitfreier Null-Aufwand behandelt werden.
3. `m_core_ankunft.ankunft`: vor realem `entladen` vorhandene Fracht, Zielstations-Kasse, tatsächlichen Core-Preis und freien Lagerraum beobachten und **danach** die vom Original-`handel` wirklich abgesetzten Mengen zählen. Ungedeckte Ankunft nach **Käufergeld** und **Lagermangel** gesondert führen; gemischte Fälle separat ausweisen. Die Zuordnung bezieht sich auf die **Original-Ankunft**, nicht jeden später im Dock wiederholten Handelsversuch.
4. Unabhängig und **stündlich** Geld- und Warenerhaltung vollständig nachrechnen, Originallader `audit` separat prüfen, Replay-Hashes auf Gleichheit kontrollieren, Save/Load per originalem `save/load` stichprobenartig wiederholen. Alle Testausgaben als CI-Artefakte sichern.

**Grenzen der Gewinnkennzahl:** Das berechnete `netLoaded` ist der **realisierte Netto-Verkaufserlös abzüglich tatsächlichem Einkauf, Original-Handelsgebühren und dem auf genau diese transportierte Ladung entfallenden beladenen Flug**. Es ist **kein vollständiger Unternehmensgewinn**, kein Rundfahrtprofit: Leere Positionierungs-/Rückflüge, Anschaffung/Abschreibung, unverkaufte oder verlorene Fracht, Personalkosten und Risikokosten fehlen in diesem Teilindikator ausdrücklich und werden, soweit tatsächlich angefallen, separat gezeigt. Teilverkäufe oder mehrfache Ziele werden nicht als eindeutige abgeschlossene Einzelfahrt ausgegeben.

**Grenzen der Engpassdiagnose:** Käufer-Cash am Ankunftsort ist nur eine **tatsächliche Momentaufnahme**; wenn `cash / preis` zu klein ist, kann eine später eintreffende Zahlung andere Verkäufe ermöglichen. Nur `kasse < preis` bei zugleich freiem Lager und 0 Stück Verkauf ist eine eindeutige **vollständige Käufergeldblockade** an genau diesem Zeitpunkt. Andere Fälle bleiben getrennt; eine einzelne Ankunft erklärt noch keinen ganzen 365-Tage-Kollaps.

## [TEST] Tatsächlich durchgeführte Ergebnisse

Ergebnisse und Schlussfolgerungen erst nach erfolgreichem abschließendem CI-Prüfjob eingetragen; ursprüngliche Testaktivität ist kein Freigabebeleg.

## [OPTION] Folgerungen und Gates

Bei positiver tatsächlicher Zwischenstations-Marge **und** beobachteten Nullverkäufen trotz freiem Lager wäre die Abnehmerliquidität ein gesondertes Kausalhindernis, kein Beleg für zu niedrige Händler-Spreads. Bei systematisch negativem beladenen Beitrag oder hohen realen Leerflugkosten würde die bestehende Routenwahl das Kernproblem mitverursachen. Vor irgendeiner Preiskorrektur oder Geldemission müssen diese Ursachen quantifiziert und getrennt werden. **Keine** individuelle Konkursrettung, keine Spielersteuer, kein Kredit-/Pacht-/Pilotengehalt, kein neuer Geldschöpfungsmechanismus in B8i.

Weder 13 Seeds ×90 Tage noch vier 365-Tage-Spielerkrisen, konkrete unabhängige Lieferverträge, echte iPad-/NAS-Abnahme, globaler Herkunftsnachweis oder Merge/Deployment sind durch diesen kleinen Analyseversuch abgegolten.
