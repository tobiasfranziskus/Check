# [DRAFT] W5d – zwei finanzierte Jaeger, echter Kampf, Verlust und Ersatzbedarf

**Basis:** [PR #176](https://github.com/tobiasfranziskus/Check/pull/176), isolierte Regel21. **Neue Forschungsregel22**, kein Eingriff in `main`, Rule14/Schema8, W1–W5c oder bestehende Save-Slots. **Nicht** der noch getrennte Codex-Frachter-Branch.

## Belegter physischer Kreislauf

In Regel22 sind höchstens **zwei** vollständige Bauteil- und Jaegerchargen erlaubt; die Ausgangswelt startet unverändert bei **33.000 ISK, 0 Jaegerhuellen**, nur bereits bekannte Mineral- und Minerbestände. Die zweiten Industrieprodukte entstehen ausschließlich über dieselben W3-/W4-/W5b-Module:

1. Ein `house`-Miner wird regulär in Aldera (600 ISK) und einer in Nadir (600 ISK) gekauft. Der Aldera-Miner verkauft Erz unter realen, vollständig vorfinanzierten W1-Verträgen und verdient das zusätzlich benötigte Betriebskapital; es gibt keine Zuschüsse.
2. Die Spedition kauft einen Frachter (750 ISK) und fährt **zweimal** je 50 echte Erz von Aldera nach Nadir, inklusive im Voraus bezahlter Hin- und Rückfahrt.
3. **Acht W4-Raffineriechargen** wandeln 80 Erz in **40 Material** um und bezahlen die Arbeitszeit. Der Silizium-Miner fördert **zweimal acht Einheiten**, jeweils mit vollständig bezahlter Arbeit und realer Nadir-Abnahme.
4. Zwei Bauteilchargen verbrauchen zusammen 32 Material und 16 Silizium; zwei anschließende Jägerchargen verbrauchen 16 Bauteile und weitere 8 Material. Die dokumentierte Produktionsarbeit umfasst **192 bezahlte Minuten**.
5. `npc3` bezahlt zweimal je 900 ISK für zwei verschiedene real vorhandene Schiffs-IDs. Die Piratenpartei bezahlt aus ihrer endlichen 900-ISK-Kasse weitere 900 ISK, um die **erste** dieser Hüllen zu erwerben. Die zweite verbleibt als Konzernjäger. Lager `jaeger=0`, physische verkaufte Hüllen `2`, `ledger.jaeger.produced=2`, `ledger.jaeger.consumed=2`, `minted=0`.

Die Industrie verlangt zusätzliche *echte* Geldmittel aus Bergbaugewinnen. Der bekannte Verkaufspreis von 900 ISK deckt die vollständigen Herstellungskosten nicht; dieser Schritt ist **kein Nachweis** für eine dauerhaft profitable Schiffswerft. Keine heimliche Verbilligung, kein zusätzlicher Haushaltslohn und keine geänderte Regel14-Preisformel.

## Kampf und Verluste

Der vorhandene deterministische `m_core_kampf.kampf` wird **nur in Forschungsregel22** mit zwei realen Jägern (NPC gegen Piraten) an Nadir genutzt. Erst nach Aktivierung von `shipHunt` mit vollständigem Stundenbudget an den Fonds können Begegnungen eintreten; Begegnungschance und Treffer-/Rückzugswerte stammen aus dem unveränderten Kampfkern. Jede zerstörte Hülle wird aus `state.ships` entfernt und als eindeutiger Verlustbeleg `w5d.verluste[{id,owner,tick}]` sowie im industriellen Beleg `w5b.zerstoerteIds` verzeichnet. Die bestehenden `stats.kaempfe` und `stats.verluste` werden im selben Core fortgeschrieben. Beide Seiten können verlieren.

**Keine Kopfgeldzahlungen** (`minted=0`, `stats.kopfgeld=0`), keine XP oder vermeintliche Piratenanomalie. `w5d.piratenErsatzbedarf` zeigt **nur** den tatsächlichen Verlust. Die Piratenkasse ist nach dem ersten Kauf leer; es ist **kein vollfinanzierter Ersatz verfügbar**, der Core spawnt deshalb nicht. In W5d sind zunächst höchstens zwei Produktionschargen erlaubt; für weiteren Nachschub braucht es neue Rohstoffe und einen **realen neuen Piraten-Einnahmeweg**, beides eigenständige nächste Schritte. Eine dauerhaft erneuerte Piratenanomalie ohne Überfälle ist mit der derzeitigen Finanzierung nicht machbar.

## Tests, Sicherheit und Grenzen

Neue Node-Regression `tests/w5d-zwei-jaeger-kampf.test.mjs` prüft zwei vollständig nachgewiesene Industriechargen, unabhängige Eigentümer-/Schiff-IDs, beschränkte Lagerware, die einmalige Piratenzahlung, den echten Kampf, eindeutig verbuchte Verlust-IDs, verweigerten Gratisersatz, manipulierte Verlustbuchungen, Save/Load und **13 × 90 Tage** mit täglichem Audit und deterministischem Replay. Diese Tests nur dann als Node-grün bezeichnen, wenn sie tatsächlich in CI/Node ausgeführt wurden.

**Zusätzlich direkt ausgeführt**: 13 Seeds × 90 Tage je mit genau zwei bezahlten Industriehüllen, echter bezahlter Jagdbereitschaft, täglichem `audit`, hashgleichem zweitem Core-Lauf und Save/Load. In **13/13** kam es zu einem belegten Piratenverlust, in einem Seed zusätzlich zu einem Konzernverlust. **0 bezahlte Ersatzhüllen, 0 neu geschöpfte ISK.** Seed42 Hash Tag90 `2fce717d7fd452e1`. Diese Ergebnisse sind *direkte Core-Tests*, keine erteilte Browser- oder Node-CI-Abnahme.

**Nicht ausgeführt/implementiert:** kein wiederkehrender finanziert hergestellter Piratenersatz, kein Kopfgeld, keine Piloten-/XP-Logik, keine Piratenbelts an Dravos/Meridian, keine Frachtueberfälle, keine Eskorten oder Plünderung. Das historisch unzulässige Regel14-Verhalten bei Piratenhüllen bleibt unverändert und darf nicht unbemerkt übernommen werden. Kein neuer Produkt-Browser-/Save-Slot, keine iPad-/NAS-Abnahme und kein Merge oder Deployment.
