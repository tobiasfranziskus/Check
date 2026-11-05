# W5o – reale Haushaltseinkommen aus Arbeitsleistung und NPC-Überschüssen

**Status: [DRAFT/ANALYSE], 05.11.2026.** Separate **Regel 30 / Schema 8**, gestapelt auf W5n ([PR #193](https://github.com/tobiasfranziskus/Check/pull/193)). Keine Produktfreigabe, keine Änderung an `main`, keine Geldmodell-B-Emissionsfreigabe.

## Forschungsfrage

Kann die bereits in W5n physisch und monetär nachgewiesene Grundversorgung auch bei **gleichbleibender Weltgeldmenge** eine wiederkehrende Nachfrage tragen? Und: Was geschieht, wenn NPC-Unternehmen oder der Spieler ihre Gewinne behalten?

**Falsifizierbare Hypothese:** Der Endkunde muss für langfristigen Umsatz Geld als Gegenleistung real geleisteter, bezahlter Arbeit oder als Ausschüttung **realisierter** positiver Unternehmensüberschüsse zurückerhalten. Eine pauschale Auszahlung aus keiner Kasse, eine Kreditlinie oder die Rettung bestimmter Einzeleigentümer ist unzulässig.

## Exakt definierte Rückflüsse

`W5O_RULES` erbt Waren, reale Kaufverträge, Förderarbeit, Routen, Preise, Frachtraum und Lager von W5n. **Alle bestehenden Auditfunktionen bleiben aktiv.** Auf demselben Simulationskern arbeitet ein kleines autonomes Forschungsdispositionssystem `m_core_w5o`, das auf vollständig vorfinanzierte, validierte Befehle zurückgreift und weder `main` noch andere Regelprofile aktiviert.

| Erwirtschaftete Leistung | Nachweisbarer Zahler / Einkommensquelle | Maximaler Rückfluss an Haushalte |
| --- | --- | ---: |
| 50 Eis selbst gefördert | Vorher tatsächlich bezahlte 50 Förderminuten, bestehender Aldera-Fonds | 100 ISK Löhne |
| Ein echter Frachter-Hin-/Rückflug | 120 bereits bezahlte Flugminuten, bestehender Transportfonds | 120 ISK Löhne |
| 5 echte 10er-Wasserchargen | Nadir-Arbeitsreserve → tatsächlich abgearbeitete Löhne | 100 ISK Löhne |
| 50 Eis **verkauft** durch NPC-Miner | Erzielter Verkaufserlös abzüglich konservativer Höchst-Förderlohnkosten des verkauften Eises | Bis 150 ISK NPC-Ausschüttung |
| Eine vollständig bezahlte Frachtrunde | Tatsächlich erwirtschafteter 240-ISK-Frachttarif abzüglich 120 ISK Fluglöhne | Bis 120 ISK Transportausschüttung |
| 50 Wasser **wirklich verkauft und verbraucht** | 700 ISK Erlös abzüglich **590 ISK** Herstellung, Rohwarenkauf und Fracht (nach verkauften Einheiten mit konservativer Aufrundung) | Bis 110 ISK Nadir-Überschuss |

Damit werden bei einem vollständig bezahlten 50-Wasser-Kreislauf höchstens **700 ISK** als **320 ISK wirklich bezahlte Löhne + 380 ISK realisierte Überschüsse** an den Verbraucherhaushalt verteilt, gegenüber genau **700 ISK nachgewiesenen Verbrauchszahlungen**. Jede Überweisung wird **vom vorhandenen Quellkonto abgebucht** und beim Verbraucher gebucht. `state.minted=0`. Zwischenphasen mit teilweise gebundenem Kapital oder fehlender Kasse begrenzen einzelne Auszahlungen; keine Leistung, kein Einkommen.

Ausschüttungsreserven (reine Forschungsparameter, keine dauerhafte Bilanzregel): mindestens 100 ISK im NPC-Miner, 120 ISK in der Spedition, 600 ISK in Nadir. Der Scheduler bestellt keine unfinanzierte Leistung. Die Spieler-Kasse wird **nie** zwangsweise zur Finanzierung des Verbrauchers herangezogen. Die NPC-Miner-Ausschüttung benutzt bewusst nur den **konservativen belegbaren Erlös verkauften Eises**, ohne die Kosten unverkaufter Ladung als Anlass für zusätzliche Zahlungen zu behandeln. Nicht verkaufte Waren zählen nicht als Gewinn.

## Fünf echte 90-Tage-Vergleichswelten (Seed 42)

Keine dieser Welten erhält neu erzeugte ISK. Jede startet mit 33.000 ISK Weltgeld und demselben endlichen Wasserkunden-Startguthaben von 1.400 ISK. Die NPC- und House-Miner werden separat aus vorhandenen Mitteln gekauft, der Frachter für 750 ISK ebenfalls.

| Modus | Bezahltes Wasser / max. 4.320 | Mangelstunden | Endkundenkasse |
| --- | ---: | ---: | ---: |
| Keine Rückflüsse | 100 | 2.110 | 0 ISK |
| Nur tatsächlich bezahlte Löhne | 310 | 2.006 | 0 ISK |
| Löhne und NPC-Überschüsse, **NPC-Miner spart** | 789 | 1.766 | 9 ISK |
| Löhne + tatsächlich realisierte NPC-Miner-, Transport- und Stationsgewinne | **4.316** | **2** | **3.221 ISK** |
| Wie zuvor, aber House besitzt Miner und spart seine Gewinne | 733 | 1.794 | 10 ISK |

Die beiden anfänglichen Mangelstunden (je 2 Wasser) ergeben sich aus dem physischen Anlauf von Eisförderung, Flügen und Wasserwerk. Danach gelingt die vollständige 90-Tage-Versorgung **nur im spezifizierten vollen NPC-Rückfluss-Szenario**. Die abweichenden Varianten sind absichtliche Negativkontrollen, keine Fehlfunktion.

**Vergleichsgrenze:** Die House-Variante kauft ausdrücklich einen **zusätzlichen** vollständig bezahlten House-Miner (600 ISK) und lässt den bereits gekauften NPC3-Miner ruhen, statt dessen Eigentum kostenlos umzuschreiben. Sie ist deshalb eine **illustrierende Gegenprobe für das freie Spielersparen**, kein vollkommen kapital- und flottengleiches Eigentümer-Experiment. Die `npcSave`-Variante hält dagegen Eigentümer und Startflotte identisch zur `full`-Variante und isoliert tatsächlich das Sparverhalten des NPC-Miners.

**Wichtig:** Der Spieler darf unbegrenzt sparen. Die House-Variante endet mit **4.750 ISK Spieler-Kasse** (Beginn 3.000 ISK und tatsächlich bezahlter Miner-Kauf). Diese Konzentration ist kein „Bug“, sondern ein überprüftes makroökonomisches Risiko. Auch NPC-Unternehmen dürfen Gewinne behalten, verlieren dann aber die Garantie des langfristigen, vollständig bezahlten Verbrauchs.

## Ausgeführte Tests

- Direkt ausgeführter JavaScript-Kern mit **8/8 neuen W5o-Kern- und UI-Tests** erfolgreich: R30-Isolation gegenüber R26–R29, startbezahlte Schiffe, konservative Gewinnobergrenzen, echter Verbrauch und Geldfluss, fehlende externe Rettung, fünf 90-Tage-Gegenproben, gespeicherte Spielstände und angegriffene Haushalts-/Dividenden-/Warenbücher.
- **13 feste Seeds ×90 Tage** mit zwei unabhängigen deterministischen Replays im selben Core, täglichen unabhängigen Geld-/Warenbestandsprüfungen sowie Save/Load an Tag 30, 60 und 90 vollständig **direkt ausgeführt und bestanden**.
- **Seed 42, Regel30, Tag90:** volle NPC-Kreislaufvariante 4.316 Wasser / 2 Mangelstunden / 3.221 ISK Haushalt / 33.000 ISK Weltgeld / keine Emission. Hash `244ab5ef1069a304`.
- Gegenprobe House-Sparen Seed42/Tag90: 733 Wasser / 1.794 Mangelstunden, Hash `99c32927875bd821`.
- Produktionsähnliche Oberfläche: `prototypes/w5-haushalte/index.html` (Vanilla JS, iPad-taugliche Touchflächen, fünf Szenarien, chunkweise Tagesläufe, manuelle JSON-Exporte und `loadW5O`, kein Hauptspiel-/IndexedDB-Zugriff).

**Die gesamte GitHub-Node-Regression sowie CI sind getrennt zu prüfen.** Direct-JavaScript-Ausführung ersetzt nicht das Node-22-Testkommando. Echte iPad-Safari- und NAS-Abnahme ist offen.

## Grenzen und Produktentscheidung

Der 90-Tage-Nachweis ist **nur ein kleiner, vereinfachter Kreislauf unter klar definierten Annahmen**, keine freigegebene galaktische Gesamtwirtschaft. Noch nicht vollständig bilanziert sind Wasserwerks-Anschaffung/Wartung, Hüllenverluste/Ersatz, Energie, Piratenrisiken, systemfremde Haushalte, allgemeine Steuern und weitere Rohstoff- bzw. Stationsnetze. Eine globale NPC-Ausschüttungspflicht wäre zudem eine **unbeschlossene Produktentscheidung**. Die gelungene Vollverteilung ist eine Szenariobedingung, kein Nachweis, dass die Spiel-KI diese freiwillig wählen wird.

**Nächster sinnvoller Gate:** Berechne aus den *beobachteten* Ausfallvarianten, wie viel reale Kaufkraft bei nicht erzwungenem NPC-Sparen und frei sparendem Spieler fehlt. Erst danach Entwurf einer **global begrenzten, realleistungsgebundenen Modell-B-Emissionsregel** zur ausdrücklichen Nutzerentscheidung – keine automatische Integration. Das Versorgungssystem darf nicht individuelle Kontostände aufstocken, nur weil sie leer sind.
