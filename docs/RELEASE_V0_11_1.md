# Aphros Void v0.11.1 – Jagd und Warenbilanz

**Stand:** 2026-10-29  
**Basis:** `main/index.html` v0.11.0, Blob `7ff91a2611c01d7a1d8cddaccee1010c529ca22a`  
**Status:** Entwicklungs-PR, noch nicht veröffentlicht.

## Anlass und Entscheidungen

Die gesamte Spielinstallation ist eine **Testversion**. Der Nutzer hat bestätigt, dass vorhandene Spielstände irrelevant sind und keine getrennte Testumgebung benötigt wird. Daher wird die aufwendige Migrationserweiterung aus PR #2 **nicht** übernommen. Bestehende Speicherlogik bleibt hier ansonsten unberührt.

## Änderungen

1. **Jagdprämie**: `economy.kopfgeldFaktor` von 2 auf **3**; übrige Kopfgelder und Jägerbetriebskosten unverändert. Die höhere Prämie gilt nur auf dem bereits existierenden Spieler-Kopfgeldpfad. Keine direkte Änderung von Kampfraten.
2. **Warenbilanz**: `m_core_sicherheit.entfernen()` bucht verbliebene Schiffsladung als `ledger[ware].consumed` und `stats.vernichtet`, bevor das Schiff gelöscht wird. Zuvor von `zerstoeren()` verkaufte oder vernichtete Beute ist bereits aus der Schiffsladung entfernt.
3. **Versionsanzeige**: Metatag auf `v0.11.1`. Keine Änderung von `schema: 8` und `rulesVersion: 7`, da kein neues Speicherformat eingeführt wird und es nach Projektentscheidung keine zu erhaltenden Spielstände gibt.

## Ausgeführte Prüfungen

- Vollständiges Inline-JavaScript syntaktisch erfolgreich geparst.
- Beladener Spielerjäger in Meridian, Seed 42, Verlust bei Tick 420: Waren- und Geldaudit korrekt.
- Zivilfrachter mit fünf Erz-Einheiten: Piratenbeute korrekt verbucht, keine Doppelbuchung.
- Ohne zusätzlichen Spielerjäger: drei Seeds mit jeweils 4.320 Ticks Erzabbau ergaben **identische Zustands-Hashes** gegenüber unverändertem `main`.
- Save/Load-Roundtrip für einen neuen Zustand: identischer Hash.
- Ausreichend finanzierter Zusatzjäger in Dravos: drei 30-Tage-Läufe (Seeds 42, 1234, 98765) ergaben Betriebsergebnisse **+16.050**, **+21.630**, **+19.950 ISK**; bei allen die Bilanz korrekt.
- **Reale Startökonomie**: Jäger für 936 ISK inkl. Gebühren gekauft, aktiviert und für 32 ISK von Aldera nach Dravos geschickt; anschließend Jagdauftrag. Start mit 2.000 ISK, keine weiteren Spieleraufträge. Nach 30 Tagen Endkassen **25.165**, **22.805**, **28.525 ISK** in denselben Seeds. Kein Jagdabbruch, Jäger überlebt, Geld-/Warenaudit korrekt.

## Grenzen

Dies sind tatsächlich ausgeführte **isolierte JavaScript-Simulationen**, keine Safari-iPad-Browser- oder UI-End-to-End-Tests. Drei Seeds sind eine kleine Stichprobe und keine Aussage über allgemeine Erfolgswahrscheinlichkeit oder optimales Balancing. Bei Wechsel von einer älteren Version kann bereits vorhandenes IndexedDB-Material ggf. geladen werden, weil `rulesVersion` nicht verändert wird; für diese Testinstallation sind Altstände laut Nutzervorgabe jedoch irrelevant.

## Empfehlung zur Freigabe

Nach Prüfung des Pull Requests darf der Nutzer **ausdrücklich die Übernahme nach `main`** freigeben. Danach öffentliche Seite `https://tobiasfranziskus.github.io/Check/` im iPad Safari neu laden, v0.11.1 prüfen und Jagd/Fracht/Bedienung stichprobenartig testen. Kein automatischer Merge ohne Zustimmung.

## Offenes

- PR #2 (komplexe Migration) ist unter den neuen Projektvorgaben unnötig; als nicht zu integrieren behandeln.
- PR #3 enthält die Frachtkorrektur einzeln, die jetzt auch hier enthalten ist; nicht **beide** unabhängig zusammenführen.
- Preisangabe inklusive Gebühren ist weiterhin eine separate UI-Verbesserung.
