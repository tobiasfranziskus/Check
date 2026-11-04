# Aphros Void – Projektstatus

## [DRAFT] W3 – finanzierter Aldera–Nadir-Frachtauftrag und UI · 04.11.2026

**[MAIN]** weiterhin `b4e604d6`, Regel14/Schema8. **[DRAFT]** [PR #168](https://github.com/tobiasfranziskus/Check/pull/168) auf #167; isolierter Regel17-Modus mit zwei Stationen, derselben Core-Tickfunktion und echtem 750-ISK-Frachterkauf. W2-Mining und NPC-Investition bleiben vorhanden; Frachterreise und Warenkonto besitzen keinen zweiten Simulationstakt.

**[BUCHUNGSBELEG]** Bei ersten 50 tatsächlichen Erz aus Aldera: Käufer Nadir reserviert 740 ISK (500 Ware + 240 Transport), Spedition reserviert 120 ISK Arbeit. Abfahrt: 50 Erz verlassen reales Stationslager und gehen ins Schiff. Nach 60 bezahlten Minuten: 50 Erz in Nadir, Aldera erhält 500 ISK aus Kauf-Treuhand. Nach weiteren 60 Minuten: Spedition erhält 240 ISK für vollendete Hin- und Rückfahrt, Arbeitsfonds hat 120 ISK erhalten; die Treuhandkonten sind leer. Ausgangs-ISK bleiben erhalten (W3-Pilot **33.000 ISK** inklusive neuer, ausdrücklich endlicher Nadir- und Speditions-Startkassen), kein `minted`. Frachter-Investition 750 ISK und mögliche spätere NPC-Minerkäufe werden vom Werfterlös getrennt nachgerechnet.

**[AUDIT]** Der neue W3-Audit prüft physische Erzherkunft, Nadir-Lager gegen bezahlte Lieferung, Käuferanfangsetat gegen gebundene Gesamtausgaben, Frachthülle, Betriebskosten, Arbeitsfonds und erhaltenes Frachtentgelt, jeweils einschließlich aktiver Verträge. W1-Vollkostenrechnung umfasst nun in **Regel17** den zusätzlichen echten Frachter- und Erzverkauf; R14–R16 bleiben unverändert. Einzeltests für 42/7, vollen Hin-/Rückflug mit Save/Load, negative Befehle sowie 13 Seeds ×90 Spieltage. CI nur für tatsächlich vollständig abgeschlossene Jobs als bestanden bezeichnen.

**[SPIELBARER DRAFT]** `?modus=w3frachter` bietet Frachterkauf, +50 Core-Minuten, finanzierte Beauftragung und eine gemeinsame 2D-/Kontenansicht. `?modus=w3konten` zeigt dieselbe gespeicherte W3-Welt ohne Canvas. W3 nutzt **ausschließlich** `aphros-void-w3-regel17-v1` inklusive Archiv vor Neustart/Import; `slot1` sowie Regel15-/16-Slots werden nicht verändert. Echte iPad-Safari-/NAS-Abnahme nach Nutzerwunsch später.

**[NICHT BEHAUPTET]** Dauerhafte Endnachfrage und langfristiger Wirtschaftskreislauf: Nadir verbraucht die Ware noch nicht; die Käuferkasse von 4.000 ISK füllt sich nicht automatisch. Schiffsschäden, Wartung, Produktionsverwendung des Erzes, konkrete Kosten-/Preisbalance und NPC-Insolvenz sind offene W3–W5-Gates. Kein Merge und keine Veröffentlichung.

---


## [DRAFT] W2 – Nachfrage-Wiederanlauf: Kontenhärtung und überprüfbarer Fehlbetrag · 04.11.2026

**[MAIN]** b4e604d6 / Regel14-Schema8 bleibt unverändert. Auf dem offenen PR #167 werden ausschließlich die Regel16-Forschungswelt und ihre W2-Kontoansicht ergänzt. `krisenLage` zeigt die wirklich vorhandene Endkundenkasse, vorrangige Ware/Vertragsmengen, fehlende ISK bis zu *einem zusätzlichen* Erzauftrag und die Gültigkeit des Käuferherkunftsnachweises. Der Bericht verändert keine Konten und erzeugt keine neuen ISK.

**[KONTENGATE]** Ein bilanzneutraler Transfer von einem vorhandenen Unternehmen auf das Käuferkonto ist ohne echte Einnahme **kein** gültiger Wiederanlauf. Bereits das bestehende Audit verlangt `Käuferanfangsgeld = exportiertes Erz × 10 ISK + Restkasse`; die neuen Regel16-Prüfungen verweigern deshalb auf dieser verfälschten Basis neue Förderaufträge und den anschließenden Erzexport. Eine finanzierte Wiederaufnahme setzt eine nachweisbar echte Einnahme des Käufers voraus. Eine solche Einkommensregel wird **nicht** eingeführt und ein positiver Restart daher nicht als bestanden behauptet.

**[TESTGATE]** Neuer `tests/w2-kaufkraft-gate.test.mjs` für Seeds 42/7: tatsächlicher Käuferstopp mit korrektem Konto-/Warenfehlbetrag, read-only Hash, Save/Load, und negative Gegenprobe gegen eine 1.000-ISK-Umlagerung (Geldsumme unverändert, Käuferherkunft ungültig, kein Export). Bestehender W1-/Regel14-Hash und W2-UI-Slot müssen bestehen. **[CI #41820349319](https://github.com/tobiasfranziskus/Check/actions/runs/41820349319) auf `603cb942`: 131/131 Node-Tests, 0 Fehler und 0 übersprungen**; darin die 3 neuen W2-Kaufkraft-Tests und die W2-UI-Prüfungen. Historische Referenzjobs bei Dokumentation noch laufend, nicht als abgeschlossen bezeichnen. iPad-/NAS-Abnahme verschoben; kein Merge oder Deployment.

**[OFFEN]** Der nächste positive Wiederanlauf erfordert eine *echte* nachgewiesene Leistung, für die der Käufer Geld erhält. Diese Kette gehört wirtschaftlich zu W3/W4/W5 beziehungsweise zu einer ausdrücklich zu genehmigenden Geldmodell-B-Regel. Die vorhandenen Gelder des Spielers und NPC dürfen unbegrenzt liegen bleiben.

---


## [DRAFT] W2-Konzern- und 2D-Ansicht mit isoliertem Regel16-Slot · 04.11.2026

**[MAIN]** weiterhin `b4e604d6`, Regel14/Schema8. Der neue gestapelte Entwicklungsbranch `feature/w2-npc-ui-save-20261104` setzt auf W2-Krisensteuerung #166 auf. Zusätzlich zu den W1-Modi `erzpilot` und `miner2d` gibt es ausschließlich im Draft `?modus=w2konzern` und `?modus=w2miner2d`. Beide nutzen den **existierenden**, autoritativen Regel16-Core und dieselben `shipBuy`-/`shipMine`-/`shipWait`-Befehle sowie Stunden-/Tagesfortschritt. Die 2D-Darstellung zeigt echte NPC-Flotten; der Konzernbericht zeigt Absatz, bereits finanzierte Aufträge, verfügbares Kapital und Betriebsruhe.

**[SPEICHERSCHUTZ]** W1: `aphros-void-erzpilot-regel15-v1`; W2: `aphros-void-w2-regel16-v1`; Regel14: `slot1`. Keine gegenseitige Überschreibung, keine stillschweigende Regelmigration. Vor Import/Neustart wird nur der *eigene* Pilotstand archiviert; JSON-Export ist versionsklar; fehlerhafte Saves bleiben gesperrt und exportierbar. Der reguläre Startmodus `./` bleibt Regel14. Diese UI-Änderung beinhaltet keine Wirtschaftskern-/Kassen-/Preis-/Lohnänderung.

**[TESTGATE]** Neue `tests/w2-npc-ui-save.test.mjs` für Konto-/Marktanzeige, 2D-Ansicht, zahlungsechten NPC-Kauf, Umsatzstopp, Speichertrennung, Inkompatibilitäts-Import, Archiv und beschädigte Daten. Vor CI-Abschluss noch **nicht** als bestanden werten. Echte Safari-/NAS-Abnahme auf Wunsch verschoben; öffentliche Hauptadresse nicht verändert. **Kein Merge/Deployment.**

---


## [DRAFT] W2 – finanzierte Aufträge beenden, NPC bei echter Absatzkrise stilllegen · 04.11.2026

**[MAIN]** weiterhin `b4e604d6`. **[DRAFT]** Neuer Folgebranch `feature/w2-npc-krisensteuerung-20261104` auf dem W1-/2D-/W2-Integrations-Draft #165. Der Core von Regel16 erhält die deterministische `krisenLage` (rein lesend) und `krisenSteuern` (stündliche Validierung im bestehenden `m_core_step`), ohne zusätzliche Simulationsschleife und ohne neue Save-Felder. Regel14/15, unveränderter W1-/2D-Modus, reguläre Speicherslots und der öffentliche Hauptlink bleiben unverändert.

**[KERNVERHALTEN]** Vor jeder neuen NPC-Fördercharge werden **bereits gebundene Erzverträge und Lagerbestände vom tatsächlich bezahlbaren Endkundenvolumen abgezogen**. Station, Lagerplätze und Unternehmen müssen je mindestens ein weiteres Erz real vorfinanzieren können. Ohne solche Finanzierung erteilt der Core **nur nicht durch aktives Treuhand gedeckten** NPC-Minern den vorhandenen validierten `shipWait`-Befehl. Ein vollständig vorfinanzierter laufender Vertrag wird nicht storniert. Der Status zeigt `absatzstopp`, `lagerengpass`, `abnahmeengpass`, `betriebskapitalengpass` oder `arbeitsbereit`. Wenn wieder freies Budget besteht, wird höchstens ein ruhender Miner pro Stunde über den bisherigen `shipMine`-Befehl angefordert, statt parallele ungesicherte Aufträge zu versprechen.

**[ZUSÄTZLICHER DIREKTNACHWEIS]** Das Regel-16-Auftragsgate prüft die freie Endkundenkasse **direkt beim Binden jeder Charge**, für Spieler und NPC identisch und zusätzlich zur stündlichen Betriebsruhe. Es zieht vorhandenes Erzlager, schon reservierte Mengen und unverkaufte Fracht vom zahlbaren Restabsatz ab. Ein kontrollierter Teillieferungs-/Stopp-Test zeigt nach 1.998 verkauften Erz genau 20 ISK freies Käuferbudget: die nächste neue Fördercharge beträgt nur 2 statt 50 Erz und endet bei 2.000 tatsächlich bezahlten Exporten. Keine Änderung an Regel15.

**[GEMESSEN, gezielter Core-Probelauf]** Seed42 ohne Spieler: bisher 2 vollständig bezahlte NPC-Miner, Käuferbudget nach **2.000 verkauftem Erz = 0 ISK**; beide Miner wechseln bis Tick 1.440 nach `halten`. NPC besitzt zu diesem Zeitpunkt 17.800 ISK; **Marktausfall ≠ Insolvenz**. Danach bis Tick 10.080 keine weitere NPC-Förderung, weder kostenlose Betriebskosten noch neue Hüllen oder Minting. Mit Spieler-Miner gilt dieselbe Marktstopp-Regel für NPC, während der Spieler-Nutzer weiter seine eigenen validierten Aufträge steuert. Bereits finanzierte Verträge werden nicht voreilig abgebrochen.

**[TESTS]** Die neue `tests/w2-npc-krise.test.mjs` prüft getrennte Regel14/15-Saves, reinen read-only Bericht, zugesagte Aufträge während Finanzierungsengpass, Umsatzstopp ohne Cash-Verlust, Spieler-Konkurrenz und erneut 13 Seeds × 90 Tage mit täglichem Audit, festen Hash-Replays, 0 Minting und Save/Load. Die vorhandene vollständige W1-/2D-/W2-Suite bleibt vorgeschrieben. **Github-CI noch ausstehend**; nur tatsächlich abgeschlossene Jobs als bestanden melden.

**[OFFEN]** Ein noch zahlungsfähiger Konzern ohne Absatz ist *nicht insolvent*. Formale Insolvenz, Flottenverlust, Fremd-Markteintritt und fortlaufend finanzierte Endnachfrage bleiben unabhängige W2-/W4-/W5-Gates; keine spekulativen Rettungen. Echte iPad-Safari-/NAS-Abnahme ist auf Nutzerwunsch verschoben; spätere Tests bevorzugt über seinen bereits vorhandenen Hauptlink nach separater Integrations- und Veröffentlichungsfreigabe. Kein Merge/Deployment.

---

## [DRAFT] W2-Entscheidung mit W1-/2D-Miner auf einem Core · 04.11.2026

**[MAIN]** unverändert `b4e604d6`. **[DRAFT]** Der Integrationsbranch `feature/w2-miner2d-gemeinsam-20261104` ist auf W1-/2D-Draft #164 gestapelt. Er uebernimmt den exakten, bereits gesondert geprüften Regel-16-Core aus #163 anstelle des bytegleichen Regel-15-Cores aus #164; W1-UI, 2D-Renderer, Controls, laufende Grafik, Regel-14-Standard und Regel-15-Speicherschutz bleiben unverändert. Die 2D-Projektion liest reale NPC-/Spielerschiffe und deren Kassen als eingefrorene Darstellung; die W2-Autoinvestition arbeitet im originalen `m_core_step` mit validierten `shipBuy`-/`shipMine`-Befehlen.

**[GEMESSEN]** Der isolierte Core-Gegencheck bestätigt: Regel14-Referenzhash `866776f7d84ef15e` erhalten; Regel15-NPC-Anzahl nach 120 Minuten 1; Regel16-NPC-Anzahl 2 und geldechter Audit. Neue Kombinationstests prüfen W2-2D-NPC-Darstellung, reale Bezahlung einer neuen Hülle, W2-Spieler-NPC-Konkurrenz, Save/Load/Replays und Nachfrageende. Tests werden erst nach tatsächlicher GitHub-CI als bestanden eingestuft.

**[OFFEN]** W2-2D als öffentliche Spieloption, W2-Speicherslot, autonomer Konkurs/Markteintritt, Endverbrauch sowie iPad-Safari-/NAS-Abnahme. Nutzer möchte spätere manuelle Tests bevorzugt über den bereits vorhandenen Hauptlink statt Codespaces. Kein Merge oder Deployment ohne ausdrückliche Freigabe.

---

## [DRAFT] W1-Wirtschaft und 2D-Miner verbunden · 04.11.2026

Der [Integrations-Draft #164](https://github.com/tobiasfranziskus/Check/pull/164)
(`feature/w1-miner2d-integration`, gegen den W1-Branch) stapelt gezielt Grafik und
Touch aus [#162](https://github.com/tobiasfranziskus/Check/pull/162) auf den
unveränderten Regel-15-Core aus [#161](https://github.com/tobiasfranziskus/Check/pull/161).
`?modus=miner2d` bedient denselben W1-Zustand und Speicherplatz wie die Kontenansicht:
bezahlter Komplettkauf, eigene Schiffsauswahl, Förderung, Teil-/Volllieferung und
Stop/Erstattung. Keine zweite Wirtschaft oder Uhr; Regel-14-Standard bleibt bestehen.
**106/106 Node-Einzeltests** und Chromium-Touchprüfung in drei Viewports erfolgreich;
**reale iPad-Safari-/NAS-Abnahme bleibt offen**. Herkunft, Bedienweg und Grenzen:
[W1_2D_INTEGRATION.md](W1_2D_INTEGRATION.md). W1 bleibt endlich finanziert;
W2–W6 und neue Geldregeln werden dadurch nicht vorgezogen. Kein Merge/Deployment.


## [DRAFT] W1 – bezahlte Miner-Vollkosten, Stationsliquidität und Amortisation · 04.11.2026

**[MAIN]** `b4e604d6` unverändert. **[DRAFT]** [PR #161](https://github.com/tobiasfranziskus/Check/pull/161) erweitert im bestehenden Core die *rein lesende* Prüffunktion `pilotWirtschaftsStand` und den W1-Audit um tatsächliche Kassenüberschüsse beider Miner-Konzerne, Kosten einschließlich vollständig bezahlter Minerhüllen, noch gebundenes Arbeits-/Abnahmegeld, Stationsliquidität, Fonds-Einnahmen und stationären Erzbestand. Der Bericht erzeugt weder neue Geldflüsse noch Produktionsrezepte oder Spielstandsfelder.

**[GEMESSEN]** Seed42, Spieler und NPC kaufen je einen Miner und fördern parallel: je 10.500 ISK vereinnahmte Erzverkäufe, 2.100 ISK tatsächliche Förderarbeit, 600 ISK Schiffanschaffung; **je +7.800 ISK** Überschuss nach beiden Kostenblöcken. Ein Miner benötigt bei 10 ISK Verkaufspreis und 2 ISK Miningkosten rechnerisch **75 verkaufte Erz** bis zur Amortisation. Die Station erwirbt 2.100 Erz für 21.000 ISK, exportiert 2.000 für 20.000 und hält 100 Erz (kalkulatorisch 1.000 ISK Warenwert, **kein freies Geld**); ihre Liquidität sinkt um 1.000 ISK auf 0. Endkäuferkasse ebenfalls 0, Gesamtbestand 27.000 ISK. Das ist ein **positiver, aber endlicher Miner-Cashflow**, keine wirtschaftliche Dauerschleife.

**[NEUER AUDIT]** Für beide Firmen, Station, Verkäufer und Endkäufer wird `anfängliche Kasse + Erlöse − bezahlte Kosten = freie Kasse + noch gebundene Mittel` unabhängig gegen die echten Stats-Gegenkonten geprüft. Mining-Löhne müssen exakt dem Systemfonds-Zuwachs entsprechen, Schiffkäufe exakt den Einnahmen des Verkäufers, Stationskäufe/Exporte den realen Warenbewegungen. Fehlbuchungen werden auch bei erhaltener Gesamt-ISK-Summe erkannt; solche manipulierten Daten dürfen nicht importiert werden. Ältere Krisentests, die mit manuellen Umbuchungen arbeiten, prüfen jetzt korrekt **nur** deren ISK-Erhaltung, nicht einen tatsächlich gebuchten Geldfluss.

**[TEST]** [CI #41785898616](https://github.com/tobiasfranziskus/Check/actions/runs/41785898616): **97 von 97 Node-Tests bestanden**, inklusive der bisherigen 13 Seeds × 90 Tage und zusätzlich unabhängiger Vollkostenrechnung an allen 1.170 Tagesgrenzen, Manipulationskontrolle, Save/Load und Hash-Referenz Regel14 (`866776f7d84ef15e`). Die zusätzlichen historischen CI-Referenzjobs waren bei der letzten Prüfung noch nicht abgeschlossen. **Keine iPad-Safari-/NAS-Abnahme; kein Merge nach main.**

**[NÄCHSTE STUFE]** W1-Wirtschaftsrechnung als **endlichen, finanzierten** Piloten abnehmen; W2-Konkurrenz/Unternehmenskassen mit echten Kaufentscheidungen vorbereiten. Das langfristige Endkunden-Budget bleibt offen bis echte materielle Verwendungen (W4/W5) und separat beschlossene Geldregeln. Keine automatische Auffüllung aus Fonds oder Konzernvermögen.

---

## [DRAFT] W1 – Endabnahme-Kassenherkunft unabhängig auditiert · 04.11.2026

**[MAIN]** `b4e604d6` unverändert. **[DRAFT]** [PR #161](https://github.com/tobiasfranziskus/Check/pull/161) ergänzt eine read-only Finanzierungsprüfung des Regel-15-Exportkäufers: Die anfänglichen 20.000 ISK müssen zu jedem Tick exakt der verbleibenden Käuferkasse plus den tatsächlich gebuchten und bezahlten Erzexporten entsprechen. Jede zusätzliche, nicht über einen bewilligten echten Käufererlös belegte Einzahlung wird als `finanzierung.differenz` kenntlich; der Gesamt-Audit wird rot, selbst bei ansonsten ausgeglichener Geld-/Warenbilanz. Der Regel-14-Pfad bleibt unverändert. Spielstandsimporte mit dieser Abweichung werden zurückgewiesen.

**[GEMESSEN]** Im Seed42 nach 2 Tagen mit einem bezahlten Spieler-Miner und NPC-Miner: 2.100 Erz gefördert, 2.000 für insgesamt 20.000 ISK exportiert, 100 Erz noch auf der Station; 0 ISK beim Exportkäufer und bei der Station, je 10.800 ISK bei Spieler und NPC, 4.200 ISK Arbeitsfonds sowie 1.200 ISK Schiffverkäufer. **27.000 ISK Gesamtbestand unverändert, 0 Emission.** Daraus folgt kein dauerhafter Käuferetat. Der Browserpilot zeigt nun getrennt Exportzahlungen, Käuferabweichung und die vollständige Geldverteilung.

**[TEST]** [CI-Testjob #41783327307](https://github.com/tobiasfranziskus/Check/actions/runs/41783327307): **93/93 Node-Tests erfolgreich**, darunter 13 Seeds × 90 Tage mit täglicher Käuferherkunftsprüfung, Save/Load, illegitime bilanzneutrale Kassenübertragungen, unveränderte Regel-14-Referenz. **Vollständiger CI-Lauf erfolgreich abgeschlossen** (7 erfolgreiche Jobs, kein Fehlschlag). Keine iPad-/NAS-Abnahme.

**[OFFEN]** Die zusätzliche Käuferfinanzierung ist nicht implementiert: echte Mittelrückflüsse benötigen eine bezahlte Folge-Wertschöpfung mit Endkunden oder eine separat freigegebene, begrenzte Modell-B-Emission. Kassenumbuchungen allein reichen nicht. Weiterhin keine Produktfreigabe oder Merge.

---

## [DRAFT] W0 – beidseitig vorfinanzierte Erzaufträge · 04.11.2026

**[MAIN]** unverändert `b4e604d6`, Version v0.12.5 / Regel14 / Schema8. **[DRAFT]** [PR #161](https://github.com/tobiasfranziskus/Check/pull/161) ergänzt den separaten Regel-15-Erzpilot, ohne `main` und den regulären Spielstand-Slot `slot1` anzutasten.

**Implementierung:** Der bestehende deterministische Core bindet jetzt vor Förderbeginn jeweils (1) Stationsgeld für die tatsächlich abnehmbare Erzcharge und entsprechende Lagerplätze sowie (2) die vollständigen Minerbetriebskosten für die noch zu fördernde Charge auf unabhängigen Arbeits-Treuhandkonten. Das Erz wird erst bei nachgewiesener Lieferung aus dem Stations-Treuhand bezahlt. Bei Stop/Abbruch werden Teillieferung und ungenutztes Erwerbs-/Betriebsbudget auseinandergebucht und erstattet. Spieler und NPC unterliegen denselben Regeln. Ohne finanzierten Auftrag: keine Förderung, keine Kosten. Keine ISK-Emission und kein neuer Waren-/Produktionszweig.

**Audit und Save:** Geld- und Warenaudit erweitert um unabhängigen Vertrags-Audit (Gegenprüfung beider Treuhandkonten, Besitzschiff, reservierte Menge, Kapazität); auch gezielte Falschbuchungen mit insgesamt bilanzierendem ISK werden erkannt. Regel-15-Saves ohne die neuen Felder bleiben ladbar und beim reinen Anzeigen hashgleich; Import mit Vertrags-/Warenfehlern wird abgewiesen. Alt-Aufträge aus dem Forschungs-Draft ohne Arbeits-Treuhand werden kontrolliert abgewickelt, neue Aufträge sind beidseitig vorfinanziert. UI zeigt freie Stationskasse, reserviertes Abnahmegeld und vorfinanziertes Arbeitskapital.

**Direkt geprüft:** Seed42, zwei Miner: zu Beginn 100 Erz abnahmegebunden (1.000 ISK) und zusätzlich 200 ISK Arbeit reserviert, je Förderminute buchungssicher reduziert; 13-Erz-Abbruch mit Zahlung von 130 ISK, Erstattung 370 ISK Abnahmegeld und 74 ISK Arbeitsbudget. Regel-14-Seed42-60-Minuten-Referenzhash weiterhin `866776f7d84ef15e`. Ein weiterer direkter Seed42-90-Tage-Lauf ergab bei zwei Minern 2.100 geförderte Erz, 2.000 exportiert und danach keinen weiteren Absatz. **Das ist bewusst kein Langzeit-Finanzierungsnachweis.**

**Tests im Draft:** `tests/erzpilot.test.mjs` prüft u.a. Treuhandbindung, Invarianz gegen Falschbuchung, Stop/Erstattung, liquide Käufer, Rückkehr externer Finanzierung aus vorhandenen Guthaben, Save/Load alter/neuer Verträge sowie **13 Seeds × 90 Tage mit aktivem Spieler- und NPC-Miner**. Browser-UI-Test prüft Käufe, Zeitsprung, separaten Pilot-Slot, Archiv und JSON-Sicherung. Die letzte vor diesem Arbeitspaket vollständig erfolgreiche CI war [#41722964221](https://github.com/tobiasfranziskus/Check/actions/runs/41722964221) mit 77/77 Node-Tests. Die inzwischen erweiterten W0/W1- und UI-Tests erreichten **90/90 Node-Tests, 0 Fehler** im aktuellen [CI-Testjob #41778757525](https://github.com/tobiasfranziskus/Check/actions/runs/41778757525) vom 04.11.2026. Darin sind die 13×90-Tage-Szenarien mit Spieler- und NPC-Miner und unabhängiger täglicher Buchhaltung enthalten. **Der komplette historische Referenz-Workflow läuft noch; reale iPad-/NAS-Abnahme nicht erfolgt.**

**Nächstes Gate:** Das externe Exportbudget von 20.000 ISK endet nach 2.000 Erz. Ein dauerhafter Budgetrückfluss benötigt nachweisbar finanzierte Endnachfrage und/oder eine gesondert zu genehmigende Modell-B-Geldregel. Keine kostenlosen Fondsfüllungen. W2–W6 und Wartungs-/Ersatzverbrauch bleiben nachgelagert.

---


## [DRAFT] W1 – bedienbarer Erzpilot und Zielarchitektur Reparaturen · 03.11.2026

**[MAIN]** `b4e604d6` weiterhin ohne Integration des Piloten. **[DRAFT]** [PR #161](https://github.com/tobiasfranziskus/Check/pull/161) enthält nun zusätzlich eine browserseitig anwählbare Pilotansicht (`?modus=erzpilot`; Link im HQ) mit Miner-Komplettkauf, Bergbau-Befehl, Stop, +1 Stunde/+1 Tag, Kassen-, Waren-, Audit- und Hashanzeige. Gleicher `m_core_index`, **kein** zweiter Simulationskern, keine automatische Weiterrechnung im Hintergrund. Die reguläre Regel-14-UI startet in diesem Modus nicht.

Der Pilot verwendet den **eigenen** IndexedDB-Slot `aphros-void-erzpilot-regel15-v1` sowie separate JSON-Importe/-Exporte. Pilot-Neustart/Import archiviert vor dem Überschreiben den letzten Pilotstand; inkompatible/defekte Stände werden nicht still überschrieben. Der Regel-14-Standard-Slot bleibt unverändert. Für die Pilotansicht existiert ein eigener simuliertes-DOM-Node-Test (`tests/erzpilot-ui.test.mjs`). **Reale iPad-Safari-/NAS-Prüfung steht weiterhin aus.**

**[BESCHLOSSEN]** Industrie-Endverbrauch künftig durch Schiffe/Module: Erweiterungsinvestitionen, nachweislich betriebsabhängigen Verschleiß und Reparaturen sowie echte Kampfverluste mit kostenpflichtigem Ersatz. Keine Treibstoff-/Energiezellenpflicht, keine künstlichen Kosten für abgestellte Schiffe. Konkrete Raten/Rezepte bleiben offen bis W5/W6, keine vorzeitige Implementierung in W1. Piratenzerstörung ist eine Waren-, **keine Geldquelle**.

**[TESTBELEG]** [CI #41718985105](https://github.com/tobiasfranziskus/Check/actions/runs/41718985105) auf vorherigem PR-Stand **erfolgreich abgeschlossen**; 73/73 Node-Tests und historischer Referenz-Workflow. Direkter W1-Langlauf: 13 Seeds × 90 Tage (1.170 tägliche Geld-/Warenaudits und 13 Save/Load-Prüfungen) ohne Auditabweichung; das Exportbudget erschöpft sich dennoch in allen Welten. **Die neue UI-Änderung und die UI-Tests sind damit noch nicht belegt**: vollständige neueste CI separat abwarten. Kein produktiver W1-Nachweis für dauerhaften Geldrückfluss.

**[NÄCHSTER SCHRITT]** Einen wiederkehrend finanzierbaren Erz-Endabnahmevertrag mit tatsächlicher Budgetquelle entwerfen und prüfen. Keine neue ISK-Emissionsregel ohne explizite Freigabe. Danach UI/iPad-Abnahme und erst dann separater Merge-Entscheid.

---

## [DRAFT] Wirtschaftlicher Vertikalaufbau – erster Erzpilot · 03.11.2026

**[MAIN]** Letzter vor diesem Auftrag abgeglichener Stand: `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, v0.12.5, Regel 14, Schema 8. Historische B-K12-Forschungs-PRs #155–#160 sind ohne Merge geschlossen. Keine offenen PRs vor Beginn dieses Branches.

**[BESCHLOSSEN]** Die Projektleitung hat am 03.11.2026 den kontrollierten wirtschaftlichen Neuaufbau W0–W6 statt weiterer umfassender Reparaturen beauftragt (einziger Plan: `docs/ROADMAP.md`). Bestehende Spielmechaniken, Technik und Spielstände werden nicht gelöscht oder automatisch konvertiert.

**[DRAFT]** Branch `feature/erzpilot-vertikalschnitt-20261103`:
- Neue **Core-only**-Pilotregel 15 neben dem unveränderten regulären Regel-14-Einstieg; `m_core_index.createErzState(seed)`, `ERZ_RULES`, `loadErz(json)`. Noch keine Browser-UI zum Start des Piloten, keine Migration zwischen den Modi.
- Ausschließlich `erz` als Förderware und `miner` als vollständige, lagerbegrenzte Hülle. NPC3 kauft beim Start einen Miner für 600 ISK; Spieler kann einen Miner über `shipBuy` kaufen. Das Geld geht an den expliziten Verkäufer.
- Förderung erst nach vorab bezahlten 2 ISK je Arbeitsminute. Erz wird im bestehenden Ledger gebucht, echte Chargen an die Station verkauft und erst aus vorhandenem Stationslager nach außen exportiert. Exportkäufer besitzt zu Beginn 20.000 ISK; 10 ISK pro Erz; keine Emission/Gratisnachfüllung.
- In der Pilotwelt werden Produktion, Piraten, Kopfgeld, Zivilverbrauch, Funds-Nachfüllung, Händler-KI und alte Ersatzkaufregeln nicht ausgeführt. Die alte Regel-14-Spielwelt benutzt unverändert ihren bisherigen Pfad; keine zwei parallelen Ticks.
- Der reguläre Spielstart, UI und Legacy-Spielstände sind nicht geändert; Pilotregel 15 ist kein freigegebenes Release.

**[BISHER DIREKT GEPRÜFT]** JavaScript-Kern über die tatsächlich aus `index.html` extrahierten Core-Module ausgeführt (Seed 42, 600 Minuten): 1.059 Erz gefördert, 900 Erz real gegen 9.000 ISK Exportbudget abgenommen, Geld-/Warenaudit `ok`, NPC und Spieler mit bezahltem Miner. Gleichlauf gleicher Befehle/Seed war hashgleich; historischer Regel-14-Seed42-60-Minuten-Hash `866776f7d84ef15e` unverändert. Weitere 60-Stunden-Probe: Exportbudget geht exakt auf 0 ISK, nach Ausschöpfung keine weiteren Exportzahlungen, keine ISK-Emission, Geld-/Warenbilanz `ok`, Miner stehen bei vollem Frachtraum still. **Diese lokalen Prüfungen ersetzen keine vollständige Node-Suite, CI oder echte iPad-/NAS-Abnahme.** Neuer Node-Test `tests/erzpilot.test.mjs` ist hinzugefügt; CI-Ergebnis zum Zeitpunkt dieser Dokumentation noch offen.

**[OFFENES GATE]** 13 Seeds × 90 Tage und Krisen-/365-Tage-Fälle, UI-Zugänglichkeit/Touch, Gesamtkosten einschließlich langfristigem Kapitalersatz, dauerhaft finanzierter Käufergeldrückfluss sowie eine etwaige Geldmodell-B-Emissionsregel sind **nicht** nachgewiesen bzw. nicht genehmigt. Die vorfinanzierten 20.000 ISK sind ausdrücklich endlich. W0/W1 ist deshalb ein geprüfter Einzelkreislauf-Prototyp, noch keine dauerhaft tragfähige Gesamtwirtschaft. Kein Merge/Deployment.

---


## [ANALYSE] B8o/B8p – bezahlte Aufträge und Endnachfrage · 01.11.2026

**[MAIN]** Weiterhin `0d473e6`, v0.12.5/Regel14/Schema8 ohne Produktcodeänderung. Dokumentations-Draft #78 ist noch **nicht integriert**; dieser Abschnitt bezieht sich auf den vorgeschlagenen Docs-Stand.

**B8o [#79](https://github.com/tobiasfranziskus/Check/pull/79)**: Isolierte Entwurfsprobe für ein einheitliches, vor Arbeit real gesperrtes Auftragsbudget mit tatsächlicher Bezahlung und Erstattung des Restes bei Abschluss/Schiffsverlust. **[CI #41288212733](https://github.com/tobiasfranziskus/Check/actions/runs/41288212733):** 67/67 bestehende Node-Tests und synthetischer Vertragsbuch-Stresstest mit **13 Seeds und 9.441 Buchungsereignissen**, nie doppelt ausgegeben, keine ISK erzeugt oder verloren; 40-Minuten-Frachter (167 ISK reserviert, 166 gezahlt, 1 erstattet), Miner 300 ISK/2h, Jäger 150 ISK/3h Budget mit Abbruch nach 50 ISK Kosten und 100 ISK Rückzahlung. **Nicht die reale Spielsimulation und keine save-kompatible Produktumsetzung!** Auftragsbudgets müssen im echten Core bei allen Geldpfaden und Save/Audit berücksichtigt werden.

**B8p [#80](https://github.com/tobiasfranziskus/Check/pull/80)**: Original-Krisenwelten Seed42/7 × 4 Varianten ×90 Tage, **[erfolgreiche Push-CI #41288140390](https://github.com/tobiasfranziskus/Check/actions/runs/41288140390)**, 67/67 Regressionen, 17.280 stündliche unabhängig auditierte Geld-/Warenstände, deterministische Replays und 64 Save-/Load-Prüfungen. Pauschale Zahlungen für tatsächlichen Nahrung-/Medizinverbrauch aus vorhandenen Systemfonds (1.240/1.230 ISK) oder aus einer *hypothetischen* global begrenzten ISK-Ausgabe (2.200/2.350 ISK) retten weder die insolventen Händler noch die Versorgung; an Tag90 fehlen in allen Varianten NPC1/NPC2-Frachter und alle sechs Verbraucherstationen sind im Nahrungs-/Medikamentenmangel. Der Gesamtdeckel 6.000/12.000 ISK wird **nicht** erreicht, beide Emissionsvarianten sind hashidentisch. Emission gegen vorhandene Startlager-Ware würde außerdem die echte neue Warenherkunft **nicht** belegen. **Keine Freigabe für zusätzliche ISK!**

**Neuer positiver Auditbefund im Originalkern:** `m_core_sicherheit.patrouille` und `ueberfall` minten Kopfgelder schon heute. Seed42 aktive Krise: 6.360 ISK Kopfgeld, 11.360 ISK in tatsächlichen Senken (netto −5.000); Seed7 4.800/9.800 ISK (netto −5.000). Keine global gedeckelte Kopfgeld-Emissionsregel erkennbar, nur ereignisgebundene Buchungen. **[NÄCHSTES GATE]** Alle globalen Einnahmequellen, Geldsenken und realen Leistungen prüfen; getrennt von Vertragsbudget die Nachweis-/Finanzierungskette neuer Versorgungslieferungen untersuchen. Keine genehmigte Produktimplementierung, Save-Migration oder iPad-/NAS-Abnahme.

## [ANALYSE/ARCHIV] B8l–B8n: Fahrfinanzierung und Endnachfrage · 01.11.2026

**[MAIN]** `main 0d473e6ac85242e1ebb9c52ce1fa59c4ca30139a`, v0.12.5/Regel14/Schema8, unverändertes `index.html`. Der vorherige docs-only-PR #73 wurde mit ausdrücklicher Nutzerfreigabe gemergt; frühere Abschnitte, die #73 noch als Draft oder `main 491f8e2` aktuell nennen, sind **historische Momentaufnahmen**. Die Untersuchungen #75, #76 und #77 sind **geschlossen, ohne Merge**; ihre Testwerkzeuge/CI bleiben archiviert.

**[TEST B8l #75](https://github.com/tobiasfranziskus/Check/pull/75)**: Originale NPC3-Krise, 2 Seeds × 2 Varianten × 90 Tage; 67/67 Regressionen, 8.640 stündliche unabhängige Audits und Replays, 32 Save/Load [CI #41285007103](https://github.com/tobiasfranziskus/Check/actions/runs/41285007103). 0-ISK-Leerfahrten erklären über 99 % der künstlich weiterlaufenden unbezahlten Frachterarbeit. Nur das Stoppen bei 0 verhindert keine bereits unbezahlbar gestartete Reise.

**[TEST B8m #76](https://github.com/tobiasfranziskus/Check/pull/76)**: Originalkern mit analytischem Abfluggate, 2 Seeds × 4 Varianten ×90 Tage; 67/67 Regressionen, **17.280** stündliche Audits und deterministische Replays, **64** Save/Load [CI #41286141777](https://github.com/tobiasfranziskus/Check/actions/runs/41286141777). Realer gekaufter NPC3-Frachter und Kassenprüfung für künftige Reisedauer plus eine Stunde Minerreserve reduzieren ungedeckte NPC3-Arbeitskosten auf **0 ISK in Seed42 und Seed7**, bei nur **5/8 echten Warenverkäufen** und 69/503 ISK Endkasse. **Keine echte Mittelreservierung, keine Garantie über andere Seeds, keine auskömmliche Gesamtwirtschaft bewiesen**.

**[TEST B8n #77](https://github.com/tobiasfranziskus/Check/pull/77)**: Original-Spielerkrise Seed42/7 vs. passive Welt, 4×90 Tage, 67/67 Regressionen, **8.640** stündliche Audits und Replays, **32** Save/Load [CI #41286301508](https://github.com/tobiasfranziskus/Check/actions/runs/41286301508). In aktiven Welten schon **an Tag14** und bis Tag90 Spieler 39.762/39.338 ISK, NPC-Händler **0 ISK und 0 Frachter**, Stationskassen zusammen nur **4.466/5.172 ISK**; passiv 22.451/22.629 ISK am Tag90, fünf NPC-Händlerfrachter, keine Nahrung-/Medikamentenmangelstation. Aktive Welten: alle sechs Verbrauchsstationen an Tag90 bei Nahrung und Medikamenten im Mangel. `m_core_stunde.verbrauch` löscht Nahrungs-/Medizinbestände ohne Geldzahlung, `aufnehmbar` verlangt reale Stationskasse; Fonds und Außenhandel führen keine regelgebundene neue Endnachfrage ein. **Spielerersparnisse dürfen nicht abgeschöpft werden**. Beides sind eine Käufer-/Nachfrage- und eine Flotten-/Finanzierungsursache, keine reine Preisfrage.

**[NÄCHSTE ENTSCHEIDUNG]** Allgemeines, gemeinsames Fahrtkosten-/Arbeitsfinanzierungsmodell für Spieler/NPC getrennt vorplanen (inkl. atomarer Mittelbindung, Stillstand bei Insolvenz), ohne den analysierten NPC3-Sonderfall in Produktcode zu übernehmen. Für den wirtschaftlichen Wiederanlauf **Geldmodell B nur nach gesonderter Freigabe der konkreten globalen, begrenzten, auditierbaren Leistungs-/Endnachfragezahlung** erproben; zuerst unabhängigen Zahlungs- und Warenherkunftsnachweis, danach 13×90/365d und Krisenfälle. Keine spontane Geldschöpfung, Gratisrettung oder individuelle Konkursgarantie. Reale iPad-/NAS-Abnahme und Produkt-Migrationstests fehlen. Der vorliegende docs-only-PR wartet auf Nutzerfreigabe.

## [ANALYSE/ARCHIV] Repo-Bereinigung und E2a · 01.11.2026

**[MAIN]** Letzter GitHub-Stand erneut geprüft: `491f8e2a73ad7ae765ba15c686a25c3a55d638d9`, Produkt `v0.12.5`, Regel14, Schema8. **Kein Merge, keine Produktauslieferung und keine Spielstandänderung.** Die **17 reinen Untersuchungs-Drafts #56–#72** und die danach vollständig ausgeführte **E2a-Analyse #74** wurden am 01.11.2026 aus der offenen PR-Liste **geschlossen und nicht integriert**. Ihre Heads, vollständigen PR-Verläufe, CI-Ergebnisse und der gesicherte aktuelle B8k/E1-Dokumentationsstand bleiben für Replikation verfügbar. Die verlinkten historischen Texte darunter dürfen nicht als aktuell offene Integrations-PRs verstanden werden. Der alte Bestand historischer Analysebranches wurde nicht blind gelöscht: der aktive GitHub-Connector hat keinen Branch-Delete-Zugriff; er kann nur PR-Metadaten ändern. Der vorhandene **Dokumentations-PR #73** bleibt weiterhin Draft.

**[ANALYSE/DRAFT] [E2a #74](https://github.com/tobiasfranziskus/Check/pull/74)** trennt *Originalautohandel*, *nur sichere Zielsysteme* und ein zusätzliches vereinfachtes *Hin-/Rückfahrt-Vollkosten-/1h-Minerreserve-Gate* vom unveränderten Kontrollkern. **[TEST] [CI #41282459097](https://github.com/tobiasfranziskus/Check/actions/runs/41282459097) auf dem geprüften Code**: **67/67 Node-Standardtests** erfolgreich, acht Welten (Seeds 42/7 × 4) über 90 Tage mit 17.280 unabhängigen stündlichen Geld-/Warenaudits und gepaarten deterministischen Replays, 64 Save/Load-Roundtrips; historischer Seed42-Hash erhalten. Keine `index.html`-Änderung. **[NEGATIV]** Seed42 ungeschützt: Originalhülle verloren, 29 echte Frachter-Warenverkäufe, Endkasse 771 ISK. Mit Sicherheitsfilter: Hülle erhalten, 7 Verkäufe, Endkasse 0 ISK, **90.160 ISK ungedeckter NPC3-Gesamtbetrieb**. Mit zusätzlich vereinfachtem Vollkosten-Gate: Hülle erhalten, 1 Verkauf, Endkasse 0 ISK, **90.941 ISK ungedeckter Betrieb**. Seed7: ohne Risiko-Gate Hüllenverlust und 10 Verkäufe/995 ISK Endkasse; mit Sicherheitsfilter Hülle erhalten, 15 Verkäufe/0 ISK Kasse/90.598 ISK ungedeckt; mit Vollkosten-Gate 1 Verkauf/0 ISK Kasse/87.268 ISK ungedeckt. Letztere Werte **sind Kostenforderungen, keine bezahlten ISK**, und keine vollständige Konzernrendite. Risikoschutz alleine erhöht den Versorgungs- und Liquiditätsstau; starre Pflichteskorte/gekaufte Jäger nicht als Produktregel freigeben. Der vollständig geprüfte E2a-PR **#74 wurde als negative Analyse ohne Merge geschlossen**; E1/B8k bleiben Beweise, sind ebenfalls geschlossen. Nur der Dokumentations-Draft #73 bleibt zur Freigabe offen.

**[NÄCHSTE ABGRENZUNG, PHASE B]** Bevor weitere Risiko-/Produktänderungen erfolgen, einen kleinen **E2b / B8l**-Diagnosefall erzeugen, der anhand von Originalkern-Ticks erklärt, *wann* NPC3 ohne zusätzliche Nachfrage auf 0 ISK fällt, *welche Miner tatsächlich weiter unbezahlte Arbeit leisten* und *welche Leerflüge/Cargo-Entscheidungen trotz ausbleibender finanziell tragfähiger Folgeaufträge weiter anfallen*. Danach ggf. getrennt finanziertes Warten/Sicherheitsroute/Eskorte mit positiven Kosten-/Versorgungs-Gates, nicht pauschal Schiffsschutz zulasten der Volkswirtschaft. Für Produktänderungen bleiben 13 Seeds ×90d, Spielerkrisen/365d, Regel-/Save-Migrationen, Geld-/Warenerhalt und echte iPad-/NAS-Abnahme ausstehend.

## [ANALYSE/DRAFT] Aktueller B8k-/E1-Befund · 01.11.2026

**[MAIN]** GitHub `main 491f8e2a73ad7ae765ba15c686a25c3a55d638d9` ist ein **reiner Dokumentations-Merge von [#55](https://github.com/tobiasfranziskus/Check/pull/55)** (31.10.2026, 23:57 UTC). Produktcode seit B5b [#46](https://github.com/tobiasfranziskus/Check/pull/46) unverändert: **v0.12.5 / Regel 14 / Schema 8**. Die Roadmap ist in `main` und #55 **gemergt**. Ein erfolgreicher GitHub-Pages-Build ist **keine** reale Safari-/NAS-Abnahme.

**[ANALYSE/DRAFT] [B8k #71](https://github.com/tobiasfranziskus/Check/pull/71):** NPC3 bezahlt jeweils **780 ISK** für einen Frachter und liefert in Seed42/7 **3–5** vollständige Silizium-Chargen. Isolierter Frachtercashflow **+62 bis +1.080 ISK nach Hüllenkauf**, ohne vollständige Miner-/Risiko-/Konzernkosten. NPC3-Endkassen **428/1.009/0/7 ISK**; nächste Runde scheitert an nicht gleichzeitig ausreichender Käuferkasse und freien NPC3-Mitteln/Minerreserve. Erster Frachter in allen vier Testvarianten an Tag90 vorhanden, aber **kein dauerhafter Handelswiederanlauf**. [CI #41255699799](https://github.com/tobiasfranziskus/Check/actions/runs/41255699799) erfolgreich: **67/67 Node-Regressionen**, 8×90d, **17.280** stündliche unabhängige Geld-/Warenaudits/Replays, **64 Save/Load-Roundtrips**. Nur Test-Runner, Workflow und Analysebericht; **nicht integrieren**.

**[ANALYSE/DRAFT] [E1 #72](https://github.com/tobiasfranziskus/Check/pull/72):** NPC3 kauft Frachter für **780 ISK** und 1–2 Jäger für jeweils **936 ISK**. Originalkampf mit analytischer tatsächlicher Mitflugteilnahme: Seed42/7 mit 1 bzw. 2 real kämpfenden Jägern, **ursprünglicher Frachter in allen vier Fällen zerstört**. Später vorhandene Frachter sind echte Ersatzkäufe. Die Pflicht-Abflugsperre wurde in den Testfällen nicht ausgelöst und beweist keine Wirksamkeit. [E1-CI #41256427684](https://github.com/tobiasfranziskus/Check/actions/runs/41256427684) und [#41256547910](https://github.com/tobiasfranziskus/Check/actions/runs/41256547910) erfolgreich: letzter Lauf 1/1 Job, finale Analyse **67/67 Node-Tests**, 8×90d, **17.280** stündliche Audits/Replays, **64 Save/Load-Roundtrips**. Frühere Fehler betrafen nur neue Analyse-Assertions. **Keine Produkt- oder Save-Regel, keine Pflichteskorte freigegeben**.

**[NÄCHSTER SCHRITT / OPTION]** Phase B bleibt prioritär: nach dem letzten bezahlten B8k-Verkauf Käufer-/Kassen-/Waren-/Minerreserve-/Vollkosten-Gate einzeln erklären, Modell-B-Endnachfrage nur als separat auditierte allgemeine Hypothese prüfen. E2-Risikogate getrennt: Kampf- und Schutzstärke, tatsächliche Co-Lokation, Warten, Risiko, Ersatz- und Jägerkosten. Keine individuelle Insolvenzrettung, Gratis-Schiffe, automatische Geldschöpfung oder pauschale Jägerquote. Volle 13×90-/365d-Produktgates, Migration, echte Safari-/NAS-Abnahme fehlen.

**[DOKUMENTATION]** Der darunter stehende B7/B8j-Block ist ein **historischer Snapshot vor B8k/E1 und vor Merge #55**. Diese Ergänzung liegt zunächst nur in einem docs-only Draft; kein automatischer Merge, keine neue Produktprüfung.


## [ARCHIV/ANALYSE] Wirtschaftsbefund B7/B8 bis B8j vor B8k/E1 · 01.11.2026

**[MAIN] unverändert:** `517728a958326e86751f09cd74d0c077edad9921`, Spiel **v0.12.5**, Regel **14**, Schema **8**. Alle nachfolgenden B7-/B8-Berichte sind **isolierte Analysebranches**, keine integrierten Preis-, Konto-, Piraten-, Geld-, Produktions-, Save- oder UI-Änderungen. **[BESCHLOSSEN] Geldmodell B** (globale, auditierte, begrenzte ISK-Entstehung gegen reale Leistungen) ist Zielrahmen im inzwischen **gemergten docs-only-PR #55**, kein freigegebener Emissionsmechanismus. Bestehende Roadmap auf `main` bleibt bis zur Freigabe verbindlich.

**[TEST/ANALYSE] Schiffs- und Kontenversuche:** [B7a #59](https://github.com/tobiasfranziskus/Check/pull/59) und [B7b–k #60](https://github.com/tobiasfranziskus/Check/pull/60) belegen die technische Durchführbarkeit gemeinsam vorfinanzierter Spieler-/NPC-Schiffsaufträge sowie einen real aus NPC3-Cash gekauften Frachter mit echten Folgegeschäften. Konten verhindern ungedeckte Arbeit, heilen aber die zivile Nachfrage nicht; unbeschränktes Handeln kann Kosten unterdecken, Sicherheit kann bezahlte Frachter erhalten, ohne neue Käufer zu schaffen. **Nicht integrieren.**

**[TEST/ANALYSE] Zivile Nachfrage und Geldquellen:** [B8a #61](https://github.com/tobiasfranziskus/Check/pull/61) zeigt in Seed42 aktiv Tag14 **39.762 von 50.000 Welt-ISK beim Spieler**, **4.466 ISK Stationscash**, fehlendes Fabrik-Eis/Material bei vorhandenen Vorräten an anderen Stationen. Reine Konsumvergütung erzeugte passiv **43.200 ISK** ohne Mehrversorgung; [B8e #65](https://github.com/tobiasfranziskus/Check/pull/65) erzeugte aktiv nur **578 ISK** aus global bedingten Exporten ohne Wiederanlauf. [B8f #66](https://github.com/tobiasfranziskus/Check/pull/66) mahnt wegen original kostenlos importierter Außenwaren und fehlender Einzelfracht-Provenienz gegen ungeprüfte Export-Minting-Regeln. B8b–d (#62–#64) zeigen reale Kassen-/Waren-/Produktionssperren, keine neue Produktregel.

**[TEST/ANALYSE] Reale abgeschlossene Frachtrunden:** [B8g #67](https://github.com/tobiasfranziskus/Check/pull/67) deckte aus bestehenden neutralen Meridian-Mitteln **403+413=816 ISK** für genau zwei echte 7er-Materialverkäufe an Cyris; dritte Ladung bleibt wegen fehlender Käuferkasse unverkauft. [B8h #68](https://github.com/tobiasfranziskus/Check/pull/68) trennt die Originalkosten: je vollständige Veldra–Cyris-Hin-/Rückrunde **+22 ISK**, vor Hüllenamortisation **780 ISK**, erstmaligem Leerflug **162 ISK** und Piratenrisiko. Nach Positionierung und noch unverkauftem drittem Kauf **−389 ISK realisierter Frachter-Cashflow ohne Hüllenkauf**; vorhandene Fracht/Hülle bleiben Assets. Keine positive Vollkostenrendite über viele Runden belegt.

**[BESTÄTIGT] Exakter Frachterverlust-/Ersatzpfad:** [B8i #69](https://github.com/tobiasfranziskus/Check/pull/69) verfolgt originale Seed42/7-Welten und weist aktiv Tag14/Tag90 **0 NPC1/2-Händlerfrachter**, ab Tag15 bis Tag90 **0 entsprechende echte neue Warenkäufe/-verkäufe**, dazu **12.401/11.445 ISK fällige, aber nicht bezahlte Frachterarbeit** aus. [B8j #70](https://github.com/tobiasfranziskus/Check/pull/70) belegt in den aktiven Welten **16/8 Piratenzerstörungen** und **11/3 real bezahlte Ersatzhüllen** (passiv **137/150 Verluste und 137/150 Ersatzkäufe**, jeweils 5 Schiffshüllen am Ende). Aktiv stehen am Endtag **2 fertige Frachter an der Werft**, NPC1/2 haben **0 ISK**, der reale Kauf kostet **750+30=780 ISK**, mit bestehendem Schiff **1.030 ISK samt Mindest-Rücklage**. Beim ersten schiffslosen Zustand reichen die Fondsstände **0–113 ISK** nicht für einen vollen Zuschuss; kein tatsächlicher Zuschuss. **Der bestätigte unmittelbare Ersatzblocker ist die reale Eigentümer-/Fondskasse, nicht ein Mangel an fertigen Werftschiffen.** [Abschließende B8j-CI #41253177047](https://github.com/tobiasfranziskus/Check/actions/runs/41253177047): **67/67 Node-Tests, 0 Fehler/Skips**, 4 Original-90d-Welten doppelt, **17.280 stündliche unabhängige Geld-/Warenaudits plus Replayhashes**, **32 Save/Load-Roundtrips**; Seed42 aktiv `784047684dfe5c56`, passiv `adf155a018b94094` unverändert.

**[OPTION/NÄCHSTER EINZELSCHRITT B8k]** Prüfen, ob der bestehende Bergbaukonzern NPC3 aus **tatsächlich frei verfügbarem Kapital** eine rentable Marktlücke nach Ausfall von NPC1/2 übernehmen kann: eine real bezahlte Hülle mit Minerreserve, echte Leer-/Ladungsarbeit, Käuferkasse, mindestens erste und zweite finanziert abgewickelte Handels-/Rückrunde, Verlust-/Risikobudget. Originalspieler Seed42/7 gegen passive Kontrollen, Original-Core deterministisch, stündliche Audits/Replay, Save/Load. **Keine individuellen Insolvenzrettungen, keine gratis Hüllen, keine neue ISK-/Preis-/Piraten-/Pilotenkontenregel im selben Versuch**. Scheitert es, tatsächlichen Engpass isoliert dokumentieren. NPC3-Diversifizierung ist **noch kein Nachweis einer neuen Firma**. Erst bei positiver Einzelprobe vollständige 13×90-/365d-Gates; keine iPad-/NAS-Abnahme dieser Analysen.

**[DOKUMENTATION]** Der bestehende [docs-only-PR #55](https://github.com/tobiasfranziskus/Check/pull/55) hat diesen damaligen Stand in `docs/ROADMAP.md` und `docs/PROJEKTSTATUS.md` **gemergt**; der Produktcode in `main` blieb unverändert. Dieser Dokumentationsschritt führt selbst **keine neuen Simulationen, Node-Tests oder reale Browserprüfungen** aus; zitierte CI wurden auf den jeweiligen Analyse-PR-Heads durchgeführt.


## [ARCHIV/ANALYSE] Wirtschaftsdiagnose und GitHub-Bereinigung · 31.10.2026

**Produktive Basis vor Dokumentations-Merge:** `main d454d0661dee48a7bfdb843d05096982d799e51f`, **v0.12.5 / Regel 14 / Schema 8**. Alle bisherigen Wirtschafts- und Eskortenanalysen enthalten **keine** neue produktive Preis-, Routen-, Piraten-, Jäger-, Geld-, Kredit-, Werft- oder Spielstandsregel. **B5a #42 und B5b #46 sind integriert**; die nachfolgenden B6-Tests wurden nur auf isolierten Analysebranches durchgeführt. Echte iPad-/NAS-Abnahme steht aus.

**[TATSÄCHLICH AUSGEFÜHRTE BEREINIGUNG]** Am 31.10.2026 wurden die **17** bislang offenen Forschungs-PRs **#32–#34, #36–#41, #44–#45, #48 und #50–#54** nach nachvollziehbarer Archivierung als `[ARCHIV/ANALYSE]` geschlossen, **kein Merge**. Der Dokumentations-PR #49 führt die verbindliche [Roadmap](ROADMAP.md), dieses Statusdokument und das neue [Handelszyklus-Evidenzarchiv](ANALYSEARCHIV_HANDELSZYKLUS_2026-10-31.md) zusammen. Hauptbelege sind die verifizierten GitHub-CI-Runs #41178667836 (B6c), #41179275120 (B6d) und **#41180157480 (B6e; letzter Head)** mit jeweils **19/19 erfolgreichen Jobs**, **67/67 Standardtests**; Wirtschaftsläufe/Hashes jeweils im Archiv und zugehörigen PR.

**[WIRTSCHAFTLICH NICHT FREIGEGEBEN]** Die aus Meridian bezahlten 1.380 ISK aus B6e ermöglichten **49 echte NPC-Trader-Warenverkäufe**, aber **0 ISK Tilgung**, am Endtag **0 Händlerfrachter**, Aldera weiterhin **0 Silizium/0 Bauteile** und die vier Krisen **4.450→8.903 ISK** ungedeckte Arbeit. Einzelkredit, nachträgliches Frachthonorar, pauschaler Piratenschutz, R3-Lagerdeckel und Cashblockade P1 **nicht integrieren**. Die Endverbrauchernachfrage und langfristige NPC-Kaufkraft bei Spieler-Sparfreiheit sind eine **offene System-/Geldregimeentscheidung**, keine beschlossene Emissionsregel. Als nächste **[OPTION]** B6f ausschließlich den realen 49-Lieferungen-Zahlungspfad auditieren; keine neue Mechanik vor Ursachenklärung. Die **[BESCHLOSSENEN]** Ziele günstigerer leichter Jäger, verlässlicher risikogerechter Eskorten und langfristig global mehr Jäger als Frachter bleiben nachgeordnet und noch nicht implementiert.

**[BRANCHBEREINIGUNG OFFEN]** PR-Schließung hat Git-Branches **nicht** entfernt. Die eingesetzte GitHub-Verbindung bietet keine Löschung von Branch-Refs; insbesondere historischen B1-Start `6855d76` und Testcode `cec7f93` für weitere Reproduktionen nicht ohne Ersatz vernichten. Eventuelle physische Löschung der verbleibenden Analyse-/Feature-Branches gesondert verifizieren; nicht als erledigt deklarieren. Kein Deployment.

## [ANALYSE/DRAFT] B6c/B6d und Jägereskorte-Konzept – 31.10.2026

**[MAIN] weiter v0.12.5, Regel 14, Schema 8, Commit `d454d0661dee48a7bfdb843d05096982d799e51f`.** Keine Änderung am Produkt durch die folgenden Tests oder die Designentscheidung; der technische Status-Block unten bleibt historisch überprüfbar. Die einzige verbindliche Produktpriorität steht in [ROADMAP.md](ROADMAP.md).

- **[TEST] B6c [#52](https://github.com/tobiasfranziskus/Check/pull/52)** auf abschließendem HEAD `eb6c9e3`, [CI #41178667836](https://github.com/tobiasfranziskus/Check/actions/runs/41178667836): 19/19 Jobs und 67/67 Node-Tests erfolgreich; 17 Läufe, 2.270 Tageshashes, 54.480 unabhängige Stunden-Audits/Replays, 220 Save/Load-Roundtrips. In allen vier echten B1-Spielerkrisen bereits an Tag 90 und weiterhin an Tag 365 **null NPC1/2-Frachter**. Trotz 1–2 bereits produzierter Hüllen an der Werft reichen die separaten NPC-Kassen für eine erste vollständig bezahlte profitable Handelsfahrt nicht. Die statischen Kapitaluntergrenzen sind keine ausgeführten Lieferungen.
- **[TEST] B6d-C0 [#53](https://github.com/tobiasfranziskus/Check/pull/53)** auf abschließendem HEAD `d40001f`, [CI #41179275120](https://github.com/tobiasfranziskus/Check/actions/runs/41179275120): 19/19 Jobs, 67/67 Standardtests, 34 gepaarte Simulationen, 4.540 Tageshashes, 108.960 Stunden-Audits/Replays, 440 Save/Load-Roundtrips erfolgreich. Isoliertes Stationshonorar **erst nach echtem NPC-Frachterverkauf**: Standardwelt Mangelstunden 791→733, Frachterverkäufe 310.058→307.856, Aldera-Bauteil-Endsumme 505→399, zusätzlich 24.893.684 ISK über den Lauf transferiert (keine Geldschöpfung). **Vier Krisen unverändert: null NPC1/2-Warenverkäufe und null Frachter**, daher kein Wiederanlauf. C0 **nicht integrieren**.
- **[TEST] B6e-P0 [#54](https://github.com/tobiasfranziskus/Check/pull/54)**, [CI #41179991691](https://github.com/tobiasfranziskus/Check/actions/runs/41179991691): 19/19 Jobs, 67/67 Node-Tests; 34 gepaarte Läufe, 4.540 Tageshashes, 108.960 stündliche unabhängige Geld-/Warenaudits/Replays, 440 Save/Load-Roundtrips. Ein realer Einmalkredit von `st_meridian` an NPC1 über **1.380 ISK** im Fall `handel-flotte` finanzierte **49 tatsächliche Handelsfrachter-Warenverkäufe**. Dennoch **keine Tilgung**, 1.380 ISK Forderung offen; Krisen-Unterdeckung **4.450→8.903 ISK** und am Tag 365 weiterhin **null NPC1/2-Frachter und null Aldera-Silizium/Bauteile**. In drei anderen Krisen scheiterte Kreditwürdigkeit einer einzelnen neutralen Stationskasse; alle Standardseed-Kontrollen unverändert. **Nicht integrieren**; ein tatsächlich beobachteter Ersttransport beweist noch keinen finanzierbaren weiteren Zyklus. `b6eContracts` nur Analyse-/Save-Feld, **keine Produktmigration**.
- **[MAIN-Code geprüft / Designbeschluss offen für Integration]** Leichter Jäger momentan 900 ISK Basispreis / 8 Bauteile + 4 Material (32 Min), Frachter 750 ISK / 8 Bauteile (36 Min), Stundenarbeit Jäger 50 ISK, Frachter 250 ISK. Spieler kann Jäger auf eigene Schiffe eskortieren lassen; die automatische NPC-Handelsflotten-Eskorte und zuverlässig synchronisierte Begleitung fehlen. Gegenversuch [#45](https://github.com/tobiasfranziskus/Check/pull/45) ohne Piratenüberfälle verhindert zwar Verluste, aber **nicht** den Versorgungskollaps. **[BESCHLOSSEN]** Ziel: günstiger produzierbare **leichte** Jäger, risikogerechte NPC-Eskorten und langfristig global mehr Jäger als Frachter **ohne feste Konzernquote**. **[OPTION]** konkrete Preise, Rezepte, Eskortenalgorithmen und Zeitpunkt erst wirtschaftlich testen und getrennt freigeben.
- **[NÄCHSTE ANALYSE] B6f:** die 49 tatsächlichen Warenlieferungen aus B6e einschließlich Kosten-, Geld-, Bestands-, Waren- und Hüllenverlustverlauf gezielt nachvollziehen. Keine automatische Krediterneuerung oder Jägerpreis-/Escortenänderung als Ersatz für die wirtschaftliche Ursache.

**Freigabestatus:** #49 enthält Dokumentationspflege zu bereits durchgeführten Analysen und das beschlossene Eskortenziel. #50–#54 bleiben ungemergte Analysen. Weder neue Rezeptwerte, Escort-AI, B6e-Regeln noch Echtgeld-/iPad-/NAS-Tests sind auf `main` freigegeben oder ausgeführt.

## [MAIN] Integrierte Version

**Stand 30. Oktober 2026 · GitHub `main`: v0.12.5, Squash-Merge [`24337dcd4d5d9f00d0ac004afba6f4119a5b83ac`](https://github.com/tobiasfranziskus/Check/commit/24337dcd4d5d9f00d0ac004afba6f4119a5b83ac) ([PR #46](https://github.com/tobiasfranziskus/Check/pull/46)).** Integriert sind u. a. #17–#22, #30 (bedarfsorientierte NPC-Handelsrouten), #35 (Wirtschaftsarchitektur), **#42 (B5a)** und **#46 (B5b)**. Die verbindliche Produktpriorität liegt weiterhin ausschließlich in [ROADMAP.md](ROADMAP.md).

**Produkttechnik:** statische `index.html`, HTML/CSS/Vanilla JS, kein Backend/Build. **Spielstandschema 8, Regelversion 14**; Migrationen **11→12→13→14**, **12→13→14** und **13→14** erhalten Kassen, Waren, Flüge, offene Arbeitsminuten und bisherige Aufträge; B5b rekonstruiert dauerhafte Sollplatz-Zuordnungen, unauflösbare Altfälle werden ausdrücklich abgelehnt. Die ausdrücklich als inkompatibel genehmigten Regelstände 8–10 bleiben klar abgewiesen, zukünftige Regeln ebenfalls. Kein stilles Überschreiben oder Löschen von Browser-Spielständen.

**[MAIN] B5a – gehaltene Reisen werden real bezahlt:** `m_core_stunde.betriebskosten` berücksichtigt tatsächlich angefallene Arbeitsminuten auch bei Auftrag `halten`; untätiges Warten bleibt kostenlos. Normaler Flug kostet keinen Treibstoff. Der gezielt validierte identische Zweietappen-Test bestätigt **0 ISK unter Regel 12 → 241 ISK unter Regel 13**, mit realer Zahlung an den bestehenden Fonds statt Geldschöpfung. Produktionskern wurde außer Kostenprüfung, Regelversions-/Migrationsmarkierung und Versionsanzeige nicht verändert.

**[TEST]** [Abschließende PR-CI #41113681392](https://github.com/tobiasfranziskus/Check/actions/runs/41113681392) auf dem tatsächlich gemergten PR-Head: **57/57 Standardtests**, 13 Seeds × 90 Tage unter Regel 13, **1.170 Tageshashes**, stündliche unabhängige Geld-/Warenaudits, deterministische Replays und Save/Load an Tag 3/30/90, alle 13 Wirtschaftskennzahlen je Seed gegenüber unveränderter v12-Fixture identisch (darunter **791 Mangelstunden insgesamt**, 310.058 Frachterverkäufe). Historische v12-13×90-Goldenprüfung am festgehaltenen ursprünglichen Commit `906b797`, v11-Referenz und Geografie-Dreiervergleich bestanden. Der historische v10-Job unter Regel 13 führte nur seine dokumentierte Überspringen-Verzweigung aus; der gestapelte Sicherheitsgeografie-Job wurde bedingt übersprungen. **Weder echte iPad-Safari-Abnahme noch NAS-Deployment** ist durch diese Prüfungen belegt.

**[ANALYSE/DRAFT] B1–B4 bleiben ungemergt:** [#36](https://github.com/tobiasfranziskus/Check/pull/36)–[#41](https://github.com/tobiasfranziskus/Check/pull/41) und [#32](https://github.com/tobiasfranziskus/Check/pull/32)–[#34](https://github.com/tobiasfranziskus/Check/pull/34) liefern reproduzierte wirtschaftliche Gegenbeispiele, aber keine freigegebenen Produktmechaniken. [B3 #40](https://github.com/tobiasfranziskus/Check/pull/40) belegte tatsächlich bezahlte, aber verlorene Ersatzfrachter samt verdrängtem Minerersatz und ungedecktem Betrieb; [B4 #41](https://github.com/tobiasfranziskus/Check/pull/41) belegte die vermischte Verwendung von `ware` als momentaner Auftrag und Sollrollenidentität. **B5b [MAIN]** hat diese Identitäten durch die stabile Sollplatzbindung in PR #46 getrennt; die B4-Befunde bleiben historische Diagnose. Über Kapitalgeber, Emissionsregel, Insolvenz, pauschale Spielerabgaben oder kostenlosen Wiederaufbau wurde keine neue Produktregel freigegeben.

## [MAIN] B5b – Eindeutige Sollplatzbindung (30.10.2026)

**[MAIN] B5b wurde mit ausdrücklicher Freigabe über [PR #46](https://github.com/tobiasfranziskus/Check/pull/46) als Squash-Commit [`24337dc`](https://github.com/tobiasfranziskus/Check/commit/24337dcd4d5d9f00d0ac004afba6f4119a5b83ac) integriert** (`v0.12.5`, Regel 14, Schema 8). Die Sollplatz-ID eines Schiffes bleibt auch bei vorübergehenden Transport-, Warte- oder Förderaufträgen erhalten; ein tatsächlich zerstörtes Schiff lässt genau diesen Platz frei, dessen Ersatz weiterhin real bezahlt werden muss. Alt-Spielstände erhalten eine deterministische Rekonstruktion bei eindeutigen Identitäten, eine sichtbare Ablehnung bei Mehrdeutigkeit. Weder Rückflug, neue NPC-Geldquelle noch Piraten-Schonfrist werden implementiert. **Prüfbericht:** [TEST_B5B_SOLLFLOTTENZUORDNUNG.md](TEST_B5B_SOLLFLOTTENZUORDNUNG.md).

**[TEST/CI]** Auf dem freigegebenen PR-Head: [Regressions-CI #41123471215](https://github.com/tobiasfranziskus/Check/actions/runs/41123471215) **7/7 ausführbare Jobs erfolgreich** (ein historischer Stack-Job bedingt übersprungen), 67/67 Node-Tests; [B5b-Langzeit-CI #41123471285](https://github.com/tobiasfranziskus/Check/actions/runs/41123471285) **6/6 Jobs erfolgreich**. Zehn neue Kernfälle plus **57 bestehende Tests** bestanden. Historische v11-/v12-/v13-Referenzen, Geld-/Warenaudits, 13 Seeds × 90 Tage für Regel 14 (**1.170 Tageshashes**, Replays, Save/Load, unverändert **791 Mangelstunden** und **310.058 NPC-Frachter-Warenverkäufe**) im [Regressionslauf #41122913434](https://github.com/tobiasfranziskus/Check/actions/runs/41122913434) ausgeführt; der vollständige freigegebene CI-Lauf ist abgeschlossen und erfolgreich. **[CI #41122913386 – 6/6 Jobs erfolgreich](https://github.com/tobiasfranziskus/Check/actions/runs/41122913386):** Vier echte B1-Spielerfälle × Regel 13/14 × 275 Tage; 2.200 Tageshashes, vollständige Audits/Replays und 96 Save/Load-Roundtrips. Regel 14 verhindert in allen vier Fällen die Phantom-Sollrolle; real bezahlte NPC3-Minerersatzkäufe **93→87**, ungedeckte Betriebskosten **870→433 ISK**, NPC3-Frachter-Warenverkäufe jedoch **106→80**; die ursprünglich gekauften Frachter überleben weiter **0/4**. Kein iPad-/NAS-Deployment oder reale Safari-Abnahme. B5b ist gemergt; Kostenunterdeckung, Versorgungsengpass und Handels-Wiederanlauf bleiben offen.

## [ANALYSE/DRAFT] Langzeitdiagnose und Architekturprüfung (30.10.2026)

**Historische Prüfbasis der folgenden #32–#34-Auswertung (nicht aktueller main-Stand):**

GitHub `main` bei dieser Prüfung: [`ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f`](https://github.com/tobiasfranziskus/Check/commit/ed94b8914e4ad2ad0c7980e9f3d84f6d549ef22f), Produkt weiterhin v0.12.3. Zum damaligen Analysezeitpunkt offen, **inzwischen geschlossen und nicht gemergt**: [#32](https://github.com/tobiasfranziskus/Check/pull/32) (`8cd8713`, Basis `main`), [#33](https://github.com/tobiasfranziskus/Check/pull/33) (`4c55d4b`, Basis #32), [#34](https://github.com/tobiasfranziskus/Check/pull/34) (`6855d76`, Basis #33).

- **Übernommene bestehende Befunde:** #32 reproduziert aktive Spieler-Kollapsfälle trotz korrekter Geld-/Warenbilanz; #33 verhindert vier Startkollapse mit Spieler-Rückfluss, begrenzt dabei Sparen/Investition und heilt spätes Wiederanlaufen nicht dauerhaft. #34 erreicht in 16 Eingriffsfortsetzungen keinen Wiederanlauf beider Handelsflotten: zwei einzelne bezahlte Ersatzfrachter haben danach null Handelskapital, keinen Warenhandel und gehen erneut verloren. Aldera fehlen Bauteile/Silizium trotz vorhandener entfernter Bestände. Diese Langzeitversuche wurden im Architekturauftrag **nicht neu ausgeführt**.
- **Jetzt geprüfte CI-Metadaten:** Regression und jeweilige Analyse erfolgreich an allen drei genannten Heads. Analyse-Läufe: [#32](https://github.com/tobiasfranziskus/Check/actions/runs/41067401643), [#33](https://github.com/tobiasfranziskus/Check/actions/runs/41076425687), [#34](https://github.com/tobiasfranziskus/Check/actions/runs/41083152586). Technischer Erfolg ist keine wirtschaftliche Freigabe.
- **[ANALYSE/OPTION]** Der [Architekturbericht](ARCHITEKTUR_WIRTSCHAFT_V12.md) dokumentiert Ursachen, vorhandene Geld-/Warenpfade, drei Ansätze, mögliche Insolvenz-/Wiederaufbauabläufe und offene Entscheidungen. Die Empfehlung ist unimplementiert. Beschlossene Produktziele stehen ausschließlich in der [Roadmap](ROADMAP.md).
- **Neu lokal geprüft im docs-only-Auftrag:** Node.js 22.23.4, Pflichtbefehl erfolgreich (sechs Dateisuiten); zusätzlich einzeln sichtbare **48/48 bestehende Tests**, 0 Fehler/Skip/Abbrüche. Keine neue Jahres-/Wiederanlaufsimulation oder Safari-/NAS-Abnahme. Produktdatei, Regeln 12, Schema 8, Tests, Goldenwerte und Workflow unverändert. Wegen des Markdown-Pfadfilters ist kein neuer CI-Lauf zu erwarten; kein Merge/Deployment.

## [ANALYSE/DRAFT] Piratenrisiko und Lagerziel R3 – abgeschlossene Messungen, offene PRs (30.10.2026)

**Keiner der drei Analyse-PRs [#44](https://github.com/tobiasfranziskus/Check/pull/44), [#45](https://github.com/tobiasfranziskus/Check/pull/45) und [#48](https://github.com/tobiasfranziskus/Check/pull/48) ist in `main` integriert; `index.html` bleibt v0.12.5/Regel 14.** Sie testen voneinander getrennte Hypothesen, nicht ein kombiniertes neues Balancing.

- **Piraten-Einstieg #44:** 13 Seeds × 90 Tage und vier B1-Spielerfälle mit Kontrolle, Schonfrist, Kapital- und Aktivitätsschwelle. 20-Tage-Schonfrist: Schiffsverluste **4.622→415**, aber Endbestand NPC-Frachter unverändert 65; im Spieler-Stressfall **2/4** neue Frachter am Leben, ungedeckte Arbeit **870→2.004.546 ISK**. Kapitalregel lässt **4/4** leben, aber ungedeckte Arbeit **3.109.096 ISK**; Aldera-Rohstofflücke bleibt. Keine Variante freigegeben. [CI #41117052272](https://github.com/tobiasfranziskus/Check/actions/runs/41117052272): **19/19 Jobs**, 9.080 Tageshashes.
- **Welt ohne Überfälle #45:** 13 Seeds × 90 Tage plus vier B1-Fälle bis Tag 365; Überfälle vollständig deaktiviert, sonst identischer Core. **0/4→4/4** ursprüngliche neue NPC3-Frachter überleben, mehr Handel, aber ungedeckte Arbeit **870→3.116.651 ISK**, Aldera-Silizium/Bauteile in allen vier Fällen weiter 0. Standard-Mangelstunden **791→751**. Kein Freigabebeleg für eine friedliche Produktwelt. [CI #41119638781](https://github.com/tobiasfranziskus/Check/actions/runs/41119638781): **19/19 Jobs**, 34 Läufe/4.540 Tageshashes.
- **R3-Lagerziel #48 (Regel-14-Analyse):** Kontrolle gegen reine Miner-Abgabebegrenzung, 25 Paare/50 Läufe, **5.980 Tageshashes**, **143.520 stündliche Replay-/Auditzeitpunkte**, **616 Save/Load-Roundtrips**. Bei aktiven Spielern sinken Rezeptmengen nach 60 Tagen (nur Miner **121,596→91,667**, Miner+Auto-Frachter **88,333→75,279** je Welt/Tag); Mangel steigt und keiner der vier historischen B1-Krisenfälle wird wieder versorgt. **R3 ausdrücklich nicht integrieren.** [Wirtschafts-CI #41128487876](https://github.com/tobiasfranziskus/Check/actions/runs/41128487876) **28/28 Jobs**, [Regressions-CI #41128487970](https://github.com/tobiasfranziskus/Check/actions/runs/41128487970) **7/7 ausführbare Jobs**, **72/72 Node-Tests**.

**Entscheidungsgrenze:** Eine leere Kasse kann weiter angefallene Arbeit nur teilweise zahlen; der Core führt die nicht gedeckte Restarbeit derzeit nicht als Schuld weiter. Das ist ein belegter Modellmangel, aber eine konkrete Insolvenz-/Schulden-/Pausenregel wurde **nicht** beschlossen. Die nächste Phase-B/C-Entscheidung muss reale Handelszyklusfinanzierung, Geldquellen/Senken, offene Betriebskosten, zahlungsfähige Käufer, Ersatz und Spieler-Sparfreiheit gemeinsam berücksichtigen. Analysen sind keine Safari-/NAS-Abnahme.

## [ANALYSE] Geschlossene Forschungs-/Alt-PRs

Historischer Audit **#1**, nicht ausreichend finanzierte NPC1-Expansion **#16**, Liquiditäts-/Preis-/Routenanalysen **#23, #26, #27**, Pilotengehalt **#24**, Modulbau-Prototyp **#25** sowie der von #30 abgelöste gestapelte Entwurf **#28** sind **geschlossen und nicht nach `main` gemergt**. Ergebnisse sind in [ANALYSEARCHIV_WIRTSCHAFT_V11.md](ANALYSEARCHIV_WIRTSCHAFT_V11.md) zusammengefasst. Die alten PR- und Git-Branches bleiben als reproduzierbarer Nachweis erhalten. **Keine** Pilotengehalts-, Modul- oder pauschale Preisänderung ist dadurch produktiv geworden.

## Offene Qualitäts-/Produktgates

- Reale iPad Safari Touch-/Querformat-/Hochformat- und NAS-Datei-/Persistenzabnahme; kein Rollout behaupten.
- Die in #32–#34 belegten Langzeit-/Spielerkollapse und Wiederanlaufgrenzen lösen: vollständige Zyklusfinanzierung, reale Nachschubpfade und freizugebendes Geldregime gemeinsam beurteilen; Diagnose ist noch keine Produktkorrektur.
- Erst nach Ursachenprüfung neue Geld-/Waren-Ausgaben, Piratenwirtschaft, Reparaturen, Module und NPC-Personal einführen. Phasen und Abhängigkeiten ausschließlich nach der [ROADMAP.md](ROADMAP.md).

## Archivierter Statusauszug vom 29. Oktober 2026

**Der folgende Bericht ist historisch und darf nicht als aktueller `main`- oder Roadmap-Stand interpretiert werden.** Er wird zur Rückverfolgbarkeit aufbewahrt.

Stand: 29. Oktober 2026. v0.11.2 auf `feat/v0.11.2-wirtschaft`, Basis main `d53bf14`. Noch nicht gemergt, veröffentlicht oder auf NAS/iPad abgenommen.

Schutzgeld ist 0; automatische NPC-Frachter verwenden zwei regulär bezahlte Reserveeinheiten. Schema 8 bleibt erhalten, Regelmigration 7→8 ändert nur die Regelnummer. [Aktueller Testbericht und Risiken](TEST_WIRTSCHAFT_V0_11_2.md): 40 Node-22-Tests sowie 13 wiederholte 90-Tage-Simulationen, alle Audits und Referenzvergleiche korrekt.

## Version und Architektur

| Bestandteil | Aktueller Stand |
| --- | --- |
| Anwendung | Aphros Void, HTML-Metatag `aphros-version`: `v0.11.2` |
| Spielstandschema | 8 |
| Regelversion | 8 |
| Laufzeit | HTML, CSS, Vanilla JavaScript in einer `index.html` |
| Auslieferung | Statische Datei; für iPad Safari und NAS-Webserver vorgesehen |
| Entwicklung | Node.js 22, integrierter Test-Runner; keine npm-Abhängigkeiten, kein Build-Schritt |

Die Versionsangabe im Metatag ist maßgeblich für diesen Bericht. Eine separate Korrektur sichtbarer Versionsanzeigen wurde als PR #5 geschlossen; daraus folgt kein neuer Release-Stand.

- `m_data_*`: Systeme, Wirtschaft, Kampf- und Weltparameter; `m_data_rules` bündelt Regeln, Schema und Regelversion.
- `m_core_*`: gespeicherter Seed/RNG, Zustand, validierte Befehle, Handel, Reisen, Produktion und Kampf. `m_core_step` verarbeitet die Queue und die Simulationsphasen in fester Reihenfolge. Kanonische Serialisierung, Zustands-Hash und Geld-/Warenaudit sichern Nachvollziehbarkeit.
- `m_ui_*`: Ansichten, Marktangebote, Schiffsnamen, Touch-Bedienung, Zeitsteuerung, Neuzeichnen und Browserpersistenz. Markt und Schiffsdetails verwenden gemeinsame Angebotsberechnungen auf Basis bestehender Core-Funktionen.
- Speicherung: IndexedDB-Datenbank `aphros-void`, Store `saves`, ergänzt durch JSON-Import/Export und eine Speicherhülle. Schema- und Regelmigrationen liegen im Core. Spielstände liegen im Browser, nicht automatisch auf dem NAS.
- Schiffskauf: Schiffsware wird zunächst als Fracht gekauft und anschließend per bestehendem `shipActivate` in Dienst gestellt. Bei laufender Simulation sind dies getrennte Befehle/Ticks.
- Schiffsnamen: Standardnamen nach Klasse und aktueller ID-Reihenfolge; optionaler gespeicherter `rufname` über validierten `shipRename`-Befehl. Umbenennen/Zurücksetzen löst Speichern aus. Interne IDs bleiben unverändert.

## Abgeschlossene Pull Requests

Quelle: GitHub-Liste der [geschlossenen Pull Requests](https://github.com/tobiasfranziskus/Check/pulls?q=is%3Apr+is%3Aclosed), am 29. Oktober 2026 geprüft, abgeglichen mit der Git-Historie von `main`. „Geschlossen“ bedeutet nicht automatisch „gemergt“.

| PR | Ergebnis | Inhalt |
| --- | --- | --- |
| [#4](https://github.com/tobiasfranziskus/Check/pull/4) | Gemergt | v0.11.1: Jagdprämie Faktor 3 und Warenbilanz bei Verlust beladener Schiffe |
| [#7](https://github.com/tobiasfranziskus/Check/pull/7) | Gemergt | Startfehler, Pause und Flottenbedienung repariert |
| [#8](https://github.com/tobiasfranziskus/Check/pull/8) | Gemergt | iPad-Querformat mit zwei Spalten und kompakten Schiffsmenüs |
| [#9](https://github.com/tobiasfranziskus/Check/pull/9) | Gemergt | Handelsbeträge inklusive Gebühren bzw. Nettoerlös |
| [#10](https://github.com/tobiasfranziskus/Check/pull/10) | Gemergt | Passendes Trägerschiff je Kauf/Verkauf und Ware |
| [#11](https://github.com/tobiasfranziskus/Check/pull/11) | Gemergt | Handelsmengen nach Kasse, Reserve, Bestand und Frachtraum |
| [#12](https://github.com/tobiasfranziskus/Check/pull/12) | Gemergt | Gemeinsame Handelsangebote in Markt/Flotte und automatisierte Regressionstests |
| [#13](https://github.com/tobiasfranziskus/Check/pull/13) | Gemergt | Direkte Inbetriebnahme gekaufter Schiffsware, lesbare Standardnamen, Umbenennen und sofortiges Speichern |
| [#2](https://github.com/tobiasfranziskus/Check/pull/2) | Ohne Merge geschlossen | Frühere komplexe Spielstandmigration/Ladevalidierung |
| [#3](https://github.com/tobiasfranziskus/Check/pull/3) | Ohne Merge geschlossen | Einzelne Frachtverlustkorrektur; in #4 enthalten |
| [#5](https://github.com/tobiasfranziskus/Check/pull/5) | Ohne Merge geschlossen | Separate Korrektur sichtbarer Versionsanzeigen |
| [#6](https://github.com/tobiasfranziskus/Check/pull/6) | Ohne Merge geschlossen | Früher Gebühren-UI-Ansatz; durch #9 ersetzt |

Historische Dokumente nennen diese Arbeiten teilweise noch „PR-Branch“ oder „nicht veröffentlicht“. Für die Integration gilt die obige Zuordnung; ein Merge allein bestätigt keinen laufenden Deployment-Stand.

## Qualitätssicherung

Verbindlicher Aufruf im Repository-Verzeichnis mit Node.js 22:

```sh
node --test tests/*.test.mjs
```

- `tests/handel-ui.test.mjs`: Handelsmengen und Gebühren, Schiffswahl, Inbetriebnahme, Namen, Escaping, Queue und deterministische Drei-Tages-Simulationen mit festen Referenz-Hashes für Seeds 42, 1234 und 98765.
- `tests/spielstand.test.mjs`: Save/Load-Roundtrip, Schema 7→8, Regelversion 6→7 sowie Ablehnung beschädigter/zukünftiger Formate.
- `tests/start-smoke.test.mjs`: gesamter Spielstart, Pause, Flotte, Schiffsauswahl, Zeitschritt und Umbenennen einschließlich IndexedDB-Speicherung mit simulierten Browser-Schnittstellen.
- `.github/workflows/ui-regression.yml`: Node.js 22 auf PRs und `main`, mit Pfadfilter für `index.html`, `tests/**` und die Workflow-Datei. Reine Markdown-PRs lösen diesen Job nicht aus.

Aktueller Lauf am 29. Oktober 2026 mit Node.js v22.23.4: **40 bestanden, 0 fehlgeschlagen, 0 übersprungen**. Wirtschaftsregeln, Versionsangabe und Tests wurden wie im aktuellen Testbericht beschrieben geändert; der Workflow bleibt unverändert. Die Tests enthalten keine echte iPad-Safari- oder NAS-End-to-End-Prüfung.

## Offene Probleme und Grenzen

1. **Safari-Abnahme der jüngsten Änderungen ausstehend:** Lange Markt-/Aktivierungstexte, Umbenennungsdialog, Bildschirmtastatur, Hoch-/Querformat, schmale Ansichten und laufende Tick-Neuzeichnung real prüfen. Laut Nutzerabnahme im Schiffskauf-Bericht funktionierten zuvor Markt/Flotte, Mengenbegrenzung, Pause/Zeitschritte, Handel und Speichern. Das ist keine Abnahme des neuen Namensdialogs.
2. **Persistenzrisiko:** Browserdaten sind originabhängig und können löschbar sein. Vor NAS-/Hostwechsel und Import einen Export sichern. Bestehende Spielstände müssen erhalten bleiben; die historische Testdaten-Ausnahme aus dem Releasebericht ist keine aktuelle Freigabe zum Verwerfen.
3. **Automatische Standardnamen können wechseln:** Nach Verlust eines früheren Schiffs wird anhand des aktuellen Bestands neu nummeriert. Eigene Rufnamen bleiben stabil; doppelte Rufnamen sind erlaubt. Stabile Seriennummern wären eine gesonderte Produkt-/Schemaentscheidung.
4. **Angebote können veralten:** Zwischen Anzeige und Queue-Ausführung können Kassen, Preise, Ladung oder Standort wechseln. Eine Ablehnung durch den Core ist erwartete Validierung, kein bestätigter neuer Defekt.
5. **Deployment nicht geprüft:** Der tatsächliche NAS-/Pages-Stand und Performance bei größeren Flotten sind hier nicht verifiziert. Aus fehlenden Browsertests folgt kein bestätigter Produktfehler.

Die GitHub-API war bei dieser Prüfung durch den Netzwerkproxy gesperrt. Die PR-Zuordnung oben basiert auf der erreichbaren GitHub-Webliste und Git. Eine vollständige aktuelle Issue-Inventur wurde nicht verifiziert; diese Liste erhebt daher keinen Anspruch auf Vollständigkeit aller GitHub-Issues.

## Nächste Entwicklungsschritte

1. iPad-Safari-Abnahme von #13 durchführen: Schiff kaufen → als Fracht sehen → in Dienst stellen → Flotteneintrag prüfen; Umbenennen und Zurücksetzen bei Pause sowie laufender Simulation, anschließend Neuladen/Save/Load prüfen.
2. Auf dem tatsächlichen NAS die statische Auslieferung und denselben Export-/Importpfad prüfen; vor Originwechsel einen existierenden Spielstand exportieren. Keine Spielstände für die Prüfung löschen.
3. Nur reproduzierte Befunde als gezielte UI-/Speicheraufträge bearbeiten. Dabei Regressionstests, deterministische Hashes und Audits erhalten; keine beiläufigen Balancingänderungen.
4. Offene GitHub-Issues nach verfügbarem API-Zugang abgleichen. Bedarf an stabilen Standard-Seriennummern oder vereinheitlichter Versionsanzeige gesondert klären, bevor Code oder Schema geändert werden.

Entwicklungsregeln stehen in [AGENTS.md](../AGENTS.md). Dieser Dokumentationsauftrag verändert weder `index.html` noch Spielmechaniken, Speicherformat oder Tests und umfasst keinen Merge oder Deployment.
