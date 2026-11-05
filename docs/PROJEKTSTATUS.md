# Aphros Void – belegter technischer Projektstatus

> **[STAND: 05.11.2026]** Dieses Dokument führt den **aktuellen nachgewiesenen technischen Stand**, nicht die Produktplanung. Verbindliche Prioritäten und offene Entscheidungen: [ROADMAP.md](ROADMAP.md); Entwicklungsregeln: [AGENTS.md](../AGENTS.md); Branch-/PR-Index: [README.md](README.md). Die vollständige frühere **110-KB-Chronik** einschließlich aller ursprünglichen Wirtschafts- und Testberichte liegt unverändert unter [Git-Commit 8d6c1e73](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/PROJEKTSTATUS.md); dort veraltete "aktuell"-Aussagen sind **historische Snapshots**.

## 1. Tatsächliche Hauptversion und Abgrenzung

| Bereich | Verifiziert |
| --- | --- |
| **[MAIN]** | `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, **Regel14/Schema8**. Produkt-`index.html` bleibt auf der alten Hauptversion; seit dem letzten Produkt-Update sind primär Dokumentationsmerges auf main. **Keine** W0–W5r-Integration, kein genehmigtes Deployment |
| **[DRAFT / Forschungs-Core]** | Aufeinander aufbauende Wirtschafts-PRs **#161 → #200**, mit aktuell erforschtem R32/Schema8; nicht automatisch kompatible oder veröffentlichte Hauptversion |
| **[DRAFT / UI]** | Eigenständige Legacy-Darstellungen #186 (Fitting), #187 (Station), #189 (Pilotenakte), #195 (Mining-Scanner), #198 (Konzernzentrale). Noch keine autoritative Einbettung in den gemeinsamen W5r-Spielmodus |
| **[ARCHIV]** | Übernommene Ursprung-PRs #162 (in #164), #163 (in #165), #172 (in #175), #177 (in #179) ohne Merge geschlossen; #174 unabhängige Analyse. **#199** geschlossene, nicht widerlegte alternative W5r-Forschungsregel |

**Wichtig:** `main`, Forschungswelt, veröffentlichte GitHub-Pages-URL und NAS-Spielstand sind vier getrennte Dinge. Eine grüne CI beweist **keine** reale iPad-/NAS-Auslieferung. Keine bestehende IndexedDB-/JSON-Speicherung in neue Regelprofile still migrieren oder überschreiben.

## 2. Erreichter Forschungsstand – nur DRAFT

| Phase / PR | Tatsächlicher Befund, keine Produktfreigabe |
| --- | --- |
| **W0/W1 #161/#164** | Vorfinanzierter Erzpilot, bezahlter Miner, Lieferung und Rückerstattung; 2D-Miner liest dieselben Core-Daten. Zwei 600-ISK-Miner nach 2d je 7.800 ISK Überschuss nach Förderkosten und Anschaffung im begrenzten Pilottest; ursprünglicher Endkäufer hat danach 0 ISK. Kein dauerhafter Endabsatz |
| **W2 #165–#167/#171** | Reale NPC-Firmenkassen, kapitalgedeckter Schiffskauf, Nachfrage-/Arbeitsstopps, gesonderte Regel16-Saves; keine individuelle Rettung |
| **W3/W4/W5 #168–#170** | Echter bezahlter Erztransport Aldera–Nadir, Raffinerie Erz→Material und material- sowie lohngedeckter Frachterbau |
| **W5b–W5f #173–#181** | Bezahlter Bauteil-/Jägerbau, Jägerkämpfe/Verluste, 2D-Frachter, gemeinsame Forschungswelt, aus bestehenden Geldmitteln bezahlter Pilotlohn/Kopfgeld und erster MK1-Laser |
| **W5g–W5m #183–#192** | Belegter Jägerersatz und reales NPC-Finanzierungsdefizit; Verkauf/Kaufkraftkonkurrenz, offene eigene Erzförderung ohne künstliche 50-Erz-Auftragsgrenze und aus Erz/Lohn bezahlter MK1-Bohrkopf. Verkauf bleibt begrenzt |
| **W5n #193** | Eis→bezahlter Frachter→Wasser; 100 verkaufte Wassereinheiten für 1.400 **vorhandene** ISK im Pilotversuch, danach Endkundenbudget erschöpft |
| **W5o #194** | Nur aus wirklich bezahlten Löhnen/realisierten NPC-Gewinnen finanzierter Haushaltsrückfluss: Seed42 90d bei vollständigem Rückfluss **4.316/4.320 Wasser**, bei NPC-Miner-Sparen **789**, Spieler-Miner-Sparen **733**. Keine neue ISK |
| **W5p #196** | Lesende Kaufkraftdiagnose: Spar-NPC letzter Verkauf in Stunde397, am Tag90 physischer Wasserbestand bei Verbraucher-Kassenmangel; kein pauschaler Emissionsbedarf aus nominell entgangenen Umsätzen ableitbar |
| **W5q #197** | Physisch buchbarer externer Wasserexport als isoliertes R31-Profil, global begrenzte **Testemission**, Default **OFF**. Seed42 Sparfall 365d ohne Export **789 Wasser**, mit maximal 3.500 ISK Testexport/Haushaltsüberweisung **1.872**, bei 7.000 ISK **2.775**; keine nachgewiesene dauerhafte Krisenfestigkeit |
| **W5r #200** | Isolierter R32-Verschleiß/Original-`shipBuy`-Ersatz und vollständig vorfinanzierte Wasserwerksarbeit. Seed42 voller NPC-Rückfluss 90d: **1.500 Wasser**, **3 Miner verloren**, **2 Ersatzminer à 600 ISK** gekauft, **1 Frachter verloren, 0 Ersatzfrachter**, weil trotz **1.250 ISK Speditionskapital** keine Hülle im Werftlager liegt. Vier Inspektionen/240 ISK bezahlt. Modellierte Verschleißzeiten (15/30 Tage) **nicht beschlossen** |

**[ALTERNATIV / ARCHIV #199]** Verschleiß nach 600 echten Förder- und 2.400 echten Flugminuten; Schrottobjekte statt entfernten Schiff-IDs und Wartung nach Produktionsminuten mit **2 realem Eis + 20 ISK Arbeit**. Diese Variante ist **nicht** mit #200 identisch, trotz gleicher Forschungsnummer R32. Keine Gleichsetzung ihrer Ergebnisse/Hashes und **keine** bestätigte Überlegenheit eines Modells.

## 3. Geld- und Wirtschaftsrisiken

**[TEST/ANALYSE]** Die bisherigen positiven einzelnen Produktions- und Erlösereignisse belegen **keine** 365-Tage-Gesamtwirtschaft. Drei verschiedene Engpässe sind separat: **(a)** zahlungsfähiger Endkunde und Geldumlauf bei unbeschränkt sparendem Spieler/NPC, **(b)** wirklich finanzierte Folgeaufträge mit Vollkosten, **(c)** physisch wieder herstellbare Ersatzhüllen/Material/Wartung. Ein voller Konzernkassenbestand ersetzt keine fehlende Hülle.

- **[MAIN] Regel14:** historische Kopfgeldquellen prägen `minted`; vor Einführung eines globalen Geldmodell-B-Deckels unbedingt mit einbeziehen. Der alte Hauptkern hat erwiesene Langzeitspielerkrisen (Seeds 42/7); nicht durch bloßes Verschieben von Fonds verdecken.
- **[DRAFT] W5q-R31:** Ausgewählte hypothetische Exportprofile dürfen kontrolliert ISK buchen; **Standard OFF**. Nicht als genehmigte Produktregel, Ausgleich bei Insolvenz oder Dauerlösung interpretieren.
- **[DRAFT] W5r-R32:** Tatsächlich bezahlter Ersatz bleibt an vorhandenen Werftbestand gebunden; Produktions-/Wiederbeschaffungsprozess für neue **Frachter** und **Wasserwerksersatzteile** fehlt in der R32-Forschung. Die Wartung in #200 ist **Lohnarbeit ohne reales Ersatzmaterial**.
- **[BESCHLOSSEN]** Spieler-Sparfreiheit, NPC-Insolvenz statt Gratisrettung und ein einziger gemeinsamer Core bleiben zwingend. Details zu Emission, Verschleiß, Preisen und Ausschüttungsmechaniken sind noch zu entscheiden.

## 4. Ausgeführte Tests, CI und noch offene Abnahmen

| Referenz | Beleg und Grenze |
| --- | --- |
| **[TEST / R32]** | [W5r-PR #200](https://github.com/tobiasfranziskus/Check/pull/200) meldet direkt ausgeführte **8/8 gezielte Kernprüfungen**, **13 feste Seeds ×90d** samt unabhängigen täglichen Geld-/Warenaudits, Doppelreplay und Save/Load Tag30/60/90; drei **365d**-Weltvarianten. Seed42/90d `b456ac67d9797566`. Diese Zahlen beziehen sich auf dessen ursprünglichen **R32-Code-Head**, nicht auf das alte main |
| **[CI / R32]** | [GitHub Actions #42065843200](https://github.com/tobiasfranziskus/Check/actions/runs/42065843200) abgeschlossen **success** für den ursprünglichen Code-Head `6440b9a7`: 7 erfolgreiche Jobs, 1 planmäßig übersprungen. Eine spätere reine README-Änderung in #200 hatte eigene [erfolgreiche CI #42071485916](https://github.com/tobiasfranziskus/Check/actions/runs/42071485916) |
| **[CI / Legacy]** | [#198-Konzernzentrale](https://github.com/tobiasfranziskus/Check/pull/198): lokale Node22 **78/78 Einzeltests**, Chromium-Touch vier Größen; [GitHub-CI #42042940262](https://github.com/tobiasfranziskus/Check/actions/runs/42042940262) abgeschlossen **success** |
| **[OFFEN]** | **Kein** echter Safari-WebKit-/iPad-/NAS-Nachweis des neuen W5r/Legacy-Gesamtspiels, kein produktiver Merge, keine bestätigte Nutzung über den bestehenden Hauptlink, kein gemeinsamer produktiver Save-/Import-/Export-/Migrationsabschluss |
| **[DOCS]** | Die hier vorgeschlagene Verdichtung von Roadmap/Status ist **nur Dokumentation**. Dadurch wurden **keine** neuen Core-Tests ausgeführt und **keine** W5r-Qualitätsfreigaben erneuert |

Node.js 22: `node --test tests/*.test.mjs`. Für Integrationsfreigaben zusätzlich Test-Hashes, Geld- und Warenkonten, Save/Load inkl. Altsaves/Manipulation, **13 × 90 Tage** sowie Spieler-Spar-, Insolvenz-/Markteintritts- und 365d-Krisen. iPad Safari Hoch-/Querformat, Touch/Tastatur, tatsächlicher NAS-Link und extern gesicherter JSON-Save bleiben real abzunehmen.

## 5. Nächster überprüfbarer Schritt

1. **[OPTION W5s]** Erst echte physische, vollständige **finanzierte** Hüllenneubauten und ggf. erste stationäre Ersatzteile in einer geschlossenen R32-Forschungswelt; kein Kauf aus leerem Werftlager, keine gratis Zwischenwaren, kein heimlicher Geldtransfer. #199/#200-Parameter sauber gegentesten.
2. **[OPTION UI]** Getrennt autoritative lesende Adapter für #186/#187/#189/#195/#198 erstellen; Eigentum, Auftrag, freie/gebundene Fracht, echte Belege und fehlende Felder nachweisen. Keine alten Preis- oder Gewinnformeln übernehmen.
3. **[OPTION Integration]** Danach eine möglichst kleine gemeinsame spielbare Forschungs-/Release-Kandidatenbasis unter Beibehaltung aller vorhandenen Spielstände, Test-Hashes und Navigationsfunktionen. Erst **nach** bestandenem End-to-End-Gate Alt-Demos entfernen; nicht die Beweis-Fixtures.
4. **[FREIGABE]** Der Nutzer entscheidet über Produktparameter, Merge, Hauptlink und Deployment. Offene Drafts bleiben Drafts.

### Vollständiges historisches Protokoll

Der **unveränderte frühere Projektstatus** mit detailgenauen W0–W5f-, B5–B8-, Seed-/CI- und PR-Einzelbefunden bleibt dauerhaft im [Commit 8d6c1e73](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/PROJEKTSTATUS.md) lesbar; ursprünglicher Inhalt wiederherstellbar mit `git show 8d6c1e73:docs/PROJEKTSTATUS.md`. Zusätzlich: [W5r-Primärbericht](W5R_ERSATZFLOTTE_ANLAGENSERVICE.md), sämtliche [Forschungsberichte](README.md), PRs und GitHub-Actions-Läufe. Historische Datumsangaben nicht als aktuellen Integrations-/Freigabestatus verwenden.
