# B7h – Autonome Folgefahrten eines bereits bezahlten NPC3-Konzernfrachters

**31.10.2026 · [ANALYSE/DRAFT], isolierter Test im PR #60, keine Produktänderung.** Referenz bleibt ausschließlich `docs/ROADMAP.md` auf `main`; die spielerische Vertragsvision im separaten Roadmap-Draft #55 bleibt: NPC-Piloten dürfen **nicht persönlich** Schiffe erwerben. Die einzige Änderung gegenüber B7f ist ein **validierter vorhandener `shipHandeln`-Befehl** für denselben bereits aus NPC3-Unternehmensmitteln erworbenen Frachter `sh131` unmittelbar nach seinem nachgewiesenen ersten 55-Siliziumverkauf. Es werden **keine** weiteren Frachter, NPC-Piloten, Kredite, ISK-Quellen, Preise, Pachtverträge oder Spielmechaniken hinzugefügt.

## Ausgangspunkt und ausgeführte Methode

[Vergleichs-CI #41208247134](https://github.com/tobiasfranziskus/Check/actions/runs/41208247134) [TEST, abgeschlossen: 1/1 Job und 67/67 Standardtests erfolgreich]: historische Regel14-Kontrolle 10/90 Tage, B7b mit gemeinsamer Spieler-/NPC1/2-Wallet jeweils 10/90 Tage, B7f mit exakt einem regulären NPC3-Schiffskauf und einer manuellen Siliziumlieferung 90 Tage, zusätzlich B7h auf **demselben Seed42, Spielerbefehlsband und derselben eingefrorenen Regel14-/Wallet-Quelle** über 90 Tage. Erwarteter Gate-Umfang, nach CI-Bestätigung: **6 Welten, 9.120 stündliche unabhängige Geld-/Warenaudits plus deterministische Replay-Hashes, 380 Tageshashes und 72 Save/Load-Roundtrips**; **67 Standardtests** im bestehenden separaten Workflow-Schritt. Alte B7b/B7f-Hashes werden unverändert kontrolliert. Im Analysetool wird **ein einziges** `m_core_commands.submit(...type:'shipHandeln'...)` für `sh131` an den Originalkern übergeben und identisch in das deterministische Replay gespiegelt. Die bestehenden Core-Funktionen `bestesPaar`, `abflug`, `handel`, `reise`, `ankunft/entladen`, `betriebskosten`, `ersatzkauf` bleiben unverändert. Alle Transaktionen gehören dem Konzern `npc3`, keinem NPC-Privatpiloten.

## [TATSÄCHLICH AUSGEFÜHRT] Eigengesteuerte Folgegeschäfte

- Bis einschließlich **Spieltag15** ist die B7h-Welt **bitgenau** identisch mit der B7f-Welt. Genau derselbe zuvor gekaufte `sh131` landet nach seinem ersten realen Verkauf **55 Silizium** am Tick **21.702** in Aldera; der erste Handel bleibt exakt unverändert. **Tick 21.703** wird der schon vorhandene Befehl `shipHandeln` aktiv.
- Bereits unmittelbar danach wählt die vorhandene Handels-KI **28 Silizium in Aldera** zum Kauf (**644 ISK** plus **25 ISK** Gebühren) und verkauft sie in Dravos (**1.008 ISK** brutto, **40 ISK** Verkaufsgebühren). Die Entscheidung kehrt also gegenüber der ersten Dravos→Aldera-Fahrt sogar die Richtung um, als sich die Preise verändert haben.
- In diesem Seed42-B7h-Lauf protokollierte derselbe NPC3-Frachter einschließlich erstem Handel **61 reale Waren-Einkäufe und 64 reale Waren-Verkäufe**, zusätzlich den einen Schiffskauf. **60 neue Wareneinkäufe und 63 neue Warenverkäufe** nach dem ersten B7f-Siliziumverkauf. Damit ist die Behauptung „die aktivierte Handels-KI findet keine weiteren Geschäfte“ **widerlegt**.
- Während der Folgefahrten transportiert er neben Silizium auch **Material, Bauteile, Erz, Nahrung und Medikamente**; sämtliche Einnahmen/Gebühren werden im bestehenden Core tatsächlich gebucht, nicht vom Analysewerkzeug erfunden.
- Beobachterseitig ergeben sich bei NPC3-Frachtern über alle bis zum Verlust abgewickelten Warenhandelsvorgänge **16.138 ISK Einkaufwert, 274 ISK Einkaufgebühren, 22.522 ISK Verkaufswert und 669 ISK Verkaufsgebühren**, also **5.441 ISK nominaler Warenhandelsüberschuss nach Gebühren, aber ausdrücklich VOR vollständiger Frachterarbeit, Leerflügen, Minergehältern, Schiffsersatz und Verlusten**. Die bisherige Lots-Zuordnung bewertet **21 abgeschlossene Warenpartien nach ihren zugerechneten Arbeitsschritten positiv, 40 negativ**; diese Klassifikation ersetzt keine vollständige zeit- und schiffsübergreifende Deckungsbeitragsrechnung. **Das Preisvergleichssignal ist aktiv, aber die Auswahl nach voller Betriebs-/Risiko-/Kapitalreserve muss separat geprüft werden.**
- Ab etwa **Tick 24.420** meldet der NPC3-Kern erstmals **nicht bezahlte Arbeit**. Ab **Tag18** ist die NPC3-Unternehmenskasse bei **0 ISK**, während die realen Sollstunden der NPC3-Miner/Frachter weiter auftreten. Der Frachter `sh131` geht schließlich an **Tick 29.220 (Tag 21)** verloren. **Der Verlustpfad ist ein echter Core-Weltverlauf, aber die Kausalität (Piratenangriff vs. andere Verlust-/Kassenmechanismen) ist mit der derzeitigen B7h-Beobachtung allein nicht abschließend belegt.** Die eine Test-Sollposition wird nach Verlust entfernt: **keine kostenlose Neubeschaffung**.

## 90-Tage-Vergleich

| Kennzahl | B7f: gleicher NPC3-Frachter mit `halten` | B7h: `shipHandeln` nach erster Lieferung |
| --- | ---: | ---: |
| Tatsächlich realisierte NPC3-Wareneinkäufe/-verkäufe | **1/1** | **61/64** |
| Produktionsabschlüsse | **7.022** | **7.161** |
| Tatsächlich ziviler Nahrungsverbrauch | 3.744 | **3.882 (+138)** |
| Tatsächlich ziviler Medikamentenverbrauch | 675 | **693 (+18)** |
| Tatsächlich ziviler Bauteilverbrauch | 1.504 | **1.543 (+39)** |
| Versorgungstage mit irgendeinem Nahrungs-/Medikamentenverbrauch | 14 | **16** |
| Mangelstunden | 36.085 | **36.000 (−85)** |
| NPC3 freie Kasse Tag90 | **2.250 ISK** | **0 ISK** |
| NPC3 Miner/Frachter Tag90 | **9 / 1** | **9 / 0** |
| Über alle beobachteten NPC-Klassen tatsächlich fällige Arbeit | 244.463 ISK | **262.922 ISK** |
| Tatsächlich bezahlte Arbeit | 244.463 ISK | **255.632 ISK** |
| **Ungedeckte Arbeit gesamt** | **0 ISK** | **7.290 ISK** |
| NPC3 individuelle Stundenereignisse mit ungedeckter Arbeit | 0 | **80** |
| Original/B7f Endhash | `23eb3796fb0b5ec3` | B7h `6573a3c1acc3d5a5` |

**[BEWERTUNG: EINZEL-SEED GESCHEITERT]** Die vollständig aktivierte KI handelt wirklich, erhöht kurzfristig den Warenfluss und belebt sogar die zivile Versorgung für **zwei zusätzliche Tage**. Aber der neu aktive Handelszweig ist **nicht liquide tragfähig**: Die Kosten und Risiken belasten die gesamte NPC3-Miner-/Frachterkasse, unbezahlt bleibende Arbeit tritt wieder auf, NPC3 wird bankrott, der Frachter geht verloren. Es wäre falsch, „mehr erfolgreiche Kauf-/Verkaufsbuchungen“ mit „nachhaltig profitabler Konzern und Versorgung“ gleichzusetzen. Das Experiment bedeutet **keine Freigabe** für automatische Konzernexpansion oder Pachtpilotensystem.

**[URSACHEN, DIE GETRENNT WERDEN MÜSSEN]** Die aktuelle `m_core_entscheidung.bestesPaar` bewertet bei der Auftragswahl **den nominalen Preisunterschied nach Marktgebühren** und die Reisezeit, aber **nicht die volle erwartete bezahlte Arbeit, notwendige Hin-/Rückpositionierung, Betriebskapitalreserve der bestehenden Miner, Verlust-/Hüllenrisiko oder Kassen-Doppelbindung**. Der vorliegende B7h-Verlauf unterstützt diese Problemdiagnose, weist aber **nicht isoliert jede Komponente als individuellen Kollapsverursacher** nach. Weltweit bleibt weiter 74 von 90 Tagen kein realer ziviler Nahrung-/Medikamentenverbrauch, weil weiterhin ein gesamtwirtschaftliches Endnachfrageproblem besteht. Die B7b-Versuchsvariante reserviert echte vorausfinanzierte Schiffskonten bisher nur für NPC1/2- und Spielerfrachter; **NPC3-Frachter haben noch keine solche Reservierung**, sondern belasten direkt die NPC3-Konzernkasse. Eine Implementierung darf daher **nicht nur** die Auftragswahl ändern und die B7b/NPC3-Kassendifferenz ignorieren.

## Nächstes isoliertes Gate B7i [ANALYSE/OPTION]

**Nicht** jetzt allein autonome Marktgründer/Pachtpiloten einbauen oder den NPC3-Frachter retten. Für **denselben Seed42, denselben gekauften Konzernfrachter und dieselben bestehenden Marktpreise** eine *kleine* Vergleichsvariante der bestehenden Handelsentscheidung erproben, die **vor jedem neuen Einkauf** die erwartete **vollständige bezahlte Frachterarbeit einschließlich Leerpositionierung** gegen tatsächlich realisierbare Margen und das **nicht für bestehende NPC3-Miner gebundene Kapital** prüft. Keine Preis-/Geld-/Pachtänderungen gleichzeitig. Wenn die Prüfung verhindern kann, dass die Bankrottfalle wieder entsteht, **ohne** Versorgung und echte Folgegeschäfte zu blockieren, dann in einem getrennten Schritt Mehrseed/90d plus Schiff-/Waren-/Spielerfall und Save-Ladegate durchführen. Solange die Pilotenkonten-Architektur auf NPC1/2 begrenzt ist, darf die Lösung keine getrennte Spieler-/NPC-Handelsmathematik erzeugen. Langfristig bleiben **Konzernschiffe als Eigentum, freie/angestellte Piloten als Betreiber**, der Spieler als einzig persönlich schiffskauffähiger Pilot. Globales Modell-B-Endnachfragegate getrennt halten.

**Status:** Nur [PR #60](https://github.com/tobiasfranziskus/Check/pull/60) **[ANALYSE/DRAFT]**, [Roadmap-Entwurf #55](https://github.com/tobiasfranziskus/Check/pull/55) docs-only. `main 517728a9`, `index.html`, Regel14/Schema8, produktive Spielstände, iPad Safari und NAS nicht verändert; kein Merge/Deployment.
