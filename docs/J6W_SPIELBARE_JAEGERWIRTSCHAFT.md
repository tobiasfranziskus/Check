# J6-W – ausführbare Jägerwirtschaftsschnittstelle

**[DRAFT / API, nicht integriert · [PR #357](https://github.com/tobiasfranziskus/Check/pull/357)]** Branch `codex/j6w-spielbare-jaegerwirtschaft`, Basis aktueller `main 399a36ab38c1f6bf4b1b0d40f6a1254d4a52d434`, am 15.11.2026 per Fetch geprüft. AGENTS, Roadmap, Projektstatus, J5-W-Bericht, J5-W-Tests und Original-Regel204-Wirtschafts-/Flugpfad geprüft. #351 und #354 sind integriert; der offene #356 bearbeitet Flottenwechsel. Historische Forschungs-PRs bleiben Quellen, keine zusätzlich übernommenen Abhängigkeiten. Kein Merge, Deployment, Migration oder Schreiben eines Spielstands.

## Ergebnis

`prototypes/j6w/wirtschaft.js` ist eine browserfähige UMD-API (`J6wWirtschaft`) ohne DOM, Node-Abhängigkeit, eigenes Wirtschaftsmodell oder Produktionsautomatik. Sie erschließt vorhandene Core-Befehle über strenge Auftragsformen, konkrete Angebote und Eigentümerkontexte. Der Nutzer benötigt künftig kein Entwicklungstestskript für diese Aktionen. Die sichtbaren Bedienelemente sind ausdrücklich Aufgabe der späteren Integration.

Eine einzige Ergänzung am Original-Core exportiert die bereits eingefrorene K7-Preistabelle als `welt.industriePreise`. Keine neue Preisformel im Adapter; kein Zustandsfeld, Regelwechsel, Geld, Ware oder Schiff hinzugefügt. Alle Wirkungen stammen aus `welt.execute`; alle Minuten weiterhin aus der vorhandenen Weltuhr.

## API und ausführbare Beispielbefehle

Im bestehenden Regel204-Browser nach `welt-kern.js` zusätzlich `../j6w/wirtschaft.js` laden. `welt` und `zustand` sind dieselben bereits geladenen Objekte der Jägersitzung:

```js
const spieler = J6wWirtschaft.erstellen(welt, 'house');
const nadir = J6wWirtschaft.erstellen(welt, 'st_nadir');
const lage = spieler.lage(zustand);
const angebote = spieler.angebote(zustand);
const foerderung = {type:'siliconMineStart', schiff:'sh022'};
spieler.angebot(zustand, foerderung);       // Probe ohne Zustandsänderung
spieler.ausfuehren(zustand, foerderung);    // Originalbefehl, echte Reserven
spieler.ausfuehren(zustand, {type:'shipUndock', schiff:'sh022'});
// Vorhandene Weltuhr weiterlaufen lassen; nach abgeschlossenem Abdocken:
spieler.ausfuehren(zustand, {type:'shipFlyTo', schiff:'sh022', x:720000, y:-480000});
// Nach vollständiger Förderung physisch zurück:
spieler.ausfuehren(zustand, {type:'shipDock', schiff:'sh022', station:'st_nadir'});
// Erst nach wirklicher Dockankunft:
spieler.ausfuehren(zustand, {type:'siliconSell', schiff:'sh022'});
// Jeweils erst bei vorhandenen Inputs, Geld und freier Anlage:
nadir.ausfuehren(zustand, {type:'stationRefine', station:'st_nadir'});
nadir.ausfuehren(zustand, {type:'stationBuildParts', station:'st_nadir'});
nadir.ausfuehren(zustand, {type:'stationBuildFighter', station:'st_nadir'});
// Erst nach 32 originalen Wirtschaftsminuten und fertigem Bestand:
spieler.ausfuehren(zustand, {type:'shipBuy', station:'st_nadir', klasse:'jaeger'});
```

Diese Beispiele sind bewusste Einzelaktionen mit Vorbedingungen, kein blind hintereinander auszuführender Gesamtauftrag. `angebote` liefert die jetzt konkreten Kandidaten einschließlich gesperrter Aktionen und Originalgrund. Für Ausführung das Feld `anfrage` verwenden, niemals das gesamte Angebotsobjekt. `angebot` enthält `hash`, `tick`, validierten Originalbefehl und aktuelle tatsächliche `zahlungen` mit Vorher/Nachher/Delta. Bei fehlender Deckung enthält es die Core-Sperre; es erfindet keine Zahlungszusage. Ausführung prüft die aktuelle Lage erneut, ignoriert keine inzwischen fehlende Kasse und übernimmt keine Angebotsreservierung.

`lage` liefert abgetrennte Kopien der realen Konten, Stationsbestände/Eigentümer, Schiffe/Ladungen und laufenden Förder-, Fracht-, Raffinerie-, Bauteil-, Werft- und Flugaufträge. Arbeitsdauer, Lohn, Rezeptmengen und Feldvorrat kommen aus Originalregeln bzw. Originalaufträgen (`gearbeitet`, `gefoerdert`). Konten zeigen die tatsächliche Kasse; separat gebuchte Treuhand ist kein zusätzlich verfügbares Eigentümergeld. `finanzierung` zeigt die Original-K7-Anforderungen, etwa Werft 530 ISK neben der echten Werftkasse 290 ISK.

Unterstützte Aufträge: `siliconMineStart`, `siliconSell`, `shipUndock`, `shipDock`, `shipFlyTo`, `shipBuy` (Jäger/Frachter), `stationRefine`, `stationBuildParts`, `stationBuildFighter` und alle sieben bestehenden `industrialOre*`-Vertragsaktionen. Unbekannte Typen, Zusatzfelder, übergebene `owner`, nichtganzzahlige Koordinaten und unzulässige Klassen werden abgewiesen. Ungültige Weltzustände gehen durch den vollständigen Original-Loader und dürfen keine Buchung auslösen.

## Rechte und Finanzierungskette

Ein Kontext setzt genau einen festen Akteur. `house` darf fremde Schiffe, Nadir-Material oder Werftkassen nicht durch ein `owner`-Feld übernehmen. Die Kontextanlage ist eine Vertrauensgrenze der einbettenden Anwendung, keine Mehrbenutzer-Authentifizierung: Ein Browsernutzer mit direktem Zugriff auf den Weltkern konnte schon vorher andere Core-Eigentümer angeben. Die API führt keine neuen Verfügungsrechte ein.

Insbesondere darf `house` weiterhin keinen Nadir-Werftauftrag erteilen. Ein späterer Konzernworkflow muss Produktion als rechtmäßige Stationsentscheidung und K7-Zustimmungen als getrennte Firmenentscheidungen behandeln. Keine universelle Spieler-Schaltfläche darf heimlich alle NPC-Unterschriften setzen. Ein neuer Haus→Nadir-Vorbestellvertrag wäre eine zusätzliche Produktentscheidung und ist hier nicht erfunden worden.

Der vollständige neue API-Test führt ab dem unveränderten J5-W-Originalsave aus:

1. Eigener Nadir-Miner `sh022`: 8 Silizium, 64 Förderminuten, 128 ISK Arbeit; 192 ISK wirklicher Nadir-Ankauf, zusätzlich echter Flugdienst.
2. Spedition kauft vorhandene Nadir-Frachterhülle für 750 ISK (`sh024`); Werftkasse erhält den tatsächlichen Verkaufserlös.
3. Nadir bietet `industrialOreOffer` mit `sh008`/`sh020` an. `npc3`, `transport`, `werft_extern` unterschreiben jeweils ihre bestehende Aktion, Nadir bestätigt. 740 ISK Käuferetat, 120 ISK separate Frachtarbeit, 530 ISK Werftreserve; 50 echtes Erz wird gefördert und transportiert.
4. Eine Raffineriecharge und der vertraglich verpflichtende Frachterbau erfüllen den K7-Vertrag. Vier weitere Raffineriechargen liefern die 20 Jägermaterialien; 8 Bauteilaufträge kosten weitere 64 ISK Arbeit.
5. 8 Bauteile + 4 Material und 32 ISK vorfinanzierter Werftlohn ergeben erst nach 32 Originalminuten die zweite Hülle. Echter 900-ISK-Kauf an Nadir erzeugt `house/sh025`.

API-Pfad und direkter Originalpfad enden identisch bei Tick **22806**, `house` **678**, Nadir **5324 ISK**. Hash Seed42 **3630b67418d15855**, RNG-Fortsetzung7 **725323b51687165a**. Weltgeld **33.000**, Mint/Burn **0**. Seed7 ist ausschließlich die RNG-Variation derselben Seed42-Vorgeschichte.

Negative Gegenproben: fehlende Bauteile/Material/Erz; Werftunterschrift bei 290/530 ISK; unbekanntes bzw. ungeeignetes Transportschiff; fremdes Produktionsrecht; Kauf vor Werftabschluss; erschöpftes Siliziumfeld. Besonders: ein zunächst gültiges 900-ISK-Jägerangebot verfällt wirtschaftlich nach einem anderen, regulären 750-ISK-Frachterkauf. Dann besitzt `house` nur 828 ISK und derselbe Kauf scheitert atomar am Original-Geldgate. Kein Rettungstransfer, keine erfundenen Käufer.

## Prüfungen

Pro Minute vollständiger Core-Audit und unabhängig summierte Geldmenge, physische Waren gegen Ledger, vorhandene Eigentümerkonten und Jägeranzahl gegen Kaufbelege. Exakte zusätzliche Arbeitszahlungen und Original-Kaufpreis geprüft. Deterministisches Doppelreplay, Vergleich mit direktem Core, Save/Load an Befehls-/Arbeitsgrenzen. Importangriffe gegen Ware, Silizium, Fracht, Lohn, Zeit, Gratispreis, Eigentum, Schiffzahl, geldmengenneutrale illegale Umbuchung, Mint und Schema; defektes JSON. Abgetrennte Lageprojektionen und Angebote verändern den Originalsave nicht.

Tatsächlich ausgeführte Prüfungen (Node **v22.23.4**):

- Vorprüfung mit dem Repository-Befehl: **45/45 Testdateien**, 0 Fehler/Skips/Abbrüche, 194197 ms.
- Erster Gesamtlauf mit neuer API: **46/46 Testdateien**, 0 Fehler/Skips/Abbrüche, 416999 ms; vor abschließender Katalogergänzung, wird nicht als Endstand ausgegeben.

- Direkter API-Fokus `node tests/j6w-spielbare-jaegerwirtschaft.test.mjs`: **6/6 Einzeltests**, 0 Fehler/Skips/Abbrüche, 61982 ms im abschließenden parallelen Prüfzeitraum.
- `J6W_BROWSER=chromium node prototypes/j6w/browser-pruefung.cjs`: **erfolgreich**, echter Chromium über lokalen HTTP-Server, browserseitiger UMD-Import aller Originalmodule, 47 Angebote, neutraler Quellhash, echte Förderreservierung, Originalaudit und Save/Load; 33.000 ISK, Mint/Burn 0. Keine UI-/Touch-Abnahme daraus ableiten.
- Versuch mit beiden Browserengines: Chromium erfolgreich; **WebKit nicht gestartet**, weil `webkit-2336/pw_run.sh` nicht installiert ist. Dieser kombinierte Aufruf endete deshalb mit Fehler. Ein erster sandboxierter HTTP-Aufruf konnte wegen `listen EPERM` nicht starten; anschließend autorisierter lokaler Browserlauf erfolgreich. Keine echte iPad-Safari-/NAS-Abnahme.
- Ergänzender Gesamtlauf `node --test --experimental-test-isolation=none tests/*.test.mjs`: **252/252 Einzeltests**, 0 Fehler/Skips/Abbrüche, 392678 ms. Dieser Lauf startete vor der abschließenden Katalogergänzung um den Nadir-Frachterkauf; keine Behauptung eines zweiten 252-Tests-Laufs auf dem Endstand.
- Abschließender Repository-Prüfbefehl `node --test tests/*.test.mjs` auf dem endgültigen API-/Katalogstand: **46/46 Testdateien bestanden**, 0 Fehler, 0 Skips, 0 Abbrüche, 345311 ms. Der Standardrunner zählt hier Dateisuiten; die 252 inneren Tests werden ausschließlich dem gesonderten oben bezeichneten Lauf zugerechnet.

 `git diff --check` erfolgreich. Remote-main vor PR-Erstellung erneut geprüft: weiterhin `399a36ab`. GitHub-Actions auf dem neuen PR-Head werden hier nicht als bestanden behauptet.

Frühere fehlgeschlagene Testfassungen (doppelter Testvariablenname, fehlendes Stationsfeld beim Dockbefehl) wurden korrigiert; sie gelten nicht als bestandene Prüfungen. Ein Aufruf mit dem von Node22 nicht unterstützten Flag `--test-isolation=none` startete keine Tests; korrekter Zusatzlauf verwendet `--experimental-test-isolation=none`.

Keine neuen Wirtschaftsszenarien: Wirtschaftsregeln unverändert. Historische 13×90-Tage-Prüfungen der Gesamtregression sind keine Nachhaltigkeitsabnahme dieser endlichen Regel204-Folgeproduktion.

## Dateien und Integrationsempfehlung an ChatGPT

- `prototypes/j6w/wirtschaft.js`: eigenständige API.
- `prototypes/welt/welt-kern.js`: ausschließlich lesender Export vorhandener K7-Preise.
- `tests/j6w-spielbare-jaegerwirtschaft.test.mjs`: API-Gesamtkette und negative Gegenversuche.
- `prototypes/j6w/browser-pruefung.cjs`: optionaler HTTP-/UMD-Modultest (Playwright als vorhandenes Entwicklungswerkzeug).
- Dieser Bericht.

**Schnittstellenanforderung außerhalb der erlaubten Dateigrenzen:** ChatGPT/Faible laden das neue Script in der vorhandenen Jägersitzung und binden `angebote`, `lage`, `ausfuehren` an die Konzernansicht an. Vor Ausführung Flug/Training wie bisher pausieren; den bestehenden autoritativen Minutentakt benutzen, nach Rückmeldung Ansicht aktualisieren. Keine `advance`-Schleife, neue Startwelt, stiller Akteurswechsel oder Save-Migration im Klickhandler. DOM-Ausgabe wie bisher escapen. Bestehende Import-/Exporthülle unverändert nutzen; neue Kontexte nach Sitzungswechsel mit der aktuellen Weltinstanz erzeugen. Angebotsermittlung nur bei Bedarf, nicht in jedem Flugframe: vollständiges Save-Audit ist bewusst gründlich.

ROADMAP/PROJEKTSTATUS wegen ausdrücklicher paralleler Dateigrenzen nicht verändert. Nach Integration dort gezielt **[MAIN]** eintragen; bis dahin **[DRAFT/API]** mit Verweis auf diesen Bericht. Keine Änderungen an J4c-App/HTML/Konzernansicht/Flottenwechsel, Flugkern, Root-HTML, Archiven oder vorhandenen Spielständen.

Noch offen: sichtbare Bedienelemente und deren Touch-/Trainingsintegration, gewünschter Spieler-Vorbestellvertrag über fremde Firmenrechte, nachhaltige weitere Rohstoffversorgung nach Erschöpfung des Felds, autonome Rentabilität. Kein iPad-Safari-/NAS-Gerätetest und keine Behauptung eines vollständigen UI-Produktionsworkflows.
