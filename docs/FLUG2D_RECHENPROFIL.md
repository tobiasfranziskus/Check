# Flug2D-F0 · Flugzeit- und Rechenprofil [ANALYSE]

**Stand:** 10.11.2026 · Basis: isolierter F0-Prototyp aus [Draft #290](https://github.com/tobiasfranziskus/Check/pull/290), nicht Regel195-main. Dies ist eine unabhängige Forschungs-/Optimierungsarbeit, keine Spielregeländerung oder Produktintegration.

## 1. Rechengrößen

F0 verwendet exakt **60 Flugteilschritte pro Core-Minute**. Damit werden bei einer vollständigen, nicht übersprungenen Langzeitsimulation benötigt:

| Testhorizont | Core-Minuten | Flugteilschritte |
| --- | ---: | ---: |
| 1 Tag | 1.440 | 86.400 |
| 90 Tage | 129.600 | **7.776.000** |
| 13 × 90 Tage | 1.684.800 | **101.088.000** |

Bei dem als Forschungswert vorgeschlagenen **20 Flugschritte/s bei Spieltempo 1×** dauern 90 Spieltage in echter Anzeigezeit 4,5 Tage und 13 Welten nacheinander 58,5 Tage. **Dies sind keine Testlaufzeiten**: Node-Simulationen müssen ohne Echtzeitbremse laufen.

## 2. Tatsächlich ausgeführte F0-Routen in der isolierten V8-Ausführung

Flug vom Aldera-Dock zu einem Feld und zurück, mit derselben `ausfuehren`-/`schritt`-Implementierung des F0; Start `angedockt`, 40 Schritte Abdocken, `shipApproach`, erstmals `imFeld` mit erlaubter Geschwindigkeit, anschließend `shipDock` bis vollständig `angedockt`. Nach jeder Route Flugaudit `ok`.

| Klasse | Ziel | Abdocken | Anflug Feld | Rückflug einschließlich Andocken | Gesamt Flugschritte | Zusatzzeit |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Miner | Erz | 40 | 559 | 608 | 1.207 | 20,1 min |
| Miner | Eis | 40 | 593 | 626 | 1.259 | 21,0 min |
| Frachter | Erz | 40 | 718 | 786 | 1.544 | 25,7 min |
| Frachter | Eis | 40 | 774 | 811 | 1.625 | 27,1 min |
| Jäger | Erz | 40 | 273 | 317 | 630 | 10,5 min |
| Jäger | Eis | 40 | 287 | 325 | 652 | 10,9 min |

Die Klassenvergleiche sind ausschließlich **Kinematikwerte**, keine Freigabe, dass Jäger künftig wirtschaftlich fördern oder Wasser liefern dürfen. Bei hypothetischen 50 Core-Minuten nutzbarer Förderarbeit pro Charge wird ein Miner-Erz-Rundlauf zu 70,1 Minuten Gesamtzeit (50 / 70,1167 ≈ 71,3 % der bisherigen Maximalfrequenz, **ca. 28,7 % weniger Durchsatz**). Für Eis ergibt sich 71,0 min und ~29,6 % weniger Durchsatz. **Es ist keine F1-Auswirkung**, denn F1 lässt wirtschaftliche Ortsbedingungen bewusst unangetastet; eine solche Durchsatzänderung gehört erst zu F2 und benötigt eigenständige Wirtschaftsreferenzen und Finanzierungsaudits.

Zusatzaudit: Nach erstmaligem `imFeld` wurden für den Miner in Erz und Eis jeweils 3.000 weitere Flugschritte mit weiter aktivem Anflug durchgerechnet. Beide Male blieb `imFeld` in allen 3.000 Schritten gültig; am Ende war `vx=vy=0`; Flugaudit grün. Diese F0-Berechnung ersetzt keine integrierte Förderprüfung.

## 3. Rechenengpass: Kursfindung

In [`prototypes/flug2d/flug-kern.js`](../prototypes/flug2d/flug-kern.js) berechnete `richtungZu` ursprünglich für jedes bewegte Schiff bei jedem Anflugschritt alle **256 Ganzzahl-Skalarprodukte**. Bei wiederkehrenden Zielwechseln dominiert dies das CPU-Profil. Angedockte Schiffe überspringen `bewegen` und sind erheblich billiger.

**Isolierter Vorher-Vergleich** (V8-Ausführung, 12.000 Flugschritte, Zielwechsel alle 400 Schritte, 4 bzw. 20 Miner, ohne Wirtschaft/Tick-/Browserarbeit):

| Szenario | Ursprüngliche F0-Suche | Neue Quadrantensuche | Gewinn |
| --- | ---: | ---: | ---: |
| 4 dauerhaft anfliegende Miner | 2.472 ms | 254 ms | **9,7×** |
| 20 dauerhaft anfliegende Miner | 12.719 ms | 1.231 ms | **~10,3×** |
| 20 angedockte Miner | 46 ms (ursprüngliche Messung) | nicht vergleichend gemessen | ohnehin günstig |

Die 4-Schiff-Werte wurden in einem gemeinsamen Vorher-/Nachher-Lauf gemessen. Der 20-Schiff-Vorher-Wert stammt aus einer unmittelbar vorherigen isolierten Messung; die Zeiten sind **Stichproben, keine stabilen Gerätebenchmarks**. Kein Node22-Gesamtlauf, kein echter Browser, keine iPad-Safari-Abnahme und kein 13×90-Tage-Leistungslauf wurde dafür ausgeführt.

Der neue unabhängige Aufruf `node tests/tools/flug2d-benchmark.cjs` liefert reproduzierbare **Szenarien** und berichtet Zeitwerte der jeweiligen Maschine, ohne hardwareabhängige CI-Erfolgsschwelle zu behaupten.

## 4. Mathematisch gleichbleibende Richtung

Die neue `richtungZu(dx,dy)` arbeitet nur im zum Vektor passenden 90°-Sektor (65 Tabellenrichtungen statt 256) und sucht dort das Maximum über Nachbarvergleiche binär. Der eingefrorene Viertelkreis hat **streng steigende** Verhältnisse `(cos(i)-cos(i+1))/(sin(i+1)-sin(i))` für `i=0..63`; das ist durch Kreuzprodukte und vorhandene Integer-Literale überprüfbar. Im passenden Quadranten ist das zu maximierende Skalarprodukt daher unimodal. Symmetrie vervollständigt die anderen drei Quadranten.

**Gleichstandsregel:** Die alte Suche nimmt die kleinste Kursnummer. Besonders wichtig ist die Naht zwischen 255 und 0: für `(dx,dy)=(402,-5)` sind beide Skalarprodukte gleich; der alte Algorithmus wählt 0. Der neue Algorithmus behandelt Kurs 256 als Alias zu 0 und bevorzugt ihn bei gleichem Maximalwert ausdrücklich. Auch andere symmetrische Gleichstände folgen der kleinsten Original-Kursnummer.

**Tatsächlich ausgeführte Verifikation in der isolierten V8-Ausführung:**

- 310.333 Vektoren aus feinmaschigem Integergitter, Grenzfällen und deterministischen Stichproben: **0 Abweichungen** zwischen ursprünglichem 256er-Scan und neuer Suche.
- Der Viertelkreis-Quotientenvergleich über alle 64 Nachbarschritte: **0 Monotonieverletzungen**.
- Nach identischen 12.000 Flugteilschritten mit 4 aktiv anfliegenden Schiffen und periodischem Zielwechsel: **exakt gleiches serialisiertes Flugszenario** (Vorher/Nachher), beide Flugaudits `ok`.

Die hinzugefügten Node-Tests in `tests/flug2d-richtung.test.mjs` prüfen diese Eigenschaften unabhängig gegen eine eigene Referenzimplementierung. **Node22-Gesamt-CI steht beim Erstellen dieser Datei noch aus** und ist getrennt zu berichten.

## 5. Weitere F1-Gates

1. Optimierung zunächst getrennt auf F0-Research-Branch prüfen; **keine Änderung an Regel195/main**.
2. Einmalige stabile Reihenfolge der Schiff-IDs statt wiederholtem `Object.keys(...).sort()` je Flugteilschritt prüfen, sofern sie sich im Profil tatsächlich bemerkbar macht. Bei dynamischem Hinzufügen/Löschen strikt dieselbe Sortierreihenfolge bewahren.
3. 13 × 90 wirtschaftlich unterschiedliche Welten **im echten integrierten Forschungsprofil**, feste Seeds, Save/Load mitten im Flug, Geld-/Warenaudits und Hashkontinuität. Keine Zeitwerte aus synthetischen Benchmarks als wirtschaftliche Testergebnisse ausgeben.
4. Alte Wirtschaft/Ortsbedingungen zunächst unangetastet halten. F2-Ortsbindung würde die Minerproduktion im Beispiel ~29 % bremsen; Nachfrage, Löhne, Finanzierung und Insolvenzen dann gesondert testen.
5. Echte iPad-Safari- und NAS-Abnahme, insbesondere bei vielen gleichzeitig bewegten NPC-Schiffen und Touch, bleibt offen.

**Status:** [ANALYSE/DRAFT]. Die Arbeit läuft parallel zum separaten Codex-Auftrag G1 (grafische F0-Übernahme); keine Dateien aus `void-echoes` nötig, kein Merge, kein Deployment und keine geänderten Spielstände.
