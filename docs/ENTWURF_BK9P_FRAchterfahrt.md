# B-K9p – Realer Frachterflug aus vorfinanzierter Reserve

**[DRAFT/ANALYSE] 02.11.2026.** Gestapelter Kandidat auf [PR #108](https://github.com/tobiasfranziskus/Check/pull/108), nicht auf `main`. Weiterhin **[MAIN] b4e604d**, Produkt v0.12.5 / Regel 14 / Schema 8. Die hier beschriebenen Zahlungsregeln sind **nur** in explizit getesteten Regel15-/Schema9-Zuständen aktiv. Keine eigenständige Wirtschaftsregel freigegeben.

## Reale Vorgänge

1. Ein tatsächlicher manueller `shipMove`-Befehl oder die bestehende NPC-Frachter-Disposition benötigt unter Regel15 **vor Abflug** eine Reserve in Höhe der aufgerundeten maximalen normalen Reise-Betriebskosten (`ceil(reisezeit * betriebskosten.frachter / 60)`). Die Route und die ursprüngliche Schiffsklasse werden aus dem Core gelesen. Wenn die Kasse nicht ausreicht, bleibt der Frachter im Dock. Leere NPC-Umpositionierung benötigt dieselbe Finanzierung.
2. Gebundene ISK bleiben im Vertragsbuch und können nicht als freies Besitzer-Geld ausgegeben oder abgeschöpft werden. Die tatsächlichen, stündlich gerundeten `s.arbeit`-Minuten werden über den **vorhandenen** Stundenkosten-Aufruf an den Zielsystemfonds ausgezahlt; derselbe Kostenbetrag wird **nicht nochmals** aus `owner.cash` abgezogen. Buchung nur gegen eindeutigen Schiff-/Tick-Beleg.
3. Bei Ankunft wird nicht voreilig erstattet: Erst nach der nächsten Stundenabrechnung wird ein Rest an den ursprünglichen Auftraggeber zurückgegeben. Ein weiterer Frachterstart mit derselben noch nicht abgerechneten Arbeit ist gesperrt. Bei Verlust werden nicht abgerechnete Arbeitsminuten mit den bisherigen Rundungsregeln sofort bezahlt und die Restreserve dann freigegeben.
4. Das bestehende Produkt (14/8) bleibt unangetastet; der Kandidat migriert alte Saves nach 15/9 und weist neue Saves in alten Regeln sichtbar zurück. Offene Fahrtverknüpfungen müssen einen aktiven Schiffseintrag besitzen.

## Grenzen / Abnahme

- Die Flugreserve bezahlt nur **tatsächliche bisherige Betriebskosten**. Sie beweist noch nicht, dass der Transport einschließlich Einkauf, Rückreise, Warenverlust, Ersatzhülle und Produktionsarbeit insgesamt rentabel ist. Jeder weitere Leg benötigt einen eigenen finanzierbaren Vertrag.
- Bestehende NPC-Automatik wird für **neue** Frachter-Abflüge unter Regel 15 vorfinanziert; alte, aus Regel14 migrierte laufende Fahrten bleiben als Altverpflichtungen zu untersuchen.
- Keine Lohnzahlungen für Produktion, Haushaltskäufe, eigenständige Waren-Nachfrage oder Änderungen an den Geldmodell-B-Emissionen.
- Eine künstliche `m_core_vertrag.bezahlen`-Buchung ist weiterhin kein physischer Leistungsbeweis. **Für den hier geprüften Flug** wird der Beleg ausschließlich durch den laufenden Original-Core aus `s.arbeit` und dem Simulations-Tick erstellt, nicht durch UI oder Test.
- Vor produktiver Verwendung: Geld-/Warenaudits, vollständige 13×90d/365d-Krisenläufe **unter Regel 15**, gespeicherte Altflug-Verpflichtungen, Rundungsverluste bei Ankunft/Verlust, Performance und echte Safari-/NAS-Abnahme.

**Test:** `tests/bk9p-frachterfahrt-vertrag.test.mjs`: Blockade bei Mittellosigkeit, Reise 25 Minuten, echte Stundenabrechnung, zweiter Start nach Abrechnung, Halten, realer Schiffverlustpfad, Geldsummen, Save/Load, Hash-Replays mit 13 Seeds. Testergebnis nur nach tatsächlich ausgeführter CI nachtragen. Kein Merge ohne Nutzerfreigabe.
