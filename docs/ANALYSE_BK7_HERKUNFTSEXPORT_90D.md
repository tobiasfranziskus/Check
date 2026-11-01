# B-K7 – 8 Originalwelten × 90 Tage: Herkunftsbeleg, gedeckelter Export und Käuferliquidität

**01.11.2026 · [ANALYSE/DRAFT] [PR #91](https://github.com/tobiasfranziskus/Check/pull/91) · KEIN PRODUKTMERGE**

## Prüfbasis und konkrete Eingrenzung

- **[MAIN]** \`b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c\`, v0.12.5 / Regel14 / Schema8, unveränderte \`index.html\`.
- **[TEST]** [GitHub Actions #41331644316](https://github.com/tobiasfranziskus/Check/actions/runs/41331644316): eigenständiger Node-22-Wirtschaftsjob. \`tools/bk7-herkunft-export-90d.mjs\` enthält sämtliche hypothetischen Fälle, Original-Core-\`advance\` sowie prüfbare Herkunfts- und Zahlungsbuchungen.
- **8 reale Original-Core-Spieler-Miner-Welten**: 2 Seeds (7, 42) × vier Bedingungen × **90 volle Spieltage** = **17.280 Wirtschaftsstunden** mit jeder Stunde Original-Core-Audit und unabhängigem Gesamtgeld-/Warenabgleich; dazu 2 deterministische 90-Tage-Replays auf den niedrigen Exportfällen. Keine 13-Seed-Generalisierung, kein tatsächlicher iPad-/NAS-Test.
- Aus \`m_core_produktion.produktion\` wird ausschließlich für den Test beim **Original-Rezeptabschluss** eine analytische Ereignisfunktion aufgerufen. Die neu erzeugte Nahrungsware wird *im selben Schritt* aus dem Stationsbestand und in \`ledger.exported\` gebucht. **Nur dann** darf die zugehörige, gedeckelte externe Leistungsauszahlung an \`st_cyris\` erfolgen und \`state.minted\` steigen. Bereits vorhandene Startlager-Nahrung, andere Stationen und unverkaufte Produktion können keine Export-ISK erzeugen. Ein Negativtest mit deaktivierter Cyris-Linie bestätigt **0 Auszahlungen trotz vorhandener 52 Nahrung**.
- Der bezahlte Export in Cyris ist eine **nur analytisch angenommene direkte externe Warenabnahme am Produktionsort ohne Frachter**. Er ist **keine** durchgerechnete echte Transportleistung und ohne geographische Genehmigung nicht produktiv übertragbar. Keine Bürgerlöhne und keine Konsumzahlungen eingeführt.

## Experimentalbedingungen – keine freigegebenen Geldregeln

| Variante | Physisch ausgeführter Neue-Nahrungsexport | Geld je Stück | Maximal/Tag | Globaler Emissionsdeckel |
| --- | --- | ---: | ---: | ---: |
| Original | kein zusätzlicher Export | 0 | – | 0 |
| Unbezahlt | höchstens 6/Tag | 0 | 0 ISK | 0 |
| Niedrig | höchstens 6/Tag | 35 ISK | 210 ISK | 10.000 ISK |
| Höher | höchstens 20/Tag | 35 ISK | 700 ISK | 50.000 ISK |

35 ISK ist ein **reiner Kontrollpreis**, kein Beschluss, kein nachgewiesener marktgerechter Nettoerlös. Export-/Geldbeträge entstehen nur bei belegten Original-Fertigungsereignissen, nicht als pauschaler Tagesbonus oder Rettungszahlung. Die Emissionskontrolle wird getrennt von existierenden Kopfgeld-ISK erfasst.

## Tatsächlich gemessene Endstände, Tag 90

| Seed | Variante | Neue Nahrungs-Exporte | Extra-ISK | Spieler-ISK | Stations-ISK | NPC1/2-Händlerfrachter | Mangelstunden |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 7 | Original | 0 | 0 | 41.228 | 7.204 | 0 | 35.993 |
| 7 | Unbezahlt | 48 | 0 | 40.748 | 3.668 | 0 | 35.797 |
| 7 | Niedrig | 60 | 2.100 | 44.430 | 6.698 | 0 | 35.731 |
| 7 | Höher | 280 | 9.800 | 48.012 | 5.429 | 0 | 35.154 |
| 42 | Original | 0 | 0 | 42.795 | 5.238 | 0 | 35.798 |
| 42 | Unbezahlt | 48 | 0 | 39.051 | 7.134 | 0 | 36.028 |
| 42 | Niedrig | 60 | 2.100 | 44.073 | 3.798 | 0 | 35.588 |
| 42 | Höher | 220 | 7.700 | 47.308 | 7.328 | 0 | 35.248 |

**[NEGATIVER PRODUKTBEFUND]** In allen **acht** Fällen verlieren die NPC1/2-Händler bis Tag14 ihre gesamte Frachterflotte, und **am Tag90 stehen überall null Händlerfrachter**. In den hohen bezahlten Fällen reduziert sich die gesammelte Versorgungslücke gegenüber Original nur um **839 Stunden (Seed7)** bzw. **550 Stunden (Seed42)** bei über 35.000 Mangelstunden. Niedrige Zahlungen reduzieren sie nur um **262/210 Stunden**.

**[NEUER POSITIVER URSACHENBEFUND]** Die 10.000- bzw. 50.000-ISK-Gesamtdeckel werden in **keinem** bezahlten Fall ausgeschöpft: im niedrigen Versuch nur 2.100 ISK (an zehn Exporttagen), im höheren 9.800/7.700 ISK (an 14/11 Exporttagen). Danach finden **keine neuen zertifizierbaren Exportlieferungen** statt. Es fehlt also nicht bloß eine höhere Emissionsobergrenze. Der produktionsgebundene Einkommenspfad versiegt, wenn reale Beschaffung/Produktion und Nachfragestrukturen kollabieren.

**[GELDVERTEILUNG]** Zusätzlich ausgezahlte ISK wurden korrekt in den Weltbestand gebucht, stellen aber keinen nachgewiesenen wiederkehrenden Finanzierungskreislauf für Käuferhaushalte, NPC-Frachterarbeit oder Schiffersatz her. Beispiel Seed7, höhere Vergütung: Spielerendkasse **48.012 ISK** (Original 41.228), Stationskassen zusammen **5.429 ISK** (Original 7.204), 0 Händler. Die Unterschiede sind gekoppelte Simulationsergebnisse, **keine** unvermischt kausale direkte Zahlung vom Export zum Spieler. Originaler Spielerbergbau und alle übrigen NPC-, Sicherheits-, Verbrauchs- und Handelsregeln laufen weiterhin; jeder Fall divergiert auch in Kampf-/Bounty-/Burn-Pfaden.

## Audit und methodische Grenzen

- Original-\`core.audit\` jede Stunde erfolgreich und davon unabhängige Summe aller Besitzerkonten = \`initialSupply + minted - burned\` (ausdrücklich einschließlich des Zusatzexports, vorhandenen Kopfgelds und weiterer Senken).
- Jede physische Ware: Stationslager + Schiffsladungen = \`initial + mined + produced + imported − consumed − exported\`.
- Test-Ereignisse: \`exportedUnits <= certifiedNewProduction\`, exakte Zahlung = 35 ISK je Export bei bezahlten Varianten, jeder Tages- und Gesamtdeckel eingehalten; Hash der wiederholten 90d-Niedrigvarianten für beide Seeds gleich.
- Startlager-Herkunft ist im Negativtest ausgeschlossen. Das analytische Exportereignis verwendet **die einzelne gerade im selben Tick fertiggestellte Einheit**; alte und neue Lieferware werden nicht nachträglich anhand eines ungenauen Welt-Ledger-Saldos als neu behauptet.
- Keine zeitaufgelöste, im normalen Produkt gespeicherte Charge-/Herkunfts-ID; kein verteilter Händlervertrag, keine externen Transportkosten, keine Bescheinigung eines späteren realen Marktexports.
- Kein produktiver Auftrag, Bürgerhaushalt, Miner-/Frachterkosten-Escrow, keine Regelmigration. Es gibt **keinen** Save-/Load-Nachweis einer zukünftigen Exportregel: das Analyse-Ereignis- und Budgetbuch lebt allein außerhalb des gespeicherten Originalzustandes. Eine echte Produktänderung bräuchte eine vollständige deterministische Speicherung und Migration.
- B-K7 zeigt die **Wirkung nur in zwei aktiven Spielerkrisen**, nicht im 13-Seed-Normalfall, in 365d-Läufen oder auf iPad/NAS.

## Projektleitungsbewertung / nächster gezielter Schritt

**[NICHT ZUR PRODUKTINTEGRATION GEEIGNET]** Eine direkte, zusätzliche Exportvergütung an Stationen, auch wenn ausschließlich wirklich neu produzierte Ware und korrekt begrenzte ISK ausgezahlt werden, heilt den Handel nicht. Einen solchen Emissionsmechanismus jetzt zu übernehmen, würde die dokumentierte Krise nur wenig verschieben. **Keine zusätzliche Emissionsregel freigegeben.**

**[OPTION NÄCHSTES GATE B-K8]** Rückwärts vom Endkundenauftrag zur Finanzierungskette: zuerst je Stunde **wer kauft neu produzierte Endwaren**, **welches Konto kann wiederkehrend Arbeitslohn/Endnachfrage bezahlen**, **wer finanziert Station-Rohstoff-Kauf und NPC-Transport**, und **welches Netto-Betriebskapital bleibt nach Schiffsersatz**? B-K6 zeigt die korrekte atomare Auftragsbuchung; B-K7 zeigt, dass ein bloßes zusätzliches Stations-Exportminting selbst bei korrekter Herkunft die Nachfrage und Flottenfinanzierung **nicht** heilt. Daher vor weiteren Emissions-Mengen-Tests **die Mittelverwendung und vollständigen Vertragskosten** anhand eines einzelnen zeitaufgelösten Lieferzyklus bis Tag14 untersuchen. Kein Spieler-Sparlimit, keine Individualrettung, kein unfinanzierter Pflichtauftrag.

**Status:** Analyse/Draft auf eigenem Branch, keine Integration, kein Produktcode geändert. Die allein verbindliche Phasenpriorität bleibt [ROADMAP.md](ROADMAP.md) auf main.
