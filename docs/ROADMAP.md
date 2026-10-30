# Aphros Void – zentrale Produkt-Roadmap

Stand der Konsolidierung: **30. Oktober 2026**. Repository: https://github.com/tobiasfranziskus/Check

> **Einzige verbindliche Produkt-Roadmap und Prioritätenquelle, kein Release-Bericht.** Diese Datei führt die ältere M0–M7+-Konzeption, Projektgespräche vom 29./30.10.2026, den integrierten Stand bis #42 und die Diagnose-Drafts #32–#34 zusammen. Technischer Ist-Stand und Tests: [PROJEKTSTATUS.md](PROJEKTSTATUS.md), [AGENTS.md](../AGENTS.md), aktuelle Commits/PRs. Ein Draft, bestandene Simulation oder eine Chat-Idee ist **nicht** automatisch in `main` oder im Browser veröffentlicht.

## 1. Spielvision

Aphros Void ist ein offenes, deterministisches Weltraum-Wirtschafts- und Managementspiel. Vom kleinen Handelshaus entwickelt der Spieler ein Konzern- und Stationsnetz mit eigener Flotte, Produktion, Handelsrouten, Außenposten und später eigenen Systemen. Die Welt handelt, produziert und kämpft auch ohne Spielerbefehl. **Gleichzeitig ist der Spieler eine Figur mit Aufenthaltsort:** auf einer Station oder in einem Schiff, später als Miner-, Frachter- oder Jägerpilot unmittelbar spielbar. Konzernführung und persönliche 2D-Raumfahrt benutzen **denselben** Simulations- und Wirtschaftskern. Keine Pflichtkampagne.

**Produktgrenzen:** HTML/CSS/Vanilla JS, statische `index.html`, iPad Safari/Touch und NAS-Webserver, kein Framework/WebGL/Build-/Backend-Zwang. Der Core bleibt befehlsbasiert, deterministisch (Seed, RNG, Tick-Reihenfolge, Hashes), Geld-/Warenerhaltung wird auditiert; vorhandene Spielstände und Migrationen werden überprüft, niemals still überschrieben. Gameplay-3D ist nicht Teil der Zielsetzung. Multiplayer allenfalls später und optional.

**[BESCHLOSSEN] Wirtschaftsziele, Architekturauftrag vom 30.10.2026:** Der Spieler darf grundsätzlich unbegrenzt Geld sparen. Einzelne NPC-Konzerne dürfen wirtschaftlich scheitern; bestehende oder neue Akteure sollen ihre Aufgaben übernehmen können. Schiffe, Waren, Produktion und Betrieb brauchen reale Ressourcen und nachvollziehbare Zahlungen. Keine kostenlosen Rettungsschiffe, unbegrenzten Subventionen oder versteckten Geldquellen. Ein gemeinsamer Simulationskern ohne neue Laufzeitabhängigkeit; normale Raumflüge bleiben treibstofffrei. Die konkrete Insolvenz-, Markteintritts- und Geldquellenregel ist damit **nicht** beschlossen; [Architekturprüfung](ARCHITEKTUR_WIRTSCHAFT_V12.md) ist [ANALYSE/OPTION].

## 2. Statuslegende und tatsächlicher Basisstand

- **[MAIN]** In `main` integriert; nicht gleichbedeutend mit NAS-/iPad-Deployment.
- **[DRAFT]** Auf Branch/PR technisch bearbeitet; nicht integriert oder freigegeben.
- **[ANALYSE]** Simulation/Prototyp ohne produktiven Mechanikwechsel.
- **[BESCHLOSSEN]** Produktziel bzw. Arbeitsreihenfolge; noch nicht programmiert.
- **[OPTION]** Langfristige Möglichkeit, noch keine verbindliche Umsetzung.

**[MAIN] v0.12.4, Commit `9b155640d51d0e1f4022433391a0061dcd5be2ac`**: PRs **#17, #18, #19, #20, #22, #30, #35 (Architekturdokumentation) und #42 (B5a)** integriert. Damit sind NPC-Konzernnamen, treibstofffreie Reisen/Silizium, Sicherheitszonen, Meridian–Orion/Nadir sowie v11-Referenz-QA Teil von `main`. **Reale Safari-/NAS-Abnahme steht aus**; die nachweislich abweichenden bisherigen Version-8/10-Spielstände dürfen nach ausdrücklicher Erklärung der Projektleitung vom 30.10.2026 klar abgewiesen werden, da keine aktiven Spieler oder Spielstände existieren. Keine automatische Löschung oder stille Neuinitialisierung.

**[MAIN]** [PR #30](https://github.com/tobiasfranziskus/Check/pull/30) enthält die profitablen, bedarfsorientierten NPC-Handelsrouten (Regelversion 12, v0.12.3), historische v11- und unabhängige v12-QA, **ohne** die vorangegangenen Analysezweige. **[ARCHIVIERT]** [#28](https://github.com/tobiasfranziskus/Check/pull/28) war der wirtschaftlich geprüfte, aber ungeeignete gestapelte Originalentwurf und ist zugunsten von #30 geschlossen. [#21](https://github.com/tobiasfranziskus/Check/pull/21) wurde innerhalb des bereits integrierten #19-Stacks übernommen.

**[ARCHIVIERT/NICHT INTEGRIERT]** [#1](https://github.com/tobiasfranziskus/Check/pull/1) historischer Audit; [#16](https://github.com/tobiasfranziskus/Check/pull/16) nicht finanzierte Expansion; [#23](https://github.com/tobiasfranziskus/Check/pull/23) NPC-Liquidität; [#24](https://github.com/tobiasfranziskus/Check/pull/24) Pilotengehalt; [#25](https://github.com/tobiasfranziskus/Check/pull/25) Module; [#26](https://github.com/tobiasfranziskus/Check/pull/26) Preiskette; [#27](https://github.com/tobiasfranziskus/Check/pull/27) Routenanalyse; [#28](https://github.com/tobiasfranziskus/Check/pull/28) durch #30 ersetzter Produktentwurf. Alle geschlossen, nicht gemergt; Nachweise zusammengefasst im [Analyse-Archiv](ANALYSEARCHIV_WIRTSCHAFT_V11.md).

**Wirtschaftliche Lage:** Der integrierte Nadir-Stand hatte zuvor belegte Versorgungsnachteile. Die produktive Routenpriorisierung aus [#30](https://github.com/tobiasfranziskus/Check/pull/30) reproduziert die unabhängig von #27 gemessene Reduktion der Mangelstunden von **4.204 auf 791** (13 × 90 Tage), mit 48/48 bestandenen Standardtests sowie ausgeführten v11-/v12-/Geografieprüfungen; der v10-Job unter Regel 12 überspringt seinen Vergleich. Keine zusätzlichen Preise, Gehälter oder Module. #32–#34 belegen inzwischen Langzeitspieler-Kollapse und unzureichenden Wiederanlauf; Produktkorrektur und Safari-/NAS-Abnahme bleiben offen.

### Integrationsfolge und Abhängigkeitsrisiko (aktualisiert 30.10.2026)

- **[MAIN] Mechanik und Versorgung:** #17, #18 → #19 → #20 → #22 → #30 → #42 sind integriert. Die Spielversion ist **v0.12.4 (Regel 13, Schema 8)**; weiterhin keine nachgewiesene Browser-/NAS-Abnahme.
- **Analysen sind keine Produktabhängigkeiten:** #23 und #26–#27 liefern wichtige Messungen, dürfen aber **nicht allein wegen ihrer Stellung in einer gestapelten PR-Basis mit in den produktiven Code gemergt** werden. #24/#25 bleiben ausdrücklich experimentell; #16 ist blockiert.
- **[ABGESCHLOSSEN] Bereinigte Integration:** #30 wurde nach eigenem erfolgreichem CI unabhängig vom Analyse-Stack gemergt. #28 und die Analyse-PRs #23/#26/#27 sind geschlossen, ohne ihre Prototypen einzubauen. Neue Wirtschaftsänderungen bleiben getrennte, nachweisbare Arbeitspakete.
- **Explizite Spielstandentscheidung:** Der Projektverantwortliche bestätigt für die aktuelle Entwicklung, dass **keine aktiven Spieler/Spielstände** existieren. Die Inkompatibilität der bisherigen Regelversionen 8–10 ist für diese Integration ausdrücklich genehmigt; Ladeversuche müssen weiter sichtbar scheitern, nie still überschreiben oder Browserdaten löschen. Neue Version-11-Spielstände werden von #30 nach 12 migriert.

## 3. Verbindliche Phasen mit Abhängigkeiten

| Phase | Ziel und Umfang | Kriterium zum Abschluss | Stand |
| --- | --- | --- | --- |
| **A – Geografie und Ressourcen** | Freie normale Sternentorreisen ohne Treibstoff, Silizium als Rohstoff, Sicherheitsstufen und Meridian–Orion/Nadir | Welt-/Regelversionen und Save-Kompatibilität bewusst behandelt; 13 Seeds × 90 Tage, unabhängige Hashes/Audits; iPad/NAS-Abnahme | [MAIN] #17–#22; Safari/NAS offen |
| **B – Versorgung und Liquidität** | Bedarfsorientierte profitable NPC-Routen; zuverlässige Stationen-/Konzernkonten, Kapitalbindung und tatsächliche Zahlungen bei unbegrenzt sparendem Spieler | Vollständige Quellen-/Senken-/Transferbilanz, finanzierbarer Handelszyklus und Wiederanlauf bei gewahrter Spieler-Sparfreiheit | [MAIN] Routen #30 und Kostenkorrektur #42; [ANALYSE/DRAFT] #32–#34 sowie B1–B4 (#36–#41). Finanzierbarer Wiederanlauf und Geldregime offen |
| **C – Selbstfinanzierte Konzerne** | Asterion/Veldra, reale Eigentümer/Kassen, bezahlte Assets; mögliche Insolvenz und Übernahme rentabler Aufgaben durch andere Akteure | Reale Kapitalgeber, Waren und Schiffe sowie tragfähiger Folgezyklus; Ausfall-/Eintrittsregeln erst nach Freigabe | [MAIN] Namen #17; [BESCHLOSSEN] Ziel; [OPTION] Architekturprüfung; #16 geschlossen/blockiert |
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

### [MAIN] B5a / [ANALYSE] B1–B4 / [OPTION] B5b – Stand 30.10.2026

**[MAIN]** [PR #42](https://github.com/tobiasfranziskus/Check/pull/42) wurde mit ausdrücklicher Projektfreigabe per Squash-Merge nach `main` integriert (**`9b15564`**). Produkt **v0.12.4**, **Regel 13**, **Schema 8**: tatsächlich geleistete Flug-Arbeit kostet auch unter `halten`; untätiges Halten bleibt kostenfrei, laufende v12-Arbeit wird durch verlustfreie Migration 12→13 erhalten. Die [abschließende CI #41113681392](https://github.com/tobiasfranziskus/Check/actions/runs/41113681392) bestätigt 57/57 Node-Tests, 13 Seeds × 90 Tage mit 1.170 Tageshashes, stündliche unabhängige Audits/Replay und Save/Load; alle unveränderten v12-Wirtschaftskennzahlen bleiben identisch. Ein gezielt gehaltener Reisefall zahlt statt 0 ISK **241 ISK** an den realen Fonds. Die historische v12-Referenz bleibt auf dem Originalcommit. **Keine Safari-/NAS-Abnahme.**

**[ANALYSE/DRAFT]** Die separat nicht integrierten PRs [#32](https://github.com/tobiasfranziskus/Check/pull/32)–[#34](https://github.com/tobiasfranziskus/Check/pull/34), [#36](https://github.com/tobiasfranziskus/Check/pull/36)–[#41](https://github.com/tobiasfranziskus/Check/pull/41) zeigen: Spieler-Nettoersparnis kann Kaufkraft bei NPCs entziehen; finanziert erworbene Einzelfrachter starten kurzzeitig, werden aber durch Piraten verloren; bloße Sollplatzregistrierung kann Minerersatz verdrängen und Betriebskosten unterdecken; rein höhere Handelsaktivität löst keinen Dauerbetrieb. In B4 produziert ein zurückgeführter Nadir-Miner wieder Silizium, aber die gesamte Rohstoffversorgung sinkt bei einigen Varianten infolge geänderter Ersatzdynamik. **Keine dieser Analysemechaniken ist damit eine freigegebene Produktkorrektur.**

**Nächste kleine Arbeitspakete (keine zusätzliche Geld-/Insolvenzregel beschlossen):**

1. **B5b [OPTION]:** Permanente Miner-/Frachter-Sollverpflichtung von momentanen Aufträgen (`auftrag/ware`) unabhängig machen, ohne doppelte Sollplätze; eindeutige Identität/Zuweisung, vorübergehende Liefermission, Rückkehr und explizite dauerhafte Aufgabenänderung getrennt prüfen. Zuerst Modell/Save-Version und Kontrolltests, dann eigener schmaler PR.
2. **B – Zyklusfinanzierung [BESCHLOSSENES ZIEL]:** Ganzes Geschäft vor einer NPC-Neuinvestition prüfen: vorhandene Hülle und Rezeptinputs, erste Ladung, Betriebs-/Gebührenzahlungen, Verlustrisiko und zahlungsfähiger Käufer sowie Miner-/Frachterersatz aus der gemeinsamen Kasse. Keine fixen Startbeträge oder automatisch angelegten Frachterpflichten aus B1/B3 übernehmen.
3. **B→C – Wiederaufbau [BESCHLOSSENES ZIEL, REGEL OFFEN]:** Geldschöpfung, echte Geldvernichtung und Transfers vollständig auditieren. Kapitalgeber, Insolvenz und Übernahme wirtschaftlicher Aufgaben ohne kostenlose Hüllen oder pauschale Spieler-Sparbegrenzung als **getrennte Entscheidungsoption** modellieren; zunächst vier Spieler-Stressfälle und 13 × 90 Seeds vergleichen. Ob zusätzliche klar begrenzte Geldquelle nötig ist, bleibt ausdrücklich freigabepflichtig.

Der Übergang zu einer produktiven NPC-Expansion (Phase C), Piratenökonomie (Phase D) und anschließenden Produktions-/Piloten-/Modulmechaniken verlangt nachweislich finanzierte Wiederaufnahme von Versorgung und Transport. Die langfristigen Phasen G–I (Station/Konzernterminal und direkt spielbare 2D-Schiffe) bleiben verbindliche Ziele, aber keine Begründung für ungesicherte Wirtschaftsmechaniken.

### [ANALYSE/OPTION] Architekturprüfung für B/C (30.10.2026)

Die offenen Drafts [#32](https://github.com/tobiasfranziskus/Check/pull/32) (`8cd8713`, Basis `main ed94b891`), [#33](https://github.com/tobiasfranziskus/Check/pull/33) (`4c55d4b`, Basis #32) und [#34](https://github.com/tobiasfranziskus/Check/pull/34) (`6855d76`, Basis #33) liefern Diagnosebelege, keine Produktintegration: Spielerförderung kann den Umlauf kollabieren lassen; pauschaler Spieler-Rückfluss beschränkt Sparen/Investition; vier einzelne Fondsvarianten stellen beide Handelsflotten nicht wieder her. Ein bezahlter Frachter ohne Handelskapital und räumlich entfernte Werftinputs genügen nicht.

Der [Architekturbericht](ARCHITEKTUR_WIRTSCHAFT_V12.md) vergleicht A (bestehende Fonds/Routen/Ersatz), B (Insolvenz/Markteintritt) und C (bilanzierte Quellen/Senken). **[OPTION] Empfehlung:** C als Bilanzrahmen mit B kombinieren und geeignete A-Pfade weiterverwenden. Geldregime, Kapitalgeber, Ausfallabwicklung und Zugang zum letzten realen Transport-/Produktionsmittel bleiben freigabepflichtige Produktentscheidungen. Feste endliche Geldmenge und beliebige dauerhafte Spieler-Nettoakkumulation können keine positive NPC-Mindestliquidität gemeinsam garantieren; der heutige Core enthält bereits Kopfgeldquellen und echte Senken. Keine zusätzliche Quelle, Subvention oder Insolvenzmechanik ist hier freigegeben. Höchstens drei kleine Folgeaufträge und reproduzierbare Abnahmekriterien stehen im Bericht. Reale Safari-/NAS-Abnahme bleibt offen.

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
| Mechanik #17–#22 / Versorgung #30 | Mechanik-Stack und #30 sind auf `main`, keine Analyse-Experimente integriert; Langzeitspieler-Gegenbeispiele in #32–#34, Safari-/NAS-Abnahme offen | Core integriert / wirtschaftliche und reale Abnahme offen |
| Versorgung | Bedarfsorientierte profitable Routen aus #30 integriert; nachgewiesenen Spieler-/Wiederanlaufkollaps aus #32–#34 getrennt lösen | [MAIN] Routen; Korrektur offen |
| NPC-Liquidität / Spielerfreiheit | Unbegrenztes Sparen ist beschlossen; #32–#34 belegen Kollaps-/Wiederanlaufgrenzen. Geldregime und vollständige Zyklusfinanzierung vor Produktänderung entscheiden | Ziel [BESCHLOSSEN]; Diagnose [ANALYSE/DRAFT]; Architektur [OPTION] |
| Insolvenz / Markteintritt | Aufgabenübernahme durch andere Akteure ermöglichen; Kapitalgeber, reale Assets, Ausfallfolgen und physische Wiederaufbaugrenze ausdrücklich festlegen | Ziel [BESCHLOSSEN]; Regeln [OPTION], siehe Architekturbericht |
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

**Nächster Wirtschaftsschritt:** Auf Grundlage der [Architekturprüfung](ARCHITEKTUR_WIRTSCHAFT_V12.md) Geldregime und Umfang der Wiederaufbaugarantie entscheiden; zunächst den vollständigen Zyklusbedarf und reale Kapital-/Materialpfade messen. #32–#34 liefern bereits Langzeit-/Spielergegenbeispiele, aber keine wirtschaftliche Freigabe. Insolvenz, Markteintritt oder zusätzliche Geldquellen erst in getrennt beauftragten, kleinen Experimenten untersuchen; der Filterversuch aus #33 ist weiterhin keine freigegebene Produktlösung. Reparatur-, Personal- und zusätzliche Wirtschaftsmechaniken bleiben dahinter. **Reale iPad-Safari-/Touch-/NAS-Abnahme von v0.12.4 weiterhin durchführen. Parallel ausschließlich konzeptionell** das Spielerort-/Tablet-/Cockpit-Modell spezifizieren.

**Referenzen:** [AGENTS.md](../AGENTS.md), [PROJEKTSTATUS.md](PROJEKTSTATUS.md), [Architekturprüfung](ARCHITEKTUR_WIRTSCHAFT_V12.md), GitHub-PRs #16–#30 und Diagnose-Drafts #32–#34; historischer Planungsstand `AV-PLANUNGSSTAND-2026-10-30.md` (in ChatGPT-Dateibibliothek), separate `void.html` als Konzeptreferenz. Das ursprüngliche Konzept v0.10 wird im historischen Plan genannt, liegt hier aber nicht vollständig als Referenz vor.
