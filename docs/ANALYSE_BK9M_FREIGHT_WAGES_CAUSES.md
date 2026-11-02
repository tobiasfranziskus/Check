# B-K9m – Original-Frachterarbeit: echte Kostenursachen und Leerflug-Gegenprobe

**02.11.2026 · [ANALYSE/ARCHIV] PR #105 · NICHT integriert.**

**[MAIN] `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`**, Aphros Void v0.12.5, Regel14/Schema8. Verbindlich ist ausschließlich `docs/ROADMAP.md` auf **main**. Die hier verwendeten Analysepatches verändern Original-JavaScript nur zur Laufzeit im **Node-Testprozess**. Weder `index.html` noch die produktiven Regeln, Preise, Kassen, Betriebskosten, Schiffserzeugung, Save-Formate oder die tatsächlichen originalen Buchungen wurden im Git-Branch verändert.

## Ziel

Nach [B-K9l #104](https://github.com/tobiasfranziskus/Check/pull/104) blieb die Handelswirtschaft auch bei deutlich strengeren **Handelsangeboten** instabil: alle 13 aktiven Spielerkrisenseeds ohne Händlerfrachter, chronischer Mangel und reale ungedeckte Arbeiterkosten. B-K9m prüft, **welche tatsächlich geflogenen Fahrten diese Kosten erzeugen**, statt lediglich hypothetische Flugmargen zu schätzen.

## [TEST] Tatsächlich durchgeführte Originalkern-Messung

**[GitHub-CI #41392237832](https://github.com/tobiasfranziskus/Check/actions/runs/41392237832) – SUCCESS** auf Analysecode-Commit `cbacc64`. **67/67 originale Node-Regressionsprüfungen bestanden**. Zwei getrennte Analyseskripte:

- `tools/bk9m-frachter-arbeitsursachen-13x90.mjs`: **13 aktive Spielerkrisen plus 2 passive Kontrollen**, je **90 Tage**. Insgesamt **32.400 Stunden**, nach jeder Stunde Original-Geld-/Warenaudit plus unabhängig berechnete owner-cash-/Waren-Erhaltung; **90 Save-/Load-Hashes**; deterministischer 14-Tage-Replay, Seed7, Hash `5c2a383c934c724f` (Original-Zustand am Tag14, nicht historischer 90-Tage-Hash). Direkte, nicht manipulierende Diagnose des originalen `abflug`, jeder wirklichen `reise`-Arbeitsminute, des originalen `betriebskosten`-Fälligkeits-/Zahlungsbetrags, realem `handel` und tatsächlicher Schiffsentfernung.
- `tools/bk9m-leerflug-gegenprobe-13x90.mjs`: **13 Original-Kontrollwelten vs. 13 Welten**, in denen **nur** der zufällige Leerflug nach zwei erfolglosen Waren-Suchen testseitig durch ein Warten am Dock ersetzt wird. **26×90 Tage**, **56.160** volle stündliche Original-Core-/unabhängige Geld-/Waren-Audits und **156 Schema8-/Regel14-Save-/Load-Hashes**; Original-RNG wird bei Entscheidung für das Halten nicht verbraucht, weshalb die Vergleichswelten auseinanderlaufen können. Deterministischer Seed7-90-Tage-Replay, Hash `0a4aaf6dad321984`.

Die fünf Kategorien der **wirklich geleisteten Arbeit**: *neu eingekaufte Warenfracht*, *Weiterfahrt bereits unverkaufter Fracht*, *zufällige Leerfahrt nach erfolgloser Suche*, *Fehlkauf/Leerfahrt* (hier 0) und *bereits laufende Start-/Werftfahrt* (erst nachträglich beobachtet). Bei tatsächlichen Stundenblöcken mit zwei verschiedenen Fahrtarten werden die originalen ganzzahligen fälligen und gezahlten ISK **proportional nach den in diesem Stundenblock gemessenen Minuten mit deterministischer Rundung** verteilt; je Kategorie gilt nun exakt `faellig = bezahlt + ungedeckt`, weltweit gelten originale Konten- und Waren-Audits. **Noch vor einer stündlichen Lohnabrechnung zerstörte Schiffe** werden als gesonderte nicht mehr gebuchte Arbeitsminuten behandelt, **nicht** fälschlich als vom Original abgezogene Schulden. Die Kategorien erklären die Herkunft tatsächlich verlangter Arbeit, nicht jeweils das gesamte Nettoergebnis einzelner Warenreisen.

### 13 aktive 90-Tage-Krisenwelten: echte NPC1/2-Frachterarbeit

| Vorgang nach tatsächlichem Originalflug | Abflüge | Fällige Original-Arbeit | Tatsächlich bezahlt | Nicht bezahlt |
| --- | ---: | ---: | ---: | ---: |
| Neu eingekaufte Ware | **16.721** | **2.019.120 ISK** | **1.752.203 ISK** | **266.917 ISK** |
| Unverkaufte Ware weitertransportiert | **9.081** | **1.013.141 ISK** | **940.310 ISK** | **72.831 ISK** |
| Zufällige Leerflüge | **331** | **46.178 ISK** | **50 ISK** | **46.128 ISK** |
| Noch laufender Start-/Werftflug | 0 neu erfasste Abflugbefehle | **20.504 ISK** | **19.226 ISK** | **1.278 ISK** |
| **Gesamt** | **26.133 neue beobachtete Abflüge** | **3.098.943 ISK** | **2.711.789 ISK** | **387.154 ISK** |

Die 13 Original-Welten verlieren bis Tag90 sämtlich ihre NPC1-/NPC2-Frachter; kumulierte Mangelstunden pro Seed 35.369–36.105. Unbezahlte Arbeit ist im Originalkern **nicht** immer ein als ausstehende Geldforderung gespeicherter Schuldtitel: `m_core_stunde.betriebskosten` begrenzt die tatsächliche Auszahlung auf die besitzende NPC-Kasse und verwirft den nicht bezahlten Rest. Damit bleibt die Geldbilanz formal korrekt, obwohl Schiffe teilweise **real Arbeit leisten, die niemand bezahlt**.

**[URSACHE]** Von den **387.154 ISK** tatsächlich fälliger, nicht vollständig bezahlter Frachterarbeit stammen **266.917 ISK (~69 %)** aus regulären neuen Warenfahrten, **72.831 ISK (~19 %)** aus Weitertransport bereits an Bord verbliebener Ware und **46.128 ISK (~12 %)** aus zufälligen Leerfahrten. Der kleine verbleibende Anteil stammt aus Start-/Werftflügen. Damit liegt das Hauptproblem **nicht** allein bei Random-Repositionierung und nicht allein beim Warenpreis-Scoring: Noch nach tatsächlichen Handelsentscheidungen und während unverkaufter Folgeladungen fehlt im Verlauf das Geld für reale Arbeitsminuten.

**Passive Vergleichswelten**, Seed7 und Seed42 ohne aktive Spieler-Erzförderkrise: Frachterbestand am Tag90 jeweils **5**, noch positive NPC1/2-Kassen (**10.755 / 12.000 ISK**), **nur 1.209 / 949 ISK** ungedeckte Frachterarbeit trotz sehr vieler tatsächlicher Originaltransporte; Mangelstunden **57 / 58**. Das zeigt, dass die Krankheit im Spielerkrisen-Umlauf entsteht und nicht allein aus der Existenz einer Flugkostenpflicht.

### Isolierte Leerflug-Sperre: A/B-Ergebnis

| Tag90, jeweils 13 aktive Seedwelten | Unverändert | Nur zufällige Leerflüge unterbinden |
| --- | ---: | ---: |
| NPC1-/NPC2-Frachter am Ende (alle Seeds) | **0** | **0** |
| Händlercash, Median | **0 ISK** | **13 ISK** |
| Händlerarbeit nicht bezahlt, Summe über alle Seeds | **387.154 ISK** | **346.538 ISK** |
| Kumulierte Mangelstunden, Median | **35.817** | **35.766** |
| Kumulierte Mangelstunden, Summe | **465.413** | **465.117** |
| Handelsbuchungen, Summe | **90.861** | **91.439** |
| NPC-Händler-Schiffsverluste, Summe | **258** | **256** |
| Ersatzkäufe, Summe | **193** | **191** |

Mangelstunden verbessert in **4/13 Seeds**, verschlechtert in **3/13 Seeds**, unverändert in **6/13 Seeds**. Ungedeckte Händlerarbeit verbessert in **4/13 Seeds**. Der kumulierte Unterschied von **40.616 ISK** ist **nicht** die kausal gleichzusetzende Ersparnis der 46.128 ursprünglichen Leerflug-ISK: Die abweichende KI-Entscheidung verändert RNG-Fortschritt, Warenströme, Verlust- und Kaufhistorie. **Keine wirtschaftlich stabile Händlerflotte** in irgendeinem Seed. Eine separate vollständige Leerflug-Sperre sollte daher **nicht** als ausreichend oder produktreif gelten.

## Bewertung der tatsächlichen Ursachen und nächstes enges Teilziel

**[NEGATIV]** Reine optimistische Handels-Routenwahl (#104) oder bloßes Unterbinden zufälliger Leerfahrten (#105) schließen die Gesamtwirtschaft und den mit Spieler-Sparen verschärften NPC-Liquiditätskreislauf nicht. Beide verursachen bei anderen Seeds wiederum andere Versorgungslücken, während die Traderflotten durchgehend verschwinden.

**[OPTION B-K9n]** Keine zusätzliche synthetische Nachfrage oder neue ISK-Regel; zunächst eine **einzige, originalweltfähige** tatsächlich vorfinanzierte **Arbeitsreserve je Fahrt vor dem Abflug**, **auch wenn Waren bereits an Bord liegen**, testen. Es darf für alle normalen Flüge kein unfinanzierter Teil der Originalarbeit begonnen werden; bei fehlenden Mitteln bleibt das Schiff am Dock oder eine offene Restfracht muss kaufmännisch abgeschrieben werden – niemals still zu Gratisarbeit oder Doppelverkauf werden. Diese Variante darf **zunächst nur als Simulation** existieren. Ein offener wichtiger Randfall: Arbeit auf einem durch Piraten zerstörten Schiff vor dem Stundenabschluss; diese Minuten werden heute teils nie als originaler Lohn abgerechnet. Eine echte Spielregel zum Verlustzeitpunkt wäre separat zu definieren.

**Notwendige Testgates:** ursprünglicher echter Quell-/Zielhandel, Anfangs- und Endcash je Owner, bezahlte Stundenkosten, zerstörte/ersetzte Hüllen, tatsächliche Lagerabnahme, Geld-/Warenledger, Save/Load und **13×90 Tage aktive Krisen** versus unverändertem Original. Entscheidend ist Gesamtwirtschaft: keine Nullflotte, keine chronische Unterversorgung, keine Gratisrettung. Eine technische Verbesserung von nur 12 % der ungedeckten Arbeit wäre kein ausreichendes Produktziel.

**[REPOSITORY]** Testcode gehört nicht nach `main`; PR nach Abschluss dokumentiert schließen. Kein Merge, kein Deployment, keine Produktschemaänderung, kein Spieler-Sparlimit. CI ersetzt keine iPad-/NAS-Abnahme.
