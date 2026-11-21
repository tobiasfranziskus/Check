# Aphros Void – Spielfeld- und Management-UX-Audit (21.11.2026)

**Status: DESIGN-/CODE-AUDIT, Vorschläge; keine beschlossene Gameplayregel, kein Feature-Merge, kein interaktiver Erstspieltest.** Basis: öffentlicher `main 564c2815a63e1446df0ea2409b71acbd0988727b`; M2-Original-Integration #543 / Codecommit `b62582b`, CI mit 553/553 Node22 und fünf vollständigen Integrations-Workflows; Pages #44854949550 auf diesem Dokumentations-Main-SHA erfolgreich. Live-HTTP-Seitenabruf scheiterte in dieser Umgebung; **keine grafische Sichtprüfung im echten Browser**. Die hier genannten UX-Wirkungen sind begründete Hypothesen aus dem heutigen DOM/CSS/JS, keine gemessenen Retentionseffekte.

## 1. Tatsächliche Bestandsaufnahme (keine Doppelentwicklung)

| Bereich | Belegbarer aktueller Stand | Für ein attraktives Wirtschafts-Spielfeld noch fehlend |
| --- | --- | --- |
| Start / erste Aktion | `index.html` verlinkt prominent „Wirtschaftsmanager“. `prototypes/spiel/index.html` führt über Prolog, „Eishandel“, bewährten Handlungsbutton und echte M1/M2-Dispositionskarten; Schiffs- und Zeitkaufwarnung bereits vorhanden (#513/#540/#543) | Nach Einstieg keine sichtbare zusammenhängende wirtschaftliche Welt; der dominante Eindruck ist formular- und textbasiert |
| Fläche / Navigation | `.game-grid` mit linker Kapitel-/Entwicklungsleiste, mittleren Tabs „Aufträge / Meine Flotte / Das Universum / Jägerproduktion“ und rechter Kassen-/Zeitleiste. `p3-industrie`, Wasser, NPC/Werft als zeitweise freigegebene Kapitel. | Keine zentrale Sektorkarte mit Stations-/Schiff-/Routenbezug. Die drei Spalten konkurrieren um Aufmerksamkeit; „Jägerproduktion“ erhält dauerhaft so viel Tab-Gewicht wie Kernmanagement |
| Universum | `#panel-universum` enthält `#sektorwirtschaft`, in `spiel.js::wirtschaftsbericht()` als Karten mit textuellen Lagern, Firmenkassen und Kaufangeboten aufgebaut. | Keine grafische Verbindung zwischen Aldera, Nadir, Transport, Lager und eigenen Schiffen; keine direkte kontextuelle Auswahl auf der Welt |
| Flotte | `spiel.js::anzeigen()` zeigt `klasse · id`, `Ort`, Flug/Ladung und einen dominanten Button „Selbst fliegen“. Das Original-Eigentum und die Core-/J8-Befehle existieren. | Pro Schiff klare Managementzustände: frei, auf Eispendel, in F4-Hin-/Rückfahrt, blockiert, Wartung/Wertverzehr, nächster erlaubter Auftrag. „Selbst fliegen“ sollte im Management sekundär sein |
| Finanzen | #543 zeigt echte Firmenkasse, kumulierte F4-Gebühren, auf separates Pilotenlohnkonto bezahlten Lohn, Original-Restbuchwerte und Verschleiß. `p3-investition.js` erlaubt eine bereits vorhandene tatsächliche Reinvestitionsentscheidung. | Chronologische, einem Auftrag zugeordnete Original-Transaktionsbelege und nachvollziehbare Veränderungen; keine erfundene vollständige GuV |
| Entscheidungen / Blocker | Echte Kauf-, Eis-, Fracht-, Wasser-, Reposition- und Industrieangebote mit Original-Sperrgründen; keine freien Eingriffe in fremde Unternehmen. | Blocker, verfügbare Handlungsalternativen und Reinvestition erscheinen verstreut. Ein gemeinsamer „Was ist jetzt möglich?“-/„Warum nicht?“-Fokus fehlt |
| Spielgefühl | Hochwertiger Startscreen und 2D-Cockpit existieren; der Manager hat reale finanzierte Aufgaben. Alte W0–W5-Rootansicht besitzt eine Karten-/Stationsdarstellung. | Für die **aktuelle J8-Karriere** eine erkennbare lebendige Handelswelt mit Fortschritt, Beziehung zwischen Ort und Wirtschaft sowie starker visueller Rückmeldung. **Nur Visualisierungsmuster** aus dem alten Root/Katalog wiederverwenden, niemals dessen unabhängigen Weltzustand |

**Verifizierbare Dateien:** `prototypes/spiel/index.html`, `prototypes/spiel/spiel.css`, `prototypes/spiel/spiel.js`, `prototypes/spiel/p3-manager-disposition.js`, `prototypes/spiel/p3-handelsweg.js`, `prototypes/spiel/p3-industrie.js` und vorhandenes Root-`index.html`. Bereits frühere Arbeiten: [#527](https://github.com/tobiasfranziskus/Check/pull/527) (vier reale F4-Livefahrten, individuelles Flottenstatus-Paket), [#512](https://github.com/tobiasfranziskus/Check/pull/512) (Erstspieler-UX, alter subjektiver 6/10-Befund), [#496](https://github.com/tobiasfranziskus/Check/pull/496) (vier/neun originale bezahlte F4-Runden, Reinvestitionsengpässe). Diese Research-Branches **nicht** als produktive Datenquellen oder integrierte Funktionen darstellen.

## 2. Zielbild – ein Spielfeld statt vieler Textkästen

Desktop / iPad quer: oben eine **schlanke Statuszeile** (Hauskasse, aktuell freie/eingesetzte eigene Schiffe, echte Aufträge, Weltzeit, Speichern). Darunter drei klar getrennte Rollen:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ DEIN KONZERN    1.650 ISK    2 eigene Schiffe    1 Auftrag läuft    +60 Min │
├───────────────────┬──────────────────────────────────┬───────────────────────┤
│ NÄCHSTE ENTSCHEID.│         SEKTORKARTE             │  BETRIEB & MARKT       │
│ 1  Miner einsetzen│ Aldera  ─── echte Strecke ─ Nadir│ Kasse / Lager          │
│ 2  Fracht prüfen  │    Schiffe, Ware, Wegstatus      │ Gebühren / Löhne      │
│    Originalblocker│    Dravos nur wenn vorhanden     │ Engpass / Risiko      │
├───────────────────┴──────────────────────────────────┴───────────────────────┤
│ AUSGEWÄHLTES SCHIFF / STATION: Ort, Eigentum, Ladung, Wert, Originalauftrag  │
│ EREIGNISSE: bezahlt, geliefert, gesperrt (nur echte Originalbelege)         │
└──────────────────────────────────────────────────────────────────────────────┘
```

**iPad hoch / schmale Breite:** zuerst Statuszeile und **Karte**, darunter eine feste/leicht erreichbare Auftragsleiste oder ein aufklappbares Kontextpanel; Finanzen/Ereignisse als weiterer Bereich. Touchflächen mindestens 48 px, kein Hoverzwang, reduzierte Bewegung respektieren. Pilotensimulation bleibt erreichbar, aber nicht als Manager-Hauptaktion.

**Datenwahrheit:** Aldera/Nadir als schematische Standorte, *keine* erfundene geografische Distanz. Für Regel207 Dravos nur aus tatsächlich bekanntem World-State markieren und ohne fingierte Transportroute. Eine Verbindung zeigt **nicht automatisch einen aktiven Vertrag**. Transportsymbol, Fortschritt und Ankunft nur aus Original-`ships`, `w5n.frachtauftrag`, `w3.auftrag`, `w5ac.active` und belegten Zeitfeldern; kein unabhängiger Tick/Shader-Simulator. Kasse, Ware und Vertrag bleiben allein im Kern autoritativ.

## 3. Priorisierte Vorschläge

| Priorität | Verbesserung und Spielwirkung | Kleinstes sinnvolles DoD | Grenze |
| --- | --- | --- | --- |
| **P0 / zuerst** | **Grafische Sektorübersicht als Standard-Mittelpunkt**. Aldera/Nadir mit Kauf-, Lager- und Eigentumszustand; eigene aktive/angedockte Schiffe auf Karte; Originalstrecken als schematische Linien; Klick öffnet bestehende Flotten-/Stationsdetails. Erst hier sieht der Spieler tatsächlich, *was sein Konzern in der Welt bewirkt*. | Statische SVG- oder HTML/CSS-Darstellung, selektierbarer Status aus **einem** aktuellen J8-Snapshot; sichtbare Legende „Strecke ≠ Auftrag“, Save/Hash unverändert; Chromium/WebKit in vier Touchgrößen | Keine neuen Systeme, keine neue Navigationsmechanik, keine Simulationskoordinaten erfinden |
| **P0 / danach** | **Flottenzentrale als Auftragsboard statt Cockpit-Verzeichnis**. Pro eigenes Schiff Bildzeichen/Typ, Ort, Cargo, Original-Auftragsphase, Verfügbarkeit, Buchwert/Verschleiß, *ein* rechtmäßig möglicher Auftrag oder Original-Sperrgrund. Pilotbutton sekundär. | Noch in Aldera und unterwegs befindliche eigene Schiffe werden deterministisch korrekt gezeigt; jede Aktion durch `session.angebote()`/`session.ausfuehren()`; W6/Eigentums-/Save-Negativtests | Keine fremden Schiffe übernehmen oder künstlichen Auftrag auslösen |
| **P1** | **Lebendige, prüfbare Betriebsereignisse**. „50 Eis gefördert“, „240 ISK Frachtgebühr gebucht“, „120 ISK Löhne gezahlt“, „Nadir-Werft gesperrt: Material fehlt“ genau dann, wenn belegte Originalzustände diese Ereignisse tragen. | Nur durable Transaktions-/Vertragsbelege, ursprüngliche Zeit/Schiff/Konto, nach Save/Load reproduzierbare Sortierung; keine generierten pseudo-historischen Nachrichten | Wenn für ein Ereignis kein Originalbeleg existiert: nicht erfinden |
| **P1** | **Ein fokussierter nächster Managementschritt** aus bereits existierenden, rechtmäßig finanzierbaren J8-Angeboten; Warnungen für zeitkritische Marktangebote und verfügbare Alternative „warten/aussetzen“ statt bloß 20 deaktivierter Knöpfe | Genau eine Hauptaktion und bis zu zwei echte Alternativen, mit konkretem Original-Sperrgrund; bestehender `p3-handelsweg.js` wird **integriert**, nicht dupliziert | Keine Nachfragesteuerung oder verspätete Rettungskäufe |
| **P1** | **Reinvestitions- und Engpassübersicht**. „Kauf möglich“, „Geld reicht, Werftlager leer“, „Frachter gebunden“, „Käufer kann nicht zahlen“ klar unterscheiden; Eigentümer anderer Firmen erkennbar | Original-Kassen-/Lager-/Streckenwerte mit echten J8-Sperrgründen, klare Warnung zu unvollständiger GuV; echter Kauf aus vorhandenem Lager und anrechenbarer Auftrag geprüft | Kein garantierter Nachschub, keine fremden Produktionsrechte |
| **P2 / nach P0** | **Bedeutende strategische Entscheidungen statt neunmal derselben Eisfracht**: eigene Vertragswahl, Lagerallokation und später rechtmäßig eigenes Industrieunternehmen | Vor neuer Simulation/Vertragsart Nutzerentscheid über Eigentums-/Marktrechte und W6-Abhängigkeiten, separater Branch, gepaarte Negativ-/Langzeitaudits | **Neue Wirtschaftsspielregeln benötigen Produktfreigabe**; sichtbare UI alleine darf sie nicht vortäuschen |
| **P2** | **Wirkliche 60-Minuten-Neulingsabnahme** der aktuellen veröffentlichten Version, ohne Vorwissen und ohne Cockpit; erster Erfolg, Abbruchstellen und Bereitschaft zu weiteren 30 Minuten dokumentieren | Reale interaktive Sitzung mit Screenshots und 4 Touchgrößen, anschließend echte Spielerbeobachtung wenn möglich; Zahl der Tests und gemessene Verweildauer getrennt ausweisen | CI-Browserautomatik ist kein Retentions- oder echter iPad-/NAS-Test |

## 4. Ausführbare Arbeitspakete (je ungefähr 30 Minuten, keine erfundenen Fortschritte)

**S1 – Karten-MVP:** Neue **nur lesende** Komponente `prototypes/spiel/p3-manager-karte.js` plus enges HTML/CSS. Aus Original-`session.ansicht()` und `zustandReferenz()` die Stationen Aldera und Nadir, eigenbesessene Schiffe/Phasen sowie Lager-Kernaussagen rendern. Dravos nur unter passender Weltfreigabe. Karte als erster Tab/zentraler Anker; bestehender Wirtschaftsbericht bleibt zugänglich. DoD: zweifacher Seed42-Replay, alter Hash, keine neuen Felder, vier Touchgrößen Chromium/WebKit, Save/Load, keine Position oder Route behauptet, die nicht definiert ist.

**S2 – Kontextsensitive Flotte:** Bestehenden Renderer `spiel.js::anzeigen()` umbauen statt neue Flottenwelt: eigene Schiffe im Karten-/Listen-Kontext auswählen; aktueller J8-Verfügbarkeitsstatus/Original-Stopp/F4-Befehl, Besitzer, Ort, realer Buchwert, Ladung; Cockpit sekundär. DoD: echte laufende Eisfracht und Rückfahrt, Eigenrecht- und Stilllegungsnegativfälle, stabiler UI-Selektionszustand bei Reload ohne Save-Migration.

**S3 – Ereignisse und Buchungsbelege:** Lesenden Wirtschafts-/Auftragsverlauf aus existierenden `kanon.spielerFrachten.auftraege`, `w5n`, `kanon` und Original-Geldbuchdatensätzen zusammenstellen. Das Limit und die Original-Quellenfelder pro Ereignistyp zuerst inventarisieren; keinen zusätzlichen Persistenzlayer. DoD: vier unterschiedlich finanzierte Original-Ereignisse nach Save/Load byteidentisch; keine doppelt gezählte Einnahme/Reserve.

**S4 – M4-Erstspiellauf und Prioritätsprüfung:** Gegen den **öffentlich deployten** SHA die ersten 60 Minuten als Wirtschaftsmanager tatsächlich spielen und prüfen, ob Karte, Schiff, Auftrag, erste echte Fracht, Kosten und Folgeentscheidung ohne Anleitung gefunden werden; nur daraus UX-Änderungen in kleinen PRs ableiten. Echtgerät separat.

## 5. Freigabe-/Qualitätsregeln

Dieser Bericht ist **eine Produkt-/UX-Empfehlung auf Basis des Repositorystands**, keine neue Roadmap-Entscheidung und keine Einwilligung in Wirtschaftsumstellungen. Keine Änderungen an `AGENTS.md`, `docs/ROADMAP.md`, `docs/PROJEKTSTATUS.md`, Runtime oder Spielstand. Spätere produktive Schritte jeweils auf separaten Branch, mit Backup, eigenem Integrations-PR, Originallogik-/Browser-Nachweisen und SHA-exaktem Pages-Deploy. **Entscheidender Faktor für Attraktivität: Eine verständliche Handelswelt mit sichtbar wirksamen Entscheidungen – nicht mehr unverbundene Textzahlen und weitere dekorative Untermenüs.**
