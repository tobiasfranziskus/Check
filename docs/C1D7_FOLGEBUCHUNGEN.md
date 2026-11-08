# C1d-7 – Vertragsfortsetzung und zweiter bezahlter Erz-/Materialzyklus

**[DRAFT / ANALYSE · 08.11.2026]** Auf [C1d-6 / #259](https://github.com/tobiasfranziskus/Check/pull/259) aufgesetzt. Getrenntes Forschungsprofil `aphros-research:C1d-7:post-settlement-journals-v1` (**Regel 3311**). Unveränderte Produktwelt und kein neues Wirtschaftsregelwerk für `main`; Geldmodell B bleibt ohne neue Emissionsentscheidung, hier **0 erzeugte und 0 verbrannte ISK**. Die vorherigen Forschungsregeln 3307, 3308, 3309 und 3310 sind opt-in-unabhängig und behalten ihre Verträge/Audits.

## Ursache: abgeschlossen hieß bislang praktisch eingefroren

In C1d-5 funktionierte der erste Vierermodul-Kauf (Ende Tick592), aber **jede spätere legale Buchung** konnte die historische Original-Kauf- oder Frachtprüfung zerstören:

- C1f forderte auf Lebenszeit `export.cash = buyerBefore − 1720`. Die Käuferkasse durfte nach der Abnahme nicht mehr regulär Erz kaufen oder verkaufen.
- C1d forderte dauerhaft `house.cash = sellerBefore − 300 + Kaufrest` und `transport.cash = carrierBefore − 240 + Fracht`. Nachbezahltes Erz und neue reservierte Arbeitszeit brachen die Prüfung.
- Zudem verlangte der längst abgeschlossene C1d-Vertrag, dass der Frachter `sh002` für immer am Aldera-Dock verbleibt. Bereits eine zweite **vollständig finanzierte W3-Fahrt** wurde als vermeintlicher Vertragsbruch gewertet.

**Korrektur:** Nur in Forschungsregel3311 speichern die Originalbefehle beim Abschluss der Kauf- bzw. Frachtsignatur den **damals tatsächlichen** kumulierten Einnahmen-/Ausgabenstand der beteiligten Konten – vor der jeweiligen Treuhandzahlung. Historische Gegenleistung, Preis, Käufer, Eigentum, einmalige Abnahme, Arbeitslohn, Route, Schiff und reale physische Lieferung bleiben unverändert bewiesen.

Die neuen Original- und unabhängigen Audits prüfen danach:
```text
aktuelle freie Firmenkasse
+ noch ordentlich reservierte W1-Miner- und W3-Fracht-Arbeitsmittel
= originale freie Kasse bei Vertragsabschluss
  + seit Signatur tatsächlich gebuchte Einnahmen
  - seit Signatur tatsächlich gebuchte Ausgaben
```

Der ursprüngliche Rückflug muss durch vollständig bezahlte 240 Pilotminuten, 300 ISK Fracht, abgeschlossenen Auftrag und damaligen Rückkehrtick weiterhin belegt sein. **Ein danach erneut eingesetzter Frachter darf weiterfliegen**, sofern Schiff, Originaleigentümer, Klasse, Fracht-, Geld- und Warenaudits stimmen. Gegenwärtig noch gebundene Arbeits-ISK zählen nicht als Ausgabe und nicht als freie Liquidität.

**Fehler- und Fälschungsschutz:** Ohne Einnahmen-/Ausgabenbeleg verschobene ISK, manipulierte signierte Journalbasen, eine zweite C1f-Abnahme, historische Phasen- oder Kaufbelege sowie erfundene Erz- oder Siliziumware werden weiterhin abgewiesen.

## Messung: zwei aufeinanderfolgende echte Vorstufen

Testbeginn: Erste Lieferung wie in C1d-5 mit **vier** in Meridian abgenommenen Lagermodulen, Tick592, konstanter Weltgeldmenge 33.000 ISK, Käuferkasse 18.180 ISK. `house` besitzt die zuvor bezahlten Miner, `transport` den originalen Frachter.

Im Anschluss **auf genau demselben Save**:

1. Die verbleibenden **10 Erz am Ziel Nadir** werden erst durch eine neue, aus Nadir-Kapital vorfinanzierte echte 10-Minuten-Raffineriecharge zu **4 Material** verarbeitet. Dadurch entsteht wieder freier Platz für eine neue 50er-Erzlieferung, ohne das Lagerlimit wegzurechnen.
2. Der schon bezahlte Spieler-Miner baut weitere **64 Erz mit bezahlten Arbeitsminuten** ab; die existierende Welt enthält nun kumulativ **124 tatsächlich geförderte Erz**. Das regionale Aldera-Lager zeigt Tick667 schon 60 Erz, der Miner hat noch 14 eigene Erz geladen. **Physischer Bestand ist aber kein Beweis für Großhandelseigentum.**
3. Der NPC-Großhändler kauft erst gemäß den vorhandenen Marktticks und mit **tatsächlich vorhandenem Käufergeld** die fehlenden Restmengen. Bei Tick667 besitzt der Käufer zunächst nur 35 der erforderlichen 50 Erz. Vorher ist W3 zu Recht gesperrt. Erst mit tatsächlich 50 erworbenen Einheiten darf der zweite, vollständig finanzierte Transportvertrag starten.
4. Der **gleiche Frachter** liefert die zweite echte 50er-Fracht, bezahlt wie bisher die gesamte W3-Rundfahrt und den ursprünglichen Arbeitslohn. Die Waren-/Geld- und Original-C1d-Rückkehrprüfungen bleiben gültig, obwohl `sh002` im nächsten Auftrag steht.
5. Es folgen drei weitere bezahlte W4-Chargen, sodass nach insgesamt acht echten Raffineriechargen **32 Material** erzeugt wurden. Die ersten vier Lagermodule haben 16 verbraucht; **16 frische Material** stehen wieder in Nadir. **20 Erz verbleiben** als eigener physischer Restbestand in Nadir.

| Nachweis am Ende des Zweitvorlaufs | Ergebnis (Seed 42 und 7) |
| --- | ---: |
| Simulations-Tick | **870** |
| Originale W3-Erzfrachtlieferungen | **2 × 50 = 100 Erz** |
| Wirklich gefördertes Erz insgesamt | **124** |
| Raffineriechargen insgesamt | **8** |
| Neues Material kumuliert | **32** |
| Verfügbares Material in Nadir | **16** |
| Erz in Nadir am Ende | **20** |
| Bereits wirklich exportierte Lagermodule | **4** |
| Vorhandene Käuferkasse `export` | **18.180 ISK** |
| Stationskasse `st_nadir` | **908 ISK** |
| Weltgeldmenge | **33.000 ISK konstant** |
| Neue ISK | **0** |

Die zweite W3-Fracht ist **kein zweiter Modulverkauf**. Die bisherige Ausgabenkasse von `export` wird beim neuen Erzhandel zwar zeitweise belastet, durch den regulären Weiterverkauf an die Raffineriestation aber zurückgeführt; daraus entsteht **kein zusätzlicher Auftraggeberverdienst** für Lagermodule. Das Käuferkonto verfügt bereits über 1.720 ISK, es ist zunächst **nicht** die bindende Grenze.

## Weiterhin harte, nicht eigenmächtig geöffnete Produktgrenzen

- W5b: Silizium-, Bauteil- und Lagermodulherstellung dürfen im bisherigen isolierten Forschungsprofil jeweils maximal vier Chargen. **Keine zweite Modulproduktion**, auch wenn 16 frisches Material vorhanden sind.
- C1f: der originale Käufervertrag hat **genau eine** signierte Viererbestellung. Die zweite Bestellung wird ausdrücklich abgelehnt, nicht per Kopie des alten Belegs erfüllt.
- C1d: die Meridian-Rundfracht besitzt **genau einen** abgeschlossenen Originalauftrag. Sie wird nicht als zweite Lieferung ausgegeben.
- Verbleibende Pflichten: zweite Siliziumproduktion aus echten Mitteln, zweite Bauteil-/Modul-Titelkette, zwei voneinander unterscheidbare Kauf-/Frachtverträge mit vorheriger Finanzierungsprüfung, einmalige Waren-Ausbuchung je Charge, kumulative Audits und Save/Load, Langzeit-Liquidität und wirkliche Endnachfrage.

## Tatsächlich ausgeführte Prüfungen

- `tests/c1d-7-folgebuchungen.test.mjs`: **6/6 direkte Tests** im tatsächlichen Original-JavaScript-Core mit beiden Seeds, 200 weiteren Ticks nach dem ersten Export, einer bezahlten Zusatz-Raffineriecharge, erneutem Erzabbau, zweitem echten W3-Transport, drei weiteren bezahlten Raffineriechargen und negativen Konto-/Schiffs-/Titelmanipulationen sowie Save/Load-Trennung nach Regelversion.
- `.github/workflows/c1b-1-wasser.yml` führt den Test zusätzlich in Node22 aus. Ein direkt ausgeführter JavaScript-Harness ist **kein** Ersatz für erfolgreich abgeschlossene GitHub-CI und keine echte Safari-/NAS-Abnahme.
- Keine Änderung der ersten vier Module, keine neue Emission, kein automatisch wiederkehrender Geldkreislauf, keine Genehmigung von Schiffsverschleißwerten oder Dauerkaufrechten.

**Nächster kleiner Schritt [OPTION / NICHT FREIGEGEBEN]:** Separat auf C1d-7 aufbauend genau eine zweite vollständig aus vorhandenen ISK finanzierte Silizium-/Bauteil-/Lagermodul-Viererserie und einen **zweiten** eindeutig identifizierten echten Vorauftrag prüfen. Zuerst Produktionschargen und Eigentumslose erweitern, danach Frachtvertrag und einmalige Abnahme mit unabhängigem Konto-/Warenaudit. Erst wenn wiederholte Endkäufe durch glaubhafte Einnahmen finanziert werden, von einem dauerhaften Wirtschaftskreislauf sprechen.
