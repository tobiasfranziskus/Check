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

**Status:** Forschungs-Draft, CI ausstehend. Kein Merge/Deploy und keine Freigabe einer Wirtschaftsregel. Alt-Saves, Regel204/207, Referenzhashes und echte iPad-/NAS-Hardwareabnahme unberührt.
