# B-K11b – Testseitige Gegenprobe für den D1-Abrechnungstakt

**[ANALYSE/DRAFT]** 02.11.2026. Gestapelt auf B-K11a [#138](https://github.com/tobiasfranziskus/Check/pull/138) → B-K11 [#137](https://github.com/tobiasfranziskus/Check/pull/137). `main` bleibt `b4e604d6`, v0.12.5/Regel14/Schema8. **Keine Änderung an `index.html` und keine Produkt-/Save-Freigabe.**

## Beleg vor der Gegenprobe

B-K11a-Krisen-CI [41521445768](https://github.com/tobiasfranziskus/Check/actions/runs/41521445768), Job `wirtschaft (crises)`, **erfolgreich**: vier aktive 90-Tage-Krisen, Original-Kern, Kandidat und No-Rescue-Kontrolle (12 Welten), unabhängige stündliche Geld-/Waren-/Escrow-Audits, Hash-Replays, Save/Load. Für den Kandidaten insgesamt **122.148** wegen offenem Vertrag/Restarbeit geblockte Abflugversuche, **122.530** vertragsgebundene Dockminuten, davon **121.445** Versuche mit aktuell genügend freier Flugkasse und **50.126** mit Kasse und irgendwelcher Ladung. Das sind keine 122.148 eindeutigen Aufträge und kein Beweis rentabler Absatzmöglichkeiten.

Der Seed-Matrix-90d-Lauf aus #138 ist separat zu prüfen; er darf nicht als bestanden bezeichnet werden, solange sein finaler Workflow-Status offen ist.

## Isolierte Kausalhypothese

Weltvarianten im bestehenden `tools/bk11-wirtschaft.mjs`: `product` (Regel14/Schema8), `candidate` (unveränderte #137-Finanzierung), `candidate-arrival` (testseitiger D1-Gegenpfad). Beide Kandidaten reservieren echte ISK **vor** dem Abflug und bezahlen den originalen Frachtertarif aus der Reserve. Der Gegenpfad schließt den Vertrag **nach realer Ankunft und vor dem nächsten autonomen Routenentscheid**, also nicht bei Vertragsstart. Bis dahin geleistete Arbeit wird aus Escrow bezahlt. Die Original-`m_core_stunde`-Abrechnung wird für diese schon vergüteten Minuten entsprechend korrigiert, sodass eine doppelte Lohnbuchung verhindert wird. Stündliche kumulierte Ganzzahlrundung wird auch bei mehreren Reisen im selben Stundenfenster als Differenz abgerechnet. Ein Flug über eine Stundengrenze nutzt nach wie vor die Stundenabrechnung für seine erste Teilleistung. Die zugeordneten Zielsystemfonds werden weiterhin tatsächlich bezahlt.

**Experimentgrenze:** Diese Änderung ist ausschließlich eine In-Memory-Quelltransformation des Entwicklungsrunners. Der Zusatz `s.d1Bereits` ist ein Test-Hilfsfeld; seine Save/Load-Fähigkeit ist im Versuch zu prüfen, aber **kein neues freigegebenes Spielstandformat**. Die Zahlungszeitpunkte können Liquidität und Wege verändern. Das Modell ist daher eine **Kausalprobe**, keine sofort produktionsreife Alternative und nicht automatisch ein genehmigtes D1-Vertragsregelwerk.

## Falsifikations- und Abnahmegates

1. Kurzer Seed42-Original-Core-Smoke mit `--probe=arrival`, wahren Core-Belegen, Original-/unabhängigen Audits, unabhängigem stündlichem Hash-Replay und täglichem Save/Load.
2. Je sieben Tage Seeds42/7 sowie vier aktive Krisen zu je 14 Tagen mit drei Varianten; gegenüber `candidate` nur D1-Abrechnung ändern. Tatsächliche Mangelstunden, Warenverbrauch, Deckungsbeiträge, Ersatzkäufe, Verluste und weitere ungedeckte Arbeit **gemeinsam** vergleichen. Kurzläufe sind kein 13×90d-Nachweis.
3. Wenn Kurzläufe sowohl korrekt als auch wirtschaftlich nützlich sind, längere 13×90d-Läufe und historische Krisen gezielt nachführen. Bei negativer oder gemischter Wirkung keine Produktaktivierung und keine Preis-/Lohn- oder Emissionsausweichlösung.

## Reproduzierbare Befehle

```sh
node --test tests/bk11b-d1-ankunft-gegenprobe.test.mjs
node tools/bk11-wirtschaft.mjs --suite=standard --seed=42 --days=7 --probe=arrival --out=/tmp/bk11b42.json
node tools/bk11-wirtschaft.mjs --suite=standard --seed=7 --days=7 --probe=arrival --out=/tmp/bk11b7.json
node tools/bk11-wirtschaft.mjs --suite=crises --days=14 --probe=arrival --out=/tmp/bk11bkrisen.json
```

**Bis zur erfolgreichen CI der aktuellen Commits sind alle Gegenproben offen.** Kein Merge, keine Veröffentlichung, kein Ersatz der verbindlichen Roadmap.

## Ausgeführt: B-K11b-CI nach D1-Vergleich (02.11.2026)

**[TEST] [CI #41523480172](https://github.com/tobiasfranziskus/Check/actions/runs/41523480172) erfolgreich** am Test-/Runner-Code [`4fa9321f`](https://github.com/tobiasfranziskus/Check/commit/4fa9321f60b780cb72a86c697c36b140c3719d93): neuer Smoke-Test, zwei passive Seeds ×7 Tage ×3 Varianten und vier aktive Krisen ×14 Tage ×3 Varianten. Unabhängige stündliche Geld-/Waren-/Escrow-Audits und Hash-Replays, tägliche Save/Load-Fortsetzungen. Die explizite Variantenvergleichszeile `BK11B_COMPARE` ist im Job-Log und im zugrunde liegenden CI-Artefakt nachvollziehbar. Dies ist **kein 13×90d-Nachweis**. Die allgemeine Regressions-CI ist separat zu bewerten.

**[ANALYSE]** In `candidate-arrival` jeweils **0** wegen offenem Vertrag abgelehnte Fahrten bzw. dadurch gesperrte Dockminuten. Diese technische Beseitigung des D1-Leerlaufs ist kausal belegt. Der Vergleich schließt aber nicht alle Zahlungszeitpunkt- und Fondsverteilungseffekte aus.

| Passive Welt, 7 Tage | Produkt R14 | Finanzierung B-K11 | Ankunft D1 |
| --- | ---: | ---: | ---: |
| Seed42: Mangelstunden | 0 | 29 | **3** |
| Seed7: Mangelstunden | 2 | 41 | **4** |
| Seed42: NPC-Frachterverluste | 8 | 9 | **16** |
| Seed7: NPC-Frachterverluste | 13 | 8 | **15** |
| Seed42: Händlerbeitrag nach bezahlten Flügen (ISK, gerundet) | 410.715 | 304.581 | 378.371 |
| Seed7: Händlerbeitrag nach bezahlten Flügen (ISK, gerundet) | 396.441 | 316.465 | 403.785 |

**[ANALYSE]** D1 behebbar, aber mehr gefahrene Routen erhöhen Frachtarbeit, Risikoexposition, Hüllenauszahlungen und können Kapital aufzehren. Der Beitrag ist **keine** volle Konzernrendite und enthält keine vollständig bezahlte Produktions-/Endnachfragekette.

| Vier aktive Krisen, je 14 Tage: Mangelstunden | Produkt | Finanzierung | Ankunft D1 |
| --- | ---: | ---: | ---: |
| Miner42 | 2.966 | 3.192 | **3.254** |
| Handel-Flotte42 | 3.561 | 4.235 | **3.928** |
| Station1234 | 3.002 | 3.260 | **3.150** |
| Jagd98765 | 2.691 | 2.298 | **2.610** |
| **Summe** | **12.220** | **12.985** | **12.942** |

Im aktiven **Jagd**-Fall sinkt die Zahl der NPC-Frachter von vier (B-K11) auf einen (D1); in der **Miner**-Krise steigt sie von zwei auf fünf. Aus dem Abbau der Abrechnungssperre folgt **keine robuste Verbesserung** über die vier aktiven Szenarien. In allen vier D1-Endständen sind die freien Händlerkassen (zusammen 132/107/78/127 ISK) unter den aktuellen Hüllenkaufkosten (780 ISK); ein dauerhafter Ersatzkreislauf ist nicht belegt.

**Wichtig zur Kausalinterpretation:** Die testseitige Ankunftsauszahlung verändert neben der Freigabe für den nächsten Flug auch **Zeitpunkt und ggf. räumliche Verteilung der tatsächlichen Fondsbuchung**, verglichen mit dem Originalstundenabschluss. Hier wird daher **nicht** behauptet, dass 100 % des Versorgungsunterschieds allein auf verringerte Wartezeit zurückgehen. Ein späterer savefester Produktionsentwurf müsste mehrere Flugsegmente und die aufgeschobene stündliche Gesamtabrechnung getrennt modellieren, um diese Einflüsse noch sauberer zu isolieren.

**[ENTSCHEIDUNGSGATE]** B-K11b ist **technisch positiv, gesamtwirtschaftlich gemischt/ungenügend**. Keine D1-Produktregelaktivierung, keine Merges. Nächster sinnvoller Schritt vor größerem Ausbau: die 90-Tage-Auswertung auf dem ursprünglichen B-K11a-Kandidaten vollständig sichern und danach Risiko-/Routenentscheidung und Ersatzfinanzierung kausal von Zeitabrechnung trennen; D2–D8 bleiben offen.
