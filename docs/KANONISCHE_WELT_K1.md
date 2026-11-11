# Kanonische Welt K1 – Architekturbericht und Integrationsentscheidung

**[DRAFT / Forschungsregel 199 · 11.11.2026]** Basis: `main` [`04124f2b`](https://github.com/tobiasfranziskus/Check/commit/04124f2bca27dc33b54be30c07b6a7bbb7387e81). Kein Merge, kein Deployment, keine Produktfreigabe. Verbindlich bleiben [ROADMAP.md](ROADMAP.md), [PROJEKTSTATUS.md](PROJEKTSTATUS.md) und [AGENTS.md](../AGENTS.md). Wirtschaftliche Ergebnisse und offene Entscheidungen stehen in [K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md](K1_WIRTSCHAFT_VERGLEICH_UND_TESTS.md).

Alle Zahlen dieses Berichts stammen aus dem Code des Arbeitsbaums. Die Bestandsaufnahme ist ausführbar: `node tools/bestandsaufnahme.mjs`.

## 1. Kurzfassung

Vor diesem Stand gab es **einen** tatsächlich ausgeführten Wirtschaftskern im Produkt, daneben aber sechs ältere Kopien desselben Kerns, vier Regelkennungen für dieselbe Aldera/Nadir-Welt (195–198), drei getrennte Flugkopplungen als Hüllen um den Kern und eine Spielstandablage nur für Regel195. Flug und Wirtschaft waren nicht im Kern verbunden: die Ortsbindung saß in einer Hülle, die den Kern von außen steuerte.

K1 führt das zu **einer Welt** zusammen:

| | vorher | K1 |
| --- | --- | --- |
| Wirtschaftskern | 1 aktiv (`prototypes/w5ac/rule191-w5-ferry-core.js`), 6 ältere Kopien, 2 archivierte Einbettungen | derselbe eine Kern; keine neue Kopie |
| Flug | eigener Kern + drei Hüllen (F1/F2a/F2b), nur Miner | derselbe Flugkern, eine Zusammensetzung, Miner **und** Frachter |
| Ortsbindung | in der F2a-Hülle (Missionsautomat, Phasen-Umschaltung) | im Kern selbst (`m_core_kanon`), gilt für jeden Befehl von Spieler und NPC |
| Regelkennung der Welt | 195, 196, 197, 198 | 199 (Forschung); 195 bleibt Produkt bis zur Freigabe |
| Tick | Wirtschaftsminute; Flugteilschritte je Hülle | eine Minute = 60 Flugteilschritte + genau ein Wirtschaftsschritt + ein fester Abschluss |
| Spielstand | Regel195-Ablage (#289); 196–198 nur manuelles JSON | eigene Ablage mit Autosaves, Plätzen, unveränderlichen Sicherungen, Import/Export |
| Übergang | keine Migration | ausdrückliche, feldweise geprüfte Übernahme Regel195 → K1 |

Das Produkt ist **nicht umgestellt**. `index.html` und `aphros-void.html` spielen weiterhin Regel195; sie wurden nur aus der Kernquelle neu erzeugt, weil diese inaktive Haken erhalten hat (Abschnitt 5).

## 2. Bestandsaufnahme: was tatsächlich existiert

### 2.1 Simulationskerne

Dateien mit eigenem Minuten-Tick (`m_core_step`), aus dem Code gelesen:

| Datei | Größe | Regelprofile im Code | Rolle |
| --- | ---: | --- | --- |
| `prototypes/w5ac/rule191-w5-ferry-core.js` | 196 KB | 14, 15, 16, 17, 18, 191–195, neu 199 | **einziger im Produkt ausgeführter Kern**; Profil wird über eine Fabrikfunktion gewählt |
| `prototypes/w5ab/original-w5-core.js` | 142 KB | bis 19 | ältere Ausbaustufe, nur in `prototypes/w5ab/index.html` |
| `prototypes/w5aa/original-w4-core.js` | 130 KB | bis 18 | ältere Ausbaustufe |
| `prototypes/w5y/original-w3-core.js` | 121 KB | bis 17 | ältere Ausbaustufe |
| `prototypes/w5x/original-w2-core.js` | 111 KB | bis 16 | ältere Ausbaustufe |
| `prototypes/w5w/original-w1-core.js` | 100 KB | bis 15 | ältere Ausbaustufe |
| `prototypes/w5u/original-core.js` | 81 KB | bis 14 | Regel14-Kern des W5u-Hubs |
| `index.html` = `aphros-void.html` | 325 KB | wie w5ac | Produkt: bettet w5ac ein, startet Profil 195 |
| `versionen/main-pre-w5-20261110/index.html` | 533 KB | bis 32 | archivierte frühere Hauptversion (Regel14 produktiv, R15–R32 Forschung) |
| `versionen/v0.12.5/index.html` | 212 KB | bis 14 | archivierte Version |

Die sieben Kerndateien sind aufeinander aufbauende Kopien, keine konkurrierenden Engines. Der Kern in `w5ac` enthält alle früheren Stufen als Module (W1 Erz, W2 Konzerne, W3 Fracht, W4 Raffinerie, W5 Schiffbau, W5ac Überführung, W5ad Ersatz, W5ae Lohnkauf, W5n Eis/Wasser, W5ag Pilotenlöhne). Jede Stufe hat ein eigenes Audit, das die beteiligten Kassen aus Anfangskapital und Zählern rekonstruiert.

### 2.2 Weltzustände und Regelprofile

| Welt | Regel | Geld | Geografie | Status |
| --- | --- | ---: | --- | --- |
| Frühere Hauptwelt | 14 | 55.000 ISK | sieben Systeme, 18 Waren | archiviert (`versionen/`), eigene Datenbank `aphros-void` |
| R32-Forschungswelt (#243, #245-Vergleich) | bis 32 | 33.000–40.000 ISK | Aldera/Nadir | nur in der archivierten Hauptversion und alten Branches |
| **Produktwelt** | **195** | **33.000 ISK** | Aldera/Nadir, 6 Waren | `main` |
| Flugforschung | 196, 197, 198 | 33.000 ISK | wie 195 + Flugfelder | Hüllen um den 195-Kern, [#296](https://github.com/tobiasfranziskus/Check/pull/296)–[#298](https://github.com/tobiasfranziskus/Check/pull/298) |
| **Kanonische Welt** | **199 (K1)** | **33.000 ISK** | wie 195 + Flugfelder | dieser Draft |

196–198 unterscheiden sich wirtschaftlich nicht von 195: die Hüllen setzen `state.rulesVersion` vor jedem Kernaufruf auf 195 und danach zurück. Die Nummern dienen nur als Sperre gegen das Verwechseln von Forschungsständen.

### 2.3 Speicherablagen

| Ablage | Inhalt | Geöffnet von |
| --- | --- | --- |
| IndexedDB `aphros-void` (+ `aphros-void-save`) | Regel14-Stände | archivierte Versionen |
| IndexedDB `aphros-void-erzpilot-regel15-v1`, `…-w2-regel16-v1`, `…-w3-regel17-v1`, `…-w4-regel18-v1`, `…-w5-regel19-v1` | Forschungsstände R15–R19 | archivierte frühere Hauptversion |
| IndexedDB `aphros-void-regel195-v1` | Regel195: `auto`, `manual`, `previous` | Produkt ([#289](https://github.com/tobiasfranziskus/Check/pull/289)) |
| manuelle JSON-Datei | Regel196/197/198 | Flug-Demos |
| **IndexedDB `aphros-void-welt-v1`** | K1: Autosave-Ring, benannte Plätze, Sicherungen | `prototypes/welt/` |

Keine dieser Ablagen wird von einer anderen Seite gelesen oder geschrieben. IndexedDB ist an Browser und Adresse gebunden: NAS und GitHub Pages teilen nichts. K1 fügt keine Synchronisierung hinzu.

### 2.4 Einstiege

24 HTML-Seiten vor K1: zwei identische Produktwurzeln, zwei Archive, ein Startblatt (`spieltest/w5-rc1`), 19 Prototypseiten (davon acht ohne Simulationskern: reine Legacy-UI-Demos). K1 fügt genau eine hinzu: `prototypes/welt/index.html`.

## 3. Übernahmetabelle

| Funktion | Bestehende Implementierung | Quell-PR | Zielzustand in K1 | Übernahmeverfahren | Migrationsrisiko |
| --- | --- | --- | --- | --- | --- |
| Buchungs-, Treuhand- und Auditkern W0–W5 | Module im w5ac-Kern | #161 ff., #267–#278, main | unverändert derselbe Kern | Profil 199 über Fabrik; keine Kopie | gering: 265 Bestandstests, drei vorab berechnete Regel195-Hashes |
| Eis, Wasser, Pilotenlöhne | `m_core_w5n`, `m_core_w5ag` | #277, #278 | unverändert genutzt | Befehle `shipMine`, `shipSellIce`, `shipFreightIce`, `stationWater` | gering |
| Folgefinanzierung aus Lohnkäufen | Test und Bericht | [#288](https://github.com/tobiasfranziskus/Check/pull/288) | Nachweis bleibt; K1 verallgemeinert ihn auf alle Lohnempfänger | drei additive Dateien übernommen | keins (nur Test/Doku) |
| Spielstandschutz Regel195 | `prototypes/w5ag/storage.js` | [#289](https://github.com/tobiasfranziskus/Check/pull/289), main | bleibt für Regel195 unverändert | Prinzipien (Prüfsumme, Revisionsvergleich, Sperre) in `welt-speicher.js` übernommen | keins: andere Datenbank |
| Flugkern (Ganzzahl-Kinematik, Andocken, Ortsabfragen) | `prototypes/flug2d/flug-kern.js` | [#294](https://github.com/tobiasfranziskus/Check/pull/294) | unverändert | Zusammenführung des Stapels | gering: unverändert, eigene Tests |
| UX08-Grafik | `prototypes/flug2d/grafik.js` | #294 (aus void-echoes nachgebildet) | lesender Renderer der K1-Seite | unverändert eingebunden | keins |
| Kopplung Flug ↔ Wirtschaft | `f1-kopplung.js` (Regel196) | [#296](https://github.com/tobiasfranziskus/Check/pull/296) | ersetzt durch `welt-kern.js` | Idee übernommen (ein Zustand, ein Tick, Abkürzung bei Ruhe); Regelkennungs-Umschaltung entfällt | 196-Stände werden nicht migriert |
| Ortsgebundener Eis-Pendel | `f2a-eis-pendel.js`, `f2b-vollcharge.js` | [#297](https://github.com/tobiasfranziskus/Check/pull/297), [#298](https://github.com/tobiasfranziskus/Check/pull/298) | Ortsprüfung im Kern; Pendel als allgemeiner Auftrag für Eis **und** Erz, Spieler **und** NPC | Regeln übernommen, Missionsautomat und Phasen-Umschaltung nicht | 197/198-Stände werden nicht migriert |
| Bezahlte Miner-Flugminuten | offen in #298 („noch keine voll vorfinanzierten Flugpilotenlöhne“) | – | 1 ISK je Flugminute aus vorab gebundener Reserve | neu, Forschungsannahme E4 | Produktentscheidung offen |
| Frachter im Flugzustand | nicht vorhanden | – | Körper im Dock oder im bezahlten Transit | neu; freier Frachterflug bleibt offen (F3) | keins |
| Haushaltskonsum aller Lohnempfänger | nur zwei Piloten (`pilotWaterBuy`, ortslos) | #278 | `householdBuy` am Wohnort | neu, über das K1-Buch | Produktentscheidung offen |
| Ausschüttung, Ersatzrücklage, Verschleiß | nur als Rechnung in #245 | – | `dividendPay`, Buchwert je aktiver Minute | neu, Forschungsannahme | Produktentscheidung offen |
| Realer Hüllenersatz | `m_core_w5`, `m_core_w5_transfer`, `m_core_w5_replacement` | #273–#275 | vom Disponenten über dieselben Befehle genutzt | unverändert | gering |
| Referenzmodell C | Dokument | [#245](https://github.com/tobiasfranziskus/Check/pull/245) | Entwurfsziel; nachrechenbar | `tools/referenzmodell-c.mjs` | keins (keine Regel übernommen) |
| Ältere Kernkopien w5u–w5ab, Legacy-UI-Demos | Prototypen | #234, #267–#273, #186 ff. | bleiben als Nachweise; nicht weiterentwickeln | keine | keins |
| void-echoes | privates Archiv | [#291](https://github.com/tobiasfranziskus/Check/pull/291), [#299](https://github.com/tobiasfranziskus/Check/pull/299) | Referenz für Grafik und Bedienideen; Wirtschaft und Speicher werden nicht übernommen | keine Änderung am Repository | keins |

Nicht übernommen wurde der R32-/C1d-Stapel (#161–#265): er läuft auf der archivierten Hauptdatei mit anderen Rezepten und anderer Startverteilung und ist in [#243](https://github.com/tobiasfranziskus/Check/pull/243) als nicht tragfähig belegt.

## 4. Der kanonische Zustand

Ein einziges serialisierbares Objekt, vollständig im Hash enthalten:

| Bereich | Feld | Herkunft |
| --- | --- | --- |
| Zeit, Seed, Zufall | `tick`, `rng`, `flug.schritt` | Kern; Flugteilschritt 0–59 |
| Systeme, Stationen, Lager | `systems`, `stations[*].lager` | Kern |
| Eigentümer und Kassen | `owners[*].cash` einschließlich Treuhand- und Reservekonten | Kern + K1-Konten (Haushalte, Flugreserven) |
| Buchungsbelege | Stufenbücher `w3`, `w4`, `w5`, `w5n`, `w5ag`, `w5ac`, `w5ad`; `kanon.buch` und `kanon.netto` | Kern; K1-Buch |
| Waren | `ledger` (Anfang, gefördert, produziert, verbraucht, exportiert), `ships[*].ladung` | Kern |
| Schiffe | `ships[*]` mit Eigentümer, Klasse, Auftrag | Kern |
| Flug | `ships[*].flug` (Position, Geschwindigkeit, Kurs, Lage, Ziel) | Flugkern |
| Verschleiß | `kanon.verschleiss[schiff]` in aktiven Minuten | K1 |
| Aufträge und Verträge | `erzpilotVertraege`, Frachtaufträge, `kanon.pendel`, `kanon.flugdienst`, `kanon.rueckfracht` | Kern; K1 |
| Verhalten der NPC | `kanon.politik` | K1 |
| Diagnose | `kanon.engpass`, `ereignisse` | K1; Kern |

Vier Größen bleiben getrennt und stehen einzeln im Spielstand: **Speicherformat** 1 (Umschlag), **Datenmodell** 1 (`kanon.modell`), **Regel** 199, **Kernschema** 8. Eine Oberflächenversion gibt es im Zustand nicht.

### 4.1 Ein Tick

```
Minute:
  Flugplan an der Minutengrenze (Verkauf am Dock, neuer Auftrag, Abdocken)
  60 × Flugteilschritt aller Körper in ID-Reihenfolge      – entfällt bitgleich, wenn alle ruhen
  1 × Wirtschaftsschritt des Kerns                          – unverändert
  Körperabgleich (Transit folgt der Kernreise, neue Hüllen erhalten einen Körper)
  Flugminuten abrechnen · Verschleiß zählen · Rückfracht laden/entladen
  NPC-Disponent (Ersatz, Eisfracht, Wasserwerk, Haushaltskäufe, Ausschüttung)
  Flugplan
```

Es gibt keinen zweiten Zufallszustand und keine zweite Uhr. Die Abkürzung für ruhende Körper ist als Fixpunkteigenschaft getestet; der Weg über 86.400 Teilschritte und der Minutenweg liefern denselben Hash.

### 4.2 Befehle

Alle Oberflächen ändern die Welt nur über `welt.execute(state, befehl)`:

- **Flug** (`shipUndock`, `shipApproach`, `shipFlyTo`, `shipSteer`, `shipDock`): Flugkern; Abdocken bindet 40 ISK Flugreserve.
- **Wirtschaft** (`shipBuy`, `shipMine`, `shipWait`, `shipSellIce`, `shipFreight`, `shipFreightIce`, `stationWater`, `stationRefine`, `stationBuildShip`, `shipReposition`, …): unverändert der Kern.
- **K1** (`shipShuttle`, `shipShuttleStop`, `householdBuy`, `dividendPay`).

Spieler und NPC nutzen dieselben Befehle. Der NPC-Disponent ruft sie innerhalb des Ticks auf und prüft vorher mit den Angebotsfunktionen des Kerns.

### 4.3 Ortsbindung im Kern

`m_core_kanon` im Kern stellt zwei Prüfungen bereit, die nur im Profil 199 greifen:

- **Förderung nur im Feld.** `foerderung()` überspringt ein Schiff, dessen Körper nicht im Feld der Ware steht.
- **Abnahme nur am Dock.** Eisverkauf (`ankaufbar`) und Abrechnung eines Erzauftrags (`abschliessen`) verlangen das Dock der Abnahmestation. Die Regel195-Sofortabnahme von Eis im Feld ist abgeschaltet. Ein Storno im Raum gibt nur die Treuhand zurück; die Ware bleibt an Bord.

Der Test ruft den Kernbefehl direkt auf, an der K1-Schicht vorbei: der Fernverkauf wird auch dort abgelehnt.

### 4.4 Zwei Bücher, ein benannter Korrekturterm

Die Stufen-Audits des Kerns rekonstruieren jede Kasse aus Anfangskapital und eigenen Zählern. Neue Flüsse (Flugarbeit, Haushaltskäufe, Rückfracht, Ausschüttung) würden diese Rekonstruktionen brechen. K1 bucht sie deshalb ausschließlich als gepaarte Transfers mit Art, Zahler und Empfänger und führt je Konto den Netto-Abfluss `kanon.netto`. Jede Rekonstruktion im Kern lautet nun `Kasse + netto = Stufenformel`. Ohne K1 ist `netto` null und die Formel unverändert.

Das K1-Audit prüft zusätzlich: Summe aller `netto` ist null; `netto` stimmt je Konto mit den Buchsummen überein; Wasser hat Herkunft und Verbleib; jeder Fluglohn hat eine Minute; jede Flugreserve ist gedeckt; keine Emission, keine Senke.

## 5. Änderungen am gemeinsamen Kern

Der Kern erhielt 31 Änderungsstellen (98 neue, 37 ersetzte Zeilen), alle ohne Wirkung außerhalb von Profil 199:

1. Fabrik `createKanonWelt(kapital, ort)` und Regelkennung 199.
2. Modul `m_core_kanon` (Ortsprüfung, `netto`, Wasserabgang).
3. Ortsprüfung in `foerderung`, `erzpilot.abschliessen`, `w5n.ankaufbar`; keine Feld-Sofortabnahme.
4. `netto` an 20 Stellen der Konten-Rekonstruktionen und Kapitalprüfungen (W1-Vollkosten, W3, W4, W5, Überführung, Ersatz, Lohnkauf, Wasser, Pilotenlöhne).
5. Belegverdichtung der Pilotenlöhne: Summe je Vertrag statt ein Eintrag je Flugminute. Ohne sie wüchse der Spielstand um rund 1.440 Einträge je Spieltag.
6. Ein überführter Werftfrachter darf in K1 auch Eis fahren (das Überführungs-Audit kannte nur die Erzfracht).

**Verhaltensgleichheit von Regel195:** drei Hashes (Startwerte 1, 7, 42) wurden vor der Änderung aus dem unveränderten Kern berechnet und sind im Test festgeschrieben; dazu laufen alle 265 Bestandstests unverändert. Ein Bestandstest prüft eine Quellzeile wörtlich; diese Zeile blieb erhalten.

`index.html` und `aphros-void.html` wurden mit `node scripts/build-w5-singlefile.mjs --write` neu erzeugt, weil die Bestandstests Bytegleichheit mit der Kernquelle verlangen. Der Unterschied zu `main` besteht ausschließlich aus den genannten Stellen. Diese Dateien dürfen nicht ohne ausdrückliche Freigabe nach `main` gelangen.

## 6. Spielstandverwaltung

`prototypes/welt/welt-speicher.js`, getestet in `tests/welt-speicher.test.mjs` (flüchtige Ablage) und `tests/welt-browser.cjs` (IndexedDB in Chromium).

- **Umschlag:** Format, Speicherformat, Weltkennung, Revision, Datenmodell, Regel, Schema, Tick, Core-Hash, Zeitstempel, Herkunft, Prüfsumme, Zustand. Weltkennung und Zeitstempel entstehen in der Speicherhülle, nie im Kern.
- **Ladeprüfung:** Prüfsumme, dann lädt der Kern den Zustand, prüft alle Bilanzen und muss ihn bitgleich wieder ausgeben. Unbekannte Felder im Umschlag führen zur Ablehnung.
- **Plätze:** Autosave-Ring mit drei Ständen je Welt, benannte manuelle Plätze, beliebig viele Welten nebeneinander. Ein belegter Platz wird nur nach Bestätigung ersetzt; der alte Stand wandert vorher in die Sicherungen.
- **Sicherungen:** nur anfügen, höchstens 40, keine Löschfunktion im Code. Ist die Ablage voll, wird der Vorgang abgewiesen statt etwas zu verdrängen.
- **Atomar:** die Ablage wird in einer Transaktion mit Revisionsvergleich ausgetauscht. Ein zweiter Tab erhält einen Konflikt und wird gesperrt.
- **Beschädigte Ablage:** wird gesperrt, nicht repariert. Ein Rettungsabzug bleibt möglich.
- **Export/Import:** vollständige JSON-Datei; Import legt immer einen neuen Platz an und überschreibt nie.

### 6.1 Migrationsregeln

| Quelle | Verhalten |
| --- | --- |
| K1-Umschlag oder roher K1-Zustand | geprüft importiert |
| **Regel195** (Produkt) | normaler Import lehnt ab und bewahrt die Datei auf; **ausdrückliche Übernahme** möglich |
| Regel196/197/198 | abgelehnt mit Hinweis, Datei unverändert aufbewahrt; keine Migration (Forschungsstände, nur manuelles JSON) |
| Regel191–194 | abgelehnt, aufbewahrt |
| Regel14-Familie | abgelehnt, aufbewahrt; andere Welt (sieben Systeme, 55.000 ISK) – eine Umrechnung wäre eine Umdeutung |
| void-echoes und Fremdformate | abgelehnt, aufbewahrt |
| neueres Speicherformat | abgelehnt, Datei bleibt unverändert |

**Übernahme Regel195 → K1** (`Welt.ausRegel195`):

1. Der unveränderte Regel195-Kern lädt und prüft die Datei.
2. Additive Felder: Regelkennung 199, Flugkörper (im Dock oder im Transit, keine erfundene Position), leeres K1-Buch, neue Konten mit 0 ISK, Wasserlager Aldera 0. Pilotenlohn-Belege werden verdichtet, die Summen bleiben.
3. Kern- und K1-Audit des Ergebnisses.
4. Erhaltungsnachweis Feld für Feld: Kassen, Lager, Warenbuch, Schiffe, Verträge und Stufenbücher, Löhne, Tick, Zufallszustand, nächste Schiffsnummer.
5. Die Speicherhülle legt zuerst die Originaldatei als unveränderliche Sicherung ab, dann eine **neue** Welt.

Schlägt ein Schritt fehl, bleibt die Ablage unverändert. Die Datenbank des Hauptspiels wird nie geöffnet; der Nutzer exportiert dort selbst.

**Rückweg:** die gesicherte Originaldatei exportieren und im Hauptspiel importieren. Ein Rückrechnen eines weitergespielten K1-Standes nach Regel195 gibt es nicht, weil K1-Buchungen dort nicht darstellbar sind.

**Wirkung der Übernahme auf das Spielgefühl:** ein Miner mit Förderauftrag liegt danach im Dock und fördert erst wieder, wenn er zum Feld fliegt. Geld und Ware ändern sich dadurch nicht.

## 7. Was nach K1 aktiv bleibt

| | In diesem Draft | Nach Freigabe (Vorschlag) |
| --- | --- | --- |
| Produkt | Regel195, unverändert spielbar | K1 als einzige Welt; Regel195-Stände über die ausdrückliche Übernahme |
| Wirtschaftskern | 1 | 1 |
| Regelkennungen in Benutzung | 195 (Produkt), 199 (Forschung) | 1 |
| Flugkopplungen | `welt-kern.js`; F1/F2a/F2b als eingefrorene Nachweise | `welt-kern.js` |
| Speicherablagen in Benutzung | `aphros-void-regel195-v1`, `aphros-void-welt-v1` | `aphros-void-welt-v1`; ältere bleiben unberührt liegen |
| Einstiege mit Simulation | Produkt + K1-Seite + Prototypen | einer |

Die älteren Kernkopien und die Hüllen F1/F2a/F2b werden nicht gelöscht. Sie sollten nach einer Freigabe nicht weiterentwickelt und ihre PRs als ersetzt geschlossen werden – das entscheidet der Nutzer.

## 8. Grenzen dieses Stands

- **Kein freier Frachterflug.** Frachter liegen im Dock oder reisen 60 bezahlte Minuten im Transit; An- und Abflug im System sind nicht kinematisch simuliert (F3 des Flugentwurfs).
- **Nur das System Aldera hat Felder und eine Karte.** Nadir ist Station ohne Flugraum.
- **Rollen sind an Kontonamen gebunden.** Miner können nur `house` und `npc3` kaufen, Frachter nur `transport`. Ein anderer Konzern kann eine ausgefallene Rolle nicht übernehmen.
- **Verbrauchte Hüllen bleiben als stillgelegte Schiffe im Zustand.** Eine Verschrottung gibt es nicht.
- **Die K1-Oberfläche ist ein eigener Einstieg.** HQ, Karte und Stationsansicht des Produkts sind unverändert, aber noch nicht an K1 angeschlossen.
- **Abnahme:** Node 22 und Chromium in vier Touch-Größen wurden hier ausgeführt. WebKit lief hier nicht (nur im CI-Workflow vorgesehen). Echtes iPad Safari und NAS-Auslieferung sind nicht geprüft.

## 9. Ausgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| `node --test tests/*.test.mjs` (Node v22.23.4) | **318 von 318**, 0 Fehler, 0 übersprungen; davon 265 Bestand und 53 neu |
| `tests/welt-kern.test.mjs` | 15: Ortsbindung, Ablehnung ohne Nebenwirkung, Flugarbeit, Replay, Teilschritt-Gleichheit, Save/Load in elf Lagen, Manipulationsabwehr |
| `tests/welt-speicher.test.mjs` | 9: Umschlag, Plätze, Konflikt, Import/Export, Aufbewahrung, Übernahme, Sperre |
| `tests/welt-wirtschaft.test.mjs` | 26: Vertikalschnitt, 15 × 90 Tage, 5 × 365 Tage, 2 × 730 Tage, Gegenbeispiele |
| `tests/referenzmodell-c.test.mjs` | 3: Modellwerte, Spargrenzen, Abweichungen der ausgeführten Welt |
| `node scripts/build-w5-singlefile.mjs --check` | Einzeldatei entspricht der Kernquelle |
| `node tests/welt-browser.cjs` (Chromium) | 4 von 4 Größen: 1180×820, 1024×768, 820×1180, 390×844 |
| WebKit, iPad Safari, NAS | **nicht ausgeführt** |
