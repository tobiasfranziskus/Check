# W5s-m – bereits geförderte NPC-Erzladung tatsächlich verkaufen

**[DRAFT/ANALYSE · 06.11.2026]** Auf W5s-l (#215) gestapelte isolierte Regel32/Schema8-Fortsetzung; `main b4e604d6` und produktive Spielstände unverändert. Keine neue Geldquelle, keine zusätzliche Ware, kein alternativer Simulationskern.

## Reproduzierter Fehler der Erzversorgung

Bei 2/7 Tagen Vorlauf und aktivierter W5s-l-Speditionsreserve liefert die Wirtschaft in 90 Tagen 4.316 Wasser, aber nur **eine** volle 50er-W3-Erzfracht. Der Warenstopp war nicht bloß fehlende neue Förderung: Tag90 (Seed42/7) liegen **45 bereits geförderte Erz** im Eigentumsfrachter des NPC3-Miners `sh003`, gemeinsam mit **55 Eis**, die W2-Quellstation verfügt über **250 ISK** für den Ankauf von **25 Erz**; der Großhändler `export` hat bereits **25 physisch gekaufte Erz**, der Endkunde in Nadir ist zahlungsfähig. Die freie Erzbeschaffung im bestehenden W5s-NPC-Plan verlangte jedoch einen frischen leeren Miner und einen vollständigen 50er-Förderauftrag. Dadurch blieb das vorhandene Erz im gemischten Frachtraum, obwohl Käufergeld, Lager und eine Teilmenge real vorhanden waren.

## Kleiner, abgeschalteter Core-Eingriff

Das explizite Forschungsflag `rules.w5s.autoOreSettlement=true` erlaubt ausschließlich einem ungebundenen **NPC3-eigenen Miner in Aldera** den Verkauf bereits vorhandener eigener Erzladung. Die neue validierte Core-Aktion `shipSellBookedOre` verwendet **denselben W2-`beauftragen`-/`abschliessen`-Vertrag und denselben `handel`-Beleg**; der Auftrag erhält nur einen optionalen Mengen-Deckel in Höhe des echten Erzrestbestands. Zulässig ist die kleinste positive Menge aus eigener unverpfändeter Ladung, tatsächlich freier Stations-Kasse, Stationslagerraum und bereits unabhängig nachgewiesener Endnachfrage. Die Käuferseite reserviert real vorhandene ISK vor dem eigentlichen Eigentumswechsel. Bereits geschaffene Erz werden nicht erneut gefördert; Eisladung, R32-Ersatzschiffe und deren Ausrüstung werden nicht umgebucht. Keine direkte Sonderüberweisung, Gratisnachfrage, künstliche Deckelung des offenen Mining-Angebots oder Änderung des W3-50er-Transportkerns.

Ist kein Käufergeld vorhanden oder der Miner fremd, unterwegs, anderweitig vertraglich gebunden oder eine nicht übernommene Werft-Ersatzhülle, wird die Aktion **ohne jeden Zustandswechsel abgelehnt**. `autoOreSettlement` ist standardmäßig aus: W5s-l-Simulationen und die produktive Regel14 bleiben dadurch unverändert. Save-Schema und Regelversion werden nicht verändert.

## Prüfgrenzen

Ein erster gezielter Vergleich unter 2 Tagen Vorlauf (Seed42) ergab nach 90 Tagen **zwei vollständige W3-Frachten und weiterhin 4.316 real bezahlte Wasser** statt nur einer Fracht ohne Bestandsverkauf. Für 7 Tage Vorlauf kamen ebenso zwei W3-Frachten zustande, aber der Wasserverbrauch sank in dieser Variante auf 4.089. Diese Ergebnisse sind vor der umfassenden CI-Matrix noch **[VORLÄUFIG]** und enthalten keinen 365-Tage-Stabilitätsbeweis.

Die eigenständige Node22-CI muss mit 13 Seeds ×90 Tagen, Seed42/7 ×365 Tagen, unabhängigem täglichen ISK-/Warenaudit, Save/Load und zwei deterministischen Replays sowie Negativprüfungen gegen unberechtigten/doppelt gebuchten Ankauf bestanden werden. Das vollständige GitHub-Regressionsworkflow- und die iPad-Safari-/NAS-Abnahme sind eigene Gates. **Nicht** behauptet: ewiger NPC-Wiederanlauf oder genehmigte neue Geld-/Preispolitik.

Ausdrücklich nicht geändert: produktive `index.html` auf `main`, die bereits bestehenden UI-Drafts, W5s-k/l-Kassenregeln, realer Eigentumserwerb von Schiffen und Spieler-Sparfreiheit.
