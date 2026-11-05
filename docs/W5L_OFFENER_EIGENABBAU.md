# W5l – Offener Mining-Markt und eigenfinanzierter Abbau

**[BESCHLOSSEN: Ziel / DRAFT: Technik] 05.11.2026 · PR #191 auf W5k #190.**

## Warum der alte 50-Erz-Deckel nicht ins eigentliche Spiel gehört

W5i/R26 begrenzte **insgesamt** Stationslager + reservierte Mining-Aufträge + Schiffs-Erzfracht auf 50. Diese Forschungs-Sicherung war hilfreich, um die endlichen Produktions- und Geldketten nachzuweisen, verhinderte aber echte Konkurrenz. Die 50er-Charge des **Frachtertransports** ist etwas anderes: Frachtkapazität darf den Handel begrenzen, nicht eine globale Regel, die allen Minern unabhängig von Ausrüstung nur einen einzigen offenen Auftrag erlaubt.

## W5l: bezahlte Förderung ≠ bezahlte Abnahme

- Ein Miner mit `shipMine` kann auch ohne Käufervertrag abbauen, **solange** seine eigene Kasse die echte Arbeit pro Minute bezahlt, seine Frachtkapazität nicht erschöpft ist und der Core den Abbau am Ort erlaubt.
- Rohware wird im selben Core physisch in `ships[id].ladung.erz` und `ledger.erz.mined` verbucht. Nur der Eigentümer erhält die Ware, kein Verkaufs- oder Geldguthaben.
- Ist ein Vertrag tatsächlich finanzierbar, wird wie bisher aus der bereits vorhandenen Stationskasse in **echte Arbeits-/Abnahme-Treuhand** gebucht. Erz wird erst nach realem Anliefern vom Käufer bezahlt. Die früheren finanzierten Auftrags- und Warenaudits bleiben erhalten.
- Ohne Abnahme wird kein Auftrag als bezahlt vorgetäuscht; bei zu wenig Betriebskapital oder vollem Laderaum stoppt der Miner. Der NPC-Rat darf bei mangelnder Nachfrage freiwillig pausieren – der Spieler darf mit bestehendem Geld bewusst weiter spekulieren.
- Die Grenze `w5i.maxOffen = 50` gilt **weiter ausschließlich** in der alten Regel26. W5l/R27 nutzt die alten Käufer-/Fracht-/Lagerbedingungen, aber **kein** globales offenes Mengenlimit. R26/Schema8-Saves werden nicht heimlich zu R27 migriert; R27 braucht einen separaten Forschungs-Slot, bevor eine Browseroberfläche angeschlossen wird.
- Die W3-Frachtcharge bleibt 50 Erz, die Käufersaldo-Prüfung, die vorhandenen 10 ISK/Erz und 2 ISK Arbeitskosten pro Bergbauminute bleiben erhalten. Keine neue ISK-Quelle, keine Nachfragegarantie und keine erfundene Käuferkasse.

## Nachvollziehbarer direkter Seed42-Kernversuch

Nach einem bezahlten House-Miner-Kauf startet zusätzlich zum vorhandenen NPC-Miner derselbe `shipMine`-Befehl. Nach **55 Minuten** wurden real **110 Erz** abgebaut, davon **100 im Stationslager** gegen vorhandenes Stationskapital erworben und **10 als eigentümereigene Schiffs-Erzfracht** gehalten. Es gab noch **keine W3-Lieferung**. Gesamtsupply bleibt **33.000 ISK**, `minted=0`, Core-Audit ist ausdrücklich `true`. Der R26-Start-Hash `343559f8c88543e4` bleibt unverändert. Das ist ein kleiner unmittelbarer Codeversuch, **noch kein nachgewiesener Langzeit-Markt**.

## Qualität und Abnahmegrenzen

Neu `tests/w5l-offener-eigenabbau.test.mjs` mit unabhängiger physischer Bestandsbilanz, 33.000-ISK-Kassenidentität, Käufer- und Händler-Gegengeldkonto, tatsächlichen Eigentümerkassen und gebundenen Arbeitsbudgets, Ablehnung gefälschter Transfers, separatem Regel27-Save/Load, negativen Käufer- und Lagerfällen sowie 13 Seeds × 90 Tage Replay und täglichen Audits. **Nur CI-Ergebnisse nach tatsächlich beendetem Lauf als bestanden dokumentieren.**

Regel27 betrifft nur den separaten W5-Forschungszweig. Kein Merge nach main, keine Veröffentlichung. Die bestehende Hauptspiel-DB, R26, W5k und Codex-Legacy-Drafts bleiben unberührt. Echte iPad-Safari-/NAS-Abnahme offen.

## Folgeschritt: Wettbewerb durch Schiffe und Module

Sobald Absatz und Lagerverkauf funktionieren, wird die **Förderleistung** (Erz/Minute), nicht die Zahl künstlich verfügbarer Aufträge, zum zentralen Stellhebel. Zielvarianten: höherwertige Mining-Schiffe, MK1-/MK2-Bergbaumodule, optional Pilotenfähigkeiten, größere Laderäume und ggf. seltenere Rohstoffe in riskanteren Gebieten. Jede Verbesserung benötigt nachweislich bezahlte Herstellung, Kauf, Wartung und ggf. zusätzlichen Energie-/Arbeitsaufwand, sodass ein schnellerer Miner **nicht automatisch** profitabler ist. Exakte Geschwindigkeitsboni, Preise, Skillkurven, Abbaumengen/Ressourcenregeneration und automatisches NPC-Bietverhalten sind noch **[OPTION]** und werden im eigenen Balancing-Gate festgelegt.\n