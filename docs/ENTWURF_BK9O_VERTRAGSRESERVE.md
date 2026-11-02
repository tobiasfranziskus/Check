# B-K9o – Vertragsreserve als isolierter Core-Kandidat

**Stand: 02.11.2026 · [DRAFT] · kein Merge oder Deployment.** Basis ist `main b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c` mit Spielversion v0.12.5 / Regel 14 / Schema 8. [PR #107](https://github.com/tobiasfranziskus/Check/pull/107) testet den physischen Original-Core-Teilkreislauf separat; dieser Kandidat integriert keinen autonomen Vertrag und keine kaufkräftige Endnachfrage.

## Ziel und Grenze

Erster allgemeiner, von NPC oder Spieler verwendbarer Kassenbaustein **ohne eigene Wirtschaftsentscheidung**. Ein Auftraggeber reserviert reale ISK atomar vor dem Auftrag, ein Core-Mechanismus kann gegen eine eindeutige Leistungskennung bis zur reservierten Obergrenze auszahlen, und nach Abschluss/Abbruch wird exakt die Restreserve einmalig erstattet. Es gibt keine neue ISK-Emission, keinen kostenlosen Ersatz und keinen Eingriff in bestehende NPC-Routen.

**Wichtig:** Ein beliebiger Leistungsbeleg ist kein Beweis für echte Arbeit. Die Primitive verwaltet ihn nur eindeutig und gegen Doppelabrechnung; die spaetere Verbindung zu Förderung, Produktion und Reise muss Belege und Beträge **aus tatsächlich ausgeführten Core-Ereignissen** ableiten. Sie darf nicht einfach vom UI oder der NPC-Entscheidung ungeprüft auszahlbar werden.

## Kandidatenumfang

- `m_core_vertrag`: `reservieren(state, zahlender, empfaenger, budget)`, `bezahlen(state, id, beleg, betrag)`, `abschliessen(state, id)`, `bestand(state)`. Ablehnung bei fehlendem Geld, Überziehung, doppeltem Beleg oder wiederholtem Abschluss.
- Offene Reserven liegen im gespeicherten `state.vertraege.eintraege[*].rest` und sind keine frei verfügbaren Besitzerkassen. Der Core-Geldaudit summiert freie ISK **plus** gebundene ISK gegen `initialSupply + minted - burned`.
- Nur mit **explizitem** Regel-15-/Schema-9-Testregelsatz aktiv. `m_data_rules.RULES` und der reguläre UI-Spielstart bleiben bei **Regel 14 / Schema 8**. Daher keine Änderung historischer Regel-14-Referenzzustände.
- Migration 8→9 fügt ein leeres Vertragsbuch hinzu; 14→15 setzt die Regelversion. `load` prüft gespeicherte Bilanz, IDs, Belegsumme, Besitzer und Status. Eine alte Regel 14 weist neue Schema-9-Saves explizit ab.
- Vor jeder echten Integration müssten die Kostenbuchungen aus `m_core_stunde.betriebskosten` **an die Vertragsreserve angebunden** werden, statt parallel aus einer freien Kasse abzubuchen. Sonst droht Doppelzahlung. Dasselbe gilt fuer Fabriklöhne, Konsumzahlung und eventuellen Auftraggeberwechsel.

## Abnahme / nicht behauptete Erfolge

`tests/bk9o-vertragsreserve.test.mjs` prüft atomare Reservierung, Beleg-ID, Freigabe, Kassenmangel, Summenaudit, Save/Load/Migration, korrupte Save-Daten, Determinismus mit 13 Seeds und den Test-Beleg nach einer echten Eisförderung. Die CI-Ergebnisse werden erst nach vollständiger Ausführung dokumentiert.

**Nicht abgenommen:** reale Endkundenfinanzierung, Produktionslöhne, physisch vollständige Vertragsausführung, vollständige Treuhandführung bei Betriebsabrechnung, Piraten-/Schiffsverlustrückabwicklung und 40 real wiederholte Produktionsperioden. Deshalb keine Wirtschaftsfreigabe und kein Merge-Vorschlag für diesen Baustein.

## Entscheidung vor nächstem Produktpatch

Die nächste sinnvolle Teilintegration ist ein einzelner realer Frachterauftrag auf dem vorfinanzierten Ledger einschließlich Hin-/Rückflugkosten, Verlust-/Abbruchpfad und atomarer Stundenabrechnung. Erst bei vollständig finanziertem Folgeauftrag werden Produktion und Haushalt angeschlossen. Geldmodell B benötigt weiterhin eigene Entscheidung über Emissionsregeln.
