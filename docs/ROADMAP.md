# Aphros Void – verbindliche Produkt-Roadmap

**Stand 15.11.2026 · [BESCHLOSSEN] Produktziele und Entwicklungsreihenfolge.** Dies ist die **einzige** verbindliche Roadmap. Technische Nachweise stehen in [PROJEKTSTATUS.md](PROJEKTSTATUS.md); Entwicklungs- und Release-Gates in [AGENTS.md](../AGENTS.md). Historische Einträge sind vollständig und unverändert in [ROADMAP_HISTORIE_BIS_20261115.md](archiv/ROADMAP_HISTORIE_BIS_20261115.md) archiviert. Alte Commit-/PR-Labels gelten ausschließlich für ihren ursprünglichen Zeitpunkt.

## 1. Produktvision und Architektur

- **[BESCHLOSSEN]** Ein Weltraumspiel, in dem der Spieler Konzerne führt und eigene Miner, Frachter oder Jäger **persönlich in 2D fliegen** kann. Wirtschaft, NPCs, Waren, Eigentum, Flug, Kampf und Weltzeit nutzen **einen einzigen deterministischen, autoritativen Kern**. Spielerort, legitimer Schiffswechsel und Konzernübersicht gehören zu **einer** Sitzung.
- **[BESCHLOSSEN]** Statische `index.html`, HTML, CSS und Vanilla JS; iPad Safari, GitHub Pages und statisches NAS. Keine Backend-, Framework-, CDN-, WebGL- oder Build-Pflicht ohne gesonderte Freigabe. Bestehende Root-Navigation und Spielstände schützen.
- **[BESCHLOSSEN]** Keine normale Treibstoffpflicht. Real bezahlte Pilotenarbeit, Arbeitszeit, Waren, Fahrt, Verschleiß, Wartung, Produktion, Schiffbau, Verträge, Eigentum und Ersatz.
- **[BESCHLOSSEN]** Unbegrenztes Sparen des Spielers, wirtschaftliches Scheitern von NPC-Firmen erlaubt. Keine individuellen Rettungen oder Gratis-Schiffe/Geld/Waren. Unternehmen können fremdes Eigentum nur durch finanzierten Vertrag/Kauf/Übernahme erlangen.
- **[BESCHLOSSEN]** Ein exportierter, validierter Spielstand muss nach Load/Replay dieselben deterministischen Kern- und Buchungswerte liefern. Bestehende Formate und Speicherorte niemals still migrieren.

## 2. W0–W6: verbindliche Wirtschaftsreihenfolge

| Stufe | Abnahmeziel | Integrierte Grundlage / offene Lücke |
| --- | --- | --- |
| **W0 Buchungskern** | Vollständig finanzierte Treuhand-/Lohn-/Waren-/Eigentumsbelege; unabhängige Audits | **[MAIN]** Regel195 und Regel204-Grundlagen |
| **W1 Erz/Bergbau** | Eigene bezahlte Förderung, begrenzte Ressourcen, unverkaufte Ware verbleibt beim Besitzer | **[MAIN]** Mineral-/Erz-/Eis-Pfade; weitere Rentabilitätsnachweise offen |
| **W2 Konzerne** | Getrennte Kassen und Eigentum, legaler Schiffskauf, NPC-Ausfall möglich | **[MAIN]** getrennte `house`-/Stations-/NPC-Befehlsrechte; volle Konkurrenz/Übernahmen offen |
| **W3 Transport** | Reale Hin-/Rückfracht mit Eigentum, Lohn, freien/gebundenen Kapazitäten | **[MAIN]** originale finanzierte Frachten; persönlicher Frachter-Freiflug noch offen |
| **W4 Raffinerie** | Erz in Material mit vollständigen Kosten und zahlenden Abnehmern | **[MAIN]** vorhandener Original-Core; nachhaltige Folgeabnahme offen |
| **W5 Module/Schiffbau** | Finanzierte Bauteile und Hüllen, MK1-Module, Ersatzwirtschaft | **[MAIN]** zweiter finanzierter 900-ISK-Jäger reproduzierbar; spielbarer fremder Werftauftrag/Module offen |
| **W6 Gesamtwirtschaft** | Dauerhaft real bezahlte Kreisläufe, zivile/industrielle Endnachfrage, Krisen über 13×90/365/730 Tage | **[BESCHLOSSEN / NOCH NICHT NACHGEWIESEN]** |

**[BESCHLOSSEN]** Kein globales künstliches Mining-Auftragslimit: verfügbare Felder, Lager, Schiffskapazität und bezahltes Betriebskapital begrenzen reale Förderung. Verkauf und Abbau sind unabhängig; kein garantierter Käufer. Verbesserte Miner/Module kosten tatsächlich Material, Geld, Zeit und Wartung.

**[BESCHLOSSEN]** Industrie-/Endnachfrage auf echte, finanzierte Schiffe, Module, Wartung, Expansion, Reparaturen und Verluste stützen. Schaden erzeugt Warenbedarf, **kein Geld**.

## 3. Geldmodell und Wirtschaftssicherheit

**[BESCHLOSSEN] Geldmodell B:** Neue ISK grundsätzlich nur begrenzt, transparent und gegen nachgewiesene reale Leistungen; **konkrete Emissionshöhe, Budget, Empfänger oder Exportmechanik sind noch NICHT freigegeben**. Lohn, Dividende, Fracht, Gebühr, Kauf und Treuhand-Umbuchung sind kein Mint. Keine versteckte Liquiditätsrettung.

**[OPTION]** Bewusst begrenzte Industrie-/Zivilexporte, Artefakt-/Edelsteinfunde als zunächst physische Waren, Piraten- und Bergungsaufträge, MK1→MK2/MK3 und Piloten-Skills. Ohne separate Freigabe keine Geldemission, keine neuen Balancing-Regeln, keine künstlichen Abnehmer oder mehrfach vergüteten Güter.

## 4. Spielsysteme (A–I bleiben langfristige Ziele)

- **A Geografie/Sicherheit:** Aldera/Cyris/Veldra (sicher), Orion/Nadir (umkämpft), Dravos/Meridian (gesetzlos); weitere Systeme nur bei sinnvoller Wirtschaft.
- **B/C Versorgung/Konzerne:** HQ, Flotte, Marktwaren, echtes Personal, Kassen, Verträge, Ausfall, Übernahmen und Handel.
- **D/E Kampf/Piraten:** riskante Einsätze, Piratenbelts/-stützpunkte, finanziell gedeckte Eskorte, Schaden, Rettung und Bergung; keine Gratis-Belohnung.
- **F Industrie:** Module, Ersatzteile, werftseitige Schiffe, Außenposten sowie bezahlte Infrastruktur und Versorgung.
- **G UI/Spielerort:** Nahtloses Konzernterminal, Karte, Station, Flotte, Markt, Produktions-/Personalübersicht und Pilotenstandort.
- **H Persönliches Flugspiel:** Miner, Frachter, Jäger; echtes 2D-Fliegen, Docken, Wechsel, Förderung, Transporte und Kampf im selben Weltkern.
- **I Erweiterungen:** weitere Schiffe/Fraktionen/Systeme; Multiplayer optional und erst nach stabilem Einzelspiel, kein Backend-Zwang.

## 5. Aktuelle Prioritäten, Stand 15.11.2026

1. **[MAIN / J9 ERREICHT]** J8-Konzernwelt und grafisches RAUM-1-Cockpit ohne zweiten Weltzustand/JSON-Zwischenschritt verbunden. Ein eigener, im Core für 600 ISK gekaufter Miner fliegt mit 40 ISK vorfinanzierter Flugreserve; fremde Schiffe, Doppelsteuerung und Jäger ohne Kaufbeleg bleiben gesperrt. [PR #366](https://github.com/tobiasfranziskus/Check/pull/366).
2. **[MAIN / J10a ERREICHT]** [PR #368](https://github.com/tobiasfranziskus/Check/pull/368): In der einen spielbaren Konzern-/Minerwelt werden originaler Jägerwerftbestand, Firmenkassen, Material-/Silizium-/Bauteilbedarf sowie tatsächliche Core-Vertragssperren **nur lesend** angezeigt. Hauskauf nur für tatsächlich vorhandene und bezahlbare 900-ISK-Hülle; Nadir-/NPC-/Werftrechte bleiben getrennt. **289/289 Node22**, Chromium/WebKit je 3 J10-Touchgrößen, Weltgeld 33.000 ISK, Mint/Burn 0. Kein erster Jäger aus frischer Regel195-Kopie produziert.
3. **[BESCHLOSSEN / J10b NÄCHSTER SCHRITT]** Die **bereits vorhandene** NPC-Gründung und die **nicht freigegebene** optionale K7-Industriekoordination unabhängig untersuchen: In Minute1 erwirbt `transport` einen Frachter für 750 ISK, doch `npc3/sh001` beginnt gleichzeitig seinen Erz-Pendelauftrag und ist in Minute131 mit 50 Erz **im Flug statt frei am Dock**. Deshalb blockiert das originale K7-Auftragsangebot trotz ausreichender Werftreserve (600 gegenüber 530 ISK). Lösung nur durch echte Eigentümerentscheidungen, bezahlte Vertrags-/Frachtarbeit und ohne Material-/Geldrettung; weitere produktive NPC-Politik bedarf gesonderter Freigabe.
4. **[BESCHLOSSEN / NACHFOLGER]** Persönlichen Frachterflug mit Original-F6-Transportwirtschaft und echten Löhnen/Kapazitäten verbinden, nicht freischalten, solange der Core die Freifahrt sperrt.
5. **[ANALYSE / OFFEN]** Endnachfrage und Ersatzkreisläufe mit getrennten Firmen/Haushalten, 13 **wirtschaftlich unterschiedlichen** 90-Tage-Szenarien, 365/730-Tage-Krisen; echte Unterfinanzierung nicht wegoptimieren.
6. **[QUALITÄT]** Regel195/204/Schema8 und JSON/IndexedDB schützen; Node22, Seed-Hashes, Geld-/Waren-/Eigentums-/Schiffsaudits, Chromium/WebKit je vier Touchgrößen bei größerer Integration; echtes iPad Safari und NAS weiterhin gesondert abnehmen.

## 6. Integrations- und Veröffentlichungsregeln

Der aktuelle integrierte Spielstand ist **[MAIN] `1a8d9cdc`** nach J10a; [GitHub Pages](https://tobiasfranziskus.github.io/Check/) mit erfolgreichem [Deploy #43699888790](https://github.com/tobiasfranziskus/Check/actions/runs/43699888790). Regel195-Root-Save und freiwillige Regel204-Kopie bleiben bewusst getrennt, bis eine ausdrücklich sichere, rückverfolgbare Produktintegration vorliegt. W6 ist **nicht** als dauerhaft tragfähig nachgewiesen.

**[GOVERNANCE]** Gemäß [AGENTS.md](../AGENTS.md) gilt die ausdrücklich vom Nutzer erteilte stehende Merge-/Pages-Freigabe vom 14.11.2026 **nur für ausreichend geprüfte, spielbare Schritte** mit eigenem Integrations-PR, gesicherter Vorversion, tatsächlichen CI-/Browser-/Speichertests und nachgewiesenem Pages-Deploy. Keine NAS-Veröffentlichung, neue Emissionsmechanik oder destruktive Migration ohne gesonderte Entscheidung. CI/WebKit ersetzt keinen echten iPad-/NAS-Gerätetest.

## Historische und technische Quellen

[Historische gesamte Roadmap](archiv/ROADMAP_HISTORIE_BIS_20261115.md) · [Historischer vollständiger Projektstatus](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md) · [Technischer Status](PROJEKTSTATUS.md) · [Repository-/PR-Index](README.md) · [Entwicklungsregeln](../AGENTS.md).
