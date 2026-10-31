# B6f-P0 – Zahlungsfluss der 49 B6e-Verkaufstransaktionen (Archivauswertung)

**31.10.2026 · [ANALYSE/DRAFT] · keine Produktänderung, keine neue Simulation.**  
Basis: `main 517728a958326e86751f09cd74d0c077edad9921`, v0.12.5 / Regel 14 / Schema 8. Verbindliche Prioritäten stehen ausschließlich in [ROADMAP.md](ROADMAP.md). Das Geldmodell B ist als Zielrahmen in [Draft-PR #55](https://github.com/tobiasfranziskus/Check/pull/55) vorgeschlagen; keine konkrete Endkunden- oder Emissionsregel ist implementiert.

## 1. Exakte Datenquelle und Prüfmethode

- Historischer, **erfolgreich abgeschlossener** [B6e-Workflow #41180157480](https://github.com/tobiasfranziskus/Check/actions/runs/41180157480), **19/19 Jobs erfolgreich** (darunter die damaligen 67 Standardtests). Basis: Analyse-Head [`0113eb974d8a`](https://github.com/tobiasfranziskus/Check/commit/0113eb974d8a2e9fbc7f20f0f662730a91b17af7), [PR #54](https://github.com/tobiasfranziskus/Check/pull/54), nicht integriert.
- Originales GitHub-Actions-Artefakt **`b6e-p0-fall-handel-flotte`**, Artefakt-ID `13034288747`, mit `handel-flotte-42-control.json` und `handel-flotte-42-credit.json`; keine neu konstruierten Simulationsdaten. Seed **42**, B1-Spielerfall **`handel-flotte`**, Start **Tick 129600**, historische Fortsetzung **275 Tage**.
- Der bestehende [B6e-Runner](https://github.com/tobiasfranziskus/Check/blob/0113eb974d8a2e9fbc7f20f0f662730a91b17af7/tools/analyse-b6e-kredit.mjs) misst die Felder `owners`, `hulls`, `losses`, `contracts`, `daily`; **diese vorhandenen Felder** wurden hier gegengerechnet. Unabhängige Plausibilitätsrechnung aus Original-JSON, **keine Re-Ausführung von Node- oder Simulationsläufen**.
- `sourceSha256` im Artefakt: `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`; `variantSha256` in der Kreditdatei: `50d83075bda5d5cef20ed8bdc9ae8a8b6c1ab7bc8976748b4458933682bbde00`. Diese Hashes stammen aus dem historischen Runner, nicht aus einem neuen Core-Lauf.

## 2. Bestätigter Zahlungsfluss des tatsächlich finanzierten NPC1-Frachters

**Alle Zahlen dieses Abschnitts betreffen ausschließlich NPC1 im Kredit-Fall**, nicht die parallel tätige NPC3-Flotte und nicht die Summe über vier Krisen.

| Sachverhalt | Beobachtung |
| --- | ---: |
| Kredit `st_meridian` → `npc1`, Tick **130620** | **+1.380 ISK** Liquidität, **+1.380 ISK** Verbindlichkeit |
| Echte Hülle `sh112`, Tick **130620** | **−780 ISK** inkl. Kaufgebühr |
| Verbleibende Anlaufkasse unmittelbar nach Hüllenkauf | **600 ISK** |
| `sh112`: reale Waren-Einkaufstransaktionen | **44** |
| Waren-Einkaufswert | **4.667 ISK** |
| Einkaufsgebühren | **81 ISK** |
| `sh112`: reale Waren-Verkaufstransaktionen | **49** |
| Waren-Verkaufswert | **6.415 ISK** |
| Verkaufsgebühren | **153 ISK** |
| **Realisierter Waren-Handelsüberschuss nach Gebühren** | **+1.514 ISK** |
| **Tatsächlich fällige Frachter-Arbeit** | **7.000 ISK** |
| Davon bezahlt | **2.114 ISK** |
| **Ungedeckte Arbeit (keine persistente Schuld)** | **4.886 ISK** |
| **Ergebnis nach vollständiger fälliger Arbeit, vor Hülle** | **−5.486 ISK** |
| **Ergebnis nach vollständiger Arbeit und Hüllenkauf** | **−6.266 ISK** |
| Kredit-Tilgung / verbleibende Forderung | **0 / 1.380 ISK** |
| Erster nachgewiesener Warenverkauf | Tick **130676** |
| Erstmals im Runner als ungedeckt beobachtete Stunde | Tick **130680** |
| Verlust von `sh112` | Tick **132300**, **28 Stunden nach Kauf** |
| NPC1 nach dem Versuchsverlauf | **0 ISK, 0 Frachter** |

**Nachrechnung (ganzzahlige ISK):**
- Warenmarge: `6415 − 153 − 4667 − 81 = 1514`.
- Arbeitslücke: `7000 − 2114 = 4886`. Der Anteil der Warenmarge an fälliger Arbeit beträgt `1514 / 7000 = 21,63 %`.
- Nach fälliger Arbeit: `1514 − 7000 = −5486`; nach realer gekaufter Hülle: `−5486 − 780 = −6266`.
- **Liquiditätsidentität des beobachteten NPC1-Betriebs:** `600` Anlaufkasse + `1514` Nettowarenmarge − `2114` tatsächlich bezahlte Arbeit = **0 ISK**. Dieser Gleichstand erklärt den Endkontostand **ohne** zusätzliche Geldschöpfung und darf nicht mit einem ausgeglichenen Betriebsergebnis verwechselt werden.
- 28 Stunden × bestehende Frachterarbeitskosten **250 ISK/Stunde** = `7000`; realisierter Handelsüberschuss im beobachteten Fenster nur rund **54 ISK/Stunde**. Das Geschäft trägt aus eigener Leistung weder den laufenden Arbeitsansatz noch einen Schiffersatz.

**Wichtige Korrektur der Bezeichnung:** Die bisher zitierten „49 Lieferungen“ sind im B6e-Instrument **49 gezählte Verkaufstransaktionen** (`sells`), **nicht** 49 vollständig abgeschlossene Hin-/Rückfahrten. Der Runner meldet **43 vollständig geschlossene Warenlots** und **43 Folgekäufe nach einem Verkauf** für NPC1; diese Zahlen sind **kein Beleg** für 43 vollkostendeckende Frachterzyklen. In diesem Zeitraum hatte NPC1 nur **einen** nachgewiesenen Frachter `sh112`.

## 3. Einordnung der Ursache und Grenzen des Messbelegs

**[BESTÄTIGT]** Im einzigen aktivierten B6e-Kreditfall ist der realisierte Waren-Handelsüberschuss erheblich kleiner als die tatsächlichen Arbeitskosten. Ein Kreditzuschuss, ein anderes Tilgungsfenster oder allein eine erneute Hülle würden diese negative operative Vollkostenrechnung **nicht** reparieren. Die Liquidität von 600 ISK nach Kauf und die Erlöse wurden vollständig durch bezahlte Arbeit aufgezehrt; weitere **4.886 ISK** echte Arbeit blieb ungedeckt. Die Hülle ging nach 28 Stunden verloren. **49 Verkaufsereignisse sind ausdrücklich kein erfolgreicher Dauerzyklus.**

**[NICHT AUS DIESEM ARTEFAKT ABLEITBAR]** Die vorliegenden Aggregate enthalten **keine vollständige Chronik jedes Kaufs/Verkaufs mit zugehöriger Stationskasse vor und nach Bezahlung**; ebenso fehlen pro Fahrt exakte Leer-/Reise-/Warte-Arbeitsanteile und die zum Angriff **vor** Frachtbergung/-vernichtung tatsächlich geladene Ware. Ein `cargo: {}` im bisherigen Verlust-Hook kann bereits **nach** dem Piratenzugriff liegen und beweist daher keinen Ladungsverlust von null. Die B6e-Warenlot-Kosten werden bei gleichzeitig offenen Lots im Runner teils **mehrfach zugerechnet**; deshalb ist die **Eigentümer-Gesamtsumme** belastbarer als die Addition einzelner `closeoutSamples`.

**[HYPOTHESE]** Hier überlagern sich mindestens ein **negativer Transport-Vollkostenbeitrag** (bestätigt für dieses Fenster), **frühzeitige fehlende Arbeitsliquidität** und **späterer Hüllentotalschaden**. Welche einzelne Route oder Käuferstation zusätzlich bindet, ist noch offen. Bezahlter ziviler Endabsatz / begrenzter Außenexport gemäß Draft #55 könnte **systemische** Käuferkaufkraft verbessern, löst aber nicht von selbst nachweislich defizitäre Transportkosten. Keine Preis-, Lohn-, Kredit-, Gebühren-, Save- oder Geldquellenänderung aus diesem Einzelbefund ableiten.

## 4. Nur noch ein gezielter B6f-Ereignistrace als optionale Folgeanalyse

**Einzige weitere erforderliche Rechnung – falls nach diesem Befund noch nötig:** historischer **`handel-flotte`-Seed 42**, genau **Kontrolle gegen B6e-Kreditvariante**, nicht 13 weitere Seedserien. Einen schreibfreien Beobachter an den unveränderten v14-Kern hängen, mindestens für Tick **130620–132300** (mit kurzer Vor-/Nachprüfung):

1. Pro `sh112`-Einkauf/-Verkauf: Tick, Ware, Menge, Quell-/Zielstation, Warenwert, beide Gebühren, Frachter-/Stations-Cash **vor/nach** Zahlung, Ladung und verbleibende Möglichkeit des Folgeankaufs.
2. Pro Stundenabschluss: fällige/bezahlte Frachterarbeit, Arbeitsminuten, Kasse vor/nach Zahlung, Phase/Route, offene Warenlots, Kreditrest und Test des vorhandenen 750-ISK-Tilgungsfensters; nicht bezahlte Arbeit **als Beobachtungsgröße**, nicht als neue Produkt-Schuld.
3. Zum Verlusttick: Ladung **vor** Piratentransfer/-vernichtung, Verlustwert, Hüllenersatzpreis/Bestand und einzelner tatsächlicher zahlungsfähiger Käufer; danach Tilgung und Folgefahrtfähigkeit.
4. Exakte unabhängige **Reconciliation** auf vorhandene Summen: **44 Käufe, 49 Verkäufe, 1.514 ISK Handelsüberschuss, 7.000/2.114/4.886 ISK Arbeit, 780 ISK Hülle, 1.380/0 ISK Kredit**, gleichbleibende Core-Hashes und Geld-/Warenaudit. **Sofort abbrechen**, falls Instrumentierung Core-Zustand, RNG, Speicher- oder Replay-Ergebnis verändert.

**Status / Gate:** Dieser **B6f-P0-Archivaudit ist eine abgeschlossene Auswertung bestehender Daten**, noch **kein vollständiger Ereignistrace B6f** und kein produktiver Test. Die negative Vollkostenbilanz im konkreten Kreditfall ist nun belegt; die ausführliche Ursachenzerlegung je Station/Route bleibt offen. Kein Merge von B6e-Analysecode und keine erneute ungerichtete Simulation. Danach höchstens **eine** konkrete, falsifizierbare H1/H3-Mechanikhypothese separat zur Freigabe vorlegen.
