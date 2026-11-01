# B8o – Gemeinsame Mittelbindung, nicht nur Abflug-Kassenprüfung

**[ANALYSE/ARCHIV, 01.11.2026]** Basis `main 0d473e6ac85242e1ebb9c52ce1fa59c4ca30139a` (v0.12.5/Regel14/Schema8). Keine produktive Codeänderung. B8m zeigte in Seeds 42/7 eine gute Reduktion ungedeckter Arbeit durch eine konservative Abflugprüfung plus Minerreserve, aber **keine atomare Mittelbindung**.

## Invariante für eine spätere Produktarchitektur

Eine gemeinsame Kontenbuchführung muss für **alle Akteure** und Arten von Zahlungsverpflichtungen gelten, also auch Minern, Frachtern, Jägern, Werft, Warenkäufen, Spielerpiloten und NPC-Piloten.

```text
zahlungsfähig(owner) := owner.cash >= Σ verbindlich reservierter Restbeträge
frei(owner) := owner.cash - Σ verbindlich reservierter Restbeträge
neuer Vertrag nur falls frei(owner) >= Vertragsdeckung
Abrechnung: reservierten Betrag und owner.cash zusammen um reale Zahlung reduzieren
Abbruch: noch nicht erbrachte Leistung freigeben; keine Gratis-Erstattung bereits geleisteter Arbeit
```

Dies ist ein **Sollentwurf**, keine Beschluss-/Implementierungsfreigabe. Der endgültige Kostenbegriff benötigt die korrekte Rundung stündlicher Arbeit, Fracht-/Werftkosten, mögliche Kampfschäden, Abbruch bei zahlungsunfähigen Akteuren und langlebige Save/Load-Vertragsdaten. Ein bloßes separiertes „Piloten-Konto“ oder ein nur vor dem Abflug berechneter Puffer reicht nicht, wenn andere Core-Funktionen anschließend dieselbe Konzernkasse ausgeben dürfen.

## Tatsächlich ausgeführte Prüfungen

**[TEST/CI] [GitHub Actions #41289917654](https://github.com/tobiasfranziskus/Check/actions/runs/41289917654) erfolgreich:** 67/67 originale Node-Regressionen; isolierte Testbuchführung mit realer Originalkern-Kasse und unveränderten Regelkosten; vier 90-Tage-Originalkern-Kontrollwelten (Seeds 42/7, historische Spielerkrise/passiver Vergleich), **8.640 stündliche unabhängige Geld-/Warenaudits und deterministische Replays, 32 Save/Load-Roundtrips**, historischer Seed42- und Seed7-Hash erhalten. Ausführbarer Code: `tools/analyse-b8o-mittelbindung.mjs`. **Keine echten Spielaufträge benutzen dieses noch nicht integrierte Schattenbuch**, und nur die Kontrollsimulation ist realer Originalkern; keine 13-Seed-/365d-Produktabnahme.

**Finanzierungsfälle aus derselben Original-NPC3-Startkasse (2.000 ISK):**

- Verpflichtung A: beispielhafter 780-ISK-Hüllenkauf + 250 ISK Frachterarbeit + 150 ISK Minerarbeit = **1.180 ISK**. Nach Reservierung bleiben **820 ISK** frei.
- Verpflichtung B in derselben Höhe wird **korrekt abgewiesen**, weil 820 ISK freie Mittel kleiner als 1.180 ISK sind.
- Zusätzlich 150 ISK Miner-Verpflichtung wird gebunden; danach bleiben **670 ISK frei**.
- Ein außenstehender, nicht durch die Reservierungsbuchführung kontrollierter 800-ISK-Abgang verletzt sofort die Buchungsdeckung. **Das beweist die notwendige zentrale Sperre für sämtliche Ausgaben**, nicht die Existenz einer solchen Sperre im Produkt.
- Die kontrollierte Teilzahlung von 250 ISK überträgt echte Mittel an den bestehenden Fonds, reduziert das gebundene Vertragsvolumen und erhält die Original-Geldbilanz. Freigabe nicht erbrachter Arbeit gibt **keine neuen ISK** aus. Die gesonderte absichtlich nicht verbuchte Auszahlung wird vom Original-Audit als Bilanzbruch erkannt.
- Für gleichzeitig finanzierte Miner-, Frachter- und Jägerarbeit mit zusammen **700 ISK** wird ein absichtlich simulierter Deckungsverlust ebenfalls erkannt.

**Bewertung:** Eine korrekte, **zentral validierte und durable** Mittelbindung ist eine sinnvolle Vorbedingung für allgemeine, real finanzierte Pilotentätigkeiten und verhindert Doppelverpflichtungen. Der Test ist ein expliziter **Schattenvertrag**, keine persistente Kontenänderung und keine vollständige Wirtschaftsreform. Der Spieler muss weiter beliebig viel ISK halten können; echte Insolvenz muss zu Stillstand/Folgen führen statt zu negativen Konten oder heimlichen Rettungen.

**[OPTION] Nächster Produktgate nach Nutzerfreigabe:** Minimaler transaktionssicherer Contract-/Escrow-Entwurf für alle Kernabbuchungen (Kosten, Waren, Werft), Save-Migration und fairer Auftragstopp, danach deterministische 13×90-/365d-Tests. Einzelne NPC-Konzerne dürfen ausfallen; ihr Vermögen und ihre Waren müssen regulär in den Markt zurückfließen können.
