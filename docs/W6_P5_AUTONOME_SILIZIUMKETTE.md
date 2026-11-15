# W6/P5 – autonome, opt-in NPC3-Silizium-Disposition im Original-Core

**[DRAFT/ANALYSE · NICHT MAIN] · 15.11.2026.** Weiterführung des vollständig geprüften legalen P4-NPC-Eigentümer- und Silizium-Nachweises [#394](https://github.com/tobiasfranziskus/Check/pull/394) auf dem W6-Forschungszweig [#393](https://github.com/tobiasfranziskus/Check/pull/393)/[#389](https://github.com/tobiasfranziskus/Check/pull/389).

## Ausgangslage

P4: Ein **wirklich bezahlter** und in Nadir lokal für 600 ISK an NPC3 verkaufter K2-Miner `sh006` förderte 8 Silizium und verkaufte es legal an die echte Nadir-Stationskasse. Tick 2384, Hash `0c1adf336f1c7995`, 33.000 ISK, Mint/Burn 0, Spieler 3.000 ISK. P4-Gesamtprüfung: 334/334 Node22, 0 Fehler/Skips, Chromium/WebKit und andere ausgeführte CI-Jobs grün; bedingter Sicherheitsgeografie-Job nicht getestet. Die separate CPU-Beobachtung auf echtem S02-Tag-30-Startstand (34 historische Hüllen) meldete mit vollständiger kanonischer Gleichheit 52,152 ms für `minute()` und 204,208 ms für 60 Einzel-`teilschritt()` pro Minute bei je 360 Minuten/3 Wiederholungen. **3,916× ist kein isolierter Vergleich mit altem #389-Core, da `minute()` bereits eine Idle-Abkürzung hatte.** 180-/365-/730-Tage-Neubenchmarks stehen weiter aus.

## Geändertes Verhalten (nur nach ausdrücklichem Forschungs-Opt-in)

Der Nutzer der Forschungs-API muss `welt.npcSiliziumSetzen(state, true)` aufrufen und die bereits existierende `npcAuto`-Firmenpolitik aktiv haben. Ohne dieses neue Flag wird kein Silizium-NPC-Befehl ausgelöst, bleibt das zusätzliche Save-Feld vollständig **abwesend**, und alle bestehenden Referenzhashes/13×90-Szenarien müssen unverändert bleiben.

Der NPC-Disponent:
1. Prüft echte Nachfrage nach **einer** original finanzierten Jägerhülle, zählt bereits vorfinanzierte J3-Bauteilproduktion mit und vermeidet zusätzliche Lagerproduktion ohne Nachfrage.
2. Schützt die laufende Aldera-Eiswirtschaft vor der Investition in einen Siliziumminer, indem ein funktionsfähiger Aldera-Miner vorhanden sein und dessen Buchwert nicht sämtlich unter die bestehende Ersatzschwelle gefallen sein muss.
3. Beauftragt nur bei voller Finanzierbarkeit und freiem Werftslot einen originalen K2-Miner als `werft_extern`. Die eigene NPC3-Kasse muss Kaufpreis, Original-K2-Fracht, J2b-Lohn und die Flugreserve decken. Nadir muss den Siliziumankauf vorfinanzieren können.
4. Merkt genau **diesen** Forschungs-Werftauftrag in `kanon.npcSilizium.werftauftrag`, damit ein anderer, ebenfalls an NPC3 vorgemerkter Ersatzminer nicht unrechtmäßig im Nadir-Lager abgeholt wird. Ein legitimer originaler W5-Rücktransport wird nicht umgeleitet.
5. Kauft die fertige vorgemerkte Hülle ausschließlich durch das ursprüngliche `stationClaimMinerLocal` im Namen von NPC3 und nutzt anschließend allein die vorhandenen Kernbefehle `siliconMineStart`, `shipUndock`, `shipFlyTo`, `shipDock`, `siliconSell`.
6. Hinterlegt jeden angenommenen Originalbefehl im vorhandenen, jetzt erweiterten W6-Entscheidungsbuch. Fehlende Liquidität, Waren und Werftkapazität führen zu dokumentierten Pausen, **nicht** zu Kredit/Mint/Teleports.

`npcSiliziumSetzen(state, false)` ist möglich, sofern kein bereits vorfinanzierter Silizium-/K2-Auftrag noch ausgeführt werden muss. Die ganze Buchungs- und Flugarchitektur bleibt der unveränderte gemeinsame Regel204-Kern.

## Testvertrag

Neues `tests/w6-p5-autonome-siliziumkette.test.mjs`:
- frisch finanzierte echte Karriere, nur **einmal** P5 aktivieren; danach ohne manuelle Firmen-/Spieleraktionen bis zum durch NPC3 verkauften Silizium;
- alle acht originalen K2-/Flug-/Silizium-Entscheidungen, Eigentumsbeleg und 8 tatsächlich geförderte und verkaufte Einheiten;
- **33.000 ISK, Mint/Burn 0, house 3.000 ISK**, exaktes Save/Load und autonomes unabhängiges Replay zum selben Weltzustand;
- sichere Deaktivierung, keine neue Produktion nach Opt-out;
- ohne `npcAuto` keine verdeckte P5-Wirkung; fehlender Boolean, gefälschte Werftbindung und beliebige Extra-Felder müssen im Save/Audit scheitern.

**Status auf dem P5-Head bei Erstellung: Tests/CI noch nicht ausgeführt; Ergebnisse werden nach Abnahme ergänzt.** Regressionen inklusive aller 13×90-Wirtschaftsszenarien, Browser und Root/NAS separat prüfen.

## Abgrenzung

- Die endliche Original-Siliziumader enthält **nur 16 Einheiten** – höchstens zwei Jäger nach dem aktuellen Rezept, ohne neuerliche Ressourcen. Kein langfristiger unendlicher Jägerkreislauf.
- Neue NPC-Disposition und die W6-Werftreserve/Stilllegung sind **nicht produktiv freigegeben**. Keine Geldemission, keine neuen Kaufrechte, kein unfinanziertes Schiff oder Hilfe für insolvente Unternehmen.
- Keine neue Produkt-UI, keine Save-Migration oder neue Regelnummer, kein Merge/Pages/NAS. Die neue optionale Save-Struktur ist auf dem **separaten Forschungsbranch** bewusst noch nicht produktiv aktiviert.
- 13×90-Szenarien prüfen unverändert die bisherige Politik **ohne** P5-Opt-in. Ein eigener 90-/365-/730-Tage-Krisennachweis für aktiviertes P5 wird bei späterem produktivem Integrationsvorschlag zwingend nötig.
