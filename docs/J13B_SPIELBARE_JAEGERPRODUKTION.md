# J13b – spielbare Eigenbeiträge und genaue Produktionssperre

**15.11.2026 · [DRAFT / begrenzter spielbarer Teil]** Basis: aktueller `main 52d0fe60` (J13a, #391). Kein Merge oder Deployment durch Codex. Roadmap/Projektstatus wurden gelesen; gemäß ausdrücklicher Dateigrenze bleiben sie unverändert. Dieser Bericht ist der Statusnachtrag für die unabhängige Integration.

## Ergebnis und Grenze

Im regulären Karriere-Tab **Jägerprojekt** können Spieler die bereits validierten eigenen Aufträge jetzt unmittelbar ausführen. Jeder Klick verwendet erneut `session.angebote()` und `session.ausfuehren(id)`; die bestehende J8-Transaktion prüft Finanzierung, Originalbefehle, Audit und Save/Load vor der Zustandsübernahme. Dieselben Autosave-, Export-, Kauf- und Cockpitwege bleiben erhalten. Keine zusätzlichen Core-Befehle oder Befehlsrechte.

- Originale Käufe von Aldera-Miner/Frachter, Nadir-Frachter und vorgemerkt gebautem Nadir-Miner. Der bislang in P1 herausgefilterte originale Nadir-Frachterkauf wird auch unter „Aufträge“ sichtbar.
- Eigene Eisförderung, ordentliches Pendelbeenden, finanzierte F4/F6-Fracht.
- Eigene J2b-Förderung und Verkauf, sobald ein rechtmäßig gekaufter lokaler Nadir-K2-Miner existiert. Ein Aldera-Miner erfüllt dieses Gate nicht.
- Eigene Siliziumverkäufe werden ausschließlich aus Originalbelegen gelesen; fremde Verkäufe sind separat gezählt. Es gibt keinen gespeicherten UI-Projektfortschritt.
- K7/W4/J3/J4 zeigen die wirklich vom Core auf temporären Save/Load-Klonen zurückgewiesenen `house`-Aufträge samt zuständigen Eigentümern. Es gibt dafür keinen Befehlsbutton.

**Keine erste Jägerhülle aus einer frischen Karriere produziert.** Die neue Oberfläche macht vorhandene Spielerbeiträge ausführbar. Eis/F4 sind Wasserwirtschaft und kein Ersatz für Erz, Material oder Bauteile. Sie werden nicht als Jägerfertigungsfortschritt gezählt.

## Reproduzierbarer regulärer Spielpfad

1. Root → Neue Karriere → Prolog → Karriere beginnen; kein Dateiimport. Start: `house` 3.000 ISK, gesamte Welt 33.000 ISK.
2. Tab Jägerprojekt → Aldera-Frachter für 750 ISK und Aldera-Miner für 600 ISK kaufen (in dieser Reihenfolge für die Referenz). `house` danach 1.650 ISK.
3. Eigene Eisförderung starten, zweimal **+60 Minuten**. Reales Feld wird abgebaut, Waren und Arbeit gebucht.
4. F4-Eisfracht mit dem eigenen Frachter starten. 50 echtes Eis werden verladen; 120 ISK Crewlohn und 240 ISK Frachtentgelt sind gebunden. Optional sofort sichern und neu laden.
5. Zweimal **+60 Minuten**. F4-Rundfracht abgeschlossen, Lohn 120 / Entgelt 240 ISK. Original-J11-Referenzhash unverändert **`e4514490aedc13bd`**, Weltgeld 33.000, Mint/Burn 0. Eigene Flotte und Cockpit über den bestehenden Flottentab.
6. Nadir-K2-Kauf und Jägerkauf bleiben gesperrt, solange keine rechtmäßig produzierte und passend vorgemerkte Hülle vorhanden ist. Kein freier Nadir-Miner und kein Siliziumauftrag aus dem Aldera-Miner.

Dieser Pfad ist ein vollständig finanzierter spielbarer Versorgungsweg, **kein reproduzierbarer Jägerbau**.

## Exakte früheste Sperre und Finanzierungsbefund

| Stufe | Vorhandener Originalbefehl | Recht / Befund |
| --- | --- | --- |
| K7 | `industrialOreOffer/AcceptMine/AcceptFreight/AcceptYard/Commit` | Angebot/Commit nur Nadir; Unterschriften getrennt `npc3`, `transport`, `werft_extern`. Die K7-Schiffsauswahl ist auf NPC3-Miner und Transport-Frachter beschränkt. Ein eigener Miner ersetzt diese Parteien nicht. |
| W4 | `stationRefine` | Nadir-Materialeigentümer; keine house-Prokura. |
| J2b | `siliconMineStart`, `siliconSell` | house zulässig, aber ausschließlich mit wirklich lokal gekaufter Nadir-K2-Hülle; K2-Werft und Vormerkung muss das Werftunternehmen ausführen. |
| J3 | `stationBuildParts` | Nur `st_nadir`; 2 Material + 1 Silizium + 8 ISK vorfinanzierter Lohn pro Teil. |
| J4 | `stationBuildFighter` | Nur `st_nadir`; 8 Bauteile + 4 Material + 32 ISK Lohn. |
| Kauf | `shipBuy` | house, reale fertige Nadir-Hülle und 900 eigene ISK; kein Kauf ohne Hülle. |

Der erste Karriereblocker ist **fehlendes Firmenbefehlsrecht**, nicht pauschal ein aktuelles 500-ISK-Defizit. Frischer Seed42: Aldera besitzt 1.000 ISK bei 500 ISK erforderlichem K7-Erzankauf. Die UI berechnet die jeweilige Lücke aus diesen aktuellen Werten; sie behauptet nicht, dass jeder Start bereits 500 ISK unterfinanziert sei.

Der historische zweite K7-Vertrag aus J10d (#376) scheitert bei **0/500 ISK Aldera**; dieser bestehende Befund wurde nicht durch eine neue Spielerfinanzierung gelöst. J13b reproduziert diesen separaten Forschungsstand nicht als Karrierepfad. Weder die vier unabhängigen Unterschriften noch ein Aldera-Kapitalvertrag sind als Spielerrecht vorhanden.

Geprüfte Alternativen: `householdBuy` mit `owner:'house'` wird als „kein eingetragener Haushalt“ abgewiesen. Spieler dürfen nicht stattdessen Piloten/Anteilseigner unterschreiben. Ein einfacher `shipMine`-Befehl ist kein Ersatz für den K7-Vertrag: im geprüften Karriereversuch verbleibt der house-Miner nach 300 Minuten am Dock ohne Erz; nur der NPC-Pendel erhält einen Erzvertrag. Deshalb kein scheinbar produktiver Erzbutton. Die bestehende Wasserwirtschaft kann reale Erlöse erzeugen, autorisiert aber keine fremden Industrieaufträge und belegt keine vollständige zweite K7-Finanzierung.

## Prüfungen und Kompatibilität

Neue `tests/j13b-spielbare-produktion.test.mjs`: tatsächliche Angebote, vier fremde Produktionsrechte, atomare Signaturablehnung, unterfinanzierter Miner-Kauf, realer Eis/F4-Pfad, unabhängige Summen für Geld und alle Ledger-Waren, Frachter-Kaufbelege und Eigentum, Save/Load im Transit und deterministischer Replay gegen den unveränderten Originalhash. Negative Kapitalmanipulation ausschließlich in einer verworfenen Testkopie, niemals in gültiger Karriere.

Erweiterter bestehender P1-Browsertest: direkter Miner-Kauf aus J13b samt 48px-Touchfläche, bestehendes Cockpit/Export/Resume, zusätzlich vollständiger J13b-Projekt-F4-Pfad mit Transit-Resume, tatsächlicher Referenz und gesperrtem Jäger-/K2-Kauf in Chromium und WebKit je vier Größen (1180×820, 1024×768, 820×1180, 390×844).

Lokale Browserinstallation scheiterte an der Netzfreigabe (`403 Domain forbidden` für Playwright-Downloadhosts). Browser-Abnahme wird über den vorhandenen P1-CI-Workflow auf dem Draft-PR ausgeführt; ein nicht ausgeführter Check zählt nicht als bestanden. Endgültige Ergebnisse werden nachgetragen.

Unverändert: `prototypes/welt/**`, `prototypes/flug2d/**`, W6-Forschung, Original-Core-/Preis-/Rezept-/Startregeln, Original-Referenzhashes, Schema8/Regel204, alte Speicherplätze, Root und NAS-Einzeldatei. Echte iPad-Safari-/NAS-Geräteabnahme offen. Keine 13×90-/365-/730-Tage-W6-Nachhaltigkeit behauptet.
