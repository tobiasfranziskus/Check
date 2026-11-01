# B8o – Gemeinsame Auftragsfinanzierung für Miner, Frachter und Jäger

**Status [ANALYSE/DRAFT] 01.11.2026.** Basis `main 0d473e6`, Produkt v0.12.5/Regel14/Schema8; Codeprobe verifiziert den unveränderten Originalkern-SHA256 `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`. **Kein Produktcode, keine Änderung am Geld- oder Save-/Regelschema.** Der Test `tools/analyse-b8o-escrow-invarianten.mjs` ist ein **separates synthetisches Vertragsbuch**, noch kein integrierter Simulations- oder Gameplay-Test.

## Problem und bevorzugte Lösung

B8m konnte bereits in zwei Krisenseeds vor dem Abflug vorhandene Mittel für eine ganze Reise und eine Minerreserve überprüfen. Der Check **reserviert** Geld jedoch nicht. Mehrere Minen-/Handels-/Sicherheitsaufträge greifen auf die identische Konzernkasse zu; nach dem Abflug könnten sie die fraglichen ISK für eine andere Leistung ausgeben.

**[OPTION, noch nicht freigegebene Produktarchitektur]** Allgemeines `Auftragsbudget` mit **eindeutigem Vertrags-ID**, Eigentümer-/Schiff-ID, Klasse, tatsächlich vorher aus freier Konzernkasse gesperrtem ISK-Betrag, Saldo, bezahlt, erstattet, Fälligkeiten und Status. Keine gesonderte Spieler- oder NPC-Wirtschaft, keine kostenlosen Hüllen oder Lohnleistungen.

- **Reservieren:** `freiesCash -= budget`, `gebundenesCash[vertrag] += budget`. Wenn nicht vollständig deckbar, Auftrag *vor Arbeit* ablehnen oder auf warten setzen. Niemals die einzige vorhandene Kasse mehrfach verpfänden.
- **Leistung abrechnen:** tatsächlich fällige Kosten bis zum Vertragsguthaben bezahlen, an den bestehenden Empfängerfonds/Leistungserbringer überweisen; **kein Überziehen**, keine Gratisarbeit. Schiffe, die weiter Arbeit verbrauchen, dürfen nur nach rechtzeitiger Budgetverlängerung weiterlaufen.
- **Abbruch/Schiffsverlust/Ankunft:** bereits erbrachte Arbeit bleibt bezahlt; der nicht verbrauchte Rest geht genau einmal an den ursprünglichen Einzahler. Bei Zerstörung keine automatische Versicherungsleistung.
- **Frachter:** Vor dem Frachterflug Reiseminuten aus Original-Core-Route und `betriebskosten.frachter` decken; Einkauf, Gebühren und Warenmenge werden weiterhin vom echten Kern bezahlt. Weitere Laden-/Ziel-/Risikoriserven getrennt, kein fingierter erwarteter Verkaufserlös als verfügbare Kasse.
- **Miner:** kurze, vollständig vorfinanzierte Arbeitsschichten. Wenn Käuferkasse und Arbeitsbudget fehlen, rechtzeitig stillsetzen; vorhandene Fracht bleibt Eigentum des Schiffs. Die konkrete Bezahlung der Piloten benötigt eine gesondert freigegebene Vertragslogik.
- **Jäger:** bezahlte Dienste/Patrouillen-/Eskortzeiten auch ohne erfolgreichen Abschuss; Kopfgeld nur bei echtem Abschuss und **erst nach tatsächlicher Auszahlung** für die nächste Vertragslaufzeit verfügbar. Riskante Flüge haben reale Kosten, Gratisdienst ist verboten.
- **Geldbilanz:** `Σ freie Ownerkassen + Σ offene Vertragsbudgets = InitialSupply + minted − burned`. Für eine künftige Produktimplementierung **beide Seiten** der Geld-/Save-Audits, Identitäten, Migration und UI-Anzeige integrieren. Kein versteckter Sonder-Owner als unverifiziertes Schlupfloch.
- **Atomare Ausführung:** Reihenfolge der reservierenden Befehle im deterministischen Core; Fundsperre und Auftragserteilung sind *eine* Transaktion. Vergabe, Gebühren, Ersatzkauf, Beschädigung und Auszahlung müssen immer denselben verifizierten Kontostand sehen; keine doppelten Abzüge.
- **Save/Load:** Offene Verpflichtungen und eindeutige Referenzen müssen gespeichert werden; alte Saves dürfen nicht still neue Verträge erhalten. Beim Wechsel zu einer inkompatiblen Regel eine ausdrückliche Regelmigration und Testreferenzen entwickeln.

## Unabhängiger Architekturtest (kein Spieltest)

`tools/analyse-b8o-escrow-invarianten.mjs` extrahiert die **echten** Rule14-Stundenkosten (Miner 150, Frachter 250, Jäger 50 ISK). Er prüft damit ein separates, bewusst einfaches `Ledger`-Modell mit reservieren, fällige Arbeit bezahlen, nicht verwendete Beträge erstatten, Doppel-Rückgabe verweigern, überteuerte Folgeaufträge verweigern und einen offenen Vertrag durch JSON-Save/Load erhalten.

Testbeispiele: Ein 40-Minuten-Frachterkontrakt bindet vorsichtig 167 ISK, bezahlt tatsächlich 166 ISK und erstattet 1 ISK; ein 2h-Minerkontrakt bezahlt 300 ISK; ein 3h-Jägerkontrakt wird nach 1h abgebrochen, bezahlt 50 ISK und erstattet 100 ISK. **Keine** neue ISK, jede Zahlung und Erstattung invariant. Mehrfachbelegung der Kasse wird abgelehnt.

**[TEST] [CI #41288011068](https://github.com/tobiasfranziskus/Check/actions/runs/41288011068) erfolgreich:** bestehende **67/67 Node-Regressionen** sowie synthetische Escrow-/Save-/Verlust-Tests; Stress mit **13 festen Seeds und 9.441 einzelnen Buchungsereignissen**; jede Buchung überprüft die Gelderhaltung. **Dies sind ausdrücklich keine 13 ×90 Spieltage, keine echte NPC-Finanzierungsintegration, keine iPad-/NAS-Abnahme.**

## Risiken / Entscheidungsgate

1. **Architekturentscheidung offen:** Ein separater Escrow-Wert im State erfordert Anpassung von `m_core_audit`, Geldsumme, Save/Load und allen Ausgabepfaden. Einfach `owner.reserved` abzulegen, ohne alle anderen bestehenden Käufer zu blockieren, wäre falsch.
2. Die konservative Vorfinanzierung eines Fluges ist nicht identisch mit der künftig tatsächlichen täglichen Arbeitskostenabrechnung; ungenutzte Mittel dürfen nicht als Ausgabe verbucht werden.
3. Die bestehende Piraten-Kopfgeldlogik prägt bei tatsächlichem Abschuss ISK (`state.minted` und `stats.kopfgeld`). Für Geldmodell B ist vor neuen Quellen die **bestehende, unbudgetierte** Emission global zu auditieren.
4. Ein gutes Vertragsbuch löst nicht automatisch fehlende Stationskaufkraft oder Nachfrage; B8n hat die Wirtschaftskrise unabhängig bestätigt.
5. Erst eine produktneutrale Simulation mit realer Mehrschiff-Disposition, 13×90d-, 365d-, Krisen-, Save-Migrations- und unabhängiger Bilanzprüfung rechtfertigt eine **separat zu genehmigende** Implementierung.

**Keine Produktentscheidung und keine Merge-Freigabe.** Historische B8m/B8n-Analysen bleiben getrennt archiviert.
