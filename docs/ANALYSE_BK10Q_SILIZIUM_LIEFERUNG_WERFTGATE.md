# B-K10q – Echtes Silizium geliefert, echter Transport bezahlt, Frachterbau bleibt blockiert

**[ANALYSE/DRAFT · 02.11.2026]** [PR #134](https://github.com/tobiasfranziskus/Check/pull/134) baut auf #133 auf. [MAIN] b4e604d6, v0.12.5 / Regel14 / Schema8 bleibt unverändert. Der geprüfte R15-/Schema9-Versuchskern mit 4 ISK Produktionslohn pro Minute ist nicht integriert. Ausschließlich Test- und Dokumentationsdateien; keine Produktions-, Lohn-, Preis-, Schiffbau-, Fonds-, Emissions-, UI- oder Spielstandänderung, kein Merge.

## 1. Ausgangszustand und korrekte Leistungsabnahme

Die normale R15-Seed42-Wirtschaft lief zuvor **14 × 1.440 Minuten** autonom mit aktiven Händlern, Minern, Piraten, Fabriken und Systemfonds. Ausgangsbefund: Aldera hat **0 Silizium, 0 Bauteile, 0 fertige Frachter und 1.374 ISK**, NPC2 **0 Schiffe bei 2.792 ISK Eigenkasse**. Spieler-Owner „house“ besitzt **2.000 ISK** und den echten Frachter sh002 (stillgelegt am Dock in Aldera). In Dravos ist Silizium real verkaufbar. Eine neue Hülle oder neue ISK werden nicht erzeugt.

Drei neue Tests verwenden bestehende Original-Core-Befehle und Instrumentierung nur im Test. NPC2 bindet **168 eigene ISK** im bereits vorhandenen R15-Vertragsbuch als Vergütung für den tatsächlich zu erbringenden Transportdienst des bestehenden Spielerfrachters. Dieser fährt mit Original-Flugkosten zunächst Aldera→Dravos, kauft physisches Silizium zum Originalkurs, fliegt beladen nach Aldera und verkauft dort **durch die automatische Original-Ankunftsentladung**. Die Vergütung wird **erst nach nachweislich erfolgtem Originalverkauf in Aldera** mit einem echten Original-Leistungsbeleg ausgezahlt. Das ist eine zusätzliche bezahlte Frachtleistung durch NPC2, **keine doppelte Bezahlung des Siliziums**; das Silizium wird durch die Werft genau einmal bezahlt.

| Tatsächlich gebuchte achtteilige Lieferung | Original-Beleg |
|---|---:|
| NPC2 bucht vorher eigenes Geld in Vertragsreserve | **168 ISK** |
| Aldera→Dravos, bezahlte 20 Minuten Flug | **84 ISK** |
| Dravos, Kauf 8 Silizium × 17 + Gebühr | **136 + 5 = 141 ISK** |
| Dravos→Aldera, bezahlte 20 Minuten Flug | **84 ISK** |
| Aldera, *automatischer* Wareneingang/Originalzahlung | **8 Silizium / 344 ISK** |
| Ziel-Handelsgebühr aus der Warenzahlung | **13 ISK** |
| NPC2 zahlt den gesonderten Transportservice erst bei erfolgreicher Ankunft | **168 ISK** |
| Frachtunternehmer: persönlicher Beitrag vor Hüllenersatz | **+190 ISK** |
| Davon durch externen NPC2-Serviceauftrag, nicht durch Marktarbitrage | **168 ISK** |
| Allein Warenhandel/Flüge/Gebühren vor Hüllenersatz | **+22 ISK** |

Die 168 ISK sind für NPC2 **echte Ausgaben und keine neu entstandene Gesamtwirtschaftsmarge**. Die Dienstleistung ist tatsächlich erbracht, aber NPC2 erhält daraus nicht automatisch ein neues Schiff. Ein neuer Spieler- oder NPC-Auftrag wurde **nicht** als Produktfunktion implementiert: Der Test entscheidet anhand tatsächlicher Originalbelege, ob er die bestehende Originalvertragsauszahlung oder Erstattung auslöst.

Der Original-Core entlädt bereits bei physischer Ankunft selbsttätig. Der bezahlte Flugvertrag schließt erst zur nächsten vollen Stunde. Der Test wartet daher diese Abrechnung ab und führt **keinen zweiten manuellen Verkauf** nach der Ankunft aus. Unabhängige ISK- inklusive Vertragsreserve-, Waren-, Original-Core- und Save/Load-/Hash-Audits bleiben korrekt.

## 2. Produktions- und Vollkosten-Gate ist NICHT bestanden

Mit unverändert aktiven Original-Werftlinien arbeitet Aldera nach Lieferung weitere 340 Minuten. Tatsächlich fertiggestellt werden **8 Bauteile und 1 Miner**, aber **0 Frachter**; NPC2 kauft **0 neue Frachter**. Die bestehende Reihenfolge priorisiert Miner und andere vorhandene Produktionslinien und verbraucht gemeinsam verfügbare Bauteile vor dem gewünschten Frachter. Es gibt keine nach Originalrecht für einen bestimmten Auftrag reservierbaren acht Bauteile. Der wirtschaftliche Kreislauf ist deshalb **nicht geschlossen**.

Die mengenabhängige Gegenprobe startet jeweils aus derselben authentischen Tag14-Welt. Alle Original-NPCs und Produktionslinien bleiben aktiv, der vorhandene Spielerfrachter bezahlt und liefert die Waren. Hier wird kein zusätzlicher NPC2-Serviceauftrag gebucht, damit die ursprünglichen Produktions- und Kassenmechanismen nicht durch die Vergütung verfälscht werden.

| Echtes eingekauftes und angeliefertes Silizium | 8 | 14 | 16 | 20 | 24 |
|---|---:|---:|---:|---:|---:|
| Bezahlter Dravos-Einkauf inkl. Gebühr, ISK | 141 | 247 | 282 | 353 | 424 |
| Wirklich von Aldera für die Ware bezahlt, ISK | 344 | 602 | 688 | 860 | 1.032 |
| Neu fertiggestellte Bauteile | 8 | 14 | 10 | 8 | 5 |
| Neu fertiggestellte Miner | 1 | 1 | 0 | 0 | 0 |
| **Neu fertiggestellte Frachter** | **0** | **0** | **0** | **0** | **0** |
| Silizium in Aldera nach 340 Min. | 0 | 0 | 6 | 12 | 19 |
| Aldera-Kasse nach 340 Min., ISK | 1.251 | 535 | **10** | **0** | **24** |

**Zwei getrennte Ursachen:** Kleine Mengen werden wirklich in Bauteile umgesetzt, aber durch bestehende Minerfertigung beansprucht. Große Mengen werden zwar real gekauft, binden jedoch so viel Stationsgeld, dass die Werft **trotz verbleibendem Silizium** keine ausreichend finanzierten Fabriklöhne mehr reservieren kann. Eine bloße Rohstoffbestellung ohne Produktionszuordnung und Mittelbindung ist daher keine Lösung.

## 3. Nichtlieferung und Vertragsschutz

Eine separate echte Original-R15-Reservierung von **168 ISK** wird in identischem Seed42-Tag14-Zustand **ohne Fahrt und ohne Warenbeleg** regulär abgeschlossen. Ergebnis: **0 ISK Auszahlung, volle 168 ISK Rückzahlung an NPC2**, beide ursprünglichen frei verfügbaren Konten wiederhergestellt; keine physische Warentransaktion. Der sichtbare Vertragsarchivbeleg ändert den Hash nachvollziehbar; Save/Load und unabhängige Geld-/Warenaudits bestehen. Dies demonstriert Rückgabe **noch unverdienter Reserven**, nicht die garantierte Eintreibung von Vorschüssen nach Insolvenz.

## 4. Interpretation und nächstes Gate

**[BESTANDENE TEILFUNKTION]** Ein anderer tatsächlich kapitalisierter Akteur (hier der bestehende Spielerfrachter) kann die für NPC1 unfinanzierbare Siliziumlieferung physisch und ohne neue Geldmittel erbringen. NPC2 kann diese Transportleistung tatsächlich aus eigener Kasse vorfinanzieren und nach Lieferung bezahlt abrechnen, ohne dass die Ware doppelt abgerechnet wird.

**[NICHT BESTANDEN]** Vom bezahlten Rohstoff zur konkret bestellten Schiffshülle und zum echten Kauf durch den schiffslosen NPC2 fehlt eine verbindliche Material- und Lohnzuordnung. NPC2 bleibt schiffslos. Die individuelle +190-ISK-Transporteursrechnung finanziert nicht den Gesamtbetrieb; der Zahler trägt eine echte zusätzliche Ausgabe, ohne garantierten Schiffsnutzen. Keine positive Vollkosten- oder Langzeitwirtschaft belegt.

**[OPTION – B-K10r, bedarf einer gesonderten Entscheidung]** Ein allgemeiner Spieler-/NPC-Produktionsauftrag müsste (a) mit wirklichem Kapital **Rohstoff, Produktions- und Werftlohn vor Start** binden, (b) die **für einen konkreten Frachter tatsächlich benötigten acht Bauteile** gegen gleichzeitigen Miner- oder Jägerzugriff reservieren, (c) gegen **tatsächlich fertiggestelltes und aus der Werft gekauftes Schiff** einmalig abrechnen, (d) unverdiente Reserven ohne Gratisrettung freigeben und (e) echte variable Schiffsersatz-/Kapitalkosten berücksichtigen. Diese Produktionsmaterialreservierung ist **noch keine vorhandene Produktfunktion** und darf nicht ohne Freigabe eingeführt werden. Keine pauschale Preis-/Lohnreform, keine individuelle Rettung, keine ISK-Emission.

**[TEST DIREKT BESTANDEN]** Drei neue Testgruppen tatsächlich ausgeführt: 8er-Transport mit realem NPC2-Servicetransfer und Originalwarenabnahme, fünf vollständig bezahlte mengenabhängige Werftfolgetests und echte Nichtlieferungs-Rückerstattung. Zuvor 14d autonome Seed42 mit täglichen independenten Geld-/Waren-/Save-/Hash-Audits. **[TEST BESTANDEN] Vollständige [GitHub-CI #41505921231](https://github.com/tobiasfranziskus/Check/actions/runs/41505921231) auf unverändertem endgültigen Testcode-Commit 9f1571b6: 185/185 Node-Tests erfolgreich, 0 Fehler.** Alle tatsächlich ausgeführten historischen v10–v14-/Geografiereferenzen grün; separater Sicherheitsgeografievergleich planmäßig übersprungen, nicht als ausgeführt bestanden bezeichnet. Danach ausschließlich Dokumentationsänderungen; keine 13×90d- und keine iPad-/NAS-Abnahme. [Ausführbarer Test](../tests/bk10q-silizium-liefervertrag-werftgate.test.mjs).
