# W5s-h – tatsächliche Unternehmensgewinne für bezahlte Folgeflotten zurückhalten

**[DRAFT/ANALYSE · 06.11.2026]** [PR #211](https://github.com/tobiasfranziskus/Check/pull/211), gestapelt auf W5s-g #210 und dem bisherigen W5s-Forschungsstack. Keine Änderung an `main`, Produktregel 14/Schema 8, UI-PR #207 oder bestehenden Save-Slots. Keine Geldemission, kein Merge, kein Deployment.

## Ausgangsbefund und Hypothese

Der R32-Forschungskreislauf produziert, verkauft und überführt in W5s-g echte Ersatz-Miner und Ersatzfrachter mit einer verbindlichen Vorfinanzierung. Nach mehreren 15-/30-Tage-Verlusten fehlt den Unternehmen jedoch Kapital, obwohl sie zuvor reale Eis- und Transportleistungen verkauft haben. Im schon vorhandenen R30/W5o-Eigentümerkreislauf werden die tatsächlich erzielten Gewinne bis auf **100 ISK** Miner- bzw. **120 ISK** Speditionsreserve als Dividende an den zahlenden Haushalt `w5n_kunden` ausgeschüttet. Der vollständig vorfinanzierte Folgeauftrag benötigt aber **600 ISK Schiff + 60 ISK Überführung = 660 ISK** für den Miner bzw. **750+60=810 ISK** für den Frachter.

**Hypothese:** Höhere Rücklagen aus *bereits real verdientem* Unternehmensgewinn ermöglichen mehr echte Folgeinvestitionen, obwohl weniger sofort an den Haushalt ausgeschüttet wird. Kein Finanzierungs- oder Arbeitslohnersatz, keine Gratisrettung, keine Insolvenzgarantie.

## Technische Umsetzung

- Das explizite **Forschungsflag** `rules.w5s.retainFleetEarnings` wird ausschließlich bei aktiver W5s-g-Vorbestellungsautomatik für die normalen W5o-Dividenden der NPC-Miner und Spedition ausgewertet. Es verwendet **die vorhandene** W5o-Zahlungs-/Gewinnlogik und erhöht nur den Mindestkassenpuffer auf den jeweils höheren Wert von ursprünglicher Reserve und vollständigem Ersatzbudget (660/810 ISK). Die tatsächliche Dividende bleibt durch bislang realisierte Gewinne und freie Firmenkasse begrenzt.
- Kein zusätzliches Eigentümerkonto, kein neues Geld, kein Erzeugnis, keine Sonderfinanzierung, kein Core-Duplikat. `house` wird nicht zwangsweise investiert, die Stationserlöse und -dividenden bleiben unberührt. **Ohne Flag gilt exakt das frühere Verhalten.**
- Reines Diagnose-API `m_core_index.w5sKapitalLage(state,rules)` gibt Besitzer, freie Kassen, noch unverbrauchtes Bestell-Escrow, Kosten für realen Ersatzkauf mit Flug, fehlende Kassenmittel, gebuchte Kassen-Einnahmen/Kosten, real ausgeschüttete Miner-/Fracht-/Stationsdividenden sowie tatsächliche Wasser- und Erzflüsse zurück. Der Aufruf verändert weder State noch Hash.

## Ausgeführte kontrollierte Tests

**[TEST] [Gezielte Node22-W5s-h-CI #42187053753](https://github.com/tobiasfranziskus/Check/actions/runs/42187053753): 3/3 Testgruppen grün, 0 Fehler/Skips.**

- **13 feste Seeds ×90 Tage je Original und Gewinnrücklage** mit gleichen Regeln außer dem ausdrücklich aktivierten Reinvestitionsflag. Ausgangspunkt in jeder Welt: Hauskonzern kauft real Miner in Aldera, erteilt real bezahlten Erzauftrag und kauft die endliche Nadir-Starterhülle für Lagerplatz; automatische W3-Lieferung aus tatsächlich gefördertem Erz, W4-Material, W5-Miner/Frachterproduktion, W5s-g-Käufer-Escrow und bezahlte Überführung.
- Jeder Spieltag in beiden Varianten: unabhängige Gesamt-ISK-Summe (33.000), physische Warenbestände gegen den Warenledger und vollständiger Core-Audit; Save/Load an ausgewählten Tagen, Seed42/7 ×90 Tage doppelt. Separat Seed42/7 je **365 Tage in beiden Varianten**.
- Das Ergebnis für jede der 13 Saatzahlen: **Original 2.350 Wasser, 47 Eisfahrten, 4 tatsächlich verkaufte Werfthüllen**; **Gewinnrücklage 2.850 Wasser, 57 Eisfahrten, 6 verkaufte Hüllen**. Delta +500 Wasser = +21,3 %, +10 bezahlte Eisfahrten, +2 physische/beglichene Hüllen; **0 Minting und 0 Burning**. Keiner der 13 Seeds verschlechterte sich in diesem Setup. Die 365-Tage-Gegenproben enden bei denselben Mengen; ein dauerhafter Wiederanlauf wurde **nicht** erreicht.
- Seed42 beispielhafter End-Hash Original nach 90d `a0ece5f01a6f5f2c`, Gewinnrücklage `7947d25daca64e6a`; Seed7 `d611be06b2bf539b` gegen `897c063d82b2211a`. 365d-Hashes Seed42 `c6cf96ec24a30ec0` gegen `9f9e7eac91d3ad1f`, Seed7 `a245675c5c4e2108` gegen `d17218086dbe5f1b`.
- **Wichtig zur Interpretation:** In der gegenwärtig einfachen, weitgehend deterministischen R32-Ökonomie beeinflussen die Seed-Unterschiede die hier untersuchten Mengen kaum: alle 13 Welten weisen in dieser Versuchsanordnung dieselbe Mengenbilanz auf. 13 Seed-Gates belegen Wiederholbarkeit/Audits, **nicht 13 unabhängige Wirtschaftskonfigurationen** und nicht die Robustheit gegenüber beliebigem Spielerverhalten.

## Negative Bilanz und Grenzen

- Nach 90/365 Tagen hat der NPC-Miner in beiden Varianten **0 ISK**. In der Rücklagenvariante hat auch die Spedition **0 ISK**, während sie im Original noch 680 ISK besitzt (noch unter ihrem 810-ISK-Ersatzetat). Die Rücklagen finanzieren also zusätzliche reale Betriebsläufe, beheben jedoch die **fehlende langfristige Erlösbasis nicht**.
- Die Kundenhaushaltskasse fällt im Endzustand von 1.820 ISK (Original) auf 1.780 ISK (Rücklage). Durch andere Produktionstakte entstehen trotz zeitweise geringerer Gewinnausschüttung im Verlauf insgesamt auch zusätzliche realisierte Dividenden; Enddividenden allein sind kein kontrolliertes Maß des zu Beginn zurückgehaltenen Geldes.
- Erzförderung bleibt im Versuch **vom Spieler ausdrücklich beauftragt**; aus 225 tatsächlich geförderten Erz wurden 100 Erz nach Nadir geliefert. Vollautonomer NPC-Rohstoffkaltstart, Krisen mit abweichendem Spieler-Sparverhalten, Konkurrenz um alle Fracht-IDs, neue Firmenübernahmen, sparsame/insolvente Einzelunternehmen sowie die 13×90-W6-Gesamtökonomie sind nicht nachgewiesen.
- 15-/30-Tage-Verschleiß, 2-Tage-Vorlauf und die 660/810-ISK-Ersatzkosten sind R32-Forschungswerte, **keine** freigegebenen Produkt-Balancingregeln. Die Initialisierung nutzt `autoLeadDays:30` und `versorgungZiel:-1` für einen isolierten echten Anfangsauftrag; anschließend laufen die normalen R32-Forschungsbedingungen.
- Reale iPad-Safari-/NAS-Abnahme offen. Die gezielte Node-CI ersetzt nicht die vollständige historische Regression; deren Ergebnis ist **pro Code-Head** zu verifizieren.

## Nächster klarer Entwicklungsgate

W5s-i sollte **nicht** nur weitere Reservebeträge optimieren. Der belastbare Befund ist, dass der Haushalt und Unternehmen weiter ISK besitzen, während der Miner und Spediteur nicht mehr aus bezahlten Aufträgen genügend laufende Erträge erzielen. Entscheidend ist eine eigene **finanzierte NPC-Erzförderung und tatsächliche industrielle Erz-Endnachfrage** ohne Spielerpflicht und ohne kostenlose Käuferbudgets, zusammen mit einer Prüfung der Wasser-Endnachfrage. Kleine nachweisbar finanzierte Kreisläufe priorisieren; bei ausbleibender Finanzierung endet die Produktion regulär.

Die einzige verbindliche Planung bleibt `docs/ROADMAP.md`; dieser Forschungsbericht ist kein Ersatz für `docs/PROJEKTSTATUS.md` oder die separat laufende Docs-PR #201.
