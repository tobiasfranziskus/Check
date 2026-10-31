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


## 5. [TEST/ANALYSE] B6f-P1 – Einzel-Ereignistrace abgeschlossen (31.10.2026)

**Neue Ausführung, ausschließlich für den nachweislichen B6e-Einzelschiff-Fall:** [GitHub Actions #41187074656](https://github.com/tobiasfranziskus/Check/actions/runs/41187074656), finale [PR #56](https://github.com/tobiasfranziskus/Check/pull/56)-Branchversion des read-only-Tracers `tools/analyse-b6f-trace.mjs`. **1 CI-Job erfolgreich, 67/67 Standardtests**, 0 Fehlschläge/Skips. Zwei Reproduktionen **Kontrolle vs. B6e-Kredit** derselben ursprünglichen B1-Spielerfolge `handel-flotte`, Seed 42, **je 275 Tage**; insgesamt 550 Tageshashes, **13.200 stündliche Hash-/Geld-/Warenaudits**, **32 Save/Load-Roundtrips**. Original-B1-Regel-12-Start-Hash `bb4b5db1d442541b` identisch in beiden Fällen, alter Core-`sourceSha256` `035fe8b486ff2d515ca6379ad682b4b15d89d5d051866e287425ed425e1cbfc9`, Kreditvariant-`variantSha256` `50d83075bda5d5cef20ed8bdc9ae8a8b6c1ab7bc8976748b4458933682bbde00` – identisch zum archivierten B6e-Original. **Kein** Standard-13-Seed-Raster, keine neuen Mechanik- oder Goldenänderungen.

Originaler neuer CI-Artefaktsatz: `b6f-seed42-sh112-eventtrace` (ID `13036129900`). Darin JSON für `control` und `credit` einschließlich `b6fTrace` / `b6fLoanTrace`. Der Beobachter erfasst nur Schiff **`sh112` UND Eigentümer `npc1`** im Tickfenster **130620–132360** (gleichlautende Schiff-ID anderer Eigentümer im Kontrolllauf gilt ausdrücklich **nicht** als dasselbe Schiff). **94** reale Handelsbewegungen inklusive Hüllenkauf, **28** Arbeitsevents, **30** Stunden-Snapshots, eine Verlustsequenz und die Kredit-/Tilgungsprüfungen; die Original-Cash-/Waren-/Hashprüfungen blieben erfolgreich.

### Tatsächliche Kette und Gegenkonten

1. **Tick 130620, einmaliger Kredit:** `st_meridian` **4.164→2.784 ISK**, `npc1` **0→1.380 ISK**. Anschließend echter Hüllenkauf an `st_aldera` für **780 ISK** inklusive Gebühr; **600 ISK** operative NPC1-Kasse. Der Kredit ist kein Geschäftserlös, keine `minted`-Emission und bleibt mit **1.380 ISK** offen.
2. **Erste Warenfahrt:** Tick 130621 Kauf **9 Erz für 72 ISK** in Aldera; Tick 130676 Verkauf für **99 ISK** an Meridian. Danach Kauf von **14 Nahrung für 588 ISK** in Meridian. Wegen lokaler Käufergrenzen wird diese Ladung erst in mehreren Tranchen verkauft: Tick 130731 **1 Nahrung** in Aldera (Käuferkasse **65→11 ISK**, **13 Einheiten** bleiben an Bord), Tick 130751 **6+1 Nahrung** in Dravos (Käuferkasse **338→44→2 ISK**, **6 Einheiten** bleiben), Tick 130771 **4 Nahrung** in Veldra, Tick 130801 die letzten **2 Nahrung** wieder in Meridian. Summe: **684 ISK** Bruttoverkauf, **22 ISK** Verkaufsgebühren, also **74 ISK** Warenmarge nach Einkauf, aber vor allfälliger Arbeits-/Hüllenrechnung. Dies belegt konkret **Teilabsatz → Weiterreise**; nicht jede spätere Fahrt ist ausschließlich durch Käuferliquidität erzwungen.
3. **Erste Arbeitsabrechnung Tick 130680:** **250 ISK** fällig, nur **37 ISK** bezahlt; **213 ISK** bereits in der ersten Arbeitsstunde ungedeckt. Insgesamt **28 Stunden** mit je **250 ISK** fällig, **3 voll**, **25 nicht voll bezahlt**; fällige Summe **7.000 ISK**, bezahlt **2.114 ISK**, Rest **4.886 ISK**. Die Stundenabschlüsse sind im Trace jeweils während einer Reise; ihre Minuten wurden vom Original-Core berechnet, nicht vom Beobachter erfunden.
4. **Zahlungsfähigkeit der Ziele:** 49 Verkaufstransaktionen an fünf Zielstationen (Aldera 5, Dravos 11, Meridian 16, Orion 7, Veldra 10), **6** konkrete Transaktionen, nach denen Ladung verblieb und der verbliebene Stationscash **unter dem aktuellen Preis einer weiteren Einheit** lag. Das ist eine nachgewiesene Untergrenze für lokale Cash-Engpässe, keine Behauptung, alle 49 Verkäufe seien kaufkraftbegrenzt.
5. **Tilgung:** Bei **29 stündlichen** Kreditprüfungen innerhalb des relevanten Fensters lag die Schuldnerkasse nach Handels- und Betriebskostenabrechnung bei höchstens **270 ISK**, also immer unter der B6e-Restkassenregel von **750 ISK**. Vertragliche Tilgung blieb tatsächlich **0 ISK**. Andere Tilgungsregeln, Kreditverlängerung oder weitere Geldzuflüsse wurden nicht simuliert.
6. **Verlust Tick 132300:** Unmittelbar **vor** Piratenbeute-Ausbuchung lag `material: 5` auf `sh112`. Die **fünf Einheiten wurden in den Piratenmarkt `st_meridian` transferiert** (Lagerdelta +5, Material-Consumed-Delta **0**). Dieselbe Transaktion nahm **170 ISK** aus `st_meridian` (**3.132→2.962**) und gab sie an Eigentümer `pirates` (**204→374**). **Geldtransfer, keine Emission; Güterumverteilung, keine Vernichtung.** Das alte B6e-`losses.cargo={}` war ein **nach** dem Beutezugriff abgelesener Zustand und ließ diesen realen Frachtverlust für NPC1 unerkannt. Eine nächste Hülle war in Aldera physisch vorhanden (**2 Stück**), Kaufpreis erneut **780 ISK**, NPC1-Kasse **0 ISK**. Das Schiff wurde gelöscht, die Kreditforderung blieb offen.
7. **Bilanz-/Vollkostenergebnis bestätigt:** 44 Warenkäufe für **4.667 ISK** + 81 Gebühr, 49 Warenverkäufe für **6.415 ISK** −153 Gebühr, **+1.514 ISK Warenüberschuss**; nach **7.000 ISK fälliger Arbeit = −5.486 ISK**, einschließlich **780 ISK echter Hülle = −6.266 ISK**. Die nicht bezahlten **4.886 ISK** werden im heutigen Core **nicht als Schuld fortgeschrieben** und dürfen nicht als Gewinn behandelt werden. Nicht bilanziert als Kostenbestandteil: hypothetische Versicherungsprämie, regulärer Kredit-Zins, künftige Schiffsersatzreserve – diese würden das Ergebnis nur weiter verschlechtern. Der Wert der fünf geraubten Materialeinheiten ist bereits über tatsächliche Warenkäufe innerhalb des Handelsflusses finanziert; **nicht noch einmal zusätzlich als voller Anschaffungspreis abziehen** (Doppelzählung vermeiden).

### Technischer Fehler im ersten B6f-Prüflauf ausdrücklich protokolliert

[Vorläufige CI #41186848119](https://github.com/tobiasfranziskus/Check/actions/runs/41186848119) war **rot**, obwohl beide 275-Tage-Läufe jeweils erfolgreich durchgelaufen waren: Der nachgelagerte JSON-Assertion-Code erwartete ein explizites `repaid: 0`, während die ursprüngliche B6e-`Probe` den Nullzähler bei ausbleibender Rückzahlung **gar nicht initialisiert**. Zusätzlich hatte die allererste Kontrollspuren-Filterung die bloße Schiff-ID `sh112` ohne Eigentümerwechsel berücksichtigt. Diese zwei **Beobachter-/Validierungsfehler** wurden auf dem Analysebranch korrigiert (keine Produktverhaltensänderung); danach **kompletter zweiter CI-Lauf #41187074656 erfolgreich**. Nur dieser zweite Lauf ist der finale Nachweis.

### [ANALYSE] Folgerung / Abbruch- und nächster Hypothesengate

**Für diesen Einzelfall bestätigt, nicht auf alle Wirtschaftswelten übertragen:** Der Handel ist vor Schiffsverlust deutlich **nicht vollkostendeckend**, auch unabhängig von der (ebenfalls belegten) erst nachgelagerten Piratenbeute. Lokal kaufkraftarme Stationen zwingen in konkreten Fällen Teilverkäufe und Weiterfahrten. Eine bloße zweite Hülle, rein pauschaler Piratenschutz, erzwungene Rückzahlung, höherer Kredit oder „mehr Gewinn“ durch nur **bezahlte statt fällige** Stundenarbeit wäre eine Scheinkorrektur. Die B6e-Hypothese „Kredit ermöglicht dauerhaften Wiederanlauf“ ist für diesen Fall **widerlegt**.

**Engster nächster EINER Kandidat [OPTION, keine Implementierungsfreigabe]:** H1 – **gedeckelter tatsächlich bezahlter ziviler Endverbrauch** an bestehenden Verbrauchsstationen, monetär ausschließlich für wirklich abgebuchte Nahrung/Medikamente und an die betroffene Stationskasse. Erst ein vorab fixiertes, weltweites externes Budget und genaue `minted`-Gegenbuchungen spezifizieren; **nicht** 1.140 ISK/Stunde ungekappte Vollpreis-Emission übernehmen. Vergleichsfrage: Wird durch Endnachfrage nicht nur Kasse bewegt, sondern lassen sich reale Handelswaren mit weniger erzwungenen Teilabsätzen bei **voller 250-ISK/h-Frachterkostenrechnung** und ohne Einzelrettung liefern? **Abbruch**, wenn Emission nur nominell Liquidität vermehrt, Kostenunterdeckung kaschiert oder ein positiver Umsatz nur mit unbeglichener Arbeit entsteht. Weiterhin vollständige Phase-B-Gates vor Produktauslieferung. H3-Routenvollkosten-Entscheidung separat **erst nach diesem gesamtwirtschaftlichen Finanzierungsbefund** untersuchen; eine bloße Sperre negativer Fahrten könnte die Versorgung verschlechtern.

**Integrationsstatus:** ausschließlich `tools/analyse-b6f-trace.mjs`, eigene Analyse-Workflowdatei und Dokumentationsänderungen in **Draft #56**; `index.html`, `main`, Schema, Goldenwerte, B6e-Originalbranch, Geldmodell-B-Draft #55 unangetastet. Kein iPad-/NAS-Test oder Deployment. **Nicht mergen ohne ausdrückliche Freigabe.**

