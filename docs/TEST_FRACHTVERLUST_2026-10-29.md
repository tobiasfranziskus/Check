# Aphros Void – Testprotokoll Warenbilanz bei Schiffverlust

Stand: 2026-10-29  
Basis: `main/index.html` v0.11.0; ursprünglicher Git-Blob `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`  
Branch: `fix/frachtverlust-ledger`

## Problem und Ursache
`m_core_sicherheit.entfernen()` löschte zerstörte Schiffe einschließlich ihrer Ladung, ohne die verbleibenden Waren im `state.ledger[ware].consumed` und in `state.stats.vernichtet` zu erfassen. Dadurch meldete `m_core_audit.audit()` bei beladenen Jagdjägern eine Warenbilanzabweichung. `zerstoeren()` hatte für zivile Frachter/Miner bereits eine gesonderte Beute-/Vernichtungslogik.

## Implementierung
Unmittelbar vor dem Löschen eines Schiffs wird jede verbleibende `s.ladung[ware]` als vernichtet gebucht und aus der Ladung entfernt. `zerstoeren()` behandelt vor diesem allgemeinen Verlustpfad die Piratenbeute und leert die betroffenen Wareneinträge; daher kommt es im getesteten Pfad nicht zur Doppelbuchung. Sonstige Logik unverändert.

## Tatsächlich ausgeführte Prüfungen
- **Reproduktion und Reparatur:** Spieler-Jäger in Meridian, Seed 42, gekauftes Erz 1; Schiff stirbt bei Tick 420. Auf `main`: `goods.delta.erz = -1`; mit Fix: `goods.delta = {}`, `consumed.erz` und `stats.vernichtet` jeweils um genau 1 höher.
- **Mehrere Waren:** Spieler-Jäger mit 2 Erz und 2 Eis; vier Waren vernichtet; Audit korrekt.
- **Leerer Frachtraum:** keine unerwünschte Buchung; Audit korrekt.
- **Zivile Beute:** Frachter mit 5 Erz in Meridian via `zerstoeren()`; keine Doppelbuchung, Audit korrekt, die Ware konnte vollständig in den Piratenmarkt übernommen werden.
- **Regression:** Seeds 42, 1234 und 98765, jeweils 10.080 Ticks (7 Spieltage) reguläre Simulation. Vergleich Fix gegen unverändertes `main`: identische vollständige State-Hashes je Seed; `audit.ok === true` in allen Fix-Läufen.
- **JavaScript-Syntax:** gesamter Inline-Script-Block geparst.

## Auswirkungen und Risiken
- Ändert Warenledger und `stats.vernichtet` nur dann, wenn ein verlorenes Schiff tatsächlich noch Ladung führt.
- Vorher bereits fehlerhafte ältere Spielstände werden nicht automatisch rückwirkend repariert; das ist eine separate Entscheidung und erfordert ggf. eine kontrollierte Reparaturstrategie.
- Nicht alle Kombinationen von Schiffstypen, Beladung und Kampfergebnissen wurden erschöpfend geprüft.
- Keine Safari-iPad-End-to-End-Tests. Zielplattform weiterhin Safari auf iPad über NAS im WLAN.
- Keine Änderung des Speicherformats, der Regeln, des Seeds oder der Version; kein Migrationsbedarf allein für diesen Fix.

## Vorschlag zur Integration
Nach Review und einem kurzen Test mit exportiertem Spielstand auf dem iPad in `main` übernehmen. Vorher sollte der getrennte PR für Spielstandmigration (#2) unabhängig freigegeben und geprüft werden. Beide Änderungen verwenden verschiedene Funktionsbereiche und lassen sich separat begutachten.
