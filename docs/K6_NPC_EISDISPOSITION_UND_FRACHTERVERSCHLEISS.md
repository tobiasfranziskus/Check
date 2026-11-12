# K6 – Vorhandene NPC-Miner statt Rettungswirtschaft: Reichweite und nächster realer Engpass

**[DRAFT / ANALYSE · 12.11.2026]** [PR #313](https://github.com/tobiasfranziskus/Check/pull/313) auf [K5 #309](https://github.com/tobiasfranziskus/Check/pull/309) und [K4 #308](https://github.com/tobiasfranziskus/Check/pull/308). Kein Merge nach `main`, keine Veröffentlichung, keine neue Regel, kein kostenloses Schiff oder fremdfinanzierte Rettung.

## Frage und Versuchsanordnung

K5 belegte bei Tick21612 **vier tatsächlich verfügbare, ungenutzte Erzminer** des NPC-Konzerns `npc3`, nachdem die externe Erz-Kaufkraft erschöpft war und dem Spieler die Eisminer ausgingen. Ist eine finanzierte andere Nutzung dieser **vorhandenen** Schiffe ökonomisch relevant und wie weit reicht sie, wenn auch Käufer, Spedition, Rohstoff- und Ersatzwirtschaft dieselben bleiben?

K6 verwendet denselben geprüften, von K4 erzeugten S12-Save bei **Tick21612** für **Seed 42 und 7**. Der Test setzt nur bereits gültige Befehle des tatsächlichen Eigentümers ab:

- `shipShuttleStop` beendet den stillen Erzpendel des eigenen `npc3`-Miners.
- `shipShuttle` legt dessen vorhandenen Original-Eispendel fest.
- Eine begrenzte Testvariante stoppt den Miner über `shipShuttleStop` bei exakt **50 wirklich neu gefördertem Eis pro Schiff**. Danach läuft der Original-Core ohne weitere Forschungsentscheidungen weiter.
- Die Ausdauerprobe startet vier Miner **einmalig** und lässt die bestehende KI mit voller Finanzierung/Physik/Produktionsprüfung laufen. Ihre Obergrenze von **500 Eis pro Miner** wird im tatsächlich beobachteten Lauf von keinem Miner erreicht. Sie ist keine Wirtschaftsregel.

Kein `politikSetzen`, keine neue Abnehmerkasse, kein Erz- oder Materialeintrag, kein Handel unter fremder Identität, keine neuen Hüllen und kein fremdes Schiff. Die fremde `house`-Befehlsanfrage wird **atomar abgelehnt**, ohne den Welt-Hash zu verändern. Unabhängiger Geld-, Waren-, Hüllen- und Eigentumsaudit mittels `nachrechnen`, Core-Audit, Seed-/Referenzhash und 130 Minuten bitgleicher Save/Load-Fortsetzung.

## Begrenzte 3000-Minuten-Probe – alle Zahlen tatsächlich nachgerechnet

| Rechtmäßig von `npc3` eingesetzte Miner | Neues Eis | Aldera kauft Eis | Fracht-Eis nach Nadir | Fertiges Wasser | **Tatsächlich gekauftes Wasser** | Letzter Verkauf |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **0** | 0 | 0 | 0 | 0 | 0 | kein weiterer |
| **1** | 50 | 50 | 50 | 50 | 50 | Tick 21865 |
| **2** | 100 | 100 | 100 | 100 | 100 | Tick 21985 |
| **4** | 200 | 200 | 200 | 200 | 200 | Tick 22225 |

Der identische K5-Einminer-Gegenversuch reproduziert bei Tick21865 für Seed42 den Hash `032e95033baa5e2c` und Seed7 den Hash `49214bdb90ded7a0`. Die K4-Kontrolle hat in diesem Fenster **keine weitere Förderung oder Wasserverkäufe**. Keine dieser Varianten erzeugt zusätzliches Erz, Material, Miner oder Frachter. In keiner muss neues Geld entstehen. Am Ende **Tick24612** ist der letzte Frachter `sh020` in der kurz begrenzten 4-Miner-Variante noch einsatzfähig; der Rückgang des Absatzes entsteht ausschließlich durch das ausdrücklich festgelegte Stoppen nach 50 Einheiten je Miner, **nicht** durch einen bereits bewiesenen Käufergeldmangel.

### Welt-Hashes des Kurzversuchs bei Tick24612

| Seed | 0 Miner | 1 Miner | 2 Miner | 4 Miner |
| --- | --- | --- | --- | --- |
| 42 | `5c4e57d8b06d5181` | `ed130d7ca6e744ee` | `47777abf70ab1fc9` | `a8a0f5812b8280e2` |
| 7 | `32801c80b918ed27` | `66d05ec75534f8e0` | `c03286bdc5254e18` | `87e399c07cbdd58e` |

## Langlauf: 4 Miner über weitere 7000 Spielminuten

Ohne künstliche 50er-Stoppgrenze fördert `npc3` weiterhin mit den Originalpendeln. **[TEST / beide Seeds bestanden]** Bei **Tick28612**:

| Messwert | Seed 42 | Seed 7 |
| --- | ---: | ---: |
| Neues, tatsächlich gefördertes Eis | **967** | **967** |
| Am Dock an Aldera verkauft | **967** | **967** |
| Nach Nadir rechtmäßig frachtfinanziert | **900** | **900** |
| Erfolgreich abgeschlossene 50er-Rundfrachten | **18** | **18** |
| In Nadir hergestelltes Wasser | **900** | **900** |
| Durch reale Kunden bezahltes Wasser | **900** | **900** |
| Letzter Wasserabsatz | **Tick24505** | **Tick24505** |
| Eis im Aldera-Quelllager (2 ursprünglich + 967 − 900) | **69** | **69** |
| Noch taugliche Frachter | **0** | **0** |
| Vorhandene NPC-Eisminer mit positivem Buchwert | **4** | **4** |
| Neu produziertes Erz / Material | **0 / 0** | **0 / 0** |
| Weltgeld / Mint / Burn | **33000 / 0 / 0** | **33000 / 0 / 0** |
| Audit / 130-Minuten-Load-Replay | **bestanden** | **bestanden** |

Ganze 967 Eis kamen durch finanzierte Arbeit zustande; von diesen plus 2 ursprünglich bei Aldera befindlichen Einheiten bleiben **69** am Dock übrig, weil nur 900 der 969 Einheiten verladen und verbraucht wurden. Alle 900 daraus produzierten Wasser wurden tatsächlich bezahlt verkauft. **Kein Nachfragescheitern vor Tick24505 nachgewiesen.**

Der letzte noch taugliche Frachter **`sh020` wird bereits bei Tick23752 stillgelegt**. **753 Spielminuten später**, bei Tick24505, findet erst der letzte bezahlte Wasserverkauf statt: Das ist die verzögerte Verwertung der zuvor angelieferten Ware, **keine Lieferung nach dem Frachterausfall**. Alle neun bis dahin vorhandenen Frachter sind am Ende **real stillgelegt**. Die vorhandenen vier Eisminer haben weiterhin positiven Buchwert; es fehlt **die Transporthülle**, nicht in erster Linie Eis oder Käuferbudget. Der originale Disponent meldet unter anderem `Kein einsatzfähiger Frachter der Spedition in Aldera` und `Ersatzfrachter: kein Komplettschiff auf Lager`. Zu diesem Zeitpunkt existieren **0 Erz und 0 Material** für rechtmäßig bezahlbaren W3-/W4-/W5-Ersatz. Ein bloßer zusätzlicher NPC-Miner würde diese Engpasskette nicht beheben.

**Deterministische Langlauf-Hashes:** Seed42 `8327b03c23f53470`, Seed7 `8ec40bad105101c3`. Keine der künstlichen Testgrenzen 500/Miner wurde erreicht (tatsächlich 271/232/232/232 neue Eis). Der aus dem Ausdauerlauf folgende Produktionsstopp ist deshalb kein durch die Testobergrenze hervorgerufener Stop.

## Geld- und Eigentumsaudit

Das Original-Weltgeld bleibt in sämtlichen Zuständen und Seeds **33.000 ISK** bei Mint/Burn **0/0**, unabhängig von Umsatz und Eigentümerwechseln. Im Ausdauerlauf ändern sich die liquiden NPC-Firmenkassen von `npc3: 1597 → 2069 ISK` und `transport: 6376 → 7000 ISK`; der Spielerkonzern `house: 3850 ISK` bleibt unangetastet. Die Weiterproduktion wird über bestehende NPC-Löhne, echte Dockankäufe, Nadir-Kaufverträge, Frachtkosten und Endkundenumsätze bezahlt. Ein positives Betriebsergebnis ist nicht gleich dem Zufluss neuer Welt-ISK. Getrennte private Einnahmen/Dividenden beeinflussen andere Eigentümerkassen; diese wurden nicht als zusätzliche Emission verbucht.

## Ursache und Entscheidungsgate

**[DRAFT / ANALYSE]** K4 verschob den ersten Stillstand zur Miner-Nachfolge; K5/K6 zeigen danach, dass vorhandene NPC-Miner die Eisproduktion und den *vollständig bezahlten* Endkundenabsatz real verlängern. Der neue in K6 **tatsächlich terminale Engpass ist der Frachterverschleiß**, denn die industrielle Ersatzproduktion kann nach Erlöschen des externen Erzbudgets keine neue Erzcharge erwerben und materialisieren.

**[OPTION / keine Freigabe]** Vor einer K7-Produktregel wäre zu entscheiden, ob echte industrielle Käufer wie Nadir/Werft ihre aus vorhandenen Konten finanzierte **Erz-Vorbestellung inklusive Bergbauarbeit, 50er-Rundtransport und Materialanschluss** unmittelbar finanzieren dürfen, statt dass der vorhandene Erzbergbau nur am erschöpften Exportetat hängt. So ein Vertrag müsste Arbeitgeber, Eigentümer, tatsächliche 50-Erz-Ware, Treuhand, Rückzahlung bei Abbruch, Produktionskapazitäten, langfristige Käufernachfrage, 13 unterschiedliche 90-Tage-Szenarien sowie 365-/730-Tage-Ausfälle prüfen. **Dies ist eine Produktentscheidung, keine hier aktivierte Mechanik.** Andere Optionen wie neue Rettungsdarlehen, Gratisfrachter, spontane Emission oder kostenlose Reparatur sind nicht eingesetzt.

## Prüfungen und Grenzen

- **Ausgeführt:** `tests/k6-eisdisposition.test.mjs` für beide Seeds mit vier Kurzvarianten und zwei 7000-Minuten-Proben; **4/4 gezielte Tests**, positive Audits und Save/Load-Replay.
- **[TEST / finaler K6-Testcode-Head `40f3c3bb6ffad135a39ceef133727e71b137507f`, vollständig erfolgreich]** [K1/K4/K5/K6-CI #43240986701](https://github.com/tobiasfranziskus/Check/actions/runs/43240986701): **6/6 Jobs completed/success** – **336/336 Node22-Gesamtregression**, 0 Fehler, 0 Skips; gezielt **4/4 K6** (0/1/2/4 Miner und zwei 7000-Minuten-Ausdauerproben), K4-/K5-/K3-/K2-Referenzen, Originalhashes, 15×90/5×365/2×730 Tage des separaten K1-Basisregimes, Chromium **4/4** und WebKit **4/4** Touchgrößen, `W5_SINGLEFILE_OK` (325006 Zeichen, 7 Styles, 15 Scripts). [K6-Original-JSON-Archiv](https://github.com/tobiasfranziskus/Check/actions/runs/43240986701) `k6-npc-eisdisposition-seed42-7` mit vier Dateien: 0/1/2/4 und Ausdauer je Seed. Der erste K6-Head [#43239485669](https://github.com/tobiasfranziskus/Check/actions/runs/43239485669) belegte 2/2 Kurzvarianten, der mittlere [#43240168074](https://github.com/tobiasfranziskus/Check/actions/runs/43240168074) 4/4 einschließlich Ausdauer; maßgeblich ist der letzte vollständige Lauf.
- **[TEST / finaler Testcode-Head]** [W5-RC1 #43240986507](https://github.com/tobiasfranziskus/Check/actions/runs/43240986507) und [historische JS-Gesamtregression #43240986470](https://github.com/tobiasfranziskus/Check/actions/runs/43240986470) jeweils **completed/success**. Diese CI bezieht sich auf den **letzten Testcode-Commit**, die danach entstandenen Roadmap-/Status-/Bericht-Commits änderten keine Spiel-, Test- oder Workflowdateien.
- **Nicht nachgewiesen:** W6-Dauerwirtschaft, neue industrielle Verträge, K6 unter 13 wirtschaftlich unterschiedlichen Regimen, reale iPad-Safari/NAS-Abnahme, produktive Integration, Gleichzeitigkeit mit K1-UX-Stack #311/#312. Die 15×90-/5×365-/2×730-Standardläufe in der bestehenden CI betreffen weiterhin das **alte K1-Regime**, nicht eine K6-Wirtschaftsregel.
