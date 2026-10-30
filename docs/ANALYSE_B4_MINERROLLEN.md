# Aphros Void – B4: Minerrollen nach realem Siliziumtransport

**30. Oktober 2026 · [ANALYSE/DRAFT]**. Produktbasis: `main 906b7978d388e9af960443a2b7f4835b1d2a15c0`, v0.12.3, Regel 12, Schema 8. Verbindlich: [ROADMAP.md](ROADMAP.md), [AGENTS.md](../AGENTS.md); Nachweise: [B1 #36](https://github.com/tobiasfranziskus/Check/pull/36), [B3 #40](https://github.com/tobiasfranziskus/Check/pull/40). **Nur Analysewerkzeuge, eigener Workflow und dieser Bericht**. Keine Änderung an `index.html`, Regelnummern, Goldenwerten, Roadmap, Projektstatus oder produktiven Save-Formaten.

## Confirmed Core-Befund [MAIN]

B1 bewegt jeweils einen realen Nadir-Siliziumminer mit 100 Silizium nach Aldera. Das geschieht über einen **validierten**, zahlungspflichtigen `shipMove` (Ticks 129601–129661); an der Zielstation wird Fracht automatisch gegen bestehendes Stationsgeld verkauft. In Aldera gibt es **kein** Siliziumfeld. Deshalb führt die bestehende `m_core_foerderung.foerderung` beim Docken sofort den Zweig `s.auftrag='halten'; s.ware=null;` aus. Die ursprüngliche `s.heimat='nadir'` bleibt erhalten, die ursprünglich bei `createState` angelegte Sollflottenrolle `miner/nadir/silizium` ebenfalls. `m_core_schiffbau.fehlend` zählt aber nur identische Schlüssel `klasse/heimat/ware`, **nicht die konkrete Schiff-ID oder tatsächliche Förderleistung**. Der noch existierende Miner erfüllt damit die alte Sollrolle nicht mehr; `ersatzkauf` darf beim nächsten Stundenwechsel eine reale neue Hülle bezahlen, wenn Kasse, Vorrat und Rücklage reichen. Dies ist keine doppelte Warenbuchung, aber eine semantisch ungeklärte Personal-/Schiffszuteilung.

**Getrennter bestätigter Kostendefekt:** `shipMove` von Aldera nach Nadir lässt den Auftrag `halten` bestehen. `m_core_ankunft.reise` zählt trotzdem Arbeitsminuten, während `m_core_stunde.betriebskosten` per `if (s.auftrag === 'halten') continue` die Belastung dieser Reise vollständig überspringt. Eine naiv durch Befehle erzeugte Rückkehr würde damit kostenlos erscheinen. Das darf nicht als wirtschaftlich bessere Route verkauft werden.

## Vier isolierte Varianten

Mit denselben vier Tag-90-Ausgangszuständen und exakt den vier B1-Befehlen wird unterschieden:

1. **`control` [MAIN-Core]:** Miner bleibt nach dem Siliziumverkauf ohne neue Befehle in Aldera, Auftrag `halten`, Förderware gelöscht, ursprünglicher Nadir-Sollplatz bleibt. Unveränderte B1-Sequenz; die vier B3-Kontroll-Endhashes sowie der B1-Tag-97-Hash sind Pflicht.
2. **`return_native` [ANALYSE, ausdrücklich fehlerbehaftet]:** Am Tick 129665 ein zusätzlicher, validierter `shipMove` von Aldera nach `st_nadir`; am Tick 129726 nach Rückankunft ein gültiger `shipMine` mit Silizium. Kein Produktpatch; die Rückreise in `halten` bleibt beim alten Core **kostenfrei**, obwohl reale Arbeitsminuten anfallen. Diese Variante dient nur dem isolierten Nachweis und ist kein ökonomischer Lösungskandidat.
3. **`return_paid` [ANALYSE, einzige rückkehrfähige Kostenvariante]:** Dieselben beiden **validierten** Zusatzbefehle. Ausschließlich im Testprozess aktiviert der `shipMove`-Zweig für den betroffenen NPC3-Nadir-Siliziumminer auf der Reise von Aldera nach Nadir den bereits bestehenden Auftrag `foerdern` und die Förderware `silizium`, **nach** der echten Route-/Befehlsprüfung. Dies führt zum unveränderten realen Stundenbetriebskostenpfad und nach Rückankunft zur vorhandenen Förderungslogik; keine neuen Schiffe/Geld/Waren oder veränderten Preise/Kampfregeln. Es ist ein expliziter Kompatibilitäts-/Kostenversuch, keine bereits beschlossene produktive Befehlserweiterung.
4. **`release` [ANALYSE/OPTION]:** Bei der ansonsten unveränderten validierten Frachteraktivierung wird der exakte bisherige `miner/nadir/silizium/foerdern`-Sollplatz **einmalig bewusst aufgegeben**. Der Nadir-Miner verbleibt physisch in Aldera, seine Ladung und sein Besitzer bleiben erhalten. Kein neuer Sollplatz wird erfunden und kein Ersatzhull erzeugt. Da es im Produktkern **keinen validierten Befehl zum Ändern der NPC-Sollflotte** gibt, ist dies eine präzise gekennzeichnete **direkte Zustandsmutation nur in der isolierten Analysefassung**. Sie demonstriert die Konsequenzen einer dauerhaften Aufgabe der Nadir-Förderpflicht; sie ist nicht mit einem produktiv finanzierten Transportberuf gleichzusetzen.

Der neue Frachter, seine ursprüngliche B1-Finanzierung, die NPC-Liquidität, Piraten, Stationsproduktion und Minerersatzregeln bleiben in allen vier Versuchen ansonsten unverändert. Die Rückreise aus Aldera ist keine freie normale Treibstoffzahlung, wohl aber **kostenpflichtige Pilotentätigkeit**.

## Mess- und Reproduktionsplan

- **Vier Fälle und Seeds:** Miner/42, Handelsflotte/42, Station/1234, Jagd/98765, aus #34/#36 identisch rekonstruiert.
- **16 × 275-Tage-Fortsetzungen** von Tag 90 bis absolut Tag 365; stündliche unabhängige Geld-, Waren- und Einzelkassenaudits für jeweils instrumentierten und uninstrumentierten Replay, tägliche Hashes (4.400), 12 Save/Load-Roundtrips je Fortsetzung, gleiches RNG-Verhalten bei gleichen Befehlsfolgen.
- **Erfassung:** Minerschiff-ID und Existenz, Auftrag/Förderware/Ort/Heimat im Tick 129660–129780, Sollslots im Nadir, tatsächliche neue Förderung **dieses einen Miners**, gesamte Siliziumförderung, Aldera-/Nadirbestände, alle wirklich bezahlten Minerersatzkäufe, Cash, fälliger/bezahlter Carrierbetrieb, NPC3-Kostenunterdeckung und Langzeitverhalten. Die kaufenden Stationen, Kassen und Produktion bleiben nicht eingefroren.
- **Direkte Qualitätsgates:** Der unveränderte `control` erreicht die gepinnten #40-Kontroll-Endhashes; `return_native` ist bytegleicher Core, aber zusätzliche Kommandos; `return_paid` muss bereits vor dem Rückankunftstermin spürbar mehr fälligen Arbeitsbetrieb als `return_native` aufweisen; `release` entfernt exakt einen Miner-Sollplatz und verändert kein Geld direkt. Acht isolierte Tests decken Core-Förderungsstopp, Sollidentität, Befehlsinjektion, Kostenpfad, die gültige Rollenfreigabe und unveränderte Restfunktionen ab.
- **Reproduzierbarkeit:** Node.js 22, gepinnte B1-Startreplay-Belege und der gleiche SHA-gesicherte Produktionscore. `tools/b4-minerrolle.mjs`, `tools/b4-minerrolle-summary.mjs`, `tools/b4-minerrolle-smoke.test.mjs`, `.github/workflows/b4-minerrolle.yml`. Die CI führt die sieben Standardtestsuiten (`node --test tests/*.test.mjs`, bisher 48 Einzeltests) **zusätzlich** zum B4-Isolationstest aus.

**Akzeptanzgrenzen:** Eine gestiegene Gesamtförderung bedeutet noch keinen tragfähigen Handels- oder Geldkreislauf; für eine produktive Änderung sind später 13 Seeds × 90 Tage, zusätzliche Wirtschafts-/Spielerfälle, kompatible Save-Regeln und reale iPad-/NAS-Prüfung nötig. `return_native` zählt wegen des nachweisbaren Gratisreise-Kostenpfades **nicht** als ökonomischer Erfolg. `release` kann die alte Minerflotte verkleinern und eine industrielle Versorgungslücke vergrößern, statt sie zu beheben. Aus vier konstruierten Fällen keine allgemeine Piraten- oder Kapitalausfallwahrscheinlichkeit ableiten.

## Tatsächlich ausgeführte CI und reproduzierte Ergebnisse

**[TEST/ANALYSE]** [GitHub Actions #41110377066](https://github.com/tobiasfranziskus/Check/actions/runs/41110377066) auf dem CI-geprüften B4-Code: **6/6 Jobs erfolgreich**; vier Fälle × vier Fassungen × 275 Fortsetzungstage = **16 Langzeitläufe**, **4.400 Tageshashes**, unabhängiger instrumentierter/uninstrumentierter Replay, stündliche Geld-/Waren-/Einzelkassenaudits und **192 Save/Load-Roundtrips**; vier exakte #40-Kontroll-Endhashes sowie die vier B1-Tag-97-Referenzen. **8/8 isolierte Kern- und 48/48 Standardtests** bestanden (0 Fehler, 0 übersprungen, 0 Abbrüche). Gesamtmessungen im Workflow-Artefakt `b4-gesamt`. Die vorangegangene erste Workflow-Ausführung [#41109975309](https://github.com/tobiasfranziskus/Check/actions/runs/41109975309) scheiterte in drei Vergleichsjobs an GitHub-Artefaktdownloads, **nicht** an Assertionen; sie ist keine vollständige Abnahme. Die neuen Artefaktnamen sind eindeutig auf B4 beschränkt.

### Realer Minerrollen- und Betriebsvergleich bis Tag 365

| B1-Fall | Variante | Neu gefördertes Silizium des ursprünglichen Miners | Betrieb dieses Miners fällig / bezahlt (ISK) | Wirklich gekaufte Minerersatzhüllen | Siliziumproduktion alle Miner | NPC3-Kasse Ende (ISK) | NPC3 ungedeckter Betrieb (ISK) |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Miner/42 | control | 0 | 150 / 150 | 0 | 0 | 571 | 0 |
| | return_native | 38 | 255 / 255 | 0 | 38 | 580 | 0 |
| | return_paid | 38 | 395 / 395 | 0 | 38 | 569 | 0 |
| | release | 0 | 150 / 150 | 0 | 0 | 571 | 0 |
| Handelsflotte/42 | control | 0 | 150 / 150 | 8 | 598 | 254 | 870 |
| | return_native | 19 | 207 / 207 | 5 | 364 | 665 | 433 |
| | return_paid | 19 | 347 / 347 | 7 | 505 | 160 | 888 |
| | release | 0 | 150 / 150 | 5 | 345 | 665 | 433 |
| Station/1234 | control | 0 | 150 / 150 | 7 | 344 | 46 | 0 |
| | return_native | 53 | 292 / 292 | 6 | 197 | 735 | 0 |
| | return_paid | 53 | 432 / 432 | 6 | 197 | 739 | 0 |
| | release | 0 | 150 / 150 | 6 | 144 | 733 | 0 |
| Jagd/98765 | control | 0 | 150 / 150 | 6 | 254 | 4 | 0 |
| | return_native | 65 | 322 / 322 | 4 | 190 | 549 | 0 |
| | return_paid | 65 | 462 / 462 | 4 | 190 | 539 | 0 |
| | release | 0 | 150 / 150 | 4 | 125 | 552 | 0 |

**[BESTÄTIGT]** Der ursprüngliche Miner produziert nach kostentragender Rückkehr wieder **38 / 19 / 53 / 65 Siliziumeinheiten**. Er ist vorher lebend am Dock und verliert dennoch die Sollrollen-Identität durch `ware=null`. Die Rückkehr rettet daher reale Förderfähigkeit. Eine spätere Miner-Ersatzentscheidung verändert die Zahl anderer aktiver Miner; *gesamte* Siliziumproduktion kann trotz erfolgreicher Rückkehr sinken. In Handelsflotte/Station/Jagd ist die gesamte Produktion 598→505 / 344→197 / 254→190 Einheiten, nicht gestiegen. Der Minerfall 0→38 verbessert sich.

**[BESTÄTIGT]** Die native Rückfahrt läuft auf `halten` und vermeidet **140 ISK echte fällige Reisebetriebskosten pro Fall** gegenüber dem korrekt bezahlten Förderstatus. Das ist ein Core-Kostenfehler und kein positiver Produktvergleich. Die zusätzliche Fahrt kostet den korrekt berechneten Miner tatsächlich Geld; die `return_native`-Ausführung ist nur Negativkontrolle.

**[BESTÄTIGT]** Eine bewusst abgegebene Nadir-Sollrolle (`release`) verringert den Ersatzdruck und lässt mehr Geld in NPC3, führt aber gegenüber der Kontrolle im Handelsflotten-/Stations-/Jagdfall zu **geringerer Siliziumförderung**. Dies ist eine reale Kapazitätsaufgabe, kein automatisch finanziertes neues Geschäftsmodell. `release` selbst benötigt im aktuellen Produkt einen neuen, explizit validierten Befehl, falls die Entscheidung später freigegeben würde; die direkte Sollplatzmutation gehört ausschließlich zum Analysewerkzeug.

**[ANALYSE]** In den drei Fällen mit ursprünglichen Minerersatzkäufen gibt es einen Zielkonflikt zwischen temporärer Transportfunktion, langfristigem Förder-Soll, ersetzter Hülle und gemeinsamem Firmenkapital. Eine erhöhte NPC3-Endkasse ist **kein** Beweis eines gesunden Versorgungsmarktes. Die Werte ergeben sich aus vier deterministischen, durch Command/Seed konditionierten Pfaden; keine allgemeine Erfolgs- oder Verlustrate ableitbar.

## Ergebnis / Freigabe

**B4 technisch abgeschlossen, wirtschaftlich keine Produktfreigabe.** Die vorhandene `ware` dient zugleich als momentaner Förderauftrag **und** als Sollflotten-Identität. Das ist die bestätigte Konstruktionsschwäche. Produktiv sinnvoll zu prüfen wäre eine klare Trennung von **dauerhafter Förderzuordnung** und **temporärem Arbeitsauftrag**, plus eigenständige kostenpflichtige Reiseabrechnung bei `halten`; erst danach rentable Transportaufträge und finanzierte Flottenersatzpflichten. Diese Strukturentscheidung erfordert eine gesonderte Regel-/Speicherkompatibilitätsprüfung. Weder direkte `release`-Mutation noch bezahlter `return_paid`-Patch sind zur Integration freigegeben. Kein Merge, kein Deployment.
