# C1d-3 – drei finanzierte Lagermodule in einer gemeinsamen Meridian-Fracht

**[DRAFT / FORSCHUNG · 08.11.2026]** Auf [C1d-2 / #255](https://github.com/tobiasfranziskus/Check/pull/255) aufbauender, eigenständiger Research-PR mit identischem autoritativem Core. **Keine produktive Freigabe:** `main` bleibt Regel14/Schema8, vorhandene Saves und GitHub Pages bleiben unverändert. Die 430-ISK-Emissionsregel aus C1d-2 ist in diesem neuen Forschungsprofil ausdrücklich **nicht aktiv**.

## Was tatsächlich funktioniert

Eine echte W3-Erzladung von **50 Stück** wird vollständig bezahlt nach Nadir gebracht, der Hin- **und Rückflug** findet statt. Aus diesem Erz werden über drei voneinander unabhängig beauftragte W4-Raffinerielose je `10 Erz → 4 Material` hergestellt. Derselbe bereits gekaufte Nadir-Miner fördert drei reale Siliziumlose nach jeweils **20 einzeln bezahlten Minuten für zwei Einheiten**. Drei W5b-Bauteillose `4 Material + 2 Silizium → 2 Bauteile` mit jeweils **16 bezahlten Fertigungsminuten** und anschließend drei W5b-Lagerlose `2 Bauteile → 1 Lagermodul` mit je **12 finanzierten Minuten** schließen die Produktion ab.

**Nicht** aus Startwaren oder künstlichen Warentransfers: `ledger.lager.initial=0`. Der vorhandene Frachter `sh002` fährt mit allen **drei** Lagermodulen nach Meridian, nicht mit drei erfundenen Einzelabrechnungen. Seine 60+60+120 Minuten werden vorfinanziert und ausgezahlt.

| Kennzahl (Seed 42 und 7) | Direkt im Core ausgeführt |
| --- | ---: |
| An Nadir geliefertes Erz | 50 |
| Davon raffiniert | 30 |
| Neu produziertes Material | 12 |
| Neu gefördertes Silizium | 6 aus 60 bezahlten Förderminuten |
| Neu erzeugte Bauteile | 6 aus 48 bezahlten Fabrikminuten |
| Drei fertige Lagermodule | **Tick 294** |
| Drei Lagermodule physisch in Meridian | **Tick 414** |
| Frachter mit bezahltem Rückflug in Aldera | **Tick 534** |
| Frachtkosten vom Hersteller | **300 ISK für alle drei** |
| Aus Speditionskapital vorfinanzierter Pilotenlohn | **240 ISK** |
| Neue ISK und extern ausgebuchte Ware | **0 / 0** |

Das bedeutet, dass die **Frachtrechnung pro geliefertem Modul von 300 ISK auf 100 ISK** sinkt, ohne einen zweiten Simulator, einen ersetzten Frachter oder kostenloses Personal. Die Forschungstarife 300 ISK für die eine Frachtfahrt, 430 ISK je Modul, 170 ISK je Bauteil und 1 ISK je Arbeitsminute sind weiterhin **[OPTION]**, keine freigegebenen Spielpreise.

## Finanzierbarkeit und gezielte Negativprüfung

Die Herstellerkasse (`house`) besitzt nach dem dritten real finanzierten Fertigmodul **540 ISK**. Davon sind für den gemeinsamen Frachtvertrag **300 ISK** verfügbar. Die übrigen 240 ISK Pilotenlohn kommen nachweislich aus dem bereits vorhandenen Speditionskapital.

Ein vierter Produktionsversuch wird **nicht künstlich durch den Forschungslimitwert verhindert**: Die Versuchsregel lässt bis zu vier Silizium-, Bauteil- und Lagerlose zu. Vierte Raffinerie-, Silizium- und Bauteilcharge werden mit echtem Geld ausgeführt; danach verfügt der Hersteller noch über **312 ISK**. Die vierte Endmontage verlangt aber 2 Bauteile × 170 + 12 Lohn = **352 ISK**. Der originale W5b-Core verweigert den Auftrag wegen **40 ISK unzureichendem vorhandenem Kapital**; Kassen, Waren und Zustandshash bleiben exakt unverändert.

Soll derselbe Hersteller zusätzlich die 300-ISK-Gesamtfracht der vier Module vorfinanzieren, ergibt sich zu diesem Zeitpunkt sogar eine **340-ISK-Finanzierungslücke** (352 + 300 − 312). Das darf weder durch ein Gratisdarlehen noch durch eine Vorab-Emission geschlossen werden. Ein echter Kapital-/Abnahmeauftrag mit eigenen Vertragsrechten wäre ein gesonderter Forschungs- und Produktentscheid.

Auch ein hypothetischer Batch von vier Modulen wäre nach den aktuellen Preisannahmen **noch kein Vollkostenbeweis**:

| Nur Bauteile + Endmontage + gemeinsamer Fracht | 3 Module | 4 Module (noch nicht produziert) |
| --- | ---: | ---: |
| Hypothetische externe Verkaufserlöse à 430 | 1.290 | 1.720 |
| Bauteile à 340 je Lagermodul | −1.020 | −1.360 |
| Lagermontage à 12 je Modul | −36 | −48 |
| Gemeinsame Frachtrechnung | −300 | −300 |
| **Differenz vor weiteren Kosten** | **−66** | **+12** |

Die Rechnung berücksichtigt **nicht** reale Erz-, Silizium- und Raffinerie-Vorleistungen, Anlagennutzung, Wartung, Schiffskapital, Ersatz und Eigentümerfinanzierung. Die 430-ISK-Endabnahme wird in diesem Profil *nicht durchgeführt*. Kein Gewinnversprechen und kein gesundes Gesamtwirtschaftssystem.

## Code, Sicherheitsgrenzen, Tests

- Forschungsprofil `aphros-research:C1d-3:three-paid-storage-freight-lot-v1`, separate **Regel 3308** und Save-Fingerprint; Regel 3307 aus #255 bleibt ein unveränderter, nur auf ein Modul ausgelegter Referenzversuch.
- Nur Opt-in im Original-`m_core_w5b` erhöht die möglichen Chargenzähler. Die Forschungsobergrenze vier ist eine **Test-Sicherheitsgrenze**, keine beschlossene Maximalzahl von Mining-Angeboten im Spiel. Ohne Opt-in bleiben die alten Maximalwerte unverändert.
- Nur Opt-in im Original-`m_core_c1d` erlaubt eine echte 3er-Fracht. Die ganze Serie nutzt **einmal** das bestehende Frachtkonto, einmal 240 tatsächlich bezahlte Flugminuten und einen kompletten Rückflug. Warenlager, Schiffsladung und Ledger bleiben jederzeit konsistent.
- Unabhängiger zusätzlicher Bundle-Audit prüft rückführbare Produktionszähler, Vorproduktverbrauch, ausgezahlte Arbeit, physischen Warenbestand und fehlende Emission/Exportbuchung. Bestehende Original-Core-/W3-/W4-/W5b-/C1d- und Forschungsaudits bleiben eingeschaltet.
- Eigene gezielte Tests `tests/c1d-3-mehrchargen-fracht.test.mjs`: sechs neue Fälle, zwei Seeds 42/7, Finanzierungsbarriere der vierten Charge, deterministischer Replay, Save/Load, Fremdware, fingierte Buchungen und Doppelmint-Gegenproben.
- **Direkter JavaScript-Forschungslauf dieser Arbeitssitzung:** Alle **6/6** neuen Tests erfolgreich. Das ist ein isolierter Core-Ausführungstest; **kein** als abgeschlossen deklarierter Node- oder GitHub-Gesamttest.
- GitHub-CI wird über den bestehenden Forschungsworkflow ausgeführt. Dessen [PR-Checks](https://github.com/tobiasfranziskus/Check/pull/256/checks) und die allgemeine Regression müssen unabhängig erfolgreich abschließen; eine Warteschlange ist kein grüner Test.

## Nächster Sachschritt

**C1d-4 [ANALYSE/OPTION]:** Nachweisbar vollständig finanzierten **Vorausauftrag** oder echten Kapitalvertrag für das vierte Modul und seine Fracht entwickeln, ohne neue ISK vor Leistung; danach vier real produzierte Module bündeln und erst bei korrekt begrenzter externer Abnahme ein mögliches Referenzsettlement untersuchen. Außerdem bleibt die erste Erzstufe noch im älteren R32-Abbautempo statt dem vorgeschlagenen C-Tempo (4 bezahlte Minuten pro Erz) – dies muss vor einer End-to-End-Modell-C-Gesamtwirtschaft korrigiert werden.

Keine automatische Produktentscheidung über Kredite, Zinsen, Exportraten oder Gewinnverteilung; keine Merges/Deployments.
