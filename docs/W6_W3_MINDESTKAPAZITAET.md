# W6 – W3-Mindestkapazität [FORSCHUNG]

25.11.2026. Separater Gegenversuch auf #625 (bf11fcbc), parallel zur unveränderten Diagnose #637. Main d80618b0 bleibt unberührt. Keine PIR-Abhängigkeit. Wiederverwendung: Original-Restaktivminuten und Originalroute; ergänzend früherer Kopienversuch #579, dessen Prognose nicht Teil des laufenden Spiels ist.

## Änderung

Nur im ausdrücklich getrennten U7/U8-Forschungsprofil und bei aktivierter Stilllegung: 50 reine Förderminuten (aus Charge/Förderrate) und 120 W3-Rundflugminuten (aus Originalroute) als notwendige Mindestkapazität. Ungeeignete Miner/Frachter bei automatischer Auswahl überspringen; Angebote und Commit vor Kapitalbindung nochmals prüfen. Bei deaktivierter Stilllegung keine neue Sperre. Keine neuen Savefelder, Tarife, Waren, Budgets oder Freigaben. Bestehende aktive Verträge werden nicht verändert.

Das Miner-Kriterium ist **nicht hinreichend**: reale An-/Rückflugzeit und sonstige Aktivminuten fehlen; erst #637 liefert Messwerte. Kein universeller Schutz vor Stilllegung und keine garantierte Stabilität. Die Forschungsvariante darf gegenüber #625 andere Hashes erzeugen; unveränderte Standard- und Regel207-Referenzen bleiben zwingend. Alte U7/U8-Forschungssaves bleiben ausdrücklich nur Forschungsdaten, keine stillschweigende Produktmigration.

## Prüfungen

Erweiterung des bestehenden realen Haus-/NPC-Fracht-Tests: bewusst künstliche Verschleiß-Grenzfixtures ausschließlich in Wegwerfkopien; Angebot und Commit bei Mindestbedarf minus einer Minute atomar ablehnen. Originaltest läuft unverändert weiter. Keine behaupteten realen Verschleißmesswerte aus den Fixtures.

Neue CI offen; lokale Node22-Ausführung scheitert am fehlenden Repository-Checkout (DNS). Nach der Diagnose #637 den vollständigen Flugbedarf ermitteln, anschließend gepaarte Standard/K7/S02-7/30/90-Tage-Läufe mit Originalbefehlen durchführen. Erst bei belastbarem Fortschritt 365/730. Teilware und bereits gebundene Mittel separat behandeln. Kein Merge oder Deploy.
