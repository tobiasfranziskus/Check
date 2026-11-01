# B-K9i – Was die reale Auftragsfindung blockiert: volle Miner, Stationskassen und Frachter

**01.11.2026 · [ANALYSE/DRAFT] [PR #101](https://github.com/tobiasfranziskus/Check/pull/101), gestapelt auf [#100](https://github.com/tobiasfranziskus/Check/pull/100) und ausschließlich für Diagnose. NICHT integrieren.**

**[MAIN]** `b4e604d6ae5b9a4ba0a8d8e53651ca61119c9e1c`, Aphros Void v0.12.5 / Regel14 / Schema8. Keine Änderung des Produktcodes, keine neuen ISK, keine neue Handels-, Dock- oder KI-Regel.

## 1. Warum die Meldung „kein Miner“ aus B-K9h irreführend ist

Der B-K9h-Testvermittler akzeptiert einen NPC3-Eisminer ausschließlich in Cyris, **gedockt, mit Auftrag Eis und völlig leerem Frachtraum**. In der Regelversion 15 wird damit *jeder teilweise oder voll beladene Miner* als „kein geeigneter Miner“ gezählt, obwohl dieser bereits Rohstoffe real gefördert und bezahlt hat.

**[TEST] [GitHub Actions #41344852605](https://github.com/tobiasfranziskus/Check/actions/runs/41344852605), SUCCESS:** `tools/bk9i-npc-disposition-13x90.mjs` erfasst 13 feste Seedwelten ×90 Tage, stündlich echte Schiffspositionen, Phase, Ladung, Geld, statisch kalkulierte Rück-/Leerflug-Lohnreserve und echte Originalspot-Quote-Ursachen, **ohne** Teleports oder Vertragsbeginn. **28.080 reale stündliche Beobachtungszeitpunkte**:

| Ereignis (Stunden mit mindestens einem passenden Schiff) | Beobachtungen |
| --- | ---: |
| NPC3-Eisminer **physisch in Cyris und gedockt** | **28.080** |
| NPC3-Eisminer mit **100 von 100 Eis** voll | **27.910** |
| NPC3-Eisminer **teilbeladen** | **157** |
| NPC3-Eisminer **leer** | **13** |
| NPC1-/NPC2-Frachter **physisch im System Cyris** | **1.163** |
| Ein NPC1-/NPC2-Frachter **wirklich gedockt** | **65** |
| Davon mindestens ein Frachter gedockt und **leer** | **58** |
| Eisminer und Frachter gleichzeitig wirklich **gedockt, unabhängig von Ladung** | **65** |
| Miner **und** Frachter gleichzeitig völlig **leer und gedockt** | **13** |
| Teil-/vollbeladener Miner und leerer gedockter Frachter | **45** |

**[KORREKTUR ZU #100]** „Nur eine gemeinsam verfügbare Stunde je Seed“ meint **die extrem strenge Bedingung beider leer**, nicht die physische gemeinsame Anwesenheit. Der Eisminer befindet sich im ganzen 90-Tage-Beobachtungszeitraum vor Ort. Das frühere Ergebnis mit **null ausführbaren Verträgen** ist korrekt, aber die im Bericht verkürzte Erklärung „kaum gemeinsame Schiffsposition“ muss durch **Frachtübernahme plus Liquiditätsengpass** ergänzt werden.

Die 13 Welten enden sämtlich mit **null NPC1/2-Frachtern**. Potenziell **72 konservativ aus vorhandener Kasse bezahlbare, sichere Leerflug-Snapshots** von einem anderen realen Dockort nach Cyris stehen **97 unbezahlbaren** und **224 unsicheren** gegenüber. Diese Zahlen sind über Stunden gezählte Kandidaten, **keine unterschiedlichen Schiffe**, keine echten Aufträge und keine komplette Finanzierung von Einkauf/Verkauf/Hin-/Rückfahrt/Schiffsersatz. Die Betrachtung belegt noch **keinen profitablen Leerflug**.

Am echten gemeinsamen Markt wurden 60 lesende, originalpreisgebundene Quoten überprüft; keine vollständig finanzierbar. Fehlerhäufigkeit: **30× Lagerkapazität**, **21× nicht leerer Miner**, **13× negative Frachtermarge** (mehrere Gründe pro Quote möglich).

## 2. Warum der Cyris-Miner mit 100 Eis kaum wieder Platz erhält

Zweiter, **eigenständiger** Test `tools/bk9i-cyris-eis-absatzgate-14d.mjs` auf denselben 13 Original-Seeds ×14 Tage. Er rechnet stündlich die **originalen** `obergrenze`, `aufnehmbar`, `preis`, tatsächliche Station-Cash und Eisladung nach; die unveränderte `foerderung`/`handel`-Logik läuft weiter. **Keine erzwungenen Käufe, keine Markt- oder Fondsintervention.**

| Kennzahl | Ergebnis |
| --- | ---: |
| Stunden mit voller Minerladung | **4.198** |
| Davon ohne tatsächlich finanzierbare/lagermögliche weitere Eiseinheit | **3.319** |
| Davon durch volle Stationslagergrenze | **1.544** |
| Davon durch zu kleine Stationskasse für eine Einheit | **1.775** |
| Stunden mit voller Ladung, in denen **Teilentladung nach Original-Gates möglich** ist | **879** |
| Alle 13 Miner am Spieltag 14 noch voll? | **Ja** |
| Erste volle Ladung in stündlichen Stichproben | **ab Stunde 3 in sämtlichen Seeds** |

**[WICHTIGE PRÄZISIERUNG]** 879 Stunden erlauben **Teilverkäufe**; der Miner ist **nicht ununterbrochen völlig vom Handel abgeschnitten**. Er füllt nach Teilankäufen schnell wieder auf, was in der stündlichen Messung meist erneut als volle Ladung erscheint. Der behauptete Grund ist also **geringer durchgehender Ankauf/Absatz**, nicht ein unveränderlicher Verkaufsstopp ab Spielstunde 3.

**[KONKRETE KRISENZAHLEN]** Spieltag 14, *alle* 13 Seeds: `st_cyris` hat nur **2 bis 19 ISK**, der Original-Eispreis liegt bei **24 ISK/Eis**; Lagerbestand noch 0–1 Eis, also **genügend Raum**, aber **kein Geld für die nächste Eiseinheit**. In Seed7 liegt die Cyris-Station bei **10 ISK**, in Seed42 bei **9 ISK**, jeweils bei Preis **24 ISK** und vollem NPC3-Miner. Damit wechselt die Ursache im Zeitverlauf von Lagerengpass zu Käuferliquidität; zusätzliche kostenlose Lagermenge allein löst den Endzustand nicht.

## 3. Ursachenbewertung

**[ANALYSE]** Es existiert keine allgemeine Abwesenheit des Cyris-Miners. Das aktuelle Konstrukt trennt bereits bezahlten bzw. bereits geförderten Miner-Lagerbestand nicht von einem künftigen neuen Auftrag; der Vertragsbeginn B-K9f fordert ausdrücklich einen **leeren** Miner. Gleichzeitig verliert die vorhandene Cyris-Stationskasse im Verlauf die Möglichkeit, die bereits lieferbereiten Eis-Rohstoffe abzunehmen. Frachter sind nur in 65 der 28.080 stündlichen Prüfzeitpunkte wirklich dort gedockt; der knappe autonome Frachterkontakt verschärft die Absatzfinanzierung.

**[WICHTIG]** Bloßes Sperren oder Zufügen eines weiteren Vertragskontos, eine kostenlose Lagererweiterung, ein Gratisfrachter oder neue ISK ohne genehmigte Emissionsregel beheben **nicht** die bereits belegten wirtschaftlichen Zahlungslücken. Auch die positive B-K9f-Musterfahrt beweist nicht, dass ein NPC im Originalbetrieb rechtzeitig in Cyris steht und zahlungsfähig ist.

## 4. Nächstes kleines, prüfbares Produkt-Teilziel (noch nicht implementiert)

**[OPTION B-K9j]** *Eine einzige* voll finanzierte Abnahme **bereits vorhandener Eisfracht** eines echten v15-NPC3-Miners in Cyris – nicht noch einmal 26 Eis neu abbauen und nicht vorhandene Rohstoffe als neue Ware deklarieren. Ein konkreter Kunde müsste **vorher** die Station/Produktion und den Transport inklusive Arbeit, Quell-/Zielgebühren, Lager/Dock und Ersatzreserve finanzieren. Reale vorhandene Minerladungen dürfen nur **genau einmal** verkauft und bezahlt werden; bereits gezahlte Minerarbeit darf **nicht noch einmal** als neue Arbeitsleistung abgerechnet werden. Der Zielmarkt zahlt nur seinen **echten Originalpreis**, bei Verlust wird bezahltes WIP/Ware korrekt bilanziert. Ein passender leerer Frachter muss entweder tatsächlich vor Ort sein oder einen **voll vorfinanzierten, profitablen echten Leerflug** absolvieren. Kein testweiser Teleport.

**Prüfgate vor jeder Integration:** Erst den ursprünglichen Minerlager-Verkauf und eine einzige positive Endkunden-Rechnung auf einem echten Zeit-/Marktfenster belegen; dann in zwei Seeds ein echtes Save-/Load-fähiges Ticket ausführen und schließlich 13×90 Tage mit tatsächlich aktiven Verträgen vergleichen. Der aktuelle B-K9i-Test ist ausschließlich Diagnostik; **keine** fertige Dispositions-/Wirtschaftsreform.

**Kein Merge, keine neue ISK-Regel, keine Spieler-Spargrenze, keine neue Laufzeitpflicht.** CI ersetzt keine echte iPad-/NAS-Abnahme.
