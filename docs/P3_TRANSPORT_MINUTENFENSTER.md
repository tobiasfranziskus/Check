# P3 – Minutenauflösung des Original-Transportengpasses

**[DRAFT / FORSCHUNG · 18.11.2026]** Getrennt von der integrierten [Anzeige #503](https://github.com/tobiasfranziskus/Check/pull/503). Start: `main 97214df1`; **keine** Anpassungen am Weltkern, NPC-Disponenten, Angebot, UI, Save, Geld, Waren oder der veröffentlichten Version.

## Falsifizierbare Frage

Die [Vorprüfung #501](https://github.com/tobiasfranziskus/Check/pull/501) hat bei 145 Original-W5ac-Angeboten im Abstand von **10 Wirtschaftsminuten** kein erlaubtes Fenster für den physisch gebauten und für 750 ISK gekauften zweiten Spielerfrachter `sh010` gefunden. Könnte ein tatsächlich bezahlbares Angebot dazwischen liegen?

Der neue Node22-Versuch verwendet ausschließlich die bereits integrierte Seed42/S02/Regel204-Mehrschiff-Fixture mit neun echten F4-Eisrunden und Originalkauf `sh010` bei Minute 3160. Anschließend läuft **jede der 1.440 Original-Minuten bis Minute 4600**, getrennt von `main`, vollständig mit der vorhandenen Minute-Funktion. Bei **1.441 Prüfzeitpunkten** werden drei konkurrierende aktive Originalaufträge W3, W5n und W5ac sowie die **unveränderte Original-W5ac-Kalkulation** geprüft. Zusätzlich: genaue Übergänge, Zähler, Firmenkassen, W3/W4/W5-/Geld-/Waren-/Eigentums-Audit und Original-Save/Load in 120-Minuten-Abständen. Endhash muss sich exakt mit #501 decken: `2454761bd83b9c95`.

Der Test erwartet **kein** echtes freies Minutenfenster. Falls ein einziger legal finanzierter Slot existiert, wird diese Erwartung bewusst **rot**: Dann ist ein praktischer originalkonformer Spielerweg statt einer Balancingänderung zu untersuchen. Vor CI-Abschluss sind die Zahlen ausschließlich **Prüfziel, kein Ergebnis**.

## Architekturursache

In `prototypes/welt/welt-kern.js` führt `wirtschaftsMinute()` nach der Originalsimulation am Ende desselben Ticks `m_core_disponent.schritt(state)` aus. Der NPC-Disponent versucht nacheinander bereits originär finanzierte W5ac-Überführungen, W3-Erzfracht und W5n-Eisfracht. Ein externer J8-Spielerbefehl kann nur **zwischen** vollständigen Wirtschaftsminuten abgegeben werden und seine Signatur wird im Originalkern erneut geprüft. Damit hat der NPC bei End-of-Tick-Freigaben potenziell systematisch den ersten Zugriff. Dieses Scheduling ist kein Beweis, dass jeder denkbare Seed blockiert bleibt.

## Entscheidungsvorbereitung, noch NICHT aktiviert

Erst nach positiver/negativer Minutenprüfung wäre eine **eigene, ausdrücklich zu beschließende** Fairnessregel zu prüfen: ein endliches FIFO-Auftragsfenster nur für vollständig finanzierte und nach Eigentum/Waren/Route qualifizierte Überführungen, ohne bestehende NPC-Fracht zu stornieren. Auch ein freies Zeitfenster begründet **keinen** geschenkten Transport und **keine** Garantie für Warenverkauf, Finanzierung oder wirtschaftliche Stabilität. Vor einer Produktänderung erforderlich: unabhängige Negativtests auf Import-/Save-Manipulation, keine Prioritäts-Starvation anderer Besitzer, deterministischer Replay/Hash, gültige Abschreibungen, 13×90- und lange Krisenläufe, Chromium/WebKit je vier Touchgrößen und NAS-Sicherheit.

## Ergebnis der unabhängig ausgeführten Originalprüfung

**[ANALYSE / reproduziert am PR-Head `d71d3ea1` · 18.11.2026]** Die beiden tatsächlich ausgeführten und vollständig erfolgreichen CI-Workflows [JavaScript-Gesamtregression #44352489509](https://github.com/tobiasfranziskus/Check/actions/runs/44352489509) und [W5-RC1 #44352489695](https://github.com/tobiasfranziskus/Check/actions/runs/44352489695) bestätigen **533/533 Node22-Tests**, 0 Fehler, Root-/Touch-Preflight und NAS-Singlefile-Build. Der neue Minutentest ist in den Original-Jobs ausgeführt und gibt in beiden Läufen exakt dasselbe Ergebnis aus.

| Originalbelegung des einen Korridors | Zahl der beobachteten Minutenpunkte |
| --- | ---: |
| W5n-Eisfrachten | **1.189** |
| W3-Erzfrachten | **192** |
| W5ac-Überführungen | **60** |
| Freie Punkte | **0** |
| Mehrfachbelegung | **0** |
| Insgesamt: Weltminute 3160–4600 einschließlich | **1.441** |

**Umschaltungen ohne eine einzige beobachtete freie Minute:**

| Ab Weltminute | Bis einschließlich | Kontinuierlich belegende Auftragsart |
| ---: | ---: | --- |
| 3160 | 3184 | W5n-Eisfracht |
| 3185 | 3376 | W3-Erzfracht |
| 3377 | 4216 | W5n-Eisfracht |
| 4217 | 4276 | W5ac-Überführung `sh011` (NPC) |
| 4277 | 4600 | W5n-Eisfracht |

Die 1.441 Original-W5ac-Kalkulationen für die bereits voll bezahlte zweite Haus-Hülle `sh010` wurden **alle** mit `Noch aktive W3-Fracht oder Ueberfuehrung` abgelehnt, wie in #501. Der Core konnte **kein einziges gültiges `reposition-sh010`-Angebot** erzeugen. `sh010` verblieb rechtmäßig in Nadir, `sh004` beim selben Besitzer in Aldera; die neun zuvor finanzierten F4-Abschlüsse blieben intakt. Bei Minute 4600: `house` **5.435 ISK**, Nadir **4.740 ISK**, Weltgeld **33.000 ISK**, Mint/Burn **0**; deterministischer Endhash **`2454761bd83b9c95`**, **identisch** mit dem Zehn-Minuten-Replay aus #501. Alle vorhandenen Geld-/Waren-/W3–W5-/Eigentums- und JSON-Save/Load-Audits bestanden.

**Interpretation:** Das untersuchte Seed42/S02-Regel204-Szenario besitzt hier keine 1-Minuten-Lücke; das ist ein direkter Originalbefund, **kein** Beweis für jede andere Seed-/Krisenwelt. Ein langfristiger wirtschaftlicher Erfolg oder eine zweite F4-Runde mit `sh010` wurde gerade **nicht** bewiesen.

## Konsequenz für die Produktentscheidung

Um an dieser Stelle eine zweite rechtmäßig finanzierte Überführung zuzulassen, müsste sich die Original-Disposition verändern: z. B. **eine ausdrücklich beantragte, authentifizierte, eigentumsgeprüfte und vorfinanzierte Warteposition** für den Spieler vor der nächsten NPC-Zuteilung. Unterschriebene laufende NPC-Verträge bleiben unverändert und werden vollständig abgearbeitet; danach erfolgt Kapazitätszuteilung nach dokumentiertem deterministischem Verfahren. Die Alternative eines nur manuell auslösbaren Wartestatus darf den NPC nicht unbeschränkt aushungern. Eine solche Prioritäts-, Save- und Regeländerung braucht **eine gesonderte Grundsatzfreigabe und eigenständige Sicherheits-/Langzeitprüfungen**. Diese Forschungs-PR aktiviert bewusst **keinen** solchen Mechanismus.

**Status:** Unabhängig getestet, ausschließlich **ANALYSE / DRAFT**, kein Merge und kein Produkt-Deployment. Alt-Saves, Regel204/207, Referenzhashes und echte iPad-/NAS-Hardwareabnahme unberührt.
