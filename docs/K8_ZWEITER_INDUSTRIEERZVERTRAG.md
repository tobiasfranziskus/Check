# K8 – zweite Industrie-Erzlieferung aus vorhandenem Eigentum und Kapital

**[DRAFT/ANALYSE · 13.11.2026]** [PR #323](https://github.com/tobiasfranziskus/Check/pull/323) auf [K7-Quellschutz #322](https://github.com/tobiasfranziskus/Check/pull/322), dessen fünf CI-Workflows auf Codehead `1a415a7f` erfolgreich abgeschlossen wurden. Basis des Vertrags ist [#315](https://github.com/tobiasfranziskus/Check/pull/315), Forschungsregel 200/Schema 8. **Kein Merge nach main, keine Änderung produktiver Regeln, Spielstände, `index.html` oder `aphros-void.html`.**

## Frage und tatsächlich ausgeführtes Testdesign

Ein einzelner bezahlter W1–W5-Industrieauftrag garantiert keine zweite industrielle Erzlieferung. `tests/k8-zweiter-industrieerz-vertrag.test.mjs` beginnt für **Seed 42 und Seed 7** mit dem echten K4/K5-Krisensave Tick 21612. Eine erste 50-Erz-Bestellung wird von den originalen Firmen signiert, die ursprünglich vorhandenen 740 ISK Kauf-/Frachtetat, 120 ISK Crew und 530 ISK Werftbudget werden real vorfinanziert. Danach folgen echter W1-Feldabbau, Dockverkauf, Original-W3-Rundfracht, W4-Material, W5-Schiffbau, Original-`shipBuy` **für je 750 ISK** und die vollständig bezahlte Überführung.

Die gemessenen Alternativen verwenden ausschließlich vorhandene Preise, Kassen, W5-Lagerhüllen und Eigentümerbefehle:

- Unveränderte NPC-Automatik mit einem rechtmäßig gekauften Ersatzfrachter.
- Freiwillige Eigentümerdisposition bei einem Kauf.
- Bereits **vor** der ersten K7-Kette mittels Original-`politikSetzen` gesetztes `ersatzkauf:false` und eigenständige Disposition mit **1, 2, 3, 4 oder 5** bezahlten Frachterkäufen. Das ursprüngliche unabhängige Werft-/Minerbauprogramm darf weiterhin vorhandene 530 ISK-Kosten verursachen.

Wichtig: Die erste diagnostische Testversion prüfte versehentlich die letzte historische `w5.schiffIds`-ID statt den realen noch unverkauften W5-Lagerbestand. Daher wurde zunächst irrtümlich eine Werftkasse von 0 ISK ohne tatsächlichen Neubaukauf diagnostiziert. Dieser **Testfehler wurde korrigiert**: Die jetzige Fassung prüft `w5.fertig − w5.verkauft`, den wirklichen Lagerbestand, den vollständigen Kauf, Eigentumswechsel und die bezahlte Überführung. **Nur die abschließenden Zahlen der korrigierten Fassung sind maßgeblich.**

## [TEST/ANALYSE] Wiederholungsgrenze der zwei Krisenseeds

[Ausgeführter K8-Job in CI #43387860979](https://github.com/tobiasfranziskus/Check/actions/runs/43387860979), Codehead `729b4933963877fe4d31187e193304ca3d42420f`: **2/2 Node22-Testfälle bestanden** (pro Seed sieben wirtschaftliche Varianten; insgesamt **14 untersuchte Pfade**), 0 fehlgeschlagen. `K8_FOLGEVERTRAG` enthält für jeden Pfad tatsächliche Konten, Käuferreservierung, Lieferaudit, Hash und Save-Replay. Die K1-/Produkt-Gesamt-Workflows desselben Heads sind separat nach Abschluss zu beurteilen.

| Variante pro Seed | Nach ursprünglichen Käufen verfügbare Werft-ISK | Zweite W3-Erzlieferung | Ergebnis |
| --- | ---: | ---: | --- |
| NPC-Automatik, 1 Frachter | 220 | 0 | Werft kann erneute 530 ISK nicht signieren |
| Eigentümerdisposition, 1 Frachter | 220 | 0 | dieselbe Werftlücke |
| Ersatzkauf pausiert, 1 Frachter | 220 | 0 | Werftlücke unverändert |
| Ersatzkauf pausiert, 2 Frachter | 440 | 0 | 90 ISK zur 530er-Verpflichtung fehlen |
| **Ersatzkauf pausiert, 3 Frachter** | **660** | **50** | **zweiter realer 50-Erz-Transport abgeschlossen** |
| Ersatzkauf pausiert, 4 Frachter | 880 | 50 | abgeschlossen |
| Ersatzkauf pausiert, 5 Frachter | 1100 | 50 | abgeschlossen |

**Erklärung:** Ein echter W5-Frachterkauf zahlt 750 ISK an `werft_extern`. In der getesteten automatischen Wiederbeschaffung werden jeweils weitere reale 530 ISK für Schiff-/Werftarbeit gebunden; damit bleiben in diesen Durchläufen **220 ISK je vollständig bezahltem Kauf** als frei verfügbare Werftliquidität. Zwei Käufe (440 ISK) reichen nicht für die erneute **530-ISK**-Werftzusage; drei Käufe (660 ISK) schon. **Das ist eine szenariospezifische Liquiditätsgrenze bei vorhandenen Lagerhüllen, kein Versprechen dauerhaft profitabler Schiffproduktion.**

Für beide Seeds belegt der Dreikauf-Pfad bis Tick 22434: **zweite echte 50-Erz-Förderung, einmalige 740-ISK-Käufertreuhand, W3-Auslieferung samt bezahltem Rückflug, 33.000 ISK Weltgeld, Mint/Burn 0, Save/Load und deterministischer Hash-Replay**. Die zweite Werftbindung ist gedeckt; **ein zweiter neuer W5-Frachter aus dieser zweiten Erzcharge wurde damit noch nicht fertiggestellt**. Keine Gratisware, kein Teleport, keine künstlichen Exportzahlungen (Exportkonto 0).

### Konsequenzen / nächstes Gate

1. Die Diagnose spricht für **rechtmäßig gesteuerte Liquiditätsprioritäten** statt einer neuen Geldemission. Ein vorschneller NPC-Miner-/Frachterersatz bindet Geld, das für einen Industrie-Erzvertrag benötigt wird. Automatische Umplanungen wären jedoch eine **neue Produktentscheidung**, nicht aus diesem Test freigegeben.
2. Der nächste isolierte Nachweis soll die **zweite** physische W4-Raffineriekette und **zweiten** W5-Bau aus vorhandener K7-Treuhand prüfen; dazu echte Lagergrenzen, Besitzerrechte, gezahlte Löhne und Überführung. Danach erst eine mögliche dritte K7-Lieferung.
3. Für dauerhafte W6-Eignung fehlen nach wie vor 13 ökonomisch verschiedene 90-Tage-Folgeindustrien mit aktiven Wiederholungsverträgen, 365-/730-Tage-Krisen, dauerhaft finanzierte Abnahme und reale Safari-/NAS-Abnahme. Der Test ist **kein** W6- oder Main-Freigabenachweis.

**Abnahmeregel:** Alte Research- und Rule195-Saves unverändert; Codehead und Testlogs separat nennen. Eine erfolgreiche CI allein ersetzt weder wirtschaftliche Nachhaltigkeit noch Nutzertest oder Releaseentscheidung.
