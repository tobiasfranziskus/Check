# W5s-k – reale Speditionskasse, Erz-/Eisfracht und Wiederbeschaffungs-Gate

**[DRAFT/ANALYSE · 06.11.2026]** Gestapelt auf W5s-j #213, in der separaten R32-Forschungswelt. Keine Änderung an `main`, Regel 14, Schema 8, bestehenden Speicherständen oder der parallelen Legacy-UI-Arbeit #207. Keine Preisänderung, keine neuen ISK, keine Gratisflotte und keine neue Produktionsware.

## Testbare Hypothese

W5s-j belegt einen echten Starterminer-Kauf, zwei neu hergestellte Miner, zwei Frachter und 21 Eisfahrten/1.050 Wasser, aber bei 365 Tagen **0 ISK Speditionskasse**. Eine positive Einzel-Frachtmarge darf nicht mit einem profitablen und eigenständig erneuerbaren Konzern verwechselt werden.

## Umsetzung

Ein neues **rein lesendes** `m_core_index.w5sFinanzStatus(state,rules)` rekonstruiert die tatsächlichen Speditionskonten aus denselben Core-Belegen:

`Anfangs-ISK + W3-Erzfrachtumsatz + W5n-Eisfrachtumsatz − W3-Pilotenarbeit − W5n-Pilotenarbeit − wirklich gekaufte Frachterhüllen − bezahlte W5s-Überführung − tatsächlich ausgeschüttete Dividenden = freie Speditions-ISK + noch gebundene Treuhand-ISK.`

Der Status gibt für genau einen bestehenden R32-Snapshot zusätzlich die konkreten Nachfolgekosten **810 ISK Frachter + Überführung**, die echte Käuferkasse für eine weitere **W3-50-Erz-Fracht** und eine Eisfracht, die physisch gekaufte Erzmenge, getrennte Eis- und Erzaufträge und die derzeitigen validierten W5s-Werft-/Erzgates aus. Keine Auszahlungs- oder Produktionsfunktion und kein zweiter Simulationskern. Eine ungültige Kontorekonstruktion wird als `ok:false` gemeldet.

Die Testmatrix verwendet 13 Seeds × 90 Tage und Seed42/7 ×365 Tage sowie Save/Load, deterministische Doppelreplays und tägliche unabhängige Weltgeld-/Warenprüfungen. Kontrollierte Varianten ändern **nur** die bereits existierenden Forschungsoptionen Vorlauf 2/7/30 Tage, `retainFleetEarnings` und das W5o-Szenario `npcSave`; sie erzeugen keinerlei neue ISK.

## Ausgeführte W5s-k-CI

**[TEST] [Node22-CI #42198522047](https://github.com/tobiasfranziskus/Check/actions/runs/42198522047), Head `1dcccf42`: 5/5 Testgruppen erfolgreich, 0 fehlgeschlagen, 0 übersprungen.** Die neue Finanzprojektion rekonstruiert die verfügbare Speditionskasse auch mit laufender W3-/Eis-Arbeits- und Werftbestell-Treuhand korrekt. Ausgeführt: 13 feste Seedwelten ×90 Tage mit unabhängigen täglichen ISK-/Warenaudits, Seed42/7 vollständige deterministische 90-Tage-Doppelreplays, Seed42/7 ×365 Tage, Save/Load und manipulierte Kassenprobe. Zusätzlicher fünfteiliger Kapital-/Vorlauf-Gegenversuch über Seed42 und Seed7 mit ausschließlich vorhandenen Regeln, 0 ISK Emission.

Der **erste W5s-k-CI-Anlauf** hatte 4/5 erfolgreiche Gruppen und scheiterte beim Dreitagesbericht an einem optional noch nicht angelegten R32-Zuordnungsarray im *Testformat*. Die Test-Auswertung behandelt es jetzt wie die bereits vorhandenen W5s-Tests als leere Liste; **keine** Simulationsdaten, Regeln oder Referenz-Hashes wurden angepasst.

### Vollständiger belegter Speditions-Cashflow, Seed42/7 Tag90 (W5s-j-Forschungsprofil, 30 Tage Vorlauf)

| Tatsächlich gebuchter Vorgang | ISK |
| --- | ---: |
| Anfangskasse transport | +2.000 |
| W3-Erzfrachtumsatz, eine vollständig abgerechnete 50er-Charge | +240 |
| W5n-Eisfrachterlöse, 21 abgeschlossene Fahrten | +5.040 |
| Bezahlte W3-Flugarbeit | −120 |
| Bezahlte Eis-Flugarbeit | −2.520 |
| Drei echt gekaufte Frachterhüllen inklusive R32-Start | −2.250 |
| Wirklich bezahlte Frachterüberführungen | −120 |
| Aus realisierten Gewinnen ausgezahlte Speditionsdividenden | −2.270 |
| **Endkasse / gebundene Speditionsmittel** | **0 / 0** |

**Operative Marge** aus diesen Güterfahrten: 2.640 ISK *vor* Hüllen, Überführungen und Dividenden. Der tatsächlich vollständige Cashflow ergibt exakt 0 ISK und erfüllt die unabhängige Welt-ISK-Bilanz von 33.000 ISK. Ein weiterer gekaufter Frachter samt Überführung kostet **810 ISK** und bleibt damit ungedeckt.

**Engpass ist nicht schlicht „kein Käufergeld“:** Nadir besitzt am Tag90 2.640 ISK. Ein W3-Auftrag über 50 Erz verlangt 740 ISK Waren-/Frachtkaufetat und 120 ISK eigene Speditions-Pilotenreserve. Damit sind zwar die 740 Käufer-ISK vorhanden, aber die Spedition hat **0/120 ISK Flugmittel**. Für weitere Eisfracht stehen dieselben 0/120 ISK eigener Flugmittel einer rechnerisch bezahlbaren Nadir-Kasse gegenüber. Der separate Werftplan zeigt `abnehmer_unfinanziert`; ohne reale Ersatznachfrage genehmigt der Werkplan keine neue Lieferung (Erzplan `kein_finanzierter_bedarf`). Die Firma `npc3` hat nur 450 ISK und kann auch keinen neuen 660-ISK-Miner-/Flugvertrag vorfinanzieren. Daher **kein zweiter W3-50-Erz-Kauf/-Transport in 90/365 Tagen**, kein selbsttragender Wiederanlauf.

### Kontrollierter 90-Tage-Vergleich ohne neue ISK

| Forschungsprofil | Eisfahrten | Bezahltes Wasser | Verkaufte W5-Neuhüllen | Spedition Tag90 |
| --- | ---: | ---: | ---: | ---: |
| 30 Tage Vorlauf, Gewinnrücklage an, `full` | 21 | 1.050 | 4 | 0 ISK |
| 7 Tage Vorlauf, Gewinnrücklage an, `full` | 53 | 2.650 | 5 | 0 ISK |
| 2 Tage Vorlauf, Gewinnrücklage an, `full` | 57 | 2.850 | 5 | 0 ISK |
| 30 Tage Vorlauf, Rücklage aus, `full` | 23 | 1.150 | 3 | 560 ISK |
| 30 Tage Vorlauf, Rücklage an, `npcSave` | 17 | 849 | 5 | 0 ISK |

**[ANALYSE]** Die bisher für rasche Selbstversorgung gewählte **30-Tage-Vorlauffrist** ist kein nachgewiesenes Qualitätsoptimum. 2 Tage erhöhen die wirklich bezahlte Wassermenge gegenüber 30 Tagen auf 2.850 (+1.800), obwohl beide Varianten nach 90 Tagen den finanzierten Folgekreislauf nicht fortsetzen können. Der Vergleich ist durch die vereinfachte identische 13-Seed-Mengenwelt limitiert und beweist **keine** tragfähige Marktregel oder allgemeinen Stabilitätsgewinn. Auch die Variante ohne Gewinnrücklage erreicht keinen zweiten W3-Erztransport. Eine frühere/erzwungene Auszahlung ist kein kostenloses Ersatzfinanzierungskonzept.

## Negatives Folge-Gate und nächster Schritt

Das W5s-k-Ziel einer *mehrfach wiederholbaren*, automatisch finanzierten 50-Erz-Logistik ist **noch nicht erfüllt**. W5s-k belegt stattdessen den genau zugehörigen, reproduzierbaren Kapitalpfad und verifiziert, dass Betriebsmarge ≠ frei verfügbares Kapital. Als nächstes die **Kapitalallokation aus tatsächlich gebuchten Speditionserträgen** und die Terminierung von Hülleninvestitionen getrennt prüfen, dabei einen vollständig finanzierten zweiten W3-Transport als positives Einzelgate verlangen. Der experimentelle Vorlauf von 2/7/30 Tagen muss an realen Ersatzterminen und vollem Folgecashflow abgenommen werden, nicht an bloßen Hüllenzählungen. Etwaige neue Preise oder Geldmodell-B-Emission nur nach gesonderter Nutzerfreigabe. Kein `main`-Merge, Deployment, iPad-Safari-/NAS-Test oder Änderung von `docs/ROADMAP.md` und dem parallel bearbeiteten Dokumentschnitt #201 durch diesen Forschungsschritt.

Die [vollständige JavaScript-Regressions-CI](https://github.com/tobiasfranziskus/Check/actions/runs/42198522129) ist vom gezielten W5s-k-Gate getrennt zu beurteilen; ihren Abschluss nicht vorwegnehmen.
