# v0.11.2 – Wirtschaft, Migration und Regressionen

Stand: 29.10.2026. Feature-Branch `feat/v0.11.2-wirtschaft`, Basis main `d53bf14`.
Keine Veröffentlichung, kein Merge. iPad Safari und NAS wurden nicht geprüft.

## Problem und Umsetzung

Die Seeds 7 und 11 verlieren ihre letzte mobile Handelsverbindung; Ersatz wird in treibstofflose Heimaten überführt. Die vorherige reine Werft-Startortregel verschob den Fehler nur und erzeugte andere Ausfälle. Der geprüfte Reserveversuch verwendet deshalb ein zusammenhängendes Betriebskonzept.

1. Pauschales Schutzgeld 80→0; Überfälle, Beute, Ersatzpreise und Kopfgelder unverändert.
2. Nur automatische NPC-Frachter (Besitzerart trader, Auftrag handeln) halten bis zu zwei bezahlte Einheiten in bestehender `ladung.treibstoff`. Auffüllen verwendet reguläre Preise, Gebühren, verfügbare Ware und Frachtraum. Entladen schützt die Reserve, verkauft Überschüsse; reine Reserve verhindert nicht die Aufnahme neuer Handelsaufträge. Abflug verbraucht Bordtreibstoff tatsächlich und bucht ihn im Warenledger. Routenplanung berücksichtigt Budget, Platz und erreichbare Versorgung über vorhandene Wege. Auch Ersatzüberführung wird bezahlt betankt; bei fehlendem Treibstoff/Geld bleibt das bereits bezahlte Schiff an der Werft im normalen Handelsauftrag. Heimat und Sollflotte bleiben unverändert.

`m_core_treibstoff` bündelt diese Regeln. Preise und Gebühren werden aus bestehenden Funktionen gelesen; die Vorschau verwendet lokale Bestandsansichten statt einer zweiten Preisformel. `treibstoffkosten` unterscheidet weiterhin Kapitalbedarf und Verbrauchswert. Spieler und manuelle Betankung behalten den alten Pfad. Keine zusätzliche KI, Datenfelder, parallelen Treibstoffkonten oder Abhängigkeiten.

## Kompatibilität

Schema bleibt 8, Regeln 7→8. Migration übernimmt ausschließlich die Regelnummer und erzeugt weder Waren noch Schiffe oder Geld. Alte Treibstofffracht bleibt regulärer Bestand; leere Reserven werden später nur bezahlt aufgefüllt. Ein mit dem unveränderten main-Core erzeugter Regel-7-Spielstand mitten auf Reise mit Treibstofffracht ist als Fixture enthalten. Migration, vollständige Datengleichheit außer Regelnummer, deterministische Fortsetzung und Save/Load wurden geprüft. Schema-7- und Regel-6-Ketten bleiben getestet; zukünftige Formate/Regeln werden abgelehnt.

Die Migration verspricht keine automatische Rettung bereits vollständig gestrandeter Welten ohne erreichbare Ware.

## Tatsächlich ausgeführte Prüfungen

Node v22.23.4, Baseline vor Änderungen: 32 bestanden. Final: **40 bestanden, 0 fehlgeschlagen, 0 übersprungen**.

Zusätzliche Tests: Reserveschutz, Verkauf einschließlich einzelner Treibstoffeinheit, Gebühren-/Plangenauigkeit, Bordverbrauch, Abflug bei leerem Stationslager, fehlende Kaufkraft ohne Zustandsmutation, voller Frachtraum, manuelle Spielerbetankung, regulär bezahlter Ersatz inklusive Reise und korrekter Sollzählung, Regelmigration 7→8 mit realem Altstand und Save/Load.

13 Seeds, 90 Tage, keine Spielerbefehle: jeder Lauf wird instrumentiert und ohne Instrumentierung wiederholt; Audits stündlich, Hashes bei 3/30/90 Tagen, finaler Save/Load-Roundtrip. Echte NPC-Verkäufe zählen ohne Reservekäufe/Betankung. Ergebnis: **0/13 anhaltende Gesamtblockaden, Median 331 Mangelstunden, Maximum 361, Median 21.010 Verkäufe**. Die simulierten Waren-/Geldverläufe stimmen mit dem R=2-Versuch überein.

Die Referenzen wurden **vor** dem Vergleich mit der Implementierung unabhängig aus dem archivierten Prototyp ermittelt. Dessen Zustände mit Regelnummer 7 wurden zuerst gegen alle alten 13-Seed-Versuchshashes geprüft. Danach wurde ausschließlich die gespeicherte Regelnummer auf 8 umgestellt. Neue Roh-Hashes unterscheiden sich dadurch erwartungsgemäß von den alten Experiment-Hashes; beide stehen in `tests/fixtures/economy-v8.json`. Es wurden keine Referenzen nachträglich zum Beheben einer Abweichung verändert.

Historische Drei-Tages-Hashes (v0.11.1, Regeln 7, Schutzgeld 80, keine Reserve) bleiben dokumentiert:

| Seed | Historischer Hash |
|---:|---|
| 42 | `83c525ce00a82e1f` |
| 1234 | `ddbff4ee4451d56d` |
| 98765 | `beb70fdb280d85ba` |

## 90-Tage-Ergebnisse der Implementierung

Mangel = summierte Stations-/Warenstunden; Zeiten inklusive Wiederholung, ohne Prozessstart. Kein kontrollierter Benchmark.

| Seed | Mangel | Echte NPC-Verkäufe | Längste Gesamtblockade | Hash Regeln 8 | Sekunden |
|---:|---:|---:|---:|---|---:|
| 7 | 337 | 20663 | 0 | `0fb91851e677fd65` | 7.80 |
| 11 | 331 | 21074 | 0 | `be6bd45c6d74e508` | 7.55 |
| 1 | 346 | 20872 | 0 | `c403b37ef949ced1` | 7.15 |
| 2 | 309 | 21173 | 0 | `e6267eb9dd66d9b3` | 7.15 |
| 65535 | 285 | 21118 | 0 | `048a51935e21c828` | 7.15 |
| 42 | 275 | 21253 | 0 | `5dec20b4956c7f0a` | 7.05 |
| 1234 | 346 | 20919 | 0 | `fdeced93b01aedb8` | 6.96 |
| 98765 | 289 | 21182 | 0 | `d24da94491e1d894` | 7.31 |
| 3 | 346 | 21105 | 0 | `d12a26fbcec98de9` | 7.24 |
| 99 | 340 | 20991 | 0 | `539796a9c571f0b6` | 7.34 |
| 2024 | 313 | 20984 | 0 | `270f942e7b89f604` | 7.10 |
| 2025 | 361 | 20938 | 0 | `34ba8d3f9d5aaa9e` | 7.13 |
| 314159 | 318 | 21010 | 0 | `ef8f7d0dc3feb36e` | 7.11 |

## Reproduktion

```sh
node --test tests/*.test.mjs
node tools/economy-simulation.mjs
```

Beide Befehle im Repository mit Node 22, keine Installation erforderlich. Der Langlauf gehört bewusst nicht zum kurzen UI-Testlauf; er ist explizit auszuführen. Fixture und Skript sind im PR enthalten, keine absoluten Workspacepfade erforderlich.

## Auswirkungen und Restrisiken

Die Experimentdaten zeigen höhere Transportaktivität und teilweise mehr Piratenkontakte/Ersatzbedarf. Die mediane gehandelte Treibstoffmenge sinkt gegenüber der alten Logistik, während Versorgungsmangel abnimmt. Gezielte Reserveausgaben sind Vorauszahlungen, keine isoliert zurechenbaren Netto-Mehrkosten. Kopfgelder bleiben unverändert, weniger Schutzgeld verändert aber Piratenfinanzierung und Jagdchancen.

13 feste Seeds sind keine repräsentative Stichprobe, 90 Tage kein Nachweis unbegrenzter Stabilität. Routen prüfen aktuell vorhandene Zielversorgung, reservieren sie aber nicht gegen konkurrierenden Verbrauch. Unfinanzierbare Reservekäufe sind möglich und dürfen keine kostenlosen Waren erzeugen. Echte iPad-Safari-/NAS-Abnahme, breitere Seeds, längere Horizonte und aktive Spielerstrategien unter den integrierten Regeln bleiben offen.
