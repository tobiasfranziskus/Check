# W6 – eigenständig prüfbare Integrationsgrenze gegen main

**15.11.2026 · [INTEGRATION IN ABNAHME / NICHT ALS W6-FERTIGSTELLUNG WERTEN]**

Basis: tatsächliches `main 52d0fe6053b2846284e356e574f158f9c4eaf2fc` (J13a). Quelle: aus geprüftem [P6 #397](https://github.com/tobiasfranziskus/Check/pull/397) nur die unverändert übernommenen Kern- und Testdateien, keine historischen Berichte, veraltete Projektstände oder Research-Workflow-Dateien. J13b [#395](https://github.com/tobiasfranziskus/Check/pull/395) bleibt ein separater UI-Schritt.

## Freigabe und technisch begrenzter Integrationsumfang

Der Nutzer hat am 15.11.2026 die nötigen Wirtschafts- und Integrationsfreigaben erteilt. Die Implementierung bleibt trotzdem zunächst **explizit opt-in**. `npcAutoSetzen(s,true)`, `npcSiliziumSetzen(s,true)` sowie `politikSetzen(s,{stilllegung:true,betriebsreserve:{werft_extern:1060}})` müssen auf einer validierten Regel204-Sitzung bewusst aufgerufen werden. Bisherige Karriere-Starts und alle historischen Spielstände erhalten **keine** stillschweigende Automatikaktivierung, kein neues Startgut und keine Migration. Die spielbare UI-Anbindung wird separat gegen den dann aktuellen J13b-Hauptstand abgenommen; der bloße Kern-Import ist noch kein veröffentlichter autonomer Jäger-Karriereweg.

Nur:
- `prototypes/welt/welt-kern.js`: autoritative NPC-Entscheidungen über vorhandene Originalbefehle inklusive K7/Eis-/Wasser-/Werft-/J3-/J4-Ketten sowie explizite P5-Siliziumoption, finanzielles und Eigentums-Audit;
- `prototypes/flug2d/flug-kern.js`: stabile aktive Schiffsliste pro Wirtschaftsminute, unveränderte Reihenfolge und identische Einzel-`teilschritt()`-Funktion;
- `tools/w6-szenarien.cjs` und sechs W6-Kern-/Testdateien sowie dieser Status. Kein P1-UI-Änderungsrecht und keine alte Save-Löschung.

## Nachweise und Grenzen

Die autoritativen bisherigen **Forschungsläufe** belegen:
- S02: 730 Tage reproduzierbare Eis-/Wasser-/Ersatzkette, 757 bezahlte Ersatzkäufe bei 33.000 ISK und Mint/Burn 0; langsamere CPU bei großer historischer Hüllenzahl.
- P4: NPC3 kauft einen vorhandenen K2-Miner für 600 ISK, fördert 8 echtes Silizium und verkauft mit Original-Konten.
- P5/P6: Mit aktivierter Forschung mindestens ein vollständig finanzierter J4-Jäger nach 8,5 Tagen, realer `house`-Kauf für 900 ISK. Nach 90 Tagen zwei gebaute Jäger, alle 16 endlichen Siliziumeinheiten verbraucht und 93 bezahlte Ersatzkäufe; Tag45-Save/Load kanonisch gleich.
- **Nicht erwiesen:** allgemeine Nachhaltigkeit über alle 13 Krisenregime, neue Siliziumlagerstätten, endloser Jägerbau, NPC-Konkurrenz, echte iPad-Safari- oder NAS-Geräteabnahme.

**Kein** neuer Mint-, Kredit-, Kauf-, Preis-, Rezept- oder Rettungsmechanismus. Negative Krisenszenarien bleiben negative Ergebnisse.

## Merge-/Release-Gate

Eigener Integrations-PR gegen aktuellen `main`, vorheriges `main` separat sichern; Node22-Vollsuite mit Wirtschaftsszenarien, Manipulations-, Buchungs-, Hash- und Save-Prüfungen; Chromium/WebKit je vier Touchgrößen, Root/NAS-Build-Checks, aktuelle J13a/J13b-Kompatibilität und separate Pages-Verifikation. Ein grüner Forschungs-PR allein ist **kein** Integrationsnachweis. Keine automatische Freischaltung ohne darüber hinaus geprüfte, für den Spieler sichtbare Karriereanbindung.

**Abnahme dieses Integrations-PRs bei Anlage noch ausstehend.** Bei Scheitern keine Änderung an `main` oder Pages. Alter Originalstand ist durch `main` und vorhandene Backupreferenzen weiterhin nachvollziehbar.
