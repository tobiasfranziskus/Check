# Aphros Void – zentrale Produkt-Roadmap

> **[BESCHLOSSEN / REDAKTIONELL KONSOLIDIERT · 07.11.2026]** Dies ist die **einzige verbindliche Produkt-Roadmap**. Der frühere vollständige Stand auf `main` bleibt am unveränderlichen Commit [`5a56d9d7`](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/ROADMAP.md) erhalten; der ausführliche ältere Forschungsstand zusätzlich unter [W5r-Archivcommit 8d6c1e73](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/ROADMAP.md). **Kein historischer Analyseabschnitt ist damit automatisch beschlossen.** Belegter technischer Stand: [PROJEKTSTATUS.md](PROJEKTSTATUS.md), PR-/Branch-Index: [README.md](README.md), Entwicklungsregeln: [AGENTS.md](../AGENTS.md).

> **[MAIN]** `5a56d9d7`, v0.12.5 / Regel14 / Schema8. **[DRAFT]** Jüngster untersuchter Wirtschafts-Stack [#243 W5s-ao](https://github.com/tobiasfranziskus/Check/pull/243) auf #242, R32, nicht integriert; UI-Hub [#234](https://github.com/tobiasfranziskus/Check/pull/234) getrennt mit unverändertem Regel14-Core. **[TEST]** [#42422215632](https://github.com/tobiasfranziskus/Check/actions/runs/42422215632) 3/3 integrierte Wirtschaftstestgruppen, 58 simulierte Welten; wirtschaftliche Nachhaltigkeit **NICHT** bestanden. Der jüngste Gesamtregressionslauf ist getrennt zu beurteilen. **[OPTION]** Neue Geldemission, konkrete Aktien- und Dividendenrechte, Insolvenz-/Verschleißparameter und Produktintegration bedürfen gesonderter Entscheidung. Keine eigene Freigabe aus diesem Dokument.

## 1. Vision und feste Grenzen

**[BESCHLOSSEN]** Aphros Void vereint ein frei spielbares Konzernmanagement mit einer deterministischen Weltraumwirtschaft und persönlich steuerbaren **2D-Miner-, Frachter- und Jägerschiffen**. Der Spieler hat einen Standort, kann als Pilot selbst arbeiten und zugleich sein Unternehmen führen. **Ein gemeinsamer Core** führt Spieler- und NPC-Befehle nach denselben Waren-, Geld-, Eigentums-, Produktions-, Flug- und Kampfregeln aus. Kein zweiter Simulationskern und kein automatisches Geld im UI.

- Statische `index.html`, HTML/CSS/Vanilla-JavaScript, iPad-Safari/Touch, statischer NAS-Server. **Keine** zusätzlichen Frameworks, Pflicht-Backends, CDN-, Build- oder WebGL-Abhängigkeiten ohne gesonderte Freigabe.
- Seed/Tick/RNG-Replay, stabile Hashes, Geld-/Waren-/Schiffs-Audit, atomare Vorfinanzierung und Save/Load. Bestehende Spielstände nicht löschen, umdeuten oder ohne ausdrückliche Migration überschreiben. Forschung verwendet getrennte Regel-/Save-Profile; Browser-IndexedDB ist keine NAS-Server-Sicherung.
- **Normale Raumfahrt ohne Treibstoff**, keine Energiezellen als künstlich erzwungene Dauerverbrauchsware. Keine Gratis-Hüllen, Gratis-Fahrten, unbezahlten Löhne oder verschleierten Transfers; NPC-Firmen dürfen scheitern, Spieler darf **unbegrenzt sparen**.
- Erste spielbare UI parallel zur Wirtschaft: Konzernterminal/Büro, Flotte/Karte/Markt/Produktion/Personal/Logbuch und eigene 2D-Pilotensicht, erreichbar ohne unnötiges Scrollen. Bestehende Bedien- und Navigationsfunktionen beim Umbau bewahren.

## 2. Status und Integrationsdisziplin

- **[MAIN]** Eingebaut und geprüft auf `main` (nicht automatisch iPad-/NAS-abgenommen). Die bestehende Seiten-/Spielversion `v0.12.5` ist archiviert unter [`versionen/v0.12.5/`](../versionen/v0.12.5/) und [`backup/pages-v0.12.5-20261106`](https://github.com/tobiasfranziskus/Check/tree/backup/pages-v0.12.5-20261106). Der in [PAGES_SPIELTEST.md](PAGES_SPIELTEST.md) beschriebene spätere W5-Testlink ist noch kein nachgewiesener Release.
- **[DRAFT]** Nachgewiesene, aber nicht gemergte Branch-/PR-Inhalte. **[ANALYSE]** Hypothese oder Testbefund, auch bei grünem CI keine produktive Regel. **[BESCHLOSSEN]** Produktziel, nicht zwingend implementiert. **[OPTION]** mögliche, noch nicht genehmigte Ausgestaltung.
- **[DRAFT] Wirtschaftskette #161 → #243:** W0/Erz, bezahlte NPC-Minerschiffe, Frachter/Raffinerie/Schiffbau, Module/Jäger, Eis/Wasser, Haushaltslöhne, Verschleiß und realer Außenexport sind **in einem gestapelten Forschungszweig** geprüft; die R32-Krisenwirtschaft hält bis Tag730 **nicht** durch. Keine automatische Übernahme in das Hauptspiel.
- **[DRAFT] UI-Kette #203 → #207 → #234:** Legacy-HQ, Station, Fitting und gemeinsame Oberfläche mit sicherem Forschungs-Slot; **der W5u-Hub läuft nur mit Regel14**, R32 ist darin nicht spielbar. Einzelne Legacy-Drafts #186/#187/#189/#195/#198 sind Quellen, keine weiteren Hauptspielkerne.
- **Keine Stack-Massenmerges:** Die rund 76 noch offenen PRs teilen sich in Wirtschafts- und UI-Abhängigkeitsketten; erst gesondert geprüfte Integrationskandidaten dürfen auf `main`. Bestehende Tests, Fixtures, Versionen und Spielstände weder blind löschen noch überschreiben. Keine CI-Erfolgsmeldung als Safari-/NAS-Abnahme ausgeben.

## 3. Verbindlicher Wirtschaftsneuaufbau – W0 bis W6

**[BESCHLOSSEN, 03.11.]** Die frühere große Wirtschaftsreparatur wird durch kleine finanzierte, einzeln prüfbare Stufen ersetzt. Bestehende Karte, Bedienung, Simulation, Freiflug und produktive Spielstände bewahren; alte Wirtschaftspfadteile bis zur geprüften Ablösung **kontrolliert deaktivieren**. W0/W1 zuerst; eine persönlich spielbare Mineransicht und Konzern-UI dürfen parallel bereits nach einem funktionierenden W1 entstehen.

| Stufe | Ziel / Nachweis vor nächster Stufe | Forschungsstand (DRAFT, nicht MAIN) |
| --- | --- | --- |
| **W0 Buchungskern** | Auftraggeber und Arbeiter vor Arbeitsbeginn decken; Kauf/Verkauf, Reservierung, Teilleistung, Rückzahlung, eindeutige Beleg- und Auditketten | **[DRAFT]** #161 ff. |
| **W1 Erz/Bergbau** | Eigener echter, bezahlter Miner; Erzherkunft, Lager, Verkauf, begrenztes Käuferbudget und Vollkosten; kein Gratis-Endkunde | **[DRAFT]** #161/#164, begrenzte Pilotfinanzierung nachgewiesen |
| **W2 Konzerne** | NPC und Spieler im gleichen Core; eigenes Kapital, echter Schiffskauf, Absatz-/Kassenstopps und Insolvenzmöglichkeit | **[DRAFT]** #165–#167, später #171/#190 |
| **W3 Transport** | Echter, vollständig vorfinanzierter Hin- und Rückweg, freie/gebundene Ladung und Risikokosten | **[DRAFT]** #168 und 2D-Ansicht #179 |
| **W4 Raffinerie** | Erz → Material, tatsächliche Rohstoff- und Arbeitskosten, Folgekäufer | **[DRAFT]** #169 |
| **W5 Module/Schiffbau** | Material/Silizium/Bauteile, MK1-Module und bezahlte Hüllen; später Eis→Wasser, Nachfrage und reale Ersatzproduktion | **[DRAFT]** #170–#243: echte Hüllen-/Transportbelege in Teilstufen, langfristig fehlen zahlende Endkunden und finanzierte Nachfolger |
| **W6 Gesamtwirtschaft** | Dauerhafter, real bezahlter Kreislauf, ziviler Endabsatz, weitere Waren, Piraten/Jäger/Personal/Bergung; 13×90d plus Krisen/365d | **[BESCHLOSSEN]** Produktziel, nicht abgeschlossen |

**[BESCHLOSSEN]** Hauptabnehmer der Industrie sind langfristig **Schiffe und Module**. Bedarf entsteht aus real finanzierter Expansion, betrieblich verursachter Wartung/Reparatur und echten Verlusten. Stillgelegte Schiffe erzeugen nicht allein wegen Zeitablauf künstlichen Verbrauch. Schaden schafft **Warenbedarf, aber kein Geld**. Vollständige Ersatzproduktion bleibt wichtiger als reine Nachfrage- oder ISK-Korrekturen.

**[BESCHLOSSEN, 05.11.]** Keine künstliche globale Grenze für verfügbare Mining-Aufträge. Der Miner kann **auf eigene Rechnung** abbauen, solange real vorhandene Ressourcen, Frachtraum/Lager und vorfinanzierte Betriebsmittel reichen. Eigenabbau und Verkauf sind getrennt: Unverkaufte Ware bleibt dem Eigentümer; es gibt keinen garantierten Käufer. Bessere Miner und kostenpflichtige MK1/MK2/MK3-Module steigern Produktivität **bei echten Investitions-, Arbeits-, Wartungs- und Materialkosten**. Konkrete Werte/Rezepte über MK1-Forschung hinaus sind **[OPTION]**.

**[ANALYSE/TEST, 07.11.] Aktuelles Gesamtrisiko:** Die tatsächlich ausgeführte [W5s-ao-Analyse #243](https://github.com/tobiasfranziskus/Check/pull/243) prüfte 13×90d Basisseeds, 39 zusätzliche Spar-/Eigentumsregime und sechs R32-Langzeitwelten bis Tag730. Letzter bezahlter Wasserverkauf Tag209 ohne Export, Tag303 mit 14-ISK-Stations-Export, Tag393 mit 7-ISK-Stations-Export. Am Ende 0 Frachter und 0 frei kaufbare W5-Hüllen; Haushalt 3–11 ISK bei 14-ISK-Wasser, während Konten anderer Eigentümer gefüllt sind. 7-ISK-Wasserexport liegt mit direktem 11,80-ISK-Stückkostenmaßstab im Verlust. Die Kosten-/Einkommens-/Eigentümerprobleme sind **kein Anspruch auf Gratis-Transfer, künstliche Arbeit oder automatischen Cash-Neustart**.

## 4. Geld, Kosten, Besitz und Wettbewerb

**[BESCHLOSSEN] Geldmodell B (31.10.):** Neue ISK dürfen **nur begrenzt, transparent und einmalig gegen reale, belegte Leistung** entstehen. **Nicht beschlossen:** Höhe, tägliches/globales Budget, Emittent, Empfänger, konkrete Export-, Fund-, Schutz- und Konsumregeln. Es gibt **keine** produktive Freigabe zusätzlicher Emission. Gebühren, Fonds, Pilotlohn, Dividende und Konzernumbuchung sind **Transfers**, nicht Minting. Die bestehende Regel14-Kopfgeld-Emission muss vor einem neuen globalen Emissionsbudget mitgeprüft werden.

- **[OPTION]** Dauerhaft begrenzte externe Abnahme oder bezahlter ziviler Verbrauch mit eindeutiger Warenherkunft und tatsächlichem Zahlungsbeleg. W5q #197 prüft echte einmalige physische Wasserexporte und global begrenzte **hypothetische** Emissionen; Profil standardmäßig **AUS**, keine dauerhaft resiliente Wirtschaft nachgewiesen.
- **[OPTION]** Seltene Edelsteine, exotische Mineralien und Artefakte beim **tatsächlichen** Erz-/Eis-/Siliziumabbau; Funde sind zunächst **transportierbare Güter**, kein sofortiges Geld. Erst externe, dokumentierte Ausbuchung/Verkauf kann einen gegebenenfalls freigegebenen, global gekappten ISK-Zufluss auslösen. Fundchance an reale Förderung, nicht an die Armut eines Akteurs koppeln. Keine mehrfach vergütete Ware.
- **[OPTION]** Befristete Sonderexporte, angekündigte Piratenbelts/Kopfgeld-/Schutzaufträge und Bergung mit realer Lieferung/Leistung; keine Doppelauszahlung beim Abschuss, kein unbegrenztes Farmen. Gegebenenfalls nur **aggregierte Weltindikatoren** über längere Zeiträume für globale Budgets verwenden.
- **[BESCHLOSSEN]** Keine individuelle Rettung wegen geringer Kasse, Verlust, Insolvenz oder Besitzeridentität; keine Spieler-Sparobergrenze. NPC-Konzerne dürfen ausfallen, andere übernehmen Aufgaben nur über **bezahlten** Erwerb/Produktion/Verträge. Ein erfolgreicher Umverteilungstest ohne neues Geld ist keine allgemeine Lösung für das Nachfrageproblem.
- **[BESCHLOSSEN]** Gleiche Core-Kosten, Eigentumsprüfungen und validierte Befehle für NPC und Spieler. NPC-Piloten **besitzen persönlich keine Schiffe**, sondern nutzen Konzernschiffe über Arbeit/Pacht; **nur der menschliche Spieler** darf persönlich Eigentümer einer Hülle sein. Pilot, Unternehmen, Auftraggeber, Schiffs-/Fracht-/Kontoeigentümer müssen getrennt bleiben. Vertragssätze, Haftung, Ausschüttungen und Pilotenskills im Einzelnen **[OPTION]**.
- **[BESCHLOSSEN]** Spieler darf bewusst unprofitabel, aber **vollständig finanziert** handeln; NPC-Automatik priorisiert wirtschaftlich vernünftige Aufträge. Löhne und Treuhand niemals doppelt zählen. Pilotengehalt, Gebühren, Ersatz und Frachtkosten sind reale Zahlungen; keine stillen Überziehungen.

## 5. Spielsysteme und langfristige Meilensteine

Die ältere **A–I-Vision bleibt bestehen**; W0–W6 ist ihre **schrittweise Entwicklungsreihenfolge für die Wirtschaft**, kein Ersatz der späteren Spielziele.

| Vision | Langfristiges Ziel / Status |
| --- | --- |
| **A Geografie/Sicherheit** | Sicherer Kern **Aldera, Cyris, Veldra**, umkämpftes **Orion, Nadir**, gesetzloses **Dravos, Meridian**; freie Reisen und Sicherheitszonen teilweise **[MAIN]**. Weitere Systeme nur bewusst und wirtschaftlich begründet |
| **B/C Versorgung und Konzerne** | Real finanzierte Versorgung/Flotten/Stationskonten, Wettbewerb, Scheitern, Markteintritt, Firmenübernahmen; keine versteckten NPC-Privilegien |
| **D/E Piraten, Eskorten, Kopfgeld, Bergung, Reparatur** | Piratenstützpunkte/Belts und bezahlte Jäger; gefährliche Konvois können echte Eskorte benötigen; keine pauschale Jägerquote, kein kostenloser Piratennachschub; Kopfgeld nur belegbar |
| **F Produktionswirtschaft/Reich** | Piloteneinkommen/-Fortschritt, Fitting, Modulherstellung, Ersatzteile, Bauschiff, Außenposten/eigene Systeme mit nachhaltig bezahlten Infrastruktur- und Schutzkosten |
| **G Konzern-UI und Spielerort** | Konzernbüro/Terminal, HQ/Flotte/Karte/Markt/Produktion/Personal/Logbuch; keine Funktion bei UI-Umstellung verlieren. Station und Pilotencockpit integrieren |
| **H Persönliche 2D-Schiffe** | Miner → Frachter → Jäger, eigener Aufenthaltsort, Andocken/Schiffswechsel, echtes Mining/Transport/Kampf; **derselbe** Welt-Core, keine UI-Simulation |
| **I Spätere Erweiterungen** | Schiffstypen/Module, zusätzliche Systeme/Fraktionen, Missionen, eventuell Koop mit autoritativer Welt. **Multiplayer bleibt optional und spät**, ohne Backend-Zwang |

**[BESCHLOSSEN/OPTION]** Pilotengehalt aus real bezahlter Arbeit, eine einzige Kopfgeldquelle pro tatsächlichem Abschuss und ein späterer Fortschritts-/Skillbaum. Bauliche Reihenfolge für modulare Ausrüstung: **MK1** mit erster Ressource als Pilot, **MK2/MK3** später über zusätzliche reale Rohstoffe/Rezepte; die exakte Modulmechanik und wirtschaftliche Wertordnung einzelner Hüllentypen sind **noch nicht verbindlich**. Modulideen der Legacy-Planung: Bergbau-/Waffenlaser, Nachbrenner, Schild, Batterie, Radar, Frachtraum, Größen S/M/L. Keine früheren, nicht geprüften Rezepte automatisch übernehmen.

## 6. Aktuelle Prioritäten und Freigabe-Gates

1. **[BESCHLOSSEN]** Kleine einzeln finanzierte und spielbare W0–W6-Schritte behalten. **[OPTION / nächste Forschung]** Aus [#243](https://github.com/tobiasfranziskus/Check/pull/243) zuerst eine konkrete, **legitim finanzierte, auf reale Güter bezogene Endnachfrage** mit überprüfbarem Käufer und vollständigem Eigentumsnachweis herleiten. Kein automatisch konsumierender Gratis-Kunde und keine neue Geldemissionsregel ohne gesonderten Beschluss.
2. **[OPTION / eigenständiger Konzernnachfolger]** Einen rechtmäßig kapitalisierten Frachter-Ersatzkauf aus **wirklichem** Werftbestand, bezahlter Überführung und Arbeitsreserve mit wirklich zahlungsfähiger Nachfrage verbinden. NPC-Insolvenzen dürfen eintreten; Spieler und andere Firmen behalten ihr Sparrecht, keine individuelle Rettung. Zuletzt scheiterten 7-ISK-Export-Szenarien bei 600 ISK Speditionscash gegenüber 930 ISK Ersatzbedarf und ohne freie Werfthülle.
3. **[OPTION / UI]** W5u [#234](https://github.com/tobiasfranziskus/Check/pull/234) getrennt auf Regel14 auf iPad Safari/NAS und Save/Load prüfen. R32 wirtschaftlich und migrationssicher stabilisieren, bevor Produkt-UI und Finanzierungsregeln zusammengelegt werden. Lesende Legacy-Adapter müssen keine Altpreis-/Profitmechanik übernehmen.
4. **[QUALITÄT]** Node22 `node --test tests/*.test.mjs`, Geld-/Waren-/Eigentümeraudit, real finanzierte Schiffe/Fracht/Arbeit und Save/Load/Hashes. **13×90d sind nur dann wirtschaftlich verschiedene Krisenfälle, wenn die Eingangsbedingungen variieren**; verschiedenes RNG ohne unterschiedliche Geldflüsse ist allein kein Robustheitsbeweis. Längere Krisenverläufe, Spieler-Sparen, NPC-Sparen, echte Ausfälle und 365/730d-Grenzen separat prüfen. Safari/NAS bleibt eine eigene Abnahme.
5. **[FREIGABE]** Nutzer entscheidet über konkrete Produktmechaniken, Merges und Veröffentlichungen. Dokumentations-/Testpflege kann gesondert in `main` erfolgen, ohne Draft-Wirtschaft oder produktive Saves zu ändern. ROADMAP ist die **einzige** Produktprioritätenquelle; Statusdokument und Repo-Index ordnen lediglich Belege.

### Historische Primärquellen

- [Vollständige frühere Roadmap auf main vor der 07.11.-Bereinigung](https://github.com/tobiasfranziskus/Check/blob/5a56d9d7e94a2ad283684b7b912c8b56ca96af53/docs/ROADMAP.md) – unverändert per `git show 5a56d9d7e94a2ad283684b7b912c8b56ca96af53:docs/ROADMAP.md` wiederherstellbar.
- [Vollständige frühere Roadmap des W5r-Forschungszweigs](https://github.com/tobiasfranziskus/Check/blob/8d6c1e7378b2d4b9f2fcec8de1157e7e5d522b03/docs/ROADMAP.md).
- [Geschlossene historische Finanz-/Handelsanalysen](ANALYSEARCHIV_HANDELSZYKLUS_2026-10-31.md), [aktuelle PR-/CI-Navigation](README.md), [Status](PROJEKTSTATUS.md). Keine dieser Dateien ist eine zweite verbindliche Roadmap.
