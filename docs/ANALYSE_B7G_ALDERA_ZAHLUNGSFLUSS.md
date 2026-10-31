# B7g – Reale Kaufkraft nach der ersten Siliziumlieferung: durchgehendes Aldera-Kassenjournal

**31.10.2026 · [ANALYSE/DRAFT] · Produktcode unverändert.** Der verbindliche Produktplan bleibt `docs/ROADMAP.md` auf `main`; der Dokumentationsentwurf #55 und der laufende Analyse-PR #60 werden **nicht** ohne Freigabe integriert. B7g prüft den bereits in B7f tatsächlich ausgeführten Konzernhandel Seed42 und klärt, ob **Aldera nach dem Siliziumkauf dauerhaft zahlungsunfähig** bleibt, oder ob bei fortlaufend rentabler Nachfrage ein **Handelsauftrag fehlt**.

## [TEST] Umfang und technische Absicherung

**[CI #41200268573](https://github.com/tobiasfranziskus/Check/actions/runs/41200268573)**: 1/1 GitHub-Job erfolgreich; **67/67 Standardtests**, 5 tatsächlich ausgeführte Weltläufe: Regel14-Kontrolle/B7b-Walletvariante je **10 und 90 Tage**, eine zusätzliche B7f-Walletvariante mit einem real bezahlten NPC3-Frachter über **90 Tage**. Erneut **6.960 stündliche unabhängige Geld-/Waren-/Replay-Hash-Audits, 290 Tageshashes und 58 Save/Load-Roundtrips**; alte Hashes bleiben unverändert (B7b Tag90 `82f11deee8c7f566`, Original Tag90 `784047684dfe5c56`) und der B7f-Endhash ist weiterhin `23eb3796fb0b5ec3`. Regel14, Schema8, Index/Produktdateien, Schiffs-/Eigentumsregeln und echte Spielstände nicht geändert.

Im Instrumentationspfad `tools/analyse-b7b-gemeinsame-konten.mjs` wurden zusätzlich **die Phasen im ursprünglichen `m_core_step.step` einzeln beobachtet**: `validated-commands`, `ankunft`, `foerderung`, `entscheidung`, `reise`, `produktion`, `betriebskosten`, `ersatzkauf`, `npcAusgaben`, `fonds` usw. Der Beobachter liest die komplette Aldera-Owner-Kasse **vor/nach jeder Phase**, speichert nur echte Veränderungen sowie zeitgleiche Änderungen aller anderen Geldkonten. Keine zusätzliche Wirtschaftsentscheidung und keine Simulation aus dem Beobachter. **43 echte Aldera-Kassenänderungen**, numerisch lückenlos: Beginn Tag15 **1.603 ISK**, Schluss Tag90 **1.926 ISK**.

## Vollständige, nach Kernphase abgeglichene Stationskasse

| Geldfluss Aldera ab Tag15 | ISK | Echte beobachtete Ereignisse |
|---|---:|---:|
| Einzahlung aus **realen Frachter-/Miner-Hüllenkäufen** (Kernphase `ersatzkauf`) | **+3.870** | **5** |
| Einzahlung aus **Fondsauffüllung/-verteilung** (Kernphase `fonds`) | **+1.160** | **11** |
| Zahlung für **Siliziumanlieferung** (Kernphase `ankunft`) | **−2.365** | **1** |
| Zahlung für **tatsächliche geförderte Ware** (Kernphase `foerderung`) | **−2.342** | **26** |
| **Kassensaldo** | **+323** | **43** |

Nachweis: **1.603 + 3.870 + 1.160 − 2.365 − 2.342 = 1.926 ISK**. Gebühren werden **nicht** mit Warenwert verwechselt: Händler- und Schiffskonten sowie Fonds erhalten ihre tatsächlich gebuchten Gebühren; die Tabelle zeigt *nur den Saldo von Alderas Stationskasse*, vollständig nach den beobachteten Core-Phasen. Fondsauffüllung und Schiffskäufe sind **echte Umlagerungen vorhandener ISK**, keine neue Emission. Die früher behauptete **dauerhafte** Käuferzahlungsunfähigkeit Alderas nach dem ersten Handel ist für diesen Seed42/B7f-Lauf **widerlegt**.

### Wann wird die Siliziumroute wieder profitabel?

| B7f-Zeitpunkt | Aldera Barbestand | Nach echtem Kern `aufnehmbar` finanzierte Silizium-Menge | Kalkulierter Überschuss Dravos→Aldera (Handelsgebühren, gerundete beladene Arbeit) | NPC3-Schiff |
|---|---:|---:|---:|---|
| Tick **21.702**, unmittelbar nach erster echter Lieferung | **18** | unter dem Preis eines Siliziums | Kein unmittelbarer zweiter Kauf | `sh131` dockt in Aldera |
| **Ende Tag16** | **1.053** | **24** | **+317 ISK** | `sh131` dockt leer in Aldera, Auftrag `halten` |
| **Ende Tag17** | **1.926** | **44** | **+790 ISK** | derselbe bezahlte Konzernfrachter, Auftrag `halten` |
| **Tage18–90** | **1.926** | **44** | **+790 ISK** (unveränderter Marktzustand dieser Route) | Frachter bleibt untätig in Aldera |

Die Dravos-Stationsreserve ist am Tagesende 16/17 erneut **65 Silizium**; auch Nadir hätte entsprechend eine profitable 44er-Fahrt zu Aldera (**+698 ISK** nach Gebühren/beladener Fahrt). Das sind **Marktangebote zu Tagesmomenten**, keine tatsächlich gefahrenen zweiten Transportaufträge. Für die Dravos-Route am Tag17 sind zusätzlich mindestens **250 ISK für den leeren Hinflug** zum Quellmarkt zu veranschlagen, sodass aus dem reinen Einwegüberschuss **rechnerisch ca. +540 ISK vor Piraterie/Risiko und weiteren Zeit-/Preisänderungen** werden könnten. Benötigte bereits berechnete Vorfinanzierung für Einkauf und beladene Fahrt **1.027 ISK**, plus Leerflug **250 ISK**. NPC3 besitzt an Tag17 **2.250 ISK freie Konzernkasse** und damit nominell **1.277 ISK**, braucht allerdings auch Miner-Rücklagen und hat keinerlei Garantie positiver Ist-Rendite. Der Markt kann also nach dem ersten echten Kauf **eine zweite profitable Route mit Käufercash** bieten. Ob der tatsächliche Flug rechtzeitig abnimmt, bleibt ungetestet.

**[BESTÄTIGTE, konkrete Nichtaktivierung]:** Der B7f-Versuch wies dem real bezahlten NPC3-Frachter bei der Neuerstellung bewusst den Auftrag `halten` zu. Obwohl `m_core_commands.shipHandeln` und die bestehende `m_core_entscheidung.bestesPaar` bereits einen gemeinsamen autonomen Handelsmodus besitzen, wird dieser **bei diesem Schiff nicht aktiviert**, und der NPC3-Konzern besitzt in `main` keine Entscheidung, selbst neue Frachter-Sollplätze samt `handeln`-Auftrag aufgrund realer Marktchancen anzulegen. Daher beweist B7f **weder**, dass eine bestehende voll finanzierte Händler-KI eine profitable Folgefahrt ablehnt, **noch**, dass automatische Branchexpansion heute funktioniert. Er beweist aber: **Bei dem einmal eigens gekauften NPC3-Schiff könnte eine erneute rentable Fahrt aus vorhandenem Kapital und realer Käufernachfrage möglich sein.**

## Trennung von gesamtwirtschaftlichen Ursachen

- **[BESTÄTIGT]** Niedrige Käuferkasse unmittelbar nach Verkauf ist *kein dauerhaftes* Käuferproblem: reale Ersatzschiffkäufe/Fondsströme füllen Aldera binnen Tagen wieder auf. Nicht aus „18 ISK nach Kauf“ schließen, jede Folgefahrt sei unmöglich.
- **[BESTÄTIGT]** Ein freier, im Testfall ausdrücklich auf `halten` gesetzter NPC3-Frachter wird nicht automatisch tätig. Ein Teil des beobachteten Stillstands ist **Auftrags-/Investitionsautomatik**, nicht nur das Preis- oder Geldregime.
- **[BESTÄTIGT]** Trotz tatsächlicher Finanzflüsse bleibt der weltweite zivile **Nahrungs-/Medikamentenverbrauch ab Tag15 aus**. Die Rückkehr von Alderas Bauteil-Rohstoffkäufen bedeutet nicht, dass die *anderen* fünf bedürftigen Stationen wieder zahlen können. **Modell B gesamtwirtschaftliche, nicht individuelle, reale Endnachfrage** bleibt getrennt zu prüfen.
- **[NICHT BESTÄTIGT]** 44 Silizium und ein positiver Momentüberschuss garantieren keinen mehrfach wiederkehrenden profitablen Handel nach realen Preisänderungen, Verlusten, Betriebskosten und anderen Warenbewegungen. Die Chance kann bei wiederholtem Verkauf die Käuferkasse vorübergehend erneut leeren. Keine Aussage über alle 13 Seeds.

## Nächstes kleines Gate – nur nachgelagerter isolierter Versuch

**B7h [ANALYSE/OPTION]:** An exakt dem bestehenden NPC3-`sh131` (keine neue Hülle, keine neuen Akteure/ISK/Preise und **kein persönliches NPC-Pilotenschiff**) den **bereits vorhandenen validierten `shipHandeln`-Befehl** statt `halten` aktivieren und mit der unveränderten B7f-Welt vergleichen: Wählt der unveränderte `bestesPaar`-Kern eine profitable Folgefahrt, wie viele real finanzierte Warenverkäufe folgen, wer erhält den Erlös, und bleibt NPC3-Minerbetrieb dauerhaft finanziert? **Im ersten kleinen Einzelgate** zunächst nur Seed42; bei positivem Ergebnis eigenständige 13-Seed/90-Tage-Prüfung erwägen. Bitte unterscheiden, dass die bestehende KI derzeit Gebühren-/Nominalmarge berücksichtigt, aber **nicht** sämtliche Reise-/Piraten-/Hüllenrisikokosten; grüner deterministischer Lauf ist **keine** Freigabe eines autonomen Investmentmanagers.

**Status:** Nur PR #60 [DRAFT/ANALYSE]. PR #55 nur Roadmap-Draft. `main` unverändert `517728a9`; keine Regel-/Save-/iPad-/NAS-Freigabe, kein Merge.
