# Aphros Void – Modulproduktion und Pilotenkäufe (v11, Forschungsstand)

Stand: 30. Oktober 2026. **Draft [PR #25](https://github.com/tobiasfranziskus/Check/pull/25), kein Merge und keine produktive Änderung von `index.html`.** Basis: Pilotengehaltsversuch [PR #24](https://github.com/tobiasfranziskus/Check/pull/24).

## Herkunft und bewusst begrenzte Übernahme

Die ältere bereitgestellte Datei `void.html` enthält ein ausgearbeitetes Ausrüstungskonzept mit sieben Modularten, Größen S/M/L, Stufen I–III und mehrstufigen Ressourcenrezepten. Es wird **nicht** der alte Spiel-, Netzwerk- oder Wirtschaftscode eingebaut. Die Idee wird gezielt an das bereits vorhandene `m_core_*`-Modell von Aphros Void angepasst.

## Minimaler Warenkreislauf

```
NPC-Miner (erz / silizium / kristall)
  → bestehende Stationen und Produktionslinien
  → material / bauteil und echte Warenbestände
  → Modulherstellung auf existierenden Industrie-Stationen
  → lokaler Modulverkauf gegen Pilotenguthaben
  → Stationskasse (kein zusätzlich geprägtes Geld)
```

Vorläufiges Modell `tools/module-economy-model.mjs`:

- **21 Modulrezepte**: Frachtraumerweiterung, Bergbauverstärker, Schildgenerator, Laser, Nachbrenner, Batterie und Radar, jeweils MK I–III. Die fertigen Module sind noch nicht nach Größe S/M/L differenziert.
- Herstellung benötigt reale, im Bestand vorhandene `material`- und `bauteil`-Einheiten, abweichend je Rezept auch `silizium` oder `kristall`. Die Menge wird vom Stationslager abgezogen und im vorhandenen `ledger[ware].consumed` erfasst. Erhaltung ist so über den bisherigen Waren-Audit prüfbar.
- Nur Stationen mit existierenden `r_material`- oder `r_bauteil`-Produktionslinien dürfen in diesem Test Module fertigen. Mindestens die Hälfte des konfigurierten Waren-Zielbestandes bleibt als Reserve für Versorgung und sonstige Industrie erhalten.
- **Modulbestandsbuchhaltung getrennt von alten Warenarten**: `moduleLab.stock`, `moduleLab.produced`, `moduleLab.sold` und `pilot.ownedModules`; eigener Audit prüft `produced = sold + Lagerbestand` und `sold = Piloteneigentum`. Nur der Testcode fügt diese Felder dem Simulationszustand hinzu. Produktive Schemaänderung und Migration stehen ausdrücklich aus.
- Ein Kauf setzt verfügbaren Bestand, Pilotengeld und die vorherige Modulstufe voraus. Pilot bezahlt, Stationskasse erhält den Betrag. Keine Geldschöpfung.
- Die Preise folgen den bestehenden Kern-Stationspreisen der eingesetzten Waren, zuzüglich vorläufiger Fertigungsgebühr. Diese Formel ist **kein abgestimmtes Balancing**.

## Integrierter Versuch

`node tools/module-production-scenarios.mjs` simuliert dieselbe v11-Welt für 13 feste Seeds × 90 Tage und vergleicht:

A. **Baseline:** Originalwelt, keine Pilotenvergütung/Module, festes v11-Hashprofil zu Tag 3/30/90.
B. **Löhne allein:** Erfolgsanteil Frachter 10 % positiver Nettogewinn, Miner 20 % realer Nettoerlös, keine Ausgaben.
C. **Löhne und Module:** Wie B, plus Modulproduktion und Kauf direkt an der jeweiligen angedockten Station. Pilot wertet zunächst Frachtraum- bzw. Bergbau-MK I–III auf.

Jede Variante verwendet **denselben Kern** und denselben deterministischen RNG. Stündlich: Kern-Geld-/Warenaudit, bei C zusätzlicher eigener Modulaudit, abschließend Save-/Load-Hash. Für A ist zusätzlich die feste externe v11-Referenz verbindlich.

Die Bestellung von Schutzschilden und Lasern durch Kopfgeldjäger, echte Effekte auf Schiffswerte, Ausrüstungsslots, Größen S/M/L, Reparaturen/Verschleiß und laufende Materialnachfrage sind **noch nicht implementiert**; sie können nicht aus einer erfolgreichen Testproduktion abgeleitet werden. Einmalige MK-I–III-Käufe allein werden langfristig möglicherweise nicht ausreichend viel Geld zurückführen.

## Tatsächlich ausgeführte Prüfungen und Ergebnisse

- [GitHub Actions #41020846651](https://github.com/tobiasfranziskus/Check/actions/runs/41020846651), Code-Commit `b7ec934`: **50/50 Standardtests** erfolgreich (5 neue Modultests). Modulversuch mit **39/39 90-Tage-Simulationen** erfolgreich; 13 feste Seeds × drei Varianten. Stündliche Geld-/Warenaudits, eigene Modulbestandskontrolle, Save-/Load-Roundtrip und feste v11-Basisreferenzen bestanden.
- Der erste CI-Versuch hatte die nach der Herstellung geänderte Preisbewertung nicht berücksichtigt und einen erlaubten, nun korrekt verschobenen Kauf irrtümlich als Fehler behandelt. Fehler im **Versuchsablauf**, nicht in `index.html`; die Korrektur prüft die Kaufkraft nach der Materialentnahme neu. [Fehlversuch #41020566676](https://github.com/tobiasfranziskus/Check/actions/runs/41020566676) ist nicht als Erfolg gezählt.
- Die alten v11-Wirtschaftstests laufen als separate CI-Jobs; ein planmäßig wegen abweichender PR-Basis übersprungener historischer Job wird nicht als ausgeführt bezeichnet.

| Kennzahl, Summe aus 13 Seeds × 90 Tage | Original v11 | Mit Pilotengehalt | Gehalt + Modulherstellung und -kauf |
| --- | ---: | ---: | ---: |
| Gesamte Mangelstunden | 4.204 | 485.081 | 483.539 |
| Pilotengeld am Ende (ISK) | 0 | 532.957 | 527.335 |
| Stationsgeld am Ende (ISK) | 304.707 | 45.153 | 57.097 |
| Fonds am Ende (ISK) | 89.840 | 524 | 688 |
| Ausgezahlte Pilotengehälter (ISK) | 0 | 532.957 | 602.812 |
| Module produziert | 0 | 0 | 281 |
| Module verkauft | 0 | 0 | 280 |
| Modulumsatz (ISK, Pilot → Station) | 0 | 0 | 75.477 |
| Dabei eingesetzte Material-/Rohstoffeinheiten | 0 | 0 | 1.607 |

Die Pilotengehaltsquoten sind wie im Vorversuch lediglich experimentell: 10 % des positiven realisierten Frachter-Nettogewinns und 20 % des Miner-Nettoerlöses. Die alte abstrakte Betriebskostenregel bleibt in beiden Gehaltsvarianten zunächst unverändert beim Konzern.

**Befund:** Die moduleigenen Käufe transferieren reales Geld zurück an Stationen; das funktioniert ohne zusätzliche Geldschöpfung und ohne ausgedachte Waren. In **12/13 Seeds** sinkt die Gesamtmangelstundenzahl gegenüber Gehalt ohne Module (in einem steigt sie). Gesamtmangel sinkt um 1.542 Stunden; das sind nur etwa **0,32 %** des sehr großen Versorgungsdefizits. Die Einnahmen der Pilotenkonten steigen in der Modulsimulation zugleich, sodass 75.477 ISK Modulumsatz nicht mit einer gleich großen Reduzierung ihrer Schlussguthaben gleichgesetzt werden darf.

**Keine Wirtschaftsfreigabe.** Einmalige MK-I–III-Käufe sind als Liquiditätsrückfluss viel zu schwach, um die Gehaltsökonomie zu tragen. Ein dauerhafter, materialgebundener Reparatur- und Ersatzbedarf mit echten Stationszahlungen und künftig wirksamen Ausrüstungswerten ist deshalb der nächste zu isolierende Entwicklungsbaustein.

## Weiteres unabhängiges Paket

Erst die Umverteilungswirkung der realen Modulkäufe prüfen. Danach gesondert: reale Beschädigung, Reparaturservice bei Stationen, dauerhaftes Piloteneigentum, modulabhängige Frachtraum-/Kampfwerte und Speicher-Migration. Vor Produktivintegration benötigen diese Funktionen einen gemeinsamen deterministischen Kern, ausdrücklich keine zweite Wirtschafts- oder Kampfberechnung.
