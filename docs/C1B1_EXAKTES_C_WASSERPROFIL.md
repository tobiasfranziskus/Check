# C1b-1 – exaktes C-Wasser-Teilprofil

**[DRAFT / FORSCHUNG · 08.11.2026]** Auf #246 / `76880387c4ebeec75461dd14bedafadc85726090`, gegen dessen Branch `analyse/c1a-modell-c-machbarkeit-20261108`. Keine Produktintegration, kein vollständiges Modell C. Vor Beginn geprüft: aktueller main `fd3e915`, AGENTS.md, zentrale Roadmap und Projektstatus, #243, #245 und #246 inklusive Diskussionen und CI. Die Produktplanung bleibt unverändert.

## Ergebnis

50 Eis benötigen erstmals exakt **100 tatsächlich bezahlte Förderminuten**. Jede finanzierte Minute kostet vor dem Fortschritt 1 ISK; eine ganze Einheit entsteht nach zwei Minuten. Ein Rest von einer bezahlten Minute wird je Hüllen-ID gespeichert. Pause/Save/Load bewahren ihn; ein Hüllenverlust überträgt ihn nicht auf die Ersatzhülle. Kein unbezahlter Arbeitsfortschritt.

Ein Tag umfasst 1.440 Minuten. Bei Minute 144, 288, …, 1.440 wird je eine Einheit nachgefragt, insgesamt exakt zehn geplante Kaufversuche pro Tag. Nur vorhandene Ware und mindestens 18 eigene Kunden-ISK führen zum Kauf. Jeder Versuch speichert Tick, vorherige Kasse, vorherigen Bestand, Kaufmenge und getrennte Mangelgründe. Beide Hindernisse können gleichzeitig vorliegen. Kein Nachholen verpasster Käufe, kein Auffüllen von Geld oder Waren.

**Buchhaltung bestanden, nachhaltiger Wirtschaftskreislauf nicht nachgewiesen:** Nach 90 Tagen bleiben 66 Wasser im Lager und 8 Kunden-ISK; ein Kauf braucht 18. Letzter bezahlter Kauf Tick 45.648 (Tag 31,7). Tage 60–90 liefern keine neuen Förder-/Fracht-/Fabriklöhne und keinen neuen Wasserabsatz. Bestehende R32-Arbeitswartung läuft davon getrennt weiter. Sämtliche Audits und Roundtrips bleiben auch in diesem Stillstand korrekt.

## Registrierung und Save-Schutz

Neue isolierte Node-Forschungsregistrierung in `tools/research/c1b-1-wasser.mjs`:

- Profil `aphros-research:C1b-1:water-v1`, eigene Forschungsregel **3301**, Schema weiterhin 8. Keine neue produktive Regelnummer oder Migration.
- Vollständige unveränderliche Regeln, kanonischer SHA-256-Regelfingerprint im Zustand. Der Save enthält dieselbe Identität sowie Arbeits- und Nachfragebelege; der normale Core-Serializer erfasst alle Felder deterministisch.
- `createResearchCore()` lädt eine eigene Instanz der vorhandenen Core-Module aus der unveränderten `index.html`. Die Quellbasis ist mit SHA-256 festgehalten; bei anderer Quelle bricht die Registrierung ab. Kein Ersetzen von Funktionsquelltext und keine zweite Fracht-/Wasserproduktionssimulation.
- Ein expliziter Callback vor Initialisierung von `m_core_index` registriert die C-Regeln in den **privaten** W5N/O/Q/R-Dispatchslots des bestehenden Gesamtaudits. R32 in anderen Instanzen bleibt unverändert. Der vollständige ursprüngliche Gesamtaudit und seine Teilprüfungen laufen dadurch mit den tatsächlich geltenden Regeln. Der W5n-Warenaudit ist als lokale Fassung übernommen; allein seine R32-Fördergrenze wird durch die exakte Arbeitsbelegprüfung ersetzt.
- Der eigene Gesamtloader prüft Profil, Fingerprint, Schema/Regel, Einkommensmodus, Null-Export/-Mint, alle ursprünglichen Core-Audits, nichtnegative ganzzahlige Kassen/Waren und die zusätzlichen Arbeits-/Nachfragebelege. Kein C1a-/R32-/Regel14-Import und kein stilles Migrieren. Umgekehrt weisen die unveränderten R32-/Produktloader C1b-Saves ab.
- Forschungs-API ohne Browser-, IndexedDB- oder Dateischreibpfad für Spielstände. Keine Änderung an `index.html`, bestehenden Tests/Fixtures oder der Roadmap. `diagnostics` legt ausschließlich die drei Modulaufrufe für adversarielle Doppelaufruf-/Finanzierungstests offen.

Der Minutenkern, bezahlte Starts/Anschaffungen, Transport mit Hin-/Rückweg, Vorfinanzierung, Wasserproduktion, Eigentumsprüfungen und Lohnrückfluss stammen weiter aus #246. Nur Eisförderung, Nachfrage und deren Auditregeln werden ersetzt. Nachfrage läuft nach dem bestehenden Fracht-/Fabrik-Minutenfortschritt und vor Förderung/Stundenlohnrückfluss; die alte stündliche Wasserabnahme ist abgeschaltet. Das Timing ist eine explizite deterministische Ausführungsentscheidung für die Tagesmenge aus #245.

## Unveränderte Parameter und genaue Messungen

Paarvergleich mit Seed 42, 33.000 Welt-ISK, denselben Anfangskassen/-hüllen und `wages`/NPC-Miner. Eispreis 5; 50 Eis → 50 Wasser durch 100 bezahlte Fabrikminuten; Wasser 18; echte Rundfracht 120 Minuten, 120 Pilotlohn und 270 Frachtrechnung. Keine Dividenden oder Exporte. Zwischen 30 und 90 Tagen keine Regeländerung.

Die R32-C1a-Kontrolle wird aus einer separaten unveränderten Core-Instanz neu ausgeführt, nicht aus alten Messdaten gelesen. Ihre Tag90-Werte reproduzieren #246: 200 produziert, 172 gekauft, 4 Kunden-ISK. Nur C1b ändert Fördercadence und Nachfrage. Ausgewiesene Gesamtunterschiede entstehen endogen auch durch Lagergrenzen, zusätzliche bezahlte Arbeit und zusätzliche finanzierbare Chargen.

| Profil | Tage | Eis / bezahlte Förderminuten | Wasser produziert / gekauft | geplante Nachfrage | maximale Käufe/Tag | Haushaltslohn / Rest-ISK | bezahlte Frachtumsätze |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| R32-C1a | 30 | 600 / 600 | 200 / 166 | 1.440 | 48 | 1.600 / 12 | 1.350 |
| C1b-1 | 30 | 650 / 1.300 | 250 / 217 | 300 | 10 | 2.520 / 14 | 1.620 |
| R32-C1a | 90 | 700 / 700 | 200 / 172 | 4.320 | 48 | 1.700 / 4 | 1.350 |
| C1b-1 | 90 | 750 / 1.500 | 300 / 234 | 900 | 10 | 2.820 / 8 | 1.620 |

C1b nach 30 Tagen: **82** Versuche mit fehlender Kaufkraft, **1** mit fehlender Ware. Nach 90 Tagen: **665** mit fehlender Kaufkraft, **1** mit fehlender Ware. Hier überschneiden sich die Gründe nicht: `234 + 665 + 1 = 900`. Erster Warenmangel Tick 144 bei 1.540 Kunden-ISK und null Wasser; erste Kaufkraftlücke Tick **31.536 = Tag21,9**, **14 ISK bei 33 vorhandenen Wasser**. Letzte Produktions-/Fracht-/Förderarbeit Tick 44.596. Beide Profile: zwei echte Ersatzminer zu je 600, keine freie Frachterhülle nach dem Kalenderverlust an Tag30. C1b-Spedition behält 2.150 ISK; Fremdkassen ersetzen keine fehlende Hülle.

Weltgeld bleibt in allen vier Läufen exakt **33.000 ISK**, Mint/Burn/Export null. Vollständige Kassen, Belege, Verluste und Hashes: [C1B1_MESSWERTE.json](data/C1B1_MESSWERTE.json). Diese Datei ist Ausgabe, keine zur Ergebnisproduktion gelesene Golden-Fixture.

## Prüfmethodik und tatsächlich ausgeführte Tests

```sh
# Node v22.23.4
C1B1_REPORT=/tmp/c1b1-results.json node tests/c1b-1-exaktes-c-wasser.test.mjs
node --test tests/*.test.mjs
```

Gezielt **8/8 Einzeltests**, 0 Fehler/Skips/Abbrüche. Vier Wirtschaftsläufe (beide Profile erst 30, dann 90 Tage) mit je vollständigem zweitem Replay: **345.600** unabhängig geprüfte Erstlauf-Minuten plus ebenso viele Replay-Minuten. Nach jeder Erstlauf-Minute separate Geld-/Waren-/Arbeits-/Reservegleichungen; an jedem Tag und zusätzlich Tick 1/61/101 Hashvergleich, Save/Load und Modulaudits, bei C1b jeweils der registrierte vollständige Gesamtaudit. Tag30 der 90-Tage-Läufe stimmt exakt mit dem 30-Tage-Vorlauf überein. Für C1b zusätzlich jeder Tagesplan mit exakt zehn Ereignissen und höchstens zehn Käufen geprüft.

Negative Tests: beidseitiger Profilwechsel, falscher Fingerprint, manipulierte Restarbeit, Arbeits-/Lohnzähler, zukünftiger Arbeitsbeleg, Kassen, Eigentümer, Waren, Reserven, doppelte/falsche Nachfragebelege, Fremd-/Mintprofil und beschädigtes JSON. Doppelter Förder-/Nachfrageaufruf im selben Tick scheitert vor weiterer Buchung; wiederholter Einkommensaufruf bezahlt keinen Lohn doppelt. Ein finanzierter erster Förderrest bleibt über Save/Load erhalten.

Der Test einer unfinanzierten zweiten Minute verwendet ausdrücklich eine **Fehlereinspeisung**: Nach einer echten bezahlten Minute wird die Minerkasse ohne Beleg geleert und das Geld nur zur Erhaltung der Weltgeldsumme auf ein anderes Konto gelegt. Der Gesamtloader weist diese manipulierte Fixture korrekt zurück. Der direkte Arbeitsaufruf muss trotzdem ohne neue Zahlung, Fortschritt oder Ware stoppen. Das ist kein als gültig ausgegebenes Armutsszenario. Die realen Kaufkraft-/Warenengpässe und der Stillstand werden dagegen ohne irgendwelche Eingriffe in den vier regulären Läufen nachgewiesen.

Vollständige lokale Repository-Regression und neue CI: Ergebnisse werden nach deren Abschluss hier ergänzt. Ein laufender/abgebrochener Job gilt nicht als bestanden.

Vorprüfung der Basis: #243 Head `e921fd29`, allgemeine [CI 42422575578](https://github.com/tobiasfranziskus/Check/actions/runs/42422575578) und gezielte [CI 42422575576](https://github.com/tobiasfranziskus/Check/actions/runs/42422575576) abgeschlossen erfolgreich. #245 Head `008728e1`: reine Dokumentation, **keine** PR-Workflowläufe am Head; statische Rechnung ist kein dynamischer Test. #246 Head `76880387`: gezielte [CI 42458982863](https://github.com/tobiasfranziskus/Check/actions/runs/42458982863) und allgemeine [CI 42458982846](https://github.com/tobiasfranziskus/Check/actions/runs/42458982846) abgeschlossen erfolgreich. Letztere hat sieben erfolgreiche Jobs und einen bedingt übersprungenen Geografiejob; der historische v10-Vergleich überspringt intern andere Regelversionen. Der ältere Abbruchbericht in #246 ist nicht die Head-CI.

## Verbleibende Unterschiede zum Referenzmodell C

- **Wartung/Verschleiß:** Weiter R32-Arbeitswartung 60 Minuten alle 20 Tage, keine Materialteile und keine C-Abschreibungs-/Kapitalrücklage. Hüllenverlust nach 15/30 Kalendertagen statt nutzungsbezogener Lebensdauer. Auch im Absatzstillstand kann Arbeitswartung stattfinden.
- **Hersteller/Retail:** Weiter eine kombinierte Stationskasse zum Endpreis 18. Kein separater Großhandel zu 16, keine Retailfirma, Retailarbeit/-wartung und getrennte Marge. Die direkten 620 ISK je 50 Wasser (250 Eis + 270 Fracht + 100 Fabriklohn) sind **keine C-Vollkosten**.
- **Hüllen/Start:** R32-Miner 600 und Frachter 750 statt C 1.340/1.690 plus Lieferung; endliches R32-Startlager, 33.000 statt 55.000 ISK. Kein Gründungsanbieter mit 22.280 ISK, keine neue C-Hüllenproduktion, keine kostenlose Nachfolge.
- **Geografie/Waren/Außennachfrage:** Bestehende Aldera–Nadir-Route; kein neues System, Meridian, Industrieexport, erneuerbarer Exportetat oder 19-Warenmodell. Der bestehende W5q-Pfad ist im registrierten Profil auf off/null festgelegt; kein zusätzlicher Mint- oder Rettungspfad.
- **Abnahmeumfang:** Nur Node-Forschung mit vollständigem Forschungsloader. Keine Integration in Produkt-UI oder Browser-Speicher; keine Safari-/iPad-/NAS-Abnahme. Keine neuen 365-/730-Tage-C-Versuche. Unabhängige Audits laufen nach Minuten/Checkpoints, kein universeller Einzelposting-Hook und keine kryptografische Save-Authentifizierung gegen kohärent neu erfundene ganze Historien.

Kein Merge oder Deployment. Main, produktive Spielstände, `index.html`, Roadmap und Projektstatus bleiben unangetastet.
