# W5s-ao – integrierte Wirtschaftsanalyse auf dem echten R32-Core

**[DRAFT/ANALYSE · 07.11.2026]** Forschungsbasis: [W5s-an #242](https://github.com/tobiasfranziskus/Check/pull/242), darunter [W5s-am #241](https://github.com/tobiasfranziskus/Check/pull/241). `main` bleibt beim separat freizugebenden Produkt; dieses Paket enthält **nur Node22-Testinstrumente und Dokumentation**, keine neue Geld-/Spielregel, keine Schemaänderung, keine ISK-Minting-Freigabe.

## Fragestellung

Ist der **zusammenhängende** Kreislauf aus echter Förderung → Vorfinanzierung → frachtpflichtigem Transport → Produktion → bezahlter Endabnahme → tatsächlich verdienter Lohn-/Dividendenrückkehr → Flottenersatz unter vollständigen Eigentümer- und Finanzierungsprüfungen krisenfest? Wenn nein: **welcher konkrete Engpass endet zuerst?**

Nicht nur positive Mengen, sondern die *Gleichzeitigkeit* von zahlungsfähiger Nachfrage, Deckungsbeitrag, Reserve, realen Ersatzschiffen und zulässigen Haushaltseinkommen ist maßgeblich. Bestehende Einzeltests werden als Vorbefunde verwendet, **nicht** als Gesamtfreigabe.

## A. Reproduzierbare Messmatrix

**A1 – Breite:** 13 feste Seeds `1, 7, 17, 21, 42, 58, 77, 101, 202, 313, 404, 777, 999` × 90 Tage mit denselben originalen R32-Wirtschaftsgates (`BASE`), ohne neue Außenemission. Jeweils unabhängig erstellte Welten, echte Core-Ticks und Geld-/Waren-/Eigentumsaudits alle 30 Tage. Keine gefälschten Aufträge, keine zweite Simulationsengine. Report: `W5S_AO_13X90`.

**A2 – Tiefe und eindeutige Gegenprobe:** **Zwei** Krisenseeds 42/7; jeweils dieselbe im R32-Core tatsächlich *bezahlte* Startflotte mit nachgewiesenen Werft-, Bergbau-, Überführungs- und Frachtvorgängen. Von derselben Save-/Hash-Basis werden drei Varianten getrennt bis **Tag730** fortgeschrieben:

| Szenario | Exportpreis | Externer Gesamtetat | Berechtigter Empfänger |
|---|---:|---:|---|
| `off` | – | 0 ISK | niemand |
| `station7` | 7 ISK je echtes Exportwasser | einmalig 7.000 ISK, max. 10 Wasser/Tag | ausschließlich Station Nadir |
| `station14` | 14 ISK je echtes Exportwasser | einmalig 7.000 ISK, max. 10 Wasser/Tag | ausschließlich Station Nadir |

Kein nachträgliches Auffüllen, keine Direktzahlung an Haushalte, keine neue Anteilsberechtigung. Die **7.000 ISK** und Exportpreise sind *vorhandene, begrenzte Forschungsparameter*, **kein beschlossenes Geldmodell-B-Produkt**.

Alle drei Varianten durchlaufen den selben finanzierenden Ablauf von echten Minern/Frachtern bis Spieltag ~155. Dann werden nur die bereits vorhandenen W5q-Exportparameter alternativ eingeschaltet; nur der Originalkern `api.advance` entscheidet, ob wirklich Ware und Budgets vorhanden sind. Messpunkte ab `Tag185, 245, 365, 425, 550, 730`; jedes Szenario erhält dessen Originalhash und Save/Load-Prüfung.

**A3 – Wirtschaftsgrößen statt Scheinstabilität:** Umverteilung der gesamten originalen 33.000 ISK plus exakt belegte `state.minted`; Kassen von Nadir, Endkunden, altem Spediteur, Minern, Werft, Investor, getrennten Nachfolgern und Fonds; tatsächlich gezahlte Löhne aus Eis/Fracht/Wasser/Industrie/Überführung, Original-W5o-Dividenden, Wasserverkauf und tatsächliche W3- und Eisfrachten, Material/Schiffbau und physische Waren; real verschlissene/gekaufte Miner und Frachter; nach Eigentümer getrennt vorhandene Frachter und kapitalgedeckte Ersatzbereitschaft.

**A4 – Krisenursache:** Der Tag des **letzten tatsächlich abgeschlossenen** bezahlten Wasserverkaufs, der letzten Wassercharge, der letzten Eisfracht und der letzten echten Lohn-/Dividendensteigerung wird jeweils getrennt aus Originalständen ermittelt (nicht prognostiziert). Lesend: nächster Wasserpreis, echte Kundenkasse, Original-W5s-Wartungsgate sowie Speditionskapitalbedarf und freie Werfthüllen.

**A5 – Unabhängige Schranken:** Core- und Eigentümeraudit alle 30 Tage (zusätzlich Messpunkte); alle 13×90 Seeds ohne neue ISK; 6 echte Langzeitwelten mit `sum(owners.cash)=33.000+minted`; `w5q.payout=0`; `buyer.cash=1.400+verdientes Einkommen−bezahlte Wasser`; Wasserlager = wirklich produziert − wirklich verbraucht − wirklich exportiert. Keine positiven Dividenden aus unverdienten stationseigenen Exportgewinnen; W5o-Stationsdividende nur im vorhandenen **inländischen** Gewinnpfad. Alle Checkpoint-Spielstände müssen serialisieren, korrekt laden und denselben Hash besitzen.

**[TESTSTATUS]** Die Testdatei `tests/w5s-ao-gesamtwirtschaft-13x90-730.test.mjs` und GitHub-Workflow `w5s-ao-gesamtwirtschaft.yml` wurden erstellt; Ausführung/Ergebnisse bei Anlage **noch offen**. Zahlen außerhalb schon bestätigter W5s-an/am-Referenzen ausdrücklich **nicht** aus Vermutungen ergänzt. Echte iPad-/NAS-Abnahme wäre nur für ein Produkt relevant und bleibt separat offen.

## B. Bereits bestätigte Referenzbefunde, noch nicht das Ergebnis dieser Matrix

- [W5s-am #241](https://github.com/tobiasfranziskus/Check/pull/241): Stationsexport zu 7 ISK, Seed42/7: spätestens Tag425 6.673 ISK bei Nadir, 11 ISK beim Verbraucher, 14 ISK pro Wasser. Bis Tag730 keine weiteren Wasserwerkschargen/Eisfrachten/regulären Verkäufe – trotz korrekt finanzierter Station. Keiner der sieben überprüften Lohnpfade hatte offenen verdienten Lohn.
- [W5s-an #242](https://github.com/tobiasfranziskus/Check/pull/242): direkter stationärer Zuordnungskostenmaßstab `590 ISK / 50 Wasser`, also 11,80 ISK pro Wasser (250 Eis + 240 Hin-/Rücktransport + 100 Wasserwerkslohn; **ohne** Wartung, Verschleiß, Kapitalkosten). 7-ISK-Export von 1.000 Einheiten = −4.800 ISK direkter Export-Deckungsbeitrag; 14 ISK bei 500 Einheiten = +1.100 ISK *vor* Zusatzkosten. **Nicht** mit tatsächlich investierbar freiem Kassenbestand oder rechtmäßigem Dividendenanspruch gleichsetzen.
- Bereits existierende W5o-Dividenden gehen an `w5n_kunden` und beruhen auf **inländischem** Wassererlös und pauschaler direkter Kostenformel. Das ist ein **modellierter Haushaltsgewinnanspruch**, keine nachgewiesene neue Stationsaktie. Die Modellberechtigung und eventuelle spätere Anteile dürfen nicht doppelt ausgeschüttet werden.

## C. Annahme und nächste Produktentscheidung

Ein **technisch bestandener Test** beweist Geld-/Waren-/Eigentumskonsistenz. Eine **wirtschaftlich tragfähige Welt** benötigt darüber hinaus auch an Tag730 echte regelmäßige, bezahlte Anschlussnachfrage, finanzierbaren unabhängigen Flottenersatz und positive, nachgewiesene Eigentümerbilanz ohne Gratiszahlung. Deshalb darf die Analyse bei einem ehrlichen Stillstand **technisch grün** sein und muss das wirtschaftliche Nichtbestehen klar ausweisen.

Aus den ermittelten Gesamt- statt Einzelzahlen folgt als nächster separater, genehmigungspflichtiger Produktversuch **genau eine** Kernhypothese. Keine automatische Rettung durch Stationsguthaben, keine erfundene Vollbeschäftigung, kein heimlicher Subventionsmechanismus und keine Pflicht, Spielerersparnisse abzuschöpfen. **[DRAFT] Kein Merge/Deployment, keine Pages-, Save- oder W5u-Änderung.**
