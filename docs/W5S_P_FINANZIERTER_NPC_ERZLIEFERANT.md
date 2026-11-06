# W5s-p – voll finanzierter NPC-Erzlieferant und dritter autonomer 50er-Transport

**[DRAFT/ANALYSE · 06.11.2026]** Auf W5s-o [#218](https://github.com/tobiasfranziskus/Check/pull/218) gestapelte **opt-in** Regel32/Schema8-Forschungsvariante. Verbindlicher Produktstand bleibt `main b4e604d6`, Regel14/Schema8. Bestehende Saves/Index im `main` unangetastet. Kein Merge oder Deployment. 700 ISK/60 % sind **hypothetische** Forschungskonditionen, keine selbstständig beschlossene Produktpolitik.

## Reproduzierter Engpass

W5s-o erlaubte den vollständig mit 600 ISK plus echter Arbeit finanzierten **Spieler**-Erzminer und die dritte 50er-W3-Lieferung. Ohne Spieleraktion blieben zwei Transporte. Ursache der autonomen Blockade: Der ursprüngliche NPC3-Miner `sh003` besaß eine vollständige **100-Eis-Misch-/Restladung**, blieb für Erz gebunden und konnte diese mangels finanzierter Quellabnahme nicht verkaufen. Der NPC3-Konzern hatte bei Tag60 ca. 150 ISK, also keinen eigenen Etat für einen weiteren Miner. Der Erzgroßhändler `export` hatte nach seiner bereits genehmigungsfreien Test-Beteiligung am Transporteigentümer noch **echtes, eigenes Kapital**, der Nadir-Kunde genügend Kaufetat, und in Aldera lag **eine tatsächlich vorhandene Minerhülle** im Stationslager. Ein neuer Erzminer war also nur durch **bezahlte, getrennte private Finanzierung** möglich.

## Implementierter kleiner W2–W5-Vertragskern

Nur bei `rules.w5s.autoNpcVenture=true` zusätzlich zur schon ausdrücklich aktivierten `autoTakeover`-, `autoNpcOre`-, `autoOreSettlement`- und `autoIndustry`-Forschung darf der Großhändler **einmalig 700 ISK seines vorhandenen Guthabens** gegen **60 % Beteiligungsrechte ausschließlich am neuen Erz-Mining-Projekt** des eigenständigen `npc3` investieren. Er erwirbt **weder** die R32-Eisflotte noch deren W5o-Haushaltsdividenden. Der NPC3-Konzern erhält die vorhandenen ISK auf seiner eigenen Kasse. Er bezahlt darüber mit dem ORIGINAL-`shipBuy`-Kommando **600 ISK für die reale Station-Minerhülle** (im Audit Schiff `sh010`) und startet den ORIGINAL-`shipMine`-Auftrag mit vorab real gebundenem Förderarbeitslohn. Der W2-Autopilot darf dafür **eine teilweise finanzierte Charge** statt ausschließlich 50 Erz am Stück fördern: Maßgeblich bleiben die tatsächlichen W2-Kaufverträge, verfügbare Stationskasse, Lagerplatz, abschließbare Großhandelsnachfrage und bezahlte Arbeit. Kein globaler künstlicher Förderdeckel, kein gratis gefüllter Lagerbestand, keine neue Geldquelle oder zweiter Simulationskern.

Die Investition darf **nur** ausgelöst werden, wenn zwei reale W3-Aufträge abgeschlossen sind, die W5s-o-Spedition tatsächlich einen vorhandenen operativen Mehrheitsinvestor hat, noch keine eigene, unabhängige freie Erz-Hülle vorhanden ist, eine bezahlte vorhandene Minerhülle in Aldera angeboten wird, der Händler die 700 ISK **plus mindestens weitere 500 ISK für Erzankauf** besitzt und Nadir **740 ISK** für eine echte 50er-Fracht aufbringen kann. Kein Start bei Kaufkraft- oder Lagerengpass; ausbleibende Lieferungen dürfen Firmen scheitern lassen.

**Unveränderter Core:** Kauf-, Förder-, Stationsankaufs-, Großhandels-, Fracht-, Pilotlohn- und Werftkosten gehören weiterhin den vorhandenen `m_core_erzpilot`, `m_core_w5m`, `m_core_w3`, `m_core_w5h`, `m_core_w5n` und `m_core_w5s`. Das einzige zusätzliche `state.w5s.oreVenture`-Buch vermerkt Investor, unabhängigen Betreiber, **einmalige** Kapitalzeichnung, 60-%-Gewinnanspruch, den ursprünglichen tatsächlichen Schiffindex/-ID, Erwerbspreis, Zeit, abgegrenzte Förder- und Verkaufserträge sowie reale Ausschüttungsereignisse. Alt-Saves ohne dieses Feld gelten weiter, Regeln/Schema bleiben identisch.

## Echte Gewinnertragsrechte statt Geschenk

Der Investor erhält höchstens **60 % des aus der wirklich finanzierten eigenen Erzmine realisierten Gewinns**. Der Nettoertrag wird nur aus dem **Original-W5m-Minerbuch** ermittelt: `verkauft × 10 ISK - tatsächlich gebuchte Arbeitslöhne - tatsächlich gekaufte 600-ISK-Hülle`. Vor **voller tatsächlicher Hüllen- und Arbeitsamortisation** gibt es keinerlei Ausschüttung. Auch danach wird maximal die freie NPC3-Kasse **oberhalb 700 ISK für eine nächste Minerhülle plus 50er-Arbeit** an den Investor bezahlt. Jede reale Ausschüttung ist separat auf beiden Eigentümerkassen und im persistierten `payouts`-Journal nachweisbar.

**Beobachtet:** Miner `sh010` hat **205 Erz real abgebaut**, davon **105 Erz für 1.050 ISK** wirklich über W2 verkauft, **410 ISK** Förderarbeit bezahlt und **600 ISK** für die Hülle ausgegeben. **40 ISK** bleiben als realisierter, nach Kosten nachgewiesener Nettoertrag. Der Großhändler erhält davon **24 ISK** (60 %), trägt aber weiterhin **676 ISK** seines Investitionsrisikos. Es gibt keine Garantierendite, keine versteckte Ausschüttung aus fremder Eisarbeit und keine Erhöhung der Weltgeldmenge.

**Vollständiger Finanzierungsabgleich:** `m_core_audit`, W1-Vollkostenbericht, W2-Konzernstatus, W5h-Erzgroßhandelsbuch und W5s-Speditions-/Beteiligungsbuch trennen **Beteiligungskapital** ausdrücklich von Warenumsatz, Löhnen und Erz-Frachtgewinn; der ursprüngliche W5s-o-Großhändleranteil und dessen erst nach echten W3-Fahrten verdiente Dividende bleiben gesondert. Ein gefälschter fremder Miner, Geldtransfer, Anteil oder fingierter Ertrag wird vom Original-Core-Audit zurückgewiesen. Die Eigentumsprovenienz benutzt die **beim realen Kauf fortgeschriebene Schiff-ID**, nicht nur einen Anzeigenamen.

## Wirklich ausgeführte Matrix

[GitHub-CI W5s-p #42229906088](https://github.com/tobiasfranziskus/Check/actions/runs/42229906088), **5/5 Testgruppen erfolgreich, 0 Fehler, 0 übersprungen**, Node22, Code-Head `6ac47977`. Ausgeführt: **13 Seeds ×120 Spieltage**, Seed42/7 ×365 Tage, **täglicher** unabhängiger Weltgeld- und physischer Warenledger-Abgleich, originaler Core-, W5s-, W5h- und Betreiber-Kassenaudit, Save/Load, vollständige Doppelreplays Seed42/7, geänderte Kapital-/Eigentums-/Dividendenbelege als Negativproben. Die deaktivierte Flag-Version entspricht exakt den unveränderten W5s-o-90-Tage-Hashes Seed42 `54e9612605d24486` / Seed7 `32f0beb3131ffc83`. **Weltgeld 33.000 ISK, `minted=0`**.

| Szenario · Vorlauf 2 Tage · Seed42/7 | W5s-o ohne NPC-Investment | W5s-p mit wirklichem NPC-Miner |
|---|---:|---:|
| Dritte W3-Lieferung ohne Spieler | **keine** | **Tag 104 (50 Erz)** |
| Reale W3-Lieferungen nach 120/365 Tagen | 2 / 2 | **3 / 3** |
| Reale bezahlte Eisfrachtfahrten nach 365 Tagen | 93 | **116** |
| Bezahlter Wasserverbrauch nach 365 Tagen | 4.589 | **5.738** |
| ISK-Emissionsmenge | 0 | **0** |
| Neue tatsächlich gekaufte NPC3-Erzminerhüllen | 0 | **1 × 600 ISK** |
| Eigenkapital vom Großhändler in NPC3 | 0 | **700 ISK (Anteil 60 %)** |
| Real aus neuem Minergewinn an Investor gezahlt | – | **24 ISK, nur nach Leistungsabrechnung** |

Die dritte vollständige 50er-Lieferung schließt **am Tag 104** ab, nachdem Großhändler, Station und Nadir-Käufer die jeweiligen ISK bezahlt und die originale W3-Schiffsfracht und Pilotenarbeit vollständig gebucht haben. Bis Tag120 werden **5.722 Wasser** bezahlt, gegenüber dem kurz zuvor ohne Anlegerauszahlung beobachteten Zwischenwert 5.724; der kleine Unterschied entsteht durch echte Beteiligungszahlungen, **nicht** durch einen Testfehler. Die aktive W5s-o-Transportbeteiligung liefert nach der dritten Erzfahrt ebenfalls ihre eigenen, getrennt auditierten **72 ISK** Nachfolge-Erztransportmarge (60 % von 120 ISK), unabhängig von den 24 ISK Mining-Anlegererträgen.

## Ausdrückliche Grenzen

**[NICHT ERREICHT]** Das System ist **nicht dauerhaft autonom**: Die Seed42/7-Stresswelten erreichen bis Spieltag365 **weiterhin genau drei** Erzfrachten und keine vierte. Der NPC3-Konzern steht schließlich mit **0 ISK Eigenkasse** und gebundener, unverkäuflicher Erzrestladung da; die Spedition hat noch **240 ISK**, der Endkundenetat erschöpft sich. Die zuvor technisch eingeführten R32-Miner-/Frachter-Lebensdauern (15/30 Tage) bleiben reine Stressannahmen. Dieser Nachweis ist **kein** ausgeglichener W6-Kreislauf, keine endgültige Wirtschaftspolitik und keine bereits freigegebene Eigentümerstruktur.

**[OFFEN]** Echte iPad-Safari- und NAS-Abnahme, separate erneute historische Komplettregression auf dem PR-Head sowie Realwirtschaftsentscheidung über Kapitalgeber, Bewertungsregel und Insolvenz-/Nachfolgemodell. Nächster sinnvoller Forschungsschritt: Endnachfrage, tatsächliche freie Wiederanlage und verbleibende Erzbestände nach Tag104 prüfen; keine pauschalen Gratisrettungen, kein Absatzlimit für Miner, keine automatische Spielstands-Migration.

**[MAIN]** Unverändert; **kein Merge/Deployment**.
