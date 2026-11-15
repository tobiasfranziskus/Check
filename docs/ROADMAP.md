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
| **W6 Gesamtwirtschaft** | Dauerhaft real bezahlte Kreisläufe, zivile/industrielle Endnachfrage, Krisen über 13×90/365/730 Tage | **[BESCHLOSSEN / IN MAIN NICHT NACHGEWIESEN]** · **[DRAFT]** opt-in NPC-Firmenpolitik mit 13×90-Regimen in [#382](https://github.com/tobiasfranziskus/Check/pull/382), nicht integriert |

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
3. **[MAIN / J10b ERREICHT]** [PR #373](https://github.com/tobiasfranziskus/Check/pull/373) verbindet den originalfinanzierten, für `house` vorgemerkten 600-ISK-K2-Nadir-Minerkauf mit dem vorhandenen J9-Cockpit und ergänzt die öffentliche Root-Navigation. Kauf nur nach echter physischer Werftfertigung, Eigentümerprüfung und Core-Audit; 293/293 Node22, Chromium/WebKit geprüft. Keine NPC-Autopolitik, neuen Regeln oder Save-Migration. Vorversion separat gesichert; [Pages-Deploy #43705980924](https://github.com/tobiasfranziskus/Check/actions/runs/43705980924) erfolgreich.
4. **[ANALYSE / J10c NACHGEWIESEN, NICHT MAIN]** Die ausschließlich durch vier getrennte Firmenaufträge signierte K7-Kette in [#370](https://github.com/tobiasfranziskus/Check/pull/370) erzeugt echte Erzlieferung, W5-Frachter, K2-Miner, Silizium. [#374](https://github.com/tobiasfranziskus/Check/pull/374) erweitert den positiven Pfad um **7 vollständig bezahlte J3-Bauteile**; der achte J3-Auftrag und J4 sind wegen einer Lücke von **5 Material = mindestens 10 zusätzliche Erz** blockiert. 293/293 Tests, Weltgeld 33.000 ISK, Mint/Burn 0, Hash `17ddd7e3a45f2f0d`. Kein lebendiger NPC-Autokreislauf und kein fertig gebauter erster Jäger aus frischer Konzernwelt.
5. **[ANALYSE / J10d NEUER GEPRÜFTER BLOCKER]** [Forschungs-Draft #376](https://github.com/tobiasfranziskus/Check/pull/376): Der legitimierte NPC3-Miner kehrt nach 11 realen Flugminuten zum Dock zurück, und `transport` kauft den vorhandenen W5-Frachter für 750 ISK. Vier unabhängige Firmen können den zweiten K7-Vertrag anbieten/unterschreiben; **die abschließende Original-Core-Finanzierung sperrt korrekt**, weil **`st_aldera` 0 von 500 erforderlichen ISK** hat. Alle übrigen vier Firmen verfügen über ausreichende reale Kassen; Weltgeld 33.000, Mint/Burn 0. **293/293 Node22** auf Testcode-Head, keine wirtschaftliche Nachhaltigkeit. Die Option eines weiteren Erlös-/Vorfinanzierungsmodells ist ausdrücklich **nicht freigegeben**.
6. **[BESCHLOSSEN / NÄCHSTER WIRTSCHAFTSSCHRITT]** Bestehende reale Aldera-Warenbestände, Haushaltsbudgets und originalfinanzierte Verkaufspfade auf tatsächlich erzielbare 500 ISK prüfen; andernfalls einen **separat freizugebenden [OPTION]**-Vorschlag für echte, beidseitig gebuchte Vorfinanzierung oder wirtschaftlichen Ausfall ausarbeiten. Erst nach rechtmäßiger Vorfinanzierung den zweiten K7-Vertrag und den J3/J4-Jägerpfad erneut versuchen.
7. **[DRAFT / W6 · NICHT MAIN]** [#382](https://github.com/tobiasfranziskus/Check/pull/382), [Bericht](W6_WIRTSCHAFTSKONTEXT.md): Die Prüfung aus Punkt 6 ist erfolgt. Die Aldera-Lücke war **gebundenes Betriebskapital** (zwei parallele 500-ISK-Erztreuhandkonten), kein fehlendes Geld; ohne Transfer, Kredit oder Emission. Eine **opt-in** NPC-Firmenpolitik im selben Regel204-Kern (nur Eigenbefehle, im Produkt nicht aktiviert) trägt über 90 Tage Eis→Wasser→Lohn/Dividende→Konsum sowie Erz→Material→Frachter/Miner→Verschleiß→Ersatzkauf; 13 unterschiedliche Regime: 3 tragfähig, 2 schwach, 8 ehrlich gebuchte Stillstände. Weltgeld 33.000 ISK, Mint/Burn 0. **Offen [OPTION]:** Aktivierung/Standardwerte, Rücklagenregel bei Stilllegung, Spieler-Werftauftrag, Siliziumvorrat (höchstens zwei Jäger je Welt), Ausmusterung verbrauchter Hüllen.
8. **[BESCHLOSSEN / NACHFOLGER]** Persönlichen Frachterflug mit Original-F6-Transportwirtschaft und echten Löhnen/Kapazitäten verbinden, nicht freischalten, solange der Core die Freifahrt sperrt.
9. **[ANALYSE / OFFEN]** Endnachfrage und Ersatzkreisläufe mit getrennten Firmen/Haushalten, 13 **wirtschaftlich unterschiedlichen** 90-Tage-Szenarien, 365/730-Tage-Krisen; echte Unterfinanzierung nicht wegoptimieren.
10. **[QUALITÄT]** Regel195/204/Schema8 und JSON/IndexedDB schützen; Node22, Seed-Hashes, Geld-/Waren-/Eigentums-/Schiffsaudits, Chromium/WebKit je vier Touchgrößen bei größerer Integration; echtes iPad Safari und NAS weiterhin gesondert abnehmen.

## 6. Integrations- und Veröffentlichungsregeln

Der aktuelle integrierte Spielcode ist **[MAIN] `31665404`** nach J10b ([Integrations-PR #373](https://github.com/tobiasfranziskus/Check/pull/373)); [GitHub Pages](https://tobiasfranziskus.github.io/Check/) ist für exakt diesen Commit mit [Deploy #43705980924](https://github.com/tobiasfranziskus/Check/actions/runs/43705980924) erfolgreich veröffentlicht. [Backup vor J10b](https://github.com/tobiasfranziskus/Check/tree/backup/main-before-j10b-nadir-k2-20261115). Regel195-Root-Save und freiwillige Regel204-Kopie bleiben bewusst getrennt, bis eine ausdrücklich sichere, rückverfolgbare Produktintegration vorliegt. W6 ist **nicht** als dauerhaft tragfähig nachgewiesen.

**[GOVERNANCE]** Gemäß [AGENTS.md](../AGENTS.md) gilt die ausdrücklich vom Nutzer erteilte stehende Merge-/Pages-Freigabe vom 14.11.2026 **nur für ausreichend geprüfte, spielbare Schritte** mit eigenem Integrations-PR, gesicherter Vorversion, tatsächlichen CI-/Browser-/Speichertests und nachgewiesenem Pages-Deploy. Keine NAS-Veröffentlichung, neue Emissionsmechanik oder destruktive Migration ohne gesonderte Entscheidung. CI/WebKit ersetzt keinen echten iPad-/NAS-Gerätetest.

## Historische und technische Quellen

[Historische gesamte Roadmap](archiv/ROADMAP_HISTORIE_BIS_20261115.md) · [Historischer vollständiger Projektstatus](archiv/PROJEKTSTATUS_HISTORIE_BIS_20261115.md) · [Technischer Status](PROJEKTSTATUS.md) · [Repository-/PR-Index](README.md) · [Entwicklungsregeln](../AGENTS.md).
