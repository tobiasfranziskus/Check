# Aphros Void – zentrale Produkt-Roadmap

Stand der Konsolidierung: **30. Oktober 2026**. Repository: https://github.com/tobiasfranziskus/Check

> **Einzige verbindliche Produkt-Roadmap und Prioritätenquelle, kein Release-Bericht.** Diese Datei führt die ältere M0–M7+-Konzeption, Projektgespräche vom 29./30.10.2026 sowie GitHub-PRs bis einschließlich #28 zusammen. Technischer Ist-Stand und Tests: [PROJEKTSTATUS.md](PROJEKTSTATUS.md), [AGENTS.md](../AGENTS.md), aktuelle Commits/PRs. Ein Draft, bestandene Simulation oder eine Chat-Idee ist **nicht** automatisch in `main` oder im Browser veröffentlicht.

## 1. Spielvision

Aphros Void ist ein offenes, deterministisches Weltraum-Wirtschafts- und Managementspiel. Vom kleinen Handelshaus entwickelt der Spieler ein Konzern- und Stationsnetz mit eigener Flotte, Produktion, Handelsrouten, Außenposten und später eigenen Systemen. Die Welt handelt, produziert und kämpft auch ohne Spielerbefehl. **Gleichzeitig ist der Spieler eine Figur mit Aufenthaltsort:** auf einer Station oder in einem Schiff, später als Miner-, Frachter- oder Jägerpilot unmittelbar spielbar. Konzernführung und persönliche 2D-Raumfahrt benutzen **denselben** Simulations- und Wirtschaftskern. Keine Pflichtkampagne.

**Produktgrenzen:** HTML/CSS/Vanilla JS, statische `index.html`, iPad Safari/Touch und NAS-Webserver, kein Framework/WebGL/Build-/Backend-Zwang. Der Core bleibt befehlsbasiert, deterministisch (Seed, RNG, Tick-Reihenfolge, Hashes), Geld-/Warenerhaltung wird auditiert; vorhandene Spielstände und Migrationen werden überprüft, niemals still überschrieben. Gameplay-3D ist nicht Teil der Zielsetzung. Multiplayer allenfalls später und optional.

## 2. Statuslegende und tatsächlicher Basisstand

- **[MAIN]** In `main` integriert; nicht gleichbedeutend mit NAS-/iPad-Deployment.
- **[DRAFT]** Auf Branch/PR technisch bearbeitet; nicht integriert oder freigegeben.
- **[ANALYSE]** Simulation/Prototyp ohne produktiven Mechanikwechsel.
- **[BESCHLOSSEN]** Produktziel bzw. Arbeitsreihenfolge; noch nicht programmiert.
- **[OPTION]** Langfristige Möglichkeit, noch keine verbindliche Umsetzung.

**[MAIN] v0.11.2, Commit `f01fd57`**, letzter bei der Konsolidierung verifizierter Hauptstand. PR #15 (pauschales Schutzgeld weg, regulär bezahlte NPC-Treibstoffreserve) gemergt. UI/Handel/Flotte/Schiffskauf/Schiffsnamen, deterministischer Kern und Tests sind vorhanden. Reale Safari-/NAS-Abnahmen neuester Funktionen sind separat zu führen.

**[DRAFT]** PR [#17](https://github.com/tobiasfranziskus/Check/pull/17) Konzernnamen; [#18](https://github.com/tobiasfranziskus/Check/pull/18) treibstofffreie Tore/Silizium; [#19](https://github.com/tobiasfranziskus/Check/pull/19) Sicherheitszonen; [#20](https://github.com/tobiasfranziskus/Check/pull/20) Nadir/Tor; [#22](https://github.com/tobiasfranziskus/Check/pull/22) abgesicherter v11-Geografievergleich; [#28](https://github.com/tobiasfranziskus/Check/pull/28) produktive Versorgungspriorisierung **auf der gestapelten Entwicklungsbasis**, nicht auf `main`. [#21](https://github.com/tobiasfranziskus/Check/pull/21) ist in den #19-Entwicklungsbranch gemergt, nicht in `main`.

**[DRAFT/BLOCKIERT]** [#16](https://github.com/tobiasfranziskus/Check/pull/16) NPC-Flottenexpansion **nicht integrieren** (Liquiditätsproblem). **[ANALYSE]** [#23](https://github.com/tobiasfranziskus/Check/pull/23) NPC-Liquidität; [#24](https://github.com/tobiasfranziskus/Check/pull/24) Pilotengehälter; [#25](https://github.com/tobiasfranziskus/Check/pull/25) Modulwirtschaft; [#26](https://github.com/tobiasfranziskus/Check/pull/26) Preisketten; [#27](https://github.com/tobiasfranziskus/Check/pull/27) Versorgungsrouten. Ergebnisse niemals als Produktfunktion ausgeben.

**Offene Integrationsfrage:** #22 weist verschlechterte Versorgung/Kostendeckung mit Nadir gegenüber „nur Tor“ nach. #27 zeigt, dass gezielte Priorität auf tatsächlich benötigte Verbrauchsgüter Versorgungsengpässe ohne generelle Preiserhöhung senken kann; #28 setzt diese Priorität als Regelversion 12 in einem Draft um. Wirtschaftliche und technische Abnahme des gesamten PR-Stacks sowie Safari/NAS bleiben nötig.

### Integrationsfolge und Abhängigkeitsrisiko

- **Mechanik-Stack:** #18 → #19 → #20; die Geografie- und Referenzabsicherung aus #22 ist vor Freigabe zu berücksichtigen. Für jede Stufe tatsächliche PR-Basis, deterministische Referenzen, Wirtschaftsfolgen und Save-Kompatibilität prüfen. #17 (Konzernnamen) ist unabhängig.
- **Analysen sind keine Produktabhängigkeiten:** #23 und #26–#27 liefern wichtige Messungen, dürfen aber **nicht allein wegen ihrer Stellung in einer gestapelten PR-Basis mit in den produktiven Code gemergt** werden. #24/#25 bleiben ausdrücklich experimentell; #16 ist blockiert.
- **#28 neu aufsetzen, bevor es integriert wird:** Der produktive Versorgungsprioritäts-Patch liegt derzeit auf #27 und damit mittelbar auf Analysebranches. Die minimale Änderung (nur reale profitable Frachtrouten bevorzugen) auf eine zuvor freigegebene **saubere Mechanikbasis** übertragen oder geeignet rebasen; dabei gezielt alle relevanten Tests/Fixtures und die Migration 11→12 erhalten. Ergebnis als eigenständigen PR neu prüfen, statt den gesamten Analyse-Stack zum Release zu machen.
- **Migrationen vor Integration klären:** Der ungemergte v11-Entwicklungsstand lehnt ältere Regelversionen derzeit teils ausdrücklich ab. Für produktive Freigabe bestehende Nutzer-Spielstände erhalten oder nur nach **ausdrücklicher Genehmigung** eine inkompatible Entwicklungsversion klar ablehnen. Niemals still überschreiben, rücksetzen oder Daten verlieren.

## 3. Verbindliche Phasen mit Abhängigkeiten

| Phase | Ziel und Umfang | Kriterium zum Abschluss | Stand |
| --- | --- | --- | --- |
| **A – Geografie und Ressourcen** | Freie normale Sternentorreisen ohne Treibstoff, Silizium als Rohstoff, Sicherheitsstufen und Meridian–Orion/Nadir | Welt-/Regelversionen und Save-Kompatibilität bewusst behandelt; 13 Seeds × 90 Tage, unabhängige Hashes/Audits; iPad/NAS-Abnahme | [DRAFT] #18–#22 |
| **B – Versorgung und Liquidität** | Bedarfsorientierte, weiterhin profitable NPC-Routen; zuverlässige Stationen-/Konzernkonten, Abgaben/Kapitalbindung, tatsächliche Unterhalts- und Zahlungsströme | Kein unbegründetes Geld/Waren-Minting; Versorgungs- und Liquiditätsvergleich; #28 nur nach vollständiger Prüfung integrieren | [DRAFT/ANALYSE] #23, #26–#28 |
| **C – Selbstfinanzierte Konzerne** | Asterion Handelsunion (NPC1), Veldra Transit (NPC2), erkennbare Eigentums-/Flottengruppen, bezahlte Ersatzschiffe und spätere Expansion | Investitionen aus realen Kassen, dauerhaft tragfähige Kosten; #16 nicht ohne neuen Beleg übernehmen | [DRAFT/BESCHLOSSEN] #16/#17 |
| **D – Piraten als Wirtschaftsakteure** | Bezahltes Meridian-Syndikat, zunächst begrenzter Schmuggelfrachter; Überfälle, Beute, Verkauf, Verluste, Sicherheitszonen | Piratenschiffe werden bezahlt, keine versteckte Geldquelle, stabile Waren-/Geldbilanz, Risiko/Ertrag geprüft | [BESCHLOSSEN] |
| **E – Bergung/Kopfgeld/Reparatur** | Wracks und Frachtbergung, Kopfgeld nach belegtem Abschuss, Schiffsschäden, bezahlte Reparaturen und Materialbedarf | Geschlossener Wert- und Leistungskreislauf; Jäger/NPC-Piloten finanzierbar | [BESCHLOSSEN] |
| **F – Gesamtwirtschaft/Reichsaufbau** | Pilotengehälter und eigene Kassen erst mit realen Ausgaben; Modulproduktion, Werften, Bauschiff, Außenposten, eigenes System (ursprünglicher Zielrahmen: max. drei), Verteidigung, weicher Bankrott | Langfristig stabiles Wirtschaftsmodell, keine unbilanzierten Konten, funktionierende Besitz-/Befehlslogik | [BESCHLOSSEN/ANALYSE] |
| **G – Spielerort und Konzernoberfläche** | Spieler auf Station/Schiff; Konzernbüro bzw. Tablet/Terminal statt ortloser Reiter; HUD und Schiffsbedienung passend zum Ort | Alle bisherigen HQ/Flotte/Markt/Karte-Funktionen erreichbar, Touch/iPad stabil; Simulation bleibt unabhängig vom Rendering | [BESCHLOSSEN] |
| **H – Direkt spielbare Schiffe in 2D** | Wechsel beim Docken; zuerst Miner (Abbau), dann Frachter (Handel/Transport), Jäger (Kampf/Kopfgeld); Navigation, Andocken, Ladung und Aufträge im selben Core | Spieleraktionen als validierte Core-Befehle, einheitliche Waren/Schiffe/Positionen, deterministische Replays | [BESCHLOSSEN] |
| **I – Erweiterungen** | Fitting/Schiffsvarianten, weitere Systeme, Missionen, Fraktionen; bei tragfähiger Solo-Architektur optional Koop mit autoritativem Host | Einzelfreigaben; iPad-/NAS-Leistung und Save-Integrität gewahrt | [BESCHLOSSEN/OPTION] |

### Phasenübergreifende Qualitäts- und Wirtschafts-Gates

1. **Ökonomie zuerst erklären, dann ergänzen:** Reale Materialflüsse von freier Förderung über Produktion, Handel und Schiffsbau bis Verbrauch, Fracht-/Schiffsverlust und Ersatz nachweisen. Preisstaffel und Produktionsmargen inklusive Gebühren prüfen; **keine pauschalen Rohstoff- oder Produktpreiserhöhungen**, wenn die Ursache in vorhandenen Handelsrouten, Beständen oder Kassen liegt.
2. **Geldkreislauf vollständig bilanzieren:** Geldschöpfung (beispielsweise Kopfgeld), echte Vernichtung (beispielsweise Sicherheitsbetriebskosten), bloße Transfers (Handel, Fonds, Gehälter), Stations-/Konzernliquidität und unerfüllte Kosten getrennt ausweisen. Piraterie zerstört Waren/Schiffswerte, aber nicht automatisch ISK. Außenhandel und Schiffersatz dürfen keine unbelegten Waren- oder Geldquellen verbergen.
3. **Reproduzierbare Abnahme:** Für ökonomische Regeländerungen mindestens feste **13 Seeds × 90 Spieltage** als Referenz plus geeignete Belastungs-/Langzeit-/Spielerfalltests, unabhängige Vorher-Nachher-Messung, deterministische Wiederholung, Geld-/Warenaudits, Save/Load und Versionsmigration. **Mangelstunden allein sind kein hinreichendes Gütekriterium**: Preise, Kassen, Kostenunterdeckung, Produktion, Transport, Schiffsverluste und Ersatz mitbewerten. Nicht ausgeführte Tests ausdrücklich benennen.
4. **Gleicher Kern, geschützte Nutzung:** Selbst fliegende Spieler, NPC-Piloten, Kämpfe und Wirtschaft bleiben ein deterministischer Core mit validierten Befehlen; normale Reisen benötigen keinen Treibstoff. iPad-Safari, NAS-Auslieferung und Datenexport vor Integrations-/Deploymentfreigabe tatsächlich prüfen, nicht aus Node-Tests ableiten.
5. **Keine Funktionsausweitung als Ersatz für Ursachenanalyse:** Pilotengehälter, Module, Reparaturwirtschaft, zusätzliche Konzerne und Piratensysteme nur in getrennten Arbeitspaketen nach wirtschaftlichem Nutzen und klarem Eigentümer-/Geld-/Warenfluss einführen.

Die Phasen sind **Abhängigkeiten, keine Kalenderversprechen**. Die UI-Architektur der Phase G sollte früh *konzeptionell* festgelegt, ihre große visuelle Umsetzung aber nicht mit der laufenden Wirtschaftsreparatur vermischt werden. Modul-/Reparaturökonomie kann als eng begrenzter Vorversuch aus Phase E/F erfolgen, bevor die aktive Schiffsausrüstung in H/I integriert wird.

### Vorläufer-Meilensteine aus Konzept v0.10

- M0–M3: deterministischer Kern, 18-Waren-Wirtschaft, NPC-Miner/Händler, Kampf/Sicherheit/Piraten, Bedienung mit HQ/Karte/Markt/Flotte/Reich (historisch fertig, seither weiterentwickelt).
- M4: eigene Flottenbefehle, Kauf/Verkauf, Bauschiff/Werft, weicher Bankrott, Jägerertrag und Migrationen.
- M5: eigene Systeme (historischer Zielrahmen bis drei), Außenposten, Verteidigung.
- M6: an Bord gehen, Navigation, Andocken, Laden, Angriff.
- M7+: Konzerne, Missionen, weitere Systeme.

Die neue Phasenordnung A–I ersetzt **nicht** diese Produktziele, sondern ordnet die inzwischen hinzugekommenen Abhängigkeiten.

## 4. Konkrete Spielsysteme / Designziele

### Welt und Sicherheit
Sichere Handelskerne **Aldera, Cyris, Veldra**; **Orion** umkämpft; **Dravos, Meridian** gesetzlos; **Nadir** als zusätzliches umkämpftes Rohstoffsystem (Entwurf). Sicherheit bestimmt Piratenpräsenz und Risiken; weder magischer Sektorzuschuss noch automatisch hohe Rohstoffpreise. Weitere Systeme/Fraktionen erst wirtschaftlich und technisch einplanen, nicht ungeprüft vervielfachen.

### Konzerne
Handelskonzerne besitzen identifizierbare, bezahlte Schiffe und Kassen, handeln aufgrund realer Angebote und verlieren Geld bei Kosten/Verlusten. Gesellschaftsname ≠ neue Core-Identität. Später Erweiterung um Kapitalentscheidungen, Reparaturen, Personal und Stationen. Der Spieler führt ein eigenes Handelshaus; Piloten sind nicht mit Konzernen gleichzusetzen.

### Piraten/Sicherheit
**Meridian-Syndikat** ist ein vereinbartes Zukunftskonzept (noch nicht als produktive Fraktionswirtschaft belegt). Anfangs kleines, finanzierbares Schmuggelgeschäft; keine unbeschränkt kostenlos spawnenden Piratenschiffe. Bestehende Piratenklassen klein/mittel/groß, Sicherheitsjäger und Kopfgeldmechanik als Grundlage. Beute, Schmuggel und Bergung erhalten reale Eigentümer-/Geld-/Warenbuchungen. Staats-/Kopfgeldfinanzierung gegenprüfen.

### Schiffe und Rollen
Basisrollen: **Miner, Frachter, Jäger, Bauschiff**; NPC-/Piratenklassen separat. Langfristig Spieler an Bord eines konkreten Schiffes und zwischen Schiffen beim Andocken wechseln. Nicht nur ein „Manager-Modus“: selbst Erz/Silizium fördern, Waren laden/verkaufen, fliegen, patrouillieren, kämpfen, bergen. Weitere Schiffshüllen/Varianten erst nach Wirtschaft, Fitting und Spielersteuerung spezifizieren.

### Module und Pilotenkreislauf
Konzept aus Referenz `void.html` (separate Referenz, **kein** zu übernehmender Spielkern): **Laser, Bergbau, Nachbrenner, Schildverstärker, Batterie, Radar, Frachtraumerweiterung**, Größen **S/M/L**, Stufen **MK I–III**, Ausrüstung/Fitting mit aktiven und passiven Wirkungen. PR #25 enthält **21 experimentelle Modulrezepte** und bilanzierten Materialverbrauch/Pilotenkäufe, **keine** aktive Schiffsmodulwirkung. Pilotengehälter (`#24`) allein destabilisieren die Wirtschaft; zuerst bezahlte Reparaturen, Service, Module und laufende Gegenleistungen prüfen. Keine Ressourcen, Module oder Gehälter aus dem Nichts.

### Oberfläche
Ein Spielerkörper/Standort macht die Präsentation glaubwürdig: **Stationsbüro/Konzernterminal**, **Frachter-/Jägercockpit** bzw. **Miner-2D-Ansicht**. **Das Tablet/Terminal gibt überall Zugriff auf HQ, Karte, Markt, Flotte, Produktion, Besitz/Reich, Personal und Logbuch**. Ortsabhängige Steuerung ergänzt sie; die bestehenden Reiter dürfen nicht verschwinden, bevor ihre Funktionen erreichbar sind. Zuerst Informationsarchitektur/Mockup, später kleiner UI-PR, danach 2D-Canvas und passende HUDs. Keine WebGL-Pflicht.

### Multiplayer
Altes Konzept v0.10: ausdrücklich **kein Multiplayer**. Neuere Vereinbarung: **[OPTION]** langfristig Koop/Multiplayer prüfen, niemals Voraussetzung für Solo. Referenz `void.html` enthält Host/Gast-Ansätze; nur Ideen wiederverwenden. Wenn später: ein autoritativer Host, keine doppelte Welt-/Wirtschaftssimulation, deterministische Befehle, saubere Trennung von Pilot- und Weltständen. Kein automatischer NAS-Backend-Ausbau.

## 5. Aktuelle Entscheidungen und Risiken (30.10.2026)

| Thema | Entscheidung/Prüffrage | Status |
| --- | --- | --- |
| PR-Stack #18–#22/#28 | Mechanik-Stack sauber integrieren; #28 **vom Analyse-Stack lösen**, alte Spielstände/Migration, Wirtschaft, Hashes und iPad/NAS abnehmen; Analyse-PRs nicht versehentlich mitmergen | Offen |
| Versorgung | #27: bedarfsorientierte statt preislich inflationierte Handelsrouten; #28 ist Entwurf, nicht Produktivstand | Prüfen |
| NPC-Liquidität | Kapitalabführungen stabilisieren Stationsfonds; unbedachte Obergrenzenänderung verschlechtert Versorgung | Analysiert #23 |
| NPC-Expansion | PR #16 nicht integrieren bis finanzierte Betriebskosten und Kapitalbindung nachgewiesen | Blockiert |
| Personal/Module | Pilotengehalt ohne echte Ausgaben und Reparaturen nicht integrieren; #24/#25 sind Experimente | Blockiert |
| Spielerrolle/Interface | Konzernmanager **und** aktive Pilotentätigkeiten; zuerst System-/Bedienentwurf festlegen | Beschlossen |
| Save/Deployment | Regelmigrationen explizit, alte Saves nie still falsch laden; Safari und NAS real testen | Pflicht |
| Weitere Galaxie/Mehrspieler | Nach stabiler Solo-Wirtschaft und Pilotenspiel | Später/optional |

## 6. Pflegeprozess – Roadmap automatisch *prüfen*, Änderungen kontrolliert integrieren

1. **Bei jedem Feature-/Design-PR**: prüfen, ob eine Produktentscheidung, Abhängigkeit, ein Meilenstein oder Status wirklich verändert wurde. Wenn ja, im **selben PR** `docs/ROADMAP.md` gezielt aktualisieren, zusätzlich `docs/PROJEKTSTATUS.md` für die technischen Fakten. Änderungen durch Tests/Commits/PRs belegen.
2. **Tägliche Berichtsautomatisierung (06:30 Europe/Berlin)**: `main`, aktuelle PRs/CI und beide Dokumente prüfen, Chat-Beschlüsse nur verwenden, wenn eindeutig belegbar. Erreichte/aktive/geplante Punkte differenzieren, offene Entscheidungen hervorheben. Bei relevanter Roadmap-Abweichung **separaten docs-only Branch/PR erstellen oder einen bestehenden eindeutig passenden Dokumentations-PR aktualisieren**; keine Duplikate und keine unaufgeforderten Produktcodeänderungen. Ohne Abweichung nichts schreiben. Bei fehlendem Schreibzugriff offene Dokumentationsänderung im Bericht kennzeichnen.
3. **Kein automatischer Merge/Release/Deployment.** Solange ein Dokumentations-PR nicht freigegeben und gemergt ist, steht die vorgeschlagene Roadmap **nur auf dem Branch**. Der tägliche Bericht liest gegebenenfalls diesen Vorschlag zusätzlich zu `main` und markiert ihn unmissverständlich. Bei Widerspruch haben verifizierte Fakten aus `main`/CI Vorrang vor historischen Texten; langfristige Ziele werden nicht still gestrichen.
4. **Projektanweisungen bleiben kurz und referenzieren diese Datei**, statt die gesamte Roadmap zu kopieren. Die Fassung für ChatGPT-Projekte steht in [CHATGPT_PROJEKTANWEISUNGEN.md](CHATGPT_PROJEKTANWEISUNGEN.md). Deren Einpflege in die ChatGPT-Projekteinstellungen ist ein eigener UI-Schritt; Repository-Dateien ändern diese Einstellungen nicht.
5. Zu jeder substanziellen Änderung: Datum, konkrete PR/Commit-Quelle, `[MAIN]/[DRAFT]/[ANALYSE]/[BESCHLOSSEN]/[OPTION]` und gegebenenfalls geänderte Entscheidung festhalten. Keine historischen Messwerte als aktuellen Stand umetikettieren.

## 7. Nächster sinnvoller Arbeitsauftrag

**Zuerst** den Mechanik-Stack #18–#22 sauber integrierbar machen, insbesondere ältere Spielstände, Wirtschaft, Hashes und die fehlende iPad-/NAS-Abnahme klären; danach #28 als **minimalen unabhängigen Produkt-Patch** ohne unbeabsichtigte Analyse-Commits prüfen. #16/#24/#25 nicht integrieren. **Danach** die vorhandene Stations- und Konzernliquidität einschließlich Schiffsersatz und realen Kosten stabilisieren, **bevor** Reparatur-, Personal- oder weitere Ausgabemechaniken hinzukommen. **Parallel ausschließlich konzeptionell** das Spielerort-/Tablet-/Cockpit-Modell spezifizieren, damit spätere UI- und 2D-Arbeit nicht erneut die Kernarchitektur verändert.

**Referenzen:** [AGENTS.md](../AGENTS.md), [PROJEKTSTATUS.md](PROJEKTSTATUS.md), GitHub-PRs #16–#28; historischer Planungsstand `AV-PLANUNGSSTAND-2026-10-30.md` (in ChatGPT-Dateibibliothek), separate `void.html` als Konzeptreferenz. Das ursprüngliche Konzept v0.10 wird im historischen Plan genannt, liegt hier aber nicht vollständig als Referenz vor.
