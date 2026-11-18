# P3 – Zweiter eigener W5-Frachter: vollständig originale F4-Folge nach bezahlter W5ac-Überführung

**Forschung / noch nicht für main freigegeben · 18.11.2026.** Draft-Stack [#505](https://github.com/tobiasfranziskus/Check/pull/505) (Original-Minutenblocker) → [#506](https://github.com/tobiasfranziskus/Check/pull/506) (experimentelles bezahltes W5ac-Fenster) → **#507** (experimentelles anschließendes F4-Fenster). Kein Produkt- oder Save-Upgrade. `main`, Root/Pages und Standard-Browserbetrieb bleiben unverändert.

## Aufgabe und vorhandenen Code wiederverwenden

Der Spieler besitzt zwei echte, nachweislich aus der Nadir-Werft für je 750 ISK gekaufte W5-Hüllen: `sh004` hat bereits neun vollständig bezahlte Original-F4-Runden abgeschlossen; `sh010` wird nach Anmeldung bei Tick 3160 durch den in #506 untersuchten **unveränderten, vollständig autorisierten** W5ac-Weltbefehl mit 60 ISK Pilotenlohn von Nadir nach Aldera überführt (3377–3437). Der NPC bekommt vor dem nächsten Spielerauftrag wieder nachweislich eine echte Fracht.

Die einzige neue Forschungsschnittstelle ist `p3ForschungsFrachtAnmeldung(state,schiff,laufzeit)` in einer **Node22-only / `APHROS_P3_FAIR_FERRY_RESEARCH=1`**-Welt; verfügbar nur in exakt dem Forschungsbranch. Nur aus der originalen W5-Verkaufsliste stammende, eigenbesessene, authentisch überführte, leere, angedockte Aldera-Hüllen dürfen sich vormerken. Eine eigene 2. F4-Runde wird **nicht** aufgrund von Eigentum, Schiffsauswahl oder Queue-Eintrag automatisch angenommen: Beim nächstmöglichen Slot muss `kern.pilotIceFreightQuote` vollständig grün sein; anschließend führt ausschließlich `welt.execute({type:'shipFreightIce',owner:'house',schiff:'sh010'})` die vorhandene Originaltransaktion aus. Eine bestehende NPC-Fracht wird weder abgebrochen noch rückdatiert; nach dem Spielerauftrag muss der NPC wieder vorgehen. **Keine kostenlosen Waren, kein neuer Käufer, keine Sonderpreise, keine simulierte 50er-Ladung, keine zusätzliche Geldemission.**

## Positiver Originalbefund aus der ersten CI-Diagnose (noch nicht Gesamt-QA)

Der erste positiv angelegte Node22-Test ist bis zum **wirklich beendeten** Spieler-F4-Auftrag vorgedrungen. Der Gesamtjob **war dennoch rot**, weil er zwei globale Geld-/Warenaggregationen fälschlich der einzelnen Spielerfracht zurechnete; die neuen Tests wurden deshalb fachlich präzisiert. Die aus dem originalen Testprotokoll [JavaScript #44386044995 bzw. W6-Lauf](https://github.com/tobiasfranziskus/Check/actions/runs/44386044995) abgelesene Originalsequenz:

| Ereignis | Weltminute / Originalbetrag |
| --- | --- |
| Antrag `sh010` auf eigene F4 nach NPC-Rückkehr | **3438** |
| Original-F4-Vertrag durch den Weltkern gestartet | **3557** |
| Nadir: Echtes Eis + echte Fracht tariflich vorfinanziert | **490 ISK** auf `w5n_fracht_kauf` |
| Hauseigene echte 120 Minuten Pilotenarbeit vorfinanziert | **120 ISK** auf `w5n_fracht_arbeit` |
| 50 originale Einheiten Eis an Nadir geliefert | **3617** |
| Originalsignierte Rückfahrt und Frachtgebühr abgeschlossen | **3677** |
| Spieler-F4-Vertrag `sh010` | **50 Eis / 240 ISK Frachtgebühr / 120 ISK Pilotenlohn** |
| Spieler-F4-Gesamtanzahl | **9 → 10**, ohne Parallel-Doppelauftrag |
| Geld weltweit, Mint/Burn | **33.000 ISK**, **0 / 0** |
| Ausgang nach realen NPC-/Spieler-Minuten | Originalhash **`d3e982bdbdfb5663`** in der anfänglichen Diagnose |

**Wichtige Trennung:** In demselben Intervall stieg das Privatpiloten-Konto um **141 ISK**, nicht bloß 120 ISK, und die globale Eis-Ankunftsmenge um **100 statt 50 Einheiten**. Das sind keine zusätzlichen F4-Zahlungen von `sh010`, sondern parallele Weltaktivität; deshalb müssen Nachweise explizit auf `kanon.spielerFrachten.lohn` (+120) und `kanon.spielerFrachten.gebuehr` (+240) und den **signierten Einzelvertrag** (+50) zielen. Niemals globalen Gewinn aus einer isolierten Kontoänderung behaupten. Ein rechnerischer Frachtdeckungsbeitrag von **240 − 120 − 36 = 84 ISK vor weiteren Kosten** ist keine Vollkosten- oder Langzeitrentabilität.

## Falsifizierbare Prüfungen und verbleibende Freigabegates

- Originalgeschützter Besitzer und W5-/W5ac-Kauf- und Überführungsbeleg; falsche/andere Schiffe, Doppelanmeldungen und Import-Replay werden nicht autorisiert.
- Echter, im Original-Stationslager vorhandener Eisbestand, finanzierbarer Nadir-Einkauf und Frachttarif, echte Haus-Fracht-Arbeitsreserve, Original-Treuhandkonten und 120 tatsächliche Arbeits-/Flugminuten.
- Eindeutiger Spieler-F4-Vertrag mit Lieferung nach Minute 60, Abschluss nach Minute 120, 50 Eis, 240 ISK Gebühr und 120 ISK originalbelegtem Pilotenlohn; die übrigen NPC-Wirtschaftsbewegungen werden **nicht** fälschlich dem Spieler zugeordnet.
- Unverändertes Weltgeld, keine Geldschöpfung, echte Eigentums-/Waren-/W3–W5-/JSON-Save- und Lade-Audits und ein zweiter **vollständig identischer** Weltreplay. Die erzeugten Forschungs-Hashes ersetzen **keine** historische Referenz.
- **Noch offen:** Die Wartung ist nur eine unverbindliche, nicht vorab treuhänderisch bezahlte Node-only-Absicht und wird absichtlich nicht ins JSON geschrieben. Keine produktionsreife Save-/Load-Authentisierung, keine allgemeine Mehr-Eigentümer-FIFO-Fairness, keine Langzeit-P3-/W6-Ersatzrentabilität, keine iPad-Safari-/NAS-Hardwareabnahme. Eine künftige neue ökonomische Vorrangregel bedarf gesonderter Projektfreigabe.

## QA-Stand

Die ersten Versuche sind **als negativ/falsch gesetzte Testannahmen** dokumentiert: Zunächst wurde `sh004` fälschlich als unberechtigter Kandidat abgewiesen, obwohl es ebenfalls ein original bezahlter Nadir-Werftfrachter ist. Danach hat ein Test globale Privat-/Eis-Einnahmen fälschlich als ausschließlich Spieler-F4-bedingt modelliert. **Beide Erwartungsfehler wurden korrigiert**, ohne Originalpreis, Echtgeld, Waren, Kernbuchung, Referenzhash oder die wirtschaftlichen Bedingungen zu ändern.

**Aktueller revidierter Forschungscode verlangt:** präzise eigene Original-F4-Ledger-Deltas, Käufer- und Arbeits-Treuhand, realen Wertverzehr, identische Wiederholung und getrennte parallel laufende NPC-/Privataktivität. **CI nach dieser Revision getrennt zu prüfen; keine grünen Ergebnisse vorwegnehmen.**

**Kein Merge, keine Produktaktivierung, kein Deployment.**
