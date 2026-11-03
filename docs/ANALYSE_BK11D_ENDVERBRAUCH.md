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
