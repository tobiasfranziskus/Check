# C1d-6 – unabhängige Konzernbilanz für vier Lagermodule

**[DRAFT / ANALYSE · 08.11.2026]** Auf [C1d-5 / #258](https://github.com/tobiasfranziskus/Check/pull/258) aufgesetzt. Ziel: Die vollständig bezahlte, aber endliche Meridian-Viererlieferung **ohne Änderungen am Original-Core** in eine konzernübergreifende Kassen-, Waren-, Lohn- und Kapitalrechnung überführen. **Keine neuen Regeln, Preise, Eigentums- oder Geldemissionsrechte.** Forschungsprofil `aphros-research:C1d-5:owner-custody-storage-v1` (**Regel 3310**) und bisherige Hashes unverändert. `main`, Pages, Save-Slots und ROADMAP unberührt.

## Befund – zwei Seeds 42 und 7, Tick 592

| Account | Kasse Anfang, nach bereits vorhandenen Startschiffen | Kasse Ende | Kassenänderung | Einordnung |
| --- | ---: | ---: | ---: | --- |
| `house` / Hersteller, Miner | 3.000 | 2.740 | **−260** | Zwei zusätzlich bezahlte Minerschiffe zu je 600 ISK weiter im Besitz |
| `st_nadir` / Raffinerie und Lager | 1.700 | 1.688 | **−12** | Noch **10 eigene, vollständig bezahlte Erz** aus der W3-Lieferung im Stationslager |
| `transport` / bestehender Frachter | 1.250 | 1.430 | **+180** | Beide Frachtrundläufe und Pilotlöhne bezahlt; historische 750-ISK-Frachteranschaffung bereits vor Anfangssnapshot |
| `export` / endlicher Käufer | 20.000 | 18.180 | **−1.820** | 600 ISK Erzkauf, 500 ISK Erzverkauf, 1.720 ISK Modulkauf |
| `werft_extern` | 1.350 | 2.550 | **+1.200** | Zwei echte Minerhüllen gegen vorhandenes Kapital verkauft |

Geldmenge **33.000 → 33.000 ISK**, **0** neue und **0** verbrannte ISK. Unabhängige Fortschreibung der Eigentümer-Kassen inklusive Anfangskapital, unterzeichnetem Original-W5b-Eigentumsbuch, echten Frachteraufträgen, Verkäuferabrechnungen und gesondertem Journalvergleich.

Die bei `house` zunächst ungünstig wirkende Kasse ist **keine Verlustrechnung**: Aus dem kompletten Unternehmensbetrieb entsteht ein **+940-ISK-Überschuss der Betriebskasse vor 1.200 ISK neuem Miner-Anlagekapital**; nach Schiffkauf beträgt der tatsächliche Kassenrückgang 260 ISK. Die Minerhüllen sind weiterhin vorhanden; ihr Wiederverkaufswert, Abschreibung und Verschleiß sind hier **nicht** geklärt.

### Unabhängige Buchungsbrücken, keine bloße Summenbestätigung

`house`, Ende 2.740 ISK:

```text
Anfang                                 +3000
2 Mineranschaffungen                    -1200
60 Erz × 2 bezahlte Förderminuten        -120
60 Erz × 10 realer Erzabsatz             +600
8 Silizium × 24 Siliziumverkauf          +192
16 Material × 48 und 8 Silizium × 24     -960
8 Silizium × 10 bezahlte Arbeit           -80
4 Bauteillose × 16 + 4 Montagen × 12    -112
1 vollständig vorfinanzierte Rundfracht  -300
4 × 430 ISK endlicher Käuferauftrag     +1720
Ende                                    2740
```

Das einzelne Modulgeschäft hat **1.720 − 960 − 80 − 112 − 300 = 268 ISK direkten Zahlungsmittelüberschuss**. Dieser Betrag **ist kein gesamter Reingewinn**: das Unternehmen fördert zusätzlich Erz, kauft Schiffe und verkauft Silizium; an anderen Stellen derselben Wertschöpfung entstehen korrespondierende Einnahmen und Ausgaben. Eine Bilanz darf diese nicht doppelt als unabhängige gesamtwirtschaftliche Erträge addieren.

`st_nadir`, Ende 1.688 ISK:

```text
Anfang                                  1700
50 wirklich angelieferte Erz × 10       -500
Bezahlte Original-W3-Fracht             -240
4 Raffineriechargen × 10 Arbeitslohn     -40
8 geförderte Silizium × 24              -192
16 Material × 48 + 8 Silizium × 24      +960
Ende                                    1688
```

Von **60 gefördertem Erz** wurden **50 real angeliefert und 40 tatsächlich in 16 Material umgewandelt**; 20 Erz sind insgesamt physisch unverbraucht, davon zehn im Stationslager Nadir. Ihr rein rechnerischer anteiliger **historischer Einkauf samt W3-Fracht** entspricht `10 × (500 + 240) / 50 = 148 ISK`. Dies sind **keine zusätzlichen ISK**, keine externe Marktpreisbestätigung und noch kein geprüfter Vermögenswert nach allen Kosten. Die Station hat 12 ISK weniger Liquidität, jedoch einen bezahlten Restbestand; daraus ohne Abschreibung, Lager-/Verschleißkosten oder Folgeabnahme bereits 136 ISK Reingewinn zu behaupten wäre unzulässig.

`transport`, Ende 1.430 ISK:

```text
Anfang                          1250
W3 alte Erzfracht +240 −120      +120
C1d neue Rundfracht +300 −240     +60
Ende                            1430
```

Die **360 ISK** für Transportarbeit wurden ausgezahlt; der ursprüngliche 750-ISK-Frachterkauf ist im Anfangsstand schon bezahlt. **+180 ISK** ist daher der liquide Beitrag beider Fahrten, **nicht** der Vollkostengewinn eines Frachters. Kein Treibstoffverbrauch; langfristig Verschleiß, Erneuerung und andere Kapitalbindungen prüfen.

`export`: `20.000 − 600 + 500 − 1.720 = 18.180 ISK`. Die 1.720 ISK stammen aus **vorhandenem, aber endlichem** Käuferkapital. Es gibt keinen belegten laufenden Kundenumsatz, der einen identischen Folgeauftrag immer wieder finanzieren könnte.

## Physische Waren und echte Arbeitsleistung

| Größe | Vollständig nachgewiesen |
| --- | ---: |
| Abgebautes Erz | 60 |
| Angeliefertes Erz / in Raffinerie verarbeitet | 50 / 40 |
| Unverbraucht gebliebenes Erz, gesamt | 20 |
| Hergegestelltes Material / Silizium | 16 / 8 |
| Produzierte Bauteile / deren Verbrauch | 8 / 8 |
| Lagermodule hergestellt / gegen Kaufbeleg exportiert | 4 / 4 |
| Erzförderarbeit in diesem Test | 120 ISK / 120 kostenpflichtige Minuten |
| Siliziumförderarbeit | 80 ISK / 80 kostenpflichtige Minuten |
| Raffineriearbeit | 40 ISK |
| Bauteil- und Lagermontagearbeit | 112 ISK |
| Erzfracht-Pilotenarbeit W3 | 120 ISK |
| Meridian-Fracht-Pilotenarbeit C1d | 240 ISK |

Die Arbeitslöhne sind **verschiedene echte Empfänger-/Treuhandvorgänge**, nicht aus dem Verkaufspreis herausgerechnete Gratisarbeit. Die zusätzliche C1b-Weltförderung (`npc3`-Eis) läuft parallel: `w5o.ausgezahlt=500`, die Lohn-/Kundenkasse `w5n_kunden` steigt auf **2.060 ISK**, aber `w5n.wasserVerbraucht=0` und der Profilverbrauch steht auf null. **Keine Nachfrage-Rückkopplung bewiesen.**

## Maschinelle unabhängige Prüfung

- `tools/research/c1d-6-vollkosten.mjs` liest ausschließlich zwei originale Zustands-Snapshots, macht **keine Änderung** an Simulation, Save, Laufzeit-Regeln oder Waren. Es vergleicht fünf Kassenbrücken unabhängig aus Mengen/Preisen/Arbeitsbelegen mit echten `owners.cash`, elf Eigentümer-Journalbrücken mit Kassenänderungen, die gesamte 33.000-ISK-Geldmenge, Waren, Titelketten, sechs Lohngruppen, Fracht und den tatsächlich verbrauchten Export.
- `tests/c1d-6-konzernvollkosten.test.mjs`: **7/7 direkt ausgeführte JavaScript-Core-Tests** einschließlich Seeds 42 und 7, Manipulationen, Replay nach Save/Load und Prüfung auf unveränderten Snapshot. Erwartete Hashes bleiben Seed 42 `a08511483ad5350a`, Seed 7 `b83514514e50182c`.
- CI: `node tests/c1d-6-konzernvollkosten.test.mjs` im vorhandenen Node22-Forschungsworkflow. Dessen Ergebnis muss gesondert geprüft werden; direkte Core-Ausführung ist nicht gleich vollständiger Node22-CI oder iPad-Safari/NAS-Abnahme.
- **Keine neuen Produktregeln und keine Geldemission.** Eine vollständige Gewinn- und Verlustrechnung erfordert zusätzliche Daten über Abschreibung, Schiffsinstandhaltung, Lager- und Kapitalzinskosten, Mineral-/Arbeitsrechte sowie wiederholbare Nachfrage. Keine positive 13×90- oder 365-Tage-Gesamtwirtschaftstestung behauptet.

## Empfehlung für nächste Forschungsentscheidung [OPTION]

Nicht vorschnell neue Kaufkraft erzeugen. Als nächstes eine **zweite echte, begrenzte Folgeorder** aus nachweislich wiedergewonnenem Käuferkapital oder realen Einnahmen zu finanzieren versuchen, bei vorheriger Bestands-/Schiffskapitalprüfung. Im bisherigen abgeschlossenen C1d-5-Auftrag sind vier Module und 1.720 Käufer-ISK erfolgreich **einmalig** umgesetzt; ob das übertragbar oder wiederkehrend finanzierbar ist, wurde nicht bewiesen. Alternativ vor einer neuen Charge fehlende Preis- und Verschleißannahmen gesondert freigeben lassen.
