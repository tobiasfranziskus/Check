# B-K11d – Realer ziviler Endverbrauch, Warenherkunft und Zahlungsbruch

**[ANALYSE/DRAFT · 03.11.2026]** Eigenständiger Branch direkt auf `main b4e604d6` (v0.12.5, Regel14/Schema8). Keine Änderungen an `index.html`, Regeln, Geldemission, Preisen, Warenmengen, Saveformat oder Spielständen. Nur testseitige lesende Core-Instrumentierung.

## Fragestellung

B-K11c [#140](https://github.com/tobiasfranziskus/Check/pull/140) belegt in zwei aktiven Seed42-Welten, dass Rückgabe bereits vorhandener Spieler-ISK an den Aldera-Fonds Versorgung und realen Frachterersatz wieder ermöglicht. **Die Rückgabe ist keine freigegebene Produktregel**, denn der Spieler muss unbegrenzt sparen dürfen. B-K11d misst daher ausschließlich, welche nachweisbaren zivilen Leistungen im unveränderten Spiel wirklich stattfinden und welcher Zahlungsweg fehlt.

Der vorhandene Original-Core hat drei getrennte Buchungen:

1. **Stationseinkauf:** Eine erfolgreiche `m_core_handel.handel`-Verkaufstransaktion überträgt wirklich Waren an die Station und vorhandene ISK von der Stationskasse an den Frachtereigentümer. Die Handelsgebühr ist ein gesonderter Transfer.
2. **Reale Endverwendung:** `m_core_stunde.verbrauch` bucht stündlich tatsächlich vorhandene `nahrung` und `medikamente` aus Stationslager und Warenledger ab, **ohne Geldzahlung**. Fehlmengen erzeugen keine verbrauchten Einheiten und werden gesondert als Mangelstunden gezählt.
3. **Lokale Produktion:** `m_core_produktion.produktion` stellt bei fertig gewordenen Rezepten Ware her; das Original bucht dafür **keinen Arbeitslohn**. `m_core_stunde.aussenhandel` verändert Import-/Exportgüter ohne entsprechende ISK-Buchung. Endverbrauchszahlungen sind somit nicht mit vorherigen Warenankäufen, kostenloser Fabrikarbeit oder Importen zu verwechseln.

## Messung und strenge Herkunftsaussage

Drei **unveränderte Produktwelten** mit Seed42: passiv, Spieler Miner, Spieler Miner plus automatischer Frachter, jeweils 90 Spieltage. Aktive Spielerbefehle sind die Original-B-K11c-Befehle. Für die beiden aktiven Fälle muss der jeweilige Original-Endhash aus B-K11c reproduziert werden.

Das Entwicklungswerkzeug `tools/bk11d-endverbrauch.mjs` hängt **nur lesende** Beobachter an die vorhandenen erfolgreich durchlaufenen Produktions-, Stationskauf- und Verbrauchsoperationen. Der unabhängig und ohne Beobachter ausgeführte Original-Core muss stündlich denselben Zustand und Hash ergeben. Zusätzlich: unabhängige Geld- und Warenbilanz, native Auditprüfung und tägliche Save/Load-Roundtrips.

**Audit-Falle im Originalledger:** `state.ledger[ware].consumed` umfasst bei `nahrung`/`medikamente` außer dem **zivilen Stationsverbrauch** auch **beim Schiffverlust vernichtete Fracht** (`m_core_sicherheit.entfernen/zerstoeren`). Diese darf niemals als geleistete zivile Endnachfrage vergütet werden. Der Beobachter zählt die beiden konkreten Vernichtungsstellen getrennt und fordert stündlich `ledger.consumed = zivil_verbraucht + fracht_vernichtet`. Der erste 90-Tage-CI-Anlauf scheiterte korrekt an dieser zuvor nicht erkannten Unterscheidung und war **kein bestandener Test**.

**Warenherkunft wird nicht erfunden:** Altbestände, Importe und neu produzierte Waren sind im echten `state.stations.lager` fungibel, es existiert **kein chargenscharfer Herkunftsbeleg**. Für jede Ware gilt deshalb als strikt globale Untergrenze der später tatsächlich verbrauchten neuen Produktion:

`garantiert_neu_verbraucht_min = max(0, tatsächlich_verbraucht - Anfangsbestand - importiert)`

Als obere Grenze gilt `min(tatsächlich_verbraucht, lokal_produziert)`. Export, gebundene Lagerbestände und die regionale Verteilung können den tatsächlich möglichen Weg beeinflussen; eine echte Vergütungsregel bräuchte die Herkunft und die reale Leistung pro Auszahlung gesondert belegt. Auch wenn ein Wert innerhalb des Intervalls liegt, hat das Spiel heute **keine** zivilen Endverbrauchszahlungen verbucht.

Der Reporter trennt pro Station und Ware: tatsächlich produzierte und verbrauchte Einheiten, erfolgreiche **bezahlte** Frachterverkäufe, Stationskassen, globale Bargeld- und Materialbilanz, reale Mangelstunden. `Basiswert × Verbrauch` ist höchstens eine **unbezahlte nominelle Leistungsbewertung**, keine ISK-Forderung, kein Zahlbetrag und keine Emissionsregel.

## Geplanter Testumfang

- 3 Welten ×90 Tage = 6.480 stündliche unabhängige Geld-/Waren- und Original-Hash-Abgleiche
- 540 tägliche Save/Load-Roundtrips, 270 Tageshashes
- 1-Tages-Smoke für alle drei Szenarien in einem Node-Test
- Historische Produkt-Endhashes der aktiven Spielerwelten aus B-K11c: Miner/42 `f733a993164a5e4f`, Handel-Flotte/42 `3a2df2b5d77d2e9e`

**Ergebnisse erst nach tatsächlich erfolgreicher CI eintragen.** Der kleine Nachweis ist keine 13-Seed-Abnahme einer Produktregel.

## Entscheidung nach Messung

Wenn passive Welten umfangreiche reale zivile Leistungen produzieren und verbrauchen, während aktive Welten früh versiegen, belegt dies sowohl einen möglichen Leistungsanker als auch die Gefahr der prozyklischen Vergütung: **Bei stillstehender Produktion oder leerem Lager gibt es keine Leistung und daher auch keine neue ISK.** Damit sind einmalige Startkaufkraft, Zahlungsmittelumlauf, Arbeit und Vermarktung vor Produktfreigabe getrennt zu dimensionieren.

**Nicht freigegeben:** eine neue ISK-Emissionsregel, ein bestimmtes Tagesbudget, eine Rückgabe von Spielerersparnis, künstliche zahlende Haushalte, neuer ziviler Fonds oder garantierte Liquiditätsstütze. Die Roadmap enthält bereits H1-P0 als **Option**, nicht als integrierte Regel. Konkrete Emission und Produktumsetzung benötigen eine gesonderte Nutzerentscheidung. Kein Merge und kein Deployment.

## Ausgeführtes Ergebnis [TEST] · 03.11.2026

**B-K11d-CI [#41582136747](https://github.com/tobiasfranziskus/Check/actions/runs/41582136747) erfolgreich** auf Codecommit `019c667c`: 1/1 Ein-Tages-Smoke und drei 90-Tage-Produktwelten, jeweils mit zweitem unabhängigen Original-Core. **6.480** stündliche unabhängige Geld-/Warenaudits und Original-Hash-Replays, **540** Save/Load-Roundtrips. Die beiden aktiven 90d-Endhashes stimmen exakt mit der B-K11c-Produktkontrolle überein. Die reguläre allgemeine Regression wird separat ausgewiesen.

| Original-main, Seed42 ×90 Tage | Passiv | Aktiver Miner | Miner + Auto-Handel |
| --- | ---: | ---: | ---: |
| Tatsächlicher ziviler Nahrungsverbrauch | **36.602** | 3.473 | 2.573 |
| Tatsächlicher ziviler Medikamentenverbrauch | **12.960** | 879 | 751 |
| Untergrenze Nahrungsverbrauch aus neuer Produktion | 35.772 | 3.083 | 2.197 |
| Untergrenze Medizinverbrauch aus neuer Produktion | 12.260 | 587 | 473 |
| Lokale Nahrungsproduktion | 37.929 | 3.365 | 2.435 |
| Lokale Medizinproduktion | 13.364 | 735 | 612 |
| **Vernichtete Fracht Nahrung / Medizin (kein Endverbrauch!)** | **10 / 0** | **1 / 1** | **4 / 0** |
| **Zahlung beim zivilen Endverbrauch** | **0 ISK** | **0 ISK** | **0 ISK** |
| Tatsächlich bezahlter Stationseinkauf Nahrung, ISK | 2.108.995 | 177.041 | 117.866 |
| Tatsächlich bezahlter Stationseinkauf Medizin, ISK | 9.185.038 | 299.895 | 206.385 |
| Endstand Stationskassen insgesamt, ISK | 22.451 | 5.238 | 4.317 |
| Spieler-Endkasse, ISK | 2.000 | 42.795 | 42.254 |
| NPC1/2-Händlerkassen, ISK | 12.000 | 132 | 0 |
| NPC1/2-Frachter am Ende | **5** | 0 | 0 |
| Mangelstunden | **58** | 35.798 | 36.393 |

**Ab Tag 14** sind die zwei aktiven Krisen bereits bei **0 NPC1/2-Frachtern** und haben zu diesem Zeitpunkt schon ihre finalen 90-Tage-Mengen für Nahrung und Medizin vollständig verbraucht: der zivile Warenkreislauf bleibt ab diesem Punkt stehen. Im passiven Originalkern laufen lokale Produktion und Verbrauch für die 90 Tage weiter. Das zeigt sowohl die theoretische Grundlage einer echten Leistung als auch die **Leistungsstarre im Krisenfall**.

**[ANALYSE] Keine doppelte Vergütung:** Die kumulierten bezahlten Stationsankäufe von Nahrung und Medizin sind bereits echte Zahlungen und dürfen nicht als weitere bisher fehlende Handelsumsätze dargestellt werden. Ausschließlich die spätere tatsächliche zivile Verwendung wird im Original nicht zusätzlich bezahlt. Auch die großen Umsätze sind keine neue Geldmenge und keine Netto-Unternehmensgewinne. Frachtverluste (10/0, 1/1 und 4/0) sind endgültig von zivilem Verbrauch abzugrenzen.

**[ANALYSE] Prozyklische Emission als eigenständiges Risiko:** Eine rein nachträgliche leistungsgebundene Verbraucherzahlung erzeugt bei 0 tatsächlichem Verbrauch keinerlei neue ISK. Sie kann daher ohne zahlungsfähigen Käufer, nachweislich finanzierbare Produktion und reale Transportkapazität nicht allein die nach 14 Tagen bereits festgefahrene Wirtschaft reaktivieren. Es ist **noch nicht belegt**, welche Anlaufkette oder welcher Geldmodell-B-Betrag unter unbegrenztem Spielersparen tragfähig wäre. Die nominellen Basispreise je Endverbrauchseinheit bleiben ein **Wertgewicht**, niemals ein genehmigter Zahlungssatz.

**[NÄCHSTES GATE]** Zuerst den kleinsten vollständig finanzierbaren zivilen Produktions-/Handels-/Verbrauchskreislauf einschließlich Auftragsfinanzierung und seinem Zahlungsberechtigten quantifizieren; alternativ echten Endkundenexport aus real **neu erzeugter und nachweislich abgelieferter** Ware. Keine neue ISK-Emission, keine gratis Waren/Fabrikarbeit, keine Spieler-Sparbegrenzung und keine individuellen Konkursgarantien ohne getrennte Produktentscheidung. #140/#141 bleiben nicht integriert.
