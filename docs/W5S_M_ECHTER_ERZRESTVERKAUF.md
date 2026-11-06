# W5s-m – bereits geförderte NPC-Erzladung tatsächlich verkaufen

**[DRAFT/ANALYSE · 06.11.2026]** Auf W5s-l (#215) gestapelte isolierte Regel32/Schema8-Fortsetzung; `main b4e604d6` und produktive Spielstände unverändert. Keine neue Geldquelle, keine zusätzliche Ware, kein alternativer Simulationskern.

## Reproduzierter Fehler der Erzversorgung

Bei 2/7 Tagen Vorlauf und aktivierter W5s-l-Speditionsreserve liefert die Wirtschaft in 90 Tagen 4.316 Wasser, aber nur **eine** volle 50er-W3-Erzfracht. Der Warenstopp war nicht bloß fehlende neue Förderung: Tag90 (Seed42/7) liegen **45 bereits geförderte Erz** im Eigentumsfrachter des NPC3-Miners `sh003`, gemeinsam mit **55 Eis**, die W2-Quellstation verfügt über **250 ISK** für den Ankauf von **25 Erz**; der Großhändler `export` hat bereits **25 physisch gekaufte Erz**, der Endkunde in Nadir ist zahlungsfähig. Die freie Erzbeschaffung im bestehenden W5s-NPC-Plan verlangte jedoch einen frischen leeren Miner und einen vollständigen 50er-Förderauftrag. Dadurch blieb das vorhandene Erz im gemischten Frachtraum, obwohl Käufergeld, Lager und eine Teilmenge real vorhanden waren.

## Kleiner, abgeschalteter Core-Eingriff

Das explizite Forschungsflag `rules.w5s.autoOreSettlement=true` erlaubt ausschließlich einem ungebundenen **NPC3-eigenen Miner in Aldera** den Verkauf bereits vorhandener eigener Erzladung. Die neue validierte Core-Aktion `shipSellBookedOre` verwendet **denselben W2-`beauftragen`-/`abschliessen`-Vertrag und denselben `handel`-Beleg**; der Auftrag erhält nur einen optionalen Mengen-Deckel in Höhe des echten Erzrestbestands. Zulässig ist die kleinste positive Menge aus eigener unverpfändeter Ladung, tatsächlich freier Stations-Kasse, Stationslagerraum und bereits unabhängig nachgewiesener Endnachfrage. Die Käuferseite reserviert real vorhandene ISK vor dem eigentlichen Eigentumswechsel. Bereits geschaffene Erz werden nicht erneut gefördert; Eisladung, R32-Ersatzschiffe und deren Ausrüstung werden nicht umgebucht. Keine direkte Sonderüberweisung, Gratisnachfrage, künstliche Deckelung des offenen Mining-Angebots oder Änderung des W3-50er-Transportkerns.

Ist kein Käufergeld vorhanden oder der Miner fremd, unterwegs, anderweitig vertraglich gebunden oder eine nicht übernommene Werft-Ersatzhülle, wird die Aktion **ohne jeden Zustandswechsel abgelehnt**. `autoOreSettlement` ist standardmäßig aus: W5s-l-Simulationen und die produktive Regel14 bleiben dadurch unverändert. Save-Schema und Regelversion werden nicht verändert.

## Prüfgrenzen

**[TEST] [GitHub W5s-m-CI #42208104182](https://github.com/tobiasfranziskus/Check/actions/runs/42208104182) auf Code-Head `731f18b9`: 5/5 Testgruppen erfolgreich, 0 Fehler und 0 übersprungen.** 13 feste Seeds ×90 Tage, Seed42/7 ×365 Tage, täglicher unabhängiger Core-, Kassenprovenienz-, Weltgeld- und physischer Warenabgleich, 90-Tage-Doppelreplays, Save/Load, sowie abgelehnte verbotene Verkäufe ohne Forschungsflag/Stationsgeld/Eigentum und ohne Doppelverkauf. Der erste Zwischenstand hatte einen Fehler bei ungekürzten Verträgen (25er-Neuauftrag trotz 20 realer Restware); der Original-W2-`beauftragen`-Befehl erlaubt jetzt **nur auf ausdrücklichen Aufruf einen optionalen Mengen-Deckel**. Das reguläre W2/Spielerverhalten ohne Parameter bleibt identisch und die nachfolgende CI wurde erfolgreich ausgeführt.

**[POSITIV]** Für **alle 13 Seed-Welten mit 2 Tagen Vorlauf**: nach 90 Tagen **zwei vollständige 50er-Erzfrachtabschlüsse**, zweiter Abschluss **Tag59**, real **100 Erz** in Nadir, **88 bezahlte Eisfahrten, 4.316 bezahlte Wasser, acht echte neue W5-Fertigstellungen** und 0 neue ISK. Gleiche Welt ohne Teilverkauf: **eine** 50er-Fracht, weiterhin 4.316 Wasser. Der Erzgroßhändler hat 120 Erz real aus der Station erworben, 100 davon nach Nadir verkauft; es bleiben nur nachweisbare Lagerbestände. Die meisten Seed-Welten teilen dieselben Wirtschaftsgrößen, unterscheiden sich aber im deterministischen Hash – **keine** 13 unabhängigen Krisenökonomien.

| 90 Tage, jeweils Seed42 und Seed7 | W3 ohne/mit Bestandsverkauf | Wasser ohne/mit |
|---|---:|---:|
| 2 Tage Vorlauf | **1 → 2** | **4.316 → 4.316** |
| 7 Tage Vorlauf | 1 → 2 | 4.316 → 4.089 |
| 30 Tage Vorlauf | 2 → 2 | 1.250 → 1.250 |

Bei 7 Tagen geht die zusätzliche echte Erz-Nachfrage zeitlich zulasten von **227 bezahlten Wasser**, deshalb ist 7 Tage keine gleichwertige Empfehlung. Die R32 15-/30-Tage-Verschleißwerte sind ausschließlich hypothetische Stressannahmen, **keine** freigegebene Produktregel.

**[365d-Negativbeleg]** Seed42 und Seed7 bleiben auch nach 365 Tagen bei nur **zwei** abgeschlossenen Erztransporten und **4.382** bezahlten Wasser stehen; Speditionskasse 480 ISK, kein dauerhafter autonomer W6-Wiederanlauf. Das ist kein Test für NPC-Wiedergründung, neue Endnachfrage oder gesamtes Kampfsystem.

**[CI-HÄRTUNG]** Nach erfolgreichem Forschungs-Run wurde die 13-Seed-Matrix um exakte Assertions für die zweite Erzlieferung an Tag59, 88 Eisfahrten, 4.316 Wasser und acht echte Werfthüllen verschärft; der erneute GitHub-Lauf auf dem Folgecommit ist separat zu bestätigen. Das vollständige GitHub-Regressionsworkflow- und die iPad-Safari-/NAS-Abnahme bleiben eigene Gates. **Nicht** behauptet: ewiger NPC-Wiederanlauf oder genehmigte neue Geld-/Preispolitik.

Ausdrücklich nicht geändert: produktive `index.html` auf `main`, die bereits bestehenden UI-Drafts, W5s-k/l-Kassenregeln, realer Eigentumserwerb von Schiffen und Spieler-Sparfreiheit.
