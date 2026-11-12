# K5 – weshalb K4 ab Tag 16 kein Wasser mehr verkauft

**[DRAFT / ANALYSE · 12.11.2026]** Basis ist ausschließlich K4 [PR #308](https://github.com/tobiasfranziskus/Check/pull/308), vor Arbeitsbeginn erneut geprüft auf **`3030e14890d75dd5496b88b3f254e144dd702abd`**. Eigener Branch: `research/k5-terminal-bottleneck-20261112`, PR-Ziel K4. Keine Produktfreigabe, kein Merge/Deployment, keine produktiven Spielstände.

## Ergebnis

**Die unmittelbare Ursache ist der Ausfall der zugeteilten Eisförderung, nicht fehlendes Speditions- oder Käufergeld.** Der letzte `house`-Eisminer `sh018` erreicht bei **Tick21024** seinen Verschleißgrenzwert. Die automatische Ersatzbeschaffung erhält ab Tick19632 kein neues Erz; nach Rückkehr des Miners bei Tick21035 scheitert auch der Ersatzkauf am leeren Hüllenlager. Danach läuft nur bereits produzierte/transportierte Ware aus: letzte Wasserproduktion Tick21172, letzter bezahlter Wasserverkauf **Tick21611**. Das ist keine zeitgleiche Störung des Wasserwerks bei Tick21612.

**Der Stillstand ist unter vorhandenen Befehlen überwindbar.** Vier noch nutzbare Erzminer gehören `npc3`, stehen ohne Erzauftrag in Aldera und werden vom Disponenten nicht auf Eis umgestellt. Ein begrenzter Gegenversuch mit **einem dieser eigenen Miner, eigenem Betriebskapital und genau 50 neuem Eis** schließt bis Tick21865 eine zusätzliche vollständig bezahlte Kette: **50 Eis → eine Hin-/Rückfracht → 50 Wasser → 50 tatsächliche Endkundenkäufe**. Weltgeld bleibt **33.000 ISK, Mint/Burn 0**. Kein neues Schiff, kein neuer Eigentümer, kein Geldtransfer zur Rettung von `house`, keine geänderte Politik oder Regel.

Das widerlegt einen allgemeinen Unmöglichkeitsbeweis ab Tag16. Es beweist weder dauerhafte Erzversorgung noch langfristige Ersatzfähigkeit oder W6-Stabilität. Der Versuch endet nach dieser einen Kette.

## Ausgangsprüfung und Abgrenzung

- `main` erneut geprüft: `04124f2bca27dc33b54be30c07b6a7bbb7387e81`; AGENTS.md, ROADMAP.md und PROJEKTSTATUS.md sowie K2/K3/K4-Berichte gelesen. Dokumentationshistorie ist keine Produktintegration.
- K1 #300, K2 #301, K3 #304 und K4 #308 offen und Draft. Am jeweiligen geprüften Head sind ihre K1-, W5-RC1- und JS-Workflows erfolgreich. K4-Head-CI: [K1 #43177966454](https://github.com/tobiasfranziskus/Check/actions/runs/43177966454), [RC1 #43177966228](https://github.com/tobiasfranziskus/Check/actions/runs/43177966228), [JS #43177966158](https://github.com/tobiasfranziskus/Check/actions/runs/43177966158). K1-Job und beide Browserjobs ausdrücklich completed/success; die K4-Basis hatte 330 Node22-Tests und Chromium/WebKit je vier Größen.
- Parallel offen: Cockpit #305, Head `3a65d3a1`, und K3/Cockpit-Integration #306, Head `3848bb21`; jeweilige drei Workflows grün. K5 verändert ihre Dateien nicht. #307 betrifft Projektanweisungen, #299 die Repository-Bestandsaufnahme; keine wirtschaftliche Abhängigkeit.
- Neue Messdaten und Gegenversuch sind **[ANALYSE]**, keine neue Priorisierungsregel oder Produktentscheidung. Die bestehenden Roadmap-Ziele und das offene W6-Gate ändern sich nicht; deshalb bleiben Roadmap, Projektstatus und K4-Referenzdaten in diesem begrenzten Auftrag unverändert.

## Minutengenaue Kausalkette

Zeitangabe: Tag1 beginnt bei Tick0; `Tag = floor(Tick/1440)+1`. Es handelt sich um Simulationszeit, nicht um reale Uhrzeit. Beide Seeds zeigen dieselben wirtschaftlichen Zeitpunkte.

| Tick | Simulationszeit | Beleg und Bedeutung |
| ---: | --- | --- |
| 599 / 839 | Tag1 09:59 / 13:59 | Unveränderte K4-Original-W3-Aufträge. Insgesamt drei Erzlieferungen; die letzte Anlieferung erfolgt Tick899. |
| 2930 | Tag3 00:50 | Letzte Erzförderung; kumulativ 2.150 Erz. |
| 3000 | Tag3 02:00 | Letzter Export; 2.000 Erz verkauft, Exportkonto 0 ISK. W1/W2 kann danach keine weitere exportgedeckte Erzcharge finanzieren. Das ist kein Nachweis erschöpfter Vorkommen. |
| 16176 / 16206 / 16332 | Tag12 05:36 / 06:06 / 08:12 | Letzter Minerbau beginnt / wird fertig / nach Aldera geliefert. Sieben echte Miner hergestellt und geliefert. |
| 18073 | Tag13 13:13 | Letzte W4-Charge liefert die Materialeinheiten 71–75; diese werden sofort für den achten Frachter verbraucht. Danach 0 Erz und 0 Material. |
| **19632** | **Tag14 15:12** | **Erste belegte Blockade der letzten automatischen Miner-Nachfolge:** `Miner-Erzfracht: Noch keine echte Erzcharge im Quelllager`. Die Vorlaufgrenze des letzten Eisminers löst Beschaffung aus; fehlende 50-Erz-Quellcharge verhindert W3. Das Material für einen weiteren Miner fehlt bereits. |
| 20632 | Tag15 07:52 | `sh019` verbraucht; vorhandener achter Werftfrachter als `sh020` gekauft. Der Frachterersatz funktioniert weiterhin. |
| 21012 | Tag15 14:12 | Letzter Eisauftrag beginnt, vollständig vorfinanziert. |
| **21024** | **Tag15 14:24** | **Tatsächlicher Förderausfall:** `sh018` wird nach 2.000 aktiven Minuten verbraucht. 2 Eis befinden sich an Bord, der Miner kehrt weiter bezahlt zum Dock zurück. |
| 21035 | Tag15 14:35 | Miner am Dock; verkauft die letzten 2 Eis. `Ersatzminer house: kein Komplettschiff auf Lager`. Am Dock liegen nur 2 Eis, die nächste 50er-Fracht benötigt weitere 48. |
| 21072 / 21132 | Tag15 15:12 / 16:12 | Letzte vorhandene Eisfracht liefert nach Nadir / beendet ihren Rückflug. `sh020` danach frei und leer in Aldera. |
| 21172 | Tag15 16:52 | Letzte Wassercharge fertig; insgesamt 8.400 Wasser. |
| **21611 / 21612** | **Tag16 00:11 / 00:12** | Letzter bezahlter Absatz / Diagnose-Ausgangspunkt ohne Eis-, Bau-, Flug- oder Wasserwerksauftrag. Kein neuer Absatz im unveränderten K4 bis Tag90. |

**Ursache:** gescheiterte automatische Nachfolge und anschließend Ausfall des einzigen zugeteilten Eisminers. **Folge:** Eis fehlt am Quelllager, dann dem Wasserwerk, zuletzt den Haushalten. Die häufige spätere Meldung „Kein Wasser am Wohnort“ benennt die Folge, nicht den ursprünglichen Auslöser. Ebenso ist der Verlust früherer Frachter kein Nachweis eines terminalen Frachtermangels.

## Bestände, Rechte und Auftragsfähigkeit bei Tick21612

| Ressource / Eigentümer | Tatsächlicher Stand | Fehlende Voraussetzung |
| --- | --- | --- |
| Erz weltweit | 0; 2.150 Förderung = 2.000 Export + 150 W4-Verbrauch | Für W4 mindestens 10 Erz in Nadir; Original-W3 verlangt 50 Erz in Aldera. |
| Material Nadir | 0; 75 Produktion = 8 Frachter ×5 + 7 Miner ×5 | Weitere Hülle benötigt 5 Material. |
| Eis Aldera / Eigentümer `st_aldera` | 2 | Weitere 48 bis zur bestehenden 50er-Frachtcharge. |
| Eis auf alten Minern / Eigentümer `house` | 5 stillgelegte Hüllen mit je 2 Eis =10 | Fremdes Eigentum ist kein Stationsbestand. Selbst nach rechtmäßigem Verkauf wären insgesamt nur 12 vorhanden: weiterhin 38 zu wenig für W5n. Der Gegenversuch nimmt diese Ware nicht. |
| Eis Nadir / Wasser beide Stationen | 0 / 0 | Reale neue Anlieferung fehlt. |
| Freie Miner `npc3` | `sh004/005/006/008`, Buchwerte 312/363/471/507 ISK; alle leer und in Aldera angedockt | Keine aktuellen Erzverträge; keine automatische Umstellung auf Eis. |
| `house`-Eisminer | Alle sechs Hüllen verbraucht | Kein kaufbarer Ersatzminer; keine Wiederbelebung oder Reparaturregel. |
| `transport`-Frachter `sh020` | Leer, Auftrag `halten`, Dock Aldera; 420 aktive Minuten, Buchwert 624 ISK | Original-W3/W5n lehnen am fehlenden Erz/Eis ab. 120 weitere Flugminuten sind körperlich möglich. |
| Werft-/Minerlager beider Stationen | 0 | Neue Fertigung benötigt Material; kein bereits bezahlter, wartender Miner. |

Die Originalregeln enthalten Erz-/Eisfelder, jedoch keinen endlichen Feldrestbestand, der hier leergefördert wäre. Die Förderfähigkeit wird durch vorhandene Hülle, Ort, Frachtraum, Arbeit und bei Erz zusätzlich den exportgedeckten Auftrag begrenzt. `pilotNpcKrisenLage` meldet bei Tick21612 **`absatzstopp`, `planbar=0`, `kaeuferCash=0`, `finanzierte=0`**. Aldera hat 1.100 ISK, `npc3` 1.597 ISK, freie Stations-Erzplätze 125. Die gebundene industrielle W3-Nachfrage ersetzt im vorhandenen W1/W2-Auftragsmodell den Exportetat nicht. Es gibt keinen vorhandenen gesonderten Befehl für einen Nadir-finanzierten Minervorauftrag.

**Keine versteckte Freigabe nach Wartezeit:** Queue und Erzvertragsbuch leer; W3-, W4-, W5-, Transfer-, Minerbau-/Liefer-, Eisfracht-, Wasserwerks- und Wasserrückfrachtauftrag jeweils leer. Sämtliche echten Treuhand-/Arbeitsreserven sind 0. Die Beträge der bilanziellen Ersatzrücklage sind Bestandteil des Firmengeldes und kein zusätzliches Konto.

| Eigentümer | Eigene ISK bei Tick21612 | Bilanzielle Ersatzrücklage darin |
| --- | ---: | ---: |
| `house` | 3.850 | 3.600 |
| `npc3` | 1.597 | 1.347 |
| `transport` | 6.376 | 6.126 |
| `st_aldera` | 1.100 | 0 |
| `st_nadir` | 4.560 | 0 |
| `werft_extern` | 530 | 0 |
| `export` | 0 | 0 |

Weder Nadirs 490 ISK Eis-/Frachtkaufetat noch die 120 ISK Speditionsarbeitsreserve fehlen. Für hypothetischen Minerbau hätte die Werft 500 Materialkauf +30 Arbeitslohn; `house` könnte 600 Hülle +60 Rückfracht bezahlen. **Es fehlen physisches Material und die vorgeschriebene vorgelagerte Erzfinanzierung**, nicht allgemein die Geldmenge. Ein zusätzlich gebauter Miner müsste außerdem mit einer bestehenden Eis-Rückfracht geliefert werden. Eine bloße Buchung ersetzt diesen Transport nicht.

## Begrenzter Gegenversuch: eine vollständige zusätzliche Kette

Vor der ersten Aktion prüft das Werkzeug die gesamte vorhandene Kette: `npc3` benötigt konservativ **220 ISK** (100 Förderlohn + höchstens 120 ISK Fluglohn als begrenztes Testbudget), Aldera **250 ISK** für echten Dockankauf, Nadir **590 ISK** (490 Ware/Fracht +100 für fünf Wasserchargen), Spedition **120 ISK** für beide Pilotenflüge. Die bestehenden Nadir-Haushalte haben bereits **1.626 eigene ISK** gegenüber 700 ISK Verkaufspreis für 50 Wasser. Miner- und Frachterrestwerte reichen für diesen kleinen Auftrag. Die 220 ISK sind ein Prüf-/Abbruchlimit des Werkzeugs, kein neuer Corepreis und keine Kontobuchung; tatsächliche Flugreserven nutzt ausschließlich der Original-Core.

Drei Originalbefehle, immer im Namen des tatsächlichen Eigentümers:

```text
Tick21612 shipShuttleStop owner=npc3 schiff=sh004
Tick21612 shipShuttle     owner=npc3 schiff=sh004 ware=eis
Tick21693 shipShuttleStop owner=npc3 schiff=sh004
```

Der dritte Befehl folgt exakt nach 50 **neu** gefördertem Eis; danach werden nur die bezahlten Restaufträge abgewickelt. Kein `politikSetzen`, keine direkte Zustandsänderung, kein zusätzlicher Kauf oder Hüllenbau. Der Original-W2-Krisenautomat stoppt auch diesen NPC-Miner stündlich wegen fehlender **Erz**nachfrage; deshalb kehrt er zunächst mit 38 Eis zurück. Der bestehende Eispendel startet ihn wieder. Das zusätzliche Verhalten bleibt erhalten und erklärt die zwei realen Dockverkäufe: **38 Eis bei Tick21671**, **12 bei Tick21704**. Es wird nicht durch einen Corepatch umgangen.

| Tick | Tatsächlicher Vorgang |
| ---: | --- |
| 21705 | `sh020` nimmt 50 Eis aus dem inzwischen 52er-Aldera-Bestand; 490 ISK Nadir-Kaufetat und 120 ISK Speditionslohn werden vollständig gebunden. |
| 21765 | 50 Eis wirklich in Nadir angekommen; Aldera erhält 250 ISK. |
| 21785 / 21805 / 21825 / 21845 / 21865 | Je 10 neue Wasser nach je 20 bezahlten Wasserwerksminuten. |
| 21825 | Rückflug des identischen Frachters abgeschlossen; 240 ISK Frachttarif ausgezahlt, 120 ISK Pilotenlohn vollständig bezahlt. |
| **21865** | **50 zusätzliche Wasser produziert und für 700 ISK vollständig in Nadir verkauft.** Gesamtabsatz 8.450, alle Arbeits-/Frachtreserven 0, Versuch beendet. |

### Zahlungs- und Eigentumskette

1. `npc3` zahlt **100 ISK** echte Eisförderlöhne an `fonds_aldera` sowie **42 ISK** echten Fluglohn an `pilot_npc3`. Das Eis bleibt bis zum Dockverkauf Eigentum von `npc3`.
2. `st_aldera` kauft die 50 neuen Eis für **250 ISK** von `npc3`. Kein Geld und kein Schiff wechseln von `house` zu `npc3`.
3. `st_nadir` finanziert aus eigener Kasse **490 ISK**, davon 250 an Aldera für Eis und 240 an `transport` für beide Frachtflüge. `transport` zahlt separat **120 ISK** an `pilot_eis`.
4. Nadir zahlt **100 ISK** an `w5n_arbeit` für fünf echte Wasserchargen. Vorhandene Nadir-Haushalte kaufen die 50 Wasser für **700 ISK**: Eigentümerhaushalt Nadir 434, Eigentümerhaushalt Werft 182, Wasserwerksarbeiter 84 ISK. Dem Arbeiter bleiben von den neu ausgezahlten 100 ISK noch 16.
5. Kassenänderungen zum Ausgangssave: `npc3` **+108**, Spedition **+120**, Nadir **+110**, Aldera **0**, `house` **0**, Werft **0**, Export **0**. Alle weiteren Gegenkonten stehen in der JSON-Ausgabe. Die Verschleißwerte laufen weiter: `sh004` endet mit Buchwert **285** statt312, `sh020` mit **588** statt624. Es wird kein neues Schiff benötigt.

### Grenzen und zusätzliche spätere Engpässe

Diese eine Kette versorgt **Nadir**. Auf der zugehörigen Rückfahrt liegt noch kein neues Wasser für Aldera vor; der Gegenversuch behauptet keine zusätzliche Aldera-Versorgung. Aldera-Nachfrage und Rückfracht benötigen spätere reale Fahrten. Vier nutzbare Miner und ein Frachter sind endliche Vermögensbestände mit weiterem Verschleiß; zusätzliche Ketten oder neue Ersatzproduktion wurden nicht untersucht. Erz-/Materialneubeschaffung bleibt blockiert, der auf Erz zugeschnittene W2-Krisenautomat unterbricht NPC-Eisarbeit weiterhin. Keine dieser späteren Grenzen widerlegt die tatsächlich abgeschlossene kleine Kette oder beweist deren Dauerhaftigkeit.

## Reproduktion und Prüfungen

Node.js22, keine neuen Abhängigkeiten:

```sh
node tools/k5-terminal-diagnose.mjs 42 90 > /tmp/k5-seed42.json
node tools/k5-terminal-diagnose.mjs 7 90 > /tmp/k5-seed7.json
node --test tests/k5-terminal-diagnose.test.mjs
node --test tests/*.test.mjs
```

Die 90-Tage-Diagnose beobachtet zuerst **unverändertes K4**. Erst danach arbeitet der Gegenversuch auf einem separat geladenen Save bei Tick21612. Die Basis wird nie durch die Probe verändert. Tests führen den ursprünglichen `laufenK4`-Algorithmus zusätzlich unabhängig aus und vergleichen den **gesamten Welt-Hash**, einschließlich der unveränderten 14-/30-/90-Tage-Referenzen.

| Seed | K4 Tag14 / Tag30 / Tag90 | Gegenversuch Tick21865 |
| --- | --- | --- |
| 42 | `52b6fca43d1018a2` / `134a00c2125b22f5` / `c23397a320fa63ff` | `032e95033baa5e2c` |
| 7 | `8f34e59d66f6d471` / `a0e35cbd84a25152` / `4a818a41b592f887` | `49214bdb90ded7a0` |

Unabhängige Prüfungen: jede beobachtete Minute Kassen aus Anfangskapital, realen Erlösen/Kosten, Reserven und nach Gegenkonto neu summierten Transfers; Waren aus allen Lagern/Ladungen gegen Ledger; Hüllen einschließlich stillgelegter Körper; Original-Core-Audit täglich und an jedem Diagnosezustand sowie in jeder Minute des Gegenversuchs. Schiff-IDs und Eigentümer bleiben im Gegenversuch exakt gleich. Manipulierte Eigentümer, Waren, Hüllen und bilanzneutrale fremde Umbuchungen werden negativ geprüft.

Neun Originalbefehle werden bei Tick21612 **atomar**, ohne Änderung des kanonischen Gesamtzustands, abgewiesen: Erz-/Eisfracht ohne Charge, Raffinerie ohne Erz, beide Werftpfade ohne Material, Wasserwerk ohne Eis, Minerkauf ohne Lagerhülle, fremdes `house`-Kommando auf `npc3`-Miner sowie Abdocken eines verbrauchten Miners. Die Ablehnungsgründe werden vollständig ausgegeben; es wird kein fehlendes Kapital vorgetäuscht.

Save/Load in aktivem Minerflug, aktiver Eisfracht und Wasserwerksarbeit: je **130 Minuten** identische Fortsetzung gegenüber ungespeicherter Kopie, einschließlich derselben Stopentscheidung; überlappende Minuten stimmen zusätzlich mit dem tatsächlichen Hauptlauf überein. Die drei neuen Dateien ändern keine Spiellogik und keinen Browsercode. Eine kleine CI-Ergänzung führt die Diagnose für beide Seeds aus und archiviert vollständige JSONs unter `k5-terminaldiagnose-seed42-7`.

**Aktueller Ausführungsstand:** gezielte Tests und Node22-Gesamtregression laufen; Ergebnisse und K5-CI werden nach Abschluss ergänzt. Browsercode bleibt unverändert; eine lokale neue Chromium-/WebKit- oder echte iPad-Safari-/NAS-Abnahme ist damit nicht behauptet.

## Empfehlung

**[OPTION / nächster begrenzter Produktauftrag]** Zuerst die vorhandene, finanzierbare Umstellung eines eigenen ruhenden Erzminers auf Eis bedienbar machen bzw. im NPC-Disponenten gezielt anbieten; dabei die stündliche Erz-Krisensteuerung fachlich auf Erzaufträge begrenzen und Eigentums-/Vorfinanzierungsschutz erhalten. Diese Änderungen benötigen einen eigenen Auftrag und Regressionen, sie sind hier nicht implementiert.

Anschließend einen durch Nadir **vorfinanzierten industriellen Erzauftrag** mit echter Förderung, Dockkauf, Transport, Werft- und Ersatzkosten spezifizieren. Die aktuelle Kopplung sämtlicher Erzförderung an den endlichen Exportetat verhindert die dauerhafte Erneuerung trotz vorhandener industrieller Käufermittel. Keine neue Geldquelle oder automatische Rettung aus K5 ableiten; vor W6-Freigabe mehrere Wirtschaftsregime und lange Verschleiß-/Ersatzläufe unabhängig abnehmen.
