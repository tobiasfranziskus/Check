# W6/P8e – Nadir-Materialengpass nach echter Dravos-Fremdfracht

**16.11.2026 · [DRAFT / ANALYSE] · Originalregel207 nicht freigegeben · kein Merge/Deploy**

## Quellen und geprüfte Reproduktion

- Auf Basis [#415](https://github.com/tobiasfranziskus/Check/pull/415) und der korrigierten Endfenster-QA [#420](https://github.com/tobiasfranziskus/Check/pull/420).
- Neues read-only Nachschub-Gate im [Draft #422](https://github.com/tobiasfranziskus/Check/pull/422), geprüft durch [13×90 + S02×365 CI #43810514073](https://github.com/tobiasfranziskus/Check/actions/runs/43810514073): **14 Szenariojobs und Aggregat erfolgreich**. Gemessen werden Original-Lager, Kassen, Verträge, Feldmengen und Schiffe; kein neuer Auftrag oder Geldtransfer in der Diagnose. Original-S02-Hashes bleiben nach 90 Tagen `75ea7eb42b030777` und nach 365 Tagen `16872ecc2bfca6bb`.
- Die Quellstand-Kopplung ist isolierte **Regel207-Forschung**, nicht `main`/Pages. 33.000 ISK, Mint/Burn 0 und originaler Save/Load-Audit im Szenario erfolgreich; damit ist noch **keine wirtschaftliche Nachhaltigkeit** bewiesen.

## Konkret beobachteter Engpass: S02, Tag 14,25 bis 365

| Nachweis | Wert direkt nach erster Fremdfracht | Wert nach 365 Tagen |
| --- | ---: | ---: |
| Abgeschlossene Dravos-Frachten | 1 | 1 |
| Restliches physisches Dravos-Silizium | 8 | 8 |
| Echte verkaufte Dravos-Siliziumeinheiten | 8 | 8 |
| Nadir-Siliziumlager | 8 | 8 |
| Nadir-Materiallager | 10 | 10 |
| Nadir-Erz | 0 | 0 |
| Nadir-Bauteile / fertig gelagerte Jäger | 0 / 0 | 0 / 0 |
| Nadir-Lagerfrachter / Ziel | 2 / 2 | 2 / 2 |
| Rechtmäßiger NPC3-Miner am Dravos-Dock | vorhanden, leer | vorhanden, leer |
| Nadir-Transportfrachter `sh018` | frei, leer | frei, leer |

Der **Originallogik-Konflikt** ist überprüfbar im `prototypes/welt/welt-kern.js`:

1. `siliziumKette` stoppt erneute Förderung, solange Nadir bereits die Bedarfsmenge 8 als Silizium/Bauteile besitzt. Dieses konservative Lagergate ist hier korrekt: Nadir hält tatsächlich 8 ungenutzte Einheiten.
2. `industrie` startet J3 erst bei mindestens `C3.material + rules.w5.material + rules.j4.material = 2 + 5 + 4 = 11` Material. Tatsächlich sind es nur **10**; zusätzlich keine 10 Erz für das Original-W4-Rezept `10 Erz → 4 Material`.
3. `industrieAutoSchritt` kann keinen neuen K7-Erzvertrag auslösen, wenn `nadir.frachter >= ziel.frachter` (hier **2/2**) und hält schon ab `nadir.material >= rules.w5.material` (hier **10 ≥ 5**) eine neue Lieferung zurück. K7 bindet den Erzvertrag außerdem zwingend an den Bau einer weiteren W5-Frachterhülle. Die Materialnachfrage der J3/J4-Industrie ist dadurch **nicht unabhängig** von der Frachter-Lagernachfrage.

**Keine S02-Insolvenz am geprüften Vertragspunkt:** Die volle bisherige K7-Finanzierung wäre nach aktuellem Kassenstand möglich, wenn der Original-K7-Bedarf zulässig wäre.

| Rechtsträger | K7 benötigt | Verfügbar Tag 14,25 | Verfügbar Tag 365 |
| --- | ---: | ---: | ---: |
| `npc3` | 100 ISK | 1.710 ISK | 1.554 ISK |
| `st_aldera` | 500 ISK | 1.410 ISK | 1.100 ISK |
| `st_nadir` | 740 ISK | 5.418 ISK | 4.000 ISK |
| `transport` | 120 ISK | 2.290 ISK | 1.898 ISK |
| `werft_extern` | 530 ISK | 600 ISK | 600 ISK |

Vier leere NPC3-Miner stehen am Aldera-Dock zur Verfügung. Das ist **nicht** die historische J10d-500-ISK-Finanzierungslücke einer *anderen* Welt. Eine erzwungene alte K7-Frachterbestellung wäre wirtschaftlich unplausibel, weil der bestehende Frachter-Zielvorrat bereits voll ist.

## Wirtschaftliches Negativergebnis

Der erste reale Dravos-Auftrag wurde finanzierungs- und eigentumsrichtig ausgeführt, aber bringt dem Rohstoffinhaber **192 ISK Verkauf minus 128 ISK Förderlohn, 40 ISK Hinreise und 120 ISK Fremdfracht = −96 ISK** vor Verschleiß/Investitionen. Eine zweite identische Charge aus dem bereits in Dravos befindlichen Miner hätte wegen der längeren Nadir→Dravos→Nadir-Frachterfahrt **160 ISK Gebühr**, bei entfallener neuer Miner-Fernreise also ebenfalls mindestens **192 − 128 − 160 = −96 ISK**, vor weiteren tatsächlichen Kosten. Eine blinde Anweisung zu mehr Dravos-Förderung stellt keine profitable oder nachhaltig selbstfinanzierte NPC-Wirtschaft her.

## Konkreter nächster Forschungs-/Produktentscheidungspunkt

**[OPTION, gesonderte Freigabe notwendig]** Separater originalfinanzierter Erz-/Material-Nachschubvertrag *ohne* verpflichtende zusätzliche W5-Frachterproduktion, bei echter Lager- und Produktionsnachfrage. Firmenrechte strikt trennen (`npc3` Bergbau, Aldera Kauf, `transport` Fracht, Nadir Material/Abnahme), Original-W0-Kassen-/W3-Fahrt-/W4-Rezept-/Verschleiß-/Save-Kern wiederverwenden. Keine neuen Start-ISK, geschenkten Erze, garantierten Käufer, neuen Frachtpreise, Preisgarantien oder Insolvenzrettungen. Der Vertrag darf bei nicht finanzierter Ware, fehlender Kapazität oder fehlendem zahlenden Käufer scheitern.

Eine legale 50-Erz-Lieferung würde bei Vorfinanzierung und tatsächlich durchgeführter Original-W4-Arbeit **fünf Chargen × vier = 20 Material** ermöglichen. Ob die Firmen damit langfristig rentabel sind, ist gesondert nachzuweisen; kein stiller Produktbeschluss.

**Bevor Regel208/Produktintegration:** Geschlossenen Finanzierungs- und Eigentumsvertrag mit Abbruchfällen entwerfen, bei Bedarf gesonderte Produktfreigabe einholen; auf eigenem Forschungsbranch Seed42/S11 und 13×90/365/730 samt Originalhash, Save, Audit, Insolvenz/Krisen, Käufernachfrage testen. Erst nach bestätigter Spielerbedienbarkeit/QA kann ein unabhängig geprüfter, auf aktuellen `main` zielender Integrations-PR entstehen. **Dieser PR ändert keine Wirtschaftsmechanik.**
