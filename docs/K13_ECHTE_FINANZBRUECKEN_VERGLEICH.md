# K13 – Zwei tatsächlich gebuchte Finanzierungsbrücken für eine vorhandene Eisfracht

**[DRAFT / ANALYSE – 13. November 2026]** [Draft-PR #328](https://github.com/tobiasfranziskus/Check/pull/328) auf dem K12-Forschungsbranch [#327](https://github.com/tobiasfranziskus/Check/pull/327). Keine Änderung am produktiven `main`, `index.html`, `aphros-void.html`, Regel195, K7-/Regel200-Originalkern, Verkaufspreisen, normaler Spielsimulation oder Nutzer-Saves. K13 läuft ausschließlich in den neuen Dateien `tools/k13-finanzbruecke.mjs` und `tests/k13-zwei-echte-finanzbruecken.test.mjs`.

## Prüfziel / realer Ursprung

K12 hatte auf zwei unabhängigen Krisenseeds 42/7 nach acht original finanzierten W1→W5-Industriezyklen (K10) nachgewiesen, dass Aldera bereits **52 tatsächlich bezahlte Eis** besitzt. Nadir hat **3.440 ISK**, kann die Originalrechnung über **490 ISK** bezahlen (250 Ware + 240 Fracht), aber die Spedition hat **46 ISK** statt der original **120 ISK** Crew-Arbeitsreserve. Damit wird `shipFreightIce` korrekterweise abgelehnt, ohne Geld oder Waren zu verändern.

K13 beantwortet die engere, **nicht produktentscheidende** Forschungsfrage: Lässt sich dieser eine real erforderliche 50-Eis-Auftrag mit zusätzlichen **vollständig gedeckten, gegengebuchten und unterschriebenen** Forschungs-Vorgängen so finanzieren, dass der **unveränderte Originalkern** tatsächlich 50 Eis überführt, 120 Pilotenminuten bezahlt, 240 ISK echten Frachtumsatz ausliefert, nach Nadir transportiertes Eis zu Wasser verarbeitet und alle Eigentums-/Waren-/Kassenaudits besteht?

## Implementierte Forschung, keine neue produktive Regel

Der Adapter legt erst nach einer **expliziten Unterschrift** des korrekten Berechtigten einen neuen, von der Originalwelt abgeleiteten **atomaren Save/Load-Forschungszustand** an. Er trägt jede Kapitalbuchung als vollständige K1-Doppelbuchung in `owners`, `kanon.netto`, `kanon.buch.summen` und `kanon.buch.belege` ein. Das erzeugt **keinen Umsatz und keine Löhne durch die Finanzierungsbuchung**. Danach ruft er ausschließlich den originalen `w.execute({type:'shipFreightIce',...})` auf, prüft Originaltreuhand und `w.audit`. Ohne Eigentümerrecht, Deckung oder frei verfügbaren echten Frachter wird **kein neuer Zustand** freigegeben.

Die Schlussabrechnung erfolgt erst nach der physischen Original-Hin-/Rückreise, nachgewiesener 50-Eis-Lieferung, exakt **120 wirklich gezahlten Pilotenminuten**, originalem 240-ISK-Frachtumsatz und geleerten Original-Fracht-/Lohntreuhanden. Ungedeckter Vorabbeginn, vorzeitiger Abschluss, ungültige Eigentümersignatur und doppelte Schlusszahlung sind abgewiesen; Forschungsbelege werden zusätzlich zum bestehenden Kern manipulativ geprüft.

| Gebuchte Originalleistung / Kontoeffekt | A – Nadir-Kundenvorschuss | B – freiwillige Eigentümereinlage |
| --- | --- | --- |
| Rechtmäßiger Unterzeichner | `st_nadir`, echter Kunde | `eigner_transport`, eingetragener Eigentümer |
| Eigenständige erste K1-Gegenbuchung | **120 ISK Nadir → Spedition** | **74 ISK Privatkonto → Spedition** |
| Originale Waren-/Frachtauftragsrechnung | 490 ISK Nadir → Originaltreuhand | 490 ISK Nadir → Originaltreuhand |
| Originale Flugarbeitstreuhand | 120 ISK Spedition → Crewtreuhand | 120 ISK Spedition → Crewtreuhand |
| Originales 50-Eis-Lieferereignis nach 60 Min. | ja | ja |
| Wirklich bezahlte Pilotenminuten für volle Rundfahrt | **120** | **120** |
| Originale Frachtererlöse bei Rückankunft | **240 ISK** | **240 ISK** |
| K13-eigene Schlussbuchung | **120 ISK Spedition → Nadir** (Vorschuss zurück) | keine Rückbuchung; echte Kapitalbindung |
| Speditionskasse direkt nach Abschluss | **166 ISK** | **240 ISK** |
| Eigentümerhaushalt direkt nach Abschluss | **261 ISK** | **187 ISK** |
| Gemeinsame Kasse Spedition + Eigentümer | **427 ISK** | **427 ISK** |
| Zusätzlich physisch gelieferte Eis | **50** | **50** |
| Zusätzlich produziertes Wasser bis Ende des 70-Minuten-Replays | **50** | **50** |
| Original-W5n-Treuhandreste | **0 ISK** | **0 ISK** |
| Weltgeld / Schöpfung / Vernichtung | **33.000 / 0 / 0 ISK** | **33.000 / 0 / 0 ISK** |

**A – Liquiditätsvorbehalt:** Der Adapter setzt vor dem **unveränderten Originalauftrag** 120 ISK Kundenvorschuss in die Speditionskasse und bucht anschließend weiterhin die volle 490-ISK-Originalrechnung in Nadir. Der Kunde benötigt dadurch **vorübergehend 610 ISK Kassenliquidität** (490 + 120), obwohl sein **endgültiger Nettoaufwand** nach ordentlicher Rückzahlung **490 ISK** bleibt. In beiden nachgewiesenen Krisenwelten kann Nadir diesen Betrag aus **3.440 ISK** decken. Die Variante ist **noch kein effizienter integrierter Split-Treuhandvertrag** für einen Kunden mit *nur* 490 ISK. Eine spätere Produktregel müsste die rechtmäßig gestückelte Kaution ohne Doppelsperre im Originalkern selbst implementieren und auf Storno-, Lohn-, Insolvenzfälle prüfen. Keine heimliche Produktpreis-/Tarifänderung.

**B – Sparfreiheit:** Die 74 ISK sind eine freiwillige Einzelentscheidung des identifizierten Anteilseigners. Die Forschungsversion entnimmt **niemals automatisch** Privatgeld, erzeugt keine Kapitalerhöhung als Umsatz und ändert keine reguläre Eigentümer-Dividendenpolitik. Der normale Wirtschaftskern kennt noch keinen freigegebenen `equityContribution`-Befehl; der alleinige K13-Forschungsadapter modelliert den signierten Kapitalvorgang. Die Investition bleibt echtes Unternehmenskapital, kein fingierter Warenauftrag.

## Ausgeführte Tests

[Gezielter K13-K1-Node22-Job #43409417058](https://github.com/tobiasfranziskus/Check/actions/runs/43409417058), Codehead `460ac5b8`: **2/2 Seedtests bestanden, 0 Fehler und 0 Skips**. Je Seed wurden **beide** Varianten mit realer Original-Hin-/Rückfahrt, je 120 Minuten und Nachlauf tatsächlich ausgeführt (vier vollständige finanziell geprüfte Originalfrachten). Gegenbelege: fehlende Unterschrift, falsche Partei, unzulässige Vertragsform, fremdes Schiff, doppelte Vertragsanlage, vorzeitige Freigabe, falscher Schlussunterzeichner, doppelte Rückzahlung und manipuliertes K13-Vertragsvolumen. Voller Original-`w.audit` bei Vertragsstart, Hin-/Rückflug, Abschluss, Save/Load und 70-Minuten-Hash-Replay. Geld 33.000 ISK, Mint/Burn0. Kein aktiver K13-Vertrag oder eine direkte Kassenänderung verbleibt im ursprünglichen K12-Zustand.

| Referenzhash nach Ende des Original- und 70-Minuten-Nachlaufs | Seed 42 | Seed 7 |
| --- | --- | --- |
| A – Kundenvorschuss | `9dac3b6da9cc6d9a` | `8c0665b67393a0e8` |
| B – Eigentümereinlage | `2444240efc71e3ef` | `f241dd15c9d7b964` |

**Fehlerkorrekturen während der Forschung:** Ein erster K13-Test erwartete beim Kundenkonto nur den 120-ISK-Vorschuss, obwohl der Originalkern beim Start zusätzlich **490 ISK in echter Auftrags-Treuhand sperrt**; der Test wurde korrigiert, nicht die Buchungsregel. Ein zweiter Test erwartete nach exakt 120 Minuten keinen aktiven Folgeauftrag, aber die bestehende NPC-Automatik konnte umgehend eine **neue tatsächlich gedeckte Eisfracht** auftragen. Um die beiden Finanzierungsvarianten vergleichbar zu machen, ist nur für diesen gezielten Forschungsversuch nach der ersten 720-Minuten-Eisförderung die **automatische nachfolgende Eisfracht** abgeschaltet. Der manuelle, signierte originale `shipFreightIce` bleibt voll real. Die Folgefracht ist ein potentiell positiver Anschlussbefund, **nicht** Beweis eines langfristig nachhaltigen Wirtschaftskreislaufs.

## Integrationsstatus, Risiken und nächster Test

**[ANALYSE / NICHT MAIN]** Der Adapter ist kein dauerhafter Produktions-/Save-Kern. Seine zusätzlichen Forschungsfelder `kanon.k13` und signierten Kapitalgates werden durch einen **zusätzlichen Forschungsaudit**, aber noch nicht durch eine freigegebene produktive Lade-/Befehlsschema-Migration abgesichert. Direkte Nutzung in produktiven Nutzerspeicherständen bleibt verboten. Für eine vollständige wirtschaftliche Freigabe fehlen (a) Vertragsstornos/Teilrückerstattung bei wirklich geleisteten Crewminuten, (b) Verlust und Insolvenzen, (c) Wiederholungs- und Konkurrenzaufträge, (d) 13 verschiedene 90-Tage-Szenarien, 365-/730-Tage- und Browser-/iPad-/NAS-Abnahmen.

**[NÄCHSTER FORSCHUNGSSCHRITT]** Nach echter K13-Fracht den ohne zusätzliche Rettung direkt möglichen zweiten regulären Eisauftrag auf tatsächliche Nachfrage, Budget, W5n-Originaltreuhand, Fluglohn und Produktionsabsatz prüfen. Erst danach die Produktentscheidung treffen, ob und wie **A (tarifgedeckter Kundenvorschuss)** oder **B (freiwillige Einlage)** in das eigentliche Spiel übernommen wird. Keine automatische Freigabe, kein Merge, kein Deployment.
