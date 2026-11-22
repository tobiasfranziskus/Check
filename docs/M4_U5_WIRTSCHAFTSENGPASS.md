# M4-U5 · Nach 48 Eis-Rundfahrten

**[DRAFT / ANALYSE · 22.11.2026]** Basis [`main 41ee2b8d`](https://github.com/tobiasfranziskus/Check/commit/41ee2b8d3197f91af1dcac176dd6c9c68917f076). [Der interaktive Teiltest in #570](https://github.com/tobiasfranziskus/Check/pull/570#issuecomment-7079467363) dauerte laut Bericht 16:59 Echtzeit und endete vor der 60-Minuten-Abnahme. Ein Original-JSON und der genaue Pages-Commit der Sitzung sind im Bericht nicht belegt. Der Export war für diese Arbeit nicht verfügbar.

## Reproduktion über die Standardkarriere

[Der Ablauf](../tests/m4-u5-engpass-ablauf.cjs) startet mit Seed 42 und kauft drei Miner und den Aldera-Frachter. Er beauftragt einen Eisminer und zwei Erzminer. Vor jeder der ersten 41 Eisfahrten werden bis zu zehn Einheiten Aldera-Wasser privat gekauft, danach bis zu drei. Bei leerem Eisquelllager wird entweder der vorhandene Bedarfskauf ausgeführt oder die Weltzeit regulär fortgesetzt. Nach der 48. Fahrt bringen sechs weitere Privatkäufe Alderas Kasse bis auf 2 ISK an den gemeldeten Stand. Die Spielbefehle schreiben alle Vorgänge und ihre Finanzierung ins Originalbuch. Dieser Ablauf dient der Nachstellung des Engpasses und ist keine Spielempfehlung.

| Merkmal | Teiltest #570 | Nachstellung |
| --- | ---: | ---: |
| Abgerechnete Eis-Rundfahrten | 48 | 48 · 11.520 ISK Frachttarif, 5.760 ISK privater Frachtpilotenlohn |
| Nadir-Eis und -Wasser | 130 / 118 | 130 / 118 |
| Aldera-Kasse | 511 ISK | 513 ISK |
| Firmenkasse des Spielers | 16.482 ISK | 12.263 ISK |
| Spielerflotte | 3 Miner / 1 Frachter | 3 Miner / 1 Frachter |
| Erzkäufer | Budget unzureichend | 0 von 500 ISK |
| Frachterbuchwert | 0 ISK | 0 ISK, Stilllegung im gewählten Profil deaktiviert |
| Weltzeit | Tag 17/Minute 41 laut Bericht | Minute 6.300 |
| Zwei weitere Spieltage | Handel bleibt blockiert | Bei Minute 9.180 bleiben Eisfracht, Erz-Wiederaufnahme und Frachterkauf blockiert |

Der Prüfstand hat Hash `f63f2cd09ba5a88c`, nach zwei Tagen `9b5c05cff2fa1797`. Die zusätzliche Wartezeit lässt Nadir bei 130 Eis und 118 Wasser. Die Firmenkasse fällt auf 6.523 ISK, während zwei Erzminer zusammen 5.760 bezahlte Flugminuten ohne weiteren Verkauf verbuchen. Durch die reguläre Förderpause in einer separaten Kopie kehren beide Miner binnen vier Spielstunden zum Dock zurück. Danach laufen keine Fluglöhne für diese Schiffe mehr. Die nächste Erzquote nennt den ungedeckten Exportkäufer und die nächste Eisfracht bleibt gesperrt.

## Befunde und verfügbare Entscheidungen

| Mechanismus | Geprüfter Befund |
| --- | --- |
| **Korrekte Sperre: Nadir-Lager** | Kapazität 150 Eis, Bestand 130, Platz 20. Die Fahrt braucht 50 Plätze. Nadirs 2.884 ISK reichen für die 490 ISK Kauf- und Transportkosten. Das Wasserwerk startet unter 115 Wasser. Bei 118 bleibt Eis ungenutzt. |
| **Wasserabsatz im bestehenden Spiel** | Nadir-Haushalte kaufen ortsgebunden für 14 ISK je Einheit. Im Prüfstand hat keiner der Nadir-Haushalte genügend Geld für eine Einheit. Der freiwillige Privatkauf für 16 ISK verbraucht Aldera-Wasser und finanziert Aldera. Er räumt physisch keinen Platz in Nadir frei. Die bestehende Wasser-Rückladung braucht bereits eine gestartete Eisfahrt, Alderas Kauf- und Frachtgeld und Platz im Aldera-Lager. Nadir-Wasserverkauf bzw. Abholung sind für den Spieler keine eigenständigen Angebote. |
| **Kleinere Lose und andere Eisabnehmer** | Der Rundfrachtbefehl verwendet die fest konfigurierte Menge von 50. Ein `menge`-Parameter wird abgewiesen. Die Sprungtorvariante erfordert einen Anflugbeleg und verwendet danach dieselbe Eisfracht. Der lokale Eisverkauf zahlt aus Aldera und speist den bereits gefüllten Quellpuffer. Ein zweiter Eis-Endabnehmer steht in dieser Karriere nicht zur Wahl. |
| **Erz und Industrie** | Aldera kann 500 ISK für Erz aufbringen, der lokale Erzauftrag braucht zusätzlich einen gedeckten Exportkäufer. Die unabhängige Industriefracht verwendet Nadirs Kasse und Asterions Frachter. Beide Erzstationen haben im Prüfstand 0 Erz, die normale Industriefracht verlangt 50 bereits vorhandene Einheiten. Der vorbestellbare Industrievertrag verlangt Nadirs Auftrag, Schiffe und Zustimmungen der beteiligten Unternehmen. Der Umfang entspricht dem Rechtebefund aus [#565](https://github.com/tobiasfranziskus/Check/pull/565). [#568](https://github.com/tobiasfranziskus/Check/pull/568) öffnet davon unabhängig den lokalen Erzauftrag. |
| **Ersatzbeschaffung** | In Aldera und Nadir liegt keine kaufbare Frachterhülle. In diesem Lauf wurden keine Industrie-Erzfahrten, Raffineriechargen oder Werfthüllen verbucht. Eine vorhandene Nadir-Hülle wäre regulär für 750 ISK kaufbar und weiter nur mit gedeckter Überführung und freier Route in Aldera einsetzbar. Bei 0 Buchwert entscheidet die Stilllegungsregel des Profils. Die Standardkarriere lässt die Hülle weiterhin zu, der Auftrag endet schon an der Lagersperre. |
| **Verhaltensfehler im laufenden Erzauftrag** | Beide Miner behalten den Förderauftrag und bleiben nach Erlöschen der Endnachfrage ohne Erzvertrag im bezahlten Flugdienst. Die Auftragsprüfung bei Beauftragung schützt den späteren Folgeumlauf nicht. Der reguläre Stopp beendet den Flugdienst nach Rückkehr. Der Draft meldet das Kostenrisiko und zeigt die vorhandene Förderpause. Ein automatischer Rückkehr- oder Wartezustand braucht eine eigene Kernkorrektur mit Prüfung laufender Aufträge und Treuhandgelder. |
| **Darstellungsfehler** | Eis- und Erzaufträge werden in Auftragszentrale, Karte und Flotte kenntlich gemacht. Die Handelsübersicht bevorzugt einen ausführbaren Frachter vor einem gesperrten. Lagerplatz, Wasserabsatz und Käuferfehlbeträge stehen beim jeweiligen Auftrag. Jüngste Frachtbelege stehen oben, ältere bleiben aufklappbar. |

Die Industrieanalyse [#490](https://github.com/tobiasfranziskus/Check/pull/490) belegt unter S02 Produktion, Verkäufe und regulären Ersatz noch an Tag 730. Andere der 13 Politiken stagnieren. Das dortige 750-ISK-Verkaufsangebot im S03-Lauf setzt eine vorhandene Hülle und eine echte Kaufentscheidung voraus. In der hier geprüften Standardkarriere fehlt die Hülle bereits. Der separate Forschungsstart ist kein Fortsetzungsweg für den bestehenden Spielstand.

## Geprüfte Optionen für eine spätere Entscheidung

1. **Erzpendel bei fehlender Anschlussabnahme sicher zurückführen und im Dock warten lassen.** Die nachgewiesene manuelle Pause beendet die laufenden Kosten. Für eine automatische Korrektur müssen begonnene Verträge ihre Ware, Treuhand, Flugreserve und Löhne behalten. Der Test muss zusätzlich einen laufenden Auftrag über Save/Load und die spätere Fortsetzung bei gedeckter Nachfrage abdecken.
2. **Eigenständige, bezahlte Wasserabholung für Aldera.** Im Prüfstand passen 12 Wasser in Alderas vorhandenes Lager. Zum bestehenden Satz von 14 ISK für Ware und 1 ISK für die Rückbeförderung je Einheit ergäben sich 180 ISK aus Alderas vorhandenen 513 ISK. Ein eigenständiger Auftrag braucht außerdem eine gedeckte Hin- und Rückfahrt und einen freiwilligen Auftraggeber. Schon vier Einheiten Absatz erlauben der Fabrik grundsätzlich einen Start. Drei Chargen zu je 10 Eis müssen fertig werden, damit wieder 50 Plätze für Eis frei sind. Ohne weiteren Absatz wären dafür insgesamt mindestens 24 Wasser aus Nadir abzunehmen. Die einzelne 12er-Lieferung reicht daher nicht für die nächste volle Eisfracht.
3. **Variable Eisfracht mit gedecktem Rundtarif.** Im Prüfstand passen 20 Eis. Bei 5 ISK je Einheit und dem unveränderten Rundtarif von 240 ISK hätte Nadir 340 ISK zu binden, der Spieler 120 ISK Fluglohn. Das füllt Nadir auf 150 von 150 und wiederholt sich ohne Wasserabsatz nicht. Vertragsmenge, Reserven, Torvariante und Replay-Audit bisheriger 50er-Belege wären separat abzusichern.
4. **Nadir vergibt bei echtem Bedarf einen Erzvertrag an einen freien Hausfrachter.** Der Originaltarif bindet 740 ISK in Nadir und 120 ISK Fluglohn beim Frachtunternehmen. Diese Geldbeträge sind im Prüfstand gedeckt, ebenso Alderas 500 ISK für eine Erzcharge. Es fehlen das lieferbare Erz und das Vertragsrecht für den Hausfrachter. Ein Auftrag braucht die freiwillige Zusage der jeweiligen Rechtsträger, eine prüfbare Beschaffung vom Feld bis zur Abnahme und einen freien Waren- und Flugpfad. Ein gezielter Industrievertrag könnte eine neue Managemententscheidung eröffnen. Ersatz entsteht erst aus tatsächlich finanziertem Erz, Material, Werftarbeit und einem späteren Verkauf.

## Nachweise

- Der [Regressionstest](../tests/m4-u5-wirtschaft.test.mjs) prüft 33.000 Welt-ISK, null Emission/Senke, alle Warenbestände, unveränderte Schiffseigentümer, zwei Tage Zeitfortschritt, atomare Ablehnungen, Förderpause, Originalhashes und den bytegleichen Save/Load-Roundtrip.
- Die [Browserprüfung](../tests/m4-u5-browser.cjs) lädt den nachgestellten Export von der lokalen HTTP-Root in ein frisches Profil, prüft Sperrtexte, Belege, Touch bzw. Tastatur, die echte Förderpause sowie Fortsetzen nach Reload. Die vier Zielgrößen sind 1180×820, 1024×768, 820×1180 und 390×844.
- Die Änderungen lesen bestehende Zustände, Preise und Angebote. Sie führen keine Wirtschafts- und Save-Regeln ein. Eine neue Langzeitmatrix ist vor einer Umsetzung der Regeloptionen fällig. M4-U4, physisches iPad Safari und privates NAS bleiben offen.
